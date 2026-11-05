import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { getManualCategorias, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
import { UserPrivateProfileSectionId } from 'src/app/interfaces/user-account';
import { SeccionAyuda } from 'src/app/interfaces/ayuda';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { BuscadorGlobalVentanaService } from '../../shared/buscador-global/buscador-global.component';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';

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

    constructor(
        private manualesAsociadosSvc: ManualesAsociadosService,
        private navegacionRol: NavegacionRolService,
        private manualFlagNoticeSvc: ManualFlagConsistencyNoticeService,
        private platformSessionSvc: PlatformSessionService,
        private usrService: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
        private buscadorGlobal?: BuscadorGlobalVentanaService,
        private marco?: MarcoMovilService,
    ) { }

    /** En el móvil, la cinta lleva el botón «Menú», que abre el menú lateral como cajón (vista 10 del lienzo). */
    get esMovil(): boolean {
        return this.marco?.esMovil ?? false;
    }

    get menuAbierto(): boolean {
        return this.marco?.menuAbierto ?? false;
    }

    alternarMenu(): void {
        this.marco?.alternarMenu();
    }

    /** El atajo de la búsqueda global, como se escribe en este equipo. */
    readonly atajoBuscar = /mac|iphone|ipad/i.test(typeof navigator !== 'undefined' ? navigator.platform || navigator.userAgent : '') ? '⌘K' : 'Ctrl+K';

    abrirBuscador(): void {
        this.buscadorGlobal?.abrir();
    }

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
                this.errorState = mensajeDeError(error, 'No se pudieron cargar los manuales');
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
    }

    getCategorias(manual: ManualAsociadoDetalle): ManualCategoriaConIcono[] {
        return getManualCategorias(manual);
    }

    /** Un manual del menú Manuales: abre su detalle (el menú se cierra solo al elegir). */
    abrirManual(manual: ManualAsociadoDetalle): void {
        if (!manual || Number(manual.Id) <= 0)
            return;
        this.navegacionRol.abrir({ clase: 'manual', manual });
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

    /** Los elementos del menú Ayuda abren la única pestaña de Ayuda en su sección. */
    abrirAyuda(seccion: SeccionAyuda): void {
        this.userProfileNavSvc.openAyuda(seccion);
    }

    /** «Ayuda → Novedades» abre la pestaña Novedades (una sola). */
    abrirNovedades(): void {
        this.navegacionRol.abrir({ clase: 'novedades' });
    }

    get urlCompanion(): string {
        return this.platformSessionSvc.urlCompanion;
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
