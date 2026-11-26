import { TestBed } from '@angular/core/testing';
import { TemaWebService } from './tema-web.service';
import { VentanaTemaService } from './ventana-tema.service';

describe('VentanaTemaService', () => {
    let servicio: VentanaTemaService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                provide: TemaWebService,
                useValue: jasmine.createSpyObj<TemaWebService>('TemaWebService', ['elegirTema', 'previsualizar', 'elegirModo', 'modoEfectivoDe'], {
                    estado: { tema: 'a', modo: 'sistema', modoEfectivo: 'oscuro', bienvenida: 'no' },
                }),
            }],
        });
        servicio = TestBed.inject(VentanaTemaService);
    });

    const dialogo = () => document.querySelector('app-ventana-tema dialog') as HTMLDialogElement | null;
    const esperarA = async (condicion: () => boolean) => {
        for (let i = 0; i < 100 && !condicion(); i++)
            await new Promise((r) => setTimeout(r, 10));
    };

    it('carga la ventana bajo demanda, una sola a la vez, y la quita al cerrarse', async () => {
        const abierta = servicio.abrir();
        expect(servicio.abrir()).toBe(abierta);
        await esperarA(() => !!dialogo()?.open);
        expect(dialogo()?.open).toBeTrue();
        expect(servicio.estaAbierta).toBeTrue();

        dialogo()!.close();
        await abierta;
        expect(document.querySelector('app-ventana-tema')).toBeNull();
        expect(servicio.estaAbierta).toBeFalse();
    });
});
