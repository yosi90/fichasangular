import { of } from 'rxjs';
import { ClaseService, normalizeClase } from './clase.service';
import { simularTokenApi } from 'src/testing/simular-token-api';

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

    it('las dotes y los especiales de un nivel sin extra quedan con Id_extra null y Extra vacío, sin «No aplica»', () => {
        const raw = crearRawClaseConNivel(crearRawNivel({
            Dotes: [{ Dote: { Id: 1 }, Id_extra: null, Extra: null, Extra_comodin: null }],
            Especiales: [
                { Especial: { Id: 1 } },
                { Especial: { Id: 2 }, Id_extra: 110, Extra: 'Elegir', Extra_comodin: 'elegir' },
            ],
        }));

        const nivel = normalizeClase(raw).Desglose_niveles[0];

        expect(nivel.Dotes[0]).toEqual(jasmine.objectContaining({ Id_extra: null, Extra: '', Extra_comodin: null }));
        expect(nivel.Especiales[0]).toEqual(jasmine.objectContaining({ Id_extra: null, Extra: '', Extra_comodin: null }));
        expect(nivel.Especiales[1]).toEqual(jasmine.objectContaining({ Id_extra: 110, Extra: 'Elegir', Extra_comodin: 'elegir' }));
    });

    it('lee la marca Comodin de la clase (la clase 0 «Cualquiera»)', () => {
        expect(normalizeClase({ Id: 0, Nombre: 'Cualquiera', Comodin: 'cualquiera' }).Comodin).toBe('cualquiera');
        expect(normalizeClase({ Id: 3, Nombre: 'Mago' }).Comodin).toBeNull();
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

describe('ClaseService, cabecera de la API', () => {
    it('sin la sesión de Firebase avisa de que hay que iniciar sesión y no llama a la API', async () => {
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        const service = new ClaseService({ currentUser: null } as any, {} as any, http, {} as any);

        await expectAsync(service.crearClase({ Nombre: 'Prueba' } as any))
            .toBeRejectedWithError('Debes iniciar sesión para gestionar clases');
        expect(http.post).not.toHaveBeenCalled();
    });

    it('con sesión manda el token de la API como Bearer', async () => {
        simularTokenApi('token-clase');
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        http.post.and.returnValue(of({ idClase: 7, message: 'ok' }));
        const service = new ClaseService({ currentUser: { uid: 'a' } } as any, {} as any, http, {} as any);

        await service.crearClase({ Nombre: 'Prueba' } as any);

        expect(http.post.calls.argsFor(0)[2].headers).toEqual({ Authorization: 'Bearer token-clase' });
    });
});
