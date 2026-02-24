import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clase } from 'src/app/interfaces/clase';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesClaseComponent } from './detalles-clase.component';

function crearClaseMock(partial?: Partial<Clase>): Clase {
    return {
        Id: 1,
        Nombre: 'Clase test',
        Descripcion: 'Descripcion',
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 10 },
        Tipo_dado: { Id: 1, Nombre: 'd8' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Mod_salv_conjuros: '',
        Conjuros: {
            Dependientes_alineamiento: false,
            Divinos: false,
            Arcanos: false,
            Psionicos: false,
            Alma: false,
            Conocidos_total: false,
            Conocidos_nivel_a_nivel: false,
            Dominio: false,
            puede_elegir_especialidad: false,
            Lanzamiento_espontaneo: false,
            Clase_origen: { Id: 0, Nombre: '' },
            Listado: [],
        },
        Roles: { Dps: false, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: false,
        Prestigio: false,
        Tiene_prerrequisitos: false,
        Alineamiento: {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' },
            Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
            Descripcion: '',
        },
        Oficial: true,
        Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Habilidades: { Base: [], Custom: [] },
        Idiomas: [],
        Desglose_niveles: [{
            Nivel: 1,
            Ataque_base: '+0',
            Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: {},
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
        }],
        Prerrequisitos_flags: {},
        Prerrequisitos: {
            subtipo: [],
            caracteristica: [],
            dg: [],
            dominio: [],
            nivel_escuela: [],
            ataque_base: [],
            reserva_psionica: [],
            lanzar_poder_psionico_nivel: [],
            conocer_poder_psionico: [],
            genero: [],
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            dote_elegida: [],
            rangos_habilidad: [],
            idioma: [],
            alineamiento_requerido: [],
            alineamiento_prohibido: [],
            actitud_requerido: [],
            actitud_prohibido: [],
            lanzador_arcano: [],
            lanzador_divino: [],
            lanzar_conjuros_arcanos_nivel: [],
            lanzar_conjuros_divinos_nivel: [],
            conjuro_conocido: [],
            inherente: [],
            clase_especial: [],
            tamano_maximo: [],
            tamano_minimo: [],
            raza: [],
            no_raza: [],
        },
        ...partial,
    };
}

describe('DetallesClaseComponent', () => {
    let component: DetallesClaseComponent;
    let fixture: ComponentFixture<DetallesClaseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesClaseComponent],
            providers: [{
                provide: ManualDetalleNavigationService,
                useValue: { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') },
            }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesClaseComponent);
        component = fixture.componentInstance;
    });

    it('muestra la columna de nivel max poder accesible cuando hay datos psionicos', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 7,
                Reserva_psionica: 3,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        fixture.detectChanges();

        const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(component.mostrarNivelMaxPoderAccesible).toBeTrue();
        expect(texto).toContain('Nivel max poder accesible');
        expect(texto).toContain('7');
    });

    it('oculta la columna de nivel max poder accesible cuando no hay datos psionicos', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        fixture.detectChanges();

        const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(component.mostrarNivelMaxPoderAccesible).toBeFalse();
        expect(texto).not.toContain('Nivel max poder accesible');
    });
});
