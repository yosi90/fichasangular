import { cacheRtdbOApi, escucharCatalogo, leerListadoCompleto } from './catalogo-api';
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe } from '@angular/fire/database';
import { Observable, firstValueFrom, map } from "rxjs";
import { environment } from "src/environments/environment";
import { Conjuro } from "../interfaces/conjuro";
import { ConjuroCreateApiResponse, ConjuroCreateRequest, ConjuroCreateResponse, ConjuroEditable } from "../interfaces/conjuros-api";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeConjuroApi, normalizeConjuroEditableApi, normalizeConjuroLegacy } from "./utils/conjuro-mapper";
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDeCatalogo } from "src/app/services/utils/error-catalogo";
import { CONJURO } from "src/app/services/utils/nombres-de-catalogo";

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
        return escucharCatalogo(this.db, this.firebaseContextSvc, `Conjuros/${id}`)(onNext, onError);
    }

    protected watchConjurosPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharCatalogo(this.db, this.firebaseContextSvc, 'Conjuros')(onNext, onError);
    }

    getConjuro(id: number): Observable<Conjuro> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchConjuroPath(id, onNext, onError),
            desdeCache: (snapshot) => normalizeConjuroLegacy(snapshot?.val?.() ?? { Id: id }),
            pedir: () => this.http.get(`${environment.apiUrl}conjuros/${id}`),
            desdeApi: (raw) => normalizeConjuroApi(raw),
            avisos: {
                noEncontrado: { titulo: 'Conjuro no encontrado', texto: `No existe el conjuro con id ${id}` },
                error: 'Error al obtener el conjuro',
            },
        });
    }

    /** El conjuro por HTTP, sin caché y con los ids del alta: el que abre «Modificar». */
    getConjuroFresco(id: number): Observable<ConjuroEditable> {
        return this.http.get(`${environment.apiUrl}conjuros/${Math.trunc(Number(id))}`)
            .pipe(map((raw: any) => normalizeConjuroEditableApi(raw)));
    }

    getConjuros(): Observable<Conjuro[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchConjurosPath(onNext, onError),
            desdeCache: (snapshot) => {
                const conjuros: Conjuro[] = [];
                snapshot.forEach((obj: any) => {
                    conjuros.push(normalizeConjuroLegacy(obj.val()));
                });
                return conjuros;
            },
            pedir: () => this.syncConjuros(),
            desdeApi: (raw) => (Array.isArray(raw) ? raw : Object.values(raw ?? {}))
                .map((item: any) => normalizeConjuroApi(item))
                .filter((conjuro) => conjuro.Id > 0),
            avisos: {
                noEncontrado: { titulo: 'Listado de conjuros no disponible', texto: 'No se encontró /conjuros en la API' },
                error: 'Error al obtener el listado de conjuros',
            },
        });
    }

    public async crearConjuro(payload: ConjuroCreateRequest): Promise<ConjuroCreateResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<ConjuroCreateApiResponse>(`${environment.apiUrl}conjuros/add`, payload, { headers })
            );
            return respuestaDeConjuro(response);
        } catch (error: any) {
            throw errorDeCatalogo(error, "crear", CONJURO);
        }
    }

    /** `PUT /conjuros/<id>`: el conjuro entero, con el mismo cuerpo que el alta. */
    public async actualizarConjuro(idConjuro: number, payload: ConjuroCreateRequest): Promise<ConjuroCreateResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.put<ConjuroCreateApiResponse>(`${environment.apiUrl}conjuros/${Math.trunc(Number(idConjuro))}`, payload, { headers })
            );
            return respuestaDeConjuro(response);
        } catch (error: any) {
            throw errorDeCatalogo(error, "actualizar", CONJURO);
        }
    }

    private syncConjuros(): Observable<any> {
        return leerListadoCompleto(this.http, `${environment.apiUrl}conjuros`);
    }
}

function respuestaDeConjuro(response: ConjuroCreateApiResponse): ConjuroCreateResponse {
    const idConjuro = Math.trunc(Number(response?.idConjuro ?? 0));
    if (!Number.isFinite(idConjuro) || idConjuro <= 0)
        throw new Error("La API no devolvio un idConjuro valido");
    return {
        message: `${response?.message ?? ""}`,
        idConjuro,
        conjuro: normalizeConjuroEditableApi(response?.conjuro),
    };
}
