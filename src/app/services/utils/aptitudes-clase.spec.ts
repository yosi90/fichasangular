import { Clase } from 'src/app/interfaces/clase';
import { normalizeClase } from 'src/app/services/clase.service';
import {
    armasNaturalesEspecialNivel,
    conjurosDeAptitudes,
    habilidadesEspecialNivel,
    evaluarActitudEspecial,
    extrasElegiblesEspecial,
    listadoConjurosClase,
    modificadoresCaracteristicaEspecialNivel,
    nivelesConjuroSinRequisito,
    pasosTamanoEspecialNivel,
    prerrequisitosEspecialNivel,
    reduccionDanoEspecialNivel,
    textoRequisitoNivelConjuro,
} from 'src/app/services/utils/aptitudes-clase';
import { normalizeEspecial } from 'src/app/services/especial.service';
import { GRAN_ARCANO_API, SENDA_ASENDA_API } from 'src/testing/clases-propias-api';

// Lo que las aptitudes de una clase cambian en la creación (guía `docs/publica/CLASES_PROPIAS_FRONT.md`), con datos
// inventados: ningún nombre ni id es de una clase real (salvo los extras de una aptitud, con las respuestas de la API).

const LEGAL_BUENO = 1;
const NEUTRAL_AUTENTICO = 5;
const CAOTICO_MALIGNO = 9;
const BUENO = { Id_actitud: 4, Actitud: 'Bueno', Opcional: 0, Frase: 'Cualquier alineamiento bueno' };
const MALIGNO = { Id_actitud: 5, Actitud: 'Maligno', Opcional: 0, Frase: 'Cualquier alineamiento maligno' };

function clase(conjuros: Record<string, any>): Clase {
    return normalizeClase({ Id: 70, Nombre: 'Clase de prueba', Conjuros: { Listado: [], ...conjuros } });
}

