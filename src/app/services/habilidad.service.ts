import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, Subject, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    HabilidadBasicaDetalle,
    HabilidadCustomCreateRequest,
    HabilidadCustomMutationApiResponse,
    HabilidadCustomMutationResponse,
    HabilidadCustomUpdateRequest,
    HabilidadExtraRef,
} from "../interfaces/habilidad";
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
    if (value && typeof value === "object") {
        const envoltorios = ["data", "items", "rows", "recordset", "result", "resultado", "habilidades"];
        for (const key of envoltorios) {
            const v = (value as Record<string, any>)[key];
            if (Array.isArray(v))
                return v as T[];
        }
        return Object.values(value).filter(v => typeof v === "object") as T[];
    }
    return [];
}

function normalizeExtra(raw: any): HabilidadExtraRef {
    return {
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Descripcion: toText(raw?.Descripcion),
    };
}

export function normalizeHabilidadBasica(raw: any): HabilidadBasicaDetalle {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Nombre: toText(raw?.Nombre),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Descripcion: toText(raw?.Descripcion),
        Soporta_extra: toBoolean(raw?.Soporta_extra),
        Entrenada: toBoolean(raw?.Entrenada),
        Extras: toArray(raw?.Extras).map(normalizeExtra),
    };
}

@Injectable({
    providedIn: "root"
})
export class HabilidadService {
    private readonly habilidadesCustomMutadasSubject = new Subject<HabilidadBasicaDetalle>();
    readonly habilidadesCustomMutadas$ = this.habilidadesCustomMutadasSubject.asObservable();

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getHabilidades(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("Habilidades");
    }

    getHabilidadesCustom(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("HabilidadesCustom");
    }

