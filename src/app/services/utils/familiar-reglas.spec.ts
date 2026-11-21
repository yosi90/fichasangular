import { Clase } from 'src/app/interfaces/clase';
import { FamiliarMonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizeClase } from 'src/app/services/clase.service';
import { normalizeMonstruoDetalle } from 'src/app/services/utils/monstruo-mapper';
import { CONVOCADOR_DIVINO_API, MAGIINGENIERO_API } from 'src/testing/clases-propias-api';
import { SERPIENTE_API } from 'src/testing/familiares-api';
import {
    ALERTA, BASICA, CELESTIAL, CLASES_CON_FAMILIAR, CON_ANIMALES, CON_SU_AMO, COMPARTIR, DRACONICO, DRAGON_FAMILIAR, DRAGON_NEGRO,
    ESCUDRINAR, EVASION_MEJORADA, FAMILIAR_MEJORADO, GATO, HECHICERO, MAGO, MEJORADO, MONSTRUOS_FAMILIAR, NOTA_ALERTA,
    PERRO_INTERMITENTE, PROGRESION_FAMILIAR_API, RC, TABLA_DRACONICA, TABLA_MJ, TRANSMITIR, VINCULO,
} from 'src/testing/familiar-api';
import {
    aptitudesFamiliarDelNivel,
    construirCatalogoFamiliaresDesdeMonstruos,
    EstadoCuposFamiliar,
    esNivelDeFamiliar,
    evaluarFamiliaresElegibilidad,
    familiarConSuCriatura,
    filtrarFamiliaresElegibles,
    listasDeFamiliarDelCatalogo,
    plantillasFamiliarDisponibles,
    resolverEstadoCuposFamiliar,
    resolverFilaFamiliar,
    tablaDelFamiliar,
} from './familiar-reglas';
import { leerFamiliarProgresion } from './monstruo-mapper';

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
        Ajuste: 0,
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

/** El estado de las clases con familiar de un personaje de nivel del amo `nivel` que elige de `listas` (las de la clase 10). */
function estadoMock(nivel: number, listas: number[] = [10]): EstadoCuposFamiliar {
    const fuentes = nivel > 0 ? listas.map((id) => ({
        idClase: id, nombreClase: `Clase ${id}`, nivelActual: nivel, idEspecial: 47, divisor: 1, ajuste: 0, aporta: nivel,
        lista: { id, nombre: `Clase ${id}` },
    })) : [];
    return {
        fuentes: fuentes.map((f) => ({ idClase: f.idClase, nombreClase: f.nombreClase, nivelActual: f.nivelActual })),
        fuentesClaseIds: fuentes.map((f) => f.idClase),
        fuentesTotales: fuentes.length,
        cuposConsumidos: 0,
        cuposDisponibles: fuentes.length > 0 ? 1 : 0,
        nivelEfectivo: nivel,
        fuentesMascota: fuentes,
        listasIds: fuentes.map((f) => f.lista.id),
    };
}

