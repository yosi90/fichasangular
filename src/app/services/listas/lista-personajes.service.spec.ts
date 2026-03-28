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
        expect((service as any).personajesSubject.value[0]?.Nombre).toBe('Visible para usuario');
        sub.unsubscribe();
    });
});
