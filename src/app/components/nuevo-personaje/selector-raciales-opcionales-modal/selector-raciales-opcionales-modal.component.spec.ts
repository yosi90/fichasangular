import { SimpleChange } from '@angular/core';
import { SelectorRacialesOpcionalesModalComponent } from './selector-raciales-opcionales-modal.component';

describe('SelectorRacialesOpcionalesModalComponent', () => {
    let component: SelectorRacialesOpcionalesModalComponent;

    beforeEach(() => {
        component = new SelectorRacialesOpcionalesModalComponent();
        component.grupos = [
            {
                grupo: 1,
                opciones: [
                    { clave: 'id:10', racial: { Id: 10, Nombre: 'A' } as any, estado: 'eligible', razones: [], advertencias: [] },
                    { clave: 'id:11', racial: { Id: 11, Nombre: 'B' } as any, estado: 'blocked', razones: ['No cumple raza'], advertencias: [] },
                ],
            },
            {
                grupo: 2,
                opciones: [
                    { clave: 'id:20', racial: { Id: 20, Nombre: 'C' } as any, estado: 'eligible_with_warning', razones: [], advertencias: ['Validacion parcial'] },
                ],
            },
        ];
        component.ngOnChanges({ grupos: new SimpleChange([], component.grupos, true) } as any);
    });

    it('expone grupos y requiere selección cuando hay opcionales', () => {
        expect(component.grupos.length).toBe(2);
        expect(component.requiereSeleccion).toBeTrue();
        expect(component.seleccionCompleta).toBeFalse();
    });

    it('solo permite confirmar cuando todos los grupos tienen selección', () => {
        component.onSeleccionar(1, 'id:10', true);
        expect(component.seleccionCompleta).toBeFalse();

        component.onSeleccionar(2, 'id:20', true);
        expect(component.seleccionCompleta).toBeTrue();
    });

    it('no permite seleccionar opciones bloqueadas', () => {
        component.onSeleccionar(1, 'id:11', false);
        expect(component.esSeleccionada(1, 'id:11')).toBeFalse();
    });

    it('emite confirmar y cerrar', () => {
        const confirmarSpy = spyOn(component.confirmar, 'emit');
        const cerrarSpy = spyOn(component.cerrar, 'emit');

        component.onSeleccionar(1, 'id:10', true);
        component.onSeleccionar(2, 'id:20', true);
        component.onConfirmar();
        component.onCerrar();

        expect(confirmarSpy).toHaveBeenCalledWith({ 1: 'id:10', 2: 'id:20' });
        expect(cerrarSpy).toHaveBeenCalled();
    });

    it('emite info y detalle racial', () => {
        const infoSpy = spyOn(component.info, 'emit');
        const detalleSpy = spyOn(component.verDetalleRacial, 'emit');

        component.onInfo();
        component.onVerDetalleRacial({ Id: 10, Nombre: 'A' } as any);

        expect(infoSpy).toHaveBeenCalled();
        expect(detalleSpy).toHaveBeenCalledWith({ id: 10, nombre: 'A' });
    });
});
