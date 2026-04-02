import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, get, onValue, ref, set } from '@angular/fire/database';
import { Observable, combineLatest, map } from 'rxjs';
import { CACHE_CONTRACT_MANIFEST } from '../config/cache-contract-manifest';
import {
    EMPTY_USER_ACL,
    PERMISSION_RESOURCES,
    PermissionResource,
    UserRole,
    normalizeUserAcl,
} from '../interfaces/user-acl';
import { AuthProviderType, UserProfile } from '../interfaces/user-profile';
import { UserModerationSanction, UserModerationSummary } from '../interfaces/user-moderation';
import { UsuarioListadoItemDto, UsuarioPermissionCreateDto, UsuarioUpsertRequestDto, UsuarioUpsertResponseDto } from '../interfaces/usuarios-api';
import { CacheSyncMetadataService } from './cache-sync-metadata.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UsuariosApiService } from './usuarios-api.service';

export interface AdminUserRow {
    uid: string;
    displayName: string;
    email: string;
    authProvider: AuthProviderType;
    role: UserRole;
    banned: boolean;
    admin: boolean;
    isSystemEntity: boolean;
    permissions: Record<PermissionResource, boolean>;
    updatedAt: number | null;
    moderationSummary: UserModerationSummary | null;
}

export interface SyncUsuariosApiResult {
    total: number;
    success: number;
    failed: number;
    failedUids: string[];
}

const USUARIOS_ACL_CACHE_SCHEMA_VERSION = CACHE_CONTRACT_MANIFEST
    .find((entry) => entry.key === 'usuarios_acl_cache')
    ?.schemaVersion ?? 1;
const SYSTEM_ENTITY_DISPLAY_NAMES = new Set(['yosiftware']);

@Injectable({
    providedIn: 'root'
})
export class AdminUsersService {
    constructor(
        private db: Database,
        private auth: Auth,
        private usuariosApiSvc: UsuariosApiService,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
    ) { }

    watchUsersAdminView(): Observable<AdminUserRow[]> {
        return combineLatest([
            this.watchPath('UserProfiles'),
            this.watchPath('Acl/users'),
        ]).pipe(
            map(([profilesRaw, aclRaw]) => this.buildRows(profilesRaw, aclRaw))
        );
    }

    async setBanned(uid: string, value: boolean): Promise<void> {
        const normalizedUid = `${uid ?? ''}`.trim();
        const action = value === true ? 'aplicar baneos' : 'levantar baneos';
        if (normalizedUid.length < 1)
            throw new Error('UID inválido');
        await this.assertMutableUserEntity(normalizedUid);
        throw new Error(`El toggle legacy de baneo ya no está soportado para ${action}. Usa moderación canónica con incidencias admin.`);
    }

    async setAdmin(uid: string, value: boolean): Promise<void> {
        if (value !== true)
            throw new Error('El rol admin no se puede quitar manualmente');
        await this.setRole(uid, 'admin');
    }

    async setRole(uid: string, role: UserRole): Promise<void> {
        const actorUid = await this.ensureActorAdmin();
        const uidObjetivo = `${uid ?? ''}`.trim();
        if (uidObjetivo.length < 1)
            throw new Error('UID inválido');
        await this.assertMutableUserEntity(uidObjetivo);

        const rawAcl = await this.getPath(`Acl/users/${uidObjetivo}`);
        const acl = normalizeUserAcl(rawAcl);
        if (acl.roles.type === 'admin' && role !== 'admin')
            throw new Error('No se puede degradar manualmente una cuenta admin');

        const permissions = this.toPermissionsMap(
            this.buildEffectivePermissionsCreate(
                role,
                this.permissionsArrayFromAclPermissions(acl.permissions)
            )
        );
        const payload = this.buildAclWritePayload(
            role,
            acl.status.banned === true,
            permissions,
            rawAcl,
            actorUid
        );

        await this.setPath(`Acl/users/${uidObjetivo}`, payload);
        await this.backupUserToApi(uidObjetivo);
    }

