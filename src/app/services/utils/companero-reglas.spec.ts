import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import {
    CompaneroPlantillaSelector,
    EstadoCuposCompanero,
    construirCatalogoCompanerosDesdeMonstruos,
    filtrarCompanerosElegibles,
    resolverEstadoCuposCompaneroEspecial29,
    resolverNivelesCompaneroDisponibles
} from './companero-reglas';

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
    idDote = 0,
    prefLegal = 5,
    prefMoral = 5
): MonstruoNivelClase {
    return {
        Clase: { Id: idClase, Nombre: `Clase ${idClase}` },
        Nivel: nivel,
        Plantilla: { Id: 1, Nombre: 'Base' },
        Preferencia_legal: { Id: prefLegal, Nombre: `${prefLegal}` },
        Preferencia_moral: { Id: prefMoral, Nombre: `${prefMoral}` },
        Dote: { Id: idDote, Nombre: `Dote ${idDote}` },
    };
}

function crearCompaneroMock(partial?: Partial<CompaneroMonstruoDetalle>): CompaneroMonstruoDetalle {
    return {
        Id: 100,
        Nombre: 'Lobo',
        Oficial: true,
        Id_companero: 1000,
        Plantilla: { Id: 1, Nombre: 'Base' },
        Niveles_clase: [crearNivelClase(5, 1, 0, 5, 5)],
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        ...partial,
    } as any;
}

function crearPersonajeMock(partial?: Partial<Personaje>): Personaje {
    return {
        Alineamiento: 'Neutral autentico',
        desgloseClases: [],
        Companeros: [],
        ...partial,
    } as any;
}

