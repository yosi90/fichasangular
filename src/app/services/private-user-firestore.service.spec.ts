import { Auth } from '@angular/fire/auth';
import { PrivateUserFirestoreService } from './private-user-firestore.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

describe('PrivateUserFirestoreService', () => {
    function crearServicio(): PrivateUserFirestoreService {
        return new PrivateUserFirestoreService(
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
    }

    it('el perfil acepta role top-level y permisos create proyectados en campos raiz', () => {
        const profile = (crearServicio() as any).mapPrivateProfile({
            uid: 'uid-firestore',
            displayName: 'Perfil Firestore',
            role: 'master',
            personajes: { create: true },
            campanas: { create: true },
            tramas: { create: true },
        }, 'uid-firestore');

        expect(profile?.role).toBe('master');
        expect(profile?.permissions['personajes']?.create).toBeTrue();
        expect(profile?.permissions['campanas']?.create).toBeTrue();
        expect(profile?.permissions['tramas']?.create).toBeTrue();
    });

    it('el perfil solo trae lo que proyecta el backend: sin cumplimiento ni campos retirados', () => {
        const profile = (crearServicio() as any).mapPrivateProfile({
            uid: 'uid-firestore',
            displayName: 'Perfil Firestore',
            photoThumbUrl: 'https://cuentas/avatar',
            email: 'perfil@test.dev',
            bio: 'Antigua',
            authProvider: 'google',
            compliance: { banned: true, moderationStatus: 'blocked' },
        }, 'uid-firestore');

        expect(profile).toEqual({
            uid: 'uid-firestore',
            displayName: 'Perfil Firestore',
            photoThumbUrl: 'https://cuentas/avatar',
            createdAt: null,
            lastSeenAt: null,
            role: jasmine.any(String),
            permissions: jasmine.any(Object),
            compliance: null,
        });
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
