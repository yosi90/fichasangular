import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { nombreOriginalVisible } from 'src/app/components/detalles/ficha';
import { Chakra } from 'src/app/interfaces/incarnum';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

/** Una fila del catálogo de chakras. */
export interface FilaChakra {
    chakra: Chakra;
    Nombre: string;
    Original: string;
    Categoria: string;
    Ranura: string;
}

const CUALQUIERA = 'Cualquiera';

export function filaChakra(chakra: Chakra): FilaChakra {
    return {
        chakra,
        Nombre: chakra.Nombre,
        Original: nombreOriginalVisible(chakra),
        Categoria: chakra.Categoria?.Nombre ?? '',
        Ranura: chakra.Ranura?.Nombre ?? '',
    };
}

/**
 * El catálogo de los chakras (Magic of Incarnum), en su orden: categoría y la ranura de objeto que cierra su vínculo. Las
 * clases que lo abren y sus fusiones, en su detalle. Sin paginador: son pocos y van en su orden.
 */
@Component({
    selector: 'app-listado-chakras',
    templateUrl: './listado-chakras.component.html',
    styleUrls: ['./listado-chakras.component.sass'],
    standalone: false
})
export class ListadoChakrasComponent implements OnDestroy, ListadoBuscable {
    chakras: Chakra[] = [];
    filas: FilaChakra[] = [];
    categorias: string[] = [CUALQUIERA];
    defaultCategoria = CUALQUIERA;
    chakrasDS = new MatTableDataSource<FilaChakra>([]);
    readonly chakraColumns = ['Nombre', 'Categoria', 'Ranura'];
    /** El buscador rápido de la cabecera, en español o en inglés. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;

    private catalogoSub?: Subscription;

    constructor(private cdr: ChangeDetectorRef, private incarnumSvc: IncarnumService) { }

    ngAfterViewInit(): void {
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee los chakras (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = this.incarnumSvc.getChakras().subscribe({
            next: (chakras) => {
                this.chakras = chakras ?? [];
                this.filas = this.chakras.map(filaChakra);
                this.categorias = [CUALQUIERA, ...Array.from(new Set(this.filas.map((fila) => fila.Categoria).filter(Boolean)))];
                this.cargado = true;
                this.filtroChakras();
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargado = true;
                this.errorCarga = true;
                this.cdr.detectChanges();
            },
        });
    }

    buscar(texto: string): void {
        this.textoBusqueda = texto ?? '';
        this.filtroChakras();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultCategoria !== CUALQUIERA;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultCategoria = CUALQUIERA;
        this.filtroChakras();
    }

    filtroChakras(): void {
        const texto = normalizarTexto(this.textoBusqueda, true);
        const categoria = normalizarTexto(this.defaultCategoria);
        this.chakrasDS = new MatTableDataSource<FilaChakra>(this.filas.filter(({ chakra, Categoria }) =>
            (texto.length < 1
                || normalizarTexto(chakra.Nombre, true).includes(texto)
                || normalizarTexto(chakra.Nombre_original, true).includes(texto))
            && (this.defaultCategoria === CUALQUIERA || normalizarTexto(Categoria) === categoria)));
    }

    @Output() chakraDetalles = new EventEmitter<Chakra>();
    verDetallesChakra(fila: FilaChakra): void {
        this.chakraDetalles.emit(fila.chakra);
    }

    @Output() chakraSeleccionado = new EventEmitter<Chakra>();
    seleccionarChakra(fila: FilaChakra): void {
        this.chakraSeleccionado.emit(fila.chakra);
    }
}
