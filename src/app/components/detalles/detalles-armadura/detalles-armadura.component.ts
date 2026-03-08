import { Component, Input } from '@angular/core';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-armadura',
    templateUrl: './detalles-armadura.component.html',
    styleUrls: ['./detalles-armadura.component.sass'],
    standalone: false
})
export class DetallesArmaduraComponent {
    @Input() armadura!: ArmaduraDetalle;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.armadura?.Manual?.Id,
            nombre: this.armadura?.Manual?.Nombre,
        });
    }

    get manualLabel(): string {
        const nombre = `${this.armadura?.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(this.armadura?.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    get bonusDesLabel(): string {
        const valor = Number(this.armadura?.Bon_des ?? 0);
        if (!Number.isFinite(valor) || valor <= 0)
            return '';
        return `+${valor}`;
    }

    tieneTextoVisible(texto: string | null | undefined): boolean {
        const normalizado = `${texto ?? ''}`.trim();
        if (normalizado.length < 1)
            return false;
        const base = normalizado
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        return base !== 'no aplica'
            && base !== 'no especifica'
            && base !== 'no se especifica'
            && base !== '-';
    }

    tieneNumeroVisible(valor: unknown): boolean {
        const numero = Number(valor);
        return Number.isFinite(numero) && numero > 0;
    }
}
