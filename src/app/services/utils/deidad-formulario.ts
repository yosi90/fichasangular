import { DeidadCuerpo, DeidadDetalle } from 'src/app/interfaces/deidad';
import { idDeReferencia, idsUnicosOrdenados, toInt, toPositiveInt } from './normalizacion';

/**
 * El formulario de «Insertar/Modificar deidad» (hito 9 del roadmap de inserciones): de la deidad que da la API a los
 * valores del formulario y de ellos al cuerpo de `POST /deidades/add` y `PUT /deidades/<id>`. Guardar sin tocar nada manda
 * lo que llegó (comprobado con todas las deidades de `rol_dev` en `src/testing/ida-y-vuelta-criaturas-mundo.ts`).
 */

/** Los valores del formulario: los de `deidad` del cuerpo (lo que falta, `null`). */
export interface ValoresDeidad {
    nombre: string;
    descripcion: string;
    id_manual: number | null;
    pagina: number | null;
    /** `null`: «No aplica». */
    id_alineamiento: number | null;
    /** 0 es «Elegir» (la elige quien la venera); `null`, sin arma. */
    id_arma: number | null;
    /** `null`: sin panteón. */
    id_pabellon: number | null;
    id_genero: number | null;
    oficial: boolean;
}

/** Las listas de la deidad: ids de sus catálogos. */
export interface ListasDeidad {
    ambitos: readonly number[];
    dominios: readonly number[];
    alineamientos_devotos: readonly number[];
}

export function valoresVaciosDeDeidad(): ValoresDeidad {
    return {
        nombre: '', descripcion: '', id_manual: null, pagina: null, id_alineamiento: null, id_arma: null, id_pabellon: null,
        id_genero: null, oficial: true,
    };
}

export function valoresDeDeidad(deidad: DeidadDetalle): ValoresDeidad {
    return {
        nombre: `${deidad.Nombre ?? ''}`,
        descripcion: `${deidad.Descripcion ?? ''}`,
        id_manual: toPositiveInt(deidad.Manual?.Id),
        pagina: toInt(deidad.Manual?.Pagina),
        // Lo que la API da `null` por ser de relleno («No aplica», sin arma, sin panteón) llega con id 0 y sin nombre.
        id_alineamiento: idDeReferencia(deidad.Alineamiento),
        id_arma: idDeReferencia(deidad.Arma),
        id_pabellon: idDeReferencia(deidad.Pabellon),
        id_genero: toPositiveInt(deidad.Genero?.Id),
        oficial: deidad.Oficial === true,
    };
}

export function listasDeDeidad(deidad: DeidadDetalle): ListasDeidad {
    return {
        ambitos: (deidad.Ambitos ?? []).map((ambito) => toInt(ambito.Id)),
        dominios: (deidad.Dominios ?? []).map((dominio) => toInt(dominio.Id)),
        alineamientos_devotos: (deidad.Alineamientos_devotos ?? []).map((alineamiento) => toInt(alineamiento.Id)),
    };
}

/** El cuerpo de `POST /deidades/add` y `PUT /deidades/<id>`, con las listas de menor a mayor. */
export function cuerpoDeDeidad(valores: ValoresDeidad, listas: ListasDeidad): DeidadCuerpo {
    return {
        deidad: {
            nombre: `${valores.nombre ?? ''}`.trim(),
            descripcion: `${valores.descripcion ?? ''}`.trim(),
            id_manual: toInt(valores.id_manual),
            pagina: toInt(valores.pagina),
            id_alineamiento: valores.id_alineamiento ?? null,
            id_arma: valores.id_arma ?? null,
            id_pabellon: valores.id_pabellon ?? null,
            id_genero: toInt(valores.id_genero),
            oficial: valores.oficial === true,
        },
        ambitos: idsUnicosOrdenados(listas.ambitos),
        dominios: idsUnicosOrdenados(listas.dominios),
        alineamientos_devotos: idsUnicosOrdenados(listas.alineamientos_devotos),
    };
}
