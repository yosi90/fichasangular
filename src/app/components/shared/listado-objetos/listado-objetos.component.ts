import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription, catchError, defer, of, switchMap, takeUntil, tap, timer } from 'rxjs';
import { CategoriaObjeto, EntradaEquipo, EquipoRanura, EquipoTipoObjeto, FiltrosObjetos, ObjetoDetalle, PaginaObjetos } from 'src/app/interfaces/equipo';
import { Manual } from 'src/app/interfaces/manual';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ManualService } from 'src/app/services/manual.service';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';
import { mensajeDeError } from 'src/app/services/utils/error-api';

const CATEGORIAS: { valor: CategoriaObjeto | null; etiqueta: string; }[] = [
    { valor: null, etiqueta: 'Cualquiera' },
    { valor: 'mundano', etiqueta: 'Mundano' },
    { valor: 'magico', etiqueta: 'Mágico' },
    { valor: 'psionico', etiqueta: 'Psiónico' },
];

const SIN_MANUAL = 'Cualquiera';

/**
 * El listado de objetos: un catálogo grande, así que la búsqueda y la paginación van en el servidor (`GET /objetos`, con
 * `q`, `tipo`, `categoria`, `ranura` y `manual`).
 */
@Component({
    selector: 'app-listado-objetos',
    templateUrl: './listado-objetos.component.html',
    styleUrls: ['./listado-objetos.component.sass'],
    standalone: false
})
export class ListadoObjetosComponent implements OnInit, OnDestroy {
    @Output() entradaDetalles = new EventEmitter<EntradaEquipo>();
    @Output() entradaSeleccionada = new EventEmitter<EntradaEquipo>();

    readonly columnas = ['Nombre', 'Manual', 'Tipo', 'Ranura', 'Precio'];
    readonly categorias = CATEGORIAS;
    readonly opcionesPorPagina = [10, 25, 50, 100];

    objetos: ObjetoDetalle[] = [];
    total = 0;
    cargando = true;
    error = '';

    texto = '';
    categoria: CategoriaObjeto | null = null;
    idTipo: number | null = null;
    idRanura: number | null = null;
    manual: string | number = SIN_MANUAL;
    porPagina = 25;
    pagina = 0;

    tipos: EquipoTipoObjeto[] = [];
    ranuras: EquipoRanura[] = [];
    manuales: Manual[] = [];

    private readonly peticiones$ = new Subject<{ filtros: FiltrosObjetos; espera: number; }>();
    private readonly destroy$ = new Subject<void>();
    private suscripciones: Subscription[] = [];

    constructor(
        private cdr: ChangeDetectorRef,
        private equipoSvc: EquipoService,
        private manualSvc: ManualService,
        private manualDetalleNavSvc: ManualDetalleNavigationService,
    ) { }

    ngOnInit(): void {
        this.peticiones$.pipe(
            tap(() => {
                this.cargando = true;
                this.error = '';
            }),
            switchMap(({ filtros, espera }) => {
                const pedir = defer(() => this.equipoSvc.getObjetos(filtros)).pipe(
                    catchError((error) => {
                        this.error = mensajeDeError(error, 'No se pudieron cargar los objetos.');
                        return of<PaginaObjetos>({ items: [], total: 0, hayMas: false });
                    }),
                );
                return espera > 0 ? timer(espera).pipe(switchMap(() => pedir)) : pedir;
            }),
            takeUntil(this.destroy$),
        ).subscribe((pagina) => {
            this.objetos = pagina.items;
            this.total = pagina.total;
            this.cargando = false;
            this.cdr.detectChanges();
        });
        this.suscripciones.push(
            this.equipoSvc.getCatalogos().subscribe({
                next: (catalogos) => {
                    this.tipos = catalogos.Tipos_objeto;
                    this.ranuras = catalogos.Ranuras;
                },
                error: () => undefined,
            }),
            this.manualSvc.getManuales().subscribe({
                next: (manuales) => this.manuales = manuales,
                error: () => undefined,
            }),
        );
        this.buscar(0);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.suscripciones.forEach((s) => s.unsubscribe());
    }

    /** Los tipos de objeto de la categoría elegida (o todos). */
    get tiposVisibles(): EquipoTipoObjeto[] {
        return this.categoria ? this.tipos.filter((tipo) => tipo.Categoria === this.categoria) : this.tipos;
    }

    /** Al escribir, espera un poco antes de pedir; los desplegables piden al momento. Vuelve a la primera página. */
    alCambiarTexto(texto: string): void {
        this.texto = texto;
        this.pagina = 0;
        this.buscar(300);
    }

    alCambiarFiltro(): void {
        if (this.idTipo !== null && !this.tiposVisibles.some((tipo) => tipo.Id === this.idTipo))
            this.idTipo = null;
        this.pagina = 0;
        this.buscar(0);
    }

    alCambiarPagina(evento: PageEvent): void {
        this.pagina = evento.pageIndex;
        this.porPagina = evento.pageSize;
        this.buscar(0);
    }

    filtros(): FiltrosObjetos {
        const manual = Number(this.manual);
        return {
            q: this.texto.trim() || null,
            categoria: this.categoria,
            tipo: this.idTipo,
            ranura: this.idRanura,
            manual: this.manual !== SIN_MANUAL && Number.isFinite(manual) && manual > 0 ? manual : null,
            limit: this.porPagina,
            offset: this.pagina * this.porPagina,
        };
    }

    manualVisible(objeto: ObjetoDetalle): string {
        return etiquetaManual(objeto.Manual);
    }

    precioVisible(objeto: ObjetoDetalle): string {
        if (objeto.Generico_conjuro)
            return `${textoPrecio(objeto.Generico_conjuro.Precio_por_nivel)} × nivel × NL`;
        return textoPrecio(objeto.Precio);
    }

    abrirDetalleManual(objeto: ObjetoDetalle, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({ id: objeto.Manual?.Id, nombre: objeto.Manual?.Nombre });
    }

    verDetalles(objeto: ObjetoDetalle): void {
        this.entradaDetalles.emit({ tipo: 'objeto', item: objeto });
    }

    seleccionar(objeto: ObjetoDetalle): void {
        this.entradaSeleccionada.emit({ tipo: 'objeto', item: objeto });
    }

    private buscar(espera: number): void {
        this.peticiones$.next({ filtros: this.filtros(), espera });
    }
}
