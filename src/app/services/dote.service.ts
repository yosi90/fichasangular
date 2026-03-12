import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import { Dote } from "../interfaces/dote";
import { DoteCreateApiResponse, DoteCreateRequest, DoteCreateResponse } from "../interfaces/dotes-api";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeDoteApi, normalizeDoteLegacy } from "./utils/dote-mapper";

@Injectable({
    providedIn: "root"
})
export class DoteService {

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    protected watchDotePath(id: number, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        const dbRef = ref(this.db, `Dotes/${id}`);
        return this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
    }

    protected watchDotesPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        const dbRef = ref(this.db, "Dotes");
        return this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
    }

    getDote(id: number): Observable<Dote> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeDoteLegacy(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}dotes/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeDoteApi(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Dote no encontrada",
                                text: `No existe la dote con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la dote",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.watchDotePath(id, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getDotes(): Observable<Dote[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (!snapshot.exists()) {
                    this.syncDotes().subscribe({
                        next: (raw: any) => {
                            const dotes = (Array.isArray(raw) ? raw : Object.values(raw ?? {}))
                                .map((item: any) => normalizeDoteApi(item))
                                .filter((dote) => dote.Id > 0);
                            observador.next(dotes);
                        },
                        error: (error: HttpErrorResponse) => {
                            if (error.status === 404) {
                                Swal.fire({
                                    icon: "warning",
                                    title: "Listado de dotes no disponible",
                                    text: "No se encontró /dotes en la API",
                                    showConfirmButton: true,
                                });
                            } else {
                                Swal.fire({
                                    icon: "warning",
                                    title: "Error al obtener el listado de dotes",
                                    text: error.message,
                                    showConfirmButton: true,
                                });
                            }
                            observador.error(error);
                        }
                    });
                    return;
                }

                const dotes: Dote[] = [];
                snapshot.forEach((obj: any) => {
                    dotes.push(normalizeDoteLegacy(obj.val()));
                });
                observador.next(dotes);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.watchDotesPath(onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncDotes(): Observable<any> {
        return this.http.get(`${environment.apiUrl}dotes`);
    }

    public async crearDote(payload: DoteCreateRequest): Promise<DoteCreateResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<DoteCreateApiResponse>(`${environment.apiUrl}dotes/add`, payload, { headers })
            );
            const idDote = Math.trunc(Number(response?.idDote ?? 0));
            if (!Number.isFinite(idDote) || idDote <= 0)
                throw new Error("La API no devolvio un idDote valido");

            const normalizedResponse: DoteCreateResponse = {
                message: `${response?.message ?? "Dote creada"}`,
                idDote,
            };

            await this.refrescarDoteCacheBestEffort(idDote);
            return normalizedResponse;
        } catch (error: any) {
            throw this.mapCrearDoteError(error);
        }
    }

    public async RenovarDotes(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncDotes());
            const dotes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                dotes.map((raw: any) => {
                    const dote = normalizeDoteApi(raw);
                    return this.firebaseContextSvc.run(() => set(ref(this.db, `Dotes/${dote.Id}`), dote));
                })
            );

            Swal.fire({
                icon: "success",
                title: "Listado de dotes actualizado con éxito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de dotes no disponible",
                    text: "No se encontró /dotes en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de dotes",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    private async refrescarDoteCacheBestEffort(idDote: number): Promise<void> {
        try {
            const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}dotes/${idDote}`));
            const normalized = normalizeDoteApi(raw);
            await this.firebaseContextSvc.run(() => set(ref(this.db, `Dotes/${normalized.Id}`), normalized));
        } catch {
            // Best-effort: no bloquea flujo de creacion.
        }
    }

    private mapCrearDoteError(error: any): Error {
        if (!(error instanceof HttpErrorResponse))
            return new Error("No se pudo crear la dote");

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";

        if (error.status === 400)
            return new Error(`Solicitud invalida para crear la dote.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para crear dotes.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontro el usuario asociado al uid de sesion.${suffix}`.trim());
        if (error.status === 409) {
            const conflictText = backendMessage.toLowerCase();
            if (conflictText.includes("nombre") || conflictText.includes("duplic") || conflictText.includes("existe"))
                return new Error("Ya existe una dote con ese nombre.");
            return new Error(`Conflicto al crear la dote.${suffix}`.trim());
        }

        if (backendMessage.length > 0)
            return new Error(backendMessage);

        return new Error(`No se pudo crear la dote (HTTP ${error.status || 0})`);
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return "";

        if (typeof errorBody === "string") {
            const message = errorBody.trim();
            return message.length > 0 ? message : "";
        }

        if (typeof errorBody === "object") {
            const knownMessage = `${errorBody?.message ?? errorBody?.error ?? ""}`.trim();
            if (knownMessage.length > 0)
                return knownMessage;
        }

        return "";
    }

    private async buildAuthHeaders(): Promise<{ Authorization: string; }> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error("Sesión no iniciada");

        const idToken = await user.getIdToken();
        if (`${idToken ?? ""}`.trim().length < 1)
            throw new Error("Token no disponible");

        return {
            Authorization: `Bearer ${idToken}`,
        };
    }
}
