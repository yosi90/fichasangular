import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, Subject, firstValueFrom, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    IdiomaCreateRequest,
    IdiomaDetalle,
    IdiomaMutacionApiResponse,
    IdiomaMutacionResponse,
    IdiomaUpdateRequest,
} from "../interfaces/idioma";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: any, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

export function normalizeIdioma(raw: any): IdiomaDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Secreto: toBoolean(raw?.Secreto),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class IdiomaService {
    private readonly idiomasMutadosSubject = new Subject<IdiomaDetalle>();
    readonly idiomasMutados$ = this.idiomasMutadosSubject.asObservable();

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getIdiomas(): Observable<IdiomaDetalle[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const idiomas: IdiomaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const idioma = normalizeIdioma(obj.val());
                    if (idioma.Id > 0)
                        idiomas.push(idioma);
                });

                idiomas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(idiomas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Idiomas");
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    private syncIdiomas() {
        return this.http.get(`${environment.apiUrl}idiomas`);
    }

    getIdioma(idIdioma: number): Observable<IdiomaDetalle> {
        const id = Math.trunc(Number(idIdioma ?? 0));
        return this.syncIdiomas().pipe(map((response) => {
            const idioma = toArray(response)
                .map((raw: any) => normalizeIdioma(raw))
                .find((item) => item.Id === id);
            if (!idioma)
                throw new Error("No se encontró el idioma solicitado");
            return idioma;
        }));
    }

    public async crearIdioma(payload: IdiomaCreateRequest): Promise<IdiomaMutacionResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<IdiomaMutacionApiResponse>(`${environment.apiUrl}idiomas/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.nombre, payload.descripcion, "Idioma creado");
            await this.actualizarCacheLocal(normalized.idioma);
            this.notificarIdiomaMutado(normalized.idioma);
            return normalized;
        } catch (error: any) {
            throw this.mapIdiomaError(error, "crear");
        }
    }

    public async actualizarIdioma(idIdioma: number, payload: IdiomaUpdateRequest): Promise<IdiomaMutacionResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.patch<IdiomaMutacionApiResponse>(`${environment.apiUrl}idiomas/${Math.trunc(Number(idIdioma ?? 0))}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.nombre ?? "", payload.descripcion ?? "", "Idioma actualizado");
            await this.actualizarCacheLocal(normalized.idioma);
            this.notificarIdiomaMutado(normalized.idioma);
            return normalized;
        } catch (error: any) {
            throw this.mapIdiomaError(error, "actualizar");
        }
    }

    public async RenovarIdiomas(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncIdiomas());
            const idiomas = toArray(response)
                .map((raw: any) => normalizeIdioma(raw))
                .filter((idioma) => idioma.Id > 0);

            await Promise.all(
                idiomas.map((idioma) => this.firebaseContextSvc.run(() => set(ref(this.db, `Idiomas/${idioma.Id}`), idioma)))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de idiomas actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de idiomas no disponible",
                    text: "No se encontro /idiomas en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de idiomas",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    private normalizarMutacionResponse(
        response: IdiomaMutacionApiResponse,
        fallbackNombre: string,
        fallbackDescripcion: string,
        fallbackMessage: string,
    ): IdiomaMutacionResponse {
        const idIdioma = Math.trunc(Number(response?.idIdioma ?? response?.idioma?.Id ?? 0));
        if (!Number.isFinite(idIdioma) || idIdioma <= 0)
            throw new Error("La API no devolvió un idIdioma válido");

        return {
            message: `${response?.message ?? fallbackMessage}`,
            idIdioma,
            idioma: normalizeIdioma(response?.idioma ?? {
                Id: idIdioma,
                Nombre: fallbackNombre,
                Descripcion: fallbackDescripcion,
                Secreto: false,
                Oficial: true,
            }),
        };
    }

    private async actualizarCacheLocal(idioma: IdiomaDetalle): Promise<void> {
        if (!idioma || Number(idioma.Id) <= 0)
            return;
        await this.firebaseContextSvc.run(() => set(ref(this.db, `Idiomas/${idioma.Id}`), idioma));
    }

    private notificarIdiomaMutado(idioma: IdiomaDetalle): void {
        if (!idioma || Number(idioma.Id) <= 0)
            return;
        this.idiomasMutadosSubject.next(idioma);
    }

    private mapIdiomaError(error: any, accion: "crear" | "actualizar"): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error(`No se pudo ${accion} el idioma`);

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";
        if (error.status === 400)
            return new Error(`Solicitud inválida para ${accion} el idioma.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para ${accion} idiomas.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para ${accion} idiomas.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró el idioma solicitado.${suffix}`.trim());
        if (error.status === 409)
            return new Error("Ya existe un idioma con ese nombre.");
        if (backendMessage.length > 0)
            return new Error(backendMessage);
        return new Error(`No se pudo ${accion} el idioma (HTTP ${error.status || 0})`);
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return "";
        if (typeof errorBody === "string")
            return errorBody.trim();
        if (typeof errorBody === "object")
            return `${errorBody?.message ?? errorBody?.error ?? ""}`.trim();
        return "";
    }

    private async buildAuthHeaders(): Promise<{ Authorization: string; }> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error("Sesión no iniciada");
        const idToken = await user.getIdToken();
        if (`${idToken ?? ""}`.trim().length < 1)
            throw new Error("Token no disponible");
        return { Authorization: `Bearer ${idToken}` };
    }
}
