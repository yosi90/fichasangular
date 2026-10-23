import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
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

/** Una conversación de la bandeja del chat de la plataforma: lo que Rol usa para titular su ventana. */
export interface ConversacionChatPlataforma {
    id: number;
    tipo: 'directa' | 'grupo' | 'web';
    titulo: string | null;
    /** En las directas, la otra persona. */
    persona: { id: string; alias: string; nombre: string | null; avatar: { miniatura: string } | null; borrada?: boolean } | null;
    web: { clave: string; nombre: string } | null;
}

/** Lo que avisa la ventana de invitaciones del SDK al aceptar una (evento `yosiftware:espacio`). */
export interface EspacioAceptado {
    id: number;
    idExterno: string;
}

/** Bloque de ajustes de Rol en la plataforma (`yosiftware.ajustes`): solo lo lee y lo escribe esta web. */
export interface BloqueAjustes {
    version: number;
    documento: Record<string, unknown>;
}

// Lo que usa Rol del SDK (los tipos completos están en <SDK>/sdk/v1/yosiftware.d.ts).
interface YosiftwareSdk {
    readonly estado: EstadoPlataforma;
    listo(): Promise<EstadoPlataforma>;
    alCambiar(oyente: (estado: EstadoPlataforma) => void): () => void;
    entrar(opciones?: { vista?: 'entrar' | 'registro' }): Promise<boolean>;
    salir(): Promise<void>;
    token(): Promise<string | null>;
    tokenPlataforma(): Promise<string | null>;
    editarPerfil(): Promise<boolean>;
    privacidad(opciones?: { recorrido?: boolean }): Promise<void>;
    reportar(opciones?: { tipo?: 'error' | 'propuesta' }): Promise<boolean>;
    denunciar(datos: DenunciaPlataforma): Promise<boolean>;
    chat: {
        abrir(idConversacion?: number): boolean;
        alCambiarNoLeidos(oyente: (noLeidos: number) => void): () => void;
        conversaciones(): Promise<ConversacionChatPlataforma[] | null>;
    };
    ajustes: {
        leer(): Promise<BloqueAjustes | null>;
        guardar(cambios: Record<string, unknown>): Promise<BloqueAjustes>;
    };
    espacios: {
        verInvitaciones(opciones?: { codigo?: string }): Promise<void>;
    };
}

const REINTENTO_SDK_MS = 60_000;

let instancia: PlatformSessionService | null = null;

/**
 * La página se está recargando porque ha cambiado la cuenta: quien avise al salir de la página («¿Seguro que quieres
 * salir?») no debe frenarlo, o se quedaría a la vista lo de la cuenta anterior.
 */
