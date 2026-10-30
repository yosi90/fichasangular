import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription, catchError, defer, of, switchMap, takeUntil, tap, timer } from 'rxjs';
import { CategoriaObjeto, EntradaEquipo, EquipoRanura, EquipoTipoObjeto, FiltrosObjetos, ObjetoDetalle, PaginaObjetos } from 'src/app/interfaces/equipo';
import { Manual } from 'src/app/interfaces/manual';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ManualService } from 'src/app/services/manual.service';
import { textoPrecio, textoPrecioGenerico } from 'src/app/services/utils/equipo-texto';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import { TAMANO_PAGINA_POR_DEFECTO } from 'src/app/services/utils/paginador-es';
import { nombreOriginalVisible } from 'src/app/components/detalles/ficha/ficha';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

const CATEGORIAS: { valor: CategoriaObjeto | null; etiqueta: string; }[] = [
    { valor: null, etiqueta: 'Cualquiera' },
    { valor: 'mundano', etiqueta: 'Mundano' },
    { valor: 'magico', etiqueta: 'Mágico' },
    { valor: 'psionico', etiqueta: 'Psiónico' },
];

const SIN_MANUAL = 'Cualquiera';

/**
 * El listado de objetos: un catálogo grande, así que la búsqueda y la paginación van en el servidor (`GET /objetos`, con
 * `q`, `tipo`, `categoria`, `ranura` y `manual`). El buscador rápido de la cabecera es su `q`; los tamaños de página, los
 * comunes (`PROVEEDORES_PAGINADOR`), que la API admite.
 */
@Component({
    selector: 'app-listado-objetos',
    templateUrl: './listado-objetos.component.html',
    styleUrls: ['./listado-objetos.component.sass'],
    standalone: false
})
export class ListadoObjetosComponent implements OnInit, OnDestroy, ListadoBuscable {
    @Output() entradaDetalles = new EventEmitter<EntradaEquipo>();
    @Output() entradaSeleccionada = new EventEmitter<EntradaEquipo>();

    readonly columnas = ['Nombre', 'Manual', 'Tipo', 'Ranura', 'Precio'];
    readonly categorias = CATEGORIAS;

    objetos: ObjetoDetalle[] = [];
    total = 0;
    cargando = true;
    /** Ya llegó alguna respuesta de la API: hasta entonces, el esqueleto; después, la tabla aunque se pida otra página. */
    cargado = false;
    error = '';

    /** El buscador rápido de la cabecera: el `q` de la API. */
    textoBusqueda = '';
    categoria: CategoriaObjeto | null = null;
    idTipo: number | null = null;
    idRanura: number | null = null;
    manual: string | number = SIN_MANUAL;
    porPagina = TAMANO_PAGINA_POR_DEFECTO;
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
            this.cargado = true;
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
        this.pedir(0);
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
    buscar(texto: string): void {
        this.textoBusqueda = texto ?? '';
        this.pagina = 0;
        this.pedir(300);
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.categoria !== null || this.idTipo !== null || this.idRanura !== null
            || this.manual !== SIN_MANUAL;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.categoria = null;
        this.idTipo = null;
        this.idRanura = null;
        this.manual = SIN_MANUAL;
        this.pagina = 0;
        this.pedir(0);
    }

    /** «Reintentar»: la misma página otra vez. */
    reintentar(): void {
        this.pedir(0);
    }

    alCambiarFiltro(): void {
        if (this.idTipo !== null && !this.tiposVisibles.some((tipo) => tipo.Id === this.idTipo))
            this.idTipo = null;
        this.pagina = 0;
        this.pedir(0);
    }

    alCambiarPagina(evento: PageEvent): void {
        this.pagina = evento.pageIndex;
        this.porPagina = evento.pageSize;
        this.pedir(0);
    }

    filtros(): FiltrosObjetos {
        const manual = Number(this.manual);
        return {
            q: this.textoBusqueda.trim() || null,
            categoria: this.categoria,
            tipo: this.idTipo,
            ranura: this.idRanura,
            manual: this.manual !== SIN_MANUAL && Number.isFinite(manual) && manual > 0 ? manual : null,
            limit: this.porPagina,
            offset: this.pagina * this.porPagina,
        };
    }

    nombreOriginal(objeto: ObjetoDetalle): string {
        return nombreOriginalVisible(objeto);
    }

    precioVisible(objeto: ObjetoDetalle): string {
        if (objeto.Generico_conjuro)
            return textoPrecioGenerico(objeto.Generico_conjuro);
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

    private pedir(espera: number): void {
        this.peticiones$.next({ filtros: this.filtros(), espera });
    }
}
