import { Clase } from 'src/app/interfaces/clase';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Personaje } from 'src/app/interfaces/personaje';
import type { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import type { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { PersonajeCreateNivelDto, PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CAUSAS_DE_PERDIDA, CausaPerdidaDto } from 'src/app/interfaces/sesiones';
import { textoAtaqueBase } from './ataque-base';
import { modificadorCaracteristica, NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { daDgEnNivel, daIncrementoPorNivelDePersonaje, filaDeNivel } from './clase-niveles';
import { CARACTERISTICAS_DEL_ALTA, caracteristicaDelAlta, sacarDoteDeLaFicha, sacarPrimero } from './correccion-ficha';
import { bajaDeNivel, experienciaParaNivel } from './experiencia-nivel';
import { claveDeDote, extraComparable, mismoExtra, primerEntero, toInt } from './normalizacion';
import { aplicarLoQueDanLasDotes, modConstitucionDeEntrada, pgDeUnDgGuardado, pgTrasCambioDeCon } from './subida-nivel';
import { nombreDoteConExtra, tieneTextoVisible } from './texto-visible';
import { origenDeNivelDeClase } from './niveles-creacion';

/*
 * Perder un nivel con el personaje ya creado (roadmap de sesiones, fase 7, segunda tanda; guía
 * `docs/publica/SESIONES_FRONT.md`, «Perder un nivel»): la web parte de la `entrada` de la sesión abierta y manda a
 * `POST /personajes/{id}/niveles/perdida` esa ficha sin lo del nivel que pierde. Como la corrección, lo que se quita se
 * quita de la `entrada` (así no se pierde nada de lo que el motor no sabe leer de la ficha): lo que se eligió en ese nivel
 * (su registro, `niveles[i].elecciones`) y lo que da su clase en ese nivel (el ataque base, las salvaciones, los PG del
 * DG). Reglas: *Guía del DM*, pág. 295, «Pérdida de nivel», y el dictamen del máster de Rol, en el roadmap.
 */

export type CausaPerdida = CausaPerdidaDto;

/** El texto de cada causa en la web. */
const TEXTO_CAUSA: Readonly<Record<CausaPerdida, string>> = {
    revivir: 'Volver a la vida (revivir a los muertos, resurrección, reencarnar)',
    nivel_negativo: 'Un nivel negativo que se hace permanente',
    plantilla: 'El coste de una plantilla (el necropolita)',
    experiencia: 'Pierde PX que le bajan de nivel (la muerte de su familiar)',
    otro: 'Otra causa',
};

/** Las causas que ofrece la web (las de la API, `CAUSAS_DE_PERDIDA`, que las valida: `causa`), con su texto. */
export const CAUSAS_PERDIDA: ReadonlyArray<{ valor: CausaPerdida; texto: string; }> =
    CAUSAS_DE_PERDIDA.map((valor) => ({ valor, texto: TEXTO_CAUSA[valor] }));

/**
 * Los PX tras perder `perdidos` (la causa `experiencia`: el familiar muerto, MJ pág. 45): los que le quedan, sin bajar de 0
 * y sin punto medio, y si le bajan del nivel que le dan sus PX (si no, no pierde un nivel: son PX gastados). Con
 * `perdidos` 0, el siguiente nivel de una pérdida que baja varios (lo comprueba la API).
 */
export function pxTrasPerderExperiencia(px: number, perdidos: number): { px: number; bajaNivel: boolean; } {
    const actuales = Math.max(0, toInt(px));
    const quedan = Math.max(0, actuales - Math.max(0, toInt(perdidos)));
    return { px: quedan, bajaNivel: toInt(perdidos) === 0 || bajaDeNivel(actuales, quedan) };
}

/**
 * La ficha con las dotes de `claves` marcadas sin sus prerrequisitos (`sinPrerrequisitos`): las conserva sin poder usarlas
 * hasta que vuelva a cumplirlos (*Manual del jugador*, pág. 87); no es homebrew. `quitar`, las que ya cumple otra vez.
 */
export function marcarDotesSinPrerrequisitos(
    ficha: PersonajeCreateRequestDto,
    claves: ReadonlyArray<{ idDote: number; idExtra: number; origen?: string; }>,
    quitar: ReadonlyArray<{ idDote: number; idExtra: number; origen?: string; }> = [],
): PersonajeCreateRequestDto {
    const es = (d: any, c: { idDote: number; idExtra: number; origen?: string; }) => toInt(d?.idDote) === toInt(c.idDote)
        && toInt(d?.idExtra) === toInt(c.idExtra) && (c.origen === undefined || `${d?.origen ?? ''}` === `${c.origen}`);
    const dotes = (ficha.colecciones?.dotes ?? []).map((d: any) => {
        if (claves.some((c) => es(d, c)))
            return { ...d, sinPrerrequisitos: true };
        if (d?.sinPrerrequisitos && quitar.some((c) => es(d, c))) {
            const { sinPrerrequisitos: _quitada, ...resto } = d;
            return resto;
        }
        return d;
    });
    return { ...ficha, colecciones: { ...(ficha.colecciones ?? {}), dotes } } as PersonajeCreateRequestDto;
}

/**
 * Las dotes de la ficha (`dotes`, sus `colecciones.dotes`) que conservaba sin sus prerrequisitos (`sinPrerrequisitos`) y
 * vuelven a cumplirlos: no están entre las que el motor da sin ellos (`siguenSin`, `dotesSinSusPrerrequisitos`), con -1 y 0
 * de extra como el mismo. Vuelven a valer (*Manual del jugador*, pág. 87): son el `quitar` de `marcarDotesSinPrerrequisitos`.
 * La subida de nivel y la vuelta a la vida.
 */
export function dotesQueVuelvenACumplir(dotes: any[] | undefined, siguenSin: ReadonlyArray<{ idDote: unknown; idExtra: unknown; }>)
    : Array<{ idDote: number; idExtra: number; origen: string; }> {
    const clave = (d: { idDote: unknown; idExtra: unknown; }) => claveDeDote(d.idDote, d.idExtra);
    const siguen = new Set(siguenSin.map(clave));
    return (dotes ?? []).filter((d: any) => d?.sinPrerrequisitos && !siguen.has(clave(d)))
        .map((d: any) => ({ idDote: toInt(d.idDote), idExtra: toInt(d.idExtra), origen: `${d.origen ?? ''}` }));
}

/** Los puntos de Constitución que pierde, con un solo DG, al volver a la vida (*Manual del jugador*, pág. 171). */
export const CONSTITUCION_PERDIDA = 2;

/** La mitad entre el mínimo del nivel y el del siguiente (tabla 3-2 del MJ): 500 a nivel 1, 8.000 a nivel 4. */
export function puntoMedioDelNivel(nivel: number): number {
    const n = Math.max(1, toInt(nivel));
    return Math.floor((experienciaParaNivel(n) + experienciaParaNivel(n + 1)) / 2);
}

/** Los PX tras perder un nivel, con `nivel` el de después: el punto medio o los suyos, si ya tenía menos. Como la API. */
export function pxTrasPerder(px: number, nivel: number): number {
    return Math.min(Math.max(0, toInt(px)), puntoMedioDelNivel(nivel));
}

/** El índice en `niveles` del nivel que se pierde: el último que ganó o, con el orden por conocer, el último de `idClase`. */
export function indiceDelNivelQueSePierde(niveles: PersonajeCreateNivelDto[] | undefined, idClase: number | null): number | null {
    const lista = niveles ?? [];
    if (lista.length < 1)
        return null;
    if (ordenConocido(lista[lista.length - 1]))
        return lista.length - 1;
    return indiceDelUltimoNivelDeLaClase(lista, toInt(idClase));
}

/**
 * El índice en `niveles` del último nivel de `idClase`: el de más nivel de clase (con el orden por conocer, el que se
 * guardó así); `null` si no tiene ninguno. Lo usan la pérdida con el orden por conocer (`indiceDelNivelQueSePierde`) y la
 * vuelta a la vida, que quita así uno a uno los niveles de la clase de monstruo, del último al 1.º.
 */
export function indiceDelUltimoNivelDeLaClase(niveles: PersonajeCreateNivelDto[] | undefined, idClase: number): number | null {
    const lista = niveles ?? [];
    let indice: number | null = null;
    lista.forEach((n, i) => {
        if (toInt(n?.idClase) === toInt(idClase) && (indice === null || toInt(n.nivelClase) >= toInt(lista[indice].nivelClase)))
            indice = i;
    });
    return indice;
}

/** Si se sabe el orden de ese nivel (las fichas de antes del historial lo tienen por conocer). */
export function ordenConocido(nivel: PersonajeCreateNivelDto | undefined): boolean {
    return (nivel as any)?.ordenConocido !== false;
}

export interface DatosPerdida {
    entrada: PersonajeCreateRequestDto;
    /** El índice del nivel que pierde en `entrada.niveles` (`indiceDelNivelQueSePierde`). */
    indice: number;
    /** Su clase, del catálogo (las tablas de nivel: ataque base, salvaciones, dotes y aptitudes; el libro de conjuros). */
    clase: Clase | null;
    /** Las caras del DG de ese nivel (las de su clase o las de una plantilla que actualiza los DG). */
    caras: number;
    /** Sus DG antes de perderlo (el nivel de personaje): con ellos se sabe si el DG que pierde daba incremento o dote. */
    dgsAntes: number;
    /** Sin su registro (orden por conocer): la característica que pierde el incremento (por defecto, la más alta). */
    incrementoSinRegistro?: number | null;
    /** Sin su registro: la dote que pierde por el DG, si lo daba (la elige el jugador). */
    doteSinRegistro?: { idDote: number; idExtra: number; origen: string; } | null;
}

/**
 * La dote de `dotes` (las `DotesContextuales` del personaje) con ese id y ese extra o, si no la tiene, la primera con ese
 * id. La usan los nombres de «Lo que pierde» (`nombresDeLaFicha`) y el motor al quitar las dotes del nivel perdido
 * (`NuevoPersonajeService.quitarDotePorId`).
 */
export function doteContextualPorId(dotes: ReadonlyArray<DoteContextual> | null | undefined, idDote: number, idExtra: number)
    : DoteContextual | undefined {
    const lista = dotes ?? [];
    return lista.find((d) => toInt(d?.Dote?.Id) === toInt(idDote) && toInt(d?.Contexto?.Id_extra) === toInt(idExtra))
        ?? lista.find((d) => toInt(d?.Dote?.Id) === toInt(idDote));
}

/** Una fila de «Lo que pierde»: qué, antes, ahora. */
export interface FilaPerdida {
    que: string;
    antes: string;
    ahora: string;
}

/** Los nombres de lo que tiene la ficha (para «Lo que pierde»), de su ficha y de los catálogos del motor. */
export interface NombresDeLaFicha {
    dote(idDote: number, idExtra: number): string;
    aptitud(idEspecial: number): string;
    conjuro(idConjuro: number): string;
    idioma(idIdioma: number): string;
    dominio(idDominio: number): string;
    /** La habilidad con su extra y los rangos que tiene. */
    habilidad(idHabilidad: number, idExtra: number): { nombre: string; rangos: number; };
    /** La característica del incremento (1 Fuerza … 6 Carisma) con su puntuación. */
    caracteristica(id: number): { nombre: string; valor: number; };
}

/**
 * Las filas de «Lo que pierde» con lo que quita el nivel, sin el nivel, el NEP, los PX ni los PG (que pone quien llama):
 * el ataque base, las salvaciones de clase, el incremento, las dotes, las aptitudes, los conjuros conocidos (y el que
 * vuelve), los idiomas, los dominios y los rangos. La usan perder un nivel y la conversión en muerto viviente.
 */
export function filasDelNivelPerdido(resultado: ResultadoPerdida, nombres: NombresDeLaFicha): FilaPerdida[] {
    const filas: FilaPerdida[] = [];
    if (resultado.ataqueBase.antes !== resultado.ataqueBase.despues)
        filas.push({ que: 'Ataque base', antes: resultado.ataqueBase.antes, ahora: resultado.ataqueBase.despues });
    Object.entries(resultado.salvaciones).filter(([, d]) => toInt(d) !== 0)
        .forEach(([s, d]) => filas.push({ que: `${s.charAt(0).toUpperCase()}${s.slice(1)} (de clase)`, antes: '', ahora: `−${d}` }));
    const q = resultado.quitado;
    if (q.incremento !== null) {
        const c = nombres.caracteristica(q.incremento);
        filas.push({ que: `${c.nombre} (incremento)`, antes: `${c.valor}`, ahora: `${c.valor - 1}` });
    }
    const lista = (que: string, lista: string[]) => lista.length > 0 && filas.push({ que, antes: lista.join(', '), ahora: '—' });
    lista('Dotes', q.dotes.map((d) => nombres.dote(d.idDote, d.idExtra)));
    lista('Aptitudes', q.especiales.map((e) => nombres.aptitud(e.idEspecial)));
    lista('Conjuros conocidos', q.conjuros.map((c) => nombres.conjuro(c.idConjuro)));
    if (q.vuelven.length > 0)
        filas.push({ que: 'Vuelve a conocer', antes: '—', ahora: q.vuelven.map((c) => nombres.conjuro(c.idConjuro)).join(', ') });
    lista('Idiomas', q.idiomas.map((id) => nombres.idioma(id)));
    lista('Dominios', q.dominios.map((id) => nombres.dominio(id)));
    q.rangos.forEach((r) => {
        const h = nombres.habilidad(r.idHabilidad, r.idExtra);
        filas.push({ que: `Rangos de ${h.nombre}`, antes: `${h.rangos}`, ahora: `${h.rangos - r.rangos}` });
    });
    return filas;
}

export interface QuitadoPorPerdida {
    dotes: Array<{ idDote: number; idExtra: number; }>;
    especiales: Array<{ idEspecial: number; idExtra: number; }>;
    idiomas: number[];
    dominios: number[];
    conjuros: Array<{ idConjuro: number; idClase: number; }>;
    /** Los conjuros que vuelven: el que olvidó en el intercambio de ese nivel. */
    vuelven: Array<{ idConjuro: number; idClase: number; }>;
    rangos: Array<{ idHabilidad: number; idExtra: number; rangos: number; }>;
    /** La característica que baja el incremento (1 Fuerza … 6 Carisma) o `null`. */
    incremento: number | null;
}

/** Nada quitado: el punto de partida de `fichaSinElNivel` y lo que pierde quien pierde Constitución en lugar del nivel. */
export function quitadoVacio(): QuitadoPorPerdida {
    return { dotes: [], especiales: [], idiomas: [], dominios: [], conjuros: [], vuelven: [], rangos: [], incremento: null };
}

export interface ResultadoPerdida {
    ficha: PersonajeCreateRequestDto;
    quitado: QuitadoPorPerdida;
    pg: { antes: number; despues: number; exacto: boolean; };
    ataqueBase: { antes: string; despues: string; };
    /** Lo que baja cada salvación de clase. */
    salvaciones: Partial<Record<'fortaleza' | 'reflejos' | 'voluntad', number>>;
    /** Lo que la web no sabe quitar y conviene revisar con «Corregir la ficha». */
    avisos: string[];
}

const SALVACIONES = [['fortaleza', 'Fortaleza'], ['reflejos', 'Reflejos'], ['voluntad', 'Voluntad']] as const;

/** La característica más alta de la ficha (1 Fuerza … 6 Carisma; empate, la primera), sin las perdidas. */
export function caracteristicaMasAlta(entrada: PersonajeCreateRequestDto): number {
    let mejor = 0;
    let valor = -Infinity;
    CARACTERISTICAS_DEL_ALTA.forEach(([clave], i) => {
        const c = (entrada.caracteristicas as any)?.[clave];
        if (c && !c.perdido && toInt(c.valor) > valor) {
            valor = toInt(c.valor);
            mejor = i + 1;
        }
    });
    return mejor;
}

/**
 * La ficha sin el nivel que pierde (ver arriba): un nivel menos en su clase, sin su registro, sin lo que se eligió en él
 * (dotes, aptitudes, idiomas, dominios, conjuros conocidos —salvo los de una clase con libro: el mago conserva lo que
 * escribió—, rangos, incremento y aumentos de lanzador; vuelve el conjuro que olvidó en su intercambio) y sin lo que da su
 * clase a ese nivel (el ataque base, las salvaciones de clase y los PG de su DG, con la Constitución retroactiva si el
 * incremento era suyo). Sin su registro (orden por conocer), lo de la *Guía del DM*: el incremento, de la característica
 * más alta; los rangos, de las habilidades con más; las dotes y las aptitudes de la tabla de su clase y la dote elegida.
 */
export function fichaSinElNivel(datos: DatosPerdida): ResultadoPerdida {
    const entrada = datos.entrada;
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    const nivel = (entrada.niveles ?? [])[datos.indice];
    const idClase = toInt(nivel?.idClase);
    const nivelClase = toInt(nivel?.nivelClase);
    const clase = datos.clase;
    const conRegistro = ordenConocido(nivel);
    const avisos: string[] = [];
    const quitado = quitadoVacio();
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    ['dotes', 'especiales', 'idiomas', 'dominios', 'conjurosConocidos'].forEach((k) => col[k] = [...(col[k] ?? [])]);
    col.habilidades = { ...(col.habilidades ?? {}), base: (col.habilidades?.base ?? []).map((h: any) => ({ ...h })) };

    // Las clases y los niveles.
    ficha.niveles = (entrada.niveles ?? []).filter((_, i) => i !== datos.indice).map((n) => ({ ...n }));
    col.clases = (col.clases ?? []).map((c: any) => ({ ...c, nivel: toInt(c.idClase) === idClase ? toInt(c.nivel) - 1 : toInt(c.nivel) }))
        .filter((c: any) => toInt(c.nivel) > 0);

    const quitarDote = (idDote: number, idExtra: number, origen?: string | null) => {
        // Una ficha de antes puede guardarla con otro extra: en último caso, la primera con ese id.
        if (sacarDoteDeLaFicha(col.dotes, idDote, idExtra, origen, { cualquierExtra: true }))
            quitado.dotes.push({ idDote, idExtra });
    };
    const quitarEspecial = (idEspecial: number, idExtra: number) => {
        if (sacarPrimero(col.especiales, (x: any) => toInt(x?.idEspecial) === idEspecial && toInt(x?.idExtra) === idExtra)
            || sacarPrimero(col.especiales, (x: any) => toInt(x?.idEspecial) === idEspecial))
            quitado.especiales.push({ idEspecial, idExtra });
    };
    const bajarCaracteristica = (id: number, cuanto: number) => {
        const clave = caracteristicaDelAlta(id)?.[0];
        const c = clave ? (ficha.caracteristicas as any)?.[clave] : null;
        if (c && !c.perdido) {
            c.valor = toInt(c.valor) - Math.max(1, cuanto);
            quitado.incremento = id;
        }
    };
    const conLibro = !!clase?.Conjuros?.Libro;

    if (conRegistro) {
        (nivel?.elecciones ?? []).forEach((e: PersonajeCreateNivelEleccionDto) => {
            const id = toInt(e.idElemento);
            switch (e.tipo) {
                case 'dote': quitarDote(id, toInt(e.idExtra), e.origen); break;
                case 'especial': quitarEspecial(id, toInt(e.idExtra)); break;
                case 'idioma':
                    if (sacarPrimero(col.idiomas, (x: any) => toInt(x?.idIdioma) === id))
                        quitado.idiomas.push(id);
                    break;
                case 'dominio':
                    if (sacarPrimero(col.dominios, (x: any) => toInt(x?.idDominio) === id))
                        quitado.dominios.push(id);
                    break;
                case 'conjuro':
                    // El mago conserva lo que escribió en su libro (dictamen del máster: el libro es un objeto).
                    if (!conLibro && sacarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === id
                        && (toInt(x?.idClase) === toInt(e.idExtra) || toInt(x?.idClase) < 1)))
                        quitado.conjuros.push({ idConjuro: id, idClase: toInt(e.idExtra) });
                    break;
                case 'conjuro_olvidado': {
                    const idClaseConjuro = toInt(e.idExtra) || idClase;
                    if (e.valor && sacarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === toInt(e.valor)
                        && (toInt(x?.idClase) === idClaseConjuro || toInt(x?.idClase) < 1)))
                        quitado.conjuros.push({ idConjuro: toInt(e.valor), idClase: idClaseConjuro });
                    col.conjurosConocidos.push({ idConjuro: id, idClase: idClaseConjuro });
                    quitado.vuelven.push({ idConjuro: id, idClase: idClaseConjuro });
                    break;
                }
                case 'rangos': {
                    const h = col.habilidades.base.find((x: any) => toInt(x?.idHabilidad) === id && mismoExtra(x?.idExtra, e.idExtra));
                    if (h) {
                        const quita = Math.min(toInt(h.rangos), Math.max(0, toInt(e.valor)));
                        h.rangos = toInt(h.rangos) - quita;
                        if (quita > 0)
                            quitado.rangos.push({ idHabilidad: id, idExtra: extraComparable(e.idExtra), rangos: quita });
                    }
                    break;
                }
                case 'incremento': bajarCaracteristica(id, toInt(e.valor)); break;
                default: break;
            }
        });
    } else {
        // Sin su registro (Guía del DM, pág. 295): el incremento de la más alta, los rangos de las habilidades con más y
        // las dotes y aptitudes de la tabla de su clase.
        if (daIncrementoPorNivelDePersonaje(datos.dgsAntes))
            bajarCaracteristica(toInt(datos.incrementoSinRegistro) || caracteristicaMasAlta(entrada), 1);
        const detalle = filaDeNivel(clase, nivelClase);
        (detalle?.Dotes ?? []).forEach((d) => {
            const idDote = toInt(d?.Dote?.Id);
            if (idDote > 0)
                quitarDote(idDote, toInt(d?.Id_extra), origenDeNivelDeClase(clase?.Nombre ?? '', nivelClase));
        });
        (detalle?.Especiales ?? []).forEach((e) => {
            const idEspecial = toInt((e?.Especial as any)?.Id);
            if (idEspecial > 0)
                quitarEspecial(idEspecial, toInt(e?.Id_extra));
        });
        if (datos.doteSinRegistro)
            quitarDote(datos.doteSinRegistro.idDote, datos.doteSinRegistro.idExtra, datos.doteSinRegistro.origen);
        const puntos = Math.max(1, toInt(clase?.Puntos_habilidad?.Valor) + modificadorCaracteristica(toInt((entrada.caracteristicas as any)?.inteligencia?.valor)));
        for (let i = 0; i < puntos; i++) {
            const h = [...col.habilidades.base].filter((x: any) => toInt(x?.rangos) > 0).sort((a: any, b: any) => toInt(b.rangos) - toInt(a.rangos))[0];
            if (!h)
                break;
            h.rangos = toInt(h.rangos) - 1;
            const ya = quitado.rangos.find((r) => r.idHabilidad === toInt(h.idHabilidad) && mismoExtra(r.idExtra, h.idExtra));
            if (ya)
                ya.rangos += 1;
            else
                quitado.rangos.push({ idHabilidad: toInt(h.idHabilidad), idExtra: extraComparable(h.idExtra), rangos: 1 });
        }
        if (clase?.Conjuros?.Conocidos_total || clase?.Conjuros?.Conocidos_nivel_a_nivel || (entrada.colecciones?.conjurosConocidos ?? []).some((c) => toInt(c.idClase) === idClase))
            avisos.push('No se sabe qué conjuros conocidos ganó en ese nivel: quita los que toquen con «Corregir la ficha».');
        avisos.push('No se sabe qué eligió en ese nivel: se quita lo de la Guía del DM (el incremento de la característica más alta y los rangos de las habilidades con más).');
    }

    // Los aumentos de nivel de lanzador de ese nivel.
    if (ficha.progresionLanzador?.selecciones)
        ficha.progresionLanzador = {
            selecciones: ficha.progresionLanzador.selecciones.filter((s) => !(toInt(s.idClaseAplicada) === idClase && toInt(s.nivelClaseAplicado) === nivelClase)),
        };

    // El ataque base y las salvaciones de clase de ese nivel (las de la creación: un modificador por nivel con su origen).
    const ahora = filaDeNivel(clase, nivelClase);
    const previo = nivelClase > 1 ? filaDeNivel(clase, nivelClase - 1) : null;
    const ataqueAntes = `${entrada.personaje.ataqueBase ?? '+0'}`;
    const deltaAtaque = (primerEntero(ahora?.Ataque_base) ?? 0) - (primerEntero(previo?.Ataque_base) ?? 0);
    ficha.personaje.ataqueBase = textoAtaqueBase((primerEntero(ataqueAntes) ?? 0) - deltaAtaque);
    const salvaciones: ResultadoPerdida['salvaciones'] = {};
    const origen = origenDeNivelDeClase(clase?.Nombre ?? '', nivelClase);
    const mods: any = ficha.modificadores = { ...(ficha.modificadores ?? {}), salvaciones: { ...((ficha.modificadores as any)?.salvaciones ?? {}) } };
    SALVACIONES.forEach(([s, campo]) => {
        const delta = (primerEntero(ahora?.Salvaciones?.[campo]) ?? 0) - (primerEntero(previo?.Salvaciones?.[campo]) ?? 0);
        const actual = mods.salvaciones[s] = { ...(mods.salvaciones[s] ?? {}), claseos: [...(mods.salvaciones[s]?.claseos ?? [])] };
        if (sacarPrimero(actual.claseos, (m: any) => `${m?.origen ?? ''}` === origen))
            salvaciones[s] = delta;
        else if (delta !== 0)
            avisos.push(`No se ha encontrado la salvación de ${campo} de ${origen}: revísala con «Corregir la ficha».`);
    });

    // Los PG: los de su DG (la tirada guardada, o la media si no se sabe) y, si el incremento era de Constitución, el
    // retroactivo de los DG que le quedan.
    const pgAntes = toInt(entrada.personaje.puntosGolpe);
    const modAntes = modConstitucionDeEntrada(entrada);
    let pgDelNivel = 0;
    let exacto = true;
    if (daDgEnNivel(clase as any, nivelClase) && datos.caras > 0)
        ({ pg: pgDelNivel, exacto } = pgDeUnDgGuardado(nivel?.pg, datos.caras, modAntes));
    const sinElDg: PersonajeCreateRequestDto = { ...ficha, personaje: { ...ficha.personaje, puntosGolpe: pgAntes - pgDelNivel }, caracteristicas: entrada.caracteristicas };
    const dgsQueQuedan = Math.max(0, toInt(datos.dgsAntes) - (pgDelNivel > 0 ? 1 : 0));
    const pg = pgTrasCambioDeCon(sinElDg, dgsQueQuedan, modConstitucionDeEntrada(ficha), null);
    // Sin ningún DG (la conversión en muerto viviente de un personaje de 1.er nivel, que gana enseguida el de su clase de
    // monstruo), lo que queda sin el mínimo de 1: lo que dan sus dotes (Dureza) o nada.
    if (dgsQueQuedan < 1)
        pg.total = Math.max(0, pgAntes - pgDelNivel);
    ficha.personaje.puntosGolpe = pg.total;
    if (!exacto)
        avisos.push('No se sabe lo que salió en el dado de ese nivel: se quita la media del dado.');

    return { ficha, quitado, pg: { antes: pgAntes, despues: pg.total, exacto: exacto && pg.exacto }, ataqueBase: { antes: ataqueAntes, despues: ficha.personaje.ataqueBase }, salvaciones, avisos };
}

/**
 * La pérdida sin lo que daban las dotes que se van con el nivel (`dotes`, el cuerpo del motor antes y después de
 * quitarlas, y sus PG: `MotorDesdeFichaService.loQueDabanLasDotes`): sus modificadores (la iniciativa de Iniciativa
 * mejorada), sus características, los rangos varios de sus habilidades y sus PG (Dureza). Lo que quita la pérdida lo
 * guarda la API (`detalle.parche`): un restablecimiento lo devuelve con la dote. Sin `dotes`, la misma.
 */
export function sinLoQueDabanLasDotes(resultado: ResultadoPerdida,
    dotes: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; pg: number; } | null): ResultadoPerdida {
    if (!dotes)
        return resultado;
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(resultado.ficha));
    aplicarLoQueDanLasDotes(ficha, dotes.antes, dotes.despues);
    ficha.personaje.puntosGolpe = Math.max(0, toInt(ficha.personaje.puntosGolpe) - Math.max(0, toInt(dotes.pg)));
    return { ...resultado, ficha, pg: { ...resultado.pg, despues: ficha.personaje.puntosGolpe } };
}

