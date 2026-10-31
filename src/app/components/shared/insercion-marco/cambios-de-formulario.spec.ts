import { CamposDeFormulario } from './errores-de-formulario';
import { cambiosEntreCuerpos, enOrdenDeCampos, etiquetaDeCampo, notaDeCambios, pasosConCambios } from './cambios-de-formulario';

const CAMPOS: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    dotes: { etiqueta: 'Dotes', paso: 2 },
};

describe('cambios-de-formulario (lo cambiado al modificar una entrada campo a campo)', () => {
    const cuerpo = (nombre: string, dotes: { id: number; }[]) => ({ entrada: { nombre, pagina: 3 }, dotes });

    it('compara los escalares por su clave y las listas sin depender del orden de sus filas', () => {
        const antes = cuerpo('Gato', [{ id: 1 }, { id: 2 }]);
        expect(cambiosEntreCuerpos(antes, cuerpo('Gato', [{ id: 2 }, { id: 1 }]), 'entrada', ['dotes']).size).toBe(0);
        const cambiados = cambiosEntreCuerpos(antes, cuerpo('Lince', [{ id: 1 }]), 'entrada', ['dotes']);
        expect(enOrdenDeCampos(cambiados, CAMPOS)).toEqual(['nombre', 'dotes']);
    });

    it('da los pasos, la nota del pie y la etiqueta de lo cambiado', () => {
        expect(pasosConCambios(['nombre', 'pagina', 'dotes'], CAMPOS)).toEqual([0, 2]);
        expect(notaDeCambios([], CAMPOS)).toBe('Sin cambios todavía.');
        expect(notaDeCambios(['dotes'], CAMPOS)).toBe('1 cambio: Dotes');
        expect(notaDeCambios(['nombre', 'dotes'], CAMPOS)).toBe('2 cambios: Nombre, Dotes');
        expect(etiquetaDeCampo(CAMPOS, 'nombre', true)).toBe('Nombre · cambiado');
        expect(etiquetaDeCampo(CAMPOS, 'pagina', false)).toBe('Página');
    });
});
