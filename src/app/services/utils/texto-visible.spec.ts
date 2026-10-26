import { idiomasVisibles, nombreDoteConExtra, textoVisible, tieneNumeroVisible, tieneTextoVisible } from './texto-visible';
import { extraerValorSimple, formatearValor } from './formato-registros';

describe('tieneTextoVisible', () => {
    it('oculta lo vacío y los textos que pone la propia web, sin tildes, mayúsculas ni puntos', () => {
        for (const texto of [null, undefined, '', '  ', 'No aplica', 'No especifica.', '-', 'Sin género',
            'No tener deidad', 'Desconocido', 'Ninguna'])
            expect(tieneTextoVisible(texto)).withContext(`${texto}`).toBeFalse();
    });

    it('enseña los textos que la API ya no manda como relleno: en un texto suyo son un dato', () => {
        for (const texto of ['Nada', 'Ninguno', 'No modifica', 'No vuela', 'Placeholder', 'no se especifica'])
            expect(tieneTextoVisible(texto)).withContext(texto).toBeTrue();
    });

    it('«Cualquiera» y «Elegir» no son relleno en los catálogos; «Cualquiera» sí en la ficha de un personaje', () => {
        expect(tieneTextoVisible('Cualquiera')).toBeTrue();
        expect(tieneTextoVisible('Elegir')).toBeTrue();
        expect(tieneTextoVisible('Cualquiera', { cualquieraEsRelleno: true })).toBeFalse();
        expect(tieneTextoVisible('Elegir', { cualquieraEsRelleno: true })).toBeTrue();
    });

    it('enseña lo demás', () => {
        for (const texto of ['Elfo', 'No muerto', '+2 a Fuerza', 'Nada en particular'])
            expect(tieneTextoVisible(texto)).withContext(texto).toBeTrue();
    });
});

describe('textoVisible', () => {
    it('da el texto recortado, o vacío si es null, vacío o de relleno', () => {
        expect(textoVisible('  Resiste 5.  ')).toBe('Resiste 5.');
        expect(textoVisible(null)).toBe('');
        expect(textoVisible(undefined)).toBe('');
        expect(textoVisible('No aplica')).toBe('');
        expect(textoVisible('Ninguno')).toBe('Ninguno');
    });
});

describe('nombreDoteConExtra', () => {
    const conExtra = (extra: any) => nombreDoteConExtra({ Dote: { Nombre: 'Soltura' }, Contexto: { Extra: extra } } as any);

    it('añade el extra visible entre paréntesis, sin espacios a los lados', () => {
        expect(conExtra('  Espada larga ')).toBe('Soltura (Espada larga)');
    });

    it('sin extra o con relleno, solo el nombre', () => {
        for (const extra of [undefined, null, '', 'No aplica'])
            expect(conExtra(extra)).withContext(`${extra}`).toBe('Soltura');
    });
});

describe('idiomasVisibles', () => {
    it('quita los de relleno y los repetidos, recorta y ordena', () => {
        expect(idiomasVisibles([
            { Nombre: ' Élfico ', Descripcion: ' Uno ' },
            { Nombre: 'Común', Descripcion: '' },
            { Nombre: 'elfico', Descripcion: 'Repetido' },
            { Nombre: 'No aplica', Descripcion: '' },
            { Nombre: '  ', Descripcion: '' },
        ])).toEqual([
            { Nombre: 'Común', Descripcion: '' },
            { Nombre: 'Élfico', Descripcion: 'Uno' },
        ]);
        expect(idiomasVisibles(undefined)).toEqual([]);
    });
});

describe('formato de prerrequisitos', () => {
    it('formatea objetos y listas sin los ids', () => {
        expect(formatearValor({ Id_dote: 3, Dote: 'Soltura', es_opcional: true })).toBe('Dote: Soltura | Es opcional: Sí');
        expect(formatearValor([1, null, 'dos'])).toBe('1, dos');
    });

    it('extrae el valor principal de un registro', () => {
        expect(extraerValorSimple({ Nombre: 'No aplica', Valor: 'Escudo' })).toBe('Escudo');
    });
});

describe('tieneNumeroVisible', () => {
    it('enseña los números mayores que 0 y oculta lo que falta, el 0, los negativos y lo que no es un número', () => {
        for (const valor of [1, 0.5, '20'])
            expect(tieneNumeroVisible(valor)).withContext(`${valor}`).toBeTrue();
        for (const valor of [null, undefined, '', 0, -1, 'abc'])
            expect(tieneNumeroVisible(valor)).withContext(`${valor}`).toBeFalse();
    });
});
