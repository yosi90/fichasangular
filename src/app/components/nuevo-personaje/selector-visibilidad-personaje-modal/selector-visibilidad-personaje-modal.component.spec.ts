import { SimpleChange } from '@angular/core';
import { SelectorVisibilidadPersonajeModalComponent } from './selector-visibilidad-personaje-modal.component';

describe('SelectorVisibilidadPersonajeModalComponent', () => {
    it('inicializa seleccion desde input y confirma valor', () => {
        const component = new SelectorVisibilidadPersonajeModalComponent();
        const confirmarSpy = jasmine.createSpy('confirmar');
        component.confirmar.subscribe(confirmarSpy);

        component.seleccionInicial = true;
        component.ngOnChanges({
            seleccionInicial: new SimpleChange(null, true, true),
        });

        expect(component.seleccion).toBeTrue();
        component.onConfirmar();
        expect(confirmarSpy).toHaveBeenCalledWith(true);
    });

    it('no confirma si no hay seleccion', () => {
        const component = new SelectorVisibilidadPersonajeModalComponent();
        const confirmarSpy = jasmine.createSpy('confirmar');
        component.confirmar.subscribe(confirmarSpy);

        component.onConfirmar();
        expect(confirmarSpy).not.toHaveBeenCalled();
    });

    it('bloqueado=true impide confirmar y cerrar', () => {
        const component = new SelectorVisibilidadPersonajeModalComponent();
        component.seleccion = true;
        component.bloqueado = true;

        const confirmarSpy = jasmine.createSpy('confirmar');
        const cerrarSpy = jasmine.createSpy('cerrar');
        component.confirmar.subscribe(confirmarSpy);
        component.cerrar.subscribe(cerrarSpy);

        component.onConfirmar();
        component.onCerrar();

        expect(confirmarSpy).not.toHaveBeenCalled();
        expect(cerrarSpy).not.toHaveBeenCalled();
    });
});
