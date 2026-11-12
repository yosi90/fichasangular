import { EquipoObjetivoModificador } from 'src/app/interfaces/equipo';
import {
    falloDeBonificador,
    falloDeProgresion,
    falloDeProgresionYBonificadores,
    filaBonificadorVacia,
    filaProgresionVacia,
    filasDeBonificadores,
    filasDeProgresion,
    cuerpoDeBonificadores,
    cuerpoDeProgresion,
    resumenDeProgresion,
} from './racial-formulario';
import { normalizeRacial } from './racial-mapper';

/** Las mismas reglas que `_normalize_racial_progresion` y `_normalize_racial_bonificadores` de la API. */
describe('racial-formulario', () => {
    const OBJETIVOS: EquipoObjetivoModificador[] = [
        { Id: 1, Nombre: 'CA', Lista_del_rasgo: null, De_siempre_en_el_rasgo: true },
        { Id: 2, Nombre: 'Ataque', Lista_del_rasgo: null, De_siempre_en_el_rasgo: false },
        { Id: 8, Nombre: 'Característica', Lista_del_rasgo: 'caracteristicas', De_siempre_en_el_rasgo: false },
    ];
    const progresion = (cambios: object) => ({ ...filaProgresionVacia(), desde: 6, ...cambios });
    const bonificador = (cambios: object) => ({
        ...filaBonificadorVacia(), id_objetivo: 2, id_tipo_bonificador: 14, cantidad: 1, condicion: 'contra orcos', ...cambios,
    });

    it('lee la progresión y los bonificadores del GET y vuelve al mismo cuerpo', () => {
        const racial = normalizeRacial({
            Id: 39, Nombre: 'Aspecto dracónico (alas)',
            Progresion: [{ Medida: 'dg', Desde: 6, Gana: { Id: 2386, Nombre: 'Vuelo' }, Sustituye: null, Tipo_dote: null,
                Velocidad: { Tipo: 'Volar', Pies: 30, Maniobrabilidad: { Id: 3, Nombre: 'Regular' } }, Valor: null, Frase: 'x' },
                { Medida: 'nivel', Desde: 2, Gana: null, Sustituye: { Id: 7, Nombre: 'A' }, Tipo_dote: { Id: 30, Nombre: 'T' },
                    Velocidad: null, Valor: '+2', Frase: 'y' }],
            Bonificadores_condicionales: [{ Id: 4, Objetivo: { Id: 1, Nombre: 'CA' }, Tipo_bonificador: { Id: 8, Nombre: 'Esquiva' },
                Cantidad: 2, Condicion: 'Contra dragones', Contra: [{ Catalogo: 'tipo_criatura', Id: 6, Nombre: 'Dragón' }], Frase: 'z' }],
        });

        expect(cuerpoDeProgresion(filasDeProgresion(racial))).toEqual([
            { medida: 'dg', desde: 6, id_racial_gana: 2386, velocidad: { tipo: 'volar', pies: 30, id_maniobrabilidad: 3 } },
            { medida: 'nivel', desde: 2, id_racial_sustituye: 7, id_tipo_dote: 30, valor: '+2' },
        ]);
        expect(cuerpoDeBonificadores(filasDeBonificadores(racial))).toEqual([
            { id_objetivo: 1, id_tipo_bonificador: 8, cantidad: 2, condicion: 'Contra dragones', contra: [{ id_tipo: 6 }] },
        ]);
    });

    it('la maniobrabilidad solo va al volar', () => {
        expect(cuerpoDeProgresion([progresion({ velocidad: 'nadar', pies: 20, id_maniobrabilidad: 3 })])[0].velocidad)
            .toEqual({ tipo: 'nadar', pies: 20 });
    });

    it('rechaza en la progresión lo mismo que la API', () => {
        expect(falloDeProgresion(progresion({ desde: 0, valor: '1d8' }), 0, null)).toContain('va de 1 a 100');
        expect(falloDeProgresion(progresion({ desde: 101, valor: '1d8' }), 0, null)).toContain('va de 1 a 100');
        expect(falloDeProgresion(progresion({ desde: 2.5, valor: '1d8' }), 0, null)).toContain('va de 1 a 100');
        expect(falloDeProgresion(progresion({}), 1, null)).toBe(
            'Fila 2 de la progresión: tiene que dar o cambiar algo (un rasgo, uno que sustituye, un tipo de dote, una velocidad o un valor).');
        expect(falloDeProgresion(progresion({ velocidad: 'volar', pies: 0 }), 0, null)).toContain('al menos 1');
        expect(falloDeProgresion(progresion({ valor: 'x'.repeat(101) }), 0, null)).toContain('100 letras');
        expect(falloDeProgresion(progresion({ id_racial_gana: 39 }), 0, 39)).toContain('a sí mismo');
        expect(falloDeProgresion(progresion({ id_racial_sustituye: 39 }), 0, 39)).toContain('a sí mismo');
        expect(falloDeProgresion(progresion({ id_racial_gana: 39 }), 0, null)).toBeNull();
        expect(falloDeProgresion(progresion({ valor: '2d8' }), 0, null)).toBeNull();
    });

    it('rechaza en los bonificadores lo mismo que la API', () => {
        expect(falloDeBonificador(bonificador({ id_objetivo: null }), 0, OBJETIVOS)).toContain('a qué se aplica');
        expect(falloDeBonificador(bonificador({ id_objetivo: 8 }), 0, OBJETIVOS)).toContain('van en «Características»');
        expect(falloDeBonificador(bonificador({ id_tipo_bonificador: null }), 0, OBJETIVOS)).toContain('tipo de bonificador');
        expect(falloDeBonificador(bonificador({ cantidad: 0 }), 0, OBJETIVOS)).toContain('no puede ser 0');
        expect(falloDeBonificador(bonificador({ cantidad: 101 }), 0, OBJETIVOS)).toContain('de -100 a 100');
        expect(falloDeBonificador(bonificador({ condicion: '  ' }), 0, OBJETIVOS)).toContain('obligatoria');
        expect(falloDeBonificador(bonificador({ condicion: 'x'.repeat(201) }), 0, OBJETIVOS)).toContain('200 letras');
        const repetida = { catalogo: 'subtipo' as const, id: 68, nombre: 'Orco' };
        expect(falloDeBonificador(bonificador({ contra: [repetida, repetida] }), 0, OBJETIVOS)).toContain('repetida');
        expect(falloDeBonificador(bonificador({ cantidad: -1 }), 0, OBJETIVOS)).toBeNull();
        // Sin condición, solo a la CA (cuenta siempre: la esquiva del svirfneblin) y sin criaturas.
        expect(falloDeBonificador(bonificador({ id_objetivo: 1, condicion: '' }), 0, OBJETIVOS)).toBeNull();
        expect(falloDeBonificador(bonificador({ condicion: '' }), 0, OBJETIVOS)).toContain('solo vale un bonificador a la CA');
        expect(falloDeBonificador(bonificador({ id_objetivo: 1, condicion: '', contra: [repetida] }), 0, OBJETIVOS))
            .toContain('contra unas criaturas');
    });

    it('el primer fallo dice de qué lista es', () => {
        expect(falloDeProgresionYBonificadores([progresion({ valor: '1d8' })], [bonificador({ cantidad: 0 })], null, OBJETIVOS))
            .toEqual({ lista: 'bonificadores', mensaje: jasmine.stringContaining('Bonificador 1') as any });
        expect(falloDeProgresionYBonificadores([], [], null, OBJETIVOS)).toBeNull();
    });

    it('resume cada fila como la frase de la API', () => {
        expect(resumenDeProgresion(progresion({}), 0)).toBe('1 · A los 6 DG');
        expect(resumenDeProgresion(progresion({ desde: 1 }), 1)).toBe('2 · A 1 DG');
        expect(resumenDeProgresion(progresion({ medida: 'nivel', desde: 2 }), 2)).toBe('3 · A nivel 2');
        expect(resumenDeProgresion(progresion({ desde: null }), 0)).toBe('1 · Sin «desde» todavía');
    });
});
