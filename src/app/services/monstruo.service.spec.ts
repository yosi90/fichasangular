import { firstValueFrom, of, throwError } from 'rxjs';
import { MonstruoDetalle, MonstruoIndice } from '../interfaces/monstruo';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { MonstruoService } from './monstruo.service';

describe('MonstruoService: el índice ligero de los monstruos', () => {
    const entrada = (Id: number, Nombre: string, Familiar: boolean, Companero: boolean): MonstruoIndice => ({
        Id, Nombre, Manual: { Id: 1, Nombre: 'Manual de monstruos 1', Pagina: 1 }, Tipo: { Id: 2, Nombre: 'Animal' },
        Tamano: { Id: 4, Nombre: 'Mediano' }, Valor_desafio: '1', Familiar, Companero, Oficial: true,
    });
    // Por nombre, como lo da `getMonstruosIndice`.
    const indice = [
        entrada(11, 'Gato', true, false),
        entrada(30, 'Hidra', false, false),
        entrada(48, 'Lobo', false, true),
        entrada(60, 'Perro de montar', true, true),
    ];

    let servicio: MonstruoService;
    let getMonstruo: jasmine.Spy;

    beforeEach(() => {
        servicio = new MonstruoService({} as any, {} as any, { run: (fn: () => unknown) => fn() } as FirebaseInjectionContextService);
        spyOn(servicio, 'getMonstruosIndice').and.returnValue(of(indice));
        getMonstruo = spyOn(servicio, 'getMonstruo').and.callFake((id: number) =>
            of({ Id: id, Nombre: indice.find((m) => m.Id === id)?.Nombre ?? '', Niveles_clase: [] } as unknown as MonstruoDetalle));
    });

    it('ya no tiene la lectura de la rama `Monstruos` entera', () => {
        expect((servicio as any).getMonstruos).toBeUndefined();
    });

    it('las mascotas: el detalle solo de los ids del índice con Familiar o Companero, en el orden del índice', async () => {
        const monstruos = await firstValueFrom(servicio.getMonstruosMascota());

        expect(getMonstruo.calls.allArgs()).toEqual([[11], [48], [60]]);
        expect(monstruos.map((m) => m.Id)).toEqual([11, 48, 60]);
    });

    it('solo los familiares o solo los compañeros, si se dice', async () => {
        expect((await firstValueFrom(servicio.getMonstruosMascota('familiar'))).map((m) => m.Id)).toEqual([11, 60]);
        expect((await firstValueFrom(servicio.getMonstruosMascota('companero'))).map((m) => m.Id)).toEqual([48, 60]);
    });

    it('sin ninguno que pueda ser mascota, una lista vacía sin leer ningún detalle', async () => {
        (servicio.getMonstruosIndice as jasmine.Spy).and.returnValue(of([entrada(30, 'Hidra', false, false)]));

        expect(await firstValueFrom(servicio.getMonstruosMascota())).toEqual([]);
        expect(getMonstruo).not.toHaveBeenCalled();
    });

    it('un monstruo que no se puede leer se queda fuera; si no se puede leer ninguno, termina con error', async () => {
        getMonstruo.and.callFake((id: number) => id === 48
            ? throwError(() => new Error('404'))
            : of({ Id: id, Nombre: 'x', Niveles_clase: [] } as unknown as MonstruoDetalle));
        expect((await firstValueFrom(servicio.getMonstruosMascota())).map((m) => m.Id)).toEqual([11, 60]);

        getMonstruo.and.returnValue(throwError(() => new Error('sin red')));
        await expectAsync(firstValueFrom(servicio.getMonstruosMascota())).toBeRejectedWithError('No se ha podido leer ningún monstruo de las mascotas.');
    });

    it('emite una vez y termina, aunque el índice y los detalles sigan escuchando la caché', async () => {
        (servicio.getMonstruosIndice as jasmine.Spy).and.returnValue(of(indice, indice));
        const emitidos: MonstruoDetalle[][] = [];
        let terminado = false;
        servicio.getMonstruosMascota().subscribe({ next: (lista) => emitidos.push(lista), complete: () => terminado = true });

        expect(emitidos.length).toBe(1);
        expect(terminado).toBeTrue();
    });
});
