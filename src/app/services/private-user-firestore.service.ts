import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
    Firestore,
    collection,
    doc,
    getDocs,
    onSnapshot,
} from '@angular/fire/firestore';
import { UserPrivateProfile } from '../interfaces/user-account';
import { CampaignListItem } from '../interfaces/campaign-management';
import { PersonajeSimple } from '../interfaces/simplificaciones/personaje-simple';
import { UserRole } from '../interfaces/user-acl';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { toBoolean } from 'src/app/services/utils/normalizacion';

@Injectable({
    providedIn: 'root'
})
export class PrivateUserFirestoreService {
    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

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

    private getDocumentRef(...pathSegments: string[]): any {
        return doc(this.firestore as any, ...(pathSegments as any));
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

        // `meta/profile` trae solo esto (docs/publica/endpoints/usuarios.md). El cumplimiento ya no viene en el
        // perfil: lo da la plataforma en el estado de la sesión (UserService).
        return {
            uid: this.toNullableText(raw?.uid) ?? fallbackUid,
            displayName: this.toNullableText(raw?.displayName) ?? fallbackDisplayName,
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
            compliance: null,
        };
    }

    private mapCampaignSummary(raw: any, docId: string): CampaignListItem | null {
        const id = this.toPositiveInt(raw?.id ?? raw?.idCampana ?? raw?.IdCampana ?? raw?.Id ?? raw?.i ?? docId);
        if (!id)
            return null;

        const detailRevision = this.toNullableText(raw?.detailRevision ?? raw?.DetailRevision);
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
            ...(detailRevision ? { detailRevision } : {}),
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
            Archivado: toBoolean(raw?.archivado ?? raw?.Archivado ?? raw?.a),
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

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
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

}
