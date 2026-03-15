import { BehaviorSubject, Subject } from 'rxjs';
import { CampaignRealtimeSyncService } from './campaign-realtime-sync.service';

describe('CampaignRealtimeSyncService', () => {
    it('traduce notificaciones remotas de campaña a eventos normalizados y deduplica por messageId', () => {
        const messages$ = new Subject<any>();
        const loggedIn$ = new BehaviorSubject<boolean>(true);
        const service = new CampaignRealtimeSyncService(
            {
                messageCreated$: messages$.asObservable(),
            } as any,
            {
                isLoggedIn$: loggedIn$,
            } as any,
        );

        const events: any[] = [];
        service.events$.subscribe((event) => events.push(event));
        service.init();

        messages$.next({
            messageId: 18,
            conversationId: 5,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Invitación aceptada.',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: {
                code: 'system.campaign_invitation_resolved',
                title: 'Invitación resuelta',
                action: {
                    target: 'social.messages',
                    conversationId: 5,
                },
                context: {
                    campaignId: 9,
                },
            },
            announcement: null,
        });
        messages$.next({
            messageId: 18,
            conversationId: 5,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Duplicado.',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: {
                code: 'system.campaign_invitation_resolved',
                title: 'Invitación resuelta',
                action: {
                    target: 'social.messages',
                    conversationId: 5,
                },
                context: {
                    campaignId: 9,
                },
            },
            announcement: null,
        });

        expect(events).toEqual([{
            code: 'system.campaign_invitation_resolved',
            campaignId: 9,
            conversationId: 5,
            source: 'remote',
        }]);
    });

    it('ignora notificaciones ajenas y expone invalidaciones locales', () => {
        const messages$ = new Subject<any>();
        const service = new CampaignRealtimeSyncService(
            {
                messageCreated$: messages$.asObservable(),
            } as any,
            {
                isLoggedIn$: new BehaviorSubject<boolean>(true),
            } as any,
        );

        const invalidations: any[] = [];
        service.listInvalidations$.subscribe((event) => invalidations.push(event));
        service.init();

        messages$.next({
            messageId: 30,
            conversationId: 7,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Otro aviso.',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: {
                code: 'system.account_updated',
                title: 'Cuenta actualizada',
                action: null,
                context: null,
            },
            announcement: null,
        });
        service.notifyLocalChange(14);

        expect(invalidations).toEqual([{
            code: 'campaign.local_change',
            campaignId: 14,
            conversationId: null,
            source: 'local',
        }]);
    });

    it('limpia la deduplicación al cerrar sesión', () => {
        const messages$ = new Subject<any>();
        const loggedIn$ = new BehaviorSubject<boolean>(true);
        const service = new CampaignRealtimeSyncService(
            {
                messageCreated$: messages$.asObservable(),
            } as any,
            {
                isLoggedIn$: loggedIn$,
            } as any,
        );

        const events: any[] = [];
        service.events$.subscribe((event) => events.push(event));
        service.init();

        const message = {
            messageId: 44,
            conversationId: 9,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Invitación recibida.',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: {
                code: 'system.campaign_invitation_received',
                title: 'Nueva invitación',
                action: null,
                context: {
                    idCampana: 12,
                },
            },
            announcement: null,
        };

        messages$.next(message);
        loggedIn$.next(false);
        loggedIn$.next(true);
        messages$.next(message);

        expect(events.length).toBe(2);
    });
});
