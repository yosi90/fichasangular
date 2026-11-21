import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Truco, TrucoRef } from '../interfaces/truco';
import { cacheRtdbOApi, escucharCatalogo } from './catalogo-api';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { normalizeManualLegacy } from './utils/manual-mapper';
import { toArray, toBoolean, toInt, toIntOrNull, toText } from './utils/normalizacion';
import { porNombre } from './utils/orden-texto';

/*
 * Los trucos y los fines de Trato con animales (`GET /trucos`, caché `Trucos` por `Id`; contrato:
 * `docs/publica/endpoints/catalogos.md`, «Los trucos»). Sin alta ni edición: se cargan con un script de datos.
 */

function normalizeTrucoRef(raw: any): TrucoRef {
    return { Id: toInt(raw?.Id), Nombre: toText(raw?.Nombre) };
}

/** Un truco de la caché o de la API (permisivo: lo que falta, vacío). */
export function normalizeTruco(raw: any): Truco {
    const requisitos = raw?.Requisitos ?? {};
    const sustituye = raw?.Sustituye ? normalizeTrucoRef(raw.Sustituye) : null;
    return {
        Id: toInt(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Nombre_original: toText(raw?.Nombre_original),
        Traducido: toBoolean(raw?.Traducido),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualLegacy(raw?.Manual),
        Cd: toInt(raw?.Cd),
        Coste: Math.max(1, toInt(raw?.Coste, 1)),
        Es_fin: toBoolean(raw?.Es_fin),
        Semanas: toIntOrNull(raw?.Semanas),
        Int_minima: toIntOrNull(raw?.Int_minima),
        Sustituye: sustituye && sustituye.Id > 0 ? sustituye : null,
        Semanas_mejora: toIntOrNull(raw?.Semanas_mejora),
        Cd_mejora: toIntOrNull(raw?.Cd_mejora),
        Trucos: toArray(raw?.Trucos).map(normalizeTrucoRef).filter((t) => t.Id > 0),
        Requisitos: {
            Trucos: toArray(requisitos?.Trucos).map((t: any) => ({ ...normalizeTrucoRef(t), Opcional: toBoolean(t?.Opcional) }))
                .filter((t) => t.Id > 0),
            // Las aptitudes de la criatura que pide (Olfato, Veneno, Telaraña): `Especiales` o, si la API las da como
            // raciales, `Raciales`; se juzgan por su nombre (`aptitudesDeLaCriatura`).
            Especiales: [...toArray(requisitos?.Especiales), ...toArray(requisitos?.Raciales)].map(normalizeTrucoRef)
                .filter((t) => t.Nombre.length > 0),
            Tipos: toArray(requisitos?.Tipos).map(normalizeTrucoRef).filter((t) => t.Id > 0),
        },
        Oficial: toBoolean(raw?.Oficial, true),
    };
}

/** La lista de la caché (sus hijos por `Id`) o de la API, sin los que no tienen id, por nombre. */
export function leerTrucos(raw: unknown): Truco[] {
    return toArray(raw).map(normalizeTruco).filter((t) => t.Id > 0).sort(porNombre);
}

@Injectable({ providedIn: 'root' })
export class TrucoService {
    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    /** Los trucos y los fines: la caché `Trucos` o, si no está o está vacía, `GET /trucos`. */
    getTrucos(): Observable<Truco[]> {
        return cacheRtdbOApi({
            escuchar: escucharCatalogo(this.db, this.firebaseContextSvc, 'Trucos'),
            desdeCache: (snapshot) => leerTrucos(snapshot.val()),
            cacheIncompleta: (trucos) => trucos.length < 1,
            pedir: () => this.http.get(`${environment.apiUrl}trucos`),
            desdeApi: (raw) => leerTrucos(raw),
            unaPeticionALaVez: true,
        });
    }
}
