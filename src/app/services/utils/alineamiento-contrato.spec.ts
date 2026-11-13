import {
    nombreCombinacionAlineamiento,
    cumpleActitud,
    datoDePreferencia,
    extraerEjesAlineamientoDesdeContrato,
    idBasicoDePrerrequisitoAlineamiento,
    reglaDePreferenciaAlineamiento,
} from './alineamiento-contrato';

describe('alineamiento-contrato', () => {
    it('lo que pide una preferencia sale de su dato, no de su nombre (bugs.md de sesiones, 2026-11-13)', () => {
        // Un nombre que diría otra cosa no cuenta: manda el dato.
        expect(reglaDePreferenciaAlineamiento({ Nombre: 'Siempre Legal', Valor: -1, Prohibe: false, Id_prioridad: 3 } as any))
            .toEqual({ valor: -1, prohibe: false, prioridad: 3, estricta: true });
        expect(reglaDePreferenciaAlineamiento({ Valor: 1, Prohibe: true, Id_prioridad: 2 }))
            .toEqual({ valor: 1, prohibe: true, prioridad: 2, estricta: false });
        // Sin `Valor` («No aplica», «Ninguna preferencia», o una caché de antes), no pide nada.
        expect(reglaDePreferenciaAlineamiento({ Nombre: 'Nunca Legal' } as any)).toBeNull();
        expect(reglaDePreferenciaAlineamiento({ Valor: null, Prohibe: false, Id_prioridad: 0 })).toBeNull();
        expect(reglaDePreferenciaAlineamiento(null)).toBeNull();
        expect(datoDePreferencia({ Valor: '1', Prohibe: 1, Id_prioridad: '3' })).toEqual({ Valor: 1, Prohibe: true, Id_prioridad: 3 });
    });

    it('lo que exige un alineamiento en cada eje: una preferencia que prohíbe no exige ningún valor', () => {
        expect(extraerEjesAlineamientoDesdeContrato({
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Valor: 1, Prohibe: true, Id_prioridad: 3 }, Moral: { Valor: -1, Prohibe: false, Id_prioridad: 3 },
        })).toEqual({ ley: null, moral: -1 });
        expect(extraerEjesAlineamientoDesdeContrato({ Basico: { Id_basico: 7, Nombre: 'Caótico bueno' }, Ley: {}, Moral: {} }))
            .toEqual({ ley: -1, moral: 1 });
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
