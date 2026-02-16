import { NuevoPersonajeService } from './nuevo-personaje.service';
import { VentajaDetalle } from '../interfaces/ventaja';
import { HabilidadBasicaDetalle } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { createRacialPlaceholder } from './utils/racial-mapper';
import { Raza } from '../interfaces/raza';

const GENERADOR_CONFIG_STORAGE_KEY = 'fichas35.nuevoPersonaje.generador.config.v1';

function crearVentajaBase(partial: Partial<VentajaDetalle>): VentajaDetalle {
    return {
        Id: 0,
        Nombre: 'Mock',
        Descripcion: '',
        Disipable: false,
        Coste: -1,
        Mejora: 0,
        Caracteristica: false,
        Fuerza: false,
        Destreza: false,
        Constitucion: false,
        Inteligencia: false,
        Sabiduria: false,
        Carisma: false,
        Fortaleza: false,
        Reflejos: false,
        Voluntad: false,
        Iniciativa: false,
        Duplica_oro: false,
        Aumenta_oro: false,
        Idioma_extra: false,
        Manual: { Id: 0, Nombre: '', Pagina: 0 },
        Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
        Idioma: { Id: 0, Nombre: '', Descripcion: '' },
        Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
        Oficial: true,
        ...partial,
    };
}

describe('NuevoPersonajeService (generador)', () => {
    beforeEach(() => {
        localStorage.removeItem(GENERADOR_CONFIG_STORAGE_KEY);
    });

    afterEach(() => {
        localStorage.removeItem(GENERADOR_CONFIG_STORAGE_KEY);
    });

    it('usa defaults cuando no hay configuración persistida', () => {
        const service = new NuevoPersonajeService();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(3);
    });

    it('carga mínimo y tablas desde localStorage cuando son válidos', () => {
        localStorage.setItem(GENERADOR_CONFIG_STORAGE_KEY, JSON.stringify({
            minimoSeleccionado: 8,
            tablasPermitidas: 5,
        }));

        const service = new NuevoPersonajeService();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(8);
        expect(estado.tablasPermitidas).toBe(5);
    });

    it('si localStorage está corrupto usa defaults', () => {
        localStorage.setItem(GENERADOR_CONFIG_STORAGE_KEY, '{esto-no-es-json');

        const service = new NuevoPersonajeService();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(3);
    });

    it('si localStorage tiene valores inválidos usa defaults', () => {
        localStorage.setItem(GENERADOR_CONFIG_STORAGE_KEY, JSON.stringify({
            minimoSeleccionado: 'invalido',
            tablasPermitidas: null,
        }));

        const service = new NuevoPersonajeService();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(3);
    });

    it('seleccionar tabla activa la pool y cambiar a otra resetea asignaciones', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        const cambio = service.seleccionarTablaGenerador(2);

        expect(cambio).toBeTrue();
        expect(service.EstadoFlujo.generador.tablaSeleccionada).toBe(2);
        expect(service.EstadoFlujo.generador.asignaciones.Fuerza).toBeNull();
        expect(service.EstadoFlujo.generador.poolDisponible.length).toBe(6);
    });

    it('setMinimoGenerador persiste y resetea estado del generador', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        service.setMinimoGenerador(9);

        const estado = service.EstadoFlujo.generador;
        expect(estado.minimoSeleccionado).toBe(9);
        expect(estado.tablaSeleccionada).toBeNull();
        expect(estado.poolDisponible.length).toBe(0);
        expect(estado.asignaciones.Fuerza).toBeNull();
    });

    it('setTablasPermitidasGenerador persiste y resetea estado del generador', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        service.setTablasPermitidasGenerador(4);

        const estado = service.EstadoFlujo.generador;
        expect(estado.tablasPermitidas).toBe(4);
        expect(estado.tablaSeleccionada).toBeNull();
        expect(estado.poolDisponible.length).toBe(0);
        expect(estado.asignaciones.Fuerza).toBeNull();
    });
});

