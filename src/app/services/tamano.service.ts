import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { Tamano } from "../interfaces/tamaño";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

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
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Tamanos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const tamanos: Tamano[] = [];
                snapshot.forEach((obj: any) => {
                    const tamano = normalizeTamano(obj.val());
                    if (tamano.Id > 0)
                        tamanos.push(tamano);
                });
                tamanos.sort((a, b) => a.Id - b.Id);
                observador.next(tamanos);
            };

            const onError = (error: any) => observador.error(error);

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
