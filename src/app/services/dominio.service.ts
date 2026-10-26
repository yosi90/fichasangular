import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { DominioDetalle } from "../interfaces/dominio";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toBoolean, toInt, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

/** Un dominio con su poder concedido y lo que da (`DominioCatalogo` de la API; los de una deidad lo traen vacío). */
export function normalizeDominio(raw: any): DominioDetalle {
    const poder = toText(raw?.Poder).trim();
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Oficial: toBoolean(raw?.Oficial),
        Poder: poder.length > 0 ? poder : null,
        Alineamientos: toArray(raw?.Alineamientos).map((item: any) => ({ Id: toInt(item?.Id), Nombre: toText(item?.Nombre) })),
        Dotes: toArray(raw?.Dotes).map((item: any) => ({
            Id: toInt(item?.Id),
            Nombre: toText(item?.Nombre),
            Id_extra: item?.Id_extra === null || item?.Id_extra === undefined ? null : toInt(item.Id_extra),
            Extra: tieneTexto(item?.Extra) ? toText(item.Extra) : null,
            Extra_arma_deidad: toBoolean(item?.Extra_arma_deidad),
            Solo_sin_competencia: toBoolean(item?.Solo_sin_competencia),
        })),
        Habilidades_claseas: toArray(raw?.Habilidades_claseas).map((item: any) => ({
            Id_habilidad: toInt(item?.Id_habilidad),
            Habilidad: toText(item?.Habilidad),
            Id_extra: toInt(item?.Id_extra, -1),
            Extra: tieneTexto(item?.Extra) ? toText(item.Extra) : null,
        })),
        Especiales: toArray(raw?.Especiales).map((item: any) => ({ Id: toInt(item?.Id), Nombre: toText(item?.Nombre) })),
    };
}

function tieneTexto(valor: unknown): boolean {
    return toText(valor).trim().length > 0;
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
