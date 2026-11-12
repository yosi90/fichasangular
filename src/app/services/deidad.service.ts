import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { DeidadCuerpo, DeidadDetalle, DeidadGeneroRef } from "../interfaces/deidad";
import { EscrituraDeCatalogo, guardarEnCatalogo } from "./escritura-de-catalogo";
import { DEIDAD } from "./utils/nombres-de-catalogo";
import { EntradaGuardada } from "./utils/respuesta-de-escritura";
import { DominioDetalle } from "../interfaces/dominio";
import { normalizeAmbito } from "./ambito.service";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeDominio } from "./dominio.service";
import { normalizePabellon } from "./pabellon.service";
import { idNombres, toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

function normalizeAmbitos(raw: any): AmbitoDetalle[] {
    return toArray(raw)
        .map((item: any) => normalizeAmbito(item))
        .filter((item) => item.Id > 0 && item.Nombre.trim().length > 0);
}

function normalizeDominios(raw: any): DominioDetalle[] {
    return toArray(raw)
        .map((item: any) => normalizeDominio(item))
        .filter((item) => item.Id > 0 && item.Nombre.trim().length > 0);
}

export function normalizeDeidad(raw: any): DeidadDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualApi(raw?.Manual),
        Alineamiento: {
            Id: toNumber(raw?.Alineamiento?.Id),
            Id_basico: toNumber(raw?.Alineamiento?.Id_basico),
            Nombre: toText(raw?.Alineamiento?.Nombre),
        },
        Arma: {
            Id: toNumber(raw?.Arma?.Id),
            Nombre: toText(raw?.Arma?.Nombre),
        },
        Pabellon: normalizePabellon(raw?.Pabellon),
        Genero: {
            Id: toNumber(raw?.Genero?.Id),
            Nombre: toText(raw?.Genero?.Nombre),
        },
        Ambitos: normalizeAmbitos(raw?.Ambitos),
        Dominios: normalizeDominios(raw?.Dominios),
        Alineamientos_devotos: idNombres(raw?.Alineamientos_devotos),
        Oficial: toBoolean(raw?.Oficial),
    };
}

/** `{ message, idDeidad, deidad }`, la deidad como su `GET`. */
const ESCRITURA_DEIDAD: EscrituraDeCatalogo<DeidadDetalle> = {
    url: 'deidades', clave: 'deidad', claveId: 'idDeidad', normalizar: normalizeDeidad, nombre: DEIDAD,
};

@Injectable({
    providedIn: "root"
})
export class DeidadService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    /** La deidad por HTTP, sin caché: la que abre «Modificar deidad». */
    getDeidadFresca(id: number): Observable<DeidadDetalle> {
        return this.http.get(`${environment.apiUrl}deidades/${Math.trunc(Number(id))}`)
            .pipe(map((raw: any) => normalizeDeidad(raw)));
    }

    /** `POST /deidades/add`: permiso de creación `deidades`. */
    crearDeidad(cuerpo: DeidadCuerpo): Promise<EntradaGuardada<DeidadDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_DEIDAD, null, cuerpo);
    }

    /** `PUT /deidades/<id>`: la deidad entera, con el mismo cuerpo que el alta (el mismo permiso). */
    actualizarDeidad(id: number, cuerpo: DeidadCuerpo): Promise<EntradaGuardada<DeidadDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_DEIDAD, id, cuerpo);
    }

    /** El catálogo de géneros (`GET /generos`), el de las deidades y los personajes. */
    getGeneros(): Observable<DeidadGeneroRef[]> {
        return this.http.get<any[]>(`${environment.apiUrl}generos`)
            .pipe(map((listado) => idNombres(listado, { filtro: 'todos' })));
    }

    getDeidad(id: number): Observable<DeidadDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Deidades/${id}`),
            desdeCache: (snapshot) => normalizeDeidad(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}deidades/${id}`),
            desdeApi: (raw) => normalizeDeidad(raw),
            avisos: {
                noEncontrado: { titulo: "Deidad no encontrada", texto: `No existe la deidad con id ${id}` },
                error: "Error al obtener la deidad",
            },
        });
    }

    getDeidades(): Observable<DeidadDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Deidades"),
            (valor) => normalizeDeidad(valor),
        );
    }

    getDeidadesPorPabellon(idPabellon: number): Observable<DeidadDetalle[]> {
        return this.http.get<any[]>(`${environment.apiUrl}deidades/pabellon/${idPabellon}`)
            .pipe(map((listado) => toArray(listado).map((raw: any) => normalizeDeidad(raw))));
    }

    getDeidadesPorAlineamiento(idAlineamiento: number): Observable<DeidadDetalle[]> {
        return this.http.get<any[]>(`${environment.apiUrl}deidades/alineamiento/${idAlineamiento}`)
            .pipe(map((listado) => toArray(listado).map((raw: any) => normalizeDeidad(raw))));
    }

}
