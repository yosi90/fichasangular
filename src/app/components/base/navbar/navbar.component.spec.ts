import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { NavbarComponent } from './navbar.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { SessionNotificationCenterService } from 'src/app/services/session-notification-center.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';

beforeAll(() => {
    jasmine.getEnv().configure({ random: false });
});

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let userState: { nombre: string; correo: string; permisos: number; };
    let isLoggedIn$: BehaviorSubject<boolean>;
    let permisos$: BehaviorSubject<number>;
    let currentPrivateProfile$: BehaviorSubject<any>;
    let manualVistaNavSvc: jasmine.SpyObj<ManualVistaNavigationService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let dialog: jasmine.SpyObj<MatDialog>;
    let manualFlagNoticeSvc: jasmine.SpyObj<ManualFlagConsistencyNoticeService>;
    let sessionNotificationCenterSvc: SessionNotificationCenterService;
    let manualesAsociadosSvc: any;
    let userSvc: any;

    function createComponent(): NavbarComponent {
        userState = { nombre: 'Invitado', correo: '', permisos: 0 };
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        permisos$ = new BehaviorSubject<number>(0);
        currentPrivateProfile$ = new BehaviorSubject<any>(null);
        manualVistaNavSvc = jasmine.createSpyObj<ManualVistaNavigationService>('ManualVistaNavigationService', ['emitirApertura']);
        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>(
            'UserProfileNavigationService',
            ['openPrivateProfile', 'openSocial', 'openAdminPanel', 'openRoadmap', 'openLegalPrivacy', 'openUsageAbout', 'openFeedbackBug', 'openFeedbackFeature']
        );
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
        manualFlagNoticeSvc = jasmine.createSpyObj<ManualFlagConsistencyNoticeService>('ManualFlagConsistencyNoticeService', ['notifyAdminIfNeeded']);
        sessionNotificationCenterSvc = new SessionNotificationCenterService();
        manualesAsociadosSvc = {
            getManualesAsociados: () => of([]),
            fallbackNotice$: of(''),
        };
        userSvc = {
            get Usuario() {
                return userState;
            },
            isLoggedIn$,
            permisos$,
            currentPrivateProfile$,
            logOut: jasmine.createSpy('logOut').and.returnValue(Promise.resolve()),
        };

        const instance = new NavbarComponent(
            dialog,
            manualesAsociadosSvc,
            manualVistaNavSvc,
            manualFlagNoticeSvc,
            sessionNotificationCenterSvc,
            userSvc,
            userProfileNavSvc,
        );
        instance.ngOnInit();
        return instance;
    }

    beforeEach(() => {
        localStorage.clear();
        component = createComponent();
    });

    afterEach(() => {
        component.ngOnDestroy();
        localStorage.clear();
        isLoggedIn$.complete();
        permisos$.complete();
        currentPrivateProfile$.complete();
    });

    it('muestra estado de invitado por defecto', () => {
        expect(component.isLoggedIn).toBeFalse();
        expect(component.isAdmin).toBeFalse();
        expect(component.usr).toBe('Invitado');
        expect(component.userSubLabel).toBe('Sin sesión iniciada');
    });

    it('actualiza el estado de usuario y admin desde los observables de sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 1 };
        isLoggedIn$.next(true);
        permisos$.next(1);
        currentPrivateProfile$.next({ displayName: 'Yosi' });

        expect(component.isLoggedIn).toBeTrue();
        expect(component.isAdmin).toBeTrue();
        expect(component.usr).toBe('Yosi');
        expect(component.userSubLabel).toBe('yosi@test.dev');
    });

    it('abre mi perfil desde Archivo cuando hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);

        component.abrirMiPerfil();

        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledWith();
    });

    it('abre Social desde Archivo cuando hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);

        component.abrirSocial();

        expect(userProfileNavSvc.openSocial).toHaveBeenCalledWith('resumen');
    });

    it('abre una sección concreta del perfil desde Opciones', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);

        component.abrirSeccionPerfil('identidad');

        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledWith('identidad');
    });

    it('abre admin panel solo para admins', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 1 };
        isLoggedIn$.next(true);
        permisos$.next(1);

        component.abrirAdminPanel();

        expect(userProfileNavSvc.openAdminPanel).toHaveBeenCalled();
    });

    it('no abre admin panel si el usuario no es admin', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        permisos$.next(0);

        component.abrirAdminPanel();

        expect(userProfileNavSvc.openAdminPanel).not.toHaveBeenCalled();
    });

    it('abre el diálogo de sesión para invitados', () => {
        component.openSesionDialog();

        expect(dialog.open).toHaveBeenCalled();
    });

    it('delegates logout to UserService', () => {
        component.logOut();

        expect(userSvc.logOut).toHaveBeenCalled();
    });

    it('limpia la campana al pasar de autenticado a invitado', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        sessionNotificationCenterSvc.add({
            source: 'toast',
            level: 'info',
            title: 'Privada',
            message: 'Solo para el actor autenticado',
        });

        isLoggedIn$.next(false);

        expect(component.sessionNotifications).toEqual([]);
        expect(component.hasUnreadNotifications).toBeFalse();
    });

    it('mantiene manuales operativo y cierra el menú al abrir uno', () => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
        const manual = { Id: 5, Nombre: 'Manual del jugador', Oficial: true } as any;
        const event = new MouseEvent('click');
        spyOn(event, 'stopPropagation');

        component.abrirManual(manual, event, trigger as any);

        expect(manualVistaNavSvc.emitirApertura).toHaveBeenCalledWith(manual);
        expect(trigger.closeMenu).toHaveBeenCalled();
    });

    it('calcula categorías efectivas aunque la flag esté desajustada', () => {
        const categorias = component.getCategorias({
            Id: 7,
            Nombre: 'Psiónica expandida',
            Incluye_dotes: false,
            Incluye_conjuros: false,
            Incluye_plantillas: false,
            Incluye_monstruos: false,
            Incluye_razas: false,
            Incluye_clases: false,
            Incluye_tipos: false,
            Incluye_subtipos: false,
            Oficial: true,
            Asociados: {
                Dotes: [],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: '' }],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            }
        } as any);

        expect(categorias.map((item) => item.label)).toEqual(['Razas']);
    });

    it('abre roadmap desde Ayuda', () => {
        component.abrirRoadmap();

        expect(userProfileNavSvc.openRoadmap).toHaveBeenCalled();
    });

    it('abre legal y privacidad desde Ayuda', () => {
        component.abrirLegalPrivacidad();

        expect(userProfileNavSvc.openLegalPrivacy).toHaveBeenCalled();
    });

    it('abre uso y acerca desde Ayuda', () => {
        component.abrirUsoYAcerca();

        expect(userProfileNavSvc.openUsageAbout).toHaveBeenCalled();
    });

    it('abre reportar bug desde Ayuda si hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);

        component.abrirReportarBug();

        expect(userProfileNavSvc.openFeedbackBug).toHaveBeenCalled();
        expect(dialog.open).not.toHaveBeenCalled();
    });

    it('abre login si intentan reportar bug sin sesión', () => {
        component.abrirReportarBug();

        expect(dialog.open).toHaveBeenCalled();
        expect(userProfileNavSvc.openFeedbackBug).not.toHaveBeenCalled();
    });

    it('abre solicitar funcionalidad también para invitados', () => {
        component.abrirSolicitarFuncionalidad();

        expect(userProfileNavSvc.openFeedbackFeature).toHaveBeenCalled();
    });

    it('cierra un menú de la cinta con retardo al alejarse', fakeAsync(() => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);

        component.programarCierreRibbonMenu(trigger as any);
        tick(149);
        expect(trigger.closeMenu).not.toHaveBeenCalled();

        tick(1);
        expect(trigger.closeMenu).toHaveBeenCalled();
    }));

    it('cancela el cierre diferido al reentrar en el menú', fakeAsync(() => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);

        component.programarCierreRibbonMenu(trigger as any);
        component.cancelarCierreRibbonMenu();
        tick(151);

        expect(trigger.closeMenu).not.toHaveBeenCalled();
    }));

    it('al pasar por otro botón con un menú abierto cambia al nuevo menú', fakeAsync(() => {
        const activeTrigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: true });
        const nextTrigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: false });

        component.onRibbonMenuOpened(activeTrigger as any);
        component.onRibbonTriggerEnter(nextTrigger as any);
        tick();

        expect(activeTrigger.closeMenu).toHaveBeenCalled();
        expect(nextTrigger.openMenu).toHaveBeenCalled();
    }));

    it('ignora el primer mouseleave inmediato tras abrir el mismo menú', fakeAsync(() => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: true });

        component.onRibbonMenuOpened(trigger as any);
        component.onRibbonTriggerLeave(trigger as any);
        tick(250);

        expect(trigger.closeMenu).not.toHaveBeenCalled();
    }));

    it('marca como vistas las notificaciones al abrir la campana', fakeAsync(() => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: true });
        const notificationId = sessionNotificationCenterSvc.add({
            source: 'toast',
            level: 'info',
            title: 'Nueva',
            message: 'Mensaje',
        });

        component.onNotificationMenuOpened(trigger as any);
        tick();

        expect(component.hasUnreadNotifications).toBeFalse();
        expect(component.sessionNotifications.find((entry) => entry.id === notificationId)?.seenAt).not.toBeNull();
    }));

    it('permite borrar una notificación sin romper el estado interno', () => {
        const removed = sessionNotificationCenterSvc.add({
            source: 'toast',
            level: 'info',
            title: 'A',
            message: 'Uno',
        });
        sessionNotificationCenterSvc.add({
            source: 'toast',
            level: 'info',
            title: 'B',
            message: 'Dos',
        });

        component.dismissSessionNotification(removed, new MouseEvent('click'));

        expect(component.sessionNotifications.length).toBe(1);
        expect(component.sessionNotifications[0].title).toBe('B');
    });

    it('ejecuta la acción principal de una notificación navegable', async () => {
        const action = jasmine.createSpy('action');
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: true });
        sessionNotificationCenterSvc.add({
            source: 'swal',
            level: 'info',
            title: 'Navegable',
            message: 'Abre algo',
            actionLabel: 'Abrir',
            action,
        });

        await component.openSessionNotification(component.sessionNotifications[0], trigger as any);

        expect(trigger.closeMenu).toHaveBeenCalled();
        expect(action).toHaveBeenCalled();
    });

    it('formatea countdowns activos para el menú de notificaciones', () => {
        (component as any).notificationNow = Date.now();
        const entry = {
            id: 'n-1',
            dedupeKey: 'guard.uid-1',
            source: 'toast',
            level: 'warning',
            title: 'Bloqueo',
            message: 'Mensaje',
            createdAt: Date.now(),
            seenAt: null,
            countdownUntil: Date.now() + 65_000,
            countdownLabel: 'Fin del cooldown',
            actionLabel: null,
            action: null,
        };

        expect(component.formatNotificationCountdown(entry as any)).toContain('Fin del cooldown: 1 min 05 s');
    });

    it('mantiene segundos visibles también cuando el countdown está en horas', () => {
        (component as any).notificationNow = Date.now();
        const entry = {
            id: 'n-2',
            dedupeKey: 'guard.uid-2',
            source: 'toast',
            level: 'warning',
            title: 'Bloqueo',
            message: 'Mensaje',
            createdAt: Date.now(),
            seenAt: null,
            countdownUntil: Date.now() + (10 * 60 * 60 * 1000) + 65_000,
            countdownLabel: 'Fin de la restricción',
            actionLabel: null,
            action: null,
        };

        expect(component.formatNotificationCountdown(entry as any)).toContain('Fin de la restricción: 10:01:05');
    });
});

