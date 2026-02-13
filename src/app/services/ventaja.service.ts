import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { VentajaDetalle } from "../interfaces/ventaja";

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
        const extraida = extractArrayFromResponse<T>(value);
        if (extraida.length > 0)
            return extraida;
    }
    if (value && typeof value === "object")
        return Object.values(value).filter(v => typeof v === "object") as T[];
    return [];
}

function pickValue(raw: any, keys: string[]): any {
    if (!raw || typeof raw !== "object")
        return undefined;

    for (const key of keys) {
        if (raw[key] !== undefined)
            return raw[key];
    }

    const lowerMap = new Map<string, any>();
    Object.keys(raw).forEach((k) => lowerMap.set(k.toLowerCase(), raw[k]));
    for (const key of keys) {
        const value = lowerMap.get(key.toLowerCase());
        if (value !== undefined)
            return value;
    }

    return undefined;
}

function extractArrayFromResponse<T = any>(raw: any): T[] {
    if (!raw || typeof raw !== "object")
        return [];

    const keysPrioritarias = [
        "data",
        "items",
        "rows",
        "recordset",
        "result",
        "resultado",
        "ventajas",
        "desventajas",
    ];
    for (const key of keysPrioritarias) {
        const value = pickValue(raw, [key]);
        if (Array.isArray(value))
            return value;
    }

    for (const value of Object.values(raw)) {
        if (Array.isArray(value))
            return value as T[];
    }

    return [];
}

function removeUndefinedDeep<T>(value: T): T {
    if (Array.isArray(value))
        return value.map((item) => removeUndefinedDeep(item)) as T;

    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, any>)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, removeUndefinedDeep(v)]);
        return Object.fromEntries(entries) as T;
    }

    return value;
}

export function normalizeVentaja(raw: any): VentajaDetalle {
    const manualRaw = pickValue(raw, ["Manual", "manual"]) ?? {};
    const rasgoRaw = pickValue(raw, ["Rasgo", "rasgo"]) ?? {};
    const idiomaRaw = pickValue(raw, ["Idioma", "idioma"]) ?? {};
    const habilidadRaw = pickValue(raw, ["Habilidad", "habilidad"]) ?? {};

    return {
        Id: toNumber(pickValue(raw, ["Id", "id", "ID"])),
        Nombre: toText(pickValue(raw, ["Nombre", "nombre"])),
        Descripcion: toText(pickValue(raw, ["Descripcion", "descripcion"])),
        Disipable: toBoolean(pickValue(raw, ["Disipable", "disipable"])),
        Coste: toNumber(pickValue(raw, ["Coste", "coste"])),
        Mejora: toNumber(pickValue(raw, ["Mejora", "mejora"])),
        Caracteristica: toBoolean(pickValue(raw, ["Caracteristica", "caracteristica"])),
        Fuerza: toBoolean(pickValue(raw, ["Fuerza", "fuerza"])),
        Destreza: toBoolean(pickValue(raw, ["Destreza", "destreza"])),
        Constitucion: toBoolean(pickValue(raw, ["Constitucion", "constitucion"])),
        Inteligencia: toBoolean(pickValue(raw, ["Inteligencia", "inteligencia"])),
        Sabiduria: toBoolean(pickValue(raw, ["Sabiduria", "sabiduria"])),
        Carisma: toBoolean(pickValue(raw, ["Carisma", "carisma"])),
        Fortaleza: toBoolean(pickValue(raw, ["Fortaleza", "fortaleza"])),
        Reflejos: toBoolean(pickValue(raw, ["Reflejos", "reflejos"])),
        Voluntad: toBoolean(pickValue(raw, ["Voluntad", "voluntad"])),
        Iniciativa: toBoolean(pickValue(raw, ["Iniciativa", "iniciativa"])),
        Duplica_oro: toBoolean(pickValue(raw, ["Duplica_oro", "duplica_oro", "DuplicaOro", "duplicaOro"])),
        Aumenta_oro: toBoolean(pickValue(raw, ["Aumenta_oro", "aumenta_oro", "AumentaOro", "aumentaOro"])),
        Idioma_extra: toBoolean(pickValue(raw, ["Idioma_extra", "idioma_extra", "IdiomaExtra", "idiomaExtra"])),
        Manual: {
            Id: toNumber(pickValue(manualRaw, ["Id", "id"])),
            Nombre: toText(pickValue(manualRaw, ["Nombre", "nombre"])),
            Pagina: toNumber(pickValue(manualRaw, ["Pagina", "pagina"])),
        },
        Rasgo: {
            Id: toNumber(pickValue(rasgoRaw, ["Id", "id"])),
            Nombre: toText(pickValue(rasgoRaw, ["Nombre", "nombre"])),
            Descripcion: toText(pickValue(rasgoRaw, ["Descripcion", "descripcion"])),
        },
        Idioma: {
            Id: toNumber(pickValue(idiomaRaw, ["Id", "id"])),
            Nombre: toText(pickValue(idiomaRaw, ["Nombre", "nombre"])),
            Descripcion: toText(pickValue(idiomaRaw, ["Descripcion", "descripcion"])),
        },
        Habilidad: {
            Id: toNumber(pickValue(habilidadRaw, ["Id", "id"])),
            Nombre: toText(pickValue(habilidadRaw, ["Nombre", "nombre"])),
            Descripcion: toText(pickValue(habilidadRaw, ["Descripcion", "descripcion"])),
        },
        Oficial: false,
    };
}

