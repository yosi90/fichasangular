import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { CampaignRealtimeEvent, CampaignRealtimeEventCode } from '../interfaces/campaign-management';
import { ChatMessage } from '../interfaces/chat';
import { ChatRealtimeService } from './chat-realtime.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class CampaignRealtimeSyncService implements OnDestroy {
    private initialized = false;
    private readonly subscriptions = new Subscription();
    private readonly eventsSubject = new Subject<CampaignRealtimeEvent>();
    private readonly listInvalidationsSubject = new Subject<CampaignRealtimeEvent>();
    private readonly handledMessageIds = new Set<number>();

    readonly events$: Observable<CampaignRealtimeEvent> = this.eventsSubject.asObservable();
    readonly listInvalidations$: Observable<CampaignRealtimeEvent> = this.listInvalidationsSubject.asObservable();

    constructor(
        private chatRealtimeSvc: ChatRealtimeService,
        private userSvc: UserService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.subscriptions.add(
            this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
                if (loggedIn !== true)
                    this.handledMessageIds.clear();
            })
        );
        this.subscriptions.add(
            this.chatRealtimeSvc.messageCreated$.subscribe((message) => this.handleIncomingMessage(message))
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    notifyLocalChange(campaignId?: number | null): void {
        this.emitEvent({
            code: 'campaign.local_change',
            campaignId: this.toPositiveInt(campaignId),
            conversationId: null,
            source: 'local',
        });
    }

    private handleIncomingMessage(message: ChatMessage): void {
        const messageId = this.toPositiveInt(message?.messageId);
        if (!messageId || this.handledMessageIds.has(messageId))
            return;

        const code = this.normalizeRelevantCode(message?.notification?.code);
        if (!code)
            return;

        this.handledMessageIds.add(messageId);
        this.emitEvent({
            code,
            campaignId: this.extractCampaignId(message),
            conversationId: this.toPositiveInt(message?.notification?.action?.conversationId)
                ?? this.toPositiveInt(message?.conversationId),
            source: 'remote',
        });
    }

    private emitEvent(event: CampaignRealtimeEvent): void {
        this.eventsSubject.next(event);
        this.listInvalidationsSubject.next(event);
    }

    private normalizeRelevantCode(value: string | null | undefined): CampaignRealtimeEventCode | null {
        const code = `${value ?? ''}`.trim();
        if (code === 'system.campaign_invitation_received' || code === 'system.campaign_invitation_resolved')
            return code;
        return null;
    }

    private extractCampaignId(message: ChatMessage | null | undefined): number | null {
        const context = message?.notification?.context;
        if (!context || typeof context !== 'object')
            return null;

        return this.toPositiveInt(
            (context as Record<string, any>)['campaignId']
            ?? (context as Record<string, any>)['idCampana']
            ?? (context as Record<string, any>)['campaign_id']
        );
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
