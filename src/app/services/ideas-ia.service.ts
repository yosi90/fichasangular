import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Personaje } from '../interfaces/personaje';
import { PlatformSessionService } from './platform-session.service';

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

    private estadoEnCurso: { hasta: number; promesa: Promise<DisponibilidadIa> } | null = null;
    private modelosEnCurso: { hasta: number; promesa: Promise<ModelosIaProveedor[]> } | null = null;

    constructor(private http: HttpClient, private platformSessionSvc: PlatformSessionService) { }

    /** Enlace a la gestión de las claves de IA y su tope en la web social. */
    get urlGestion(): string {
        return this.platformSessionSvc.urlSocial('claves-ia');
    }

    async disponibilidad(): Promise<DisponibilidadIa> {
        if (this.platformSessionSvc.estado.tipo !== 'con_sesion')
            return 'sin_sesion';
        const ahora = Date.now();
        if (!this.estadoEnCurso || this.estadoEnCurso.hasta < ahora)
            this.estadoEnCurso = { hasta: ahora + VIGENCIA_ESTADO_MS, promesa: this.consultarEstado() };
        return this.estadoEnCurso.promesa;
    }

    /** Olvida lo último que dijo la plataforma (tras un error de la clave, por ejemplo). */
    olvidarEstado(): void {
        this.estadoEnCurso = null;
    }

    /** Los modelos a los que llega la clave de la persona, por proveedor (`GET /v1/ia/modelos`). */
    async modelos(): Promise<ModelosIaProveedor[]> {
        const ahora = Date.now();
        if (!this.modelosEnCurso || this.modelosEnCurso.hasta < ahora) {
            const promesa = this.consultarModelos();
            this.modelosEnCurso = { hasta: ahora + VIGENCIA_MODELOS_MS, promesa };
            promesa.catch(() => this.modelosEnCurso = null);
        }
        return this.modelosEnCurso.promesa;
    }

    async pedir(tipo: TipoIdeaIa, datos: DatosIdeaIa): Promise<IdeaIa> {
        const cuerpo: Record<string, unknown> = { tipo, datos: limpiarDatos(datos) };
        const seleccion = this.seleccion();
        if (seleccion) {
            cuerpo['proveedor'] = seleccion.proveedor;
            cuerpo['modelo'] = seleccion.modelo;
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

    private async consultarEstado(): Promise<DisponibilidadIa> {
        try {
            const respuesta = await this.getPlataforma<{ proveedores?: { proveedor: string; estado: string }[] }>('/v1/ia/estado');
            const proveedores = Array.isArray(respuesta?.proveedores) ? respuesta.proveedores : [];
            return proveedores.some(p => p?.estado === 'lista') ? 'lista' : 'sin_clave';
        } catch {
            return 'no_disponible';
        }
    }

    private async consultarModelos(): Promise<ModelosIaProveedor[]> {
        const respuesta = await this.getPlataforma<{ proveedores?: any[] }>('/v1/ia/modelos');
        const proveedores = Array.isArray(respuesta?.proveedores) ? respuesta.proveedores : [];
        return proveedores
            .filter(p => p?.proveedor === 'anthropic' || p?.proveedor === 'openai')
            .map(p => ({
                proveedor: p.proveedor as ProveedorIa,
                modelos: (Array.isArray(p.modelos) ? p.modelos : [])
                    .filter((m: any) => typeof m?.id === 'string' && m.id.trim().length > 0)
                    .map((m: any) => ({ id: m.id, nombre: `${m.nombre ?? m.id}` })),
                error: typeof p.error === 'string' ? p.error : null,
            }));
    }

    private async getPlataforma<T>(ruta: string): Promise<T> {
        const token = await this.platformSessionSvc.tokenPlataforma();
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, Accept: 'application/json' });
        return firstValueFrom(this.http.get<T>(`${environment.plataforma.apiUrl}${ruta}`, { headers }));
    }

    private aError(error: unknown): IdeasIaError {
        if (error instanceof IdeasIaError)
            return error;
        if (error instanceof HttpErrorResponse) {
            const cuerpo = error.error && typeof error.error === 'object' ? error.error : {};
            const code = `${cuerpo.code ?? ''}`.trim();
            const mensaje = `${cuerpo.error ?? cuerpo.message ?? ''}`.trim();
            if (['sin_clave_de_ia', 'tope_sin_fijar', 'tope_de_gasto', 'clave_de_ia_rechazada'].includes(code))
                this.olvidarEstado();
            const field = typeof cuerpo.field === 'string' ? cuerpo.field : null;
            if (error.status === 0)
                return new IdeasIaError('No hay conexión con Rol. Revisa tu red y vuelve a probar.', 'sin_conexion', 0);
            return new IdeasIaError(mensaje || ERROR_GENERICO, code, error.status, field);
        }
        return new IdeasIaError(ERROR_GENERICO, '', 0);
    }
}

function texto(valor: unknown): string | undefined {
    const limpio = `${valor ?? ''}`.trim();
    return limpio.length > 0 ? limpio : undefined;
}

/** Quita lo vacío para no mandar campos sin nada. */
export function limpiarDatos(datos: DatosIdeaIa): DatosIdeaIa {
    const limpio: DatosIdeaIa = {};
    for (const campo of ['nombre', 'raza', 'alineamiento', 'deidad', 'genero', 'region', 'campana', 'trasfondo', 'personalidad'] as const) {
        const valor = texto(datos?.[campo]);
        if (valor)
            limpio[campo] = valor;
    }
    if (typeof datos?.edad === 'number' && Number.isFinite(datos.edad) && datos.edad > 0)
        limpio.edad = Math.trunc(datos.edad);
    else if (typeof datos?.edad === 'string' && texto(datos.edad))
        limpio.edad = texto(datos.edad);
    const clases: ClaseIdeaIa[] = [];
    for (const clase of datos?.clases ?? []) {
        const nombre = texto(clase?.nombre);
        const nivel = Number(clase?.nivel);
        if (nombre && clases.length < 10)
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
