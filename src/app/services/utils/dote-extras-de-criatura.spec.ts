import { Dote } from 'src/app/interfaces/dote';
import { tiposDeArmasNaturales } from './armas-naturales';
import {
    CriaturaParaExtras,
    extrasDeCriaturaDeLaDote,
    familiaDeExtraDeCriatura,
    motivoSinExtrasDeCriatura,
    nivelLanzadorQuePide,
} from './dote-extras-de-criatura';

// Los extras de las dotes de monstruo (catalogos.md, «Los extras de las dotes de monstruo»): se elige algo de la criatura.
describe('dote-extras-de-criatura', () => {
    const dote = (soportados: Record<string, number>, prerrequisitos: Record<string, unknown> = {}): Dote =>
        ({ Id: 1, Nombre: 'Dote', Extras_soportados: soportados, Prerrequisitos: prerrequisitos } as unknown as Dote);
    const MORDISCO = { Id_arma_natural: 1, Arma_natural: 'Mordisco', Cantidad: 1, Dano: '1d6', Primaria: true, Texto: 'Mordisco 1d6' };
    const GARRA = { Id_arma_natural: 2, Arma_natural: 'Garra', Cantidad: 2, Dano: '1d4', Primaria: true, Texto: '2 garras 1d4' };
    const criatura: CriaturaParaExtras = {
        armasNaturales: tiposDeArmasNaturales({ Armas_naturales: [MORDISCO, GARRA] }),
        ataquesEspeciales: [{ Id: 70, Nombre: 'Veneno (víbora)' }],
        sortilegas: [
            { Conjuro: { Id: 10, Nombre: 'Oscuridad' }, Nivel_lanzador: 6 },
            { Conjuro: { Id: 11, Nombre: 'Bola de fuego' }, Nivel_lanzador: 10 },
            { Conjuro: { Id: 12, Nombre: 'Luz' }, Nivel_lanzador: 'igual a sus DG' },
        ],
    };

    it('la familia sale de su bandera; sin ninguna, no es de criatura', () => {
        expect(familiaDeExtraDeCriatura(dote({ Extra_arma_natural: 1 }))).toBe('arma_natural');
        expect(familiaDeExtraDeCriatura(dote({ Extra_ataque_especial: 1 }))).toBe('ataque_especial');
        expect(familiaDeExtraDeCriatura(dote({ Extra_sortilega: 1 }))).toBe('sortilega');
        expect(familiaDeExtraDeCriatura(dote({ Extra_arma: 1 }))).toBeNull();
    });

    it('Ataque natural mejorado: sus tipos de armas naturales, con su Id_arma_natural', () => {
        expect(extrasDeCriaturaDeLaDote(dote({ Extra_arma_natural: 1 }), criatura)).toEqual([
            { Id: 1, Nombre: 'Mordisco' }, { Id: 2, Nombre: 'Garra' },
        ]);
    });

    it('los tipos de armas naturales siguen a sus plantillas: la que las quita, sin ellas', () => {
        const quitaMordisco = { Armas_naturales: [{ ...MORDISCO, Cantidad: 0, Modo: 'quita' as const, Forma: 'todas' as const }] };
        expect(tiposDeArmasNaturales({ Armas_naturales: [MORDISCO, GARRA] }, [quitaMordisco]).map((t) => t.Nombre)).toEqual(['Garra']);
    });

    it('Soltura con una aptitud: sus ataques especiales, con el id de su racial', () => {
        expect(extrasDeCriaturaDeLaDote(dote({ Extra_ataque_especial: 1 }), criatura)).toEqual([{ Id: 70, Nombre: 'Veneno (víbora)' }]);
    });

    it('Apresurar aptitud sortílega: solo las que llegan al nivel de lanzador que pide', () => {
        const apresurar = dote({ Extra_sortilega: 1 }, { sortilega: [{ Nivel_lanzador: 10, Opcional: 0 }] });
        expect(nivelLanzadorQuePide(apresurar)).toBe(10);
        expect(extrasDeCriaturaDeLaDote(apresurar, criatura)).toEqual([{ Id: 11, Nombre: 'Bola de fuego' }]);
        const potenciar = dote({ Extra_sortilega: 1 }, { sortilega: [{ Nivel_lanzador: 6, Opcional: 0 }] });
        expect(extrasDeCriaturaDeLaDote(potenciar, criatura).map((e) => e.Id)).toEqual([10, 11]);
    });

    it('sin ninguno, el motivo dice qué le falta', () => {
        const nada: CriaturaParaExtras = { armasNaturales: [], ataquesEspeciales: [], sortilegas: [] };
        const apresurar = dote({ Extra_sortilega: 1 }, { sortilega: [{ Nivel_lanzador: 10, Opcional: 0 }] });
        expect(extrasDeCriaturaDeLaDote(apresurar, nada)).toEqual([]);
        expect(motivoSinExtrasDeCriatura(apresurar)).toBe('No tiene ninguna aptitud sortílega a nivel de lanzador 10 o más.');
        expect(motivoSinExtrasDeCriatura(dote({ Extra_arma_natural: 1 }))).toBe('No tiene ninguna arma natural a la que aplicarla.');
        expect(motivoSinExtrasDeCriatura(dote({ Extra_ataque_especial: 1 }))).toBe('No tiene ningún ataque especial al que aplicarla.');
    });
});
