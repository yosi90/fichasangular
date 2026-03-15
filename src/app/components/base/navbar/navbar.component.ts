import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { getManualCategorias, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
import { UserPrivateProfileSectionId } from 'src/app/interfaces/user-account';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { SesionDialogComponent } from 'src/app/components/sesion-dialog/sesion-dialog.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.sass'],
    standalone: false
})
export class NavbarComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PROFILE_SETTINGS = {
        visibilidadPorDefectoPersonajes: false,
        mostrarPerfilPublico: true,
        allowDirectMessagesFromNonFriends: false,
    };

    manuales: ManualAsociadoDetalle[] = [];
    isLoading: boolean = true;
    errorState: string = '';
    fallbackNotice: string = '';
    usr: string = 'Invitado';
    userSubLabel: string = 'Sin sesión iniciada';
    isLoggedIn: boolean = false;
    isAdmin: boolean = false;
    quickSettingsLoading: boolean = false;
    quickSettingsSavingKey: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends' | null = null;
    quickSettingsError: string = '';
    mostrarPerfilPublicoQuickSetting: boolean = NavbarComponent.DEFAULT_PROFILE_SETTINGS.mostrarPerfilPublico;
    visibilidadPorDefectoQuickSetting: boolean = NavbarComponent.DEFAULT_PROFILE_SETTINGS.visibilidadPorDefectoPersonajes;
    allowDirectMessagesQuickSetting: boolean = NavbarComponent.DEFAULT_PROFILE_SETTINGS.allowDirectMessagesFromNonFriends;
    private manualesSub?: Subscription;
    private fallbackSub?: Subscription;
    private loggedInSub?: Subscription;
    private permisosSub?: Subscription;
    private profileSub?: Subscription;
    private ribbonMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;
    private activeRibbonMenuTrigger: MatMenuTrigger | null = null;
    private lastRibbonMenuOpenedAt: number = 0;
    private quickSettingsLoadSeq: number = 0;

    constructor(
        private dSesion: MatDialog,
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
        private manualFlagNoticeSvc: ManualFlagConsistencyNoticeService,
        private usrService: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
        private userSettingsSvc: UserSettingsService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.errorState = '';
        this.syncUserState();
        this.fallbackSub = this.manualesAsociadosSvc.fallbackNotice$
            .subscribe((notice) => this.fallbackNotice = notice ?? '');
        this.loggedInSub = this.usrService.isLoggedIn$
            .subscribe((loggedIn) => {
                this.isLoggedIn = loggedIn === true;
                this.syncUserState();
                if (this.isLoggedIn)
                    void this.loadQuickProfileSettings(true);
                else
                    this.resetQuickProfileSettingsState();
            });
        this.permisosSub = this.usrService.permisos$
            .subscribe((permisos) => {
                this.isAdmin = Number(permisos) === 1;
                this.syncUserState();
                this.notificarManualesDesincronizados();
            });
        this.profileSub = this.usrService.currentPrivateProfile$
            .subscribe(() => {
                this.syncUserState();
                this.notificarManualesDesincronizados();
            });
        this.manualesSub = this.manualesAsociadosSvc.getManualesAsociados().subscribe({
            next: (manuales) => {
                this.manuales = manuales.filter(m => Number(m?.Id) > 0);
                this.isLoading = false;
                this.notificarManualesDesincronizados();
            },
            error: (error) => {
                this.errorState = error?.message ?? 'No se pudieron cargar los manuales';
                this.isLoading = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.manualesSub?.unsubscribe();
        this.fallbackSub?.unsubscribe();
        this.loggedInSub?.unsubscribe();
        this.permisosSub?.unsubscribe();
        this.profileSub?.unsubscribe();
        this.cancelarCierreRibbonMenu();
    }

    getCategorias(manual: ManualAsociadoDetalle): ManualCategoriaConIcono[] {
        return getManualCategorias(manual);
    }

    abrirManual(manual: ManualAsociadoDetalle, event: MouseEvent, trigger?: MatMenuTrigger): void {
        event.stopPropagation();
        if (!manual || Number(manual.Id) <= 0)
            return;
        this.manualVistaNavSvc.emitirApertura(manual);
        trigger?.closeMenu();
    }

    openSesionDialog(): void {
        this.dSesion.open(SesionDialogComponent);
    }

    logOut(): void {
        void this.usrService.logOut()?.catch(() => undefined);
    }

    abrirMiPerfil(): void {
        if (!this.isLoggedIn)
            return;
        this.userProfileNavSvc.openPrivateProfile();
    }

    abrirSocial(): void {
        this.userProfileNavSvc.openSocial('resumen');
    }

    abrirSeccionPerfil(section: UserPrivateProfileSectionId): void {
        if (!this.isLoggedIn)
            return;
        this.userProfileNavSvc.openPrivateProfile(section);
    }

    abrirAdminPanel(): void {
        if (!this.isLoggedIn || !this.isAdmin)
            return;
        this.userProfileNavSvc.openAdminPanel();
    }

    abrirRoadmap(): void {
        this.userProfileNavSvc.openRoadmap();
    }

    abrirLegalPrivacidad(): void {
        this.userProfileNavSvc.openLegalPrivacy();
    }

    abrirUsoYAcerca(): void {
        this.userProfileNavSvc.openUsageAbout();
    }

    onOptionsMenuOpened(trigger: MatMenuTrigger): void {
        this.onRibbonMenuOpened(trigger);
        if (this.isLoggedIn)
            void this.loadQuickProfileSettings(true);
    }

    isQuickSettingSaving(key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends'): boolean {
        return this.quickSettingsSavingKey === key;
    }

    isQuickSettingDisabled(key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends'): boolean {
        return !this.isLoggedIn || this.quickSettingsLoading || this.quickSettingsSavingKey !== null || this.isQuickSettingSaving(key);
    }

    async onQuickSettingChange(
        key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends',
        checked: boolean
    ): Promise<void> {
        if (!this.isLoggedIn || this.quickSettingsLoading || this.quickSettingsSavingKey !== null)
            return;

        const previousValue = this.getQuickSettingValue(key);
        this.setQuickSettingValue(key, checked);
        this.quickSettingsSavingKey = key;
        this.quickSettingsError = '';

        try {
            const saved = await this.userSettingsSvc.saveProfileSettings({ [key]: checked });
            this.mostrarPerfilPublicoQuickSetting = saved.mostrarPerfilPublico !== false;
            this.visibilidadPorDefectoQuickSetting = saved.visibilidadPorDefectoPersonajes === true;
            this.appToastSvc.showSuccess(`${this.getQuickSettingLabel(key)} actualizado.`);
        } catch (error: any) {
            this.setQuickSettingValue(key, previousValue);
            this.quickSettingsError = `${error?.message ?? 'No se pudo guardar el ajuste.'}`.trim();
            this.appToastSvc.showError(this.quickSettingsError);
        } finally {
            this.quickSettingsSavingKey = null;
        }
    }

    onRibbonTriggerClick(trigger: MatMenuTrigger): void {
        this.cancelarCierreRibbonMenu();
        this.activeRibbonMenuTrigger = trigger;
    }

    onRibbonTriggerEnter(trigger: MatMenuTrigger): void {
        this.cancelarCierreRibbonMenu();
        if (!trigger)
            return;

        const current = this.activeRibbonMenuTrigger;
        if (!current || current === trigger || current.menuOpen !== true)
            return;

        this.activeRibbonMenuTrigger = trigger;
        current.closeMenu();
        setTimeout(() => {
            if (this.activeRibbonMenuTrigger !== trigger)
                return;
            trigger.openMenu();
            this.lastRibbonMenuOpenedAt = Date.now();
        });
    }

    onRibbonTriggerLeave(trigger: MatMenuTrigger): void {
        if (!trigger)
            return;
        if (this.activeRibbonMenuTrigger === trigger && Date.now() - this.lastRibbonMenuOpenedAt < 220)
            return;
        this.programarCierreRibbonMenu(trigger);
    }

    onRibbonMenuOpened(trigger: MatMenuTrigger): void {
        this.cancelarCierreRibbonMenu();
        this.activeRibbonMenuTrigger = trigger;
        this.lastRibbonMenuOpenedAt = Date.now();
    }

    onRibbonMenuClosed(trigger: MatMenuTrigger): void {
        if (this.activeRibbonMenuTrigger === trigger)
            this.activeRibbonMenuTrigger = null;
    }

    programarCierreRibbonMenu(trigger?: MatMenuTrigger): void {
        this.cancelarCierreRibbonMenu();
        if (!trigger)
            return;
        this.ribbonMenuCloseTimer = setTimeout(() => {
            trigger.closeMenu();
            if (this.activeRibbonMenuTrigger === trigger)
                this.activeRibbonMenuTrigger = null;
            this.ribbonMenuCloseTimer = null;
        }, 150);
    }

    cancelarCierreRibbonMenu(): void {
        if (!this.ribbonMenuCloseTimer)
            return;
        clearTimeout(this.ribbonMenuCloseTimer);
        this.ribbonMenuCloseTimer = null;
    }

    private syncUserState(): void {
        const nombre = `${this.usrService.Usuario.nombre ?? ''}`.trim();
        const correo = `${this.usrService.Usuario.correo ?? ''}`.trim();
        const isLoggedIn = nombre !== 'Invitado' && correo.length > 0;

        this.isLoggedIn = isLoggedIn;
        this.isAdmin = isLoggedIn && Number(this.usrService.Usuario.permisos) === 1;
        this.usr = nombre.length > 0 ? nombre : 'Invitado';
        this.userSubLabel = isLoggedIn
            ? (correo.length > 0 ? correo : 'Sesión activa')
            : 'Sin sesión iniciada';
    }

    private async loadQuickProfileSettings(forceRefresh: boolean): Promise<void> {
        if (!this.isLoggedIn) {
            this.resetQuickProfileSettingsState();
            return;
        }

        const requestSeq = ++this.quickSettingsLoadSeq;
        this.quickSettingsLoading = true;
        this.quickSettingsError = '';

        try {
            const settings = await this.userSettingsSvc.loadSettings(forceRefresh);
            if (requestSeq !== this.quickSettingsLoadSeq || !this.isLoggedIn)
                return;
            this.mostrarPerfilPublicoQuickSetting = settings.perfil?.mostrarPerfilPublico !== false;
            this.visibilidadPorDefectoQuickSetting = settings.perfil?.visibilidadPorDefectoPersonajes === true;
            this.allowDirectMessagesQuickSetting = settings.perfil?.allowDirectMessagesFromNonFriends === true;
        } catch (error: any) {
            if (requestSeq !== this.quickSettingsLoadSeq)
                return;
            this.quickSettingsError = `${error?.message ?? 'No se pudieron cargar los ajustes.'}`.trim();
            this.resetQuickProfileSettingValues();
        } finally {
            if (requestSeq === this.quickSettingsLoadSeq)
                this.quickSettingsLoading = false;
        }
    }

    private resetQuickProfileSettingsState(): void {
        this.quickSettingsLoadSeq += 1;
        this.quickSettingsLoading = false;
        this.quickSettingsSavingKey = null;
        this.quickSettingsError = '';
        this.resetQuickProfileSettingValues();
    }

    private resetQuickProfileSettingValues(): void {
        this.mostrarPerfilPublicoQuickSetting = NavbarComponent.DEFAULT_PROFILE_SETTINGS.mostrarPerfilPublico;
        this.visibilidadPorDefectoQuickSetting = NavbarComponent.DEFAULT_PROFILE_SETTINGS.visibilidadPorDefectoPersonajes;
        this.allowDirectMessagesQuickSetting = NavbarComponent.DEFAULT_PROFILE_SETTINGS.allowDirectMessagesFromNonFriends;
    }

    private getQuickSettingValue(key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends'): boolean {
        if (key === 'mostrarPerfilPublico')
            return this.mostrarPerfilPublicoQuickSetting;
        if (key === 'allowDirectMessagesFromNonFriends')
            return this.allowDirectMessagesQuickSetting;
        return this.visibilidadPorDefectoQuickSetting;
    }

    private setQuickSettingValue(key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends', value: boolean): void {
        if (key === 'mostrarPerfilPublico') {
            this.mostrarPerfilPublicoQuickSetting = value === true;
            return;
        }
        if (key === 'allowDirectMessagesFromNonFriends') {
            this.allowDirectMessagesQuickSetting = value === true;
            return;
        }
        this.visibilidadPorDefectoQuickSetting = value === true;
    }

    private getQuickSettingLabel(key: 'mostrarPerfilPublico' | 'visibilidadPorDefectoPersonajes' | 'allowDirectMessagesFromNonFriends'): string {
        if (key === 'mostrarPerfilPublico')
            return 'Visibilidad del perfil público';
        if (key === 'allowDirectMessagesFromNonFriends')
            return 'Mensajes directos de no amigos';
        return 'Visibilidad por defecto de personajes';
    }

    private notificarManualesDesincronizados(): void {
        if (!this.isAdmin || this.manuales.length < 1)
            return;

        this.manuales.forEach((manual) => {
            this.manualFlagNoticeSvc.notifyAdminIfNeeded(manual, this.isAdmin);
        });
    }
}
