import { TestBed } from '@angular/core/testing';

import { ApiActionGuardService } from './api-action-guard.service';
import { UserProfileApiService } from './user-profile-api.service';

describe('ApiActionGuardService', () => {
    let service: ApiActionGuardService;
    let userProfileApiSvc: jasmine.SpyObj<UserProfileApiService>;

    beforeEach(() => {
        sessionStorage.clear();
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date('2026-03-28T10:00:00.000Z'));
        userProfileApiSvc = jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', ['reportAbuseLock']);
        userProfileApiSvc.reportAbuseLock.and.resolveTo({
            status: 'ignored',
            compliance: null,
        } as any);
        TestBed.configureTestingModule({
            providers: [
                { provide: UserProfileApiService, useValue: userProfileApiSvc },
            ],
        });
        service = TestBed.inject(ApiActionGuardService);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
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
