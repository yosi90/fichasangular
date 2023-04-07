export interface Campana {
    id: number;
    nombre: string;
}

export interface Trama {
    id: number;
    idCampaña: number;
    nombre: string;
}

export interface Subtrama {
    id: number;
    idTrama: number;
    nombre: string;
}
