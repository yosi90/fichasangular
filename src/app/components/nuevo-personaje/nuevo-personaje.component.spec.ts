import Swal from 'sweetalert2';
import { Campana } from 'src/app/interfaces/campaña';
import { Clase } from 'src/app/interfaces/clase';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { Raza } from 'src/app/interfaces/raza';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { AsignacionCaracteristicas, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { NuevoPersonajeComponent } from './nuevo-personaje.component';
import { Subject, of } from 'rxjs';

function crearRazaMock(oficial = true): Raza {
    return {
        Id: 1,
        Nombre: 'Elfo',
        Ajuste_nivel: 0,
        Manual: 'Manual base',
        Clase_predilecta: 'Mago',
        Modificadores: {
            Fuerza: 0,
            Destreza: 2,
            Constitucion: -2,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: 'Neutral bueno' },
            Ley: { Id_ley: 2, Nombre: 'Tendencia caotica' },
            Moral: { Id_moral: 1, Nombre: 'Tendencia buena' },
            Prioridad: { Id_prioridad: 1, Nombre: 'Moral' },
            Descripcion: 'Mock',
        },
        Oficial: oficial,
        Ataques_naturales: 'No especifica',
        Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dgs_adicionales: {
            Cantidad: 0,
            Dado: 'd8',
            Tipo_criatura: 'Humanoide',
            Ataque_base: 0,
            Dotes_extra: 0,
            Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 1,
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
        },
        Reduccion_dano: 'No especifica',
        Resistencia_magica: 'No especifica',
        Resistencia_energia: 'No especifica',
        Heredada: false,
        Mutada: false,
        Tamano_mutacion_dependiente: false,
        Prerrequisitos: {
            actitud_prohibido: [],
            actitud_requerido: [],
            alineamiento_prohibido: [],
            alineamiento_requerido: [],
            tipo_criatura: [],
        },
        Armadura_natural: 0,
        Varios_armadura: 0,
        Correr: 30,
        Nadar: 0,
        Volar: 0,
        Maniobrabilidad: {
            Id: 0,
            Nombre: '-',
            Velocidad_avance: 'N/A',
            Flotar: 0,
            Volar_atras: 0,
            Contramarcha: 0,
            Giro: 'N/A',
            Rotacion: 'N/A',
            Giro_max: 'N/A',
            Angulo_ascenso: 'N/A',
            Velocidad_ascenso: 'N/A',
            Angulo_descenso: 'N/A',
            Descenso_ascenso: 0,
        },
        Trepar: 0,
        Escalar: 0,
        Altura_rango_inf: 1.5,
        Altura_rango_sup: 1.9,
        Peso_rango_inf: 55,
        Peso_rango_sup: 85,
        Edad_adulto: 20,
        Edad_mediana: 40,
        Edad_viejo: 60,
        Edad_venerable: 80,
        Espacio: 5,
        Alcance: 5,
        Tipo_criatura: {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: 'Mock',
            Manual: 'Mock',
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
        },
        Subtipos: [],
        Sortilegas: [],
        Raciales: [],
        Habilidades: { Base: [], Custom: [] },
        DotesContextuales: [],
    };
}

function crearRazaConAlineamientoBasico(nombre: string): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = nombre;
    return raza;
}

function crearRazaConPreferenciasSinBasico(ley: string, moral: string): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = 'No aplica';
    raza.Alineamiento.Ley.Nombre = ley;
    raza.Alineamiento.Moral.Nombre = moral;
    raza.Alineamiento.Prioridad = { Id_prioridad: 3, Nombre: 'Siempre' };
    return raza;
}

function crearRazaConConflictoDuroAlineamiento(): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = 'Legal maligno';
    raza.Alineamiento.Ley.Nombre = 'Siempre legal';
    raza.Alineamiento.Moral.Nombre = 'Siempre maligno';
    raza.Alineamiento.Prioridad = { Id_prioridad: 3, Nombre: 'Siempre' };
    return raza;
}

function crearRazaConPrioridadNoDura(): Raza {
    const raza = crearRazaConConflictoDuroAlineamiento();
    raza.Alineamiento.Ley.Nombre = 'Casi siempre legal';
    raza.Alineamiento.Moral.Nombre = 'Casi siempre maligno';
    raza.Alineamiento.Prioridad = { Id_prioridad: 2, Nombre: 'Casi siempre' };
    return raza;
}

function crearRazaMutadaConPrerequisito(): Raza {
    const raza = crearRazaMock();
    raza.Id = 99;
    raza.Nombre = 'Mutada celestial';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: true };
    (raza as any).Prerrequisitos_flags = {
        alineamiento_requerido: true,
    };
    (raza as any).Prerrequisitos = {
        alineamiento_requerido: [{ id_alineamiento: 1, opcional: 0 }],
    };
    return raza;
}

function crearRazaMutadaConWarning(): Raza {
    const raza = crearRazaMock();
    raza.Id = 199;
    raza.Nombre = 'Mutada incierta';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: true };
    (raza as any).Prerrequisitos_flags = {
        alineamiento_requerido: true,
    };
    (raza as any).Prerrequisitos = {
        alineamiento_requerido: [{ id_ley: 99, opcional: 0 }],
    };
    return raza;
}

function crearRazaConRacialesOpcionales(): Raza {
    const raza = crearRazaMock();
    raza.Id = 300;
    raza.Nombre = 'Prole de bahamut';
    raza.Raciales = [
        {
            Id: 1,
            Nombre: 'Vision en la oscuridad',
            Descripcion: '',
            Opcional: 0,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
        {
            Id: 2,
            Nombre: 'Linaje de plata',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
        {
            Id: 3,
            Nombre: 'Linaje de bronce',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
    ];
    return raza;
}

function crearRazaMutadaConRacialesOpcionalesPrereq(): Raza {
    const raza = crearRazaConRacialesOpcionales();
    raza.Id = 301;
    raza.Nombre = 'Prole mutada';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: false };
    raza.Raciales = [
        {
            Id: 2,
            Nombre: 'Linaje de plata',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 301 }], caracteristica: [] },
        } as any,
        {
            Id: 3,
            Nombre: 'Linaje de bronce',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 10 }], caracteristica: [] },
        } as any,
    ];
    return raza;
}

function crearRazaMutadaConOpcionalesBloqueadas(): Raza {
    const raza = crearRazaMutadaConRacialesOpcionalesPrereq();
    raza.Id = 302;
    raza.Nombre = 'Mutada bloqueada';
    raza.Raciales = [
        {
            Id: 40,
            Nombre: 'Linaje imposible A',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 999 }], caracteristica: [] },
        } as any,
        {
            Id: 41,
            Nombre: 'Linaje imposible B',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 998 }], caracteristica: [] },
        } as any,
    ];
    return raza;
}

function crearClaseMock(partial?: Partial<Clase>): Clase {
    return {
        Id: 1,
        Nombre: 'Guerrero',
        Descripcion: 'Clase base',
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
        Tipo_dado: { Id: 1, Nombre: 'd10' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Mod_salv_conjuros: '',
        Conjuros: {
            Dependientes_alineamiento: false,
            Divinos: false,
            Arcanos: false,
            Psionicos: false,
            Alma: false,
            Conocidos_total: false,
            Conocidos_nivel_a_nivel: false,
            Dominio: false,
            puede_elegir_especialidad: false,
            Lanzamiento_espontaneo: false,
            Clase_origen: { Id: 0, Nombre: '' },
            Listado: [],
        },
        Roles: { Dps: true, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: false,
        Prestigio: false,
        Tiene_prerrequisitos: false,
        Alineamiento: {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' },
            Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
            Descripcion: '',
        },
        Oficial: true,
        Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Habilidades: { Base: [], Custom: [] },
        Idiomas: [],
        Desglose_niveles: [{
            Nivel: 1,
            Ataque_base: '+1',
            Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: crearConjurosDiariosMock(),
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
        }],
        Prerrequisitos_flags: {},
        Prerrequisitos: {
            subtipo: [],
            caracteristica: [],
            dg: [],
            dominio: [],
            nivel_escuela: [],
            ataque_base: [],
            reserva_psionica: [],
            lanzar_poder_psionico_nivel: [],
            conocer_poder_psionico: [],
            genero: [],
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            dote_elegida: [],
            rangos_habilidad: [],
            idioma: [],
            alineamiento_requerido: [],
            alineamiento_prohibido: [],
            actitud_requerido: [],
            actitud_prohibido: [],
            lanzador_arcano: [],
            lanzador_divino: [],
            lanzar_conjuros_arcanos_nivel: [],
            lanzar_conjuros_divinos_nivel: [],
            conjuro_conocido: [],
            inherente: [],
            clase_especial: [],
            tamano_maximo: [],
            tamano_minimo: [],
            raza: [],
            no_raza: [],
        },
        ...partial,
    };
}

function crearConjurosDiariosMock(nivelesAccesibles: number[] = []): Record<string, number> {
    const diarios: Record<string, number> = {};
    for (let nivel = 0; nivel <= 9; nivel++) {
        diarios[`Nivel_${nivel}`] = -1;
    }
    (nivelesAccesibles ?? [])
        .map((nivel) => Number(nivel))
        .filter((nivel) => Number.isFinite(nivel) && nivel >= 0 && nivel <= 9)
        .forEach((nivel) => {
            diarios[`Nivel_${Math.trunc(nivel)}`] = 0;
        });
    return diarios;
}

function crearPlantillaMock(partial?: Partial<Plantilla>): Plantilla {
    return {
        Id: 1,
        Nombre: 'Plantilla mock',
        Descripcion: '',
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
        Tamano: { Id: 0, Nombre: '-', Modificador: 0, Modificador_presa: 0 },
        Tipo_dado: { Id_tipo_dado: 0, Nombre: 'Elegir' },
        Actualiza_dg: false,
        Modificacion_dg: { Id_paso_modificacion: 0, Nombre: 'No modifica' },
        Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: 'No modifica' },
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
        Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 0, Suma: 0 },
        Cd: 0,
        Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
        Nacimiento: false,
        Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: {
            Id: 0,
            Nombre: '-',
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
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' },
            Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
            Descripcion: '',
        },
        Oficial: true,
        Dotes: [],
        Subtipos: [],
        Habilidades: [],
        Sortilegas: [],
        Prerrequisitos_flags: {},
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

function crearDeidadesMock(): DeidadDetalle[] {
    return [
        {
            Id: 1,
            Nombre: 'Heironeous',
            Descripcion: 'Deidad del valor y la justicia.',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 110 },
            Alineamiento: { Id: 1, Id_basico: 1, Nombre: 'Legal bueno' },
            Arma: { Id: 1, Nombre: 'Espada larga' },
            Pabellon: { Id: 1, Nombre: 'Guerra' },
            Genero: { Id: 1, Nombre: 'Masculino' },
            Ambitos: [{ Id: 1, Nombre: 'Guerra' }],
            Dominios: [{ Id: 1, Nombre: 'Bien', Oficial: true }],
            Oficial: true,
        },
        {
            Id: 2,
            Nombre: 'Gruumsh',
            Descripcion: 'Deidad orca de la conquista.',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 111 },
            Alineamiento: { Id: 9, Id_basico: 9, Nombre: 'Caotico maligno' },
            Arma: { Id: 2, Nombre: 'Lanza' },
            Pabellon: { Id: 2, Nombre: 'Conquista' },
            Genero: { Id: 1, Nombre: 'Masculino' },
            Ambitos: [{ Id: 2, Nombre: 'Destrucción' }],
            Dominios: [{ Id: 2, Nombre: 'Guerra', Oficial: true }],
            Oficial: true,
        },
        {
            Id: 3,
            Nombre: 'St. Cuthbert',
            Descripcion: 'Deidad del orden y la disciplina.',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 112 },
            Alineamiento: { Id: 2, Id_basico: 2, Nombre: 'Legal neutral' },
            Arma: { Id: 3, Nombre: 'Maza' },
            Pabellon: { Id: 3, Nombre: 'Orden' },
            Genero: { Id: 1, Nombre: 'Masculino' },
            Ambitos: [{ Id: 3, Nombre: 'Protección' }],
            Dominios: [{ Id: 3, Nombre: 'Ley', Oficial: true }],
            Oficial: true,
        },
    ];
}

