import { Auth } from "@angular/fire/auth";
import { ArmaCuerpo } from "../interfaces/arma";
import { EscrituraDeCatalogo, guardarEnCatalogo } from "./escritura-de-catalogo";
import { ARMA } from "src/app/services/utils/nombres-de-catalogo";
import { EntradaGuardada } from "src/app/services/utils/respuesta-de-escritura";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { ArmaDetalle } from "../interfaces/arma";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { idNombre, toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { normalizeTextoEquipo } from 'src/app/services/utils/equipo-mapper';
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
        Tipo_dano: idNombre(raw?.Tipo_dano, { filtro: 'conIdONombre' }) ?? { Id: 0, Nombre: '' },
        Tipo_arma: idNombre(raw?.Tipo_arma, { filtro: 'conIdONombre' }),
        Manejo: idNombre(raw?.Manejo, { filtro: 'conIdONombre' }),
        A_distancia: toBoolean(raw?.A_distancia),
        Arrojadiza: toBoolean(raw?.Arrojadiza),
        Doble: toBoolean(raw?.Doble),
        Alcance: toNumberOrNull(raw?.Alcance),
        Municion: idNombre(raw?.Municion, { filtro: 'conIdONombre' }),
        Precio: toNumber(raw?.Precio),
        Material: idNombre(raw?.Material, { filtro: 'conIdONombre' }),
        Tamano: idNombre(raw?.Tamano, { filtro: 'conIdONombre' }) ?? { Id: 0, Nombre: '' },
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
        private auth?: Auth,
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


    /** El arma por HTTP, sin caché: la que abre «Modificar» (guía de modificaciones de catálogo). */
    getArmaFresca(id: number): Observable<ArmaDetalle> {
        return this.http.get(`${environment.apiUrl}armas/${Math.trunc(Number(id))}`).pipe(map((raw: any) => normalizeArma(raw)));
    }

    /** `POST /armas/add`: permiso de creación `armas`. */
    crearArma(cuerpo: ArmaCuerpo): Promise<EntradaGuardada<ArmaDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_ARMA, null, cuerpo);
    }

    /** `PUT /armas/<id>`: el arma entera, con el mismo cuerpo que el alta (el mismo permiso). */
    actualizarArma(id: number, cuerpo: ArmaCuerpo): Promise<EntradaGuardada<ArmaDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_ARMA, id, cuerpo);
    }
}

const ESCRITURA_ARMA: EscrituraDeCatalogo<ArmaDetalle> = {
    url: 'armas', clave: 'arma', claveId: 'idArma', normalizar: normalizeArma, nombre: ARMA,
};
