import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Manual } from '../interfaces/manual';
import { ManualIncludeFlag } from '../config/manual-secciones.config';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { cacheRtdbOApi, escucharRtdb, listaRtdb } from './catalogo-api';
import { toBoolean } from 'src/app/services/utils/normalizacion';

function hasCanonicalManualShape(raw: any): boolean {
    return !!raw
        && typeof raw === 'object'
        && Object.prototype.hasOwnProperty.call(raw, 'Id')
        && Object.prototype.hasOwnProperty.call(raw, 'Nombre');
}

function normalizeManual(raw: any): Manual {
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

export type ManualFlagsPatchPayload = Partial<Record<ManualIncludeFlag, boolean>>;

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

    getManuales(): Observable<Manual[]> {
        return listaRtdb(
            escucharRtdb(this.db, this.firebaseContextSvc, 'Manuales'),
            (valor) => normalizeManual(valor),
        );
    }

}
