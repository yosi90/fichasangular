import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Personaje } from '../interfaces/personaje';
import { cabecerasPlataforma, PlatformSessionService } from './platform-session.service';

// Ideas para los personajes con la clave de IA de cada persona (docs/publica/IDEAS_CON_IA.md). La web nunca ve la
// clave ni llama al proveedor: pregunta a la plataforma si hay una clave lista (`GET /v1/ia/estado`, con el token de
// la plataforma) y pide la idea a la API de Rol (`POST /personajes/ideas`), que llama por la pasarela.

export type TipoIdeaIa = 'personaje' | 'trasfondo' | 'personalidad' | 'frase';
export type ProveedorIa = 'anthropic' | 'openai';

export interface ClaseIdeaIa {
    nombre: string;
    nivel?: number | null;
}

/** Lo que se sabe del personaje; todo opcional (contrato: `PersonajeIdeaDatos`). */
export interface DatosIdeaIa {
    nombre?: string;
    raza?: string;
    clases?: ClaseIdeaIa[];
    alineamiento?: string;
    deidad?: string;
    genero?: string;
    edad?: string | number;
    region?: string;
    campana?: string;
    trasfondo?: string;
    personalidad?: string;
}

export interface IdeaIa {
    texto: string;
    proveedor: ProveedorIa;
    modelo: string;
    recortada: boolean;
}

/** Si se puede ofrecer: `lista` (algún proveedor con clave lista), `sin_clave` (enlazar la gestión) o nada. */
export type DisponibilidadIa = 'lista' | 'sin_clave' | 'sin_sesion' | 'no_disponible';

export interface ModeloIa {
    id: string;
    nombre: string;
}

export interface ModelosIaProveedor {
    proveedor: ProveedorIa;
    modelos: ModeloIa[];
    error: string | null;
}

export type ProveedorDeVoz = 'elevenlabs' | 'openai';

/** Los usos de `preferidos` en `GET /v1/ia/estado` (kit 1.54, `CLAVES_DE_IA.md`). */
export type UsoIa = 'texto' | 'imagen' | 'voz' | 'transcripcion';

/** Lo que dice `GET /v1/ia/estado`: qué proveedores tienen la clave lista y cuál prefiere la persona para cada uso. */
interface EstadoIa {
    disponibilidad: DisponibilidadIa;
    listos: string[];
    preferidos: Partial<Record<UsoIa, string | null>>;
}

export interface VozIa {
    id: string;
    nombre: string;
    idioma: string | null;
    /** `male`, `female` o lo que diga el proveedor; null si no lo dice. */
    genero: string | null;
    /** Un audio de muestra del proveedor, si lo hay. */
    muestra: string | null;
}

export interface VocesIaProveedor {
    proveedor: ProveedorDeVoz;
    voces: VozIa[];
    error: string | null;
}

/** Modelo elegido para las ideas; `null` deja el del backend (Claude Haiku 5.5 o GPT-5.4 mini). */
export interface SeleccionModeloIa {
    proveedor: ProveedorIa;
    modelo: string;
    nombre: string;
}

/** Error de `POST /personajes/ideas`, con el formato objetivo (`error`, `code`, `field`, `debug.requestId`). */
export class IdeasIaError extends Error {
    constructor(message: string, readonly code: string, readonly status: number, readonly field: string | null = null) {
        super(message);
        this.name = 'IdeasIaError';
    }

    /** Los que dependen de las claves de IA de la persona: se enlaza la gestión de su cuenta. */
    get esDeLaClave(): boolean {
        return ['sin_clave_de_ia', 'tope_sin_fijar', 'tope_de_gasto', 'clave_de_ia_rechazada'].includes(this.code);
    }
}

// Lo que dice la plataforma puede cambiar en cualquier momento (sube el tope, borra la clave, empieza el mes): se
// pregunta cerca del uso y se recuerda solo un momento, lo justo para que varios botones de la misma pantalla
// compartan la consulta.
const VIGENCIA_ESTADO_MS = 30_000;
const VIGENCIA_MODELOS_MS = 5 * 60_000;
const ERROR_GENERICO = 'No se ha podido pedir la idea. Inténtalo de nuevo.';

