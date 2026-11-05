import { ChakraCuerpo, ChakraDetalle, Fusion, FusionChakraCuerpo, FusionCuerpo } from 'src/app/interfaces/incarnum';
import { toInt, toNullableText, toPositiveInt } from './normalizacion';

/**
 * Los formularios de «Insertar/Modificar fusión» y «… chakra» (hito 8 del roadmap de inserciones; contrato en
 * `docs/publica/INCARNUM.md`): de lo que da la API a los valores del formulario y de ellos al cuerpo del alta y la
 * edición. Guardar sin tocar nada manda lo que llegó (comprobado con datos reales en
 * `src/testing/ida-y-vuelta-rasgos-ventajas-incarnum.ts`). Los datos de juego (`Datos_*`) no van en el cuerpo: la API los
 * conserva.
 */

/** Las salvaciones y los efectos de una salvación que admite el contrato (`Salvacion` de la fusión). */
export const SALVACIONES_FUSION: readonly string[] = ['Fortaleza', 'Reflejos', 'Voluntad'];
export const EFECTOS_SALVACION_FUSION: readonly string[] = ['Niega', 'Mitad', 'Parcial', 'Ver texto'];

export interface ValoresFusion {
    nombre: string;
    nombre_original: string;
    traducido: boolean;
    descripcion: string;
    efecto_basico: string;
    efecto_esencia: string;
    origen_descripcion: string;
    salvacion_tipo: string | null;
    salvacion_efecto: string | null;
    alineado_portador: boolean;
    id_manual: number | null;
    pagina: number | null;
    oficial: boolean;
}

/** Un chakra de la fusión en el formulario: una fila con su `uid`. */
export interface FilaChakraFusion {
    uid: string;
    id_chakra: number | null;
    ocupa: boolean;
    vinculo: boolean;
    efecto_vinculo: string;
}

export function valoresVaciosDeFusion(): ValoresFusion {
    return {
        nombre: '', nombre_original: '', traducido: false, descripcion: '', efecto_basico: '', efecto_esencia: '',
        origen_descripcion: 'propia', salvacion_tipo: null, salvacion_efecto: null, alineado_portador: false,
        id_manual: null, pagina: null, oficial: true,
    };
}

export function valoresDeFusion(fusion: Fusion): ValoresFusion {
    return {
        nombre: `${fusion.Nombre ?? ''}`,
        nombre_original: `${fusion.Nombre_original ?? ''}`,
        traducido: fusion.Traducido === true,
        descripcion: `${fusion.Descripcion ?? ''}`,
        efecto_basico: `${fusion.Efecto_basico ?? ''}`,
        efecto_esencia: `${fusion.Efecto_esencia ?? ''}`,
        origen_descripcion: fusion.Origen_descripcion || 'propia',
        salvacion_tipo: fusion.Salvacion?.Tipo ?? null,
        salvacion_efecto: fusion.Salvacion?.Efecto ?? null,
        alineado_portador: fusion.Alineado_portador === true,
        id_manual: toPositiveInt(fusion.Manual?.Id),
        pagina: toInt(fusion.Manual?.Pagina, 0),
        oficial: fusion.Oficial === true,
    };
}

export function filasDeChakrasDeFusion(fusion: Fusion, uid: () => string): FilaChakraFusion[] {
    return (fusion.Chakras ?? []).map((chakra) => ({
        uid: uid(),
        id_chakra: chakra.Id,
        ocupa: chakra.Ocupa === true,
        vinculo: chakra.Vinculo === true,
        efecto_vinculo: `${chakra.Efecto_vinculo ?? ''}`,
    }));
}

