import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, firstValueFrom, map, race, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NormasCreacionDialogoComponent } from '../components/shared/normas-creacion-dialogo/normas-creacion-dialogo.component';
import { CLAVE_WEB_ROL, DatosVentanaNormas, NormasCreacionError, NormasDeRol } from '../interfaces/normas-rol';
import { cabecerasPlataforma, EstadoPlataforma, PlatformSessionService } from './platform-session.service';
import { codigoDeError, leerErrorDeApi } from './utils/error-api';

// Las normas propias de Rol (ecosistema-kit/MODERACION.md, «Las normas propias de la web») se piden solo al crear
// (decisión 5 del roadmap de la ronda de mejoras de noviembre): al pulsar un botón de crear, si faltan, se abre la
// ventana de Rol con el texto vigente. Se leen sin sesión y se aceptan con el token de la plataforma.

const ESPERA_ESTADO_MS = 4_000;

@Injectable({
    providedIn: 'root'
})
export class NormasCreacionService {
    private readonly api = environment.plataforma.apiUrl;
    private enCurso: Promise<boolean> | null = null;

    constructor(
        private http: HttpClient,
        private dialog: MatDialog,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    /**
     * Abre la ventana de las normas y resuelve `true` si la persona las acepta (con los tokens ya renovados) o `false`
     * si dice «Ahora no». Varias peticiones a la vez (dos botones, o la API rechazando dos llamadas) comparten la ventana.
     */
    pedir(): Promise<boolean> {
        this.enCurso ??= this.abrirVentana().finally(() => {
            this.enCurso = null;
        });
        return this.enCurso;
    }

    /** Las normas vigentes de Rol (sin token: son públicas). */
    async leer(): Promise<NormasDeRol> {
        try {
            const normas = await firstValueFrom(this.http.get<NormasDeRol>(`${this.api}/v1/webs/${CLAVE_WEB_ROL}/normas`));
            if (!normas || !Number.isFinite(Number(normas.id)))
                throw new NormasCreacionError('No se han podido leer las normas de Rol.', '');
            return normas;
        } catch (error) {
            throw this.comoError(error, 'No se han podido leer las normas de Rol. Vuelve a intentarlo en un momento.');
        }
    }

    /**
     * Acepta esa versión con el token de la plataforma y espera a que la sesión llegue sin `normasPendientes`, para que
     * lo siguiente que se mande a la API de Rol ya vaya con el token nuevo.
     */
    async aceptar(idVersion: number): Promise<void> {
        try {
            const headers = await cabecerasPlataforma(this.platformSessionSvc);
            await firstValueFrom(this.http.post(`${this.api}/v1/cuenta/normas/${idVersion}/aceptacion`, null, { headers }));
        } catch (error) {
            throw this.comoError(error, 'No se ha podido guardar que aceptas las normas. Vuelve a intentarlo.');
        }
        const estado = await this.platformSessionSvc.renovarSesion();
        if (sinNormasPendientes(estado))
            return;
        const renovado = await firstValueFrom(race(
            this.platformSessionSvc.estado$.pipe(filter(sinNormasPendientes), map(() => true)),
            timer(ESPERA_ESTADO_MS).pipe(map(() => false)),
        ));
        if (!renovado)
            throw new NormasCreacionError('Has aceptado las normas, pero Rol aún no lo sabe. Espera un momento y vuelve a pulsar «Aceptar».', 'sin_renovar');
    }

    protected async abrirVentana(): Promise<boolean> {
        const datos: DatosVentanaNormas = {
            leer: () => this.leer(),
            aceptar: (idVersion) => this.aceptar(idVersion),
        };
        const ventana = this.dialog.open<NormasCreacionDialogoComponent, DatosVentanaNormas, boolean>(NormasCreacionDialogoComponent, {
            data: datos,
            width: '640px',
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 32px)',
            autoFocus: 'dialog',
            restoreFocus: true,
            panelClass: 'normas-creacion-panel',
        });
        return (await firstValueFrom(ventana.afterClosed())) === true;
    }

    private comoError(error: unknown, porDefecto: string): NormasCreacionError {
        if (error instanceof NormasCreacionError)
            return error;
        if (error instanceof HttpErrorResponse) {
            // La plataforma responde con el mismo formato de error que la API de Rol (`error`, `code`).
            const leido = leerErrorDeApi(error, porDefecto);
            if (leido.codigo === 'normas_no_vigentes')
                return new NormasCreacionError('Las normas han cambiado mientras las leías. Aquí tienes las nuevas.', leido.codigo);
            if (leido.estado === 0)
                return new NormasCreacionError('No hay conexión con Yosiftware. Revisa tu red y vuelve a intentarlo.', 'sin_conexion');
            return new NormasCreacionError(leido.mensaje, leido.codigo);
        }
        return new NormasCreacionError(porDefecto, codigoDeError(error));
    }
}

function sinNormasPendientes(estado: EstadoPlataforma): boolean {
    return estado.tipo === 'con_sesion' && !estado.normasPendientes;
}
