import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FloatingWindowPlacementMinimized, FloatingWindowPlacementRestored } from 'src/app/interfaces/user-settings';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';

/** La ventana «Chats»: la bandeja del chat de la plataforma (`<yosi-chat-bandeja>`) dentro de la ventana flotante de Rol. */
@Component({
    selector: 'app-chat-floating-list-window',
    templateUrl: './chat-floating-list-window.component.html',
    styleUrls: ['./chat-floating-list-window.component.sass'],
    standalone: false,
})
export class ChatFloatingListWindowComponent implements OnInit, OnDestroy {
    @Input() mode: 'window' | 'minimized' | 'maximized' = 'window';
    @Input() restoredPlacement: FloatingWindowPlacementRestored | null = null;
    @Input() minimizedPlacement: FloatingWindowPlacementMinimized | null = null;
    @Input() zIndex: number | null = null;
    @Output() closeRequested = new EventEmitter<void>();
    @Output() focusRequested = new EventEmitter<void>();
    @Output() stateChange = new EventEmitter<{
        mode: 'window' | 'minimized' | 'maximized';
        restoredPlacement: FloatingWindowPlacementRestored | null;
        minimizedPlacement: FloatingWindowPlacementMinimized | null;
    }>();

    noLeidos = 0;
    private dejarDeEscuchar: (() => void) | null = null;
    private destruido = false;

    constructor(
        private chatFloatingSvc: ChatFloatingService,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    ngOnInit(): void {
        void this.platformSessionSvc.alCambiarNoLeidosChat((noLeidos) => this.noLeidos = Math.max(0, Math.trunc(noLeidos) || 0))
            .then((dejar) => {
                if (this.destruido)
                    dejar();
                else
                    this.dejarDeEscuchar = dejar;
            })
            .catch(() => undefined);
    }

    ngOnDestroy(): void {
        this.destruido = true;
        this.dejarDeEscuchar?.();
        this.dejarDeEscuchar = null;
    }

    get titulo(): string {
        return this.noLeidos > 0 ? `Chats (${this.noLeidos})` : 'Chats';
    }

    onSeleccion(evento: Event): void {
        const conversacion = (evento as CustomEvent<{ conversacion?: number }>).detail?.conversacion;
        void this.chatFloatingSvc.abrir(conversacion ?? null);
    }

    onWindowModeChange(mode: 'window' | 'minimized' | 'maximized'): void {
        this.mode = mode;
        this.emitState();
    }

    onRestoredPlacementChange(placement: FloatingWindowPlacementRestored | null): void {
        this.restoredPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    onMinimizedPlacementChange(placement: FloatingWindowPlacementMinimized | null): void {
        this.minimizedPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    private emitState(): void {
        this.stateChange.emit({
            mode: this.mode,
            restoredPlacement: this.restoredPlacement ? { ...this.restoredPlacement } : null,
            minimizedPlacement: this.minimizedPlacement ? { ...this.minimizedPlacement } : null,
        });
    }
}