describe('NuevoPersonajeService (ventajas/desventajas)', () => {
    let service: NuevoPersonajeService;
    let ventajaFuerza: VentajaDetalle;
    let ventajaSalvacion: VentajaDetalle;
    let ventajaHabilidad: VentajaDetalle;
    let ventajaIdioma: VentajaDetalle;
    let ventajaRasgo: VentajaDetalle;
    let ventajaOro: VentajaDetalle;
    let desventajaPuntos: VentajaDetalle;
    let habilidadAvistar: HabilidadBasicaDetalle;
    let idiomaComun: IdiomaDetalle;

    beforeEach(() => {
        localStorage.removeItem(GENERADOR_CONFIG_STORAGE_KEY);
        service = new NuevoPersonajeService();

        habilidadAvistar = {
            Id_habilidad: 1,
            Nombre: 'Avistar',
            Id_caracteristica: 5,
            Caracteristica: 'Sabiduria',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        };
        service.setCatalogoHabilidades([habilidadAvistar]);

        idiomaComun = {
            Id: 1,
            Nombre: 'Comun',
            Descripcion: 'Idioma comun',
            Secreto: false,
            Oficial: true,
        };
        service.setCatalogoIdiomas([idiomaComun]);

        ventajaFuerza = crearVentajaBase({
            Id: 101,
            Nombre: 'Fuerza brutal',
            Coste: -2,
            Mejora: 2,
            Fuerza: true,
        });
        ventajaSalvacion = crearVentajaBase({
            Id: 102,
            Nombre: 'Voluntad firme',
            Coste: -1,
            Mejora: 1,
            Voluntad: true,
            Iniciativa: true,
        });
        ventajaHabilidad = crearVentajaBase({
            Id: 103,
            Nombre: 'Ojo agudo',
            Coste: -1,
            Mejora: 2,
            Habilidad: { Id: 1, Nombre: 'Avistar', Descripcion: '' },
        });
        ventajaIdioma = crearVentajaBase({
            Id: 104,
            Nombre: 'Linguista',
            Coste: -1,
            Mejora: 0,
            Idioma_extra: true,
        });
        ventajaRasgo = crearVentajaBase({
            Id: 105,
            Nombre: 'Rasgo raro',
            Coste: -1,
            Mejora: 0,
            Rasgo: { Id: 7, Nombre: 'Sangre antigua', Descripcion: '' },
        });
        ventajaOro = crearVentajaBase({
            Id: 106,
            Nombre: 'Avaro',
            Coste: -1,
            Mejora: 0,
            Duplica_oro: true,
            Aumenta_oro: true,
        });
        desventajaPuntos = crearVentajaBase({
            Id: 201,
            Nombre: 'Miope',
            Coste: 2,
            Mejora: 0,
        });

        service.setCatalogosVentajas(
            [ventajaFuerza, ventajaSalvacion, ventajaHabilidad, ventajaIdioma, ventajaRasgo, ventajaOro],
            [desventajaPuntos]
        );
    });

    it('selección de desventaja aumenta puntos disponibles', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        expect(service.EstadoFlujo.ventajas.puntosDisponibles).toBe(2);
    });

    it('selección de ventaja consume puntos y respeta límite de 3', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaFuerza.Id);
        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        const cuarto = service.toggleVentaja(ventajaRasgo.Id);

        expect(service.EstadoFlujo.ventajas.seleccionVentajas.length).toBe(3);
        expect(service.EstadoFlujo.ventajas.puntosGastados).toBe(4);
        expect(cuarto.toggled).toBeFalse();
        expect(cuarto.reason).toBe('max_reached');
    });

    it('déficit permite edición pero bloquea continuar', () => {
        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.EstadoFlujo.ventajas.hayDeficit).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeFalse();
    });

    it('seleccionar y deseleccionar revierte características con origen', () => {
        const base = service.PersonajeCreacion.Fuerza;
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.PersonajeCreacion.Fuerza).toBe(base + 2);
        expect(service.PersonajeCreacion.CaracteristicasVarios.Fuerza.length).toBe(1);

        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.PersonajeCreacion.Fuerza).toBe(base);
        expect(service.PersonajeCreacion.CaracteristicasVarios.Fuerza.length).toBe(0);
    });

    it('seleccionar y deseleccionar revierte salvaciones, iniciativa y habilidades', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.length).toBe(1);
        expect(service.PersonajeCreacion.Iniciativa_varios.length).toBe(1);
        expect(service.PersonajeCreacion.Habilidades.find(h => h.Id === 1)?.Rangos_varios).toBe(2);

        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.length).toBe(0);
        expect(service.PersonajeCreacion.Iniciativa_varios.length).toBe(0);
        expect(service.PersonajeCreacion.Habilidades.find(h => h.Id === 1)?.Rangos_varios).toBe(0);
    });

    it('Rasgo se añade deduplicado', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        expect(service.PersonajeCreacion.Raciales.filter(r => r.Nombre === 'Sangre antigua').length).toBe(1);
    });

    it('seleccionarRaza precarga raciales desde la raza', () => {
        const svc = new NuevoPersonajeService();
        const racialBase = createRacialPlaceholder('Sangre antigua', 5);
        const razaMock = {
            Id: 1,
            Nombre: 'Elfo',
            Alineamiento: {
                Basico: { Nombre: 'Neutral autentico' },
            },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [racialBase],
        } as unknown as Raza;

        svc.seleccionarRaza(razaMock);

        expect(svc.PersonajeCreacion.Raciales.length).toBe(1);
        expect(svc.PersonajeCreacion.Raciales[0].Id).toBe(5);
        expect(svc.PersonajeCreacion.Raciales[0].Nombre).toBe('Sangre antigua');
    });

    it('Rasgo no duplica una racial ya presente en la base', () => {
        const svc = new NuevoPersonajeService();
        const baseRacial = createRacialPlaceholder('Sangre antigua', 7);
        svc.PersonajeCreacion.Raciales = [baseRacial];
        svc.setCatalogoHabilidades([habilidadAvistar]);
        svc.setCatalogosVentajas([ventajaRasgo], []);

        svc.toggleVentaja(ventajaRasgo.Id);

        expect(svc.PersonajeCreacion.Raciales.filter(r => r.Nombre === 'Sangre antigua').length).toBe(1);
    });

    it('Idioma_extra requiere idioma elegido para continuar', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        const result = service.toggleVentaja(ventajaIdioma.Id);
        expect(result.requiresIdiomaSelection).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeFalse();

        const assigned = service.seleccionarIdiomaParaVentaja(ventajaIdioma.Id, idiomaComun);
        expect(assigned).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeTrue();
    });

    it('pendientesOro se acumula y no altera Oro_inicial', () => {
        const oroBase = service.PersonajeCreacion.Oro_inicial;
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaOro.Id);

        expect(service.EstadoFlujo.ventajas.pendientesOro.length).toBe(2);
        expect(service.PersonajeCreacion.Oro_inicial).toBe(oroBase);
    });
});
