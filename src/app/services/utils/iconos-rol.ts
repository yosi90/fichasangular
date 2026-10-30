import { TipoCatalogoEquipo } from 'src/app/interfaces/equipo';

/**
 * Los iconos de los elementos de rol (lienzo «Rol: las vistas que faltan», vista 1, aprobado de antemano por el
 * propietario el 2026-10-30): los mismos dibujos y colores de grupo que la biblioteca de 3.5 Companion
 * (`companion/…/datos/Familias.kt` y `ui/tema/Tema.kt`), más Personaje y Campaña. Los SVG son de game-icons.net
 * (CC BY 3.0, `src/assets/iconos/game-icons/LICENCIA.txt` y «Ayuda → Créditos»). Lo que no es de rol (cerrar, filtros,
 * ayuda, perfil, social) sigue con los iconos Material.
 */
export type GrupoIconoRol = 'personaje' | 'magia' | 'incarnum' | 'criaturas' | 'equipo' | 'mundo' | 'neutro';

export type TipoRol =
    | 'personaje' | 'clase' | 'clase-prestigio' | 'raza' | 'racial' | 'plantilla' | 'dote' | 'especial' | 'idioma'
    | 'ventaja' | 'desventaja'
    | 'conjuro' | 'poder-psionico'
    | 'fusion' | 'chakra'
    | 'monstruo' | 'tipo-criatura' | 'subtipo' | 'rasgo'
    | 'arma' | 'armadura' | 'municion' | 'material' | 'aptitud-equipo' | 'objeto' | 'conjunto'
    | 'deidad' | 'manual' | 'campana';

export interface IconoRol {
    /** El nombre del icono de game-icons.net (el archivo `<icono>.svg`). */
    readonly icono: string;
    readonly grupo: GrupoIconoRol;
    /** Qué es, en singular: lo que lee el lector de pantalla cuando el icono va solo. */
    readonly etiqueta: string;
}

const icono = (icono: string, grupo: GrupoIconoRol, etiqueta: string): IconoRol => ({ icono, grupo, etiqueta });

/** El registro único: un icono por catálogo y variante. */
export const ICONOS_ROL: Readonly<Record<TipoRol, IconoRol>> = {
    'personaje': icono('visored-helm', 'personaje', 'Personaje'),
    'clase': icono('sword-brandish', 'personaje', 'Clase básica'),
    'clase-prestigio': icono('laurel-crown', 'personaje', 'Clase de prestigio'),
    'raza': icono('elf-ear', 'personaje', 'Raza'),
    'racial': icono('dna1', 'personaje', 'Racial'),
    'plantilla': icono('duality-mask', 'personaje', 'Plantilla'),
    'dote': icono('laurels', 'personaje', 'Dote'),
    'especial': icono('star-swirl', 'personaje', 'Especial de clase'),
    'idioma': icono('conversation', 'personaje', 'Idioma'),
    'ventaja': icono('thumb-up', 'personaje', 'Ventaja'),
    'desventaja': icono('thumb-down', 'personaje', 'Desventaja'),
    'conjuro': icono('spell-book', 'magia', 'Conjuro'),
    'poder-psionico': icono('psychic-waves', 'magia', 'Poder psiónico'),
    'fusion': icono('crystal-growth', 'incarnum', 'Fusión del alma'),
    'chakra': icono('meditation', 'incarnum', 'Chakra'),
    'monstruo': icono('dragon-head', 'criaturas', 'Monstruo'),
    'tipo-criatura': icono('beast-eye', 'criaturas', 'Tipo de criatura'),
    'subtipo': icono('fangs', 'criaturas', 'Subtipo'),
    'rasgo': icono('claws', 'criaturas', 'Rasgo'),
    'arma': icono('crossed-swords', 'equipo', 'Arma'),
    'armadura': icono('breastplate', 'equipo', 'Armadura o escudo'),
    'municion': icono('arrow-cluster', 'equipo', 'Munición'),
    'material': icono('ore', 'equipo', 'Material especial'),
    'aptitud-equipo': icono('rune-stone', 'equipo', 'Aptitud de arma o armadura'),
    'objeto': icono('swap-bag', 'equipo', 'Objeto'),
    'conjunto': icono('knapsack', 'equipo', 'Conjunto de objetos'),
    'deidad': icono('sun-priest', 'mundo', 'Deidad'),
    'manual': icono('book-cover', 'mundo', 'Manual'),
    'campana': icono('tabletop-players', 'mundo', 'Campaña'),
};

export function iconoRol(tipo: TipoRol): IconoRol {
    return ICONOS_ROL[tipo];
}

/** La dirección del SVG de un icono (relativa a la base de la web). */
export function rutaIconoRol(tipo: TipoRol): string {
    return `assets/iconos/game-icons/${ICONOS_ROL[tipo].icono}.svg`;
}

// Las variantes salen de los datos, nunca del nombre.

/** Clase básica o de prestigio (`Prestigio` de la clase). */
export function tipoRolDeClase(clase: { Prestigio?: boolean | null } | null | undefined): TipoRol {
    return clase?.Prestigio === true ? 'clase-prestigio' : 'clase';
}

