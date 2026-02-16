import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { RacialDetalle } from "../interfaces/racial";
import { normalizeRacial, normalizeRaciales } from "./utils/racial-mapper";

function sortRaciales(raciales: RacialDetalle[]): RacialDetalle[] {
    return [...raciales]
        .sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
}

@Injectable({
    providedIn: "root"
})
export class RacialService {

    constructor(private db: Database, private http: HttpClient) { }

    getRacial(id: number): Observable<RacialDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Raciales/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeRacial(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}razas/raciales/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeRacial(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Racial no encontrada",
                                text: `No existe la racial con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la racial",
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

    getRaciales(): Observable<RacialDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Raciales");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    const raciales: RacialDetalle[] = [];
                    snapshot.forEach((obj: any) => {
                        raciales.push(normalizeRacial(obj.val()));
                    });
                    observador.next(sortRaciales(raciales));
                    return;
                }

                this.http.get(`${environment.apiUrl}razas/raciales`).subscribe({
                    next: (raw: any) => {
                        const raciales = normalizeRaciales(raw);
                        observador.next(sortRaciales(raciales));
                    },
                    error: (error: any) => observador.error(error),
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

    private syncRaciales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}razas/raciales`);
    }

    public async RenovarRaciales(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncRaciales());
            const raciales = normalizeRaciales(response);
            await Promise.all(
                raciales.map((racial) => {
                    return set(ref(dbInstance, `Raciales/${racial.Id}`), racial);
                })
            );

            Swal.fire({
                icon: "success",
                title: "Listado de raciales actualizado con éxito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de raciales no disponible",
                    text: "No se encontró /razas/raciales en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de raciales",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