describe('NuevoPersonajeComponent', () => {
    let component: NuevoPersonajeComponent;
    let nuevoPSvc: NuevoPersonajeService;
    let campanaSvcMock: any;
    let alineamientoSvcMock: any;
    let claseSvcMock: any;
    let conjuroSvcMock: any;
    let escuelaSvcMock: any;
    let disciplinaSvcMock: any;
    let razaSvcMock: any;
    let plantillaSvcMock: any;
    let ventajaSvcMock: any;
    let habilidadSvcMock: any;
    let idiomaSvcMock: any;
    let doteSvcMock: any;
    let enemigoPredilectoSvcMock: any;
    let armaSvcMock: any;
    let armaduraSvcMock: any;
    let grupoArmaSvcMock: any;
    let grupoArmaduraSvcMock: any;
    let dominioSvcMock: any;
    let regionSvcMock: any;
    let deidadSvcMock: any;
    let tipoCriaturaSvcMock: any;
    let monstruoSvcMock: any;
    let especialSvcMock: any;
    let personajeSvcMock: any;
    let fichasDescargaBgSvcMock: any;
    let chatFloatingSvcMock: any;
    let userSvcMock: any;
    let userProfileNavigationSvcMock: any;

    beforeEach(() => {
        nuevoPSvc = new NuevoPersonajeService();
        campanaSvcMock = {
            getListCampanas: async () => of([]),
        };
        alineamientoSvcMock = {
            getAlineamientosBasicosCatalogo: () => of([]),
        };
        claseSvcMock = {
            getClases: () => of([]),
        };
        conjuroSvcMock = {
            getConjuros: () => of([]),
        };
        escuelaSvcMock = {
            getEscuelas: () => of([]),
        };
        disciplinaSvcMock = {
            getDisciplinas: () => of([]),
        };
        razaSvcMock = {
            getRazas: () => of([
                crearRazaMock(),
                {
                    ...crearRazaMock(),
                    Id: 2,
                    Nombre: 'Humano base',
                    Alineamiento: {
                        ...crearRazaMock().Alineamiento,
                        Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                    },
                },
            ]),
        };
        plantillaSvcMock = {
            getPlantillas: () => of([]),
        };
        ventajaSvcMock = {
            getVentajas: () => of([]),
            getDesventajas: () => of([]),
        };
        habilidadSvcMock = {
            getHabilidades: () => of([]),
            getHabilidadesCustom: () => of([]),
        };
        idiomaSvcMock = {
            getIdiomas: () => of([]),
        };
        doteSvcMock = {
            getDotes: () => of([]),
        };
        enemigoPredilectoSvcMock = {
            getEnemigosPredilectos: () => of([]),
        };
        armaSvcMock = {
            getArmas: () => of([]),
        };
        armaduraSvcMock = {
            getArmaduras: () => of([]),
        };
        grupoArmaSvcMock = {
            getGruposArmas: () => of([]),
        };
        grupoArmaduraSvcMock = {
            getGruposArmaduras: () => of([]),
        };
        dominioSvcMock = {
            getDominios: () => of([]),
        };
        regionSvcMock = {
            getRegiones: () => of([]),
        };
        deidadSvcMock = {
            getDeidades: () => of(crearDeidadesMock()),
        };
        tipoCriaturaSvcMock = {
            getTiposCriatura: () => of([]),
        };
        monstruoSvcMock = {
            getMonstruos: () => of([]),
        };
        especialSvcMock = {
            getEspeciales: () => of([]),
        };
        personajeSvcMock = {
            construirPayloadCreacionDesdePersonaje: jasmine.createSpy('construirPayloadCreacionDesdePersonaje').and.returnValue({}),
            crearPersonajeApiDesdeCreacion: jasmine.createSpy('crearPersonajeApiDesdeCreacion').and.resolveTo({
                message: 'ok',
                idPersonaje: 123,
                ownerUserId: '00000000-0000-0000-0000-000000000010',
            }),
            guardarPersonajeEnFirebase: jasmine.createSpy('guardarPersonajeEnFirebase').and.resolveTo(),
            normalizarPersonajeParaPersistenciaFinal: jasmine.createSpy('normalizarPersonajeParaPersistenciaFinal').and.callFake((pj: any, id: number) => ({
                ...pj,
                Id: id,
            })),
        };
        fichasDescargaBgSvcMock = {
            descargarFichas: jasmine.createSpy('descargarFichas').and.callFake(() => undefined),
        };
        chatFloatingSvcMock = {
            isListWindowOpen: false,
            hideAllFloatingWindowsForOverlay: jasmine.createSpy('hideAllFloatingWindowsForOverlay').and.returnValue(null),
            restoreFloatingWindowsAfterOverlay: jasmine.createSpy('restoreFloatingWindowsAfterOverlay').and.callFake(() => undefined),
        };
        userSvcMock = {
            CurrentPrivateProfile: {
                role: 'jugador',
            },
            CurrentUserUid: 'uid-actor',
            getCurrentRole: jasmine.createSpy('getCurrentRole').and.callFake(() => userSvcMock.CurrentPrivateProfile?.role ?? 'jugador'),
            can: jasmine.createSpy('can').and.returnValue(false),
        };
        userProfileNavigationSvcMock = {
            openPrivateProfile: jasmine.createSpy('openPrivateProfile'),
        };
        component = new NuevoPersonajeComponent(
            { currentUser: null } as any,
            nuevoPSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            claseSvcMock,
            conjuroSvcMock,
            escuelaSvcMock,
            disciplinaSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            doteSvcMock,
            enemigoPredilectoSvcMock,
            armaSvcMock,
            armaduraSvcMock,
            grupoArmaSvcMock,
            grupoArmaduraSvcMock,
            dominioSvcMock,
            regionSvcMock,
            deidadSvcMock,
            tipoCriaturaSvcMock,
            monstruoSvcMock,
            especialSvcMock,
            personajeSvcMock,
            fichasDescargaBgSvcMock,
            chatFloatingSvcMock,
            userSvcMock,
            userProfileNavigationSvcMock,
        );
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.catalogoDeidades = crearDeidadesMock();
        nuevoPSvc.setCatalogoDeidades(component.catalogoDeidades);
        component.seleccionarRaza(crearRazaMock());
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Edad = 20;
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.recalcularOficialidad();
    });

    it('seleccionarRaza mueve automáticamente a Básicos', () => {
        expect(component.selectedInternalTabIndex).toBe(1);
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('basicos');
    });

    it('si el alineamiento base de raza no existe en el selector, usa Legal bueno visible', () => {
        component.seleccionarRaza(crearRazaConAlineamientoBasico('Alineamiento desconocido'));
        expect(component.Personaje.Alineamiento).toBe('Legal bueno');
    });

    it('al seleccionar una raza mutada abre selector de base y no aplica hasta confirmar', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [
            crearRazaMock(),
            {
                ...crearRazaMock(),
                Id: 2,
                Nombre: 'Humano base',
                Alineamiento: {
                    ...crearRazaMock().Alineamiento,
                    Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                },
            },
        ];

        component.seleccionarRaza(crearRazaMutadaConPrerequisito());

        expect(component.modalSelectorRazaBaseAbierto).toBeTrue();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
    });

    it('confirmar base en mutada aplica la seleccion y cierra modal', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [
            crearRazaMock(),
            {
                ...crearRazaMock(),
                Id: 2,
                Nombre: 'Humano base',
                Alineamiento: {
                    ...crearRazaMock().Alineamiento,
                    Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                },
            },
        ];
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConPrerequisito());
        await component.onConfirmarRazaBase({
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
            },
        });

        expect(component.modalSelectorRazaBaseAbierto).toBeFalse();
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(2);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('permite base homebrew solo cuando se activa el toggle', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const baseOficial = {
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
            Oficial: true,
        };
        const baseHomebrew = {
            ...crearRazaMock(false),
            Id: 3,
            Nombre: 'Bestial homebrew',
            Oficial: false,
        };
        component.razasCatalogo = [baseOficial, baseHomebrew];
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConWarning());
        await component.onConfirmarRazaBase(baseHomebrew);
        expect(nuevoPSvc.PersonajeCreacion.RazaBase).toBeNull();

        component.incluirHomebrewRazaBase = true;
        await component.onConfirmarRazaBase(baseHomebrew);
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(3);
    });

    it('base con warning muestra aviso y permite continuar', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
        };
        component.razasCatalogo = [base];
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConWarning());
        await component.onConfirmarRazaBase(base);

        expect(swalSpy).toHaveBeenCalled();
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(2);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('si no hay candidatas elegibles muestra alerta y no aplica seleccion', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [{
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Base caotica',
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: 'Caotico bueno' },
            },
        }];
        const mutadaExigente = crearRazaMutadaConPrerequisito();
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(mutadaExigente);

        expect(swalSpy).toHaveBeenCalled();
        expect(component.modalSelectorRazaBaseAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
    });

    it('seleccionar raza con opcionales abre modal y bloquea avance', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeTrue();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('confirmar raciales opcionales aplica raza y avanza', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());
        component.onConfirmarRacialesOpcionales({ 1: 'id:2' });

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada?.Id).toBe(300);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('cancelar raciales opcionales no aplica selección', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());
        component.onCerrarModalRacialesOpcionales();

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('mutada + base con opcionales abre modal y habilita opciones por identidad dual', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        component.razasCatalogo = [base];

        component.seleccionarRaza(crearRazaMutadaConRacialesOpcionalesPrereq());
        await component.onConfirmarRazaBase(base);

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeTrue();
        const grupoUno = component.gruposRacialesOpcionalesModal.find((g) => g.grupo === 1);
        expect(grupoUno).toBeTruthy();
        expect((grupoUno?.opciones ?? []).every((opcion) => opcion.estado !== 'blocked')).toBeTrue();
    });

    it('muestra opciones raciales bloqueadas cuando no cumplen prerrequisitos', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        const mutada = crearRazaMutadaConRacialesOpcionalesPrereq();
        mutada.Raciales = [
            ...(mutada.Raciales ?? []),
            {
                Id: 99,
                Nombre: 'Linaje vetado',
                Descripcion: '',
                Opcional: 1,
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
                Prerrequisitos: { raza: [{ id_raza: 999 }], caracteristica: [] },
            } as any,
        ];
        component.razasCatalogo = [base];

        component.seleccionarRaza(mutada);
        await component.onConfirmarRazaBase(base);

        const bloqueada = component.gruposRacialesOpcionalesModal
            .flatMap((g) => g.opciones)
            .find((opcion) => opcion.racial.Nombre === 'Linaje vetado');
        expect(bloqueada?.estado).toBe('blocked');
        expect((bloqueada?.razones ?? []).length).toBeGreaterThan(0);
    });

    it('si un grupo opcional queda sin opciones habilitadas muestra alerta y no avanza', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        component.razasCatalogo = [base];
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConOpcionalesBloqueadas());
        await component.onConfirmarRazaBase(base);

        expect(swalSpy).toHaveBeenCalled();
        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('usa catálogo cacheado de alineamientos cuando existe', () => {
        alineamientoSvcMock.getAlineamientosBasicosCatalogo = () => of([
            { Id: 88, Nombre: 'Alineamiento custom cacheado' },
            { Id: 89, Nombre: 'Legal bueno' },
        ]);

        component.ngOnInit();

        expect(component.alineamientosDisponibles).toContain('Alineamiento custom cacheado');
    });

    it('usa fallback local de alineamientos cuando el catálogo cacheado está vacío', () => {
        alineamientoSvcMock.getAlineamientosBasicosCatalogo = () => of([]);

        component.ngOnInit();

        expect(component.alineamientosDisponibles).toContain('Legal bueno');
        expect(component.alineamientosDisponibles.length).toBeGreaterThan(1);
    });

    it('onInternalTabIndexChange no permite cambiar el paso por navegación manual', () => {
        component.selectedInternalTabIndex = 1;
        component.onInternalTabIndexChange(0);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('puedeContinuarBasicos es false si falta un campo obligatorio visible', () => {
        component.Personaje.Nombre = '';
        expect(component.puedeContinuarBasicos).toBeFalse();
        expect(component.motivosBloqueoBasicos).toContain('Debes indicar el nombre del personaje.');
    });

    it('puedeContinuarBasicos es true cuando todos los campos visibles obligatorios están completos', () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Genero = 'Macho';
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Campana = 'Sin campaña';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.Personaje.Edad = 21;
        component.Personaje.Peso = 75;
        component.Personaje.Altura = 1.8;

        expect(component.puedeContinuarBasicos).toBeTrue();
    });

    it('mantiene Sin región por defecto al normalizar básicos', () => {
        component.ngOnInit();

        expect((component.Personaje as any).Id_region).toBe(0);
        expect((component.Personaje as any).Region?.Nombre).toBe('Sin región');
        expect(component.idRegionSeleccionadaBasicos).toBe(0);
    });

    it('onRegionOrigenChange actualiza id y nombre de región en personaje', () => {
        component.catalogoRegiones = [
            { Id: 3, Nombre: 'Costa de la espada', Oficial: true } as any,
        ];

        component.onRegionOrigenChange(3);

        expect((component.Personaje as any).Id_region).toBe(3);
        expect((component.Personaje as any).Region?.Nombre).toBe('Costa de la espada');
        expect(component.idRegionSeleccionadaBasicos).toBe(3);
    });

    it('resolverContextoIdsCreacion incluye idRegion y catalogo de regiones', () => {
        component.catalogoRegiones = [
            { Id: 4, Nombre: 'Rashemen', Oficial: true } as any,
        ];
        component.onRegionOrigenChange(4);

        const contexto = (component as any).resolverContextoIdsCreacion();

        expect(contexto.idRegion).toBe(4);
        expect((contexto.catalogos?.regiones ?? []).some((item: any) => item.id === 4 && item.nombre === 'Rashemen')).toBeTrue();
    });

    it('actualizarTramas con Sin campaña resetea trama y subtrama', () => {
        component.Tramas = [{ Id: 1, Nombre: 'Temporal' }];
        component.Subtramas = [{ Id: 1, Nombre: 'Temporal' }];
        component.Personaje.Campana = 'Sin campaña';
        component.Personaje.Trama = 'Otra trama';
        component.Personaje.Subtrama = 'Otra subtrama';

        component.actualizarTramas();

        expect(component.Tramas.length).toBe(0);
        expect(component.Subtramas.length).toBe(0);
        expect(component.Personaje.Trama).toBe('Trama base');
        expect(component.Personaje.Subtrama).toBe('Subtrama base');
    });

    it('cargarCampanas filtra Sin campaña del listado porque el selector ya la pinta fija', async () => {
        campanaSvcMock.getListCampanas = async () => of([
            { Id: 0, Nombre: 'Sin campaña', Tramas: [] },
            { Id: 1, Nombre: 'Campaña A', Tramas: [] },
        ]);

        await (component as any).cargarCampanas();

        expect(component.Campanas.map((item) => item.Nombre)).toEqual(['Campaña A']);
    });

    it('cargarCampanas reacciona a emisiones posteriores y resetea selección inválida', async () => {
        const campanas$ = new Subject<Campana[]>();
        campanaSvcMock.getListCampanas = async () => campanas$.asObservable();
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama vieja';
        component.Personaje.Subtrama = 'Sub vieja';

        await (component as any).cargarCampanas();

        campanas$.next([{
            Id: 1,
            Nombre: 'Campaña A',
            Tramas: [{ Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] }],
        }]);
        campanas$.next([{
            Id: 2,
            Nombre: 'Campaña B',
            Tramas: [],
        }]);

        expect(component.Campanas.map((item) => item.Nombre)).toEqual(['Campaña B']);
        expect(component.Personaje.Campana).toBe('Sin campaña');
        expect(component.Personaje.Trama).toBe('Trama base');
        expect(component.Personaje.Subtrama).toBe('Subtrama base');
    });

    it('cargarCampanas preserva la selección cuando la campaña cambia de nombre pero mantiene Id', async () => {
        const campanas$ = new Subject<Campana[]>();
        campanaSvcMock.getListCampanas = async () => campanas$.asObservable();
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama 1';
        component.Personaje.Subtrama = 'Sub 1';

        await (component as any).cargarCampanas();

        campanas$.next([{
            Id: 1,
            Nombre: 'Campaña A',
            Tramas: [{ Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] }],
        }]);
        campanas$.next([{
            Id: 1,
            Nombre: 'Campaña Renombrada',
            Tramas: [{ Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] }],
        }]);

        expect(component.Personaje.Campana).toBe('Campaña Renombrada');
        expect(component.Personaje.Trama).toBe('Trama 1');
        expect(component.Personaje.Subtrama).toBe('Sub 1');
    });

    it('cargarCampanas marca estado de carga hasta recibir la primera emisión', async () => {
        const campanas$ = new Subject<Campana[]>();
        campanaSvcMock.getListCampanas = async () => campanas$.asObservable();

        const loadingPromise = (component as any).cargarCampanas();
        expect(component.campanasLoading).toBeTrue();

        await loadingPromise;
        campanas$.next([{
            Id: 2,
            Nombre: 'Campaña B',
            Tramas: [],
        }]);

        expect(component.campanasLoading).toBeFalse();
    });

    it('actualizarTramas resetea a Sin campaña cuando la selección actual ya no es válida', () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            Tramas: [{ Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] }],
        }];
        component.Personaje.Campana = 'Campaña oculta';
        component.Personaje.Trama = 'Trama fantasma';
        component.Personaje.Subtrama = 'Subtrama fantasma';
        component.Tramas = [{ Id: 99, Nombre: 'Temporal' }];
        component.Subtramas = [{ Id: 999, Nombre: 'Temporal' }];

        component.actualizarTramas();

        expect(component.Personaje.Campana).toBe('Sin campaña');
        expect(component.Personaje.Trama).toBe('Trama base');
        expect(component.Personaje.Subtrama).toBe('Subtrama base');
        expect(component.Tramas).toEqual([]);
        expect(component.Subtramas).toEqual([]);
    });

    it('actualizarTramas con campaña valida autoselecciona primera trama y primera subtrama', () => {
        const campanas: Campana[] = [{
            Id: 1,
            Nombre: 'Campaña A',
            Tramas: [
                { Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] },
                { Id: 11, Nombre: 'Trama 2', Subtramas: [{ Id: 101, Nombre: 'Sub 2' }] },
            ],
        }];
        component.Campanas = campanas;
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Invalida';
        component.Personaje.Subtrama = 'Invalida';

        component.actualizarTramas();

        expect(component.Personaje.Trama).toBe('Trama 1');
        expect(component.Personaje.Subtrama).toBe('Sub 1');
    });

    it('actualizarTramas carga la politica aunque la campaña no tenga tramas', async () => {
        component.Campanas = [{
            Id: 7,
            Nombre: 'Campaña sin tramas',
            CampaignRole: 'jugador',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña sin tramas';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Campaña sin tramas',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            politicaCreacion: {
                tiradaMinimaCaracteristica: null,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: null,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: true,
                maxFuentesHomebrewGeneralesPorPersonaje: 0,
            },
        });

        component.actualizarTramas();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(campanaSvcMock.getCampaignDetail).toHaveBeenCalledWith(7);
        expect(component.selectedCampaignPolicy?.permitirHomebrewGeneral).toBeFalse();
        expect(component.Personaje.Trama).toBe('Trama base');
        expect(component.Personaje.Subtrama).toBe('Subtrama base');
    });

    it('canOpenCampaignManagement solo se activa para master o superior con permiso de crear campañas', () => {
        userSvcMock.CurrentPrivateProfile = { role: 'master' };
        userSvcMock.getCurrentRole.and.returnValue('master');
        userSvcMock.can.and.returnValue(true);

        expect(component.canOpenCampaignManagement).toBeTrue();
        expect(userSvcMock.can).toHaveBeenCalledWith('campanas', 'create');

        userSvcMock.can.calls.reset();
        userSvcMock.CurrentPrivateProfile = { role: 'jugador' };
        userSvcMock.getCurrentRole.and.returnValue('jugador');
        userSvcMock.can.and.returnValue(true);

        expect(component.canOpenCampaignManagement).toBeFalse();
        expect(userSvcMock.can).not.toHaveBeenCalled();
    });

    it('canOpenCampaignManagement admite admin aunque el CurrentPrivateProfile esté degradado', () => {
        userSvcMock.CurrentPrivateProfile = { role: 'jugador' };
        userSvcMock.getCurrentRole.and.returnValue('admin');
        userSvcMock.can.and.returnValue(true);

        expect(component.canOpenCampaignManagement).toBeTrue();
        expect(userSvcMock.can).toHaveBeenCalledWith('campanas', 'create');
    });

    it('abrirGestionCampanas navega al perfil privado en la sección de campañas cuando tiene permiso', () => {
        userSvcMock.CurrentPrivateProfile = { role: 'colaborador' };
        userSvcMock.getCurrentRole.and.returnValue('colaborador');
        userSvcMock.can.and.returnValue(true);

        component.abrirGestionCampanas();

        expect(userProfileNavigationSvcMock.openPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'campanas',
        }));
    });

    it('abrirGestionCampanas no navega cuando no puede gestionar campañas', () => {
        userSvcMock.CurrentPrivateProfile = { role: 'jugador' };
        userSvcMock.getCurrentRole.and.returnValue('jugador');
        userSvcMock.can.and.returnValue(true);

        component.abrirGestionCampanas();

        expect(userProfileNavigationSvcMock.openPrivateProfile).not.toHaveBeenCalled();
    });

    it('syncSelectedCampaignPolicy aplica 3/1 al generador cuando el actor es jugador y la campaña fija esos límites', async () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            CampaignRole: 'jugador',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña A';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 1,
                nombre: 'Campaña A',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            politicaCreacion: {
                tiradaMinimaCaracteristica: 3,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: 1,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: false,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: 1,
            },
        });

        await (component as any).syncSelectedCampaignPolicy();

        expect(component.selectedCampaignPolicy?.tiradaMinimaCaracteristica).toBe(3);
        expect(nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado).toBe(3);
        expect(nuevoPSvc.EstadoFlujo.generador.tablasPermitidas).toBe(1);
    });

    it('syncSelectedCampaignPolicy no restringe el generador solo cuando el actor es el master activo', async () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            CampaignRole: 'master',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña A';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 1,
                nombre: 'Campaña A',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            activeMasterUid: 'uid-actor',
            politicaCreacion: {
                tiradaMinimaCaracteristica: 3,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: 1,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: false,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: 1,
            },
        });

        await (component as any).syncSelectedCampaignPolicy();

        expect(component.selectedCampaignPolicy?.tiradaMinimaCaracteristica).toBe(3);
        expect(nuevoPSvc.TieneRestriccionCampanaGenerador).toBeFalse();
        expect(nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado).toBe(13);
        expect(nuevoPSvc.EstadoFlujo.generador.tablasPermitidas).toBe(3);
    });

    it('syncSelectedCampaignPolicy restringe el generador si no puede confirmar activeMasterUid aunque campaignRole sea master', async () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            CampaignRole: 'master',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña A';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 1,
                nombre: 'Campaña A',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            activeMasterUid: 'uid-otro',
            politicaCreacion: {
                tiradaMinimaCaracteristica: 3,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: 1,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: false,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: 1,
            },
        });

        await (component as any).syncSelectedCampaignPolicy();

        expect(nuevoPSvc.TieneRestriccionCampanaGenerador).toBeTrue();
        expect(nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado).toBe(3);
        expect(nuevoPSvc.EstadoFlujo.generador.tablasPermitidas).toBe(1);
    });

    it('actualizarTramas sin campaña libera la restricción temporal del generador', () => {
        nuevoPSvc.aplicarRestriccionCampanaGenerador({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
        });
        component.Personaje.Campana = 'Sin campaña';

        component.actualizarTramas();

        expect(nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado).toBe(13);
        expect(nuevoPSvc.EstadoFlujo.generador.tablasPermitidas).toBe(3);
    });

    it('deidadesFiltradas bloquea nuevas deidades homebrew cuando la campaña no permite más fuentes', () => {
        component.Personaje.Campana = 'Campaña A';
        component.seleccionarRaza(crearRazaMock(false));
        component.catalogoDeidades = [
            ...crearDeidadesMock(),
            {
                Id: 99,
                Nombre: 'Diosa homebrew',
                Descripcion: '',
                Manual: { Id: 9, Nombre: 'Manual homebrew', Pagina: 1 },
                Alineamiento: { Id: 2, Id_basico: 2, Nombre: 'Legal neutral' },
                Arma: { Id: 1, Nombre: 'Espada larga' },
                Pabellon: { Id: 1, Nombre: 'Prueba' },
                Genero: { Id: 1, Nombre: 'Femenino' },
                Ambitos: [],
                Dominios: [],
                Oficial: false,
            } as any,
        ];
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;

        const deidadHomebrew = component.deidadesFiltradas.find((item) => item.nombre === 'Diosa homebrew');

        expect(deidadHomebrew?.disabled).toBeTrue();
        expect(`${deidadHomebrew?.etiqueta ?? ''}`).toContain('bloqueada por campaña');
    });

    it('getInconsistenciasManual incluye peso, altura y edad fuera de rango', () => {
        component.Personaje.Edad = 100;
        component.Personaje.Peso = 120;
        component.Personaje.Altura = 2.2;

        const inconsistencias = component.getInconsistenciasManual();

        expect(inconsistencias.some(i => i.includes('Edad fuera de rango'))).toBeTrue();
        expect(inconsistencias.some(i => i.includes('Peso fuera de rango'))).toBeTrue();
        expect(inconsistencias.some(i => i.includes('Altura fuera de rango'))).toBeTrue();
    });

    it('getInconsistenciasManual incluye deidad no oficial', () => {
        component.Personaje.Deidad = 'Dios inventado';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Deidad no oficial'))).toBeTrue();
    });

    it('getInconsistenciasManual registra conflicto duro de raza en prioridad 3 sin forzar homebrew hasta confirmar', () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Alineamiento incompatible con raza'))).toBeTrue();
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('getInconsistenciasManual detecta referencia racial desde Ley/Moral cuando Basico es No aplica', () => {
        component.seleccionarRaza(crearRazaConPreferenciasSinBasico('Casi siempre legal', 'Casi siempre maligno'));
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'No tener deidad';

        const inconsistencias = component.getInconsistenciasManual();

        expect(inconsistencias.some(i => i.includes('extremadamente inusual'))).toBeTrue();
    });

    it('recalcularOficialidad mantiene oficial hasta confirmar cuando hay conflicto duro de deidad', () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Gruumsh';
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('recalcularOficialidad no fuerza homebrew antes de elegir raza', () => {
        component.Personaje.Oficial = true;

        component.recalcularOficialidad();

        expect(component.Personaje.Oficial).toBeTrue();
        expect(component.homebrewForzado).toBeFalse();
    });

    it('selector de deidad muestra listado completo y conserva No tener deidad como primera opción', () => {
        component.Personaje.Deidad = component.deidadSinSeleccion;

        const deidades = component.deidadesFiltradas;
        expect(deidades[0].nombre).toBe(component.deidadSinSeleccion);
        expect(deidades.map((item) => item.nombre)).toContain('Heironeous');
        expect(deidades.map((item) => item.nombre)).toContain('Gruumsh');
        expect(deidades.map((item) => item.nombre)).toContain('St. Cuthbert');
    });

    it('onDeidadChange normaliza vacío a No tener deidad', () => {
        component.Personaje.Deidad = '';

        component.onDeidadChange();

        expect(component.Personaje.Deidad).toBe(component.deidadSinSeleccion);
    });

    it('onDeidadChange mantiene la deidad seleccionada', () => {
        component.Personaje.Deidad = 'Gruumsh';

        component.onDeidadChange();

        expect(component.Personaje.Deidad).toBe('Gruumsh');
    });

    it('si existe una deidad custom en el personaje, también aparece en el selector', () => {
        component.Personaje.Deidad = 'Dios inventado';

        const deidades = component.deidadesFiltradas;
        expect(deidades.map((item) => item.nombre)).toContain('Dios inventado');
    });

    it('recalcularOficialidad pone false con contradicciones de manual', () => {
        component.Personaje.Peso = 999;
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('continuarDesdeBasicos cancela al rechazar alerta', async () => {
        component.Personaje.Peso = 999;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.continuarDesdeBasicos();

        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('continuarDesdeBasicos abre modal al aceptar alerta', async () => {
        component.Personaje.Peso = 999;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos configura Swal de inconsistencias con returnFocus desactivado', async () => {
        component.Personaje.Peso = 999;
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalled();
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(swalConfig.returnFocus).toBeFalse();
    });

    it('continuarDesdeBasicos con conflicto duro de raza en prioridad 3 marca homebrew al confirmar', async () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu raza exige');
        expect(`${swalConfig.html ?? ''}`).toContain('quedará marcado como homebrew');
        expect(component.Personaje.Oficial).toBeFalse();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos bloquea el avance si la campaña no permite saltarse alineamiento', async () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Campana = 'Caballeros';
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: 3,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.title ?? ''}`).toContain('La campaña no permite este alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('Esta campaña no permite saltarse restricciones de alineamiento');
        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('continuarDesdeBasicos con deidad incompatible marca homebrew al confirmar', async () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Gruumsh';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu deidad exige');
        expect(component.Personaje.Oficial).toBeFalse();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos bloquea si la campaña prohíbe todo el homebrew y la raza ya es homebrew', async () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            CampaignRole: 'jugador',
            Tramas: [],
        }];
        component.seleccionarRaza(crearRazaMock(false));
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 1,
                nombre: 'Campaña A',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            politicaCreacion: {
                tiradaMinimaCaracteristica: null,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: null,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: true,
                maxFuentesHomebrewGeneralesPorPersonaje: 0,
            },
        });
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.title ?? ''}`).toContain('La campaña bloquea continuar');
        expect(`${swalConfig.html ?? ''}`).toContain('no permite homebrew general');
        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('puedeContinuarBasicos es false cuando la campaña ya bloquea el homebrew elegido', () => {
        component.seleccionarRaza(crearRazaMock(false));
        component.Personaje.Nombre = 'Aranel';
        component.Personaje.Genero = 'Hembra';
        component.Personaje.Deidad = 'No tener deidad';
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.Personaje.Edad = 120;
        component.Personaje.Peso = 42;
        component.Personaje.Altura = 1.8;
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
        };
        (component as any).selectedCampaignPolicyResolved = true;

        expect(component.puedeContinuarBasicos).toBeFalse();
        expect(component.motivosBloqueoBasicos.some((motivo) => motivo.includes('no permite homebrew general'))).toBeTrue();
    });

    it('motivosBloqueoBasicos informa cuando la politica de campaña sigue cargando', () => {
        component.Personaje.Nombre = 'Aranel';
        component.Personaje.Genero = 'Hembra';
        component.Personaje.Deidad = 'No tener deidad';
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.Personaje.Edad = 120;
        component.Personaje.Peso = 42;
        component.Personaje.Altura = 1.8;
        (component as any).selectedCampaignPolicyLoading = true;

        expect(component.puedeContinuarBasicos).toBeFalse();
        expect(component.motivosBloqueoBasicos).toContain('Se está cargando la política de creación de la campaña seleccionada.');
    });

    it('continuarDesdeBasicos sigue bloqueando homebrew aunque el actor sea el activeMasterUid', async () => {
        component.Campanas = [{
            Id: 1,
            Nombre: 'Campaña A',
            CampaignRole: 'master',
            Tramas: [],
        }];
        component.seleccionarRaza(crearRazaMock(false));
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        campanaSvcMock.getCampaignDetail = jasmine.createSpy('getCampaignDetail').and.resolveTo({
            campaign: {
                id: 1,
                nombre: 'Campaña A',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            activeMasterUid: 'uid-actor',
            politicaCreacion: {
                tiradaMinimaCaracteristica: 3,
                nepMaximoPersonajeNuevo: null,
                maxTablasDadosCaracteristicas: 1,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: true,
                maxFuentesHomebrewGeneralesPorPersonaje: 0,
            },
        });
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.title ?? ''}`).toContain('La campaña bloquea continuar');
        expect(`${swalConfig.html ?? ''}`).toContain('no permite homebrew general');
        expect(component.modalCaracteristicasAbierto).toBeFalse();
        expect(nuevoPSvc.TieneRestriccionCampanaGenerador).toBeFalse();
    });

    it('deidad permite diferencia de un paso sin conflicto duro', async () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'St. Cuthbert';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(component.Personaje.Oficial).toBeTrue();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos usa swal combinado cuando coinciden advertencia de raza e impacto de deidad', async () => {
        component.seleccionarRaza(crearRazaConPrioridadNoDura());
        component.Personaje.Alineamiento = 'Caotico maligno';
        component.Personaje.Deidad = 'Heironeous';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu raza suele exigir');
        expect(`${swalConfig.html ?? ''}`).toContain('tu deidad exige');
        expect(`${swalConfig.html ?? ''}`).toContain('1 entre un millón');
    });

    it('continuarDesdeBasicos no marca homebrew por conflicto duro si el usuario cancela', async () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Oficial).toBeTrue();
        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('raza con preferencia casi siempre muestra advertencia pero no marca homebrew', async () => {
        component.seleccionarRaza(crearRazaConPrioridadNoDura());
        component.Personaje.Alineamiento = 'Caotico maligno';
        component.Personaje.Deidad = 'No tener deidad';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Advertencias');
        expect(`${swalConfig.html ?? ''}`).toContain('1 entre un millón');
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('continuarDesdeBasicos abre ventana flotante en escritorio', async () => {
        spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1600);
        spyOnProperty(window, 'innerHeight', 'get').and.returnValue(900);

        await component.continuarDesdeBasicos();

        expect(component.ventanaDetalleAbierta).toBeTrue();
    });

    it('continuarDesdeBasicos no abre ventana flotante en layout móvil/tablet', async () => {
        spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1024);
        spyOnProperty(window, 'innerHeight', 'get').and.returnValue(800);

        await component.continuarDesdeBasicos();

        expect(component.ventanaDetalleAbierta).toBeFalse();
    });

    it('onSolicitarCerrarVentanaDetalle emite cierre al confirmar', async () => {
        component.ventanaDetalleAbierta = true;
        const emitSpy = spyOn(component.cerrarNuevoPersonajeSolicitado, 'emit');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.onSolicitarCerrarVentanaDetalle();

        expect(component.ventanaDetalleAbierta).toBeFalse();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('onSolicitarCerrarVentanaDetalle mantiene ventana si cancela', async () => {
        component.ventanaDetalleAbierta = true;
        const emitSpy = spyOn(component.cerrarNuevoPersonajeSolicitado, 'emit');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.onSolicitarCerrarVentanaDetalle();

        expect(component.ventanaDetalleAbierta).toBeTrue();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('reenvia la referencia de ventaja desde la vista previa', () => {
        const emitSpy = spyOn(component.ventajaDetallesPorNombre, 'emit');
        component.verDetallesVentajaDesdeReferencia({ nombre: 'Bendecido', origen: 'Ventaja' });
        expect(emitSpy).toHaveBeenCalledWith({ nombre: 'Bendecido', origen: 'Ventaja' });
    });

    it('resuelve clase desde la preview y emite detalle de clase', () => {
        const clase = crearClaseMock({ Id: 901, Nombre: 'Mago' });
        component.catalogoClases = [clase];
        const emitSpy = spyOn(component.claseDetalles, 'emit');

        component.verDetallesClaseDesdeFicha('Mago');

        expect(emitSpy).toHaveBeenCalledWith(clase);
    });

    it('tituloVentanaDetalle usa el nombre del personaje cuando existe', () => {
        component.Personaje.Nombre = 'Pepe';
        expect(component.tituloVentanaDetalle).toBe('Pepe - En creación');
    });

    it('tituloVentanaDetalle usa fallback cuando no hay nombre', () => {
        component.Personaje.Nombre = '   ';
        expect(component.tituloVentanaDetalle).toBe('Sin nombre - En creación');
    });

    it('continuarDesdeBasicos sin inconsistencias abre modal sin alerta', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.Personaje.Edad = 20;
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Alineamiento = 'Legal bueno';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos autorrellena contexto y personalidad cuando están vacíos', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Contexto = '   ';
        component.Personaje.Personalidad = '';

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Contexto).toBe(component.fallbackContexto);
        expect(component.Personaje.Personalidad).toBe(component.fallbackPersonalidad);
    });

    it('continuarDesdeBasicos no sobreescribe contexto ni personalidad si ya tenían valor', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Contexto = 'Contexto custom';
        component.Personaje.Personalidad = 'Personalidad custom';

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Contexto).toBe('Contexto custom');
        expect(component.Personaje.Personalidad).toBe('Personalidad custom');
    });

    it('no avanza a Plantillas sin características generadas', () => {
        component.irAPlantillas();
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('finalizarGeneracionCaracteristicas aplica valores y avanza a Plantillas', async () => {
        const asignaciones: AsignacionCaracteristicas = {
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        };

        await component.finalizarGeneracionCaracteristicas(asignaciones);

        expect(component.caracteristicasGeneradas).toBeTrue();
        expect(component.selectedInternalTabIndex).toBe(2);
        expect(component.Personaje.Fuerza).toBe(14);
        expect(component.Personaje.Destreza).toBe(17);
        expect(component.Personaje.Constitucion).toBe(11);
        expect(component.Personaje.ModDestreza).toBe(3);
    });

    it('si la raza aporta DGs con puntos de habilidad, tras básicos entra en habilidades', async () => {
        const razaConDgs = crearRazaMock();
        razaConDgs.Dgs_adicionales.Cantidad = 2;
        razaConDgs.Dgs_adicionales.Puntos_habilidad = 2;
        razaConDgs.Dgs_adicionales.Multiplicador_puntos_habilidad = 1;
        component.seleccionarRaza(razaConDgs);

        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('habilidades');
        expect(component.selectedInternalTabIndex).toBe(5);
    });

    it('flujo de tabs: Plantillas -> Ventajas y desventajas', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        await component.continuarDesdePlantillas();
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('ventajas');
        expect(component.selectedInternalTabIndex).toBe(3);
    });

    it('continuarDesdePlantillas salta ventajas cuando la campaña las prohíbe', async () => {
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: true,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: null,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        component.Personaje.Campana = 'Campaña A';

        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        await component.continuarDesdePlantillas();

        expect(component.campaignForbidsAdvantages).toBeTrue();
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('clases');
        expect(component.selectedInternalTabIndex).toBe(4);
    });

    it('al salir de plantillas, DGs por plantilla pueden disparar selector de aumentos', async () => {
        const razaConDgs = crearRazaMock();
        razaConDgs.Dgs_adicionales.Cantidad = 2;
        component.seleccionarRaza(razaConDgs);
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        const plantillaLic = crearPlantillaMock({
            Id: 800,
            Nombre: 'Lic de test',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 3, Suma: 4 },
        });
        component.seleccionarPlantilla(plantillaLic);
        const abrirAumentosSpy = spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);

        await component.continuarDesdePlantillas();

        expect(abrirAumentosSpy).toHaveBeenCalled();
        expect(nuevoPSvc.esPlantillaConfirmada(plantillaLic.Id)).toBeTrue();
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('habilidades');
        expect(component.selectedInternalTabIndex).toBe(5);
    });

    it('tras confirmar plantillas, las confirmadas quedan inmutables', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        const plantillaFijada = crearPlantillaMock({ Id: 801, Nombre: 'Fijada' });
        component.seleccionarPlantilla(plantillaFijada);
        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);

        await component.continuarDesdePlantillas();
        component.quitarPlantillaSeleccion(plantillaFijada.Id);

        expect(component.plantillasSeleccionadas.some((p) => p.Id === plantillaFijada.Id)).toBeTrue();
        expect(component.esPlantillaConfirmada(plantillaFijada)).toBeTrue();
    });

    it('en vueltas posteriores solo limpia plantillas nuevas no confirmadas', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        const plantillaFijada = crearPlantillaMock({ Id: 802, Nombre: 'Fijada' });
        component.seleccionarPlantilla(plantillaFijada);
        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        await component.continuarDesdePlantillas();

        const plantillaNuevaA = crearPlantillaMock({ Id: 803, Nombre: 'Nueva A' });
        const plantillaNuevaB = crearPlantillaMock({ Id: 804, Nombre: 'Nueva B' });
        component.seleccionarPlantilla(plantillaNuevaA);
        component.seleccionarPlantilla(plantillaNuevaB);

        component.limpiarSeleccionPlantillas();
        const ids = component.plantillasSeleccionadas.map((p) => p.Id);
        expect(ids).toContain(plantillaFijada.Id);
        expect(ids).not.toContain(plantillaNuevaA.Id);
        expect(ids).not.toContain(plantillaNuevaB.Id);
    });

    it('no muestra en bloqueadas plantillas ya seleccionadas o confirmadas', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        const plantilla = crearPlantillaMock({ Id: 910, Nombre: 'No duplicar en bloqueadas' });
        component.plantillasCatalogo = [plantilla];
        nuevoPSvc.setPlantillasDisponibles(component.plantillasCatalogo);

        component.seleccionarPlantilla(plantilla);

        expect(component.plantillasBloqueadasUnknown.some((item) => item.plantilla.Id === plantilla.Id)).toBeFalse();
        expect(component.plantillasBloqueadasFailed.some((item) => item.plantilla.Id === plantilla.Id)).toBeFalse();

        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        await component.continuarDesdePlantillas();
        (component as any).recalcularPlantillasVisibles();

        expect(component.plantillasBloqueadasUnknown.some((item) => item.plantilla.Id === plantilla.Id)).toBeFalse();
        expect(component.plantillasBloqueadasFailed.some((item) => item.plantilla.Id === plantilla.Id)).toBeFalse();
    });

    it('recalcularPlantillasVisibles mueve plantillas homebrew a bloqueadas por campaña cuando ya no hay fuentes disponibles', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        component.Personaje.Campana = 'Campaña A';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        component.seleccionarRaza(crearRazaMock(false));
        component.incluirHomebrewPlantillas = true;
        const plantillaHomebrew = crearPlantillaMock({ Id: 911, Nombre: 'Plantilla homebrew', Oficial: false });
        component.plantillasCatalogo = [plantillaHomebrew];
        nuevoPSvc.setPlantillasDisponibles(component.plantillasCatalogo);

        (component as any).recalcularPlantillasVisibles();

        expect(component.plantillasBloqueadasCampana.some((item) => item.plantilla.Id === plantillaHomebrew.Id)).toBeTrue();
        expect(component.plantillasElegibles.some((item) => item.Id === plantillaHomebrew.Id)).toBeFalse();
    });

    it('al mutar tipo de criatura, reevaluá compatibilidad de plantillas y mantiene otros prerrequisitos', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });

        const liche = crearPlantillaMock({
            Id: 920,
            Nombre: 'Liche',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 9,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'No muerto',
                Opcional: 0,
            }],
        });
        const licantropo = crearPlantillaMock({
            Id: 921,
            Nombre: 'Licántropo',
            Prerrequisitos_flags: { criaturas_compatibles: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                criaturas_compatibles: [{ Id_tipo_compatible: 1, opcional: 0 }],
            },
        });
        const exigeCarismaAlto = crearPlantillaMock({
            Id: 922,
            Nombre: 'Exige Carisma 99',
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                caracteristica: [{ Id_caracteristica: 6, Cantidad: 99, opcional: 0 }],
            },
        });

        component.plantillasCatalogo = [liche, licantropo, exigeCarismaAlto];
        nuevoPSvc.setPlantillasDisponibles(component.plantillasCatalogo);
        (component as any).recalcularPlantillasVisibles();
        expect(component.plantillasElegibles.some((p) => p.Id === licantropo.Id)).toBeTrue();

        component.seleccionarPlantilla(liche);

        expect(component.Personaje.Tipo_criatura?.Id).toBe(9);
        expect(component.plantillasElegibles.some((p) => p.Id === licantropo.Id)).toBeFalse();
        expect(component.plantillasBloqueadasFailed.some((item) => item.plantilla.Id === licantropo.Id)).toBeTrue();
        expect(component.plantillasBloqueadasFailed.some((item) => item.plantilla.Id === exigeCarismaAlto.Id)).toBeTrue();
    });

    it('criaturas_compatibles no se cumple por colision numerica con id de subtipo', async () => {
        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });

        component.Personaje.Tipo_criatura = {
            ...component.Personaje.Tipo_criatura!,
            Id: 1,
            Nombre: 'Humanoide',
        } as any;
        component.Personaje.Subtipos = [{ Id: 77, Nombre: 'Fuego' } as any];

        const requiereTipo77 = crearPlantillaMock({
            Id: 923,
            Nombre: 'Solo tipo 77',
            Prerrequisitos_flags: { criaturas_compatibles: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                criaturas_compatibles: [{ Id_tipo_compatible: 77, opcional: 0 }],
            },
        });

        component.plantillasCatalogo = [requiereTipo77];
        nuevoPSvc.setPlantillasDisponibles(component.plantillasCatalogo);
        (component as any).recalcularPlantillasVisibles();

        expect(component.plantillasElegibles.some((p) => p.Id === requiereTipo77.Id)).toBeFalse();
        expect(component.plantillasBloqueadasFailed.some((item) => item.plantilla.Id === requiereTipo77.Id)).toBeTrue();
    });

    it('continuarDesdeVentajas avanza al paso clases', () => {
        component.continuarDesdeVentajas();
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('clases');
        expect(component.selectedInternalTabIndex).toBe(4);
    });

    it('mapearPasoAIndex incluye habilidades, conjuros y dotes', () => {
        expect((component as any).mapearPasoAIndex('habilidades')).toBe(5);
        expect((component as any).mapearPasoAIndex('conjuros')).toBe(6);
        expect((component as any).mapearPasoAIndex('dotes')).toBe(6);
    });

    it('muestra nombre de raza en origen de habilidades cuando viene de DG racial', () => {
        const raza = crearRazaMock();
        raza.Nombre = 'Semielfo';
        component.seleccionarRaza(raza);
        nuevoPSvc.EstadoFlujo.habilidades.origen = 'raza_dg';

        expect(component.origenHabilidadesTexto).toBe('Semielfo');
    });

    it('muestra nombre de plantilla en origen de habilidades cuando solo hay una con DG', () => {
        const plantilla = crearPlantillaMock({
            Nombre: 'Liche',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 2, Suma: 0 },
        });
        nuevoPSvc.EstadoFlujo.plantillas.seleccionadas = [plantilla];
        nuevoPSvc.EstadoFlujo.habilidades.origen = 'plantilla_dg';

        expect(component.origenHabilidadesTexto).toBe('Liche');
    });

    it('muestra Plantillas en origen de habilidades cuando hay varias con DG', () => {
        const plantillaA = crearPlantillaMock({
            Nombre: 'A',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 1, Suma: 0 },
        });
        const plantillaB = crearPlantillaMock({
            Id: 2,
            Nombre: 'B',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 2, Suma: 0 },
        });
        nuevoPSvc.EstadoFlujo.plantillas.seleccionadas = [plantillaA, plantillaB];
        nuevoPSvc.EstadoFlujo.habilidades.origen = 'plantilla_dg';

        expect(component.origenHabilidadesTexto).toBe('Plantillas');
    });

    it('muestra Nivel en origen de habilidades cuando viene de clase', () => {
        nuevoPSvc.EstadoFlujo.habilidades.origen = 'clase_nivel';
        expect(component.origenHabilidadesTexto).toBe('Nivel');
    });

    it('filtros combinados de clases devuelven solo coincidencias válidas', () => {
        const mago = crearClaseMock({
            Id: 2,
            Nombre: 'Mago',
            Descripcion: 'Lanzador arcano de soporte',
            Manual: { Id: 2, Nombre: 'Manual arcano', Pagina: 20 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
            },
            Roles: { Dps: false, Tanque: false, Support: true, Utilidad: true },
        });
        const guerrero = crearClaseMock({
            Id: 3,
            Nombre: 'Guerrero',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
            Roles: { Dps: true, Tanque: true, Support: false, Utilidad: false },
        });
        component.catalogoClases = [mago, guerrero];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);

        component.onFiltroClasesTextoChange('mago');
        component.onFiltroClasesManualChange('Manual arcano');
        component.onFiltroClasesTipoLanzadorChange('arcano');
        component.onFiltroClasesRolChange('support');
        component.onFiltroClasesPrestigioChange('basica');

        expect(component.clasesListadoFiltrado.length).toBe(1);
        expect(component.clasesListadoFiltrado[0].clase.Nombre).toBe('Mago');
    });

    it('oculta clases con prerrequisitos no cumplidos y mantiene visibles las elegibles', () => {
        const elegida = crearClaseMock({ Id: 11, Nombre: 'Guerrero' });
        const elegible = crearClaseMock({ Id: 12, Nombre: 'Mago' });
        const bloqueada = crearClaseMock({
            Id: 13,
            Nombre: 'Titán',
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 99, opcional: 0 }],
            },
        });
        const unknown = crearClaseMock({
            Id: 14,
            Nombre: 'No evaluable',
            Prerrequisitos_flags: { competencia_arma: true },
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                competencia_arma: [{ Id_arma: 1, opcional: 0 }],
            },
        });
        component.Personaje.desgloseClases = [{ Nombre: 'Guerrero', Nivel: 1 }];
        component.catalogoClases = [unknown, bloqueada, elegible, elegida];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const orden = component.clasesListadoFiltrado.map((item) => item.clase.Nombre);
        expect(orden[0]).toBe('Guerrero');
        expect(orden[1]).toBe('Mago');
        expect(orden).not.toContain('Titán');
        expect(orden).not.toContain('No evaluable');
    });

    it('habilita Siguiente en clases solo con selección elegible', () => {
        const elegible = crearClaseMock({ Id: 21, Nombre: 'Explorador' });
        const bloqueada = crearClaseMock({
            Id: 22,
            Nombre: 'Coloso',
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 99, opcional: 0 }],
            },
        });
        component.catalogoClases = [elegible, bloqueada];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        component.seleccionarClaseParaAplicar(bloqueada);
        expect(component.puedeAplicarClaseSeleccionada).toBeFalse();

        component.seleccionarClaseParaAplicar(elegible);
        expect(component.puedeAplicarClaseSeleccionada).toBeTrue();
    });

    it('muestra recomendaciones de clase solo con auto-reparto aplicado y sin clases previas', () => {
        component.Personaje.Auto_reparto = {
            version: 'quiz_v1',
            respuestas: {
                q1: 'magia_arcana',
                q2: 'delante',
                q3: 'investigar',
            },
            score: {
                Fuerza: 2,
                Destreza: 1,
                Constitucion: 7,
                Inteligencia: 9,
                Sabiduria: 3,
                Carisma: 0,
            },
            ranking: ['Inteligencia', 'Constitucion', 'Sabiduria', 'Fuerza', 'Destreza', 'Carisma'],
            top2: ['Inteligencia', 'Constitucion'],
            recomendacion: {
                clases: ['Mago', 'Guerrero psíquico'],
                explicacion: 'Poder mental combinado con resistencia te permite mantener el control incluso en situaciones prolongadas.',
                top1: 'Inteligencia',
                top2: 'Constitucion',
                top3: 'Sabiduria',
                afinadaPorTop3: false,
            },
            pregunta4Aplicada: false,
            aplicadoAutomaticamente: true,
            updatedAt: Date.now(),
        };
        component.Personaje.desgloseClases = [];
        expect(component.mostrarInfoRecomendacionesClase).toBeTrue();

        component.Personaje.desgloseClases = [{ Nombre: 'Mago', Nivel: 1 }];
        expect(component.mostrarInfoRecomendacionesClase).toBeFalse();

        component.Personaje.desgloseClases = [];
        component.Personaje.Auto_reparto.aplicadoAutomaticamente = false;
        expect(component.mostrarInfoRecomendacionesClase).toBeFalse();
    });

    it('abre modal de recomendaciones en pestaña clases', () => {
        component.Personaje.Auto_reparto = {
            version: 'quiz_v1',
            respuestas: {
                q1: 'rapidez_precision',
                q2: 'evitar_contacto',
                q3: 'manitas',
            },
            score: {
                Fuerza: 0,
                Destreza: 11,
                Constitucion: 3,
                Inteligencia: 4,
                Sabiduria: 0,
                Carisma: 0,
            },
            ranking: ['Destreza', 'Inteligencia', 'Constitucion', 'Fuerza', 'Sabiduria', 'Carisma'],
            top2: ['Destreza', 'Inteligencia'],
            recomendacion: {
                clases: ['Pícaro', 'Mago'],
                explicacion: 'Tu perfil mezcla precisión y mente estratégica. Eres eficaz tanto resolviendo situaciones complejas como explotando debilidades enemigas.',
                top1: 'Destreza',
                top2: 'Inteligencia',
                top3: 'Constitucion',
                afinadaPorTop3: false,
            },
            pregunta4Aplicada: false,
            aplicadoAutomaticamente: true,
            updatedAt: Date.now(),
        };
        component.Personaje.desgloseClases = [];

        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        component.abrirInfoRecomendacionesClase();

        expect(swalSpy).toHaveBeenCalled();
        expect((swalSpy.calls.mostRecent().args[0] as any).title).toBe('Recomendaciones');
    });

    it('mantiene visible una clase incompatible por alineamiento y la marca como aplicable con aviso', () => {
        const barbaro = crearClaseMock({
            Id: 31,
            Nombre: 'Bárbaro',
            Alineamiento: {
                Id: 100,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'Nunca legal' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: '',
            },
        });
        component.Personaje.Alineamiento = 'Legal bueno';
        component.catalogoClases = [barbaro];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);

        (component as any).recalcularClasesVisibles();

        expect(component.clasesListadoFiltrado.length).toBe(1);
        expect(component.clasesListadoFiltrado[0].compatAlineamiento.estado).toBe('incompatible');
        expect(component.clasesListadoFiltrado[0].puedeAplicarse).toBeTrue();
    });

    it('recalcularClasesVisibles mantiene visible una clase homebrew pero la bloquea por campaña al alcanzar el límite', () => {
        component.Personaje.Campana = 'Campaña A';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        component.seleccionarRaza(crearRazaMock(false));
        component.incluirHomebrewClases = true;
        const claseHomebrew = crearClaseMock({
            Id: 999,
            Nombre: 'Espadachín astral',
            Oficial: false,
        });
        component.catalogoClases = [claseHomebrew];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);

        (component as any).recalcularClasesVisibles();

        expect(component.clasesListadoFiltrado.length).toBe(1);
        expect(component.clasesListadoFiltrado[0].campaignBlockedReason).toContain('bloqueada por campaña');
        expect(component.clasesListadoFiltrado[0].puedeAplicarse).toBeFalse();
    });

    it('incompatibilidad P3: al confirmar, aplica clase y deja personaje no oficial', async () => {
        const barbaro = crearClaseMock({
            Id: 32,
            Nombre: 'Bárbaro',
            Alineamiento: {
                Id: 100,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'Nunca legal' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: '',
            },
        });
        component.Personaje.Alineamiento = 'Legal bueno';
        component.catalogoClases = [barbaro];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(barbaro);
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeClases();

        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Bárbaro' && c.Nivel === 1)).toBeTrue();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('incompatibilidad P2: al confirmar, aplica clase y la marca como homebrew por saltarse alineamiento', async () => {
        const claseP2 = crearClaseMock({
            Id: 33,
            Nombre: 'Monje estricto',
            Alineamiento: {
                Id: 101,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'Nunca legal' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 2, Nombre: 'Casi siempre' },
                Descripcion: '',
            },
        });
        component.Personaje.Alineamiento = 'Legal bueno';
        component.catalogoClases = [claseP2];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseP2);
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeClases();

        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Monje estricto' && c.Nivel === 1)).toBeTrue();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('avisa por alineamiento solo al nivel 1 de cada clase incompatible', async () => {
        const detalleNivelBase = {
            Ataque_base: '+1',
            Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: crearConjurosDiariosMock(),
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
        };
        const barbaro = crearClaseMock({
            Id: 381,
            Nombre: 'Bárbaro',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Alineamiento: {
                Id: 100,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'Nunca legal' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: '',
            },
            Desglose_niveles: [
                {
                    ...detalleNivelBase,
                    Nivel: 1,
                } as any,
                {
                    ...detalleNivelBase,
                    Nivel: 2,
                    Ataque_base: '+2',
                    Salvaciones: { Fortaleza: '+3', Reflejos: '+0', Voluntad: '+0' },
                } as any,
            ],
        });
        const monje = crearClaseMock({
            Id: 382,
            Nombre: 'Monje estricto',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Alineamiento: {
                Id: 101,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'Nunca legal' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: '',
            },
        });
        component.Personaje.Alineamiento = 'Legal bueno';
        component.catalogoClases = [barbaro, monje];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(barbaro);
        await component.continuarDesdeClases();
        (component as any).recalcularClasesVisibles();

        component.seleccionarClaseParaAplicar(barbaro);
        await component.continuarDesdeClases();
        (component as any).recalcularClasesVisibles();

        component.seleccionarClaseParaAplicar(monje);
        await component.continuarDesdeClases();

        const avisosAlineamiento = swalSpy.calls.allArgs()
            .map((args) => args[0] as any)
            .filter((config) => config?.title === 'Aviso de alineamiento de clase');
        expect(avisosAlineamiento.length).toBe(2);
        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Bárbaro' && c.Nivel === 2)).toBeTrue();
        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Monje estricto' && c.Nivel === 1)).toBeTrue();
    });

    it('aplicar clase homebrew marca personaje como no oficial', async () => {
        const claseHomebrew = crearClaseMock({
            Id: 34,
            Nombre: 'Ejemplo homebrew',
            Oficial: false,
        });
        component.incluirHomebrewClases = true;
        component.catalogoClases = [claseHomebrew];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseHomebrew);

        await component.continuarDesdeClases();

        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Ejemplo homebrew' && c.Nivel === 1)).toBeTrue();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('continuarDesdeClases bloquea una clase incompatible si la campaña no permite ignorar alineamiento', async () => {
        const monje = crearClaseMock({
            Id: 45,
            Nombre: 'Monje estricto',
            Alineamiento: {
                Id: 1,
                Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                Ley: { Id_ley: 1, Nombre: 'Legal' },
                Moral: { Id_moral: 1, Nombre: 'Bueno' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Duro' },
                Descripcion: 'Solo para legales buenos',
            },
        });
        component.Personaje.Campana = 'Caballeros';
        component.Personaje.Alineamiento = 'Caotico maligno';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: 3,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        component.catalogoClases = [monje];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(monje);
        await component.continuarDesdeClases();

        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.title ?? ''}`).toContain('La campaña no permite esta clase');
        expect(component.Personaje.desgloseClases.some((c) => c.Nombre === 'Monje estricto')).toBeFalse();
    });

    it('continuarDesdeClases avanza a habilidades cuando aplica correctamente', async () => {
        const clase = crearClaseMock({ Id: 340, Nombre: 'Guardabosques' });
        component.Personaje.ModInteligencia = 0;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        await component.continuarDesdeClases();

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('habilidades');
        expect(component.selectedInternalTabIndex).toBe(5);
    });

    it('habilidades bloquea continuar si quedan puntos por repartir', async () => {
        const clase = crearClaseMock({
            Id: 346,
            Nombre: 'Rastreador',
            Puntos_habilidad: { Id: 1, Valor: 2 },
        });
        component.Personaje.ModInteligencia = 0;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        await component.continuarDesdeClases();

        expect(component.puedeContinuarHabilidades).toBeFalse();
    });

    it('habilidadesOrdenadas filtra Crear 1/2 y ordena normales antes de custom', () => {
        component.Personaje.Habilidades = [
            { Id: 1, Nombre: 'Crear 1', Clasea: false, Entrenada: false, Car: 'Inteligencia', Mod_car: 0, Rangos: 0, Rangos_varios: 0, Extra: '', Varios: '', Custom: false, Soporta_extra: false, Extras: [], Bonos_varios: [] },
            { Id: 2, Nombre: 'Conocimiento oscuro', Clasea: false, Entrenada: false, Car: 'Inteligencia', Mod_car: 0, Rangos: 0, Rangos_varios: 0, Extra: '', Varios: '', Custom: true, Soporta_extra: false, Extras: [], Bonos_varios: [] },
            { Id: 3, Nombre: 'Avistar', Clasea: false, Entrenada: false, Car: 'Sabiduria', Mod_car: 0, Rangos: 0, Rangos_varios: 0, Extra: '', Varios: '', Custom: false, Soporta_extra: false, Extras: [], Bonos_varios: [] },
            { Id: 4, Nombre: 'Abrir cerraduras', Clasea: false, Entrenada: false, Car: 'Destreza', Mod_car: 0, Rangos: 0, Rangos_varios: 0, Extra: '', Varios: '', Custom: false, Soporta_extra: false, Extras: [], Bonos_varios: [] },
            { Id: 5, Nombre: 'Crear 2', Clasea: false, Entrenada: false, Car: 'Inteligencia', Mod_car: 0, Rangos: 0, Rangos_varios: 0, Extra: '', Varios: '', Custom: true, Soporta_extra: false, Extras: [], Bonos_varios: [] },
        ] as any;

        const nombres = component.habilidadesOrdenadas.map((h) => h.Nombre);
        expect(nombres).toEqual(['Abrir cerraduras', 'Avistar', 'Conocimiento oscuro']);
    });

    it('abrevia característica en la tabla de habilidades', () => {
        expect(component.getCaracteristicaAbreviada('Fuerza')).toBe('Fue');
        expect(component.getCaracteristicaAbreviada('Destreza')).toBe('Des');
        expect(component.getCaracteristicaAbreviada('Constitución')).toBe('Con');
        expect(component.getCaracteristicaAbreviada('Inteligencia')).toBe('Int');
        expect(component.getCaracteristicaAbreviada('Sabiduría')).toBe('Sab');
        expect(component.getCaracteristicaAbreviada('Carisma')).toBe('Car');
    });

    it('marca como rango nuevo solo cuando supera el valor inicial de la sesión', () => {
        const habilidad = {
            Id: 10,
            Nombre: 'Avistar',
            Rangos: 2,
            Clasea: true,
            Entrenada: false,
        } as any;
        nuevoPSvc.EstadoFlujo.habilidades.rangosIniciales = { 10: 1 };

        expect(component.tieneRangosHabilidad(habilidad)).toBeTrue();
        expect(component.esRangoNuevoHabilidad(habilidad)).toBeTrue();
    });

    it('marca como rango previo cuando no supera el valor inicial', () => {
        const habilidad = {
            Id: 11,
            Nombre: 'Escuchar',
            Rangos: 1,
            Clasea: true,
            Entrenada: false,
        } as any;
        nuevoPSvc.EstadoFlujo.habilidades.rangosIniciales = { 11: 1 };

        expect(component.tieneRangosHabilidad(habilidad)).toBeTrue();
        expect(component.esRangoNuevoHabilidad(habilidad)).toBeFalse();
    });

    it('onExtraHabilidadChange actualiza extra y desbloquea continuar si era obligatorio', () => {
        component.Personaje.Habilidades = [
            {
                Id: 55,
                Nombre: 'Conocimiento arcano',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: '',
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [{ Id_extra: 1, Extra: 'Planos', Descripcion: '' }],
                Bonos_varios: [],
            },
        ] as any;
        nuevoPSvc.EstadoFlujo.habilidades = {
            activa: true,
            origen: 'clase_nivel',
            returnStep: 'dotes',
            puntosTotales: 0,
            puntosRestantes: 0,
            nivelPersonajeReferencia: 1,
            classSkillTemporales: [],
        };

        expect(component.puedeContinuarHabilidades).toBeFalse();
        component.onExtraHabilidadChange(55, 'Planos');
        expect(component.Personaje.Habilidades[0].Extra).toBe('Planos');
        expect(component.puedeContinuarHabilidades).toBeTrue();
    });

    it('getOpcionesExtraHabilidad no filtra extras de Saber por selección en Conocimiento', () => {
        component.Personaje.Habilidades = [
            {
                Id: 32,
                Nombre: 'Saber 1',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: '',
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [
                    { Id_extra: 1, Extra: 'Planos', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Religion', Descripcion: '' },
                ],
                Bonos_varios: [],
            },
            {
                Id: 6,
                Nombre: 'Conocimiento de conjuros',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: 'Planos',
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [
                    { Id_extra: 1, Extra: 'Planos', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Religion', Descripcion: '' },
                ],
                Bonos_varios: [],
            },
        ] as any;

        const opciones = component.getOpcionesExtraHabilidad(component.Personaje.Habilidades[0] as any);
        expect(opciones.some((opcion) => opcion.Extra === 'Planos')).toBeTrue();
    });

    it('abrirSelectorExtraHabilidad abre modal y aplica selección al confirmar', async () => {
        component.Personaje.Habilidades = [
            {
                Id: 55,
                Nombre: 'Saber 1',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: '',
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [{ Id_extra: 1, Extra: 'Planos', Descripcion: '' }],
                Bonos_varios: [],
            },
        ] as any;

        const apertura = component.abrirSelectorExtraHabilidad(component.Personaje.Habilidades[0] as any);
        expect(component.modalSelectorExtraHabilidadAbierto).toBeTrue();

        component.onConfirmarSelectorExtraHabilidad('Planos');
        await apertura;

        expect(component.Personaje.Habilidades[0].Extra).toBe('Planos');
        expect(component.modalSelectorExtraHabilidadAbierto).toBeFalse();
    });

    it('abrirSelectorExtraHabilidad no cambia extra al cancelar modal', async () => {
        component.Personaje.Habilidades = [
            {
                Id: 56,
                Nombre: 'Saber 2',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: 'Religion',
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [
                    { Id_extra: 1, Extra: 'Planos', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Religion', Descripcion: '' },
                ],
                Bonos_varios: [],
            },
        ] as any;

        const apertura = component.abrirSelectorExtraHabilidad(component.Personaje.Habilidades[0] as any);
        expect(component.modalSelectorExtraHabilidadAbierto).toBeTrue();

        component.onCerrarSelectorExtraHabilidad();
        await apertura;

        expect(component.Personaje.Habilidades[0].Extra).toBe('Religion');
        expect(component.modalSelectorExtraHabilidadAbierto).toBeFalse();
    });

    it('no permite editar extra cuando viene bloqueado por la fuente', () => {
        component.Personaje.Habilidades = [
            {
                Id: 57,
                Nombre: 'Saber 3',
                Clasea: true,
                Entrenada: false,
                Car: 'Inteligencia',
                Mod_car: 0,
                Rangos: 0,
                Rangos_varios: 0,
                Extra: 'Religion',
                Extra_bloqueado: true,
                Varios: '',
                Custom: false,
                Soporta_extra: true,
                Extras: [
                    { Id_extra: 1, Extra: 'Planos', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Religion', Descripcion: '' },
                ],
                Bonos_varios: [],
            },
        ] as any;

        expect(component.esExtraEditableHabilidad(component.Personaje.Habilidades[0] as any)).toBeFalse();
    });

    it('continuarDesdeHabilidades con retorno dotes completa pipeline y vuelve a clases', async () => {
        const clase = crearClaseMock({
            Id: 347,
            Nombre: 'Iniciado',
            Puntos_habilidad: { Id: 1, Valor: 0 },
        });
        spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);
        component.Personaje.ModInteligencia = 0;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        await component.continuarDesdeClases();
        await component.continuarDesdeHabilidades();

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('clases');
        expect(component.selectedInternalTabIndex).toBe(4);
    });

    it('en clase_nivel resuelve dotes pendientes al continuar desde habilidades, no al aplicar clase', async () => {
        const clase = crearClaseMock({
            Id: 374,
            Nombre: 'Cazador marcial',
            Puntos_habilidad: { Id: 1, Valor: 0 },
        });
        component.Personaje.ModInteligencia = 0;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        const resolverDotesSpy = spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);

        await component.continuarDesdeClases();
        expect(resolverDotesSpy).not.toHaveBeenCalled();

        await component.continuarDesdeHabilidades();
        expect(resolverDotesSpy).toHaveBeenCalledTimes(1);
    });

    it('en raza_dg registra dotes extras antes de resolver pendientes al continuar desde habilidades', async () => {
        spyOn(nuevoPSvc, 'puedeCerrarDistribucionHabilidades').and.returnValue(true);
        const registrarRazaSpy = spyOn(nuevoPSvc, 'registrarDotesPendientesPorRazaExtras').and.returnValue([]);
        const resolverDotesSpy = spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);
        const cerrarSpy = spyOn(nuevoPSvc, 'cerrarDistribucionHabilidades').and.returnValue('plantillas');
        const pasoSpy = spyOn(nuevoPSvc, 'actualizarPasoActual');
        spyOn<any>(component, 'sincronizarTabConPaso');

        (nuevoPSvc.EstadoFlujo.habilidades as any) = {
            activa: true,
            origen: 'raza_dg',
            returnStep: 'plantillas',
            puntosTotales: 0,
            puntosRestantes: 0,
            nivelPersonajeReferencia: 0,
            classSkillTemporales: [],
        };

        await component.continuarDesdeHabilidades();

        expect(registrarRazaSpy).toHaveBeenCalledTimes(1);
        expect(registrarRazaSpy).toHaveBeenCalledWith(jasmine.any(String));
        expect(resolverDotesSpy).toHaveBeenCalledTimes(1);
        expect(cerrarSpy).toHaveBeenCalled();
        expect(pasoSpy).toHaveBeenCalledWith('plantillas');
    });

    it('continuarDesdeHabilidades salta a conjuros cuando hay sesión activa', async () => {
        const claseConConjuros = crearClaseMock({
            Id: 348,
            Nombre: 'Aspirante arcano',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [
                    { Id: 4001, Nombre: 'Luz', Nivel: 0, Espontaneo: true },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        component.catalogoConjuros = [{
            Id: 4001,
            Nombre: 'Luz',
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: { Id: 1, Nombre: 'Evocacion', Nombre_especial: '', Prohibible: true },
            Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
            Manual: '',
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 348, Clase: 'Aspirante arcano', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: true,
        } as any];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [claseConConjuros];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseConConjuros);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('conjuros');
        expect(component.selectedInternalTabIndex).toBe(6);
    });

    it('continuarDesdeConjuros con retorno dotes completa pipeline y vuelve a clases', async () => {
        const claseConConjuros = crearClaseMock({
            Id: 349,
            Nombre: 'Adepto místico',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [
                    { Id: 4002, Nombre: 'Detectar magia', Nivel: 0, Espontaneo: true },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        spyOn<any>(component, 'resolverFlujoPostDotesFinNivel').and.resolveTo(true);
        spyOn<any>(component, 'resolverPasoPostDotesFinNivel').and.returnValue('clases');
        const conjuro = {
            Id: 4002,
            Nombre: 'Detectar magia',
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: { Id: 1, Nombre: 'Adivinacion', Nombre_especial: '', Prohibible: true },
            Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
            Manual: '',
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 349, Clase: 'Adepto místico', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: true,
        } as any;
        component.catalogoConjuros = [conjuro];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [claseConConjuros];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseConConjuros);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();
        (nuevoPSvc.EstadoFlujo.conjuros as any).returnStep = 'dotes';
        component.agregarConjuroSesion(conjuro);
        component.continuarDesdeConjuros();
        await Promise.resolve();
        await Promise.resolve();

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('clases');
        expect(component.selectedInternalTabIndex).toBe(4);
    });

    it('mensaje de progreso no afirma autoadición en conocidos nivel a nivel sin delta', async () => {
        const claseSinDelta = crearClaseMock({
            Id: 350,
            Nombre: 'Mago sin delta',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: true,
                Listado: [{ Id: 4003, Nombre: 'Luz', Nivel: 0, Espontaneo: false }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: { Nivel_0: 0 } as any,
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        component.catalogoConjuros = [{
            Id: 4003,
            Nombre: 'Luz',
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: { Id: 1, Nombre: 'Evocacion', Nombre_especial: '', Prohibible: true },
            Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
            Manual: '',
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 350, Clase: 'Mago sin delta', Nivel: 0, Espontaneo: false }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: true,
        } as any];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [claseSinDelta];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseSinDelta);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();

        expect(component.mensajeProgresoConjuros.toLowerCase()).not.toContain('automatic');
        expect(component.mensajeProgresoConjuros).toContain('no otorga nuevos conjuros conocidos');
    });

    it('expone recién obtenidos vacío cuando no hay obtención en el avance', async () => {
        const claseSinObtencion = crearClaseMock({
            Id: 351,
            Nombre: 'Sin obtención',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: true,
                Listado: [],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: { Nivel_0: 0 } as any,
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        component.catalogoConjuros = [];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [claseSinObtencion];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseSinObtencion);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();

        expect(component.conjurosSeleccionadosActuales.length).toBe(0);
    });

    it('entrada psiónica expone nivel máximo de poder accesible para la UI', async () => {
        const clasePsionica = crearClaseMock({
            Id: 352,
            Nombre: 'Psiónico base',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 4004, Nombre: 'Empuje mental', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 0,
                Reserva_psionica: 2,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        component.catalogoConjuros = [{
            Id: 4004,
            Nombre: 'Empuje mental',
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: { Id: 1, Nombre: 'Psionica', Nombre_especial: '', Prohibible: false },
            Disciplina: { Id: 1, Nombre: 'Telepatia', Nombre_especial: '', Subdisciplinas: [] },
            Manual: '',
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: false,
            Divino: false,
            Psionico: true,
            Alma: false,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 1,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 352, Clase: 'Psiónico base', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: true,
        } as any];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [clasePsionica];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clasePsionica);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();

        expect(component.entradaConjurosActual?.tipoLanzamiento).toBe('psionico');
        expect(component.entradaConjurosActual?.nivelMaxPoderAccesiblePsionico).toBe(0);
    });

    it('entrada arcana no expone nivel máximo de poder psiónico', async () => {
        const claseArcana = crearClaseMock({
            Id: 353,
            Nombre: 'Arcano base',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 4005, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        component.catalogoConjuros = [{
            Id: 4005,
            Nombre: 'Luz',
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: { Id: 1, Nombre: 'Evocacion', Nombre_especial: '', Prohibible: true },
            Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
            Manual: '',
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 353, Clase: 'Arcano base', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: true,
        } as any];
        nuevoPSvc.setCatalogoConjuros(component.catalogoConjuros);
        component.catalogoClases = [claseArcana];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseArcana);

        await component.continuarDesdeClases();
        (nuevoPSvc.EstadoFlujo.habilidades as any).returnStep = 'conjuros';
        await component.continuarDesdeHabilidades();

        expect(component.entradaConjurosActual?.tipoLanzamiento).toBe('arcano');
        expect(component.entradaConjurosActual?.nivelMaxPoderAccesiblePsionico).toBe(-1);
    });

    it('al aplicar clase con especialidad, resuelve especialidad antes de idiomas', async () => {
        const clase = crearClaseMock({
            Id: 370,
            Nombre: 'Mago',
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        component.Personaje.ModInteligencia = 2;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        const orden: string[] = [];
        spyOn<any>(component, 'solicitarEspecialidadMagicaClase').and.callFake(async () => {
            orden.push('especialidad');
            return {
                arcana: {
                    especializar: false,
                    escuelaEspecialistaId: null,
                    escuelasProhibidasIds: [],
                },
            };
        });
        spyOn(component, 'abrirSelectorIdiomasIniciales').and.callFake(async () => {
            orden.push('idiomas');
            return true;
        });

        await component.continuarDesdeClases();

        expect(orden).toEqual(['especialidad', 'idiomas']);
    });

    it('el modal de especialidad bloquea avance hasta confirmación válida', async () => {
        const clase = crearClaseMock({
            Id: 371,
            Nombre: 'Mago',
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        component.Personaje.ModInteligencia = 2;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        let resolverEspecialidad: ((value: any) => void) | null = null;
        spyOn<any>(component, 'solicitarEspecialidadMagicaClase').and.returnValue(
            new Promise((resolve) => {
                resolverEspecialidad = resolve;
            })
        );
        const abrirIdiomasSpy = spyOn(component, 'abrirSelectorIdiomasIniciales').and.resolveTo(true);
        const promise = component.continuarDesdeClases();
        await Promise.resolve();

        expect(abrirIdiomasSpy).not.toHaveBeenCalled();
        expect(resolverEspecialidad).not.toBeNull();

        if (!resolverEspecialidad)
            fail('Resolver de especialidad no inicializado');

        const resolverEspecialidadFn = resolverEspecialidad!;
        resolverEspecialidadFn({
            arcana: {
                especializar: false,
                escuelaEspecialistaId: null,
                escuelasProhibidasIds: [],
            },
        });
        await promise;

        expect(abrirIdiomasSpy).toHaveBeenCalledWith(2);
    });

    it('mago puede confirmar no especializarse y continuar el flujo', async () => {
        const clase = crearClaseMock({
            Id: 372,
            Nombre: 'Mago',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);
        spyOn<any>(component, 'solicitarEspecialidadMagicaClase').and.resolveTo({
            arcana: {
                especializar: false,
                escuelaEspecialistaId: null,
                escuelasProhibidasIds: [],
            },
        });

        await component.continuarDesdeClases();

        expect(component.Personaje.Escuela_especialista.Nombre).toBe('Cualquiera');
        expect(component.Personaje.Escuelas_prohibidas).toEqual([]);
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('habilidades');
    });

    it('psiónico no continúa a idiomas si la selección de especialidad es inválida', async () => {
        disciplinaSvcMock.getDisciplinas = () => of([
            { Id: 1, Nombre: 'Metacreatividad', Nombre_especial: 'Metacreador', Subdisciplinas: [] },
            { Id: 2, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [] },
        ]);
        const clase = crearClaseMock({
            Id: 373,
            Nombre: 'Psiónico',
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Psionicos: true,
                puede_elegir_especialidad: true,
            },
        });
        component.Personaje.ModInteligencia = 2;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        spyOn<any>(component, 'solicitarEspecialidadMagicaClase').and.resolveTo({
            psionica: {
                disciplinaEspecialistaId: null,
                disciplinaProhibidaId: null,
            },
        });
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const abrirIdiomasSpy = spyOn(component, 'abrirSelectorIdiomasIniciales').and.resolveTo(true);

        await component.continuarDesdeClases();

        expect(abrirIdiomasSpy).not.toHaveBeenCalled();
        expect(component.Personaje.Disciplina_especialista.Nombre).toBe('Ninguna');
    });

    it('si hay idiomas pendientes tras aplicar clase, abre el selector de idiomas iniciales', async () => {
        const clase = crearClaseMock({ Id: 341, Nombre: 'Explorador' });
        component.Personaje.ModInteligencia = 2;
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        const abrirIdiomasSpy = spyOn(component, 'abrirSelectorIdiomasIniciales').and.resolveTo(true);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        await component.continuarDesdeClases();

        expect(abrirIdiomasSpy).toHaveBeenCalledWith(2);
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('habilidades');
    });

    it('tras generar caracteristicas con DGs suficientes, dispara selector de aumentos', async () => {
        const razaConDgs = crearRazaMock();
        razaConDgs.Dgs_adicionales.Cantidad = 4;
        component.seleccionarRaza(razaConDgs);
        const abrirAumentosSpy = spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);

        await component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });

        expect(abrirAumentosSpy).toHaveBeenCalled();
        expect(nuevoPSvc.getAumentosCaracteristicaPendientes().length).toBe(1);
    });

    it('si coinciden idiomas y aumentos, resuelve idiomas antes de aumentos', async () => {
        const razaConDgs = crearRazaMock();
        razaConDgs.Dgs_adicionales.Cantidad = 3;
        component.seleccionarRaza(razaConDgs);
        component.Personaje.ModInteligencia = 2;

        const clase = crearClaseMock({ Id: 360, Nombre: 'Cazador' });
        component.catalogoClases = [clase];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(clase);

        const ordenLlamadas: string[] = [];
        const abrirIdiomasSpy = spyOn(component, 'abrirSelectorIdiomasIniciales').and.callFake(async (_cantidad: number) => {
            ordenLlamadas.push('idiomas');
            return true;
        });
        const abrirAumentosSpy = spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.callFake(async () => {
            ordenLlamadas.push('aumentos');
            return true;
        });
        spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);

        await component.continuarDesdeClases();

        expect(abrirIdiomasSpy).toHaveBeenCalled();
        expect(abrirAumentosSpy).toHaveBeenCalledTimes(1);
        expect(ordenLlamadas).toEqual(['idiomas', 'aumentos']);
    });

    it('si coinciden aumento por multiplo de 4 y por especial, abre una sola vez con ambos', async () => {
        const razaConDgs = crearRazaMock();
        razaConDgs.Dgs_adicionales.Cantidad = 3;
        component.seleccionarRaza(razaConDgs);
        component.Personaje.ModInteligencia = 0;

        const claseConEspecialAumento = crearClaseMock({
            Id: 361,
            Nombre: 'Adepto del poder',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [{
                    Especial: {
                        Nombre: 'Caracteristica +2',
                        Modificadores: { Caracteristica: 2 },
                    },
                    Nivel: 1,
                    Id_extra: 0,
                    Extra: '',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
            }],
        });
        component.catalogoClases = [claseConEspecialAumento];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseConEspecialAumento);

        const abrirAumentosSpy = spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        const registrarEspecialesSpy = spyOn(nuevoPSvc, 'registrarAumentosPendientesPorEspeciales').and.callThrough();
        const registrarProgresionSpy = spyOn(nuevoPSvc, 'registrarAumentosPendientesPorProgresion').and.callThrough();
        spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);

        await component.continuarDesdeClases();

        expect(abrirAumentosSpy).toHaveBeenCalledTimes(1);
        expect(registrarEspecialesSpy).toHaveBeenCalled();
        expect(registrarProgresionSpy).toHaveBeenCalled();
    });

    it('si la clase requiere dominio, usa el flujo de selector de dominios', async () => {
        const claseConDominio = crearClaseMock({
            Id: 342,
            Nombre: 'Clérigo',
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Dominio: true,
            },
        });
        nuevoPSvc.setCatalogoDominios([{ Id: 1, Nombre: 'Guerra', Oficial: true } as any]);
        component.Personaje.Deidad = 'No tener deidad';
        component.Personaje.ModInteligencia = 0;
        component.catalogoClases = [claseConDominio];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        const dominiosSpy = spyOn<any>(component, 'solicitarSeleccionesDominiosClase').and.resolveTo([1]);
        (component as any).recalcularClasesVisibles();
        component.seleccionarClaseParaAplicar(claseConDominio);

        await component.continuarDesdeClases();

        expect(dominiosSpy).toHaveBeenCalled();
        expect(component.Personaje.Dominios.some((d) => d.Nombre === 'Guerra')).toBeTrue();
    });

    it('regla de visibilidad de columna homebrew se calcula correctamente', () => {
        component.Personaje.Oficial = true;
        component.incluirHomebrewClases = false;
        expect(component.mostrarColumnaHomebrewClases).toBeFalse();

        component.incluirHomebrewClases = true;
        expect(component.mostrarColumnaHomebrewClases).toBeTrue();

        component.Personaje.Oficial = false;
        component.incluirHomebrewClases = false;
        expect(component.mostrarColumnaHomebrewClases).toBeTrue();
    });

    it('beneficios de siguiente nivel generan chips y emiten detalle de dote/especial', () => {
        const claseConBeneficios = crearClaseMock({
            Id: 35,
            Nombre: 'Campeón',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [{
                    Dote: { Id: 400, Nombre: 'Ataque poderoso' } as any,
                    Nivel: 1,
                    Id_extra: 0,
                    Extra: 'Espada larga',
                    Opcional: 1,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
                Especiales: [{
                    Especial: { Nombre: 'Furia marcial' },
                    Nivel: 1,
                    Id_extra: 0,
                    Extra: 'versión base',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
            }],
        });
        component.catalogoClases = [claseConBeneficios];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();
        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficios.length).toBe(2);
        expect(fila.beneficios.some((b) => b.tipo === 'dote' && b.extra === 'Espada larga')).toBeTrue();
        expect(fila.beneficios.some((b) => b.tipo === 'especial' && b.nombre === 'Furia marcial')).toBeTrue();

        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const especialSpy = spyOn(component.especialDetallesPorNombre, 'emit');

        const doteBeneficio = fila.beneficios.find((b) => b.tipo === 'dote');
        const especialBeneficio = fila.beneficios.find((b) => b.tipo === 'especial');
        if (doteBeneficio)
            component.abrirDetalleBeneficioClase(doteBeneficio);
        if (especialBeneficio)
            component.abrirDetalleBeneficioClase(especialBeneficio);

        expect(doteSpy).toHaveBeenCalled();
        expect(especialSpy).toHaveBeenCalledWith('Furia marcial');
    });

    it('calcula salvaciones de siguiente nivel como delta y conserva +0 en el texto', () => {
        const claseConSalvaciones = crearClaseMock({
            Id: 374,
            Nombre: 'Defensor',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });

        component.catalogoClases = [claseConSalvaciones];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.salvacionesDelta).toEqual({
            fortaleza: 2,
            reflejos: 0,
            voluntad: 0,
        });
        expect(component.getTextoSalvacionesDeltaClase(fila)).toBe('Fort +2 | Ref +0 | Vol +0');
    });

    it('calcula delta de salvaciones respecto al nivel anterior cuando la clase ya está elegida', () => {
        const claseConDosNiveles = crearClaseMock({
            Id: 375,
            Nombre: 'Custodio',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+2',
                    Salvaciones: { Fortaleza: '+3', Reflejos: '+1', Voluntad: '+0' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        component.Personaje.desgloseClases = [{ Nombre: 'Custodio', Nivel: 1 }];
        component.catalogoClases = [claseConDosNiveles];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.siguienteNivel).toBe(2);
        expect(fila.salvacionesDelta).toEqual({
            fortaleza: 1,
            reflejos: 1,
            voluntad: 0,
        });
        expect(component.getTextoSalvacionesDeltaClase(fila)).toBe('Fort +1 | Ref +1 | Vol +0');
    });

    it('oculta no aplica y filtra beneficios con extra +0 o 0 en la tabla de clases', () => {
        const claseConFiltrosExtra = crearClaseMock({
            Id: 36,
            Nombre: 'Psi guerrero',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [
                    {
                        Dote: { Id: 410, Nombre: 'Talento innato' } as any,
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'No aplica',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Dote: { Id: 411, Nombre: 'Cuchilla mental' } as any,
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: ' +0 ',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Dote: { Id: 412, Nombre: 'Soltura con un arma' } as any,
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'Desconocido',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                ],
                Especiales: [
                    {
                        Especial: { Nombre: 'Talento innato mejorado' },
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'No aplica',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Especial: { Nombre: 'Talento latente' },
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: '0',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Especial: { Nombre: 'Dominio mental' },
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'Desconocido',
                        Opcional: 0,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                ],
            }],
        });
        component.catalogoClases = [claseConFiltrosExtra];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficios.length).toBe(4);
        expect(fila.beneficios.some((b) => b.nombre === 'Cuchilla mental')).toBeFalse();
        expect(fila.beneficios.some((b) => b.nombre === 'Talento latente')).toBeFalse();

        const doteNoAplica = fila.beneficios.find((b) => b.tipo === 'dote' && b.nombre === 'Talento innato');
        const especialNoAplica = fila.beneficios.find((b) => b.tipo === 'especial' && b.nombre === 'Talento innato mejorado');
        expect(doteNoAplica?.extra).toBe('');
        expect(especialNoAplica?.extra).toBe('');

        expect(fila.beneficios.some((b) => b.tipo === 'dote' && b.nombre === 'Soltura con un arma' && b.extra === 'Desconocido')).toBeTrue();
        expect(fila.beneficios.some((b) => b.tipo === 'especial' && b.nombre === 'Dominio mental' && b.extra === 'Desconocido')).toBeTrue();
        expect(fila.beneficios.every((b) => b.extra.toLowerCase() !== 'no aplica')).toBeTrue();
    });

    it('resuelve extra desconocido usando catalogo cuando hay Id_extra y soporte de dote', () => {
        component.catalogoArmas = [
            {
                Id: 77,
                Nombre: 'Espada bastarda',
            } as any,
        ];
        const claseConExtraDesconocido = crearClaseMock({
            Id: 370,
            Nombre: 'Guerrero experto',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [{
                    Dote: {
                        Id: 701,
                        Nombre: 'Soltura con un arma',
                        Extras_soportados: {
                            Extra_arma: 1,
                            Extra_armadura: 0,
                            Extra_escuela: 0,
                            Extra_habilidad: 0,
                        },
                        Extras_disponibles: {
                            Armas: [{ Id: 77, Nombre: 'Desconocido' }],
                            Armaduras: [],
                            Escuelas: [],
                            Habilidades: [],
                        },
                    } as any,
                    Nivel: 1,
                    Id_extra: 77,
                    Extra: 'Desconocido',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
                Especiales: [],
            }],
        });

        component.catalogoClases = [claseConExtraDesconocido];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficios.length).toBe(1);
        expect(fila.beneficios[0].extra).toBe('Espada bastarda');
    });

    it('mantiene extra desconocido cuando no hay correspondencia fiable en catalogos', () => {
        component.catalogoArmas = [];
        component.catalogoArmaduras = [];
        component.catalogoGruposArmas = [];
        component.catalogoGruposArmaduras = [];
        const claseSinResolucion = crearClaseMock({
            Id: 371,
            Nombre: 'Monje incierto',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+2', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [{
                    Dote: {
                        Id: 702,
                        Nombre: 'Talento dudoso',
                        Extras_soportados: {
                            Extra_arma: 1,
                            Extra_armadura: 0,
                            Extra_escuela: 0,
                            Extra_habilidad: 0,
                        },
                        Extras_disponibles: {
                            Armas: [],
                            Armaduras: [],
                            Escuelas: [],
                            Habilidades: [],
                        },
                    } as any,
                    Nivel: 1,
                    Id_extra: 909,
                    Extra: 'Desconocido',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
                Especiales: [],
            }],
        });

        component.catalogoClases = [claseSinResolucion];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficios.length).toBe(1);
        expect(fila.beneficios[0].extra).toBe('Desconocido');
    });

    it('agrupa opcionales del mismo grupo como un bloque Elige entre', () => {
        const claseOpcionalDoble = crearClaseMock({
            Id: 372,
            Nombre: 'Monje',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+2', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [
                    {
                        Dote: { Id: 801, Nombre: 'Presa mejorada' } as any,
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'No aplica',
                        Opcional: 1,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Dote: { Id: 802, Nombre: 'Puñetazo aturdidor' } as any,
                        Nivel: 1,
                        Id_extra: 0,
                        Extra: 'No aplica',
                        Opcional: 1,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                ],
                Especiales: [],
            }],
        });

        component.catalogoClases = [claseOpcionalDoble];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficios.length).toBe(2);
        expect(fila.beneficiosRender.length).toBe(1);
        expect(fila.beneficiosRender[0].tipoRender).toBe('grupo_opcional');
        if (fila.beneficiosRender[0].tipoRender === 'grupo_opcional') {
            expect(fila.beneficiosRender[0].opciones.length).toBe(2);
            expect(fila.beneficiosRender[0].opciones.some((o) => o.nombre === 'Presa mejorada')).toBeTrue();
            expect(fila.beneficiosRender[0].opciones.some((o) => o.nombre === 'Puñetazo aturdidor')).toBeTrue();
        }
    });

    it('agrupa opcionales mixtos dote/especial en el mismo bloque', () => {
        const claseOpcionalMixta = crearClaseMock({
            Id: 373,
            Nombre: 'Adepto marcial',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+2', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [{
                    Dote: { Id: 803, Nombre: 'Presa mejorada' } as any,
                    Nivel: 1,
                    Id_extra: 0,
                    Extra: 'No aplica',
                    Opcional: 1,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
                Especiales: [{
                    Especial: { Nombre: 'Golpe sin armas mejorado' },
                    Nivel: 1,
                    Id_extra: 0,
                    Extra: 'No aplica',
                    Opcional: 1,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
            }],
        });

        component.catalogoClases = [claseOpcionalMixta];
        nuevoPSvc.setCatalogoClases(component.catalogoClases);
        (component as any).recalcularClasesVisibles();

        const fila = component.clasesListadoFiltrado[0];
        expect(fila.beneficiosRender.length).toBe(1);
        expect(fila.beneficiosRender[0].tipoRender).toBe('grupo_opcional');
        if (fila.beneficiosRender[0].tipoRender === 'grupo_opcional') {
            expect(fila.beneficiosRender[0].opciones.length).toBe(2);
            expect(fila.beneficiosRender[0].opciones.some((o) => o.tipo === 'dote')).toBeTrue();
            expect(fila.beneficiosRender[0].opciones.some((o) => o.tipo === 'especial')).toBeTrue();
        }
    });

    it('muestra contador de ventajas y puntos desde el estado del servicio', () => {
        const ventaja: VentajaDetalle = {
            Id: 10,
            Nombre: 'Fuerte',
            Descripcion: '',
            Disipable: false,
            Coste: -1,
            Mejora: 1,
            Caracteristica: false,
            Fuerza: true,
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
        };
        const desventaja: VentajaDetalle = {
            ...ventaja,
            Id: 11,
            Nombre: 'Miope',
            Coste: 1,
            Mejora: -1,
            Fuerza: false,
            Habilidad: { Id: 0, Nombre: 'Avistar', Descripcion: '' },
        };

        nuevoPSvc.setCatalogosVentajas([ventaja], [desventaja]);
        component.toggleDesventajaSeleccion(desventaja);
        component.toggleVentajaSeleccion(ventaja);

        expect(component.ventajasSeleccionadasCount).toBe(1);
        expect(component.flujoVentajas.puntosDisponibles).toBe(1);
        expect(component.flujoVentajas.puntosRestantes).toBe(0);
    });

    it('bloquea continuar desde ventajas con déficit', () => {
        const ventaja: VentajaDetalle = {
            Id: 12,
            Nombre: 'Caro',
            Descripcion: '',
            Disipable: false,
            Coste: -3,
            Mejora: 1,
            Caracteristica: false,
            Fuerza: true,
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
        };
        nuevoPSvc.setCatalogosVentajas([ventaja], []);
        component.toggleVentajaSeleccion(ventaja);

        expect(component.flujoVentajas.hayDeficit).toBeTrue();
        expect(component.puedeContinuarVentajas).toBeFalse();
    });

    it('returnStep dotes en habilidades ejecuta pipeline post-dotes y vuelve a clases', async () => {
        spyOn<any>(component, 'resolverDotesPendientes').and.resolveTo(true);
        spyOn(nuevoPSvc, 'getEstadoCuposFamiliarEspecial47').and.returnValue({
            especialId: 47,
            fuentes: [],
            fuentesClaseIds: [],
            fuentesTotales: 0,
            cuposConsumidos: 0,
            cuposDisponibles: 0,
            nivelLanzadorFamiliar: 0,
        } as any);
        spyOn(nuevoPSvc, 'tieneCompaneroPendienteSinSelector').and.returnValue(false);
        spyOn(nuevoPSvc, 'cerrarDistribucionHabilidades').and.returnValue('dotes');
        const pasoSpy = spyOn(nuevoPSvc, 'actualizarPasoActual');
        spyOn<any>(component, 'sincronizarTabConPaso');

        (nuevoPSvc.EstadoFlujo.habilidades as any) = {
            activa: true,
            origen: 'clase_nivel',
            returnStep: 'dotes',
            puntosTotales: 0,
            puntosRestantes: 0,
            nivelPersonajeReferencia: 0,
            classSkillTemporales: [],
        };

        await component.continuarDesdeHabilidades();

        expect(pasoSpy).toHaveBeenCalledWith('clases');
    });

    it('pipeline post-dotes resuelve en orden compañero antes de familiar', async () => {
        const orden: string[] = [];
        spyOn<any>(component, 'resolverDotesPendientes').and.callFake(async () => {
            orden.push('dotes');
            return true;
        });
        spyOn<any>(component, 'resolverCompaneroPendienteFinNivel').and.callFake(async () => {
            orden.push('companero');
            return true;
        });
        spyOn<any>(component, 'resolverFamiliarPendienteFinNivel').and.callFake(async () => {
            orden.push('familiar');
            return true;
        });

        const resultado = await (component as any).resolverFlujoPostDotesFinNivel();
        expect(resultado).toBeTrue();
        expect(orden).toEqual(['dotes', 'companero', 'familiar']);
    });

    it('resolverCompaneroPendienteFinNivel persiste selección al confirmar', async () => {
        const estadoMock = {
            especialId: 29,
            fuentes: [{ idClase: 5, nombreClase: 'Druida', nivelActual: 6 }],
            fuentesClaseIds: [5],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelEfectivoCompanero: 6,
        } as any;
        spyOn(nuevoPSvc, 'getEstadoCuposCompaneroEspecial29').and.returnValue(estadoMock);
        const companero = {
            Id: 110,
            Id_companero: 10,
            Nombre: 'Lobo',
            Plantilla: { Id: 1, Nombre: 'Base' },
        } as any;
        spyOn<any>(component, 'abrirSelectorCompanero').and.resolveTo({
            companero,
            plantilla: 'base',
            nombre: 'Compañero de prueba',
            nivel: 1,
        });
        spyOn<any>(component, 'cargarNombresEspecialesCompanero').and.resolveTo({
            157: 'Compañero animal',
            158: 'Vínculo',
            159: 'Devoción',
            57: 'Vínculo maestro',
        });
        const registrarSpy = spyOn(nuevoPSvc, 'registrarCompaneroSeleccionado').and.returnValue({
            registrado: true,
            companeroAgregado: companero,
            dote49Agregada: false,
            especialesAgregadosIds: [157, 158],
            bonosAplicados: { dgAdi: 4, trucosAdi: 3, bonoFueDes: 2, bonoArmaduraNatural: 4 },
        } as any);

        const resultado = await (component as any).resolverCompaneroPendienteFinNivel();
        expect(resultado).toBeTrue();
        expect(registrarSpy).toHaveBeenCalled();
    });

    it('resolverCompaneroPendienteFinNivel permite omitir y continuar', async () => {
        const estadoMock = {
            especialId: 29,
            fuentes: [{ idClase: 5, nombreClase: 'Druida', nivelActual: 6 }],
            fuentesClaseIds: [5],
            fuentesTotales: 1,
            cuposConsumidos: 0,
            cuposDisponibles: 1,
            nivelEfectivoCompanero: 6,
        } as any;
        spyOn(nuevoPSvc, 'getEstadoCuposCompaneroEspecial29').and.returnValue(estadoMock);
        spyOn<any>(component, 'abrirSelectorCompanero').and.resolveTo('omitir');
        const registrarSpy = spyOn(nuevoPSvc, 'registrarCompaneroSeleccionado');

        const resultado = await (component as any).resolverCompaneroPendienteFinNivel();
        expect(resultado).toBeTrue();
        expect(registrarSpy).not.toHaveBeenCalled();
    });

    it('returnStep dotes en habilidades usa destino plantillas cuando quedan elegibles', async () => {
        spyOn<any>(component, 'resolverFlujoPostDotesFinNivel').and.resolveTo(true);
        spyOn<any>(component, 'resolverPasoPostDotesFinNivel').and.returnValue('plantillas');
        spyOn(nuevoPSvc, 'cerrarDistribucionHabilidades').and.returnValue('dotes');
        const pasoSpy = spyOn(nuevoPSvc, 'actualizarPasoActual');
        spyOn<any>(component, 'sincronizarTabConPaso');

        (nuevoPSvc.EstadoFlujo.habilidades as any) = {
            activa: true,
            origen: 'clase_nivel',
            returnStep: 'dotes',
            puntosTotales: 0,
            puntosRestantes: 0,
            nivelPersonajeReferencia: 0,
            classSkillTemporales: [],
        };

        await component.continuarDesdeHabilidades();

        expect(pasoSpy).toHaveBeenCalledWith('plantillas');
    });

    it('returnStep dotes en conjuros cierra sesión y vuelve a clases', async () => {
        spyOn(nuevoPSvc, 'puedeCerrarSesionConjuros').and.returnValue(true);
        spyOn<any>(component, 'resolverFlujoPostDotesFinNivel').and.resolveTo(true);
        const cerrarSpy = spyOn(nuevoPSvc, 'cerrarSesionConjuros').and.returnValue('dotes');
        const pasoSpy = spyOn(nuevoPSvc, 'actualizarPasoActual');
        spyOn<any>(component, 'sincronizarTabConPaso');

        (nuevoPSvc.EstadoFlujo.conjuros as any) = {
            activa: true,
            indiceEntradaActual: 0,
            returnStep: 'dotes',
            entradas: [],
            avisos: [],
        };

        component.continuarDesdeConjuros();
        await Promise.resolve();
        await Promise.resolve();

        expect(cerrarSpy).toHaveBeenCalled();
        expect(pasoSpy).toHaveBeenCalledWith('clases');
    });

    it('returnStep dotes en conjuros usa destino plantillas cuando quedan elegibles', async () => {
        spyOn(nuevoPSvc, 'puedeCerrarSesionConjuros').and.returnValue(true);
        spyOn<any>(component, 'resolverFlujoPostDotesFinNivel').and.resolveTo(true);
        spyOn<any>(component, 'resolverPasoPostDotesFinNivel').and.returnValue('plantillas');
        const cerrarSpy = spyOn(nuevoPSvc, 'cerrarSesionConjuros').and.returnValue('dotes');
        const pasoSpy = spyOn(nuevoPSvc, 'actualizarPasoActual');
        spyOn<any>(component, 'sincronizarTabConPaso');

        (nuevoPSvc.EstadoFlujo.conjuros as any) = {
            activa: true,
            indiceEntradaActual: 0,
            returnStep: 'dotes',
            entradas: [],
            avisos: [],
        };

        component.continuarDesdeConjuros();
        await Promise.resolve();
        await Promise.resolve();

        expect(cerrarSpy).toHaveBeenCalled();
        expect(pasoSpy).toHaveBeenCalledWith('plantillas');
    });

    it('continuarDesdePlantillas salta ventajas si viene de retorno de fin de nivel', async () => {
        (nuevoPSvc.EstadoFlujo as any).caracteristicasGeneradas = true;
        nuevoPSvc.setRetornoFinNivelPendientePlantillas(true);
        spyOn<any>(component, 'abrirSelectorAumentosCaracteristica').and.resolveTo(true);
        spyOn<any>(component, 'sincronizarTabConPaso');

        await component.continuarDesdePlantillas();

        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('clases');
    });

    it('aplicarRestriccionesCampanaADotes bloquea una dote homebrew nueva cuando ya se alcanzó el límite', () => {
        component.Personaje.Campana = 'Campaña A';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 1,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        component.seleccionarRaza(crearRazaMock(false));
        const candidatos = (component as any).aplicarRestriccionesCampanaADotes([{
            dote: {
                Id: 77,
                Nombre: 'Dote homebrew',
                Beneficio: '',
                Descripcion: '',
                Manual: { Id: 1, Nombre: 'Manual homebrew', Pagina: 1 },
                Tipos: [],
                Oficial: false,
            },
            evaluacion: { estado: 'eligible', razones: [], advertencias: [] },
            repeticionValida: true,
            restringidaPorTipo: false,
            requiereExtra: false,
            extrasDisponibles: [],
        }]);

        expect(candidatos[0].evaluacion.estado).toBe('blocked_failed');
        expect(candidatos[0].evaluacion.razones.some((reason: string) => reason.includes('bloqueada por campaña'))).toBeTrue();
    });

    it('mostrarBotonFinalizarCreacion permite finalizar con clase o con 4+ DGs raciales', () => {
        component.Personaje.desgloseClases = [];
        component.Personaje.Raza.Dgs_adicionales.Cantidad = 0;
        expect(component.mostrarBotonFinalizarCreacion).toBeFalse();

        component.Personaje.desgloseClases = [{ Nombre: 'Mago', Nivel: 1 } as any];
        expect(component.mostrarBotonFinalizarCreacion).toBeTrue();

        component.Personaje.desgloseClases = [];
        component.Personaje.Raza.Dgs_adicionales.Cantidad = 4;
        expect(component.mostrarBotonFinalizarCreacion).toBeTrue();
    });

    it('onFinalizarCreacionTemporal abre selector de PG y realiza tirada inicial', async () => {
        component.Personaje.desgloseClases = [{ Nombre: 'Mago', Nivel: 1 } as any];
        const vidaSpy = spyOn(nuevoPSvc, 'calcularVidaFinalAleatoria').and.returnValue({
            total: 18,
            maximo: 18,
            detalle: {
                constitucionAplicada: true,
                modificadorConstitucion: 1,
                tiradasAleatorias: 1,
                dgsRaciales: 0,
                nivelesClase: 1,
                bonoPlanoDotes: 0,
                bonoPorDadoClaseDotes: 0,
                flags: {
                    dadosGolpe: true,
                    dgsRacialesExtra: false,
                    plantillasDgsAdicionales: false,
                    plantillasAumentoReduccionDgs: false,
                    plantillasActualizacionDgsRazaClase: false,
                    dotesSumaAdicionalDgs: false,
                },
            },
        });

        await component.onFinalizarCreacionTemporal();

        expect(vidaSpy).toHaveBeenCalledTimes(1);
        expect(component.modalSelectorPuntosGolpeAbierto).toBeTrue();
        expect(component.tiradasVidaRestantes).toBe(2);
        expect(component.resultadoVidaActual?.total).toBe(18);
    });

    it('recalcular PG consume intentos y se bloquea al llegar a cero', () => {
        component.modalSelectorPuntosGolpeAbierto = true;
        component.tiradasVidaRestantes = 2;
        spyOn(nuevoPSvc, 'calcularVidaFinalAleatoria').and.returnValues(
            {
                total: 15,
                maximo: 20,
                detalle: {
                    constitucionAplicada: true,
                    modificadorConstitucion: 0,
                    tiradasAleatorias: 1,
                    dgsRaciales: 0,
                    nivelesClase: 1,
                    bonoPlanoDotes: 0,
                    bonoPorDadoClaseDotes: 0,
                    flags: {
                        dadosGolpe: true,
                        dgsRacialesExtra: false,
                        plantillasDgsAdicionales: false,
                        plantillasAumentoReduccionDgs: false,
                        plantillasActualizacionDgsRazaClase: false,
                        dotesSumaAdicionalDgs: false,
                    },
                },
            } as any,
            {
                total: 16,
                maximo: 20,
                detalle: {
                    constitucionAplicada: true,
                    modificadorConstitucion: 0,
                    tiradasAleatorias: 1,
                    dgsRaciales: 0,
                    nivelesClase: 1,
                    bonoPlanoDotes: 0,
                    bonoPorDadoClaseDotes: 0,
                    flags: {
                        dadosGolpe: true,
                        dgsRacialesExtra: false,
                        plantillasDgsAdicionales: false,
                        plantillasAumentoReduccionDgs: false,
                        plantillasActualizacionDgsRazaClase: false,
                        dotesSumaAdicionalDgs: false,
                    },
                },
            } as any
        );

        component.onRecalcularPuntosGolpe();
        expect(component.tiradasVidaRestantes).toBe(1);

        component.onRecalcularPuntosGolpe();
        expect(component.tiradasVidaRestantes).toBe(0);

        component.onRecalcularPuntosGolpe();
        expect(component.tiradasVidaRestantes).toBe(0);
    });

    it('Siguiente en PG abre selector de visibilidad y confirmar visibilidad dispara finalizacion completa', async () => {
        component.modalSelectorPuntosGolpeAbierto = true;
        component.resultadoVidaActual = {
            total: 27,
            maximo: 31,
            detalle: {
                constitucionAplicada: true,
                modificadorConstitucion: 2,
                tiradasAleatorias: 1,
                dgsRaciales: 1,
                nivelesClase: 1,
                bonoPlanoDotes: 0,
                bonoPorDadoClaseDotes: 0,
                flags: {
                    dadosGolpe: true,
                    dgsRacialesExtra: true,
                    plantillasDgsAdicionales: false,
                    plantillasAumentoReduccionDgs: false,
                    plantillasActualizacionDgsRazaClase: false,
                    dotesSumaAdicionalDgs: false,
                },
            },
        };

        component.onSiguientePuntosGolpe();
        expect(component.Personaje.Vida).toBe(27);
        expect(component.modalSelectorPuntosGolpeAbierto).toBeFalse();
        expect(component.modalSelectorVisibilidadAbierto).toBeTrue();

        const emitSpy = spyOn(component.personajeFinalizado, 'emit');
        await component.onConfirmarSelectorVisibilidad(true);
        expect(component.Personaje.visible_otros_usuarios).toBeTrue();
        expect(personajeSvcMock.crearPersonajeApiDesdeCreacion).toHaveBeenCalledTimes(1);
        expect(personajeSvcMock.guardarPersonajeEnFirebase).toHaveBeenCalledTimes(1);
        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledWith(123);
        expect(component.modalSelectorVisibilidadAbierto).toBeFalse();
    });

    it('finalizarPersonajeCompleto bloquea el POST si la campaña sigue siendo incompatible por homebrew', async () => {
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.seleccionarRaza(crearRazaMock(false));
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await (component as any).finalizarPersonajeCompleto();

        expect(personajeSvcMock.crearPersonajeApiDesdeCreacion).not.toHaveBeenCalled();
        expect(personajeSvcMock.guardarPersonajeEnFirebase).not.toHaveBeenCalled();
        expect(`${(swalSpy.calls.mostRecent().args[0] as any).title ?? ''}`).toContain('La campaña bloquea la finalización');
    });

    it('finalizarPersonajeCompleto envía overrideReglasCampana solo si el actor es el activeMasterUid de la campaña', async () => {
        component.modalSelectorVisibilidadAbierto = true;
        component.Campanas = [{
            Id: 7,
            Nombre: 'Campaña A',
            CampaignRole: 'master',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: true,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: null,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        (component as any).selectedCampaignActiveMasterUid = 'uid-actor';
        nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado = 11;
        nuevoPSvc.EstadoFlujo.generador.tablasPermitidas = 2;

        await component.onConfirmarSelectorVisibilidad(true);

        expect(personajeSvcMock.construirPayloadCreacionDesdePersonaje).toHaveBeenCalledWith(
            component.Personaje,
            jasmine.any(Object),
            jasmine.objectContaining({
                tiradaMinimaDeclarada: 11,
                tablasDadosUsadas: 2,
                overrideReglasCampana: true,
            })
        );
    });

    it('finalizarPersonajeCompleto no envía overrideReglasCampana si no coincide el activeMasterUid', async () => {
        component.modalSelectorVisibilidadAbierto = true;
        component.Campanas = [{
            Id: 7,
            Nombre: 'Campaña A',
            CampaignRole: 'master',
            Tramas: [],
        }];
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.selectedCampaignPolicy = {
            tiradaMinimaCaracteristica: null,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: null,
            permitirHomebrewGeneral: true,
            permitirVentajasDesventajas: true,
            permitirIgnorarRestriccionesAlineamiento: true,
            maxFuentesHomebrewGeneralesPorPersonaje: null,
        };
        (component as any).selectedCampaignPolicyResolved = true;
        (component as any).selectedCampaignActiveMasterUid = 'uid-otro';
        nuevoPSvc.EstadoFlujo.generador.minimoSeleccionado = 9;
        nuevoPSvc.EstadoFlujo.generador.tablasPermitidas = 1;

        await component.onConfirmarSelectorVisibilidad(true);

        expect(personajeSvcMock.construirPayloadCreacionDesdePersonaje).toHaveBeenCalledWith(
            component.Personaje,
            jasmine.any(Object),
            jasmine.objectContaining({
                tiradaMinimaDeclarada: 9,
                tablasDadosUsadas: 1,
                overrideReglasCampana: false,
            })
        );
    });

    it('cerrar selector visibilidad no altera la preferencia actual', () => {
        component.Personaje.visible_otros_usuarios = false;
        component.modalSelectorVisibilidadAbierto = true;
        component.onCerrarSelectorVisibilidad();
        expect(component.Personaje.visible_otros_usuarios).toBeFalse();
        expect(component.modalSelectorVisibilidadAbierto).toBeFalse();
    });

    it('si falla Firebase tras SQL ok, reintentar no repite POST /personajes/add', async () => {
        component.modalSelectorVisibilidadAbierto = true;
        personajeSvcMock.crearPersonajeApiDesdeCreacion.and.resolveTo({
            message: 'ok',
            idPersonaje: 456,
            ownerUserId: '00000000-0000-0000-0000-000000000009',
        });
        personajeSvcMock.guardarPersonajeEnFirebase.and.returnValues(
            Promise.reject(new Error('firebase caido')),
            Promise.resolve()
        );
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const emitSpy = spyOn(component.personajeFinalizado, 'emit');

        await component.onConfirmarSelectorVisibilidad(true);
        expect(personajeSvcMock.crearPersonajeApiDesdeCreacion).toHaveBeenCalledTimes(1);
        expect(component.finalizacionState.sqlOk).toBeTrue();
        expect(component.finalizacionState.firebaseOk).toBeFalse();
        expect(emitSpy).not.toHaveBeenCalled();

        await component.onConfirmarSelectorVisibilidad(true);
        expect(personajeSvcMock.crearPersonajeApiDesdeCreacion).toHaveBeenCalledTimes(1);
        expect(personajeSvcMock.guardarPersonajeEnFirebase).toHaveBeenCalledTimes(2);
        expect(emitSpy).toHaveBeenCalledWith(456);
    });

    it('lanza descarga background con pack completo aunque no haya secundarios', async () => {
        component.modalSelectorVisibilidadAbierto = true;
        component.Personaje.Conjuros = [];
        component.Personaje.Sortilegas = [];
        component.Personaje.Familiares = [];
        component.Personaje.Companeros = [];

        await component.onConfirmarSelectorVisibilidad(true);

        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledTimes(1);
        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledWith(jasmine.any(Object), {
            incluirConjuros: true,
            incluirFamiliares: true,
            incluirCompaneros: true,
        });
    });

    it('lanza descarga background tras finalizar cuando hay secundarios', async () => {
        component.modalSelectorVisibilidadAbierto = true;
        component.Personaje.Conjuros = [{ Id: 1, Nombre: 'Luz' } as any];
        component.Personaje.Sortilegas = [];
        component.Personaje.Familiares = [{ Id: 11, Nombre: 'Cuervo' } as any];
        component.Personaje.Companeros = [{ Id: 21, Nombre: 'Lobo' } as any];

        await component.onConfirmarSelectorVisibilidad(true);

        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledTimes(1);
        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledWith(jasmine.any(Object), {
            incluirConjuros: true,
            incluirFamiliares: true,
            incluirCompaneros: true,
        });
    });

    it('bloquea cierre del modal de visibilidad cuando hay finalizacion parcial', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        component.modalSelectorVisibilidadAbierto = true;
        component.finalizacionState = {
            idPersonaje: 123,
            sqlOk: true,
            firebaseOk: false,
        };

        component.onCerrarSelectorVisibilidad();

        expect(component.modalSelectorVisibilidadAbierto).toBeTrue();
        expect(swalSpy).toHaveBeenCalled();
    });

    it('chip homebrew queda bloqueado cuando el personaje no es oficial', () => {
        component.Personaje.Oficial = false;
        expect(component.homebrewForzado).toBeTrue();
        expect(component.incluirHomebrewPlantillasEfectivo).toBeTrue();
        expect(component.incluirHomebrewVentajasEfectivo).toBeTrue();
    });

    it('limita edad, peso y altura al maximo de cifras permitido', () => {
        component.onEdadChange('12345');
        component.onPesoChange('70.55');
        component.onAlturaChange('12.34');

        expect(component.Personaje.Edad).toBe(1234);
        expect(component.Personaje.Peso).toBe(70.5);
        expect(component.Personaje.Altura).toBe(12.3);
    });

    it('persistencia de modal: si vuelves al componente, mantiene estado del servicio', () => {
        nuevoPSvc.abrirModalCaracteristicas();
        nuevoPSvc.actualizarPasoActual('basicos');

        const componentReabierto = new NuevoPersonajeComponent(
            { currentUser: null } as any,
            nuevoPSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            claseSvcMock,
            conjuroSvcMock,
            escuelaSvcMock,
            disciplinaSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            doteSvcMock,
            enemigoPredilectoSvcMock,
            armaSvcMock,
            armaduraSvcMock,
            grupoArmaSvcMock,
            grupoArmaduraSvcMock,
            dominioSvcMock,
            regionSvcMock,
            deidadSvcMock,
            tipoCriaturaSvcMock,
            monstruoSvcMock,
            especialSvcMock,
            personajeSvcMock,
            fichasDescargaBgSvcMock,
            chatFloatingSvcMock,
            userSvcMock,
            userProfileNavigationSvcMock,
        );
        componentReabierto.ngOnInit();

        expect(componentReabierto.modalCaracteristicasAbierto).toBeTrue();
        expect(componentReabierto.selectedInternalTabIndex).toBe(1);
    });

    it('muestra prompt y restaura borrador local al continuar', async () => {
        const uid = 'uid-borrador-component';
        const borradorSvc = new NuevoPersonajeService();
        borradorSvc.seleccionarRaza(crearRazaMock());
        borradorSvc.PersonajeCreacion.Nombre = 'Aldric';
        borradorSvc.actualizarPasoActual('basicos');
        borradorSvc.activarPersistenciaBorradorLocal(uid);
        borradorSvc.persistirBorradorLocalAhora();
        borradorSvc.desactivarPersistenciaBorradorLocal();

        const fireSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const restoredSvc = new NuevoPersonajeService();
        const componentRestaurado = new NuevoPersonajeComponent(
            { currentUser: { uid, displayName: 'Aldric', email: 'aldric@test.com' } } as any,
            restoredSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            claseSvcMock,
            conjuroSvcMock,
            escuelaSvcMock,
            disciplinaSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            doteSvcMock,
            enemigoPredilectoSvcMock,
            armaSvcMock,
            armaduraSvcMock,
            grupoArmaSvcMock,
            grupoArmaduraSvcMock,
            dominioSvcMock,
            regionSvcMock,
            deidadSvcMock,
            tipoCriaturaSvcMock,
            monstruoSvcMock,
            especialSvcMock,
            personajeSvcMock,
            fichasDescargaBgSvcMock,
            chatFloatingSvcMock,
            userSvcMock,
            userProfileNavigationSvcMock,
        );

        await (componentRestaurado as any).inicializarComponente();

        expect(fireSpy).toHaveBeenCalled();
        expect(componentRestaurado.Personaje.Nombre).toBe('Aldric');
        expect(componentRestaurado.selectedInternalTabIndex).toBe(1);

        componentRestaurado.ngOnDestroy();
        localStorage.removeItem(`fichas35.nuevoPersonaje.draft.v1.${uid}`);
    });

    it('permite empezar de cero y limpia el borrador local', async () => {
        const uid = 'uid-borrador-reset';
        const borradorSvc = new NuevoPersonajeService();
        borradorSvc.seleccionarRaza(crearRazaMock());
        borradorSvc.PersonajeCreacion.Nombre = 'Aldric';
        borradorSvc.activarPersistenciaBorradorLocal(uid);
        borradorSvc.persistirBorradorLocalAhora();
        borradorSvc.desactivarPersistenciaBorradorLocal();

        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: true } as any);
        const limpioSvc = new NuevoPersonajeService();
        const componentLimpio = new NuevoPersonajeComponent(
            { currentUser: { uid, displayName: 'Aldric', email: 'aldric@test.com' } } as any,
            limpioSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            claseSvcMock,
            conjuroSvcMock,
            escuelaSvcMock,
            disciplinaSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            doteSvcMock,
            enemigoPredilectoSvcMock,
            armaSvcMock,
            armaduraSvcMock,
            grupoArmaSvcMock,
            grupoArmaduraSvcMock,
            dominioSvcMock,
            regionSvcMock,
            deidadSvcMock,
            tipoCriaturaSvcMock,
            monstruoSvcMock,
            especialSvcMock,
            personajeSvcMock,
            fichasDescargaBgSvcMock,
            chatFloatingSvcMock,
            userSvcMock,
            userProfileNavigationSvcMock,
        );

        await (componentLimpio as any).inicializarComponente();

        expect(componentLimpio.razaSeleccionada).toBeNull();
        expect(componentLimpio.selectedInternalTabIndex).toBe(0);
        expect(localStorage.getItem(`fichas35.nuevoPersonaje.draft.v1.${uid}`)).toBeNull();

        componentLimpio.ngOnDestroy();
    });
});
