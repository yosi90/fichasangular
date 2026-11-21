import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import {
    ATAQUE_MULTIPLE, BISONTE, CELESTIAL, CLASES_CON_COMPANERO, COMPANERO_ELEVADO, COMPARTIR_CONJUROS, DEVOCION, DRUIDA, EVASION,
    EVASION_MEJORADA, EXPLORADOR, LOBO, MEJOR_AMIGO_DEL_PIRATA, MONSTRUOS_COMPANERO, PELEA_SUCIA, PIRATA, PROGRESION_API,
    SEGUNDO_ATAQUE_NATURAL, SENOR_DE_LAS_BESTIAS, TEJON, VINCULO,
} from 'src/testing/companero-animal-api';
import { leerCompaneroProgresion } from './monstruo-mapper';
import {
    aptitudesCompaneroDelNivel,
    bonosCompaneroDelNivel,
    bonosCompaneroPorDgAdicionales,
    claveCompanero,
    construirCatalogoCompanerosDesdeMonstruos,
    EstadoCuposCompanero,
    evaluarCompanerosElegibilidad,
    filtrarCompanerosElegibles,
    listasDeCompaneroDelCatalogo,
    resolverEstadoCuposCompanero,
    resolverFilaCompanero,
    resolverNivelesCompaneroDisponibles,
} from './companero-reglas';

const PROGRESION = leerCompaneroProgresion(PROGRESION_API);

function personaje(clases: Array<[string, number]>, partial: Partial<Personaje> = {}): Personaje {
    return {
        Alineamiento: 'Neutral autentico',
        desgloseClases: clases.map(([Nombre, Nivel]) => ({ Nombre, Nivel })),
        Companeros: [],
        Claseas: [],
        ...partial,
    } as any;
}

function estadoDe(clases: Array<[string, number]>, partial: Partial<Personaje> = {}): EstadoCuposCompanero {
    return resolverEstadoCuposCompanero(personaje(clases, partial), CLASES_CON_COMPANERO);
}

function catalogo(): CompaneroMonstruoDetalle[] {
    return construirCatalogoCompanerosDesdeMonstruos(MONSTRUOS_COMPANERO, listasDeCompaneroDelCatalogo(CLASES_CON_COMPANERO));
}

function delCatalogo(idMonstruo: number, idPlantilla = 0): CompaneroMonstruoDetalle {
    return catalogo().find((c) => claveCompanero(c) === `${idMonstruo}:${idPlantilla}`)!;
}

const LOBO_SIN_DOTE = { cumpleDote: () => false, monstruoTieneDote: () => false };
const CON_DOTE = { cumpleDote: () => true, monstruoTieneDote: () => false };

