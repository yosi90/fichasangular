import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Observable, catchError, filter, firstValueFrom, from, map, merge, of, scan, shareReplay, switchMap, timer } from 'rxjs';
import { Campana } from '../interfaces/campaña';
import {
    CampaignCreationPolicy,
    CampaignDetailViewModel,
    CampaignInvitationDecision,
    CampaignInvitationItem,
    CampaignInvitationResponse,
    CampaignInvitationStatus,
    CampaignInvitationUser,
    CampaignListItem,
    CampaignMemberItem,
    CampaignMemberRemovalStatus,
    CampaignMembershipStatus,
    CampaignRoleCode,
    CampaignSubtramaItem,
    CampaignTramaItem,
    CampaignUserSearchResult,
    CreateCampaignInput,
    CreateCampaignSubtramaInput,
    CreateCampaignTramaInput,
    TransferCampaignMasterInput,
    UpdateCampaignInput,
    UpdateCampaignSubtramaInput,
    UpdateCampaignTramaInput,
} from '../interfaces/campaign-management';
import { environment } from 'src/environments/environment';
import { CampaignRealtimeSyncService } from './campaign-realtime-sync.service';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { PrivateUserFirestoreService } from './private-user-firestore.service';

@Injectable({
    providedIn: 'root'
})
export class CampanaService {
    private readonly campanasBaseUrl = `${environment.apiUrl}campanas`;
    private readonly tramasBaseUrl = `${environment.apiUrl}tramas`;
    private readonly subtramasBaseUrl = `${environment.apiUrl}subtramas`;
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;
    private readonly authReadyPromise: Promise<void>;
    private readonly liveCampanas$: Observable<Campana[]>;
    private readonly optimisticCampaignSummaries = new Map<number, CampaignListItem>();

    constructor(
        private auth: Auth,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private privateUserFirestoreSvc?: PrivateUserFirestoreService,
    ) {
        this.authReadyPromise = this.createAuthReadyPromise();
        this.liveCampanas$ = this.privateUserFirestoreSvc
            ? this.createFirestoreLiveCampanasObservable()
            : this.createLegacyLiveCampanasObservable();
    }

    async getListCampanas(): Promise<Observable<Campana[]>> {
        return this.liveCampanas$;
    }

    async listVisibleCampaigns(): Promise<CampaignListItem[]> {
        try {
            return await this.fetchCampaignSummaries();
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las campañas visibles.');
        }
    }

    async listProfileCampaigns(): Promise<CampaignListItem[]> {
        try {
            const headers = await this.buildAuthHeaders();
            const actorUid = `${this.auth.currentUser?.uid ?? ''}`.trim();
            const campaigns = await this.fetchCampaignSummaries();
            return await this.filterCampaignsForProfile(campaigns, headers, actorUid);
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las campañas del perfil.');
        }
    }

    async listSocialCampaigns(): Promise<CampaignListItem[]> {
        try {
            return (await this.fetchCampaignSummaries())
                .filter((campaign) => this.hasActiveMembership(campaign));
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las campañas de Social.');
        }
    }

    async getCampaignDetail(idCampana: number, includeInactive: boolean = false): Promise<CampaignDetailViewModel> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            const headers = await this.buildAuthHeaders();
            const campaignDetail = await this.fetchCampaignDetailHeader(id, headers);

            const [members, pendingInvitations, tramas] = await Promise.all([
                this.fetchCampaignMembers(id, headers, includeInactive),
                this.fetchCampaignInvitationsBestEffort(id, headers),
                Promise.resolve(campaignDetail.tramas),
            ]);

