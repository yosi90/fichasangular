import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
} from '@angular/fire/firestore';
import { UserPrivateProfile } from '../interfaces/user-account';
import {
    ChatFloatingBubbleState,
    ChatFloatingSettings,
    ChatFloatingWindowState,
    FloatingWindowPlacementMinimized,
    FloatingWindowPlacementRestored,
    UserSettingsV1,
    createDefaultUserSettings,
} from '../interfaces/user-settings';
import {
    FriendItem,
    FriendRequestItem,
    PagedListMeta,
    PagedListResult,
    SocialUserBasic,
} from '../interfaces/social';
import { CampaignListItem } from '../interfaces/campaign-management';
import { PersonajeSimple } from '../interfaces/simplificaciones/personaje-simple';
import { AuthProviderType } from '../interfaces/user-profile';
import { UserRole } from '../interfaces/user-acl';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { UserCompliancePolicyState, UserComplianceSnapshot, UserModerationSanction } from '../interfaces/user-moderation';

type FriendRequestDirection = 'sent' | 'received';

@Injectable({
    providedIn: 'root'
})
export class PrivateUserFirestoreService {
    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    async getMyProfile(): Promise<UserPrivateProfile | null> {
        const uid = this.getCurrentUid();
        if (!uid)
            return null;

        const snapshot = await this.readDocument(
            this.getDocumentRef('private_users', uid, 'meta', 'profile')
        );
        return this.mapPrivateProfile(snapshot.exists() ? snapshot.data() : null, uid);
    }

    watchMyProfile(
        next: (profile: UserPrivateProfile | null) => void,
        onError?: (error: unknown) => void
    ): () => void {
        const uid = this.getCurrentUid();
        if (!uid) {
            next(null);
            return () => undefined;
        }

        return this.firebaseContextSvc.run(() => onSnapshot(
            this.getDocumentRef('private_users', uid, 'meta', 'profile'),
            (snapshot: any) => next(this.mapPrivateProfile(snapshot.exists() ? snapshot.data() : null, uid)),
            (error: unknown) => onError?.(error)
        ));
    }

    async getMySettings(): Promise<UserSettingsV1 | null> {
        const uid = this.getCurrentUid();
        if (!uid)
            return null;

        const snapshot = await this.readDocument(
            this.getDocumentRef('private_users', uid, 'meta', 'settings')
        );
        return this.mapSettings(snapshot.exists() ? snapshot.data() : null);
    }

    watchFriends(
        next: (result: PagedListResult<FriendItem>) => void,
        onError?: (error: unknown) => void,
        limit: number = 25,
        offset: number = 0
    ): () => void {
        return this.watchPagedCollection(
            'friends',
            limit,
            offset,
            (raw, docId) => this.mapFriendItem(raw, docId),
            (a, b) => this.compareText(a.displayName ?? a.uid, b.displayName ?? b.uid),
            next,
            onError
        );
    }

    async listFriends(limit: number = 25, offset: number = 0): Promise<PagedListResult<FriendItem>> {
        return this.listPagedCollection(
            'friends',
            limit,
            offset,
            (raw, docId) => this.mapFriendItem(raw, docId),
            (a, b) => this.compareText(a.displayName ?? a.uid, b.displayName ?? b.uid)
        );
    }

    async listFriendRequests(
        direction: FriendRequestDirection,
        limit: number = 25,
        offset: number = 0
    ): Promise<PagedListResult<FriendRequestItem>> {
        const path = direction === 'received'
            ? 'friend_requests_received'
            : 'friend_requests_sent';

        return this.listPagedCollection(
            path,
            limit,
            offset,
            (raw, docId) => this.mapFriendRequestItem(raw, docId, direction),
            (a, b) => this.toDateMs(b.createdAtUtc) - this.toDateMs(a.createdAtUtc)
        );
    }

