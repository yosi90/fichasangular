import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { ArmaduraDetalle } from "../interfaces/armadura";

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: any, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

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

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

export function normalizeArmadura(raw: any): ArmaduraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: {
            Id: toNumber(raw?.Manual?.Id),
            Nombre: toText(raw?.Manual?.Nombre),
            Pagina: toNumber(raw?.Manual?.Pagina),
        },
        Ca: toNumber(raw?.Ca),
        Bon_des: toNumber(raw?.Bon_des),
        Penalizador: toNumber(raw?.Penalizador),
        Tipo_armadura: {
            Id: toNumber(raw?.Tipo_armadura?.Id),
            Nombre: toText(raw?.Tipo_armadura?.Nombre),
        },
        Precio: toNumber(raw?.Precio),
        Material: {
            Id: toNumber(raw?.Material?.Id),
            Nombre: toText(raw?.Material?.Nombre),
        },
        Peso_armadura: {
            Id: toNumber(raw?.Peso_armadura?.Id),
            Nombre: toText(raw?.Peso_armadura?.Nombre),
        },
        Peso: toNumber(raw?.Peso),
        Tamano: {
            Id: toNumber(raw?.Tamano?.Id),
            Nombre: toText(raw?.Tamano?.Nombre),
        },
        Fallo_arcano: toNumber(raw?.Fallo_arcano),
        Es_escudo: toBoolean(raw?.Es_escudo),
        Oficial: toBoolean(raw?.Oficial),
        Encantamientos: toArray(raw?.Encantamientos).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Modificador: toNumber(item?.Modificador),
            Coste: toNumber(item?.Coste),
            Tipo: toNumber(item?.Tipo),
        })),
    };
}

@Injectable({
    providedIn: "root"
})
export class ArmaduraService {

    constructor(private db: Database, private http: HttpClient) { }

    getArmadura(id: number): Observable<ArmaduraDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Armaduras/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeArmadura(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}armaduras/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeArmadura(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Armadura no encontrada",
                                text: `No existe la armadura con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la armadura",
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

    getArmaduras(): Observable<ArmaduraDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Armaduras");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const armaduras: ArmaduraDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const armadura = normalizeArmadura(obj.val());
                    if (armadura.Id > 0)
                        armaduras.push(armadura);
                });
                armaduras.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(armaduras);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncArmaduras() {
        return this.http.get(`${environment.apiUrl}armaduras`);
    }

    public async RenovarArmaduras(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncArmaduras());
            const armaduras = toArray(response)
                .map((raw: any) => normalizeArmadura(raw))
                .filter((armadura) => armadura.Id > 0);

            await Promise.all(
                armaduras.map((armadura) => set(ref(dbInstance, `Armaduras/${armadura.Id}`), armadura))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de armaduras actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de armaduras no disponible",
                    text: "No se encontro /armaduras en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de armaduras",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
