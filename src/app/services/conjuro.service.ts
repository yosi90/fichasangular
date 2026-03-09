import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Conjuro } from "../interfaces/conjuro";
import { ConjuroCreateRequest, ConjuroCreateResponse } from "../interfaces/conjuros-api";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeConjuro } from "./utils/conjuro-mapper";

@Injectable({
    providedIn: 'root'
})
export class ConjuroService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    getConjuro(id: number): Observable<Conjuro> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                observador.next(normalizeConjuro(snapshot?.val?.() ?? { Id: id }));
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `Conjuros/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getConjuros(): Observable<Conjuro[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const conjuros: Conjuro[] = [];
                snapshot.forEach((obj: any) => {
                    conjuros.push(normalizeConjuro(obj.val()));
                });
                observador.next(conjuros);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, 'Conjuros');
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    public async crearConjuro(payload: ConjuroCreateRequest): Promise<ConjuroCreateResponse> {
        try {
            const response = await firstValueFrom(
                this.http.post<ConjuroCreateResponse>(`${environment.apiUrl}conjuros/add`, payload)
            );
            const idConjuro = Math.trunc(Number(response?.idConjuro ?? 0));
            if (!Number.isFinite(idConjuro) || idConjuro <= 0)
                throw new Error("La API no devolvio un idConjuro valido");

            const normalizedResponse: ConjuroCreateResponse = {
                message: `${response?.message ?? "Conjuro creado"}`,
                idConjuro,
                uid: `${response?.uid ?? payload?.uid ?? payload?.firebaseUid ?? ""}`.trim(),
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
                    const conjuro = normalizeConjuro(raw);
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
                .map((item: any) => normalizeConjuro(item))
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
}
