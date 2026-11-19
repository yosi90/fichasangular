import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ReciclajeSubidaDto } from 'src/app/interfaces/sesiones';
import type { DotePendienteState, DoteSelectorCandidato, DoteSeleccionConfirmada, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { esConjuroDeLaClase, nivelDelConjuroEnLaClase } from 'src/app/services/nuevo-personaje.service';
import { claveDoteDeLaFicha, DoteDeLaFicha, sacarDoteDeLaFicha, sacarPrimero } from './correccion-ficha';
import { extraHabilidadElegido, idExtraHabilidadParaGuardar } from './habilidad-extra-visible';
import { normalizarTexto, toInt, toNumber } from './normalizacion';
import { limiteRangosHabilidad } from './puntos-habilidad';
import { aplicarCaracteristicasDelMotor, aplicarHabilidadesDelMotor, aplicarModificadoresDelMotor } from './subida-nivel';
import { CambioSubida } from './subida-nivel-vista';

/*
 * El reciclaje de la subida de nivel (*Manual del jugador II*, cap. 8, págs. 194-196; contrato en
 * `docs/publica/endpoints/personajes.md`, «Subida de nivel», «El reciclaje»; guía `docs/publica/SESIONES_FRONT.md`): al
 * subir, antes de añadir nada del nivel nuevo, el personaje cambia una sola cosa que eligió antes (una dote, un idioma,
 * rangos de una habilidad o conjuros conocidos) por otra legal. Todo se juzga con el personaje de antes de subir; lo que
 * depende de lo reciclado (una dote, una clase) bloquea el cambio, no se quita en cascada. Después, el motor sigue con el
 * nivel ya con el cambio hecho. Lo usa solo la subida (`components/sesiones/subir-nivel`, con carga diferida).
 */

/** Como mucho, los rangos que se traspasan de una habilidad a otra (MJ II, tabla 8-1). */
export const MAXIMO_RANGOS_RECICLADOS = 4;
/** Como mucho, los conocidos que se cambian (MJ II, pág. 196). */
export const MAXIMO_CONJUROS_RECICLADOS = 2;

/** Lo que se elige en el paso «Reciclar», con los nombres para el resumen. */
export type PlanReciclaje =
    | {
        tipo: 'dote';
        quita: DoteReciclable;
        /** Lo elegido en el selector de dotes de la creación, para volver a aplicarlo en el motor. */
        seleccion: DoteSeleccionConfirmada;
        pone: { idDote: number; idExtra: number; nombre: string; extra: string; };
    }
    | { tipo: 'idioma'; quita: { idIdioma: number; nombre: string; }; pone: { idIdioma: number; nombre: string; }; }
    | {
        tipo: 'rangos';
        quita: { idHabilidad: number; idExtra: number; nombre: string; };
        pone: { idHabilidad: number; idExtra: number; nombre: string; };
        rangos: number;
    }
    | {
        tipo: 'conjuros';
        cambios: Array<{ idClase: number; clase: string; olvida: { id: number; nombre: string; }; aprende: { id: number; nombre: string; }; }>;
    };

/** Una dote del personaje en el paso «Reciclar»: si se puede reciclar y, si no, por qué. */
export interface DoteReciclable {
    idDote: number;
    idExtra: number;
    origen: string;
    nombre: string;
    extra: string;
    /** Su nivel en el registro (`Orden_niveles`), o `null` si no se sabe: entonces se juzga como de 1.er nivel. */
    indiceNivel: number | null;
    /** `null` si se puede reciclar. */
    motivo: string | null;
}

/** Un idioma que conoce: si se puede olvidar y, si no, por qué. */
export interface IdiomaReciclable {
    idIdioma: number;
    nombre: string;
    motivo: string | null;
}

/** Una habilidad con rangos comprados, de la que se pueden traspasar rangos. */
export interface HabilidadConRangos {
    idHabilidad: number;
    idExtra: number;
    nombre: string;
    rangos: number;
}

/** Una habilidad de destino de los rangos: si vale y, si no, por qué; `clases`, las que la hacen de clase si no es de las suyas. */
export interface DestinoDeRangos extends HabilidadConRangos {
    motivo: string | null;
    /** `null` si es de clase para alguna de las que ya tiene; si no, las clases que puede subir con las que lo es. */
    clases: Array<{ id: number; nombre: string; }> | null;
}

/** Un conocido de una clase con conocidos limitados: su nivel en la lista de la clase y si se puede olvidar. */
export interface ConocidoReciclable {
    idConjuro: number;
    nombre: string;
    nivel: number;
    motivo: string | null;
}

/** Una clase con conocidos limitados (su tabla de conocidos: el bardo, el hechicero; no el mago, el clérigo ni el druida). */
export interface ClaseConConocidos {
    id: number;
    nombre: string;
    conocidos: ConocidoReciclable[];
}

/** El cuerpo `reciclaje` de `POST /personajes/{id}/niveles` del plan; `orden`, el nivel del registro (1, 2…) o `null`. */
export function reciclajeDelPlan(plan: PlanReciclaje): ReciclajeSubidaDto {
    if (plan.tipo === 'dote')
        return {
            tipo: 'dote',
            quita: { idDote: plan.quita.idDote, idExtra: plan.quita.idExtra, orden: plan.quita.indiceNivel === null ? null : plan.quita.indiceNivel + 1 },
            pone: { idDote: plan.pone.idDote, idExtra: plan.pone.idExtra },
        };
    if (plan.tipo === 'idioma')
        return { tipo: 'idioma', quita: { idIdioma: plan.quita.idIdioma }, pone: { idIdioma: plan.pone.idIdioma } };
    if (plan.tipo === 'rangos')
        return {
            tipo: 'rangos', rangos: plan.rangos,
            quita: { idHabilidad: plan.quita.idHabilidad, idExtra: plan.quita.idExtra },
            pone: { idHabilidad: plan.pone.idHabilidad, idExtra: plan.pone.idExtra },
        };
    return { tipo: 'conjuros', cambios: plan.cambios.map((c) => ({ idClase: c.idClase, olvida: c.olvida.id, aprende: c.aprende.id })) };
}

/** La primera fila de «Lo que cambia» (lienzo, pantalla 4): lo reciclado, con su libro y su página. */
export function filaDelReciclaje(plan: PlanReciclaje): CambioSubida {
    const conExtra = (nombre: string, extra: string) => extra ? `${nombre} (${extra})` : nombre;
    if (plan.tipo === 'dote')
        return {
            que: 'Reciclaje: dote',
            antes: conExtra(plan.quita.nombre, plan.quita.extra),
            ahora: conExtra(plan.pone.nombre, plan.pone.extra),
            porque: `${plan.quita.indiceNivel === null ? 'Dote sin su nivel en el registro (como de 1.er nivel)' : `Dote de nivel ${plan.quita.indiceNivel + 1}`}; Manual del jugador II, pág. 195`,
        };
    if (plan.tipo === 'idioma')
        return { que: 'Reciclaje: idioma', antes: plan.quita.nombre, ahora: plan.pone.nombre, porque: 'Un idioma por otro; Manual del jugador II, pág. 196' };
    if (plan.tipo === 'rangos')
        return {
            que: 'Reciclaje: habilidades', antes: `${plan.quita.nombre} −${plan.rangos}`, ahora: `${plan.pone.nombre} +${plan.rangos}`,
            porque: `Traspasa ${plan.rangos} ${plan.rangos === 1 ? 'rango' : 'rangos'}; Manual del jugador II, pág. 196`,
        };
    const clases = Array.from(new Set(plan.cambios.map((c) => c.clase.toLowerCase())));
    return {
        que: 'Reciclaje: conjuros',
        antes: plan.cambios.map((c) => c.olvida.nombre).join(', '),
        ahora: plan.cambios.map((c) => c.aprende.nombre).join(', '),
        porque: `Conocidos de ${clases.join(' y ')}, del mismo nivel; Manual del jugador II, pág. 196`,
    };
}

/**
 * La `entrada` con el reciclaje hecho: la ficha sobre la que sigue la subida (la que se manda lleva, además, el nivel).
 * Lo nuevo va en el hueco de lo antiguo (la dote, con su origen; el idioma y el conocido, con el suyo); los rangos pasan
 * de una habilidad a otra (`claseaDestino`, si la de destino no tenía fila y es de clase). Los niveles no cambian: el
 * registro del cambio lo apunta la API en el nivel en que se eligió lo antiguo. Con `motor` (su cuerpo antes y después
 * del cambio), también lo que daba lo antiguo y lo que da lo nuevo: los modificadores y los rangos varios de una dote (la
 * API los guarda tal cual) y lo que suma a una característica.
 */
export function fichaConElReciclaje(entrada: PersonajeCreateRequestDto, reciclaje: ReciclajeSubidaDto,
    opciones: { origenDote?: string; claseaDestino?: boolean; motor?: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null; } = {})
    : PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    if (reciclaje.tipo === 'dote') {
        const { quita, pone } = reciclaje;
        const dotes: any[] = col.dotes = [...(col.dotes ?? [])];
        const quitada = sacarDoteDeLaFicha(dotes, quita.idDote, quita.idExtra, opciones.origenDote);
        const origen = `${quitada?.origen ?? opciones.origenDote ?? ''}`.trim();
        dotes.push({ idDote: toInt(pone.idDote), idExtra: Math.max(0, toInt(pone.idExtra)), ...(origen ? { origen } : {}) });
        // La que mantenía sin sus prerrequisitos (`requisitos_dote`) y ya no tiene: fuera, o la API la rechaza.
        if (ficha.decisionesHomebrew && !dotes.some((x) => toInt(x?.idDote) === toInt(quita.idDote)))
            ficha.decisionesHomebrew = ficha.decisionesHomebrew
                .filter((d) => !(d.tipo === 'requisitos_dote' && toInt(d.idElemento) === toInt(quita.idDote)));
    } else if (reciclaje.tipo === 'idioma') {
        const idiomas: any[] = col.idiomas = [...(col.idiomas ?? [])];
        const quitado = sacarPrimero(idiomas, (x) => toInt(x?.idIdioma) === toInt(reciclaje.quita.idIdioma));
        const origen = `${quitado?.origen ?? ''}`.trim();
        idiomas.push({ idIdioma: toInt(reciclaje.pone.idIdioma), ...(origen ? { origen } : {}) });
    } else if (reciclaje.tipo === 'rangos') {
        const rangos = Math.max(0, toInt(reciclaje.rangos));
        const clave = (h: any) => `${toInt(h?.idHabilidad)}:${Math.max(0, toInt(h?.idExtra))}`;
        const base: any[] = (col.habilidades?.base ?? []).map((h: any) => ({ ...h }));
        const origen = base.find((h) => clave(h) === clave(reciclaje.quita));
        if (origen)
            origen.rangos = Math.max(0, toInt(origen.rangos) - rangos);
        const destino = base.find((h) => clave(h) === clave(reciclaje.pone));
        if (destino)
            destino.rangos = toInt(destino.rangos) + rangos;
        else
            base.push({ idHabilidad: toInt(reciclaje.pone.idHabilidad), idExtra: toInt(reciclaje.pone.idExtra), clasea: !!opciones.claseaDestino,
                rangos, rangosVarios: 0, modVarios: '' });
        col.habilidades = { ...(col.habilidades ?? {}), base };
    } else {
        const conocidos: any[] = col.conjurosConocidos = [...(col.conjurosConocidos ?? [])];
        reciclaje.cambios.forEach((c) => {
            const olvidado = sacarPrimero(conocidos, (x) => !x?.copiado && toInt(x?.idConjuro) === toInt(c.olvida) && toInt(x?.idClase) === toInt(c.idClase));
            const origen = `${olvidado?.origen ?? ''}`.trim();
            conocidos.push({ idConjuro: toInt(c.aprende), idClase: toInt(c.idClase), ...(origen ? { origen } : {}) });
        });
    }
    const motor = opciones.motor;
    if (motor) {
        aplicarModificadoresDelMotor(ficha, motor.antes, motor.despues);
        aplicarCaracteristicasDelMotor(ficha, motor.antes, motor.despues);
        aplicarHabilidadesDelMotor(ficha, motor.antes, motor.despues, true);
    }
    return ficha;
}

