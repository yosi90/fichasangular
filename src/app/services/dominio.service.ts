import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { DominioDetalle } from "../interfaces/dominio";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value > 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "si" || normalized === "sí";
    }
    return false;
}

export function normalizeDominio(raw: any): DominioDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class DominioService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getDominio(id: number): Observable<DominioDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Dominios/${id}`),
            desdeCache: (snapshot) => normalizeDominio(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}dominios/${id}`),
            desdeApi: (raw) => normalizeDominio(raw),
            avisos: {
                noEncontrado: { titulo: "Dominio no encontrado", texto: `No existe el dominio con id ${id}` },
                error: "Error al obtener el dominio",
            },
        });
    }

    getDominios(): Observable<DominioDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Dominios"),
            (valor) => normalizeDominio(valor),
            (dominio) => dominio.Id > 0,
        );
    }

}
