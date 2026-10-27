import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { redondearCentesimas, toInt, toNumber, toNumberOrNull } from 'src/app/services/utils/normalizacion';

/*
 * El precio de copiar un conjuro al libro (pestaña «Conjuros para el libro» de la tienda, aprobada por el propietario el
 * 2026-10-26). La API es la que manda (`utils/libro_conjuros.py`, que calcula lo mismo al comprar); aquí se estima con
 * sus mismas reglas para enseñarlo mientras se compra (`docs/publica/REGLAS_DE_CREACION.md`):
 * - Manual del jugador, cap. 10: cada conjuro ocupa una página por nivel (los de nivel 0, una) y escribirlo cuesta 100 po
 *   por página; un libro tiene 100 páginas.
 * - Guía del DM, tabla 7-33: el pergamino del que se copia vale nivel × nivel de lanzador × 25 po (el nivel 0 cuenta ½),
 *   más el componente material caro y 5 po por PX. El nivel de lanzador es el mínimo de la clase para ese nivel.
 */

export const PAGINAS_POR_LIBRO = 100;
const PO_POR_NIVEL_DE_PERGAMINO = 25;
const PO_POR_PAGINA = 100;
const PO_POR_PX = 5;

export interface PrecioCopiaLibro {
    pergamino: number;
    escritura: number;
    paginas: number;
    total: number;
}

/** Un conjuro que se puede copiar al libro de una clase, con su precio. */
export interface ConjuroParaElLibro {
    conjuro: Conjuro;
    nivel: number;
    precio: PrecioCopiaLibro;
}

/** El libro de una clase en la tienda: lo que ya ocupa y lo que se puede copiar. */
export interface LibroTienda {
    idClase: number;
    clase: string;
    paginasUsadas: number;
    conjuros: ConjuroParaElLibro[];
}

/** Las páginas que ocupa un conjuro: una por nivel, y una los de nivel 0. */
export function paginasConjuro(nivel: number): number {
    return Math.max(1, Math.trunc(toNumber(nivel)));
}

/** El precio de copiar un conjuro: una bola de fuego (nivel 3) de una maga (nivel de lanzador mínimo 5), 375 + 300 = 675 po. */
export function precioCopiaLibro(
    nivel: number,
    nivelLanzadorMinimo: number,
    costeMaterial?: number | null,
    costePx?: number | null
): PrecioCopiaLibro {
    const factor = Math.trunc(nivel) === 0 ? 0.5 : Math.trunc(nivel);
    const pergamino = factor * Math.max(1, Math.trunc(nivelLanzadorMinimo)) * PO_POR_NIVEL_DE_PERGAMINO
        + (toNumberOrNull(costeMaterial) ?? 0) + PO_POR_PX * (toNumberOrNull(costePx) ?? 0);
    const paginas = paginasConjuro(nivel);
    const escritura = paginas * PO_POR_PAGINA;
    return { pergamino: redondearCentesimas(pergamino), escritura, paginas, total: redondearCentesimas(pergamino + escritura) };
}

/** El nivel de conjuro de una clave de `Conjuros_diarios` («Nivel_3» o «3»), o -1. */
function nivelDeLaClave(clave: string): number {
    const encontrado = `${clave ?? ''}`.match(/(\d+)\s*$/);
    return encontrado ? Number(encontrado[1]) : -1;
}

/**
 * El nivel de lanzador más bajo con el que la clase lanza conjuros de ese nivel, desde su tabla (`Desglose_niveles`,
 * `Conjuros_diarios`; -1 es sin acceso): el mago lanza los de nivel 3 en su nivel 5. Con `Nivel_lanzador_divisor`, el
 * nivel de esa fila entre el divisor. `null` si la clase nunca llega a ese nivel. La API hace lo mismo
 * (`nivel_lanzador_minimo` de `utils/conjuros_diarios.py`).
 */
export function nivelLanzadorMinimo(clase: Clase | null | undefined, nivelConjuro: number): number | null {
    const filas = (Array.isArray(clase?.Desglose_niveles) ? clase!.Desglose_niveles : [])
        .map((detalle) => {
            const diarios = new Map<number, number>();
            Object.entries(detalle?.Conjuros_diarios ?? {})
                .forEach(([clave, valor]) => diarios.set(nivelDeLaClave(clave), toInt(valor, -1)));
            return { nivel: toInt(detalle?.Nivel), diarios };
        })
        .filter((fila) => fila.nivel > 0)
        .sort((a, b) => a.nivel - b.nivel);
    const conAcceso = filas.filter((fila) => [...fila.diarios.values()].some((valor) => valor >= 0));
    const primera = filas.find((fila) => (fila.diarios.get(nivelConjuro) ?? -1) >= 0);
    if (!primera || conAcceso.length < 1)
        return null;
    const divisor = Math.max(1, toInt(clase?.Conjuros?.Nivel_lanzador_divisor, 1));
    const nivelLanzador = divisor > 1 ? Math.floor(primera.nivel / divisor) : primera.nivel - conAcceso[0].nivel + 1;
    return Math.max(1, nivelLanzador);
}

/**
 * El libro de una clase para la tienda: lo que se puede copiar (lo que da `conjurosAniadiblesAlLibro`, la regla única),
 * con su precio y por nivel y nombre, y las páginas que ya ocupan los que tiene.
 */
export function libroTienda(
    clase: Clase,
    aniadibles: { conjuro: Conjuro; nivel: number; }[],
    enElLibro: { nivel: number; }[]
): LibroTienda {
    return {
        idClase: toInt(clase?.Id),
        clase: `${clase?.Nombre ?? ''}`.trim(),
        paginasUsadas: enElLibro.reduce((total, item) => total + paginasConjuro(item.nivel), 0),
        conjuros: aniadibles
            .map(({ conjuro, nivel }) => ({
                conjuro,
                nivel,
                precio: precioCopiaLibro(nivel, nivelLanzadorMinimo(clase, nivel) ?? 1, conjuro?.Coste_material, conjuro?.Coste_px),
            }))
            .sort((a, b) => a.nivel - b.nivel || `${a.conjuro?.Nombre ?? ''}`.localeCompare(`${b.conjuro?.Nombre ?? ''}`, 'es')),
    };
}
