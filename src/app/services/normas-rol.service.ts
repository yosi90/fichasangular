import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CLAVE_WEB_ROL, NormasDeRol } from '../interfaces/normas-rol';
import { toInt, toNullableText } from './utils/normalizacion';

/**
 * El texto de las normas propias de Rol, para enseñarlo («Ayuda → Legal»). Son públicas: se leen sin sesión. Aceptarlas
 * es cosa del SDK (`UserService.asegurarNormasDeCreacion`, con `normasDeLaWeb`).
 */
@Injectable({
    providedIn: 'root'
})
export class NormasRolService {
    constructor(private http: HttpClient) { }

    /** Las normas vigentes de Rol. Falla si la plataforma no responde o no hay normas con texto. */
    async leer(): Promise<NormasDeRol> {
        const raw = await firstValueFrom(this.http.get<any>(`${environment.plataforma.apiUrl}/v1/webs/${CLAVE_WEB_ROL}/normas`));
        const texto = toNullableText(raw?.texto);
        if (!texto)
            throw new Error('Rol no tiene normas publicadas.');
        return {
            id: toInt(raw?.id),
            version: toInt(raw?.version),
            titulo: toNullableText(raw?.titulo) ?? 'Normas de Rol',
            texto,
            importante: raw?.importante === true,
            publicadas: `${raw?.publicadas ?? ''}`.trim(),
        };
    }
}
