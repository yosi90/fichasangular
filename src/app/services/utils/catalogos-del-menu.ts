/**
 * Los catálogos del menú lateral, en su orden: los seis principales y los grupos de los demás (Equipo, Rasgos y
 * aptitudes, Criaturas y mundo; propietario, 2026-10-25). Los leen los dos menús: el de siempre, por acción (Insertar,
 * Modificar y Detalles, cada uno con los mismos grupos), y el de B, por catálogo (cada catálogo una vez). Un catálogo
 * nuevo se añade aquí, a su grupo, y sale en los dos. Ningún grupo debe pasar de unas 8 listas. El texto y el icono de
 * cada lista salen de `LISTADOS_ROL` (`iconos-rol.ts`).
 */
export type GrupoCatalogos = 'equipo' | 'rasgos' | 'mundo';

export interface GrupoDeCatalogos {
    readonly id: GrupoCatalogos;
    readonly titulo: string;
    /** Los nombres con los que se abre cada listado (`LISTADOS_ROL`). */
    readonly listas: readonly string[];
}

export interface CatalogoPrincipal {
    /** El nombre con el que se abre su listado (`LISTADOS_ROL`). */
    readonly lista: string;
    /** Su nombre en singular, el de Insertar, Modificar y Detalles del menú de siempre («Raza»). */
    readonly singular: string;
}

/** Los seis de siempre, con su fila propia en los dos menús. */
export const CATALOGOS_PRINCIPALES: readonly CatalogoPrincipal[] = [
    { lista: 'razas', singular: 'Raza' },
    { lista: 'clases', singular: 'Clase' },
    { lista: 'dotes', singular: 'Dote' },
    { lista: 'conjuros', singular: 'Conjuro' },
    { lista: 'monstruos', singular: 'Monstruo' },
    { lista: 'plantillas', singular: 'Plantilla' },
];

export const GRUPOS_DE_CATALOGOS: readonly GrupoDeCatalogos[] = [
    {
        id: 'equipo',
        titulo: 'Equipo',
        listas: ['armas', 'armaduras', 'munición', 'materiales especiales', 'aptitudes de armas y armaduras', 'objetos', 'conjuntos de objetos'],
    },
    {
        id: 'rasgos',
        titulo: 'Rasgos y aptitudes',
        listas: ['especiales', 'raciales', 'rasgos', 'idiomas', 'ventajas', 'fusiones del alma', 'chakras'],
    },
    {
        id: 'mundo',
        titulo: 'Criaturas y mundo',
        listas: ['tipos de criatura', 'subtipos', 'deidades', 'manuales'],
    },
];
