import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, InjectionToken, NgZone, OnDestroy, Optional } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Subscription, distinctUntilChanged, map } from 'rxjs';
import { EstadoPlataforma, PlatformSessionService } from '../platform-session.service';
import { clavePorCuenta, guardarPreferenciaLocal, leerPreferenciaLocal } from '../utils/preferencia-local';
import {
    MODO_POR_DEFECTO,
    ModoEfectivo,
    ModoWeb,
    TEMA_POR_DEFECTO,
    TemaWeb,
    definicionTema,
    esModoWeb,
    esTemaWeb,
    modoEfectivo,
} from './temas-web';

/** La copia local del tema de cada cuenta («rol.tema.<cuenta>»; sin sesión, «rol.tema.sin-cuenta»). */
export const PREFIJO_TEMA_LOCAL = 'rol.tema';
export const CLAVE_TEMA_SIN_CUENTA = 'rol.tema.sin-cuenta';
/** El último tema pintado en este navegador: solo para la primera pintura, antes de saber la cuenta. */
export const CLAVE_TEMA_ULTIMO = 'rol.tema.ultimo';
/** El modo, solo del navegador (ecosistema-kit/ACCESO.md, «Los ajustes de la web»); sin clave, el del sistema. */
export const CLAVE_MODO = 'rol.modo';
/** La clave del tema en el bloque de ajustes de Rol en la plataforma (`yosiftware.ajustes`). */
export const CLAVE_AJUSTES_TEMA = 'tema';

/**
 * La bienvenida de los temas para la cuenta vigente: `esperando` mientras se sabe si ya eligió (sus ajustes aún no han
 * llegado), `pendiente` si no ha elegido nunca (ni en sus ajustes ni en este navegador) y `no` en lo demás (ya eligió,
 * sin sesión o sin poder leer los ajustes).
 */
export type BienvenidaTema = 'esperando' | 'pendiente' | 'no';

export interface EstadoTemaWeb {
    tema: TemaWeb;
    modo: ModoWeb;
    modoEfectivo: ModoEfectivo;
    bienvenida: BienvenidaTema;
}

/** Si los temas están encendidos en este entorno (`environment.temasWeb`). Apagados: A en oscuro, sin bienvenida ni selector. */
export const TEMAS_WEB_ACTIVOS = new InjectionToken<boolean>('TEMAS_WEB_ACTIVOS', { factory: () => !!(environment as { temasWeb?: boolean }).temasWeb });

/**
 * El tema de la web (A, B o C) y su modo. El tema viaja con la cuenta, en el bloque de ajustes de Rol en la plataforma
 * (clave `tema`), con una copia en este navegador por cuenta para pintar sin esperar; el modo se queda en el navegador.
 * Pone en `<html>` `data-tema`, `data-modo` (el efectivo), `data-iconos` y `data-theme` (`light`/`dark`, para las
 * ventanas del SDK: ACCESO.md, «El tema de la ventana»).
 *
 * Cambio de cuenta (ecosistema-kit/CAMBIO_DE_CUENTA.md): con otra cuenta se pinta la copia local de la nueva (o A) y se
 * leen sus ajustes; lo que llegue tarde de la anterior se descarta (generación). La página además se recarga al cambiar
 * de identidad (`PlatformSessionService`). Sin sesión, A o lo elegido en este navegador sin cuenta.
 */
@Injectable({
    providedIn: 'root'
})
export class TemaWebService implements OnDestroy {
    private readonly estadoSubject: BehaviorSubject<EstadoTemaWeb>;
    private readonly suscripcion: Subscription;
    private readonly consultaOscuro: MediaQueryList | null;
    private cuenta: string | null = null;
    private generacion = 0;

    readonly estado$;
    readonly bienvenida$;

