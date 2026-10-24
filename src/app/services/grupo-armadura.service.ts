import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

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
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const grupos: GrupoCompetencia[] = [];
                snapshot.forEach((obj: any) => {
                    const grupo = normalizeGrupoArmadura(obj.val());
                    if (grupo.Id > 0)
                        grupos.push(grupo);
                });
                grupos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(grupos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "GruposArmaduras");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

}
