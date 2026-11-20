import { cambiosDeLaMutacion } from './adquirir-raza-mutada';
import {
    esConversion, especialesSustituidos, fichaDeLaConversion, MOTIVO_SIN_CONSTITUCION, nepTrasLaConversion, pgDeLaConversion,
    pxTrasLaConversion, tieneConstitucion,
} from './conversion-muerto-viviente';
import { fichaSinElNivel } from './perder-nivel';
import { claseGuerrero, cuerpos, enanoGuerrero, ENGENDRO, EXPULSAR, GUERRERO, nivel, REPRENDER, SUSTITUIDOS } from 'src/testing/conversion-muerto-viviente';

/*
 * Convertirse en muerto viviente (*Libris Mortis*, pág. 34; contrato en `personajes.md`, «Convertirse en muerto viviente»):
 * los casos del dictamen del máster de Rol del 2026-11-20 (en el roadmap), con la ficha que se manda a
 * `POST /personajes/{id}/raza-mutada`.
 */

describe('conversion-muerto-viviente', () => {
    it('es la conversión si la raza lleva una clase de monstruo; solo un personaje vivo (con Constitución) se convierte', () => {
        expect(esConversion({ Clase_de_monstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' } })).toBeTrue();
        expect(esConversion({ Clase_de_monstruo: null })).toBeFalse();
        expect(tieneConstitucion(enanoGuerrero([], 0), {})).toBeTrue();
        // Sin ella por su tipo o una plantilla (el motor) o en su ficha: no disponible, con la frase de la API.
        expect(tieneConstitucion(enanoGuerrero([], 0), { Constitucion: true })).toBeFalse();
        const sinCon = enanoGuerrero([], 0);
        sinCon.caracteristicas.constitucion.perdido = true;
        expect(tieneConstitucion(sinCon, {})).toBeFalse();
        expect(MOTIVO_SIN_CONSTITUCION).toBe('Solo un personaje vivo se convierte en muerto viviente: no tiene Constitución.');
    });

    it('los PX y el NEP: el guerrero enano 5 (12.000) queda con 8.000 y NEP 5; el gnoll, de 3 a 4 con los mismos', () => {
        const enano = { Ajuste_nivel: 0, Dgs_adicionales: { Cantidad: 0 } } as any;
        expect(nepTrasLaConversion(5, enano, enano, 5, true)).toEqual({ trasPerder: 4, despues: 5 });
        expect(pxTrasLaConversion(12000, 4, true)).toBe(8000);
        const gnoll = { Ajuste_nivel: 1, Dgs_adicionales: { Cantidad: 2 } } as any;
        expect(nepTrasLaConversion(3, gnoll, gnoll, 0, false)).toEqual({ trasPerder: 3, despues: 4 });
        expect(pxTrasLaConversion(3500, 3, false)).toBe(3500);
    });

    it('con un solo nivel de clase, la mitad del NEP que le queda: el humano guerrero 1, 0; el drow mago 1 (NEP 3 → 2), 2.000 y NEP 3', () => {
        const humano = { Ajuste_nivel: 0, Dgs_adicionales: { Cantidad: 0 } } as any;
        expect(nepTrasLaConversion(1, humano, humano, 1, true)).toEqual({ trasPerder: 0, despues: 1 });
        expect(pxTrasLaConversion(800, 0, true)).toBe(0);
        const drow = { Ajuste_nivel: 2, Dgs_adicionales: { Cantidad: 0 } } as any;
        expect(nepTrasLaConversion(3, drow, drow, 1, true)).toEqual({ trasPerder: 2, despues: 3 });
        expect(pxTrasLaConversion(2500, 2, true)).toBe(2000);
        expect(pxTrasLaConversion(1500, 2, true)).toBe(1500);
    });

    describe('el guerrero enano 5 que se alza como guerrero 4 / engendro vampírico 1 (el ejemplo del libro)', () => {
        // Tiradas 10, 6, 7, 4 y 8 con Con +2: 45 PG.
        const entrada = enanoGuerrero([nivel(1, 10), nivel(2, 6), nivel(3, 7, [{ tipo: 'dote', idElemento: 5, idExtra: 0, origen: 'Nivel 3' }]), nivel(4, 4),
            nivel(5, 8, [{ tipo: 'rangos', idElemento: 40, idExtra: 0, valor: 2 }])], 45);
        const perdida = fichaSinElNivel({ entrada, indice: 4, clase: claseGuerrero, caras: 10, dgsAntes: 5 });

        it('los PG: sin el DG que pierde, sin la Constitución en ningún DG y con el d12 del engendro', () => {
            expect(perdida.pg.despues).toBe(35);
            const pg = pgDeLaConversion(perdida.ficha, 4, 7);
            // 35 − 4 DG × 2 (la Constitución, que ya no suma) + 7 del d12 (sin Constitución).
            expect(pg.total).toBe(35 - 8 + 7);
            expect(pg.exacto).toBeTrue();
        });

        it('la ficha que se manda: las clases, los niveles, la raza, la Constitución, las aptitudes, los idiomas y las dotes', () => {
            const { antes, despues } = cuerpos();
            const ficha = fichaDeLaConversion({
                entrada: perdida.ficha, antes, despues, idRaza: 1009, idRazaBase: 2, puntosGolpe: 34,
                idClaseDeMonstruo: ENGENDRO, nivel: { idClase: ENGENDRO, nivelClase: 1, elecciones: [{ tipo: 'dote', idElemento: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' }] },
                sustituidos: SUSTITUIDOS, sinPrerrequisitos: [{ idDote: 5, idExtra: 0 }],
            });
            const col: any = ficha.colecciones;

            expect(col.clases).toEqual([{ idClase: GUERRERO, nivel: 4 }, { idClase: ENGENDRO, nivel: 1 }]);
            expect(ficha.niveles!.map((n) => [n.idClase, n.nivelClase])).toEqual([[GUERRERO, 1], [GUERRERO, 2], [GUERRERO, 3], [GUERRERO, 4], [ENGENDRO, 1]]);
            expect(ficha.niveles![4].elecciones).toEqual([{ tipo: 'dote', idElemento: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' }]);
            expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase, ficha.personaje.idTipoCriatura]).toEqual([1009, 2, 13]);
            expect(ficha.personaje.puntosGolpe).toBe(34);
            // Sin Constitución, con su puntuación para cuando vuelva a la vida; la Fuerza, con el ajuste de la raza.
            expect(ficha.caracteristicas.constitucion).toEqual({ valor: 14, minimo: 0, perdido: true });
            expect(ficha.caracteristicas.fuerza.valor).toBe(18);
            // Reprender en lugar de expulsar (una sola vez) y la aptitud del engendro.
            expect(col.especiales).toEqual([{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: 3087, idExtra: 0 }]);
            // Los idiomas solo se suman; el agrandado, con los subtipos de su base.
            expect(col.idiomas).toEqual([{ idIdioma: 1 }, { idIdioma: 4 }]);
            expect(col.subtipos).toEqual([{ idSubtipo: 3 }, { idSubtipo: 50 }]);
            // La dote del engendro y la que deja de cumplir un prerrequisito, sin poder usarse.
            expect(col.dotes).toEqual([
                { idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3', sinPrerrequisitos: true },
                { idDote: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' },
            ]);
            // Los rangos del nivel perdido (−2) y los del nuevo (+4).
            expect(col.habilidades.base[0].rangos).toBe(8 - 2 + 4);
        });

        it('el resumen: el nivel perdido y el ganado, los PX, sin Constitución, las dotes sin usar y la aptitud sustituida', () => {
            const filas = cambiosDeLaMutacion({
                antes: { Tipo_criatura: { Nombre: 'Humanoide' }, Constitucion: 14, Vida: 45 } as any,
                despues: { Tipo_criatura: { Nombre: 'Muerto viviente' }, Constitucion: 0, Constitucion_perdida: true, Vida: 34 } as any,
                anterior: { Nombre: 'Enano', Ajuste_nivel: 0 } as any,
                combinada: { Nombre: 'Engendro vampírico', Ajuste_nivel: 0 } as any,
                experiencia: { px: 12000, nivel: 5 } as any, nepDespues: 5, pg: { total: 34, delNivel: 7, retroactivo: -8, exacto: true },
                dotesPerdidas: [], rangosQuitados: [], dotesCambiadas: [], exClases: [], alineamientoExigido: 'Caótico maligno',
                conversion: {
                    perdida: { clase: 'Guerrero', nivelClase: 5 }, loQuePierde: [{ que: 'Rangos de Trepar', antes: '8', ahora: '6' }],
                    claseDeMonstruo: 'Engendro vampírico', pxAntes: 12000, pxDespues: 8000,
                    sinPoderUsar: ['Dureza'], sustituidas: [{ antes: 'Expulsar muertos vivientes', ahora: 'Reprender muertos vivientes' }],
                },
            });
            const fila = (que: string) => filas.find((f) => f.que === que);

            expect([fila('Nivel perdido')?.antes, fila('Nivel perdido')?.ahora]).toEqual(['Guerrero 5', 'Guerrero 4']);
            expect(fila('Rangos de Trepar')?.porque).toBe('Lo daba el nivel que pierde');
            expect(fila('Nivel ganado')?.ahora).toBe('Engendro vampírico 1');
            expect([fila('NEP')?.antes, fila('NEP')?.ahora]).toEqual(['5', '5']);
            expect([fila('PX')?.antes, fila('PX')?.ahora]).toEqual(['12.000', '8.000']);
            expect(fila('Constitución')?.ahora).toBe('Sin ella');
            expect([fila('Tipo')?.antes, fila('Tipo')?.ahora]).toEqual(['Humanoide', 'Muerto viviente']);
            expect(fila('Sin poder usar')?.antes).toBe('Dureza');
            expect([fila('Aptitud')?.antes, fila('Aptitud')?.ahora]).toEqual(['Expulsar muertos vivientes', 'Reprender muertos vivientes']);
            expect(fila('Alineamiento')?.aviso).toBeTrue();
        });
    });

    it('el humano guerrero 1: pierde su único nivel y el del engendro es su primer DG, al máximo (12), sin Constitución', () => {
        const entrada = enanoGuerrero([nivel(1, 10)], 12);
        const perdida = fichaSinElNivel({ entrada, indice: 0, clase: claseGuerrero, caras: 10, dgsAntes: 1 });
        // Sin ningún DG le queda lo que dan sus dotes: nada (con Dureza, sus 3).
        expect(perdida.ficha.personaje.puntosGolpe).toBe(0);
        expect((perdida.ficha.colecciones as any).clases).toEqual([]);
        expect(pgDeLaConversion(perdida.ficha, 0, 12).total).toBe(12);
        const conDureza = fichaSinElNivel({ entrada: { ...entrada, personaje: { ...entrada.personaje, puntosGolpe: 15 } }, indice: 0, clase: claseGuerrero, caras: 10, dgsAntes: 1 });
        expect(pgDeLaConversion(conDureza.ficha, 0, 12).total).toBe(3 + 12);
        // Como mínimo 1: sin ningún DG ni PG que le queden y sin DG nuevo.
        expect(pgDeLaConversion(perdida.ficha, 0, null).total).toBe(1);
    });

    it('el gnoll sin niveles de clase: los PG de sus 2 DG raciales sin Constitución, con el d12 del engendro', () => {
        const gnoll = enanoGuerrero([], 13);
        (gnoll.colecciones as any).clases = [];
        // 2 DG raciales sin tirada guardada, con Con +2: pierden 4 y suma el d12 (7).
        const pg = pgDeLaConversion(gnoll, 2, 7);
        expect(pg.total).toBe(13 - 4 + 7);
        expect(pg.exacto).toBeFalse();
    });

    it('las aptitudes sustituidas, sin repetir; sin sustituciones, las mismas', () => {
        const lista = [{ idEspecial: EXPULSAR, idExtra: 0 }, { idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: 9, idExtra: 2 }];
        expect(especialesSustituidos(lista, SUSTITUIDOS)).toEqual([{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: 9, idExtra: 2 }]);
        expect(especialesSustituidos(lista, [])).toEqual(lista);
    });
});
