import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Personaje } from '../interfaces/personaje';
import { ProfileApiError } from '../interfaces/user-account';
import { PersonajeService } from './personaje.service';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';

function crearServicio(httpMock: any): PersonajeService {
    return new PersonajeService(
        { currentUser: { getIdToken: async () => 'token' } } as any,
        httpMock,
    );
}

function crearServicioInvitado(httpMock: any): PersonajeService {
    return new PersonajeService(
        { currentUser: null } as any,
        httpMock,
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
        Excavar: 0,
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
                Extras_de_todo_el_catalogo: { Armas: false, Armaduras: false, Escuelas: false, Habilidades: false },
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
    beforeEach(() => simularTokenApi('token'));

    it('getDetallesPersonaje usa API actor-scoped con Bearer y shape canónico', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of(crearDetalleApi({
                i: 77,
                n: 'Aldric',
                ownerUid: 'uid-77',
                ownerDisplayName: 'Aldric Owner',
                archivado: true,
                clases: [{ id: 9, nombre: 'Guerrero', nivel: 2, lanzaConjuros: false, caracteristicaLanzamiento: null, modificadorLanzamiento: null }],
            }))),
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

    it('getDetallesPersonaje usa GET /personajes/publicos/:id para invitados', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of(crearDetalleApi({ i: 78, n: 'Sir Test' }))),
        } as any;
        const service = crearServicioInvitado(httpMock);

        const observable = await service.getDetallesPersonaje(78);
        const personaje = await new Promise<any>((resolve) => observable.subscribe(resolve));

        expect(httpMock.get).toHaveBeenCalledWith(
            jasmine.stringMatching(/personajes\/publicos\/78$/)
        );
        expect(personaje.Id).toBe(78);
        expect(personaje.Nombre).toBe('Sir Test');
        expect(personaje.Contexto).toBe('Exploradora del bosque');
        expect(personaje.Personalidad).toBe('Seria');
        expect(personaje.Campana).toBe('');
        expect(personaje.Clases).toBe('Explorador (8)');
    });

    it('mapApiDetalleToPersonaje guarda el nivel de lanzador, los conjuros al día y los puntos de poder de la API', () => {
        const service = crearServicio({} as any);
        const diarios = [{ nivel: 0, base: 3, adicionales: 0, especialista: 0, dominio: 0, total: 3, puedeLanzar: true }];
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi({
            clases: [
                { id: 4, nombre: 'Clérigo', nivel: 1, lanzaConjuros: true, caracteristicaLanzamiento: 'Sabiduría', modificadorLanzamiento: 3,
                    nivelLanzador: 1, conjurosDiarios: diarios, puntosPoder: null },
                { id: 22, nombre: 'Psiónico', nivel: 1, lanzaConjuros: true, caracteristicaLanzamiento: 'Inteligencia', modificadorLanzamiento: 3,
                    nivelLanzador: 1, conjurosDiarios: null, puntosPoder: { base: 2, adicionales: 1, total: 3, puedeManifestar: true } },
            ],
        })) as Personaje;

        expect(personaje.desgloseClases.map((c) => [c.Nivel_lanzador, c.Conjuros_diarios, c.Puntos_poder?.total ?? null]))
            .toEqual([[1, diarios, null], [1, null, 3]]);
    });

    it('mapApiDetalleToPersonaje lee las listas de objetos de la ficha nueva', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi({
            dominios: [{ id: 31, nombre: 'Sol' }],
            escuelasProhibidas: [{ id: 5, nombre: 'Evocación' }, { id: 6, nombre: 'Ilusión' }],
            ventajas: [{ id: 3, nombre: 'Afortunado' }],
            reduccionesDano: [{ valor: '15/contundente y mágica', origen: 'Liche' }],
            resistenciasConjuros: [{ valor: '25 + niveles de clase', origen: 'Azotamentes' }],
            resistenciasElementales: [{ valor: 'Fuego 10', origen: null }],
        })) as Personaje;

        expect(personaje.desgloseClases).toEqual([
            { Id: 6, Nombre: 'Explorador', Nivel: 8, Caracteristica_lanzamiento: 'Sabiduría', Nivel_lanzador: null, Conjuros_diarios: null, Puntos_poder: null },
        ]);
        expect(personaje.NEP).toBe(14);
        expect(personaje.Dominios).toEqual([{ Id: 31, Nombre: 'Sol' }]);
        expect(personaje.Escuelas_prohibidas).toEqual([{ Id: 5, Nombre: 'Evocación' }, { Id: 6, Nombre: 'Ilusión' }]);
        expect(personaje.Ventajas).toEqual([{ Id: 3, Nombre: 'Afortunado' }]);
        expect(personaje.Rds).toEqual([{ Modificador: '15/contundente y mágica', Origen: 'Liche' }]);
        expect(personaje.Rcs).toEqual([{ Modificador: '25 + niveles de clase', Origen: 'Azotamentes' }]);
        expect(personaje.Res).toEqual([{ Modificador: 'Fuego 10', Origen: '' }]);
        expect(personaje.Claseas).toEqual([
            { Id: 30, Id_extra: 0, Nombre: 'Empatía salvaje', Extra: '', Extra_comodin: null },
            { Id: 38, Id_extra: 40, Nombre: 'Enemigo predilecto', Extra: 'Primero', Extra_comodin: null },
        ]);
        expect(personaje.Habilidades).toEqual([
            jasmine.objectContaining({
                Id: 6, Nombre: 'Avistar', Clasea: true, Car: 'Sabiduría', Mod_car: 4, Rangos: 14, Rangos_varios: 0,
                Extra: '', Varios: '', Custom: false, Total: 18, Extra_comodin: null,
            }),
            jasmine.objectContaining({ Id: 3, Nombre: 'Artesanía', Extra: 'Elegir', Extra_comodin: 'elegir', Total: 4 }),
        ]);
    });

    it('mapApiDetalleToPersonaje toma los totales de la API sin volver a sumarlos', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi()) as Personaje;

        expect(personaje.Totales?.iniciativa.total).toBe(8);
        expect(personaje.Totales?.presa?.total).toBe(20);
        expect(personaje.Totales?.salvaciones.fortaleza.total).toBe(11);
        expect(personaje.Totales?.salvaciones.reflejos.desglose[1]).toEqual({ tipo: 'clase', origen: null, valor: 6 });
        expect(personaje.Presa).toBe(20);
        expect(personaje.Iniciativa_varios).toEqual([{ Valor: 4, Origen: 'Iniciativa mejorada' }]);
        expect(personaje.Presa_varios).toEqual([]);
        expect(personaje.Salvaciones.reflejos).toEqual({
            modsClaseos: [{ valor: 6, origen: '' }],
            modsVarios: [{ valor: 4, origen: 'Centauro' }],
        });
    });

    it('mapApiDetalleToPersonaje deja la presa sin total cuando el ataque base no tiene número', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi({ a: '-', presa: null })) as Personaje;

        expect(personaje.Totales?.presa).toBeNull();
        expect(personaje.Presa).toBe(0);
        expect(personaje.Ataque_base).toBe('-');
    });

    it('mapApiDetalleToPersonaje trata los rellenos a null como vacíos', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi({ g: null })) as Personaje;

        expect(personaje.Deidad).toBe('');
        expect(personaje.Alineamiento).toBe('');
        expect(personaje.Genero).toBe('');
        expect(personaje.Campana).toBe('');
        expect(personaje.Trama).toBe('');
        expect(personaje.Subtrama).toBe('');
        expect(personaje.Id_region).toBe(0);
        expect(personaje.Region).toBeNull();
        // «Cualquiera» se conserva (no es relleno) y la ficha lo marca en `espaComodin`.
        expect(personaje.Escuela_especialista).toEqual({ Nombre: 'Cualquiera', Calificativo: '', Comodin: 'cualquiera' });
        expect(personaje.Disciplina_especialista).toEqual({ Nombre: '', Calificativo: '' });
        expect(personaje.Disciplina_prohibida).toBe('');
    });

    it('mapApiDetalleToPersonaje conserva la campaña, la trama y la región cuando las hay', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje(crearDetalleApi({
            ncam: 'Costa de la Espada',
            ntr: 'Torre eclipsada',
            nst: null,
            id_region: 3,
            de: 'Ehlonna',
        })) as Personaje;

        expect(personaje.Campana).toBe('Costa de la Espada');
        expect(personaje.Trama).toBe('Torre eclipsada');
        expect(personaje.Subtrama).toBe('');
        expect(personaje.Region).toEqual({ Id: 3, Nombre: '' });
        expect(personaje.Deidad).toBe('Ehlonna');
    });

    it('getDetallesPersonaje para invitados propaga el error del endpoint público y no cae a RTDB legacy', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(throwError(() => new HttpErrorResponse({
                status: 404,
                error: { error: 'No encontrado', code: 'no_encontrado', message: 'otro' },
            }))),
        } as any;
        const service = crearServicioInvitado(httpMock);

        await expectAsync(service.getDetallesPersonaje(89))
            .toBeRejectedWithError('No encontrado');
        expect(httpMock.get).toHaveBeenCalledWith(
            jasmine.stringMatching(/personajes\/publicos\/89$/)
        );
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

    it('actualizarVisibilidadPersonaje y actualizarArchivadoPersonaje dan el error de la API, no el texto de Angular', async () => {
        const httpMock = {
            patch: jasmine.createSpy('patch').and.returnValue(throwError(() => new HttpErrorResponse({
                status: 403,
                url: 'http://api/personajes/15/visible',
                error: { error: 'Solo el dueño puede cambiar el personaje.', code: 'sin_permiso' },
            }))),
        } as any;
        const service = crearServicio(httpMock);

        const visibilidad = await service.actualizarVisibilidadPersonaje(15, true).catch((e) => e);
        expect(visibilidad instanceof ProfileApiError).toBeTrue();
        expect(visibilidad.message).toBe('Solo el dueño puede cambiar el personaje.');
        expect(visibilidad.code).toBe('sin_permiso');

        httpMock.patch.and.returnValue(throwError(() => new HttpErrorResponse({ status: 502, error: '<html>Bad gateway</html>' })));
        const archivado = await service.actualizarArchivadoPersonaje(15, true).catch((e) => e);
        expect(archivado.message).toBe('No se ha podido cambiar el archivado del personaje.');
    });

    it('comprarEquipoPersonaje manda la compra con PUT /personajes/{id}/equipo y lee lo que queda', async () => {
        const httpMock = {
            put: jasmine.createSpy('put').and.returnValue(of({ idPersonaje: 15, coste: 17, dineroInicial: 60, dinero: 43, costes: [15, 2], oficial: true })),
        } as any;
        const service = crearServicio(httpMock);
        const compra = { dineroInicial: 60, piezas: [{ tipo: 'arma' as const, id: 30, cantidad: 1, equipado: true }, { tipo: 'arma' as const, id: 5 }] };

        const respuesta = await service.comprarEquipoPersonaje(15, compra);

        const [url, cuerpo, opciones] = httpMock.put.calls.mostRecent().args;
        expect(url).toMatch(/personajes\/15\/equipo$/);
        expect(cuerpo).toEqual(compra);
        expect(opciones.headers.get('Authorization')).toBe('Bearer token');
        expect(respuesta).toEqual({ idPersonaje: 15, coste: 17, dineroInicial: 60, dinero: 43, costes: [15, 2], costesConjuros: [], oficial: true });
    });

    it('comprarEquipoPersonaje da el error de la API (qué pieza no cuadra)', async () => {
        const httpMock = {
            put: jasmine.createSpy('put').and.returnValue(throwError(() => new HttpErrorResponse({
                status: 400,
                error: { error: 'El equipo cuesta 315 po y solo hay 60 po.', code: 'dinero_insuficiente', field: 'piezas' },
            }))),
        } as any;
        const service = crearServicio(httpMock);
        const error = await service.comprarEquipoPersonaje(15, { dineroInicial: 60, piezas: [] }).catch((e) => e);
        expect(error.message).toBe('El equipo cuesta 315 po y solo hay 60 po.');
        expect(error.code).toBe('dinero_insuficiente');
    });

    it('el archivado sale solo del detalle de la API: no guarda nada en el navegador que vea otra cuenta', async () => {
        localStorage.setItem('fichas.personajes.archivado.override.v1', JSON.stringify({ 77: true }));
        const detalle = (archivado?: boolean) => {
            const api = crearDetalleApi({ i: 77, archivado });
            if (archivado === undefined)
                delete api['archivado'];
            return api;
        };
        const httpMock = {
            patch: jasmine.createSpy('patch').and.returnValue(of({ message: 'ok', idPersonaje: 77, archivado: true })),
            get: jasmine.createSpy('get').and.returnValue(of(detalle(true))),
        } as any;
        const service = crearServicio(httpMock);
        const leer = async () => {
            const observable = await service.getDetallesPersonaje(77);
            return new Promise<any>((resolve) => observable.subscribe(resolve));
        };

        // La marca antigua, sin la cuenta, se borra al empezar.
        expect(localStorage.getItem('fichas.personajes.archivado.override.v1')).toBeNull();
        await service.actualizarArchivadoPersonaje(77, true);
        expect(localStorage.getItem('fichas.personajes.archivado.override.v1')).toBeNull();
        expect((await leer()).Archivado).toBeTrue();
        // Lo que diga la API manda; sin el campo, no archivado.
        httpMock.get.and.returnValue(of(detalle(false)));
        expect((await leer()).Archivado).toBeFalse();
        httpMock.get.and.returnValue(of(detalle()));
        expect((await leer()).Archivado).toBeFalse();
    });

    it('no interpreta el campo a del detalle como archivado porque ahora es ataque base', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of({
                i: 88,
                n: 'Ataque no archivo',
                ownerUid: 'uid-88',
                visible_otros_usuarios: true,
                a: '2',
                archivado: false,
                ra: {
                    Id: 1,
                    Nombre: 'Humano',
                    Ajuste_nivel: 0,
                    Tamano: { Nombre: 'Mediano', Modificador_presa: 0 },
                    Dgs_adicionales: { Cantidad: 0 },
                },
                tc: { Id: 1, Nombre: 'Humanoide' },
                clases: [{ id: 9, nombre: 'Guerrero', nivel: 2, lanzaConjuros: false, caracteristicaLanzamiento: null, modificadorLanzamiento: null }],
            })),
        } as any;
        const service = crearServicio(httpMock);

        const observable = await service.getDetallesPersonaje(88);
        const personaje = await new Promise<any>((resolve) => observable.subscribe(resolve));

        expect(personaje.Ataque_base).toBe('2');
        expect(personaje.Archivado).toBeFalse();
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

    it('permite crear personaje de campaña sin trama ni subtrama', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Campana = 'Campaña A';
        pj.Trama = 'Trama base';
        pj.Subtrama = 'Subtrama base';

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: null, idSubtrama: null },
            {
                tiradaMinimaDeclarada: 10,
                tablasDadosUsadas: 2,
                overrideReglasCampana: false,
            }
        );

        expect(payload.personaje.campana).toEqual({ id: 1 });
        expect(payload.personaje.trama).toBeUndefined();
        expect(payload.personaje.subtrama).toBeUndefined();
        expect(payload.contextoCreacionCampana).toEqual({
            tiradaMinimaDeclarada: 10,
            tablasDadosUsadas: 2,
            overrideReglasCampana: false,
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

    it('incluye progresionLanzador normalizada cuando hay aumentos persistibles', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();

        const payload = service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: null, idTrama: null, idSubtrama: null },
            null,
            {
                selecciones: [
                    {
                        idClaseAplicada: 187,
                        nivelClaseAplicado: 2,
                        indiceAumento: 1,
                        idClaseObjetivo: 186,
                    },
                    {
                        idClaseAplicada: 0,
                        nivelClaseAplicado: 2,
                        indiceAumento: 1,
                        idClaseObjetivo: 186,
                    },
                ],
            }
        );

        expect(payload.progresionLanzador).toEqual({
            selecciones: [
                {
                    idClaseAplicada: 187,
                    nivelClaseAplicado: 2,
                    indiceAumento: 1,
                    idClaseObjetivo: 186,
                },
            ],
        });
    });

    it('rechaza historia de campaña incompleta cuando solo llega la trama', () => {
        const httpMock = {
            post: jasmine.createSpy('post').and.returnValue(of({})),
        } as any;
        const service = crearServicio(httpMock);
        const pj = crearPersonajeMock();
        pj.Campana = 'Campaña A';
        pj.Trama = 'Trama visible';
        pj.Subtrama = 'Subtrama base';

        expect(() => service.construirPayloadCreacionDesdePersonaje(
            pj,
            { idCampana: 1, idTrama: 7, idSubtrama: null }
        )).toThrowError('No se pudo resolver una historia de campaña completa: trama y subtrama deben viajar juntas.');
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

    it('guarda las habilidades sin opción con el extra -1 y el 0 («Elegir») solo en las que admiten extra', () => {
        const service = crearServicio({ post: jasmine.createSpy('post') } as any);
        const pj = crearPersonajeMock();
        const habilidad = (Id: number, Nombre: string, extra: Partial<Personaje['Habilidades'][number]>) => ({
            Id, Nombre, Clasea: true, Car: 'Sabiduria', Mod_car: 0, Rangos: 1, Rangos_varios: 0, Extra: '', Varios: '', Custom: false,
            ...extra,
        });
        pj.Habilidades = [
            habilidad(6, 'Avistar', { Soporta_extra: false }),
            habilidad(32, 'Saber', { Soporta_extra: true, Extra: 'Elegir', Extras: [{ Id_extra: 12, Extra: 'Religión', Descripcion: '' }] }),
            habilidad(33, 'Saber', { Soporta_extra: true, Extra: 'Religión', Extras: [{ Id_extra: 12, Extra: 'Religión', Descripcion: '' }] }),
            habilidad(40, 'Escuchar', {}),
        ];

        const payload = service.construirPayloadCreacionDesdePersonaje(pj, { idCampana: 1, idTrama: 1, idSubtrama: 1 });
        const extras = (payload.colecciones?.habilidades?.base ?? []).map((h) => [h.idHabilidad, h.idExtra]);

        expect(extras).toEqual([[6, -1], [32, 0], [33, 12], [40, -1]]);
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
            post: jasmine.createSpy('post').and.returnValue(throwError(() => new HttpErrorResponse({
                status: 403,
                error: {
                    error: 'Debes aceptar las normas de creación vigentes antes de continuar.',
                    code: 'CREATION_POLICY_ACCEPTANCE_REQUIRED',
                    policyKind: 'creation',
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
        expect(captured?.code).toBe('CREATION_POLICY_ACCEPTANCE_REQUIRED');
        expect(captured?.status).toBe(403);
        expect(captured?.message).toBe('Debes aceptar las normas de creación vigentes antes de continuar.');
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

    it('mapApiDetalleToPersonaje normaliza progresionLanzador actor-scoped', () => {
        const service = crearServicio({} as any);
        const personaje = (service as any).mapApiDetalleToPersonaje({
            i: 9,
            n: 'Aldric',
            clases: [
                { id: 186, nombre: 'Mago', nivel: 10, lanzaConjuros: true, caracteristicaLanzamiento: 'Inteligencia', modificadorLanzamiento: 3 },
                { id: 187, nombre: 'Archimago', nivel: 2, lanzaConjuros: false, caracteristicaLanzamiento: null, modificadorLanzamiento: null },
            ],
            ra: {
                Nombre: 'Humano',
                Ajuste_nivel: 0,
                Tamano: { Nombre: 'Mediano', Modificador_presa: 0 },
                Dgs_adicionales: { Cantidad: 0 },
            },
            progresionLanzador: {
                selecciones: [
                    { idClaseAplicada: '187', nivelClaseAplicado: '1', indiceAumento: '1', idClaseObjetivo: '186' },
                    { idClaseAplicada: 0, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 186 },
                ],
            },
        } as any) as Personaje;

        expect(personaje.desgloseClases).toEqual([
            { Id: 186, Nombre: 'Mago', Nivel: 10, Caracteristica_lanzamiento: 'Inteligencia', Nivel_lanzador: null, Conjuros_diarios: null, Puntos_poder: null },
            { Id: 187, Nombre: 'Archimago', Nivel: 2, Caracteristica_lanzamiento: null, Nivel_lanzador: null, Conjuros_diarios: null, Puntos_poder: null },
        ]);
        expect(personaje.ProgresionLanzador).toEqual({
            selecciones: [
                { idClaseAplicada: 187, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 186 },
            ],
        });
        expect(personaje.Niveles_lanzador).toEqual([]);
    });

});
