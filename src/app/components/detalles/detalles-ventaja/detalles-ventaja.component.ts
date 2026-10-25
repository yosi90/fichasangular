import { Component, Input } from '@angular/core';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { ReferenciaCorta, VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-ventaja',
    templateUrl: './detalles-ventaja.component.html',
    standalone: false
})
export class DetallesVentajaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    private ventajaData!: VentajaDetalle;

    // Lo que pinta la ficha, calculado una vez al recibir la ventaja. El contrato de `VentajaDetalle` no trae si es
    // oficial (la web lo rellenaba siempre a `false`), así que la cabecera no lleva Oficial ni Homebrew.
    /** «Ventaja» o «Desventaja», según el coste. */
    tipoCabecera = '';
    datos: DatoFicha[] = [];
    /** Las características y salvaciones a las que afecta. */
    afectaA: string[] = [];
    efectos: string[] = [];

    @Input()
    set ventaja(value: VentajaDetalle) {
        this.ventajaData = value;
        const coste = Number(value?.Coste ?? 0);
        const mejora = Number(value?.Mejora ?? 0);
        this.tipoCabecera = coste > 0 ? 'Desventaja' : 'Ventaja';
        this.datos = [
            { etiqueta: 'Coste', valor: value ? this.signo(coste) : null },
            { etiqueta: 'Mejora', valor: mejora !== 0 ? this.signo(mejora) : null },
            { etiqueta: 'Rasgo', valor: this.referencia(value?.Rasgo) },
            { etiqueta: 'Idioma', valor: this.referencia(value?.Idioma) },
            // Sin habilidad, la API da `null` (antes, la habilidad 0 «No»). Ninguna ventaja tiene una habilidad comodín.
            { etiqueta: 'Habilidad', valor: this.referencia(value?.Habilidad) },
        ];
        this.afectaA = [
            value?.Fuerza ? 'Fuerza' : '',
            value?.Destreza ? 'Destreza' : '',
            value?.Constitucion ? 'Constitución' : '',
            value?.Inteligencia ? 'Inteligencia' : '',
            value?.Sabiduria ? 'Sabiduría' : '',
            value?.Carisma ? 'Carisma' : '',
            value?.Fortaleza ? 'Fortaleza' : '',
            value?.Reflejos ? 'Reflejos' : '',
            value?.Voluntad ? 'Voluntad' : '',
        ].filter(Boolean);
        this.efectos = [
            value?.Caracteristica ? 'Ajusta una característica' : '',
            value?.Iniciativa ? 'Afecta a la iniciativa' : '',
            value?.Aumenta_oro ? 'Aumenta el oro inicial' : '',
            value?.Duplica_oro ? 'Duplica el oro inicial' : '',
            value?.Idioma_extra ? 'Otorga un idioma extra' : '',
            value?.Disipable ? 'Disipable' : '',
        ].filter(Boolean);
    }

    get ventaja(): VentajaDetalle {
        return this.ventajaData;
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.ventaja?.Manual?.Id,
            nombre: this.ventaja?.Manual?.Nombre,
        });
    }

    /** El nombre de un rasgo, idioma o habilidad, si viene con id y nombre. */
    private referencia(ref: ReferenciaCorta | null | undefined): string | null {
        return Number(ref?.Id ?? 0) > 0 && tieneTextoVisible(ref?.Nombre) ? `${ref?.Nombre}`.trim() : null;
    }

    private signo(valor: number): string {
        return `${valor > 0 ? '+' : ''}${valor}`;
    }
}
