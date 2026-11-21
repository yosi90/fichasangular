import { PersonajeCreateCompaneroDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { filasDeLasMascotas, NombresDeLaMascota } from './mascota-al-dia';

// «Lo que cambia» del compañero en las vías de la sesión (contrato: `SESIONES_FRONT.md`, «Los trucos del compañero»): sus
// dotes elegidas, sus mejoras y sus trucos adicionales, además de sus valores.
describe('filasDeLasMascotas: lo que elige el compañero', () => {
    const NOMBRES: NombresDeLaMascota = {
        dote: (id) => ({ 15: 'Aguante', 72: 'Soltura con un arma' } as Record<number, string>)[id] ?? `dote ${id}`,
        truco: (id) => ({ 1: 'Ataca', 2: 'Busca' } as Record<number, string>)[id] ?? `truco ${id}`,
    };

    const companero = (cambios: Partial<PersonajeCreateCompaneroDto> = {}): PersonajeCreateCompaneroDto => ({
        nombre: 'Gruk', idMonstruo: 7, idPlantilla: 0, vida: 52, dgAdi: 2, armaduraNatural: 6, fuerza: 23, destreza: 11, inteligencia: 2,
        trucosAdi: 2, habilidades: [], especiales: [], dotes: [{ idDote: 15, idExtra: 0 }], ...cambios,
    } as PersonajeCreateCompaneroDto);
    const conCompanero = (c: PersonajeCreateCompaneroDto) => ({ companero: c } as PersonajeCreateRequestDto);

    it('las dotes elegidas con su DG, las mejoras y los trucos adicionales que gana: una fila por cada una', () => {
        const antes = companero({ trucos: [{ idTruco: 1, origen: 'adicional', orden: 1 }] });
        const despues = companero({
            dotes: [{ idDote: 15, idExtra: 0 }, { idDote: 72, idExtra: 3, dg: 6 }],
            mejoras: [{ dg: 4, idCaracteristica: 1 }],
            trucos: [{ idTruco: 1, origen: 'adicional', orden: 1 }, { idTruco: 2, origen: 'adicional', orden: 2 }],
        });
        expect(filasDeLasMascotas(conCompanero(antes), conCompanero(despues), {}, NOMBRES)).toEqual([
            { que: 'Compañero animal (Gruk): dotes elegidas', antes: 'Ninguna', ahora: 'Soltura con un arma (DG 6)' },
            { que: 'Compañero animal (Gruk): mejoras de característica', antes: 'Ninguna', ahora: '+1 FUE (DG 4)' },
            { que: 'Compañero animal (Gruk): trucos adicionales', antes: 'Ataca', ahora: 'Ataca, Busca' },
        ]);
    });

    it('lo que pierde al perder un nivel; sin cambios, nada; inactivo, solo su fila', () => {
        const con = companero({ dotes: [{ idDote: 72, idExtra: 3, dg: 6 }], trucos: [{ idTruco: 2, origen: 'adicional', orden: 1 }] });
        const sin = companero({ dotes: [], trucos: [] });
        expect(filasDeLasMascotas(conCompanero(con), conCompanero(sin), {}, NOMBRES).map((f) => [f.que, f.ahora])).toEqual([
            ['Compañero animal (Gruk): dotes elegidas', 'Ninguna'],
            ['Compañero animal (Gruk): trucos adicionales', 'Ninguna'],
        ]);
        expect(filasDeLasMascotas(conCompanero(con), conCompanero(con), {}, NOMBRES)).toEqual([]);
        const inactivo = companero({ dgAdi: 0, trucosAdi: 0, dotes: [], trucos: [], inactiva: true });
        expect(filasDeLasMascotas(conCompanero(con), conCompanero(inactivo), {}, NOMBRES).map((f) => f.que)).toEqual(['Compañero animal (Gruk)']);
    });

    it('sin nombres, el id', () => {
        const despues = companero({ trucos: [{ idTruco: 9, origen: 'adicional', orden: 1 }] });
        expect(filasDeLasMascotas(conCompanero(companero()), conCompanero(despues), {})[0].ahora).toBe('truco 9');
    });
});
