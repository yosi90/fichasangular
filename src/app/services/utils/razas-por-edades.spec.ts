import { normalizeRazaApi } from './raza-mapper';
import {
    MOTIVO_EDAD_SOLO_PNJ, motivoBloqueoPasoEdad, opcionesEdad, pasoEdadInicial, rangoEdadPaso, razaConEdad, razaPorEdades, textoRangoEdad
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

    it('la raza con su edad se escribe «Dragón rojo (joven)»', () => {
        expect(razaConEdad('Dragón rojo', 'Adulto maduro')).toBe('Dragón rojo (adulto maduro)');
        expect(razaConEdad('Humano', null)).toBe('Humano');
    });
});
