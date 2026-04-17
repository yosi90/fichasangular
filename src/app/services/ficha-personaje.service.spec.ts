import { PDFDocument } from 'pdf-lib';
import * as fileSaver from 'file-saver';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje } from '../interfaces/personaje';
import { FichaPersonajeService } from './ficha-personaje.service';

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
            Fuerza: 10,
            Destreza: 10,
            Constitucion: 10,
            Inteligencia: 10,
            Sabiduria: 10,
            Carisma: 10,
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
