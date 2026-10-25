import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesDoteComponent } from './detalles-dote.component';

describe('DetallesDoteComponent', () => {
    let component: DetallesDoteComponent;
    let fixture: ComponentFixture<DetallesDoteComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesDoteComponent],
            providers: [
                {
                    provide: ManualDetalleNavigationService,
                    useValue: { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesDoteComponent);
        component = fixture.componentInstance;
        component.dote = {
            Id: 1,
            Nombre: 'Competencia marcial',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
            Tipos: [],
            Repetible: false,
            Repetible_distinto_extra: false,
            Repetible_comb: false,
            Comp_arma: true,
            Oficial: true,
            Descripcion: 'Descripcion',
            Beneficio: '',
            Normal: '',
            Especial: '',
            Modificadores: {},
            Extras_soportados: {
                Extra_arma: 1,
                Extra_armadura: 0,
                Extra_armadura_armaduras: 0,
                Extra_armadura_escudos: 1,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [{ Id: 7, Nombre: 'Espada larga' }],
                Armaduras: [{ Id: 9, Nombre: 'Escudo pesado', Es_escudo: true } as any],
                Escuelas: [],
                Habilidades: [],
            },
            Prerrequisitos: {
                competencia_armadura: [{ Id_armadura: 9, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            } as any,
        } as any;
        fixture.detectChanges();
    });

    it('emite detalle de arma desde extras', () => {
        const spy = spyOn(component.armaDetallesId, 'emit');
        component.abrirDetalleExtra('Armas', { Id: 7, Nombre: 'Espada larga' });
        expect(spy).toHaveBeenCalledWith(7);
    });

    it('emite detalle de armadura desde prerrequisito', () => {
        const spy = spyOn(component.armaduraDetallesId, 'emit');
        const condicion = component.prerrequisitosAgrupados[0].condiciones[0];
        expect(component.esPrerrequisitoNavegable(condicion)).toBeTrue();
        component.abrirDetallePrerrequisito(condicion);
        expect(spy).toHaveBeenCalledWith(9);
    });

    it('no muestra la chip general de competencia y la sitúa en extras de escudos', () => {
        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Competencia de arma');
        expect(html).toContain('Escudos');
        expect(html).toContain('Requiere competencia');
    });

    it('marca que solo armas y escudos requieren competencia contextual', () => {
        expect(component.bloqueExtraRequiereCompetencia('Escudos')).toBeTrue();
        expect(component.bloqueExtraRequiereCompetencia('Armas')).toBeTrue();
        expect(component.bloqueExtraRequiereCompetencia('Armaduras')).toBeFalse();
    });

    it('enseña la aptitud especial con su frase, como los demás prerrequisitos', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                aptitud_especial: [{ Id_aptitud_especial: 10, Aptitud_especial: 'Alas', Raciales: [{ Id: 41, Nombre: 'Aspecto de dragón (Alas)' }], Especiales: [{ Id: 1631, Nombre: 'Alas' }], Plantillas: [], Opcional: 0, Frase: 'Alas' }],
                competencia_armadura: [{ Id_armadura: 9, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            },
        } as any;

        const frases = component.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones.map((c) => c.frase));
        expect(frases).toEqual(['Alas', 'Competencia con escudo pesado']);
    });

    it('enseña la frase de la API y agrupa las alternativas por Opcional', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                clase_especial: [
                    { Id_especial: 7, Especial: 'Expulsar o reprender muertos vivientes', Id_extra: null, Extra: null, Extra_comodin: null, Opcional: 1, Frase: 'Expulsar o reprender muertos vivientes' },
                    { Id_especial: 8, Especial: 'Expulsar muertos vivientes', Id_extra: null, Extra: null, Extra_comodin: null, Opcional: 1, Frase: 'Expulsar muertos vivientes' },
                ],
                habilidad: [
                    { Id_habilidad: 4, Habilidad: 'Concentración', Cantidad: 8, Opcional: 0, Frase: 'Concentración 8 rangos' },
                ],
                dote: [
                    { Id_dote_prerrequisito: 4, Dote_prerrequisito: 'Soltura con un arma', Id_extra: 0, Extra: null, Extra_comodin: 'elegir', Repetido: 0, Opcional: 0, Frase: 'Soltura con un arma (el arma elegida)' },
                ],
            },
        } as any;
        fixture.detectChanges();

        const grupos = component.prerrequisitosAgrupados;
        expect(grupos.length).toBe(2);
        expect(grupos[0].titulo).toBe('Obligatorios');
        expect(grupos[0].condiciones.map((c) => c.frase)).toEqual(['Concentración 8 rangos', 'Soltura con un arma (el arma elegida)']);
        expect(grupos[1].titulo).toBe('Elección A');
        expect(grupos[1].opcional).toBeTrue();
        expect(grupos[1].descripcion).toContain('Basta con una');
        expect(grupos[1].condiciones.map((c) => c.frase)).toEqual(['Expulsar o reprender muertos vivientes', 'Expulsar muertos vivientes']);

        const texto = `${fixture.nativeElement.textContent ?? ''}`;
        expect(texto).toContain('Soltura con un arma (el arma elegida)');
        expect(texto).not.toContain('Frase');
        expect(texto).not.toContain('Extra:');
    });

    it('sin frase (una caché anterior) enseña el nombre del tipo', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                poder_seleccionar_familiar: [{ Opcional: 0 }],
            },
        } as any;

        expect(component.prerrequisitosAgrupados[0].condiciones[0].frase).toBe('Poder seleccionar familiar');
    });
});
