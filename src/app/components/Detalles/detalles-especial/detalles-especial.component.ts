import { Component, Input } from '@angular/core';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';

@Component({
    selector: 'app-detalles-especial',
    templateUrl: './detalles-especial.component.html',
    styleUrls: ['./detalles-especial.component.sass']
})
export class DetallesEspecialComponent {
    @Input() especial!: EspecialClaseDetalle;

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

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica' && limpiado !== 'no se especifica' && limpiado !== 'no aplica';
    }
}
