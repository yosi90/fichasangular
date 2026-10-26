import { unirTipo } from 'src/app/components/detalles/ficha/ficha';
import { esVisibleEnPersonaje, textoClasePersonaje } from 'src/app/components/detalles/ficha/personaje';
import { Personaje } from 'src/app/interfaces/personaje';
import { toNumber } from 'src/app/services/utils/normalizacion';

/*
 * El marco común de la creación de personaje (lienzo aprobado por el propietario el 2026-10-26): cabecera, fila de
 * pasos, franja, cuerpo en dos columnas y pie. Guía: «La creación de personaje» en
 * `docs/guias-estilo/GUIA_ESTILO_WEB_GENERAL.md`. La creación es estrictamente paso a paso: la fila de pasos solo
 * informa, no deja volver atrás ni saltar.
 */

export type PasoCreacionId = 'raza' | 'basicos' | 'plantillas' | 'ventajas' | 'clases' | 'habilidades' | 'conjuros' | 'equipo';

export interface PasoCreacion {
    id: PasoCreacionId;
    nombre: string;
}

/** Todos los pasos, en su orden. La tienda es el último, «Equipo». */
export const PASOS_CREACION: readonly PasoCreacion[] = [
    { id: 'raza', nombre: 'Raza' },
    { id: 'basicos', nombre: 'Básicos' },
    { id: 'plantillas', nombre: 'Plantillas' },
    { id: 'ventajas', nombre: 'Ventajas' },
    { id: 'clases', nombre: 'Clases' },
    { id: 'habilidades', nombre: 'Habilidades' },
    { id: 'conjuros', nombre: 'Conjuros' },
    { id: 'equipo', nombre: 'Equipo' },
];

/** Los pasos que pueden no aplicarse a un personaje: sin ellos, no salen (y la cuenta «de Y» no los cuenta). */
export interface OpcionesPasosCreacion {
    /** La campaña puede prohibir las ventajas y desventajas. */
    conVentajas: boolean;
    /** Solo si tiene conjuros que elegir (un guerrero no los tiene). */
    conConjuros: boolean;
}

export type EstadoPasoCreacion = 'hecho' | 'actual' | 'falta';

export interface PasoCreacionPintado extends PasoCreacion {
    numero: number;
    estado: EstadoPasoCreacion;
}

/** Los pasos que salen para este personaje; el actual sale siempre. */
export function pasosCreacionVisibles(opciones: OpcionesPasosCreacion, actual?: PasoCreacionId | null): PasoCreacion[] {
    return PASOS_CREACION.filter((paso) => paso.id === actual
        || (paso.id === 'ventajas' ? opciones.conVentajas : paso.id === 'conjuros' ? opciones.conConjuros : true));
}

/** Los pasos que salen, numerados y con su estado: los de antes del actual, hechos; los de después, por hacer. */
export function pintarPasosCreacion(opciones: OpcionesPasosCreacion, actual: PasoCreacionId): PasoCreacionPintado[] {
    const pasos = pasosCreacionVisibles(opciones, actual);
    const indiceActual = pasos.findIndex((paso) => paso.id === actual);
    return pasos.map((paso, indice) => ({
        ...paso,
        numero: indice + 1,
        estado: indice < indiceActual ? 'hecho' : indice === indiceActual ? 'actual' : 'falta',
    }));
}

/**
 * El paso que se ve, según la pestaña interna de la creación (`selectedInternalTabIndex`: 0 raza … 6 conjuros) y si
 * está abierta la tienda. Mientras se eligen las dotes de un nivel sin conjuros (`dotes`), sigue siendo el de Clases.
 */
export function pasoCreacionDeLaPestana(indice: number, opciones: { enTienda: boolean; eligiendoDotesSinConjuros: boolean; }): PasoCreacionId {
    if (opciones.enTienda)
        return 'equipo';
    const ids: PasoCreacionId[] = ['raza', 'basicos', 'plantillas', 'ventajas', 'clases', 'habilidades', 'conjuros'];
    const paso = ids[indice] ?? 'raza';
    return paso === 'conjuros' && opciones.eligiendoDotesSinConjuros ? 'clases' : paso;
}

/** La línea corta de la cabecera: «Humano · Guerrero 5 · Neutral bueno»; sin raza, «Elige la raza». */
export function lineaPersonajeCreacion(pj: Personaje | null | undefined): string {
    const raza = esVisibleEnPersonaje(pj?.Raza?.Nombre) ? `${pj?.Raza?.Nombre}`.trim() : '';
    if (!raza)
        return 'Elige la raza';
    const clases = (pj?.desgloseClases ?? [])
        .filter((clase) => esVisibleEnPersonaje(clase?.Nombre) && toNumber(clase?.Nivel) > 0)
        .map((clase) => textoClasePersonaje(clase))
        .join(' / ');
    const alineamiento = esVisibleEnPersonaje(pj?.Alineamiento) ? `${pj?.Alineamiento}`.trim() : '';
    return unirTipo([raza, clases, alineamiento]);
}

/**
 * El texto del botón para seguir: «Continuar: Plantillas». Tras Habilidades y Conjuros el siguiente depende del nivel
 * (otro nivel de clase, sus conjuros, sus dotes o el final), así que solo dice «Continuar».
 */
export function textoContinuarCreacion(actual: PasoCreacionId, opciones: OpcionesPasosCreacion): string {
    if (actual === 'habilidades' || actual === 'conjuros')
        return 'Continuar';
    const pasos = pasosCreacionVisibles(opciones, actual);
    const siguiente = pasos[pasos.findIndex((paso) => paso.id === actual) + 1];
    return siguiente ? `Continuar: ${siguiente.nombre}` : 'Continuar';
}
