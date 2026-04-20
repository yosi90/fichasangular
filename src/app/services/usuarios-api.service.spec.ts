import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import * as FileSaver from 'file-saver';
import { of, throwError } from 'rxjs';

import { UsuariosApiService } from './usuarios-api.service';

class FormDataMock {
    readonly entries: { name: string; value: any; filename?: string; }[] = [];

    append(name: string, value: any, filename?: string): void {
        const entry: { name: string; value: any; filename?: string; } = { name, value };
        if (filename !== undefined)
            entry.filename = filename;
        this.entries.push(entry);
    }
}

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
            moderationStatus: 'blocked',
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
        expect(response.moderationStatus).toBe('blocked');
        expect(response.banned).toBeTrue();
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

    it('updateAdminPolicyDraft usa la ruta canónica y normaliza el borrador actualizado', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['put']);
        httpMock.put.and.returnValue(of({
            kind: 'usage',
            title: 'Normas de uso',
            markdown: '# Uso\n\nRespeta a la comunidad.',
            version: 'usage-draft',
            updatedAtUtc: '2026-04-02T11:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.updateAdminPolicyDraft('usage', {
            title: ' Normas de uso ',
            markdown: ' # Uso\n\nRespeta a la comunidad. ',
        });

        const [url, payload, options] = httpMock.put.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/policies/usage/draft');
        expect(payload).toEqual({
            title: 'Normas de uso',
            markdown: '# Uso\n\nRespeta a la comunidad.',
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response.kind).toBe('usage');
        expect(response.markdown).toContain('Respeta');
    });

    it('publishAdminPolicy usa la ruta canónica y normaliza la política activa', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post']);
        httpMock.post.and.returnValue(of({
            policy: {
                kind: 'creation',
                title: 'Normas de creación',
                markdown: '# Crear\n\nSin abuso.',
                version: 'creation-v4',
                publishedAtUtc: '2026-04-03T09:00:00Z',
            },
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.publishAdminPolicy('creation');

        const [url, payload, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/policies/creation/publish');
        expect(payload).toEqual({});
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response.kind).toBe('creation');
        expect(response.version).toBe('creation-v4');
    });

    it('createBugReport compone FormData multipart con imágenes y bearer', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post']);
        httpMock.post.and.returnValue(of({
            id: 12,
            kind: 'bug',
            status: 'submitted',
            priority: null,
            title: 'Chat roto',
            description: 'No abre.',
            pageUrl: '/social',
            details: {
                stepsToReproduce: 'Entrar',
                expectedBehavior: 'Abrir',
                actualBehavior: 'Nada',
            },
            attachments: [],
            updates: [],
            createdAtUtc: '2026-04-02T10:00:00Z',
            updatedAtUtc: '2026-04-02T10:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);
        const originalFormData = (window as any).FormData;
        (window as any).FormData = FormDataMock as any;

        try {
            const image = new File(['bug'], 'captura.png', { type: 'image/png' });
            const response = await service.createBugReport({
                title: ' Chat roto ',
                description: ' No abre. ',
                pageUrl: ' /social ',
                stepsToReproduce: ' Entrar ',
                expectedBehavior: ' Abrir ',
                actualBehavior: ' Nada ',
                images: [image],
            });

            const [url, body, options] = httpMock.post.calls.mostRecent().args;
            expect(url).toContain('/usuarios/me/bug-reports');
            expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
            expect(body instanceof FormDataMock).toBeTrue();
            expect((body as FormDataMock).entries).toEqual([
                { name: 'description', value: 'No abre.' },
                { name: 'title', value: 'Chat roto' },
                { name: 'pageUrl', value: '/social' },
                { name: 'stepsToReproduce', value: 'Entrar' },
                { name: 'expectedBehavior', value: 'Abrir' },
                { name: 'actualBehavior', value: 'Nada' },
                { name: 'images[]', value: image, filename: 'captura.png' },
            ]);
            expect(response.kind).toBe('bug');
            expect(response.details.actualBehavior).toBe('Nada');
        } finally {
            (window as any).FormData = originalFormData;
        }
    });

    it('createFeatureRequest compone FormData multipart para peticiones de funcionalidad', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['post']);
        httpMock.post.and.returnValue(of({
            id: 15,
            kind: 'feature',
            status: 'submitted',
            priority: null,
            title: 'Modo campaña',
            description: 'Quiero una portada.',
            pageUrl: '/campanas',
            details: {
                useCase: 'Preparar sesión',
                desiredOutcome: 'Tener una portada compartible',
            },
            attachments: [],
            updates: [],
            createdAtUtc: '2026-04-02T11:00:00Z',
            updatedAtUtc: '2026-04-02T11:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);
        const originalFormData = (window as any).FormData;
        (window as any).FormData = FormDataMock as any;

        try {
            await service.createFeatureRequest({
                title: ' Modo campaña ',
                description: ' Quiero una portada. ',
                pageUrl: ' /campanas ',
                useCase: ' Preparar sesión ',
                desiredOutcome: ' Tener una portada compartible ',
                images: [],
            });

            const [url, body, options] = httpMock.post.calls.mostRecent().args;
            expect(url).toContain('/usuarios/me/feature-requests');
            expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
            expect((body as FormDataMock).entries).toEqual([
                { name: 'description', value: 'Quiero una portada.' },
                { name: 'title', value: 'Modo campaña' },
                { name: 'pageUrl', value: '/campanas' },
                { name: 'useCase', value: 'Preparar sesión' },
                { name: 'desiredOutcome', value: 'Tener una portada compartible' },
            ]);
        } finally {
            (window as any).FormData = originalFormData;
        }
    });

    it('listMyBugReports usa bearer y normaliza la paginación', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                id: '12',
                kind: 'bug',
                status: 'triaged',
                priority: 'high',
                title: 'Chat roto',
                description: 'No abre.',
                pageUrl: '/social',
                details: {
                    stepsToReproduce: 'Entrar',
                },
                createdAtUtc: '2026-04-02T10:00:00Z',
                updatedAtUtc: '2026-04-02T10:10:00Z',
            }],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.listMyBugReports();

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/bug-reports');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.params).toEqual({ limit: '25', offset: '0' });
        expect(response.items[0].id).toBe(12);
        expect(response.items[0].status).toBe('triaged');
        expect(response.items[0].priority).toBe('high');
        expect(response.hasMore).toBeFalse();
    });

    it('getMyFeatureRequest normaliza detalle privado con adjuntos y timeline', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            id: 18,
            kind: 'feature',
            status: 'planned',
            priority: 'medium',
            title: 'Ficha imprimible',
            description: 'Quiero imprimirla mejor.',
            pageUrl: '/personajes',
            details: {
                useCase: 'Llevarla a mesa',
                desiredOutcome: 'Impresión clara',
            },
            attachments: [{
                id: 91,
                filename: 'mockup.webp',
                mimeType: 'image/webp',
                sizeBytes: 12345,
                createdAtUtc: '2026-04-02T10:30:00Z',
                url: '/usuarios/feedback/attachments/91',
            }],
            updates: [{
                status: 'planned',
                publicMessage: 'Lo hemos apuntado.',
                createdAtUtc: '2026-04-02T11:00:00Z',
            }],
            createdAtUtc: '2026-04-02T10:00:00Z',
            updatedAtUtc: '2026-04-02T11:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getMyFeatureRequest(18);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/feature-requests/18');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response.attachments[0].id).toBe(91);
        expect(response.attachments[0].filename).toBe('mockup.webp');
        expect(response.updates[0].status).toBe('planned');
        expect(response.details.desiredOutcome).toBe('Impresión clara');
    });

    it('listPublicFeatureRequests usa la ruta pública sin Authorization', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                id: 32,
                kind: 'feature',
                status: 'submitted',
                priority: null,
                title: 'Dashboard',
                description: 'Un tablero de actividad.',
                pageUrl: '/social',
                details: {
                    useCase: 'Ver resumen',
                    desiredOutcome: 'Acceder más rápido',
                },
                createdAtUtc: '2026-04-02T12:00:00Z',
                updatedAtUtc: '2026-04-02T12:00:00Z',
            }],
            total: 1,
            limit: 10,
            offset: 20,
            hasMore: true,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.listPublicFeatureRequests(10, 20);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/feature-requests/public');
        expect(options.headers).toBeUndefined();
        expect(options.params).toEqual({ limit: '10', offset: '20' });
        expect(response.items[0].kind).toBe('feature');
        expect(response.offset).toBe(20);
        expect(response.hasMore).toBeTrue();
    });

    it('getFeedbackSubscriptionStates usa bearer, normaliza IDs y estados', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [
                { submissionId: '12', subscribed: true, canSubscribe: true },
                { id: 13, subscribed: false, canSubscribe: true },
                { submissionId: 0, subscribed: true, canSubscribe: true },
            ],
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getFeedbackSubscriptionStates([12, 13, 12, -1, Number.NaN]);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/feedback/submissions/subscriptions');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.params).toEqual({ ids: '12,13' });
        expect(response.items).toEqual([
            { submissionId: 12, subscribed: true, canSubscribe: true },
            { submissionId: 13, subscribed: false, canSubscribe: true },
        ]);
    });

    it('setFeedbackSubscription actualiza seguimiento con bearer', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['put']);
        httpMock.put.and.returnValue(of({ submissionId: 12, subscribed: false }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.setFeedbackSubscription(12, false);

        const [url, body, options] = httpMock.put.calls.mostRecent().args;
        expect(url).toContain('/usuarios/feedback/submissions/12/subscription');
        expect(body).toEqual({ subscribed: false });
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response).toEqual({ submissionId: 12, subscribed: false });
    });

    it('setFeedbackSubscription conserva status funcional en errores 403', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['put']);
        httpMock.put.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 403,
            error: { message: 'Sin permisos para seguir este feedback' },
        })));
        const service = new UsuariosApiService(httpMock, authMock);

        await expectAsync(service.setFeedbackSubscription(12, true)).toBeRejectedWith(jasmine.objectContaining({
            message: 'Sin permisos para seguir este feedback',
            status: 403,
            code: 'FORBIDDEN',
        }));
    });

    it('downloadFeedbackAttachment descarga el blob autenticado con nombre resuelto', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        const saveAsSpy = spyOn(FileSaver, 'saveAs');
        const blob = new Blob(['img'], { type: 'image/webp' });
        httpMock.get.and.returnValue(of(new HttpResponse({
            body: blob,
            status: 200,
            headers: new HttpHeaders(),
        })));
        const service = new UsuariosApiService(httpMock, authMock);

        const filename = await service.downloadFeedbackAttachment(91, 'mockup.webp');

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/feedback/attachments/91');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.observe).toBe('response');
        expect(options.responseType).toBe('blob');
        expect(saveAsSpy).toHaveBeenCalledWith(blob, 'mockup.webp');
        expect(filename).toBe('mockup.webp');
    });

    it('listAdminFeedbackSubmissions envía filtros admin y normaliza reporter', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            items: [{
                id: 77,
                kind: 'bug',
                status: 'submitted',
                priority: 'critical',
                title: 'Menú roto',
                description: 'No cierra.',
                pageUrl: '/perfil',
                details: {
                    stepsToReproduce: 'Abrir menú',
                    expectedBehavior: 'Cerrar anterior',
                    actualBehavior: 'Queda abierto',
                },
                reporter: {
                    userId: 'user-77',
                    uid: 'uid-77',
                    displayName: 'Yosi',
                },
                createdAtUtc: '2026-04-19T10:00:00Z',
                updatedAtUtc: '2026-04-19T10:30:00Z',
            }],
            total: 3,
            limit: 25,
            offset: 50,
            hasMore: false,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.listAdminFeedbackSubmissions({
            kind: 'bug',
            status: 'submitted',
            reporterUid: ' uid-77 ',
            limit: 25,
            offset: 50,
        });

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/feedback/submissions');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.params).toEqual({
            kind: 'bug',
            status: 'submitted',
            reporterUid: 'uid-77',
            limit: '25',
            offset: '50',
        });
        expect(response.items[0].reporter.uid).toBe('uid-77');
        expect(response.items[0].priority).toBe('critical');
        expect(response.total).toBe(3);
    });

    it('getAdminFeedbackSubmission normaliza timeline admin y adjuntos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        httpMock.get.and.returnValue(of({
            id: 77,
            kind: 'bug',
            status: 'triaged',
            priority: 'high',
            title: 'Menú roto',
            description: 'No cierra.',
            pageUrl: '/perfil',
            details: {
                stepsToReproduce: 'Abrir menú',
                expectedBehavior: 'Cerrar anterior',
                actualBehavior: 'Queda abierto',
            },
            reporter: {
                userId: 'user-77',
                uid: 'uid-77',
                displayName: 'Yosi',
            },
            attachments: [{
                id: 91,
                filename: 'captura.webp',
                mimeType: 'image/webp',
                sizeBytes: 4096,
                createdAtUtc: '2026-04-19T10:05:00Z',
                url: '/usuarios/feedback/attachments/91',
            }],
            updates: [{
                status: 'triaged',
                publicMessage: 'Lo estamos revisando.',
                internalComment: 'Reproducido en local.',
                createdAtUtc: '2026-04-19T10:30:00Z',
                actor: {
                    userId: 'admin-1',
                    uid: 'admin-uid',
                    displayName: 'Admin',
                },
            }],
            createdAtUtc: '2026-04-19T10:00:00Z',
            updatedAtUtc: '2026-04-19T10:30:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.getAdminFeedbackSubmission(77);

        const [url, options] = httpMock.get.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/feedback/submissions/77');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(response.reporter.displayName).toBe('Yosi');
        expect(response.attachments[0].filename).toBe('captura.webp');
        expect(response.updates[0].internalComment).toBe('Reproducido en local.');
        expect(response.updates[0].actor.uid).toBe('admin-uid');
    });

    it('updateAdminFeedbackSubmission envía patch admin normalizado', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['patch']);
        httpMock.patch.and.returnValue(of({
            id: 77,
            kind: 'bug',
            status: 'closed',
            priority: null,
            title: 'Menú roto',
            description: 'No cierra.',
            pageUrl: '/perfil',
            details: {},
            reporter: {
                userId: 'user-77',
                uid: 'uid-77',
                displayName: 'Yosi',
            },
            attachments: [],
            updates: [],
            createdAtUtc: '2026-04-19T10:00:00Z',
            updatedAtUtc: '2026-04-19T11:00:00Z',
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.updateAdminFeedbackSubmission(77, {
            status: 'closed',
            priority: null,
            internalComment: ' Cerrado por duplicado. ',
            publicMessage: ' Lo cerramos por duplicado. ',
        });

        const [url, body, options] = httpMock.patch.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/feedback/submissions/77');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(body).toEqual({
            status: 'closed',
            priority: null,
            internalComment: 'Cerrado por duplicado.',
            publicMessage: 'Lo cerramos por duplicado.',
        });
        expect(response.status).toBe('closed');
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

    it('revokeModerationSanction usa la ruta propuesta y sanea el payload opcional', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['delete']);
        httpMock.delete.and.returnValue(of({
            revoked: true,
            sanction: {
                sanctionId: '19',
                kind: 'ban',
                name: 'Ban manual admin',
                startsAtUtc: '2026-04-02T09:00:00Z',
                endsAtUtc: '2026-04-09T09:00:00Z',
                isPermanent: false,
            },
            activeSanction: null,
            banned: false,
        }));
        const service = new UsuariosApiService(httpMock, authMock);

        const response = await service.revokeModerationSanction('uid-19', {
            adminComment: ' Revisado por admin. ',
            userVisibleMessage: ' Se ha retirado la restricción. ',
        });

        const [url, options] = httpMock.delete.calls.mostRecent().args;
        expect(url).toContain('/usuarios/admin/moderation/users/uid-19/sanctions');
        expect(options.headers.get('Authorization')).toBe('Bearer token-audit');
        expect(options.body).toEqual({
            adminComment: 'Revisado por admin.',
            userVisibleMessage: 'Se ha retirado la restricción.',
        });
        expect(response.revoked).toBeTrue();
        expect(response.sanction?.sanctionId).toBe(19);
        expect(response.activeSanction).toBeNull();
        expect(response.banned).toBeFalse();
    });

    it('revokeModerationSanction rechaza ids inválidos', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['delete']);
        const service = new UsuariosApiService(httpMock, authMock);

        await expectAsync(service.revokeModerationSanction('')).toBeRejectedWithError('UID inválido');
        expect(httpMock.delete).not.toHaveBeenCalled();
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
