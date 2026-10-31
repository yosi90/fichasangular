import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PasoEdadRaza } from 'src/app/interfaces/raza';
import { OpcionCategoriaEdad, OpcionPasoEdad } from 'src/app/services/utils/razas-por-edades';

let siguienteId = 0;

/**
 * El bloque «Categoría de edad» de la vista previa de una raza que crece por edades (lienzo de los dragones jugables,
 * tableros 1 y 2): las categorías de la raza en su orden, con el NEP (o el VD, creando un PNJ) debajo de cada una. Las que
 * el personaje no puede elegir salen atenuadas, con «Solo PNJ» y su motivo debajo. Si una categoría tiene varios pasos
 * (la tabla 3-21 del *Draconomicón*), se elige también el paso. Al pulsar, emite el paso; quien lo usa pide la raza a esa
 * edad y cambia las cifras de debajo.
 *
 * Con `permitirSaltar` (el máster que se salta las reglas de su campaña), las edades sin ajuste de un PJ siguen atenuadas
 * con «Solo PNJ», pero se pueden pulsar para mirarlas y elegirlas igualmente desde el pie, como homebrew.
 */
@Component({
    selector: 'app-creacion-edad',
    template: `
        <section class="creacion-edad" [attr.aria-labelledby]="idTitulo">
            <div class="creacion-edad__cabecera">
                <h3 class="creacion-titulo" [id]="idTitulo">Categoría de edad</h3>
                <span class="creacion-edad__ayuda">{{pnj ? 'Como PNJ, cualquier edad' : 'Como personaje jugador, las que tienen ajuste de nivel'}}</span>
            </div>
            <div class="creacion-edad__categorias" role="radiogroup" [attr.aria-labelledby]="idTitulo">
                <button type="button" role="radio" class="creacion-edad__categoria" *ngFor="let categoria of opciones"
                    [class.creacion-edad__categoria--elegida]="categoria.id === categoriaElegida?.id"
                    [class.creacion-edad__categoria--saltable]="categoria.bloqueada && puedeMirar(categoria)"
                    [attr.aria-checked]="categoria.id === categoriaElegida?.id" [disabled]="categoria.bloqueada && !puedeMirar(categoria)"
                    [attr.aria-describedby]="categoria.bloqueada ? idMotivos : null" (click)="elegirCategoria(categoria)">
                    <span class="creacion-edad__nombre">{{categoria.nombre}}</span>
                    <span class="creacion-edad__pie">{{categoria.pie}}</span>
                </button>
            </div>
            <div class="creacion-edad__pasos" role="radiogroup" *ngIf="categoriaElegida && categoriaElegida.pasos.length > 1"
                [attr.aria-label]="'Edad dentro de ' + categoriaElegida.nombre">
                <button type="button" role="radio" class="creacion-opcion creacion-opcion--caja" *ngFor="let opcion of categoriaElegida.pasos"
                    [class.creacion-opcion--activa]="opcion.paso.Id === idPaso" [class.creacion-opcion--bloqueada]="opcion.bloqueado"
                    [attr.aria-checked]="opcion.paso.Id === idPaso" [disabled]="opcion.bloqueado && !(permitirSaltar && opcion.saltable)"
                    (click)="elegir.emit(opcion.paso)">
                    <span class="creacion-opcion__texto">{{opcion.texto}}</span>
                    <span class="creacion-opcion__estado" *ngIf="opcion.motivo">{{opcion.motivo}}</span>
                </button>
            </div>
            <ul class="creacion-edad__motivos" [id]="idMotivos" *ngIf="motivos.length > 0">
                <li *ngFor="let motivo of motivos">{{motivo}}</li>
            </ul>
        </section>`,
    standalone: false
})
export class CreacionEdadComponent implements OnChanges {
    @Input() opciones: OpcionCategoriaEdad[] = [];
    /** El paso que se mira. */
    @Input() idPaso: number | null = null;
    /** Creando un PNJ: todas las edades, con su VD. */
    @Input() pnj = false;
    /** El máster que se salta las reglas de su campaña: puede mirar (y elegir igualmente) las edades sin ajuste. */
    @Input() permitirSaltar = false;
    @Output() elegir = new EventEmitter<PasoEdadRaza>();

    readonly idTitulo = `creacion-edad-${++siguienteId}`;
    readonly idMotivos = `${this.idTitulo}-motivos`;
    categoriaElegida: OpcionCategoriaEdad | null = null;
    /** Por qué salen atenuadas las que salen atenuadas, sin repetir: «Solo PNJ: el manual no da ajuste…». */
    motivos: string[] = [];

    ngOnChanges(): void {
        this.categoriaElegida = this.opciones.find((categoria) => categoria.pasos.some((opcion) => opcion.paso.Id === this.idPaso)) ?? null;
        const motivos = this.opciones
            .filter((categoria) => categoria.bloqueada && categoria.motivo)
            .map((categoria) => categoria.pie === 'Solo PNJ' ? `Solo PNJ: ${categoria.motivo}` : `${categoria.nombre}: ${categoria.motivo}`);
        this.motivos = Array.from(new Set(motivos));
    }

    /** Si se puede pulsar una categoría bloqueada: solo para elegirla igualmente (`permitirSaltar` y algún paso saltable). */
    puedeMirar(categoria: OpcionCategoriaEdad): boolean {
        return this.permitirSaltar && categoria.saltable;
    }

    elegirCategoria(categoria: OpcionCategoriaEdad): void {
        const vale = (opcion: OpcionPasoEdad) => !opcion.bloqueado || (this.puedeMirar(categoria) && opcion.saltable);
        if (categoria.bloqueada && !this.puedeMirar(categoria))
            return;
        const actual = categoria.pasos.find((opcion) => opcion.paso.Id === this.idPaso && vale(opcion));
        const paso = actual?.paso ?? categoria.pasos.find(vale)?.paso;
        if (paso)
            this.elegir.emit(paso);
    }
}
