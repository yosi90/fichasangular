import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class ManualesService {

    constructor(public db: Database, private http: HttpClient) { }

    async getManual(id: number): Promise<Observable<string>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Manuales/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let manual: string = snapshot.child('Nombre').val();
                observador.next(manual); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    async getManuales(): Promise<Observable<string[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Manuales');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Manuales: string[] = [];
                snapshot.forEach((obj: any) => {
                    const manual: string = obj.child('Nombre').val();
                    Manuales.push(manual);
                });
                observador.next(Manuales); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    private syncManuales(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}manuales`);
        return res;
    }

    public async RenovarManuales() {
        const db = getDatabase();
        this.syncManuales().subscribe(
            response => {
                response.forEach((element: {
                    i: number; n: string;
                }) => {
                    set(ref(db, `Manuales/${element.i}`), {
                        Nombre: element.n,
                    })
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de manuales actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            onerror = (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de manuales',
                    text: error,
                    showConfirmButton: true
                });
            }
        );
    }
}
