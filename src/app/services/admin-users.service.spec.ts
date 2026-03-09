import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { PERMISSION_RESOURCES } from '../interfaces/user-acl';
import { UsuarioListadoItemDto, UsuarioUpsertRequestDto, UsuarioUpsertResponseDto } from '../interfaces/usuarios-api';
import { AdminUsersService } from './admin-users.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UsuariosApiService } from './usuarios-api.service';

class AdminUsersServiceTestDouble extends AdminUsersService {
    private readonly watchSubjects = new Map<string, BehaviorSubject<any>>();
    private readonly state = new Map<string, any>();

    apiUsers: UsuarioListadoItemDto[] = [];
    setCalls: Array<{ path: string; payload: any; }> = [];
    upsertCalls: UsuarioUpsertRequestDto[] = [];
    upsertError: Error | null = null;
    upsertErrorByUid: Record<string, Error> = {};
    downloadBackupCalls: number = 0;
    downloadBackupResult: string = 'rol-backup-test.zip';

    constructor(authMock: Partial<Auth> = {}) {
        super(
            {} as Database,
            authMock as Auth,
            {} as UsuariosApiService,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
        );
        this.state.set('UserProfiles', {});
        this.state.set('Acl/users', {});
    }

    protected override watchPath(path: string): Observable<any> {
        if (!this.watchSubjects.has(path))
            this.watchSubjects.set(path, new BehaviorSubject<any>(this.state.get(path) ?? null));
        return this.watchSubjects.get(path)!.asObservable();
    }

    protected override async getPath(path: string): Promise<any> {
        if (path.startsWith('Acl/users/')) {
            const uid = path.substring('Acl/users/'.length);
            const all = this.state.get('Acl/users') ?? {};
            return all?.[uid] ?? null;
        }
        if (path.startsWith('UserProfiles/')) {
            const uid = path.substring('UserProfiles/'.length);
            const all = this.state.get('UserProfiles') ?? {};
            return all?.[uid] ?? null;
        }
        return this.state.get(path) ?? null;
    }

    protected override async setPath(path: string, payload: any): Promise<void> {
        this.setCalls.push({ path, payload });

        if (path.startsWith('Acl/users/')) {
            const uid = path.substring('Acl/users/'.length);
            const all = { ...(this.state.get('Acl/users') ?? {}) };
            all[uid] = payload;
            this.state.set('Acl/users', all);
            this.emitWatch('Acl/users');
            return;
        }

        if (path.startsWith('UserProfiles/')) {
            const uid = path.substring('UserProfiles/'.length);
            const all = { ...(this.state.get('UserProfiles') ?? {}) };
            all[uid] = payload;
            this.state.set('UserProfiles', all);
            this.emitWatch('UserProfiles');
            return;
        }

        this.state.set(path, payload);
        this.emitWatch(path);
    }

    protected override async listUsersApi(): Promise<UsuarioListadoItemDto[]> {
        return this.apiUsers;
    }

    protected override async upsertUserApi(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        const uid = `${payload.uid ?? payload.firebaseUid ?? ''}`.trim();
        const errorByUid = this.upsertErrorByUid[uid];
        if (errorByUid)
            throw errorByUid;
        if (this.upsertError)
            throw this.upsertError;
        this.upsertCalls.push(payload);
        return {
            status: 'updated',
            userId: 'u-test',
            uid,
            acl: {
                uid,
                role: (payload.role ?? 'usuario'),
                admin: payload.role === 'admin',
                banned: payload.banned === true,
                permissionsCreate: payload.permissionsCreate ?? [],
            },
            legacyPlayer: { idJugador: 0 },
        };
    }

    protected override async downloadUsersBackupApi(): Promise<string> {
        this.downloadBackupCalls++;
        return this.downloadBackupResult;
    }

    seedPath(path: 'UserProfiles' | 'Acl/users', value: any): void {
        this.state.set(path, value ?? {});
        this.emitWatch(path);
    }

    private emitWatch(path: string): void {
        if (!this.watchSubjects.has(path))
            this.watchSubjects.set(path, new BehaviorSubject<any>(this.state.get(path) ?? null));
        this.watchSubjects.get(path)!.next(this.state.get(path) ?? null);
    }
}

