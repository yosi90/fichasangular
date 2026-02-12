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