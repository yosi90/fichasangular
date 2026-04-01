import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Personaje } from '../interfaces/personaje';
import { ProfileApiError } from '../interfaces/user-account';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { PersonajeService } from './personaje.service';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

function crearServicio(httpMock: any): PersonajeService {
    return new PersonajeService(
        { currentUser: { getIdToken: async () => 'token' } } as any,
        {} as any,
        httpMock,
        firebaseContextMock
    );
}

function crearServicioInvitado(httpMock: any): PersonajeService {
    return new PersonajeService(
        { currentUser: null } as any,
        {} as any,
        httpMock,
        firebaseContextMock
    );
}

function crearPersonajeMock(): Personaje {
    return {
        Id: 0,
        Nombre: 'Aldric',
        ownerUid: 'uid-1',
        visible_otros_usuarios: false,
        Id_region: 0,
        Region: {
            Id: 0,
            Nombre: 'Sin región',
        },
        Raza: {
            Id: 1,
            Nombre: 'Humano',
            Ajuste_nivel: 0,
            Manual: '',
            Clase_predilecta: '',
            Modificadores: {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Oficial: true,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: false,
            Mutacion: {
                Es_mutada: false,
                Tamano_dependiente: false,
                Tiene_prerrequisitos: false,
                Heredada: false,
            },
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            Dgs_adicionales: { Cantidad: 0, Dado: 'd8', Tipo_criatura: 'Humanoide' },
            Tipo_criatura: {
                Id: 1,
                Nombre: 'Humanoide',
                Descripcion: '',
                Manual: '',
                Id_tipo_dado: 2,
                Tipo_dado: 6,
                Id_ataque: 1,
                Id_fortaleza: 1,
                Id_reflejos: 1,
                Id_voluntad: 1,
                Id_puntos_habilidad: 1,
                Come: true,
                Respira: true,
                Duerme: true,
                Recibe_criticos: true,
                Puede_ser_flanqueado: true,
                Pierde_constitucion: false,
                Limite_inteligencia: 0,
                Tesoro: '',
                Id_alineamiento: 0,
                Rasgos: [],
                Oficial: true,
            },
            Subtipos: [],
        } as any,
        RazaBase: null,
        desgloseClases: [{ Nombre: 'Guerrero', Nivel: 1 }],
        Clases: 'Guerrero (1)',
        Personalidad: 'Mock personalidad',
        Contexto: 'Mock contexto',
        Campana: 'Sin campaña',
        Trama: 'Trama base',
        Subtrama: 'Subtrama base',
        Ataque_base: '1',
        Ca: 10,
        Armadura_natural: 0,
        Ca_desvio: 0,
        Ca_varios: 0,
        Presa: 1,
        Presa_varios: [],
        Iniciativa_varios: [],
        Tipo_criatura: {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: '',
            Manual: '',
            Id_tipo_dado: 2,
            Tipo_dado: 6,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: '',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        },
        Subtipos: [],
        Fuerza: 10,
        ModFuerza: 0,
        Destreza: 10,
        ModDestreza: 0,
        Constitucion: 10,
        ModConstitucion: 0,
        Caracteristicas_perdidas: {},
        Constitucion_perdida: false,
        Inteligencia: 10,
        ModInteligencia: 0,
        Sabiduria: 10,
        ModSabiduria: 0,
        Carisma: 10,
        ModCarisma: 0,
        CaracteristicasVarios: {
            Fuerza: [],
            Destreza: [],
            Constitucion: [],
            Inteligencia: [],
            Sabiduria: [],
            Carisma: [],
        },
        NEP: 1,
        Experiencia: 0,
        Deidad: 'No tener deidad',
        Alineamiento: 'Neutral autentico',
        Genero: 'Macho',
        Vida: 10,
        Correr: 30,
        Nadar: 0,
        Volar: 0,
        Trepar: 0,
        Escalar: 0,
        Oficial: true,
        Dados_golpe: 8,
        Pgs_lic: 0,
        Jugador: 'Jugador',
        Edad: 20,
        Altura: 1.8,
        Peso: 80,
        Rds: [],
        Rcs: [],
        Res: [],
        Oro_inicial: 0,
        Escuela_especialista: { Nombre: '', Calificativo: '' },
        Disciplina_especialista: { Nombre: '', Calificativo: '' },
        Disciplina_prohibida: '',
        Capacidad_carga: { Ligera: 0, Media: 0, Pesada: 0 },
        Salvaciones: {
            fortaleza: { modsClaseos: [], modsVarios: [] },
            reflejos: { modsClaseos: [], modsVarios: [] },
            voluntad: { modsClaseos: [], modsVarios: [] },
        },
        Dominios: [],
        competencia_arma: [],
        competencia_armadura: [],
        competencia_grupo_arma: [],
        competencia_grupo_armadura: [],
        Plantillas: [],
        Familiares: [],
        Companeros: [],
        Conjuros: [],
        Claseas: [],
        Raciales: [],
        Habilidades: [],
        Dotes: [],
        DotesContextuales: [{
            Dote: {
                Id: 1,
                Nombre: 'Dureza',
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
                Extras_soportados: {
                    Extra_arma: 0,
                    Extra_armadura: 0,
                    Extra_escuela: 0,
                    Extra_habilidad: 0,
                },
                Extras_disponibles: {
                    Armas: [],
                    Armaduras: [],
                    Escuelas: [],
                    Habilidades: [],
                },
                Modificadores: {},
                Prerrequisitos: {},
            },
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: 0,
                Id_extra: -1,
                Extra: 'No aplica',
            },
        }],
        Ventajas: [],
        Idiomas: [],
        Sortilegas: [],
        Escuelas_prohibidas: [],
        Archivado: false,
    };
}