describe('aptitudes-clase', () => {
    describe('evaluarActitudEspecial', () => {
        it('una actitud requerida se cumple solo con ese alineamiento', () => {
            const prerrequisitos = { actitud_requerido: [BUENO], actitud_prohibido: [] };
            expect(evaluarActitudEspecial(prerrequisitos, LEGAL_BUENO)).toEqual({ cumple: true, motivos: [] });
            expect(evaluarActitudEspecial(prerrequisitos, CAOTICO_MALIGNO))
                .toEqual({ cumple: false, motivos: ['No cumple: Cualquier alineamiento bueno'] });
        });

        it('las prohibidas descartan cada una su actitud', () => {
            const prerrequisitos = {
                actitud_requerido: [],
                actitud_prohibido: [
                    { ...BUENO, Frase: 'Cualquier alineamiento no bueno' },
                    { ...MALIGNO, Frase: 'Cualquier alineamiento no maligno' },
                ],
            };
            expect(evaluarActitudEspecial(prerrequisitos, NEUTRAL_AUTENTICO).cumple).toBeTrue();
            expect(evaluarActitudEspecial(prerrequisitos, LEGAL_BUENO).motivos).toEqual(['No cumple: Cualquier alineamiento no bueno']);
            expect(evaluarActitudEspecial(prerrequisitos, CAOTICO_MALIGNO).motivos).toEqual(['No cumple: Cualquier alineamiento no maligno']);
        });

        it('las alternativas (el mismo Opcional) bastan con una', () => {
            const prerrequisitos = { actitud_requerido: [{ ...BUENO, Opcional: 1 }, { ...MALIGNO, Opcional: 1 }], actitud_prohibido: [] };
            expect(evaluarActitudEspecial(prerrequisitos, LEGAL_BUENO).cumple).toBeTrue();
            expect(evaluarActitudEspecial(prerrequisitos, CAOTICO_MALIGNO).cumple).toBeTrue();
            expect(evaluarActitudEspecial(prerrequisitos, NEUTRAL_AUTENTICO).motivos)
                .toEqual(['No cumple: Cualquier alineamiento bueno o Cualquier alineamiento maligno']);
        });

        it('sin prerrequisitos se cumple; sin alineamiento, no se puede elegir una que los tenga', () => {
            expect(evaluarActitudEspecial({ actitud_requerido: [], actitud_prohibido: [] }, 0).cumple).toBeTrue();
            expect(evaluarActitudEspecial({ actitud_requerido: [BUENO], actitud_prohibido: [] }, 0).cumple).toBeFalse();
        });
    });

    it('lee el tamaño y los prerrequisitos del especial de un nivel de la clase (Modificadores)', () => {
        const especialNivel = {
            Especial: { Id: 3, Nombre: 'Aptitud grande', Modificadores: { Tamano_pasos: 1 }, Prerrequisitos: { actitud_requerido: [BUENO] } },
        } as any;
        expect(pasosTamanoEspecialNivel(especialNivel)).toBe(1);
        expect(prerrequisitosEspecialNivel(especialNivel)).toEqual({ actitud_requerido: [BUENO], actitud_prohibido: [] });
        expect(pasosTamanoEspecialNivel({ Especial: {} } as any)).toBe(0);
        expect(modificadoresCaracteristicaEspecialNivel({ Especial: { Modificadores: { Fuerza: 2, Destreza: -2 } } } as any))
            .toEqual({ Fuerza: 2, Destreza: -2, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 });
    });

    describe('listas de conjuros por aptitud', () => {
        const conListas = clase({
            Listado: [{ Id: 1, Nombre: 'Conjuro común', Nivel: 1, Espontaneo: false }],
            Listado_por_especial: [
                { Id: 2, Nombre: 'Conjuro de la senda A', Nivel: 1, Espontaneo: false, Especial: { Id: 10, Nombre: 'Senda A' }, Extra: null },
                { Id: 3, Nombre: 'Conjuro del fuego', Nivel: 2, Espontaneo: false, Especial: { Id: 11, Nombre: 'Senda B' }, Extra: { Id: 7, Nombre: 'Fuego' } },
                { Id: 4, Nombre: 'Conjuro del agua', Nivel: 2, Espontaneo: false, Especial: { Id: 11, Nombre: 'Senda B' }, Extra: { Id: 8, Nombre: 'Agua' } },
                { Id: 1, Nombre: 'Conjuro común', Nivel: 1, Espontaneo: false, Especial: { Id: 10, Nombre: 'Senda A' }, Extra: null },
            ],
        });

        it('el mapper conserva la aptitud y el extra de cada conjuro', () => {
            expect(conListas.Conjuros.Listado_por_especial?.[1]).toEqual({
                Id: 3, Nombre: 'Conjuro del fuego', Nivel: 2, Espontaneo: false, Especial: { Id: 11, Nombre: 'Senda B' }, Extra: { Id: 7, Nombre: 'Fuego' },
            });
        });

        it('sin la aptitud, solo la lista de la clase', () => {
            expect(conjurosDeAptitudes(conListas, [])).toEqual([]);
            expect(listadoConjurosClase(conListas, []).map((ref) => ref.Id)).toEqual([1]);
        });

        it('con la aptitud, se suman sus conjuros (sin repetir los de la clase)', () => {
            expect(listadoConjurosClase(conListas, [{ id: 10 }]).map((ref) => ref.Id)).toEqual([1, 2]);
        });

        it('con un extra, solo los de ese extra', () => {
            expect(conjurosDeAptitudes(conListas, [{ id: 11, idExtra: 8 }]).map((ref) => ref.Id)).toEqual([4]);
            expect(conjurosDeAptitudes(conListas, [{ id: 11, idExtra: 0 }])).toEqual([]);
        });
    });

    describe('niveles de conjuro con requisito', () => {
        const conRequisitos = clase({
            Niveles_con_requisito: [
                { Nivel: 7, Especial: { Id: 20, Nombre: 'Implante' }, Dote: null },
                { Nivel: 7, Especial: null, Dote: { Id: 30, Nombre: 'Dote del implante' } },
                { Nivel: 9, Especial: { Id: 21, Nombre: 'Otro implante' }, Dote: null },
            ],
        });

        it('sin la aptitud ni la dote, el nivel queda cerrado', () => {
            expect(Array.from(nivelesConjuroSinRequisito(conRequisitos, [], []))).toEqual([7, 9]);
        });

        it('basta con una de las alternativas: la aptitud o la dote', () => {
            expect(Array.from(nivelesConjuroSinRequisito(conRequisitos, [20], []))).toEqual([9]);
            expect(Array.from(nivelesConjuroSinRequisito(conRequisitos, [], [30]))).toEqual([9]);
        });

        it('una clase sin requisitos no cierra nada', () => {
            expect(nivelesConjuroSinRequisito(clase({}), [], []).size).toBe(0);
        });

        it('dice qué pide cada nivel', () => {
            expect(textoRequisitoNivelConjuro(conRequisitos, 7)).toBe('Implante o Dote del implante');
            expect(textoRequisitoNivelConjuro(conRequisitos, 3)).toBe('');
        });
    });

    describe('extrasElegiblesEspecial (el extra «Elegir» de una aptitud, con las respuestas reales de la API)', () => {
        it('ofrece los extras del especial en su orden', () => {
            expect(extrasElegiblesEspecial(normalizeEspecial(SENDA_ASENDA_API))).toEqual([
                { id: 137, nombre: 'Fuego' }, { id: 138, nombre: 'Aire' }, { id: 139, nombre: 'Agua' }, { id: 140, nombre: 'Tierra' },
            ]);
        });

        it('no ofrece el comodín «Elegir» ni los que el personaje ya tiene en esa aptitud', () => {
            const ofrecidos = extrasElegiblesEspecial(normalizeEspecial(GRAN_ARCANO_API), [105]);
            expect(ofrecidos.some((extra) => extra.nombre === 'Elegir')).toBeFalse();
            expect(ofrecidos.some((extra) => extra.id === 105)).toBeFalse();
            expect(ofrecidos.length).toBe(6);
        });

        it('sin extras, nada que elegir', () => {
            expect(extrasElegiblesEspecial(null)).toEqual([]);
            expect(extrasElegiblesEspecial({ Extras: [] })).toEqual([]);
        });
    });

    describe('habilidades, reducción del daño y armas naturales de una aptitud (las clases de monstruo, 2026-11-07)', () => {
        const nivel = (especial: Record<string, any>, extra: string | null = null) =>
            ({ Especial: especial, Nivel: 1, Id_extra: null, Extra: extra, Extra_comodin: null, Opcional: 0, Id_interno: 1,
               Id_especial_requerido: -1, Id_dote_requerida: -1 } as any);

        it('las habilidades que mejora, con su especialidad y sin las de 0 rangos', () => {
            const especial = { Habilidades: [
                { Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: null, Extra: null, Rangos: 2 },
                { Id_habilidad: 31, Habilidad: 'Saber', Id_extra: 9, Extra: 'naturaleza', Rangos: 2 },
                { Id_habilidad: 7, Habilidad: 'Buscar', Id_extra: -1, Extra: null, Rangos: 0 },
            ] };
            expect(habilidadesEspecialNivel(nivel(especial))).toEqual([
                { Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: null, Extra: '', Rangos: 2 },
                { Id_habilidad: 31, Habilidad: 'Saber', Id_extra: 9, Extra: 'naturaleza', Rangos: 2 },
            ]);
            // La caché no escribe las listas vacías.
            expect(habilidadesEspecialNivel(nivel({}))).toEqual([]);
        });

        it('la reducción del daño es la de su extra si la aptitud lo dice (Extra_da_rd)', () => {
            const rd = { Extras_soportados: { Extra_da_rd: true } };
            expect(reduccionDanoEspecialNivel(nivel(rd), '5/plateada')).toBe('5/plateada');
            expect(reduccionDanoEspecialNivel(nivel(rd), '3/-')).toBe('3/-');
            expect(reduccionDanoEspecialNivel(nivel(rd), 'Nada')).toBe('');
            expect(reduccionDanoEspecialNivel(nivel({ Extras_soportados: { Extra_da_rd: false } }), '5/plateada')).toBe('');
        });

        it('las armas naturales que da, con el daño de su extra si no traen el suyo', () => {
            const golpetazo = { Armas_naturales: [{ Id_arma_natural: 4, Arma_natural: 'Golpetazo', Cantidad: 1, Dano: null, Primaria: true, Texto: 'Golpetazo' }] };
            expect(armasNaturalesEspecialNivel(nivel(golpetazo), '1d6').map((arma) => [arma.Arma_natural, arma.Cantidad, arma.Dano]))
                .toEqual([['Golpetazo', 1, '1d6']]);
            expect(armasNaturalesEspecialNivel(nivel(golpetazo), 'Nada')[0].Dano).toBeNull();
            const conDano = { Armas_naturales: [{ ...golpetazo.Armas_naturales[0], Dano: '2d6' }] };
            expect(armasNaturalesEspecialNivel(nivel(conDano), '1d6')[0].Dano).toBe('2d6');
            expect(armasNaturalesEspecialNivel(nivel({}), '1d6')).toEqual([]);
        });
    });
});
