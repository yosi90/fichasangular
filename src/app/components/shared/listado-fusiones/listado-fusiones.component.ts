import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { chakrasConVinculo, chakrasDondeSeMoldea, nombreOriginalVisible, textoManualListado, unirLista } from 'src/app/components/detalles/ficha';
import { Chakra, Fusion } from 'src/app/interfaces/incarnum';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { ListadoBuscable } from '../listado-cabecera/listado-cabecera.component';

/** Una fila del catálogo de fusiones, con lo que enseña cada columna. */
export interface FilaFusion {
    fusion: Fusion;
    Nombre: string;
    Original: string;
    Clases: string;
    Se_moldea: string;
    Vinculos: string;
    Descriptores: string;
    Manual: string;
}

const CUALQUIERA = 'Cualquiera';

/** La fila del catálogo de una fusión: «Corona o Pies» donde se moldea y los chakras con vínculo, en su orden. */
export function filaFusion(fusion: Fusion, ordenChakras: Map<number, number> = new Map()): FilaFusion {
    const orden = (a: { Id: number }, b: { Id: number }) => (ordenChakras.get(a.Id) ?? 99) - (ordenChakras.get(b.Id) ?? 99);
    return {
        fusion,
        Nombre: fusion.Nombre,
        Original: nombreOriginalVisible(fusion),
        Clases: fusion.Clases.map((clase) => clase.Nombre).join(', '),
        Se_moldea: unirLista([...chakrasDondeSeMoldea(fusion)].sort(orden).map((chakra) => chakra.Nombre), 'o'),
        Vinculos: [...chakrasConVinculo(fusion)].sort(orden).map((chakra) => chakra.Nombre).join(', '),
        Descriptores: fusion.Descriptores.map((descriptor) => descriptor.Nombre).join(', '),
        Manual: textoManualListado(fusion.Manual),
    };
}

/**
 * El catálogo de las fusiones del alma (Magic of Incarnum; lienzo aprobado el 2026-10-27): nombre en español con el
 * original del libro, clases, chakras donde se moldea, vínculos, descriptores y manual. Se busca en español o en
 * inglés y se filtra por clase, chakra, descriptor, manual y homebrew.
 */
@Component({
    selector: 'app-listado-fusiones',
    templateUrl: './listado-fusiones.component.html',
    styleUrls: ['./listado-fusiones.component.sass'],
    standalone: false
})
export class ListadoFusionesComponent implements OnDestroy, ListadoBuscable {
    fusiones: Fusion[] = [];
    filas: FilaFusion[] = [];
    clases: string[] = [CUALQUIERA];
    chakras: string[] = [CUALQUIERA];
    descriptores: string[] = [CUALQUIERA];
    manuales: string[] = [];
    defaultClase = CUALQUIERA;
    defaultChakra = CUALQUIERA;
    defaultDescriptor = CUALQUIERA;
    defaultManual = CUALQUIERA;
    fusionesDS = new MatTableDataSource<FilaFusion>([]);
    readonly fusionColumns = ['Nombre', 'Clases', 'Se_moldea', 'Vinculos', 'Descriptores', 'Manual'];
    /** El buscador rápido de la cabecera, en español o en inglés. */
    textoBusqueda = '';
    cargado = false;
    errorCarga = false;

    private mostrarHomebrew = false;
    private catalogoSub?: Subscription;

    constructor(
        private cdr: ChangeDetectorRef,
        private incarnumSvc: IncarnumService,
        private manualDetalleNavSvc: ManualDetalleNavigationService,
    ) { }

    @ViewChild(MatSort) fusionSort!: MatSort;
    @ViewChild(MatPaginator) fusionPaginator!: MatPaginator;

    ngAfterViewInit(): void {
        this.cargar();
    }

    ngOnDestroy(): void {
        this.catalogoSub?.unsubscribe();
    }

