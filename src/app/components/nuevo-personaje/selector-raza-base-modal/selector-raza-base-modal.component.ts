import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Raza } from 'src/app/interfaces/raza';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { EstadoElegibilidadRazaBase } from 'src/app/services/utils/raza-mutacion';

interface CandidataRazaBaseView {
    raza: Raza;
    estado: EstadoElegibilidadRazaBase;
    advertencias: string[];
}

@Component({
    selector: 'app-selector-raza-base-modal',
    templateUrl: './selector-raza-base-modal.component.html',
    styleUrls: ['./selector-raza-base-modal.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorRazaBaseModalComponent implements OnChanges {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input() candidatas: CandidataRazaBaseView[] = [];
    @Input() incluirHomebrew = false;
    @Input() titulo = 'Seleccionar raza base';

    @Output() cerrar = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<Raza>();
    @Output() incluirHomebrewChange = new EventEmitter<boolean>();
    @Output() info = new EventEmitter<void>();

    razaSeleccionadaId: number | null = null;
    filtroTexto = '';
    candidatasVisibles: CandidataRazaBaseView[] = [];
    seleccionActual: CandidataRazaBaseView | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['candidatas'] || changes['incluirHomebrew']) {
            this.reconstruirListado();
        }
    }

    onFiltroChange(value: string): void {
        this.filtroTexto = value ?? '';
        this.reconstruirListado();
    }

    onToggleHomebrew(): void {
        const siguiente = !this.incluirHomebrew;
        this.incluirHomebrew = siguiente;
        this.razaSeleccionadaId = null;
        this.seleccionActual = null;
        this.reconstruirListado();
        this.incluirHomebrewChange.emit(siguiente);
    }

    onInfo(): void {
        this.info.emit();
    }

    onCerrar(): void {
        this.cerrar.emit();
    }

    onSeleccionar(item: CandidataRazaBaseView): void {
        this.razaSeleccionadaId = Number(item.raza.Id);
        this.seleccionActual = item;
    }

    onSeleccionarTeclado(item: CandidataRazaBaseView, event: Event): void {
        event.preventDefault();
        this.onSeleccionar(item);
    }

    abrirDetalleManual(item: CandidataRazaBaseView, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual(item?.raza?.Manual);
    }

    esSeleccionada(item: CandidataRazaBaseView): boolean {
        return Number(item.raza.Id) === Number(this.razaSeleccionadaId);
    }

    getAjusteNivel(raza: Raza): number {
        const value = Number((raza as any)?.Ajuste_nivel);
        if (!Number.isFinite(value))
            return 0;
        return Math.trunc(value);
    }

    getDgsExtra(raza: Raza): number {
        const value = Number((raza as any)?.Dgs_adicionales?.Cantidad);
        if (!Number.isFinite(value))
            return 0;
        return Math.trunc(value);
    }

    onConfirmar(): void {
        if (!this.seleccionActual)
            return;
        this.confirmar.emit(this.seleccionActual.raza);
    }

    trackByRazaId(index: number, item: CandidataRazaBaseView): number {
        return Number(item.raza.Id) || index;
    }

    private reconstruirListado(): void {
        const filtro = `${this.filtroTexto ?? ''}`.trim().toLowerCase();
        this.candidatasVisibles = this.candidatas
            .filter((item) => this.incluirHomebrew || item.raza.Oficial)
            .filter((item) => {
                if (filtro.length < 1)
                    return true;
                const nombre = `${item.raza.Nombre ?? ''}`.toLowerCase();
                const manual = `${item.raza.Manual ?? ''}`.toLowerCase();
                return nombre.includes(filtro) || manual.includes(filtro);
            })
            .sort((a, b) => a.raza.Nombre.localeCompare(b.raza.Nombre, 'es', { sensitivity: 'base' }));

        if (this.razaSeleccionadaId === null) {
            this.seleccionActual = null;
            return;
        }

        const seleccion = this.candidatasVisibles.find((item) => Number(item.raza.Id) === Number(this.razaSeleccionadaId)) ?? null;
        this.seleccionActual = seleccion;
        if (!seleccion)
            this.razaSeleccionadaId = null;
    }
}
