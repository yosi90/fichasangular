import { VentanaDetalleFlotanteComponent } from './ventana-detalle-flotante.component';

describe('VentanaDetalleFlotanteComponent', () => {
    let component: VentanaDetalleFlotanteComponent;

    beforeEach(() => {
        component = new VentanaDetalleFlotanteComponent();
        component.ngOnInit();
    });

    it('minimizar deja solo la barra superior', () => {
        const widthAbierta = Number(component.containerStyle['width'].replace('px', ''));
        component.toggleMinimize();
        const widthMinimizada = Number(component.containerStyle['width'].replace('px', ''));

        expect(component.isMinimized).toBeTrue();
        expect(widthMinimizada).toBeLessThan(widthAbierta);
        expect(component.containerStyle['height']).toBe(`${component.titleBarHeight}px`);
    });

    it('maximizar y restaurar conserva la geometría original', () => {
        const original = { ...component.rect };

        component.toggleMaximize();
        expect(component.isMaximized).toBeTrue();

        component.toggleMaximize();

        expect(component.isMaximized).toBeFalse();
        expect(component.rect.x).toBe(original.x);
        expect(component.rect.y).toBe(original.y);
        expect(component.rect.width).toBe(original.width);
        expect(component.rect.height).toBe(original.height);
    });

    it('arrastre actualiza la posición', () => {
        component.rect = {
            x: 20,
            y: 20,
            width: component.minWidth,
            height: component.minHeight,
        };
        const start = { ...component.rect };
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 200,
            clientY: 120,
            target: null,
            preventDefault: () => undefined,
        } as any);

        component.onDocumentPointerMove({
            clientX: 230,
            clientY: 150,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(component.rect.x).toBe(start.x + 30);
        expect(component.rect.y).toBe(start.y + 30);
    });

    it('resize respeta tamaños mínimos', () => {
        component.onResizePointerDown({
            button: 0,
            clientX: 400,
            clientY: 300,
            preventDefault: () => undefined,
            stopPropagation: () => undefined,
        } as any, 'se');

        component.onDocumentPointerMove({
            clientX: -2000,
            clientY: -2000,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(component.rect.width).toBeGreaterThanOrEqual(component.minWidth);
        expect(component.rect.height).toBeGreaterThanOrEqual(component.minHeight);
    });

    it('minimizada puede moverse hasta el borde inferior', () => {
        component.rect = {
            x: 20,
            y: 20,
            width: 900,
            height: 500,
        };
        component.toggleMinimize();
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 100,
            clientY: 100,
            target: null,
            preventDefault: () => undefined,
        } as any);
        component.onDocumentPointerMove({
            clientX: 100,
            clientY: 99999,
        } as PointerEvent);
        component.onDocumentPointerUp();

        const viewportHeight = Math.max(480, window.innerHeight);
        const top = Number(component.containerStyle['top'].replace('px', ''));
        const expectedBottomTop = viewportHeight - component.titleBarHeight - 12;
        expect(top).toBe(expectedBottomTop);
    });

    it('el título dinámico afecta al ancho minimizado', () => {
        component.titulo = 'Nombre muy largo de personaje para medir ancho';
        component.ngOnChanges({
            titulo: {
                currentValue: component.titulo,
                previousValue: '',
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);
        component.toggleMinimize();
        const anchoLargo = Number(component.containerStyle['width'].replace('px', ''));

        component.toggleMinimize();
        component.titulo = 'Pepe - En creación';
        component.ngOnChanges({
            titulo: {
                currentValue: component.titulo,
                previousValue: '',
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);
        component.toggleMinimize();
        const anchoCorto = Number(component.containerStyle['width'].replace('px', ''));

        expect(anchoLargo).toBeGreaterThan(anchoCorto);
    });

    it('bloqueadaPorOverlay desactiva interacción sin perder estado', () => {
        const start = { ...component.rect };
        component.bloqueadaPorOverlay = true;
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 200,
            clientY: 120,
            target: null,
            preventDefault: () => undefined,
        } as any);
        component.onDocumentPointerMove({
            clientX: 280,
            clientY: 190,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(component.rect).toEqual(start);
    });

    it('si está maximizada y se minimiza, deja de estar maximizada', () => {
        component.toggleMaximize();
        expect(component.isMaximized).toBeTrue();

        component.toggleMinimize();

        expect(component.isMinimized).toBeTrue();
        expect(component.isMaximized).toBeFalse();
        expect(component.containerStyle['height']).toBe(`${component.titleBarHeight}px`);
    });
});
