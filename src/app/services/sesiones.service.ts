import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import {
    AbrirSesionDto,
    AdquirirPlantillaDto,
    AdquirirRazaMutadaDto,
    CAUSAS_NIVEL_PERDIDO,
    CausaNivelPerdido,
    ConversionMuertoViviente,
    CosteCobrado,
    CosteDePlantillaCobrado,
    RestablecerNivelDto,
    RespuestaRestablecimiento,
    PerderNivelDto,
    CambiarSesionDto,
    CompraSesionDto,
    CorreccionFichaDto,
    EventoSesionDto,
    ExperienciaPersonaje,
    HistorialSesiones,
    RespuestaCorreccion,
    RespuestaPerdida,
    RespuestaPlantilla,
    RespuestaRazaMutada,
    RespuestaSesion,
    RespuestaSubidaNivel,
    ResumenSesion,
    SesionConFicha,
    SesionEvento,
    SesionPersonaje,
    SubidaNivelDto,
    TipoEventoSesion,
    VueltaALaVidaDto,
    RespuestaVuelta,
    CausaMascotaPerdida,
    CosteDeLaMascota,
    MascotaPerdida,
    TIPOS_DE_MASCOTA,
    TipoDeMascota,
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
    'conjuro_copiado', 'subida_nivel', 'modificacion', 'correccion_master', 'plantilla_adquirida', 'raza_mutada_adquirida',
    'conversion_muerto_viviente', 'nivel_perdido', 'vuelta_a_la_vida',
    'nivel_restablecido', 'cambio_alineamiento', 'caida', 'expiacion', 'truco_ensenado', 'mascota_perdida', 'mascota_obtenida',
    'mascota_revivida', 'nota',
]);

const MASCOTAS: ReadonlySet<string> = new Set<string>(TIPOS_DE_MASCOTA);
const CAUSAS_MASCOTA: ReadonlySet<string> = new Set<CausaMascotaPerdida>(['muerte', 'liberacion', 'abandono']);

/** `mascotas` de `GET …/sesiones/{numero}` (contrato, «La mascota fuera del reciclaje»): el coste de cada una; sin ella, vacía. */
export function leerCostesDeLasMascotas(valor: unknown): CosteDeLaMascota[] {
    const numeroONulo = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : toInt(v));
    return (Array.isArray(valor) ? valor : [])
        .filter((m: any) => MASCOTAS.has(`${m?.mascota ?? ''}`))
        .map((m: any) => ({
            mascota: m.mascota as TipoDeMascota,
            tiene: m?.tiene === true,
            cd: numeroONulo(m?.cd),
            pxAntes: toInt(m?.pxAntes),
            pxSiFalla: toInt(m?.pxSiFalla),
            pxSiSupera: toInt(m?.pxSiSupera),
            bajaSiFalla: m?.bajaSiFalla === true,
            bajaSiSupera: m?.bajaSiSupera === true,
            poObtener: Number(m?.poObtener) || 0,
            horasObtener: numeroONulo(m?.horasObtener),
            esperaReemplazo: `${m?.esperaReemplazo ?? ''}`.trim() || null,
            tarifaPorClase: (Array.isArray(m?.tarifaPorClase) ? m.tarifaPorClase : []).map((t: any) => ({
                idClase: toInt(t?.idClase), clase: `${t?.clase ?? ''}`.trim(), nivel: toInt(t?.nivel), px: toInt(t?.px),
            })),
        }));
}

/** `mascotasPerdidas` de `GET …/sesiones/{numero}` (contrato, «La mascota fuera del reciclaje»); sin ella, vacía. */
export function leerMascotasPerdidas(valor: unknown): MascotaPerdida[] {
    return (Array.isArray(valor) ? valor : [])
        .filter((m: any) => MASCOTAS.has(`${m?.mascota ?? ''}`))
        .map((m: any) => ({
            idEvento: toInt(m?.idEvento),
            mascota: m.mascota as TipoDeMascota,
            nombre: `${m?.nombre ?? ''}`.trim(),
            idMonstruo: toInt(m?.idMonstruo),
            idPlantilla: toInt(m?.idPlantilla),
            causa: CAUSAS_MASCOTA.has(`${m?.causa ?? ''}`) ? m.causa as CausaMascotaPerdida : null,
            revivible: m?.revivible === true,
            esperaReemplazo: `${m?.esperaReemplazo ?? ''}`.trim() || null,
        }));
}

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
        nivelesRestablecibles: Math.max(0, toInt(valor?.nivelesRestablecibles)),
        sesiones: toArray(valor?.sesiones).map(leerSesion).sort((a, b) => a.numero - b.numero),
    };
}

