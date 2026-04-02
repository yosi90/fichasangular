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
});
