import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FloatingWindowPlacementMinimized, FloatingWindowPlacementRestored } from 'src/app/interfaces/user-settings';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ConversacionChatPlataforma, PlatformSessionService } from 'src/app/services/platform-session.service';
import { environment } from 'src/environments/environment';

/** Una conversación del chat de la plataforma (`<yosi-chat-conversacion>`) en su ventana flotante de Rol. */
@Component({
    selector: 'app-chat-floating-conversation-window',
    templateUrl: './chat-floating-conversation-window.component.html',
    styleUrls: ['./chat-floating-conversation-window.component.sass'],
    standalone: false,
})
export class ChatFloatingConversationWindowComponent implements OnInit {
    @Input() conversationId = 0;
    @Input() mode: 'window' | 'bubble' | 'maximized' = 'window';
    @Input() restoredPlacement: FloatingWindowPlacementRestored | null = null;
    @Input() bubblePlacement: FloatingWindowPlacementMinimized | null = null;
    @Input() zIndex: number | null = null;
    @Output() closeRequested = new EventEmitter<void>();
    @Output() focusRequested = new EventEmitter<void>();
    @Output() stateChange = new EventEmitter<{
        mode: 'window' | 'bubble' | 'maximized';
        restoredPlacement: FloatingWindowPlacementRestored | null;
        bubblePlacement: FloatingWindowPlacementMinimized | null;
    }>();

    readonly bubbleFeatureEnabled$ = this.chatFloatingSvc.bubbleFeatureEnabled$;
    private conversacion: ConversacionChatPlataforma | null = null;

    constructor(
        private chatFloatingSvc: ChatFloatingService,
        private platformSessionSvc: PlatformSessionService,
    ) { }

    ngOnInit(): void {
        void this.cargarConversacion();
    }

    get title(): string {
        const conversacion = this.conversacion;
        if (conversacion?.tipo === 'directa' && conversacion.persona)
            return `${conversacion.persona.nombre ?? ''}`.trim() || conversacion.persona.alias;
        return `${conversacion?.titulo ?? ''}`.trim() || `${conversacion?.web?.nombre ?? ''}`.trim() || 'Chat';
    }

    get bubbleImageUrl(): string {
        const miniatura = `${this.conversacion?.persona?.avatar?.miniatura ?? ''}`.trim();
        if (miniatura.length < 1 || this.conversacion?.tipo !== 'directa')
            return '';
        return miniatura.startsWith('/') ? `${environment.plataforma.apiUrl}${miniatura}` : miniatura;
    }

    get bubbleIcon(): string {
        if (this.conversacion?.tipo === 'web')
            return 'diversity_3';
        if (this.conversacion?.tipo === 'grupo')
            return 'groups_2';
        return 'person';
    }

    get bubbleLabel(): string {
        return `Abrir ${this.title}`;
    }

    onWindowModeChange(mode: 'window' | 'minimized' | 'maximized'): void {
        this.mode = mode === 'minimized' ? 'bubble' : mode;
        this.emitState();
    }

    onRestoredPlacementChange(placement: FloatingWindowPlacementRestored | null): void {
        this.restoredPlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    onBubblePlacementChange(placement: FloatingWindowPlacementMinimized | null): void {
        this.bubblePlacement = placement ? { ...placement } : null;
        this.emitState();
    }

    /** La persona ya no está en la conversación (ha salido de un grupo o se ha borrado la directa). */
    onFuera(): void {
        this.closeRequested.emit();
    }

    private async cargarConversacion(): Promise<void> {
        try {
            const bandeja = await this.platformSessionSvc.conversacionesChat();
            this.conversacion = (bandeja ?? []).find((item) => Number(item.id) === Number(this.conversationId)) ?? null;
        } catch {
            this.conversacion = null;
        }
    }

    private emitState(): void {
        this.stateChange.emit({
            mode: this.mode,
            restoredPlacement: this.restoredPlacement ? { ...this.restoredPlacement } : null,
            bubblePlacement: this.bubblePlacement ? { ...this.bubblePlacement } : null,
        });
    }
}
