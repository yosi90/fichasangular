import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { ExtraDetalle } from "../interfaces/extra";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toInt, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeExtra(raw: any): ExtraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class ExtraService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getExtras(): Observable<ExtraDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Extras"),
            (valor) => normalizeExtra(valor),
            (extra) => extra.Id > 0 && extra.Nombre.trim().length > 0,
        );
    }

    getExtra(id: number): Observable<ExtraDetalle> {
        const idNormalizado = toInt(id);
        if (idNormalizado <= 0)
            return throwError(() => new Error("Id de extra invalido"));

        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Extras/${idNormalizado}`),
            desdeCache: (snapshot) => normalizeExtra(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}extras/${idNormalizado}`),
            desdeApi: (raw) => normalizeExtra(raw),
        });
    }

}
