import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
    UserPrivateProfile,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId,
} from 'src/app/interfaces/user-account';
import { UserRoleRequestStatus, UserRoleRequestTarget } from 'src/app/interfaces/user-role-request';
import { NuevoPersonajeGeneradorConfig, UserSettingsV1 } from 'src/app/interfaces/user-settings';
import { PERMISSION_RESOURCES } from 'src/app/interfaces/user-acl';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserService } from 'src/app/services/user.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { CampanasGestionEstado } from '../campanas-gestion/campanas-gestion.estado';
import { mensajeErrorDeAccion, permitirAccionGuardada, textoRol } from './perfil-acciones';
import { textoFecha, textoFechaHora } from 'src/app/services/utils/fecha-texto';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';
import { enteroEntre, toPositiveInt } from 'src/app/services/utils/normalizacion';

type IdentityFieldKey = 'displayName' | 'bio' | 'genderIdentity' | 'pronouns';
type GenderIdentityPreset = 'male' | 'female' | 'hidden' | 'custom';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.sass'],
    providers: [CampanasGestionEstado],
    standalone: false
})
export class UserProfileComponent implements OnInit, OnChanges, OnDestroy {
    @Input() openRequest: UserPrivateProfileOpenRequest | null = null;

    settings: UserSettingsV1 | null = null;
    loading = false;
    loadErrorMessage = '';
    private perfil: UserPrivateProfile | null = null;
    private seccion: UserPrivateProfileSectionId = 'resumen';

    get profile(): UserPrivateProfile | null {
        return this.perfil;
    }

    set profile(value: UserPrivateProfile | null) {
        this.perfil = value;
        this.gestion.uidActual = value?.uid ?? null;
    }

    get currentSection(): UserPrivateProfileSectionId {
        return this.seccion;
    }

    set currentSection(value: UserPrivateProfileSectionId) {
        this.seccion = value;
        this.gestion.seccionAbierta = value === 'campanas';
    }

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

    private readonly destroy$ = new Subject<void>();
    private pendingRequestedSection: UserPrivateProfileSectionId | null = null;
    private pendingRequestedCampaignId: number | null = null;
    readonly generadorMinimoOpciones = Array.from({ length: 11 }, (_, index) => index + 3);
    readonly generadorTablasOpciones = Array.from({ length: 5 }, (_, index) => index + 1);
    readonly genderIdentityPresetOptions: { value: GenderIdentityPreset; label: string; }[] = [
        { value: 'male', label: 'Chico' },
        { value: 'female', label: 'Chica' },
        { value: 'hidden', label: 'No mostrar' },
        { value: 'custom', label: 'Rellenar' },
    ];

    constructor(
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userSettingsSvc: UserSettingsService,
        private appToastSvc: AppToastService,
        private apiActionGuardSvc: ApiActionGuardService,
        private platformSessionSvc: PlatformSessionService,
        private chatFloatingSvc: ChatFloatingService,
        readonly gestion: CampanasGestionEstado,
    ) { }

    ngOnInit(): void {
        this.userSvc.currentPrivateProfile$
            .pipe(takeUntil(this.destroy$))
            .subscribe((profile) => {
                this.profile = profile;
                this.resolvePendingRequestedSection();
            });
        this.gestion.iniciar();
        void this.cargar();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest']?.currentValue)
            this.requestSection(changes['openRequest'].currentValue);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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

    get formattedCreatedAt(): string {
        return textoFecha(this.profile?.createdAt, 'Sin dato');
    }

    get formattedLastSeenAt(): string {
        return textoFecha(this.profile?.lastSeenAt, 'Sin dato');
    }

    get effectiveProfileRole(): 'jugador' | 'master' | 'colaborador' | 'admin' {
        return this.userSvc.getCurrentRole();
    }

    get profileRoleLabel(): string {
        return textoRol(this.effectiveProfileRole, 'Jugador');
    }

    get requestedRoleTarget(): UserRoleRequestTarget | null {
        if (this.effectiveProfileRole === 'jugador')
            return 'master';
        if (this.effectiveProfileRole === 'master')
            return 'colaborador';
        return null;
    }

    get requestedRoleLabel(): string {
        return textoRol(this.requestedRoleTarget, 'Rol superior');
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
        return textoFechaHora(this.roleRequestStatus?.blockedUntilUtc, 'Sin fecha');
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

    get canAccessCampaignManagementSection(): boolean {
        return this.gestion.canCreateCampaign || this.gestion.manageableCampaigns.length > 0 || this.currentSection === 'campanas';
    }

    async cargar(): Promise<void> {
        this.loading = true;
        this.loadErrorMessage = '';
        try {
            const [profile, settings] = await Promise.all([
                this.userSvc.refreshCurrentPrivateProfile(),
                this.userSettingsSvc.loadSettings(true).catch(() => null),
                this.gestion.cargarListaInicial(),
            ]);
            this.profile = profile;
            this.applySettingsToForm(settings);
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
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudieron guardar las preferencias.'));
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
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo restablecer la preview.'));
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
        return enteroEntre(value, 3, 13, 13);
    }

    private normalizeGeneradorTablas(value: number): number {
        return enteroEntre(value, 1, 5, 3);
    }

    async solicitarCambioRol(): Promise<void> {
        const target = this.requestedRoleTarget;
        if (!target || !this.canRequestRole || this.roleRequestSubmitting)
            return;
        if (!permitirAccionGuardada(this.userSvc, this.apiActionGuardSvc, this.appToastSvc, `profile.role-request.${target}`))
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
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo registrar la solicitud.'));
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
        if (section === 'campanas')
            await this.gestion.abrirSeccion(preferredCampaignId);
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

    private requestSection(request: UserPrivateProfileOpenRequest | UserPrivateProfileSectionId | null | undefined): void {
        const target = typeof request === 'string'
            ? request
            : request?.section ?? 'resumen';
        this.pendingRequestedSection = target;
        this.pendingRequestedCampaignId = typeof request === 'string'
            ? null
            : toPositiveInt(request?.campaignId);
        this.resolvePendingRequestedSection();
    }

    private resolvePendingRequestedSection(): void {
        if (!this.pendingRequestedSection)
            return;

        void this.setSection(this.pendingRequestedSection, this.pendingRequestedCampaignId);
    }

    private normalizeOptionalMultilineText(value: string | null | undefined): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
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
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo cargar el estado de la solicitud de rol.'));
        } finally {
            this.roleRequestLoading = false;
        }
    }
}
