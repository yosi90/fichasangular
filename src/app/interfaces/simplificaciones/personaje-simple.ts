import { RazaSimple } from "./raza-simple";

export interface PersonajeSimple {
    Id: number;
    Nombre: string;
    ownerUid?: string | null;
    ownerDisplayName?: string | null;
    visible_otros_usuarios?: boolean;
    Id_region?: number;
    Region?: { Id: number; Nombre: string; } | null;
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
