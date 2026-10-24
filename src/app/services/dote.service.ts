import { cacheRtdbOApi, catalogosDesdeApi, escucharRtdb, leerListadoCompleto, sinCache } from './catalogo-api';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import { Dote } from "../interfaces/dote";
import { DoteCreateApiResponse, DoteCreateRequest, DoteCreateResponse } from "../interfaces/dotes-api";
import { environment } from "src/environments/environment";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeDoteApi, normalizeDoteLegacy } from "./utils/dote-mapper";
import { cabeceraApiConFirebase } from './platform-session.service';

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
        if (catalogosDesdeApi())
            return sinCache(onNext);
        return escucharRtdb(this.db, this.firebaseContextSvc, `Dotes/${id}`)(onNext, onError);
    }

    protected watchDotesPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        if (catalogosDesdeApi())
            return sinCache(onNext);
        return escucharRtdb(this.db, this.firebaseContextSvc, "Dotes")(onNext, onError);
    }

    getDote(id: number): Observable<Dote> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchDotePath(id, onNext, onError),
            desdeCache: (snapshot) => normalizeDoteLegacy(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}dotes/${id}`),
            desdeApi: (raw) => normalizeDoteApi(raw),
            avisos: {
                noEncontrado: { titulo: "Dote no encontrada", texto: `No existe la dote con id ${id}` },
                error: "Error al obtener la dote",
            },
        });
    }

    getDotes(): Observable<Dote[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchDotesPath(onNext, onError),
            desdeCache: (snapshot) => {
                const dotes: Dote[] = [];
                snapshot.forEach((obj: any) => {
                    dotes.push(normalizeDoteLegacy(obj.val()));
                });
                return dotes;
            },
            pedir: () => this.syncDotes(),
            desdeApi: (raw) => (Array.isArray(raw) ? raw : Object.values(raw ?? {}))
                .map((item: any) => normalizeDoteApi(item))
                .filter((dote) => dote.Id > 0),
            avisos: {
                noEncontrado: { titulo: "Listado de dotes no disponible", texto: "No se encontró /dotes en la API" },
                error: "Error al obtener el listado de dotes",
            },
        });
    }

    private syncDotes(): Observable<any> {
        return leerListadoCompleto(this.http, `${environment.apiUrl}dotes`);
    }

    public async crearDote(payload: DoteCreateRequest): Promise<DoteCreateResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
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
            return normalizedResponse;
        } catch (error: any) {
            throw this.mapCrearDoteError(error);
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
