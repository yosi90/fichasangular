import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Conjuro } from "../interfaces/conjuro";
import { ConjuroCreateApiResponse, ConjuroCreateRequest, ConjuroCreateResponse } from "../interfaces/conjuros-api";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeConjuroApi, normalizeConjuroLegacy } from "./utils/conjuro-mapper";

@Injectable({
    providedIn: 'root'
})
export class ConjuroService {

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    protected watchConjuroPath(id: number, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return this.firebaseContextSvc.run(() => {
            const dbRef = ref(this.db, `Conjuros/${id}`);
            return onValue(dbRef, onNext, onError);
        });
    }

    protected watchConjurosPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return this.firebaseContextSvc.run(() => {
            const dbRef = ref(this.db, 'Conjuros');
            return onValue(dbRef, onNext, onError);
        });
    }

    getConjuro(id: number): Observable<Conjuro> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (!snapshot.exists()) {
                    this.http.get(`${environment.apiUrl}conjuros/${id}`).subscribe({
                        next: (raw: any) => observador.next(normalizeConjuroApi(raw)),
                        error: (error: HttpErrorResponse) => {
                            if (error.status === 404) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Conjuro no encontrado',
                                    text: `No existe el conjuro con id ${id}`,
                                    showConfirmButton: true,
                                });
                            } else {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Error al obtener el conjuro',
                                    text: error.message,
                                    showConfirmButton: true,
                                });
                            }
                            observador.error(error);
                        }
                    });
                    return;
                }

                observador.next(normalizeConjuroLegacy(snapshot?.val?.() ?? { Id: id }));
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.watchConjuroPath(id, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getConjuros(): Observable<Conjuro[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (!snapshot.exists()) {
                    this.syncConjuros().subscribe({
                        next: (raw: any) => {
                            const conjuros = (Array.isArray(raw) ? raw : Object.values(raw ?? {}))
                                .map((item: any) => normalizeConjuroApi(item))
                                .filter((conjuro) => conjuro.Id > 0);
                            observador.next(conjuros);
                        },
                        error: (error: HttpErrorResponse) => {
                            if (error.status === 404) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Listado de conjuros no disponible',
                                    text: 'No se encontró /conjuros en la API',
                                    showConfirmButton: true,
                                });
                            } else {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Error al obtener el listado de conjuros',
                                    text: error.message,
                                    showConfirmButton: true,
                                });
                            }
                            observador.error(error);
                        }
                    });
                    return;
                }

                const conjuros: Conjuro[] = [];
                snapshot.forEach((obj: any) => {
                    conjuros.push(normalizeConjuroLegacy(obj.val()));
                });
                observador.next(conjuros);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.watchConjurosPath(onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    public async crearConjuro(payload: ConjuroCreateRequest): Promise<ConjuroCreateResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<ConjuroCreateApiResponse>(`${environment.apiUrl}conjuros/add`, payload, { headers })
            );
            const idConjuro = Math.trunc(Number(response?.idConjuro ?? 0));
            if (!Number.isFinite(idConjuro) || idConjuro <= 0)
                throw new Error("La API no devolvio un idConjuro valido");

            const normalizedResponse: ConjuroCreateResponse = {
                message: `${response?.message ?? "Conjuro creado"}`,
                idConjuro,
            };

            await this.refrescarConjuroCacheBestEffort(idConjuro);
            return normalizedResponse;
        } catch (error: any) {
            throw this.mapCrearConjuroError(error);
        }
    }

    private syncConjuros(): Observable<any> {
        return this.http.get(`${environment.apiUrl}conjuros`);
    }

    public async RenovarConjuros(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncConjuros());
            const conjuros = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                conjuros.map((raw: any) => {
                    const conjuro = normalizeConjuroApi(raw);
                    return this.firebaseContextSvc.run(() => set(ref(this.db, `Conjuros/${conjuro.Id}`), conjuro));
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de conjuros actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de conjuros',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }

    private async refrescarConjuroCacheBestEffort(idConjuro: number): Promise<void> {
        try {
            const raw = await firstValueFrom(this.syncConjuros());
            const conjuros = Array.isArray(raw)
                ? raw
                : Object.values(raw ?? {});
            const encontrado = conjuros
                .map((item: any) => normalizeConjuroApi(item))
                .find((item) => item.Id === idConjuro);
            if (!encontrado)
                return;

            await this.firebaseContextSvc.run(() => set(ref(this.db, `Conjuros/${encontrado.Id}`), encontrado));
        } catch {
            // Best-effort: no bloquea flujo de creacion.
        }
    }

    private mapCrearConjuroError(error: any): Error {
        if (!(error instanceof HttpErrorResponse))
            return new Error("No se pudo crear el conjuro");

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";

        if (error.status === 400)
            return new Error(`Solicitud invalida para crear el conjuro.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para crear conjuros.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontro el usuario asociado al uid de sesion.${suffix}`.trim());
        if (error.status === 409) {
            const conflictText = backendMessage.toLowerCase();
            if (conflictText.includes("nombre") || conflictText.includes("duplic") || conflictText.includes("existe"))
                return new Error("Ya existe un conjuro con ese nombre.");
            return new Error(`Conflicto al crear el conjuro.${suffix}`.trim());
        }

        if (backendMessage.length > 0)
            return new Error(backendMessage);

        return new Error(`No se pudo crear el conjuro (HTTP ${error.status || 0})`);
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
