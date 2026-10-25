import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ArmaDetalle } from "../interfaces/arma";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { normalizeEncantamientosDeCatalogo, normalizeEquipoRef, normalizeTextoEquipo } from 'src/app/services/utils/equipo-mapper';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

export function normalizeArma(raw: any): ArmaDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Manual: normalizeManualApi(raw?.Manual),
        Dano: toNullableText(raw?.Dano),
        Dano_pequeno: toNullableText(raw?.Dano_pequeno),
        Dano_mediano: toNullableText(raw?.Dano_mediano),
        Tipo_dano: normalizeEquipoRef(raw?.Tipo_dano) ?? { Id: 0, Nombre: '' },
        Tipo_arma: normalizeEquipoRef(raw?.Tipo_arma),
        Manejo: normalizeEquipoRef(raw?.Manejo),
        A_distancia: toBoolean(raw?.A_distancia),
        Arrojadiza: toBoolean(raw?.Arrojadiza),
        Doble: toBoolean(raw?.Doble),
        Alcance: toNumberOrNull(raw?.Alcance),
        Municion: normalizeEquipoRef(raw?.Municion),
        Precio: toNumber(raw?.Precio),
        Material: normalizeEquipoRef(raw?.Material),
        Tamano: normalizeEquipoRef(raw?.Tamano) ?? { Id: 0, Nombre: '' },
        Peso: toNumber(raw?.Peso),
        Critico: toNullableText(raw?.Critico),
        Critico_rango: toNumberOrNull(raw?.Critico_rango),
        Critico_multiplicador: toNumberOrNull(raw?.Critico_multiplicador),
        Critico_multiplicador_2: toNumberOrNull(raw?.Critico_multiplicador_2),
        Incremento_distancia: toNumber(raw?.Incremento_distancia),
        Indice_fuerza_coste: toNumberOrNull(raw?.Indice_fuerza_coste),
        Propiedades: toArray(raw?.Propiedades).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Valor: toNumberOrNull(item?.Valor),
        })),
        Oficial: toBoolean(raw?.Oficial),
        Encantamientos: normalizeEncantamientosDeCatalogo(raw?.Encantamientos),
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