/**
 * Con un solo DG, al volver a la vida (*Manual del jugador*, pág. 171): la ficha con 2 puntos menos de Constitución y
 * los PG con su nuevo modificador. `null` si no tiene Constitución o se quedaría en 0 (no se le puede devolver la vida).
 */
export function fichaConConstitucionPerdida(entrada: PersonajeCreateRequestDto, dgs: number)
    : { ficha: PersonajeCreateRequestDto; antes: number; despues: number; pg: { antes: number; despues: number; }; } | null {
    const con = entrada.caracteristicas?.constitucion;
    if (!con || con.perdido || toInt(con.valor) - CONSTITUCION_PERDIDA < 1)
        return null;
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    ficha.caracteristicas.constitucion.valor = toInt(con.valor) - CONSTITUCION_PERDIDA;
    const pg = pgTrasCambioDeCon(entrada, Math.max(1, toInt(dgs)), modificadorCaracteristica(ficha.caracteristicas.constitucion.valor), null);
    ficha.personaje.puntosGolpe = pg.total;
    return { ficha, antes: toInt(con.valor), despues: ficha.caracteristicas.constitucion.valor, pg: { antes: toInt(entrada.personaje.puntosGolpe), despues: pg.total } };
}

/**
 * Los nombres de lo que tiene la ficha para «Lo que pierde» (`filasDelNivelPerdido`): de su ficha (`pj`, antes de perder
 * el nivel), de su `entrada` (las puntuaciones) y de los catálogos del motor. Lo usan perder un nivel y la conversión en
 * muerto viviente.
 */
