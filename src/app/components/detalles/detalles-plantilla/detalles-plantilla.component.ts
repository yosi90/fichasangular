import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    DatoFicha,
    DoteFicha,
    EtiquetaFicha,
    HabilidadFicha,
    SortilegaFicha,
    datoAlineamiento,
    datosMinimosCaracteristicas,
    datosModificadoresCaracteristicas,
    datosMovimiento,
    datosVisibles,
    dotesVisibles,
    etiquetaTraducido,
    habilidadesVisibles,
    nombreOriginalVisible,
    sortilegasVisibles,
    textoDesdeDg,
} from 'src/app/components/detalles/ficha';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Plantilla, PlantillaRacialContextual } from 'src/app/interfaces/plantilla';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { GrupoPrerrequisitos, agruparPrerrequisitos } from 'src/app/services/utils/prerrequisito-frase';
import { porNombre } from 'src/app/services/utils/orden-texto';

@Component({
    selector: 'app-detalles-plantilla',
    templateUrl: './detalles-plantilla.component.html',
    standalone: false
})
export class DetallesPlantillaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    plantillaData!: Plantilla;

    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    // Lo que pinta la ficha, calculado una vez al recibir la plantilla. Los modificadores se agrupan: lo que define la
    // plantilla en los datos clave y, en el cuerpo, características, combate y defensas, movimiento y DG de animal.
    etiquetas: (string | EtiquetaFicha)[] = [];
    datos: DatoFicha[] = [];
    /** Lo que dice el manual de la criatura con la plantilla: entorno, organización, valor de desafío, tesoro y avance. */
    ecologia: DatoFicha[] = [];
    modificadoresCaracteristicas: DatoFicha[] = [];
    minimosCaracteristicas: DatoFicha[] = [];
    combate: DatoFicha[] = [];
    movimiento: DatoFicha[] = [];
    dadosGolpeAnimal: DatoFicha[] = [];
    dotes: DoteFicha[] = [];
    sortilegas: SortilegaFicha[] = [];
    habilidades: HabilidadFicha[] = [];
    raciales: RacialPlantilla[] = [];
    ataquesEspeciales: RacialPlantilla[] = [];
    compatibilidades: { tipoComp: string; tipoNuevo: string; }[] = [];
    subtipos: SubtipoRef[] = [];

    @Input()
    set plantilla(value: Plantilla) {
        this.plantillaData = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
        this.etiquetas = [value?.Nacimiento ? 'Heredada' : null, etiquetaTraducido(value)]
            .filter((etiqueta): etiqueta is string | EtiquetaFicha => etiqueta !== null);
        const puntosHabilidad = toNumber(value?.Puntos_habilidad?.Suma);
        this.datos = datosVisibles([
            { etiqueta: 'Ajuste de nivel', valor: toNumber(value?.Ajuste_nivel) > 0 ? `+${toNumber(value?.Ajuste_nivel)}` : null },
            { etiqueta: 'Tamaño', valor: value?.Tamano?.Nombre },
            { etiqueta: 'Cambio de tamaño', valor: value?.Modificacion_tamano?.Nombre },
            {
                etiqueta: 'Dado de golpe',
                valor: this.tieneTipoDadoVisible() ? value?.Tipo_dado?.Nombre : null,
                // `Actualiza_dg`: cambian también los DG de clase, actuales y futuros; si no, solo los de la criatura base.
                detalle: value?.Actualiza_dg ? 'también los DG de clase' : 'los DG de la criatura base',
            },
            { etiqueta: 'Cambio del dado de golpe', valor: value?.Modificacion_dg?.Nombre },
            { etiqueta: 'Puntos de habilidad por DG', valor: puntosHabilidad > 0 ? puntosHabilidad : null, detalle: '+ mod. de Int' },
            datoAlineamiento(value?.Alineamiento),
            { etiqueta: 'Nombre original', valor: nombreOriginalVisible(value) },
        ]);
        this.ecologia = datosVisibles([
            { etiqueta: 'Entorno', valor: value?.Entorno },
            { etiqueta: 'Organización', valor: value?.Organizacion },
            { etiqueta: 'Valor de desafío', valor: value?.Vd },
            { etiqueta: 'Tesoro', valor: value?.Tesoro },
            { etiqueta: 'Avance', valor: value?.Avance },
        ]);
        this.modificadoresCaracteristicas = datosModificadoresCaracteristicas(value?.Modificadores_caracteristicas);
        this.minimosCaracteristicas = datosMinimosCaracteristicas(value?.Minimos_caracteristicas);
        this.combate = this.calcularCombate();
        this.movimiento = datosMovimiento(value?.Movimientos, value?.Maniobrabilidad?.Nombre);
        this.dadosGolpeAnimal = this.calcularDadosGolpeAnimal();
        this.dotes = dotesVisibles(value?.Dotes);
        this.sortilegas = sortilegasVisibles(value?.Sortilegas);
        this.habilidades = habilidadesVisibles(value?.Habilidades, (habilidad) => habilidad.Rangos);
        this.raciales = racialesVisibles(value?.Raciales);
        this.ataquesEspeciales = racialesVisibles(value?.Ataques_especiales);
        this.compatibilidades = this.calcularCompatibilidades();
        this.subtipos = (value?.Subtipos ?? [])
            .filter(subtipo => tieneTextoVisible(subtipo?.Nombre))
            .sort(porNombre);
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    @Output() racialDetalles: EventEmitter<RacialDetalle> = new EventEmitter<RacialDetalle>();

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

    abrirDetallesRacial(racial: RacialDetalle) {
        if (racial && tieneTextoVisible(racial.Nombre))
            this.racialDetalles.emit(racial);
    }

    abrirDetalleSubtipo(subtipo: SubtipoRef) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!tieneTextoVisible(nombre))
            return;
        const id = Number(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    readonly tieneTextoVisible = tieneTextoVisible;

    get hayMovimiento(): boolean {
        return this.movimiento.length > 0 || tieneTextoVisible(this.plantillaData?.Velocidades);
    }

    get hayCaracteristicas(): boolean {
        return this.modificadoresCaracteristicas.length > 0 || this.minimosCaracteristicas.length > 0;
    }

    private tieneTipoDadoVisible(): boolean {
        // Regla de negocio: el comodín «Elegir» en el tipo de dado (`Tipo_dado_comodin`) es que la plantilla no
        // modifica el dado de golpe.
        return tieneTextoVisible(this.plantillaData?.Tipo_dado?.Nombre)
            && this.plantillaData?.Tipo_dado_comodin !== 'elegir';
    }

    private calcularCombate(): DatoFicha[] {
        const p = this.plantillaData;
        const cambio = (valor: unknown) => toNumber(valor) !== 0 ? textoConSigno(toNumber(valor)) : null;
        return datosVisibles([
            { etiqueta: 'Ataque base', valor: cambio(p?.Ataque_base) },
            { etiqueta: 'Presa', valor: cambio(p?.Presa) },
            { etiqueta: 'Iniciativa', valor: cambio(p?.Iniciativa) },
            { etiqueta: 'Fortaleza', valor: cambio(p?.Fortaleza) },
            { etiqueta: 'Reflejos', valor: cambio(p?.Reflejos) },
            { etiqueta: 'Voluntad', valor: cambio(p?.Voluntad) },
            { etiqueta: 'CA', valor: p?.Ca },
            { etiqueta: 'Reducción de daño', valor: p?.Reduccion_dano },
            { etiqueta: 'Resistencia a conjuros', valor: p?.Resistencia_conjuros },
            { etiqueta: 'Resistencia elemental', valor: p?.Resistencia_elemental },
            { etiqueta: 'CD', valor: toNumber(p?.Cd) > 0 ? toNumber(p?.Cd) : null },
        ]);
    }

    /**
     * Los DG del animal base de un licántropo (`Licantronia_dg`; `null` en las demás plantillas), su tipo y los puntos de
     * habilidad que da cada uno (los del tipo + mod. de Int, mínimo 1; Manual de monstruos).
     */
    private calcularDadosGolpeAnimal(): DatoFicha[] {
        const dg = this.plantillaData?.Licantronia_dg;
        const multiplicador = toNumber(dg?.Multiplicador);
        const suma = toNumber(dg?.Suma);
        const tipo = dg?.Tipo_criatura ?? null;
        return datosVisibles([
            { etiqueta: 'DG otorgados', valor: multiplicador > 0 ? multiplicador : null },
            { etiqueta: 'Dado', valor: dg?.Dado },
            { etiqueta: 'Tipo de los DG', valor: tipo?.Nombre ?? null },
            { etiqueta: 'Suma de PG', valor: suma !== 0 ? textoConSigno(suma) : null },
            {
                etiqueta: 'Puntos de habilidad',
                valor: tipo && toNumber(tipo.Puntos_habilidad) > 0 ? `${toNumber(tipo.Puntos_habilidad)} + mod. de Int por DG` : null,
            },
        ]);
    }

    private calcularCompatibilidades(): { tipoComp: string; tipoNuevo: string; }[] {
        return (this.plantillaData?.Compatibilidad_tipos ?? [])
            .map(item => {
                const tipoComp = tieneTextoVisible(item.Tipo_comp) ? `${item.Tipo_comp}` : `Tipo #${item.Id_tipo_comp}`;
                if (item.Tipo_nuevo_comodin === 'cualquiera')
                    return { tipoComp, tipoNuevo: tipoComp };
                return {
                    tipoComp,
                    tipoNuevo: item.Id_tipo_nuevo > 0
                        ? (tieneTextoVisible(item.Tipo_nuevo) ? `${item.Tipo_nuevo}` : `Tipo #${item.Id_tipo_nuevo}`)
                        : 'No cambia',
                };
            });
    }
}

/** Una aptitud racial o un ataque especial de la plantilla, con los DG desde los que lo da («desde 4 DG»). */
interface RacialPlantilla {
    racial: RacialDetalle;
    desde: string;
}

/** Las que tienen nombre, en su orden. */
function racialesVisibles(raciales: PlantillaRacialContextual[] | null | undefined): RacialPlantilla[] {
    return (raciales ?? [])
        .filter((item) => tieneTextoVisible(item?.Racial?.Nombre))
        .map((item) => ({ racial: item.Racial, desde: textoDesdeDg(item.Dg) }));
}
