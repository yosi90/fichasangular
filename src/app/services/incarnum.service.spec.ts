import { of } from 'rxjs';
import { EscuchaRtdb } from './catalogo-api';
import { IncarnumService } from './incarnum.service';

describe('IncarnumService', () => {
    function crear(escuchar: EscuchaRtdb, respuestaApi: any) {
        const http = { get: jasmine.createSpy('get').and.returnValue(of(respuestaApi)) };
        const svc = new IncarnumService({} as any, http as any, {} as any);
        spyOn<any>(svc, 'escuchar').and.returnValue(escuchar);
        return { svc, http };
    }

    const chakrasApi = [
        { Id: 2, Nombre: 'Pies', Orden: 2, Categoria: { Id: 1, Nombre: 'Menor', Orden: 1 } },
        { Id: 1, Nombre: 'Corona', Orden: 1, Categoria: { Id: 1, Nombre: 'Menor', Orden: 1 } },
    ];

    it('si la RTDB niega la lectura de los chakras, los pide a la API (antes: «permiso denegado» en el listado)', () => {
        const denegada: EscuchaRtdb = (_onNext, onError) => {
            onError(new Error('permission_denied at /Chakras'));
            return () => undefined;
        };
        const { svc, http } = crear(denegada, chakrasApi);
        const recibidos: string[][] = [];
        const errores: any[] = [];

        svc.getChakras().subscribe({ next: (chakras) => recibidos.push(chakras.map((c) => c.Nombre)), error: (e) => errores.push(e) });

        expect(http.get).toHaveBeenCalledTimes(1);
        expect(`${http.get.calls.mostRecent().args[0]}`).toContain('incarnum/chakras');
        expect(recibidos).toEqual([['Corona', 'Pies']]);
        expect(errores).toEqual([]);
    });

    it('si la RTDB niega la lectura de las fusiones, las pide a la API', () => {
        const denegada: EscuchaRtdb = (_onNext, onError) => {
            onError(new Error('permission_denied at /Fusiones'));
            return () => undefined;
        };
        const { svc, http } = crear(denegada, [{ Id: 7, Nombre: 'Yelmo de cristal' }]);
        const recibidos: string[][] = [];

        svc.getFusiones().subscribe((fusiones) => recibidos.push(fusiones.map((f) => f.Nombre)));

        expect(`${http.get.calls.mostRecent().args[0]}`).toContain('incarnum/fusiones');
        expect(recibidos).toEqual([['Yelmo de cristal']]);
    });
});
