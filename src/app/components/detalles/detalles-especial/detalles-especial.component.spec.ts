import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { DetallesEspecialComponent } from './detalles-especial.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

describe('DetallesEspecialComponent', () => {
    let component: DetallesEspecialComponent;
    let fixture: ComponentFixture<DetallesEspecialComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, etiquetasDatos, valor, titulos, lateral, etiquetasCabecera } = lectorFicha(elemento);
    /** Las filas de los pares de una lateral, con sus celdas separadas por « · »: «Fuerza · +4». */
    const filas = (titulo: string): string[] => Array.from(lateral(titulo)?.querySelectorAll('tr') ?? [])
        .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => limpio(td)).join(' · '));

    function furia(cambios: Partial<EspecialClaseDetalle> = {}): EspecialClaseDetalle {
        return {
            Id: 3,
            Nombre: 'Furia',
            Descripcion: 'Entra en un estado de furia.',
            Oficial: true,
            Extra: true,
            Repetible: true,
            Repite_mismo_extra: false,
            Repite_combinacion: true,
            Activa_extra: false,
            Caracteristica: { Id: 3, Nombre: 'Constitución' },
            Bonificadores: { Fuerza: 4, Destreza: 0, Constitucion: 4, Inteligencia: 0, Sabiduria: 0, Carisma: 0, CA: -2, Armadura_natural: 1, RD: 0, Tamano_pasos: 0 },
            Flags_extra: { No_aplica: false, Da_CA: true, Da_armadura_natural: false, Da_RD: false, Da_velocidad: true },
            Subtipo: { Id: 12, Nombre: 'Fuego' },
            Extras: [{ Id_extra: 2, Extra: 'Frío', Orden: 2 }, { Id_extra: 1, Extra: 'Fuego', Orden: 1 }],
            Habilidades: [{ Id_habilidad: 5, Habilidad: 'Trepar', Id_extra: 0, Extra: '', Rangos: 1 }],
            Prerrequisitos: { actitud_requerido: [], actitud_prohibido: [] },
            ...cambios,
        };
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesEspecialComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesEspecialComponent);
        component = fixture.componentInstance;
        component.especial = furia();
        fixture.detectChanges();
    });

    it('la cabecera dice qué es y cómo se elige', () => {
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Especial de clase');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Furia');
        expect(etiquetasCabecera()).toEqual(['Usa extra', 'Repetible', 'Repite combinación', 'Oficial']);
    });

    it('enseña la característica, el subtipo (que se abre) y la descripción', () => {
        const emitSpy = spyOn(component.subtipoDetalles, 'emit');
        expect(valor('Característica')).toBe('Constitución');
        expect(valor('Subtipo')).toBe('Fuego');
        expect(texto()).toContain('Entra en un estado de furia.');
        (elemento().querySelector('.ficha-dato button.ficha-enlace') as HTMLButtonElement).click();
        expect(emitSpy).toHaveBeenCalledWith({ Id: 12, Nombre: 'Fuego' });
    });

    it('bonificadores, lo que da el extra, extras y habilidades, siempre a la vista', () => {
        expect(titulos()).toEqual(jasmine.arrayContaining(['Bonificadores', 'Lo que da el extra', 'Extras', 'Habilidades']));
        expect(filas('Bonificadores')).toEqual(['Fuerza · +4', 'Constitución · +4', 'CA · -2', 'Armadura natural · +1']);
        expect(texto()).toContain('Da CA');
        expect(texto()).toContain('Da velocidad');
        expect(texto()).not.toContain('Da RD');
        expect(filas('Extras')).toEqual(['Fuego · orden 1', 'Frío · orden 2']);
        // Con un especial que usa extra, el extra 0 de la habilidad es «Elegir».
        expect(filas('Habilidades')).toEqual(['Trepar (Elegir) · 1 rango']);
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('no enseña lo que viene vacío', () => {
        component.especial = furia({
            Descripcion: '',
            Extra: false,
            Repetible: false,
            Repite_combinacion: false,
            Caracteristica: { Id: 0, Nombre: '' },
            Subtipo: { Id: 0, Nombre: '' },
            Bonificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0, CA: 0, Armadura_natural: 0, RD: 0, Tamano_pasos: 0 },
            Flags_extra: { No_aplica: true, Da_CA: false, Da_armadura_natural: false, Da_RD: false, Da_velocidad: false },
            Extras: [],
            Habilidades: [],
        });
        fixture.detectChanges();
        expect(etiquetasDatos()).toEqual([]);
        expect(titulos()).toEqual([]);
        expect(etiquetasCabecera()).toEqual(['Oficial']);
    });
});
