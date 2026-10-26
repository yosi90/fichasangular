import { Component, Input } from '@angular/core';
import { DatoFicha, EtiquetaFicha, unirTipo } from 'src/app/components/detalles/ficha';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Id_nombre } from 'src/app/interfaces/genericas';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { toInt } from 'src/app/services/utils/normalizacion';
import { tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-conjuro',
    templateUrl: './detalles-conjuro.component.html',
    standalone: false
})
export class DetallesConjuroComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input()
    set sortilega(value: {ap: AptitudSortilega, fuente: string}) {
        this.ap = value.ap;
        this.fuente =  value.fuente;
        this.conjuro = value.ap.Conjuro;
    }
    @Input()
    set conjuro(value: Conjuro) {
        this.conjuroData = value;
        this.tipoCabecera = this.construirTipo();
        this.etiquetas = this.construirEtiquetas();
        this.datos = this.construirDatos();
        this.datosSortilega = this.construirDatosSortilega();
    }
    get conjuro(): Conjuro {
        return this.conjuroData;
    }

    private conjuroData!: Conjuro;
    ap!: AptitudSortilega;
    fuente: string = '';

    /** La línea del tipo de la cabecera. */
    tipoCabecera = '';
    etiquetas: EtiquetaFicha[] = [];
    /** Los datos clave, en el orden del manual. Lo que la API da `null` no sale. */
    datos: DatoFicha[] = [];
    /** Lo propio de la aptitud sortílega: con qué nivel la usa, cuántas veces y de dónde le viene. */
    datosSortilega: DatoFicha[] = [];

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual(this.conjuro?.Manual);
    }

    getDescriptores(lista: Id_nombre[]): string {
        return lista.map(d => d.Nombre).join(', ')
    }

    get tieneDescriptores(): boolean {
        return this.descriptoresVisibles.length > 0;
    }

    get descriptoresVisibles(): Id_nombre[] {
        return (Array.isArray(this.conjuro?.Descriptores) ? this.conjuro.Descriptores : [])
            .filter((item) => this.hasText(item?.Nombre));
    }

    get muestraAumentos(): boolean {
        return this.conjuro?.Psionico === true && this.hasText(this.conjuro?.Descripcion_aumentos);
    }

    get tituloComponentes(): string {
        return this.conjuro?.Psionico === true ? 'Despliegues' : 'Componentes';
    }

    get componentesVisibles(): Conjuro['Componentes'] {
        return (Array.isArray(this.conjuro?.Componentes) ? this.conjuro.Componentes : [])
            .filter((item) => this.hasText(item?.Componente));
    }

    get nivelesClaseVisibles(): Conjuro['Nivel_clase'] {
        return (Array.isArray(this.conjuro?.Nivel_clase) ? this.conjuro.Nivel_clase : [])
            .filter((item) => toInt(item?.Id_clase) > 0 && this.hasText(item?.Clase));
    }

    get nivelesDominioVisibles(): Conjuro['Nivel_dominio'] {
        if (this.conjuro?.Psionico === true)
            return [];
        return (Array.isArray(this.conjuro?.Nivel_dominio) ? this.conjuro.Nivel_dominio : [])
            .filter((item) => toInt(item?.Id_dominio) > 0 && this.hasText(item?.Dominio));
    }

    get nivelesDisciplinaVisibles(): Conjuro['Nivel_disciplinas'] {
        if (this.conjuro?.Psionico !== true)
            return [];
        return (Array.isArray(this.conjuro?.Nivel_disciplinas) ? this.conjuro.Nivel_disciplinas : [])
            .filter((item) => toInt(item?.Id_disciplina) > 0 && this.hasText(item?.Disciplina));
    }

    get esSortilega(): boolean {
        return !!this.ap && this.hasText(this.fuente);
    }

    /**
     * La línea del tipo: «Conjuro arcano · Transmutación [Fuego]» o «Poder psiónico · Metacreatividad (Creación)», con
     * «Aptitud sortílega» delante si se ve como la de una criatura o un personaje.
     */
    private construirTipo(): string {
        const c = this.conjuro;
        const clase = c?.Psionico
            ? 'Poder psiónico'
            : `Conjuro${c?.Arcano && c?.Divino ? ' arcano y divino' : c?.Arcano ? ' arcano' : c?.Divino ? ' divino' : ''}`;
        // La disciplina lleva su subdisciplina entre paréntesis («Metacreatividad (Creación)»).
        const subdisciplinas = (c?.Disciplina?.Subdisciplinas ?? []).map((sub) => `${sub?.Nombre ?? ''}`.trim()).filter((nombre) => this.hasText(nombre));
        const disciplina = [c?.Disciplina?.Nombre, subdisciplinas.length > 0 ? `(${subdisciplinas.join(', ')})` : '']
            .filter((parte) => this.hasText(parte)).join(' ');
        const rama = c?.Psionico ? disciplina : c?.Escuela?.Nombre;
        const descriptores = this.tieneDescriptores ? `[${this.getDescriptores(this.descriptoresVisibles)}]` : '';
        const ramaConDescriptores = [this.hasText(rama) ? `${rama}`.trim() : '', descriptores].filter(Boolean).join(' ');
        return unirTipo([this.esSortilega ? 'Aptitud sortílega' : null, clase, ramaConDescriptores]);
    }

    private construirEtiquetas(): EtiquetaFicha[] {
        return [
            this.conjuro?.Alma ? { texto: 'Alma' } : null,
            this.conjuro?.Permanente ? { texto: 'Puede hacerse permanente' } : null,
        ].filter((etiqueta): etiqueta is EtiquetaFicha => etiqueta !== null);
    }

    private construirDatos(): DatoFicha[] {
        const c = this.conjuro;
        const psionico = c?.Psionico === true;
        return [
            { etiqueta: 'Tiempo de lanzamiento', valor: c?.Tiempo_lanzamiento },
            { etiqueta: this.tituloComponentes, valor: this.componentesVisibles.map(item => item.Componente).join(', ') },
            { etiqueta: 'Alcance', valor: c?.Alcance === '0' ? 'Personal' : c?.Alcance },
            { etiqueta: 'Duración', valor: c?.Duracion },
            { etiqueta: 'Objetivo', valor: c?.Objetivo },
            { etiqueta: 'Efecto', valor: c?.Efecto },
            { etiqueta: 'Área', valor: c?.Area },
            { etiqueta: 'Tirada de salvación', valor: c?.Tipo_salvacion },
            { etiqueta: 'Resistencia a conjuros', valor: !psionico || c?.Resistencia_conjuros ? !!c?.Resistencia_conjuros : null },
            { etiqueta: 'Resistencia a poderes', valor: psionico || c?.Resistencia_poderes ? !!c?.Resistencia_poderes : null },
            { etiqueta: 'Puntos de poder', valor: psionico && tieneNumeroVisible(c?.Puntos_poder) ? Number(c.Puntos_poder) : null },
        ];
    }

    private construirDatosSortilega(): DatoFicha[] {
        if (!this.esSortilega)
            return [];
        return [
            { etiqueta: 'Nivel de lanzador', valor: this.ap.Nivel_lanzador },
            { etiqueta: 'Usos diarios', valor: this.ap.Usos_diarios },
            { etiqueta: 'Dados de golpe necesarios', valor: tieneNumeroVisible(this.ap.Dgs_necesarios) ? this.ap.Dgs_necesarios : null },
            { etiqueta: 'La obtuvo de', valor: this.ap.Origen !== this.fuente ? this.ap.Origen : null },
        ];
    }

    /** Sin dato, la API da `null` (antes, «No especifica»). */
    private hasText(value: any): boolean {
        return tieneTextoVisible(`${value ?? ''}`);
    }

}
