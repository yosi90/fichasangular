import { InvitacionEnviadaEspacio, SolicitudEspacio, TraspasoEspacio } from '../services/platform-spaces.service';

export type CampaignRoleCode = 'master' | 'jugador';
export type CampaignMembershipStatus = 'activo' | 'inactivo' | 'expulsado';
/** Cómo se entra en una campaña: solo por invitación o también por solicitud (Rol no ofrece la entrada abierta). */
export type CampaignEntryMode = 'invitacion' | 'solicitud';
export type CampaignRealtimeEventCode =
    | 'system.campaign_invitation_received'
    | 'system.campaign_invitation_resolved'
    | 'campaign.local_change';
export type CampaignRealtimeEventSource = 'remote' | 'local';

export interface CampaignRealtimeEvent {
    code: CampaignRealtimeEventCode;
    campaignId: number | null;
    conversationId: number | null;
    source: CampaignRealtimeEventSource;
}

export interface CampaignListItem {
    id: number;
    nombre: string;
    campaignRole: CampaignRoleCode | null;
    membershipStatus: CampaignMembershipStatus | null;
    isOwner?: boolean;
    detailRevision?: string | null;
}

export interface CampaignMemberItem {
    userId: string | null;
    uid: string;
    displayName: string | null;
    email: string | null;
    campaignRole: CampaignRoleCode;
    membershipStatus: CampaignMembershipStatus;
    isActive: boolean;
    addedAtUtc: string | null;
    addedByUserId: string | null;
}

export interface CampaignUserSearchResult {
    uid: string;
    displayName: string | null;
    photoThumbUrl: string | null;
}

/** El espacio de la plataforma que lleva la pertenencia de la campaña (`espacio` del detalle). */
export interface CampaignSpace {
    id: number;
    entrada: CampaignEntryMode;
}

/** `GET /campanas/{id}/entrada`: lo justo para pedir entrar en una campaña que admite solicitudes. */
export interface CampaignEntryInfo {
    idCampana: number;
    nombre: string;
    masterDisplayName: string | null;
    esMiembro: boolean;
    espacio: CampaignSpace | null;
}

export interface CampaignCreationPolicy {
    tiradaMinimaCaracteristica: number | null;
    nepMaximoPersonajeNuevo: number | null;
    maxTablasDadosCaracteristicas: number | null;
    permitirHomebrewGeneral: boolean;
    permitirVentajasDesventajas: boolean;
    permitirIgnorarRestriccionesAlineamiento: boolean;
    maxFuentesHomebrewGeneralesPorPersonaje: number | null;
    /**
     * La tienda del final de la creación (2026-10-26): comprar objetos mágicos del catálogo. Los tres son opcionales en la
     * web (sin ellos, todo permitido, como la política permisiva); el mapper de la API los rellena siempre.
     */
    permitirObjetosMagicos?: boolean;
    /** Configurar mejora, aptitudes especiales y material especial de armas, armaduras y munición. */
    permitirObjetosAMedida?: boolean;
    /** Lo que puede costar una sola pieza, en po; `null`, sin tope. */
    precioMaximoPorObjeto?: number | null;
}

export interface CreateCampaignInput {
    nombre: string;
    politicaCreacion?: Partial<CampaignCreationPolicy> | null;
}

export interface UpdateCampaignInput {
    nombre?: string;
    politicaCreacion?: Partial<CampaignCreationPolicy> | null;
}

export interface CreateCampaignTramaInput {
    nombre: string;
    visibleParaJugadores: boolean;
}

export interface UpdateCampaignTramaInput {
    nombre?: string;
    visibleParaJugadores?: boolean;
}

export interface CreateCampaignSubtramaInput {
    nombre: string;
    visibleParaJugadores: boolean;
}

export interface UpdateCampaignSubtramaInput {
    nombre?: string;
    visibleParaJugadores?: boolean;
}

export interface CampaignSubtramaItem {
    id: number;
    nombre: string;
    visibleParaJugadores: boolean;
}

export interface CampaignTramaItem {
    id: number;
    nombre: string;
    visibleParaJugadores: boolean;
    subtramas: CampaignSubtramaItem[];
}

export interface CampaignDetailViewModel {
    campaign: CampaignListItem;
    ownerUid: string | null;
    ownerDisplayName: string | null;
    activeMasterUid: string | null;
    activeMasterDisplayName: string | null;
    espacio: CampaignSpace | null;
    politicaCreacion: CampaignCreationPolicy;
    members: CampaignMemberItem[];
    /** Solo para el máster, de la plataforma: invitaciones y solicitudes pendientes. */
    pendingInvitations: InvitacionEnviadaEspacio[];
    joinRequests: SolicitudEspacio[];
    /** El traspaso pendiente, para el máster que lo ofrece y para quien lo recibe. */
    pendingTransfer: TraspasoEspacio | null;
    includeInactiveMembers: boolean;
    tramas: CampaignTramaItem[];
    loadingInvitations: boolean;
    loadingMembers: boolean;
    loadingTramas: boolean;
}
