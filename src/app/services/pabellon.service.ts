import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { PabellonDetalle } from "../interfaces/pabellon";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizePabellon(raw: any): PabellonDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class PabellonService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getPabellon(id: number): Observable<PabellonDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Pabellones/${id}`),
            desdeCache: (snapshot) => normalizePabellon(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}pabellones/${id}`),
            desdeApi: (raw) => normalizePabellon(raw),
            avisos: {
                noEncontrado: { titulo: "Pabellon no encontrado", texto: `No existe el pabellon con id ${id}` },
                error: "Error al obtener el pabellon",
            },
        });
    }

    getPabellones(): Observable<PabellonDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Pabellones"),
            (valor) => normalizePabellon(valor),
            (pabellon) => pabellon.Id > 0,
        );
    }

}
