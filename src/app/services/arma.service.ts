import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ArmaDetalle } from "../interfaces/arma";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeArma(raw: any): ArmaDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualApi(raw?.Manual),
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
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Armas/${id}`),
            desdeCache: (snapshot) => normalizeArma(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}armas/${id}`),
            desdeApi: (raw) => normalizeArma(raw),
            avisos: {
                noEncontrado: { titulo: "Arma no encontrada", texto: `No existe el arma con id ${id}` },
                error: "Error al obtener el arma",
            },
        });
    }

    getArmas(): Observable<ArmaDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Armas"),
            (valor) => normalizeArma(valor),
            (arma) => arma.Id > 0,
        );
    }

}