export function nombresDeLaFicha(svc: NuevoPersonajeService, pj: Personaje | null, entrada: PersonajeCreateRequestDto): NombresDeLaFicha {
    return {
        dote: (idDote, idExtra) => {
            const d = doteContextualPorId(pj?.DotesContextuales, idDote, idExtra);
            return d ? nombreDoteConExtra(d) : `Dote ${idDote}`;
        },
        aptitud: (id) => pj?.Claseas?.find((x) => toInt(x?.Id) === id)?.Nombre ?? `Aptitud ${id}`,
        conjuro: (id) => svc.conjuroDelCatalogo(id)?.Nombre ?? `Conjuro ${id}`,
        idioma: (id) => svc.EstadoFlujo.ventajas.catalogoIdiomas.find((x) => toInt((x as any)?.Id) === id)?.Nombre ?? `Idioma ${id}`,
        dominio: (id) => pj?.Dominios?.find((x) => toInt(x?.Id) === id)?.Nombre ?? `Dominio ${id}`,
        habilidad: (idHabilidad, idExtra) => {
            const h = pj?.Habilidades?.find((x) => toInt(x?.Id) === idHabilidad && !x.Custom);
            const nombre = h ? `${h.Nombre}${tieneTextoVisible(h.Extra) && toInt(idExtra) > 0 ? ` (${h.Extra})` : ''}` : `Habilidad ${idHabilidad}`;
            return { nombre, rangos: toInt(h?.Rangos) };
        },
        caracteristica: (id) => {
            const [clave, caracteristica] = caracteristicaDelAlta(id) ?? [];
            return {
                nombre: (caracteristica ? NOMBRES_CARACTERISTICAS[caracteristica] : undefined) ?? `Característica ${id}`,
                valor: toInt(clave ? (entrada.caracteristicas as any)?.[clave]?.valor : undefined),
            };
        },
    };
}

