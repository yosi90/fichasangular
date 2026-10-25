import {
    agruparPrerrequisitos,
    destinoPrerrequisito,
    frasePrerrequisito,
    nombreTipoPrerrequisito,
    razonNoCumple,
    registrarTiposPrerrequisito,
} from './prerrequisito-frase';

describe('prerrequisito-frase', () => {
    it('la frase es la de la API; sin ella, el nombre del tipo', () => {
        expect(frasePrerrequisito('lanzador_divino', { Nivel: 3, Frase: 'Lanzador divino de nivel 3' })).toBe('Lanzador divino de nivel 3');
        expect(frasePrerrequisito('tamano_minimo', { Id_tamano: 6 })).toBe('Tamano minimo');
    });

    it('el nombre del tipo es el de GET /prerrequisitos/tipos cuando ha respondido', () => {
        expect(nombreTipoPrerrequisito('lanzador_arcano')).toBe('Lanzador arcano');
        registrarTiposPrerrequisito([{ Clave: 'lanzador_arcano', Nombre: 'Nivel de lanzador arcano', Ejemplo: 'Lanzador arcano de nivel 5', Entidades: ['dote', 'clase'] }]);
        expect(nombreTipoPrerrequisito('lanzador_arcano')).toBe('Nivel de lanzador arcano');
    });

    it('agrupa los obligatorios y cada grupo de alternativas, en el orden de los tipos', () => {
        const grupos = agruparPrerrequisitos({
            caracteristica: [
                { Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 2, Frase: 'Fuerza 13' },
                { Caracteristica: 'Destreza', Cantidad: 13, Opcional: 2, Frase: 'Destreza 13' },
            ],
            ataque_base: [{ Ataque_base: 1, Opcional: 0, Frase: 'Ataque base +1' }],
            raza: [{ Id_raza: 2, Raza: 'Elfo', Frase: 'Elfo' }],
            lanzador_arcano: [{ Nivel: 1, Opcional: 1, Frase: 'Lanzador arcano de nivel 1' }],
            lanzador_divino: [{ Nivel: 1, Opcional: 1, Frase: 'Lanzador divino de nivel 1' }],
            inherente: [{ Opcional: 0, Frase: 'Tener alas' }],
        }, ['inherente']);

        expect(grupos.map((grupo) => grupo.titulo)).toEqual(['Obligatorios', 'Elección A', 'Elección B']);
        expect(grupos[0].condiciones.map((c) => c.frase)).toEqual(['Ataque base +1', 'Elfo']);
        expect(grupos[1].condiciones.map((c) => c.frase)).toEqual(['Lanzador arcano de nivel 1', 'Lanzador divino de nivel 1']);
        expect(grupos[2].condiciones.map((c) => c.frase)).toEqual(['Fuerza 13', 'Destreza 13']);
        expect(grupos[1].descripcion).toBe('Basta con una de estas opciones');
    });

    it('lee el opcional en minúscula de las razas (`pr`)', () => {
        const grupos = agruparPrerrequisitos({
            tipo_criatura: [{ id_tipo_criatura: 11, opcional: 1, Frase: 'Criatura de tipo humanoide' }],
        });
        expect(grupos[0].opcional).toBeTrue();
    });

    it('sin prerrequisitos no hay grupos', () => {
        expect(agruparPrerrequisitos(null)).toEqual([]);
        expect(agruparPrerrequisitos({ dote: [], raza: [] })).toEqual([]);
    });

    it('«No cumple» con la frase o las alternativas, sin repetir', () => {
        expect(razonNoCumple(['Fuerza 13'])).toBe('No cumple: Fuerza 13');
        expect(razonNoCumple(['Elfo', 'Semielfo', 'Elfo'])).toBe('No cumple: Elfo o Semielfo');
    });

    it('lleva al detalle de la competencia o de la raza que pide', () => {
        expect(destinoPrerrequisito({ clave: 'competencia_arma', item: { Id_arma: 7 }, frase: '' })).toEqual({ entidad: 'arma', id: 7 });
        expect(destinoPrerrequisito({ clave: 'competencia_armadura', item: { Id_armadura: 3 }, frase: '' })).toEqual({ entidad: 'armadura', id: 3 });
        expect(destinoPrerrequisito({ clave: 'raza', item: { Id_raza: 2 }, frase: '' })).toEqual({ entidad: 'raza', id: 2 });
        expect(destinoPrerrequisito({ clave: 'competencia_arma', item: { Id_arma: 0, Arma_comodin: 'elegir' }, frase: '' })).toBeNull();
        expect(destinoPrerrequisito({ clave: 'caracteristica', item: { Id_caracteristica: 1 }, frase: '' })).toBeNull();
    });
});
