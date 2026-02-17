import { SimpleChange } from '@angular/core';
import { SelectorRazaBaseModalComponent } from './selector-raza-base-modal.component';
import { Raza } from 'src/app/interfaces/raza';

function crearRaza(id: number, nombre: string, oficial = true): Raza {
    return {
        Id: id,
        Nombre: nombre,
        Oficial: oficial,
    } as unknown as Raza;
}

describe('SelectorRazaBaseModalComponent', () => {
    let component: SelectorRazaBaseModalComponent;

    beforeEach(() => {
        component = new SelectorRazaBaseModalComponent();
        component.candidatas = [
            {
                raza: crearRaza(1, 'Humano', true),
                estado: 'eligible',
                advertencias: [],
            },
            {
                raza: crearRaza(2, 'Elfo lunar', false),
                estado: 'eligible_with_warning',
                advertencias: ['Formato de prerequisito no reconocido'],
            },
        ];
        component.ngOnChanges({
            candidatas: new SimpleChange([], component.candidatas, true),
        } as any);
    });

    it('filtra homebrew cuando el toggle esta desactivado', () => {
        component.incluirHomebrew = false;
        expect(component.candidatasVisibles.length).toBe(1);
        expect(component.candidatasVisibles[0].raza.Nombre).toBe('Humano');
    });

    it('incluye homebrew cuando el toggle esta activado', () => {
        component.incluirHomebrew = true;
        component.ngOnChanges({
            incluirHomebrew: new SimpleChange(false, true, false),
        } as any);
        expect(component.candidatasVisibles.length).toBe(2);
    });

    it('emite cambio de homebrew y limpia seleccion', () => {
        const spy = spyOn(component.incluirHomebrewChange, 'emit');
        component.razaSeleccionadaId = 1;
        component.seleccionActual = component.candidatas[0];

        component.onToggleHomebrew();

        expect(spy).toHaveBeenCalledWith(true);
        expect(component.razaSeleccionadaId).toBeNull();
        expect(component.seleccionActual).toBeNull();
    });

    it('emite raza seleccionada al confirmar', () => {
        component.incluirHomebrew = true;
        component.onFiltroChange('');
        const candidata = component.candidatasVisibles.find((c) => c.raza.Id === 2)!;
        component.onSeleccionar(candidata);
        const spy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();

        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ Id: 2, Nombre: 'Elfo lunar' }));
    });

    it('emite evento info al pulsar boton de ayuda', () => {
        const spy = spyOn(component.info, 'emit');

        component.onInfo();

        expect(spy).toHaveBeenCalled();
    });

    it('expone chips de ajuste y DGs solo cuando hay valores positivos', () => {
        const conBonos = {
            ...crearRaza(7, 'Draconido', true),
            Ajuste_nivel: 2,
            Dgs_adicionales: { Cantidad: 3 },
        } as unknown as Raza;
        const sinBonos = crearRaza(8, 'Humano', true);

        expect(component.getAjusteNivel(conBonos)).toBe(2);
        expect(component.getDgsExtra(conBonos)).toBe(3);
        expect(component.getAjusteNivel(sinBonos)).toBe(0);
        expect(component.getDgsExtra(sinBonos)).toBe(0);
    });
});
