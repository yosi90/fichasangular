import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import {
    AbrirSesionDto,
    CambiarSesionDto,
    CompraSesionDto,
    CorreccionFichaDto,
    EventoSesionDto,
    ExperienciaPersonaje,
    HistorialSesiones,
    RespuestaCorreccion,
    RespuestaSesion,
    RespuestaSubidaNivel,
    ResumenSesion,
    SesionConFicha,
    SesionEvento,
    SesionPersonaje,
    SubidaNivelDto,
    TipoEventoSesion,
} from 'src/app/interfaces/sesiones';
import { environment } from 'src/environments/environment';
import { AppToastService } from './app-toast.service';
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDePerfil } from './utils/error-api';
import { avisarReglasIgnoradas, leerReglasIgnoradas } from './utils/reglas-ignoradas';
import { toArray, toBoolean, toInt, toIntOrNull, toNumberOrNull, toText } from './utils/normalizacion';

/*
 * El cliente de las rutas de sesiones (`docs/publica/endpoints/personajes.md`, «Sesiones e historial»; guía
 * `docs/publica/SESIONES_FRONT.md`). Todas con el Bearer de la plataforma. Cada escritura manda la `version` de la última
 * respuesta de esa sesión; si otra persona apuntó entre medias, la API responde `409 sesion_desactualizada` y quien llama
 * vuelve a cargar (`esSesionDesactualizada`). Los errores llegan como `ProfileApiError` (texto de la API, `code`, estado
 * y `field`).
 */

export const CODIGO_SESION_DESACTUALIZADA = 'sesion_desactualizada';

const TIPOS_EVENTO: ReadonlySet<string> = new Set<TipoEventoSesion>([
    'alta', 'experiencia', 'experiencia_gastada', 'dinero', 'objeto_obtenido', 'objeto_perdido', 'venta', 'compra',
    'conjuro_copiado', 'subida_nivel', 'modificacion', 'correccion_master', 'nota',
]);

/** Si el error es el `409 sesion_desactualizada` (otra persona apuntó algo entre medias). */
export function esSesionDesactualizada(error: unknown): boolean {
    return `${(error as { code?: unknown } | null)?.code ?? ''}` === CODIGO_SESION_DESACTUALIZADA;
}

/** `ExperienciaPersonaje` de la API, o `null` si no llega (una API anterior a las sesiones). */
export function leerExperiencia(valor: any): ExperienciaPersonaje | null {
    if (!valor || typeof valor !== 'object')
        return null;
    const abierta = valor.sesionAbierta;
    return {
        px: Math.max(0, toInt(valor.px)),
        nivel: Math.max(0, toInt(valor.nivel)),
        pxNivelActual: Math.max(0, toInt(valor.pxNivelActual)),
        pxSiguienteNivel: Math.max(0, toInt(valor.pxSiguienteNivel)),
        puedeSubir: toBoolean(valor.puedeSubir),
        nivelesPorSubir: Math.max(0, toInt(valor.nivelesPorSubir)),
        sesionAbierta: abierta && typeof abierta === 'object'
            ? { numero: Math.max(0, toInt(abierta.numero)), titulo: toText(abierta.titulo).trim() }
            : null,
    };
}

function leerResumen(valor: any): ResumenSesion {
    return {
        pxInicio: toIntOrNull(valor?.pxInicio),
        pxFin: toIntOrNull(valor?.pxFin),
        poInicio: toNumberOrNull(valor?.poInicio),
        poFin: toNumberOrNull(valor?.poFin),
        nepInicio: toIntOrNull(valor?.nepInicio),
        nepFin: toIntOrNull(valor?.nepFin),
    };
}

function leerEvento(valor: any): SesionEvento | null {
    const tipo = toText(valor?.tipo).trim();
    if (!TIPOS_EVENTO.has(tipo))
        return null;
    return {
        id: toInt(valor?.id),
        orden: toInt(valor?.orden),
        tipo: tipo as TipoEventoSesion,
        texto: toText(valor?.texto).trim(),
        actorRol: valor?.actorRol === 'master' || valor?.actorRol === 'sistema' ? valor.actorRol : 'jugador',
        creadoUtc: toText(valor?.creadoUtc).trim() || null,
        pxBrutos: toIntOrNull(valor?.pxBrutos),
        pxPenalizacion: toIntOrNull(valor?.pxPenalizacion),
        px: toIntOrNull(valor?.px),
        po: toNumberOrNull(valor?.po),
        idPersonajeEquipo: toIntOrNull(valor?.idPersonajeEquipo),
        idConjuro: toIntOrNull(valor?.idConjuro),
        idClase: toIntOrNull(valor?.idClase),
        nivelClase: toIntOrNull(valor?.nivelClase),
        deshacible: toBoolean(valor?.deshacible),
    };
}

