import { DatoPreferenciaAlineamiento } from 'src/app/services/utils/alineamiento-contrato';

export interface Alineamiento {
    Id: number;
    Basico: {
        "Id_basico": number;
        "Nombre": string;
    };
    /** Con lo que pide (`Valor`, `Prohibe`, `Id_prioridad`: las preferencias como dato, `DatoPreferenciaAlineamiento`). */
    Ley: {
        "Id_ley": number;
        "Nombre": string;
    } & DatoPreferenciaAlineamiento;
    Moral: {
        "Id_moral": number;
        "Nombre": string;
    } & DatoPreferenciaAlineamiento;
    Prioridad: {
        "Id_prioridad": number;
        "Nombre": string;
    };
    Descripcion: string;
}

export interface AlineamientoBasicoCatalogItem {
    Id: number;
    Nombre: string;
    /** Sus dos componentes, el de ley y el moral (Magic of Incarnum: qué fusiones puede moldear). Vacío en «No aplica». */
    Actitudes?: { Id: number; Nombre: string; }[];
}

export interface PrioridadAlineamientoCatalogItem {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface PreferenciaLeyCatalogItem extends DatoPreferenciaAlineamiento {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface PreferenciaMoralCatalogItem extends DatoPreferenciaAlineamiento {
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
    } & DatoPreferenciaAlineamiento;
    Moral: {
        Id: number;
        Nombre: string;
    } & DatoPreferenciaAlineamiento;
    Prioridad: {
        Id: number;
        Nombre: string;
        Descripcion: string;
    };
}
