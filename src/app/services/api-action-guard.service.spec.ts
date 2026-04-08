import { TestBed } from '@angular/core/testing';

import { ApiActionGuardService } from './api-action-guard.service';
import { SessionNotificationCenterService } from './session-notification-center.service';
import { UserProfileApiService } from './user-profile-api.service';
import { UserService } from './user.service';

describe('ApiActionGuardService', () => {
    let service: ApiActionGuardService;
    let userProfileApiSvc: jasmine.SpyObj<UserProfileApiService>;
    let userSvc: jasmine.SpyObj<UserService>;
    let sessionNotificationCenterSvc: SessionNotificationCenterService;

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
        sessionNotificationCenterSvc = TestBed.inject(SessionNotificationCenterService);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('permite hasta 5 activaciones rápidas y bloquea a partir de la sexta', () => {
        const decisions = Array.from({ length: 6 }, () => service.shouldAllow('uid-1', 'campaign.create'));

        expect(decisions.slice(0, 5).every((item) => item.status === 'allowed')).toBeTrue();
        expect(decisions[5]).toEqual(jasmine.objectContaining({
            status: 'cooldown',
            blocksToday: 1,
            sessionLocked: false,
            newlyBlocked: true,
        }));
    });

    it('mantiene el cooldown durante la ventana de bloqueo', () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');

        jasmine.clock().tick(30_000);

        const decision = service.shouldAllow('uid-1', 'campaign.create');
        expect(decision.status).toBe('cooldown');
        expect(decision.newlyBlocked).toBeFalse();
    });

    it('bloquea la sesión al llegar a 3 bloqueos en el día', () => {
        for (let strike = 0; strike < 3; strike += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${strike}`);
            jasmine.clock().tick(service.cooldownMs + 1);
        }

        const decision = service.shouldAllow('uid-1', 'campaign.update');
        expect(decision.status).toBe('session_locked');
        expect(decision.blocksToday).toBe(3);
        expect(decision.sessionLocked).toBeTrue();
    });

    it('escala abuse-lock cuando la sesión entra en session_locked', async () => {
        for (let strike = 0; strike < 3; strike += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${strike}`);
            jasmine.clock().tick(service.cooldownMs + 1);
        }

        service.shouldAllow('uid-1', 'campaign.update');
        await Promise.resolve();

        expect(userProfileApiSvc.reportAbuseLock).toHaveBeenCalledWith({
            reason: 'frontend_api_button_spam',
            clientDate: '2026-03-28',
            localBlockCountToday: 3,
            source: 'web',
        });
    });

    it('publica una notificación con countdown cuando entra en cooldown', () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');

        let entries = [] as any[];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].title).toContain('Protección temporal');
        expect(entries[0].countdownLabel).toBe('Fin de la limitación temporal');
        expect(entries[0].countdownUntil).not.toBeNull();
    });

    it('actualiza la misma notificación cuando backend responde ignored al abuse-lock', async () => {
        for (let strike = 0; strike < 3; strike += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${strike}`);
            jasmine.clock().tick(service.cooldownMs + 1);
        }

        service.shouldAllow('uid-1', 'campaign.update');
        await Promise.resolve();

        let entries = [] as any[];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].message).toContain('no se ha aplicado una sanción adicional');
        expect(entries[0].countdownLabel).toBe('Fin de la limitación de la sesión');
    });

    it('aplica el compliance devuelto por abuse-lock para converger la sesión sin esperar a Firestore', async () => {
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

        for (let strike = 0; strike < 3; strike += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${strike}`);
            jasmine.clock().tick(service.cooldownMs + 1);
        }

        service.shouldAllow('uid-1', 'campaign.update');
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

    it('incrementa el contador de la misma notificación cuando se insiste durante el cooldown', () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');

        service.shouldAllow('uid-1', 'campaign.create');

        let entries = [] as any[];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].repeatCount).toBe(2);
    });

    it('no duplica el mismo abuse-lock si la sesión ya quedó bloqueada y el reporte previo fue aceptado', async () => {
        for (let strike = 0; strike < 3; strike += 1) {
            for (let index = 0; index < 6; index += 1)
                service.shouldAllow('uid-1', `campaign.create.${strike}`);
            jasmine.clock().tick(service.cooldownMs + 1);
        }

        service.shouldAllow('uid-1', 'campaign.update');
        await Promise.resolve();
        service.shouldAllow('uid-1', 'campaign.update');
        await Promise.resolve();

        expect(userProfileApiSvc.reportAbuseLock.calls.count()).toBe(1);
    });

    it('reinicia el contador cuando cambia el día', () => {
        for (let index = 0; index < 6; index += 1)
            service.shouldAllow('uid-1', 'campaign.create');

        jasmine.clock().mockDate(new Date('2026-03-29T10:00:00.000Z'));

        const decision = service.shouldAllow('uid-1', 'campaign.create');
        expect(decision.status).toBe('allowed');
        expect(decision.blocksToday).toBe(0);
    });
});
