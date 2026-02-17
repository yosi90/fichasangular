import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { SubtipoDetalle } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-subtipo',
    templateUrl: './detalles-subtipo.component.html',
    styleUrls: ['./detalles-subtipo.component.sass']
})
export class DetallesSubtipoComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input() subtipo!: SubtipoDetalle;

    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    @Output() plantillaDetalles: EventEmitter<number> = new EventEmitter<number>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.subtipo?.Manual?.Id,
            nombre: this.subtipo?.Manual?.Nombre,
        });
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = Number(doteCtx?.Dote?.Id);
        if (Number.isFinite(id) && id > 0)
            this.doteDetalles.emit(id);
    }

    abrirDetallesConjuro(idConjuro: number) {
        const id = Number(idConjuro);
        if (Number.isFinite(id) && id > 0)
            this.conjuroDetalles.emit(id);
    }

    abrirDetallesRasgo(rasgo: Rasgo) {
        if (rasgo && this.tieneTextoVisible(rasgo?.Nombre))
            this.rasgoDetalles.emit(rasgo);
    }

    abrirDetallesPlantilla(idPlantilla: number) {
        const id = Number(idPlantilla);
        if (Number.isFinite(id) && id > 0)
            this.plantillaDetalles.emit(id);
    }

    getNombreDote(doteCtx: DoteContextual): string {
        const extra = `${doteCtx?.Contexto?.Extra ?? ''}`.trim();
        if (this.tieneTextoVisible(extra) && this.normalizar(extra) !== 'no aplica')
            return `${doteCtx.Dote.Nombre} (${extra})`;
        return doteCtx.Dote.Nombre;
    }

    getAlineamientoResumen(): string {
        const al = this.subtipo?.Alineamiento;
        if (!al)
            return '-';
        const basico = `${al.Basico?.Nombre ?? ''}`.trim();
        const ley = `${al.Ley?.Nombre ?? ''}`.trim();
        const moral = `${al.Moral?.Nombre ?? ''}`.trim();
        if (this.tieneTextoVisible(basico))
            return basico;
        if (this.tieneTextoVisible(ley) || this.tieneTextoVisible(moral))
            return `${ley}/${moral}`.replace(/^\/|\/$/g, '');
        return '-';
    }

    get manualNombre(): string {
        return `${this.subtipo?.Manual?.Nombre ?? ''}`.trim();
    }

    get manualPagina(): number {
        return this.toNumber(this.subtipo?.Manual?.Pagina);
    }

    get maniobrabilidadNombre(): string {
        const raw = this.subtipo?.Maniobrabilidad?.['Nombre'];
        return `${raw ?? ''}`.trim();
    }

    getMovimientoValor(tipo: 'Correr' | 'Nadar' | 'Volar' | 'Trepar' | 'Escalar'): number {
        return this.toNumber(this.subtipo?.Movimientos?.[tipo]);
    }

    get tieneSeccionCombateDefensas(): boolean {
        return this.subtipo.Fortaleza !== 0
            || this.subtipo.Reflejos !== 0
            || this.subtipo.Voluntad !== 0
            || this.getTextosCombateDefensas().length > 0
            || this.tieneTextoVisible(this.subtipo.Tesoro);
    }

    get tieneBonosCombateDefensas(): boolean {
        return this.subtipo.Fortaleza !== 0
            || this.subtipo.Reflejos !== 0
            || this.subtipo.Voluntad !== 0;
    }

    getTextosCombateDefensas(): { etiqueta: string; valor: string; }[] {
        const campos = [
            { etiqueta: 'CA', valor: `${this.subtipo?.Ca ?? ''}` },
            { etiqueta: 'RD', valor: `${this.subtipo?.Rd ?? ''}` },
            { etiqueta: 'RC', valor: `${this.subtipo?.Rc ?? ''}` },
            { etiqueta: 'RE', valor: `${this.subtipo?.Re ?? ''}` },
            { etiqueta: 'CD', valor: `${this.subtipo?.Cd ?? ''}` },
            { etiqueta: 'Tesoro', valor: `${this.subtipo?.Tesoro ?? ''}` },
        ];

        return campos.filter((c) => this.tieneTextoVisible(c.valor));
    }

    get tieneSeccionMovimientos(): boolean {
        return this.getMovimientoValor('Correr') > 0
            || this.getMovimientoValor('Nadar') > 0
            || this.getMovimientoValor('Volar') > 0
            || this.getMovimientoValor('Trepar') > 0
            || this.getMovimientoValor('Escalar') > 0
            || this.tieneTextoVisible(this.maniobrabilidadNombre);
    }

    get tienePanelesRelacionados(): boolean {
        return (this.subtipo.Dotes?.length ?? 0) > 0
            || (this.subtipo.Sortilegas?.length ?? 0) > 0
            || (this.subtipo.Rasgos?.length ?? 0) > 0
            || (this.subtipo.Plantillas?.length ?? 0) > 0;
    }

    get tieneResumenSubtipo(): boolean {
        return this.subtipo.Heredada
            || !this.subtipo.Oficial
            || this.subtipo.Ajuste_nivel !== 0
            || this.subtipo.Ataque_base !== 0
            || this.subtipo.Presa !== 0
            || this.subtipo.Iniciativa !== 0
            || this.tieneTextoVisible(this.getAlineamientoResumen())
            || this.manualPagina > 0
            || this.tieneTextoVisible(this.manualNombre);
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = this.normalizar(texto);
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica'
            && limpiado !== 'no se especifica'
            && limpiado !== 'no aplica'
            && limpiado !== 'no modifica'
            && limpiado !== 'no vuela'
            && limpiado !== '-';
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
}
