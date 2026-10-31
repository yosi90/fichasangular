import { motivoHomebrew, motivosHomebrewPersonaje, motivosQueConfirmar } from './personaje-oficialidad';

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

    it('cuentan los conjuros (también los de la sesión abierta) y la escuela de especialista homebrew', () => {
        const personaje = { ...personajeOficial, Conjuros: [{ Nombre: 'Rayo arcano', Oficial: true }, { Nombre: 'Engranaje animado', Oficial: false }] };
        expect(motivosHomebrewPersonaje(personaje, {
            escuelaEspecialista: { Nombre: 'Ingeniería mágica', Oficial: false },
            conjurosEnSesion: [{ Nombre: 'Vapor cegador', Oficial: false }],
        })).toEqual([
            'Conjuro homebrew: Engranaje animado',
            'Conjuro homebrew: Vapor cegador',
            'Escuela de especialista homebrew: Ingeniería mágica',
        ]);
        expect(motivosHomebrewPersonaje(personajeOficial, { escuelaEspecialista: { Nombre: 'Evocación', Oficial: true } })).toEqual([]);
    });

    it('motivosQueConfirmar: no pregunta si ya es homebrew ni sin motivos; sin repetidos', () => {
        expect(motivosQueConfirmar(['Clase homebrew: X', 'Clase homebrew: X', '', null], false)).toEqual(['Clase homebrew: X']);
        expect(motivosQueConfirmar(['Clase homebrew: X'], true)).toEqual([]);
        expect(motivosQueConfirmar([null, undefined], false)).toEqual([]);
        expect(motivoHomebrew('Clase', { Nombre: 'Magiingeniero', Oficial: false })).toBe('Clase homebrew: Magiingeniero');
        expect(motivoHomebrew('Clase', { Nombre: 'Mago', Oficial: true })).toBeNull();
        expect(motivoHomebrew('Clase', null)).toBeNull();
    });
});
