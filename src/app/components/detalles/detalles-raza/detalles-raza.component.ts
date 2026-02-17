import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Raza } from 'src/app/interfaces/raza';
import { SubtipoRef } from 'src/app/interfaces/subtipo';

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass']
})
export class DetallesRazaComponent {
    @Input() raza!: Raza;

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

    abrirDetalleRacial(racial: RacialDetalle) {
        const nombre = `${racial?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;

        const id = Number(racial?.Id);
        this.racialDetallesPorNombre.emit({
            id: Number.isFinite(id) && id > 0 ? id : null,
            nombre,
        });
    }

    getRacialesActivos(): RacialDetalle[] {
        return (this.raza?.Raciales ?? [])
            .filter(racial => this.tieneTextoVisible(racial?.Nombre))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    getSubtiposActivos(): SubtipoRef[] {
        return (this.raza?.Subtipos ?? [])
            .filter(subtipo => this.tieneTextoVisible(subtipo?.Nombre))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
            && limpiado !== 'no vuela'
            && limpiado !== '-';
    }

    tieneNumeroNoCero(valor: number | string | null | undefined): boolean {
        const parsed = Number(valor);
        return Number.isFinite(parsed) && Math.abs(parsed) > 0.0001;
    }
}