// --- Con el motor de la creación ------------------------------------------------------------------------------------

/** Lo que el reciclaje quitaría del personaje, para ver qué deja de cumplir sus prerrequisitos. */
export interface LoQueQuita {
    dote?: { idDote: number; idExtra: number; origen: string; };
    idioma?: string;
    rangos?: { idHabilidad: number; idExtra: number; rangos: number; };
    conjuros?: Array<{ idConjuro: number; clase: string; }>;
}

/** Las clases que tiene, del catálogo del motor. */
function clasesQueTiene(motor: NuevoPersonajeService): Clase[] {
    return (motor.PersonajeCreacion.desgloseClases ?? [])
        .filter((c) => toInt(c?.Nivel) > 0)
        .map((c) => motor.claseDelCatalogo(toInt(c?.Id)))
        .filter((c): c is Clase => !!c);
}

/**
 * Lo que no cumplía cada clase que tiene (`evaluarClaseParaSeleccion`), para ver después qué deja de cumplir
 * (`clasesQueDejanDeCumplir`). Lo usan el reciclaje (`loQueDejariaDeCumplir`) y la raza mutada adquirida.
 */
export function razonesDeSusClases(motor: NuevoPersonajeService): Map<number, Set<string>> {
    return new Map(clasesQueTiene(motor).map((c) => [toInt(c.Id), new Set(motor.evaluarClaseParaSeleccion(c).razones ?? [])]));
}