@Injectable({
    providedIn: 'root'
})
export class IdeasIaService {
    readonly seleccion = signal<SeleccionModeloIa | null>(null);
    /** Modelo elegido para las imágenes del personaje (de OpenAI); `null` deja el del backend (gpt-image-1-mini). */
    readonly seleccionImagen = signal<SeleccionModeloIa | null>(null);

    private estadoEnCurso: { hasta: number; promesa: Promise<EstadoIa> } | null = null;
    private modelosEnCurso: { hasta: number; promesa: Promise<any[]> } | null = null;

    constructor(private http: HttpClient, private platformSessionSvc: PlatformSessionService) { }

    /** Enlace a la gestión de las claves de IA y su tope en la web social. */
    get urlGestion(): string {
        return this.platformSessionSvc.urlSocial('claves-ia');
    }

    async disponibilidad(): Promise<DisponibilidadIa> {
        if (this.platformSessionSvc.estado.tipo !== 'con_sesion')
            return 'sin_sesion';
        return (await this.estado()).disponibilidad;
    }

    /**
     * El proveedor preferido de la persona para [uso], solo si su clave está lista (kit 1.54, «El proveedor preferido de
     * la persona»); `null` si no ha elegido o no está lista: entonces decide la web.
     */
    async preferido(uso: UsoIa): Promise<string | null> {
        if (this.platformSessionSvc.estado.tipo !== 'con_sesion')
            return null;
        const { listos, preferidos } = await this.estado();
        const elegido = preferidos[uso] ?? null;
        return elegido && listos.includes(elegido) ? elegido : null;
    }

    private estado(): Promise<EstadoIa> {
        const ahora = Date.now();
        if (!this.estadoEnCurso || this.estadoEnCurso.hasta < ahora)
            this.estadoEnCurso = { hasta: ahora + VIGENCIA_ESTADO_MS, promesa: this.consultarEstado() };
        return this.estadoEnCurso.promesa;
    }

    /** Olvida lo último que dijo la plataforma (tras un error de la clave, por ejemplo). */
    olvidarEstado(): void {
        this.estadoEnCurso = null;
    }

    /** Los modelos de texto a los que llega la clave de la persona, por proveedor (`GET /v1/ia/modelos`). */
    async modelos(): Promise<ModelosIaProveedor[]> {
        return (await this.modelosDeLaPlataforma())
            .filter(p => p?.proveedor === 'anthropic' || p?.proveedor === 'openai')
            .map(p => ({
                proveedor: p.proveedor as ProveedorIa,
                // Solo los que escriben texto: la lista trae también voz, imágenes y transcripción (kit 1.48 y 1.49).
                modelos: modelosDeUso(p, 'texto', true),
                error: typeof p.error === 'string' ? p.error : null,
            }));
    }

    /** Los modelos de imagen de OpenAI a los que llega la clave (`usos` `imagen`), para las imágenes del personaje. */
    async modelosDeImagen(): Promise<ModeloIa[]> {
        const openai = (await this.modelosDeLaPlataforma()).find(p => p?.proveedor === 'openai');
        return openai ? modelosDeUso(openai, 'imagen', false) : [];
    }

    private modelosDeLaPlataforma(): Promise<any[]> {
        const ahora = Date.now();
        if (!this.modelosEnCurso || this.modelosEnCurso.hasta < ahora) {
            const promesa = this.getPlataforma<{ proveedores?: any[] }>('/v1/ia/modelos')
                .then(respuesta => Array.isArray(respuesta?.proveedores) ? respuesta.proveedores : []);
            this.modelosEnCurso = { hasta: ahora + VIGENCIA_MODELOS_MS, promesa };
            promesa.catch(() => this.modelosEnCurso = null);
        }
        return this.modelosEnCurso.promesa;
    }

