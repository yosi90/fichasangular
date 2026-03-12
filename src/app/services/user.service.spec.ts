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
    private registerError: any = null;
    private loginError: any = null;
    private resetError: any = null;
    private googleError: any = null;

    upsertPayloads: UsuarioUpsertRequestDto[] = [];
    signOutCalls = 0;
    persistProfileCalls = 0;
    registerCalls: Array<{ email: string; password: string; }> = [];
    loginCalls: Array<{ email: string; password: string; }> = [];
    resetCalls: string[] = [];

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

    protected override authCreateUserWithEmailAndPassword(email: string, password: string): Promise<any> {
        this.registerCalls.push({ email, password });
        if (this.registerError)
            return Promise.reject(this.registerError);
        return Promise.resolve({ user: { uid: 'uid-register' } });
    }

    protected override authSignInWithEmailAndPassword(email: string, password: string): Promise<any> {
        this.loginCalls.push({ email, password });
        if (this.loginError)
            return Promise.reject(this.loginError);
        return Promise.resolve({ user: { uid: 'uid-login' } });
    }

    protected override authSignInWithPopup(): Promise<any> {
        if (this.googleError)
            return Promise.reject(this.googleError);
        return Promise.resolve({ user: { uid: 'uid-google' } });
    }

    protected override authSendPasswordResetEmail(email: string): Promise<void> {
        this.resetCalls.push(email);
        if (this.resetError)
            return Promise.reject(this.resetError);
        return Promise.resolve();
    }

    protected override async upsertUserApi(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        this.upsertPayloads.push(payload);
        if (this.upsertError)
            throw this.upsertError;

        return {
            status: 'created',
            userId: 'user-id-1',
            uid: `${payload.uid ?? ''}`,
            acl: {
                uid: `${payload.uid ?? ''}`,
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

    setRegisterError(error: any): void {
        this.registerError = error;
    }

    setLoginError(error: any): void {
        this.loginError = error;
    }

    setResetError(error: any): void {
        this.resetError = error;
    }

    setGoogleError(error: any): void {
        this.googleError = error;
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
            bio: null,
            genderIdentity: null,
            pronouns: null,
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

    it('register traduce email-already-in-use a un mensaje de usuario', async () => {
        const service = new UserServiceTestDouble();
        service.setRegisterError({ code: 'auth/email-already-in-use' });

        await expectAsync(service.register({ email: 'aldric@test.com', password: '12345678' }) as Promise<any>)
            .toBeRejectedWithError('Ese correo ya está registrado.');
        expect(service.registerCalls).toEqual([{ email: 'aldric@test.com', password: '12345678' }]);
    });

    it('loginEmailPass traduce invalid-credential a credenciales incorrectas', async () => {
        const service = new UserServiceTestDouble();
        service.setLoginError({ code: 'auth/invalid-credential' });

        await expectAsync(service.loginEmailPass({ email: 'aldric@test.com', password: '12345678' }) as Promise<any>)
            .toBeRejectedWithError('Las credenciales no son correctas.');
        expect(service.loginCalls).toEqual([{ email: 'aldric@test.com', password: '12345678' }]);
    });

    it('loginEmailPass traduce too-many-requests', async () => {
        const service = new UserServiceTestDouble();
        service.setLoginError({ code: 'auth/too-many-requests' });

        await expectAsync(service.loginEmailPass({ email: 'aldric@test.com', password: '12345678' }) as Promise<any>)
            .toBeRejectedWithError('Demasiados intentos. Inténtalo de nuevo más tarde.');
    });

    it('requestPasswordReset llama a Firebase con el email normalizado', async () => {
        const service = new UserServiceTestDouble();

        await service.requestPasswordReset('  aldric@test.com  ');

        expect(service.resetCalls).toEqual(['aldric@test.com']);
    });

    it('requestPasswordReset no falla si Firebase responde user-not-found', async () => {
        const service = new UserServiceTestDouble();
        service.setResetError({ code: 'auth/user-not-found' });

        await expectAsync(service.requestPasswordReset('aldric@test.com')).toBeResolved();
    });

    it('requestPasswordReset traduce errores de red a mensaje usable', async () => {
        const service = new UserServiceTestDouble();
        service.setResetError({ code: 'auth/network-request-failed' });

        await expectAsync(service.requestPasswordReset('aldric@test.com'))
            .toBeRejectedWithError('No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.');
    });

    it('getPermissionDeniedMessage invita a registrarse cuando no hay sesión', () => {
        const service = new UserServiceTestDouble();

        expect(service.getPermissionDeniedMessage()).toBe(
            'No dispones de los permisos necesarios para realizar esta acción. Regístrate o inicia sesión para poder solicitar acceso.'
        );
    });

    it('getPermissionDeniedMessage sugiere pedir rol master para jugadores', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-jugador', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {},
        });
        service.emitAuth({
            uid: 'uid-jugador',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.getPermissionDeniedMessage()).toBe(
            'No dispones de los permisos necesarios para realizar esta acción. Puedes solicitar convertirte en master desde tu perfil.'
        );
    });

    it('getPermissionDeniedMessage sugiere pedir rol colaborador para masters', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-master', {
            roles: { admin: false, type: 'master' },
            status: { banned: false },
            permissions: {},
        });
        service.emitAuth({
            uid: 'uid-master',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.getPermissionDeniedMessage()).toBe(
            'No dispones de los permisos necesarios para realizar esta acción. Puedes solicitar convertirte en colaborador desde tu perfil.'
        );
    });
});
