import { of, throwError } from 'rxjs';
import { normalizarChakra, normalizarFusion } from 'src/app/services/utils/incarnum-mapper';
import { chakraApi, fusionApi } from 'src/testing/incarnum';
import { ListadoChakrasComponent, filaChakra } from '../listado-chakras/listado-chakras.component';
import { ListadoFusionesComponent, filaFusion } from './listado-fusiones.component';

describe('Listados de Magic of Incarnum', () => {
    it('la fila de una fusión: el original del libro, las clases, dónde se moldea (con «o»), los vínculos y el manual', () => {
        const fusion = normalizarFusion(fusionApi({
            Chakras: [
                { Id: 36, Nombre: 'Manos', Ocupa: true, Vinculo: true },
                { Id: 37, Nombre: 'Brazos', Ocupa: true, Vinculo: false },
                { Id: 44, Nombre: 'Tótem', Ocupa: false, Vinculo: true },
            ],
        }));
        const fila = filaFusion(fusion, new Map([[37, 4], [36, 3], [44, 11]]));
        expect(fila.Original).toBe('Crystal Helm');
        expect(fila.Clases).toBe('Encarnado, Nacido del alma');
        expect(fila.Se_moldea).toBe('Manos o Brazos');
        expect(fila.Vinculos).toBe('Manos, Tótem');
        expect(fila.Descriptores).toBe('Fuerza');
        expect(fila.Manual).toContain('Magia del incarnum');
        expect(fila.Manual).not.toContain('(p.');
    });

    it('la fila de un chakra: categoría, ranura que cierra y el original del libro', () => {
        const fila = filaChakra(normalizarChakra(chakraApi()));
        expect(fila.Categoria).toBe('Mínimo');
        expect(fila.Ranura).toBe('Cabeza');
        expect(fila.Original).toBe('Crown');
    });

    describe('el listado de fusiones', () => {
        const casco = normalizarFusion(fusionApi());
        const otra = normalizarFusion(fusionApi({ Id: 99, Nombre: 'Botas de pasos rápidos', Nombre_original: 'Fleetstep Boots' }));
        const chakra = normalizarChakra(chakraApi());
        const crear = (incarnum: any) => new ListadoFusionesComponent({ detectChanges: () => undefined } as any, incarnum, {} as any);

        it('el buscador rápido busca en español o en inglés y «Limpiar filtros» lo vacía todo', () => {
            const listado = crear({ getFusiones: () => of([casco, otra]), getChakras: () => of([chakra]) });
            listado.cargar();
            expect(listado.cargado).toBeTrue();
            expect(listado.hayFiltros).toBeFalse();

            listado.buscar('fleetstep');
            expect(listado.fusionesDS.data.map((f) => f.Nombre)).toEqual(['Botas de pasos rápidos']);
            listado.defaultClase = 'Encarnado';
            expect(listado.hayFiltros).toBeTrue();

            listado.limpiarFiltros();
            expect(listado.textoBusqueda).toBe('');
            expect(listado.defaultClase).toBe('Cualquiera');
            expect(listado.hayFiltros).toBeFalse();
            expect(listado.fusionesDS.data.length).toBe(2);
        });

        it('si la lectura falla enseña el error', () => {
            const listado = crear({ getFusiones: () => throwError(() => new Error('caída')), getChakras: () => of([]) });
            listado.cargar();
            expect(listado.cargado).toBeTrue();
            expect(listado.errorCarga).toBeTrue();
        });
    });

    describe('el listado de chakras', () => {
        it('el buscador rápido y la categoría filtran, y «Limpiar filtros» los quita', () => {
            const corona = normalizarChakra(chakraApi());
            const listado = new ListadoChakrasComponent({ detectChanges: () => undefined } as any, { getChakras: () => of([corona]) } as any);
            listado.cargar();

            listado.buscar('crown');
            expect(listado.chakrasDS.data.length).toBe(1);
            listado.buscar('pies');
            expect(listado.chakrasDS.data.length).toBe(0);
            expect(listado.hayFiltros).toBeTrue();

            listado.limpiarFiltros();
            expect(listado.hayFiltros).toBeFalse();
            expect(listado.chakrasDS.data.length).toBe(1);
        });
    });
});
