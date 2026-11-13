import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Personaje } from 'src/app/interfaces/personaje';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { claveHabilidad } from 'src/app/services/utils/habilidad-clave';
import { toInt } from 'src/app/services/utils/normalizacion';

type Habilidad = Personaje['Habilidades'][number];

/**
 * El reparto de los rangos de un nivel con el motor de la creación (su sesión de habilidades abierta): la tabla con − / +,
 * los rangos de este nivel y su tope. La usan la subida de nivel y la corrección de la ficha (cada nivel otra vez), con su
 * propia instancia del motor; el botón para cerrarlo es de cada pantalla.
 */
@Component({
    selector: 'app-reparto-rangos',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './reparto-rangos.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
})
export class RepartoRangosComponent {
    @Input({ required: true }) motor!: NuevoPersonajeService;
    /** El título de la tarjeta (por defecto, los puntos que quedan). */
    @Input() titulo = '';

    get habilidades(): Habilidad[] {
        return this.motor.getHabilidadesSesion();
    }

    get puntosRestantes(): number {
        return toInt(this.motor.EstadoFlujo.habilidades.puntosRestantes);
    }

    esDeClase(habilidad: Habilidad): boolean {
        return this.motor.esHabilidadClaseaEfectiva(claveHabilidad(habilidad));
    }

    limite(habilidad: Habilidad): number {
        return this.motor.obtenerLimiteRangoHabilidad(claveHabilidad(habilidad));
    }

    puedeSubir(habilidad: Habilidad): boolean {
        return this.motor.puedeSubirRangoHabilidad(claveHabilidad(habilidad));
    }

    rangosDelNivel(habilidad: Habilidad): number {
        return Math.max(0, Math.trunc(Number(habilidad?.Rangos ?? 0))
            - Math.trunc(Number(this.motor.EstadoFlujo.habilidades.rangosIniciales?.[claveHabilidad(habilidad)] ?? 0)));
    }

    ajustar(habilidad: Habilidad, delta: number): void {
        this.motor.ajustarRangoHabilidad(claveHabilidad(habilidad), delta);
    }
}
