import {
    FAMILIAS_HOMEBREW,
    elementosHomebrewPersonaje,
    fuentesHomebrewDeCampana,
    motivoHomebrew,
    motivosHomebrewPersonaje,
    motivosQueConfirmar,
} from './personaje-oficialidad';

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

    it('cuentan también los subtipos, las aptitudes sortílegas y las fusiones (como la API)', () => {
        const personaje = { ...personajeOficial, Sortilegas: [{ Conjuro: { Id: 9, Nombre: 'Luz de la casa', Oficial: false } }] };
        expect(motivosHomebrewPersonaje(personaje, {
            subtipos: [{ Id: 3, Nombre: 'Subtipo de la casa', Oficial: false }],
            fusiones: [{ Id: 4, Nombre: 'Fusión de la casa', Oficial: false }],
        })).toEqual([
            'Subtipo homebrew: Subtipo de la casa',
            'Conjuro homebrew: Luz de la casa',
            'Fusión homebrew: Fusión de la casa',
        ]);
    });

    describe('fuentes homebrew de la campaña', () => {
        const casa = { Id: 9, Nombre: 'Manual de la casa', Pagina: 1 };

        it('los idiomas vuelven homebrew la ficha pero no son fuente de la campaña', () => {
            const personaje = { ...personajeOficial, Idiomas: [{ Id: 5, Nombre: 'Vrykul', Oficial: false }] };
            const elementos = elementosHomebrewPersonaje(personaje, {});
            expect(elementos.map((e) => e.familia)).toEqual(['idioma']);
            expect(fuentesHomebrewDeCampana(elementos)).toEqual([]);
            expect(FAMILIAS_HOMEBREW.idioma.fuenteDeCampana).toBeFalse();
        });

        it('una fuente es el manual de sus elementos o, sin manual, el propio elemento', () => {
            const personaje = {
                ...personajeOficial,
                DotesContextuales: [{ Dote: { Id: 1, Nombre: 'Dote de la casa', Oficial: false, Manual: casa }, Contexto: {} }],
                Raciales: [{ Id: 2, Nombre: 'Racial de la casa', Oficial: false, Manual: casa }],
                Conjuros: [{ Id: 3, Nombre: 'Rayo de la casa', Oficial: false, Manual: 'Manual de la casa' }],
            };
            const fuentes = fuentesHomebrewDeCampana(elementosHomebrewPersonaje(personaje, {
                clases: [{ Id: 4, Nombre: 'Clase de la casa', Oficial: false, Manual: casa }],
            }));
            expect(fuentes.map((f) => [f.key, f.nombre])).toEqual([
                ['manual:manual de la casa', 'Manual de la casa (Clase: Clase de la casa, Dote: Dote de la casa, Conjuro: Rayo de la casa)'],
                // Los raciales no tienen manual en la API: cada uno es su fuente.
                ['raciales:2', 'Racial: Racial de la casa'],
            ]);
        });

        it('la raza y la raza base son la misma tabla; la escuela fija de una clase homebrew ya la trae la clase', () => {
            const raza = { Id: 7, Nombre: 'Elfo de la casa', Oficial: false };
            const escuela = { Id: 12, Nombre: 'Ingeniería mágica', Oficial: false };
            const clase = { Id: 8, Nombre: 'Magiingeniero', Oficial: false, Conjuros: { Escuela_especialista: { Id: 12 } } };
            expect(fuentesHomebrewDeCampana(elementosHomebrewPersonaje(personajeOficial, { raza, razaBase: raza })).length).toBe(1);
            expect(fuentesHomebrewDeCampana(elementosHomebrewPersonaje(personajeOficial, { escuelaEspecialista: escuela, clases: [clase] }))
                .map((f) => f.nombre)).toEqual(['Clase: Magiingeniero']);
            expect(fuentesHomebrewDeCampana(elementosHomebrewPersonaje(personajeOficial, { escuelaEspecialista: escuela }))
                .map((f) => f.key)).toEqual(['escuelas_conjuros:12']);
        });
    });
});