    constructor(
        private sesion: PlatformSessionService,
        private zone: NgZone,
        @Inject(DOCUMENT) private document: Document,
        @Optional() @Inject(TEMAS_WEB_ACTIVOS) activos: boolean | null = null,
    ) {
        this.activos = activos ?? !!(environment as { temasWeb?: boolean }).temasWeb;
        if (!this.activos) {
            // Apagados: la web de siempre (A en oscuro), sin leer ni guardar nada y sin bienvenida.
            this.consultaOscuro = null;
            this.estadoSubject = new BehaviorSubject<EstadoTemaWeb>({ tema: TEMA_POR_DEFECTO, modo: MODO_POR_DEFECTO, modoEfectivo: this.efectivo(TEMA_POR_DEFECTO, MODO_POR_DEFECTO), bienvenida: 'no' });
            this.estado$ = this.estadoSubject.asObservable();
            this.bienvenida$ = this.estado$.pipe(map((estado) => estado.bienvenida), distinctUntilChanged());
            this.suscripcion = new Subscription();
            this.pintar();
            return;
        }
        const modo = leerModo();
        const ultimo = leerPreferenciaLocal(CLAVE_TEMA_ULTIMO);
        this.consultaOscuro = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
        const tema = esTemaWeb(ultimo) ? ultimo : TEMA_POR_DEFECTO;
        this.estadoSubject = new BehaviorSubject<EstadoTemaWeb>({ tema, modo, modoEfectivo: this.efectivo(tema, modo), bienvenida: 'esperando' });
        this.estado$ = this.estadoSubject.asObservable();
        this.bienvenida$ = this.estado$.pipe(map((estado) => estado.bienvenida), distinctUntilChanged());
        this.pintar();

        this.consultaOscuro?.addEventListener?.('change', this.alCambiarSistema);
        this.document.defaultView?.addEventListener('storage', this.alCambiarOtraPestana);
        this.suscripcion = this.sesion.estado$.subscribe((estado) => this.alCambiarSesion(estado));
    }

    /** Si los temas están encendidos: si no, no se ofrecen el selector ni la bienvenida. */
    readonly activos: boolean;

    get estado(): EstadoTemaWeb {
        return this.estadoSubject.value;
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
        this.consultaOscuro?.removeEventListener?.('change', this.alCambiarSistema);
        this.document.defaultView?.removeEventListener('storage', this.alCambiarOtraPestana);
    }

    /**
     * La persona elige un tema: se pinta, se guarda la copia local (de su cuenta o sin cuenta) y, con sesión, en sus
     * ajustes de la plataforma. Si guardar en la plataforma falla, la elección sigue en este navegador y se sube la
     * próxima vez que se lean sus ajustes; el error se propaga para que quien llama lo diga.
     */
    async elegirTema(tema: TemaWeb): Promise<void> {
        const cuenta = this.cuenta;
        this.actualizar({ tema, bienvenida: 'no' });
        guardarPreferenciaLocal(this.claveLocal(cuenta), tema);
        if (cuenta)
            await this.sesion.guardarAjustes({ [CLAVE_AJUSTES_TEMA]: tema });
    }

    /** Pinta [tema] sin guardarlo (la vista previa de la bienvenida); `elegirTema` o `deshacerVistaPrevia` la cierran. */
    previsualizar(tema: TemaWeb): void {
        this.pintar(tema);
    }

    deshacerVistaPrevia(): void {
        this.pintar();
    }

    /** El modo, solo en este navegador; «sistema» quita la preferencia. */
    elegirModo(modo: ModoWeb): void {
        guardarPreferenciaLocal(CLAVE_MODO, modo === MODO_POR_DEFECTO ? null : modo);
        this.actualizar({ modo });
    }

    private alCambiarSesion(estado: EstadoPlataforma): void {
        if (estado.tipo === 'comprobando')
            return;
        if (estado.tipo === 'con_sesion') {
            if (estado.cuenta.id !== this.cuenta)
                void this.entrarCuenta(estado.cuenta.id);
            return;
        }
        // Sin sesión o sin plataforma: lo de este navegador sin cuenta, y ninguna bienvenida.
        this.cuenta = null;
        this.generacion++;
        const local = leerPreferenciaLocal(CLAVE_TEMA_SIN_CUENTA);
        this.actualizar({ tema: esTemaWeb(local) ? local : TEMA_POR_DEFECTO, bienvenida: 'no' });
    }

