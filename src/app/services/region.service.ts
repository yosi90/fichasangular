import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { RegionDetalle } from "../interfaces/region";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';

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

}
