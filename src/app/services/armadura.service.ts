import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { ArmaduraDetalle } from "../interfaces/armadura";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { normalizeEquipoRef, normalizeTextoEquipo } from 'src/app/services/utils/equipo-mapper';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { porNombre } from "src/app/services/utils/orden-texto";

export function normalizeArmadura(raw: any): ArmaduraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Manual: normalizeManualApi(raw?.Manual),
        Ca: toNumber(raw?.Ca),
        Bon_des: toNumberOrNull(raw?.Bon_des),
        Penalizador: toNumber(raw?.Penalizador),
        Precio: toNumber(raw?.Precio),
        Material: normalizeEquipoRef(raw?.Material),
        Peso_armadura: normalizeEquipoRef(raw?.Peso_armadura),
        Tipo_escudo: normalizeEquipoRef(raw?.Tipo_escudo),
        Peso: toNumber(raw?.Peso),
        Tamano: normalizeEquipoRef(raw?.Tamano) ?? { Id: 0, Nombre: '' },
        Fallo_arcano: toNumber(raw?.Fallo_arcano),
        Es_escudo: toBoolean(raw?.Es_escudo),
        Velocidad_30: toNumberOrNull(raw?.Velocidad_30),
        Velocidad_20: toNumberOrNull(raw?.Velocidad_20),
        Correr_multiplicador: toNumberOrNull(raw?.Correr_multiplicador),
        Tiempo_poner: toNullableText(raw?.Tiempo_poner),
        Tiempo_poner_rapido: toNullableText(raw?.Tiempo_poner_rapido),
        Tiempo_quitar: toNullableText(raw?.Tiempo_quitar),
        Oficial: toBoolean(raw?.Oficial),
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