    async pedir(tipo: TipoIdeaIa, datos: DatosIdeaIa): Promise<IdeaIa> {
        const limpios = limpiarDatos(datos);
        // La API lo rechazaría igual (kit 1.58): se avisa sin llamar.
        const largo = datoDemasiadoLargo(limpios);
        if (largo)
            throw largo;
        const cuerpo: Record<string, unknown> = { tipo, datos: limpios };
        const seleccion = this.seleccion();
        if (seleccion) {
            cuerpo['proveedor'] = seleccion.proveedor;
            cuerpo['modelo'] = seleccion.modelo;
        } else {
            // Sin modelo elegido, el proveedor preferido de la persona para el texto, si está listo (kit 1.54); si no,
            // la API prueba Anthropic y después OpenAI, y la idea dice con cuál se hizo.
            const preferido = await this.preferido('texto');
            if (preferido === 'anthropic' || preferido === 'openai')
                cuerpo['proveedor'] = preferido;
        }
        let token: string;
        try {
            // El mismo token que `obtenerTokenApi()` (audiencia `fichas-api`), por el servicio inyectado.
            token = await this.platformSessionSvc.tokenApi();
        } catch {
            throw new IdeasIaError('Tienes que iniciar sesión.', 'UNAUTHORIZED', 401);
        }
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        });
        try {
            const respuesta = await firstValueFrom(
                this.http.post<IdeaIa>(`${environment.apiUrl}personajes/ideas`, cuerpo, { headers })
            );
            const texto = `${respuesta?.texto ?? ''}`.trim();
            if (!texto)
                throw new IdeasIaError('La IA no ha devuelto ningún texto. Vuelve a probar.', 'respuesta_vacia', 502);
            return {
                texto,
                proveedor: respuesta.proveedor,
                modelo: `${respuesta.modelo ?? ''}`,
                recortada: respuesta.recortada === true,
            };
        } catch (error) {
            throw this.aError(error);
        }
    }

    private async consultarEstado(): Promise<EstadoIa> {
        try {
            const respuesta = await this.getPlataforma<{
                proveedores?: { proveedor: string; estado: string }[];
                preferidos?: Partial<Record<UsoIa, string | null>>;
            }>('/v1/ia/estado');
            const proveedores = Array.isArray(respuesta?.proveedores) ? respuesta.proveedores : [];
            const listos = proveedores.filter(p => p?.estado === 'lista').map(p => p.proveedor);
            const preferidos = respuesta?.preferidos && typeof respuesta.preferidos === 'object' ? respuesta.preferidos : {};
            return { disponibilidad: listos.length ? 'lista' : 'sin_clave', listos, preferidos };
        } catch {
            return { disponibilidad: 'no_disponible', listos: [], preferidos: {} };
        }
    }

    /** Las voces de la persona, por proveedor (`GET /v1/ia/voces`): se eligen de una lista, nunca escritas. */
    async voces(): Promise<VocesIaProveedor[]> {
        const respuesta = await this.getPlataforma<{ proveedores?: any[] }>('/v1/ia/voces');
        const proveedores = Array.isArray(respuesta?.proveedores) ? respuesta.proveedores : [];
        return proveedores
            .filter(p => p?.proveedor === 'elevenlabs' || p?.proveedor === 'openai')
            .map(p => ({
                proveedor: p.proveedor as ProveedorDeVoz,
                voces: (Array.isArray(p.voces) ? p.voces : [])
                    .filter((v: any) => typeof v?.id === 'string' && v.id.trim().length > 0)
                    .map((v: any) => ({ id: v.id, nombre: `${v.nombre ?? v.id}`, idioma: v.idioma ?? null, genero: v.genero ?? null, muestra: v.muestra ?? null })),
                error: typeof p.error === 'string' ? p.error : null,
            }));
    }

    private async getPlataforma<T>(ruta: string): Promise<T> {
        const headers = await cabecerasPlataforma(this.platformSessionSvc);
        return firstValueFrom(this.http.get<T>(`${environment.plataforma.apiUrl}${ruta}`, { headers }));
    }

    private aError(error: unknown): IdeasIaError {
        const traducido = errorDeIa(error, ERROR_GENERICO);
        if (traducido.esDeLaClave)
            this.olvidarEstado();
        return traducido;
    }
}

