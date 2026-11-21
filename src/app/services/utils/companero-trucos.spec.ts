import { CompaneroMonstruoDetalle, TrucoDeMascota } from 'src/app/interfaces/monstruo';
import { PersonajeCreateCompaneroDto } from 'src/app/interfaces/personajes-api';
import { Truco } from 'src/app/interfaces/truco';
import { leerTrucos } from 'src/app/services/truco.service';
import {
    aplicarTrucosAdicionales, conLosTrucosDeSuMonstruo, contextoDeTrucosDelCompanero, hayTrucoAdicionalQueElegir, idsDeLoQueSabe,
    motivoTrucoAdicional, quitarLosTrucosQueNoCaben, trucosAdicionalesPendientes, trucosParaGuardar, trucosParaLaFicha,
} from './companero-trucos';
import { construirCompaneroParaGuardar } from './mascota-payload';
import { leerTrucosDeMascota } from './monstruo-mapper';
import { companeroConLoDelMotor } from './subida-nivel';

// Los trucos del compañero animal (contrato: `personajes.md`, «Los trucos del compañero», y `catalogos.md`, «Los trucos»;
// dictamen del máster de Rol del 2026-11-21, punto 2).
describe('los trucos del compañero animal', () => {
    const truco = (id: number, nombre: string, cambios: Partial<Truco> = {}): Truco => ({
        Id: id, Nombre: nombre, Nombre_original: '', Traducido: false, Descripcion: `${nombre}.`, Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 83 },
        Cd: 15, Coste: 1, Es_fin: false, Semanas: null, Int_minima: null, Sustituye: null, Semanas_mejora: null, Cd_mejora: null, Trucos: [],
        Requisitos: { Trucos: [], Especiales: [], Tipos: [] }, Oficial: true, ...cambios,
    });
    const ATACA = truco(1, 'Ataca', { Cd: 20 });
    const ATACA_TODAS = truco(2, 'Ataca (todas las criaturas)', { Cd: 20, Coste: 2, Sustituye: { Id: 1, Nombre: 'Ataca' } });
    const ATRAS = truco(3, 'Atrás');
    const RASTREA = truco(4, 'Rastrea', { Cd: 20, Requisitos: { Trucos: [], Especiales: [{ Id: 1862, Nombre: 'Olfato' }], Tipos: [] } });
    const AYUDA = truco(5, 'Ayuda en ataque', { Cd: 20, Requisitos: {
        Trucos: [{ Id: 1, Nombre: 'Ataca', Opcional: true }, { Id: 2, Nombre: 'Ataca (todas las criaturas)', Opcional: true }], Especiales: [], Tipos: [] } });
    const LANZA = truco(6, 'Lanza telaraña', { Requisitos: { Trucos: [], Especiales: [{ Id: 9, Nombre: 'Telaraña' }], Tipos: [{ Id: 15, Nombre: 'Sabandija' }] } });
    const LUCHA = truco(7, 'Lucha', { Es_fin: true, Cd: 20, Int_minima: 1, Trucos: [{ Id: 1, Nombre: 'Ataca' }, { Id: 3, Nombre: 'Atrás' }] });
    const CATALOGO = [ATACA, ATACA_TODAS, ATRAS, RASTREA, AYUDA, LANZA, LUCHA];

    const deMascota = (t: Truco, origen: TrucoDeMascota['Origen'], orden: number | null = null): TrucoDeMascota =>
        ({ Id: t.Id, Nombre: t.Nombre, Origen: origen, Orden: orden, Coste: t.Coste, Es_fin: t.Es_fin });

    const lobo = (cambios: Partial<CompaneroMonstruoDetalle> & { int?: number | null; } = {}): CompaneroMonstruoDetalle => {
        const { int = 2, ...resto } = cambios;
        return {
            Nombre: 'Colmillo', Tipo: { Id: 3, Nombre: 'Animal' }, Trucos_adi: 2, Dg_adi: 2, Dados_golpe: { Cantidad: '2', Tipo_dado: { Id: 3, Nombre: 'd8' }, Suma: 0 },
            Caracteristicas: { Fuerza: 13, Destreza: 15, Constitucion: 15, Inteligencia: int, Sabiduria: 12, Carisma: 6 },
            Raciales: [{ Id: 43, Nombre: 'olfato' }], Ataques_especiales: [{ Id: 70, Nombre: 'derribar (lobo)' }], Especiales: [],
            Habilidades: [], Dotes: [], Trucos: [], ...resto,
        } as any;
    };

    it('le quedan sus trucos adicionales menos lo que cuentan los que tiene; inactivo o con Int 3 o más, ninguno', () => {
        expect(trucosAdicionalesPendientes(lobo())).toBe(2);
        expect(trucosAdicionalesPendientes(lobo({ Trucos: [deMascota(ATACA_TODAS, 'adicional', 1)] }))).toBe(0);
        expect(trucosAdicionalesPendientes(lobo({ Inactiva: true }))).toBe(0);
        // El perro intermitente (Int 10) no sabe trucos; la araña sin Inteligencia sí sabe los adicionales.
        expect(trucosAdicionalesPendientes(lobo({ int: 10 }))).toBe(0);
        expect(trucosAdicionalesPendientes(lobo({ int: null }))).toBe(2);
        expect(trucosAdicionalesPendientes(lobo({ int: 0 }))).toBe(2);
    });

    it('lo que sabe incluye los trucos de su fin y los que sustituye', () => {
        expect([...idsDeLoQueSabe([7], CATALOGO)].sort()).toEqual([1, 3, 7]);
        expect([...idsDeLoQueSabe([2], CATALOGO)].sort()).toEqual([1, 2]);
    });

    it('cada truco, con su motivo: un fin, uno que ya sabe, sus requisitos, su tipo y su coste', () => {
        const contexto = contextoDeTrucosDelCompanero(lobo(), CATALOGO);
        expect(motivoTrucoAdicional(LUCHA, contexto)).toBe('Es un fin: un truco adicional es siempre un truco suelto.');
        expect(motivoTrucoAdicional(ATACA, contexto)).toBeNull();
        // El lobo tiene olfato (su racial «olfato»): puede rastrear; sin él, no.
        expect(motivoTrucoAdicional(RASTREA, contexto)).toBeNull();
        expect(motivoTrucoAdicional(RASTREA, contextoDeTrucosDelCompanero(lobo({ Raciales: [] }), CATALOGO))).toBe('Pide Olfato.');
        expect(motivoTrucoAdicional(AYUDA, contexto)).toBe('Pide saber «Ataca» o «Ataca (todas las criaturas)».');
        expect(motivoTrucoAdicional(LANZA, contexto)).toBe('Pide Telaraña.');
        // La araña monstruosa, con su «telaraña (araña monstruosa)» y su tipo.
        const arana = lobo({ int: null, Tipo: { Id: 15, Nombre: 'Sabandija' } as any, Raciales: [], Ataques_especiales: [{ Id: 80, Nombre: 'telaraña (araña monstruosa)' }] as any });
        expect(motivoTrucoAdicional(LANZA, contextoDeTrucosDelCompanero(arana, CATALOGO))).toBeNull();
        const conAtaca = contextoDeTrucosDelCompanero(lobo({ Trucos: [deMascota(ATACA, 'adicional', 1)] }), CATALOGO);
        expect(motivoTrucoAdicional(ATACA, conAtaca)).toBe('Ya lo sabe.');
        expect(motivoTrucoAdicional(AYUDA, conAtaca)).toBeNull();
        expect(motivoTrucoAdicional(ATACA_TODAS, conAtaca)).toBe('Cuenta 2 trucos y le queda 1.');
    });

    it('el que pide otro vale en cuanto se elige el que pide (los elegidos cuentan ya)', () => {
        const contexto = contextoDeTrucosDelCompanero(lobo(), CATALOGO, [ATACA]);
        expect(motivoTrucoAdicional(AYUDA, contexto)).toBeNull();
        expect(contexto.quedan).toBe(1);
    });

    it('los pone detrás de los que tiene, con su orden, si todos valen', () => {
        const colmillo = lobo({ Trucos: [deMascota(LUCHA, 'ensenado')] });
        expect(aplicarTrucosAdicionales(colmillo, [RASTREA, AYUDA], CATALOGO)).toBeTrue();
        expect((colmillo.Trucos ?? []).map((t) => [t.Nombre, t.Origen, t.Orden])).toEqual([
            ['Lucha', 'ensenado', null], ['Rastrea', 'adicional', 1], ['Ayuda en ataque', 'adicional', 2],
        ]);
        // Uno que no vale (ya sabe Ataca, de su fin): no pone ninguno.
        const otro = lobo({ Trucos: [deMascota(LUCHA, 'ensenado')] });
        expect(aplicarTrucosAdicionales(otro, [RASTREA, ATACA], CATALOGO)).toBeFalse();
        expect((otro.Trucos ?? []).length).toBe(1);
    });

    it('si hay alguno que elegir: sin ninguno pendiente, o sin ninguno que le valga, el selector sobra', () => {
        expect(hayTrucoAdicionalQueElegir(lobo(), CATALOGO, false)).toBeTrue();
        expect(hayTrucoAdicionalQueElegir(lobo({ Trucos_adi: 0 }), CATALOGO, false)).toBeFalse();
        expect(hayTrucoAdicionalQueElegir(lobo(), [LUCHA, LANZA], false)).toBeFalse();
        // Los homebrew, solo en una ficha que ya no es oficial.
        const homebrew = [truco(30, 'Baila', { Oficial: false })];
        expect(hayTrucoAdicionalQueElegir(lobo(), homebrew, false)).toBeFalse();
        expect(hayTrucoAdicionalQueElegir(lobo(), homebrew, true)).toBeTrue();
    });

    it('al perder un nivel o quedar inactivo, pierde los últimos adicionales que eligió; los demás se quedan', () => {
        const trucos = [deMascota(ATACA, 'adicional', 1), deMascota(ATACA_TODAS, 'adicional', 2), deMascota(LUCHA, 'ensenado'), deMascota(ATRAS, 'monstruo')];
        const bajo = lobo({ Trucos_adi: 2, Trucos: [...trucos] });
        expect(quitarLosTrucosQueNoCaben(bajo)).toBeTrue();
        expect((bajo.Trucos ?? []).map((t) => t.Nombre)).toEqual(['Ataca', 'Lucha', 'Atrás']);
        const inactivo = lobo({ Trucos_adi: 0, Inactiva: true, Trucos: [...trucos] });
        quitarLosTrucosQueNoCaben(inactivo);
        expect((inactivo.Trucos ?? []).map((t) => t.Origen)).toEqual(['ensenado', 'monstruo']);
        expect(quitarLosTrucosQueNoCaben(lobo({ Trucos_adi: 3, Trucos: [...trucos] }))).toBeFalse();
    });

    it('al guardar: `trucos[]` con su origen y el orden de los adicionales; sin los que ya no caben', () => {
        const companero = lobo({ Trucos_adi: 1, Trucos: [deMascota(ATRAS, 'monstruo'), deMascota(ATACA, 'adicional', 1), deMascota(RASTREA, 'adicional', 2)] });
        expect(trucosParaGuardar(companero)).toEqual([
            { idTruco: 3, origen: 'monstruo' }, { idTruco: 1, origen: 'adicional', orden: 1 }, { idTruco: 4, origen: 'adicional', orden: 2 },
        ]);
        expect(construirCompaneroParaGuardar(companero).trucos).toEqual([{ idTruco: 3, origen: 'monstruo' }, { idTruco: 1, origen: 'adicional', orden: 1 }]);
        // El del motor no cambia: se quitan en una copia.
        expect((companero.Trucos ?? []).length).toBe(3);
    });

    it('los de su monstruo que le falten a la ficha de antes, con los suyos', () => {
        const monstruo = { Trucos: leerTrucosDeMascota([{ Id: 7, Nombre: 'Lucha', Es_fin: true }]) };
        expect(conLosTrucosDeSuMonstruo([], monstruo).map((t) => [t.Nombre, t.Origen])).toEqual([['Lucha', 'monstruo']]);
        expect(conLosTrucosDeSuMonstruo([deMascota(LUCHA, 'monstruo')], monstruo).length).toBe(1);
    });

    it('la ficha los enseña por su origen; el monstruo, con su nombre', () => {
        const companero = lobo({ Trucos: [deMascota(LUCHA, 'monstruo'), deMascota(RASTREA, 'adicional', 2), deMascota(ATACA, 'adicional', 1)] });
        expect(trucosParaLaFicha(companero)).toEqual(['Ataca (adicional)', 'Rastrea (adicional)', 'Lucha (fin; de su monstruo)']);
        expect(trucosParaLaFicha(companero, false)).toEqual(['Ataca', 'Rastrea', 'Lucha (fin)']);
    });

    it('en los cambios de la ficha, los trucos como los deja el motor si cambian; si no, los guardados', () => {
        const base = { trucosAdi: 2, trucos: [{ idTruco: 3, origen: 'monstruo' as const }] } as unknown as PersonajeCreateCompaneroDto;
        const conUno = { ...base, trucos: [...(base.trucos ?? []), { idTruco: 1, origen: 'adicional' as const, orden: 1 }] };
        expect(companeroConLoDelMotor({ trucosAdi: 2 } as any, base, conUno).trucos).toEqual(conUno.trucos);
        expect(companeroConLoDelMotor({ trucosAdi: 2 } as any, base, base).trucos).toBeUndefined();
    });

    it('el catálogo y los trucos del monstruo: lo que falta, vacío; los de un monstruo, de su monstruo', () => {
        const [leido] = leerTrucos({ 4: { Id: 4, Nombre: 'Rastrea', Coste: 1, Requisitos: { Raciales: [{ Id: 43, Nombre: 'Olfato' }] } } });
        expect(leido.Requisitos.Especiales.map((e) => e.Nombre)).toEqual(['Olfato']);
        expect(leido.Sustituye).toBeNull();
        expect(leerTrucosDeMascota([{ Id: 7, Nombre: 'Lucha' }, { Id: 1, Nombre: 'Ataca', Origen: 'Adicional', Orden: 1 }, { Id: 0 }])
            .map((t) => [t.Origen, t.Orden])).toEqual([['monstruo', null], ['adicional', 1]]);
    });
});
