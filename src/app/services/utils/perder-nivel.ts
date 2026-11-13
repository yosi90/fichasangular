import { Clase } from 'src/app/interfaces/clase';
import { PersonajeCreateNivelDto, PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { textoAtaqueBase } from './ataque-base';
import { modificadorCaracteristica } from './caracteristicas';
import { daDgEnNivel, daIncrementoPorNivelDePersonaje, filaDeNivel } from './clase-niveles';
import { CARACTERISTICAS_DEL_ALTA } from './correccion-ficha';
import { experienciaParaNivel } from './experiencia-nivel';
import { primerEntero, toInt } from './normalizacion';
import { modConstitucionDeEntrada, pgTrasCambioDeCon } from './subida-nivel';

/*
 * Perder un nivel con el personaje ya creado (roadmap de sesiones, fase 7, segunda tanda; guía
 * `docs/publica/SESIONES_FRONT.md`, «Perder un nivel»): la web parte de la `entrada` de la sesión abierta y manda a
 * `POST /personajes/{id}/niveles/perdida` esa ficha sin lo del nivel que pierde. Como la corrección, lo que se quita se
 * quita de la `entrada` (así no se pierde nada de lo que el motor no sabe leer de la ficha): lo que se eligió en ese nivel
 * (su registro, `niveles[i].elecciones`) y lo que da su clase en ese nivel (el ataque base, las salvaciones, los PG del
 * DG). Reglas: *Guía del DM*, pág. 295, «Pérdida de nivel», y el dictamen del máster de Rol, en el roadmap.
 */

export type CausaPerdida = 'revivir' | 'nivel_negativo' | 'plantilla' | 'otro';

/** Las causas que ofrece la web, con su texto (la API las valida: `causa`). */
export const CAUSAS_PERDIDA: ReadonlyArray<{ valor: CausaPerdida; texto: string; }> = [
    { valor: 'revivir', texto: 'Volver a la vida (revivir a los muertos, resurrección, reencarnar)' },
    { valor: 'nivel_negativo', texto: 'Un nivel negativo que se hace permanente' },
    { valor: 'plantilla', texto: 'El coste de una plantilla (el necropolita)' },
    { valor: 'otro', texto: 'Otra causa' },
];

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

function quitarPrimero<T>(lista: T[] | undefined, es: (x: T) => boolean): boolean {
    const i = (lista ?? []).findIndex(es);
    if (i < 0)
        return false;
    lista!.splice(i, 1);
    return true;
}

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
        const hecho = (origen && quitarPrimero(col.dotes, (x: any) => toInt(x?.idDote) === idDote && toInt(x?.idExtra) === idExtra && `${x?.origen ?? ''}` === origen))
            || quitarPrimero(col.dotes, (x: any) => toInt(x?.idDote) === idDote && toInt(x?.idExtra) === idExtra)
            || quitarPrimero(col.dotes, (x: any) => toInt(x?.idDote) === idDote);
        if (hecho)
            quitado.dotes.push({ idDote, idExtra });
    };
    const quitarEspecial = (idEspecial: number, idExtra: number) => {
        if (quitarPrimero(col.especiales, (x: any) => toInt(x?.idEspecial) === idEspecial && toInt(x?.idExtra) === idExtra)
            || quitarPrimero(col.especiales, (x: any) => toInt(x?.idEspecial) === idEspecial))
            quitado.especiales.push({ idEspecial, idExtra });
    };
    const bajarCaracteristica = (id: number, cuanto: number) => {
        const clave = CARACTERISTICAS_DEL_ALTA[id - 1]?.[0];
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
                    if (quitarPrimero(col.idiomas, (x: any) => toInt(x?.idIdioma) === id))
                        quitado.idiomas.push(id);
                    break;
                case 'dominio':
                    if (quitarPrimero(col.dominios, (x: any) => toInt(x?.idDominio) === id))
                        quitado.dominios.push(id);
                    break;
                case 'conjuro':
                    // El mago conserva lo que escribió en su libro (dictamen del máster: el libro es un objeto).
                    if (!conLibro && quitarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === id
                        && (toInt(x?.idClase) === toInt(e.idExtra) || toInt(x?.idClase) < 1)))
                        quitado.conjuros.push({ idConjuro: id, idClase: toInt(e.idExtra) });
                    break;
                case 'conjuro_olvidado': {
                    const idClaseConjuro = toInt(e.idExtra) || idClase;
                    if (e.valor && quitarPrimero(col.conjurosConocidos, (x: any) => !x?.copiado && toInt(x?.idConjuro) === toInt(e.valor)
                        && (toInt(x?.idClase) === idClaseConjuro || toInt(x?.idClase) < 1)))
                        quitado.conjuros.push({ idConjuro: toInt(e.valor), idClase: idClaseConjuro });
                    col.conjurosConocidos.push({ idConjuro: id, idClase: idClaseConjuro });
                    quitado.vuelven.push({ idConjuro: id, idClase: idClaseConjuro });
                    break;
                }
                case 'rangos': {
                    const h = col.habilidades.base.find((x: any) => toInt(x?.idHabilidad) === id && Math.max(0, toInt(x?.idExtra)) === Math.max(0, toInt(e.idExtra)));
                    if (h) {
                        const quita = Math.min(toInt(h.rangos), Math.max(0, toInt(e.valor)));
                        h.rangos = toInt(h.rangos) - quita;
                        if (quita > 0)
                            quitado.rangos.push({ idHabilidad: id, idExtra: toInt(e.idExtra), rangos: quita });
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
                quitarDote(idDote, toInt(d?.Id_extra), `${clase?.Nombre ?? ''} nivel ${nivelClase}`);
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
            const ya = quitado.rangos.find((r) => r.idHabilidad === toInt(h.idHabilidad) && r.idExtra === toInt(h.idExtra));
            if (ya)
                ya.rangos += 1;
            else
                quitado.rangos.push({ idHabilidad: toInt(h.idHabilidad), idExtra: toInt(h.idExtra), rangos: 1 });
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
    const origen = `${clase?.Nombre ?? ''} nivel ${nivelClase}`;
    const mods: any = ficha.modificadores = { ...(ficha.modificadores ?? {}), salvaciones: { ...((ficha.modificadores as any)?.salvaciones ?? {}) } };
    SALVACIONES.forEach(([s, campo]) => {
        const delta = (primerEntero(ahora?.Salvaciones?.[campo]) ?? 0) - (primerEntero(previo?.Salvaciones?.[campo]) ?? 0);
        const actual = mods.salvaciones[s] = { ...(mods.salvaciones[s] ?? {}), claseos: [...(mods.salvaciones[s]?.claseos ?? [])] };
        if (quitarPrimero(actual.claseos, (m: any) => `${m?.origen ?? ''}` === origen))
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
    if (daDgEnNivel(clase as any, nivelClase) && datos.caras > 0) {
        const tirada = nivel?.pg?.maximo ? datos.caras : toInt(nivel?.pg?.tirada);
        exacto = tirada > 0;
        pgDelNivel = Math.max(1, (tirada > 0 ? tirada : Math.floor(datos.caras / 2) + 1) + modAntes);
    }
    const sinElDg: PersonajeCreateRequestDto = { ...ficha, personaje: { ...ficha.personaje, puntosGolpe: pgAntes - pgDelNivel }, caracteristicas: entrada.caracteristicas };
    const pg = pgTrasCambioDeCon(sinElDg, Math.max(0, toInt(datos.dgsAntes) - (pgDelNivel > 0 ? 1 : 0)), modConstitucionDeEntrada(ficha), null);
    ficha.personaje.puntosGolpe = pg.total;
    if (!exacto)
        avisos.push('No se sabe lo que salió en el dado de ese nivel: se quita la media del dado.');

    return { ficha, quitado, pg: { antes: pgAntes, despues: pg.total, exacto: exacto && pg.exacto }, ataqueBase: { antes: ataqueAntes, despues: ficha.personaje.ataqueBase }, salvaciones, avisos };
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
