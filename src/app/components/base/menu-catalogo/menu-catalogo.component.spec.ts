import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';
import { MisCampanasService } from 'src/app/services/mis-campanas.service';
import { NavegacionRolService, claveDePestanaListado } from 'src/app/services/navegacion-rol.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { GRUPOS_DE_CATALOGOS } from 'src/app/services/utils/catalogos-del-menu';
import { ACCIONES_DEL_MENU } from './acciones-del-menu';
import { MenuCatalogoComponent } from './menu-catalogo.component';

describe('MenuCatalogoComponent (el menú por catálogo de B)', () => {
    let fixture: ComponentFixture<MenuCatalogoComponent>;
    let acciones: jasmine.SpyObj<{ nuevoPersonaje(): void; abrirListado(lista: string): void; }>;
    let marco: jasmine.SpyObj<MarcoMovilService>;
    let navegacion: NavegacionRolService;
    let perfil: jasmine.SpyObj<UserProfileNavigationService>;
    let usuario: { IsLoggedIn: boolean; can: jasmine.Spy; getPermissionDeniedMessage: jasmine.Spy; };
    let campanasVisibles: BehaviorSubject<boolean>;

    const entradas = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button.menu-catalogo__entrada'));
    const entrada = (texto: string): HTMLButtonElement => entradas().find((b) => b.textContent!.trim().startsWith(texto))!;

    beforeEach(async () => {
        acciones = jasmine.createSpyObj('acciones', ['nuevoPersonaje', 'abrirListado']);
        marco = jasmine.createSpyObj<MarcoMovilService>('marco', ['cerrarMenu']);
        perfil = jasmine.createSpyObj<UserProfileNavigationService>('perfil', ['openSocial']);
        usuario = {
            IsLoggedIn: true,
            can: jasmine.createSpy('can').and.returnValue(true),
            getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
        };
        campanasVisibles = new BehaviorSubject(false);
        await TestBed.configureTestingModule({
            imports: [MenuCatalogoComponent],
            providers: [
                NavegacionRolService,
                { provide: UserService, useValue: usuario },
                { provide: UserProfileNavigationService, useValue: perfil },
                { provide: MarcoMovilService, useValue: marco },
                { provide: MisCampanasService, useValue: { visible$: campanasVisibles } },
                { provide: ACCIONES_DEL_MENU, useValue: acciones },
            ],
        }).compileComponents();
        navegacion = TestBed.inject(NavegacionRolService);
        fixture = TestBed.createComponent(MenuCatalogoComponent);
        fixture.detectChanges();
    });

    it('lista cada catálogo una vez: los seis principales y los grupos, plegados', () => {
        const textos = entradas().map((b) => b.textContent!.replace(/\s+/g, ' ').trim());
        expect(textos.slice(0, 2)).toEqual(['Personajes', 'Dados']);
        expect(textos.slice(2, 8)).toEqual(['Razas', 'Clases', 'Dotes', 'Conjuros', 'Monstruos', 'Plantillas']);
        expect(textos).toContain('Equipo, 7 catálogos');
        const listas = GRUPOS_DE_CATALOGOS.flatMap((g) => g.listas);
        expect(listas.length).toBe(18);
        // Todas las entradas de catálogo están en el DOM (las de los grupos, ocultas hasta desplegarlos), sin repetir.
        expect(new Set(textos).size).toBe(textos.length);
        const sublistas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.menu-catalogo__sublista'));
        expect(sublistas.length).toBe(3);
        expect(sublistas.every((ul) => ul.hidden)).toBeTrue();
    });

    it('un grupo se despliega en el sitio, con aria-expanded y su lista justo detrás', () => {
        const equipo = entrada('Equipo');
        expect(equipo.getAttribute('aria-expanded')).toBe('false');
        equipo.click();
        fixture.detectChanges();
        expect(equipo.getAttribute('aria-expanded')).toBe('true');
        const lista = fixture.nativeElement.querySelector('#' + equipo.getAttribute('aria-controls')) as HTMLElement;
        expect(lista.hidden).toBeFalse();
        expect(lista.textContent).toContain('Armaduras y escudos');
    });

    it('un catálogo abre su listado y cierra el cajón', () => {
        entrada('Dotes').click();
        expect(acciones.abrirListado).toHaveBeenCalledOnceWith('dotes');
        expect(marco.cerrarMenu).toHaveBeenCalled();
    });

    it('«Personajes» y «Dados» van a su pestaña', () => {
        const abrir = spyOn(navegacion, 'abrir');
        entrada('Personajes').click();
        entrada('Dados').click();
        expect(abrir.calls.allArgs()).toEqual([[{ clase: 'personajes' }], [{ clase: 'dados' }]]);
    });

    it('«Mis campañas» solo si le toca, y abre Social en Campañas', () => {
        expect(entrada('Mis campañas')).toBeUndefined();
        campanasVisibles.next(true);
        fixture.detectChanges();
        entrada('Mis campañas').click();
        expect(perfil.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({ section: 'campanas' }));
    });

    it('«Nuevo personaje» lo pide al marco; sin permiso, desactivado', () => {
        const boton = fixture.nativeElement.querySelector('.menu-catalogo__nuevo') as HTMLButtonElement;
        boton.click();
        expect(acciones.nuevoPersonaje).toHaveBeenCalled();
        usuario.can.and.returnValue(false);
        fixture.detectChanges();
        expect(boton.disabled).toBeTrue();
        expect(fixture.componentInstance.tooltipNuevoPersonaje).toBe('Sin permisos suficientes.');
        usuario.IsLoggedIn = false;
        fixture.detectChanges();
        expect(boton.disabled).toBeFalse();
    });

    it('marca lo que se está viendo y despliega su grupo', fakeAsync(() => {
        navegacion.anunciarPestanaActiva(claveDePestanaListado('munición', 'detalles'));
        flush();
        fixture.detectChanges();
        const municion = entrada('Munición');
        expect(municion.getAttribute('aria-current')).toBe('page');
        expect(entrada('Equipo').getAttribute('aria-expanded')).toBe('true');
        expect(entrada('Dotes').hasAttribute('aria-current')).toBeFalse();
        // El listado en «Modificar» (del menú de siempre) no es el de «Detalles».
        navegacion.anunciarPestanaActiva(claveDePestanaListado('munición', 'modificar'));
        flush();
        fixture.detectChanges();
        expect(municion.hasAttribute('aria-current')).toBeFalse();
    }));
});