    watchFriendRequests(
        direction: FriendRequestDirection,
        next: (result: PagedListResult<FriendRequestItem>) => void,
        onError?: (error: unknown) => void,
        limit: number = 25,
        offset: number = 0
    ): () => void {
        const path = direction === 'received'
            ? 'friend_requests_received'
            : 'friend_requests_sent';

        return this.watchPagedCollection(
            path,
            limit,
            offset,
            (raw, docId) => this.mapFriendRequestItem(raw, docId, direction),
            (a, b) => this.toDateMs(b.createdAtUtc) - this.toDateMs(a.createdAtUtc),
            next,
            onError
        );
    }

    async listCampaigns(): Promise<CampaignListItem[]> {
        const uid = this.getCurrentUid();
        if (!uid)
            return [];

        const snapshot = await this.firebaseContextSvc.run(() => getDocs(
            collection(this.firestore, 'private_users', uid, 'campaigns')
        ));

        return snapshot.docs
            .map((item) => this.mapCampaignSummary(item.data(), item.id))
            .filter((item): item is CampaignListItem => item !== null)
            .sort((a, b) => this.compareText(a.nombre, b.nombre));
    }

    watchCampaigns(
        next: (items: CampaignListItem[]) => void,
        onError?: (error: unknown) => void
    ): () => void {
        const uid = this.getCurrentUid();
        if (!uid) {
            next([]);
            return () => undefined;
        }

        return this.firebaseContextSvc.run(() => onSnapshot(
            collection(this.firestore, 'private_users', uid, 'campaigns'),
            (snapshot) => {
                const items = snapshot.docs
                    .map((item) => this.mapCampaignSummary(item.data(), item.id))
                    .filter((item): item is CampaignListItem => item !== null)
                    .sort((a, b) => this.compareText(a.nombre, b.nombre));
                next(items);
            },
            (error) => onError?.(error)
        ));
    }

    async listCharacters(): Promise<PersonajeSimple[]> {
        const uid = this.getCurrentUid();
        if (!uid)
            return [];

        const snapshot = await this.firebaseContextSvc.run(() => getDocs(
            collection(this.firestore, 'private_users', uid, 'characters')
        ));

        return snapshot.docs
            .map((item) => this.mapCharacter(item.data(), item.id))
            .filter((item): item is PersonajeSimple => item !== null)
            .sort((a, b) => this.compareText(a.Nombre, b.Nombre));
    }

    watchCharacters(
        next: (items: PersonajeSimple[]) => void,
        onError?: (error: unknown) => void
    ): () => void {
        const uid = this.getCurrentUid();
        if (!uid) {
            next([]);
            return () => undefined;
        }

        return this.firebaseContextSvc.run(() => onSnapshot(
            collection(this.firestore, 'private_users', uid, 'characters'),
            (snapshot) => {
                const items = snapshot.docs
                    .map((item) => this.mapCharacter(item.data(), item.id))
                    .filter((item): item is PersonajeSimple => item !== null)
                    .sort((a, b) => this.compareText(a.Nombre, b.Nombre));
                next(items);
            },
            (error) => onError?.(error)
        ));
    }

    private async listPagedCollection<T>(
        collectionName: string,
        limit: number,
        offset: number,
        mapper: (raw: any, docId: string) => T | null,
        sorter: (a: T, b: T) => number
    ): Promise<PagedListResult<T>> {
        const uid = this.getCurrentUid();
        if (!uid)
            return this.buildPagedResult([], limit, offset);

        const snapshot = await this.firebaseContextSvc.run(() => getDocs(
            collection(this.firestore, 'private_users', uid, collectionName)
        ));
        const items = snapshot.docs
            .map((item) => mapper(item.data(), item.id))
            .filter((item): item is T => item !== null)
            .sort(sorter);

        return this.buildPagedResult(items, limit, offset);
    }

