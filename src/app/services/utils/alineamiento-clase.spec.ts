import { Clase } from 'src/app/interfaces/clase';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { evaluarAlineamientoClase } from './alineamiento-clase';

/*
 * El alineamiento de una clase ya tomada, solo él (fase 6 de las sesiones): de los datos de la clase (su básico, sus
 * preferencias con su prioridad, sus prerrequisitos de alineamiento y la regla de la deidad), nunca de su nombre.
 */
describe('evaluarAlineamientoClase (el alineamiento de una clase, de sus datos)', () => {
    /** Una preferencia con su dato: `[valor, prohíbe, prioridad]` (el nombre no decide nada). */
    type Pref = [number, boolean, number];
    const pref = (p?: Pref) => p ? { Valor: p[0], Prohibe: p[1], Id_prioridad: p[2] } : { Valor: null, Prohibe: false, Id_prioridad: 0 };

    function clase(datos: { basico?: number; ley?: Pref; moral?: Pref; prioridad?: number; deidad?: boolean; prer?: Record<string, unknown[]>; }): Clase {
        const prer = datos.prer ?? {};
        return {
            Id: 1, Nombre: 'Una clase cualquiera',
            Alineamiento: {
                Id: 1, Basico: { Id_basico: datos.basico ?? 0, Nombre: '' }, Ley: { Id_ley: 0, Nombre: '', ...pref(datos.ley) },
                Moral: { Id_moral: 0, Nombre: '', ...pref(datos.moral) }, Prioridad: { Id_prioridad: datos.prioridad ?? 0, Nombre: '' },
                Descripcion: '',
            },
            Alineamiento_deidad: datos.deidad ?? false,
            Prerrequisitos_flags: Object.fromEntries(Object.keys(prer).map((k) => [k, true])),
            Prerrequisitos: prer,
        } as unknown as Clase;
    }

    it('un básico exigido (el paladín, legal bueno «siempre»): otro alineamiento lo incumple y vuelve homebrew', () => {
        const paladin = clase({ basico: 1, prioridad: 3 });
        expect(evaluarAlineamientoClase(paladin, { alineamiento: 'Legal bueno' }).incumple).toEqual([]);
        const ex = evaluarAlineamientoClase(paladin, { alineamiento: 'Neutral bueno' });
        expect(ex.incumple).toEqual(['Requiere legal bueno']);
        expect(ex.estricta).toBeTrue();
    });

    it('una preferencia que prohíbe («Nunca legal», el bárbaro) y una que exige («Siempre maligno»)', () => {
        const barbaro = clase({ ley: [1, true, 3], prioridad: 3 }); // «Nunca legal»
        expect(evaluarAlineamientoClase(barbaro, { alineamiento: 'Caótico bueno' }).incumple).toEqual([]);
        expect(evaluarAlineamientoClase(barbaro, { alineamiento: 'Legal neutral' }).incumple).toEqual(['Prohíbe legal']);
        expect(evaluarAlineamientoClase(clase({ moral: [-1, false, 3], prioridad: 3 }), { alineamiento: 'Neutral auténtico' }).incumple)
            .toEqual(['Requiere maligno']);
    });

    it('la prioridad la dice el dato: «casi siempre» (2) se avisa sin volver homebrew', () => {
        const r = evaluarAlineamientoClase(clase({ ley: [-1, false, 2], prioridad: 2 }), { alineamiento: 'Legal bueno' });
        expect(r.incumple).toEqual(['Requiere caótico']);
        expect(r.estricta).toBeFalse();
    });

    it('sus prerrequisitos de alineamiento (el druida, uno neutral): cuentan como «siempre», salvo si se piden aparte', () => {
        const neutrales = [2, 4, 5, 6, 8].map((id) => ({ Id_alineamiento_basico: id, Opcional: 1 }));
        const druida = clase({ prer: { alineamiento_requerido: neutrales } });
        expect(evaluarAlineamientoClase(druida, { alineamiento: 'Neutral bueno' }).incumple).toEqual([]);
        const legalBueno = evaluarAlineamientoClase(druida, { alineamiento: 'Legal bueno' });
        expect(legalBueno.incumple.length).toBe(1);
        expect(legalBueno.estricta).toBeTrue();
        expect(evaluarAlineamientoClase(druida, { alineamiento: 'Legal bueno', conPrerrequisitos: false }).incumple).toEqual([]);
    });

    it('la regla de la deidad (`Alineamiento_deidad`, el clérigo): a un paso de su deidad', () => {
        const clerigo = clase({ deidad: true });
        const deidad = { Id: 4, Nombre: 'Heironeous', Alineamiento: { Id_basico: 1, Nombre: 'Legal bueno' }, Alineamientos_devotos: [] } as unknown as DeidadDetalle;
        expect(evaluarAlineamientoClase(clerigo, { alineamiento: 'Neutral bueno', deidad }).incumple).toEqual([]);
        const lejos = evaluarAlineamientoClase(clerigo, { alineamiento: 'Caótico neutral', deidad });
        expect(lejos.incumple[0]).toContain('a un paso del alineamiento de Heironeous');
        expect(lejos.estricta).toBeTrue();
        expect(evaluarAlineamientoClase(clerigo, { alineamiento: 'Caótico neutral', deidad: null }).incumple).toEqual([]);
    });

    it('sin restricción, nada; sin alineamiento interpretable, nada que se pueda comprobar', () => {
        expect(evaluarAlineamientoClase(clase({}), { alineamiento: 'Legal maligno' })).toEqual(jasmine.objectContaining({ incumple: [], restringe: false }));
        expect(evaluarAlineamientoClase(clase({ ley: [1, true, 3], prioridad: 3 }), { alineamiento: '' }).sinComprobar.length).toBe(1);
    });

    it('el cruzado divino: el mismo alineamiento que su deidad (Alineamiento_deidad_igual), estricto, y sin deidad no vale', () => {
        const cruzado = { ...clase({ deidad: true }), Alineamiento_deidad_igual: true } as Clase;
        const heironeous = { Nombre: 'Heironeous', Alineamiento: { Id: 1, Id_basico: 1, Nombre: 'Legal bueno' } } as DeidadDetalle;
        expect(evaluarAlineamientoClase(cruzado, { alineamiento: 'Legal bueno', deidad: heironeous }).incumple).toEqual([]);
        const neutral = evaluarAlineamientoClase(cruzado, { alineamiento: 'Legal neutral', deidad: heironeous });
        expect(neutral.incumple).toEqual(['Debe tener el mismo alineamiento que Heironeous (legal bueno)']);
        expect(neutral.estricta).toBeTrue();
        expect(evaluarAlineamientoClase(cruzado, { alineamiento: 'Legal bueno', deidad: null }).incumple).toEqual(['Debe tener una deidad']);
        // El clérigo, a un paso.
        expect(evaluarAlineamientoClase(clase({ deidad: true }), { alineamiento: 'Legal neutral', deidad: heironeous }).incumple).toEqual([]);
    });
});
