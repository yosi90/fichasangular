import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { Personaje } from '../interfaces/personaje';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { PersonajeService } from './personaje.service';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

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
    it('construye payload minimo valido para /personajes/add', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
        const pj = crearPersonajeMock();

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            'uid-1',
            { idCampana: 1, idTrama: 1, idSubtrama: 1 }
        );

        expect(payload.uid).toBe('uid-1');
        expect(payload.personaje.nombre).toBe('Aldric');
        expect(payload.personaje.idRaza).toBe(1);
        expect(payload.personaje.idTipoCriatura).toBe(1);
        expect(payload.personaje.idRegion).toBe(0);
        expect(payload.caracteristicas.fuerza.valor).toBe(10);
        expect(payload.tamano.idTamano).toBe(1);
    });

    it('prioriza idRegion de contexto cuando está presente', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
        const pj = crearPersonajeMock();
        pj.Id_region = 3;

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            'uid-1',
            { idCampana: 1, idTrama: 1, idSubtrama: 1, idRegion: 7 }
        );

        expect(payload.personaje.idRegion).toBe(7);
    });

    it('construye payload con competencias directas usando ids válidos', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
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
            'uid-1',
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
                idJugador: '9',
                uid: 'uid-1',
            })),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);

        const response = await service.crearPersonajeApiDesdeCreacion({
            uid: 'uid-1',
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
        expect(response.idJugador).toBe(9);
        expect(response.uid).toBe('uid-1');
    });

    it('guardarPersonajeEnFirebase escribe detalle y simple con forma compatible', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
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
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
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

    it('RenovarPersonajes sincroniza competencias directas en cache detallada', async () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = new PersonajeService({} as any, httpMock, firebaseContextMock);
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
});
