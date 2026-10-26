import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { ICONOS_ENTIDAD, getManualCategorias, getManualReferenciasValidas, getManualTipoPorSeccion, isManualSeccionIncluida, MANUAL_SECCIONES_CONFIG } from 'src/app/config/manual-secciones.config';
import { ManualAsociadoDetalle, ManualAsociados, ReferenciaCorta } from 'src/app/interfaces/manual-asociado';
import { ManualReferenciaTipo } from 'src/app/interfaces/manual-referencia-navegacion';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualReferenciaNavigationService } from 'src/app/services/manual-referencia-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { textoVisible } from 'src/app/services/utils/texto-visible';

type SeccionManualKey = keyof ManualAsociados;
type SeccionManual = { key: SeccionManualKey, label: string, icono: string };
/** Una entrada del manual, lista para la tabla de su sección. */
type FilaManual = { referencia: ReferenciaCorta, descripcion: string, extras: string };
/** Una sección del manual (dotes, conjuros…) con sus entradas. */
type BloqueManual = { seccion: SeccionManual, filas: FilaManual[] };

/** Las descripciones de las entradas se recortan en la tabla: el texto entero está en su detalle. */
const LARGO_DESCRIPCION = 220;

@Component({
    selector: 'app-detalles-manual',
    templateUrl: './detalles-manual.component.html',
    standalone: false
})
export class DetallesManualComponent implements OnInit, OnDestroy {
    private _manual: ManualAsociadoDetalle | null = null;
    private permisosSub?: Subscription;
    private isAdmin: boolean = false;
    @Input() set manual(value: ManualAsociadoDetalle | null) {
        this._manual = value;
        this.recalcularSeccionesRender();
        this.notificarDesajusteSiProcede();
    }
    get manual(): ManualAsociadoDetalle | null {
        return this._manual;
    }

    readonly seccionesBase: SeccionManual[] = MANUAL_SECCIONES_CONFIG.map((seccion) => ({
        key: seccion.key,
        label: seccion.label,
        icono: ICONOS_ENTIDAD[seccion.tipo],
    }));
    seccionesRender: SeccionManual[] = [];
    bloquesRender: BloqueManual[] = [];
    bloquesFiltrados: BloqueManual[] = [];
    seccionesActivas: Partial<Record<SeccionManualKey, boolean>> = {};
    datos: DatoFicha[] = [];
    hayAsociados = false;

    constructor(
        private manualRefNavSvc: ManualReferenciaNavigationService,
        private userSvc: UserService,
        private manualFlagNoticeSvc: ManualFlagConsistencyNoticeService,
    ) { }

    ngOnInit(): void {
        this.permisosSub = this.userSvc.permisos$
            .subscribe((permisos) => {
                this.isAdmin = Number(permisos) === 1;
                this.notificarDesajusteSiProcede();
            });
    }

    ngOnDestroy(): void {
        this.permisosSub?.unsubscribe();
    }

    tieneAsociados(manual: ManualAsociadoDetalle): boolean {
        return this.seccionesBase.some(seccion => this.getReferenciasValidas(manual, seccion.key).length > 0);
    }

    getTooltipReferencia(key: SeccionManualKey, referencia: ReferenciaCorta): string {
        if (this.esReferenciaNavegable(key, referencia))
            return 'Abrir detalle';
        return 'Detalle no disponible';
    }

    esReferenciaNavegable(key: SeccionManualKey, referencia: ReferenciaCorta): boolean {
        const tipo = this.getTipoNavegacion(key);
        return !!tipo && Number(referencia?.Id) > 0;
    }

    abrirReferencia(key: SeccionManualKey, referencia: ReferenciaCorta, event: MouseEvent): void {
        event.stopPropagation();
        const tipo = this.getTipoNavegacion(key);
        const id = Number(referencia?.Id);

        if (!tipo || !Number.isFinite(id) || id <= 0)
            return;

        this.manualRefNavSvc.emitirApertura({
            tipo,
            id,
            nombre: referencia.Nombre,
            manualId: this.manual?.Id ?? 0,
        });
    }

    getCamposExtra(referencia: ReferenciaCorta): { key: string, value: string }[] {
        const ignoradas = new Set(['Id', 'Nombre', 'Descripcion']);
        return Object.keys(referencia)
            .filter((key) => !ignoradas.has(key))
            .map((key) => ({ key, value: this.formatearExtraValue(referencia[key]) }))
            .filter(item => item.value.trim().length > 0);
    }