@Injectable({
    providedIn: "root"
})
export class VentajaService {

    constructor(private db: Database, private http: HttpClient) { }

    getVentajas(): Observable<VentajaDetalle[]> {
        return this.getColeccion("Ventajas");
    }

    getDesventajas(): Observable<VentajaDetalle[]> {
        return this.getColeccion("Desventajas");
    }

    private getColeccion(path: string): Observable<VentajaDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, path);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const ventajas: VentajaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const ventaja = normalizeVentaja(obj.val());
                    if (ventaja.Id > 0)
                        ventajas.push(ventaja);
                });
                ventajas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(ventajas);
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

    private syncVentajas() {
        return this.http.get(`${environment.apiUrl}ventajas`);
    }

    private syncDesventajas() {
        return this.http.get(`${environment.apiUrl}desventajas`);
    }

    public async RenovarVentajasYDesventajas(): Promise<boolean> {
        let resVentajas: any;
        try {
            resVentajas = await firstValueFrom(this.syncVentajas());
        } catch (error: any) {
            this.handleError(error, "ventajas");
            return false;
        }

        let totalVentajas = 0;
        try {
            totalVentajas = await this.persistirColeccion("Ventajas", resVentajas);
        } catch (error: any) {
            this.handlePersistError(error, "Ventajas");
            return false;
        }

        let resDesventajas: any;
        try {
            resDesventajas = await firstValueFrom(this.syncDesventajas());
        } catch (error: any) {
            this.handleError(error, "desventajas");
            return false;
        }

        let totalDesventajas = 0;
        try {
            totalDesventajas = await this.persistirColeccion("Desventajas", resDesventajas);
        } catch (error: any) {
            this.handlePersistError(error, "Desventajas");
            return false;
        }

        if (totalVentajas < 1 && totalDesventajas < 1) {
            Swal.fire({
                icon: "warning",
                title: "No se encontraron registros válidos",
                text: "La API respondió, pero no se detectaron ventajas/desventajas con Id válido para guardar en Firebase.",
                showConfirmButton: true
            });
            return false;
        }

        Swal.fire({
            icon: "success",
            title: `Ventajas/Desventajas actualizadas (${totalVentajas}/${totalDesventajas})`,
            showConfirmButton: true,
            timer: 2000
        });
        return true;
    }

    private async persistirColeccion(path: "Ventajas" | "Desventajas", response: any): Promise<number> {
        const coleccion = toArray<any>(response);
        const normalizadas = coleccion
            .map((raw) => normalizeVentaja(raw))
            .filter((item) => item.Id > 0);

        await Promise.all(
            normalizadas.map((item) => {
                const safeValue = removeUndefinedDeep(item);
                return set(ref(this.db, `${path}/${item.Id}`), safeValue);
            })
        );

        return normalizadas.length;
    }

    private handlePersistError(error: any, path: "Ventajas" | "Desventajas") {
        Swal.fire({
            icon: "warning",
            title: `Error guardando ${path} en Firebase`,
            text: error?.message ?? "Error no identificado al persistir datos",
            showConfirmButton: true
        });
    }

    private handleError(error: any, tipo: "ventajas" | "desventajas") {
        const httpError = error as HttpErrorResponse;
        if (httpError.status === 404) {
            Swal.fire({
                icon: "warning",
                title: `Endpoint de ${tipo} no disponible`,
                text: `No se encontro /${tipo} en la API`,
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
