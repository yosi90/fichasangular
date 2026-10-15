import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { getManualCategorias, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
import { UserPrivateProfileSectionId } from 'src/app/interfaces/user-account';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.sass'],
    standalone: false
})
export class NavbarComponent implements OnInit, OnDestroy {
    manuales: ManualAsociadoDetalle[] = [];
    isLoading: boolean = true;
    errorState: string = '';
    fallbackNotice: string = '';
    usr: string = 'Invitado';
    userSubLabel: string = 'Sin sesión iniciada';
    isLoggedIn: boolean = false;
    isAdmin: boolean = false;
    private manualesSub?: Subscription;
    private fallbackSub?: Subscription;
    private loggedInSub?: Subscription;
    private permisosSub?: Subscription;
    private profileSub?: Subscription;
    private ribbonMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;
    private activeRibbonMenuTrigger: MatMenuTrigger | null = null;
    private lastRibbonMenuOpenedAt: number = 0;

    constructor(
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
        private manualFlagNoticeSvc: ManualFlagConsistencyNoticeService,
        private platformSessionSvc: PlatformSessionService,
        private usrService: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
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

    /** Entrar es de la plataforma: abre el acceso de Yosiftware sobre la web. */
    openSesionDialog(): void {
        void this.usrService.entrar().catch(() => undefined);
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

    editarPerfilPlataforma(): void {
        void this.platformSessionSvc.editarPerfil().catch(() => undefined);
    }

    abrirPrivacidad(): void {
        void this.platformSessionSvc.privacidad().catch(() => undefined);
    }

    /** Las notificaciones que enlazan a una vista de Rol se abren aquí mismo, sin otra pestaña. */
    onNotificacionAbrir(evento: Event): void {
        const enlace = `${(evento as CustomEvent<{ enlace?: string; }>).detail?.enlace ?? ''}`.trim();
        let destino: URL;
        try {
            destino = new URL(enlace, window.location.href);
        } catch {
            return;
        }
        if (destino.origin !== window.location.origin)
            return;
        if (this.userProfileNavSvc.abrirVista(destino.searchParams))
            evento.preventDefault();
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

    abrirReportarBug(): void {
        if (!this.isLoggedIn) {
            this.openSesionDialog();
            return;
        }
        this.userProfileNavSvc.openFeedbackBug();
    }

    abrirSolicitarFuncionalidad(): void {
        this.userProfileNavSvc.openFeedbackFeature();
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
        const isLoggedIn = this.usrService.IsLoggedIn;

        this.isLoggedIn = isLoggedIn;
        this.isAdmin = isLoggedIn && Number(this.usrService.Usuario.permisos) === 1;
        this.usr = nombre.length > 0 ? nombre : 'Invitado';
        this.userSubLabel = isLoggedIn
            ? (correo.length > 0 ? correo : 'Sesión activa')
            : 'Sin sesión iniciada';
    }

    private notificarManualesDesincronizados(): void {
        if (!this.isAdmin || this.manuales.length < 1)
            return;

        this.manuales.forEach((manual) => {
            this.manualFlagNoticeSvc.notifyAdminIfNeeded(manual, this.isAdmin);
        });
    }

}
