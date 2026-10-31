import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { normalizeRazaApi } from './utils/raza-mapper';
import { RazaService, normalizeAlineamientoRaza, normalizeHabilidadesRaza, normalizeIdiomasRaza, normalizeRazaLegacy } from './raza.service';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { razaPorEdadesApi, razaPorEdadesEnPasoApi } from 'src/testing/raza-por-edades';

describe('RazaService helpers', () => {
    beforeEach(() => simularTokenApi('token-firebase'));

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
            ex: 10,
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
        expect(raza.Excavar).toBe(10);
    });

    it('lee la velocidad de excavar de la caché (`Excavar`)', () => {
        expect(normalizeRazaLegacy({ Id: 360, Nombre: 'Armand', Excavar: 10 }).Excavar).toBe(10);
    });

    it('lee la dote adicional y los puntos de habilidad extra de la raza, por HTTP y desde la caché', () => {
        const extras = { Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1 };
        const http = normalizeRazaApi(createRazaApiRaw(extras));
        const cache = normalizeRazaLegacy({ Id: 25, Nombre: 'Humano', ...extras });
        const sinExtras = normalizeRazaApi(createRazaApiRaw({}));

        [http, cache].forEach((raza) => {
            expect(raza.Dotes_adicionales).toBe(1);
            expect(raza.Puntos_habilidad_extra_primer_nivel).toBe(4);
            expect(raza.Puntos_habilidad_extra_por_nivel).toBe(1);
        });
        expect(sinExtras.Dotes_adicionales).toBe(0);
        expect(sinExtras.Puntos_habilidad_extra_por_nivel).toBe(0);
    });

    it('lee la descripción, el nombre original y si es traducida, por HTTP y desde la caché', () => {
        const textos = { Descripcion: ' Los goliats viven en las cumbres.\n\nCompiten en todo. ', Nombre_original: 'Goliath', Traducido: true };
        const http = normalizeRazaApi(createRazaApiRaw(textos));
        const cache = normalizeRazaLegacy({ Id: 406, Nombre: 'Goliat', ...textos });

        [http, cache].forEach((raza) => {
            expect(raza.Descripcion).toBe('Los goliats viven en las cumbres.\n\nCompiten en todo.');
            expect(raza.Nombre_original).toBe('Goliath');
            expect(raza.Traducido).toBeTrue();
        });
        // En la caché, sin nombre original la clave no está; por HTTP llega `null`.
        const sinTextosHttp = normalizeRazaApi(createRazaApiRaw({ Descripcion: '', Nombre_original: null, Traducido: false }));
        const sinTextosCache = normalizeRazaLegacy({ Id: 25, Nombre: 'Humano' });
        [sinTextosHttp, sinTextosCache].forEach((raza) => {
            expect(raza.Descripcion).toBe('');
            expect(raza.Nombre_original).toBeNull();
            expect(raza.Traducido).toBeFalse();
        });
    });

    it('el conjuro de las sortílegas de la API usa normalizeConjuroApi (Niveles_clase, alma, Nombre_esp)', () => {
        const raza = normalizeRazaApi(createRazaApiRaw({
            sor: [{
                Conjuro: {
                    Id: 9,
                    Nombre: 'Oscuridad',
                    Escuela: { Id: 4, Nombre: 'Evocación', Nombre_esp: 'Evocador', Prohibible: 1 },
                    Niveles_clase: [{ Id_clase: 2, Clase: 'Hechicero', Nivel: 2, Espontaneo: 1 }],
                },
                Nivel_lanzador: 3,
                Usos_diarios: '1/día',
            }],
        }));

        const conjuro = raza.Sortilegas[0].Conjuro;
        expect(conjuro.Escuela).toEqual({ Id: 4, Nombre: 'Evocación', Nombre_especial: 'Evocador', Prohibible: true, Oficial: true });
        expect(conjuro.Nivel_clase).toEqual([{ Id_clase: 2, Clase: 'Hechicero', Nivel: 2, Espontaneo: true }]);
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
            Excavar: 0,
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
                Excavar: 0,
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
                        Excavar: 0,
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

    it('crearRaza envia POST /razas/add con Bearer y sin auditoria; la caché la renueva el backend', async () => {
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
        expect(http.get).not.toHaveBeenCalled();
    });

    [
        { status: 400, expected: 'Los datos de la raza no son válidos.' },
        { status: 403, expected: 'No tienes permisos para crear razas.' },
        { status: 404, expected: 'No se ha encontrado la raza o algo a lo que apunta.' },
        { status: 409, expected: 'Ya existe una raza con ese nombre.' },
    ].forEach(({ status, expected }) => {
        it(`crearRaza traduce error HTTP ${status}`, async () => {
            const http = {
                post: jasmine.createSpy().and.returnValue(throwError(() => new HttpErrorResponse({
                    status,
                    error: { error: 'duplicado' },
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
                .toBeRejectedWithError(`${expected} duplicado`);
        });
    });

    it('lee las categorías de edad, los pasos y el lanzamiento racial, por HTTP y desde la caché', () => {
        const raw = razaPorEdadesApi();
        const http = normalizeRazaApi(raw);
        const cache = normalizeRazaLegacy({ Id: raw.i, Nombre: raw.n, Categorias_edad: raw.Categorias_edad, Pasos_edad: { a: raw.Pasos_edad[0], b: raw.Pasos_edad[4] }, Lanzamiento: raw.Lanzamiento });

        expect(http.Categorias_edad?.map((c) => c.Categoria.Nombre)).toEqual(['Cría', 'Muy joven', 'Joven', 'Juvenil']);
        expect(http.Categorias_edad?.[3].Ajuste_nivel).toBeNull();
        expect(http.Categorias_edad?.[0].Raciales[0]).toEqual({ Id: 900, Nombre: 'Arma de aliento', Valor: '2d10', Caracteristica_cd: { Id: 3, Nombre: 'Constitución' } });
        expect(http.Pasos_edad?.map((p) => p.Jugable)).toEqual([true, true, true, true, false]);
        expect(http.Pasos_edad?.[4].Nep_base).toBeNull();
        expect(http.Lanzamiento).toEqual({ Clase: { Id: 9, Nombre: 'Hechicero' }, Nivel: 0, Listas: [] });
        expect(cache.Categorias_edad?.length).toBe(4);
        expect(cache.Pasos_edad?.map((p) => p.Id)).toEqual([11, 15]);
        expect(cache.Lanzamiento?.Clase.Nombre).toBe('Hechicero');

        const sinEdades = normalizeRazaApi(createRazaApiRaw({}));
        expect(sinEdades.Categorias_edad).toEqual([]);
        expect(sinEdades.Pasos_edad).toEqual([]);
        expect(sinEdades.Lanzamiento).toBeNull();
    });

    it('getRazaEnPasoEdad pide GET /razas/{id}/pasos-edad/{idPaso} y devuelve la raza a esa edad', async () => {
        const http = { get: jasmine.createSpy().and.returnValue(of(razaPorEdadesEnPasoApi(13))) };
        const service = new TestRazaService({} as any, http as any, { run: (fn: () => any) => fn() } as any);

        const raza = await service.getRazaEnPasoEdad(709, 13);

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/razas\/709\/pasos-edad\/13$/));
        expect(raza.Paso_edad?.Id).toBe(13);
        expect(raza.Categoria_edad?.Categoria.Nombre).toBe('Joven');
        expect(raza.Dgs_adicionales.Cantidad).toBe(13);
        expect(raza.Ajuste_nivel).toBe(6);
        expect(raza.Lanzamiento?.Nivel).toBe(1);
        expect(raza.Raciales[0].Valor).toBe('6d10');
        expect(raza.Raciales[0].Caracteristica_cd?.Nombre).toBe('Constitución');
    });

    it('getRazaFresca pide GET /razas/{id} sin caché y trae las referencias de «Modificar»', async () => {
        const raw = createRazaApiRaw({
            i: 24, n: 'Elfo',
            Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 14 },
            Clase_predilecta: { Id: 9, Nombre: 'Mago' },
            Dgs_raciales: { Cantidad: 0, Id_dado: 0, Id_tipo_criatura: 0, Fortaleza: 1, Reflejos: 1, Voluntad: 1 },
        });
        const http = { get: jasmine.createSpy().and.returnValue(of(raw)) };
        const service = new TestRazaService({} as any, http as any, { run: (fn: () => any) => fn() } as any);

        const raza = await firstValueFrom(service.getRazaFresca(24));

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/razas\/24$/));
        expect(raza.Edicion?.Manual).toEqual({ Id: 54, Nombre: 'Manual del jugador 1', Pagina: 14 });
        expect(raza.Edicion?.Clase_predilecta).toEqual({ Id: 9, Nombre: 'Mago' });
        expect(raza.Edicion?.Dgs_raciales.Fortaleza).toBe(1);
        // La caché no las trae: sin ellas, `null`.
        expect(normalizeRazaApi(createRazaApiRaw({ i: 24 })).Edicion).toBeNull();
    });

    it('actualizarRaza envía PUT /razas/{id} con Bearer y devuelve la raza leída', async () => {
        const http = {
            put: jasmine.createSpy().and.returnValue(of({
                message: 'Raza actualizada exitosamente', idRaza: 24, raza: createRazaApiRaw({ i: 24, n: 'Elfo gris' }),
            })),
        };
        const auth = { currentUser: { getIdToken: jasmine.createSpy().and.resolveTo('token-firebase') } };
        const service = new TestRazaService({} as any, http as any, { run: (fn: () => any) => fn() } as any, auth as any);
        const payload = { raza: { nombre: 'Elfo gris' } } as any;

        const respuesta = await service.actualizarRaza(24, payload);

        expect(http.put).toHaveBeenCalledWith(jasmine.stringMatching(/razas\/24$/), payload, jasmine.anything());
        expect(http.put.calls.mostRecent().args[2].headers.Authorization).toBe('Bearer token-firebase');
        expect(respuesta.message).toBe('Raza actualizada exitosamente');
        expect(respuesta.idRaza).toBe(24);
        expect(respuesta.raza.Nombre).toBe('Elfo gris');
    });

    it('actualizarRaza traduce el error de la API con su campo', async () => {
        const http = {
            put: jasmine.createSpy().and.returnValue(throwError(() => new HttpErrorResponse({
                status: 409,
                error: { error: 'Ya existe una raza con ese nombre.', code: 'nombre_duplicado', field: 'raza.nombre' },
            }))),
        };
        const auth = { currentUser: { getIdToken: jasmine.createSpy().and.resolveTo('token-firebase') } };
        const service = new TestRazaService({} as any, http as any, { run: (fn: () => any) => fn() } as any, auth as any);

        const error = await service.actualizarRaza(24, { raza: { nombre: 'Enano' } } as any).catch((e) => e);

        expect(error.code).toBe('nombre_duplicado');
        expect(error.field).toBe('raza.nombre');
    });

    it('getRazaEnPasoEdad da el texto del error de la API (paso_edad_no_valido)', async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(throwError(() => new HttpErrorResponse({
                status: 404,
                error: { error: 'Esa edad no es de esta raza.', code: 'paso_edad_no_valido', field: 'idPasoEdad' },
            }))),
        };
        const service = new TestRazaService({} as any, http as any, { run: (fn: () => any) => fn() } as any);

        await expectAsync(service.getRazaEnPasoEdad(709, 99)).toBeRejectedWithError('Esa edad no es de esta raza.');
    });
});
