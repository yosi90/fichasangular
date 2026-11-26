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

    it('lee la caída sin vuelta y lo que pierde al caer (el caballero protector, El combatiente completo, pág. 26)', () => {
        const clase = normalizeClase({ Id: 269, Nombre: 'Caballero protector', Ex: {
            Pierde_magia: false, Requiere_expiacion: false, Especiales: [], Caida_sin_vuelta: true,
            Especiales_caida: [{ Id: 1788, Nombre: 'Luz radiante' }],
        } });
        expect(clase.Ex?.Caida_sin_vuelta).toBeTrue();
        expect(clase.Ex?.Especiales_caida).toEqual([{ Id: 1788, Nombre: 'Luz radiante' }]);
        expect(normalizeClase({ Id: 1, Nombre: 'Sin ex' }).Ex?.Caida_sin_vuelta).toBeFalse();
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

describe('ClaseService normalizeClase: el Mascota de la tabla (el compañero animal, de los datos)', () => {
    it('cómo cuenta la clase para su mascota y de qué lista elige; sin él, null', () => {
        const clase = normalizeClase({
            Id: 6, Nombre: 'Explorador', Desglose_niveles: [{
                Nivel: 4, Especiales: [
                    { Especial: { Id: 29, Nombre: 'Compañero animal', Otorga_companero: true }, Mascota: { Divisor: 2, Ajuste: 0, Lista: { Id: 5, Nombre: 'Druida' }, Po_obtener: 0, Horas_obtener: 24 } },
                    { Especial: { Id: 30, Nombre: 'Rastrear' } },
                ],
            }],
        });
        const [companero, rastrear] = clase.Desglose_niveles[0].Especiales;
        // Con lo que cuesta perderla u obtener otra (tanda (i)): sin dato, null.
        expect(companero.Mascota).toEqual({
            Divisor: 2, Ajuste: 0, Lista: { Id: 5, Nombre: 'Druida' }, Solo_lista_propia: false,
            Px_perdida_por_nivel: null, Cd_perdida: null, Po_obtener: 0, Horas_obtener: 24, Espera_reemplazo: null,
        });
        expect(rastrear.Mascota).toBeNull();
    });

    it('la aptitud de lista propia (R8, tanda 1b): Solo_lista_propia, también en la de un nivel de sustitución', () => {
        const clase = normalizeClase({
            Id: 6, Nombre: 'Explorador', Desglose_niveles: [],
            Sustituciones: [{
                Id: 30, Nombre: 'Explorador kóbold', Clase: { Id: 6, Nombre: 'Explorador' }, Niveles: [{
                    Id: 50, Nivel: 4, Especiales: [{
                        Especial: { Id: 900, Nombre: 'Compañero comadreja terrible', Otorga_companero: true },
                        Mascota: { Divisor: 2, Ajuste: 0, Lista: { Id: 5, Nombre: 'Druida' }, Solo_lista_propia: true },
                    }],
                }],
            }],
        });
        expect(clase.Sustituciones?.[0].Niveles[0].Especiales[0].Mascota?.Solo_lista_propia).toBeTrue();
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
