import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeGrupoArmadura(raw: any): GrupoCompetencia {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class GrupoArmaduraService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getGrupoArmadura(id: number): Observable<GrupoCompetencia> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `GruposArmaduras/${id}`),
            desdeCache: (snapshot) => normalizeGrupoArmadura(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}grupos-armaduras/${id}`),
            desdeApi: (raw) => normalizeGrupoArmadura(raw),
            avisos: {
                noEncontrado: { titulo: "Grupo de armadura no encontrado", texto: `No existe el grupo de armadura con id ${id}` },
                error: "Error al obtener el grupo de armadura",
            },
        });
    }

    getGruposArmaduras(): Observable<GrupoCompetencia[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "GruposArmaduras"),
            (valor) => normalizeGrupoArmadura(valor),
            (grupo) => grupo.Id > 0,
        );
    }

}
