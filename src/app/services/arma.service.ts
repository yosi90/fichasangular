import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { ArmaDetalle } from "../interfaces/arma";
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

export function normalizeArma(raw: any): ArmaDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: {
            Id: toNumber(raw?.Manual?.Id),
            Nombre: toText(raw?.Manual?.Nombre),
            Pagina: toNumber(raw?.Manual?.Pagina),
        },
        Dano: toText(raw?.Dano),
        Tipo_dano: {
            Id: toNumber(raw?.Tipo_dano?.Id),
            Nombre: toText(raw?.Tipo_dano?.Nombre),
        },
        Tipo_arma: {
            Id: toNumber(raw?.Tipo_arma?.Id),
            Nombre: toText(raw?.Tipo_arma?.Nombre),
        },
        Precio: toNumber(raw?.Precio),
        Material: {
            Id: toNumber(raw?.Material?.Id),
            Nombre: toText(raw?.Material?.Nombre),
        },
        Tamano: {
            Id: toNumber(raw?.Tamano?.Id),
            Nombre: toText(raw?.Tamano?.Nombre),
        },
        Peso: toNumber(raw?.Peso),
        Critico: toText(raw?.Critico),
        Incremento_distancia: toNumber(raw?.Incremento_distancia),
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
export class ArmaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getArma(id: number): Observable<ArmaDetalle> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Armas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeArma(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}armas/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeArma(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Arma no encontrada",
                                text: `No existe el arma con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el arma",
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

    getArmas(): Observable<ArmaDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Armas");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const armas: ArmaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const arma = normalizeArma(obj.val());
                    if (arma.Id > 0)
                        armas.push(arma);
                });
                armas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(armas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    private syncArmas() {
        return this.http.get(`${environment.apiUrl}armas`);
    }

    public async RenovarArmas(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncArmas());
            const armas = toArray(response)
                .map((raw: any) => normalizeArma(raw))
                .filter((arma) => arma.Id > 0);

            await Promise.all(
                armas.map((arma) => this.firebaseContextSvc.run(() => set(ref(this.db, `Armas/${arma.Id}`), arma)))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de armas actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de armas no disponible",
                    text: "No se encontro /armas en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de armas",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
