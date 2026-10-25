import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContexto, DoteContextual } from 'src/app/interfaces/dote-contextual';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import {
    CondicionPrerrequisito,
    GrupoPrerrequisitos,
    agruparPrerrequisitos,
    destinoPrerrequisito,
} from 'src/app/services/utils/prerrequisito-frase';

@Component({
    selector: 'app-detalles-dote',
    templateUrl: './detalles-dote.component.html',
    styleUrls: ['./detalles-dote.component.sass'],
    standalone: false
})
export class DetallesDoteComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    doteData!: Dote;
    contexto?: DoteContexto;
    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set dote(value: Dote | DoteContextual) {
        if ((value as DoteContextual)?.Dote) {
            this.doteData = (value as DoteContextual).Dote;
            this.contexto = (value as DoteContextual).Contexto;
        } else {
            this.doteData = value as Dote;
            this.contexto = undefined;
        }
        this.prerrequisitosAgrupados = agruparPrerrequisitos(this.doteData?.Prerrequisitos);
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.doteData?.Manual?.Id,
            nombre: this.doteData?.Manual?.Nombre,
        });
    }

    getTipos(): string {
        return this.doteData?.Tipos?.map(t => t.Nombre).join(', ') ?? '';
    }

    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();

    getModificadoresActivos(): { clave: string, valor: number }[] {
        if (!this.doteData?.Modificadores)
            return [];
        return Object.entries(this.doteData.Modificadores)
            .filter(([, value]) => value !== 0)
            .map(([clave, valor]) => ({ clave, valor }));
    }

    getExtrasDisponibles(): { nombre: string, items: { Id: number, Nombre: string }[] }[] {
        if (!this.doteData?.Extras_disponibles)
            return [];
        const activas = new Set(this.getExtrasSoportadosActivos().map(extra => extra.nombre));
        const armaduras = this.doteData.Extras_disponibles.Armaduras ?? [];
        return [
            { nombre: 'Armas', items: this.doteData.Extras_disponibles.Armas ?? [] },
            { nombre: 'Armaduras', items: armaduras.filter((item: any) => !item?.Es_escudo) },
            { nombre: 'Escudos', items: armaduras.filter((item: any) => !!item?.Es_escudo) },
            { nombre: 'Escuelas', items: this.doteData.Extras_disponibles.Escuelas ?? [] },
            { nombre: 'Habilidades', items: this.doteData.Extras_disponibles.Habilidades ?? [] },
        ].filter(bloque => activas.has(bloque.nombre) && bloque.items.length > 0);
    }

    bloqueExtraRequiereCompetencia(nombreBloque: string): boolean {
        if (!this.doteData?.Comp_arma)
            return false;
        return nombreBloque === 'Armas' || nombreBloque === 'Escudos';
    }

    esExtraNavegable(nombreBloque: string): boolean {
        return nombreBloque === 'Armas' || nombreBloque === 'Armaduras' || nombreBloque === 'Escudos';
    }

    abrirDetalleExtra(nombreBloque: string, item: { Id: number, Nombre: string }): void {
        const id = Number(item?.Id ?? 0);
        if (!this.esExtraNavegable(nombreBloque) || !Number.isFinite(id) || id <= 0)
            return;
        if (nombreBloque === 'Armas') {
            this.armaDetallesId.emit(id);
            return;
        }
        this.armaduraDetallesId.emit(id);
    }

    getExtrasSoportadosActivos(): { nombre: string, activo: boolean }[] {
        if (!this.doteData?.Extras_soportados)
            return [];
        return [
            { nombre: 'Armas', activo: !!this.doteData.Extras_soportados.Extra_arma },
            {
                nombre: 'Armaduras',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_armaduras ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            {
                nombre: 'Escudos',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_escudos ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            { nombre: 'Escuelas', activo: !!this.doteData.Extras_soportados.Extra_escuela },
            { nombre: 'Habilidades', activo: !!this.doteData.Extras_soportados.Extra_habilidad },
        ].filter(extra => extra.activo);
    }

    tieneExtras(): boolean {
        return this.getExtrasSoportadosActivos().length > 0;
    }

    readonly tieneTextoVisible = tieneTextoVisible;

    esPrerrequisitoNavegable(condicion: CondicionPrerrequisito): boolean {
        const destino = destinoPrerrequisito(condicion);
        return destino?.entidad === 'arma' || destino?.entidad === 'armadura';
    }

    abrirDetallePrerrequisito(condicion: CondicionPrerrequisito): void {
        const destino = destinoPrerrequisito(condicion);
        if (destino?.entidad === 'arma')
            this.armaDetallesId.emit(destino.id);
        else if (destino?.entidad === 'armadura')
            this.armaduraDetallesId.emit(destino.id);
    }

    getOrigenContexto(): string {
        if (!this.contexto || this.contexto.Entidad !== 'personaje')
            return '';
        return this.contexto.Origen?.trim() ?? '';
    }
}
