import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { TipoCriatura } from "../interfaces/tipo_criatura";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { leerComodin } from "./utils/comodin";

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
                let tipoCriatura: TipoCriatura = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Comodin: leerComodin(snapshot.child('Comodin').val()),
                    Descripcion: snapshot.child('Descripcion').val(),
                    Manual: snapshot.child('Manual').val(),
                    Id_tipo_dado: snapshot.child('Id_tipo_dado').val(),
                    Tipo_dado: snapshot.child('Tipo_dado').val(),
                    Id_ataque: snapshot.child('Id_ataque').val(),
                    Id_fortaleza: snapshot.child('Id_fortaleza').val(),
                    Id_reflejos: snapshot.child('Id_reflejos').val(),
                    Id_voluntad: snapshot.child('Id_voluntad').val(),
                    Id_puntos_habilidad: snapshot.child('Id_puntos_habilidad').val(),
                    Come: snapshot.child('Come').val(),
                    Respira: snapshot.child('Respira').val(),
                    Duerme: snapshot.child('Duerme').val(),
                    Recibe_criticos: snapshot.child('Recibe_críticos').val(),
                    Puede_ser_flanqueado: snapshot.child('Puede_ser_flanqueado').val(),
                    Pierde_constitucion: snapshot.child('Pierde_constitucion').val(),
                    Limite_inteligencia: snapshot.child('Limite_inteligencia').val(),
                    Tesoro: snapshot.child('Tesoro').val(),
                    Id_alineamiento: snapshot.child('Id_alineamiento').val(),
                    Rasgos: snapshot.child('Rasgos').val(),
                    Oficial: snapshot.child('Oficial').val(),
                };
                observador.next(tipoCriatura);
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
                    const tipoCriatura: TipoCriatura = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Comodin: leerComodin(obj.child('Comodin').val()),
                        Descripcion: obj.child('Descripcion').val(),
                        Manual: obj.child('Manual').val(),
                        Id_tipo_dado: obj.child('Id_tipo_dado').val(),
                        Tipo_dado: obj.child('Tipo_dado').val(),
                        Id_ataque: obj.child('Id_ataque').val(),
                        Id_fortaleza: obj.child('Id_fortaleza').val(),
                        Id_reflejos: obj.child('Id_reflejos').val(),
                        Id_voluntad: obj.child('Id_voluntad').val(),
                        Id_puntos_habilidad: obj.child('Id_puntos_habilidad').val(),
                        Come: obj.child('Come').val(),
                        Respira: obj.child('Respira').val(),
                        Duerme: obj.child('Duerme').val(),
                        Recibe_criticos: obj.child('Recibe_críticos').val(),
                        Puede_ser_flanqueado: obj.child('Puede_ser_flanqueado').val(),
                        Pierde_constitucion: obj.child('Pierde_constitucion').val(),
                        Limite_inteligencia: obj.child('Limite_inteligencia').val(),
                        Tesoro: obj.child('Tesoro').val(),
                        Id_alineamiento: obj.child('Id_alineamiento').val(),
                        Rasgos: obj.child('Rasgos').val(),
                        Oficial: obj.child('Oficial').val(),
                    };
                    TiposCriatura.push(tipoCriatura);
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