describe('PersonajeService', () => {
    it('getDetallesPersonaje usa API actor-scoped con Bearer y shape canónico', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of({
                i: 77,
                n: 'Aldric',
                ownerUid: 'uid-77',
                ownerDisplayName: 'Aldric Owner',
                visible_otros_usuarios: true,
                id_region: 4,
                dcp: 'Personalidad',
                dh: 'Historia',
                a: '2',
                ca: 16,
                an: 1,
                cd: 0,
                cv: 0,
                ra: {
                    Id: 1,
                    Nombre: 'Humano',
                    Ajuste_nivel: 0,
                    Tamano: { Nombre: 'Mediano', Modificador_presa: 0 },
                    Dgs_adicionales: { Cantidad: 0 },
                },
                tc: { Id: 1, Nombre: 'Humanoide' },
                f: 12,
                mf: 1,
                d: 10,
                md: 0,
                co: 10,
                mco: 0,
                int: 10,
                mint: 0,
                s: 10,
                ms: 0,
                car: 8,
                mcar: -1,
                de: 'No tener deidad',
                ali: 'Neutral autentico',
                g: 'Macho',
                ncam: 'Sin campaña',
                ntr: 'Trama base',
                nst: 'Subtrama base',
                v: 12,
                cor: 30,
                na: 0,
                vo: 0,
                t: 0,
                e: 0,
                o: true,
                archivado: true,
                dg: 0,
                cla: 'Guerrero;2',
                dom: '',
                stc: '',
                competencia_arma: [],
                competencia_armadura: [],
                competencia_grupo_arma: [],
                competencia_grupo_armadura: [],
                pla: [],
                con: [],
                esp: [],
                espX: [],
                rac: [],
                hab: [],
                habN: [],
                habC: [],
                habCa: [],
                habMc: [],
                habR: [],
                habRv: [],
                habX: [],
                habV: [],
                habCu: [],
                dotes: [],
                ve: '',
                idi: [],
                familiares: [],
                companeros: [],
                sor: [],
                ju: 'Jugador visible',
                pgl: 0,
                ini_v: [],
                pr_v: [],
                edad: 20,
                alt: 1.8,
                peso: 80,
                salv: {},
                rds: [],
                rcs: [],
                res: [],
                ccl: 0,
                ccm: 0,
                ccp: 0,
                espa: '',
                espan: '',
                espp: '',
                esppn: '',
                disp: '',
                ecp: '',
                cper: {},
                cperd: false,
            })),
        } as any;
        const service = crearServicio(httpMock);

        const observable = await service.getDetallesPersonaje(77);
        const personaje = await new Promise<any>((resolve) => observable.subscribe(resolve));

        expect(httpMock.get).toHaveBeenCalledWith(
            jasmine.stringMatching(/personajes\/77$/),
            jasmine.objectContaining({
                headers: jasmine.anything(),
            })
        );
        const options = httpMock.get.calls.mostRecent().args[1];
        expect(options.headers.get('Authorization')).toBe('Bearer token');
        expect(personaje.Id).toBe(77);
        expect(personaje.ownerUid).toBe('uid-77');
        expect(personaje.ownerDisplayName).toBe('Aldric Owner');
        expect(personaje.Clases).toBe('Guerrero (2)');
        expect(personaje.Archivado).toBeTrue();
    });

    it('getDetallesPersonaje recupera Archivado desde cache auxiliar cuando el detalle API no lo trae', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of({
                i: 77,
                n: 'Aldric',
                ownerUid: 'uid-77',
                ownerDisplayName: 'Aldric Owner',
                visible_otros_usuarios: true,
                id_region: 4,
                dcp: 'Personalidad',
                dh: 'Historia',
                a: '2',
                ca: 16,
                an: 1,
                cd: 0,
                cv: 0,
                ra: {
                    Id: 1,
                    Nombre: 'Humano',
                    Ajuste_nivel: 0,
                    Tamano: { Nombre: 'Mediano', Modificador_presa: 0 },
                    Dgs_adicionales: { Cantidad: 0 },
                },
                tc: { Id: 1, Nombre: 'Humanoide' },
                f: 12,
                mf: 1,
                d: 10,
                md: 0,
                co: 10,
                mco: 0,
                int: 10,
                mint: 0,
                s: 10,
                ms: 0,
                car: 8,
                mcar: -1,
                de: 'No tener deidad',
                ali: 'Neutral autentico',
                g: 'Macho',
                ncam: 'Sin campaña',
                ntr: 'Trama base',
                nst: 'Subtrama base',
                v: 12,
                cor: 30,
                na: 0,
                vo: 0,
                t: 0,
                e: 0,
                o: true,
                dg: 0,
                cla: 'Guerrero;2',
                dom: '',
                stc: '',
                competencia_arma: [],
                competencia_armadura: [],
                competencia_grupo_arma: [],
                competencia_grupo_armadura: [],
                pla: [],
                con: [],
                esp: [],
                espX: [],
                rac: [],
                hab: [],
                habN: [],
                habC: [],
                habCa: [],
                habMc: [],
                habR: [],
                habRv: [],
                habX: [],
                habV: [],
                habCu: [],
                dotes: [],
                ve: '',
                idi: [],
                familiares: [],
                companeros: [],
                sor: [],
                ju: 'Jugador visible',
                pgl: 0,
                ini_v: [],
                pr_v: [],
                edad: 20,
                alt: 1.8,
                peso: 80,
                salv: {},
                rds: [],
                rcs: [],
                res: [],
                ccl: 0,
                ccm: 0,
                ccp: 0,
                espa: '',
                espan: '',
                espp: '',
                esppn: '',
                disp: '',
                ecp: '',
                cper: {},
                cperd: false,
            })),
        } as any;
        const service = crearServicio(httpMock);
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({ Archivado: true });

        const observable = await service.getDetallesPersonaje(77);
        const personaje = await new Promise<any>((resolve) => observable.subscribe(resolve));

        expect(personaje.Archivado).toBeTrue();
    });

    it('getDetallesPersonaje usa cache pública para invitados cuando el personaje es visible', async () => {
        const httpMock = {
            get: jasmine.createSpy('get'),
        } as any;
        const service = crearServicioInvitado(httpMock);
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            Nombre: 'Aldric',
            visible_otros_usuarios: true,
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Clases: [{ Nombre: 'Guerrero', Nivel: 2 }],
            Raza: {
                Id: 1,
                Nombre: 'Humano',
                Ajuste_nivel: 0,
                Tamano: { Nombre: 'Mediano', Modificador_presa: 0 },
                Dgs_adicionales: { Cantidad: 0 },
            },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Fuerza: 10,
            Destreza: 10,
            Constitucion: 10,
            Inteligencia: 10,
            Sabiduria: 10,
            Carisma: 10,
            Vida: 10,
            Ataque_base: '2',
            Ca: 12,
            Armadura_natural: 0,
            Ca_desvio: 0,
            Ca_varios: 0,
            Presa: 2,
            Presa_varios: [],
            Iniciativa_varios: [],
            Dominios: [],
            Subtipos: [],
            Plantillas: [],
            Familiares: [],
            Companeros: [],
            Conjuros: [],
            Claseas: [],
            Raciales: [],
            Habilidades: [],
            Dotes: [],
            DotesContextuales: [],
            Ventajas: [],
            Idiomas: [],
            Sortilegas: [],
            Rds: [],
            Rcs: [],
            Res: [],
            Capacidad_carga: { Ligera: 0, Media: 0, Pesada: 0 },
            Salvaciones: {},
            Escuela_especialista: { Nombre: '', Calificativo: '' },
            Disciplina_especialista: { Nombre: '', Calificativo: '' },
            Disciplina_prohibida: '',
            Escuelas_prohibidas: [],
            CaracteristicasVarios: {
                Fuerza: [],
                Destreza: [],
                Constitucion: [],
                Inteligencia: [],
                Sabiduria: [],
                Carisma: [],
            },
        });

        const observable = await service.getDetallesPersonaje(77);
        const personaje = await new Promise<any>((resolve) => observable.subscribe(resolve));

        expect(httpMock.get).not.toHaveBeenCalled();
        expect(personaje.Id).toBe(77);
        expect(personaje.visible_otros_usuarios).toBeTrue();
        expect(personaje.Campana).toBe('Sin campaña');
        expect(personaje.Fuerza).toBe(10);
        expect(personaje.Vida).toBe(10);
        expect(personaje.Clases).toBe('Guerrero (2)');
    });

    it('getDetallesPersonaje rechaza detalle cacheado no visible para invitados', async () => {
        const httpMock = {
            get: jasmine.createSpy('get'),
        } as any;
        const service = crearServicioInvitado(httpMock);
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            Id: 88,
            Nombre: 'Privado',
            visible_otros_usuarios: false,
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Raza: { Id: 1, Nombre: 'Humano', Ajuste_nivel: 0, Tamano: { Nombre: 'Mediano', Modificador_presa: 0 }, Dgs_adicionales: { Cantidad: 0 } },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
        });

        await expectAsync(service.getDetallesPersonaje(88))
            .toBeRejectedWithError('El personaje solicitado no está disponible para invitados.');
    });

    it('getDetallesPersonaje rechaza detalle archivado para invitados aunque sea visible', async () => {
        const httpMock = {
            get: jasmine.createSpy('get'),
        } as any;
        const service = crearServicioInvitado(httpMock);
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            Id: 89,
            Nombre: 'Archivado',
            visible_otros_usuarios: true,
            Archivado: true,
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Raza: { Id: 1, Nombre: 'Humano', Ajuste_nivel: 0, Tamano: { Nombre: 'Mediano', Modificador_presa: 0 }, Dgs_adicionales: { Cantidad: 0 } },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
        });

        await expectAsync(service.getDetallesPersonaje(89))
            .toBeRejectedWithError('El personaje solicitado no está disponible para invitados.');
    });

    it('actualizarArchivadoPersonaje usa PATCH con Bearer y normaliza respuesta', async () => {
        const httpMock = {
            patch: jasmine.createSpy('patch').and.returnValue(of({
                message: 'ok',
                idPersonaje: '15',
                archivado: true,
            })),
        } as any;
        const service = crearServicio(httpMock);

        const response = await service.actualizarArchivadoPersonaje(15, true);

        expect(httpMock.patch).toHaveBeenCalledWith(
            jasmine.stringMatching(/personajes\/15\/archivado$/),
            { archivado: true },
            jasmine.objectContaining({
                headers: jasmine.anything(),
            })
        );
        const options = httpMock.patch.calls.mostRecent().args[2];
        expect(options.headers.get('Authorization')).toBe('Bearer token');
        expect(response.idPersonaje).toBe(15);
        expect(response.archivado).toBeTrue();
    });

    it('construye payload minimo valido para /personajes/add', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: 1, idSubtrama: 1 }
        );

        expect(payload.personaje.nombre).toBe('Aldric');
        expect(payload.personaje.idRaza).toBe(1);
        expect(payload.personaje.idTipoCriatura).toBe(1);
        expect(payload.personaje.idRegion).toBe(0);
        expect(payload.caracteristicas.fuerza.valor).toBe(10);
        expect(payload.tamano.idTamano).toBe(1);
    });

    it('incluye contextoCreacionCampana cuando el personaje pertenece a campaña', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Campana = 'Campaña A';

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: 1, idSubtrama: 1 },
            {
                tiradaMinimaDeclarada: 10,
                tablasDadosUsadas: 4,
                overrideReglasCampana: true,
            }
        );

        expect(payload.contextoCreacionCampana).toEqual({
            tiradaMinimaDeclarada: 10,
            tablasDadosUsadas: 4,
            overrideReglasCampana: true,
        });
    });

    it('omite campaña, trama y subtrama al crear un personaje sin campaña', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Campana = 'Sin campaña';
        pj.Trama = 'Trama base';
        pj.Subtrama = 'Subtrama base';

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: null, idTrama: null, idSubtrama: null }
        );

        expect(payload.personaje.campana).toBeUndefined();
        expect(payload.personaje.trama).toBeUndefined();
        expect(payload.personaje.subtrama).toBeUndefined();
        expect(payload.contextoCreacionCampana).toBeUndefined();
    });

    it('prioriza idRegion de contexto cuando está presente', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Id_region = 3;

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: 1, idSubtrama: 1, idRegion: 7 }
        );

        expect(payload.personaje.idRegion).toBe(7);
    });

    it('construye payload con competencias directas usando ids válidos', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.competencia_arma = [
            { Id: 3, Nombre: 'Espada larga' },
            { Id: 0, Nombre: 'Sin id no viaja' },
        ];
        pj.competencia_armadura = [{ Id: 5, Nombre: 'Escudo pesado', Es_escudo: true }];
        pj.competencia_grupo_arma = [{ Id: 7, Nombre: 'Armas marciales' }];
        pj.competencia_grupo_armadura = [{ Id: 9, Nombre: 'Escudos' }];

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: 1, idSubtrama: 1 }
        );

        expect(payload.colecciones?.competencia_arma).toEqual([{ idArma: 3 }]);
        expect(payload.colecciones?.competencia_armadura).toEqual([{ idArmadura: 5 }]);
        expect(payload.colecciones?.competencia_grupo_arma).toEqual([{ idGrupoArma: 7 }]);
        expect(payload.colecciones?.competencia_grupo_armadura).toEqual([{ idGrupoArmadura: 9 }]);
    });

    it('crearPersonajeApiDesdeCreacion usa POST y normaliza respuesta', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({
                message: 'ok',
                idPersonaje: '22',
                ownerUserId: '00000000-0000-0000-0000-000000000009',
            })),
        } as any;
        const service = crearServicio(httpMock);

        const response = await service.crearPersonajeApiDesdeCreacion({
            personaje: {
                nombre: 'Aldric',
                ataqueBase: '1',
                idRaza: 1,
                idTipoCriatura: 1,
                idRegion: 0,
                campana: { id: 1 },
                trama: { id: 1 },
                subtrama: { id: 1 },
                visible_otros_usuarios: false,
                oficial: true,
            },
            caracteristicas: {
                fuerza: { valor: 10, minimo: 0, perdido: false },
                destreza: { valor: 10, minimo: 0, perdido: false },
                constitucion: { valor: 10, minimo: 0, perdido: false },
                inteligencia: { valor: 10, minimo: 0, perdido: false },
                sabiduria: { valor: 10, minimo: 0, perdido: false },
                carisma: { valor: 10, minimo: 0, perdido: false },
            },
            tamano: { idTamano: 1, origen: 'Web' },
        });

        expect(httpMock.post).toHaveBeenCalled();
        expect(response.idPersonaje).toBe(22);
        expect(response.ownerUserId).toBe('00000000-0000-0000-0000-000000000009');
    });

    it('crearPersonajeApiDesdeCreacion preserva status y code en 403 funcionales', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(throwError(() => ({
                status: 403,
                error: {
                    code: 'mustAcceptCreation',
                    message: 'Debes aceptar las normas de creación vigentes antes de continuar.',
                },
            }))),
        } as any;
        const service = crearServicio(httpMock);
        let captured: any = null;

        try {
            await service.crearPersonajeApiDesdeCreacion({
                personaje: {
                    nombre: 'Aldric',
                    ataqueBase: '1',
                    idRaza: 1,
                    idTipoCriatura: 1,
                    idRegion: 0,
                    visible_otros_usuarios: false,
                    oficial: true,
                },
                caracteristicas: {
                    fuerza: { valor: 10, minimo: 0, perdido: false },
                    destreza: { valor: 10, minimo: 0, perdido: false },
                    constitucion: { valor: 10, minimo: 0, perdido: false },
                    inteligencia: { valor: 10, minimo: 0, perdido: false },
                    sabiduria: { valor: 10, minimo: 0, perdido: false },
                    carisma: { valor: 10, minimo: 0, perdido: false },
                },
                tamano: { idTamano: 1, origen: 'Web' },
            });
            fail('Se esperaba un error funcional 403.');
        } catch (error: any) {
            captured = error;
        }

        expect(captured instanceof ProfileApiError).toBeTrue();
        expect(captured?.code).toBe('mustAcceptCreation');
        expect(captured?.status).toBe(403);
        expect(captured?.message).toBe('Debes aceptar las normas de creación vigentes antes de continuar.');
    });

    it('guardarPersonajeEnFirebase escribe detalle y simple con forma compatible', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Id_region = 4;
        pj.Region = { Id: 4, Nombre: 'Rashemen' } as any;
        pj.competencia_arma = [{ Id: 11, Nombre: 'Arco corto' }];
        pj.competencia_armadura = [{ Id: 12, Nombre: 'Escudo ligero', Es_escudo: true }];
        const writeSpy = spyOn<any>(service, 'escribirRutaFirebase').and.resolveTo();

        await service.guardarPersonajeEnFirebase(321, pj);

        expect(writeSpy).toHaveBeenCalledTimes(3);
        const llamadas = writeSpy.calls.allArgs();
        const detalle = llamadas.find((args) => `${args[0] ?? ''}`.includes('Personajes/321'));
        const simple = llamadas.find((args) => `${args[0] ?? ''}`.includes('Personajes-simples/321'));
        const listado = llamadas.find((args) => `${args[0] ?? ''}`.includes('listado-personajes/321'));
        expect(detalle).toBeDefined();
        expect(simple).toBeDefined();
        expect(listado).toBeDefined();
        expect((detalle?.[1] as any)?.DotesContextuales?.[0]?.Contexto?.Id_personaje).toBe(321);
        expect((detalle?.[1] as any)?.competencia_arma).toEqual([{ Id: 11, Nombre: 'Arco corto' }]);
        expect((detalle?.[1] as any)?.competencia_armadura).toEqual([{ Id: 12, Nombre: 'Escudo ligero', Es_escudo: true }]);
        expect((simple?.[1] as any)?.competencia_arma).toBeUndefined();
        expect((listado?.[1] as any)?.competencia_armadura).toBeUndefined();
        expect((simple?.[1] as any)?.Campaña).toBe('Sin campaña');
        expect((detalle?.[1] as any)?.Id_region).toBe(4);
        expect((simple?.[1] as any)?.Id_region).toBe(4);
        expect((listado?.[1] as any)?.Id_region).toBe(4);
    });

    it('normalizarPersonajeParaPersistenciaFinal deja competencias vacías y preserva Es_escudo', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        (pj as any).competencia_arma = null;
        (pj as any).competencia_armadura = [{ Id: 4, Nombre: 'Broquel', Es_escudo: 1 }];
        (pj as any).competencia_grupo_arma = undefined;
        (pj as any).competencia_grupo_armadura = {};

        const normalizado = service.normalizarPersonajeParaPersistenciaFinal(pj, 77);

        expect(normalizado.competencia_arma).toEqual([]);
        expect(normalizado.competencia_armadura).toEqual([{ Id: 4, Nombre: 'Broquel', Es_escudo: true }]);
        expect(normalizado.competencia_grupo_arma).toEqual([]);
        expect(normalizado.competencia_grupo_armadura).toEqual([]);
    });

    it('normalizarPersonajeParaPersistenciaFinal preserva Archivado', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Archivado = true;

        const normalizado = service.normalizarPersonajeParaPersistenciaFinal(pj, 77);

        expect(normalizado.Archivado).toBeTrue();
    });

    it('RenovarPersonajes sincroniza competencias directas en cache detallada', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        spyOn<any>(service, 'd_pjs').and.returnValue(of([{
            i: 55,
            n: 'Kara',
            ownerUid: 'uid-55',
            visible_otros_usuarios: true,
            dcp: '',
            dh: '',
            a: '1',
            ca: 10,
            an: 0,
            cd: 0,
            cv: 0,
            ra: { Nombre: 'Humano', Tamano: { Nombre: 'Mediano', Modificador_presa: 0 }, Dgs_adicionales: { Cantidad: 0 }, Ajuste_nivel: 0 },
            tc: {},
            f: 10,
            mf: 0,
            d: 10,
            md: 0,
            co: 10,
            mco: 0,
            int: 10,
            mint: 0,
            s: 10,
            ms: 0,
            car: 10,
            mcar: 0,
            de: 'No tener deidad',
            ali: 'Neutral autentico',
            g: 'Macho',
            ncam: 'Sin campaña',
            ntr: 'Trama base',
            nst: 'Subtrama base',
            v: 8,
            cor: 30,
            na: 0,
            vo: 0,
            t: 0,
            e: 0,
            o: true,
            dg: 0,
            cla: 'Guerrero;1',
            dom: '',
            stc: '',
            competencia_arma: [{ Id: 2, Nombre: 'Espada corta' }],
            competencia_armadura: [{ Id: 4, Nombre: 'Escudo ligero', Es_escudo: true }],
            competencia_grupo_arma: [{ Id: 6, Nombre: 'Armas simples' }],
            competencia_grupo_armadura: [{ Id: 8, Nombre: 'Escudos' }],
            pla: [],
            con: [],
            esp: [],
            espX: [],
            rac: [],
            hab: [],
            habN: [],
            habC: [],
            habCa: [],
            habMc: [],
            habR: [],
            habRv: [],
            habX: [],
            habV: [],
            habCu: [],
            dotes: [],
            ve: '',
            idi: [],
            familiares: [],
            companeros: [],
            sor: [],
            ju: '',
            pgl: 0,
            ini_v: [],
            pr_v: [],
            edad: 0,
            alt: 0,
            peso: 0,
            salv: {},
            rds: [],
            rcs: [],
            res: [],
            ccl: 0,
            ccm: 0,
            ccp: 0,
            espa: '',
            espan: '',
            espp: '',
            esppn: '',
            disp: '',
            ecp: '',
            cper: {},
            cperd: false,
        }]));
        const writeSpy = spyOn<any>(service, 'escribirRutaFirebase').and.resolveTo();
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const ok = await service.RenovarPersonajes();

        expect(ok).toBeTrue();
        const detalleCall = writeSpy.calls.allArgs().find((args) => `${args[0] ?? ''}` === 'Personajes/55');
        expect(detalleCall).toBeDefined();
        expect((detalleCall?.[1] as any)?.competencia_arma).toEqual([{ Id: 2, Nombre: 'Espada corta' }]);
        expect((detalleCall?.[1] as any)?.competencia_armadura).toEqual([{ Id: 4, Nombre: 'Escudo ligero', Es_escudo: true }]);
        expect((detalleCall?.[1] as any)?.competencia_grupo_arma).toEqual([{ Id: 6, Nombre: 'Armas simples' }]);
        expect((detalleCall?.[1] as any)?.competencia_grupo_armadura).toEqual([{ Id: 8, Nombre: 'Escudos' }]);
    });

    it('RenovarPersonajes descarta aliases legacy de owner en respuestas API', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        spyOn<any>(service, 'd_pjs').and.returnValue(of([{
            i: 56,
            n: 'Legacy owner',
            owner_uid: 'legacy-owner',
            uid: 'legacy-uid',
            owner_display_name: 'Legacy visible',
            visible_otros_usuarios: true,
            dcp: '',
            dh: '',
            a: '1',
            ca: 10,
            an: 0,
            cd: 0,
            cv: 0,
            ra: { Nombre: 'Humano', Tamano: { Nombre: 'Mediano', Modificador_presa: 0 }, Dgs_adicionales: { Cantidad: 0 }, Ajuste_nivel: 0 },
            tc: {},
            f: 10,
            mf: 0,
            d: 10,
            md: 0,
            co: 10,
            mco: 0,
            int: 10,
            mint: 0,
            s: 10,
            ms: 0,
            car: 10,
            mcar: 0,
            de: 'No tener deidad',
            ali: 'Neutral autentico',
            g: 'Macho',
            ncam: 'Sin campaña',
            ntr: 'Trama base',
            nst: 'Subtrama base',
            v: 8,
            cor: 30,
            na: 0,
            vo: 0,
            t: 0,
            e: 0,
            o: true,
            dg: 0,
            cla: 'Guerrero;1',
            dom: '',
            stc: '',
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            pla: [],
            con: [],
            esp: [],
            espX: [],
            rac: [],
            hab: [],
            habN: [],
            habC: [],
            habCa: [],
            habMc: [],
            habR: [],
            habRv: [],
            habX: [],
            habV: [],
            habCu: [],
            dotes: [],
            ve: '',
            idi: [],
            familiares: [],
            companeros: [],
            sor: [],
            ju: '',
            pgl: 0,
            ini_v: [],
            pr_v: [],
            edad: 0,
            alt: 0,
            peso: 0,
            salv: {},
            rds: [],
            rcs: [],
            res: [],
            ccl: 0,
            ccm: 0,
            ccp: 0,
            espa: '',
            espan: '',
            espp: '',
            esppn: '',
            disp: '',
            ecp: '',
            cper: {},
            cperd: false,
        }]));
        const writeSpy = spyOn<any>(service, 'escribirRutaFirebase').and.resolveTo();
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        const ok = await service.RenovarPersonajes();

        expect(ok).toBeTrue();
        const detalleCall = writeSpy.calls.allArgs().find((args) => `${args[0] ?? ''}` === 'Personajes/56');
        const simpleCall = writeSpy.calls.allArgs().find((args) => `${args[0] ?? ''}` === 'Personajes-simples/56');
        expect((detalleCall?.[1] as any)?.ownerUid ?? null).toBeNull();
        expect((detalleCall?.[1] as any)?.ownerDisplayName ?? null).toBeNull();
        expect((simpleCall?.[1] as any)?.ownerUid ?? null).toBeNull();
        expect((simpleCall?.[1] as any)?.ownerDisplayName ?? null).toBeNull();
    });
});
