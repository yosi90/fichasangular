import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ArmaduraDetalle } from "../interfaces/armadura";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { porNombre } from "src/app/services/utils/orden-texto";

export function normalizeArmadura(raw: any): ArmaduraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualApi(raw?.Manual),
        Ca: toNumber(raw?.Ca),
        Bon_des: toNumber(raw?.Bon_des),
        Penalizador: toNumber(raw?.Penalizador),
        Tipo_armadura: {
            Id: toNumber(raw?.Tipo_armadura?.Id),
            Nombre: toText(raw?.Tipo_armadura?.Nombre),
        },
        Precio: toNumber(raw?.Precio),
        Material: {
            Id: toNumber(raw?.Material?.Id),
            Nombre: toText(raw?.Material?.Nombre),
        },
        Peso_armadura: {
            Id: toNumber(raw?.Peso_armadura?.Id),
            Nombre: toText(raw?.Peso_armadura?.Nombre),
        },
        Peso: toNumber(raw?.Peso),
        Tamano: {
            Id: toNumber(raw?.Tamano?.Id),
            Nombre: toText(raw?.Tamano?.Nombre),
        },
        Fallo_arcano: toNumber(raw?.Fallo_arcano),
        Es_escudo: toBoolean(raw?.Es_escudo),
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
export class ArmaduraService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getArmadura(id: number): Observable<ArmaduraDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Armaduras/${id}`),
            desdeCache: (snapshot) => normalizeArmadura(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}armaduras/${id}`),
            desdeApi: (raw) => normalizeArmadura(raw),
            avisos: {
                noEncontrado: { titulo: "Armadura no encontrada", texto: `No existe la armadura con id ${id}` },
                error: "Error al obtener la armadura",
            },
        });
    }

    getArmaduras(): Observable<ArmaduraDetalle[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchArmadurasPath(onNext, onError),
            // El normalizador ya trata la caché vacía o inexistente: si queda vacía, se va a la API.
            sirveLaCache: () => true,
            desdeCache: (snapshot) => this.normalizeArmadurasSnapshot(snapshot),
            cacheIncompleta: (armaduras) => armaduras.length < 1,
            pedir: () => this.syncArmaduras(),
            desdeApi: (response) => this.normalizeArmadurasResponse(response),
            unaPeticionALaVez: true,
        });
    }

    protected watchArmadurasPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharRtdb(this.db, this.firebaseContextSvc, "Armaduras")(onNext, onError);
    }

    private syncArmaduras() {
        return this.http.get(`${environment.apiUrl}armaduras`);
    }

    private normalizeArmadurasSnapshot(snapshot: any): ArmaduraDetalle[] {
        if (!snapshot?.exists?.())
            return [];
        return this.normalizeArmadurasResponse(snapshot.val?.());
    }

    private normalizeArmadurasResponse(response: any): ArmaduraDetalle[] {
        const armaduras = toArray(response)
            .map((raw: any) => normalizeArmadura(raw))
            .filter((armadura) => armadura.Id > 0);
        armaduras.sort(porNombre);
        return armaduras;
    }

}
