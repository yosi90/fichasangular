import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { RegionDetalle } from "../interfaces/region";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdb, listaRtdb } from './catalogo-api';

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
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Regiones"),
            (valor) => normalizeRegion(valor),
            (region) => region.Id > 0 && region.Nombre.trim().length > 0,
        );
    }

}
