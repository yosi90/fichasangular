import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CampaignDetailViewModel, CampaignEntryInfo, CampaignListItem, CampaignMemberItem, CampaignRealtimeEvent, CampaignTramaItem } from 'src/app/interfaces/campaign-management';
import {
    SocialHubOpenRequest,
    SocialHubSectionId,
} from 'src/app/interfaces/social';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { UserService } from 'src/app/services/user.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { InvitacionRecibidaEspacio, PlatformSpacesService } from 'src/app/services/platform-spaces.service';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';
import { toPositiveInt } from 'src/app/services/utils/normalizacion';
import {
    mensajeErrorDeAccion,
    permitirAccionGuardada,
    textoEstadoEnCampana,
    textoRolEnCampana,
    textoVisibilidadEnCampana,
} from '../user-profile/perfil-acciones';

@Component({
    selector: 'app-social-hub',
    templateUrl: './social-hub.component.html',
    styleUrls: ['./social-hub.component.sass'],
    standalone: false
})
export class SocialHubComponent implements OnInit, OnChanges, OnDestroy {
    @Input() openRequest: SocialHubOpenRequest | null = null;

    currentSection: SocialHubSectionId = 'resumen';
    isLoggedIn = false;
    loading = false;
    campaignInvitations: InvitacionRecibidaEspacio[] = [];
    campaigns: CampaignListItem[] = [];
    campaignsLoading = false;
    campaignsErrorMessage = '';
    campaignInvitationsLoading = false;
    campaignInvitationsErrorMessage = '';
    selectedCampaignId: number | null = null;
    selectedCampaignDetail: CampaignDetailViewModel | null = null;
    selectedCampaignLoading = false;
    selectedCampaignErrorMessage = '';
    campaignInviteResolveInFlightId: number | null = null;
    campaignMembershipActionInFlight = false;
    /** La campaña del enlace `?vista=campanas&campana={id}` en la que la persona aún no está y puede pedir entrar. */
    entryCandidate: CampaignEntryInfo | null = null;
    entryRequestMessage = '';
    entryRequestSending = false;
    entryRequestSent = false;

    private readonly destroy$ = new Subject<void>();
    private pendingCampaignId: number | null = null;
    private readonly campaignRealtimeRefresh$ = new Subject<CampaignRealtimeEvent>();

    readonly sections: { id: SocialHubSectionId; label: string; icon: string; }[] = [
        { id: 'resumen', label: 'Resumen', icon: 'hub' },
        { id: 'comunidad', label: 'Comunidad', icon: 'groups' },
        { id: 'convocatorias', label: 'Convocatorias', icon: 'forum' },
        { id: 'campanas', label: 'Campañas', icon: 'diversity_3' },
    ];

    constructor(
        private userSvc: UserService,
        private campanaSvc: CampanaService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private socialRealtimeSvc: SocialRealtimeService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
        private apiActionGuardSvc: ApiActionGuardService,
        private platformSessionSvc: PlatformSessionService,
        private chatFloatingSvc: ChatFloatingService,
        private platformSpacesSvc: PlatformSpacesService,
    ) { }

