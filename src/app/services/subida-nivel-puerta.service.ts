import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { toInt } from './utils/normalizacion';

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
    private readonly subidasHechasSubject = new Subject<number>();

    /** Cada vez que alguien pulsa «Subir a nivel N»: el id del personaje. */
    readonly solicitudes$: Observable<number> = this.solicitudesSubject.asObservable();
    /** Cada vez que la subida guarda un nivel: el id del personaje, para volver a cargar su ficha y su historial. */
    readonly subidasHechas$: Observable<number> = this.subidasHechasSubject.asObservable();

    solicitar(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.solicitudesSubject.next(id);
    }

    subidaHecha(idPersonaje: number): void {
        const id = toInt(idPersonaje);
        if (id > 0)
            this.subidasHechasSubject.next(id);
    }
}
