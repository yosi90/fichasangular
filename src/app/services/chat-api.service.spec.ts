import { of } from 'rxjs';
import { ChatApiService } from './chat-api.service';
import { environment } from 'src/environments/environment';

describe('ChatApiService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-chat'),
        },
    } as any;

    it('getConversationDetail normaliza participants y envia Bearer', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        httpMock.get.and.returnValue(of({
            conversationId: '8',
            type: 'campaign',
            title: ' Caballeros de Cormyr ',
            photoThumbUrl: null,
            campaignId: '12',
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: ' Hola ',
            lastMessageAtUtc: '2026-03-13T12:00:00.000Z',
            lastMessageNotification: {
                code: 'system.role_request_resolved',
                title: ' Tu solicitud fue aprobada ',
                action: {
                    target: 'social.messages',
                    conversationId: '8',
                },
                context: {
                    status: 'approved',
                },
            },
            unreadCount: '2',
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            participants: [
                {
                    uid: 'uid-master',
                    displayName: ' MrYosi90 ',
                    photoThumbUrl: ' master.webp ',
                    isSystemUser: false,
                    participantRole: 'admin',
                    participantStatus: 'active',
                    joinedAtUtc: '2026-03-01T00:00:00.000Z',
                    leftAtUtc: null,
                },
            ],
        }));
        const service = new ChatApiService(httpMock, authMock);

        const detail = await service.getConversationDetail(8);

        expect(detail.title).toBe('Caballeros de Cormyr');
        expect(detail.campaignId).toBe(12);
        expect(detail.unreadCount).toBe(2);
        expect(detail.lastMessageNotification).toEqual({
            code: 'system.role_request_resolved',
            title: 'Tu solicitud fue aprobada',
            action: {
                target: 'social.messages',
                conversationId: 8,
            },
            context: {
                status: 'approved',
            },
        });
        expect(detail.participants).toEqual([
            {
                uid: 'uid-master',
                displayName: 'MrYosi90',
                photoThumbUrl: 'master.webp',
                isSystemUser: false,
                participantRole: 'admin',
                participantStatus: 'active',
                joinedAtUtc: '2026-03-01T00:00:00.000Z',
                leftAtUtc: null,
            },
        ]);
        const [, options] = httpMock.get.calls.mostRecent().args;
        expect(options.headers.get('Authorization')).toBe('Bearer token-chat');
    });

    it('parseWebSocketEvent preserva notification y announcement en message.created', () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        const service = new ChatApiService(httpMock, authMock);

        const parsed = service.parseWebSocketEvent({
            type: 'message.created',
            payload: {
                messageId: 14,
                conversationId: 9,
                sender: {
                    uid: 'system:yosiftware',
                    displayName: 'Yosiftware',
                    photoThumbUrl: null,
                    isSystemUser: true,
                },
                body: 'Tu solicitud ha sido aprobada.',
                sentAtUtc: '2026-03-13T12:00:00.000Z',
                notification: {
                    code: 'system.role_request_resolved',
                    title: 'Tu solicitud ha sido aprobada',
                    action: {
                        target: 'social.messages',
                        conversationId: 9,
                    },
                    context: {
                        requestedRole: 'master',
                    },
                },
                announcement: {
                    code: 'chat.new_chat',
                    title: 'Nuevo chat',
                    action: {
                        target: 'social.messages',
                        conversationId: 9,
                    },
                    context: {
                        conversationId: 9,
                    },
                },
            },
        });

        expect(parsed?.type).toBe('message.created');
        if (!parsed || parsed.type !== 'message.created')
            fail('Se esperaba un frame message.created válido.');
        const payload = (parsed as any).payload;
        expect(payload.notification?.action?.conversationId).toBe(9);
        expect(payload.announcement?.code).toBe('chat.new_chat');
    });

    it('ensureCampaignConversation usa el endpoint de campaña y normaliza el detalle', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        httpMock.get.and.returnValue(of({
            conversationId: '33',
            type: 'campaign',
            title: ' Costa de la Espada ',
            photoThumbUrl: null,
            campaignId: '7',
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: '0',
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        }));
        const service = new ChatApiService(httpMock, authMock);

        const detail = await service.ensureCampaignConversation(7);

        expect(detail.conversationId).toBe(33);
        expect(detail.type).toBe('campaign');
        expect(detail.campaignId).toBe(7);
        expect(httpMock.get.calls.mostRecent().args[0]).toContain('/chat/campaigns/7');
    });

    it('createGroup normaliza el payload y deduplica participantes', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        httpMock.post.and.returnValue(of({
            conversationId: 44,
            type: 'group',
            title: 'Grupo de prueba',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        }));
        const service = new ChatApiService(httpMock, authMock);

        const detail = await service.createGroup(' Grupo de prueba ', ['uid-2', 'uid-2', ' uid-3 ']);

        expect(detail.type).toBe('group');
        expect(httpMock.post.calls.mostRecent().args[1]).toEqual({
            title: 'Grupo de prueba',
            participantUids: ['uid-2', 'uid-3'],
        });
    });

    it('renameGroup, addGroupParticipant y removeGroupParticipant usan sus endpoints específicos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        const response = of({
            conversationId: 55,
            type: 'group',
            title: 'Grupo renombrado',
            photoThumbUrl: null,
            campaignId: null,
            participantRole: 'admin',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        });
        httpMock.patch.and.returnValue(response);
        httpMock.post.and.returnValue(response);
        httpMock.delete.and.returnValue(response);
        const service = new ChatApiService(httpMock, authMock);

        await service.renameGroup(55, ' Grupo renombrado ');
        await service.addGroupParticipant(55, 'uid-4');
        await service.removeGroupParticipant(55, 'uid-4');

        expect(httpMock.patch.calls.mostRecent().args[0]).toContain('/chat/conversations/groups/55');
        expect(httpMock.patch.calls.mostRecent().args[1]).toEqual({ title: 'Grupo renombrado' });
        expect(httpMock.post.calls.mostRecent().args[0]).toContain('/chat/conversations/groups/55/participants');
        expect(httpMock.post.calls.mostRecent().args[1]).toEqual({ targetUid: 'uid-4' });
        expect(httpMock.delete.calls.mostRecent().args[0]).toContain('/chat/conversations/groups/55/participants/uid-4');
    });

    it('buildWebSocketUrl usa la base real de la API y normaliza localhost a 127.0.0.1 en local', () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        const service = new ChatApiService(httpMock, authMock);
        const originalApiUrl = environment.apiUrl;

        environment.apiUrl = 'http://localhost:5000/';
        const url = service.buildWebSocketUrl(null, 'ticket de prueba');

        expect(url).toBe('ws://127.0.0.1:5000/ws/chat?ticket=ticket%20de%20prueba');

        environment.apiUrl = originalApiUrl;
    });

    it('requestWebSocketTicket envia Bearer y normaliza la respuesta', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        httpMock.post.and.returnValue(of({
            ticket: ' ticket-123 ',
            expiresAtUtc: '2026-03-15T10:00:00.000Z',
            websocketUrl: 'ws://localhost:8001/ws/chat',
        }));
        const service = new ChatApiService(httpMock, authMock);

        const response = await service.requestWebSocketTicket();

        expect(response).toEqual({
            ticket: 'ticket-123',
            expiresAtUtc: '2026-03-15T10:00:00.000Z',
            websocketUrl: 'ws://localhost:8001/ws/chat',
        });
        const [, body, options] = httpMock.post.calls.mostRecent().args;
        expect(body).toEqual({});
        expect(options.headers.get('Authorization')).toBe('Bearer token-chat');
    });
});