// --- El nivel que pierde: lo comparten perder un nivel y la conversión en muerto viviente -------------------------

/** Si no se sabe en qué orden ganó sus niveles (las fichas de antes del historial): la clase la elige el jugador. */
export function ordenPorConocer(niveles: PersonajeCreateNivelDto[] | undefined): boolean {
    const lista = niveles ?? [];
    return lista.length > 0 && !ordenConocido(lista[lista.length - 1]);
}

/** Sus clases, con su nombre del catálogo y su nivel, para elegir la que pierde el nivel con el orden por conocer. */
export function clasesQuePuedenPerder(svc: NuevoPersonajeService, entrada: PersonajeCreateRequestDto | null | undefined)
    : Array<{ id: number; nombre: string; nivel: number; }> {
    return (entrada?.colecciones?.clases ?? []).map((c) => ({
        id: toInt(c.idClase), nombre: svc.claseDelCatalogo(c.idClase)?.Nombre ?? `Clase ${c.idClase}`, nivel: toInt(c.nivel),
    }));
}

/** Sin su registro, las características que puede bajar el incremento que pierde: las que no tiene perdidas, con su puntuación. */
export function caracteristicasDelIncrementoPerdido(entrada: PersonajeCreateRequestDto | null | undefined)
    : Array<{ id: number; nombre: string; valor: number; }> {
    const caracteristicas = entrada?.caracteristicas as any;
    return CARACTERISTICAS_DEL_ALTA.map(([clave, motor], i) => ({ id: i + 1, clave, nombre: NOMBRES_CARACTERISTICAS[motor] }))
        .filter((c) => !caracteristicas?.[c.clave]?.perdido)
        .map(({ id, clave, nombre }) => ({ id, nombre, valor: toInt(caracteristicas?.[clave]?.valor) }));
}

