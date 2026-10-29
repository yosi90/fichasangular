import { normalizarChakra, normalizarFusion } from 'src/app/services/utils/incarnum-mapper';
import { chakraApi, fusionApi } from 'src/testing/incarnum';
import { filaChakra } from '../listado-chakras/listado-chakras.component';
import { filaFusion } from './listado-fusiones.component';

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
    });

    it('la fila de un chakra: categoría, ranura que cierra y el original del libro', () => {
        const fila = filaChakra(normalizarChakra(chakraApi()));
        expect(fila.Categoria).toBe('Mínimo');
        expect(fila.Ranura).toBe('Cabeza');
        expect(fila.Original).toBe('Crown');
    });
});