    private async entrarCuenta(cuenta: string): Promise<void> {
        this.cuenta = cuenta;
        const generacion = ++this.generacion;
        const local = leerPreferenciaLocal(this.claveLocal(cuenta));
        const temaLocal = esTemaWeb(local) ? local : null;
        this.actualizar({ tema: temaLocal ?? TEMA_POR_DEFECTO, bienvenida: 'esperando' });

        let remoto: unknown;
        try {
            remoto = (await this.sesion.leerAjustes())?.documento?.[CLAVE_AJUSTES_TEMA];
        } catch {
            // Sin sus ajustes no se sabe si ya eligió: no se le pregunta, y se queda lo de este navegador.
            if (generacion === this.generacion)
                this.actualizar({ bienvenida: 'no' });
            return;
        }
        // Lo que llega de otra cuenta (o de antes de volver a esta) no se pinta.
        if (generacion !== this.generacion)
            return;

        if (esTemaWeb(remoto)) {
            guardarPreferenciaLocal(this.claveLocal(cuenta), remoto);
            this.actualizar({ tema: remoto, bienvenida: 'no' });
            return;
        }
        if (temaLocal) {
            // Eligió aquí y no llegó a guardarse en la plataforma: se sube ahora.
            this.actualizar({ bienvenida: 'no' });
            this.sesion.guardarAjustes({ [CLAVE_AJUSTES_TEMA]: temaLocal }).catch(() => undefined);
            return;
        }
        this.actualizar({ bienvenida: 'pendiente' });
    }

    private readonly alCambiarSistema = (): void => {
        this.zone.run(() => this.actualizar({}));
    };

    // Otra pestaña cambia el modo o el tema de esta cuenta: se sigue aquí también.
    private readonly alCambiarOtraPestana = (evento: StorageEvent): void => {
        if (evento.key === CLAVE_MODO)
            this.zone.run(() => this.actualizar({ modo: leerModo() }));
        else if (evento.key && evento.key === this.claveLocal(this.cuenta) && esTemaWeb(evento.newValue))
            this.zone.run(() => this.actualizar({ tema: evento.newValue as TemaWeb, bienvenida: 'no' }));
    };

    private actualizar(cambios: Partial<Omit<EstadoTemaWeb, 'modoEfectivo'>>): void {
        const siguiente = { ...this.estadoSubject.value, ...cambios };
        siguiente.modoEfectivo = this.efectivo(siguiente.tema, siguiente.modo);
        this.estadoSubject.next(siguiente);
        this.pintar();
    }

    private efectivo(tema: TemaWeb, modo: ModoWeb): ModoEfectivo {
        return modoEfectivo(tema, modo, this.consultaOscuro?.matches ?? true);
    }

    /** Pone los atributos en `<html>`; con [tema], el de una vista previa en vez del elegido. */
    private pintar(tema: TemaWeb = this.estado.tema): void {
        const raiz = this.document.documentElement;
        const modo = this.efectivo(tema, this.estado.modo);
        raiz.dataset['tema'] = tema;
        raiz.dataset['modo'] = modo;
        raiz.dataset['iconos'] = definicionTema(tema).iconos;
        raiz.dataset['theme'] = modo === 'claro' ? 'light' : 'dark';
        if (tema === this.estado.tema)
            guardarPreferenciaLocal(CLAVE_TEMA_ULTIMO, tema);
    }

    private claveLocal(cuenta: string | null): string | null {
        return cuenta ? clavePorCuenta(PREFIJO_TEMA_LOCAL, cuenta) : CLAVE_TEMA_SIN_CUENTA;
    }
}

function leerModo(): ModoWeb {
    const modo = leerPreferenciaLocal(CLAVE_MODO);
    return esModoWeb(modo) ? modo : MODO_POR_DEFECTO;
}
