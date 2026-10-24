import { Component, Input } from '@angular/core';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-arma',
    templateUrl: './detalles-arma.component.html',
    styleUrls: ['./detalles-arma.component.sass'],
    standalone: false
})
export class DetallesArmaComponent {
    @Input() arma!: ArmaDetalle;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.arma?.Manual?.Id,
            nombre: this.arma?.Manual?.Nombre,
        });
    }

    get manualLabel(): string {
        const nombre = `${this.arma?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(this.arma?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    get incrementoDistanciaVisible(): string {
        const incremento = Number(this.arma?.Incremento_distancia ?? 0);
        return incremento > 0 ? `${incremento} pies` : '';
    }

    readonly tieneTextoVisible = tieneTextoVisible;

    tieneNumeroVisible(valor: unknown): boolean {
        const numero = Number(valor);
        return Number.isFinite(numero) && numero > 0;
    }
}
