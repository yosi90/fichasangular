import { Injectable } from '@angular/core';
import { AptitudSortilega } from '../interfaces/aptitud-sortilega';
import { Clase, ClaseConjuroRef, ClaseDoteNivel, ClaseEspecialNivel, ClaseNivelDetalle } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { DisciplinaConjuros } from '../interfaces/disciplina-conjuros';
import { Dote, DoteExtraItem } from '../interfaces/dote';
import { EnemigoPredilectoDetalle } from '../interfaces/enemigo-predilecto-detalle';
import { EnemigoPredilectoSeleccion } from '../interfaces/enemigo-predilecto-seleccion';
import { EscuelaConjuros } from '../interfaces/escuela-conjuros';
import { DeidadDetalle } from '../interfaces/deidad';
import { DominioDetalle } from '../interfaces/dominio';
import { HabilidadBasicaDetalle, HabilidadBonoVario } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje } from '../interfaces/personaje';
import { Plantilla } from '../interfaces/plantilla';
import { RegionDetalle } from '../interfaces/region';
import { RacialDetalle } from '../interfaces/racial';
import { Raza } from '../interfaces/raza';
import { RazaSimple } from '../interfaces/simplificaciones/raza-simple';
import { SubtipoRef } from '../interfaces/subtipo';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { VentajaDetalle } from '../interfaces/ventaja';
import { resolverAlineamientoPlantillas, simularEstadoPlantillas } from './utils/plantilla-elegibilidad';
import { extraerEjesAlineamientoDesdeContrato } from './utils/alineamiento-contrato';
import { buildIdentidadPrerrequisitos } from './utils/identidad-prerrequisitos';
import { createRacialPlaceholder, normalizeRaciales } from './utils/racial-mapper';
import { resolverRacialesFinales, SeleccionRacialesOpcionales } from './utils/racial-opcionales';
import { aplicarMutacion, esRazaMutada } from './utils/raza-mutacion';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';
import { ClaseEvaluacionResultado, evaluarElegibilidadClase } from './utils/clase-elegibilidad';
import { DoteEvaluacionContexto, evaluarElegibilidadDote } from './utils/dote-elegibilidad';
import {
    EstadoCuposFamiliar as EstadoCuposFamiliarUtil,
    FamiliarPlantillaId as FamiliarPlantillaIdUtil,
    resolverEstadoCuposFamiliarEspecial47
} from './utils/familiar-reglas';
import {
    CompaneroPlantillaSelector as CompaneroPlantillaSelectorUtil,
    EstadoCuposCompanero as EstadoCuposCompaneroUtil,
    getPlantillaIdCompanero,
    resolverEstadoCuposCompaneroEspecial29
} from './utils/companero-reglas';
import { UserSettingsService } from './user-settings.service';
import { NuevoPersonajeGeneradorConfig } from '../interfaces/user-settings';

export type StepNuevoPersonaje = 'raza' | 'basicos' | 'plantillas' | 'ventajas' | 'clases' | 'habilidades' | 'conjuros' | 'dotes';
export type HabilidadesFlujoOrigen = 'raza_dg' | 'plantilla_dg' | 'clase_nivel';
export type TipoLanzamientoConjuros = 'arcano' | 'divino' | 'psionico' | 'alma' | 'mixto';
export type FamiliarPlantillaId = FamiliarPlantillaIdUtil;
export type EstadoCuposFamiliar = EstadoCuposFamiliarUtil;
export type CompaneroPlantillaSelector = CompaneroPlantillaSelectorUtil;
export type EstadoCuposCompanero = EstadoCuposCompaneroUtil;
export type GeneradorAutoRespuestaQ1 =
    | 'acero_musculo'
    | 'rapidez_precision'
    | 'magia_arcana'
    | 'fe_naturaleza_espiritu'
    | 'voluntad_psionica'
    | 'labia_presencia';
export type GeneradorAutoRespuestaQ2 =
    | 'delante'
    | 'primera_segunda_linea'
    | 'atras_control_apoyo'
    | 'evitar_contacto';
export type GeneradorAutoRespuestaQ3 =
    | 'social'
    | 'investigar'
    | 'explorar'
    | 'manitas';
export type GeneradorAutoRespuestaQ4 =
    | 'aguante'
    | 'acierto'
    | 'potencia_conjuros'
    | 'percepcion'
    | 'social';

export interface GeneradorAutoCuestionario {
    q1?: GeneradorAutoRespuestaQ1;
    q2?: GeneradorAutoRespuestaQ2;
    q3?: GeneradorAutoRespuestaQ3;
    q4?: GeneradorAutoRespuestaQ4;
}

export interface GeneradorAutoScore {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export type GeneradorAutoClaseRecomendada = string;
export type GeneradorAutoExplicacionKey =
    | 'par_fue_con'
    | 'par_fue_des'
    | 'par_fue_sab'
    | 'par_fue_car'
    | 'par_des_int'
    | 'par_des_sab'
    | 'par_des_car'
    | 'par_int_des'
    | 'par_int_con'
    | 'par_int_sab'
    | 'par_int_car'
    | 'par_sab_con'
    | 'par_sab_car'
    | 'par_sab_des'
    | 'par_car_con'
    | 'par_car_int'
    | 'fallback_fue'
    | 'fallback_des'
    | 'fallback_con'
    | 'fallback_int'
    | 'fallback_sab'
    | 'fallback_car';

export interface GeneradorAutoRecomendacion {
    clases: [GeneradorAutoClaseRecomendada, GeneradorAutoClaseRecomendada];
    explicacion: string;
    explicacionKey: GeneradorAutoExplicacionKey;
    top1: CaracteristicaKeyAumento;
    top2: CaracteristicaKeyAumento;
    top3: CaracteristicaKeyAumento;
    afinadaPorTop3: boolean;
}

export interface GeneradorAutoDiagnostico {
    score: GeneradorAutoScore;
    ranking: CaracteristicaKeyAumento[];
    top2: CaracteristicaKeyAumento[];
    recomendacion: GeneradorAutoRecomendacion | null;
    requierePregunta4: boolean;
    pregunta4Aplicada: boolean;
    esCompletoBase: boolean;
}

export interface GeneradorAutoPreguntaOpcion<T> {
    key: T;
    label: string;
    description: string;
}

export interface GeneradorAutoResultado {
    aplicado: boolean;
    tablaSeleccionada?: number;
}

export interface ResultadoCalculoVidaFinal {
    total: number;
    maximo: number;
    detalle: {
        constitucionAplicada: boolean;
        modificadorConstitucion: number;
        tiradasAleatorias: number;
        dgsRaciales: number;
        nivelesClase: number;
        bonoPlanoDotes: number;
        bonoPorDadoClaseDotes: number;
        flags: {
            dadosGolpe: boolean;
            dgsRacialesExtra: boolean;
            plantillasDgsAdicionales: boolean;
            plantillasAumentoReduccionDgs: boolean;
            plantillasActualizacionDgsRazaClase: boolean;
            dotesSumaAdicionalDgs: boolean;
        };
    };
}

export type CaracteristicaKeyAumento = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';
type CaracteristicaKey = CaracteristicaKeyAumento;
type SalvacionKey = 'fortaleza' | 'reflejos' | 'voluntad';
type GeneradorAutoComboKey = `${CaracteristicaKey}_${CaracteristicaKey}`;

interface GeneradorAutoRecomendacionBase {
    clases: [GeneradorAutoClaseRecomendada, GeneradorAutoClaseRecomendada];
    explicacion: string;
    explicacionKey: GeneradorAutoExplicacionKey;
}

const CARACTERISTICAS_KEYS: CaracteristicaKey[] = ['Fuerza', 'Destreza', 'Constitucion', 'Inteligencia', 'Sabiduria', 'Carisma'];

const MIN_TIRADA = 3;
const MAX_TIRADA = 13;
const DEFAULT_TIRADA = 13;
const MIN_TABLAS = 1;
const MAX_TABLAS = 5;
const DEFAULT_TABLAS = 3;
const TIRADAS_POR_TABLA = 6;
const FILAS_TIRADAS = MAX_TIRADA - MIN_TIRADA + 1;
const GENERADOR_CONFIG_STORAGE_KEY = 'fichas35.nuevoPersonaje.generador.config.v1';
const MAX_VENTAJAS_SELECCIONABLES = 3;
const DADOS_PROGRESION = [4, 6, 8, 10, 12];
const NUEVO_PERSONAJE_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const CLAVES_MOD_DOTE_PGS_PLANO = new Set<string>([
    'pga',
    'pgaadicional',
    'puntosgolpe',
    'puntosdegolpe',
]);
const CLAVES_MOD_DOTE_PGS_POR_DADO = new Set<string>([
    'pgan',
    'pgpornivel',
    'pgpordg',
    'pgadicionalpornivel',
    'pgadicionalpordg',
]);
const CARGA_PESADA_BASE_POR_FUERZA: Record<number, number> = {
    1: 3,
    2: 6,
    3: 10,
    4: 13,
    5: 16,
    6: 20,
    7: 23,
    8: 26,
    9: 30,
    10: 33,
    11: 38,
    12: 43,
    13: 50,
    14: 58,
    15: 66,
    16: 76,
    17: 86,
    18: 100,
    19: 116,
    20: 133,
    21: 153,
    22: 173,
    23: 200,
    24: 233,
    25: 266,
    26: 306,
    27: 346,
    28: 400,
    29: 466,
    30: 533,
    31: 613,
    32: 693,
    33: 800,
    34: 933,
    35: 1066,
    36: 1233,
    37: 1400,
    38: 1600,
    39: 1866,
};
const CARGA_MULTIPLICADOR_BIPEDO_POR_MOD_PRESA: Record<number, number> = {
    [-16]: 0.125,
    [-12]: 0.25,
    [-8]: 0.5,
    [-4]: 0.75,
    [0]: 1,
    [4]: 2,
    [8]: 4,
    [12]: 8,
    [16]: 16,
};
const EXTRA_IDIOMAS_INICIALES = 0;
const GENERADOR_AUTO_Q4_THRESHOLD = 1;
const DOTE_FAMILIAR_ID = 17;
const ESPECIAL_FAMILIAR_CONVOCAR_ID = 47;
const ESPECIALES_BONUS_FAMILIAR_FIJOS = [81, 82];
const ESPECIAL_BONUS_FAMILIAR_MENSAJERO = 83;
const ESPECIAL_BONUS_FAMILIAR_HECHIZO = 87;
const DOTE_COMPANERO_ELEVADO_ID = 53;
const DOTE_COMPANERO_SABANDIJA_ID = 56;
const DOTE_COMPANERO_BONUS_ID = 49;
const ESPECIALES_BONUS_COMPANERO_PERSONAJE = [157, 158];
const ESPECIAL_BONUS_COMPANERO_AVANZADO = 159;
const ESPECIAL_BONUS_COMPANERO_MAESTRO = 57;
const GENERADOR_AUTO_CON_FLOOR = 1;
const GENERADOR_AUTO_RECOMENDACION_UMBRAL_TOP3 = 1;
const HABILIDAD_FAMILIAS_REPETIBLES = {
    artesania: {
        ids: [2, 3, 4],
        maxSlots: 3,
        nombreBase: 'Artesania',
        patrones: ['artesania'],
    },
    saberes: {
        ids: [32, 33, 34, 35, 36],
        maxSlots: 5,
        nombreBase: 'Saber',
        patrones: ['saber'],
    },
} as const;
const EXTRA_HABILIDAD_VALORES_PENDIENTES = new Set([
    '-',
    'no aplica',
    'no especifica',
    'no se especifica',
    'ninguna',
    'nada',
    'desconocido',
    'placeholder',
    'elegir',
    'a elegir',
    'elige',
]);

const GENERADOR_AUTO_PESOS_POR_POSICION: number[] = [60, 50, 40, 30, 20, 10];
const GENERADOR_AUTO_SCORING_RULES: {
    q1: Record<GeneradorAutoRespuestaQ1, Partial<Record<CaracteristicaKey, number>>>;
    q3: Record<GeneradorAutoRespuestaQ3, Partial<Record<CaracteristicaKey, number>>>;
    q4: Record<'aguante' | 'percepcion' | 'social', Partial<Record<CaracteristicaKey, number>>>;
} = {
    q1: {
        acero_musculo: { Fuerza: 5, Constitucion: 2 },
        rapidez_precision: { Destreza: 5, Constitucion: 2 },
        magia_arcana: { Inteligencia: 5, Constitucion: 1 },
        fe_naturaleza_espiritu: { Sabiduria: 5, Constitucion: 2 },
        voluntad_psionica: { Inteligencia: 3, Sabiduria: 3, Constitucion: 1 },
        labia_presencia: { Carisma: 5, Sabiduria: 1 },
    },
    q3: {
        social: { Carisma: 4, Sabiduria: 1 },
        investigar: { Inteligencia: 4, Sabiduria: 1 },
        explorar: { Sabiduria: 4, Destreza: 1 },
        manitas: { Destreza: 2, Inteligencia: 3 },
    },
    q4: {
        aguante: { Constitucion: 4 },
        percepcion: { Sabiduria: 4 },
        social: { Carisma: 4 },
    },
};

const GENERADOR_AUTO_RECOMENDACIONES_POR_COMBO: Partial<Record<GeneradorAutoComboKey, GeneradorAutoRecomendacionBase>> = {
    Fuerza_Constitucion: {
        clases: ['Guerrero', 'Bárbaro'],
        explicacion: 'Tu perfil apunta a resistencia física y potencia directa en combate. Encajas como combatiente de primera línea capaz de absorber y repartir daño.',
        explicacionKey: 'par_fue_con',
    },
    Fuerza_Destreza: {
        clases: ['Explorador', 'Guerrero'],
        explicacion: 'Combinas fuerza y movilidad, lo que te hace ideal para un combatiente versátil que sabe cuándo golpear y cuándo reposicionarse.',
        explicacionKey: 'par_fue_des',
    },
    Fuerza_Sabiduria: {
        clases: ['Paladín', 'Explorador'],
        explicacion: 'Tu combinación sugiere un guerrero guiado por convicciones o instinto, capaz de luchar con propósito además de potencia física.',
        explicacionKey: 'par_fue_sab',
    },
    Fuerza_Carisma: {
        clases: ['Paladín', 'Bardo'],
        explicacion: 'Tu fuerza se complementa con presencia y liderazgo. Destacas como figura inspiradora en el campo de batalla.',
        explicacionKey: 'par_fue_car',
    },
    Destreza_Inteligencia: {
        clases: ['Pícaro', 'Mago'],
        explicacion: 'Tu perfil mezcla precisión y mente estratégica. Eres eficaz tanto resolviendo situaciones complejas como explotando debilidades enemigas.',
        explicacionKey: 'par_des_int',
    },
    Destreza_Sabiduria: {
        clases: ['Explorador', 'Monje'],
        explicacion: 'Agilidad y percepción te convierten en alguien atento, adaptable y peligroso cuando actúas con disciplina.',
        explicacionKey: 'par_des_sab',
    },
    Destreza_Carisma: {
        clases: ['Bardo', 'Pícaro'],
        explicacion: 'Movilidad y carisma hacen de ti alguien difícil de atrapar y aún más difícil de ignorar.',
        explicacionKey: 'par_des_car',
    },
    Inteligencia_Destreza: {
        clases: ['Mago', 'Pícaro'],
        explicacion: 'Tu fortaleza está en la mente y la precisión. Destacas en control táctico y planificación inteligente.',
        explicacionKey: 'par_int_des',
    },
    Inteligencia_Constitucion: {
        clases: ['Mago', 'Guerrero psíquico'],
        explicacion: 'Poder mental combinado con resistencia te permite mantener el control incluso en situaciones prolongadas.',
        explicacionKey: 'par_int_con',
    },
    Inteligencia_Sabiduria: {
        clases: ['Druida', 'Clérigo'],
        explicacion: 'Equilibras conocimiento y sabiduría, lo que te orienta hacia roles donde comprensión y conexión con fuerzas superiores son clave.',
        explicacionKey: 'par_int_sab',
    },
    Inteligencia_Carisma: {
        clases: ['Hechicero', 'Bardo'],
        explicacion: 'Intelecto y presencia te convierten en un lanzador con fuerte impacto social y narrativo.',
        explicacionKey: 'par_int_car',
    },
    Sabiduria_Constitucion: {
        clases: ['Clérigo', 'Druida'],
        explicacion: 'Tu fortaleza espiritual y resistencia física encajan con figuras protectoras capaces de sostener al grupo.',
        explicacionKey: 'par_sab_con',
    },
    Sabiduria_Carisma: {
        clases: ['Clérigo', 'Paladín'],
        explicacion: 'Convicción interior y liderazgo natural te orientan hacia roles donde fe y carisma van de la mano.',
        explicacionKey: 'par_sab_car',
    },
    Sabiduria_Destreza: {
        clases: ['Explorador', 'Monje'],
        explicacion: 'Instinto y agilidad te permiten anticiparte y actuar con precisión en cualquier entorno.',
        explicacionKey: 'par_sab_des',
    },
    Carisma_Constitucion: {
        clases: ['Paladín', 'Bardo'],
        explicacion: 'Presencia y resistencia te convierten en un referente dentro y fuera del combate.',
        explicacionKey: 'par_car_con',
    },
    Carisma_Inteligencia: {
        clases: ['Hechicero', 'Bardo'],
        explicacion: 'Carisma apoyado por inteligencia te hace destacar tanto en lo social como en el uso creativo del poder.',
        explicacionKey: 'par_car_int',
    },
};

const GENERADOR_AUTO_RECOMENDACIONES_FALLBACK: Record<CaracteristicaKey, GeneradorAutoRecomendacionBase> = {
    Fuerza: {
        clases: ['Guerrero', 'Bárbaro'],
        explicacion: 'Te pega un estilo directo y dominante en primera línea, con enfoque en presión física y aguante.',
        explicacionKey: 'fallback_fue',
    },
    Destreza: {
        clases: ['Pícaro', 'Explorador'],
        explicacion: 'Encajas mejor en un estilo ágil y preciso, aprovechando movilidad, iniciativa y posicionamiento.',
        explicacionKey: 'fallback_des',
    },
    Constitucion: {
        clases: ['Guerrero', 'Clérigo'],
        explicacion: 'Tu perfil favorece papeles sólidos y constantes, capaces de sostenerse mientras aportan al grupo.',
        explicacionKey: 'fallback_con',
    },
    Inteligencia: {
        clases: ['Mago', 'Hechicero'],
        explicacion: 'Tu tendencia apunta a clases con fuerte componente de control y resolución táctica desde el conocimiento.',
        explicacionKey: 'fallback_int',
    },
    Sabiduria: {
        clases: ['Clérigo', 'Druida'],
        explicacion: 'Destacas en estilos de apoyo y lectura del combate, con foco en utilidad y consistencia para el grupo.',
        explicacionKey: 'fallback_sab',
    },
    Carisma: {
        clases: ['Bardo', 'Hechicero'],
        explicacion: 'Tu fuerza está en la presencia y la influencia, ideal para personajes que impactan dentro y fuera del combate.',
        explicacionKey: 'fallback_car',
    },
};

const GENERADOR_AUTO_AFINIDAD_CLASES: Record<string, CaracteristicaKey[]> = {
    'guerrero': ['Fuerza', 'Constitucion'],
    'barbaro': ['Fuerza', 'Constitucion'],
    'explorador': ['Destreza', 'Sabiduria', 'Fuerza'],
    'paladin': ['Fuerza', 'Carisma', 'Sabiduria', 'Constitucion'],
    'bardo': ['Carisma', 'Destreza', 'Inteligencia'],
    'picaro': ['Destreza', 'Inteligencia', 'Carisma'],
    'mago': ['Inteligencia', 'Destreza'],
    'monje': ['Destreza', 'Sabiduria', 'Constitucion'],
    'druida': ['Sabiduria', 'Constitucion', 'Inteligencia'],
    'clerigo': ['Sabiduria', 'Constitucion', 'Carisma', 'Inteligencia'],
    'hechicero': ['Carisma', 'Inteligencia'],
    'guerrero psiquico': ['Inteligencia', 'Fuerza', 'Constitucion', 'Sabiduria'],
};

const GENERADOR_AUTO_OPCIONES_Q2: Record<GeneradorAutoRespuestaQ2, GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ2>> = {
    delante: {
        key: 'delante',
        label: 'Voy delante y que me peguen a mí',
        description: 'Concentras presión, tomas riesgo y sostienes la línea.',
    },
    primera_segunda_linea: {
        key: 'primera_segunda_linea',
        label: 'Primera/segunda línea: pego y me muevo',
        description: 'Participas fuerte en combate sin ser un muro puro.',
    },
    atras_control_apoyo: {
        key: 'atras_control_apoyo',
        label: 'Me quedo atrás: controlar/apoyar/disparar',
        description: 'Priorizas impacto táctico desde una posición segura.',
    },
    evitar_contacto: {
        key: 'evitar_contacto',
        label: 'Evito que me toquen: sigilo/cobertura/trucos',
        description: 'Sobrevives por posicionamiento y evasión.',
    },
};
const GENERADOR_AUTO_OPCIONES_Q3: Record<GeneradorAutoRespuestaQ3, GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ3>> = {
    social: {
        key: 'social',
        label: 'Convencer, liderar, negociar o engañar',
        description: 'Prefieres influir en personas y situaciones.',
    },
    investigar: {
        key: 'investigar',
        label: 'Investigar, saber, planificar, teoría mágica',
        description: 'Te mueve entender y optimizar.',
    },
    explorar: {
        key: 'explorar',
        label: 'Explorar, percibir, sobrevivir, leer el entorno',
        description: 'Tu foco es la lectura del mundo y la anticipación.',
    },
    manitas: {
        key: 'manitas',
        label: 'Trampas, cerrajería, artesanía, ingeniería',
        description: 'Resuelves con técnica y manos.',
    },
};

type HabilidadFamiliaRepetibleKey = keyof typeof HABILIDAD_FAMILIAS_REPETIBLES;

export interface AsignacionCaracteristicas {
    Fuerza: number | null;
    Destreza: number | null;
    Constitucion: number | null;
    Inteligencia: number | null;
    Sabiduria: number | null;
    Carisma: number | null;
}

export interface GeneradorCaracteristicasState {
    minimoSeleccionado: number;
    indiceMinimo: number;
    tiradasCache: number[][];
    tablasPermitidas: number;
    tablaSeleccionada: number | null;
    asignaciones: AsignacionCaracteristicas;
    origenesAsignacion: Record<CaracteristicaKey, number | null>;
    poolDisponible: number[];
}

export interface SeleccionVentajaState {
    id: number;
    idioma: IdiomaDetalle | null;
}

export interface PendienteOroState {
    tipo: 'Duplica_oro' | 'Aumenta_oro';
    origen: string;
}

export interface VentajasFlujoState {
    catalogoVentajas: VentajaDetalle[];
    catalogoDesventajas: VentajaDetalle[];
    catalogoHabilidades: HabilidadBasicaDetalle[];
    catalogoHabilidadesCustom: HabilidadBasicaDetalle[];
    catalogoIdiomas: IdiomaDetalle[];
    seleccionVentajas: SeleccionVentajaState[];
    seleccionDesventajas: SeleccionVentajaState[];
    puntosDisponibles: number;
    puntosGastados: number;
    puntosRestantes: number;
    hayDeficit: boolean;
    pendientesOro: PendienteOroState[];
    bonosHabilidades: Record<number, HabilidadBonoVario[]>;
    baseCaracteristicas: Record<CaracteristicaKey, number> | null;
    baseRaciales: RacialDetalle[];
    baseIdiomas: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
        Origen?: string;
    }[];
}

export interface HabilidadesFlujoState {
    activa: boolean;
    origen: HabilidadesFlujoOrigen | null;
    returnStep: StepNuevoPersonaje | null;
    puntosTotales: number;
    puntosRestantes: number;
    nivelPersonajeReferencia: number;
    classSkillTemporales: number[];
    rangosIniciales?: Record<number, number>;
}

export interface ConjurosCupoPendiente {
    total: number;
    porNivel: Record<number, number>;
}

export interface ConjurosSesionClaseObjetivo {
    id: number;
    nombre: string;
}

export interface ConjurosSesionStateEntrada {
    id: string;
    origen: string;
    claseObjetivo: ConjurosSesionClaseObjetivo;
    tipoLanzamiento: TipoLanzamientoConjuros;
    nivelLanzadorPrevio: number;
    nivelLanzadorActual: number;
    nivelMaxPoderAccesiblePsionico: number;
    seleccionManual: boolean;
    autoadicion: boolean;
    almaPendiente: boolean;
    sinElegibles: boolean;
    cupoPendiente: ConjurosCupoPendiente;
    cupoInicial: ConjurosCupoPendiente;
    nivelesPorConjuro: Record<number, number>;
    elegiblesIds: number[];
    seleccionadosIds: number[];
    autoadicionadosIds: number[];
    avisos: string[];
}

export interface ConjurosFlujoState {
    activa: boolean;
    indiceEntradaActual: number;
    returnStep: StepNuevoPersonaje;
    entradas: ConjurosSesionStateEntrada[];
    avisos: string[];
}

interface ConjurosAccesoNivelesInfo {
    nivelesAccesibles: Set<number> | null;
    nivelesRecienDesbloqueados: Set<number>;
    nivelMaxPoderAccesiblePsionico: number;
    errores: string[];
}

export interface ToggleVentajaResult {
    toggled: boolean;
    selected: boolean;
    requiresIdiomaSelection: boolean;
    reason?: 'not_found' | 'max_reached';
}

export interface AplicacionClaseResultado {
    aplicado: boolean;
    razon?: string;
    evaluacion?: ClaseEvaluacionResultado;
    nivelAplicado?: number;
    advertencias?: string[];
    gruposOpcionalesPendientes?: ClaseGrupoOpcionalPendiente[];
    dominiosPendientes?: ClaseDominiosPendientes;
    aumentosClaseLanzadoraPendientes?: ClaseAumentoLanzadorPendiente[];
    especialesAplicados?: ClaseEspecialNivel[];
}

export interface EspecialidadMagicaPendiente {
    requiereArcano: boolean;
    requierePsionico: boolean;
}

export interface EspecialidadArcanaSeleccion {
    especializar: boolean;
    escuelaEspecialistaId: number | null;
    escuelasProhibidasIds: number[];
}

export interface EspecialidadPsionicaSeleccion {
    disciplinaEspecialistaId: number | null;
    disciplinaProhibidaId: number | null;
}

export interface EspecialidadMagicaSeleccion {
    arcana?: EspecialidadArcanaSeleccion;
    psionica?: EspecialidadPsionicaSeleccion;
}

export interface AumentoCaracteristicaPendiente {
    id: number;
    valor: number;
    origen: string;
    descripcion: string;
}

export interface AsignacionAumentoCaracteristica {
    idPendiente: number;
    caracteristica: CaracteristicaKeyAumento;
}

export type DoteFuentePendiente = 'nivel' | 'adicional' | 'raza_dg';
export type DoteEstadoPendiente = 'pendiente' | 'resuelta' | 'omitida';
export type EstadoElegibilidadDote = 'eligible' | 'blocked_failed' | 'blocked_unknown';

export interface DotePendienteState {
    id: number;
    fuente: DoteFuentePendiente;
    origen: string;
    tipoPermitido: string | null;
    estado: DoteEstadoPendiente;
}

export interface DoteEvaluacionResultado {
    estado: EstadoElegibilidadDote;
    razones: string[];
    advertencias: string[];
}

export interface DoteExtraOpcion {
    Id: number;
    Nombre: string;
}

export interface DoteSelectorCandidato {
    dote: Dote;
    evaluacion: DoteEvaluacionResultado;
    repeticionValida: boolean;
    restringidaPorTipo: boolean;
    requiereExtra: boolean;
    extrasDisponibles: DoteExtraOpcion[];
}

export interface RegistroFamiliarResultado {
    registrado: boolean;
    razon?: string;
    familiarAgregado?: FamiliarMonstruoDetalle;
    dote17Agregada: boolean;
    especialesAgregadosIds: number[];
}

export interface RegistroCompaneroResultado {
    registrado: boolean;
    razon?: string;
    companeroAgregado?: CompaneroMonstruoDetalle;
    dote49Agregada: boolean;
    especialesAgregadosIds: number[];
    bonosAplicados: {
        dgAdi: number;
        trucosAdi: number;
        bonoFueDes: number;
        bonoArmaduraNatural: number;
    };
}

export interface DoteSeleccionConfirmada {
    idDote: number;
    idExtra: number;
    extra: string;
}

export interface ClaseOpcionInternaPendiente {
    clave: string;
    tipo: 'dote' | 'especial';
    nombre: string;
    descripcion: string;
    extra: string;
    idInterno: number;
    idEspecialRequerido: number;
    idDoteRequerida: number;
}

export interface ClaseGrupoOpcionalPendiente {
    grupo: number;
    opciones: ClaseOpcionInternaPendiente[];
}

export type SeleccionOpcionalesClase = Record<number, string>;
export type SeleccionDominiosClase = Array<number | string>;

export interface ClaseDominioPendiente {
    id: number;
    nombre: string;
    oficial: boolean;
}

export interface ClaseDominiosPendientes {
    cantidad: number;
    opciones: ClaseDominioPendiente[];
}

export interface IdiomasPendientesPostClase {
    cantidad: number;
    motivo: string;
}

export interface ClaseAumentoLanzadorOpcion {
    idClase: number;
    nombreClase: string;
    tipoLanzamiento: TipoLanzamientoConjuros;
}

export interface ClaseAumentoLanzadorPendiente {
    indice: number;
    descripcion: string;
    opciones: ClaseAumentoLanzadorOpcion[];
}

export interface ClaseAumentoLanzadorSeleccion {
    indice: number;
    objetivo: ClaseAumentoLanzadorOpcion;
}

export type SeleccionAumentosClaseLanzadora = Array<number | string>;

interface ClaseNivelOpcionInterna {
    tipo: 'dote' | 'especial';
    clave: string;
    grupoOpcional: number;
    nombre: string;
    descripcion: string;
    extra: string;
    idInterno: number;
    idEspecialRequerido: number;
    idDoteRequerida: number;
    doteNivel: ClaseDoteNivel | null;
    especialNivel: ClaseEspecialNivel | null;
}

interface ResolucionOpcionalesNivelClase {
    obligatoriasDote: ClaseDoteNivel[];
    obligatoriasEspecial: ClaseEspecialNivel[];
    seleccionadasDote: ClaseDoteNivel[];
    seleccionadasEspecial: ClaseEspecialNivel[];
    gruposPendientes: ClaseGrupoOpcionalPendiente[];
    advertencias: string[];
}

interface ResolucionAumentosClaseLanzadora {
    selecciones: ClaseAumentoLanzadorSeleccion[];
    pendientes: ClaseAumentoLanzadorPendiente[];
    advertencias: string[];
}

export interface EstadoFlujoNuevoPersonaje {
    pasoActual: StepNuevoPersonaje;
    modalCaracteristicasAbierto: boolean;
    caracteristicasGeneradas: boolean;
    generador: GeneradorCaracteristicasState;
    plantillas: PlantillasFlujoState;
    ventajas: VentajasFlujoState;
    habilidades: HabilidadesFlujoState;
    conjuros: ConjurosFlujoState;
}

export interface PlantillasFlujoState {
    disponibles: Plantilla[];
    seleccionadas: Plantilla[];
    confirmadasIds: number[];
    retornoFinNivelPendiente: boolean;
    tipoCriaturaSimulada: {
        Id: number;
        Nombre: string;
    };
    licantropiaActiva: boolean;
    heredadaActiva: boolean;
}

interface NuevoPersonajeDraftEstadoFlujoV1 {
    pasoActual: StepNuevoPersonaje;
    caracteristicasGeneradas: boolean;
    generador: GeneradorCaracteristicasState;
    plantillas: {
        seleccionadas: Plantilla[];
        confirmadasIds: number[];
        retornoFinNivelPendiente: boolean;
        tipoCriaturaSimulada: {
            Id: number;
            Nombre: string;
        };
        licantropiaActiva: boolean;
        heredadaActiva: boolean;
    };
    ventajas: {
        seleccionVentajas: SeleccionVentajaState[];
        seleccionDesventajas: SeleccionVentajaState[];
    };
    habilidades: HabilidadesFlujoState;
    conjuros: ConjurosFlujoState;
}

interface NuevoPersonajeDraftV1 {
    version: 1;
    uid: string;
    updatedAt: number;
    personaje: Personaje;
    razaSeleccionada: Raza | null;
    razaBaseSeleccionada: Raza | null;
    estadoFlujoPersistible: NuevoPersonajeDraftEstadoFlujoV1;
    dotesPendientes: DotePendienteState[];
    secuenciaDotePendiente: number;
    dotesProgresionConcedidas: number;
    dotesExtraRazaConcedidas: number;
    aumentosPendientesCaracteristica: AumentoCaracteristicaPendiente[];
    aumentosProgresionConcedidos: number;
    secuenciaAumentoPendiente: number;
    bonusNivelLanzadorPorClase: Record<string, number>;
    idsEspecialesInternosActivos: number[];
    idsDotesInternosActivos: number[];
    conjurosSesionPlaceholderPorId: Record<number, Conjuro>;
}

const NUEVO_PERSONAJE_DRAFT_VERSION = 1;
const NUEVO_PERSONAJE_DRAFT_STORAGE_PREFIX = 'fichas35.nuevoPersonaje.draft.v1.';
const NUEVO_PERSONAJE_DRAFT_AUTOSAVE_MS = 1200;
const NUEVO_PERSONAJE_DRAFT_DEBOUNCE_MS = 300;

@Injectable({
    providedIn: 'root'
})
export class NuevoPersonajeService {
    private visibilidadPorDefectoPersonajes = false;
    private personajeCreacion: Personaje = this.crearPersonajeBase();
    private razaSeleccionada: Raza | null = null;
    private razaBaseSeleccionadaCompleta: Raza | null = null;
    private catalogoTiposCriatura: TipoCriatura[] = [];
    private catalogoClases: Clase[] = [];
    private catalogoDotes: Dote[] = [];
    private catalogoArmasDotes: { Id: number; Nombre: string; }[] = [];
    private catalogoArmadurasDotes: Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }> = [];
    private catalogoGruposArmasDotes: { Id: number; Nombre: string; }[] = [];
    private catalogoGruposArmadurasDotes: { Id: number; Nombre: string; }[] = [];
    private catalogoEscuelasDotes: { Id: number; Nombre: string; }[] = [];
    private catalogoConjuros: Conjuro[] = [];
    private conjurosSesionPlaceholderPorId: Record<number, Conjuro> = {};
    private catalogoDominios: DominioDetalle[] = [];
    private catalogoRegiones: RegionDetalle[] = [];
    private catalogoDeidades: DeidadDetalle[] = [];
    private bonusNivelLanzadorPorClase: Record<string, number> = {};
    private idsEspecialesInternosActivos = new Set<number>();
    private idsDotesInternosActivos = new Set<number>();
    private dotesPendientes: DotePendienteState[] = [];
    private secuenciaDotePendiente = 1;
    private dotesProgresionConcedidas = 0;
    private dotesExtraRazaConcedidas = 0;
    private aumentosPendientesCaracteristica: AumentoCaracteristicaPendiente[] = [];
    private aumentosProgresionConcedidos = 0;
    private secuenciaAumentoPendiente = 1;
    private generadorConfigBase = this.getConfigGeneradorDefault();
    private restriccionCampanaGenerador: { minimoSeleccionado: number; tablasPermitidas: number; } | null = null;
    private estadoFlujo: EstadoFlujoNuevoPersonaje = this.crearEstadoFlujoBase();
    private draftUidActivo = '';
    private draftAutosaveTimer: ReturnType<typeof setInterval> | null = null;
    private draftPersistTimer: ReturnType<typeof setTimeout> | null = null;
    private draftUltimaFirmaPersistida: string | null = null;

    constructor(private userSettingsSvc?: UserSettingsService) { }

    get PersonajeCreacion(): Personaje {
        return this.personajeCreacion;
    }

    get RazaSeleccionada(): Raza | null {
        return this.razaSeleccionada;
    }

    get RazaBaseSeleccionadaCompleta(): Raza | null {
        return this.razaBaseSeleccionadaCompleta;
    }

    get EstadoFlujo(): EstadoFlujoNuevoPersonaje {
        return this.estadoFlujo;
    }

    get TieneRestriccionCampanaGenerador(): boolean {
        return this.restriccionCampanaGenerador !== null;
    }

    activarPersistenciaBorradorLocal(uid: string): void {
        const uidNormalizado = `${uid ?? ''}`.trim();
        this.desactivarPersistenciaBorradorLocal();
        if (uidNormalizado.length < 1)
            return;

        this.draftUidActivo = uidNormalizado;
        this.draftUltimaFirmaPersistida = this.getFirmaBorradorLocal(uidNormalizado);
        this.draftAutosaveTimer = setInterval(() => {
            this.comprobarPersistenciaBorradorActiva();
        }, NUEVO_PERSONAJE_DRAFT_AUTOSAVE_MS);
    }

    desactivarPersistenciaBorradorLocal(): void {
        if (this.draftAutosaveTimer) {
            clearInterval(this.draftAutosaveTimer);
            this.draftAutosaveTimer = null;
        }
        if (this.draftPersistTimer) {
            clearTimeout(this.draftPersistTimer);
            this.draftPersistTimer = null;
        }
        this.draftUidActivo = '';
    }

    puedeOfrecerRestauracionBorrador(uid: string): boolean {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return false;
        if (this.tieneCreacionEnCurso())
            return false;
        return this.leerBorradorLocal(uidNormalizado) !== null;
    }

    restaurarBorradorLocal(uid: string): boolean {
        const borrador = this.leerBorradorLocal(uid);
        if (!borrador)
            return false;

        this.hidratarDesdeBorradorLocal(borrador);
        this.draftUltimaFirmaPersistida = this.getFirmaBorradorLocal(`${borrador.uid ?? ''}`.trim());
        return true;
    }

    descartarBorradorLocal(uid?: string): void {
        const uidNormalizado = `${uid ?? this.draftUidActivo ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return;
        this.eliminarBorradorStorage(uidNormalizado);
        if (this.draftUidActivo === uidNormalizado)
            this.draftUltimaFirmaPersistida = null;
    }

    persistirBorradorLocalAhora(uid?: string): void {
        const uidNormalizado = `${uid ?? this.draftUidActivo ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return;

        const borrador = this.construirBorradorLocal(uidNormalizado);
        if (!borrador) {
            this.eliminarBorradorStorage(uidNormalizado);
            this.draftUltimaFirmaPersistida = null;
            return;
        }

        this.escribirBorradorStorage(uidNormalizado, borrador);
        this.draftUltimaFirmaPersistida = this.firmarBorradorLocal(borrador);
    }

    refrescarDerivadasPreviewNuevoPersonaje(): void {
        this.recalcularDerivadasPorCaracteristicas();
        this.recalcularDerivadasEconomiaYProgresion();
    }

    async sincronizarConfigGeneradorDesdeCuenta(): Promise<void> {
        if (!this.userSettingsSvc)
            return;

        try {
            await this.userSettingsSvc.migrateLegacyLocalConfigOnce(GENERADOR_CONFIG_STORAGE_KEY);
            const perfil = await this.userSettingsSvc.loadProfileSettings();
            this.visibilidadPorDefectoPersonajes = perfil.visibilidadPorDefectoPersonajes === true;
            this.personajeCreacion.visible_otros_usuarios = this.visibilidadPorDefectoPersonajes;
            const remota = await this.userSettingsSvc.loadGeneradorConfig();
            if (!remota)
                return;

            const minimoRaw = Number(remota.minimoSeleccionado);
            const tablasRaw = Number(remota.tablasPermitidas);
            const minimo = this.normalizarMinimo(Number.isFinite(minimoRaw) ? minimoRaw : DEFAULT_TIRADA);
            const tablasPermitidas = this.normalizarTablasPermitidas(Number.isFinite(tablasRaw) ? tablasRaw : DEFAULT_TABLAS);
            this.generadorConfigBase = {
                minimoSeleccionado: minimo,
                tablasPermitidas,
            };
            this.aplicarConfigGeneradorEfectiva();
        } catch {
            // Si falla la lectura de settings remotos, mantenemos configuración en memoria.
        }
    }

    aplicarRestriccionCampanaGenerador(
        restriccion: { tiradaMinimaCaracteristica?: number | null; maxTablasDadosCaracteristicas?: number | null; } | null | undefined
    ): void {
        if (!restriccion) {
            this.restriccionCampanaGenerador = null;
            this.aplicarConfigGeneradorEfectiva();
            return;
        }

        const minimo = this.normalizarMinimo(
            Number.isFinite(Number(restriccion.tiradaMinimaCaracteristica))
                ? Number(restriccion.tiradaMinimaCaracteristica)
                : MIN_TIRADA
        );
        const tablasPermitidas = this.normalizarTablasPermitidas(
            Number.isFinite(Number(restriccion.maxTablasDadosCaracteristicas))
                ? Number(restriccion.maxTablasDadosCaracteristicas)
                : MIN_TABLAS
        );

        this.restriccionCampanaGenerador = {
            minimoSeleccionado: minimo,
            tablasPermitidas,
        };
        this.aplicarConfigGeneradorEfectiva();
    }

    reiniciar(): void {
        const catalogoHabilidades = this.estadoFlujo.ventajas.catalogoHabilidades.slice();
        const catalogoHabilidadesCustom = this.estadoFlujo.ventajas.catalogoHabilidadesCustom.slice();
        const catalogoIdiomas = this.estadoFlujo.ventajas.catalogoIdiomas.slice();
        const catalogoVentajas = this.estadoFlujo.ventajas.catalogoVentajas.slice();
        const catalogoDesventajas = this.estadoFlujo.ventajas.catalogoDesventajas.slice();
        const catalogoClases = this.catalogoClases.slice();
        const catalogoDotes = this.catalogoDotes.slice();
        const catalogoConjuros = this.catalogoConjuros.slice();
        const catalogoDominios = this.catalogoDominios.slice();
        const catalogoRegiones = this.catalogoRegiones.slice();
        const catalogoDeidades = this.catalogoDeidades.slice();

        this.personajeCreacion = this.crearPersonajeBase();
        this.razaSeleccionada = null;
        this.razaBaseSeleccionadaCompleta = null;
        this.idsEspecialesInternosActivos.clear();
        this.idsDotesInternosActivos.clear();
        this.conjurosSesionPlaceholderPorId = {};
        this.bonusNivelLanzadorPorClase = {};
        this.dotesPendientes = [];
        this.secuenciaDotePendiente = 1;
        this.dotesProgresionConcedidas = 0;
        this.dotesExtraRazaConcedidas = 0;
        this.aumentosPendientesCaracteristica = [];
        this.aumentosProgresionConcedidos = 0;
        this.secuenciaAumentoPendiente = 1;
        this.estadoFlujo = this.crearEstadoFlujoBase();

        this.setCatalogoHabilidades(catalogoHabilidades);
        this.setCatalogoHabilidadesCustom(catalogoHabilidadesCustom);
        this.setCatalogoIdiomas(catalogoIdiomas);
        this.setCatalogosVentajas(catalogoVentajas, catalogoDesventajas);
        this.setCatalogoClases(catalogoClases);
        this.setCatalogoDotes(catalogoDotes);
        this.setCatalogoConjuros(catalogoConjuros);
        this.setCatalogoDominios(catalogoDominios);
        this.setCatalogoRegiones(catalogoRegiones);
        this.setCatalogoDeidades(catalogoDeidades);
        this.sincronizarBaseVentajasDesdePersonaje();
        this.programarPersistenciaBorradorLocal();
    }

    resetearCreacionNuevoPersonaje(): void {
        this.reiniciar();
    }

    seleccionarRaza(
        raza: Raza,
        razaBase: Raza | null = null,
        seleccionOpcionales: SeleccionRacialesOpcionales | null = null
    ): boolean {
        const usaMutacion = esRazaMutada(raza);
        if (usaMutacion && !razaBase)
            return false;

        const razaEfectiva = usaMutacion && razaBase
            ? aplicarMutacion(razaBase, raza)
            : this.copiarRaza(raza);
        const racialesEfectivos = resolverRacialesFinales(
            this.copiarRaciales(razaEfectiva.Raciales),
            seleccionOpcionales
        );
        if (!racialesEfectivos)
            return false;

        razaEfectiva.Raciales = racialesEfectivos;

        this.razaSeleccionada = razaEfectiva;
        this.razaBaseSeleccionadaCompleta = usaMutacion && razaBase
            ? this.copiarRaza(razaBase)
            : null;
        this.personajeCreacion.Raza = razaEfectiva;
        this.personajeCreacion.RazaBase = usaMutacion && razaBase
            ? this.construirRazaSimpleDesdeRaza(razaBase)
            : null;
        this.personajeCreacion.Correr = razaEfectiva.Correr ?? 0;
        this.personajeCreacion.Nadar = razaEfectiva.Nadar ?? 0;
        this.personajeCreacion.Volar = razaEfectiva.Volar ?? 0;
        this.personajeCreacion.Trepar = razaEfectiva.Trepar ?? 0;
        this.personajeCreacion.Escalar = razaEfectiva.Escalar ?? 0;
        this.personajeCreacion.Raciales = this.asignarOrigenRaciales(
            this.copiarRaciales(razaEfectiva.Raciales),
            razaEfectiva.Nombre
        );
        this.personajeCreacion.Sortilegas = this.asignarOrigenSortilegas(
            this.copiarSortilegas(razaEfectiva.Sortilegas),
            razaEfectiva.Nombre
        );
        this.clearAutoRepartoGuardado();
        this.personajeCreacion.Idiomas = [];
        this.aplicarIdiomasAutomaticos(razaEfectiva.Nombre, razaEfectiva?.Idiomas ?? []);
        if (razaEfectiva?.Tipo_criatura) {
            this.personajeCreacion.Tipo_criatura = this.copiarTipoCriatura(razaEfectiva.Tipo_criatura);
            this.sincronizarCaracteristicasPerdidasConTipoActual();
        }
        this.personajeCreacion.Edad = razaEfectiva.Edad_adulto ?? 0;
        this.personajeCreacion.Altura = razaEfectiva.Altura_rango_inf ?? 0;
        this.personajeCreacion.Peso = razaEfectiva.Peso_rango_inf ?? 0;

        const alineamientoBase = razaEfectiva.Alineamiento?.Basico?.Nombre;
        if (alineamientoBase && alineamientoBase.trim().length > 0) {
            this.personajeCreacion.Alineamiento = alineamientoBase;
        }

        this.estadoFlujo.pasoActual = 'basicos';
        this.estadoFlujo.caracteristicasGeneradas = false;
        this.cerrarModalCaracteristicas();
        this.resetearGeneradorCaracteristicas();
        this.estadoFlujo.plantillas = this.crearPlantillasFlujoBase();
        this.estadoFlujo.plantillas.heredadaActiva = !!razaEfectiva.Heredada;
        this.estadoFlujo.habilidades = this.crearHabilidadesFlujoBase();
        this.estadoFlujo.conjuros = this.crearConjurosFlujoBase();
        this.personajeCreacion.Plantillas = [];
        this.personajeCreacion.desgloseClases = [];
        this.personajeCreacion.Clases = '';
        this.personajeCreacion.Conjuros = [];
        this.personajeCreacion.Claseas = [];
        this.personajeCreacion.Dotes = [];
        this.personajeCreacion.DotesContextuales = [];
        this.personajeCreacion.enemigosPredilectos = [];
        this.idsEspecialesInternosActivos.clear();
        this.idsDotesInternosActivos.clear();
        this.dotesPendientes = [];
        this.secuenciaDotePendiente = 1;
        this.dotesProgresionConcedidas = 0;
        this.dotesExtraRazaConcedidas = 0;
        this.conjurosSesionPlaceholderPorId = {};
        this.bonusNivelLanzadorPorClase = {};
        this.aumentosPendientesCaracteristica = [];
        this.aumentosProgresionConcedidos = 0;
        this.secuenciaAumentoPendiente = 1;
        this.personajeCreacion.Salvaciones.fortaleza.modsClaseos = [];
        this.personajeCreacion.Salvaciones.reflejos.modsClaseos = [];
        this.personajeCreacion.Salvaciones.voluntad.modsClaseos = [];
        this.recalcularTipoYSubtiposDerivados();
        this.limpiarVentajasDesventajas();
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();
        this.inicializarHabilidadesBase(true);
        this.recalcularEfectosVentajas();
        this.programarPersistenciaBorradorLocal();
        return true;
    }

    setPlantillasDisponibles(plantillas: Plantilla[]): void {
        this.estadoFlujo.plantillas.disponibles = [...plantillas];
        this.recalcularSimulacionPlantillas();
    }

    agregarPlantillaSeleccion(plantilla: Plantilla): boolean {
        if (this.estadoFlujo.plantillas.seleccionadas.some(p => p.Id === plantilla.Id))
            return false;

        this.estadoFlujo.plantillas.seleccionadas.push(plantilla);
        this.recalcularSimulacionPlantillas();
        return true;
    }

    quitarPlantillaSeleccion(idPlantilla: number): void {
        const idObjetivo = this.toNumber(idPlantilla);
        if (idObjetivo <= 0 || this.esPlantillaConfirmada(idObjetivo))
            return;

        this.estadoFlujo.plantillas.seleccionadas = this.estadoFlujo.plantillas.seleccionadas
            .filter((p) => this.toNumber(p.Id) !== idObjetivo);
        this.recalcularSimulacionPlantillas();
    }

    limpiarPlantillasSeleccion(): void {
        const idsConfirmadas = this.getIdsPlantillasConfirmadasSet();
        this.estadoFlujo.plantillas.seleccionadas = idsConfirmadas.size < 1
            ? []
            : this.estadoFlujo.plantillas.seleccionadas
                .filter((plantilla) => idsConfirmadas.has(this.toNumber(plantilla?.Id)));
        this.recalcularSimulacionPlantillas();
    }

    confirmarSeleccionActualPlantillas(): void {
        const merged = this.getIdsPlantillasConfirmadasSet();
        this.estadoFlujo.plantillas.seleccionadas.forEach((plantilla) => {
            const id = this.toNumber(plantilla?.Id);
            if (id > 0)
                merged.add(id);
        });
        this.estadoFlujo.plantillas.confirmadasIds = Array.from(merged);
    }

    esPlantillaConfirmada(idPlantilla: number): boolean {
        const idObjetivo = this.toNumber(idPlantilla);
        if (idObjetivo <= 0)
            return false;
        return this.getIdsPlantillasConfirmadasSet().has(idObjetivo);
    }

    setRetornoFinNivelPendientePlantillas(activo: boolean): void {
        this.estadoFlujo.plantillas.retornoFinNivelPendiente = !!activo;
    }

    consumirRetornoFinNivelPendientePlantillas(): boolean {
        const activo = !!this.estadoFlujo.plantillas.retornoFinNivelPendiente;
        this.estadoFlujo.plantillas.retornoFinNivelPendiente = false;
        return activo;
    }

    recalcularSimulacionPlantillas(): void {
        this.recalcularTipoYSubtiposDerivados();
        this.recalcularEfectosVentajas();
    }

    setCatalogosVentajas(ventajas: VentajaDetalle[], desventajas: VentajaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoVentajas = [...ventajas];
        this.estadoFlujo.ventajas.catalogoDesventajas = [...desventajas];
        this.sanitizarSeleccionesVentajas();
        this.recalcularEfectosVentajas();
    }

    setCatalogoHabilidades(habilidades: HabilidadBasicaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoHabilidades = [...habilidades];
        const debeInicializar = (this.personajeCreacion.Habilidades?.length ?? 0) < 1;
        this.inicializarHabilidadesBase(debeInicializar);
        this.recalcularEfectosVentajas();
    }

    setCatalogoHabilidadesCustom(habilidades: HabilidadBasicaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoHabilidadesCustom = [...habilidades];
    }

    setCatalogoIdiomas(idiomas: IdiomaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoIdiomas = [...idiomas];
        this.sanitizarIdiomasEnVentajas();
        this.recalcularEfectosVentajas();
    }

    setCatalogoTiposCriatura(tipos: TipoCriatura[]): void {
        this.catalogoTiposCriatura = [...tipos];
        this.recalcularTipoYSubtiposDerivados();
    }

    setCatalogoClases(clases: Clase[]): void {
        this.catalogoClases = [...clases];
    }

    setCatalogoDotes(dotes: Dote[]): void {
        this.catalogoDotes = [...(dotes ?? [])];
    }

    setCatalogoArmasDotes(catalogo: Array<{ Id: number; Nombre: string; }>): void {
        this.catalogoArmasDotes = this.normalizarCatalogoExtras(catalogo);
    }

    setCatalogoArmadurasDotes(catalogo: Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }>): void {
        this.catalogoArmadurasDotes = this.normalizarCatalogoExtras(catalogo);
    }

    setCatalogoGruposArmasDotes(catalogo: Array<{ Id: number; Nombre: string; }>): void {
        this.catalogoGruposArmasDotes = this.normalizarCatalogoExtras(catalogo);
    }

    setCatalogoGruposArmadurasDotes(catalogo: Array<{ Id: number; Nombre: string; }>): void {
        this.catalogoGruposArmadurasDotes = this.normalizarCatalogoExtras(catalogo);
    }

    setCatalogoEscuelasDotes(catalogo: Array<{ Id: number; Nombre: string; }>): void {
        this.catalogoEscuelasDotes = this.normalizarCatalogoExtras(catalogo);
    }

    setCatalogoConjuros(conjuros: Conjuro[]): void {
        this.catalogoConjuros = [...(conjuros ?? [])];
        this.conjurosSesionPlaceholderPorId = {};
    }

    setCatalogoDominios(dominios: DominioDetalle[]): void {
        this.catalogoDominios = [...dominios];
    }

    setCatalogoRegiones(regiones: RegionDetalle[]): void {
        this.catalogoRegiones = [...(regiones ?? [])];
    }

    setCatalogoDeidades(deidades: DeidadDetalle[]): void {
        this.catalogoDeidades = [...deidades];
    }

    evaluarClaseParaSeleccion(clase: Clase): ClaseEvaluacionResultado {
        const siguienteNivel = this.obtenerSiguienteNivelClase(clase.Nombre);
        const nivelMaximo = this.toNumber(clase?.Nivel_max_claseo);
        if (nivelMaximo > 0 && siguienteNivel > nivelMaximo) {
            return {
                estado: 'blocked_failed',
                razones: ['Nivel máximo alcanzado para esta clase'],
                advertencias: [],
            };
        }

        const identidad = buildIdentidadPrerrequisitos(
            this.razaSeleccionada,
            this.razaBaseSeleccionadaCompleta,
            this.personajeCreacion.Subtipos
        );

        const idiomas = (this.personajeCreacion.Idiomas ?? [])
            .map((idioma) => {
                const nombre = `${idioma?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return null;
                return {
                    id: this.resolverIdIdiomaPorNombre(nombre),
                    nombre,
                };
            })
            .filter((item): item is { id: number | null; nombre: string; } => !!item);

        type DoteEvaluacionClase = { id: number | null; nombre: string; idExtra: number | null; extra: string; };
        const dotesDesdeContexto = (this.personajeCreacion.DotesContextuales ?? [])
            .reduce<DoteEvaluacionClase[]>((acc, item) => {
                const nombre = `${item?.Dote?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return acc;
                const idExtra = this.toNumber(item?.Contexto?.Id_extra);
                acc.push({
                    id: this.toNumber(item?.Dote?.Id) > 0 ? this.toNumber(item?.Dote?.Id) : null,
                    nombre,
                    idExtra: idExtra > 0 ? idExtra : null,
                    extra: `${item?.Contexto?.Extra ?? ''}`.trim(),
                });
                return acc;
            }, []);
        const dotesLegacy = (this.personajeCreacion.Dotes ?? [])
            .reduce<DoteEvaluacionClase[]>((acc, item) => {
                const nombre = `${item?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return acc;
                acc.push({
                    id: null,
                    nombre,
                    idExtra: null,
                    extra: '',
                });
                return acc;
            }, []);
        type ClaseEspecialEvaluacionClase = { id: number | null; nombre: string; idExtra: number | null; extra: string; };
        const claseas = (this.personajeCreacion.Claseas ?? [])
            .reduce<ClaseEspecialEvaluacionClase[]>((acc, item) => {
                const nombre = `${item?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return acc;
                const idExtra = this.toNumber((item as any)?.Id_extra);
                acc.push({
                    id: this.toNumber((item as any)?.Id) > 0 ? this.toNumber((item as any)?.Id) : null,
                    nombre,
                    idExtra: idExtra > 0 ? idExtra : null,
                    extra: `${item?.Extra ?? ''}`.trim(),
                });
                return acc;
            }, []);
        type HabilidadEvaluacionClase = { id: number | null; nombre: string; rangos: number; idExtra: number | null; extra: string; };
        const habilidades = (this.personajeCreacion.Habilidades ?? [])
            .reduce<HabilidadEvaluacionClase[]>((acc, habilidad) => {
                const nombre = `${habilidad?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return acc;

                const extra = `${habilidad?.Extra ?? ''}`.trim();
                const extraNorm = this.normalizarTexto(extra);
                let idExtra: number | null = null;
                const extrasDisponibles = Array.isArray(habilidad?.Extras) ? habilidad.Extras : [];
                if (extraNorm.length > 0) {
                    const extraEncontrado = extrasDisponibles.find((item) =>
                        this.normalizarTexto(item?.Extra ?? '') === extraNorm
                    );
                    const idExtraEncontrado = this.toNumber(extraEncontrado?.Id_extra);
                    if (idExtraEncontrado > 0)
                        idExtra = idExtraEncontrado;
                    else {
                        const parseExtra = this.toNumber(extra);
                        if (parseExtra > 0)
                            idExtra = parseExtra;
                    }
                }

                acc.push({
                    id: this.toNumber(habilidad?.Id) > 0 ? this.toNumber(habilidad?.Id) : null,
                    nombre,
                    rangos: this.toNumber(habilidad?.Rangos),
                    idExtra,
                    extra,
                });
                return acc;
            }, []);
        type ConjuroEvaluacionClase = { id: number | null; nombre: string; idEscuela: number | null; escuela: string; };
        const conjuros = (this.personajeCreacion.Conjuros ?? [])
            .reduce<ConjuroEvaluacionClase[]>((acc, conjuro) => {
                const nombre = `${conjuro?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return acc;
                const idEscuela = this.toNumber(conjuro?.Escuela?.Id);
                acc.push({
                    id: this.toNumber(conjuro?.Id) > 0 ? this.toNumber(conjuro?.Id) : null,
                    nombre,
                    idEscuela: idEscuela > 0 ? idEscuela : null,
                    escuela: `${conjuro?.Escuela?.Nombre ?? ''}`.trim(),
                });
                return acc;
            }, []);
        const dominios = (this.personajeCreacion.Dominios ?? [])
            .map((item) => {
                const nombre = `${item?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return null;
                return {
                    id: this.resolverIdDominioPorNombre(nombre),
                    nombre,
                };
            })
            .filter((item): item is { id: number | null; nombre: string; } => !!item);
        const nivelLanzadorArcano = this.resolverNivelLanzadorMaximoPorTipo('arcano');
        const nivelLanzadorDivino = this.resolverNivelLanzadorMaximoPorTipo('divino');
        const nivelLanzadorPsionico = this.resolverNivelLanzadorMaximoPorTipo('psionico');
        const nombreEscuelaEspecialista = `${this.personajeCreacion?.Escuela_especialista?.Nombre ?? ''}`.trim();

        return evaluarElegibilidadClase(clase, {
            identidad,
            caracteristicas: {
                Fuerza: this.toNumber(this.personajeCreacion.Fuerza),
                Destreza: this.toNumber(this.personajeCreacion.Destreza),
                Constitucion: this.toNumber(this.personajeCreacion.Constitucion),
                Inteligencia: this.toNumber(this.personajeCreacion.Inteligencia),
                Sabiduria: this.toNumber(this.personajeCreacion.Sabiduria),
                Carisma: this.toNumber(this.personajeCreacion.Carisma),
            },
            ataqueBase: this.extraerPrimerEnteroConSigno(this.personajeCreacion.Ataque_base),
            alineamiento: `${this.personajeCreacion.Alineamiento ?? ''}`,
            genero: `${this.personajeCreacion.Genero ?? ''}`,
            dotes: [...dotesDesdeContexto, ...dotesLegacy],
            claseas,
            habilidades,
            conjuros,
            idiomas,
            dominios,
            competenciasArmas: this.resolverCompetenciasArmasActuales(),
            competenciasArmaduras: this.resolverCompetenciasArmadurasActuales(),
            competenciasGrupoArmas: this.resolverCompetenciasGrupoArmasActuales(),
            competenciasGrupoArmaduras: this.resolverCompetenciasGrupoArmadurasActuales(),
            lanzador: {
                arcano: nivelLanzadorArcano,
                divino: nivelLanzadorDivino,
                psionico: nivelLanzadorPsionico,
            },
            nivelesConjuroMaximos: {
                arcano: this.resolverNivelConjuroMaximoPorTipo('arcano'),
                divino: this.resolverNivelConjuroMaximoPorTipo('divino'),
                psionico: this.resolverNivelPoderPsionicoMaximo(),
            },
            dgTotal: this.resolverDgTotalActual(),
            reservaPsionica: this.resolverReservaPsionicaActual(),
            escuelaEspecialista: {
                id: this.resolverIdEscuelaPorNombre(nombreEscuelaEspecialista),
                nombre: nombreEscuelaEspecialista,
                nivelArcano: nivelLanzadorArcano,
            },
            tamanoId: this.resolverTamanoActualId(),
        });
    }

    esBloqueoSoloPorAlineamiento(evaluacion: ClaseEvaluacionResultado | null | undefined): boolean {
        if (!evaluacion || evaluacion.estado === 'eligible')
            return false;

        const mensajes = [
            ...(evaluacion.razones ?? []),
            ...(evaluacion.advertencias ?? []),
        ].map((msg) => `${msg ?? ''}`.trim()).filter((msg) => msg.length > 0);
        if (mensajes.length < 1)
            return false;

        return mensajes.every((mensaje) => this.esMensajeRelacionAlineamiento(mensaje));
    }

    obtenerOpcionalesSiguienteNivelClase(clase: Clase): ClaseGrupoOpcionalPendiente[] {
        const nivelActual = this.obtenerNivelActualClase(clase.Nombre);
        const siguienteNivel = nivelActual + 1;
        const detalleSiguiente = this.obtenerDetalleNivelClase(clase, siguienteNivel);
        if (!detalleSiguiente)
            return [];

        const resolucion = this.resolverOpcionalesNivelClase(detalleSiguiente, null);
        return resolucion.gruposPendientes;
    }

    obtenerDominiosPendientesSiguienteNivelClase(clase: Clase): ClaseDominiosPendientes | null {
        const nivelActual = this.obtenerNivelActualClase(clase.Nombre);
        const siguienteNivel = nivelActual + 1;
        const detalleSiguiente = this.obtenerDetalleNivelClase(clase, siguienteNivel);
        if (!detalleSiguiente)
            return null;

        const cantidad = this.resolverCantidadDominiosNivelClase(clase, detalleSiguiente, siguienteNivel);
        if (cantidad < 1)
            return null;

        const opciones = this.resolverDominiosDisponiblesClase(clase);
        return {
            cantidad,
            opciones,
        };
    }

    getIdiomasPendientesPostClase(): IdiomasPendientesPostClase {
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        if (nivelClases !== 1) {
            return {
                cantidad: 0,
                motivo: 'Solo se eligen idiomas adicionales en el primer nivel global del personaje',
            };
        }

        const cantidad = Math.max(0, this.toNumber(this.personajeCreacion.ModInteligencia) + EXTRA_IDIOMAS_INICIALES);
        return {
            cantidad,
            motivo: 'Idiomas iniciales por modificador de Inteligencia',
        };
    }

    iniciarDistribucionHabilidadesPorRazaDG(): boolean {
        const raza = this.razaSeleccionada;
        if (!raza)
            return false;

        const dgsExtra = this.toNumber(raza?.Dgs_adicionales?.Cantidad);
        if (dgsExtra < 1)
            return false;

        const puntosBase = this.toNumber(raza?.Dgs_adicionales?.Puntos_habilidad);
        const multiplicador = this.toNumber(raza?.Dgs_adicionales?.Multiplicador_puntos_habilidad);
        const modInt = this.toNumber(this.personajeCreacion?.ModInteligencia);
        const puntos = modInt >= 0
            ? puntosBase * (multiplicador + modInt)
            : puntosBase * multiplicador;

        const total = Math.max(0, Math.trunc(puntos));
        if (total < 1)
            return false;

        this.iniciarDistribucionHabilidadesInterna('raza_dg', 'plantillas', total, []);
        return true;
    }

    iniciarDistribucionHabilidadesPorPlantillasDG(): boolean {
        const seleccionadas = this.estadoFlujo.plantillas.seleccionadas ?? [];
        if (seleccionadas.length < 1)
            return false;

        const plantillasConDg = seleccionadas
            .filter((plantilla) => this.toNumber(plantilla?.Licantronia_dg?.Multiplicador) > 0);
        if (plantillasConDg.length < 1)
            return false;

        const total = plantillasConDg.reduce((acc, plantilla) => {
            const sumaFija = Math.max(1, Math.trunc(this.toNumber(plantilla?.Puntos_habilidad?.Suma_fija)));
            return acc + sumaFija;
        }, 0);

        if (total < 1)
            return false;

        const classSkillTemporales = new Set<number>();
        plantillasConDg.forEach((plantilla) => {
            (plantilla?.Habilidades ?? []).forEach((habilidadRef) => {
                const habilidad = this.asegurarHabilidadDesdePlantilla(habilidadRef);
                const id = this.toNumber(habilidad?.Id);
                if (id > 0)
                    classSkillTemporales.add(id);
            });
        });

        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        const returnStep: StepNuevoPersonaje = nivelClases > 0 ? 'clases' : 'ventajas';
        this.iniciarDistribucionHabilidadesInterna(
            'plantilla_dg',
            returnStep,
            total,
            Array.from(classSkillTemporales)
        );
        return true;
    }

    iniciarDistribucionHabilidadesPorClase(clase: Clase, nivelAplicado: number): boolean {
        const nivel = Math.max(1, Math.trunc(this.toNumber(nivelAplicado)));
        const puntosBase = this.toNumber(clase?.Puntos_habilidad?.Valor);
        const modInt = Math.max(0, this.toNumber(this.personajeCreacion?.ModInteligencia));
        const puntos = nivel === 1
            ? 4 * (puntosBase + modInt)
            : puntosBase + modInt;
        const total = Math.max(0, Math.trunc(puntos));

        const returnStep: StepNuevoPersonaje = this.estadoFlujo.conjuros.activa ? 'conjuros' : 'dotes';
        this.iniciarDistribucionHabilidadesInterna('clase_nivel', returnStep, total, []);
        return true;
    }

    ajustarRangoHabilidad(idHabilidad: number, delta: number): boolean {
        if (!this.estadoFlujo.habilidades.activa)
            return false;

        const id = this.toNumber(idHabilidad);
        const cambio = Math.trunc(this.toNumber(delta));
        if (id <= 0 || cambio === 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => this.toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        const actual = Math.max(0, this.toNumber(habilidad.Rangos));

        if (cambio > 0) {
            if (this.esHabilidadEntrenadaNoClaseaParaSesion(habilidad))
                return false;

            const limite = this.obtenerLimiteRangoHabilidad(id);
            const maxSubida = limite - actual;
            const subida = Math.min(cambio, maxSubida);
            if (subida < 1)
                return false;
            if (this.estadoFlujo.habilidades.puntosRestantes < subida)
                return false;

            habilidad.Rangos = actual + subida;
            this.estadoFlujo.habilidades.puntosRestantes -= subida;
            return true;
        }

        const bajada = Math.min(Math.abs(cambio), actual);
        if (bajada < 1)
            return false;

        habilidad.Rangos = actual - bajada;
        this.estadoFlujo.habilidades.puntosRestantes = Math.min(
            this.estadoFlujo.habilidades.puntosTotales,
            this.estadoFlujo.habilidades.puntosRestantes + bajada
        );
        return true;
    }

    setExtraHabilidad(idHabilidad: number, extra: string): boolean {
        const id = this.toNumber(idHabilidad);
        if (id <= 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => this.toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        if (!this.toBooleanValue(habilidad?.Soporta_extra))
            return false;
        if (!this.esHabilidadClaseaParaSesion(habilidad))
            return false;
        if (this.toBooleanValue(habilidad?.Extra_bloqueado))
            return false;

        const extraLimpio = `${extra ?? ''}`.trim();
        const extraNormalizado = this.normalizarTexto(extraLimpio);
        const opciones = (habilidad.Extras ?? [])
            .map((item) => `${item?.Extra ?? ''}`.trim())
            .filter((item) => item.length > 0);
        if (opciones.length > 0 && !this.esExtraHabilidadPendienteValor(extraNormalizado)) {
            const existeOpcion = opciones.some((opcion) => this.normalizarTexto(opcion) === extraNormalizado);
            if (!existeOpcion)
                return false;
        }
        if (this.existeExtraDuplicadoEnGrupoParaSesion(habilidad, extraNormalizado))
            return false;

        habilidad.Extra = extraLimpio;
        return true;
    }

    puedeCerrarDistribucionHabilidades(): boolean {
        if (!this.estadoFlujo.habilidades.activa)
            return true;
        if (this.toNumber(this.estadoFlujo.habilidades.puntosRestantes) !== 0)
            return false;
        if (this.personajeCreacion.Habilidades.some((habilidad) => this.esExtraHabilidadPendienteParaSesion(habilidad)))
            return false;
        return !this.hayExtrasDuplicadosClaseosParaSesion();
    }

    cerrarDistribucionHabilidades(): StepNuevoPersonaje | null {
        if (!this.puedeCerrarDistribucionHabilidades())
            return null;

        const returnStep = this.estadoFlujo.habilidades.returnStep;
        this.estadoFlujo.habilidades = this.crearHabilidadesFlujoBase();
        return returnStep;
    }

    getConjurosSesionActual(): ConjurosFlujoState {
        if (this.estadoFlujo.conjuros.activa)
            this.getEntradaConjurosActiva();
        return {
            ...this.estadoFlujo.conjuros,
            entradas: this.estadoFlujo.conjuros.entradas.map((entrada) => ({
                ...entrada,
                claseObjetivo: { ...entrada.claseObjetivo },
                cupoPendiente: {
                    total: this.toNumber(entrada.cupoPendiente?.total),
                    porNivel: { ...(entrada.cupoPendiente?.porNivel ?? {}) },
                },
                cupoInicial: {
                    total: this.toNumber(entrada.cupoInicial?.total),
                    porNivel: { ...(entrada.cupoInicial?.porNivel ?? {}) },
                },
                nivelesPorConjuro: { ...(entrada.nivelesPorConjuro ?? {}) },
                elegiblesIds: [...(entrada.elegiblesIds ?? [])],
                seleccionadosIds: [...(entrada.seleccionadosIds ?? [])],
                autoadicionadosIds: [...(entrada.autoadicionadosIds ?? [])],
                avisos: [...(entrada.avisos ?? [])],
            })),
            avisos: [...(this.estadoFlujo.conjuros.avisos ?? [])],
        };
    }

    filtrarConjurosDisponibles(filtroTexto: string = '', nivelConjuro: number | null = null): Conjuro[] {
        const entrada = this.getEntradaConjurosActiva();
        if (!entrada || !entrada.seleccionManual)
            return [];

        const filtro = this.normalizarTexto(filtroTexto);
        const nivelFiltro = nivelConjuro === null ? null : Math.max(0, Math.trunc(this.toNumber(nivelConjuro)));
        const idsNoDisponibles = new Set<number>([
            ...(entrada.seleccionadosIds ?? []),
            ...(entrada.autoadicionadosIds ?? []),
        ].map((id) => this.toNumber(id)).filter((id) => id > 0));

        return this.obtenerConjurosElegiblesParaEntrada(entrada)
            .filter((conjuro) => !idsNoDisponibles.has(this.toNumber(conjuro?.Id)))
            .filter((conjuro) => {
                if (filtro.length < 1)
                    return true;
                return this.normalizarTexto(conjuro?.Nombre ?? '').includes(filtro);
            })
            .filter((conjuro) => {
                if (nivelFiltro === null)
                    return true;
                return this.resolverNivelConjuroEntrada(entrada, conjuro) === nivelFiltro;
            })
            .sort((a, b) => {
                const nivelA = this.resolverNivelConjuroEntrada(entrada, a);
                const nivelB = this.resolverNivelConjuroEntrada(entrada, b);
                if (nivelA !== nivelB)
                    return nivelA - nivelB;
                return `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' });
            });
    }

    seleccionarConjuroSesion(idConjuro: number): boolean {
        const entrada = this.getEntradaConjurosActiva();
        if (!entrada || !entrada.seleccionManual)
            return false;

        const id = Math.trunc(this.toNumber(idConjuro));
        if (id <= 0)
            return false;
        if (entrada.seleccionadosIds.includes(id) || entrada.autoadicionadosIds.includes(id))
            return false;

        const conjuro = this.obtenerConjuroCatalogoPorId(id);
        if (!conjuro)
            return false;
        if (!this.obtenerConjurosElegiblesParaEntrada(entrada).some((item) => this.toNumber(item?.Id) === id))
            return false;

        const nivelConjuro = this.resolverNivelConjuroEntrada(entrada, conjuro);
        if (this.toNumber(entrada.cupoPendiente?.total) > 0) {
            entrada.cupoPendiente.total = Math.max(0, this.toNumber(entrada.cupoPendiente.total) - 1);
            entrada.seleccionadosIds = [...entrada.seleccionadosIds, id];
            return true;
        }

        const cupoNivel = this.toNumber(entrada.cupoPendiente?.porNivel?.[nivelConjuro]);
        if (cupoNivel < 1)
            return false;
        entrada.cupoPendiente.porNivel[nivelConjuro] = Math.max(0, cupoNivel - 1);
        entrada.seleccionadosIds = [...entrada.seleccionadosIds, id];
        return true;
    }

    quitarConjuroSesion(idConjuro: number): boolean {
        const entrada = this.getEntradaConjurosActiva();
        if (!entrada || !entrada.seleccionManual)
            return false;

        const id = Math.trunc(this.toNumber(idConjuro));
        if (id <= 0 || !entrada.seleccionadosIds.includes(id))
            return false;

        entrada.seleccionadosIds = entrada.seleccionadosIds.filter((actual) => actual !== id);
        const conjuro = this.obtenerConjuroCatalogoPorId(id);
        if (!conjuro)
            return true;

        const nivelConjuro = this.resolverNivelConjuroEntrada(entrada, conjuro);
        if (this.toNumber(entrada.cupoInicial?.total) > 0) {
            entrada.cupoPendiente.total = Math.min(
                this.toNumber(entrada.cupoInicial.total),
                this.toNumber(entrada.cupoPendiente.total) + 1
            );
            return true;
        }

        const inicialNivel = this.toNumber(entrada.cupoInicial?.porNivel?.[nivelConjuro]);
        const pendienteNivel = this.toNumber(entrada.cupoPendiente?.porNivel?.[nivelConjuro]);
        entrada.cupoPendiente.porNivel[nivelConjuro] = Math.min(inicialNivel, pendienteNivel + 1);
        return true;
    }

    puedeCerrarSesionConjuros(): boolean {
        if (!this.estadoFlujo.conjuros.activa)
            return true;

        return this.estadoFlujo.conjuros.entradas.every((entrada) => {
            if (!entrada.seleccionManual)
                return true;
            if (entrada.almaPendiente || entrada.sinElegibles)
                return true;
            if (this.toNumber(entrada.cupoPendiente?.total) > 0)
                return false;
            const pendientesPorNivel = Object.values(entrada.cupoPendiente?.porNivel ?? {})
                .reduce((acc, valor) => acc + Math.max(0, this.toNumber(valor)), 0);
            return pendientesPorNivel === 0;
        });
    }

    cerrarSesionConjuros(): StepNuevoPersonaje {
        if (!this.puedeCerrarSesionConjuros())
            return 'conjuros';

        this.estadoFlujo.conjuros.entradas.forEach((entrada) => {
            const ids = [...(entrada.autoadicionadosIds ?? []), ...(entrada.seleccionadosIds ?? [])];
            ids.forEach((idConjuro) => {
                const conjuro = this.obtenerConjuroCatalogoPorId(idConjuro);
                if (!conjuro)
                    return;
                this.agregarConjuroSesionAPersonaje(entrada, conjuro);
            });
        });

        const returnStep = this.estadoFlujo.conjuros.returnStep || 'dotes';
        this.estadoFlujo.conjuros = this.crearConjurosFlujoBase();
        return returnStep;
    }

    esHabilidadClaseaEfectiva(idHabilidad: number): boolean {
        const id = this.toNumber(idHabilidad);
        if (id <= 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => this.toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        return this.esHabilidadClaseaParaSesion(habilidad);
    }

    obtenerLimiteRangoHabilidad(idHabilidad: number): number {
        const id = this.toNumber(idHabilidad);
        if (id <= 0)
            return 0;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => this.toNumber(item?.Id) === id);
        if (!habilidad)
            return 0;

        const nivelReferencia = Math.max(
            0,
            this.toNumber(this.estadoFlujo.habilidades.nivelPersonajeReferencia) || this.getNivelEfectivoParaAumentos()
        );
        return this.esHabilidadClaseaParaSesion(habilidad)
            ? 3 + nivelReferencia
            : 1 + nivelReferencia;
    }

    private iniciarDistribucionHabilidadesInterna(
        origen: HabilidadesFlujoOrigen,
        returnStep: StepNuevoPersonaje,
        puntosTotales: number,
        classSkillTemporales: number[]
    ): void {
        const total = Math.max(0, Math.trunc(this.toNumber(puntosTotales)));
        const nivelReferencia = this.getNivelEfectivoParaAumentos();
        const temporales = Array.from(new Set(
            (classSkillTemporales ?? [])
                .map((id) => this.toNumber(id))
                .filter((id) => id > 0)
        ));
        const rangosIniciales: Record<number, number> = {};
        (this.personajeCreacion?.Habilidades ?? []).forEach((habilidad) => {
            const id = this.toNumber(habilidad?.Id);
            if (id <= 0)
                return;
            rangosIniciales[id] = Math.max(0, Math.trunc(this.toNumber(habilidad?.Rangos)));
        });

        this.estadoFlujo.habilidades = {
            activa: true,
            origen,
            returnStep,
            puntosTotales: total,
            puntosRestantes: total,
            nivelPersonajeReferencia: nivelReferencia,
            classSkillTemporales: temporales,
            rangosIniciales,
        };
        this.estadoFlujo.pasoActual = 'habilidades';
    }

    registrarAumentosPendientesPorProgresion(origen: string): AumentoCaracteristicaPendiente[] {
        const nivelEfectivoAumentos = this.getNivelEfectivoParaAumentos();
        const totalPorProgresion = Math.max(0, Math.floor(nivelEfectivoAumentos / 4));
        const nuevos = Math.max(0, totalPorProgresion - this.aumentosProgresionConcedidos);
        if (nuevos < 1)
            return [];

        const origenNormalizado = `${origen ?? ''}`.trim() || 'Progresion de nivel';
        const creados = Array.from({ length: nuevos }, () => this.crearPendienteAumento(
            1,
            origenNormalizado,
            'Aumento por progresion cada 4 niveles efectivos'
        ));

        this.aumentosPendientesCaracteristica = [
            ...this.aumentosPendientesCaracteristica,
            ...creados,
        ];
        this.aumentosProgresionConcedidos += nuevos;
        return creados.map((item) => ({ ...item }));
    }

    registrarAumentosPendientesPorEspeciales(especiales: ClaseEspecialNivel[], origen: string): AumentoCaracteristicaPendiente[] {
        const listaEspeciales = Array.isArray(especiales) ? especiales : [];
        const origenNormalizado = `${origen ?? ''}`.trim() || 'Especial de clase';
        const creados: AumentoCaracteristicaPendiente[] = [];
        listaEspeciales.forEach((especialNivel) => {
            const valor = this.resolverValorAumentoDesdeEspecial(especialNivel);
            if (valor < 1)
                return;

            const especialRaw = (especialNivel?.Especial ?? {}) as Record<string, any>;
            const nombreEspecial = `${especialRaw?.['Nombre'] ?? especialRaw?.['nombre'] ?? ''}`.trim() || 'Especial';
            creados.push(this.crearPendienteAumento(
                valor,
                origenNormalizado,
                `Aumento por especial: ${nombreEspecial}`
            ));
        });

        if (creados.length < 1)
            return [];

        this.aumentosPendientesCaracteristica = [
            ...this.aumentosPendientesCaracteristica,
            ...creados,
        ];
        return creados.map((item) => ({ ...item }));
    }

    getAumentosCaracteristicaPendientes(): AumentoCaracteristicaPendiente[] {
        return this.aumentosPendientesCaracteristica.map((item) => ({ ...item }));
    }

    aplicarAumentosCaracteristica(asignaciones: AsignacionAumentoCaracteristica[]): boolean {
        const pendientes = this.aumentosPendientesCaracteristica;
        if (pendientes.length < 1)
            return true;

        const asignacionesLista = Array.isArray(asignaciones) ? asignaciones : [];
        const pendientesPorId = new Set(pendientes.map((item) => this.toNumber(item?.id)));
        const seleccionPorPendiente = new Map<number, CaracteristicaKey>();

        for (const asignacion of asignacionesLista) {
            const idPendiente = this.toNumber(asignacion?.idPendiente);
            if (!pendientesPorId.has(idPendiente))
                return false;

            const caracteristicaRaw = `${asignacion?.caracteristica ?? ''}`.trim();
            if (!this.esCaracteristicaAumentoValida(caracteristicaRaw))
                return false;

            if (seleccionPorPendiente.has(idPendiente))
                return false;
            seleccionPorPendiente.set(idPendiente, caracteristicaRaw);
        }

        const incrementos: Record<CaracteristicaKey, number> = {
            Fuerza: 0,
            Destreza: 0,
            Constitucion: 0,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        };

        for (const pendiente of pendientes) {
            const idPendiente = this.toNumber(pendiente?.id);
            const caracteristica = seleccionPorPendiente.get(idPendiente);
            if (!caracteristica)
                return false;
            if (this.esCaracteristicaPerdida(caracteristica))
                return false;
            incrementos[caracteristica] += Math.max(0, this.toNumber(pendiente?.valor));
        }

        CARACTERISTICAS_KEYS.forEach((key) => {
            const aumento = this.toNumber(incrementos[key]);
            if (aumento < 1)
                return;
            const actual = this.toNumber((this.personajeCreacion as Record<string, any>)[key]);
            const final = actual + aumento;
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, this.calcularModificador(final));
        });

        this.recalcularDerivadasPorCaracteristicas();
        this.sincronizarAliasConstitucionPerdida();
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();

        this.aumentosPendientesCaracteristica = [];
        return true;
    }

    getTopesCaracteristicas(): Partial<Record<CaracteristicaKeyAumento, number>> {
        const topes: Partial<Record<CaracteristicaKeyAumento, number>> = {};
        const limiteInteligencia = this.toNumber(this.personajeCreacion?.Tipo_criatura?.Limite_inteligencia);
        if (limiteInteligencia > 0)
            topes.Inteligencia = limiteInteligencia;
        return topes;
    }

    registrarDotesPendientesPorProgresion(origen: string): DotePendienteState[] {
        const nivelEfectivoDotes = this.getNivelEfectivoParaDotesProgresion();
        const dgsRaciales = this.getDgsRacialesAdicionalesParaDotesProgresion();
        const dotesBasePorDgsRaciales = Math.max(0, Math.floor(dgsRaciales / 3));
        const doteInicialNivel = nivelEfectivoDotes > 0 && !this.tieneDgsAdicionalesParaDoteInicial() ? 1 : 0;
        const totalPorProgresion = Math.max(
            0,
            doteInicialNivel + Math.floor((nivelEfectivoDotes + dgsRaciales) / 3) - dotesBasePorDgsRaciales
        );
        const nuevas = Math.max(0, totalPorProgresion - this.dotesProgresionConcedidas);
        if (nuevas < 1)
            return [];

        const origenNormalizado = `${origen ?? ''}`.trim() || 'Progresion de nivel';
        const creadas = Array.from({ length: nuevas }, () =>
            this.crearDotePendiente('nivel', origenNormalizado, null)
        );
        this.dotesPendientes = [
            ...this.dotesPendientes,
            ...creadas,
        ];
        this.dotesProgresionConcedidas += nuevas;
        return creadas.map((item) => ({ ...item }));
    }

    registrarDotesPendientesPorRazaExtras(origen: string): DotePendienteState[] {
        const totalRaza = Math.max(0, this.toNumber(this.razaSeleccionada?.Dgs_adicionales?.Dotes_extra));
        const nuevas = Math.max(0, totalRaza - this.dotesExtraRazaConcedidas);
        if (nuevas < 1)
            return [];
        const origenNormalizado = `${origen ?? ''}`.trim() || `${this.razaSeleccionada?.Nombre ?? 'Raza'}`;
        const creadas = Array.from({ length: nuevas }, () =>
            this.crearDotePendiente('raza_dg', origenNormalizado, null)
        );
        this.dotesPendientes = [
            ...this.dotesPendientes,
            ...creadas,
        ];
        this.dotesExtraRazaConcedidas += nuevas;
        return creadas.map((item) => ({ ...item }));
    }

    registrarDotesPendientesPorEspeciales(especiales: ClaseEspecialNivel[], origen: string): DotePendienteState[] {
        const listaEspeciales = Array.isArray(especiales) ? especiales : [];
        const origenNormalizado = `${origen ?? ''}`.trim() || 'Especial de clase';
        const creadas: DotePendienteState[] = [];

        listaEspeciales.forEach((especialNivel) => {
            const especial = (especialNivel?.Especial ?? {}) as Record<string, any>;
            const nombreEspecial = this.normalizarTexto(`${especial?.['Nombre'] ?? especial?.['nombre'] ?? ''}`);
            if (nombreEspecial !== this.normalizarTexto('Dote adicional'))
                return;

            const extra = `${especialNivel?.Extra ?? ''}`.trim();
            const tipoPermitido = this.normalizarTexto(extra) === this.normalizarTexto('No aplica')
                || extra.length < 1
                ? null
                : extra;
            creadas.push(this.crearDotePendiente('adicional', origenNormalizado, tipoPermitido));
        });

        if (creadas.length < 1)
            return [];
        this.dotesPendientes = [
            ...this.dotesPendientes,
            ...creadas,
        ];
        return creadas.map((item) => ({ ...item }));
    }

    getDotesPendientes(): DotePendienteState[] {
        return this.dotesPendientes.map((item) => ({ ...item }));
    }

    getSiguienteDotePendiente(): DotePendienteState | null {
        const siguiente = this.dotesPendientes.find((pendiente) => pendiente.estado === 'pendiente') ?? null;
        return siguiente ? { ...siguiente } : null;
    }

    obtenerCandidatosDotePendiente(idPendiente: number): DoteSelectorCandidato[] {
        const pendiente = this.dotesPendientes.find((item) => this.toNumber(item?.id) === this.toNumber(idPendiente));
        if (!pendiente || pendiente.estado !== 'pendiente')
            return [];

        const candidatos = (this.catalogoDotes ?? [])
            .map((dote) => this.crearCandidatoDote(dote, pendiente))
            .filter((item) => !!item) as DoteSelectorCandidato[];

        return candidatos.sort((a, b) =>
            `${a?.dote?.Nombre ?? ''}`.localeCompare(`${b?.dote?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
        );
    }

    omitirDotePendiente(idPendiente: number): boolean {
        const id = this.toNumber(idPendiente);
        const pendiente = this.dotesPendientes.find((item) => this.toNumber(item?.id) === id);
        if (!pendiente || pendiente.estado !== 'pendiente')
            return false;
        pendiente.estado = 'omitida';
        return true;
    }

    aplicarDotePendiente(idPendiente: number, seleccion: DoteSeleccionConfirmada): boolean {
        const pendiente = this.dotesPendientes.find((item) => this.toNumber(item?.id) === this.toNumber(idPendiente));
        if (!pendiente || pendiente.estado !== 'pendiente')
            return false;

        const idDote = this.toNumber(seleccion?.idDote);
        if (idDote <= 0)
            return false;
        const dote = (this.catalogoDotes ?? []).find((item) => this.toNumber(item?.Id) === idDote);
        if (!dote)
            return false;

        const idExtraSeleccion = Math.max(0, this.toNumber(seleccion?.idExtra));
        const extraSeleccion = `${seleccion?.extra ?? ''}`.trim();
        const candidato = this.crearCandidatoDote(dote, pendiente, idExtraSeleccion, extraSeleccion);
        if (!candidato || candidato.restringidaPorTipo || !candidato.repeticionValida)
            return false;
        if (candidato.evaluacion.estado !== 'eligible')
            return false;

        const requiereExtra = candidato.requiereExtra;
        const idExtra = requiereExtra ? idExtraSeleccion : 0;
        if (requiereExtra && idExtra <= 0)
            return false;
        if (requiereExtra && !candidato.extrasDisponibles.some((extra) => this.toNumber(extra?.Id) === idExtra))
            return false;

        const extraTexto = this.resolverExtraTextoDote(dote, idExtra, extraSeleccion);
        if (requiereExtra && this.normalizarTexto(extraTexto).length < 1)
            return false;

        const origen = this.construirOrigenDoteDesdePendiente(pendiente);
        const agregado = this.agregarDoteAlPersonaje(dote, origen, idExtra, extraTexto);
        if (!agregado)
            return false;

        this.aplicarModificadoresDote(dote, origen, idExtra, extraTexto);
        this.recalcularDerivadasPorCaracteristicas();
        this.recalcularDerivadasPorCombate();
        pendiente.estado = 'resuelta';
        return true;
    }

    contarSeleccionesEnemigoPredilectoPorEspeciales(especiales: ClaseEspecialNivel[]): number {
        const listaEspeciales = Array.isArray(especiales) ? especiales : [];
        return listaEspeciales.reduce((total, especialNivel) => {
            if (!this.esEspecialEnemigoPredilecto(especialNivel))
                return total;
            return total + 1;
        }, 0);
    }

    getEstadoCuposFamiliarEspecial47(): EstadoCuposFamiliar {
        return resolverEstadoCuposFamiliarEspecial47(this.personajeCreacion, this.catalogoClases);
    }

    getEstadoCuposCompaneroEspecial29(): EstadoCuposCompanero {
        return resolverEstadoCuposCompaneroEspecial29(this.personajeCreacion, this.catalogoClases);
    }

    tieneCompaneroPendienteSinSelector(): boolean {
        return this.getEstadoCuposCompaneroEspecial29().cuposDisponibles > 0;
    }

    registrarFamiliarSeleccionado(
        familiar: FamiliarMonstruoDetalle | null | undefined,
        plantillaSeleccionada: FamiliarPlantillaId,
        nombresEspecialesPorId: Record<number, string> = {},
        nombrePersonalizado: string = ''
    ): RegistroFamiliarResultado {
        const estado = this.getEstadoCuposFamiliarEspecial47();
        if (estado.cuposDisponibles < 1) {
            return {
                registrado: false,
                razon: 'No hay cupos disponibles de familiar',
                dote17Agregada: false,
                especialesAgregadosIds: [],
            };
        }

        const idFamiliar = this.toNumber(familiar?.Id_familiar);
        if (idFamiliar <= 0 || !familiar) {
            return {
                registrado: false,
                razon: 'Familiar inválido',
                dote17Agregada: false,
                especialesAgregadosIds: [],
            };
        }

        const plantillaId = Math.max(1, Math.min(5, this.toNumber(plantillaSeleccionada))) as FamiliarPlantillaId;
        const yaExiste = (this.personajeCreacion.Familiares ?? []).some((item) =>
            this.toNumber(item?.Id_familiar) === idFamiliar
            && this.toNumber(item?.Plantilla?.Id) === plantillaId
        );
        if (yaExiste) {
            return {
                registrado: false,
                razon: 'Ese familiar con la misma plantilla ya está seleccionado',
                dote17Agregada: false,
                especialesAgregadosIds: [],
            };
        }

        const familiarGuardar = this.clonarFamiliarParaPersonaje(familiar, plantillaId, nombrePersonalizado);
        this.personajeCreacion.Familiares = [
            ...(this.personajeCreacion.Familiares ?? []),
            familiarGuardar,
        ];

        const dote17Agregada = this.asegurarDoteFamiliar17();
        const especialesAgregadosIds: number[] = [];
        ESPECIALES_BONUS_FAMILIAR_FIJOS.forEach((idEspecial) => {
            if (this.asegurarEspecialFamiliar(idEspecial, nombresEspecialesPorId))
                especialesAgregadosIds.push(idEspecial);
        });

        const nivelLanzador = Math.max(0, this.toNumber(estado.nivelLanzadorFamiliar));
        if (this.debeAgregarEspecialFamiliar83(plantillaId, nivelLanzador)
            && this.asegurarEspecialFamiliar(ESPECIAL_BONUS_FAMILIAR_MENSAJERO, nombresEspecialesPorId)) {
            especialesAgregadosIds.push(ESPECIAL_BONUS_FAMILIAR_MENSAJERO);
        }
        if (this.debeAgregarEspecialFamiliar87(plantillaId, nivelLanzador)
            && this.asegurarEspecialFamiliar(ESPECIAL_BONUS_FAMILIAR_HECHIZO, nombresEspecialesPorId)) {
            especialesAgregadosIds.push(ESPECIAL_BONUS_FAMILIAR_HECHIZO);
        }

        this.recalcularDerivadasPorCaracteristicas();
        this.recalcularDerivadasPorCombate();

        return {
            registrado: true,
            familiarAgregado: familiarGuardar,
            dote17Agregada,
            especialesAgregadosIds,
        };
    }

    registrarCompaneroSeleccionado(
        companero: CompaneroMonstruoDetalle | null | undefined,
        plantillaSeleccionada: CompaneroPlantillaSelector,
        nombresEspecialesPorId: Record<number, string> = {},
        nombrePersonalizado: string = ''
    ): RegistroCompaneroResultado {
        const estado = this.getEstadoCuposCompaneroEspecial29();
        if (estado.cuposDisponibles < 1) {
            return {
                registrado: false,
                razon: 'No hay cupos disponibles de compañero animal',
                dote49Agregada: false,
                especialesAgregadosIds: [],
                bonosAplicados: {
                    dgAdi: 0,
                    trucosAdi: 0,
                    bonoFueDes: 0,
                    bonoArmaduraNatural: 0,
                },
            };
        }

        const idCompanero = this.toNumber(companero?.Id_companero);
        if (idCompanero <= 0 || !companero) {
            return {
                registrado: false,
                razon: 'Compañero inválido',
                dote49Agregada: false,
                especialesAgregadosIds: [],
                bonosAplicados: {
                    dgAdi: 0,
                    trucosAdi: 0,
                    bonoFueDes: 0,
                    bonoArmaduraNatural: 0,
                },
            };
        }

        const plantilla = this.normalizarPlantillaCompanero(plantillaSeleccionada);
        if (plantilla === 'elevado' && !this.personajeTieneDotePorId(DOTE_COMPANERO_ELEVADO_ID)) {
            return {
                registrado: false,
                razon: 'Falta la dote requerida para plantilla elevado',
                dote49Agregada: false,
                especialesAgregadosIds: [],
                bonosAplicados: {
                    dgAdi: 0,
                    trucosAdi: 0,
                    bonoFueDes: 0,
                    bonoArmaduraNatural: 0,
                },
            };
        }
        if (plantilla === 'sabandija' && !this.personajeTieneDotePorId(DOTE_COMPANERO_SABANDIJA_ID)) {
            return {
                registrado: false,
                razon: 'Falta la dote requerida para plantilla sabandija',
                dote49Agregada: false,
                especialesAgregadosIds: [],
                bonosAplicados: {
                    dgAdi: 0,
                    trucosAdi: 0,
                    bonoFueDes: 0,
                    bonoArmaduraNatural: 0,
                },
            };
        }

        const idPlantilla = getPlantillaIdCompanero(plantilla);
        const yaExiste = (this.personajeCreacion.Companeros ?? []).some((item) =>
            this.toNumber(item?.Id_companero) === idCompanero
            && this.toNumber(item?.Plantilla?.Id) === idPlantilla
        );
        if (yaExiste) {
            return {
                registrado: false,
                razon: 'Ese compañero con la misma plantilla ya está seleccionado',
                dote49Agregada: false,
                especialesAgregadosIds: [],
                bonosAplicados: {
                    dgAdi: 0,
                    trucosAdi: 0,
                    bonoFueDes: 0,
                    bonoArmaduraNatural: 0,
                },
            };
        }

        const escala = this.calcularEscalaCompanero(Math.max(0, this.toNumber(estado?.nivelEfectivoCompanero)));
        const companeroGuardar = this.clonarCompaneroParaPersonaje(companero, plantilla, nombrePersonalizado, escala);
        this.personajeCreacion.Companeros = [
            ...(this.personajeCreacion.Companeros ?? []),
            companeroGuardar,
        ];

        const especialesAgregadosIds: number[] = [];
        ESPECIALES_BONUS_COMPANERO_PERSONAJE.forEach((idEspecial) => {
            if (this.asegurarEspecialPersonajeCompanero(idEspecial, nombresEspecialesPorId))
                especialesAgregadosIds.push(idEspecial);
        });

        const nivelEfectivo = Math.max(0, this.toNumber(estado?.nivelEfectivoCompanero));
        if (nivelEfectivo >= 6 && this.asegurarEspecialCompanero(companeroGuardar, ESPECIAL_BONUS_COMPANERO_AVANZADO, nombresEspecialesPorId))
            especialesAgregadosIds.push(ESPECIAL_BONUS_COMPANERO_AVANZADO);
        if (nivelEfectivo >= 15 && this.asegurarEspecialCompanero(companeroGuardar, ESPECIAL_BONUS_COMPANERO_MAESTRO, nombresEspecialesPorId))
            especialesAgregadosIds.push(ESPECIAL_BONUS_COMPANERO_MAESTRO);

        const dote49Agregada = nivelEfectivo >= 9
            ? this.asegurarDoteCompanero(companeroGuardar, DOTE_COMPANERO_BONUS_ID)
            : false;

        this.recalcularDerivadasPorCaracteristicas();
        this.recalcularDerivadasPorCombate();

        return {
            registrado: true,
            companeroAgregado: companeroGuardar,
            dote49Agregada,
            especialesAgregadosIds,
            bonosAplicados: {
                dgAdi: escala.dgAdi,
                trucosAdi: escala.trucosAdi,
                bonoFueDes: escala.bonoFueDes,
                bonoArmaduraNatural: escala.bonoArmaduraNatural,
            },
        };
    }

    getEnemigosPredilectos(): EnemigoPredilectoSeleccion[] {
        const lista = Array.isArray(this.personajeCreacion?.enemigosPredilectos)
            ? this.personajeCreacion.enemigosPredilectos
            : [];
        return lista.map((item) => ({
            id: this.toNumber(item?.id),
            nombre: `${item?.nombre ?? ''}`.trim(),
            bono: this.toNumber(item?.bono),
            veces: this.toNumber(item?.veces),
        }));
    }

    aplicarSeleccionEnemigoPredilecto(enemigo: EnemigoPredilectoDetalle | null | undefined): boolean {
        const id = this.toNumber(enemigo?.Id);
        const nombre = `${enemigo?.Nombre ?? ''}`.trim();
        if (id <= 0 || nombre.length < 1)
            return false;

        const actuales = this.getEnemigosPredilectos();
        this.personajeCreacion.enemigosPredilectos = this.mergeEnemigoPredilectoSeleccion(
            actuales,
            { Id: id, Nombre: nombre }
        );
        return true;
    }

    mergeEnemigoPredilectoSeleccion(
        actuales: EnemigoPredilectoSeleccion[],
        enemigo: EnemigoPredilectoDetalle
    ): EnemigoPredilectoSeleccion[] {
        const id = this.toNumber(enemigo?.Id);
        const nombre = `${enemigo?.Nombre ?? ''}`.trim();
        if (id <= 0 || nombre.length < 1)
            return Array.isArray(actuales) ? [...actuales] : [];

        const lista = Array.isArray(actuales)
            ? actuales.map((item) => ({
                id: this.toNumber(item?.id),
                nombre: `${item?.nombre ?? ''}`.trim(),
                bono: Math.max(0, this.toNumber(item?.bono)),
                veces: Math.max(0, this.toNumber(item?.veces)),
            }))
            : [];
        const existente = lista.find((item) => this.toNumber(item?.id) === id);
        if (!existente) {
            lista.push({
                id,
                nombre,
                bono: 2,
                veces: 1,
            });
            return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        }

        existente.nombre = nombre;
        existente.bono = Math.max(0, this.toNumber(existente.bono)) + 2;
        existente.veces = Math.max(0, this.toNumber(existente.veces)) + 1;
        return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private crearDotePendiente(
        fuente: DoteFuentePendiente,
        origen: string,
        tipoPermitido: string | null
    ): DotePendienteState {
        const tipoNormalizado = `${tipoPermitido ?? ''}`.trim();
        return {
            id: this.secuenciaDotePendiente++,
            fuente,
            origen: `${origen ?? ''}`.trim(),
            tipoPermitido: tipoNormalizado.length > 0 ? tipoNormalizado : null,
            estado: 'pendiente',
        };
    }

    private normalizarCatalogoExtras(
        catalogo: Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }> | null | undefined
    ): Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }> {
        const lista = Array.isArray(catalogo)
            ? catalogo
            : (catalogo && typeof catalogo === 'object' ? Object.values(catalogo as any) : []);
        const seen = new Set<string>();
        const normalizado = lista
            .map((item: any) => ({
                Id: this.toNumber(item?.Id ?? item?.id ?? item?.Id_habilidad ?? item?.IdHabilidad),
                Nombre: `${item?.Nombre ?? item?.nombre ?? ''}`.trim(),
                Es_escudo: this.toBooleanValue(item?.Es_escudo),
            }))
            .filter((item) => item.Id > 0 || this.normalizarTexto(item.Nombre).length > 0)
            .filter((item) => {
                const clave = item.Id > 0
                    ? `id:${item.Id}`
                    : `nombre:${this.normalizarTexto(item.Nombre)}`;
                if (seen.has(clave))
                    return false;
                seen.add(clave);
                return true;
            });

        return normalizado.sort((a, b) =>
            `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' })
        );
    }

    private doteSoportaArmaduras(dote: Dote | null | undefined): boolean {
        return this.toBooleanValue(
            dote?.Extras_soportados?.Extra_armadura_armaduras ?? dote?.Extras_soportados?.Extra_armadura
        );
    }

    private doteSoportaEscudos(dote: Dote | null | undefined): boolean {
        return this.toBooleanValue(
            dote?.Extras_soportados?.Extra_armadura_escudos ?? dote?.Extras_soportados?.Extra_armadura
        );
    }

    private doteTieneExtrasSoportados(dote: Dote | null | undefined): boolean {
        return !!(
            this.toBooleanValue(dote?.Extras_soportados?.Extra_arma)
            || this.doteSoportaArmaduras(dote)
            || this.doteSoportaEscudos(dote)
            || this.toBooleanValue(dote?.Extras_soportados?.Extra_escuela)
            || this.toBooleanValue(dote?.Extras_soportados?.Extra_habilidad)
        );
    }

    private filtrarExtrasArmaduraPorSoporte(
        dote: Dote,
        extras: Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }>
    ): Array<{ Id: number; Nombre: string; Es_escudo?: boolean; }> {
        if (this.doteSoportaArmaduras(dote) && this.doteSoportaEscudos(dote))
            return extras;
        if (this.doteSoportaEscudos(dote))
            return extras.filter((item) => item.Es_escudo === true);
        if (this.doteSoportaArmaduras(dote))
            return extras.filter((item) => item.Es_escudo !== true);
        return [];
    }

    private crearCandidatoDote(
        dote: Dote,
        pendiente: DotePendienteState,
        idExtraSeleccionado: number = 0,
        extraSeleccionado: string = ''
    ): DoteSelectorCandidato | null {
        if (!dote || !pendiente)
            return null;

        const restringidaPorTipo = !this.cumpleRestriccionTipoDote(dote, pendiente.tipoPermitido);
        const requiereExtra = this.doteTieneExtrasSoportados(dote);
        const extrasBase = this.resolverExtrasDisponiblesDote(dote);
        const extrasDisponibles = this.filtrarExtrasPorRepeticionDote(dote, extrasBase);

        if (requiereExtra && extrasDisponibles.length < 1) {
            return {
                dote,
                restringidaPorTipo,
                requiereExtra,
                extrasDisponibles: [],
                repeticionValida: false,
                evaluacion: {
                    estado: 'blocked_failed',
                    razones: ['No hay extras válidos disponibles para esta dote'],
                    advertencias: [],
                },
            };
        }

        if (!requiereExtra) {
            const repeticionValida = this.validarRepeticionDote(dote, 0, '');
            const evaluacion = this.evaluarPrerrequisitosDote(dote, 0, '');
            return {
                dote,
                restringidaPorTipo,
                requiereExtra,
                extrasDisponibles: [],
                repeticionValida,
                evaluacion,
            };
        }

        const idExtra = Math.max(0, this.toNumber(idExtraSeleccionado));
        const extraTexto = `${extraSeleccionado ?? ''}`.trim();
        if (idExtra > 0) {
            const extra = extrasDisponibles.find((item) => this.toNumber(item?.Id) === idExtra);
            const extraNombre = `${extra?.Nombre ?? extraTexto}`.trim();
            const repeticionValida = this.validarRepeticionDote(dote, idExtra, extraNombre);
            const evaluacion = this.evaluarPrerrequisitosDote(dote, idExtra, extraNombre);
            return {
                dote,
                restringidaPorTipo,
                requiereExtra,
                extrasDisponibles,
                repeticionValida,
                evaluacion,
            };
        }

        let hayElegible = false;
        let hayUnknown = false;
        const razones: string[] = [];
        const advertencias: string[] = [];
        extrasDisponibles.forEach((extra) => {
            const id = this.toNumber(extra?.Id);
            const nombre = `${extra?.Nombre ?? ''}`.trim();
            const repeticionValida = this.validarRepeticionDote(dote, id, nombre);
            const evaluacion = this.evaluarPrerrequisitosDote(dote, id, nombre);
            if (repeticionValida && evaluacion.estado === 'eligible')
                hayElegible = true;
            if (evaluacion.estado === 'blocked_unknown')
                hayUnknown = true;
            razones.push(...(evaluacion.razones ?? []));
            advertencias.push(...(evaluacion.advertencias ?? []));
        });

        return {
            dote,
            restringidaPorTipo,
            requiereExtra,
            extrasDisponibles,
            repeticionValida: hayElegible,
            evaluacion: hayElegible
                ? {
                    estado: 'eligible',
                    razones: [],
                    advertencias: Array.from(new Set(advertencias)),
                }
                : {
                    estado: hayUnknown ? 'blocked_unknown' : 'blocked_failed',
                    razones: Array.from(new Set(razones)),
                    advertencias: Array.from(new Set(advertencias)),
                },
        };
    }

    private cumpleRestriccionTipoDote(dote: Dote, tipoPermitido: string | null): boolean {
        const tipoNorm = this.normalizarTexto(`${tipoPermitido ?? ''}`);
        if (tipoNorm.length < 1)
            return true;
        const tipos = Array.isArray(dote?.Tipos) ? dote.Tipos : [];
        return tipos.some((tipo) => this.normalizarTexto(`${tipo?.Nombre ?? ''}`) === tipoNorm);
    }

    private resolverExtrasDisponiblesDote(dote: Dote): DoteExtraOpcion[] {
        const fuenteHabilidades = (this.estadoFlujo.ventajas.catalogoHabilidades ?? [])
            .map((habilidad) => ({
                Id: this.toNumber(habilidad?.Id_habilidad),
                Nombre: `${habilidad?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.Id > 0 && item.Nombre.length > 0);

        const normalizar = (items: DoteExtraItem[] | null | undefined): DoteExtraOpcion[] =>
            this.normalizarCatalogoExtras(items as Array<{ Id: number; Nombre: string; }>);
        const contieneElegir = (items: DoteExtraOpcion[]): boolean =>
            items.some((item) => this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto('Elegir'));

        const extras: DoteExtraOpcion[] = [];
        if (this.toBooleanValue(dote?.Extras_soportados?.Extra_arma)) {
            const directos = normalizar(dote?.Extras_disponibles?.Armas ?? []);
            const usarCatalogo = directos.length < 1 || contieneElegir(directos);
            extras.push(...(usarCatalogo ? this.catalogoArmasDotes : directos));
        }
        if (this.doteSoportaArmaduras(dote) || this.doteSoportaEscudos(dote)) {
            const directos = this.filtrarExtrasArmaduraPorSoporte(dote, normalizar(dote?.Extras_disponibles?.Armaduras ?? []));
            const usarCatalogo = directos.length < 1 || contieneElegir(directos);
            const catalogo = this.filtrarExtrasArmaduraPorSoporte(dote, this.catalogoArmadurasDotes);
            extras.push(...(usarCatalogo ? catalogo : directos));
        }
        if (this.toBooleanValue(dote?.Extras_soportados?.Extra_escuela)) {
            const directos = normalizar(dote?.Extras_disponibles?.Escuelas ?? []);
            const usarCatalogo = directos.length < 1 || contieneElegir(directos);
            extras.push(...(usarCatalogo ? this.catalogoEscuelasDotes : directos));
        }
        if (this.toBooleanValue(dote?.Extras_soportados?.Extra_habilidad)) {
            const directos = normalizar(dote?.Extras_disponibles?.Habilidades ?? []);
            const usarCatalogo = directos.length < 1 || contieneElegir(directos);
            extras.push(...(usarCatalogo ? fuenteHabilidades : directos));
        }

        return this.normalizarCatalogoExtras(extras);
    }

    private filtrarExtrasPorRepeticionDote(dote: Dote, extras: DoteExtraOpcion[]): DoteExtraOpcion[] {
        if (!this.toBooleanValue(dote?.Repetible_distinto_extra))
            return extras;

        const doteNorm = this.normalizarTexto(`${dote?.Nombre ?? ''}`);
        const idDote = this.toNumber(dote?.Id);
        const usadosId = new Set<number>();
        const usadosNombre = new Set<string>();

        (this.personajeCreacion.DotesContextuales ?? [])
            .filter((item) => {
                const idActual = this.toNumber(item?.Dote?.Id);
                const nombreActual = this.normalizarTexto(item?.Dote?.Nombre ?? '');
                return (idDote > 0 && idActual === idDote) || (doteNorm.length > 0 && nombreActual === doteNorm);
            })
            .forEach((item) => {
                const idExtra = this.toNumber(item?.Contexto?.Id_extra);
                if (idExtra > 0)
                    usadosId.add(idExtra);
                const extra = this.normalizarTexto(item?.Contexto?.Extra ?? '');
                if (extra.length > 0)
                    usadosNombre.add(extra);
            });

        return extras.filter((extra) => {
            const id = this.toNumber(extra?.Id);
            const nombreNorm = this.normalizarTexto(extra?.Nombre ?? '');
            if (id > 0 && usadosId.has(id))
                return false;
            if (nombreNorm.length > 0 && usadosNombre.has(nombreNorm))
                return false;
            return true;
        });
    }

    private validarRepeticionDote(dote: Dote, idExtra: number, extraTexto: string): boolean {
        const idDote = this.toNumber(dote?.Id);
        const nombreNorm = this.normalizarTexto(`${dote?.Nombre ?? ''}`);
        const repetibleDistintoExtra = this.toBooleanValue(dote?.Repetible_distinto_extra) && this.doteTieneExtrasSoportados(dote);
        const contextuales = (this.personajeCreacion.DotesContextuales ?? []).filter((item) => {
            const id = this.toNumber(item?.Dote?.Id);
            const nombre = this.normalizarTexto(item?.Dote?.Nombre ?? '');
            return (idDote > 0 && id === idDote) || (nombreNorm.length > 0 && nombre === nombreNorm);
        });

        const legacy = (this.personajeCreacion.Dotes ?? []).filter((item) =>
            this.normalizarTexto(item?.Nombre ?? '') === nombreNorm
        );
        const yaExiste = contextuales.length > 0 || legacy.length > 0;

        if (!yaExiste)
            return true;

        if (repetibleDistintoExtra) {
            const idExtraNorm = Math.max(0, this.toNumber(idExtra));
            const extraNorm = this.normalizarTexto(extraTexto ?? '');
            if (idExtraNorm <= 0 && extraNorm.length < 1)
                return false;

            const repetidaContextual = contextuales.some((item) => {
                const existenteIdExtra = this.toNumber(item?.Contexto?.Id_extra);
                const existenteExtraNorm = this.normalizarTexto(item?.Contexto?.Extra ?? '');
                if (idExtraNorm > 0 && existenteIdExtra > 0)
                    return existenteIdExtra === idExtraNorm;
                if (extraNorm.length > 0 && existenteExtraNorm.length > 0)
                    return existenteExtraNorm === extraNorm;
                return existenteIdExtra === idExtraNorm;
            });
            const repetidaLegacy = legacy.some((item) =>
                this.normalizarTexto(item?.Extra ?? '') === extraNorm
            );
            return !repetidaContextual && !repetidaLegacy;
        }

        if (this.toBooleanValue(dote?.Repetible))
            return true;

        return false;
    }

    private evaluarPrerrequisitosDote(dote: Dote, idExtra: number, extraTexto: string): DoteEvaluacionResultado {
        const identidad = buildIdentidadPrerrequisitos(
            this.razaSeleccionada,
            this.razaBaseSeleccionadaCompleta,
            this.personajeCreacion.Subtipos
        );

        const nivelesClase = (this.personajeCreacion.desgloseClases ?? []).map((clase) => {
            const nombre = `${clase?.Nombre ?? ''}`.trim();
            const idClase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            return {
                id: this.toNumber(idClase?.Id) > 0 ? this.toNumber(idClase?.Id) : null,
                nombre,
                nivel: Math.max(0, this.toNumber(clase?.Nivel)),
            };
        }).filter((item) => item.nombre.length > 0);

        const dotes = (this.personajeCreacion.DotesContextuales ?? [])
            .map((item) => ({
                id: this.toNumber(item?.Dote?.Id) > 0 ? this.toNumber(item?.Dote?.Id) : null,
                nombre: `${item?.Dote?.Nombre ?? ''}`.trim(),
                idExtra: this.toNumber(item?.Contexto?.Id_extra),
                extra: `${item?.Contexto?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const legacySinContexto = (this.personajeCreacion.Dotes ?? [])
            .filter((item) => {
                const nombre = this.normalizarTexto(item?.Nombre ?? '');
                return !dotes.some((ctxDote) => this.normalizarTexto(ctxDote.nombre) === nombre);
            })
            .map((item) => ({
                id: null,
                nombre: `${item?.Nombre ?? ''}`.trim(),
                idExtra: 0,
                extra: `${item?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const claseas = (this.personajeCreacion.Claseas ?? [])
            .map((item) => ({
                id: this.toNumber((item as any)?.Id) > 0 ? this.toNumber((item as any)?.Id) : null,
                nombre: `${item?.Nombre ?? ''}`.trim(),
                idExtra: this.toNumber((item as any)?.Id_extra) > 0 ? this.toNumber((item as any)?.Id_extra) : null,
                extra: `${(item as any)?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const idiomas = (this.personajeCreacion.Idiomas ?? [])
            .map((idioma) => ({
                id: this.resolverIdIdiomaPorNombre(`${idioma?.Nombre ?? ''}`),
                nombre: `${idioma?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const dominios = (this.personajeCreacion.Dominios ?? [])
            .map((item) => {
                const nombre = `${item?.Nombre ?? ''}`.trim();
                if (nombre.length < 1)
                    return null;
                return {
                    id: this.resolverIdDominioPorNombre(nombre),
                    nombre,
                };
            })
            .filter((item): item is { id: number | null; nombre: string; } => !!item);

        const habilidades = (this.personajeCreacion.Habilidades ?? [])
            .map((habilidad) => ({
                id: this.toNumber(habilidad?.Id) > 0 ? this.toNumber(habilidad?.Id) : null,
                nombre: `${habilidad?.Nombre ?? ''}`.trim(),
                rangos: this.toNumber(habilidad?.Rangos),
                extra: `${habilidad?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const conjuros = (this.personajeCreacion.Conjuros ?? [])
            .map((conjuro) => ({
                id: this.toNumber(conjuro?.Id) > 0 ? this.toNumber(conjuro?.Id) : null,
                nombre: `${conjuro?.Nombre ?? ''}`.trim(),
                idEscuela: this.toNumber(conjuro?.Escuela?.Id) > 0 ? this.toNumber(conjuro?.Escuela?.Id) : null,
                escuela: `${conjuro?.Escuela?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const catalogoIdiomas = (this.estadoFlujo.ventajas.catalogoIdiomas ?? [])
            .map((idioma) => ({
                id: this.toNumber(idioma?.Id) > 0 ? this.toNumber(idioma?.Id) : null,
                nombre: `${idioma?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoHabilidades = [
            ...(this.estadoFlujo.ventajas.catalogoHabilidades ?? []),
            ...(this.estadoFlujo.ventajas.catalogoHabilidadesCustom ?? []),
        ]
            .map((habilidad) => ({
                id: this.toNumber(habilidad?.Id_habilidad) > 0 ? this.toNumber(habilidad?.Id_habilidad) : null,
                nombre: `${habilidad?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoClases = (this.catalogoClases ?? [])
            .map((clase) => ({
                id: this.toNumber(clase?.Id) > 0 ? this.toNumber(clase?.Id) : null,
                nombre: `${clase?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoDotes = (this.catalogoDotes ?? [])
            .map((doteCatalogo) => ({
                id: this.toNumber(doteCatalogo?.Id) > 0 ? this.toNumber(doteCatalogo?.Id) : null,
                nombre: `${doteCatalogo?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoRegiones = (this.catalogoRegiones ?? [])
            .map((regionCatalogo) => ({
                id: this.toNumber(regionCatalogo?.Id) > 0 ? this.toNumber(regionCatalogo?.Id) : null,
                nombre: `${regionCatalogo?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoDotesRaw = this.catalogoDotes ?? [];

        const tiposDote = (() => {
            const resultado: { id: number | null; nombre: string; }[] = [];
            const ids = new Set<number>();
            const nombres = new Set<string>();
            const registrar = (tipo: any) => {
                const id = this.toNumber(tipo?.Id) > 0 ? this.toNumber(tipo?.Id) : null;
                const nombre = `${tipo?.Nombre ?? ''}`.trim();
                const nombreNorm = this.normalizarTexto(nombre);
                if (id === null && nombreNorm.length < 1)
                    return;
                if (id !== null) {
                    if (ids.has(id))
                        return;
                    ids.add(id);
                    resultado.push({ id, nombre });
                    return;
                }
                if (nombres.has(nombreNorm))
                    return;
                nombres.add(nombreNorm);
                resultado.push({ id: null, nombre });
            };
            const buscarCatalogo = (idDote: number, nombreDote: string) => {
                const nombreNorm = this.normalizarTexto(nombreDote);
                return catalogoDotesRaw.find((item) =>
                    (idDote > 0 && this.toNumber(item?.Id) === idDote)
                    || (nombreNorm.length > 0 && this.normalizarTexto(item?.Nombre ?? '') === nombreNorm)
                );
            };
            (this.personajeCreacion.DotesContextuales ?? []).forEach((item) => {
                const idDote = this.toNumber(item?.Dote?.Id);
                const nombreDote = `${item?.Dote?.Nombre ?? ''}`.trim();
                const doteCatalogo = buscarCatalogo(idDote, nombreDote);
                (item?.Dote?.Tipos ?? doteCatalogo?.Tipos ?? []).forEach((tipo: any) => registrar(tipo));
            });
            legacySinContexto.forEach((item) => {
                const doteCatalogo = buscarCatalogo(this.toNumber(item?.id), item?.nombre ?? '');
                (doteCatalogo?.Tipos ?? []).forEach((tipo: any) => registrar(tipo));
            });
            return resultado;
        })();

        const regionRaw = (this.personajeCreacion as any)?.Region ?? (this.personajeCreacion as any)?.region ?? null;
        const regionIdRaw = (regionRaw as any)?.Id
            ?? (regionRaw as any)?.id
            ?? (this.personajeCreacion as any)?.Id_region
            ?? (this.personajeCreacion as any)?.id_region;
        const regionIdTieneDato = regionIdRaw !== null && regionIdRaw !== undefined && `${regionIdRaw}`.trim().length > 0;
        const regionId = this.toNumber(
            (regionRaw as any)?.Id
            ?? (regionRaw as any)?.id
            ?? (this.personajeCreacion as any)?.Id_region
            ?? (this.personajeCreacion as any)?.id_region
        );
        const regionNombreRaw = `${(regionRaw as any)?.Nombre ?? (regionRaw as any)?.nombre ?? (typeof regionRaw === 'string' ? regionRaw : '') ?? ''}`.trim();
        const regionIdResuelto = regionId > 0 ? regionId : this.toNumber(this.resolverIdRegionPorNombre(regionNombreRaw));
        const regionIdContexto = regionIdResuelto > 0
            ? regionIdResuelto
            : (regionIdTieneDato && regionId === 0 ? 0 : null);
        const regionNombre = regionNombreRaw.length > 0
            ? regionNombreRaw
            : (regionIdContexto === 0 ? 'Sin región' : this.resolverNombreRegionPorId(regionIdResuelto));
        const nombreEscuelaEspecialista = `${this.personajeCreacion?.Escuela_especialista?.Nombre ?? ''}`.trim();
        const nivelTotal = nivelesClase.reduce((acc, clase) => acc + Math.max(0, this.toNumber(clase?.nivel)), 0);
        const nivelLanzadorArcano = this.resolverNivelLanzadorMaximoPorTipo('arcano');
        const nivelLanzadorDivino = this.resolverNivelLanzadorMaximoPorTipo('divino');
        const nivelLanzadorPsionico = this.resolverNivelLanzadorMaximoPorTipo('psionico');

        const contexto: DoteEvaluacionContexto = {
            identidad,
            caracteristicas: {
                Fuerza: this.toNumber(this.personajeCreacion.Fuerza),
                Destreza: this.toNumber(this.personajeCreacion.Destreza),
                Constitucion: this.toNumber(this.personajeCreacion.Constitucion),
                Inteligencia: this.toNumber(this.personajeCreacion.Inteligencia),
                Sabiduria: this.toNumber(this.personajeCreacion.Sabiduria),
                Carisma: this.toNumber(this.personajeCreacion.Carisma),
            },
            ataqueBase: this.extraerPrimerEnteroConSigno(this.personajeCreacion.Ataque_base),
            nivelesClase,
            dotes: [...dotes, ...legacySinContexto],
            claseas,
            dominios,
            idiomas,
            habilidades,
            conjuros,
            competenciasArmas: this.resolverCompetenciasArmasActuales(),
            competenciasArmaduras: this.resolverCompetenciasArmadurasActuales(),
            competenciasGrupoArmas: this.resolverCompetenciasGrupoArmasActuales(),
            competenciasGrupoArmaduras: this.resolverCompetenciasGrupoArmadurasActuales(),
            lanzador: {
                arcano: nivelLanzadorArcano,
                divino: nivelLanzadorDivino,
                psionico: nivelLanzadorPsionico,
            },
            nivelesConjuroMaximos: {
                arcano: this.resolverNivelConjuroMaximoPorTipo('arcano'),
                divino: this.resolverNivelConjuroMaximoPorTipo('divino'),
            },
            escuelaEspecialista: {
                id: this.resolverIdEscuelaPorNombre(nombreEscuelaEspecialista),
                nombre: nombreEscuelaEspecialista,
                nivelArcano: nivelLanzadorArcano,
            },
            dgTotal: this.resolverDgTotalActual(),
            nivelTotal,
            tamanoId: this.resolverTamanoActualId(),
            tipoCriaturaId: this.toNumber(this.personajeCreacion?.Tipo_criatura?.Id) > 0
                ? this.toNumber(this.personajeCreacion?.Tipo_criatura?.Id)
                : null,
            tipoCriaturaNombre: `${this.personajeCreacion?.Tipo_criatura?.Nombre ?? ''}`.trim(),
            tiposDote,
            region: {
                id: regionIdContexto,
                nombre: regionNombre,
            },
            salvaciones: this.resolverSalvacionesTotales(),
            alineamiento: `${this.personajeCreacion.Alineamiento ?? ''}`.trim(),
            puedeSeleccionarCompanero: this.tieneClaseaPorNombre('Compañero animal'),
            puedeSeleccionarFamiliar: this.tieneClaseaPorNombre('Convocar a un familiar') || this.tieneClaseaPorNombre('Familiar'),
            catalogoIdiomas,
            catalogoHabilidades,
            catalogoClases,
            catalogoDotes,
            catalogoRegiones,
        };

        const evaluacion = evaluarElegibilidadDote({
            dote,
            contexto,
            idExtraSeleccionado: Math.max(0, this.toNumber(idExtra)),
            extraSeleccionado: `${extraTexto ?? ''}`.trim(),
        });

        return {
            estado: evaluacion.estado,
            razones: [...(evaluacion.razones ?? [])],
            advertencias: [...(evaluacion.advertencias ?? [])],
        };
    }

    private resolverNivelLanzadorMaximoPorTipo(tipo: 'arcano' | 'divino' | 'psionico'): number {
        let maximo = 0;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const clase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            if (!clase || !this.esClaseLanzadora(clase))
                return;

            const tipoClase = this.resolverTipoLanzamientoClase(clase);
            const coincide = tipoClase === tipo || (tipoClase === 'mixto' && (tipo === 'arcano' || tipo === 'divino'));
            if (!coincide)
                return;
            maximo = Math.max(maximo, this.getNivelLanzadorEfectivoClase(nombre));
        });
        return Math.max(0, maximo);
    }

    private resolverNivelConjuroMaximoPorTipo(tipo: 'arcano' | 'divino'): number {
        let maximo = -1;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            const nivelActual = Math.max(0, this.toNumber(entrada?.Nivel));
            if (nombre.length < 1 || nivelActual < 1)
                return;

            const clase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            if (!clase)
                return;
            if (tipo === 'arcano' && !clase?.Conjuros?.Arcanos)
                return;
            if (tipo === 'divino' && !clase?.Conjuros?.Divinos)
                return;

            const detalleActual = this.obtenerDetalleNivelClase(clase, nivelActual);
            if (!detalleActual)
                return;
            const detallePrevio = nivelActual > 1 ? this.obtenerDetalleNivelClase(clase, nivelActual - 1) : null;
            const acceso = this.resolverAccesoConjurosPorTipo(clase, detalleActual, detallePrevio);
            const niveles = acceso.nivelesAccesibles;
            if (!niveles || niveles.size < 1)
                return;

            const maxClase = Array.from(niveles.values()).reduce((acc, nivel) => Math.max(acc, this.toNumber(nivel)), -1);
            maximo = Math.max(maximo, maxClase);
        });
        return Math.max(0, maximo);
    }

    private resolverNivelPoderPsionicoMaximo(): number {
        let maximo = -1;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            const nivelActual = Math.max(0, this.toNumber(entrada?.Nivel));
            if (nombre.length < 1 || nivelActual < 1)
                return;

            const clase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            if (!clase?.Conjuros?.Psionicos)
                return;

            const detalleActual = this.obtenerDetalleNivelClase(clase, nivelActual);
            if (!detalleActual)
                return;
            maximo = Math.max(
                maximo,
                Math.trunc(this.toNumber(detalleActual?.Nivel_max_poder_accesible_nivel_lanzadorPsionico))
            );
        });
        return Math.max(0, maximo);
    }

    private resolverReservaPsionicaActual(): number {
        let total = 0;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            const nivelActual = Math.max(0, this.toNumber(entrada?.Nivel));
            if (nombre.length < 1 || nivelActual < 1)
                return;

            const clase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            if (!clase?.Conjuros?.Psionicos)
                return;

            const detalleActual = this.obtenerDetalleNivelClase(clase, nivelActual);
            if (!detalleActual)
                return;
            total += Math.max(0, Math.trunc(this.toNumber(detalleActual?.Reserva_psionica)));
        });
        return Math.max(0, total);
    }

    private resolverDgTotalActual(): number {
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + Math.max(0, this.toNumber(clase?.Nivel)), 0);
        const dgsRaza = this.toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad ?? this.personajeCreacion?.Raza?.Dgs_adicionales?.Cantidad);
        return Math.max(0, Math.trunc(nivelClases + Math.max(0, dgsRaza)));
    }

    private resolverTamanoActualId(): number | null {
        const id = Math.trunc(this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Id));
        return id > 0 ? id : null;
    }

    private resolverIdEscuelaPorNombre(nombreEscuela: string): number | null {
        const nombreNorm = this.normalizarTexto(nombreEscuela);
        if (nombreNorm.length < 1)
            return null;
        const escuela = (this.catalogoEscuelasDotes ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = this.toNumber(escuela?.Id);
        return id > 0 ? id : null;
    }

    private resolverSalvacionesTotales(): { fortaleza: number; reflejos: number; voluntad: number; } {
        const fortaleza = this.toNumber(this.personajeCreacion.ModConstitucion)
            + (this.personajeCreacion.Salvaciones?.fortaleza?.modsClaseos ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0)
            + (this.personajeCreacion.Salvaciones?.fortaleza?.modsVarios ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0);
        const reflejos = this.toNumber(this.personajeCreacion.ModDestreza)
            + (this.personajeCreacion.Salvaciones?.reflejos?.modsClaseos ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0)
            + (this.personajeCreacion.Salvaciones?.reflejos?.modsVarios ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0);
        const voluntad = this.toNumber(this.personajeCreacion.ModSabiduria)
            + (this.personajeCreacion.Salvaciones?.voluntad?.modsClaseos ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0)
            + (this.personajeCreacion.Salvaciones?.voluntad?.modsVarios ?? []).reduce((acc, item) => acc + this.toNumber(item?.valor), 0);

        return {
            fortaleza,
            reflejos,
            voluntad,
        };
    }

    private resolverCompetenciasClaseActuales(
        fuente: keyof Clase['Competencias'],
        idKeys: string[],
        nombreKeys: string[]
    ): Array<{ id: number | null; nombre: string; }> {
        const competencias: Array<{ id: number | null; nombre: string; }> = [];
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const clase = this.catalogoClases.find((item) =>
                this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            );
            if (!clase)
                return;
            const referencias = Array.isArray(clase?.Competencias?.[fuente])
                ? (clase.Competencias[fuente] as Record<string, any>[])
                : [];
            referencias.forEach((ref: Record<string, any>) => {
                const id = idKeys.reduce((actual, key) => {
                    if (actual > 0)
                        return actual;
                    return this.toNumber(ref?.[key]);
                }, 0);
                const nombreRef = nombreKeys.reduce((actual, key) => {
                    if (actual.length > 0)
                        return actual;
                    return `${ref?.[key] ?? ''}`.trim();
                }, "");
                if (id <= 0 && nombreRef.length < 1)
                    return;
                competencias.push({
                    id: id > 0 ? id : null,
                    nombre: nombreRef,
                });
            });
        });

        return this.normalizarCatalogoExtras(
            competencias.map((item) => ({
                Id: this.toNumber(item.id),
                Nombre: `${item?.nombre ?? ''}`.trim(),
            }))
        ).map((item) => ({
            id: item.Id > 0 ? item.Id : null,
            nombre: item.Nombre,
        }));
    }

    private resolverCompetenciasDirectasPersonajeActuales(
        values: any,
        idKeys: string[],
        nombreKeys: string[]
    ): Array<{ id: number | null; nombre: string; }> {
        const entries = Array.isArray(values)
            ? values
            : (values && typeof values === 'object' ? Object.values(values) : []);
        return this.normalizarCatalogoExtras(
            entries.map((item: any) => ({
                Id: idKeys.reduce((acc, key) => acc > 0 ? acc : this.toNumber(item?.[key]), 0),
                Nombre: nombreKeys.reduce((acc, key) => acc.length > 0 ? acc : `${item?.[key] ?? ''}`.trim(), ''),
            }))
        ).map((item) => ({
            id: item.Id > 0 ? item.Id : null,
            nombre: item.Nombre,
        }));
    }

    private fusionarCompetenciasActuales(
        fromClase: Array<{ id: number | null; nombre: string; }>,
        fromPersonaje: Array<{ id: number | null; nombre: string; }>
    ): Array<{ id: number | null; nombre: string; }> {
        const resultado: Array<{ id: number | null; nombre: string; }> = [];
        const vistos = new Set<string>();

        [...fromClase, ...fromPersonaje].forEach((item) => {
            const id = this.toNumber(item?.id) > 0 ? this.toNumber(item?.id) : null;
            const nombre = `${item?.nombre ?? ''}`.trim();
            if (id === null && nombre.length < 1)
                return;

            const key = id !== null ? `id:${id}` : `nombre:${this.normalizarTexto(nombre)}`;
            if (vistos.has(key))
                return;
            vistos.add(key);
            resultado.push({ id, nombre });
        });

        return resultado;
    }

    private resolverCompetenciasArmasActuales(): Array<{ id: number | null; nombre: string; }> {
        return this.fusionarCompetenciasActuales(
            this.resolverCompetenciasClaseActuales(
                'Armas',
                ['Id', 'id', 'Id_arma', 'id_arma'],
                ['Nombre', 'nombre', 'Arma', 'arma']
            ),
            this.resolverCompetenciasDirectasPersonajeActuales(
                this.personajeCreacion?.competencia_arma,
                ['Id', 'id', 'Id_arma', 'id_arma'],
                ['Nombre', 'nombre', 'Arma', 'arma']
            )
        );
    }

    private resolverCompetenciasArmadurasActuales(): Array<{ id: number | null; nombre: string; }> {
        return this.fusionarCompetenciasActuales(
            this.resolverCompetenciasClaseActuales(
                'Armaduras',
                ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma'],
                ['Nombre', 'nombre', 'Armadura', 'armadura', 'Arma', 'arma']
            ),
            this.resolverCompetenciasDirectasPersonajeActuales(
                this.personajeCreacion?.competencia_armadura,
                ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma'],
                ['Nombre', 'nombre', 'Armadura', 'armadura', 'Arma', 'arma']
            )
        );
    }

    private resolverCompetenciasGrupoArmasActuales(): Array<{ id: number | null; nombre: string; }> {
        return this.fusionarCompetenciasActuales(
            this.resolverCompetenciasClaseActuales(
                'Grupos_arma',
                ['Id', 'id', 'Id_grupo', 'id_grupo'],
                ['Nombre', 'nombre', 'Grupo', 'grupo']
            ),
            this.resolverCompetenciasDirectasPersonajeActuales(
                this.personajeCreacion?.competencia_grupo_arma,
                ['Id', 'id', 'Id_grupo', 'id_grupo'],
                ['Nombre', 'nombre', 'Grupo', 'grupo']
            )
        );
    }

    private resolverCompetenciasGrupoArmadurasActuales(): Array<{ id: number | null; nombre: string; }> {
        return this.fusionarCompetenciasActuales(
            this.resolverCompetenciasClaseActuales(
                'Grupos_armadura',
                ['Id', 'id', 'Id_grupo', 'id_grupo'],
                ['Nombre', 'nombre', 'Grupo', 'grupo']
            ),
            this.resolverCompetenciasDirectasPersonajeActuales(
                this.personajeCreacion?.competencia_grupo_armadura,
                ['Id', 'id', 'Id_grupo', 'id_grupo'],
                ['Nombre', 'nombre', 'Grupo', 'grupo']
            )
        );
    }

    private tieneClaseaPorNombre(texto: string): boolean {
        const objetivo = this.normalizarTexto(`${texto ?? ''}`);
        if (objetivo.length < 1)
            return false;
        return (this.personajeCreacion.Claseas ?? []).some((especial) =>
            this.normalizarTexto(especial?.Nombre ?? '').includes(objetivo)
        );
    }

    private personajeTieneDotePorId(idDote: number): boolean {
        const id = this.toNumber(idDote);
        if (id <= 0)
            return false;
        if ((this.personajeCreacion.DotesContextuales ?? []).some((item) => this.toNumber(item?.Dote?.Id) === id))
            return true;
        return (this.personajeCreacion.Dotes ?? []).some((item) =>
            this.toNumber((item as any)?.Id) === id
        );
    }

    private clonarFamiliarParaPersonaje(
        familiar: FamiliarMonstruoDetalle,
        plantillaSeleccionada: FamiliarPlantillaId,
        nombrePersonalizado: string = ''
    ): FamiliarMonstruoDetalle {
        const nombrePlantillaOriginal = `${familiar?.Plantilla?.Nombre ?? ''}`.trim();
        const nombreVisible = `${nombrePersonalizado ?? ''}`.trim();
        return {
            ...familiar,
            Nombre: nombreVisible.length > 0 ? nombreVisible : `${familiar?.Nombre ?? ''}`.trim(),
            Plantilla: {
                Id: plantillaSeleccionada,
                Nombre: nombrePlantillaOriginal.length > 0
                    ? nombrePlantillaOriginal
                    : this.getNombrePlantillaFamiliar(plantillaSeleccionada),
            },
        };
    }

    private getNombrePlantillaFamiliar(plantilla: FamiliarPlantillaId): string {
        if (plantilla === 2)
            return 'Draconica';
        if (plantilla === 3)
            return 'Celestial';
        if (plantilla === 4)
            return 'Remendado';
        if (plantilla === 5)
            return 'Mejorado';
        return 'Basica';
    }

    private normalizarPlantillaCompanero(plantilla: CompaneroPlantillaSelector | string): CompaneroPlantillaSelector {
        const normalizada = this.normalizarTexto(`${plantilla ?? ''}`);
        if (normalizada.includes('elevado'))
            return 'elevado';
        if (normalizada.includes('sabandija'))
            return 'sabandija';
        return 'base';
    }

    private getNombrePlantillaCompanero(plantilla: CompaneroPlantillaSelector): string {
        if (plantilla === 'elevado')
            return 'Elevado';
        if (plantilla === 'sabandija')
            return 'Sabandija';
        return 'Base';
    }

    private calcularEscalaCompanero(nivelEfectivoCompanero: number): {
        dgAdi: number;
        trucosAdi: number;
        bonoFueDes: number;
        bonoArmaduraNatural: number;
    } {
        const nivel = Math.max(0, Math.trunc(this.toNumber(nivelEfectivoCompanero)));
        if (nivel >= 18)
            return { dgAdi: 12, trucosAdi: 7, bonoFueDes: 6, bonoArmaduraNatural: 12 };
        if (nivel >= 15)
            return { dgAdi: 10, trucosAdi: 6, bonoFueDes: 5, bonoArmaduraNatural: 10 };
        if (nivel >= 12)
            return { dgAdi: 8, trucosAdi: 5, bonoFueDes: 4, bonoArmaduraNatural: 8 };
        if (nivel >= 9)
            return { dgAdi: 6, trucosAdi: 4, bonoFueDes: 3, bonoArmaduraNatural: 6 };
        if (nivel >= 6)
            return { dgAdi: 4, trucosAdi: 3, bonoFueDes: 2, bonoArmaduraNatural: 4 };
        if (nivel >= 3)
            return { dgAdi: 2, trucosAdi: 2, bonoFueDes: 1, bonoArmaduraNatural: 2 };
        return { dgAdi: 0, trucosAdi: 1, bonoFueDes: 0, bonoArmaduraNatural: 0 };
    }

    private clonarCompaneroParaPersonaje(
        companero: CompaneroMonstruoDetalle,
        plantillaSeleccionada: CompaneroPlantillaSelector,
        nombrePersonalizado: string = '',
        escala: {
            dgAdi: number;
            trucosAdi: number;
            bonoFueDes: number;
            bonoArmaduraNatural: number;
        }
    ): CompaneroMonstruoDetalle {
        const nombreVisible = `${nombrePersonalizado ?? ''}`.trim();
        const idPlantilla = getPlantillaIdCompanero(plantillaSeleccionada);
        const nombrePlantilla = `${companero?.Plantilla?.Nombre ?? ''}`.trim()
            || this.getNombrePlantillaCompanero(plantillaSeleccionada);
        const caracteristicas = {
            ...(companero?.Caracteristicas ?? {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            }),
        };
        const defensa = {
            ...(companero?.Defensa ?? {
                Ca: 0,
                Toque: 0,
                Desprevenido: 0,
                Armadura_natural: 0,
                Reduccion_dano: '',
                Resistencia_conjuros: '',
                Resistencia_elemental: '',
            }),
        };

        caracteristicas.Fuerza = this.toNumber(caracteristicas.Fuerza) + this.toNumber(escala?.bonoFueDes);
        caracteristicas.Destreza = this.toNumber(caracteristicas.Destreza) + this.toNumber(escala?.bonoFueDes);
        if (plantillaSeleccionada === 'sabandija' && this.toNumber(caracteristicas.Inteligencia) < 1)
            caracteristicas.Inteligencia = 1;
        defensa.Armadura_natural = this.toNumber(defensa.Armadura_natural) + this.toNumber(escala?.bonoArmaduraNatural);

        return {
            ...companero,
            Nombre: nombreVisible.length > 0 ? nombreVisible : `${companero?.Nombre ?? ''}`.trim(),
            Plantilla: {
                Id: idPlantilla,
                Nombre: nombrePlantilla,
            },
            Caracteristicas: caracteristicas,
            Defensa: defensa,
            Dg_adi: this.toNumber(escala?.dgAdi),
            Trucos_adi: this.toNumber(escala?.trucosAdi),
        };
    }

    private crearDotePlaceholder(idDote: number, nombre: string): Dote {
        return {
            Id: idDote,
            Nombre: nombre,
            Descripcion: '',
            Beneficio: '',
            Normal: '',
            Especial: '',
            Manual: { Id: 0, Nombre: 'No especificado', Pagina: 0 },
            Tipos: [],
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura_armaduras: 0,
                Extra_armadura_escudos: 0,
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
            Modificadores: {},
            Prerrequisitos: {},
        };
    }

    private asegurarDoteFamiliar17(): boolean {
        const yaExiste = (this.personajeCreacion.DotesContextuales ?? []).some((item) =>
            this.toNumber(item?.Dote?.Id) === DOTE_FAMILIAR_ID
        ) || (this.personajeCreacion.Dotes ?? []).some((item) =>
            this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto('Alerta')
            || this.toNumber((item as Record<string, any>)?.['Id']) === DOTE_FAMILIAR_ID
        );
        if (yaExiste)
            return false;

        const dote = (this.catalogoDotes ?? []).find((item) => this.toNumber(item?.Id) === DOTE_FAMILIAR_ID)
            ?? this.crearDotePlaceholder(DOTE_FAMILIAR_ID, 'Alerta');
        const origen = 'Familiar';
        const agregado = this.agregarDoteAlPersonaje(dote, origen, 0, 'No aplica');
        if (!agregado)
            return false;
        this.aplicarModificadoresDote(dote, origen, 0, 'No aplica');
        return true;
    }

    private asegurarEspecialFamiliar(idEspecial: number, nombresEspecialesPorId: Record<number, string>): boolean {
        const nombreFallback = `Especial ${idEspecial} (Familiar)`;
        const nombreEspecial = `${nombresEspecialesPorId?.[idEspecial] ?? nombreFallback}`.trim() || nombreFallback;
        const extra = 'Familiar';
        const duplicado = (this.personajeCreacion.Claseas ?? []).some((especial) =>
            this.normalizarTexto(especial?.Nombre ?? '') === this.normalizarTexto(nombreEspecial)
            && this.normalizarTexto(especial?.Extra ?? '') === this.normalizarTexto(extra)
        );
        if (duplicado)
            return false;
        this.personajeCreacion.Claseas.push({
            Id: this.toNumber(idEspecial),
            Id_extra: 0,
            Nombre: nombreEspecial,
            Extra: extra,
        });
        return true;
    }

    private asegurarEspecialPersonajeCompanero(idEspecial: number, nombresEspecialesPorId: Record<number, string>): boolean {
        const nombreFallback = `Especial ${idEspecial} (Compañero animal)`;
        const nombreEspecial = `${nombresEspecialesPorId?.[idEspecial] ?? nombreFallback}`.trim() || nombreFallback;
        const extra = 'Compañero animal';
        const duplicado = (this.personajeCreacion.Claseas ?? []).some((especial) =>
            this.normalizarTexto(especial?.Nombre ?? '') === this.normalizarTexto(nombreEspecial)
            && this.normalizarTexto(especial?.Extra ?? '') === this.normalizarTexto(extra)
        );
        if (duplicado)
            return false;
        this.personajeCreacion.Claseas.push({
            Id: this.toNumber(idEspecial),
            Id_extra: 0,
            Nombre: nombreEspecial,
            Extra: extra,
        });
        return true;
    }

    private asegurarEspecialCompanero(
        companero: CompaneroMonstruoDetalle,
        idEspecial: number,
        nombresEspecialesPorId: Record<number, string>
    ): boolean {
        const nombreFallback = `Especial ${idEspecial} (Compañero)`;
        const nombreEspecial = `${nombresEspecialesPorId?.[idEspecial] ?? nombreFallback}`.trim() || nombreFallback;
        const especiales = Array.isArray(companero?.Especiales) ? [...companero.Especiales] : [];
        const duplicado = especiales.some((item) =>
            this.toNumber((item as any)?.Especial?.Id) === idEspecial
            || this.normalizarTexto((item as any)?.Especial?.Nombre ?? '') === this.normalizarTexto(nombreEspecial)
        );
        if (duplicado)
            return false;

        especiales.push({
            Especial: {
                Id: idEspecial,
                Nombre: nombreEspecial,
                Descripcion: '',
                Manual: { Id: 0, Nombre: 'No especificado', Pagina: 0 },
                Id_posicion: 0,
                Orden: 0,
                Tiene_prerrequisitos: false,
                Oficial: true,
            } as any,
            Contexto: {
                Entidad: 'companero',
            },
        });
        companero.Especiales = especiales;
        return true;
    }

    private asegurarDoteCompanero(companero: CompaneroMonstruoDetalle, idDote: number): boolean {
        const dote = (this.catalogoDotes ?? []).find((item) => this.toNumber(item?.Id) === idDote)
            ?? this.crearDotePlaceholder(idDote, `Dote ${idDote} (Compañero)`);
        const dotes = Array.isArray(companero?.Dotes) ? [...companero.Dotes] : [];
        const duplicado = dotes.some((item) => this.toNumber(item?.Dote?.Id) === idDote);
        if (duplicado)
            return false;
        dotes.push({
            Dote: dote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: this.toNumber(this.personajeCreacion?.Id),
                Extra: 'Compañero animal',
                Id_extra: 0,
                Origen: 'Compañero animal',
            } as any,
        });
        companero.Dotes = dotes;
        return true;
    }

    private debeAgregarEspecialFamiliar83(plantilla: FamiliarPlantillaId, nivelLanzador: number): boolean {
        if (plantilla === 2)
            return nivelLanzador >= 9;
        if (plantilla === 5)
            return false;
        return nivelLanzador >= 4;
    }

    private debeAgregarEspecialFamiliar87(plantilla: FamiliarPlantillaId, nivelLanzador: number): boolean {
        if (plantilla === 2)
            return nivelLanzador >= 17;
        if (plantilla === 5)
            return false;
        return nivelLanzador >= 14;
    }

    private construirOrigenDoteDesdePendiente(pendiente: DotePendienteState): string {
        const prefijo = pendiente.fuente === 'nivel'
            ? 'Dote por nivel'
            : (pendiente.fuente === 'raza_dg' ? 'DGs de raza' : 'Dote adicional');
        const origen = `${pendiente?.origen ?? ''}`.trim();
        return origen.length > 0 ? `${prefijo}: ${origen}` : prefijo;
    }

    private resolverExtraTextoDote(dote: Dote, idExtra: number, extraSeleccionado: string): string {
        const requiereExtra = this.doteTieneExtrasSoportados(dote);
        if (!requiereExtra)
            return 'No aplica';

        const id = Math.max(0, this.toNumber(idExtra));
        if (id > 0) {
            const extra = this.resolverExtrasDisponiblesDote(dote)
                .find((item) => this.toNumber(item?.Id) === id);
            if (extra)
                return `${extra?.Nombre ?? ''}`.trim();
        }

        const extraTexto = `${extraSeleccionado ?? ''}`.trim();
        return extraTexto.length > 0 ? extraTexto : 'No aplica';
    }

    private agregarDoteAlPersonaje(dote: Dote, origen: string, idExtra: number, extraTexto: string): boolean {
        const nombre = `${dote?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return false;
        const extra = `${extraTexto ?? ''}`.trim() || 'No aplica';
        const idExtraNormalizado = Math.max(0, this.toNumber(idExtra));
        const origenNormalizado = `${origen ?? ''}`.trim();

        const duplicadaLegacy = (this.personajeCreacion.Dotes ?? []).some((item) =>
            this.normalizarTexto(item?.Nombre ?? '') === this.normalizarTexto(nombre)
            && this.normalizarTexto(item?.Extra ?? '') === this.normalizarTexto(extra)
            && this.normalizarTexto(item?.Origen ?? '') === this.normalizarTexto(origenNormalizado)
        );
        let agregadoLegacy = false;
        if (!duplicadaLegacy) {
            this.personajeCreacion.Dotes.push({
                Nombre: nombre,
                Descripcion: `${dote?.Descripcion ?? ''}`.trim(),
                Beneficio: `${dote?.Beneficio ?? ''}`.trim(),
                Pagina: this.toNumber(dote?.Manual?.Pagina),
                Extra: extra,
                Origen: origenNormalizado,
            });
            agregadoLegacy = true;
        }

        const idDote = this.toNumber(dote?.Id);
        let agregadoContextual = false;
        if (idDote > 0) {
            const duplicadaContextual = (this.personajeCreacion.DotesContextuales ?? []).some((item) =>
                this.toNumber(item?.Dote?.Id) === idDote
                && this.toNumber(item?.Contexto?.Id_extra) === idExtraNormalizado
                && this.normalizarTexto((item?.Contexto as any)?.Origen ?? '') === this.normalizarTexto(origenNormalizado)
            );
            if (!duplicadaContextual) {
                this.personajeCreacion.DotesContextuales.push({
                    Dote: dote,
                    Contexto: {
                        Entidad: 'personaje',
                        Id_personaje: this.toNumber(this.personajeCreacion?.Id),
                        Extra: extra,
                        Id_extra: idExtraNormalizado,
                        Origen: origenNormalizado,
                    },
                });
                agregadoContextual = true;
            }
        }

        return agregadoLegacy || agregadoContextual;
    }

    private aplicarModificadoresDote(dote: Dote, _origen: string, idExtra: number, extraTexto: string): void {
        const origen = `Dote: ${`${dote?.Nombre ?? ''}`.trim() || 'Sin nombre'}`;
        const mods = (dote?.Modificadores ?? {}) as Record<string, any>;
        const get = (clave: string): number => this.toNumber(mods?.[clave]);

        CARACTERISTICAS_KEYS.forEach((key) => {
            const valor = get(key);
            if (valor === 0)
                return;
            (this.personajeCreacion.CaracteristicasVarios[key] ?? []).push({
                valor,
                origen,
            });
        });

        const aplicarSalvacion = (tipo: SalvacionKey, clave: string) => {
            const valor = get(clave);
            if (valor === 0)
                return;
            this.personajeCreacion.Salvaciones[tipo].modsVarios.push({
                valor,
                origen,
            });
        };
        aplicarSalvacion('fortaleza', 'Fortaleza');
        aplicarSalvacion('reflejos', 'Reflejos');
        aplicarSalvacion('voluntad', 'Voluntad');

        const iniciativa = get('Iniciativa');
        if (iniciativa !== 0) {
            this.personajeCreacion.Iniciativa_varios.push({
                Valor: iniciativa,
                Origen: origen,
            });
        }

        const presa = get('Presa');
        if (presa !== 0) {
            this.personajeCreacion.Presa_varios.push({
                Valor: presa,
                Origen: origen,
            });
        }

        const bonusHabilidad = get('Habilidad');
        if (bonusHabilidad !== 0)
            this.aplicarModificadorHabilidadDesdeDote(dote, bonusHabilidad, origen, idExtra, extraTexto);
    }

    private aplicarModificadorHabilidadDesdeDote(
        dote: Dote,
        valor: number,
        origen: string,
        idExtra: number,
        extraTexto: string
    ): void {
        const requiereExtraHabilidad = this.toBooleanValue(dote?.Extras_soportados?.Extra_habilidad);
        const idObjetivo = requiereExtraHabilidad ? Math.max(0, this.toNumber(idExtra)) : 0;
        const extraNorm = this.normalizarTexto(extraTexto ?? '');

        const objetivo = (this.personajeCreacion.Habilidades ?? []).find((habilidad) => {
            if (idObjetivo > 0 && this.toNumber(habilidad?.Id) === idObjetivo)
                return true;
            if (!requiereExtraHabilidad)
                return false;
            return extraNorm.length > 0 && this.normalizarTexto(habilidad?.Nombre ?? '') === extraNorm;
        });
        if (!objetivo)
            return;

        const bonos = Array.isArray(objetivo.Bonos_varios) ? [...objetivo.Bonos_varios] : [];
        bonos.push({
            valor,
            origen,
        });
        objetivo.Bonos_varios = bonos;
        objetivo.Rangos_varios = bonos.reduce((acc, bono) => acc + this.toNumber(bono?.valor), 0);
        objetivo.Varios = bonos
            .map((bono) => `${bono?.origen ?? ''} ${this.toNumber(bono?.valor) >= 0 ? '+' : ''}${this.toNumber(bono?.valor)}`.trim())
            .join(', ');
    }

    aplicarIdiomasAutomaticos(origen: string, idiomas: IdiomaDetalle[]): void {
        const origenNormalizado = `${origen ?? ''}`.trim();
        const existentes = new Set(
            (this.personajeCreacion.Idiomas ?? [])
                .map((idioma) => this.normalizarTexto(idioma?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        const idiomaLista = Array.isArray(idiomas)
            ? idiomas
            : (idiomas && typeof idiomas === 'object' ? Object.values(idiomas as any) : []);
        idiomaLista.forEach((idiomaRaw: any) => {
            const nombre = `${idiomaRaw?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const nombreNorm = this.normalizarTexto(nombre);
            if (existentes.has(nombreNorm))
                return;

            const idioma = {
                Nombre: nombre,
                Descripcion: `${idiomaRaw?.Descripcion ?? ''}`.trim(),
                Secreto: !!idiomaRaw?.Secreto,
                Oficial: idiomaRaw?.Oficial !== false,
                Origen: origenNormalizado.length > 0 ? origenNormalizado : undefined,
            };
            this.personajeCreacion.Idiomas.push(idioma);
            this.agregarIdiomaABaseVentajas(idioma);
            existentes.add(nombreNorm);
        });
    }

    getEspecialidadMagicaPendiente(clase: Clase, nivelAplicado: number): EspecialidadMagicaPendiente | null {
        const nivel = Math.max(0, Math.trunc(this.toNumber(nivelAplicado)));
        if (nivel !== 1)
            return null;
        if (!this.toBooleanValue(clase?.Conjuros?.puede_elegir_especialidad))
            return null;

        const requiereArcano = !!clase?.Conjuros?.Arcanos;
        const requierePsionico = !!clase?.Conjuros?.Psionicos;
        if (!requiereArcano && !requierePsionico)
            return null;

        return {
            requiereArcano,
            requierePsionico,
        };
    }

    aplicarEspecialidadMagicaClase(
        clase: Clase,
        nivelAplicado: number,
        seleccion: EspecialidadMagicaSeleccion,
        escuelasCatalogo: EscuelaConjuros[],
        disciplinasCatalogo: DisciplinaConjuros[]
    ): { aplicado: boolean; razon?: string; } {
        const pendiente = this.getEspecialidadMagicaPendiente(clase, nivelAplicado);
        if (!pendiente)
            return { aplicado: true };

        if (pendiente.requiereArcano) {
            const arcana = seleccion?.arcana;
            const especializar = this.toBooleanValue(arcana?.especializar);
            if (!especializar) {
                this.personajeCreacion.Escuela_especialista = {
                    Nombre: 'Cualquiera',
                    Calificativo: 'Cualquiera',
                };
                this.personajeCreacion.Escuelas_prohibidas = [];
            } else {
                const escuelasEspecializables = this.obtenerCatalogoEscuelasEspecializables(escuelasCatalogo);
                const idEspecialista = Math.trunc(this.toNumber(arcana?.escuelaEspecialistaId));
                const escuelaEspecialista = escuelasEspecializables.find((escuela) => this.toNumber(escuela?.Id) === idEspecialista);
                if (!escuelaEspecialista) {
                    return {
                        aplicado: false,
                        razon: 'Debes seleccionar una escuela válida para especializarte.',
                    };
                }

                const escuelasProhibibles = this.obtenerCatalogoEscuelasProhibibles(escuelasCatalogo, idEspecialista);
                const idsProhibidas = Array.from(new Set(
                    (arcana?.escuelasProhibidasIds ?? [])
                        .map((id) => Math.trunc(this.toNumber(id)))
                        .filter((id) => id > 0 && id !== idEspecialista)
                ));
                const prohibidasSeleccionadas = escuelasProhibibles
                    .filter((escuela) => idsProhibidas.includes(this.toNumber(escuela?.Id)));
                const prohibidasRequeridas = this.esNombreAdivinacion(escuelaEspecialista?.Nombre ?? '') ? 1 : 2;
                if (prohibidasSeleccionadas.length !== prohibidasRequeridas) {
                    return {
                        aplicado: false,
                        razon: prohibidasRequeridas === 1
                            ? 'Debes seleccionar exactamente 1 escuela prohibida.'
                            : 'Debes seleccionar exactamente 2 escuelas prohibidas.',
                    };
                }

                this.personajeCreacion.Escuela_especialista = {
                    Nombre: `${escuelaEspecialista?.Nombre ?? ''}`.trim() || 'Cualquiera',
                    Calificativo: `${escuelaEspecialista?.Nombre_especial ?? ''}`.trim()
                        || `${escuelaEspecialista?.Nombre ?? ''}`.trim()
                        || 'Cualquiera',
                };
                this.personajeCreacion.Escuelas_prohibidas = prohibidasSeleccionadas.map((escuela) => ({
                    Nombre: `${escuela?.Nombre ?? ''}`.trim(),
                }));
            }
        }

        if (pendiente.requierePsionico) {
            const psionica = seleccion?.psionica;
            const disciplinasEspecializables = this.obtenerCatalogoDisciplinasEspecializables(disciplinasCatalogo);
            const idEspecialista = Math.trunc(this.toNumber(psionica?.disciplinaEspecialistaId));
            const idProhibida = Math.trunc(this.toNumber(psionica?.disciplinaProhibidaId));
            const disciplinaEspecialista = disciplinasEspecializables
                .find((disciplina) => this.toNumber(disciplina?.Id) === idEspecialista);
            if (!disciplinaEspecialista) {
                return {
                    aplicado: false,
                    razon: 'Debes seleccionar una disciplina válida para especializarte.',
                };
            }
            if (idProhibida <= 0 || idProhibida === idEspecialista) {
                return {
                    aplicado: false,
                    razon: 'Debes seleccionar una disciplina prohibida distinta a la especialista.',
                };
            }
            const disciplinaProhibida = disciplinasEspecializables
                .find((disciplina) => this.toNumber(disciplina?.Id) === idProhibida);
            if (!disciplinaProhibida) {
                return {
                    aplicado: false,
                    razon: 'La disciplina prohibida seleccionada no es válida.',
                };
            }

            this.personajeCreacion.Disciplina_especialista = {
                Nombre: `${disciplinaEspecialista?.Nombre ?? ''}`.trim() || 'Ninguna',
                Calificativo: `${disciplinaEspecialista?.Nombre_especial ?? ''}`.trim()
                    || `${disciplinaEspecialista?.Nombre ?? ''}`.trim()
                    || 'Ninguna',
            };
            this.personajeCreacion.Disciplina_prohibida = `${disciplinaProhibida?.Nombre ?? ''}`.trim() || 'Ninguna';
        }

        return { aplicado: true };
    }

    refrescarSesionConjurosPorEspecialidad(): void {
        if (!this.estadoFlujo.conjuros.activa)
            return;

        const entradasActuales = this.estadoFlujo.conjuros.entradas ?? [];
        const entradasRecalculadas: ConjurosSesionStateEntrada[] = [];
        const avisos: string[] = [];

        entradasActuales.forEach((entradaActual) => {
            const idClase = this.toNumber(entradaActual?.claseObjetivo?.id);
            const nombreClase = `${entradaActual?.claseObjetivo?.nombre ?? ''}`.trim();
            const claseObjetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && this.toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(nombreClase))
            ) ?? null;

            if (!claseObjetivo) {
                avisos.push(`No se pudo recalcular conjuros para ${nombreClase || 'clase desconocida'}.`);
                entradasRecalculadas.push({ ...entradaActual });
                return;
            }

            const recalculo = this.crearEntradaSesionConjuros(
                claseObjetivo,
                `${entradaActual?.origen ?? ''}`.trim(),
                this.toNumber(entradaActual?.nivelLanzadorPrevio),
                this.toNumber(entradaActual?.nivelLanzadorActual)
            );
            if (!recalculo.entrada) {
                avisos.push(...(recalculo.avisos ?? []));
                entradasRecalculadas.push({ ...entradaActual });
                return;
            }

            avisos.push(...(recalculo.avisos ?? []));
            entradasRecalculadas.push(recalculo.entrada);
        });

        this.estadoFlujo.conjuros = {
            ...this.estadoFlujo.conjuros,
            activa: entradasRecalculadas.length > 0,
            indiceEntradaActual: 0,
            entradas: entradasRecalculadas,
            avisos: [
                ...(this.estadoFlujo.conjuros.avisos ?? []),
                ...avisos,
            ],
        };
    }

    aplicarSiguienteNivelClase(
        clase: Clase,
        seleccionesOpcionales: SeleccionOpcionalesClase | null = null,
        seleccionesDominios: SeleccionDominiosClase | null = null,
        permitirBloqueoSoloAlineamiento: boolean = false,
        seleccionesAumentosClaseLanzadora: SeleccionAumentosClaseLanzadora | null = null
    ): AplicacionClaseResultado {
        const evaluacion = this.evaluarClaseParaSeleccion(clase);
        const bloqueoSoloAlineamiento = this.esBloqueoSoloPorAlineamiento(evaluacion);
        if (evaluacion.estado !== 'eligible' && !(permitirBloqueoSoloAlineamiento && bloqueoSoloAlineamiento)) {
            return {
                aplicado: false,
                razon: evaluacion.razones[0] ?? 'La clase no cumple los prerrequisitos actuales',
                evaluacion,
            };
        }

        const nivelActual = this.obtenerNivelActualClase(clase.Nombre);
        const siguienteNivel = nivelActual + 1;
        const detalleSiguiente = this.obtenerDetalleNivelClase(clase, siguienteNivel);
        if (!detalleSiguiente) {
            return {
                aplicado: false,
                razon: `No existe desglose de nivel ${siguienteNivel} para la clase ${clase.Nombre}`,
                evaluacion,
            };
        }

        const detalleAnterior = nivelActual > 0
            ? this.obtenerDetalleNivelClase(clase, nivelActual)
            : null;
        const dominiosPendientes = this.obtenerDominiosPendientesSiguienteNivelClase(clase);
        const seleccionDominios = this.resolverSeleccionesDominiosClase(dominiosPendientes, seleccionesDominios);
        if (dominiosPendientes && seleccionDominios.length < dominiosPendientes.cantidad) {
            return {
                aplicado: false,
                razon: 'Falta seleccionar dominios de clase',
                evaluacion,
                dominiosPendientes,
            };
        }
        const resolucionAumentosClaseLanzadora = this.resolverAumentosClaseLanzadora(
            clase,
            detalleSiguiente,
            seleccionesAumentosClaseLanzadora
        );
        if (resolucionAumentosClaseLanzadora.pendientes.length > 0) {
            return {
                aplicado: false,
                razon: 'Falta seleccionar la clase objetivo para uno o mas aumentos de nivel de lanzador',
                evaluacion,
                advertencias: resolucionAumentosClaseLanzadora.advertencias,
                aumentosClaseLanzadoraPendientes: resolucionAumentosClaseLanzadora.pendientes,
            };
        }

        const erroresContratoConjuros = this.validarContratoConjurosParaAplicacionNivelClase(
            clase,
            siguienteNivel,
            resolucionAumentosClaseLanzadora.selecciones
        );
        if (erroresContratoConjuros.length > 0) {
            return {
                aplicado: false,
                razon: erroresContratoConjuros[0],
                evaluacion,
                advertencias: erroresContratoConjuros,
            };
        }

        this.actualizarDesgloseClase(clase.Nombre, siguienteNivel);
        this.aplicarDeltaAtaqueBaseClase(clase.Nombre, siguienteNivel, detalleSiguiente, detalleAnterior);
        this.recalcularDerivadasPorCombate();
        this.aplicarDeltaSalvacionesClase(clase.Nombre, siguienteNivel, detalleSiguiente, detalleAnterior);

        if (siguienteNivel === 1) {
            this.aplicarHabilidadesPrimerNivelClase(clase);
            this.aplicarIdiomasPrimerNivelClase(clase);
        }

        const resolucionOpcionales = this.resolverOpcionalesNivelClase(detalleSiguiente, seleccionesOpcionales);
        const habiaSelecciones = !!seleccionesOpcionales && Object.keys(seleccionesOpcionales).length > 0;
        if (habiaSelecciones && resolucionOpcionales.gruposPendientes.length > 0) {
            return {
                aplicado: false,
                razon: 'No se pudo resolver una o más elecciones opcionales de clase',
                evaluacion,
                advertencias: resolucionOpcionales.advertencias,
                gruposOpcionalesPendientes: resolucionOpcionales.gruposPendientes,
            };
        }
        const dotesAplicar = [
            ...resolucionOpcionales.obligatoriasDote,
            ...resolucionOpcionales.seleccionadasDote,
        ];
        const especialesAplicar = [
            ...resolucionOpcionales.obligatoriasEspecial,
            ...resolucionOpcionales.seleccionadasEspecial,
        ];
        this.aplicarDotesNivelClase(clase, siguienteNivel, dotesAplicar);
        this.aplicarEspecialesNivelClase(especialesAplicar);
        this.aplicarDominiosNivelClase(clase, siguienteNivel, seleccionDominios);
        const advertenciasConjuros = this.prepararSesionConjurosTrasNivelClase(
            clase,
            siguienteNivel,
            detalleSiguiente,
            detalleAnterior,
            resolucionAumentosClaseLanzadora.selecciones,
            resolucionAumentosClaseLanzadora.advertencias
        );
        this.recalcularDerivadasEconomiaYProgresion();

        return {
            aplicado: true,
            nivelAplicado: siguienteNivel,
            evaluacion,
            advertencias: [
                ...resolucionOpcionales.advertencias,
                ...advertenciasConjuros,
            ],
            gruposOpcionalesPendientes: resolucionOpcionales.gruposPendientes,
            especialesAplicados: especialesAplicar.map((especialNivel) => ({ ...especialNivel })),
        };
    }

    private esMensajeRelacionAlineamiento(mensaje: string): boolean {
        const normalizado = this.normalizarTexto(mensaje);
        if (normalizado.length < 1)
            return false;
        if (normalizado.includes('alineamiento') || normalizado.includes('actitud'))
            return true;
        if (normalizado.includes('alineamiento_requerido'))
            return true;
        if (normalizado.includes('alineamiento_prohibido'))
            return true;
        if (normalizado.includes('actitud_requerido'))
            return true;
        if (normalizado.includes('actitud_prohibido'))
            return true;
        return false;
    }

    toggleVentaja(idVentaja: number): ToggleVentajaResult {
        const index = this.estadoFlujo.ventajas.seleccionVentajas.findIndex(v => v.id === idVentaja);
        if (index >= 0) {
            this.estadoFlujo.ventajas.seleccionVentajas.splice(index, 1);
            this.recalcularEfectosVentajas();
            return {
                toggled: true,
                selected: false,
                requiresIdiomaSelection: false,
            };
        }

        const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === idVentaja);
        if (!ventaja) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'not_found',
            };
        }

        if (this.estadoFlujo.ventajas.seleccionVentajas.length >= MAX_VENTAJAS_SELECCIONABLES) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'max_reached',
            };
        }

        this.estadoFlujo.ventajas.seleccionVentajas.push({
            id: ventaja.Id,
            idioma: null,
        });
        this.recalcularEfectosVentajas();

        return {
            toggled: true,
            selected: true,
            requiresIdiomaSelection: ventaja.Idioma_extra,
        };
    }

    toggleDesventaja(idDesventaja: number): ToggleVentajaResult {
        const index = this.estadoFlujo.ventajas.seleccionDesventajas.findIndex(v => v.id === idDesventaja);
        if (index >= 0) {
            this.estadoFlujo.ventajas.seleccionDesventajas.splice(index, 1);
            this.recalcularEfectosVentajas();
            return {
                toggled: true,
                selected: false,
                requiresIdiomaSelection: false,
            };
        }

        const desventaja = this.estadoFlujo.ventajas.catalogoDesventajas.find(v => v.Id === idDesventaja);
        if (!desventaja) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'not_found',
            };
        }

        this.estadoFlujo.ventajas.seleccionDesventajas.push({
            id: desventaja.Id,
            idioma: null,
        });
        this.recalcularEfectosVentajas();

        return {
            toggled: true,
            selected: true,
            requiresIdiomaSelection: false,
        };
    }

    seleccionarIdiomaParaVentaja(idVentaja: number, idioma: IdiomaDetalle): boolean {
        const seleccion = this.estadoFlujo.ventajas.seleccionVentajas.find(v => v.id === idVentaja);
        if (!seleccion)
            return false;

        const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === idVentaja);
        if (!ventaja || !ventaja.Idioma_extra)
            return false;

        if (idioma.Secreto)
            return false;

        if (this.idiomaYaEnPersonajeOSeleccion(idioma.Nombre, idVentaja))
            return false;

        seleccion.idioma = {
            ...idioma,
        };
        this.recalcularEfectosVentajas();
        return true;
    }

    quitarSeleccionVentaja(idVentaja: number): void {
        const previoVentajas = this.estadoFlujo.ventajas.seleccionVentajas.length;
        const previoDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas.length;

        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas.filter(v => v.id !== idVentaja);
        this.estadoFlujo.ventajas.seleccionDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas.filter(v => v.id !== idVentaja);

        if (previoVentajas !== this.estadoFlujo.ventajas.seleccionVentajas.length
            || previoDesventajas !== this.estadoFlujo.ventajas.seleccionDesventajas.length) {
            this.recalcularEfectosVentajas();
        }
    }

    limpiarVentajasDesventajas(): void {
        this.estadoFlujo.ventajas.seleccionVentajas = [];
        this.estadoFlujo.ventajas.seleccionDesventajas = [];
        this.recalcularEfectosVentajas();
    }

    puedeContinuarDesdeVentajas(): boolean {
        if (this.estadoFlujo.ventajas.hayDeficit)
            return false;

        if (this.estadoFlujo.ventajas.seleccionVentajas.length > MAX_VENTAJAS_SELECCIONABLES)
            return false;

        return this.estadoFlujo.ventajas.seleccionVentajas.every((seleccion) => {
            const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === seleccion.id);
            if (!ventaja?.Idioma_extra)
                return true;
            return seleccion.idioma !== null;
        });
    }

    abrirModalCaracteristicas(): void {
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        this.estadoFlujo.modalCaracteristicasAbierto = true;
    }

    cerrarModalCaracteristicas(): void {
        this.estadoFlujo.modalCaracteristicasAbierto = false;
    }

    actualizarPasoActual(paso: StepNuevoPersonaje): void {
        this.estadoFlujo.pasoActual = paso;
        this.persistirBorradorLocalAhora();
    }

    setMinimoGenerador(minimo: number): void {
        const index = this.getIndexByMinimo(minimo);
        this.generadorConfigBase.minimoSeleccionado = this.getMinimoByIndex(index);
        this.persistirConfigGenerador();
        this.aplicarConfigGeneradorEfectiva();
    }

    setTablasPermitidasGenerador(cantidad: number): void {
        const tablas = this.normalizarTablasPermitidas(cantidad);
        this.generadorConfigBase.tablasPermitidas = tablas;
        this.persistirConfigGenerador();
        this.aplicarConfigGeneradorEfectiva();
    }

    seleccionarTablaGenerador(tabla: number): boolean {
        const tablaNormalizada = this.normalizarTablaSeleccionada(tabla);
        if (tablaNormalizada === null) {
            return false;
        }
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        this.estadoFlujo.generador.tablaSeleccionada = tablaNormalizada;
        this.estadoFlujo.generador.poolDisponible = this.getTiradasTabla(tablaNormalizada).slice();
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();
        this.estadoFlujo.generador.origenesAsignacion = this.crearOrigenesAsignacionVacios();

        CARACTERISTICAS_KEYS.forEach((key) => {
            if (this.esCaracteristicaPerdida(key))
                this.estadoFlujo.generador.asignaciones[key] = 0;
        });

        return true;
    }

    resetearGeneradorCaracteristicas(): void {
        const minimo = this.estadoFlujo.generador.minimoSeleccionado;
        const indice = this.getIndexByMinimo(minimo);
        this.estadoFlujo.generador.minimoSeleccionado = this.getMinimoByIndex(indice);
        this.estadoFlujo.generador.indiceMinimo = indice;
        this.estadoFlujo.generador.tablaSeleccionada = null;
        this.estadoFlujo.generador.poolDisponible = [];
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();
        this.estadoFlujo.generador.origenesAsignacion = this.crearOrigenesAsignacionVacios();
        CARACTERISTICAS_KEYS.forEach((key) => {
            if (this.esCaracteristicaPerdida(key))
                this.estadoFlujo.generador.asignaciones[key] = 0;
        });
    }

    getTiradasTabla(tabla: number): number[] {
        const tablaNormalizada = this.normalizarTablaConFallback(tabla);
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        const fila = this.estadoFlujo.generador.tiradasCache[this.estadoFlujo.generador.indiceMinimo];
        const inicio = (tablaNormalizada - 1) * TIRADAS_POR_TABLA;
        return fila.slice(inicio, inicio + TIRADAS_POR_TABLA);
    }

    autoRepartirGenerador(input: GeneradorAutoCuestionario): GeneradorAutoResultado {
        if (!this.esCuestionarioAutoGeneradorValido(input))
            return { aplicado: false };

        const diagnostico = this.evaluarCuestionarioAuto(input);
        if (diagnostico.requierePregunta4 && !input.q4)
            return { aplicado: false };

        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        const tablasDisponibles = Array.from({ length: this.estadoFlujo.generador.tablasPermitidas }, (_, i) => i + 1);
        if (tablasDisponibles.length < 1)
            return { aplicado: false };

        const rankingGlobal = diagnostico.ranking as CaracteristicaKey[];
        const rankingActivas = rankingGlobal.filter((key) => !this.esCaracteristicaPerdida(key));
        if (rankingActivas.length < 1)
            return { aplicado: false };

        const tablaSeleccionada = this.seleccionarMejorTablaAutoGenerador(tablasDisponibles, rankingActivas);
        if (tablaSeleccionada === null || !this.seleccionarTablaGenerador(tablaSeleccionada))
            return { aplicado: false };

        const poolOrdenado = this.estadoFlujo.generador.poolDisponible
            .map((valor, index) => ({ valor, index }))
            .filter((item) => item.valor >= 0)
            .sort((a, b) => {
                if (b.valor !== a.valor)
                    return b.valor - a.valor;
                return a.index - b.index;
            });

        if (poolOrdenado.length < rankingActivas.length)
            return { aplicado: false };

        for (let i = 0; i < rankingActivas.length; i++) {
            if (!this.asignarDesdePoolACaracteristica(rankingActivas[i], poolOrdenado[i].index))
                return { aplicado: false };
        }

        const aplicado = this.puedeFinalizarGenerador();
        this.setAutoRepartoGuardado(input, diagnostico, aplicado);
        return {
            aplicado,
            tablaSeleccionada,
        };
    }

    evaluarCuestionarioAuto(input: GeneradorAutoCuestionario): GeneradorAutoDiagnostico {
        const score = this.crearScoreAutoVacio();
        this.aplicarDeltaScoreAuto(score, { Constitucion: GENERADOR_AUTO_CON_FLOOR });
        if (input.q1)
            this.aplicarDeltaScoreAuto(score, GENERADOR_AUTO_SCORING_RULES.q1[input.q1]);
        if (input.q2)
            this.aplicarRespuestaQ2Auto(score, input.q1, input.q2);
        if (input.q3)
            this.aplicarDeltaScoreAuto(score, GENERADOR_AUTO_SCORING_RULES.q3[input.q3]);

        const esCompletoBase = !!input.q1 && !!input.q2 && !!input.q3;
        const requierePregunta4 = esCompletoBase ? this.debeMostrarPregunta4(score) : false;
        const pregunta4Aplicada = !!(requierePregunta4 && input.q4);
        if (pregunta4Aplicada)
            this.aplicarRespuestaQ4Auto(score, input.q1, input.q4 as GeneradorAutoRespuestaQ4);

        const ranking = this.getRankingCaracteristicasAutoGenerador(score);
        const recomendacion = esCompletoBase
            ? this.getRecomendacionAutoDesdeScore(score, ranking)
            : null;
        return {
            score,
            ranking: ranking.slice() as CaracteristicaKeyAumento[],
            top2: ranking.slice(0, 2) as CaracteristicaKeyAumento[],
            recomendacion,
            requierePregunta4,
            pregunta4Aplicada,
            esCompletoBase,
        };
    }

    debeMostrarPregunta4(score: GeneradorAutoScore): boolean {
        const valores = Object.values(score)
            .map((value) => this.toNumber(value))
            .sort((a, b) => b - a);
        if (valores.length < 3)
            return false;
        const segundo = valores[1];
        const tercero = valores[2];
        return Math.abs(segundo - tercero) <= GENERADOR_AUTO_Q4_THRESHOLD;
    }

    getOpcionesQ2(q1?: GeneradorAutoRespuestaQ1 | null): GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ2>[] {
        const base: GeneradorAutoRespuestaQ2[] = ['delante', 'primera_segunda_linea', 'atras_control_apoyo', 'evitar_contacto'];
        const preferida = this.getOpcionPreferidaQ2(q1 ?? undefined);
        return this.ordenarOpcionesConPreferida(base, preferida)
            .map((key) => ({ ...GENERADOR_AUTO_OPCIONES_Q2[key] }));
    }

    getOpcionesQ3(q1?: GeneradorAutoRespuestaQ1 | null): GeneradorAutoPreguntaOpcion<GeneradorAutoRespuestaQ3>[] {
        const base: GeneradorAutoRespuestaQ3[] = ['social', 'investigar', 'explorar', 'manitas'];
        const preferida = this.getOpcionPreferidaQ3(q1 ?? undefined);
        return this.ordenarOpcionesConPreferida(base, preferida)
            .map((key) => ({ ...GENERADOR_AUTO_OPCIONES_Q3[key] }));
    }

    getAutoRepartoGuardado(): Personaje['Auto_reparto'] | null {
        const actual = this.personajeCreacion.Auto_reparto;
        if (!actual || actual.version !== 'quiz_v1')
            return null;
        return {
            ...actual,
            respuestas: { ...(actual.respuestas ?? {}) },
            score: { ...(actual.score ?? this.crearScoreAutoVacio()) },
            ranking: [...(actual.ranking ?? [])],
            top2: [...(actual.top2 ?? [])],
            recomendacion: actual.recomendacion
                ? {
                    ...actual.recomendacion,
                    clases: [...(actual.recomendacion.clases ?? [])],
                }
                : null,
            aplicadoAutomaticamente: actual.aplicadoAutomaticamente === true,
        };
    }

    setAutoRepartoGuardado(
        respuestas: GeneradorAutoCuestionario,
        diagnostico?: GeneradorAutoDiagnostico,
        aplicadoAutomaticamente = false
    ): void {
        const evaluacion = diagnostico ?? this.evaluarCuestionarioAuto(respuestas);
        this.personajeCreacion.Auto_reparto = {
            version: 'quiz_v1',
            respuestas: { ...respuestas },
            score: { ...evaluacion.score },
            ranking: [...evaluacion.ranking],
            top2: [...evaluacion.top2],
            recomendacion: evaluacion.recomendacion
                ? {
                    ...evaluacion.recomendacion,
                    clases: [...evaluacion.recomendacion.clases],
                }
                : null,
            pregunta4Aplicada: evaluacion.pregunta4Aplicada,
            aplicadoAutomaticamente,
            updatedAt: Date.now(),
        };
    }

    clearAutoRepartoGuardado(): void {
        this.personajeCreacion.Auto_reparto = null;
    }

    asignarDesdePoolACaracteristica(caracteristica: CaracteristicaKey, indexPool: number): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
            return false;
        }

        if (indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        if (this.estadoFlujo.generador.asignaciones[caracteristica] !== null) {
            return false;
        }

        if (this.esCaracteristicaPerdida(caracteristica)) {
            return false;
        }

        const valor = this.estadoFlujo.generador.poolDisponible[indexPool];
        if (valor < 0) {
            return false;
        }

        this.estadoFlujo.generador.asignaciones[caracteristica] = valor;
        this.estadoFlujo.generador.origenesAsignacion[caracteristica] = indexPool;
        this.estadoFlujo.generador.poolDisponible[indexPool] = -1;
        return true;
    }

    desasignarCaracteristicaGenerador(caracteristica: CaracteristicaKey): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
            return false;
        }

        if (this.esCaracteristicaPerdida(caracteristica)) {
            return false;
        }

        const valor = this.estadoFlujo.generador.asignaciones[caracteristica];
        if (valor === null) {
            return false;
        }

        const indexPool = this.estadoFlujo.generador.origenesAsignacion[caracteristica];
        if (indexPool === null || indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        this.estadoFlujo.generador.poolDisponible[indexPool] = valor;
        this.estadoFlujo.generador.asignaciones[caracteristica] = null;
        this.estadoFlujo.generador.origenesAsignacion[caracteristica] = null;
        return true;
    }

    desasignarDesdeIndicePoolGenerador(indexPool: number): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
            return false;
        }

        if (indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        if (this.estadoFlujo.generador.poolDisponible[indexPool] >= 0) {
            return false;
        }

        const caracteristica = CARACTERISTICAS_KEYS.find((key) =>
            this.estadoFlujo.generador.origenesAsignacion[key] === indexPool
            && this.estadoFlujo.generador.asignaciones[key] !== null
        );

        if (!caracteristica) {
            return false;
        }

        return this.desasignarCaracteristicaGenerador(caracteristica);
    }

    puedeFinalizarGenerador(): boolean {
        const asigs = this.estadoFlujo.generador.asignaciones;
        return CARACTERISTICAS_KEYS.every((key) => this.esCaracteristicaPerdida(key) || asigs[key] !== null);
    }

    getAsignacionesGenerador(): AsignacionCaracteristicas {
        return {
            Fuerza: this.estadoFlujo.generador.asignaciones.Fuerza,
            Destreza: this.estadoFlujo.generador.asignaciones.Destreza,
            Constitucion: this.estadoFlujo.generador.asignaciones.Constitucion,
            Inteligencia: this.estadoFlujo.generador.asignaciones.Inteligencia,
            Sabiduria: this.estadoFlujo.generador.asignaciones.Sabiduria,
            Carisma: this.estadoFlujo.generador.asignaciones.Carisma,
        };
    }

    aplicarCaracteristicasGeneradas(asignaciones: AsignacionCaracteristicas): boolean {
        const razaMods = this.personajeCreacion.Raza?.Modificadores;

        if (CARACTERISTICAS_KEYS.some((key) => !this.esCaracteristicaPerdida(key) && asignaciones[key] === null)) {
            return false;
        }

        CARACTERISTICAS_KEYS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const base = perdida ? 0 : this.toNumber(asignaciones[key]);
            const final = perdida ? 0 : base + this.toNumber(razaMods?.[key]);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : this.calcularModificador(final));
        });
        this.sincronizarAliasConstitucionPerdida();

        this.estadoFlujo.caracteristicasGeneradas = true;
        this.estadoFlujo.modalCaracteristicasAbierto = false;
        this.estadoFlujo.pasoActual = 'plantillas';
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();
        this.recalcularDerivadasPorCaracteristicas();
        this.recalcularEfectosVentajas();
        return true;
    }

    recalcularEfectosVentajas(): void {
        this.recalcularPuntosVentajas();
        this.resetearAplicacionesVentajas();
        this.sincronizarBaseVentajasDesdePersonaje();

        const caracteristicasVarios = this.crearCaracteristicasVariosVacias();
        const nuevosRaciales = this.copiarRaciales(this.estadoFlujo.ventajas.baseRaciales);
        const nuevosIdiomas = this.copiarIdiomas(this.estadoFlujo.ventajas.baseIdiomas);
        const bonosHabilidades: Record<number, HabilidadBonoVario[]> = {};
        const pendientesOro: PendienteOroState[] = [];
        this.aplicarEfectosPlantillasFase2(caracteristicasVarios, nuevosRaciales, bonosHabilidades);

        const todasLasSelecciones: Array<{ detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Ventaja' | 'Desventaja'; }> = [
            ...this.estadoFlujo.ventajas.seleccionDesventajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoDesventajas.find(v => v.Id === seleccion.id),
                    seleccion,
                    claseOrigen: 'Desventaja' as const,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Desventaja'; } => !!x.detalle),
            ...this.estadoFlujo.ventajas.seleccionVentajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === seleccion.id),
                    seleccion,
                    claseOrigen: 'Ventaja' as const,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Ventaja'; } => !!x.detalle),
        ];

        todasLasSelecciones.forEach(({ detalle, seleccion }) => {
            const origen = detalle.Nombre?.trim() || `Ventaja ${detalle.Id}`;
            this.aplicarModificadoresCaracteristica(detalle, origen, caracteristicasVarios);
            this.aplicarModificadoresSalvacion(detalle, origen);
            this.aplicarModificadorIniciativa(detalle, origen);
            this.aplicarModificadorHabilidad(detalle, origen, bonosHabilidades);
            this.aplicarRasgo(detalle, nuevosRaciales, origen);
            this.aplicarIdioma(detalle, seleccion, nuevosIdiomas, origen);
            this.registrarPendienteOro(detalle, origen, pendientesOro);
        });

        this.personajeCreacion.CaracteristicasVarios = caracteristicasVarios;
        this.aplicarCaracteristicasFinalesDesdeBase();
        this.estadoFlujo.ventajas.bonosHabilidades = bonosHabilidades;
        this.aplicarBonosHabilidadEnPersonaje();
        this.personajeCreacion.Raciales = nuevosRaciales;
        this.personajeCreacion.Idiomas = nuevosIdiomas;
        this.estadoFlujo.ventajas.pendientesOro = pendientesOro;
        this.personajeCreacion.Ventajas = todasLasSelecciones
            .map((x) => ({
                Nombre: `${x.detalle.Nombre ?? ''}`.trim(),
                Origen: x.claseOrigen,
            }))
            .filter((v) => v.Nombre.length > 0);

        if (this.personajeCreacion.Ventajas.length > 0) {
            this.personajeCreacion.Oficial = false;
        }
    }

    private recalcularPuntosVentajas(): void {
        const desventajas = this.estadoFlujo.ventajas.seleccionDesventajas
            .map(s => this.estadoFlujo.ventajas.catalogoDesventajas.find(d => d.Id === s.id))
            .filter((d): d is VentajaDetalle => !!d);
        const ventajas = this.estadoFlujo.ventajas.seleccionVentajas
            .map(s => this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === s.id))
            .filter((v): v is VentajaDetalle => !!v);

        const puntosDisponibles = desventajas.reduce((acc, d) => {
            const coste = this.toNumber(d.Coste);
            return acc + (coste > 0 ? coste : 0);
        }, 0);
        const puntosGastados = ventajas.reduce((acc, v) => acc + Math.abs(this.toNumber(v.Coste)), 0);
        const puntosRestantes = puntosDisponibles - puntosGastados;

        this.estadoFlujo.ventajas.puntosDisponibles = puntosDisponibles;
        this.estadoFlujo.ventajas.puntosGastados = puntosGastados;
        this.estadoFlujo.ventajas.puntosRestantes = puntosRestantes;
        this.estadoFlujo.ventajas.hayDeficit = puntosRestantes < 0;
    }

    private resetearAplicacionesVentajas(): void {
        this.personajeCreacion.CaracteristicasVarios = this.crearCaracteristicasVariosVacias();
        this.personajeCreacion.Salvaciones.fortaleza.modsVarios = [];
        this.personajeCreacion.Salvaciones.reflejos.modsVarios = [];
        this.personajeCreacion.Salvaciones.voluntad.modsVarios = [];
        this.personajeCreacion.Iniciativa_varios = [];
        this.personajeCreacion.Presa_varios = [];
        this.estadoFlujo.ventajas.bonosHabilidades = {};
        this.estadoFlujo.ventajas.pendientesOro = [];
    }

    private sincronizarBaseVentajasDesdePersonaje(): void {
        if (this.estadoFlujo.ventajas.baseCaracteristicas !== null)
            return;

        this.estadoFlujo.ventajas.baseCaracteristicas = {
            Fuerza: this.toNumber(this.personajeCreacion.Fuerza),
            Destreza: this.toNumber(this.personajeCreacion.Destreza),
            Constitucion: this.toNumber(this.personajeCreacion.Constitucion),
            Inteligencia: this.toNumber(this.personajeCreacion.Inteligencia),
            Sabiduria: this.toNumber(this.personajeCreacion.Sabiduria),
            Carisma: this.toNumber(this.personajeCreacion.Carisma),
        };
        this.estadoFlujo.ventajas.baseRaciales = this.copiarRaciales(this.personajeCreacion.Raciales);
        this.estadoFlujo.ventajas.baseIdiomas = this.copiarIdiomas(this.personajeCreacion.Idiomas);
    }

    private aplicarCaracteristicasFinalesDesdeBase(): void {
        const base = this.estadoFlujo.ventajas.baseCaracteristicas;
        if (!base)
            return;

        CARACTERISTICAS_KEYS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const minimoPlantilla = this.obtenerMinimoCaracteristicaPorPlantillas(key);
            const suma = perdida
                ? 0
                : (this.personajeCreacion.CaracteristicasVarios[key] ?? [])
                    .reduce((acc, mod) => acc + this.toNumber(mod.valor), 0);
            const finalSinMin = perdida ? 0 : this.toNumber(base[key]) + suma;
            const final = perdida ? 0 : Math.max(finalSinMin, minimoPlantilla);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : this.calcularModificador(final));
        });
        this.recalcularDerivadasPorCaracteristicas();
        this.sincronizarAliasConstitucionPerdida();
    }

    private aplicarModificadoresCaracteristica(
        detalle: VentajaDetalle,
        origen: string,
        caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>
    ): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const objetivos: CaracteristicaKey[] = [];
        if (detalle.Fuerza)
            objetivos.push('Fuerza');
        if (detalle.Destreza)
            objetivos.push('Destreza');
        if (detalle.Constitucion)
            objetivos.push('Constitucion');
        if (detalle.Inteligencia)
            objetivos.push('Inteligencia');
        if (detalle.Sabiduria)
            objetivos.push('Sabiduria');
        if (detalle.Carisma)
            objetivos.push('Carisma');

        objetivos.forEach((key) => {
            caracteristicasVarios[key].push({
                valor,
                origen,
            });
        });
    }

    private aplicarModificadoresSalvacion(detalle: VentajaDetalle, origen: string): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const registrar = (tipo: SalvacionKey) => {
            this.personajeCreacion.Salvaciones[tipo].modsVarios.push({
                valor,
                origen,
            });
        };

        if (detalle.Fortaleza)
            registrar('fortaleza');
        if (detalle.Reflejos)
            registrar('reflejos');
        if (detalle.Voluntad)
            registrar('voluntad');
    }

    private aplicarSalvacionesRaza(raza: Raza | null): void {
        const nombreRaza = `${raza?.Nombre ?? 'Raza'}`.trim() || 'Raza';
        const registrar = (tipo: SalvacionKey, valor: number, origen: string) => {
            if (!Number.isFinite(valor) || valor === 0)
                return;
            this.personajeCreacion.Salvaciones[tipo].modsVarios.push({
                valor,
                origen,
            });
        };

        registrar('fortaleza', this.toNumber(raza?.Dgs_adicionales?.Fortaleza), `${nombreRaza} DG racial`);
        registrar('reflejos', this.toNumber(raza?.Dgs_adicionales?.Reflejos), `${nombreRaza} DG racial`);
        registrar('voluntad', this.toNumber(raza?.Dgs_adicionales?.Voluntad), `${nombreRaza} DG racial`);

        const racialesRaw = raza?.Raciales;
        const raciales = Array.isArray(racialesRaw)
            ? racialesRaw
            : (racialesRaw && typeof racialesRaw === 'object' ? Object.values(racialesRaw as any) : []);
        raciales.forEach((racial: any) => {
            const nombreRacial = `${racial?.Nombre ?? racial?.nombre ?? 'Racial'}`.trim() || 'Racial';
            const origen = `${nombreRaza} - ${nombreRacial}`;
            const salvaciones = Array.isArray(racial?.Salvaciones)
                ? racial.Salvaciones
                : (racial?.Salvaciones && typeof racial.Salvaciones === 'object'
                    ? Object.values(racial.Salvaciones as any)
                    : []);

            salvaciones.forEach((item: any) => {
                const tipo = this.resolverTipoSalvacionRacial(item);
                const valor = this.resolverValorSalvacionRacial(item);
                if (!tipo || valor === null || valor === 0)
                    return;
                registrar(tipo, valor, origen);
            });
        });
    }

    private resolverTipoSalvacionRacial(item: any): SalvacionKey | null {
        const raw = `${item?.Salvacion ?? item?.salvacion ?? item?.Nombre ?? item?.nombre ?? item?.Tipo ?? item?.tipo ?? ''}`.trim();
        const normalizado = this.normalizarTexto(raw);
        if (normalizado.length < 1)
            return null;
        if (normalizado.includes('fort') || normalizado.includes('fortitude'))
            return 'fortaleza';
        if (normalizado.includes('ref') || normalizado.includes('reflex'))
            return 'reflejos';
        if (normalizado.includes('vol') || normalizado.includes('will'))
            return 'voluntad';
        return null;
    }

    private resolverValorSalvacionRacial(item: any): number | null {
        const candidatos = [
            item?.Valor,
            item?.valor,
            item?.Cantidad,
            item?.cantidad,
            item?.Modificador,
            item?.modificador,
            item?.Mejora,
            item?.mejora,
        ];

        for (const candidato of candidatos) {
            const directo = Number(candidato);
            if (Number.isFinite(directo))
                return directo;

            if (typeof candidato === 'string') {
                const match = candidato.match(/[+-]?\d+/);
                if (match && match[0]) {
                    const parsed = Number(match[0]);
                    if (Number.isFinite(parsed))
                        return parsed;
                }
            }
        }

        return null;
    }

    private aplicarModificadorIniciativa(detalle: VentajaDetalle, origen: string): void {
        if (!detalle.Iniciativa)
            return;

        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        this.personajeCreacion.Iniciativa_varios.push({
            Valor: valor,
            Origen: origen,
        });
    }

    private aplicarModificadorHabilidad(
        detalle: VentajaDetalle,
        origen: string,
        bonosHabilidades: Record<number, HabilidadBonoVario[]>
    ): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const habilidadObjetivo = this.buscarHabilidadEnPersonaje(detalle);
        if (!habilidadObjetivo)
            return;

        const id = this.toNumber(habilidadObjetivo.Id);
        if (!bonosHabilidades[id])
            bonosHabilidades[id] = [];

        bonosHabilidades[id].push({
            valor,
            origen,
        });
    }

    private buscarHabilidadEnPersonaje(detalle: VentajaDetalle): Personaje['Habilidades'][number] | null {
        const idObjetivo = this.toNumber(detalle.Habilidad?.Id);
        if (idObjetivo > 0) {
            const porId = this.personajeCreacion.Habilidades.find(h => this.toNumber(h.Id) === idObjetivo);
            if (porId)
                return porId;
        }

        const nombreObjetivo = this.normalizarTexto(detalle.Habilidad?.Nombre ?? '');
        if (nombreObjetivo.length < 1)
            return null;

        return this.personajeCreacion.Habilidades.find((h) => this.normalizarTexto(h.Nombre) === nombreObjetivo) ?? null;
    }

    private aplicarBonosHabilidadEnPersonaje(): void {
        this.actualizarModsHabilidadesPorCaracteristica();
        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades.map((h) => {
            const bonos = this.estadoFlujo.ventajas.bonosHabilidades[this.toNumber(h.Id)] ?? [];
            const rangosVarios = bonos.reduce((acc, b) => acc + this.toNumber(b.valor), 0);
            const diversos = bonos.map((b) => `${b.origen} ${b.valor > 0 ? '+' : ''}${b.valor}`).join(', ');
            return {
                ...h,
                Rangos_varios: rangosVarios,
                Varios: diversos,
                Bonos_varios: bonos,
            };
        });
    }

    private aplicarRasgo(detalle: VentajaDetalle, raciales: RacialDetalle[], origen: string): void {
        const nombre = `${detalle.Rasgo?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const existe = raciales.some(r => this.normalizarTexto(r.Nombre) === this.normalizarTexto(nombre));
        if (!existe) {
            const nuevoRasgo = createRacialPlaceholder(nombre);
            nuevoRasgo.Origen = origen;
            raciales.push(nuevoRasgo);
        }
    }

    private aplicarIdioma(
        detalle: VentajaDetalle,
        seleccion: SeleccionVentajaState,
        idiomas: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[],
        origen: string
    ): void {
        if (detalle.Idioma_extra) {
            if (!seleccion.idioma)
                return;

            const nombre = `${seleccion.idioma.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            if (idiomas.some(i => this.normalizarTexto(i.Nombre) === this.normalizarTexto(nombre)))
                return;

            idiomas.push({
                Nombre: nombre,
                Descripcion: `${seleccion.idioma.Descripcion ?? ''}`.trim(),
                Secreto: !!seleccion.idioma.Secreto,
                Oficial: !!seleccion.idioma.Oficial,
                Origen: origen,
            });
            return;
        }

        const nombreIdioma = `${detalle.Idioma?.Nombre ?? ''}`.trim();
        if (nombreIdioma.length < 1)
            return;
        if (idiomas.some(i => this.normalizarTexto(i.Nombre) === this.normalizarTexto(nombreIdioma)))
            return;

        idiomas.push({
            Nombre: nombreIdioma,
            Descripcion: `${detalle.Idioma?.Descripcion ?? ''}`.trim(),
            Secreto: false,
            Oficial: detalle.Oficial !== false,
            Origen: origen,
        });
    }

    private registrarPendienteOro(detalle: VentajaDetalle, origen: string, pendientes: PendienteOroState[]): void {
        if (detalle.Duplica_oro) {
            pendientes.push({
                tipo: 'Duplica_oro',
                origen,
            });
        }
        if (detalle.Aumenta_oro) {
            pendientes.push({
                tipo: 'Aumenta_oro',
                origen,
            });
        }
    }

    private aplicarEfectosPlantillasFase2(
        caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>,
        raciales: RacialDetalle[],
        bonosHabilidades: Record<number, HabilidadBonoVario[]>
    ): void {
        const seleccionadas = this.estadoFlujo.plantillas.seleccionadas;
        const raza = this.razaSeleccionada;

        this.personajeCreacion.Correr = this.toNumber(raza?.Correr);
        this.personajeCreacion.Nadar = this.toNumber(raza?.Nadar);
        this.personajeCreacion.Volar = this.toNumber(raza?.Volar);
        this.personajeCreacion.Trepar = this.toNumber(raza?.Trepar);
        this.personajeCreacion.Escalar = this.toNumber(raza?.Escalar);

        this.personajeCreacion.Rds = [];
        this.personajeCreacion.Rcs = [];
        this.personajeCreacion.Res = [];

        if (this.esTextoReglaValido(`${raza?.Reduccion_dano ?? ''}`)) {
            this.personajeCreacion.Rds.push({
                Modificador: `${raza?.Reduccion_dano ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }
        if (this.esTextoReglaValido(`${raza?.Resistencia_magica ?? ''}`)) {
            this.personajeCreacion.Rcs.push({
                Modificador: `${raza?.Resistencia_magica ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }
        if (this.esTextoReglaValido(`${raza?.Resistencia_energia ?? ''}`)) {
            this.personajeCreacion.Res.push({
                Modificador: `${raza?.Resistencia_energia ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }
        this.aplicarHabilidadesOtorgadasPorRaza(raza, bonosHabilidades);
        this.aplicarSalvacionesRaza(raza);

        const ataqueClases = this.calcularAtaqueBaseDesdeClases();
        let ataqueBase = this.toNumber(raza?.Dgs_adicionales?.Ataque_base) + ataqueClases;
        let armaduraNatural = this.toNumber(raza?.Armadura_natural);
        let caVarios = this.toNumber(raza?.Varios_armadura);
        let dadoGolpe = this.resolverDadoGolpeTipoActual();
        let pgsLicantronia = 0;

        const hayReglasAlineamiento = seleccionadas.some((plantilla) => this.tieneRestriccionAlineamientoPlantilla(plantilla));
        if (hayReglasAlineamiento) {
            const alineamientoResuelto = resolverAlineamientoPlantillas(this.personajeCreacion.Alineamiento, seleccionadas);
            if (!alineamientoResuelto.conflicto && this.normalizarTexto(alineamientoResuelto.alineamiento).length > 0)
                this.personajeCreacion.Alineamiento = alineamientoResuelto.alineamiento;
        }

        seleccionadas.forEach((plantilla) => {
            const origen = `${plantilla?.Nombre ?? ''}`.trim() || `Plantilla ${this.toNumber(plantilla?.Id)}`;
            ataqueBase += this.toNumber(plantilla?.Ataque_base);

            if (this.toNumber(plantilla?.Movimientos?.Correr) > 0)
                this.personajeCreacion.Correr = this.toNumber(plantilla.Movimientos.Correr);
            if (this.toNumber(plantilla?.Movimientos?.Nadar) > 0)
                this.personajeCreacion.Nadar = this.toNumber(plantilla.Movimientos.Nadar);
            if (this.toNumber(plantilla?.Movimientos?.Volar) > 0)
                this.personajeCreacion.Volar = this.toNumber(plantilla.Movimientos.Volar);
            if (this.toNumber(plantilla?.Movimientos?.Trepar) > 0)
                this.personajeCreacion.Trepar = this.toNumber(plantilla.Movimientos.Trepar);
            if (this.toNumber(plantilla?.Movimientos?.Escalar) > 0)
                this.personajeCreacion.Escalar = this.toNumber(plantilla.Movimientos.Escalar);

            if (this.toNumber(plantilla?.Fortaleza) !== 0) {
                this.personajeCreacion.Salvaciones.fortaleza.modsVarios.push({
                    valor: this.toNumber(plantilla.Fortaleza),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Reflejos) !== 0) {
                this.personajeCreacion.Salvaciones.reflejos.modsVarios.push({
                    valor: this.toNumber(plantilla.Reflejos),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Voluntad) !== 0) {
                this.personajeCreacion.Salvaciones.voluntad.modsVarios.push({
                    valor: this.toNumber(plantilla.Voluntad),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Iniciativa) !== 0) {
                this.personajeCreacion.Iniciativa_varios.push({
                    Valor: this.toNumber(plantilla.Iniciativa),
                    Origen: origen,
                });
            }
            if (this.toNumber(plantilla?.Presa) !== 0) {
                this.personajeCreacion.Presa_varios.push({
                    Valor: this.toNumber(plantilla.Presa),
                    Origen: origen,
                });
            }

            CARACTERISTICAS_KEYS.forEach((key) => {
                const valor = this.toNumber((plantilla?.Modificadores_caracteristicas as Record<string, any>)?.[key]);
                if (valor !== 0) {
                    caracteristicasVarios[key].push({
                        valor,
                        origen,
                    });
                }
            });

            const textoCa = `${plantilla?.Ca ?? ''}`.trim();
            const valorCa = this.extraerPrimerEnteroConSigno(textoCa);
            if (valorCa !== 0) {
                const normalizado = this.normalizarTexto(textoCa);
                if (normalizado.includes('natural'))
                    armaduraNatural += valorCa;
                else
                    caVarios += valorCa;
            }

            if (this.esTextoReglaValido(`${plantilla?.Reduccion_dano ?? ''}`)) {
                this.personajeCreacion.Rds.push({
                    Modificador: `${plantilla?.Reduccion_dano ?? ''}`.trim(),
                    Origen: origen,
                });
            }
            if (this.esTextoReglaValido(`${plantilla?.Resistencia_conjuros ?? ''}`)) {
                this.personajeCreacion.Rcs.push({
                    Modificador: `${plantilla?.Resistencia_conjuros ?? ''}`.trim(),
                    Origen: origen,
                });
            }
            if (this.esTextoReglaValido(`${plantilla?.Resistencia_elemental ?? ''}`)) {
                this.personajeCreacion.Res.push({
                    Modificador: `${plantilla?.Resistencia_elemental ?? ''}`.trim(),
                    Origen: origen,
                });
            }

            this.agregarRacialPlantillaTexto(raciales, `${plantilla?.Ataques ?? ''}`, origen, 'Ataques');
            this.agregarRacialPlantillaTexto(raciales, `${plantilla?.Ataque_completo ?? ''}`, origen, 'Ataque completo');

            (plantilla?.Habilidades ?? []).forEach((habilidadRef) => {
                const rangos = this.toNumber(habilidadRef?.Rangos);
                if (rangos === 0)
                    return;

                const habilidad = this.asegurarHabilidadDesdePlantilla(habilidadRef);
                if (!habilidad)
                    return;

                const idHabilidad = this.toNumber(habilidad.Id);
                if (idHabilidad <= 0)
                    return;

                if (!bonosHabilidades[idHabilidad])
                    bonosHabilidades[idHabilidad] = [];
                bonosHabilidades[idHabilidad].push({
                    valor: rangos,
                    origen,
                });
            });

            const dadoDirecto = this.resolverDadoDesdePlantilla(plantilla);
            if (dadoDirecto > 0)
                dadoGolpe = dadoDirecto;
            const pasoDado = this.toNumber(plantilla?.Modificacion_dg?.Id_paso_modificacion);
            if (pasoDado !== 0)
                dadoGolpe = this.aplicarPasoDado(dadoGolpe, pasoDado);

            // Regla de negocio: Suma licantrópica incrementa PGs finales, no DGs adicionales.
            pgsLicantronia += this.toNumber(plantilla?.Licantronia_dg?.Suma);
        });

        this.personajeCreacion.Ataque_base = `${ataqueBase}`;
        this.personajeCreacion.Armadura_natural = armaduraNatural;
        this.personajeCreacion.Ca_varios = caVarios;
        this.personajeCreacion.Dados_golpe = dadoGolpe;
        this.personajeCreacion.Pgs_lic = Math.max(0, pgsLicantronia);

        this.recalcularDerivadasEconomiaYProgresion(seleccionadas);
    }

    private esHabilidadClaseaParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        if (habilidad.Clasea)
            return true;
        const id = this.toNumber(habilidad?.Id);
        if (id <= 0)
            return false;
        return this.estadoFlujo.habilidades.classSkillTemporales.includes(id);
    }

    private esHabilidadEntrenadaNoClaseaParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        return !!habilidad?.Entrenada && !this.esHabilidadClaseaParaSesion(habilidad);
    }

    private esExtraHabilidadPendienteParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!this.esHabilidadClaseaParaSesion(habilidad))
            return false;
        if (!this.toBooleanValue(habilidad?.Soporta_extra))
            return false;

        return this.esExtraHabilidadPendienteValor(this.normalizarTexto(`${habilidad?.Extra ?? ''}`));
    }

    private esExtraHabilidadPendienteValor(extraNormalizado: string): boolean {
        return extraNormalizado.length < 1 || EXTRA_HABILIDAD_VALORES_PENDIENTES.has(extraNormalizado);
    }

    private getClaveGrupoExtraHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const id = this.toNumber(habilidad?.Id);
        const nombre = `${habilidad?.Nombre ?? ''}`;
        const familia = this.resolverFamiliaRepetiblePorReferencia(id, nombre);
        if (familia)
            return `familia:${familia}`;

        const base = this.normalizarTexto(nombre).replace(/\s+\d+$/, '').trim();
        if (base.length > 0)
            return `nombre:${base}`;
        if (id > 0)
            return `id:${id}`;
        return '';
    }

    private existeExtraDuplicadoEnGrupoParaSesion(
        habilidadObjetivo: Personaje['Habilidades'][number],
        extraNormalizadoObjetivo: string
    ): boolean {
        if (this.esExtraHabilidadPendienteValor(extraNormalizadoObjetivo))
            return false;

        const claveGrupo = this.getClaveGrupoExtraHabilidad(habilidadObjetivo);
        if (claveGrupo.length < 1)
            return false;
        const idObjetivo = this.toNumber(habilidadObjetivo?.Id);

        return this.personajeCreacion.Habilidades.some((habilidad) => {
            if (this.toNumber(habilidad?.Id) === idObjetivo)
                return false;
            if (!this.esHabilidadClaseaParaSesion(habilidad))
                return false;
            if (!this.toBooleanValue(habilidad?.Soporta_extra))
                return false;
            if (this.getClaveGrupoExtraHabilidad(habilidad) !== claveGrupo)
                return false;
            const extraNormalizado = this.normalizarTexto(`${habilidad?.Extra ?? ''}`);
            if (this.esExtraHabilidadPendienteValor(extraNormalizado))
                return false;
            return extraNormalizado === extraNormalizadoObjetivo;
        });
    }

    private hayExtrasDuplicadosClaseosParaSesion(): boolean {
        const vistos = new Set<string>();

        for (const habilidad of (this.personajeCreacion.Habilidades ?? [])) {
            if (!this.esHabilidadClaseaParaSesion(habilidad))
                continue;
            if (!this.toBooleanValue(habilidad?.Soporta_extra))
                continue;

            const extraNormalizado = this.normalizarTexto(`${habilidad?.Extra ?? ''}`);
            if (this.esExtraHabilidadPendienteValor(extraNormalizado))
                continue;

            const claveGrupo = this.getClaveGrupoExtraHabilidad(habilidad);
            if (claveGrupo.length < 1)
                continue;

            const clave = `${claveGrupo}|${extraNormalizado}`;
            if (vistos.has(clave))
                return true;
            vistos.add(clave);
        }

        return false;
    }

    private resolverFamiliaRepetiblePorReferencia(idHabilidad: number, nombre: string): HabilidadFamiliaRepetibleKey | null {
        const id = this.toNumber(idHabilidad);
        const nombreNorm = this.normalizarTexto(nombre);

        const familias = Object.entries(HABILIDAD_FAMILIAS_REPETIBLES) as Array<[
            HabilidadFamiliaRepetibleKey,
            typeof HABILIDAD_FAMILIAS_REPETIBLES[HabilidadFamiliaRepetibleKey]
        ]>;

        for (const [key, config] of familias) {
            const ids = (config.ids as readonly number[]);
            if (ids.includes(id))
                return key;
            if (config.patrones.some((patron) => nombreNorm.startsWith(patron)))
                return key;
        }

        return null;
    }

    private obtenerSlotsFamiliaRepetible(familia: HabilidadFamiliaRepetibleKey): Personaje['Habilidades'][number][] {
        const config = HABILIDAD_FAMILIAS_REPETIBLES[familia];
        const ids = [...(config.ids as readonly number[])];

        const slots = this.personajeCreacion.Habilidades.filter((habilidad) => {
            const id = this.toNumber(habilidad?.Id);
            if (ids.includes(id))
                return true;
            return this.resolverFamiliaRepetiblePorReferencia(id, `${habilidad?.Nombre ?? ''}`) === familia;
        });

        return slots.sort((a, b) => {
            const idxA = ids.indexOf(this.toNumber(a?.Id));
            const idxB = ids.indexOf(this.toNumber(b?.Id));
            if (idxA !== idxB)
                return idxA - idxB;
            return `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' });
        }).slice(0, config.maxSlots);
    }

    private esSlotHabilidadOcupado(habilidad: Personaje['Habilidades'][number] | null | undefined): boolean {
        if (!habilidad)
            return true;
        return this.toNumber(habilidad?.Rangos) > 0
            || this.toNumber(habilidad?.Rangos_varios) > 0
            || !!habilidad?.Clasea;
    }

    private resolverSlotFamiliaParaOtorgamiento(
        familia: HabilidadFamiliaRepetibleKey,
        preferida: Personaje['Habilidades'][number] | null
    ): Personaje['Habilidades'][number] | null {
        const slots = this.obtenerSlotsFamiliaRepetible(familia);
        if (slots.length < 1)
            return preferida;

        const preferidaId = this.toNumber(preferida?.Id);
        if (preferida && slots.some((item) => this.toNumber(item?.Id) === preferidaId) && !this.esSlotHabilidadOcupado(preferida))
            return preferida;

        const libre = slots.find((slot) => !this.esSlotHabilidadOcupado(slot));
        return libre ?? null;
    }

    private asegurarHabilidadDesdeReferencia(
        referencia: Record<string, any>,
        opciones: {
            customPreferido?: boolean;
            marcarClasea?: boolean;
            expandirFamiliaConDuplicados?: boolean;
            extraFallback?: string;
            variosFallback?: string;
        } = {}
    ): Personaje['Habilidades'][number] | null {
        const idObjetivoRaw = this.toNumber(
            referencia?.['Id_habilidad'] ?? referencia?.['id_habilidad'] ?? referencia?.['Id'] ?? referencia?.['id']
        );
        const nombreObjetivo = `${referencia?.['Habilidad'] ?? referencia?.['habilidad'] ?? referencia?.['Nombre'] ?? referencia?.['nombre'] ?? ''}`.trim();
        const nombreNorm = this.normalizarTexto(nombreObjetivo);
        const catalogo = this.buscarDefinicionHabilidadCatalogo(idObjetivoRaw, nombreNorm, !!opciones.customPreferido);
        const detalleCatalogo = catalogo.detalle;
        const idObjetivoCatalogo = this.toNumber(detalleCatalogo?.Id_habilidad);
        const idObjetivo = idObjetivoRaw > 0 ? idObjetivoRaw : idObjetivoCatalogo;

        const custom = !!(opciones.customPreferido || referencia?.['Custom'] || referencia?.['custom'] || catalogo.esCustom);
        const marcarClasea = opciones.marcarClasea !== false;
        const expandirFamiliaConDuplicados = opciones.expandirFamiliaConDuplicados !== false;
        const entrenada = this.toBooleanValue(
            referencia?.['Entrenada'] ?? referencia?.['entrenada'] ?? detalleCatalogo?.Entrenada
        );
        const idCaracteristica = this.toNumber(
            referencia?.['Id_caracteristica'] ?? referencia?.['id_caracteristica']
            ?? referencia?.['IdCaracteristica'] ?? referencia?.['idCaracteristica']
            ?? detalleCatalogo?.Id_caracteristica
        );
        const textoCaracteristica = `${referencia?.['Caracteristica'] ?? referencia?.['caracteristica'] ?? detalleCatalogo?.Caracteristica ?? ''}`.trim();
        const soportaExtra = this.toBooleanValue(
            referencia?.['Soporta_extra'] ?? referencia?.['soporta_extra'] ?? detalleCatalogo?.Soporta_extra
        );
        const extras = this.resolverExtrasHabilidadDesdeReferencia(referencia, detalleCatalogo);
        const extraFijoReferencia = this.resolverExtraFijoDesdeReferencia(referencia, extras);
        const keyCar = this.resolverCaracteristicaPorIdOTexto(idCaracteristica, textoCaracteristica);

        let existente: Personaje['Habilidades'][number] | null = null;
        if (idObjetivo > 0) {
            existente = this.personajeCreacion.Habilidades.find((h) => this.toNumber(h.Id) === idObjetivo) ?? null;
        }
        if (!existente && nombreNorm.length > 0) {
            existente = this.personajeCreacion.Habilidades
                .find((h) => this.normalizarTexto(h.Nombre) === nombreNorm) ?? null;
        }

        const familia = this.resolverFamiliaRepetiblePorReferencia(idObjetivo, nombreObjetivo);
        if (familia) {
            if (!expandirFamiliaConDuplicados && existente && this.toBooleanValue(existente?.Clasea))
                return existente;
            const slotFamilia = this.resolverSlotFamiliaParaOtorgamiento(familia, existente);
            if (slotFamilia) {
                if (marcarClasea)
                    slotFamilia.Clasea = true;
                slotFamilia.Entrenada = slotFamilia.Entrenada === true || entrenada;
                if (custom)
                    slotFamilia.Custom = true;
                if (soportaExtra)
                    slotFamilia.Soporta_extra = true;
                if ((slotFamilia.Extras ?? []).length < 1 && extras.length > 0)
                    slotFamilia.Extras = extras;
                if (`${slotFamilia.Car ?? ''}`.trim().length < 1) {
                    slotFamilia.Car = this.etiquetaCaracteristica(keyCar, textoCaracteristica);
                    slotFamilia.Mod_car = this.modificadorPorCaracteristica(keyCar);
                }
                if (extraFijoReferencia.bloqueado) {
                    slotFamilia.Extra = extraFijoReferencia.valor;
                    slotFamilia.Extra_bloqueado = true;
                }
                return slotFamilia;
            }
            if (existente && this.esSlotHabilidadOcupado(existente))
                return null;
        }

        if (existente) {
            if (marcarClasea)
                existente.Clasea = true;
            existente.Entrenada = existente.Entrenada === true || entrenada;
            if (custom)
                existente.Custom = true;
            if (soportaExtra)
                existente.Soporta_extra = true;
            if ((existente.Extras ?? []).length < 1 && extras.length > 0)
                existente.Extras = extras;
            if (`${existente.Car ?? ''}`.trim().length < 1) {
                existente.Car = this.etiquetaCaracteristica(keyCar, textoCaracteristica);
                existente.Mod_car = this.modificadorPorCaracteristica(keyCar);
            }
            if (extraFijoReferencia.bloqueado) {
                existente.Extra = extraFijoReferencia.valor;
                existente.Extra_bloqueado = true;
            }
            return existente;
        }

        if (idObjetivo <= 0 && nombreNorm.length < 1)
            return null;

        const nuevoId = idObjetivo > 0 ? idObjetivo : this.getNuevoIdHabilidad();
        const nuevoNombre = nombreObjetivo.length > 0
            ? nombreObjetivo
            : (`${detalleCatalogo?.Nombre ?? ''}`.trim().length > 0 ? `${detalleCatalogo?.Nombre ?? ''}`.trim() : `Habilidad ${nuevoId}`);

        const nuevaHabilidad: Personaje['Habilidades'][number] = {
            Id: nuevoId,
            Nombre: nuevoNombre,
            Clasea: marcarClasea,
            Entrenada: entrenada,
            Car: this.etiquetaCaracteristica(keyCar, textoCaracteristica),
            Mod_car: this.modificadorPorCaracteristica(keyCar),
            Rangos: 0,
            Rangos_varios: 0,
            Extra: extraFijoReferencia.bloqueado
                ? extraFijoReferencia.valor
                : `${referencia?.['Extra'] ?? referencia?.['extra'] ?? opciones.extraFallback ?? ''}`,
            Extra_bloqueado: extraFijoReferencia.bloqueado,
            Varios: `${referencia?.['Varios'] ?? referencia?.['varios'] ?? opciones.variosFallback ?? ''}`,
            Custom: custom,
            Soporta_extra: soportaExtra,
            Extras: extras,
            Bonos_varios: [],
        };

        this.personajeCreacion.Habilidades = [
            ...this.personajeCreacion.Habilidades,
            nuevaHabilidad,
        ].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));

        return this.personajeCreacion.Habilidades
            .find((h) => this.toNumber(h.Id) === nuevoId || this.normalizarTexto(h.Nombre) === this.normalizarTexto(nuevoNombre))
            ?? null;
    }

    private buscarDefinicionHabilidadCatalogo(
        idObjetivo: number,
        nombreNorm: string,
        preferCustom: boolean
    ): { detalle: HabilidadBasicaDetalle | null; esCustom: boolean; } {
        const buscarEn = (catalogo: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle | null => {
            if (idObjetivo > 0) {
                const porId = catalogo.find((h) => this.toNumber(h?.Id_habilidad) === idObjetivo) ?? null;
                if (porId)
                    return porId;
            }
            if (nombreNorm.length > 0) {
                return catalogo.find((h) => this.normalizarTexto(h?.Nombre ?? '') === nombreNorm) ?? null;
            }
            return null;
        };

        const orden: Array<{ catalogo: HabilidadBasicaDetalle[]; esCustom: boolean; }> = preferCustom
            ? [
                { catalogo: this.estadoFlujo.ventajas.catalogoHabilidadesCustom, esCustom: true },
                { catalogo: this.estadoFlujo.ventajas.catalogoHabilidades, esCustom: false },
            ]
            : [
                { catalogo: this.estadoFlujo.ventajas.catalogoHabilidades, esCustom: false },
                { catalogo: this.estadoFlujo.ventajas.catalogoHabilidadesCustom, esCustom: true },
            ];

        for (const item of orden) {
            const encontrado = buscarEn(item.catalogo ?? []);
            if (encontrado)
                return { detalle: encontrado, esCustom: item.esCustom };
        }

        return { detalle: null, esCustom: false };
    }

    private resolverExtrasHabilidadDesdeReferencia(
        referencia: Record<string, any>,
        detalleCatalogo: HabilidadBasicaDetalle | null
    ): Array<{ Id_extra: number; Extra: string; Descripcion: string; }> {
        const extrasRaw = Array.isArray(referencia?.['Extras'])
            ? referencia['Extras']
            : (referencia?.['Extras'] && typeof referencia['Extras'] === 'object')
                ? Object.values(referencia['Extras'])
                : [];

        const extrasReferencia = extrasRaw
            .map((extra: any) => ({
                Id_extra: this.toNumber(extra?.Id_extra ?? extra?.id_extra ?? extra?.Id ?? extra?.id),
                Extra: `${extra?.Extra ?? extra?.extra ?? extra?.Nombre ?? extra?.nombre ?? ''}`.trim(),
                Descripcion: `${extra?.Descripcion ?? extra?.descripcion ?? ''}`.trim(),
            }))
            .filter((extra) => extra.Id_extra > 0 || extra.Extra.length > 0 || extra.Descripcion.length > 0);
        if (extrasReferencia.length > 0)
            return extrasReferencia;

        return (detalleCatalogo?.Extras ?? []).map((extra) => ({
            Id_extra: this.toNumber(extra?.Id_extra),
            Extra: `${extra?.Extra ?? ''}`.trim(),
            Descripcion: `${extra?.Descripcion ?? ''}`.trim(),
        }));
    }

    private resolverExtraFijoDesdeReferencia(
        referencia: Record<string, any>,
        extrasDisponibles: Array<{ Id_extra: number; Extra: string; Descripcion: string; }>
    ): { bloqueado: boolean; valor: string; } {
        const extraRaw = `${referencia?.['Extra'] ?? referencia?.['extra'] ?? ''}`.trim();
        const extraNorm = this.normalizarTexto(extraRaw);
        if (extraRaw.length > 0 && !this.esExtraHabilidadPendienteValor(extraNorm))
            return { bloqueado: true, valor: extraRaw };

        const idExtra = this.toNumber(
            referencia?.['Id_extra'] ?? referencia?.['id_extra'] ?? referencia?.['IdExtra'] ?? referencia?.['idExtra']
        );
        if (idExtra <= 0)
            return { bloqueado: false, valor: '' };

        const encontrado = extrasDisponibles.find((item) => this.toNumber(item?.Id_extra) === idExtra);
        const valor = `${encontrado?.Extra ?? ''}`.trim();
        const valorNorm = this.normalizarTexto(valor);
        if (valor.length > 0 && !this.esExtraHabilidadPendienteValor(valorNorm))
            return { bloqueado: true, valor };

        return { bloqueado: false, valor: '' };
    }

    private aplicarHabilidadesOtorgadasPorRaza(
        raza: Raza | null,
        bonosHabilidades: Record<number, HabilidadBonoVario[]>
    ): void {
        const origen = `${raza?.Nombre ?? 'Raza'}`.trim() || 'Raza';
        const habilidadesRaza = raza?.Habilidades;
        const baseRefs = (habilidadesRaza?.Base ?? []) as Record<string, any>[];
        const customRefs = (habilidadesRaza?.Custom ?? []) as Record<string, any>[];
        const refs = [
            ...baseRefs.map((ref) => ({ raw: ref, custom: false })),
            ...customRefs.map((ref) => ({ raw: ref, custom: true })),
        ];
        if (refs.length < 1)
            return;

        refs.forEach(({ raw, custom }) => {
            const habilidad = this.asegurarHabilidadDesdeRaza(raw, custom);
            if (!habilidad)
                return;

            habilidad.Clasea = true;
            if (custom)
                habilidad.Custom = true;

            const cantidad = this.toNumber(raw['Cantidad'] ?? raw['cantidad'] ?? raw['Rangos'] ?? raw['rangos']);
            if (cantidad === 0)
                return;

            const idHabilidad = this.toNumber(habilidad.Id);
            if (idHabilidad <= 0)
                return;
            if (!bonosHabilidades[idHabilidad])
                bonosHabilidades[idHabilidad] = [];
            bonosHabilidades[idHabilidad].push({
                valor: cantidad,
                origen,
            });
        });
    }

    private asegurarHabilidadDesdeRaza(
        habilidadRef: Record<string, any>,
        customPreferido: boolean
    ): Personaje['Habilidades'][number] | null {
        return this.asegurarHabilidadDesdeReferencia(habilidadRef, {
            customPreferido,
            marcarClasea: true,
            expandirFamiliaConDuplicados: false,
        });
    }

    private obtenerNivelActualClase(nombreClase: string): number {
        const nombreNorm = this.normalizarTexto(nombreClase);
        if (nombreNorm.length < 1)
            return 0;
        const encontrada = (this.personajeCreacion.desgloseClases ?? [])
            .find((clase) => this.normalizarTexto(clase?.Nombre ?? '') === nombreNorm);
        return this.toNumber(encontrada?.Nivel);
    }

    private obtenerSiguienteNivelClase(nombreClase: string): number {
        return this.obtenerNivelActualClase(nombreClase) + 1;
    }

    private obtenerDetalleNivelClase(clase: Clase, nivel: number): ClaseNivelDetalle | null {
        const nivelNormalizado = Math.max(1, Math.trunc(this.toNumber(nivel)));
        return (clase?.Desglose_niveles ?? [])
            .find((item) => this.toNumber(item?.Nivel) === nivelNormalizado) ?? null;
    }

    private actualizarDesgloseClase(nombreClase: string, nivel: number): void {
        const nombre = `${nombreClase ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const nombreNorm = this.normalizarTexto(nombre);
        const nivelNormalizado = Math.max(1, Math.trunc(this.toNumber(nivel)));
        const desglose = [...(this.personajeCreacion.desgloseClases ?? [])];
        const index = desglose.findIndex((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);

        if (index >= 0) {
            desglose[index] = {
                Nombre: desglose[index].Nombre,
                Nivel: nivelNormalizado,
            };
        } else {
            desglose.push({
                Nombre: nombre,
                Nivel: nivelNormalizado,
            });
        }

        this.personajeCreacion.desgloseClases = desglose;
        this.regenerarTextoClasesDesdeDesglose();
    }

    private regenerarTextoClasesDesdeDesglose(): void {
        const texto = (this.personajeCreacion.desgloseClases ?? [])
            .map((clase) => {
                const nombre = `${clase?.Nombre ?? ''}`.trim();
                const nivel = this.toNumber(clase?.Nivel);
                if (nombre.length < 1 || nivel <= 0)
                    return '';
                return `${nombre} (${nivel})`;
            })
            .filter((item) => item.length > 0)
            .join(', ');
        this.personajeCreacion.Clases = texto;
    }

    private aplicarDeltaAtaqueBaseClase(
        nombreClase: string,
        nivel: number,
        detalleSiguiente: ClaseNivelDetalle,
        detalleAnterior: ClaseNivelDetalle | null
    ): void {
        const ataqueSiguiente = this.extraerPrimerEnteroConSigno(detalleSiguiente?.Ataque_base ?? '');
        const ataqueAnterior = detalleAnterior
            ? this.extraerPrimerEnteroConSigno(detalleAnterior?.Ataque_base ?? '')
            : 0;
        const delta = ataqueSiguiente - ataqueAnterior;
        if (delta === 0)
            return;

        const ataqueActual = this.extraerPrimerEnteroConSigno(this.personajeCreacion.Ataque_base);
        this.personajeCreacion.Ataque_base = `${ataqueActual + delta}`;
    }

    private aplicarDeltaSalvacionesClase(
        nombreClase: string,
        nivel: number,
        detalleSiguiente: ClaseNivelDetalle,
        detalleAnterior: ClaseNivelDetalle | null
    ): void {
        const origen = `${nombreClase} nivel ${nivel}`;
        const definiciones: Array<{ key: SalvacionKey; campo: 'Fortaleza' | 'Reflejos' | 'Voluntad'; }> = [
            { key: 'fortaleza', campo: 'Fortaleza' },
            { key: 'reflejos', campo: 'Reflejos' },
            { key: 'voluntad', campo: 'Voluntad' },
        ];

        definiciones.forEach(({ key, campo }) => {
            const siguiente = this.extraerPrimerEnteroConSigno(detalleSiguiente?.Salvaciones?.[campo] ?? '');
            const previo = detalleAnterior
                ? this.extraerPrimerEnteroConSigno(detalleAnterior?.Salvaciones?.[campo] ?? '')
                : 0;
            const delta = siguiente - previo;
            if (delta === 0)
                return;
            this.personajeCreacion.Salvaciones[key].modsClaseos.push({
                valor: delta,
                origen,
            });
        });
    }

    private aplicarHabilidadesPrimerNivelClase(clase: Clase): void {
        const refsBase = (clase?.Habilidades?.Base ?? []);
        const refsCustom = (clase?.Habilidades?.Custom ?? []);
        if (refsBase.length < 1 && refsCustom.length < 1)
            return;

        refsBase.forEach((ref) => {
            const raw = ref as Record<string, any>;
            this.asegurarHabilidadDesdeReferencia(raw, {
                marcarClasea: true,
                customPreferido: false,
            });
        });

        refsCustom.forEach((ref) => {
            const raw = ref as Record<string, any>;
            this.asegurarHabilidadDesdeReferencia(raw, {
                marcarClasea: true,
                customPreferido: true,
            });
        });

        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades
            .slice()
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private getNuevoIdHabilidad(): number {
        return (this.personajeCreacion.Habilidades ?? [])
            .reduce((maximo, habilidad) => Math.max(maximo, this.toNumber(habilidad?.Id)), 0) + 1;
    }

    private aplicarIdiomasPrimerNivelClase(clase: Clase): void {
        this.aplicarIdiomasAutomaticos(`${clase.Nombre} nivel 1`, clase?.Idiomas ?? []);
    }

    private resolverCantidadDominiosNivelClase(
        clase: Clase,
        detalleSiguiente: ClaseNivelDetalle,
        siguienteNivel: number
    ): number {
        const detalleRaw = detalleSiguiente as Record<string, any>;
        const claseRaw = clase as Record<string, any>;
        const conjurosRaw = (clase?.Conjuros ?? {}) as Record<string, any>;
        const candidatos = [
            detalleRaw?.['Dominio'],
            detalleRaw?.['Dominio_cantidad'],
            detalleRaw?.['Cantidad_dominio'],
            detalleRaw?.['Dominios'],
            detalleRaw?.['Cantidad_dominios'],
            conjurosRaw?.['Dominio_cantidad'],
            conjurosRaw?.['Cantidad_dominio'],
            conjurosRaw?.['Dominios'],
            conjurosRaw?.['Cantidad_dominios'],
            claseRaw?.['Dominio'],
            claseRaw?.['Dominios'],
            claseRaw?.['Dominio_cantidad'],
            claseRaw?.['Cantidad_dominio'],
            claseRaw?.['Cantidad_dominios'],
        ];

        for (const candidato of candidatos) {
            const valor = Math.trunc(this.toNumber(candidato));
            if (valor > 0)
                return valor;
        }

        if (siguienteNivel === 1 && !!clase?.Conjuros?.Dominio)
            return 1;
        return 0;
    }

    private resolverDominiosDisponiblesClase(_clase: Clase): ClaseDominioPendiente[] {
        const dominiosPropiosDeidad = this.obtenerDominiosDeidadSeleccionada();
        const fuente = dominiosPropiosDeidad.length > 0
            ? dominiosPropiosDeidad
            : this.catalogoDominios;
        const excluirHomebrew = this.personajeCreacion.Oficial !== false;
        const dominiosActuales = new Set(
            (this.personajeCreacion.Dominios ?? [])
                .map((dominio) => this.normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        return fuente
            .filter((dominio) => this.toNumber(dominio?.Id) > 0 && `${dominio?.Nombre ?? ''}`.trim().length > 0)
            .filter((dominio) => !excluirHomebrew || dominio?.Oficial !== false)
            .filter((dominio) => !dominiosActuales.has(this.normalizarTexto(dominio?.Nombre ?? '')))
            .map((dominio) => ({
                id: this.toNumber(dominio.Id),
                nombre: `${dominio.Nombre ?? ''}`.trim(),
                oficial: dominio.Oficial !== false,
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    private resolverSeleccionesDominiosClase(
        pendientes: ClaseDominiosPendientes | null,
        selecciones: SeleccionDominiosClase | null
    ): ClaseDominioPendiente[] {
        if (!pendientes || pendientes.cantidad < 1)
            return [];

        const candidatas = pendientes.opciones;
        if (candidatas.length < 1)
            return [];

        const parsearEntrada = (value: number | string): ClaseDominioPendiente | null => {
            const id = Math.trunc(this.toNumber(value));
            if (id > 0)
                return candidatas.find((opcion) => opcion.id === id) ?? null;
            const nombreNorm = this.normalizarTexto(`${value ?? ''}`);
            if (nombreNorm.length < 1)
                return null;
            return candidatas.find((opcion) => this.normalizarTexto(opcion.nombre) === nombreNorm) ?? null;
        };

        const unicos = new Set<number>();
        const resultado: ClaseDominioPendiente[] = [];
        const seleccionLista = Array.isArray(selecciones) ? selecciones : [];
        seleccionLista.forEach((seleccion) => {
            const dominio = parsearEntrada(seleccion);
            if (!dominio || unicos.has(dominio.id))
                return;
            unicos.add(dominio.id);
            resultado.push(dominio);
        });

        if (resultado.length >= pendientes.cantidad)
            return resultado.slice(0, pendientes.cantidad);

        if (candidatas.length <= pendientes.cantidad)
            return candidatas.slice(0, pendientes.cantidad);

        return resultado;
    }

    private aplicarDominiosNivelClase(_clase: Clase, _nivel: number, dominios: ClaseDominioPendiente[]): void {
        if (dominios.length < 1)
            return;

        const nombresActuales = new Set(
            (this.personajeCreacion.Dominios ?? [])
                .map((dominio) => this.normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        dominios.forEach((dominio) => {
            const nombre = `${dominio?.nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const nombreNorm = this.normalizarTexto(nombre);
            if (nombresActuales.has(nombreNorm))
                return;
            this.personajeCreacion.Dominios.push({ Nombre: nombre });
            nombresActuales.add(nombreNorm);
        });
    }

    private obtenerDominiosDeidadSeleccionada(): DominioDetalle[] {
        const deidadActual = this.obtenerDeidadSeleccionada();
        return deidadActual?.Dominios ?? [];
    }

    private obtenerDeidadSeleccionada(): DeidadDetalle | null {
        const deidadNorm = this.normalizarTexto(this.personajeCreacion.Deidad ?? '');
        if (deidadNorm.length < 1 || deidadNorm === this.normalizarTexto('No tener deidad'))
            return null;
        return this.catalogoDeidades.find((deidad) => this.normalizarTexto(deidad?.Nombre ?? '') === deidadNorm) ?? null;
    }

    private agregarIdiomaABaseVentajas(idioma: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
        Origen?: string;
    }): void {
        const nombreNorm = this.normalizarTexto(idioma?.Nombre ?? '');
        if (nombreNorm.length < 1)
            return;
        if (this.estadoFlujo.ventajas.baseIdiomas
            .some((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm)) {
            return;
        }
        this.estadoFlujo.ventajas.baseIdiomas.push({ ...idioma });
    }

    private extraerOpcionesNivelClase(detalleNivel: ClaseNivelDetalle): ClaseNivelOpcionInterna[] {
        const opciones: ClaseNivelOpcionInterna[] = [];
        let contador = 0;

        (detalleNivel?.Dotes ?? []).forEach((doteNivel) => {
            const nombre = `${doteNivel?.Dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const grupoOpcional = Math.max(0, Math.trunc(this.toNumber(doteNivel?.Opcional)));
            opciones.push({
                tipo: 'dote',
                clave: `dote:${contador++}`,
                grupoOpcional,
                nombre,
                descripcion: `${doteNivel?.Dote?.Descripcion ?? ''}`.trim(),
                extra: `${doteNivel?.Extra ?? ''}`.trim(),
                idInterno: this.toNumber(doteNivel?.Id_interno),
                idEspecialRequerido: this.toNumber(doteNivel?.Id_especial_requerido),
                idDoteRequerida: this.toNumber(doteNivel?.Id_dote_requerida),
                doteNivel,
                especialNivel: null,
            });
        });

        (detalleNivel?.Especiales ?? []).forEach((especialNivel) => {
            const nombre = `${(especialNivel?.Especial as Record<string, any>)?.['Nombre'] ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const grupoOpcional = Math.max(0, Math.trunc(this.toNumber(especialNivel?.Opcional)));
            opciones.push({
                tipo: 'especial',
                clave: `especial:${contador++}`,
                grupoOpcional,
                nombre,
                descripcion: `${(especialNivel?.Especial as Record<string, any>)?.['Descripcion'] ?? ''}`.trim(),
                extra: `${especialNivel?.Extra ?? ''}`.trim(),
                idInterno: this.toNumber(especialNivel?.Id_interno),
                idEspecialRequerido: this.toNumber(especialNivel?.Id_especial_requerido),
                idDoteRequerida: this.toNumber(especialNivel?.Id_dote_requerida),
                doteNivel: null,
                especialNivel,
            });
        });

        return opciones;
    }

    private cumplePrerequisitosInternosOpcion(
        opcion: ClaseNivelOpcionInterna,
        idsEspeciales: Set<number>,
        idsDotes: Set<number>
    ): boolean {
        if (opcion.idEspecialRequerido > 0 && !idsEspeciales.has(opcion.idEspecialRequerido))
            return false;
        if (opcion.idDoteRequerida > 0 && !idsDotes.has(opcion.idDoteRequerida))
            return false;
        return true;
    }

    private registrarIdInternoTemporal(
        opcion: ClaseNivelOpcionInterna,
        idsEspeciales: Set<number>,
        idsDotes: Set<number>
    ): void {
        if (opcion.idInterno <= 0)
            return;
        if (opcion.tipo === 'dote') {
            idsDotes.add(opcion.idInterno);
            return;
        }
        idsEspeciales.add(opcion.idInterno);
    }

    private mapearOpcionesPendientes(opciones: ClaseNivelOpcionInterna[]): ClaseOpcionInternaPendiente[] {
        return opciones.map((opcion) => ({
            clave: opcion.clave,
            tipo: opcion.tipo,
            nombre: opcion.nombre,
            descripcion: opcion.descripcion,
            extra: opcion.extra,
            idInterno: opcion.idInterno,
            idEspecialRequerido: opcion.idEspecialRequerido,
            idDoteRequerida: opcion.idDoteRequerida,
        }));
    }

    private resolverOpcionalesNivelClase(
        detalleNivel: ClaseNivelDetalle,
        seleccionesOpcionales: SeleccionOpcionalesClase | null
    ): ResolucionOpcionalesNivelClase {
        const opciones = this.extraerOpcionesNivelClase(detalleNivel);
        const idsEspeciales = new Set<number>(this.idsEspecialesInternosActivos);
        const idsDotes = new Set<number>(this.idsDotesInternosActivos);
        const advertencias: string[] = [];
        const obligatoriasDote: ClaseDoteNivel[] = [];
        const obligatoriasEspecial: ClaseEspecialNivel[] = [];
        const seleccionadasDote: ClaseDoteNivel[] = [];
        const seleccionadasEspecial: ClaseEspecialNivel[] = [];
        const gruposPendientes: ClaseGrupoOpcionalPendiente[] = [];

        opciones
            .filter((opcion) => opcion.grupoOpcional === 0)
            .forEach((opcion) => {
                if (!this.cumplePrerequisitosInternosOpcion(opcion, idsEspeciales, idsDotes)) {
                    advertencias.push(`No se aplicó ${opcion.tipo} "${opcion.nombre}" por prerrequisito interno no cumplido`);
                    return;
                }

                if (opcion.tipo === 'dote' && opcion.doteNivel)
                    obligatoriasDote.push(opcion.doteNivel);
                if (opcion.tipo === 'especial' && opcion.especialNivel)
                    obligatoriasEspecial.push(opcion.especialNivel);
                this.registrarIdInternoTemporal(opcion, idsEspeciales, idsDotes);
            });

        const grupos = Array.from(
            new Set(opciones.filter((opcion) => opcion.grupoOpcional > 0).map((opcion) => opcion.grupoOpcional))
        ).sort((a, b) => a - b);

        grupos.forEach((grupo) => {
            const opcionesGrupo = opciones.filter((opcion) => opcion.grupoOpcional === grupo);
            const elegibles = opcionesGrupo.filter((opcion) => this.cumplePrerequisitosInternosOpcion(opcion, idsEspeciales, idsDotes));
            if (elegibles.length < 1) {
                advertencias.push(`No hay opciones habilitadas para el grupo opcional ${grupo}`);
                return;
            }

            const claveSeleccionada = `${seleccionesOpcionales?.[grupo] ?? ''}`.trim();
            if (claveSeleccionada.length < 1 && elegibles.length > 1) {
                gruposPendientes.push({
                    grupo,
                    opciones: this.mapearOpcionesPendientes(elegibles),
                });
                return;
            }

            const elegida = claveSeleccionada.length > 0
                ? elegibles.find((opcion) => opcion.clave === claveSeleccionada) ?? null
                : elegibles[0];
            if (!elegida) {
                gruposPendientes.push({
                    grupo,
                    opciones: this.mapearOpcionesPendientes(elegibles),
                });
                advertencias.push(`Selección no válida para el grupo opcional ${grupo}`);
                return;
            }

            if (elegida.tipo === 'dote' && elegida.doteNivel)
                seleccionadasDote.push(elegida.doteNivel);
            if (elegida.tipo === 'especial' && elegida.especialNivel)
                seleccionadasEspecial.push(elegida.especialNivel);
            this.registrarIdInternoTemporal(elegida, idsEspeciales, idsDotes);
        });

        return {
            obligatoriasDote,
            obligatoriasEspecial,
            seleccionadasDote,
            seleccionadasEspecial,
            gruposPendientes,
            advertencias,
        };
    }

    private registrarIdInternoDote(idInterno: number): void {
        const id = Math.trunc(this.toNumber(idInterno));
        if (id > 0)
            this.idsDotesInternosActivos.add(id);
    }

    private registrarIdInternoEspecial(idInterno: number): void {
        const id = Math.trunc(this.toNumber(idInterno));
        if (id > 0)
            this.idsEspecialesInternosActivos.add(id);
    }

    private aplicarDotesNivelClase(clase: Clase, nivel: number, dotesNivel: ClaseDoteNivel[]): void {
        const origen = `${clase.Nombre} nivel ${nivel}`;
        dotesNivel.forEach((doteNivel) => {
            const nombre = `${doteNivel?.Dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const idExtra = this.toNumber(doteNivel?.Id_extra);
            const extra = `${doteNivel?.Extra ?? ''}`.trim() || 'No aplica';
            const agregado = this.agregarDoteAlPersonaje(doteNivel.Dote, origen, idExtra, extra);
            if (agregado)
                this.aplicarModificadoresDote(doteNivel.Dote, origen, idExtra, extra);

            this.registrarIdInternoDote(this.toNumber(doteNivel?.Id_interno));
        });
    }

    private aplicarEspecialesNivelClase(especialesNivel: ClaseEspecialNivel[]): void {
        especialesNivel.forEach((especialNivel) => {
            const nombre = `${(especialNivel?.Especial as Record<string, any>)?.['Nombre'] ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const extra = `${especialNivel?.Extra ?? ''}`.trim();
            const duplicado = (this.personajeCreacion.Claseas ?? []).some((especial) =>
                this.normalizarTexto(especial?.Nombre ?? '') === this.normalizarTexto(nombre)
                && this.normalizarTexto(especial?.Extra ?? '') === this.normalizarTexto(extra)
            );
            if (!duplicado) {
                const especialRaw = (especialNivel?.Especial as Record<string, any>) ?? {};
                const idEspecial = this.toNumber(especialRaw?.['Id'] ?? especialRaw?.['id']);
                this.personajeCreacion.Claseas.push({
                    Id: idEspecial > 0 ? idEspecial : undefined,
                    Id_extra: this.toNumber(especialNivel?.Id_extra),
                    Nombre: nombre,
                    Extra: extra,
                });
            }
            this.registrarIdInternoEspecial(this.toNumber(especialNivel?.Id_interno));
        });
    }

    private resolverAumentosClaseLanzadora(
        claseAplicada: Clase,
        detalleNivel: ClaseNivelDetalle,
        selecciones: SeleccionAumentosClaseLanzadora | null
    ): ResolucionAumentosClaseLanzadora {
        const aumentos = Array.isArray(detalleNivel?.Aumentos_clase_lanzadora)
            ? detalleNivel.Aumentos_clase_lanzadora
            : [];
        const resultado: ResolucionAumentosClaseLanzadora = {
            selecciones: [],
            pendientes: [],
            advertencias: [],
        };
        if (aumentos.length < 1)
            return resultado;

        const entradas = Array.isArray(selecciones) ? selecciones : [];
        aumentos.forEach((aumento, index) => {
            const indice = index + 1;
            const descripcion = `${aumento?.Nombre ?? ''}`.trim() || `Aumento ${indice}`;
            const opciones = this.listarOpcionesAumentoClaseLanzadora(claseAplicada, aumento);
            if (opciones.length < 1) {
                resultado.advertencias.push(`No hay clases lanzadoras previas válidas para ${descripcion}.`);
                return;
            }

            if (opciones.length === 1) {
                resultado.selecciones.push({
                    indice,
                    objetivo: opciones[0],
                });
                return;
            }

            const valorSeleccionado = entradas[index];
            const idSeleccion = Math.trunc(this.toNumber(valorSeleccionado));
            const nombreSeleccion = this.normalizarTexto(`${valorSeleccionado ?? ''}`);
            const opcion = opciones.find((item) => this.toNumber(item.idClase) === idSeleccion)
                ?? opciones.find((item) => this.normalizarTexto(item.nombreClase) === nombreSeleccion)
                ?? null;

            if (!opcion) {
                resultado.pendientes.push({
                    indice,
                    descripcion,
                    opciones,
                });
                return;
            }

            resultado.selecciones.push({
                indice,
                objetivo: opcion,
            });
        });

        return resultado;
    }

    private listarOpcionesAumentoClaseLanzadora(
        claseAplicada: Clase,
        aumento: {
            Id: number;
            Nombre: string;
        }
    ): ClaseAumentoLanzadorOpcion[] {
        const nombreClaseAplicada = this.normalizarTexto(claseAplicada?.Nombre ?? '');
        const previas = (this.personajeCreacion.desgloseClases ?? [])
            .filter((item) => this.toNumber(item?.Nivel) > 0)
            .filter((item) => this.normalizarTexto(item?.Nombre ?? '') !== nombreClaseAplicada)
            .map((item) => this.catalogoClases
                .find((clase) => this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(item?.Nombre ?? '')))
            .filter((item): item is Clase => !!item && this.esClaseLanzadora(item));

        if (previas.length < 1)
            return [];

        const hintId = this.toNumber(aumento?.Id);
        const hintNombre = this.normalizarTexto(`${aumento?.Nombre ?? ''}`);
        let candidatas = [...previas];

        if (hintId > 0) {
            const porId = candidatas.filter((clase) => this.toNumber(clase?.Id) === hintId);
            if (porId.length > 0)
                candidatas = porId;
        } else if (hintNombre.length > 0) {
            const porNombre = candidatas.filter((clase) => this.normalizarTexto(clase?.Nombre ?? '') === hintNombre);
            if (porNombre.length > 0) {
                candidatas = porNombre;
            } else {
                const porTipo = candidatas.filter((clase) => {
                    if (hintNombre.includes('arc'))
                        return !!clase?.Conjuros?.Arcanos;
                    if (hintNombre.includes('div'))
                        return !!clase?.Conjuros?.Divinos;
                    if (hintNombre.includes('psi'))
                        return !!clase?.Conjuros?.Psionicos;
                    if (hintNombre.includes('alma') || hintNombre.includes('soul'))
                        return !!clase?.Conjuros?.Alma;
                    return false;
                });
                if (porTipo.length > 0)
                    candidatas = porTipo;
            }
        }

        const usadas = new Set<number>();
        return candidatas
            .map((clase) => ({
                idClase: this.toNumber(clase?.Id),
                nombreClase: `${clase?.Nombre ?? ''}`.trim(),
                tipoLanzamiento: this.resolverTipoLanzamientoClase(clase),
            }))
            .filter((item) => item.idClase > 0 && item.nombreClase.length > 0)
            .filter((item) => {
                if (usadas.has(item.idClase))
                    return false;
                usadas.add(item.idClase);
                return true;
            })
            .sort((a, b) => a.nombreClase.localeCompare(b.nombreClase, 'es', { sensitivity: 'base' }));
    }

    private validarContratoConjurosParaAplicacionNivelClase(
        claseAplicada: Clase,
        nivelAplicado: number,
        aumentosLanzador: ClaseAumentoLanzadorSeleccion[]
    ): string[] {
        const errores: string[] = [];
        const nivelReferencia = Math.max(1, Math.trunc(this.toNumber(nivelAplicado)));

        if (this.esClaseLanzadora(claseAplicada)) {
            const bonusActual = this.obtenerBonusNivelLanzadorClase(claseAplicada?.Nombre ?? '');
            const nivelPrevio = Math.max(0, nivelReferencia - 1 + bonusActual);
            const nivelActual = nivelPrevio + 1;
            const detalleActual = this.obtenerDetalleNivelClase(claseAplicada, nivelActual);
            if (!detalleActual) {
                errores.push(`No existe desglose de nivel ${nivelActual} para validar el contrato de conjuros de ${claseAplicada?.Nombre ?? 'clase desconocida'}.`);
            } else {
                const detallePrevio = nivelPrevio > 0 ? this.obtenerDetalleNivelClase(claseAplicada, nivelPrevio) : null;
                const acceso = this.resolverAccesoConjurosPorTipo(claseAplicada, detalleActual, detallePrevio);
                errores.push(...acceso.errores);
            }
        }

        (aumentosLanzador ?? []).forEach((seleccion) => {
            const idClase = this.toNumber(seleccion?.objetivo?.idClase);
            const nombreClase = `${seleccion?.objetivo?.nombreClase ?? ''}`.trim();
            const objetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && this.toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(nombreClase))
            );
            if (!objetivo) {
                errores.push(`No se pudo resolver la clase objetivo del aumento de lanzador #${this.toNumber(seleccion?.indice)} para validar contrato de conjuros.`);
                return;
            }

            const nivelPrevio = this.getNivelLanzadorEfectivoClase(objetivo.Nombre);
            const nivelActual = nivelPrevio + 1;
            const detalleActual = this.obtenerDetalleNivelClase(objetivo, nivelActual);
            if (!detalleActual) {
                errores.push(`No existe desglose de nivel ${nivelActual} para validar el contrato de conjuros de ${objetivo?.Nombre ?? 'clase desconocida'}.`);
                return;
            }
            const detallePrevio = nivelPrevio > 0 ? this.obtenerDetalleNivelClase(objetivo, nivelPrevio) : null;
            const acceso = this.resolverAccesoConjurosPorTipo(objetivo, detalleActual, detallePrevio);
            errores.push(...acceso.errores);
        });

        return errores;
    }

    private prepararSesionConjurosTrasNivelClase(
        claseAplicada: Clase,
        nivelAplicado: number,
        _detalleSiguiente: ClaseNivelDetalle,
        _detalleAnterior: ClaseNivelDetalle | null,
        aumentosLanzador: ClaseAumentoLanzadorSeleccion[],
        advertenciasAumentos: string[] = []
    ): string[] {
        const entradas: ConjurosSesionStateEntrada[] = [];
        const avisos: string[] = [...(advertenciasAumentos ?? [])];
        const origenBase = `${claseAplicada?.Nombre ?? 'Clase'} nivel ${Math.max(1, Math.trunc(this.toNumber(nivelAplicado)))}`;

        if (this.esClaseLanzadora(claseAplicada)) {
            const bonusActual = this.obtenerBonusNivelLanzadorClase(claseAplicada?.Nombre ?? '');
            const nivelPrevio = Math.max(0, Math.max(1, Math.trunc(this.toNumber(nivelAplicado))) - 1 + bonusActual);
            const nivelActual = nivelPrevio + 1;
            const { entrada, avisos: avisosEntrada } = this.crearEntradaSesionConjuros(
                claseAplicada,
                `${origenBase} (clase)`,
                nivelPrevio,
                nivelActual
            );
            avisos.push(...avisosEntrada);
            if (entrada)
                entradas.push(entrada);
        }

        (aumentosLanzador ?? []).forEach((seleccion) => {
            const idClase = this.toNumber(seleccion?.objetivo?.idClase);
            const nombreClase = `${seleccion?.objetivo?.nombreClase ?? ''}`.trim();
            const objetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && this.toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(nombreClase))
            );
            if (!objetivo) {
                avisos.push(`No se pudo resolver la clase objetivo del aumento de lanzador #${this.toNumber(seleccion?.indice)}.`);
                return;
            }

            const nivelPrevio = this.getNivelLanzadorEfectivoClase(objetivo.Nombre);
            const nivelActual = nivelPrevio + 1;
            this.incrementarBonusNivelLanzadorClase(objetivo.Nombre, 1);
            const { entrada, avisos: avisosEntrada } = this.crearEntradaSesionConjuros(
                objetivo,
                `${origenBase} (aumento de lanzador: ${objetivo.Nombre})`,
                nivelPrevio,
                nivelActual
            );
            avisos.push(...avisosEntrada);
            if (entrada)
                entradas.push(entrada);
        });

        this.estadoFlujo.conjuros = {
            activa: entradas.length > 0,
            indiceEntradaActual: 0,
            returnStep: 'dotes',
            entradas,
            avisos,
        };
        return avisos;
    }

    private crearEntradaSesionConjuros(
        claseObjetivo: Clase,
        origen: string,
        nivelLanzadorPrevio: number,
        nivelLanzadorActual: number
    ): { entrada: ConjurosSesionStateEntrada | null; avisos: string[]; } {
        const avisos: string[] = [];
        const detalleActual = this.obtenerDetalleNivelClase(claseObjetivo, nivelLanzadorActual);
        const detallePrevio = nivelLanzadorPrevio > 0
            ? this.obtenerDetalleNivelClase(claseObjetivo, nivelLanzadorPrevio)
            : null;
        if (!detalleActual) {
            avisos.push(`No existe desglose de nivel ${nivelLanzadorActual} para conjuros de ${claseObjetivo?.Nombre ?? 'clase desconocida'}.`);
            return { entrada: null, avisos };
        }

        const elegibles = this.obtenerConjurosElegiblesParaClase(
            claseObjetivo,
            detalleActual,
            nivelLanzadorActual,
            detallePrevio
        );
        avisos.push(...elegibles.avisos);

        const cupoTotal = claseObjetivo?.Conjuros?.Conocidos_total
            ? Math.max(
                0,
                this.toNumber(detalleActual?.Conjuros_conocidos_total)
                - this.toNumber(detallePrevio?.Conjuros_conocidos_total)
            )
            : 0;
        const usaConocidosTotal = !!claseObjetivo?.Conjuros?.Conocidos_total;
        const usaConocidosPorNivel = !!claseObjetivo?.Conjuros?.Conocidos_nivel_a_nivel;
        const cupoPorNivel = usaConocidosPorNivel
            ? this.calcularDeltaConocidosPorNivel(detalleActual, detallePrevio)
            : {};
        const totalPorNivel = Object.values(cupoPorNivel).reduce((acc, value) => acc + Math.max(0, this.toNumber(value)), 0);
        const requiereSeleccionManual = cupoTotal > 0 || totalPorNivel > 0;
        const tipoLanzamiento = this.resolverTipoLanzamientoClase(claseObjetivo);
        const almaPendiente = tipoLanzamiento === 'alma';
        if (almaPendiente) {
            avisos.push(`La selección manual para conjuros de alma de ${claseObjetivo.Nombre} queda pendiente para una fase posterior.`);
        }

        const autoadicion = !usaConocidosTotal && !usaConocidosPorNivel && !almaPendiente;
        const sinElegibles = elegibles.conjuros.length < 1;
        if (sinElegibles) {
            avisos.push(`No hay conjuros elegibles para ${claseObjetivo.Nombre} en este nivel de lanzador.`);
        }
        const idsAutoadicionados = autoadicion
            ? elegibles.conjuros
                .filter((conjuro) => {
                    const id = this.toNumber(conjuro?.Id);
                    if (id <= 0)
                        return false;
                    const nivelConjuro = this.toNumber(elegibles.nivelesPorConjuro[id]);
                    return elegibles.acceso.nivelesRecienDesbloqueados.has(nivelConjuro);
                })
                .map((conjuro) => this.toNumber(conjuro?.Id))
                .filter((id) => id > 0)
            : [];
        const autoadicionActiva = autoadicion && !sinElegibles && idsAutoadicionados.length > 0;

        const entrada: ConjurosSesionStateEntrada = {
            id: `${this.normalizarTexto(claseObjetivo.Nombre)}:${origen}:${nivelLanzadorActual}`,
            origen: `${origen ?? ''}`.trim() || `${claseObjetivo.Nombre} nivel ${nivelLanzadorActual}`,
            claseObjetivo: {
                id: this.toNumber(claseObjetivo?.Id),
                nombre: `${claseObjetivo?.Nombre ?? ''}`.trim(),
            },
            tipoLanzamiento,
            nivelLanzadorPrevio: Math.max(0, this.toNumber(nivelLanzadorPrevio)),
            nivelLanzadorActual: Math.max(0, this.toNumber(nivelLanzadorActual)),
            nivelMaxPoderAccesiblePsionico: Math.max(-1, this.toNumber(elegibles.acceso.nivelMaxPoderAccesiblePsionico)),
            seleccionManual: requiereSeleccionManual && !almaPendiente,
            autoadicion: autoadicionActiva,
            almaPendiente,
            sinElegibles,
            cupoPendiente: {
                total: cupoTotal,
                porNivel: { ...cupoPorNivel },
            },
            cupoInicial: {
                total: cupoTotal,
                porNivel: { ...cupoPorNivel },
            },
            nivelesPorConjuro: { ...elegibles.nivelesPorConjuro },
            elegiblesIds: elegibles.conjuros.map((conjuro) => this.toNumber(conjuro?.Id)).filter((id) => id > 0),
            seleccionadosIds: [],
            autoadicionadosIds: idsAutoadicionados,
            avisos,
        };
        return { entrada, avisos: [] };
    }

    private calcularDeltaConocidosPorNivel(
        detalleActual: ClaseNivelDetalle,
        detallePrevio: ClaseNivelDetalle | null
    ): Record<number, number> {
        const actual = this.normalizarMapaConjurosPorNivel(detalleActual?.Conjuros_conocidos_nivel_a_nivel);
        const previo = this.normalizarMapaConjurosPorNivel(detallePrevio?.Conjuros_conocidos_nivel_a_nivel);
        const niveles = new Set<number>([
            ...Object.keys(actual).map((key) => this.toNumber(key)),
            ...Object.keys(previo).map((key) => this.toNumber(key)),
        ]);
        const delta: Record<number, number> = {};
        niveles.forEach((nivel) => {
            if (!Number.isFinite(nivel) || nivel < 0)
                return;
            const valor = Math.max(0, this.toNumber(actual[nivel]) - this.toNumber(previo[nivel]));
            if (valor > 0)
                delta[nivel] = valor;
        });
        return delta;
    }

    private normalizarMapaConjurosDiarios(mapa: Record<string, number> | undefined | null): Record<number, number> {
        const resultado: Record<number, number> = {};
        if (!mapa)
            return resultado;

        Object.keys(mapa).forEach((key) => {
            const nivel = this.parseNivelConjuroKey(key);
            if (!Number.isFinite(nivel) || nivel < 0)
                return;
            const valor = Number((mapa as Record<string, any>)[key]);
            resultado[nivel] = Number.isFinite(valor) ? Math.trunc(valor) : -1;
        });
        return resultado;
    }

    private construirNivelesAccesiblesDesdeDiarios(mapaDiarios: Record<number, number>): Set<number> {
        const resultado = new Set<number>();
        Object.keys(mapaDiarios)
            .map((nivel) => this.toNumber(nivel))
            .filter((nivel) => Number.isFinite(nivel) && nivel >= 0)
            .forEach((nivel) => {
                if (this.toNumber(mapaDiarios[nivel]) >= 0)
                    resultado.add(nivel);
            });
        return resultado;
    }

    private construirNivelesAccesiblesHastaNivelMax(nivelMax: number): Set<number> {
        const resultado = new Set<number>();
        const limite = Math.max(-1, Math.trunc(this.toNumber(nivelMax)));
        if (limite < 0)
            return resultado;
        for (let nivel = 0; nivel <= limite; nivel++) {
            resultado.add(nivel);
        }
        return resultado;
    }

    private resolverAccesoConjurosPorTipo(
        claseObjetivo: Clase,
        detalleActual: ClaseNivelDetalle,
        detallePrevio: ClaseNivelDetalle | null
    ): ConjurosAccesoNivelesInfo {
        const requiereArcano = !!claseObjetivo?.Conjuros?.Arcanos;
        const requiereDivino = !!claseObjetivo?.Conjuros?.Divinos;
        const requierePsionico = !!claseObjetivo?.Conjuros?.Psionicos;
        const usaArcanoDivino = requiereArcano || requiereDivino;
        const errores: string[] = [];

        const diariosActual = this.normalizarMapaConjurosDiarios(detalleActual?.Conjuros_diarios);
        const diariosPrevio = this.normalizarMapaConjurosDiarios(detallePrevio?.Conjuros_diarios);
        const diariosInformados = Object.keys(diariosActual).length > 0;
        const diariosInformadosPrevio = Object.keys(diariosPrevio).length > 0;

        const nivelMaxPoderPsionico = Math.max(
            -1,
            Math.trunc(this.toNumber(detalleActual?.Nivel_max_poder_accesible_nivel_lanzadorPsionico))
        );
        const nivelMaxPoderPsionicoPrevio = detallePrevio
            ? Math.max(-1, Math.trunc(this.toNumber(detallePrevio?.Nivel_max_poder_accesible_nivel_lanzadorPsionico)))
            : -1;

        if (usaArcanoDivino && requierePsionico) {
            errores.push(`Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: no se admite mezcla arcana/divina con psiónica.`);
            return {
                nivelesAccesibles: null,
                nivelesRecienDesbloqueados: new Set<number>(),
                nivelMaxPoderAccesiblePsionico: nivelMaxPoderPsionico,
                errores,
            };
        }

        if (usaArcanoDivino) {
            if (!diariosInformados)
                errores.push(`Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: lanzador arcano/divino sin Conjuros_diarios.`);
            if (nivelMaxPoderPsionico >= 0) {
                errores.push(
                    `Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: nivel_max_poder_accesible_nivel_lanzadorPsionico no debe informarse en lanzadores arcanos/divinos.`
                );
            }

            const nivelesActuales = this.construirNivelesAccesiblesDesdeDiarios(diariosActual);
            const nivelesPrevios = this.construirNivelesAccesiblesDesdeDiarios(diariosPrevio);
            const nivelesRecienDesbloqueados = new Set<number>(
                Array.from(nivelesActuales).filter((nivel) => !nivelesPrevios.has(nivel))
            );
            return {
                nivelesAccesibles: nivelesActuales,
                nivelesRecienDesbloqueados,
                nivelMaxPoderAccesiblePsionico: -1,
                errores,
            };
        }

        if (requierePsionico) {
            if (nivelMaxPoderPsionico < 0)
                errores.push(`Contrato psiónico inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: falta nivel_max_poder_accesible_nivel_lanzadorPsionico.`);
            if (diariosInformados || diariosInformadosPrevio)
                errores.push(`Contrato psiónico inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: Conjuros_diarios no debe informarse en clases psiónicas.`);

            const nivelesActuales = this.construirNivelesAccesiblesHastaNivelMax(nivelMaxPoderPsionico);
            const nivelesPrevios = this.construirNivelesAccesiblesHastaNivelMax(nivelMaxPoderPsionicoPrevio);
            const nivelesRecienDesbloqueados = new Set<number>(
                Array.from(nivelesActuales).filter((nivel) => !nivelesPrevios.has(nivel))
            );
            return {
                nivelesAccesibles: nivelesActuales,
                nivelesRecienDesbloqueados,
                nivelMaxPoderAccesiblePsionico: nivelMaxPoderPsionico,
                errores,
            };
        }

        return {
            nivelesAccesibles: null,
            nivelesRecienDesbloqueados: new Set<number>(),
            nivelMaxPoderAccesiblePsionico: -1,
            errores,
        };
    }

    private obtenerConjurosElegiblesParaClase(
        claseObjetivo: Clase,
        detalleActual: ClaseNivelDetalle,
        nivelLanzadorActual: number,
        detallePrevio: ClaseNivelDetalle | null = null
    ): { conjuros: Conjuro[]; nivelesPorConjuro: Record<number, number>; avisos: string[]; acceso: ConjurosAccesoNivelesInfo; } {
        const avisos: string[] = [];
        const resultado: Conjuro[] = [];
        const nivelesPorConjuro: Record<number, number> = {};
        const usados = new Set<number>();
        const acceso = this.resolverAccesoConjurosPorTipo(claseObjetivo, detalleActual, detallePrevio);
        avisos.push(...acceso.errores);
        const incluirSoloOficiales = this.personajeCreacion?.Oficial !== false;
        const dominiosSeleccionados = new Set(
            (this.personajeCreacion?.Dominios ?? [])
                .map((dominio) => this.normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );
        const escuelasProhibidas = new Set(
            (this.personajeCreacion?.Escuelas_prohibidas ?? [])
                .map((escuela) => this.normalizarTexto(this.extraerNombreEscuelaProhibida(escuela)))
                .filter((nombre) => nombre.length > 0)
        );
        const disciplinaProhibida = this.normalizarTexto(this.personajeCreacion?.Disciplina_prohibida ?? '');

        const puedeAgregar = (conjuro: Conjuro, nivelConjuro: number): boolean => {
            const id = this.toNumber(conjuro?.Id);
            if (id <= 0 || usados.has(id))
                return false;
            if (!this.esConjuroCompatibleTipoLanzamiento(claseObjetivo, conjuro))
                return false;
            if (acceso.nivelesAccesibles && !acceso.nivelesAccesibles.has(nivelConjuro))
                return false;
            if (incluirSoloOficiales && conjuro?.Oficial === false)
                return false;
            if (claseObjetivo?.Conjuros?.Dependientes_alineamiento && this.esConjuroOpuestoAAlineamientoActual(conjuro))
                return false;
            const escuela = this.normalizarTexto(conjuro?.Escuela?.Nombre ?? '');
            if (escuela.length > 0 && escuelasProhibidas.has(escuela))
                return false;
            const disciplina = this.normalizarTexto(conjuro?.Disciplina?.Nombre ?? '');
            if (disciplinaProhibida.length > 0 && disciplina === disciplinaProhibida)
                return false;
            if (this.esConjuroYaConocidoPorClase(claseObjetivo?.Nombre ?? '', id))
                return false;
            return true;
        };

        this.catalogoConjuros.forEach((conjuro) => {
            const nivelConjuro = this.resolverNivelConjuroParaClase(claseObjetivo, conjuro, dominiosSeleccionados);
            if (nivelConjuro === null)
                return;
            if (!puedeAgregar(conjuro, nivelConjuro))
                return;
            const id = this.toNumber(conjuro?.Id);
            usados.add(id);
            nivelesPorConjuro[id] = nivelConjuro;
            resultado.push(conjuro);
        });

        (claseObjetivo?.Conjuros?.Listado ?? []).forEach((ref) => {
            const id = this.toNumber(ref?.Id);
            const nivel = this.toNumber(ref?.Nivel);
            if (id <= 0)
                return;
            if (acceso.nivelesAccesibles && !acceso.nivelesAccesibles.has(nivel))
                return;
            let conjuro = this.obtenerConjuroCatalogoPorId(id);
            if (!conjuro) {
                conjuro = this.crearConjuroPlaceholderDesdeClase(claseObjetivo, ref, nivelLanzadorActual);
                this.conjurosSesionPlaceholderPorId[id] = conjuro;
            }
            if (!puedeAgregar(conjuro, nivel))
                return;
            usados.add(id);
            nivelesPorConjuro[id] = nivel;
            resultado.push(conjuro);
        });

        if (resultado.length < 1)
            avisos.push(`Sin conjuros elegibles para ${claseObjetivo.Nombre}.`);
        return { conjuros: resultado, nivelesPorConjuro, avisos, acceso };
    }

    private resolverNivelConjuroParaClase(
        claseObjetivo: Clase,
        conjuro: Conjuro,
        dominiosSeleccionados: Set<string>
    ): number | null {
        const nombreClaseNorm = this.normalizarTexto(claseObjetivo?.Nombre ?? '');
        const idClase = this.toNumber(claseObjetivo?.Id);
        const nivelesClase = Array.isArray(conjuro?.Nivel_clase)
            ? conjuro.Nivel_clase
            : (conjuro?.Nivel_clase && typeof conjuro.Nivel_clase === 'object'
                ? Object.values(conjuro.Nivel_clase as any)
                : []);
        const nivelClase = nivelesClase
            .map((nivel) => ({
                id: this.toNumber((nivel as Record<string, any>)?.['Id_clase'] ?? (nivel as Record<string, any>)?.['id_clase']),
                nombre: this.normalizarTexto((nivel as Record<string, any>)?.['Clase'] ?? (nivel as Record<string, any>)?.['clase'] ?? ''),
                nivel: this.toNumber((nivel as Record<string, any>)?.['Nivel'] ?? (nivel as Record<string, any>)?.['nivel']),
            }))
            .find((item) => (idClase > 0 && item.id === idClase) || (nombreClaseNorm.length > 0 && item.nombre === nombreClaseNorm));
        if (nivelClase && nivelClase.nivel >= 0)
            return nivelClase.nivel;

        if (claseObjetivo?.Conjuros?.Dominio && dominiosSeleccionados.size > 0) {
            const nivelesDominio = Array.isArray(conjuro?.Nivel_dominio)
                ? conjuro.Nivel_dominio
                : (conjuro?.Nivel_dominio && typeof conjuro.Nivel_dominio === 'object'
                    ? Object.values(conjuro.Nivel_dominio as any)
                    : []);
            const compatibles = nivelesDominio
                .map((nivel) => ({
                    dominio: this.normalizarTexto((nivel as Record<string, any>)?.['Dominio'] ?? (nivel as Record<string, any>)?.['dominio'] ?? ''),
                    nivel: this.toNumber((nivel as Record<string, any>)?.['Nivel'] ?? (nivel as Record<string, any>)?.['nivel']),
                }))
                .filter((item) => item.dominio.length > 0 && dominiosSeleccionados.has(item.dominio) && item.nivel >= 0)
                .sort((a, b) => a.nivel - b.nivel);
            if (compatibles.length > 0)
                return compatibles[0].nivel;
        }

        const refListado = (claseObjetivo?.Conjuros?.Listado ?? [])
            .find((ref) => this.toNumber(ref?.Id) === this.toNumber(conjuro?.Id));
        if (refListado)
            return this.toNumber(refListado?.Nivel);

        return null;
    }

    private esConjuroCompatibleTipoLanzamiento(claseObjetivo: Clase, conjuro: Conjuro): boolean {
        const requiereArcano = !!claseObjetivo?.Conjuros?.Arcanos;
        const requiereDivino = !!claseObjetivo?.Conjuros?.Divinos;
        const requierePsionico = !!claseObjetivo?.Conjuros?.Psionicos;
        const requiereAlma = !!claseObjetivo?.Conjuros?.Alma;
        return (requiereArcano && !!conjuro?.Arcano)
            || (requiereDivino && !!conjuro?.Divino)
            || (requierePsionico && !!conjuro?.Psionico)
            || (requiereAlma && !!conjuro?.Alma);
    }

    private esConjuroOpuestoAAlineamientoActual(conjuro: Conjuro): boolean {
        const alineamiento = this.normalizarTexto(this.personajeCreacion?.Alineamiento ?? '');
        if (alineamiento.length < 1)
            return false;

        const opuestos = new Set<string>();
        if (alineamiento.includes('legal'))
            opuestos.add('caotico');
        if (alineamiento.includes('caotico'))
            opuestos.add('legal');
        if (alineamiento.includes('bueno'))
            opuestos.add('maligno');
        if (alineamiento.includes('maligno'))
            opuestos.add('bueno');
        if (opuestos.size < 1)
            return false;

        const descriptores = (Array.isArray(conjuro?.Descriptores)
            ? conjuro.Descriptores
            : (conjuro?.Descriptores && typeof conjuro.Descriptores === 'object'
                ? Object.values(conjuro.Descriptores as any)
                : [])
        ).map((item) => this.normalizarTexto((item as Record<string, any>)?.['Nombre'] ?? (item as Record<string, any>)?.['nombre'] ?? `${item ?? ''}`));

        return descriptores.some((descriptor) => opuestos.has(descriptor));
    }

    private esClaseLanzadora(clase: Clase | null | undefined): boolean {
        return !!clase?.Conjuros?.Arcanos
            || !!clase?.Conjuros?.Divinos
            || !!clase?.Conjuros?.Psionicos
            || !!clase?.Conjuros?.Alma;
    }

    private obtenerCatalogoEscuelasEspecializables(escuelasCatalogo: EscuelaConjuros[]): EscuelaConjuros[] {
        const usadas = new Set<number>();
        return (escuelasCatalogo ?? [])
            .filter((escuela) => this.toNumber(escuela?.Id) > 0)
            .filter((escuela) => {
                const id = this.toNumber(escuela?.Id);
                if (usadas.has(id))
                    return false;
                usadas.add(id);
                return true;
            })
            .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    private obtenerCatalogoEscuelasProhibibles(escuelasCatalogo: EscuelaConjuros[], idEspecialista: number): EscuelaConjuros[] {
        const idEspecialistaNum = this.toNumber(idEspecialista);
        return this.obtenerCatalogoEscuelasEspecializables(escuelasCatalogo)
            .filter((escuela) => this.toNumber(escuela?.Id) !== idEspecialistaNum)
            .filter((escuela) => this.toBooleanValue(escuela?.Prohibible))
            .filter((escuela) => !this.esNombreAdivinacion(`${escuela?.Nombre ?? ''}`));
    }

    private obtenerCatalogoDisciplinasEspecializables(disciplinasCatalogo: DisciplinaConjuros[]): DisciplinaConjuros[] {
        const usadas = new Set<number>();
        return (disciplinasCatalogo ?? [])
            .filter((disciplina) => this.toNumber(disciplina?.Id) > 0)
            .filter((disciplina) => {
                const id = this.toNumber(disciplina?.Id);
                if (usadas.has(id))
                    return false;
                usadas.add(id);
                return true;
            })
            .sort((a, b) => `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    private esNombreAdivinacion(value: string): boolean {
        return this.normalizarTexto(value ?? '') === 'adivinacion';
    }

    private extraerNombreEscuelaProhibida(value: string | { Nombre?: string; } | null | undefined): string {
        if (typeof value === 'string')
            return value;
        if (value && typeof value === 'object')
            return `${(value as { Nombre?: string; })?.Nombre ?? ''}`;
        return '';
    }

    private resolverTipoLanzamientoClase(clase: Clase): TipoLanzamientoConjuros {
        const tipos: TipoLanzamientoConjuros[] = [];
        if (clase?.Conjuros?.Arcanos)
            tipos.push('arcano');
        if (clase?.Conjuros?.Divinos)
            tipos.push('divino');
        if (clase?.Conjuros?.Psionicos)
            tipos.push('psionico');
        if (clase?.Conjuros?.Alma)
            tipos.push('alma');
        if (tipos.length < 1)
            return 'arcano';
        if (tipos.length === 1)
            return tipos[0];
        return 'mixto';
    }

    private getNivelLanzadorEfectivoClase(nombreClase: string): number {
        const nivelBase = this.obtenerNivelActualClase(nombreClase);
        const bonus = this.obtenerBonusNivelLanzadorClase(nombreClase);
        return Math.max(0, nivelBase + bonus);
    }

    private obtenerBonusNivelLanzadorClase(nombreClase: string): number {
        const key = this.normalizarTexto(nombreClase);
        if (key.length < 1)
            return 0;
        return Math.max(0, this.toNumber(this.bonusNivelLanzadorPorClase[key]));
    }

    private incrementarBonusNivelLanzadorClase(nombreClase: string, delta: number): void {
        const key = this.normalizarTexto(nombreClase);
        if (key.length < 1)
            return;
        const actual = this.obtenerBonusNivelLanzadorClase(nombreClase);
        this.bonusNivelLanzadorPorClase[key] = Math.max(0, actual + Math.max(0, Math.trunc(this.toNumber(delta))));
    }

    private getEntradaConjurosActiva(): ConjurosSesionStateEntrada | null {
        if (!this.estadoFlujo.conjuros.activa)
            return null;
        const preferida = this.estadoFlujo.conjuros.entradas.findIndex((entrada) => {
            if (!entrada.seleccionManual || entrada.almaPendiente || entrada.sinElegibles)
                return false;
            if (this.toNumber(entrada.cupoPendiente?.total) > 0)
                return true;
            const pendientePorNivel = Object.values(entrada.cupoPendiente?.porNivel ?? {})
                .reduce((acc, value) => acc + Math.max(0, this.toNumber(value)), 0);
            return pendientePorNivel > 0;
        });
        if (preferida >= 0) {
            this.estadoFlujo.conjuros.indiceEntradaActual = preferida;
            return this.estadoFlujo.conjuros.entradas[preferida];
        }
        const indice = Math.max(0, Math.trunc(this.toNumber(this.estadoFlujo.conjuros.indiceEntradaActual)));
        return this.estadoFlujo.conjuros.entradas[indice] ?? this.estadoFlujo.conjuros.entradas[0] ?? null;
    }

    private obtenerConjurosElegiblesParaEntrada(entrada: ConjurosSesionStateEntrada): Conjuro[] {
        return (entrada?.elegiblesIds ?? [])
            .map((id) => this.obtenerConjuroCatalogoPorId(id))
            .filter((conjuro): conjuro is Conjuro => !!conjuro);
    }

    private resolverNivelConjuroEntrada(entrada: ConjurosSesionStateEntrada, conjuro: Conjuro): number {
        const nivel = this.toNumber(entrada?.nivelesPorConjuro?.[this.toNumber(conjuro?.Id)]);
        return Math.max(0, nivel);
    }

    private obtenerConjuroCatalogoPorId(idConjuro: number): Conjuro | null {
        const id = Math.trunc(this.toNumber(idConjuro));
        if (id <= 0)
            return null;
        if (this.conjurosSesionPlaceholderPorId[id])
            return this.conjurosSesionPlaceholderPorId[id];
        return this.catalogoConjuros.find((conjuro) => this.toNumber(conjuro?.Id) === id)
            ?? this.personajeCreacion.Conjuros.find((conjuro) => this.toNumber(conjuro?.Id) === id)
            ?? null;
    }

    private agregarConjuroSesionAPersonaje(entrada: ConjurosSesionStateEntrada, conjuroBase: Conjuro): void {
        const id = this.toNumber(conjuroBase?.Id);
        const nombreClase = `${entrada?.claseObjetivo?.nombre ?? ''}`.trim();
        if (id <= 0 || nombreClase.length < 1)
            return;
        if (this.esConjuroYaConocidoPorClase(nombreClase, id))
            return;

        const nivelClase = this.toNumber(entrada?.nivelesPorConjuro?.[id]);
        const conjuro: Conjuro = JSON.parse(JSON.stringify(conjuroBase));
        const conjuroRaw = conjuro as Record<string, any>;
        conjuroRaw['Origen'] = `${entrada?.origen ?? ''}`.trim();
        conjuroRaw['Clase_origen'] = nombreClase;
        conjuroRaw['Origen_clase'] = nombreClase;

        const idClase = this.toNumber(entrada?.claseObjetivo?.id);
        const nivelesClase = Array.isArray(conjuro.Nivel_clase)
            ? [...conjuro.Nivel_clase]
            : (conjuro.Nivel_clase && typeof conjuro.Nivel_clase === 'object' ? Object.values(conjuro.Nivel_clase as any) : []);
        const yaTieneNivelClase = nivelesClase.some((nivel) =>
            this.toNumber((nivel as Record<string, any>)?.['Id_clase']) === idClase
            || this.normalizarTexto((nivel as Record<string, any>)?.['Clase'] ?? '') === this.normalizarTexto(nombreClase)
        );
        if (!yaTieneNivelClase && idClase > 0) {
            nivelesClase.push({
                Id_clase: idClase,
                Clase: nombreClase,
                Nivel: Math.max(0, nivelClase),
                Espontaneo: false,
            } as any);
            conjuro.Nivel_clase = nivelesClase as any;
        }

        this.personajeCreacion.Conjuros.push(conjuro);
    }

    private aplicarConjurosNivelClase(
        clase: Clase,
        nivel: number,
        detalleSiguiente: ClaseNivelDetalle,
        detalleAnterior: ClaseNivelDetalle | null
    ): void {
        const refsDisponibles = this.obtenerConjurosDisponiblesNivelClase(clase, detalleSiguiente);
        if (refsDisponibles.length < 1)
            return;

        if (clase?.Conjuros?.Conocidos_total) {
            const objetivoActual = Math.max(0, this.toNumber(detalleSiguiente?.Conjuros_conocidos_total));
            const objetivoAnterior = detalleAnterior
                ? Math.max(0, this.toNumber(detalleAnterior?.Conjuros_conocidos_total))
                : 0;
            const delta = objetivoActual - objetivoAnterior;
            if (delta <= 0)
                return;

            const candidatos = refsDisponibles
                .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, this.toNumber(ref?.Id)));
            candidatos.slice(0, delta).forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
            return;
        }

        if (clase?.Conjuros?.Conocidos_nivel_a_nivel) {
            const actuales = this.normalizarMapaConjurosPorNivel(detalleSiguiente?.Conjuros_conocidos_nivel_a_nivel);
            const previos = this.normalizarMapaConjurosPorNivel(detalleAnterior?.Conjuros_conocidos_nivel_a_nivel);
            Object.keys(actuales)
                .map((key) => this.toNumber(key))
                .filter((nivelConjuro) => Number.isFinite(nivelConjuro) && nivelConjuro >= 0)
                .sort((a, b) => a - b)
                .forEach((nivelConjuro) => {
                    const actual = this.toNumber(actuales[nivelConjuro]);
                    const previo = this.toNumber(previos[nivelConjuro]);
                    const delta = actual - previo;
                    if (delta <= 0)
                        return;

                    const candidatosNivel = refsDisponibles
                        .filter((ref) => this.toNumber(ref?.Nivel) === nivelConjuro)
                        .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, this.toNumber(ref?.Id)));
                    candidatosNivel.slice(0, delta).forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
                });
            return;
        }

        refsDisponibles
            .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, this.toNumber(ref?.Id)))
            .forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
    }

    private obtenerConjurosDisponiblesNivelClase(clase: Clase, detalleNivel: ClaseNivelDetalle): ClaseConjuroRef[] {
        const acceso = this.resolverAccesoConjurosPorTipo(clase, detalleNivel, null);
        if (acceso.errores.length > 0)
            return [];
        return (clase?.Conjuros?.Listado ?? [])
            .filter((ref) => this.toNumber(ref?.Id) > 0 && `${ref?.Nombre ?? ''}`.trim().length > 0)
            .filter((ref) => !acceso.nivelesAccesibles || acceso.nivelesAccesibles.has(this.toNumber(ref?.Nivel)))
            .sort((a, b) => this.toNumber(a?.Nivel) - this.toNumber(b?.Nivel)
                || `${a?.Nombre ?? ''}`.localeCompare(`${b?.Nombre ?? ''}`, 'es', { sensitivity: 'base' }));
    }

    private normalizarMapaConjurosPorNivel(mapa: Record<string, number> | undefined | null): Record<number, number> {
        const resultado: Record<number, number> = {};
        if (!mapa)
            return resultado;

        Object.keys(mapa).forEach((key) => {
            const nivel = this.parseNivelConjuroKey(key);
            if (!Number.isFinite(nivel) || nivel < 0)
                return;
            resultado[nivel] = Math.max(0, this.toNumber((mapa as Record<string, any>)[key]));
        });
        return resultado;
    }

    private parseNivelConjuroKey(key: string): number {
        const raw = `${key ?? ''}`.trim();
        if (raw.length < 1)
            return -1;

        const directo = Number(raw);
        if (Number.isFinite(directo))
            return Math.trunc(directo);

        const match = raw.match(/nivel[_\s-]*(\d+)/i);
        if (match && match[1])
            return Math.trunc(Number(match[1]));

        return -1;
    }

    private esConjuroYaConocidoPorClase(nombreClase: string, idConjuro: number): boolean {
        const id = Math.trunc(this.toNumber(idConjuro));
        if (id <= 0)
            return false;

        const claseNorm = this.normalizarTexto(nombreClase);
        return (this.personajeCreacion.Conjuros ?? []).some((conjuro) => {
            if (this.toNumber(conjuro?.Id) !== id)
                return false;
            const origenClase = this.normalizarTexto(
                `${(conjuro as Record<string, any>)?.['Clase_origen'] ?? (conjuro as Record<string, any>)?.['Origen_clase'] ?? ''}`
            );
            if (origenClase.length < 1)
                return true;
            return origenClase === claseNorm;
        });
    }

    private agregarConjuroConocidoClase(clase: Clase, ref: ClaseConjuroRef, nivelClase: number): void {
        const idConjuro = Math.trunc(this.toNumber(ref?.Id));
        if (idConjuro <= 0 || this.esConjuroYaConocidoPorClase(clase.Nombre, idConjuro))
            return;

        const conjuro = this.crearConjuroPlaceholderDesdeClase(clase, ref, nivelClase);
        this.personajeCreacion.Conjuros.push(conjuro);
    }

    private crearConjuroPlaceholderDesdeClase(clase: Clase, ref: ClaseConjuroRef, nivelClase: number): Conjuro {
        const nombreClase = `${clase?.Nombre ?? ''}`.trim();
        const nombre = `${ref?.Nombre ?? ''}`.trim();
        const nivelConjuro = Math.max(0, Math.trunc(this.toNumber(ref?.Nivel)));
        const base: Conjuro = {
            Id: Math.trunc(this.toNumber(ref?.Id)),
            Nombre: nombre.length > 0 ? nombre : `Conjuro ${this.toNumber(ref?.Id)}`,
            Descripcion: 'No especifica',
            Tiempo_lanzamiento: 'No especifica',
            Alcance: 'No especifica',
            Escuela: {
                Id: 0,
                Nombre: 'No especifica',
                Nombre_especial: 'No especifica',
                Prohibible: false,
            },
            Disciplina: {
                Id: 0,
                Nombre: 'No especifica',
                Nombre_especial: 'No especifica',
                Subdisciplinas: [],
            },
            Manual: `${clase?.Manual?.Nombre ?? ''}`.trim() || 'No especifica',
            Objetivo: 'No especifica',
            Efecto: 'No especifica',
            Area: 'No especifica',
            Arcano: !!clase?.Conjuros?.Arcanos,
            Divino: !!clase?.Conjuros?.Divinos,
            Psionico: !!clase?.Conjuros?.Psionicos,
            Alma: !!clase?.Conjuros?.Alma,
            Duracion: 'No especifica',
            Tipo_salvacion: 'No especifica',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: 'No especifica',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: 'No especifica',
            Descriptores: [],
            Nivel_clase: [{
                Id_clase: this.toNumber(clase?.Id),
                Clase: nombreClase,
                Nivel: nivelConjuro,
                Espontaneo: !!ref?.Espontaneo,
            }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Componentes: [],
            Oficial: clase?.Oficial !== false,
        };

        const conjuroConOrigen = base as Record<string, any>;
        conjuroConOrigen['Origen'] = `${nombreClase} nivel ${nivelClase}`;
        conjuroConOrigen['Clase_origen'] = nombreClase;
        conjuroConOrigen['Origen_clase'] = nombreClase;
        return base;
    }

    private resolverIdIdiomaPorNombre(nombreIdioma: string): number | null {
        const nombreNorm = this.normalizarTexto(nombreIdioma);
        if (nombreNorm.length < 1)
            return null;
        const idioma = (this.estadoFlujo.ventajas.catalogoIdiomas ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = this.toNumber(idioma?.Id);
        return id > 0 ? id : null;
    }

    private resolverIdDominioPorNombre(nombreDominio: string): number | null {
        const nombreNorm = this.normalizarTexto(nombreDominio);
        if (nombreNorm.length < 1)
            return null;
        const dominio = (this.catalogoDominios ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = this.toNumber(dominio?.Id);
        return id > 0 ? id : null;
    }

    private resolverIdRegionPorNombre(nombreRegion: string): number | null {
        const nombreNorm = this.normalizarTexto(nombreRegion);
        if (nombreNorm.length < 1)
            return null;
        const region = (this.catalogoRegiones ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = this.toNumber(region?.Id);
        return id > 0 ? id : null;
    }

    private resolverNombreRegionPorId(idRegion: number): string {
        const id = this.toNumber(idRegion);
        if (id <= 0)
            return '';
        const region = (this.catalogoRegiones ?? [])
            .find((item) => this.toNumber(item?.Id) === id);
        return `${region?.Nombre ?? ''}`.trim();
    }

    private calcularAtaqueBaseDesdeClases(): number {
        return (this.personajeCreacion?.desgloseClases ?? []).reduce((acumulado, claseDesglose) => {
            const nombre = `${claseDesglose?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return acumulado;
            const nivel = this.toNumber(claseDesglose?.Nivel);
            if (nivel <= 0)
                return acumulado;

            const claseCatalogo = this.catalogoClases
                .find((clase) => this.normalizarTexto(clase?.Nombre ?? '') === this.normalizarTexto(nombre));
            if (!claseCatalogo)
                return acumulado;

            const detalleNivel = this.obtenerDetalleNivelClase(claseCatalogo, nivel);
            if (!detalleNivel)
                return acumulado;

            return acumulado + this.extraerPrimerEnteroConSigno(detalleNivel?.Ataque_base ?? '');
        }, 0);
    }

    private recalcularNepExperienciaOro(plantillasSeleccionadas?: Plantilla[]): void {
        const raza = this.razaSeleccionada;
        const seleccionadas = plantillasSeleccionadas ?? this.estadoFlujo.plantillas.seleccionadas;
        const ajusteRaza = this.toNumber(raza?.Ajuste_nivel);
        const ajustePlantillas = (seleccionadas ?? [])
            .reduce((acc, plantilla) => acc + this.toNumber(plantilla?.Ajuste_nivel), 0);
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        const dgsRaza = this.toNumber(raza?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(seleccionadas);
        const nivelEfectivo = nivelClases + ajusteRaza + ajustePlantillas + dgsRaza + dgsPlantillas;

        this.personajeCreacion.NEP = nivelEfectivo;
        this.personajeCreacion.Experiencia = this.calcularExperienciaPorNivel(nivelClases + ajusteRaza + ajustePlantillas);
        this.personajeCreacion.Oro_inicial = this.calcularOroPorNep(nivelEfectivo);
    }

    private recalcularDerivadasPorCaracteristicas(): void {
        this.recalcularDerivadasPorCombate();
        this.recalcularCapacidadCarga();
        this.actualizarModsHabilidadesPorCaracteristica();
    }

    private recalcularDerivadasPorCombate(): void {
        this.recalcularDefensasYPresa();
    }

    private recalcularDerivadasEconomiaYProgresion(plantillasSeleccionadas?: Plantilla[]): void {
        this.recalcularNepExperienciaOro(plantillasSeleccionadas);
    }

    private esTextoReglaValido(valor: string): boolean {
        const normalizado = this.normalizarTexto(valor);
        if (normalizado.length < 1)
            return false;
        return normalizado !== 'no especifica'
            && normalizado !== 'no se especifica'
            && normalizado !== 'no modifica'
            && normalizado !== 'no aplica'
            && normalizado !== '-'
            && normalizado !== 'ninguna';
    }

    private extraerPrimerEnteroConSigno(valor: string): number {
        const match = `${valor ?? ''}`.match(/[+-]?\d+/);
        if (!match || match.length < 1)
            return 0;
        return this.toNumber(match[0]);
    }

    private resolverDadoGolpeTipoActual(): number {
        const tipoActual = this.personajeCreacion.Tipo_criatura;
        const dadoPorTipo = this.toNumber(tipoActual?.Tipo_dado);
        if (dadoPorTipo > 0)
            return dadoPorTipo;

        const idTipo = this.toNumber(tipoActual?.Id_tipo_dado);
        if (idTipo <= 0)
            return 0;

        const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipo - 1));
        return DADOS_PROGRESION[idx];
    }

    private resolverDadoDesdePlantilla(plantilla: Plantilla): number {
        const porNombre = `${plantilla?.Tipo_dado?.Nombre ?? ''}`.match(/d\s*(\d+)/i);
        if (porNombre && porNombre[1]) {
            const dado = this.toNumber(porNombre[1]);
            if (DADOS_PROGRESION.includes(dado))
                return dado;
        }

        const idTipoDado = this.toNumber(plantilla?.Tipo_dado?.Id_tipo_dado);
        if (idTipoDado <= 0)
            return 0;

        const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipoDado - 1));
        return DADOS_PROGRESION[idx];
    }

    private aplicarPasoDado(actual: number, pasos: number): number {
        if (actual <= 0 || pasos === 0)
            return actual;

        let idxActual = DADOS_PROGRESION.indexOf(actual);
        if (idxActual < 0)
            idxActual = 0;
        const idxFinal = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idxActual + pasos));
        return DADOS_PROGRESION[idxFinal];
    }

    private calcularExperienciaPorNivel(nivelAjustado: number): number {
        const nivel = Math.max(0, Math.trunc(this.toNumber(nivelAjustado)));
        let acumulado = 0;
        for (let i = 0; i < nivel; i++)
            acumulado += i * 1000;
        return acumulado;
    }

    private calcularOroPorNep(nep: number): number {
        const valorNep = Math.max(0, Math.trunc(this.toNumber(nep)));
        const tabla: Record<number, number> = {
            1: 0,
            2: 900,
            3: 2700,
            4: 5400,
            5: 9000,
            6: 13000,
            7: 19000,
            8: 27000,
            9: 36000,
            10: 49000,
            11: 66000,
            12: 88000,
            13: 110000,
            14: 150000,
            15: 200000,
            16: 260000,
            17: 340000,
            18: 440000,
            19: 580000,
            20: 760000,
        };
        if (valorNep <= 20)
            return tabla[valorNep] || 0;
        return Math.round(760000 * (1.3 * (valorNep - 20)));
    }

    private recalcularCapacidadCarga(): void {
        const fuerza = Math.max(0, Math.trunc(this.toNumber(this.personajeCreacion?.Fuerza)));
        const pesadaBase = this.calcularCargaPesadaPorFuerza(fuerza);
        const multiplicadorTamano = this.obtenerMultiplicadorCargaBipedoPorTamano();
        const pesada = Math.max(0, Math.floor(pesadaBase * multiplicadorTamano));
        const media = Math.max(0, Math.floor((pesada * 2) / 3));
        const ligera = Math.max(0, Math.floor(pesada / 3));

        this.personajeCreacion.Capacidad_carga = {
            Ligera: ligera,
            Media: media,
            Pesada: pesada,
        };
    }

    private calcularCargaPesadaPorFuerza(fuerza: number): number {
        const valorFuerza = Math.max(0, Math.trunc(this.toNumber(fuerza)));
        if (valorFuerza <= 0)
            return 0;

        if (valorFuerza <= 39)
            return CARGA_PESADA_BASE_POR_FUERZA[valorFuerza] ?? 0;

        let fuerzaBase = valorFuerza;
        let factor = 1;
        while (fuerzaBase > 39) {
            fuerzaBase -= 10;
            factor *= 4;
        }
        const cargaBase = CARGA_PESADA_BASE_POR_FUERZA[fuerzaBase] ?? 0;
        return Math.floor(cargaBase * factor);
    }

    private obtenerMultiplicadorCargaBipedoPorTamano(): number {
        const modPresa = this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador_presa);
        if (Object.prototype.hasOwnProperty.call(CARGA_MULTIPLICADOR_BIPEDO_POR_MOD_PRESA, modPresa))
            return CARGA_MULTIPLICADOR_BIPEDO_POR_MOD_PRESA[modPresa];

        const nombreTamano = this.normalizarTexto(this.personajeCreacion?.Raza?.Tamano?.Nombre ?? '');
        if (nombreTamano.includes('colosal'))
            return 16;
        if (nombreTamano.includes('gargantuesc'))
            return 8;
        if (nombreTamano.includes('enorme') || nombreTamano.includes('huge'))
            return 4;
        if (nombreTamano.includes('grande') || nombreTamano.includes('large'))
            return 2;
        if (nombreTamano.includes('pequeno') || nombreTamano.includes('small'))
            return 0.75;
        if (nombreTamano.includes('diminuto') || nombreTamano.includes('diminutive'))
            return 0.25;
        if (nombreTamano.includes('minusculo') || nombreTamano.includes('tiny'))
            return 0.5;
        if (nombreTamano.includes('menudo') || nombreTamano.includes('fine'))
            return 0.125;
        return 1;
    }

    private obtenerMinimoCaracteristicaPorPlantillas(key: CaracteristicaKey): number {
        return this.estadoFlujo.plantillas.seleccionadas.reduce((maximo, plantilla) => {
            const valor = this.toNumber((plantilla?.Minimos_caracteristicas as Record<string, any>)?.[key]);
            if (valor <= 0)
                return maximo;
            return Math.max(maximo, valor);
        }, 0);
    }

    private recalcularDefensasYPresa(): void {
        const modTamanoCa = this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador);
        const modTamanoPresa = this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador_presa);
        const presaVarios = (this.personajeCreacion?.Presa_varios ?? [])
            .reduce((acc, mod) => acc + this.toNumber(mod?.Valor), 0);

        this.personajeCreacion.Ca = 10
            + this.toNumber(this.personajeCreacion.ModDestreza)
            + modTamanoCa
            + this.toNumber(this.personajeCreacion.Armadura_natural)
            + this.toNumber(this.personajeCreacion.Ca_desvio)
            + this.toNumber(this.personajeCreacion.Ca_varios);

        const ataqueBase = this.toNumber(this.personajeCreacion.Ataque_base);
        this.personajeCreacion.Presa = ataqueBase
            + this.toNumber(this.personajeCreacion.ModFuerza)
            + modTamanoPresa
            + presaVarios;
    }

    private agregarRacialPlantillaTexto(
        raciales: RacialDetalle[],
        texto: string,
        origen: string,
        prefijo: string
    ): void {
        const limpio = `${texto ?? ''}`.trim();
        if (!this.esTextoReglaValido(limpio))
            return;
        const nombreRacial = `${prefijo}: ${limpio}`.trim();
        const existe = raciales.some(r => this.normalizarTexto(r.Nombre) === this.normalizarTexto(nombreRacial));
        if (existe)
            return;

        const racial = createRacialPlaceholder(nombreRacial);
        racial.Origen = origen;
        raciales.push(racial);
    }

    private tieneRestriccionAlineamientoPlantilla(plantilla: Plantilla): boolean {
        if (this.toNumber(plantilla?.Alineamiento?.Prioridad?.Id_prioridad) <= 0)
            return false;

        const ejes = extraerEjesAlineamientoDesdeContrato(plantilla?.Alineamiento);
        return ejes.ley !== null || ejes.moral !== null;
    }

    private asegurarHabilidadDesdePlantilla(habilidadRef: Plantilla['Habilidades'][number]): Personaje['Habilidades'][number] | null {
        const raw = {
            Id_habilidad: this.toNumber(habilidadRef?.Id_habilidad),
            Habilidad: `${habilidadRef?.Habilidad ?? ''}`.trim(),
            Id_caracteristica: this.toNumber(habilidadRef?.Id_caracteristica),
            Caracteristica: `${habilidadRef?.Caracteristica ?? ''}`.trim(),
            Extra: `${habilidadRef?.Extra ?? ''}`.trim(),
            Varios: `${habilidadRef?.Varios ?? ''}`.trim(),
            Soporta_extra: !!habilidadRef?.Soporta_extra,
        };

        return this.asegurarHabilidadDesdeReferencia(raw, {
            marcarClasea: false,
            customPreferido: false,
        });
    }

    private copiarRaza(raza: Raza): Raza {
        return JSON.parse(JSON.stringify(raza ?? {}));
    }

    private construirRazaSimpleDesdeRaza(raza: Raza): RazaSimple {
        return {
            Id: this.toNumber(raza?.Id),
            Nombre: `${raza?.Nombre ?? ''}`.trim(),
            Ajuste_nivel: this.toNumber(raza?.Ajuste_nivel),
            Tamano: {
                Id: this.toNumber(raza?.Tamano?.Id),
                Nombre: `${raza?.Tamano?.Nombre ?? '-'}`,
                Modificador: this.toNumber(raza?.Tamano?.Modificador),
                Modificador_presa: this.toNumber(raza?.Tamano?.Modificador_presa),
            },
            Dgs_adicionales: {
                Cantidad: this.toNumber(raza?.Dgs_adicionales?.Cantidad),
                Dado: `${raza?.Dgs_adicionales?.Dado ?? ''}`.trim(),
                Tipo_criatura: `${raza?.Dgs_adicionales?.Tipo_criatura ?? ''}`.trim(),
            },
            Manual: `${raza?.Manual ?? ''}`.trim(),
            Clase_predilecta: `${raza?.Clase_predilecta ?? ''}`.trim(),
            Modificadores: {
                Fuerza: this.toNumber(raza?.Modificadores?.Fuerza),
                Destreza: this.toNumber(raza?.Modificadores?.Destreza),
                Constitucion: this.toNumber(raza?.Modificadores?.Constitucion),
                Inteligencia: this.toNumber(raza?.Modificadores?.Inteligencia),
                Sabiduria: this.toNumber(raza?.Modificadores?.Sabiduria),
                Carisma: this.toNumber(raza?.Modificadores?.Carisma),
            },
            Altura_rango_inf: this.toNumber(raza?.Altura_rango_inf),
            Altura_rango_sup: this.toNumber(raza?.Altura_rango_sup),
            Peso_rango_inf: this.toNumber(raza?.Peso_rango_inf),
            Peso_rango_sup: this.toNumber(raza?.Peso_rango_sup),
            Edad_adulto: this.toNumber(raza?.Edad_adulto),
            Edad_mediana: this.toNumber(raza?.Edad_mediana),
            Edad_viejo: this.toNumber(raza?.Edad_viejo),
            Edad_venerable: this.toNumber(raza?.Edad_venerable),
            Oficial: this.toBooleanValue(raza?.Oficial),
        };
    }

    private copiarRaciales(value: RacialDetalle[] | null | undefined): RacialDetalle[] {
        return normalizeRaciales(value)
            .map((r) => {
                const origen = `${r?.Origen ?? ''}`.trim();
                return {
                    ...r,
                    Nombre: `${r?.Nombre ?? ''}`.trim(),
                    Origen: origen.length > 0 ? origen : undefined,
                };
            })
            .filter((r) => this.normalizarTexto(r.Nombre).length > 0);
    }

    private copiarSortilegas(value: AptitudSortilega[] | null | undefined): AptitudSortilega[] {
        const listado = Array.isArray(value)
            ? value
            : (value && typeof value === 'object' ? Object.values(value as any) : []);

        return listado
            .map((s: any) => ({
                Conjuro: { ...(s?.Conjuro ?? {}) } as any,
                Nivel_lanzador: this.toNumber(s?.Nivel_lanzador),
                Usos_diarios: `${s?.Usos_diarios ?? ''}`.trim(),
                Descripcion: `${s?.Descripcion ?? ''}`.trim(),
                Dgs_necesarios: this.toNumber(s?.Dgs_necesarios),
                Origen: `${s?.Origen ?? ''}`.trim(),
            }))
            .filter((s) => this.normalizarTexto(`${s?.Conjuro?.Nombre ?? ''}`).length > 0);
    }

    private copiarIdiomas(value: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[] | null | undefined) {
        return (value ?? [])
            .map((i) => ({
                Nombre: `${i?.Nombre ?? ''}`.trim(),
                Descripcion: `${i?.Descripcion ?? ''}`.trim(),
                Secreto: !!i?.Secreto,
                Oficial: !!i?.Oficial,
                Origen: `${i?.Origen ?? ''}`.trim() || undefined,
            }))
            .filter(i => i.Nombre.length > 0);
    }

    private recalcularTipoYSubtiposDerivados(): void {
        const tipoBase = this.resolverTipoBaseRaza();
        const seleccionadas = this.estadoFlujo.plantillas.seleccionadas;
        const simulacion = simularEstadoPlantillas(tipoBase, seleccionadas);
        const tipoResultante = this.resolverTipoCriaturaResultante(
            tipoBase,
            simulacion.tipoCriaturaActualId,
            simulacion.tipoCriaturaActualNombre
        );
        const subtiposBase = this.copiarSubtipos(this.razaSeleccionada?.Subtipos ?? []);
        const subtiposResultantes = this.resolverSubtiposResultantes(subtiposBase, seleccionadas);
        const rasgosTipoConOrigen = this.asignarOrigenRasgosTipo(
            tipoResultante.Rasgos,
            tipoResultante.Nombre
        );

        this.personajeCreacion.Tipo_criatura = {
            ...tipoResultante,
            Rasgos: rasgosTipoConOrigen,
        };
        this.personajeCreacion.Subtipos = subtiposResultantes;
        this.estadoFlujo.plantillas.tipoCriaturaSimulada = {
            Id: this.toNumber(tipoResultante?.Id),
            Nombre: `${tipoResultante?.Nombre ?? '-'}`,
        };
        this.estadoFlujo.plantillas.licantropiaActiva = simulacion.licantropiaActiva;
        this.estadoFlujo.plantillas.heredadaActiva = simulacion.heredadaActiva || !!this.razaSeleccionada?.Heredada;
        this.personajeCreacion.Plantillas = seleccionadas.map(plantilla => this.mapPlantillaParaPersonaje(plantilla));
        this.sincronizarCaracteristicasPerdidasConTipoActual();
        if (this.estadoFlujo.caracteristicasGeneradas) {
            this.aplicarCaracteristicasFinalesDesdeBase();
        } else {
            this.aplicarPerdidasSinGenerador();
        }
    }

    private resolverTipoBaseRaza(): TipoCriatura {
        if (this.razaSeleccionada?.Tipo_criatura)
            return this.copiarTipoCriatura(this.razaSeleccionada.Tipo_criatura);
        if (this.personajeCreacion?.Tipo_criatura)
            return this.copiarTipoCriatura(this.personajeCreacion.Tipo_criatura);
        return this.crearTipoCriaturaFallback(0, '-');
    }

    private resolverTipoCriaturaResultante(tipoBase: TipoCriatura, tipoResultanteIdRaw: number, tipoResultanteNombreRaw: string): TipoCriatura {
        const tipoResultanteId = this.toNumber(tipoResultanteIdRaw);
        const tipoBaseId = this.toNumber(tipoBase?.Id);
        const tipoFinalId = tipoResultanteId > 0 ? tipoResultanteId : tipoBaseId;

        const fromCatalog = this.buscarTipoCriaturaPorId(tipoFinalId);
        if (fromCatalog)
            return this.copiarTipoCriatura(fromCatalog);

        if (tipoFinalId > 0 && tipoBaseId > 0 && tipoFinalId === tipoBaseId)
            return this.copiarTipoCriatura(tipoBase);

        const nombreResultado = `${tipoResultanteNombreRaw ?? ''}`.trim();
        if (nombreResultado.length > 0)
            return this.crearTipoCriaturaFallback(tipoFinalId, nombreResultado);

        if (tipoFinalId > 0)
            return this.crearTipoCriaturaFallback(tipoFinalId, `Tipo #${tipoFinalId}`);

        return this.copiarTipoCriatura(tipoBase);
    }

    private resolverSubtiposResultantes(subtiposBase: SubtipoRef[], seleccionadas: Plantilla[]): SubtipoRef[] {
        let actuales = this.copiarSubtipos(subtiposBase);
        seleccionadas.forEach((plantilla) => {
            const subtiposPlantilla = this.copiarSubtipos(plantilla?.Subtipos ?? []);
            if (subtiposPlantilla.length > 0)
                actuales = this.unirSubtiposDeduplicados(actuales, subtiposPlantilla);
        });
        return actuales;
    }

    private buscarTipoCriaturaPorId(idTipo: number): TipoCriatura | null {
        const id = this.toNumber(idTipo);
        if (id <= 0)
            return null;
        return this.catalogoTiposCriatura.find((tipo) => this.toNumber(tipo?.Id) === id) ?? null;
    }

    private copiarTipoCriatura(tipo: TipoCriatura | null | undefined): TipoCriatura {
        if (!tipo)
            return this.crearTipoCriaturaFallback(0, '-');

        return {
            Id: this.toNumber(tipo.Id),
            Nombre: `${tipo.Nombre ?? '-'}`,
            Descripcion: `${tipo.Descripcion ?? ''}`,
            Manual: `${tipo.Manual ?? ''}`,
            Id_tipo_dado: this.toNumber(tipo.Id_tipo_dado),
            Tipo_dado: this.toNumber(tipo.Tipo_dado),
            Id_ataque: this.toNumber(tipo.Id_ataque),
            Id_fortaleza: this.toNumber(tipo.Id_fortaleza),
            Id_reflejos: this.toNumber(tipo.Id_reflejos),
            Id_voluntad: this.toNumber(tipo.Id_voluntad),
            Id_puntos_habilidad: this.toNumber(tipo.Id_puntos_habilidad),
            Come: this.toBooleanValue(tipo.Come),
            Respira: this.toBooleanValue(tipo.Respira),
            Duerme: this.toBooleanValue(tipo.Duerme),
            Recibe_criticos: this.toBooleanValue(tipo.Recibe_criticos),
            Puede_ser_flanqueado: this.toBooleanValue(tipo.Puede_ser_flanqueado),
            Pierde_constitucion: this.toBooleanValue(tipo.Pierde_constitucion),
            Limite_inteligencia: this.toNumber(tipo.Limite_inteligencia),
            Tesoro: `${tipo.Tesoro ?? ''}`,
            Id_alineamiento: this.toNumber(tipo.Id_alineamiento),
            Rasgos: this.asignarOrigenRasgosTipo(tipo.Rasgos, tipo.Nombre),
            Oficial: this.toBooleanValue(tipo.Oficial),
        };
    }

    private crearTipoCriaturaFallback(id: number, nombre: string): TipoCriatura {
        return {
            Id: this.toNumber(id),
            Nombre: `${nombre ?? '-'}`,
            Descripcion: '',
            Manual: '',
            Id_tipo_dado: 0,
            Tipo_dado: 0,
            Id_ataque: 0,
            Id_fortaleza: 0,
            Id_reflejos: 0,
            Id_voluntad: 0,
            Id_puntos_habilidad: 0,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: '',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: false,
        };
    }

    private copiarSubtipos(value: SubtipoRef[] | null | undefined): SubtipoRef[] {
        return normalizeSubtipoRefArray(value)
            .map((subtipo) => ({
                Id: this.toNumber(subtipo?.Id),
                Nombre: `${subtipo?.Nombre ?? ''}`.trim(),
            }))
            .filter((subtipo) => subtipo.Nombre.length > 0 || subtipo.Id > 0);
    }

    private unirSubtiposDeduplicados(base: SubtipoRef[], extra: SubtipoRef[]): SubtipoRef[] {
        const resultado: SubtipoRef[] = [];
        const vistos = new Set<string>();

        [...base, ...extra].forEach((subtipo) => {
            const id = this.toNumber(subtipo?.Id);
            const nombreNorm = this.normalizarTexto(`${subtipo?.Nombre ?? ''}`);
            const key = id > 0 ? `id:${id}` : `n:${nombreNorm}`;
            if ((id <= 0 && nombreNorm.length < 1) || vistos.has(key))
                return;
            vistos.add(key);
            resultado.push({
                Id: id,
                Nombre: `${subtipo?.Nombre ?? ''}`.trim(),
            });
        });

        return resultado;
    }

    private idiomaYaEnPersonajeOSeleccion(nombreIdioma: string, exceptVentajaId?: number): boolean {
        const normalizado = this.normalizarTexto(nombreIdioma);
        if (normalizado.length < 1)
            return false;

        const enBase = this.estadoFlujo.ventajas.baseIdiomas.some(i => this.normalizarTexto(i.Nombre) === normalizado);
        if (enBase)
            return true;

        return this.estadoFlujo.ventajas.seleccionVentajas
            .filter(v => v.id !== exceptVentajaId)
            .some((v) => this.normalizarTexto(v.idioma?.Nombre ?? '') === normalizado);
    }

    private comprobarPersistenciaBorradorActiva(): void {
        const uid = `${this.draftUidActivo ?? ''}`.trim();
        if (uid.length < 1)
            return;

        const firmaActual = this.getFirmaBorradorLocal(uid);
        if (firmaActual === this.draftUltimaFirmaPersistida)
            return;

        this.programarPersistenciaBorradorLocal();
    }

    private programarPersistenciaBorradorLocal(): void {
        const uid = `${this.draftUidActivo ?? ''}`.trim();
        if (uid.length < 1)
            return;

        if (this.draftPersistTimer)
            clearTimeout(this.draftPersistTimer);

        this.draftPersistTimer = setTimeout(() => {
            this.draftPersistTimer = null;
            this.persistirBorradorLocalAhora(uid);
        }, NUEVO_PERSONAJE_DRAFT_DEBOUNCE_MS);
    }

    private construirBorradorLocal(uid: string): NuevoPersonajeDraftV1 | null {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return null;
        if (!this.tieneCreacionEnCurso())
            return null;

        return {
            version: NUEVO_PERSONAJE_DRAFT_VERSION,
            uid: uidNormalizado,
            updatedAt: Date.now(),
            personaje: this.clonarProfundo(this.personajeCreacion),
            razaSeleccionada: this.clonarProfundo(this.razaSeleccionada),
            razaBaseSeleccionada: this.clonarProfundo(this.razaBaseSeleccionadaCompleta),
            estadoFlujoPersistible: {
                pasoActual: this.resolverPasoPersistible(this.estadoFlujo.pasoActual),
                caracteristicasGeneradas: this.estadoFlujo.caracteristicasGeneradas === true,
                generador: this.clonarProfundo(this.estadoFlujo.generador),
                plantillas: {
                    seleccionadas: this.clonarProfundo(this.estadoFlujo.plantillas.seleccionadas),
                    confirmadasIds: this.clonarProfundo(this.estadoFlujo.plantillas.confirmadasIds),
                    retornoFinNivelPendiente: this.estadoFlujo.plantillas.retornoFinNivelPendiente === true,
                    tipoCriaturaSimulada: this.clonarProfundo(this.estadoFlujo.plantillas.tipoCriaturaSimulada),
                    licantropiaActiva: this.estadoFlujo.plantillas.licantropiaActiva === true,
                    heredadaActiva: this.estadoFlujo.plantillas.heredadaActiva === true,
                },
                ventajas: {
                    seleccionVentajas: this.clonarProfundo(this.estadoFlujo.ventajas.seleccionVentajas),
                    seleccionDesventajas: this.clonarProfundo(this.estadoFlujo.ventajas.seleccionDesventajas),
                },
                habilidades: this.clonarProfundo(this.estadoFlujo.habilidades),
                conjuros: this.clonarProfundo(this.estadoFlujo.conjuros),
            },
            dotesPendientes: this.clonarProfundo(this.dotesPendientes),
            secuenciaDotePendiente: Math.max(1, Math.trunc(this.toNumber(this.secuenciaDotePendiente))),
            dotesProgresionConcedidas: Math.max(0, Math.trunc(this.toNumber(this.dotesProgresionConcedidas))),
            dotesExtraRazaConcedidas: Math.max(0, Math.trunc(this.toNumber(this.dotesExtraRazaConcedidas))),
            aumentosPendientesCaracteristica: this.clonarProfundo(this.aumentosPendientesCaracteristica),
            aumentosProgresionConcedidos: Math.max(0, Math.trunc(this.toNumber(this.aumentosProgresionConcedidos))),
            secuenciaAumentoPendiente: Math.max(1, Math.trunc(this.toNumber(this.secuenciaAumentoPendiente))),
            bonusNivelLanzadorPorClase: this.clonarProfundo(this.bonusNivelLanzadorPorClase),
            idsEspecialesInternosActivos: Array.from(this.idsEspecialesInternosActivos.values()),
            idsDotesInternosActivos: Array.from(this.idsDotesInternosActivos.values()),
            conjurosSesionPlaceholderPorId: this.clonarProfundo(this.conjurosSesionPlaceholderPorId),
        };
    }

    private hidratarDesdeBorradorLocal(borrador: NuevoPersonajeDraftV1): void {
        const catalogoHabilidades = this.estadoFlujo.ventajas.catalogoHabilidades.slice();
        const catalogoHabilidadesCustom = this.estadoFlujo.ventajas.catalogoHabilidadesCustom.slice();
        const catalogoIdiomas = this.estadoFlujo.ventajas.catalogoIdiomas.slice();
        const catalogoVentajas = this.estadoFlujo.ventajas.catalogoVentajas.slice();
        const catalogoDesventajas = this.estadoFlujo.ventajas.catalogoDesventajas.slice();
        const catalogoClases = this.catalogoClases.slice();
        const catalogoDotes = this.catalogoDotes.slice();
        const catalogoConjuros = this.catalogoConjuros.slice();
        const catalogoDominios = this.catalogoDominios.slice();
        const catalogoRegiones = this.catalogoRegiones.slice();
        const catalogoDeidades = this.catalogoDeidades.slice();

        this.personajeCreacion = this.clonarProfundo(borrador.personaje ?? this.crearPersonajeBase());
        this.razaSeleccionada = this.clonarProfundo(borrador.razaSeleccionada ?? null);
        this.razaBaseSeleccionadaCompleta = this.clonarProfundo(borrador.razaBaseSeleccionada ?? null);
        this.estadoFlujo = this.crearEstadoFlujoBase();

        const flujoPersistido = borrador.estadoFlujoPersistible;
        if (flujoPersistido) {
            this.estadoFlujo.pasoActual = this.normalizarPasoRestaurado(flujoPersistido.pasoActual);
            this.estadoFlujo.modalCaracteristicasAbierto = false;
            this.estadoFlujo.caracteristicasGeneradas = flujoPersistido.caracteristicasGeneradas === true;
            this.estadoFlujo.generador = this.clonarProfundo(flujoPersistido.generador ?? this.estadoFlujo.generador);
            this.estadoFlujo.plantillas = {
                ...this.crearPlantillasFlujoBase(),
                seleccionadas: this.clonarProfundo(flujoPersistido.plantillas?.seleccionadas ?? []),
                confirmadasIds: this.clonarProfundo(flujoPersistido.plantillas?.confirmadasIds ?? []),
                retornoFinNivelPendiente: flujoPersistido.plantillas?.retornoFinNivelPendiente === true,
                tipoCriaturaSimulada: this.clonarProfundo(
                    flujoPersistido.plantillas?.tipoCriaturaSimulada ?? this.crearPlantillasFlujoBase().tipoCriaturaSimulada
                ),
                licantropiaActiva: flujoPersistido.plantillas?.licantropiaActiva === true,
                heredadaActiva: flujoPersistido.plantillas?.heredadaActiva === true,
            };
            this.estadoFlujo.ventajas = {
                ...this.crearVentajasFlujoBase(),
                seleccionVentajas: this.clonarProfundo(flujoPersistido.ventajas?.seleccionVentajas ?? []),
                seleccionDesventajas: this.clonarProfundo(flujoPersistido.ventajas?.seleccionDesventajas ?? []),
            };
            this.estadoFlujo.habilidades = {
                ...this.crearHabilidadesFlujoBase(),
                ...this.clonarProfundo(flujoPersistido.habilidades ?? this.crearHabilidadesFlujoBase()),
            };
            this.estadoFlujo.conjuros = {
                ...this.crearConjurosFlujoBase(),
                ...this.clonarProfundo(flujoPersistido.conjuros ?? this.crearConjurosFlujoBase()),
            };
        }

        this.dotesPendientes = this.clonarProfundo(borrador.dotesPendientes ?? []);
        this.secuenciaDotePendiente = Math.max(1, Math.trunc(this.toNumber(borrador.secuenciaDotePendiente)));
        this.dotesProgresionConcedidas = Math.max(0, Math.trunc(this.toNumber(borrador.dotesProgresionConcedidas)));
        this.dotesExtraRazaConcedidas = Math.max(0, Math.trunc(this.toNumber(borrador.dotesExtraRazaConcedidas)));
        this.aumentosPendientesCaracteristica = this.clonarProfundo(borrador.aumentosPendientesCaracteristica ?? []);
        this.aumentosProgresionConcedidos = Math.max(0, Math.trunc(this.toNumber(borrador.aumentosProgresionConcedidos)));
        this.secuenciaAumentoPendiente = Math.max(1, Math.trunc(this.toNumber(borrador.secuenciaAumentoPendiente)));
        this.bonusNivelLanzadorPorClase = this.clonarProfundo(borrador.bonusNivelLanzadorPorClase ?? {});
        this.conjurosSesionPlaceholderPorId = this.clonarProfundo(borrador.conjurosSesionPlaceholderPorId ?? {});
        this.idsEspecialesInternosActivos = new Set<number>(
            (borrador.idsEspecialesInternosActivos ?? [])
                .map((id) => Math.trunc(this.toNumber(id)))
                .filter((id) => id > 0)
        );
        this.idsDotesInternosActivos = new Set<number>(
            (borrador.idsDotesInternosActivos ?? [])
                .map((id) => Math.trunc(this.toNumber(id)))
                .filter((id) => id > 0)
        );

        this.setCatalogoHabilidades(catalogoHabilidades);
        this.setCatalogoHabilidadesCustom(catalogoHabilidadesCustom);
        this.setCatalogoIdiomas(catalogoIdiomas);
        this.setCatalogosVentajas(catalogoVentajas, catalogoDesventajas);
        this.setCatalogoClases(catalogoClases);
        this.setCatalogoDotes(catalogoDotes);
        this.setCatalogoConjuros(catalogoConjuros);
        this.setCatalogoDominios(catalogoDominios);
        this.setCatalogoRegiones(catalogoRegiones);
        this.setCatalogoDeidades(catalogoDeidades);

        this.sincronizarCaracteristicasPerdidasConTipoActual();
        this.recalcularTipoYSubtiposDerivados();
        this.sincronizarBaseVentajasDesdePersonaje();
        this.recalcularEfectosVentajas();
        this.recalcularSimulacionPlantillas();
        this.refrescarDerivadasPreviewNuevoPersonaje();
    }

    private leerBorradorLocal(uid: string): NuevoPersonajeDraftV1 | null {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            return null;

        const raw = this.leerStorage(this.getClaveBorradorLocal(uidNormalizado));
        if (!raw)
            return null;

        try {
            const parsed = JSON.parse(raw) as NuevoPersonajeDraftV1;
            if (!this.esBorradorLocalValido(parsed, uidNormalizado))
                return null;
            if (this.estaBorradorLocalCaducado(parsed)) {
                this.eliminarBorradorStorage(uidNormalizado);
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    private esBorradorLocalValido(value: NuevoPersonajeDraftV1 | null | undefined, uid: string): value is NuevoPersonajeDraftV1 {
        if (!value || typeof value !== 'object')
            return false;
        if (this.toNumber((value as any).version) !== NUEVO_PERSONAJE_DRAFT_VERSION)
            return false;
        if (`${(value as any).uid ?? ''}`.trim() !== `${uid ?? ''}`.trim())
            return false;
        if (!(value as any).personaje || !(value as any).estadoFlujoPersistible)
            return false;
        return true;
    }

    private estaBorradorLocalCaducado(borrador: NuevoPersonajeDraftV1): boolean {
        const updatedAt = Math.trunc(this.toNumber((borrador as any)?.updatedAt));
        if (updatedAt <= 0)
            return true;

        return (Date.now() - updatedAt) > NUEVO_PERSONAJE_DRAFT_TTL_MS;
    }

    private escribirBorradorStorage(uid: string, borrador: NuevoPersonajeDraftV1): void {
        this.escribirStorage(this.getClaveBorradorLocal(uid), JSON.stringify(borrador));
    }

    private eliminarBorradorStorage(uid: string): void {
        this.eliminarStorage(this.getClaveBorradorLocal(uid));
    }

    private getClaveBorradorLocal(uid: string): string {
        return `${NUEVO_PERSONAJE_DRAFT_STORAGE_PREFIX}${`${uid ?? ''}`.trim()}`;
    }

    private getFirmaBorradorLocal(uid: string): string | null {
        const borrador = this.construirBorradorLocal(uid);
        return borrador ? this.firmarBorradorLocal(borrador) : null;
    }

    private firmarBorradorLocal(borrador: NuevoPersonajeDraftV1): string {
        const firma = {
            ...borrador,
            updatedAt: 0,
        };
        return JSON.stringify(firma);
    }

    private tieneCreacionEnCurso(): boolean {
        if (this.razaSeleccionada !== null)
            return true;
        if (`${this.personajeCreacion?.Nombre ?? ''}`.trim().length > 0)
            return true;
        if (this.estadoFlujo.pasoActual !== 'raza')
            return true;
        return false;
    }

    private resolverPasoPersistible(paso: StepNuevoPersonaje): StepNuevoPersonaje {
        return this.normalizarPasoRestaurado(paso);
    }

    private normalizarPasoRestaurado(paso: StepNuevoPersonaje): StepNuevoPersonaje {
        if (!this.razaSeleccionada || this.toNumber(this.personajeCreacion?.Raza?.Id) <= 0)
            return 'raza';

        const pasoNormalizado: StepNuevoPersonaje = (
            paso === 'basicos'
            || paso === 'plantillas'
            || paso === 'ventajas'
            || paso === 'clases'
            || paso === 'habilidades'
            || paso === 'conjuros'
            || paso === 'dotes'
        ) ? paso : 'raza';

        if (pasoNormalizado === 'raza')
            return 'basicos';

        if (!this.estadoFlujo.caracteristicasGeneradas && this.pasoRequiereCaracteristicasGeneradas(pasoNormalizado))
            return 'basicos';

        return pasoNormalizado;
    }

    private pasoRequiereCaracteristicasGeneradas(paso: StepNuevoPersonaje): boolean {
        return paso === 'plantillas'
            || paso === 'ventajas'
            || paso === 'clases'
            || paso === 'habilidades'
            || paso === 'conjuros'
            || paso === 'dotes';
    }

    private leerStorage(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    private escribirStorage(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignorado: localStorage puede no estar disponible.
        }
    }

    private eliminarStorage(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignorado: localStorage puede no estar disponible.
        }
    }

    private clonarProfundo<T>(value: T): T {
        if (typeof structuredClone === 'function')
            return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }

    private crearEstadoFlujoBase(): EstadoFlujoNuevoPersonaje {
        const config = this.getConfigGeneradorEfectiva();
        const indiceMinimo = this.getIndexByMinimo(config.minimoSeleccionado);
        return {
            pasoActual: 'raza',
            modalCaracteristicasAbierto: false,
            caracteristicasGeneradas: false,
            generador: {
                minimoSeleccionado: this.getMinimoByIndex(indiceMinimo),
                indiceMinimo,
                tiradasCache: this.crearTiradasCache(),
                tablasPermitidas: config.tablasPermitidas,
                tablaSeleccionada: null,
                asignaciones: this.crearAsignacionesVacias(),
                origenesAsignacion: this.crearOrigenesAsignacionVacios(),
                poolDisponible: [],
            },
            plantillas: this.crearPlantillasFlujoBase(),
            ventajas: this.crearVentajasFlujoBase(),
            habilidades: this.crearHabilidadesFlujoBase(),
            conjuros: this.crearConjurosFlujoBase(),
        };
    }

    private crearPlantillasFlujoBase(): PlantillasFlujoState {
        return {
            disponibles: [],
            seleccionadas: [],
            confirmadasIds: [],
            retornoFinNivelPendiente: false,
            tipoCriaturaSimulada: {
                Id: this.toNumber(this.personajeCreacion?.Tipo_criatura?.Id),
                Nombre: `${this.personajeCreacion?.Tipo_criatura?.Nombre ?? '-'}`,
            },
            licantropiaActiva: false,
            heredadaActiva: false,
        };
    }

    private getIdsPlantillasConfirmadasSet(): Set<number> {
        return new Set(
            (this.estadoFlujo?.plantillas?.confirmadasIds ?? [])
                .map((id) => this.toNumber(id))
                .filter((id) => id > 0)
        );
    }

    private getDgsAdicionalesDesdePlantillas(plantillas: Plantilla[] | null | undefined): number {
        return (plantillas ?? [])
            .reduce((acc, plantilla) => acc + this.toNumber(plantilla?.Licantronia_dg?.Multiplicador), 0);
    }

    private crearVentajasFlujoBase(): VentajasFlujoState {
        return {
            catalogoVentajas: [],
            catalogoDesventajas: [],
            catalogoHabilidades: [],
            catalogoHabilidadesCustom: [],
            catalogoIdiomas: [],
            seleccionVentajas: [],
            seleccionDesventajas: [],
            puntosDisponibles: 0,
            puntosGastados: 0,
            puntosRestantes: 0,
            hayDeficit: false,
            pendientesOro: [],
            bonosHabilidades: {},
            baseCaracteristicas: null,
            baseRaciales: [],
            baseIdiomas: [],
        };
    }

    private crearHabilidadesFlujoBase(): HabilidadesFlujoState {
        return {
            activa: false,
            origen: null,
            returnStep: null,
            puntosTotales: 0,
            puntosRestantes: 0,
            nivelPersonajeReferencia: 0,
            classSkillTemporales: [],
            rangosIniciales: {},
        };
    }

    private crearConjurosFlujoBase(): ConjurosFlujoState {
        return {
            activa: false,
            indiceEntradaActual: 0,
            returnStep: 'dotes',
            entradas: [],
            avisos: [],
        };
    }

    private crearTiradasCache(): number[][] {
        return Array.from(
            { length: FILAS_TIRADAS },
            () => Array.from({ length: MAX_TABLAS * TIRADAS_POR_TABLA }, () => 0)
        );
    }

    private crearAsignacionesVacias(): AsignacionCaracteristicas {
        return {
            Fuerza: null,
            Destreza: null,
            Constitucion: null,
            Inteligencia: null,
            Sabiduria: null,
            Carisma: null,
        };
    }

    private crearOrigenesAsignacionVacios(): Record<CaracteristicaKey, number | null> {
        return {
            Fuerza: null,
            Destreza: null,
            Constitucion: null,
            Inteligencia: null,
            Sabiduria: null,
            Carisma: null,
        };
    }

    private asegurarTiradasPorIndice(index: number): void {
        const seguro = Math.max(0, Math.min(FILAS_TIRADAS - 1, index));
        const fila = this.estadoFlujo.generador.tiradasCache[seguro];
        if (fila[0] !== 0) {
            return;
        }

        const minimo = this.getMinimoByIndex(seguro);
        for (let i = 0; i < MAX_TABLAS * TIRADAS_POR_TABLA; i++) {
            fila[i] = this.randomInt(minimo, 18);
        }
    }

    private getMinimoByIndex(index: number): number {
        return this.normalizarMinimo(MIN_TIRADA + index);
    }

    private getIndexByMinimo(minimo: number): number {
        const normalizado = this.normalizarMinimo(minimo);
        return normalizado - MIN_TIRADA;
    }

    private normalizarMinimo(minimo: number): number {
        return Math.max(MIN_TIRADA, Math.min(MAX_TIRADA, minimo));
    }

    private normalizarTablasPermitidas(tablas: number): number {
        const normalizadas = Math.trunc(tablas);
        if (!Number.isFinite(normalizadas)) {
            return DEFAULT_TABLAS;
        }
        return Math.max(MIN_TABLAS, Math.min(MAX_TABLAS, normalizadas));
    }

    private normalizarTablaSeleccionada(tabla: number): number | null {
        const normalizada = Math.trunc(tabla);
        if (!Number.isFinite(normalizada)) {
            return null;
        }

        return normalizada >= MIN_TABLAS && normalizada <= this.estadoFlujo.generador.tablasPermitidas
            ? normalizada
            : null;
    }

    private normalizarTablaConFallback(tabla: number): number {
        const normalizada = Math.trunc(tabla);
        if (!Number.isFinite(normalizada)) {
            return MIN_TABLAS;
        }
        return Math.max(MIN_TABLAS, Math.min(MAX_TABLAS, normalizada));
    }

    private esCuestionarioAutoGeneradorValido(input: GeneradorAutoCuestionario | null | undefined): input is GeneradorAutoCuestionario {
        if (!input)
            return false;
        return !!input.q1 && !!input.q2 && !!input.q3;
    }

    private getRankingCaracteristicasAutoGenerador(score: GeneradorAutoScore): CaracteristicaKey[] {
        return [...CARACTERISTICAS_KEYS].sort((a, b) => {
            const scoreA = this.toNumber(score[a]);
            const scoreB = this.toNumber(score[b]);
            const modA = this.getModRacialGenerador(a);
            const modB = this.getModRacialGenerador(b);
            if (scoreB !== scoreA)
                return scoreB - scoreA;
            if (modB !== modA)
                return modB - modA;
            return CARACTERISTICAS_KEYS.indexOf(a) - CARACTERISTICAS_KEYS.indexOf(b);
        });
    }

    private getRecomendacionAutoDesdeScore(
        score: GeneradorAutoScore,
        ranking: CaracteristicaKey[]
    ): GeneradorAutoRecomendacion | null {
        const top1 = ranking[0];
        const top2 = ranking[1];
        const top3 = ranking[2];
        if (!top1 || !top2 || !top3)
            return null;

        const directa = this.getRecomendacionBaseAuto(top1, top2);
        const inversa = directa ? null : this.getRecomendacionBaseAuto(top2, top1);
        const base = directa ?? inversa ?? GENERADOR_AUTO_RECOMENDACIONES_FALLBACK[top1];
        if (!base)
            return null;

        const clases: [GeneradorAutoClaseRecomendada, GeneradorAutoClaseRecomendada] = [...base.clases];
        let afinadaPorTop3 = false;
        const scoreTop2 = this.toNumber(score[top2]);
        const scoreTop3 = this.toNumber(score[top3]);
        if (Math.abs(scoreTop2 - scoreTop3) <= GENERADOR_AUTO_RECOMENDACION_UMBRAL_TOP3) {
            const afinidadPrimera = this.getAfinidadClaseConTop3Auto(clases[0], top3);
            const afinidadSegunda = this.getAfinidadClaseConTop3Auto(clases[1], top3);
            if (afinidadSegunda > afinidadPrimera) {
                const temp = clases[0];
                clases[0] = clases[1];
                clases[1] = temp;
                afinadaPorTop3 = true;
            }
        }

        return {
            clases,
            explicacion: base.explicacion,
            explicacionKey: base.explicacionKey,
            top1,
            top2,
            top3,
            afinadaPorTop3,
        };
    }

    private getRecomendacionBaseAuto(
        topA: CaracteristicaKey,
        topB: CaracteristicaKey
    ): GeneradorAutoRecomendacionBase | null {
        const key = `${topA}_${topB}` as GeneradorAutoComboKey;
        return GENERADOR_AUTO_RECOMENDACIONES_POR_COMBO[key] ?? null;
    }

    private getAfinidadClaseConTop3Auto(claseNombre: string, top3: CaracteristicaKey): number {
        const normalizado = this.normalizarTexto(claseNombre);
        const afinidades = GENERADOR_AUTO_AFINIDAD_CLASES[normalizado] ?? [];
        return afinidades.includes(top3) ? 1 : 0;
    }

    private crearScoreAutoVacio(): GeneradorAutoScore {
        return {
            Fuerza: 0,
            Destreza: 0,
            Constitucion: 0,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        };
    }

    private aplicarDeltaScoreAuto(
        score: GeneradorAutoScore,
        delta: Partial<Record<CaracteristicaKey, number>> | null | undefined
    ): void {
        if (!delta)
            return;
        CARACTERISTICAS_KEYS.forEach((key) => {
            const actual = this.toNumber(score[key]);
            const extra = this.toNumber(delta[key]);
            score[key] = actual + extra;
        });
    }

    private aplicarRespuestaQ2Auto(
        score: GeneradorAutoScore,
        q1: GeneradorAutoRespuestaQ1 | undefined,
        q2: GeneradorAutoRespuestaQ2
    ): void {
        if (q2 === 'delante') {
            this.aplicarDeltaScoreAuto(score, { Constitucion: 5 });
            if (q1 === 'acero_musculo')
                this.aplicarDeltaScoreAuto(score, { Fuerza: 2 });
            else if (q1 === 'fe_naturaleza_espiritu')
                this.aplicarDeltaScoreAuto(score, { Sabiduria: 2 });
            else if (q1 === 'labia_presencia')
                this.aplicarDeltaScoreAuto(score, { Carisma: 1, Fuerza: 1 });
            return;
        }

        if (q2 === 'primera_segunda_linea') {
            this.aplicarDeltaScoreAuto(score, { Constitucion: 2 });
            if (q1 === 'rapidez_precision')
                this.aplicarDeltaScoreAuto(score, { Destreza: 3 });
            else if (q1 === 'acero_musculo')
                this.aplicarDeltaScoreAuto(score, { Fuerza: 3 });
            else if (q1 === 'magia_arcana')
                this.aplicarDeltaScoreAuto(score, { Destreza: 1, Inteligencia: 2 });
            return;
        }

        if (q2 === 'atras_control_apoyo') {
            this.aplicarDeltaScoreAuto(score, { Constitucion: 1 });
            if (q1 === 'magia_arcana')
                this.aplicarDeltaScoreAuto(score, { Inteligencia: 3 });
            else if (q1 === 'fe_naturaleza_espiritu')
                this.aplicarDeltaScoreAuto(score, { Sabiduria: 3 });
            else if (q1 === 'rapidez_precision')
                this.aplicarDeltaScoreAuto(score, { Destreza: 3 });
            else if (q1 === 'labia_presencia')
                this.aplicarDeltaScoreAuto(score, { Carisma: 3 });
            return;
        }

        if (q2 === 'evitar_contacto') {
            this.aplicarDeltaScoreAuto(score, { Destreza: 4, Inteligencia: 1 });
        }
    }

    private aplicarRespuestaQ4Auto(
        score: GeneradorAutoScore,
        q1: GeneradorAutoRespuestaQ1 | undefined,
        q4: GeneradorAutoRespuestaQ4
    ): void {
        if (q4 === 'acierto') {
            if (q1 === 'acero_musculo')
                this.aplicarDeltaScoreAuto(score, { Fuerza: 4 });
            else if (q1 === 'rapidez_precision')
                this.aplicarDeltaScoreAuto(score, { Destreza: 4 });
            else
                this.aplicarDeltaScoreAuto(score, { Fuerza: 2, Destreza: 2 });
            return;
        }

        if (q4 === 'potencia_conjuros') {
            if (q1 === 'magia_arcana')
                this.aplicarDeltaScoreAuto(score, { Inteligencia: 4 });
            else if (q1 === 'fe_naturaleza_espiritu')
                this.aplicarDeltaScoreAuto(score, { Sabiduria: 4 });
            else if (q1 === 'labia_presencia')
                this.aplicarDeltaScoreAuto(score, { Carisma: 4 });
            else
                this.aplicarDeltaScoreAuto(score, { Inteligencia: 2, Sabiduria: 2 });
            return;
        }

        const deltaMap: Record<'aguante' | 'percepcion' | 'social', Partial<Record<CaracteristicaKey, number>>> =
            GENERADOR_AUTO_SCORING_RULES.q4;
        if (q4 === 'aguante' || q4 === 'percepcion' || q4 === 'social')
            this.aplicarDeltaScoreAuto(score, deltaMap[q4]);
    }

    private getOpcionPreferidaQ2(q1?: GeneradorAutoRespuestaQ1): GeneradorAutoRespuestaQ2 {
        if (!q1)
            return 'primera_segunda_linea';
        if (q1 === 'acero_musculo')
            return 'delante';
        if (q1 === 'rapidez_precision')
            return 'primera_segunda_linea';
        if (q1 === 'labia_presencia')
            return 'atras_control_apoyo';
        return 'atras_control_apoyo';
    }

    private getOpcionPreferidaQ3(q1?: GeneradorAutoRespuestaQ1): GeneradorAutoRespuestaQ3 {
        if (!q1)
            return 'social';
        if (q1 === 'labia_presencia')
            return 'social';
        if (q1 === 'magia_arcana' || q1 === 'voluntad_psionica')
            return 'investigar';
        if (q1 === 'fe_naturaleza_espiritu')
            return 'explorar';
        if (q1 === 'rapidez_precision')
            return 'manitas';
        return 'explorar';
    }

    private ordenarOpcionesConPreferida<T>(base: T[], preferida: T): T[] {
        const resto = base.filter((item) => item !== preferida);
        return [preferida, ...resto];
    }

    private seleccionarMejorTablaAutoGenerador(
        tablasDisponibles: number[],
        rankingActivas: CaracteristicaKey[]
    ): number | null {
        const evaluadas = tablasDisponibles.map((tabla) => {
            const tiradas = this.getTiradasTabla(tabla);
            const total = tiradas.reduce((acc, valor) => acc + this.toNumber(valor), 0);
            const maximo = tiradas.reduce((acc, valor) => Math.max(acc, this.toNumber(valor)), 0);
            const utilidad = this.calcularUtilidadTablaAutoGenerador(tiradas, rankingActivas);
            return { tabla, total, maximo, utilidad };
        });

        evaluadas.sort((a, b) => {
            if (b.total !== a.total)
                return b.total - a.total;
            if (b.maximo !== a.maximo)
                return b.maximo - a.maximo;
            if (b.utilidad !== a.utilidad)
                return b.utilidad - a.utilidad;
            return a.tabla - b.tabla;
        });

        return evaluadas[0]?.tabla ?? null;
    }

    private calcularUtilidadTablaAutoGenerador(
        tiradasTabla: number[],
        rankingActivas: CaracteristicaKey[]
    ): number {
        const valoresOrdenados = [...tiradasTabla]
            .map((valor) => this.toNumber(valor))
            .sort((a, b) => b - a);
        const limite = Math.min(valoresOrdenados.length, rankingActivas.length);
        let utilidad = 0;
        for (let i = 0; i < limite; i++) {
            const caracteristica = rankingActivas[i];
            const peso = GENERADOR_AUTO_PESOS_POR_POSICION[i] ?? 0;
            const valorFinal = valoresOrdenados[i] + this.getModRacialGenerador(caracteristica);
            utilidad += valorFinal * peso;
        }
        return utilidad;
    }

    private getModRacialGenerador(caracteristica: CaracteristicaKey): number {
        return this.toNumber(this.personajeCreacion?.Raza?.Modificadores?.[caracteristica]);
    }

    private persistirConfigGenerador(): void {
        if (!this.userSettingsSvc)
            return;

        const payload: Pick<NuevoPersonajeGeneradorConfig, 'minimoSeleccionado' | 'tablasPermitidas'> = {
            minimoSeleccionado: this.generadorConfigBase.minimoSeleccionado,
            tablasPermitidas: this.generadorConfigBase.tablasPermitidas,
        };
        this.userSettingsSvc.saveGeneradorConfig(payload).catch(() => {
            // Si falla la escritura remota, mantenemos la configuración actual en memoria.
        });
    }

    private aplicarConfigGeneradorEfectiva(): void {
        const config = this.getConfigGeneradorEfectiva();
        const indiceMinimo = this.getIndexByMinimo(config.minimoSeleccionado);
        this.estadoFlujo.generador.minimoSeleccionado = this.getMinimoByIndex(indiceMinimo);
        this.estadoFlujo.generador.indiceMinimo = indiceMinimo;
        this.estadoFlujo.generador.tablasPermitidas = config.tablasPermitidas;
        this.asegurarTiradasPorIndice(indiceMinimo);
        this.resetearGeneradorCaracteristicas();
    }

    private getConfigGeneradorEfectiva(): { minimoSeleccionado: number; tablasPermitidas: number; } {
        return this.restriccionCampanaGenerador ?? this.generadorConfigBase;
    }

    private getConfigGeneradorDefault(): { minimoSeleccionado: number; tablasPermitidas: number; } {
        return {
            minimoSeleccionado: DEFAULT_TIRADA,
            tablasPermitidas: DEFAULT_TABLAS,
        };
    }

    calcularVidaFinalAleatoria(): ResultadoCalculoVidaFinal {
        const raza = this.razaSeleccionada;
        const plantillas = this.estadoFlujo.plantillas.seleccionadas ?? [];
        const dgsRaciales = Math.max(0, Math.trunc(this.toNumber(raza?.Dgs_adicionales?.Cantidad)));
        const bonoDotes = this.resolverBonosPgsDesdeDotes();
        const reglaConstitucion = this.resolverModConstitucionParaVida();

        const flags = {
            dadosGolpe: false,
            dgsRacialesExtra: dgsRaciales > 0,
            plantillasDgsAdicionales: false,
            plantillasAumentoReduccionDgs: false,
            plantillasActualizacionDgsRazaClase: false,
            dotesSumaAdicionalDgs: bonoDotes.bonoPlano !== 0 || bonoDotes.bonoPorDadoClase !== 0,
        };

        let vida = 0;
        let vidaMax = 0;
        let tiradasAleatorias = 0;
        let dadoRacial = this.resolverCarasDadoRacialParaVida(raza);
        let overrideDadoClase: number | null = null;

        plantillas.forEach((plantilla) => {
            const dadoDirecto = this.resolverDadoDesdePlantilla(plantilla);
            const pasoDado = Math.trunc(this.toNumber(plantilla?.Modificacion_dg?.Id_paso_modificacion));
            const actualizaDg = this.toBooleanValue(plantilla?.Actualiza_dg);
            const multiplicadorLic = Math.max(0, Math.trunc(this.toNumber(plantilla?.Licantronia_dg?.Multiplicador)));
            const sumaLic = this.toNumber(plantilla?.Licantronia_dg?.Suma);

            if (dadoDirecto > 0 && dadoDirecto > dadoRacial) {
                dadoRacial = dadoDirecto;
            } else if (pasoDado !== 0) {
                // Paridad C#: tanto + como - terminan moviendo el dado hacia arriba.
                dadoRacial = this.aplicarPasoDado(dadoRacial, Math.abs(pasoDado));
            }

            if (actualizaDg && dadoDirecto > 0)
                overrideDadoClase = dadoDirecto;

            flags.plantillasAumentoReduccionDgs = flags.plantillasAumentoReduccionDgs || pasoDado !== 0;
            flags.plantillasActualizacionDgsRazaClase = flags.plantillasActualizacionDgsRazaClase || actualizaDg;
            flags.plantillasDgsAdicionales = flags.plantillasDgsAdicionales || multiplicadorLic > 0 || sumaLic !== 0;
        });

        const dadoRacialCalculado = Math.max(1, Math.trunc(dadoRacial));
        const maximoRacialPorDg = dadoRacialCalculado * 2 + 2 + reglaConstitucion.modificador;
        for (let i = 0; i < dgsRaciales; i++) {
            const tirada = this.randomInt(1, dadoRacialCalculado * 2 + 2);
            vida += tirada + reglaConstitucion.modificador;
            vidaMax += maximoRacialPorDg;
            tiradasAleatorias++;
        }

        let nivelesClase = 0;
        (this.personajeCreacion.desgloseClases ?? []).forEach((claseDesglose) => {
            const nivel = Math.max(0, Math.trunc(this.toNumber(claseDesglose?.Nivel)));
            if (nivel < 1)
                return;

            const nombreClase = `${claseDesglose?.Nombre ?? ''}`.trim();
            const dadoClase = overrideDadoClase && overrideDadoClase > 0
                ? overrideDadoClase
                : this.resolverCarasDadoClaseParaVida(nombreClase, dadoRacialCalculado);
            const dadoClaseCalculado = Math.max(1, Math.trunc(dadoClase));
            const maximoClasePorDg = dadoClaseCalculado * 2 + 2 + reglaConstitucion.modificador + bonoDotes.bonoPorDadoClase;

            vida += maximoClasePorDg;
            vidaMax += maximoClasePorDg;
            for (let i = 1; i < nivel; i++) {
                const tirada = this.randomInt(1, dadoClaseCalculado * 2 + 2);
                vida += tirada + reglaConstitucion.modificador + bonoDotes.bonoPorDadoClase;
                vidaMax += maximoClasePorDg;
                tiradasAleatorias++;
            }

            nivelesClase += nivel;
            flags.dadosGolpe = true;
        });

        plantillas.forEach((plantilla) => {
            const cantidadDgLic = Math.max(0, Math.trunc(this.toNumber(plantilla?.Licantronia_dg?.Multiplicador)));
            const sumaDgLic = this.toNumber(plantilla?.Licantronia_dg?.Suma);
            const dadoLic = this.resolverCarasDadoLicantronia(plantilla, dadoRacialCalculado);
            const dadoLicCalculado = Math.max(1, Math.trunc(dadoLic));
            const maximoLicPorDg = dadoLicCalculado * 2 + 2 + reglaConstitucion.modificador;

            for (let i = 1; i < cantidadDgLic; i++)
                vidaMax += maximoLicPorDg;

            vidaMax += sumaDgLic;
        });

        vida += bonoDotes.bonoPlano;
        vidaMax += bonoDotes.bonoPlano;

        return {
            total: Math.max(1, Math.trunc(vida)),
            maximo: Math.max(1, Math.trunc(vidaMax)),
            detalle: {
                constitucionAplicada: reglaConstitucion.aplica,
                modificadorConstitucion: reglaConstitucion.modificador,
                tiradasAleatorias,
                dgsRaciales,
                nivelesClase,
                bonoPlanoDotes: bonoDotes.bonoPlano,
                bonoPorDadoClaseDotes: bonoDotes.bonoPorDadoClase,
                flags,
            },
        };
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private resolverModConstitucionParaVida(): { aplica: boolean; modificador: number; } {
        const pierdeConstitucion = this.toBooleanValue(this.personajeCreacion?.Tipo_criatura?.Pierde_constitucion)
            || this.toBooleanValue(this.personajeCreacion?.Constitucion_perdida);
        if (pierdeConstitucion)
            return { aplica: false, modificador: 0 };
        return {
            aplica: true,
            modificador: this.toNumber(this.personajeCreacion?.ModConstitucion),
        };
    }

    private resolverCarasDadoRacialParaVida(raza: Raza | null): number {
        const dadoRaza = this.resolverCarasDadoDesdeTexto(`${raza?.Dgs_adicionales?.Dado ?? ''}`);
        if (dadoRaza > 0)
            return dadoRaza;

        const dadoPreview = Math.trunc(this.toNumber(this.personajeCreacion?.Dados_golpe));
        if (dadoPreview > 0)
            return dadoPreview;

        const dadoTipo = this.resolverDadoGolpeTipoActual();
        if (dadoTipo > 0)
            return dadoTipo;

        return 8;
    }

    private resolverCarasDadoClaseParaVida(nombreClase: string, fallback: number): number {
        const nombreNorm = this.normalizarTexto(nombreClase);
        const clase = (this.catalogoClases ?? [])
            .find((item) => this.normalizarTexto(item?.Nombre ?? '') === nombreNorm) ?? null;
        const dadoClase = this.resolverCarasDadoClase(clase);
        if (dadoClase > 0)
            return dadoClase;
        return Math.max(1, Math.trunc(this.toNumber(fallback)));
    }

    private resolverCarasDadoClase(clase: Clase | null): number {
        if (!clase)
            return 0;

        const porNombre = this.resolverCarasDadoDesdeTexto(`${clase?.Tipo_dado?.Nombre ?? ''}`);
        if (porNombre > 0)
            return porNombre;

        const idTipo = Math.trunc(this.toNumber(clase?.Tipo_dado?.Id));
        if (idTipo > 0) {
            const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipo - 1));
            return DADOS_PROGRESION[idx];
        }

        return 0;
    }

    private resolverCarasDadoLicantronia(plantilla: Plantilla, fallback: number): number {
        const porNombre = this.resolverCarasDadoDesdeTexto(`${plantilla?.Licantronia_dg?.Dado ?? ''}`);
        if (porNombre > 0)
            return porNombre;

        const idDado = Math.trunc(this.toNumber(plantilla?.Licantronia_dg?.Id_dado));
        if (idDado > 0) {
            const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idDado - 1));
            return DADOS_PROGRESION[idx];
        }

        const porPlantilla = this.resolverDadoDesdePlantilla(plantilla);
        if (porPlantilla > 0)
            return porPlantilla;

        return Math.max(1, Math.trunc(this.toNumber(fallback)));
    }

    private resolverCarasDadoDesdeTexto(valor: string): number {
        const match = `${valor ?? ''}`.match(/d\s*(\d+)/i);
        if (!match || !match[1])
            return 0;
        const caras = Math.trunc(this.toNumber(match[1]));
        if (caras <= 0)
            return 0;
        return caras;
    }

    private resolverBonosPgsDesdeDotes(): { bonoPlano: number; bonoPorDadoClase: number; } {
        let bonoPlano = 0;
        let bonoPorDadoClase = 0;

        (this.personajeCreacion.DotesContextuales ?? []).forEach((entrada) => {
            const mods = (entrada?.Dote?.Modificadores ?? {}) as Record<string, any>;
            bonoPlano += this.sumarModificadorDotePorClaves(mods, CLAVES_MOD_DOTE_PGS_PLANO);
            bonoPorDadoClase += this.sumarModificadorDotePorClaves(mods, CLAVES_MOD_DOTE_PGS_POR_DADO);
        });

        return {
            bonoPlano: Math.trunc(bonoPlano),
            bonoPorDadoClase: Math.trunc(bonoPorDadoClase),
        };
    }

    private sumarModificadorDotePorClaves(mods: Record<string, any>, claves: Set<string>): number {
        return Object.entries(mods ?? {}).reduce((acumulado, [clave, valor]) => {
            const claveNormalizada = this.normalizarClaveModificadorDote(clave);
            if (!claves.has(claveNormalizada))
                return acumulado;
            return acumulado + this.toNumber(valor);
        }, 0);
    }

    private normalizarClaveModificadorDote(clave: string): string {
        return this.normalizarTexto(`${clave ?? ''}`).replace(/[^a-z0-9]/g, '');
    }

    private calcularModificador(valor: number): number {
        return Math.floor((valor - 10) / 2);
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private toBooleanValue(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value === 1;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
        }
        return false;
    }

    private esCaracteristicaAumentoValida(value: string): value is CaracteristicaKey {
        return (CARACTERISTICAS_KEYS as string[]).includes(`${value ?? ''}`.trim());
    }

    private getNivelEfectivoParaAumentos(): number {
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        const dgsRaza = this.toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return Math.max(0, nivelClases + dgsRaza + dgsPlantillas);
    }

    private getNivelEfectivoParaDotesProgresion(): number {
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return Math.max(0, nivelClases + dgsPlantillas);
    }

    private getDgsRacialesAdicionalesParaDotesProgresion(): number {
        return Math.max(0, this.toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad));
    }

    private tieneDgsAdicionalesParaDoteInicial(): boolean {
        const dgsRaza = this.toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return dgsRaza > 0 || dgsPlantillas > 0;
    }

    private crearPendienteAumento(valor: number, origen: string, descripcion: string): AumentoCaracteristicaPendiente {
        return {
            id: this.secuenciaAumentoPendiente++,
            valor: Math.max(1, Math.trunc(this.toNumber(valor))),
            origen: `${origen ?? ''}`.trim(),
            descripcion: `${descripcion ?? ''}`.trim(),
        };
    }

    private resolverValorAumentoDesdeEspecial(especialNivel: ClaseEspecialNivel): number {
        const especialRaw = (especialNivel?.Especial ?? {}) as Record<string, any>;
        const candidatos = [
            especialRaw?.['Modificadores']?.['Caracteristica'],
            especialRaw?.['modificadores']?.['caracteristica'],
            especialRaw?.['Bonificadores']?.['Caracteristica'],
            especialRaw?.['bonificadores']?.['caracteristica'],
            especialRaw?.['Caracteristica'],
            especialRaw?.['caracteristica'],
        ];

        for (const candidato of candidatos) {
            const valor = Math.trunc(this.toNumber(candidato));
            if (valor > 0)
                return valor;
        }

        return 0;
    }

    private esEspecialEnemigoPredilecto(especialNivel: ClaseEspecialNivel): boolean {
        const especialRaw = (especialNivel?.Especial ?? {}) as Record<string, any>;
        const nombre = this.normalizarTexto(`${especialRaw?.['Nombre'] ?? especialRaw?.['nombre'] ?? ''}`);
        if (nombre.length < 1)
            return false;
        return nombre.includes('enemigo predilecto')
            || nombre.includes('enemigos predilectos');
    }

    private esCaracteristicaPerdida(key: CaracteristicaKey): boolean {
        const mapa = this.personajeCreacion?.Caracteristicas_perdidas ?? {};
        const valorMapa = this.toBooleanValue((mapa as Record<string, any>)?.[key]);
        if (key === 'Constitucion') {
            const legado = this.toBooleanValue(this.personajeCreacion?.Constitucion_perdida);
            return valorMapa || legado;
        }
        return valorMapa;
    }

    private setCaracteristicaPerdida(key: CaracteristicaKey, estado: any, _origen?: string): void {
        const valor = this.toBooleanValue(estado);
        const perdidasActuales = {
            ...this.personajeCreacion.Caracteristicas_perdidas,
            [key]: valor,
        };
        this.personajeCreacion.Caracteristicas_perdidas = perdidasActuales;

        if (key === 'Constitucion')
            this.personajeCreacion.Constitucion_perdida = valor;
    }

    private sincronizarAliasConstitucionPerdida(): void {
        this.personajeCreacion.Constitucion_perdida = this.esCaracteristicaPerdida('Constitucion');
        this.personajeCreacion.Caracteristicas_perdidas = {
            ...this.personajeCreacion.Caracteristicas_perdidas,
            Constitucion: this.personajeCreacion.Constitucion_perdida,
        };
    }

    private sincronizarCaracteristicasPerdidasConTipoActual(): void {
        const tipoActual = this.personajeCreacion?.Tipo_criatura;
        const pierdeConstitucion = this.toBooleanValue(tipoActual?.Pierde_constitucion);
        this.setCaracteristicaPerdida('Constitucion', pierdeConstitucion, 'tipo_criatura');
    }

    private aplicarPerdidasSinGenerador(): void {
        CARACTERISTICAS_KEYS.forEach((key) => {
            if (!this.esCaracteristicaPerdida(key))
                return;
            this.setValorCaracteristica(key, 0);
            this.setModCaracteristica(key, 0);
        });
        this.sincronizarAliasConstitucionPerdida();
    }

    private normalizarTexto(valor: string): string {
        return `${valor ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private asignarOrigenRaciales(raciales: RacialDetalle[], origen: string): RacialDetalle[] {
        const origenNormalizado = `${origen ?? ''}`.trim();
        if (origenNormalizado.length < 1)
            return raciales;
        return raciales.map((racial) => ({
            ...racial,
            Origen: `${racial?.Origen ?? ''}`.trim() || origenNormalizado,
        }));
    }

    private asignarOrigenSortilegas(sortilegas: AptitudSortilega[], origen: string): AptitudSortilega[] {
        const origenNormalizado = `${origen ?? ''}`.trim();
        if (origenNormalizado.length < 1)
            return sortilegas;
        return sortilegas.map((sortilega) => ({
            ...sortilega,
            Origen: `${sortilega?.Origen ?? ''}`.trim() || origenNormalizado,
        }));
    }

    private asignarOrigenRasgosTipo(rasgos: any, nombreTipo: string): any[] {
        const origenTipo = `${nombreTipo ?? ''}`.trim();
        const listado = Array.isArray(rasgos)
            ? rasgos
            : (rasgos && typeof rasgos === 'object' ? Object.values(rasgos) : []);
        return listado.map((rasgo: any) => {
            const origen = `${rasgo?.Origen ?? rasgo?.origen ?? ''}`.trim();
            return {
                ...rasgo,
                Origen: origen.length > 0 ? origen : (origenTipo.length > 0 ? origenTipo : undefined),
            };
        });
    }

    private crearCaracteristicasVariosVacias() {
        return {
            Fuerza: [],
            Destreza: [],
            Constitucion: [],
            Inteligencia: [],
            Sabiduria: [],
            Carisma: [],
        };
    }

    private inicializarHabilidadesBase(force: boolean): void {
        if (this.estadoFlujo.ventajas.catalogoHabilidades.length < 1)
            return;

        if (!force && this.personajeCreacion.Habilidades.length > 0)
            return;

        this.personajeCreacion.Habilidades = this.estadoFlujo.ventajas.catalogoHabilidades
            .map((h) => {
                const carKey = this.resolverCaracteristicaPorIdOTexto(h.Id_caracteristica, h.Caracteristica);
                return {
                    Id: this.toNumber(h.Id_habilidad),
                    Nombre: `${h.Nombre ?? ''}`,
                    Clasea: false,
                    Entrenada: !!h.Entrenada,
                    Car: this.etiquetaCaracteristica(carKey, h.Caracteristica),
                    Mod_car: this.modificadorPorCaracteristica(carKey),
                    Rangos: 0,
                    Rangos_varios: 0,
                    Extra: '',
                    Extra_bloqueado: false,
                    Varios: '',
                    Custom: false,
                    Soporta_extra: !!h.Soporta_extra,
                    Extras: (h.Extras ?? []).map((extra) => ({
                        Id_extra: this.toNumber(extra?.Id_extra),
                        Extra: `${extra?.Extra ?? ''}`,
                        Descripcion: `${extra?.Descripcion ?? ''}`,
                    })),
                    Bonos_varios: [],
                };
            })
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarModsHabilidadesPorCaracteristica(): void {
        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades.map((h) => {
            const key = this.resolverCaracteristicaPorTexto(h.Car);
            return {
                ...h,
                Mod_car: this.modificadorPorCaracteristica(key),
            };
        });
    }

    private sanitizarSeleccionesVentajas(): void {
        const idsVentajas = new Set(this.estadoFlujo.ventajas.catalogoVentajas.map(v => v.Id));
        const idsDesventajas = new Set(this.estadoFlujo.ventajas.catalogoDesventajas.map(v => v.Id));

        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas
            .filter(v => idsVentajas.has(v.id))
            .slice(0, MAX_VENTAJAS_SELECCIONABLES);
        this.estadoFlujo.ventajas.seleccionDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas
            .filter(v => idsDesventajas.has(v.id));
    }

    private sanitizarIdiomasEnVentajas(): void {
        const idsIdiomas = new Set(this.estadoFlujo.ventajas.catalogoIdiomas.map(i => i.Id));
        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas.map((seleccion) => {
            if (!seleccion.idioma)
                return seleccion;
            return {
                ...seleccion,
                idioma: idsIdiomas.has(seleccion.idioma.Id) ? seleccion.idioma : null,
            };
        });
    }

    private resolverCaracteristicaPorIdOTexto(id: number, texto: string): CaracteristicaKey {
        const map: Record<number, CaracteristicaKey> = {
            1: 'Fuerza',
            2: 'Destreza',
            3: 'Constitucion',
            4: 'Inteligencia',
            5: 'Sabiduria',
            6: 'Carisma',
        };
        if (map[id])
            return map[id];
        return this.resolverCaracteristicaPorTexto(texto);
    }

    private resolverCaracteristicaPorTexto(texto: string): CaracteristicaKey {
        const normalizado = this.normalizarTexto(texto);
        if (normalizado.startsWith('fue') || normalizado.includes('fuerza'))
            return 'Fuerza';
        if (normalizado.startsWith('des') || normalizado.includes('destreza'))
            return 'Destreza';
        if (normalizado.startsWith('con') || normalizado.includes('constitucion'))
            return 'Constitucion';
        if (normalizado.startsWith('int') || normalizado.includes('inteligencia'))
            return 'Inteligencia';
        if (normalizado.startsWith('sab') || normalizado.includes('sabiduria'))
            return 'Sabiduria';
        if (normalizado.startsWith('car') || normalizado.includes('carisma'))
            return 'Carisma';
        return 'Destreza';
    }

    private etiquetaCaracteristica(key: CaracteristicaKey, fallback: string): string {
        const fallbackValue = `${fallback ?? ''}`.trim();
        if (fallbackValue.length > 0)
            return fallbackValue;
        return key;
    }

    private modificadorPorCaracteristica(key: CaracteristicaKey): number {
        if (key === 'Fuerza')
            return this.personajeCreacion.ModFuerza;
        if (key === 'Destreza')
            return this.personajeCreacion.ModDestreza;
        if (key === 'Constitucion')
            return this.personajeCreacion.ModConstitucion;
        if (key === 'Inteligencia')
            return this.personajeCreacion.ModInteligencia;
        if (key === 'Sabiduria')
            return this.personajeCreacion.ModSabiduria;
        return this.personajeCreacion.ModCarisma;
    }

    private setValorCaracteristica(key: CaracteristicaKey, valor: number): void {
        (this.personajeCreacion as Record<string, any>)[key] = this.toNumber(valor);
    }

    private setModCaracteristica(key: CaracteristicaKey, mod: number): void {
        const prop = `Mod${key}`;
        (this.personajeCreacion as Record<string, any>)[prop] = this.toNumber(mod);
    }

    private mapPlantillaParaPersonaje(plantilla: Plantilla) {
        return {
            Id: this.toNumber(plantilla.Id),
            Nombre: `${plantilla.Nombre ?? ''}`,
            Ataques: `${plantilla.Ataques ?? ''}`,
            Ataque_completo: `${plantilla.Ataque_completo ?? ''}`,
            Id_tamano: this.toNumber(plantilla.Tamano?.Id),
            Tamano: `${plantilla.Tamano?.Nombre ?? '-'}`,
            Id_tamano_pasos: this.toNumber(plantilla.Modificacion_tamano?.Id_paso_modificacion),
            Tamano_pasos: `${plantilla.Modificacion_tamano?.Nombre ?? '-'}`,
            // Pendiente para aplicacion de efectos: si Tipo_dado es "Elegir", no altera los dados de golpe del personaje.
            Id_dados_golpe: this.toNumber(plantilla.Tipo_dado?.Id_tipo_dado),
            Dados_golpe: `${plantilla.Tipo_dado?.Nombre ?? '-'}`,
            Id_dados_golpe_pasos: this.toNumber(plantilla.Modificacion_dg?.Id_paso_modificacion),
            Dados_golpe_pasos: `${plantilla.Modificacion_dg?.Nombre ?? '-'}`,
            Actualiza_dgs: !!plantilla.Actualiza_dg,
            Multiplicador_dgs_lic: this.toNumber(plantilla.Licantronia_dg?.Multiplicador),
            Tipo_dgs_lic: `${plantilla.Licantronia_dg?.Dado ?? ''}`,
            Suma_dgs_lic: this.toNumber(plantilla.Licantronia_dg?.Suma),
            Correr: this.toNumber(plantilla.Movimientos?.Correr),
            Nadar: this.toNumber(plantilla.Movimientos?.Nadar),
            Volar: this.toNumber(plantilla.Movimientos?.Volar),
            Maniobrabilidad: `${plantilla.Maniobrabilidad?.Nombre ?? '-'}`,
            Trepar: this.toNumber(plantilla.Movimientos?.Trepar),
            Escalar: this.toNumber(plantilla.Movimientos?.Escalar),
            Ataque_base: this.toNumber(plantilla.Ataque_base),
            Ca: `${plantilla.Ca ?? ''}`,
            Reduccion_dano: `${plantilla.Reduccion_dano ?? ''}`,
            Resistencia_conjuros: `${plantilla.Resistencia_conjuros ?? ''}`,
            Resistencia_elemental: `${plantilla.Resistencia_elemental ?? ''}`,
            Velocidades: `${plantilla.Velocidades ?? ''}`,
            Iniciativa: this.toNumber(plantilla.Iniciativa),
            Presa: this.toNumber(plantilla.Presa),
            Ajuste_nivel: this.toNumber(plantilla.Ajuste_nivel),
            Heredada: !!plantilla.Nacimiento,
        };
    }

    private crearPersonajeBase(): Personaje {
        return {
            Id: 0,
            Nombre: '',
            ownerUid: null,
            visible_otros_usuarios: this.visibilidadPorDefectoPersonajes,
            Id_region: 0,
            Region: {
                Id: 0,
                Nombre: 'Sin región',
            },
            Raza: {
                Id: 0,
                Nombre: '',
                Ajuste_nivel: 0,
                Tamano: {
                    Id: 0,
                    Nombre: '-',
                    Modificador: 0,
                    Modificador_presa: 0,
                },
                Dgs_adicionales: {
                    Cantidad: 0,
                    Dado: '',
                    Tipo_criatura: '',
                },
                Manual: '',
                Clase_predilecta: '',
                Modificadores: {
                    Fuerza: 0,
                    Destreza: 0,
                    Constitucion: 0,
                    Inteligencia: 0,
                    Sabiduria: 0,
                    Carisma: 0,
                },
                Oficial: true,
            },
            RazaBase: null,
            Clases: '',
            desgloseClases: [],
            Personalidad: '',
            Contexto: '',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
            Ataque_base: '0',
            Ca: 10,
            Armadura_natural: 0,
            Ca_desvio: 0,
            Ca_varios: 0,
            Presa: 0,
            Presa_varios: [],
            Iniciativa_varios: [],
            Tipo_criatura: {
                Id: 0,
                Nombre: '-',
                Descripcion: '',
                Manual: '',
                Id_tipo_dado: 0,
                Tipo_dado: 0,
                Id_ataque: 0,
                Id_fortaleza: 0,
                Id_reflejos: 0,
                Id_voluntad: 0,
                Id_puntos_habilidad: 0,
                Come: true,
                Respira: true,
                Duerme: true,
                Recibe_criticos: true,
                Puede_ser_flanqueado: true,
                Pierde_constitucion: false,
                Limite_inteligencia: 0,
                Tesoro: '',
                Id_alineamiento: 0,
                Rasgos: [],
                Oficial: false,
            },
            Subtipos: [],
            Fuerza: 10,
            ModFuerza: 0,
            Destreza: 10,
            ModDestreza: 0,
            Constitucion: 10,
            ModConstitucion: 0,
            Caracteristicas_perdidas: {
                Fuerza: false,
                Destreza: false,
                Constitucion: false,
                Inteligencia: false,
                Sabiduria: false,
                Carisma: false,
            },
            Constitucion_perdida: false,
            Inteligencia: 10,
            ModInteligencia: 0,
            Sabiduria: 10,
            ModSabiduria: 0,
            Carisma: 10,
            ModCarisma: 0,
            CaracteristicasVarios: this.crearCaracteristicasVariosVacias(),
            NEP: 0,
            Experiencia: 0,
            Deidad: 'No tener deidad',
            Alineamiento: 'Neutral autentico',
            Genero: 'Sin genero',
            Vida: 0,
            Correr: 0,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Oficial: true,
            Dados_golpe: 0,
            Pgs_lic: 0,
            Jugador: '',
            Edad: 0,
            Altura: 0,
            Peso: 0,
            Rds: [],
            Rcs: [],
            Res: [],
            Oro_inicial: 0,
            Escuela_especialista: {
                Nombre: 'Cualquiera',
                Calificativo: 'Cualquiera',
            },
            Disciplina_especialista: {
                Nombre: 'Ninguna',
                Calificativo: 'Ninguna',
            },
            Disciplina_prohibida: 'Ninguna',
            Capacidad_carga: {
                Ligera: 0,
                Media: 0,
                Pesada: 0,
            },
            Salvaciones: {
                fortaleza: {
                    modsClaseos: [],
                    modsVarios: [],
                },
                reflejos: {
                    modsClaseos: [],
                    modsVarios: [],
                },
                voluntad: {
                    modsClaseos: [],
                    modsVarios: [],
                },
            },
            Dominios: [],
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            Plantillas: [],
            Familiares: [],
            Companeros: [],
            Conjuros: [],
            Claseas: [],
            Raciales: [],
            Habilidades: [],
            Dotes: [],
            DotesContextuales: [],
            enemigosPredilectos: [],
            Auto_reparto: null,
            Ventajas: [],
            Idiomas: [],
            Sortilegas: [],
            Escuelas_prohibidas: [],
        };
    }
}
