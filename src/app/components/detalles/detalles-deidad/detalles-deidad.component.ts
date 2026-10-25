import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-deidad',
    templateUrl: './detalles-deidad.component.html',
    standalone: false
})
export class DetallesDeidadComponent {
    private deidadActual!: DeidadDetalle;

    @Input()
    set deidad(valor: DeidadDetalle) {
        this.deidadActual = valor;
        this.datos = this.construirDatos();
        this.ambitos = nombresVisibles(valor?.Ambitos);
        this.dominios = nombresVisibles(valor?.Dominios);
    }
    get deidad(): DeidadDetalle {
        return this.deidadActual;
    }

    @Output() armaDetallesId = new EventEmitter<number>();

    datos: DatoFicha[] = [];
    ambitos: string[] = [];
    dominios: string[] = [];

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual(): void {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.deidad?.Manual?.Id,
            nombre: this.deidad?.Manual?.Nombre,
        });
    }

    abrirDetallesArma(): void {
        const id = Number(this.deidad?.Arma?.Id ?? 0);
        if (Number.isFinite(id) && id > 0)
            this.armaDetallesId.emit(id);
    }

    tieneArmaVisible(): boolean {
        return Number(this.deidad?.Arma?.Id ?? 0) > 0 && tieneTextoVisible(this.deidad?.Arma?.Nombre);
    }

    private construirDatos(): DatoFicha[] {
        const deidad = this.deidad;
        if (!deidad)
            return [];
        return [
            { etiqueta: 'Alineamiento', valor: deidad.Alineamiento?.Nombre },
            { etiqueta: 'Pabellón', valor: deidad.Pabellon?.Nombre },
            { etiqueta: 'Género', valor: deidad.Genero?.Nombre },
            {
                etiqueta: 'Arma predilecta',
                valor: this.tieneArmaVisible() ? deidad.Arma.Nombre : null,
                alPulsar: () => this.abrirDetallesArma(),
            },
        ];
    }
}

/** Los nombres con algo que enseñar, en su orden. */
function nombresVisibles(items: { Nombre: string }[] | null | undefined): string[] {
    return (Array.isArray(items) ? items : [])
        .filter((item) => tieneTextoVisible(item?.Nombre))
        .map((item) => item.Nombre.trim());
}
