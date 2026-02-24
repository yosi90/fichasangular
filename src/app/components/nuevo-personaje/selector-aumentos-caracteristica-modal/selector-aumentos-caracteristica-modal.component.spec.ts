import { SelectorAumentosCaracteristicaModalComponent } from './selector-aumentos-caracteristica-modal.component';

describe('SelectorAumentosCaracteristicaModalComponent', () => {
    let component: SelectorAumentosCaracteristicaModalComponent;

    beforeEach(() => {
        component = new SelectorAumentosCaracteristicaModalComponent();
        component.pendientes = [
            { id: 1, valor: 1, origen: 'Progresion', descripcion: 'Aumento por nivel' },
            { id: 2, valor: 2, origen: 'Especial', descripcion: 'Aumento por especial' },
        ];
        component.caracteristicasActuales = {
            Fuerza: 10,
            Destreza: 11,
            Constitucion: 12,
            Inteligencia: 12,
            Sabiduria: 9,
            Carisma: 8,
        };
        component.caracteristicasPerdidas = {};
        component.topesCaracteristicas = {};
    });

    it('no permite confirmar con aumentos sin asignar', () => {
        const emitSpy = spyOn(component.confirmar, 'emit');
        component.onConfirmar();
        expect(emitSpy).not.toHaveBeenCalled();
        expect(component.cantidadPendiente).toBe(2);
    });

    it('permite asignar y desasignar un aumento', () => {
        component.onAsignarPendiente(1, 'Fuerza');
        expect(component.getAsignacionPendiente(1)).toBe('Fuerza');

        component.onLimpiarPendiente(1);
        expect(component.getAsignacionPendiente(1)).toBe('');
    });

    it('bloquea asignar en caracteristicas perdidas', () => {
        component.caracteristicasPerdidas = { Constitucion: true };
        component.onAsignarPendiente(1, 'Constitucion');
        expect(component.getAsignacionPendiente(1)).toBe('');
    });

    it('muestra aviso de tope y aun permite confirmar', () => {
        component.topesCaracteristicas = { Inteligencia: 12 };
        component.onAsignarPendiente(1, 'Inteligencia');
        component.onAsignarPendiente(2, 'Fuerza');

        expect(component.tieneAvisoTope('Inteligencia')).toBeTrue();
        expect(component.puedeConfirmar).toBeTrue();

        const emitSpy = spyOn(component.confirmar, 'emit');
        component.onConfirmar();
        expect(emitSpy).toHaveBeenCalledWith([
            { idPendiente: 1, caracteristica: 'Inteligencia' },
            { idPendiente: 2, caracteristica: 'Fuerza' },
        ]);
    });

    it('Enter confirma solo cuando está habilitado', () => {
        const emitSpy = spyOn(component.confirmar, 'emit');

        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(emitSpy).not.toHaveBeenCalled();

        component.onAsignarPendiente(1, 'Fuerza');
        component.onAsignarPendiente(2, 'Destreza');
        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(emitSpy).toHaveBeenCalledWith([
            { idPendiente: 1, caracteristica: 'Fuerza' },
            { idPendiente: 2, caracteristica: 'Destreza' },
        ]);
    });
});
