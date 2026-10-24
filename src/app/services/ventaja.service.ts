import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { VentajaDetalle } from "../interfaces/ventaja";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';

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

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getVentajas(): Observable<VentajaDetalle[]> {
        return this.getColeccion("Ventajas");
    }

    getDesventajas(): Observable<VentajaDetalle[]> {
        return this.getColeccion("Desventajas");
    }

    private getColeccion(path: string): Observable<VentajaDetalle[]> {
        return new Observable((observador) => {
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, path);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

}
