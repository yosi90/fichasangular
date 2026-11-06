import {
    FAMILIAS_HOMEBREW,
    claveFuenteHomebrewDe,
    elementosHomebrewPersonaje,
    fuentesHomebrewDeCampana,
    motivoHomebrew,
    motivosHomebrewPersonaje,
    motivosQueConfirmar,
    decisionesHomebrewPersonaje,
    motivosHomebrewGuardado,
    normalizarHomebrewGuardado,
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
        expect(motivoHomebrew('clase', { Nombre: 'Magiingeniero', Oficial: false })).toBe('Clase homebrew: Magiingeniero');
        expect(motivoHomebrew('clase', { Nombre: 'Mago', Oficial: true })).toBeNull();
        expect(motivoHomebrew('clase', null)).toBeNull();
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

    it('cuentan los chakras de la formación de Incarnum (desde el hito 8 tienen `Oficial`, como en la API)', () => {
        const chakras = [
            { Id: 3, Nombre: 'Corona', Oficial: true },
            { Id: 12, Nombre: 'Chakra de la casa', Oficial: false },
        ];
        expect(motivosHomebrewPersonaje(personajeOficial, { chakras: [chakras[0]] })).toEqual([]);
        expect(motivosHomebrewPersonaje(personajeOficial, { chakras })).toEqual(['Chakra homebrew: Chakra de la casa']);
        expect(motivoHomebrew('chakra', chakras[1])).toBe('Chakra homebrew: Chakra de la casa');
        // Sin manual en la API: cada chakra es su propia fuente.
        expect(FAMILIAS_HOMEBREW.chakra).toEqual(jasmine.objectContaining({ tablaApi: 'chakras', sinManual: true }));
        expect(fuentesHomebrewDeCampana(elementosHomebrewPersonaje(personajeOficial, { chakras })).map((f) => [f.key, f.nombre]))
            .toEqual([['chakras:12', 'Chakra: Chakra de la casa']]);
    });

    describe('fuentes homebrew de la campaña', () => {
        const casa = { Id: 9, Nombre: 'Manual de la casa', Pagina: 1 };

        it('los idiomas y la deidad son fuentes de la campaña (2026-10-31); la deidad no va en los motivos', () => {
            const personaje = { ...personajeOficial, Idiomas: [{ Id: 5, Nombre: 'Vrykul', Oficial: false }] };
            const contexto = { deidad: { Id: 40, Nombre: 'Diosa de la casa', Oficial: false, Manual: casa } };
            const elementos = elementosHomebrewPersonaje(personaje, contexto);
            expect(elementos.map((e) => e.familia)).toEqual(['deidad', 'idioma']);
            expect(fuentesHomebrewDeCampana(elementos).map((f) => [f.key, f.nombre])).toEqual([
                ['manual:manual de la casa', 'Manual de la casa (Deidad: Diosa de la casa)'],
                ['idiomas:5', 'Idioma: Vrykul'],
            ]);
            // La oficialidad de la deidad va con los datos de Básicos («Deidad no oficial»).
            expect(motivosHomebrewPersonaje(personaje, contexto)).toEqual(['Idioma homebrew: Vrykul']);
            expect(FAMILIAS_HOMEBREW.deidad.oficialidadEnBasicos).toBeTrue();
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

        it('la fuente de un candidato, con la misma clave que las del personaje; ninguna si es oficial', () => {
            expect(claveFuenteHomebrewDe('dote', { Id: 1, Nombre: 'Dote de la casa', Oficial: false, Manual: casa }))
                .toBe('manual:manual de la casa');
            expect(claveFuenteHomebrewDe('idioma', { Id: 28, Nombre: 'Vrykul', Oficial: false, Manual: casa })).toBe('idiomas:28');
            expect(claveFuenteHomebrewDe('deidad', { Id: 19, Nombre: 'Moradin', Oficial: true })).toBeNull();
            expect(claveFuenteHomebrewDe('deidad', null)).toBeNull();
        });
    });
});

describe('decisiones homebrew y motivos de la ficha guardada (decisión del 2026-11-06)', () => {
    it('sin reglas saltadas no hay decisiones', () => {
        expect(decisionesHomebrewPersonaje({ idRaza: 3 })).toEqual([]);
    });

    it('cada regla saltada es una decisión con su elemento, sin repetidas', () => {
        expect(decisionesHomebrewPersonaje({
            idRaza: 3,
            idDeidad: 40,
            alineamientoRaza: true,
            clasesConAlineamientoSaltado: new Set([5, 5]),
            plantillasSinRequisitos: [12],
            edad: 'menor_que_la_inicial',
            idClasePrimerNivel: 5,
            alturaFueraDeRango: true,
            pesoFueraDeRango: true,
        })).toEqual([
            { tipo: 'alineamiento_raza', idElemento: 3 },
            { tipo: 'alineamiento_clase', idElemento: 5 },
            { tipo: 'requisitos_plantilla', idElemento: 12 },
            { tipo: 'edad_menor_que_la_inicial', idElemento: 5 },
            { tipo: 'altura_fuera_de_rango', idElemento: 3 },
            { tipo: 'peso_fuera_de_rango', idElemento: 3 },
        ]);
    });

    it('la edad fuera de la raza va con la raza, y sin elemento no se manda', () => {
        expect(decisionesHomebrewPersonaje({ idRaza: 3, edad: 'menor_que_la_mayoria' })).toEqual([{ tipo: 'edad_menor_que_la_mayoria', idElemento: 3 }]);
        expect(decisionesHomebrewPersonaje({ idRaza: 3, edad: 'mayor_que_la_maxima' })).toEqual([{ tipo: 'edad_mayor_que_la_maxima', idElemento: 3 }]);
        expect(decisionesHomebrewPersonaje({ idRaza: 0, alineamientoDeidad: true, idDeidad: null, alturaFueraDeRango: true })).toEqual([]);
    });

    it('los motivos de la ficha guardada, con sus nombres', () => {
        const homebrew = normalizarHomebrewGuardado({
            componentes: [{ tabla: 'razas', id: 2, nombre: 'Elfo (rol mapa mundi)' }, { tabla: 'armas', id: 30, nombre: 'Espada de vapor' },
                { tabla: 'ventajas', id: 8, nombre: 'Afortunado' }, { tabla: 'razas', id: 'x' }],
            decisiones: [{ tipo: 'alineamiento_clase', tabla: 'clases', id: 5, nombre: 'Druida' }, { tipo: 'desconocida', tabla: null, id: null, nombre: null }],
        });
        expect(homebrew.componentes.length).toBe(3);
        expect(motivosHomebrewGuardado(homebrew)).toEqual([
            'Raza: Elfo (rol mapa mundi)',
            'Arma: Espada de vapor',
            'Ventaja o desventaja: Afortunado',
            'Alineamiento que no admite su clase: Druida',
            'Una regla saltada al crearlo (de antes de guardarse el motivo)',
        ]);
        expect(motivosHomebrewGuardado(normalizarHomebrewGuardado(undefined))).toEqual([]);
    });
});