const SIN_DOTES: ReadonlySet<number> = new Set<number>();

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

        const estado = resolverEstadoCuposFamiliar(personaje, clases);

        expect(estado.fuentesClaseIds).toEqual([10]);
        expect(estado.fuentesTotales).toBe(1);
        expect(estado.nivelEfectivo).toBe(5);
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

        const estado = resolverEstadoCuposFamiliar(personaje, clases);

        expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([10, 12]);
        expect(estado.fuentesTotales).toBe(2);
        expect(estado.nivelEfectivo).toBe(7);
        // Un solo familiar por personaje (MJ, cap. 3), aunque lo den dos clases.
        expect(estado.cuposDisponibles).toBe(1);
        expect(resolverEstadoCuposFamiliar({ ...personaje, Familiares: [{} as any] } as any, clases).cuposDisponibles).toBe(0);
    });

    it('filtra familiares por plantilla, nivel, alineamiento y homebrew', () => {
        const estado = estadoMock(5, [10]);

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
            dotesPersonaje: SIN_DOTES,
        });
        const filtradosHomebrew = filtrarFamiliaresElegibles({
            familiares,
            estado,
            alineamientoPersonaje: 'Neutral autentico',
            plantillaSeleccionada: 1,
            incluirHomebrew: true,
            dotesPersonaje: SIN_DOTES,
        });

        expect(filtradosOficial.map((item) => item.Id_familiar)).toEqual([1]);
        expect(filtradosHomebrew.map((item) => item.Id_familiar)).toEqual([1, 4]);
    });

    it('considera elegible nivel 0 en familiar basico (paridad escritorio)', () => {
        const estado = estadoMock(1, [10]);

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
            dotesPersonaje: SIN_DOTES,
        });

        expect(filtrados.map((item) => item.Nombre)).toEqual(['Buho']);
    });

    it('bloquea una plantilla de familiar si falta la dote indicada en Niveles_clase', () => {
        const estado = estadoMock(3, [10]);
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
            dotesPersonaje: SIN_DOTES,
        });

        expect(evaluacion.length).toBe(1);
        expect(evaluacion[0].elegible).toBeFalse();
        expect(evaluacion[0].razones).toEqual(['Hace falta la dote «Familiar de carne remendada» para tenerlo como familiar.']);
    });

    it('permite una plantilla de familiar cuando el personaje ya tiene su dote habilitadora', () => {
        const estado = estadoMock(3, [10]);
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
            dotesPersonaje: new Set([88]),
        });

        expect(evaluacion.length).toBe(1);
        expect(evaluacion[0].elegible).toBeTrue();
    });

    it('deduplica por Id_familiar + Plantilla.Id', () => {
        const estado = estadoMock(3, [10]);

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
            dotesPersonaje: SIN_DOTES,
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
        const estado = estadoMock(0);
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
            dotesPersonaje: SIN_DOTES,
        });

        expect(evaluaciones.length).toBe(1);
        expect(evaluaciones[0].elegible).toBeFalse();
        expect(evaluaciones[0].razones).toEqual(['Ninguna de tus clases da un familiar.', 'Requiere alineamiento Legal bueno.']);
    });

    it('detalla exigencias de alineamiento cuando viene por preferencias de clase', () => {
        const estado = estadoMock(3, [9]);
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
            dotesPersonaje: SIN_DOTES,
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

    function estadoDe(clase: Clase, nivel = 1): EstadoCuposFamiliar {
        const personaje = crearPersonajeMock({ desgloseClases: [{ Nombre: clase.Nombre, Nivel: nivel }] as any });
        return resolverEstadoCuposFamiliar(personaje, [clase]);
    }

    function evaluar(clase: Clase, alineamiento: string, dotes: number[] = []) {
        return evaluarFamiliaresElegibilidad({
            familiares: catalogo,
            estado: estadoDe(clase),
            alineamientoPersonaje: alineamiento,
            plantillaSeleccionada: null,
            incluirHomebrew: true,
            dotesPersonaje: new Set(dotes),
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
        expect(basica?.razones).toContain('No está en la lista de familiares de tus clases (magiingeniero).');
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
        const evaluarHechicero = (nivel: number, dotes: number[]) =>
            evaluarFamiliaresElegibilidad({
                familiares: catalogo,
                estado: estadoDe(hechicero, nivel),
                alineamientoPersonaje: 'Neutral bueno',
                plantillaSeleccionada: 3,
                incluirHomebrew: true,
                dotesPersonaje: new Set(dotes),
            });
        const sinDote = evaluarHechicero(3, []);
        expect(sinDote.length).toBe(1);
        expect(sinDote[0].elegible).toBeFalse();
        expect(sinDote[0].razones).toContain('Hace falta la dote «Familiar celestial» para tenerlo como familiar.');
        expect(evaluarHechicero(3, [45])[0].elegible).toBeTrue();
        const pocoNivel = evaluarHechicero(2, [45])[0];
        expect(pocoNivel.elegible).toBeFalse();
        expect(pocoNivel.razones).toContain('Pide un nivel efectivo de hechicero 3, y tienes 2.');
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
            dotesPersonaje: SIN_DOTES,
        });
        expect(filtrados.map((item) => item.Plantilla.Id)).toEqual([idForjado]);
    });
});

