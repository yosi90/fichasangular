import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArmaNaturalTipo } from '../interfaces/arma-natural';
import { toArray, toBoolean, toInt, toText } from './utils/normalizacion';
import { compararTexto } from './utils/orden-texto';

/** Un tipo de `GET /armas-naturales`. */
export function normalizarArmaNaturalTipo(raw: any): ArmaNaturalTipo {
    return {
        Id: toInt(raw?.Id),
        Nombre: toText(raw?.Nombre).trim(),
        Nombre_plural: toText(raw?.Nombre_plural).trim(),
        Primaria: toBoolean(raw?.Primaria, true),
        Oficial: toBoolean(raw?.Oficial, true),
    };
}

/**
 * El catálogo de los tipos de arma natural (`docs/publica/endpoints/catalogos.md`, `GET /armas-naturales`), del que eligen
 * las armas naturales de razas, edades y plantillas en su alta y su edición. Sin caché de la RTDB: se lee por HTTP.
 */
@Injectable({ providedIn: 'root' })
export class ArmaNaturalService {
    constructor(private http: HttpClient) { }

    /** Los tipos, por nombre. */
    getTipos(): Observable<ArmaNaturalTipo[]> {
        return this.http.get(`${environment.apiUrl}armas-naturales`).pipe(
            map((raw) => toArray(raw).map(normalizarArmaNaturalTipo)
                .filter((tipo) => tipo.Id > 0 && tipo.Nombre.length > 0)
                .sort((a, b) => compararTexto(a.Nombre, b.Nombre))),
        );
    }
}
