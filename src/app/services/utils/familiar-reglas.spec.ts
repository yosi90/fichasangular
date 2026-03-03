import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import {
    construirCatalogoFamiliaresDesdeMonstruos,
    EstadoCuposFamiliar,
    filtrarFamiliaresElegibles,
    resolverEstadoCuposFamiliarEspecial47
} from './familiar-reglas';

function crearClaseConEspeciales(
    id: number,
    nombre: string,
    especialesPorNivel: Record<number, any[]>
): Clase {
    return {
        Id: id,
        Nombre: nombre,
        Desglose_niveles: Object.keys(especialesPorNivel).map((nivelRaw) => ({
            Nivel: Number(nivelRaw),
            Especiales: especialesPorNivel[Number(nivelRaw)] ?? [],
        })),
    } as any;
}

function crearNivelClase(
    idClase: number,
    nivel: number,
    plantilla = 1,
    prefLegal = 5,
    prefMoral = 5
): MonstruoNivelClase {
    return {
        Clase: { Id: idClase, Nombre: `Clase ${idClase}` },
        Nivel: nivel,
        Plantilla: { Id: plantilla, Nombre: `Plantilla ${plantilla}` },
        Preferencia_legal: { Id: prefLegal, Nombre: `${prefLegal}` },
        Preferencia_moral: { Id: prefMoral, Nombre: `${prefMoral}` },
        Dote: { Id: 0, Nombre: '' },
    };
}

function crearFamiliarMock(partial?: Partial<FamiliarMonstruoDetalle>): FamiliarMonstruoDetalle {
    return {
        Id: 100,
        Nombre: 'Familiar mock',
        Oficial: true,
        Id_familiar: 1000,
        Plantilla: { Id: 1, Nombre: 'Basica' },
        Niveles_clase: [crearNivelClase(10, 1, 1, 5, 5)],
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        ...partial,
    } as any;
}

function crearPersonajeMock(partial?: Partial<Personaje>): Personaje {
    return {
        Alineamiento: 'Neutral autentico',
        desgloseClases: [],
        Familiares: [],
        ...partial,
    } as any;
}

