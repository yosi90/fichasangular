import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';

@Component({
    selector: 'app-detalles-deidad',
    templateUrl: './detalles-deidad.component.html',
    styleUrls: ['./detalles-deidad.component.sass'],
    standalone: false
})
export class DetallesDeidadComponent {
    @Input() deidad!: DeidadDetalle;
    @Output() armaDetallesId = new EventEmitter<number>();

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    get manualLabel(): string {
        return etiquetaManual(this.deidad?.Manual);
    }

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

    readonly tieneTextoVisible = tieneTextoVisible;

    tieneColeccionVisible(items: { Nombre: string }[] | undefined | null): boolean {
        return Array.isArray(items) && items.some((item) => this.tieneTextoVisible(item?.Nombre));
    }

    tieneArmaVisible(): boolean {
        return Number(this.deidad?.Arma?.Id ?? 0) > 0 && this.tieneTextoVisible(this.deidad?.Arma?.Nombre);
    }
}
