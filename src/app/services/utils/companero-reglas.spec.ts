import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import {
    ARANA_PEQUENA, ATAQUE_MULTIPLE, BISONTE, CELESTIAL, CLASES_CON_COMPANERO, COMPANERO_ARANA, COMPANERO_ELEVADO, COMPANERO_SABANDIJA,
    COMPARTIR_CONJUROS, DEVOCION, DRUIDA, ESCORPION_PEQUENO, EVASION, EVASION_MEJORADA, EXPLORADOR, LOBO, MEJOR_AMIGO_DEL_PIRATA,
    MONSTRUOS_COMPANERO, MONSTRUOS_SABANDIJA, PELEA_SUCIA, PIRATA, PROGRESION_API, SEGUNDO_ATAQUE_NATURAL, SENOR_DE_LAS_BESTIAS, TEJON,
    VINCULO,
} from 'src/testing/companero-animal-api';
import { construirCatalogoFamiliaresDesdeMonstruos } from './familiar-reglas';
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
    puntosPorDgDelCompanero,
    rangosDelCompaneroQueCaben,
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
    return construirCatalogoCompanerosDesdeMonstruos(MONSTRUOS_COMPANERO);
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
            expect(estado.nivelEfectivo).toBe(6);
            expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([DRUIDA, EXPLORADOR]);
            // Las dos eligen de la lista del druida; un solo compañero.
            expect(estado.listasIds).toEqual([DRUIDA]);
            expect(estado.cuposDisponibles).toBe(1);
        });

        it('druida 5 / señor de las bestias 2 es 10, el ejemplo del libro (El aventurero completo, pág. 78)', () => {
            expect(estadoDe([['Druida', 5], ['Señor de las bestias', 2]]).nivelEfectivo).toBe(10);
        });

        it('el explorador cuenta desde el nivel en que su tabla da la aptitud, y la mitad hacia abajo', () => {
            expect(estadoDe([['Explorador', 3]]).fuentesTotales).toBe(0);
            expect(estadoDe([['Explorador', 5]]).nivelEfectivo).toBe(2);
            expect(estadoDe([['Explorador', 8]]).nivelEfectivo).toBe(4);
        });

        it('el pirata que elige Pelea sucia no tiene compañero; con El mejor amigo del pirata, la mitad (F11)', () => {
            const conPeleaSucia = estadoDe([['Pirata', 4]], { Claseas: [{ Id: PELEA_SUCIA, Nombre: 'Pelea sucia', Extra: '' }] as any });
            expect(conPeleaSucia.fuentesTotales).toBe(0);
            expect(conPeleaSucia.cuposDisponibles).toBe(0);
            const conAmigo = estadoDe([['Pirata', 4]], { Claseas: [{ Id: MEJOR_AMIGO_DEL_PIRATA, Nombre: 'El mejor amigo del pirata', Extra: '' }] as any });
            expect(conAmigo.fuentesClaseIds).toEqual([PIRATA]);
            expect(conAmigo.nivelEfectivo).toBe(2);
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

    // Las filas nuevas del 2026-11-21 (tanda 3a, `mascotas_listas_datos.sql`) salen solas: son datos de `Niveles_clase`.
    describe('las filas de Compañero araña y Compañero sabandija (F13)', () => {
        const sabandijas = construirCatalogoCompanerosDesdeMonstruos(MONSTRUOS_SABANDIJA);
        const deSabandija = (id: number) => sabandijas.find((c) => claveCompanero(c) === `${id}:0`)!;
        const conSabandija = new Set([COMPANERO_SABANDIJA]);

        it('entran en el catálogo del compañero sin su fila de familiar, y siguen siendo familiares', () => {
            expect(sabandijas.map(claveCompanero)).toEqual([`${ARANA_PEQUENA}:0`, `${ESCORPION_PEQUENO}:0`]);
            expect(deSabandija(ARANA_PEQUENA).Niveles_clase.map((f) => [f.Nivel, f.Dote.Nombre]))
                .toEqual([[1, 'Compañero araña'], [3, 'Compañero sabandija']]);
            expect(construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_SABANDIJA).map((f) => f.Id_familiar))
                .toEqual([ARANA_PEQUENA, ESCORPION_PEQUENO]);
        });

        it('un druida 3 con Compañero sabandija elige la araña o el escorpión, con los valores de druida 3 (ajuste 0)', () => {
            const estado = estadoDe([['Druida', 3]]);
            [ARANA_PEQUENA, ESCORPION_PEQUENO].forEach((id) => {
                const resuelta = resolverFilaCompanero(deSabandija(id), estado, conSabandija);
                expect(resuelta.fila?.Dote.Id).withContext(`${id}`).toBe(COMPANERO_SABANDIJA);
                expect(resuelta.nivelTabla).withContext(`${id}`).toBe(3);
                expect(resuelta.ajuste).withContext(`${id}`).toBe(0);
            });
            const elegibles = filtrarCompanerosElegibles({
                companeros: sabandijas, estado, alineamientoPersonaje: 'Neutral autentico', incluirHomebrew: false, dotesPersonaje: conSabandija,
            });
            expect(elegibles.map((c) => c.Nombre)).toEqual(['Araña monstruosa (pequeña)', 'Escorpión monstruoso (Pequeño)']);
        });

        it('a druida 2, o sin la dote, no; la araña, con Compañero araña, desde druida 1', () => {
            expect(resolverFilaCompanero(deSabandija(ESCORPION_PEQUENO), estadoDe([['Druida', 2]]), conSabandija).razones)
                .toEqual(['Pide un nivel efectivo de druida 3, y tienes 2.']);
            expect(resolverFilaCompanero(deSabandija(ARANA_PEQUENA), estadoDe([['Druida', 3]]), new Set()).razones)
                .toEqual(['Hace falta la dote «Compañero araña» o «Compañero sabandija» para tenerlo como compañero animal.']);
            const conArana = resolverFilaCompanero(deSabandija(ARANA_PEQUENA), estadoDe([['Druida', 1]]), new Set([COMPANERO_ARANA]));
            expect(conArana.fila?.Dote.Id).toBe(COMPANERO_ARANA);
            expect(conArana.nivelTabla).toBe(1);
        });
    });

    it('una fila que pide un ataque base (hoy ninguna del compañero) tampoco se elige sin él', () => {
        const lobo = delCatalogo(LOBO);
        const conMinimo = { ...lobo, Niveles_clase: lobo.Niveles_clase.map((f) => ({ ...f, Ataque_base_minimo: 3 })) };
        expect(resolverFilaCompanero(conMinimo, estadoDe([['Druida', 3]], { Ataque_base: '+2' }), new Set()).razones)
            .toEqual(['Pide un ataque base de +3 (tienes +2).']);
        expect(resolverFilaCompanero(conMinimo, estadoDe([['Druida', 4]], { Ataque_base: '+3' }), new Set()).fila).not.toBeNull();
    });

    it('de la que ya tiene, lo que no cumple con las frases de la API (`motivo`; contrato, «Las frases de "queda inactivo"»)', () => {
        const motivo = (companero: any, estado: any, dotes = new Set<number>(), sin?: Set<number>) =>
            resolverFilaCompanero(companero, estado, dotes, sin).motivo;
        const bisonte = { ...delCatalogo(BISONTE), Nombre: 'Lomo', Monstruo_origen: { Id: BISONTE, Nombre: 'Bisonte' } };
        expect(motivo(bisonte, estadoDe([['Explorador', 6]]))).toBe('El compañero animal «Bisonte» pide un nivel efectivo de druida 4, y el personaje tiene 3');
        expect(motivo({ ...bisonte, Niveles_clase: [{ ...bisonte.Niveles_clase[0], Nivel: 3 }] }, estadoDe([['Druida', 3]])))
            .toBe('Con el ajuste de su lista (−3), el compañero animal «Bisonte» se queda sin nivel efectivo de druida');
        const celestial = delCatalogo(LOBO, CELESTIAL);
        expect(motivo(celestial, estadoDe([['Druida', 2]]))).toBe('Para tener «Lobo» como compañero animal hace falta la dote «Compañero elevado»');
        expect(motivo(celestial, estadoDe([['Druida', 2]]), new Set(), new Set([COMPANERO_ELEVADO])))
            .toBe('El compañero animal «Lobo» pide la dote «Compañero elevado», y el personaje la tiene sin sus prerrequisitos');
        expect(motivo({ ...celestial, Plantilla: { Id: 999, Nombre: 'Otra' } }, estadoDe([['Druida', 2]])))
            .toBe('El compañero animal «Lobo», con su plantilla, no está en la lista de compañeros animales de sus clases');
        expect(motivo({ ...delCatalogo(TEJON), Nombre: 'Halcón', Monstruo_origen: { Id: 99, Nombre: 'Halcón' }, Niveles_clase: [] }, estadoDe([['Druida', 1]])))
            .toBe('El compañero animal «Halcón» no está en la lista de compañeros animales de sus clases (druida)');
        expect(motivo(bisonte, estadoDe([]))).toBe('Ninguna clase del personaje le da ya un compañero animal');
        const lobo = delCatalogo(LOBO);
        const conMinimo = { ...lobo, Niveles_clase: lobo.Niveles_clase.map((f) => ({ ...f, Ataque_base_minimo: 3 })) };
        expect(motivo(conMinimo, estadoDe([['Druida', 3]], { Ataque_base: '+2' })))
            .toBe('El compañero animal «Lobo» pide un ataque base de +3, y el personaje tiene +2');
        expect(motivo(lobo, estadoDe([['Druida', 3]]))).toBe('');
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

describe('los rangos del compañero al bajar sus DG adicionales, «todo o nada» (como la herramienta de la API)', () => {
    const habilidad = (id: number, rangos: number, extra = -1) => ({
        Id_habilidad: id, Habilidad: `H${id}`, Id_caracteristica: 1, Caracteristica: '', Descripcion: '', Soporta_extra: false,
        Entrenada: false, Id_extra: extra, Extra: '', Rangos: rangos,
    });
    // Su monstruo: Escuchar 4 y Avistar 4. Con Int 2 (−4), un punto por DG adicional.
    const DEL_MONSTRUO = [habilidad(1, 4), habilidad(2, 4)];

    it('los puntos de cada DG adicional (máx(1, puntos del tipo + mod. de Int))', () => {
        expect([puntosPorDgDelCompanero(2, 2), puntosPorDgDelCompanero(2, 10), puntosPorDgDelCompanero(2, 14), puntosPorDgDelCompanero(2, null)]).toEqual([1, 2, 4, 0]);
        // Los del tipo de su monstruo: una bestia mágica (6 por DG) con Int 6, 4.
        expect(puntosPorDgDelCompanero(6, 6)).toBe(4);
        // Sin Inteligencia (una sabandija descerebrada, `null` o el 0 de la base): ninguno.
        expect(puntosPorDgDelCompanero(2, 0)).toBe(0);
    });

    it('si lo que pasa de su monstruo cabe en los puntos de sus DG de ahora, se queda; si no, vuelve a su monstruo y las demás a 0', () => {
        const suyas = [habilidad(1, 6), habilidad(2, 4), habilidad(3, 1)];
        // +2 en Escuchar (1 cada uno) y 1 rango de Saltar (2): 4 puntos; con 4 DG adicionales caben.
        expect(rangosDelCompaneroQueCaben(suyas, DEL_MONSTRUO, 4, 2, 2).map((h) => h.Rangos)).toEqual([6, 4, 1]);
        // Con 2 DG adicionales, 2 puntos: no caben, todo vuelve a su monstruo.
        expect(rangosDelCompaneroQueCaben(suyas, DEL_MONSTRUO, 2, 2, 2).map((h) => h.Rangos)).toEqual([4, 4, 0]);
        // Los mismos 2 DG adicionales con un tipo de 6 puntos por DG (no un animal): 4 puntos, caben.
        expect(rangosDelCompaneroQueCaben(suyas, DEL_MONSTRUO, 2, 6, 2).map((h) => h.Rangos)).toEqual([6, 4, 1]);
        // Sin DG adicionales (el compañero inactivo), lo de su monstruo.
        expect(rangosDelCompaneroQueCaben(suyas, DEL_MONSTRUO, 0, 2, 2).map((h) => h.Rangos)).toEqual([4, 4, 0]);
        // Un rango más que sus DG adicionales en una de su monstruo no cabe aunque sobren puntos.
        expect(rangosDelCompaneroQueCaben([habilidad(1, 7)], DEL_MONSTRUO, 2, 2, 18).map((h) => h.Rangos)).toEqual([4]);
    });
});
