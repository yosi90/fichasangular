import { Component, Input } from '@angular/core';
import { ICONOS_ROL, TipoRol, tipoRolDeVentaja } from 'src/app/services/utils/iconos-rol';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { ReferenciaCorta, VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { textoVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-ventaja',
    templateUrl: './detalles-ventaja.component.html',
    standalone: false
})
export class DetallesVentajaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    private ventajaData!: VentajaDetalle;

    // Lo que pinta la ficha, calculado una vez al recibir la ventaja. Las ventajas y desventajas son un sistema propio
    // del propietario (decisión del 2026-10-25), así que la cabecera siempre dice Homebrew.
    /** «Ventaja» o «Desventaja», según el coste. */
    tipoCabecera = '';
    /** El icono de la cabecera: el de su catálogo y variante (`ICONOS_ROL`). */
    iconoCabecera: TipoRol = 'ventaja';
    datos: DatoFicha[] = [];
    /** Las características y salvaciones a las que afecta. */
    afectaA: string[] = [];
    efectos: string[] = [];

    @Input()
    set ventaja(value: VentajaDetalle) {
        this.ventajaData = value;
        const coste = Number(value?.Coste ?? 0);
        const mejora = Number(value?.Mejora ?? 0);
        this.iconoCabecera = tipoRolDeVentaja(value);
        this.tipoCabecera = ICONOS_ROL[this.iconoCabecera].etiqueta;
        this.datos = [
            // Un coste 0 se enseña sin signo («0»); el resto, con él.
            { etiqueta: 'Coste', valor: value ? (coste === 0 ? 0 : textoConSigno(coste)) : null },
            { etiqueta: 'Mejora', valor: mejora !== 0 ? textoConSigno(mejora) : null },
            { etiqueta: 'Rasgo', valor: this.referencia(value?.Rasgo), ayuda: this.descripcion(value?.Rasgo) },
            { etiqueta: 'Idioma', valor: this.referencia(value?.Idioma), ayuda: this.descripcion(value?.Idioma) },
            // Sin habilidad, la API da `null` (antes, la habilidad 0 «No»). Ninguna ventaja tiene una habilidad comodín.
            { etiqueta: 'Habilidad', valor: this.referencia(value?.Habilidad), ayuda: this.descripcion(value?.Habilidad) },
        ];
        this.afectaA = [
            ...CARACTERISTICAS.map((clave) => value?.[clave] ? NOMBRES_CARACTERISTICAS[clave] : ''),
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

    /** La descripción de un rasgo, idioma o habilidad, para el tooltip de su nombre. */
    private descripcion(ref: ReferenciaCorta | null | undefined): string {
        return textoVisible(ref?.Descripcion);
    }

    /** El nombre de un rasgo, idioma o habilidad, si viene con id y nombre. */
    private referencia(ref: ReferenciaCorta | null | undefined): string | null {
        return Number(ref?.Id ?? 0) > 0 && tieneTextoVisible(ref?.Nombre) ? `${ref?.Nombre}`.trim() : null;
    }
}
