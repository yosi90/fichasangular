import { of } from 'rxjs';

import { UsuariosApiService } from './usuarios-api.service';

describe('UsuariosApiService', () => {
    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-audit'),
        },
    } as any;

    it('listCreationAuditEvents envía bearer y serializa filtros de auditoría', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                eventId: 'evt-1',
                occurredAtUtc: '2026-03-28T19:00:00Z',
                actionCode: 'campaign.create',
                result: 'created',
                httpStatusCode: 201,
                routeTemplate: '/campanas',
                actor: { userId: 'u1', uid: 'uid-1', displayName: 'Aldric', role: 'master' },
                resource: { type: 'campaign', id: '7', label: 'Campaña A' },
            }],
            total: 1,
            limit: 10,
            offset: 20,
            hasMore: true,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.listCreationAuditEvents({
            actorUid: ' uid-1 ',
            actionCode: 'campaign.create',
            result: 'created',
            resourceType: 'campaign',
            from: '2026-03-01T00:00:00Z',
            to: '2026-03-28T23:59:59Z',
            limit: 10,
            offset: 20,
        });

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/creation-audit');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.params).toEqual({
            actorUid: 'uid-1',
            actionCode: 'campaign.create',
            result: 'created',
            resourceType: 'campaign',
            from: '2026-03-01T00:00:00Z',
            to: '2026-03-28T23:59:59Z',
            limit: '10',
            offset: '20',
        });
        expect(response.total).toBe(1);
        expect(response.limit).toBe(10);
        expect(response.offset).toBe(20);
        expect(response.hasMore).toBeTrue();
    });

    it('getCreationAuditEventDetail usa el eventId codificado y bearer', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            eventId: 'evt/1',
            occurredAtUtc: '2026-03-28T19:00:00Z',
            actionCode: 'character.create',
            result: 'rejected',
            httpStatusCode: 400,
            routeTemplate: '/personajes/add',
            actor: { userId: 'u1', uid: 'uid-1', displayName: 'Aldric', role: 'jugador' },
            resource: { type: 'character', id: null, label: 'PJ fallido' },
            routeParams: {},
            query: {},
            requestBody: { nombre: 'PJ fallido' },
            clientIp: '127.0.0.1',
            userAgent: 'Karma',
            error: { code: 'invalid', message: 'Payload inválido' },
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const detail = await service.getCreationAuditEventDetail('evt/1');

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/creation-audit/evt%2F1');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(detail.error?.message).toBe('Payload inválido');
    });
});