// Con los datos del familiar (`GET /familiares/progresion`, el `Mascota` de cada clase y sus listas), como los da la API tras
// `familiar_datos.sql`: el nivel del amo, la lista, la tabla de su pseudoplantilla y lo que da cada nivel.
describe('familiar-reglas: el familiar, de los datos', () => {
    const progresion = leerFamiliarProgresion(PROGRESION_FAMILIAR_API);
    const listas = listasDeFamiliarDelCatalogo(CLASES_CON_FAMILIAR);
    const catalogo = construirCatalogoFamiliaresDesdeMonstruos(MONSTRUOS_FAMILIAR, listas);
    const de = (id: number, plantilla: number) => catalogo.find((f) => f.Id_familiar === id && f.Plantilla.Id === plantilla)!;

    function estadoDe(clases: Array<[string, number]>): EstadoCuposFamiliar {
        const personaje = crearPersonajeMock({ desgloseClases: clases.map(([Nombre, Nivel]) => ({ Nombre, Nivel })) as any });
        return resolverEstadoCuposFamiliar(personaje, CLASES_CON_FAMILIAR);
    }

    function ids(lista: Array<{ Id: number; }>): number[] {
        return lista.map((item) => item.Id).sort((a, b) => a - b);
    }

    it('el nivel del amo: cada clase como dice su `Mascota`; el filo aojador, tres menos y la lista del hechicero (F9)', () => {
        const filo4 = estadoDe([['Filo aojador', 4]]);
        expect(filo4.nivelEfectivo).toBe(1);
        expect(filo4.listasIds).toEqual([HECHICERO]);
        expect(filo4.cuposDisponibles).toBe(1);
        // Con 3 niveles aún no lo tiene; con el hechicero, se apilan.
        expect(estadoDe([['Filo aojador', 3]]).cuposDisponibles).toBe(0);
        expect(estadoDe([['Filo aojador', 4], ['Hechicero', 3]]).nivelEfectivo).toBe(4);
        // El mago, sin `Mascota`: su nivel y su lista.
        expect(estadoDe([['Mago', 5]]).nivelEfectivo).toBe(5);
        expect(estadoDe([['Mago', 5]]).listasIds).toEqual([MAGO]);
    });

    it('el filo aojador 4 elige de la lista del hechicero un familiar de nivel 1', () => {
        const estado = estadoDe([['Filo aojador', 4]]);
        const gato = resolverFilaFamiliar(de(GATO, BASICA), estado, SIN_DOTES);
        expect(gato.fila?.Clase.Id).toBe(HECHICERO);
        expect(gato.nivelTabla).toBe(1);
        expect(resolverFilaFamiliar(de(DRAGON_NEGRO, DRACONICO), estado, new Set([DRAGON_FAMILIAR])).razones)
            .toEqual(['Pide un nivel efectivo de hechicero 8, y tienes 1.']);
    });

    it('la lista: la plantilla y la dote de cada fila', () => {
        const estado = estadoDe([['Hechicero', 8]]);
        expect(resolverFilaFamiliar(de(DRAGON_NEGRO, DRACONICO), estado, SIN_DOTES).razones)
            .toEqual(['Hace falta la dote «Dragón familiar» para tenerlo como familiar.']);
        expect(resolverFilaFamiliar(de(DRAGON_NEGRO, DRACONICO), estado, new Set([DRAGON_FAMILIAR])).fila).not.toBeNull();
        expect(resolverFilaFamiliar(de(PERRO_INTERMITENTE, MEJORADO), estado, new Set([FAMILIAR_MEJORADO])).nivelTabla).toBe(8);
    });

    it('el catálogo, solo con las filas de las listas de familiar: el animal celestial de un compañero no es un familiar', () => {
        const conCompanero = MONSTRUOS_FAMILIAR.map((m) => m.Id !== GATO ? m : {
            ...m, Niveles_clase: [...m.Niveles_clase, { ...m.Niveles_clase[0], Clase: { Id: 5, Nombre: 'Druida' }, Plantilla: { Id: CELESTIAL, Nombre: 'Celestial' } }],
        });
        const conListas = construirCatalogoFamiliaresDesdeMonstruos(conCompanero, listas);
        expect(conListas.filter((f) => f.Id_familiar === GATO).map((f) => f.Plantilla.Id)).toEqual([BASICA]);
        expect(esNivelDeFamiliar(conCompanero[0].Niveles_clase[2], listas)).toBeFalse();
        expect(esNivelDeFamiliar(conCompanero[0].Niveles_clase[0], listas)).toBeTrue();
    });

    it('la tabla de su pseudoplantilla: la del Manual del jugador por defecto; la dracónica, la suya', () => {
        expect(tablaDelFamiliar(progresion, BASICA, 4).tabla?.Id).toBe(TABLA_MJ);
        expect(tablaDelFamiliar(progresion, BASICA, 4).bonos).toEqual({ Nivel: 3, Armadura_natural: 2, Inteligencia: 7, Rc_sobre_nivel: null });
        expect(tablaDelFamiliar(progresion, 99, 1).tabla?.Id).toBe(TABLA_MJ);
        const draconico = tablaDelFamiliar(progresion, DRACONICO, 9);
        expect(draconico.tabla?.Id).toBe(TABLA_DRACONICA);
        expect(draconico.bonos).toEqual({ Nivel: 9, Armadura_natural: 2, Inteligencia: null, Rc_sobre_nivel: null });
        expect(draconico.plantilla?.Pg_ataque_mayores).toBeTrue();
        expect(tablaDelFamiliar(progresion, DRACONICO, 13).bonos.Rc_sobre_nivel).toBe(5);
    });

    function aptitudes(plantilla: number, nivel: number) {
        return aptitudesFamiliarDelNivel(tablaDelFamiliar(progresion, plantilla, nivel), () => false);
    }

    it('el mago 1: Alerta con su nota y compartir conjuros y el vínculo para el amo; evasión mejorada para el familiar (F6)', () => {
        const a = aptitudes(BASICA, 1);
        expect(ids(a.delAmo)).toEqual([COMPARTIR, VINCULO]);
        expect(a.dotesDelAmo.map((d) => [d.Dote?.Id, d.Nota])).toEqual([[ALERTA, NOTA_ALERTA]]);
        expect(ids(a.especiales)).toEqual([EVASION_MEJORADA, COMPARTIR, VINCULO].sort((x, y) => x - y));
        expect(a.especialesQueNo).toContain(TRANSMITIR);
    });

    it('el mago 3 transmite conjuros de toque; el mago 2, aún no (F5)', () => {
        expect(ids(aptitudes(BASICA, 3).especiales)).toContain(TRANSMITIR);
        expect(ids(aptitudes(BASICA, 2).especiales)).not.toContain(TRANSMITIR);
        expect(aptitudes(BASICA, 2).especialesQueNo).toContain(TRANSMITIR);
    });

    it('el mago 5 y 7 se comunican con su amo y con los animales de su tipo, y el 11 tiene la aptitud de RC (F6)', () => {
        expect(ids(aptitudes(BASICA, 5).delAmo)).toContain(CON_SU_AMO);
        expect(ids(aptitudes(BASICA, 5).especiales)).toContain(CON_SU_AMO);
        expect(ids(aptitudes(BASICA, 7).especiales)).toContain(CON_ANIMALES);
        expect(ids(aptitudes(BASICA, 10).especiales)).not.toContain(RC);
        expect(ids(aptitudes(BASICA, 11).especiales)).toContain(RC);
    });

    it('el mago 13 escudriña por medio de su familiar: es del amo; a 12, aún no (F5)', () => {
        expect(ids(aptitudes(BASICA, 13).delAmo)).toContain(ESCUDRINAR);
        expect(ids(aptitudes(BASICA, 13).especiales)).not.toContain(ESCUDRINAR);
        expect(ids(aptitudes(BASICA, 12).delAmo)).not.toContain(ESCUDRINAR);
    });

    it('el mejorado transmite conjuros y escudriña, pero no se comunica con los animales de su tipo (F7)', () => {
        const a = aptitudes(MEJORADO, 13);
        expect(ids(a.especiales)).toContain(TRANSMITIR);
        expect(ids(a.delAmo)).toContain(ESCUDRINAR);
        expect(ids(a.especiales)).not.toContain(CON_ANIMALES);
        expect(a.especialesQueNo).toContain(CON_ANIMALES);
    });

    it('el dracónico, con su tabla: transmitir a 9, la RC a 13 y escudriñar a 17 (F8)', () => {
        expect(ids(aptitudes(DRACONICO, 8).especiales)).not.toContain(TRANSMITIR);
        expect(ids(aptitudes(DRACONICO, 9).especiales)).toContain(TRANSMITIR);
        expect(ids(aptitudes(DRACONICO, 12).especiales)).not.toContain(RC);
        expect(ids(aptitudes(DRACONICO, 13).especiales)).toContain(RC);
        expect(ids(aptitudes(DRACONICO, 16).delAmo)).not.toContain(ESCUDRINAR);
        expect(ids(aptitudes(DRACONICO, 17).delAmo)).toContain(ESCUDRINAR);
        expect(ids(aptitudes(DRACONICO, 17).especiales)).not.toContain(CON_ANIMALES);
    });

    it('el familiar de una ficha guardada, con los valores de su criatura y sus filas de la lista', () => {
        const guardado = {
            ...de(GATO, BASICA), Nombre: 'Bigotes', Niveles_clase: [],
            Defensa: { ...de(GATO, BASICA).Defensa, Armadura_natural: 2 },
            Caracteristicas: { ...de(GATO, BASICA).Caracteristicas, Inteligencia: 7 },
            Ataque: { ...de(GATO, BASICA).Ataque, Ataque_base: 1 },
            Dotes: [{ Dote: { Id: 99 }, Contexto: { Entidad: 'personaje' } }, { Dote: { Id: 98 }, Contexto: {} }],
        } as any;
        const conSuCriatura = familiarConSuCriatura(guardado, MONSTRUOS_FAMILIAR[0]);
        expect(conSuCriatura.Nombre).toBe('Bigotes');
        expect(conSuCriatura.Defensa.Armadura_natural).toBe(0);
        expect(conSuCriatura.Caracteristicas.Inteligencia).toBe(2);
        expect(conSuCriatura.Ataque.Ataque_base).toBe(0);
        expect(conSuCriatura.Niveles_clase.length).toBe(2);
        expect(conSuCriatura.Dotes.map((d) => d.Dote.Id)).toEqual([99]);
    });
});