/**
 * Sin su registro, las dotes que puede perder por el DG: las suyas (no las de su raza ni sus plantillas), cada una con su
 * clave (`idDote|idExtra|origen`, la que lee `doteDeLaClave`).
 */
export function dotesQuePuedePerder(pj: Personaje | null | undefined): Array<{ clave: string; nombre: string; }> {
    return (pj?.DotesContextuales ?? []).filter((d) => !d?.Contexto?.Entidad || d.Contexto.Entidad === 'personaje')
        .map((d) => ({
            clave: `${toInt(d?.Dote?.Id)}|${toInt(d?.Contexto?.Id_extra)}|${(d?.Contexto as any)?.Origen ?? ''}`,
            nombre: nombreDoteConExtra(d),
        }));
}

/** La dote de una clave de `dotesQuePuedePerder`, o `null` si no hay ninguna elegida. */
export function doteDeLaClave(clave: string): { idDote: number; idExtra: number; origen: string; } | null {
    const [idDote, idExtra, ...origen] = `${clave ?? ''}`.split('|');
    return toInt(idDote) > 0 ? { idDote: toInt(idDote), idExtra: toInt(idExtra), origen: origen.join('|') } : null;
}

/**
 * Quita del motor, para siempre, el nivel perdido (`perdida`, la de `perdidaDelNivel`; `idClase` su clase e `indice` su
 * lugar en su registro): un nivel menos de su clase, el ataque base de después, la característica del incremento, los
 * rangos, las dotes y las aptitudes de ese nivel (`NuevoPersonajeService.perderNivelEnElMotor`). Lo usan la conversión en
 * muerto viviente (antes del nivel de su clase de monstruo) y la vuelta a la vida (cada nivel de la clase de monstruo y el
 * de más), para seguir con lo que le queda.
 */