/** Lo que costó adquirir una raza mutada, o `null` si la API no lo da. */
export function leerCosteCobrado(valor: any): CosteCobrado | null {
    if (!valor || typeof valor !== 'object')
        return null;
    return {
        px: toInt(valor.px),
        po: Number(valor.po) || 0,
        poCoste: Number(valor.poCoste) || 0,
        poPagadasPorOtro: valor.poPagadasPorOtro === true,
    };
}

/** Una referencia de la respuesta (una raza, una clase): su id y su nombre. */
function leerIdNombre(valor: any): { id: number; nombre: string; } {
    return { id: toInt(valor?.id), nombre: `${valor?.nombre ?? ''}` };
}

/** Las causas de un nivel perdido que da la API (`nivelesPerdidos[].causa`); otra, sin causa. */
const CAUSAS_CONOCIDAS: ReadonlySet<string> = new Set<string>(CAUSAS_NIVEL_PERDIDO);

/**
 * Lo que dice la conversión en muerto viviente (`razaMutada.conversion`), o `null` si la raza no lleva clase de monstruo:
 * el nivel que perdió (`null` sin niveles de clase), la clase de monstruo y los PX de antes y de después.
 */
export function leerConversion(valor: any): ConversionMuertoViviente | null {
    if (!valor || typeof valor !== 'object')
        return null;
    const perdida = valor.perdida && typeof valor.perdida === 'object' ? valor.perdida : null;
    return {
        perdida: perdida ? { clase: leerIdNombre(perdida.clase), nivelClase: toInt(perdida.nivelClase) } : null,
        claseDeMonstruo: leerIdNombre(valor.claseDeMonstruo),
        pxAntes: toInt(valor.pxAntes),
        pxDespues: toInt(valor.pxDespues),
    };
}

