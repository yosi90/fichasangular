import { fakeAsync, tick } from '@angular/core/testing';
import { AppToastService } from './app-toast.service';

describe('AppToastService', () => {
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
});