    private watchPagedCollection<T>(
        collectionName: string,
        limit: number,
        offset: number,
        mapper: (raw: any, docId: string) => T | null,
        sorter: (a: T, b: T) => number,
        next: (result: PagedListResult<T>) => void,
        onError?: (error: unknown) => void
    ): () => void {
        const uid = this.getCurrentUid();
        if (!uid) {
            next(this.buildPagedResult([], limit, offset));
            return () => undefined;
        }

        return this.firebaseContextSvc.run(() => onSnapshot(
            collection(this.firestore, 'private_users', uid, collectionName),
            (snapshot) => {
                const items = snapshot.docs
                    .map((item) => mapper(item.data(), item.id))
                    .filter((item): item is T => item !== null)
                    .sort(sorter);
                next(this.buildPagedResult(items, limit, offset));
            },
            (error) => onError?.(error)
        ));
    }

    private getDocumentRef(...pathSegments: string[]): any {
        return doc(this.firestore as any, ...(pathSegments as any));
    }

    private readDocument(documentRef: any): Promise<any> {
        return this.firebaseContextSvc.run(() => getDoc(documentRef));
    }

    private getCurrentUid(): string {
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }

    private mapPrivateProfile(raw: any, fallbackUid: string): UserPrivateProfile {
        const currentUser = this.auth.currentUser;
        const fallbackEmail = this.toNullableText(currentUser?.email);
        const fallbackDisplayName = this.toNullableText(currentUser?.displayName)
            ?? this.fallbackDisplayName(fallbackEmail)
            ?? 'Usuario';

        return {
            uid: this.toNullableText(raw?.uid) ?? fallbackUid,
            displayName: this.toNullableText(raw?.displayName) ?? fallbackDisplayName,
            bio: this.normalizeMultilineText(raw?.bio),
            genderIdentity: this.toNullableText(raw?.genderIdentity),
            pronouns: this.toNullableText(raw?.pronouns),
            email: this.toNullableText(raw?.email) ?? fallbackEmail,
            emailVerified: raw?.emailVerified === true || currentUser?.emailVerified === true,
            authProvider: this.normalizeAuthProvider(raw?.authProvider, currentUser),
            photoUrl: this.toNullableText(raw?.photoUrl),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            createdAt: this.toNullableText(raw?.createdAt),
            lastSeenAt: this.toNullableText(raw?.lastSeenAt),
            role: this.normalizeRole(
                raw?.role
                ?? raw?.currentRole
                ?? raw?.roleCode
                ?? raw?.roles?.type
                ?? raw?.acl?.role
            ),
            permissions: this.normalizePermissions(
                raw?.permissions
                ?? raw?.permissionsMap
                ?? raw?.acl?.permissions
                ?? raw?.permissionsCreate
                ?? raw
            ),
            compliance: this.normalizeCompliance(
                raw?.compliance
                ?? raw?.privateState?.compliance
                ?? raw?.access?.compliance
            ),
        };
    }

    private mapSettings(raw: any): UserSettingsV1 {
        const base = createDefaultUserSettings();
        if (!raw || typeof raw !== 'object')
            return base;

        return {
            version: 1,
            nuevo_personaje: {
                generador_config: this.normalizeGeneradorConfig(raw?.nuevo_personaje?.generador_config),
                preview_minimizada: this.normalizePreviewMinimizada(raw?.nuevo_personaje?.preview_minimizada),
                preview_restaurada: this.normalizePreviewRestaurada(raw?.nuevo_personaje?.preview_restaurada),
            },
            perfil: {
                visibilidadPorDefectoPersonajes: raw?.perfil?.visibilidadPorDefectoPersonajes === true,
                mostrarPerfilPublico: raw?.perfil?.mostrarPerfilPublico !== false,
                allowDirectMessagesFromNonFriends: raw?.perfil?.allowDirectMessagesFromNonFriends === true,
                autoAbrirVentanaChats: raw?.perfil?.autoAbrirVentanaChats !== false,
                permitirBurbujasChat: raw?.perfil?.permitirBurbujasChat !== false,
                notificaciones: {
                    mensajes: raw?.perfil?.notificaciones?.mensajes !== false,
                    amistad: raw?.perfil?.notificaciones?.amistad !== false,
                    campanas: raw?.perfil?.notificaciones?.campanas !== false,
                    cuentaSistema: raw?.perfil?.notificaciones?.cuentaSistema !== false,
                },
            },
            mensajeria_flotante: this.normalizeChatFloatingSettings(raw?.mensajeria_flotante),
        };
    }

