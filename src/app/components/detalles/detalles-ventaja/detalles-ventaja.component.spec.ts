import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesVentajaComponent } from './detalles-ventaja.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

function crearVentaja(partial: Partial<VentajaDetalle> = {}): VentajaDetalle {
    return {
        Id: 8,
        Nombre: 'Afortunado',
        Descripcion: 'La suerte te acompaña.',
        Disipable: false,
        Coste: -2,
        Mejora: 0,
        Caracteristica: false,
        Fuerza: false,
        Destreza: false,
        Constitucion: false,
        Inteligencia: false,
        Sabiduria: false,
        Carisma: false,
        Fortaleza: true,
        Reflejos: true,
        Voluntad: false,
        Iniciativa: false,
        Duplica_oro: false,
        Aumenta_oro: true,
        Idioma_extra: false,
        Manual: { Id: 4, Nombre: 'Unearthed Arcana', Pagina: 88 },
        Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
        Idioma: { Id: 0, Nombre: '', Descripcion: '' },
        Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
        Oficial: false,
        ...partial,
    };
}

describe('DetallesVentajaComponent', () => {
    let component: DetallesVentajaComponent;
    let fixture: ComponentFixture<DetallesVentajaComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos, lateral } = lectorFicha(elemento);
    const lista = (titulo: string): string[] => Array.from(lateral(titulo)?.querySelectorAll('.ficha-lista__item') ?? [])
        .map((item) => limpio(item.querySelector('span') ?? item));

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesVentajaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesVentajaComponent);
        component = fixture.componentInstance;
    });

    it('pinta la cabecera como homebrew, el coste y lo que afecta', () => {
        component.ventaja = crearVentaja();
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Ventaja');
        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Afortunado');
        expect(limpio(elemento().querySelector('.ficha-cabecera__manual'))).toContain('Unearthed Arcana · pág. 88');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map(e => limpio(e))).toEqual(['Homebrew']);
        expect(datos()).toEqual([['Coste', '-2']]);
        expect(titulos()).toEqual(['Descripción', 'Afecta a', 'Efectos']);
        expect(lista('Afecta a')).toEqual(['Fortaleza', 'Reflejos']);
        expect(lista('Efectos')).toEqual(['Aumenta el oro inicial']);
    });

    it('una desventaja con mejora, rasgo, idioma y habilidad los enseña en los datos clave', () => {
        component.ventaja = crearVentaja({
            Coste: 3,
            Mejora: 1,
            Rasgo: { Id: 2, Nombre: 'Cojera', Descripcion: '' },
            Idioma: { Id: 3, Nombre: 'Dracónico', Descripcion: '' },
            Habilidad: { Id: 4, Nombre: 'Saltar', Descripcion: '' },
        });
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Desventaja');
        expect(datos()).toEqual([
            ['Coste', '+3'], ['Mejora', '+1'], ['Rasgo', 'Cojera'], ['Idioma', 'Dracónico'], ['Habilidad', 'Saltar'],
        ]);
    });

    it('no enseña lo que la API da vacío o null', () => {
        component.ventaja = crearVentaja({
            Descripcion: null as any,
            Fortaleza: false,
            Reflejos: false,
            Aumenta_oro: false,
            Habilidad: null as any,
            Manual: { Id: 0, Nombre: '', Pagina: 0 },
        });
        fixture.detectChanges();

        expect(titulos()).toEqual([]);
        expect(elemento().querySelector('.ficha-cabecera__manual')).toBeNull();
        expect(datos()).toEqual([['Coste', '-2']]);
        expect(texto()).not.toContain('null');
        expect(texto()).not.toContain('undefined');
    });

    it('abre el detalle del manual', () => {
        component.ventaja = crearVentaja();
        fixture.detectChanges();

        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 4, nombre: 'Unearthed Arcana' });
    });
});
