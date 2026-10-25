import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaComponent } from './detalles-arma.component';
import { normalizeArma } from 'src/app/services/arma.service';
import { crearArmaApi } from 'src/testing/equipo-api';

describe('DetallesArmaComponent', () => {
    let component: DetallesArmaComponent;
    let fixture: ComponentFixture<DetallesArmaComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesArmaComponent],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNavSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesArmaComponent);
        component = fixture.componentInstance;
        component.arma = normalizeArma(crearArmaApi({
            Id: 1,
            Nombre: 'Espada larga',
            Descripcion: 'Hoja versátil.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 123 },
            Dano: '1d8',
            Dano_pequeno: '1d6',
            Dano_mediano: '1d8',
            Tipo_dano: { Id: 1, Nombre: 'Cortante' },
            Tipo_arma: { Id: 2, Nombre: 'Marcial' },
            Manejo: { Id: 3, Nombre: 'A una mano' },
            Arrojadiza: false,
            Precio: 15,
            Peso: 4,
            Incremento_distancia: 0,
            Propiedades: [{ Id: 2, Nombre: 'Desarmar', Descripcion: 'Ayuda a desarmar.', Valor: 2 }],
            Encantamientos: [{ Id: 1, Nombre: 'Afilada', Descripcion: 'Mejora el filo.', Modificador: 1, Coste: 2000 }],
        }));
        fixture.detectChanges();
    });

    it('renderiza los datos principales del arma', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Espada larga');
        expect(text).toContain('Marcial');
        expect(text).toContain('Cortante');
        expect(text).toContain('1d8');
        expect(text).toContain('Afilada');
    });

    it('abre el detalle del manual', () => {
        component.abrirDetalleManual();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });

    it('enseña el manejo, el daño Pequeño y Mediano, el crítico y las propiedades', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('A una mano');
        expect(text).toContain('Pequeño 1d6');
        expect(text).toContain('Mediano 1d8');
        expect(text).toContain('Crítico 19-20/x2');
        expect(text).toContain('Desarmar +2');
    });

    it('sin dado ni crítico (un rayo) no enseña daño ni crítico', () => {
        component.arma = normalizeArma(crearArmaApi({ Nombre: 'Rayo', Dano: null, Dano_pequeno: null, Dano_mediano: null, Critico: null, Critico_rango: null, Critico_multiplicador: null, Manejo: null }));
        fixture.detectChanges();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Rayo');
        expect(text).not.toContain('Daño');
        expect(text).not.toContain('Crítico');
    });

    it('abre la munición que dispara', () => {
        const emitSpy = spyOn(component.municionDetallesId, 'emit');
        component.arma = normalizeArma(crearArmaApi({ Municion: { Id: 1, Nombre: 'Flechas' } }));
        component.abrirMunicion();
        expect(emitSpy).toHaveBeenCalledWith(1);
    });
});
