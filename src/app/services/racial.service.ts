import { HttpClient } from "@angular/common/http";
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
import { cabeceraApiConFirebase } from './platform-session.service';
import { ElementoDeCatalogo, errorDeCatalogo } from "src/app/services/utils/error-catalogo";

const RACIAL: ElementoDeCatalogo = { singular: "racial", plural: "raciales", femenino: false };

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
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<RacialCreateApiResponse>(`${environment.apiUrl}razas/raciales/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.racial.nombre, payload.racial.descripcion, "Racial creado");
            this.notificarRacialMutado(normalized.racial);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "crear", RACIAL);
        }
    }

    public async actualizarRacial(idRacial: number, payload: RacialUpdateRequest): Promise<RacialUpdateResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.put<RacialUpdateApiResponse>(`${environment.apiUrl}razas/raciales/${Math.trunc(Number(idRacial ?? 0))}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.racial.nombre, payload.racial.descripcion, "Racial actualizado");
            this.notificarRacialMutado(normalized.racial);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "actualizar", RACIAL);
        }
    }

    public async anadirPrerrequisitosRacial(
        idRacial: number,
        prerrequisitos: RacialCreatePrerequisitos
    ): Promise<RacialPrerequisitosPatchResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
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
            throw errorDeCatalogo(error, "actualizar", RACIAL);
        }
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

    private notificarRacialMutado(racial: RacialDetalle): void {
        if (!racial || Number(racial.Id) <= 0)
            return;
        this.racialesMutadosSubject.next(racial);
    }
}
