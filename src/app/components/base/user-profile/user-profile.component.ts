import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { updateProfile } from 'firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Subject, concatMap, debounceTime, from, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    CampaignCreationPolicy,
    CampaignDetailViewModel,
    CampaignInvitationDecision,
    CampaignInvitationItem,
    CampaignListItem,
    CampaignMemberItem,
    CampaignMemberRemovalStatus,
    CampaignRealtimeEvent,
    CampaignSubtramaItem,
    CampaignTramaItem,
    CampaignUserSearchResult,
} from 'src/app/interfaces/campaign-management';
import {
    ProfileApiError,
    UserAvatarResponse,
    UserPrivateProfile,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId
} from 'src/app/interfaces/user-account';
import { UserRoleRequestStatus, UserRoleRequestTarget } from 'src/app/interfaces/user-role-request';
import { NuevoPersonajeGeneradorConfig, UserSettingsV1 } from 'src/app/interfaces/user-settings';
import { PERMISSION_RESOURCES } from 'src/app/interfaces/user-acl';
import {
    UserAccessRestrictionReason,
    UserAccessScope,
    UserComplianceActivePolicy,
    UserCompliancePolicyKind,
    UserCompliancePolicyState,
    UserComplianceSnapshot,
    UserModerationHistoryItem,
    UserModerationSanction,
} from 'src/app/interfaces/user-moderation';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { SocialAlertPreferencesService } from 'src/app/services/social-alert-preferences.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

