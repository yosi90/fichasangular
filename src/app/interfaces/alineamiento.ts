export interface Alineamiento {
    Id: number;
    Basico: {
        "Id_basico": number;
        "Nombre": string;
    };
    Ley: {
        "Id_ley": number;
        "Nombre": string;
    };
    Moral: {
        "Id_moral": number;
        "Nombre": string;
    };
    Prioridad: {
        "Id_prioridad": number;
        "Nombre": string;
    };
    Descripcion: string;
}

export interface AlineamientoBasicoCatalogItem {
    Id: number;
    Nombre: string;
}

export interface PrioridadAlineamientoCatalogItem {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface PreferenciaLeyCatalogItem {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface PreferenciaMoralCatalogItem {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface AlineamientoCombinacionCatalogItem {
    Id: number;
    Basico: {
        Id: number;
        Nombre: string;
    };
    Ley: {
        Id: number;
        Nombre: string;
    };
    Moral: {
        Id: number;
        Nombre: string;
    };
    Prioridad: {
        Id: number;
        Nombre: string;
        Descripcion: string;
    };
}
