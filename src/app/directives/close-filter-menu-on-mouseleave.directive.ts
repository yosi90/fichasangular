import { OverlayContainer } from '@angular/cdk/overlay';
import { Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';

@Directive({
    selector: 'button.filtros[matMenuTriggerFor]',
    standalone: false,
})
export class CloseFilterMenuOnMouseleaveDirective implements OnDestroy {
    private readonly trigger = inject(MatMenuTrigger);
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly overlayContainer = inject(OverlayContainer);
    private readonly ngZone = inject(NgZone);
    private readonly safeAreaPadding = 18;

    private closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private panelListeners: Array<() => void> = [];
    private hostListeners: Array<() => void> = [];
    private documentListeners: Array<() => void> = [];
    private lastPointerX: number | null = null;
    private lastPointerY: number | null = null;

    constructor() {
        this.trigger.menuOpened.subscribe(() => this.handleMenuOpened());
        this.trigger.menuClosed.subscribe(() => this.handleMenuClosed());

        this.hostListeners.push(
            this.listen(this.host.nativeElement, 'mouseenter', () => this.handleHostMouseEnter()),
            this.listen(this.host.nativeElement, 'mouseleave', () => this.scheduleClose()),
            this.listen(this.host.nativeElement, 'click', (event: Event) => this.handleHostClick(event), { capture: true }),
        );
    }

    ngOnDestroy(): void {
        this.handleMenuClosed();
        this.hostListeners.forEach(unlisten => unlisten());
        this.hostListeners = [];
    }

    private handleHostMouseEnter(): void {
        this.clearCloseTimeout();
        if (this.trigger.menuOpen)
            return;

        this.ngZone.run(() => this.trigger.openMenu());
    }

    private handleHostClick(event: Event): void {
        const mouseEvent = event as MouseEvent;
        if ((mouseEvent?.detail ?? 0) < 1)
            return;

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    private handleMenuOpened(): void {
        this.clearCloseTimeout();
        this.detachPanelListeners();
        this.detachDocumentListeners();

        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                const panel = this.getMenuPanel();
                if (!panel || !this.trigger.menuOpen) {
                    return;
                }

                this.panelListeners.push(
                    this.listen(panel, 'mouseenter', () => this.clearCloseTimeout()),
                    this.listen(panel, 'mouseleave', () => this.scheduleClose()),
                );
                this.documentListeners.push(
                    this.listen(document, 'mousemove', (event: Event) => this.capturePointer(event as MouseEvent)),
                );
            });
        });
    }

    private handleMenuClosed(): void {
        this.clearCloseTimeout();
        this.detachPanelListeners();
        this.detachDocumentListeners();
    }

    private scheduleClose(delay = 140): void {
        this.clearCloseTimeout();
        this.closeTimeoutId = setTimeout(() => this.maybeCloseMenu(), delay);
    }

    private maybeCloseMenu(): void {
        this.closeTimeoutId = null;

        if (!this.trigger.menuOpen) {
            return;
        }

        const panel = this.getMenuPanel();
        if (!panel) {
            return;
        }

        if (panel.matches(':hover') || this.host.nativeElement.matches(':hover')) {
            return;
        }

        if (this.isPointerInsideSafeArea(panel)) {
            this.scheduleClose(120);
            return;
        }

        if (this.hasInteractiveOverlayOpen()) {
            this.scheduleClose(160);
            return;
        }

        this.ngZone.run(() => this.trigger.closeMenu());
    }

    private capturePointer(event: MouseEvent): void {
        this.lastPointerX = Number.isFinite(event.clientX) ? event.clientX : null;
        this.lastPointerY = Number.isFinite(event.clientY) ? event.clientY : null;
    }

    private isPointerInsideSafeArea(panel: HTMLElement): boolean {
        if (this.lastPointerX === null || this.lastPointerY === null)
            return false;

        const hostRect = this.host.nativeElement.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const minX = Math.min(hostRect.left, panelRect.left) - this.safeAreaPadding;
        const maxX = Math.max(hostRect.right, panelRect.right) + this.safeAreaPadding;
        const minY = Math.min(hostRect.top, panelRect.top) - this.safeAreaPadding;
        const maxY = Math.max(hostRect.bottom, panelRect.bottom) + this.safeAreaPadding;

        return this.lastPointerX >= minX
            && this.lastPointerX <= maxX
            && this.lastPointerY >= minY
            && this.lastPointerY <= maxY;
    }

    private hasInteractiveOverlayOpen(): boolean {
        const overlayRoot = this.overlayContainer.getContainerElement();
        return Boolean(
            overlayRoot.querySelector('.mat-mdc-select-panel') ||
            overlayRoot.querySelector('.mat-datepicker-content') ||
            overlayRoot.querySelector('.mat-mdc-autocomplete-panel'),
        );
    }

    private getMenuPanel(): HTMLElement | null {
        const panelId = this.trigger.menu?.panelId;
        if (!panelId) {
            return null;
        }

        return this.overlayContainer.getContainerElement().querySelector<HTMLElement>(`#${panelId}`);
    }

    private detachPanelListeners(): void {
        this.panelListeners.forEach(unlisten => unlisten());
        this.panelListeners = [];
    }

    private detachDocumentListeners(): void {
        this.documentListeners.forEach(unlisten => unlisten());
        this.documentListeners = [];
    }

    private clearCloseTimeout(): void {
        if (this.closeTimeoutId !== null) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        }
    }

    private listen(
        target: Document | HTMLElement,
        eventName: string,
        listener: (event: Event) => void,
        options?: AddEventListenerOptions,
    ): () => void {
        target.addEventListener(eventName, listener as EventListener, options);
        return () => target.removeEventListener(eventName, listener as EventListener, options);
    }
}
