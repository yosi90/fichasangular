import { VentanaDetalleFlotanteComponent } from './ventana-detalle-flotante.component';
import { UserSettingsService } from 'src/app/services/user-settings.service';

describe('VentanaDetalleFlotanteComponent', () => {
    let component: VentanaDetalleFlotanteComponent;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;

    beforeEach(() => {
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadPreviewMinimizada',
            'savePreviewMinimizada',
            'loadPreviewRestaurada',
            'savePreviewRestaurada',
        ]);
        userSettingsSvc.loadPreviewMinimizada.and.resolveTo(null);
        userSettingsSvc.savePreviewMinimizada.and.resolveTo();
        userSettingsSvc.loadPreviewRestaurada.and.resolveTo(null);
        userSettingsSvc.savePreviewRestaurada.and.resolveTo();

        component = new VentanaDetalleFlotanteComponent(userSettingsSvc);
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

    it('guarda geometría al soltar arrastre en estado normal', () => {
        component.rect = {
            x: 20,
            y: 20,
            width: component.minWidth,
            height: component.minHeight,
        };
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 200,
            clientY: 120,
            target: null,
            preventDefault: () => undefined,
        } as any);

        component.onDocumentPointerMove({
            clientX: 240,
            clientY: 170,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(userSettingsSvc.savePreviewRestaurada).toHaveBeenCalledTimes(1);
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

    it('al minimizar aplica placement guardado por cuenta', async () => {
        userSettingsSvc.loadPreviewMinimizada.and.resolveTo({
            version: 1,
            side: 'right',
            top: 200,
            updatedAt: Date.now(),
        });

        component = new VentanaDetalleFlotanteComponent(userSettingsSvc);
        component.ngOnInit();
        await Promise.resolve();
        await Promise.resolve();

        component.toggleMinimize();

        const viewportWidth = Math.max(640, window.innerWidth);
        const width = Number(component.containerStyle['width'].replace('px', ''));
        const left = Number(component.containerStyle['left'].replace('px', ''));
        const top = Number(component.containerStyle['top'].replace('px', ''));

        expect(left).toBe(viewportWidth - width - 12);
        expect(top).toBe(200);
    });

    it('si no existe placement minimizado previo y ancla a laterales, el primer minimizado se pega al borde', () => {
        component.rect = {
            x: 900,
            y: 160,
            width: 560,
            height: 340,
        };

        component.toggleMinimize();

        const viewportWidth = Math.max(640, window.innerWidth);
        const width = Number(component.containerStyle['width'].replace('px', ''));
        const left = Number(component.containerStyle['left'].replace('px', ''));
        const top = Number(component.containerStyle['top'].replace('px', ''));

        expect(component.isMinimized).toBeTrue();
        expect(left).toBe(viewportWidth - width - 12);
        expect(top).toBe(160);
    });

    it('si la ventana parte centrada y no hay placement minimizado previo, el primer minimizado desempata hacia la derecha', () => {
        component.rect = component['getInitialRect']();

        component.toggleMinimize();

        const viewportWidth = Math.max(640, window.innerWidth);
        const width = Number(component.containerStyle['width'].replace('px', ''));
        const left = Number(component.containerStyle['left'].replace('px', ''));

        expect(component.isMinimized).toBeTrue();
        expect(left).toBe(viewportWidth - width - 12);
    });

    it('al restaurar desde minimizada vuelve a la geometría guardada', async () => {
        userSettingsSvc.loadPreviewRestaurada.and.resolveTo({
            version: 1,
            left: 140,
            top: 96,
            width: 560,
            height: 340,
            updatedAt: Date.now(),
        });

        component = new VentanaDetalleFlotanteComponent(userSettingsSvc);
        component.ngOnInit();
        await Promise.resolve();
        await Promise.resolve();

        component.toggleMinimize();
        component.rect = {
            ...component.rect,
            x: 12,
            y: 230,
        };
        component.toggleMinimize();

        expect(component.isMinimized).toBeFalse();
        expect(component.rect.x).toBe(140);
        expect(component.rect.y).toBe(96);
        expect(component.rect.width).toBe(560);
        expect(component.rect.height).toBe(340);
    });

    it('aplica geometría restaurada guardada por cuenta al iniciar', async () => {
        userSettingsSvc.loadPreviewRestaurada.and.resolveTo({
            version: 1,
            left: 80,
            top: 70,
            width: 560,
            height: 340,
            updatedAt: Date.now(),
        });

        component = new VentanaDetalleFlotanteComponent(userSettingsSvc);
        component.ngOnInit();
        await Promise.resolve();
        await Promise.resolve();

        expect(component.rect.x).toBe(80);
        expect(component.rect.y).toBe(70);
        expect(component.rect.width).toBe(560);
        expect(component.rect.height).toBe(340);
    });

    it('si se maximiza desde minimizada, al restaurar usa geometría guardada', async () => {
        userSettingsSvc.loadPreviewRestaurada.and.resolveTo({
            version: 1,
            left: 88,
            top: 66,
            width: 560,
            height: 340,
            updatedAt: Date.now(),
        });

        component = new VentanaDetalleFlotanteComponent(userSettingsSvc);
        component.ngOnInit();
        await Promise.resolve();
        await Promise.resolve();

        component.toggleMinimize();
        component.toggleMaximize();
        component.toggleMaximize();

        expect(component.isMaximized).toBeFalse();
        expect(component.isMinimized).toBeFalse();
        expect(component.rect.x).toBe(88);
        expect(component.rect.y).toBe(66);
        expect(component.rect.width).toBe(560);
        expect(component.rect.height).toBe(340);
    });

    it('guarda placement al soltar arrastre mientras está minimizada', () => {
        component.toggleMinimize();
        userSettingsSvc.savePreviewMinimizada.calls.reset();
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 100,
            clientY: 100,
            target: null,
            preventDefault: () => undefined,
        } as any);
        component.onDocumentPointerMove({
            clientX: 220,
            clientY: 210,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(userSettingsSvc.savePreviewMinimizada).toHaveBeenCalledTimes(1);
    });

    it('no guarda placement si no hubo desplazamiento al soltar', () => {
        component.toggleMinimize();
        userSettingsSvc.savePreviewMinimizada.calls.reset();
        component.onTitleBarPointerDown({
            button: 0,
            clientX: 100,
            clientY: 100,
            target: null,
            preventDefault: () => undefined,
        } as any);
        component.onDocumentPointerUp();

        expect(userSettingsSvc.savePreviewMinimizada).not.toHaveBeenCalled();
    });

    it('si la minimizada no se ancla a laterales mantiene posicion libre y no guarda side/top', () => {
        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: 120,
            top: 120,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.minimizedPlacementInput = {
            version: 1,
            side: 'right',
            top: 40,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
            minimizedPlacementInput: {
                currentValue: component.minimizedPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        const leftBeforeMove = Number(component.containerStyle['left'].replace('px', ''));

        component.onTitleBarPointerDown({
            button: 0,
            clientX: 100,
            clientY: 100,
            target: null,
            preventDefault: () => undefined,
        } as any);
        component.onDocumentPointerMove({
            clientX: 160,
            clientY: 160,
        } as PointerEvent);
        component.onDocumentPointerUp();

        const leftAfterMove = Number(component.containerStyle['left'].replace('px', ''));

        expect(leftBeforeMove).toBe(120);
        expect(leftAfterMove).toBe(180);
        expect(component['minimizedPlacement']).toBeNull();
        expect(component['restoredPlacement']).toEqual(jasmine.objectContaining({
            left: 180,
            top: 180,
            width: 320,
            height: 220,
        }));
        expect(userSettingsSvc.savePreviewMinimizada).not.toHaveBeenCalled();
    });

    it('una minimizada libre no se resnappea al recibir de vuelta el restoredPlacement del padre', () => {
        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: 120,
            top: 120,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        component.rect = {
            ...component.rect,
            x: 180,
            y: 180,
        };
        component['restoredPlacement'] = {
            version: 1,
            left: 180,
            top: 180,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.restoredPlacementInput = component['restoredPlacement'];
        component.windowMode = 'minimized';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        expect(component.isMinimized).toBeTrue();
        expect(Number(component.containerStyle['left'].replace('px', ''))).toBe(180);
        expect(Number(component.containerStyle['top'].replace('px', ''))).toBe(180);
    });

    it('una minimizada libre no debe teletransportarse si el feedback del padre trae un restored top recalculado', () => {
        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: 120,
            top: 120,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        component.rect = {
            ...component.rect,
            x: 180,
            y: 300,
        };

        component.restoredPlacementInput = {
            version: 1,
            left: 180,
            top: 12,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'minimized';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        expect(component.isMinimized).toBeTrue();
        expect(Number(component.containerStyle['left'].replace('px', ''))).toBe(180);
        expect(Number(component.containerStyle['top'].replace('px', ''))).toBe(300);
    });

    it('rehidrata el top correcto cuando arranca ya minimizada sin anclaje lateral', () => {
        const viewportHeight = Math.max(480, window.innerHeight);
        component.minWidth = 320;
        component.minHeight = 220;
        const restoredTop = viewportHeight - component.minHeight - 24;
        const expectedTop = viewportHeight - component.titleBarHeight - 24;

        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.restoredPlacementInput = {
            version: 1,
            left: 180,
            top: restoredTop,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.minimizedPlacementInput = null;
        component.windowMode = 'minimized';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
            windowMode: {
                currentValue: 'minimized',
                previousValue: 'window',
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        expect(component.isMinimized).toBeTrue();
        expect(Number(component.containerStyle['top'].replace('px', ''))).toBe(expectedTop);
    });

    it('al minimizar libre conserva el offset derecho del placement restaurado', () => {
        const viewportWidth = Math.max(640, window.innerWidth);

        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: viewportWidth - 320 - 28,
            top: 96,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();

        const minimizedWidth = Number(component.containerStyle['width'].replace('px', ''));
        const left = Number(component.containerStyle['left'].replace('px', ''));
        expect(left).toBe(viewportWidth - minimizedWidth - 28);
    });

    it('al restaurar desde minimizada libre reutiliza el placement restaurado guardado', () => {
        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: 132,
            top: 84,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        component.toggleMinimize();

        expect(component.isMinimized).toBeFalse();
        expect(component.rect.x).toBe(132);
        expect(component.rect.y).toBe(84);
        expect(component['restoredPlacement']).toEqual(jasmine.objectContaining({
            left: 132,
            top: 84,
            width: 320,
            height: 220,
        }));
    });

    it('al restaurar desde minimizada libre en cuadrante derecho preserva el offset derecho actual', () => {
        const viewportWidth = Math.max(640, window.innerWidth);

        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: viewportWidth - 320 - 36,
            top: 84,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        const minimizedWidth = Number(component.containerStyle['width'].replace('px', ''));
        component.rect = {
            ...component.rect,
            x: viewportWidth - minimizedWidth - 12,
            y: component.rect.y,
        };

        component.toggleMinimize();

        expect(component.isMinimized).toBeFalse();
        expect(component.rect.x).toBe(viewportWidth - 320 - 12);
    });

    it('al restaurar desde minimizada libre en cuadrante inferior preserva el offset inferior actual', () => {
        const viewportHeight = Math.max(480, window.innerHeight);

        component.persistPreviewPlacements = false;
        component.minimizedAnchorsToViewportSides = false;
        component.minWidth = 320;
        component.minHeight = 220;
        component.restoredPlacementInput = {
            version: 1,
            left: 96,
            top: viewportHeight - 220 - 18,
            width: 320,
            height: 220,
            updatedAt: Date.now(),
        };
        component.windowMode = 'window';
        component.ngOnChanges({
            restoredPlacementInput: {
                currentValue: component.restoredPlacementInput,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false,
            },
        } as any);

        component.toggleMinimize();
        component.rect = {
            ...component.rect,
            y: viewportHeight - component.titleBarHeight - 20,
        };

        component.toggleMinimize();

        expect(component.isMinimized).toBeFalse();
        expect(component.rect.y).toBe(viewportHeight - 220 - 20);
    });

    it('fixedWidth fuerza el ancho y desactiva resize', () => {
        component.fixedWidth = 320;
        component.minWidth = 320;
        component.resizable = false;
        component.rect = {
            x: 40,
            y: 40,
            width: 560,
            height: 340,
        };
        component.ngOnChanges({} as any);

        expect(component.containerStyle['width']).toBe('320px');

        component.onResizePointerDown({
            button: 0,
            clientX: 400,
            clientY: 300,
            preventDefault: () => undefined,
            stopPropagation: () => undefined,
        } as any, 'se');

        component.onDocumentPointerMove({
            clientX: 999,
            clientY: 999,
        } as PointerEvent);
        component.onDocumentPointerUp();

        expect(component.containerStyle['width']).toBe('320px');
        expect(component.rect.width).toBe(560);
    });
});
