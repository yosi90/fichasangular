import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeAmbito(raw: any): AmbitoDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class AmbitoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getAmbito(id: number): Observable<AmbitoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Ambitos/${id}`),
            desdeCache: (snapshot) => normalizeAmbito(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}ambitos/${id}`),
            desdeApi: (raw) => normalizeAmbito(raw),
            avisos: {
                noEncontrado: { titulo: "Ambito no encontrado", texto: `No existe el ambito con id ${id}` },
                error: "Error al obtener el ambito",
            },
        });
    }

    getAmbitos(): Observable<AmbitoDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Ambitos"),
            (valor) => normalizeAmbito(valor),
            (ambito) => ambito.Id > 0,
        );
    }

}
