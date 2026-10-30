import { TipoRol } from './iconos-rol';
import { normalizarTexto } from './normalizacion';
import { compararTexto } from './orden-texto';

/**
 * La búsqueda global (Ctrl+K; lienzo «Rol: las vistas que faltan», vista 5): qué se busca y cómo se ordena. Lo que se
 * carga y lo que abre cada resultado está en `BuscadorGlobalService`; aquí solo las reglas, para poder probarlas.
 */

/** Lo mínimo para buscar: con menos letras no se busca («Escribe al menos dos letras»). */
export const LETRAS_MINIMAS_BUSQUEDA = 2;
/** Como mucho, tantos resultados por grupo; el resto, en «Ver los N en el listado». */
export const RESULTADOS_POR_GRUPO = 5;

export interface ElementoBusqueda {
    /** Única en toda la búsqueda («raza:12»). */
    readonly clave: string;
    /** Su icono: el de su catálogo y variante (una clase de prestigio, un poder psiónico, una desventaja…). */
    readonly tipo: TipoRol | null;
    /** Para lo que no es de rol (Ayuda): un icono Material. */
    readonly iconoMaterial?: string;
    readonly nombre: string;
    /** El gris de la derecha: el manual, la raza y las clases de un personaje… */
    readonly subtitulo: string;
    /** El nombre y el subtítulo, normalizados (`normalizarTexto`), para buscar. */
    readonly buscable: string;
    readonly abrir: () => void;
}

export type EstadoFuente = 'cargando' | 'lista' | 'error';

export interface FuenteBusqueda {
    readonly id: string;
    /** El título del grupo («Razas»). */
    readonly titulo: string;
    readonly tipo: TipoRol | null;
    readonly iconoMaterial?: string;
    /** El listado que abre «Ver los N en el listado», si lo tiene. */
    readonly lista?: string;
    /** «Ver las 6…» (dotes, razas, clases…) o «Ver los 23…». */
    readonly femenino?: boolean;
    readonly estado: EstadoFuente;
    readonly elementos: readonly ElementoBusqueda[];
    /**
     * Cuando la búsqueda la hace la API (los objetos: `GET /objetos?q=`), ya vienen filtrados y su total sale de la
     * cabecera; si no, se filtran aquí.
     */
    readonly yaFiltrados?: boolean;
    readonly total?: number;
}

export interface GrupoResultados {
    readonly id: string;
    readonly titulo: string;
    readonly tipo: TipoRol | null;
    readonly iconoMaterial?: string;
    readonly lista?: string;
    readonly femenino?: boolean;
    readonly cargando: boolean;
    readonly total: number;
    readonly elementos: readonly ElementoBusqueda[];
}

/** El texto de búsqueda, normalizado y en palabras. */
export function terminosBusqueda(texto: string): string[] {
    return normalizarTexto(texto, true).split(' ').filter((termino) => termino.length > 0);
}

export function textoBuscable(...partes: (string | null | undefined)[]): string {
    return normalizarTexto(partes.filter((parte) => !!parte).join(' '), true);
}

/** 0 si el nombre empieza por lo buscado, 1 si lo contiene, 2 si solo lo tiene el subtítulo; `null` si no encaja. */
export function puntuarElemento(elemento: ElementoBusqueda, texto: string): number | null {
    const terminos = terminosBusqueda(texto);
    if (terminos.length < 1 || !terminos.every((termino) => elemento.buscable.includes(termino)))
        return null;
    const nombre = normalizarTexto(elemento.nombre, true);
    const entero = terminos.join(' ');
    if (nombre.startsWith(entero))
        return 0;
    if (nombre.includes(entero))
        return 1;
    return 2;
}

/**
 * Los grupos con resultados, en el orden de las fuentes: en cada uno, los que empiezan por lo buscado, luego los que
 * lo contienen y luego el resto, y cada tanda por orden alfabético; como mucho `RESULTADOS_POR_GRUPO`. Un grupo que
 * aún carga sale con «Cargando…» (sin resultados); uno que no encaja o que falló, no sale.
 */
export function buscarEnFuentes(texto: string, fuentes: readonly FuenteBusqueda[]): GrupoResultados[] {
    if (normalizarTexto(texto, true).length < LETRAS_MINIMAS_BUSQUEDA)
        return [];
    const grupos: GrupoResultados[] = [];
    for (const fuente of fuentes) {
        const base = { id: fuente.id, titulo: fuente.titulo, tipo: fuente.tipo, iconoMaterial: fuente.iconoMaterial, lista: fuente.lista, femenino: fuente.femenino };
        if (fuente.estado === 'cargando') {
            grupos.push({ ...base, cargando: true, total: 0, elementos: [] });
            continue;
        }
        if (fuente.estado === 'error')
            continue;
        const encajan = fuente.yaFiltrados
            ? fuente.elementos.map((elemento) => ({ elemento, puntos: puntuarElemento(elemento, texto) ?? 1 }))
            : fuente.elementos
                .map((elemento) => ({ elemento, puntos: puntuarElemento(elemento, texto) }))
                .filter((par): par is { elemento: ElementoBusqueda; puntos: number } => par.puntos !== null);
        if (encajan.length < 1)
            continue;
        encajan.sort((a, b) => a.puntos - b.puntos || compararTexto(a.elemento.nombre, b.elemento.nombre));
        grupos.push({
            ...base,
            cargando: false,
            total: fuente.yaFiltrados ? Math.max(fuente.total ?? encajan.length, encajan.length) : encajan.length,
            elementos: encajan.slice(0, RESULTADOS_POR_GRUPO).map((par) => par.elemento),
        });
    }
    return grupos;
}

/** «Ver las 6 en el listado de dotes»: solo si hay más de los que se ven y el grupo tiene listado. */
export function textoVerTodos(grupo: GrupoResultados): string | null {
    if (!grupo.lista || grupo.total <= grupo.elementos.length)
        return null;
    return `Ver ${grupo.femenino ? 'las' : 'los'} ${grupo.total} en el listado de ${grupo.titulo.toLowerCase()}`;
}
