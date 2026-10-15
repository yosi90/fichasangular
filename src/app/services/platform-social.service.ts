import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlatformSessionService } from './platform-session.service';

// Las relaciones de la plataforma desde las páginas de comunidad de Rol (ecosistema-kit/SOCIAL.md, «Con páginas
// propias»): las mismas rutas que la web social, con el token de la plataforma. Rol no guarda amistades ni bloqueos.

export type AmistadPlataforma = 'ninguna' | 'solicitud_enviada' | 'solicitud_recibida' | 'amistades';

export interface RelacionPlataforma {
    amistad: AmistadPlataforma;
    idSolicitud: number | null;
    sigo: boolean;
    meSigue: boolean;
    bloqueada: boolean;
}

export interface PerfilPublicoPlataforma {
    id: string;
    alias: string;
    nombre: string | null;
    biografia: string | null;
    pronombres: string | null;
    privado: boolean;
}

/** Error de la API de la plataforma, con su `code` (formato común: `error`, `code`, `field`). */
export class PlatformSocialError extends Error {
    constructor(message: string, readonly code: string, readonly status: number) {
        super(message);
    }
}

const MENSAJES: Record<string, string> = {
    persona_no_encontrada: 'Esta persona no está disponible.',
    perfil_no_encontrado: 'Esta persona no está disponible.',
    ya_son_amistades: 'Ya sois amistades.',
    solicitud_ya_enviada: 'Ya le has pedido amistad.',
    solicitud_rechazada_hace_poco: 'Rechazó tu solicitud hace poco: podrás volver a pedirla pasados 30 días.',
    persona_bloqueada: 'Tienes bloqueada a esta persona.',
    solicitud_no_encontrada: 'Esa solicitud ya no está pendiente.',
    amistad_no_encontrada: 'Ya no sois amistades.',
    demasiadas_solicitudes: 'Has enviado demasiadas solicitudes de amistad hoy.',
    demasiadas_peticiones: 'Demasiadas acciones seguidas. Espera un poco y vuelve a intentarlo.',
};

@Injectable({
    providedIn: 'root'
})
export class PlatformSocialService {
    private readonly api = environment.plataforma.apiUrl;

    constructor(
        private http: HttpClient,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    relacion(idCuenta: string): Promise<RelacionPlataforma> {
        return this.peticion('GET', `/v1/personas/${encodeURIComponent(idCuenta)}/relacion`);
    }

    perfil(idCuenta: string): Promise<PerfilPublicoPlataforma> {
        return this.peticion('GET', `/v1/perfiles/${encodeURIComponent(idCuenta)}`);
    }

    async pedirAmistad(idCuenta: string): Promise<void> {
        await this.peticion('POST', '/v1/social/amistades/solicitudes', { idCuenta });
    }

    async responderSolicitud(idSolicitud: number, respuesta: 'aceptar' | 'rechazar'): Promise<void> {
        await this.peticion('POST', `/v1/social/amistades/solicitudes/${idSolicitud}/${respuesta}`);
    }

    async retirarSolicitud(idSolicitud: number): Promise<void> {
        await this.peticion('DELETE', `/v1/social/amistades/solicitudes/${idSolicitud}`);
    }

    async dejarAmistad(idCuenta: string): Promise<void> {
        await this.peticion('DELETE', `/v1/social/amistades/${encodeURIComponent(idCuenta)}`);
    }

    async seguir(idCuenta: string, seguir: boolean): Promise<void> {
        await this.peticion(seguir ? 'PUT' : 'DELETE', `/v1/social/seguidos/${encodeURIComponent(idCuenta)}`);
    }

    async bloquear(idCuenta: string, bloquear: boolean): Promise<void> {
        await this.peticion(bloquear ? 'PUT' : 'DELETE', `/v1/social/bloqueos/${encodeURIComponent(idCuenta)}`);
    }

    private async peticion<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', ruta: string, body?: unknown): Promise<T> {
        const token = await this.platformSessionSvc.tokenPlataforma();
        let headers = new HttpHeaders({ Authorization: `Bearer ${token}`, Accept: 'application/json' });
        if (body !== undefined)
            headers = headers.set('Content-Type', 'application/json');
        try {
            return await firstValueFrom(this.http.request<T>(method, `${this.api}${ruta}`, { headers, body }));
        } catch (error) {
            throw this.toError(error);
        }
    }

    private toError(error: unknown): PlatformSocialError {
        if (error instanceof HttpErrorResponse) {
            const code = `${error.error?.code ?? ''}`.trim();
            const message = MENSAJES[code] ?? `${error.error?.error ?? ''}`.trim();
            return new PlatformSocialError(message || 'No se pudo completar la acción en tu cuenta de Yosiftware.', code, error.status);
        }
        return new PlatformSocialError('No se pudo completar la acción en tu cuenta de Yosiftware.', '', 0);
    }
}
