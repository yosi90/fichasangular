import { FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import {
    BASICA, DRACONICO, DRAGON_NEGRO, GATO, MEJORADO, MONSTRUOS_FAMILIAR, PERRO_INTERMITENTE,
    PROGRESION_FAMILIAR_API,
} from 'src/testing/familiar-api';
import {
    ELEMENTAL_AIRE_PEQUENO, FAMILIAR_ELEMENTAL, MONSTRUOS_SUSTITUCION_MASCOTAS, PLANTILLA_FAMILIAR_ELEMENTAL_API,
} from 'src/testing/niveles-sustitucion-mascotas-api';
import { construirCatalogoFamiliaresDesdeMonstruos, tablaDelFamiliar } from './familiar-reglas';
import { construirFamiliarParaGuardar, mitadDeLosPg, vidaMediaDelMonstruo, vidaMediaPorDados } from './mascota-payload';
import { leerFamiliarProgresion } from './monstruo-mapper';

describe('el familiar para guardar, con la tabla de su pseudoplantilla al nivel de su amo (MJ págs. 44-45)', () => {
    const progresion = leerFamiliarProgresion(PROGRESION_FAMILIAR_API);
    const catalogo = construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_FAMILIAR);
    const de = (id: number, plantilla: number): FamiliarMonstruoDetalle =>
        catalogo.find((f) => f.Id_familiar === id && f.Plantilla.Id === plantilla)!;
    const amo = (vida: number, ataqueBase: number) => ({
        vida, ataqueBase, salvacionesBase: { fortaleza: 0, reflejos: 0, voluntad: 2 }, habilidades: [],
    });
    const guardar = (id: number, plantilla: number, nivel: number, vida: number, ataque: number) =>
        construirFamiliarParaGuardar(de(id, plantilla), amo(vida, ataque), tablaDelFamiliar(progresion, plantilla, nivel));

    it('el gato de un mago 1: armadura natural +1, Inteligencia 6, la mitad de sus PG, su ataque base y sin RC', () => {
        const gato = guardar(GATO, BASICA, 1, 5, 0);
        expect([gato.armaduraNatural, gato.inteligencia, gato.vida, gato.ataqueBase, gato.rc]).toEqual([1, 6, 2, 0, undefined]);
        expect(guardar(GATO, BASICA, 1, 1, 0).vida).toBe(1);
    });

    it('el mago 11: la resistencia a conjuros, su nivel +5', () => {
        const gato = guardar(GATO, BASICA, 11, 40, 5);
        expect([gato.armaduraNatural, gato.inteligencia, gato.rc]).toEqual([6, 11, '16']);
    });

    it('la Inteligencia de su criatura si es mayor que la de la tabla (el perro intermitente, 10)', () => {
        expect(guardar(PERRO_INTERMITENTE, MEJORADO, 5, 20, 2).inteligencia).toBe(10);
        expect(guardar(PERRO_INTERMITENTE, MEJORADO, 13, 40, 6).inteligencia).toBe(12);
    });

    it('el dracónico: su tabla, y los PG y el ataque mayores entre los de su amo y los suyos (F8)', () => {
        // La cría de dragón negro (4d12, Con 13: 30 PG, +4) de un hechicero 9 con 30 PG y +2 (personajes.md).
        const cria = guardar(DRAGON_NEGRO, DRACONICO, 9, 30, 2);
        expect([cria.armaduraNatural, cria.inteligencia, cria.vida, cria.ataqueBase, cria.rc]).toEqual([2, 8, 30, 4, undefined]);
        // Con un amo de más PG y más ataque, los de su amo.
        const conAmoFuerte = guardar(DRAGON_NEGRO, DRACONICO, 13, 80, 6);
        expect([conAmoFuerte.armaduraNatural, conAmoFuerte.vida, conAmoFuerte.ataqueBase, conAmoFuerte.rc]).toEqual([3, 40, 6, '18']);
    });

    it('el familiar elemental (Pg_mayores, R8, tanda 1b): los PG mayores, y el ataque base de su amo aunque el suyo sea mayor', () => {
        const conElemental = leerFamiliarProgresion({
            ...PROGRESION_FAMILIAR_API, Plantillas: [...PROGRESION_FAMILIAR_API.Plantillas, PLANTILLA_FAMILIAR_ELEMENTAL_API],
        });
        const elemental = construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_SUSTITUCION_MASCOTAS)
            .find((f) => f.Id_familiar === ELEMENTAL_AIRE_PEQUENO && f.Plantilla.Id === FAMILIAR_ELEMENTAL)!;
        const tabla = tablaDelFamiliar(conElemental, FAMILIAR_ELEMENTAL, 1);
        expect([tabla.plantilla?.Pg_mayores, tabla.plantilla?.Pg_ataque_mayores]).toEqual([true, false]);
        // 4d8 con Con 14: 26 PG, más que la mitad de los 6 de un hechicero raptorán 1; su ataque base (+3), no: el de su amo.
        const debil = construirFamiliarParaGuardar(elemental, amo(6, 0), tabla);
        expect([debil.vida, debil.ataqueBase]).toEqual([26, 0]);
        // Con un amo de más PG, la mitad de los suyos.
        const fuerte = construirFamiliarParaGuardar(elemental, amo(70, 5), tablaDelFamiliar(conElemental, FAMILIAR_ELEMENTAL, 11));
        expect([fuerte.vida, fuerte.ataqueBase]).toEqual([35, 5]);
    });

    it('sus aptitudes son las que lleva, sin las de su amo', () => {
        const gato = construirFamiliarParaGuardar({
            ...de(GATO, BASICA), Especiales: [{ Especial: { Id: 57 } as any, Contexto: {} }],
        }, amo(10, 1), tablaDelFamiliar(progresion, BASICA, 1));
        expect(gato.especiales).toEqual([{ idEspecial: 57 }]);
    });
});

