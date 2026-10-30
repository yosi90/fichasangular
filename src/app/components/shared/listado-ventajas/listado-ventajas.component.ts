import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Subject, Subscription, takeUntil } from 'rxjs';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { VentajaService } from 'src/app/services/ventaja.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { porNombre, textosDistintos } from 'src/app/services/utils/orden-texto';
import { TipoRol, tipoRolDeVentaja } from 'src/app/services/utils/iconos-rol';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

interface VentajaListadoItem extends VentajaDetalle {
    Tipo: 'Ventaja' | 'Desventaja';
}

@Component({
    selector: 'app-listado-ventajas',
    templateUrl: './listado-ventajas.component.html',
    styleUrls: ['./listado-ventajas.component.sass'],
    standalone: false
})
export class ListadoVentajasComponent implements OnDestroy, ListadoBuscable {
    ventajas: VentajaListadoItem[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    ventajasDS = new MatTableDataSource<VentajaListadoItem>([]);
    ventajaColumns = ['Nombre', 'Tipo', 'Coste', 'Manual'];
    /** El buscador rápido de la cabecera. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;
    private catalogoSub?: Subscription;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private ventajaSvc: VentajaService
    ) { }

    @ViewChild(MatSort) ventajaSort!: MatSort;
    @ViewChild(MatPaginator) ventajaPaginator!: MatPaginator;

    ngAfterViewInit() {
        this.ventajasDS.paginator = this.ventajaPaginator;
        this.ventajasDS.sort = this.ventajaSort;
        ordenarEnEspanol(this.ventajasDS);
        this.cargar();
    }

    /** Lee las ventajas y las desventajas (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = combineLatest([
            this.ventajaSvc.getVentajas(),
            this.ventajaSvc.getDesventajas(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([ventajas, desventajas]) => {
                    const listadoVentajas = (ventajas ?? []).map((v) => ({ ...v, Tipo: 'Ventaja' as const }));
                    const listadoDesventajas = (desventajas ?? []).map((d) => ({ ...d, Tipo: 'Desventaja' as const }));

                    this.ventajas = [...listadoVentajas, ...listadoDesventajas]
                        .sort(porNombre);

                    this.manuales = textosDistintos(this.ventajas, (v) => v.Manual?.Nombre);

                    this.cargado = true;
                    this.filtroVentajas();
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
        this.filtroVentajas();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultManual !== 'Cualquiera';
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultManual = 'Cualquiera';
        this.filtroVentajas();
    }

    /** Ventaja o desventaja, según el dato (`Coste`). */
    tipoDe(item: VentajaListadoItem): TipoRol {
        return tipoRolDeVentaja(item);
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroVentajas() {
        const texto = normalizarTexto(this.textoBusqueda);
        const filtradas = this.ventajas.filter((ventaja) => {
            const nombre = normalizarTexto(ventaja.Nombre);
            const manual = `${ventaja.Manual?.Nombre ?? ''}`.trim();
            const visiblePorManual = this.defaultManual === 'Cualquiera' || manual === this.defaultManual;
            const visiblePorTexto = texto.length < 1 || nombre.includes(texto);
            return visiblePorManual && visiblePorTexto;
        });

        this.ventajasDS = new MatTableDataSource<VentajaListadoItem>(filtradas);
        setTimeout(() => {
            this.ventajasDS.sort = this.ventajaSort;
            ordenarEnEspanol(this.ventajasDS);
            if (this.ventajaSort) {
                this.ventajaSort.active = 'Nombre';
                this.ventajaSort.direction = 'asc';
            }
        }, 50);
        this.ventajasDS.paginator = this.ventajaPaginator;
    }

    @Output() ventajaDetalles: EventEmitter<VentajaDetalle> = new EventEmitter<VentajaDetalle>();
    verDetallesVentaja(item: VentajaListadoItem) {
        this.ventajaDetalles.emit(item);
    }

    @Output() ventajaSeleccionada: EventEmitter<VentajaDetalle> = new EventEmitter<VentajaDetalle>();
    seleccionarVentaja(item: VentajaListadoItem) {
        this.ventajaSeleccionada.emit(item);
    }

}
