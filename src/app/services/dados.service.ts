import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PlatformSessionService } from './platform-session.service';
import {
    CarasDado,
    FuenteAleatoria,
    ResultadoTirada,
    TIRADA_VACIA,
    TiradaPreparada,
    anadirAlHistorial,
    cambiarBonificador,
    cambiarDado,
    fuenteCripto,
    tirar,
} from './utils/dados';

export interface EstadoDados {
    readonly tirada: TiradaPreparada;
    readonly ultimo: ResultadoTirada | null;
    /** Lo más reciente primero; como mucho 50. */
    readonly historial: readonly ResultadoTirada[];
}

const ESTADO_INICIAL: EstadoDados = { tirada: TIRADA_VACIA, ultimo: null, historial: [] };

/**
 * La tirada que se prepara en la pestaña «Dados» y el historial de esta sesión. Vive solo en memoria (no va a
 * `localStorage` ni a la API) y es de la cuenta que lo tiró: se borra al cambiar de cuenta, al entrar o al cerrar
 * sesión (`ecosistema-kit/CAMBIO_DE_CUENTA.md`). La pestaña se destruye al dejarla; esto sigue mientras dure la página.
 */
@Injectable({
    providedIn: 'root'
})
export class DadosService implements OnDestroy {
    private readonly estadoSubject = new BehaviorSubject<EstadoDados>(ESTADO_INICIAL);
    readonly estado$: Observable<EstadoDados> = this.estadoSubject.asObservable();
    /** La cuenta de lo que hay: `undefined` mientras no se sabe; `null`, sin sesión. */
    private cuenta: string | null | undefined = undefined;
    private readonly suscripcion: Subscription;
    /** De dónde salen los números; las pruebas ponen la suya. */
    fuente: FuenteAleatoria = fuenteCripto;

    constructor(sesion: PlatformSessionService) {
        this.suscripcion = sesion.estado$.subscribe((estado) => {
            if (estado.tipo === 'con_sesion')
                this.alCambiarCuenta(estado.cuenta.id);
            else if (estado.tipo === 'sin_sesion')
                this.alCambiarCuenta(null);
        });
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    get estado(): EstadoDados {
        return this.estadoSubject.value;
    }

    anadir(caras: CarasDado): void {
        this.cambiarTirada(cambiarDado(this.estado.tirada, caras, 1));
    }

    quitar(caras: CarasDado): void {
        this.cambiarTirada(cambiarDado(this.estado.tirada, caras, -1));
    }

    cambiarBonificador(cambio: number): void {
        this.cambiarTirada(cambiarBonificador(this.estado.tirada, cambio));
    }

    /** Quita los dados y el bonificador; el último resultado y el historial se quedan. */
    limpiar(): void {
        this.cambiarTirada(TIRADA_VACIA);
    }

    /** Tira lo preparado y lo apunta en el historial; sin dados, no hace nada. */
    tirar(): ResultadoTirada | null {
        const resultado = tirar(this.estado.tirada, this.fuente);
        if (resultado)
            this.estadoSubject.next({ ...this.estado, ultimo: resultado, historial: anadirAlHistorial(this.estado.historial, resultado) });
        return resultado;
    }

    /** Vacía la lista del historial; el último resultado se sigue viendo hasta la siguiente tirada. */
    borrarHistorial(): void {
        if (this.estado.historial.length > 0)
            this.estadoSubject.next({ ...this.estado, historial: [] });
    }

    private cambiarTirada(tirada: TiradaPreparada): void {
        if (tirada !== this.estado.tirada)
            this.estadoSubject.next({ ...this.estado, tirada });
    }

    private alCambiarCuenta(cuenta: string | null): void {
        if (this.cuenta !== undefined && cuenta !== this.cuenta)
            this.estadoSubject.next(ESTADO_INICIAL);
        this.cuenta = cuenta;
    }
}