export function recargandoPorCambioDeIdentidad(): boolean {
    return instancia?.recargando ?? false;
}

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
    /** La última cuenta que ha visto la web en esta carga de la página. */
    private cuentaConfirmada: string | null = null;
    recargando = false;

    private readonly espacioAceptadoSubject = new Subject<EspacioAceptado>();

    readonly estado$ = this.estadoSubject.asObservable();
    /** Se ha aceptado una invitación a una campaña en la ventana del SDK (ecosistema-kit/ESPACIOS.md). */
    readonly espacioAceptado$ = this.espacioAceptadoSubject.asObservable();

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

    /** La APK de 3.5 Companion, que sirve la plataforma desde «Apps» de la web social (`GET /v1/webs/rol/apk`). */
    readonly urlCompanion = `${environment.plataforma.apiUrl}/v1/webs/rol/apk`;

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

    /** Token de la API de la plataforma (audiencia `cuentas`), para lo social de las páginas de comunidad. */
    async tokenPlataforma(): Promise<string> {
        const token = await (await this.cargarSdk()).tokenPlataforma();
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

    /**
     * Abre el chat flotante de la plataforma (`<yosi-chat>`, solo en el móvil), en una conversación si se indica
     * (ecosistema-kit/CHAT.md). En escritorio, el chat es el de Rol: `ChatFloatingService.abrir`.
     */
    async abrirChat(idConversacion?: number): Promise<boolean> {
        return (await this.cargarSdk()).chat.abrir(idConversacion);
    }

    /** Conversaciones con mensajes sin leer, más invitaciones a grupos: avisa ahora y en cada cambio. */
    async alCambiarNoLeidosChat(oyente: (noLeidos: number) => void): Promise<() => void> {
        const sdk = await this.cargarSdk();
        return sdk.chat.alCambiarNoLeidos((noLeidos) => this.zone.run(() => oyente(noLeidos)));
    }

    /** La bandeja del chat, la de actividad más reciente primero; `null` sin sesión. */
    async conversacionesChat(): Promise<ConversacionChatPlataforma[] | null> {
        return (await this.cargarSdk()).chat.conversaciones();
    }

    /**
     * La ventana de la plataforma con las invitaciones pendientes a campañas, para aceptarlas o rechazarlas. El SDK
     * la abre solo con los enlaces `#yosi-invitacion=<código>` (correo) y `#yosi-invitaciones` (campana).
     */
    async verInvitacionesEspacios(): Promise<void> {
        await (await this.cargarSdk()).espacios.verInvitaciones();
    }

    /** Los ajustes de Rol de la cuenta; `null` sin sesión. */
    async leerAjustes(): Promise<BloqueAjustes | null> {
        return (await this.cargarSdk()).ajustes.leer();
    }

    /** Guarda claves de primer nivel (`null` quita la clave) y devuelve el bloque resultante. */
    async guardarAjustes(cambios: Record<string, unknown>): Promise<BloqueAjustes> {
        return (await this.cargarSdk()).ajustes.guardar(cambios);
    }

    private async conectar(): Promise<void> {
        try {
            const sdk = await this.cargarSdk();
            sdk.alCambiar((estado) => this.zone.run(() => this.aplicarEstado(estado)));
            window.addEventListener('yosiftware:identidad', () => this.zone.run(() => {
                if (this.cuentaConfirmada)
                    this.recargarPorCambioDeIdentidad();
            }));
            window.addEventListener('yosiftware:espacio', (evento) => this.zone.run(() => this.alResolverInvitacion(evento)));
            this.abrirReporteDesdeUrl(sdk);
        } catch {
            this.estadoSubject.next({ tipo: 'no_disponible' });
            setTimeout(() => void this.conectar(), REINTENTO_SDK_MS);
        }
    }

    /**
     * Cambio de cuenta (ecosistema-kit/CAMBIO_DE_CUENTA.md): de A a B, de A a sin sesión, o el aviso
     * `yosiftware:identidad` del SDK (que llega antes de confirmar y cubre A → B → A). Rol guarda datos de la cuenta en
     * muchos servicios, pestañas, ventanas del chat, temporizadores y suscripciones; en vez de limpiarlos uno a uno, la
     * página se recarga antes de que nadie vea la cuenta nueva. Así nada de A queda en memoria ni llega tarde. Los
     * borradores de A se guardan con su `beforeunload`, en las claves de A (cada entorno tiene su origen y sus cuentas).
     */
    private aplicarEstado(estado: EstadoPlataforma): void {
        const anterior = this.cuentaConfirmada;
        const cambia = estado.tipo === 'sin_sesion'
            || (estado.tipo === 'con_sesion' && estado.cuenta.id !== anterior);
        if (anterior && cambia) {
            this.recargarPorCambioDeIdentidad();
            return;
        }
        if (estado.tipo === 'con_sesion')
            this.cuentaConfirmada = estado.cuenta.id;
        this.estadoSubject.next(estado);
    }

    private recargarPorCambioDeIdentidad(): void {
        if (this.recargando)
            return;
        this.recargando = true;
        this.recargarPagina();
    }

    protected recargarPagina(): void {
        window.location.reload();
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
            // El aspecto de Rol para lo que pinta el SDK, también en sus ventanas (ecosistema-kit/ESTILOS.md).
            // Se sirve con `no-cache` (firebase.json); la versión fuerza a pedirla de nuevo a quien la guardó antes.
            script.dataset['estilos'] = '/assets/yosiftware.css?v=2';
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

    private alResolverInvitacion(evento: Event): void {
        const detalle = (evento as CustomEvent).detail;
        const id = Number(detalle?.espacio?.id);
        if (detalle?.tipo !== 'aceptada' || !Number.isFinite(id))
            return;
        this.espacioAceptadoSubject.next({ id, idExterno: `${detalle.espacio.idExterno ?? ''}` });
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