/**
 * Las clases que dejan de cumplir lo que piden (una de prestigio que pide una dote, unos rangos o una raza): solo lo que no
 * fallaba antes (`antes`, de `razonesDeSusClases`). Con la raza mutada adquirida, quedan ex mientras no cumplan (*El arcano
 * completo*, pág. 17), como al adquirir una plantilla.
 */
export function clasesQueDejanDeCumplir(motor: NuevoPersonajeService, antes: Map<number, Set<string>>)
    : Array<{ idClase: number; nombre: string; razones: string[]; }> {
    return clasesQueTiene(motor).flatMap((c) => {
        const previas = antes.get(toInt(c.Id)) ?? new Set<string>();
        const razones = (motor.evaluarClaseParaSeleccion(c).razones ?? []).filter((r) => !previas.has(r));
        return razones.length > 0 ? [{ idClase: toInt(c.Id), nombre: `${c.Nombre}`, razones }] : [];
    });
}

/**
 * Lo que dejaría de cumplir sus prerrequisitos si el personaje perdiera `quita`: sus dotes (cada una en el nivel en que la
 * eligió, como la corrección: `dotesSinSusPrerrequisitos`) y sus clases (una de prestigio, con lo que pide su
 * `evaluarClaseParaSeleccion`). Solo lo que cumplía antes; el motor se queda como estaba. Frases: «Movilidad (No cumple: Esquiva)».
 */
