import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { DeidadDetalle } from "../interfaces/deidad";
import { DominioDetalle } from "../interfaces/dominio";
import { normalizeAmbito } from "./ambito.service";
import { normalizeDominio } from "./dominio.service";
import { normalizePabellon } from "./pabellon.service";

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

function normalizeAmbitos(raw: any): AmbitoDetalle[] {
    return toArray(raw)
        .map((item: any) => normalizeAmbito(item))
        .filter((item) => item.Id > 0 && item.Nombre.trim().length > 0);
}

function normalizeDominios(raw: any): DominioDetalle[] {
    return toArray(raw)
        .map((item: any) => normalizeDominio(item))
        .filter((item) => item.Id > 0 && item.Nombre.trim().length > 0);
}

export function normalizeDeidad(raw: any): DeidadDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: {
            Id: toNumber(raw?.Manual?.Id),
            Nombre: toText(raw?.Manual?.Nombre),
            Pagina: toNumber(raw?.Manual?.Pagina),
        },
        Alineamiento: {
            Id: toNumber(raw?.Alineamiento?.Id),
            Id_basico: toNumber(raw?.Alineamiento?.Id_basico),
            Nombre: toText(raw?.Alineamiento?.Nombre),
        },
        Arma: {
            Id: toNumber(raw?.Arma?.Id),
            Nombre: toText(raw?.Arma?.Nombre),
        },
        Pabellon: normalizePabellon(raw?.Pabellon),
        Genero: {
            Id: toNumber(raw?.Genero?.Id),
            Nombre: toText(raw?.Genero?.Nombre),
        },
        Ambitos: normalizeAmbitos(raw?.Ambitos),
        Dominios: normalizeDominios(raw?.Dominios),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class DeidadService {

    constructor(private db: Database, private http: HttpClient) { }

    getDeidad(id: number): Observable<DeidadDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Deidades/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeDeidad(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}deidades/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeDeidad(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Deidad no encontrada",
                                text: `No existe la deidad con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la deidad",
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

    getDeidades(): Observable<DeidadDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Deidades");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const deidades: DeidadDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const deidad = normalizeDeidad(obj.val());
                    if (deidad.Id > 0)
                        deidades.push(deidad);
                });
                deidades.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(deidades);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    getDeidadesPorPabellon(idPabellon: number): Observable<DeidadDetalle[]> {
        return this.http.get<any[]>(`${environment.apiUrl}deidades/pabellon/${idPabellon}`)
            .pipe(map((listado) => toArray(listado).map((raw: any) => normalizeDeidad(raw))));
    }

    getDeidadesPorAlineamiento(idAlineamiento: number): Observable<DeidadDetalle[]> {
        return this.http.get<any[]>(`${environment.apiUrl}deidades/alineamiento/${idAlineamiento}`)
            .pipe(map((listado) => toArray(listado).map((raw: any) => normalizeDeidad(raw))));
    }

    private syncDeidades() {
        return this.http.get(`${environment.apiUrl}deidades`);
    }

    public async RenovarDeidades(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncDeidades());
            const deidades = toArray(response)
                .map((raw: any) => normalizeDeidad(raw))
                .filter((deidad) => deidad.Id > 0);

            await Promise.all(
                deidades.map((deidad) => set(ref(dbInstance, `Deidades/${deidad.Id}`), deidad))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de deidades actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de deidades no disponible",
                    text: "No se encontro /deidades en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de deidades",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
