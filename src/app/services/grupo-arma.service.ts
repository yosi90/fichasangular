import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

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
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const grupos: GrupoCompetencia[] = [];
                snapshot.forEach((obj: any) => {
                    const grupo = normalizeGrupoArma(obj.val());
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
                const dbRef = ref(this.db, "GruposArmas");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

}
