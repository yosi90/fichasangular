import { FormControl } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { CLASE, IDIOMA } from 'src/app/services/utils/nombres-de-catalogo';
import { avisarErrorAlGuardar, avisarGuardado, delCatalogo } from './avisos-insercion';
import { EdicionDeCatalogo } from './edicion-de-catalogo';
import { alternarControl, elegirEnControl, quitarFila } from './filas-repetibles';

describe('EdicionDeCatalogo (el modo «Modificar» común de las inserciones)', () => {
    let modo: 'crear' | 'editar';
    let id: number | null;
    let valor: string;
    let obtener: jasmine.Spy;
    let alFallar: jasmine.Spy;
    let edicion: EdicionDeCatalogo<{ Id: number; Nombre: string; }>;
    const destruir$ = new Subject<void>();

    beforeEach(() => {
        modo = 'editar';
        id = 7;
        valor = '';
        obtener = jasmine.createSpy('obtener').and.callFake((idPedido: number) => of({ Id: idPedido, Nombre: 'Dracónico' }));
        alFallar = jasmine.createSpy('alFallar');
        edicion = new EdicionDeCatalogo({
            nombre: IDIOMA,
            modo: () => modo,
            id: () => id,
            obtener,
            hidratar: (entrada) => {
                valor = entrada.Nombre;
                edicion.tomarPuntoDePartida();
            },
            foto: () => valor,
            destruir$,
            alFallar,
        });
    });

    it('trae la entrada por su id una sola vez y la toma como punto de partida', () => {
        edicion.cargarSiHaceFalta();
        edicion.cargarSiHaceFalta();

        expect(obtener).toHaveBeenCalledOnceWith(7);
        expect(valor).toBe('Dracónico');
        expect(edicion.cargando).toBeFalse();
        expect(edicion.hayCambios).toBeFalse();

        valor = 'Dracónico antiguo';
        expect(edicion.hayCambios).toBeTrue();

        id = 8;
        edicion.cargarSiHaceFalta();
        expect(obtener).toHaveBeenCalledWith(8);
    });

    it('al crear no trae nada ni hay cambios que confirmar', async () => {
        modo = 'crear';
        edicion.cargarSiHaceFalta();
        valor = 'Algo';

        expect(obtener).not.toHaveBeenCalled();
        expect(edicion.hayCambios).toBeFalse();
        expect(await edicion.confirmarSalida()).toBeTrue();
    });

    it('si no se puede traer, avisa y deja de cargar', () => {
        obtener.and.returnValue(throwError(() => new Error('caída')));

        edicion.cargarSiHaceFalta();

        expect(alFallar).toHaveBeenCalled();
        expect(edicion.cargando).toBeFalse();
    });

    it('pregunta antes de cerrar con cambios («perderás los cambios del idioma»)', async () => {
        const swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        edicion.cargarSiHaceFalta();
        valor = 'Otro';

        expect(await edicion.confirmarSalida()).toBeFalse();
        expect((swal.calls.mostRecent().args[0] as any).text).toBe('Si cierras esta pestaña perderás los cambios del idioma.');
    });

    it('el nombre de otra entrada está ocupado; al modificar, el de la propia no', () => {
        const existentes = [{ Id: 7, Nombre: 'Dracónico' }, { Id: 9, Nombre: 'Élfico' }];
        expect(edicion.nombreOcupado(existentes, ' dracónico ')).toBeFalse();
        expect(edicion.nombreOcupado(existentes, 'ELFICO')).toBeTrue();
        expect(edicion.nombreOcupado(existentes, '')).toBeFalse();
        modo = 'crear';
        expect(edicion.nombreOcupado(existentes, 'Draconico')).toBeTrue();
    });

    it('olvidar deja el formulario como recién abierto', () => {
        edicion.cargarSiHaceFalta();
        edicion.olvidar();
        edicion.cargarSiHaceFalta();

        expect(obtener).toHaveBeenCalledTimes(2);
    });

    it('los textos del marco cambian entre crear y modificar', () => {
        expect(edicion.textoAccion(false)).toBe('Guardar cambios');
        expect(edicion.textoAccion(true)).toBe('Guardando cambios...');
        expect(edicion.avisoPermisos(false)).toBe('No tienes permisos para modificar idiomas.');
        expect(edicion.avisoPermisos(true)).toBe('');
        modo = 'crear';
        expect(edicion.textoAccion(false)).toBe('Crear idioma');
        expect(edicion.textoAccion(true)).toBe('Creando idioma...');
        expect(edicion.avisoPermisos(false)).toBe('No tienes permisos para crear idiomas.');
    });

    it('mientras trae la entrada, el marco dice «Cargando …» y no avisa de permisos', () => {
        const respuesta = new Subject<{ Id: number; Nombre: string; }>();
        obtener.and.returnValue(respuesta);
        expect(edicion.textoCargando).toBe('');

        edicion.cargarSiHaceFalta();
        expect(edicion.textoCargando).toBe('Cargando idioma…');
        expect(edicion.avisoPermisos(false)).toBe('');

        respuesta.next({ Id: 7, Nombre: 'Dracónico' });
        expect(edicion.textoCargando).toBe('');
        expect(edicion.avisoPermisos(false)).toBe('No tienes permisos para modificar idiomas.');
    });
});

describe('Avisos de las inserciones', () => {
    it('dicen el elemento con su género', async () => {
        const swal = spyOn(Swal, 'fire').and.resolveTo({} as any);

        await avisarGuardado(CLASE, true, 'Clase actualizada exitosamente');
        expect((swal.calls.mostRecent().args[0] as any).title).toBe('Clase actualizada');
        await avisarGuardado(IDIOMA, false, 'ok');
        expect((swal.calls.mostRecent().args[0] as any).title).toBe('Idioma creado');
        await avisarErrorAlGuardar(CLASE, false, new Error('Ya existe una clase con ese nombre.'));
        expect((swal.calls.mostRecent().args[0] as any).title).toBe('No se pudo crear la clase');
        expect((swal.calls.mostRecent().args[0] as any).text).toBe('Ya existe una clase con ese nombre.');
        expect(delCatalogo(CLASE)).toBe('de la clase');
    });
});

describe('Filas repetibles', () => {
    it('quitar la última fila deja una vacía', () => {
        expect(quitarFila([1, 2, 3], 1, () => 0)).toEqual([1, 3]);
        expect(quitarFila([5], 0, () => 0)).toEqual([0]);
    });

    it('alternar un chip de sí o no lo marca como tocado', () => {
        const control = new FormControl(true);
        alternarControl(control);
        expect(control.value).toBeFalse();
        expect(control.dirty && control.touched).toBeTrue();
    });

    it('elegir en el buscador de catálogos pone el id y marca el control como tocado', () => {
        const control = new FormControl(0);
        elegirEnControl(control, 12);
        expect(control.value).toBe(12);
        expect(control.dirty && control.touched).toBeTrue();
    });
});
