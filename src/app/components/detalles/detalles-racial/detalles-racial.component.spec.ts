import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { normalizeRacial } from 'src/app/services/utils/racial-mapper';
import { DetallesRacialComponent } from './detalles-racial.component';

describe('DetallesRacialComponent', () => {
    let component: DetallesRacialComponent;
    let fixture: ComponentFixture<DetallesRacialComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`.replace(/\s+/g, ' ');
    const titulos = (): string[] =>
        Array.from(elemento().querySelectorAll('.ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());
    const enlace = (nombre: string): HTMLButtonElement =>
        Array.from(elemento().querySelectorAll('button.ficha-enlace'))
            .find((b) => `${b.textContent ?? ''}`.trim() === nombre) as HTMLButtonElement;

    /** Un racial completo, con la forma de `RacialDetalle` del contrato. */
    function sangreAntigua(extra: object = {}): any {
        return normalizeRacial({
            Id: 9,
            Nombre: 'Sangre antigua',
            Descripcion: 'Descripcion de prueba',
            Oficial: true,
            Dotes: [
                { Id_dote: 4, Dote: 'Alerta', Id_extra: -1, Extra: 'No aplica' },
                { Id_dote: 5, Dote: 'Soltura con un arma', Id_extra: 2, Extra: 'Espada larga' },
            ],
            Habilidades: {
                Base: [{ Id_habilidad: 3, Habilidad: 'Avistar', Id_extra: -1, Extra: null, Rangos: 2, Se_considera_clasea: true, Condicion: 'De noche' }],
                Custom: [{ Id_habilidad: 1, Habilidad: 'Custom test', Id_extra: -1, Extra: null, Rangos: 1, Se_considera_clasea: false }],
            },
            Caracteristicas: [{ Id_caracteristica: 5, Caracteristica: 'Sabiduria', Cantidad: 2 }],
            Salvaciones: [{ Id_salvacion: 3, Salvacion: 'Voluntad', Cantidad: 1, Condicion: 'Contra encantamientos' }],
            Sortilegas: [{ Conjuro: { Id: 12, Nombre: 'Luz' }, Nivel_lanzador: '1', Usos_diarios: '3/dia' }],
            Ataques: [{ Descripcion: 'Mordisco 1d6' }],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: {
                raza: [{ Id_raza: 2, Raza: 'Elfo', Frase: 'Elfo' }],
                caracteristica: [{ Id_caracteristica: 4, Caracteristica: 'Inteligencia', Cantidad: 13, Opcional: 0, Frase: 'Inteligencia 13' }],
            },
            ...extra,
        });
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesRacialComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesRacialComponent);
        component = fixture.componentInstance;
        component.racial = sangreAntigua();
        fixture.detectChanges();
    });

    it('enseña la cabecera, la descripción y cada lista siempre a la vista', () => {
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Racial');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Sangre antigua');
        expect(titulos()).toEqual(['Descripción', 'Prerrequisitos', 'Características', 'Salvaciones', 'Habilidades', 'Dotes', 'Aptitudes sortílegas', 'Ataques']);
        expect(texto()).toContain('Descripcion de prueba');
        expect(texto()).toContain('Mordisco 1d6');
        expect(elemento().querySelector('mat-chip')).toBeNull();
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
    });

    it('enseña los bonificadores con signo y sus condiciones, sin ids ni claves técnicas', () => {
        const filas = Array.from(elemento().querySelectorAll('.ficha-pares tr'))
            // Cada nodo de la celda por separado: el nombre y cada nota, que van en su propia línea.
            .map((fila) => Array.from(fila.querySelectorAll('td')).map((td) => Array.from(td.childNodes)
                .filter((nodo) => nodo.nodeType !== Node.COMMENT_NODE)
                .map((nodo) => `${nodo.textContent ?? ''}`.trim()).filter(Boolean).join(' ')));
        expect(filas).toContain(['Sabiduria', '+2']);
        expect(filas).toContain(['Voluntad Contra encantamientos', '+1']);
        expect(filas).toContain(['Avistar De noche Se considera de clase', '+2']);
        expect(filas).toContain(['Custom test', '+1']);
        expect(texto()).not.toContain('Id_');
        expect(texto()).not.toContain('Id habilidad');
        expect(texto()).not.toContain('|');
    });

    it('enseña el extra de la dote solo si es visible y la sortílega con su nivel de lanzador y usos', () => {
        expect(texto()).toContain('Soltura con un arma (Espada larga)');
        expect(texto()).not.toContain('No aplica');
        expect(texto()).toContain('Luz · Nivel de lanzador 1 · Usos: 3/dia');
    });

    it('las dotes y las sortílegas son enlaces a su detalle', () => {
        const doteSpy = spyOn(component.doteDetallesId, 'emit');
        const conjuroSpy = spyOn(component.conjuroDetallesId, 'emit');

        enlace('Alerta').click();
        enlace('Luz').click();

        expect(doteSpy).toHaveBeenCalledWith(4);
        expect(conjuroSpy).toHaveBeenCalledWith(12);
    });

    it('enseña la frase de cada prerrequisito y la raza lleva a su detalle', () => {
        const razaSpy = spyOn(component.razaDetallesId, 'emit');
        const condiciones = component.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones);
        const caracteristica = condiciones.find((condicion) => condicion.clave === 'caracteristica')!;

        enlace('Elfo').click();

        expect(texto()).toContain('Inteligencia 13');
        expect(component.esPrerrequisitoNavegable(caracteristica)).toBeFalse();
        expect(razaSpy).toHaveBeenCalledOnceWith(2);
    });

    it('la marca de prerrequisito solo se ve si su condición no viene en los grupos', () => {
        expect(texto()).not.toContain('Requiere raza');

        component.racial = sangreAntigua({ Prerrequisitos: { raza: [], caracteristica: [] } });
        fixture.detectChanges();

        expect(texto()).toContain('Requiere raza');
        expect(texto()).not.toContain('Requiere característica mínima');
    });

    it('no pinta las listas vacías ni la descripción nula', () => {
        component.racial = normalizeRacial({ Id: 3, Nombre: 'Vacío', Descripcion: null, Oficial: false });
        fixture.detectChanges();

        expect(titulos()).toEqual([]);
        expect(elemento().querySelector('.ficha-etiqueta--aviso')?.textContent?.trim()).toBe('Homebrew');
    });
});
