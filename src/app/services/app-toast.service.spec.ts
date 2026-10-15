import { fakeAsync, tick } from '@angular/core/testing';
import { AppToastService } from './app-toast.service';

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

    it('sanea mensajes tecnicos en toasts de error', () => {
        const service = new AppToastService();
        let latest: any[] = [];
        service.toasts$.subscribe((toasts) => latest = toasts);

        service.showError('Error de integridad de datos.');

        expect(latest.length).toBe(1);
        expect(latest[0].message).toBe('No se pudo completar la acción.');
    });
});
