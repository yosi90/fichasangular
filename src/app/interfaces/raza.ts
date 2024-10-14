export interface Raza {
    Id: number;
    Nombre: string;
    Ajuste_nivel: number;
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
    Ataques_naturales: string;
    Tamano: {
        Nombre: string;
        Modificador: number;
        Modificador_presa: number;
    }
    Dgs_adicionales: {
        Cantidad: number;
        Dado: string;
        Tipo_criatura: string;
        Ataque_base: number;
        Dotes_extra: number;
        Puntos_habilidad: number;
        Multiplicador_puntos_habilidad: number;
    }
    Reduccion_dano: string;
    Resistencia_magica: string;
    Resistencia_energia: string;
}
