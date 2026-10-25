import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArmaDetalle, ArmaPropiedad } from 'src/app/interfaces/arma';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoConSigno, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';
import { tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-arma',
    templateUrl: './detalles-arma.component.html',
    styleUrls: ['./detalles-arma.component.sass'],
    standalone: false
})
export class DetallesArmaComponent {
    @Input() arma!: ArmaDetalle;
    /** La munición que dispara, para abrir su detalle. */
    @Output() municionDetallesId = new EventEmitter<number>();

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.arma?.Manual?.Id,
            nombre: this.arma?.Manual?.Nombre,
        });
    }

    abrirMunicion() {
        const id = Number(this.arma?.Municion?.Id ?? 0);
        if (id > 0)
            this.municionDetallesId.emit(id);
    }

    get manualLabel(): string {
        return etiquetaManual(this.arma?.Manual);
    }

    get incrementoDistanciaVisible(): string {
        const incremento = Number(this.arma?.Incremento_distancia ?? 0);
        return incremento > 0 ? `${incremento} pies` : '';
    }

    get precioVisible(): string {
        return textoPrecio(this.arma?.Precio);
    }

    get pesoVisible(): string {
        return textoPeso(this.arma?.Peso);
    }

    /** Lo que es el arma además de su manejo: a distancia, arrojadiza, doble. */
    get rasgos(): string[] {
        const rasgos: string[] = [];
        if (this.arma?.A_distancia)
            rasgos.push('A distancia');
        if (this.arma?.Arrojadiza)
            rasgos.push('Arrojadiza');
        if (this.arma?.Doble)
            rasgos.push('Doble');
        return rasgos;
    }

    /** «Desarmar +2»; sin valor, solo el nombre. */
    textoPropiedad(propiedad: ArmaPropiedad): string {
        const valor = propiedad?.Valor;
        return valor === null || valor === undefined || valor === 0
            ? propiedad.Nombre
            : `${propiedad.Nombre} ${textoConSigno(valor)}`;
    }

    readonly tieneTextoVisible = tieneTextoVisible;
    readonly tieneNumeroVisible = tieneNumeroVisible;
    readonly textoConSigno = textoConSigno;
}
