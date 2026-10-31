import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database } from "@angular/fire/database";
import { Observable, firstValueFrom, map } from "rxjs";
import { environment } from "src/environments/environment";
import {
    CompaneroMonstruoDetalle,
    FamiliarMonstruoDetalle,
    MonstruoCreateRequest,
    MonstruoDetalle,
    MonstruoMutacionResponse,
} from "../interfaces/monstruo";
import { cabeceraApiConFirebase } from "./platform-session.service";
import { errorDeCatalogo } from "./utils/error-catalogo";
import { MONSTRUO } from "./utils/nombres-de-catalogo";
import { toArray, toInt, toText } from "./utils/normalizacion";
import { leerRespuestaDeEscritura } from "./utils/respuesta-de-escritura";
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
        private auth?: Auth,
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

    /** El monstruo recién leído de la API (`GET /monstruos/<id>`), sin pasar por la caché: el que se va a modificar. */
    getMonstruoFresco(id: number): Observable<MonstruoDetalle> {
        return this.http.get(`${environment.apiUrl}monstruos/${toInt(id)}`)
            .pipe(map((raw) => normalizeMonstruoDetalle(raw, 1)));
    }

    /**
     * Las plantillas con las que un monstruo es familiar o compañero (`GET /monstruos/plantillas-familiar`: básica,
     * celestial, infernal…), para los niveles de clase de «Insertar/Modificar monstruo».
     */
    getPlantillasFamiliar(): Observable<{ Id: number; Nombre: string; }[]> {
        return this.http.get(`${environment.apiUrl}monstruos/plantillas-familiar`).pipe(
            map((raw) => toArray(raw)
                .map((item) => ({ Id: toInt(item?.Id), Nombre: toText(item?.Nombre) }))
                .filter((item) => item.Id > 0)),
        );
    }

    /** `POST /monstruos/add`. Las cachés las rehace el backend. */
    async crearMonstruo(payload: MonstruoCreateRequest): Promise<MonstruoMutacionResponse> {
        try {
            const headers = await this.cabeceras();
            const response = await firstValueFrom(this.http.post(`${environment.apiUrl}monstruos/add`, payload, { headers }));
            return this.leerMutacion(response, "Monstruo creado");
        } catch (error: unknown) {
            throw errorDeCatalogo(error, "crear", MONSTRUO);
        }
    }

    /**
     * `PUT /monstruos/<id>`: el mismo cuerpo que el alta, que **reemplaza el monstruo entero** (lo que no venga queda
     * vacío), así que se manda siempre el formulario completo.
     */
    async actualizarMonstruo(idMonstruo: number, payload: MonstruoCreateRequest): Promise<MonstruoMutacionResponse> {
        try {
            const headers = await this.cabeceras();
            const response = await firstValueFrom(this.http.put(`${environment.apiUrl}monstruos/${toInt(idMonstruo)}`, payload, { headers }));
            return this.leerMutacion(response, "Monstruo actualizado");
        } catch (error: unknown) {
            throw errorDeCatalogo(error, "actualizar", MONSTRUO);
        }
    }

    private cabeceras(): Promise<{ Authorization: string }> {
        return cabeceraApiConFirebase(this.auth, () => new Error("Debes iniciar sesión para gestionar monstruos"));
    }

    private leerMutacion(response: any, mensajePorDefecto: string): MonstruoMutacionResponse {
        const { message, id } = leerRespuestaDeEscritura(response, 'idMonstruo', mensajePorDefecto);
        return { message, idMonstruo: id, monstruo: response?.monstruo ? normalizeMonstruoDetalle(response.monstruo, 1) : null };
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
