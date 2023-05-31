export interface Raza {
    Id: number;
    Nombre: string;
    Ajuste_nivel: number;
    Dgs_extra: number;
    Manual: string;
    Clase_predilecta: string;
    Modificadores: {
        Fuerza: number;
        Destreza: number;
        Constitucion: number;
        Inteligencia: number;
        Sabiduria: number;
        Carisma: number;
    }
    Homebrew: boolean;
}
