import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { normalizeRazaApi } from './utils/raza-mapper';
import { RazaService, normalizeAlineamientoRaza, normalizeHabilidadesRaza, normalizeIdiomasRaza, normalizeRazaLegacy } from './raza.service';

describe('RazaService helpers', () => {
    class TestRazaService extends RazaService {
        snapshotFactory: (() => any) | null = null;
        razasSnapshotFactory: (() => any) | null = null;

        protected override watchRazaPath(_id: number, onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.snapshotFactory ? this.snapshotFactory() : null);
            return () => undefined;
        }

        protected override watchRazasPath(onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.razasSnapshotFactory ? this.razasSnapshotFactory() : null);
            return () => undefined;
        }
    }

    function createRazaApiRaw(overrides: any = {}): any {
        return {
            i: 7,
            n: 'Cambiante',
            m: {
                Fuerza: 0,
                Destreza: 2,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            aju: 1,
            ma: 'MM',
            c: 'Explorador',
            o: true,
            an: '',
            t: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            dg: { Cantidad: 1, Dado: 'd8', Tipo_criatura: 'Humanoide' },
            rd: '',
            rc: '',
            re: '',
            he: 0,
            mu: 1,
            tmd: 0,
            pr: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [],
            },
            prf: {
                actitud_prohibido: false,
                actitud_requerido: false,
                alineamiento_prohibido: false,
                alineamiento_requerido: false,
                tipo_criatura: false,
            },
            Mutacion: {
                Es_mutada: true,
                Tamano_dependiente: false,
                Tiene_prerrequisitos: false,
                Heredada: false,
            },
            ant: 0,
            va: 0,
            co: 30,
            na: 0,
            vo: 0,
            man: {},
            tr: 0,
            es: 0,
            ari: 0,
            ars: 0,
            pri: 0,
            prs: 0,
            ea: 18,
            em: 35,
            ev: 53,
            eve: 70,
            esp: 5,
            alc: 5,
            tc: { Id: 3, Nombre: 'Humanoide' },
            sor: [],
            ali: {
                Id: 1,
                Basico: { Id_basico: 1, Nombre: 'Neutral' },
                Ley: { Id_ley: 1, Nombre: 'Neutral' },
                Moral: { Id_moral: 1, Nombre: 'Neutral' },
                Prioridad: { Id_prioridad: 1, Nombre: 'Sin preferencia' },
                Descripcion: '',
            },
            dotes: [],
            rac: [],
            Habilidades: { Base: [], Custom: [] },
            Idiomas: [],
            subtipos: [],
            ...overrides,
        };
    }

    it('normaliza idiomas con aliases y filtra entradas vacías', () => {
        const idiomas = normalizeIdiomasRaza([
            { Id: 1, Nombre: 'Común', Descripcion: 'Base', Secreto: 0, Oficial: 1 },
            { id: 2, nombre: 'Dracónico', descripcion: 'Anciano', secreto: true, oficial: false },
            { Id: 0, Nombre: '   ' },
        ]);

        expect(idiomas.length).toBe(2);
        expect(idiomas[0]).toEqual({
            Id: 1,
            Nombre: 'Común',
            Descripcion: 'Base',
            Secreto: false,
            Oficial: true,
        });
        expect(idiomas[1]).toEqual({
            Id: 2,
            Nombre: 'Dracónico',
            Descripcion: 'Anciano',
            Secreto: true,
            Oficial: false,
        });
    });

    it('normaliza habilidades de raza con aliases y fallback vacío', () => {
        const habilidades = normalizeHabilidadesRaza({
            b: [
                {
                    Id_habilidad: 4,
                    Habilidad: 'Escuchar',
                    Id_caracteristica: 5,
                    Caracteristica: 'Sabiduria',
                    Soporta_extra: true,
                    Entrenada: true,
                    i_ex: 0,
                    x: 'Elegir',
                    Cantidad: 2,
                    Varios: '+2 racial',
                },
            ],
            c: [
                {
                    id: 99,
                    nombre: 'Conocimiento prohibido',
                    idCaracteristica: 4,
                    caracteristica: 'Inteligencia',
                    rangos: 1,
                },
            ],
        });

        expect(habilidades.Base.length).toBe(1);
        expect(habilidades.Custom.length).toBe(1);
        expect(habilidades.Base[0]).toEqual(jasmine.objectContaining({
            Id_habilidad: 4,
            Habilidad: 'Escuchar',
            Soporta_extra: true,
            Entrenada: true,
            Id_extra: 0,
            Extra: 'Elegir',
            Cantidad: 2,
            Varios: '+2 racial',
        }));
        expect(habilidades.Custom[0]).toEqual(jasmine.objectContaining({
            Id_habilidad: 99,
            Habilidad: 'Conocimiento prohibido',
            Cantidad: 1,
            Custom: true,
        }));

        const vacio = normalizeHabilidadesRaza(undefined);
        expect(vacio).toEqual({
            Base: [],
            Custom: [],
        });
    });

    it('normaliza alineamiento parcial con aliases y evita undefined', () => {
        const alineamiento = normalizeAlineamientoRaza({
            b: { n: 'Legal bueno' },
            l: { Nombre: 'Siempre legal' },
            m: { nombre: 'Generalmente bueno' },
        });

        expect(alineamiento.Basico.Nombre).toBe('Legal bueno');
        expect(alineamiento.Ley.Nombre).toBe('Siempre legal');
        expect(alineamiento.Moral.Nombre).toBe('Generalmente bueno');
        expect(alineamiento.Prioridad).toEqual(jasmine.objectContaining({
            Id_prioridad: 0,
            Nombre: '',
        }));
    });

    it('normaliza alineamiento legacy string como Basico.Nombre', () => {
        const alineamiento = normalizeAlineamientoRaza('Neutral autentico');

        expect(alineamiento.Basico.Nombre).toBe('Neutral autentico');
        expect(alineamiento.Ley.Nombre).toBe('');
        expect(alineamiento.Moral.Nombre).toBe('');
        expect(alineamiento.Descripcion).toBe('');
    });

    it('normaliza el contrato HTTP abreviado actual de raza', () => {
        const raza = normalizeRazaApi(createRazaApiRaw({
            subtipos: [{ Id: 11, Nombre: 'Humano' }],
            rac: [{
                Id: 4,
                Nombre: 'Vision en la penumbra',
                Descripcion: 'Ve mejor con poca luz',
                Opcional: 0,
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            }],
        }));

        expect(raza.Id).toBe(7);
        expect(raza.Nombre).toBe('Cambiante');
        expect(raza.Alineamiento.Basico.Nombre).toBe('Neutral');
        expect(raza.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
        expect(raza.Raciales[0].Nombre).toBe('Vision en la penumbra');
    });

    it('normaliza plantillas por subtipo desde contrato HTTP', () => {
        const raza = normalizeRazaApi(createRazaApiRaw({
            Plantillas_por_subtipo: [{
                Subtipo: { Id: 12, Nombre: 'Arconte' },
                Plantillas: [
                    { Id: 20, Nombre: 'Celestial', Descripcion: 'Plantilla heredada' },
                    { Id: 0, Nombre: '   ' },
                ],
            }],
        }));

        expect(raza.Plantillas_por_subtipo).toEqual([{
            Subtipo: { Id: 12, Nombre: 'Arconte' },
            Plantillas: [{ Id: 20, Nombre: 'Celestial', Descripcion: 'Plantilla heredada' }],
        }]);
    });

    it('descarta aliases cache legacy en el mapper HTTP de raza', () => {
        const raza = normalizeRazaApi(createRazaApiRaw({
            i: undefined,
            n: undefined,
            m: undefined,
            ali: undefined,
            subtipos: [{ i: 11, n: 'Humano' }],
            rac: [{ i: 4, n: 'Vision en la penumbra' }],
            Nombre: 'Legacy',
            Modificadores: { Fuerza: 2 },
            Alineamiento: { Basico: { Nombre: 'Legal bueno' } },
            Subtipos: [{ Id: 12, Nombre: 'Celestial' }],
            Raciales: [{ Id: 8, Nombre: 'Legacy racial' }],
            DotesContextuales: [{ Dote: { Nombre: 'Alerta' }, Contexto: { Entidad: 'raza' } }],
        }));

        expect(raza.Id).toBe(0);
        expect(raza.Nombre).toBe('');
        expect(raza.Modificadores.Fuerza).toBe(0);
        expect(raza.Alineamiento.Basico.Nombre).toBe('');
        expect(raza.Subtipos).toEqual([]);
        expect(raza.Raciales[0].Nombre).toBe('');
        expect(raza.DotesContextuales).toEqual([]);
    });

    it('mantiene compatibilidad legacy en el mapper compartido de raza', () => {
        const raza = normalizeRazaLegacy({
            Id: 9,
            Nombre: 'Legacy',
            Modificadores: { Fuerza: 2 },
            Alineamiento: { Basico: { Nombre: 'Legal bueno' } },
            Manual: 'Manual legacy',
            Clase_predilecta: 'Guerrero',
            Oficial: true,
            Ataques_naturales: '',
            Tamano: {},
            Dgs_adicionales: {},
            Reduccion_dano: '',
            Resistencia_magica: '',
            Resistencia_energia: '',
            Heredada: false,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: {},
            Armadura_natural: 0,
            Varios_armadura: 0,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Maniobrabilidad: {},
            Trepar: 0,
            Escalar: 0,
            Altura_rango_inf: 0,
            Altura_rango_sup: 0,
            Peso_rango_inf: 0,
            Peso_rango_sup: 0,
            Edad_adulto: 18,
            Edad_mediana: 35,
            Edad_viejo: 53,
            Edad_venerable: 70,
            Espacio: 5,
            Alcance: 5,
            Tipo_criatura: {},
            Sortilegas: [],
            DotesContextuales: [{ Dote: { Nombre: 'Alerta' }, Contexto: { Entidad: 'raza', Extra: 'No aplica', Id_extra: 0, Id_raza: 9 } }],
            Subtipos: [{ Id: 12, Nombre: 'Celestial' }],
            Raciales: [{ Id: 8, Nombre: 'Legacy racial' }],
            Habilidades: { Base: [], Custom: [] },
            Idiomas: [],
        }, 9);

        expect(raza.Id).toBe(9);
        expect(raza.Nombre).toBe('Legacy');
        expect(raza.Alineamiento.Basico.Nombre).toBe('Legal bueno');
        expect(raza.Subtipos).toEqual([{ Id: 12, Nombre: 'Celestial' }]);
        expect(raza.Raciales[0].Nombre).toBe('Legacy racial');
        expect(raza.DotesContextuales.length).toBe(1);
    });

    it('getRaza usa fallback HTTP canónico cuando la cache RTDB no existe', async () => {
        const rawApi = createRazaApiRaw({
            subtipos: [{ Id: 11, Nombre: 'Humano' }],
        });
        const http = {
            get: jasmine.createSpy().and.returnValue(of(rawApi)),
        };
        const firebaseContextSvc = {
            run: (fn: () => any) => fn(),
        };
        spyOn(Swal, 'fire');

        const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any);
        service.snapshotFactory = () => ({
            exists: () => false,
            val: () => null,
            child: () => ({ val: () => undefined }),
        });

        const observable = await service.getRaza(7);
        const emitted = await firstValueFrom(observable);

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/razas\/7$/));
        expect(emitted.Id).toBe(7);
        expect(emitted.Nombre).toBe('Cambiante');
        expect(emitted.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
    });

    it('getRaza mantiene la ruta legacy de cache cuando RTDB sí tiene dato', async () => {
        const http = {
            get: jasmine.createSpy(),
        };
        const firebaseContextSvc = {
            run: (fn: () => any) => fn(),
        };

        const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any);
        service.snapshotFactory = () => ({
            exists: () => true,
            val: () => ({
                Nombre: 'Legacy cache',
                Modificadores: { Fuerza: 2 },
                Alineamiento: { Basico: { Nombre: 'Legal bueno' } },
                Manual: 'Manual legacy',
                Clase_predilecta: 'Guerrero',
                Oficial: true,
                Ataques_naturales: '',
                Tamano: {},
                Dgs_adicionales: {},
                Reduccion_dano: '',
                Resistencia_magica: '',
                Resistencia_energia: '',
                Heredada: false,
                Mutada: false,
                Tamano_mutacion_dependiente: false,
                Prerrequisitos: {},
                Armadura_natural: 0,
                Varios_armadura: 0,
                Correr: 30,
                Nadar: 0,
                Volar: 0,
                Maniobrabilidad: {},
                Trepar: 0,
                Escalar: 0,
                Altura_rango_inf: 0,
                Altura_rango_sup: 0,
                Peso_rango_inf: 0,
                Peso_rango_sup: 0,
                Edad_adulto: 18,
                Edad_mediana: 35,
                Edad_viejo: 53,
                Edad_venerable: 70,
                Espacio: 5,
                Alcance: 5,
                Tipo_criatura: {},
                Habilidades: { Base: [], Custom: [] },
                Idiomas: [],
            }),
            child: (path: string) => ({
                val: () => {
                    if (path === 'DotesContextuales')
                        return [{ Dote: { Nombre: 'Alerta' }, Contexto: { Entidad: 'raza', Extra: 'No aplica', Id_extra: 0, Id_raza: 7 } }];
                    if (path === 'Subtipos')
                        return [{ Id: 12, Nombre: 'Celestial' }];
                    if (path === 'Raciales')
                        return [{ Id: 8, Nombre: 'Legacy racial' }];
                    return undefined;
                }
            }),
        });

        const observable = await service.getRaza(7);
        const emitted = await firstValueFrom(observable);

        expect(http.get).not.toHaveBeenCalled();
        expect(emitted.Id).toBe(7);
        expect(emitted.Nombre).toBe('Legacy cache');
        expect(emitted.Subtipos).toEqual([{ Id: 12, Nombre: 'Celestial' }]);
        expect(emitted.Raciales[0].Nombre).toBe('Legacy racial');
        expect(emitted.DotesContextuales.length).toBe(1);
    });

    it('getRazas usa fallback HTTP canónico cuando la cache RTDB no existe', async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                createRazaApiRaw({ i: 7, n: 'Cambiante' }),
                createRazaApiRaw({ i: 8, n: 'Draconido', subtipos: [{ Id: 22, Nombre: 'Sangre de dragon' }] }),
            ])),
        };
        const firebaseContextSvc = {
            run: (fn: () => any) => fn(),
        };
        spyOn(Swal, 'fire');

        const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any);
        service.razasSnapshotFactory = () => ({
            exists: () => false,
            forEach: () => undefined,
        });

        const emitted = await firstValueFrom(service.getRazas());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/razas$/));
        expect(emitted.length).toBe(2);
        expect(emitted.map((item) => item.Id)).toEqual([7, 8]);
        expect(emitted[1].Subtipos).toEqual([{ Id: 22, Nombre: 'Sangre de dragon' }]);
    });

    it('getRazas mantiene la ruta legacy de cache cuando RTDB sí tiene datos', async () => {
        const http = {
            get: jasmine.createSpy(),
        };
        const firebaseContextSvc = {
            run: (fn: () => any) => fn(),
        };

        const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any);
        service.razasSnapshotFactory = () => ({
            exists: () => true,
            forEach: (callback: (item: any) => void) => {
                callback({
                    key: '7',
                    val: () => ({
                        Nombre: 'Legacy cache',
                        Modificadores: { Fuerza: 2 },
                        Alineamiento: { Basico: { Nombre: 'Legal bueno' } },
                        Manual: 'Manual legacy',
                        Clase_predilecta: 'Guerrero',
                        Oficial: true,
                        Ataques_naturales: '',
                        Tamano: {},
                        Dgs_adicionales: {},
                        Reduccion_dano: '',
                        Resistencia_magica: '',
                        Resistencia_energia: '',
                        Heredada: false,
                        Mutada: false,
                        Tamano_mutacion_dependiente: false,
                        Prerrequisitos: {},
                        Armadura_natural: 0,
                        Varios_armadura: 0,
                        Correr: 30,
                        Nadar: 0,
                        Volar: 0,
                        Maniobrabilidad: {},
                        Trepar: 0,
                        Escalar: 0,
                        Altura_rango_inf: 0,
                        Altura_rango_sup: 0,
                        Peso_rango_inf: 0,
                        Peso_rango_sup: 0,
                        Edad_adulto: 18,
                        Edad_mediana: 35,
                        Edad_viejo: 53,
                        Edad_venerable: 70,
                        Espacio: 5,
                        Alcance: 5,
                        Tipo_criatura: {},
                        Habilidades: { Base: [], Custom: [] },
                        Idiomas: [],
                    }),
                    child: (path: string) => ({
                        val: () => {
                            if (path === 'DotesContextuales')
                                return [{ Dote: { Nombre: 'Alerta' }, Contexto: { Entidad: 'raza', Extra: 'No aplica', Id_extra: 0, Id_raza: 7 } }];
                            if (path === 'Subtipos')
                                return [{ Id: 12, Nombre: 'Celestial' }];
                            if (path === 'Raciales')
                                return [{ Id: 8, Nombre: 'Legacy racial' }];
                            return undefined;
                        }
                    }),
                });
            }
        });

        const emitted = await firstValueFrom(service.getRazas());

        expect(http.get).not.toHaveBeenCalled();
        expect(emitted.length).toBe(1);
        expect(emitted[0].Id).toBe(7);
        expect(emitted[0].Nombre).toBe('Legacy cache');
        expect(emitted[0].Subtipos).toEqual([{ Id: 12, Nombre: 'Celestial' }]);
        expect(emitted[0].Raciales[0].Nombre).toBe('Legacy racial');
    });

    it('crearRaza envia POST /razas/add con Bearer, sin auditoria, y refresca cache best-effort', async () => {
        const payload = {
            raza: {
                nombre: 'Nueva raza',
                descripcion: 'Descripcion suficiente',
            },
            uid: 'no-debe-ir',
            firebaseUid: 'no-debe-ir',
            createdAt: 'no-debe-ir',
        } as any;
        delete payload.uid;
        delete payload.firebaseUid;
        delete payload.createdAt;

        const http = {
            post: jasmine.createSpy().and.returnValue(of({ message: 'ok', idRaza: '44' })),
            get: jasmine.createSpy().and.returnValue(of(createRazaApiRaw({ i: 44, n: 'Nueva raza' }))),
        };
        const firebaseContextSvc = {
            run: (fn: () => any) => fn(),
        };
        const auth = {
            currentUser: {
                getIdToken: jasmine.createSpy().and.resolveTo('token-firebase'),
            },
        };
        const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any, auth as any);

        const response = await service.crearRaza(payload);

        expect(response).toEqual({ message: 'ok', idRaza: 44 });
        expect(http.post).toHaveBeenCalledWith(
            jasmine.stringMatching(/razas\/add$/),
            payload,
            jasmine.objectContaining({
                headers: jasmine.anything(),
            })
        );
        const postArgs = http.post.calls.mostRecent().args;
        expect(postArgs[2].headers.Authorization).toBe('Bearer token-firebase');
        expect(Object.prototype.hasOwnProperty.call(postArgs[1], 'uid')).toBeFalse();
        expect(Object.prototype.hasOwnProperty.call(postArgs[1], 'firebaseUid')).toBeFalse();
        expect(Object.prototype.hasOwnProperty.call(postArgs[1], 'createdAt')).toBeFalse();
        expect(http.get).toHaveBeenCalledWith(
            jasmine.stringMatching(/razas\/44$/),
            jasmine.objectContaining({ headers: { Authorization: 'Bearer token-firebase' } })
        );
    });

    [
        { status: 400, expected: 'Solicitud invalida' },
        { status: 403, expected: 'No tienes permisos' },
        { status: 404, expected: 'No se encontro una referencia requerida' },
        { status: 409, expected: 'Ya existe una raza con ese nombre' },
    ].forEach(({ status, expected }) => {
        it(`crearRaza traduce error HTTP ${status}`, async () => {
            const http = {
                post: jasmine.createSpy().and.returnValue(throwError(() => new HttpErrorResponse({
                    status,
                    error: { message: 'duplicado' },
                }))),
                get: jasmine.createSpy(),
            };
            const firebaseContextSvc = {
                run: (fn: () => any) => fn(),
            };
            const auth = {
                currentUser: {
                    getIdToken: jasmine.createSpy().and.resolveTo('token-firebase'),
                },
            };
            const service = new TestRazaService({} as any, http as any, firebaseContextSvc as any, auth as any);

            await expectAsync(service.crearRaza({ raza: { nombre: 'Duplicada' } } as any))
                .toBeRejectedWithError(new RegExp(expected));
        });
    });
});
