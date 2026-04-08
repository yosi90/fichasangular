import { fakeAsync, tick } from '@angular/core/testing';
import { AppToastService } from './app-toast.service';
import { SessionNotificationCenterService } from './session-notification-center.service';

describe('AppToastService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('crea y autocierra un toast de exito', fakeAsync(() => {
        const service = new AppToastService();
        let currentLength = 0;
        service.toasts$.subscribe((toasts) => currentLength = toasts.length);

        service.showSuccess('Perfil guardado');
        expect(currentLength).toBe(1);

        tick(3201);
        expect(currentLength).toBe(0);
    }));

    it('permite cerrar manualmente un toast', () => {
        const service = new AppToastService();
        let toastId = '';
        service.toasts$.subscribe((toasts) => {
            toastId = toasts[0]?.id ?? '';
        });

        service.showError('Error');
        expect(toastId.length).toBeGreaterThan(0);

        service.dismiss(toastId);

        service.toasts$.subscribe((toasts) => {
            expect(toasts.length).toBe(0);
        });
    });

    it('mantiene visible dos segundos mas un toast de error', fakeAsync(() => {
        const service = new AppToastService();
        let currentLength = 0;
        service.toasts$.subscribe((toasts) => currentLength = toasts.length);

        service.showError('Error');
        expect(currentLength).toBe(1);

        tick(5201);
        expect(currentLength).toBe(1);

        tick(2000);
        expect(currentLength).toBe(0);
    }));

    it('mantiene visible más tiempo un toast de sistema', fakeAsync(() => {
        const service = new AppToastService();
        let currentLength = 0;
        service.toasts$.subscribe((toasts) => currentLength = toasts.length);

        service.showSystem('Yosiftware: Nuevo aviso');
        expect(currentLength).toBe(1);

        tick(5201);
        expect(currentLength).toBe(1);

        tick(2400);
        expect(currentLength).toBe(0);
    }));

    it('suprime toasts etiquetados cuando la categoría está desactivada', () => {
        const prefsSvc = jasmine.createSpyObj('SocialAlertPreferencesService', ['isEnabled']);
        prefsSvc.isEnabled.and.returnValue(false);
        const service = new AppToastService(prefsSvc);
        let latest: any[] = [];
        service.toasts$.subscribe((toasts) => latest = toasts);

        service.showInfo('Mensaje oculto', { category: 'mensajes' });

        expect(latest.length).toBe(0);
    });

    it('mantiene visibles los errores aunque la categoría esté desactivada', () => {
        const prefsSvc = jasmine.createSpyObj('SocialAlertPreferencesService', ['isEnabled']);
        prefsSvc.isEnabled.and.returnValue(false);
        const service = new AppToastService(prefsSvc);
        let latest: any[] = [];
        service.toasts$.subscribe((toasts) => latest = toasts);

        service.showError('Error crítico', { category: 'campanas' });

        expect(latest.length).toBe(1);
        expect(latest[0].message).toBe('Error crítico');
    });

    it('mantiene el comportamiento normal para toasts sin categoría', () => {
        const prefsSvc = jasmine.createSpyObj('SocialAlertPreferencesService', ['isEnabled']);
        prefsSvc.isEnabled.and.returnValue(false);
        const service = new AppToastService(prefsSvc);
        let latest: any[] = [];
        service.toasts$.subscribe((toasts) => latest = toasts);

        service.showSuccess('Guardado general');

        expect(latest.length).toBe(1);
        expect(latest[0].message).toBe('Guardado general');
    });

    it('añade cada toast al histórico de sesión al emitirse', () => {
        const notifications = new SessionNotificationCenterService();
        const service = new AppToastService(undefined, notifications);
        let entries: any[] = [];
        notifications.entries$.subscribe((value) => entries = value);

        service.showInfo('Nueva alerta');

        expect(entries.length).toBe(1);
        expect(entries[0].source).toBe('toast');
        expect(entries[0].message).toBe('Nueva alerta');
    });

    it('permite omitir la captura en el histórico de sesión cuando otra fuente ya crea la entrada persistente', () => {
        const notifications = new SessionNotificationCenterService();
        const service = new AppToastService(undefined, notifications);
        let entries: any[] = [];
        notifications.entries$.subscribe((value) => entries = value);

        service.showError('Bloqueo local', { captureSessionNotification: false });

        expect(entries.length).toBe(0);
    });

    it('no duplica el histórico al cerrar un toast', () => {
        const notifications = new SessionNotificationCenterService();
        const service = new AppToastService(undefined, notifications);
        let toastId = '';
        let entries: any[] = [];
        service.toasts$.subscribe((toasts) => {
            toastId = toasts[0]?.id ?? '';
        });
        notifications.entries$.subscribe((value) => entries = value);

        service.showSuccess('Guardado');
        service.dismiss(toastId);

        expect(entries.length).toBe(1);
        expect(entries[0].message).toBe('Guardado');
    });

    it('reutiliza el mismo toast explícitamente deduplicado aunque cambie el countdown del mensaje', () => {
        const service = new AppToastService();
        let latest: any[] = [];
        service.toasts$.subscribe((toasts) => latest = toasts);

        service.showError('Bloqueado. Inténtalo de nuevo en 30 s.', { dedupeKey: 'guard.uid-1.cooldown' });
        service.showError('Bloqueado. Inténtalo de nuevo en 29 s.', { dedupeKey: 'guard.uid-1.cooldown' });

        expect(latest.length).toBe(1);
        expect(latest[0].message).toBe('Bloqueado. Inténtalo de nuevo en 29 s.');
        expect(latest[0].repeatCount).toBe(2);
    });
});
