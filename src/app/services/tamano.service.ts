import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { Tamano } from "../interfaces/tamaño";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';

export function normalizeTamano(raw: any): Tamano {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Modificador: toNumber(raw?.Modificador),
        Modificador_presa: toNumber(raw?.Modificador_presa),
    };
}

@Injectable({
    providedIn: "root"
})
export class TamanoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getTamano(id: number): Observable<Tamano> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Tamanos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeTamano(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}tamanos/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeTamano(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Tamaño no encontrado",
                                text: `No existe el tamaño con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el tamaño",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
            };

            const onError = (error: any) => observador.error(error);

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getTamanos(): Observable<Tamano[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Tamanos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const tamanos: Tamano[] = [];
                snapshot.forEach((obj: any) => {
                    const tamano = normalizeTamano(obj.val());
                    if (tamano.Id > 0)
                        tamanos.push(tamano);
                });
                tamanos.sort((a, b) => a.Id - b.Id);
                observador.next(tamanos);
            };

            const onError = (error: any) => observador.error(error);

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