    getReferenciasValidas(manual: ManualAsociadoDetalle, key: SeccionManualKey): ReferenciaCorta[] {
        return getManualReferenciasValidas(manual, key);
    }

    isSeccionActiva(key: SeccionManualKey): boolean {
        return this.seccionesActivas[key] !== false;
    }

    toggleSeccion(key: SeccionManualKey): void {
        this.seccionesActivas[key] = !this.isSeccionActiva(key);
        this.filtrarBloques();
    }

    getConteoTotalAsociados(manual: ManualAsociadoDetalle): number {
        return this.seccionesBase.reduce((total, seccion) => total + this.getReferenciasValidas(manual, seccion.key).length, 0);
    }

    /** Las entradas de una sección, para el resumen. */
    contarSeccion(key: SeccionManualKey): number {
        return this.manual ? this.getReferenciasValidas(this.manual, key).length : 0;
    }

    formatearExtraKey(key: string): string {
        return key.replace(/_/g, ' ');
    }

    private formatearExtraValue(value: any): string {
        if (value === undefined || value === null)
            return '';

        if (typeof value === 'boolean')
            return value ? 'Sí' : 'No';

        if (Array.isArray(value)) {
            if (value.length === 0)
                return '';
            if (value.every(item => typeof item !== 'object'))
                return value.map(item => `${item}`).join(', ');
            return `${value.length} elementos`;
        }

        if (typeof value === 'object')
            return JSON.stringify(value);

        return `${value}`;
    }

    private getTipoNavegacion(key: SeccionManualKey): ManualReferenciaTipo | null {
        return getManualTipoPorSeccion(key);
    }

    private recalcularSeccionesRender(): void {
        this.seccionesRender = [];
        this.bloquesRender = [];
        this.seccionesActivas = {};
        this.datos = [];
        this.hayAsociados = false;
        if (!this.manual) {
            this.filtrarBloques();
            return;
        }

        const manual = this.manual;
        // Las secciones y sus entradas, por orden alfabético (propietario, 2026-10-25; antes, al azar).
        this.seccionesRender = this.seccionesBase
            .filter((seccion) => this.seccionIncluidaEnManual(manual, seccion.key))
            .sort((a, b) => compararTexto(a.label, b.label));
        this.seccionesRender.forEach((seccion) => {
            this.seccionesActivas[seccion.key] = true;
        });
        this.bloquesRender = this.seccionesRender
            .map((seccion) => ({
                seccion,
                filas: [...this.getReferenciasValidas(manual, seccion.key)].sort(porNombre).map((referencia) => this.construirFila(referencia)),
            }))
            .filter((bloque) => bloque.filas.length > 0);
        this.hayAsociados = this.tieneAsociados(manual);

        const categorias = getManualCategorias(manual).map((categoria) => categoria.label);
        this.datos = [
            { etiqueta: 'Categorías', valor: categorias.length > 0 ? categorias.join(', ') : 'Sin categorías' },
            { etiqueta: 'Secciones', valor: this.seccionesRender.length },
            { etiqueta: 'Entradas', valor: this.getConteoTotalAsociados(manual) },
        ];
        this.filtrarBloques();
    }

    private construirFila(referencia: ReferenciaCorta): FilaManual {
        const descripcion = textoVisible(referencia?.Descripcion);
        return {
            referencia,
            descripcion: recortar(descripcion, LARGO_DESCRIPCION),
            extras: this.getCamposExtra(referencia).map((extra) => `${this.formatearExtraKey(extra.key)}: ${extra.value}`).join(' · '),
        };
    }

    private filtrarBloques(): void {
        this.bloquesFiltrados = this.bloquesRender.filter((bloque) => this.isSeccionActiva(bloque.seccion.key));
    }

    private seccionIncluidaEnManual(manual: ManualAsociadoDetalle, key: SeccionManualKey): boolean {
        return isManualSeccionIncluida(manual, key);
    }

    private notificarDesajusteSiProcede(): void {
        this.manualFlagNoticeSvc.notifyAdminIfNeeded(this.manual, this.isAdmin);
    }
}

/** El texto hasta `largo` caracteres, cortado en una palabra y con «…». */
function recortar(texto: string, largo: number): string {
    if (texto.length <= largo)
        return texto;
    const corte = texto.lastIndexOf(' ', largo);
    return `${texto.slice(0, corte > largo / 2 ? corte : largo).trimEnd()}…`;
}
