import {
    nombreCombinacionAlineamiento,
    cumpleActitud,
    idBasicoDePrerrequisitoAlineamiento,
    parseLeyDesdePreferencia,
    parseMoralDesdePreferencia,
} from './alineamiento-contrato';

describe('alineamiento-contrato', () => {
    it('una preferencia que prohíbe («Nunca legal», «Casi nunca neutral») no exige ningún valor del eje', () => {
        expect(parseLeyDesdePreferencia('Nunca Legal')).toBeNull();
        expect(parseLeyDesdePreferencia('Casi nunca Neutral')).toBeNull();
        expect(parseLeyDesdePreferencia('Tendencia a no ser caótico')).toBeNull();
        expect(parseMoralDesdePreferencia('Nunca Bueno')).toBeNull();
        expect(parseLeyDesdePreferencia('Siempre Legal')).toBe(1);
        expect(parseMoralDesdePreferencia('Casi siempre Maligno')).toBe(-1);
    });

    it('las actitudes sobre el alineamiento básico: neutral es serlo en algún eje', () => {
        expect(cumpleActitud(1, 2)).toBeTrue(); // legal: legal neutral
        expect(cumpleActitud(1, 4)).toBeFalse(); // legal: neutral bueno
        expect(cumpleActitud(2, 4)).toBeTrue(); // neutral: neutral bueno
        expect(cumpleActitud(2, 1)).toBeFalse(); // neutral: legal bueno
        expect(cumpleActitud(5, 9)).toBeTrue(); // maligno: caótico maligno
        expect(cumpleActitud(4, 9)).toBeFalse(); // bueno: caótico maligno
    });

    it('el alineamiento que pide un prerrequisito es el básico, no la combinación de `alineamientos`', () => {
        // El legal bueno «siempre» es la combinación 3, que como básico sería el legal maligno.
        expect(idBasicoDePrerrequisitoAlineamiento({ Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: 'Legal bueno' })).toBe(1);
        expect(idBasicoDePrerrequisitoAlineamiento({ Id_alineamiento: 73, Alineamiento_basico: 'Legal neutral' })).toBe(2);
        expect(idBasicoDePrerrequisitoAlineamiento({ Id_alineamiento: 3 })).toBe(0);
    });

    it('nombra una combinación del catálogo (que no trae Nombre) con su texto y su prioridad', () => {
        expect(nombreCombinacionAlineamiento({ Basico: { Nombre: 'Legal maligno' }, Ley: {}, Moral: {}, Prioridad: { Nombre: 'Siempre' } })).toBe('Legal maligno · Siempre');
        expect(nombreCombinacionAlineamiento({ Basico: { Nombre: 'Neutral bueno' }, Prioridad: null })).toBe('Neutral bueno');
        expect(nombreCombinacionAlineamiento(null)).toBe('');
    });
});
