import { Auth, User } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { UsuarioUpsertRequestDto, UsuarioUpsertResponseDto } from '../interfaces/usuarios-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UserService } from './user.service';
import { UsuariosApiService } from './usuarios-api.service';

class UserServiceTestDouble extends UserService {
    private authHandler?: ((firebaseUser: User | null) => void) | null;
    private upsertError: Error | null = null;
    private aclByUid = new Map<string, any>();
    private aclWatchers = new Map<string, { onData: (rawAcl: any) => void; onError: () => void; }>();

    upsertPayloads: UsuarioUpsertRequestDto[] = [];
    signOutCalls = 0;
    persistProfileCalls = 0;

    constructor() {
        super(
            {} as Auth,
            {} as Database,
            {} as UsuariosApiService,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService
        );
    }

    protected override subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        this.authHandler = handler;
    }

    protected override ejecutarSignOut(): Promise<void> {
        this.signOutCalls += 1;
        return Promise.resolve();
    }

    protected override async upsertUserApi(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        this.upsertPayloads.push(payload);
        if (this.upsertError)
            throw this.upsertError;

        return {
            status: 'created',
            userId: 'user-id-1',
            uid: `${payload.uid ?? payload.firebaseUid ?? ''}`,
            acl: {
                uid: `${payload.uid ?? payload.firebaseUid ?? ''}`,
                role: payload.role ?? 'jugador',
                admin: payload.role === 'admin',
                banned: payload.banned === true,
                permissionsCreate: payload.permissionsCreate ?? [],
            },
        };
    }

    protected override watchAclPath(uid: string, onData: (rawAcl: any) => void, onError: () => void): () => void {
        this.aclWatchers.set(uid, { onData, onError });
        onData(this.aclByUid.get(uid) ?? null);
        return () => {
            const watcher = this.aclWatchers.get(uid);
            if (watcher?.onData === onData)
                this.aclWatchers.delete(uid);
        };
    }

    protected override persistUserProfile(_: User): Promise<void> {
        this.persistProfileCalls += 1;
        return Promise.resolve();
    }

    emitAuth(firebaseUser: User | null): void {
        this.authHandler?.(firebaseUser);
    }

    emitAcl(uid: string, rawAcl: any): void {
        this.aclByUid.set(uid, rawAcl);
        this.aclWatchers.get(uid)?.onData(rawAcl);
    }

    emitAclError(uid: string): void {
        this.aclWatchers.get(uid)?.onError();
    }

    setUpsertError(error: Error | null): void {
        this.upsertError = error;
    }

    async flush(): Promise<void> {
        await Promise.resolve();
        await Promise.resolve();
    }
}

describe('UserService', () => {
    it('actualiza usuario e isLoggedIn desde cambios de auth', async () => {
        const service = new UserServiceTestDouble();
        let loggedIn = false;
        service.isLoggedIn$.subscribe((value) => loggedIn = value);

        service.emitAcl('uid-1', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.Usuario.nombre).toBe('Aldric');
        expect(service.Usuario.correo).toBe('aldric@test.com');
        expect(loggedIn).toBeTrue();
        expect(service.upsertPayloads.length).toBe(1);
        expect(service.persistProfileCalls).toBe(1);
    });

    it('mantiene permisos en 0 cuando ACL de RTDB no existe', async () => {
        const service = new UserServiceTestDouble();
        service.emitAuth({
            uid: 'uid-2',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.Usuario.permisos).toBe(0);
    });

    it('asigna permisos admin cuando ACL RTDB devuelve admin', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-admin', {
            roles: { admin: true, type: 'admin' },
            status: { banned: false },
            permissions: {},
        });
        service.emitAuth({
            uid: 'uid-admin',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.Usuario.permisos).toBe(1);
    });

    it('actualiza permisos en caliente cuando cambia ACL en RTDB', async () => {
        const service = new UserServiceTestDouble();
        const capturados: number[] = [];
        service.permisos$.subscribe((value) => capturados.push(value));

        service.emitAcl('uid-dinamico', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-dinamico',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.emitAcl('uid-dinamico', {
            roles: { admin: true, type: 'admin' },
            status: { banned: false },
            permissions: {},
        });
        await service.flush();

        service.emitAcl('uid-dinamico', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        await service.flush();

        expect(service.Usuario.permisos).toBe(0);
        expect(capturados).toContain(1);
        expect(capturados[capturados.length - 1]).toBe(0);
    });

    it('fallo de upsert API no tumba permisos si ACL RTDB es admin', async () => {
        const service = new UserServiceTestDouble();
        service.setUpsertError(new Error('api down'));
        service.emitAcl('uid-admin', {
            roles: { admin: true, type: 'admin' },
            status: { banned: false },
            permissions: {},
        });

        service.emitAuth({
            uid: 'uid-admin',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.Usuario.permisos).toBe(1);
    });

    it('ban en ACL RTDB fuerza logout de la sesión activa', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-ban', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-ban',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.emitAcl('uid-ban', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: true },
            permissions: { personajes: { create: true } },
        });
        await service.flush();

        expect(service.signOutCalls).toBeGreaterThan(0);
    });

    it('rol jugador respeta permisos create del ACL', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-rol-jugador', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {
                personajes: { create: false },
                campanas: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-rol-jugador',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.can('personajes', 'create')).toBeFalse();
        expect(service.can('campanas', 'create')).toBeTrue();
    });

    it('rol colaborador permite permisos create adicionales', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-rol-colaborador', {
            roles: { admin: false, type: 'colaborador' },
            status: { banned: false },
            permissions: {
                personajes: { create: true },
                dotes: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-rol-colaborador',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.can('personajes', 'create')).toBeTrue();
        expect(service.can('dotes', 'create')).toBeTrue();
    });

    it('logOut delega en signOut cuando hay sesión abierta', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-3', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-3',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);

        await service.logOut();

        expect(service.signOutCalls).toBe(1);
    });

    it('usa permisos del perfil privado como fallback si el ACL todavía no está en RTDB', async () => {
        const service = new UserServiceTestDouble();
        service.emitAuth({
            uid: 'uid-profile-fallback',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-profile-fallback',
            displayName: 'Aldric',
            email: 'aldric@test.com',
            emailVerified: true,
            authProvider: 'correo',
            photoUrl: null,
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {
                personajes: { create: true },
                campanas: { create: true },
            },
        });

        expect(service.can('personajes', 'create')).toBeTrue();
        expect(service.can('campanas', 'create')).toBeTrue();
    });
});