export function quitarElNivelDelMotor(svc: NuevoPersonajeService, perdida: ResultadoPerdida, idClase: number, indice: number): void {
    const incremento = perdida.quitado.incremento !== null ? caracteristicaDelAlta(perdida.quitado.incremento)?.[1] ?? null : null;
    svc.perderNivelEnElMotor({
        idClase,
        ataqueBase: perdida.ataqueBase.despues,
        caracteristica: incremento ? { clave: incremento, menos: 1 } : null,
        rangos: perdida.quitado.rangos,
        dotesQuitadas: perdida.quitado.dotes,
        especialesQuitados: perdida.quitado.especiales,
        indiceNivel: indice,
    });
}

/**
 * Lo que quita el nivel `indice` de la `entrada` (`fichaSinElNivel`), sin lo que daban las dotes que se van con él
 * (`sinLoQueDabanLasDotes`, con el motor de antes de perderlo: la iniciativa de Iniciativa mejorada, los PG de Dureza), con
 * ese nivel y la primera fila de «Lo que pierde» (el nivel de clase). `dgs`, sus DG antes de perderlo; `incremento` y
 * `dote`, lo que eligió el jugador sin su registro.
 */
export function perdidaDelNivel(svc: NuevoPersonajeService, motor: MotorDesdeFichaService, datos: {
    entrada: PersonajeCreateRequestDto;
    indice: number;
    dgs: number;
    incremento: number | null;
    dote: { idDote: number; idExtra: number; origen: string; } | null;
}): { resultado: ResultadoPerdida; nivel: PersonajeCreateNivelDto; filaDelNivel: FilaPerdida; } {
    const { entrada, indice, dgs } = datos;
    const nivel = entrada.niveles![indice];
    const clase = svc.claseDelCatalogo(nivel.idClase);
    const sinElNivel = fichaSinElNivel({
        entrada, indice, clase, caras: svc.carasDadoGolpeDeClase(clase), dgsAntes: dgs,
        incrementoSinRegistro: datos.incremento, doteSinRegistro: datos.dote,
    });
    const resultado = sinLoQueDabanLasDotes(sinElNivel, motor.loQueDabanLasDotes(svc, entrada, sinElNivel.quitado.dotes, dgs - 1));
    const nombreClase = clase?.Nombre ?? `Clase ${nivel.idClase}`;
    return {
        resultado, nivel,
        filaDelNivel: { que: 'Nivel de clase', antes: `${nombreClase} ${nivel.nivelClase}`, ahora: nivel.nivelClase > 1 ? `${nombreClase} ${nivel.nivelClase - 1}` : 'Deja la clase' },
    };
}
