import { PersonajeCreateNivelDto } from 'src/app/interfaces/personajes-api';
import { puntosDevueltos } from './adquirir-raza-mutada';
import { esDotePorNivelDePersonaje, origenDotePorNivelDePersonaje } from './niveles-creacion';
import {
    cambiosDeLaVuelta, claveDelNivel, dgsAntesDeSusNiveles, eleccionesApuntadas, fichaDeLaVuelta, filasDeLaRenumeracion, nivelesDePersonaje,
    pgDelPrimerDg, primerDgTrasRenumerar, puntosDelPrimerDg, rangosQueSobran, recontarHitos, recuentoPorNivelDePersonaje, ResumenRenumerado,
} from './vuelta-a-la-vida';
import { claseEngendro, claseGuerrero, cuerposDeLaVuelta, enanoEngendro, ENGENDRO, GUERRERO, nivelDe, SUSTITUIDOS } from 'src/testing/vuelta-a-la-vida';

/*
 * Devolver la vida con niveles de otra clase después de la clase de monstruo (contrato en `personajes.md`, «Devolver la
 * vida a un muerto viviente», «Con niveles de otra clase después»; dictamen del máster de Rol del 2026-11-20, parte B, con
 * el nivel de personaje del dictamen que lo corrige): la renumeración y lo que va por nivel de personaje.
 */

/** Un engendro vampírico de 4 niveles con un DG en cada uno (dotes de su tabla a 1.º y 3.º). */
const ENGENDRO_4: any = {
    ...claseEngendro, Nivel_max_claseo: 4,
    Desglose_niveles: claseEngendro.Desglose_niveles.slice(0, 4).map((f: any) => ({ ...f, Dg: true, Dote: [1, 3].includes(f.Nivel) })),
};

const dote = (nivel: number, id = 50) => ({ tipo: 'dote' as const, idElemento: id, idExtra: 0, origen: origenDotePorNivelDePersonaje(nivel) });
const incremento = (id = 1) => ({ tipo: 'incremento' as const, idElemento: id, valor: 1, origen: 'Guerrero nivel 2' });
const rangos = (id: number, valor: number) => ({ tipo: 'rangos' as const, idElemento: id, valor });
/** Un nivel de guerrero que no fue el primero (su tirada sin el máximo). */
const guerrero = (n: number, tirada: number, elecciones: any[] = []) => ({ ...nivelDe(GUERRERO, n, tirada, elecciones), pg: { tirada, maximo: false } });
const engendros = (cuantos: number) => Array.from({ length: cuantos }, (_, i) => nivelDe(ENGENDRO, i + 1, 7));

/** Los niveles que se quedan (sin la clase de monstruo) con su nivel de personaje de antes y de ahora. */
function renumerar(niveles: PersonajeCreateNivelDto[], dgs: number, tabla: any) {
    const clase = (id: number) => id === ENGENDRO ? tabla : claseGuerrero;
    const base = dgsAntesDeSusNiveles(dgs, niveles, clase);
    const quedan = niveles.filter((n) => n.idClase !== ENGENDRO);
    return {
        quedan, base, clase,
        antes: new Map(nivelesDePersonaje(niveles, clase, base).map((n) => [claveDelNivel(n), n])),
        ahora: nivelesDePersonaje(quedan, clase, base),
    };
}

