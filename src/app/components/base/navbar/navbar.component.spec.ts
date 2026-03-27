import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NavbarComponent } from './navbar.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let userState: { nombre: string; correo: string; permisos: number; };
    let isLoggedIn$: BehaviorSubject<boolean>;
    let permisos$: BehaviorSubject<number>;
    let currentPrivateProfile$: BehaviorSubject<any>;
    let manualVistaNavSvc: jasmine.SpyObj<ManualVistaNavigationService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let dialog: jasmine.SpyObj<MatDialog>;
    let userSvc: any;

    beforeEach(async () => {
        userState = { nombre: 'Invitado', correo: '', permisos: 0 };
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        permisos$ = new BehaviorSubject<number>(0);
        currentPrivateProfile$ = new BehaviorSubject<any>(null);
        manualVistaNavSvc = jasmine.createSpyObj<ManualVistaNavigationService>('ManualVistaNavigationService', ['emitirApertura']);
        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>(
            'UserProfileNavigationService',
            ['openPrivateProfile', 'openSocial', 'openAdminPanel', 'openRoadmap', 'openLegalPrivacy', 'openUsageAbout']
        );
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
        userSvc = {
            get Usuario() {
                return userState;
            },
            isLoggedIn$,
            permisos$,
            currentPrivateProfile$,
            logOut: jasmine.createSpy('logOut').and.returnValue(Promise.resolve()),
        };

        await TestBed.configureTestingModule({
            declarations: [NavbarComponent],
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatMenuModule,
                MatTooltipModule,
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
                { provide: ManualVistaNavigationService, useValue: manualVistaNavSvc },
                { provide: UserService, useValue: userSvc },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: MatDialog, useValue: dialog },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('crea los cuatro botones principales de la cinta', () => {
        const botones = fixture.debugElement.queryAll(By.css('.ribbon-trigger'));

        expect(botones.map((item) => item.nativeElement.textContent.trim())).toEqual([
            'Archivo',
            'Manuales',
            'Opciones',
            'Ayuda',
        ]);
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
        fixture.detectChanges();

        expect(component.isLoggedIn).toBeTrue();
        expect(component.isAdmin).toBeTrue();
        expect(component.usr).toBe('Yosi');
        expect(component.userSubLabel).toBe('yosi@test.dev');
    });

    it('abre mi perfil desde Archivo cuando hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        fixture.detectChanges();

        component.abrirMiPerfil();

        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledWith();
    });

    it('abre Social desde Archivo cuando hay sesión', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        fixture.detectChanges();

        component.abrirSocial();

        expect(userProfileNavSvc.openSocial).toHaveBeenCalledWith('resumen');
    });

    it('abre una sección concreta del perfil desde Opciones', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        fixture.detectChanges();

        component.abrirSeccionPerfil('identidad');

        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledWith('identidad');
    });

    it('abre admin panel solo para admins', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 1 };
        isLoggedIn$.next(true);
        permisos$.next(1);
        fixture.detectChanges();

        component.abrirAdminPanel();

        expect(userProfileNavSvc.openAdminPanel).toHaveBeenCalled();
    });

    it('no abre admin panel si el usuario no es admin', () => {
        userState = { nombre: 'Yosi', correo: 'yosi@test.dev', permisos: 0 };
        isLoggedIn$.next(true);
        permisos$.next(0);
        fixture.detectChanges();

        component.abrirAdminPanel();

        expect(userProfileNavSvc.openAdminPanel).not.toHaveBeenCalled();
    });

    it('abre el diálogo de sesión para invitados', () => {
        component.openSesionDialog();

        expect(dialog.open).toHaveBeenCalled();
    });

    it('delegates logout to UserService', async () => {
        component.logOut();
        await fixture.whenStable();

        expect(userSvc.logOut).toHaveBeenCalled();
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
