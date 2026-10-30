import { RazaSimple } from "./raza-simple";

export interface PersonajeSimple {
    Id: number;
    Nombre: string;
    ownerUid?: string | null;
    ownerDisplayName?: string | null;
    campaignId?: number | null;
    campaignName?: string | null;
    accessReason?: 'owner' | 'campaign_public' | 'campaign_master' | null;
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
    /** `false` si el personaje es homebrew (`oficial` de la proyección privada, `o` del detalle); sin el dato, `null`. */
    oficial?: boolean | null;
}
