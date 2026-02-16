import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { FichaPersonajeService } from 'src/app/services/ficha-personaje.service';
import { DetallesPersonajeComponent } from './detalles-personaje.component';

describe('DetallesPersonajeComponent', () => {
    let component: DetallesPersonajeComponent;
    let fixture: ComponentFixture<DetallesPersonajeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesPersonajeComponent],
            providers: [
                {
                    provide: FichaPersonajeService,
                    useValue: {
                        generarPDF: () => undefined,
                        generarPDF_Conjuros: () => undefined,
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesPersonajeComponent);
        component = fixture.componentInstance;
        component.pj = new NuevoPersonajeService().PersonajeCreacion;
    });

    it('muestra botón Generar pdf por defecto', () => {
        fixture.detectChanges();

        const botones = fixture.debugElement.queryAll(By.css('button'));
        const existeBoton = botones.some((btn) => `${btn.nativeElement.textContent ?? ''}`.includes('Generar pdf'));
        expect(existeBoton).toBeTrue();
    });

    it('oculta botón Generar pdf cuando mostrarBotonGenerarPdf es false', () => {
        component.mostrarBotonGenerarPdf = false;
        fixture.detectChanges();

        const botones = fixture.debugElement.queryAll(By.css('button'));
        const existeBoton = botones.some((btn) => `${btn.nativeElement.textContent ?? ''}`.includes('Generar pdf'));
        expect(existeBoton).toBeFalse();
    });

    it('oculta datos básicos faltantes por defecto', () => {
        component.pj.Genero = 'Sin genero';
        component.pj.Deidad = 'No tener deidad';
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Sin genero');
        expect(html).not.toContain('Deidad No tener deidad');
    });

    it('no renderiza el bloque "No tiene clase"', () => {
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('No tiene clase');
    });

    it('oculta contexto y personalidad de fallback semántico', () => {
        component.pj.Contexto = 'Eres totalmente antirol hijo mio.';
        component.pj.Personalidad = 'Rellena un fisco puto vago.';
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Contexto');
        expect(html).not.toContain('Personalidad');
    });

    it('activa modo compacto cuando el ancho del host es estrecho', () => {
        spyOn(component['hostElement'].nativeElement, 'querySelector').and.returnValue({
            getBoundingClientRect: () => ({
                width: 900,
                height: 500,
                top: 0,
                left: 0,
                right: 900,
                bottom: 500,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }),
        } as any);

        component['actualizarModoCompacto']();
        expect(component.modoCompactoLayout).toBeTrue();
    });

    it('desactiva modo compacto cuando el ancho disponible es amplio', () => {
        spyOn(component['hostElement'].nativeElement, 'querySelector').and.returnValue({
            getBoundingClientRect: () => ({
                width: 1100,
                height: 500,
                top: 0,
                left: 0,
                right: 1100,
                bottom: 500,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }),
        } as any);

        component['actualizarModoCompacto']();
        expect(component.modoCompactoLayout).toBeFalse();
    });

    it('muestra edad, altura, peso y madurez en la sección de raza', () => {
        component.pj.Raza.Nombre = 'Elfo';
        component.pj.Raza.Edad_adulto = 110;
        component.pj.Raza.Edad_mediana = 175;
        component.pj.Raza.Edad_viejo = 263;
        component.pj.Raza.Edad_venerable = 350;
        component.pj.Edad = 180;
        component.pj.Altura = 1.84;
        component.pj.Peso = 73;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Edad 180 años');
        expect(html).toContain('Altura 1.84 m');
        expect(html).toContain('Peso 73 kg');
        expect(html).toContain('Madurez Mediana edad');
        expect(html).toContain('Fue/Des/Con -1');
        expect(html).toContain('Int/Sab/Car +1');
    });

    it('muestra subtipos válidos y oculta placeholders', () => {
        component.pj.Raza.Nombre = 'Aasimar';
        component.pj.Subtipos = [
            { Nombre: 'Angelical' },
            { Nombre: 'Placeholder' },
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Subtipos');
        expect(html).toContain('Angelical');
        expect(html).not.toContain('Placeholder');
    });

    it('calcula madurez venerable y modificadores de edad como en C#', () => {
        component.pj.Edad = 95;
        component.pj.Raza.Edad_mediana = 40;
        component.pj.Raza.Edad_viejo = 60;
        component.pj.Raza.Edad_venerable = 80;

        const madurez = component.madurezEdad;
        expect(madurez.id).toBe(3);
        expect(madurez.nombre).toBe('Venerable');
        expect(madurez.modFisico).toBe(-6);
        expect(madurez.modMental).toBe(3);
    });

    it('emite referencia estructurada al abrir detalle racial', () => {
        const emitSpy = spyOn(component.racialDetallesPorNombre, 'emit');
        component.verDetallesRacialPorNombre({ id: 15, nombre: 'Sangre antigua' });
        expect(emitSpy).toHaveBeenCalledWith({ id: 15, nombre: 'Sangre antigua' });
    });
});
