export interface Campana {
    Id: number;
    Nombre: string;
    CampaignRole?: 'master' | 'jugador' | 'colaborador' | 'admin' | null;
    Tramas: {
        Id: number;
        Nombre: string;
        VisibleParaJugadores?: boolean;
        Subtramas: {
            Id: number;
            Nombre: string;
            VisibleParaJugadores?: boolean;
        }[]
    }[]
}

export interface Tramas {
    Id: number;
    Nombre: string;
    VisibleParaJugadores?: boolean;
    Subtramas: {
        Id: number;
        Nombre: string;
        VisibleParaJugadores?: boolean;
    }[]
}

export interface Super {
    Id: number,
    Nombre: string
}