describe('familiar-reglas', () => {
    it('calcula fuentes por especial 47 y cupos disponibles sin usar la clase por defecto', () => {
        const personaje = crearPersonajeMock({
            desgloseClases: [
                { Nombre: 'Mago', Nivel: 5 },
                { Nombre: 'Guerrero', Nivel: 3 },
            ],
            Familiares: [crearFamiliarMock({ Id_familiar: 2000 })],
        });

        const clases: Clase[] = [
            crearClaseConEspeciales(10, 'Mago', {
                1: [{ Especial: { Id: 47, Nombre: 'Convocar a un familiar' } }],
                2: [{ Especial: { Id: 999, Nombre: 'Otro especial' } }],
            }),
            crearClaseConEspeciales(11, 'Guerrero', {
                1: [{ Especial: { Id: 5, Nombre: 'Dote adicional' } }],
            }),
        ];

        const estado = resolverEstadoCuposFamiliarEspecial47(personaje, clases);

        expect(estado.fuentesClaseIds).toEqual([10]);
        expect(estado.fuentesTotales).toBe(1);
        expect(estado.nivelLanzadorFamiliar).toBe(5);
        expect(estado.cuposConsumidos).toBe(1);
        expect(estado.cuposDisponibles).toBe(0);
    });

    it('suma nivel lanzador familiar y fuentes cuando hay multiclase con especial 47', () => {
        const personaje = crearPersonajeMock({
            desgloseClases: [
                { Nombre: 'Mago', Nivel: 4 },
                { Nombre: 'Brujo', Nivel: 3 },
            ],
        });
        const clases: Clase[] = [
            crearClaseConEspeciales(10, 'Mago', {
                1: [{ Especial: { Id: 47, Nombre: 'Convocar a un familiar' } }],
            }),
            crearClaseConEspeciales(12, 'Brujo', {
                2: [{ Especial: { Nombre: 'Convocar a un familiar' } }],
            }),
        ];

        const estado = resolverEstadoCuposFamiliarEspecial47(personaje, clases);

        expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([10, 12]);
        expect(estado.fuentesTotales).toBe(2);
        expect(estado.nivelLanzadorFamiliar).toBe(7);
    });

    it('filtra familiares por plantilla, nivel, alineamiento y homebrew', () => {
        const estado: EstadoCuposFamiliar = {
            especialId: 47,
            fuentes: [{ idClase: 10, nombreClase: 'Mago', nivelActual: 5 }],
            fuentesClaseIds: [10],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 5,
        };

        const familiares = [
            crearFamiliarMock({
                Id_familiar: 1,
                Nombre: 'Cuervo',
                Plantilla: { Id: 1, Nombre: 'Basica' },
                Oficial: true,
                Niveles_clase: [crearNivelClase(10, 3, 1, 5, 5)],
            }),
            crearFamiliarMock({
                Id_familiar: 2,
                Nombre: 'Murcielago',
                Plantilla: { Id: 2, Nombre: 'Draconica' },
                Niveles_clase: [crearNivelClase(10, 2, 2, 5, 5)],
            }),
            crearFamiliarMock({
                Id_familiar: 3,
                Nombre: 'Comadreja',
                Plantilla: { Id: 1, Nombre: 'Basica' },
                Niveles_clase: [crearNivelClase(10, 7, 1, 5, 5)],
            }),
            crearFamiliarMock({
                Id_familiar: 4,
                Nombre: 'Rata homebrew',
                Plantilla: { Id: 1, Nombre: 'Basica' },
                Oficial: false,
                Niveles_clase: [crearNivelClase(10, 2, 1, 5, 5)],
            }),
            crearFamiliarMock({
                Id_familiar: 5,
                Nombre: 'Iguana',
                Plantilla: { Id: 1, Nombre: 'Basica' },
                Alineamientos_requeridos: {
                    Familiar: [{ Id: 9, Nombre: 'Caotico maligno' }],
                    Companero: [],
                },
                Niveles_clase: [crearNivelClase(10, 1, 1, 5, 5)],
            }),
        ];

        const filtradosOficial = filtrarFamiliaresElegibles({
            familiares,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 1,
            incluirHomebrew: false,
        });
        const filtradosHomebrew = filtrarFamiliaresElegibles({
            familiares,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 1,
            incluirHomebrew: true,
        });

        expect(filtradosOficial.map((item) => item.Id_familiar)).toEqual([1]);
        expect(filtradosHomebrew.map((item) => item.Id_familiar)).toEqual([1, 4]);
    });

    it('considera elegible nivel 0 en familiar basico (paridad escritorio)', () => {
        const estado: EstadoCuposFamiliar = {
            especialId: 47,
            fuentes: [{ idClase: 10, nombreClase: 'Mago', nivelActual: 1 }],
            fuentesClaseIds: [10],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 1,
        };

        const familiares = [
            crearFamiliarMock({
                Id_familiar: 10,
                Nombre: 'Buho',
                Plantilla: { Id: 1, Nombre: 'Basica' },
                Niveles_clase: [crearNivelClase(10, 0, 1, 10, 10)],
            }),
        ];

        const filtrados = filtrarFamiliaresElegibles({
            familiares,
            estado,
            alineamientoPersonaje: 'Legal bueno',
            plantillaSeleccionada: 1,
            incluirHomebrew: false,
        });

        expect(filtrados.map((item) => item.Nombre)).toEqual(['Buho']);
    });

    it('deduplica por Id_familiar + Plantilla.Id', () => {
        const estado: EstadoCuposFamiliar = {
            especialId: 47,
            fuentes: [{ idClase: 10, nombreClase: 'Mago', nivelActual: 3 }],
            fuentesClaseIds: [10],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 3,
        };

        const repetidoA = crearFamiliarMock({
            Id_familiar: 7,
            Nombre: 'Lagarto',
            Plantilla: { Id: 1, Nombre: 'Basica' },
            Niveles_clase: [crearNivelClase(10, 1, 1, 5, 5)],
        });
        const repetidoB = crearFamiliarMock({
            Id_familiar: 7,
            Nombre: 'Lagarto',
            Plantilla: { Id: 1, Nombre: 'Basica' },
            Niveles_clase: [crearNivelClase(10, 1, 1, 5, 5)],
        });

        const filtrados = filtrarFamiliaresElegibles({
            familiares: [repetidoA, repetidoB],
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 1,
            incluirHomebrew: true,
        });

        expect(filtrados.length).toBe(1);
        expect(filtrados[0].Id_familiar).toBe(7);
    });

    it('construye catálogo desde monstruos marcados como familiar y expande por plantilla', () => {
        const monstruos: any[] = [
            {
                Id: 50,
                Nombre: 'Murciélago',
                Familiar: true,
                Oficial: true,
                Niveles_clase: [
                    crearNivelClase(10, 0, 1, 10, 10),
                    crearNivelClase(10, 3, 3, 10, 4),
                ],
                Alineamientos_requeridos: { Familiar: [], Companero: [] },
            },
            {
                Id: 51,
                Nombre: 'Lobo',
                Familiar: false,
                Oficial: true,
                Niveles_clase: [crearNivelClase(10, 0, 1, 10, 10)],
                Alineamientos_requeridos: { Familiar: [], Companero: [] },
            },
        ];

        const catalogo = construirCatalogoFamiliaresDesdeMonstruos(monstruos as any);
        expect(catalogo.map((item) => `${item.Id_familiar}:${item.Plantilla.Id}`)).toEqual(['50:1', '50:3']);
    });
});
