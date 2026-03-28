import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { RegionDetalle } from "../interfaces/region";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

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

function hasCanonicalRegionShape(raw: any): boolean {
    return !!raw
        && typeof raw === "object"
        && Object.prototype.hasOwnProperty.call(raw, "Id")
        && Object.prototype.hasOwnProperty.call(raw, "Nombre");
}

export function normalizeRegion(raw: any): RegionDetalle {
    if (!hasCanonicalRegionShape(raw)) {
        return {
            Id: 0,
            Nombre: "",
            Oficial: false,
        };
    }

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class RegionService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getRegiones(): Observable<RegionDetalle[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const regiones: RegionDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const region = normalizeRegion(obj.val());
                    if (region.Id > 0 && region.Nombre.trim().length > 0)
                        regiones.push(region);
                });

                regiones.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(regiones);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Regiones");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

    private syncRegiones() {
        return this.http.get(`${environment.apiUrl}regiones`);
    }

    public async RenovarRegiones(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncRegiones());
            const regiones = toArray(response)
                .map((raw: any) => normalizeRegion(raw))
                .filter((region) => region.Id > 0 && region.Nombre.trim().length > 0);

            await Promise.all(
                regiones.map((region) => this.firebaseContextSvc.run(() => set(ref(this.db, `Regiones/${region.Id}`), region)))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de regiones actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de regiones no disponible",
                    text: "No se encontro /regiones en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de regiones",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