/** El cuerpo de `POST /incarnum/fusiones/add` y `PUT /incarnum/fusiones/<id>`. Las filas sin chakra no van. */
export function cuerpoDeFusion(valores: ValoresFusion, clases: readonly number[], descriptores: readonly number[],
    chakras: readonly FilaChakraFusion[]): FusionCuerpo {
    const tipo = toNullableText(valores.salvacion_tipo);
    const efecto = toNullableText(valores.salvacion_efecto);
    return {
        fusion: {
            nombre: `${valores.nombre ?? ''}`.trim(),
            nombre_original: toNullableText(valores.nombre_original),
            traducido: valores.traducido === true,
            descripcion: `${valores.descripcion ?? ''}`.trim(),
            efecto_basico: `${valores.efecto_basico ?? ''}`.trim(),
            efecto_esencia: `${valores.efecto_esencia ?? ''}`.trim(),
            origen_descripcion: valores.origen_descripcion || 'propia',
            salvacion: tipo || efecto ? { tipo, efecto } : null,
            alineado_portador: valores.alineado_portador === true,
            id_manual: toInt(valores.id_manual),
            pagina: toInt(valores.pagina),
            oficial: valores.oficial === true,
        },
        clases: [...clases],
        descriptores: [...descriptores],
        chakras: chakras
            .filter((fila) => toInt(fila.id_chakra, 0) > 0)
            .map((fila): FusionChakraCuerpo => ({
                id_chakra: toInt(fila.id_chakra),
                ocupa: fila.ocupa === true,
                vinculo: fila.vinculo === true,
                efecto_vinculo: `${fila.efecto_vinculo ?? ''}`.trim(),
            })),
    };
}

/** Una regla de la API que cruza filas, comprobada antes de mandar para enseñarla en su sitio. */
export interface ProblemaDeFusion {
    campo: 'chakras';
    /** La fila que falla (su `uid`), o `null` si es la lista entera. */
    uid: string | null;
    mensaje: string;
}

/** Las reglas de los chakras de la fusión de la API (`chakra_repetido`, `chakra_sin_uso`, `fusion_sin_chakra`). */
export function problemaDeFusion(chakras: readonly FilaChakraFusion[]): ProblemaDeFusion | null {
    const vistos = new Set<number>();
    for (const fila of chakras) {
        const id = toInt(fila.id_chakra, 0);
        if (id <= 0)
            continue;
        if (vistos.has(id))
            return { campo: 'chakras', uid: fila.uid, mensaje: 'Ese chakra ya está en la fusión.' };
        vistos.add(id);
        if (!fila.ocupa && !fila.vinculo)
            return { campo: 'chakras', uid: fila.uid, mensaje: 'Marca si se moldea aquí, si se vincula aquí o las dos cosas.' };
    }
    if (!chakras.some((fila) => toInt(fila.id_chakra, 0) > 0 && fila.ocupa))
        return { campo: 'chakras', uid: null, mensaje: 'La fusión tiene que poder moldearse en algún chakra.' };
    return null;
}

// --- Chakras --------------------------------------------------------------------------------------------------------

export interface ValoresChakra {
    nombre: string;
    nombre_original: string;
    traducido: boolean;
    id_categoria: number | null;
    id_ranura: number | null;
    orden: number | null;
    descripcion: string;
    oficial: boolean;
}

export function valoresVaciosDeChakra(orden: number | null = null): ValoresChakra {
    return {
        nombre: '', nombre_original: '', traducido: false, id_categoria: null, id_ranura: null, orden, descripcion: '',
        // Uno nuevo no es del libro: los once del libro ya están.
        oficial: false,
    };
}

export function valoresDeChakra(chakra: ChakraDetalle): ValoresChakra {
    return {
        nombre: `${chakra.Nombre ?? ''}`,
        nombre_original: `${chakra.Nombre_original ?? ''}`,
        traducido: chakra.Traducido === true,
        id_categoria: chakra.Categoria?.Id ?? null,
        id_ranura: chakra.Ranura?.Id ?? null,
        orden: toInt(chakra.Orden, 0),
        descripcion: `${chakra.Descripcion ?? ''}`,
        oficial: chakra.Oficial === true,
    };
}

export function cuerpoDeChakra(valores: ValoresChakra): ChakraCuerpo {
    return {
        chakra: {
            nombre: `${valores.nombre ?? ''}`.trim(),
            nombre_original: toNullableText(valores.nombre_original),
            traducido: valores.traducido === true,
            id_categoria: toInt(valores.id_categoria),
            id_ranura: toPositiveInt(valores.id_ranura),
            orden: toInt(valores.orden),
            descripcion: `${valores.descripcion ?? ''}`.trim(),
            oficial: valores.oficial === true,
        },
    };
}
