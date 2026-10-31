import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizeClase } from 'src/app/services/clase.service';
import { normalizeMonstruoDetalle } from 'src/app/services/utils/monstruo-mapper';
import { CONVOCADOR_DIVINO_API, MAGIINGENIERO_API } from 'src/testing/clases-propias-api';
import { SERPIENTE_API } from 'src/testing/familiares-api';
import {
    construirCatalogoFamiliaresDesdeMonstruos,
    EstadoCuposFamiliar,
    evaluarFamiliaresElegibilidad,
    filtrarFamiliaresElegibles,
    plantillasFamiliarDisponibles,
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
    prefMoral = 5,
    dote: { Id: number; Nombre: string; } = { Id: 0, Nombre: '' }
): MonstruoNivelClase {
    return {
        Clase: { Id: idClase, Nombre: `Clase ${idClase}` },
        Nivel: nivel,
        Plantilla: { Id: plantilla, Nombre: `Plantilla ${plantilla}` },
        Preferencia_legal: { Id: prefLegal, Nombre: `${prefLegal}` },
        Preferencia_moral: { Id: prefMoral, Nombre: `${prefMoral}` },
        Dote: dote,
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
                1: [{ Especial: { Id: 47, Nombre: 'Convocar a un familiar', Otorga_familiar: true } }],
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
                1: [{ Especial: { Id: 47, Nombre: 'Convocar a un familiar', Otorga_familiar: true } }],
            }),
            crearClaseConEspeciales(12, 'Brujo', {
                2: [{ Especial: { Nombre: 'Convocar a un familiar', Otorga_familiar: true } }],
            }),
        ];

        const estado = resolverEstadoCuposFamiliarEspecial47(personaje, clases);

        expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([10, 12]);
        expect(estado.fuentesTotales).toBe(2);
        expect(estado.nivelLanzadorFamiliar).toBe(7);
        // Un solo familiar por personaje (MJ, cap. 3), aunque lo den dos clases.
        expect(estado.cuposDisponibles).toBe(1);
        expect(resolverEstadoCuposFamiliarEspecial47({ ...personaje, Familiares: [{} as any] } as any, clases).cuposDisponibles).toBe(0);
    });

    it('filtra familiares por plantilla, nivel, alineamiento y homebrew', () => {
        const estado: EstadoCuposFamiliar = {
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

    it('bloquea una plantilla de familiar si falta la dote indicada en Niveles_clase', () => {
        const estado: EstadoCuposFamiliar = {
            fuentes: [{ idClase: 10, nombreClase: 'Mago', nivelActual: 3 }],
            fuentesClaseIds: [10],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 3,
        };
        const familiarRemendado = crearFamiliarMock({
            Id_familiar: 20,
            Nombre: 'Cuervo remendado',
            Plantilla: { Id: 4, Nombre: 'Remendado' },
            Niveles_clase: [
                crearNivelClase(10, 1, 4, 5, 5, { Id: 88, Nombre: 'Familiar de carne remendada' }),
            ],
        });

        const evaluacion = evaluarFamiliaresElegibilidad({
            familiares: [familiarRemendado],
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 4,
            incluirHomebrew: true,
            dotesActuales: [],
        });

        expect(evaluacion.length).toBe(1);
        expect(evaluacion[0].elegible).toBeFalse();
        expect(evaluacion[0].razones.join(' ')).toContain('Familiar de carne remendada');
    });

    it('permite una plantilla de familiar cuando el personaje ya tiene su dote habilitadora', () => {
        const estado: EstadoCuposFamiliar = {
            fuentes: [{ idClase: 10, nombreClase: 'Mago', nivelActual: 3 }],
            fuentesClaseIds: [10],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 3,
        };
        const familiarRemendado = crearFamiliarMock({
            Id_familiar: 21,
            Nombre: 'Gato remendado',
            Plantilla: { Id: 4, Nombre: 'Remendado' },
            Niveles_clase: [
                crearNivelClase(10, 1, 4, 5, 5, { Id: 88, Nombre: 'Familiar de carne remendada' }),
            ],
        });

        const evaluacion = evaluarFamiliaresElegibilidad({
            familiares: [familiarRemendado],
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 4,
            incluirHomebrew: true,
            dotesActuales: [{ id: 88, nombre: 'Familiar de carne remendada' }],
        });

        expect(evaluacion.length).toBe(1);
        expect(evaluacion[0].elegible).toBeTrue();
    });

    it('deduplica por Id_familiar + Plantilla.Id', () => {
        const estado: EstadoCuposFamiliar = {
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

    it('muestra motivo de alineamiento explícito aunque no haya fuentes de clase actuales', () => {
        const estado: EstadoCuposFamiliar = {
            fuentes: [],
            fuentesClaseIds: [],
            fuentesTotales: 0,
            cuposConsumidos: 0,
            cuposDisponibles: 0,
            nivelLanzadorFamiliar: 0,
        };
        const familiar = crearFamiliarMock({
            Id_familiar: 40,
            Nombre: 'Perro intermitente',
            Plantilla: { Id: 5, Nombre: 'Mejorado' },
            Alineamientos_requeridos: {
                Familiar: [{ Id: 1, Nombre: 'Legal bueno' }],
                Companero: [],
            },
            Niveles_clase: [crearNivelClase(9, 5, 5, 10, 10)],
        });

        const evaluaciones = evaluarFamiliaresElegibilidad({
            familiares: [familiar],
            estado,
            alineamientoPersonaje: 'Caotico maligno',
            plantillaSeleccionada: 5,
            incluirHomebrew: true,
        });

        expect(evaluaciones.length).toBe(1);
        expect(evaluaciones[0].elegible).toBeFalse();
        expect(evaluaciones[0].razones).toContain('Requiere alineamiento Legal bueno.');
    });

    it('detalla exigencias de alineamiento cuando viene por preferencias de clase', () => {
        const estado: EstadoCuposFamiliar = {
            fuentes: [{ idClase: 9, nombreClase: 'Mago', nivelActual: 3 }],
            fuentesClaseIds: [9],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelLanzadorFamiliar: 3,
        };
        const familiar = crearFamiliarMock({
            Id_familiar: 61,
            Nombre: 'Murciélago',
            Plantilla: { Id: 1, Nombre: 'Básica' },
            Alineamientos_requeridos: { Familiar: [], Companero: [] },
            Niveles_clase: [crearNivelClase(9, 1, 1, 4, 9)],
        });

        const evaluaciones = evaluarFamiliaresElegibilidad({
            familiares: [familiar],
            estado,
            alineamientoPersonaje: 'Caotico bueno',
            plantillaSeleccionada: 1,
            incluirHomebrew: true,
        });

        expect(evaluaciones.length).toBe(1);
        expect(evaluaciones[0].elegible).toBeFalse();
        expect(evaluaciones[0].razones.some((item) => item.includes('Exigencias del monstruo:'))).toBeTrue();
        expect(evaluaciones[0].razones.some((item) => item.includes('legal:'))).toBeTrue();
        expect(evaluaciones[0].razones.some((item) => item.includes('moral:'))).toBeTrue();
    });
});

// Con las respuestas reales de la API de desarrollo: la serpiente (`GET /monstruos/16`) y las dos clases propias que dan
// familiar (`GET /clases/418` y `/419`). Las pseudoplantillas salen de los datos, no de una lista de ids.
describe('familiar-reglas con las respuestas reales de la API', () => {
    const serpiente = normalizeMonstruoDetalle(SERPIENTE_API, 1);
    const magiingeniero = normalizeClase(MAGIINGENIERO_API);
    const convocador = normalizeClase(CONVOCADOR_DIVINO_API);
    const catalogo = construirCatalogoFamiliaresDesdeMonstruos([serpiente]);
    type DoteActual = { id: number | null; nombre: string; };

    function estadoDe(clase: Clase, nivel = 1): EstadoCuposFamiliar {
        const personaje = crearPersonajeMock({ desgloseClases: [{ Nombre: clase.Nombre, Nivel: nivel }] as any });
        return resolverEstadoCuposFamiliarEspecial47(personaje, [clase]);
    }

    function evaluar(clase: Clase, alineamiento: string, dotesActuales: DoteActual[] = []) {
        return evaluarFamiliaresElegibilidad({
            familiares: catalogo,
            estado: estadoDe(clase),
            alineamientoPersonaje: alineamiento,
            plantillaSeleccionada: null,
            incluirHomebrew: true,
            dotesActuales,
        });
    }

    function elegibles(clase: Clase, alineamiento: string): string[] {
        return evaluar(clase, alineamiento)
            .filter((item) => item.elegible)
            .map((item) => item.familiar.Plantilla.Nombre)
            .sort();
    }

    it('el catálogo tiene una entrada por cada pseudoplantilla de la serpiente, con el nombre que da la API', () => {
        const plantillas = catalogo.map((item) => item.Plantilla.Nombre).sort();
        expect(plantillas).toEqual([
            'Básica',
            'Celestial',
            'Criatura elemental de agua',
            'Criatura elemental de aire',
            'Criatura elemental de fuego',
            'Criatura elemental de tierra',
            'Familiar forjado',
            'Infernal',
            'Remendado',
        ]);
        expect(catalogo.every((item) => item.Id_familiar === 16)).toBeTrue();
    });

    it('el magiingeniero y el convocador tienen hueco de familiar desde el nivel 1 (`Otorga_familiar`)', () => {
        expect(estadoDe(magiingeniero).fuentesClaseIds).toEqual([418]);
        expect(estadoDe(convocador).fuentesClaseIds).toEqual([419]);
        expect(estadoDe(convocador).cuposDisponibles).toBe(1);
    });

    it('el filtro de plantilla ofrece solo las pseudoplantillas de las clases con familiar del personaje', () => {
        expect(plantillasFamiliarDisponibles(catalogo, [418]).map((item) => item.Nombre)).toEqual(['Familiar forjado']);
        expect(plantillasFamiliarDisponibles(catalogo, [419]).map((item) => item.Nombre)).toEqual([
            'Celestial',
            'Criatura elemental de agua',
            'Criatura elemental de aire',
            'Criatura elemental de fuego',
            'Criatura elemental de tierra',
            'Infernal',
        ]);
        expect(plantillasFamiliarDisponibles(catalogo, [8]).map((item) => item.Nombre)).toEqual(['Básica', 'Celestial', 'Remendado']);
        expect(plantillasFamiliarDisponibles(catalogo, []).length).toBe(9);
    });

    it('el magiingeniero recibe la serpiente como familiar forjado, sea cual sea su alineamiento', () => {
        expect(elegibles(magiingeniero, 'Legal bueno')).toEqual(['Familiar forjado']);
        expect(elegibles(magiingeniero, 'Caótico maligno')).toEqual(['Familiar forjado']);
        const basica = evaluar(magiingeniero, 'Legal bueno').find((item) => item.familiar.Plantilla.Nombre === 'Básica');
        expect(basica?.razones).toContain('Esta criatura no tiene progresión válida para tus clases con familiar.');
    });

    it('el convocador recibe la pseudoplantilla de su senda por la preferencia moral de cada fila', () => {
        expect(elegibles(convocador, 'Neutral bueno')).toEqual(['Celestial']);
        expect(elegibles(convocador, 'Legal maligno')).toEqual(['Infernal']);
        expect(elegibles(convocador, 'Neutral auténtico')).toEqual([
            'Criatura elemental de agua',
            'Criatura elemental de aire',
            'Criatura elemental de fuego',
            'Criatura elemental de tierra',
        ]);
        const infernal = evaluar(convocador, 'Neutral bueno').find((item) => item.familiar.Plantilla.Nombre === 'Infernal');
        expect(infernal?.elegible).toBeFalse();
        expect(infernal?.razones.join(' ')).toContain('Convocador divino nivel 0 (moral: Siempre Maligno)');
    });

    it('al convocador no se le pide la dote Familiar celestial, que es de las filas del hechicero y del mago', () => {
        const celestial = evaluar(convocador, 'Neutral bueno').find((item) => item.familiar.Plantilla.Nombre === 'Celestial');
        expect(celestial?.elegible).toBeTrue();
        expect(celestial?.razones).toEqual([]);
    });

    it('al hechicero, la celestial le sigue pidiendo su dote y su nivel', () => {
        const hechicero = { Id: 8, Nombre: 'Hechicero', Desglose_niveles: magiingeniero.Desglose_niveles } as Clase;
        const evaluarHechicero = (nivel: number, dotesActuales: DoteActual[]) =>
            evaluarFamiliaresElegibilidad({
                familiares: catalogo,
                estado: estadoDe(hechicero, nivel),
                alineamientoPersonaje: 'Neutral bueno',
                plantillaSeleccionada: 3,
                incluirHomebrew: true,
                dotesActuales,
            });
        const sinDote = evaluarHechicero(3, []);
        expect(sinDote.length).toBe(1);
        expect(sinDote[0].elegible).toBeFalse();
        expect(sinDote[0].razones).toContain('Requiere la dote Familiar celestial para esta plantilla.');
        expect(evaluarHechicero(3, [{ id: 45, nombre: 'Familiar celestial' }])[0].elegible).toBeTrue();
        const pocoNivel = evaluarHechicero(2, [{ id: 45, nombre: 'Familiar celestial' }])[0];
        expect(pocoNivel.elegible).toBeFalse();
        expect(pocoNivel.razones).toContain('Necesitas al menos nivel 3 de lanzador de familiar para esta opción.');
    });

    it('filtra por una pseudoplantilla nueva (de id mayor que 5) cuando se elige en el selector', () => {
        const idForjado = catalogo.find((item) => item.Plantilla.Nombre === 'Familiar forjado')!.Plantilla.Id;
        expect(idForjado).toBeGreaterThan(5);
        const filtrados = filtrarFamiliaresElegibles({
            familiares: catalogo,
            estado: estadoDe(magiingeniero),
            alineamientoPersonaje: 'Neutral auténtico',
            plantillaSeleccionada: idForjado,
            incluirHomebrew: true,
        });
        expect(filtrados.map((item) => item.Plantilla.Id)).toEqual([idForjado]);
    });
});
