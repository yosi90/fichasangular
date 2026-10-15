import Swal from 'sweetalert2';
import { AppComponent } from './app.component';

describe('AppComponent Swal wrapper', () => {
    let originalFire: typeof Swal.fire;
    let baseFireSpy: jasmine.Spy;
    let component: AppComponent;

    beforeEach(() => {
        localStorage.clear();
        originalFire = Swal.fire;
        baseFireSpy = jasmine.createSpy('baseFire').and.resolveTo({ isConfirmed: false });
        (Swal as any).fire = baseFireSpy;
        (AppComponent as any).swalConfigurado = false;

        const initSpy = jasmine.createSpy('init');
        component = new AppComponent(
            { init: initSpy } as any,
            { iniciar: initSpy } as any,
            { iniciar: initSpy } as any,
        );
    });

    afterEach(() => {
        localStorage.clear();
        (Swal as any).fire = originalFire;
        (AppComponent as any).swalConfigurado = false;
    });

    it('sanea textos tecnicos en swals globales', async () => {
        await component.ngOnInit();

        await Swal.fire({
            icon: 'warning',
            title: 'Error al obtener la dote',
            text: 'Violation of UNIQUE KEY constraint UQ_Dotes_Nombre.',
        });

        expect(baseFireSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            text: 'Error al obtener la dote.',
        }));
    });
});