    private mapFriendItem(raw: any, docId: string): FriendItem | null {
        const user = this.mapSocialUserBasic(raw?.target ?? raw?.friend ?? raw, docId);
        if (!user)
            return null;

        return {
            ...user,
            friendsSince: this.toNullableText(raw?.friendsSince ?? raw?.friendsSinceUtc ?? raw?.createdAtUtc ?? raw?.createdAt),
        };
    }

    private mapFriendRequestItem(raw: any, docId: string, fallbackDirection: FriendRequestDirection): FriendRequestItem | null {
        const requestId = this.firstPositiveInt(
            raw?.requestId,
            raw?.friendRequestId,
            raw?.friend_request_id,
            raw?.idSolicitud,
            raw?.solicitudId,
            raw?.IdSolicitud,
            raw?.RequestId,
            raw?.id,
            docId
        );
        if (!requestId)
            return null;

        const target = this.mapSocialUserBasic(
            this.resolveFriendRequestTargetRaw(raw),
            this.toNullableText(
                raw?.targetUid
                ?? raw?.targetFirebaseUid
                ?? raw?.counterpartUid
                ?? raw?.counterpartFirebaseUid
                ?? raw?.requesterUid
                ?? raw?.requesterFirebaseUid
                ?? raw?.senderUid
                ?? raw?.senderFirebaseUid
                ?? raw?.fromUid
                ?? raw?.fromFirebaseUid
                ?? raw?.sourceUid
                ?? raw?.sourceFirebaseUid
                ?? raw?.recipientUid
                ?? raw?.recipientFirebaseUid
                ?? raw?.toUid
                ?? raw?.toFirebaseUid
                ?? raw?.solicitanteUid
                ?? raw?.emisorUid
                ?? raw?.remitenteUid
                ?? raw?.destinatarioUid
            ) ?? ''
        );
        if (!target)
            return null;

        const directionRaw = `${raw?.direction ?? raw?.direccion ?? fallbackDirection}`.trim().toLowerCase();
        const statusRaw = `${raw?.status ?? raw?.estado ?? raw?.Status ?? ''}`.trim().toLowerCase();

        return {
            requestId,
            direction: directionRaw === 'received' || directionRaw === 'incoming' || directionRaw === 'recibida'
                ? 'received'
                : 'sent',
            status: statusRaw === 'accepted' || statusRaw === 'rejected' || statusRaw === 'canceled'
                ? statusRaw
                : statusRaw === 'cancelled'
                    ? 'canceled'
                : 'pending',
            createdAtUtc: this.toNullableText(raw?.createdAtUtc ?? raw?.createdAt ?? raw?.sentAtUtc),
            target,
        };
    }

    private mapSocialUserBasic(raw: any, fallbackUid: string): SocialUserBasic | null {
        const uid = this.toNullableText(
            raw?.uid
            ?? raw?.firebaseUid
            ?? raw?.FirebaseUid
            ?? raw?.uidFirebase
            ?? raw?.targetUid
            ?? raw?.targetFirebaseUid
            ?? raw?.friendUid
            ?? raw?.friendFirebaseUid
            ?? raw?.counterpartUid
            ?? raw?.counterpartFirebaseUid
            ?? raw?.requesterUid
            ?? raw?.requesterFirebaseUid
            ?? raw?.senderUid
            ?? raw?.senderFirebaseUid
            ?? raw?.fromUid
            ?? raw?.fromFirebaseUid
            ?? raw?.sourceUid
            ?? raw?.sourceFirebaseUid
            ?? raw?.recipientUid
            ?? raw?.recipientFirebaseUid
            ?? raw?.toUid
            ?? raw?.toFirebaseUid
            ?? raw?.solicitanteUid
            ?? raw?.emisorUid
            ?? raw?.remitenteUid
            ?? raw?.destinatarioUid
            ?? fallbackUid
        );
        if (!uid)
            return null;

        return {
            uid,
            displayName: this.toNullableText(raw?.displayName),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
            allowDirectMessagesFromNonFriends: raw?.allowDirectMessagesFromNonFriends === true,
        };
    }

