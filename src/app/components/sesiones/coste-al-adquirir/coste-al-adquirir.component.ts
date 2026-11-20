import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';

/** Lo que cuesta adquirir algo con el personaje ya creado: los PX, las po y, en una plantilla, los niveles que pierde antes. */
export interface CosteDelResumen {
    px: number;
    po: number;
    niveles?: number;
}

/**
 * «Lo que cuesta» del resumen de la plantilla y la raza mutada adquiridas: los niveles que pierde antes (solo si los hay),
 * los PX (que no le pueden bajar de nivel), las po de su saldo (con lo que tiene y si no le llega) y la casilla de «las paga
 * otro». Sin coste, nada. Su host no ocupa sitio (`display: contents`): el bloque queda en la tarjeta del resumen como antes.
 */
@Component({
    selector: 'app-coste-al-adquirir',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './coste-al-adquirir.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    host: { style: 'display: contents' },
})
export class CosteAlAdquirirComponent {
    @Input() coste: CosteDelResumen | null = null;
    /** Las po que tiene. */
    @Input() saldo = 0;
    /** Las po las paga otro (un mecenas, o ya se apuntaron): no salen de su saldo. */
    @Input() poPagadasPorOtro = false;
    @Output() poPagadasPorOtroChange = new EventEmitter<boolean>();

    px(valor: number): string {
        return formatoPx(valor);
    }

    cambiarPagadasPorOtro(valor: boolean): void {
        this.poPagadasPorOtro = valor;
        this.poPagadasPorOtroChange.emit(valor);
    }
}
