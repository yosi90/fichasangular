import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TipoDeMascota } from 'src/app/interfaces/sesiones';
import { toInt } from './utils/normalizacion';

/** Lo que se hace con la mascota fuera del reciclaje: perderla u obtener otra (contrato: personajes.md, «La mascota fuera del reciclaje»). */
export type AccionMascota = 'perder' | 'obtener';

/** Las pestañas de la sesión: la subida de nivel y cada vía que se abre como ella (la del personaje, su historial o su sesión). */
export type ModoPestanaSesion = 'subida' | 'correccion' | 'plantilla' | 'mutacion' | 'perdida' | 'vuelta' | 'companero' | 'mascota';

/** Las vías que se piden solo con el id del personaje: todas menos la mascota, que lleva su acción (`solicitarMascota`). */
export type VistaDeSesion = Exclude<ModoPestanaSesion, 'mascota'>;

/** Lo que pide abrir una vía: el personaje y la vía. */
export interface SolicitudDeSesion {
    idPersonaje: number;
    modo: VistaDeSesion;
}

/** «Perder» u «obtener» una mascota fuera del reciclaje, para su pestaña. */
export interface SolicitudMascota {
    idPersonaje: number;
    accion: AccionMascota;
    mascota: TipoDeMascota;
}

/**
 * La puerta entre la ficha y la subida de nivel (roadmap de sesiones: fase 3, la ficha y la sesión; fase 4, la subida).
 * La ficha, el historial y el panel de la sesión piden una vía con `solicitar(idPersonaje, modo)`: la subida (el botón
 * «Subir a nivel N», el modo por defecto), «Corregir la ficha» (fase 6), «Adquirir una plantilla» o «una raza mutada»,
 * «Perder un nivel», «Devolver la vida» (fase 7) y «Completar el compañero» (tanda (f) de las mascotas); la mascota fuera
 * del reciclaje (tanda (i)) lleva además su acción y su mascota (`solicitarMascota`). La pestaña de la sesión se suscribe
 * a `solicitudes$` y `mascotas$` para abrirse. Cuando una vía guarda, avisa con `subidaHecha(idPersonaje)` y la ficha y
 * el historial de ese personaje se vuelven a cargar (`subidasHechas$`). Solo lleva ids: ni la ficha ni la sesión pasan
 * por aquí.
 */
@Injectable({
    providedIn: 'root'
})
export class SubidaNivelPuertaService {
    private readonly solicitudesSubject = new Subject<SolicitudDeSesion>();
    private readonly mascotasSubject = new Subject<SolicitudMascota>();
    private readonly subidasHechasSubject = new Subject<number>();

    /** Cada vez que alguien pide una vía: el id del personaje y la vía; su pestaña se abre como la de la subida. */
    readonly solicitudes$: Observable<SolicitudDeSesion> = this.solicitudesSubject.asObservable();
    /**
     * La mascota fuera del reciclaje (tanda (i)): perderla u obtener otra, con el personaje, la acción y la mascota; su
     * pestaña, como la de la subida.
     */
    readonly mascotas$: Observable<SolicitudMascota> = this.mascotasSubject.asObservable();
    /**
     * Cada vez que la subida guarda un nivel, la corrección guarda la ficha, se cambian sus datos libres (fase 6) o se
     * adquiere una plantilla o una raza mutada, se pierde un nivel o se le devuelve la vida (fase 7): el id del personaje,
     * para volver a cargar su ficha y su historial.
     */
    readonly subidasHechas$: Observable<number> = this.subidasHechasSubject.asObservable();

    solicitar(idPersonaje: number, modo: VistaDeSesion = 'subida'): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.solicitudesSubject.next({ idPersonaje: id, modo });
    }

    solicitarMascota(idPersonaje: number, accion: AccionMascota, mascota: TipoDeMascota): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.mascotasSubject.next({ idPersonaje: id, accion, mascota });
    }

    subidaHecha(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.subidasHechasSubject.next(id);
    }
}