export function loQueDejariaDeCumplir(motor: NuevoPersonajeService, quita: LoQueQuita): string[] {
    const pj = motor.PersonajeCreacion;
    const dotesAntes = new Set(motor.dotesSinSusPrerrequisitos().map(claveDoteDeLaFicha));
    const razonesAntes = razonesDeSusClases(motor);
    const guardado = {
        contextuales: [...(pj.DotesContextuales ?? [])],
        dotes: [...(pj.Dotes ?? [])],
        habilidades: (pj.Habilidades ?? []).map((h) => ({ ...h })),
        idiomas: [...(pj.Idiomas ?? [])],
        conjuros: [...(pj.Conjuros ?? [])],
    };
    try {
        if (quita.dote) {
            const d = quita.dote;
            const quitada = sacarPrimero(pj.DotesContextuales ?? [], (x) => toInt(x?.Dote?.Id) === d.idDote
                && toInt(x?.Contexto?.Id_extra) === d.idExtra && `${(x?.Contexto as any)?.Origen ?? ''}` === d.origen);
            sacarPrimero(pj.Dotes ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(quitada?.Dote?.Nombre ?? '')
                && `${x?.Origen ?? ''}` === d.origen);
        }
        if (quita.idioma)
            sacarPrimero(pj.Idiomas ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(quita.idioma ?? ''));
        if (quita.rangos) {
            const r = quita.rangos;
            const h = (pj.Habilidades ?? []).find((x) => !x?.Custom && toInt(x?.Id) === r.idHabilidad);
            if (h)
                h.Rangos = Math.max(0, toNumber(h.Rangos) - r.rangos);
        }
        (quita.conjuros ?? []).forEach((c) => sacarPrimero(pj.Conjuros ?? [], (x) => toInt(x?.Id) === c.idConjuro && esConjuroDeLaClase(x, normalizarTexto(c.clase))));

        const sinDote = (d: DoteDeLaFicha) => !quita.dote || claveDoteDeLaFicha(d) !== claveDoteDeLaFicha(quita.dote);
        const motivos = motor.dotesSinSusPrerrequisitos()
            .filter((d) => !dotesAntes.has(claveDoteDeLaFicha(d)) && sinDote(d))
            .map((d) => `${d.nombre} (${(d.razones ?? []).join('; ') || 'sus prerrequisitos'})`);
        clasesQueDejanDeCumplir(motor, razonesAntes).forEach((c) => motivos.push(`${c.nombre} (${c.razones.join('; ')})`));
        return motivos;
    } finally {
        pj.DotesContextuales = guardado.contextuales;
        pj.Dotes = guardado.dotes;
        pj.Habilidades = guardado.habilidades;
        pj.Idiomas = guardado.idiomas;
        pj.Conjuros = guardado.conjuros;
    }
}

