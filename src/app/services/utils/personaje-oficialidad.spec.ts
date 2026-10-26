import { motivosHomebrewPersonaje } from './personaje-oficialidad';

describe('personaje-oficialidad (decisión del 2026-10-17)', () => {
    const personajeOficial: any = {
        DotesContextuales: [{ Dote: { Id: 4, Nombre: 'Soltura con un arma', Oficial: true }, Contexto: {} }],
        Raciales: [{ Nombre: 'Visión en la oscuridad', Oficial: true }],
        Idiomas: [{ Nombre: 'Común', Oficial: true }],
        Familiares: [],
        Companeros: [],
    };

    it('sin nada homebrew no hay motivos', () => {
        expect(motivosHomebrewPersonaje(personajeOficial, { raza: { Nombre: 'Humano', Oficial: true } })).toEqual([]);
    });

    it('un humano que elige el idioma Vrykul (homebrew) es homebrew', () => {
        const personaje = { ...personajeOficial, Idiomas: [...personajeOficial.Idiomas, { Nombre: 'Vrykul', Oficial: false }] };

        expect(motivosHomebrewPersonaje(personaje, { raza: { Nombre: 'Humano', Oficial: true } })).toEqual(['Idioma homebrew: Vrykul']);
    });

    it('cuentan las plantillas, las dotes, los raciales, el familiar, la raza base y las ventajas', () => {
        const personaje = {
            ...personajeOficial,
            DotesContextuales: [{ Dote: { Nombre: 'Dote de la casa', Oficial: false }, Contexto: {} }],
            Raciales: [{ Nombre: 'Racial de la casa', Oficial: false }],
            Familiares: [{ Nombre: 'Gato de la casa', Oficial: false }],
        };

        const motivos = motivosHomebrewPersonaje(personaje, {
            razaBase: { Nombre: 'Elfo de la casa', Oficial: false },
            plantillas: [{ Nombre: 'Plantilla de la casa', Oficial: false }],
            tieneVentajas: true,
        });

        expect(motivos).toEqual([
            'Raza base homebrew: Elfo de la casa',
            'Plantilla homebrew: Plantilla de la casa',
            'Dote homebrew: Dote de la casa',
            'Racial homebrew: Racial de la casa',
            'Familiar homebrew: Gato de la casa',
            'Ventajas y desventajas (homebrew)',
        ]);
    });
});
