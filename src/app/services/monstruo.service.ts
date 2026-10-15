import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from "../interfaces/monstruo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import {
    normalizeCompaneroMonstruoDetalle,
    normalizeFamiliarMonstruoDetalle,
    normalizeMonstruoDetalle,
} from "./utils/monstruo-mapper";

@Injectable({
    providedIn: "root"
})
export class MonstruoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
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
                                title: "Compañero animal no encontrado",
                                text: `No existe el compañero animal con id ${idCompanero}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el compañero animal",
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
