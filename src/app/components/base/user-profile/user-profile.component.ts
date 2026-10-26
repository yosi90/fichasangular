import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, concatMap, debounceTime, from, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    CampaignCreationPolicy,
    CampaignDetailViewModel,
    CampaignListItem,
    CampaignMemberItem,
    CampaignRealtimeEvent,
    CampaignSpace,
    CampaignSubtramaItem,
    CampaignTramaItem,
    CampaignUserSearchResult,
} from 'src/app/interfaces/campaign-management';
import {
    UserPrivateProfile,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId,
} from 'src/app/interfaces/user-account';
import { UserRoleRequestStatus, UserRoleRequestTarget } from 'src/app/interfaces/user-role-request';
import { NuevoPersonajeGeneradorConfig, UserSettingsV1 } from 'src/app/interfaces/user-settings';
import { PERMISSION_RESOURCES } from 'src/app/interfaces/user-acl';
import {
    UserAccessRestrictionReason,
    UserAccessScope,
} from 'src/app/interfaces/user-moderation';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { InvitacionEnviadaEspacio, PlatformSpacesService, SolicitudEspacio, TraspasoEspacio } from 'src/app/services/platform-spaces.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';
import { compararTexto } from 'src/app/services/utils/orden-texto';

type CampaignWorkspaceMode = 'idle' | 'create' | 'config' | 'peopleStories';
type CampaignWorkspaceTab = 'usuarios' | 'historias';
type IdentityFieldKey = 'displayName' | 'bio' | 'genderIdentity' | 'pronouns';
type GenderIdentityPreset = 'male' | 'female' | 'hidden' | 'custom';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.sass'],
    standalone: false
})
export class UserProfileComponent implements OnInit, OnChanges, OnDestroy {
    @Input() openRequest: UserPrivateProfileOpenRequest | null = null;

    profile: UserPrivateProfile | null = null;
    settings: UserSettingsV1 | null = null;
    loading = false;
    loadErrorMessage = '';
    currentSection: UserPrivateProfileSectionId = 'resumen';

    private readonly identityFieldTouched: Record<IdentityFieldKey, boolean> = {
        displayName: false,
        bio: false,
        genderIdentity: false,
        pronouns: false,
    };

    settingsSaving = false;
    visibilidadPorDefectoPersonajes = false;
    autoAbrirVentanaChats = true;
    permitirBurbujasChat = true;
    generadorMinimoSeleccionado = 13;
    generadorTablasPermitidas = 3;
    previewResetting = false;


    roleRequestStatus: UserRoleRequestStatus | null = null;
    roleRequestLoading = false;
    roleRequestSubmitting = false;
    roleRequestCommentDraft = '';

    campaigns: CampaignListItem[] = [];
    campaignsLoading = false;
    campaignsLoaded = false;
    campaignsErrorMessage = '';
    selectedCampaignId: number | null = null;
    selectedCampaignDetail: CampaignDetailViewModel | null = null;
    selectedCampaignLoading = false;
    selectedCampaignErrorMessage = '';
    campaignWorkspaceMode: CampaignWorkspaceMode = 'idle';
    campaignWorkspaceTab: CampaignWorkspaceTab = 'usuarios';
    campaignCreateDraft = '';
    campaignCreatePolicyDraft: CampaignCreationPolicy = this.createDefaultCampaignPolicyDraft();
    campaignCreateSaving = false;
    campaignRenameDraft = '';
    campaignRenameSaving = false;
    memberSearchQuery = '';
    memberSearchLoading = false;
    memberSearchResults: CampaignUserSearchResult[] = [];
    memberSearchErrorMessage = '';
    memberInviteInFlightUid = '';
    memberRemoveInFlightUid = '';
    campaignInviteCancelInFlightId: number | null = null;
    transferSearchQuery = '';
    transferSearchLoading = false;
    transferSearchResults: CampaignUserSearchResult[] = [];
    transferSearchErrorMessage = '';
    transferSelectedUser: CampaignUserSearchResult | null = null;
    transferSaving = false;
    transferCancelInFlight = false;
    memberInviteEmailDraft = '';
    memberInviteEmailSending = false;
    joinRequestInFlightId: number | null = null;
    entryModeSaving = false;
    tramaCreateDraft = '';
    tramaCreateVisibleParaJugadores = true;
    tramaCreateSaving = false;
    editingTramaId: number | null = null;
    editingTramaDraft = '';
    editingTramaVisibleParaJugadores = true;
    tramaSaveInFlightId: number | null = null;
    editingSubtramaId: number | null = null;
    editingSubtramaDraft = '';
    editingSubtramaVisibleParaJugadores = true;
    subtramaSaveInFlightId: number | null = null;
    subtramaCreateDraftByTrama: Record<number, string> = {};
    subtramaCreateVisibleByTrama: Record<number, boolean> = {};
    subtramaCreateSavingTramaId: number | null = null;

    private readonly destroy$ = new Subject<void>();
    private readonly campaignRealtimeRefresh$ = new Subject<CampaignRealtimeEvent>();
    private pendingRequestedSection: UserPrivateProfileSectionId | null = null;
    private pendingRequestedCampaignId: number | null = null;
    private memberSearchTimerId: number | null = null;
    private transferSearchTimerId: number | null = null;
    private campaignSummariesWatchStop: (() => void) | null = null;
    private readonly campaignPolicyAutofixInFlight = new Set<number>();
    private campaignSummariesLiveReady = false;
    readonly campaignNameMinLength = 5;
    readonly campaignNameMaxLength = 150;
    readonly campaignMinimumRollMin = 3;
    readonly campaignMinimumRollMax = 13;
    readonly campaignNepMin = 1;
    readonly campaignNepMax = 20;
    readonly campaignMaxTablesMin = 1;
    readonly campaignMaxTablesMax = 5;
    /** Tiradas de PG de la campaña: 1 es el Manual del jugador y 3, lo que deja la web sin campaña. */
    readonly campaignHpRollsMin = 1;
    readonly campaignHpRollsMax = 3;
    readonly campaignHomebrewSourcesMin = 1;
    readonly campaignHomebrewSourcesMax = 20;
    readonly generadorMinimoOpciones = Array.from({ length: 11 }, (_, index) => index + 3);
    readonly generadorTablasOpciones = Array.from({ length: 5 }, (_, index) => index + 1);
    readonly genderIdentityPresetOptions: { value: GenderIdentityPreset; label: string; }[] = [
        { value: 'male', label: 'Chico' },
        { value: 'female', label: 'Chica' },
        { value: 'hidden', label: 'No mostrar' },
        { value: 'custom', label: 'Rellenar' },
    ];
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    constructor(
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userSettingsSvc: UserSettingsService,
        private campanaSvc: CampanaService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
        private apiActionGuardSvc: ApiActionGuardService,
        private platformSessionSvc: PlatformSessionService,
        private chatFloatingSvc: ChatFloatingService,
        private platformSpacesSvc: PlatformSpacesService,
    ) { }