    private resolveFriendRequestTargetRaw(raw: any): any {
        return raw?.target
            ?? raw?.user
            ?? raw?.targetUser
            ?? raw?.counterpart
            ?? raw?.requester
            ?? raw?.sender
            ?? raw?.fromUser
            ?? raw?.recipient
            ?? raw?.toUser
            ?? raw?.solicitante
            ?? raw?.emisor
            ?? raw?.remitente
            ?? raw?.destinatario
            ?? raw;
    }

    private mapCampaignSummary(raw: any, docId: string): CampaignListItem | null {
        const id = this.toPositiveInt(raw?.id ?? raw?.idCampana ?? raw?.IdCampana ?? raw?.Id ?? raw?.i ?? docId);
        if (!id)
            return null;

        return {
            id,
            nombre: this.toNullableText(raw?.nombre ?? raw?.Nombre ?? raw?.NombreCampana ?? raw?.n) ?? `Campaña ${id}`,
            campaignRole: this.normalizeNullableCampaignRole(
                raw?.campaignRole
                ?? raw?.CampaignRole
                ?? raw?.role
                ?? raw?.Role
                ?? raw?.rolCampana
                ?? raw?.RolCampana
            ),
            membershipStatus: this.normalizeNullableMembershipStatus(
                raw?.membershipStatus
                ?? raw?.MembershipStatus
                ?? raw?.status
                ?? raw?.Status
                ?? raw?.memberStatus
                ?? raw?.MemberStatus
                ?? raw?.estado
                ?? raw?.Estado
            ),
            ...(raw?.isOwner === true ? { isOwner: true } : {}),
        };
    }

    private mapCharacter(raw: any, docId: string): PersonajeSimple | null {
        const id = this.toPositiveInt(raw?.Id ?? raw?.i ?? raw?.id ?? docId);
        if (!id)
            return null;

        const idRegion = Math.max(0, Math.trunc(Number(
            raw?.id_region
            ?? raw?.idRegion
            ?? raw?.Id_region
            ?? raw?.Region?.Id
            ?? raw?.region?.Id
            ?? 0
        )));
        const regionNombre = this.toNullableText(
            raw?.Region?.Nombre
            ?? raw?.Region?.nombre
            ?? raw?.region?.Nombre
            ?? raw?.region?.nombre
        );

        return {
            Id: id,
            Nombre: this.toNullableText(raw?.Nombre ?? raw?.n) ?? `Personaje ${id}`,
            ownerUid: this.toNullableText(raw?.ownerUid),
            ownerDisplayName: this.toNullableText(raw?.ownerDisplayName),
            campaignId: this.toPositiveInt(raw?.campaignId ?? raw?.campaign_id ?? raw?.idCampana) ?? null,
            campaignName: this.toNullableText(raw?.campaignName ?? raw?.campaign_name ?? raw?.nombreCampana),
            accessReason: this.normalizeCharacterAccessReason(raw?.accessReason ?? raw?.access_reason),
            visible_otros_usuarios: raw?.visible_otros_usuarios === true,
            Id_region: idRegion,
            Region: {
                Id: idRegion,
                Nombre: regionNombre ?? (idRegion === 0 ? 'Sin region' : ''),
            },
            Raza: raw?.Raza ?? raw?.r ?? { Id: 0, Nombre: 'Sin raza' },
            RazaBase: raw?.RazaBase ?? raw?.razaBase ?? null,
            Clases: this.toNullableText(raw?.Clases ?? raw?.c) ?? '',
            Contexto: this.toNullableText(raw?.Contexto ?? raw?.co) ?? '',
            Personalidad: this.toNullableText(raw?.Personalidad ?? raw?.p) ?? '',
            Campana: this.toNullableText(raw?.Campana ?? raw?.Campaña ?? raw?.ca) ?? 'Sin campaña',
            Trama: this.toNullableText(raw?.Trama ?? raw?.t) ?? 'Trama base',
            Subtrama: this.toNullableText(raw?.Subtrama ?? raw?.s) ?? 'Subtrama base',
            Archivado: this.toBoolean(raw?.archivado ?? raw?.Archivado ?? raw?.a),
        };
    }

