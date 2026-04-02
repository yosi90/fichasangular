import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { PERMISSION_RESOURCES } from '../interfaces/user-acl';
import { UsuarioListadoItemDto, UsuarioUpsertRequestDto, UsuarioUpsertResponseDto } from '../interfaces/usuarios-api';
import { AdminUsersService } from './admin-users.service';
import { CacheSyncMetadataService } from './cache-sync-metadata.service';
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
    readonly cacheSyncMetadataSvcMock: jasmine.SpyObj<CacheSyncMetadataService>;

    constructor(authMock: Partial<Auth> = {}) {
        const cacheSyncMetadataSvcMock = jasmine.createSpyObj<CacheSyncMetadataService>('CacheSyncMetadataService', ['markSuccess', 'markStale']);
        super(
            {} as Database,
            authMock as Auth,
            {} as UsuariosApiService,
            { run: <T>(fn: () => T) => fn() } as FirebaseInjectionContextService,
            cacheSyncMetadataSvcMock,
        );
        this.cacheSyncMetadataSvcMock = cacheSyncMetadataSvcMock;
        this.cacheSyncMetadataSvcMock.markSuccess.and.resolveTo();
        this.cacheSyncMetadataSvcMock.markStale.and.resolveTo();
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
        const uid = `${payload.uid ?? ''}`.trim();
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
                role: (payload.role ?? 'jugador'),
                admin: payload.role === 'admin',
                banned: false,
                permissionsCreate: payload.permissionsCreate ?? [],
            },
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
            role: partial.role ?? 'jugador',
            admin: partial.admin ?? (partial.role === 'admin'),
            banned: partial.banned ?? false,
            updatedAtUtc: partial.updatedAtUtc ?? null,
            updatedByUserId: partial.updatedByUserId ?? null,
            permissionsCreate: partial.permissionsCreate ?? [{ resource: 'personajes', allowed: true }],
            moderationSummary: partial.moderationSummary ?? null,
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

    it('marca Yosiftware como entidad del sistema y la ordena al final', async () => {
        const service = new AdminUsersServiceTestDouble();
        const rowsPromise = firstValueFrom(
            service.watchUsersAdminView().pipe(filter((rows) => rows.length === 2))
        );

        service.seedPath('UserProfiles', {
            normal: {
                uid: 'normal',
                displayName: 'Alba',
                email: 'alba@test.com',
                authProvider: 'correo',
            },
            system: {
                uid: 'system',
                displayName: 'Yosiftware',
                email: 'system@test.com',
                authProvider: 'otro',
            },
        });
        service.seedPath('Acl/users', {
            normal: {
                roles: { admin: false, type: 'jugador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            system: {
                roles: { admin: false, type: 'jugador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        const rows = await rowsPromise;

        expect(rows[0].uid).toBe('normal');
        expect(rows[1].uid).toBe('system');
        expect(rows[1].isSystemEntity).toBeTrue();
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
        expect(service.cacheSyncMetadataSvcMock.markSuccess).toHaveBeenCalledOnceWith('usuarios_acl_cache', 1);
    });

    it('syncUsersCacheFromApi preserva moderationSummary y lo expone en filas', async () => {
        const service = new AdminUsersServiceTestDouble();
        service.apiUsers = [
            buildUser({
                uid: 'u-moderated',
                moderationSummary: {
                    incidentCount: 3,
                    sanctionCount: 1,
                    lastIncidentAtUtc: '2026-04-01T10:00:00Z',
                    lastSanctionAtUtc: '2026-04-01T10:00:00Z',
                    activeSanction: {
                        sanctionId: 17,
                        kind: 'temporary',
                        code: 'cooldown',
                        name: 'Cooldown',
                        startsAtUtc: '2026-04-01T10:00:00Z',
                        endsAtUtc: '2026-04-08T10:00:00Z',
                        isPermanent: false,
                    },
                },
            }),
        ];

        await service.syncUsersCacheFromApi();
        const rows = await firstValueFrom(
            service.watchUsersAdminView().pipe(filter((value) => value.some((row) => row.uid === 'u-moderated')))
        );
        const moderated = rows.find((row) => row.uid === 'u-moderated');

        expect(service.setCalls[1].payload['u-moderated'].moderationSummary.incidentCount).toBe(3);
        expect(moderated?.moderationSummary?.sanctionCount).toBe(1);
        expect(moderated?.moderationSummary?.activeSanction?.sanctionId).toBe(17);
    });

    it('setBanned rechaza el toggle legacy y obliga a usar moderación canónica', async () => {
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

        await expectAsync(service.setBanned('user-1', true))
            .toBeRejectedWithError(
                'El toggle legacy de baneo ya no está soportado para aplicar baneos. Usa moderación canónica con incidencias admin.'
            );
        expect(service.setCalls.find((call) => call.path === 'Acl/users/user-1')).toBeUndefined();
        expect(service.upsertCalls.length).toBe(0);
    });

    it('rechaza también usar el toggle legacy para levantar baneos', async () => {
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

        await expectAsync(service.setBanned('user-1', false))
            .toBeRejectedWithError(
                'El toggle legacy de baneo ya no está soportado para levantar baneos. Usa moderación canónica con incidencias admin.'
            );
    });

    it('rechaza mutar Yosiftware como entidad del sistema', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('UserProfiles', {
            yosiftware: {
                uid: 'yosiftware',
                displayName: 'Yosiftware',
                email: 'system@test.com',
                authProvider: 'otro',
            },
        });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            yosiftware: {
                roles: { admin: false, type: 'jugador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        const expectedMessage = 'Yosiftware es una entidad del sistema. Su rol, permisos y moderación no se pueden editar desde el panel admin.';
        await expectAsync(service.setRole('yosiftware', 'master')).toBeRejectedWithError(expectedMessage);
        await expectAsync(service.setCreatePermissions('yosiftware', {
            personajes: true,
            campanas: true,
            conjuros: false,
            dotes: false,
            razas: false,
            clases: false,
            plantillas: false,
            manuales: false,
            tipos_criatura: false,
            subtipos: false,
            rasgos: false,
            ventajas: false,
            desventajas: false,
        })).toBeRejectedWithError(expectedMessage);
        await expectAsync(service.setBanned('yosiftware', true)).toBeRejectedWithError(expectedMessage);
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

    it('permite revocar personajes.create en un jugador', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
            'user-2': {
                roles: { admin: false, type: 'jugador' },
                status: { banned: false },
                permissions: { personajes: { create: true } },
            },
        });

        await service.setCreatePermission('user-2', 'personajes', false);

        const aclSet = service.setCalls.find((call) => call.path === 'Acl/users/user-2');
        expect(aclSet?.payload?.permissions?.personajes?.create).toBeFalse();
    });

    it('setCreatePermissions guarda el lote completo y mantiene backup API', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('UserProfiles', {
            'user-2': {
                uid: 'user-2',
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
            'user-2': {
                roles: { admin: false, type: 'jugador' },
                status: { banned: false },
                permissions: {
                    personajes: { create: true },
                    dotes: { create: false },
                },
            },
        });

        await service.setCreatePermissions('user-2', {
            personajes: true,
            campanas: true,
            conjuros: false,
            dotes: true,
            razas: false,
            clases: false,
            plantillas: false,
            manuales: false,
            tipos_criatura: false,
            subtipos: false,
            rasgos: false,
            ventajas: false,
            desventajas: false,
        });

        const aclSet = service.setCalls.find((call) => call.path === 'Acl/users/user-2');
        expect(aclSet?.payload?.permissions?.campanas?.create).toBeTrue();
        expect(aclSet?.payload?.permissions?.dotes?.create).toBeTrue();
        expect(aclSet?.payload?.permissions?.conjuros?.create).toBeFalse();
        expect(service.upsertCalls[0].permissionsCreate?.find((item) => item.resource === 'campanas')?.allowed).toBeTrue();
    });

    it('assertAdminAccess usa la API como fuente de verdad del admin runtime', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.apiUsers = [buildUser({ uid: 'admin-1', role: 'admin', admin: true })];

        await expectAsync(service.assertAdminAccess()).toBeResolved();
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
        expect(adminPayload && Object.prototype.hasOwnProperty.call(adminPayload, 'banned')).toBeFalse();
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
                roles: { admin: false, type: 'jugador' },
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

    it('syncAllUsersToApiFromCache da personajes.create=true por defecto cuando no existe ACL previa', async () => {
        const service = new AdminUsersServiceTestDouble({ currentUser: { uid: 'admin-1' } as any });
        service.seedPath('Acl/users', {
            'admin-1': {
                roles: { admin: true, type: 'admin' },
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
            'u3': {
                uid: 'u3',
                displayName: 'Jugador Nuevo',
                email: 'u3@test.com',
                authProvider: 'correo',
            },
        });

        const result = await service.syncAllUsersToApiFromCache();

        expect(result.failed).toBe(0);
        const u3Payload = service.upsertCalls.find((item) => item.uid === 'u3');
        expect(u3Payload?.role).toBe('jugador');
        expect(u3Payload?.permissionsCreate?.find((item) => item.resource === 'personajes')?.allowed).toBeTrue();
    });

    it('mapea master desde API a cache RTDB y a filas del panel', async () => {
        const service = new AdminUsersServiceTestDouble();
        service.apiUsers = [
            buildUser({
                uid: 'u-master',
                role: 'master',
                permissionsCreate: [
                    { resource: 'personajes', allowed: true },
                    { resource: 'campanas', allowed: true },
                ],
            }),
        ];

        await service.syncUsersCacheFromApi();
        const rows = await firstValueFrom(
            service.watchUsersAdminView().pipe(filter((value) => value.some((row) => row.uid === 'u-master')))
        );
        const master = rows.find((row) => row.uid === 'u-master');

        expect(master?.role).toBe('master');
        expect(master?.permissions.personajes).toBeTrue();
        expect(master?.permissions.campanas).toBeTrue();
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
