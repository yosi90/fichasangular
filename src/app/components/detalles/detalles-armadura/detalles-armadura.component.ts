import { Component, Input } from '@angular/core';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { etiquetaManual, textoConSigno, textoDestrezaMaxima, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

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
        return etiquetaManual(this.armadura?.Manual);
    }

    /** La Destreza máxima: «+4» o «Sin límite» (`Bon_des` `null`). */
    get bonusDesLabel(): string {
        return textoDestrezaMaxima(this.armadura?.Bon_des);
    }

    get precioVisible(): string {
        return textoPrecio(this.armadura?.Precio);
    }

    get pesoVisible(): string {
        return textoPeso(this.armadura?.Peso);
    }

    /** La velocidad con la armadura («20 pies (30) · 15 pies (20)»), si la tiene. */
    get velocidadVisible(): string {
        const partes: string[] = [];
        if (this.armadura?.Velocidad_30 !== null && this.armadura?.Velocidad_30 !== undefined)
            partes.push(`${this.armadura.Velocidad_30} pies (de 30)`);
        if (this.armadura?.Velocidad_20 !== null && this.armadura?.Velocidad_20 !== undefined)
            partes.push(`${this.armadura.Velocidad_20} pies (de 20)`);
        return partes.join(' · ');
    }

    /** Ponérsela, deprisa y quitársela, con lo que se sepa (se completan con la lectura de los manuales). */
    get tiempos(): { etiqueta: string; valor: string; }[] {
        return [
            { etiqueta: 'Ponérsela', valor: this.armadura?.Tiempo_poner ?? '' },
            { etiqueta: 'Deprisa', valor: this.armadura?.Tiempo_poner_rapido ?? '' },
            { etiqueta: 'Quitársela', valor: this.armadura?.Tiempo_quitar ?? '' },
        ].filter((tiempo) => tieneTextoVisible(tiempo.valor));
    }

    readonly tieneTextoVisible = tieneTextoVisible;
    readonly textoConSigno = textoConSigno;

    tieneNumeroVisible(valor: unknown): boolean {
        const numero = Number(valor);
        return valor !== null && valor !== undefined && Number.isFinite(numero) && numero > 0;
    }

    tieneNumeroNoCero(valor: unknown): boolean {
        const numero = Number(valor);
        return valor !== null && valor !== undefined && Number.isFinite(numero) && numero !== 0;
    }
}
