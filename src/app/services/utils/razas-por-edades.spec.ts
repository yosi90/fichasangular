import { normalizeRazaApi } from './raza-mapper';
import {
    leerCategoriaEdadListado, MOTIVO_EDAD_SOLO_PNJ, MOTIVO_PJ_SIN_CLASE, motivoBloqueoPasoEdad, opcionesEdad, pasoEdadInicial,
    puedeQuedarseSinClases, rangoEdadPaso, razaConCategoria, razaConEdad, razaPorEdades, textoRangoEdad
} from './razas-por-edades';
import { razaPorEdadesApi } from 'src/testing/raza-por-edades';

describe('razas-por-edades', () => {
    const raza = normalizeRazaApi(razaPorEdadesApi());

    it('una raza crece por edades si trae pasos de edad (sin mirar su nombre)', () => {
        expect(razaPorEdades(raza)).toBeTrue();
        expect(razaPorEdades({ Pasos_edad: [] })).toBeFalse();
        expect(razaPorEdades(null)).toBeFalse();
    });

    it('un PJ solo elige los pasos con ajuste: el resto, atenuado con «Solo PNJ» y el texto del contrato', () => {
        const opciones = opcionesEdad(raza, { tipo: 'pj' });

        expect(opciones.map((c) => c.nombre)).toEqual(['Cría', 'Muy joven', 'Joven', 'Juvenil']);
        expect(opciones.map((c) => c.pie)).toEqual(['NEP 11', 'NEP 15', 'NEP 19–20', 'Solo PNJ']);
        expect(opciones[3].bloqueada).toBeTrue();
        expect(opciones[3].motivo).toBe(MOTIVO_EDAD_SOLO_PNJ);
        expect(opciones[2].pasos.map((p) => p.texto)).toEqual(['16 años · 13 DG · NEP 19', '20 años · 14 DG · NEP 20']);
    });

    it('un PNJ elige cualquier edad y ve su VD en lugar del NEP', () => {
        const opciones = opcionesEdad(raza, { tipo: 'pnj', nepMaximo: 5 });

        expect(opciones.every((c) => !c.bloqueada)).toBeTrue();
        expect(opciones.map((c) => c.pie)).toEqual(['VD 4', 'VD 5', 'VD 7', 'VD 10']);
    });

    it('para un PJ, también salen atenuadas las que pasan del NEP máximo de la campaña', () => {
        const opciones = opcionesEdad(raza, { tipo: 'pj', nepMaximo: 15 });

        expect(opciones.map((c) => c.bloqueada)).toEqual([false, false, true, true]);
        expect(opciones[2].motivo).toContain('NEP máximo');
        expect(motivoBloqueoPasoEdad(raza.Pasos_edad![0], { tipo: 'pj', nepMaximo: 15 })).toBeNull();
    });

    it('el paso inicial es el preferido si se puede elegir; si no, el primero que se pueda', () => {
        const pj = opcionesEdad(raza, { tipo: 'pj' });
        expect(pasoEdadInicial(pj, 14)?.Id).toBe(14);
        expect(pasoEdadInicial(pj, 15)?.Id).toBe(11);
        expect(pasoEdadInicial(opcionesEdad(raza, { tipo: 'pnj' }), 15)?.Id).toBe(15);
        expect(pasoEdadInicial([], 1)).toBeNull();
    });

    it('los años de un paso llegan hasta el siguiente paso o el final de su categoría', () => {
        expect(rangoEdadPaso(raza, 13)).toEqual({ desde: 16, hasta: 19 });
        expect(rangoEdadPaso(raza, 14)).toEqual({ desde: 20, hasta: 25 });
        expect(rangoEdadPaso(raza, 15)).toEqual({ desde: 26, hasta: 50 });
        expect(rangoEdadPaso(raza, 99)).toBeNull();
        expect(textoRangoEdad({ desde: 1201, hasta: null })).toBe('desde 1201 años');
    });

    it('una edad sin ajuste se puede elegir igualmente (homebrew); la que pasa del NEP de la campaña, no', () => {
        const opciones = opcionesEdad(raza, { tipo: 'pj', nepMaximo: 15 });

        expect(opciones.map((c) => c.saltable)).toEqual([false, false, false, true]);
        expect(opciones[3].pasos.every((p) => p.bloqueado && p.saltable)).toBeTrue();
        expect(opciones[2].pasos.every((p) => p.bloqueado && !p.saltable)).toBeTrue();
        expect(opcionesEdad(raza, { tipo: 'pnj' }).some((c) => c.saltable)).toBeFalse();
    });

    it('sin clases: un PNJ siempre; un PJ de una raza por edades con DG raciales a su edad o con 4 DG raciales o más', () => {
        expect(puedeQuedarseSinClases({ tipo: 'pnj', porEdades: false, dgsRaciales: 0 })).toBeTrue();
        expect(puedeQuedarseSinClases({ tipo: 'pnj', porEdades: true, dgsRaciales: 27 })).toBeTrue();
        expect(puedeQuedarseSinClases({ tipo: 'pj', porEdades: true, dgsRaciales: 11 })).toBeTrue();
        expect(puedeQuedarseSinClases({ tipo: 'pj', porEdades: true, dgsRaciales: 0 })).toBeFalse();
        expect(puedeQuedarseSinClases({ tipo: 'pj', porEdades: false, dgsRaciales: 4 })).toBeTrue();
        expect(puedeQuedarseSinClases({ tipo: 'pj', porEdades: false, dgsRaciales: 3 })).toBeFalse();
        expect(puedeQuedarseSinClases({ tipo: null, porEdades: false, dgsRaciales: 2 })).toBeFalse();
        expect(MOTIVO_PJ_SIN_CLASE).toContain('Un PJ necesita al menos un nivel de clase');
    });

    it('la raza con su categoría se escribe «Dragón rojo · cría»; sin categoría, solo la raza', () => {
        expect(razaConCategoria('Dragón rojo', 'Cría')).toBe('Dragón rojo · cría');
        expect(razaConCategoria('Humano', null)).toBe('Humano');
        expect(razaConCategoria('  ', 'Adulto')).toBe('adulto');
    });

    it('la categoría de los listados: cadena en Firestore y en la API, `Categoria_edad` en la RTDB, objeto en la ficha', () => {
        expect(leerCategoriaEdadListado({ categoriaEdad: 'Cría' })).toBe('Cría');
        expect(leerCategoriaEdadListado({ Categoria_edad: 'Joven' })).toBe('Joven');
        expect(leerCategoriaEdadListado({ categoriaEdad: { categoria: { Id: 3, Nombre: 'Joven' } } })).toBe('Joven');
        expect(leerCategoriaEdadListado({ CategoriaEdad: { categoria: { Id: 1, Nombre: 'Cría' } } })).toBe('Cría');
        expect(leerCategoriaEdadListado({ categoriaEdad: null })).toBeNull();
        expect(leerCategoriaEdadListado({})).toBeNull();
        expect(leerCategoriaEdadListado(null)).toBeNull();
    });

    it('la raza con su edad se escribe «Dragón rojo (joven)»', () => {
        expect(razaConEdad('Dragón rojo', 'Adulto maduro')).toBe('Dragón rojo (adulto maduro)');
        expect(razaConEdad('Humano', null)).toBe('Humano');
    });
});
