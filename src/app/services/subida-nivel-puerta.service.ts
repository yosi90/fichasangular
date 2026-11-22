import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TipoDeMascota } from 'src/app/interfaces/sesiones';
import { toInt } from './utils/normalizacion';

/** Lo que se hace con la mascota fuera del reciclaje: perderla u obtener otra (contrato: personajes.md, «La mascota fuera del reciclaje»). */
export type AccionMascota = 'perder' | 'obtener';

/** «Perder» u «obtener» una mascota fuera del reciclaje, para su pestaña. */
export interface SolicitudMascota {
    idPersonaje: number;
    accion: AccionMascota;
    mascota: TipoDeMascota;
}

/**
 * La puerta entre la ficha y la subida de nivel (roadmap de sesiones: fase 3, la ficha y la sesión; fase 4, la subida).
 * La ficha y el panel de la sesión piden la subida con `solicitar(idPersonaje)` (el botón «Subir a nivel N»); la pantalla
 * de la subida (fase 4, con carga diferida) se suscribe a `solicitudes$` para abrirse. Cuando guarda una subida, avisa con
 * `subidaHecha(idPersonaje)` y la ficha y el historial de ese personaje se vuelven a cargar (`subidasHechas$`). Solo
 * lleva ids: ni la ficha ni la sesión pasan por aquí.
 */
@Injectable({
    providedIn: 'root'
})
export class SubidaNivelPuertaService {
    private readonly solicitudesSubject = new Subject<number>();
    private readonly correccionesSubject = new Subject<number>();
    private readonly plantillasSubject = new Subject<number>();
    private readonly perdidasSubject = new Subject<number>();
    private readonly mutacionesSubject = new Subject<number>();
    private readonly vueltasSubject = new Subject<number>();
    private readonly companerosSubject = new Subject<number>();
    private readonly mascotasSubject = new Subject<SolicitudMascota>();
    private readonly subidasHechasSubject = new Subject<number>();

    /** Cada vez que alguien pulsa «Subir a nivel N»: el id del personaje. */
    readonly solicitudes$: Observable<number> = this.solicitudesSubject.asObservable();
    /** «Corregir la ficha» (fase 6): el id del personaje; la pestaña de la corrección se abre como la de la subida. */
    readonly correcciones$: Observable<number> = this.correccionesSubject.asObservable();
    /** «Adquirir una plantilla» (fase 7): el id del personaje; su pestaña se abre como la de la subida. */
    readonly plantillas$: Observable<number> = this.plantillasSubject.asObservable();
    /** «Perder un nivel» (fase 7, segunda tanda): el id del personaje; su pestaña se abre como la de la subida. */
    readonly perdidas$: Observable<number> = this.perdidasSubject.asObservable();
    /** «Adquirir una raza mutada» (fase 7): el id del personaje; su pestaña se abre como la de la subida. */
    readonly mutaciones$: Observable<number> = this.mutacionesSubject.asObservable();
    /** «Devolver la vida» a un muerto viviente de clase de monstruo (fase 7): el id del personaje; su pestaña, como la de la subida. */
    readonly vueltas$: Observable<number> = this.vueltasSubject.asObservable();
    /** «Completar el compañero» (tanda (f) de las mascotas): el id del personaje; su pestaña, como la de la subida. */
    readonly companeros$: Observable<number> = this.companerosSubject.asObservable();
    /**
     * La mascota fuera del reciclaje (tanda (i)): perderla u obtener otra, con el personaje, la acción y la mascota; su
     * pestaña, como la de la subida.
     */
    readonly mascotas$: Observable<SolicitudMascota> = this.mascotasSubject.asObservable();
    /**
     * Cada vez que la subida guarda un nivel, la corrección guarda la ficha, se cambian sus datos libres (fase 6) o se
     * adquiere una plantilla o una raza mutada, se pierde un nivel o se le devuelve la vida (fase 7): el id del personaje, para volver a cargar su
     * ficha y su historial.
     */
    readonly subidasHechas$: Observable<number> = this.subidasHechasSubject.asObservable();

    solicitar(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.solicitudesSubject.next(id);
    }

    solicitarCorreccion(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.correccionesSubject.next(id);
    }

    solicitarPlantilla(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.plantillasSubject.next(id);
    }

    solicitarPerdida(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.perdidasSubject.next(id);
    }

    solicitarMutacion(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.mutacionesSubject.next(id);
    }

    solicitarVuelta(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.vueltasSubject.next(id);
    }

    solicitarCompanero(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.companerosSubject.next(id);
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
