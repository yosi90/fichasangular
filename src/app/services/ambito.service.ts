import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

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
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Ambitos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const ambitos: AmbitoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const ambito = normalizeAmbito(obj.val());
                    if (ambito.Id > 0)
                        ambitos.push(ambito);
                });
                ambitos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(ambitos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
