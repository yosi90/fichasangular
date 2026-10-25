import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, datosVisibles } from 'src/app/components/detalles/ficha';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { nombreDoteConExtra, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
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
    etiquetas: string[] = [];
    datos: DatoFicha[] = [];
    modificadoresCaracteristicas: DatoFicha[] = [];
    minimosCaracteristicas: DatoFicha[] = [];
    combate: DatoFicha[] = [];
    movimiento: DatoFicha[] = [];
    dadosGolpeAnimal: DatoFicha[] = [];
    dotes: { contexto: DoteContextual; nombre: string; }[] = [];
    sortilegas: { id: number; nombre: string; detalle: string; }[] = [];
    compatibilidades: { tipoComp: string; tipoNuevo: string; }[] = [];
    subtipos: SubtipoRef[] = [];

    @Input()
    set plantilla(value: Plantilla) {
        this.plantillaData = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
        this.etiquetas = value?.Nacimiento ? ['Heredada'] : [];
        this.datos = datosVisibles([
            { etiqueta: 'Ajuste de nivel', valor: toNumber(value?.Ajuste_nivel) > 0 ? `+${toNumber(value?.Ajuste_nivel)}` : null },
            { etiqueta: 'Tamaño', valor: value?.Tamano?.Nombre },
            { etiqueta: 'Dado de golpe', valor: this.tieneTipoDadoVisible() ? value?.Tipo_dado?.Nombre : null },
        ]);
        this.modificadoresCaracteristicas = this.caracteristicas(value?.Modificadores_caracteristicas, (n) => n !== 0 ? this.signo(n) : null);
        this.minimosCaracteristicas = this.caracteristicas(value?.Minimos_caracteristicas, (n) => n > 0 ? n : null);
        this.combate = this.calcularCombate();
        this.movimiento = this.calcularMovimiento();
        this.dadosGolpeAnimal = this.calcularDadosGolpeAnimal();
        this.dotes = (value?.Dotes ?? [])
            .map((contexto) => ({ contexto, nombre: nombreDoteConExtra(contexto) }))
            .filter((dote) => tieneTextoVisible(dote.nombre));
        this.sortilegas = (value?.Sortilegas ?? [])
            .filter((s) => tieneTextoVisible(s?.Conjuro?.Nombre))
            .map((s) => ({
                id: toNumber(s.Conjuro.Id),
                nombre: `${s.Conjuro.Nombre}`.trim(),
                detalle: [`NL ${toNumber(s.Nivel_lanzador)}`, tieneTextoVisible(s.Usos_diarios) ? `${s.Usos_diarios}`.trim() : '']
                    .filter(Boolean).join(' · '),
            }));
        this.compatibilidades = this.calcularCompatibilidades();
        this.subtipos = (value?.Subtipos ?? [])
            .filter(subtipo => tieneTextoVisible(subtipo?.Nombre))
            .sort(porNombre);
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

    get hayCaracteristicas(): boolean {
        return this.modificadoresCaracteristicas.length > 0 || this.minimosCaracteristicas.length > 0;
    }

    private tieneTipoDadoVisible(): boolean {
        // Regla de negocio: el comodín «Elegir» en el tipo de dado (`Tipo_dado_comodin`) es que la plantilla no
        // modifica el dado de golpe.
        return tieneTextoVisible(this.plantillaData?.Tipo_dado?.Nombre)
            && this.plantillaData?.Tipo_dado_comodin !== 'elegir';
    }

    private caracteristicas(
        valores: Plantilla['Modificadores_caracteristicas'] | null | undefined,
        valor: (numero: number) => string | number | null,
    ): DatoFicha[] {
        if (!valores)
            return [];
        return datosVisibles(CARACTERISTICAS.map((clave) => ({
            etiqueta: NOMBRES_CARACTERISTICAS[clave],
            valor: valor(toNumber(valores[clave])),
        })));
    }

    private calcularCombate(): DatoFicha[] {
        const p = this.plantillaData;
        const cambio = (valor: unknown) => toNumber(valor) !== 0 ? this.signo(toNumber(valor)) : null;
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
        ]);
    }

    private calcularMovimiento(): DatoFicha[] {
        const mov = this.plantillaData?.Movimientos;
        const pies = (valor: unknown) => toNumber(valor) > 0 ? `${toNumber(valor)}'` : null;
        return datosVisibles([
            { etiqueta: 'Correr', valor: pies(mov?.Correr) },
            { etiqueta: 'Nadar', valor: pies(mov?.Nadar) },
            { etiqueta: 'Volar', valor: pies(mov?.Volar) },
            { etiqueta: 'Trepar', valor: pies(mov?.Trepar) },
            { etiqueta: 'Escalar', valor: pies(mov?.Escalar) },
            // Sin vuelo, la API da la maniobrabilidad a `null` (antes, «No vuela»).
            { etiqueta: 'Maniobrabilidad', valor: this.plantillaData?.Maniobrabilidad?.Nombre },
        ]);
    }

    /** Los DG del animal base de un licántropo (`Licantronia_dg`; `null` en las demás plantillas). */
    private calcularDadosGolpeAnimal(): DatoFicha[] {
        const dg = this.plantillaData?.Licantronia_dg;
        const multiplicador = toNumber(dg?.Multiplicador);
        const suma = toNumber(dg?.Suma);
        const dado = `${dg?.Dado ?? ''}`.trim();
        if (multiplicador <= 0 && suma === 0 && !tieneTextoVisible(dado))
            return [];
        return datosVisibles([
            { etiqueta: 'DG otorgados', valor: multiplicador > 0 ? multiplicador : null },
            { etiqueta: 'Dado', valor: dado },
            { etiqueta: 'Suma de PG', valor: suma !== 0 ? this.signo(suma) : null },
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

    private signo(valor: number): string {
        return valor > 0 ? `+${valor}` : `${valor}`;
    }
}
