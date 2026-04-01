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

    it('getAclByUid envia historyLimit y normaliza moderationSummary', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            userId: 'uuid-1',
            uid: 'uid-1',
            displayName: 'Aldric',
            email: 'aldric@test.dev',
            authProvider: 'correo',
            role: 'jugador',
            admin: false,
            banned: false,
            permissionsCreate: [{ resource: 'personajes', allowed: true }],
            moderationSummary: {
                incidentCount: '3',
                sanctionCount: '1',
                lastIncidentAtUtc: '2026-04-01T10:00:00Z',
                lastSanctionAtUtc: '2026-04-01T10:00:00Z',
                activeSanction: {
                    sanctionId: '17',
                    kind: 'temporary',
                    name: 'Cooldown',
                    endsAtUtc: '2026-04-08T10:00:00Z',
                    isPermanent: false,
                },
            },
            recentModerationHistory: [{
                incidentId: '44',
                caseCode: 'harassment',
                caseName: 'Acoso',
                result: 'reported',
                userVisibleMessage: 'Se ha confirmado una incidencia.',
            }],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getAclByUid('uid-1', 7);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/acl/uid-1');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.params).toEqual({ historyLimit: '7' });
        expect(response.moderationSummary?.incidentCount).toBe(3);
        expect(response.moderationSummary?.activeSanction?.sanctionId).toBe(17);
        expect(response.recentModerationHistory?.[0].incidentId).toBe(44);
    });

    it('getAdminPolicyDraft usa la ruta canónica y normaliza el borrador', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            kind: 'creation',
            title: 'Normas de creación',
            markdown: '# Reglas\n\nSin spam.',
            version: 'creation-v3',
            publishedAtUtc: '2026-04-01T09:00:00Z',
            updatedAtUtc: '2026-04-01T11:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getAdminPolicyDraft('creation');

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/policies/creation/draft');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response.kind).toBe('creation');
        expect(response.version).toBe('creation-v3');
        expect(response.markdown).toContain('Sin spam');
    });

    it('listModerationCases normaliza etapas y soporta payload paginado', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                caseId: '9',
                code: 'harassment',
                name: 'Acoso',
                sourceMode: 'manual_admin',
                stages: [{
                    stageIndex: '0',
                    reportThreshold: '2',
                    sanctionKind: 'temporary',
                    sanctionName: 'Silencio temporal',
                    durationDays: '7',
                }],
            }],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.listModerationCases(true);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/cases');
        expect(options.params).toEqual({ includeDeleted: 'true' });
        expect(response.length).toBe(1);
        expect(response[0].caseId).toBe(9);
        expect(response[0].stages[0].reportThreshold).toBe(2);
        expect(response[0].stages[0].durationDays).toBe(7);
    });

    it('getUserModerationHistory usa paginación y conserva campos privados admin-only', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            uid: 'uid-77',
            displayName: 'Usuario Moderado',
            banned: true,
            moderationSummary: {
                incidentCount: 5,
                sanctionCount: 2,
            },
            progressByCase: [{
                caseId: '9',
                caseCode: 'harassment',
                caseName: 'Acoso',
                currentStageIndex: '1',
                pendingReports: '0',
            }],
            items: [{
                incidentId: '44',
                caseId: '9',
                caseCode: 'harassment',
                caseName: 'Acoso',
                mode: 'force_sanction',
                result: 'sanctioned',
                confirmedAtUtc: '2026-04-01T10:00:00Z',
                userVisibleMessage: 'Se ha aplicado una sanción.',
                internalDescription: 'Insultos reiterados.',
                clientDate: '2026-04-01',
                localBlockCountToday: '3',
                triggeredStageIndex: '1',
                triggeredSanctionId: '17',
                progressBefore: { pendingReports: 2 },
                progressAfter: { pendingReports: 0 },
            }],
            total: 11,
            limit: 10,
            offset: 20,
            hasMore: false,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getUserModerationHistory('uid-77', 10, 20);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/users/uid-77/history');
        expect(options.params).toEqual({ limit: '10', offset: '20' });
        expect(response.uid).toBe('uid-77');
        expect(response.moderationSummary?.incidentCount).toBe(5);
        expect(response.progressByCase[0].currentStageIndex).toBe(1);
        expect(response.items[0].internalDescription).toBe('Insultos reiterados.');
        expect(response.items[0].triggeredSanctionId).toBe(17);
        expect(response.total).toBe(11);
        expect(response.offset).toBe(20);
    });
});