    async setCreatePermission(uid: string, resource: PermissionResource, value: boolean): Promise<void> {
        const actorUid = await this.ensureActorAdmin();
        const uidObjetivo = `${uid ?? ''}`.trim();
        if (uidObjetivo.length < 1)
            throw new Error('UID inválido');
        if (!PERMISSION_RESOURCES.includes(resource))
            throw new Error('Recurso de permiso inválido');
        await this.assertMutableUserEntity(uidObjetivo);

        const rawAcl = await this.getPath(`Acl/users/${uidObjetivo}`);
        const acl = normalizeUserAcl(rawAcl);
        if (acl.roles.type === 'admin')
            throw new Error('Los permisos de un admin son fijos y siempre están activos');

        const permissions = this.toPermissionsMap(this.permissionsArrayFromAclPermissions(acl.permissions));
        permissions[resource] = value;
        const permissionsEfectivos = this.toPermissionsMap(
            this.buildEffectivePermissionsCreate(acl.roles.type, this.mapToPermissionsArray(permissions))
        );
        const payload = this.buildAclWritePayload(
            acl.roles.type,
            acl.status.banned === true,
            permissionsEfectivos,
            rawAcl,
            actorUid
        );

        await this.setPath(`Acl/users/${uidObjetivo}`, payload);
        await this.backupUserToApi(uidObjetivo);
    }

    async setCreatePermissions(uid: string, permissions: Record<PermissionResource, boolean>): Promise<void> {
        const actorUid = await this.ensureActorAdmin();
        const uidObjetivo = `${uid ?? ''}`.trim();
        if (uidObjetivo.length < 1)
            throw new Error('UID inválido');
        await this.assertMutableUserEntity(uidObjetivo);

        const rawAcl = await this.getPath(`Acl/users/${uidObjetivo}`);
        const acl = normalizeUserAcl(rawAcl);
        if (acl.roles.type === 'admin')
            throw new Error('Los permisos de un admin son fijos y siempre están activos');

        const normalizedPermissions = {} as Record<PermissionResource, boolean>;
        PERMISSION_RESOURCES.forEach((resource) => {
            normalizedPermissions[resource] = permissions?.[resource] === true;
        });

        const permissionsEfectivos = this.toPermissionsMap(
            this.buildEffectivePermissionsCreate(acl.roles.type, this.mapToPermissionsArray(normalizedPermissions))
        );
        const payload = this.buildAclWritePayload(
            acl.roles.type,
            acl.status.banned === true,
            permissionsEfectivos,
            rawAcl,
            actorUid
        );

        await this.setPath(`Acl/users/${uidObjetivo}`, payload);
        await this.backupUserToApi(uidObjetivo);
    }

    async assertAdminAccess(): Promise<void> {
        await this.ensureActorAdminViaApi();
    }

    async syncUsersCacheFromApi(): Promise<boolean> {
        const usuarios = await this.listUsersApi();
        const cachePayload = this.buildCachePayloadFromApi(usuarios);
        await this.setPath('UserProfiles', cachePayload.userProfilesByUid);
        await this.setPath('Acl/users', cachePayload.aclByUid);
        await this.cacheSyncMetadataSvc.markSuccess('usuarios_acl_cache', USUARIOS_ACL_CACHE_SCHEMA_VERSION);
        return true;
    }

    async syncAllUsersToApiFromCache(): Promise<SyncUsuariosApiResult> {
        await this.ensureActorAdmin();

        const [profilesRaw, aclRaw] = await Promise.all([
            this.getPath('UserProfiles'),
            this.getPath('Acl/users'),
        ]);

        const profilesByUid = this.toProfilesByUid(profilesRaw);
        const aclByUid = this.toAclByUid(aclRaw);
        const uidSet = new Set<string>([
            ...Object.keys(profilesByUid),
            ...Object.keys(aclByUid),
        ]);
        const uids = [...uidSet].filter((uid) => uid.trim().length > 0).sort((a, b) => a.localeCompare(b));

        let success = 0;
        let failed = 0;
        const failedUids: string[] = [];

        for (const uid of uids) {
            const payload = this.buildUpsertPayloadFromRaw(uid, profilesByUid[uid], aclByUid[uid]);
            if (!payload) {
                failed++;
                failedUids.push(uid);
                continue;
            }

            try {
                await this.upsertUserApi(payload);
                success++;
            } catch {
                failed++;
                failedUids.push(uid);
            }
        }

        return {
            total: uids.length,
            success,
            failed,
            failedUids,
        };
    }

