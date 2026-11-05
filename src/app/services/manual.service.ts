import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Observable, firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BanderasManual, Manual, ManualCuerpo } from '../interfaces/manual';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';
import { EscrituraDeCatalogo, guardarEnCatalogo } from './escritura-de-catalogo';
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDeCatalogo } from './utils/error-catalogo';
import { MANUAL } from './utils/nombres-de-catalogo';
import { toBoolean } from 'src/app/services/utils/normalizacion';
import { EntradaGuardada } from './utils/respuesta-de-escritura';

function hasCanonicalManualShape(raw: any): boolean {
    return !!raw
        && typeof raw === 'object'
        && Object.prototype.hasOwnProperty.call(raw, 'Id')
        && Object.prototype.hasOwnProperty.call(raw, 'Nombre');
}

export function normalizeManual(raw: any): Manual {
    if (!hasCanonicalManualShape(raw)) {
        return {
            Id: 0,
            Nombre: '',
            Incluye_dotes: false,
            Incluye_conjuros: false,
            Incluye_plantillas: false,
            Incluye_monstruos: false,
            Incluye_razas: false,
            Incluye_clases: false,
            Incluye_tipos: false,
            Incluye_subtipos: false,
            Oficial: false,
        };
    }

    return {
        Id: Number(raw?.Id ?? 0),
        Nombre: raw?.Nombre ?? '',
        Incluye_dotes: toBoolean(raw?.Incluye_dotes),
        Incluye_conjuros: toBoolean(raw?.Incluye_conjuros),
        Incluye_plantillas: toBoolean(raw?.Incluye_plantillas),
        Incluye_monstruos: toBoolean(raw?.Incluye_monstruos),
        Incluye_razas: toBoolean(raw?.Incluye_razas),
        Incluye_clases: toBoolean(raw?.Incluye_clases),
        Incluye_tipos: toBoolean(raw?.Incluye_tipos),
        Incluye_subtipos: toBoolean(raw?.Incluye_subtipos),
        Oficial: toBoolean(raw?.Oficial),
    };
}

/** `{ message, idManual, manual }`, el manual como su `GET`. */
const ESCRITURA_MANUAL: EscrituraDeCatalogo<Manual> = {
    url: 'manuales', clave: 'manual', claveId: 'idManual', normalizar: normalizeManual, nombre: MANUAL,
};

@Injectable({
    providedIn: 'root'
})
export class ManualService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    getManual(id: number): Observable<Manual> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Manuales/${id}`),
            desdeCache: (snapshot) => normalizeManual(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}manuales/${id}`),
            desdeApi: (raw) => normalizeManual(raw),
            avisos: {
                noEncontrado: { titulo: "Manual no encontrado", texto: `No existe el manual con id ${id}` },
                error: "Error al obtener el manual",
            },
        });
    }

    /** El manual por HTTP, sin caché: el que abre «Modificar manual». */
    getManualFresco(id: number): Observable<Manual> {
        return this.http.get(`${environment.apiUrl}manuales/${Math.trunc(Number(id))}`)
            .pipe(map((raw: any) => normalizeManual(raw)));
    }

    /** `POST /manuales/add`: permiso de creación `manuales`. */
    crearManual(cuerpo: ManualCuerpo): Promise<EntradaGuardada<Manual>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_MANUAL, null, cuerpo);
    }

    /**
     * `PATCH /manuales/<id>`: solo las banderas de contenido (el nombre y si es oficial no se editan; hito 9 del roadmap de
     * inserciones). La API devuelve el manual sin envoltorio.
     */
    async actualizarBanderasManual(id: number, banderas: BanderasManual): Promise<Manual> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const respuesta = await firstValueFrom(this.http.patch<any>(`${environment.apiUrl}manuales/${Math.trunc(Number(id))}`,
                banderas, { headers }));
            return normalizeManual(respuesta);
        } catch (error: unknown) {
            throw errorDeCatalogo(error, 'actualizar', MANUAL);
        }
    }

    getManuales(): Observable<Manual[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, 'Manuales'),
            (valor) => normalizeManual(valor),
        );
    }

}
