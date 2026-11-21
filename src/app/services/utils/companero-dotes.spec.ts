import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import {
    aplicarMejoraAlCompanero, ataqueBaseDelCompaneroConDg, contextoDeDotesDelCompanero, dgDeLaDote, dgsDeLasMejorasDelCompanero,
    dotesDeDgs, dotesQueLeTocanAlCompanero, huecosDeDotesDelCompanero, huecosDeMejorasDelCompanero,
    quitarLoDeLosDgQueNoTieneElCompanero,
} from './companero-dotes';
import { evaluarElegibilidadDote } from './dote-elegibilidad';
import { construirCompaneroParaGuardar } from './mascota-payload';

// Las dotes y las mejoras que elige el compañero animal (contrato: `personajes.md`, «Las dotes y las mejoras que elige el
// compañero»; dictamen del máster de Rol del 2026-11-21, punto 1).
describe('las dotes y las mejoras del compañero animal', () => {
    const dote = (id: number, nombre: string, contexto: Record<string, any> = {}) => ({
        Dote: { Id: id, Nombre: nombre } as any,
        Contexto: { Entidad: 'personaje', Id_personaje: 0, Extra: '', Id_extra: 0, ...contexto } as any,
    });
    const ALERTA = dote(17, 'Alerta');
    const AGUANTE = dote(15, 'Aguante');
    const RASTREAR = dote(40, 'Rastrear', { Adicional: true });
    const SUTILEZA = dote(41, 'Sutileza con las armas');

    const companero = (cambios: Partial<CompaneroMonstruoDetalle> & { dg?: number; int?: number | null; } = {}): CompaneroMonstruoDetalle => {
        const { dg = 5, int = 2, ...resto } = cambios;
        return {
            Nombre: 'Gruk', Dados_golpe: { Cantidad: `${dg}`, Tipo_dado: { Id: 3, Nombre: 'd8' }, Suma: 0 },
            Dg_adi: 2, Tipo: { Id: 3, Nombre: 'Animal' }, Tamano: { Id: 5, Nombre: 'Grande' },
            Ataque: { Ataque_base: Math.floor(dg * 3 / 4), Presa: 0, Ataques: '', Ataque_completo: '' },
            Salvaciones: { Fortaleza: 7, Reflejos: 4, Voluntad: 1 },
            Caracteristicas: { Fuerza: 23, Fuerza_modificador: 6, Destreza: 11, Destreza_modificador: 0, Constitucion: 16, Constitucion_modificador: 3,
                Inteligencia: int, Inteligencia_modificador: int === null ? null : -4, Sabiduria: 11, Sabiduria_modificador: 0, Carisma: 4, Carisma_modificador: -3 },
            Habilidades: [], Dotes: [ALERTA, AGUANTE], Dotes_monstruo: [ALERTA, AGUANTE], Mejoras: [],
            ...resto,
        } as any;
    };

    it('las dotes de unos DG y el DG de cada una (MM, pág. 290)', () => {
        expect([0, 1, 3, 7, 9].map(dotesDeDgs)).toEqual([0, 1, 2, 3, 4]);
        expect([1, 2, 3, 4].map(dgDeLaDote)).toEqual([1, 3, 6, 9]);
    });

    it('Gruk, un bisonte de 5 + 2 DG: le tocan 3, cuentan Aguante y Alerta y le falta la de su 6.º DG', () => {
        expect(dotesQueLeTocanAlCompanero(companero())).toBe(3);
        expect(huecosDeDotesDelCompanero(companero())).toEqual([6]);
        // Elegida ya, no se pide otra vez.
        const conLaSuya = companero({ Dotes: [ALERTA, AGUANTE, dote(50, 'Soltura con un arma', { Dg: 6, Id_extra: 72 })] });
        expect(huecosDeDotesDelCompanero(conLaSuya)).toEqual([]);
    });

    it('Risco, un tejón de 1 + 2 DG: el Rastrear de su bloque es «(B)» y no cuenta; le falta la de su 3.er DG', () => {
        const risco = companero({ dg: 1, Nombre: 'Risco', Dotes: [RASTREAR, SUTILEZA], Dotes_monstruo: [RASTREAR, SUTILEZA] });
        expect(huecosDeDotesDelCompanero(risco)).toEqual([3]);
    });

    it('sin Inteligencia (la araña monstruosa), sus DG adicionales no le dan dotes; sin las dotes de su monstruo, no se sabe', () => {
        const arana = companero({ dg: 2, int: null, Dotes: [], Dotes_monstruo: [] });
        expect(dotesQueLeTocanAlCompanero(arana)).toBe(1);
        expect(huecosDeDotesDelCompanero(arana)).toEqual([1]);
        expect(huecosDeDotesDelCompanero(companero({ int: 0, Dotes_monstruo: [ALERTA] }))).toEqual([3]);
        expect(huecosDeDotesDelCompanero(companero({ Dotes_monstruo: undefined }))).toEqual([]);
    });

    it('las mejoras: cada múltiplo de 4 al que llega por sus DG adicionales, nunca por los de su monstruo', () => {
        expect(dgsDeLasMejorasDelCompanero(companero({ dg: 3 }))).toEqual([4]);   // el caballo de Eren, 3 → 5
        expect(dgsDeLasMejorasDelCompanero(companero({ dg: 2 }))).toEqual([4]);   // el lobo de un druida 3, 2 → 4
        expect(dgsDeLasMejorasDelCompanero(companero())).toEqual([]);             // Gruk, 5 → 7
        expect(dgsDeLasMejorasDelCompanero(companero({ dg: 4 }))).toEqual([]);    // los 4 DG de su monstruo no cuentan
        const caballo = companero({ dg: 3 });
        aplicarMejoraAlCompanero(caballo, 4, 'Fuerza');
        expect(huecosDeMejorasDelCompanero(caballo)).toEqual([]);
        expect([(caballo.Caracteristicas as any).Fuerza, (caballo.Caracteristicas as any).Fuerza_modificador]).toEqual([24, 7]);
        expect(caballo.Mejoras).toEqual([{ Dg: 4, Id_caracteristica: 1, Caracteristica: 'Fuerza' }]);
    });

    it('al perder sus DG adicionales pierde las dotes y las mejoras de esos DG, con su +1', () => {
        const lobo = companero({ dg: 2, Dotes: [ALERTA, dote(60, 'Esquiva', { Dg: 3 })] });
        aplicarMejoraAlCompanero(lobo, 4, 'Destreza');
        lobo.Dg_adi = 0;
        expect(quitarLoDeLosDgQueNoTieneElCompanero(lobo)).toBeTrue();
        expect(lobo.Dotes.map((d) => d.Dote.Nombre)).toEqual(['Alerta']);
        expect(lobo.Mejoras).toEqual([]);
        expect((lobo.Caracteristicas as any).Destreza).toBe(11);
        expect(quitarLoDeLosDgQueNoTieneElCompanero(lobo)).toBeFalse();
    });

    it('el ataque base en su misma progresión: la del animal, ¾ de sus DG', () => {
        const gruk = companero();
        expect([ataqueBaseDelCompaneroConDg(gruk, 5), ataqueBaseDelCompaneroConDg(gruk, 7)]).toEqual([3, 5]);
    });

    it('Truco adicional: un lobo con Rastrea (Animal, Int 2, un truco) puede; sin trucos o con Int 3, no', () => {
        const trucoAdicional = { Id: 900, Nombre: 'Truco adicional', Prerrequisitos: {
            tipo_criatura: [{ Id_tipo_criatura: 3, Tipo_criatura: 'Animal', Opcional: 1 }, { Id_tipo_criatura: 4, Tipo_criatura: 'Bestia mágica', Opcional: 1 }],
            caracteristica: [{ Id_caracteristica: 4, Caracteristica: 'Inteligencia', Cantidad: 1, Maximo: 2, Opcional: 0 }],
            trucos: [{ Minimo: 1, Opcional: 0, Frase: 'Conocer al menos 1 truco' }],
        } } as any;
        const rastrea = { Id: 4, Nombre: 'Rastrea', Origen: 'adicional', Orden: 1, Coste: 1, Es_fin: false };
        const lobo = companero({ dg: 2, Nombre: 'Colmillo', Trucos: [rastrea] } as any);
        expect(evaluarElegibilidadDote({ dote: trucoAdicional, contexto: contextoDeDotesDelCompanero(lobo, 3, () => undefined) }).estado).toBe('eligible');
        const sinTrucos = companero({ dg: 2, Trucos: [] } as any);
        expect(evaluarElegibilidadDote({ dote: trucoAdicional, contexto: contextoDeDotesDelCompanero(sinTrucos, 3, () => undefined) }).estado).toBe('blocked_failed');
        const listo = companero({ dg: 2, int: 3, Trucos: [rastrea] } as any);
        expect(evaluarElegibilidadDote({ dote: trucoAdicional, contexto: contextoDeDotesDelCompanero(listo, 3, () => undefined) }).estado).toBe('blocked_failed');
    });

    it('lo de su monstruo para las dotes de monstruo: su vuelo, su armadura natural, sus sortílegas, sus ataques especiales y sus trucos', () => {
        const halcon = companero({ dg: 1, Movimientos: { Correr: 10, Nadar: 0, Volar: 60, Trepar: 0, Excavar: 0 },
            Defensa: { Armadura_natural: 3 }, Sortilegas: [{ Nivel_lanzador: 6 }], Ataques_especiales: [{ Id: 1, Nombre: 'Veneno (víbora)' }],
            Trucos: [{ Id: 7, Nombre: 'Lucha', Origen: 'monstruo', Orden: null, Coste: 3, Es_fin: true }] } as any);
        const contexto = contextoDeDotesDelCompanero(halcon, 1, () => undefined);
        expect([contexto.velocidadVuelo, contexto.armaduraNatural, contexto.nivelLanzadorSortilegas, contexto.ataquesEspeciales, contexto.trucosConocidos])
            .toEqual([60, 3, 6, 1, 3]);
    });

    it('se juzga como criatura en el DG en que la gana: sus características, su ataque base y sus dotes de antes', () => {
        const gruk = companero({ Dotes: [ALERTA, AGUANTE, dote(60, 'Esquiva', { Dg: 9 })] });
        const contexto = contextoDeDotesDelCompanero(gruk, 6, () => undefined);
        expect([contexto.dgTotal, contexto.nivelTotal, contexto.ataqueBase, contexto.nivelesClase.length]).toEqual([6, 6, 4, 0]);
        expect(contexto.dotes.map((d) => d.nombre)).toEqual(['Alerta', 'Aguante']);
        const ataquePoderoso = { Id: 70, Nombre: 'Ataque poderoso', Prerrequisitos: {
            caracteristica: [{ Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0, Frase: 'Fuerza 13' }] } } as any;
        const pericia = { Id: 71, Nombre: 'Pericia en combate', Prerrequisitos: {
            caracteristica: [{ Id_caracteristica: 4, Caracteristica: 'Inteligencia', Cantidad: 13, Opcional: 0, Frase: 'Inteligencia 13' }] } } as any;
        expect(evaluarElegibilidadDote({ dote: ataquePoderoso, contexto }).estado).toBe('eligible');
        expect(evaluarElegibilidadDote({ dote: pericia, contexto }).estado).toBe('blocked_failed');
    });

    it('al guardarlo: las elegidas con su `dg`, las de su tabla sin él, las de su monstruo no; y sus mejoras', () => {
        const gruk = companero({
            Id: 9, Monstruo_origen: { Id: 9, Nombre: 'Bisonte' },
            Dotes: [ALERTA, AGUANTE, dote(80, 'Ataque múltiple', { Origen: 'Compañero animal' }), dote(50, 'Soltura con una habilidad', { Dg: 6, Id_extra: 16 })],
        } as any);
        aplicarMejoraAlCompanero(gruk, 8, 'Fuerza');
        const guardado = construirCompaneroParaGuardar(gruk);
        expect(guardado.dotes).toEqual([{ idDote: 80, idExtra: 0 }, { idDote: 50, idExtra: 16, dg: 6 }]);
        expect(guardado.mejoras).toEqual([]); // la del 8.º DG no la tiene con 7: se quita al guardar
        expect(guardado.fuerza).toBe(23);
        // Sin las dotes de su monstruo (otras vías), las de la creación, como antes.
        expect(construirCompaneroParaGuardar(companero({ Dotes_monstruo: undefined, Dotes: [ALERTA] })).dotes).toEqual([{ idDote: 17, idExtra: 0 }]);
    });
});
