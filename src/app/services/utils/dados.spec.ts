import {
    DADOS_FILA,
    FuenteAleatoria,
    MAXIMO_HISTORIAL_DADOS,
    ResultadoTirada,
    TIRADA_VACIA,
    TiradaPreparada,
    anadirAlHistorial,
    cambiarBonificador,
    cambiarDado,
    desgloseTirada,
    etiquetaDado,
    expresionTirada,
    horaTirada,
    textoTotal,
    tiradaConAlgo,
    tirar,
    tirarDado,
} from './dados';

/** Una fuente que devuelve, en orden, los números de 32 bits que se le den (y repite el último). */
function fuenteFija(...valores: number[]): FuenteAleatoria & { usados: number } {
    let i = 0;
    const fuente = ((destino: Uint32Array) => {
        destino[0] = valores[Math.min(i, valores.length - 1)];
        i++;
        fuente.usados = i;
    }) as FuenteAleatoria & { usados: number };
    fuente.usados = 0;
    return fuente;
}

/** La fuente que hace salir en un dado de `caras` el valor `cara` (1…caras). */
const valorPara = (cara: number) => cara - 1;

function con(...cambios: [number, number][]): TiradaPreparada {
    return cambios.reduce((t, [caras, n]) => cambiarDado(t, caras as any, n), TIRADA_VACIA);
}

