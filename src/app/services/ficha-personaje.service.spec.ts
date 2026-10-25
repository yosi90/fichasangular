import { PDFDocument } from 'pdf-lib';
import * as fileSaver from 'file-saver';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje } from '../interfaces/personaje';
import { FichaPersonajeService } from './ficha-personaje.service';
import { PersonajeService } from './personaje.service';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';

/** La plantilla de verdad de la ficha (Karma sirve `src/assets`). */
async function plantillaFicha(fetchOriginal: typeof fetch): Promise<ArrayBuffer> {
    for (const ruta of ['/assets/pdf/Ficha.pdf', '/_karma_webpack_/assets/pdf/Ficha.pdf']) {
        const respuesta = await fetchOriginal(ruta);
        if (respuesta.ok)
            return respuesta.arrayBuffer();
    }
    throw new Error('No se encuentra la plantilla de la ficha en Karma.');
}

function crearPersonajeBase(): Personaje {
    return {
        Nombre: 'Aldric',
        Jugador: 'Jugador',
        Conjuros: [],
        Sortilegas: [],
        Familiares: [],
        Companeros: [],
    } as any;
}

function crearMonstruoBase(nombre: string): FamiliarMonstruoDetalle {
    return {
        Id: 1,
        Nombre: nombre,
        Iniciativa: 0,
        Vida: 10,
        Tamano: { Id: 1, Nombre: 'Pequeno', Modificador: 1, Modificador_presa: -4 } as any,
        Tipo: {
            Id: 1,
            Nombre: 'Animal',
            Descripcion: '',
            Oficial: true,
        },
        Defensa: {
            Ca: 10,
            Toque: 10,
            Desprevenido: 10,
            Armadura_natural: 0,
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
        },
        Ataque: {
            Ataque_base: 1,
            Presa: 0,
            Ataques: '',
            Ataque_completo: '',
        },
        Movimientos: {
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
        },
        Caracteristicas: {
            Fuerza: 10, Fuerza_modificador: 0,
            Destreza: 10, Destreza_modificador: 0,
            Constitucion: 10, Constitucion_modificador: 0,
            Inteligencia: 10, Inteligencia_modificador: 0,
            Sabiduria: 10, Sabiduria_modificador: 0,
            Carisma: 10, Carisma_modificador: 0,
        },
        Salvaciones: {
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
        },
        Plantilla: { Id: 1, Nombre: 'Base' },
        Dotes: [],
        Habilidades: [],
        Subtipos: [],
        Idiomas: [],
        Raciales: [],
        Sortilegas: [],
    } as any;
}

