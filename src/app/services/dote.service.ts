import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable } from "rxjs";
import { Dote } from "../interfaces/dote";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { normalizeDote } from "./utils/dote-mapper";

@Injectable({
    providedIn: "root"
})
export class DoteService {

    constructor(private db: Database, private http: HttpClient) { }

    getDote(id: number): Observable<Dote> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Dotes/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeDote(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}dotes/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeDote(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Dote no encontrada",
                                text: `No existe la dote con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la dote",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
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

    getDotes(): Observable<Dote[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Dotes");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dotes: Dote[] = [];
                snapshot.forEach((obj: any) => {
                    dotes.push(normalizeDote(obj.val()));
                });
                observador.next(dotes);
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

    private syncDotes(): Observable<any> {
        return this.http.get(`${environment.apiUrl}dotes`);
    }

    public async RenovarDotes() {
        const dbInstance = getDatabase();
        this.syncDotes().subscribe(
            response => {
                response.forEach((raw: any) => {
                    const dote = normalizeDote(raw);
                    set(ref(dbInstance, `Dotes/${dote.Id}`), dote);
                });
                Swal.fire({
                    icon: "success",
                    title: "Listado de dotes actualizado con éxito",
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                const httpError = error as HttpErrorResponse;
                if (httpError.status === 404) {
                    Swal.fire({
                        icon: "warning",
                        title: "Endpoint de dotes no disponible",
                        text: "No se encontró /dotes en la API",
                        showConfirmButton: true
                    });
                } else {
                    Swal.fire({
                        icon: "warning",
                        title: "Error al actualizar el listado de dotes",
                        text: error.message,
                        showConfirmButton: true
                    });
                }
            }
        );
    }
}