describe('dados', () => {
    it('la fila tiene los siete dados en orden, y el d100 lleva el icono del d10 con «%»', () => {
        expect(DADOS_FILA.map((d) => d.nombre)).toEqual(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']);
        const d100 = DADOS_FILA[6];
        expect(d100.icono).toBe('dado-d10');
        expect(d100.porcentaje).toBeTrue();
        expect(DADOS_FILA.filter((d) => d.porcentaje).length).toBe(1);
        expect(DADOS_FILA[5].icono).toBe('dado-d20');
    });

    it('la expresión: los dados en su orden y el bonificador con su signo', () => {
        expect(expresionTirada(TIRADA_VACIA)).toBe('');
        expect(expresionTirada(cambiarBonificador(con([20, 1], [6, 2]), 3))).toBe('2d6 + 1d20 + 3');
        expect(expresionTirada(cambiarBonificador(con([8, 3]), -1))).toBe('3d8 − 1');
        expect(expresionTirada(con([100, 1]))).toBe('1d100');
        expect(expresionTirada(cambiarBonificador(TIRADA_VACIA, 2))).toBe('+2');
    });

    it('cada tipo de dado va de 0 a 99', () => {
        let t = cambiarDado(TIRADA_VACIA, 6, -1);
        expect(t).toBe(TIRADA_VACIA);
        t = cambiarDado(TIRADA_VACIA, 6, 120);
        expect(t.reserva[6]).toBe(99);
        expect(cambiarDado(t, 6, 1)).toBe(t);
        expect(cambiarDado(t, 6, -1).reserva[6]).toBe(98);
    });

    it('el bonificador va de −99 a +99', () => {
        let t = cambiarBonificador(TIRADA_VACIA, 150);
        expect(t.bonificador).toBe(99);
        expect(cambiarBonificador(t, 1)).toBe(t);
        t = cambiarBonificador(TIRADA_VACIA, -150);
        expect(t.bonificador).toBe(-99);
        expect(cambiarBonificador(t, -1)).toBe(t);
    });

    it('hay algo que limpiar con un dado o con el bonificador', () => {
        expect(tiradaConAlgo(TIRADA_VACIA)).toBeFalse();
        expect(tiradaConAlgo(con([4, 1]))).toBeTrue();
        expect(tiradaConAlgo(cambiarBonificador(TIRADA_VACIA, -1))).toBeTrue();
    });

    it('un dado sale de 1 a sus caras', () => {
        expect(tirarDado(6, fuenteFija(0))).toBe(1);
        expect(tirarDado(6, fuenteFija(5))).toBe(6);
        expect(tirarDado(6, fuenteFija(6))).toBe(1);
        expect(tirarDado(100, fuenteFija(99))).toBe(100);
    });

    it('sin sesgo: descarta el último tramo incompleto y vuelve a pedir', () => {
        // 2^32 = 4294967296; para un d6, el último múltiplo de 6 es 4294967292: de ahí en adelante se descarta.
        const fuente = fuenteFija(4294967292, 4294967295, 7);
        expect(tirarDado(6, fuente)).toBe(2);
        expect(fuente.usados).toBe(3);
        // Un d4 y un d8 dividen 2^32: nunca descartan.
        const exacta = fuenteFija(4294967295);
        expect(tirarDado(4, exacta)).toBe(4);
        expect(exacta.usados).toBe(1);
    });

    it('por defecto tira con crypto.getRandomValues', () => {
        const espia = spyOn(crypto, 'getRandomValues').and.callFake(<T extends ArrayBufferView | null>(destino: T): T => {
            (destino as unknown as Uint32Array)[0] = 19;
            return destino;
        });
        expect(tirarDado(20)).toBe(20);
        expect(espia).toHaveBeenCalled();
    });

    it('tira la reserva, suma el bonificador y guarda lo que salió en cada dado', () => {
        const tirada = cambiarBonificador(con([6, 2], [20, 1]), 3);
        const fecha = new Date(2026, 9, 30, 11, 4);
        const resultado = tirar(tirada, fuenteFija(valorPara(4), valorPara(2), valorPara(15)), fecha)!;
        expect(resultado.expresion).toBe('2d6 + 1d20 + 3');
        expect(resultado.grupos).toEqual([{ caras: 6, valores: [4, 2] }, { caras: 20, valores: [15] }]);
        expect(resultado.total).toBe(24);
        expect(resultado.natural).toBeNull();
        expect(desgloseTirada(resultado, true)).toBe('2d6 [4, 2] · 1d20 [15] · +3');
        expect(desgloseTirada(resultado, false)).toBe('[4, 2] [15] +3');
        expect(horaTirada(resultado.fecha)).toBe('11:04');
    });

    it('el total puede ser negativo y se escribe con el menos tipográfico', () => {
        const resultado = tirar(cambiarBonificador(con([4, 1]), -10), fuenteFija(valorPara(3)))!;
        expect(resultado.total).toBe(-7);
        expect(textoTotal(resultado.total)).toBe('−7');
        expect(desgloseTirada(resultado, true)).toBe('1d4 [3] · −10');
    });

    it('el d100 sale de 1 a 100', () => {
        const resultado = tirar(con([100, 2]), fuenteFija(valorPara(100), valorPara(1)))!;
        expect(resultado.grupos).toEqual([{ caras: 100, valores: [100, 1] }]);
        expect(resultado.total).toBe(101);
        expect(desgloseTirada(resultado, true)).toBe('2d100 [100, 1]');
    });

    it('el natural solo cuenta en una tirada de un único d20', () => {
        expect(tirar(cambiarBonificador(con([20, 1]), 7), fuenteFija(valorPara(20)))!.natural).toBe(20);
        expect(tirar(con([20, 1]), fuenteFija(valorPara(1)))!.natural).toBe(1);
        expect(tirar(con([20, 2]), fuenteFija(valorPara(20)))!.natural).toBeNull();
        expect(tirar(con([20, 1], [6, 1]), fuenteFija(valorPara(1)))!.natural).toBeNull();
    });

    it('sin dados no se tira, aunque haya bonificador', () => {
        expect(tirar(TIRADA_VACIA, fuenteFija(0))).toBeNull();
        expect(tirar(cambiarBonificador(TIRADA_VACIA, 5), fuenteFija(0))).toBeNull();
    });

    it('el historial pone lo último arriba y guarda como mucho 50', () => {
        let historial: readonly ResultadoTirada[] = [];
        for (let i = 1; i <= 55; i++)
            historial = anadirAlHistorial(historial, tirar(cambiarBonificador(con([4, 1]), i), fuenteFija(0))!);
        expect(MAXIMO_HISTORIAL_DADOS).toBe(50);
        expect(historial.length).toBe(50);
        expect(historial[0].bonificador).toBe(55);
        expect(historial[49].bonificador).toBe(6);
    });

    it('el nombre accesible de cada dado', () => {
        expect(etiquetaDado(DADOS_FILA[1], 0)).toBe('Añadir un d6');
        expect(etiquetaDado(DADOS_FILA[1], 2)).toBe('d6, llevas 2');
        expect(etiquetaDado(DADOS_FILA[6], 0)).toBe('Añadir un d100');
    });
});