    ngOnInit(): void {
        this.userSvc.isLoggedIn$
            .pipe(takeUntil(this.destroy$))
            .subscribe((loggedIn) => {
                this.isLoggedIn = loggedIn === true;
                if (this.isLoggedIn) {
                    this.socialRealtimeSvc.activate();
                    void this.loadAuthenticatedState();
                    return;
                }
                this.socialRealtimeSvc.deactivate();
                this.resetAuthenticatedState();
            });

        this.campaignRealtimeSyncSvc.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (!this.isLoggedIn || this.currentSection !== 'campanas')
                    return;
                this.campaignRealtimeRefresh$.next(event);
            });
        this.campaignRealtimeRefresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                void this.handleCampaignRealtimeEvent(event);
            });

        this.applyOpenRequest(this.openRequest);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest'])
            this.applyOpenRequest(changes['openRequest'].currentValue ?? null);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.socialRealtimeSvc.deactivate();
    }

    selectSection(section: SocialHubSectionId): void {
        this.currentSection = section;
        if (section === 'campanas' && this.isLoggedIn)
            void this.ensureCampaignSectionLoaded();
    }

    /** Las invitaciones son de la plataforma (espacios): se aceptan desde Rol y después se pone al día la copia. */
    async respondCampaignInvitation(invitation: InvitacionRecibidaEspacio, respuesta: 'aceptar' | 'rechazar'): Promise<void> {
        const inviteId = toPositiveInt(invitation?.id);
        if (!inviteId || this.campaignInviteResolveInFlightId === inviteId)
            return;
        if (!this.shouldRunGuardedApiAction(`social.campaign.invitation.${inviteId}.${respuesta}`))
            return;

        this.campaignInviteResolveInFlightId = inviteId;
        try {
            if (respuesta === 'aceptar')
                await this.platformSpacesSvc.aceptarInvitacion(inviteId);
            else
                await this.platformSpacesSvc.rechazarInvitacion(inviteId);
            const campaignId = this.campaignIdFromSpaceKey(invitation.espacio.idExterno);
            await this.campanaSvc.syncMembership(campaignId);
            await this.reloadCampaignData(respuesta === 'aceptar' ? campaignId : this.selectedCampaignId);
            this.appToastSvc.showSuccess(
                respuesta === 'aceptar' ? 'Ya estás en la campaña.' : 'Invitación rechazada.',
                { category: 'campanas' }
            );
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo responder a la invitación.'));
        } finally {
            this.campaignInviteResolveInFlightId = null;
        }
    }

    /** Pide entrar en la campaña del enlace (solo si admite solicitudes); la aprueba el máster. */
    async requestCampaignEntry(): Promise<void> {
        const entry = this.entryCandidate;
        if (!entry?.espacio || this.entryRequestSending || this.entryRequestSent)
            return;
        if (!this.shouldRunGuardedApiAction(`social.campaign.entry.${entry.idCampana}`))
            return;

        this.entryRequestSending = true;
        try {
            const mensaje = `${this.entryRequestMessage ?? ''}`.trim().slice(0, 500);
            await this.platformSpacesSvc.pedirEntrar(entry.espacio.id, mensaje.length > 0 ? mensaje : null);
            this.entryRequestSent = true;
            this.appToastSvc.showSuccess('Solicitud enviada. El máster la verá al abrir la campaña.', { category: 'campanas' });
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo pedir entrar en la campaña.'));
        } finally {
            this.entryRequestSending = false;
        }
    }

    dismissCampaignEntry(): void {
        this.entryCandidate = null;
        this.entryRequestMessage = '';
        this.entryRequestSent = false;
    }

    /** Un jugador sale de la campaña por su cuenta; sus personajes se quedan con la campaña puesta. */
    async leaveSelectedCampaign(): Promise<void> {
        const espacio = this.selectedCampaignDetail?.espacio;
        const campaignId = this.selectedCampaignId;
        if (!espacio || !campaignId || !this.selectedCampaignCanLeave || this.campaignMembershipActionInFlight)
            return;
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Salir de la campaña',
            text: `Dejarás de ver «${this.selectedCampaignSummary?.nombre ?? 'la campaña'}». Tus personajes se quedan en ella. Para volver, el máster tendrá que invitarte otra vez.`,
            showCancelButton: true,
            confirmButtonText: 'Salir',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed || !this.shouldRunGuardedApiAction(`social.campaign.leave.${campaignId}`))
            return;

        this.campaignMembershipActionInFlight = true;
        try {
            await this.platformSpacesSvc.salir(espacio.id);
            await this.campanaSvc.syncMembership(campaignId);
            this.selectedCampaignId = null;
            this.selectedCampaignDetail = null;
            await this.reloadCampaignData(null);
            this.appToastSvc.showSuccess('Has salido de la campaña.', { category: 'campanas' });
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo salir de la campaña.'));
        } finally {
            this.campaignMembershipActionInFlight = false;
        }
    }

    /** El máster le ofrece la campaña a este jugador: si acepta, pasa a ser el máster. */
    async respondCampaignTransfer(respuesta: 'aceptar' | 'rechazar'): Promise<void> {
        const espacio = this.selectedCampaignDetail?.espacio;
        const campaignId = this.selectedCampaignId;
        if (!espacio || !campaignId || !this.selectedCampaignTransferIsForMe || this.campaignMembershipActionInFlight)
            return;
        if (!this.shouldRunGuardedApiAction(`social.campaign.transfer.${campaignId}.${respuesta}`))
            return;

        this.campaignMembershipActionInFlight = true;
        try {
            await this.platformSpacesSvc.responderTraspaso(espacio.id, respuesta);
            await this.campanaSvc.syncMembership(campaignId);
            await this.reloadCampaignData(campaignId);
            this.appToastSvc.showSuccess(
                respuesta === 'aceptar' ? 'Ahora eres el máster de la campaña.' : 'Has rechazado el traspaso.',
                { category: 'campanas' }
            );
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo responder al traspaso.'));
        } finally {
            this.campaignMembershipActionInFlight = false;
        }
    }

    /** El chat de la campaña: su conversación en el chat de la plataforma (`GET /campanas/{id}/conversacion`). */
    async openSelectedCampaignChat(): Promise<void> {
        if (!this.selectedCampaignId || !this.canOpenSelectedCampaignChat)
            return;
        if (!this.shouldRunGuardedApiAction(`social.campaign.chat.${this.selectedCampaignId}`))
            return;

        try {
            const conversacion = await this.campanaSvc.getCampaignConversation(this.selectedCampaignId);
            const abierta = await this.chatFloatingSvc.abrir(conversacion.conversacionId);
            if (!abierta)
                this.appToastSvc.showError('El chat de Yosiftware no está disponible ahora mismo.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo abrir el chat de la campaña.'));
        }
    }

    canReportCampaignMember(member: CampaignMemberItem): boolean {
        const uid = `${member?.uid ?? ''}`.trim();
        return uid.length > 0 && uid !== `${this.userSvc.CurrentUserUid ?? ''}`.trim();
    }

    /** La campaña es de Rol: se denuncia a la persona, citando la campaña (ecosistema-kit/MODERACION.md). */
    async reportCampaignMember(member: CampaignMemberItem): Promise<void> {
        if (!this.canReportCampaignMember(member))
            return;
        const campana = `${this.selectedCampaignSummary?.nombre ?? ''}`.trim();
        try {
            await this.platformSessionSvc.denunciar({
                tipo: 'persona',
                referencia: member.uid,
                nombre: member.displayName ?? undefined,
                extracto: campana.length > 0 ? `En la campaña «${campana}» de Rol` : undefined,
            });
        } catch {
            this.appToastSvc.showError('No se pudo abrir la denuncia ahora mismo.');
        }
    }

    get summaryCards(): { label: string; value: number; hint: string; }[] {
        return [
            { label: 'Campañas', value: this.campaigns.length, hint: 'Donde juegas o diriges' },
            { label: 'Invitaciones', value: this.campaignInvitations.length, hint: 'Pendientes de responder' },
        ];
    }

    get urlWebSocial(): string {
        return this.platformSessionSvc.urlSocial();
    }

    abrirChat(): void {
        void this.chatFloatingSvc.abrir().catch(() => undefined);
    }

    get selectedCampaignSummary(): CampaignListItem | null {
        if (!this.selectedCampaignId)
            return null;
        return this.campaigns.find((item) => item.id === this.selectedCampaignId) ?? null;
    }

    get selectedCampaignMembers(): CampaignMemberItem[] {
        return this.selectedCampaignDetail?.members ?? [];
    }

    get selectedCampaignTramas(): CampaignTramaItem[] {
        return this.selectedCampaignDetail?.tramas ?? [];
    }

    get canOpenSelectedCampaignChat(): boolean {
        return !!this.selectedCampaignSummary && this.selectedCampaignSummary.membershipStatus === 'activo';
    }

    get selectedCampaignCanOpenManagement(): boolean {
        return this.selectedCampaignSummary?.campaignRole === 'master';
    }

    get selectedCampaignCanLeave(): boolean {
        return !!this.selectedCampaignDetail?.espacio
            && this.selectedCampaignSummary?.campaignRole === 'jugador'
            && this.selectedCampaignSummary?.membershipStatus === 'activo';
    }

    get selectedCampaignTransferIsForMe(): boolean {
        const transfer = this.selectedCampaignDetail?.pendingTransfer;
        const me = `${this.userSvc.CurrentUserUid ?? ''}`.trim().toLowerCase();
        return !!transfer && me.length > 0 && transfer.cuenta.toLowerCase() === me;
    }

    async selectCampaign(campaignId: number, forceReload: boolean = false): Promise<void> {
        const id = toPositiveInt(campaignId);
        if (!id)
            return;

        if (!forceReload && this.selectedCampaignId === id && this.selectedCampaignDetail)
            return;

        this.selectedCampaignId = id;
        this.selectedCampaignLoading = true;
        this.selectedCampaignErrorMessage = '';
        try {
            const detail = await this.campanaSvc.getCampaignDetail(id, false);
            if (this.selectedCampaignId !== id)
                return;
            this.selectedCampaignDetail = detail;
        } catch (error: any) {
            if (this.selectedCampaignId !== id)
                return;
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = `${error?.message ?? 'No se pudo cargar la campaña.'}`.trim();
        } finally {
            if (this.selectedCampaignId === id)
                this.selectedCampaignLoading = false;
        }
    }

    openSelectedCampaignManagement(): void {
        if (!this.selectedCampaignId || !this.selectedCampaignCanOpenManagement)
            return;

        this.userProfileNavSvc.openPrivateProfile({
            section: 'campanas',
            campaignId: this.selectedCampaignId,
            requestId: Date.now(),
        });
    }

    readonly getCampaignRoleLabel = textoRolEnCampana;
    readonly getCampaignMembershipLabel = textoEstadoEnCampana;
    readonly getCampaignVisibilityLabel = textoVisibilidadEnCampana;

    private async loadAuthenticatedState(): Promise<void> {
        this.loading = true;
        try {
            // Campañas e invitaciones: las cuenta el resumen y las enseña la sección de campañas.
            await this.ensureCampaignSectionLoaded();
            if (this.pendingCampaignId)
                await this.tryOpenPendingCampaign();
        } finally {
            this.loading = false;
        }
    }

    private resetAuthenticatedState(): void {
        this.campaignInvitations = [];
        this.campaigns = [];
        this.campaignsLoading = false;
        this.campaignsErrorMessage = '';
        this.campaignInvitationsLoading = false;
        this.campaignInvitationsErrorMessage = '';
        this.selectedCampaignId = null;
        this.selectedCampaignDetail = null;
        this.selectedCampaignLoading = false;
        this.selectedCampaignErrorMessage = '';
        this.campaignInviteResolveInFlightId = null;
        this.campaignMembershipActionInFlight = false;
        this.dismissCampaignEntry();
        this.pendingCampaignId = null;
        this.socialRealtimeSvc.deactivate();
        this.currentSection = 'resumen';
    }

    private async tryOpenPendingCampaign(): Promise<void> {
        const campaignId = this.pendingCampaignId;
        if (!campaignId || this.campaignsLoading)
            return;

        this.pendingCampaignId = null;
        this.currentSection = 'campanas';
        const target = this.campaigns.find((item) => item.id === campaignId) ?? null;
        if (target) {
            await this.selectCampaign(target.id);
            return;
        }
        // No está en ella: si la campaña admite solicitudes, se le ofrece pedir entrar.
        try {
            const entry = await this.campanaSvc.getCampaignEntry(campaignId);
            if (entry && !entry.esMiembro && entry.espacio?.entrada === 'solicitud') {
                this.entryCandidate = entry;
                this.entryRequestMessage = '';
                this.entryRequestSent = false;
            } else if (!entry) {
                this.appToastSvc.showInfo('No puedes abrir esa campaña: solo se entra con una invitación del máster.');
            }
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo abrir la campaña.'));
        }
    }

    private applyOpenRequest(request: SocialHubOpenRequest | null): void {
        if (!request)
            return;
        const section = request.section ?? 'resumen';
        // Lo que ahora es de la plataforma se abre allí.
        if (section === 'mensajes') {
            this.abrirChat();
            this.currentSection = 'resumen';
            return;
        }
        if (section === 'amistades' || section === 'bloqueos') {
            window.open(this.urlWebSocial, '_blank', 'noopener');
            this.currentSection = 'resumen';
            return;
        }
        this.currentSection = section === 'actividad' ? 'resumen' : section;
        this.pendingCampaignId = toPositiveInt(request.campaignId);
        if (!this.isLoggedIn)
            return;
        // Primero la lista: la campaña pedida se abre si está en ella, y si no, se ofrece pedir entrar.
        if (this.currentSection === 'campanas')
            void this.ensureCampaignSectionLoaded().then(() => this.tryOpenPendingCampaign());
        else if (this.pendingCampaignId)
            void this.tryOpenPendingCampaign();
    }

    private async ensureCampaignSectionLoaded(): Promise<void> {
        if (!this.isLoggedIn)
            return;
        await this.reloadCampaignData(this.pendingCampaignId ?? this.selectedCampaignId);
    }

    private async reloadCampaignData(preferredCampaignId?: number | null): Promise<void> {
        this.campaignsLoading = true;
        this.campaignsErrorMessage = '';
        this.campaignInvitationsLoading = true;
        this.campaignInvitationsErrorMessage = '';
        try {
            const [campaignsResult, invitationsResult] = await Promise.allSettled([
                this.campanaSvc.listSocialCampaigns(),
                this.platformSpacesSvc.misInvitaciones(),
            ]);

            if (campaignsResult.status === 'fulfilled') {
                this.campaigns = campaignsResult.value;
            } else {
                this.campaigns = [];
                this.campaignsErrorMessage = toUserFacingErrorMessage(campaignsResult.reason, 'No se pudieron cargar las campañas.');
            }

            if (invitationsResult.status === 'fulfilled') {
                this.campaignInvitations = invitationsResult.value;
            } else {
                this.campaignInvitations = [];
                this.campaignInvitationsErrorMessage = toUserFacingErrorMessage(invitationsResult.reason, 'No se pudieron cargar las invitaciones de campaña.');
            }

            const candidateIds = [
                preferredCampaignId,
                this.selectedCampaignId,
                this.campaigns[0]?.id ?? null,
            ];
            const nextCampaignId = candidateIds
                .map((item) => toPositiveInt(item))
                .find((item) => !!item && this.campaigns.some((campaign) => campaign.id === item)) ?? null;

            if (nextCampaignId)
                await this.selectCampaign(nextCampaignId, true);
            else {
                this.selectedCampaignId = null;
                this.selectedCampaignDetail = null;
                this.selectedCampaignErrorMessage = '';
            }
        } finally {
            this.campaignsLoading = false;
            this.campaignInvitationsLoading = false;
        }
    }

    private async handleCampaignRealtimeEvent(event: CampaignRealtimeEvent): Promise<void> {
        await this.reloadCampaignData(this.selectedCampaignId ?? event.campaignId);
    }

    private campaignIdFromSpaceKey(idExterno: string): number | null {
        const match = /^campana-(\d+)$/.exec(`${idExterno ?? ''}`);
        return match ? toPositiveInt(match[1]) : null;
    }

    private shouldRunGuardedApiAction(actionKey: string): boolean {
        return permitirAccionGuardada(this.userSvc, this.apiActionGuardSvc, this.appToastSvc, actionKey);
    }

    private mapSocialActionError(error: any, fallback: string): string {
        return mensajeErrorDeAccion(this.userSvc, error, fallback);
    }
}