describe('puntos de golpe medios de unos DG', () => {
    it('la media del dado y la Constitución por DG, con al menos 1 por DG', () => {
        expect(vidaMediaPorDados(6, 8, 2)).toBe(39);
        expect(vidaMediaPorDados(1, 4, -3)).toBe(1);
        expect(vidaMediaPorDados(0, 8, 2)).toBe(1);
    });

    it('los de un monstruo, también con menos de un DG, como la API', () => {
        const con = (Cantidad: string, Nombre: string, mod: number) => vidaMediaDelMonstruo({
            Dados_golpe: { Cantidad, Tipo_dado: { Id: 1, Nombre }, Suma: 0 }, Caracteristicas: { Constitucion_modificador: mod } as any,
        } as any);
        expect(con('4', 'd12', 1)).toBe(30);
        expect(con('1/2', 'd8', 0)).toBe(2);
        expect(con('1/4', 'd8', 0)).toBe(1);
    });

    it('la mitad de los del amo, como mínimo 1', () => {
        expect(mitadDeLosPg(31)).toBe(15);
        expect(mitadDeLosPg(1)).toBe(1);
        expect(mitadDeLosPg(0)).toBe(1);
    });
});

describe('el familiar inactivo para guardar (contrato, «La mascota inactiva…»)', () => {
    const progresion = leerFamiliarProgresion(PROGRESION_FAMILIAR_API);
    const gato = construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_FAMILIAR).find((f) => f.Id_familiar === GATO && f.Plantilla.Id === BASICA)!;
    const amo = { vida: 30, ataqueBase: 5, salvacionesBase: { fortaleza: 4, reflejos: 4, voluntad: 6 }, habilidades: [{ idHabilidad: 7, idExtra: -1, rangos: 8 }] };

    it('vale su criatura tal cual: sin los PG, el ataque, las salvaciones ni los rangos de su amo, ni la tabla, y con `inactiva`', () => {
        const inactivo = construirFamiliarParaGuardar({ ...gato, Inactiva: true }, amo, tablaDelFamiliar(progresion, BASICA, 11));
        expect([inactivo.vida, inactivo.ataqueBase, inactivo.armaduraNatural, inactivo.inteligencia, inactivo.rc, inactivo.inactiva])
            .toEqual([vidaMediaDelMonstruo(gato), 0, 0, 2, undefined, true]);
        expect([inactivo.fortaleza, inactivo.reflejos, inactivo.voluntad]).toEqual([2, 4, 1]);
        expect(inactivo.habilidades).toEqual([]);
        // Activo, con lo de su amo y sin `inactiva`.
        const activo = construirFamiliarParaGuardar(gato, amo, tablaDelFamiliar(progresion, BASICA, 11));
        expect([activo.vida, activo.ataqueBase, activo.rc, activo.inactiva]).toEqual([15, 5, '16', undefined]);
    });
});
