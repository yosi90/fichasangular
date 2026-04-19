import { Auth } from '@angular/fire/auth';
import { PrivateUserFirestoreService } from './private-user-firestore.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

describe('PrivateUserFirestoreService', () => {
    it('getMyProfile acepta role top-level y permisos create proyectados en campos raiz', async () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );
        spyOn<any>(service, 'getDocumentRef').and.returnValue({} as any);
        spyOn<any>(service, 'readDocument').and.resolveTo({
            exists: () => true,
            data: () => ({
                uid: 'uid-firestore',
                displayName: 'Perfil Firestore',
                email: 'perfil@test.dev',
                role: 'master',
                personajes: { create: true },
                campanas: { create: true },
                tramas: { create: true },
            }),
        } as any);

        const profile = await service.getMyProfile();

        expect(profile?.role).toBe('master');
        expect(profile?.permissions['personajes']?.create).toBeTrue();
        expect(profile?.permissions['campanas']?.create).toBeTrue();
        expect(profile?.permissions['tramas']?.create).toBeTrue();
    });

    it('getMyProfile sintetiza la sanción activa desde moderationStatus y blockedUntilUtc en compliance', async () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );
        spyOn<any>(service, 'getDocumentRef').and.returnValue({} as any);
        spyOn<any>(service, 'readDocument').and.resolveTo({
            exists: () => true,
            data: () => ({
                uid: 'uid-firestore',
                displayName: 'Perfil Firestore',
                email: 'perfil@test.dev',
                compliance: {
                    banned: false,
                    moderationStatus: 'blocked',
                    blockedUntilUtc: '2026-04-08T20:00:00.000Z',
                    isPermanent: false,
                    mustAcceptUsage: false,
                    mustAcceptCreation: false,
                },
            }),
        } as any);

        const profile = await service.getMyProfile();

        expect(profile?.compliance?.banned).toBeTrue();
        expect(profile?.compliance?.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            code: 'technical_account_restriction_temporary',
            endsAtUtc: '2026-04-08T20:00:00.000Z',
            isPermanent: false,
        }));
    });

    it('normaliza solicitudes de amistad con aliases del id canonico', () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );

        const request = (service as any).mapFriendRequestItem({
            friendRequestId: '58',
            direction: 'incoming',
            status: 'pending',
            requester: {
                senderUid: 'uid-sender',
                displayName: 'Remitente',
                photoThumbUrl: null,
                allowDirectMessagesFromNonFriends: true,
            },
        }, 'uid-sender', 'received');

        expect(request).toEqual(jasmine.objectContaining({
            requestId: 58,
            direction: 'received',
            status: 'pending',
            target: jasmine.objectContaining({
                uid: 'uid-sender',
                displayName: 'Remitente',
            }),
        }));
    });

    it('usa el docId de solicitud cuando requestId proyectado llega vacio', () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );

        const request = (service as any).mapFriendRequestItem({
            requestId: '',
            targetUid: 'uid-target',
            displayName: 'Destino',
        }, '61', 'sent');

        expect(request?.requestId).toBe(61);
        expect(request?.target.uid).toBe('uid-target');
    });

    it('normaliza personajes privados archivados con la clave canonica en minúsculas', () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );

        const personaje = (service as any).mapCharacter({
            Id: 42,
            Nombre: 'Archivado Firestore',
            archivado: true,
        }, '42');

        expect(personaje?.Archivado).toBeTrue();
    });

    it('prioriza archivado sobre alias legacy a en personajes privados', () => {
        const service = new PrivateUserFirestoreService(
            {
                currentUser: {
                    uid: 'uid-firestore',
                    email: 'perfil@test.dev',
                    displayName: 'Perfil Firestore',
                    emailVerified: true,
                    providerData: [],
                },
            } as unknown as Auth,
            {} as any,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );

        const personaje = (service as any).mapCharacter({
            Id: 43,
            Nombre: 'Archivado canonico',
            archivado: false,
            a: true,
        }, '43');

        expect(personaje?.Archivado).toBeFalse();
    });
});
