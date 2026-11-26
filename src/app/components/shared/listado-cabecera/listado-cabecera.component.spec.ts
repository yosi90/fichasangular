import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { TemaWebService } from 'src/app/services/tema-web/tema-web.service';
import { MenuLateral } from 'src/app/services/tema-web/temas-web';
import { UserService } from 'src/app/services/user.service';
import { IconoRolComponent } from '../icono-rol/icono-rol.component';
import { CONTEXTO_DE_LISTADO, ListadoCabeceraComponent } from './listado-cabecera.component';

@Component({
    template: `<app-listado-cabecera icono="personaje" titulo="Personajes" [total]="total" [texto]="texto" (textoChange)="escrito.push($event)"
        etiquetaBuscar="Buscar personajes" placeholder="Buscar por nombre, raza o clase"><button type="button" class="filtros">F</button></app-listado-cabecera>`,
    standalone: false
})
class AnfitrionComponent {
    total: number | null = 9;
    texto = '';
    escrito: string[] = [];
}

describe('ListadoCabeceraComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        fixture.detectChanges();
    });

    it('enseña el icono del catálogo en su recuadro de 40, el título, el total y lo proyectado (los filtros)', () => {
        const icono = elemento().querySelector('app-icono-rol') as HTMLElement;
        expect(icono.style.width).toBe('40px');
        expect(elemento().querySelector('h2')?.textContent?.trim()).toBe('Personajes');
        expect(elemento().querySelector('.listado-cabecera__total')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('9 en total');
        expect(elemento().querySelector('.listado-cabecera__acciones .filtros')).not.toBeNull();
    });

    it('el buscador tiene su nombre accesible y avisa de lo que se escribe', () => {
        const campo = elemento().querySelector('input') as HTMLInputElement;
        const etiqueta = elemento().querySelector(`label[for="${campo.id}"]`);
        expect(etiqueta?.textContent).toContain('Buscar personajes');
        expect(campo.placeholder).toBe('Buscar por nombre, raza o clase');
        campo.value = 'lázaro';
        campo.dispatchEvent(new Event('input'));
        expect(fixture.componentInstance.escrito).toEqual(['lázaro']);
    });

    it('sin total, no lo enseña', () => {
        fixture.componentInstance.total = null;
        fixture.detectChanges();
        expect(elemento().querySelector('.listado-cabecera__total')).toBeNull();
    });

    it('una pantalla que no es un listado la usa con subtítulo y sin buscador', async () => {
        expect(elemento().querySelector('.listado-cabecera__subtitulo')).toBeNull();
        TestBed.resetTestingModule();
        @Component({
            template: '<app-listado-cabecera icono="dado-d20" titulo="Dados" subtitulo="Tiradas sueltas para la mesa" [buscador]="false"></app-listado-cabecera>',
            standalone: false
        })
        class SinBuscadorComponent { }
        await TestBed.configureTestingModule({
            declarations: [SinBuscadorComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule],
        }).compileComponents();
        const otra = TestBed.createComponent(SinBuscadorComponent);
        otra.detectChanges();
        const raiz = otra.nativeElement as HTMLElement;
        expect(raiz.querySelector('.listado-cabecera__subtitulo')?.textContent?.trim()).toBe('Tiradas sueltas para la mesa');
        expect(raiz.querySelector('input')).toBeNull();
        expect(raiz.querySelector('[role="search"]')).toBeNull();
    });

    it('una pantalla que no es de rol (Novedades) lleva su icono de Material y lo proyectado va a la derecha', async () => {
        TestBed.resetTestingModule();
        @Component({
            template: '<app-listado-cabecera iconoMaterial="new_releases" titulo="Novedades" [buscador]="false"><span class="extra">x</span></app-listado-cabecera>',
            standalone: false
        })
        class MaterialComponent { }
        await TestBed.configureTestingModule({
            declarations: [MaterialComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule],
        }).compileComponents();
        const otra = TestBed.createComponent(MaterialComponent);
        otra.detectChanges();
        const raiz = otra.nativeElement as HTMLElement;
        expect(raiz.querySelector('app-icono-rol')).toBeNull();
        expect(raiz.querySelector('mat-icon.listado-cabecera__icono-material')?.textContent?.trim()).toBe('new_releases');
        expect(raiz.querySelector('.listado-cabecera--sin-buscador .listado-cabecera__acciones .extra')).not.toBeNull();
    });

    // El tema C (fase 3): la cabecera en granate, con su campo en granate oscuro, y el título en Literata.
    it('en el tema C va en granate con el título en Literata; en A, en pizarra y Roboto', () => {
        const html = document.documentElement;
        const antes = html.dataset['tema'];
        const antesModo = html.dataset['modo'];
        const estilo = (selector: string) => getComputedStyle(elemento().querySelector(selector) as HTMLElement);
        try {
            html.dataset['tema'] = 'c';
            html.dataset['modo'] = 'oscuro';
            expect(estilo('.listado-cabecera').backgroundColor).toBe('rgb(74, 18, 31)');
            expect(estilo('.listado-cabecera__buscar').backgroundColor).toBe('rgb(46, 11, 19)');
            expect(estilo('.listado-cabecera__titulo').fontFamily).toContain('Literata');
            html.dataset['tema'] = 'a';
            expect(estilo('.listado-cabecera').backgroundColor).toBe('rgb(55, 60, 65)');
            expect(estilo('.listado-cabecera__titulo').fontFamily).toContain('Roboto');
        } finally {
            if (antes === undefined)
                delete html.dataset['tema'];
            else
                html.dataset['tema'] = antes;
            if (antesModo === undefined)
                delete html.dataset['modo'];
            else
                html.dataset['modo'] = antesModo;
        }
    });

    // B (fase 4): sin fondo ni sombra, el título más grande y la línea fina debajo.
    it('en B va sin fondo, con la línea fina debajo y el título en Literata más grande', () => {
        const html = document.documentElement;
        const antes = { tema: html.dataset['tema'], modo: html.dataset['modo'], marco: html.dataset['marco'] };
        const estilo = (selector: string) => getComputedStyle(elemento().querySelector(selector) as HTMLElement);
        try {
            html.dataset['tema'] = 'b';
            html.dataset['modo'] = 'oscuro';
            html.dataset['marco'] = 'plano';
            expect(estilo('.listado-cabecera').backgroundColor).toBe('rgba(0, 0, 0, 0)');
            expect(estilo('.listado-cabecera').boxShadow).toBe('none');
            expect(estilo('.listado-cabecera').borderBottomWidth).toBe('1px');
            expect(estilo('.listado-cabecera').borderBottomColor).toBe('rgb(46, 42, 55)');
            expect(estilo('.listado-cabecera__titulo').fontFamily).toContain('Literata');
            expect(estilo('.listado-cabecera__titulo').fontSize).toBe('26px');
            html.dataset['tema'] = 'a';
            delete html.dataset['marco'];
            expect(estilo('.listado-cabecera').borderBottomWidth).toBe('0px');
            expect(estilo('.listado-cabecera__titulo').fontSize).toBe('20px');
        } finally {
            (['tema', 'modo', 'marco'] as const).forEach((clave) => {
                if (antes[clave] === undefined)
                    delete html.dataset[clave];
                else
                    html.dataset[clave] = antes[clave]!;
            });
        }
    });

    it('fuera de un listado de catálogo no lleva «Nueva …» ni pide el tema', () => {
        expect(elemento().querySelector('.listado-cabecera__nueva')).toBeNull();
    });
});

