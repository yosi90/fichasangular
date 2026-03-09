import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { EscuelaConjuros } from "../interfaces/escuela-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

@Injectable({
    providedIn: 'root'
})
export class EscuelaConjurosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEscuela(id: number): Observable<EscuelaConjuros> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Escuelas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let escuela: EscuelaConjuros = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Nombre_especial: snapshot.child('Nombre_especial').val(),
                    Prohibible: snapshot.child('Prohibible').val()
                };
                observador.next(escuela);
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    getEscuelas(): Observable<EscuelaConjuros[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Escuelas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const escuelas: EscuelaConjuros[] = [];
                snapshot.forEach((obj: any) => {
                    const escuela: EscuelaConjuros = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Nombre_especial: obj.child('Nombre_especial').val(),
                        Prohibible: obj.child('Prohibible').val()
                    };
                    escuelas.push(escuela);
                });
                observador.next(escuelas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    private syncEscuelas(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}escuelas`);
        return res;
    }

    public async RenovarEscuelas(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncEscuelas());
            const escuelas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                escuelas.map((element: {
                    i: number; n: string; ne: string; p: boolean;
                }) => {
                    return this.firebaseContextSvc.run(() => set(
                        ref(this.db, `Escuelas/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Nombre_especial: element.ne,
                        Prohibible: element.p
                    }));
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de escuelas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de escuelas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
