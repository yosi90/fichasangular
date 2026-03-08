import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaduraComponent } from './detalles-armadura.component';

describe('DetallesArmaduraComponent', () => {
    let component: DetallesArmaduraComponent;
    let fixture: ComponentFixture<DetallesArmaduraComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesArmaduraComponent],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNavSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesArmaduraComponent);
        component = fixture.componentInstance;
        component.armadura = {
            Id: 1,
            Nombre: 'Cota de mallas',
            Descripcion: 'Protección sólida.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 87 },
            Ca: 5,
            Bon_des: 2,
            Penalizador: -5,
            Tipo_armadura: { Id: 1, Nombre: 'Pesada' },
            Precio: 150,
            Material: { Id: 1, Nombre: 'Acero' },
            Peso_armadura: { Id: 1, Nombre: 'Pesada' },
            Peso: 20,
            Tamano: { Id: 1, Nombre: 'Mediano' },
            Fallo_arcano: 35,
            Es_escudo: false,
            Oficial: true,
            Encantamientos: [{
                Id: 1,
                Nombre: 'Resistente',
                Descripcion: 'Protección adicional.',
                Modificador: 2,
                Coste: 4000,
                Tipo: 1,
            }],
        };
        fixture.detectChanges();
    });

    it('renderiza los datos principales de la armadura', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Cota de mallas');
        expect(text).toContain('Pesada');
        expect(text).toContain('CA +5');
        expect(text).toContain('Resistente');
    });

    it('abre el detalle del manual', () => {
        component.abrirDetalleManual();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });
});
