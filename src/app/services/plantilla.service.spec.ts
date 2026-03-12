import { normalizePlantilla } from './plantilla.service';
import { normalizePlantillaApi } from './utils/plantilla-mapper';

describe('Plantilla mappers', () => {
    function createPlantillaRaw(overrides: any = {}): any {
        return {
            Id: 7,
            Nombre: 'Licantropo',
            Descripcion: 'Detalle canonico',
            Manual: { Id: 1, Nombre: 'MM', Pagina: 10 },
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            Tipo_dado: { Id_tipo_dado: 8, Nombre: 'd8' },
            Actualiza_dg: true,
            Modificacion_dg: { Id_paso_modificacion: 1, Nombre: '+1 categoria' },
            Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: '' },
            Iniciativa: 0,
            Velocidades: '',
            Ca: '',
            Ataque_base: 0,
            Presa: 0,
            Ataques: '',
            Ataque_completo: '',
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
            Modificadores_caracteristicas: {},
            Minimos_caracteristicas: {},
            Ajuste_nivel: 0,
            Licantronia_dg: {},
            Cd: 0,
            Puntos_habilidad: {},
            Nacimiento: false,
            Movimientos: {},
            Maniobrabilidad: {},
            Alineamiento: {},
            Oficial: true,
            Dotes: [],
            Habilidades: [],
            Sortilegas: [],
            Prerrequisitos_flags: {},
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [],
            },
            ...overrides,
        };
    }

    it('normaliza el payload HTTP canonico de plantilla', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            Subtipos: [{ Id: 11, Nombre: 'Humano' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    Id_tipo_comp: 3,
                    Id_tipo_nuevo: 9,
                    Tipo_comp: 'Humanoide',
                    Tipo_nuevo: 'Cambiaformas',
                    Opcional: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
        expect(plantilla.Compatibilidad_tipos).toEqual([{
            Id_tipo_comp: 3,
            Id_tipo_nuevo: 9,
            Tipo_comp: 'Humanoide',
            Tipo_nuevo: 'Cambiaformas',
            Opcional: 1,
        }]);
    });

    it('descarta aliases legacy en el mapper HTTP de plantilla', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            subtipos: [{ Id: 11, Nombre: 'Humano' }],
            Subtipos: [{ i: 12, n: 'Celestial' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    id_tipo_compatible: 3,
                    Id_nuevo: 9,
                    Tipo_compatible: 'Humanoide',
                    nombre_tipo_nuevo: 'Cambiaformas',
                    o: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([]);
        expect(plantilla.Compatibilidad_tipos).toEqual([]);
    });

    it('mantiene compatibilidad legacy en el mapper compartido de plantilla', () => {
        const plantilla = normalizePlantilla(createPlantillaRaw({
            Subtipos: undefined,
            subtipos: [{ i: 12, n: 'Celestial' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    id_tipo_compatible: 3,
                    Id_nuevo: 9,
                    Tipo_compatible: 'Humanoide',
                    nombre_tipo_nuevo: 'Cambiaformas',
                    o: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([{ Id: 12, Nombre: 'Celestial' }]);
        expect(plantilla.Compatibilidad_tipos).toEqual([{
            Id_tipo_comp: 3,
            Id_tipo_nuevo: 9,
            Tipo_comp: 'Humanoide',
            Tipo_nuevo: 'Cambiaformas',
            Opcional: 1,
        }]);
    });
});