    /** Lee las fusiones y los chakras (otra vez, con «Reintentar»). */
    cargar(): void {
        this.cargado = false;
        this.errorCarga = false;
        this.catalogoSub?.unsubscribe();
        this.catalogoSub = combineLatest([this.incarnumSvc.getFusiones(), this.incarnumSvc.getChakras()]).subscribe({
            next: ([fusiones, chakras]) => {
                this.montar(fusiones ?? [], chakras ?? []);
                this.cargado = true;
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
        this.filtroFusiones();
    }

    private montar(fusiones: Fusion[], chakras: Chakra[]): void {
        const ordenChakras = new Map(chakras.map((chakra) => [chakra.Id, chakra.Orden]));
        this.fusiones = fusiones;
        this.filas = fusiones.map((fusion) => filaFusion(fusion, ordenChakras));
        const unicos = (valores: string[]) => Array.from(new Set(valores.filter((v) => `${v ?? ''}`.trim().length > 0)));
        this.clases = [CUALQUIERA, ...unicos(fusiones.flatMap((f) => f.Clases.map((c) => c.Nombre))).sort(compararTexto)];
        const enFusiones = new Set(fusiones.flatMap((f) => f.Chakras.map((c) => c.Id)));
        this.chakras = [CUALQUIERA, ...chakras.filter((chakra) => enFusiones.has(chakra.Id)).map((chakra) => chakra.Nombre)];
        this.descriptores = [CUALQUIERA, ...unicos(fusiones.flatMap((f) => f.Descriptores.map((d) => d.Nombre))).sort(compararTexto)];
        this.manuales = unicos(fusiones.map((f) => f.Manual?.Nombre ?? '')).sort(compararTexto);
        this.filtroFusiones();
    }

    get anuncioHomebrew(): string {
        return this.mostrarHomebrew ? 'Mostrando fusiones homebrew' : 'Clic para mostrar fusiones homebrew';
    }

    get homebrewActivo(): boolean {
        return this.mostrarHomebrew;
    }

    alternarHomebrew(): void {
        this.mostrarHomebrew = !this.mostrarHomebrew;
        this.filtroFusiones();
    }

    /** Si algún filtro no está como al abrir el listado. */
    get hayFiltros(): boolean {
        return this.textoBusqueda.trim() !== '' || this.defaultClase !== CUALQUIERA || this.defaultChakra !== CUALQUIERA
            || this.defaultDescriptor !== CUALQUIERA || this.defaultManual !== CUALQUIERA || this.mostrarHomebrew;
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.defaultClase = CUALQUIERA;
        this.defaultChakra = CUALQUIERA;
        this.defaultDescriptor = CUALQUIERA;
        this.defaultManual = CUALQUIERA;
        this.mostrarHomebrew = false;
        this.filtroFusiones();
    }

    filtroFusiones(): void {
        const texto = normalizarTexto(this.textoBusqueda, true);
        const clase = normalizarTexto(this.defaultClase);
        const chakra = normalizarTexto(this.defaultChakra);
        const descriptor = normalizarTexto(this.defaultDescriptor);
        const filtradas = this.filas.filter(({ fusion }) => {
            const porTexto = texto.length < 1
                || normalizarTexto(fusion.Nombre, true).includes(texto)
                || normalizarTexto(fusion.Nombre_original, true).includes(texto);
            const porClase = this.defaultClase === CUALQUIERA || fusion.Clases.some((c) => normalizarTexto(c.Nombre) === clase);
            const porChakra = this.defaultChakra === CUALQUIERA || fusion.Chakras.some((c) => normalizarTexto(c.Nombre) === chakra);
            const porDescriptor = this.defaultDescriptor === CUALQUIERA
                || fusion.Descriptores.some((d) => normalizarTexto(d.Nombre) === descriptor);
            const porManual = this.defaultManual === CUALQUIERA
                || normalizarTexto(fusion.Manual?.Nombre) === normalizarTexto(this.defaultManual);
            const porHomebrew = this.mostrarHomebrew || toBoolean(fusion.Oficial, true);
            return porTexto && porClase && porChakra && porDescriptor && porManual && porHomebrew;
        });
        this.fusionesDS = new MatTableDataSource<FilaFusion>(filtradas);
        this.fusionesDS.paginator = this.fusionPaginator;
        this.fusionesDS.sortingDataAccessor = (fila, propiedad) => `${(fila as any)?.[propiedad] ?? ''}`;
        setTimeout(() => {
            this.fusionesDS.sort = this.fusionSort;
            ordenarEnEspanol(this.fusionesDS);
        }, 50);
    }

    @Output() fusionDetalles = new EventEmitter<Fusion>();
    verDetallesFusion(fila: FilaFusion): void {
        this.fusionDetalles.emit(fila.fusion);
    }

    @Output() fusionSeleccionada = new EventEmitter<Fusion>();
    seleccionarFusion(fila: FilaFusion): void {
        this.fusionSeleccionada.emit(fila.fusion);
    }

    abrirDetalleManual(fila: FilaFusion, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.manualDetalleNavSvc.abrirDetalleManual({ id: fila.fusion.Manual?.Id, nombre: fila.fusion.Manual?.Nombre });
    }
}