/**
 * Las dotes del personaje (no las de su raza ni sus plantillas) y si se pueden reciclar: solo las elegidas en un hueco
 * (de nivel, adicional de una clase o de la raza: `esDoteElegida`) y que nada de lo que tiene necesite. Una que ya no
 * cumple sus prerrequisitos sí se recicla (MJ II, pág. 200).
 */
export function dotesParaReciclar(motor: NuevoPersonajeService): DoteReciclable[] {
    return motor.dotesDelPersonaje().map((d) => {
        const idDote = toInt(d?.Dote?.Id);
        const idExtra = toInt(d?.Contexto?.Id_extra);
        const origen = `${(d?.Contexto as any)?.Origen ?? ''}`;
        const fila = {
            idDote, idExtra, origen, nombre: `${d?.Dote?.Nombre ?? ''}`, extra: idExtra > 0 ? `${d?.Contexto?.Extra ?? ''}` : '',
            indiceNivel: motor.indiceNivelDeLaDote(idDote, idExtra),
        };
        if (!motor.esDoteElegida(origen))
            return { ...fila, motivo: origen.trim() ? `No se eligió: la da ${origen.trim()}.` : 'No se eligió en ningún nivel.' };
        const rotas = loQueDejariaDeCumplir(motor, { dote: { idDote, idExtra, origen } });
        return { ...fila, motivo: rotas.length > 0 ? `La necesita lo que tiene: ${rotas.join('; ')}.` : null };
    }).filter((d) => d.idDote > 0);
}

/**
 * El hueco de la dote que se recicla, en el motor: la quita y registra otra pendiente en su mismo hueco (su origen, el tipo
 * que admite: la dote adicional de una clase, otra de su lista) y en el nivel en que se eligió (sin él, a 1.er nivel),
 * con las candidatas del selector de la creación sin la que se va. Cambia el motor: quien llama lo deja como estaba.
 * `conHomebrew`: si se ofrecen las homebrew (la ficha ya lo es y la campaña lo admite).
 */
export function huecoDeLaDoteReciclada(motor: NuevoPersonajeService, dote: DoteReciclable, conHomebrew: boolean)
    : { pendiente: DotePendienteState; candidatos: DoteSelectorCandidato[]; } | null {
    if (!motor.quitarDoteDeLaFicha(dote.idDote, dote.idExtra, dote.origen))
        return null;
    const pendiente = motor.registrarDoteEnLugarDe(dote, dote.indiceNivel ?? 0);
    const candidatos = motor.obtenerCandidatosDotePendiente(pendiente.id)
        .filter((c) => !(toInt(c.dote?.Id) === dote.idDote && dote.idExtra <= 0))
        .filter((c) => conHomebrew || c.dote?.Oficial !== false);
    return { pendiente, candidatos };
}

