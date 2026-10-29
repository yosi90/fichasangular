import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { ChakraDetalle } from 'src/app/interfaces/incarnum';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/** Una fila del catálogo de chakras. */
export interface FilaChakra {
    chakra: ChakraDetalle;
    Nombre: string;
    Original: string;
    Categoria: string;
    Ranura: string;
    Clases: string;
    Fusiones: number;
}

const CUALQUIERA = 'Cualquiera';

export function filaChakra(chakra: ChakraDetalle): FilaChakra {
    return {
        chakra,
        Nombre: chakra.Nombre,
        Original: chakra.Traducido && chakra.Nombre_original && chakra.Nombre_original !== chakra.Nombre ? chakra.Nombre_original : '',
        Categoria: chakra.Categoria?.Nombre ?? '',
        Ranura: chakra.Ranura?.Nombre ?? '',
        Clases: [...chakra.Clases].sort((a, b) => a.Nivel - b.Nivel).map((clase) => `${clase.Nombre} ${clase.Nivel}`).join(', '),
        Fusiones: chakra.Fusiones.length,
    };
}

/**
 * El catálogo de los chakras (Magic of Incarnum), en su orden: categoría, la ranura de objeto que cierra su vínculo,
 * las clases que lo abren (y desde qué nivel) y cuántas fusiones se moldean o se vinculan en él.
 */
@Component({
    selector: 'app-listado-chakras',
    templateUrl: './listado-chakras.component.html',
    styleUrls: ['./listado-chakras.component.sass'],
    standalone: false
})
export class ListadoChakrasComponent implements OnDestroy {
    chakras: ChakraDetalle[] = [];
    filas: FilaChakra[] = [];
    categorias: string[] = [CUALQUIERA];
    defaultCategoria = CUALQUIERA;
    chakrasDS = new MatTableDataSource<FilaChakra>([]);
    readonly chakraColumns = ['Nombre', 'Categoria', 'Ranura', 'Clases', 'Fusiones'];
    readonly titulosColumnas: Record<string, string> = {
        Nombre: 'Chakra',
        Categoria: 'Categoría',
        Ranura: 'Ranura que cierra',
        Clases: 'Lo abren',
        Fusiones: 'Fusiones',
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

    @Output() chakraDetalles = new EventEmitter<ChakraDetalle>();
    verDetallesChakra(fila: FilaChakra): void {
        this.chakraDetalles.emit(fila.chakra);
    }

    @Output() chakraSeleccionado = new EventEmitter<ChakraDetalle>();
    seleccionarChakra(fila: FilaChakra): void {
        this.chakraSeleccionado.emit(fila.chakra);
    }
}
