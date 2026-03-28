import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
    FloatingWindowPlacementMinimized,
    FloatingWindowPlacementRestored,
} from 'src/app/interfaces/user-settings';
import { UserSettingsService } from 'src/app/services/user-settings.service';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export type FloatingWindowVisualMode = 'window' | 'minimized' | 'maximized';
type FloatingWindowHorizontalAnchor = 'left' | 'right';
type FloatingWindowVerticalAnchor = 'top' | 'bottom';

interface WindowRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MoveInteraction {
    type: 'move';
    startPointerX: number;
    startPointerY: number;
    startRect: WindowRect;
}

interface ResizeInteraction {
    type: 'resize';
    direction: ResizeDirection;
    startPointerX: number;
    startPointerY: number;
    startRect: WindowRect;
}

type ActiveInteraction = MoveInteraction | ResizeInteraction | null;

interface WindowViewportSector {
    horizontal: FloatingWindowHorizontalAnchor;
    vertical: FloatingWindowVerticalAnchor;
}

@Component({
    selector: 'app-ventana-detalle-flotante',
    templateUrl: './ventana-detalle-flotante.component.html',
    styleUrls: ['./ventana-detalle-flotante.component.sass'],
    standalone: false
})
export class VentanaDetalleFlotanteComponent implements OnInit, OnChanges {
    @Input() minimizedVariant: 'bar' | 'bubble' = 'bar';
    @Input() minimizedBubbleImageUrl: string | null = null;
    @Input() minimizedBubbleIcon = 'forum';
    @Input() minimizedBubbleLabel = 'Restaurar ventana';
    @Input() titulo = 'Sin nombre - En creación';
    @Input() bloqueadaPorOverlay = false;
    @Input() minWidth = 560;
    @Input() minHeight = 340;
    @Input() fixedWidth: number | null = null;
    @Input() titleBarHeight = 44;
    @Input() restoredPlacementInput: FloatingWindowPlacementRestored | null = null;
    @Input() minimizedPlacementInput: FloatingWindowPlacementMinimized | null = null;
    @Input() windowMode: FloatingWindowVisualMode | null = null;
    @Input() zIndex: number | null = null;
    @Input() persistPreviewPlacements = true;
    @Input() minimizedAnchorsToViewportSides = true;
    @Input() resizable = true;
    @Output() cerrarSolicitado: EventEmitter<void> = new EventEmitter<void>();
    @Output() windowModeChange: EventEmitter<FloatingWindowVisualMode> = new EventEmitter<FloatingWindowVisualMode>();
    @Output() restoredPlacementChange: EventEmitter<FloatingWindowPlacementRestored | null> = new EventEmitter<FloatingWindowPlacementRestored | null>();
    @Output() minimizedPlacementChange: EventEmitter<FloatingWindowPlacementMinimized | null> = new EventEmitter<FloatingWindowPlacementMinimized | null>();
    @Output() focoSolicitado: EventEmitter<void> = new EventEmitter<void>();

    private readonly viewportPadding = 12;
    private readonly minMinimizedWidth = 220;
    private readonly minimizedBubbleSize = 56;
    private readonly controlButtonWidth = 34;
    private readonly actionsBlockGap = 4;

    rect: WindowRect = {
        x: 120,
        y: 84,
        width: 920,
        height: 620,
    };
    isMinimized = false;
    isMaximized = false;
    private restoreRect: WindowRect | null = null;
    private activeInteraction: ActiveInteraction = null;
    private minimizedPlacement: FloatingWindowPlacementMinimized | null = null;
    private restoredPlacement: FloatingWindowPlacementRestored | null = null;
    private moveHasDelta = false;
    private suppressMinimizedBubbleClick = false;
    private initialized = false;

    constructor(private userSettingsSvc?: UserSettingsService) { }

