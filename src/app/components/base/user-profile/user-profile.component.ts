import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { updateProfile } from 'firebase/auth';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Subject, takeUntil } from 'rxjs';
import {
    ProfileApiError,
    UserAvatarResponse,
    UserPrivateProfile,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId
} from 'src/app/interfaces/user-account';
import { NuevoPersonajeGeneradorConfig, UserSettingsV1 } from 'src/app/interfaces/user-settings';
import { AppToastService } from 'src/app/services/app-toast.service';
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

    private readonly destroy$ = new Subject<void>();
    private pendingRequestedSection: UserPrivateProfileSectionId | null = null;
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    constructor(
        private auth: Auth,
        private userSvc: UserService,
        private userProfileApiSvc: UserProfileApiService,
        private userSettingsSvc: UserSettingsService,
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

    setSection(section: UserPrivateProfileSectionId): void {
        if (section === 'seguridad' && !this.canChangePassword)
            return;
        this.currentSection = section;
        this.pendingRequestedSection = null;
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
            this.setSection(this.canChangePassword ? 'seguridad' : 'resumen');
            return;
        }

        this.setSection(this.pendingRequestedSection);
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
}
