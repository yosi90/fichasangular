import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeGrupoArma(raw: any): GrupoCompetencia {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class GrupoArmaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getGrupoArma(id: number): Observable<GrupoCompetencia> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `GruposArmas/${id}`),
            desdeCache: (snapshot) => normalizeGrupoArma(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}grupos-armas/${id}`),
            desdeApi: (raw) => normalizeGrupoArma(raw),
            avisos: {
                noEncontrado: { titulo: "Grupo de arma no encontrado", texto: `No existe el grupo de arma con id ${id}` },
                error: "Error al obtener el grupo de arma",
            },
        });
    }

    getGruposArmas(): Observable<GrupoCompetencia[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "GruposArmas"),
            (valor) => normalizeGrupoArma(valor),
            (grupo) => grupo.Id > 0,
        );
    }

}
