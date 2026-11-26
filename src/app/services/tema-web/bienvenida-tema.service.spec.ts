import { BehaviorSubject } from 'rxjs';
import { TurnoDeVentanasService } from '../turno-de-ventanas.service';
import { BienvenidaTemaService } from './bienvenida-tema.service';
import { BienvenidaTema, TemaWebService } from './tema-web.service';
import { VentanaTemaService } from './ventana-tema.service';

describe('BienvenidaTemaService', () => {
    let bienvenida$: BehaviorSubject<BienvenidaTema>;
    let temaWeb: TemaWebService;
    let ventana: jasmine.SpyObj<VentanaTemaService> & { estaAbierta: boolean };
    let turno: TurnoDeVentanasService;
    let cerrarVentana: () => void;
    let servicio: BienvenidaTemaService;

    beforeEach(() => {
        bienvenida$ = new BehaviorSubject<BienvenidaTema>('esperando');
        temaWeb = { bienvenida$, get estado() { return { bienvenida: bienvenida$.value }; } } as unknown as TemaWebService;
        ventana = Object.assign(jasmine.createSpyObj<VentanaTemaService>('VentanaTemaService', ['abrir']), { estaAbierta: false });
        ventana.abrir.and.callFake(() => {
            ventana.estaAbierta = true;
            return new Promise<void>((resolve) => cerrarVentana = () => { ventana.estaAbierta = false; resolve(); });
        });
        turno = new TurnoDeVentanasService();
        servicio = new BienvenidaTemaService(temaWeb, ventana, turno);
    });

    afterEach(() => servicio.ngOnDestroy());

    it('retiene las demás ventanas mientras se sabe si toca, y las suelta si ya eligió', () => {
        servicio.iniciar();
        expect(turno.libre).toBeFalse();
        expect(ventana.abrir).not.toHaveBeenCalled();
        bienvenida$.next('no');
        expect(turno.libre).toBeTrue();
        expect(ventana.abrir).not.toHaveBeenCalled();
    });

    it('a una cuenta sin tema le abre la bienvenida una vez; las demás ventanas esperan a que elija', async () => {
        servicio.iniciar();
        const otra = jasmine.createSpy('otra ventana');
        void turno.esperarTurno().then(otra);

        bienvenida$.next('pendiente');
        bienvenida$.next('pendiente');
        expect(ventana.abrir).toHaveBeenCalledOnceWith({ bienvenida: true });
        await Promise.resolve();
        expect(otra).not.toHaveBeenCalled();

        // Elige: el servicio del tema pasa a «no».
        bienvenida$.next('no');
        cerrarVentana();
        await Promise.resolve();
        expect(otra).toHaveBeenCalled();
        expect(ventana.abrir).toHaveBeenCalledTimes(1);
    });

    it('si ya estaba abierta la de Opciones, la bienvenida sale al cerrarla si aún no ha elegido', async () => {
        ventana.estaAbierta = true;
        let cerrarOpciones!: () => void;
        ventana.abrir.and.returnValues(
            new Promise<void>((resolve) => cerrarOpciones = () => { ventana.estaAbierta = false; resolve(); }),
            new Promise<void>(() => undefined),
        );
        servicio.iniciar();
        bienvenida$.next('pendiente');
        expect(ventana.abrir.calls.argsFor(0)).toEqual([{ bienvenida: false }]);
        cerrarOpciones();
        await new Promise((r) => setTimeout(r));
        expect(ventana.abrir.calls.argsFor(1)).toEqual([{ bienvenida: true }]);
    });

    it('si la ventana no carga, no deja bloqueadas las demás', async () => {
        ventana.abrir.and.rejectWith(new Error('sin red'));
        servicio.iniciar();
        bienvenida$.next('pendiente');
        await new Promise((r) => setTimeout(r));
        expect(turno.libre).toBeTrue();
    });
});

describe('TurnoDeVentanasService', () => {
    it('libre, se pasa al momento; retenido, espera a que se suelten todas las retenciones', async () => {
        const turno = new TurnoDeVentanasService();
        await turno.esperarTurno();
        turno.retener('a');
        turno.retener('b');
        const siguio = jasmine.createSpy('siguio');
        void turno.esperarTurno().then(siguio);
        turno.soltar('a');
        await Promise.resolve();
        expect(siguio).not.toHaveBeenCalled();
        turno.soltar('b');
        await Promise.resolve();
        expect(siguio).toHaveBeenCalled();
        turno.soltar('b');
        expect(turno.libre).toBeTrue();
    });
});
