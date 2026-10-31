import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database } from "@angular/fire/database";
import { Observable, Subject, firstValueFrom, map } from "rxjs";
import { environment } from "src/environments/environment";
import {
    IdiomaCreateRequest,
    IdiomaDetalle,
    IdiomaMutacionApiResponse,
    IdiomaMutacionResponse,
    IdiomaUpdateRequest,
} from "../interfaces/idioma";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { cabeceraApiConFirebase } from './platform-session.service';
import { toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdb, listaRtdb } from './catalogo-api';
import { errorDeCatalogo } from "src/app/services/utils/error-catalogo";
import { IDIOMA } from "src/app/services/utils/nombres-de-catalogo";


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
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Idiomas"),
            (valor) => normalizeIdioma(valor),
        );
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
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<IdiomaMutacionApiResponse>(`${environment.apiUrl}idiomas/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.nombre, payload.descripcion, "Idioma creado");
            this.notificarIdiomaMutado(normalized.idioma);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "crear", IDIOMA);
        }
    }

    public async actualizarIdioma(idIdioma: number, payload: IdiomaUpdateRequest): Promise<IdiomaMutacionResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.patch<IdiomaMutacionApiResponse>(`${environment.apiUrl}idiomas/${Math.trunc(Number(idIdioma ?? 0))}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload.nombre ?? "", payload.descripcion ?? "", "Idioma actualizado");
            this.notificarIdiomaMutado(normalized.idioma);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "actualizar", IDIOMA);
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

    private notificarIdiomaMutado(idioma: IdiomaDetalle): void {
        if (!idioma || Number(idioma.Id) <= 0)
            return;
        this.idiomasMutadosSubject.next(idioma);
    }
}
