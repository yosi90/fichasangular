import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import {
    CondicionPrerrequisito,
    GrupoPrerrequisitos,
    agruparPrerrequisitos,
    destinoPrerrequisito,
} from 'src/app/services/utils/prerrequisito-frase';

@Component({
    selector: 'app-detalles-racial',
    templateUrl: './detalles-racial.component.html',
    styleUrls: ['./detalles-racial.component.sass'],
    standalone: false
})
export class DetallesRacialComponent {
    private racialActual!: RacialDetalle;
    /** Los prerrequisitos (raza y característica) con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set racial(value: RacialDetalle) {
        this.racialActual = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
    }

    get racial(): RacialDetalle {
        return this.racialActual;
    }

    @Output() razaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();

    get habilidadesBase(): Record<string, any>[] {
        return this.racial?.Habilidades?.Base ?? [];
    }

    get habilidadesCustom(): Record<string, any>[] {
        return this.racial?.Habilidades?.Custom ?? [];
    }

    readonly tieneTextoVisible = tieneTextoVisible;

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
            extraComodin: item['Extra_comodin'],
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

    esPrerrequisitoNavegable(condicion: CondicionPrerrequisito): boolean {
        return destinoPrerrequisito(condicion)?.entidad === 'raza';
    }

    abrirDetallePrerrequisito(condicion: CondicionPrerrequisito): void {
        const destino = destinoPrerrequisito(condicion);
        if (destino?.entidad === 'raza')
            this.razaDetallesId.emit(destino.id);
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