/** `SesionPersonaje` de la API (sin la instantánea). */
export function leerSesion(valor: any): SesionPersonaje {
    return {
        id: toInt(valor?.id),
        numero: Math.max(0, toInt(valor?.numero)),
        titulo: toText(valor?.titulo).trim(),
        fechaJuego: toText(valor?.fechaJuego).trim() || null,
        estado: valor?.estado === 'abierta' ? 'abierta' : 'cerrada',
        sinHistorial: toBoolean(valor?.sinHistorial),
        abiertaUtc: toText(valor?.abiertaUtc).trim() || null,
        cerradaUtc: toText(valor?.cerradaUtc).trim() || null,
        resumen: leerResumen(valor?.resumen),
        relato: toText(valor?.relato).trim(),
        eventos: toArray(valor?.eventos).map(leerEvento).filter((evento): evento is SesionEvento => evento !== null),
        notas: typeof valor?.notas === 'string' ? valor.notas : null,
        version: toText(valor?.version).trim(),
    };
}

/** `GET /personajes/{id}/sesiones`, de la 0 a la última. */
export function leerHistorial(valor: any): HistorialSesiones {
    return {
        idPersonaje: toInt(valor?.idPersonaje),
        puedeApuntar: toBoolean(valor?.puedeApuntar),
        veNotas: toBoolean(valor?.veNotas),
        rolActor: valor?.rolActor === 'master' || valor?.rolActor === 'jugador' ? valor.rolActor : null,
        experiencia: leerExperiencia(valor?.experiencia),
        sesiones: toArray(valor?.sesiones).map(leerSesion).sort((a, b) => a.numero - b.numero),
    };
}

/** La respuesta de una escritura: `{ sesion, experiencia }` y, según la ruta, `idEvento` o `deshecho`. */
export function leerRespuestaSesion(valor: any): RespuestaSesion {
    const deshecho = valor?.deshecho;
    return {
        sesion: leerSesion(valor?.sesion),
        experiencia: leerExperiencia(valor?.experiencia),
        idEvento: toIntOrNull(valor?.idEvento),
        reglasIgnoradas: leerReglasIgnoradas(valor?.reglasIgnoradas),
        deshecho: deshecho && typeof deshecho === 'object'
            ? { id: toInt(deshecho.id), tipo: toText(deshecho.tipo) as TipoEventoSesion, texto: toText(deshecho.texto).trim() }
            : null,
    };
}

@Injectable({
    providedIn: 'root'
})
export class SesionesService {
    constructor(
        private auth: Auth,
        private http: HttpClient,
        // El aviso de las reglas de la campaña que se salta un PNJ (`avisarReglasIgnoradas`).
        private toasts?: AppToastService,
    ) { }

    async historial(idPersonaje: number): Promise<HistorialSesiones> {
        const respuesta = await this.pedir<any>('GET', this.ruta(idPersonaje), undefined, 'No se ha podido cargar el historial.');
        return leerHistorial(respuesta);
    }

    /** Una sesión con la ficha de esa versión (cruda, de la forma de `GET /personajes/{id}`). */
    async sesion(idPersonaje: number, numero: number): Promise<SesionConFicha> {
        const respuesta = await this.pedir<any>('GET', this.ruta(idPersonaje, numero), undefined, 'No se ha podido cargar la sesión.');
        return {
            sesion: leerSesion(respuesta),
            ficha: respuesta?.ficha ?? null,
            entrada: respuesta?.entrada && typeof respuesta.entrada === 'object' ? respuesta.entrada : null,
        };
    }