/**
 * Los idiomas que conoce, venga de donde venga, y si se pueden olvidar (no uno secreto, `Secreto` del catálogo, ni uno que
 * pida algo que tiene), y los que puede aprender en su lugar: los que no conoce y no son secretos (MJ II, pág. 196).
 */
export function idiomasParaReciclar(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, conHomebrew: boolean)
    : { quitables: IdiomaReciclable[]; aprendibles: Array<{ idIdioma: number; nombre: string; }>; } {
    const catalogo = motor.EstadoFlujo.ventajas.catalogoIdiomas ?? [];
    const conoce = new Set((entrada.colecciones?.idiomas ?? []).map((i) => toInt(i.idIdioma)));
    const quitables = (entrada.colecciones?.idiomas ?? []).map((i) => {
        const idioma = catalogo.find((c) => toInt(c?.Id) === toInt(i.idIdioma));
        const nombre = `${idioma?.Nombre ?? `#${toInt(i.idIdioma)}`}`;
        if (idioma?.Secreto)
            return { idIdioma: toInt(i.idIdioma), nombre, motivo: 'Es un idioma secreto: no se recicla.' };
        const rotas = loQueDejariaDeCumplir(motor, { idioma: nombre });
        return { idIdioma: toInt(i.idIdioma), nombre, motivo: rotas.length > 0 ? `Lo necesita lo que tiene: ${rotas.join('; ')}.` : null };
    });
    const aprendibles = catalogo
        .filter((c) => toInt(c?.Id) > 0 && !c.Secreto && !conoce.has(toInt(c.Id)) && (conHomebrew || c.Oficial !== false))
        .map((c) => ({ idIdioma: toInt(c.Id), nombre: `${c.Nombre ?? ''}` }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return { quitables, aprendibles };
}

function nombreDeHabilidad(h: Personaje['Habilidades'][number]): string {
    return extraHabilidadElegido(h?.Extra) ? `${h.Nombre} (${h.Extra})` : `${h?.Nombre ?? ''}`;
}

/**
 * Si la habilidad sería de clase para una clase que puede subir (`habilidadesDeClaseDeLaClase` del motor; un extra en 0 o
 * sin él, cualquiera).
 */
function esHabilidadDeClaseDe(motor: NuevoPersonajeService, clase: Clase, idHabilidad: number, idExtra: number): boolean {
    return motor.habilidadesDeClaseDeLaClase(clase).some((ref) => {
        const id = toInt(ref?.['Id_habilidad'] ?? ref?.['id_habilidad'] ?? ref?.['Id']);
        const extra = toInt(ref?.['Id_extra'] ?? ref?.['id_extra']);
        return id === toInt(idHabilidad) && (extra <= 0 || extra === toInt(idExtra));
    });
}

/** Las habilidades con rangos comprados en la ficha (`entrada`), de las que se pueden traspasar rangos. */
export function habilidadesConRangos(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto): HabilidadConRangos[] {
    const habilidades = (motor.PersonajeCreacion.Habilidades ?? []).filter((h) => !h?.Custom && toInt(h?.Id) > 0);
    return (entrada.colecciones?.habilidades?.base ?? [])
        .filter((h) => toInt(h?.rangos) >= 1)
        .map((h) => {
            const delMotor = habilidades.find((x) => toInt(x.Id) === toInt(h.idHabilidad));
            return { idHabilidad: toInt(h.idHabilidad), idExtra: toInt(h.idExtra), nombre: delMotor ? nombreDeHabilidad(delMotor) : `#${toInt(h.idHabilidad)}`, rangos: toInt(h.rangos) };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Las habilidades a las que puede traspasar `rangos` desde `origen`: de clase para alguna de sus clases, contando la que
 * sube (`clasesQuePuedeSubir`: si solo lo es para una de ellas, `clases` dice cuáles), o por su raza o un dominio, como en
 * la ficha (contrato, «El reciclaje»), con su especialidad elegida y sin pasar del tope (nivel de antes + 3). Las que no
 * valen, con su motivo. Las personalizadas no: el contrato no las tiene.
 */
export function destinosDeRangos(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, origen: HabilidadConRangos,
    rangos: number, nivelPersonaje: number, clasesQuePuedeSubir: Clase[]): DestinoDeRangos[] {
    // El de una de clase con el nivel de antes de subir (MJ II, pág. 196).
    const tope = limiteRangosHabilidad(nivelPersonaje, true);
    const guardadas = entrada.colecciones?.habilidades?.base ?? [];
    return (motor.PersonajeCreacion.Habilidades ?? [])
        .filter((h) => !h?.Custom && toInt(h?.Id) > 0 && toInt(h.Id) !== origen.idHabilidad)
        .map((h) => {
            const idHabilidad = toInt(h.Id);
            // -1 sin extra y 0 («Elegir») si lo admite y falta: el contrato lleva 0 en los dos.
            const extraGuardado = idExtraHabilidadParaGuardar(h);
            const idExtra = Math.max(0, extraGuardado);
            const guardada = guardadas.find((g) => toInt(g?.idHabilidad) === idHabilidad);
            const tiene = toInt(guardada?.rangos ?? h.Rangos);
            const base = { idHabilidad, idExtra, nombre: nombreDeHabilidad(h), rangos: tiene };
            if (h.Soporta_extra && extraGuardado <= 0)
                return { ...base, clases: null, motivo: 'Aún no tiene elegida su especialidad.' };
            // De clase como en la ficha: por sus clases (con sus dominios) o su raza (el motor, `esHabilidadDeClaseEnAlguna`).
            const deLasSuyas = motor.esHabilidadDeClaseEnAlguna(h);
            const deLaQueSube = deLasSuyas ? [] : clasesQuePuedeSubir.filter((c) => esHabilidadDeClaseDe(motor, c, idHabilidad, idExtra))
                .map((c) => ({ id: toInt(c.Id), nombre: `${c.Nombre}` }));
            if (!deLasSuyas && deLaQueSube.length < 1)
                return { ...base, clases: null, motivo: 'No es de clase para ninguna de sus clases, ni por su raza o un dominio, ni para las que puede subir.' };
            if (tiene + rangos > tope)
                return { ...base, clases: deLasSuyas ? null : deLaQueSube, motivo: `Con ${rangos} más pasaría de ${tope} rangos (su nivel, ${toInt(nivelPersonaje)}, + 3).` };
            return { ...base, clases: deLasSuyas ? null : deLaQueSube, motivo: null };
        })
        .sort((a, b) => Number(!!a.motivo) - Number(!!b.motivo) || a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Sus clases con conocidos limitados (`Conjuros.Conocidos_total` o `Conocidos_nivel_a_nivel`: una tabla de conocidos) y
 * sus conocidos (no los copiados al libro), cada uno con su nivel en la lista de la clase y si se puede olvidar.
 */
export function conocidosParaReciclar(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto): ClaseConConocidos[] {
    const catalogo = motor.CatalogoConjuros;
    return clasesQueTiene(motor)
        .filter((c) => !!(c.Conjuros?.Conocidos_total || c.Conjuros?.Conocidos_nivel_a_nivel))
        .map((c) => {
            const clase = { id: toInt(c.Id), nombre: `${c.Nombre}` };
            const conocidos = (entrada.colecciones?.conjurosConocidos ?? [])
                .filter((x) => !x.copiado && toInt(x.idClase) === clase.id)
                .map((x) => {
                    const conjuro = catalogo.find((k) => toInt(k?.Id) === toInt(x.idConjuro));
                    const nivel = nivelDelConjuroEnLaClase(conjuro, clase);
                    const nombre = `${conjuro?.Nombre ?? `#${toInt(x.idConjuro)}`}`;
                    if (nivel < 0)
                        return { idConjuro: toInt(x.idConjuro), nombre, nivel, motivo: `No está en la lista de ${clase.nombre.toLowerCase()}.` };
                    const rotas = loQueDejariaDeCumplir(motor, { conjuros: [{ idConjuro: toInt(x.idConjuro), clase: clase.nombre }] });
                    return { idConjuro: toInt(x.idConjuro), nombre, nivel, motivo: rotas.length > 0 ? `Lo necesita lo que tiene: ${rotas.join('; ')}.` : null };
                })
                .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, 'es'));
            return { ...clase, conocidos };
        })
        .filter((c) => c.conocidos.length > 0);
}

/** Los que puede aprender en lugar de un conocido de la clase: de su lista, del mismo nivel y que no conozca ya. */
export function conjurosParaAprender(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, clase: { id: number; nombre: string; },
    nivel: number, conHomebrew: boolean, yaElegidos: number[] = []): Conjuro[] {
    const catalogo = motor.CatalogoConjuros;
    const conoce = new Set([...(entrada.colecciones?.conjurosConocidos ?? [])
        .filter((x) => !x.copiado && toInt(x.idClase) === clase.id).map((x) => toInt(x.idConjuro)), ...yaElegidos.map((id) => toInt(id))]);
    return catalogo
        .filter((c) => (conHomebrew || c?.Oficial !== false) && !conoce.has(toInt(c?.Id)) && nivelDelConjuroEnLaClase(c, clase) === nivel)
        .sort((a, b) => `${a.Nombre}`.localeCompare(`${b.Nombre}`, 'es'));
}

/**
 * Hace el reciclaje en el motor, antes del nivel: así el nivel sigue ya con el cambio (los topes de rangos, los conocidos
 * del intercambio, los prerrequisitos de lo que elija). La dote, en su hueco con el selector de la creación
 * (`huecoDeLaDoteReciclada` y lo elegido en él); el idioma, los rangos y los conocidos, cambiados en el personaje.
 * `false` si no se puede (lo elegido ya no vale con el personaje de ahora).
 */
export function aplicarReciclajeAlMotor(motor: NuevoPersonajeService, plan: PlanReciclaje): boolean {
    const pj = motor.PersonajeCreacion;
    if (plan.tipo === 'dote') {
        const hueco = huecoDeLaDoteReciclada(motor, plan.quita, true);
        return !!hueco && motor.aplicarDotePendiente(hueco.pendiente.id, plan.seleccion);
    }
    if (plan.tipo === 'idioma') {
        const idioma = (motor.EstadoFlujo.ventajas.catalogoIdiomas ?? []).find((c) => toInt(c?.Id) === plan.pone.idIdioma);
        const quitado = sacarPrimero(pj.Idiomas ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(plan.quita.nombre));
        if (!idioma || !quitado)
            return false;
        pj.Idiomas.push({ Nombre: `${idioma.Nombre}`, Descripcion: `${idioma.Descripcion ?? ''}`, Secreto: !!idioma.Secreto,
            Oficial: idioma.Oficial !== false, ...(quitado.Origen ? { Origen: quitado.Origen } : {}) });
        return true;
    }
    if (plan.tipo === 'rangos') {
        const buscar = (id: number) => (pj.Habilidades ?? []).find((h) => !h?.Custom && toInt(h?.Id) === id);
        const origen = buscar(plan.quita.idHabilidad);
        const destino = buscar(plan.pone.idHabilidad);
        if (!origen || !destino || toNumber(origen.Rangos) < plan.rangos)
            return false;
        origen.Rangos = toNumber(origen.Rangos) - plan.rangos;
        destino.Rangos = toNumber(destino.Rangos) + plan.rangos;
        return true;
    }
    const catalogo = motor.CatalogoConjuros;
    for (const c of plan.cambios) {
        const nuevo = catalogo.find((k) => toInt(k?.Id) === c.aprende.id);
        if (!nuevo || !sacarPrimero(pj.Conjuros ?? [], (x) => toInt(x?.Id) === c.olvida.id && esConjuroDeLaClase(x, normalizarTexto(c.clase))))
            return false;
        pj.Conjuros.push({ ...JSON.parse(JSON.stringify(nuevo)), Clase_origen: c.clase, Origen_clase: c.clase } as Conjuro);
    }
    return true;
}
