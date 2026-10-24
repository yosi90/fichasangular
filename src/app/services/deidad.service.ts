import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { AmbitoDetalle } from "../interfaces/ambito";
import { DeidadDetalle } from "../interfaces/deidad";
import { DominioDetalle } from "../interfaces/dominio";
import { normalizeAmbito } from "./ambito.service";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeDominio } from "./dominio.service";
import { normalizePabellon } from "./pabellon.service";
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value > 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "si" || normalized === "sí";
    }
    return false;
}

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
        Manual: {
            Id: toNumber(raw?.Manual?.Id),
            Nombre: toText(raw?.Manual?.Nombre),
            Pagina: toNumber(raw?.Manual?.Pagina),
        },
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
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class DeidadService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

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
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const deidades: DeidadDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const deidad = normalizeDeidad(obj.val());
                    if (deidad.Id > 0)
                        deidades.push(deidad);
                });
                deidades.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(deidades);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Deidades");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
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