describe('AdminUsersService', () => {
    function buildUser(partial: Partial<UsuarioListadoItemDto>): UsuarioListadoItemDto {
        return {
            userId: `${partial.userId ?? 'user-id'}`,
            uid: `${partial.uid ?? 'uid'}`,
            displayName: partial.displayName ?? 'Nombre',
            email: partial.email ?? 'mail@test.com',
            authProvider: partial.authProvider ?? 'correo',
            role: partial.role ?? 'usuario',
            admin: partial.admin ?? (partial.role === 'admin'),
            banned: partial.banned ?? false,
            updatedAtUtc: partial.updatedAtUtc ?? null,
            updatedByUserId: partial.updatedByUserId ?? null,
            permissionsCreate: partial.permissionsCreate ?? [{ resource: 'personajes', allowed: true }],
        };
    }

    it('combina UserProfiles y ACL en filas de admin', async () => {
        const service = new AdminUsersServiceTestDouble();
        const rowsPromise = firstValueFrom(
            service.watchUsersAdminView().pipe(
                filter((rows) => rows.length === 3)
            )
        );

        service.seedPath('UserProfiles', {
            u1: {
                uid: 'u1',
                displayName: 'Alba',
                email: 'alba@test.com',
                authProvider: 'correo',
                createdAt: 1,
                lastSeenAt: 2,
            },
            u2: {
                uid: 'u2',
                displayName: 'Bruno',
                email: 'bruno@gmail.com',
                authProvider: 'google',
                createdAt: 3,
                lastSeenAt: 4,
            },
        });
        service.seedPath('Acl/users', {
            u2: {
                roles: { admin: true, type: 'admin' },
                status: { banned: true },
                permissions: {
                    personajes: { create: true },
                },
                updatedAt: 50,
            },
            u3: {
                roles: { admin: false, type: 'colaborador' },
                permissions: {
                    dotes: { create: true },
                },
            },
        });

        const rows = await rowsPromise;
        expect(rows.length).toBe(3);

        const u2 = rows.find((row) => row.uid === 'u2');
        expect(u2?.admin).toBeTrue();
        expect(u2?.role).toBe('admin');
        expect(u2?.banned).toBeTrue();
        expect(u2?.permissions.personajes).toBeTrue();
        expect(u2?.authProvider).toBe('google');
        expect(u2?.updatedAt).toBe(50);

        const u3 = rows.find((row) => row.uid === 'u3');
        expect(u3?.role).toBe('colaborador');
        expect(u3?.displayName).toBe('');
        expect(u3?.email).toBe('');
        expect(u3?.permissions.personajes).toBeTrue();
        expect(u3?.permissions.dotes).toBeTrue();
        PERMISSION_RESOURCES
            .filter((resource) => resource !== 'dotes' && resource !== 'personajes')
            .forEach((resource) => expect(u3?.permissions[resource]).toBeFalse());
    });

    it('syncUsersCacheFromApi mapea API a cache RTDB', async () => {
        const service = new AdminUsersServiceTestDouble();
        service.apiUsers = [
            buildUser({
                uid: 'u1',
                role: 'admin',
                admin: true,
                permissionsCreate: [{ resource: 'personajes', allowed: true }],
            }),
            buildUser({
                uid: 'u2',
                role: 'colaborador',
                permissionsCreate: [
                    { resource: 'personajes', allowed: true },
                    { resource: 'dotes', allowed: true },
                ],
            }),
        ];

        const ok = await service.syncUsersCacheFromApi();
        expect(ok).toBeTrue();
        expect(service.setCalls.length).toBe(2);
        expect(service.setCalls[0].path).toBe('UserProfiles');
        expect(service.setCalls[1].path).toBe('Acl/users');
        expect(service.setCalls[1].payload['u1'].roles.type).toBe('admin');
        expect(service.setCalls[1].payload['u2'].permissions.dotes.create).toBeTrue();
    });

    it('setBanned persiste en RTDB y hace backup API', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('UserProfiles', {
            'user-1': {
                uid: 'user-1',
                displayName: 'User',
                email: 'user@test.com',
                authProvider: 'correo',
                createdAt: 1,
                lastSeenAt: 2,
            },
        });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'user-1': {
                roles: { admin: false, type: 'colaborador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await service.setBanned('user-1', true);

        const aclSet = service.setCalls.find((call) => call.path === 'Acl/users/user-1');
        expect(aclSet?.payload?.status?.banned).toBeTrue();
        expect(service.upsertCalls.length).toBe(1);
        expect(service.upsertCalls[0].uid).toBe('user-1');
        expect(service.upsertCalls[0].banned).toBeTrue();
    });

    it('bloquea auto-ban del admin actual', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await expectAsync(service.setBanned('admin-1', true))
            .toBeRejectedWithError('No puedes banear tu propia cuenta');
    });

    it('rechaza quitar admin manualmente', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });

        await expectAsync(service.setAdmin('admin-1', false))
            .toBeRejectedWithError('El rol admin no se puede quitar manualmente');
    });

    it('setRole admin activa todos los permisos create', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'user-2': {
                roles: { admin: false, type: 'colaborador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await service.setRole('user-2', 'admin');

        const aclSet = service.setCalls.find((call) => call.path === 'Acl/users/user-2');
        expect(aclSet?.payload?.roles?.type).toBe('admin');
        PERMISSION_RESOURCES.forEach((resource) => {
            expect(aclSet?.payload?.permissions?.[resource]?.create).toBeTrue();
        });
    });

    it('impide permisos avanzados en rol usuario', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'user-2': {
                roles: { admin: false, type: 'usuario' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await expectAsync(service.setCreatePermission('user-2', 'dotes', true))
            .toBeRejectedWithError('El rol usuario no admite permisos adicionales');
    });

    it('activa salvaguarda cuando detecta duplicados en Firebase', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'admin-2': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await expectAsync(service.assertAdminAccess())
            .toBeRejectedWithError('Salvaguarda activada: hay múltiples admins en Firebase. Operación bloqueada.');
    });

    it('syncAllUsersToApiFromCache reenvia todos los usuarios cacheados a API', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'u2': {
                roles: { admin: false, type: 'colaborador' },
                status: { banned: false },
                permissions: { personajes: { create: true }, dotes: { create: true } },
            },
        });
        service.seedPath('UserProfiles', {
            'admin-1': {
                uid: 'admin-1',
                displayName: 'Admin',
                email: 'admin@test.com',
                authProvider: 'correo',
            },
            'u2': {
                uid: 'u2',
                displayName: 'Usuario Dos',
                email: 'u2@test.com',
                authProvider: 'google',
            },
            'u3': {
                uid: 'u3',
                displayName: 'Usuario Tres',
                email: 'u3@test.com',
                authProvider: 'correo',
            },
        });

        const result = await service.syncAllUsersToApiFromCache();

        expect(result.total).toBe(3);
        expect(result.success).toBe(3);
        expect(result.failed).toBe(0);
        expect(service.upsertCalls.length).toBe(3);
        const adminPayload = service.upsertCalls.find((item) => item.uid === 'admin-1');
        expect(adminPayload?.role).toBe('admin');
        expect(adminPayload?.permissionsCreate).toBeUndefined();
        const u2Payload = service.upsertCalls.find((item) => item.uid === 'u2');
        const dotes = u2Payload?.permissionsCreate?.find((item) => item.resource === 'dotes');
        expect(dotes?.allowed).toBeTrue();
    });

    it('syncAllUsersToApiFromCache informa fallos parciales y continua', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'u2': {
                roles: { admin: false, type: 'usuario' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });
        service.seedPath('UserProfiles', {
            'admin-1': {
                uid: 'admin-1',
                displayName: 'Admin',
                email: 'admin@test.com',
                authProvider: 'correo',
            },
            'u2': {
                uid: 'u2',
                displayName: 'Usuario Dos',
                email: 'u2@test.com',
                authProvider: 'correo',
            },
        });
        service.upsertErrorByUid['u2'] = new Error('Error forzado');

        const result = await service.syncAllUsersToApiFromCache();

        expect(result.total).toBe(2);
        expect(result.success).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.failedUids).toEqual(['u2']);
        expect(service.upsertCalls.length).toBe(1);
        expect(service.upsertCalls[0].uid).toBe('admin-1');
    });

    it('downloadDatabaseBackup valida admin y delega en la API', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        const filename = await service.downloadDatabaseBackup();

        expect(filename).toBe('rol-backup-test.zip');
        expect(service.downloadBackupCalls).toBe(1);
    });
});