    /** Sube un nivel (`POST /personajes/{id}/niveles`); los errores de la API llegan con su frase, `code` y `field`. */
    async subirNivel(idPersonaje: number, cuerpo: SubidaNivelDto): Promise<RespuestaSubidaNivel> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/niveles`, cuerpo, 'No se ha podido subir de nivel.');
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            subida: {
                idEvento: toInt(respuesta?.subida?.idEvento),
                numeroSesion: toInt(respuesta?.subida?.numeroSesion),
                nivel: toInt(respuesta?.subida?.nivel),
                nivelesPorSubir: Math.max(0, toInt(respuesta?.subida?.nivelesPorSubir)),
            },
        };
    }

    /** La corrección de la ficha (fase 6): queda en la sesión abierta (la de juego o la 0); el máster, con el aviso de lo que se salta. */
    async corregirFicha(idPersonaje: number, cuerpo: CorreccionFichaDto): Promise<RespuestaCorreccion> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('PUT', `${environment.apiUrl}personajes/${id}/ficha`, cuerpo, 'No se ha podido corregir la ficha.');
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            correccion: { idEvento: toInt(respuesta?.correccion?.idEvento), numeroSesion: toInt(respuesta?.correccion?.numeroSesion) },
        };
    }

    async abrir(idPersonaje: number, cuerpo: AbrirSesionDto = {}): Promise<RespuestaSesion> {
        return leerRespuestaSesion(await this.pedir('POST', this.ruta(idPersonaje), cuerpo, 'No se ha podido abrir la sesión.'));
    }

    async cambiar(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>, cambios: CambiarSesionDto): Promise<RespuestaSesion> {
        return leerRespuestaSesion(await this.pedir('PATCH', this.ruta(idPersonaje, sesion.numero),
            { ...cambios, version: sesion.version }, 'No se ha podido guardar la sesión.'));
    }

    async apuntar(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>, evento: EventoSesionDto): Promise<RespuestaSesion> {
        return this.conAviso(leerRespuestaSesion(await this.pedir('POST', `${this.ruta(idPersonaje, sesion.numero)}/eventos`,
            { ...evento, version: sesion.version }, 'No se ha podido apuntar.')));
    }

    async comprar(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>, compra: CompraSesionDto): Promise<RespuestaSesion> {
        return this.conAviso(leerRespuestaSesion(await this.pedir('POST', `${this.ruta(idPersonaje, sesion.numero)}/compras`,
            { ...compra, version: sesion.version }, 'No se ha podido guardar la compra.')));
    }

    async deshacer(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>): Promise<RespuestaSesion> {
        return leerRespuestaSesion(await this.pedir('POST', `${this.ruta(idPersonaje, sesion.numero)}/deshacer`,
            { version: sesion.version }, 'No se ha podido deshacer.'));
    }

    async cerrar(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>): Promise<RespuestaSesion> {
        return leerRespuestaSesion(await this.pedir('POST', `${this.ruta(idPersonaje, sesion.numero)}/cerrar`,
            { version: sesion.version }, 'No se ha podido cerrar la sesión.'));
    }

    async reabrir(idPersonaje: number, sesion: Pick<SesionPersonaje, 'numero' | 'version'>): Promise<RespuestaSesion> {
        return leerRespuestaSesion(await this.pedir('POST', `${this.ruta(idPersonaje, sesion.numero)}/reabrir`,
            { version: sesion.version }, 'No se ha podido reabrir la sesión.'));
    }

    /** Las escrituras que comprueban la política de la campaña: si un PNJ se ha saltado alguna regla, el aviso. */
    private conAviso(respuesta: RespuestaSesion): RespuestaSesion {
        avisarReglasIgnoradas(this.toasts, respuesta.reglasIgnoradas ?? []);
        return respuesta;
    }

    private ruta(idPersonaje: number, numero?: number): string {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const base = `${environment.apiUrl}personajes/${id}/sesiones`;
        return numero === undefined ? base : `${base}/${Math.max(0, toInt(numero))}`;
    }

    private async pedir<T>(metodo: 'GET' | 'POST' | 'PATCH' | 'PUT', url: string, cuerpo: unknown, porDefecto: string): Promise<T> {
        try {
            const headers = new HttpHeaders(await cabeceraApiConFirebase(this.auth));
            return await firstValueFrom(this.http.request<T>(metodo, url, { headers, ...(cuerpo !== undefined ? { body: cuerpo } : {}) }));
        } catch (error) {
            throw errorDePerfil(error, porDefecto);
        }
    }
}
