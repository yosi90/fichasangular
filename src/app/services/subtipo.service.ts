import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { SubtipoDetalle, SubtipoResumen } from "../interfaces/subtipo";
import { normalizeSubtipoDetalle, normalizeSubtipoResumen } from "./utils/subtipo-mapper";

function toArray<T = any>(raw: any): T[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw) as T[];
    return [];
}

@Injectable({
    providedIn: "root"
})
export class SubtipoService {

    constructor(private db: Database, private http: HttpClient) { }

    getSubtipos(): Observable<SubtipoResumen[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Subtipos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const subtipos: SubtipoResumen[] = [];
                snapshot.forEach((obj: any) => {
                    const subtipo = normalizeSubtipoResumen(obj.val());
                    if (subtipo.Id > 0)
                        subtipos.push(subtipo);
                });
                subtipos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(subtipos);
            };

            const onError = (error: any) => observador.error(error);
            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    getSubtipo(id: number): Observable<SubtipoDetalle> {
        return new Observable((observador) => {
            const subtipoId = Number(id);
            if (!Number.isFinite(subtipoId) || subtipoId <= 0) {
                observador.error(new Error("Id de subtipo invalido"));
                return;
            }

            const dbRef = ref(this.db, `Subtipos/${subtipoId}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    const raw = snapshot.val();
                    // Si el cache solo tiene resumen, se pide detalle remoto.
                    if (raw && typeof raw === "object" && raw.Habilidades && raw.Movimientos) {
                        observador.next(normalizeSubtipoDetalle(raw));
                        return;
                    }
                }

                this.http.get(`${environment.apiUrl}subtipos/${subtipoId}`).subscribe({
                    next: async (raw: any) => {
                        const detalle = normalizeSubtipoDetalle(raw);
                        try {
                            await set(ref(this.db, `Subtipos/${detalle.Id}`), detalle);
                        } catch {
                            // Si falla el cacheado no bloqueamos la apertura del detalle.
                        }
                        observador.next(detalle);
                    },
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Subtipo no encontrado",
                                text: `No existe el subtipo con id ${subtipoId}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el subtipo",
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

    buscarPorNombre(nombre: string): Observable<SubtipoResumen | null> {
        const objetivo = this.normalizar(nombre);
        return this.getSubtipos().pipe(
            map((subtipos) => subtipos.find((s) => this.normalizar(s.Nombre) === objetivo) ?? null)
        );
    }

    private syncSubtipos(): Observable<any> {
        return this.http.get(`${environment.apiUrl}subtipos`);
    }

    public async RenovarSubtipos(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncSubtipos());
            const subtipos = toArray(response)
                .map((raw: any) => normalizeSubtipoResumen(raw))
                .filter((subtipo) => subtipo.Id > 0);

            await Promise.all(
                subtipos.map((subtipo) => set(ref(dbInstance, `Subtipos/${subtipo.Id}`), subtipo))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de subtipos actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de subtipos no disponible",
                    text: "No se encontro /subtipos en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de subtipos",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    private normalizar(value: string): string {
        return (value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }
}
