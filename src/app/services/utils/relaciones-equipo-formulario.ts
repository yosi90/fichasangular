import { EquipoAura, EquipoObjetivoModificador, EquipoRef, ModificadorCuerpo, ModificadorEstructurado, RequisitosCuerpo } from 'src/app/interfaces/equipo';
import { textoConSigno } from './equipo-texto';
import { tiposValidosConObjetivo } from './equipo-mapper';
import { conOpcionDeLaFila } from './opcion-sin-valor';
import { toNullableText, toNumber, toNumberOrNull, toText } from './normalizacion';

/**
 * Lo que comparten las aptitudes especiales de armas y armaduras y los objetos en su alta y su edición (segunda parte del
 * hito 7 del roadmap de inserciones; `docs/publica/endpoints/catalogos.md`, «Alta y edición de munición, materiales…»):
 * las escuelas del aura, los requisitos de creación (dotes y conjuros con su grupo de alternativas) y los modificadores
 * estructurados. Las filas guardan el nombre que llega con la entrada, para enseñarla antes de que lleguen los catálogos.
 */

/** Un elemento elegido de un catálogo (una escuela del aura, una dote requerida). */
export interface ElegidoDeCatalogo {
    id: number;
    nombre: string;
}

/** Un conjuro requerido: `opcional` 0 es obligatorio; los alternativos llevan el mismo número de grupo. */
export interface FilaConjuroRequerido extends ElegidoDeCatalogo {
    opcional: number;
}

/** Un modificador en su fila (capa de resistencia +1: salvaciones, resistencia, +1). */
export interface FilaModificador {
    uid: string;
    id_objetivo: number | null;
    id_tipo_bonificador: number | null;
    valor: number | null;
    id_caracteristica: number | null;
    id_habilidad: number | null;
    id_tipo_dano: number | null;
    condicion: string;
}

/** Lo que pinta `<app-equipo-magia>`: el aura, los requisitos y los modificadores de una entrada. */
export interface RelacionesMagicas {
    escuelas: ElegidoDeCatalogo[];
    dotes: ElegidoDeCatalogo[];
    conjuros: FilaConjuroRequerido[];
    modificadores: FilaModificador[];
}

export function relacionesVacias(): RelacionesMagicas {
    return { escuelas: [], dotes: [], conjuros: [], modificadores: [] };
}

function elegidos(lista: readonly EquipoRef[] | null | undefined): ElegidoDeCatalogo[] {
    return (lista ?? []).map((item) => ({ id: toNumber(item.Id), nombre: toText(item.Nombre) }));
}

/** Las relaciones de una entrada leída de la API (`Aura`, `Requisitos` y `Modificadores`). */
export function relacionesDeLectura(
    aura: EquipoAura | null | undefined,
    requisitos: { Dotes: EquipoRef[]; Conjuros: (EquipoRef & { Opcional?: number; })[]; } | null | undefined,
    modificadores: readonly ModificadorEstructurado[] | null | undefined,
    uid: () => string,
): RelacionesMagicas {
    return {
        escuelas: elegidos(aura?.Escuelas),
        dotes: elegidos(requisitos?.Dotes),
        conjuros: (requisitos?.Conjuros ?? []).map((conjuro) => ({
            id: toNumber(conjuro.Id),
            nombre: toText(conjuro.Nombre),
            opcional: Math.max(0, toNumber(conjuro.Opcional)),
        })),
        modificadores: (modificadores ?? []).map((m) => ({
            uid: uid(),
            id_objetivo: toNumberOrNull(m.Objetivo?.Id),
            id_tipo_bonificador: toNumberOrNull(m.Tipo_bonificador?.Id),
            valor: toNumberOrNull(m.Valor),
            id_caracteristica: toNumberOrNull(m.Caracteristica?.Id),
            id_habilidad: toNumberOrNull(m.Habilidad?.Id),
            id_tipo_dano: toNumberOrNull(m.Tipo_dano?.Id),
            condicion: toText(m.Condicion),
        })),
    };
}

export function filaModificadorVacia(uid: string): FilaModificador {
    return {
        uid, id_objetivo: null, id_tipo_bonificador: null, valor: null, id_caracteristica: null, id_habilidad: null,
        id_tipo_dano: null, condicion: '',
    };
}