    async downloadDatabaseBackup(): Promise<string> {
        await this.ensureActorAdmin();
        return this.downloadUsersBackupApi();
    }

    protected watchPath(path: string): Observable<any> {
        return new Observable((observer) => {
            const unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, path);
                return onValue(
                    dbRef,
                    (snapshot) => observer.next(snapshot.val()),
                    (error) => observer.error(error)
                );
            });

            return () => unsubscribe();
        });
    }

    protected async getPath(path: string): Promise<any> {
        const snapshot = await this.firebaseContextSvc.run(() => {
            const dbRef = ref(this.db, path);
            return get(dbRef);
        });
        return snapshot.val();
    }

    protected async setPath(path: string, payload: any): Promise<void> {
        await this.firebaseContextSvc.run(() => {
            const dbRef = ref(this.db, path);
            return set(dbRef, payload);
        });
    }

    protected listUsersApi(): Promise<UsuarioListadoItemDto[]> {
        return this.usuariosApiSvc.listUsers();
    }

    protected upsertUserApi(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        return this.usuariosApiSvc.upsertUser(payload);
    }

    protected downloadUsersBackupApi(): Promise<string> {
        return this.usuariosApiSvc.downloadUsersBackupZip();
    }

    private async ensureActorAdmin(): Promise<string> {
        const actorUid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        if (actorUid.length < 1)
            throw new Error('Sesión no iniciada');

        await this.ensureActorAdminViaApi();

        return actorUid;
    }

    private async ensureActorAdminViaApi(): Promise<void> {
        await this.listUsersApi();
    }

    private buildRows(profilesRaw: any, aclRaw: any): AdminUserRow[] {
        const perfiles = this.toProfilesByUid(profilesRaw);
        const aclByUid = this.toAclByUid(aclRaw);

        const uids = new Set<string>([
            ...Object.keys(perfiles),
            ...Object.keys(aclByUid),
        ]);

        const rows: AdminUserRow[] = [];
        uids.forEach((uid) => {
            const profile = perfiles[uid];
            const acl = aclByUid[uid] ?? { ...EMPTY_USER_ACL };
            const role = acl.roles?.type ?? 'jugador';
            const isSystemEntity = this.isSystemEntityProfile(uid, profile);

            rows.push({
                uid,
                displayName: `${profile?.displayName ?? ''}`.trim(),
                email: `${profile?.email ?? ''}`.trim(),
                authProvider: this.normalizeProvider(profile?.authProvider),
                role,
                banned: acl.status?.banned === true,
                admin: role === 'admin',
                isSystemEntity,
                permissions: this.getPermissionsByResource(role, acl.permissions),
                updatedAt: this.toOptionalNumber((aclRaw?.[uid] as Record<string, any>)?.['updatedAt']),
                moderationSummary: this.normalizeModerationSummary((aclRaw?.[uid] as Record<string, any>)?.['moderationSummary']),
            });
        });

        return rows.sort((a, b) => this.sortRows(a, b));
    }

    private toProfilesByUid(raw: any): Record<string, UserProfile> {
        if (!raw || typeof raw !== 'object')
            return {};

        const output: Record<string, UserProfile> = {};
        Object.entries(raw as Record<string, any>).forEach(([uid, value]) => {
            const uidNormalizado = `${uid ?? ''}`.trim();
            if (uidNormalizado.length < 1)
                return;
            if (!value || typeof value !== 'object')
                return;

            const profile: UserProfile = {
                uid: uidNormalizado,
                displayName: `${value?.displayName ?? ''}`.trim(),
                email: `${value?.email ?? ''}`.trim(),
                authProvider: this.normalizeProvider(value?.authProvider),
                createdAt: this.toNumber(value?.createdAt),
                lastSeenAt: this.toNumber(value?.lastSeenAt),
            };
            output[uidNormalizado] = profile;
        });
        return output;
    }

    private toAclByUid(raw: any): Record<string, ReturnType<typeof normalizeUserAcl>> {
        if (!raw || typeof raw !== 'object')
            return {};

        const output: Record<string, ReturnType<typeof normalizeUserAcl>> = {};
        Object.entries(raw as Record<string, any>).forEach(([uid, value]) => {
            const uidNormalizado = `${uid ?? ''}`.trim();
            if (uidNormalizado.length < 1)
                return;
            output[uidNormalizado] = normalizeUserAcl(value);
        });
        return output;
    }

    private getPermissionsByResource(role: UserRole, rawPermissions: Record<string, Record<string, boolean>>): Record<PermissionResource, boolean> {
        const base = {} as Record<PermissionResource, boolean>;
        PERMISSION_RESOURCES.forEach((resource) => {
            if (role === 'admin') {
                base[resource] = true;
                return;
            }

            const aclResource = rawPermissions?.[resource];
            if (aclResource && Object.prototype.hasOwnProperty.call(aclResource, 'create')) {
                base[resource] = aclResource?.['create'] === true;
                return;
            }

            base[resource] = resource === 'personajes';
        });
        return base;
    }

    private normalizeProvider(raw: any): AuthProviderType {
        const value = `${raw ?? ''}`.trim().toLowerCase();
        if (value === 'correo')
            return 'correo';
        if (value === 'google')
            return 'google';
        return 'otro';
    }

    private sortRows(a: AdminUserRow, b: AdminUserRow): number {
        if (a.isSystemEntity !== b.isSystemEntity)
            return a.isSystemEntity ? 1 : -1;
        const aKey = `${a.displayName || a.email || a.uid}`.toLowerCase();
        const bKey = `${b.displayName || b.email || b.uid}`.toLowerCase();
        if (aKey === bKey)
            return a.uid.localeCompare(b.uid);
        return aKey.localeCompare(bKey);
    }

    private async assertMutableUserEntity(uid: string): Promise<void> {
        if (await this.isSystemEntityUid(uid))
            throw new Error('Yosiftware es una entidad del sistema. Su rol, permisos y moderación no se pueden editar desde el panel admin.');
    }

    private async isSystemEntityUid(uid: string): Promise<boolean> {
        const profileRaw = await this.getPath(`UserProfiles/${uid}`);
        return this.isSystemEntityProfile(uid, profileRaw);
    }

    private isSystemEntityProfile(uid: string, profileRaw: any): boolean {
        const displayName = this.toKey(profileRaw?.displayName);
        if (SYSTEM_ENTITY_DISPLAY_NAMES.has(displayName))
            return true;

        const email = this.toKey(profileRaw?.email);
        if (email.length > 0 && SYSTEM_ENTITY_DISPLAY_NAMES.has(email.replace(/@.*$/, '')))
            return true;

        return false;
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }

    private toOptionalNumber(value: any): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
    }

    private buildAclWritePayload(
        role: UserRole,
        banned: boolean,
        permissionsMap: Record<PermissionResource, boolean>,
        currentRaw: any,
        actorUid: string
    ): any {
        const permissionsRaw: Record<string, Record<string, boolean>> = {};
        PERMISSION_RESOURCES.forEach((resource) => {
            permissionsRaw[resource] = { create: permissionsMap[resource] === true };
        });

        const base = currentRaw && typeof currentRaw === 'object' ? currentRaw : {};
        return {
            ...base,
            roles: {
                type: role,
                admin: role === 'admin',
            },
            status: {
                ...((base as Record<string, any>)?.['status'] ?? {}),
                banned: banned === true,
            },
            permissions: permissionsRaw,
            updatedAt: Date.now(),
            updatedBy: actorUid,
        };
    }

    private permissionsArrayFromAclPermissions(rawPermissions: Record<string, Record<string, boolean>>): UsuarioPermissionCreateDto[] {
        return PERMISSION_RESOURCES
            .filter((resource) => Object.prototype.hasOwnProperty.call(rawPermissions ?? {}, resource))
            .map((resource) => ({
                resource,
                allowed: rawPermissions?.[resource]?.['create'] === true,
            }));
    }

    private async backupUserToApi(uid: string): Promise<void> {
        const payload = await this.buildUpsertPayloadFromCache(uid);
        if (!payload)
            return;

        try {
            await this.upsertUserApi(payload);
        } catch {
            await this.cacheSyncMetadataSvc.markStale('usuarios_acl_cache', 'admin_rtdb_write_pending_api_sync');
            // Backup best-effort: no bloquea la gestión en tiempo real de RTDB.
        }
    }

    private async buildUpsertPayloadFromCache(uid: string): Promise<UsuarioUpsertRequestDto | null> {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return null;

        const [profileRaw, aclRaw] = await Promise.all([
            this.getPath(`UserProfiles/${uidNormalizado}`),
            this.getPath(`Acl/users/${uidNormalizado}`),
        ]);
        return this.buildUpsertPayloadFromRaw(uidNormalizado, profileRaw, aclRaw);
    }

    private buildUpsertPayloadFromRaw(uid: string, profileRaw: any, aclRaw: any): UsuarioUpsertRequestDto | null {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return null;

        const acl = normalizeUserAcl(aclRaw);
        const role = acl.roles?.type ?? 'jugador';
        const permissionsCreate = this.buildEffectivePermissionsCreate(
            role,
            this.permissionsArrayFromAclPermissions(acl.permissions)
        );

        const emailBase = `${profileRaw?.email ?? ''}`.trim();
        const email = this.truncate(emailBase.length > 0 ? emailBase : `${uidNormalizado}@sin-email.local`, 60);
        const displayNameBase = `${profileRaw?.displayName ?? ''}`.trim();
        const displayName = this.truncate(
            displayNameBase.length > 0 ? displayNameBase : this.fallbackDisplayName(email, uidNormalizado),
            150
        );

        const payload: UsuarioUpsertRequestDto = {
            uid: uidNormalizado,
            displayName,
            email,
            authProvider: this.normalizeProvider(profileRaw?.authProvider),
            role,
        };
        if (role !== 'admin')
            payload.permissionsCreate = permissionsCreate;
        return payload;
    }

    private buildEffectivePermissionsCreate(
        role: UserRole,
        permissions: UsuarioPermissionCreateDto[] | null | undefined
    ): UsuarioPermissionCreateDto[] {
        const map = this.toPermissionsMap(permissions);
        const providedResources = new Set(
            (permissions ?? [])
                .map((item) => `${item?.resource ?? ''}`.trim().toLowerCase())
                .filter((resource) => PERMISSION_RESOURCES.includes(resource as PermissionResource))
        );

        if (role === 'admin') {
            PERMISSION_RESOURCES.forEach((resource) => map[resource] = true);
            return this.mapToPermissionsArray(map);
        }

        if (!providedResources.has('personajes'))
            map.personajes = true;

        return this.mapToPermissionsArray(map);
    }

    private toPermissionsMap(
        permissions: UsuarioPermissionCreateDto[] | null | undefined
    ): Record<PermissionResource, boolean> {
        const output = {} as Record<PermissionResource, boolean>;
        PERMISSION_RESOURCES.forEach((resource) => {
            output[resource] = false;
        });

        (permissions ?? []).forEach((item) => {
            const resource = `${item?.resource ?? ''}`.trim().toLowerCase();
            if (!PERMISSION_RESOURCES.includes(resource as PermissionResource))
                return;
            output[resource as PermissionResource] = item?.allowed === true;
        });

        return output;
    }

    private mapToPermissionsArray(map: Record<PermissionResource, boolean>): UsuarioPermissionCreateDto[] {
        return PERMISSION_RESOURCES.map((resource) => ({
            resource,
            allowed: map[resource] === true,
        }));
    }

    private buildCachePayloadFromApi(usuarios: UsuarioListadoItemDto[]): {
        userProfilesByUid: Record<string, UserProfile>;
        aclByUid: Record<string, any>;
    } {
        const now = Date.now();
        const userProfilesByUid: Record<string, UserProfile> = {};
        const aclByUid: Record<string, any> = {};

        usuarios.forEach((row) => {
            const uid = `${row?.uid ?? ''}`.trim();
            if (uid.length < 1)
                return;

            const role = (row?.role ?? 'jugador') as UserRole;
            const permissionsCreate = this.buildEffectivePermissionsCreate(role, row.permissionsCreate);
            const permissionsMap = this.toPermissionsMap(permissionsCreate);
            const permissionsRaw: Record<string, Record<string, boolean>> = {};
            PERMISSION_RESOURCES.forEach((resource) => {
                permissionsRaw[resource] = { create: permissionsMap[resource] === true };
            });

            const updatedAtParsed = Date.parse(`${row?.updatedAtUtc ?? ''}`.trim());
            const updatedAt = Number.isFinite(updatedAtParsed) ? updatedAtParsed : now;

            userProfilesByUid[uid] = {
                uid,
                displayName: `${row?.displayName ?? ''}`.trim(),
                email: `${row?.email ?? ''}`.trim(),
                authProvider: this.normalizeProvider(row?.authProvider),
                createdAt: now,
                lastSeenAt: now,
            };

            aclByUid[uid] = {
                roles: {
                    type: role,
                    admin: role === 'admin' || row?.admin === true,
                },
                status: {
                    banned: row?.banned === true,
                },
                permissions: permissionsRaw,
                moderationSummary: this.normalizeModerationSummary(row?.moderationSummary),
                updatedAt,
                updatedBy: `${row?.updatedByUserId ?? ''}`.trim(),
            };
        });

        return { userProfilesByUid, aclByUid };
    }

    private fallbackDisplayName(email: string, uid: string): string {
        const emailNormalizado = `${email ?? ''}`.trim();
        if (emailNormalizado.length > 0) {
            const atPos = emailNormalizado.indexOf('@');
            if (atPos > 0)
                return emailNormalizado.substring(0, atPos);
            return emailNormalizado;
        }

        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length > 0)
            return uidNormalizado.substring(0, Math.min(uidNormalizado.length, 150));

        return 'Usuario';
    }

    private truncate(value: string, maxLength: number): string {
        const text = `${value ?? ''}`.trim();
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength).trim();
    }

    private normalizeModerationSummary(raw: any): UserModerationSummary | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            incidentCount: this.toNonNegativeInt(raw?.incidentCount, 0) ?? 0,
            sanctionCount: this.toNonNegativeInt(raw?.sanctionCount, 0) ?? 0,
            lastIncidentAtUtc: this.toNullableText(raw?.lastIncidentAtUtc),
            lastSanctionAtUtc: this.toNullableText(raw?.lastSanctionAtUtc),
            activeSanction: this.normalizeModerationSanction(raw?.activeSanction),
        };
    }

    private normalizeModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const sanctionId = this.toPositiveInt(raw?.sanctionId ?? raw?.id);
        const kind = this.toNullableText(raw?.kind ?? raw?.sanctionKind ?? raw?.type);
        const code = this.toNullableText(raw?.code ?? raw?.sanctionCode);
        const name = this.toNullableText(raw?.name ?? raw?.title ?? raw?.label);
        const startsAtUtc = this.toNullableText(raw?.startsAtUtc ?? raw?.startAtUtc ?? raw?.appliedAtUtc);
        const endsAtUtc = this.toNullableText(raw?.endsAtUtc ?? raw?.endAtUtc ?? raw?.expiresAtUtc);
        const hasExplicitPermanent = raw?.isPermanent === true || raw?.permanent === true;
        const hasExplicitNullEnd = (Object.prototype.hasOwnProperty.call(raw, 'endsAtUtc') && raw?.endsAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'endAtUtc') && raw?.endAtUtc === null)
            || (Object.prototype.hasOwnProperty.call(raw, 'expiresAtUtc') && raw?.expiresAtUtc === null);
        const isPermanent = hasExplicitPermanent || hasExplicitNullEnd;

        if (!sanctionId && !kind && !code && !name && !startsAtUtc && !endsAtUtc && !isPermanent)
            return null;

        return {
            sanctionId,
            kind,
            code,
            name,
            startsAtUtc,
            endsAtUtc,
            isPermanent,
        };
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNonNegativeInt(value: any, fallback: number | null): number | null {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 0)
            return fallback;
        return parsed;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private toKey(value: any): string {
        return `${value ?? ''}`.trim().toLowerCase();
    }
}
