import { of } from 'rxjs';
import { Personaje } from '../interfaces/personaje';
import { PersonajeService } from './personaje.service';

function crearPersonajeMock(): Personaje {
    return {
        Id: 0,
        Nombre: 'Aldric',
        ownerUid: 'uid-1',
        visible_otros_usuarios: false,
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
        const service = new PersonajeService({} as any, httpMock);
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
        expect(payload.caracteristicas.fuerza.valor).toBe(10);
        expect(payload.tamano.idTamano).toBe(1);
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
        const service = new PersonajeService({} as any, httpMock);

        const response = await service.crearPersonajeApiDesdeCreacion({
            uid: 'uid-1',
            personaje: {
                nombre: 'Aldric',
                ataqueBase: '1',
                idRaza: 1,
                idTipoCriatura: 1,
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
        const service = new PersonajeService({} as any, httpMock);
        const pj = crearPersonajeMock();
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
        expect((simple?.[1] as any)?.Campaña).toBe('Sin campaña');
    });
});
