export type SocialHubSectionId =
    | 'resumen'
    | 'comunidad'
    | 'actividad'
    | 'convocatorias'
    | 'amistades'
    | 'bloqueos'
    | 'campanas'
    | 'mensajes';

export interface SocialHubOpenRequest {
    section: SocialHubSectionId;
    campaignId?: number | null;
    requestId: number;
}
