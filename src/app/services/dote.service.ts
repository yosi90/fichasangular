import { cacheRtdbOApi, escucharCatalogo, leerListadoCompleto } from './catalogo-api';
import { HttpClient } from "@angular/common/http";
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
import { errorDeCatalogo } from "src/app/services/utils/error-catalogo";
import { DOTE } from "src/app/services/utils/nombres-de-catalogo";

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
        return escucharCatalogo(this.db, this.firebaseContextSvc, `Dotes/${id}`)(onNext, onError);
    }

    protected watchDotesPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharCatalogo(this.db, this.firebaseContextSvc, "Dotes")(onNext, onError);
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
            throw errorDeCatalogo(error, "crear", DOTE);
        }
    }
}
