import { of } from 'rxjs';
import { FirebaseInjectionContextService } from '../firebase-injection-context.service';
import { ListaPersonajesService } from './lista-personajes.service';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

class ListaPersonajesServiceAuthTestDouble extends ListaPersonajesService {
    authHandler: ((firebaseUser: any) => void) | null = null;

    protected override subscribeAuthState(handler: (firebaseUser: any) => void): () => void {
        this.authHandler = handler;
        return () => undefined;
    }
}

describe('ListaPersonajesService', () => {
    it('getPersonajes usa API detallada actor-scoped con Bearer', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([{
                i: 1,
                n: 'Aldric',
                ownerUid: 'uid-1',
                ownerDisplayName: 'Aldric Owner',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            }])),
        };

        const service = new ListaPersonajesService(
            { currentUser: { getIdToken: async () => 'token' } } as any,
            {} as any,
            httpMock as any,
            firebaseContextMock
        );

        const observable = await service.getPersonajes();
        const personajes = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(httpMock.get).toHaveBeenCalledWith(
            jasmine.stringMatching(/personajes$/),
            jasmine.objectContaining({
                headers: jasmine.anything(),
            })
        );
        const options = httpMock.get.calls.mostRecent().args[1];
        expect(options.headers.get('Authorization')).toBe('Bearer token');
        expect(personajes[0].ownerUid).toBe('uid-1');
    });

    it('getPersonajes mapea el contrato detallado de GET /personajes a PersonajeSimple', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([{
                i: 5,
                n: 'Seraphina',
                ownerUid: 'uid-5',
                ownerDisplayName: 'Seraphina Owner',
                visible_otros_usuarios: true,
                id_region: 3,
                ra: { Id: 9, Nombre: 'Elfa' },
                cla: 'Maga 5 | Archimaga 1',
                dcp: 'Curiosa y metódica',
                dh: 'Bibliotecaria de Myth Drannor',
                ncam: 'Costa de la Espada',
                ntr: 'Torre eclipsada',
                nst: 'Archivo hundido',
                archivado: false,
            }])),
        };

        const service = new ListaPersonajesService(
            { currentUser: { getIdToken: async () => 'token' } } as any,
            {} as any,
            httpMock as any,
            firebaseContextMock
        );

        const observable = await service.getPersonajes();
        const personajes = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(personajes).toHaveSize(1);
        expect(personajes[0]).toEqual(jasmine.objectContaining({
            Id: 5,
            Nombre: 'Seraphina',
            ownerUid: 'uid-5',
            ownerDisplayName: 'Seraphina Owner',
            Clases: 'Maga 5 | Archimaga 1',
            Personalidad: 'Curiosa y metódica',
            Contexto: 'Bibliotecaria de Myth Drannor',
            Campana: 'Costa de la Espada',
            Trama: 'Torre eclipsada',
            Subtrama: 'Archivo hundido',
            Archivado: false,
        }));
        expect(personajes[0].Raza).toEqual(jasmine.objectContaining({ Id: 9, Nombre: 'Elfa' }));
        expect(personajes[0].Region).toEqual({ Id: 3, Nombre: '' });
    });

    it('getPersonajes combina listado público y Firestore privado para autenticados y deduplica por Id', async () => {
        const privateFirestoreMock = {
            listCharacters: jasmine.createSpy('listCharacters').and.resolveTo([
                {
                    Id: 7,
                    Nombre: 'Mi versión privada',
                    ownerUid: 'uid-own',
                    ownerDisplayName: 'Dueño',
                    visible_otros_usuarios: false,
                    Id_region: 2,
                    Region: { Id: 2, Nombre: 'Cormyr' },
                    Raza: { Id: 1, Nombre: 'Humano' },
                    Clases: 'Clérigo 4',
                    Contexto: 'Privado',
                    Personalidad: 'Reservado',
                    Campana: 'Sin campaña',
                    Trama: 'Trama base',
                    Subtrama: 'Subtrama base',
                    Archivado: false,
                },
                {
                    Id: 8,
                    Nombre: 'Solo privado',
                    ownerUid: 'uid-own',
                    ownerDisplayName: 'Dueño',
                    visible_otros_usuarios: false,
                    Id_region: 0,
                    Region: { Id: 0, Nombre: 'Sin región' },
                    Raza: { Id: 1, Nombre: 'Humano' },
                    Clases: 'Mago 2',
                    Contexto: 'Privado',
                    Personalidad: 'Analítico',
                    Campana: 'Sin campaña',
                    Trama: 'Trama base',
                    Subtrama: 'Subtrama base',
                    Archivado: false,
                },
            ]),
            watchCharacters: jasmine.createSpy('watchCharacters').and.returnValue(() => undefined),
        };
        const service = new ListaPersonajesService(
            { currentUser: { uid: 'uid-own', getIdToken: async () => 'token' } } as any,
            {} as any,
            { get: jasmine.createSpy('get') } as any,
            firebaseContextMock,
            privateFirestoreMock as any
        );
        spyOn<any>(service, 'readPublicPersonajesFromCache').and.resolveTo([
            {
                Id: 7,
                Nombre: 'Versión pública',
                ownerUid: 'uid-own',
                ownerDisplayName: 'Dueño público',
                visible_otros_usuarios: true,
                Id_region: 1,
                Region: { Id: 1, Nombre: 'Aguas Profundas' },
                Raza: { Id: 1, Nombre: 'Humano' },
                Clases: 'Clérigo 3',
                Contexto: 'Público',
                Personalidad: 'Abierto',
                Campana: 'Sin campaña',
                Trama: 'Trama base',
                Subtrama: 'Subtrama base',
                Archivado: false,
            },
            {
                Id: 9,
                Nombre: 'Solo público',
                ownerUid: 'uid-otro',
                ownerDisplayName: 'Otra persona',
                visible_otros_usuarios: true,
                Id_region: 0,
                Region: { Id: 0, Nombre: 'Sin región' },
                Raza: { Id: 1, Nombre: 'Humano' },
                Clases: 'Guerrero 1',
                Contexto: 'Público',
                Personalidad: 'Directo',
                Campana: 'Sin campaña',
                Trama: 'Trama base',
                Subtrama: 'Subtrama base',
                Archivado: false,
            },
        ]);

        const observable = await service.getPersonajes();
        const personajes = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(privateFirestoreMock.listCharacters).toHaveBeenCalled();
        expect(personajes).toHaveSize(3);
        expect(personajes.find((item) => item.Id === 7)?.Nombre).toBe('Mi versión privada');
        expect(personajes.find((item) => item.Id === 9)?.Nombre).toBe('Solo público');
        expect(personajes.find((item) => item.Id === 8)?.Nombre).toBe('Solo privado');
    });

    it('la suscripción privada mantiene la parte pública del listado autenticado', async () => {
        let onNext: any = null;
        const privateFirestoreMock = {
            listCharacters: jasmine.createSpy('listCharacters').and.resolveTo([]),
            watchCharacters: jasmine.createSpy('watchCharacters').and.callFake((next: (personajes: any[]) => void) => {
                onNext = next;
                return () => undefined;
            }),
        };
        const service = new ListaPersonajesService(
            { currentUser: { uid: 'uid-own', getIdToken: async () => 'token' } } as any,
            {} as any,
            { get: jasmine.createSpy('get') } as any,
            firebaseContextMock,
            privateFirestoreMock as any
        );
        spyOn<any>(service, 'readPublicPersonajesFromCache').and.resolveTo([
            {
                Id: 22,
                Nombre: 'Publico estable',
                ownerUid: 'uid-otro',
                ownerDisplayName: 'Otra persona',
                visible_otros_usuarios: true,
                Id_region: 0,
                Region: { Id: 0, Nombre: 'Sin región' },
                Raza: { Id: 1, Nombre: 'Humano' },
                Clases: 'Bardo 1',
                Contexto: 'Público',
                Personalidad: 'Expresivo',
                Campana: 'Sin campaña',
                Trama: 'Trama base',
                Subtrama: 'Subtrama base',
                Archivado: false,
            },
        ]);

        await (service as any).reloadPersonajesForCurrentActor();
        expect(onNext).toBeTruthy();
        if (onNext) {
            onNext([
                {
                    Id: 33,
                    Nombre: 'Privado emitido',
                    ownerUid: 'uid-own',
                    ownerDisplayName: 'Yo',
                    visible_otros_usuarios: false,
                    Id_region: 0,
                    Region: { Id: 0, Nombre: 'Sin región' },
                    Raza: { Id: 1, Nombre: 'Humano' },
                    Clases: 'Explorador 1',
                    Contexto: 'Privado',
                    Personalidad: 'Cauto',
                    Campana: 'Sin campaña',
                    Trama: 'Trama base',
                    Subtrama: 'Subtrama base',
                    Archivado: false,
                },
            ]);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));

        const personajes = (service as any).personajesSubject.value;
        expect(personajes.find((item: any) => item.Id === 22)?.Nombre).toBe('Publico estable');
        expect(personajes.find((item: any) => item.Id === 33)?.Nombre).toBe('Privado emitido');
    });

    it('usa cache pública para invitados y no llama a la API', async () => {
        const httpMock = {
            get: jasmine.createSpy('get'),
        };

        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            httpMock as any,
            firebaseContextMock
        );
        const personajesInvitado = [{
            Id: 7,
            Nombre: 'Publico invitado',
            visible_otros_usuarios: true,
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Guerrero 1',
            Contexto: 'Contexto',
            Personalidad: 'Personalidad',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        }];
        const cacheSpy = spyOn<any>(service, 'readPublicPersonajesFromCache').and.resolveTo(personajesInvitado);
        const apiSpy = spyOn<any>(service, 'fetchPersonajesFromApi').and.callThrough();

        const observable = await service.getPersonajes();
        const personajes = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(cacheSpy).toHaveBeenCalled();
        expect(apiSpy).not.toHaveBeenCalled();
        expect(httpMock.get).not.toHaveBeenCalled();
        expect(personajes).toEqual(personajesInvitado);
    });

    it('filtra en cache pública solo personajes públicos sin campaña', async () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            '1': {
                i: 1,
                n: 'Visible sin campaña',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            },
            '2': {
                i: 2,
                n: 'Privado sin campaña',
                visible_otros_usuarios: false,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Pícaro 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            },
            '3': {
                i: 3,
                n: 'Visible con campaña',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Mago 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Campaña visible',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            },
        });

        const personajes = await (service as any).readPublicPersonajesFromCache();

        expect((service as any).readCacheSnapshot).toHaveBeenCalledWith('listado-personajes');
        expect(personajes).toHaveSize(1);
        expect(personajes[0].Id).toBe(1);
        expect(personajes[0].Nombre).toBe('Visible sin campaña');
    });

    it('acepta proyecciones públicas donde Campana llega como objeto', async () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            '1': {
                i: 1,
                n: 'Visible con contexto objeto',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                Campana: { Id: 0, Nombre: 'Sin campaña' },
                Trama: { Id: 0, Nombre: 'Trama base' },
                Subtrama: { Id: 0, Nombre: 'Subtrama base' },
                a: false,
            },
        });

        const personajes = await (service as any).readPublicPersonajesFromCache();

        expect(personajes).toHaveSize(1);
        expect(personajes[0].Campana).toBe('Sin campaña');
        expect(personajes[0].Trama).toBe('Trama base');
        expect(personajes[0].Subtrama).toBe('Subtrama base');
    });

    it('mapea payload legacy de Personajes-simples con nombres autodescriptivos', () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );

        const personaje = (service as any).mapApiToPersonajeSimple({
            Id_personaje: 44,
            Nombre: 'Sir Test',
            ownerUid: 'uid-44',
            ownerDisplayName: 'Owner',
            campaignId: 7,
            campaignName: 'Campaña A',
            accessReason: 'campaign_public',
            visible_otros_usuarios: true,
            Id_region: 3,
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Guerrero 2',
            Descripcion_historia: 'Veterano de frontera',
            Descripcion_personalidad: 'Serio',
            Campaña: 'Sin campaña',
            Trama: '',
            Subtrama: '',
            Archivado: false,
        });

        expect(personaje).toEqual(jasmine.objectContaining({
            Id: 44,
            Nombre: 'Sir Test',
            ownerUid: 'uid-44',
            ownerDisplayName: 'Owner',
            campaignId: 7,
            campaignName: 'Campaña A',
            accessReason: 'campaign_public',
            Id_region: 3,
            Clases: 'Guerrero 2',
            Contexto: 'Veterano de frontera',
            Personalidad: 'Serio',
            Campana: 'Sin campaña',
            Archivado: false,
        }));
    });

    it('filtra personajes archivados en cache pública aunque sean visibles', async () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            '1': {
                i: 1,
                n: 'Archivado visible',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: true,
            },
        });

        const personajes = await (service as any).readPublicPersonajesFromCache();

        expect(personajes).toEqual([]);
    });

    it('prioriza archivado sobre el alias legacy a en listados simplificados', async () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo({
            '1': {
                i: 1,
                n: 'Archivado canonico',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                archivado: false,
                a: true,
            },
        });

        const personajes = await (service as any).readPublicPersonajesFromCache();

        expect(personajes.length).toBe(1);
        expect(personajes[0].Archivado).toBeFalse();
    });

    it('actualizarArchivadoEnCache refleja el cambio en el listado cargado', () => {
        const service = new ListaPersonajesService(
            { currentUser: { getIdToken: async () => 'token' } } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        (service as any).personajesLoaded = true;
        (service as any).personajesSubject.next([{
            Id: 3,
            Nombre: 'Aldric',
            visible_otros_usuarios: true,
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Guerrero 1',
            Contexto: 'Contexto',
            Personalidad: 'Personalidad',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        }]);

        service.actualizarArchivadoEnCache(3, true);

        expect((service as any).personajesSubject.value[0].Archivado).toBeTrue();
    });

    it('reconstruye el Id desde el índice cuando Firebase devuelve un array', async () => {
        const service = new ListaPersonajesService(
            { currentUser: null } as any,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        spyOn<any>(service, 'readCacheSnapshot').and.resolveTo([
            null,
            {
                n: 'Visible en array',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            },
        ]);

        const personajes = await (service as any).readPublicPersonajesFromCache();

        expect(personajes).toHaveSize(1);
        expect(personajes[0].Id).toBe(1);
        expect(personajes[0].Nombre).toBe('Visible en array');
    });

    it('getPersonajes ignora aliases legacy de owner y usa solo el contrato canónico', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([{
                i: 1,
                n: 'Aldric',
                owner_uid: 'legacy-owner',
                uid: 'legacy-uid',
                owner_display_name: 'Legacy display',
                visible_otros_usuarios: true,
                r: { Id: 1, Nombre: 'Humano' },
                c: 'Guerrero 1',
                co: 'Contexto',
                p: 'Personalidad',
                ca: 'Sin campaña',
                t: 'Trama base',
                s: 'Subtrama base',
                a: false,
            }])),
        };

        const service = new ListaPersonajesService(
            { currentUser: { getIdToken: async () => 'token' } } as any,
            {} as any,
            httpMock as any,
            firebaseContextMock
        );

        const observable = await service.getPersonajes();
        const personajes = await new Promise<any[]>((resolve) => observable.subscribe(resolve));

        expect(personajes).toHaveSize(1);
        expect(personajes[0].ownerUid).toBeNull();
        expect(personajes[0].ownerDisplayName).toBeNull();
    });

    it('upsertPersonajeCreadoEnCache publica el personaje creado sin esperar al refresco remoto', () => {
        const service = new ListaPersonajesService(
            { currentUser: { getIdToken: async () => 'token' } } as any,
            {} as any,
            { get: jasmine.createSpy('get') } as any,
            firebaseContextMock
        );
        (service as any).personajesSubject.next([{
            Id: 1,
            Nombre: 'Existente',
            visible_otros_usuarios: false,
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Guerrero 1',
            Contexto: '',
            Personalidad: '',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        }]);

        service.upsertPersonajeCreadoEnCache({
            Id: 2,
            Nombre: 'Recien creado',
            Raza: { Id: 2, Nombre: 'Elfo' },
            Clases: 'Mago 1',
            Contexto: 'Contexto',
            Personalidad: 'Personalidad',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        });

        const personajes = (service as any).personajesSubject.value;
        expect((service as any).personajesLoaded).toBeTrue();
        expect(personajes.map((item: any) => item.Id).sort()).toEqual([1, 2]);
        expect(personajes.find((item: any) => item.Id === 2)?.Nombre).toBe('Recien creado');
    });

    it('recarga el listado cuando cambia la sesión de invitado a usuario autenticado', async () => {
        const authMock = { currentUser: null } as any;
        const service = new ListaPersonajesServiceAuthTestDouble(
            authMock,
            {} as any,
            {} as any,
            firebaseContextMock
        );
        (service as any).authReadyPromise = Promise.resolve();
        spyOn<any>(service, 'readPublicPersonajesFromCache').and.resolveTo([{
            Id: 7,
            Nombre: 'Publico invitado',
            visible_otros_usuarios: true,
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Guerrero 1',
            Contexto: 'Contexto',
            Personalidad: 'Personalidad',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        }]);
        spyOn<any>(service, 'fetchPersonajesFromApi').and.resolveTo([{
            Id: 9,
            Nombre: 'Visible para usuario',
            ownerUid: 'uid-9',
            ownerDisplayName: 'Owner',
            visible_otros_usuarios: true,
            Id_region: 0,
            Region: { Id: 0, Nombre: 'Sin región' },
            Raza: { Id: 1, Nombre: 'Humano' },
            Clases: 'Mago 1',
            Contexto: 'Contexto',
            Personalidad: 'Personalidad',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
        }]);

        const observable = await service.getPersonajes();
        const emisiones: any[][] = [];
        const sub = observable.subscribe((personajes) => emisiones.push(personajes));

        authMock.currentUser = { uid: 'uid-auth', getIdToken: async () => 'token' };
        service.authHandler?.(authMock.currentUser);
        await (service as any).reloadPersonajesForCurrentActor();

        expect(emisiones[0]?.[0]?.Nombre).toBe('Publico invitado');
        expect((service as any).personajesSubject.value.find((item: any) => item.Id === 9)?.Nombre).toBe('Visible para usuario');
        sub.unsubscribe();
    });
});
