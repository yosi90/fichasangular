import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AptitudEspecial, AptitudEspecialOtorgante } from 'src/app/interfaces/aptitud-especial';
import { leerComodin } from 'src/app/services/utils/comodin';
import { toArray, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { environment } from 'src/environments/environment';

function normalizeOtorgante(raw: any): AptitudEspecialOtorgante {
    return { Id: toNumber(raw?.Id), Nombre: toText(raw?.Nombre) };
}

export function normalizeAptitudEspecial(raw: any): AptitudEspecial {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Raciales: toArray(raw?.Raciales).map(normalizeOtorgante),
        Especiales: toArray(raw?.Especiales).map(normalizeOtorgante),
        Plantillas: toArray(raw?.Plantillas).map(normalizeOtorgante),
        Comodin: leerComodin(raw?.Comodin),
    };
}

/**
 * Las aptitudes especiales que puede pedir el prerrequisito `aptitud_especial`, de `GET /aptitudes-especiales` (pública,
 * sin caché en la RTDB). Las usa el editor de prerrequisitos de las altas de dotes y clases.
 */
@Injectable({ providedIn: 'root' })
export class AptitudEspecialService {
    constructor(private http: HttpClient) { }

    getAptitudesEspeciales(): Observable<AptitudEspecial[]> {
        return this.http.get<unknown[]>(`${environment.apiUrl}aptitudes-especiales`)
            .pipe(map((listado) => toArray(listado).map(normalizeAptitudEspecial)));
    }
}
