import { MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { razonesAlineamientoMascota, textoDelAjuste } from './nivel-clase-monstruo';

// El alineamiento que pide la mascota (contrato: personajes.md, «La mascota y el alineamiento»): los de su criatura o, sin
// ellos, las preferencias estrictas de su fila, por su dato, como la API (`utils/mascota_alineamiento.incumple`).
describe('razonesAlineamientoMascota', () => {
    const fila = (moral: Record<string, any>, legal: Record<string, any> = { Id: 0, Nombre: 'Ninguna preferencia' }): MonstruoNivelClase =>
        ({ Clase: { Id: 5, Nombre: 'Druida' }, Nivel: 3, Preferencia_legal: legal, Preferencia_moral: moral } as any);
    const NO_BUENO = { Id: 99, Nombre: 'Nunca bueno', Valor: 1, Prohibe: true, Id_prioridad: 3 };

    it('la preferencia estricta de su fila, por su valor: Compañero sabandija pide un amo no bueno', () => {
        expect(razonesAlineamientoMascota([], [fila(NO_BUENO)], 'Neutral bueno', 'compañero').length).toBe(1);
        expect(razonesAlineamientoMascota([], [fila(NO_BUENO)], 'Neutral autentico', 'compañero')).toEqual([]);
        expect(razonesAlineamientoMascota([], [fila(NO_BUENO)], 'Caotico maligno', 'compañero')).toEqual([]);
    });

    it('sin el dato de la preferencia (una caché de antes) no exige nada: ya no se juzga por su id', () => {
        expect(razonesAlineamientoMascota([], [fila({ Id: 4, Nombre: 'Siempre Bueno' })], 'Caotico maligno', 'compañero')).toEqual([]);
    });

    it('el motivo nombra solo las preferencias estrictas de su fila', () => {
        const [motivo] = razonesAlineamientoMascota([], [fila(NO_BUENO, { Id: 3, Nombre: 'Normalmente legal', Valor: 1, Prohibe: false, Id_prioridad: 2 })],
            'Neutral bueno', 'compañero');
        expect(motivo).toContain('moral: Nunca bueno');
        expect(motivo).not.toContain('Normalmente legal');
    });

    it('una preferencia que no es estricta (prioridad 2) no cuenta', () => {
        expect(razonesAlineamientoMascota([], [fila({ ...NO_BUENO, Id_prioridad: 2 })], 'Neutral bueno', 'compañero')).toEqual([]);
    });

    it('los alineamientos que pide su criatura mandan sobre los de su fila', () => {
        const requeridos = [{ Id: 5, Nombre: 'Neutral autentico' }];
        expect(razonesAlineamientoMascota(requeridos, [fila(NO_BUENO)], 'Neutral autentico', 'familiar')).toEqual([]);
        expect(razonesAlineamientoMascota(requeridos, [fila(NO_BUENO)], 'Caotico maligno', 'familiar').length).toBe(1);
    });
});

// El ajuste de una fila (o de su lista), como lo enseñan el detalle del monstruo, el selector del compañero y el formulario.
describe('textoDelAjuste', () => {
    it('con signo, el menos tipográfico, y vacío si no ajusta o no hay número', () => {
        expect(textoDelAjuste(-3)).toBe('−3');
        expect(textoDelAjuste(3)).toBe('+3');
        expect(textoDelAjuste(0)).toBe('');
        expect(textoDelAjuste(undefined)).toBe('');
        expect(textoDelAjuste('x')).toBe('');
    });
});
