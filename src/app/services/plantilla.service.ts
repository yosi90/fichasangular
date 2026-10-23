import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { Plantilla } from "../interfaces/plantilla";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizePlantilla, normalizePlantillaApi } from "./utils/plantilla-mapper";
import { normalizarTexto, toNumber } from 'src/app/services/utils/normalizacion';

function hasValidId(raw: any): boolean {
    return toNumber(raw?.Id) > 0;
}

@Injectable({
    providedIn: "root"
})
export class PlantillaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getPlantilla(id: number): Observable<Plantilla> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizePlantilla(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}plantillas/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizePlantillaApi(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Plantilla no encontrada",
                                text: `No existe la plantilla con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la plantilla",
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `Plantillas/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getPlantillas(): Observable<Plantilla[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const plantillas: Plantilla[] = [];
                snapshot.forEach((obj: any) => {
                    const plantilla = normalizePlantilla(obj.val());
                    if (hasValidId(plantilla))
                        plantillas.push(plantilla);
                });

                plantillas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(plantillas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Plantillas");
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    buscarPorNombre(nombre: string): Observable<Plantilla | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getPlantillas().pipe(
            map(plantillas => plantillas.find(p => normalizarTexto(p.Nombre) === objetivo) ?? null)
        );
    }

}