export function modificadoresDelCuerpo(filas: readonly FilaModificador[]): ModificadorCuerpo[] {
    return filas.map((fila) => ({
        id_objetivo: toNumber(fila.id_objetivo),
        id_tipo_bonificador: toNumber(fila.id_tipo_bonificador),
        valor: toNumber(fila.valor),
        id_caracteristica: toNumberOrNull(fila.id_caracteristica),
        id_habilidad: toNumberOrNull(fila.id_habilidad),
        id_tipo_dano: toNumberOrNull(fila.id_tipo_dano),
        condicion: toNullableText(fila.condicion),
    }));
}

export function requisitosDelCuerpo(relaciones: RelacionesMagicas): RequisitosCuerpo {
    return {
        dotes: relaciones.dotes.map((dote) => dote.id),
        conjuros: relaciones.conjuros.map((conjuro) => ({ id_conjuro: conjuro.id, opcional: Math.max(0, toNumber(conjuro.opcional)) })),
    };
}

export function escuelasDelCuerpo(relaciones: RelacionesMagicas): number[] {
    return relaciones.escuelas.map((escuela) => escuela.id);
}

/**
 * La cabecera de un modificador en su fila, igual en los dos editores (los modificadores de `<app-equipo-magia>` y los
 * bonificadores de `nueva-racial`; guía de inserciones): «1 · Ataque +1 (racial)», con la frase de la API (el objetivo,
 * la cifra con su signo y el tipo entre paréntesis) y, si el objetivo pide una característica o una habilidad, «de …»
 * («2 · Pruebas de característica y habilidades de Fuerza +1 (sin tipo)»). Sin objetivo, «Sin objetivo»; sin cifra o sin
 * tipo, sin ellos.
 */
export function resumenDeModificador(objetivos: readonly EquipoRef[], tipos: readonly EquipoRef[], fila: {
    id_objetivo: number | null; id_tipo_bonificador: number | null; cifra: number | string | null; de?: string | null;
}, indice: number): string {
    const de = toText(fila.de).trim();
    const objetivo = (objetivos.find((item) => item.Id === fila.id_objetivo)?.Nombre ?? 'Sin objetivo') + (de ? ` de ${de}` : '');
    const tipo = tipos.find((item) => item.Id === fila.id_tipo_bonificador)?.Nombre;
    const cifra = fila.cifra === null || fila.cifra === undefined || `${fila.cifra}`.trim() === '' ? '' : ` ${textoConSigno(Number(fila.cifra))}`;
    return `${indice + 1} · ${objetivo}${cifra}${tipo ? ` (${tipo.toLowerCase()})` : ''}`;
}

/**
 * Los tipos de bonificador que se ofrecen en una fila: los que valen con su objetivo (sin sus `Tipos_no_validos`: la
 * «Mejora» a la CA, que va como la de la armadura, la del escudo o la de la armadura natural) y, si la fila ya trae uno que
 * no está, ese, para no perderlo. Los dos editores.
 */
export function tiposDeLaFila<T extends EquipoRef>(tipos: readonly T[], objetivos: readonly EquipoObjetivoModificador[],
    idObjetivo: number | null, idTipo: number | null): EquipoRef[] {
    const objetivo = objetivos.find((item) => item.Id === idObjetivo);
    return conOpcionDeLaFila(tiposValidosConObjetivo(tipos, objetivo), idTipo);
}

/** Un problema de una lista, con el `field` de la API en el que se enseña («modificadores[1]»). */
export interface ProblemaDeRelaciones {
    campo: string;
    mensaje: string;
}

/**
 * Lo que la API rechaza de los modificadores y se puede ver antes de mandar: el objetivo, el tipo de bonificador y la
 * cifra, obligatorios. Qué objetivo pide una característica o una habilidad lo comprueba la base (su error trae el
 * `field` de la fila).
 */
export function problemaDeModificadores(filas: readonly FilaModificador[]): ProblemaDeRelaciones | null {
    for (let indice = 0; indice < filas.length; indice++) {
        const fila = filas[indice];
        if (toNumberOrNull(fila.id_objetivo) === null || toNumberOrNull(fila.id_tipo_bonificador) === null || toNumberOrNull(fila.valor) === null)
            return { campo: `modificadores[${indice}]`, mensaje: `El modificador ${indice + 1} lleva su objetivo, su tipo de bonificador y su cifra.` };
    }
    return null;
}
