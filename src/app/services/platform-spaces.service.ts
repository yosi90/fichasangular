import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlatformSessionService } from './platform-session.service';

// La pertenencia de las campañas en los espacios de la plataforma (ecosistema-kit/ESPACIOS.md, «Con tu propia
// interfaz»): las rutas /v1/espacios con el token de la plataforma. Rol no guarda invitaciones ni solicitudes; tras
// cada acción, CampanaService.syncMembership() pone al día la copia de la API.

export type EntradaEspacio = 'invitacion' | 'solicitud' | 'abierto';

export interface YoEnEspacio {
    rol: string;
    nombreRol: string | null;
    propietario: boolean;
    estado: string;
    capacidades: { gestionar: boolean; invitar: boolean; chat: string; };
}

export interface TraspasoEspacio {
    cuenta: string;
    rolSaliente: string | null;
    caduca: string | null;
}

export interface EspacioPlataforma {
    id: number;
    idExterno: string;
    nombre: string;
    entrada: EntradaEspacio;
    propietario: string | null;
    miembros: number;
    yo: YoEnEspacio | null;
    traspaso: TraspasoEspacio | null;
}

/** Una invitación pendiente vista por el máster. De las de correo solo se ve el correo enmascarado. */
export interface InvitacionEnviadaEspacio {
    id: number;
    cuenta: string | null;
    alias: string | null;
    correo: string | null;
    creada: string | null;
    caduca: string | null;
}

/** Una invitación pendiente de la persona (también a sus correos confirmados). */
export interface InvitacionRecibidaEspacio {
    id: number;
    espacio: { id: number; idExterno: string; nombre: string; };
    de: { cuenta: string | null; nombre: string | null; };
    miembros: number;
    caduca: string | null;
}

export interface SolicitudEspacio {
    id: number;
    cuenta: string;
    alias: string | null;
    nombre: string | null;
    mensaje: string | null;
    creada: string | null;
}

/** Error de la API de la plataforma, con su `code` (formato común: `error`, `code`, `field`). */
export class PlatformSpacesError extends Error {
    constructor(message: string, readonly code: string, readonly status: number) {
        super(message);
    }
}

const MENSAJES: Record<string, string> = {
    espacio_no_encontrado: 'Esta campaña ya no está disponible para ti.',
    sin_permiso_en_el_espacio: 'Solo el máster de la campaña puede hacer esto.',
    persona_no_encontrada: 'Esta persona no está disponible.',
    ya_es_miembro: 'Ya está en la campaña.',
    invitacion_no_valida: 'No se puede invitar a esta persona.',
    correo_no_valido: 'Ese correo no es válido.',
    invitacion_no_encontrada: 'Esa invitación ya no está: caducó, la retiraron o ya se usó.',
    acepta_en_la_web: 'Esta invitación se acepta desde la web de la campaña.',
    correo_de_otra_cuenta: 'Esa invitación es para un correo de otra cuenta: entra con ella para aceptarla.',
    dos_pasos_necesarios: 'Esta campaña exige la verificación en dos pasos. Actívala en tu cuenta de Yosiftware y vuelve.',
    espacio_lleno: 'La campaña está llena.',
    espacio_sin_solicitudes: 'Esta campaña solo admite invitaciones.',
    solicitud_no_encontrada: 'Esa solicitud ya no está pendiente.',
    expulsado_del_espacio: 'Te sacaron de esta campaña: solo puedes volver con una invitación.',
    propietario_no_puede_salir: 'Eres el máster: traspasa la campaña a un jugador antes de salir.',
    es_propietario: 'No se puede sacar al máster de la campaña.',
    traspaso_no_valido: 'Solo se puede traspasar a un jugador activo de la campaña.',
    traspaso_no_encontrado: 'Ese traspaso ya no está pendiente.',
    miembro_no_encontrado: 'Esa persona ya no está en la campaña.',
    cuenta_restringida: 'Tu cuenta de Yosiftware tiene limitado este tipo de acciones.',
    demasiadas_invitaciones: 'Has enviado demasiadas invitaciones. Espera un poco y vuelve a intentarlo.',
    demasiadas_peticiones: 'Demasiadas acciones seguidas. Espera un poco y vuelve a intentarlo.',
};

@Injectable({
    providedIn: 'root'
})
export class PlatformSpacesService {
    private readonly api = environment.plataforma.apiUrl;

