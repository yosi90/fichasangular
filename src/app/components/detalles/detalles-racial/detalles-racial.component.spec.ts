import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallesRacialComponent } from './detalles-racial.component';
import { normalizeRacial } from 'src/app/services/utils/racial-mapper';

describe('DetallesRacialComponent', () => {
    let component: DetallesRacialComponent;
    let fixture: ComponentFixture<DetallesRacialComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesRacialComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesRacialComponent);
        component = fixture.componentInstance;
        component.racial = normalizeRacial({
            Id: 9,
            Nombre: 'Sangre antigua',
            Descripcion: 'Descripcion de prueba',
            Dotes: [{ Id_dote: 4, Dote: 'Alerta', Id_extra: -1, Extra: 'No aplica' }],
            Habilidades: {
                Base: [{ Habilidad: 'Avistar', Bono: 2 }],
                Custom: [{ Habilidad: 'Custom test', Bono: 1 }],
            },
            Caracteristicas: [{ Caracteristica: 'Sabiduria', Valor: 2 }],
            Salvaciones: [{ Salvacion: 'Voluntad', Valor: 1 }],
            Sortilegas: [{ Conjuro: { Id: 12, Nombre: 'Luz' }, Nivel_lanzador: '1', Usos_diarios: '3/dia' }],
            Ataques: [{ Descripcion: 'Mordisco 1d6' }],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: {
                raza: [{ raza: 'Elfo' }],
                caracteristica: [{ caracteristica: 'Inteligencia', cantidad: 13 }],
            },
        });
    });

    it('renderiza secciones del nuevo contrato racial', () => {
        fixture.detectChanges();
        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Dotes');
        expect(html).toContain('Habilidades base');
        expect(html).toContain('Habilidades custom');
        expect(html).toContain('Sortilegas');
        expect(html).toContain('Prerrequisitos');
    });

    it('emite navegación por id para dotes y conjuros', () => {
        const doteSpy = spyOn(component.doteDetallesId, 'emit');
        const conjuroSpy = spyOn(component.conjuroDetallesId, 'emit');

        component.emitirDote(4);
        component.emitirConjuro(12);

        expect(doteSpy).toHaveBeenCalledWith(4);
        expect(conjuroSpy).toHaveBeenCalledWith(12);
    });
});
