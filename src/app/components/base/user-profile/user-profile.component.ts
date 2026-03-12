import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { updateProfile } from 'firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    CampaignDetailViewModel,
    CampaignListItem,
    CampaignMemberItem,
    CampaignMemberRemovalStatus,
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
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

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
    displayNameSaving = false;

    settingsSaving = false;
    visibilidadPorDefectoPersonajes = false;
    mostrarPerfilPublico = true;
    generadorMinimoSeleccionado = 13;
    generadorTablasPermitidas = 3;

    avatarUploading = false;
    avatarDeleting = false;
    avatarPreviewUrl: string | null = null;
    selectedAvatarFile: File | null = null;

    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    passwordSaving = false;
    roleRequestStatus: UserRoleRequestStatus | null = null;
    roleRequestLoading = false;
    roleRequestSubmitting = false;

    campaigns: CampaignListItem[] = [];
    campaignsLoading = false;
    campaignsLoaded = false;
    campaignsErrorMessage = '';
    selectedCampaignId: number | null = null;
    selectedCampaignDetail: CampaignDetailViewModel | null = null;
    selectedCampaignLoading = false;
    selectedCampaignErrorMessage = '';
    campaignCreateDraft = '';
    campaignCreateSaving = false;
    campaignRenameDraft = '';
    campaignRenameSaving = false;
    memberSearchQuery = '';
    memberSearchLoading = false;
    memberSearchResults: CampaignUserSearchResult[] = [];
    memberSearchErrorMessage = '';
    memberAddInFlightUid = '';
    memberRemoveInFlightUid = '';
    transferSearchQuery = '';
    transferSearchLoading = false;
    transferSearchResults: CampaignUserSearchResult[] = [];
    transferSearchErrorMessage = '';
    transferSelectedUser: CampaignUserSearchResult | null = null;
    keepPreviousMasterAsPlayer = true;
    transferSaving = false;
    tramaCreateDraft = '';
    tramaCreateSaving = false;
    editingTramaId: number | null = null;
    editingTramaDraft = '';
    tramaSaveInFlightId: number | null = null;
    editingSubtramaId: number | null = null;
    editingSubtramaDraft = '';
    subtramaSaveInFlightId: number | null = null;
    subtramaCreateDraftByTrama: Record<number, string> = {};
    subtramaCreateSavingTramaId: number | null = null;

    private readonly destroy$ = new Subject<void>();
    private pendingRequestedSection: UserPrivateProfileSectionId | null = null;
    private memberSearchTimerId: number | null = null;
    private transferSearchTimerId: number | null = null;
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
        private appToastSvc: AppToastService
    ) { }

    ngOnInit(): void {
        this.userSvc.currentPrivateProfile$
            .pipe(takeUntil(this.destroy$))
            .subscribe((profile) => {
                this.profile = profile;
                if (profile && this.displayNameDraft.trim().length < 1)
                    this.displayNameDraft = `${profile.displayName ?? ''}`.trim();
                if (!this.canChangePassword && this.currentSection === 'seguridad')
                    this.currentSection = 'resumen';
                this.resolvePendingRequestedSection();
            });
        void this.cargar();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest']?.currentValue)
            this.requestSection(changes['openRequest'].currentValue.section);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.releaseAvatarPreview();
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
    }

    get canShowContent(): boolean {
        return !!this.profile;
    }

    get sectionItems(): { id: UserPrivateProfileSectionId; label: string; icon: string; }[] {
        const base: { id: UserPrivateProfileSectionId; label: string; icon: string; }[] = [
            { id: 'resumen', label: 'Resumen', icon: 'badge' },
            { id: 'campanas', label: 'Campañas', icon: 'diversity_3' },
            { id: 'identidad', label: 'Identidad', icon: 'account_circle' },
            { id: 'preferencias', label: 'Preferencias', icon: 'tune' },
        ];
        if (this.canChangePassword)
            base.push({ id: 'seguridad', label: 'Seguridad', icon: 'lock' });
        return base;
    }

    get avatarUrl(): string {
        if (this.avatarPreviewUrl)
            return this.avatarPreviewUrl;
        const profile = this.profile;
        const persisted = `${profile?.photoUrl ?? profile?.photoThumbUrl ?? ''}`.trim();
        if (persisted.length > 0)
            return persisted;
        return resolveDefaultProfileAvatar(profile?.uid ?? profile?.displayName ?? profile?.email ?? '');
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
        const permisos = Object.values(this.profile?.permissions ?? {});
        return permisos.length > 0 && permisos.every((resource) => resource?.create === true);
    }

    get permisosCreateActivos(): string[] {
        const permisos = this.profile?.permissions ?? {};
        return Object.keys(permisos)
            .filter((resource) => permisos?.[resource]?.create === true)
            .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }

    get permisosResumen(): string {
        if (this.allCreatePermissionsEnabled)
            return 'Todos';
        if (this.permisosCreateActivos.length < 1)
            return 'Ninguno';
        return this.permisosCreateActivos.join(', ');
    }

    get displayNameLength(): number {
        return this.displayNameDraft.trim().length;
    }

    get selectedAvatarName(): string {
        return `${this.selectedAvatarFile?.name ?? ''}`.trim();
    }

    get formattedCreatedAt(): string {
        return this.formatDateLabel(this.profile?.createdAt, 'Sin dato');
    }

    get formattedLastSeenAt(): string {
        return this.formatDateLabel(this.profile?.lastSeenAt, 'Sin dato');
    }

    get requestedRoleTarget(): UserRoleRequestTarget | null {
        if (this.profile?.role === 'jugador')
            return 'master';
        if (this.profile?.role === 'master')
            return 'colaborador';
        return null;
    }

    get requestedRoleLabel(): string {
        const target = this.requestedRoleTarget;
        if (target === 'master')
            return 'master';
        if (target === 'colaborador')
            return 'colaborador';
        return 'rol superior';
    }

    get requestRoleButtonLabel(): string {
        return `Solicitar ser ${this.requestedRoleLabel}`;
    }

    get canRequestRole(): boolean {
        return !!this.requestedRoleTarget
            && this.roleRequestStatus?.eligible === true
            && this.roleRequestStatus?.status !== 'pending'
            && !this.hasRoleRequestBlock;
    }

    get hasRoleRequestBlock(): boolean {
        const blockedUntil = this.roleRequestStatus?.blockedUntilUtc;
        if (!blockedUntil)
            return false;
        const parsed = new Date(blockedUntil);
        return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
    }

    get roleRequestStatusLabel(): string {
        if (this.profile?.role === 'colaborador' || this.profile?.role === 'admin')
            return `Tu rol actual es ${this.profile.role}.`;

        const status = this.roleRequestStatus?.status ?? 'none';
        if (status === 'pending')
            return 'Tienes una solicitud pendiente de revisión.';
        if (status === 'approved')
            return 'La última solicitud fue aprobada.';
        if (status === 'rejected')
            return this.hasRoleRequestBlock
                ? `Solicitud rechazada. No podrás volver a pedirlo hasta ${this.formattedRoleRequestBlockedUntil}.`
                : 'La última solicitud fue rechazada.';
        if (this.roleRequestStatus?.eligible === true)
            return `Puedes solicitar convertirte en ${this.requestedRoleLabel}.`;
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
        return `${this.roleRequestStatus?.adminComment ?? ''}`.trim();
    }

    get canCreateCampaign(): boolean {
        return this.userSvc.can('campanas', 'create');
    }

    get masterCampaigns(): CampaignListItem[] {
        if (this.profile?.role === 'admin')
            return this.campaigns;
        return this.campaigns.filter((campaign) => campaign.campaignRole === 'master');
    }

    get participantCampaigns(): CampaignListItem[] {
        if (this.profile?.role === 'admin')
            return [];
        return this.campaigns.filter((campaign) => campaign.campaignRole !== 'master');
    }

    get selectedCampaignSummary(): CampaignListItem | null {
        if (!this.selectedCampaignId)
            return null;
        return this.campaigns.find((campaign) => campaign.id === this.selectedCampaignId) ?? null;
    }

    get selectedCampaignCanManage(): boolean {
        if (!this.selectedCampaignSummary)
            return false;
        if (this.profile?.role === 'admin')
            return true;
        return this.selectedCampaignSummary.campaignRole === 'master';
    }

    get selectedCampaignMembers(): CampaignMemberItem[] {
        return this.selectedCampaignDetail?.members ?? [];
    }

    get selectedCampaignTramas(): CampaignTramaItem[] {
        return this.selectedCampaignDetail?.tramas ?? [];
    }

    get selectedCampaignMaster(): CampaignMemberItem | null {
        return this.selectedCampaignMembers.find((member) => member.campaignRole === 'master' && member.isActive) ?? null;
    }

    get campaignListsHaveData(): boolean {
        return this.masterCampaigns.length > 0 || this.participantCampaigns.length > 0;
    }

    async cargar(): Promise<void> {
        this.loading = true;
        this.loadErrorMessage = '';
        try {
            const [profile, settings] = await Promise.all([
                this.userSvc.refreshCurrentPrivateProfile(),
                this.userSettingsSvc.loadSettings(true),
            ]);
            this.profile = profile;
            this.settings = settings;
            this.applySettingsToForm(settings);
            this.displayNameDraft = `${profile?.displayName ?? ''}`.trim();
            await this.cargarEstadoSolicitudRol();
        } catch (error: any) {
            this.loadErrorMessage = `${error?.message ?? 'No se pudo cargar el perfil.'}`.trim();
        } finally {
            this.loading = false;
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

    async guardarDisplayName(): Promise<void> {
        const displayName = this.displayNameDraft.trim();
        if (this.displayNameSaving)
            return;

        if (displayName.length < 1 || displayName.length > 150) {
            this.appToastSvc.showError('El nombre visible debe tener entre 1 y 150 caracteres.');
            return;
        }

        this.displayNameSaving = true;
        try {
            const profile = await this.userProfileApiSvc.updateDisplayName(displayName);
            await this.syncAuthDisplayName(displayName);
            this.userSvc.setCurrentPrivateProfile(profile);
            this.profile = profile;
            this.displayNameDraft = `${profile?.displayName ?? ''}`.trim();
            this.appToastSvc.showSuccess('Nombre visible actualizado.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo guardar el nombre visible.'));
        } finally {
            this.displayNameSaving = false;
        }
    }

    async solicitarCambioRol(): Promise<void> {
        const target = this.requestedRoleTarget;
        if (!target || !this.canRequestRole || this.roleRequestSubmitting)
            return;

        this.roleRequestSubmitting = true;
        try {
            this.roleRequestStatus = await this.userProfileApiSvc.createRoleRequest(target);
            this.appToastSvc.showSuccess(`Solicitud para ser ${this.requestedRoleLabel} enviada. Queda pendiente de revisión.`);
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
                    allowDirectMessagesFromNonFriends: current.perfil?.allowDirectMessagesFromNonFriends === true,
                },
                nuevo_personaje: {
                    ...current.nuevo_personaje,
                    generador_config: nextGeneradorConfig,
                },
            };
            const saved = await this.userSettingsSvc.saveSettings(nextSettings);
            this.settings = saved;
            this.applySettingsToForm(saved);
            this.appToastSvc.showSuccess('Preferencias guardadas.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudieron guardar las preferencias.'));
        } finally {
            this.settingsSaving = false;
        }
    }

    async resetearPosicionPreview(): Promise<void> {
        if (this.settingsSaving)
            return;

        this.settingsSaving = true;
        try {
            await this.userSettingsSvc.clearPreviewPlacements();
            this.settings = await this.userSettingsSvc.loadSettings(true);
            this.applySettingsToForm(this.settings);
            this.appToastSvc.showSuccess('Posición de preview restablecida.');
        } catch (error: any) {
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo restablecer la preview.'));
        } finally {
            this.settingsSaving = false;
        }
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

    async setSection(section: UserPrivateProfileSectionId): Promise<void> {
        if (section === 'seguridad' && !this.canChangePassword)
            return;
        this.currentSection = section;
        this.pendingRequestedSection = null;
        if (section === 'campanas')
            await this.ensureCampaignSectionLoaded();
    }

    async seleccionarCampana(campaignId: number): Promise<void> {
        await this.loadCampaignSelection(campaignId, false);
    }

    async crearCampana(): Promise<void> {
        if (!this.canCreateCampaign || this.campaignCreateSaving)
            return;

        this.campaignCreateSaving = true;
        try {
            const created = await this.campanaSvc.createCampaign(this.campaignCreateDraft);
            this.campaignCreateDraft = '';
            this.appToastSvc.showSuccess('Campaña creada correctamente.');
            await this.reloadCampaigns(created.id);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la campaña.'));
        } finally {
            this.campaignCreateSaving = false;
        }
    }

    async guardarNombreCampana(): Promise<void> {
        if (!this.selectedCampaignCanManage || !this.selectedCampaignId || this.campaignRenameSaving)
            return;

        this.campaignRenameSaving = true;
        try {
            await this.campanaSvc.renameCampaign(this.selectedCampaignId, this.campaignRenameDraft);
            this.appToastSvc.showSuccess('Campaña actualizada.');
            await this.reloadCampaigns(this.selectedCampaignId);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la campaña.'));
        } finally {
            this.campaignRenameSaving = false;
        }
    }

    async cambiarHistorialMiembros(value: boolean): Promise<void> {
        if (!this.selectedCampaignId)
            return;
        await this.loadCampaignSelection(this.selectedCampaignId, true, value === true);
    }

    onMemberSearchQueryChange(): void {
        this.memberSearchErrorMessage = '';
        this.scheduleUserSearch('member');
    }

    onTransferSearchQueryChange(): void {
        this.transferSelectedUser = null;
        this.transferSearchErrorMessage = '';
        this.scheduleUserSearch('transfer');
    }

    async agregarJugador(result: CampaignUserSearchResult): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage)
            return;

        this.memberAddInFlightUid = result.uid;
        try {
            await this.campanaSvc.addCampaignMember(this.selectedCampaignId, result.uid);
            this.memberSearchQuery = '';
            this.memberSearchResults = [];
            this.memberSearchErrorMessage = '';
            this.appToastSvc.showSuccess('Jugador añadido a la campaña.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo añadir el jugador.'));
        } finally {
            this.memberAddInFlightUid = '';
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

        this.memberRemoveInFlightUid = member.uid;
        try {
            await this.campanaSvc.removeCampaignMember(
                this.selectedCampaignId,
                member.uid,
                result.value as CampaignMemberRemovalStatus
            );
            this.appToastSvc.showSuccess('Jugador retirado de la campaña.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo retirar el jugador.'));
        } finally {
            this.memberRemoveInFlightUid = '';
        }
    }

    seleccionarNuevoMaster(result: CampaignUserSearchResult): void {
        this.transferSelectedUser = result;
        this.transferSearchQuery = this.getUserDisplayLabel(result.displayName, null, result.uid);
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

        this.transferSaving = true;
        try {
            await this.campanaSvc.transferCampaignMaster(this.selectedCampaignId, {
                targetUid: this.transferSelectedUser.uid,
                keepPreviousAsPlayer: this.keepPreviousMasterAsPlayer !== false,
            });
            this.appToastSvc.showSuccess('Master de campaña transferido correctamente.');
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

        this.tramaCreateSaving = true;
        try {
            await this.campanaSvc.createTrama(this.selectedCampaignId, this.tramaCreateDraft);
            this.tramaCreateDraft = '';
            this.appToastSvc.showSuccess('Trama creada correctamente.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la trama.'));
        } finally {
            this.tramaCreateSaving = false;
        }
    }

    iniciarEdicionTrama(trama: CampaignTramaItem): void {
        this.editingTramaId = trama.id;
        this.editingTramaDraft = trama.nombre;
    }

    cancelarEdicionTrama(): void {
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.tramaSaveInFlightId = null;
    }

    async guardarEdicionTrama(): Promise<void> {
        if (!this.editingTramaId || this.tramaSaveInFlightId === this.editingTramaId)
            return;

        this.tramaSaveInFlightId = this.editingTramaId;
        try {
            await this.campanaSvc.updateTrama(this.editingTramaId, this.editingTramaDraft);
            this.appToastSvc.showSuccess('Trama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionTrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la trama.'));
        } finally {
            this.tramaSaveInFlightId = null;
        }
    }

    iniciarEdicionSubtrama(subtrama: CampaignSubtramaItem): void {
        this.editingSubtramaId = subtrama.id;
        this.editingSubtramaDraft = subtrama.nombre;
    }

    cancelarEdicionSubtrama(): void {
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.subtramaSaveInFlightId = null;
    }

    async guardarEdicionSubtrama(): Promise<void> {
        if (!this.editingSubtramaId || this.subtramaSaveInFlightId === this.editingSubtramaId)
            return;

        this.subtramaSaveInFlightId = this.editingSubtramaId;
        try {
            await this.campanaSvc.updateSubtrama(this.editingSubtramaId, this.editingSubtramaDraft);
            this.appToastSvc.showSuccess('Subtrama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionSubtrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo actualizar la subtrama.'));
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

    async crearSubtrama(tramaId: number): Promise<void> {
        if (!this.selectedCampaignCanManage || this.subtramaCreateSavingTramaId === tramaId)
            return;

        this.subtramaCreateSavingTramaId = tramaId;
        try {
            await this.campanaSvc.createSubtrama(tramaId, this.subtramaCreateDraftByTrama[tramaId] ?? '');
            this.subtramaCreateDraftByTrama = {
                ...this.subtramaCreateDraftByTrama,
                [tramaId]: '',
            };
            this.appToastSvc.showSuccess('Subtrama creada correctamente.');
            if (this.selectedCampaignId)
                await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(this.mapCampaignError(error, 'No se pudo crear la subtrama.'));
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
        return this.memberAddInFlightUid === uid;
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

    getCampaignRoleLabel(role: string): string {
        return `${role ?? ''}`.trim().toLowerCase() === 'master' ? 'Master' : 'Jugador';
    }

    getMembershipStatusLabel(status: string): string {
        const normalized = `${status ?? ''}`.trim().toLowerCase();
        if (normalized === 'inactivo')
            return 'Inactivo';
        if (normalized === 'expulsado')
            return 'Expulsado';
        return 'Activo';
    }

    getUserDisplayLabel(displayName: string | null | undefined, email: string | null | undefined, uid: string): string {
        const nombre = `${displayName ?? ''}`.trim();
        if (nombre.length > 0)
            return nombre;
        const correo = `${email ?? ''}`.trim();
        if (correo.length > 0)
            return correo;
        return uid;
    }

    formatOptionalDateTime(value: string | null | undefined, fallback: string = 'Sin dato'): string {
        return this.formatDateTimeLabel(value, fallback);
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
        this.selectedAvatarFile = null;
        this.releaseAvatarPreview();
    }

    private applySettingsToForm(settings: UserSettingsV1 | null): void {
        this.settings = settings;
        this.visibilidadPorDefectoPersonajes = settings?.perfil?.visibilidadPorDefectoPersonajes === true;
        this.mostrarPerfilPublico = settings?.perfil?.mostrarPerfilPublico !== false;
        this.generadorMinimoSeleccionado = this.normalizeGeneradorMinimo(settings?.nuevo_personaje?.generador_config?.minimoSeleccionado ?? 13);
        this.generadorTablasPermitidas = this.normalizeGeneradorTablas(settings?.nuevo_personaje?.generador_config?.tablasPermitidas ?? 3);
    }

    private requestSection(section: UserPrivateProfileSectionId | null | undefined): void {
        const target = section ?? 'resumen';
        this.pendingRequestedSection = target;
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

        void this.setSection(this.pendingRequestedSection);
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

    private mapProfileError(error: any, fallback: string): string {
        if (error instanceof ProfileApiError) {
            if (error.code === 'PROFILE_NAME_INVALID')
                return 'El nombre visible no es válido.';
            if (error.code === 'PROFILE_NAME_TOO_LONG')
                return 'El nombre visible supera el límite permitido.';
            if (error.code === 'AVATAR_FILE_TOO_LARGE')
                return 'El avatar no puede superar 5 MB.';
            if (error.code === 'AVATAR_FILE_TYPE_INVALID')
                return 'El avatar debe ser JPEG, PNG o WEBP.';
            if (error.code === 'AVATAR_IMAGE_INVALID')
                return 'La imagen seleccionada no es válida.';
        }
        return `${error?.message ?? fallback}`.trim() || fallback;
    }

    private mapCampaignError(error: any, fallback: string): string {
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

    private async cargarEstadoSolicitudRol(): Promise<void> {
        this.roleRequestLoading = true;
        try {
            this.roleRequestStatus = await this.userProfileApiSvc.getMyRoleRequestStatus();
        } catch (error: any) {
            const apiError = error instanceof ProfileApiError ? error : null;
            if (apiError?.status === 404) {
                this.roleRequestStatus = null;
                return;
            }
            this.roleRequestStatus = null;
            this.appToastSvc.showError(this.mapProfileError(error, 'No se pudo cargar el estado de la solicitud de rol.'));
        } finally {
            this.roleRequestLoading = false;
        }
    }

    private async ensureCampaignSectionLoaded(force: boolean = false): Promise<void> {
        if (this.campaignsLoaded && !force) {
            if (this.selectedCampaignId && !this.selectedCampaignDetail)
                await this.loadCampaignSelection(this.selectedCampaignId, true);
            return;
        }
        await this.reloadCampaigns(this.selectedCampaignId);
    }

    private async reloadCampaigns(preferredCampaignId?: number | null): Promise<void> {
        this.campaignsLoading = true;
        this.campaignsErrorMessage = '';
        try {
            const campaigns = await this.campanaSvc.listVisibleCampaigns();
            this.campaigns = campaigns;
            this.campaignsLoaded = true;

            const nextId = this.resolveNextSelectedCampaignId(preferredCampaignId);
            if (!nextId) {
                this.selectedCampaignId = null;
                this.selectedCampaignDetail = null;
                this.selectedCampaignErrorMessage = '';
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

    private resolveNextSelectedCampaignId(preferredCampaignId?: number | null): number | null {
        if (this.campaigns.length < 1)
            return null;

        const candidateIds = [
            preferredCampaignId,
            this.selectedCampaignId,
            this.masterCampaigns[0]?.id ?? null,
            this.campaigns[0]?.id ?? null,
        ];
        for (const candidate of candidateIds) {
            const normalized = Math.trunc(Number(candidate));
            if (normalized > 0 && this.campaigns.some((campaign) => campaign.id === normalized))
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
        this.memberAddInFlightUid = '';
        this.memberRemoveInFlightUid = '';
        this.transferSearchQuery = '';
        this.transferSearchResults = [];
        this.transferSearchLoading = false;
        this.transferSearchErrorMessage = '';
        this.transferSelectedUser = null;
        this.keepPreviousMasterAsPlayer = true;
        this.transferSaving = false;
        this.tramaCreateDraft = '';
        this.tramaCreateSaving = false;
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.tramaSaveInFlightId = null;
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.subtramaSaveInFlightId = null;
        this.subtramaCreateDraftByTrama = {};
        this.subtramaCreateSavingTramaId = null;
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

            if (kind === 'member')
                this.memberSearchResults = results;
            else
                this.transferSearchResults = results;
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
}
