import { fichaConConstitucionPerdida, fichaSinElNivel, filasDelNivelPerdido } from './perder-nivel';
import { especialesDevueltos } from './raza-mutacion';
import {
    apartarLoDelPrimerNivel, cambiosDeLaVuelta, conLaConstitucionDeVuelta, esClaseParaVolverSinDg, especialesDeLasTablas, estadoDeLaVuelta,
    fichaDeLaVuelta, indiceDelUltimoNivelDeLaClase, MEDIOS_DE_LA_VUELTA, motivoRevivirSinConstitucion, motivoSinConstitucionParaVolver,
    MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL, MOTIVO_VUELTA_NIVELES_DESPUES, MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO, nepTrasLaVuelta, NO_SIRVEN_PARA_LA_VUELTA,
    pgDelPrimerNivel, pxTrasLaVuelta, restringidasCerradasAlVolver, sumarPerdidas, tomoNivelesDespues,
} from './vuelta-a-la-vida';
import {
    APTITUD_ENGENDRO, claseClerigo, claseEngendro, claseGuerrero, CLERIGO, cuerposDeLaVuelta, enanoEngendro, ENGENDRO, EXPULSAR,
    EXPULSAR_O_REPRENDER, GUERRERO, nivelDe, REPRENDER, SUSTITUIDOS, SUSTITUIDOS_DOS,
} from 'src/testing/vuelta-a-la-vida';

/*
 * Devolver la vida a un muerto viviente de clase de monstruo (*Libris Mortis*, pág. 35; contrato en `personajes.md`,
 * «Devolver la vida a un muerto viviente»): los ejemplos del contrato y del dictamen del máster de Rol del 2026-11-20 (en el
 * roadmap), con la ficha que se manda a `POST /personajes/{id}/vuelta-a-la-vida`.
 */

const ENANO = { Ajuste_nivel: 0, Dgs_adicionales: { Cantidad: 0 } } as any;
const GNOLL = { Ajuste_nivel: 1, Dgs_adicionales: { Cantidad: 2 } } as any;

