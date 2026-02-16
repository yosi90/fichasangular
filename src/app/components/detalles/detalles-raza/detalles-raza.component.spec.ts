import { DetallesRazaComponent } from './detalles-raza.component';
import { Raza } from 'src/app/interfaces/raza';
import { createRacialPlaceholder } from 'src/app/services/utils/racial-mapper';

describe('DetallesRazaComponent', () => {
    let component: DetallesRazaComponent;

    beforeEach(() => {
        component = new DetallesRazaComponent();
        component.raza = {
            Raciales: [
                createRacialPlaceholder('Sangre antigua', 7),
                createRacialPlaceholder('Vision en la oscuridad', 3),
            ],
        } as unknown as Raza;
    });

    it('emite referencia estructurada al abrir una racial', () => {
        const emitSpy = spyOn(component.racialDetallesPorNombre, 'emit');
        component.abrirDetalleRacial(component.raza.Raciales[0]);
        expect(emitSpy).toHaveBeenCalledWith({
            id: 7,
            nombre: 'Sangre antigua',
        });
    });

    it('lista raciales visibles ordenadas por nombre', () => {
        const nombres = component.getRacialesActivos().map(r => r.Nombre);
        expect(nombres).toEqual(['Sangre antigua', 'Vision en la oscuridad']);
    });
});
