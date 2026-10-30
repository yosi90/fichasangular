import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { NavbarComponent } from './navbar.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
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
    let navegacionRol: jasmine.SpyObj<NavegacionRolService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let platformSessionSvc: jasmine.SpyObj<PlatformSessionService>;
    let manualFlagNoticeSvc: jasmine.SpyObj<ManualFlagConsistencyNoticeService>;
    let manualesAsociadosSvc: any;
    let userSvc: any;

    function createComponent(): NavbarComponent {
        userState = { nombre: 'Invitado', correo: '', permisos: 0 };
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        permisos$ = new BehaviorSubject<number>(0);
        currentPrivateProfile$ = new BehaviorSubject<any>(null);
        navegacionRol = jasmine.createSpyObj<NavegacionRolService>('NavegacionRolService', ['abrir']);
        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>(
            'UserProfileNavigationService',
            ['openPrivateProfile', 'openSocial', 'openAyuda', 'openFeedbackBug', 'openFeedbackFeature', 'abrirVista']
        );
        platformSessionSvc = jasmine.createSpyObj<PlatformSessionService>('PlatformSessionService', ['editarPerfil', 'privacidad']);
        platformSessionSvc.editarPerfil.and.resolveTo(false);
        platformSessionSvc.privacidad.and.resolveTo();
        manualFlagNoticeSvc = jasmine.createSpyObj<ManualFlagConsistencyNoticeService>('ManualFlagConsistencyNoticeService', ['notifyAdminIfNeeded']);
        manualesAsociadosSvc = {
            getManualesAsociados: () => of([]),
            fallbackNotice$: of(''),
        };
        userSvc = {
            get Usuario() {
                return userState;
            },
            get IsLoggedIn() {
                return isLoggedIn$.value;
            },
            isLoggedIn$,
            permisos$,
            currentPrivateProfile$,
            logOut: jasmine.createSpy('logOut').and.returnValue(Promise.resolve()),
            entrar: jasmine.createSpy('entrar').and.returnValue(Promise.resolve(true)),
        };

        const instance = new NavbarComponent(
            manualesAsociadosSvc,
            navegacionRol,
            manualFlagNoticeSvc,
            platformSessionSvc,
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

    it('abre el acceso de Yosiftware para invitados', () => {
        component.openSesionDialog();

        expect(userSvc.entrar).toHaveBeenCalled();
    });

    it('abre en la propia pestaña las notificaciones que enlazan a una vista de Rol', () => {
        userProfileNavSvc.abrirVista.and.returnValue(true);
        const evento = new CustomEvent('yosi-notificacion-abrir', {
            cancelable: true,
            detail: { enlace: `${window.location.origin}/?vista=campanas&campana=12` },
        });

        component.onNotificacionAbrir(evento);

        expect(userProfileNavSvc.abrirVista).toHaveBeenCalled();
        expect(userProfileNavSvc.abrirVista.calls.mostRecent().args[0].get('campana')).toBe('12');
        expect(evento.defaultPrevented).toBeTrue();
    });

    it('deja que el SDK abra en otra pestaña los enlaces de otras webs', () => {
        const evento = new CustomEvent('yosi-notificacion-abrir', {
            cancelable: true,
            detail: { enlace: 'https://social.yosiftware.es/?vista=cuenta' },
        });

        component.onNotificacionAbrir(evento);

        expect(userProfileNavSvc.abrirVista).not.toHaveBeenCalled();
        expect(evento.defaultPrevented).toBeFalse();
    });

    it('delegates logout to UserService', () => {
        component.logOut();

        expect(userSvc.logOut).toHaveBeenCalled();
    });

    it('mantiene manuales operativo y cierra el menú al abrir uno', () => {
        const trigger = jasmine.createSpyObj('MatMenuTrigger', ['closeMenu']);
        const manual = { Id: 5, Nombre: 'Manual del jugador', Oficial: true } as any;
        const event = new MouseEvent('click');
        spyOn(event, 'stopPropagation');

        component.abrirManual(manual, event, trigger as any);

        expect(navegacionRol.abrir).toHaveBeenCalledWith({ clase: 'manual', manual });
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

    it('los elementos del menú Ayuda abren la única Ayuda en su sección', () => {
        component.abrirAyuda('novedades');
        component.abrirAyuda('legal');
        component.abrirAyuda('primeros-pasos');

        expect(userProfileNavSvc.openAyuda.calls.allArgs()).toEqual([['novedades'], ['legal'], ['primeros-pasos']]);
    });

    it('abre reportar bug desde Ayuda si hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);

        component.abrirReportarBug();

        expect(userProfileNavSvc.openFeedbackBug).toHaveBeenCalled();
        expect(userSvc.entrar).not.toHaveBeenCalled();
    });

    it('abre login si intentan reportar bug sin sesión', () => {
        component.abrirReportarBug();

        expect(userSvc.entrar).toHaveBeenCalled();
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

});

describe('NavbarComponent template', () => {
    let fixture: ComponentFixture<NavbarComponent>;
    let component: NavbarComponent;
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
                    provide: NavegacionRolService,
                    useValue: jasmine.createSpyObj<NavegacionRolService>('NavegacionRolService', ['abrir']),
                },
                {
                    provide: UserService,
                    useValue: {
                        get Usuario() {
                            return userState;
                        },
                        IsLoggedIn: false,
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
                        ['openPrivateProfile', 'openSocial', 'openAyuda', 'openFeedbackBug', 'openFeedbackFeature']
                    ),
                },
                { provide: PlatformSessionService, useValue: jasmine.createSpyObj<PlatformSessionService>('PlatformSessionService', ['editarPerfil', 'privacidad']) },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        localStorage.clear();
    });

    it('crea la cinta iconificada con la campana de Yosiftware a la derecha', () => {
        const botones = fixture.debugElement.queryAll(By.css('.ribbon-nav > .ribbon-trigger'));
        const iconos = fixture.debugElement.queryAll(By.css('.ribbon-nav > .ribbon-trigger .mat-icon'));

        expect(botones.length).toBe(4);
        expect(iconos.map((item) => item.nativeElement.textContent.trim())).toEqual([
            'folder',
            'menu_book',
            'tune',
            'help_center',
        ]);
        expect(fixture.debugElement.query(By.css('.ribbon-nav > yosi-notificaciones'))).not.toBeNull();
    });

});
