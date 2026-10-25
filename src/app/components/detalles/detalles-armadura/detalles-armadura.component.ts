import { Component, Input } from '@angular/core';
import { DatoFicha, unirTipo } from 'src/app/components/detalles/ficha';
import { descripcionEquipoVisible } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoDestrezaMaxima, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { tieneNumeroVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-armadura',
    templateUrl: './detalles-armadura.component.html',
    standalone: false
})
export class DetallesArmaduraComponent {
    private armaduraActual!: ArmaduraDetalle;

    @Input()
    set armadura(valor: ArmaduraDetalle) {
        this.armaduraActual = valor;
        this.tipoCabecera = this.construirTipo();
        this.datos = this.construirDatos();
        this.conDescripcion = descripcionEquipoVisible(valor);
    }
    get armadura(): ArmaduraDetalle {
        return this.armaduraActual;
    }

    /** «Armadura · Intermedia» o «Escudo · Broquel». */
    tipoCabecera = '';
    datos: DatoFicha[] = [];
    conDescripcion = false;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.armadura?.Manual?.Id,
            nombre: this.armadura?.Manual?.Nombre,
        });
    }

    private construirTipo(): string {
        const armadura = this.armadura;
        if (!armadura)
            return '';
        return armadura.Es_escudo
            ? unirTipo(['Escudo', armadura.Tipo_escudo?.Nombre])
            : unirTipo(['Armadura', armadura.Peso_armadura?.Nombre]);
    }

    private construirDatos(): DatoFicha[] {
        const armadura = this.armadura;
        if (!armadura)
            return [];
        const penalizador = Number(armadura.Penalizador);
        return [
            { etiqueta: 'Bonificador a la CA', valor: tieneNumeroVisible(armadura.Ca) ? `+${armadura.Ca}` : null },
            // «+4», o «Sin límite» si la API da `null`.
            { etiqueta: 'Destreza máxima', valor: textoDestrezaMaxima(armadura.Bon_des) },
            {
                etiqueta: 'Penalizador de armadura',
                valor: Number.isFinite(penalizador) && penalizador !== 0 ? `${penalizador}` : null,
                ayuda: 'A las pruebas de las habilidades de Fuerza y Destreza',
            },
            {
                etiqueta: 'Fallo de conjuro arcano',
                valor: tieneNumeroVisible(armadura.Fallo_arcano) ? `${armadura.Fallo_arcano}%` : null,
            },
            { etiqueta: 'Velocidad', valor: this.velocidad(), ayuda: 'Con la armadura, para quien tiene 30 o 20 pies de velocidad' },
            {
                etiqueta: 'Correr',
                valor: tieneNumeroVisible(armadura.Correr_multiplicador) ? `×${armadura.Correr_multiplicador}` : null,
            },
            { etiqueta: 'Precio', valor: tieneNumeroVisible(armadura.Precio) ? textoPrecio(armadura.Precio) : null },
            { etiqueta: 'Peso', valor: tieneNumeroVisible(armadura.Peso) ? textoPeso(armadura.Peso) : null },
            { etiqueta: 'Tamaño', valor: armadura.Tamano?.Nombre },
            { etiqueta: 'Material', valor: armadura.Material?.Nombre },
            // Se completan con la lectura de los manuales.
            { etiqueta: 'Ponérsela', valor: armadura.Tiempo_poner },
            { etiqueta: 'Ponérsela deprisa', valor: armadura.Tiempo_poner_rapido },
            { etiqueta: 'Quitársela', valor: armadura.Tiempo_quitar },
        ];
    }

    /** «20 pies (de 30) · 15 pies (de 20)», si la tiene. */
    private velocidad(): string {
        const partes: string[] = [];
        if (this.armadura?.Velocidad_30 !== null && this.armadura?.Velocidad_30 !== undefined)
            partes.push(`${this.armadura.Velocidad_30} pies (de 30)`);
        if (this.armadura?.Velocidad_20 !== null && this.armadura?.Velocidad_20 !== undefined)
            partes.push(`${this.armadura.Velocidad_20} pies (de 20)`);
        return partes.join(' · ');
    }
}
