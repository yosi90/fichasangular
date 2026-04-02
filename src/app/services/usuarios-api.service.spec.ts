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

    it('upsertUser no envía el campo legacy banned a POST /usuarios', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        httpMock.post.and.returnValue(of({
            status: 'updated',
            userId: 'uuid-1',
            uid: 'uid-1',
            acl: {
                uid: 'uid-1',
                role: 'jugador',
                admin: false,
                banned: false,
                permissionsCreate: [{ resource: 'personajes', allowed: true }],
            },
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        await service.upsertUser({
            uid: ' uid-1 ',
            displayName: ' Usuario ',
            email: ' user@test.dev ',
            authProvider: 'correo',
            role: 'jugador',
            permissionsCreate: [{ resource: ' personajes ', allowed: true }],
            banned: true,
        } as any);

        const [url, body, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(body).toEqual({
            uid: 'uid-1',
            displayName: 'Usuario',
            email: 'user@test.dev',
            authProvider: 'correo',
            role: 'jugador',
            permissionsCreate: [{ resource: 'personajes', allowed: true }],
        });
        expect(Object.prototype.hasOwnProperty.call(body, 'banned')).toBeFalse();
    });

    it('listModerationCases normaliza etapas, metadata operativa y compat legacy de duración', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                caseId: '9',
                code: 'harassment',
                name: 'Acoso',
                description: 'Insultos y acoso directo.',
                sourceMode: 'manual_admin',
                enabled: false,
                originType: 'admin_custom',
                isDeletable: true,
                isDeleted: false,
                stages: [{
                    stageId: '3',
                    stageIndex: '1',
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
        expect(response[0].description).toContain('acoso');
        expect(response[0].sourceMode).toBe('manual_only');
        expect(response[0].enabled).toBeFalse();
        expect(response[0].originType).toBe('admin_custom');
        expect(response[0].isDeletable).toBeTrue();
        expect(response[0].stages[0].reportThreshold).toBe(2);
        expect(response[0].stages[0].stageId).toBe(3);
        expect(response[0].stages[0].durationMinutes).toBe(10080);
        expect(response[0].stages[0].durationDays).toBe(7);
    });

    it('createModerationCase usa la ruta canónica y serializa etapas en minutos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post']);
        httpMock.post.and.returnValue(of({
            caseId: '21',
            code: ' harassment_manual ',
            name: 'Acoso manual',
            description: 'Caso manual.',
            sourceMode: 'manual_only',
            enabled: true,
            originType: 'admin_custom',
            isDeletable: true,
            isDeleted: false,
            stages: [{
                stageIndex: 0,
                reportThreshold: 1,
                isPermanent: false,
                durationMinutes: 60,
            }],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.createModerationCase({
            code: ' harassment_manual ',
            name: ' Acoso manual ',
            description: ' Caso manual. ',
            sourceMode: 'manual_only',
            enabled: true,
            stages: [{
                stageIndex: 7,
                reportThreshold: 1,
                isPermanent: false,
                durationMinutes: 60,
            }],
        });

        const [url, payload, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/cases');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(payload).toEqual({
            code: 'harassment_manual',
            name: 'Acoso manual',
            description: 'Caso manual.',
            sourceMode: 'manual_only',
            enabled: true,
            stages: [{
                stageIndex: 1,
                reportThreshold: 1,
                isPermanent: false,
                durationMinutes: 60,
            }],
        });
        expect(response.caseId).toBe(21);
        expect(response.stages[0].durationMinutes).toBe(60);
    });

    it('updateModerationCase usa patch y limpia el payload editable', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['patch']);
        httpMock.patch.and.returnValue(of({
            caseId: '9',
            code: 'harassment',
            name: 'Acoso',
            description: 'Descripción actualizada',
            sourceMode: 'technical_signal_auto',
            enabled: false,
            originType: 'admin_custom',
            isDeletable: true,
            isDeleted: false,
            stages: [],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.updateModerationCase(9, {
            code: ' harassment ',
            name: ' Acoso ',
            description: ' Descripción actualizada ',
            sourceMode: 'technical_signal_auto',
            enabled: false,
        });

        const [url, payload, options] = httpMock.patch.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/cases/9');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(payload).toEqual({
            code: 'harassment',
            name: 'Acoso',
            description: 'Descripción actualizada',
            sourceMode: 'technical_signal_auto',
            enabled: false,
        });
        expect(response.enabled).toBeFalse();
        expect(response.sourceMode).toBe('technical_signal_auto');
    });

    it('replaceModerationCaseStages usa put y reindexa las etapas enviadas', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['put']);
        httpMock.put.and.returnValue(of({
            caseId: '9',
            code: 'harassment',
            name: 'Acoso',
            description: 'Caso actualizado',
            sourceMode: 'manual_only',
            enabled: true,
            originType: 'admin_custom',
            isDeletable: true,
            isDeleted: false,
            stages: [{
                stageIndex: '1',
                reportThreshold: '2',
                isPermanent: true,
                durationMinutes: null,
            }],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.replaceModerationCaseStages(9, {
            stages: [{
                stageIndex: 3,
                reportThreshold: 2,
                isPermanent: true,
                durationMinutes: 999,
            }],
        });

        const [url, payload, options] = httpMock.put.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/cases/9/stages');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(payload).toEqual({
            stages: [{
                stageIndex: 1,
                reportThreshold: 2,
                isPermanent: true,
                durationMinutes: null,
            }],
        });
        expect(response.stages[0].isPermanent).toBeTrue();
        expect(response.stages[0].durationMinutes).toBeNull();
    });

    it('createModerationIncident usa la ruta canónica y normaliza respuesta de sanción manual', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        httpMock.post.and.returnValue(of({
            deduped: false,
            incident: {
                incidentId: '55',
                targetUid: 'uid-77',
                caseCode: 'harassment',
                caseName: 'Acoso',
                mode: 'force_sanction',
                result: 'banned',
                userVisibleMessage: 'Se ha aplicado un ban temporal.',
                internalDescription: 'Insultos reiterados.',
            },
            stage: {
                stageIndex: '1',
                reportThreshold: '1',
                sanctionKind: 'ban',
                sanctionName: 'Ban temporal',
                durationDays: '7',
            },
            sanction: {
                sanctionId: '18',
                kind: 'ban',
                name: 'Ban temporal',
                endsAtUtc: '2026-04-09T10:00:00Z',
            },
            activeSanction: {
                sanctionId: '18',
                kind: 'ban',
                name: 'Ban temporal',
                endsAtUtc: '2026-04-09T10:00:00Z',
            },
            progress: {
                caseId: '9',
                caseCode: 'harassment',
                name: 'Acoso',
                currentStageIndex: '1',
                pendingReportCount: '0',
                completedStageCount: '1',
            },
            banned: true,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.createModerationIncident({
            targetUid: ' uid-77 ',
            caseCode: ' harassment ',
            mode: 'force_sanction',
            internalDescription: ' Insultos reiterados. ',
            userVisibleMessage: ' Se ha aplicado un ban temporal. ',
            sanctionOverride: {
                endsAtUtc: '2026-04-09T10:00:00Z',
            },
        });

        const [url, payload, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/incidents');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(payload).toEqual({
            targetUid: 'uid-77',
            caseCode: 'harassment',
            mode: 'force_sanction',
            sourceCode: 'manual_admin',
            internalDescription: 'Insultos reiterados.',
            userVisibleMessage: 'Se ha aplicado un ban temporal.',
            sanctionOverride: {
                endsAtUtc: '2026-04-09T10:00:00Z',
            },
        });
        expect(response.incident.incidentId).toBe(55);
        expect(response.stage?.durationDays).toBe(7);
        expect(response.activeSanction?.sanctionId).toBe(18);
        expect(response.progress?.completedStageCount).toBe(1);
        expect(response.banned).toBeTrue();
    });

    it('createModerationIncident preserva el flag isPermanent devuelto por backend', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'post']);
        httpMock.post.and.returnValue(of({
            deduped: false,
            incident: {
                incidentId: '56',
                targetUid: 'uid-77',
                caseCode: 'admin_manual_account_ban',
                caseName: 'Ban manual admin',
                mode: 'force_sanction',
                result: 'banned',
                userVisibleMessage: 'Se ha aplicado un ban temporal.',
            },
            sanction: {
                sanctionId: '19',
                kind: 'ban',
                name: 'Ban manual admin',
                isPermanent: true,
                endsAtUtc: '2026-04-02T10:11:00Z',
            },
            activeSanction: {
                sanctionId: '19',
                kind: 'ban',
                name: 'Ban manual admin',
                isPermanent: true,
                endsAtUtc: '2026-04-02T10:11:00Z',
            },
            progress: null,
            banned: true,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.createModerationIncident({
            targetUid: 'uid-77',
            caseCode: 'admin_manual_account_ban',
            mode: 'force_sanction',
            internalDescription: 'Pruebas',
            userVisibleMessage: 'Ban temporal',
            sanctionOverride: {
                endsAtUtc: '2026-04-02T10:11:00Z',
            },
        });

        expect(response.sanction?.isPermanent).toBeTrue();
        expect(response.activeSanction?.isPermanent).toBeTrue();
        expect(response.activeSanction?.endsAtUtc).toBe('2026-04-02T10:11:00Z');
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
