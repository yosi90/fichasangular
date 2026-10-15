import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { PabellonDetalle } from "../interfaces/pabellon";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: any, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

export function normalizePabellon(raw: any): PabellonDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class PabellonService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getPabellon(id: number): Observable<PabellonDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Pabellones/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizePabellon(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}pabellones/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizePabellon(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Pabellon no encontrado",
                                text: `No existe el pabellon con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el pabellon",
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

    getPabellones(): Observable<PabellonDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Pabellones");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const pabellones: PabellonDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const pabellon = normalizePabellon(obj.val());
                    if (pabellon.Id > 0)
                        pabellones.push(pabellon);
                });
                pabellones.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(pabellones);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
