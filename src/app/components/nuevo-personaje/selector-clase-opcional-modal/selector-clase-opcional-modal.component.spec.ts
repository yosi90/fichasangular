import { SelectorClaseOpcionalModalComponent } from './selector-clase-opcional-modal.component';

describe('SelectorClaseOpcionalModalComponent', () => {
    let component: SelectorClaseOpcionalModalComponent;

    beforeEach(() => {
        component = new SelectorClaseOpcionalModalComponent();
        component.opciones = [
            { clave: 'dote:1', tipo: 'dote', nombre: 'Presa mejorada', extra: 'No aplica' },
            { clave: 'esp:2', tipo: 'especial', nombre: 'Estilo de combate', extra: 'Combate con dos armas' },
        ];
    });

    it('solo confirma cuando hay una opción seleccionada', () => {
        const spy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();
        expect(spy).not.toHaveBeenCalled();

        component.seleccionarOpcion('dote:1');
        component.onConfirmar();
        expect(spy).toHaveBeenCalledWith('dote:1');
    });

    it('marca correctamente la opción seleccionada', () => {
        component.seleccionarOpcion('esp:2');

        expect(component.esOpcionSeleccionada('esp:2')).toBeTrue();
        expect(component.esOpcionSeleccionada('dote:1')).toBeFalse();
    });

    it('enter confirma solo cuando la selección es válida', () => {
        const spy = spyOn(component.confirmar, 'emit');

        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(spy).not.toHaveBeenCalled();

        component.seleccionarOpcion('esp:2');
        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(spy).toHaveBeenCalledWith('esp:2');
    });
});
