import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaComponent } from './detalles-arma.component';

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
        component.arma = {
            Id: 1,
            Nombre: 'Espada larga',
            Descripcion: 'Hoja versátil.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 123 },
            Dano: '1d8',
            Tipo_dano: { Id: 1, Nombre: 'Cortante' },
            Tipo_arma: { Id: 2, Nombre: 'Marcial' },
            Precio: 15,
            Material: { Id: 3, Nombre: 'Acero' },
            Tamano: { Id: 4, Nombre: 'Mediano' },
            Peso: 4,
            Critico: '19-20/x2',
            Incremento_distancia: 0,
            Oficial: true,
            Encantamientos: [{
                Id: 1,
                Nombre: 'Afilada',
                Descripcion: 'Mejora el filo.',
                Modificador: 1,
                Coste: 2000,
                Tipo: 2,
            }],
        };
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
});
