import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
                raza: [{ Id_raza: 2, Raza: 'Elfo', Frase: 'Elfo' }],
                caracteristica: [{ Id_caracteristica: 4, Caracteristica: 'Inteligencia', Cantidad: 13, Opcional: 0, Frase: 'Inteligencia 13' }],
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

    it('enseña la frase de cada prerrequisito y navega a la raza pedida', () => {
        const razaSpy = spyOn(component.razaDetallesId, 'emit');

        fixture.detectChanges();
        const html = `${fixture.nativeElement.textContent ?? ''}`;
        const condiciones = component.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones);
        const raza = condiciones.find((condicion) => condicion.clave === 'raza')!;
        const caracteristica = condiciones.find((condicion) => condicion.clave === 'caracteristica')!;
        component.abrirDetallePrerrequisito(raza);
        component.abrirDetallePrerrequisito(caracteristica);

        expect(html).toContain('Elfo');
        expect(html).toContain('Inteligencia 13');
        expect(html).not.toContain('Id_raza');
        expect(html).not.toContain('Caracteristica: Inteligencia');
        expect(component.esPrerrequisitoNavegable(raza)).toBeTrue();
        expect(component.esPrerrequisitoNavegable(caracteristica)).toBeFalse();
        expect(razaSpy).toHaveBeenCalledOnceWith(2);
    });
});
