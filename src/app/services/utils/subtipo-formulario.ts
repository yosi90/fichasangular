import { SubtipoCuerpo, SubtipoDetalle } from 'src/app/interfaces/subtipo';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { CAMPOS_VELOCIDAD } from './movimientos-mapper';
import { idsUnicosOrdenados, toInt, toPositiveInt, toText } from './normalizacion';
import { CARACTERISTICAS_PLANTILLA } from './plantilla-formulario';

/**
 * El formulario de «Insertar/Modificar subtipo» (hito 9 del roadmap de inserciones): del subtipo que da la API a los
 * valores del formulario y de ellos al cuerpo de `POST /subtipos/add` y `PUT /subtipos/<id>`. Guardar sin tocar nada manda
 * lo que llegó (comprobado con todos los subtipos de `rol_dev` en `src/testing/ida-y-vuelta-criaturas-mundo.ts`). Las
 * habilidades personalizadas no van en el cuerpo: la API las conserva.
 */

/** Lo que suma el subtipo al combate (con signo), con su etiqueta. */
export const COMBATE_SUBTIPO = [
    { clave: 'ajuste_nivel', etiqueta: 'Ajuste de nivel' },
    { clave: 'ataque_base', etiqueta: 'Ataque base' },
    { clave: 'presa', etiqueta: 'Presa' },
    { clave: 'iniciativa', etiqueta: 'Iniciativa' },
    { clave: 'fortaleza', etiqueta: 'Fortaleza' },
    { clave: 'reflejos', etiqueta: 'Reflejos' },
    { clave: 'voluntad', etiqueta: 'Voluntad' },
] as const;

/** Los textos libres de la fila: vacíos, «no modifica» (la API guarda el texto de relleno). */
export const TEXTOS_SUBTIPO = [
    { clave: 'ca', etiqueta: 'Clase de armadura' },
    { clave: 'rd', etiqueta: 'Reducción de daño' },
    { clave: 'rc', etiqueta: 'Resistencia a conjuros' },
    { clave: 're', etiqueta: 'Resistencia a energías' },
    { clave: 'cd', etiqueta: 'CD de sus aptitudes' },
    { clave: 'tesoro', etiqueta: 'Tesoro' },
] as const;

type ClaveNumerica = typeof CARACTERISTICAS_PLANTILLA[number]['modificador'] | typeof CARACTERISTICAS_PLANTILLA[number]['minimo']
    | typeof COMBATE_SUBTIPO[number]['clave'] | typeof CAMPOS_VELOCIDAD[number];
type ClaveTexto = typeof TEXTOS_SUBTIPO[number]['clave'];

/** Los valores del formulario: los de `subtipo` del cuerpo (lo que falta, `null`; los textos, vacíos). */
export type ValoresSubtipo = Record<ClaveNumerica, number | null> & Record<ClaveTexto, string> & {
    nombre: string;
    descripcion: string;
    id_manual: number | null;
    pagina: number | null;
    heredada: boolean;
    /** `null`: no vuela. */
    id_maniobrabilidad: number | null;
    id_alineamiento: number | null;
    oficial: boolean;
};

/** Una dote, una habilidad o una sortílega del subtipo, como fila de su lista (`uid` para el `trackBy`). */
export interface FilaDoteSubtipo { uid: string; id: number; nombre: string; id_extra: number; }
export interface FilaHabilidadSubtipo { uid: string; id: number; nombre: string; id_extra: number; cantidad: number; varios: string; }
export interface FilaSortilegaSubtipo { uid: string; id: number; nombre: string; nivel_lanzador: number; usos_diarios: string; }

/** Un idioma, un rasgo o una plantilla del subtipo: su id y, si ya se sabe, su nombre. */
export interface ElementoSubtipo { id: number; nombre?: string; }

