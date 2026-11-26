import { NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BloqueAjustes, EstadoPlataforma, PlatformSessionService } from '../platform-session.service';
import { CLAVE_MODO, CLAVE_TEMA_SIN_CUENTA, CLAVE_TEMA_ULTIMO, TemaWebService } from './tema-web.service';
import { TEMAS_WEB, modoEfectivo } from './temas-web';

/** Una promesa que la prueba resuelve cuando quiere (la respuesta de la plataforma que llega tarde). */
function diferida<T>() {
    let resolver!: (valor: T) => void;
    let rechazar!: (error: unknown) => void;
    const promesa = new Promise<T>((res, rej) => { resolver = res; rechazar = rej; });
    return { promesa, resolver, rechazar };
}

const conSesion = (id: string): EstadoPlataforma => ({ tipo: 'con_sesion', cuenta: { id, alias: id, correo: null } });
const bloque = (documento: Record<string, unknown>): BloqueAjustes => ({ version: 1, documento });

describe('TemaWebService', () => {
    let estado$: BehaviorSubject<EstadoPlataforma>;
    let sesion: jasmine.SpyObj<PlatformSessionService> & { estado$: BehaviorSubject<EstadoPlataforma> };
    let servicio: TemaWebService;
    const raiz = document.documentElement;
    const atributos = ['tema', 'modo', 'iconos', 'theme'];
    let antes: Record<string, string | undefined>;

    function crear(): TemaWebService {
        servicio = new TemaWebService(sesion, new NgZone({ enableLongStackTrace: false }), document, true);
        return servicio;
    }

    beforeEach(() => {
        localStorage.clear();
        antes = Object.fromEntries(atributos.map((a) => [a, raiz.dataset[a]]));
        estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'comprobando' });
        sesion = Object.assign(
            jasmine.createSpyObj<PlatformSessionService>('PlatformSessionService', ['leerAjustes', 'guardarAjustes']),
            { estado$ },
        );
        sesion.leerAjustes.and.resolveTo(bloque({}));
        sesion.guardarAjustes.and.callFake(async (cambios) => bloque(cambios));
    });

    afterEach(() => {
        servicio?.ngOnDestroy();
        localStorage.clear();
        atributos.forEach((a) => {
            if (antes[a] === undefined)
                delete raiz.dataset[a];
            else
                raiz.dataset[a] = antes[a]!;
        });
    });

    it('apagados en el entorno (producción hasta terminar los tres): A en oscuro, sin leer nada ni bienvenida', () => {
        localStorage.setItem('rol.tema.ultimo', 'b');
        servicio = new TemaWebService(sesion, new NgZone({ enableLongStackTrace: false }), document, false);
        estado$.next({ tipo: 'con_sesion', cuenta: { id: 'cuenta-1' } } as unknown as EstadoPlataforma);
        expect(servicio.activos).toBeFalse();
        expect(raiz.dataset['tema']).toBe('a');
        expect(raiz.dataset['modo']).toBe('oscuro');
        expect(servicio.estado.bienvenida).toBe('no');
        expect(sesion.leerAjustes).not.toHaveBeenCalled();
    });

    it('sin nada guardado pinta A en oscuro y avisa al SDK con data-theme="dark"', () => {
        crear();
        expect(raiz.dataset['tema']).toBe('a');
        expect(raiz.dataset['modo']).toBe('oscuro');
        expect(raiz.dataset['iconos']).toBe('criterio');
        expect(raiz.dataset['theme']).toBe('dark');
        expect(servicio.estado.bienvenida).toBe('esperando');
    });

    it('la primera pintura usa el último tema de este navegador, antes de saber la cuenta', () => {
        localStorage.setItem(CLAVE_TEMA_ULTIMO, 'c');
        crear();
        expect(raiz.dataset['tema']).toBe('c');
    });

    it('sin sesión: A o lo elegido en este navegador sin cuenta, sin bienvenida ni ajustes', async () => {
        localStorage.setItem(CLAVE_TEMA_SIN_CUENTA, 'b');
        crear();
        estado$.next({ tipo: 'sin_sesion' });
        expect(raiz.dataset['tema']).toBe('b');
        expect(raiz.dataset['iconos']).toBe('minimos');
        expect(servicio.estado.bienvenida).toBe('no');

        await servicio.elegirTema('c');
        expect(localStorage.getItem(CLAVE_TEMA_SIN_CUENTA)).toBe('c');
        expect(sesion.leerAjustes).not.toHaveBeenCalled();
        expect(sesion.guardarAjustes).not.toHaveBeenCalled();
    });

    it('con sesión lee el tema de los ajustes de la cuenta y guarda su copia local', async () => {
        sesion.leerAjustes.and.resolveTo(bloque({ tema: 'c', perfil: {} }));
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        expect(raiz.dataset['tema']).toBe('c');
        expect(localStorage.getItem('rol.tema.ana')).toBe('c');
        expect(servicio.estado.bienvenida).toBe('no');
    });

    it('pinta la copia local de la cuenta mientras llegan sus ajustes', async () => {
        localStorage.setItem('rol.tema.ana', 'b');
        const lectura = diferida<BloqueAjustes | null>();
        sesion.leerAjustes.and.returnValue(lectura.promesa);
        crear();
        estado$.next(conSesion('ana'));
        expect(raiz.dataset['tema']).toBe('b');
        expect(servicio.estado.bienvenida).toBe('esperando');
        lectura.resolver(bloque({ tema: 'b' }));
        await lectura.promesa;
        await Promise.resolve();
        expect(servicio.estado.bienvenida).toBe('no');
    });

    it('sin tema en los ajustes ni en el navegador, toca la bienvenida', async () => {
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        expect(servicio.estado.bienvenida).toBe('pendiente');
        expect(raiz.dataset['tema']).toBe('a');
    });

    it('si eligió en este navegador y no llegó a la plataforma, no hay bienvenida y se sube', async () => {
        localStorage.setItem('rol.tema.ana', 'c');
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        expect(servicio.estado.bienvenida).toBe('no');
        expect(sesion.guardarAjustes).toHaveBeenCalledOnceWith({ tema: 'c' });
    });

    it('si no se pueden leer los ajustes, no pregunta y se queda lo de este navegador', async () => {
        sesion.leerAjustes.and.rejectWith(new Error('sin red'));
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        expect(servicio.estado.bienvenida).toBe('no');
        expect(raiz.dataset['tema']).toBe('a');
    });

    it('elegir un tema con sesión lo guarda en los ajustes (clave tema) y en la copia de la cuenta', async () => {
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        await servicio.elegirTema('b');
        expect(sesion.guardarAjustes).toHaveBeenCalledOnceWith({ tema: 'b' });
        expect(localStorage.getItem('rol.tema.ana')).toBe('b');
        expect(localStorage.getItem(CLAVE_TEMA_ULTIMO)).toBe('b');
        expect(raiz.dataset['tema']).toBe('b');
        expect(servicio.estado.bienvenida).toBe('no');
    });

    it('si guardar en la plataforma falla, el tema se queda en el navegador y el error llega a quien elige', async () => {
        sesion.guardarAjustes.and.rejectWith(new Error('sin red'));
        crear();
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        await Promise.resolve();
        await expectAsync(servicio.elegirTema('c')).toBeRejected();
        expect(localStorage.getItem('rol.tema.ana')).toBe('c');
        expect(raiz.dataset['tema']).toBe('c');
    });

    it('al cambiar de cuenta pinta la de la nueva y descarta los ajustes que llegan tarde de la anterior', async () => {
        localStorage.setItem('rol.tema.bea', 'c');
        const deAna = diferida<BloqueAjustes | null>();
        const deBea = diferida<BloqueAjustes | null>();
        sesion.leerAjustes.and.returnValues(deAna.promesa, deBea.promesa);
        crear();
        estado$.next(conSesion('ana'));
        expect(raiz.dataset['tema']).toBe('a');

        estado$.next(conSesion('bea'));
        expect(raiz.dataset['tema']).toBe('c');

        deAna.resolver(bloque({ tema: 'b' }));
        await deAna.promesa;
        await Promise.resolve();
        expect(raiz.dataset['tema']).toBe('c');
        expect(localStorage.getItem('rol.tema.ana')).toBeNull();

        deBea.resolver(bloque({ tema: 'c' }));
        await deBea.promesa;
        await Promise.resolve();
        expect(raiz.dataset['tema']).toBe('c');
        expect(servicio.estado.bienvenida).toBe('no');
    });

    it('A → B → A: al volver a la primera cuenta, su tema otra vez', async () => {
        sesion.leerAjustes.and.callFake(async () => bloque({ tema: estado$.value.tipo === 'con_sesion' && estado$.value.cuenta.id === 'ana' ? 'b' : 'c' }));
        crear();
        estado$.next(conSesion('ana'));
        await new Promise((r) => setTimeout(r));
        expect(raiz.dataset['tema']).toBe('b');
        estado$.next(conSesion('bea'));
        await new Promise((r) => setTimeout(r));
        expect(raiz.dataset['tema']).toBe('c');
        estado$.next(conSesion('ana'));
        await new Promise((r) => setTimeout(r));
        expect(raiz.dataset['tema']).toBe('b');
        expect(sesion.leerAjustes).toHaveBeenCalledTimes(3);
    });

    it('el mismo estado de la misma cuenta no vuelve a leer los ajustes', async () => {
        crear();
        estado$.next(conSesion('ana'));
        estado$.next(conSesion('ana'));
        await Promise.resolve();
        expect(sesion.leerAjustes).toHaveBeenCalledTimes(1);
    });

    it('el modo se guarda solo en el navegador; «sistema» quita la preferencia', () => {
        crear();
        servicio.elegirModo('claro');
        expect(localStorage.getItem(CLAVE_MODO)).toBe('claro');
        expect(servicio.estado.modo).toBe('claro');
        servicio.elegirModo('sistema');
        expect(localStorage.getItem(CLAVE_MODO)).toBeNull();
        expect(sesion.guardarAjustes).not.toHaveBeenCalled();
    });

    it('mientras el claro de un tema no está listo, se pinta en oscuro aunque se elija claro', () => {
        localStorage.setItem(CLAVE_MODO, 'claro');
        crear();
        expect(servicio.estado.modo).toBe('claro');
        expect(raiz.dataset['modo']).toBe('oscuro');
        expect(raiz.dataset['theme']).toBe('dark');
    });

    it('la vista previa pinta otro tema sin guardarlo y se deshace', () => {
        crear();
        servicio.previsualizar('b');
        expect(raiz.dataset['tema']).toBe('b');
        expect(localStorage.getItem(CLAVE_TEMA_ULTIMO)).toBe('a');
        servicio.deshacerVistaPrevia();
        expect(raiz.dataset['tema']).toBe('a');
    });
});

describe('modoEfectivo', () => {
    it('sigue al sistema o a lo elegido solo cuando el claro del tema está listo', () => {
        // Hoy ningún tema tiene su claro: todos en oscuro.
        expect(modoEfectivo('a', 'claro', false)).toBe('oscuro');
        expect(modoEfectivo('b', 'sistema', false)).toBe('oscuro');
        expect(modoEfectivo('c', 'oscuro', true)).toBe('oscuro');
    });

    it('con el claro listo: «sistema» es el del dispositivo y lo elegido manda', () => {
        const a = TEMAS_WEB[0] as { claroListo: boolean };
        a.claroListo = true;
        try {
            expect(modoEfectivo('a', 'sistema', false)).toBe('claro');
            expect(modoEfectivo('a', 'sistema', true)).toBe('oscuro');
            expect(modoEfectivo('a', 'claro', true)).toBe('claro');
            expect(modoEfectivo('a', 'oscuro', false)).toBe('oscuro');
        } finally {
            a.claroListo = false;
        }
    });
});
