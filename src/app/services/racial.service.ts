import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Observable, Subject, firstValueFrom, map } from "rxjs";
import { environment } from "src/environments/environment";
import { RacialDetalle } from "../interfaces/racial";
import {
    RacialCreateApiResponse,
    RacialCreatePrerequisitos,
    RacialCreateRequest,
    RacialCreateResponse,
    RacialPrerequisitosPatchApiResponse,
    RacialPrerequisitosPatchRequest,
    RacialPrerequisitosPatchResponse,
    RacialUpdateApiResponse,
    RacialUpdateRequest,
    RacialUpdateResponse,
} from "../interfaces/raciales-api";
import { normalizeRacial, normalizeRaciales } from "./utils/racial-mapper";

function sortRaciales(raciales: RacialDetalle[]): RacialDetalle[] {
    return [...raciales]
        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
}

@Injectable({
    providedIn: "root"
})
export class RacialService {
    private readonly racialesMutadosSubject = new Subject<RacialDetalle>();
    readonly racialesMutados$ = this.racialesMutadosSubject.asObservable();

    constructor(
        private auth: Auth,
        private http: HttpClient,
    ) { }

    getRacial(id: number): Observable<RacialDetalle> {
        return this.http.get(`${environment.apiUrl}razas/raciales/${id}`)
            .pipe(map((raw: any) => normalizeRacial(raw)));
    }

    getRaciales(): Observable<RacialDetalle[]> {
        return this.http.get(`${environment.apiUrl}razas/raciales`)
            .pipe(map((raw: any) => sortRaciales(normalizeRaciales(raw))));
    }

    public async crearRacial(payload: RacialCreateRequest): Promise<RacialCreateResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<RacialCreateApiResponse>(`${environment.apiUrl}razas/raciales/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.racial.nombre, payload.racial.descripcion, "Racial creado");
            this.notificarRacialMutado(normalized.racial);
            return normalized;
        } catch (error: any) {
            throw this.mapCrearRacialError(error);
        }
    }

    public async actualizarRacial(idRacial: number, payload: RacialUpdateRequest): Promise<RacialUpdateResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.put<RacialUpdateApiResponse>(`${environment.apiUrl}razas/raciales/${Math.trunc(Number(idRacial ?? 0))}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.racial.nombre, payload.racial.descripcion, "Racial actualizado");
            this.notificarRacialMutado(normalized.racial);
            return normalized;
        } catch (error: any) {
            throw this.mapActualizarRacialError(error);
        }
    }

    public async anadirPrerrequisitosRacial(
        idRacial: number,
        prerrequisitos: RacialCreatePrerequisitos
    ): Promise<RacialPrerequisitosPatchResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const payload: RacialPrerequisitosPatchRequest = { prerrequisitos };
            const response = await firstValueFrom(
                this.http.patch<RacialPrerequisitosPatchApiResponse>(
                    `${environment.apiUrl}razas/raciales/${Math.trunc(Number(idRacial ?? 0))}/prerrequisitos`,
                    payload,
                    { headers }
                )
            );
            const normalized = this.normalizarMutacionResponse(response, "", "", "Prerrequisitos del racial actualizados");
            this.notificarRacialMutado(normalized.racial);
            return normalized;
        } catch (error: any) {
            throw this.mapPatchPrerrequisitosRacialError(error);
        }
    }

    private mapCrearRacialError(error: any): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error("No se pudo crear el racial");

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";

        if (error.status === 400)
            return new Error(`Solicitud inválida para crear el racial.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para crear raciales.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para crear raciales.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró una referencia requerida para crear el racial.${suffix}`.trim());
        if (error.status === 409) {
            const conflictText = backendMessage.toLowerCase();
            if (conflictText.includes("nombre") || conflictText.includes("duplic") || conflictText.includes("existe"))
                return new Error("Ya existe un racial con ese nombre.");
            return new Error(`Conflicto al crear el racial.${suffix}`.trim());
        }
        if (error.status === 502)
            return new Error(`No se pudo sincronizar el racial con la caché del backend.${suffix}`.trim());

        if (backendMessage.length > 0)
            return new Error(backendMessage);

        return new Error(`No se pudo crear el racial (HTTP ${error.status || 0})`);
    }

    private mapActualizarRacialError(error: any): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error("No se pudo actualizar el racial");

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";

        if (error.status === 400)
            return new Error(`Solicitud inválida para actualizar el racial.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para actualizar raciales.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para actualizar raciales.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró una referencia requerida para actualizar el racial.${suffix}`.trim());
        if (error.status === 502)
            return new Error(`No se pudo sincronizar el racial con la caché del backend.${suffix}`.trim());

        if (backendMessage.length > 0)
            return new Error(backendMessage);

        return new Error(`No se pudo actualizar el racial (HTTP ${error.status || 0})`);
    }

    private mapPatchPrerrequisitosRacialError(error: any): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error("No se pudieron actualizar los prerrequisitos del racial");

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";

        if (error.status === 400)
            return new Error(`Solicitud inválida para actualizar los prerrequisitos del racial.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para actualizar prerrequisitos de raciales.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para actualizar prerrequisitos de raciales.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró el racial o una referencia requerida para actualizar sus prerrequisitos.${suffix}`.trim());
        if (error.status === 502)
            return new Error(`No se pudo sincronizar el racial con la caché del backend.${suffix}`.trim());

        if (backendMessage.length > 0)
            return new Error(backendMessage);

        return new Error(`No se pudieron actualizar los prerrequisitos del racial (HTTP ${error.status || 0})`);
    }

    private normalizarMutacionResponse(
        response: RacialCreateApiResponse | RacialUpdateApiResponse | RacialPrerequisitosPatchApiResponse,
        fallbackNombre: string,
        fallbackDescripcion: string | undefined,
        fallbackMessage: string,
    ): RacialCreateResponse {
        const idRacial = Math.trunc(Number(response?.idRacial ?? 0));
        if (!Number.isFinite(idRacial) || idRacial <= 0)
            throw new Error("La API no devolvió un idRacial válido");

        return {
            message: `${response?.message ?? fallbackMessage}`,
            idRacial,
            racial: normalizeRacial(response?.racial ?? {
                Id: idRacial,
                Nombre: fallbackNombre,
                Descripcion: fallbackDescripcion ?? "",
            }),
        };
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return "";

        if (typeof errorBody === "string") {
            const message = errorBody.trim();
            return message.length > 0 ? message : "";
        }

        if (typeof errorBody === "object") {
            const message = `${errorBody?.message ?? errorBody?.error ?? ""}`.trim();
            if (message.length > 0)
                return message;
        }

        return "";
    }

    private notificarRacialMutado(racial: RacialDetalle): void {
        if (!racial || Number(racial.Id) <= 0)
            return;
        this.racialesMutadosSubject.next(racial);
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
