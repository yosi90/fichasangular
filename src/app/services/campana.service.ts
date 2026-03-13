import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Database, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Campana } from '../interfaces/campaña';
import {
    CampaignDetailViewModel,
    CampaignListItem,
    CampaignMemberItem,
    CampaignMemberRemovalStatus,
    CampaignMembershipStatus,
    CampaignRoleCode,
    CampaignSubtramaItem,
    CampaignTramaItem,
    CampaignUserSearchResult,
    TransferCampaignMasterInput,
} from '../interfaces/campaign-management';
import { environment } from 'src/environments/environment';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

@Injectable({
    providedIn: 'root'
})
export class CampanaService {
    private readonly campanasBaseUrl = `${environment.apiUrl}campanas`;
    private readonly tramasBaseUrl = `${environment.apiUrl}tramas`;
    private readonly subtramasBaseUrl = `${environment.apiUrl}subtramas`;
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;
    private readonly authReadyPromise: Promise<void>;

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) {
        this.authReadyPromise = this.createAuthReadyPromise();
    }

    async getListCampanas(): Promise<Observable<Campana[]>> {
        const headers = await this.buildAuthHeaders();
        const campanas = await this.fetchCampanasWithActiveMembership(headers);
        return of(campanas);
    }

    async listVisibleCampaigns(): Promise<CampaignListItem[]> {
        try {
            return await this.fetchCampaignSummaries(await this.buildAuthHeaders());
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las campañas visibles.');
        }
    }

    async listProfileCampaigns(): Promise<CampaignListItem[]> {
        try {
            const headers = await this.buildAuthHeaders();
            const actorUid = `${this.auth.currentUser?.uid ?? ''}`.trim();
            const campaigns = await this.fetchCampaignSummaries(headers);
            return await this.filterCampaignsForProfile(campaigns, headers, actorUid);
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las campañas del perfil.');
        }
    }

    async getCampaignDetail(idCampana: number, includeInactive: boolean = false): Promise<CampaignDetailViewModel> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            const headers = await this.buildAuthHeaders();
            const campaignDetail = await this.fetchCampaignDetailHeader(id, headers);

            const [members, tramas] = await Promise.all([
                this.fetchCampaignMembers(id, headers, includeInactive),
                this.fetchCampaignTramas(id, headers),
            ]);

            return {
                campaign: campaignDetail.campaign,
                ownerUid: campaignDetail.ownerUid,
                ownerDisplayName: campaignDetail.ownerDisplayName,
                activeMasterUid: campaignDetail.activeMasterUid,
                activeMasterDisplayName: campaignDetail.activeMasterDisplayName,
                canRecoverMaster: campaignDetail.canRecoverMaster,
                members,
                includeInactiveMembers: includeInactive === true,
                tramas,
                loadingMembers: false,
                loadingTramas: false,
            };
        } catch (error) {
            throw this.toError(error, 'No se pudo cargar el detalle de la campaña.');
        }
    }

    async createCampaign(nombre: string): Promise<CampaignListItem> {
        const nombreNormalizado = this.normalizeRequiredName(nombre, 'Debes indicar un nombre de campaña.');

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    this.campanasBaseUrl,
                    { nombre: nombreNormalizado },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();

            return {
                id: this.toPositiveInt(response?.idCampana) ?? 0,
                nombre: `${response?.nombre ?? nombreNormalizado}`.trim() || nombreNormalizado,
                campaignRole: 'master',
                membershipStatus: 'activo',
            };
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la campaña.');
        }
    }

    async renameCampaign(idCampana: number, nombre: string): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.campanasBaseUrl}/${id}`,
                    { nombre: this.normalizeRequiredName(nombre, 'Debes indicar un nombre de campaña.') },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo renombrar la campaña.');
        }
    }

    async listCampaignMembers(idCampana: number, includeInactive: boolean = false): Promise<CampaignMemberItem[]> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            return await this.fetchCampaignMembers(id, await this.buildAuthHeaders(), includeInactive);
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar los miembros de la campaña.');
        }
    }

    async addCampaignMember(idCampana: number, targetUid: string): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        const uid = `${targetUid ?? ''}`.trim();
        if (!id || uid.length < 1)
            throw new Error('Datos inválidos para añadir el jugador.');

        try {
            const headers = await this.buildAuthHeaders();
            await firstValueFrom(
                this.http.post<void>(
                    `${this.campanasBaseUrl}/${id}/jugadores`,
                    { targetUid: uid },
                    { headers }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo añadir el jugador a la campaña.');
        }
    }

    async removeCampaignMember(
        idCampana: number,
        targetUid: string,
        status: CampaignMemberRemovalStatus = 'expulsado'
    ): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        const uid = `${targetUid ?? ''}`.trim();
        if (!id || uid.length < 1)
            throw new Error('Datos inválidos para retirar el jugador.');

        try {
            await firstValueFrom(
                this.http.delete<void>(
                    `${this.campanasBaseUrl}/${id}/jugadores/${encodeURIComponent(uid)}`,
                    {
                        body: { status },
                        headers: await this.buildAuthHeaders(),
                    }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo retirar el jugador de la campaña.');
        }
    }

    async transferCampaignMaster(idCampana: number, input: TransferCampaignMasterInput): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        const targetUid = `${input?.targetUid ?? ''}`.trim();
        if (!id || targetUid.length < 1)
            throw new Error('Datos inválidos para transferir el master de la campaña.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.campanasBaseUrl}/${id}/master`,
                    {
                        targetUid,
                        keepPreviousAsPlayer: input.keepPreviousAsPlayer !== false,
                    },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo transferir el master de la campaña.');
        }
    }

    async recoverCampaignMaster(idCampana: number): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            await firstValueFrom(
                this.http.post<void>(
                    `${this.campanasBaseUrl}/${id}/master/recover`,
                    {},
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo recuperar el master de la campaña.');
        }
    }

    async searchUsers(query: string, limit: number = 10): Promise<CampaignUserSearchResult[]> {
        const q = `${query ?? ''}`.trim();
        if (q.length < 2)
            return [];

        try {
            const response = await firstValueFrom(
                this.http.get<any[]>(`${this.usuariosBaseUrl}/search`, {
                    params: {
                        q,
                        limit: `${Math.min(20, Math.max(1, Math.trunc(Number(limit) || 10)))}`,
                    },
                })
            );
            const raw = Array.isArray(response) ? response : Object.values(response ?? {});
            return raw
                .map((item) => this.normalizeUserSearchResult(item))
                .filter((item): item is CampaignUserSearchResult => item !== null);
        } catch (error) {
            throw this.toError(error, 'No se pudo buscar usuarios.');
        }
    }

    async createTrama(idCampana: number, nombre: string): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            await firstValueFrom(
                this.http.post<void>(
                    `${this.tramasBaseUrl}/campana/${id}`,
                    { nombre: this.normalizeRequiredName(nombre, 'Debes indicar un nombre de trama.') },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la trama.');
        }
    }

    async updateTrama(idTrama: number, nombre: string): Promise<void> {
        const id = this.toPositiveInt(idTrama);
        if (!id)
            throw new Error('Trama inválida.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.tramasBaseUrl}/${id}`,
                    { nombre: this.normalizeRequiredName(nombre, 'Debes indicar un nombre de trama.') },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo actualizar la trama.');
        }
    }

    async createSubtrama(idTrama: number, nombre: string): Promise<void> {
        const id = this.toPositiveInt(idTrama);
        if (!id)
            throw new Error('Trama inválida.');

        try {
            await firstValueFrom(
                this.http.post<void>(
                    `${this.subtramasBaseUrl}/trama/${id}`,
                    { nombre: this.normalizeRequiredName(nombre, 'Debes indicar un nombre de subtrama.') },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la subtrama.');
        }
    }

    async updateSubtrama(idSubtrama: number, nombre: string): Promise<void> {
        const id = this.toPositiveInt(idSubtrama);
        if (!id)
            throw new Error('Subtrama inválida.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.subtramasBaseUrl}/${id}`,
                    { nombre: this.normalizeRequiredName(nombre, 'Debes indicar un nombre de subtrama.') },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            await this.refreshCampanasCacheBestEffort();
        } catch (error) {
            throw this.toError(error, 'No se pudo actualizar la subtrama.');
        }
    }

    protected writeCampanasCachePayload(payload: Record<string, { Nombre: string; Tramas: any[]; }>): Promise<void> {
        return this.firebaseContextSvc.run(() => set(ref(this.db, 'Campañas'), payload));
    }

    public async RenovarCampañasFirebase(): Promise<boolean> {
        try {
            await this.syncCampanasCache();

            Swal.fire({
                icon: 'success',
                title: 'Listado de campañas, tramas y subtramas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de campañas, ttramas y subtramas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }

    private async syncCampanasCache(): Promise<void> {
        const headers = await this.buildAuthHeaders();
        const campanas = (await this.fetchCampanasActorScoped(headers))
            .filter((campana) => campana.Id > 0 && campana.Nombre !== 'Sin campaña');
        await this.writeCampanasCachePayload(this.buildCampanasCachePayload(campanas));
    }

    private async refreshCampanasCacheBestEffort(): Promise<void> {
        try {
            await this.syncCampanasCache();
        } catch {
            // Best-effort: la mutación principal ya fue aceptada por la API.
        }
    }

    private async fetchCampanasActorScoped(headers: HttpHeaders): Promise<Campana[]> {
        const campanas = await this.fetchCampaignSummaries(headers);
        return this.buildCampanasTree(campanas, headers);
    }

    private async fetchCampanasWithActiveMembership(headers: HttpHeaders): Promise<Campana[]> {
        const campanas = await this.fetchCampaignSummaries(headers);
        return this.buildCampanasTree(
            campanas.filter((campana) => this.hasActiveMembership(campana)),
            headers
        );
    }

    private async filterCampaignsForProfile(
        campanas: CampaignListItem[],
        headers: HttpHeaders,
        actorUid: string
    ): Promise<CampaignListItem[]> {
        const ownUid = `${actorUid ?? ''}`.trim();
        const filtered = await Promise.all(
            (campanas ?? []).map(async (campana) => {
                if (this.hasActiveMembership(campana))
                    return campana?.isOwner === true
                        ? { ...campana, isOwner: true }
                        : { ...campana };

                if (campana?.membershipStatus === 'expulsado')
                    return null;

                if (campana?.isOwner === true)
                    return { ...campana, isOwner: true };

                if (ownUid.length < 1)
                    return null;

                try {
                    const detail = await this.fetchCampaignDetailHeader(campana.id, headers);
                    return `${detail.ownerUid ?? ''}`.trim() === ownUid
                        ? { ...campana, isOwner: true }
                        : null;
                } catch {
                    return null;
                }
            })
        );

        return filtered.filter((campana) => campana !== null) as CampaignListItem[];
    }

    private async buildCampanasTree(campanas: CampaignListItem[], headers: HttpHeaders): Promise<Campana[]> {
        const campaignTrees = await Promise.all(
            campanas.map(async (campana) => ({
                Id: campana.id,
                Nombre: campana.nombre,
                Tramas: (await this.fetchCampaignTramas(campana.id, headers)).map((trama) => ({
                    Id: trama.id,
                    Nombre: trama.nombre,
                    Subtramas: trama.subtramas.map((subtrama) => ({
                        Id: subtrama.id,
                        Nombre: subtrama.nombre,
                    })),
                })),
            }))
        );

        return [
            this.buildSinCampanaOption(),
            ...campaignTrees,
        ];
    }

    private hasActiveMembership(campana: CampaignListItem | null | undefined): boolean {
        return campana?.membershipStatus === 'activo'
            && (campana.campaignRole === 'master' || campana.campaignRole === 'jugador');
    }

    private async fetchCampaignSummaries(headers: HttpHeaders): Promise<CampaignListItem[]> {
        const response = await firstValueFrom(
            this.http.get<any[]>(this.campanasBaseUrl, { headers })
        );
        const raw = Array.isArray(response) ? response : Object.values(response ?? {});
        return raw
            .map((item) => this.normalizeCampaignSummary(item))
            .filter((item): item is CampaignListItem => item !== null)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private async fetchCampaignDetailHeader(
        idCampana: number,
        headers: HttpHeaders
    ): Promise<Pick<CampaignDetailViewModel, 'campaign' | 'ownerUid' | 'ownerDisplayName' | 'activeMasterUid' | 'activeMasterDisplayName' | 'canRecoverMaster'>> {
        const response = await firstValueFrom(
            this.http.get<any>(`${this.campanasBaseUrl}/${idCampana}`, { headers })
        );
        const campaign = this.normalizeCampaignSummary(response);
        if (!campaign)
            throw new Error('La campaña solicitada ya no está disponible para tu usuario.');

        return {
            campaign,
            ownerUid: this.toNullableText(response?.ownerUid),
            ownerDisplayName: this.toNullableText(response?.ownerDisplayName),
            activeMasterUid: this.toNullableText(response?.activeMasterUid),
            activeMasterDisplayName: this.toNullableText(response?.activeMasterDisplayName),
            canRecoverMaster: response?.canRecoverMaster === true,
        };
    }

    private async fetchCampaignMembers(
        idCampana: number,
        headers: HttpHeaders,
        includeInactive: boolean
    ): Promise<CampaignMemberItem[]> {
        const response = await firstValueFrom(
            this.http.get<any[]>(`${this.campanasBaseUrl}/${idCampana}/jugadores`, {
                headers,
                params: includeInactive ? { includeInactive: 'true' } : undefined,
            })
        );
        const raw = Array.isArray(response) ? response : Object.values(response ?? {});
        return raw
            .map((item) => this.normalizeCampaignMember(item))
            .filter((item): item is CampaignMemberItem => item !== null)
            .sort((a, b) => {
                if (a.campaignRole !== b.campaignRole)
                    return a.campaignRole === 'master' ? -1 : 1;
                return this.getDisplayLabel(a).localeCompare(this.getDisplayLabel(b), 'es', { sensitivity: 'base' });
            });
    }

    private async fetchCampaignTramas(idCampana: number, headers: HttpHeaders): Promise<CampaignTramaItem[]> {
        const tramasResponse = await firstValueFrom(
            this.http.get<any[]>(`${this.tramasBaseUrl}/campana/${idCampana}`, { headers })
        );
        const tramasRaw = Array.isArray(tramasResponse)
            ? tramasResponse
            : Object.values(tramasResponse ?? {});

        const tramas = await Promise.all(
            tramasRaw.map(async (item) => {
                const trama = this.normalizeCampaignTrama(item);
                if (!trama)
                    return null;

                const subtramas = await this.fetchCampaignSubtramas(trama.id, headers);
                return {
                    ...trama,
                    subtramas,
                };
            })
        );

        return tramas
            .filter((item): item is CampaignTramaItem => item !== null)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private async fetchCampaignSubtramas(idTrama: number, headers: HttpHeaders): Promise<CampaignSubtramaItem[]> {
        const response = await firstValueFrom(
            this.http.get<any[]>(`${this.subtramasBaseUrl}/trama/${idTrama}`, { headers })
        );
        const raw = Array.isArray(response) ? response : Object.values(response ?? {});
        return raw
            .map((item) => this.normalizeCampaignSubtrama(item))
            .filter((item): item is CampaignSubtramaItem => item !== null)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private normalizeCampaignSummary(raw: any): CampaignListItem | null {
        const id = this.toPositiveInt(raw?.i ?? raw?.Id ?? raw?.id ?? raw?.idCampana ?? raw?.IdCampana);
        if (!id)
            return null;

        const normalizedRoleSource = raw?.campaignRole
            ?? raw?.CampaignRole
            ?? raw?.role
            ?? raw?.Role
            ?? raw?.rolCampana
            ?? raw?.RolCampana;
        const normalizedStatusSource = raw?.membershipStatus
            ?? raw?.MembershipStatus
            ?? raw?.status
            ?? raw?.Status
            ?? raw?.memberStatus
            ?? raw?.MemberStatus
            ?? raw?.estado
            ?? raw?.Estado;

        const isOwner = raw?.isOwner === true;
        return {
            id,
            nombre: `${raw?.n ?? raw?.Nombre ?? raw?.nombre ?? raw?.NombreCampana ?? ''}`.trim(),
            campaignRole: this.normalizeNullableCampaignRole(normalizedRoleSource),
            membershipStatus: this.normalizeNullableMembershipStatus(normalizedStatusSource),
            ...(isOwner ? { isOwner: true } : {}),
        };
    }

    private normalizeCampaignMember(raw: any): CampaignMemberItem | null {
        const uid = `${raw?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return null;

        const campaignRole = this.normalizeCampaignRole(
            raw?.campaignRole
            ?? raw?.CampaignRole
            ?? raw?.role
            ?? raw?.Role
            ?? raw?.rolCampana
            ?? raw?.RolCampana
        );
        const membershipStatus = this.normalizeMembershipStatus(
            raw?.membershipStatus
            ?? raw?.MembershipStatus
            ?? raw?.status
            ?? raw?.Status
            ?? raw?.memberStatus
            ?? raw?.MemberStatus
            ?? raw?.estado
            ?? raw?.Estado
        );
        return {
            userId: this.toNullableText(raw?.userId),
            uid,
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
            campaignRole,
            membershipStatus,
            isActive: raw?.isActive === true || membershipStatus === 'activo',
            addedAtUtc: this.toNullableText(raw?.addedAtUtc),
            addedByUserId: this.toNullableText(raw?.addedByUserId),
        };
    }

    private normalizeCampaignTrama(raw: any): CampaignTramaItem | null {
        const id = this.toPositiveInt(raw?.i ?? raw?.Id ?? raw?.id);
        if (!id)
            return null;

        return {
            id,
            nombre: `${raw?.n ?? raw?.Nombre ?? raw?.nombre ?? ''}`.trim(),
            subtramas: [],
        };
    }

    private normalizeCampaignSubtrama(raw: any): CampaignSubtramaItem | null {
        const id = this.toPositiveInt(raw?.i ?? raw?.Id ?? raw?.id);
        if (!id)
            return null;

        return {
            id,
            nombre: `${raw?.n ?? raw?.Nombre ?? raw?.nombre ?? ''}`.trim(),
        };
    }

    private normalizeUserSearchResult(raw: any): CampaignUserSearchResult | null {
        const uid = `${raw?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return null;

        return {
            uid,
            displayName: this.toNullableText(raw?.displayName),
            photoThumbUrl: this.toNullableText(raw?.photoThumbUrl),
        };
    }

    private buildSinCampanaOption(): Campana {
        return {
            Id: 0,
            Nombre: 'Sin campaña',
            Tramas: [],
        };
    }

    private buildCampanasCachePayload(campanas: Campana[]): Record<string, { Nombre: string; Tramas: any[]; }> {
        const payload: Record<string, { Nombre: string; Tramas: any[]; }> = {};
        campanas.forEach((campana) => {
            if (this.toPositiveInt(campana?.Id) !== campana.Id)
                return;

            payload[`${campana.Id}`] = {
                Nombre: `${campana.Nombre ?? ''}`.trim(),
                Tramas: (campana.Tramas ?? []).map((trama) => ({
                    Id: this.toPositiveInt(trama?.Id) ?? 0,
                    Nombre: `${trama?.Nombre ?? ''}`.trim(),
                    Subtramas: (trama?.Subtramas ?? []).map((subtrama) => ({
                        Id: this.toPositiveInt(subtrama?.Id) ?? 0,
                        Nombre: `${subtrama?.Nombre ?? ''}`.trim(),
                    })),
                })),
            };
        });
        return payload;
    }

    private normalizeCampaignRole(value: any): CampaignRoleCode {
        return `${value ?? ''}`.trim().toLowerCase() === 'master' ? 'master' : 'jugador';
    }

    private normalizeNullableCampaignRole(value: any): CampaignRoleCode | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'master')
            return 'master';
        if (normalized === 'jugador')
            return 'jugador';
        return null;
    }

    private normalizeMembershipStatus(value: any): CampaignMembershipStatus {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'inactivo')
            return 'inactivo';
        if (normalized === 'expulsado')
            return 'expulsado';
        return 'activo';
    }

    private normalizeNullableMembershipStatus(value: any): CampaignMembershipStatus | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'activo')
            return 'activo';
        if (normalized === 'inactivo')
            return 'inactivo';
        if (normalized === 'expulsado')
            return 'expulsado';
        return null;
    }

    private normalizeRequiredName(value: string, emptyMessage: string): string {
        const nombre = `${value ?? ''}`.trim();
        if (nombre.length < 1)
            throw new Error(emptyMessage);
        return nombre;
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private getDisplayLabel(member: CampaignMemberItem): string {
        return `${member.displayName ?? member.email ?? member.uid}`.trim();
    }

    private toError(error: any, fallbackMessage: string): Error {
        if (error instanceof Error)
            return error;

        if (error instanceof HttpErrorResponse) {
            const bodyMessage = this.extractErrorMessage(error.error);
            return new Error(bodyMessage || `${fallbackMessage} (HTTP ${error.status || 0})`);
        }

        return new Error(`${error?.message ?? fallbackMessage}`.trim() || fallbackMessage);
    }

    private extractErrorMessage(body: any): string {
        if (!body)
            return '';
        if (typeof body === 'string')
            return body.trim();
        if (typeof body === 'object') {
            const directMessage = `${body?.message ?? body?.error ?? ''}`.trim();
            if (directMessage.length > 0)
                return directMessage;
            const firstEntry = Object.entries(body)[0];
            if (!firstEntry)
                return '';
            return `${firstEntry[0]}${firstEntry[1] ? `: ${firstEntry[1]}` : ''}`.trim();
        }
        return '';
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        await this.authReadyPromise;
        const user = this.auth.currentUser;
        if (!user)
            throw new Error('Sesión no iniciada');

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new Error('Token no disponible');

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }

    private createAuthReadyPromise(): Promise<void> {
        if (this.auth.currentUser)
            return Promise.resolve();

        return new Promise((resolve) => {
            let resolved = false;
            let unsubscribe: (() => void) | null = null;
            const finish = () => {
                if (resolved)
                    return;
                resolved = true;
                unsubscribe?.();
                resolve();
            };

            try {
                unsubscribe = this.firebaseContextSvc.run(() => onAuthStateChanged(
                    this.auth,
                    () => finish(),
                    () => finish()
                ));
                setTimeout(() => finish(), 1500);
            } catch {
                finish();
            }
        });
    }
}
