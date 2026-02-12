import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Alineamiento } from "../interfaces/alineamiento";

@Injectable({
    providedIn: 'root'
})
export class AlineamientoService {

    constructor(private db: Database, private http: HttpClient) { }

    getAlineamiento(id: number): Observable<Alineamiento> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Alineamientos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let alineamiento: Alineamiento = {
                    Id: id,
                    Basico: snapshot.child('Basico').val(),
                    Ley: snapshot.child('Ley').val(),
                    Moral: snapshot.child('Moral').val(),
                    Prioridad: snapshot.child('Prioridad').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                };
                observador.next(alineamiento);
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

    private syncAlineamientos(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}alineamientos`);
        return res;
    }

    public async RenovarAlineamientos() {
        const db_instance = getDatabase();
        this.syncAlineamientos().subscribe(
            response => {
                response.forEach((element: {
                    i: number; b: any; l: any; m: any; p: any; d: boolean;
                }) => {
                    set(
                        ref(db_instance, `Alineamientos/${element.i}`), {
                        Id: element.i,
                        Basico: element.b,
                        Ley: element.l,
                        Moral: element.m,
                        Prioridad: element.p,
                        Descripcion: element.d
                    });
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de alineamientos actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de alineamientos',
                    text: error.message,
                    showConfirmButton: true
                });
            }
        );
    }
}