import { PersonajeCompraConjuroLibroDto, PersonajeCompraPiezaDto, PersonajeCreateRequestDto } from './personajes-api';
import type { ReglaIgnorada } from '../services/utils/reglas-ignoradas';

/*
 * Las sesiones de un personaje y su historial (`docs/publica/endpoints/personajes.md`, «Sesiones e historial»; guía
 * `docs/publica/SESIONES_FRONT.md`). Cada sesión es una versión de la ficha, con sus eventos (cada uno con su frase, que
 * genera la API y la web enseña tal cual) y su relato. La 0 es la creación.
 */

/** Los PX del personaje (`ExperienciaPersonaje`): en la ficha (`experiencia` de `GET /personajes/{id}`) y en cada respuesta. */
export interface ExperienciaPersonaje {
    px: number;
    /** El que cuenta para los PX (el NEP; sin él, su nivel de personaje). */
    nivel: number;
    /** Los PX de su nivel y del siguiente (Manual del jugador, tabla 3-2). */
    pxNivelActual: number;
    pxSiguienteNivel: number;
    puedeSubir: boolean;
    /** Cuántos niveles le dan sus PX (con PX para varios se proponen todos, uno detrás de otro). */
    nivelesPorSubir: number;
    sesionAbierta: { numero: number; titulo: string; } | null;
}

export type TipoEventoSesion =
    | 'alta'
    | 'experiencia'
    | 'experiencia_gastada'
    | 'dinero'
    | 'objeto_obtenido'
    | 'objeto_perdido'
    | 'venta'
    | 'compra'
    | 'conjuro_copiado'
    | 'subida_nivel'
    /** La corrección de la ficha del jugador o del máster (fase 6, `PUT /personajes/{id}/ficha`). */
    | 'modificacion'
    | 'correccion_master'
    | 'nota';

export type ActorRolSesion = 'jugador' | 'master' | 'sistema';

/** Un evento de una sesión (`SesionEvento`). `px` y `po` llevan su signo. */
export interface SesionEvento {
    id: number;
    orden: number;
    tipo: TipoEventoSesion;
    /** La frase para el jugador: la genera la API al guardarlo y no cambia. */
    texto: string;
    actorRol: ActorRolSesion;
    creadoUtc: string | null;
    pxBrutos: number | null;
    pxPenalizacion: number | null;
    px: number | null;
    po: number | null;
    idPersonajeEquipo: number | null;
    idConjuro: number | null;
    idClase: number | null;
    nivelClase: number | null;
    /** Solo el último de una sesión abierta (nunca el `alta`). */
    deshacible: boolean;
}

/** PX, saldo en po y NEP al abrirla y ahora (o al cerrarla); `poInicio` puede faltar en la sesión 0. */
export interface ResumenSesion {
    pxInicio: number | null;
    pxFin: number | null;
    poInicio: number | null;
    poFin: number | null;
    nepInicio: number | null;
    nepFin: number | null;
}

export type EstadoSesion = 'abierta' | 'cerrada';

/** Una sesión (`SesionPersonaje`), como la devuelven las lecturas y las escrituras. */
export interface SesionPersonaje {
    id: number;
    numero: number;
    titulo: string;
    /** `AAAA-MM-DD`. */
    fechaJuego: string | null;
    estado: EstadoSesion;
    /** La sesión 0 sintética de una ficha de antes del historial. */
    sinHistorial: boolean;
    abiertaUtc: string | null;
    cerradaUtc: string | null;
    resumen: ResumenSesion;
    relato: string;
    eventos: SesionEvento[];
    /** Solo para el dueño y el máster (`veNotas`); a los demás, `null`. */
    notas: string | null;
    /** La `RowVersion` de la sesión: va en el cuerpo de la siguiente escritura. */
    version: string;
}

/** `GET /personajes/{id}/sesiones`. */
export interface HistorialSesiones {
    idPersonaje: number;
    puedeApuntar: boolean;
    veNotas: boolean;
    /** Con qué rol apunta (`jugador` o `master`; `null` si no apunta): lo que solo corrige el máster (fase 6). */
    rolActor: 'jugador' | 'master' | null;
    experiencia: ExperienciaPersonaje | null;
    sesiones: SesionPersonaje[];
}

