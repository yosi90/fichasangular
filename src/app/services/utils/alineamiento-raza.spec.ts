import { evaluarAlineamientoRaza, textoExigenciaAlineamiento } from './alineamiento-raza';

/** Un alineamiento de raza con su básico, sus preferencias (con su dato) y su prioridad. */
function alineamiento(basico: [number, string], ley: [number | null, boolean, number, string], moral: [number | null, boolean, number, string], prioridad: number): any {
    return {
        Basico: { Id_basico: basico[0], Nombre: basico[1] },
        Ley: { Nombre: ley[3], Valor: ley[0], Prohibe: ley[1], Id_prioridad: ley[2] },
        Moral: { Nombre: moral[3], Valor: moral[0], Prohibe: moral[1], Id_prioridad: moral[2] },
        Prioridad: { Id_prioridad: prioridad, Nombre: '' },
    };
}

const NADA: [null, boolean, number, string] = [null, false, 0, 'No aplica'];

describe('alineamiento-raza (la regla común de la creación, la corrección y la adquisición)', () => {
    it('un básico que no coincide pesa lo que la prioridad del alineamiento', () => {
        const elfo = alineamiento([7, 'Caótico bueno'], NADA, NADA, 2);
        expect(evaluarAlineamientoRaza(elfo, 'Caótico bueno')).toBeNull();
        expect(evaluarAlineamientoRaza(elfo, 'Legal maligno')).toEqual({ severidad: 'soft', requerido: 'Caótico bueno', prioridad: 2 });
        expect(evaluarAlineamientoRaza({ ...elfo, Prioridad: { Id_prioridad: 3 } }, 'Legal maligno')?.severidad).toBe('hard');
        expect(evaluarAlineamientoRaza({ ...elfo, Prioridad: { Id_prioridad: 1 } }, 'Legal maligno')).toBeNull();
    });

    it('una preferencia pesa lo suyo: «siempre» es dura, «casi» avisa y una «tendencia» deja la prioridad del alineamiento', () => {
        const siempre = alineamiento([0, 'No aplica'], [1, false, 3, 'Siempre legal'], NADA, 1);
        expect(evaluarAlineamientoRaza(siempre, 'Caótico bueno')?.severidad).toBe('hard');
        expect(evaluarAlineamientoRaza(siempre, 'Legal neutral')).toBeNull();
        const casi = alineamiento([0, 'No aplica'], NADA, [-1, false, 2, 'Casi siempre maligno'], 3);
        expect(evaluarAlineamientoRaza(casi, 'Neutral bueno')?.severidad).toBe('soft');
        const tendencia = alineamiento([0, 'No aplica'], [-1, false, 1, 'Tendencia a ser caótico'], NADA, 2);
        expect(evaluarAlineamientoRaza(tendencia, 'Legal bueno')?.severidad).toBe('soft');
    });

    it('una preferencia que prohíbe también cuenta («Nunca caótico»), y su nombre no decide nada', () => {
        const nunca = alineamiento([0, 'No aplica'], [-1, true, 3, 'Nunca caótico'], [-1, false, 3, 'Siempre maligno'], 3);
        expect(evaluarAlineamientoRaza(nunca, 'Caótico maligno')).toEqual({ severidad: 'hard', requerido: 'Nunca caótico, Siempre maligno', prioridad: 3 });
        expect(evaluarAlineamientoRaza(nunca, 'Legal maligno')).toBeNull();
        // Sin el dato (una caché de antes), el nombre no basta: no pide nada.
        const sinDato = { Basico: { Id_basico: 0 }, Ley: { Nombre: 'Siempre legal' }, Moral: { Nombre: 'No aplica' }, Prioridad: { Id_prioridad: 3 } };
        expect(evaluarAlineamientoRaza(sinDato as any, 'Caótico maligno')).toBeNull();
    });

    it('lo que exige, para la frase', () => {
        expect(textoExigenciaAlineamiento(alineamiento([0, 'No aplica'], [1, false, 3, 'Siempre legal'], [1, false, 3, 'Siempre bueno'], 3))).toBe('Legal bueno');
        expect(textoExigenciaAlineamiento(alineamiento([4, 'Neutral bueno'], NADA, NADA, 2))).toBe('Neutral bueno');
        expect(textoExigenciaAlineamiento(alineamiento([0, 'No aplica'], NADA, NADA, 0))).toBe('No aplica');
    });

    it('sin alineamiento del personaje o de la raza, nada', () => {
        expect(evaluarAlineamientoRaza(null, 'Legal bueno')).toBeNull();
        expect(evaluarAlineamientoRaza(alineamiento([1, 'Legal bueno'], NADA, NADA, 3), '')).toBeNull();
    });
});
