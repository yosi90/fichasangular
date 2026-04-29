import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';

@Component({
    selector: 'app-detalles-racial',
    templateUrl: './detalles-racial.component.html',
    styleUrls: ['./detalles-racial.component.sass'],
    standalone: false
})
export class DetallesRacialComponent {
    @Input() racial!: RacialDetalle;
    @Output() razaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();

    get habilidadesBase(): Record<string, any>[] {
        return this.racial?.Habilidades?.Base ?? [];
    }

    get habilidadesCustom(): Record<string, any>[] {
        return this.racial?.Habilidades?.Custom ?? [];
    }

    get prerrequisitosRaza(): Record<string, any>[] {
        return this.racial?.Prerrequisitos?.raza ?? [];
    }

    get prerrequisitosCaracteristica(): Record<string, any>[] {
        return this.racial?.Prerrequisitos?.caracteristica ?? [];
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica'
            && limpiado !== 'no se especifica'
            && limpiado !== 'no aplica'
            && limpiado !== 'no modifica'
            && limpiado !== 'no vuela';
    }

    tieneColeccionVisible<T>(value: T[] | null | undefined): boolean {
        return Array.isArray(value) && value.length > 0;
    }

    getExtraVisibleHabilidad(raw: Record<string, any> | null | undefined): string {
        const item = raw ?? {};
        const hasIdExtra = Object.prototype.hasOwnProperty.call(item, 'Id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'i_ex')
            || Object.prototype.hasOwnProperty.call(item, 'ie');

        return resolverExtraHabilidadVisible({
            extra: item['Extra'] ?? item['extra'] ?? item['x'],
            idExtra: item['Id_extra'] ?? item['id_extra'] ?? item['i_ex'] ?? item['ie'],
            soportaExtra: item['Soporta_extra'] ?? item['soporta_extra'],
            allowIdZeroAsChoose: hasIdExtra,
        });
    }

    formatOpenObject(value: Record<string, any> | null | undefined): string {
        if (!value || typeof value !== 'object')
            return '';

        return Object.entries(value)
            .map(([key, raw]) => `${this.formatearClave(key)}: ${this.formatValue(raw)}`)
            .join(' | ');
    }

    emitirDote(idDote: number): void {
        const id = Number(idDote);
        if (Number.isFinite(id) && id > 0)
            this.doteDetallesId.emit(id);
    }

    getNombrePrerrequisitoRaza(item: Record<string, any> | null | undefined): string {
        const nombre = `${item?.['Raza'] ?? item?.['raza'] ?? item?.['Nombre_raza'] ?? item?.['nombre_raza'] ?? item?.['Nombre'] ?? item?.['nombre'] ?? ''}`.trim();
        return nombre;
    }

    getIdPrerrequisitoRaza(item: Record<string, any> | null | undefined): number {
        const id = Number(item?.['Id_raza'] ?? item?.['id_raza'] ?? item?.['IdRaza'] ?? item?.['idRaza'] ?? 0);
        return Number.isFinite(id) && id > 0 ? id : 0;
    }

    tienePrerrequisitoRazaNavegable(item: Record<string, any> | null | undefined): boolean {
        return this.getIdPrerrequisitoRaza(item) > 0;
    }

    tienePrerrequisitoRazaNombrado(item: Record<string, any> | null | undefined): boolean {
        return this.getNombrePrerrequisitoRaza(item).length > 0;
    }

    emitirRaza(idRaza: number | null | undefined): void {
        const id = Number(idRaza);
        if (Number.isFinite(id) && id > 0)
            this.razaDetallesId.emit(id);
    }

    puedeAbrirConjuro(sortilega: { Conjuro?: { Id?: number | null; } | null; } | null | undefined): boolean {
        const id = Number(sortilega?.Conjuro?.Id);
        return Number.isFinite(id) && id > 0;
    }

    emitirConjuro(idConjuro: number | null | undefined): void {
        const id = Number(idConjuro);
        if (Number.isFinite(id) && id > 0)
            this.conjuroDetallesId.emit(id);
    }

    private formatValue(value: any): string {
        if (Array.isArray(value))
            return value.map(item => this.formatValue(item)).join(', ');
        if (value && typeof value === 'object')
            return Object.entries(value).map(([key, raw]) => `${this.formatearClave(key)}=${this.formatValue(raw)}`).join(', ');
        return `${value ?? ''}`;
    }

    private formatearClave(value: string): string {
        return `${value ?? ''}`.replace(/_/g, ' ');
    }
}
