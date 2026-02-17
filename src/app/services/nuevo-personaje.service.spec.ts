import { NuevoPersonajeService } from './nuevo-personaje.service';
import { VentajaDetalle } from '../interfaces/ventaja';
import { HabilidadBasicaDetalle } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { createRacialPlaceholder } from './utils/racial-mapper';
import { Plantilla } from '../interfaces/plantilla';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';

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
        const sortilegaBase = {
            Conjuro: { Id: 9, Nombre: 'Detectar pensamientos' },
            Nivel_lanzador: 8,
            Usos_diarios: 'A voluntad',
            Descripcion: 'Innata',
            Dgs_necesarios: 0,
            Origen: '',
        };
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
            Sortilegas: [sortilegaBase],
        } as unknown as Raza;

        svc.seleccionarRaza(razaMock);

        expect(svc.PersonajeCreacion.Raciales.length).toBe(1);
        expect(svc.PersonajeCreacion.Raciales[0].Id).toBe(5);
        expect(svc.PersonajeCreacion.Raciales[0].Nombre).toBe('Sangre antigua');
        expect(svc.PersonajeCreacion.Raciales[0].Origen).toBe('Elfo');
        expect(svc.PersonajeCreacion.Sortilegas.length).toBe(1);
        expect(svc.PersonajeCreacion.Sortilegas[0].Conjuro.Nombre).toBe('Detectar pensamientos');
        expect(svc.PersonajeCreacion.Sortilegas[0].Origen).toBe('Elfo');
    });

    it('seleccionarRaza reemplaza sortilegas previas cuando la nueva raza no aporta', () => {
        const svc = new NuevoPersonajeService();
        svc.PersonajeCreacion.Sortilegas = [{
            Conjuro: { Id: 5, Nombre: 'Imagen silenciosa' } as any,
            Nivel_lanzador: 3,
            Usos_diarios: '1/dia',
            Descripcion: '',
            Dgs_necesarios: 0,
            Origen: 'Raza vieja',
        }];

        const razaSinSortilegas = {
            Id: 1,
            Nombre: 'Humano',
            Alineamiento: { Basico: { Nombre: 'Neutral autentico' } },
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
            Raciales: [],
            Sortilegas: [],
        } as unknown as Raza;

        svc.seleccionarRaza(razaSinSortilegas);

        expect(svc.PersonajeCreacion.Sortilegas.length).toBe(0);
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

    it('guarda origen en rasgos obtenidos, idiomas y lista de ventajas', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaIdioma.Id);
        service.seleccionarIdiomaParaVentaja(ventajaIdioma.Id, idiomaComun);

        const rasgo = service.PersonajeCreacion.Raciales.find((r) => r.Nombre === 'Sangre antigua');
        const idioma = service.PersonajeCreacion.Idiomas.find((i) => i.Nombre === 'Comun');
        const ventajaIdiomaGuardada = service.PersonajeCreacion.Ventajas
            .find((v) => typeof v !== 'string' && v.Nombre === 'Linguista');
        const desventajaGuardada = service.PersonajeCreacion.Ventajas
            .find((v) => typeof v !== 'string' && v.Nombre === 'Miope');

        expect(rasgo?.Origen).toBe('Rasgo raro');
        expect(idioma?.Origen).toBe('Linguista');
        expect(idioma?.Descripcion).toBe('Idioma comun');
        expect(typeof ventajaIdiomaGuardada !== 'string' ? ventajaIdiomaGuardada?.Origen : '').toBe('Ventaja');
        expect(typeof desventajaGuardada !== 'string' ? desventajaGuardada?.Origen : '').toBe('Desventaja');
    });

    it('pendientesOro se acumula y no altera Oro_inicial', () => {
        const oroBase = service.PersonajeCreacion.Oro_inicial;
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaOro.Id);

        expect(service.EstadoFlujo.ventajas.pendientesOro.length).toBe(2);
        expect(service.PersonajeCreacion.Oro_inicial).toBe(oroBase);
    });
});

