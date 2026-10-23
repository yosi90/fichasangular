import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { EnemigoPredilectoDetalle } from "../interfaces/enemigo-predilecto-detalle";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';

export function normalizeEnemigoPredilecto(raw: any): EnemigoPredilectoDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class EnemigoPredilectoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEnemigosPredilectos(): Observable<EnemigoPredilectoDetalle[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const enemigos: EnemigoPredilectoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const enemigo = normalizeEnemigoPredilecto(obj.val());
                    if (enemigo.Id > 0 && enemigo.Nombre.trim().length > 0)
                        enemigos.push(enemigo);
                });

                enemigos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(enemigos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "EnemigosPredilectos");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

}
