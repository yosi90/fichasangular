import { of } from 'rxjs';
import { MonstruoIndice } from '../interfaces/monstruo';
import { BuscadorGlobalService } from './buscador-global.service';

/** Un servicio de catálogo cualquiera: cada método da una lista vacía. */
function catalogoVacio(): any {
    return new Proxy({}, { get: () => () => of([]) });
}

describe('BuscadorGlobalService', () => {
    const lobo: MonstruoIndice = {
        Id: 3, Nombre: 'Lobo', Manual: { Id: 1, Nombre: 'Manual de monstruos 1', Pagina: 271 },
        Tipo: { Id: 2, Nombre: 'Animal' }, Tamano: { Id: 4, Nombre: 'Mediano' }, Valor_desafio: '1',
        Familiar: false, Companero: true, Oficial: true,
    };

    function crear(monstruos: any, navegacion: any) {
        const stub = catalogoVacio;
        return new BuscadorGlobalService(
            navegacion, stub(), { getPersonajes: () => Promise.resolve(of([])) } as any,
            stub(), stub(), stub(), stub(), monstruos, stub(), stub(), stub(), stub(), stub(), stub(), stub(), stub(),
            stub(), stub(), stub(), stub(), stub(), stub(),
        );
    }

    it('busca los monstruos en el índice ligero y abre la entrada del índice', () => {
        const monstruos = { getMonstruosIndice: jasmine.createSpy('getMonstruosIndice').and.returnValue(of([lobo])) };
        const navegacion = { abrir: jasmine.createSpy('abrir') };
        const servicio = crear(monstruos, navegacion);

        servicio.cargarFuentes();
        let fuente: any = null;
        servicio.fuentes$.subscribe((fuentes) => fuente = fuentes.find((f) => f.id === 'monstruos'));

        expect(monstruos.getMonstruosIndice).toHaveBeenCalledTimes(1);
        expect(fuente?.estado).toBe('lista');
        expect(fuente?.elementos.map((e: any) => [e.clave, e.nombre, e.subtitulo])).toEqual([['monstruos:3', 'Lobo', 'Manual de monstruos 1']]);

        fuente.elementos[0].abrir();
        expect(navegacion.abrir).toHaveBeenCalledOnceWith({ clase: 'detalle', lista: 'monstruos', item: lobo });
    });
});