describe('NavbarComponent template', () => {
    let fixture: ComponentFixture<NavbarComponent>;
    let component: NavbarComponent;
    let sessionNotificationCenterSvc: SessionNotificationCenterService;
    let userState: { nombre: string; correo: string; permisos: number; };

    beforeEach(async () => {
        localStorage.clear();
        userState = { nombre: 'Invitado', correo: '', permisos: 0 };
        await TestBed.configureTestingModule({
            declarations: [NavbarComponent],
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatMenuModule,
                MatIconModule,
            ],
            providers: [
                {
                    provide: ManualesAsociadosService,
                    useValue: {
                        getManualesAsociados: () => of([]),
                        fallbackNotice$: of(''),
                    },
                },
                {
                    provide: ManualFlagConsistencyNoticeService,
                    useValue: jasmine.createSpyObj<ManualFlagConsistencyNoticeService>('ManualFlagConsistencyNoticeService', ['notifyAdminIfNeeded']),
                },
                {
                    provide: ManualVistaNavigationService,
                    useValue: jasmine.createSpyObj<ManualVistaNavigationService>('ManualVistaNavigationService', ['emitirApertura']),
                },
                {
                    provide: UserService,
                    useValue: {
                        get Usuario() {
                            return userState;
                        },
                        isLoggedIn$: new BehaviorSubject<boolean>(false),
                        permisos$: new BehaviorSubject<number>(0),
                        currentPrivateProfile$: new BehaviorSubject<any>(null),
                        logOut: jasmine.createSpy('logOut').and.returnValue(Promise.resolve()),
                    },
                },
                {
                    provide: UserProfileNavigationService,
                    useValue: jasmine.createSpyObj<UserProfileNavigationService>(
                        'UserProfileNavigationService',
                        ['openPrivateProfile', 'openSocial', 'openAdminPanel', 'openRoadmap', 'openLegalPrivacy', 'openUsageAbout', 'openFeedbackBug', 'openFeedbackFeature']
                    ),
                },
                { provide: MatDialog, useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open']) },
                SessionNotificationCenterService,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        sessionNotificationCenterSvc = TestBed.inject(SessionNotificationCenterService);
        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        localStorage.clear();
    });

    it('crea la cinta iconificada y la campana a la derecha', () => {
        const botones = fixture.debugElement.queryAll(By.css('.ribbon-nav > .ribbon-trigger'));
        const iconos = fixture.debugElement.queryAll(By.css('.ribbon-nav > .ribbon-trigger .mat-icon'));

        expect(botones.length).toBe(5);
        expect(iconos.map((item) => item.nativeElement.textContent.trim())).toEqual([
            'folder',
            'menu_book',
            'tune',
            'help_center',
            'notifications',
        ]);
        expect(botones[4].nativeElement.getAttribute('aria-label')).toBe('Notificaciones de la sesión');
    });

    it('renderiza el punto de no vistas y lo oculta al abrir la campana', fakeAsync(() => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu', 'openMenu'], { menuOpen: true });

        sessionNotificationCenterSvc.add({
            source: 'toast',
            level: 'info',
            title: 'Nueva',
            message: 'Mensaje',
        });
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.ribbon-bell__dot'))).not.toBeNull();

        component.onNotificationMenuOpened(trigger as any);
        tick();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.ribbon-bell__dot'))).toBeNull();
    }));
});
