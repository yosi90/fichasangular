import { normalizeIdiomasRaza } from './raza.service';

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
});
