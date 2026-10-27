import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { normalizeClase } from 'src/app/services/clase.service';
import { normalizeConjuroApi, normalizeConjuroLegacy } from 'src/app/services/utils/conjuro-mapper';
import { libroTienda, nivelLanzadorMinimo, paginasConjuro, precioCopiaLibro } from 'src/app/services/utils/libro-conjuros';

// El precio de copiar un conjuro al libro (Manual del jugador, cap. 10; Guía del DM, tabla 7-33), con las mismas reglas
// que la API (`utils/libro_conjuros.py`).

/** Una fila de conjuros al día: `[cero, uno, …]`, con -1 donde no hay acceso. */
function diarios(...valores: number[]): Record<string, number> {
    const salida: Record<string, number> = {};
    for (let nivel = 0; nivel <= 9; nivel++)
        salida[`Nivel_${nivel}`] = valores[nivel] ?? -1;
    return salida;
}

function clase(raw: Record<string, any>): Clase {
    return normalizeClase({ Nivel_max_claseo: 20, Conjuros: {}, ...raw });
}

function nivel(n: number, conjurosDiarios: Record<string, number>): Record<string, any> {
    return { Nivel: n, Ataque_base: '+0', Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' }, Conjuros_diarios: conjurosDiarios };
}

// El mago (MJ tabla 3-18), sus seis primeros niveles.
const mago = clase({
    Id: 9, Nombre: 'Mago',
    Conjuros: { Arcanos: true, Libro: { Nivel_cero_completo: true, Iniciales: 3, Iniciales_suman_caracteristica: true, Por_nivel: 2 } },
    Desglose_niveles: [
        nivel(1, diarios(3, 1)), nivel(2, diarios(4, 2)), nivel(3, diarios(4, 2, 1)),
        nivel(4, diarios(4, 3, 2)), nivel(5, diarios(4, 3, 2, 1)), nivel(6, diarios(4, 3, 3, 2)),
    ],
});

describe('libro-conjuros', () => {
    it('una bola de fuego para una maga de nivel 5: 375 de pergamino y 300 de escribirla', () => {
        expect(precioCopiaLibro(3, 5)).toEqual({ pergamino: 375, escritura: 300, paginas: 3, total: 675 });
    });

    it('los de nivel 0 cuentan como medio y ocupan una página', () => {
        expect(precioCopiaLibro(0, 1)).toEqual({ pergamino: 12.5, escritura: 100, paginas: 1, total: 112.5 });
        expect(paginasConjuro(0)).toBe(1);
        expect(paginasConjuro(4)).toBe(4);
    });

    it('el componente material caro y los PX van al pergamino', () => {
        expect(precioCopiaLibro(1, 1, 100).total).toBe(225);
        expect(precioCopiaLibro(1, 1, null, 250).total).toBe(25 + 1250 + 100);
    });

    it('el nivel de lanzador mínimo sale de la tabla de la clase', () => {
        expect([0, 1, 2, 3].map((n) => nivelLanzadorMinimo(mago, n))).toEqual([1, 1, 3, 5]);
        expect(nivelLanzadorMinimo(mago, 4)).toBeNull();
        // Una clase que divide su nivel de lanzador (paladín: lanza desde su nivel 4, a la mitad).
        const paladin = clase({
            Id: 4, Nombre: 'Paladín', Conjuros: { Divinos: true, Nivel_lanzador_divisor: 2 },
            Desglose_niveles: [nivel(3, diarios(-1, -1)), nivel(4, diarios(-1, 0)), nivel(5, diarios(-1, 0))],
        });
        expect(nivelLanzadorMinimo(paladin, 1)).toBe(2);
    });

    it('el libro de la tienda: precios desde los datos, por nivel y nombre, y las páginas usadas', () => {
        const conjuro = (Id: number, Nombre: string, extra: Partial<Conjuro> = {}) => ({ ...normalizeConjuroApi({ Id, Nombre }), ...extra });
        const libro = libroTienda(mago, [
            { conjuro: conjuro(50, 'Bola de fuego'), nivel: 3 },
            { conjuro: conjuro(52, 'Identificar', { Coste_material: 100 }), nivel: 1 },
            { conjuro: conjuro(51, 'Escudo'), nivel: 1 },
        ], [{ nivel: 0 }, { nivel: 1 }, { nivel: 3 }]);
        expect(libro.idClase).toBe(9);
        expect(libro.clase).toBe('Mago');
        expect(libro.paginasUsadas).toBe(1 + 1 + 3);
        expect(libro.conjuros.map((item) => [item.conjuro.Nombre, item.precio.total])).toEqual([
            ['Escudo', 125], ['Identificar', 225], ['Bola de fuego', 675],
        ]);
    });

    it('el conjuro trae sus costes de la API y de la caché; sin coste, null', () => {
        expect(normalizeConjuroApi({ i: 1, n: 'Identificar', cmat: 100, cpx: null })).toEqual(jasmine.objectContaining({ Coste_material: 100, Coste_px: null }));
        expect(normalizeConjuroApi({ Id: 2, Nombre: 'Umbral', Coste_px: 1000 })).toEqual(jasmine.objectContaining({ Coste_material: null, Coste_px: 1000 }));
        expect(normalizeConjuroLegacy({ Id: 3, Nombre: 'Luz' })).toEqual(jasmine.objectContaining({ Coste_material: null, Coste_px: null }));
    });
});
