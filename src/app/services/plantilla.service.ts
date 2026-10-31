import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database } from "@angular/fire/database";
import { Observable, firstValueFrom, map } from "rxjs";
import { environment } from "src/environments/environment";
import { Plantilla, PlantillaCreateRequest, PlantillaMutacionResponse } from "../interfaces/plantilla";
import { cabeceraApiConFirebase } from "./platform-session.service";
import { errorDeCatalogo } from "./utils/error-catalogo";
import { PLANTILLA } from "./utils/nombres-de-catalogo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizePlantilla, normalizePlantillaApi } from "./utils/plantilla-mapper";
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

function hasValidId(raw: any): boolean {
    return toNumber(raw?.Id) > 0;
}

@Injectable({
    providedIn: "root"
})
export class PlantillaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    getPlantilla(id: number): Observable<Plantilla> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Plantillas/${id}`),
            desdeCache: (snapshot) => normalizePlantilla(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}plantillas/${id}`),
            desdeApi: (raw) => normalizePlantillaApi(raw),
            avisos: {
                noEncontrado: { titulo: "Plantilla no encontrada", texto: `No existe la plantilla con id ${id}` },
                error: "Error al obtener la plantilla",
            },
        });
    }

    getPlantillas(): Observable<Plantilla[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Plantillas"),
            (valor) => normalizePlantilla(valor),
            (plantilla) => hasValidId(plantilla),
        );
    }

    /** La plantilla recién leída de la API (`GET /plantillas/<id>`), sin pasar por la caché: la que se va a modificar. */
    getPlantillaFresca(id: number): Observable<Plantilla> {
        return this.http.get(`${environment.apiUrl}plantillas/${toInt(id)}`)
            .pipe(map((raw: any) => normalizePlantillaApi(raw)));
    }

    /** `POST /plantillas/add`. Las cachés de las plantillas las rehace el backend (quedan pendientes en el plugin de administración). */
    async crearPlantilla(payload: PlantillaCreateRequest): Promise<PlantillaMutacionResponse> {
        try {
            const headers = await this.cabeceras();
            const response = await firstValueFrom(this.http.post(`${environment.apiUrl}plantillas/add`, payload, { headers }));
            return this.leerMutacion(response, "Plantilla creada");
        } catch (error: unknown) {
            throw errorDeCatalogo(error, "crear", PLANTILLA);
        }
    }

    /**
     * `PUT /plantillas/<id>`: el mismo cuerpo que el alta, que **reemplaza la plantilla entera** (lo que no venga queda
     * vacío), así que se manda siempre el formulario completo. Los prerrequisitos van en el cuerpo (no hay `PATCH`).
     */
    async actualizarPlantilla(idPlantilla: number, payload: PlantillaCreateRequest): Promise<PlantillaMutacionResponse> {
        try {
            const headers = await this.cabeceras();
            const response = await firstValueFrom(this.http.put(`${environment.apiUrl}plantillas/${toInt(idPlantilla)}`, payload, { headers }));
            return this.leerMutacion(response, "Plantilla actualizada");
        } catch (error: unknown) {
            throw errorDeCatalogo(error, "actualizar", PLANTILLA);
        }
    }

    private cabeceras(): Promise<{ Authorization: string }> {
        return cabeceraApiConFirebase(this.auth, () => new Error("Debes iniciar sesión para gestionar plantillas"));
    }

    /** `PlantillaCreateResponse` (alta y modificación): `{ message, idPlantilla, plantilla }`. */
    private leerMutacion(response: any, mensajePorDefecto: string): PlantillaMutacionResponse {
        const idPlantilla = toInt(response?.idPlantilla);
        if (idPlantilla <= 0)
            throw new Error("La API no devolvió un id de plantilla válido.");
        return {
            message: `${response?.message ?? mensajePorDefecto}`,
            idPlantilla,
            plantilla: response?.plantilla ? normalizePlantillaApi(response.plantilla) : null,
        };
    }

    buscarPorNombre(nombre: string): Observable<Plantilla | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getPlantillas().pipe(
            map(plantillas => plantillas.find(p => normalizarTexto(p.Nombre) === objetivo) ?? null)
        );
    }

}
