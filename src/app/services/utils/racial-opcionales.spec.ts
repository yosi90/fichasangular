import { RacialDetalle } from 'src/app/interfaces/racial';
import {
    agruparRacialesPorOpcional,
    getClaveSeleccionRacial,
    getGrupoOpcionalRacial,
    resolverRacialesFinales,
    seleccionOpcionalesCompleta,
} from './racial-opcionales';

function racial(id: number, nombre: string, opcional: any): RacialDetalle {
    return {
        Id: id,
        Nombre: nombre,
        Descripcion: '',
        Opcional: opcional,
        Dotes: [],
        Habilidades: { Base: [], Custom: [] },
        Caracteristicas: [],
        Salvaciones: [],
        Sortilegas: [],
        Ataques: [],
        Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
        Prerrequisitos: { raza: [], caracteristica: [] },
    };
}

describe('racial-opcionales', () => {
    it('agrupa obligatorias y grupos opcionales 1..n', () => {
        const listado = [
            racial(1, 'Vision en la oscuridad', 0),
            racial(2, 'Sangre draconica azul', 1),
            racial(3, 'Sangre draconica roja', 1),
            racial(4, 'Aliento acido', 2),
        ];

        const agrupado = agruparRacialesPorOpcional(listado);

        expect(agrupado.obligatorias.map((x) => x.Id)).toEqual([1]);
        expect(agrupado.grupos.map((g) => g.grupo)).toEqual([1, 2]);
        expect(agrupado.grupos[0].opciones.map((x) => x.Id)).toEqual([2, 3]);
    });

    it('exige una seleccion por grupo', () => {
        const listado = [
            racial(1, 'Base', 0),
            racial(2, 'A', 1),
            racial(3, 'B', 1),
            racial(4, 'C', 2),
        ];

        expect(seleccionOpcionalesCompleta(listado, { 1: getClaveSeleccionRacial(listado[1]) })).toBeFalse();
        expect(
            seleccionOpcionalesCompleta(listado, {
                1: getClaveSeleccionRacial(listado[2]),
                2: getClaveSeleccionRacial(listado[3]),
            }),
        ).toBeTrue();
    });

    it('resuelve raciales finales deduplicando obligatorias + elegidas', () => {
        const listado = [
            racial(1, 'Base', 0),
            racial(2, 'A', 1),
            racial(3, 'B', 1),
            racial(4, 'A', 1),
        ];

        const final = resolverRacialesFinales(listado, { 1: getClaveSeleccionRacial(listado[1]) });

        expect(final).not.toBeNull();
        expect((final ?? []).map((x) => x.Id)).toEqual([1, 2]);
    });

    it('lee aliases de opcional de forma robusta', () => {
        const aliasCamel = { ...racial(10, 'X', 0), Opcional: undefined, opcional: 2 } as any;
        const aliasLegacyNumero = { ...racial(11, 'Y', 0), Opcional: undefined, o: 3 } as any;
        const aliasLegacyTexto = { ...racial(12, 'Z', 0), Opcional: undefined, o: 'origen' } as any;

        expect(getGrupoOpcionalRacial(aliasCamel)).toBe(2);
        expect(getGrupoOpcionalRacial(aliasLegacyNumero)).toBe(3);
        expect(getGrupoOpcionalRacial(aliasLegacyTexto)).toBe(0);
    });
});
