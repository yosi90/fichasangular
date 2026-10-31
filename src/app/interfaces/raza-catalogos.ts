export interface RazaCatalogItem {
    Id: number;
    Nombre: string;
}

export interface TipoDadoCatalogItem {
    Id: number;
    Nombre: string;
}

export interface ActitudCatalogItem {
    Id: number;
    Nombre: string;
}

/** Una categoría del catálogo de edades (`GET /categorias-edad`): cría … gran sierpe y las que se añadan. */
export interface CategoriaEdadCatalogo {
    Id: number;
    Nombre: string;
    /** Su lugar en el catálogo: una raza usa las suyas en este orden. */
    Orden_tipico: number;
    Oficial: boolean;
    Manual: { Id: number; Nombre: string; Pagina: number; };
}

/** `POST /categorias-edad/add`. */
export interface CategoriaEdadCreateRequest {
    categoria: { nombre: string; orden_tipico: number; id_manual: number; pagina: number; oficial: boolean; };
}
