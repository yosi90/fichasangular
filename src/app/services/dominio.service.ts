import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { DominioDetalle } from "../interfaces/dominio";

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value > 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "si" || normalized === "sí";
    }
    return false;
}

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

export function normalizeDominio(raw: any): DominioDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class DominioService {

    constructor(private db: Database, private http: HttpClient) { }

    getDominio(id: number): Observable<DominioDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Dominios/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeDominio(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}dominios/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeDominio(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Dominio no encontrado",
                                text: `No existe el dominio con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el dominio",
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

    getDominios(): Observable<DominioDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Dominios");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dominios: DominioDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const dominio = normalizeDominio(obj.val());
                    if (dominio.Id > 0)
                        dominios.push(dominio);
                });
                dominios.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(dominios);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncDominios() {
        return this.http.get(`${environment.apiUrl}dominios`);
    }

    public async RenovarDominios(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncDominios());
            const dominios = toArray(response)
                .map((raw: any) => normalizeDominio(raw))
                .filter((dominio) => dominio.Id > 0);

            await Promise.all(
                dominios.map((dominio) => set(ref(dbInstance, `Dominios/${dominio.Id}`), dominio))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de dominios actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de dominios no disponible",
                    text: "No se encontro /dominios en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de dominios",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}

