import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { ExtraDetalle } from "../interfaces/extra";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

export function normalizeExtra(raw: any): ExtraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class ExtraService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getExtras(): Observable<ExtraDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Extras");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const extras: ExtraDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const extra = normalizeExtra(obj.val());
                    if (extra.Id > 0 && extra.Nombre.trim().length > 0)
                        extras.push(extra);
                });

                extras.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(extras);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getExtra(id: number): Observable<ExtraDetalle> {
        const idNormalizado = Math.trunc(toNumber(id));
        if (idNormalizado <= 0)
            return throwError(() => new Error("Id de extra invalido"));

        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Extras/${idNormalizado}`),
            desdeCache: (snapshot) => normalizeExtra(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}extras/${idNormalizado}`),
            desdeApi: (raw) => normalizeExtra(raw),
        });
    }

}
