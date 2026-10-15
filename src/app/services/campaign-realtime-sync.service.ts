import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CampaignRealtimeEvent } from '../interfaces/campaign-management';

// Avisa a las vistas de campañas de que algo ha cambiado. Antes también escuchaba los mensajes de sistema del chat
// propio (invitaciones); ahora las invitaciones llegan como notificaciones de la plataforma y la lista de campañas
// se pone al día por su proyección en Firestore (`private_users/{uid}/campaigns`).
@Injectable({
    providedIn: 'root'
})
export class CampaignRealtimeSyncService {
    private readonly eventsSubject = new Subject<CampaignRealtimeEvent>();
    private readonly listInvalidationsSubject = new Subject<CampaignRealtimeEvent>();

    readonly events$: Observable<CampaignRealtimeEvent> = this.eventsSubject.asObservable();
    readonly listInvalidations$: Observable<CampaignRealtimeEvent> = this.listInvalidationsSubject.asObservable();

    init(): void {
        // Sin suscripciones propias: se conserva para no cambiar el arranque de la app.
    }

    notifyLocalChange(campaignId?: number | null): void {
        const event: CampaignRealtimeEvent = {
            code: 'campaign.local_change',
            campaignId: this.toPositiveInt(campaignId),
            conversationId: null,
            source: 'local',
        };
        this.eventsSubject.next(event);
        this.listInvalidationsSubject.next(event);
    }

    private toPositiveInt(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
}
