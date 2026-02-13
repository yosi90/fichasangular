import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { HabilidadBasicaDetalle, HabilidadExtraRef } from "../interfaces/habilidad";

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
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
    if (value && typeof value === "object") {
        const envoltorios = ["data", "items", "rows", "recordset", "result", "resultado", "habilidades"];
        for (const key of envoltorios) {
            const v = (value as Record<string, any>)[key];
            if (Array.isArray(v))
                return v as T[];
        }
        return Object.values(value).filter(v => typeof v === "object") as T[];
    }
    return [];
}

function normalizeExtra(raw: any): HabilidadExtraRef {
    return {
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Descripcion: toText(raw?.Descripcion),
    };
}

export function normalizeHabilidadBasica(raw: any): HabilidadBasicaDetalle {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Nombre: toText(raw?.Nombre),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Descripcion: toText(raw?.Descripcion),
        Soporta_extra: toBoolean(raw?.Soporta_extra),
        Entrenada: toBoolean(raw?.Entrenada),
        Extras: toArray(raw?.Extras).map(normalizeExtra),
    };
}

@Injectable({
    providedIn: "root"
})
export class HabilidadService {

    constructor(private db: Database, private http: HttpClient) { }

    getHabilidades(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("Habilidades");
    }

    getHabilidadesCustom(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("HabilidadesCustom");
    }

    private getColeccion(path: string): Observable<HabilidadBasicaDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, path);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const habilidades: HabilidadBasicaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const habilidad = normalizeHabilidadBasica(obj.val());
                    if (habilidad.Id_habilidad > 0)
                        habilidades.push(habilidad);
                });

                habilidades.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(habilidades);
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

    private syncHabilidades() {
        return this.http.get(`${environment.apiUrl}habilidades`);
    }

    private syncHabilidadesCustom() {
        return this.http.get(`${environment.apiUrl}habilidades/custom`);
    }

    public async RenovarHabilidades(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncHabilidades());
            const total = await this.persistirHabilidades("Habilidades", response);
            Swal.fire({
                icon: "success",
                title: `Listado de habilidades actualizado (${total})`,
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            this.handleError(error, "habilidades");
            return false;
        }
    }

    public async RenovarHabilidadesCustom(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncHabilidadesCustom());
            const total = await this.persistirHabilidades("HabilidadesCustom", response);
            Swal.fire({
                icon: "success",
                title: `Listado de habilidades custom actualizado (${total})`,
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            this.handleError(error, "habilidades custom");
            return false;
        }
    }

    public async RenovarHabilidadesYCustom(): Promise<boolean> {
        const okHabilidades = await this.RenovarHabilidades();
        const okCustom = await this.RenovarHabilidadesCustom();
        return okHabilidades && okCustom;
    }

    private async persistirHabilidades(path: "Habilidades" | "HabilidadesCustom", response: any): Promise<number> {
        const dbInstance = getDatabase();
        const habilidades = toArray(response)
            .map((raw: any) => normalizeHabilidadBasica(raw))
            .filter((h) => h.Id_habilidad > 0);

        await Promise.all(
            habilidades.map((h) => set(ref(dbInstance, `${path}/${h.Id_habilidad}`), h))
        );

        return habilidades.length;
    }

    private handleError(error: any, tipo: "habilidades" | "habilidades custom") {
        const httpError = error as HttpErrorResponse;
        if (httpError.status === 404) {
            Swal.fire({
                icon: "warning",
                title: `Endpoint de ${tipo} no disponible`,
                text: `No se encontro /${tipo === "habilidades" ? "habilidades" : "habilidades/custom"} en la API`,
                showConfirmButton: true
            });
            return;
        }

        Swal.fire({
            icon: "warning",
            title: `Error al actualizar el listado de ${tipo}`,
            text: error?.message ?? "Error no identificado",
            showConfirmButton: true
        });
    }
}