    private getColeccion(path: string): Observable<HabilidadBasicaDetalle[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const habilidades: HabilidadBasicaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const habilidad = normalizeHabilidadBasica(obj.val());
                    if (habilidad.Id_habilidad > 0)
                        habilidades.push(habilidad);
                });

                habilidades.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(habilidades);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, path);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    private syncHabilidades() {
        return this.http.get(`${environment.apiUrl}habilidades`);
    }

    private syncHabilidadesCustom() {
        return this.http.get(`${environment.apiUrl}habilidades/custom`);
    }

    public async crearHabilidadCustom(payload: HabilidadCustomCreateRequest): Promise<HabilidadCustomMutationResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<HabilidadCustomMutationApiResponse>(`${environment.apiUrl}habilidades/custom/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionCustomResponse(response, payload, "Habilidad custom creada");
            await this.actualizarCacheCustom(normalized.habilidad);
            this.notificarCustomMutada(normalized.habilidad);
            return normalized;
        } catch (error: any) {
            throw this.mapHabilidadCustomError(error, "crear");
        }
    }

    public async actualizarHabilidadCustom(
        idHabilidad: number,
        payload: HabilidadCustomUpdateRequest
    ): Promise<HabilidadCustomMutationResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const id = Math.trunc(toNumber(idHabilidad));
            const response = await firstValueFrom(
                this.http.patch<HabilidadCustomMutationApiResponse>(`${environment.apiUrl}habilidades/custom/${id}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionCustomResponse(response, payload, "Habilidad custom actualizada", id);
            await this.actualizarCacheCustom(normalized.habilidad);
            this.notificarCustomMutada(normalized.habilidad);
            return normalized;
        } catch (error: any) {
            throw this.mapHabilidadCustomError(error, "actualizar");
        }
    }

    public async RenovarHabilidades(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncHabilidades());
            const total = await this.persistirHabilidades("Habilidades", response);
            Swal.fire({
                icon: "success",
                title: `Listado de habilidades actualizado (${total})`,
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            this.handleError(error, "habilidades");
            return false;
        }
    }

    public async RenovarHabilidadesCustom(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncHabilidadesCustom());
            const total = await this.persistirHabilidades("HabilidadesCustom", response);
            Swal.fire({
                icon: "success",
                title: `Listado de habilidades custom actualizado (${total})`,
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            this.handleError(error, "habilidades custom");
            return false;
        }
    }

    public async RenovarHabilidadesYCustom(): Promise<boolean> {
        const okHabilidades = await this.RenovarHabilidades();
        const okCustom = await this.RenovarHabilidadesCustom();
        return okHabilidades && okCustom;
    }

    private async persistirHabilidades(path: "Habilidades" | "HabilidadesCustom", response: any): Promise<number> {
        const habilidades = toArray(response)
            .map((raw: any) => normalizeHabilidadBasica(raw))
            .filter((h) => h.Id_habilidad > 0);

        await Promise.all(
            habilidades.map((h) => this.firebaseContextSvc.run(() => set(ref(this.db, `${path}/${h.Id_habilidad}`), h)))
        );

        return habilidades.length;
    }

    private normalizarMutacionCustomResponse(
        response: HabilidadCustomMutationApiResponse,
        payload: HabilidadCustomCreateRequest | HabilidadCustomUpdateRequest,
        fallbackMessage: string,
        fallbackId: number = 0,
    ): HabilidadCustomMutationResponse {
        const idHabilidad = Math.trunc(toNumber(response?.idHabilidad ?? response?.id_habilidad ?? response?.habilidad?.Id_habilidad ?? fallbackId));
        if (!Number.isFinite(idHabilidad) || idHabilidad <= 0)
            throw new Error("La API no devolvió un idHabilidad válido");

        return {
            message: `${response?.message ?? fallbackMessage}`,
            idHabilidad,
            habilidad: normalizeHabilidadBasica(response?.habilidad ?? {
                Id_habilidad: idHabilidad,
                Nombre: payload.nombre ?? "",
                Id_caracteristica: payload.id_caracteristica ?? 0,
                Caracteristica: "",
                Descripcion: "",
                Soporta_extra: false,
                Entrenada: false,
                Extras: [],
            }),
        };
    }

    private async actualizarCacheCustom(habilidad: HabilidadBasicaDetalle): Promise<void> {
        if (!habilidad || Number(habilidad.Id_habilidad) <= 0)
            return;
        await this.firebaseContextSvc.run(() => set(ref(this.db, `HabilidadesCustom/${habilidad.Id_habilidad}`), habilidad));
    }

    private notificarCustomMutada(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || Number(habilidad.Id_habilidad) <= 0)
            return;
        this.habilidadesCustomMutadasSubject.next(habilidad);
    }

    private mapHabilidadCustomError(error: any, accion: "crear" | "actualizar"): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error(`No se pudo ${accion} la habilidad custom`);

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";
        if (error.status === 400)
            return new Error(`Solicitud inválida para ${accion} la habilidad custom.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para ${accion} habilidades custom.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para ${accion} habilidades custom.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró la habilidad custom solicitada.${suffix}`.trim());
        if (error.status === 409)
            return new Error(`Ya existe una habilidad custom con ese nombre.${suffix}`.trim());
        if (backendMessage.length > 0)
            return new Error(backendMessage);
        return new Error(`No se pudo ${accion} la habilidad custom (HTTP ${error.status || 0})`);
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

    private handleError(error: any, tipo: "habilidades" | "habilidades custom") {
        const httpError = error as HttpErrorResponse;
        if (httpError.status === 404) {
            Swal.fire({
                icon: "warning",
                title: `Endpoint de ${tipo} no disponible`,
                text: `No se encontro /${tipo === "habilidades" ? "habilidades" : "habilidades/custom"} en la API`,
                showConfirmButton: true
            });
            return;
        }

        Swal.fire({
            icon: "warning",
            title: `Error al actualizar el listado de ${tipo}`,
            text: error?.message ?? "Error no identificado",
            showConfirmButton: true
        });
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
