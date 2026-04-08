import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { getManualCategorias, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
import { SessionNotificationEntry } from 'src/app/interfaces/session-notification';
import { UserPrivateProfileSectionId } from 'src/app/interfaces/user-account';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { SesionDialogComponent } from 'src/app/components/sesion-dialog/sesion-dialog.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { SessionNotificationCenterService } from 'src/app/services/session-notification-center.service';
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
    sessionNotifications: SessionNotificationEntry[] = [];
    hasUnreadNotifications: boolean = false;
    notificationMenuOpen: boolean = false;
    private manualesSub?: Subscription;
    private fallbackSub?: Subscription;
    private loggedInSub?: Subscription;
    private permisosSub?: Subscription;
    private profileSub?: Subscription;
    private sessionNotificationsSub?: Subscription;
    private unreadNotificationsSub?: Subscription;
    private ribbonMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;
    private notificationSeenSyncTimer: ReturnType<typeof setTimeout> | null = null;
    private notificationCountdownTimer: ReturnType<typeof setInterval> | null = null;
    private activeRibbonMenuTrigger: MatMenuTrigger | null = null;
    private lastRibbonMenuOpenedAt: number = 0;
    private notificationNow: number = Date.now();

    constructor(
        private dSesion: MatDialog,
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
        private manualFlagNoticeSvc: ManualFlagConsistencyNoticeService,
        private sessionNotificationCenterSvc: SessionNotificationCenterService,
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
        this.sessionNotificationsSub = this.sessionNotificationCenterSvc.entries$
            .subscribe((entries) => {
                this.sessionNotifications = entries;
                this.notificationNow = Date.now();
                this.syncNotificationCountdownTimer();
                if (this.notificationMenuOpen)
                    this.scheduleVisibleNotificationsSeenSync();
            });
        this.unreadNotificationsSub = this.sessionNotificationCenterSvc.hasUnread$
            .subscribe((hasUnread) => this.hasUnreadNotifications = hasUnread);
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
        this.sessionNotificationsSub?.unsubscribe();
        this.unreadNotificationsSub?.unsubscribe();
        this.cancelarCierreRibbonMenu();
        this.cancelNotificationSeenSync();
        this.stopNotificationCountdownTimer();
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

    trackByNotificationId(index: number, entry: SessionNotificationEntry): string {
        return entry.id;
    }

    notificationLevelIcon(level: string): string {
        if (level === 'success')
            return 'task_alt';
        if (level === 'error')
            return 'error';
        if (level === 'warning')
            return 'warning';
        if (level === 'system')
            return 'settings_suggest';
        return 'info';
    }

    formatNotificationTime(value: number): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return '';
        const now = new Date();
        const sameDay = now.getFullYear() === date.getFullYear()
            && now.getMonth() === date.getMonth()
            && now.getDate() === date.getDate();
        return new Intl.DateTimeFormat('es-ES', sameDay ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        } : {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date).replace(',', '');
    }

    formatNotificationCountdown(entry: SessionNotificationEntry): string {
        const countdownUntil = Number(entry?.countdownUntil ?? 0);
        if (!Number.isFinite(countdownUntil) || countdownUntil <= this.notificationNow)
            return '';

        const totalSeconds = Math.ceil((countdownUntil - this.notificationNow) / 1000);
        if (!Number.isFinite(totalSeconds) || totalSeconds <= 0)
            return '';

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const hourLabel = `${(days > 0 ? hours % 24 : hours).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const value = days > 0
            ? `${days} d ${hourLabel}`
            : hours > 0
                ? hourLabel
            : minutes > 0
                ? `${minutes} min ${seconds.toString().padStart(2, '0')} s`
                : `${seconds} s`;
        const prefix = `${entry?.countdownLabel ?? ''}`.trim();
        return prefix.length > 0 ? `${prefix}: ${value}` : value;
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

    onNotificationMenuOpened(trigger: MatMenuTrigger): void {
        this.notificationMenuOpen = true;
        this.onRibbonMenuOpened(trigger);
        this.notificationNow = Date.now();
        this.syncNotificationCountdownTimer();
        this.scheduleVisibleNotificationsSeenSync();
    }

    onNotificationMenuClosed(trigger: MatMenuTrigger): void {
        this.notificationMenuOpen = false;
        this.cancelNotificationSeenSync();
        this.stopNotificationCountdownTimer();
        this.onRibbonMenuClosed(trigger);
    }

    dismissSessionNotification(id: string, event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.sessionNotificationCenterSvc.remove(id);
    }

    clearSessionNotifications(event: Event): void {
        event.stopPropagation();
        event.preventDefault();
        this.sessionNotificationCenterSvc.clear();
    }

    async openSessionNotification(entry: SessionNotificationEntry, trigger?: MatMenuTrigger): Promise<void> {
        if (!entry)
            return;
        this.sessionNotificationCenterSvc.markSeen([entry.id]);
        if (typeof entry.action !== 'function')
            return;
        trigger?.closeMenu();
        this.notificationMenuOpen = false;
        this.cancelNotificationSeenSync();
        try {
            await entry.action();
        } catch {
            // La navegación de la notificación no debe romper la UI si falla.
        }
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

    private notificarManualesDesincronizados(): void {
        if (!this.isAdmin || this.manuales.length < 1)
            return;

        this.manuales.forEach((manual) => {
            this.manualFlagNoticeSvc.notifyAdminIfNeeded(manual, this.isAdmin);
        });
    }

    private scheduleVisibleNotificationsSeenSync(): void {
        if (!this.notificationMenuOpen)
            return;
        this.cancelNotificationSeenSync();
        this.notificationSeenSyncTimer = setTimeout(() => {
            this.notificationSeenSyncTimer = null;
            if (!this.notificationMenuOpen || this.sessionNotifications.length < 1)
                return;
            this.sessionNotificationCenterSvc.markSeen(this.sessionNotifications.map((entry) => entry.id));
        });
    }

    private cancelNotificationSeenSync(): void {
        if (!this.notificationSeenSyncTimer)
            return;
        clearTimeout(this.notificationSeenSyncTimer);
        this.notificationSeenSyncTimer = null;
    }

    private syncNotificationCountdownTimer(): void {
        const hasActiveCountdowns = this.notificationMenuOpen
            && this.sessionNotifications.some((entry) => Number(entry?.countdownUntil ?? 0) > this.notificationNow);
        if (!hasActiveCountdowns) {
            this.stopNotificationCountdownTimer();
            return;
        }
        if (this.notificationCountdownTimer)
            return;

        this.notificationCountdownTimer = setInterval(() => {
            this.notificationNow = Date.now();
            if (!this.sessionNotifications.some((entry) => Number(entry?.countdownUntil ?? 0) > this.notificationNow))
                this.stopNotificationCountdownTimer();
        }, 1000);
    }

    private stopNotificationCountdownTimer(): void {
        if (!this.notificationCountdownTimer)
            return;
        clearInterval(this.notificationCountdownTimer);
        this.notificationCountdownTimer = null;
    }
}
