import { idiomasVisibles, nombreDoteConExtra, tieneTextoVisible } from './texto-visible';
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

describe('nombreDoteConExtra', () => {
    const conExtra = (extra: any) => nombreDoteConExtra({ Dote: { Nombre: 'Soltura' }, Contexto: { Extra: extra } } as any);

    it('añade el extra visible entre paréntesis, sin espacios a los lados', () => {
        expect(conExtra('  Espada larga ')).toBe('Soltura (Espada larga)');
    });

    it('sin extra o con relleno, solo el nombre', () => {
        for (const extra of [undefined, '', 'No aplica', 'Nada'])
            expect(conExtra(extra)).withContext(`${extra}`).toBe('Soltura');
    });
});

describe('idiomasVisibles', () => {
    it('quita los de relleno y los repetidos, recorta y ordena', () => {
        expect(idiomasVisibles([
            { Nombre: ' Élfico ', Descripcion: ' Uno ' },
            { Nombre: 'Común', Descripcion: '' },
            { Nombre: 'elfico', Descripcion: 'Repetido' },
            { Nombre: 'Ninguno', Descripcion: '' },
        ])).toEqual([
            { Nombre: 'Común', Descripcion: '' },
            { Nombre: 'Élfico', Descripcion: 'Uno' },
        ]);
        expect(idiomasVisibles(undefined)).toEqual([]);
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
