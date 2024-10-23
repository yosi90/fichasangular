import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Rasgo } from "../interfaces/rasgo";

@Injectable({
    providedIn: 'root'
})
export class RasgoService {

    constructor(private db: Database, private http: HttpClient) { }

    getRasgo(id: number): Observable<Rasgo> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Rasgos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let rasgo: Rasgo = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                    Oficial: snapshot.child('Oficial').val(),
                };
                observador.next(rasgo);
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getRasgos(): Observable<Rasgo[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Rasgos');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const rasgos: Rasgo[] = [];
                snapshot.forEach((obj: any) => {
                    const rasgo: Rasgo = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Descripcion: obj.child('Descripcion').val(),
                        Oficial: obj.child('Oficial').val(),
                    };
                    rasgos.push(rasgo);
                });
                observador.next(rasgos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncRasgos(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}rasgos`);
        return res;
    }

    public async RenovarRasgos() {
        const db_instance = getDatabase();
        this.syncRasgos().subscribe(
            response => {
                response.forEach((element: {
                    i: number; n: string; d: string; o: boolean;
                }) => {
                    set(
                        ref(db_instance, `Rasgos/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Descripcion: element.d,
                        Oficial: element.o,
                    });
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de rasgos actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de rasgos',
                    text: error.message,
                    showConfirmButton: true
                });
            }
        );
    }
}