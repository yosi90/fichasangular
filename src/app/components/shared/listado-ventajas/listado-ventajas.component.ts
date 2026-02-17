import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { VentajaService } from 'src/app/services/ventaja.service';

interface VentajaListadoItem extends VentajaDetalle {
    Tipo: 'Ventaja' | 'Desventaja';
}

@Component({
    selector: 'app-listado-ventajas',
    templateUrl: './listado-ventajas.component.html',
    styleUrls: ['./listado-ventajas.component.sass']
})
export class ListadoVentajasComponent implements OnDestroy {
    ventajas: VentajaListadoItem[] = [];
    manuales: string[] = [];
    defaultManual = 'Cualquiera';
    ventajasDS = new MatTableDataSource<VentajaListadoItem>([]);
    ventajaColumns = ['Nombre', 'Tipo', 'Coste', 'Manual'];

    private readonly destroy$ = new Subject<void>();

    constructor(
        private cdr: ChangeDetectorRef,
        private ventajaSvc: VentajaService,
        private manualDetalleNavSvc: ManualDetalleNavigationService
    ) { }

    @ViewChild(MatSort) ventajaSort!: MatSort;
    @ViewChild(MatPaginator) ventajaPaginator!: MatPaginator;
    @ViewChild('ventajaTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.ventajasDS.paginator = this.ventajaPaginator;
        this.ventajasDS.sort = this.ventajaSort;

        combineLatest([
            this.ventajaSvc.getVentajas(),
            this.ventajaSvc.getDesventajas(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([ventajas, desventajas]) => {
                const listadoVentajas = ventajas.map((v) => ({ ...v, Tipo: 'Ventaja' as const }));
                const listadoDesventajas = desventajas.map((d) => ({ ...d, Tipo: 'Desventaja' as const }));

                this.ventajas = [...listadoVentajas, ...listadoDesventajas]
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));

                this.manuales = Array.from(new Set(
                    this.ventajas
                        .map((v) => `${v.Manual?.Nombre ?? ''}`.trim())
                        .filter((nombre) => nombre.length > 0)
                )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

                this.filtroVentajas();
                this.cdr.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    filtroVentajas() {
        const texto = this.normalizar(this.nombreText?.nativeElement.value ?? '');
        const filtradas = this.ventajas.filter((ventaja) => {
            const nombre = this.normalizar(ventaja.Nombre);
            const manual = `${ventaja.Manual?.Nombre ?? ''}`.trim();
            const visiblePorManual = this.defaultManual === 'Cualquiera' || manual === this.defaultManual;
            const visiblePorTexto = texto.length < 1 || nombre.includes(texto);
            return visiblePorManual && visiblePorTexto;
        });

        this.ventajasDS = new MatTableDataSource<VentajaListadoItem>(filtradas);
        setTimeout(() => {
            this.ventajasDS.sort = this.ventajaSort;
            this.ventajaSort.active = 'Nombre';
            this.ventajaSort.direction = 'asc';
        }, 50);
        this.ventajasDS.paginator = this.ventajaPaginator;
    }

    abrirInfoVentajasHomebrew(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        Swal.fire({
            target: document.body,
            icon: 'info',
            title: 'Ventajas y desventajas (homebrew)',
            width: 560,
            html: `
                <p style="text-align:left; margin-bottom:10px;">
                    El sistema de ventajas y desventajas es un añadido homebrew para enriquecer la experiencia de juego
                    y, sobre todo, el roleo de los personajes.
                </p>
                <p style="text-align:left; margin-bottom:10px;">
                    La idea no es conseguir personajes más poderosos, sino darle sabor al roleo. Si solo te importan
                    los combates, te recomendamos no usar esta funcionalidad.
                </p>
                <p style="text-align:left; margin-bottom:4px;"><strong>Sistema de ventajas:</strong></p>
                <ul style="text-align:left; padding-left:18px; margin:0;">
                    <li>Cada personaje puede tener un máximo de tres ventajas.</li>
                    <li>Cada ventaja cuesta puntos de ventaja.</li>
                    <li>Obtienes esos puntos eligiendo desventajas para tu personaje.</li>
                </ul>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    @Output() ventajaDetalles: EventEmitter<VentajaDetalle> = new EventEmitter<VentajaDetalle>();
    verDetallesVentaja(item: VentajaListadoItem) {
        this.ventajaDetalles.emit(item);
    }

    @Output() ventajaSeleccionada: EventEmitter<VentajaDetalle> = new EventEmitter<VentajaDetalle>();
    seleccionarVentaja(item: VentajaListadoItem) {
        this.ventajaSeleccionada.emit(item);
    }

    getManualVisible(item: VentajaListadoItem): string {
        const nombre = `${item.Manual?.Nombre ?? ''}`.trim();
        const pagina = Number(item.Manual?.Pagina ?? 0);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    abrirDetalleManual(item: VentajaListadoItem, event?: Event) {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: item?.Manual?.Id,
            nombre: item?.Manual?.Nombre,
        });
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