describe('companero-reglas', () => {
    it('calcula fuentes por especial 29 y cupos por fuente', () => {
        const personaje = crearPersonajeMock({
            desgloseClases: [
                { Nombre: 'Druida', Nivel: 4 },
                { Nombre: 'Guerrero', Nivel: 3 },
            ],
            Companeros: [crearCompaneroMock({ Id_companero: 9000 })],
        });

        const clases: Clase[] = [
            crearClaseConEspeciales(5, 'Druida', {
                1: [{ Especial: { Id: 29, Nombre: 'Compañero animal' } }],
            }),
            crearClaseConEspeciales(11, 'Guerrero', {
                1: [{ Especial: { Id: 5, Nombre: 'Dote adicional' } }],
            }),
        ];

        const estado = resolverEstadoCuposCompaneroEspecial29(personaje, clases);

        expect(estado.fuentesClaseIds).toEqual([5]);
        expect(estado.fuentesTotales).toBe(1);
        expect(estado.cuposConsumidos).toBe(1);
        expect(estado.cuposDisponibles).toBe(0);
    });

    it('calcula nivel efectivo con paridad ids C# (5 completo, 6 a mitad)', () => {
        const personaje = crearPersonajeMock({
            desgloseClases: [
                { Nombre: 'Druida', Nivel: 5 },
                { Nombre: 'Ranger', Nivel: 5 },
                { Nombre: 'Bestiario', Nivel: 2 },
            ],
        });
        const clases: Clase[] = [
            crearClaseConEspeciales(5, 'Druida', {
                1: [{ Especial: { Id: 29, Nombre: 'Compañero animal' } }],
            }),
            crearClaseConEspeciales(6, 'Ranger', {
                1: [{ Especial: { Nombre: 'Compañero animal' } }],
            }),
            crearClaseConEspeciales(30, 'Bestiario', {
                1: [{ Especial: { Id: 29, Nombre: 'Compañero animal' } }],
            }),
        ];

        const estado = resolverEstadoCuposCompaneroEspecial29(personaje, clases);
        expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([5, 6, 30]);
        expect(estado.nivelEfectivoCompanero).toBe(9); // 5 + floor(5/2) + 2
    });

    it('filtra companeros por plantilla, dote, nivel, alineamiento y homebrew', () => {
        const estado: EstadoCuposCompanero = {
            especialId: 29,
            fuentes: [{ idClase: 5, nombreClase: 'Druida', nivelActual: 6 }],
            fuentesClaseIds: [5],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelEfectivoCompanero: 6,
        };

        const companeros: CompaneroMonstruoDetalle[] = [
            crearCompaneroMock({
                Id_companero: 1,
                Nombre: 'Lobo base',
                Plantilla: { Id: 1, Nombre: 'Base' },
                Niveles_clase: [crearNivelClase(5, 1, 0, 5, 5)],
            }),
            crearCompaneroMock({
                Id_companero: 2,
                Nombre: 'Lobo elevado',
                Plantilla: { Id: 2, Nombre: 'Elevado' },
                Niveles_clase: [crearNivelClase(5, 3, 53, 5, 5)],
            }),
            crearCompaneroMock({
                Id_companero: 3,
                Nombre: 'Arana sabandija',
                Plantilla: { Id: 3, Nombre: 'Sabandija' },
                Niveles_clase: [crearNivelClase(5, 2, 56, 5, 5)],
            }),
            crearCompaneroMock({
                Id_companero: 4,
                Nombre: 'Lobo homebrew',
                Plantilla: { Id: 1, Nombre: 'Base' },
                Oficial: false,
                Niveles_clase: [crearNivelClase(5, 1, 0, 5, 5)],
            }),
            crearCompaneroMock({
                Id_companero: 5,
                Nombre: 'Lobo alineamiento',
                Plantilla: { Id: 1, Nombre: 'Base' },
                Alineamientos_requeridos: {
                    Familiar: [],
                    Companero: [{ Id: 9, Nombre: 'Caotico maligno' }],
                },
                Niveles_clase: [crearNivelClase(5, 1, 0, 5, 5)],
            }),
        ];

        const filtradosBase = filtrarCompanerosElegibles({
            companeros,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 'base',
            incluirHomebrew: false,
            tieneDoteElevado: false,
            tieneDoteSabandija: false,
            nivelSeleccionado: 1,
        });
        const filtradosElevadoSinDote = filtrarCompanerosElegibles({
            companeros,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 'elevado',
            incluirHomebrew: true,
            tieneDoteElevado: false,
            tieneDoteSabandija: false,
            nivelSeleccionado: 3,
        });
        const filtradosElevadoConDote = filtrarCompanerosElegibles({
            companeros,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 'elevado',
            incluirHomebrew: true,
            tieneDoteElevado: true,
            tieneDoteSabandija: false,
            nivelSeleccionado: 3,
        });

        expect(filtradosBase.map((item) => item.Id_companero)).toEqual([1]);
        expect(filtradosElevadoSinDote).toEqual([]);
        expect(filtradosElevadoConDote.map((item) => item.Id_companero)).toEqual([2]);
    });

    it('expone niveles disponibles para la plantilla seleccionada', () => {
        const estado: EstadoCuposCompanero = {
            especialId: 29,
            fuentes: [{ idClase: 5, nombreClase: 'Druida', nivelActual: 6 }],
            fuentesClaseIds: [5],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelEfectivoCompanero: 6,
        };
        const companeros: CompaneroMonstruoDetalle[] = [
            crearCompaneroMock({
                Id_companero: 10,
                Nombre: 'Lobo A',
                Plantilla: { Id: 1, Nombre: 'Base' },
                Niveles_clase: [crearNivelClase(5, 1, 0, 5, 5), crearNivelClase(5, 3, 0, 5, 5)],
            }),
            crearCompaneroMock({
                Id_companero: 11,
                Nombre: 'Lobo B',
                Plantilla: { Id: 1, Nombre: 'Base' },
                Niveles_clase: [crearNivelClase(5, 2, 0, 5, 5)],
            }),
        ];

        const niveles = resolverNivelesCompaneroDisponibles({
            companeros,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 'base',
            incluirHomebrew: true,
            tieneDoteElevado: false,
            tieneDoteSabandija: false,
        });

        expect(niveles).toEqual([1, 2, 3]);
    });

    it('construye catalogo desde monstruos marcados como companero', () => {
        const monstruos: any[] = [
            {
                Id: 50,
                Nombre: 'Lobo',
                Companero: true,
                Oficial: true,
                Niveles_clase: [
                    crearNivelClase(5, 1, 0),
                    crearNivelClase(5, 3, 53),
                    crearNivelClase(5, 4, 56),
                ],
                Alineamientos_requeridos: { Familiar: [], Companero: [] },
            },
            {
                Id: 51,
                Nombre: 'Halcón',
                Companero: false,
                Oficial: true,
                Niveles_clase: [crearNivelClase(5, 1, 0)],
                Alineamientos_requeridos: { Familiar: [], Companero: [] },
            },
        ];

        const catalogo = construirCatalogoCompanerosDesdeMonstruos(monstruos as any);
        expect(catalogo.map((item) => `${item.Id_companero}:${item.Plantilla.Id}`))
            .toEqual(['50:1', '50:2', '50:3']);
    });

    it('deduplica por Id_companero + Plantilla.Id', () => {
        const estado: EstadoCuposCompanero = {
            especialId: 29,
            fuentes: [{ idClase: 5, nombreClase: 'Druida', nivelActual: 6 }],
            fuentesClaseIds: [5],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelEfectivoCompanero: 6,
        };
        const repetidoA = crearCompaneroMock({
            Id_companero: 20,
            Nombre: 'Lobo',
            Plantilla: { Id: 1, Nombre: 'Base' },
            Niveles_clase: [crearNivelClase(5, 1, 0)],
        });
        const repetidoB = crearCompaneroMock({
            Id_companero: 20,
            Nombre: 'Lobo',
            Plantilla: { Id: 1, Nombre: 'Base' },
            Niveles_clase: [crearNivelClase(5, 1, 0)],
        });

        const filtrados = filtrarCompanerosElegibles({
            companeros: [repetidoA, repetidoB],
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 'base',
            incluirHomebrew: true,
            tieneDoteElevado: false,
            tieneDoteSabandija: false,
            nivelSeleccionado: 1,
        });

        expect(filtrados.length).toBe(1);
        expect(filtrados[0].Id_companero).toBe(20);
    });
});
