import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database } from "@angular/fire/database";
import { Observable, map, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { SubtipoCuerpo, SubtipoDetalle, SubtipoResumen } from "../interfaces/subtipo";
import { EscrituraDeCatalogo, guardarEnCatalogo } from "./escritura-de-catalogo";
import { SUBTIPO } from "./utils/nombres-de-catalogo";
import { EntradaGuardada } from "./utils/respuesta-de-escritura";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeSubtipoDetalle, normalizeSubtipoResumen } from "./utils/subtipo-mapper";
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';

/** `{ message, idSubtipo, subtipo }`, el subtipo como su `GET`. */
const ESCRITURA_SUBTIPO: EscrituraDeCatalogo<SubtipoDetalle> = {
    url: 'subtipos', clave: 'subtipo', claveId: 'idSubtipo', normalizar: normalizeSubtipoDetalle, nombre: SUBTIPO,
};

@Injectable({
    providedIn: "root"
})
export class SubtipoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    /** El subtipo por HTTP, sin caché: el que abre «Modificar subtipo». */
    getSubtipoFresco(id: number): Observable<SubtipoDetalle> {
        return this.http.get(`${environment.apiUrl}subtipos/${Math.trunc(Number(id))}`)
            .pipe(map((raw: any) => normalizeSubtipoDetalle(raw)));
    }

    /** `POST /subtipos/add`: permiso de creación `subtipos`. */
    crearSubtipo(cuerpo: SubtipoCuerpo): Promise<EntradaGuardada<SubtipoDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_SUBTIPO, null, cuerpo);
    }

    /** `PUT /subtipos/<id>`: el subtipo entero, con el mismo cuerpo que el alta (el mismo permiso). */
    actualizarSubtipo(id: number, cuerpo: SubtipoCuerpo): Promise<EntradaGuardada<SubtipoDetalle>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_SUBTIPO, id, cuerpo);
    }

    getSubtipos(): Observable<SubtipoResumen[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, "Subtipos"),
            (valor) => normalizeSubtipoResumen(valor),
        );
    }

    getSubtipo(id: number): Observable<SubtipoDetalle> {
        const subtipoId = Number(id);
        if (!Number.isFinite(subtipoId) || subtipoId <= 0)
            return throwError(() => new Error("Id de subtipo invalido"));

        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Subtipos/${subtipoId}`),
            // Si la caché solo tiene el resumen, se pide el detalle a la API.
            sirveLaCache: (snapshot) => {
                const raw = snapshot.exists() ? snapshot.val() : null;
                return !!raw && typeof raw === "object" && !!raw.Habilidades && !!raw.Movimientos;
            },
            desdeCache: (snapshot) => normalizeSubtipoDetalle(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}subtipos/${subtipoId}`),
            desdeApi: (raw) => normalizeSubtipoDetalle(raw),
            avisos: {
                noEncontrado: { titulo: "Subtipo no encontrado", texto: `No existe el subtipo con id ${subtipoId}` },
                error: "Error al obtener el subtipo",
            },
        });
    }

    buscarPorNombre(nombre: string): Observable<SubtipoResumen | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getSubtipos().pipe(
            map((subtipos) => subtipos.find((s) => normalizarTexto(s.Nombre) === objetivo) ?? null)
        );
    }

}
