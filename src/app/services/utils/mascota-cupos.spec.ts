import { MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import {
    CLASES_SUSTITUCION_MASCOTAS, COMADREJA_APTITUD, COMADREJA_TERRIBLE, COMPANERO_ANIMAL, CONVOCAR_A_UN_FAMILIAR, DRUIDA,
    ELEMENTAL_AIRE_PEQUENO, ELFO_4, EXCAVADOR_APTITUD, EXPLORADOR, FAMILIAR_ELEMENTAL, FAMILIAR_ELEMENTAL_APTITUD, GATO, GNOMO_4,
    HECHICERO, KOBOLD_4, LOBO, MONSTRUOS_SUSTITUCION_MASCOTAS, personajeConSustituciones, RAPTORAN_1, SABUESO_APTITUD,
    SABUESO_ELFICO, TEJON, TEJON_TERRIBLE,
} from 'src/testing/niveles-sustitucion-mascotas-api';
import { construirCatalogoCompanerosDesdeMonstruos, resolverEstadoCuposCompanero, resolverFilaCompanero } from './companero-reglas';
import { construirCatalogoFamiliaresDesdeMonstruos, entradasDelSelectorFamiliar, resolverEstadoCuposFamiliar, resolverFilaFamiliar } from './familiar-reglas';
import { aportaAlDarla, esFilaDeSusListas, fuentesMascota } from './mascota-cupos';
import { fuentesDeLaMascota, puedeObtenerLaMascota } from './mascota-sesion';
import { catalogoDelReciclaje } from './reciclaje-mascota';

/*
 * Las mascotas de los niveles de sustitución (R8, tanda 1b; contrato: catalogos.md, «Las mascotas de los niveles de
 * sustitución»; la API, `utils/mascotas.py`): el explorador kóbold y su comadreja terrible, el explorador elfo y su sabueso
 * élfico, el explorador gnomo y sus excavadores, y el hechicero raptorán y su familiar elemental.
 */
describe('Las mascotas de los niveles de sustitución (R8, tanda 1b)', () => {
    const SIN_DOTES: ReadonlySet<number> = new Set<number>();
    const companeros = construirCatalogoCompanerosDesdeMonstruos(MONSTRUOS_SUSTITUCION_MASCOTAS);
    const familiares = construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_SUSTITUCION_MASCOTAS);
    const companero = (id: number) => companeros.find((c) => c.Id_companero === id)!;
    const familiar = (id: number) => familiares.find((f) => f.Id_familiar === id)!;
    const filaDelCompanero = (pj: ReturnType<typeof personajeConSustituciones>, id: number) =>
        resolverFilaCompanero(companero(id), resolverEstadoCuposCompanero(pj, CLASES_SUSTITUCION_MASCOTAS), SIN_DOTES);

    describe('el explorador kóbold (Races of the Dragon, pág. 109): la comadreja terrible, de lista propia', () => {
        const kobold = (nivel: number) => personajeConSustituciones([['Explorador', nivel, [[4, KOBOLD_4]]]]);

        it('su 4.º cambia «Compañero animal» por «Compañero comadreja terrible», a la mitad de su nivel y desde ese nivel', () => {
            const fuentes = fuentesMascota(kobold(6), CLASES_SUSTITUCION_MASCOTAS, 'Otorga_companero');
            expect(fuentes.map((f) => [f.idClase, f.idEspecial, f.aporta, f.soloListaPropia, f.nivelInicio]))
                .toEqual([[EXPLORADOR, COMADREJA_APTITUD, 3, true, 4]]);
            expect(aportaAlDarla(fuentes[0])).toBe(2);
            expect(fuentesMascota(kobold(3), CLASES_SUSTITUCION_MASCOTAS, 'Otorga_companero')).toEqual([]);
        });

        it('solo la comadreja terrible, con la fila de su aptitud (nivel 1, sin el −3 de la lista de 4.º del druida)', () => {
            const comadreja = filaDelCompanero(kobold(4), COMADREJA_TERRIBLE);
            expect([comadreja.fila?.Especial?.Id, comadreja.nivelTabla]).toEqual([COMADREJA_APTITUD, 2]);
            // El lobo, como la API: «no está en la lista de compañeros animales de sus clases (druida)».
            const lobo = filaDelCompanero(kobold(4), LOBO);
            expect(lobo.fila).toBeNull();
            expect(lobo.razones).toEqual(['No está en la lista de compañeros animales de tus clases (druida).']);
        });

        it('sin ese nivel, la comadreja pide druida 4 y el lobo vale; con druida, las listas se suman', () => {
            const estandar = personajeConSustituciones([['Explorador', 4]]);
            expect(filaDelCompanero(estandar, COMADREJA_TERRIBLE).razones).toEqual(['Pide un nivel efectivo de druida 4, y tienes 2.']);
            expect(filaDelCompanero(estandar, LOBO).fila).not.toBeNull();
            const conDruida = personajeConSustituciones([['Druida', 4], ['Explorador', 4, [[4, KOBOLD_4]]]]);
            expect(filaDelCompanero(conDruida, LOBO).fila).not.toBeNull();
            // Las dos filas de la comadreja le valen: la de más ajuste, la de su aptitud.
            const comadreja = filaDelCompanero(conDruida, COMADREJA_TERRIBLE);
            expect([comadreja.fila?.Especial?.Id, comadreja.ajuste, comadreja.nivelTabla]).toEqual([COMADREJA_APTITUD, 0, 6]);
        });
    });

    describe('el explorador elfo (Races of the Wild, págs. 155-157): el sabueso élfico, una fila más', () => {
        it('con su 4.º, el sabueso además de los animales del druida', () => {
            const elfo = personajeConSustituciones([['Explorador', 4, [[4, ELFO_4]]]]);
            const estado = resolverEstadoCuposCompanero(elfo, CLASES_SUSTITUCION_MASCOTAS);
            expect(estado.fuentesMascota.map((f) => [f.idEspecial, f.soloListaPropia])).toEqual([[COMPANERO_ANIMAL, false]]);
            expect(estado.aptitudesQueAbren).toContain(SABUESO_APTITUD);
            expect(filaDelCompanero(elfo, SABUESO_ELFICO).fila?.Especial?.Id).toBe(SABUESO_APTITUD);
            expect(filaDelCompanero(elfo, LOBO).fila).not.toBeNull();
        });

        it('sin ese nivel, el sabueso no está en su lista', () => {
            expect(filaDelCompanero(personajeConSustituciones([['Explorador', 4]]), SABUESO_ELFICO).razones)
                .toEqual(['No está en la lista de compañeros animales de tus clases (druida).']);
        });
    });

    describe('el explorador gnomo (Races of Stone, págs. 149-150): sus excavadores con +3', () => {
        const gnomo = personajeConSustituciones([['Explorador', 4, [[4, GNOMO_4]]]]);

        it('el tejón, con la fila de más ajuste (+3): su nivel efectivo 2 cuenta como 5 para la tabla', () => {
            const tejon = filaDelCompanero(gnomo, TEJON);
            expect([tejon.fila?.Especial?.Id, tejon.ajuste, tejon.nivelTabla]).toEqual([EXCAVADOR_APTITUD, 3, 5]);
        });

        it('el tejón terrible, desde el 4.º del explorador (la fila de su aptitud, nivel 1 y ajuste 0)', () => {
            const terrible = filaDelCompanero(gnomo, TEJON_TERRIBLE);
            expect([terrible.fila?.Especial?.Id, terrible.ajuste, terrible.nivelTabla]).toEqual([EXCAVADOR_APTITUD, 0, 2]);
        });

        it('sin ese nivel, el tejón de siempre y el tejón terrible, a druida 4', () => {
            const estandar = personajeConSustituciones([['Explorador', 4]]);
            expect([filaDelCompanero(estandar, TEJON).ajuste, filaDelCompanero(estandar, TEJON).nivelTabla]).toEqual([0, 2]);
            expect(filaDelCompanero(estandar, TEJON_TERRIBLE).fila).toBeNull();
        });
    });

    describe('el hechicero raptorán (Races of the Wild, pág. 162): el familiar elemental, de lista propia', () => {
        const raptoran = personajeConSustituciones([['Hechicero', 1, [[1, RAPTORAN_1]]]], '+0');

        it('su 1.º cambia «Convocar a un familiar» por «Familiar elemental» (y en los niveles siguientes)', () => {
            const estado = resolverEstadoCuposFamiliar(personajeConSustituciones([['Hechicero', 6, [[1, RAPTORAN_1]]]], '+3'), CLASES_SUSTITUCION_MASCOTAS);
            expect(estado.fuentesMascota.map((f) => [f.idClase, f.idEspecial, f.soloListaPropia])).toEqual([[HECHICERO, FAMILIAR_ELEMENTAL_APTITUD, true]]);
            expect(estado.nivelEfectivo).toBe(6);
            expect(estado.fuentesMascota.some((f) => f.idEspecial === CONVOCAR_A_UN_FAMILIAR)).toBeFalse();
        });

        it('solo el elemental de aire Pequeño, con la pseudoplantilla «Familiar elemental»; el gato, no', () => {
            const estado = resolverEstadoCuposFamiliar(raptoran, CLASES_SUSTITUCION_MASCOTAS);
            expect(resolverFilaFamiliar(familiar(ELEMENTAL_AIRE_PEQUENO), estado, SIN_DOTES).fila?.Plantilla.Id).toBe(FAMILIAR_ELEMENTAL);
            expect(resolverFilaFamiliar(familiar(GATO), estado, SIN_DOTES).fila).toBeNull();
            // El filtro de plantilla del selector, solo la suya.
            const entradas = entradasDelSelectorFamiliar({ familiares, estado, alineamientoPersonaje: 'Neutral auténtico', plantillaSeleccionada: null, incluirHomebrew: true, dotesPersonaje: SIN_DOTES });
            expect(entradas.plantillas.map((p) => p.Id)).toEqual([FAMILIAR_ELEMENTAL]);
            expect(entradas.bloqueados.map((b) => [b.familiar.Id_familiar, b.razones]))
                .toEqual([[GATO, ['No está en la lista de familiares de tus clases (hechicero).']]]);
            expect(entradas.elegibles.map((f) => f.Id_familiar)).toEqual([ELEMENTAL_AIRE_PEQUENO]);
        });

        it('sin ese nivel, el gato y no el elemental', () => {
            const estado = resolverEstadoCuposFamiliar(personajeConSustituciones([['Hechicero', 1]], '+0'), CLASES_SUSTITUCION_MASCOTAS);
            expect(resolverFilaFamiliar(familiar(GATO), estado, SIN_DOTES).fila).not.toBeNull();
            expect(resolverFilaFamiliar(familiar(ELEMENTAL_AIRE_PEQUENO), estado, SIN_DOTES).fila).toBeNull();
        });
    });

    describe('los flujos de la sesión: obtener otra mascota y el reciclaje', () => {
        it('obtener la mascota tras la subida: la ficha con el 4.º kóbold puede llamar a su comadreja; con 3, ninguna clase se la da', () => {
            expect(puedeObtenerLaMascota(personajeConSustituciones([['Explorador', 4, [[4, KOBOLD_4]]]]), CLASES_SUSTITUCION_MASCOTAS, 'companero')).toBeTrue();
            expect(fuentesDeLaMascota(personajeConSustituciones([['Explorador', 4, [[4, KOBOLD_4]]]]), CLASES_SUSTITUCION_MASCOTAS, 'companero')
                .map((f) => f.idEspecial)).toEqual([COMADREJA_APTITUD]);
            expect(puedeObtenerLaMascota(personajeConSustituciones([['Explorador', 3]]), CLASES_SUSTITUCION_MASCOTAS, 'companero')).toBeFalse();
            // Sin `Niveles_sustitucion` en su desglose (el borrador de antes de anotarlos), los de su orden de niveles.
            const conOrden = { ...personajeConSustituciones([['Explorador', 4]]), Orden_niveles: [{ idClase: EXPLORADOR, nivelClase: 4, idNivelSustitucion: KOBOLD_4 }] };
            expect(fuentesDeLaMascota(conOrden as any, CLASES_SUSTITUCION_MASCOTAS, 'companero').map((f) => f.idEspecial)).toEqual([COMADREJA_APTITUD]);
        });

        it('el reciclaje solo ofrece las criaturas de sus listas: la comadreja del kóbold, con la fila de su aptitud', () => {
            const estado = resolverEstadoCuposCompanero(personajeConSustituciones([['Explorador', 8, [[4, KOBOLD_4]]]]), CLASES_SUSTITUCION_MASCOTAS);
            const hueco = {
                tipo: 'mascota' as const, clave: 'mascota:companero', mascota: 'companero' as const, idClase: EXPLORADOR, clase: 'Explorador',
                tiene: { idMonstruo: LOBO, idPlantilla: 0, nombre: 'Lobo', plantilla: '' }, nombrePropio: '', nivelEleccion: 4, nivelPorDote: {}, motivo: null,
            };
            const ofrecidas = catalogoDelReciclaje(companeros, hueco, estado);
            expect(ofrecidas.map((c) => [c.Id_companero, c.Niveles_clase.map((f) => f.Especial?.Id ?? 0)])).toEqual([[COMADREJA_TERRIBLE, [COMADREJA_APTITUD]]]);
        });
    });

    describe('esFilaDeSusListas', () => {
        const fila = (lista: number, especial: number | null): MonstruoNivelClase =>
            ({ Clase: { Id: lista, Nombre: '' }, Especial: especial ? { Id: especial, Nombre: '' } : null } as MonstruoNivelClase);

        it('sin fuentes (las listas solas), las filas sin aptitud de esas listas', () => {
            expect(esFilaDeSusListas(fila(DRUIDA, null), { listasIds: [DRUIDA] })).toBeTrue();
            expect(esFilaDeSusListas(fila(HECHICERO, null), { listasIds: [DRUIDA] })).toBeFalse();
            expect(esFilaDeSusListas(fila(DRUIDA, SABUESO_APTITUD), { listasIds: [DRUIDA] })).toBeFalse();
            expect(esFilaDeSusListas(fila(DRUIDA, SABUESO_APTITUD), { listasIds: [DRUIDA], aptitudesQueAbren: [SABUESO_APTITUD] })).toBeTrue();
        });

        it('la lista de una fuente de lista propia, solo con su aptitud; con otra fuente que la da entera, toda', () => {
            const kobold = { idEspecial: COMADREJA_APTITUD, soloListaPropia: true, lista: { id: DRUIDA, nombre: 'Druida' } };
            const druida = { idEspecial: COMPANERO_ANIMAL, soloListaPropia: false, lista: { id: DRUIDA, nombre: 'Druida' } };
            const solo = { listasIds: [DRUIDA], fuentesMascota: [kobold] as any };
            expect(esFilaDeSusListas(fila(DRUIDA, null), solo)).toBeFalse();
            expect(esFilaDeSusListas(fila(DRUIDA, COMADREJA_APTITUD), solo)).toBeTrue();
            const conDruida = { listasIds: [DRUIDA], fuentesMascota: [kobold, druida] as any };
            expect(esFilaDeSusListas(fila(DRUIDA, null), conDruida)).toBeTrue();
        });
    });
});
