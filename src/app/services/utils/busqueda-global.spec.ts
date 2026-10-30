import { ElementoBusqueda, FuenteBusqueda, buscarEnFuentes, puntuarElemento, textoBuscable, textoVerTodos } from './busqueda-global';

function elemento(nombre: string, subtitulo = ''): ElementoBusqueda {
    return { clave: `x:${nombre}`, tipo: 'dote', nombre, subtitulo, buscable: textoBuscable(nombre, subtitulo), abrir: () => undefined };
}

function fuente(id: string, nombres: string[], extra: Partial<FuenteBusqueda> = {}): FuenteBusqueda {
    return { id, titulo: id, tipo: 'dote', lista: id, estado: 'lista', elementos: nombres.map((n) => elemento(n)), ...extra };
}

describe('busqueda-global', () => {
    it('busca sin tildes, mayúsculas ni espacios de sobra, por palabras', () => {
        expect(puntuarElemento(elemento('Ataque poderoso'), '  ATAQUE   pod ')).toBe(0);
        expect(puntuarElemento(elemento('Gran ataque poderoso'), 'ataque')).toBe(1);
        expect(puntuarElemento(elemento('Azurín', 'Magia del incarnum'), 'incarnum')).toBe(2);
        expect(puntuarElemento(elemento('Azurín'), 'azurin')).toBe(0);
        expect(puntuarElemento(elemento('Dureza azur'), 'azur dur')).toBe(2);
        expect(puntuarElemento(elemento('Esquiva'), 'azur')).toBeNull();
    });

    it('con menos de dos letras no busca', () => {
        expect(buscarEnFuentes('a', [fuente('dotes', ['Ataque'])])).toEqual([]);
    });

    it('ordena primero lo que empieza por lo buscado y corta en cinco por grupo', () => {
        const [grupo] = buscarEnFuentes('azur', [fuente('dotes', ['Toque azur', 'Azurín', 'Talento azur', 'Dureza azur', 'Enemistad azur', 'Expulsión azur'])]);
        expect(grupo.total).toBe(6);
        expect(grupo.elementos.map((e) => e.nombre)).toEqual(['Azurín', 'Dureza azur', 'Enemistad azur', 'Expulsión azur', 'Talento azur']);
        expect(textoVerTodos(grupo)).toBe('Ver los 6 en el listado de dotes');
        expect(textoVerTodos({ ...grupo, femenino: true })).toBe('Ver las 6 en el listado de dotes');
    });

    it('sin más de los que se ven, no hay «Ver todos»', () => {
        const [grupo] = buscarEnFuentes('azur', [fuente('razas', ['Azurín'])]);
        expect(textoVerTodos(grupo)).toBeNull();
    });

    it('un grupo que carga sale con «Cargando…»; uno sin nada o con error, no sale', () => {
        const grupos = buscarEnFuentes('azur', [
            fuente('razas', [], { estado: 'cargando' }),
            fuente('dotes', ['Esquiva']),
            fuente('clases', [], { estado: 'error' }),
        ]);
        expect(grupos.map((g) => [g.id, g.cargando])).toEqual([['razas', true]]);
    });

    it('lo que ya filtra la API (los objetos) se queda con su total', () => {
        const [grupo] = buscarEnFuentes('capa', [fuente('objetos', ['Capa de resistencia +1', 'Gran capa'], { yaFiltrados: true, total: 40 })]);
        expect(grupo.total).toBe(40);
        expect(grupo.elementos.length).toBe(2);
    });
});
