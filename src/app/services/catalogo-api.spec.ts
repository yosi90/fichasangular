import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { EscuchaRtdb, LecturaCacheOApi, cacheRtdbOApi } from './catalogo-api';

describe('cacheRtdbOApi', () => {
    let emitir: (snapshot: any) => void;
    let fallarRtdb: (error: any) => void;
    let dejarDeEscuchar: jasmine.Spy;

    const escuchar: EscuchaRtdb = (onNext, onError) => {
        emitir = onNext;
        fallarRtdb = onError;
        return dejarDeEscuchar;
    };

    function snapshot(valor: any, existe = true): any {
        return { exists: () => existe, val: () => valor };
    }

    function lectura(extra: Partial<LecturaCacheOApi<string>> = {}): LecturaCacheOApi<string> {
        return {
            escuchar,
            desdeCache: (s) => `cache:${s.val()}`,
            pedir: () => of('api'),
            desdeApi: (raw) => `api:${raw}`,
            ...extra,
        };
    }

    beforeEach(() => {
        dejarDeEscuchar = jasmine.createSpy('dejarDeEscuchar');
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    it('con la caché, emite su mapper y no pide la API', () => {
        const pedir = jasmine.createSpy('pedir').and.returnValue(of('api'));
        const valores: string[] = [];
        const sub = cacheRtdbOApi(lectura({ pedir })).subscribe((v) => valores.push(v));

        emitir(snapshot('a'));
        emitir(snapshot('b'));
        sub.unsubscribe();

        expect(valores).toEqual(['cache:a', 'cache:b']);
        expect(pedir).not.toHaveBeenCalled();
        expect(dejarDeEscuchar).toHaveBeenCalledTimes(1);
    });

    it('sin la caché, pide la API y emite su mapper', () => {
        const valores: string[] = [];
        cacheRtdbOApi(lectura()).subscribe((v) => valores.push(v));

        emitir(snapshot(null, false));

        expect(valores).toEqual(['api:api']);
    });

    it('si la API da 404, enseña el aviso de no encontrado y termina con el error', () => {
        const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
        const errores: any[] = [];
        cacheRtdbOApi(lectura({
            pedir: () => throwError(() => error),
            avisos: { noEncontrado: { titulo: 'No está', texto: 'No existe el 3' }, error: 'Error al obtener' },
        })).subscribe({ error: (e) => errores.push(e) });

        emitir(snapshot(null, false));

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'warning', title: 'No está', text: 'No existe el 3' }));
        expect(errores).toEqual([error]);
    });

    it('si la API falla de otra forma, enseña el aviso con el mensaje del error', () => {
        const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error', url: '/x' });
        cacheRtdbOApi(lectura({
            pedir: () => throwError(() => error),
            avisos: { noEncontrado: { titulo: 'No está', texto: 'No existe' }, error: 'Error al obtener' },
        })).subscribe({ error: () => undefined });

        emitir(snapshot(null, false));

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Error al obtener', text: error.message }));
    });

    it('sin avisos, el error solo llega a quien se suscribe', () => {
        const errores: any[] = [];
        cacheRtdbOApi(lectura({ pedir: () => throwError(() => new HttpErrorResponse({ status: 404 })) }))
            .subscribe({ error: (e) => errores.push(e) });

        emitir(snapshot(null, false));

        expect(Swal.fire).not.toHaveBeenCalled();
        expect(errores.length).toBe(1);
    });

    it('sirveLaCache y cacheIncompleta deciden cuándo ir a la API', () => {
        const valores: string[] = [];
        cacheRtdbOApi(lectura({
            sirveLaCache: (s) => s.val() !== 'resumen',
            cacheIncompleta: (v) => v === 'cache:vacia',
        })).subscribe((v) => valores.push(v));

        emitir(snapshot('resumen'));
        emitir(snapshot('vacia'));
        emitir(snapshot('detalle'));

        expect(valores).toEqual(['api:api', 'api:api', 'cache:detalle']);
    });

    it('con unaPeticionALaVez no repite la petición hasta que termina, y avisa antes de pedir', () => {
        const respuesta = new Subject<string>();
        const pedir = jasmine.createSpy('pedir').and.returnValue(respuesta);
        const alIrALaApi = jasmine.createSpy('alIrALaApi');
        const valores: string[] = [];
        cacheRtdbOApi(lectura({ pedir, unaPeticionALaVez: true, alIrALaApi })).subscribe((v) => valores.push(v));

        emitir(snapshot(null, false));
        emitir(snapshot(null, false));
        expect(pedir).toHaveBeenCalledTimes(1);
        expect(alIrALaApi).toHaveBeenCalledTimes(1);

        respuesta.next('uno');
        respuesta.complete();
        emitir(snapshot(null, false));
        expect(pedir).toHaveBeenCalledTimes(2);
        expect(valores).toEqual(['api:uno']);
    });

    it('un error de la RTDB termina con ese error', () => {
        const errores: any[] = [];
        cacheRtdbOApi(lectura()).subscribe({ error: (e) => errores.push(e) });

        fallarRtdb('sin permiso');

        expect(errores).toEqual(['sin permiso']);
    });
});