/** Lo que costó adquirir una plantilla (el de la raza mutada y los niveles), o `null` si la API no lo da. */
export function leerCosteDePlantilla(valor: any): CosteDePlantillaCobrado | null {
    const coste = leerCosteCobrado(valor);
    return coste ? { ...coste, niveles: toInt(valor.niveles) } : null;
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
            nivelesPerdidos: (Array.isArray(respuesta?.nivelesPerdidos) ? respuesta.nivelesPerdidos : []).map((n: any) => ({
                idClase: toInt(n?.idClase),
                nivelClase: toInt(n?.nivelClase),
                ordenConocido: n?.ordenConocido !== false,
                clasesAnteriores: (Array.isArray(n?.clasesAnteriores) ? n.clasesAnteriores : []).map((c: unknown) => toInt(c)),
                causa: CAUSAS_CONOCIDAS.has(`${n?.causa ?? ''}`) ? n.causa as CausaNivelPerdido : null,
                restablecible: n?.restablecible === true,
            })),
            mascotasPerdidas: leerMascotasPerdidas(respuesta?.mascotasPerdidas),
            mascotas: leerCostesDeLasMascotas(respuesta?.mascotas),
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

    /** Adquirir una plantilla (fase 7): queda en la sesión de juego abierta; el máster, con el aviso de lo que se salta. */
    async adquirirPlantilla(idPersonaje: number, cuerpo: AdquirirPlantillaDto): Promise<RespuestaPlantilla> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/plantillas`, cuerpo, 'No se ha podido adquirir la plantilla.');
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            plantilla: {
                idEvento: toInt(respuesta?.plantilla?.idEvento),
                numeroSesion: toInt(respuesta?.plantilla?.numeroSesion),
                id: toInt(respuesta?.plantilla?.plantilla?.id),
                nombre: `${respuesta?.plantilla?.plantilla?.nombre ?? ''}`,
                nepAntes: toIntOrNull(respuesta?.plantilla?.nepAntes),
                nepDespues: toIntOrNull(respuesta?.plantilla?.nepDespues),
                coste: leerCosteDePlantilla(respuesta?.plantilla?.coste),
            },
        };
    }

    /**
     * Adquirir una raza mutada (fase 7): queda en la sesión de juego abierta, con lo que costó; el máster, con el aviso de lo
     * que se salta. Con una raza que lleva una clase de monstruo, la conversión en muerto viviente (`conversion`).
     */
    async adquirirRazaMutada(idPersonaje: number, cuerpo: AdquirirRazaMutadaDto): Promise<RespuestaRazaMutada> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/raza-mutada`, cuerpo, 'No se ha podido adquirir la raza mutada.');
        const r = respuesta?.razaMutada;
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            razaMutada: {
                idEvento: toInt(r?.idEvento), numeroSesion: toInt(r?.numeroSesion), raza: leerIdNombre(r?.raza), razaBase: leerIdNombre(r?.razaBase),
                nepAntes: toIntOrNull(r?.nepAntes), nepDespues: toIntOrNull(r?.nepDespues), coste: leerCosteCobrado(r?.coste),
                conversion: leerConversion(r?.conversion),
            },
        };
    }

    /** Perder un nivel (fase 7, segunda tanda): queda en la sesión de juego abierta, con los PX que le quedan. */
    async perderNivel(idPersonaje: number, cuerpo: PerderNivelDto): Promise<RespuestaPerdida> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/niveles/perdida`, cuerpo, 'No se ha podido apuntar la pérdida del nivel.');
        const p = respuesta?.perdida ?? {};
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            perdida: {
                idEvento: toInt(p.idEvento),
                numeroSesion: toInt(p.numeroSesion),
                clase: p.clase ? leerIdNombre(p.clase) : null,
                nivelClase: toIntOrNull(p.nivelClase),
                nepAntes: toIntOrNull(p.nepAntes),
                nepDespues: toIntOrNull(p.nepDespues),
                pxAntes: toInt(p.pxAntes),
                pxDespues: toInt(p.pxDespues),
                constitucion: p.constitucion ? { antes: toInt(p.constitucion.antes), despues: toInt(p.constitucion.despues) } : null,
            },
        };
    }

    /**
     * Devolver la vida a un muerto viviente de clase de monstruo (*Libris Mortis*, pág. 35): queda en la sesión de juego
     * abierta, con los PX que le quedan, la raza de antes y lo que ha perdido.
     */
    async devolverLaVida(idPersonaje: number, cuerpo: VueltaALaVidaDto): Promise<RespuestaVuelta> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/vuelta-a-la-vida`, cuerpo,
            'No se ha podido devolver la vida al personaje.');
        const v = respuesta?.vuelta ?? {};
        const perdida = v.perdida && typeof v.perdida === 'object' ? v.perdida : null;
        const nivelNuevo = v.nivelNuevo && typeof v.nivelNuevo === 'object' ? v.nivelNuevo : null;
        const renumerado = v.renumerado && typeof v.renumerado === 'object' ? v.renumerado : null;
        const primerDg = renumerado?.primerDg && typeof renumerado.primerDg === 'object' ? renumerado.primerDg : null;
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            vuelta: {
                idEvento: toInt(v.idEvento),
                numeroSesion: toInt(v.numeroSesion),
                pierdeNivel: v.pierdeNivel === true,
                razaAntes: leerIdNombre(v.razaAntes),
                raza: leerIdNombre(v.raza),
                claseDeMonstruo: leerIdNombre(v.claseDeMonstruo),
                nivelesQuitados: Math.max(0, toInt(v.nivelesQuitados)),
                perdida: perdida ? { clase: leerIdNombre(perdida.clase), nivelClase: toInt(perdida.nivelClase) } : null,
                constitucion: v.constitucion ? { antes: toInt(v.constitucion.antes), despues: toInt(v.constitucion.despues) } : null,
                nivelNuevo: nivelNuevo ? { clase: leerIdNombre(nivelNuevo.clase) } : null,
                renumerado: renumerado ? {
                    puestos: Math.max(0, toInt(renumerado.puestos)),
                    primerDg: primerDg ? { clase: leerIdNombre(primerDg.clase), nivelClase: toInt(primerDg.nivelClase) } : null,
                } : null,
                nepAntes: toIntOrNull(v.nepAntes),
                nepDespues: toIntOrNull(v.nepDespues),
                pxAntes: toInt(v.pxAntes),
                pxDespues: toInt(v.pxDespues),
            },
        };
    }

    /** Restablecer el último nivel perdido por consunción de energía: vuelve tal como era (lo calcula la API). */
    async restablecerNivel(idPersonaje: number, cuerpo: RestablecerNivelDto): Promise<RespuestaRestablecimiento> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        const respuesta = await this.pedir<any>('POST', `${environment.apiUrl}personajes/${id}/niveles/restablecimiento`, cuerpo,
            'No se ha podido restablecer el nivel.');
        const r = respuesta?.restablecimiento ?? {};
        return {
            ...this.conAviso(leerRespuestaSesion(respuesta)),
            restablecimiento: {
                idEvento: toInt(r.idEvento),
                numeroSesion: toInt(r.numeroSesion),
                clase: r.clase ? leerIdNombre(r.clase) : null,
                nivelClase: r.nivelClase === null || r.nivelClase === undefined ? null : toInt(r.nivelClase),
                pxAntes: toInt(r.pxAntes),
                pxDespues: toInt(r.pxDespues),
                quedan: Math.max(0, toInt(r.quedan)),
            },
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
