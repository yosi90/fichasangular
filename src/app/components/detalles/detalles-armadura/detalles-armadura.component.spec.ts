import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaduraComponent } from './detalles-armadura.component';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { crearArmaduraApi, crearRodelaApi } from 'src/testing/equipo-api';

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
        component.armadura = normalizeArmadura(crearArmaduraApi({
            Id: 1,
            Descripcion: 'Protección sólida.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 87 },
            Peso_armadura: { Id: 3, Nombre: 'Pesada' },
            Encantamientos: [{ Id: 1, Nombre: 'Resistente', Descripcion: 'Protección adicional.', Modificador: 2, Coste: 4000 }],
        }));
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

    it('enseña la velocidad y la Destreza máxima', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Destreza máxima +2');
        expect(text).toContain('20 pies (de 30)');
    });

    it('un escudo sin límite de Destreza enseña «Sin límite» y su tipo de escudo', () => {
        component.armadura = normalizeArmadura(crearRodelaApi());
        fixture.detectChanges();
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(component.armadura.Bon_des).toBeNull();
        expect(text).toContain('Destreza máxima Sin límite');
        expect(text).toContain('Broquel');
        expect(text).not.toContain('Tipo_armadura');
    });
});