/** Las listas del subtipo. */
export interface ListasSubtipo {
    idiomas: readonly ElementoSubtipo[];
    rasgos: readonly ElementoSubtipo[];
    plantillas: readonly ElementoSubtipo[];
    dotes: readonly FilaDoteSubtipo[];
    habilidades: readonly FilaHabilidadSubtipo[];
    sortilegas: readonly FilaSortilegaSubtipo[];
}

const NUMERICAS: readonly ClaveNumerica[] = [
    ...CARACTERISTICAS_PLANTILLA.flatMap((c) => [c.modificador, c.minimo]),
    ...COMBATE_SUBTIPO.map((c) => c.clave),
    ...CAMPOS_VELOCIDAD,
];

export function valoresVaciosDeSubtipo(): ValoresSubtipo {
    return {
        ...Object.fromEntries(NUMERICAS.map((clave) => [clave, 0])),
        ...Object.fromEntries(TEXTOS_SUBTIPO.map(({ clave }) => [clave, ''])),
        nombre: '', descripcion: '', id_manual: null, pagina: null, heredada: true, id_maniobrabilidad: null,
        id_alineamiento: null, oficial: true,
    } as ValoresSubtipo;
}

export function valoresDeSubtipo(subtipo: SubtipoDetalle): ValoresSubtipo {
    const valores = valoresVaciosDeSubtipo();
    CARACTERISTICAS_PLANTILLA.forEach(({ caracteristica, modificador, minimo }) => {
        valores[modificador] = toInt(subtipo.Modificadores_caracteristicas?.[caracteristica]);
        valores[minimo] = toInt(subtipo.Minimos_caracteristicas?.[caracteristica]);
    });
    const combate: Record<typeof COMBATE_SUBTIPO[number]['clave'], unknown> = {
        ajuste_nivel: subtipo.Ajuste_nivel, ataque_base: subtipo.Ataque_base, presa: subtipo.Presa,
        iniciativa: subtipo.Iniciativa, fortaleza: subtipo.Fortaleza, reflejos: subtipo.Reflejos, voluntad: subtipo.Voluntad,
    };
    COMBATE_SUBTIPO.forEach(({ clave }) => valores[clave] = toInt(combate[clave]));
    const textos: Record<ClaveTexto, unknown> = {
        ca: subtipo.Ca, rd: subtipo.Rd, rc: subtipo.Rc, re: subtipo.Re, cd: subtipo.Cd, tesoro: subtipo.Tesoro,
    };
    TEXTOS_SUBTIPO.forEach(({ clave }) => valores[clave] = toText(textos[clave]));
    const movimientos = subtipo.Movimientos as unknown as Record<string, unknown>;
    CAMPOS_VELOCIDAD.forEach((clave) => valores[clave] = toInt(movimientos?.[clave.charAt(0).toUpperCase() + clave.slice(1)]));
    return {
        ...valores,
        nombre: `${subtipo.Nombre ?? ''}`,
        descripcion: `${subtipo.Descripcion ?? ''}`,
        id_manual: toPositiveInt(subtipo.Manual?.Id),
        pagina: toInt(subtipo.Manual?.Pagina),
        heredada: subtipo.Heredada === true,
        // Sin vuelo, la API da la maniobrabilidad `null` (el mapper la deja vacía).
        id_maniobrabilidad: toPositiveInt(subtipo.Maniobrabilidad?.['Id']),
        id_alineamiento: toInt(subtipo.Alineamiento?.Id),
        oficial: subtipo.Oficial === true,
    };
}

