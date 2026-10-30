import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from '@angular/fire/database';
import { Observable } from "rxjs";
import { EscuelaConjuros } from "../interfaces/escuela-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean, toInt, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdb, listaRtdb } from './catalogo-api';
import { oficialDeEscuela } from './utils/conjuro-mapper';

export function normalizeEscuela(raw: any, fallbackId: number = 0): EscuelaConjuros {
    return {
        Id: toInt(raw?.Id, fallbackId),
        Nombre: toText(raw?.Nombre).trim(),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.Nombre_especial).trim(),
        Prohibible: toBoolean(raw?.Prohibible),
        Especializable: toBoolean(raw?.Especializable),
        Prohibidas_al_especializarse: Math.max(0, toInt(raw?.Prohibidas_al_especializarse)),
        Oficial: oficialDeEscuela(raw),
    };
}

@Injectable({
    providedIn: 'root'
})
export class EscuelaConjurosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEscuela(id: number): Observable<EscuelaConjuros> {
        return new Observable((observador) => escucharRtdb(this.db, this.firebaseContextSvc, `Escuelas/${id}`)(
            (snapshot) => observador.next(normalizeEscuela(snapshot.val(), id)),
            (error) => observador.error(error),
        ));
    }

    getEscuelas(): Observable<EscuelaConjuros[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, 'Escuelas'),
            (raw) => normalizeEscuela(raw),
            () => true,
            () => 0, // Sin ordenar: en el orden de la caché.
        );
    }

}
