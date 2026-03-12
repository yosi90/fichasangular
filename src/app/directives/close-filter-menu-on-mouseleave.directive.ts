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

    private closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private panelListeners: Array<() => void> = [];
    private hostListeners: Array<() => void> = [];

    constructor() {
        this.trigger.menuOpened.subscribe(() => this.handleMenuOpened());
        this.trigger.menuClosed.subscribe(() => this.handleMenuClosed());

        this.hostListeners.push(
            this.listen(this.host.nativeElement, 'mouseenter', () => this.clearCloseTimeout()),
        );
    }

    ngOnDestroy(): void {
        this.handleMenuClosed();
        this.hostListeners.forEach(unlisten => unlisten());
        this.hostListeners = [];
    }

    private handleMenuOpened(): void {
        this.clearCloseTimeout();
        this.detachPanelListeners();

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
            });
        });
    }

    private handleMenuClosed(): void {
        this.clearCloseTimeout();
        this.detachPanelListeners();
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

        if (this.hasInteractiveOverlayOpen()) {
            this.scheduleClose(160);
            return;
        }

        this.ngZone.run(() => this.trigger.closeMenu());
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

    private clearCloseTimeout(): void {
        if (this.closeTimeoutId !== null) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        }
    }

    private listen(
        target: HTMLElement,
        eventName: string,
        listener: () => void,
    ): () => void {
        target.addEventListener(eventName, listener);
        return () => target.removeEventListener(eventName, listener);
    }
}
