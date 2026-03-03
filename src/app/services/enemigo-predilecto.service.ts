import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { EnemigoPredilectoDetalle } from "../interfaces/enemigo-predilecto-detalle";

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

export function normalizeEnemigoPredilecto(raw: any): EnemigoPredilectoDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class EnemigoPredilectoService {

    constructor(private db: Database, private http: HttpClient) { }

    getEnemigosPredilectos(): Observable<EnemigoPredilectoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "EnemigosPredilectos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const enemigos: EnemigoPredilectoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const enemigo = normalizeEnemigoPredilecto(obj.val());
                    if (enemigo.Id > 0 && enemigo.Nombre.trim().length > 0)
                        enemigos.push(enemigo);
                });

                enemigos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(enemigos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncEnemigosPredilectos() {
        return this.http.get(`${environment.apiUrl}enemigos-predilectos`);
    }

    public async RenovarEnemigosPredilectos(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncEnemigosPredilectos());
            const enemigos = toArray(response)
                .map((raw: any) => normalizeEnemigoPredilecto(raw))
                .filter((enemigo) => enemigo.Id > 0 && enemigo.Nombre.trim().length > 0);

            await Promise.all(
                enemigos.map((enemigo) => set(ref(dbInstance, `EnemigosPredilectos/${enemigo.Id}`), enemigo))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de enemigos predilectos actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de enemigos predilectos no disponible",
                    text: "No se encontro /enemigos-predilectos en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de enemigos predilectos",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
