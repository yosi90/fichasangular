import { Auth, User } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UserService } from './user.service';

class UserServiceTestDouble extends UserService {
    private authHandler?: ((firebaseUser: User | null) => void) | null;
    private aclByUid = new Map<string, any>();
    private aclWatchers = new Map<string, { onData: (rawAcl: any) => void; onError: () => void; }>();
    private registerError: any = null;
    private loginError: any = null;
    private resetError: any = null;
    private googleError: any = null;
    signOutCalls = 0;
    persistProfileCalls = 0;
    registerCalls: Array<{ email: string; password: string; }> = [];
    loginCalls: Array<{ email: string; password: string; }> = [];
    resetCalls: string[] = [];

    constructor() {
        super(
            {} as Auth,
            {} as Database,
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

class UserServiceProfileBootstrapTestDouble extends UserService {
    private authHandler?: ((firebaseUser: User | null) => void) | null;
    private readonly authStub: { currentUser: User | null; };
    private aclRaw: any = null;
    private aclOnData?: (rawAcl: any) => void;

    constructor(
        private apiMock: { getMyProfile: jasmine.Spy; },
        private firestoreMock?: { watchMyProfile: jasmine.Spy; }
    ) {
        const authStub = { currentUser: null as User | null };
        super(
            authStub as unknown as Auth,
            {} as Database,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            apiMock as any,
            firestoreMock as any,
        );
        this.authStub = authStub;
    }

    protected override subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        this.authHandler = handler;
    }

    protected override persistUserProfile(_: User): Promise<void> {
        return Promise.resolve();
    }

    protected override watchAclPath(_: string, onData: (rawAcl: any) => void, __: () => void): () => void {
        this.aclOnData = onData;
        onData(this.aclRaw);
        return () => undefined;
    }

    emitAuth(firebaseUser: User | null): void {
        this.authStub.currentUser = firebaseUser;
        this.authHandler?.(firebaseUser);
    }

    emitFirestoreProfile(profile: any): void {
        const lastCall = this.firestoreMock?.watchMyProfile.calls.mostRecent();
        const next = lastCall?.args?.[0];
        if (typeof next === 'function')
            next(profile);
    }

    emitAcl(rawAcl: any): void {
        this.aclRaw = rawAcl;
        this.aclOnData?.(rawAcl);
    }

    async flush(): Promise<void> {
        await Promise.resolve();
        await Promise.resolve();
    }
}

function buildPrivateProfile(overrides: Partial<any> = {}): any {
    return {
        uid: 'uid-1',
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
        permissions: {},
        compliance: null,
        ...overrides,
    };
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

    it('la hidratacion no depende de un upsert API para conservar permisos admin desde RTDB', async () => {
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

    it('ban temporal actor-scoped mantiene la sesión y bloquea el uso normal', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-compliance-ban', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-compliance-ban',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-compliance-ban',
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
            },
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 9,
                    kind: 'ban',
                    code: 'manual-ban',
                    name: 'Ban temporal',
                    startsAtUtc: '2026-04-02T09:00:00Z',
                    endsAtUtc: '2999-04-02T10:00:00Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        });
        await service.flush();

        expect(service.signOutCalls).toBe(0);
        expect(service.getAccessRestriction('usage')).toBe('temporaryBan');
        expect(service.getAccessRestrictionMessage('usage')).toContain('restringida temporalmente');
        expect(service.getCurrentCompliance()?.banned).toBeTrue();
    });

    it('ban permanente actor-scoped sigue forzando logout', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-compliance-ban-permanent', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-compliance-ban-permanent',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-compliance-ban-permanent',
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
            },
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 10,
                    kind: 'ban',
                    code: 'manual-ban-permanent',
                    name: 'Ban permanente',
                    startsAtUtc: '2026-04-02T09:00:00Z',
                    endsAtUtc: null,
                    isPermanent: true,
                },
                usage: null,
                creation: null,
            },
        });
        await service.flush();

        expect(service.signOutCalls).toBeGreaterThan(0);
        expect(service.getCurrentBanStatus().restriction).toBe('permanentBan');
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

    it('bloquea creación cuando compliance exige aceptar normas de creación sin cerrar la sesión', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-must-create', {
            roles: { admin: false, type: 'master' },
            status: { banned: false },
            permissions: {
                campanas: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-must-create',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-must-create',
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
            role: 'master',
            permissions: {
                campanas: { create: true },
            },
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });

        expect(service.canProceed('usage')).toBeTrue();
        expect(service.canProceed('creation')).toBeFalse();
        expect(service.can('campanas', 'create')).toBeFalse();
        expect(service.getPermissionDeniedMessage()).toBe('Debes aceptar las normas de creación vigentes antes de continuar.');
        expect(service.signOutCalls).toBe(0);
    });

    it('bloquea uso normal cuando compliance exige aceptar normas de uso', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-must-usage', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {
                personajes: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-must-usage',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-must-usage',
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
            },
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });

        expect(service.canProceed('usage')).toBeFalse();
        expect(service.can('personajes', 'create')).toBeFalse();
        expect(service.getAccessRestriction('usage')).toBe('mustAcceptUsage');
        expect(service.getAccessRestrictionMessage('usage')).toBe('Debes aceptar las normas de uso vigentes antes de continuar.');
        expect(service.signOutCalls).toBe(0);
    });

    it('getComplianceErrorMessage traduce mustAcceptCreation desde el código funcional', () => {
        const service = new UserServiceTestDouble();

        expect(service.getComplianceErrorMessage({ code: 'mustAcceptCreation', status: 403 }, 'creation')).toBe(
            'Debes aceptar las normas de creación vigentes antes de continuar.'
        );
    });

    it('getComplianceErrorMessage traduce los códigos canónicos nuevos de aceptación de políticas', () => {
        const service = new UserServiceTestDouble();

        expect(service.getComplianceErrorMessage({ code: 'USAGE_POLICY_ACCEPTANCE_REQUIRED', status: 403 }, 'usage')).toBe(
            'Debes aceptar las normas de uso vigentes antes de continuar.'
        );
        expect(service.getComplianceErrorMessage({ code: 'CREATION_POLICY_ACCEPTANCE_REQUIRED', status: 403 }, 'creation')).toBe(
            'Debes aceptar las normas de creación vigentes antes de continuar.'
        );
    });

    it('getComplianceErrorMessage usa el restriction local como fallback en 403 opacos', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-must-usage-fallback', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {
                personajes: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-must-usage-fallback',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-must-usage-fallback',
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
            },
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });

        expect(service.getComplianceErrorMessage({ status: 403 }, 'usage')).toBe(
            'Debes aceptar las normas de uso vigentes antes de continuar.'
        );
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

    it('prioriza el rol ACL sobre el perfil privado y completa permisos faltantes desde ACL', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-role-sync', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {
                personajes: { create: true },
                campanas: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-role-sync',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-role-sync',
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
            role: 'master',
            permissions: {
                personajes: { create: true },
            },
        });

        expect(service.getCurrentRole()).toBe('jugador');
        expect(service.CurrentPrivateProfile?.role).toBe('jugador');
        expect(service.CurrentPrivateProfile?.permissions['campanas']?.create).toBeTrue();
        expect(service.CurrentPrivateProfile?.permissions['personajes']?.create).toBeTrue();
    });

    it('prioriza el rol ACL cuando el perfil privado actor-scoped llega degradado', async () => {
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

        service.setCurrentPrivateProfile({
            uid: 'uid-admin',
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
            permissions: {},
        });

        expect(service.getCurrentRole()).toBe('admin');
        expect(service.CurrentPrivateProfile?.role).toBe('admin');
    });

    it('no eleva a admin desde el perfil privado si el ACL activo ya marca otro rol', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-admin-stale', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: {
                personajes: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-admin-stale',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-admin-stale',
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
            role: 'admin',
            permissions: {
                personajes: { create: true },
            },
        });

        expect(service.getCurrentRole()).toBe('jugador');
        expect(service.CurrentPrivateProfile?.role).toBe('jugador');
        expect(service.Usuario.permisos).toBe(0);
    });

    it('hidrata compliance actor-scoped desde API al iniciar sesión aunque exista Firestore', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: {
                    banned: false,
                    mustAcceptUsage: true,
                    mustAcceptCreation: false,
                    activeSanction: null,
                    usage: { version: '4' },
                    creation: null,
                },
            })),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({ compliance: null }));
                return () => undefined;
            }),
        };
        const service = new UserServiceProfileBootstrapTestDouble(apiMock, firestoreMock);

        service.emitAuth({
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(apiMock.getMyProfile).toHaveBeenCalled();
        expect(service.CurrentPrivateProfile?.compliance?.mustAcceptUsage).toBeTrue();
    });

    it('conserva compliance ya hidratado si Firestore reemite un perfil sin ese bloque', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: {
                    banned: false,
                    mustAcceptUsage: false,
                    mustAcceptCreation: true,
                    activeSanction: null,
                    usage: null,
                    creation: { version: '2' },
                },
            })),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({ compliance: null }));
                return () => undefined;
            }),
        };
        const service = new UserServiceProfileBootstrapTestDouble(apiMock, firestoreMock);

        service.emitAuth({
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        const firestoreProfile = buildPrivateProfile({
            displayName: 'Aldric actualizado',
        });
        delete firestoreProfile.compliance;
        service.emitFirestoreProfile(firestoreProfile);
        await service.flush();

        expect(service.CurrentPrivateProfile?.displayName).toBe('Aldric actualizado');
        expect(service.CurrentPrivateProfile?.compliance?.mustAcceptCreation).toBeTrue();
    });

    it('limpia compliance vieja cuando Firestore reemite null explícito', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: {
                    banned: false,
                    mustAcceptUsage: false,
                    mustAcceptCreation: true,
                    activeSanction: null,
                    usage: null,
                    creation: { version: '2' },
                },
            })),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({ compliance: null }));
                return () => undefined;
            }),
        };
        const service = new UserServiceProfileBootstrapTestDouble(apiMock, firestoreMock);

        service.emitAuth({
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.emitFirestoreProfile(buildPrivateProfile({
            displayName: 'Aldric actualizado',
            compliance: null,
        }));
        await service.flush();

        expect(service.CurrentPrivateProfile?.displayName).toBe('Aldric actualizado');
        expect(service.CurrentPrivateProfile?.compliance).toBeNull();
    });

    it('ignora un ACL legacy stale cuando la capa actor-scoped ya no marca ban', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: null,
            })),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({ compliance: null }));
                return () => undefined;
            }),
        };
        const service = new UserServiceProfileBootstrapTestDouble(apiMock, firestoreMock);

        service.emitAcl({
            roles: { admin: false, type: 'jugador' },
            status: { banned: true },
            permissions: {
                personajes: { create: true },
            },
        });
        service.emitAuth({
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        expect(service.getCurrentBanStatus().restriction).toBeNull();
        expect(service.canProceed('usage')).toBeTrue();
    });

    it('descarta sanciones temporales ya expiradas al calcular la restricción efectiva', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-expired-ban', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-expired-ban',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-expired-ban',
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
            },
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 11,
                    kind: 'ban',
                    code: 'manual-ban-expired',
                    name: 'Ban temporal',
                    startsAtUtc: '2026-04-02T09:00:00Z',
                    endsAtUtc: '2000-04-02T10:00:00Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        });
        await service.flush();

        expect(service.getCurrentBanStatus().restriction).toBeNull();
        expect(service.getAccessRestriction('usage')).toBeNull();
        expect(service.signOutCalls).toBe(0);
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
