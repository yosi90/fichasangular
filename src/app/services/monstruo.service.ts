import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from "../interfaces/monstruo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import {
    normalizeCompaneroMonstruoDetalle,
    normalizeFamiliarMonstruoDetalle,
    normalizeMonstruoDetalle,
} from "./utils/monstruo-mapper";
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

@Injectable({
    providedIn: "root"
})
export class MonstruoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getMonstruo(id: number): Observable<MonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Monstruos/${id}`),
            desdeCache: (snapshot) => normalizeMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}monstruos/${id}`),
            desdeApi: (raw) => normalizeMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Monstruo no encontrado", texto: `No existe el monstruo con id ${id}` },
                error: "Error al obtener el monstruo",
            },
        });
    }

    getMonstruos(): Observable<MonstruoDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Monstruos"),
            (valor) => normalizeMonstruoDetalle(valor, 1),
            (monstruo) => monstruo.Id > 0,
        );
    }

    getFamiliar(idFamiliar: number): Observable<FamiliarMonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Familiares/${idFamiliar}`),
            desdeCache: (snapshot) => normalizeFamiliarMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}familiares/${idFamiliar}`),
            desdeApi: (raw) => normalizeFamiliarMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Familiar no encontrado", texto: `No existe el familiar con id ${idFamiliar}` },
                error: "Error al obtener el familiar",
            },
        });
    }

    getFamiliares(): Observable<FamiliarMonstruoDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Familiares"),
            (valor) => normalizeFamiliarMonstruoDetalle(valor, 1),
            (familiar) => familiar.Id_familiar > 0,
        );
    }

    getCompanero(idCompanero: number): Observable<CompaneroMonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Companeros/${idCompanero}`),
            desdeCache: (snapshot) => normalizeCompaneroMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}companeros/${idCompanero}`),
            desdeApi: (raw) => normalizeCompaneroMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Compañero animal no encontrado", texto: `No existe el compañero animal con id ${idCompanero}` },
                error: "Error al obtener el compañero animal",
            },
        });
    }

    getCompaneros(): Observable<CompaneroMonstruoDetalle[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Companeros"),
            (valor) => normalizeCompaneroMonstruoDetalle(valor, 1),
            (companero) => companero.Id_companero > 0,
        );
    }

}
