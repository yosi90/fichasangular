import { normalizeAlineamientoRaza, normalizeHabilidadesRaza, normalizeIdiomasRaza } from './raza.service';

describe('RazaService helpers', () => {
    it('normaliza idiomas con aliases y filtra entradas vacías', () => {
        const idiomas = normalizeIdiomasRaza([
            { Id: 1, Nombre: 'Común', Descripcion: 'Base', Secreto: 0, Oficial: 1 },
            { id: 2, nombre: 'Dracónico', descripcion: 'Anciano', secreto: true, oficial: false },
            { Id: 0, Nombre: '   ' },
        ]);

        expect(idiomas.length).toBe(2);
        expect(idiomas[0]).toEqual({
            Id: 1,
            Nombre: 'Común',
            Descripcion: 'Base',
            Secreto: false,
            Oficial: true,
        });
        expect(idiomas[1]).toEqual({
            Id: 2,
            Nombre: 'Dracónico',
            Descripcion: 'Anciano',
            Secreto: true,
            Oficial: false,
        });
    });

    it('normaliza habilidades de raza con aliases y fallback vacío', () => {
        const habilidades = normalizeHabilidadesRaza({
            b: [
                {
                    Id_habilidad: 4,
                    Habilidad: 'Escuchar',
                    Id_caracteristica: 5,
                    Caracteristica: 'Sabiduria',
                    Soporta_extra: true,
                    Entrenada: true,
                    i_ex: 0,
                    x: 'Elegir',
                    Cantidad: 2,
                    Varios: '+2 racial',
                },
            ],
            c: [
                {
                    id: 99,
                    nombre: 'Conocimiento prohibido',
                    idCaracteristica: 4,
                    caracteristica: 'Inteligencia',
                    rangos: 1,
                },
            ],
        });

        expect(habilidades.Base.length).toBe(1);
        expect(habilidades.Custom.length).toBe(1);
        expect(habilidades.Base[0]).toEqual(jasmine.objectContaining({
            Id_habilidad: 4,
            Habilidad: 'Escuchar',
            Soporta_extra: true,
            Entrenada: true,
            Id_extra: 0,
            Extra: 'Elegir',
            Cantidad: 2,
            Varios: '+2 racial',
        }));
        expect(habilidades.Custom[0]).toEqual(jasmine.objectContaining({
            Id_habilidad: 99,
            Habilidad: 'Conocimiento prohibido',
            Cantidad: 1,
            Custom: true,
        }));

        const vacio = normalizeHabilidadesRaza(undefined);
        expect(vacio).toEqual({
            Base: [],
            Custom: [],
        });
    });

    it('normaliza alineamiento parcial con aliases y evita undefined', () => {
        const alineamiento = normalizeAlineamientoRaza({
            b: { n: 'Legal bueno' },
            l: { Nombre: 'Siempre legal' },
            m: { nombre: 'Generalmente bueno' },
        });

        expect(alineamiento.Basico.Nombre).toBe('Legal bueno');
        expect(alineamiento.Ley.Nombre).toBe('Siempre legal');
        expect(alineamiento.Moral.Nombre).toBe('Generalmente bueno');
        expect(alineamiento.Prioridad).toEqual(jasmine.objectContaining({
            Id_prioridad: 0,
            Nombre: '',
        }));
    });

    it('normaliza alineamiento legacy string como Basico.Nombre', () => {
        const alineamiento = normalizeAlineamientoRaza('Neutral autentico');

        expect(alineamiento.Basico.Nombre).toBe('Neutral autentico');
        expect(alineamiento.Ley.Nombre).toBe('');
        expect(alineamiento.Moral.Nombre).toBe('');
        expect(alineamiento.Descripcion).toBe('');
    });
});
