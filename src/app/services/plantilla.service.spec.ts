import { normalizePlantilla } from './utils/plantilla-mapper';
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
            Tipo_nuevo_comodin: null,
            Opcional: 1,
        }]);
    });

    it('lee las aptitudes raciales y los ataques especiales con sus DG, y el comodín del extra de las habilidades', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            Raciales: [{ Racial: { Id: 21, Nombre: 'Resistencia al frío', Descripcion: 'Resiste 5.' }, Dg: 4 }],
            Ataques_especiales: [{ Racial: { Id: 22, Nombre: 'Aura de miedo' }, Dg: 0 }],
            Habilidades: [{ Id_habilidad: 30, Habilidad: 'Saber', Extra: null, Extra_comodin: 'elegir', Rangos: 2 }],
        }));

        expect(plantilla.Raciales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Racial.Descripcion, item.Dg]))
            .toEqual([[21, 'Resistencia al frío', 'Resiste 5.', 4]]);
        expect(plantilla.Ataques_especiales.map((item) => [item.Racial.Nombre, item.Dg])).toEqual([['Aura de miedo', 0]]);
        expect(plantilla.Habilidades[0].Extra_comodin).toBe('elegir');
        // Sin ellas, listas vacías.
        expect(normalizePlantilla(createPlantillaRaw()).Raciales).toEqual([]);
    });

    it('lee de la caché de la RTDB los raciales, los ataques especiales y el comodín de las habilidades (Plantillas 8)', () => {
        // Como lo escribe el backend: el racial normalizado, sin las listas vacías ni las claves a null (la RTDB no las guarda).
        const plantilla = normalizePlantilla(createPlantillaRaw({
            Raciales: [{
                Racial: {
                    Id: 8, Nombre: "Visión en la oscuridad 60'", Descripcion: 'En blanco y negro.', Oficial: true, Origen: '',
                    Opcional: 0, Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                },
                Dg: 0,
            }],
            Ataques_especiales: [{ Racial: { Id: 128, Nombre: 'Castigar al mal (celestial)', Oficial: true }, Dg: 4 }],
            Habilidades: [
                { Id_habilidad: 32, Habilidad: 'Saber', Id_extra: 0, Extra: 'Elegir', Extra_comodin: 'elegir', Rangos: 4 },
                { Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: 0, Extra: '', Rangos: 8 },
            ],
        }));

        expect(plantilla.Raciales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Racial.Descripcion, item.Dg]))
            .toEqual([[8, "Visión en la oscuridad 60'", 'En blanco y negro.', 0]]);
        expect(plantilla.Raciales[0].Racial.Dotes).toEqual([]);
        expect(plantilla.Ataques_especiales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Dg]))
            .toEqual([[128, 'Castigar al mal (celestial)', 4]]);
        expect(plantilla.Habilidades.map((h) => h.Extra_comodin)).toEqual(['elegir', null]);
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
            Tipo_nuevo_comodin: null,
            Opcional: 1,
        }]);
    });
});
