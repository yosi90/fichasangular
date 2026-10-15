import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CampaignDetailViewModel, CampaignInvitationDecision, CampaignInvitationItem, CampaignListItem, CampaignMemberItem, CampaignRealtimeEvent, CampaignTramaItem } from 'src/app/interfaces/campaign-management';
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
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';

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
    campaignInvitations: CampaignInvitationItem[] = [];
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

    /** El chat de la campaña: su conversación en el chat de la plataforma (`GET /campanas/{id}/conversacion`). */
    async respondCampaignInvitation(invitation: CampaignInvitationItem, decision: CampaignInvitationDecision): Promise<void> {
        const inviteId = this.toPositiveInt(invitation?.inviteId);
        if (!inviteId || this.campaignInviteResolveInFlightId === inviteId)
            return;
        if (!this.shouldRunGuardedApiAction(`social.campaign.invitation.${inviteId}.${decision}`))
            return;

        this.campaignInviteResolveInFlightId = inviteId;
        try {
            await this.campanaSvc.resolveCampaignInvitation(inviteId, decision);
            await this.reloadCampaignData(invitation.campaignId);
            this.appToastSvc.showSuccess(
                decision === 'accept'
                    ? 'Invitación de campaña aceptada.'
                    : 'Invitación de campaña rechazada.',
                { category: 'campanas' }
            );
        } catch (error: any) {
            this.appToastSvc.showError(this.mapSocialActionError(error, 'No se pudo resolver la invitación.'));
        } finally {
            this.campaignInviteResolveInFlightId = null;
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
            const abierta = await this.platformSessionSvc.abrirChat(conversacion.conversacionId);
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
        void this.platformSessionSvc.abrirChat().catch(() => undefined);
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
        return this.selectedCampaignSummary?.campaignRole === 'master' || this.selectedCampaignSummary?.isOwner === true;
    }

    async selectCampaign(campaignId: number, forceReload: boolean = false): Promise<void> {
        const id = this.toPositiveInt(campaignId);
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

    getCampaignRoleLabel(role: string | null | undefined, isOwner: boolean = false): string {
        const normalized = `${role ?? ''}`.trim().toLowerCase();
        if (normalized === 'master')
            return 'Master';
        if (normalized === 'jugador')
            return 'Jugador';
        if (isOwner)
            return 'Creador';
        return 'Sin rol';
    }

    getCampaignMembershipLabel(status: string | null | undefined): string {
        const normalized = `${status ?? ''}`.trim().toLowerCase();
        if (normalized === 'activo')
            return 'Activo';
        if (normalized === 'inactivo')
            return 'Inactivo';
        if (normalized === 'expulsado')
            return 'Expulsado';
        return 'Sin estado';
    }

    getCampaignVisibilityLabel(visibleParaJugadores: boolean | null | undefined): string {
        return visibleParaJugadores === false ? 'Solo master' : 'Visible para jugadores';
    }

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
        this.pendingCampaignId = null;
        this.socialRealtimeSvc.deactivate();
        this.currentSection = 'resumen';
    }

    private async tryOpenPendingCampaign(): Promise<void> {
        const campaignId = this.pendingCampaignId;
        if (!campaignId || this.campaigns.length < 1)
            return;

        const target = this.campaigns.find((item) => item.id === campaignId) ?? null;
        if (!target)
            return;

        this.pendingCampaignId = null;
        this.currentSection = 'campanas';
        await this.selectCampaign(target.id);
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
        this.pendingCampaignId = this.toPositiveInt(request.campaignId);
        if (this.currentSection === 'campanas' && this.isLoggedIn)
            void this.ensureCampaignSectionLoaded();
        if (this.pendingCampaignId && this.isLoggedIn)
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
                this.campanaSvc.listReceivedCampaignInvitations(),
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
                .map((item) => this.toPositiveInt(item))
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

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private shouldRunGuardedApiAction(actionKey: string): boolean {
        const accessRestrictionMessage = this.userSvc.getAccessRestrictionMessage('usage');
        if (accessRestrictionMessage.length > 0) {
            this.appToastSvc.showError(accessRestrictionMessage);
            return false;
        }

        const decision = this.apiActionGuardSvc.shouldAllow(this.userSvc.CurrentUserUid, actionKey);
        if (decision.status !== 'allowed') {
            this.appToastSvc.showError(this.apiActionGuardSvc.getBlockedMessage(decision), {
                dedupeKey: this.apiActionGuardSvc.getBlockedToastDedupeKey(this.userSvc.CurrentUserUid, decision.status),
            });
            return false;
        }
        return true;
    }

    private mapSocialActionError(error: any, fallback: string): string {
        const complianceError = this.userSvc.getComplianceErrorMessage(error, 'usage');
        if (complianceError.length > 0)
            return complianceError;
        return toUserFacingErrorMessage(error, fallback);
    }
}