/** Conjuro o poder psiónico (`Psionico` del conjuro). */
export function tipoRolDeConjuro(conjuro: { Psionico?: boolean | null } | null | undefined): TipoRol {
    return conjuro?.Psionico === true ? 'poder-psionico' : 'conjuro';
}

/** Una ventaja con coste en puntos (`Coste` > 0) es una desventaja: da puntos en vez de gastarlos. */
export function tipoRolDeVentaja(ventaja: { Coste?: number | null } | null | undefined): TipoRol {
    return Number(ventaja?.Coste) > 0 ? 'desventaja' : 'ventaja';
}

const TIPO_ROL_DE_EQUIPO: Readonly<Record<TipoCatalogoEquipo, TipoRol>> = {
    objeto: 'objeto',
    material: 'material',
    municion: 'municion',
    encantamiento: 'aptitud-equipo',
    conjunto: 'conjunto',
};

/** El tipo de una entrada de los catálogos nuevos del equipo (`EntradaEquipo.tipo`). */
export function tipoRolDeEquipo(tipo: TipoCatalogoEquipo): TipoRol {
    return TIPO_ROL_DE_EQUIPO[tipo];
}

/** Un listado de la web: el tipo de rol de su icono y su nombre en plural, en minúscula («Lista de armaduras y escudos»). */
export interface ListadoRol {
    readonly tipo: TipoRol;
    readonly titulo: string;
}

const listado = (tipo: TipoRol, titulo: string): ListadoRol => ({ tipo, titulo });

/**
 * Los listados, por el nombre con el que se abren (`AbrirListado` del menú y la pestaña «Lista de …»), en el orden del
 * menú. Las ventajas abren también las desventajas, y las clases las de prestigio: el listado lleva el icono del tipo
 * general.
 */
export const LISTADOS_ROL: Readonly<Record<string, ListadoRol>> = {
    'razas': listado('raza', 'razas'),
    'clases': listado('clase', 'clases'),
    'dotes': listado('dote', 'dotes'),
    'conjuros': listado('conjuro', 'conjuros'),
    'monstruos': listado('monstruo', 'monstruos'),
    'plantillas': listado('plantilla', 'plantillas'),
    'armas': listado('arma', 'armas'),
    'armaduras': listado('armadura', 'armaduras y escudos'),
    'munición': listado('municion', 'munición'),
    'materiales especiales': listado('material', 'materiales especiales'),
    'aptitudes de armas y armaduras': listado('aptitud-equipo', 'aptitudes de armas y armaduras'),
    'objetos': listado('objeto', 'objetos'),
    'conjuntos de objetos': listado('conjunto', 'conjuntos de objetos'),
    'especiales': listado('especial', 'especiales'),
    'raciales': listado('racial', 'raciales'),
    'rasgos': listado('rasgo', 'rasgos'),
    'idiomas': listado('idioma', 'idiomas'),
    'ventajas': listado('ventaja', 'ventajas y desventajas'),
    'fusiones del alma': listado('fusion', 'fusiones del alma'),
    'chakras': listado('chakra', 'chakras'),
    'tipos de criatura': listado('tipo-criatura', 'tipos de criatura'),
    'subtipos': listado('subtipo', 'subtipos'),
    'deidades': listado('deidad', 'deidades'),
};

export function tipoRolDeListado(lista: string | null | undefined): TipoRol | null {
    return LISTADOS_ROL[`${lista ?? ''}`.trim()]?.tipo ?? null;
}

export interface AutorIconos {
    readonly nombre: string;
    /** Su página, si la tiene. */
    readonly web: string | null;
    readonly iconos: readonly string[];
}

/**
 * Quién dibujó cada icono (game-icons.net, CC BY 3.0): la atribución de «Ayuda → Créditos», la misma que
 * `src/assets/iconos/game-icons/LICENCIA.txt`. Cada icono de `ICONOS_ROL` tiene aquí a su autor.
 */
export const AUTORES_ICONOS_ROL: readonly AutorIconos[] = [
    {
        nombre: 'Lorc', web: 'https://lorcblog.blogspot.com',
        iconos: ['arrow-cluster', 'beast-eye', 'book-cover', 'breastplate', 'conversation', 'crossed-swords', 'crystal-growth', 'dna1',
            'dragon-head', 'duality-mask', 'knapsack', 'laurel-crown', 'laurels', 'meditation', 'psychic-waves', 'rune-stone',
            'star-swirl', 'swap-bag', 'visored-helm'],
    },
    {
        nombre: 'Delapouite', web: 'https://delapouite.com',
        iconos: ['claws', 'elf-ear', 'spell-book', 'sun-priest', 'sword-brandish', 'tabletop-players', 'thumb-down', 'thumb-up'],
    },
    { nombre: 'Skoll', web: null, iconos: ['fangs'] },
    { nombre: 'Faithtoken', web: null, iconos: ['ore'] },
];
