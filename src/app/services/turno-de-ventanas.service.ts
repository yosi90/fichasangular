import { Injectable } from '@angular/core';

/**
 * El turno de las ventanas de decisión que Rol abre sola, sin que la persona pulse nada (como la del código del correo
 * al cargar algo social). Mientras alguien retiene el turno (la bienvenida de los temas, hasta que se elige uno), esas
 * ventanas esperan y se abren después, como hace Libros con sus avisos. Lo que abre una acción de la persona no espera.
 */
@Injectable({
    providedIn: 'root'
})
export class TurnoDeVentanasService {
    private readonly retenciones = new Set<string>();
    private esperando: Array<() => void> = [];

    get libre(): boolean {
        return this.retenciones.size === 0;
    }

    retener(motivo: string): void {
        this.retenciones.add(motivo);
    }

    soltar(motivo: string): void {
        if (!this.retenciones.delete(motivo) || !this.libre)
            return;
        const pendientes = this.esperando;
        this.esperando = [];
        pendientes.forEach((seguir) => seguir());
    }

    /** Se resuelve en cuanto nadie retiene el turno (ahora mismo, si ya está libre). */
    esperarTurno(): Promise<void> {
        if (this.libre)
            return Promise.resolve();
        return new Promise<void>((resolve) => this.esperando.push(resolve));
    }
}
