export interface DetallesPersonaje {
    Id: number;
    Nombre: string;
    Raza: string;
    Clases: {
        Nombre: string;
        Nivel: number;
    }[];
    Personalidad: string;
    Contexto: string;
    Campana: string;
    Trama: string;
    Subtrama: string;
}
