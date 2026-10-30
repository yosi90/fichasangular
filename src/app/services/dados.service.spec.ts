import { BehaviorSubject } from 'rxjs';
import { DadosService } from './dados.service';
import { EstadoPlataforma } from './platform-session.service';
import { MAXIMO_HISTORIAL_DADOS } from './utils/dados';

describe('DadosService', () => {
    let estado$: BehaviorSubject<EstadoPlataforma>;
    let servicio: DadosService;

    const conSesion = (id: string): EstadoPlataforma => ({ tipo: 'con_sesion', cuenta: { id, alias: id, correo: null } });

    beforeEach(() => {
        estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'comprobando' });
        servicio = new DadosService({ estado$ } as any);
        servicio.fuente = (destino) => { destino[0] = 3; };
    });

    afterEach(() => servicio.ngOnDestroy());

    it('prepara la tirada, la tira y la apunta en el historial; limpiar deja el resultado', () => {
        servicio.anadir(6);
        servicio.anadir(6);
        servicio.cambiarBonificador(2);
        const resultado = servicio.tirar();
        expect(resultado?.total).toBe(10);
        expect(servicio.estado.ultimo).toBe(resultado);
        expect(servicio.estado.historial).toEqual([resultado!]);
        servicio.limpiar();
        expect(servicio.estado.tirada.reserva[6]).toBe(0);
        expect(servicio.estado.tirada.bonificador).toBe(0);
        expect(servicio.estado.ultimo).toBe(resultado);
    });

    it('sin dados no tira ni apunta nada', () => {
        servicio.cambiarBonificador(4);
        expect(servicio.tirar()).toBeNull();
        expect(servicio.estado.historial.length).toBe(0);
    });

    it('quitar no baja de 0', () => {
        servicio.quitar(20);
        expect(servicio.estado.tirada.reserva[20]).toBe(0);
        servicio.anadir(20);
        servicio.quitar(20);
        expect(servicio.estado.tirada.reserva[20]).toBe(0);
    });

    it('el historial guarda como mucho 50 y «Borrar historial» lo vacía', () => {
        servicio.anadir(4);
        for (let i = 0; i < 60; i++)
            servicio.tirar();
        expect(servicio.estado.historial.length).toBe(MAXIMO_HISTORIAL_DADOS);
        servicio.borrarHistorial();
        expect(servicio.estado.historial.length).toBe(0);
        expect(servicio.estado.ultimo).not.toBeNull();
    });

    it('al cambiar de cuenta se borra todo: A → B → A, y también al entrar o al cerrar sesión', () => {
        estado$.next(conSesion('a'));
        servicio.anadir(8);
        servicio.tirar();
        estado$.next(conSesion('a'));
        expect(servicio.estado.historial.length).toBe(1);

        estado$.next(conSesion('b'));
        expect(servicio.estado.historial.length).toBe(0);
        expect(servicio.estado.ultimo).toBeNull();
        expect(servicio.estado.tirada.reserva[8]).toBe(0);

        servicio.anadir(8);
        servicio.tirar();
        estado$.next(conSesion('a'));
        expect(servicio.estado.historial.length).toBe(0);

        servicio.anadir(8);
        servicio.tirar();
        estado$.next({ tipo: 'sin_sesion' });
        expect(servicio.estado.historial.length).toBe(0);

        servicio.anadir(8);
        servicio.tirar();
        estado$.next(conSesion('c'));
        expect(servicio.estado.historial.length).toBe(0);
    });

    it('sin red o mientras se comprueba la sesión no borra nada', () => {
        estado$.next(conSesion('a'));
        servicio.anadir(8);
        servicio.tirar();
        estado$.next({ tipo: 'no_disponible' });
        estado$.next({ tipo: 'comprobando' });
        estado$.next(conSesion('a'));
        expect(servicio.estado.historial.length).toBe(1);
    });

    it('no guarda nada en localStorage', () => {
        const guardar = spyOn(Storage.prototype, 'setItem');
        servicio.anadir(6);
        servicio.tirar();
        expect(guardar).not.toHaveBeenCalled();
    });
});
