import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, DoteFicha, SortilegaFicha, datosMovimiento, datoAlineamiento, datosVisibles, dotesVisibles, sortilegasVisibles } from 'src/app/components/detalles/ficha';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { SubtipoDetalle } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { idiomasVisibles, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-subtipo',
    templateUrl: './detalles-subtipo.component.html',
    standalone: false
})
export class DetallesSubtipoComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    private subtipoData!: SubtipoDetalle;

    // Lo que pinta la ficha, calculado una vez al recibir el subtipo.
    etiquetas: string[] = [];
    datos: DatoFicha[] = [];
    combate: DatoFicha[] = [];
    movimiento: DatoFicha[] = [];
    dotes: DoteFicha[] = [];
    sortilegas: SortilegaFicha[] = [];
    rasgos: Rasgo[] = [];
    idiomas: { Nombre: string; Descripcion: string; }[] = [];
    plantillas: { Id: number; Nombre: string; }[] = [];

    @Input()
    set subtipo(value: SubtipoDetalle) {
        this.subtipoData = value;
        this.etiquetas = value?.Heredada ? ['Heredado'] : [];
        const cambio = (valor: unknown) => toNumber(valor) !== 0 ? textoConSigno(toNumber(valor)) : null;
        this.datos = datosVisibles([
            { etiqueta: 'Ajuste de nivel', valor: cambio(value?.Ajuste_nivel) },
            datoAlineamiento(value?.Alineamiento),
            { etiqueta: 'Tesoro', valor: value?.Tesoro },
        ]);
        this.combate = datosVisibles([
            { etiqueta: 'Ataque base', valor: cambio(value?.Ataque_base) },
            { etiqueta: 'Presa', valor: cambio(value?.Presa) },
            { etiqueta: 'Iniciativa', valor: cambio(value?.Iniciativa) },
            { etiqueta: 'Fortaleza', valor: cambio(value?.Fortaleza) },
            { etiqueta: 'Reflejos', valor: cambio(value?.Reflejos) },
            { etiqueta: 'Voluntad', valor: cambio(value?.Voluntad) },
            { etiqueta: 'CA', valor: value?.Ca },
            { etiqueta: 'Reducción de daño', valor: value?.Rd },
            { etiqueta: 'Resistencia a conjuros', valor: value?.Rc },
            { etiqueta: 'Resistencia elemental', valor: value?.Re },
            { etiqueta: 'CD', valor: value?.Cd },
        ]);
        this.movimiento = datosMovimiento(value?.Movimientos, `${value?.Maniobrabilidad?.['Nombre'] ?? ''}`);
        this.dotes = dotesVisibles(value?.Dotes);
        this.sortilegas = sortilegasVisibles(value?.Sortilegas);
        this.rasgos = (value?.Rasgos ?? []).filter((rasgo) => tieneTextoVisible(rasgo?.Nombre));
        this.idiomas = idiomasVisibles(value?.Idiomas);
        this.plantillas = (value?.Plantillas ?? []).filter((plantilla) => tieneTextoVisible(plantilla?.Nombre));
    }

    get subtipo(): SubtipoDetalle {
        return this.subtipoData;
    }

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
        if (rasgo && tieneTextoVisible(rasgo?.Nombre))
            this.rasgoDetalles.emit(rasgo);
    }

    abrirDetallesPlantilla(idPlantilla: number) {
        const id = Number(idPlantilla);
        if (Number.isFinite(id) && id > 0)
            this.plantillaDetalles.emit(id);
    }
}
