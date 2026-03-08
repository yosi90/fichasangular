import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { Tamano } from "../interfaces/tamaño";

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

    constructor(private db: Database, private http: HttpClient) { }

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

            unsubscribe = onValue(dbRef, onNext, onError);
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
                tamanos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(tamanos);
            };

            const onError = (error: any) => observador.error(error);

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncTamanos() {
        return this.http.get(`${environment.apiUrl}tamanos`);
    }

    public async RenovarTamanos(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncTamanos());
            const tamanos = toArray(response)
                .map((raw: any) => normalizeTamano(raw))
                .filter((tamano) => tamano.Id > 0);

            await Promise.all(
                tamanos.map((tamano) => set(ref(dbInstance, `Tamanos/${tamano.Id}`), tamano))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de tamaños actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de tamaños no disponible",
                    text: "No se encontro /tamanos en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de tamaños",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
