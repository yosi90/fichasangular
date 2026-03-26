import { Injectable } from '@angular/core';
import { PersonajeSimple } from '../../interfaces/simplificaciones/personaje-simple';
import { Database, onValue, ref, set } from '@angular/fire/database';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { RazaSimple } from 'src/app/interfaces/simplificaciones/raza-simple';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from '../firebase-injection-context.service';
import { PrivateUserFirestoreService } from '../private-user-firestore.service';

@Injectable({
    providedIn: 'root'
})
export class ListaPersonajesService {
    private readonly authReadyPromise: Promise<void>;
    private readonly personajesSubject = new BehaviorSubject<PersonajeSimple[]>([]);
    private personajesLoaded = false;
    private personajesLoadingPromise: Promise<void> | null = null;
    private actorCacheKey = '';
    private loadGeneration = 0;
    private privateCharactersUnsubscribe: (() => void) | null = null;

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private privateUserFirestoreSvc?: PrivateUserFirestoreService
    ) {
        this.authReadyPromise = this.createAuthReadyPromise();
        this.actorCacheKey = this.buildActorCacheKey(this.auth.currentUser);
        this.subscribeAuthState((user) => {
            const nextActorCacheKey = this.buildActorCacheKey(user);
            if (nextActorCacheKey === this.actorCacheKey)
                return;

            this.actorCacheKey = nextActorCacheKey;
            this.invalidateLoadedPersonajes();
            this.stopPrivateCharactersSubscription();
            this.personajesLoadingPromise = this.reloadPersonajesForCurrentActor();
        });
    }

    async getPersonajes(): Promise<Observable<PersonajeSimple[]>> {
        await this.ensurePersonajesLoaded();
        return this.personajesSubject.asObservable();
    }

    public ceateDataTable() {
        let columns: ({ title: string; columnDef: string; header: string; cell: (pj: PersonajeSimple) => string; } | { title: string; columnDef: string; header: string; cell: (pj: PersonajeSimple) => boolean; })[] = [];
        columns = [
            {
                title: 'Nombre del personaje',
                columnDef: 'expand',
                header: 'Nombre',
                cell: (pj: PersonajeSimple) => `${pj.Nombre}`,
            },
            {
                title: 'Clases y nivel',
                columnDef: 'expand',
                header: 'Clases',
                cell: (pj: PersonajeSimple) => `${pj.Clases}`,
            },
            {
                title: 'Raza del personaje',
                columnDef: 'expand',
                header: 'Raza',
                cell: (pj: PersonajeSimple) => `${pj.Raza.Nombre}`,
            },
            {
                title: 'Estado de la ficha',
                columnDef: 'expand',
                header: '¿Archivado?',
                cell: (pj: PersonajeSimple) => pj.Archivado,
            },
            {
                title: 'Personalidad del personaje',
                columnDef: 'expandedDetail',
                header: 'Personalidad',
                cell: (pj: PersonajeSimple) => `${pj.Personalidad}`,
            },
            {
                title: 'Contexto del personaje',
                columnDef: 'expandedDetail',
                header: 'Contexto',
                cell: (pj: PersonajeSimple) => `${pj.Contexto}`,
            },
            {
                title: 'Campaña en la que aparece',
                columnDef: 'expandedDetail',
                header: 'Campaña',
                cell: (pj: PersonajeSimple) => `${pj.Campana}`,
            },
            {
                title: 'Trama de la campaña',
                columnDef: 'expandedDetail',
                header: 'Trama',
                cell: (pj: PersonajeSimple) => `${pj.Trama}`,
            },
            {
                title: 'Subtrama de la trama',
                columnDef: 'expandedDetail',
                header: 'Subtrama',
                cell: (pj: PersonajeSimple) => `${pj.Subtrama}`,
            },
        ];
        return columns;
    }

    pjs(headers?: HttpHeaders): Observable<any> {
        const personajes = this.http.get(`${environment.apiUrl}personajes`, headers ? { headers } : undefined);
        return personajes;
    }

    public async RenovarPersonajesSimples(): Promise<boolean> {
        try {
            const personajes = this.privateUserFirestoreSvc
                ? await this.privateUserFirestoreSvc.listCharacters()
                : await this.fetchPersonajesFromApi();
            this.personajesLoaded = true;
            this.personajesSubject.next([...personajes]);

            await Promise.all(
                personajes.map((personaje) => {
                    return this.firebaseContextSvc.run(() => {
                        return set(ref(this.db, `Personajes-simples/${personaje.Id}`), {
                            Nombre: personaje.Nombre,
                            ownerUid: personaje.ownerUid,
                            ownerDisplayName: personaje.ownerDisplayName,
                            visible_otros_usuarios: personaje.visible_otros_usuarios,
                            Id_region: personaje.Id_region,
                            Region: {
                                Id: personaje.Region?.Id ?? 0,
                                Nombre: personaje.Region?.Nombre ?? '',
                            },
                            Raza: personaje.Raza as RazaSimple,
                            Clases: personaje.Clases,
                            Contexto: personaje.Contexto,
                            Personalidad: personaje.Personalidad,
                            Campaña: personaje.Campana,
                            Trama: personaje.Trama,
                            Subtrama: personaje.Subtrama,
                            Archivado: personaje.Archivado,
                        });
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de personajes simple actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de personajes simple',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }

    public actualizarVisibilidadEnCache(idPersonaje: number, visible: boolean): void {
        const id = Math.trunc(toNumber(idPersonaje));
        if (id <= 0 || !this.personajesLoaded)
            return;

        this.personajesSubject.next(
            this.personajesSubject.value.map((personaje) => {
                if (Math.trunc(toNumber(personaje?.Id)) !== id)
                    return personaje;

                return {
                    ...personaje,
                    visible_otros_usuarios: !!visible,
                };
            })
        );
    }

    public actualizarArchivadoEnCache(idPersonaje: number, archivado: boolean): void {
        const id = Math.trunc(toNumber(idPersonaje));
        if (id <= 0 || !this.personajesLoaded)
            return;

        this.personajesSubject.next(
            this.personajesSubject.value.map((personaje) => {
                if (Math.trunc(toNumber(personaje?.Id)) !== id)
                    return personaje;

                return {
                    ...personaje,
                    Archivado: !!archivado,
                };
            })
        );
    }

    private mapApiToPersonajeSimple(element: any): PersonajeSimple {
        const idRegion = Math.max(0, Math.trunc(toNumber(
            element?.id_region
            ?? element?.idRegion
            ?? element?.Region?.Id
            ?? element?.Region?.id
            ?? element?.region?.Id
            ?? element?.region?.id
        )));
        const nombreRegion = `${element?.Region?.Nombre
            ?? element?.Region?.nombre
            ?? element?.region?.Nombre
            ?? element?.region?.nombre
            ?? ''}`.trim();
        const raza = (element?.r
            ?? element?.ra
            ?? element?.Raza
            ?? element?.raza
            ?? { Id: 0, Nombre: 'Sin raza' }) as RazaSimple;
        const clases = `${element?.c
            ?? element?.cla
            ?? element?.Clases
            ?? ''}`.trim();
        const contexto = `${element?.co
            ?? element?.dh
            ?? element?.Contexto
            ?? ''}`.trim();
        const personalidad = `${element?.p
            ?? element?.dcp
            ?? element?.Personalidad
            ?? ''}`.trim();

        return {
            Id: Math.trunc(toNumber(element?.i ?? element?.Id)),
            Nombre: `${element?.n ?? element?.Nombre ?? ''}`.trim(),
            ownerUid: extractOwnerUid(element),
            ownerDisplayName: extractOwnerDisplayName(element),
            visible_otros_usuarios: toBoolean(element?.visible_otros_usuarios),
            Id_region: idRegion,
            Region: {
                Id: idRegion,
                Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
            },
            Raza: raza,
            Clases: clases,
            Contexto: contexto,
            Personalidad: personalidad,
            Campana: `${element?.ca ?? element?.ncam ?? element?.Campaña ?? element?.Campana ?? 'Sin campaña'}`.trim() || 'Sin campaña',
            Trama: `${element?.t ?? element?.ntr ?? element?.Trama ?? 'Trama base'}`.trim() || 'Trama base',
            Subtrama: `${element?.s ?? element?.nst ?? element?.Subtrama ?? 'Subtrama base'}`.trim() || 'Subtrama base',
            Archivado: toBoolean(element?.a ?? element?.archivado ?? element?.Archivado),
        };
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

    protected subscribeAuthState(handler: (firebaseUser: any) => void): () => void {
        try {
            return this.firebaseContextSvc.run(() => onAuthStateChanged(this.auth, handler));
        } catch {
            return () => undefined;
        }
    }

    private async ensurePersonajesLoaded(): Promise<void> {
        if (this.personajesLoaded)
            return;

        if (!this.personajesLoadingPromise)
            this.personajesLoadingPromise = this.reloadPersonajesForCurrentActor();

        await this.personajesLoadingPromise;
    }

    private invalidateLoadedPersonajes(): void {
        this.loadGeneration += 1;
        this.personajesLoaded = false;
        this.personajesLoadingPromise = null;
    }

    private async reloadPersonajesForCurrentActor(): Promise<void> {
        const requestGeneration = ++this.loadGeneration;
        try {
            const personajes = await this.fetchPersonajesForCurrentActor();
            if (requestGeneration !== this.loadGeneration)
                return;

            this.personajesLoaded = true;
            this.personajesSubject.next([...personajes]);
            if (requestGeneration === this.loadGeneration && this.privateUserFirestoreSvc && this.auth.currentUser)
                this.startPrivateCharactersSubscription();
        } catch {
            if (requestGeneration !== this.loadGeneration)
                return;

            this.personajesLoaded = true;
            this.personajesSubject.next([]);
        } finally {
            if (requestGeneration === this.loadGeneration)
                this.personajesLoadingPromise = null;
        }
    }

    private async fetchPersonajesForCurrentActor(): Promise<PersonajeSimple[]> {
        await this.authReadyPromise;
        if (!this.auth.currentUser)
            return this.readPublicPersonajesFromCache();

        if (this.privateUserFirestoreSvc)
            return this.privateUserFirestoreSvc.listCharacters();

        return this.fetchPersonajesFromApi();
    }

    private startPrivateCharactersSubscription(): void {
        if (!this.privateUserFirestoreSvc || !this.auth.currentUser)
            return;

        this.stopPrivateCharactersSubscription();
        this.privateCharactersUnsubscribe = this.privateUserFirestoreSvc.watchCharacters(
            (personajes) => {
                this.personajesLoaded = true;
                this.personajesSubject.next([...personajes]);
            },
            () => {
                this.personajesLoaded = true;
                this.personajesSubject.next([]);
            }
        );
    }

    private stopPrivateCharactersSubscription(): void {
        if (!this.privateCharactersUnsubscribe)
            return;

        this.privateCharactersUnsubscribe();
        this.privateCharactersUnsubscribe = null;
    }

    private async fetchPersonajesFromApi(): Promise<PersonajeSimple[]> {
        const headers = await this.buildAuthHeaders();
        const response = await firstValueFrom(this.pjs(headers));
        return (Array.isArray(response) ? response : Object.values(response ?? {}))
            .map((element: any) => this.mapApiToPersonajeSimple(element));
    }

    private async readPublicPersonajesFromCache(): Promise<PersonajeSimple[]> {
        const payload = await this.readCacheSnapshot('listado-personajes');
        if (Array.isArray(payload)) {
            return payload
                .map((element: any, index: number) => {
                    if (!element)
                        return null;
                    const fallbackId = toNumber(element?.Id) > 0
                        ? element.Id
                        : (toNumber(element?.i) > 0 ? element.i : index);
                    return this.mapApiToPersonajeSimple({
                        ...(element as Record<string, any>),
                        Id: fallbackId,
                    });
                })
                .filter((personaje): personaje is PersonajeSimple => !!personaje)
                .filter((personaje) => this.esVisibleParaInvitado(personaje));
        }

        return Object.entries(payload ?? {})
            .map(([id, element]) => this.mapApiToPersonajeSimple({
                ...(element as Record<string, any>),
                Id: toNumber((element as any)?.Id) > 0 ? (element as any).Id : id,
            }))
            .filter((personaje) => this.esVisibleParaInvitado(personaje));
    }

    private async readCacheSnapshot(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.firebaseContextSvc.run(() => onValue(
                    ref(this.db, path),
                    (snapshot) => resolve(snapshot.val()),
                    reject,
                    { onlyOnce: true }
                ));
            } catch (error) {
                reject(error);
            }
        });
    }

    private esVisibleParaInvitado(personaje: PersonajeSimple): boolean {
        return personaje?.visible_otros_usuarios === true
            && personaje?.Archivado !== true
            && this.normalizarCampana(personaje?.Campana) === 'sin campana';
    }

    private normalizarCampana(value: any): string {
        return `${value ?? 'Sin campaña'}`
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    private buildActorCacheKey(user: any): string {
        const uid = `${user?.uid ?? ''}`.trim();
        return uid.length > 0 ? `user:${uid}` : 'guest';
    }
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string') {
        const normalizado = value.trim().toLowerCase();
        return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
    }
    return false;
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function extractOwnerUid(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    const text = `${value.ownerUid ?? ''}`.trim();
    return text.length > 0 ? text : null;
}

function extractOwnerDisplayName(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    const text = `${value.ownerDisplayName ?? ''}`.trim();
    return text.length > 0 ? text : null;
}