describe('companero-reglas (el compañero animal, de los datos)', () => {
    describe('el nivel efectivo de druida', () => {
        it('druida 4 / explorador 4 es 6: el explorador aporta la mitad (MJ pág. 39)', () => {
            const estado = estadoDe([['Druida', 4], ['Explorador', 4]]);
            expect(estado.nivelEfectivoCompanero).toBe(6);
            expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([DRUIDA, EXPLORADOR]);
            // Las dos eligen de la lista del druida; un solo compañero.
            expect(estado.listasIds).toEqual([DRUIDA]);
            expect(estado.cuposDisponibles).toBe(1);
        });

        it('druida 5 / señor de las bestias 2 es 10, el ejemplo del libro (El aventurero completo, pág. 78)', () => {
            expect(estadoDe([['Druida', 5], ['Señor de las bestias', 2]]).nivelEfectivoCompanero).toBe(10);
        });

        it('el explorador cuenta desde el nivel en que su tabla da la aptitud, y la mitad hacia abajo', () => {
            expect(estadoDe([['Explorador', 3]]).fuentesTotales).toBe(0);
            expect(estadoDe([['Explorador', 5]]).nivelEfectivoCompanero).toBe(2);
            expect(estadoDe([['Explorador', 8]]).nivelEfectivoCompanero).toBe(4);
        });

        it('el pirata que elige Pelea sucia no tiene compañero; con El mejor amigo del pirata, la mitad (F11)', () => {
            const conPeleaSucia = estadoDe([['Pirata', 4]], { Claseas: [{ Id: PELEA_SUCIA, Nombre: 'Pelea sucia', Extra: '' }] as any });
            expect(conPeleaSucia.fuentesTotales).toBe(0);
            expect(conPeleaSucia.cuposDisponibles).toBe(0);
            const conAmigo = estadoDe([['Pirata', 4]], { Claseas: [{ Id: MEJOR_AMIGO_DEL_PIRATA, Nombre: 'El mejor amigo del pirata', Extra: '' }] as any });
            expect(conAmigo.fuentesClaseIds).toEqual([PIRATA]);
            expect(conAmigo.nivelEfectivoCompanero).toBe(2);
        });

        it('cuenta el compañero que ya tiene', () => {
            const estado = estadoDe([['Druida', 4]], { Companeros: [delCatalogo(LOBO)] });
            expect(estado.cuposConsumidos).toBe(1);
            expect(estado.cuposDisponibles).toBe(0);
        });
    });

    describe('la lista', () => {
        it('un compañero por animal y plantilla de sus filas de compañero: el lobo, sin plantilla y celestial', () => {
            expect(catalogo().map(claveCompanero)).toEqual([`${BISONTE}:0`, `${LOBO}:0`, `${LOBO}:${CELESTIAL}`, `${TEJON}:0`]);
            expect(delCatalogo(LOBO, CELESTIAL).Plantilla).toEqual({ Id: CELESTIAL, Nombre: 'Celestial' });
            expect(delCatalogo(LOBO).Plantilla).toEqual({ Id: 0, Nombre: '' });
        });

        it('el explorador 8 elige el bisonte de la lista del druida, con −3 (F1)', () => {
            const resuelta = resolverFilaCompanero(delCatalogo(BISONTE), estadoDe([['Explorador', 8]]), new Set());
            expect(resuelta.fila?.Clase.Id).toBe(DRUIDA);
            expect(resuelta.nivelTabla).toBe(1);
            expect(resuelta.ajuste).toBe(-3);
        });

        it('con el ajuste en 0 o menos no se puede elegir, y dice por qué', () => {
            // Un explorador 6 (druida 3) llega al bisonte (druida 4) no; uno de druida 4 sí, con la tabla de druida 1.
            const explorador6 = resolverFilaCompanero(delCatalogo(BISONTE), estadoDe([['Explorador', 6]]), new Set());
            expect(explorador6.fila).toBeNull();
            expect(explorador6.razones[0]).toBe('Pide un nivel efectivo de druida 4, y tienes 3.');
            const sinNivel = resolverFilaCompanero(
                { ...delCatalogo(BISONTE), Niveles_clase: [{ ...delCatalogo(BISONTE).Niveles_clase[0], Nivel: 3 }] },
                estadoDe([['Druida', 3]]), new Set());
            expect(sinNivel.fila).toBeNull();
            expect(sinNivel.nivelTabla).toBe(0);
            expect(sinNivel.razones[0]).toBe('Con el ajuste de su lista (−3), «Bisonte» se queda sin nivel efectivo de druida: aún no se puede elegir.');
        });

        it('Faren (druida 6) con el bisonte cuenta como druida 3', () => {
            const resuelta = resolverFilaCompanero(delCatalogo(BISONTE), estadoDe([['Druida', 6], ['Monje', 4]]), new Set());
            expect(resuelta.nivelTabla).toBe(3);
            expect(bonosCompaneroDelNivel(PROGRESION, resuelta.nivelTabla)).toEqual(
                { Nivel: 3, Dg_adicionales: 2, Armadura_natural: 2, Fuerza_destreza: 1, Trucos_adicionales: 2 });
        });

        it('el animal celestial, a druida 2 con Compañero elevado y −1 (F12)', () => {
            const celestial = delCatalogo(LOBO, CELESTIAL);
            const sinDote = resolverFilaCompanero(celestial, estadoDe([['Druida', 2]]), new Set());
            expect(sinDote.fila).toBeNull();
            expect(sinDote.razones[0]).toBe('Hace falta la dote «Compañero elevado» para tenerlo como compañero animal.');
            const conDote = resolverFilaCompanero(celestial, estadoDe([['Druida', 2]]), new Set([COMPANERO_ELEVADO]));
            expect(conDote.fila?.Plantilla.Id).toBe(CELESTIAL);
            expect(conDote.nivelTabla).toBe(1);
            expect(resolverFilaCompanero(celestial, estadoDe([['Druida', 1]]), new Set([COMPANERO_ELEVADO])).razones[0])
                .toBe('Pide un nivel efectivo de druida 2, y tienes 1.');
        });

        it('un animal que no está en la lista de sus clases', () => {
            const halcon = { ...delCatalogo(TEJON), Id_companero: 99, Nombre: 'Halcón', Niveles_clase: [] };
            expect(resolverFilaCompanero(halcon, estadoDe([['Druida', 1]]), new Set()).razones[0])
                .toBe('No está en la lista de compañeros animales de tus clases (druida).');
        });

        it('filtra los elegibles, con el homebrew, el nivel y el alineamiento', () => {
            const estado = estadoDe([['Druida', 4]]);
            const companeros = [...catalogo(), { ...delCatalogo(TEJON), Id_companero: 70, Nombre: 'Tejón homebrew', Oficial: false }];
            const base = { companeros, estado, alineamientoPersonaje: 'Neutral autentico', incluirHomebrew: false, dotesPersonaje: new Set<number>() };
            expect(filtrarCompanerosElegibles(base).map((c) => c.Nombre)).toEqual(['Bisonte', 'Lobo', 'Tejón']);
            expect(filtrarCompanerosElegibles({ ...base, incluirHomebrew: true }).map((c) => c.Nombre)).toContain('Tejón homebrew');
            expect(filtrarCompanerosElegibles({ ...base, nivelSeleccionado: 4 }).map((c) => c.Nombre)).toEqual(['Bisonte']);
            expect(resolverNivelesCompaneroDisponibles(base)).toEqual([1, 4]);
            const bloqueado = evaluarCompanerosElegibilidad(base).find((c) => claveCompanero(c.companero) === `${LOBO}:${CELESTIAL}`)!;
            expect(bloqueado.elegible).toBeFalse();
            expect(bloqueado.ajuste).toBe(-1);
            expect(bloqueado.nivelMinimoRequerido).toBe(2);
            const conAlineamiento = { ...delCatalogo(LOBO), Alineamientos_requeridos: { Familiar: [], Companero: [{ Id: 1, Nombre: 'Legal bueno' }] } };
            expect(evaluarCompanerosElegibilidad({ ...base, companeros: [conAlineamiento] })[0].razones).toContain('Requiere alineamiento Legal bueno.');
        });
    });

    describe('la tabla y las aptitudes', () => {
        it('la fila de cada nivel y la que ya lleva un compañero por sus DG adicionales', () => {
            expect(bonosCompaneroDelNivel(PROGRESION, 0).Dg_adicionales).toBe(0);
            expect(bonosCompaneroDelNivel(PROGRESION, 2).Trucos_adicionales).toBe(1);
            expect(bonosCompaneroDelNivel(PROGRESION, 20).Nivel).toBe(18);
            expect(bonosCompaneroPorDgAdicionales(PROGRESION, 4).Nivel).toBe(6);
        });

        it('Evasión a 3, sin Devoción; lo del amo, al amo (F3)', () => {
            const a3 = aptitudesCompaneroDelNivel(PROGRESION, 3, CON_DOTE);
            expect(a3.delAmo.map((e) => e.Id)).toEqual([COMPARTIR_CONJUROS, VINCULO]);
            expect(a3.especiales.map((e) => e.Id)).toEqual([EVASION]);
            expect(a3.especialesQueNo).toEqual(jasmine.arrayContaining([DEVOCION, EVASION_MEJORADA]));
            expect(a3.dotes).toEqual([]);
            expect(a3.dotesQueNo).toEqual([ATAQUE_MULTIPLE]);
            expect(aptitudesCompaneroDelNivel(PROGRESION, 2, CON_DOTE).especiales).toEqual([]);
        });

        it('el lobo a 9 gana el segundo mordisco y no Ataque múltiple; el tejón, la dote (F4)', () => {
            const lobo = aptitudesCompaneroDelNivel(PROGRESION, 9, LOBO_SIN_DOTE);
            expect(lobo.especiales.map((e) => e.Id)).toEqual([EVASION, DEVOCION, SEGUNDO_ATAQUE_NATURAL]);
            expect(lobo.dotes).toEqual([]);
            expect(lobo.dotesQueNo).toEqual([ATAQUE_MULTIPLE]);
            const tejon = aptitudesCompaneroDelNivel(PROGRESION, 9, CON_DOTE);
            expect(tejon.dotes.map((d) => d.Id)).toEqual([ATAQUE_MULTIPLE]);
            expect(tejon.especialesQueNo).toContain(SEGUNDO_ATAQUE_NATURAL);
            // Si su monstruo ya la tiene, no se le vuelve a dar.
            expect(aptitudesCompaneroDelNivel(PROGRESION, 9, { cumpleDote: () => true, monstruoTieneDote: () => true }).dotes).toEqual([]);
        });
    });
});