/** Los modelos de un proveedor de `GET /v1/ia/modelos` para [uso]; sin `usos`, se cuentan si [sinUsos]. */
function modelosDeUso(proveedor: any, uso: string, sinUsos: boolean): ModeloIa[] {
    return (Array.isArray(proveedor?.modelos) ? proveedor.modelos : [])
        .filter((m: any) => typeof m?.id === 'string' && m.id.trim().length > 0)
        .filter((m: any) => Array.isArray(m?.usos) ? m.usos.includes(uso) : sinUsos)
        .map((m: any) => ({ id: m.id, nombre: `${m.nombre ?? m.id}` }));
}

/**
 * Un error de una ruta de Rol que usa la IA (`POST /personajes/ideas`, `/personajes/{id}/voces` e `/imagenes`), con el formato
 * objetivo de errores: su frase se puede enseñar tal cual.
 */
/**
 * Cabeceras para las rutas de la API de Rol que también atienden sin sesión (las voces y las imágenes de un personaje
 * público): con sesión, el token de la API; sin ella, ninguna, o el error si la acción la necesita.
 */
export async function cabecerasConSesionOpcional(sesion: Pick<PlatformSessionService, 'estado' | 'tokenApi'>, obligatoria: boolean): Promise<HttpHeaders> {
    if (sesion.estado.tipo !== 'con_sesion') {
        if (obligatoria)
            throw new IdeasIaError('Tienes que iniciar sesión.', 'UNAUTHORIZED', 401);
        return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${await sesion.tokenApi()}` });
}

export function errorDeIa(error: unknown, porDefecto: string): IdeasIaError {
    if (error instanceof IdeasIaError)
        return error;
    if (error instanceof HttpErrorResponse) {
        const cuerpo = error.error && typeof error.error === 'object' ? error.error : {};
        const code = `${cuerpo.code ?? ''}`.trim();
        const mensaje = `${cuerpo.error ?? cuerpo.message ?? ''}`.trim();
        const field = typeof cuerpo.field === 'string' ? cuerpo.field : null;
        if (error.status === 0)
            return new IdeasIaError('No hay conexión con Rol. Revisa tu red y vuelve a probar.', 'sin_conexion', 0);
        return new IdeasIaError(mensaje || porDefecto, code, error.status, field);
    }
    return new IdeasIaError(porDefecto, '', 0);
}

function texto(valor: unknown): string | undefined {
    const limpio = `${valor ?? ''}`.trim();
    return limpio.length > 0 ? limpio : undefined;
}

/** Un texto corto en una línea, con los espacios de sobra quitados, como lo cuenta la API. */
function textoCorto(valor: unknown): string | undefined {
    return texto(`${valor ?? ''}`.replace(/\s+/g, ' '));
}

type CampoDeTextoIa = 'nombre' | 'raza' | 'alineamiento' | 'deidad' | 'genero' | 'edad' | 'region' | 'campana' | 'trasfondo' | 'personalidad';

/**
 * La longitud máxima de cada dato que va a la IA y cómo se nombra en el aviso, igual que la API
 * (`docs/publica/endpoints/personajes.md`, `POST /personajes/ideas`; kit 1.58). Por encima no se pide la idea.
 */
export const LIMITES_DATOS_IA: Record<CampoDeTextoIa, { maximo: number; nombre: string }> = {
    nombre: { maximo: 150, nombre: 'El nombre' },
    raza: { maximo: 100, nombre: 'La raza' },
    alineamiento: { maximo: 60, nombre: 'El alineamiento' },
    deidad: { maximo: 100, nombre: 'La deidad' },
    genero: { maximo: 60, nombre: 'El género' },
    edad: { maximo: 40, nombre: 'La edad' },
    region: { maximo: 100, nombre: 'La región' },
    campana: { maximo: 150, nombre: 'El nombre de la campaña' },
    trasfondo: { maximo: 20000, nombre: 'El trasfondo' },
    personalidad: { maximo: 10000, nombre: 'La personalidad' },
};
export const MAX_CLASES_IA = 10;
export const MAX_NOMBRE_CLASE_IA = 100;
/** Lo que dice el personaje con su voz (`POST /personajes/{id}/voces`). */
export const MAX_FRASE_VOZ_IA = 300;
/** Los detalles del aspecto para generar su imagen (`POST /personajes/{id}/imagenes/{tipo}/ia`). */
export const MAX_DETALLES_IMAGEN_IA = 2000;

/** El primer dato que pasa de su máximo, con el mismo error que daría la API (`400 texto_demasiado_largo`); o `null`. */
export function datoDemasiadoLargo(datos: DatosIdeaIa): IdeasIaError | null {
    for (const [campo, { maximo, nombre }] of Object.entries(LIMITES_DATOS_IA)) {
        const valor = datos[campo as CampoDeTextoIa];
        if (valor !== undefined && `${valor}`.length > maximo)
            return demasiadoLargo(nombre, maximo, `datos.${campo}`);
    }
    const clase = (datos.clases ?? []).find(c => c.nombre.length > MAX_NOMBRE_CLASE_IA);
    return clase ? demasiadoLargo('El nombre de una clase', MAX_NOMBRE_CLASE_IA, 'datos.clases.nombre') : null;
}

function demasiadoLargo(nombre: string, maximo: number, field: string): IdeasIaError {
    return new IdeasIaError(`${nombre}: como mucho, ${cifra(maximo)} caracteres.`, 'texto_demasiado_largo', 400, field);
}

/** Como la API: de cinco dígitos en adelante, con un espacio fino de no separación entre los millares («20 000»). */
export function cifra(numero: number): string {
    return numero >= 10000 ? `${numero}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : `${numero}`;
}

/** Quita lo vacío para no mandar campos sin nada (y los espacios de sobra de los textos cortos). */
export function limpiarDatos(datos: DatosIdeaIa): DatosIdeaIa {
    const limpio: DatosIdeaIa = {};
    for (const campo of ['nombre', 'raza', 'alineamiento', 'deidad', 'genero', 'region', 'campana'] as const) {
        const valor = textoCorto(datos?.[campo]);
        if (valor)
            limpio[campo] = valor;
    }
    for (const campo of ['trasfondo', 'personalidad'] as const) {
        const valor = texto(datos?.[campo]);
        if (valor)
            limpio[campo] = valor;
    }
    if (typeof datos?.edad === 'number' && Number.isFinite(datos.edad) && datos.edad > 0)
        limpio.edad = Math.trunc(datos.edad);
    else if (typeof datos?.edad === 'string' && textoCorto(datos.edad))
        limpio.edad = textoCorto(datos.edad);
    const clases: ClaseIdeaIa[] = [];
    for (const clase of datos?.clases ?? []) {
        const nombre = textoCorto(clase?.nombre);
        const nivel = Number(clase?.nivel);
        if (nombre && clases.length < MAX_CLASES_IA)
            clases.push({ nombre, nivel: Number.isInteger(nivel) && nivel > 0 ? nivel : null });
    }
    if (clases.length > 0)
        limpio.clases = clases;
    return limpio;
}

/** Los datos de un personaje (en creación o ya guardado) para pedir ideas. */
export function datosIdeaDePersonaje(pj: Partial<Personaje> | null | undefined): DatosIdeaIa {
    if (!pj)
        return {};
    const campana = texto(pj.Campana);
    return limpiarDatos({
        nombre: pj.Nombre,
        raza: pj.Raza?.Nombre,
        clases: (pj.desgloseClases ?? []).map(c => ({ nombre: c?.Nombre, nivel: c?.Nivel })),
        alineamiento: pj.Alineamiento,
        deidad: pj.Deidad,
        genero: pj.Genero,
        edad: pj.Edad,
        region: pj.Region?.Nombre,
        campana: campana && campana !== 'Sin campaña' ? campana : undefined,
        trasfondo: pj.Contexto,
        personalidad: pj.Personalidad,
    });
}

/** Junta el texto nuevo con el que ya había: lo sustituye o lo añade al final, con una línea en blanco. */
export function combinarTexto(actual: string | null | undefined, nuevo: string, modo: 'sustituir' | 'anadir'): string {
    const previo = `${actual ?? ''}`.trimEnd();
    if (modo === 'sustituir' || previo.trim().length < 1)
        return nuevo.trim();
    return `${previo}\n\n${nuevo.trim()}`;
}
