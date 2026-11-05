import { AnnotationFlags, PDFDocument, PDFForm } from 'pdf-lib';
import * as fileSaver from 'file-saver';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje } from '../interfaces/personaje';
import { FichaPersonajeService } from './ficha-personaje.service';
import { PersonajeService } from './personaje.service';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { crearEquipoFichaApi } from 'src/testing/equipo-api';

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
            Excavar: 0,
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

    it('la raza de la hoja del familiar lleva el nombre de su pseudoplantilla del catálogo, sea cual sea', async () => {
        const familiar = crearMonstruoBase('Serpiente');
        familiar.Plantilla = { Id: 16, Nombre: 'Familiar forjado' };
        const escrito = new Map<string, string>();
        spyOn<any>(service, 'trySetText').and.callFake((_form: unknown, campo: string, valor: string) => escrito.set(campo, valor));

        await service.generarPDF_Familiar(crearPersonajeBase(), familiar, 0);

        expect(escrito.get('raza')).toBe('Serpiente (Familiar forjado)');
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

    /** Genera la hoja con la plantilla de verdad y la ficha de la API con [cambios]; devuelve el formulario rellenado. */
    async function hojaDe(cambios: Record<string, any>): Promise<PDFForm> {
        const plantilla = await plantillaFicha(fetchOriginal);
        fetchSpy.and.returnValue(Promise.resolve({ arrayBuffer: () => Promise.resolve(plantilla) } as any));
        const personajeSvc = new PersonajeService({ currentUser: null } as any, {} as any);
        const pj = (personajeSvc as any).mapApiDetalleToPersonaje(crearDetalleApi(cambios));
        await service.generarPDF(pj);
        const blob = saveAsSpy.calls.mostRecent().args[0] as Blob;
        return (await PDFDocument.load(await blob.arrayBuffer())).getForm();
    }

    it('una habilidad custom va a sus filas propias y no pisa la fila de la base con su mismo número', async () => {
        const form = await hojaDe({
            habilidades: [
                {
                    id: 1, nombre: 'Abrir cerraduras', custom: false, deClase: false, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Destreza', modificadorCaracteristica: 4, rangos: 5, rangosVarios: 0, varios: null, total: 9, desglose: [],
                },
                {
                    id: 1, nombre: 'Cocina', custom: true, deClase: true, idExtra: null, extra: 'Repostería', extraComodin: null,
                    caracteristica: 'Sabiduría', modificadorCaracteristica: 4, rangos: 2, rangosVarios: 1, varios: null, total: 7, desglose: [],
                },
                ...[2, 3].map((id) => ({
                    id, nombre: `Custom ${id}`, custom: true, deClase: false, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Carisma', modificadorCaracteristica: 0, rangos: 1, rangosVarios: 0, varios: null, total: 1, desglose: [],
                })),
            ],
        });

        expect(form.getTextField('rangos0').getText()).toBe('5');
        expect(form.getCheckBox('clasea0').isChecked()).toBeFalse();
        // Su casilla «de clase», la de su fila (la 44).
        expect(form.getCheckBox('clasea44').isChecked()).toBeTrue();
        expect(form.getTextField('custom1').getText()).toBe('Cocina');
        expect(form.getTextField('rangos_custom1').getText()).toBe('2');
        expect(form.getTextField('varios_custom1').getText()).toBe('1');
        // La que no cabe va a las notas, con su título; sin `varios`, no escribe «null».
        const notas = form.getTextField('notas').getText() ?? '';
        expect(notas.replace(/\r\n/g, '\n')).toContain('Habilidades extra (No caben):\n1.- Custom 3 [CAR] rangos: 1 rangos varios: 0\n');
        expect(notas).not.toContain('null');
    });

    it('rellena los totales que la plantilla calcula con JavaScript con los de la ficha', async () => {
        const form = await hojaDe({
            habilidades: [
                {
                    id: 6, nombre: 'Avistar', custom: false, deClase: true, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Sabiduría', modificadorCaracteristica: 4, rangos: 14, rangosVarios: 0, varios: null, total: 20,
                    desglose: [],
                },
                {
                    id: 3, nombre: 'Artesanía', custom: false, deClase: false, idExtra: 0, extra: 'Elegir', extraComodin: 'elegir',
                    caracteristica: 'Inteligencia', modificadorCaracteristica: 4, rangos: 0, rangosVarios: 0, varios: null, total: 4,
                    desglose: [],
                },
                {
                    id: 2, nombre: 'Cocina', custom: true, deClase: true, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Sabiduría', modificadorCaracteristica: 4, rangos: 2, rangosVarios: 0, varios: null, total: 6,
                    desglose: [],
                },
                {
                    id: 3, nombre: 'Cetrería', custom: true, deClase: false, idExtra: null, extra: null, extraComodin: null,
                    caracteristica: 'Carisma', modificadorCaracteristica: 0, rangos: 1, rangosVarios: 0, varios: null, total: 1,
                    desglose: [],
                },
            ],
        });
        const campo = (nombre: string) => form.getTextField(nombre).getText() ?? '';

        expect(campo('fort')).toBe('11');
        expect(campo('ref')).toBe('14');
        expect(campo('vol')).toBe('6');
        expect(campo('iniciativa')).toBe('8');
        expect(campo('presa')).toBe('20');
        // Avistar es la habilidad 6 (`rangos5`) y su total, el de la API (con lo que la hoja no suma).
        expect(campo('total_avistar')).toBe('20');
        expect(campo('total_artesania2')).toBe('4');
        expect(campo('total_custom1')).toBe('6');
        expect(campo('total_custom2')).toBe('1');
        // Las que la ficha no trae se quedan como en la plantilla.
        expect(campo('total_abrir_cerraduras')).toBe('0');
    });

    it('quita todos los paréntesis de las clases', async () => {
        const form = await hojaDe({
            clases: [
                { id: 6, nombre: 'Explorador', nivel: 8, lanzaConjuros: true, caracteristicaLanzamiento: 'Sabiduría', modificadorLanzamiento: 4 },
                { id: 1, nombre: 'Guerrero', nivel: 2, lanzaConjuros: false },
            ],
        });

        expect(form.getTextField('clase').getText()).not.toMatch(/[()]/);
        expect(form.getTextField('clase').getText()).toContain('Guerrero 2');
    });

    it('una característica sin valor sale con «—», no con «null»', async () => {
        const form = await hojaDe({ co: 0, mco: null });

        expect(form.getTextField('con').getText()).toBe('—');
        expect(form.getTextField('mod_con').getText()).toBe('—');
        expect(form.getTextField('mod_fue').getText()).toBe('+8');
        expect(form.getTextField('mod_car').getText()).toBe('0');
    });

    it('los idiomas que no caben van todos a las notas, con su título', async () => {
        const idi = Array.from({ length: 12 }, (_, i) => ({ Nombre: `Idioma ${i + 1}`, Descripcion: '', Secreto: false, Oficial: true }));
        const form = await hojaDe({ idi });
        const notas = form.getTextField('notas').getText() ?? '';

        expect(form.getTextField('idioma9').getText()).toBe('Idioma 9');
        expect(notas.replace(/\r\n/g, '\n')).toContain('Idiomas que no cabían: \n - Idioma 10\n - Idioma 11\n - Idioma 12');
    });

    it('enseña el aviso de elementos no oficiales solo en un personaje homebrew', async () => {
        const oculto = (form: PDFForm) => form.getTextField('oficial').acroField.getWidgets()
            .every((widget) => (widget.getFlags() & AnnotationFlags.Hidden) !== 0);

        expect(oculto(await hojaDe({ o: true }))).toBeTrue();
        const homebrew = await hojaDe({ o: false });
        expect(oculto(homebrew)).toBeFalse();
        expect(homebrew.getTextField('oficial').getText()).toBe('Contiene elementos no oficiales');
    });

    it('escribe los usos diarios de una sortílega como los da la API', async () => {
        const escrito = new Map<string, string>();
        spyOn<any>(service, 'trySetText').and.callFake((_form: unknown, campo: string, valor: string) => escrito.set(campo, valor));
        const pj = {
            ...crearPersonajeBase(),
            Sortilegas: [
                { Conjuro: { Nombre: 'Luz', Manual: 'Manual del jugador' }, Nivel_lanzador: 3, Usos_diarios: '3/día', Descripcion: '' },
                { Conjuro: { Nombre: 'Detectar magia', Manual: 'Manual del jugador' }, Nivel_lanzador: 3, Usos_diarios: 'A voluntad', Descripcion: '' },
            ],
        } as any;

        await service.generarPDF_Conjuros(pj);

        expect(escrito.get('desc_con0')).toContain('Usos diarios: 3/día');
        expect(escrito.get('desc_con1')).toContain('Usos diarios: A voluntad');
        expect(escrito.get('desc_con0')).toContain('Nivel de lanzador: 3');
    });

    it('escribe en la hoja la defensa, el equipo y el dinero de la ficha', async () => {
        const plantilla = await plantillaFicha(fetchOriginal);
        fetchSpy.and.returnValue(Promise.resolve({ arrayBuffer: () => Promise.resolve(plantilla) } as any));
        const personajeSvc = new PersonajeService({ currentUser: null } as any, {} as any);
        const pj = (personajeSvc as any).mapApiDetalleToPersonaje(crearDetalleApi(crearEquipoFichaApi()));

        await service.generarPDF(pj);

        const blob = saveAsSpy.calls.mostRecent().args[0] as Blob;
        const form = (await PDFDocument.load(await blob.arrayBuffer())).getForm();
        const campo = (nombre: string) => form.getTextField(nombre).getText();
        expect(campo('ca')).toBe('18');
        expect(campo('ca_toque')).toBe('11');
        expect(campo('ca_desprevenido')).toBe('16');
        expect(campo('ca_armadura')).toBe('5');
        expect(campo('ca_escudo')).toBe('1');
        expect(campo('mod_magico_voluntad')).toBe('1');
        expect(campo('armadura')).toBe('Cota de mallas');
        expect(campo('escudo')).toBe('Rodela');
        expect(campo('ataque_arma1')).toBe('Daga');
        expect(campo('daño_arma1')).toBe('1d6');
        expect(campo('objeto1')).toBe('Flechas ×20');
        expect(campo('peso_total')).toBe('96');
        expect(campo('monedas_oro')).toBe('12,5');
        expect(campo('fallo_arcano')).toBe('35');
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
