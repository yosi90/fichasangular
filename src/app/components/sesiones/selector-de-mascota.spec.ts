import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { EntradasSelectorCompanero } from 'src/app/services/utils/companero-reglas';
import { EntradasSelectorFamiliar } from 'src/app/services/utils/familiar-reglas';
import { HuecoDeSelectores } from './hueco-selectores';
import { elegirCompaneroEnElSelector, elegirFamiliarEnElSelector } from './selector-de-mascota';

// El selector de la mascota de la creación desde la sesión: el reciclaje de la subida y obtener otra (tanda (i)).
describe('selector-de-mascota', () => {
    /** Un hueco que responde con `seleccion` y guarda las entradas y los cambios con que se abrió. */
    const hueco = (seleccion: unknown) => {
        const abierto: { entradas?: Record<string, unknown>; cambios?: Record<string, (valor: any) => Record<string, unknown>>; } = {};
        const selectores = {
            abrir: (_tipo: unknown, entradas: Record<string, unknown>, _a: string[], _r: string[], _f: unknown,
                cambios: Record<string, (valor: any) => Record<string, unknown>>) => {
                abierto.entradas = entradas;
                abierto.cambios = cambios;
                return Promise.resolve(seleccion);
            },
        } as unknown as HuecoDeSelectores;
        return { selectores, abierto };
    };

    it('el compañero: abre con sus entradas, vuelve a juzgar con los filtros y da la criatura del catálogo con su nombre', async () => {
        const catalogo = [{ Id_companero: 1, Nombre: 'Lobo' }, { Id_companero: 2, Nombre: 'Tejón' }] as unknown as CompaneroMonstruoDetalle[];
        const filtros: Array<{ incluirHomebrew: boolean; nivelSeleccionado: number | null; }> = [];
        const entradas = (f: { incluirHomebrew: boolean; nivelSeleccionado: number | null; }): EntradasSelectorCompanero => {
            filtros.push(f);
            return { nivelesDisponibles: [1, 4], nivelSeleccionado: f.nivelSeleccionado, elegibles: catalogo, bloqueados: [], nivelesRequeridos: {}, ajustes: {} };
        };
        const { selectores, abierto } = hueco({ companero: { Id_companero: 2 }, nombre: 'Risco' });
        const elegido = await elegirCompaneroEnElSelector(selectores, { titulo: 'Llamar', cuposDisponibles: 1, homebrew: false, catalogo, entradas });
        expect(elegido?.criatura).toBe(catalogo[1]);
        expect(elegido?.nombre).toBe('Risco');
        expect(abierto.entradas?.['titulo']).toBe('Llamar');
        expect(abierto.entradas?.['companerosElegibles']).toBe(catalogo);
        expect(abierto.cambios?.['incluirHomebrewChange'](true)['incluirHomebrew']).toBeTrue();
        expect(abierto.cambios?.['nivelChange'](4)['nivelSeleccionado']).toBe(4);
        expect(filtros[filtros.length - 1]).toEqual({ incluirHomebrew: true, nivelSeleccionado: 4 });
    });

    it('el familiar: la plantilla del filtro y, si se cancela, nada', async () => {
        const catalogo = [{ Id_familiar: 7, Nombre: 'Búho', Plantilla: { Id: 3 } }] as unknown as FamiliarMonstruoDetalle[];
        const entradas = (): EntradasSelectorFamiliar => ({ plantillas: [], elegibles: catalogo, bloqueados: [], nivelesRequeridos: {} });
        const elegido = hueco({ familiar: { Id_familiar: 7, Plantilla: { Id: 3 } }, nombre: 'Ceniza' });
        const r = await elegirFamiliarEnElSelector(elegido.selectores, { titulo: 'Obtener', cuposDisponibles: 1, homebrew: true, catalogo, entradas });
        expect(r).toEqual({ criatura: catalogo[0], nombre: 'Ceniza' });
        expect(elegido.abierto.cambios?.['plantillaChange']('3')['plantillaSeleccionada']).toBe(3);
        const cancelado = hueco(null);
        expect(await elegirFamiliarEnElSelector(cancelado.selectores, { titulo: 'Obtener', cuposDisponibles: 1, homebrew: true, catalogo, entradas })).toBeNull();
    });
});
