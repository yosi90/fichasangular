import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { nombreOriginalVisible } from 'src/app/components/detalles/ficha';
import { Chakra } from 'src/app/interfaces/incarnum';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

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
 * clases que lo abren y sus fusiones, en su detalle.
 */
@Component({
    selector: 'app-listado-chakras',
    templateUrl: './listado-chakras.component.html',
    styleUrls: ['./listado-chakras.component.sass'],
    standalone: false
})
export class ListadoChakrasComponent implements OnDestroy {
    chakras: Chakra[] = [];
    filas: FilaChakra[] = [];
    categorias: string[] = [CUALQUIERA];
    defaultCategoria = CUALQUIERA;
    chakrasDS = new MatTableDataSource<FilaChakra>([]);
    readonly chakraColumns = ['Nombre', 'Categoria', 'Ranura'];
    readonly titulosColumnas: Record<string, string> = {
        Nombre: 'Chakra',
        Categoria: 'Categoría',
        Ranura: 'Ranura que cierra',
    };

    private readonly destroy$ = new Subject<void>();

    constructor(private cdr: ChangeDetectorRef, private incarnumSvc: IncarnumService) { }

    @ViewChild('chakraTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit(): void {
        this.incarnumSvc.getChakras()
            .pipe(takeUntil(this.destroy$))
            .subscribe((chakras) => {
                this.chakras = chakras ?? [];
                this.filas = this.chakras.map(filaChakra);
                this.categorias = [CUALQUIERA, ...Array.from(new Set(this.filas.map((fila) => fila.Categoria).filter(Boolean)))];
                this.filtroChakras();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroChakras(): void {
        const texto = normalizarTexto(this.nombreText?.nativeElement?.value ?? '', true);
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
