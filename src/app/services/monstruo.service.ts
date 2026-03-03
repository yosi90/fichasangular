import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from "../interfaces/monstruo";
import {
    normalizeCompaneroMonstruoDetalle,
    normalizeCompaneroMonstruoDetalleArray,
    normalizeFamiliarMonstruoDetalle,
    normalizeFamiliarMonstruoDetalleArray,
    normalizeMonstruoDetalle,
    normalizeMonstruoDetalleArray
} from "./utils/monstruo-mapper";

@Injectable({
    providedIn: "root"
})
export class MonstruoService {

    constructor(private db: Database, private http: HttpClient) { }

    getMonstruo(id: number): Observable<MonstruoDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Monstruos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeMonstruoDetalle(snapshot.val(), 1));
                    return;
                }

                this.http.get(`${environment.apiUrl}monstruos/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeMonstruoDetalle(raw, 1)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Monstruo no encontrado",
                                text: `No existe el monstruo con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el monstruo",
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
            return () => unsubscribe();
        });
    }

    getMonstruos(): Observable<MonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Monstruos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const monstruos: MonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const monstruo = normalizeMonstruoDetalle(obj.val(), 1);
                    if (monstruo.Id > 0)
                        monstruos.push(monstruo);
                });
                monstruos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(monstruos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    getFamiliar(idFamiliar: number): Observable<FamiliarMonstruoDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Familiares/${idFamiliar}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeFamiliarMonstruoDetalle(snapshot.val(), 1));
                    return;
                }

                this.http.get(`${environment.apiUrl}familiares/${idFamiliar}`).subscribe({
                    next: (raw: any) => observador.next(normalizeFamiliarMonstruoDetalle(raw, 1)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Familiar no encontrado",
                                text: `No existe el familiar con id ${idFamiliar}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el familiar",
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
            return () => unsubscribe();
        });
    }

    getFamiliares(): Observable<FamiliarMonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Familiares");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const familiares: FamiliarMonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const familiar = normalizeFamiliarMonstruoDetalle(obj.val(), 1);
                    if (familiar.Id_familiar > 0)
                        familiares.push(familiar);
                });
                familiares.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(familiares);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    getCompanero(idCompanero: number): Observable<CompaneroMonstruoDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Companeros/${idCompanero}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeCompaneroMonstruoDetalle(snapshot.val(), 1));
                    return;
                }

                this.http.get(`${environment.apiUrl}companeros/${idCompanero}`).subscribe({
                    next: (raw: any) => observador.next(normalizeCompaneroMonstruoDetalle(raw, 1)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Companero animal no encontrado",
                                text: `No existe el companero animal con id ${idCompanero}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el companero animal",
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
            return () => unsubscribe();
        });
    }

    getCompaneros(): Observable<CompaneroMonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Companeros");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const companeros: CompaneroMonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const companero = normalizeCompaneroMonstruoDetalle(obj.val(), 1);
                    if (companero.Id_companero > 0)
                        companeros.push(companero);
                });
                companeros.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(companeros);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncMonstruos() {
        return this.http.get(`${environment.apiUrl}monstruos`);
    }

    private syncFamiliares() {
        return this.http.get(`${environment.apiUrl}familiares`);
    }

    private syncCompaneros() {
        return this.http.get(`${environment.apiUrl}companeros`);
    }

    public async RenovarMonstruos(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncMonstruos());
            const monstruos = normalizeMonstruoDetalleArray(response, 1);

            await Promise.all(
                monstruos.map((monstruo) => set(ref(dbInstance, `Monstruos/${monstruo.Id}`), monstruo))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de monstruos actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de monstruos no disponible",
                    text: "No se encontro /monstruos en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de monstruos",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    public async RenovarFamiliares(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncFamiliares());
            const familiares = normalizeFamiliarMonstruoDetalleArray(response, 1);

            await Promise.all(
                familiares.map((familiar) => set(ref(dbInstance, `Familiares/${familiar.Id_familiar}`), familiar))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de familiares actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de familiares no disponible",
                    text: "No se encontro /familiares en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de familiares",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    public async RenovarCompaneros(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncCompaneros());
            const companeros = normalizeCompaneroMonstruoDetalleArray(response, 1);

            await Promise.all(
                companeros.map((companero) => set(ref(dbInstance, `Companeros/${companero.Id_companero}`), companero))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de companeros animales actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de companeros no disponible",
                    text: "No se encontro /companeros en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de companeros animales",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
