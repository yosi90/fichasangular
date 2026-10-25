import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { nombreDoteConExtra, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { GrupoPrerrequisitos, agruparPrerrequisitos } from 'src/app/services/utils/prerrequisito-frase';
import { porNombre } from 'src/app/services/utils/orden-texto';

type CambioNumerico = {
    etiqueta: string;
    valor: number;
};

type CambioTexto = {
    etiqueta: string;
    valor: string;
};

@Component({
    selector: 'app-detalles-plantilla',
    templateUrl: './detalles-plantilla.component.html',
    styleUrls: ['./detalles-plantilla.component.sass'],
    standalone: false
})
export class DetallesPlantillaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    plantillaData!: Plantilla;

    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set plantilla(value: Plantilla) {
        this.plantillaData = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.plantillaData?.Manual?.Id,
            nombre: this.plantillaData?.Manual?.Nombre,
        });
    }

    abrirDetallesConjuro(idConjuro: number) {
        const id = Number(idConjuro);
        if (Number.isFinite(id) && id > 0)
            this.conjuroDetalles.emit(id);
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = Number(doteCtx?.Dote?.Id);
        if (Number.isFinite(id) && id > 0)
            this.doteDetalles.emit(id);
    }

    readonly tieneTextoVisible = tieneTextoVisible;
    readonly getNombreDote = nombreDoteConExtra;

    getSigno(valor: number): string {
        return valor > 0 ? `+${valor}` : `${valor}`;
    }

    tieneCambiosMovimientos(): boolean {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return false;

        return toNumber(mov.Correr) > 0
            || toNumber(mov.Nadar) > 0
            || toNumber(mov.Volar) > 0
            || toNumber(mov.Trepar) > 0
            || toNumber(mov.Escalar) > 0
            || this.tieneManiobrabilidadVisible();
    }

    getMovimientosVisibles(): CambioNumerico[] {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return [];

        const cambios: CambioNumerico[] = [
            { etiqueta: 'Correr', valor: toNumber(mov.Correr) },
            { etiqueta: 'Nadar', valor: toNumber(mov.Nadar) },
            { etiqueta: 'Volar', valor: toNumber(mov.Volar) },
            { etiqueta: 'Trepar', valor: toNumber(mov.Trepar) },
            { etiqueta: 'Escalar', valor: toNumber(mov.Escalar) },
        ];

        return cambios.filter(c => c.valor > 0);
    }

    tieneManiobrabilidadVisible(): boolean {
        // Sin vuelo, la API da la maniobrabilidad a `null` (antes, «No vuela»).
        return this.tieneTextoVisible(this.plantillaData?.Maniobrabilidad?.Nombre);
    }

    tieneTipoDadoVisible(): boolean {
        // Regla de negocio: el comodín «Elegir» en el tipo de dado (`Tipo_dado_comodin`) es que la plantilla no
        // modifica el dado de golpe.
        return this.tieneTextoVisible(this.plantillaData?.Tipo_dado?.Nombre)
            && this.plantillaData?.Tipo_dado_comodin !== 'elegir';
    }

    getDgsOtorgadosPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Multiplicador);
    }

    getMultiplicadorDgsPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Multiplicador);
    }

    getSumaPgsPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Suma);
    }

    getDadoDgsPlantilla(): string {
        const dado = `${this.plantillaData?.Licantronia_dg?.Dado ?? ''}`.trim();
        return this.tieneTextoVisible(dado) ? dado : '-';
    }

    tieneBloqueDgsPlantilla(): boolean {
        return this.getDgsOtorgadosPlantilla() > 0
            || this.getSumaPgsPlantilla() !== 0
            || this.getDadoDgsPlantilla() !== '-';
    }

    getCambiosCombateNumericos(): CambioNumerico[] {
        return [
            { etiqueta: 'Ataque base', valor: toNumber(this.plantillaData?.Ataque_base) },
            { etiqueta: 'Iniciativa', valor: toNumber(this.plantillaData?.Iniciativa) },
            { etiqueta: 'Presa', valor: toNumber(this.plantillaData?.Presa) },
            { etiqueta: 'Fortaleza', valor: toNumber(this.plantillaData?.Fortaleza) },
            { etiqueta: 'Reflejos', valor: toNumber(this.plantillaData?.Reflejos) },
            { etiqueta: 'Voluntad', valor: toNumber(this.plantillaData?.Voluntad) },
        ].filter(c => c.valor !== 0);
    }

    getCambiosCombateTexto(): CambioTexto[] {
        const cambios: CambioTexto[] = [
            { etiqueta: 'CA', valor: `${this.plantillaData?.Ca ?? ''}` },
            { etiqueta: 'Reducción de daño', valor: `${this.plantillaData?.Reduccion_dano ?? ''}` },
            { etiqueta: 'Resistencia a conjuros', valor: `${this.plantillaData?.Resistencia_conjuros ?? ''}` },
            { etiqueta: 'Resistencia elemental', valor: `${this.plantillaData?.Resistencia_elemental ?? ''}` },
        ];

        return cambios.filter(c => this.tieneTextoVisible(c.valor));
    }

    tieneCambiosCombateDefensas(): boolean {
        return this.getCambiosCombateNumericos().length > 0 || this.getCambiosCombateTexto().length > 0;
    }

    getModificadoresCaracteristicasVisibles(): CambioNumerico[] {
        const mod = this.plantillaData?.Modificadores_caracteristicas;
        if (!mod)
            return [];

        return [
            { etiqueta: 'Fue', valor: toNumber(mod.Fuerza) },
            { etiqueta: 'Des', valor: toNumber(mod.Destreza) },
            { etiqueta: 'Con', valor: toNumber(mod.Constitucion) },
            { etiqueta: 'Int', valor: toNumber(mod.Inteligencia) },
            { etiqueta: 'Sab', valor: toNumber(mod.Sabiduria) },
            { etiqueta: 'Car', valor: toNumber(mod.Carisma) },
        ].filter(c => c.valor !== 0);
    }

    getMinimosCaracteristicasVisibles(): CambioNumerico[] {
        const min = this.plantillaData?.Minimos_caracteristicas;
        if (!min)
            return [];

        return [
            { etiqueta: 'Fue', valor: toNumber(min.Fuerza) },
            { etiqueta: 'Des', valor: toNumber(min.Destreza) },
            { etiqueta: 'Con', valor: toNumber(min.Constitucion) },
            { etiqueta: 'Int', valor: toNumber(min.Inteligencia) },
            { etiqueta: 'Sab', valor: toNumber(min.Sabiduria) },
            { etiqueta: 'Car', valor: toNumber(min.Carisma) },
        ].filter(c => c.valor > 0);
    }

    tieneCambiosCaracteristicas(): boolean {
        return this.getModificadoresCaracteristicasVisibles().length > 0
            || this.getMinimosCaracteristicasVisibles().length > 0;
    }

    getCompatibilidadesVisibles(): { tipoComp: string; tipoNuevo: string; }[] {
        return (this.plantillaData?.Compatibilidad_tipos ?? [])
            .map(item => {
                const tipoComp = this.tieneTextoVisible(item.Tipo_comp) ? `${item.Tipo_comp}` : `Tipo #${item.Id_tipo_comp}`;
                if (item.Tipo_nuevo_comodin === 'cualquiera') {
                    return {
                        tipoComp,
                        tipoNuevo: tipoComp,
                    };
                }

                return {
                    tipoComp,
                    tipoNuevo: item.Id_tipo_nuevo > 0
                        ? (this.tieneTextoVisible(item.Tipo_nuevo) ? `${item.Tipo_nuevo}` : `Tipo #${item.Id_tipo_nuevo}`)
                        : 'No cambia',
                };
            });
    }

    getSubtiposActivos(): SubtipoRef[] {
        return (this.plantillaData?.Subtipos ?? [])
            .filter(subtipo => this.tieneTextoVisible(subtipo?.Nombre))
            .sort(porNombre);
    }

    abrirDetalleSubtipo(subtipo: SubtipoRef) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }
}
