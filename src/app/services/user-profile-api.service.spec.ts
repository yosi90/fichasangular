import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { createDefaultUserSettings } from '../interfaces/user-settings';
import { ProfileApiError } from '../interfaces/user-account';
import { UserProfileApiService } from './user-profile-api.service';
import { simularTokenApi } from 'src/testing/simular-token-api';

describe('UserProfileApiService', () => {
    beforeEach(() => simularTokenApi('token-settings'));

    const authMock = {
        currentUser: {
            getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-settings'),
        },
    } as any;

    it('createRoleRequest envia Bearer, normaliza el rol y refresca el estado resultante', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of(null));
        httpMock.get.and.returnValue(of({
            currentRole: 'jugador',
            requestedRole: 'master',
            status: 'pending',
            blockedUntilUtc: '',
            requestId: '12',
            requestedAtUtc: '2026-03-11T12:00:00.000Z',
            resolvedAtUtc: '',
            eligible: false,
            reasonCode: '',
            currentRoleAtRequest: 'jugador',
            requestComment: '  Quiero dirigir una campaña propia.  ',
            adminComment: '',
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const status = await service.createRoleRequest('MASTER' as any, '  Quiero dirigir una campaña propia.  ');

        const [, postBody, postOptions] = httpMock.post.calls.argsFor(0);
        expect(postBody).toEqual({
            requestedRole: 'master',
            requestComment: 'Quiero dirigir una campaña propia.',
        });
        expect(postOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        const [, getOptions] = httpMock.get.calls.argsFor(0);
        expect(getOptions.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(status.requestId).toBe(12);
        expect(status.blockedUntilUtc).toBeNull();
        expect(status.requestComment).toBe('Quiero dirigir una campaña propia.');
        expect(status.adminComment).toBeNull();
    });

    it('reportAbuseLock envia Bearer y normaliza la respuesta actor-scoped', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            status: 'banned',
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.reportAbuseLock({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });

        const [url, body, options] = httpMock.post.calls.mostRecent().args;
        expect(url).toContain('/usuarios/me/security/abuse-lock');
        expect(body).toEqual({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });
        expect(options.headers.get('Authorization')).toBe('Bearer token-settings');
        expect(response.status).toBe('banned');
        expect(response.compliance?.banned).toBeTrue();
        expect(response.moderationStatus).toBeNull();
        expect(response.message).toBeNull();
        expect(response.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            code: 'technical_account_restriction_permanent',
            name: 'Restricción permanente de cuenta',
            isPermanent: true,
        }));
        expect(response.blockedUntilUtc).toBeNull();
        expect(response.isPermanent).toBeNull();
        expect(response.restrictedActions).toEqual([]);
    });

    it('reportAbuseLock sintetiza compliance bloqueante cuando backend devuelve shape nuevo sin compliance explícito', async () => {
        const httpMock = jasmine.createSpyObj('HttpClient', ['get', 'put', 'post', 'patch']);
        httpMock.post.and.returnValue(of({
            status: 'blocked',
            moderationStatus: 'blocked',
            message: 'Tu cuenta queda restringida temporalmente hasta que termine la sanción activa.',
            blockedUntilUtc: '2026-03-28T20:00:00.000Z',
            isPermanent: false,
            restrictedActions: ['social.messages', 'social.messages', 'campaigns.manage'],
        }));
        const service = new UserProfileApiService(httpMock, authMock);

        const response = await service.reportAbuseLock({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });

        expect(response.status).toBe('blocked');
        expect(response.moderationStatus).toBe('blocked');
        expect(response.message).toContain('restringida temporalmente');
        expect(response.blockedUntilUtc).toBe('2026-03-28T20:00:00.000Z');
        expect(response.isPermanent).toBeFalse();
        expect(response.restrictedActions).toEqual(['social.messages', 'campaigns.manage']);
        expect(response.activeSanction).toEqual(jasmine.objectContaining({
            kind: 'restriction',
            name: 'Restricción temporal de cuenta',
            endsAtUtc: '2026-03-28T20:00:00.000Z',
            isPermanent: false,
        }));
        expect(response.compliance).toEqual(jasmine.objectContaining({
            banned: true,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: jasmine.objectContaining({
                endsAtUtc: '2026-03-28T20:00:00.000Z',
            }),
        }));
    });

});
