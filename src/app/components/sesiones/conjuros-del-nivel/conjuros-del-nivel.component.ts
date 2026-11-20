import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { toInt } from 'src/app/services/utils/normalizacion';

/** El nombre de un conjuro del catálogo del motor, o `#id` si no está. */
export function nombreDeConjuro(motor: NuevoPersonajeService, id: number): string {
    return motor.CatalogoConjuros.find((c) => toInt(c?.Id) === toInt(id))?.Nombre ?? `#${id}`;
}

/**
 * El paso «Conjuros» de un nivel que se gana, con la sesión de conjuros del motor de la creación abierta (los conocidos, los
 * del libro del mago): los elegidos y los automáticos como chips, lo que queda por elegir y la lista con buscador. La usan
 * la subida de nivel y la vuelta a la vida sin ningún DG, cada una con su instancia del motor; el botón para cerrarlo es de
 * cada pantalla (`puedeCerrarSesionConjuros`).
 */
@Component({
    selector: 'app-conjuros-del-nivel',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './conjuros-del-nivel.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
})
export class ConjurosDelNivelComponent {
    @Input({ required: true }) motor!: NuevoPersonajeService;
    /** Si la ficha es homebrew: entonces se ofrecen también los conjuros homebrew. */
    @Input() homebrew = false;

    filtro = '';

    get entrada() {
        const flujo = this.motor.getConjurosSesionActual();
        return flujo.activa ? flujo.entradas[flujo.indiceEntradaActual] ?? null : null;
    }

    get disponibles(): Conjuro[] {
        return this.motor.filtrarConjurosDisponibles(this.filtro, null, this.homebrew);
    }

    nombre(id: number): string {
        return nombreDeConjuro(this.motor, id);
    }

    elegir(conjuro: Conjuro): void {
        this.motor.seleccionarConjuroSesion(toInt(conjuro?.Id), this.homebrew);
    }

    quitar(id: number): void {
        this.motor.quitarConjuroSesion(id);
    }
}
