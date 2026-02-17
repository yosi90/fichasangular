import { RazaSimple } from "./raza-simple";

export interface PersonajeSimple {
    Id: number;
    Nombre: string;
    Raza: RazaSimple;
    RazaBase?: RazaSimple | null;
    Clases: string;
    Personalidad: string;
    Contexto: string;
    Campana: string;
    Trama: string;
    Subtrama: string;
    Archivado: boolean;
}
