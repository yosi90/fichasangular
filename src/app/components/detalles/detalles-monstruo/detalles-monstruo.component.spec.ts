import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesMonstruoComponent } from './detalles-monstruo.component';

function crearMonstruoMock(partial?: Partial<MonstruoDetalle>): MonstruoDetalle {
    return {
        Id: 1,
        Nombre: 'Lobo terrible',
        Descripcion: 'Descripcion',
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 12 },
        Tipo: { Id: 2, Nombre: 'Bestia', Descripcion: '', Oficial: true },
        Tamano: { Id: 3, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dados_golpe: { Cantidad: '2', Tipo_dado: { Id: 1, Nombre: 'd8' }, Suma: 2 },
        Movimientos: { Correr: 40, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: {
            Id: 0,
            Nombre: '',
            Velocidad_avance: '',
            Flotar: 0,
            Volar_atras: 0,
            Contramarcha: 0,
            Giro: '',
            Rotacion: '',
            Giro_max: '',
            Angulo_ascenso: '',
            Velocidad_ascenso: '',
            Angulo_descenso: '',
            Descenso_ascenso: 0,
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: 'Neutral' },
            Ley: { Id_ley: 1, Nombre: 'Neutral' },
            Moral: { Id_moral: 1, Nombre: 'Neutral' },
            Prioridad: { Id_prioridad: 1, Nombre: 'Neutral' },
            Descripcion: 'Neutral',
        },
        Iniciativa: 2,
        Defensa: {
            Ca: 14,
            Toque: 12,
            Desprevenido: 12,
            Armadura_natural: 2,
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
        },
        Ataque: { Ataque_base: 2, Presa: 3, Ataques: 'Mordisco', Ataque_completo: 'Mordisco' },
        Espacio: 5,
        Alcance: 5,
        Salvaciones: { Fortaleza: 4, Reflejos: 5, Voluntad: 1 },
        Caracteristicas: { Fuerza: 15, Destreza: 13, Constitucion: 14, Inteligencia: 2, Sabiduria: 12, Carisma: 6 },
        Cd_sortilegas: '',
        Valor_desafio: '2',
        Tesoro: 'Ninguno',
        Familiar: false,
        Companero: true,
        Oficial: true,
        Idiomas: [],
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        Sortilegas: [],
        Habilidades: [],
        Dotes: [],
        Niveles_clase: [],
        Subtipos: [],
        Raciales: [],
        Ataques_especiales: [],
        Familiares: [],
        Companeros: [],
        Personajes_relacionados: { Por_familiar: [], Por_companero: [] },
        ...partial,
    };
}

describe('DetallesMonstruoComponent', () => {
    let component: DetallesMonstruoComponent;
    let fixture: ComponentFixture<DetallesMonstruoComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesMonstruoComponent],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNavSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesMonstruoComponent);
        component = fixture.componentInstance;
        component.monstruo = crearMonstruoMock();
    });

    it('emite eventos de navegación principales', () => {
        const conjuroSpy = spyOn(component.conjuroDetallesId, 'emit');
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const racialSpy = spyOn(component.racialDetalles, 'emit');
        const claseSpy = spyOn(component.claseDetallesId, 'emit');
        const subtipoSpy = spyOn(component.subtipoDetalles, 'emit');
        const tipoSpy = spyOn(component.tipoCriaturaDetallesId, 'emit');
        const relacionadoSpy = spyOn(component.monstruoRelacionadoDetalles, 'emit');

        const doteCtx: DoteContextual = {
            Dote: {
                Id: 9,
                Nombre: 'Alerta',
                Descripcion: '',
                Beneficio: '',
                Normal: '',
                Especial: '',
                Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
                Tipos: [],
                Repetible: 0,
                Repetible_distinto_extra: 0,
                Repetible_comb: 0,
                Comp_arma: 0,
                Oficial: true,
                Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
                Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
                Modificadores: {},
                Prerrequisitos: {},
            },
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: 0,
                Id_extra: -1,
                Extra: 'No aplica',
                Origen: 'Catalogo',
            },
        };
        const racial: RacialDetalle = {
            Id: 5,
            Nombre: 'Mordisco mejorado',
            Descripcion: '',
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        };
        const relacionado = crearMonstruoMock({ Id: 4, Nombre: 'Lobo alfa' });

        component.abrirDetallesConjuro(11);
        component.abrirDetallesDote(doteCtx);
        component.abrirDetallesRacial(racial);
        component.abrirDetallesClase(7);
        component.abrirDetallesSubtipo({ Id: 3, Nombre: 'Frio' });
        component.abrirDetallesTipoCriatura(2);
        component.abrirDetallesMonstruoRelacionado(relacionado);

        expect(conjuroSpy).toHaveBeenCalledWith(11);
        expect(doteSpy).toHaveBeenCalledWith(doteCtx);
        expect(racialSpy).toHaveBeenCalledWith(racial);
        expect(claseSpy).toHaveBeenCalledWith(7);
        expect(subtipoSpy).toHaveBeenCalledWith({ Id: 3, Nombre: 'Frio' });
        expect(tipoSpy).toHaveBeenCalledWith(2);
        expect(relacionadoSpy).toHaveBeenCalledWith(relacionado);
    });

    it('abre detalle de manual con referencia normalizada', () => {
        component.abrirDetalleManual();

        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({
            id: 1,
            nombre: 'Manual base',
        });
    });
});
