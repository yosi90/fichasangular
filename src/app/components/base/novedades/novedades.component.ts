import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Novedad, TipoNovedad } from 'src/app/interfaces/novedad';
import { NovedadesService } from 'src/app/services/novedades.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { textoFecha } from 'src/app/services/utils/fecha-texto';

/** Cómo se enseña cada tipo: su nombre y su icono (Material). */
export interface TipoNovedadVista {
    readonly etiqueta: string;
    readonly icono: string;
}

export const TIPOS_NOVEDAD: Readonly<Record<TipoNovedad, TipoNovedadVista>> = {
    actualizacion: { etiqueta: 'Actualización', icono: 'auto_awesome' },
    peticion: { etiqueta: 'Lo pedisteis', icono: 'forum' },
    arreglo: { etiqueta: 'Arreglo', icono: 'build' },
    web_nueva: { etiqueta: 'Web nueva', icono: 'public' },
    app_nueva: { etiqueta: 'App nueva', icono: 'phone_android' },
    app_disponible: { etiqueta: 'App', icono: 'phone_android' },
    contenido: { etiqueta: 'Contenido', icono: 'library_add' },
    aviso: { etiqueta: 'Aviso', icono: 'campaign' },
};

/** Un tipo que la plataforma añada más adelante se enseña así hasta que Rol lo conozca. */
const TIPO_GENERICO: TipoNovedadVista = { etiqueta: 'Novedad', icono: 'new_releases' };

export function vistaDeTipoNovedad(tipo: string): TipoNovedadVista {
    return TIPOS_NOVEDAD[tipo as TipoNovedad] ?? TIPO_GENERICO;
}

/** Adónde lleva el enlace de una novedad: su dirección sin `https://` y si es la web social (lleva el símbolo). */
export interface DestinoNovedad {
    readonly texto: string;
    readonly social: boolean;
}

export function destinoNovedad(enlace: string, hostSocial: string): DestinoNovedad | null {
    let url: URL;
    try {
        url = new URL(enlace);
    } catch {
        return null;
    }
    const ruta = `${url.pathname}${url.search}`.replace(/\/$/, '');
    return { texto: `${url.hostname}${ruta}`, social: url.hostname === hostSocial };
}

/** Las novedades de un mismo día (en la zona de quien las lee), en el orden en que llegan. */
export interface DiaNovedades {
    readonly fecha: string;
    readonly novedades: readonly Novedad[];
}

export function agruparPorDia(novedades: readonly Novedad[]): DiaNovedades[] {
    const dias: { fecha: string; novedades: Novedad[] }[] = [];
    for (const novedad of novedades) {
        const fecha = textoFecha(novedad.fecha, 'Sin fecha');
        const ultimo = dias[dias.length - 1];
        if (ultimo?.fecha === fecha)
            ultimo.novedades.push(novedad);
        else
            dias.push({ fecha, novedades: [novedad] });
    }
    return dias;
}

/**
 * La pestaña Novedades (decisión 2 de la ronda de noviembre): lo que cambia en Rol y en 3.5 Companion
 * (`GET /novedades`), como un registro de cambios agrupado por día, con «Ver más» y la preferencia de abrirla al entrar.
 */
@Component({
    selector: 'app-novedades',
    templateUrl: './novedades.component.html',
    styleUrls: ['./novedades.component.sass'],
    standalone: false
})
export class NovedadesComponent implements OnInit, OnDestroy {
    novedades: Novedad[] = [];
    dias: DiaNovedades[] = [];
    estado: 'cargando' | 'error' | 'listo' = 'cargando';
    mensajeError = '';
    hayMas = false;
    cargandoMas = false;
    errorMas = '';
    abrirAlEntrar = true;
    guardandoPreferencia = false;
    errorPreferencia = '';

    private lectura?: Subscription;
    private readonly hostSocial: string;

    constructor(private novedadesSvc: NovedadesService, platformSessionSvc: PlatformSessionService) {
        this.hostSocial = new URL(platformSessionSvc.urlSocial()).hostname;
    }

    ngOnInit(): void {
        this.cargar();
        void this.novedadesSvc.abrirAlEntrar().then((abrir) => this.abrirAlEntrar = abrir);
    }

    ngOnDestroy(): void {
        this.lectura?.unsubscribe();
    }

    cargar(): void {
        this.lectura?.unsubscribe();
        this.estado = 'cargando';
        this.errorMas = '';
        this.lectura = this.novedadesSvc.getNovedades(0).subscribe({
            next: (pagina) => {
                this.poner(pagina.novedades, pagina.hayMas);
                this.estado = 'listo';
            },
            error: (error) => {
                this.mensajeError = mensajeDeError(error, 'No se han podido cargar las novedades.');
                this.estado = 'error';
            },
        });
    }

    verMas(): void {
        if (this.cargandoMas || !this.hayMas)
            return;
        this.cargandoMas = true;
        this.errorMas = '';
        this.lectura?.unsubscribe();
        this.lectura = this.novedadesSvc.getNovedades(this.novedades.length).subscribe({
            next: (pagina) => {
                const vistas = new Set(this.novedades.map((n) => n.idExterno));
                this.poner([...this.novedades, ...pagina.novedades.filter((n) => !vistas.has(n.idExterno))], pagina.hayMas);
                this.cargandoMas = false;
            },
            error: (error) => {
                this.errorMas = mensajeDeError(error, 'No se han podido cargar más novedades.');
                this.cargandoMas = false;
            },
        });
    }

    async cambiarAbrirAlEntrar(abrir: boolean): Promise<void> {
        const anterior = this.abrirAlEntrar;
        this.abrirAlEntrar = abrir;
        this.guardandoPreferencia = true;
        this.errorPreferencia = '';
        try {
            await this.novedadesSvc.guardarAbrirAlEntrar(abrir);
        } catch (error) {
            this.abrirAlEntrar = anterior;
            this.errorPreferencia = mensajeDeError(error, 'No se ha podido guardar la preferencia.');
        } finally {
            this.guardandoPreferencia = false;
        }
    }

    destino(novedad: Novedad): DestinoNovedad | null {
        return novedad.enlace ? destinoNovedad(novedad.enlace, this.hostSocial) : null;
    }

    tipo(novedad: Novedad): TipoNovedadVista {
        return vistaDeTipoNovedad(novedad.tipo);
    }

    trackDia(_: number, dia: DiaNovedades): string {
        return dia.fecha;
    }

    trackNovedad(_: number, novedad: Novedad): string {
        return novedad.idExterno;
    }

    private poner(novedades: Novedad[], hayMas: boolean): void {
        this.novedades = novedades;
        this.dias = agruparPorDia(novedades);
        this.hayMas = hayMas;
    }
}