    private normalizeCharacterAccessReason(value: any): PersonajeSimple['accessReason'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'owner' || normalized === 'campaign_public' || normalized === 'campaign_master')
            return normalized;
        return null;
    }

    private normalizePermissions(raw: any): UserPrivateProfile['permissions'] {
        if (!raw)
            return {};

        if (Array.isArray(raw)) {
            return raw.reduce<UserPrivateProfile['permissions']>((acc, item) => {
                const resource = `${item?.resource ?? item?.Resource ?? ''}`.trim();
                if (resource.length < 1)
                    return acc;

                acc[resource] = {
                    create: item?.allowed === true,
                };
                return acc;
            }, {});
        }

        if (typeof raw !== 'object')
            return {};

        return Object.entries(raw).reduce<UserPrivateProfile['permissions']>((acc, [resource, value]) => {
            const key = `${resource ?? ''}`.trim();
            if (key.length < 1)
                return acc;

            const resourceValue = value as { create?: boolean; allowed?: boolean; } | null | undefined;
            if (typeof resourceValue !== 'object' || resourceValue === null)
                return acc;
            if (!Object.prototype.hasOwnProperty.call(resourceValue, 'create')
                && !Object.prototype.hasOwnProperty.call(resourceValue, 'allowed'))
                return acc;

            acc[key] = {
                create: resourceValue?.create === true || resourceValue?.allowed === true,
            };
            return acc;
        }, {});
    }

    private normalizeCompliance(raw: any): UserComplianceSnapshot | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const activeSanction = this.normalizeModerationSanction(raw?.activeSanction)
            ?? this.buildEffectiveModerationSanction(raw);
        const moderationStatus = this.normalizeModerationStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        return {
            banned: raw?.banned === true
                || moderationStatus === 'blocked'
                || moderationStatus === 'banned'
                || !!activeSanction,
            mustAcceptUsage: raw?.mustAcceptUsage === true,
            mustAcceptCreation: raw?.mustAcceptCreation === true,
            activeSanction,
            usage: this.normalizeCompliancePolicy(raw?.usage),
            creation: this.normalizeCompliancePolicy(raw?.creation),
        };
    }

    private normalizeCompliancePolicy(raw: any): UserCompliancePolicyState | null {
        if (!raw || typeof raw !== 'object')
            return null;

        return {
            version: this.toNullableText(raw?.version ?? raw?.versionTag ?? raw?.versionCode),
            accepted: raw?.accepted === true || raw?.isAccepted === true || raw?.acceptedVersionMatchesActive === true,
            acceptedAtUtc: this.toNullableText(raw?.acceptedAtUtc ?? raw?.acceptedAt),
            publishedAtUtc: this.toNullableText(raw?.publishedAtUtc ?? raw?.effectiveAtUtc ?? raw?.activeSinceUtc),
            title: this.toNullableText(raw?.title ?? raw?.name),
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

    private buildEffectiveModerationSanction(raw: any): UserModerationSanction | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const moderationStatus = this.normalizeModerationStatus(raw?.moderationStatus ?? raw?.effectiveStatus);
        const endsAtUtc = this.toNullableText(raw?.blockedUntilUtc ?? raw?.expiresAtUtc ?? raw?.endAtUtc);
        const hasExplicitPermanent = raw?.isPermanent === true || raw?.permanent === true;
        const isPermanent = hasExplicitPermanent || (moderationStatus === 'banned' && endsAtUtc === null);

        if (moderationStatus !== 'blocked' && moderationStatus !== 'banned' && !endsAtUtc && !isPermanent)
            return null;

        return {
            sanctionId: null,
            kind: 'restriction',
            code: isPermanent ? 'technical_account_restriction_permanent' : 'technical_account_restriction_temporary',
            name: isPermanent ? 'Restricción permanente de cuenta' : 'Restricción temporal de cuenta',
            startsAtUtc: null,
            endsAtUtc,
            isPermanent,
        };
    }

    private normalizeModerationStatus(value: any): string | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'none' || normalized === 'blocked' || normalized === 'banned')
            return normalized;
        return null;
    }

    private normalizeAuthProvider(rawValue: any, currentUser: any): AuthProviderType {
        const normalized = `${rawValue ?? ''}`.trim().toLowerCase();
        if (normalized === 'correo' || normalized === 'google')
            return normalized;

        const providerIds = Array.isArray(currentUser?.providerData)
            ? currentUser.providerData.map((provider: any) => `${provider?.providerId ?? ''}`.trim().toLowerCase())
            : [];
        if (providerIds.includes('google.com'))
            return 'google';
        if (providerIds.includes('password') || providerIds.includes('email'))
            return 'correo';
        return 'otro';
    }

    private normalizeRole(value: any): UserRole {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'admin' || normalized === 'colaborador' || normalized === 'master')
            return normalized as UserRole;
        return 'jugador';
    }

    private normalizeNullableCampaignRole(value: any): CampaignListItem['campaignRole'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'master')
            return 'master';
        if (normalized === 'jugador')
            return 'jugador';
        return null;
    }

    private normalizeNullableMembershipStatus(value: any): CampaignListItem['membershipStatus'] {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'activo')
            return 'activo';
        if (normalized === 'inactivo')
            return 'inactivo';
        if (normalized === 'expulsado')
            return 'expulsado';
        return null;
    }

    private normalizeGeneradorConfig(raw: any): UserSettingsV1['nuevo_personaje']['generador_config'] {
        if (!raw || typeof raw !== 'object')
            return null;

        const minimoSeleccionado = Number(raw?.minimoSeleccionado);
        const tablasPermitidas = Number(raw?.tablasPermitidas);
        const updatedAt = Number(raw?.updatedAt);
        if (!Number.isFinite(minimoSeleccionado) || !Number.isFinite(tablasPermitidas) || !Number.isFinite(updatedAt))
            return null;

        return {
            minimoSeleccionado: Math.trunc(minimoSeleccionado),
            tablasPermitidas: Math.trunc(tablasPermitidas),
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizePreviewMinimizada(raw: any): UserSettingsV1['nuevo_personaje']['preview_minimizada'] {
        return this.normalizeFloatingPlacementMinimized(raw);
    }

    private normalizePreviewRestaurada(raw: any): UserSettingsV1['nuevo_personaje']['preview_restaurada'] {
        return this.normalizeFloatingPlacementRestored(raw);
    }

    private normalizeFloatingPlacementMinimized(raw: any): FloatingWindowPlacementMinimized | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const version = Number(raw?.version);
        const side = `${raw?.side ?? ''}`.trim().toLowerCase();
        const top = Number(raw?.top);
        const updatedAt = Number(raw?.updatedAt);
        if (version !== 1 || (side !== 'left' && side !== 'right') || !Number.isFinite(top) || !Number.isFinite(updatedAt))
            return null;

        return {
            version: 1,
            side,
            top,
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizeFloatingPlacementRestored(raw: any): FloatingWindowPlacementRestored | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const version = Number(raw?.version);
        const left = Number(raw?.left);
        const top = Number(raw?.top);
        const width = Number(raw?.width);
        const height = Number(raw?.height);
        const updatedAt = Number(raw?.updatedAt);
        if (version !== 1)
            return null;
        if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(updatedAt))
            return null;
        if (width <= 0 || height <= 0)
            return null;

        return {
            version: 1,
            left,
            top,
            width,
            height,
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizeChatFloatingWindowState(raw: any): ChatFloatingWindowState | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const mode = `${raw?.mode ?? ''}`.trim().toLowerCase();
        const updatedAt = Number(raw?.updatedAt);
        if ((mode !== 'window' && mode !== 'minimized' && mode !== 'maximized') || !Number.isFinite(updatedAt))
            return null;

        return {
            version: 1,
            mode: mode as ChatFloatingWindowState['mode'],
            restoredPlacement: this.normalizeFloatingPlacementRestored(raw?.restoredPlacement),
            minimizedPlacement: this.normalizeFloatingPlacementMinimized(raw?.minimizedPlacement),
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizeChatFloatingBubbleState(raw: any): ChatFloatingBubbleState | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const conversationId = this.toPositiveInt(raw?.conversationId);
        const mode = `${raw?.mode ?? ''}`.trim().toLowerCase();
        const updatedAt = Number(raw?.updatedAt);
        if (!conversationId)
            return null;
        if ((mode !== 'window' && mode !== 'bubble' && mode !== 'maximized') || !Number.isFinite(updatedAt))
            return null;

        return {
            version: 1,
            conversationId,
            mode: mode as ChatFloatingBubbleState['mode'],
            restoredPlacement: this.normalizeFloatingPlacementRestored(raw?.restoredPlacement),
            bubblePlacement: this.normalizeFloatingPlacementMinimized(raw?.bubblePlacement),
            updatedAt: Math.trunc(updatedAt),
        };
    }

    private normalizeChatFloatingSettings(raw: any): ChatFloatingSettings | null {
        if (!raw || typeof raw !== 'object')
            return null;

        const bubbleMap = new Map<number, ChatFloatingBubbleState>();
        const source = Array.isArray(raw?.burbujas_abiertas) ? raw.burbujas_abiertas : [];
        source.forEach((item: any) => {
            const normalized = this.normalizeChatFloatingBubbleState(item);
            if (normalized)
                bubbleMap.set(normalized.conversationId, normalized);
        });

        return {
            version: 1,
            ventana_chat: this.normalizeChatFloatingWindowState(raw?.ventana_chat),
            burbujas_abiertas: [...bubbleMap.values()].sort((a, b) => a.updatedAt - b.updatedAt),
        };
    }

    private buildPagedResult<T>(items: T[], limit: number, offset: number): PagedListResult<T> {
        const normalizedLimit = this.normalizeLimit(limit);
        const normalizedOffset = this.normalizeOffset(offset);
        const sliced = items.slice(normalizedOffset, normalizedOffset + normalizedLimit);

        return {
            items: sliced,
            meta: {
                totalCount: items.length,
                limit: normalizedLimit,
                offset: normalizedOffset,
                hasMore: normalizedOffset + normalizedLimit < items.length,
            },
        };
    }

    private normalizeLimit(value: number, fallback: number = 25): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 1)
            return fallback;
        return Math.min(100, parsed);
    }

    private normalizeOffset(value: number): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private firstPositiveInt(...values: any[]): number | null {
        for (const value of values) {
            const parsed = this.toPositiveInt(value);
            if (parsed)
                return parsed;
        }
        return null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private toBoolean(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value === 1;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
        }
        return false;
    }

    private normalizeMultilineText(value: any): string | null {
        const text = `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        return text.length > 0 ? text : null;
    }

    private fallbackDisplayName(email: string | null): string | null {
        const normalized = `${email ?? ''}`.trim();
        if (normalized.length < 1)
            return null;

        const atPos = normalized.indexOf('@');
        if (atPos > 0)
            return normalized.substring(0, atPos);
        return normalized;
    }

    private compareText(a: string, b: string): number {
        return `${a ?? ''}`.localeCompare(`${b ?? ''}`, 'es', { sensitivity: 'base' });
    }

    private toDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }
}
