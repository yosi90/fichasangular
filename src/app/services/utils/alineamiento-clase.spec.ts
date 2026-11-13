import { Clase } from 'src/app/interfaces/clase';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { evaluarAlineamientoClase } from './alineamiento-clase';

/*
 * El alineamiento de una clase ya tomada, solo él (fase 6 de las sesiones): de los datos de la clase (su básico, sus
 * preferencias con su prioridad, sus prerrequisitos de alineamiento y la regla de la deidad), nunca de su nombre.
 */
describe('evaluarAlineamientoClase (el alineamiento de una clase, de sus datos)', () => {
    function clase(datos: { basico?: number; ley?: string; moral?: string; prioridad?: number; deidad?: boolean; prer?: Record<string, unknown[]>; }): Clase {
        const prer = datos.prer ?? {};
        return {
            Id: 1, Nombre: 'Una clase cualquiera',
            Alineamiento: {
                Id: 1, Basico: { Id_basico: datos.basico ?? 0, Nombre: '' }, Ley: { Id_ley: 0, Nombre: datos.ley ?? 'Ninguna preferencia' },
                Moral: { Id_moral: 0, Nombre: datos.moral ?? 'Ninguna preferencia' }, Prioridad: { Id_prioridad: datos.prioridad ?? 0, Nombre: '' },
                Descripcion: '',
            },
            Alineamiento_deidad: datos.deidad ?? false,
            Prerrequisitos_flags: Object.fromEntries(Object.keys(prer).map((k) => [k, true])),
            Prerrequisitos: prer,
        } as unknown as Clase;
    }

    it('un básico exigido (el paladín, legal bueno «siempre»): otro alineamiento lo incumple y vuelve homebrew', () => {
        const paladin = clase({ basico: 1, ley: 'No aplica', moral: 'No aplica', prioridad: 3 });
        expect(evaluarAlineamientoClase(paladin, { alineamiento: 'Legal bueno' }).incumple).toEqual([]);
        const ex = evaluarAlineamientoClase(paladin, { alineamiento: 'Neutral bueno' });
        expect(ex.incumple).toEqual(['Requiere legal bueno']);
        expect(ex.estricta).toBeTrue();
    });

    it('una preferencia que prohíbe («Nunca legal», el bárbaro) y una que exige («Siempre maligno»)', () => {
        const barbaro = clase({ ley: 'Nunca Legal', prioridad: 3 });
        expect(evaluarAlineamientoClase(barbaro, { alineamiento: 'Caótico bueno' }).incumple).toEqual([]);
        expect(evaluarAlineamientoClase(barbaro, { alineamiento: 'Legal neutral' }).incumple).toEqual(['Prohíbe legal']);
        expect(evaluarAlineamientoClase(clase({ moral: 'Siempre Maligno', prioridad: 3 }), { alineamiento: 'Neutral auténtico' }).incumple)
            .toEqual(['Requiere maligno']);
    });

    it('la prioridad la dice el dato: «casi siempre» (2) se avisa sin volver homebrew', () => {
        const r = evaluarAlineamientoClase(clase({ ley: 'Casi siempre Caótico', prioridad: 2 }), { alineamiento: 'Legal bueno' });
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
        expect(evaluarAlineamientoClase(clase({ ley: 'Nunca Legal', prioridad: 3 }), { alineamiento: '' }).sinComprobar.length).toBe(1);
    });
});
