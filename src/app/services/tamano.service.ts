import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { Tamano } from "../interfaces/tamaño";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeTamano(raw: any): Tamano {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Modificador: toNumber(raw?.Modificador),
        Modificador_presa: toNumber(raw?.Modificador_presa),
    };
}

@Injectable({
    providedIn: "root"
})
export class TamanoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getTamano(id: number): Observable<Tamano> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Tamanos/${id}`),
            desdeCache: (snapshot) => normalizeTamano(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}tamanos/${id}`),
            desdeApi: (raw) => normalizeTamano(raw),
            avisos: {
                noEncontrado: { titulo: "Tamaño no encontrado", texto: `No existe el tamaño con id ${id}` },
                error: "Error al obtener el tamaño",
            },
        });
    }

    getTamanos(): Observable<Tamano[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Tamanos"),
            (valor) => normalizeTamano(valor),
            (tamano) => tamano.Id > 0,
            (a, b) => a.Id - b.Id,
        );
    }

}