describe('vuelta-a-la-vida, con niveles de otra clase después', () => {
    it('el origen de la dote de un nivel de personaje, el que pone el motor', () => {
        expect(origenDotePorNivelDePersonaje(6)).toBe('Dote adicional por nivel 6');
        expect(esDotePorNivelDePersonaje(dote(6))).toBeTrue();
        expect(esDotePorNivelDePersonaje({ tipo: 'dote', origen: 'Dote por nivel' })).toBeTrue();
        // La de la tabla del guerrero, la de la raza y la de sus DG no son de nivel de personaje.
        expect(esDotePorNivelDePersonaje({ tipo: 'dote', origen: 'Dote adicional: Guerrero nivel 2' })).toBeFalse();
        expect(esDotePorNivelDePersonaje({ tipo: 'dote', origen: 'Dote adicional de raza: Humano' })).toBeFalse();
        expect(esDotePorNivelDePersonaje({ tipo: 'dote', origen: 'DGs de raza: Ogro' })).toBeFalse();
        expect(esDotePorNivelDePersonaje({ tipo: 'idioma', origen: 'Dote adicional por nivel 3' })).toBeFalse();
    });

    it('el nivel de personaje cuenta todos los niveles: uno de Libris Mortis sin DG también lo sube (dictamen del máster de Rol)', () => {
        // El engendro vampírico de la tabla da DG en su 1.º y su 3.º: engendro 4 / guerrero 2 son 4 DG y 6 niveles de
        // personaje (Libris Mortis, pág. 35).
        const niveles = [...engendros(4), guerrero(1, 6), guerrero(2, 5)];
        const r = renumerar(niveles, 4, claseEngendro);
        expect(r.base).toBe(0);
        expect([...r.antes.values()].map((n) => [n.nivelPersonaje, n.daDg, n.conTabla])).toEqual([
            [1, true, true], [2, false, true], [3, true, true], [4, false, true], [5, true, false], [6, true, false],
        ]);
        // Los de guerrero bajan 4 puestos (los 4 niveles del engendro).
        expect(r.ahora.map((n) => [n.indice, n.nivelClase, n.nivelPersonaje])).toEqual([[0, 1, 1], [1, 2, 2]]);
        // Con DG raciales (el gnoll, 2), cuentan antes del primer nivel.
        expect(dgsAntesDeSusNiveles(6, niveles, r.clase)).toBe(2);
    });

    describe('el enano engendro vampírico 4 que después tomó guerrero 2 (un DG en cada nivel)', () => {
        const niveles = () => [...engendros(4), guerrero(1, 6), guerrero(2, 5, [dote(6)])];

        it('sin perder nivel: bajan 4 puestos, la dote de su 6.º nivel es la de su 1.º y guerrero 1 pasa a ser su primer DG', () => {
            const r = renumerar(niveles(), 6, ENGENDRO_4);
            expect(r.ahora.map((n) => n.nivelPersonaje)).toEqual([1, 2]);
            expect(recuentoPorNivelDePersonaje(r.quedan, r.ahora, r.antes))
                .toEqual({ dotes: { sobra: null, falta: null }, incrementos: { sobra: null, falta: null } });
            expect(primerDgTrasRenumerar(r.ahora, r.antes)?.indice).toBe(0);
        });

        it('con resurrección pierde además guerrero 2 (y su dote): le falta la de su 1.er nivel, en guerrero 1', () => {
            const r = renumerar(niveles(), 6, ENGENDRO_4);
            const quedan = r.quedan.slice(0, 1);
            const ahora = nivelesDePersonaje(quedan, r.clase, r.base);
            expect(recuentoPorNivelDePersonaje(quedan, ahora, r.antes).dotes).toEqual({ sobra: null, falta: { indice: 0, nivelPersonaje: 1 } });
            expect(primerDgTrasRenumerar(ahora, r.antes)?.indice).toBe(0);
        });
    });

    it('una dote que sobra: la del nivel más reciente', () => {
        // Guerrero 4, engendro 4, guerrero 5: su 5.º de guerrero era su 9.º nivel (dote) y pasa a ser el 5.º.
        const niveles = [
            { ...nivelDe(GUERRERO, 1, 10), elecciones: [dote(1, 11)] }, guerrero(2, 6), guerrero(3, 6, [dote(3, 12)]), guerrero(4, 6, [incremento()]),
            ...engendros(4), guerrero(5, 6, [dote(9, 13)]),
        ];
        const r = renumerar(niveles, 9, ENGENDRO_4);
        const recuento = recuentoPorNivelDePersonaje(r.quedan, r.ahora, r.antes);
        expect(recuento.dotes).toEqual({ sobra: { indice: 4, eleccion: dote(9, 13) }, falta: null });
        // Su incremento del 4.º sigue en su 4.º; ninguno pasa a ser su primer DG.
        expect(recuento.incrementos).toEqual({ sobra: null, falta: null });
        expect(primerDgTrasRenumerar(r.ahora, r.antes)).toBeNull();
    });

    it('una dote que falta: el hito más bajo que se queda sin la suya (en el 1.º, también una «solo a 1.er nivel»)', () => {
        // Engendro 3 / guerrero 3: la del 6.º (su guerrero 3) cubre el 3.º; le falta la del 1.º, en guerrero 1.
        const r = renumerar([...engendros(3), guerrero(1, 6), guerrero(2, 6), guerrero(3, 6, [dote(6)])], 6, ENGENDRO_4);
        expect(recuentoPorNivelDePersonaje(r.quedan, r.ahora, r.antes).dotes).toEqual({ sobra: null, falta: { indice: 0, nivelPersonaje: 1 } });
        // Una apuntada en su 2.º cubre el 1.º: falta la del 3.º.
        const hitos = r.ahora.filter((n) => n.nivelPersonaje === 1 || n.nivelPersonaje === 3);
        expect(recontarHitos(hitos, [{ indice: 1, eleccion: dote(3) }]).falta).toEqual({ indice: 2, nivelPersonaje: 3 });
        // Sin ninguna, la del 1.º; con las que tocan, nada.
        expect(recontarHitos(hitos, []).falta).toEqual({ indice: 0, nivelPersonaje: 1 });
        expect(recontarHitos(hitos, [{ indice: 0, eleccion: dote(1) }, { indice: 2, eleccion: dote(3) }])).toEqual({ sobra: null, falta: null });
    });

    it('un incremento que sobra: el del nivel más reciente; el de una aptitud de su clase no cuenta', () => {
        // Engendro 2 / guerrero 2: su guerrero 2 era su 4.º nivel (incremento) y pasa a ser el 2.º.
        const niveles = [...engendros(2), guerrero(1, 6, [dote(3)]), guerrero(2, 5, [incremento(4)])];
        const r = renumerar(niveles, 4, ENGENDRO_4);
        const recuento = recuentoPorNivelDePersonaje(r.quedan, r.ahora, r.antes);
        expect(recuento.incrementos).toEqual({ sobra: { indice: 1, eleccion: incremento(4) }, falta: null });
        expect(recuento.dotes).toEqual({ sobra: null, falta: null });
        // Un incremento apuntado en un nivel que no lo daba por su nivel de personaje (el de una aptitud) no cuenta.
        const conAptitud = [...engendros(2), guerrero(1, 6, [dote(3), incremento(2)]), guerrero(2, 5)];
        const s = renumerar(conAptitud, 4, ENGENDRO_4);
        expect(recuentoPorNivelDePersonaje(s.quedan, s.ahora, s.antes).incrementos).toEqual({ sobra: null, falta: null });
    });

    it('un incremento que falta: en el nivel que pasa a ser su 4.º', () => {
        // Guerrero 1, engendro 3, guerrero 4: su 4.º nivel era el 3.º del engendro; ahora lo es su guerrero 4, sin el suyo.
        const niveles = [guerrero(1, 6), ...engendros(3), guerrero(2, 6), guerrero(3, 6), guerrero(4, 6)];
        const r = renumerar(niveles, 7, ENGENDRO_4);
        expect(r.ahora.map((n) => n.nivelPersonaje)).toEqual([1, 2, 3, 4]);
        expect(recuentoPorNivelDePersonaje(r.quedan, r.ahora, r.antes).incrementos).toEqual({ sobra: null, falta: { indice: 3, nivelPersonaje: 4 } });
    });

    it('el primer DG: PG al máximo con la Constitución de ahora y 3 × (base + Int) puntos, y 3 más si es humano', () => {
        const guerreroDe2 = { Puntos_habilidad: { Id: 1, Valor: 2 } } as any;
        expect(puntosDelPrimerDg(guerreroDe2, 0, null)).toBe(6);
        expect(puntosDelPrimerDg(guerreroDe2, 2, null)).toBe(12);
        // El humano: 4 en su 1.er nivel en vez de 1.
        expect(puntosDelPrimerDg(guerreroDe2, 0, { Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1 })).toBe(9);
        // Al menos 1 por nivel: con Int −1, 1 × 4 − 1.
        expect(puntosDelPrimerDg(guerreroDe2, -1, null)).toBe(3);
        // Los PG: el d10 al máximo en lugar de lo que salió, con Con +2.
        expect(pgDelPrimerDg({ tirada: 6, maximo: false }, 10, 2)).toEqual({ suma: 4, exacto: true });
        expect(pgDelPrimerDg({ tirada: 10, maximo: true }, 10, 2)).toEqual({ suma: 0, exacto: true });
        // Sin su tirada, con la media (y se avisa); al menos 1 cada DG.
        expect(pgDelPrimerDg({ tirada: null, maximo: false }, 10, 0)).toEqual({ suma: 4, exacto: false });
        expect(pgDelPrimerDg({ tirada: 2, maximo: false }, 10, -3)).toEqual({ suma: 6, exacto: true });
        // Antes no era su primer DG: tenía otro antes (un guerrero 1 delante), o ya lo era.
        const conAntes = renumerar([guerrero(1, 6), ...engendros(2), guerrero(2, 6)], 4, ENGENDRO_4);
        expect(primerDgTrasRenumerar(conAntes.ahora, conAntes.antes)).toBeNull();
    });

    it('los rangos que pasan del máximo, desde los últimos niveles hacia atrás, con lo que costó cada uno', () => {
        const niveles = [guerrero(1, 6, [rangos(40, 4), rangos(41, 2)]), guerrero(2, 6, [rangos(40, 4)])];
        const coste = (_: number, id: number) => id === 41 ? 2 : 1;
        // Trepar (40) con 8 y máximo 5: −3 de guerrero 2 (3 puntos que vuelven a ese nivel).
        const r = rangosQueSobran(niveles, [{ idHabilidad: 40, idExtra: 0, rangos: 8, maximo: 5 }, { idHabilidad: 41, idExtra: 0, rangos: 2, maximo: 2 }], coste);
        expect(r.quitados).toEqual([{ indice: 1, idHabilidad: 40, idExtra: 0, rangos: 3, coste: 1 }]);
        expect(r.niveles[1].elecciones).toEqual([rangos(40, 1)]);
        expect(r.niveles[0].elecciones).toEqual([rangos(40, 4), rangos(41, 2)]);
        expect(puntosDevueltos(r.quitados)).toBe(3);
        // Con máximo 2: los 4 de guerrero 2 y 2 de guerrero 1; la transclásea (41) a 1, a 2 puntos cada rango.
        const s = rangosQueSobran(niveles, [{ idHabilidad: 40, idExtra: 0, rangos: 8, maximo: 2 }, { idHabilidad: 41, idExtra: 0, rangos: 2, maximo: 1 }], coste);
        expect(s.quitados).toEqual([
            { indice: 1, idHabilidad: 40, idExtra: 0, rangos: 4, coste: 1 },
            { indice: 0, idHabilidad: 40, idExtra: 0, rangos: 2, coste: 1 },
            { indice: 0, idHabilidad: 41, idExtra: 0, rangos: 1, coste: 2 },
        ]);
        expect(s.niveles.map((n) => n.elecciones)).toEqual([[rangos(40, 2), rangos(41, 1)], []]);
        expect(puntosDevueltos(s.quitados.filter((q) => q.indice === 0))).toBe(4);
        // Lo que no se compró en un nivel (sus DG raciales) no se toca; los niveles de entrada no cambian.
        expect(rangosQueSobran(niveles, [{ idHabilidad: 99, idExtra: 0, rangos: 6, maximo: 2 }], coste).quitados).toEqual([]);
        expect(niveles[1].elecciones).toEqual([rangos(40, 4)]);
    });

    it('lo que el motor apunta en cada nivel, para la ficha', () => {
        const antes = [{ elecciones: [rangos(40, 1)] }, { elecciones: [] }];
        const despues = [{ elecciones: [rangos(40, 1), dote(1)] }, { elecciones: [rangos(41, 2)] }];
        expect(eleccionesApuntadas(antes, despues)).toEqual([[dote(1)], [rangos(41, 2)]]);
    });

    it('«Lo que cambia»: los puestos que bajan, el primer DG, lo que sobra y lo que falta, los rangos y la de prestigio', () => {
        const r: ResumenRenumerado = {
            puestos: 2, niveles: { desde: { antes: 3, ahora: 1 }, hasta: { antes: 4, ahora: 2 } },
            primerDg: { clase: 'Guerrero', nivelClase: 1, indice: 0, caras: 10, modConstitucion: 2, puntos: 6 },
            dotePerdida: 'Soltura con un arma (espada larga)', doteElegida: { nombre: 'Alerta', nivelPersonaje: 1 },
            incrementoPerdido: { nombre: 'Inteligencia', antes: 13, ahora: 12, inteligencia: true }, incrementoElegido: null,
            maximoDeRangos: 5, rangosQuitados: [{ nombre: 'Trepar', rangos: 3, nivel: 'nivel 2 (guerrero 2)' }], rangosRepartidos: [{ nombre: 'Saltar', rangos: 3, nivel: 'nivel 2 (guerrero 2)' }],
            prestigio: [{ nombre: 'Caballero de la rosa', razones: ['Requiere ataque base +5'] }],
        };
        const filas = filasDeLaRenumeracion(r);
        const fila = (que: string) => filas.filter((f) => f.que === que);
        expect([fila('Niveles de después')[0].antes, fila('Niveles de después')[0].ahora]).toEqual(['Nivel de personaje 3.º a 4.º', 'Nivel de personaje 1.º a 2.º']);
        expect(fila('Niveles de después')[0].porque).toContain('Bajan 2 puestos');
        expect(fila('Primer DG')[0].porque).toContain('PG al máximo (10 + 2 Con) y 6 puntos de habilidad más (×4)');
        expect(fila('Dote por nivel de personaje').map((f) => [f.antes, f.ahora])).toEqual([['Soltura con un arma (espada larga)', '—'], ['—', 'Alerta']]);
        expect(fila('Dote por nivel de personaje')[1].porque).toContain('la de su 1.º nivel');
        expect(fila('Inteligencia (incremento)')[0].porque).toContain('no quita puntos de habilidad');
        expect(fila('Rangos que pasan del máximo')[0].antes).toBe('Trepar −3 en el nivel 2 (guerrero 2)');
        expect(fila('Rangos repartidos')[0].ahora).toBe('Saltar +3 en el nivel 2 (guerrero 2)');
        expect(fila('Caballero de la rosa')[0]).toEqual(jasmine.objectContaining({ aviso: true, ahora: 'Requiere ataque base +5' }));
        expect(fila('Caballero de la rosa')[0].porque).toContain('El arcano completo, pág. 17');
        // Con un solo puesto, en singular; sin los de después (los perdió todos), sin la fila.
        expect(filasDeLaRenumeracion({ ...r, puestos: 1 })[0].porque).toContain('Bajan 1 puesto:');
        expect(filasDeLaRenumeracion({ ...r, niveles: null }).some((f) => f.que === 'Niveles de después')).toBeFalse();
        // Van en el resumen de la vuelta, detrás de lo que daban los niveles de la clase de monstruo.
        const cambios = cambiosDeLaVuelta({
            antes: {} as any, despues: {} as any, raza: 'Engendro vampírico', razaDeAntes: 'Enano', claseDeMonstruo: 'Engendro vampírico',
            nivelesDeLaClase: 4, loQueDaban: [], nivelDeMas: null, pierdeConstitucion: false, constitucion: 14, nep: { antes: 6, despues: 2 },
            px: { antes: 15000, enMedio: 1500, despues: 1500 }, pg: { antes: 40, despues: 30, exacto: true }, aptitudes: [], vuelvenAValer: [], sinPoderUsar: [],
            renumerado: r,
        });
        expect(cambios.map((c) => c.que).slice(0, 3)).toEqual(['Raza', 'Niveles de Engendro vampírico', 'Niveles de después']);
    });

    it('la ficha añade la dote por nivel de personaje que faltaba, y solo esa', () => {
        const entrada = enanoEngendro();
        const { antes, despues } = cuerposDeLaVuelta();
        const nueva = { idDote: 60, idExtra: 0, origen: origenDotePorNivelDePersonaje(1) };
        const ficha = fichaDeLaVuelta({
            entrada, sinLosNiveles: { ...entrada, caracteristicas: { ...entrada.caracteristicas, constitucion: { valor: 14, minimo: 0, perdido: false } } },
            antes, despues, sustituidos: SUSTITUIDOS, deLasTablas: [], marcar: [], desmarcar: [], dotesNuevas: [nueva],
        });
        const dotes = (ficha.colecciones as any).dotes;
        expect(dotes.filter((d: any) => d.idDote === 60)).toEqual([nueva]);
        expect(dotes.length).toBe(3);
    });
});
