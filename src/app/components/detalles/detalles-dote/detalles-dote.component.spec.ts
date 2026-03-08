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
                competencia_armadura: [{ Id_armadura: 9, Nombre: 'Escudo pesado' }],
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
        component.abrirDetallePrerrequisito('competencia_armadura', { Id_armadura: 9, Nombre: 'Escudo pesado' });
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

    it('oculta inherente de la lista de prerrequisitos visibles', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                inherente: [{ Id_especial: 4, Clase_especial: 'Legado antiguo' }],
                competencia_armadura: [{ Id_armadura: 9, Nombre: 'Escudo pesado' }],
            },
        } as any;

        expect(component.getPrerrequisitosConDatos()).toEqual(['competencia_armadura']);
    });

    it('agrupa prerrequisitos opcionales con el mismo valor como alternativas', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                clase_especial: [
                    { Id_especial: 7, Especial: 'Expulsar o reprender muertos vivientes', Extra: 'Nada', Opcional: 1 },
                    { Id_especial: 8, Especial: 'Expulsar muertos vivientes', Extra: 'Nada', Opcional: 1 },
                ],
                habilidad: [
                    { Id_habilidad: 4, Habilidad: 'Concentracion', Rangos: 8, Opcional: 0 },
                ],
            },
        } as any;

        const grupos = component.getPrerrequisitosAgrupados();

        expect(grupos.length).toBe(2);
        expect(grupos[0].titulo).toBe('Obligatorios');
        expect(grupos[0].condiciones.length).toBe(1);
        expect(grupos[0].condiciones[0].familiaEtiqueta).toBe('Tener estos rangos en habilidad');
        expect(grupos[1].titulo).toBe('Eleccion A');
        expect(grupos[1].opcional).toBeTrue();
        expect(grupos[1].descripcion).toContain('Basta con una');
        expect(grupos[1].condiciones.length).toBe(2);
        expect(grupos[1].condiciones.every((condicion) => condicion.familiaEtiqueta === 'Tener este especial de clase')).toBeTrue();
        expect(grupos[1].condiciones[0].campos.some((campo) => campo.etiqueta === 'Especial de clase')).toBeTrue();
        expect(grupos[1].condiciones[0].campos.some((campo) => campo.etiqueta === 'Opcional')).toBeFalse();
        expect(grupos[1].condiciones[0].campos.some((campo) => campo.etiqueta === 'Extra')).toBeFalse();
    });

    it('resume caracteristica y dote sin repetir etiquetas internas', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                caracteristica: [{ Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0 }],
                dote: [{ Dote_prerrequisito: 'Ataque poderoso', Opcional: 0 }],
            },
        } as any;

        const grupos = component.getPrerrequisitosAgrupados();
        const chipsCaracteristica = component.getTextosCondicionPrerrequisito(grupos[0].condiciones[0]);
        const chipsDote = component.getTextosCondicionPrerrequisito(grupos[0].condiciones[1]);

        expect(grupos[0].condiciones[0].familiaEtiqueta).toBe('Tener esta característica mínima');
        expect(chipsCaracteristica).toEqual(['Fuerza 13']);
        expect(grupos[0].condiciones[1].familiaEtiqueta).toBe('Tener esta dote');
        expect(chipsDote).toEqual(['Ataque poderoso']);
    });
});
