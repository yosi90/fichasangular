import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import { Dote } from "../interfaces/dote";
import { DoteCreateRequest, DoteCreateResponse } from "../interfaces/dotes-api";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { normalizeDote } from "./utils/dote-mapper";

@Injectable({
    providedIn: "root"
})
export class DoteService {

    constructor(private db: Database, private http: HttpClient) { }

    getDote(id: number): Observable<Dote> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Dotes/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeDote(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}dotes/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeDote(raw)),
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

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getDotes(): Observable<Dote[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Dotes");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dotes: Dote[] = [];
                snapshot.forEach((obj: any) => {
                    dotes.push(normalizeDote(obj.val()));
                });
                observador.next(dotes);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);

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
            const response = await firstValueFrom(
                this.http.post<DoteCreateResponse>(`${environment.apiUrl}dotes/add`, payload)
            );
            const idDote = Math.trunc(Number(response?.idDote ?? 0));
            if (!Number.isFinite(idDote) || idDote <= 0)
                throw new Error("La API no devolvio un idDote valido");

            const normalizedResponse: DoteCreateResponse = {
                message: `${response?.message ?? "Dote creada"}`,
                idDote,
                uid: `${response?.uid ?? payload?.uid ?? payload?.firebaseUid ?? ""}`.trim(),
            };

            await this.refrescarDoteCacheBestEffort(idDote);
            return normalizedResponse;
        } catch (error: any) {
            throw this.mapCrearDoteError(error);
        }
    }

    public async RenovarDotes(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncDotes());
            const dotes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                dotes.map((raw: any) => {
                    const dote = normalizeDote(raw);
                    return set(ref(dbInstance, `Dotes/${dote.Id}`), dote);
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
            const normalized = normalizeDote(raw);
            await set(ref(this.db, `Dotes/${normalized.Id}`), normalized);
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
}
