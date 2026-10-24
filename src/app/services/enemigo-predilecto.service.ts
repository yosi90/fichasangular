import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { EnemigoPredilectoDetalle } from "../interfaces/enemigo-predilecto-detalle";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toNumber, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdb, listaRtdb } from './catalogo-api';

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

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEnemigosPredilectos(): Observable<EnemigoPredilectoDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "EnemigosPredilectos"),
            (valor) => normalizeEnemigoPredilecto(valor),
            (enemigo) => enemigo.Id > 0 && enemigo.Nombre.trim().length > 0,
        );
    }

}