describe('vuelta-a-la-vida', () => {
    it('los dos medios, con su porqué; revivir a los muertos y reencarnar no sirven', () => {
        expect(MEDIOS_DE_LA_VUELTA.map((m) => [m.pierdeNivel, m.titulo])).toEqual([
            [true, 'Resurrección, deseo o milagro: pierde además un nivel'],
            [false, 'Resurrección verdadera: no pierde nivel'],
        ]);
        expect(MEDIOS_DE_LA_VUELTA[0].porque).toContain('Manual del jugador, págs. 228, 262 y 285');
        expect(NO_SIRVEN_PARA_LA_VUELTA).toContain('Revivir a los muertos y reencarnar no sirven');
    });

    describe('el guerrero enano 4 / engendro vampírico 1 con 8.000 PX (NEP 5)', () => {
        it('con resurrección queda guerrero 3 con 4.500; con resurrección verdadera, guerrero 4 con 8.000', () => {
            expect(nepTrasLaVuelta(5, 1, ENANO, ENANO, 5)).toBe(4);
            expect(nepTrasLaVuelta(5, 2, ENANO, ENANO, 5)).toBe(3);
            expect(pxTrasLaVuelta(8000, 4, 3)).toEqual({ enMedio: 8000, despues: 4500 });
            expect(pxTrasLaVuelta(8000, 4, null)).toEqual({ enMedio: 8000, despues: 8000 });
            // Con 9.500 como muerto viviente, también baja a 8.000: pierde lo que ganó dentro de ese nivel.
            expect(pxTrasLaVuelta(9500, 4, null).despues).toBe(8000);
        });

        it('se puede con los dos medios', () => {
            const entrada = enanoEngendro();
            const estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: entrada.niveles, clases: entrada.colecciones!.clases as any, dgs: 5, constitucion: 14 });
            expect(estado).toEqual({ motivo: null, motivoConResurreccion: null, nivelesDeLaClase: 1, dgsSinLaClase: 4, conOtrasClases: true, ganaNivel: false });
        });

        it('sin el engendro: su dote, su aptitud, sus rangos y su DG; con la Constitución, que vuelve a sumar en sus 4 DG', () => {
            const entrada = enanoEngendro();
            expect(indiceDelUltimoNivelDeLaClase(entrada.niveles, ENGENDRO)).toBe(4);
            const perdida = fichaSinElNivel({ entrada, indice: 4, clase: claseEngendro, caras: 12, dgsAntes: 5 });
            // 34 − el d12 (7, sin Constitución).
            expect(perdida.pg.despues).toBe(27);
            const vuelta = conLaConstitucionDeVuelta(perdida.ficha, 14, 4);
            // + 4 DG × 2 (Con 14), con sus tiradas guardadas.
            expect(vuelta.ficha.personaje.puntosGolpe).toBe(35);
            expect(vuelta.pg.exacto).toBeTrue();
            expect(vuelta.ficha.caracteristicas.constitucion).toEqual({ valor: 14, minimo: 0, perdido: false });

            const { antes, despues } = cuerposDeLaVuelta();
            const ficha = fichaDeLaVuelta({
                entrada, sinLosNiveles: vuelta.ficha, antes, despues, sustituidos: SUSTITUIDOS,
                deLasTablas: especialesDeLasTablas([{ clase: claseGuerrero, nivel: 4 }]),
                marcar: [], desmarcar: [{ idDote: 5, idExtra: 0, origen: 'Nivel 3' }],
            });
            const col: any = ficha.colecciones;

            // La raza de antes, sin base; el tipo y lo de su raza, del motor.
            expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase, ficha.personaje.idTipoCriatura]).toEqual([2, null, 11]);
            expect(col.clases).toEqual([{ idClase: GUERRERO, nivel: 4 }]);
            expect(ficha.niveles!.map((n) => [n.idClase, n.nivelClase])).toEqual([[GUERRERO, 1], [GUERRERO, 2], [GUERRERO, 3], [GUERRERO, 4]]);
            expect(ficha.personaje.puntosGolpe).toBe(35);
            // La Constitución guardada y la Fuerza sin el +2 de la raza (una sola vez: el motor ya quitó todo).
            expect(ficha.caracteristicas.constitucion).toEqual({ valor: 14, minimo: 0, perdido: false });
            expect(ficha.caracteristicas.fuerza.valor).toBe(16);
            // Sin el agrandado ni el rasgo de la raza mutada; los idiomas, los que tenía.
            expect(col.subtipos).toEqual([{ idSubtipo: 3 }]);
            expect(col.raciales).toEqual([{ idRacial: 12 }]);
            expect(col.idiomas).toEqual([{ idIdioma: 1 }, { idIdioma: 4 }]);
            // Sin la dote ni la aptitud del engendro; reprender se va (ninguna tabla lo da) y la dote vuelve a valer.
            expect(col.dotes).toEqual([{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Nivel 3' }]);
            expect(col.especiales).toEqual([]);
            // Los rangos: los 4 del engendro, una sola vez.
            expect(col.habilidades.base[0].rangos).toBe(6);
        });

        it('con resurrección, el nivel de más: su 4.º de guerrero, con la Constitución en su DG', () => {
            const entrada = enanoEngendro();
            const sinEngendro = fichaSinElNivel({ entrada, indice: 4, clase: claseEngendro, caras: 12, dgsAntes: 5 });
            const vuelta = conLaConstitucionDeVuelta(sinEngendro.ficha, 14, 4);
            const deMas = fichaSinElNivel({ entrada: vuelta.ficha, indice: 3, clase: claseGuerrero, caras: 10, dgsAntes: 4 });
            // 35 − (4 + 2).
            expect(deMas.pg.despues).toBe(29);
            expect((deMas.ficha.colecciones as any).clases).toEqual([{ idClase: GUERRERO, nivel: 3 }]);
        });

        it('el resumen: la raza, los niveles del engendro, el de más, el NEP, los PX, el tipo y la Constitución', () => {
            const entrada = enanoEngendro();
            const sinEngendro = fichaSinElNivel({ entrada, indice: 4, clase: claseEngendro, caras: 12, dgsAntes: 5 });
            const nombres = {
                dote: (id: number) => id === 77 ? 'Iniciativa mejorada' : `Dote ${id}`, aptitud: () => 'Debilidades del engendro', conjuro: () => '', idioma: () => '',
                dominio: () => '', habilidad: () => ({ nombre: 'Trepar', rangos: 10 }), caracteristica: () => ({ nombre: '', valor: 0 }),
            };
            const filas = cambiosDeLaVuelta({
                antes: { Tipo_criatura: { Nombre: 'Muerto viviente' }, Fuerza: 18, Constitucion: 0, Constitucion_perdida: true, Raciales: [{ Nombre: 'Visión en la oscuridad' }] } as any,
                despues: { Tipo_criatura: { Nombre: 'Humanoide' }, Fuerza: 16, Constitucion: 14, Raciales: [] } as any,
                raza: 'Engendro vampírico', razaDeAntes: 'Enano', claseDeMonstruo: 'Engendro vampírico', nivelesDeLaClase: 1,
                loQueDaban: filasDelNivelPerdido(sumarPerdidas([sinEngendro])!, nombres),
                nivelDeMas: { fila: { que: 'Nivel de clase', antes: 'Guerrero 4', ahora: 'Guerrero 3' }, loQueDaba: [] },
                pierdeConstitucion: false, constitucion: 14, nep: { antes: 5, despues: 3 }, px: { antes: 8000, enMedio: 8000, despues: 4500 },
                pg: { antes: 34, despues: 29, exacto: true }, aptitudes: [], vuelvenAValer: ['Dureza'], sinPoderUsar: [],
            });
            const fila = (que: string) => filas.find((f) => f.que === que);

            expect([fila('Raza')?.antes, fila('Raza')?.ahora]).toEqual(['Engendro vampírico', 'Enano']);
            expect([fila('Niveles de Engendro vampírico')?.antes, fila('Niveles de Engendro vampírico')?.ahora]).toEqual(['Engendro vampírico 1', 'Lo pierde']);
            expect(fila('Dotes')?.antes).toBe('Iniciativa mejorada');
            expect(fila('Dotes')?.porque).toBe('Lo daban los niveles de la clase de monstruo');
            expect(fila('Rangos de Trepar')?.ahora).toBe('6');
            expect([fila('Nivel de más')?.antes, fila('Nivel de más')?.ahora]).toEqual(['Guerrero 4', 'Guerrero 3']);
            expect([fila('NEP')?.antes, fila('NEP')?.ahora]).toEqual(['5', '3']);
            expect([fila('PX')?.antes, fila('PX')?.ahora]).toEqual(['8.000', '4.500']);
            expect(fila('PX')?.porque).toContain('Manual del jugador, pág. 171');
            expect([fila('Tipo')?.antes, fila('Tipo')?.ahora]).toEqual(['Muerto viviente', 'Humanoide']);
            expect([fila('Constitución')?.antes, fila('Constitución')?.ahora]).toEqual(['Sin ella', '14']);
            expect(filas.filter((f) => f.que === 'Constitución').length).toBe(1);
            expect([fila('Fuerza')?.antes, fila('Fuerza')?.ahora]).toEqual(['18', '16']);
            expect([fila('Puntos de golpe')?.antes, fila('Puntos de golpe')?.ahora]).toEqual(['34', '29']);
            expect(fila('Rasgos raciales')?.antes).toBe('Visión en la oscuridad');
            expect(fila('Vuelven a valer')?.antes).toBe('Dureza');
        });
    });

    it('con un solo DG sin la clase de monstruo: el enano guerrero 1 / engendro 1 con 500 PX queda guerrero 1 con 500 y Constitución 14 → 12', () => {
        const entrada = enanoEngendro([10], [7], 17);
        const estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: entrada.niveles, clases: entrada.colecciones!.clases as any, dgs: 2, constitucion: 14 });
        expect([estado.motivo, estado.motivoConResurreccion, estado.dgsSinLaClase]).toEqual([null, null, 1]);
        expect(nepTrasLaVuelta(2, 1, ENANO, ENANO, 2)).toBe(1);
        expect(pxTrasLaVuelta(500, 1, null)).toEqual({ enMedio: 500, despues: 500 });
        const sinEngendro = fichaSinElNivel({ entrada, indice: 1, clase: claseEngendro, caras: 12, dgsAntes: 2 });
        const vuelta = conLaConstitucionDeVuelta(sinEngendro.ficha, 14, 1);
        // 17 − 7 = 10, el guerrero 1 al máximo sin Constitución, y +2 con la de vuelta.
        expect(vuelta.ficha.personaje.puntosGolpe).toBe(12);
        const menos = fichaConConstitucionPerdida(vuelta.ficha, 1)!;
        expect([menos.antes, menos.despues]).toEqual([14, 12]);
        expect(menos.ficha.caracteristicas.constitucion.valor).toBe(12);
        expect(menos.pg.despues).toBe(11);
        expect((menos.ficha.colecciones as any).clases).toEqual([{ idClase: GUERRERO, nivel: 1 }]);
        // Con Constitución 2, no: los 2 puntos la dejarían en 0.
        const debil = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: entrada.niveles, clases: entrada.colecciones!.clases as any, dgs: 2, constitucion: 2 });
        expect(debil.motivoConResurreccion).toBe(motivoSinConstitucionParaVolver(2));
        expect(debil.motivoConResurreccion).toBe('Con Constitución 2 no se le puede devolver la vida: los 2 puntos que pierde la dejarían en 0 (Manual del jugador, pág. 285).');
        expect(debil.motivo).toBeNull();
    });

    describe('el clérigo que vuelve a expulsar', () => {
        it('la aptitud sustituida vuelve de la tabla de su clase, aunque dos aptitudes pasaran a la misma', () => {
            const deLasTablas = especialesDeLasTablas([{ clase: claseClerigo, nivel: 2 }]);
            expect(deLasTablas).toEqual([{ idEspecial: EXPULSAR_O_REPRENDER, idExtra: 0 }]);
            const clave = (e: any) => ({ id: e.idEspecial, extra: e.idExtra });
            // Reprender (de las dos) se va; vuelve la de su tabla, la que tenía, y no la otra.
            expect(especialesDevueltos([{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: 9, idExtra: 2 }], SUSTITUIDOS_DOS, deLasTablas, clave))
                .toEqual([{ idEspecial: 9, idExtra: 2 }, { idEspecial: EXPULSAR_O_REPRENDER, idExtra: 0 }]);
            // Si una tabla da también reprender (un clérigo maligno que lo tiene así), se queda.
            expect(especialesDevueltos([{ idEspecial: REPRENDER, idExtra: 0 }], SUSTITUIDOS_DOS, [...deLasTablas, { idEspecial: REPRENDER, idExtra: 0 }], clave))
                .toEqual([{ idEspecial: REPRENDER, idExtra: 0 }, { idEspecial: EXPULSAR_O_REPRENDER, idExtra: 0 }]);
            // Sin sustituciones, las mismas.
            expect(especialesDevueltos([{ idEspecial: REPRENDER, idExtra: 0 }], [], deLasTablas, clave)).toEqual([{ idEspecial: REPRENDER, idExtra: 0 }]);
        });

        it('en la ficha: el humano clérigo 2 / engendro 1 con resurrección verdadera vuelve a expulsar, sin la aptitud del engendro', () => {
            const entrada = enanoEngendro([8, 5], [7], 20);
            entrada.niveles = [nivelDe(CLERIGO, 1, 8), nivelDe(CLERIGO, 2, 5), entrada.niveles![2]];
            (entrada.colecciones as any).clases = [{ idClase: CLERIGO, nivel: 2 }, { idClase: ENGENDRO, nivel: 1 }];
            const sinEngendro = fichaSinElNivel({ entrada, indice: 2, clase: claseEngendro, caras: 12, dgsAntes: 3 });
            const vuelta = conLaConstitucionDeVuelta(sinEngendro.ficha, 14, 2);
            const { antes, despues } = cuerposDeLaVuelta();
            const ficha = fichaDeLaVuelta({
                entrada, sinLosNiveles: vuelta.ficha, antes, despues, sustituidos: SUSTITUIDOS_DOS, marcar: [], desmarcar: [],
                deLasTablas: especialesDeLasTablas([{ clase: claseClerigo, nivel: 2 }]),
            });
            expect((ficha.colecciones as any).especiales).toEqual([{ idEspecial: EXPULSAR_O_REPRENDER, idExtra: 0 }]);
            expect((ficha.colecciones as any).especiales.some((e: any) => e.idEspecial === APTITUD_ENGENDRO || e.idEspecial === EXPULSAR)).toBeFalse();
        });
    });

    it('el gnoll engendro vampírico 1 con 3.000 PX (NEP 4): con resurrección verdadera queda en NEP 3 con 3.000; con resurrección, no (un DG racial)', () => {
        const estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: [nivelDe(ENGENDRO, 1, 7)], clases: [{ idClase: ENGENDRO, nivel: 1 }], dgs: 3, constitucion: 13 });
        expect(estado.motivo).toBeNull();
        expect(estado.motivoConResurreccion).toBe(MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL);
        expect([estado.dgsSinLaClase, estado.conOtrasClases]).toEqual([2, false]);
        expect(nepTrasLaVuelta(4, 1, GNOLL, GNOLL, 1)).toBe(3);
        expect(pxTrasLaVuelta(3000, 3, null)).toEqual({ enMedio: 3000, despues: 3000 });
    });

    describe('lo que no se puede (los 409 del contrato), deshabilitado con su porqué', () => {
        it('sin clase de monstruo (un muerto viviente por plantilla, una raza sin ella)', () => {
            expect(estadoDeLaVuelta({ claseDeMonstruo: null, niveles: [], clases: [], dgs: 5, constitucion: 14 }).motivo).toBe(MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO);
            expect(MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO).toBe('Solo se devuelve así la vida a quien se convirtió en muerto viviente con una clase de monstruo.');
        });

        it('con niveles de otra clase después de la de monstruo: con el orden real y, por conocer, si la terminó', () => {
            const despues = [...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => nivelDe(ENGENDRO, n, 6)), nivelDe(GUERRERO, 1, 8)];
            const clases = [{ idClase: ENGENDRO, nivel: 8 }, { idClase: GUERRERO, nivel: 1 }];
            expect(tomoNivelesDespues(despues, ENGENDRO, claseEngendro, clases)).toBeTrue();
            expect(estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: despues, clases, dgs: 5, constitucion: 14 }).motivo).toBe(MOTIVO_VUELTA_NIVELES_DESPUES);
            // Los de guerrero antes (el que se convirtió): sí.
            expect(tomoNivelesDespues(enanoEngendro().niveles, ENGENDRO, claseEngendro, enanoEngendro().colecciones!.clases as any)).toBeFalse();
            // Con el orden por conocer: terminada y con otras, después; sin terminar, la última.
            const sinOrden = despues.map((n) => ({ ...n, ordenConocido: false }));
            expect(tomoNivelesDespues(sinOrden, ENGENDRO, claseEngendro, clases)).toBeTrue();
            expect(tomoNivelesDespues(sinOrden, ENGENDRO, claseEngendro, [{ idClase: ENGENDRO, nivel: 3 }, { idClase: GUERRERO, nivel: 4 }])).toBeFalse();
        });

        it('sin una Constitución guardada, con ningún medio (409 perdida_sin_constitucion)', () => {
            const entrada = enanoEngendro();
            const estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: entrada.niveles, clases: entrada.colecciones!.clases as any, dgs: 5, constitucion: null });
            expect(estado.motivo).toBe(motivoSinConstitucionParaVolver(null));
        });
    });

    describe('sin ningún DG: gana el 1.er nivel de una clase básica (contrato, «Sin ningún DG»)', () => {
        const HUMANO = { Ajuste_nivel: 0, Dgs_adicionales: { Cantidad: 0 } } as any;
        const DROW = { Ajuste_nivel: 2, Dgs_adicionales: { Cantidad: 0 } } as any;

        it('el humano guerrero 1 que se convirtió en engendro 1: ya no es un 409; con los dos medios, si la Constitución da', () => {
            const estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: [nivelDe(ENGENDRO, 1, 12)], clases: [{ idClase: ENGENDRO, nivel: 1 }], dgs: 1, constitucion: 12 });
            expect(estado).toEqual({ motivo: null, motivoConResurreccion: null, nivelesDeLaClase: 1, dgsSinLaClase: 0, conOtrasClases: false, ganaNivel: true });
            // Con resurrección paga 2 puntos de Constitución, como cualquier personaje de 1.er nivel: con 2, no se puede.
            const debil = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: [nivelDe(ENGENDRO, 1, 12)], clases: [{ idClase: ENGENDRO, nivel: 1 }], dgs: 1, constitucion: 2 });
            expect([debil.motivo, debil.motivoConResurreccion]).toEqual([null, motivoSinConstitucionParaVolver(2)]);
            expect(MEDIOS_DE_LA_VUELTA[0].porque).toContain('si vuelve con su 1.er nivel, pierde 2 puntos de Constitución');
        });

        it('los PX y el NEP, ya con el 1.er nivel nuevo: la mitad de su nivel o los suyos si tenía menos', () => {
            // Humano guerrero 1 convertido en engendro 1: con 0 PX, 0; con 500, 500 (NEP 1).
            expect(nepTrasLaVuelta(1, 0, HUMANO, HUMANO, 1)).toBe(1);
            expect(pxTrasLaVuelta(0, 1, null).despues).toBe(0);
            expect(pxTrasLaVuelta(500, 1, null).despues).toBe(500);
            // El humano engendro vampírico 3 con 3.000 (NEP 3) queda guerrero 1 con 500.
            expect(nepTrasLaVuelta(3, 2, HUMANO, HUMANO, 3)).toBe(1);
            expect(pxTrasLaVuelta(3000, 1, null)).toEqual({ enMedio: 500, despues: 500 });
            // El drow engendro vampírico 3 con 10.000 (NEP 5, ajuste +2) queda con 4.500 y NEP 3.
            expect(nepTrasLaVuelta(5, 2, DROW, DROW, 3)).toBe(3);
            expect(pxTrasLaVuelta(10000, 3, null).despues).toBe(4500);
        });

        it('los PG, al máximo del dado de su clase con su Constitución de ahora (con resurrección, ya rebajada)', () => {
            expect(pgDelPrimerNivel(10, 12).total).toBe(11);
            expect(pgDelPrimerNivel(10, 10).total).toBe(10);
            expect(pgDelPrimerNivel(4, 3).total).toBe(1);
        });

        it('solo las básicas: ni de prestigio ni de monstruo', () => {
            expect(esClaseParaVolverSinDg(claseGuerrero)).toBeTrue();
            expect(esClaseParaVolverSinDg({ ...claseGuerrero, Prestigio: true })).toBeFalse();
            expect(esClaseParaVolverSinDg({ ...claseEngendro, Mutacion: { Id: 1009, Nombre: 'Engendro vampírico' } })).toBeFalse();
            expect(esClaseParaVolverSinDg(null)).toBeFalse();
        });

        it('el paladín y el monje que tuvo antes de la clase de monstruo siguen cerrados; si nunca los tuvo, no', () => {
            const PALADIN = 12;
            const paladin: any = { Id: PALADIN, Nombre: 'Paladín', Multiclase_restringida: true, Conjuros: {} };
            const clase = (id: number) => id === PALADIN ? paladin : id === ENGENDRO ? claseEngendro : null;
            // El paladín 1 que perdió su nivel al convertirse.
            const cerradas = restringidasCerradasAlVolver({
                nivelesPerdidos: [{ idClase: PALADIN, ordenConocido: true, clasesAnteriores: [] }], claseDeMonstruo: claseEngendro, clase,
            });
            expect(cerradas.get(PALADIN)).toBe('Tras ganar niveles de engendro vampírico ya no puede volver a subir de paladín, aunque los pierda (Manual del jugador, págs. 52 y 55).');
            // El creado como engendro, que nunca fue paladín; uno perdido después de la clase de monstruo; una raza que lo deja libre.
            expect(restringidasCerradasAlVolver({ nivelesPerdidos: [], claseDeMonstruo: claseEngendro, clase }).size).toBe(0);
            expect(restringidasCerradasAlVolver({
                nivelesPerdidos: [{ idClase: PALADIN, ordenConocido: true, clasesAnteriores: [ENGENDRO] }], claseDeMonstruo: claseEngendro, clase,
            }).size).toBe(0);
            expect(restringidasCerradasAlVolver({
                nivelesPerdidos: [{ idClase: PALADIN, ordenConocido: true, clasesAnteriores: [] }], claseDeMonstruo: claseEngendro, clase, libres: [PALADIN],
            }).size).toBe(0);
        });

        it('la dote adicional del humano y sus idiomas por Inteligencia no se van con los niveles de la clase de monstruo', () => {
            const nivel = nivelDe(ENGENDRO, 1, 12, [
                { tipo: 'dote', idElemento: 77, idExtra: 0, origen: 'Engendro vampírico nivel 1' },
                { tipo: 'dote', idElemento: 30, idExtra: 0, origen: 'Dote adicional de raza: Humano' },
                { tipo: 'idioma', idElemento: 6, origen: 'Idiomas iniciales' },
                { tipo: 'rangos', idElemento: 40, idExtra: 0, valor: 4 },
            ]);
            const entrada: any = { personaje: {}, colecciones: { clases: [{ idClase: ENGENDRO, nivel: 1 }] }, niveles: [nivel] };
            const { entrada: sin, delPrimerNivel } = apartarLoDelPrimerNivel(entrada, ENGENDRO);
            expect(delPrimerNivel.map((e) => [e.tipo, e.idElemento])).toEqual([['dote', 30], ['idioma', 6]]);
            expect(sin.niveles![0].elecciones!.map((e) => [e.tipo, e.idElemento])).toEqual([['dote', 77], ['rangos', 40]]);
            // La entrada no cambia.
            expect(entrada.niveles[0].elecciones.length).toBe(4);
        });

        it('«Lo que cambia» con el nivel ganado y lo que da, los PG al máximo y la Constitución que paga', () => {
            const pj = (con: number, ataque: string): any => ({ Tipo_criatura: { Nombre: 'Humanoide' }, Raciales: [], Fuerza: 14, Constitucion: con, Ataque_base: ataque });
            const filas = cambiosDeLaVuelta({
                antes: pj(0, '+0'), despues: pj(10, '+1'), raza: 'Engendro vampírico', razaDeAntes: 'Humano', claseDeMonstruo: 'Engendro vampírico',
                nivelesDeLaClase: 3, loQueDaban: [], nivelDeMas: null, pierdeConstitucion: true, constitucion: 10,
                nep: { antes: 3, despues: 1 }, px: { antes: 3000, enMedio: 500, despues: 500 }, pg: { antes: 20, despues: 10, exacto: true },
                aptitudes: [], vuelvenAValer: [], sinPoderUsar: [],
                nivelNuevo: { clase: 'Guerrero', caras: 10, filas: [{ que: 'Ataque base', antes: '+0', ahora: '+1', porque: 'Guerrero 1' }] },
            });
            const fila = (que: string) => filas.find((f) => f.que === que);
            expect([fila('Nivel ganado')?.antes, fila('Nivel ganado')?.ahora]).toEqual(['—', 'Guerrero 1']);
            expect(fila('Ataque base')?.ahora).toBe('+1');
            expect(fila('NEP')?.porque).toBe('Sin la clase de monstruo y con su 1.er nivel de guerrero');
            expect([fila('PX')?.antes, fila('PX')?.ahora]).toEqual(['3.000', '500']);
            expect(fila('PX')?.porque).toContain('ya con el 1.er nivel nuevo');
            expect(fila('Constitución')?.porque).toContain('es de 1.er nivel');
            expect([fila('Puntos de golpe')?.ahora, fila('Puntos de golpe')?.porque]).toEqual(['10', 'Sin los DG que pierde y con el de su 1.er nivel de guerrero al máximo: 10 + 0 Con (Manual del jugador, pág. 23)']);
        });
    });

    it('«Perder un nivel» al volver a la vida sin Constitución lleva a «Devolver la vida» si su raza lleva clase de monstruo', () => {
        expect(motivoRevivirSinConstitucion(true)).toContain('«Devolver la vida»');
        expect(motivoRevivirSinConstitucion(false)).toContain('«Otra causa»');
        expect(motivoRevivirSinConstitucion(false)).toContain('Manual del jugador, pág. 285');
    });
});
