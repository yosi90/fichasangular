import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FloatingWindowPlacementMinimized, FloatingWindowPlacementRestored } from 'src/app/interfaces/user-settings';
import {
    ChatFloatingService,
    FloatingChatBubbleRuntimeState,
    FloatingChatListRuntimeState,
} from 'src/app/services/chat-floating.service';

@Component({
    selector: 'app-chat-floating-host',
    templateUrl: './chat-floating-host.component.html',
    styleUrls: ['./chat-floating-host.component.sass'],
    standalone: false,
})
export class ChatFloatingHostComponent {
    readonly listWindow$: Observable<FloatingChatListRuntimeState | null> = this.chatFloatingSvc.listWindow$;
    readonly bubbles$: Observable<FloatingChatBubbleRuntimeState[]> = this.chatFloatingSvc.bubbles$;

    constructor(public chatFloatingSvc: ChatFloatingService) { }

    trackByConversationId(_: number, item: FloatingChatBubbleRuntimeState): number {
        return item.conversationId;
    }

    updateListState(state: {
        mode: FloatingChatListRuntimeState['mode'];
        restoredPlacement: FloatingWindowPlacementRestored | null;
        minimizedPlacement: FloatingWindowPlacementMinimized | null;
    }): void {
        this.chatFloatingSvc.updateListWindowState(state.mode, state.restoredPlacement, state.minimizedPlacement);
    }

    updateBubbleState(
        conversationId: number,
        state: {
            mode: FloatingChatBubbleRuntimeState['mode'];
            restoredPlacement: FloatingWindowPlacementRestored | null;
            bubblePlacement: FloatingWindowPlacementMinimized | null;
        }
    ): void {
        this.chatFloatingSvc.updateConversationState(conversationId, state.mode, state.restoredPlacement, state.bubblePlacement);
    }
}
