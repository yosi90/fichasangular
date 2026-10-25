import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subscription } from 'rxjs';
import {
    ConjuntoObjetosDetalle,
    EncantamientoDetalle,
    EntradaEquipo,
    MaterialDetalle,
    MunicionDetalle,
    TextoEquipo,
} from 'src/app/interfaces/equipo';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { formatoNumero, textoAplicaA, textoConSigno, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { compararTexto } from 'src/app/services/utils/orden-texto';

/** Los catálogos pequeños del equipo que se listan con este componente (los objetos van paginados aparte). */
export type TipoListadoEquipo = 'material' | 'municion' | 'encantamiento' | 'conjunto';

type ItemListadoEquipo = (MaterialDetalle | MunicionDetalle | EncantamientoDetalle | ConjuntoObjetosDetalle) & TextoEquipo;

interface ColumnaEquipo {
    clave: string;
    etiqueta: string;
    valor: (item: any) => string;
}

interface ConfiguracionListado {
    singular: string;
    plural: string;
    cargar: (svc: EquipoService) => Observable<ItemListadoEquipo[]>;
    columnas: ColumnaEquipo[];
}

/** Lo que vale una aptitud especial: su bonificador equivalente o su precio fijo. */
function valorEncantamiento(item: EncantamientoDetalle): string {
    if (item.Modificador > 0)
        return `Bonificador ${textoConSigno(item.Modificador)}`;
    return item.Coste > 0 ? textoPrecio(item.Coste) : '—';
}

const CONFIGURACION: Readonly<Record<TipoListadoEquipo, ConfiguracionListado>> = {
    material: {
        singular: 'material', plural: 'materiales',
        cargar: (svc) => svc.getMateriales(),
        columnas: [
            { clave: 'Dureza', etiqueta: 'Dureza', valor: (item: MaterialDetalle) => item.Dureza === null ? '—' : formatoNumero(item.Dureza) },
        ],
    },
    municion: {
        singular: 'munición', plural: 'munición',
        cargar: (svc) => svc.getMuniciones(),
        columnas: [
            { clave: 'Precio', etiqueta: 'Precio', valor: (item: MunicionDetalle) => `${textoPrecio(item.Precio)} (${item.Cantidad_por_precio})` },
            { clave: 'Armas', etiqueta: 'Armas', valor: (item: MunicionDetalle) => item.Armas.map((arma) => arma.Nombre).join(', ') },
        ],
    },
    encantamiento: {
        singular: 'aptitud especial', plural: 'aptitudes especiales',
        cargar: (svc) => svc.getEncantamientos(),
        columnas: [
            { clave: 'Valor', etiqueta: 'Valor', valor: valorEncantamiento },
            { clave: 'Aplica', etiqueta: 'Se aplica a', valor: (item: EncantamientoDetalle) => textoAplicaA(item.Aplica_a) },
        ],
    },
    conjunto: {
        singular: 'conjunto', plural: 'conjuntos',
        cargar: (svc) => svc.getConjuntos(),
        columnas: [
            { clave: 'Piezas', etiqueta: 'Piezas', valor: (item: ConjuntoObjetosDetalle) => `${item.Piezas.length}` },
        ],
    },
};

/**
 * El listado de un catálogo pequeño del equipo (materiales, munición, aptitudes especiales de armas y armaduras,
 * conjuntos de objetos): búsqueda por texto, manual y homebrew, como los demás listados de consulta.
 */
@Component({
    selector: 'app-listado-equipo',
    templateUrl: './listado-equipo.component.html',
    styleUrls: ['./listado-equipo.component.sass'],
    standalone: false
})
export class ListadoEquipoComponent implements AfterViewInit, OnDestroy {
    @Input() tipo: TipoListadoEquipo = 'material';
    @Output() entradaDetalles = new EventEmitter<EntradaEquipo>();
    @Output() entradaSeleccionada = new EventEmitter<EntradaEquipo>();

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild('textoInc', { read: ElementRef }) textoInc!: ElementRef;

    items: ItemListadoEquipo[] = [];
    cargado = false;
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    dataSource = new MatTableDataSource<ItemListadoEquipo>([]);
    mostrarHomebrew = false;

    private suscripcion: Subscription | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private equipoSvc: EquipoService,
        private manualDetalleNavSvc: ManualDetalleNavigationService,
    ) { }

    get configuracion(): ConfiguracionListado {
        return CONFIGURACION[this.tipo] ?? CONFIGURACION.material;
    }

    get columnas(): string[] {
        return ['Nombre', 'Manual', ...this.configuracion.columnas.map((columna) => columna.clave)];
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew
            ? `Mostrando ${this.configuracion.plural} homebrew`
            : `Clic para mostrar ${this.configuracion.plural} homebrew`;
    }

    ngAfterViewInit(): void {
        ordenarEnEspanol(this.dataSource);
        this.suscripcion = this.configuracion.cargar(this.equipoSvc).subscribe({
            next: (items) => {
                this.items = [...items];
                this.manuales = Array.from(new Set(this.items
                    .map((item) => `${item.Manual?.Nombre ?? ''}`.trim())
                    .filter((nombre) => nombre.length > 0))).sort(compararTexto);
                this.cargado = true;
                this.filtrar();
                this.cdr.detectChanges();
            },
            error: () => {
                this.cargado = true;
                this.cdr.detectChanges();
            },
        });
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }

    alternarHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.filtrar();
    }

    filtrar(): void {
        const texto = normalizarTexto(this.textoInc?.nativeElement?.value ?? '', true);
        const manual = normalizarTexto(this.defaultManual);
        const filtrados = this.items.filter((item) =>
            (texto.length < 1
                || normalizarTexto(item.Nombre, true).includes(texto)
                || normalizarTexto(item.Nombre_original, true).includes(texto)
                || normalizarTexto(item.Descripcion, true).includes(texto))
            && (this.defaultManual === 'Cualquiera' || normalizarTexto(item.Manual?.Nombre) === manual)
            && (this.mostrarHomebrew || item.Oficial));
        this.dataSource.data = filtrados;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item, propiedad) => this.valorOrden(item, propiedad);
    }

    etiquetaColumna(clave: string): string {
        if (clave === 'Nombre' || clave === 'Manual')
            return clave;
        return this.configuracion.columnas.find((columna) => columna.clave === clave)?.etiqueta ?? clave;
    }

    valorColumna(item: ItemListadoEquipo, clave: string): string {
        return this.configuracion.columnas.find((columna) => columna.clave === clave)?.valor(item) ?? '';
    }

    manualVisible(item: ItemListadoEquipo): string {
        return etiquetaManual(item.Manual);
    }

    abrirDetalleManual(item: ItemListadoEquipo, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({ id: item.Manual?.Id, nombre: item.Manual?.Nombre });
    }

    verDetalles(item: ItemListadoEquipo): void {
        this.entradaDetalles.emit(this.entrada(item));
    }

    seleccionar(item: ItemListadoEquipo): void {
        this.entradaSeleccionada.emit(this.entrada(item));
    }

    private entrada(item: ItemListadoEquipo): EntradaEquipo {
        return { tipo: this.tipo, item } as EntradaEquipo;
    }

    private valorOrden(item: ItemListadoEquipo, propiedad: string): string {
        if (propiedad === 'Nombre')
            return item.Nombre;
        if (propiedad === 'Manual')
            return `${item.Manual?.Nombre ?? ''}`;
        return this.valorColumna(item, propiedad);
    }
}
