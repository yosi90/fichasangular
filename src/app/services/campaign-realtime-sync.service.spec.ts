import { CampaignRealtimeEvent } from '../interfaces/campaign-management';
import { CampaignRealtimeSyncService } from './campaign-realtime-sync.service';

describe('CampaignRealtimeSyncService', () => {
    it('avisa de un cambio local a las vistas y a los listados', () => {
        const service = new CampaignRealtimeSyncService();
        const eventos: CampaignRealtimeEvent[] = [];
        const invalidaciones: CampaignRealtimeEvent[] = [];
        service.events$.subscribe((evento) => eventos.push(evento));
        service.listInvalidations$.subscribe((evento) => invalidaciones.push(evento));

        service.notifyLocalChange(7);

        expect(eventos).toEqual([{ code: 'campaign.local_change', campaignId: 7, conversationId: null, source: 'local' }]);
        expect(invalidaciones).toEqual(eventos);
    });

    it('descarta ids de campaña no válidos', () => {
        const service = new CampaignRealtimeSyncService();
        const eventos: CampaignRealtimeEvent[] = [];
        service.events$.subscribe((evento) => eventos.push(evento));

        service.notifyLocalChange(-3);

        expect(eventos[0].campaignId).toBeNull();
    });
});
