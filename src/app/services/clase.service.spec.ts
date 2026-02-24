import { normalizeClase } from './clase.service';

describe('ClaseService normalizeClase', () => {
    function crearRawNivel(overrides?: Record<string, any>): Record<string, any> {
        return {
            Nivel: 1,
            Ataque_base: '+0',
            Salvaciones: {
                Fortaleza: '+0',
                Reflejos: '+0',
                Voluntad: '+0',
            },
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: {},
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
            ...overrides,
        };
    }

    function crearRawClaseConNivel(nivel: Record<string, any>): Record<string, any> {
        return {
            Id: 1,
            Nombre: 'Clase test',
            Conjuros: {},
            Desglose_niveles: [nivel],
            Prerrequisitos: {},
            Prerrequisitos_flags: {},
        };
    }

    it('normaliza nivel_max_poder_accesible_nivel_lanzadorPsionico desde el campo canonico', () => {
        const raw = crearRawClaseConNivel(crearRawNivel({
            nivel_max_poder_accesible_nivel_lanzadorPsionico: 3,
        }));

        const clase = normalizeClase(raw);

        expect(clase.Desglose_niveles[0].Nivel_max_poder_accesible_nivel_lanzadorPsionico).toBe(3);
    });

    it('no usa el campo legado Nivel_max_conjuro y mantiene -1 por defecto', () => {
        const raw = crearRawClaseConNivel(crearRawNivel({
            Nivel_max_conjuro: 4,
        }));

        const clase = normalizeClase(raw);

        expect(clase.Desglose_niveles[0].Nivel_max_poder_accesible_nivel_lanzadorPsionico).toBe(-1);
    });

    it('normaliza puede_elegir_especialidad desde el nuevo campo', () => {
        const clase = normalizeClase({
            ...crearRawClaseConNivel(crearRawNivel()),
            Conjuros: {
                puede_elegir_especialidad: true,
            },
        });

        expect(clase.Conjuros.puede_elegir_especialidad).toBeTrue();
    });

    it('mantiene compatibilidad de cache con el campo legado Escuela', () => {
        const clase = normalizeClase({
            ...crearRawClaseConNivel(crearRawNivel()),
            Conjuros: {
                Escuela: 1,
            },
        });

        expect(clase.Conjuros.puede_elegir_especialidad).toBeTrue();
    });
});
