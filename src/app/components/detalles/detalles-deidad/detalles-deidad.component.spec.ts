import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesDeidadComponent } from './detalles-deidad.component';

describe('DetallesDeidadComponent', () => {
    let component: DetallesDeidadComponent;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;

    beforeEach(() => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        component = new DetallesDeidadComponent(manualNavSpy);
        component.deidad = {
            Id: 1,
            Nombre: 'Heironeous',
            Descripcion: 'Deidad del valor.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 106 },
            Alineamiento: { Id: 3, Id_basico: 3, Nombre: 'Legal bueno' },
            Arma: { Id: 4, Nombre: 'Espada larga' },
            Pabellon: { Id: 5, Nombre: 'Bien' },
            Genero: { Id: 6, Nombre: 'Masculino' },
            Ambitos: [{ Id: 7, Nombre: 'Guerra' }],
            Dominios: [{ Id: 8, Nombre: 'Bien', Oficial: true }],
            Oficial: false,
        };
    });

    it('expone la etiqueta de manual con página', () => {
        expect(component.manualLabel).toBe('Manual base (p. 106)');
    });

    it('abre el detalle del manual', () => {
        component.abrirDetalleManual();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });

    it('emite detalle de arma cuando el arma predilecta es navegable', () => {
        const emitSpy = spyOn(component.armaDetallesId, 'emit');
        component.abrirDetallesArma();
        expect(emitSpy).toHaveBeenCalledWith(4);
    });
});