/**
 * `GET /personajes/{id}/sesiones/{numero}`: la sesión con la ficha de esa versión (la de `GET /personajes/{id}`, cruda:
 * la normaliza `PersonajeService.fichaDeApi`) y, para quien apunta, su `entrada` (el cuerpo del alta de esa versión, con
 * sus `niveles`: el punto de partida de la subida de nivel; `null` para quien no apunta).
 */
export interface SesionConFicha {
    sesion: SesionPersonaje;
    ficha: unknown;
    entrada?: PersonajeCreateRequestDto | null;
}

/** El cuerpo de `POST /personajes/{id}/niveles`: la ficha completa con un nivel más, la clase y la tirada de PG. */
export interface SubidaNivelDto {
    idClase: number;
    /** La tirada del DG nuevo y todas las que se hicieron (sin DG, sin `pg`). */
    pg?: { tirada: number; tiradas?: number[]; };
    ficha: PersonajeCreateRequestDto;
    version: string;
}

/** Lo que responde la subida: la sesión, los PX y la subida (cuántos niveles le quedan por subir). */
export interface RespuestaSubidaNivel {
    sesion: SesionPersonaje;
    experiencia: ExperienciaPersonaje | null;
    subida: { idEvento: number; numeroSesion: number; nivel: number; nivelesPorSubir: number; };
}

/** Lo que responde cada escritura: la sesión con su `version` nueva y los PX de ahora. */
export interface RespuestaSesion {
    sesion: SesionPersonaje;
    experiencia: ExperienciaPersonaje | null;
    /** En los eventos y las compras. */
    idEvento?: number | null;
    /** Lo que un PNJ se ha saltado de la política de su campaña (eventos, compras y subida; desde el 2026-11-12). */
    reglasIgnoradas?: ReglaIgnorada[];
    /** En deshacer. */
    deshecho?: { id: number; tipo: TipoEventoSesion; texto: string; } | null;
}

/** El cuerpo de `PUT /personajes/{id}/ficha`: la ficha completa con lo corregido (fase 6). */
export interface CorreccionFichaDto {
    ficha: PersonajeCreateRequestDto;
    version: string;
    /** Por qué se corrige (como mucho `MAXIMO_MOTIVO_CORRECCION`). */
    motivo?: string;
}

/** Lo que responde la corrección: la sesión donde queda, los PX y su evento. */
export interface RespuestaCorreccion extends RespuestaSesion {
    correccion: { idEvento: number; numeroSesion: number; };
}

/** El cuerpo de abrir una sesión (todo opcional). */
export interface AbrirSesionDto {
    titulo?: string;
    fechaJuego?: string;
    notas?: string;
}

/** El cuerpo de `PATCH …/sesiones/{numero}`: solo lo que llega; `null` borra la fecha o las notas. */
export interface CambiarSesionDto {
    titulo?: string;
    fechaJuego?: string | null;
    notas?: string | null;
}

export type OrigenObjetoObtenido = 'botin' | 'regalo';

/** Los eventos que se apuntan con `POST …/{numero}/eventos` (sin la `version`, que la pone el servicio). */
export type EventoSesionDto =
    | { tipo: 'experiencia'; px: number; concepto?: string; }
    | { tipo: 'experiencia_gastada'; px: number; concepto?: string; }
    | { tipo: 'dinero'; po: number; concepto?: string; }
    | { tipo: 'objeto_obtenido'; origen: OrigenObjetoObtenido; pieza: PersonajeCompraPiezaDto; }
    | { tipo: 'objeto_perdido'; idPersonajeEquipo: number; cantidad?: number; concepto?: string; }
    | { tipo: 'venta'; idPersonajeEquipo: number; cantidad?: number; }
    | { tipo: 'conjuro_copiado'; idConjuro: number; idClase: number; }
    | { tipo: 'nota'; texto: string; };

/** El cuerpo de `POST …/{numero}/compras` (sin la `version`): añade y cobra del saldo, sin `dineroInicial`. */
export interface CompraSesionDto {
    piezas?: PersonajeCompraPiezaDto[];
    conjurosLibro?: PersonajeCompraConjuroLibroDto[];
}

/** Lo que dicen los límites del contrato. */
export const MAXIMO_TITULO_SESION = 150;
export const MAXIMO_NOTAS_SESION = 4000;
export const MAXIMO_CONCEPTO_EVENTO = 150;
export const MAXIMO_TEXTO_NOTA = 990;
export const MAXIMO_MOTIVO_CORRECCION = 150;
