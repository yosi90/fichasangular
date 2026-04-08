import { TestBed } from '@angular/core/testing';

import { ApiActionGuardService } from './api-action-guard.service';
import { UserProfileApiService } from './user-profile-api.service';
import { UserService } from './user.service';

describe('ApiActionGuardService', () => {
    let service: ApiActionGuardService;
    let userProfileApiSvc: jasmine.SpyObj<UserProfileApiService>;
    let userSvc: jasmine.SpyObj<UserService>;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date('2026-03-28T10:00:00.000Z'));
        userProfileApiSvc = jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', ['reportAbuseLock']);
        userSvc = jasmine.createSpyObj<UserService>('UserService', ['setCurrentCompliance', 'refreshCurrentPrivateProfile']);
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(null);
        userProfileApiSvc.reportAbuseLock.and.resolveTo({
            status: 'ignored',
            moderationStatus: null,
            message: null,
            activeSanction: null,
            blockedUntilUtc: null,
            isPermanent: null,
            restrictedActions: [],
            compliance: null,
        } as any);
        TestBed.configureTestingModule({
            providers: [
                { provide: UserProfileApiService, useValue: userProfileApiSvc },
                { provide: UserService, useValue: userSvc },
            ],
        });
        service = TestBed.inject(ApiActionGuardService);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('permite siempre la acción y reporta abuse-lock al superar el umbral rápido', async () => {
        const decisions = Array.from({ length: 6 }, () => service.shouldAllow('uid-1', 'campaign.create'));
        await Promise.resolve();

        expect(decisions.every((item) => item.status === 'allowed')).toBeTrue();
        expect(decisions[5].newlyBlocked).toBeTrue();
        expect(decisions[5].blocksToday).toBe(1);
        expect(userProfileApiSvc.reportAbuseLock).toHaveBeenCalledWith({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 1,
            source: 'web',
        });
    });

    it('no vuelve a reportar mientras no se produzca un nuevo umbral', async () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');
        await Promise.resolve();

        service.shouldAllow('uid-1', 'campaign.create');
        await Promise.resolve();

        expect(userProfileApiSvc.reportAbuseLock.calls.count()).toBe(1);
    });

    it('puede reportar varios abuse-lock en el mismo día si el spam se repite por ráfagas', async () => {
        for (let burst = 0; burst < 2; burst += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${burst}`);
            await Promise.resolve();
        }

        expect(userProfileApiSvc.reportAbuseLock.calls.count()).toBe(2);
        expect(userProfileApiSvc.reportAbuseLock.calls.argsFor(1)[0]).toEqual({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 2,
            source: 'web',
        });
    });

    it('aplica el compliance devuelto por abuse-lock solo cuando backend confirma restricción real', async () => {
        userProfileApiSvc.reportAbuseLock.and.resolveTo({
            status: 'blocked',
            moderationStatus: 'blocked',
            message: 'Tu cuenta queda restringida temporalmente hasta que termine la sanción activa.',
            blockedUntilUtc: '2026-03-28T20:00:00.000Z',
            isPermanent: false,
            restrictedActions: ['social.messages'],
            activeSanction: {
                sanctionId: 77,
                kind: 'restriction',
                code: 'technical_account_restriction_temporary',
                name: 'Restricción temporal de cuenta',
                startsAtUtc: '2026-03-28T10:00:00.000Z',
                endsAtUtc: '2026-03-28T20:00:00.000Z',
                isPermanent: false,
            },
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 77,
                    kind: 'restriction',
                    code: 'technical_account_restriction_temporary',
                    name: 'Restricción temporal de cuenta',
                    startsAtUtc: '2026-03-28T10:00:00.000Z',
                    endsAtUtc: '2026-03-28T20:00:00.000Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        } as any);

        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');
        await Promise.resolve();

        expect(userSvc.setCurrentCompliance).toHaveBeenCalledWith(jasmine.objectContaining({
            banned: true,
            activeSanction: jasmine.objectContaining({
                sanctionId: 77,
                endsAtUtc: '2026-03-28T20:00:00.000Z',
            }),
        }));
        expect(userSvc.refreshCurrentPrivateProfile).toHaveBeenCalled();
    });

    it('no inventa una sanción local cuando backend responde ignored', async () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');
        await Promise.resolve();

        expect(userSvc.setCurrentCompliance).not.toHaveBeenCalled();
        expect(userSvc.refreshCurrentPrivateProfile).toHaveBeenCalled();
    });
});
