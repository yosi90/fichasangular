import { of } from 'rxjs';
import { FirebaseInjectionContextService } from '../firebase-injection-context.service';
import { ListaPersonajesService } from './lista-personajes.service';

const firebaseContextMock = {
    run: <T>(fn: () => T) => fn(),
} as FirebaseInjectionContextService;

describe('ListaPersonajesService', () => {
    it('getPersonajes usa API actor-scoped con Bearer', async () => {
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
            jasmine.stringMatching(/personajes\/simplificados$/),
            jasmine.objectContaining({
                headers: jasmine.anything(),
            })
        );
        const options = httpMock.get.calls.mostRecent().args[1];
        expect(options.headers.get('Authorization')).toBe('Bearer token');
        expect(personajes[0].ownerUid).toBe('uid-1');
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

        expect(personajes).toHaveSize(1);
        expect(personajes[0].Id).toBe(1);
        expect(personajes[0].Nombre).toBe('Visible sin campaña');
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
});
