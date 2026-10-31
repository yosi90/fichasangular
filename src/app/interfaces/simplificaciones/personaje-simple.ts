import { TipoPersonaje } from "src/app/services/utils/tipo-personaje";
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
    /** PJ o PNJ (`tipo`; `Tipo` en `listado-personajes`). En la creación, `null` hasta elegir qué se crea. */
    tipo?: TipoPersonaje | null;
    /** El NEP de un PJ que dan los listados (`nep`); `null` en una edad sin ajuste. */
    nep?: number | null;
    /** El VD orientativo de un PNJ (`vd`); `null` en un PJ. */
    vd?: number | null;
}
