import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

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
        const nombre = `${this.deidad?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(this.deidad?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
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

    tieneTextoVisible(texto: string | undefined | null): boolean {
        return `${texto ?? ''}`.trim().length > 0;
    }

    tieneColeccionVisible(items: { Nombre: string }[] | undefined | null): boolean {
        return Array.isArray(items) && items.some((item) => this.tieneTextoVisible(item?.Nombre));
    }

    tieneArmaVisible(): boolean {
        return Number(this.deidad?.Arma?.Id ?? 0) > 0 && this.tieneTextoVisible(this.deidad?.Arma?.Nombre);
    }
}