type CampaignWorkspaceMode = 'idle' | 'create' | 'config' | 'peopleStories';
type CampaignWorkspaceTab = 'usuarios' | 'historias';

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

    displayNameDraft = '';
    bioDraft = '';
    genderIdentityDraft = '';
    pronounsDraft = '';
    identitySaving = false;

    settingsSaving = false;
    visibilidadPorDefectoPersonajes = false;
    mostrarPerfilPublico = true;
    allowDirectMessagesFromNonFriends = false;
    autoAbrirVentanaChats = true;
    permitirBurbujasChat = true;
    socialAlertsMensajes = true;
    socialAlertsAmistad = true;
    socialAlertsCampanas = true;
    socialAlertsCuentaSistema = true;
    generadorMinimoSeleccionado = 13;
    generadorTablasPermitidas = 3;
    previewResetting = false;

    avatarUploading = false;
    avatarDeleting = false;
    avatarPreviewUrl: string | null = null;
    selectedAvatarFile: File | null = null;
    private avatarFailedSource = '';

    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    passwordSaving = false;
    roleRequestStatus: UserRoleRequestStatus | null = null;
    roleRequestLoading = false;
    roleRequestSubmitting = false;
    roleRequestCommentDraft = '';
    moderationHistory: UserModerationHistoryItem[] = [];
    moderationHistoryLoading = false;
    moderationHistoryErrorMessage = '';
    moderationHistoryHasMore = false;
    private moderationHistoryTotal = 0;
    readonly moderationHistoryPageSize = 10;
    policyViewingKind: UserCompliancePolicyKind | null = null;
    policyAcceptingKind: UserCompliancePolicyKind | null = null;

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
    receivedCampaignInvitations: CampaignInvitationItem[] = [];
    receivedCampaignInvitationsLoading = false;
    receivedCampaignInvitationsErrorMessage = '';
    receivedCampaignInviteResolveInFlightId: number | null = null;
    campaignInviteCancelInFlightId: number | null = null;
    transferSearchQuery = '';
    transferSearchLoading = false;
    transferSearchResults: CampaignUserSearchResult[] = [];
    transferSearchErrorMessage = '';
    transferSelectedUser: CampaignUserSearchResult | null = null;
    keepPreviousMasterAsPlayer = true;
    transferSaving = false;
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
    private identityDraftsUid = '';
    private readonly campaignPolicyAutofixInFlight = new Set<number>();
    private campaignSummariesLiveReady = false;
    readonly displayNameMinLength = 3;
    readonly displayNameMaxLength = 150;
    readonly bioMinLength = 10;
    readonly bioMaxLength = 600;
    readonly campaignNameMinLength = 5;
    readonly campaignNameMaxLength = 150;
    readonly campaignMinimumRollMin = 3;
    readonly campaignMinimumRollMax = 13;
    readonly campaignNepMin = 0;
    readonly campaignMaxTablesMin = 1;
    readonly campaignMaxTablesMax = 5;
    readonly campaignHomebrewSourcesMin = 1;
    readonly campaignHomebrewSourcesMax = 20;
    readonly generadorMinimoOpciones = Array.from({ length: 11 }, (_, index) => index + 3);
    readonly generadorTablasOpciones = Array.from({ length: 5 }, (_, index) => index + 1);
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
        private auth: Auth,
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userSettingsSvc: UserSettingsService,
        private campanaSvc: CampanaService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private chatApiSvc: ChatApiService,
        private chatRealtimeSvc: ChatRealtimeService,
        private chatFloatingSvc: ChatFloatingService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
        private socialAlertPrefsSvc: SocialAlertPreferencesService,
        private apiActionGuardSvc: ApiActionGuardService,
    ) { }

    ngOnInit(): void {
        this.userSvc.currentPrivateProfile$
            .pipe(takeUntil(this.destroy$))
            .subscribe((profile) => {
                this.profile = profile;
                this.syncAvatarFailureState(profile);
                if (profile && this.identityDraftsUid !== profile.uid) {
                    this.hydrateIdentityDraftsFromProfile(profile, true);
                    this.identityDraftsUid = profile.uid;
                }
                if (!this.canChangePassword && this.currentSection === 'seguridad')
                    this.currentSection = 'resumen';
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
        this.releaseAvatarPreview();
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
        this.campaignSummariesWatchStop?.();
        this.campaignSummariesWatchStop = null;
    }

    get canShowContent(): boolean {
        return !!this.profile;
    }

    get sectionItems(): { id: UserPrivateProfileSectionId; label: string; icon: string; }[] {
        const base: { id: UserPrivateProfileSectionId; label: string; icon: string; }[] = [
            { id: 'resumen', label: 'Resumen', icon: 'badge' },
            { id: 'identidad', label: 'Identidad', icon: 'account_circle' },
            { id: 'preferencias', label: 'Preferencias', icon: 'tune' },
        ];
        if (this.canAccessCampaignManagementSection)
            base.splice(1, 0, { id: 'campanas', label: 'Gestión de campañas', icon: 'diversity_3' });
        if (this.canChangePassword)
            base.push({ id: 'seguridad', label: 'Seguridad', icon: 'lock' });
        return base;
    }

    get avatarUrl(): string {
        if (this.avatarPreviewUrl)
            return this.avatarPreviewUrl;
        const profile = this.profile;
        const persisted = `${profile?.photoUrl ?? profile?.photoThumbUrl ?? ''}`.trim();
        if (persisted.length > 0 && persisted !== this.avatarFailedSource)
            return persisted;
        return this.defaultAvatarUrl;
    }

    get hasPersistedAvatar(): boolean {
        return `${this.profile?.photoUrl ?? this.profile?.photoThumbUrl ?? ''}`.trim().length > 0;
    }

    get authProviderLabel(): string {
        const provider = `${this.profile?.authProvider ?? ''}`.trim();
        if (provider === 'correo')
            return 'Correo';
        if (provider === 'google')
            return 'Google';
        return 'Otro';
    }

    get canChangePassword(): boolean {
        return `${this.profile?.authProvider ?? ''}`.trim() === 'correo';
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
            .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }

    get permisosResumen(): string {
        if (this.allCreatePermissionsEnabled)
            return 'Todos los permisos de creación';
        if (this.permisosCreateActivos.length < 1)
            return 'Sin permisos adicionales';
        return this.permisosCreateActivos.join(', ');
    }

    get displayNameLength(): number {
        return this.displayNameDraft.trim().length;
    }

    get bioLength(): number {
        return `${this.bioDraft ?? ''}`.length;
    }

    get campaignNameLength(): number {
        return `${this.campaignCreateDraft ?? ''}`.trim().length;
    }

    get genderIdentityLength(): number {
        return `${this.genderIdentityDraft ?? ''}`.trim().length;
    }

    get pronounsLength(): number {
        return `${this.pronounsDraft ?? ''}`.trim().length;
    }

    get selectedAvatarName(): string {
        return `${this.selectedAvatarFile?.name ?? ''}`.trim();
    }

    get defaultAvatarUrl(): string {
        const profile = this.profile;
        return resolveDefaultProfileAvatar(profile?.uid ?? profile?.displayName ?? profile?.email ?? '');
    }

    get formattedCreatedAt(): string {
        return this.formatDateLabel(this.profile?.createdAt, 'Sin dato');
    }

    get formattedLastSeenAt(): string {
        return this.formatDateLabel(this.profile?.lastSeenAt, 'Sin dato');
    }

    get compliance(): UserComplianceSnapshot | null {
        return this.profile?.compliance ?? null;
    }

    get hasComplianceRestrictions(): boolean {
        const compliance = this.compliance;
        if (!compliance)
            return false;
        return compliance.banned
            || compliance.mustAcceptUsage
            || compliance.mustAcceptCreation
            || !!compliance.activeSanction;
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
        return this.campaigns.filter((campaign) => campaign.campaignRole === 'master' || campaign.isOwner === true);
    }

    get masterCampaigns(): CampaignListItem[] {
        return this.manageableCampaigns.filter((campaign) => campaign.campaignRole === 'master');
    }

    get participantCampaigns(): CampaignListItem[] {
        return [];
    }

    get hasManageableCampaigns(): boolean {
        return this.manageableCampaigns.length > 0;
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
        return this.selectedCampaignActorRole === 'master' && this.selectedCampaignTransferCandidates.length > 0;
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

    get selectedCampaignPendingInvitations(): CampaignInvitationItem[] {
        return this.selectedCampaignDetail?.pendingInvitations ?? [];
    }

    get selectedCampaignMaster(): CampaignMemberItem | null {
        return this.selectedCampaignMembers.find((member) => member.campaignRole === 'master' && member.isActive) ?? null;
    }

    get selectedCampaignHasActiveMaster(): boolean {
        return !!this.selectedCampaignMaster;
    }

    get selectedCampaignOwnerMatchesCurrentUser(): boolean {
        const currentUid = `${this.userSvc.CurrentUserUid || this.profile?.uid || ''}`.trim();
        const ownerUid = `${this.selectedCampaignDetail?.ownerUid ?? ''}`.trim();
        return currentUid.length > 0 && ownerUid.length > 0 && currentUid === ownerUid;
    }

    get selectedCampaignCanRecoverMaster(): boolean {
        return this.userSvc.canProceed('usage') && (
            this.selectedCampaignDetail?.canRecoverMaster === true
            || (!this.selectedCampaignHasActiveMaster && this.selectedCampaignOwnerMatchesCurrentUser)
        );
    }

    get selectedCampaignShowLegacyRecoverHint(): boolean {
        return !this.selectedCampaignHasActiveMaster
            && !this.selectedCampaignCanRecoverMaster
            && this.selectedCampaignMembers.length <= 1;
    }

    get campaignListsHaveData(): boolean {
        return this.manageableCampaigns.length > 0;
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
        if (this.isCampaignWorkspacePeopleStories)
            return 'Usuarios e historias';
        if (this.selectedCampaignSummary)
            return this.selectedCampaignSummary.nombre;
        return 'Gestión de campañas';
    }

    get campaignEditorTitle(): string {
        return this.isCreatingCampaign
            ? 'Nueva campaña'
            : 'Configuración de campaña';
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

    get hasReceivedCampaignInvitations(): boolean {
        return this.receivedCampaignInvitations.length > 0;
    }

    async cargar(): Promise<void> {
        this.loading = true;
        this.loadErrorMessage = '';
        this.resetModerationHistory();
        try {
            const [profile, settings, campaigns] = await Promise.all([
                this.userSvc.refreshCurrentPrivateProfile(),
                this.userSettingsSvc.loadSettings(true),
                this.campanaSvc.listProfileCampaigns().catch(() => []),
            ]);
            this.profile = profile;
            this.settings = settings;
            this.campaigns = this.filterManageableCampaigns(campaigns);
            this.campaignsLoaded = true;
            this.applySettingsToForm(settings);
            this.hydrateIdentityDraftsFromProfile(profile, true);
            this.identityDraftsUid = `${profile?.uid ?? ''}`.trim();
            await this.cargarEstadoSolicitudRol();
            void this.cargarHistorialModeracion(true);
            if (!this.canAccessCampaignManagementSection && this.currentSection === 'campanas')
                this.currentSection = 'resumen';
        } catch (error: any) {
            this.loadErrorMessage = `${error?.message ?? 'No se pudo cargar el perfil.'}`.trim();
        } finally {
            this.loading = false;
        }
    }

    async cargarHistorialModeracion(reset: boolean = false): Promise<void> {
        if (this.moderationHistoryLoading)
            return;

        const profileUid = `${this.profile?.uid ?? ''}`.trim();
        if (profileUid.length < 1) {
            this.resetModerationHistory();
            return;
        }

        const nextOffset = reset ? 0 : this.moderationHistory.length;
        this.moderationHistoryLoading = true;
        if (reset)
            this.moderationHistoryErrorMessage = '';

        try {
            const response = await this.userProfileApiSvc.listMyModerationHistory(this.moderationHistoryPageSize, nextOffset);
            const items = Array.isArray(response?.items) ? response.items : [];
            this.moderationHistory = reset
                ? items
                : this.mergeModerationHistory(this.moderationHistory, items);
            this.moderationHistoryTotal = Math.max(this.moderationHistory.length, Number(response?.total ?? 0) || 0);
            this.moderationHistoryHasMore = response?.hasMore === true
                || this.moderationHistory.length < this.moderationHistoryTotal;
            this.moderationHistoryErrorMessage = '';
        } catch (error: any) {
            this.moderationHistoryErrorMessage = this.mapProfileError(error, 'No se pudo cargar tu historial de moderación.');
            if (reset)
                this.moderationHistory = [];
            this.moderationHistoryHasMore = false;
        } finally {
            this.moderationHistoryLoading = false;
        }
    }

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file)
            return;

        const validationError = this.validateAvatarFile(file);
        if (validationError) {
            this.appToastSvc.showError(validationError);
            input!.value = '';
            return;
        }

        this.releaseAvatarPreview();
        this.selectedAvatarFile = file;
        this.avatarPreviewUrl = URL.createObjectURL(file);
        input!.value = '';
    }

    async guardarAvatar(): Promise<void> {
        if (!this.selectedAvatarFile || this.avatarUploading)
            return;
        if (!this.shouldRunGuardedApiAction('profile.avatar.upload'))
            return;

        this.avatarUploading = true;
        try {
            const response = await this.userProfileApiSvc.uploadAvatar(this.selectedAvatarFile);
            await this.syncAuthProfileImage(response);
            this.applyAvatarResponse(response);
            this.appToastSvc.showSuccess('Avatar actualizado.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo subir el avatar.'));
        } finally {
            this.avatarUploading = false;
        }
    }

    async eliminarAvatar(): Promise<void> {
        if (this.avatarDeleting || (!this.hasPersistedAvatar && !this.selectedAvatarFile))
            return;

        if (!this.hasPersistedAvatar && this.selectedAvatarFile) {
            this.selectedAvatarFile = null;
            this.releaseAvatarPreview();
            this.appToastSvc.showInfo('Selección de avatar descartada.');
            return;
        }
        if (!this.shouldRunGuardedApiAction('profile.avatar.delete'))
            return;

        this.avatarDeleting = true;
        try {
            await this.userProfileApiSvc.deleteAvatar();
            await this.syncAuthProfileImage({ photoUrl: null, photoThumbUrl: null });
            this.applyAvatarResponse({ photoUrl: null, photoThumbUrl: null });
            this.appToastSvc.showSuccess('Avatar eliminado.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo eliminar el avatar.'));
        } finally {
            this.avatarDeleting = false;
        }
    }

    onAvatarImageError(event: Event): void {
        const target = event.target as HTMLImageElement | null;
        const failedSource = `${target?.currentSrc ?? target?.src ?? ''}`.trim();
        if (failedSource.length < 1 || failedSource === this.defaultAvatarUrl || failedSource.startsWith('blob:'))
            return;

        this.avatarFailedSource = failedSource;
        if (target)
            target.src = this.defaultAvatarUrl;
    }

    async guardarIdentidad(): Promise<void> {
        if (this.identitySaving)
            return;

        const validationError = this.validateIdentityForm();
        if (validationError) {
            this.appToastSvc.showError(validationError);
            return;
        }
        if (!this.shouldRunGuardedApiAction('profile.identity.save'))
            return;

        const displayName = this.normalizeDisplayName(this.displayNameDraft);
        this.identitySaving = true;
        try {
            const profile = await this.userProfileApiSvc.updateMyProfile({
                displayName,
                bio: this.normalizeOptionalMultilineText(this.bioDraft),
                genderIdentity: this.normalizeOptionalSingleLineText(this.genderIdentityDraft),
                pronouns: this.normalizeOptionalSingleLineText(this.pronounsDraft),
            });
            await this.syncAuthDisplayName(`${profile?.displayName ?? displayName}`.trim());
            this.userSvc.setCurrentPrivateProfile(profile);
            this.profile = profile;
            this.hydrateIdentityDraftsFromProfile(profile, true);
            this.identityDraftsUid = `${profile?.uid ?? ''}`.trim();
            this.appToastSvc.showSuccess('Identidad actualizada.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo guardar la identidad.'));
        } finally {
            this.identitySaving = false;
        }
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
            const nextSettings: UserSettingsV1 = {
                ...current,
                perfil: {
                    visibilidadPorDefectoPersonajes: this.visibilidadPorDefectoPersonajes === true,
                    mostrarPerfilPublico: this.mostrarPerfilPublico !== false,
                    allowDirectMessagesFromNonFriends: this.allowDirectMessagesFromNonFriends === true,
                    autoAbrirVentanaChats: this.autoAbrirVentanaChats !== false,
                    permitirBurbujasChat: this.permitirBurbujasChat !== false,
                    notificaciones: {
                        mensajes: this.socialAlertsMensajes !== false,
                        amistad: this.socialAlertsAmistad !== false,
                        campanas: this.socialAlertsCampanas !== false,
                        cuentaSistema: this.socialAlertsCuentaSistema !== false,
                    },
                },
                nuevo_personaje: {
                    ...current.nuevo_personaje,
                    generador_config: nextGeneradorConfig,
                },
            };
            const saved = await this.userSettingsSvc.saveSettings(nextSettings);
            this.settings = saved;
            this.applySettingsToForm(saved);
            this.socialAlertPrefsSvc.applyProfileSettings(saved.perfil);
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

    async cambiarPassword(): Promise<void> {
        if (!this.canChangePassword || this.passwordSaving)
            return;

        const currentPassword = `${this.currentPassword ?? ''}`;
        const newPassword = `${this.newPassword ?? ''}`;
        const confirmPassword = `${this.confirmPassword ?? ''}`;
        if (currentPassword.length < 1) {
            this.appToastSvc.showError('Debes indicar la contraseña actual.');
            return;
        }
        if (newPassword.length < 6) {
            this.appToastSvc.showError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            this.appToastSvc.showError('La confirmación de contraseña no coincide.');
            return;
        }

        const currentUser = this.auth.currentUser;
        const email = `${currentUser?.email ?? this.profile?.email ?? ''}`.trim();
        if (!currentUser || email.length < 1) {
            this.appToastSvc.showError('No se pudo resolver la sesión actual para cambiar la contraseña.');
            return;
        }
        if (!this.shouldRunGuardedApiAction('profile.password.change'))
            return;

        this.passwordSaving = true;
        try {
            const credential = EmailAuthProvider.credential(email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.appToastSvc.showSuccess('Contraseña actualizada.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapPasswordError(error));
        } finally {
            this.passwordSaving = false;
        }
    }

    async setSection(section: UserPrivateProfileSectionId, preferredCampaignId?: number | null): Promise<void> {
        if (section === 'seguridad' && !this.canChangePassword)
            return;
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

    async abrirUsuariosHistoriasCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'peopleStories';
        this.campaignWorkspaceTab = 'usuarios';
    }

    seleccionarCampaignWorkspaceTab(tab: CampaignWorkspaceTab): void {
        this.campaignWorkspaceTab = tab;
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

    onCampaignHomebrewLimitChange(): void {
        if (this.campaignHomebrewMode !== 'limitado')
            return;

        this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = this.normalizeCampaignHomebrewLimit(
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
            1
        );
    }

    onCampaignMinimumRollChange(): void {
        this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = this.normalizeCampaignMinimumRoll(
            this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica
        );
    }

    onCampaignMaxNepChange(): void {
        this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = this.normalizeCampaignMaxNep(
            this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo
        );
    }

    onCampaignMaxTablesChange(): void {
        this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = this.normalizeCampaignMaxTables(
            this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas
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
            const detail = await this.chatApiSvc.ensureCampaignConversation(this.selectedCampaignId);
            this.chatRealtimeSvc.upsertConversation(detail);
            this.userProfileNavSvc.openSocial({
                section: 'mensajes',
                conversationId: detail.conversationId,
                requestId: Date.now(),
            });
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

    abrirCampanasSociales(): void {
        this.userProfileNavSvc.openSocial({
            section: 'campanas',
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

    async abrirInfoRecuperarMaster(event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();

        if (!this.selectedCampaignCanRecoverMaster)
            return;

        const result = await Swal.fire({
            icon: 'info',
            title: 'Convertirte en master',
            html: `
                <p style="text-align:left; margin-bottom:12px;">
                    Esta campaña ha quedado huérfana o vacía de jugadores, así que ahora mismo nadie puede gestionarla.
                </p>
                <p style="text-align:left; margin-bottom:12px;">
                    Para poder gestionarla de nuevo, el creador debe convertirse a sí mismo en master de la campaña.
                </p>
                <p style="text-align:left; margin-bottom:0;">
                    Esto puede ocurrir en campañas legacy o en campañas afectadas por usuarios baneados.
                </p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Convertirme en master',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed)
            return;

        await this.recuperarMasterCampana();
    }

    private async recuperarMasterCampana(): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanRecoverMaster)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.master.recover.${this.selectedCampaignId}`))
            return;

        try {
            await this.campanaSvc.recoverCampaignMaster(this.selectedCampaignId);
            this.showCampaignSuccess('Has recuperado el rol de master de la campaña.');
            await this.reloadCampaigns(this.selectedCampaignId);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo recuperar el master de la campaña.'));
        }
    }

    onMemberSearchQueryChange(): void {
        this.memberSearchErrorMessage = '';
        this.scheduleUserSearch('member');
    }

    async agregarJugador(result: CampaignUserSearchResult): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.member.invite.${this.selectedCampaignId}.${result.uid}`))
            return;

        this.memberInviteInFlightUid = result.uid;
        try {
            await this.campanaSvc.inviteCampaignMember(this.selectedCampaignId, result.uid);
            this.memberSearchQuery = '';
            this.memberSearchResults = [];
            this.memberSearchErrorMessage = '';
            this.showCampaignSuccess('Invitación enviada correctamente.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo enviar la invitación.'));
        } finally {
            this.memberInviteInFlightUid = '';
        }
    }

    async responderInvitacionCampana(invitation: CampaignInvitationItem, decision: CampaignInvitationDecision): Promise<void> {
        const inviteId = Math.trunc(Number(invitation?.inviteId));
        if (inviteId <= 0 || this.receivedCampaignInviteResolveInFlightId === inviteId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.invitation.respond.${inviteId}.${decision}`))
            return;

        this.receivedCampaignInviteResolveInFlightId = inviteId;
        try {
            const response = await this.campanaSvc.resolveCampaignInvitation(inviteId, decision);
            await this.refreshReceivedCampaignInvitations();
            if (decision === 'accept') {
                this.showCampaignSuccess('Invitación aceptada. Ya formas parte de la campaña.');
                await this.reloadCampaigns(response.invitation.campaignId);
            } else {
                this.showCampaignSuccess('Invitación rechazada.');
                if (this.selectedCampaignId)
                    await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
            }
        } catch (error: any) {
            await this.refreshReceivedCampaignInvitations();
            if (this.isCampaignStateOutdatedError(error)) {
                if (decision === 'accept')
                    await this.reloadCampaigns(invitation.campaignId);
                else if (this.selectedCampaignId)
                    await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
                this.showCampaignInfo('La invitación ya cambió en otra sesión. Se ha refrescado el estado.');
                return;
            }
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo responder la invitación.'));
        } finally {
            this.receivedCampaignInviteResolveInFlightId = null;
        }
    }

    async cancelarInvitacionCampana(invitation: CampaignInvitationItem): Promise<void> {
        const inviteId = Math.trunc(Number(invitation?.inviteId));
        if (inviteId <= 0 || this.campaignInviteCancelInFlightId === inviteId)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.invitation.cancel.${inviteId}`))
            return;

        this.campaignInviteCancelInFlightId = inviteId;
        try {
            await this.campanaSvc.cancelCampaignInvitation(inviteId);
            this.showCampaignSuccess('Invitación cancelada.');
            if (this.selectedCampaignId)
                await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            if (this.isCampaignStateOutdatedError(error)) {
                if (this.selectedCampaignId)
                    await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
                this.showCampaignInfo('La invitación ya había cambiado en otra sesión. Se ha refrescado la campaña.');
                return;
            }
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo cancelar la invitación.'));
        } finally {
            this.campaignInviteCancelInFlightId = null;
        }
    }

    async retirarJugador(member: CampaignMemberItem): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || member.campaignRole === 'master')
            return;

        const result = await Swal.fire({
            title: 'Retirar jugador de la campaña',
            text: `Selecciona cómo quieres dejar a ${this.getUserDisplayLabel(member.displayName, member.email, member.uid)} en el histórico.`,
            input: 'select',
            inputValue: 'expulsado',
            inputOptions: {
                expulsado: 'Expulsado',
                inactivo: 'Inactivo',
            },
            showCancelButton: true,
            confirmButtonText: 'Aplicar cambio',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => value === 'inactivo' || value === 'expulsado'
                ? null
                : 'Debes seleccionar un estado válido.',
        });
        if (!result.isConfirmed)
            return;
        if (!this.shouldRunGuardedApiAction(`campaign.member.remove.${this.selectedCampaignId}.${member.uid}`))
            return;

        this.memberRemoveInFlightUid = member.uid;
        try {
            await this.campanaSvc.removeCampaignMember(
                this.selectedCampaignId,
                member.uid,
                result.value as CampaignMemberRemovalStatus
            );
            this.showCampaignSuccess('Jugador retirado de la campaña.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo retirar el jugador.'));
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

    async transferirMaster(): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !this.transferSelectedUser || this.transferSaving)
            return;

        if (this.transferSelectedUser.uid === this.selectedCampaignMaster?.uid) {
            this.appToastSvc.showError('El usuario seleccionado ya es el master actual.');
            return;
        }
        if (!this.shouldRunGuardedApiAction(`campaign.master.transfer.${this.selectedCampaignId}.${this.transferSelectedUser.uid}`))
            return;

        this.transferSaving = true;
        try {
            await this.campanaSvc.transferCampaignMaster(this.selectedCampaignId, {
                targetUid: this.transferSelectedUser.uid,
                keepPreviousAsPlayer: this.keepPreviousMasterAsPlayer !== false,
            });
            this.showCampaignSuccess('Master de campaña transferido correctamente.');
            this.limpiarNuevoMaster();
            await this.reloadCampaigns(this.selectedCampaignId);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo transferir el master.'));
        } finally {
            this.transferSaving = false;
        }
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

    isResolvingReceivedCampaignInvitation(inviteId: number): boolean {
        return this.receivedCampaignInviteResolveInFlightId === inviteId;
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

    complianceAccessLabel(compliance: UserComplianceSnapshot | null | undefined): string {
        if (!compliance)
            return 'Estado no disponible';
        if (compliance.banned)
            return 'Cuenta baneada';
        if (compliance.activeSanction)
            return `Sanción activa: ${this.formatModerationSanctionLabel(compliance.activeSanction)}`;
        if (compliance.mustAcceptUsage && compliance.mustAcceptCreation)
            return 'Acceso restringido hasta aceptar normas de uso y creación';
        if (compliance.mustAcceptUsage)
            return 'Acceso restringido hasta aceptar normas de uso';
        if (compliance.mustAcceptCreation)
            return 'Creación restringida hasta aceptar normas de creación';
        return 'Acceso normal';
    }

    compliancePolicyLabel(policy: UserCompliancePolicyState | null | undefined, mustAccept: boolean): string {
        if (!policy)
            return mustAccept ? 'Pendientes' : 'Sin datos';

        const version = policy.version ? `v${policy.version}` : 'versión activa';
        if (mustAccept)
            return `Pendientes (${version})`;
        if (policy.accepted)
            return `Aceptadas (${version})`;
        return `No aceptadas (${version})`;
    }

    isViewingPolicy(kind: UserCompliancePolicyKind): boolean {
        return this.policyViewingKind === kind;
    }

    policyRequiresAcceptance(kind: UserCompliancePolicyKind): boolean {
        if (kind === 'creation')
            return this.compliance?.mustAcceptCreation === true;
        return this.compliance?.mustAcceptUsage === true;
    }

    canAcceptPolicy(kind: UserCompliancePolicyKind): boolean {
        return this.policyRequiresAcceptance(kind)
            && this.policyAcceptingKind !== kind;
    }

    get hasModerationEvents(): boolean {
        return this.moderationHistory.length > 0 || !!this.compliance?.activeSanction;
    }

    get moderationStatusButtonLabel(): string {
        if (this.moderationHistoryLoading && !this.hasModerationEvents)
            return 'Cargando...';
        return this.hasModerationEvents ? 'Ver historial' : 'Estás limpi@';
    }

    compliancePolicyViewerTitle(policy: UserComplianceActivePolicy | null | undefined): string {
        const label = policy?.kind === 'creation' ? 'Normas de creación' : 'Normas de uso';
        const title = `${policy?.title ?? ''}`.trim();
        return title.length > 0 ? title : label;
    }

    compliancePolicyViewerMeta(policy: UserComplianceActivePolicy | null | undefined): string {
        if (!policy)
            return 'Sin versión activa cargada.';

        const parts: string[] = [];
        if (policy.version)
            parts.push(`Versión ${policy.version}`);
        if (policy.publishedAtUtc)
            parts.push(`Publicada ${this.formatOptionalDateTime(policy.publishedAtUtc, 'sin fecha')}`);
        return parts.join(' · ') || 'Versión activa';
    }

    async abrirPoliticaCumplimiento(kind: UserCompliancePolicyKind): Promise<void> {
        if (this.policyViewingKind === kind)
            return;

        this.policyViewingKind = kind;

        try {
            const policy = await this.userProfileApiSvc.getActivePolicy(kind);
            await Swal.fire({
                title: this.compliancePolicyViewerTitle(policy),
                html: this.buildCompliancePolicyModalHtml(policy, this.policyRequiresAcceptance(kind)),
                confirmButtonText: 'Cerrar',
                customClass: {
                    popup: 'profile-swal',
                    title: 'profile-swal__title',
                    htmlContainer: 'swal2-html-container--policy',
                    confirmButton: 'profile-swal__confirm',
                    cancelButton: 'profile-swal__cancel',
                },
                width: 760,
            });
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo cargar la política activa.'));
        } finally {
            this.policyViewingKind = null;
        }
    }

    async aceptarPoliticaCumplimiento(kind: UserCompliancePolicyKind): Promise<void> {
        if (!this.policyRequiresAcceptance(kind) || this.policyAcceptingKind === kind)
            return;

        this.policyAcceptingKind = kind;
        try {
            const response = await this.userProfileApiSvc.acceptActivePolicy(kind);
            this.applyComplianceUpdate(response.compliance);
            this.appToastSvc.showSuccess(
                kind === 'creation'
                    ? 'Normas de creación aceptadas.'
                    : 'Normas de uso aceptadas.',
                { category: 'cuentaSistema' }
            );
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo aceptar la política activa.'));
        } finally {
            this.policyAcceptingKind = null;
        }
    }

    moderationCaseLabel(item: UserModerationHistoryItem): string {
        return `${item.caseName ?? item.caseCode ?? 'Incidencia de moderación'}`.trim();
    }

    moderationResultLabel(result: UserModerationHistoryItem['result']): string {
        const normalized = `${result ?? ''}`.trim().toLowerCase();
        if (normalized === 'banned')
            return 'Ban';
        if (normalized === 'sanctioned')
            return 'Sanción';
        if (normalized === 'reported')
            return 'Reporte confirmado';
        return 'Moderación';
    }

    moderationModeLabel(mode: string | null | undefined): string {
        const normalized = `${mode ?? ''}`.trim().toLowerCase();
        if (normalized === 'force_sanction')
            return 'Sanción forzada';
        if (normalized === 'report')
            return 'Reporte';
        return normalized.length > 0 ? normalized : 'Sin modo';
    }

    async abrirHistorialModeracionModal(): Promise<void> {
        if (!this.hasModerationEvents && !this.moderationHistoryLoading && this.moderationHistoryErrorMessage.length < 1)
            return;
        if (this.moderationHistoryLoading && this.moderationHistory.length < 1)
            return;

        if (this.moderationHistory.length < 1 || this.moderationHistoryHasMore)
            await this.cargarHistorialModeracionCompleto();

        if (this.moderationHistoryErrorMessage.length > 0) {
            this.appToastSvc.showError(this.moderationHistoryErrorMessage);
            return;
        }
        if (this.moderationHistory.length < 1 && !this.compliance?.activeSanction)
            return;

        await Swal.fire({
            title: 'Moderación y avisos',
            html: this.buildModerationHistoryModalHtml(),
            confirmButtonText: 'Cerrar',
            width: 780,
            customClass: {
                popup: 'profile-swal',
                title: 'profile-swal__title',
                htmlContainer: 'swal2-html-container--policy',
                confirmButton: 'profile-swal__confirm',
                cancelButton: 'profile-swal__cancel',
            },
        });
    }

    formatModerationSanctionLabel(sanction: UserModerationSanction | null | undefined): string {
        if (!sanction)
            return 'Sin sanción activa';

        const label = `${sanction.name ?? sanction.code ?? sanction.kind ?? 'Sanción'}`.trim();
        if (sanction.isPermanent)
            return `${label} permanente`;
        if (`${sanction.endsAtUtc ?? ''}`.trim().length > 0)
            return `${label} hasta ${this.formatDateTimeLabel(sanction.endsAtUtc, 'fecha no disponible')}`;
        return label;
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

    trackByModerationIncident(index: number, item: UserModerationHistoryItem): number {
        return item.incidentId;
    }

    private applyAvatarResponse(response: UserAvatarResponse): void {
        const current = this.profile;
        if (current) {
            const nextProfile: UserPrivateProfile = {
                ...current,
                photoUrl: response.photoUrl ?? null,
                photoThumbUrl: response.photoThumbUrl ?? null,
            };
            this.profile = nextProfile;
            this.userSvc.setCurrentPrivateProfile(nextProfile);
        }
        this.avatarFailedSource = '';
        this.selectedAvatarFile = null;
        this.releaseAvatarPreview();
    }

    private applySettingsToForm(settings: UserSettingsV1 | null): void {
        this.settings = settings;
        this.visibilidadPorDefectoPersonajes = settings?.perfil?.visibilidadPorDefectoPersonajes === true;
        this.mostrarPerfilPublico = settings?.perfil?.mostrarPerfilPublico !== false;
        this.allowDirectMessagesFromNonFriends = settings?.perfil?.allowDirectMessagesFromNonFriends === true;
        this.autoAbrirVentanaChats = settings?.perfil?.autoAbrirVentanaChats !== false;
        this.permitirBurbujasChat = settings?.perfil?.permitirBurbujasChat !== false;
        this.socialAlertsMensajes = settings?.perfil?.notificaciones?.mensajes !== false;
        this.socialAlertsAmistad = settings?.perfil?.notificaciones?.amistad !== false;
        this.socialAlertsCampanas = settings?.perfil?.notificaciones?.campanas !== false;
        this.socialAlertsCuentaSistema = settings?.perfil?.notificaciones?.cuentaSistema !== false;
        this.generadorMinimoSeleccionado = this.normalizeGeneradorMinimo(settings?.nuevo_personaje?.generador_config?.minimoSeleccionado ?? 13);
        this.generadorTablasPermitidas = this.normalizeGeneradorTablas(settings?.nuevo_personaje?.generador_config?.tablasPermitidas ?? 3);
    }

    private hydrateIdentityDraftsFromProfile(profile: UserPrivateProfile | null, force: boolean = false): void {
        if (!profile)
            return;

        if (force || this.displayNameDraft.trim().length < 1)
            this.displayNameDraft = `${profile.displayName ?? ''}`.trim();
        if (force || `${this.bioDraft ?? ''}`.length < 1)
            this.bioDraft = `${profile.bio ?? ''}`;
        if (force || `${this.genderIdentityDraft ?? ''}`.trim().length < 1)
            this.genderIdentityDraft = `${profile.genderIdentity ?? ''}`.trim();
        if (force || `${this.pronounsDraft ?? ''}`.trim().length < 1)
            this.pronounsDraft = `${profile.pronouns ?? ''}`.trim();
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

        if (this.pendingRequestedSection === 'seguridad') {
            if (!this.profile)
                return;
            void this.setSection(this.canChangePassword ? 'seguridad' : 'resumen');
            return;
        }

        void this.setSection(this.pendingRequestedSection, this.pendingRequestedCampaignId);
    }

    private validateAvatarFile(file: File): string | null {
        const mime = `${file?.type ?? ''}`.trim().toLowerCase();
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(mime))
            return 'El avatar debe ser JPEG, PNG o WEBP.';
        if (Number(file?.size ?? 0) > 5 * 1024 * 1024)
            return 'El avatar no puede superar 5 MB.';
        return null;
    }

    private releaseAvatarPreview(): void {
        if (this.avatarPreviewUrl?.startsWith('blob:'))
            URL.revokeObjectURL(this.avatarPreviewUrl);
        this.avatarPreviewUrl = null;
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

    private showCampaignSuccess(message: string): void {
        this.appToastSvc.showSuccess(message, { category: 'campanas' });
    }

    private showCampaignInfo(message: string): void {
        this.appToastSvc.showInfo(message, { category: 'campanas' });
    }

    private resetModerationHistory(): void {
        this.moderationHistory = [];
        this.moderationHistoryLoading = false;
        this.moderationHistoryErrorMessage = '';
        this.moderationHistoryHasMore = false;
        this.moderationHistoryTotal = 0;
    }

    private mergeModerationHistory(
        current: UserModerationHistoryItem[],
        incoming: UserModerationHistoryItem[]
    ): UserModerationHistoryItem[] {
        const map = new Map<number, UserModerationHistoryItem>();
        [...current, ...incoming].forEach((item) => {
            if (!item?.incidentId)
                return;
            map.set(item.incidentId, item);
        });
        return [...map.values()].sort((a, b) => this.compareModerationItems(a, b));
    }

    private compareModerationItems(a: UserModerationHistoryItem, b: UserModerationHistoryItem): number {
        const aTime = this.toModerationDateMs(a.confirmedAtUtc ?? a.createdAtUtc);
        const bTime = this.toModerationDateMs(b.confirmedAtUtc ?? b.createdAtUtc);
        if (aTime !== bTime)
            return bTime - aTime;
        return b.incidentId - a.incidentId;
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
        return Math.max(this.campaignNepMin, parsed);
    }

    private normalizeCampaignMaxTables(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return this.campaignMaxTablesMin;
        return Math.min(this.campaignMaxTablesMax, Math.max(this.campaignMaxTablesMin, parsed));
    }

    private normalizeCampaignHomebrewLimit(value: number | null | undefined, fallback: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return fallback;
        return Math.min(this.campaignHomebrewSourcesMax, Math.max(fallback, parsed));
    }

    private validateIdentityForm(): string | null {
        const displayName = this.normalizeDisplayName(this.displayNameDraft);
        const bio = this.normalizeOptionalMultilineText(this.bioDraft);
        const genderIdentity = this.normalizeOptionalSingleLineText(this.genderIdentityDraft);
        const pronouns = this.normalizeOptionalSingleLineText(this.pronounsDraft);

        if (displayName.length < this.displayNameMinLength || displayName.length > this.displayNameMaxLength)
            return `El nombre visible debe tener entre ${this.displayNameMinLength} y ${this.displayNameMaxLength} caracteres.`;
        if (this.isNumericOnlyText(displayName))
            return 'El nombre visible no puede estar formado solo por números.';
        if (bio && bio.length < this.bioMinLength)
            return `La bio debe tener al menos ${this.bioMinLength} caracteres o dejarse vacía.`;
        if (bio && this.isNumericOnlyText(bio))
            return 'La bio no puede estar formada solo por números.';
        if (bio && bio.length > this.bioMaxLength)
            return `La bio no puede superar ${this.bioMaxLength} caracteres.`;
        if (this.hasLineBreak(this.genderIdentityDraft))
            return 'La identidad de género no puede contener saltos de línea.';
        if (genderIdentity && genderIdentity.length > 80)
            return 'La identidad de género no puede superar 80 caracteres.';
        if (this.hasLineBreak(this.pronounsDraft))
            return 'Los pronombres no pueden contener saltos de línea.';
        if (pronouns && pronouns.length > 80)
            return 'Los pronombres no pueden superar 80 caracteres.';
        return null;
    }

    private validateCampaignName(value: string | null | undefined): string | null {
        const name = `${value ?? ''}`.trim();
        if (name.length < this.campaignNameMinLength || name.length > this.campaignNameMaxLength)
            return `El nombre de campaña debe tener entre ${this.campaignNameMinLength} y ${this.campaignNameMaxLength} caracteres.`;
        if (this.isNumericOnlyText(name))
            return 'El nombre de campaña no puede estar formado solo por números.';
        return null;
    }

    private normalizeDisplayName(value: string | null | undefined): string {
        return `${value ?? ''}`.trim();
    }

    private normalizeOptionalSingleLineText(value: string | null | undefined): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private normalizeOptionalMultilineText(value: string | null | undefined): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

    private hasLineBreak(value: string | null | undefined): boolean {
        return /[\r\n]/.test(`${value ?? ''}`);
    }

    private isNumericOnlyText(value: string | null | undefined): boolean {
        const compact = `${value ?? ''}`.replace(/\s+/g, '');
        return compact.length > 0 && /^\d+$/.test(compact);
    }

    private syncAvatarFailureState(profile: UserPrivateProfile | null): void {
        const persisted = `${profile?.photoUrl ?? profile?.photoThumbUrl ?? ''}`.trim();
        if (persisted !== this.avatarFailedSource)
            this.avatarFailedSource = '';
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
                captureSessionNotification: false,
                dedupeKey: this.apiActionGuardSvc.getBlockedToastDedupeKey(this.userSvc.CurrentUserUid, decision.status),
            });
            return false;
        }
        return true;
    }

    private async syncAuthDisplayName(displayName: string): Promise<void> {
        if (!this.auth.currentUser)
            return;
        try {
            await updateProfile(this.auth.currentUser, { displayName });
        } catch {
            // El source of truth ya es la API; esto solo evita deriva local.
        }
    }

    private async syncAuthProfileImage(response: UserAvatarResponse): Promise<void> {
        if (!this.auth.currentUser)
            return;
        try {
            await updateProfile(this.auth.currentUser, { photoURL: response.photoUrl ?? null });
        } catch {
            // La API ya guardó el estado correcto; esta sync es best effort.
        }
    }

    private mapProfileError(error: any, fallback: string, scope: UserAccessScope = 'usage'): string {
        const complianceError = this.resolveComplianceErrorMessage(error, scope);
        if (complianceError)
            return complianceError;

        if (error instanceof ProfileApiError) {
            if (error.code === 'PROFILE_NAME_INVALID')
                return 'El nombre visible no es válido.';
            if (error.code === 'PROFILE_NAME_TOO_LONG')
                return 'El nombre visible supera el límite permitido.';
            if (error.code === 'PROFILE_FIELD_INVALID')
                return 'Uno de los campos de identidad no es válido.';
            if (error.code === 'PROFILE_FIELD_TOO_LONG')
                return 'Uno de los campos de identidad supera el límite permitido.';
            if (error.code === 'AVATAR_FILE_TOO_LARGE')
                return 'El avatar no puede superar 5 MB.';
            if (error.code === 'AVATAR_FILE_TYPE_INVALID')
                return 'El avatar debe ser JPEG, PNG o WEBP.';
            if (error.code === 'AVATAR_IMAGE_INVALID')
                return 'La imagen seleccionada no es válida.';
        }
        return `${error?.message ?? fallback}`.trim() || fallback;
    }

    private mapCampaignError(error: any, fallback: string, scope: UserAccessScope = 'usage'): string {
        const complianceError = this.resolveComplianceErrorMessage(error, scope);
        if (complianceError)
            return complianceError;
        return `${error?.message ?? fallback}`.trim() || fallback;
    }

    private mapPasswordError(error: any): string {
        const code = `${error?.code ?? ''}`.trim().toLowerCase();
        if (code.includes('wrong-password') || code.includes('invalid-credential'))
            return 'La contraseña actual no es correcta.';
        if (code.includes('weak-password'))
            return 'La nueva contraseña es demasiado débil.';
        if (code.includes('too-many-requests'))
            return 'Demasiados intentos. Inténtalo de nuevo más tarde.';
        if (code.includes('requires-recent-login'))
            return 'Necesitas volver a autenticarte antes de cambiar la contraseña.';
        return `${error?.message ?? 'No se pudo actualizar la contraseña.'}`.trim();
    }

    private applyComplianceUpdate(compliance: UserComplianceSnapshot | null): void {
        if (!compliance || !this.profile)
            return;

        const currentProfile = this.profile;
        const nextProfile: UserPrivateProfile = {
            ...currentProfile,
            compliance,
        };
        this.userSvc.setCurrentCompliance(compliance);
        this.userSvc.setCurrentPrivateProfile(nextProfile);
        this.profile = nextProfile;
    }

    private buildCompliancePolicyModalHtml(
        policy: UserComplianceActivePolicy,
        requiresAcceptance: boolean
    ): string {
        const meta = this.escapeHtml(this.compliancePolicyViewerMeta(policy));
        const status = requiresAcceptance ? 'Aceptación pendiente' : 'Aceptada o no requerida';
        const markdown = this.escapeHtml(`${policy?.markdown ?? ''}`.trim() || 'Esta política activa no incluye contenido visible.');
        const versionBadge = policy?.version
            ? `<span style="display:inline-flex;padding:.28rem .65rem;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:.82rem;">v${this.escapeHtml(policy.version)}</span>`
            : '';

        return [
            '<div style="display:flex;flex-direction:column;gap:1rem;text-align:left;">',
            '  <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;">',
            versionBadge,
            `    <span style="display:inline-flex;padding:.28rem .65rem;border-radius:999px;background:${requiresAcceptance ? 'rgba(212, 165, 32, .14)' : 'rgba(255,255,255,.08)'};border:1px solid ${requiresAcceptance ? 'rgba(212, 165, 32, .4)' : 'rgba(255,255,255,.12)'};font-size:.82rem;">${status}</span>`,
            '  </div>',
            `  <p style="margin:0;color:rgba(255,255,255,.72);line-height:1.5;">${meta || 'Versión activa'}</p>`,
            `  <pre style="margin:0;padding:1rem;border-radius:1rem;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);color:rgba(245,247,255,.92);white-space:pre-wrap;word-break:break-word;line-height:1.55;font-family:Consolas,'Courier New',monospace;max-height:24rem;overflow:auto;">${markdown}</pre>`,
            '</div>',
        ].filter(Boolean).join('');
    }

    private async cargarHistorialModeracionCompleto(): Promise<void> {
        let safety = 0;
        if (this.moderationHistory.length < 1)
            await this.cargarHistorialModeracion(true);

        while (this.moderationHistoryHasMore && safety < 20) {
            safety += 1;
            await this.cargarHistorialModeracion();
            if (this.moderationHistoryErrorMessage.length > 0)
                break;
        }
    }

    private buildModerationHistoryModalHtml(): string {
        const activeSanction = this.compliance?.activeSanction ?? null;
        const sanctionHtml = activeSanction
            ? [
                '<div style="padding:1rem;border-radius:1rem;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.22);text-align:left;">',
                '  <div style="display:flex;flex-direction:column;gap:.35rem;">',
                '    <strong style="font-size:1rem;">Sanción activa</strong>',
                `    <span style="color:rgba(255,255,255,.82);line-height:1.5;">${this.escapeHtml(this.formatModerationSanctionLabel(activeSanction))}</span>`,
                '  </div>',
                '</div>',
            ].join('')
            : '';

        const itemsHtml = this.moderationHistory.map((item) => [
            '<article style="padding:1rem;border-radius:1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);text-align:left;">',
            '  <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;">',
            '    <div style="display:flex;flex-direction:column;gap:.45rem;min-width:0;">',
            `      <strong style="font-size:1rem;word-break:break-word;">${this.escapeHtml(this.moderationCaseLabel(item))}</strong>`,
            '      <div style="display:flex;flex-wrap:wrap;gap:.5rem;">',
            `        <span style="display:inline-flex;padding:.28rem .65rem;border-radius:999px;background:rgba(255,193,7,.14);border:1px solid rgba(255,193,7,.38);font-size:.82rem;">${this.escapeHtml(this.moderationResultLabel(item.result))}</span>`,
            `        <span style="display:inline-flex;padding:.28rem .65rem;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:.82rem;">${this.escapeHtml(this.moderationModeLabel(item.mode))}</span>`,
            '      </div>',
            '    </div>',
            `    <span style="color:rgba(255,255,255,.6);font-size:.86rem;white-space:nowrap;">${this.escapeHtml(this.formatOptionalDateTime(item.confirmedAtUtc || item.createdAtUtc, 'Sin fecha'))}</span>`,
            '  </div>',
            item.userVisibleMessage
                ? `  <p style="margin:.8rem 0 0;color:rgba(245,247,255,.86);white-space:pre-line;line-height:1.55;">${this.escapeHtml(item.userVisibleMessage)}</p>`
                : '',
            item.sanction
                ? `  <p style="margin:.7rem 0 0;color:rgba(245,247,255,.68);line-height:1.5;">${this.escapeHtml(this.formatModerationSanctionLabel(item.sanction))}</p>`
                : '',
            '</article>',
        ].filter(Boolean).join('')).join('');

        return [
            '<div style="display:flex;flex-direction:column;gap:1rem;">',
            sanctionHtml,
            itemsHtml,
            '</div>',
        ].filter(Boolean).join('');
    }

    private escapeHtml(value: string): string {
        return `${value ?? ''}`
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
        const incomingIds = new Set(incoming.map((campaign) => campaign.id));

        const merged = [
            ...previousManageable.filter((campaign) => campaign.isOwner === true && !incomingIds.has(campaign.id)),
            ...incoming.map((campaign) => {
                const previous = previousById.get(campaign.id);
                return {
                    ...previous,
                    ...campaign,
                    ...((campaign.isOwner === true || previous?.isOwner === true) ? { isOwner: true } : {}),
                };
            }),
        ];

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
            const ownerRecoveryFallback = this.buildRecoverableOwnerFallbackDetail(id, includeInactive, error);
            if (ownerRecoveryFallback) {
                this.selectedCampaignDetail = ownerRecoveryFallback;
                this.selectedCampaignErrorMessage = '';
                this.campaignRenameDraft = ownerRecoveryFallback.campaign.nombre;
                this.syncCampaignEditorFromDetail(ownerRecoveryFallback);
                this.resetCampaignDetailEditors();
                return;
            }
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = this.mapCampaignError(error, 'No se pudo cargar el detalle de la campaña.');
        } finally {
            if (this.selectedCampaignId === id)
                this.selectedCampaignLoading = false;
        }
    }

    private buildRecoverableOwnerFallbackDetail(
        campaignId: number,
        includeInactive: boolean,
        error: any
    ): CampaignDetailViewModel | null {
        const summary = this.manageableCampaigns.find((campaign) => campaign.id === campaignId) ?? null;
        if (!summary?.isOwner || summary.campaignRole === 'master')
            return null;
        if (!this.isOwnerRecoverAccessDeniedError(error))
            return null;

        const currentUid = `${this.userSvc.CurrentUserUid || this.profile?.uid || ''}`.trim();
        const ownerDisplayName = this.profile?.displayName ?? null;

        return {
            campaign: {
                ...summary,
            },
            ownerUid: currentUid.length > 0 ? currentUid : null,
            ownerDisplayName,
            activeMasterUid: null,
            activeMasterDisplayName: null,
            canRecoverMaster: true,
            politicaCreacion: this.hydrateCampaignPolicyDraft(null),
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: includeInactive === true,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        };
    }

    private isOwnerRecoverAccessDeniedError(error: any): boolean {
        const message = `${error?.message ?? ''}`.trim().toLowerCase();
        return message.includes('no pertenece a la campaña')
            || message.includes('http 403')
            || message.includes('forbidden')
            || message.includes('acceso denegado');
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
        this.keepPreviousMasterAsPlayer = true;
        this.transferSaving = false;
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
            .filter((campaign) => campaign?.campaignRole === 'master' || campaign?.isOwner === true)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
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
                .map((invitation) => `${invitation.invitedUser?.uid ?? ''}`.trim())
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

    private async refreshReceivedCampaignInvitations(): Promise<void> {
        this.receivedCampaignInvitationsLoading = true;
        this.receivedCampaignInvitationsErrorMessage = '';
        try {
            this.receivedCampaignInvitations = await this.campanaSvc.listReceivedCampaignInvitations();
        } catch (error: any) {
            this.receivedCampaignInvitations = [];
            this.receivedCampaignInvitationsErrorMessage = this.mapCampaignError(error, 'No se pudieron cargar las invitaciones recibidas.');
        } finally {
            this.receivedCampaignInvitationsLoading = false;
        }
    }

    private async handleCampaignRealtimeEvent(event: CampaignRealtimeEvent): Promise<void> {
        if (this.currentSection !== 'campanas')
            return;

        await this.reloadCampaigns(this.selectedCampaignId ?? event.campaignId);
    }

    private isCampaignStateOutdatedError(error: any): boolean {
        const normalized = this.normalizeComparableText(`${error?.message ?? error ?? ''}`);
        return normalized.includes('ya no esta pendiente')
            || normalized.includes('ya formas parte de la campana')
            || normalized.includes('ya es miembro activo de la campana')
            || normalized.includes('la campana solicitada ya no esta disponible para tu usuario');
    }

    private normalizeComparableText(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private toModerationDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