describe('ListadoCabeceraComponent en un listado de catálogo («Nueva …» de B)', () => {
    let fixture: ComponentFixture<ListadoDotesFalsoComponent>;
    let menu: BehaviorSubject<MenuLateral>;
    let usuario: { can: jasmine.Spy; getPermissionDeniedMessage: jasmine.Spy; normasDeCreacionPendientes: boolean; asegurarNormasDeCreacion: jasmine.Spy; };
    let navegacion: jasmine.SpyObj<NavegacionRolService>;
    const boton = (): HTMLButtonElement | null => fixture.nativeElement.querySelector('.listado-cabecera__nueva-boton');

    @Component({
        template: `<app-listado-cabecera icono="dote" titulo="Dotes"><button type="button" class="filtros">F</button></app-listado-cabecera>`,
        providers: [{ provide: CONTEXTO_DE_LISTADO, useValue: { tipoLista: 'dotes' } }],
        standalone: false
    })
    class ListadoDotesFalsoComponent { }

    beforeEach(async () => {
        menu = new BehaviorSubject<MenuLateral>('accion');
        usuario = {
            can: jasmine.createSpy('can').and.returnValue(true),
            getPermissionDeniedMessage: jasmine.createSpy().and.returnValue('Sin permisos suficientes.'),
            normasDeCreacionPendientes: false,
            asegurarNormasDeCreacion: jasmine.createSpy('asegurarNormasDeCreacion').and.resolveTo(true),
        };
        navegacion = jasmine.createSpyObj<NavegacionRolService>('NavegacionRolService', ['abrir']);
        await TestBed.configureTestingModule({
            declarations: [ListadoDotesFalsoComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule, MatTooltipModule],
            providers: [
                { provide: TemaWebService, useValue: { menuLateral$: menu } },
                { provide: UserService, useValue: usuario },
                { provide: NavegacionRolService, useValue: navegacion },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ListadoDotesFalsoComponent);
        fixture.detectChanges();
    });

    it('con el menú por acción (A y C) no lleva «Nueva …»: está en Insertar del menú', () => {
        expect(boton()).toBeNull();
    });

    it('con el menú por catálogo (B), «Nueva dote» antes de los filtros, y abre su inserción', () => {
        menu.next('catalogo');
        fixture.detectChanges();
        expect(boton()?.textContent?.trim()).toBe('Nueva dote');
        const acciones = fixture.nativeElement.querySelector('.listado-cabecera__acciones') as HTMLElement;
        expect(acciones.firstElementChild?.classList).toContain('listado-cabecera__nueva');
        boton()!.click();
        expect(navegacion.abrir).toHaveBeenCalledOnceWith({ clase: 'insercion', lista: 'dotes' });
    });

    it('sin permiso, desactivado y con el aviso de permisos; las normas pendientes se piden antes de abrir', async () => {
        menu.next('catalogo');
        usuario.can.and.returnValue(false);
        fixture.detectChanges();
        expect(boton()!.disabled).toBeTrue();
        usuario.can.and.returnValue(true);
        usuario.normasDeCreacionPendientes = true;
        fixture.detectChanges();
        boton()!.click();
        expect(usuario.asegurarNormasDeCreacion).toHaveBeenCalled();
        expect(navegacion.abrir).not.toHaveBeenCalled();
        await Promise.resolve();
        await Promise.resolve();
        expect(navegacion.abrir).toHaveBeenCalledWith({ clase: 'insercion', lista: 'dotes' });
    });
});
