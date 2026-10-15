import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

// La cuenta de Yosiftware en el navegador, por el SDK de la plataforma (ecosistema-kit/ACCESO.md). Rol no tiene
// formularios ni sesión propios: el SDK abre el acceso de Yosiftware sobre la web y da tokens de corta duración,
// que guarda él en memoria (nunca aquí).

export interface CuentaPlataforma {
    id: string;
    alias: string;
    correo: string | null;
    correoVerificado?: boolean;
    estado?: string;
    propietario?: boolean;
}

export interface RestriccionesPlataforma {
    alcances: string[];
    hasta?: string | number | null;
}

/** Normas propias de Rol que la persona aún no ha aceptado (el SDK se las enseña solo). */
export interface NormasPendientesPlataforma {
    id: number;
    version: number;
    titulo: string;
    importante: boolean;
    publicadas: string;
}

export type EstadoPlataforma =
    | { tipo: 'comprobando' }
    | { tipo: 'sin_sesion'; motivo?: string }
    | { tipo: 'no_disponible' }
    | { tipo: 'con_sesion'; cuenta: CuentaPlataforma; restricciones?: RestriccionesPlataforma; normasPendientes?: NormasPendientesPlataforma };

export interface DenunciaPlataforma {
    tipo: string;
    referencia: string | number;
    nombre?: string;
    extracto?: string;
    persona?: string;
}

// Lo que usa Rol del SDK (los tipos completos están en <SDK>/sdk/v1/yosiftware.d.ts).
interface YosiftwareSdk {
    readonly estado: EstadoPlataforma;
    listo(): Promise<EstadoPlataforma>;
    alCambiar(oyente: (estado: EstadoPlataforma) => void): () => void;
    entrar(opciones?: { vista?: 'entrar' | 'registro' }): Promise<boolean>;
    salir(): Promise<void>;
    token(): Promise<string | null>;
    editarPerfil(): Promise<boolean>;
    privacidad(opciones?: { recorrido?: boolean }): Promise<void>;
    reportar(opciones?: { tipo?: 'error' | 'propuesta' }): Promise<boolean>;
    denunciar(datos: DenunciaPlataforma): Promise<boolean>;
}

const REINTENTO_SDK_MS = 60_000;

let instancia: PlatformSessionService | null = null;

/** Token de la API de Rol (audiencia `fichas-api`) para la petición que se va a hacer. No se guarda. */
export function obtenerTokenApi(): Promise<string> {
    if (!instancia)
        return Promise.reject(new Error('Sesión no iniciada'));
    return instancia.tokenApi();
}

@Injectable({
    providedIn: 'root'
})
export class PlatformSessionService {
    private readonly estadoSubject = new BehaviorSubject<EstadoPlataforma>({ tipo: 'comprobando' });
    private cargaSdk: Promise<YosiftwareSdk> | null = null;
    private iniciado = false;

    readonly estado$ = this.estadoSubject.asObservable();

    constructor(private zone: NgZone) {
        instancia = this;
    }

    get estado(): EstadoPlataforma {
        return this.estadoSubject.value;
    }

    get cuenta(): CuentaPlataforma | null {
        const estado = this.estadoSubject.value;
        return estado.tipo === 'con_sesion' ? estado.cuenta : null;
    }

    /** URL de la web social, con una vista si se pide (`cuenta`, `privacidad`, `moderacion`…). */
    urlSocial(vista?: string): string {
        const base = environment.plataforma.socialUrl;
        return vista ? `${base}/?vista=${encodeURIComponent(vista)}` : base;
    }

    iniciar(): void {
        if (this.iniciado)
            return;
        this.iniciado = true;
        void this.conectar();
    }

    async tokenApi(): Promise<string> {
        const sdk = await this.cargarSdk();
        const token = await sdk.token();
        if (!token)
            throw new Error('Sesión no iniciada');
        return token;
    }

    async entrar(vista: 'entrar' | 'registro' = 'entrar'): Promise<boolean> {
        return (await this.cargarSdk()).entrar({ vista });
    }

    async salir(): Promise<void> {
        await (await this.cargarSdk()).salir();
    }

    async editarPerfil(): Promise<boolean> {
        return (await this.cargarSdk()).editarPerfil();
    }

    async privacidad(): Promise<void> {
        await (await this.cargarSdk()).privacidad();
    }

    async reportar(tipo?: 'error' | 'propuesta'): Promise<boolean> {
        return (await this.cargarSdk()).reportar(tipo ? { tipo } : undefined);
    }

    async denunciar(datos: DenunciaPlataforma): Promise<boolean> {
        return (await this.cargarSdk()).denunciar(datos);
    }

    private async conectar(): Promise<void> {
        try {
            const sdk = await this.cargarSdk();
            sdk.alCambiar((estado) => this.zone.run(() => this.estadoSubject.next(estado)));
            this.abrirReporteDesdeUrl(sdk);
        } catch {
            this.estadoSubject.next({ tipo: 'no_disponible' });
            setTimeout(() => void this.conectar(), REINTENTO_SDK_MS);
        }
    }

    // El SDK se carga siempre de la plataforma, nunca se empaqueta. Si falla (sin red), se reintenta después.
    private cargarSdk(): Promise<YosiftwareSdk> {
        this.cargaSdk ??= new Promise<YosiftwareSdk>((resolve, reject) => {
            const existente = (window as any).yosiftware as YosiftwareSdk | undefined;
            if (existente) {
                resolve(existente);
                return;
            }
            const script = document.createElement('script');
            script.type = 'module';
            script.src = environment.plataforma.sdkUrl;
            script.onload = () => {
                const sdk = (window as any).yosiftware as YosiftwareSdk | undefined;
                if (sdk)
                    resolve(sdk);
                else
                    reject(new Error('El SDK de la plataforma no se ha cargado.'));
            };
            script.onerror = () => {
                script.remove();
                reject(new Error('El SDK de la plataforma no responde.'));
            };
            document.head.appendChild(script);
        }).catch((error: unknown) => {
            this.cargaSdk = null;
            throw error;
        });
        return this.cargaSdk;
    }

    // ?reportar: la APK 3.5 Companion abre aquí los errores y propuestas (ecosistema-kit/APK.md).
    private abrirReporteDesdeUrl(sdk: YosiftwareSdk): void {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('reportar'))
            return;
        url.searchParams.delete('reportar');
        window.history.replaceState(window.history.state, '', url);
        void sdk.reportar();
    }
}
