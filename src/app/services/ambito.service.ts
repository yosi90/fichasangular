import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";

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

    constructor(private db: Database, private http: HttpClient) { }

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

            unsubscribe = onValue(dbRef, onNext, onError);
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

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncAmbitos() {
        return this.http.get(`${environment.apiUrl}ambitos`);
    }

    public async RenovarAmbitos(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncAmbitos());
            const ambitos = toArray(response)
                .map((raw: any) => normalizeAmbito(raw))
                .filter((ambito) => ambito.Id > 0);

            await Promise.all(
                ambitos.map((ambito) => set(ref(dbInstance, `Ambitos/${ambito.Id}`), ambito))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de ambitos actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de ambitos no disponible",
                    text: "No se encontro /ambitos en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de ambitos",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}