    ngOnInit(): void {
        this.userSvc.currentPrivateProfile$
            .pipe(takeUntil(this.destroy$))
            .subscribe((profile) => {
                this.profile = profile;
                this.resolvePendingRequestedSection();
            });
        this.campaignRealtimeSyncSvc.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (this.currentSection !== 'campanas')
                    return;
                this.campaignRealtimeRefresh$.next(event);
            });
        this.campaignRealtimeRefresh$
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(250),
                concatMap((event) => from(this.handleCampaignRealtimeEvent(event)))
            )
            .subscribe();
        this.startCampaignSummariesWatch();
        void this.cargar();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest']?.currentValue)
            this.requestSection(changes['openRequest'].currentValue);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
        this.campaignSummariesWatchStop?.();
        this.campaignSummariesWatchStop = null;
    }

    downloadingData = false;

    get accountAlias(): string {
        return `${this.platformSessionSvc.cuenta?.alias ?? ''}`.trim();
    }

    get urlCuentaPlataforma(): string {
        return this.platformSessionSvc.urlSocial('cuenta');
    }

    get urlModeracionPlataforma(): string {
        return this.platformSessionSvc.urlSocial('moderacion');
    }

    /** Normas de Rol pendientes o limitaciones de la cuenta, si las hay. */
    get accountNotice(): string {
        return this.userSvc.getAccessRestrictionMessage('creation');
    }

    editarPerfilPlataforma(): void {
        void this.platformSessionSvc.editarPerfil().catch(() => undefined);
    }

    abrirPrivacidad(): void {
        void this.platformSessionSvc.privacidad().catch(() => undefined);
    }

    async descargarMisDatos(): Promise<void> {
        if (this.downloadingData)
            return;
        this.downloadingData = true;
        try {
            await this.userProfileApiSvc.downloadMyData();
        } catch (error: any) {
            this.appToastSvc.showError(toUserFacingErrorMessage(error, 'No se pudieron preparar tus datos.'));
        } finally {
            this.downloadingData = false;
        }
    }

    get canShowContent(): boolean {
        return !!this.profile;
    }

    get sectionItems(): { id: UserPrivateProfileSectionId; label: string; icon: string; }[] {
        const base: { id: UserPrivateProfileSectionId; label: string; icon: string; }[] = [
            { id: 'resumen', label: 'Mi cuenta', icon: 'badge' },
            { id: 'preferencias', label: 'Preferencias de Rol', icon: 'tune' },
        ];
        if (this.canAccessCampaignManagementSection)
            base.push({ id: 'campanas', label: 'Gestión de campañas', icon: 'diversity_3' });
        return base;
    }

    get allCreatePermissionsEnabled(): boolean {
        const permisos = this.profile?.permissions ?? {};
        return PERMISSION_RESOURCES.every((resource) => permisos?.[resource]?.create === true);
    }

    get permisosCreateActivos(): string[] {
        const permisos = this.profile?.permissions ?? {};
        return Object.keys(permisos)
            .filter((resource) => permisos?.[resource]?.create === true)
            .map((resource) => this.formatCreatePermissionLabel(resource))
            .sort(compararTexto);
    }

    get permisosResumen(): string {
        if (this.allCreatePermissionsEnabled)
            return 'Todos los permisos de creación';
        if (this.permisosCreateActivos.length < 1)
            return 'Sin permisos adicionales';
        return this.permisosCreateActivos.join(', ');
    }

    get campaignNameLength(): number {
        return `${this.campaignCreateDraft ?? ''}`.trim().length;
    }

    get formattedCreatedAt(): string {
        return this.formatDateLabel(this.profile?.createdAt, 'Sin dato');
    }

    get formattedLastSeenAt(): string {
        return this.formatDateLabel(this.profile?.lastSeenAt, 'Sin dato');
    }

    get effectiveProfileRole(): 'jugador' | 'master' | 'colaborador' | 'admin' {
        return this.userSvc.getCurrentRole();
    }

    get profileRoleLabel(): string {
        return this.formatRoleLabel(this.effectiveProfileRole, 'Jugador');
    }

    get requestedRoleTarget(): UserRoleRequestTarget | null {
        if (this.effectiveProfileRole === 'jugador')
            return 'master';
        if (this.effectiveProfileRole === 'master')
            return 'colaborador';
        return null;
    }

    get requestedRoleLabel(): string {
        return this.formatRoleLabel(this.requestedRoleTarget, 'Rol superior');
    }

    get roleRequestPanelTitle(): string {
        if (this.requestedRoleTarget === 'colaborador')
            return 'Acceso a Colaborador';
        if (this.requestedRoleTarget === 'master')
            return 'Acceso a Master';
        return 'Acceso de rol';
    }

    get showRoleRequestPanel(): boolean {
        return !!this.requestedRoleTarget;
    }

    get requestRoleButtonLabel(): string {
        return `Solicitar acceso a ${this.requestedRoleLabel}`;
    }

    get hasRelevantRoleRequestState(): boolean {
        return !!this.requestedRoleTarget
            && this.roleRequestStatus?.requestedRole === this.requestedRoleTarget;
    }

    get hasPendingRoleRequestForCurrentTarget(): boolean {
        return this.hasRelevantRoleRequestState && this.roleRequestStatus?.status === 'pending';
    }

    get hasBlockedRoleRequestForCurrentTarget(): boolean {
        return this.hasRelevantRoleRequestState && this.hasRoleRequestBlock;
    }

    get hasRoleRequestBan(): boolean {
        return `${this.roleRequestStatus?.reasonCode ?? ''}`.trim().toUpperCase() === 'BANNED';
    }

    get canRequestRole(): boolean {
        return !!this.requestedRoleTarget
            && !!this.roleRequestStatus
            && !this.hasPendingRoleRequestForCurrentTarget
            && !this.hasBlockedRoleRequestForCurrentTarget
            && !this.hasRoleRequestBan;
    }

    get hasRoleRequestBlock(): boolean {
        const blockedUntil = this.roleRequestStatus?.blockedUntilUtc;
        if (!blockedUntil)
            return false;
        const parsed = new Date(blockedUntil);
        return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
    }

    get roleRequestStatusLabel(): string {
        if (this.effectiveProfileRole === 'colaborador' || this.effectiveProfileRole === 'admin')
            return `Tu rol actual es ${this.profileRoleLabel}.`;

        if (this.hasPendingRoleRequestForCurrentTarget)
            return 'Tienes una solicitud pendiente de revisión.';
        if (this.hasRelevantRoleRequestState && this.roleRequestStatus?.status === 'approved')
            return 'La última solicitud fue aprobada.';
        if (this.hasRelevantRoleRequestState && this.roleRequestStatus?.status === 'rejected')
            return this.hasRoleRequestBlock
                ? `Solicitud rechazada. No podrás volver a pedirlo hasta ${this.formattedRoleRequestBlockedUntil}.`
                : 'La última solicitud fue rechazada.';
        if (this.canRequestRole || this.roleRequestStatus?.eligible === true)
            return `Puedes solicitar acceso a ${this.requestedRoleLabel}.`;
        return this.roleRequestReasonLabel;
    }

    get roleRequestReasonLabel(): string {
        const reason = `${this.roleRequestStatus?.reasonCode ?? ''}`.trim().toUpperCase();
        if (reason === 'REQUEST_PENDING')
            return 'Ya tienes una solicitud pendiente.';
        if (reason === 'REQUEST_BLOCKED')
            return `No puedes volver a solicitarlo hasta ${this.formattedRoleRequestBlockedUntil}.`;
        if (reason === 'ROLE_NOT_ALLOWED')
            return 'Tu rol actual no puede solicitar este cambio.';
        if (reason === 'ROLE_ALREADY_GRANTED')
            return 'Ya dispones de un rol igual o superior.';
        if (reason === 'BANNED')
            return 'Tu cuenta no puede solicitar cambios de rol en este momento.';
        return 'Ahora mismo no puedes solicitar este cambio de rol.';
    }

    get formattedRoleRequestBlockedUntil(): string {
        return this.formatDateTimeLabel(this.roleRequestStatus?.blockedUntilUtc, 'Sin fecha');
    }

    get roleRequestAdminComment(): string {
        if (!this.hasRelevantRoleRequestState)
            return '';
        return `${this.roleRequestStatus?.adminComment ?? ''}`.trim();
    }

    get roleRequestUserComment(): string {
        if (!this.hasRelevantRoleRequestState)
            return '';
        return `${this.roleRequestStatus?.requestComment ?? ''}`.trim();
    }

    get canCreateCampaignByRole(): boolean {
        const role = `${this.userSvc.getCurrentRole() ?? ''}`.trim().toLowerCase();
        return role === 'master' || role === 'colaborador' || role === 'admin';
    }

    get canCreateCampaign(): boolean {
        return this.canCreateCampaignByRole && this.userSvc.can('campanas', 'create');
    }

    get canAccessCampaignManagementSection(): boolean {
        return this.canCreateCampaign || this.manageableCampaigns.length > 0 || this.currentSection === 'campanas';
    }

    get campaignCreateHint(): string {
        if (!this.canCreateCampaignByRole)
            return 'Solo los Masters y Colaboradores pueden crear campañas.';

        return 'Ahora mismo no tienes permiso para crear campañas nuevas.';
    }

    get manageableCampaigns(): CampaignListItem[] {
        return this.campaigns.filter((campaign) => campaign.campaignRole === 'master');
    }

    get selectedCampaignSummary(): CampaignListItem | null {
        if (!this.selectedCampaignId)
            return null;
        return this.manageableCampaigns.find((campaign) => campaign.id === this.selectedCampaignId) ?? null;
    }

    get selectedCampaignCurrentMembership(): CampaignMemberItem | null {
        const currentUid = `${this.profile?.uid ?? ''}`.trim();
        if (currentUid.length < 1)
            return null;
        return this.selectedCampaignMembers.find((member) => member.uid === currentUid) ?? null;
    }

    get selectedCampaignActorRole(): 'master' | 'jugador' | null {
        return this.selectedCampaignCurrentMembership?.campaignRole
            ?? this.selectedCampaignSummary?.campaignRole
            ?? null;
    }

    get selectedCampaignActorStatus(): 'activo' | 'inactivo' | 'expulsado' | null {
        return this.selectedCampaignCurrentMembership?.membershipStatus
            ?? this.selectedCampaignSummary?.membershipStatus
            ?? null;
    }

    get selectedCampaignCanManage(): boolean {
        return this.selectedCampaignActorRole === 'master' && this.userSvc.canProceed('creation');
    }

    get canOpenSelectedCampaignChat(): boolean {
        return !!this.selectedCampaignSummary
            && this.selectedCampaignActorStatus === 'activo'
            && this.userSvc.canProceed('usage');
    }

    get selectedCampaignCanTransferMaster(): boolean {
        return this.selectedCampaignCanManage
            && !!this.selectedCampaignSpace
            && (this.selectedCampaignTransferCandidates.length > 0 || !!this.selectedCampaignPendingTransfer);
    }

    /** El espacio de la plataforma que lleva la pertenencia: sin él no se puede invitar ni traspasar todavía. */
    get selectedCampaignSpace(): CampaignSpace | null {
        return this.selectedCampaignDetail?.espacio ?? null;
    }

    get selectedCampaignAcceptsRequests(): boolean {
        return this.selectedCampaignSpace?.entrada === 'solicitud';
    }

    get selectedCampaignJoinRequests(): SolicitudEspacio[] {
        return this.selectedCampaignDetail?.joinRequests ?? [];
    }

    get selectedCampaignPendingTransfer(): TraspasoEspacio | null {
        return this.selectedCampaignDetail?.pendingTransfer ?? null;
    }

    get selectedCampaignPendingTransferLabel(): string {
        const transfer = this.selectedCampaignPendingTransfer;
        if (!transfer)
            return '';
        const member = this.selectedCampaignMembers.find((item) => item.uid.toLowerCase() === transfer.cuenta.toLowerCase());
        return member ? this.getUserDisplayLabel(member.displayName, member.email, member.uid) : 'un jugador';
    }

    get selectedCampaignMembers(): CampaignMemberItem[] {
        return this.selectedCampaignDetail?.members ?? [];
    }

    get selectedCampaignTransferCandidates(): CampaignMemberItem[] {
        return this.selectedCampaignMembers.filter((member) => member.campaignRole !== 'master' && member.isActive);
    }

    get selectedCampaignTramas(): CampaignTramaItem[] {
        return this.selectedCampaignDetail?.tramas ?? [];
    }

    get selectedCampaignPendingInvitations(): InvitacionEnviadaEspacio[] {
        return this.selectedCampaignDetail?.pendingInvitations ?? [];
    }

    get selectedCampaignMaster(): CampaignMemberItem | null {
        return this.selectedCampaignMembers.find((member) => member.campaignRole === 'master' && member.isActive) ?? null;
    }

    get selectedCampaignHasActiveMaster(): boolean {
        return !!this.selectedCampaignMaster;
    }

    get isCreatingCampaign(): boolean {
        return this.campaignWorkspaceMode === 'create';
    }

    get isCampaignWorkspaceIdle(): boolean {
        return this.campaignWorkspaceMode === 'idle';
    }

    get isCampaignWorkspaceConfig(): boolean {
        return this.campaignWorkspaceMode === 'config';
    }

    get isCampaignWorkspacePeopleStories(): boolean {
        return this.campaignWorkspaceMode === 'peopleStories';
    }

    get isCampaignWorkspaceUsersTab(): boolean {
        return this.campaignWorkspaceTab === 'usuarios';
    }

    get isCampaignWorkspaceStoriesTab(): boolean {
        return this.campaignWorkspaceTab === 'historias';
    }

    get campaignWorkspaceTitle(): string {
        if (this.isCreatingCampaign)
            return 'Nueva campaña';
        if (this.isCampaignWorkspaceConfig)
            return 'Configuración de campaña';
        if (this.isCampaignWorkspacePeopleStories && this.isCampaignWorkspaceStoriesTab)
            return 'Historias de campaña';
        if (this.isCampaignWorkspacePeopleStories)
            return 'Usuarios de campaña';
        if (this.selectedCampaignSummary)
            return this.selectedCampaignSummary.nombre;
        return 'Gestión de campañas';
    }

    get campaignEditorSubmitLabel(): string {
        return this.isCreatingCampaign ? 'Crear campaña' : 'Guardar cambios';
    }

    get campaignEditorNamePlaceholder(): string {
        return this.isCreatingCampaign ? 'Nombre de la nueva campaña' : 'Nombre de campaña';
    }

    get campaignEditorSaving(): boolean {
        return this.campaignCreateSaving || this.campaignRenameSaving;
    }

    get campaignEditorCanSave(): boolean {
        return this.isCreatingCampaign ? this.canCreateCampaign : this.selectedCampaignCanManage;
    }

    get campaignEditorFormDisabled(): boolean {
        return this.campaignEditorSaving || !this.campaignEditorCanSave;
    }

    get campaignHomebrewMode(): 'none' | 'general' | 'limitado' {
        if (this.campaignCreatePolicyDraft.permitirHomebrewGeneral === true)
            return 'general';
        if ((this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje ?? 0) === 0)
            return 'none';
        return 'limitado';
    }

    get showCampaignHomebrewLimitInput(): boolean {
        return this.campaignHomebrewMode === 'limitado';
    }

    get showCampaignHomebrewAdvancedToggles(): boolean {
        return this.campaignHomebrewMode !== 'none';
    }

    get campaignHomebrewLimitDisabled(): boolean {
        return this.campaignEditorFormDisabled || !this.showCampaignHomebrewLimitInput;
    }

    async cargar(): Promise<void> {
        this.loading = true;
        this.loadErrorMessage = '';
        try {
            const [profile, settings, campaigns] = await Promise.all([
                this.userSvc.refreshCurrentPrivateProfile(),
                this.userSettingsSvc.loadSettings(true).catch(() => null),
                this.campanaSvc.listProfileCampaigns().catch(() => []),
            ]);
            this.profile = profile;
            this.applySettingsToForm(settings);
            this.campaigns = this.filterManageableCampaigns(campaigns);
            this.campaignsLoaded = true;
            await this.cargarEstadoSolicitudRol();
            if (!this.canAccessCampaignManagementSection && this.currentSection === 'campanas')
                this.currentSection = 'resumen';
        } catch (error: any) {
            this.loadErrorMessage = `${error?.message ?? 'No se pudo cargar el perfil.'}`.trim();
        } finally {
            this.loading = false;
        }
    }

    /** Preferencias propias de Rol, guardadas en los ajustes de la web en la cuenta de Yosiftware. */
    async guardarPreferencias(): Promise<void> {
        if (this.settingsSaving)
            return;

        this.settingsSaving = true;
        try {
            const nextGeneradorConfig: NuevoPersonajeGeneradorConfig = {
                minimoSeleccionado: this.normalizeGeneradorMinimo(this.generadorMinimoSeleccionado),
                tablasPermitidas: this.normalizeGeneradorTablas(this.generadorTablasPermitidas),
                updatedAt: Date.now(),
            };
            const current = this.settings ?? await this.userSettingsSvc.loadSettings();
            const saved = await this.userSettingsSvc.saveSettings({
                ...current,
                perfil: {
                    ...current.perfil,
                    visibilidadPorDefectoPersonajes: this.visibilidadPorDefectoPersonajes === true,
                    autoAbrirVentanaChats: this.autoAbrirVentanaChats !== false,
                    permitirBurbujasChat: this.permitirBurbujasChat !== false,
                },
                nuevo_personaje: {
                    ...current.nuevo_personaje,
                    generador_config: nextGeneradorConfig,
                },
            });
            this.applySettingsToForm(saved);
            this.chatFloatingSvc.applyProfileSettings(saved.perfil);
            this.appToastSvc.showSuccess('Preferencias guardadas.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudieron guardar las preferencias.'));
        } finally {
            this.settingsSaving = false;
        }
    }

    async resetearPosicionPreview(): Promise<void> {
        if (this.previewResetting)
            return;

        this.previewResetting = true;
        try {
            await this.userSettingsSvc.clearPreviewPlacements();
            const currentSettings = this.settings ?? await this.userSettingsSvc.loadSettings();
            this.settings = {
                ...currentSettings,
                nuevo_personaje: {
                    ...currentSettings.nuevo_personaje,
                    preview_minimizada: null,
                    preview_restaurada: null,
                },
            };
            this.appToastSvc.showSuccess('Posición de preview restablecida.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo restablecer la preview.'));
        } finally {
            this.previewResetting = false;
        }
    }

    onGeneradorMinimoSeleccionadoChange(value: number | string | null | undefined): void {
        this.generadorMinimoSeleccionado = this.normalizeGeneradorMinimo(Number(value));
    }

    onGeneradorTablasPermitidasChange(value: number | string | null | undefined): void {
        this.generadorTablasPermitidas = this.normalizeGeneradorTablas(Number(value));
    }

    private applySettingsToForm(settings: UserSettingsV1 | null): void {
        this.settings = settings;
        this.visibilidadPorDefectoPersonajes = settings?.perfil?.visibilidadPorDefectoPersonajes === true;
        this.autoAbrirVentanaChats = settings?.perfil?.autoAbrirVentanaChats !== false;
        this.permitirBurbujasChat = settings?.perfil?.permitirBurbujasChat !== false;
        this.generadorMinimoSeleccionado = this.normalizeGeneradorMinimo(settings?.nuevo_personaje?.generador_config?.minimoSeleccionado ?? 13);
        this.generadorTablasPermitidas = this.normalizeGeneradorTablas(settings?.nuevo_personaje?.generador_config?.tablasPermitidas ?? 3);
    }

    private normalizeGeneradorMinimo(value: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return 13;
        return Math.min(13, Math.max(3, parsed));
    }

    private normalizeGeneradorTablas(value: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return 3;
        return Math.min(5, Math.max(1, parsed));
    }

    async solicitarCambioRol(): Promise<void> {
        const target = this.requestedRoleTarget;
        if (!target || !this.canRequestRole || this.roleRequestSubmitting)
            return;
        if (!this.shouldRunGuardedApiAction(`profile.role-request.${target}`))
            return;

        this.roleRequestSubmitting = true;
        try {
            this.roleRequestStatus = await this.userProfileApiSvc.createRoleRequest(
                target,
                this.normalizeOptionalMultilineText(this.roleRequestCommentDraft)
            );
            this.roleRequestCommentDraft = '';
            this.appToastSvc.showSuccess(`Solicitud para ser ${this.requestedRoleLabel} enviada. Queda pendiente de revisión.`, {
                category: 'cuentaSistema',
            });
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo registrar la solicitud.'));
        } finally {
            this.roleRequestSubmitting = false;
        }
    }

    async setSection(section: UserPrivateProfileSectionId, preferredCampaignId?: number | null): Promise<void> {
        if (section !== 'resumen' && section !== 'preferencias' && section !== 'campanas')
            section = 'resumen';
        if (section === 'campanas' && !this.canAccessCampaignManagementSection) {
            this.currentSection = 'resumen';
            return;
        }
        this.currentSection = section;
        this.pendingRequestedSection = null;
        this.pendingRequestedCampaignId = null;
        if (section === 'campanas' && this.toPositiveInt(preferredCampaignId)) {
            this.campaignWorkspaceMode = 'idle';
            this.campaignWorkspaceTab = 'usuarios';
        }
        if (section === 'campanas')
            await this.ensureCampaignSectionLoaded(true, preferredCampaignId);
    }

    onSectionNavClick(section: UserPrivateProfileSectionId, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        void this.setSection(section);
    }

    onSectionNavPointerDown(section: UserPrivateProfileSectionId, event: PointerEvent): void {
        if (event.button !== 0 || this.currentSection === section)
            return;
        event.preventDefault();
        event.stopPropagation();
        void this.setSection(section);
    }

    async seleccionarCampana(campaignId: number): Promise<void> {
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'idle';
        this.campaignWorkspaceTab = 'usuarios';
    }

    seleccionarNuevaCampana(): void {
        this.selectedCampaignId = null;
        this.selectedCampaignDetail = null;
        this.selectedCampaignErrorMessage = '';
        this.campaignWorkspaceMode = 'create';
        this.campaignWorkspaceTab = 'usuarios';
        this.resetCampaignEditorToCreateMode();
        this.resetCampaignDetailEditors();
    }

    async abrirConfiguracionCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'config';
        this.campaignWorkspaceTab = 'usuarios';
    }

    async abrirUsuariosCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'peopleStories';
        this.campaignWorkspaceTab = 'usuarios';
    }

    async abrirHistoriasCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'peopleStories';
        this.campaignWorkspaceTab = 'historias';
    }

    async guardarCampanaDesdeEditor(): Promise<void> {
        if (this.isCreatingCampaign) {
            await this.crearCampana();
            return;
        }
        await this.guardarNombreCampana();
    }

    setCampaignHomebrewMode(mode: 'none' | 'general' | 'limitado'): void {
        if (mode === 'none') {
            this.campaignCreatePolicyDraft.permitirHomebrewGeneral = false;
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = 0;
            this.campaignCreatePolicyDraft.permitirVentajasDesventajas = false;
            this.campaignCreatePolicyDraft.permitirIgnorarRestriccionesAlineamiento = false;
            return;
        }

        if (mode === 'general') {
            this.campaignCreatePolicyDraft.permitirHomebrewGeneral = true;
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = null;
            return;
        }

        this.campaignCreatePolicyDraft.permitirHomebrewGeneral = false;
        this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = this.normalizeCampaignHomebrewLimit(
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
            1
        );
    }

    onCampaignHomebrewLimitBlur(): void {
        if (this.campaignHomebrewMode !== 'limitado')
            return;

        this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = this.normalizeCampaignHomebrewLimit(
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
            1
        );
    }

    onCampaignMinimumRollBlur(): void {
        this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = this.normalizeCampaignMinimumRoll(
            this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica
        );
    }

    onCampaignMaxNepBlur(): void {
        this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = this.normalizeCampaignMaxNep(
            this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo
        );
    }

    onCampaignMaxTablesBlur(): void {
        this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = this.normalizeCampaignMaxTables(
            this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas
        );
    }

    onCampaignHpRollsBlur(): void {
        this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe = this.normalizeCampaignHpRolls(
            this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe
        );
    }

    abrirInfoCampaignHomebrew(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        void Swal.fire({
            title: 'Homebrew de campaña',
            icon: 'info',
            html: `
                <p style="text-align:left; margin-bottom:8px;"><strong>No permitir homebrew</strong>: bloquea excepciones generales de contenido.</p>
                <p style="text-align:left; margin-bottom:8px;"><strong>Permitir solo N fuentes</strong>: admite un margen controlado y medible.</p>
                <p style="text-align:left; margin:0;"><strong>Permitir homebrew en general</strong>: deja la campaña abierta a excepciones amplias.</p>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    abrirInfoCampaignAlignmentOverride(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        void Swal.fire({
            title: 'Restricciones de alineamiento',
            icon: 'info',
            html: `
                <p style="text-align:left; margin-bottom:8px;">Esta opción no elimina los avisos del creador de personaje.</p>
                <p style="text-align:left; margin-bottom:8px;">Si está desactivada, el frontend bloquea elecciones que rompan reglas duras de alineamiento.</p>
                <p style="text-align:left; margin:0;">Si está activada, se puede continuar, pero el personaje queda marcado como Homebrew y se avisa de que será una rareza excepcional.</p>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    async crearCampana(): Promise<void> {
        if (!this.canCreateCampaign || this.campaignCreateSaving)
            return;

        const validationError = this.validateCampaignName(this.campaignCreateDraft);
        if (validationError) {
            this.appToastSvc.showError(validationError);
            return;
        }
        if (!this.shouldRunGuardedApiAction('campaign.create'))
            return;

        this.campaignCreateSaving = true;
        try {
            const normalizedPolicy = this.buildCampaignPolicyForSave();
            const created = await this.campanaSvc.createCampaign({
                nombre: this.campaignCreateDraft,
                politicaCreacion: normalizedPolicy,
            });
            this.campaignCreateDraft = '';
            this.campaignCreatePolicyDraft = this.createDefaultCampaignPolicyDraft();
            this.campaignWorkspaceMode = 'config';
            this.showCampaignSuccess('Campaña creada correctamente.');
            await this.reloadCampaigns(created.id);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la campaña.', 'creation'));
        } finally {
            this.campaignCreateSaving = false;
        }
    }

    async guardarNombreCampana(): Promise<void> {
        if (!this.selectedCampaignCanManage || !this.selectedCampaignId || this.campaignRenameSaving)
            return;

        const validationError = this.validateCampaignName(this.campaignCreateDraft);
        if (validationError) {
            this.appToastSvc.showError(validationError);
            return;
        }
        if (!this.shouldRunGuardedApiAction(`campaign.update.${this.selectedCampaignId}`))
            return;

        this.campaignRenameSaving = true;
        try {
            const normalizedPolicy = this.buildCampaignPolicyForSave();
            await this.campanaSvc.updateCampaign(this.selectedCampaignId, {
                nombre: this.campaignCreateDraft,
                politicaCreacion: normalizedPolicy,
            });
            this.showCampaignSuccess('Campaña actualizada.');
            await this.reloadCampaigns(this.selectedCampaignId);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la campaña.', 'creation'));
        } finally {
            this.campaignRenameSaving = false;
        }
    }

    async abrirChatCampanaSeleccionada(): Promise<void> {
        if (!this.selectedCampaignId || !this.canOpenSelectedCampaignChat)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.chat.open.${this.selectedCampaignId}`))
            return;

        try {
            const conversacion = await this.campanaSvc.getCampaignConversation(this.selectedCampaignId);
            const abierta = await this.chatFloatingSvc.abrir(conversacion.conversacionId);
            if (!abierta)
                this.appToastSvc.showError('El chat de Yosiftware no está disponible ahora mismo.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo abrir el chat de la campaña.'));
        }
    }

    abrirVistaSocialCampana(): void {
        if (!this.selectedCampaignId)
            return;

        this.userProfileNavSvc.openSocial({
            section: 'campanas',
            campaignId: this.selectedCampaignId,
            requestId: Date.now(),
        });
    }

    async cambiarHistorialMiembros(value: boolean): Promise<void> {
        if (!this.selectedCampaignId)
            return;
        await this.loadCampaignSelection(this.selectedCampaignId, true, value === true);
    }

    async toggleHistorialMiembros(): Promise<void> {
        await this.cambiarHistorialMiembros(!(this.selectedCampaignDetail?.includeInactiveMembers === true));
    }

    onMemberSearchQueryChange(): void {
        this.memberSearchErrorMessage = '';
        this.scheduleUserSearch('member');
    }

    async agregarJugador(result: CampaignUserSearchResult): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.member.invite.${this.selectedCampaignId}.${result.uid}`))
            return;

        this.memberInviteInFlightUid = result.uid;
        try {
            await this.platformSpacesSvc.invitarCuenta(espacio.id, result.uid);
            this.memberSearchQuery = '';
            this.memberSearchResults = [];
            this.memberSearchErrorMessage = '';
            this.showCampaignSuccess('Invitación enviada. Le llegará un aviso para aceptarla en Rol.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo enviar la invitación.'));
        } finally {
            this.memberInviteInFlightUid = '';
        }
    }

    /** La plataforma envía el correo y nunca dice si es de una cuenta. */
    async invitarPorCorreo(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        const correo = `${this.memberInviteEmailDraft ?? ''}`.trim();
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.memberInviteEmailSending)
            return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            this.appToastSvc.showError('Escribe un correo válido.');
            return;
        }
        if (!this.shouldRunGuardedApiAction(`campaign.member.invite-email.${this.selectedCampaignId}`))
            return;

        this.memberInviteEmailSending = true;
        try {
            await this.platformSpacesSvc.invitarCorreo(espacio.id, correo);
            this.memberInviteEmailDraft = '';
            this.showCampaignSuccess('Invitación enviada a ese correo.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo enviar la invitación.'));
        } finally {
            this.memberInviteEmailSending = false;
        }
    }

    async cancelarInvitacionCampana(invitation: InvitacionEnviadaEspacio): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        const inviteId = Math.trunc(Number(invitation?.id));
        if (!espacio || inviteId <= 0 || this.campaignInviteCancelInFlightId === inviteId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.invitation.cancel.${inviteId}`))
            return;

        this.campaignInviteCancelInFlightId = inviteId;
        try {
            await this.platformSpacesSvc.retirarInvitacion(espacio.id, inviteId);
            this.showCampaignSuccess('Invitación retirada.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo retirar la invitación.'));
        } finally {
            this.campaignInviteCancelInFlightId = null;
        }
    }

    async resolverSolicitud(request: SolicitudEspacio, accion: 'aprobar' | 'rechazar'): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.joinRequestInFlightId === request.id)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.request.${request.id}.${accion}`))
            return;

        this.joinRequestInFlightId = request.id;
        try {
            await this.platformSpacesSvc.resolverSolicitud(espacio.id, request.id, accion);
            if (accion === 'aprobar')
                await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess(accion === 'aprobar' ? 'Solicitud aprobada: ya está en la campaña.' : 'Solicitud rechazada.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo responder a la solicitud.'));
        } finally {
            this.joinRequestInFlightId = null;
        }
    }

    /** Solo por invitación o también por solicitud (Rol no ofrece la entrada abierta). */
    async cambiarEntradaCampana(admitirSolicitudes: boolean): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.entryModeSaving)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.entry.${this.selectedCampaignId}`))
            return;

        this.entryModeSaving = true;
        try {
            await this.platformSpacesSvc.cambiarEntrada(espacio.id, admitirSolicitudes ? 'solicitud' : 'invitacion');
            await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess(admitirSolicitudes
                ? 'La campaña admite solicitudes: comparte su enlace para que pidan entrar.'
                : 'La campaña solo admite invitaciones.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo cambiar cómo se entra en la campaña.'));
        } finally {
            this.entryModeSaving = false;
        }
    }

    get selectedCampaignEntryLink(): string {
        if (!this.selectedCampaignId)
            return '';
        return `${window.location.origin}/?vista=campanas&campana=${this.selectedCampaignId}`;
    }

    async copiarEnlaceCampana(): Promise<void> {
        const enlace = this.selectedCampaignEntryLink;
        if (!enlace)
            return;
        try {
            await navigator.clipboard.writeText(enlace);
            this.showCampaignInfo('Enlace copiado.');
        } catch {
            this.appToastSvc.showError('No se pudo copiar el enlace.');
        }
    }

    async retirarJugador(member: CampaignMemberItem): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || member.campaignRole === 'master')
            return;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sacar de la campaña',
            text: `${this.getUserDisplayLabel(member.displayName, member.email, member.uid)} dejará de ver la campaña. Sus personajes se quedan en ella, y solo podrá volver con una invitación nueva.`,
            showCancelButton: true,
            confirmButtonText: 'Sacar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.member.remove.${this.selectedCampaignId}.${member.uid}`))
            return;

        this.memberRemoveInFlightUid = member.uid;
        try {
            await this.platformSpacesSvc.sacar(espacio.id, member.uid);
            await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess('Jugador fuera de la campaña.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo sacar al jugador.'));
        } finally {
            this.memberRemoveInFlightUid = '';
        }
    }

    seleccionarNuevoMaster(member: CampaignMemberItem): void {
        this.transferSelectedUser = {
            uid: member.uid,
            displayName: member.displayName,
            photoThumbUrl: null,
        };
        this.transferSearchQuery = this.getUserDisplayLabel(member.displayName, member.email, member.uid);
        this.transferSearchResults = [];
        this.transferSearchErrorMessage = '';
    }

    limpiarNuevoMaster(): void {
        this.transferSelectedUser = null;
        this.transferSearchQuery = '';
        this.transferSearchResults = [];
        this.transferSearchErrorMessage = '';
        this.clearSearchTimer('transfer');
    }

    /** El traspaso de la plataforma: el jugador tiene que aceptarlo (7 días); el máster saliente queda como jugador. */
    async transferirMaster(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || !this.transferSelectedUser || this.transferSaving)
            return;

        if (this.transferSelectedUser.uid === this.selectedCampaignMaster?.uid) {
            this.appToastSvc.showError('El usuario seleccionado ya es el master actual.');
            return;
        }
        if (!this.shouldRunGuardedApiAction(`campaign.master.transfer.${this.selectedCampaignId}.${this.transferSelectedUser.uid}`))
            return;

        this.transferSaving = true;
        try {
            await this.platformSpacesSvc.ofrecerTraspaso(espacio.id, this.transferSelectedUser.uid);
            this.showCampaignSuccess('Traspaso ofrecido. Pasará a ser el máster cuando lo acepte.');
            this.limpiarNuevoMaster();
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo ofrecer el traspaso.'));
        } finally {
            this.transferSaving = false;
        }
    }

    async cancelarTraspaso(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.transferCancelInFlight)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.master.transfer-cancel.${this.selectedCampaignId}`))
            return;

        this.transferCancelInFlight = true;
        try {
            await this.platformSpacesSvc.cancelarTraspaso(espacio.id);
            this.showCampaignSuccess('Traspaso cancelado.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo cancelar el traspaso.'));
        } finally {
            this.transferCancelInFlight = false;
        }
    }

    private async reloadSelectedCampaign(): Promise<void> {
        if (this.selectedCampaignId)
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
    }

    async crearTrama(): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || this.tramaCreateSaving)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.trama.create.${this.selectedCampaignId}`))
            return;

        this.tramaCreateSaving = true;
        try {
            await this.campanaSvc.createTrama(this.selectedCampaignId, {
                nombre: this.tramaCreateDraft,
                visibleParaJugadores: this.tramaCreateVisibleParaJugadores,
            });
            this.tramaCreateDraft = '';
            this.tramaCreateVisibleParaJugadores = true;
            this.showCampaignSuccess('Trama creada correctamente.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la trama.', 'creation'));
        } finally {
            this.tramaCreateSaving = false;
        }
    }

    iniciarEdicionTrama(trama: CampaignTramaItem): void {
        this.editingTramaId = trama.id;
        this.editingTramaDraft = trama.nombre;
        this.editingTramaVisibleParaJugadores = trama.visibleParaJugadores === true;
    }

    cancelarEdicionTrama(): void {
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.editingTramaVisibleParaJugadores = true;
        this.tramaSaveInFlightId = null;
    }

    async guardarEdicionTrama(): Promise<void> {
        if (!this.editingTramaId || this.tramaSaveInFlightId === this.editingTramaId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.trama.update.${this.editingTramaId}`))
            return;

        this.tramaSaveInFlightId = this.editingTramaId;
        try {
            await this.campanaSvc.updateTrama(this.editingTramaId, {
                nombre: this.editingTramaDraft,
                visibleParaJugadores: this.editingTramaVisibleParaJugadores,
            });
            this.showCampaignSuccess('Trama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionTrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la trama.', 'creation'));
        } finally {
            this.tramaSaveInFlightId = null;
        }
    }

    iniciarEdicionSubtrama(subtrama: CampaignSubtramaItem): void {
        this.editingSubtramaId = subtrama.id;
        this.editingSubtramaDraft = subtrama.nombre;
        this.editingSubtramaVisibleParaJugadores = subtrama.visibleParaJugadores === true;
    }

    cancelarEdicionSubtrama(): void {
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.editingSubtramaVisibleParaJugadores = true;
        this.subtramaSaveInFlightId = null;
    }

    async guardarEdicionSubtrama(): Promise<void> {
        if (!this.editingSubtramaId || this.subtramaSaveInFlightId === this.editingSubtramaId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.subtrama.update.${this.editingSubtramaId}`))
            return;

        this.subtramaSaveInFlightId = this.editingSubtramaId;
        try {
            await this.campanaSvc.updateSubtrama(this.editingSubtramaId, {
                nombre: this.editingSubtramaDraft,
                visibleParaJugadores: this.editingSubtramaVisibleParaJugadores,
            });
            this.showCampaignSuccess('Subtrama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionSubtrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la subtrama.', 'creation'));
        } finally {
            this.subtramaSaveInFlightId = null;
        }
    }

    actualizarNuevaSubtrama(tramaId: number, value: string): void {
        this.subtramaCreateDraftByTrama = {
            ...this.subtramaCreateDraftByTrama,
            [tramaId]: value,
        };
    }

    actualizarNuevaSubtramaVisible(tramaId: number, value: boolean): void {
        this.subtramaCreateVisibleByTrama = {
            ...this.subtramaCreateVisibleByTrama,
            [tramaId]: value === true,
        };
    }

    async crearSubtrama(tramaId: number): Promise<void> {
        if (!this.selectedCampaignCanManage || this.subtramaCreateSavingTramaId === tramaId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.subtrama.create.${tramaId}`))
            return;

        this.subtramaCreateSavingTramaId = tramaId;
        try {
            await this.campanaSvc.createSubtrama(tramaId, {
                nombre: this.subtramaCreateDraftByTrama[tramaId] ?? '',
                visibleParaJugadores: this.subtramaCreateVisibleByTrama[tramaId] !== false,
            });
            this.subtramaCreateDraftByTrama = {
                ...this.subtramaCreateDraftByTrama,
                [tramaId]: '',
            };
            this.subtramaCreateVisibleByTrama = {
                ...this.subtramaCreateVisibleByTrama,
                [tramaId]: true,
            };
            this.showCampaignSuccess('Subtrama creada correctamente.');
            if (this.selectedCampaignId)
                await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la subtrama.', 'creation'));
        } finally {
            this.subtramaCreateSavingTramaId = null;
        }
    }

    isCampaignSelected(campaignId: number): boolean {
        return this.selectedCampaignId === campaignId;
    }

    isRemovingMember(uid: string): boolean {
        return this.memberRemoveInFlightUid === uid;
    }

    isAddingMember(uid: string): boolean {
        return this.memberInviteInFlightUid === uid;
    }

    isCancelingCampaignInvitation(inviteId: number): boolean {
        return this.campaignInviteCancelInFlightId === inviteId;
    }

    isEditingTrama(tramaId: number): boolean {
        return this.editingTramaId === tramaId;
    }

    isSavingTrama(tramaId: number): boolean {
        return this.tramaSaveInFlightId === tramaId;
    }

    isEditingSubtrama(subtramaId: number): boolean {
        return this.editingSubtramaId === subtramaId;
    }

    isSavingSubtrama(subtramaId: number): boolean {
        return this.subtramaSaveInFlightId === subtramaId;
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

    getMembershipStatusLabel(status: string | null | undefined): string {
        const normalized = `${status ?? ''}`.trim().toLowerCase();
        if (normalized === 'inactivo')
            return 'Inactivo';
        if (normalized === 'expulsado')
            return 'Expulsado';
        if (normalized === 'activo')
            return 'Activo';
        return 'Sin estado';
    }

    getCampaignVisibilityLabel(visibleParaJugadores: boolean | null | undefined): string {
        return visibleParaJugadores === false ? 'Solo master' : 'Visible para jugadores';
    }

    getUserDisplayLabel(displayName: string | null | undefined, email: string | null | undefined, uid: string): string {
        const nombre = `${displayName ?? ''}`.trim();
        if (nombre.length > 0)
            return nombre;
        const correo = `${email ?? ''}`.trim();
        if (correo.length > 0)
            return correo;
        return 'Usuario sin nombre';
    }

    formatOptionalDateTime(value: string | null | undefined, fallback: string = 'Sin dato'): string {
        return this.formatDateTimeLabel(value, fallback);
    }

    private formatRoleLabel(role: string | null | undefined, fallback: string = 'Sin rol'): string {
        const normalized = `${role ?? ''}`.trim().toLowerCase();
        if (normalized === 'admin')
            return 'Admin';
        if (normalized === 'colaborador')
            return 'Colaborador';
        if (normalized === 'master')
            return 'Master';
        if (normalized === 'jugador')
            return 'Jugador';
        return fallback;
    }

    trackByCampaignId(index: number, item: CampaignListItem): number {
        return item.id;
    }

    trackByMemberUid(index: number, item: CampaignMemberItem): string {
        return item.uid;
    }

    trackByTramaId(index: number, item: CampaignTramaItem): number {
        return item.id;
    }

    trackBySubtramaId(index: number, item: CampaignSubtramaItem): number {
        return item.id;
    }

    trackByUserUid(index: number, item: CampaignUserSearchResult): string {
        return item.uid;
    }

    private requestSection(request: UserPrivateProfileOpenRequest | UserPrivateProfileSectionId | null | undefined): void {
        const target = typeof request === 'string'
            ? request
            : request?.section ?? 'resumen';
        this.pendingRequestedSection = target;
        this.pendingRequestedCampaignId = typeof request === 'string'
            ? null
            : this.toPositiveInt(request?.campaignId);
        this.resolvePendingRequestedSection();
    }

    private resolvePendingRequestedSection(): void {
        if (!this.pendingRequestedSection)
            return;


        void this.setSection(this.pendingRequestedSection, this.pendingRequestedCampaignId);
    }

    private showCampaignSuccess(message: string): void {
        this.appToastSvc.showSuccess(message, { category: 'campanas' });
    }

    private showCampaignInfo(message: string): void {
        this.appToastSvc.showInfo(message, { category: 'campanas' });
    }

    private createDefaultCampaignPolicyDraft(): CampaignCreationPolicy {
        return {
            tiradaMinimaCaracteristica: 3,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
            maxTiradasPuntosGolpe: this.campaignHpRollsMax,
        };
    }

    private buildCampaignPolicyForSave(): CampaignCreationPolicy {
        const homebrewMode = this.campaignHomebrewMode;
        const permitirHomebrewGeneral = homebrewMode === 'general';
        const maxFuentesHomebrew = homebrewMode === 'general'
            ? null
            : homebrewMode === 'limitado'
                ? this.normalizeCampaignHomebrewLimit(
                    this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
                    1
                )
                : 0;
        return {
            tiradaMinimaCaracteristica: this.normalizeCampaignMinimumRoll(this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica),
            nepMaximoPersonajeNuevo: this.normalizeCampaignMaxNep(this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo),
            maxTablasDadosCaracteristicas: this.normalizeCampaignMaxTables(this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas),
            permitirHomebrewGeneral,
            permitirVentajasDesventajas: homebrewMode !== 'none'
                && this.campaignCreatePolicyDraft.permitirVentajasDesventajas === true,
            permitirIgnorarRestriccionesAlineamiento: homebrewMode !== 'none'
                && this.campaignCreatePolicyDraft.permitirIgnorarRestriccionesAlineamiento === true,
            maxFuentesHomebrewGeneralesPorPersonaje: maxFuentesHomebrew,
            maxTiradasPuntosGolpe: this.normalizeCampaignHpRolls(this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe),
        };
    }

    private normalizeCampaignMinimumRoll(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return this.campaignMinimumRollMin;
        return Math.min(this.campaignMinimumRollMax, Math.max(this.campaignMinimumRollMin, parsed));
    }

    private normalizeCampaignMaxNep(value: number | null | undefined): number | null {
        if (value === null || value === undefined || `${value}`.trim() === '')
            return null;
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return null;
        return Math.min(this.campaignNepMax, Math.max(this.campaignNepMin, parsed));
    }

    private normalizeCampaignMaxTables(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return this.campaignMaxTablesMin;
        return Math.min(this.campaignMaxTablesMax, Math.max(this.campaignMaxTablesMin, parsed));
    }

    /** Las tiradas de PG de la campaña: 1 (Manual del jugador) a 3; sin dato, 3, como sin campaña. */
    private normalizeCampaignHpRolls(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (value === null || value === undefined || !Number.isFinite(parsed))
            return this.campaignHpRollsMax;
        return Math.min(this.campaignHpRollsMax, Math.max(this.campaignHpRollsMin, parsed));
    }

    private normalizeCampaignHomebrewLimit(value: number | null | undefined, fallback: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return fallback;
        return Math.min(this.campaignHomebrewSourcesMax, Math.max(fallback, parsed));
    }

    private validateCampaignName(value: string | null | undefined): string | null {
        const name = `${value ?? ''}`.trim();
        if (name.length < this.campaignNameMinLength || name.length > this.campaignNameMaxLength)
            return `El nombre de campaña debe tener entre ${this.campaignNameMinLength} y ${this.campaignNameMaxLength} caracteres.`;
        if (this.isNumericOnlyText(name))
            return 'El nombre de campaña no puede estar formado solo por números.';
        return null;
    }

    private normalizeOptionalMultilineText(value: string | null | undefined): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

    private isNumericOnlyText(value: string | null | undefined): boolean {
        const compact = `${value ?? ''}`.replace(/\s+/g, '');
        return compact.length > 0 && /^\d+$/.test(compact);
    }

    private shouldRunGuardedApiAction(actionKey: string): boolean {
        const accessScope = this.resolveActionAccessScope(actionKey);
        const accessRestrictionMessage = this.userSvc.getAccessRestrictionMessage(accessScope);
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

    private mapProfileError(error: any, fallback: string, scope: UserAccessScope = 'usage'): string {
        const complianceError = this.resolveComplianceErrorMessage(error, scope);
        if (complianceError)
            return complianceError;

        return toUserFacingErrorMessage(error, fallback);
    }

    private mapCampaignError(error: any, fallback: string, scope: UserAccessScope = 'usage'): string {
        const complianceError = this.resolveComplianceErrorMessage(error, scope);
        if (complianceError)
            return complianceError;
        return toUserFacingErrorMessage(error, fallback);
    }

    private resolveComplianceErrorMessage(error: any, scope: UserAccessScope): string {
        const restriction = this.resolveComplianceRestriction(error, scope);
        if (restriction === 'temporaryBan')
            return 'Tu cuenta está restringida temporalmente. Solo puedes revisar tu estado hasta que termine la sanción.';
        if (restriction === 'permanentBan')
            return 'Tu cuenta no puede realizar esta acción en este momento.';
        if (restriction === 'mustAcceptUsage')
            return 'Debes aceptar las normas de uso vigentes antes de continuar.';
        if (restriction === 'mustAcceptCreation')
            return 'Debes aceptar las normas de creación vigentes antes de continuar.';
        return '';
    }

    private resolveComplianceRestriction(error: any, scope: UserAccessScope): UserAccessRestrictionReason | null {
        return this.userSvc.resolveComplianceRestrictionFromError(error, scope);
    }

    private resolveActionAccessScope(actionKey: string): UserAccessScope {
        const normalized = `${actionKey ?? ''}`.trim().toLowerCase();
        if (normalized === 'campaign.create'
            || normalized.startsWith('campaign.update.')
            || normalized.startsWith('campaign.trama.create.')
            || normalized.startsWith('campaign.trama.update.')
            || normalized.startsWith('campaign.subtrama.create.')
            || normalized.startsWith('campaign.subtrama.update.')) {
            return 'creation';
        }
        return 'usage';
    }

    private formatDateLabel(value: string | null | undefined, fallback: string): string {
        const source = `${value ?? ''}`.trim();
        if (source.length < 1)
            return fallback;

        const parsed = new Date(source);
        if (Number.isNaN(parsed.getTime()))
            return fallback;

        return this.dateFormatter.format(parsed);
    }

    private formatDateTimeLabel(value: string | null | undefined, fallback: string): string {
        const text = `${value ?? ''}`.trim();
        if (text.length < 1)
            return fallback;

        const parsed = new Date(text);
        if (Number.isNaN(parsed.getTime()))
            return fallback;

        return this.dateTimeFormatter.format(parsed).replace(',', '');
    }

    private formatCreatePermissionLabel(resource: string | null | undefined): string {
        const normalized = `${resource ?? ''}`.trim().toLowerCase();
        if (normalized === 'personajes')
            return 'Crear personajes nuevos';
        if (normalized === 'campanas')
            return 'Crear campañas nuevas';
        if (normalized.length < 1)
            return 'Permiso de creación';

        const readableResource = normalized
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return `Crear ${readableResource}`;
    }

    private async cargarEstadoSolicitudRol(): Promise<void> {
        this.roleRequestLoading = true;
        try {
            this.roleRequestStatus = await this.userProfileApiSvc.getMyRoleRequestStatus();
        } catch (error: any) {
            this.roleRequestStatus = null;
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo cargar el estado de la solicitud de rol.'));
        } finally {
            this.roleRequestLoading = false;
        }
    }

    private async ensureCampaignSectionLoaded(force: boolean = false, preferredCampaignId?: number | null): Promise<void> {
        if (!this.canAccessCampaignManagementSection) {
            this.currentSection = 'resumen';
            return;
        }
        if (this.campaignsLoaded && !force) {
            if (this.selectedCampaignId && !this.selectedCampaignDetail)
                await this.loadCampaignSelection(this.selectedCampaignId, true);
            return;
        }
        await this.reloadCampaigns(preferredCampaignId ?? this.selectedCampaignId);
    }

    private async reloadCampaigns(preferredCampaignId?: number | null): Promise<void> {
        this.campaignsLoading = true;
        this.campaignsErrorMessage = '';
        try {
            const campaigns = await this.campanaSvc.listProfileCampaigns();
            this.campaigns = this.filterManageableCampaigns(campaigns);
            this.campaignsLoaded = true;

            const nextId = this.resolveNextSelectedCampaignId(preferredCampaignId);
            if (!nextId) {
                this.selectedCampaignId = null;
                this.selectedCampaignDetail = null;
                this.selectedCampaignErrorMessage = '';
                if (this.campaignWorkspaceMode !== 'create')
                    this.campaignWorkspaceMode = 'idle';
                this.campaignWorkspaceTab = 'usuarios';
                this.resetCampaignEditorToCreateMode();
                this.resetCampaignDetailEditors();
                return;
            }

            await this.loadCampaignSelection(nextId, true);
        } catch (error: any) {
            this.campaignsErrorMessage = this.mapCampaignError(error, 'No se pudieron cargar las campañas.');
            this.campaignsLoaded = false;
        } finally {
            this.campaignsLoading = false;
        }
    }

    private startCampaignSummariesWatch(): void {
        if (this.campaignSummariesWatchStop)
            return;

        this.campaignSummariesWatchStop = this.campanaSvc.watchCampaignSummaries(
            (items) => this.applyLiveCampaignSummaries(items),
            () => undefined
        );
    }

    private applyLiveCampaignSummaries(items: CampaignListItem[]): void {
        const previousManageable = [...this.campaigns];
        const previousById = new Map(previousManageable.map((campaign) => [campaign.id, campaign]));
        const incoming = Array.isArray(items) ? items : [];

        const merged = incoming.map((campaign) => ({
            ...previousById.get(campaign.id),
            ...campaign,
        }));

        const nextManageable = this.filterManageableCampaigns(merged);
        this.campaigns = nextManageable;
        this.campaignsLoaded = true;

        const selectedSummary = this.selectedCampaignId
            ? nextManageable.find((campaign) => campaign.id === this.selectedCampaignId) ?? null
            : null;
        if (selectedSummary && this.selectedCampaignDetail?.campaign?.id === selectedSummary.id) {
            this.selectedCampaignDetail = {
                ...this.selectedCampaignDetail,
                campaign: {
                    ...this.selectedCampaignDetail.campaign,
                    ...selectedSummary,
                },
            };
            if (!this.campaignRenameSaving)
                this.campaignRenameDraft = selectedSummary.nombre;
        }

        if (this.currentSection === 'campanas' && this.selectedCampaignId && !selectedSummary && !this.selectedCampaignLoading) {
            this.selectedCampaignId = null;
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = '';
            if (this.campaignWorkspaceMode !== 'create')
                this.campaignWorkspaceMode = 'idle';
            this.campaignWorkspaceTab = 'usuarios';
            this.resetCampaignEditorToCreateMode();
            this.resetCampaignDetailEditors();
        }

        if (this.campaignSummariesLiveReady) {
            const newlyManagedCampaigns = nextManageable.filter((campaign) => campaign.campaignRole === 'master'
                && previousById.get(campaign.id)?.campaignRole !== 'master');
            if (newlyManagedCampaigns.length > 0) {
                const campaignName = `${newlyManagedCampaigns[0]?.nombre ?? ''}`.trim();
                this.showCampaignInfo(
                    campaignName.length > 0
                        ? `Ahora eres Master de la campaña ${campaignName}.`
                        : 'Ahora eres Master de una campaña.'
                );
            }
        } else {
            this.campaignSummariesLiveReady = true;
        }
    }

    private resolveNextSelectedCampaignId(preferredCampaignId?: number | null): number | null {
        if (this.manageableCampaigns.length < 1)
            return null;

        const candidateIds = [
            preferredCampaignId,
            this.selectedCampaignId,
            this.manageableCampaigns[0]?.id ?? null,
        ];
        for (const candidate of candidateIds) {
            const normalized = Math.trunc(Number(candidate));
            if (normalized > 0 && this.manageableCampaigns.some((campaign) => campaign.id === normalized))
                return normalized;
        }
        return null;
    }

    private async loadCampaignSelection(
        campaignId: number,
        forceReload: boolean,
        includeInactiveOverride?: boolean
    ): Promise<void> {
        const id = Math.trunc(Number(campaignId));
        if (!Number.isFinite(id) || id <= 0)
            return;

        const includeInactive = includeInactiveOverride === undefined
            ? (forceReload && this.selectedCampaignDetail?.campaign.id === id
                ? this.selectedCampaignDetail.includeInactiveMembers === true
                : false)
            : includeInactiveOverride === true;

        if (!forceReload && this.selectedCampaignId === id && this.selectedCampaignDetail)
            return;

        this.selectedCampaignId = id;
        this.selectedCampaignLoading = true;
        this.selectedCampaignErrorMessage = '';
        this.memberSearchErrorMessage = '';
        this.transferSearchErrorMessage = '';

        try {
            const detail = await this.campanaSvc.getCampaignDetail(id, includeInactive);
            if (this.selectedCampaignId !== id)
                return;

            this.selectedCampaignDetail = detail;
            this.campaignRenameDraft = detail.campaign.nombre;
            this.syncCampaignEditorFromDetail(detail);
            this.maybePersistLegacyCampaignPolicyDefaults(detail);
            this.resetCampaignDetailEditors();
        } catch (error: any) {
            if (this.selectedCampaignId !== id)
                return;
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = this.mapCampaignError(error, 'No se pudo cargar el detalle de la campaña.');
        } finally {
            if (this.selectedCampaignId === id)
                this.selectedCampaignLoading = false;
        }
    }

    private resetCampaignDetailEditors(): void {
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
        this.memberSearchQuery = '';
        this.memberSearchResults = [];
        this.memberSearchLoading = false;
        this.memberSearchErrorMessage = '';
        this.memberInviteInFlightUid = '';
        this.memberRemoveInFlightUid = '';
        this.transferSearchQuery = '';
        this.transferSearchResults = [];
        this.transferSearchLoading = false;
        this.transferSearchErrorMessage = '';
        this.transferSelectedUser = null;
        this.transferSaving = false;
        this.transferCancelInFlight = false;
        this.memberInviteEmailDraft = '';
        this.memberInviteEmailSending = false;
        this.joinRequestInFlightId = null;
        this.tramaCreateDraft = '';
        this.tramaCreateVisibleParaJugadores = true;
        this.tramaCreateSaving = false;
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.editingTramaVisibleParaJugadores = true;
        this.tramaSaveInFlightId = null;
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.editingSubtramaVisibleParaJugadores = true;
        this.subtramaSaveInFlightId = null;
        this.subtramaCreateDraftByTrama = {};
        this.subtramaCreateVisibleByTrama = {};
        this.subtramaCreateSavingTramaId = null;
    }

    private resetCampaignEditorToCreateMode(): void {
        this.campaignCreateDraft = '';
        this.campaignCreatePolicyDraft = this.createDefaultCampaignPolicyDraft();
        this.campaignRenameDraft = '';
    }

    private syncCampaignEditorFromDetail(detail: CampaignDetailViewModel): void {
        this.campaignCreateDraft = `${detail?.campaign?.nombre ?? ''}`.trim();
        this.campaignCreatePolicyDraft = this.hydrateCampaignPolicyDraft(detail?.politicaCreacion ?? null);
        this.campaignRenameDraft = this.campaignCreateDraft;
    }

    private hydrateCampaignPolicyDraft(source: Partial<CampaignCreationPolicy> | null | undefined): CampaignCreationPolicy {
        const defaults = this.createDefaultCampaignPolicyDraft();
        const rawMinimo = source?.tiradaMinimaCaracteristica;
        const rawNep = source?.nepMaximoPersonajeNuevo;
        const rawTablas = source?.maxTablasDadosCaracteristicas;
        const permitirHomebrewGeneral = source?.permitirHomebrewGeneral === true;
        const maxFuentesRaw = source?.maxFuentesHomebrewGeneralesPorPersonaje;
        const maxFuentes = maxFuentesRaw === null || maxFuentesRaw === undefined
            ? defaults.maxFuentesHomebrewGeneralesPorPersonaje
            : this.normalizeCampaignHomebrewLimit(maxFuentesRaw, defaults.maxFuentesHomebrewGeneralesPorPersonaje ?? 0);

        return {
            tiradaMinimaCaracteristica: rawMinimo === null || rawMinimo === undefined
                ? defaults.tiradaMinimaCaracteristica
                : this.normalizeCampaignMinimumRoll(rawMinimo),
            nepMaximoPersonajeNuevo: rawNep === null || rawNep === undefined
                ? defaults.nepMaximoPersonajeNuevo
                : this.normalizeCampaignMaxNep(rawNep),
            maxTablasDadosCaracteristicas: rawTablas === null || rawTablas === undefined
                ? defaults.maxTablasDadosCaracteristicas
                : this.normalizeCampaignMaxTables(rawTablas),
            permitirHomebrewGeneral,
            permitirVentajasDesventajas: source?.permitirVentajasDesventajas === true,
            permitirIgnorarRestriccionesAlineamiento: source?.permitirIgnorarRestriccionesAlineamiento === true,
            maxFuentesHomebrewGeneralesPorPersonaje: permitirHomebrewGeneral ? null : maxFuentes,
            maxTiradasPuntosGolpe: this.normalizeCampaignHpRolls(source?.maxTiradasPuntosGolpe),
        };
    }

    private maybePersistLegacyCampaignPolicyDefaults(detail: CampaignDetailViewModel | null): void {
        const campaignId = Number(detail?.campaign?.id ?? 0);
        if (!Number.isFinite(campaignId) || campaignId <= 0)
            return;
        if (detail?.campaign?.campaignRole !== 'master')
            return;
        if (this.campaignPolicyAutofixInFlight.has(campaignId))
            return;

        const rawPolicy = detail?.politicaCreacion;
        const needsDefaults = rawPolicy?.tiradaMinimaCaracteristica === null
            || rawPolicy?.tiradaMinimaCaracteristica === undefined
            || rawPolicy?.maxTablasDadosCaracteristicas === null
            || rawPolicy?.maxTablasDadosCaracteristicas === undefined;
        if (!needsDefaults)
            return;

        this.campaignPolicyAutofixInFlight.add(campaignId);
        const normalizedPolicy = this.hydrateCampaignPolicyDraft(rawPolicy);
        void this.campanaSvc.updateCampaign(campaignId, {
            politicaCreacion: normalizedPolicy,
        }).finally(() => {
            this.campaignPolicyAutofixInFlight.delete(campaignId);
        });
    }

    private filterManageableCampaigns(campaigns: CampaignListItem[]): CampaignListItem[] {
        return (campaigns ?? [])
            .filter((campaign) => campaign?.campaignRole === 'master')
            .sort((a, b) => compararTexto(a.nombre, b.nombre));
    }

    private scheduleUserSearch(kind: 'member' | 'transfer'): void {
        this.clearSearchTimer(kind);

        const query = kind === 'member'
            ? `${this.memberSearchQuery ?? ''}`.trim()
            : `${this.transferSearchQuery ?? ''}`.trim();
        if (query.length < 2) {
            if (kind === 'member') {
                this.memberSearchResults = [];
                this.memberSearchLoading = false;
            } else {
                this.transferSearchResults = [];
                this.transferSearchLoading = false;
            }
            return;
        }

        const timerId = window.setTimeout(() => {
            void this.runUserSearch(kind, query);
        }, 250);

        if (kind === 'member')
            this.memberSearchTimerId = timerId;
        else
            this.transferSearchTimerId = timerId;
    }

    private clearSearchTimer(kind: 'member' | 'transfer'): void {
        const timerId = kind === 'member' ? this.memberSearchTimerId : this.transferSearchTimerId;
        if (timerId !== null)
            window.clearTimeout(timerId);
        if (kind === 'member')
            this.memberSearchTimerId = null;
        else
            this.transferSearchTimerId = null;
    }

    private async runUserSearch(kind: 'member' | 'transfer', expectedQuery: string): Promise<void> {
        const currentQuery = kind === 'member'
            ? `${this.memberSearchQuery ?? ''}`.trim()
            : `${this.transferSearchQuery ?? ''}`.trim();
        if (currentQuery !== expectedQuery)
            return;

        if (kind === 'member') {
            this.memberSearchLoading = true;
            this.memberSearchErrorMessage = '';
        } else {
            this.transferSearchLoading = true;
            this.transferSearchErrorMessage = '';
        }

        try {
            const results = await this.campanaSvc.searchUsers(expectedQuery);
            if ((kind === 'member' ? `${this.memberSearchQuery ?? ''}`.trim() : `${this.transferSearchQuery ?? ''}`.trim()) !== expectedQuery)
                return;

            const filteredResults = this.filterCampaignSearchResults(kind, results);

            if (kind === 'member')
                this.memberSearchResults = filteredResults;
            else
                this.transferSearchResults = filteredResults;
        } catch (error: any) {
            const message = this.mapCampaignError(error, 'No se pudo buscar usuarios.');
            if (kind === 'member') {
                this.memberSearchResults = [];
                this.memberSearchErrorMessage = message;
            } else {
                this.transferSearchResults = [];
                this.transferSearchErrorMessage = message;
            }
        } finally {
            if (kind === 'member')
                this.memberSearchLoading = false;
            else
                this.transferSearchLoading = false;
        }
    }

    private filterCampaignSearchResults(kind: 'member' | 'transfer', results: CampaignUserSearchResult[]): CampaignUserSearchResult[] {
        const currentMemberUids = new Set(
            this.selectedCampaignMembers
                .map((member) => `${member.uid ?? ''}`.trim())
                .filter((uid) => uid.length > 0)
        );
        const invitedUids = new Set(
            this.selectedCampaignPendingInvitations
                .map((invitation) => `${invitation.cuenta ?? ''}`.trim())
                .filter((uid) => uid.length > 0)
        );
        const currentActorUid = `${this.profile?.uid ?? ''}`.trim();

        return (results ?? []).filter((result) => {
            const uid = `${result?.uid ?? ''}`.trim();
            if (uid.length < 1)
                return false;
            if (uid === currentActorUid)
                return false;

            if (kind === 'member')
                return !currentMemberUids.has(uid) && !invitedUids.has(uid);

            return uid !== `${this.selectedCampaignMaster?.uid ?? ''}`.trim();
        });
    }

    private async handleCampaignRealtimeEvent(event: CampaignRealtimeEvent): Promise<void> {
        if (this.currentSection !== 'campanas')
            return;

        await this.reloadCampaigns(this.selectedCampaignId ?? event.campaignId);
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
