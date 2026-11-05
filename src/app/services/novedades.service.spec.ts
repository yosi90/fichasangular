import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { CLAVE_ABRIR_NOVEDADES_SIN_SESION, NovedadesService } from './novedades.service';
import { EstadoPlataforma } from './platform-session.service';

describe('NovedadesService', () => {
    let http: jasmine.SpyObj<any>;
    let estado$: BehaviorSubject<EstadoPlataforma>;
    let ajustes: jasmine.SpyObj<any>;
    let servicio: NovedadesService;

    beforeEach(() => {
        localStorage.removeItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION);
        http = jasmine.createSpyObj('HttpClient', ['get']);
        estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'comprobando' });
        ajustes = jasmine.createSpyObj('UserSettingsService', ['loadAbrirNovedadesAlEntrar', 'saveProfileSettings']);
        const plataforma = { estado$, get estado() { return estado$.value; } } as any;
        servicio = new NovedadesService(http, plataforma, ajustes);
    });

    afterEach(() => localStorage.removeItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION));

    it('lee una página con su total y si hay más, y descarta lo que no es una novedad o un enlace https', (done) => {
        http.get.and.returnValue(of(new HttpResponse({
            body: [
                { idExterno: 'rol-2', tipo: 'actualizacion', texto: 'Rol estrena algo.', enlace: 'https://rol.yosiftware.es/', fecha: '2026-10-31T17:10:59Z' },
                { idExterno: 'rol-1', tipo: 'arreglo', texto: 'Rol arregla algo.', enlace: 'javascript:alert(1)', fecha: '2026-10-30T10:00:00Z' },
                { idExterno: '', texto: 'sin id' },
            ],
            headers: new HttpHeaders({ 'X-Total-Count': '12', 'X-Has-More': 'true' }),
        })));

        servicio.getNovedades(10, 2).subscribe((pagina) => {
            const [url, opciones] = http.get.calls.mostRecent().args;
            expect(url).toMatch(/novedades$/);
            expect(opciones.params.get('limit')).toBe('2');
            expect(opciones.params.get('offset')).toBe('10');
            expect(pagina.total).toBe(12);
            expect(pagina.hayMas).toBeTrue();
            expect(pagina.novedades.map((n) => n.idExterno)).toEqual(['rol-2', 'rol-1']);
            expect(pagina.novedades[1].enlace).toBeNull();
            done();
        });
    });

    it('sin sesión decide con este navegador: por defecto se abre; apagada, no', fakeAsync(() => {
        let abrir: boolean | null = null;
        void servicio.abrirAlEntrar().then((valor) => abrir = valor);
        flushMicrotasks();
        expect(abrir).toBeNull();

        estado$.next({ tipo: 'sin_sesion' });
        flushMicrotasks();
        expect(abrir as boolean | null).toBeTrue();

        void servicio.guardarAbrirAlEntrar(false);
        expect(localStorage.getItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION)).toBe('0');
        void servicio.abrirAlEntrar().then((valor) => abrir = valor);
        flushMicrotasks();
        expect(abrir as boolean | null).toBeFalse();
        expect(ajustes.saveProfileSettings).not.toHaveBeenCalled();

        void servicio.guardarAbrirAlEntrar(true);
        expect(localStorage.getItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION)).toBeNull();
    }));

    it('con sesión decide con los ajustes de Rol de la plataforma y guarda allí', fakeAsync(() => {
        estado$.next({ tipo: 'con_sesion', cuenta: { id: 'a' } as any });
        ajustes.loadAbrirNovedadesAlEntrar.and.resolveTo(false);
        ajustes.saveProfileSettings.and.resolveTo({});
        localStorage.setItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION, '1');
        let abrir: boolean | null = null;

        void servicio.abrirAlEntrar().then((valor) => abrir = valor);
        flushMicrotasks();
        expect(abrir as boolean | null).toBeFalse();

        void servicio.guardarAbrirAlEntrar(true);
        expect(ajustes.saveProfileSettings).toHaveBeenCalledWith({ abrirNovedadesAlEntrar: true });
        expect(localStorage.getItem(CLAVE_ABRIR_NOVEDADES_SIN_SESION)).toBe('1');
    }));

    it('si no se puede leer la preferencia o la plataforma no contesta, se abre', fakeAsync(() => {
        estado$.next({ tipo: 'con_sesion', cuenta: { id: 'a' } as any });
        ajustes.loadAbrirNovedadesAlEntrar.and.rejectWith(new Error('sin red'));
        let abrir: boolean | null = null;
        void servicio.abrirAlEntrar().then((valor) => abrir = valor);
        flushMicrotasks();
        expect(abrir as boolean | null).toBeTrue();

        estado$.next({ tipo: 'comprobando' });
        abrir = null;
        void servicio.abrirAlEntrar().then((valor) => abrir = valor);
        tick(10000);
        flushMicrotasks();
        expect(abrir as boolean | null).toBeTrue();
    }));
});
