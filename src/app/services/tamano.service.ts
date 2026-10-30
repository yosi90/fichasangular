import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { Tamano } from "../interfaces/tamaño";
import { FilaCapacidadCarga } from "./utils/capacidad-carga";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeTamano(raw: any): Tamano {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Modificador: toNumber(raw?.Modificador),
        Modificador_presa: toNumber(raw?.Modificador_presa),
        Modificador_esconderse: toNumberOrNull(raw?.Modificador_esconderse),
        Multiplicador_carga: toNumberOrNull(raw?.Multiplicador_carga),
        Multiplicador_carga_cuadrupedo: toNumberOrNull(raw?.Multiplicador_carga_cuadrupedo),
        Espacio: toNumberOrNull(raw?.Espacio),
        Alcance: toNumberOrNull(raw?.Alcance),
        Alcance_largo: toNumberOrNull(raw?.Alcance_largo),
    };
}

export function normalizeFilaCapacidadCarga(raw: any): FilaCapacidadCarga {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Ligera: toNumber(raw?.Ligera),
        Media: toNumber(raw?.Media),
        Pesada: toNumber(raw?.Pesada),
    };
}

@Injectable({
    providedIn: "root"
})
export class TamanoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getTamano(id: number): Observable<Tamano> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Tamanos/${id}`),
            desdeCache: (snapshot) => normalizeTamano(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}tamanos/${id}`),
            desdeApi: (raw) => normalizeTamano(raw),
            avisos: {
                noEncontrado: { titulo: "Tamaño no encontrado", texto: `No existe el tamaño con id ${id}` },
                error: "Error al obtener el tamaño",
            },
        });
    }

    /** La tabla 9-1 del Manual del jugador por Fuerza (`CapacidadesCarga` de la caché o `GET /capacidades-carga`). */
    getCapacidadesCarga(): Observable<FilaCapacidadCarga[]> {
        const ordenar = (filas: FilaCapacidadCarga[]) => filas.filter((fila) => fila.Fuerza > 0).sort((a, b) => a.Fuerza - b.Fuerza);
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, "CapacidadesCarga"),
            desdeCache: (snapshot) => {
                const filas: FilaCapacidadCarga[] = [];
                snapshot.forEach((hijo: any) => {
                    filas.push(normalizeFilaCapacidadCarga(hijo.val()));
                });
                return ordenar(filas);
            },
            cacheIncompleta: (filas) => filas.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}capacidades-carga`),
            desdeApi: (raw) => ordenar(toArray(raw).map(normalizeFilaCapacidadCarga)),
        });
    }

    getTamanos(): Observable<Tamano[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Tamanos"),
            (valor) => normalizeTamano(valor),
            (tamano) => tamano.Id > 0,
            (a, b) => a.Id - b.Id,
        );
    }

}
