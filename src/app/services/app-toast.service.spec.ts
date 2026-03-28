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
});
