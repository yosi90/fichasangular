import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, filter, firstValueFrom, map, of, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Novedad, PaginaNovedades } from '../interfaces/novedad';
import { EstadoPlataforma, PlatformSessionService } from './platform-session.service';
import { UserSettingsService } from './user-settings.service';
import { toArray, toNullableText, toText } from './utils/normalizacion';
import { guardarPreferenciaLocal, leerPreferenciaLocal } from './utils/preferencia-local';

/** Cuántas novedades trae cada «Ver más». */
export const NOVEDADES_POR_PAGINA = 20;

/** Sin sesión, la preferencia «Abrir Novedades al entrar» se queda en este navegador (`'0'`: no se abre). */
export const CLAVE_ABRIR_NOVEDADES_SIN_SESION = 'rol.novedades.abrirAlEntrar.sinSesion';

/** Lo que se espera a saber si hay sesión antes de decidir; después, se decide como sin sesión. */
const ESPERA_SESION_MS = 10000;

/**
 * Las novedades de Rol y de 3.5 Companion (`GET /novedades`, pública) y la preferencia de abrir su pestaña al entrar:
 * con sesión, en los ajustes de Rol de la plataforma (`perfil.abrirNovedadesAlEntrar`); sin ella, en el navegador.
 */
@Injectable({
    providedIn: 'root'
})
export class NovedadesService {
    constructor(
        private http: HttpClient,
        private platformSessionSvc: PlatformSessionService,
        private userSettingsSvc: UserSettingsService,
    ) { }

    /** Una página, la más nueva primero. */
    getNovedades(offset: number = 0, limit: number = NOVEDADES_POR_PAGINA): Observable<PaginaNovedades> {
        const params = new HttpParams().set('limit', `${limit}`).set('offset', `${offset}`);
        return this.http.get<unknown[]>(`${environment.apiUrl}novedades`, { params, observe: 'response' }).pipe(
            map((respuesta: HttpResponse<unknown[]>) => {
                const novedades = toArray(respuesta.body).map(normalizarNovedad).filter((n): n is Novedad => n !== null);
                const total = Number(respuesta.headers.get('X-Total-Count'));
                return {
                    novedades,
                    total: Number.isFinite(total) && total >= offset + novedades.length ? total : offset + novedades.length,
                    hayMas: respuesta.headers.get('X-Has-More') === 'true',
                };
            }),
        );
    }

    /** Si la pestaña se abre sola al entrar. Por defecto, sí; si no se puede leer la preferencia, también. */
    async abrirAlEntrar(): Promise<boolean> {
        const estado = await this.estadoDecidido();
        if (estado.tipo !== 'con_sesion')
            return leerPreferenciaLocal(CLAVE_ABRIR_NOVEDADES_SIN_SESION) !== '0';
        try {
            return await this.userSettingsSvc.loadAbrirNovedadesAlEntrar();
        } catch {
            return true;
        }
    }

    async guardarAbrirAlEntrar(abrir: boolean): Promise<void> {
        if (this.platformSessionSvc.estado.tipo === 'con_sesion') {
            await this.userSettingsSvc.saveProfileSettings({ abrirNovedadesAlEntrar: abrir });
            return;
        }
        guardarPreferenciaLocal(CLAVE_ABRIR_NOVEDADES_SIN_SESION, abrir ? null : '0');
    }

    private estadoDecidido(): Promise<EstadoPlataforma> {
        return firstValueFrom(this.platformSessionSvc.estado$.pipe(
            filter((estado) => estado.tipo !== 'comprobando'),
            timeout({ first: ESPERA_SESION_MS, with: () => of<EstadoPlataforma>({ tipo: 'no_disponible' }) }),
        ));
    }
}

function normalizarNovedad(raw: any): Novedad | null {
    const idExterno = toNullableText(raw?.idExterno);
    const texto = toNullableText(raw?.texto);
    if (!idExterno || !texto)
        return null;
    return {
        idExterno,
        tipo: toText(raw?.tipo),
        texto,
        enlace: enlaceSeguro(raw?.enlace),
        fecha: toText(raw?.fecha),
    };
}

/** Solo direcciones `https` (el contrato lo garantiza; así un enlace raro nunca llega a un `href`). */
function enlaceSeguro(valor: unknown): string | null {
    const texto = toNullableText(valor);
    return texto && /^https:\/\//i.test(texto) ? texto : null;
}
