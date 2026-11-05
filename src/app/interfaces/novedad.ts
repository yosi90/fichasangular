// Las novedades de Rol y de 3.5 Companion (`GET /novedades`, docs/publica/endpoints/novedades.md): la pestaña Novedades.

/** Los tipos de los anuncios de la plataforma (`ecosistema-kit/NOVEDADES.md`). Uno nuevo llega como texto y se pinta genérico. */
export type TipoNovedad =
    | 'actualizacion' | 'peticion' | 'arreglo' | 'web_nueva' | 'app_nueva' | 'app_disponible' | 'contenido' | 'aviso';

export interface Novedad {
    readonly idExterno: string;
    readonly tipo: string;
    readonly texto: string;
    readonly enlace: string | null;
    /** ISO 8601 en UTC. */
    readonly fecha: string;
}

/** Una página de novedades: el total y si hay más salen de las cabeceras. */
export interface PaginaNovedades {
    readonly novedades: Novedad[];
    readonly total: number;
    readonly hayMas: boolean;
}
