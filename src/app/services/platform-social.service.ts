import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { cabecerasPlataforma, PlatformSessionService } from './platform-session.service';
import { CORREO_SIN_CONFIRMAR, MENSAJE_CORREO_SIN_CONFIRMAR, conCorreoConfirmado } from './utils/correo-sin-confirmar';
import { codigoDeError } from './utils/error-api';

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

/** El avatar de una persona: las direcciones llegan relativas a la API de la plataforma (`urlAvatar` las completa). */
export interface AvatarPlataforma {
    url: string;
    miniatura: string;
    version?: number;
}

export interface PerfilPublicoPlataforma {
    id: string;
    alias: string;
    nombre: string | null;
    biografia: string | null;
    pronombres: string | null;
    privado: boolean;
    avatar?: AvatarPlataforma | null;
}

/** Una persona en las respuestas de «Personas y relaciones»: `nombre` es `null` si su perfil es privado. */
export interface PersonaPlataforma {
    id: string;
    alias: string;
    nombre: string | null;
    privado: boolean;
    avatar: AvatarPlataforma | null;
    borrada?: boolean;
}

/** Una fila de los listados de amistades o bloqueos: la persona y desde cuándo. */
export interface VinculoPlataforma {
    persona: PersonaPlataforma;
    desde: string | null;
}

/** Una página de un listado por cursor; `cursor` es `null` en la última. */
export interface PaginaVinculosPlataforma {
    vinculos: VinculoPlataforma[];
    cursor: string | null;
}

export type TipoSolicitudesAmistad = 'recibidas' | 'enviadas';

export interface SolicitudAmistadPlataforma {
    id: number;
    persona: PersonaPlataforma;
    creada: string | null;
    caduca: string | null;
}

/** Los contadores de `GET /v1/social/resumen`. */
export interface ResumenSocialPlataforma {
    solicitudesRecibidas: number;
    solicitudesEnviadas: number;
    amistades: number;
    seguidos: number;
    seguidores: number;
    bloqueos: number;
}

/** Lo que se lee de alguien sin nombre que enseñar (ni nombre, ni alias, ni correo). */
export const PERSONA_SIN_NOMBRE = 'Persona sin nombre';

/** Lo que se enseña de una persona: su nombre visible o, si su perfil es privado, `@alias`. Nunca su id. */
export function nombreVisiblePersona(persona: Pick<PersonaPlataforma, 'alias' | 'nombre'> | null | undefined): string {
    const nombre = `${persona?.nombre ?? ''}`.trim();
    if (nombre.length > 0)
        return nombre;
    const alias = `${persona?.alias ?? ''}`.trim();
    return alias.length > 0 ? `@${alias}` : PERSONA_SIN_NOMBRE;
}

