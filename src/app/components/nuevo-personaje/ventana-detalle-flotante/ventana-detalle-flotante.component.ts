import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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

@Component({
    selector: 'app-ventana-detalle-flotante',
    templateUrl: './ventana-detalle-flotante.component.html',
    styleUrls: ['./ventana-detalle-flotante.component.sass']
})
export class VentanaDetalleFlotanteComponent {
    @Input() titulo = 'Sin nombre - En creación';
    @Input() bloqueadaPorOverlay = false;
    @Output() cerrarSolicitado: EventEmitter<void> = new EventEmitter<void>();

    readonly minWidth = 560;
    readonly minHeight = 340;
    readonly titleBarHeight = 44;
    private readonly viewportPadding = 12;
    private readonly minMinimizedWidth = 220;
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

    ngOnInit(): void {
        this.rect = this.getInitialRect();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['titulo'] && this.isMinimized) {
            this.rect = this.clampRectToViewport(this.rect);
        }
    }

    onTitleBarPointerDown(event: PointerEvent): void {
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
        event.preventDefault();
    }

    onResizePointerDown(event: PointerEvent, direction: ResizeDirection): void {
        if (event.button !== 0 || this.isMaximized || this.isMinimized || this.bloqueadaPorOverlay)
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

    toggleMinimize(): void {
        if (this.bloqueadaPorOverlay)
            return;

        const minimizando = !this.isMinimized;
        if (minimizando && this.isMaximized) {
            this.isMaximized = false;
            if (this.restoreRect) {
                this.rect = this.clampRectToViewport(this.restoreRect);
            }
            this.restoreRect = null;
        }

        this.isMinimized = !this.isMinimized;
        this.rect = this.clampRectToViewport(this.rect);
    }

    toggleMaximize(): void {
        if (this.bloqueadaPorOverlay)
            return;
        if (this.isMaximized) {
            this.restoreFromSnapshot();
            return;
        }

        this.restoreRect = { ...this.rect };
        this.isMinimized = false;
        this.isMaximized = true;
    }

    solicitarCierre(): void {
        if (this.bloqueadaPorOverlay)
            return;
        this.cerrarSolicitado.emit();
    }

    get containerStyle(): Record<string, string> {
        if (this.isMaximized) {
            const viewport = this.getViewport();
            const pad = this.viewportPadding;
            return {
                left: `${pad}px`,
                top: `${pad}px`,
                width: `${Math.max(this.minWidth, viewport.width - (pad * 2))}px`,
                height: `${Math.max(this.minHeight, viewport.height - (pad * 2))}px`,
            };
        }

        const width = this.isMinimized ? this.getMinimizedWidth() : this.rect.width;
        const height = this.isMinimized ? this.titleBarHeight : this.rect.height;
        return {
            left: `${this.rect.x}px`,
            top: `${this.rect.y}px`,
            width: `${width}px`,
            height: `${height}px`,
        };
    }

    get tituloVisible(): string {
        const value = `${this.titulo ?? ''}`.trim();
        return value.length > 0 ? value : 'Sin nombre - En creación';
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
        this.activeInteraction = null;
    }

    @HostListener('window:blur')
    onWindowBlur(): void {
        this.activeInteraction = null;
    }

    private restoreFromSnapshot(): void {
        this.isMaximized = false;
        if (this.restoreRect) {
            this.rect = this.clampRectToViewport(this.restoreRect);
        }
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
        let next = { ...rect };
        if (next.width < this.minWidth) {
            if (direction.includes('w'))
                next.x = next.x - (this.minWidth - next.width);
            next.width = this.minWidth;
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

        const maxWidth = Math.max(this.minWidth, viewport.width - (pad * 2));
        const maxHeight = Math.max(this.minHeight, viewport.height - (pad * 2));
        const width = this.clamp(rect.width, this.minWidth, maxWidth);
        const height = this.clamp(rect.height, this.minHeight, maxHeight);
        const visualWidth = this.isMinimized ? this.getMinimizedWidth() : width;
        const visualHeight = this.isMinimized ? this.titleBarHeight : height;

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

    private getInitialRect(): WindowRect {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;
        const width = Math.max(this.minWidth, Math.min(960, viewport.width - (pad * 2)));
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

    private getMinimizedWidth(): number {
        const viewport = this.getViewport();
        const pad = this.viewportPadding;
        const maxWidth = Math.max(this.minMinimizedWidth, viewport.width - (pad * 2));

        const actionsWidth = (this.controlButtonWidth * 3) + (this.actionsBlockGap * 2);
        const titlePaddingWidth = 14 + 10 + 12;
        const raw = titlePaddingWidth + actionsWidth + this.getTituloPixelWidth();

        return this.clamp(Math.ceil(raw), this.minMinimizedWidth, maxWidth);
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
}
