import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { DominioDetalle } from "../interfaces/dominio";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

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
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dominios: DominioDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const dominio = normalizeDominio(obj.val());
                    if (dominio.Id > 0)
                        dominios.push(dominio);
                });
                dominios.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(dominios);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Dominios");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

}