/** Las listas del subtipo que da la API, con un `uid` por fila (`nuevoUid`). */
export function listasDeSubtipo(subtipo: SubtipoDetalle, nuevoUid: () => string): ListasSubtipo {
    return {
        idiomas: elementos(subtipo.Idiomas),
        rasgos: elementos(subtipo.Rasgos),
        plantillas: elementos(subtipo.Plantillas),
        dotes: (subtipo.Dotes ?? []).map((dote) => ({
            // Sin extra, la API da el `Id_extra` `null` (el mapper, 0): -1, como en el monstruo.
            uid: nuevoUid(), id: toInt(dote.Dote?.Id), nombre: toText(dote.Dote?.Nombre),
            id_extra: toPositiveInt(dote.Contexto?.Id_extra) ?? -1,
        })),
        habilidades: (subtipo.Habilidades?.Base ?? []).map((habilidad) => ({
            uid: nuevoUid(), id: toInt(habilidad.Id_habilidad), nombre: toText(habilidad.Habilidad),
            id_extra: toPositiveInt(habilidad.Id_extra) ?? ID_EXTRA_HABILIDAD_SIN_EXTRA,
            cantidad: toInt(habilidad.Cantidad), varios: toText(habilidad.Varios),
        })),
        sortilegas: (subtipo.Sortilegas ?? []).map((sortilega) => ({
            uid: nuevoUid(), id: toInt((sortilega.Conjuro as { Id?: unknown; })?.Id), nombre: toText(sortilega.Conjuro?.Nombre),
            nivel_lanzador: toInt(sortilega.Nivel_lanzador), usos_diarios: toText(sortilega.Usos_diarios),
        })),
    };
}

function elementos(lista: readonly { Id?: unknown; Nombre?: unknown; }[] | null | undefined): ElementoSubtipo[] {
    return (lista ?? []).map((elemento) => ({ id: toInt(elemento?.Id), nombre: toText(elemento?.Nombre) }));
}

export function listasVaciasDeSubtipo(): ListasSubtipo {
    return { idiomas: [], rasgos: [], plantillas: [], dotes: [], habilidades: [], sortilegas: [] };
}

/** El texto de un campo libre: vacío, `null` (la API guarda el texto de relleno que la lectura vuelve a dar `null`). */
function textoONulo(valor: unknown): string | null {
    return `${valor ?? ''}`.trim() || null;
}

/** El cuerpo de `POST /subtipos/add` y `PUT /subtipos/<id>`: las listas de ids, de menor a mayor; las filas, en su orden. */
export function cuerpoDeSubtipo(valores: ValoresSubtipo, listas: ListasSubtipo): SubtipoCuerpo {
    const numericas = Object.fromEntries(NUMERICAS.map((clave) => [clave, toInt(valores[clave])]));
    const textos = Object.fromEntries(TEXTOS_SUBTIPO.map(({ clave }) => [clave, textoONulo(valores[clave])]));
    return {
        subtipo: {
            ...numericas,
            ...textos,
            nombre: `${valores.nombre ?? ''}`.trim(),
            descripcion: `${valores.descripcion ?? ''}`.trim(),
            id_manual: toInt(valores.id_manual),
            pagina: toInt(valores.pagina),
            heredada: valores.heredada === true,
            id_maniobrabilidad: valores.id_maniobrabilidad ?? null,
            id_alineamiento: toInt(valores.id_alineamiento),
            oficial: valores.oficial === true,
        } as SubtipoCuerpo['subtipo'],
        idiomas: idsUnicosOrdenados(listas.idiomas.map((elemento) => elemento.id)),
        rasgos: idsUnicosOrdenados(listas.rasgos.map((elemento) => elemento.id)),
        plantillas: idsUnicosOrdenados(listas.plantillas.map((elemento) => elemento.id)),
        dotes: listas.dotes.map((fila) => ({ id_dote: fila.id, id_extra: toInt(fila.id_extra, -1) })),
        habilidades: listas.habilidades.map((fila) => ({
            id_habilidad: fila.id, id_extra: toInt(fila.id_extra, -1), cantidad: toInt(fila.cantidad), varios: textoONulo(fila.varios),
        })),
        sortilegas: listas.sortilegas.map((fila) => ({
            id_conjuro: fila.id, nivel_lanzador: toInt(fila.nivel_lanzador), usos_diarios: textoONulo(fila.usos_diarios),
        })),
    };
}
