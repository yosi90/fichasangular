import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';

type RacialVisual = {
    nombreBase: string;
    texto: string;
    clicable: boolean;
};

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass']
})
export class DetallesRazaComponent {
    @Input() raza!: Raza;

    @Output() racialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();

    abrirDetalleRacialPorNombre(nombreBase: string) {
        if (!this.tieneTextoVisible(nombreBase))
            return;
        this.racialDetallesPorNombre.emit(nombreBase);
    }

    getRacialesActivos(): RacialVisual[] {
        const raciales: RacialVisual[] = [];

        if (this.tieneTextoVisible(this.raza?.Ataques_naturales))
            raciales.push({
                nombreBase: 'Ataques naturales',
                texto: `Ataques naturales: ${this.raza.Ataques_naturales}`,
                clicable: true,
            });

        if (this.tieneTextoVisible(this.raza?.Reduccion_dano))
            raciales.push({
                nombreBase: 'Reduccion de dano',
                texto: `Reduccion de dano: ${this.raza.Reduccion_dano}`,
                clicable: true,
            });

        if (this.tieneTextoVisible(this.raza?.Resistencia_magica))
            raciales.push({
                nombreBase: 'Resistencia magica',
                texto: `Resistencia magica: ${this.raza.Resistencia_magica}`,
                clicable: true,
            });

        if (this.tieneTextoVisible(this.raza?.Resistencia_energia))
            raciales.push({
                nombreBase: 'Resistencia a la energia',
                texto: `Resistencia a la energia: ${this.raza.Resistencia_energia}`,
                clicable: true,
            });

        if (this.raza?.Heredada)
            raciales.push({
                nombreBase: 'Plantilla heredada',
                texto: 'Plantilla heredada',
                clicable: true,
            });

        if (this.raza?.Mutada)
            raciales.push({
                nombreBase: 'Plantilla mutada',
                texto: 'Plantilla mutada',
                clicable: true,
            });

        if (this.raza?.Tamano_mutacion_dependiente)
            raciales.push({
                nombreBase: 'Tamano dependiente de mutacion',
                texto: 'Tamano dependiente de mutacion',
                clicable: true,
            });

        return raciales;
    }

    private tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica' && limpiado !== 'no se especifica' && limpiado !== 'no aplica' && limpiado !== '-';
    }
}