describe('FichaPersonajeService', () => {
    let service: FichaPersonajeService;
    let fetchSpy: jasmine.Spy;
    let saveAsSpy: jasmine.Spy;
    const fetchOriginal = window.fetch.bind(window);

    beforeEach(async () => {
        service = new FichaPersonajeService();
        const blankPdf = await PDFDocument.create();
        const bytes = await blankPdf.save();
        fetchSpy = spyOn(window as any, 'fetch').and.returnValue(Promise.resolve({
            arrayBuffer: () => Promise.resolve(bytes.buffer),
        } as any));
        saveAsSpy = spyOn(fileSaver, 'saveAs').and.stub();
    });

    it('genera PDF de familiar con fixture minimo sin lanzar excepcion', async () => {
        const pj = crearPersonajeBase();
        const familiar = crearMonstruoBase('Cuervo');

        await service.generarPDF_Familiar(pj, familiar, 0);

        expect(fetchSpy).toHaveBeenCalledWith('../../assets/pdf/familiar.pdf');
        expect(saveAsSpy).toHaveBeenCalled();
    });

    it('genera PDF de companero con fixture minimo sin lanzar excepcion', async () => {
        const pj = crearPersonajeBase();
        const companero = crearMonstruoBase('Lobo') as unknown as CompaneroMonstruoDetalle;

        await service.generarPDF_Companero(pj, companero, 1);

        expect(fetchSpy).toHaveBeenCalledWith('../../assets/pdf/compañero.pdf');
        expect(saveAsSpy).toHaveBeenCalled();
    });

    it('la hoja de un compañero usa los modificadores de la API y «—» sin valor (no -5 a un constructo)', async () => {
        const companero = crearMonstruoBase('Horror de platino') as unknown as CompaneroMonstruoDetalle;
        companero.Caracteristicas = {
            Fuerza: 16, Fuerza_modificador: 3,
            Destreza: 17, Destreza_modificador: 3,
            Constitucion: null, Constitucion_modificador: null,
            Inteligencia: 13, Inteligencia_modificador: 1,
            Sabiduria: 20, Sabiduria_modificador: 5,
            Carisma: 15, Carisma_modificador: 2,
        };
        companero.Habilidades = [
            { Id_habilidad: 40, Habilidad: 'Aguante', Id_caracteristica: 3, Caracteristica: 'Constitucion', Custom: true, Rangos: 2 },
            { Id_habilidad: 41, Habilidad: 'Fuerza bruta', Id_caracteristica: 1, Caracteristica: 'Fuerza', Custom: true, Rangos: 1 },
        ] as any;
        const escrito = new Map<string, string>();
        spyOn<any>(service, 'trySetText').and.callFake((_form: unknown, campo: string, valor: string) => escrito.set(campo, valor));

        await service.generarPDF_Companero(crearPersonajeBase(), companero, 0);

        expect(escrito.get('fue')).toBe('16');
        expect(escrito.get('mod_fue')).toBe('+3');
        expect(escrito.get('con')).toBe('—');
        expect(escrito.get('mod_con')).toBe('—');
        expect(escrito.get('mod_custom1')).toBe('0');
        expect(escrito.get('mod_custom2')).toBe('3');
    });

    it('rellena salvaciones, iniciativa, presa y habilidades con las partes de cada tipo que da la API', async () => {
        const plantilla = await plantillaFicha(fetchOriginal);
        fetchSpy.and.returnValue(Promise.resolve({ arrayBuffer: () => Promise.resolve(plantilla) } as any));
        const personajeSvc = new PersonajeService({ currentUser: null } as any, {} as any);
        const pj = (personajeSvc as any).mapApiDetalleToPersonaje(crearDetalleApi({
            presa: {
                total: 22,
                desglose: [
                    { tipo: 'ataqueBase', origen: 'Ataque base', valor: 8 },
                    { tipo: 'caracteristica', origen: 'Fuerza', valor: 8 },
                    { tipo: 'tamano', origen: 'Tamaño (Grande)', valor: 4 },
                    { tipo: 'varios', origen: 'Agarrón mejorado', valor: 2 },
                ],
            },
            habilidades: [
                {
                    id: 3, nombre: 'Artesanía', custom: false, deClase: false, idExtra: 0, extra: 'Elegir', extraComodin: 'elegir',
                    caracteristica: 'Inteligencia', modificadorCaracteristica: 4, rangos: 2, rangosVarios: 0, varios: null, total: 6,
                    desglose: [],
                },
                {
                    id: 1, nombre: 'Interpretar (onomatopeyas)', custom: true, deClase: true, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Carisma', modificadorCaracteristica: 3, rangos: 2, rangosVarios: 2, varios: null, total: 7,
                    desglose: [],
                },
            ],
        }));

        await service.generarPDF(pj);

        const blob = saveAsSpy.calls.mostRecent().args[0] as Blob;
        const form = (await PDFDocument.load(await blob.arrayBuffer())).getForm();
        const campo = (nombre: string) => form.getTextField(nombre).getText();
        expect(campo('fort_clase')).toBe('6');
        expect(campo('mod_varios_fortaleza')).toBe('1');
        expect(campo('ref_clase')).toBe('6');
        expect(campo('mod_varios_reflejos')).toBe('4');
        expect(campo('vol_clase')).toBe('2');
        expect(campo('mod_varios_voluntad')).toBe('0');
        expect(campo('mod_varios_iniciativa')).toBe('4');
        expect(campo('mod_tamaño_presa')).toBe('4');
        expect(campo('mod_varios_presa')).toBe('2');
        expect(campo('campaña') ?? '').toBe('');
        expect(campo('extra2') ?? '').toBe('');
        expect(campo('custom1')).toBe('Interpretar (onomatopeyas)');
        expect(campo('car1')).toBe('CAR');
        expect(campo('mod_custom1')).toBe('3');
    });

    it('formatea niveles de lanzador en notas de ficha', () => {
        const pj = {
            Niveles_lanzador: [
                {
                    idClase: 186,
                    nombreClase: 'Mago',
                    tipoLanzamiento: 'arcano',
                    nivelClase: 10,
                    nivelLanzadorBase: 10,
                    bonusNivelLanzador: 2,
                    nivelLanzador: 12,
                    nivelDesgloseLanzador: 12,
                },
            ],
        } as any;

        const notas = (service as any).formatearNotasNivelesLanzador(pj);

        expect(notas).toContain('Niveles de lanzador:');
        expect(notas).toContain('Mago (arcano): 12, base 10 + 2');
    });
});
