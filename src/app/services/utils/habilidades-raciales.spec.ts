import { RacialDetalle } from 'src/app/interfaces/racial';
import {
    bonificadoresCondicionalesDeRaciales,
    frasesBonificadoresCondicionales,
    habilidadesDeRasgos,
    leerBonificadoresCondicionales,
    sinApilarRaciales,
} from './habilidades-raciales';
import { normalizeRacial } from './racial-mapper';

// Los mismos casos que `tests/test_racial_bonificadores.py` del backend (`utils/racial_bonificadores.py`).

const ORCOS = {
    Id: 1, Objetivo: { Id: 2, Nombre: 'Ataque' }, Tipo_bonificador: { Id: 14, Nombre: 'Racial' }, Cantidad: 1,
    Condicion: 'Contra orcos y trasgoides',
    Contra: [{ Catalogo: 'subtipo', Id: 68, Nombre: 'Orco' }, { Catalogo: 'subtipo', Id: 61, Nombre: 'Trasgoide' }, { Catalogo: 'otro', Id: 1, Nombre: 'X' }],
    Frase: 'Ataque +1 (racial) contra orcos y trasgoides',
};

const racial = (Id: number, Nombre: string, extra: Record<string, any> = {}): RacialDetalle => normalizeRacial({ Id, Nombre, ...extra });

/** Lo que suman a una habilidad lo de la raza (ya sumado) y lo de sus rasgos, sin apilar (`rangos_que_cuentan` de la API). */
const rangosQueCuentan = (deLaRaza: number, deLosRasgos: number[]): number => sinApilarRaciales<string>({
    h: [
        ...(deLaRaza !== 0 ? [{ valor: deLaRaza, origen: 'Raza', racial: 'raza' as const }] : []),
        ...deLosRasgos.map((valor) => ({ valor, origen: 'Rasgo', racial: 'rasgo' as const })),
    ],
})['h'].reduce((suma, b) => suma + b.valor, 0);

describe('habilidades-raciales', () => {
    it('los bonificadores raciales no se apilan: lo mayor entre la raza y sus rasgos; los penalizadores, todos', () => {
        expect(rangosQueCuentan(2, [2])).toBe(2);
        expect(rangosQueCuentan(2, [4])).toBe(4);
        expect(rangosQueCuentan(0, [2, 4])).toBe(4);
        expect(rangosQueCuentan(3, [2])).toBe(3);
        expect(rangosQueCuentan(2, [-4])).toBe(-2);
        expect(rangosQueCuentan(0, [])).toBe(0);
        const bonos = sinApilarRaciales<string>({
            'b:2': [{ valor: 2, origen: 'Gnomo', racial: 'raza' }, { valor: 2, origen: '+2 a artesanía alquimia', racial: 'rasgo' }, { valor: 2, origen: 'Dote' }],
            'b:6': [{ valor: 2, origen: 'Elfo', racial: 'raza' }, { valor: 4, origen: 'Rasgo', racial: 'rasgo' }, { valor: -1, origen: 'Pen', racial: 'rasgo' }],
            // Lo de la raza se suma como siempre (dos referencias al mismo hueco).
            'b:32': [{ valor: 1, origen: 'Raza', racial: 'raza' }, { valor: 2, origen: 'Raza', racial: 'raza' }, { valor: 2, origen: 'Rasgo', racial: 'rasgo' }],
            'b:7': [{ valor: 2, origen: 'Rasgo A', racial: 'rasgo' }, { valor: 4, origen: 'Rasgo B', racial: 'rasgo' }],
        });
        expect(bonos['b:2'].map((b) => b.origen)).toEqual(['Gnomo', 'Dote']);
        expect(bonos['b:6'].map((b) => b.origen)).toEqual(['Rasgo', 'Pen']);
        expect(bonos['b:32'].map((b) => b.valor)).toEqual([1, 2]);
        expect(bonos['b:7'].map((b) => b.origen)).toEqual(['Rasgo B']);
    });

    it('las habilidades con cantidad de los rasgos, una vez por rasgo, con su condición', () => {
        const mente = racial(38, 'Aspecto dracónico (mente)', {
            Habilidades: { Base: [{ Id_habilidad: 6, Rangos: 2, Condicion: null }, { Id_habilidad: 9, Rangos: 0, Se_considera_clasea: true }], Custom: [] },
        });
        const artesania = racial(17, '+2 a artesanía con objetos de piedra y/o metal', {
            Habilidades: { Base: [{ Id_habilidad: 2, Rangos: 2, Condicion: 'Objetos de piedra y/o metal' }], Custom: [{ Id_habilidad: 3, Rangos: 1 }] },
        });
        const filas = habilidadesDeRasgos([mente, artesania, mente]);
        expect(filas.map((f) => [f.origen, f.cantidad, f.condicion, f.custom])).toEqual([
            ['Aspecto dracónico (mente)', 2, null, false],
            ['+2 a artesanía con objetos de piedra y/o metal', 2, 'Objetos de piedra y/o metal', false],
            ['+2 a artesanía con objetos de piedra y/o metal', 1, null, true],
        ]);
    });

    it('los bonificadores condicionales de los rasgos, como los da la ficha, y sus frases', () => {
        const enano = racial(14, '+1 de ataque contra orcos y trasgoides', { Bonificadores_condicionales: [ORCOS] });
        expect(enano.Bonificadores_condicionales?.[0].Contra.map((c) => c.Catalogo)).toEqual(['subtipo', 'subtipo']);
        const salida = bonificadoresCondicionalesDeRaciales([enano, enano, racial(9, 'Afinidad con la piedra')]);
        expect(salida).toEqual([{
            objetivo: { Id: 2, Nombre: 'Ataque' }, tipoBonificador: { Id: 14, Nombre: 'Racial' }, valor: 1,
            condicion: 'Contra orcos y trasgoides',
            contra: [{ Catalogo: 'subtipo', Id: 68, Nombre: 'Orco' }, { Catalogo: 'subtipo', Id: 61, Nombre: 'Trasgoide' }],
            origen: '+1 de ataque contra orcos y trasgoides', frase: 'Ataque +1 (racial) contra orcos y trasgoides',
        }]);
        expect(frasesBonificadoresCondicionales(enano)).toEqual(['Ataque +1 (racial) contra orcos y trasgoides']);
        expect(frasesBonificadoresCondicionales(racial(9, 'Afinidad con la piedra'))).toBeNull();
        // La ficha de la API (`bonificadoresCondicionales`) se lee igual.
        expect(leerBonificadoresCondicionales(JSON.parse(JSON.stringify(salida)))).toEqual(salida);
        expect(leerBonificadoresCondicionales([{ objetivo: { Id: 1, Nombre: 'CA' }, valor: 0 }, null])).toEqual([]);
    });
});
