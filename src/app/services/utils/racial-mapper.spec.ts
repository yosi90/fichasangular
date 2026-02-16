import { createRacialPlaceholder, normalizeRacial, normalizeRaciales } from './racial-mapper';

describe('racial-mapper', () => {
    it('normaliza un racial completo', () => {
        const racial = normalizeRacial({
            Id: 10,
            Nombre: 'Vision en la oscuridad',
            Descripcion: 'Descripcion de prueba',
            Dotes: [{ Id_dote: 5, Dote: 'Alerta', Id_extra: -1, Extra: 'No aplica' }],
            Habilidades: {
                Base: [{ Id_habilidad: 1, Habilidad: 'Avistar' }],
                Custom: [{ Id_habilidad: 2, Habilidad: 'Homebrew' }],
            },
            Caracteristicas: [{ Caracteristica: 'Destreza', Valor: 2 }],
            Salvaciones: [{ Salvacion: 'Reflejos', Valor: 1 }],
            Sortilegas: [{
                Conjuro: { Id: 99, Nombre: 'Luz' },
                Nivel_lanzador: '1',
                Usos_diarios: '3/dia',
            }],
            Ataques: [{ Descripcion: 'Mordisco 1d6' }],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: {
                raza: [{ id_raza: 2, raza: 'Elfo' }],
                caracteristica: [{ id_caracteristica: 2, cantidad: 13 }],
            },
        });

        expect(racial.Id).toBe(10);
        expect(racial.Nombre).toBe('Vision en la oscuridad');
        expect(racial.Dotes.length).toBe(1);
        expect(racial.Habilidades.Base.length).toBe(1);
        expect(racial.Habilidades.Custom.length).toBe(1);
        expect(racial.Sortilegas[0].Conjuro.Id).toBe(99);
        expect(racial.Prerrequisitos_flags.raza).toBeTrue();
        expect(racial.Prerrequisitos_flags.caracteristica_minima).toBeFalse();
    });

    it('completa defaults seguros cuando faltan subcampos', () => {
        const racial = normalizeRacial({
            Nombre: 'Sin detalles',
        });

        expect(racial.Id).toBe(0);
        expect(racial.Nombre).toBe('Sin detalles');
        expect(racial.Descripcion).toBe('');
        expect(racial.Dotes).toEqual([]);
        expect(racial.Habilidades.Base).toEqual([]);
        expect(racial.Habilidades.Custom).toEqual([]);
        expect(racial.Caracteristicas).toEqual([]);
        expect(racial.Salvaciones).toEqual([]);
        expect(racial.Sortilegas).toEqual([]);
        expect(racial.Ataques).toEqual([]);
        expect(racial.Prerrequisitos_flags.raza).toBeFalse();
        expect(racial.Prerrequisitos_flags.caracteristica_minima).toBeFalse();
        expect(racial.Prerrequisitos.raza).toEqual([]);
        expect(racial.Prerrequisitos.caracteristica).toEqual([]);
    });

    it('normaliza colecciones desde arrays y objetos indexados', () => {
        const desdeObjeto = normalizeRaciales({
            a: { Id: 1, Nombre: 'A' },
            b: { Id: 2, Nombre: 'B' },
        });
        const desdeArray = normalizeRaciales([
            { Id: 3, Nombre: 'C' },
            { Id: 4, Nombre: 'D' },
        ]);

        expect(desdeObjeto.map(r => r.Id)).toEqual([1, 2]);
        expect(desdeArray.map(r => r.Id)).toEqual([3, 4]);
    });

    it('genera placeholder valido para raciales parciales', () => {
        const racial = createRacialPlaceholder('Sangre antigua');
        expect(racial.Id).toBe(0);
        expect(racial.Nombre).toBe('Sangre antigua');
        expect(racial.Dotes.length).toBe(0);
        expect(racial.Habilidades.Base.length).toBe(0);
    });
});
