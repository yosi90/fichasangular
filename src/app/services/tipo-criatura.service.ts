import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { TipoCriatura } from "../interfaces/tipo_criatura";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { leerComodin } from "./utils/comodin";

/** Un tipo de criatura de la caché de la RTDB (`TiposCriatura/{id}`). */
function tipoCriaturaDesdeRtdb(nodo: any, id: number): TipoCriatura {
    return {
        Id: id,
        Nombre: nodo.child('Nombre').val(),
        Comodin: leerComodin(nodo.child('Comodin').val()),
        Descripcion: nodo.child('Descripcion').val(),
        Manual: nodo.child('Manual').val(),
        Id_tipo_dado: nodo.child('Id_tipo_dado').val(),
        Tipo_dado: nodo.child('Tipo_dado').val(),
        Id_ataque: nodo.child('Id_ataque').val(),
        Id_fortaleza: nodo.child('Id_fortaleza').val(),
        Id_reflejos: nodo.child('Id_reflejos').val(),
        Id_voluntad: nodo.child('Id_voluntad').val(),
        Id_puntos_habilidad: nodo.child('Id_puntos_habilidad').val(),
        Puntos_habilidad: nodo.child('Puntos_habilidad').val() ?? 0,
        Come: nodo.child('Come').val(),
        Respira: nodo.child('Respira').val(),
        Duerme: nodo.child('Duerme').val(),
        Recibe_criticos: nodo.child('Recibe_críticos').val(),
        Puede_ser_flanqueado: nodo.child('Puede_ser_flanqueado').val(),
        Pierde_constitucion: nodo.child('Pierde_constitucion').val(),
        Limite_inteligencia: nodo.child('Limite_inteligencia').val(),
        Tesoro: nodo.child('Tesoro').val(),
        Id_alineamiento: nodo.child('Id_alineamiento').val(),
        Rasgos: nodo.child('Rasgos').val(),
        Oficial: nodo.child('Oficial').val(),
    };
}

@Injectable({
    providedIn: 'root'
})
export class TipoCriaturaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    getTipoCriatura(id: number): Observable<TipoCriatura> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                observador.next(tipoCriaturaDesdeRtdb(snapshot, id));
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `TiposCriatura/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getTiposCriatura(): Observable<TipoCriatura[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const TiposCriatura: TipoCriatura[] = [];
                snapshot.forEach((obj: any) => {
                    TiposCriatura.push(tipoCriaturaDesdeRtdb(obj, obj.child('Id').val()));
                });
                observador.next(TiposCriatura);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, 'TiposCriatura');
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

}