    constructor(
        private http: HttpClient,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    async espacio(idEspacio: number): Promise<EspacioPlataforma> {
        return this.normalizarEspacio(await this.peticion<any>('GET', `/v1/espacios/${idEspacio}`));
    }

    async invitarCuenta(idEspacio: number, cuenta: string): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/invitaciones`, { cuenta });
    }

    async invitarCorreo(idEspacio: number, correo: string): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/invitaciones`, { correo });
    }

    async invitacionesEnviadas(idEspacio: number): Promise<InvitacionEnviadaEspacio[]> {
        const respuesta = await this.peticion<any>('GET', `/v1/espacios/${idEspacio}/invitaciones`);
        return this.lista(respuesta?.invitaciones).map((item) => ({
            id: Number(item.id),
            cuenta: this.texto(item.cuenta),
            alias: this.texto(item.alias),
            correo: this.texto(item.correo),
            creada: this.texto(item.creada),
            caduca: this.texto(item.caduca),
        }));
    }

    async retirarInvitacion(idEspacio: number, idInvitacion: number): Promise<void> {
        await this.peticion('DELETE', `/v1/espacios/${idEspacio}/invitaciones/${idInvitacion}`);
    }

    /** Las invitaciones pendientes de la persona en Rol. */
    async misInvitaciones(): Promise<InvitacionRecibidaEspacio[]> {
        const respuesta = await this.peticion<any>('GET', '/v1/espacios/invitaciones');
        return this.lista(respuesta?.invitaciones).map((item) => ({
            id: Number(item.id),
            espacio: {
                id: Number(item.espacio?.id),
                idExterno: `${item.espacio?.idExterno ?? ''}`,
                nombre: `${item.espacio?.nombre ?? ''}`,
            },
            de: { cuenta: this.texto(item.de?.cuenta), nombre: this.texto(item.de?.nombre) },
            miembros: Number(item.miembros ?? 0),
            caduca: this.texto(item.caduca),
        }));
    }

    async aceptarInvitacion(idInvitacion: number): Promise<void> {
        await this.peticion('POST', `/v1/espacios/invitaciones/${idInvitacion}/aceptar`);
    }

    async rechazarInvitacion(idInvitacion: number): Promise<void> {
        await this.peticion('POST', `/v1/espacios/invitaciones/${idInvitacion}/rechazar`);
    }

    async cambiarEntrada(idEspacio: number, entrada: 'invitacion' | 'solicitud'): Promise<void> {
        await this.peticion('PATCH', `/v1/espacios/${idEspacio}`, { entrada });
    }

    async solicitudes(idEspacio: number): Promise<SolicitudEspacio[]> {
        const respuesta = await this.peticion<any>('GET', `/v1/espacios/${idEspacio}/solicitudes`);
        return this.lista(respuesta?.solicitudes).map((item) => ({
            id: Number(item.id),
            cuenta: `${item.cuenta ?? ''}`,
            alias: this.texto(item.alias),
            nombre: this.texto(item.nombre),
            mensaje: this.texto(item.mensaje),
            creada: this.texto(item.creada),
        }));
    }

    async resolverSolicitud(idEspacio: number, idSolicitud: number, accion: 'aprobar' | 'rechazar'): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/solicitudes/${idSolicitud}/${accion}`);
    }

    async pedirEntrar(idEspacio: number, mensaje: string | null): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/solicitudes`, mensaje ? { mensaje } : {});
    }

    async salir(idEspacio: number): Promise<void> {
        await this.peticion('DELETE', `/v1/espacios/${idEspacio}/miembros/yo`);
    }

    async sacar(idEspacio: number, cuenta: string): Promise<void> {
        await this.peticion('DELETE', `/v1/espacios/${idEspacio}/miembros/${encodeURIComponent(cuenta)}`);
    }

    /** Ofrece el máster a un jugador activo; el máster saliente se queda como jugador. */
    async ofrecerTraspaso(idEspacio: number, cuenta: string): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/traspaso`, { cuenta, rolSaliente: 'jugador' });
    }

    async cancelarTraspaso(idEspacio: number): Promise<void> {
        await this.peticion('DELETE', `/v1/espacios/${idEspacio}/traspaso`);
    }

    async responderTraspaso(idEspacio: number, respuesta: 'aceptar' | 'rechazar'): Promise<void> {
        await this.peticion('POST', `/v1/espacios/${idEspacio}/traspaso/${respuesta}`);
    }

    private normalizarEspacio(raw: any): EspacioPlataforma {
        const yo = raw?.yo;
        const traspaso = raw?.traspaso;
        return {
            id: Number(raw?.id),
            idExterno: `${raw?.idExterno ?? ''}`,
            nombre: `${raw?.nombre ?? ''}`,
            entrada: raw?.entrada === 'solicitud' || raw?.entrada === 'abierto' ? raw.entrada : 'invitacion',
            propietario: this.texto(raw?.propietario),
            miembros: Number(raw?.miembros ?? 0),
            yo: yo ? {
                rol: `${yo.rol ?? ''}`,
                nombreRol: this.texto(yo.nombreRol),
                propietario: yo.propietario === true,
                estado: `${yo.estado ?? ''}`,
                capacidades: {
                    gestionar: yo.capacidades?.gestionar === true,
                    invitar: yo.capacidades?.invitar === true,
                    chat: `${yo.capacidades?.chat ?? 'nada'}`,
                },
            } : null,
            traspaso: traspaso ? {
                cuenta: `${traspaso.cuenta ?? ''}`,
                rolSaliente: this.texto(traspaso.rolSaliente),
                caduca: this.texto(traspaso.caduca),
            } : null,
        };
    }

    private lista(value: unknown): any[] {
        return Array.isArray(value) ? value : [];
    }

    private texto(value: unknown): string | null {
        const text = `${value ?? ''}`.trim();
        return text.length > 0 ? text : null;
    }

    private async peticion<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', ruta: string, body?: unknown): Promise<T> {
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

    private toError(error: unknown): PlatformSpacesError {
        if (error instanceof HttpErrorResponse) {
            const code = `${error.error?.code ?? ''}`.trim();
            const message = MENSAJES[code] ?? `${error.error?.error ?? ''}`.trim();
            return new PlatformSpacesError(message || 'No se pudo completar la acción en la campaña.', code, error.status);
        }
        return new PlatformSpacesError('No se pudo completar la acción en la campaña.', '', 0);
    }
}
