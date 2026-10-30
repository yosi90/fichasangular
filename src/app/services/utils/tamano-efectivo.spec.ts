import { Tamano } from 'src/app/interfaces/tamaño';
import { normalizeTamano } from 'src/app/services/tamano.service';
import { normalizarTamanoFicha, pasosDeAptitudes, tamanoEfectivo } from 'src/app/services/utils/tamano-efectivo';

// El tamaño con las aptitudes que lo cambian (Manual del jugador, tablas 8-1 y 8-4), con la misma regla que la ficha de
// la API (`utils/tamano.py`). Las cifras son las de `GET /tamanos`.

const CATALOGO: Tamano[] = [
    { Id: 0, Nombre: 'Depende', Modificador: 0, Modificador_presa: 0, Modificador_esconderse: 0, Espacio: 5, Alcance: 5, Alcance_largo: 5 },
    { Id: 1, Nombre: 'Minúsculo', Modificador: 8, Modificador_presa: -16, Modificador_esconderse: 16, Espacio: 0.5, Alcance: 0, Alcance_largo: 0 },
    { Id: 2, Nombre: 'Diminuto', Modificador: 4, Modificador_presa: -12, Modificador_esconderse: 12, Espacio: 1, Alcance: 0, Alcance_largo: 0 },
    { Id: 3, Nombre: 'Menudo', Modificador: 2, Modificador_presa: -8, Modificador_esconderse: 8, Espacio: 2.5, Alcance: 0, Alcance_largo: 0 },
    { Id: 4, Nombre: 'Pequeño', Modificador: 1, Modificador_presa: -4, Modificador_esconderse: 4, Espacio: 5, Alcance: 5, Alcance_largo: 5 },
    { Id: 5, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0, Modificador_esconderse: 0, Espacio: 5, Alcance: 5, Alcance_largo: 5, Multiplicador_carga: 1 },
    { Id: 6, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4, Modificador_esconderse: -4, Espacio: 10, Alcance: 10, Alcance_largo: 5, Multiplicador_carga: 2 },
    { Id: 7, Nombre: 'Enorme', Modificador: -2, Modificador_presa: 8, Modificador_esconderse: -8, Espacio: 15, Alcance: 15, Alcance_largo: 10 },
    { Id: 8, Nombre: 'Gargantuesco', Modificador: -4, Modificador_presa: 12, Modificador_esconderse: -12, Espacio: 20, Alcance: 20, Alcance_largo: 15 },
    { Id: 9, Nombre: 'Colosal', Modificador: -8, Modificador_presa: 16, Modificador_esconderse: -16, Espacio: 30, Alcance: 30, Alcance_largo: 20 },
];
const tamano = (id: number): Tamano => CATALOGO.find((item) => item.Id === id)!;

describe('tamano-efectivo', () => {
    it('las aptitudes no se apilan: cuentan el mayor aumento y la mayor reducción', () => {
        expect(pasosDeAptitudes([])).toBe(0);
        expect(pasosDeAptitudes([1, 1])).toBe(1);
        expect(pasosDeAptitudes([2, 1, -1])).toBe(1);
        expect(pasosDeAptitudes([-2, -1])).toBe(-2);
    });

    it('sin aptitudes, el de la raza con su espacio y su alcance', () => {
        const efectivo = tamanoEfectivo(tamano(5), CATALOGO, [], 5, 5)!;
        expect(efectivo.ficha).toEqual({
            id: 5, nombre: 'Mediano', modificador: 0, modificadorPresa: 0, modificadorEsconderse: 0,
            espacio: 5, alcance: 5, base: { Id: 5, Nombre: 'Mediano' }, pasos: 0, origenes: [],
        });
    });

    it('un Mediano con +1 pasa a Grande: CA −1, presa +4, Esconderse −4, espacio y alcance 10, carga ×2', () => {
        const efectivo = tamanoEfectivo(tamano(5), CATALOGO, [{ origen: 'Aptitud grande', pasos: 1 }, { origen: 'Sin cambio', pasos: 0 }], 5, 5)!;
        expect(efectivo.ficha).toEqual(jasmine.objectContaining({
            id: 6, nombre: 'Grande', modificador: -1, modificadorPresa: 4, modificadorEsconderse: -4, espacio: 10, alcance: 10,
            pasos: 1, origenes: [{ origen: 'Aptitud grande', pasos: 1 }],
        }));
        expect(efectivo.tamano.Multiplicador_carga).toBe(2);
    });

    it('una raza larga sigue la columna larga del alcance', () => {
        // Un Grande largo (alcance 5): Enorme largo tiene alcance 10.
        const efectivo = tamanoEfectivo(tamano(6), CATALOGO, [{ origen: 'Aptitud', pasos: 1 }], 10, 5)!;
        expect(efectivo.ficha.espacio).toBe(15);
        expect(efectivo.ficha.alcance).toBe(10);
    });

    it('la raza con espacio o alcance propios los mueve lo que cambia la tabla', () => {
        const efectivo = tamanoEfectivo(tamano(4), CATALOGO, [{ origen: 'Aptitud', pasos: -1 }], 5, 5)!;
        expect(efectivo.ficha.nombre).toBe('Menudo');
        expect(efectivo.ficha.espacio).toBe(2.5);
        expect(efectivo.ficha.alcance).toBe(0);
    });

    it('no pasa de los extremos del catálogo ni cambia el tamaño «Depende»', () => {
        const colosal = tamanoEfectivo(tamano(8), CATALOGO, [{ origen: 'Aptitud', pasos: 3 }], 20, 20)!;
        expect(colosal.ficha.nombre).toBe('Colosal');
        expect(colosal.ficha.pasos).toBe(1);
        const depende = tamanoEfectivo(tamano(0), CATALOGO, [{ origen: 'Aptitud', pasos: 1 }], 5, 5)!;
        expect(depende.ficha.id).toBe(0);
        expect(depende.ficha.pasos).toBe(0);
    });

    it('sin tamaño de raza, nada', () => {
        expect(tamanoEfectivo(null, CATALOGO, [{ origen: 'Aptitud', pasos: 1 }])).toBeNull();
    });

    it('el catálogo trae el espacio y el alcance de cada tamaño', () => {
        expect(normalizeTamano({ Id: 6, Nombre: 'Grande', Espacio: 10.0, Alcance: 10, Alcance_largo: 5 }))
            .toEqual(jasmine.objectContaining({ Espacio: 10, Alcance: 10, Alcance_largo: 5 }));
    });

    it('lee el bloque tamano de la ficha de la API', () => {
        expect(normalizarTamanoFicha({
            id: 6, nombre: 'Grande', modificador: -1, modificadorPresa: 4, modificadorEsconderse: -4, espacio: 10, alcance: 10,
            base: { Id: 5, Nombre: 'Mediano' }, pasos: 1, origenes: [{ origen: 'Tamaño imponente', pasos: 1 }],
        })).toEqual({
            id: 6, nombre: 'Grande', modificador: -1, modificadorPresa: 4, modificadorEsconderse: -4, espacio: 10, alcance: 10,
            base: { Id: 5, Nombre: 'Mediano' }, pasos: 1, origenes: [{ origen: 'Tamaño imponente', pasos: 1 }],
        });
        expect(normalizarTamanoFicha(null)).toBeNull();
    });
});