            return {
                campaign: campaignDetail.campaign,
                ownerUid: campaignDetail.ownerUid,
                ownerDisplayName: campaignDetail.ownerDisplayName,
                activeMasterUid: campaignDetail.activeMasterUid,
                activeMasterDisplayName: campaignDetail.activeMasterDisplayName,
                canRecoverMaster: campaignDetail.canRecoverMaster,
                politicaCreacion: campaignDetail.politicaCreacion,
                members,
                pendingInvitations,
                includeInactiveMembers: includeInactive === true,
                tramas,
                loadingInvitations: false,
                loadingMembers: false,
                loadingTramas: false,
            };
        } catch (error) {
            throw this.toError(error, 'No se pudo cargar el detalle de la campaña.');
        }
    }

    async createCampaign(input: string | CreateCampaignInput): Promise<CampaignListItem> {
        const payload = this.normalizeCreateCampaignInput(input);

        try {
            const response = await firstValueFrom(
                this.http.post<any>(
                    this.campanasBaseUrl,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange(this.toPositiveInt(response?.idCampana));

            return {
                id: this.toPositiveInt(response?.idCampana) ?? 0,
                nombre: `${response?.nombre ?? payload.nombre}`.trim() || payload.nombre,
                campaignRole: 'master',
                membershipStatus: 'activo',
            };
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la campaña.');
        }
    }

    async updateCampaign(idCampana: number, input: string | UpdateCampaignInput): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            const normalizedInput = this.normalizeUpdateCampaignInput(input);
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.campanasBaseUrl}/${id}`,
                    normalizedInput,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.rememberCampaignSummaryMutation(id, {
                nombre: `${normalizedInput.nombre ?? ''}`.trim() || undefined,
            });
            this.notifyCampaignListChange(id);
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

    async inviteCampaignMember(idCampana: number, targetUid: string): Promise<CampaignInvitationResponse> {
        const id = this.toPositiveInt(idCampana);
        const uid = `${targetUid ?? ''}`.trim();
        if (!id || uid.length < 1)
            throw new Error('Datos inválidos para invitar al jugador.');

        const payload = { targetUid: uid };

        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<any>(
                    `${this.campanasBaseUrl}/${id}/jugadores`,
                    payload,
                    { headers }
                )
            );
            this.notifyCampaignListChange(id);
            return this.normalizeCampaignInvitationResponse(response);
        } catch (error) {
            throw this.toError(error, 'No se pudo enviar la invitación.');
        }
    }

    async listReceivedCampaignInvitations(): Promise<CampaignInvitationItem[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<any[]>(`${this.campanasBaseUrl}/invitaciones/received`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            const raw = Array.isArray(response) ? response : Object.values(response ?? {});
            return raw
                .map((item) => this.normalizeCampaignInvitation(item))
                .filter((item): item is CampaignInvitationItem => item !== null)
                .sort((a, b) => this.toDateMs(b.createdAtUtc) - this.toDateMs(a.createdAtUtc));
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las invitaciones recibidas.');
        }
    }

    async listCampaignInvitations(idCampana: number): Promise<CampaignInvitationItem[]> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            return await this.fetchCampaignInvitations(id, await this.buildAuthHeaders());
        } catch (error) {
            throw this.toError(error, 'No se pudieron cargar las invitaciones de la campaña.');
        }
    }

    async resolveCampaignInvitation(inviteId: number, decision: CampaignInvitationDecision): Promise<CampaignInvitationResponse> {
        const id = this.toPositiveInt(inviteId);
        if (!id)
            throw new Error('Invitación inválida.');

        try {
            const response = await firstValueFrom(
                this.http.patch<any>(
                    `${this.campanasBaseUrl}/invitaciones/${id}`,
                    { decision },
                    { headers: await this.buildAuthHeaders() }
                )
            );
            if (decision === 'accept')
                this.rememberAcceptedCampaignSummary(response?.invitation);
            this.notifyCampaignListChange(response?.invitation?.campaignId);
            return this.normalizeCampaignInvitationResponse(response);
        } catch (error) {
            throw this.toError(error, 'No se pudo resolver la invitación.');
        }
    }

    async cancelCampaignInvitation(inviteId: number): Promise<void> {
        const id = this.toPositiveInt(inviteId);
        if (!id)
            throw new Error('Invitación inválida.');

        try {
            await firstValueFrom(
                this.http.delete<void>(
                    `${this.campanasBaseUrl}/invitaciones/${id}`,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange();
        } catch (error) {
            throw this.toError(error, 'No se pudo cancelar la invitación.');
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
            this.notifyCampaignListChange(id);
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
            this.rememberCampaignSummaryMutation(id, {
                campaignRole: input.keepPreviousAsPlayer !== false ? 'jugador' : null,
                membershipStatus: input.keepPreviousAsPlayer !== false ? 'activo' : null,
            });
            this.notifyCampaignListChange(id);
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
            this.rememberCampaignSummaryMutation(id, {
                campaignRole: 'master',
                membershipStatus: 'activo',
            });
            this.notifyCampaignListChange(id);
        } catch (error) {
            throw this.toError(error, 'No se pudo recuperar el master de la campaña.');
        }
    }

    watchCampaignSummaries(
        next: (items: CampaignListItem[]) => void,
        onError?: (error: unknown) => void
    ): () => void {
        let active = true;
        const emit = (items: CampaignListItem[]) => {
            if (!active)
                return;
            next(this.mergeOptimisticCampaignSummaries(items));
        };

        if (this.privateUserFirestoreSvc) {
            const watchStop = this.privateUserFirestoreSvc.watchCampaigns(
                (items) => emit(items),
                onError
            );
            const refreshSub = merge(
                this.campaignRealtimeSyncSvc.listInvalidations$,
                timer(30000, 30000),
            ).subscribe(() => {
                void this.refreshCampaignSummariesWatcher(emit, onError);
            });

            return () => {
                active = false;
                watchStop();
                refreshSub.unsubscribe();
            };
        }

        const refreshSub = merge(
            of(null),
            this.campaignRealtimeSyncSvc.listInvalidations$,
            timer(30000, 30000),
        ).subscribe(() => {
            void this.refreshCampaignSummariesWatcher(emit, onError);
        });

        return () => {
            active = false;
            refreshSub.unsubscribe();
        };
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

    async createTrama(idCampana: number, input: string | CreateCampaignTramaInput): Promise<void> {
        const id = this.toPositiveInt(idCampana);
        if (!id)
            throw new Error('Campaña inválida.');

        try {
            await firstValueFrom(
                this.http.post<void>(
                    `${this.tramasBaseUrl}/campana/${id}`,
                    this.normalizeCreateTramaInput(input),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange(id);
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la trama.');
        }
    }

    async updateTrama(idTrama: number, input: string | UpdateCampaignTramaInput): Promise<void> {
        const id = this.toPositiveInt(idTrama);
        if (!id)
            throw new Error('Trama inválida.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.tramasBaseUrl}/${id}`,
                    this.normalizeUpdateTramaInput(input),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange();
        } catch (error) {
            throw this.toError(error, 'No se pudo actualizar la trama.');
        }
    }

    async createSubtrama(idTrama: number, input: string | CreateCampaignSubtramaInput): Promise<void> {
        const id = this.toPositiveInt(idTrama);
        if (!id)
            throw new Error('Trama inválida.');

        try {
            await firstValueFrom(
                this.http.post<void>(
                    `${this.subtramasBaseUrl}/trama/${id}`,
                    this.normalizeCreateSubtramaInput(input),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange();
        } catch (error) {
            throw this.toError(error, 'No se pudo crear la subtrama.');
        }
    }

    async updateSubtrama(idSubtrama: number, input: string | UpdateCampaignSubtramaInput): Promise<void> {
        const id = this.toPositiveInt(idSubtrama);
        if (!id)
            throw new Error('Subtrama inválida.');

        try {
            await firstValueFrom(
                this.http.patch<void>(
                    `${this.subtramasBaseUrl}/${id}`,
                    this.normalizeUpdateSubtramaInput(input),
                    { headers: await this.buildAuthHeaders() }
                )
            );
            this.notifyCampaignListChange();
        } catch (error) {
            throw this.toError(error, 'No se pudo actualizar la subtrama.');
        }
    }

    private notifyCampaignListChange(campaignId?: number | null): void {
        this.campaignRealtimeSyncSvc.notifyLocalChange(campaignId);
    }

    private async fetchLiveCampanasWithActiveMembership(): Promise<Campana[]> {
        return this.fetchCampanasWithActiveMembership(await this.buildAuthHeaders());
    }

    private createFirestoreLiveCampanasObservable(): Observable<Campana[]> {
        return new Observable<Campana[]>((subscriber) => {
            let active = true;
            let current = [this.buildSinCampanaOption()];
            let latestSummaries: CampaignListItem[] = [];

            const emitCurrent = () => {
                if (active)
                    subscriber.next(current);
            };
            const rebuildTree = async (forceReloadSummaries: boolean = false) => {
                try {
                    if (forceReloadSummaries || latestSummaries.length < 1)
                        latestSummaries = await this.fetchCampaignSummaries();

                    const headers = await this.buildAuthHeaders();
                    current = await this.buildCampanasTree(
                        latestSummaries.filter((campana) => this.hasActiveMembership(campana)),
                        headers
                    );
                } catch {
                    // Conservamos la última emisión válida si falla una reconstrucción.
                }
                emitCurrent();
            };

            const watchStop = this.privateUserFirestoreSvc!.watchCampaigns(
                (summaries) => {
                    latestSummaries = summaries;
                    void rebuildTree(false);
                },
                () => emitCurrent()
            );
            const refreshSub = merge(
                this.campaignRealtimeSyncSvc.listInvalidations$,
                timer(30000, 30000),
            ).subscribe(() => {
                void rebuildTree(true);
            });

            emitCurrent();
            return () => {
                active = false;
                watchStop();
                refreshSub.unsubscribe();
            };
        }).pipe(
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    private createLegacyLiveCampanasObservable(): Observable<Campana[]> {
        return merge(
            of(null),
            this.campaignRealtimeSyncSvc.listInvalidations$,
            timer(30000, 30000),
        ).pipe(
            switchMap(() => from(this.fetchLiveCampanasWithActiveMembership()).pipe(
                map((campanas) => ({ ok: true as const, campanas })),
                catchError(() => of({
                    ok: false as const,
                    campanas: [] as Campana[],
                })),
            )),
            scan(
                (current: Campana[] | null, result: { ok: boolean; campanas: Campana[]; }) => result.ok
                    ? result.campanas
                    : (current ?? [this.buildSinCampanaOption()]),
                null as Campana[] | null
            ),
            filter((campanas): campanas is Campana[] => Array.isArray(campanas)),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    private async fetchCampanasWithActiveMembership(headers: HttpHeaders): Promise<Campana[]> {
        const campanas = await this.fetchCampaignSummaries();
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
                    const detail = await this.fetchCampaignDetailHeader(campana.id, headers, false);
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
            campanas.map(async (campana) => {
                const detail = await this.fetchCampaignDetailHeader(campana.id, headers);
                return {
                    Id: campana.id,
                    Nombre: campana.nombre,
                    CampaignRole: campana.campaignRole ?? null,
                    Tramas: detail.tramas.map((trama) => ({
                        Id: trama.id,
                        Nombre: trama.nombre,
                        VisibleParaJugadores: trama.visibleParaJugadores,
                        Subtramas: trama.subtramas.map((subtrama) => ({
                            Id: subtrama.id,
                            Nombre: subtrama.nombre,
                            VisibleParaJugadores: subtrama.visibleParaJugadores,
                        })),
                    })),
                };
            })
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

    private async fetchCampaignSummaries(): Promise<CampaignListItem[]> {
        if (this.privateUserFirestoreSvc)
            return this.mergeOptimisticCampaignSummaries(await this.privateUserFirestoreSvc.listCampaigns());

        const headers = await this.buildAuthHeaders();
        const response = await firstValueFrom(
            this.http.get<any[]>(this.campanasBaseUrl, { headers })
        );
        const raw = Array.isArray(response) ? response : Object.values(response ?? {});
        const items = raw
            .map((item) => this.normalizeCampaignSummary(item))
            .filter((item): item is CampaignListItem => item !== null)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        return this.mergeOptimisticCampaignSummaries(items);
    }

    private async fetchCampaignDetailHeader(
        idCampana: number,
        headers: HttpHeaders,
        includeTramasFallback: boolean = true
    ): Promise<Pick<CampaignDetailViewModel, 'campaign' | 'ownerUid' | 'ownerDisplayName' | 'activeMasterUid' | 'activeMasterDisplayName' | 'canRecoverMaster' | 'politicaCreacion' | 'tramas'>> {
        const response = await firstValueFrom(
            this.http.get<any>(`${this.campanasBaseUrl}/${idCampana}`, { headers })
        );
        const campaign = this.normalizeCampaignSummary(response);
        if (!campaign)
            throw new Error('La campaña solicitada ya no está disponible para tu usuario.');

        const hasEmbeddedTramas = response?.tramas !== null && response?.tramas !== undefined;
        const tramas = hasEmbeddedTramas
            ? this.normalizeCampaignDetailTramas(response?.tramas)
            : includeTramasFallback
                ? await this.fetchCampaignTramas(idCampana, headers)
                : [];

        return {
            campaign,
            ownerUid: this.toNullableText(response?.ownerUid),
            ownerDisplayName: this.toNullableText(response?.ownerDisplayName),
            activeMasterUid: this.toNullableText(response?.activeMasterUid),
            activeMasterDisplayName: this.toNullableText(response?.activeMasterDisplayName),
            canRecoverMaster: response?.canRecoverMaster === true,
            politicaCreacion: this.normalizeCampaignCreationPolicy(response?.politicaCreacion),
            tramas,
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

    private async fetchCampaignInvitations(
        idCampana: number,
        headers: HttpHeaders
    ): Promise<CampaignInvitationItem[]> {
        const response = await firstValueFrom(
            this.http.get<any[]>(`${this.campanasBaseUrl}/${idCampana}/invitaciones`, { headers })
        );
        const raw = Array.isArray(response) ? response : Object.values(response ?? {});
        return raw
            .map((item) => this.normalizeCampaignInvitation(item))
            .filter((item): item is CampaignInvitationItem => item !== null)
            .sort((a, b) => this.toDateMs(b.createdAtUtc) - this.toDateMs(a.createdAtUtc));
    }

    private async fetchCampaignInvitationsBestEffort(
        idCampana: number,
        headers: HttpHeaders
    ): Promise<CampaignInvitationItem[]> {
        try {
            return await this.fetchCampaignInvitations(idCampana, headers);
        } catch {
            return [];
        }
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
        const id = this.toPositiveInt(raw?.i ?? raw?.Id ?? raw?.id ?? raw?.idTrama ?? raw?.IdTrama);
        if (!id)
            return null;

        return {
            id,
            nombre: `${raw?.n ?? raw?.Nombre ?? raw?.nombre ?? ''}`.trim(),
            visibleParaJugadores: this.toBoolean(
                raw?.visibleParaJugadores ?? raw?.VisibleParaJugadores,
                true
            ),
            subtramas: [],
        };
    }

    private normalizeCampaignSubtrama(raw: any): CampaignSubtramaItem | null {
        const id = this.toPositiveInt(raw?.i ?? raw?.Id ?? raw?.id ?? raw?.idSubtrama ?? raw?.IdSubtrama);
        if (!id)
            return null;

        return {
            id,
            nombre: `${raw?.n ?? raw?.Nombre ?? raw?.nombre ?? ''}`.trim(),
            visibleParaJugadores: this.toBoolean(
                raw?.visibleParaJugadores ?? raw?.VisibleParaJugadores,
                true
            ),
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

    private normalizeCampaignInvitationUser(raw: any): CampaignInvitationUser | null {
        const uid = `${raw?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return null;

        return {
            userId: this.toNullableText(raw?.userId),
            uid,
            displayName: this.toNullableText(raw?.displayName),
            email: this.toNullableText(raw?.email),
        };
    }

    private normalizeCampaignInvitation(raw: any): CampaignInvitationItem | null {
        const inviteId = this.toPositiveInt(raw?.inviteId);
        const campaignId = this.toPositiveInt(raw?.campaignId);
        const invitedUser = this.normalizeCampaignInvitationUser(raw?.invitedUser);
        const invitedBy = this.normalizeCampaignInvitationUser(raw?.invitedBy);
        if (!inviteId || !campaignId || !invitedUser || !invitedBy)
            return null;

        return {
            inviteId,
            status: this.normalizeInvitationStatus(raw?.status),
            createdAtUtc: this.toNullableText(raw?.createdAtUtc),
            resolvedAtUtc: this.toNullableText(raw?.resolvedAtUtc),
            campaignId,
            campaignName: this.toNullableText(raw?.campaignName),
            invitedUser,
            invitedBy,
            resolvedByUserId: this.toNullableText(raw?.resolvedByUserId),
        };
    }

    private normalizeCampaignInvitationResponse(raw: any): CampaignInvitationResponse {
        const invitation = this.normalizeCampaignInvitation(raw?.invitation);
        if (!invitation)
            throw new Error('La invitación devuelta por la API no es válida.');

        return {
            message: `${raw?.message ?? ''}`.trim() || 'Invitación procesada correctamente.',
            invitation,
        };
    }

    private rememberAcceptedCampaignSummary(rawInvitation: any): void {
        const campaignId = this.toPositiveInt(rawInvitation?.campaignId);
        if (!campaignId)
            return;

        const campaignName = `${rawInvitation?.campaignName ?? ''}`.trim();
        this.optimisticCampaignSummaries.set(campaignId, {
            id: campaignId,
            nombre: campaignName.length > 0 ? campaignName : `Campaña ${campaignId}`,
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        });
    }

    private rememberCampaignSummaryMutation(
        campaignId: number,
        partial: Partial<Pick<CampaignListItem, 'nombre' | 'campaignRole' | 'membershipStatus' | 'isOwner'>>
    ): void {
        const id = this.toPositiveInt(campaignId);
        if (!id)
            return;

        const current = this.optimisticCampaignSummaries.get(id) ?? {
            id,
            nombre: `Campaña ${id}`,
            campaignRole: 'master' as CampaignRoleCode | null,
            membershipStatus: 'activo' as CampaignMembershipStatus | null,
        };

        const next: CampaignListItem = {
            ...current,
            ...(partial.nombre !== undefined ? { nombre: partial.nombre } : {}),
            ...(partial.campaignRole !== undefined ? { campaignRole: partial.campaignRole } : {}),
            ...(partial.membershipStatus !== undefined ? { membershipStatus: partial.membershipStatus } : {}),
            ...((partial.isOwner === true || current.isOwner === true) ? { isOwner: true } : {}),
        };

        this.optimisticCampaignSummaries.set(id, next);
    }

    private async refreshCampaignSummariesWatcher(
        emit: (items: CampaignListItem[]) => void,
        onError?: (error: unknown) => void
    ): Promise<void> {
        try {
            emit(await this.fetchCampaignSummaries());
        } catch (error) {
            onError?.(error);
        }
    }

    private mergeOptimisticCampaignSummaries(items: CampaignListItem[]): CampaignListItem[] {
        const current = Array.isArray(items) ? [...items] : [];
        if (this.optimisticCampaignSummaries.size < 1)
            return current;

        const seenIds = new Set<number>();
        const merged = current.map((item) => {
            seenIds.add(item.id);
            const optimistic = this.optimisticCampaignSummaries.get(item.id);
            if (!optimistic)
                return item;
            return {
                ...item,
                ...optimistic,
                ...((item.isOwner === true || optimistic.isOwner === true) ? { isOwner: true } : {}),
            };
        });

        for (const [campaignId, item] of this.optimisticCampaignSummaries.entries()) {
            if (seenIds.has(campaignId))
                continue;
            merged.push({ ...item });
        }

        return merged.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private buildSinCampanaOption(): Campana {
        return {
            Id: 0,
            Nombre: 'Sin campaña',
            Tramas: [],
        };
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

    private normalizeInvitationStatus(value: any): CampaignInvitationStatus {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'accepted')
            return 'accepted';
        if (normalized === 'rejected')
            return 'rejected';
        if (normalized === 'canceled')
            return 'canceled';
        return 'pending';
    }

    private normalizeCampaignCreationPolicy(raw: any): CampaignCreationPolicy {
        return {
            tiradaMinimaCaracteristica: this.toNullableNumber(raw?.tiradaMinimaCaracteristica),
            maxTablasDadosCaracteristicas: this.toNullableNumber(raw?.maxTablasDadosCaracteristicas),
            permitirHomebrewGeneral: this.toBoolean(raw?.permitirHomebrewGeneral, true),
            permitirVentajasDesventajas: this.toBoolean(raw?.permitirVentajasDesventajas, true),
            permitirIgnorarRestriccionesAlineamiento: this.toBoolean(raw?.permitirIgnorarRestriccionesAlineamiento, false),
            maxFuentesHomebrewGeneralesPorPersonaje: this.toNullableNumber(raw?.maxFuentesHomebrewGeneralesPorPersonaje),
        };
    }

    private normalizeCreateCampaignInput(input: string | CreateCampaignInput): CreateCampaignInput {
        if (typeof input === 'string')
            return { nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de campaña.') };

        return {
            nombre: this.normalizeRequiredName(input?.nombre ?? '', 'Debes indicar un nombre de campaña.'),
            politicaCreacion: this.serializeCampaignCreationPolicy(input?.politicaCreacion ?? null),
        };
    }

    private normalizeUpdateCampaignInput(input: string | UpdateCampaignInput): UpdateCampaignInput {
        if (typeof input === 'string')
            return { nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de campaña.') };

        const payload: UpdateCampaignInput = {};
        if (typeof input?.nombre === 'string')
            payload.nombre = this.normalizeRequiredName(input.nombre, 'Debes indicar un nombre de campaña.');

        if (input?.politicaCreacion !== undefined)
            payload.politicaCreacion = this.serializeCampaignCreationPolicy(input?.politicaCreacion ?? null);

        if (!payload.nombre && payload.politicaCreacion === undefined)
            throw new Error('Debes indicar al menos un cambio de campaña.');

        return payload;
    }

    private normalizeCreateTramaInput(input: string | CreateCampaignTramaInput): CreateCampaignTramaInput {
        if (typeof input === 'string') {
            return {
                nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de trama.'),
                visibleParaJugadores: true,
            };
        }

        return {
            nombre: this.normalizeRequiredName(input?.nombre ?? '', 'Debes indicar un nombre de trama.'),
            visibleParaJugadores: input?.visibleParaJugadores !== false,
        };
    }

    private normalizeUpdateTramaInput(input: string | UpdateCampaignTramaInput): UpdateCampaignTramaInput {
        if (typeof input === 'string')
            return { nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de trama.') };

        const payload: UpdateCampaignTramaInput = {};
        if (typeof input?.nombre === 'string')
            payload.nombre = this.normalizeRequiredName(input.nombre, 'Debes indicar un nombre de trama.');
        if (typeof input?.visibleParaJugadores === 'boolean')
            payload.visibleParaJugadores = input.visibleParaJugadores;
        if (!payload.nombre && payload.visibleParaJugadores === undefined)
            throw new Error('Debes indicar al menos un cambio de trama.');
        return payload;
    }

    private normalizeCreateSubtramaInput(input: string | CreateCampaignSubtramaInput): CreateCampaignSubtramaInput {
        if (typeof input === 'string') {
            return {
                nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de subtrama.'),
                visibleParaJugadores: true,
            };
        }

        return {
            nombre: this.normalizeRequiredName(input?.nombre ?? '', 'Debes indicar un nombre de subtrama.'),
            visibleParaJugadores: input?.visibleParaJugadores !== false,
        };
    }

    private normalizeUpdateSubtramaInput(input: string | UpdateCampaignSubtramaInput): UpdateCampaignSubtramaInput {
        if (typeof input === 'string')
            return { nombre: this.normalizeRequiredName(input, 'Debes indicar un nombre de subtrama.') };

        const payload: UpdateCampaignSubtramaInput = {};
        if (typeof input?.nombre === 'string')
            payload.nombre = this.normalizeRequiredName(input.nombre, 'Debes indicar un nombre de subtrama.');
        if (typeof input?.visibleParaJugadores === 'boolean')
            payload.visibleParaJugadores = input.visibleParaJugadores;
        if (!payload.nombre && payload.visibleParaJugadores === undefined)
            throw new Error('Debes indicar al menos un cambio de subtrama.');
        return payload;
    }

    private serializeCampaignCreationPolicy(raw: Partial<CampaignCreationPolicy> | null | undefined): Partial<CampaignCreationPolicy> | null | undefined {
        if (raw === undefined)
            return undefined;
        if (raw === null)
            return null;

        const payload: Partial<CampaignCreationPolicy> = {};

        if ('tiradaMinimaCaracteristica' in raw)
            payload.tiradaMinimaCaracteristica = this.toNullableNumber(raw.tiradaMinimaCaracteristica);
        if ('maxTablasDadosCaracteristicas' in raw)
            payload.maxTablasDadosCaracteristicas = this.toNullableNumber(raw.maxTablasDadosCaracteristicas);
        if ('permitirHomebrewGeneral' in raw)
            payload.permitirHomebrewGeneral = this.toBoolean(raw.permitirHomebrewGeneral, true);
        if ('permitirVentajasDesventajas' in raw)
            payload.permitirVentajasDesventajas = this.toBoolean(raw.permitirVentajasDesventajas, true);
        if ('permitirIgnorarRestriccionesAlineamiento' in raw)
            payload.permitirIgnorarRestriccionesAlineamiento = this.toBoolean(raw.permitirIgnorarRestriccionesAlineamiento, false);
        if ('maxFuentesHomebrewGeneralesPorPersonaje' in raw)
            payload.maxFuentesHomebrewGeneralesPorPersonaje = this.toNullableNumber(raw.maxFuentesHomebrewGeneralesPorPersonaje);

        return payload;
    }

    private normalizeCampaignDetailTramas(raw: any): CampaignTramaItem[] {
        const items = Array.isArray(raw) ? raw : Object.values(raw ?? {});
        return items
            .map((item) => {
                const trama = this.normalizeCampaignTrama(item);
                if (!trama)
                    return null;

                const rawSubtramas = item?.subtramas ?? item?.Subtramas;
                const subtramasRaw = Array.isArray(rawSubtramas) ? rawSubtramas : Object.values(rawSubtramas ?? {});
                return {
                    ...trama,
                    subtramas: subtramasRaw
                        .map((subtrama: any) => this.normalizeCampaignSubtrama(subtrama))
                        .filter((subtrama: CampaignSubtramaItem | null): subtrama is CampaignSubtramaItem => subtrama !== null)
                        .sort((a: CampaignSubtramaItem, b: CampaignSubtramaItem) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })),
                };
            })
            .filter((item): item is CampaignTramaItem => item !== null)
            .sort((a: CampaignTramaItem, b: CampaignTramaItem) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
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

    private toNullableNumber(value: any): number | null {
        if (value === null || value === undefined || `${value}`.trim() === '')
            return null;
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) ? parsed : null;
    }

    private toNullableText(value: any): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private toBoolean(value: any, fallback: boolean): boolean {
        if (typeof value === 'boolean')
            return value;
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return fallback;
    }

    private toDateMs(value: string | null | undefined): number {
        const parsed = new Date(`${value ?? ''}`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
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
