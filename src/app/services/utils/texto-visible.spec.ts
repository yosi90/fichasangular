import { tieneTextoVisible } from './texto-visible';
import { extraerValorSimple, formatearValor } from './formato-prerrequisitos';

describe('tieneTextoVisible', () => {
    it('oculta lo vacío y los textos de relleno, sin tildes, mayúsculas ni puntos', () => {
        for (const texto of [null, undefined, '', '  ', 'No aplica', 'No especifica.', 'no se especifica', 'No modifica',
            'No vuela.', '-', 'Nada', 'Sin género', 'No tener deidad', 'Desconocido', 'Cualquiera', 'Ninguna', 'Ninguno',
            'Placeholder'])
            expect(tieneTextoVisible(texto)).withContext(`${texto}`).toBeFalse();
    });

    it('enseña lo demás', () => {
        for (const texto of ['Elfo', 'No muerto', '+2 a Fuerza', 'Nada en particular'])
            expect(tieneTextoVisible(texto)).withContext(texto).toBeTrue();
    });
});

describe('formato de prerrequisitos', () => {
    it('formatea objetos y listas sin los ids', () => {
        expect(formatearValor({ Id_dote: 3, Dote: 'Soltura', es_opcional: true })).toBe('Dote: Soltura | Es opcional: Si');
        expect(formatearValor([1, null, 'dos'])).toBe('1, dos');
    });

    it('extrae el valor principal de un registro', () => {
        expect(extraerValorSimple({ Nombre: 'No aplica', Valor: 'Escudo' })).toBe('Escudo');
    });
});
