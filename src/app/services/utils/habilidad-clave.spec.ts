import { claveDeHabilidad, claveHabilidad, clavesDeReferenciaGuardada } from './habilidad-clave';

describe('habilidad-clave', () => {
    // Como en `rol_dev`: la personalizada 2 es Autohipnosis y la habilidad 2, Artesanía 1.
    const artesania1 = { Id: 2, Nombre: 'Artesanía 1', Custom: false };
    const autohipnosis = { Id: 2, Nombre: 'Autohipnosis', Custom: true };

    it('distingue una habilidad del catálogo de una personalizada con el mismo id', () => {
        expect(claveHabilidad(artesania1)).not.toBe(claveHabilidad(autohipnosis));
        expect(claveHabilidad(artesania1)).toBe(claveDeHabilidad(2, false));
        expect(claveHabilidad(autohipnosis)).toBe(claveDeHabilidad(2, true));
    });

    it('sin `Custom`, la habilidad es del catálogo', () => {
        expect(claveHabilidad({ Id: 6 })).toBe(claveDeHabilidad(6, false));
        expect(claveDeHabilidad('6', undefined)).toBe(claveDeHabilidad(6, false));
    });

    it('una clave guardada se queda como está', () => {
        expect(clavesDeReferenciaGuardada(claveDeHabilidad(2, true), [artesania1, autohipnosis])).toEqual([claveDeHabilidad(2, true)]);
    });

    it('el id solo de un borrador de antes vale para las habilidades con ese id de los dos catálogos', () => {
        expect(clavesDeReferenciaGuardada('2', [artesania1, autohipnosis, { Id: 6, Custom: false }]))
            .toEqual([claveDeHabilidad(2, false), claveDeHabilidad(2, true)]);
        expect(clavesDeReferenciaGuardada(6, [artesania1])).toEqual([]);
        expect(clavesDeReferenciaGuardada('0', [artesania1])).toEqual([]);
    });
});
