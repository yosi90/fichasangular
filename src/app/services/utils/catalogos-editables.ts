/**
 * Los catálogos que ya tienen pantalla de insertar o de modificar en la web. Lo leen el menú lateral (si una opción abre
 * algo o todavía solo cierra el menú) y las pestañas (qué formulario abren).
 *
 * Para añadir la inserción de un catálogo: su fila en `INSERCIONES_CATALOGO` y su formulario en la pestaña de inserción
 * de `tab-control.component.html`. Para añadir su modificación: su fila en `EDICIONES_CATALOGO`, su `<mat-tab>` en la
 * misma plantilla (con su formulario en modo `editar`) y, si tiene detalle, su lista en `detallesDeEdicion` de las
 * pestañas. El permiso de los dos, en `permisos-catalogo.ts`.
 */

/** Las inserciones con pantalla, por el listado con el que se abren, con el nombre de su pestaña. */
export const INSERCIONES_CATALOGO: Readonly<Record<string, string>> = {
    'razas': 'Nueva raza',
    'clases': 'Nueva clase',
    'dotes': 'Nueva dote',
    'conjuros': 'Nuevo conjuro',
    'raciales': 'Nuevo racial',
    'idiomas': 'Nuevo idioma',
    'especiales': 'Nuevo especial',
    'plantillas': 'Nueva plantilla',
};

/** Si la inserción de un listado ya tiene pantalla. */
export function tieneInsercion(lista: string | null | undefined): boolean {
    return Object.prototype.hasOwnProperty.call(INSERCIONES_CATALOGO, `${lista ?? ''}`.trim());
}

/**
 * Los catálogos que se pueden modificar: la pestaña de «Modificar» de cada uno (guía de modificaciones de catálogo). Se
 * abre desde su listado en modo modificar (la fila) o desde el lápiz de su detalle, una sola vez por entrada (clave
 * `edicion:<tipo>:<id>`), y lleva dentro la misma pantalla que la inserción, en modo `editar`.
 */
export type TipoEdicion = 'racial' | 'idioma' | 'especial' | 'clase' | 'plantilla' | 'raza';

/** Una pestaña de «Modificar» abierta. */
export interface EdicionCatalogoTab {
    key: string;
    tipo: TipoEdicion;
    id: number;
    nombre: string;
}

interface DefinicionEdicion {
    /** El listado con el que se abre «Modificar» (`LISTADOS_ROL`). */
    readonly listado: string;
    /** El nombre completo de la pestaña: su `label` y su tooltip. */
    readonly etiqueta: (nombre: string) => string;
    /** Lo que se lee en la pestaña. */
    readonly texto: (nombre: string) => string;
}

const editar = (tipo: string): Pick<DefinicionEdicion, 'etiqueta' | 'texto'> => ({
    etiqueta: (nombre) => `Editar ${tipo}: ${nombre}`,
    texto: (nombre) => `Editar ${nombre}`,
});

/** En el orden en que van las pestañas. */
export const EDICIONES_CATALOGO: Readonly<Record<TipoEdicion, DefinicionEdicion>> = {
    racial: { listado: 'raciales', ...editar('racial') },
    idioma: { listado: 'idiomas', ...editar('idioma') },
    especial: { listado: 'especiales', ...editar('especial') },
    clase: { listado: 'clases', ...editar('clase') },
    plantilla: { listado: 'plantillas', etiqueta: (nombre) => `Modificar: ${nombre}`, texto: (nombre) => `Modificar: ${nombre}` },
    raza: { listado: 'razas', ...editar('raza') },
};

export const TIPOS_EDICION = Object.keys(EDICIONES_CATALOGO) as TipoEdicion[];

/** Las pestañas abiertas de cada catálogo, vacías. */
export function edicionesVacias(): Record<TipoEdicion, EdicionCatalogoTab[]> {
    return TIPOS_EDICION.reduce((todas, tipo) => ({ ...todas, [tipo]: [] }), {} as Record<TipoEdicion, EdicionCatalogoTab[]>);
}

/** El catálogo que se modifica desde un listado («raciales» → `racial`), o `null` si no se puede modificar aún. */
export function tipoEdicionDeListado(lista: string | null | undefined): TipoEdicion | null {
    const texto = `${lista ?? ''}`.trim();
    return TIPOS_EDICION.find((tipo) => EDICIONES_CATALOGO[tipo].listado === texto) ?? null;
}

export function claveEdicion(tipo: TipoEdicion, id: number): string {
    return `edicion:${tipo}:${Math.trunc(Number(id ?? 0))}`;
}