/** La dirección completa de la miniatura del avatar (la API la da relativa a ella), o `null` si no tiene. */
export function urlAvatar(avatar: AvatarPlataforma | null | undefined, api: string = environment.plataforma.apiUrl): string | null {
    const ruta = `${avatar?.miniatura ?? avatar?.url ?? ''}`.trim();
    if (ruta.length < 1)
        return null;
    if (/^https?:\/\//i.test(ruta))
        return ruta;
    return `${api.replace(/\/+$/, '')}/${ruta.replace(/^\/+/, '')}`;
}

/** Lo que se escribe en el buscador de personas: de 2 a 60 caracteres (`GET /v1/personas`). */
export const BUSQUEDA_PERSONAS_MIN = 2;
export const BUSQUEDA_PERSONAS_MAX = 60;

/** Error de la API de la plataforma, con su `code` (formato común: `error`, `code`, `field`). */
export class PlatformSocialError extends Error {
    constructor(message: string, readonly code: string, readonly status: number) {
        super(message);
    }
}

/** La frase de un fallo de las relaciones: la de `PlatformSocialError` o, con cualquier otro error, `porDefecto`. */
export function mensajeDeErrorSocial(error: unknown, porDefecto: string): string {
    return error instanceof PlatformSocialError && error.message.trim().length > 0 ? error.message : porDefecto;
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
    relacion_consigo_mismo: 'Esa persona eres tú.',
    busqueda_no_valida: 'Escribe entre 2 y 60 caracteres para buscar.',
    cursor_no_valido: 'La lista ha cambiado. Vuelve a cargarla.',
    solo_entre_amistades: 'Solo puedes escribir por privado a tus amistades.',
    [CORREO_SIN_CONFIRMAR]: MENSAJE_CORREO_SIN_CONFIRMAR,
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

    /** Cuántas relaciones tiene la cuenta (solicitudes, amistades, bloqueos…). */
    resumen(): Promise<ResumenSocialPlataforma> {
        return this.peticion('GET', '/v1/social/resumen');
    }

    /** Las amistades, las más recientes primero, de 50 en 50: sin `cursor`, la primera página. */
    amistades(cursor: string | null = null): Promise<PaginaVinculosPlataforma> {
        return this.pagina('/v1/social/amistades', cursor);
    }

    /** A quién tiene bloqueado la cuenta (paginado igual). */
    bloqueos(cursor: string | null = null): Promise<PaginaVinculosPlataforma> {
        return this.pagina('/v1/social/bloqueos', cursor);
    }

    /** Las solicitudes pendientes y no caducadas, recibidas o enviadas. */
    async solicitudes(tipo: TipoSolicitudesAmistad): Promise<SolicitudAmistadPlataforma[]> {
        const respuesta = await this.peticion<{ solicitudes?: SolicitudAmistadPlataforma[] }>('GET', `/v1/social/amistades/solicitudes?tipo=${tipo}`);
        return Array.isArray(respuesta?.solicitudes) ? respuesta.solicitudes : [];
    }

    /**
     * Busca personas por alias o nombre (los perfiles privados, solo por su alias exacto), hasta 20. Nunca devuelve a la
     * propia cuenta ni a nadie con un bloqueo en cualquier dirección. Fuera de 2 a 60 caracteres no pregunta: `[]`.
     */
    async buscarPersonas(texto: string): Promise<PersonaPlataforma[]> {
        const q = `${texto ?? ''}`.trim();
        if (q.length < BUSQUEDA_PERSONAS_MIN || q.length > BUSQUEDA_PERSONAS_MAX)
            return [];
        const respuesta = await this.peticion<{ personas?: PersonaPlataforma[] }>('GET', `/v1/personas?q=${encodeURIComponent(q)}`);
        return Array.isArray(respuesta?.personas) ? respuesta.personas : [];
    }

    /**
     * La conversación directa con una amistad (la crea si no existía), por el SDK (ecosistema-kit/CHAT.md). Si no sois
     * amistades, falla con `solo_entre_amistades`, ya en una frase.
     */
    async conversacionDirecta(idCuenta: string): Promise<number> {
        let id: number | null;
        try {
            id = await this.platformSessionSvc.conversacionDirecta(idCuenta);
        } catch (error) {
            throw this.toError(error);
        }
        if (!id)
            throw new PlatformSocialError('Entra con tu cuenta de Yosiftware para escribir.', 'sin_sesion', 0);
        return id;
    }

    private async pagina(ruta: string, cursor: string | null): Promise<PaginaVinculosPlataforma> {
        const consulta = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
        const respuesta = await this.peticion<Partial<PaginaVinculosPlataforma>>('GET', `${ruta}${consulta}`);
        return {
            vinculos: Array.isArray(respuesta?.vinculos) ? respuesta.vinculos : [],
            cursor: `${respuesta?.cursor ?? ''}`.trim() || null,
        };
    }

    private peticion<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', ruta: string, body?: unknown): Promise<T> {
        return conCorreoConfirmado(this.platformSessionSvc, method !== 'GET', async () => {
            const headers = await cabecerasPlataforma(this.platformSessionSvc, body !== undefined);
            try {
                return await firstValueFrom(this.http.request<T>(method, `${this.api}${ruta}`, { headers, body }));
            } catch (error) {
                throw this.toError(error);
            }
        });
    }

    private toError(error: unknown): PlatformSocialError {
        if (error instanceof HttpErrorResponse) {
            const code = `${error.error?.code ?? ''}`.trim();
            const message = MENSAJES[code] ?? `${error.error?.error ?? ''}`.trim();
            return new PlatformSocialError(message || 'No se pudo completar la acción en tu cuenta de Yosiftware.', code, error.status);
        }
        // Los errores del SDK (`yosiftware.chat.directa`) traen su `code`.
        const code = codigoDeError(error);
        return new PlatformSocialError(MENSAJES[code] ?? 'No se pudo completar la acción en tu cuenta de Yosiftware.', code, 0);
    }
}
