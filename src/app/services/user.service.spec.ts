import { Auth, User } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UserService } from './user.service';
import { BehaviorSubject } from 'rxjs';
import { EstadoPlataforma } from './platform-session.service';

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

    protected override watchAclPath(uid: string, onData: (rawAcl: any) => void, onError: () => void): () => void {
        this.aclWatchers.set(uid, { onData, onError });
        onData(this.aclByUid.get(uid) ?? null);
        return () => {
            const watcher = this.aclWatchers.get(uid);
            if (watcher?.onData === onData)
                this.aclWatchers.delete(uid);
        };
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
    signOutCalls = 0;

    constructor(
        private apiMock: { getMyProfile: jasmine.Spy; getMyCompliance: jasmine.Spy; },
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

    it('ban en ACL RTDB ya no fuerza logout por sí solo sin activeSanction actor-scoped', async () => {
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

        expect(service.signOutCalls).toBe(0);
        expect(service.getCurrentBanStatus().restriction).toBeNull();
        expect(service.canProceed('usage')).toBeTrue();
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
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {},
        });

        expect(service.getCurrentRole()).toBe('admin');
        expect(service.CurrentPrivateProfile?.role).toBe('admin');
    });

    it('permite actualizar compliance canónico desde una mutación API sin esperar a Firestore', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: null,
            })),
            getMyCompliance: jasmine.createSpy('getMyCompliance').and.resolveTo({
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '4', accepted: false },
                creation: null,
            }),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({
                    compliance: {
                        banned: false,
                        mustAcceptUsage: true,
                        mustAcceptCreation: false,
                        activeSanction: null,
                        usage: { version: '4', accepted: false },
                        creation: null,
                    },
                }));
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

        service.setCurrentCompliance({
            banned: false,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: null,
            usage: {
                version: '4',
                accepted: true,
                acceptedAtUtc: '2026-04-08T10:00:00Z',
            },
            creation: null,
        } as any);

        expect(service.CurrentPrivateProfile?.compliance?.mustAcceptUsage).toBeFalse();
        expect(service.getAccessRestriction('usage')).toBeNull();
    });

    it('setCurrentCompliance activa la restricción temporal efectiva sin esperar a Firestore', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-abuse-lock', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-abuse-lock',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentCompliance({
            banned: true,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: {
                sanctionId: 77,
                kind: 'restriction',
                code: 'technical_account_restriction_temporary',
                name: 'Restricción temporal de cuenta',
                startsAtUtc: '2026-04-08T10:00:00Z',
                endsAtUtc: '2999-04-08T20:00:00Z',
                isPermanent: false,
            },
            usage: null,
            creation: null,
        });

        expect(service.getAccessRestriction('usage')).toBe('temporaryBan');
        expect(service.getCurrentBanStatus()).toEqual(jasmine.objectContaining({
            restriction: 'temporaryBan',
            isActiveNow: true,
            endsAtUtc: '2999-04-08T20:00:00Z',
        }));
        expect(service.signOutCalls).toBe(0);
    });

    it('trata una sanción activa temporal como restricción efectiva aunque backend marque banned=false', async () => {
        const service = new UserServiceTestDouble();
        service.emitAcl('uid-blocked-temp', {
            roles: { admin: false, type: 'jugador' },
            status: { banned: false },
            permissions: { personajes: { create: true } },
        });
        service.emitAuth({
            uid: 'uid-blocked-temp',
            displayName: 'Aldric',
            email: 'aldric@test.com',
        } as User);
        await service.flush();

        service.setCurrentPrivateProfile({
            uid: 'uid-blocked-temp',
            displayName: 'Aldric',
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {
                personajes: { create: true },
            },
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 13,
                    kind: 'restriction',
                    code: 'technical_account_restriction_temporary',
                    name: 'Restricción temporal de cuenta',
                    startsAtUtc: '2026-04-02T09:00:00Z',
                    endsAtUtc: '2999-04-02T10:11:00Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        });
        await service.flush();

        expect(service.getCurrentBanStatus()).toEqual(jasmine.objectContaining({
            restriction: 'temporaryBan',
            isActiveNow: true,
            endsAtUtc: '2999-04-02T10:11:00Z',
        }));
        expect(service.getAccessRestriction('usage')).toBe('temporaryBan');
        expect(service.signOutCalls).toBe(0);
    });

    it('ignora un ACL legacy stale cuando la capa actor-scoped ya no marca ban', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: null,
            })),
            getMyCompliance: jasmine.createSpy('getMyCompliance').and.resolveTo(null),
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

    it('ignora un compliance stale de Firestore si /me/compliance ya responde limpio', async () => {
        const apiMock = {
            getMyProfile: jasmine.createSpy('getMyProfile').and.resolveTo(buildPrivateProfile({
                compliance: {
                    banned: true,
                    mustAcceptUsage: false,
                    mustAcceptCreation: false,
                    activeSanction: null,
                    usage: null,
                    creation: null,
                },
            })),
            getMyCompliance: jasmine.createSpy('getMyCompliance').and.resolveTo(null),
        };
        const firestoreMock = {
            watchMyProfile: jasmine.createSpy('watchMyProfile').and.callFake((next: (profile: any) => void) => {
                next(buildPrivateProfile({
                    compliance: {
                        banned: true,
                        mustAcceptUsage: false,
                        mustAcceptCreation: false,
                        activeSanction: null,
                        usage: null,
                        creation: null,
                    },
                }));
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

        expect(service.signOutCalls).toBe(0);
        expect(service.getCurrentBanStatus().restriction).toBeNull();
        expect(service.canProceed('usage')).toBeTrue();
    });

    it('no infiere una restricción activa solo por una fecha vieja si backend ya marca banned=false y activeSanction=null', async () => {
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
            photoThumbUrl: null,
            createdAt: null,
            lastSeenAt: null,
            role: 'jugador',
            permissions: {
                personajes: { create: true },
            },
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        await service.flush();

        expect(service.getCurrentBanStatus().restriction).toBeNull();
        expect(service.getAccessRestriction('usage')).toBeNull();
        expect(service.signOutCalls).toBe(0);
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

function crearPlataformaFalsa() {
    const estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'comprobando' });
    return {
        estado$,
        cuenta: null,
        entrar: jasmine.createSpy('entrar').and.resolveTo(true),
        salir: jasmine.createSpy('salir').and.resolveTo(),
    };
}

class UserServicePlataformaDouble extends UserService {
    private authHandler?: ((firebaseUser: User | null) => void) | null;
    readonly plataforma: ReturnType<typeof crearPlataformaFalsa>;

    constructor(plataforma = crearPlataformaFalsa()) {
        super(
            {} as Auth,
            {} as Database,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            undefined,
            undefined,
            plataforma as any,
        );
        this.plataforma = plataforma;
    }

    protected override subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        this.authHandler = handler;
    }

    protected override watchAclPath(_: string, onData: (rawAcl: any) => void, __: () => void): () => void {
        onData(null);
        return () => undefined;
    }

    entrarConCuenta(estado: Partial<Extract<EstadoPlataforma, { tipo: 'con_sesion' }>> = {}): void {
        this.authHandler?.({ uid: 'sub-1', displayName: null, email: null } as unknown as User);
        this.plataforma.estado$.next({ tipo: 'con_sesion', cuenta: { id: 'sub-1', alias: 'aldric', correo: null }, ...estado });
    }
}

describe('UserService con la cuenta de Yosiftware', () => {
    it('abre la sesión de Rol aunque la cuenta no tenga correo', () => {
        const service = new UserServicePlataformaDouble();
        service.entrarConCuenta();

        expect(service.IsLoggedIn).toBeTrue();
        expect(service.canProceed('creation')).toBeTrue();
    });

    it('con normas de Rol pendientes no deja crear y lo explica', () => {
        const service = new UserServicePlataformaDouble();
        service.entrarConCuenta({
            normasPendientes: { id: 3, version: 2, titulo: 'Normas de Rol', importante: true, publicadas: '2026-10-01' },
        });

        expect(service.canProceed('creation')).toBeFalse();
        expect(service.getAccessRestrictionMessage('creation')).toBe('Debes aceptar las normas de Rol vigentes antes de crear o editar contenido.');
    });

    it('aplica la limitación de creación de la plataforma mientras está vigente', () => {
        const service = new UserServicePlataformaDouble();
        const manana = new Date(Date.now() + 86_400_000).toISOString();
        service.entrarConCuenta({ restricciones: { alcances: ['creacion'], hasta: manana } });

        expect(service.canProceed('creation')).toBeFalse();
        expect(service.getAccessRestrictionMessage('creation')).toContain('Tu cuenta tiene limitada la creación de contenido hasta el');
        expect(service.hasCommunityRestriction()).toBeFalse();
    });

    it('ignora una limitación ya caducada', () => {
        const service = new UserServicePlataformaDouble();
        const ayer = new Date(Date.now() - 86_400_000).toISOString();
        service.entrarConCuenta({ restricciones: { alcances: ['creacion', 'comunidad'], hasta: ayer } });

        expect(service.canProceed('creation')).toBeTrue();
        expect(service.hasCommunityRestriction()).toBeFalse();
    });

    it('detecta la limitación de comunidad', () => {
        const service = new UserServicePlataformaDouble();
        service.entrarConCuenta({ restricciones: { alcances: ['comunidad'], hasta: null } });

        expect(service.hasCommunityRestriction()).toBeTrue();
        expect(service.canProceed('creation')).toBeTrue();
    });

    it('cierra la sesión en la plataforma', () => {
        const service = new UserServicePlataformaDouble();
        service.entrarConCuenta();

        service.logOut();

        expect(service.plataforma.salir).toHaveBeenCalled();
    });

    it('sin sesión no pide cerrar nada', () => {
        const service = new UserServicePlataformaDouble();

        expect(service.logOut()).toBeNull();
        expect(service.plataforma.salir).not.toHaveBeenCalled();
    });
});
