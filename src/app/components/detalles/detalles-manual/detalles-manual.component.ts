import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ICONOS_ENTIDAD, getManualCategorias, getManualReferenciasValidas, getManualTipoPorSeccion, isManualSeccionIncluida, MANUAL_SECCIONES_CONFIG, ManualCategoriaConIcono } from 'src/app/config/manual-secciones.config';
import { ManualAsociadoDetalle, ManualAsociados, ReferenciaCorta } from 'src/app/interfaces/manual-asociado';
import { ManualReferenciaTipo } from 'src/app/interfaces/manual-referencia-navegacion';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualReferenciaNavigationService } from 'src/app/services/manual-referencia-navigation.service';
import { UserService } from 'src/app/services/user.service';

type SeccionManualKey = keyof ManualAsociados;
type SeccionManual = { key: SeccionManualKey, label: string, icono: string };
type BloqueManualObjeto = { seccion: SeccionManual, referencia: ReferenciaCorta };

@Component({
    selector: 'app-detalles-manual',
    templateUrl: './detalles-manual.component.html',
    styleUrls: ['./detalles-manual.component.sass'],
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
    bloquesRender: BloqueManualObjeto[] = [];
    seccionesActivas: Partial<Record<SeccionManualKey, boolean>> = {};

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

    getCategorias(manual: ManualAsociadoDetalle): ManualCategoriaConIcono[] {
        return getManualCategorias(manual);
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

    get bloquesFiltrados(): BloqueManualObjeto[] {
        return this.bloquesRender.filter((bloque) => this.isSeccionActiva(bloque.seccion.key));
    }

    isSeccionActiva(key: SeccionManualKey): boolean {
        return this.seccionesActivas[key] !== false;
    }

    toggleSeccion(key: SeccionManualKey): void {
        this.seccionesActivas[key] = !this.isSeccionActiva(key);
    }

    getConteoTotalAsociados(manual: ManualAsociadoDetalle): number {
        return this.seccionesBase.reduce((total, seccion) => total + this.getReferenciasValidas(manual, seccion.key).length, 0);
    }

    formatearExtraKey(key: string): string {
        return key.replace(/_/g, ' ');
    }

    private formatearExtraValue(value: any): string {
        if (value === undefined || value === null)
            return '';

        if (typeof value === 'boolean')
            return value ? 'Si' : 'No';

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
        if (!this.manual) {
            this.seccionesRender = [];
            return;
        }

        const manual = this.manual;
        const conDatos = this.seccionesBase.filter((seccion) => this.seccionIncluidaEnManual(manual, seccion.key));
        this.seccionesRender = this.shuffle([...conDatos]);
        this.bloquesRender = [];
        this.seccionesActivas = {};

        this.seccionesRender.forEach((seccion) => {
            this.seccionesActivas[seccion.key] = true;
        });

        this.seccionesRender.forEach((seccion) => {
            const refs = this.shuffle([...this.getReferenciasValidas(manual, seccion.key)]);
            refs.forEach((referencia) => {
                this.bloquesRender.push({ seccion, referencia });
            });
        });

        this.bloquesRender = this.shuffle([...this.bloquesRender]);
    }

    private seccionIncluidaEnManual(manual: ManualAsociadoDetalle, key: SeccionManualKey): boolean {
        return isManualSeccionIncluida(manual, key);
    }

    private shuffle<T>(items: T[]): T[] {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const aux = items[i];
            items[i] = items[j];
            items[j] = aux;
        }
        return items;
    }

    private notificarDesajusteSiProcede(): void {
        this.manualFlagNoticeSvc.notifyAdminIfNeeded(this.manual, this.isAdmin);
    }
}
