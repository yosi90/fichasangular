import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';

@Component({
    selector: 'app-detalles-especial',
    templateUrl: './detalles-especial.component.html',
    styleUrls: ['./detalles-especial.component.sass']
})
export class DetallesEspecialComponent {
    @Input() especial!: EspecialClaseDetalle;
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

    getBonificadoresActivos(): { clave: string, valor: number }[] {
        if (!this.especial?.Bonificadores)
            return [];
        return Object.entries(this.especial.Bonificadores)
            .filter(([, value]) => value !== 0)
            .map(([clave, valor]) => ({ clave, valor }));
    }

    getFlagsExtraActivos(): string[] {
        if (!this.especial?.Flags_extra)
            return [];

        const flags = this.especial.Flags_extra;
        const activos: string[] = [];
        if (flags.Da_CA) activos.push('Da CA');
        if (flags.Da_armadura_natural) activos.push('Da armadura natural');
        if (flags.Da_RD) activos.push('Da RD');
        if (flags.Da_velocidad) activos.push('Da velocidad');
        return activos;
    }

    getExtrasOrdenados() {
        return [...(this.especial?.Extras ?? [])]
            .filter(extra => this.tieneTextoVisible(extra?.Extra))
            .sort((a, b) => Number(a.Orden ?? 0) - Number(b.Orden ?? 0));
    }

    getHabilidadesOrdenadas() {
        return [...(this.especial?.Habilidades ?? [])]
            .filter(habilidad => this.tieneTextoVisible(habilidad?.Habilidad))
            .sort((a, b) => `${a.Habilidad}`.localeCompare(`${b.Habilidad}`, 'es', { sensitivity: 'base' }));
    }

    getExtraVisibleHabilidad(habilidad: { Id_extra?: number; Extra?: string; }): string {
        const hasIdExtra = Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'Id_extra')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'id_extra')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'i_ex')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'ie');

        return resolverExtraHabilidadVisible({
            extra: habilidad?.Extra,
            idExtra: habilidad?.Id_extra,
            soportaExtra: this.especial?.Extra || this.especial?.Activa_extra,
            allowIdZeroAsChoose: hasIdExtra,
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
            && limpiado !== 'no vuela';
    }

    abrirDetalleSubtipo() {
        const nombre = `${this.especial?.Subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(this.especial?.Subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }
}
