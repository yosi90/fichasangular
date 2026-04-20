import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ProfileApiError } from '../interfaces/user-account';
import { ChatRealtimeService } from './chat-realtime.service';

describe('ChatRealtimeService', () => {
    it('deduplica alertCandidate por alertKey y omite mensajes propios', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        const alertedIds: Array<number | null> = [];
        service.alertCandidate$.subscribe((candidate) => alertedIds.push(candidate.messageId));

        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).handleIncomingMessage({
            messageId: 11,
            conversationId: 5,
            sender: {
                uid: 'uid-propio',
                displayName: 'Yo',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Mensaje propio',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });

        expect(alertedIds).toEqual([10]);
    });

    it('enriquece el alertCandidate con el contexto de la conversación', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        service.upsertConversation({
            conversationId: 5,
            type: 'campaign',
            title: 'Caballeros de Cormyr',
            photoThumbUrl: null,
            campaignId: 7,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
        } as any);

        const candidates: any[] = [];
        service.alertCandidate$.subscribe((candidate) => candidates.push(candidate));

        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });

        expect(candidates[0]).toEqual(jasmine.objectContaining({
            conversationType: 'campaign',
            conversationTitle: 'Caballeros de Cormyr',
            campaignId: 7,
            isSystemConversation: false,
        }));
    });

    it('emite alertCandidate para notificación persistente recuperada desde listConversations', async () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        let cycle = 0;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.callFake(async () => {
                    cycle += 1;
                    if (cycle === 1) {
                        return {
                            items: [{
                                conversationId: 55,
                                type: 'direct',
                                title: 'Yosiftware',
                                photoThumbUrl: null,
                                campaignId: null,
                                participantRole: 'member',
                                participantStatus: 'active',
                                lastMessagePreview: null,
                                lastMessageAtUtc: null,
                                unreadCount: 0,
                                canSend: true,
                                isSystemConversation: true,
                                counterpartUid: null,
                                lastMessageNotification: null,
                            }],
                            unreadUserCount: 0,
                            unreadSystemCount: 0,
                        };
                    }
                    return {
                        items: [{
                            conversationId: 55,
                            type: 'direct',
                            title: 'Yosiftware',
                            photoThumbUrl: null,
                            campaignId: null,
                            participantRole: 'member',
                            participantStatus: 'active',
                            lastMessagePreview: 'Tu invitación ha sido aceptada.',
                            lastMessageAtUtc: '2026-03-15T15:00:00.000Z',
                            unreadCount: 1,
                            canSend: true,
                            isSystemConversation: true,
                            counterpartUid: null,
                            lastMessageNotification: {
                                code: 'system.campaign_invitation_resolved',
                                title: 'Invitación resuelta',
                                action: {
                                    target: 'social.messages',
                                    conversationId: 55,
                                },
                                context: {
                                    campaignId: 7,
                                },
                            },
                        }],
                        unreadUserCount: 0,
                        unreadSystemCount: 1,
                    };
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        const candidates: any[] = [];
        service.alertCandidate$.subscribe((candidate) => candidates.push(candidate));

        await service.refreshConversations(true);
        await service.refreshConversations(true);

        expect(candidates.length).toBe(1);
        expect(candidates[0].source).toBe('conversation_summary');
        expect(candidates[0].messageId).toBeNull();
        expect(candidates[0].notification?.code).toBe('system.campaign_invitation_resolved');
    });

    it('no duplica la alerta persistente si el websocket ya entregó la misma notificación', async () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [{
                        conversationId: 55,
                        type: 'direct',
                        title: 'Yosiftware',
                        photoThumbUrl: null,
                        campaignId: null,
                        participantRole: 'member',
                        participantStatus: 'active',
                        lastMessagePreview: 'Tu invitación ha sido aceptada.',
                        lastMessageAtUtc: '2026-03-15T15:00:00.000Z',
                        unreadCount: 1,
                        canSend: true,
                        isSystemConversation: true,
                        counterpartUid: null,
                        lastMessageNotification: {
                            code: 'system.campaign_invitation_resolved',
                            title: 'Invitación resuelta',
                            action: {
                                target: 'social.messages',
                                conversationId: 55,
                            },
                            context: {
                                campaignId: 7,
                            },
                        },
                    }],
                    unreadUserCount: 0,
                    unreadSystemCount: 1,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        const candidates: any[] = [];
        service.alertCandidate$.subscribe((candidate) => candidates.push(candidate));

        (service as any).handleIncomingMessage({
            messageId: 91,
            conversationId: 55,
            sender: {
                uid: 'system:yosiftware',
                displayName: 'Yosiftware',
                photoThumbUrl: null,
                isSystemUser: true,
            },
            body: 'Tu invitación ha sido aceptada.',
            sentAtUtc: '2026-03-15T15:00:00.000Z',
            notification: {
                code: 'system.campaign_invitation_resolved',
                title: 'Invitación resuelta',
                action: {
                    target: 'social.messages',
                    conversationId: 55,
                },
                context: {
                    campaignId: 7,
                },
            },
            announcement: null,
        });
        await service.refreshConversations(true);

        expect(candidates.length).toBe(1);
        expect(candidates[0].source).toBe('message');
    });

    it('agrupa varios message.created en una sola recarga diferida', fakeAsync(() => {
        const listConversations = jasmine.createSpy('listConversations').and.resolveTo({
            items: [],
            unreadUserCount: 0,
            unreadSystemCount: 0,
        });
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations,
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).handleIncomingMessage({
            messageId: 11,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Otra vez',
            sentAtUtc: '2026-03-13T12:00:01.000Z',
            notification: null,
            announcement: null,
        });

        expect(listConversations).not.toHaveBeenCalled();

        tick(249);
        expect(listConversations).not.toHaveBeenCalled();

        tick(1);
        expect(listConversations).toHaveBeenCalledTimes(1);
    }));

    it('cancela la recarga diferida si llega conversation.updated para la conversación pendiente', fakeAsync(() => {
        const listConversations = jasmine.createSpy('listConversations').and.resolveTo({
            items: [],
            unreadUserCount: 0,
            unreadSystemCount: 0,
        });
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations,
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        (service as any).handleIncomingMessage({
            messageId: 10,
            conversationId: 5,
            sender: {
                uid: 'uid-otro',
                displayName: 'Yuna',
                photoThumbUrl: null,
                isSystemUser: false,
            },
            body: 'Hola',
            sentAtUtc: '2026-03-13T12:00:00.000Z',
            notification: null,
            announcement: null,
        });
        (service as any).onSocketMessage({
            type: 'conversation.updated',
            payload: {
                conversationId: 5,
                type: 'direct',
                title: 'Yuna',
                photoThumbUrl: null,
                campaignId: null,
                participantRole: 'member',
                participantStatus: 'active',
                lastMessagePreview: 'Hola',
                lastMessageAtUtc: '2026-03-13T12:00:00.000Z',
                unreadCount: 1,
                canSend: true,
                isSystemConversation: false,
                counterpartUid: 'uid-otro',
                lastMessageNotification: null,
            },
        });

        tick(250);

        expect(listConversations).not.toHaveBeenCalled();
    }));

    it('solo considera focused la conversación activa con la pestaña visible y con foco', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );

        service.setActiveConversationId(5);
        spyOn(document, 'hasFocus').and.returnValue(true);
        const visibilityStateSpy = spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');

        expect(service.isConversationOpen(5)).toBeTrue();
        expect(service.isConversationOpen(6)).toBeFalse();
        expect(service.isConversationFocused(5)).toBeTrue();
        expect(service.isConversationFocused(6)).toBeFalse();

        (document.hasFocus as jasmine.Spy).and.returnValue(false);
        expect(service.isConversationOpen(5)).toBeTrue();
        expect(service.isConversationFocused(5)).toBeFalse();

        (document.hasFocus as jasmine.Spy).and.returnValue(true);
        visibilityStateSpy.and.returnValue('hidden');
        expect(service.isConversationFocused(5)).toBeFalse();
    });

    it('mantiene un único timer de polling de respaldo y lo limpia al cerrar', () => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const setIntervalSpy = spyOn(window, 'setInterval').and.returnValue(123 as any);
        const clearIntervalSpy = spyOn(window, 'clearInterval');

        (service as any).startPolling();
        (service as any).startPolling();
        (service as any).clearPolling();

        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearIntervalSpy).toHaveBeenCalledWith(123);
        expect((service as any).pollingTimer).toBeNull();
    });

    it('no reintenta websocket automaticamente si falta websocketUrl en despliegue no local', fakeAsync(() => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const requestWebSocketTicket = jasmine.createSpy('requestWebSocketTicket').and.resolveTo({
            ticket: 'ticket-publicado',
            websocketUrl: null,
        });
        const buildWebSocketUrl = jasmine.createSpy('buildWebSocketUrl').and.callFake(() => {
            throw new ProfileApiError(
                'El backend no devolvió websocketUrl para el gateway realtime publicado.',
                'CHAT_WS_URL_MISSING',
                500
            );
        });
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                requestWebSocketTicket,
                buildWebSocketUrl,
            } as any,
        );
        const startPollingSpy = spyOn<any>(service, 'startPolling').and.callThrough();
        const scheduleReconnectSpy = spyOn<any>(service, 'scheduleReconnect').and.callThrough();
        const consoleErrorSpy = spyOn(console, 'error');
        spyOn(window, 'setInterval').and.returnValue(123 as any);

        (service as any).activeSessionUid = 'uid-propio';
        (service as any).sessionRunToken = 1;
        (service as any).connectWebSocket('uid-propio', 1);
        tick();

        expect(requestWebSocketTicket).toHaveBeenCalled();
        expect(buildWebSocketUrl).toHaveBeenCalledWith(null, 'ticket-publicado');
        expect(startPollingSpy).toHaveBeenCalled();
        expect(scheduleReconnectSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
    }));

    it('detiene los reintentos websocket automaticos tras errores repetidos de gateway publicado', fakeAsync(() => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            CurrentUserUid: 'uid-propio',
        } as any;
        const requestWebSocketTicket = jasmine.createSpy('requestWebSocketTicket').and.rejectWith(
            new ProfileApiError('Gateway caido.', 'CHAT_GATEWAY_DOWN', 502)
        );
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                requestWebSocketTicket,
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const scheduleReconnectSpy = spyOn<any>(service, 'scheduleReconnect').and.callThrough();
        const clearReconnectSpy = spyOn<any>(service, 'clearReconnect').and.callThrough();
        spyOn(window, 'setTimeout').and.returnValue(123 as any);
        spyOn(window, 'clearTimeout');
        const consoleWarnSpy = spyOn(console, 'warn');

        (service as any).activeSessionUid = 'uid-propio';
        (service as any).sessionRunToken = 1;
        (service as any).connectWebSocket('uid-propio', 1);
        tick();
        expect(scheduleReconnectSpy).toHaveBeenCalledTimes(1);
        expect((service as any).suppressAutomaticRealtimeReconnect).toBeFalse();

        clearReconnectSpy();
        (service as any).activeSessionUid = 'uid-propio';
        (service as any).connectWebSocket('uid-propio', 1);
        tick();

        expect(scheduleReconnectSpy).toHaveBeenCalledTimes(1);
        expect((service as any).suppressAutomaticRealtimeReconnect).toBeTrue();
        expect(consoleWarnSpy).toHaveBeenCalled();
    }));

    it('detiene polling y reconnect cuando ws-ticket responde USAGE_POLICY_ACCEPTANCE_REQUIRED', fakeAsync(() => {
        const userSvc = {
            isLoggedIn$: new BehaviorSubject<boolean>(false),
            currentPrivateProfile$: new BehaviorSubject<any>(null),
            CurrentUserUid: 'uid-propio',
            getAccessRestriction: jasmine.createSpy('getAccessRestriction').and.returnValue(null),
            resolveComplianceRestrictionFromError: jasmine.createSpy('resolveComplianceRestrictionFromError').and.callFake((error: any) =>
                `${error?.code ?? ''}` === 'USAGE_POLICY_ACCEPTANCE_REQUIRED' ? 'mustAcceptUsage' : null
            ),
        } as any;
        const requestWebSocketTicket = jasmine.createSpy('requestWebSocketTicket').and.rejectWith(
            new ProfileApiError('Forbidden', 'USAGE_POLICY_ACCEPTANCE_REQUIRED', 403)
        );
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                requestWebSocketTicket,
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const scheduleReconnectSpy = spyOn<any>(service, 'scheduleReconnect').and.callThrough();
        const clearPollingSpy = spyOn<any>(service, 'clearPolling').and.callThrough();
        spyOn(window, 'setTimeout').and.returnValue(123 as any);

        (service as any).activeSessionUid = 'uid-propio';
        (service as any).sessionRunToken = 1;
        (service as any).connectWebSocket('uid-propio', 1);
        tick();

        expect(requestWebSocketTicket).toHaveBeenCalled();
        expect(scheduleReconnectSpy).not.toHaveBeenCalled();
        expect(clearPollingSpy).toHaveBeenCalled();
        expect((service as any).complianceRealtimeBlocked).toBeTrue();
    }));

    it('reanuda la sesión realtime cuando el perfil deja de requerir usage', fakeAsync(() => {
        const isLoggedIn$ = new BehaviorSubject<boolean>(false);
        const currentPrivateProfile$ = new BehaviorSubject<any>(null);
        let blockedByCompliance = true;
        const userSvc = {
            isLoggedIn$,
            currentPrivateProfile$,
            CurrentUserUid: 'uid-propio',
            getAccessRestriction: jasmine.createSpy('getAccessRestriction').and.callFake(() => blockedByCompliance ? 'mustAcceptUsage' : null),
            resolveComplianceRestrictionFromError: jasmine.createSpy('resolveComplianceRestrictionFromError').and.callFake((error: any) =>
                `${error?.code ?? ''}` === 'USAGE_POLICY_ACCEPTANCE_REQUIRED' ? 'mustAcceptUsage' : null
            ),
        } as any;
        const listConversations = jasmine.createSpy('listConversations').and.resolveTo({
            items: [],
            unreadUserCount: 0,
            unreadSystemCount: 0,
        });
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations,
                requestWebSocketTicket: jasmine.createSpy('requestWebSocketTicket').and.resolveTo({
                    ticket: 'ticket-ok',
                    websocketUrl: 'ws://test/ws/chat',
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const startForCurrentSessionSpy = spyOn<any>(service, 'startForCurrentSession').and.callThrough();
        const connectWebSocketSpy = spyOn<any>(service, 'connectWebSocket').and.resolveTo();

        service.init();
        isLoggedIn$.next(true);
        tick();

        expect(startForCurrentSessionSpy).toHaveBeenCalledTimes(1);
        expect(listConversations).not.toHaveBeenCalled();
        expect(connectWebSocketSpy).not.toHaveBeenCalled();

        blockedByCompliance = false;
        currentPrivateProfile$.next({
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        tick();

        expect(startForCurrentSessionSpy).toHaveBeenCalledTimes(2);
        expect(listConversations).toHaveBeenCalledTimes(1);
        expect(connectWebSocketSpy).toHaveBeenCalledTimes(1);
    }));

    it('no rebootstrapea realtime si isLoggedIn vuelve a emitir true para la misma sesión', fakeAsync(() => {
        const isLoggedIn$ = new BehaviorSubject<boolean>(false);
        const userSvc = {
            isLoggedIn$,
            currentPrivateProfile$: new BehaviorSubject<any>(null),
            CurrentUserUid: 'uid-propio',
            getAccessRestriction: jasmine.createSpy('getAccessRestriction').and.returnValue(null),
            resolveComplianceRestrictionFromError: jasmine.createSpy('resolveComplianceRestrictionFromError').and.returnValue(null),
        } as any;
        const service = new ChatRealtimeService(
            userSvc,
            {
                parseWebSocketEvent: (raw: any) => raw,
                listConversations: jasmine.createSpy('listConversations').and.resolveTo({
                    items: [],
                    unreadUserCount: 0,
                    unreadSystemCount: 0,
                }),
                requestWebSocketTicket: jasmine.createSpy('requestWebSocketTicket').and.resolveTo({
                    ticket: 'ticket-ok',
                    websocketUrl: 'ws://test/ws/chat',
                }),
                buildWebSocketUrl: jasmine.createSpy('buildWebSocketUrl').and.returnValue('ws://test/ws/chat'),
            } as any,
        );
        const startForCurrentSessionSpy = spyOn<any>(service, 'startForCurrentSession').and.callThrough();
        const connectWebSocketSpy = spyOn<any>(service, 'connectWebSocket').and.resolveTo();

        service.init();
        isLoggedIn$.next(true);
        tick();
        isLoggedIn$.next(true);
        tick();

        expect(startForCurrentSessionSpy).toHaveBeenCalledTimes(1);
        expect(connectWebSocketSpy).toHaveBeenCalledTimes(1);
    }));
});
