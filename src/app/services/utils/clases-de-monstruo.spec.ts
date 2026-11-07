import { avisoRazaConClase, claseDeLaRaza, claseObligada, ClaseDeMonstruo, ContextoClasesDeMonstruo, motivoClaseDeMonstruo } from './clases-de-monstruo';

const engendro: ClaseDeMonstruo = {
    Id: 901, Nombre: 'Engendro vampírico', Nivel_max_claseo: 8, Progresion_obligatoria: true,
    Mutacion: { Id: 801, Nombre: 'Engendro vampírico' },
};
const guerrero: ClaseDeMonstruo = { Id: 9, Nombre: 'Guerrero', Nivel_max_claseo: 20, Progresion_obligatoria: false, Mutacion: null };
// Una clase de monstruo de *Especies salvajes*: progresión obligatoria, pero sin mutación (no se elige como raza).
const minotauro: ClaseDeMonstruo = { Id: 950, Nombre: 'Minotauro', Nivel_max_claseo: 8, Progresion_obligatoria: true, Mutacion: null };
const catalogo = [engendro, guerrero, minotauro];

function contexto(idRaza: number, nombreRaza: string, tomadas: Array<[ClaseDeMonstruo, number]>): ContextoClasesDeMonstruo {
    return { idRaza, nombreRaza, catalogo, tomadas: tomadas.map(([clase, nivel]) => ({ clase, nombre: clase.Nombre, nivel })) };
}

describe('clases-de-monstruo (la clase obligada al crear)', () => {
    it('la clase de una raza es la que la tiene como mutación', () => {
        expect(claseDeLaRaza(catalogo, 801)?.Id).toBe(901);
        expect(claseDeLaRaza(catalogo, 1)).toBeNull();
        expect(claseDeLaRaza(catalogo, 0)).toBeNull();
    });

    it('la clase que lleva una mutación solo la toma esa raza', () => {
        expect(motivoClaseDeMonstruo(engendro, contexto(1, 'Humano', [])))
            .toBe('«Engendro vampírico» solo la puede tomar un personaje de la raza «Engendro vampírico».');
        expect(motivoClaseDeMonstruo(guerrero, contexto(1, 'Humano', []))).toBeNull();
    });

    it('la raza de una clase la toma desde el 1.er nivel; después, hasta terminarla', () => {
        expect(claseObligada(contexto(801, 'Engendro vampírico', []))?.motivo)
            .toBe('Un personaje de la raza «Engendro vampírico» empieza con su clase, «Engendro vampírico», desde el 1.er nivel.');
        expect(motivoClaseDeMonstruo(engendro, contexto(801, 'Engendro vampírico', []))).toBeNull();
        expect(motivoClaseDeMonstruo(guerrero, contexto(801, 'Engendro vampírico', [[engendro, 3]])))
            .toBe('Hay que terminar «Engendro vampírico» (8 niveles) antes de tomar otra clase.');
        expect(motivoClaseDeMonstruo(engendro, contexto(801, 'Engendro vampírico', [[engendro, 3]]))).toBeNull();
        expect(claseObligada(contexto(801, 'Engendro vampírico', [[engendro, 8]]))).toBeNull();
        expect(motivoClaseDeMonstruo(guerrero, contexto(801, 'Engendro vampírico', [[engendro, 8]]))).toBeNull();
    });

    it('una progresión obligatoria sin mutación también se termina antes que otra (minotauro 3)', () => {
        expect(motivoClaseDeMonstruo(guerrero, contexto(30, 'Minotauro', [[minotauro, 3]])))
            .toBe('Hay que terminar «Minotauro» (8 niveles) antes de tomar otra clase.');
        expect(motivoClaseDeMonstruo(guerrero, contexto(30, 'Minotauro', [[minotauro, 8]]))).toBeNull();
    });

    it('el aviso de la raza que se mira', () => {
        expect(avisoRazaConClase(engendro)).toBe('Se juega con su clase, «Engendro vampírico»: la toma desde el 1.er nivel y la termina '
            + '(8 niveles) antes de cualquier otra. Una campaña puede no permitir las clases de monstruo.');
        expect(avisoRazaConClase({ ...engendro, Progresion_obligatoria: false }))
            .toBe('Se juega con su clase, «Engendro vampírico»: la toma desde el 1.er nivel. Una campaña puede no permitir las clases de monstruo.');
    });
});
