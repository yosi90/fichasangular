import { Personaje } from 'src/app/interfaces/personaje';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { caToqueYDesprevenidaSinDefensa } from './ficha-pdf-totales';
import {
    bonificadoresCondicionalesDeRaciales,
    bonosDeCaracteristicaDeRaciales,
    caDeSiempreDeRaciales,
    frasesBonificadoresDeRasgo,
    nivelLanzadorConRasgos,
    habilidadesDeRasgos,
    leerBonificadoresCondicionales,
    sinApilarRaciales,
} from './habilidades-raciales';
import { normalizeRacial } from './racial-mapper';
import { aplicarProgresionRacial } from './racial-progresion';

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
        expect(frasesBonificadoresDeRasgo(enano)).toEqual({ deSiempre: [], condicionales: ['Ataque +1 (racial) contra orcos y trasgoides'] });
        expect(frasesBonificadoresDeRasgo(racial(9, 'Afinidad con la piedra'))).toEqual({ deSiempre: [], condicionales: [] });
        // La ficha de la API (`bonificadoresCondicionales`) se lee igual.
        expect(leerBonificadoresCondicionales(JSON.parse(JSON.stringify(salida)))).toEqual(salida);
        expect(leerBonificadoresCondicionales([{ objetivo: { Id: 1, Nombre: 'CA' }, valor: 0 }, null])).toEqual([]);
    });

    // La esquiva del svirfneblin contra todas las criaturas (Manual de monstruos 1, pág. 139): cuenta siempre.
    // Si cuenta de toque y desprevenido lo dice el tipo (tipos_bonificador), no su nombre.
    const ESQUIVA = { Id: 8, Nombre: 'Esquiva', Apila: true, Cuenta_toque: true, Cuenta_desprevenido: false, Campo_ficha: null };
    const deSiempre = (Id: number, Nombre: string, Cantidad: number, Tipo_bonificador: object = ESQUIVA) => racial(Id, Nombre, {
        Bonificadores_condicionales: [{ Id, Objetivo: { Id: 1, Nombre: 'CA', Cifra_ficha: 'ca' }, Tipo_bonificador, Cantidad, Condicion: null,
            Contra: [], Frase: `CA +${Cantidad} (esquiva)` }],
    });
    const svirfneblin = deSiempre(4185, 'Bonificador de esquiva +4 a la CA contra todas las criaturas (svirfneblin)', 4);

    it('los de siempre no salen aparte: se suman a la CA con su tipo, como la defensa de la API', () => {
        const enano = racial(14, '+1 de ataque contra orcos y trasgoides', { Bonificadores_condicionales: [ORCOS] });
        expect(svirfneblin.Bonificadores_condicionales?.[0].Condicion).toBeNull();
        expect(svirfneblin.Bonificadores_condicionales?.[0].Tipo_bonificador).toEqual(ESQUIVA);
        expect(bonificadoresCondicionalesDeRaciales([svirfneblin, enano]).map((b) => b.origen)).toEqual([enano.Nombre]);
        expect(caDeSiempreDeRaciales([svirfneblin, enano, svirfneblin])).toEqual({
            total: 4, sinToque: 0, sinDesprevenido: 4, partes: [{ origen: svirfneblin.Nombre, tipo: 'Esquiva', valor: 4 }],
        });
        // Dos esquivas se apilan (Manual del jugador, pág. 136); de un tipo que no apila, el mayor.
        expect(caDeSiempreDeRaciales([svirfneblin, deSiempre(2185, 'Esquiva (svirfneblin)', 1)]).total).toBe(5);
        const desvio = { Id: 6, Nombre: 'Desvío', Apila: false, Cuenta_toque: true, Cuenta_desprevenido: true, Campo_ficha: 'desvio' };
        expect(caDeSiempreDeRaciales([deSiempre(1, 'A', 1, desvio), deSiempre(2, 'B', 2, desvio)])).toEqual({
            total: 2, sinToque: 0, sinDesprevenido: 0, partes: [{ origen: 'B', tipo: 'Desvío', valor: 2 }],
        });
        // Un tipo que no cuenta de toque (la armadura natural, o uno homebrew con esa marca), por su dato.
        const natural = { Id: 3, Nombre: 'Armadura natural', Apila: false, Cuenta_toque: false, Cuenta_desprevenido: true, Campo_ficha: 'armadura_natural' };
        expect(caDeSiempreDeRaciales([deSiempre(5, 'Piel', 1, natural), svirfneblin])).toEqual(jasmine.objectContaining({
            total: 5, sinToque: 1, sinDesprevenido: 4,
        }));
        // Una caché anterior sin las marcas: cuenta en las dos, como el valor por defecto de la base.
        expect(deSiempre(6, 'Viejo', 1, { Id: 8, Nombre: 'Esquiva', Apila: true }).Bonificadores_condicionales?.[0].Tipo_bonificador)
            .toEqual(jasmine.objectContaining({ Cuenta_toque: true, Cuenta_desprevenido: true }));
        expect(caDeSiempreDeRaciales(null).total).toBe(0);
    });

    // La última tanda de las razas mutadas (2026-11-12): lo de los rasgos se apila por tipo con los campos de la raza,
    // como la defensa de la API (máster de Rol: la armadura natural, el desvío y los varios «sin tipo»).
    it('los de siempre se apilan por tipo con la armadura natural, el desvío y los varios de la raza', () => {
        const natural = { Id: 3, Nombre: 'Armadura natural', Apila: false, Cuenta_toque: false, Cuenta_desprevenido: true, Campo_ficha: 'armadura_natural' };
        const sinTipo = { Id: 19, Nombre: 'Sin tipo', Apila: true, Cuenta_toque: true, Cuenta_desprevenido: true, Campo_ficha: 'varios' };
        const piel = deSiempre(5, 'Piel', 3, natural);
        // Un +3 de armadura natural de un rasgo sobre una raza con +2: suma 1 más (y ese 1 no cuenta de toque).
        expect(caDeSiempreDeRaciales([piel], { armadura_natural: 2 })).toEqual({
            total: 1, sinToque: 1, sinDesprevenido: 0, partes: [{ origen: 'Piel', tipo: 'Armadura natural', valor: 1 }],
        });
        // Con una raza de +4, el rasgo no suma nada.
        expect(caDeSiempreDeRaciales([piel], { armadura_natural: 4 })).toEqual({ total: 0, sinToque: 0, sinDesprevenido: 0, partes: [] });
        // Los varios de la raza son «sin tipo» y se apilan; la esquiva, con todo.
        expect(caDeSiempreDeRaciales([deSiempre(6, 'Varios', 1, sinTipo), svirfneblin], { armadura_natural: 2, varios: 1 }).total).toBe(5);
        // La hoja en la creación: la de toque quita la armadura natural de la raza y lo que el rasgo suma de más.
        const pj = { Ca: 10 + 3, ModDestreza: 0, Armadura_natural: 2, Raciales: [piel], Defensa: null } as unknown as Personaje;
        expect(caToqueYDesprevenidaSinDefensa(pj)).toEqual({ toque: 10, desprevenido: 13 });
    });

    // Krau (Races of Destiny, pág. 54): +1 sin tipo (+2 desde nivel 2) al nivel de lanzador, sin pasar de sus DG.
    it('krau suma al nivel de lanzador sin pasar de sus DG, y solo a una clase que ya lanza', () => {
        const krau = racial(4873, 'Sigilo de poder: krau (magia)', {
            Bonificadores_condicionales: [{ Id: 69, Objetivo: { Id: 15, Nombre: 'Nivel de lanzador', Cifra_ficha: 'nivel_lanzador' },
                Tipo_bonificador: SIN_TIPO, Cantidad: 2, Condicion: null, Contra: [], Tope_dg: true, Frase: 'Nivel de lanzador +2 (sin tipo), sin pasar de sus DG' }],
        });
        // Los ejemplos del máster: mago 5/guerrero 2, clérigo 3/mago 3, paladín 4, mago 6 y mago 1.
        expect([[5, 7], [3, 6], [2, 4], [6, 6], [1, 1], [0, 4]].map(([nivel, dgs]) => nivelLanzadorConRasgos(nivel, [krau], dgs)))
            .toEqual([7, 5, 4, 6, 1, 0]);
        // No es de la CA ni condicional: en el detalle, aparte.
        expect(caDeSiempreDeRaciales([krau]).total).toBe(0);
        expect(bonificadoresCondicionalesDeRaciales([krau])).toEqual([]);
        expect(frasesBonificadoresDeRasgo(krau)).toEqual({ deSiempre: ['Nivel de lanzador +2 (sin tipo), sin pasar de sus DG'], condicionales: [] });
    });

    // Con la `defensa` de la API, la hoja pone las suyas (`camposPdfEquipo`, en `personaje-equipo-mapper.spec.ts`).
    it('la hoja en la creación: la CA de toque y la desprevenida, sin la esquiva', () => {
        const pj = { Ca: 16, ModDestreza: 2, Armadura_natural: 0, Raciales: [svirfneblin], Defensa: null } as unknown as Personaje;
        expect(caToqueYDesprevenidaSinDefensa(pj)).toEqual({ toque: 16, desprevenido: 10 });
        expect(caToqueYDesprevenidaSinDefensa({ ...pj, ModDestreza: -1, Ca: 13, Armadura_natural: 1 } as Personaje)).toEqual({ toque: 12, desprevenido: 9 });
    });

    // Los sigilos de poder del iluminiano (Races of Destiny, págs. 53-54): +1 sin tipo a las pruebas de una característica
    // y de sus habilidades, +2 desde nivel 2. Los mismos casos que `SigilosDePoderTests` de la API.
    const SIN_TIPO = { Id: 19, Nombre: 'Sin tipo', Apila: true, Cuenta_toque: true, Cuenta_desprevenido: true, Campo_ficha: 'varios' };
    const sigilo = (Id: number, Nombre: string, caracteristicas: { Id: number; Nombre: string; }[]) => racial(Id, Nombre, {
        Bonificadores_condicionales: caracteristicas.map((Caracteristica, i) => ({
            Id: Id * 10 + i, Objetivo: { Id: 18, Nombre: 'Pruebas de característica y habilidades', Cifra_ficha: 'pruebas_caracteristica' }, Tipo_bonificador: SIN_TIPO,
            Cantidad: 1, Condicion: null, Contra: [], Caracteristica, Cantidad_del_valor: true,
            Frase: `Pruebas de característica y habilidades de ${Caracteristica.Nombre} +1 (sin tipo)`,
        })),
        Progresion: [{ Medida: 'nivel', Desde: 2, Gana: null, Sustituye: null, Tipo_dote: null, Velocidad: null, Valor: '+2',
            Elige_opcional: null, Frase: 'A nivel 2: pasa a +2.' }],
    });
    const aesh = sigilo(4871, 'Sigilo de poder: aesh (vigor)', [{ Id: 1, Nombre: 'Fuerza' }]);
    const hoon = sigilo(4872, 'Sigilo de poder: hoon (vida)', [{ Id: 5, Nombre: 'Sabiduría' }, { Id: 3, Nombre: 'Constitución' }]);

    it('los sigilos de poder suman a las habilidades de su característica, +2 desde nivel 2', () => {
        const parte = (origen: string, valor: number) => ({ tipo: 'bonificador' as const, origen, valor, bonificador: 'Sin tipo' });
        const uno = bonosDeCaracteristicaDeRaciales(aplicarProgresionRacial([aesh, hoon], { dg: 1, nivel: 1 }).raciales);
        expect(uno.get('fuerza')).toEqual([parte(aesh.Nombre, 1)]);
        expect(uno.get('constitucion')).toEqual([parte(hoon.Nombre, 1)]);
        expect(uno.has('inteligencia')).toBeFalse();
        const dos = aplicarProgresionRacial([aesh, hoon], { dg: 2, nivel: 2 }).raciales;
        expect(bonosDeCaracteristicaDeRaciales(dos).get('sabiduria')).toEqual([parte(hoon.Nombre, 2)]);
        expect(dos[0].Bonificadores_condicionales?.[0].Frase).toBe('Pruebas de característica y habilidades de Fuerza +2 (sin tipo)');
        // La entrada no cambia, y no van a la CA.
        expect(aesh.Bonificadores_condicionales?.[0].Cantidad).toBe(1);
        expect(caDeSiempreDeRaciales(dos).total).toBe(0);
        expect(bonificadoresCondicionalesDeRaciales(dos)).toEqual([]);
    });
});
