import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PrerrequisitoTipo } from 'src/app/interfaces/prerrequisito';
import { registrarTiposPrerrequisito } from 'src/app/services/utils/prerrequisito-frase';
import { environment } from 'src/environments/environment';

/**
 * Los nombres de los tipos de prerrequisito para el editor, de `GET /prerrequisitos/tipos` (pública y fija: se pide una
 * vez por sesión). Si no responde, el editor sigue con la clave legible de cada tipo (`nombreTipoPrerrequisito`).
 */
@Injectable({ providedIn: 'root' })
export class PrerrequisitosTiposService {
    private carga: Promise<void> | null = null;

    constructor(private http: HttpClient) { }

    cargar(): Promise<void> {
        if (!this.carga) {
            this.carga = firstValueFrom(this.http.get<PrerrequisitoTipo[]>(`${environment.apiUrl}prerrequisitos/tipos`))
                .then((tipos) => registrarTiposPrerrequisito(tipos))
                .catch(() => {
                    // Sin la ruta, el respaldo; se vuelve a intentar la próxima vez que se abra un editor.
                    this.carga = null;
                });
        }
        return this.carga;
    }
}
