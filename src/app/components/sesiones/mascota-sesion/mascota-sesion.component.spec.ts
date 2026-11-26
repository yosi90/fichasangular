import { of, throwError } from 'rxjs';
import { construirCatalogoCompanerosDesdeMonstruos } from 'src/app/services/utils/companero-reglas';
import { construirCatalogoFamiliaresDesdeMonstruos } from 'src/app/services/utils/familiar-reglas';
import { MascotaSesionComponent } from './mascota-sesion.component';

describe('MascotaSesionComponent («Obtener» una mascota en la sesión)', () => {
    const fila = (mascota: string) => ({ Clase: { Id: 9, Nombre: 'Mago' }, Nivel: 1, Ajuste: 0, Ataque_base_minimo: null, Plantilla: { Id: 1, Nombre: 'Básica' }, Mascota: mascota });
    const gato = { Id: 11, Nombre: 'Gato', Familiar: true, Companero: false, Niveles_clase: [fila('familiar')], Oficial: true } as any;
    const lobo = { Id: 48, Nombre: 'Lobo', Familiar: false, Companero: true, Niveles_clase: [fila('companero')], Oficial: true } as any;

    /** El componente sin plantilla ni constructor: solo lo que usa `elegirMascota`. */
    function crear(mascota: 'familiar' | 'companero') {
        const componente = Object.create(MascotaSesionComponent.prototype) as any;
        const getMonstruosMascota = jasmine.createSpy('getMonstruosMascota')
            .and.callFake((tipo: string) => of(tipo === 'familiar' ? [gato] : [lobo]));
        componente.monstruoSvc = { getMonstruosMascota };
        componente.pj = { Id: 5, Nombre: 'Tordek' };
        componente.mascota = mascota;
        componente.eligiendo = false;
        componente.error = '';
        componente.elegirFamiliar = jasmine.createSpy('elegirFamiliar').and.resolveTo(false);
        componente.elegirCompanero = jasmine.createSpy('elegirCompanero').and.resolveTo(false);
        return { componente, getMonstruosMascota };
    }

    it('el familiar se elige del detalle de los monstruos que pueden ser familiar', async () => {
        const { componente, getMonstruosMascota } = crear('familiar');

        await componente.elegirMascota();

        expect(getMonstruosMascota).toHaveBeenCalledOnceWith('familiar');
        expect(componente.elegirFamiliar).toHaveBeenCalledOnceWith(construirCatalogoFamiliaresDesdeMonstruos([gato]));
        expect(componente.elegirFamiliar.calls.mostRecent().args[0].map((familiar: any) => familiar.Id)).toEqual([11]);
        expect(componente.elegirCompanero).not.toHaveBeenCalled();
        expect(componente.error).toBe('');
    });

    it('el compañero, del de los que pueden ser compañero', async () => {
        const { componente, getMonstruosMascota } = crear('companero');

        await componente.elegirMascota();

        expect(getMonstruosMascota).toHaveBeenCalledOnceWith('companero');
        expect(componente.elegirCompanero).toHaveBeenCalledOnceWith(construirCatalogoCompanerosDesdeMonstruos([lobo]));
        expect(componente.elegirFamiliar).not.toHaveBeenCalled();
    });

    it('si no se puede leer ninguno, lo dice', async () => {
        const { componente, getMonstruosMascota } = crear('familiar');
        getMonstruosMascota.and.returnValue(throwError(() => new Error('No se ha podido leer ningún monstruo de las mascotas.')));

        await componente.elegirMascota();

        expect(componente.error).toBe('No se ha podido leer ningún monstruo de las mascotas.');
        expect(componente.eligiendo).toBeFalse();
    });
});
