export interface Campana {
    Id: number;
    Nombre: string;
    Tramas: {
        Id: number;
        Nombre: string;
        Subtramas: {
            Id: number;
            Nombre: string;
        }[]
    }[]
}

export interface Tramas {
    Id: number;
    Nombre: string;
    Subtramas: {
        Id: number;
        Nombre: string;
    }[]
}

export interface Super {
    Id: number,
    Nombre: string
}