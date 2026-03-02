import { SelectorExtraHabilidadModalComponent } from './selector-extra-habilidad-modal.component';

describe('SelectorExtraHabilidadModalComponent', () => {
    let component: SelectorExtraHabilidadModalComponent;

    beforeEach(() => {
        component = new SelectorExtraHabilidadModalComponent();
    });

    it('filtra opciones por texto en nombre y descripcion', () => {
        component.opciones = [
            { valor: 'Planos', descripcion: 'Conocimiento extraplanar' },
            { valor: 'Religion', descripcion: 'Fe y liturgias' },
            { valor: 'Nobleza', descripcion: 'Linajes y blasones' },
        ];

        component.filtroTexto = 'litu';

        expect(component.opcionesFiltradas.map((item) => item.valor)).toEqual(['Religion']);
    });

    it('solo confirma cuando hay seleccion valida', () => {
        component.opciones = [
            { valor: 'Planos', descripcion: '' },
            { valor: 'Religion', descripcion: '' },
        ];
        const confirmarSpy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();
        expect(confirmarSpy).not.toHaveBeenCalled();

        component.seleccionarOpcion('Planos');
        component.onConfirmar();
        expect(confirmarSpy).toHaveBeenCalledWith('Planos');
    });

    it('emite cerrar al cancelar', () => {
        const cerrarSpy = spyOn(component.cerrar, 'emit');

        component.onCerrar();

        expect(cerrarSpy).toHaveBeenCalled();
    });
});
