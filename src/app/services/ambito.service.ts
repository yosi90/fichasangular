import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';

export function normalizeAmbito(raw: any): AmbitoDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class AmbitoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getAmbito(id: number): Observable<AmbitoDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Ambitos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeAmbito(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}ambitos/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeAmbito(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Ambito no encontrado",
                                text: `No existe el ambito con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el ambito",
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getAmbitos(): Observable<AmbitoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Ambitos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const ambitos: AmbitoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const ambito = normalizeAmbito(obj.val());
                    if (ambito.Id > 0)
                        ambitos.push(ambito);
                });
                ambitos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(ambitos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
