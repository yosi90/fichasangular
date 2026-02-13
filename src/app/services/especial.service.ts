import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    EspecialBonificadores,
    EspecialClaseDetalle,
    EspecialExtraRef,
    EspecialFlagsExtra,
    EspecialHabilidadRef,
    EspecialRefSimple
} from "../interfaces/especial";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toText(value: any, fallback: string = ""): string {
    return typeof value === "string" ? value : (value ?? fallback).toString();
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

function normalizeRefSimple(raw: any): EspecialRefSimple {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

function normalizeBonificadores(raw: any): EspecialBonificadores {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
        CA: toNumber(raw?.CA),
        Armadura_natural: toNumber(raw?.Armadura_natural),
        RD: toNumber(raw?.RD),
    };
}

function normalizeFlagsExtra(raw: any): EspecialFlagsExtra {
    return {
        No_aplica: toBoolean(raw?.No_aplica),
        Da_CA: toBoolean(raw?.Da_CA),
        Da_armadura_natural: toBoolean(raw?.Da_armadura_natural),
        Da_RD: toBoolean(raw?.Da_RD),
        Da_velocidad: toBoolean(raw?.Da_velocidad),
    };
}

function normalizeExtra(raw: any): EspecialExtraRef {
    return {
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Orden: toNumber(raw?.Orden),
    };
}

function normalizeHabilidad(raw: any): EspecialHabilidadRef {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Rangos: toNumber(raw?.Rangos),
    };
}

export function normalizeEspecial(raw: any): EspecialClaseDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Extra: toBoolean(raw?.Extra),
        Repetible: toBoolean(raw?.Repetible),
        Repite_mismo_extra: toBoolean(raw?.Repite_mismo_extra ?? raw?.Repetible_mismo_extra),
        Repite_combinacion: toBoolean(raw?.Repite_combinacion ?? raw?.Repetible_combinacion),
        Activa_extra: toBoolean(raw?.Activa_extra),
        Caracteristica: normalizeRefSimple(raw?.Caracteristica),
        Bonificadores: normalizeBonificadores(raw?.Bonificadores),
        Flags_extra: normalizeFlagsExtra(raw?.Flags_extra),
        Subtipo: normalizeRefSimple(raw?.Subtipo),
        Extras: toArray(raw?.Extras).map(normalizeExtra),
        Habilidades: toArray(raw?.Habilidades).map(normalizeHabilidad),
    };
}

@Injectable({
    providedIn: "root"
})
export class EspecialService {

    constructor(private db: Database, private http: HttpClient) { }

    getEspecial(id: number): Observable<EspecialClaseDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Especiales/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeEspecial(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}clases/habilidades/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeEspecial(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Especial no encontrado",
                                text: `No existe el especial con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el especial",
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

            return () => {
                unsubscribe();
            };
        });
    }

    getEspeciales(): Observable<EspecialClaseDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Especiales");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    const especiales: EspecialClaseDetalle[] = [];
                    snapshot.forEach((obj: any) => {
                        especiales.push(normalizeEspecial(obj.val()));
                    });
                    observador.next(especiales);
                    return;
                }

                this.http.get(`${environment.apiUrl}clases/habilidades`).subscribe({
                    next: (raw: any) => {
                        const especiales = toArray(raw).map(normalizeEspecial);
                        observador.next(especiales);
                    },
                    error: (error: any) => observador.error(error),
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncEspeciales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}clases/habilidades`);
    }

    public async RenovarEspeciales(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncEspeciales());
            await Promise.all(
                toArray(response).map((raw: any) => {
                    const especial = normalizeEspecial(raw);
                    return set(ref(dbInstance, `Especiales/${especial.Id}`), especial);
                })
            );

            Swal.fire({
                icon: "success",
                title: "Listado de especiales actualizado con éxito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de especiales no disponible",
                    text: "No se encontró /clases/habilidades en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de especiales",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