    ngOnInit(): void {
        this.rect = this.getInitialRect();
        this.initialized = true;
        if (this.persistPreviewPlacements)
            void this.cargarPlacementsGuardados();
        else
            this.aplicarEstadoExterno();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['titulo'] && this.isMinimized) {
            if (this.minimizedAnchorsToViewportSides)
                this.rect = this.clampRectToViewport(this.rect);
            else
                this.rect = this.clampRectPositionToViewport(this.rect, this.getMinimizedVisualWidth(), this.getMinimizedVisualHeight());
        }

        if (!this.initialized || this.persistPreviewPlacements)
            return;

        if (changes['restoredPlacementInput'] || changes['minimizedPlacementInput'] || changes['windowMode'])
            this.aplicarEstadoExterno(changes);
    }

    onContainerPointerDown(): void {
        if (this.bloqueadaPorOverlay)
            return;
        this.focoSolicitado.emit();
    }

    onTitleBarPointerDown(event: PointerEvent): void {
        this.onContainerPointerDown();
        if (event.button !== 0 || this.isMaximized || this.bloqueadaPorOverlay)
            return;

        const target = event.target as HTMLElement | null;
        if (target?.closest('.no-drag'))
            return;

        this.activeInteraction = {
            type: 'move',
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startRect: { ...this.rect },
        };
        this.moveHasDelta = false;
        event.preventDefault();
    }

    onResizePointerDown(event: PointerEvent, direction: ResizeDirection): void {
        this.onContainerPointerDown();
        if (event.button !== 0 || this.isMaximized || this.isMinimized || this.bloqueadaPorOverlay || !this.resizable)
            return;

        this.activeInteraction = {
            type: 'resize',
            direction,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startRect: { ...this.rect },
        };
        event.preventDefault();
        event.stopPropagation();
    }

    onMinimizedBubblePointerDown(event: PointerEvent): void {
        this.onContainerPointerDown();
        if (event.button !== 0 || this.isMaximized || this.bloqueadaPorOverlay || !this.isBubbleMinimized)
            return;

        this.activeInteraction = {
            type: 'move',
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startRect: { ...this.rect },
        };
        this.moveHasDelta = false;
        this.suppressMinimizedBubbleClick = false;
        event.preventDefault();
    }

    onMinimizedBubbleClick(event: MouseEvent): void {
        if (this.bloqueadaPorOverlay || !this.isBubbleMinimized)
            return;
        if (this.suppressMinimizedBubbleClick) {
            this.suppressMinimizedBubbleClick = false;
            event.preventDefault();
            return;
        }

        this.toggleMinimize();
        event.preventDefault();
    }

    toggleMinimize(): void {
        if (this.bloqueadaPorOverlay)
            return;

        this.onContainerPointerDown();
        const minimizando = !this.isMinimized;
        if (minimizando && !this.isMaximized)
            this.guardarPlacementRestaurado();
        if (minimizando && this.isMaximized) {
            this.isMaximized = false;
            if (this.restoreRect)
                this.rect = this.clampRectToViewport(this.restoreRect);
            this.restoreRect = null;
        }

        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            if (this.minimizedAnchorsToViewportSides)
                this.aplicarPlacementMinimizadoGuardado(this.getRestoredRectGuardado() ?? this.rect);
            else {
                this.clearMinimizedPlacement();
                this.rect = this.getRectMinimizadoDesdeRestaurado(this.getRestoredRectGuardado() ?? this.rect);
            }
        }
        else {
            const restoredRect = this.minimizedAnchorsToViewportSides
                ? this.getRestoredRectGuardado()
                : this.getRectRestauradoDesdeMinimizadoLibre(this.rect, this.getRestoredRectGuardado() ?? this.rect);
            if (restoredRect) {
                this.rect = restoredRect;
                if (!this.minimizedAnchorsToViewportSides)
                    this.guardarPlacementRestauradoDesdeRect(restoredRect);
            }
        }
        this.rect = this.clampRectToViewport(this.rect);
        this.suppressMinimizedBubbleClick = false;
        this.emitModeChange();
    }

    toggleMaximize(): void {
        if (this.bloqueadaPorOverlay)
            return;

        this.onContainerPointerDown();
        if (this.isMaximized) {
            this.restoreFromSnapshot();
            this.emitModeChange();
            return;
        }

        if (this.isMinimized)
            this.restoreRect = this.getRestoredRectGuardado() ?? { ...this.rect };
        else {
            this.guardarPlacementRestaurado();
            this.restoreRect = { ...this.rect };
        }
        this.isMinimized = false;
        this.isMaximized = true;
        this.emitModeChange();
    }

    solicitarCierre(): void {
        if (this.bloqueadaPorOverlay)
            return;
        this.cerrarSolicitado.emit();
    }

    get containerStyle(): Record<string, string> {
        const style: Record<string, string> = {};
        if (this.isMaximized) {
            const viewport = this.getViewport();
            const pad = this.viewportPadding;
            style['left'] = `${pad}px`;
            style['top'] = `${pad}px`;
            style['width'] = `${Math.max(this.minWidth, viewport.width - (pad * 2))}px`;
            style['height'] = `${Math.max(this.minHeight, viewport.height - (pad * 2))}px`;
        } else {
            const width = this.isMinimized ? this.getMinimizedVisualWidth() : this.getEffectiveWidth(this.rect.width);
            const height = this.isMinimized ? this.getMinimizedVisualHeight() : this.rect.height;
            style['left'] = `${this.rect.x}px`;
            style['top'] = `${this.rect.y}px`;
            style['width'] = `${width}px`;
            style['height'] = `${height}px`;
        }

        if (Number.isFinite(this.zIndex))
            style['z-index'] = `${Math.trunc(Number(this.zIndex))}`;
        return style;
    }

    get tituloVisible(): string {
        const value = `${this.titulo ?? ''}`.trim();
        return value.length > 0 ? value : 'Sin nombre - En creación';
    }

    get isBubbleMinimized(): boolean {
        return this.isMinimized && this.minimizedVariant === 'bubble';
    }

    get hasMinimizedBubbleImage(): boolean {
        return `${this.minimizedBubbleImageUrl ?? ''}`.trim().length > 0;
    }

    @HostListener('document:pointermove', ['$event'])
    onDocumentPointerMove(event: PointerEvent): void {
        if (!this.activeInteraction || this.bloqueadaPorOverlay)
            return;

        if (this.activeInteraction.type === 'move') {
            this.applyMove(event);
            return;
        }

        this.applyResize(event, this.activeInteraction.direction);
    }

    @HostListener('document:pointerup')
    onDocumentPointerUp(): void {
        const interaction = this.activeInteraction;
        if (!interaction) {
            this.moveHasDelta = false;
            return;
        }

        const geometryChanged = interaction.startRect.x !== this.rect.x
            || interaction.startRect.y !== this.rect.y
            || interaction.startRect.width !== this.rect.width
            || interaction.startRect.height !== this.rect.height;

        if (interaction.type === 'move' && this.isMinimized && this.moveHasDelta) {
            if (this.minimizedAnchorsToViewportSides)
                this.guardarPlacementMinimizado();
            else {
                const restoredRect = this.getRectRestauradoDesdeMinimizadoLibre(
                    this.rect,
                    this.getRestoredRectGuardado() ?? interaction.startRect
                );
                this.guardarPlacementRestauradoDesdeRect(restoredRect);
            }
        }
        if (!this.isMinimized && !this.isMaximized && geometryChanged)
            this.guardarPlacementRestaurado();
        this.suppressMinimizedBubbleClick = interaction.type === 'move' && this.isBubbleMinimized && this.moveHasDelta;
        this.activeInteraction = null;
        this.moveHasDelta = false;
    }

    @HostListener('window:blur')
    onWindowBlur(): void {
        this.activeInteraction = null;
        this.moveHasDelta = false;
        this.suppressMinimizedBubbleClick = false;
    }

    private aplicarEstadoExterno(changes?: SimpleChanges): void {
        this.minimizedPlacement = this.clonePlacementMinimized(this.minimizedPlacementInput);
        this.restoredPlacement = this.clonePlacementRestored(this.restoredPlacementInput);

        const mode = this.windowMode ?? 'window';
        const wasMinimized = this.isMinimized;
        this.isMinimized = mode === 'minimized';
        this.isMaximized = mode === 'maximized';

        const restoredRect = this.getRestoredRectGuardado();
        this.restoreRect = restoredRect ? { ...restoredRect } : this.restoreRect;
        if (!this.isMinimized) {
            if (restoredRect)
                this.rect = this.clampRectToViewport(restoredRect);
            return;
        }

        if (this.minimizedAnchorsToViewportSides) {
            this.aplicarPlacementMinimizadoGuardado(restoredRect ?? this.rect);
            return;
        }

        const modeChanged = !!changes?.['windowMode'];
        const minimizedPlacementChanged = !!changes?.['minimizedPlacementInput'];
        const shouldRecomputeMinimizedRect = !wasMinimized || modeChanged || minimizedPlacementChanged;
        if (!shouldRecomputeMinimizedRect)
            return;

        this.rect = this.getRectMinimizadoDesdeRestaurado(restoredRect ?? this.rect);
    }

    private restoreFromSnapshot(): void {
        this.isMaximized = false;
        if (this.restoreRect)
            this.rect = this.clampRectToViewport(this.restoreRect);
        this.restoreRect = null;
    }

    private applyMove(event: PointerEvent): void {
        if (!this.activeInteraction || this.activeInteraction.type !== 'move')
            return;

        const dx = event.clientX - this.activeInteraction.startPointerX;
        const dy = event.clientY - this.activeInteraction.startPointerY;
        const nextRect: WindowRect = {
            ...this.activeInteraction.startRect,
            x: this.activeInteraction.startRect.x + dx,
            y: this.activeInteraction.startRect.y + dy,
        };
        this.moveHasDelta = this.moveHasDelta || dx !== 0 || dy !== 0;
        this.rect = this.clampRectToViewport(nextRect);
    }

    private applyResize(event: PointerEvent, direction: ResizeDirection): void {
        if (!this.activeInteraction || this.activeInteraction.type !== 'resize')
            return;

        const dx = event.clientX - this.activeInteraction.startPointerX;
        const dy = event.clientY - this.activeInteraction.startPointerY;
        const start = this.activeInteraction.startRect;

        let nextRect: WindowRect = {
            x: start.x,
            y: start.y,
            width: start.width,
            height: start.height,
        };

        if (direction.includes('e'))
            nextRect.width = start.width + dx;
        if (direction.includes('s'))
            nextRect.height = start.height + dy;
        if (direction.includes('w')) {
            nextRect.x = start.x + dx;
            nextRect.width = start.width - dx;
        }
        if (direction.includes('n')) {
            nextRect.y = start.y + dy;
            nextRect.height = start.height - dy;
        }

        nextRect = this.ensureMinSize(nextRect, direction);
        this.rect = this.clampRectToViewport(nextRect);
    }

    private ensureMinSize(rect: WindowRect, direction: ResizeDirection): WindowRect {
        const next = { ...rect };
        const effectiveMinWidth = this.getEffectiveMinWidth();
        const effectiveFixedWidth = this.getFixedWidthValue();
        if (effectiveFixedWidth !== null) {
            if (direction.includes('w'))
                next.x = next.x - (effectiveFixedWidth - next.width);
            next.width = effectiveFixedWidth;
        }
        else if (next.width < effectiveMinWidth) {
            if (direction.includes('w'))
                next.x = next.x - (effectiveMinWidth - next.width);
            next.width = effectiveMinWidth;
        }

        if (next.height < this.minHeight) {
            if (direction.includes('n'))
                next.y = next.y - (this.minHeight - next.height);
            next.height = this.minHeight;
        }
        return next;
    }

    private clampRectToViewport(rect: WindowRect): WindowRect {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;

        const effectiveMinWidth = this.getEffectiveMinWidth();
        const fixedWidth = this.getFixedWidthValue();
        const maxWidth = fixedWidth ?? Math.max(effectiveMinWidth, viewport.width - (pad * 2));
        const maxHeight = Math.max(this.minHeight, viewport.height - (pad * 2));
        const width = fixedWidth ?? this.clamp(rect.width, effectiveMinWidth, maxWidth);
        const height = this.clamp(rect.height, this.minHeight, maxHeight);
        const visualWidth = this.isMinimized ? this.getMinimizedVisualWidth() : width;
        const visualHeight = this.isMinimized ? this.getMinimizedVisualHeight() : height;

        const minX = pad;
        const maxX = Math.max(minX, viewport.width - visualWidth - pad);
        const minY = pad;
        const maxY = Math.max(minY, viewport.height - visualHeight - pad);

        return {
            x: this.clamp(rect.x, minX, maxX),
            y: this.clamp(rect.y, minY, maxY),
            width,
            height,
        };
    }

    private clampRectPositionToViewport(rect: WindowRect, visualWidth: number, visualHeight: number): WindowRect {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;
        const minX = pad;
        const maxX = Math.max(minX, viewport.width - visualWidth - pad);
        const minY = pad;
        const maxY = Math.max(minY, viewport.height - visualHeight - pad);

        return {
            ...rect,
            x: this.clamp(rect.x, minX, maxX),
            y: this.clamp(rect.y, minY, maxY),
        };
    }

    private getInitialRect(): WindowRect {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;
        const width = this.getFixedWidthValue()
            ?? Math.max(this.getEffectiveMinWidth(), Math.min(960, viewport.width - (pad * 2)));
        const height = Math.max(this.minHeight, Math.min(700, viewport.height - (pad * 2)));

        return this.clampRectToViewport({
            width,
            height,
            x: Math.round((viewport.width - width) / 2),
            y: Math.round((viewport.height - height) / 2),
        });
    }

    private getViewport(): { width: number; height: number; } {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const height = typeof window !== 'undefined' ? window.innerHeight : 720;
        return {
            width: Math.max(640, width),
            height: Math.max(480, height),
        };
    }

    private clamp(value: number, min: number, max: number): number {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    }

    private getFixedWidthValue(): number | null {
        const parsed = Number(this.fixedWidth);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return null;
        return Math.trunc(parsed);
    }

    private getEffectiveMinWidth(): number {
        return this.getFixedWidthValue() ?? this.minWidth;
    }

    private getEffectiveWidth(width: number): number {
        return this.getFixedWidthValue() ?? width;
    }

    private getMinimizedWidth(): number {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;
        const maxWidth = Math.max(this.minMinimizedWidth, viewport.width - (pad * 2));

        const actionsWidth = (this.controlButtonWidth * 3) + (this.actionsBlockGap * 2);
        const titlePaddingWidth = 14 + 10 + 12;
        const raw = titlePaddingWidth + actionsWidth + this.getTituloPixelWidth();

        return this.clamp(Math.ceil(raw), this.minMinimizedWidth, maxWidth);
    }

    private getMinimizedVisualWidth(): number {
        if (this.minimizedVariant === 'bubble')
            return this.minimizedBubbleSize;
        return this.getMinimizedWidth();
    }

    private getMinimizedVisualHeight(): number {
        if (this.minimizedVariant === 'bubble')
            return this.minimizedBubbleSize;
        return this.titleBarHeight;
    }

    private getTituloPixelWidth(): number {
        if (typeof document === 'undefined')
            return this.tituloVisible.length * 8.4;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return this.tituloVisible.length * 8.4;

        ctx.font = '600 14px "Segoe UI", "Roboto", sans-serif';
        return ctx.measureText(this.tituloVisible).width;
    }

    private async cargarPlacementsGuardados(): Promise<void> {
        if (!this.userSettingsSvc)
            return;

        try {
            this.minimizedPlacement = await this.userSettingsSvc.loadPreviewMinimizada();
        } catch {
            this.minimizedPlacement = null;
        }

        try {
            this.restoredPlacement = await this.userSettingsSvc.loadPreviewRestaurada();
            const restoredRect = this.getRestoredRectGuardado();
            if (restoredRect)
                this.rect = this.clampRectToViewport(restoredRect);
        } catch {
            this.restoredPlacement = null;
        }

        if (this.windowMode === 'minimized')
            this.toggleMinimize();
        if (this.windowMode === 'maximized')
            this.toggleMaximize();
    }

    private aplicarPlacementMinimizadoGuardado(sourceRect: WindowRect = this.rect): void {
        if (!this.minimizedAnchorsToViewportSides)
            return;
        if (!this.minimizedPlacement)
            this.guardarPlacementMinimizado(sourceRect);
        if (!this.minimizedPlacement)
            return;

        const width = this.getMinimizedVisualWidth();
        const viewport = this.getViewport();
        const x = this.minimizedPlacement.side === 'right'
            ? viewport.width - width - this.viewportPadding
            : this.viewportPadding;

        this.rect = {
            ...this.rect,
            x,
            y: this.minimizedPlacement.top,
        };
    }

    private guardarPlacementMinimizado(sourceRect: WindowRect = this.rect): void {
        if (!this.minimizedAnchorsToViewportSides)
            return;

        const viewport = this.getViewport();
        const width = this.getMinimizedVisualWidth();
        const referenceWidth = this.minimizedPlacement ? width : sourceRect.width;
        const centerX = sourceRect.x + (referenceWidth / 2);
        const side: 'left' | 'right' = centerX < (viewport.width / 2) ? 'left' : 'right';
        const top = sourceRect.y;

        this.minimizedPlacement = {
            version: 1,
            side,
            top,
            updatedAt: Date.now(),
        };
        this.minimizedPlacementChange.emit(this.clonePlacementMinimized(this.minimizedPlacement));
        if (!this.persistPreviewPlacements || !this.userSettingsSvc)
            return;

        this.userSettingsSvc.savePreviewMinimizada({
            side,
            top,
        }).catch(() => {
            // Ignorado: si falla el guardado remoto, se mantiene la última posición local.
        });
    }

    private clearMinimizedPlacement(): void {
        this.minimizedPlacement = null;
        this.minimizedPlacementChange.emit(null);
    }

    private getRectMinimizadoDesdeRestaurado(restoredRect: WindowRect): WindowRect {
        const viewport = this.getViewport();
        const minimizedWidth = this.getMinimizedVisualWidth();
        const minimizedHeight = this.getMinimizedVisualHeight();
        const sector = this.resolverSectorViewport(restoredRect, restoredRect.width, restoredRect.height);
        const leftOffset = restoredRect.x;
        const rightOffset = viewport.width - (restoredRect.x + restoredRect.width);
        const topOffset = restoredRect.y;
        const bottomOffset = viewport.height - (restoredRect.y + restoredRect.height);

        const nextRect: WindowRect = {
            ...restoredRect,
            x: sector.horizontal === 'left'
                ? leftOffset
                : viewport.width - minimizedWidth - rightOffset,
            y: sector.vertical === 'top'
                ? topOffset
                : viewport.height - minimizedHeight - bottomOffset,
        };

        return this.clampRectPositionToViewport(nextRect, minimizedWidth, minimizedHeight);
    }

    private getRectRestauradoDesdeMinimizadoLibre(minimizedRect: WindowRect, fallbackRect: WindowRect): WindowRect {
        const viewport = this.getViewport();
        const minimizedWidth = this.getMinimizedVisualWidth();
        const minimizedHeight = this.getMinimizedVisualHeight();
        const sector = this.resolverSectorViewport(minimizedRect, minimizedWidth, minimizedHeight);
        const leftOffset = minimizedRect.x;
        const rightOffset = viewport.width - (minimizedRect.x + minimizedWidth);
        const topOffset = minimizedRect.y;
        const bottomOffset = viewport.height - (minimizedRect.y + minimizedHeight);

        return this.clampRectToViewport({
            ...fallbackRect,
            x: sector.horizontal === 'left'
                ? leftOffset
                : viewport.width - fallbackRect.width - rightOffset,
            y: sector.vertical === 'top'
                ? topOffset
                : viewport.height - fallbackRect.height - bottomOffset,
        });
    }

    private getRestoredRectGuardado(): WindowRect | null {
        if (!this.restoredPlacement)
            return null;

        return {
            x: this.restoredPlacement.left,
            y: this.restoredPlacement.top,
            width: this.restoredPlacement.width,
            height: this.restoredPlacement.height,
        };
    }

    private guardarPlacementRestaurado(): void {
        this.guardarPlacementRestauradoDesdeRect(this.rect);
    }

    private guardarPlacementRestauradoDesdeRect(rect: WindowRect): void {
        const left = rect.x;
        const top = rect.y;
        const width = this.getEffectiveWidth(rect.width);
        const height = rect.height;
        this.restoredPlacement = {
            version: 1,
            left,
            top,
            width,
            height,
            updatedAt: Date.now(),
        };
        this.restoredPlacementChange.emit(this.clonePlacementRestored(this.restoredPlacement));
        if (!this.persistPreviewPlacements || !this.userSettingsSvc)
            return;

        this.userSettingsSvc.savePreviewRestaurada({
            left,
            top,
            width,
            height,
        }).catch(() => {
            // Ignorado: si falla el guardado remoto, se mantiene la última geometría local.
        });
    }

    private resolverSectorViewport(rect: WindowRect, visualWidth: number, visualHeight: number): WindowViewportSector {
        const viewport = this.getViewport();
        const middleX = viewport.width / 2;
        const middleY = viewport.height / 2;
        const sectors: Array<WindowViewportSector & {
            left: number;
            top: number;
            right: number;
            bottom: number;
        }> = [
            { horizontal: 'left', vertical: 'top', left: 0, top: 0, right: middleX, bottom: middleY },
            { horizontal: 'right', vertical: 'top', left: middleX, top: 0, right: viewport.width, bottom: middleY },
            { horizontal: 'left', vertical: 'bottom', left: 0, top: middleY, right: middleX, bottom: viewport.height },
            { horizontal: 'right', vertical: 'bottom', left: middleX, top: middleY, right: viewport.width, bottom: viewport.height },
        ];

        let bestSector: WindowViewportSector = { horizontal: 'left', vertical: 'top' };
        let bestArea = -1;
        sectors.forEach((sector) => {
            const overlapLeft = Math.max(rect.x, sector.left);
            const overlapTop = Math.max(rect.y, sector.top);
            const overlapRight = Math.min(rect.x + visualWidth, sector.right);
            const overlapBottom = Math.min(rect.y + visualHeight, sector.bottom);
            const overlapWidth = Math.max(0, overlapRight - overlapLeft);
            const overlapHeight = Math.max(0, overlapBottom - overlapTop);
            const area = overlapWidth * overlapHeight;
            if (area > bestArea) {
                bestArea = area;
                bestSector = {
                    horizontal: sector.horizontal,
                    vertical: sector.vertical,
                };
            }
        });

        return bestSector;
    }

    private emitModeChange(): void {
        this.windowModeChange.emit(this.resolveMode());
    }

    private resolveMode(): FloatingWindowVisualMode {
        if (this.isMaximized)
            return 'maximized';
        if (this.isMinimized)
            return 'minimized';
        return 'window';
    }

    private clonePlacementMinimized(source: FloatingWindowPlacementMinimized | null): FloatingWindowPlacementMinimized | null {
        return source ? { ...source } : null;
    }

    private clonePlacementRestored(source: FloatingWindowPlacementRestored | null): FloatingWindowPlacementRestored | null {
        return source ? { ...source } : null;
    }
}
