import Swal from 'sweetalert2';
import { AppComponent } from './app.component';
import { SessionNotificationCenterService } from './services/session-notification-center.service';

describe('AppComponent Swal wrapper', () => {
    let originalFire: typeof Swal.fire;
    let sessionNotificationCenterSvc: SessionNotificationCenterService;
    let baseFireSpy: jasmine.Spy;
    let component: AppComponent;

    beforeEach(() => {
        originalFire = Swal.fire;
        sessionNotificationCenterSvc = new SessionNotificationCenterService();
        baseFireSpy = jasmine.createSpy('baseFire').and.resolveTo({ isConfirmed: false });
        (Swal as any).fire = baseFireSpy;
        (AppComponent as any).swalConfigurado = false;

        const initSpy = jasmine.createSpy('init');
        component = new AppComponent(
            { init: initSpy } as any,
            { init: initSpy } as any,
            { init: initSpy } as any,
            { init: initSpy } as any,
            { init: initSpy } as any,
            { init: initSpy } as any,
            sessionNotificationCenterSvc,
            { init: initSpy } as any,
        );
    });

    afterEach(() => {
        (Swal as any).fire = originalFire;
        (AppComponent as any).swalConfigurado = false;
    });

    it('archiva swals simples de success, error e info', async () => {
        await component.ngOnInit();

        await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Perfil actualizado' });
        await Swal.fire('Error', 'Algo ha fallado', 'error');

        let entries: any[] = [];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(baseFireSpy).toHaveBeenCalledTimes(2);
        expect(entries.length).toBe(2);
        expect(entries[0].level).toBe('error');
        expect(entries[1].level).toBe('success');
    });

    it('excluye prompts e inputs de la captura automática', async () => {
        await component.ngOnInit();

        await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar?',
            showCancelButton: true,
        });
        await Swal.fire({
            icon: 'info',
            title: 'Pon un nombre',
            input: 'text',
        });

        let entries: any[] = [];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(0);
    });

    it('respeta sessionNotification explícito en avisos warning navegables', async () => {
        const action = jasmine.createSpy('action');
        await component.ngOnInit();

        await Swal.fire({
            icon: 'warning',
            title: 'Política pendiente',
            text: 'Debes revisar la política',
            showCancelButton: true,
            sessionNotification: {
                include: true,
                actionLabel: 'Revisar ahora',
                action,
            },
        } as any);

        let entries: any[] = [];
        sessionNotificationCenterSvc.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].level).toBe('warning');
        expect(entries[0].action).toBe(action);
        expect(baseFireSpy.calls.mostRecent().args[0]['sessionNotification']).toBeUndefined();
    });
});
