import { SelectorDominiosModalComponent } from './selector-dominios-modal.component';

describe('SelectorDominiosModalComponent', () => {
    let component: SelectorDominiosModalComponent;

    beforeEach(() => {
        component = new SelectorDominiosModalComponent();
        component.opciones = [
            { id: 1, nombre: 'Guerra', oficial: true },
            { id: 2, nombre: 'Bien', oficial: true },
            { id: 3, nombre: 'Caos', oficial: false },
        ];
        component.cantidadObjetivo = 2;
        component.cantidadSeleccionada = 0;
    });

    it('respeta el limite de selección', () => {
        component.onToggleDominio(1, true);
        component.onToggleDominio(2, true);
        component.onToggleDominio(3, true);

        expect(component.seleccionActual).toEqual([1, 2]);
        expect(component.cantidadPendiente).toBe(0);
    });

    it('solo permite confirmar cuando se alcanza la cantidad objetivo', () => {
        const spy = spyOn(component.confirmar, 'emit');
        component.onToggleDominio(1, true);
        component.onConfirmar();
        expect(spy).not.toHaveBeenCalled();

        component.onToggleDominio(2, true);
        component.onConfirmar();
        expect(spy).toHaveBeenCalledWith([1, 2]);
    });

    it('bloquea cierre cuando faltan selecciones si así se configura', () => {
        component.bloquearCierreHastaCompletar = true;
        const spy = spyOn(component.cerrar, 'emit');

        component.onToggleDominio(1, true);
        component.onCerrar();
        expect(spy).not.toHaveBeenCalled();

        component.onToggleDominio(2, true);
        component.onCerrar();
        expect(spy).toHaveBeenCalled();
    });

    it('permite alternar selección al pulsar toda la fila', () => {
        component.onToggleDominioRow(1);
        expect(component.isSeleccionado(1)).toBeTrue();

        component.onToggleDominioRow(1);
        expect(component.isSeleccionado(1)).toBeFalse();
    });
});
