import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescripcionEquipoComponent, descripcionEquipoVisible } from './descripcion-equipo.component';

describe('DescripcionEquipoComponent', () => {
    let fixture: ComponentFixture<DescripcionEquipoComponent>;
    let component: DescripcionEquipoComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DescripcionEquipoComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DescripcionEquipoComponent);
        component = fixture.componentInstance;
    });

    function texto(): string {
        fixture.detectChanges();
        return (fixture.nativeElement as HTMLElement).textContent ?? '';
    }

    it('dice que la descripción es propia (un resumen)', () => {
        component.descripcion = 'Hoja corta.';
        component.origen = 'propia';
        expect(texto()).toContain('Descripción propia');
        expect(component.ayudaOrigen).toContain('manual');
    });

    it('dice que el texto es del SRD', () => {
        component.descripcion = 'Este encantamiento dobla el rango de amenaza.';
        component.origen = 'srd';
        expect(texto()).toContain('Texto del SRD');
        expect(component.ayudaOrigen).toContain('OGL');
    });

    it('sin descripción ni traducción no enseña nada', () => {
        component.descripcion = '';
        expect(component.visible).toBeFalse();
        expect(texto().trim()).toBe('');
    });

    it('marca lo traducido con su nombre original', () => {
        component.descripcion = '';
        component.traducido = true;
        component.nombreOriginal = 'Cloak of resistance';
        expect(texto()).toContain('Traducido: Cloak of resistance');
    });

    it('se ve con texto o traducida, y no con un texto vacío o de relleno', () => {
        expect(descripcionEquipoVisible({ Descripcion: 'Hoja corta.', Traducido: false })).toBeTrue();
        expect(descripcionEquipoVisible({ Descripcion: '', Traducido: true })).toBeTrue();
        expect(descripcionEquipoVisible({ Descripcion: 'No especifica', Traducido: false })).toBeFalse();
        expect(descripcionEquipoVisible(null)).toBeFalse();
    });
});