describe('NuevoPersonajeService (tipo y subtipos derivados)', () => {
    function crearTipo(id: number, nombre: string): TipoCriatura {
        return {
            Id: id,
            Nombre: nombre,
            Descripcion: `Tipo ${nombre}`,
            Manual: 'Manual test',
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        };
    }

    function crearRazaMock(tipo: TipoCriatura, subtipos: { Id: number; Nombre: string; }[]): Raza {
        return {
            Id: 1,
            Nombre: 'Raza base',
            Alineamiento: {
                Basico: { Nombre: 'Neutral autentico' },
            },
            Tipo_criatura: tipo,
            Subtipos: subtipos,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [],
        } as unknown as Raza;
    }

    function crearPlantillaMock(partial?: Partial<Plantilla>): Plantilla {
        return {
            Id: 100,
            Nombre: 'Plantilla test',
            Descripcion: '',
            Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
            Tamano: { Id: 0, Nombre: '-', Modificador: 0, Modificador_presa: 0 },
            Tipo_dado: { Id_tipo_dado: 0, Nombre: '' },
            Actualiza_dg: false,
            Modificacion_dg: { Id_paso_modificacion: 0, Nombre: '' },
            Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: '' },
            Iniciativa: 0,
            Velocidades: '',
            Ca: '',
            Ataque_base: 0,
            Presa: 0,
            Ataques: '',
            Ataque_completo: '',
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
            Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Minimos_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Ajuste_nivel: 0,
            Licantronia_dg: { Id_dado: 0, Dado: '', Multiplicador: 0, Suma: 0 },
            Cd: 0,
            Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
            Nacimiento: false,
            Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
            Maniobrabilidad: {
                Id: 0,
                Nombre: '',
                Velocidad_avance: '',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '',
                Rotacion: '',
                Giro_max: '',
                Angulo_ascenso: '',
                Velocidad_ascenso: '',
                Angulo_descenso: '',
                Descenso_ascenso: 0,
            },
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: '' },
                Ley: { Id_ley: 0, Nombre: '' },
                Moral: { Id_moral: 0, Nombre: '' },
                Prioridad: { Id_prioridad: 0, Nombre: '' },
                Descripcion: '',
            },
            Oficial: true,
            Dotes: [],
            Subtipos: [],
            Habilidades: [],
            Sortilegas: [],
            Prerrequisitos_flags: {
                actitud_requerido: false,
                actitud_prohibido: false,
                alineamiento_requerido: false,
                caracteristica: false,
                criaturas_compatibles: false,
            },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [],
            },
            Compatibilidad_tipos: [],
            ...partial,
        };
    }

    it('seleccionarRaza fija tipo y subtipos base', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(1);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Humanoide');
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
    });

    it('agregar plantilla que cambia tipo actualiza Personaje.Tipo_criatura', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoExterno = crearTipo(5, 'Extraplanar');
        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoExterno]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 201,
            Nombre: 'Medio celestial',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 5,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Extraplanar',
                Opcional: 0,
            }],
        }));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(5);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Extraplanar');
        expect(svc.EstadoFlujo.plantillas.tipoCriaturaSimulada.Id).toBe(5);
    });

    it('subtipos: reemplazo por ultima plantilla y restauracion al quitar', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        const plantillaA = crearPlantillaMock({
            Id: 301,
            Nombre: 'Tocada por fuego',
            Subtipos: [{ Id: 21, Nombre: 'Fuego' }],
        });
        const plantillaB = crearPlantillaMock({
            Id: 302,
            Nombre: 'Tocada por frio',
            Subtipos: [{ Id: 22, Nombre: 'Frio' }],
        });

        svc.agregarPlantillaSeleccion(plantillaA);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 21, Nombre: 'Fuego' }]);

        svc.agregarPlantillaSeleccion(plantillaB);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 22, Nombre: 'Frio' }]);

        svc.quitarPlantillaSeleccion(302);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 21, Nombre: 'Fuego' }]);
    });

    it('limpiar plantillas restaura tipo y subtipos de la raza', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoExterno = crearTipo(5, 'Extraplanar');
        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoExterno]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 401,
            Nombre: 'Medio celestial',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 5,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Extraplanar',
                Opcional: 0,
            }],
            Subtipos: [{ Id: 41, Nombre: 'Celestial' }],
        }));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(5);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 41, Nombre: 'Celestial' }]);

        svc.limpiarPlantillasSeleccion();
        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(1);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Humanoide');
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
    });

    it('pierde Constitución al cambiar el tipo resultante a no-muerto', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;

        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 501,
            Nombre: 'Plantilla no-muerta',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 6,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Muerto viviente',
                Opcional: 0,
            }],
        }));

        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('restaura Constitución al quitar plantilla que causaba pérdida', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;

        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        const plantillaNoMuerta = crearPlantillaMock({
            Id: 502,
            Nombre: 'Plantilla no-muerta',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 6,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Muerto viviente',
                Opcional: 0,
            }],
        });

        svc.agregarPlantillaSeleccion(plantillaNoMuerta);
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();

        svc.quitarPlantillaSeleccion(plantillaNoMuerta.Id);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeFalse();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeFalse();
        expect(svc.PersonajeCreacion.Constitucion).toBe(13);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(1);
    });

    it('interpreta Pierde_constitucion=1 como activo', () => {
        const svc = new NuevoPersonajeService();
        const tipoNoMuerto = {
            ...crearTipo(6, 'Muerto viviente'),
            Pierde_constitucion: 1 as unknown as boolean,
        };

        svc.setCatalogoTiposCriatura([tipoNoMuerto as unknown as TipoCriatura]);
        svc.seleccionarRaza(crearRazaMock(tipoNoMuerto as unknown as TipoCriatura, []));
        const aplicado = svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: null,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(aplicado).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('ignora modificadores de CON mientras está perdida', () => {
        const svc = new NuevoPersonajeService();
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;
        const ventajaCon = crearVentajaBase({
            Id: 901,
            Nombre: 'Fortaleza antinatural',
            Coste: -1,
            Mejora: 2,
            Constitucion: true,
        });

        svc.setCatalogoTiposCriatura([tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoNoMuerto, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: null,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        svc.setCatalogosVentajas([ventajaCon], []);
        svc.toggleVentaja(ventajaCon.Id);

        expect(svc.PersonajeCreacion.CaracteristicasVarios.Constitucion.length).toBe(1);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('mecanismo de perdida por clave funciona en una caracteristica distinta de CON', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        (svc as any).setCaracteristicaPerdida('Fuerza', true, 'test');
        (svc as any).aplicarCaracteristicasFinalesDesdeBase();

        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Fuerza).toBeTrue();
        expect(svc.PersonajeCreacion.Fuerza).toBe(0);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(0);

        (svc as any).setCaracteristicaPerdida('Fuerza', false, 'test');
        (svc as any).aplicarCaracteristicasFinalesDesdeBase();

        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Fuerza).toBeFalse();
        expect(svc.PersonajeCreacion.Fuerza).toBe(14);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(2);
    });

    it('fase 2: aplica modificadores/minimos de plantilla y defensas', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        const raza = crearRazaMock(tipoHumanoide, []);
        (raza as any).Armadura_natural = 1;
        (raza as any).Varios_armadura = 0;
        (raza as any).Reduccion_dano = '5/frio';
        svc.seleccionarRaza(raza);
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 810,
            Nombre: 'Liche',
            Ataque_base: 1,
            Ca: '+5 armadura natural',
            Iniciativa: 2,
            Presa: 4,
            Reduccion_dano: '15/contundente y magia',
            Resistencia_conjuros: '32',
            Resistencia_elemental: 'Frio 10',
            Modificadores_caracteristicas: {
                Fuerza: 2,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Minimos_caracteristicas: {
                Fuerza: 18,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
        }));

        expect(svc.PersonajeCreacion.Fuerza).toBe(18);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(4);
        expect(svc.PersonajeCreacion.Armadura_natural).toBe(6);
        expect(svc.PersonajeCreacion.Ca).toBe(17);
        expect(svc.PersonajeCreacion.Ataque_base).toBe('1');
        expect(svc.PersonajeCreacion.Rds.length).toBe(2);
        expect(svc.PersonajeCreacion.Rcs.length).toBe(1);
        expect(svc.PersonajeCreacion.Res.length).toBe(1);
    });

    it('fase 2: aplica NEP/experiencia/oro con ajuste de nivel de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 811,
            Nombre: 'Liche',
            Ajuste_nivel: 4,
        }));

        expect(svc.PersonajeCreacion.NEP).toBe(4);
        expect(svc.PersonajeCreacion.Experiencia).toBe(6000);
        expect(svc.PersonajeCreacion.Oro_inicial).toBe(5400);
    });

    it('fase 2: aplica alineamiento por prioridad de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const raza = crearRazaMock(tipoHumanoide, []);
        (raza as any).Alineamiento = {
            Basico: { Nombre: 'Legal bueno' },
        };
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(raza);
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 812,
            Nombre: 'Liche',
            Alineamiento: {
                Id: 32,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 10, Nombre: 'Ninguna preferencia' },
                Moral: { Id_moral: 6, Nombre: 'Siempre maligno' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: 'Se debe respetar a raja tabla.',
            },
        }));

        expect(svc.PersonajeCreacion.Alineamiento).toBe('Legal maligno');
    });

    it('fase 2: aplica habilidades/ataques/dado de golpe de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.setCatalogoHabilidades([{
            Id_habilidad: 6,
            Nombre: 'Avistar',
            Id_caracteristica: 5,
            Caracteristica: 'Sabiduria',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        }]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 813,
            Nombre: 'Liche',
            Tipo_dado: {
                Id_tipo_dado: 5,
                Nombre: 'd12',
            },
            Habilidades: [{
                Id_habilidad: 6,
                Habilidad: 'Avistar',
                Id_caracteristica: 5,
                Caracteristica: 'Sabiduria',
                Descripcion: '',
                Soporta_extra: false,
                Entrenada: false,
                Id_extra: -1,
                Extra: '-',
                Rangos: 8,
                Varios: 'No especifica',
            }],
            Ataques: 'Toque corruptor',
        }));

        const avistar = svc.PersonajeCreacion.Habilidades.find((h) => h.Id === 6);
        expect(avistar?.Rangos_varios).toBe(8);
        expect(svc.PersonajeCreacion.Dados_golpe).toBe(12);
        const ataqueRacial = svc.PersonajeCreacion.Raciales.find((r) => r.Nombre.includes('Toque corruptor'));
        expect(ataqueRacial?.Origen).toBe('Liche');
    });
});
