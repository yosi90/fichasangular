import { Injectable } from '@angular/core';
import { AptitudSortilega } from '../interfaces/aptitud-sortilega';
import { CARACTERISTICAS, Caracteristica } from '../interfaces/caracteristica';
import { Clase, ClaseConjuroRef, ClaseDoteNivel, ClaseEspecialNivel, ClaseNivelDetalle } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { DisciplinaConjuros } from '../interfaces/disciplina-conjuros';
import { Dote, DoteExtraItem } from '../interfaces/dote';
import { DoteContextual, DoteLegacy } from '../interfaces/dote-contextual';
import { EnemigoPredilectoDetalle } from '../interfaces/enemigo-predilecto-detalle';
import { EnemigoPredilectoSeleccion } from '../interfaces/enemigo-predilecto-seleccion';
import { EscuelaConjuros } from '../interfaces/escuela-conjuros';
import { DeidadDetalle } from '../interfaces/deidad';
import { DominioDetalle } from '../interfaces/dominio';
import { HabilidadBasicaDetalle, HabilidadBonoVario } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje, PersonajeNivelLanzadorResumen } from '../interfaces/personaje';
import { Plantilla } from '../interfaces/plantilla';
import { RegionDetalle } from '../interfaces/region';
import { RacialDetalle } from '../interfaces/racial';
import { Raza, RazaPlantillaReferencia } from '../interfaces/raza';
import { RazaSimple } from '../interfaces/simplificaciones/raza-simple';
import { SubtipoRef } from '../interfaces/subtipo';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { VentajaDetalle } from '../interfaces/ventaja';
import { PersonajeProgresionLanzadorDto, PersonajeProgresionLanzadorSeleccionDto } from '../interfaces/personajes-api';
import { resolverAlineamientoPlantillas, simularEstadoPlantillas } from './utils/plantilla-elegibilidad';
import { extraerEjesAlineamientoDesdeContrato } from './utils/alineamiento-contrato';
import { buildIdentidadPrerrequisitos, clavesDeEntidades } from './utils/identidad-prerrequisitos';
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
import { calcularNivelesLanzadorPersonaje } from './utils/nivel-lanzador-personaje';
import { UserSettingsService } from './user-settings.service';
import { NuevoPersonajeGeneradorConfig } from '../interfaces/user-settings';
import { normalizarTexto, primerEntero, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { esTextoExtraPorElegir } from 'src/app/services/utils/habilidad-extra-visible';
import { modificadorCaracteristica } from './utils/caracteristicas';
import { experienciaParaNivel } from './utils/experiencia-nivel';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { sumarPartes, totalesPersonaje } from './utils/personaje-totales';
import { resumenClases } from './utils/resumen-clases';
import { costeRangoHabilidad, limiteRangosHabilidad, puntosHabilidadDgRaciales, puntosHabilidadNivelClase } from './utils/puntos-habilidad';
import { tieneTextoVisible } from './utils/texto-visible';

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
    top1: Caracteristica;
    top2: Caracteristica;
    top3: Caracteristica;
    afinadaPorTop3: boolean;
}

export interface GeneradorAutoDiagnostico {
    score: GeneradorAutoScore;
    ranking: Caracteristica[];
    top2: Caracteristica[];
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

type CaracteristicaKey = Caracteristica;
type SalvacionKey = 'fortaleza' | 'reflejos' | 'voluntad';
type GeneradorAutoComboKey = `${CaracteristicaKey}_${CaracteristicaKey}`;

interface GeneradorAutoRecomendacionBase {
    clases: [GeneradorAutoClaseRecomendada, GeneradorAutoClaseRecomendada];
    explicacion: string;
    explicacionKey: GeneradorAutoExplicacionKey;
}


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

interface GeneradorCampanaRestriccionNormalizada {
    minimoSeleccionado: number;
    tablasPermitidas: number;
}

interface AplicarRestriccionCampanaGeneradorOptions {
    permitirOverride?: boolean;
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
    caracteristica: Caracteristica;
}

/** `raza`: la dote adicional de la raza (`Dotes_adicionales`, el humano); `raza_dg`: la de sus DG raciales. */
/** Una dote que tienen todos los de la raza, con lo que se guarda de ella. */
interface DoteDeRaza {
    dote: Dote;
    idExtra: number;
    extra: string;
    origen: string;
}

/** Dónde deja `aplicarModificadoresDote` lo que monta el recálculo de las ventajas. */
interface DestinoModificadoresDote {
    caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>;
    bonosHabilidades: Record<number, HabilidadBonoVario[]>;
}

export type DoteFuentePendiente = 'nivel' | 'adicional' | 'raza' | 'raza_dg';
export type DoteEstadoPendiente = 'pendiente' | 'resuelta' | 'omitida';
export type EstadoElegibilidadDote = 'eligible' | 'blocked_failed' | 'blocked_unknown';

export interface DotePendienteState {
    id: number;
    fuente: DoteFuentePendiente;
    origen: string;
    tipoPermitido: string | null;
    estado: DoteEstadoPendiente;
    nivelProgresion?: number | null;
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
    otorgadasRazaIds: number[];
    otorgadasRazaPendientes: RazaPlantillaReferencia[];
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
        otorgadasRazaIds?: number[];
        otorgadasRazaPendientes?: RazaPlantillaReferencia[];
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
        baseCaracteristicas?: Record<CaracteristicaKey, number> | null;
        baseRaciales?: RacialDetalle[];
        baseIdiomas?: {
            Nombre: string;
            Descripcion: string;
            Secreto: boolean;
            Oficial: boolean;
            Origen?: string;
        }[];
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
    dotesAdicionalesRazaConcedidas?: number;
    aumentosPendientesCaracteristica: AumentoCaracteristicaPendiente[];
    aumentosProgresionConcedidos: number;
    secuenciaAumentoPendiente: number;
    bonusNivelLanzadorPorClase: Record<string, number>;
    progresionLanzadorSelecciones?: PersonajeProgresionLanzadorSeleccionDto[];
    idsEspecialesInternosActivos: number[];
    idsDotesInternosActivos: number[];
    conjurosSesionPlaceholderPorId: Record<number, Conjuro>;
}

export interface NuevoPersonajeDraftResumen {
    uid: string;
    updatedAt: number;
    personajeId: number;
    nombre: string;
    pasoActual: StepNuevoPersonaje;
    caracteristicasGeneradas: boolean;
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
    private progresionLanzadorSelecciones: PersonajeProgresionLanzadorSeleccionDto[] = [];
    private idsEspecialesInternosActivos = new Set<number>();
    private idsDotesInternosActivos = new Set<number>();
    private dotesPendientes: DotePendienteState[] = [];
    private secuenciaDotePendiente = 1;
    private dotesProgresionConcedidas = 0;
    private dotesExtraRazaConcedidas = 0;
    private dotesAdicionalesRazaConcedidas = 0;
    private firmasDotesPlantillaAplicadas = new Set<string>();
    private aumentosPendientesCaracteristica: AumentoCaracteristicaPendiente[] = [];
    private aumentosProgresionConcedidos = 0;
    private secuenciaAumentoPendiente = 1;
    private generadorConfigBase = this.getConfigGeneradorDefault();
    private restriccionCampanaGenerador: GeneradorCampanaRestriccionNormalizada | null = null;
    private referenciaRestriccionCampanaGenerador: GeneradorCampanaRestriccionNormalizada | null = null;
    private permiteOverrideRestriccionCampanaGenerador = false;
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

    get AvisoOverrideRestriccionesCampanaGenerador(): string | null {
        if (!this.permiteOverrideRestriccionCampanaGenerador || !this.referenciaRestriccionCampanaGenerador)
            return null;

        const avisos: string[] = [];
        const minimoActual = this.estadoFlujo.generador.minimoSeleccionado;
        const tablasActuales = this.estadoFlujo.generador.tablasPermitidas;
        if (minimoActual > this.referenciaRestriccionCampanaGenerador.minimoSeleccionado)
            avisos.push(`tirada mínima ${minimoActual} frente a ${this.referenciaRestriccionCampanaGenerador.minimoSeleccionado}`);
        if (tablasActuales > this.referenciaRestriccionCampanaGenerador.tablasPermitidas)
            avisos.push(`tablas permitidas ${tablasActuales} frente a ${this.referenciaRestriccionCampanaGenerador.tablasPermitidas}`);

        if (avisos.length < 1)
            return null;

        return `Como master estás saltándote tus reglas de campaña: ${avisos.join(' y ')}.`;
    }

    getProgresionLanzadorPersistible(): PersonajeProgresionLanzadorDto | null {
        const selecciones = this.progresionLanzadorSelecciones
            .map((seleccion) => ({ ...seleccion }))
            .filter((seleccion) =>
                toNumber(seleccion.idClaseAplicada) > 0
                && toNumber(seleccion.nivelClaseAplicado) > 0
                && toNumber(seleccion.indiceAumento) > 0
                && toNumber(seleccion.idClaseObjetivo) > 0
            );
        if (selecciones.length < 1)
            return null;
        return { selecciones };
    }

    getNivelesLanzadorPersistibles(): PersonajeNivelLanzadorResumen[] {
        return calcularNivelesLanzadorPersonaje(
            {
                ...this.personajeCreacion,
                ProgresionLanzador: this.getProgresionLanzadorPersistible() ?? { selecciones: [] },
            },
            this.catalogoClases
        );
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

    getResumenBorradorLocal(uid: string): NuevoPersonajeDraftResumen | null {
        const borrador = this.leerBorradorLocal(uid);
        if (!borrador)
            return null;

        return {
            uid: `${borrador.uid ?? ''}`.trim(),
            updatedAt: Math.max(0, toInt(borrador.updatedAt)),
            personajeId: Math.max(0, toInt(borrador.personaje?.Id)),
            nombre: `${borrador.personaje?.Nombre ?? ''}`.trim(),
            pasoActual: this.normalizarPasoRestaurado(
                borrador.estadoFlujoPersistible?.pasoActual ?? 'raza',
                borrador.razaSeleccionada ?? null,
                borrador.personaje ?? null,
                borrador.estadoFlujoPersistible?.caracteristicasGeneradas === true
            ),
            caracteristicasGeneradas: borrador.estadoFlujoPersistible?.caracteristicasGeneradas === true,
        };
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
            if (!this.generadorTieneRepartoEnCurso())
                this.aplicarConfigGeneradorEfectiva();
        } catch {
            // Si falla la lectura de settings remotos, mantenemos configuración en memoria.
        }
    }

    aplicarRestriccionCampanaGenerador(
        restriccion: { tiradaMinimaCaracteristica?: number | null; maxTablasDadosCaracteristicas?: number | null; } | null | undefined,
        options?: AplicarRestriccionCampanaGeneradorOptions
    ): void {
        if (!restriccion) {
            this.restriccionCampanaGenerador = null;
            this.referenciaRestriccionCampanaGenerador = null;
            this.permiteOverrideRestriccionCampanaGenerador = false;
            this.aplicarConfigGeneradorEfectiva({ preservarRepartoCompatible: true });
            return;
        }

        const restriccionNormalizada = this.normalizarRestriccionCampanaGenerador(restriccion);
        this.referenciaRestriccionCampanaGenerador = restriccionNormalizada;
        this.permiteOverrideRestriccionCampanaGenerador = options?.permitirOverride === true;

        if (this.permiteOverrideRestriccionCampanaGenerador) {
            this.restriccionCampanaGenerador = null;
            this.aplicarConfigGeneradorEfectiva({ preservarRepartoCompatible: true });
            return;
        }

        this.restriccionCampanaGenerador = restriccionNormalizada;
        this.aplicarConfigGeneradorEfectiva({ preservarRepartoCompatible: true });
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
        this.progresionLanzadorSelecciones = [];
        this.dotesPendientes = [];
        this.secuenciaDotePendiente = 1;
        this.dotesProgresionConcedidas = 0;
        this.dotesExtraRazaConcedidas = 0;
        this.dotesAdicionalesRazaConcedidas = 0;
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
        const plantillasDisponiblesActuales = this.estadoFlujo.plantillas.disponibles ?? [];
        this.estadoFlujo.plantillas = this.crearPlantillasFlujoBase();
        this.estadoFlujo.plantillas.disponibles = [...plantillasDisponiblesActuales];
        this.sincronizarPlantillasOtorgadasPorRaza();
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
        this.dotesAdicionalesRazaConcedidas = 0;
        this.firmasDotesPlantillaAplicadas.clear();
        this.conjurosSesionPlaceholderPorId = {};
        this.bonusNivelLanzadorPorClase = {};
        this.progresionLanzadorSelecciones = [];
        this.aumentosPendientesCaracteristica = [];
        this.aumentosProgresionConcedidos = 0;
        this.secuenciaAumentoPendiente = 1;
        this.personajeCreacion.Salvaciones.fortaleza.modsClaseos = [];
        this.personajeCreacion.Salvaciones.reflejos.modsClaseos = [];
        this.personajeCreacion.Salvaciones.voluntad.modsClaseos = [];
        this.agregarDotesDeRaza(razaEfectiva);
        this.recalcularTipoYSubtiposDerivados();
        // La base de las ventajas se toma de la raza nueva antes de recalcularlas: con la base de antes (la raza anterior
        // o ninguna), el recálculo de `limpiarVentajasDesventajas` dejaba el personaje sin los raciales de su raza.
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();
        this.limpiarVentajasDesventajas();
        this.inicializarHabilidadesBase(true);
        this.recalcularEfectosVentajas();
        this.programarPersistenciaBorradorLocal();
        return true;
    }

    setPlantillasDisponibles(plantillas: Plantilla[]): void {
        this.estadoFlujo.plantillas.disponibles = [...plantillas];
        this.sincronizarPlantillasOtorgadasPorRaza();
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
        const idObjetivo = toNumber(idPlantilla);
        if (idObjetivo <= 0 || this.esPlantillaConfirmada(idObjetivo))
            return;

        this.estadoFlujo.plantillas.seleccionadas = this.estadoFlujo.plantillas.seleccionadas
            .filter((p) => toNumber(p.Id) !== idObjetivo);
        this.recalcularSimulacionPlantillas();
    }

    limpiarPlantillasSeleccion(): void {
        const idsConfirmadas = this.getIdsPlantillasConfirmadasSet();
        this.estadoFlujo.plantillas.seleccionadas = idsConfirmadas.size < 1
            ? []
            : this.estadoFlujo.plantillas.seleccionadas
                .filter((plantilla) => idsConfirmadas.has(toNumber(plantilla?.Id)));
        this.recalcularSimulacionPlantillas();
    }

    confirmarSeleccionActualPlantillas(): void {
        const merged = this.getIdsPlantillasConfirmadasSet();
        this.estadoFlujo.plantillas.seleccionadas.forEach((plantilla) => {
            const id = toNumber(plantilla?.Id);
            if (id > 0)
                merged.add(id);
        });
        this.estadoFlujo.plantillas.confirmadasIds = Array.from(merged);
    }

    getPlantillasSeleccionadasPendientesConfirmacion(): Plantilla[] {
        const idsConfirmadas = this.getIdsPlantillasConfirmadasSet();
        return (this.estadoFlujo.plantillas.seleccionadas ?? [])
            .filter((plantilla) => !idsConfirmadas.has(toNumber(plantilla?.Id)))
            .map((plantilla) => this.clonarProfundo(plantilla));
    }

    esPlantillaConfirmada(idPlantilla: number): boolean {
        const idObjetivo = toNumber(idPlantilla);
        if (idObjetivo <= 0)
            return false;
        return this.getIdsPlantillasConfirmadasSet().has(idObjetivo);
    }

    esPlantillaOtorgadaPorRaza(idPlantilla: number): boolean {
        const idObjetivo = toNumber(idPlantilla);
        if (idObjetivo <= 0)
            return false;
        return (this.estadoFlujo.plantillas.otorgadasRazaIds ?? [])
            .some((id) => toNumber(id) === idObjetivo);
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
        const nivelMaximo = toNumber(clase?.Nivel_max_claseo);
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
                const idExtra = toNumber(item?.Contexto?.Id_extra);
                acc.push({
                    id: toNumber(item?.Dote?.Id) > 0 ? toNumber(item?.Dote?.Id) : null,
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
                const idExtra = toNumber((item as any)?.Id_extra);
                acc.push({
                    id: toNumber((item as any)?.Id) > 0 ? toNumber((item as any)?.Id) : null,
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
                const extraNorm = normalizarTexto(extra);
                let idExtra: number | null = null;
                const extrasDisponibles = Array.isArray(habilidad?.Extras) ? habilidad.Extras : [];
                if (extraNorm.length > 0) {
                    const extraEncontrado = extrasDisponibles.find((item) =>
                        normalizarTexto(item?.Extra ?? '') === extraNorm
                    );
                    const idExtraEncontrado = toNumber(extraEncontrado?.Id_extra);
                    if (idExtraEncontrado > 0)
                        idExtra = idExtraEncontrado;
                    else {
                        const parseExtra = toNumber(extra);
                        if (parseExtra > 0)
                            idExtra = parseExtra;
                    }
                }

                acc.push({
                    id: toNumber(habilidad?.Id) > 0 ? toNumber(habilidad?.Id) : null,
                    nombre,
                    rangos: toNumber(habilidad?.Rangos),
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
                const idEscuela = toNumber(conjuro?.Escuela?.Id);
                acc.push({
                    id: toNumber(conjuro?.Id) > 0 ? toNumber(conjuro?.Id) : null,
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
                Fuerza: toNumber(this.personajeCreacion.Fuerza),
                Destreza: toNumber(this.personajeCreacion.Destreza),
                Constitucion: toNumber(this.personajeCreacion.Constitucion),
                Inteligencia: toNumber(this.personajeCreacion.Inteligencia),
                Sabiduria: toNumber(this.personajeCreacion.Sabiduria),
                Carisma: toNumber(this.personajeCreacion.Carisma),
            },
            ataqueBase: primerEntero(this.personajeCreacion.Ataque_base) ?? 0,
            alineamiento: `${this.personajeCreacion.Alineamiento ?? ''}`,
            genero: `${this.personajeCreacion.Genero ?? ''}`,
            dotes: [...dotesDesdeContexto, ...dotesLegacy],
            claseas,
            raciales: clavesDeEntidades(this.personajeCreacion.Raciales),
            plantillas: clavesDeEntidades(this.personajeCreacion.Plantillas),
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
        // Lo decide el tipo de cada prerrequisito que falla (`clase-elegibilidad`), no el texto de su frase.
        return !!evaluacion && evaluacion.estado !== 'eligible' && evaluacion.soloPorAlineamiento === true;
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
        const nivelClases = this.getNivelClasesActual();
        if (nivelClases !== 1) {
            return {
                cantidad: 0,
                motivo: 'Solo se eligen idiomas adicionales en el primer nivel global del personaje',
            };
        }

        const cantidad = Math.max(0, toNumber(this.personajeCreacion.ModInteligencia) + EXTRA_IDIOMAS_INICIALES);
        return {
            cantidad,
            motivo: 'Idiomas iniciales por modificador de Inteligencia',
        };
    }

    iniciarDistribucionHabilidadesPorRazaDG(): boolean {
        const raza = this.razaSeleccionada;
        if (!raza)
            return false;

        const dgsExtra = toNumber(raza?.Dgs_adicionales?.Cantidad);
        if (dgsExtra < 1)
            return false;

        const total = puntosHabilidadDgRaciales({
            puntosPorDg: toNumber(raza?.Dgs_adicionales?.Multiplicador_puntos_habilidad),
            multiplicador: toNumber(raza?.Dgs_adicionales?.Puntos_habilidad),
            modInteligencia: toNumber(this.personajeCreacion?.ModInteligencia),
        });
        if (total < 1)
            return false;

        this.iniciarDistribucionHabilidadesInterna('raza_dg', 'plantillas', total, []);
        return true;
    }

    iniciarDistribucionHabilidadesPorPlantillasDG(plantillasObjetivo?: Plantilla[]): boolean {
        const seleccionadas = plantillasObjetivo ?? this.estadoFlujo.plantillas.seleccionadas ?? [];
        if (seleccionadas.length < 1)
            return false;

        const plantillasConDg = seleccionadas
            .filter((plantilla) => toNumber(plantilla?.Licantronia_dg?.Multiplicador) > 0);
        if (plantillasConDg.length < 1)
            return false;

        const total = plantillasConDg.reduce((acc, plantilla) => {
            const sumaFija = Math.max(1, toInt(plantilla?.Puntos_habilidad?.Suma_fija));
            return acc + sumaFija;
        }, 0);

        if (total < 1)
            return false;

        const classSkillTemporales = new Set<number>();
        plantillasConDg.forEach((plantilla) => {
            (plantilla?.Habilidades ?? []).forEach((habilidadRef) => {
                const habilidad = this.asegurarHabilidadDesdePlantilla(habilidadRef);
                const id = toNumber(habilidad?.Id);
                if (id > 0)
                    classSkillTemporales.add(id);
            });
        });

        const nivelClases = this.getNivelClasesActual();
        const returnStep: StepNuevoPersonaje = nivelClases > 0 ? 'clases' : 'ventajas';
        this.iniciarDistribucionHabilidadesInterna(
            'plantilla_dg',
            returnStep,
            total,
            Array.from(classSkillTemporales)
        );
        return true;
    }

    /** Llamar con el nivel de clase ya aplicado (`aplicarSiguienteNivelClase`). */
    iniciarDistribucionHabilidadesPorClase(clase: Clase): boolean {
        const total = puntosHabilidadNivelClase({
            puntosClase: toNumber(clase?.Puntos_habilidad?.Valor),
            modInteligencia: toNumber(this.personajeCreacion?.ModInteligencia),
            primerNivelPersonaje: this.esPrimerNivelDelPersonaje(),
            extraPrimerNivel: toNumber(this.razaSeleccionada?.Puntos_habilidad_extra_primer_nivel),
            extraPorNivel: toNumber(this.razaSeleccionada?.Puntos_habilidad_extra_por_nivel),
        });

        const returnStep: StepNuevoPersonaje = this.estadoFlujo.conjuros.activa ? 'conjuros' : 'dotes';
        this.iniciarDistribucionHabilidadesInterna('clase_nivel', returnStep, total, []);
        return true;
    }

    ajustarRangoHabilidad(idHabilidad: number, delta: number): boolean {
        if (!this.estadoFlujo.habilidades.activa)
            return false;

        const id = toNumber(idHabilidad);
        const cambio = toInt(delta);
        if (id <= 0 || cambio === 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        const actual = Math.max(0, toNumber(habilidad.Rangos));
        const coste = costeRangoHabilidad(this.esHabilidadClaseaParaSesion(habilidad));

        if (cambio > 0) {
            const limite = this.obtenerLimiteRangoHabilidad(id);
            const maxSubida = limite - actual;
            const subida = Math.min(cambio, maxSubida);
            if (subida < 1)
                return false;
            if (this.estadoFlujo.habilidades.puntosRestantes < subida * coste)
                return false;

            habilidad.Rangos = actual + subida;
            this.estadoFlujo.habilidades.puntosRestantes -= subida * coste;
            return true;
        }

        const rangoInicial = this.obtenerRangoInicialHabilidadSesion(id);
        const margenBajada = Math.max(0, actual - rangoInicial);
        const bajada = Math.min(Math.abs(cambio), margenBajada);
        if (bajada < 1)
            return false;

        habilidad.Rangos = actual - bajada;
        this.estadoFlujo.habilidades.puntosRestantes = Math.min(
            this.estadoFlujo.habilidades.puntosTotales,
            this.estadoFlujo.habilidades.puntosRestantes + bajada * coste
        );
        return true;
    }

    /** Puntos que cuesta un rango de la habilidad en esta sesión: 1 si es clásea y 2 si es transclásea. */
    obtenerCosteRangoHabilidad(idHabilidad: number): number {
        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === toNumber(idHabilidad));
        return costeRangoHabilidad(!!habilidad && this.esHabilidadClaseaParaSesion(habilidad));
    }

    /**
     * Se le puede subir un rango a la habilidad en esta sesión: no ha llegado a su límite y los puntos que quedan pagan
     * su coste. Una «solo entrenada» transclásea también se compra, a 2 puntos por rango (MJ cap. 4).
     */
    puedeSubirRangoHabilidad(idHabilidad: number): boolean {
        const id = toNumber(idHabilidad);
        if (id <= 0)
            return false;
        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === id);
        if (!habilidad)
            return false;
        return toNumber(habilidad?.Rangos) < this.obtenerLimiteRangoHabilidad(id)
            && toNumber(this.estadoFlujo.habilidades.puntosRestantes) >= this.obtenerCosteRangoHabilidad(id);
    }

    /** Queda alguna habilidad a la que subir un rango con los puntos que quedan. */
    private puedeComprarAlgunRangoHabilidad(): boolean {
        return (this.personajeCreacion.Habilidades ?? []).some((habilidad) => this.puedeSubirRangoHabilidad(toNumber(habilidad?.Id)));
    }

    setExtraHabilidad(idHabilidad: number, extra: string): boolean {
        const id = toNumber(idHabilidad);
        if (id <= 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        if (!toBoolean(habilidad?.Soporta_extra))
            return false;
        if (!this.esExtraElegibleParaSesion(habilidad))
            return false;
        if (toBoolean(habilidad?.Extra_bloqueado))
            return false;

        const extraLimpio = `${extra ?? ''}`.trim();
        const extraNormalizado = normalizarTexto(extraLimpio);
        const opciones = (habilidad.Extras ?? [])
            .map((item) => `${item?.Extra ?? ''}`.trim())
            .filter((item) => item.length > 0);
        if (opciones.length > 0 && !this.esExtraHabilidadPendienteValor(extraNormalizado)) {
            const existeOpcion = opciones.some((opcion) => normalizarTexto(opcion) === extraNormalizado);
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
        // Los puntos que no alcanzan para ningún rango (1 punto y solo quedan transcláseas) no bloquean el cierre.
        if (toNumber(this.estadoFlujo.habilidades.puntosRestantes) !== 0 && this.puedeComprarAlgunRangoHabilidad())
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
                    total: toNumber(entrada.cupoPendiente?.total),
                    porNivel: { ...(entrada.cupoPendiente?.porNivel ?? {}) },
                },
                cupoInicial: {
                    total: toNumber(entrada.cupoInicial?.total),
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

        const filtro = normalizarTexto(filtroTexto);
        const nivelFiltro = nivelConjuro === null ? null : Math.max(0, toInt(nivelConjuro));
        const idsNoDisponibles = new Set<number>([
            ...(entrada.seleccionadosIds ?? []),
            ...(entrada.autoadicionadosIds ?? []),
        ].map((id) => toNumber(id)).filter((id) => id > 0));

        return this.obtenerConjurosElegiblesParaEntrada(entrada)
            .filter((conjuro) => !idsNoDisponibles.has(toNumber(conjuro?.Id)))
            .filter((conjuro) => {
                if (filtro.length < 1)
                    return true;
                return normalizarTexto(conjuro?.Nombre ?? '').includes(filtro);
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
                return compararTexto(a?.Nombre, b?.Nombre);
            });
    }

    seleccionarConjuroSesion(idConjuro: number): boolean {
        const entrada = this.getEntradaConjurosActiva();
        if (!entrada || !entrada.seleccionManual)
            return false;

        const id = toInt(idConjuro);
        if (id <= 0)
            return false;
        if (entrada.seleccionadosIds.includes(id) || entrada.autoadicionadosIds.includes(id))
            return false;

        const conjuro = this.obtenerConjuroCatalogoPorId(id);
        if (!conjuro)
            return false;
        if (!this.obtenerConjurosElegiblesParaEntrada(entrada).some((item) => toNumber(item?.Id) === id))
            return false;

        const nivelConjuro = this.resolverNivelConjuroEntrada(entrada, conjuro);
        if (toNumber(entrada.cupoPendiente?.total) > 0) {
            entrada.cupoPendiente.total = Math.max(0, toNumber(entrada.cupoPendiente.total) - 1);
            entrada.seleccionadosIds = [...entrada.seleccionadosIds, id];
            return true;
        }

        const cupoNivel = toNumber(entrada.cupoPendiente?.porNivel?.[nivelConjuro]);
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

        const id = toInt(idConjuro);
        if (id <= 0 || !entrada.seleccionadosIds.includes(id))
            return false;

        entrada.seleccionadosIds = entrada.seleccionadosIds.filter((actual) => actual !== id);
        const conjuro = this.obtenerConjuroCatalogoPorId(id);
        if (!conjuro)
            return true;

        const nivelConjuro = this.resolverNivelConjuroEntrada(entrada, conjuro);
        if (toNumber(entrada.cupoInicial?.total) > 0) {
            entrada.cupoPendiente.total = Math.min(
                toNumber(entrada.cupoInicial.total),
                toNumber(entrada.cupoPendiente.total) + 1
            );
            return true;
        }

        const inicialNivel = toNumber(entrada.cupoInicial?.porNivel?.[nivelConjuro]);
        const pendienteNivel = toNumber(entrada.cupoPendiente?.porNivel?.[nivelConjuro]);
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
            if (toNumber(entrada.cupoPendiente?.total) > 0)
                return false;
            const pendientesPorNivel = Object.values(entrada.cupoPendiente?.porNivel ?? {})
                .reduce((acc, valor) => acc + Math.max(0, toNumber(valor)), 0);
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
        const id = toNumber(idHabilidad);
        if (id <= 0)
            return false;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === id);
        if (!habilidad)
            return false;

        return this.esHabilidadClaseaParaSesion(habilidad);
    }

    esExtraElegibleHabilidad(idHabilidad: number): boolean {
        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === toNumber(idHabilidad));
        return !!habilidad && this.esExtraElegibleParaSesion(habilidad);
    }

    obtenerLimiteRangoHabilidad(idHabilidad: number): number {
        const id = toNumber(idHabilidad);
        if (id <= 0)
            return 0;

        const habilidad = this.personajeCreacion.Habilidades.find((item) => toNumber(item?.Id) === id);
        if (!habilidad)
            return 0;

        const nivelReferencia = Math.max(
            0,
            toNumber(this.estadoFlujo.habilidades.nivelPersonajeReferencia) || this.getNivelEfectivoParaAumentos()
        );
        return limiteRangosHabilidad(nivelReferencia, this.esHabilidadClaseaParaSesion(habilidad));
    }

    private iniciarDistribucionHabilidadesInterna(
        origen: HabilidadesFlujoOrigen,
        returnStep: StepNuevoPersonaje,
        puntosTotales: number,
        classSkillTemporales: number[]
    ): void {
        const total = Math.max(0, toInt(puntosTotales));
        const nivelReferencia = this.getNivelEfectivoParaAumentos();
        const temporales = Array.from(new Set(
            (classSkillTemporales ?? [])
                .map((id) => toNumber(id))
                .filter((id) => id > 0)
        ));
        const rangosIniciales: Record<number, number> = {};
        (this.personajeCreacion?.Habilidades ?? []).forEach((habilidad) => {
            const id = toNumber(habilidad?.Id);
            if (id <= 0)
                return;
            rangosIniciales[id] = Math.max(0, toInt(habilidad?.Rangos));
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
        const pendientesPorId = new Set(pendientes.map((item) => toNumber(item?.id)));
        const seleccionPorPendiente = new Map<number, CaracteristicaKey>();

        for (const asignacion of asignacionesLista) {
            const idPendiente = toNumber(asignacion?.idPendiente);
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
            const idPendiente = toNumber(pendiente?.id);
            const caracteristica = seleccionPorPendiente.get(idPendiente);
            if (!caracteristica)
                return false;
            if (this.esCaracteristicaPerdida(caracteristica))
                return false;
            incrementos[caracteristica] += Math.max(0, toNumber(pendiente?.valor));
        }

        CARACTERISTICAS.forEach((key) => {
            const aumento = toNumber(incrementos[key]);
            if (aumento < 1)
                return;
            const actual = toNumber((this.personajeCreacion as Record<string, any>)[key]);
            const final = actual + aumento;
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, modificadorCaracteristica(final));
        });

        this.recalcularDerivadasPorCaracteristicas();
        this.sincronizarAliasConstitucionPerdida();
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();

        this.aumentosPendientesCaracteristica = [];
        return true;
    }

    getTopesCaracteristicas(): Partial<Record<Caracteristica, number>> {
        const topes: Partial<Record<Caracteristica, number>> = {};
        const limiteInteligencia = toNumber(this.personajeCreacion?.Tipo_criatura?.Limite_inteligencia);
        if (limiteInteligencia > 0)
            topes.Inteligencia = limiteInteligencia;
        return topes;
    }

    registrarDotesPendientesPorProgresion(origen: string): DotePendienteState[] {
        const hitosDisponibles = this.getHitosDotesProgresion();
        const hitosNuevos = hitosDisponibles.slice(this.dotesProgresionConcedidas);
        if (hitosNuevos.length < 1)
            return [];

        const origenNormalizado = `${origen ?? ''}`.trim() || 'Progresion de nivel';
        const creadas = hitosNuevos.map((nivelProgresion) =>
            this.crearDotePendiente('nivel', origenNormalizado, null, nivelProgresion)
        );
        this.dotesPendientes = [
            ...this.dotesPendientes,
            ...creadas,
        ];
        this.dotesProgresionConcedidas += hitosNuevos.length;
        return creadas.map((item) => ({ ...item }));
    }

    /**
     * Las dotes que da la raza al aplicar un nivel de clase: las de sus DG raciales (`Dgs_adicionales.Dotes_extra`) y su
     * dote adicional (`Dotes_adicionales`, la del humano), que se concede una vez, en el primer nivel del personaje. Las
     * dos salen de los datos de la raza, también de una homebrew.
     */
    registrarDotesPendientesPorRazaExtras(origen: string): DotePendienteState[] {
        const origenNormalizado = `${origen ?? ''}`.trim() || `${this.razaSeleccionada?.Nombre ?? 'Raza'}`;
        const totalDgs = Math.max(0, toNumber(this.razaSeleccionada?.Dgs_adicionales?.Dotes_extra));
        const nuevasDgs = Math.max(0, totalDgs - this.dotesExtraRazaConcedidas);
        const totalAdicionales = Math.max(0, toNumber(this.razaSeleccionada?.Dotes_adicionales));
        const nuevasAdicionales = Math.max(0, totalAdicionales - this.dotesAdicionalesRazaConcedidas);
        if (nuevasDgs + nuevasAdicionales < 1)
            return [];
        const creadas = [
            ...Array.from({ length: nuevasAdicionales }, () => this.crearDotePendiente('raza', origenNormalizado, null)),
            ...Array.from({ length: nuevasDgs }, () => this.crearDotePendiente('raza_dg', origenNormalizado, null)),
        ];
        this.dotesPendientes = [
            ...this.dotesPendientes,
            ...creadas,
        ];
        this.dotesExtraRazaConcedidas += nuevasDgs;
        this.dotesAdicionalesRazaConcedidas += nuevasAdicionales;
        return creadas.map((item) => ({ ...item }));
    }

    registrarDotesPendientesPorEspeciales(especiales: ClaseEspecialNivel[], origen: string): DotePendienteState[] {
        const listaEspeciales = Array.isArray(especiales) ? especiales : [];
        const origenNormalizado = `${origen ?? ''}`.trim() || 'Especial de clase';
        const creadas: DotePendienteState[] = [];

        listaEspeciales.forEach((especialNivel) => {
            const especial = (especialNivel?.Especial ?? {}) as Record<string, any>;
            const nombreEspecial = normalizarTexto(`${especial?.['Nombre'] ?? especial?.['nombre'] ?? ''}`);
            if (nombreEspecial !== normalizarTexto('Dote adicional'))
                return;

            const extra = `${especialNivel?.Extra ?? ''}`.trim();
            const tipoPermitido = normalizarTexto(extra) === normalizarTexto('No aplica')
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
        const pendiente = this.dotesPendientes.find((item) => toNumber(item?.id) === toNumber(idPendiente));
        if (!pendiente || pendiente.estado !== 'pendiente')
            return [];

        const candidatos = (this.catalogoDotes ?? [])
            .map((dote) => this.crearCandidatoDote(dote, pendiente))
            .filter((item) => !!item) as DoteSelectorCandidato[];

        return candidatos.sort((a, b) =>
            compararTexto(a?.dote?.Nombre, b?.dote?.Nombre)
        );
    }

    omitirDotePendiente(idPendiente: number): boolean {
        const id = toNumber(idPendiente);
        const pendiente = this.dotesPendientes.find((item) => toNumber(item?.id) === id);
        if (!pendiente || pendiente.estado !== 'pendiente')
            return false;
        pendiente.estado = 'omitida';
        return true;
    }

    aplicarDotePendiente(idPendiente: number, seleccion: DoteSeleccionConfirmada): boolean {
        const pendiente = this.dotesPendientes.find((item) => toNumber(item?.id) === toNumber(idPendiente));
        if (!pendiente || pendiente.estado !== 'pendiente')
            return false;

        const idDote = toNumber(seleccion?.idDote);
        if (idDote <= 0)
            return false;
        const dote = (this.catalogoDotes ?? []).find((item) => toNumber(item?.Id) === idDote);
        if (!dote)
            return false;

        const idExtraSeleccion = Math.max(0, toNumber(seleccion?.idExtra));
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
        if (requiereExtra && !candidato.extrasDisponibles.some((extra) => toNumber(extra?.Id) === idExtra))
            return false;

        const extraTexto = this.resolverExtraTextoDote(dote, idExtra, extraSeleccion);
        if (requiereExtra && normalizarTexto(extraTexto).length < 1)
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

        const idFamiliar = toNumber(familiar?.Id_familiar);
        if (idFamiliar <= 0 || !familiar) {
            return {
                registrado: false,
                razon: 'Familiar inválido',
                dote17Agregada: false,
                especialesAgregadosIds: [],
            };
        }

        const plantillaId = Math.max(1, Math.min(5, toNumber(plantillaSeleccionada))) as FamiliarPlantillaId;
        const yaExiste = (this.personajeCreacion.Familiares ?? []).some((item) =>
            toNumber(item?.Id_familiar) === idFamiliar
            && toNumber(item?.Plantilla?.Id) === plantillaId
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

        const nivelLanzador = Math.max(0, toNumber(estado.nivelLanzadorFamiliar));
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

        const idCompanero = toNumber(companero?.Id_companero);
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
            toNumber(item?.Id_companero) === idCompanero
            && toNumber(item?.Plantilla?.Id) === idPlantilla
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

        const escala = this.calcularEscalaCompanero(Math.max(0, toNumber(estado?.nivelEfectivoCompanero)));
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

        const nivelEfectivo = Math.max(0, toNumber(estado?.nivelEfectivoCompanero));
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
            id: toNumber(item?.id),
            nombre: `${item?.nombre ?? ''}`.trim(),
            bono: toNumber(item?.bono),
            veces: toNumber(item?.veces),
        }));
    }

    aplicarSeleccionEnemigoPredilecto(enemigo: EnemigoPredilectoDetalle | null | undefined): boolean {
        const id = toNumber(enemigo?.Id);
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
        const id = toNumber(enemigo?.Id);
        const nombre = `${enemigo?.Nombre ?? ''}`.trim();
        if (id <= 0 || nombre.length < 1)
            return Array.isArray(actuales) ? [...actuales] : [];

        const lista = Array.isArray(actuales)
            ? actuales.map((item) => ({
                id: toNumber(item?.id),
                nombre: `${item?.nombre ?? ''}`.trim(),
                bono: Math.max(0, toNumber(item?.bono)),
                veces: Math.max(0, toNumber(item?.veces)),
            }))
            : [];
        const existente = lista.find((item) => toNumber(item?.id) === id);
        if (!existente) {
            lista.push({
                id,
                nombre,
                bono: 2,
                veces: 1,
            });
            return lista.sort((a, b) => compararTexto(a.nombre, b.nombre));
        }

        existente.nombre = nombre;
        existente.bono = Math.max(0, toNumber(existente.bono)) + 2;
        existente.veces = Math.max(0, toNumber(existente.veces)) + 1;
        return lista.sort((a, b) => compararTexto(a.nombre, b.nombre));
    }

    private crearDotePendiente(
        fuente: DoteFuentePendiente,
        origen: string,
        tipoPermitido: string | null,
        nivelProgresion: number | null = null
    ): DotePendienteState {
        const tipoNormalizado = `${tipoPermitido ?? ''}`.trim();
        return {
            id: this.secuenciaDotePendiente++,
            fuente,
            origen: `${origen ?? ''}`.trim(),
            tipoPermitido: tipoNormalizado.length > 0 ? tipoNormalizado : null,
            estado: 'pendiente',
            nivelProgresion: fuente === 'nivel'
                ? Math.max(0, toInt(nivelProgresion)) || null
                : null,
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
                Id: toNumber(item?.Id ?? item?.id ?? item?.Id_habilidad ?? item?.IdHabilidad),
                Nombre: `${item?.Nombre ?? item?.nombre ?? ''}`.trim(),
                Es_escudo: toBoolean(item?.Es_escudo),
            }))
            .filter((item) => item.Id > 0 || normalizarTexto(item.Nombre).length > 0)
            .filter((item) => {
                const clave = item.Id > 0
                    ? `id:${item.Id}`
                    : `nombre:${normalizarTexto(item.Nombre)}`;
                if (seen.has(clave))
                    return false;
                seen.add(clave);
                return true;
            });

        return normalizado.sort(porNombre);
    }

    private doteSoportaArmaduras(dote: Dote | null | undefined): boolean {
        return toBoolean(
            dote?.Extras_soportados?.Extra_armadura_armaduras ?? dote?.Extras_soportados?.Extra_armadura
        );
    }

    private doteSoportaEscudos(dote: Dote | null | undefined): boolean {
        return toBoolean(
            dote?.Extras_soportados?.Extra_armadura_escudos ?? dote?.Extras_soportados?.Extra_armadura
        );
    }

    private doteTieneExtrasSoportados(dote: Dote | null | undefined): boolean {
        return !!(
            toBoolean(dote?.Extras_soportados?.Extra_arma)
            || this.doteSoportaArmaduras(dote)
            || this.doteSoportaEscudos(dote)
            || toBoolean(dote?.Extras_soportados?.Extra_escuela)
            || toBoolean(dote?.Extras_soportados?.Extra_habilidad)
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

        const idExtra = Math.max(0, toNumber(idExtraSeleccionado));
        const extraTexto = `${extraSeleccionado ?? ''}`.trim();
        if (idExtra > 0) {
            const extra = extrasDisponibles.find((item) => toNumber(item?.Id) === idExtra);
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
            const id = toNumber(extra?.Id);
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
        const tipoNorm = normalizarTexto(`${tipoPermitido ?? ''}`);
        if (tipoNorm.length < 1)
            return true;
        const tipos = Array.isArray(dote?.Tipos) ? dote.Tipos : [];
        return tipos.some((tipo) => normalizarTexto(`${tipo?.Nombre ?? ''}`) === tipoNorm);
    }

    private resolverExtrasDisponiblesDote(dote: Dote): DoteExtraOpcion[] {
        const fuenteHabilidades = (this.estadoFlujo.ventajas.catalogoHabilidades ?? [])
            .map((habilidad) => ({
                Id: toNumber(habilidad?.Id_habilidad),
                Nombre: `${habilidad?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.Id > 0 && item.Nombre.length > 0);

        const normalizar = (items: DoteExtraItem[] | null | undefined): DoteExtraOpcion[] =>
            this.normalizarCatalogoExtras(items as Array<{ Id: number; Nombre: string; }>);
        // La API dice en `Extras_de_todo_el_catalogo` si cada tipo de extra se elige de todo el catálogo (la dote lista
        // el comodín «Elegir» o «Cualquiera», o ninguno): ya no se busca «Elegir» por el nombre.
        const deTodoElCatalogo = dote?.Extras_de_todo_el_catalogo;

        const extras: DoteExtraOpcion[] = [];
        if (toBoolean(dote?.Extras_soportados?.Extra_arma)) {
            const directos = normalizar(dote?.Extras_disponibles?.Armas ?? []);
            const usarCatalogo = directos.length < 1 || deTodoElCatalogo?.Armas === true;
            extras.push(...(usarCatalogo ? this.catalogoArmasDotes : directos));
        }
        if (this.doteSoportaArmaduras(dote) || this.doteSoportaEscudos(dote)) {
            const directos = this.filtrarExtrasArmaduraPorSoporte(dote, normalizar(dote?.Extras_disponibles?.Armaduras ?? []));
            const usarCatalogo = directos.length < 1 || deTodoElCatalogo?.Armaduras === true;
            const catalogo = this.filtrarExtrasArmaduraPorSoporte(dote, this.catalogoArmadurasDotes);
            extras.push(...(usarCatalogo ? catalogo : directos));
        }
        if (toBoolean(dote?.Extras_soportados?.Extra_escuela)) {
            const directos = normalizar(dote?.Extras_disponibles?.Escuelas ?? []);
            const usarCatalogo = directos.length < 1 || deTodoElCatalogo?.Escuelas === true;
            extras.push(...(usarCatalogo ? this.catalogoEscuelasDotes : directos));
        }
        if (toBoolean(dote?.Extras_soportados?.Extra_habilidad)) {
            const directos = normalizar(dote?.Extras_disponibles?.Habilidades ?? []);
            const usarCatalogo = directos.length < 1 || deTodoElCatalogo?.Habilidades === true;
            extras.push(...(usarCatalogo ? fuenteHabilidades : directos));
        }

        return this.normalizarCatalogoExtras(extras);
    }

    private filtrarExtrasPorRepeticionDote(dote: Dote, extras: DoteExtraOpcion[]): DoteExtraOpcion[] {
        if (!toBoolean(dote?.Repetible_distinto_extra))
            return extras;

        const doteNorm = normalizarTexto(`${dote?.Nombre ?? ''}`);
        const idDote = toNumber(dote?.Id);
        const usadosId = new Set<number>();
        const usadosNombre = new Set<string>();

        (this.personajeCreacion.DotesContextuales ?? [])
            .filter((item) => {
                const idActual = toNumber(item?.Dote?.Id);
                const nombreActual = normalizarTexto(item?.Dote?.Nombre ?? '');
                return (idDote > 0 && idActual === idDote) || (doteNorm.length > 0 && nombreActual === doteNorm);
            })
            .forEach((item) => {
                const idExtra = toNumber(item?.Contexto?.Id_extra);
                if (idExtra > 0)
                    usadosId.add(idExtra);
                const extra = normalizarTexto(item?.Contexto?.Extra ?? '');
                if (extra.length > 0)
                    usadosNombre.add(extra);
            });

        return extras.filter((extra) => {
            const id = toNumber(extra?.Id);
            const nombreNorm = normalizarTexto(extra?.Nombre ?? '');
            if (id > 0 && usadosId.has(id))
                return false;
            if (nombreNorm.length > 0 && usadosNombre.has(nombreNorm))
                return false;
            return true;
        });
    }

    private validarRepeticionDote(dote: Dote, idExtra: number, extraTexto: string): boolean {
        const idDote = toNumber(dote?.Id);
        const nombreNorm = normalizarTexto(`${dote?.Nombre ?? ''}`);
        const repetibleDistintoExtra = toBoolean(dote?.Repetible_distinto_extra) && this.doteTieneExtrasSoportados(dote);
        const contextuales = (this.personajeCreacion.DotesContextuales ?? []).filter((item) => {
            const id = toNumber(item?.Dote?.Id);
            const nombre = normalizarTexto(item?.Dote?.Nombre ?? '');
            return (idDote > 0 && id === idDote) || (nombreNorm.length > 0 && nombre === nombreNorm);
        });

        const legacy = (this.personajeCreacion.Dotes ?? []).filter((item) =>
            normalizarTexto(item?.Nombre ?? '') === nombreNorm
        );
        const yaExiste = contextuales.length > 0 || legacy.length > 0;

        if (!yaExiste)
            return true;

        if (repetibleDistintoExtra) {
            const idExtraNorm = Math.max(0, toNumber(idExtra));
            const extraNorm = normalizarTexto(extraTexto ?? '');
            if (idExtraNorm <= 0 && extraNorm.length < 1)
                return false;

            const repetidaContextual = contextuales.some((item) => {
                const existenteIdExtra = toNumber(item?.Contexto?.Id_extra);
                const existenteExtraNorm = normalizarTexto(item?.Contexto?.Extra ?? '');
                if (idExtraNorm > 0 && existenteIdExtra > 0)
                    return existenteIdExtra === idExtraNorm;
                if (extraNorm.length > 0 && existenteExtraNorm.length > 0)
                    return existenteExtraNorm === extraNorm;
                return existenteIdExtra === idExtraNorm;
            });
            const repetidaLegacy = legacy.some((item) =>
                normalizarTexto(item?.Extra ?? '') === extraNorm
            );
            return !repetidaContextual && !repetidaLegacy;
        }

        if (toBoolean(dote?.Repetible))
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
                normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombre)
            );
            return {
                id: toNumber(idClase?.Id) > 0 ? toNumber(idClase?.Id) : null,
                nombre,
                nivel: Math.max(0, toNumber(clase?.Nivel)),
            };
        }).filter((item) => item.nombre.length > 0);

        const dotes = (this.personajeCreacion.DotesContextuales ?? [])
            .map((item) => ({
                id: toNumber(item?.Dote?.Id) > 0 ? toNumber(item?.Dote?.Id) : null,
                nombre: `${item?.Dote?.Nombre ?? ''}`.trim(),
                idExtra: toNumber(item?.Contexto?.Id_extra),
                extra: `${item?.Contexto?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const legacySinContexto = (this.personajeCreacion.Dotes ?? [])
            .filter((item) => {
                const nombre = normalizarTexto(item?.Nombre ?? '');
                return !dotes.some((ctxDote) => normalizarTexto(ctxDote.nombre) === nombre);
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
                id: toNumber((item as any)?.Id) > 0 ? toNumber((item as any)?.Id) : null,
                nombre: `${item?.Nombre ?? ''}`.trim(),
                idExtra: toNumber((item as any)?.Id_extra) > 0 ? toNumber((item as any)?.Id_extra) : null,
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
                id: toNumber(habilidad?.Id) > 0 ? toNumber(habilidad?.Id) : null,
                nombre: `${habilidad?.Nombre ?? ''}`.trim(),
                rangos: toNumber(habilidad?.Rangos),
                extra: `${habilidad?.Extra ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);

        const conjuros = (this.personajeCreacion.Conjuros ?? [])
            .map((conjuro) => ({
                id: toNumber(conjuro?.Id) > 0 ? toNumber(conjuro?.Id) : null,
                nombre: `${conjuro?.Nombre ?? ''}`.trim(),
                idEscuela: toNumber(conjuro?.Escuela?.Id) > 0 ? toNumber(conjuro?.Escuela?.Id) : null,
                escuela: `${conjuro?.Escuela?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const conjurosAccesibles = this.resolverConjurosAccesiblesParaPrerrequisitosDote();

        const catalogoRegiones = (this.catalogoRegiones ?? [])
            .map((regionCatalogo) => ({
                id: toNumber(regionCatalogo?.Id) > 0 ? toNumber(regionCatalogo?.Id) : null,
                nombre: `${regionCatalogo?.Nombre ?? ''}`.trim(),
            }))
            .filter((item) => item.nombre.length > 0);
        const catalogoDotesRaw = this.catalogoDotes ?? [];

        const tiposDote = (() => {
            const resultado: { id: number | null; nombre: string; }[] = [];
            const ids = new Set<number>();
            const nombres = new Set<string>();
            const registrar = (tipo: any) => {
                const id = toNumber(tipo?.Id) > 0 ? toNumber(tipo?.Id) : null;
                const nombre = `${tipo?.Nombre ?? ''}`.trim();
                const nombreNorm = normalizarTexto(nombre);
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
                const nombreNorm = normalizarTexto(nombreDote);
                return catalogoDotesRaw.find((item) =>
                    (idDote > 0 && toNumber(item?.Id) === idDote)
                    || (nombreNorm.length > 0 && normalizarTexto(item?.Nombre ?? '') === nombreNorm)
                );
            };
            (this.personajeCreacion.DotesContextuales ?? []).forEach((item) => {
                const idDote = toNumber(item?.Dote?.Id);
                const nombreDote = `${item?.Dote?.Nombre ?? ''}`.trim();
                const doteCatalogo = buscarCatalogo(idDote, nombreDote);
                (item?.Dote?.Tipos ?? doteCatalogo?.Tipos ?? []).forEach((tipo: any) => registrar(tipo));
            });
            legacySinContexto.forEach((item) => {
                const doteCatalogo = buscarCatalogo(toNumber(item?.id), item?.nombre ?? '');
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
        const regionId = toNumber(
            (regionRaw as any)?.Id
            ?? (regionRaw as any)?.id
            ?? (this.personajeCreacion as any)?.Id_region
            ?? (this.personajeCreacion as any)?.id_region
        );
        const regionNombreRaw = `${(regionRaw as any)?.Nombre ?? (regionRaw as any)?.nombre ?? (typeof regionRaw === 'string' ? regionRaw : '') ?? ''}`.trim();
        const regionIdResuelto = regionId > 0 ? regionId : toNumber(this.resolverIdRegionPorNombre(regionNombreRaw));
        const regionIdContexto = regionIdResuelto > 0
            ? regionIdResuelto
            : (regionIdTieneDato && regionId === 0 ? 0 : null);
        const regionNombre = regionNombreRaw.length > 0
            ? regionNombreRaw
            : (regionIdContexto === 0 ? 'Sin región' : this.resolverNombreRegionPorId(regionIdResuelto));
        const nombreEscuelaEspecialista = `${this.personajeCreacion?.Escuela_especialista?.Nombre ?? ''}`.trim();
        const nivelTotal = nivelesClase.reduce((acc, clase) => acc + Math.max(0, toNumber(clase?.nivel)), 0);
        const nivelLanzadorArcano = this.resolverNivelLanzadorMaximoPorTipo('arcano');
        const nivelLanzadorDivino = this.resolverNivelLanzadorMaximoPorTipo('divino');
        const nivelLanzadorPsionico = this.resolverNivelLanzadorMaximoPorTipo('psionico');
        const estadoCuposCompanero = this.getEstadoCuposCompaneroEspecial29();
        const estadoCuposFamiliar = this.getEstadoCuposFamiliarEspecial47();

        const contexto: DoteEvaluacionContexto = {
            identidad,
            caracteristicas: {
                Fuerza: toNumber(this.personajeCreacion.Fuerza),
                Destreza: toNumber(this.personajeCreacion.Destreza),
                Constitucion: toNumber(this.personajeCreacion.Constitucion),
                Inteligencia: toNumber(this.personajeCreacion.Inteligencia),
                Sabiduria: toNumber(this.personajeCreacion.Sabiduria),
                Carisma: toNumber(this.personajeCreacion.Carisma),
            },
            ataqueBase: primerEntero(this.personajeCreacion.Ataque_base) ?? 0,
            nivelesClase,
            dotes: [...dotes, ...legacySinContexto],
            claseas,
            raciales: clavesDeEntidades(this.personajeCreacion.Raciales),
            plantillas: clavesDeEntidades(this.personajeCreacion.Plantillas),
            dominios,
            idiomas,
            habilidades,
            conjuros,
            conjurosAccesibles,
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
            tipoCriaturaId: toNumber(this.personajeCreacion?.Tipo_criatura?.Id) > 0
                ? toNumber(this.personajeCreacion?.Tipo_criatura?.Id)
                : null,
            tipoCriaturaNombre: `${this.personajeCreacion?.Tipo_criatura?.Nombre ?? ''}`.trim(),
            tiposDote,
            region: {
                id: regionIdContexto,
                nombre: regionNombre,
            },
            salvacionesBase: this.resolverSalvacionesBaseClase(),
            alineamiento: `${this.personajeCreacion.Alineamiento ?? ''}`.trim(),
            puedeSeleccionarCompanero: estadoCuposCompanero.cuposDisponibles > 0,
            puedeSeleccionarFamiliar: estadoCuposFamiliar.cuposDisponibles > 0,
            catalogoRegiones,
        };

        const evaluacion = evaluarElegibilidadDote({
            dote,
            contexto,
            idExtraSeleccionado: Math.max(0, toNumber(idExtra)),
            extraSeleccionado: `${extraTexto ?? ''}`.trim(),
        });

        return {
            estado: evaluacion.estado,
            razones: [...(evaluacion.razones ?? [])],
            advertencias: [...(evaluacion.advertencias ?? [])],
        };
    }

    private resolverConjurosAccesiblesParaPrerrequisitosDote(): Array<{ id: number | null; nombre: string; idEscuela: number | null; escuela: string; }> {
        const resultado = new Map<string, { id: number | null; nombre: string; idEscuela: number | null; escuela: string; }>();

        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
            if (nombreClase.length < 1)
                return;

            const clase = this.obtenerClaseCatalogoPorNombre(nombreClase);
            if (!clase || !this.tieneLanzamientoPropio(clase))
                return;

            const nivelLanzadorActual = this.getNivelLanzadorEfectivoClase(nombreClase);
            if (nivelLanzadorActual < 1)
                return;

            const detalleActual = this.obtenerDetallePorNivelLanzadorClase(clase, nivelLanzadorActual);
            if (!detalleActual)
                return;

            const detallePrevio = nivelLanzadorActual > 1
                ? this.obtenerDetallePorNivelLanzadorClase(clase, nivelLanzadorActual - 1)
                : null;
            const elegibles = this.obtenerConjurosElegiblesParaClase(
                clase,
                detalleActual,
                nivelLanzadorActual,
                detallePrevio,
                true
            ).conjuros;

            elegibles.forEach((conjuro) => {
                const id = toNumber(conjuro?.Id);
                const nombre = `${conjuro?.Nombre ?? ''}`.trim();
                const escuela = `${conjuro?.Escuela?.Nombre ?? ''}`.trim();
                if (id <= 0 && nombre.length < 1)
                    return;
                const idEscuela = toNumber(conjuro?.Escuela?.Id);
                const clave = id > 0
                    ? `id:${id}`
                    : `nombre:${normalizarTexto(nombre)}:escuela:${normalizarTexto(escuela)}`;
                if (resultado.has(clave))
                    return;
                resultado.set(clave, {
                    id: id > 0 ? id : null,
                    nombre,
                    idEscuela: idEscuela > 0 ? idEscuela : null,
                    escuela,
                });
            });
        });

        return Array.from(resultado.values());
    }

    private resolverNivelLanzadorMaximoPorTipo(tipo: 'arcano' | 'divino' | 'psionico'): number {
        let maximo = 0;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const clase = this.obtenerClaseCatalogoPorNombre(nombre);
            if (!clase || !this.tieneLanzamientoPropio(clase))
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
            if (nombre.length < 1)
                return;

            const clase = this.obtenerClaseCatalogoPorNombre(nombre);
            if (!clase)
                return;
            if (tipo === 'arcano' && !clase?.Conjuros?.Arcanos)
                return;
            if (tipo === 'divino' && !clase?.Conjuros?.Divinos)
                return;

            const nivelLanzadorActual = this.getNivelLanzadorEfectivoClase(nombre);
            if (nivelLanzadorActual < 1)
                return;

            const detalleActual = this.obtenerDetallePorNivelLanzadorClase(clase, nivelLanzadorActual);
            if (!detalleActual)
                return;
            const detallePrevio = nivelLanzadorActual > 1
                ? this.obtenerDetallePorNivelLanzadorClase(clase, nivelLanzadorActual - 1)
                : null;
            const acceso = this.resolverAccesoConjurosPorTipo(clase, detalleActual, detallePrevio);
            const niveles = acceso.nivelesAccesibles;
            if (!niveles || niveles.size < 1)
                return;

            const maxClase = Array.from(niveles.values()).reduce((acc, nivel) => Math.max(acc, toNumber(nivel)), -1);
            maximo = Math.max(maximo, maxClase);
        });
        return Math.max(0, maximo);
    }

    private resolverNivelPoderPsionicoMaximo(): number {
        let maximo = -1;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const clase = this.obtenerClaseCatalogoPorNombre(nombre);
            if (!clase?.Conjuros?.Psionicos)
                return;

            const nivelLanzadorActual = this.getNivelLanzadorEfectivoClase(nombre);
            if (nivelLanzadorActual < 1)
                return;

            const detalleActual = this.obtenerDetallePorNivelLanzadorClase(clase, nivelLanzadorActual);
            if (!detalleActual)
                return;
            maximo = Math.max(
                maximo,
                toInt(detalleActual?.Nivel_max_poder_accesible_nivel_lanzadorPsionico)
            );
        });
        return Math.max(0, maximo);
    }

    private resolverReservaPsionicaActual(): number {
        let total = 0;
        (this.personajeCreacion?.desgloseClases ?? []).forEach((entrada) => {
            const nombre = `${entrada?.Nombre ?? ''}`.trim();
            const nivelActual = Math.max(0, toNumber(entrada?.Nivel));
            if (nombre.length < 1 || nivelActual < 1)
                return;

            const clase = this.catalogoClases.find((item) =>
                normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombre)
            );
            if (!clase?.Conjuros?.Psionicos)
                return;

            const detalleActual = this.obtenerDetalleNivelClase(clase, nivelActual);
            if (!detalleActual)
                return;
            total += Math.max(0, toInt(detalleActual?.Reserva_psionica));
        });
        return Math.max(0, total);
    }

    private resolverDgTotalActual(): number {
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + Math.max(0, toNumber(clase?.Nivel)), 0);
        const dgsRaza = toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad ?? this.personajeCreacion?.Raza?.Dgs_adicionales?.Cantidad);
        return Math.max(0, Math.trunc(nivelClases + Math.max(0, dgsRaza)));
    }

    private resolverTamanoActualId(): number | null {
        const id = toInt(this.personajeCreacion?.Raza?.Tamano?.Id);
        return id > 0 ? id : null;
    }

    private resolverIdEscuelaPorNombre(nombreEscuela: string): number | null {
        const nombreNorm = normalizarTexto(nombreEscuela);
        if (nombreNorm.length < 1)
            return null;
        const escuela = (this.catalogoEscuelasDotes ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = toNumber(escuela?.Id);
        return id > 0 ? id : null;
    }

    /** La salvación base que dan las clases (la parte «clase» de cada total): la que pide `salvacion_minimo`. */
    private resolverSalvacionesBaseClase(): { fortaleza: number; reflejos: number; voluntad: number; } {
        const salvaciones = totalesPersonaje(this.personajeCreacion).salvaciones;
        return {
            fortaleza: sumarPartes(salvaciones.fortaleza, 'clase'),
            reflejos: sumarPartes(salvaciones.reflejos, 'clase'),
            voluntad: sumarPartes(salvaciones.voluntad, 'clase'),
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
                normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombre)
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
                    return toNumber(ref?.[key]);
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
                Id: toNumber(item.id),
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
                Id: idKeys.reduce((acc, key) => acc > 0 ? acc : toNumber(item?.[key]), 0),
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
            const id = toNumber(item?.id) > 0 ? toNumber(item?.id) : null;
            const nombre = `${item?.nombre ?? ''}`.trim();
            if (id === null && nombre.length < 1)
                return;

            const key = id !== null ? `id:${id}` : `nombre:${normalizarTexto(nombre)}`;
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
        const objetivo = normalizarTexto(`${texto ?? ''}`);
        if (objetivo.length < 1)
            return false;
        return (this.personajeCreacion.Claseas ?? []).some((especial) =>
            normalizarTexto(especial?.Nombre ?? '').includes(objetivo)
        );
    }

    private personajeTieneDotePorId(idDote: number): boolean {
        const id = toNumber(idDote);
        if (id <= 0)
            return false;
        if ((this.personajeCreacion.DotesContextuales ?? []).some((item) => toNumber(item?.Dote?.Id) === id))
            return true;
        return (this.personajeCreacion.Dotes ?? []).some((item) =>
            toNumber((item as any)?.Id) === id
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
        const normalizada = normalizarTexto(`${plantilla ?? ''}`);
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
        const nivel = Math.max(0, toInt(nivelEfectivoCompanero));
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

        caracteristicas.Fuerza = toNumber(caracteristicas.Fuerza) + toNumber(escala?.bonoFueDes);
        caracteristicas.Destreza = toNumber(caracteristicas.Destreza) + toNumber(escala?.bonoFueDes);
        if (plantillaSeleccionada === 'sabandija' && toNumber(caracteristicas.Inteligencia) < 1)
            caracteristicas.Inteligencia = 1;
        defensa.Armadura_natural = toNumber(defensa.Armadura_natural) + toNumber(escala?.bonoArmaduraNatural);

        return {
            ...companero,
            Nombre: nombreVisible.length > 0 ? nombreVisible : `${companero?.Nombre ?? ''}`.trim(),
            Plantilla: {
                Id: idPlantilla,
                Nombre: nombrePlantilla,
            },
            Caracteristicas: caracteristicas,
            Defensa: defensa,
            Dg_adi: toNumber(escala?.dgAdi),
            Trucos_adi: toNumber(escala?.trucosAdi),
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
            Extras_de_todo_el_catalogo: {
                Armas: false,
                Armaduras: false,
                Escuelas: false,
                Habilidades: false,
            },
            Modificadores: {},
            Prerrequisitos: {},
        };
    }

    private asegurarDoteFamiliar17(): boolean {
        const yaExiste = (this.personajeCreacion.DotesContextuales ?? []).some((item) =>
            toNumber(item?.Dote?.Id) === DOTE_FAMILIAR_ID
        ) || (this.personajeCreacion.Dotes ?? []).some((item) =>
            normalizarTexto(item?.Nombre ?? '') === normalizarTexto('Alerta')
            || toNumber((item as Record<string, any>)?.['Id']) === DOTE_FAMILIAR_ID
        );
        if (yaExiste)
            return false;

        const dote = (this.catalogoDotes ?? []).find((item) => toNumber(item?.Id) === DOTE_FAMILIAR_ID)
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
            normalizarTexto(especial?.Nombre ?? '') === normalizarTexto(nombreEspecial)
            && normalizarTexto(especial?.Extra ?? '') === normalizarTexto(extra)
        );
        if (duplicado)
            return false;
        this.personajeCreacion.Claseas.push({
            Id: toNumber(idEspecial),
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
            normalizarTexto(especial?.Nombre ?? '') === normalizarTexto(nombreEspecial)
            && normalizarTexto(especial?.Extra ?? '') === normalizarTexto(extra)
        );
        if (duplicado)
            return false;
        this.personajeCreacion.Claseas.push({
            Id: toNumber(idEspecial),
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
            toNumber((item as any)?.Especial?.Id) === idEspecial
            || normalizarTexto((item as any)?.Especial?.Nombre ?? '') === normalizarTexto(nombreEspecial)
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
        const dote = (this.catalogoDotes ?? []).find((item) => toNumber(item?.Id) === idDote)
            ?? this.crearDotePlaceholder(idDote, `Dote ${idDote} (Compañero)`);
        const dotes = Array.isArray(companero?.Dotes) ? [...companero.Dotes] : [];
        const duplicado = dotes.some((item) => toNumber(item?.Dote?.Id) === idDote);
        if (duplicado)
            return false;
        dotes.push({
            Dote: dote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: toNumber(this.personajeCreacion?.Id),
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
        if (pendiente.fuente === 'nivel') {
            const nivelProgresion = Math.max(0, toInt(pendiente?.nivelProgresion));
            if (nivelProgresion > 0)
                return `Dote adicional por nivel ${nivelProgresion}`;
        }

        const prefijos: Record<DoteFuentePendiente, string> = {
            nivel: 'Dote por nivel',
            adicional: 'Dote adicional',
            raza: 'Dote adicional de raza',
            raza_dg: 'DGs de raza',
        };
        const prefijo = prefijos[pendiente.fuente] ?? 'Dote adicional';
        const origen = `${pendiente?.origen ?? ''}`.trim();
        return origen.length > 0 ? `${prefijo}: ${origen}` : prefijo;
    }

    private resolverExtraTextoDote(dote: Dote, idExtra: number, extraSeleccionado: string): string {
        const requiereExtra = this.doteTieneExtrasSoportados(dote);
        if (!requiereExtra)
            return 'No aplica';

        const id = Math.max(0, toNumber(idExtra));
        if (id > 0) {
            const extra = this.resolverExtrasDisponiblesDote(dote)
                .find((item) => toNumber(item?.Id) === id);
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
        const idExtraNormalizado = Math.max(0, toNumber(idExtra));
        const origenNormalizado = `${origen ?? ''}`.trim();

        const duplicadaLegacy = (this.personajeCreacion.Dotes ?? []).some((item) =>
            normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombre)
            && normalizarTexto(item?.Extra ?? '') === normalizarTexto(extra)
            && normalizarTexto(item?.Origen ?? '') === normalizarTexto(origenNormalizado)
        );
        let agregadoLegacy = false;
        if (!duplicadaLegacy) {
            this.personajeCreacion.Dotes.push({
                Nombre: nombre,
                Descripcion: `${dote?.Descripcion ?? ''}`.trim(),
                Beneficio: `${dote?.Beneficio ?? ''}`.trim(),
                Pagina: toNumber(dote?.Manual?.Pagina),
                Extra: extra,
                Origen: origenNormalizado,
            });
            agregadoLegacy = true;
        }

        const idDote = toNumber(dote?.Id);
        let agregadoContextual = false;
        if (idDote > 0) {
            const duplicadaContextual = (this.personajeCreacion.DotesContextuales ?? []).some((item) =>
                toNumber(item?.Dote?.Id) === idDote
                && toNumber(item?.Contexto?.Id_extra) === idExtraNormalizado
                && normalizarTexto((item?.Contexto as any)?.Origen ?? '') === normalizarTexto(origenNormalizado)
            );
            if (!duplicadaContextual) {
                this.personajeCreacion.DotesContextuales.push({
                    Dote: dote,
                    Contexto: {
                        Entidad: 'personaje',
                        Id_personaje: toNumber(this.personajeCreacion?.Id),
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

    /**
     * Sin `destino`, los modificadores van directos al personaje (dotes de nivel y de plantilla). Con él, las
     * características y las habilidades van a lo que está montando el recálculo de las ventajas.
     */
    private aplicarModificadoresDote(dote: Dote, _origen: string, idExtra: number, extraTexto: string, destino?: DestinoModificadoresDote): void {
        const origen = `Dote: ${`${dote?.Nombre ?? ''}`.trim() || 'Sin nombre'}`;
        const mods = (dote?.Modificadores ?? {}) as Record<string, any>;
        const get = (clave: string): number => toNumber(mods?.[clave]);
        const caracteristicasVarios = destino?.caracteristicasVarios ?? this.personajeCreacion.CaracteristicasVarios;

        CARACTERISTICAS.forEach((key) => {
            const valor = get(key);
            if (valor === 0)
                return;
            (caracteristicasVarios[key] ?? []).push({
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
            this.aplicarModificadorHabilidadDesdeDote(dote, bonusHabilidad, origen, idExtra, extraTexto, destino?.bonosHabilidades);
    }

    private aplicarModificadorHabilidadDesdeDote(
        dote: Dote,
        valor: number,
        origen: string,
        idExtra: number,
        extraTexto: string,
        bonosHabilidades?: Record<number, HabilidadBonoVario[]>
    ): void {
        const requiereExtraHabilidad = toBoolean(dote?.Extras_soportados?.Extra_habilidad);
        const idObjetivo = requiereExtraHabilidad ? Math.max(0, toNumber(idExtra)) : 0;
        const extraNorm = normalizarTexto(extraTexto ?? '');

        const objetivo = (this.personajeCreacion.Habilidades ?? []).find((habilidad) => {
            if (idObjetivo > 0 && toNumber(habilidad?.Id) === idObjetivo)
                return true;
            if (!requiereExtraHabilidad)
                return false;
            return extraNorm.length > 0 && normalizarTexto(habilidad?.Nombre ?? '') === extraNorm;
        });
        if (!objetivo)
            return;
        if (bonosHabilidades) {
            const idObjetivoHabilidad = toNumber(objetivo.Id);
            bonosHabilidades[idObjetivoHabilidad] = [...(bonosHabilidades[idObjetivoHabilidad] ?? []), { valor, origen }];
            return;
        }

        const bonos = Array.isArray(objetivo.Bonos_varios) ? [...objetivo.Bonos_varios] : [];
        bonos.push({
            valor,
            origen,
        });
        objetivo.Bonos_varios = bonos;
        objetivo.Rangos_varios = bonos.reduce((acc, bono) => acc + toNumber(bono?.valor), 0);
        objetivo.Varios = bonos
            .map((bono) => `${bono?.origen ?? ''} ${toNumber(bono?.valor) >= 0 ? '+' : ''}${toNumber(bono?.valor)}`.trim())
            .join(', ');
    }

    aplicarIdiomasAutomaticos(origen: string, idiomas: IdiomaDetalle[]): void {
        const origenNormalizado = `${origen ?? ''}`.trim();
        const existentes = new Set(
            (this.personajeCreacion.Idiomas ?? [])
                .map((idioma) => normalizarTexto(idioma?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        const idiomaLista = Array.isArray(idiomas)
            ? idiomas
            : (idiomas && typeof idiomas === 'object' ? Object.values(idiomas as any) : []);
        idiomaLista.forEach((idiomaRaw: any) => {
            const nombre = `${idiomaRaw?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const nombreNorm = normalizarTexto(nombre);
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
        const nivel = Math.max(0, toInt(nivelAplicado));
        if (nivel !== 1)
            return null;
        if (!toBoolean(clase?.Conjuros?.puede_elegir_especialidad))
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
            const especializar = toBoolean(arcana?.especializar);
            if (!especializar) {
                this.personajeCreacion.Escuela_especialista = {
                    Nombre: 'Cualquiera',
                    Calificativo: 'Cualquiera',
                };
                this.personajeCreacion.Escuelas_prohibidas = [];
            } else {
                const escuelasEspecializables = this.obtenerCatalogoEscuelasEspecializables(escuelasCatalogo);
                const idEspecialista = toInt(arcana?.escuelaEspecialistaId);
                const escuelaEspecialista = escuelasEspecializables.find((escuela) => toNumber(escuela?.Id) === idEspecialista);
                if (!escuelaEspecialista) {
                    return {
                        aplicado: false,
                        razon: 'Debes seleccionar una escuela válida para especializarte.',
                    };
                }

                const escuelasProhibibles = this.obtenerCatalogoEscuelasProhibibles(escuelasCatalogo, idEspecialista);
                const idsProhibidas = Array.from(new Set(
                    (arcana?.escuelasProhibidasIds ?? [])
                        .map((id) => toInt(id))
                        .filter((id) => id > 0 && id !== idEspecialista)
                ));
                const prohibidasSeleccionadas = escuelasProhibibles
                    .filter((escuela) => idsProhibidas.includes(toNumber(escuela?.Id)));
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
            const idEspecialista = toInt(psionica?.disciplinaEspecialistaId);
            const idProhibida = toInt(psionica?.disciplinaProhibidaId);
            const disciplinaEspecialista = disciplinasEspecializables
                .find((disciplina) => toNumber(disciplina?.Id) === idEspecialista);
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
                .find((disciplina) => toNumber(disciplina?.Id) === idProhibida);
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
            const idClase = toNumber(entradaActual?.claseObjetivo?.id);
            const nombreClase = `${entradaActual?.claseObjetivo?.nombre ?? ''}`.trim();
            const claseObjetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(nombreClase))
            ) ?? null;

            if (!claseObjetivo) {
                avisos.push(`No se pudo recalcular conjuros para ${nombreClase || 'clase desconocida'}.`);
                entradasRecalculadas.push({ ...entradaActual });
                return;
            }

            const recalculo = this.crearEntradaSesionConjuros(
                claseObjetivo,
                `${entradaActual?.origen ?? ''}`.trim(),
                toNumber(entradaActual?.nivelLanzadorPrevio),
                toNumber(entradaActual?.nivelLanzadorActual)
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

        this.actualizarDesgloseClase(clase, siguienteNivel);
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
                ...(evaluacion.advertencias ?? []),
                ...resolucionOpcionales.advertencias,
                ...advertenciasConjuros,
            ],
            gruposOpcionalesPendientes: resolucionOpcionales.gruposPendientes,
            especialesAplicados: especialesAplicar.map((especialNivel) => ({ ...especialNivel })),
        };
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
        this.aplicarConfigGeneradorEfectiva({ forceReset: true });
    }

    setTablasPermitidasGenerador(cantidad: number): void {
        const tablas = this.normalizarTablasPermitidas(cantidad);
        this.generadorConfigBase.tablasPermitidas = tablas;
        this.persistirConfigGenerador();
        this.aplicarConfigGeneradorEfectiva({ forceReset: true });
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

        CARACTERISTICAS.forEach((key) => {
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
        CARACTERISTICAS.forEach((key) => {
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
            ranking: ranking.slice() as Caracteristica[],
            top2: ranking.slice(0, 2) as Caracteristica[],
            recomendacion,
            requierePregunta4,
            pregunta4Aplicada,
            esCompletoBase,
        };
    }

    debeMostrarPregunta4(score: GeneradorAutoScore): boolean {
        const valores = Object.values(score)
            .map((value) => toNumber(value))
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

        const caracteristica = CARACTERISTICAS.find((key) =>
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
        return CARACTERISTICAS.every((key) => this.esCaracteristicaPerdida(key) || asigs[key] !== null);
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

        if (CARACTERISTICAS.some((key) => !this.esCaracteristicaPerdida(key) && asignaciones[key] === null)) {
            return false;
        }

        CARACTERISTICAS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const base = perdida ? 0 : toNumber(asignaciones[key]);
            const final = perdida ? 0 : base + toNumber(razaMods?.[key]);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : modificadorCaracteristica(final));
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
        this.aplicarModificadoresDotesDeRaza({ caracteristicasVarios, bonosHabilidades });

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
            const coste = toNumber(d.Coste);
            return acc + (coste > 0 ? coste : 0);
        }, 0);
        const puntosGastados = ventajas.reduce((acc, v) => acc + Math.abs(toNumber(v.Coste)), 0);
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
            Fuerza: toNumber(this.personajeCreacion.Fuerza),
            Destreza: toNumber(this.personajeCreacion.Destreza),
            Constitucion: toNumber(this.personajeCreacion.Constitucion),
            Inteligencia: toNumber(this.personajeCreacion.Inteligencia),
            Sabiduria: toNumber(this.personajeCreacion.Sabiduria),
            Carisma: toNumber(this.personajeCreacion.Carisma),
        };
        this.estadoFlujo.ventajas.baseRaciales = this.copiarRaciales(this.personajeCreacion.Raciales);
        this.estadoFlujo.ventajas.baseIdiomas = this.copiarIdiomas(this.personajeCreacion.Idiomas);
    }

    private aplicarCaracteristicasFinalesDesdeBase(): void {
        const base = this.estadoFlujo.ventajas.baseCaracteristicas;
        if (!base)
            return;

        CARACTERISTICAS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const minimoPlantilla = this.obtenerMinimoCaracteristicaPorPlantillas(key);
            const suma = perdida
                ? 0
                : (this.personajeCreacion.CaracteristicasVarios[key] ?? [])
                    .reduce((acc, mod) => acc + toNumber(mod.valor), 0);
            const finalSinMin = perdida ? 0 : toNumber(base[key]) + suma;
            const final = perdida ? 0 : Math.max(finalSinMin, minimoPlantilla);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : modificadorCaracteristica(final));
        });
        this.recalcularDerivadasPorCaracteristicas();
        this.sincronizarAliasConstitucionPerdida();
    }

    private aplicarModificadoresCaracteristica(
        detalle: VentajaDetalle,
        origen: string,
        caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>
    ): void {
        const valor = toNumber(detalle.Mejora);
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
        const valor = toNumber(detalle.Mejora);
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

        registrar('fortaleza', toNumber(raza?.Dgs_adicionales?.Fortaleza), `${nombreRaza} DG racial`);
        registrar('reflejos', toNumber(raza?.Dgs_adicionales?.Reflejos), `${nombreRaza} DG racial`);
        registrar('voluntad', toNumber(raza?.Dgs_adicionales?.Voluntad), `${nombreRaza} DG racial`);

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
        const normalizado = normalizarTexto(raw);
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
                const entero = primerEntero(candidato);
                if (entero !== null)
                    return entero;
            }
        }

        return null;
    }

    private aplicarModificadorIniciativa(detalle: VentajaDetalle, origen: string): void {
        if (!detalle.Iniciativa)
            return;

        const valor = toNumber(detalle.Mejora);
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
        const valor = toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const habilidadObjetivo = this.buscarHabilidadEnPersonaje(detalle);
        if (!habilidadObjetivo)
            return;

        const id = toNumber(habilidadObjetivo.Id);
        if (!bonosHabilidades[id])
            bonosHabilidades[id] = [];

        bonosHabilidades[id].push({
            valor,
            origen,
        });
    }

    private buscarHabilidadEnPersonaje(detalle: VentajaDetalle): Personaje['Habilidades'][number] | null {
        const idObjetivo = toNumber(detalle.Habilidad?.Id);
        if (idObjetivo > 0) {
            const porId = this.personajeCreacion.Habilidades.find(h => toNumber(h.Id) === idObjetivo);
            if (porId)
                return porId;
        }

        const nombreObjetivo = normalizarTexto(detalle.Habilidad?.Nombre ?? '');
        if (nombreObjetivo.length < 1)
            return null;

        return this.personajeCreacion.Habilidades.find((h) => normalizarTexto(h.Nombre) === nombreObjetivo) ?? null;
    }

    private aplicarBonosHabilidadEnPersonaje(): void {
        this.actualizarModsHabilidadesPorCaracteristica();
        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades.map((h) => {
            const bonos = this.estadoFlujo.ventajas.bonosHabilidades[toNumber(h.Id)] ?? [];
            const rangosVarios = bonos.reduce((acc, b) => acc + toNumber(b.valor), 0);
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

        const existe = raciales.some(r => normalizarTexto(r.Nombre) === normalizarTexto(nombre));
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
            if (idiomas.some(i => normalizarTexto(i.Nombre) === normalizarTexto(nombre)))
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
        if (idiomas.some(i => normalizarTexto(i.Nombre) === normalizarTexto(nombreIdioma)))
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
        this.limpiarDotesAplicadasPorPlantillas();

        this.personajeCreacion.Correr = toNumber(raza?.Correr);
        this.personajeCreacion.Nadar = toNumber(raza?.Nadar);
        this.personajeCreacion.Volar = toNumber(raza?.Volar);
        this.personajeCreacion.Trepar = toNumber(raza?.Trepar);
        this.personajeCreacion.Escalar = toNumber(raza?.Escalar);

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
        let ataqueBase = toNumber(raza?.Dgs_adicionales?.Ataque_base) + ataqueClases;
        let armaduraNatural = toNumber(raza?.Armadura_natural);
        let caVarios = toNumber(raza?.Varios_armadura);
        let dadoGolpe = this.resolverDadoGolpeTipoActual();
        let pgsLicantronia = 0;

        const hayReglasAlineamiento = seleccionadas.some((plantilla) => this.tieneRestriccionAlineamientoPlantilla(plantilla));
        if (hayReglasAlineamiento) {
            const alineamientoResuelto = resolverAlineamientoPlantillas(this.personajeCreacion.Alineamiento, seleccionadas);
            if (!alineamientoResuelto.conflicto && normalizarTexto(alineamientoResuelto.alineamiento).length > 0)
                this.personajeCreacion.Alineamiento = alineamientoResuelto.alineamiento;
        }

        seleccionadas.forEach((plantilla) => {
            const origen = `${plantilla?.Nombre ?? ''}`.trim() || `Plantilla ${toNumber(plantilla?.Id)}`;
            ataqueBase += toNumber(plantilla?.Ataque_base);

            if (toNumber(plantilla?.Movimientos?.Correr) > 0)
                this.personajeCreacion.Correr = toNumber(plantilla.Movimientos.Correr);
            if (toNumber(plantilla?.Movimientos?.Nadar) > 0)
                this.personajeCreacion.Nadar = toNumber(plantilla.Movimientos.Nadar);
            if (toNumber(plantilla?.Movimientos?.Volar) > 0)
                this.personajeCreacion.Volar = toNumber(plantilla.Movimientos.Volar);
            if (toNumber(plantilla?.Movimientos?.Trepar) > 0)
                this.personajeCreacion.Trepar = toNumber(plantilla.Movimientos.Trepar);
            if (toNumber(plantilla?.Movimientos?.Escalar) > 0)
                this.personajeCreacion.Escalar = toNumber(plantilla.Movimientos.Escalar);

            if (toNumber(plantilla?.Fortaleza) !== 0) {
                this.personajeCreacion.Salvaciones.fortaleza.modsVarios.push({
                    valor: toNumber(plantilla.Fortaleza),
                    origen,
                });
            }
            if (toNumber(plantilla?.Reflejos) !== 0) {
                this.personajeCreacion.Salvaciones.reflejos.modsVarios.push({
                    valor: toNumber(plantilla.Reflejos),
                    origen,
                });
            }
            if (toNumber(plantilla?.Voluntad) !== 0) {
                this.personajeCreacion.Salvaciones.voluntad.modsVarios.push({
                    valor: toNumber(plantilla.Voluntad),
                    origen,
                });
            }
            if (toNumber(plantilla?.Iniciativa) !== 0) {
                this.personajeCreacion.Iniciativa_varios.push({
                    Valor: toNumber(plantilla.Iniciativa),
                    Origen: origen,
                });
            }
            if (toNumber(plantilla?.Presa) !== 0) {
                this.personajeCreacion.Presa_varios.push({
                    Valor: toNumber(plantilla.Presa),
                    Origen: origen,
                });
            }

            CARACTERISTICAS.forEach((key) => {
                const valor = toNumber((plantilla?.Modificadores_caracteristicas as Record<string, any>)?.[key]);
                if (valor !== 0) {
                    caracteristicasVarios[key].push({
                        valor,
                        origen,
                    });
                }
            });

            const textoCa = `${plantilla?.Ca ?? ''}`.trim();
            const valorCa = primerEntero(textoCa) ?? 0;
            if (valorCa !== 0) {
                const normalizado = normalizarTexto(textoCa);
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
                const rangos = toNumber(habilidadRef?.Rangos);
                if (rangos === 0)
                    return;

                const habilidad = this.asegurarHabilidadDesdePlantilla(habilidadRef);
                if (!habilidad)
                    return;

                const idHabilidad = toNumber(habilidad.Id);
                if (idHabilidad <= 0)
                    return;

                if (!bonosHabilidades[idHabilidad])
                    bonosHabilidades[idHabilidad] = [];
                bonosHabilidades[idHabilidad].push({
                    valor: rangos,
                    origen,
                });
            });

            this.aplicarDotesPlantilla(plantilla, origen);

            const dadoDirecto = this.resolverDadoDesdePlantilla(plantilla);
            if (dadoDirecto > 0)
                dadoGolpe = dadoDirecto;
            const pasoDado = toNumber(plantilla?.Modificacion_dg?.Id_paso_modificacion);
            if (pasoDado !== 0)
                dadoGolpe = this.aplicarPasoDado(dadoGolpe, pasoDado);

            // Regla de negocio: Suma licantrópica incrementa PGs finales, no DGs adicionales.
            pgsLicantronia += toNumber(plantilla?.Licantronia_dg?.Suma);
        });

        this.personajeCreacion.Ataque_base = `${ataqueBase}`;
        this.personajeCreacion.Armadura_natural = armaduraNatural;
        this.personajeCreacion.Ca_varios = caVarios;
        this.personajeCreacion.Dados_golpe = dadoGolpe;
        this.personajeCreacion.Pgs_lic = Math.max(0, pgsLicantronia);

        this.recalcularDerivadasEconomiaYProgresion(seleccionadas);
    }

    /**
     * Las dotes que tienen todos los de la raza: las de la raza (`raza_dotes`, como la Resistencia al calor del asherati),
     * con la raza como origen, y las de sus raciales (`racial_dotes`), con el racial como origen. La dote es la del
     * catálogo si está (con sus modificadores); si no, la que trae la raza o, de un racial, su id y su nombre.
     */
    private resolverDotesDeRaza(raza: Raza | null): DoteDeRaza[] {
        const delCatalogo = (id: number): Dote | undefined => this.catalogoDotes.find((item) => toNumber(item?.Id) === id);
        const origenRaza = `${raza?.Nombre ?? ''}`.trim() || 'Raza';
        const deLaRaza = (raza?.DotesContextuales ?? [])
            .filter((entrada) => toNumber(entrada?.Dote?.Id) > 0)
            .map((entrada) => ({
                dote: delCatalogo(toNumber(entrada.Dote.Id)) ?? entrada.Dote,
                idExtra: toNumber(entrada?.Contexto?.Id_extra),
                extra: `${entrada?.Contexto?.Extra ?? ''}`.trim() || 'No aplica',
                origen: origenRaza,
            }));
        const deSusRaciales = (raza?.Raciales ?? []).flatMap((racial) => (racial?.Dotes ?? [])
            .filter((entrada) => toNumber(entrada?.Id_dote) > 0)
            .map((entrada) => ({
                dote: delCatalogo(toNumber(entrada.Id_dote)) ?? ({ Id: toNumber(entrada.Id_dote), Nombre: `${entrada?.Dote ?? ''}`.trim() } as Dote),
                idExtra: toNumber(entrada?.Id_extra),
                extra: `${entrada?.Extra ?? ''}`.trim() || 'No aplica',
                origen: `${racial?.Nombre ?? ''}`.trim() || origenRaza,
            })));
        return [...deLaRaza, ...deSusRaciales];
    }

    /** Las dotes de la raza pasan al personaje: se guardan con él y cuentan para los prerrequisitos. */
    private agregarDotesDeRaza(raza: Raza): void {
        this.resolverDotesDeRaza(raza).forEach(({ dote, idExtra, extra, origen }) =>
            this.agregarDoteAlPersonaje(dote, origen, idExtra, extra));
    }

    /**
     * Los modificadores de las dotes de la raza, una sola vez: se aplican aquí, dentro del recálculo de las ventajas,
     * que parte de cero (`resetearAplicacionesVentajas`), como las habilidades y salvaciones de la raza. Aplicados al
     * elegir la raza, el recálculo los borraba; aplicados en los dos sitios, se contarían dos veces.
     */
    private aplicarModificadoresDotesDeRaza(destino: DestinoModificadoresDote): void {
        this.resolverDotesDeRaza(this.razaSeleccionada).forEach(({ dote, idExtra, extra, origen }) =>
            this.aplicarModificadoresDote(dote, origen, idExtra, extra, destino));
    }

    private aplicarDotesPlantilla(plantilla: Plantilla, origen: string): void {
        (plantilla?.Dotes ?? []).forEach((entrada) => {
            const dote = entrada?.Dote;
            const nombre = `${dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const idExtra = toNumber((entrada?.Contexto as any)?.Id_extra);
            const extra = `${(entrada?.Contexto as any)?.Extra ?? ''}`.trim() || 'No aplica';
            this.agregarDoteAlPersonaje(dote, origen, idExtra, extra);
            this.aplicarModificadoresDote(dote, origen, idExtra, extra);
            this.registrarFirmaDotePlantilla(dote, origen, idExtra, extra);
        });
    }

    private limpiarDotesAplicadasPorPlantillas(): void {
        if (this.firmasDotesPlantillaAplicadas.size < 1)
            return;

        this.personajeCreacion.Dotes = (this.personajeCreacion.Dotes ?? []).filter((dote) =>
            !this.firmasDotesPlantillaAplicadas.has(this.getFirmaDoteLegacy(dote))
        );
        this.personajeCreacion.DotesContextuales = (this.personajeCreacion.DotesContextuales ?? []).filter((entrada) =>
            !this.firmasDotesPlantillaAplicadas.has(this.getFirmaDoteContextual(entrada))
        );
        this.firmasDotesPlantillaAplicadas.clear();
    }

    private registrarFirmaDotePlantilla(dote: Dote, origen: string, idExtra: number, extra: string): void {
        const nombre = `${dote?.Nombre ?? ''}`.trim();
        this.firmasDotesPlantillaAplicadas.add(this.getFirmaDoteNormalizada(nombre, extra, origen));
        this.firmasDotesPlantillaAplicadas.add(
            this.getFirmaDoteContextualNormalizada(toNumber(dote?.Id), nombre, idExtra, origen)
        );
    }

    private getFirmaDoteLegacy(dote: DoteLegacy): string {
        return this.getFirmaDoteNormalizada(
            `${dote?.Nombre ?? ''}`.trim(),
            `${dote?.Extra ?? ''}`.trim() || 'No aplica',
            `${dote?.Origen ?? ''}`.trim()
        );
    }

    private getFirmaDoteContextual(entrada: DoteContextual): string {
        return this.getFirmaDoteContextualNormalizada(
            toNumber(entrada?.Dote?.Id),
            `${entrada?.Dote?.Nombre ?? ''}`.trim(),
            toNumber(entrada?.Contexto?.Id_extra),
            `${(entrada?.Contexto as any)?.Origen ?? ''}`.trim()
        );
    }

    private getFirmaDoteNormalizada(nombre: string, extra: string, origen: string): string {
        return [
            normalizarTexto(nombre),
            normalizarTexto(extra),
            normalizarTexto(origen),
        ].join('|');
    }

    private getFirmaDoteContextualNormalizada(idDote: number, nombre: string, idExtra: number, origen: string): string {
        const identidad = Math.max(0, toInt(idDote)) > 0
            ? `id:${Math.max(0, toInt(idDote))}`
            : `nombre:${normalizarTexto(nombre)}`;
        return [
            identidad,
            `extra:${Math.max(0, toInt(idExtra))}`,
            `origen:${normalizarTexto(origen)}`,
        ].join('|');
    }

    private esHabilidadClaseaParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        if (habilidad.Clasea)
            return true;
        const id = toNumber(habilidad?.Id);
        if (id <= 0)
            return false;
        return this.estadoFlujo.habilidades.classSkillTemporales.includes(id);
    }

    /**
     * Se elige el extra de la habilidad (qué Saber, qué Artesanía): si es clásea o si ya tiene rangos, comprados como
     * transclásea.
     */
    private esExtraElegibleParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        return this.esHabilidadClaseaParaSesion(habilidad) || toNumber(habilidad?.Rangos) > 0;
    }

    private obtenerRangoInicialHabilidadSesion(idHabilidad: number): number {
        const id = Math.max(0, toInt(idHabilidad));
        if (id <= 0)
            return 0;

        const mapa = this.estadoFlujo?.habilidades?.rangosIniciales ?? {};
        const valor = toNumber((mapa as Record<number, number>)?.[id] ?? 0);
        if (!Number.isFinite(valor))
            return 0;

        return Math.max(0, Math.trunc(valor));
    }

    private esExtraHabilidadPendienteParaSesion(habilidad: Personaje['Habilidades'][number]): boolean {
        if (!this.esExtraElegibleParaSesion(habilidad))
            return false;
        if (!toBoolean(habilidad?.Soporta_extra))
            return false;

        return this.esExtraHabilidadPendienteValor(normalizarTexto(`${habilidad?.Extra ?? ''}`));
    }

    private esExtraHabilidadPendienteValor(extraNormalizado: string): boolean {
        // Un extra vacío o «Elegir» está por escoger. Los textos de relleno («-», «No aplica»…) ya no llegan de la API.
        return extraNormalizado.length < 1 || esTextoExtraPorElegir(extraNormalizado);
    }

    private getClaveGrupoExtraHabilidad(habilidad: Personaje['Habilidades'][number]): string {
        const id = toNumber(habilidad?.Id);
        const nombre = `${habilidad?.Nombre ?? ''}`;
        const familia = this.resolverFamiliaRepetiblePorReferencia(id, nombre);
        if (familia)
            return `familia:${familia}`;

        const base = normalizarTexto(nombre).replace(/\s+\d+$/, '').trim();
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
        const idObjetivo = toNumber(habilidadObjetivo?.Id);

        return this.personajeCreacion.Habilidades.some((habilidad) => {
            if (toNumber(habilidad?.Id) === idObjetivo)
                return false;
            if (!this.esExtraElegibleParaSesion(habilidad))
                return false;
            if (!toBoolean(habilidad?.Soporta_extra))
                return false;
            if (this.getClaveGrupoExtraHabilidad(habilidad) !== claveGrupo)
                return false;
            const extraNormalizado = normalizarTexto(`${habilidad?.Extra ?? ''}`);
            if (this.esExtraHabilidadPendienteValor(extraNormalizado))
                return false;
            return extraNormalizado === extraNormalizadoObjetivo;
        });
    }

    private hayExtrasDuplicadosClaseosParaSesion(): boolean {
        const vistos = new Set<string>();

        for (const habilidad of (this.personajeCreacion.Habilidades ?? [])) {
            if (!this.esExtraElegibleParaSesion(habilidad))
                continue;
            if (!toBoolean(habilidad?.Soporta_extra))
                continue;

            const extraNormalizado = normalizarTexto(`${habilidad?.Extra ?? ''}`);
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
        const id = toNumber(idHabilidad);
        const nombreNorm = normalizarTexto(nombre);

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
            const id = toNumber(habilidad?.Id);
            if (ids.includes(id))
                return true;
            return this.resolverFamiliaRepetiblePorReferencia(id, `${habilidad?.Nombre ?? ''}`) === familia;
        });

        return slots.sort((a, b) => {
            const idxA = ids.indexOf(toNumber(a?.Id));
            const idxB = ids.indexOf(toNumber(b?.Id));
            if (idxA !== idxB)
                return idxA - idxB;
            return compararTexto(a?.Nombre, b?.Nombre);
        }).slice(0, config.maxSlots);
    }

    private esSlotHabilidadOcupado(habilidad: Personaje['Habilidades'][number] | null | undefined): boolean {
        if (!habilidad)
            return true;
        return toNumber(habilidad?.Rangos) > 0
            || toNumber(habilidad?.Rangos_varios) > 0
            || !!habilidad?.Clasea;
    }

    private resolverSlotFamiliaParaOtorgamiento(
        familia: HabilidadFamiliaRepetibleKey,
        preferida: Personaje['Habilidades'][number] | null
    ): Personaje['Habilidades'][number] | null {
        const slots = this.obtenerSlotsFamiliaRepetible(familia);
        if (slots.length < 1)
            return preferida;

        const preferidaId = toNumber(preferida?.Id);
        if (preferida && slots.some((item) => toNumber(item?.Id) === preferidaId) && !this.esSlotHabilidadOcupado(preferida))
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
        const idObjetivoRaw = toNumber(
            referencia?.['Id_habilidad'] ?? referencia?.['id_habilidad'] ?? referencia?.['Id'] ?? referencia?.['id']
        );
        const nombreObjetivo = `${referencia?.['Habilidad'] ?? referencia?.['habilidad'] ?? referencia?.['Nombre'] ?? referencia?.['nombre'] ?? ''}`.trim();
        const nombreNorm = normalizarTexto(nombreObjetivo);
        const catalogo = this.buscarDefinicionHabilidadCatalogo(idObjetivoRaw, nombreNorm, !!opciones.customPreferido);
        const detalleCatalogo = catalogo.detalle;
        const idObjetivoCatalogo = toNumber(detalleCatalogo?.Id_habilidad);
        const idObjetivo = idObjetivoRaw > 0 ? idObjetivoRaw : idObjetivoCatalogo;

        const custom = !!(opciones.customPreferido || referencia?.['Custom'] || referencia?.['custom'] || catalogo.esCustom);
        const marcarClasea = opciones.marcarClasea !== false;
        const expandirFamiliaConDuplicados = opciones.expandirFamiliaConDuplicados !== false;
        const entrenada = toBoolean(
            referencia?.['Entrenada'] ?? referencia?.['entrenada'] ?? detalleCatalogo?.Entrenada
        );
        const idCaracteristica = toNumber(
            referencia?.['Id_caracteristica'] ?? referencia?.['id_caracteristica']
            ?? referencia?.['IdCaracteristica'] ?? referencia?.['idCaracteristica']
            ?? detalleCatalogo?.Id_caracteristica
        );
        const textoCaracteristica = `${referencia?.['Caracteristica'] ?? referencia?.['caracteristica'] ?? detalleCatalogo?.Caracteristica ?? ''}`.trim();
        const soportaExtra = toBoolean(
            referencia?.['Soporta_extra'] ?? referencia?.['soporta_extra'] ?? detalleCatalogo?.Soporta_extra
        );
        const extras = this.resolverExtrasHabilidadDesdeReferencia(referencia, detalleCatalogo);
        const extraFijoReferencia = this.resolverExtraFijoDesdeReferencia(referencia, extras);
        const keyCar = this.resolverCaracteristicaPorIdOTexto(idCaracteristica, textoCaracteristica);

        let existente: Personaje['Habilidades'][number] | null = null;
        if (idObjetivo > 0) {
            existente = this.personajeCreacion.Habilidades.find((h) => toNumber(h.Id) === idObjetivo) ?? null;
        }
        if (!existente && nombreNorm.length > 0) {
            existente = this.personajeCreacion.Habilidades
                .find((h) => normalizarTexto(h.Nombre) === nombreNorm) ?? null;
        }

        const familia = this.resolverFamiliaRepetiblePorReferencia(idObjetivo, nombreObjetivo);
        if (familia) {
            if (!expandirFamiliaConDuplicados && existente && toBoolean(existente?.Clasea))
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
        ].sort(porNombre);

        return this.personajeCreacion.Habilidades
            .find((h) => toNumber(h.Id) === nuevoId || normalizarTexto(h.Nombre) === normalizarTexto(nuevoNombre))
            ?? null;
    }

    private buscarDefinicionHabilidadCatalogo(
        idObjetivo: number,
        nombreNorm: string,
        preferCustom: boolean
    ): { detalle: HabilidadBasicaDetalle | null; esCustom: boolean; } {
        const buscarEn = (catalogo: HabilidadBasicaDetalle[]): HabilidadBasicaDetalle | null => {
            if (idObjetivo > 0) {
                const porId = catalogo.find((h) => toNumber(h?.Id_habilidad) === idObjetivo) ?? null;
                if (porId)
                    return porId;
            }
            if (nombreNorm.length > 0) {
                return catalogo.find((h) => normalizarTexto(h?.Nombre ?? '') === nombreNorm) ?? null;
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
                Id_extra: toNumber(extra?.Id_extra ?? extra?.id_extra ?? extra?.Id ?? extra?.id),
                Extra: `${extra?.Extra ?? extra?.extra ?? extra?.Nombre ?? extra?.nombre ?? ''}`.trim(),
                Descripcion: `${extra?.Descripcion ?? extra?.descripcion ?? ''}`.trim(),
            }))
            .filter((extra) => extra.Id_extra > 0 || extra.Extra.length > 0 || extra.Descripcion.length > 0);
        if (extrasReferencia.length > 0)
            return extrasReferencia;

        return (detalleCatalogo?.Extras ?? []).map((extra) => ({
            Id_extra: toNumber(extra?.Id_extra),
            Extra: `${extra?.Extra ?? ''}`.trim(),
            Descripcion: `${extra?.Descripcion ?? ''}`.trim(),
        }));
    }

    private resolverExtraFijoDesdeReferencia(
        referencia: Record<string, any>,
        extrasDisponibles: Array<{ Id_extra: number; Extra: string; Descripcion: string; }>
    ): { bloqueado: boolean; valor: string; } {
        const extraRaw = `${referencia?.['Extra'] ?? referencia?.['extra'] ?? ''}`.trim();
        const extraNorm = normalizarTexto(extraRaw);
        if (extraRaw.length > 0 && !this.esExtraHabilidadPendienteValor(extraNorm))
            return { bloqueado: true, valor: extraRaw };

        const idExtra = toNumber(
            referencia?.['Id_extra'] ?? referencia?.['id_extra'] ?? referencia?.['IdExtra'] ?? referencia?.['idExtra']
        );
        if (idExtra <= 0)
            return { bloqueado: false, valor: '' };

        const encontrado = extrasDisponibles.find((item) => toNumber(item?.Id_extra) === idExtra);
        const valor = `${encontrado?.Extra ?? ''}`.trim();
        const valorNorm = normalizarTexto(valor);
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

            const cantidad = toNumber(raw['Cantidad'] ?? raw['cantidad'] ?? raw['Rangos'] ?? raw['rangos']);
            if (cantidad === 0)
                return;

            const idHabilidad = toNumber(habilidad.Id);
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
        const nombreNorm = normalizarTexto(nombreClase);
        if (nombreNorm.length < 1)
            return 0;
        const encontrada = (this.personajeCreacion.desgloseClases ?? [])
            .find((clase) => normalizarTexto(clase?.Nombre ?? '') === nombreNorm);
        return toNumber(encontrada?.Nivel);
    }

    private obtenerSiguienteNivelClase(nombreClase: string): number {
        return this.obtenerNivelActualClase(nombreClase) + 1;
    }

    private obtenerDetalleNivelClase(clase: Clase, nivel: number): ClaseNivelDetalle | null {
        const nivelNormalizado = Math.max(1, toInt(nivel));
        return (clase?.Desglose_niveles ?? [])
            .find((item) => toNumber(item?.Nivel) === nivelNormalizado) ?? null;
    }

    private obtenerClaseCatalogoPorNombre(nombreClase: string): Clase | null {
        const nombreNorm = normalizarTexto(nombreClase);
        if (nombreNorm.length < 1)
            return null;
        return this.catalogoClases.find((item) =>
            normalizarTexto(item?.Nombre ?? '') === nombreNorm
        ) ?? null;
    }

    private usaConjurosDiariosParaNivelLanzador(clase: Clase | null | undefined): boolean {
        return !!clase?.Conjuros?.Arcanos
            || !!clase?.Conjuros?.Divinos
            || !!clase?.Conjuros?.Alma;
    }

    private tieneLanzamientoPropio(clase: Clase | null | undefined): boolean {
        return this.usaConjurosDiariosParaNivelLanzador(clase)
            || !!clase?.Conjuros?.Psionicos;
    }

    private puedeAumentarLanzador(clase: Clase | null | undefined): boolean {
        return !!clase?.Aumenta_clase_lanzadora;
    }

    private detalleCuentaComoNivelLanzadorBase(clase: Clase | null | undefined, detalleNivel: ClaseNivelDetalle | null | undefined): boolean {
        if (!clase || !detalleNivel)
            return false;
        if (this.usaConjurosDiariosParaNivelLanzador(clase))
            return this.tieneAccesoRealConjurosDiarios(detalleNivel);
        if (!!clase?.Conjuros?.Psionicos)
            return toInt(detalleNivel?.Nivel_max_poder_accesible_nivel_lanzadorPsionico) >= 0;
        return false;
    }

    private requierePrimerEscalonLanzadorEnNivelUno(clase: Clase | null | undefined): boolean {
        if (!this.tieneLanzamientoPropio(clase))
            return false;
        return (clase?.Conjuros?.Listado ?? []).some((ref) => Math.max(0, toNumber(ref?.Nivel)) === 0);
    }

    private obtenerNivelesClaseQueAumentanNivelLanzador(clase: Clase | null | undefined): number[] {
        if (!this.tieneLanzamientoPropio(clase))
            return [];
        return (clase?.Desglose_niveles ?? [])
            .filter((detalle) => this.detalleCuentaComoNivelLanzadorBase(clase, detalle))
            .map((detalle) => Math.max(1, toInt(detalle?.Nivel)))
            .filter((nivel, index, lista) => nivel > 0 && lista.indexOf(nivel) === index)
            .sort((a, b) => a - b);
    }

    private obtenerNivelLanzadorBaseClase(nombreClase: string, nivelClaseMaximo?: number): number {
        const clase = this.obtenerClaseCatalogoPorNombre(nombreClase);
        if (!this.tieneLanzamientoPropio(clase))
            return 0;
        const nivelLimite = nivelClaseMaximo === undefined
            ? this.obtenerNivelActualClase(nombreClase)
            : Math.max(0, toInt(nivelClaseMaximo));
        if (nivelLimite < 1)
            return 0;
        return this.obtenerNivelesClaseQueAumentanNivelLanzador(clase)
            .filter((nivelClase) => nivelClase <= nivelLimite)
            .length;
    }

    private obtenerDetallePorNivelLanzadorClase(clase: Clase | null | undefined, nivelLanzador: number): ClaseNivelDetalle | null {
        const nivelObjetivo = Math.max(0, toInt(nivelLanzador));
        if (!clase || nivelObjetivo < 1)
            return null;
        const hitos = this.obtenerNivelesClaseQueAumentanNivelLanzador(clase);
        const nivelClase = hitos[nivelObjetivo - 1];
        if (!Number.isFinite(nivelClase) || nivelClase < 1)
            return null;
        return this.obtenerDetalleNivelClase(clase, nivelClase);
    }

    private actualizarDesgloseClase(clase: Clase, nivel: number): void {
        const nombre = `${clase?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const nombreNorm = normalizarTexto(nombre);
        const nivelNormalizado = Math.max(1, toInt(nivel));
        // La característica de la CD de sus conjuros, como la da la API en la ficha guardada (`clases[]`).
        const caracteristicaLanzamiento = tieneTextoVisible(clase?.Mod_salv_conjuros) ? `${clase.Mod_salv_conjuros}`.trim() : null;
        const desglose = [...(this.personajeCreacion.desgloseClases ?? [])];
        const index = desglose.findIndex((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);

        if (index >= 0) {
            desglose[index] = {
                Nombre: desglose[index].Nombre,
                Nivel: nivelNormalizado,
                Caracteristica_lanzamiento: caracteristicaLanzamiento,
            };
        } else {
            desglose.push({
                Nombre: nombre,
                Nivel: nivelNormalizado,
                Caracteristica_lanzamiento: caracteristicaLanzamiento,
            });
        }

        this.personajeCreacion.desgloseClases = desglose;
        this.regenerarTextoClasesDesdeDesglose();
    }

    private regenerarTextoClasesDesdeDesglose(): void {
        this.personajeCreacion.Clases = resumenClases(this.personajeCreacion.desgloseClases);
    }

    private aplicarDeltaAtaqueBaseClase(
        nombreClase: string,
        nivel: number,
        detalleSiguiente: ClaseNivelDetalle,
        detalleAnterior: ClaseNivelDetalle | null
    ): void {
        const ataqueSiguiente = primerEntero(detalleSiguiente?.Ataque_base) ?? 0;
        const ataqueAnterior = detalleAnterior
            ? (primerEntero(detalleAnterior?.Ataque_base) ?? 0)
            : 0;
        const delta = ataqueSiguiente - ataqueAnterior;
        if (delta === 0)
            return;

        const ataqueActual = primerEntero(this.personajeCreacion.Ataque_base) ?? 0;
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
            const siguiente = primerEntero(detalleSiguiente?.Salvaciones?.[campo]) ?? 0;
            const previo = detalleAnterior
                ? (primerEntero(detalleAnterior?.Salvaciones?.[campo]) ?? 0)
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
            .sort(porNombre);
    }

    private getNuevoIdHabilidad(): number {
        return (this.personajeCreacion.Habilidades ?? [])
            .reduce((maximo, habilidad) => Math.max(maximo, toNumber(habilidad?.Id)), 0) + 1;
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
            const valor = toInt(candidato);
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
                .map((dominio) => normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        return fuente
            .filter((dominio) => toNumber(dominio?.Id) > 0 && `${dominio?.Nombre ?? ''}`.trim().length > 0)
            .filter((dominio) => !excluirHomebrew || dominio?.Oficial !== false)
            .filter((dominio) => !dominiosActuales.has(normalizarTexto(dominio?.Nombre ?? '')))
            .map((dominio) => ({
                id: toNumber(dominio.Id),
                nombre: `${dominio.Nombre ?? ''}`.trim(),
                oficial: dominio.Oficial !== false,
            }))
            .sort((a, b) => compararTexto(a.nombre, b.nombre));
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
            const id = toInt(value);
            if (id > 0)
                return candidatas.find((opcion) => opcion.id === id) ?? null;
            const nombreNorm = normalizarTexto(`${value ?? ''}`);
            if (nombreNorm.length < 1)
                return null;
            return candidatas.find((opcion) => normalizarTexto(opcion.nombre) === nombreNorm) ?? null;
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
                .map((dominio) => normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );

        dominios.forEach((dominio) => {
            const nombre = `${dominio?.nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const nombreNorm = normalizarTexto(nombre);
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
        const deidadNorm = normalizarTexto(this.personajeCreacion.Deidad ?? '');
        if (deidadNorm.length < 1 || deidadNorm === normalizarTexto('No tener deidad'))
            return null;
        return this.catalogoDeidades.find((deidad) => normalizarTexto(deidad?.Nombre ?? '') === deidadNorm) ?? null;
    }

    private agregarIdiomaABaseVentajas(idioma: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
        Origen?: string;
    }): void {
        const nombreNorm = normalizarTexto(idioma?.Nombre ?? '');
        if (nombreNorm.length < 1)
            return;
        if (this.estadoFlujo.ventajas.baseIdiomas
            .some((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm)) {
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
            const grupoOpcional = Math.max(0, toInt(doteNivel?.Opcional));
            opciones.push({
                tipo: 'dote',
                clave: `dote:${contador++}`,
                grupoOpcional,
                nombre,
                descripcion: `${doteNivel?.Dote?.Descripcion ?? ''}`.trim(),
                extra: `${doteNivel?.Extra ?? ''}`.trim(),
                idInterno: toNumber(doteNivel?.Id_interno),
                idEspecialRequerido: toNumber(doteNivel?.Id_especial_requerido),
                idDoteRequerida: toNumber(doteNivel?.Id_dote_requerida),
                doteNivel,
                especialNivel: null,
            });
        });

        (detalleNivel?.Especiales ?? []).forEach((especialNivel) => {
            const nombre = `${(especialNivel?.Especial as Record<string, any>)?.['Nombre'] ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const grupoOpcional = Math.max(0, toInt(especialNivel?.Opcional));
            opciones.push({
                tipo: 'especial',
                clave: `especial:${contador++}`,
                grupoOpcional,
                nombre,
                descripcion: `${(especialNivel?.Especial as Record<string, any>)?.['Descripcion'] ?? ''}`.trim(),
                extra: `${especialNivel?.Extra ?? ''}`.trim(),
                idInterno: toNumber(especialNivel?.Id_interno),
                idEspecialRequerido: toNumber(especialNivel?.Id_especial_requerido),
                idDoteRequerida: toNumber(especialNivel?.Id_dote_requerida),
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
        const id = toInt(idInterno);
        if (id > 0)
            this.idsDotesInternosActivos.add(id);
    }

    private registrarIdInternoEspecial(idInterno: number): void {
        const id = toInt(idInterno);
        if (id > 0)
            this.idsEspecialesInternosActivos.add(id);
    }

    private aplicarDotesNivelClase(clase: Clase, nivel: number, dotesNivel: ClaseDoteNivel[]): void {
        const origen = `${clase.Nombre} nivel ${nivel}`;
        dotesNivel.forEach((doteNivel) => {
            const nombre = `${doteNivel?.Dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;

            const idExtra = toNumber(doteNivel?.Id_extra);
            const extra = `${doteNivel?.Extra ?? ''}`.trim() || 'No aplica';
            const agregado = this.agregarDoteAlPersonaje(doteNivel.Dote, origen, idExtra, extra);
            if (agregado)
                this.aplicarModificadoresDote(doteNivel.Dote, origen, idExtra, extra);

            this.registrarIdInternoDote(toNumber(doteNivel?.Id_interno));
        });
    }

    private aplicarEspecialesNivelClase(especialesNivel: ClaseEspecialNivel[]): void {
        especialesNivel.forEach((especialNivel) => {
            const nombre = `${(especialNivel?.Especial as Record<string, any>)?.['Nombre'] ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const extra = `${especialNivel?.Extra ?? ''}`.trim();
            const duplicado = (this.personajeCreacion.Claseas ?? []).some((especial) =>
                normalizarTexto(especial?.Nombre ?? '') === normalizarTexto(nombre)
                && normalizarTexto(especial?.Extra ?? '') === normalizarTexto(extra)
            );
            if (!duplicado) {
                const especialRaw = (especialNivel?.Especial as Record<string, any>) ?? {};
                const idEspecial = toNumber(especialRaw?.['Id'] ?? especialRaw?.['id']) || this.resolverIdEspecialPorNombre(nombre);
                this.personajeCreacion.Claseas.push({
                    Id: idEspecial > 0 ? idEspecial : undefined,
                    Id_extra: toNumber(especialNivel?.Id_extra),
                    Nombre: nombre,
                    Extra: extra,
                });
            }
            this.registrarIdInternoEspecial(toNumber(especialNivel?.Id_interno));
        });
    }

    /**
     * El id de una aptitud especial por su nombre, en las tablas de nivel del catálogo de clases. La API y la caché siempre
     * dan `Especial.Id`; esto es para una clase de una caché antigua que no lo traiga, para que la aptitud se guarde
     * (`colecciones.especiales` necesita el id). 0 si ninguna clase la conoce con id.
     */
    private resolverIdEspecialPorNombre(nombre: string): number {
        const buscado = normalizarTexto(nombre);
        for (const clase of this.catalogoClases ?? []) {
            for (const nivel of clase?.Desglose_niveles ?? []) {
                for (const especialNivel of nivel?.Especiales ?? []) {
                    const especial = (especialNivel?.Especial as Record<string, any>) ?? {};
                    const id = toNumber(especial?.['Id']);
                    if (id > 0 && normalizarTexto(especial?.['Nombre'] ?? '') === buscado)
                        return id;
                }
            }
        }
        return 0;
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
            const idSeleccion = toInt(valorSeleccionado);
            const nombreSeleccion = normalizarTexto(`${valorSeleccionado ?? ''}`);
            const opcion = opciones.find((item) => toNumber(item.idClase) === idSeleccion)
                ?? opciones.find((item) => normalizarTexto(item.nombreClase) === nombreSeleccion)
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
        const nombreClaseAplicada = normalizarTexto(claseAplicada?.Nombre ?? '');
        const previas = (this.personajeCreacion.desgloseClases ?? [])
            .filter((item) => toNumber(item?.Nivel) > 0)
            .filter((item) => normalizarTexto(item?.Nombre ?? '') !== nombreClaseAplicada)
            .map((item) => this.catalogoClases
                .find((clase) => normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(item?.Nombre ?? '')))
            .filter((item): item is Clase =>
                !!item
                && this.tieneLanzamientoPropio(item)
                && this.getNivelLanzadorEfectivoClase(item.Nombre) > 0
            );

        if (previas.length < 1)
            return [];

        const hintId = toNumber(aumento?.Id);
        const hintNombre = normalizarTexto(`${aumento?.Nombre ?? ''}`);
        let candidatas = [...previas];

        if (hintId > 0) {
            const porId = candidatas.filter((clase) => toNumber(clase?.Id) === hintId);
            if (porId.length > 0)
                candidatas = porId;
        } else if (hintNombre.length > 0) {
            const clasesPorNombre = candidatas.filter((clase) => normalizarTexto(clase?.Nombre ?? '') === hintNombre);
            if (clasesPorNombre.length > 0) {
                candidatas = clasesPorNombre;
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
                idClase: toNumber(clase?.Id),
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
            .sort((a, b) => compararTexto(a.nombreClase, b.nombreClase));
    }

    private validarContratoConjurosParaAplicacionNivelClase(
        claseAplicada: Clase,
        nivelAplicado: number,
        aumentosLanzador: ClaseAumentoLanzadorSeleccion[]
    ): string[] {
        const errores: string[] = [];
        const nivelReferencia = Math.max(1, toInt(nivelAplicado));

        if (this.tieneLanzamientoPropio(claseAplicada)) {
            const bonusActual = this.obtenerBonusNivelLanzadorClase(claseAplicada?.Nombre ?? '');
            const nivelPrevioBase = this.obtenerNivelLanzadorBaseClase(claseAplicada?.Nombre ?? '', nivelReferencia - 1);
            const nivelActualBase = this.obtenerNivelLanzadorBaseClase(claseAplicada?.Nombre ?? '', nivelReferencia);
            const nivelPrevio = Math.max(0, nivelPrevioBase + bonusActual);
            const nivelActual = Math.max(0, nivelActualBase + bonusActual);
            if (nivelActual > nivelPrevio) {
                const detalleActual = this.obtenerDetallePorNivelLanzadorClase(claseAplicada, nivelActual);
                if (!detalleActual) {
                    errores.push(`No existe desglose equivalente al nivel de lanzador ${nivelActual} para validar el contrato de conjuros de ${claseAplicada?.Nombre ?? 'clase desconocida'}.`);
                } else {
                    const detallePrevio = nivelPrevio > 0 ? this.obtenerDetallePorNivelLanzadorClase(claseAplicada, nivelPrevio) : null;
                    const acceso = this.resolverAccesoConjurosPorTipo(claseAplicada, detalleActual, detallePrevio);
                    errores.push(...acceso.errores);
                }
            } else if (nivelReferencia === 1 && this.requierePrimerEscalonLanzadorEnNivelUno(claseAplicada)) {
                const detalleActual = this.obtenerDetalleNivelClase(claseAplicada, 1);
                if (!detalleActual) {
                    errores.push(`No existe desglose de nivel 1 para validar el contrato de conjuros de ${claseAplicada?.Nombre ?? 'clase desconocida'}.`);
                } else {
                    const acceso = this.resolverAccesoConjurosPorTipo(claseAplicada, detalleActual, null);
                    errores.push(...acceso.errores);
                }
            }
        }

        (aumentosLanzador ?? []).forEach((seleccion) => {
            const idClase = toNumber(seleccion?.objetivo?.idClase);
            const nombreClase = `${seleccion?.objetivo?.nombreClase ?? ''}`.trim();
            const objetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(nombreClase))
            );
            if (!objetivo) {
                errores.push(`No se pudo resolver la clase objetivo del aumento de lanzador #${toNumber(seleccion?.indice)} para validar contrato de conjuros.`);
                return;
            }

            const nivelPrevio = this.getNivelLanzadorEfectivoClase(objetivo.Nombre);
            const nivelActual = nivelPrevio + 1;
            if (!this.tieneLanzamientoPropio(objetivo))
                return;

            const detalleActual = this.obtenerDetallePorNivelLanzadorClase(objetivo, nivelActual);
            if (!detalleActual) {
                errores.push(`No existe desglose equivalente al nivel de lanzador ${nivelActual} para validar el contrato de conjuros de ${objetivo?.Nombre ?? 'clase desconocida'}.`);
                return;
            }
            const detallePrevio = nivelPrevio > 0 ? this.obtenerDetallePorNivelLanzadorClase(objetivo, nivelPrevio) : null;
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
        const origenBase = `${claseAplicada?.Nombre ?? 'Clase'} nivel ${Math.max(1, toInt(nivelAplicado))}`;

        if (this.tieneLanzamientoPropio(claseAplicada)) {
            const bonusActual = this.obtenerBonusNivelLanzadorClase(claseAplicada?.Nombre ?? '');
            const nivelClaseActual = Math.max(1, toInt(nivelAplicado));
            const nivelPrevioBase = this.obtenerNivelLanzadorBaseClase(claseAplicada?.Nombre ?? '', nivelClaseActual - 1);
            const nivelActualBase = this.obtenerNivelLanzadorBaseClase(claseAplicada?.Nombre ?? '', nivelClaseActual);
            const nivelPrevio = Math.max(0, nivelPrevioBase + bonusActual);
            const nivelActual = Math.max(0, nivelActualBase + bonusActual);
            if (nivelActual > nivelPrevio) {
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
        }

        (aumentosLanzador ?? []).forEach((seleccion) => {
            const idClase = toNumber(seleccion?.objetivo?.idClase);
            const nombreClase = `${seleccion?.objetivo?.nombreClase ?? ''}`.trim();
            const objetivo = this.catalogoClases.find((clase) =>
                (idClase > 0 && toNumber(clase?.Id) === idClase)
                || (nombreClase.length > 0 && normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(nombreClase))
            );
            if (!objetivo) {
                avisos.push(`No se pudo resolver la clase objetivo del aumento de lanzador #${toNumber(seleccion?.indice)}.`);
                return;
            }
            if (!this.tieneLanzamientoPropio(objetivo))
                return;

            const nivelPrevio = this.getNivelLanzadorEfectivoClase(objetivo.Nombre);
            const nivelActual = nivelPrevio + 1;
            this.incrementarBonusNivelLanzadorClase(objetivo.Nombre, 1);
            this.registrarSeleccionProgresionLanzador(claseAplicada, nivelAplicado, seleccion, objetivo);
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
        const detalleActual = this.obtenerDetallePorNivelLanzadorClase(claseObjetivo, nivelLanzadorActual);
        const detallePrevio = nivelLanzadorPrevio > 0
            ? this.obtenerDetallePorNivelLanzadorClase(claseObjetivo, nivelLanzadorPrevio)
            : null;
        if (!detalleActual) {
            avisos.push(`No existe desglose equivalente al nivel de lanzador ${nivelLanzadorActual} para conjuros de ${claseObjetivo?.Nombre ?? 'clase desconocida'}.`);
            return { entrada: null, avisos };
        }

        if (this.requiereAccesoRealConjurosDiarios(claseObjetivo) && !this.tieneAccesoRealConjurosDiarios(detalleActual))
            return { entrada: null, avisos };

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
                toNumber(detalleActual?.Conjuros_conocidos_total)
                - toNumber(detallePrevio?.Conjuros_conocidos_total)
            )
            : 0;
        const usaConocidosTotal = !!claseObjetivo?.Conjuros?.Conocidos_total;
        const usaConocidosPorNivel = !!claseObjetivo?.Conjuros?.Conocidos_nivel_a_nivel;
        const cupoPorNivel = usaConocidosPorNivel
            ? this.calcularDeltaConocidosPorNivel(detalleActual, detallePrevio)
            : {};
        const totalPorNivel = Object.values(cupoPorNivel).reduce((acc, value) => acc + Math.max(0, toNumber(value)), 0);
        const requiereSeleccionManual = cupoTotal > 0 || totalPorNivel > 0;
        const tipoLanzamiento = this.resolverTipoLanzamientoClase(claseObjetivo);
        const almaPendiente = tipoLanzamiento === 'alma';
        if (almaPendiente) {
            avisos.push(`La selección manual para conjuros de alma de ${claseObjetivo.Nombre} queda pendiente para una fase posterior.`);
        }

        const autoadicion = !usaConocidosTotal && !usaConocidosPorNivel && !almaPendiente;
        const sinElegibles = elegibles.conjuros.length < 1;
        const idsAutoadicionados = autoadicion
            ? elegibles.conjuros
                .filter((conjuro) => {
                    const id = toNumber(conjuro?.Id);
                    if (id <= 0)
                        return false;
                    const nivelConjuro = toNumber(elegibles.nivelesPorConjuro[id]);
                    return elegibles.acceso.nivelesRecienDesbloqueados.has(nivelConjuro);
                })
                .map((conjuro) => toNumber(conjuro?.Id))
                .filter((id) => id > 0)
            : [];
        const autoadicionActiva = autoadicion && !sinElegibles && idsAutoadicionados.length > 0;

        const entrada: ConjurosSesionStateEntrada = {
            id: `${normalizarTexto(claseObjetivo.Nombre)}:${origen}:${nivelLanzadorActual}`,
            origen: `${origen ?? ''}`.trim() || `${claseObjetivo.Nombre} nivel ${nivelLanzadorActual}`,
            claseObjetivo: {
                id: toNumber(claseObjetivo?.Id),
                nombre: `${claseObjetivo?.Nombre ?? ''}`.trim(),
            },
            tipoLanzamiento,
            nivelLanzadorPrevio: Math.max(0, toNumber(nivelLanzadorPrevio)),
            nivelLanzadorActual: Math.max(0, toNumber(nivelLanzadorActual)),
            nivelMaxPoderAccesiblePsionico: Math.max(-1, toNumber(elegibles.acceso.nivelMaxPoderAccesiblePsionico)),
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
            elegiblesIds: elegibles.conjuros.map((conjuro) => toNumber(conjuro?.Id)).filter((id) => id > 0),
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
            ...Object.keys(actual).map((key) => toNumber(key)),
            ...Object.keys(previo).map((key) => toNumber(key)),
        ]);
        const delta: Record<number, number> = {};
        niveles.forEach((nivel) => {
            if (!Number.isFinite(nivel) || nivel < 0)
                return;
            const valor = Math.max(0, toNumber(actual[nivel]) - toNumber(previo[nivel]));
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
            .map((nivel) => toNumber(nivel))
            .filter((nivel) => Number.isFinite(nivel) && nivel >= 0)
            .forEach((nivel) => {
                if (toNumber(mapaDiarios[nivel]) >= 0)
                    resultado.add(nivel);
            });
        return resultado;
    }

    private construirNivelesAccesiblesHastaNivelMax(nivelMax: number): Set<number> {
        const resultado = new Set<number>();
        const limite = Math.max(-1, toInt(nivelMax));
        if (limite < 0)
            return resultado;
        for (let nivel = 0; nivel <= limite; nivel++) {
            resultado.add(nivel);
        }
        return resultado;
    }

    private requiereAccesoRealConjurosDiarios(clase: Clase | null | undefined): boolean {
        return this.usaConjurosDiariosParaNivelLanzador(clase);
    }

    private tieneAccesoRealConjurosDiarios(detalleNivel: ClaseNivelDetalle | null | undefined): boolean {
        const diarios = this.normalizarMapaConjurosDiarios(detalleNivel?.Conjuros_diarios);
        return Object.values(diarios).some((valor) => toNumber(valor) >= 0);
    }

    private resolverAccesoConjurosPorTipo(
        claseObjetivo: Clase,
        detalleActual: ClaseNivelDetalle,
        detallePrevio: ClaseNivelDetalle | null
    ): ConjurosAccesoNivelesInfo {
        const requiereArcano = !!claseObjetivo?.Conjuros?.Arcanos;
        const requiereDivino = !!claseObjetivo?.Conjuros?.Divinos;
        const requierePsionico = !!claseObjetivo?.Conjuros?.Psionicos;
        const requiereAlma = !!claseObjetivo?.Conjuros?.Alma;
        const usaConjurosDiarios = requiereArcano || requiereDivino || requiereAlma;
        const errores: string[] = [];

        const diariosActual = this.normalizarMapaConjurosDiarios(detalleActual?.Conjuros_diarios);
        const diariosPrevio = this.normalizarMapaConjurosDiarios(detallePrevio?.Conjuros_diarios);
        const diariosInformados = Object.keys(diariosActual).length > 0;
        const diariosInformadosPrevio = Object.keys(diariosPrevio).length > 0;

        const nivelMaxPoderPsionico = Math.max(
            -1,
            toInt(detalleActual?.Nivel_max_poder_accesible_nivel_lanzadorPsionico)
        );
        const nivelMaxPoderPsionicoPrevio = detallePrevio
            ? Math.max(-1, toInt(detallePrevio?.Nivel_max_poder_accesible_nivel_lanzadorPsionico))
            : -1;

        if (usaConjurosDiarios && requierePsionico) {
            errores.push(`Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: no se admite mezcla con conjuros diarios y psiónica.`);
            return {
                nivelesAccesibles: null,
                nivelesRecienDesbloqueados: new Set<number>(),
                nivelMaxPoderAccesiblePsionico: nivelMaxPoderPsionico,
                errores,
            };
        }

        if (usaConjurosDiarios) {
            if (!diariosInformados) {
                const tipoContrato = requiereAlma && !requiereArcano && !requiereDivino
                    ? 'lanzador de alma'
                    : 'lanzador arcano/divino';
                errores.push(`Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: ${tipoContrato} sin Conjuros_diarios.`);
            }
            if (nivelMaxPoderPsionico >= 0) {
                errores.push(
                    `Contrato de conjuros inválido en ${claseObjetivo?.Nombre ?? 'clase desconocida'}: nivel_max_poder_accesible_nivel_lanzadorPsionico no debe informarse en lanzadores arcanos/divinos ni en clases que usan Conjuros_diarios.`
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
        detallePrevio: ClaseNivelDetalle | null = null,
        incluirConjurosYaConocidos = false
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
                .map((dominio) => normalizarTexto(dominio?.Nombre ?? ''))
                .filter((nombre) => nombre.length > 0)
        );
        const escuelasProhibidas = new Set(
            (this.personajeCreacion?.Escuelas_prohibidas ?? [])
                .map((escuela) => normalizarTexto(this.extraerNombreEscuelaProhibida(escuela)))
                .filter((nombre) => nombre.length > 0)
        );
        const disciplinaProhibida = normalizarTexto(this.personajeCreacion?.Disciplina_prohibida ?? '');

        const puedeAgregar = (conjuro: Conjuro, nivelConjuro: number): boolean => {
            const id = toNumber(conjuro?.Id);
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
            const escuela = normalizarTexto(conjuro?.Escuela?.Nombre ?? '');
            if (escuela.length > 0 && escuelasProhibidas.has(escuela))
                return false;
            const disciplina = normalizarTexto(conjuro?.Disciplina?.Nombre ?? '');
            if (disciplinaProhibida.length > 0 && disciplina === disciplinaProhibida)
                return false;
            if (!incluirConjurosYaConocidos && this.esConjuroYaConocidoPorClase(claseObjetivo?.Nombre ?? '', id))
                return false;
            return true;
        };

        this.catalogoConjuros.forEach((conjuro) => {
            const nivelConjuro = this.resolverNivelConjuroParaClase(claseObjetivo, conjuro, dominiosSeleccionados);
            if (nivelConjuro === null)
                return;
            if (!puedeAgregar(conjuro, nivelConjuro))
                return;
            const id = toNumber(conjuro?.Id);
            usados.add(id);
            nivelesPorConjuro[id] = nivelConjuro;
            resultado.push(conjuro);
        });

        (claseObjetivo?.Conjuros?.Listado ?? []).forEach((ref) => {
            const id = toNumber(ref?.Id);
            const nivel = toNumber(ref?.Nivel);
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

        return { conjuros: resultado, nivelesPorConjuro, avisos, acceso };
    }

    private resolverNivelConjuroParaClase(
        claseObjetivo: Clase,
        conjuro: Conjuro,
        dominiosSeleccionados: Set<string>
    ): number | null {
        const nombreClaseNorm = normalizarTexto(claseObjetivo?.Nombre ?? '');
        const idClase = toNumber(claseObjetivo?.Id);
        const nivelesClase = Array.isArray(conjuro?.Nivel_clase)
            ? conjuro.Nivel_clase
            : (conjuro?.Nivel_clase && typeof conjuro.Nivel_clase === 'object'
                ? Object.values(conjuro.Nivel_clase as any)
                : []);
        const nivelClase = nivelesClase
            .map((nivel) => ({
                id: toNumber((nivel as Record<string, any>)?.['Id_clase'] ?? (nivel as Record<string, any>)?.['id_clase']),
                nombre: normalizarTexto((nivel as Record<string, any>)?.['Clase'] ?? (nivel as Record<string, any>)?.['clase'] ?? ''),
                nivel: toNumber((nivel as Record<string, any>)?.['Nivel'] ?? (nivel as Record<string, any>)?.['nivel']),
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
                    dominio: normalizarTexto((nivel as Record<string, any>)?.['Dominio'] ?? (nivel as Record<string, any>)?.['dominio'] ?? ''),
                    nivel: toNumber((nivel as Record<string, any>)?.['Nivel'] ?? (nivel as Record<string, any>)?.['nivel']),
                }))
                .filter((item) => item.dominio.length > 0 && dominiosSeleccionados.has(item.dominio) && item.nivel >= 0)
                .sort((a, b) => a.nivel - b.nivel);
            if (compatibles.length > 0)
                return compatibles[0].nivel;
        }

        const refListado = (claseObjetivo?.Conjuros?.Listado ?? [])
            .find((ref) => toNumber(ref?.Id) === toNumber(conjuro?.Id));
        if (refListado)
            return toNumber(refListado?.Nivel);

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
        const alineamiento = normalizarTexto(this.personajeCreacion?.Alineamiento ?? '');
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
        ).map((item) => normalizarTexto((item as Record<string, any>)?.['Nombre'] ?? (item as Record<string, any>)?.['nombre'] ?? `${item ?? ''}`));

        return descriptores.some((descriptor) => opuestos.has(descriptor));
    }

    private obtenerCatalogoEscuelasEspecializables(escuelasCatalogo: EscuelaConjuros[]): EscuelaConjuros[] {
        const usadas = new Set<number>();
        return (escuelasCatalogo ?? [])
            .filter((escuela) => toNumber(escuela?.Id) > 0)
            .filter((escuela) => {
                const id = toNumber(escuela?.Id);
                if (usadas.has(id))
                    return false;
                usadas.add(id);
                return true;
            })
            .sort(porNombre);
    }

    private obtenerCatalogoEscuelasProhibibles(escuelasCatalogo: EscuelaConjuros[], idEspecialista: number): EscuelaConjuros[] {
        const idEspecialistaNum = toNumber(idEspecialista);
        return this.obtenerCatalogoEscuelasEspecializables(escuelasCatalogo)
            .filter((escuela) => toNumber(escuela?.Id) !== idEspecialistaNum)
            .filter((escuela) => toBoolean(escuela?.Prohibible))
            .filter((escuela) => !this.esNombreAdivinacion(`${escuela?.Nombre ?? ''}`));
    }

    private obtenerCatalogoDisciplinasEspecializables(disciplinasCatalogo: DisciplinaConjuros[]): DisciplinaConjuros[] {
        const usadas = new Set<number>();
        return (disciplinasCatalogo ?? [])
            .filter((disciplina) => toNumber(disciplina?.Id) > 0)
            .filter((disciplina) => {
                const id = toNumber(disciplina?.Id);
                if (usadas.has(id))
                    return false;
                usadas.add(id);
                return true;
            })
            .sort(porNombre);
    }

    private esNombreAdivinacion(value: string): boolean {
        return normalizarTexto(value ?? '') === 'adivinacion';
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
        const nivelBase = this.obtenerNivelLanzadorBaseClase(nombreClase);
        const bonus = this.obtenerBonusNivelLanzadorClase(nombreClase);
        return Math.max(0, nivelBase + bonus);
    }

    private obtenerBonusNivelLanzadorClase(nombreClase: string): number {
        const key = normalizarTexto(nombreClase);
        if (key.length < 1)
            return 0;
        return Math.max(0, toNumber(this.bonusNivelLanzadorPorClase[key]));
    }

    private incrementarBonusNivelLanzadorClase(nombreClase: string, delta: number): void {
        const key = normalizarTexto(nombreClase);
        if (key.length < 1)
            return;
        const actual = this.obtenerBonusNivelLanzadorClase(nombreClase);
        this.bonusNivelLanzadorPorClase[key] = Math.max(0, actual + Math.max(0, toInt(delta)));
    }

    private registrarSeleccionProgresionLanzador(
        claseAplicada: Clase,
        nivelAplicado: number,
        seleccion: ClaseAumentoLanzadorSeleccion,
        claseObjetivo: Clase
    ): void {
        const entrada: PersonajeProgresionLanzadorSeleccionDto = {
            idClaseAplicada: toInt(claseAplicada?.Id),
            nivelClaseAplicado: toInt(nivelAplicado),
            indiceAumento: toInt(seleccion?.indice),
            idClaseObjetivo: toInt(claseObjetivo?.Id),
        };
        if (
            entrada.idClaseAplicada <= 0
            || entrada.nivelClaseAplicado <= 0
            || entrada.indiceAumento <= 0
            || entrada.idClaseObjetivo <= 0
        ) {
            return;
        }

        const existente = this.progresionLanzadorSelecciones.findIndex((item) =>
            item.idClaseAplicada === entrada.idClaseAplicada
            && item.nivelClaseAplicado === entrada.nivelClaseAplicado
            && item.indiceAumento === entrada.indiceAumento
        );
        if (existente >= 0) {
            this.progresionLanzadorSelecciones[existente] = entrada;
            return;
        }
        this.progresionLanzadorSelecciones.push(entrada);
    }

    private getEntradaConjurosActiva(): ConjurosSesionStateEntrada | null {
        if (!this.estadoFlujo.conjuros.activa)
            return null;
        const preferida = this.estadoFlujo.conjuros.entradas.findIndex((entrada) => {
            if (!entrada.seleccionManual || entrada.almaPendiente || entrada.sinElegibles)
                return false;
            if (toNumber(entrada.cupoPendiente?.total) > 0)
                return true;
            const pendientePorNivel = Object.values(entrada.cupoPendiente?.porNivel ?? {})
                .reduce((acc, value) => acc + Math.max(0, toNumber(value)), 0);
            return pendientePorNivel > 0;
        });
        if (preferida >= 0) {
            this.estadoFlujo.conjuros.indiceEntradaActual = preferida;
            return this.estadoFlujo.conjuros.entradas[preferida];
        }
        const indice = Math.max(0, toInt(this.estadoFlujo.conjuros.indiceEntradaActual));
        return this.estadoFlujo.conjuros.entradas[indice] ?? this.estadoFlujo.conjuros.entradas[0] ?? null;
    }

    private obtenerConjurosElegiblesParaEntrada(entrada: ConjurosSesionStateEntrada): Conjuro[] {
        return (entrada?.elegiblesIds ?? [])
            .map((id) => this.obtenerConjuroCatalogoPorId(id))
            .filter((conjuro): conjuro is Conjuro => !!conjuro);
    }

    private resolverNivelConjuroEntrada(entrada: ConjurosSesionStateEntrada, conjuro: Conjuro): number {
        const nivel = toNumber(entrada?.nivelesPorConjuro?.[toNumber(conjuro?.Id)]);
        return Math.max(0, nivel);
    }

    private obtenerConjuroCatalogoPorId(idConjuro: number): Conjuro | null {
        const id = toInt(idConjuro);
        if (id <= 0)
            return null;
        if (this.conjurosSesionPlaceholderPorId[id])
            return this.conjurosSesionPlaceholderPorId[id];
        return this.catalogoConjuros.find((conjuro) => toNumber(conjuro?.Id) === id)
            ?? this.personajeCreacion.Conjuros.find((conjuro) => toNumber(conjuro?.Id) === id)
            ?? null;
    }

    private agregarConjuroSesionAPersonaje(entrada: ConjurosSesionStateEntrada, conjuroBase: Conjuro): void {
        const id = toNumber(conjuroBase?.Id);
        const nombreClase = `${entrada?.claseObjetivo?.nombre ?? ''}`.trim();
        if (id <= 0 || nombreClase.length < 1)
            return;
        if (this.esConjuroYaConocidoPorClase(nombreClase, id))
            return;

        const nivelClase = toNumber(entrada?.nivelesPorConjuro?.[id]);
        const conjuro: Conjuro = JSON.parse(JSON.stringify(conjuroBase));
        const conjuroRaw = conjuro as Record<string, any>;
        conjuroRaw['Origen'] = `${entrada?.origen ?? ''}`.trim();
        conjuroRaw['Clase_origen'] = nombreClase;
        conjuroRaw['Origen_clase'] = nombreClase;

        const idClase = toNumber(entrada?.claseObjetivo?.id);
        const nivelesClase = Array.isArray(conjuro.Nivel_clase)
            ? [...conjuro.Nivel_clase]
            : (conjuro.Nivel_clase && typeof conjuro.Nivel_clase === 'object' ? Object.values(conjuro.Nivel_clase as any) : []);
        const yaTieneNivelClase = nivelesClase.some((nivel) =>
            toNumber((nivel as Record<string, any>)?.['Id_clase']) === idClase
            || normalizarTexto((nivel as Record<string, any>)?.['Clase'] ?? '') === normalizarTexto(nombreClase)
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
            const objetivoActual = Math.max(0, toNumber(detalleSiguiente?.Conjuros_conocidos_total));
            const objetivoAnterior = detalleAnterior
                ? Math.max(0, toNumber(detalleAnterior?.Conjuros_conocidos_total))
                : 0;
            const delta = objetivoActual - objetivoAnterior;
            if (delta <= 0)
                return;

            const candidatos = refsDisponibles
                .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, toNumber(ref?.Id)));
            candidatos.slice(0, delta).forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
            return;
        }

        if (clase?.Conjuros?.Conocidos_nivel_a_nivel) {
            const actuales = this.normalizarMapaConjurosPorNivel(detalleSiguiente?.Conjuros_conocidos_nivel_a_nivel);
            const previos = this.normalizarMapaConjurosPorNivel(detalleAnterior?.Conjuros_conocidos_nivel_a_nivel);
            Object.keys(actuales)
                .map((key) => toNumber(key))
                .filter((nivelConjuro) => Number.isFinite(nivelConjuro) && nivelConjuro >= 0)
                .sort((a, b) => a - b)
                .forEach((nivelConjuro) => {
                    const actual = toNumber(actuales[nivelConjuro]);
                    const previo = toNumber(previos[nivelConjuro]);
                    const delta = actual - previo;
                    if (delta <= 0)
                        return;

                    const candidatosNivel = refsDisponibles
                        .filter((ref) => toNumber(ref?.Nivel) === nivelConjuro)
                        .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, toNumber(ref?.Id)));
                    candidatosNivel.slice(0, delta).forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
                });
            return;
        }

        refsDisponibles
            .filter((ref) => !this.esConjuroYaConocidoPorClase(clase.Nombre, toNumber(ref?.Id)))
            .forEach((ref) => this.agregarConjuroConocidoClase(clase, ref, nivel));
    }

    private obtenerConjurosDisponiblesNivelClase(clase: Clase, detalleNivel: ClaseNivelDetalle): ClaseConjuroRef[] {
        const acceso = this.resolverAccesoConjurosPorTipo(clase, detalleNivel, null);
        if (acceso.errores.length > 0)
            return [];
        return (clase?.Conjuros?.Listado ?? [])
            .filter((ref) => toNumber(ref?.Id) > 0 && `${ref?.Nombre ?? ''}`.trim().length > 0)
            .filter((ref) => !acceso.nivelesAccesibles || acceso.nivelesAccesibles.has(toNumber(ref?.Nivel)))
            .sort((a, b) => toNumber(a?.Nivel) - toNumber(b?.Nivel)
                || compararTexto(a?.Nombre, b?.Nombre));
    }

    private normalizarMapaConjurosPorNivel(mapa: Record<string, number> | undefined | null): Record<number, number> {
        const resultado: Record<number, number> = {};
        if (!mapa)
            return resultado;

        Object.keys(mapa).forEach((key) => {
            const nivel = this.parseNivelConjuroKey(key);
            if (!Number.isFinite(nivel) || nivel < 0)
                return;
            resultado[nivel] = Math.max(0, toNumber((mapa as Record<string, any>)[key]));
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
        const id = toInt(idConjuro);
        if (id <= 0)
            return false;

        const claseNorm = normalizarTexto(nombreClase);
        return (this.personajeCreacion.Conjuros ?? []).some((conjuro) => {
            if (toNumber(conjuro?.Id) !== id)
                return false;
            const origenClase = normalizarTexto(
                `${(conjuro as Record<string, any>)?.['Clase_origen'] ?? (conjuro as Record<string, any>)?.['Origen_clase'] ?? ''}`
            );
            if (origenClase.length < 1)
                return true;
            return origenClase === claseNorm;
        });
    }

    private agregarConjuroConocidoClase(clase: Clase, ref: ClaseConjuroRef, nivelClase: number): void {
        const idConjuro = toInt(ref?.Id);
        if (idConjuro <= 0 || this.esConjuroYaConocidoPorClase(clase.Nombre, idConjuro))
            return;

        const conjuro = this.crearConjuroPlaceholderDesdeClase(clase, ref, nivelClase);
        this.personajeCreacion.Conjuros.push(conjuro);
    }

    private crearConjuroPlaceholderDesdeClase(clase: Clase, ref: ClaseConjuroRef, nivelClase: number): Conjuro {
        const nombreClase = `${clase?.Nombre ?? ''}`.trim();
        const nombre = `${ref?.Nombre ?? ''}`.trim();
        const nivelConjuro = Math.max(0, toInt(ref?.Nivel));
        const base: Conjuro = {
            Id: toInt(ref?.Id),
            Nombre: nombre.length > 0 ? nombre : `Conjuro ${toNumber(ref?.Id)}`,
            Descripcion: '',
            Tiempo_lanzamiento: '',
            Alcance: '',
            Escuela: {
                Id: 0,
                Nombre: '',
                Nombre_especial: '',
                Prohibible: false,
            },
            Disciplina: {
                Id: 0,
                Nombre: '',
                Nombre_especial: '',
                Subdisciplinas: [],
            },
            Manual: `${clase?.Manual?.Nombre ?? ''}`.trim(),
            Objetivo: '',
            Efecto: '',
            Area: '',
            Arcano: !!clase?.Conjuros?.Arcanos,
            Divino: !!clase?.Conjuros?.Divinos,
            Psionico: !!clase?.Conjuros?.Psionicos,
            Alma: !!clase?.Conjuros?.Alma,
            Duracion: '',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{
                Id_clase: toNumber(clase?.Id),
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
        const nombreNorm = normalizarTexto(nombreIdioma);
        if (nombreNorm.length < 1)
            return null;
        const idioma = (this.estadoFlujo.ventajas.catalogoIdiomas ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = toNumber(idioma?.Id);
        return id > 0 ? id : null;
    }

    private resolverIdDominioPorNombre(nombreDominio: string): number | null {
        const nombreNorm = normalizarTexto(nombreDominio);
        if (nombreNorm.length < 1)
            return null;
        const dominio = (this.catalogoDominios ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = toNumber(dominio?.Id);
        return id > 0 ? id : null;
    }

    private resolverIdRegionPorNombre(nombreRegion: string): number | null {
        const nombreNorm = normalizarTexto(nombreRegion);
        if (nombreNorm.length < 1)
            return null;
        const region = (this.catalogoRegiones ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm);
        const id = toNumber(region?.Id);
        return id > 0 ? id : null;
    }

    private resolverNombreRegionPorId(idRegion: number): string {
        const id = toNumber(idRegion);
        if (id <= 0)
            return '';
        const region = (this.catalogoRegiones ?? [])
            .find((item) => toNumber(item?.Id) === id);
        return `${region?.Nombre ?? ''}`.trim();
    }

    private calcularAtaqueBaseDesdeClases(): number {
        return (this.personajeCreacion?.desgloseClases ?? []).reduce((acumulado, claseDesglose) => {
            const nombre = `${claseDesglose?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return acumulado;
            const nivel = toNumber(claseDesglose?.Nivel);
            if (nivel <= 0)
                return acumulado;

            const claseCatalogo = this.catalogoClases
                .find((clase) => normalizarTexto(clase?.Nombre ?? '') === normalizarTexto(nombre));
            if (!claseCatalogo)
                return acumulado;

            const detalleNivel = this.obtenerDetalleNivelClase(claseCatalogo, nivel);
            if (!detalleNivel)
                return acumulado;

            return acumulado + (primerEntero(detalleNivel?.Ataque_base) ?? 0);
        }, 0);
    }

    private recalcularNepExperienciaOro(plantillasSeleccionadas?: Plantilla[]): void {
        const raza = this.razaSeleccionada;
        const seleccionadas = plantillasSeleccionadas ?? this.estadoFlujo.plantillas.seleccionadas;
        const ajusteRaza = toNumber(raza?.Ajuste_nivel);
        const ajustePlantillas = (seleccionadas ?? [])
            .reduce((acc, plantilla) => acc + toNumber(plantilla?.Ajuste_nivel), 0);
        const nivelClases = this.getNivelClasesActual();
        const dgsRaza = toNumber(raza?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(seleccionadas);
        const nivelEfectivo = nivelClases + ajusteRaza + ajustePlantillas + dgsRaza + dgsPlantillas;

        this.personajeCreacion.NEP = nivelEfectivo;
        this.personajeCreacion.Experiencia = experienciaParaNivel(nivelClases + ajusteRaza + ajustePlantillas);
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

    /** Si una raza o una plantilla da una RD o una resistencia. Sin dato, la API da `null` (antes, «No especifica»…). */
    private esTextoReglaValido(valor: string): boolean {
        return normalizarTexto(valor).length > 0;
    }

    private resolverDadoGolpeTipoActual(): number {
        const tipoActual = this.personajeCreacion.Tipo_criatura;
        const dadoPorTipo = toNumber(tipoActual?.Tipo_dado);
        if (dadoPorTipo > 0)
            return dadoPorTipo;

        const idTipo = toNumber(tipoActual?.Id_tipo_dado);
        if (idTipo <= 0)
            return 0;

        const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipo - 1));
        return DADOS_PROGRESION[idx];
    }

    private resolverDadoDesdePlantilla(plantilla: Plantilla): number {
        const dadoPorNombre = `${plantilla?.Tipo_dado?.Nombre ?? ''}`.match(/d\s*(\d+)/i);
        if (dadoPorNombre && dadoPorNombre[1]) {
            const dado = toNumber(dadoPorNombre[1]);
            if (DADOS_PROGRESION.includes(dado))
                return dado;
        }

        const idTipoDado = toNumber(plantilla?.Tipo_dado?.Id_tipo_dado);
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

    private recalcularCapacidadCarga(): void {
        const fuerza = Math.max(0, toInt(this.personajeCreacion?.Fuerza));
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
        const valorFuerza = Math.max(0, toInt(fuerza));
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
        const modPresa = toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador_presa);
        if (Object.prototype.hasOwnProperty.call(CARGA_MULTIPLICADOR_BIPEDO_POR_MOD_PRESA, modPresa))
            return CARGA_MULTIPLICADOR_BIPEDO_POR_MOD_PRESA[modPresa];

        const nombreTamano = normalizarTexto(this.personajeCreacion?.Raza?.Tamano?.Nombre ?? '');
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
            const valor = toNumber((plantilla?.Minimos_caracteristicas as Record<string, any>)?.[key]);
            if (valor <= 0)
                return maximo;
            return Math.max(maximo, valor);
        }, 0);
    }

    private recalcularDefensasYPresa(): void {
        const modTamanoCa = toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador);

        this.personajeCreacion.Ca = 10
            + toNumber(this.personajeCreacion.ModDestreza)
            + modTamanoCa
            + toNumber(this.personajeCreacion.Armadura_natural)
            + toNumber(this.personajeCreacion.Ca_desvio)
            + toNumber(this.personajeCreacion.Ca_varios);

        // Ataque base + Fuerza + tamaño + varios, la misma regla que la presa de la API.
        this.personajeCreacion.Presa = totalesPersonaje(this.personajeCreacion).presa?.total ?? 0;
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
        const existe = raciales.some(r => normalizarTexto(r.Nombre) === normalizarTexto(nombreRacial));
        if (existe)
            return;

        const racial = createRacialPlaceholder(nombreRacial);
        racial.Origen = origen;
        raciales.push(racial);
    }

    private tieneRestriccionAlineamientoPlantilla(plantilla: Plantilla): boolean {
        if (toNumber(plantilla?.Alineamiento?.Prioridad?.Id_prioridad) <= 0)
            return false;

        const ejes = extraerEjesAlineamientoDesdeContrato(plantilla?.Alineamiento);
        return ejes.ley !== null || ejes.moral !== null;
    }

    private asegurarHabilidadDesdePlantilla(habilidadRef: Plantilla['Habilidades'][number]): Personaje['Habilidades'][number] | null {
        const raw = {
            Id_habilidad: toNumber(habilidadRef?.Id_habilidad),
            Habilidad: `${habilidadRef?.Habilidad ?? ''}`.trim(),
            Id_caracteristica: toNumber(habilidadRef?.Id_caracteristica),
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
            Id: toNumber(raza?.Id),
            Nombre: `${raza?.Nombre ?? ''}`.trim(),
            Ajuste_nivel: toNumber(raza?.Ajuste_nivel),
            Tamano: {
                Id: toNumber(raza?.Tamano?.Id),
                Nombre: `${raza?.Tamano?.Nombre ?? '-'}`,
                Modificador: toNumber(raza?.Tamano?.Modificador),
                Modificador_presa: toNumber(raza?.Tamano?.Modificador_presa),
            },
            Dgs_adicionales: {
                Cantidad: toNumber(raza?.Dgs_adicionales?.Cantidad),
                Dado: `${raza?.Dgs_adicionales?.Dado ?? ''}`.trim(),
                Tipo_criatura: `${raza?.Dgs_adicionales?.Tipo_criatura ?? ''}`.trim(),
            },
            Manual: `${raza?.Manual ?? ''}`.trim(),
            Clase_predilecta: `${raza?.Clase_predilecta ?? ''}`.trim(),
            Modificadores: {
                Fuerza: toNumber(raza?.Modificadores?.Fuerza),
                Destreza: toNumber(raza?.Modificadores?.Destreza),
                Constitucion: toNumber(raza?.Modificadores?.Constitucion),
                Inteligencia: toNumber(raza?.Modificadores?.Inteligencia),
                Sabiduria: toNumber(raza?.Modificadores?.Sabiduria),
                Carisma: toNumber(raza?.Modificadores?.Carisma),
            },
            Altura_rango_inf: toNumber(raza?.Altura_rango_inf),
            Altura_rango_sup: toNumber(raza?.Altura_rango_sup),
            Peso_rango_inf: toNumber(raza?.Peso_rango_inf),
            Peso_rango_sup: toNumber(raza?.Peso_rango_sup),
            Edad_adulto: toNumber(raza?.Edad_adulto),
            Edad_mediana: toNumber(raza?.Edad_mediana),
            Edad_viejo: toNumber(raza?.Edad_viejo),
            Edad_venerable: toNumber(raza?.Edad_venerable),
            Oficial: toBoolean(raza?.Oficial),
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
            .filter((r) => normalizarTexto(r.Nombre).length > 0);
    }

    private copiarSortilegas(value: AptitudSortilega[] | null | undefined): AptitudSortilega[] {
        const listado = Array.isArray(value)
            ? value
            : (value && typeof value === 'object' ? Object.values(value as any) : []);

        return listado
            .map((s: any) => ({
                Conjuro: { ...(s?.Conjuro ?? {}) } as any,
                Nivel_lanzador: toNumber(s?.Nivel_lanzador),
                Usos_diarios: `${s?.Usos_diarios ?? ''}`.trim(),
                Descripcion: `${s?.Descripcion ?? ''}`.trim(),
                Dgs_necesarios: toNumber(s?.Dgs_necesarios),
                Origen: `${s?.Origen ?? ''}`.trim(),
            }))
            .filter((s) => normalizarTexto(`${s?.Conjuro?.Nombre ?? ''}`).length > 0);
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
            Id: toNumber(tipoResultante?.Id),
            Nombre: `${tipoResultante?.Nombre ?? '-'}`,
        };
        this.estadoFlujo.plantillas.licantropiaActiva = simulacion.licantropiaActiva;
        this.estadoFlujo.plantillas.heredadaActiva = simulacion.heredadaActiva;
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
        const tipoResultanteId = toNumber(tipoResultanteIdRaw);
        const tipoBaseId = toNumber(tipoBase?.Id);
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

    private sincronizarPlantillasOtorgadasPorRaza(): void {
        const refs = this.getReferenciasPlantillasOtorgadasPorRaza();
        const oldOtorgadas = new Set((this.estadoFlujo.plantillas.otorgadasRazaIds ?? []).map((id) => toNumber(id)));
        const resolved: Plantilla[] = [];
        const pendientes: RazaPlantillaReferencia[] = [];

        refs.forEach((ref) => {
            const plantilla = this.resolverPlantillaOtorgadaPorRaza(ref);
            if (plantilla) {
                if (!resolved.some((item) => toNumber(item.Id) === toNumber(plantilla.Id)))
                    resolved.push(this.clonarProfundo(plantilla));
                return;
            }
            pendientes.push(this.clonarProfundo(ref));
        });

        const resolvedIds = new Set(resolved.map((plantilla) => toNumber(plantilla.Id)).filter((id) => id > 0));
        const seleccionadasSinOtorgadasStale = (this.estadoFlujo.plantillas.seleccionadas ?? [])
            .filter((plantilla) => {
                const id = toNumber(plantilla?.Id);
                return !oldOtorgadas.has(id) || resolvedIds.has(id);
            });
        const idsSeleccionadas = new Set(seleccionadasSinOtorgadasStale.map((plantilla) => toNumber(plantilla?.Id)));

        resolved.forEach((plantilla) => {
            const id = toNumber(plantilla?.Id);
            if (id > 0 && !idsSeleccionadas.has(id)) {
                seleccionadasSinOtorgadasStale.push(plantilla);
                idsSeleccionadas.add(id);
            }
        });

        const confirmadas = new Set(
            (this.estadoFlujo.plantillas.confirmadasIds ?? [])
                .map((id) => toNumber(id))
                .filter((id) => id > 0 && (!oldOtorgadas.has(id) || resolvedIds.has(id)))
        );
        resolvedIds.forEach((id) => confirmadas.add(id));

        this.estadoFlujo.plantillas.seleccionadas = seleccionadasSinOtorgadasStale;
        this.estadoFlujo.plantillas.confirmadasIds = Array.from(confirmadas);
        this.estadoFlujo.plantillas.otorgadasRazaIds = Array.from(resolvedIds);
        this.estadoFlujo.plantillas.otorgadasRazaPendientes = pendientes;
    }

    private getReferenciasPlantillasOtorgadasPorRaza(): RazaPlantillaReferencia[] {
        const resultado: RazaPlantillaReferencia[] = [];
        const vistos = new Set<string>();
        (this.razaSeleccionada?.Plantillas_por_subtipo ?? []).forEach((grupo) => {
            (grupo?.Plantillas ?? []).forEach((plantilla) => {
                const id = toNumber(plantilla?.Id);
                const nombre = `${plantilla?.Nombre ?? ''}`.trim();
                const key = id > 0 ? `id:${id}` : `n:${normalizarTexto(nombre)}`;
                if ((id <= 0 && nombre.length < 1) || vistos.has(key))
                    return;
                vistos.add(key);
                resultado.push({
                    Id: id,
                    Nombre: nombre,
                    Descripcion: `${plantilla?.Descripcion ?? ''}`.trim(),
                });
            });
        });
        return resultado;
    }

    private resolverPlantillaOtorgadaPorRaza(ref: RazaPlantillaReferencia): Plantilla | null {
        const id = toNumber(ref?.Id);
        if (id > 0) {
            const porId = (this.estadoFlujo.plantillas.disponibles ?? [])
                .find((plantilla) => toNumber(plantilla?.Id) === id);
            if (porId)
                return porId;
        }
        const nombre = normalizarTexto(ref?.Nombre ?? '');
        if (nombre.length < 1)
            return null;
        return (this.estadoFlujo.plantillas.disponibles ?? [])
            .find((plantilla) => normalizarTexto(plantilla?.Nombre ?? '') === nombre) ?? null;
    }

    private buscarTipoCriaturaPorId(idTipo: number): TipoCriatura | null {
        const id = toNumber(idTipo);
        if (id <= 0)
            return null;
        return this.catalogoTiposCriatura.find((tipo) => toNumber(tipo?.Id) === id) ?? null;
    }

    private copiarTipoCriatura(tipo: TipoCriatura | null | undefined): TipoCriatura {
        if (!tipo)
            return this.crearTipoCriaturaFallback(0, '-');

        return {
            Id: toNumber(tipo.Id),
            Nombre: `${tipo.Nombre ?? '-'}`,
            Descripcion: `${tipo.Descripcion ?? ''}`,
            Manual: `${tipo.Manual ?? ''}`,
            Id_tipo_dado: toNumber(tipo.Id_tipo_dado),
            Tipo_dado: toNumber(tipo.Tipo_dado),
            Id_ataque: toNumber(tipo.Id_ataque),
            Id_fortaleza: toNumber(tipo.Id_fortaleza),
            Id_reflejos: toNumber(tipo.Id_reflejos),
            Id_voluntad: toNumber(tipo.Id_voluntad),
            Id_puntos_habilidad: toNumber(tipo.Id_puntos_habilidad),
            Come: toBoolean(tipo.Come),
            Respira: toBoolean(tipo.Respira),
            Duerme: toBoolean(tipo.Duerme),
            Recibe_criticos: toBoolean(tipo.Recibe_criticos),
            Puede_ser_flanqueado: toBoolean(tipo.Puede_ser_flanqueado),
            Pierde_constitucion: toBoolean(tipo.Pierde_constitucion),
            Limite_inteligencia: toNumber(tipo.Limite_inteligencia),
            Tesoro: `${tipo.Tesoro ?? ''}`,
            Id_alineamiento: toNumber(tipo.Id_alineamiento),
            Rasgos: this.asignarOrigenRasgosTipo(tipo.Rasgos, tipo.Nombre),
            Oficial: toBoolean(tipo.Oficial),
        };
    }

    private crearTipoCriaturaFallback(id: number, nombre: string): TipoCriatura {
        return {
            Id: toNumber(id),
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
                Id: toNumber(subtipo?.Id),
                Nombre: `${subtipo?.Nombre ?? ''}`.trim(),
            }))
            .filter((subtipo) => subtipo.Nombre.length > 0 || subtipo.Id > 0);
    }

    private unirSubtiposDeduplicados(base: SubtipoRef[], extra: SubtipoRef[]): SubtipoRef[] {
        const resultado: SubtipoRef[] = [];
        const vistos = new Set<string>();

        [...base, ...extra].forEach((subtipo) => {
            const id = toNumber(subtipo?.Id);
            const nombreNorm = normalizarTexto(`${subtipo?.Nombre ?? ''}`);
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
        const normalizado = normalizarTexto(nombreIdioma);
        if (normalizado.length < 1)
            return false;

        const enBase = this.estadoFlujo.ventajas.baseIdiomas.some(i => normalizarTexto(i.Nombre) === normalizado);
        if (enBase)
            return true;

        return this.estadoFlujo.ventajas.seleccionVentajas
            .filter(v => v.id !== exceptVentajaId)
            .some((v) => normalizarTexto(v.idioma?.Nombre ?? '') === normalizado);
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
                    otorgadasRazaIds: this.clonarProfundo(this.estadoFlujo.plantillas.otorgadasRazaIds),
                    otorgadasRazaPendientes: this.clonarProfundo(this.estadoFlujo.plantillas.otorgadasRazaPendientes),
                    retornoFinNivelPendiente: this.estadoFlujo.plantillas.retornoFinNivelPendiente === true,
                    tipoCriaturaSimulada: this.clonarProfundo(this.estadoFlujo.plantillas.tipoCriaturaSimulada),
                    licantropiaActiva: this.estadoFlujo.plantillas.licantropiaActiva === true,
                    heredadaActiva: this.estadoFlujo.plantillas.heredadaActiva === true,
                },
                ventajas: {
                    seleccionVentajas: this.clonarProfundo(this.estadoFlujo.ventajas.seleccionVentajas),
                    seleccionDesventajas: this.clonarProfundo(this.estadoFlujo.ventajas.seleccionDesventajas),
                    baseCaracteristicas: this.clonarProfundo(this.estadoFlujo.ventajas.baseCaracteristicas),
                    baseRaciales: this.clonarProfundo(this.estadoFlujo.ventajas.baseRaciales),
                    baseIdiomas: this.clonarProfundo(this.estadoFlujo.ventajas.baseIdiomas),
                },
                habilidades: this.clonarProfundo(this.estadoFlujo.habilidades),
                conjuros: this.clonarProfundo(this.estadoFlujo.conjuros),
            },
            dotesPendientes: this.clonarProfundo(this.dotesPendientes),
            secuenciaDotePendiente: Math.max(1, toInt(this.secuenciaDotePendiente)),
            dotesProgresionConcedidas: Math.max(0, toInt(this.dotesProgresionConcedidas)),
            dotesExtraRazaConcedidas: Math.max(0, toInt(this.dotesExtraRazaConcedidas)),
            dotesAdicionalesRazaConcedidas: Math.max(0, toInt(this.dotesAdicionalesRazaConcedidas)),
            aumentosPendientesCaracteristica: this.clonarProfundo(this.aumentosPendientesCaracteristica),
            aumentosProgresionConcedidos: Math.max(0, toInt(this.aumentosProgresionConcedidos)),
            secuenciaAumentoPendiente: Math.max(1, toInt(this.secuenciaAumentoPendiente)),
            bonusNivelLanzadorPorClase: this.clonarProfundo(this.bonusNivelLanzadorPorClase),
            progresionLanzadorSelecciones: this.getProgresionLanzadorPersistible()?.selecciones ?? [],
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
            const caracteristicasGeneradas = flujoPersistido.caracteristicasGeneradas === true;
            this.estadoFlujo.modalCaracteristicasAbierto = false;
            this.estadoFlujo.caracteristicasGeneradas = caracteristicasGeneradas;
            this.estadoFlujo.pasoActual = this.normalizarPasoRestaurado(
                flujoPersistido.pasoActual,
                this.razaSeleccionada,
                this.personajeCreacion,
                caracteristicasGeneradas
            );
            this.estadoFlujo.generador = this.clonarProfundo(flujoPersistido.generador ?? this.estadoFlujo.generador);
            this.estadoFlujo.plantillas = {
                ...this.crearPlantillasFlujoBase(),
                seleccionadas: this.clonarProfundo(flujoPersistido.plantillas?.seleccionadas ?? []),
                confirmadasIds: this.clonarProfundo(flujoPersistido.plantillas?.confirmadasIds ?? []),
                otorgadasRazaIds: this.clonarProfundo(flujoPersistido.plantillas?.otorgadasRazaIds ?? []),
                otorgadasRazaPendientes: this.clonarProfundo(flujoPersistido.plantillas?.otorgadasRazaPendientes ?? []),
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
        this.restaurarBasesVentajasDesdeBorrador(borrador);

        this.dotesPendientes = this.clonarProfundo(borrador.dotesPendientes ?? []);
        this.secuenciaDotePendiente = Math.max(1, toInt(borrador.secuenciaDotePendiente));
        this.dotesProgresionConcedidas = Math.max(0, toInt(borrador.dotesProgresionConcedidas));
        this.dotesExtraRazaConcedidas = Math.max(0, toInt(borrador.dotesExtraRazaConcedidas));
        this.dotesAdicionalesRazaConcedidas = Math.max(0, toInt(borrador.dotesAdicionalesRazaConcedidas));
        this.aumentosPendientesCaracteristica = this.clonarProfundo(borrador.aumentosPendientesCaracteristica ?? []);
        this.aumentosProgresionConcedidos = Math.max(0, toInt(borrador.aumentosProgresionConcedidos));
        this.secuenciaAumentoPendiente = Math.max(1, toInt(borrador.secuenciaAumentoPendiente));
        this.bonusNivelLanzadorPorClase = this.clonarProfundo(borrador.bonusNivelLanzadorPorClase ?? {});
        this.progresionLanzadorSelecciones = this.normalizarSeleccionesProgresionLanzadorBorrador(
            borrador.progresionLanzadorSelecciones
        );
        this.conjurosSesionPlaceholderPorId = this.clonarProfundo(borrador.conjurosSesionPlaceholderPorId ?? {});
        this.idsEspecialesInternosActivos = new Set<number>(
            (borrador.idsEspecialesInternosActivos ?? [])
                .map((id) => toInt(id))
                .filter((id) => id > 0)
        );
        this.idsDotesInternosActivos = new Set<number>(
            (borrador.idsDotesInternosActivos ?? [])
                .map((id) => toInt(id))
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

    private normalizarSeleccionesProgresionLanzadorBorrador(
        selecciones?: PersonajeProgresionLanzadorSeleccionDto[] | null
    ): PersonajeProgresionLanzadorSeleccionDto[] {
        return Array.isArray(selecciones)
            ? selecciones
                .map((seleccion) => ({
                    idClaseAplicada: toInt(seleccion?.idClaseAplicada),
                    nivelClaseAplicado: toInt(seleccion?.nivelClaseAplicado),
                    indiceAumento: toInt(seleccion?.indiceAumento),
                    idClaseObjetivo: toInt(seleccion?.idClaseObjetivo),
                }))
                .filter((seleccion) =>
                    seleccion.idClaseAplicada > 0
                    && seleccion.nivelClaseAplicado > 0
                    && seleccion.indiceAumento > 0
                    && seleccion.idClaseObjetivo > 0
                )
            : [];
    }

    private restaurarBasesVentajasDesdeBorrador(borrador: NuevoPersonajeDraftV1): void {
        const ventajasPersistidas = borrador.estadoFlujoPersistible?.ventajas;
        this.estadoFlujo.ventajas.baseCaracteristicas = this.resolverBaseCaracteristicasRestaurada(
            ventajasPersistidas?.baseCaracteristicas,
            borrador
        );
        this.estadoFlujo.ventajas.baseRaciales = Array.isArray(ventajasPersistidas?.baseRaciales)
            ? this.copiarRaciales(ventajasPersistidas?.baseRaciales)
            : this.reconstruirBaseRacialesDesdeBorrador();
        this.estadoFlujo.ventajas.baseIdiomas = Array.isArray(ventajasPersistidas?.baseIdiomas)
            ? this.copiarIdiomas(ventajasPersistidas?.baseIdiomas)
            : this.reconstruirBaseIdiomasDesdeBorrador();
    }

    private resolverBaseCaracteristicasRestaurada(
        basePersistida: Record<CaracteristicaKey, number> | null | undefined,
        borrador: NuevoPersonajeDraftV1
    ): Record<CaracteristicaKey, number> {
        if (basePersistida && typeof basePersistida === 'object') {
            return {
                Fuerza: toNumber(basePersistida.Fuerza),
                Destreza: toNumber(basePersistida.Destreza),
                Constitucion: toNumber(basePersistida.Constitucion),
                Inteligencia: toNumber(basePersistida.Inteligencia),
                Sabiduria: toNumber(basePersistida.Sabiduria),
                Carisma: toNumber(basePersistida.Carisma),
            };
        }

        const baseDesdeGenerador = this.intentarReconstruirBaseCaracteristicasDesdeGenerador(borrador);
        if (baseDesdeGenerador)
            return baseDesdeGenerador;

        const personaje = borrador.personaje ?? this.personajeCreacion;
        const caracteristicasVarios = personaje?.CaracteristicasVarios as Record<string, Array<{ valor?: number | null; Valor?: number | null; }>> | undefined;
        const resultado = {} as Record<CaracteristicaKey, number>;

        CARACTERISTICAS.forEach((key) => {
            if (this.esCaracteristicaPerdida(key)) {
                resultado[key] = 0;
                return;
            }

            const total = toNumber((personaje as Record<string, any>)?.[key]);
            const suma = (Array.isArray(caracteristicasVarios?.[key]) ? caracteristicasVarios[key] : [])
                .reduce((acc, item) => acc + toNumber(item?.valor ?? item?.Valor), 0);
            resultado[key] = total - suma;
        });

        return resultado;
    }

    private intentarReconstruirBaseCaracteristicasDesdeGenerador(
        borrador: NuevoPersonajeDraftV1
    ): Record<CaracteristicaKey, number> | null {
        if (borrador.estadoFlujoPersistible?.caracteristicasGeneradas !== true)
            return null;
        if (Math.max(0, toInt(borrador.aumentosProgresionConcedidos)) > 0)
            return null;

        const asignaciones = borrador.estadoFlujoPersistible?.generador?.asignaciones;
        if (!asignaciones)
            return null;

        const razaMods = borrador.razaSeleccionada?.Modificadores ?? this.razaSeleccionada?.Modificadores;
        const resultado = {} as Record<CaracteristicaKey, number>;

        for (const key of CARACTERISTICAS) {
            if (this.esCaracteristicaPerdida(key)) {
                resultado[key] = 0;
                continue;
            }

            const asignada = asignaciones[key];
            if (asignada === null || asignada === undefined)
                return null;

            resultado[key] = toNumber(asignada) + toNumber((razaMods as Record<string, any> | undefined)?.[key]);
        }

        return resultado;
    }

    private reconstruirBaseRacialesDesdeBorrador(): RacialDetalle[] {
        const origenesExcluidos = this.getOrigenesExcluidosRestauracionBorrador();
        return this.copiarRaciales((this.personajeCreacion.Raciales ?? []).filter((racial: any) => {
            const origen = normalizarTexto(racial?.Origen ?? '');
            return origen.length < 1 || !origenesExcluidos.has(origen);
        }));
    }

    private reconstruirBaseIdiomasDesdeBorrador() {
        const origenesExcluidos = this.getOrigenesExcluidosRestauracionBorrador();
        return this.copiarIdiomas((this.personajeCreacion.Idiomas ?? []).filter((idioma) => {
            const origen = normalizarTexto(idioma?.Origen ?? '');
            return origen.length < 1 || !origenesExcluidos.has(origen);
        }));
    }

    private getOrigenesExcluidosRestauracionBorrador(): Set<string> {
        const origenes = new Set<string>();

        (this.personajeCreacion.Ventajas ?? []).forEach((ventaja) => {
            const nombre = normalizarTexto(
                typeof ventaja === 'string'
                    ? ventaja
                    : (ventaja?.Nombre ?? '')
            );
            if (nombre.length > 0)
                origenes.add(nombre);
        });

        (this.estadoFlujo.plantillas.seleccionadas ?? []).forEach((plantilla) => {
            const nombre = normalizarTexto(plantilla?.Nombre ?? '');
            if (nombre.length > 0)
                origenes.add(nombre);
        });

        return origenes;
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
        if (toNumber((value as any).version) !== NUEVO_PERSONAJE_DRAFT_VERSION)
            return false;
        if (`${(value as any).uid ?? ''}`.trim() !== `${uid ?? ''}`.trim())
            return false;
        if (!(value as any).personaje || !(value as any).estadoFlujoPersistible)
            return false;
        return true;
    }

    private estaBorradorLocalCaducado(borrador: NuevoPersonajeDraftV1): boolean {
        const updatedAt = toInt((borrador as any)?.updatedAt);
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
        return this.normalizarPasoRestaurado(
            paso,
            this.razaSeleccionada,
            this.personajeCreacion,
            this.estadoFlujo.caracteristicasGeneradas === true
        );
    }

    private normalizarPasoRestaurado(
        paso: StepNuevoPersonaje,
        razaSeleccionada: Raza | null = this.razaSeleccionada,
        personaje: Personaje | null = this.personajeCreacion,
        caracteristicasGeneradas: boolean = this.estadoFlujo.caracteristicasGeneradas === true
    ): StepNuevoPersonaje {
        if (!razaSeleccionada || toNumber(personaje?.Raza?.Id) <= 0)
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

        if (!caracteristicasGeneradas && this.pasoRequiereCaracteristicasGeneradas(pasoNormalizado))
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
            otorgadasRazaIds: [],
            otorgadasRazaPendientes: [],
            retornoFinNivelPendiente: false,
            tipoCriaturaSimulada: {
                Id: toNumber(this.personajeCreacion?.Tipo_criatura?.Id),
                Nombre: `${this.personajeCreacion?.Tipo_criatura?.Nombre ?? '-'}`,
            },
            licantropiaActiva: false,
            heredadaActiva: false,
        };
    }

    private getIdsPlantillasConfirmadasSet(): Set<number> {
        return new Set(
            (this.estadoFlujo?.plantillas?.confirmadasIds ?? [])
                .map((id) => toNumber(id))
                .filter((id) => id > 0)
        );
    }

    private getDgsAdicionalesDesdePlantillas(plantillas: Plantilla[] | null | undefined): number {
        return (plantillas ?? [])
            .reduce((acc, plantilla) => acc + toNumber(plantilla?.Licantronia_dg?.Multiplicador), 0);
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

    private normalizarRestriccionCampanaGenerador(
        restriccion: { tiradaMinimaCaracteristica?: number | null; maxTablasDadosCaracteristicas?: number | null; }
    ): GeneradorCampanaRestriccionNormalizada {
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

        return {
            minimoSeleccionado: minimo,
            tablasPermitidas,
        };
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
        return [...CARACTERISTICAS].sort((a, b) => {
            const scoreA = toNumber(score[a]);
            const scoreB = toNumber(score[b]);
            const modA = this.getModRacialGenerador(a);
            const modB = this.getModRacialGenerador(b);
            if (scoreB !== scoreA)
                return scoreB - scoreA;
            if (modB !== modA)
                return modB - modA;
            return CARACTERISTICAS.indexOf(a) - CARACTERISTICAS.indexOf(b);
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
        const scoreTop2 = toNumber(score[top2]);
        const scoreTop3 = toNumber(score[top3]);
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
        const normalizado = normalizarTexto(claseNombre);
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
        CARACTERISTICAS.forEach((key) => {
            const actual = toNumber(score[key]);
            const extra = toNumber(delta[key]);
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
            const total = tiradas.reduce((acc, valor) => acc + toNumber(valor), 0);
            const maximo = tiradas.reduce((acc, valor) => Math.max(acc, toNumber(valor)), 0);
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
            .map((valor) => toNumber(valor))
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
        return toNumber(this.personajeCreacion?.Raza?.Modificadores?.[caracteristica]);
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

    private aplicarConfigGeneradorEfectiva(options?: { forceReset?: boolean; preservarRepartoCompatible?: boolean; }): void {
        const config = this.getConfigGeneradorEfectiva();
        const minimoPrevio = this.estadoFlujo.generador.minimoSeleccionado;
        const indicePrevio = this.estadoFlujo.generador.indiceMinimo;
        const tablasPrevias = this.estadoFlujo.generador.tablasPermitidas;
        const indiceMinimo = this.getIndexByMinimo(config.minimoSeleccionado);
        const minimoNormalizado = this.getMinimoByIndex(indiceMinimo);
        const configuracionSinCambios = minimoPrevio === minimoNormalizado
            && tablasPrevias === config.tablasPermitidas;

        this.estadoFlujo.generador.minimoSeleccionado = minimoNormalizado;
        this.estadoFlujo.generador.indiceMinimo = indiceMinimo;
        this.estadoFlujo.generador.tablasPermitidas = config.tablasPermitidas;
        this.asegurarTiradasPorIndice(indiceMinimo);

        if (options?.forceReset) {
            this.resetearGeneradorCaracteristicas();
            return;
        }

        if (configuracionSinCambios)
            return;

        if (options?.preservarRepartoCompatible
            && this.puedePreservarRepartoGenerador(indicePrevio, indiceMinimo, config.tablasPermitidas)) {
            return;
        }

        this.resetearGeneradorCaracteristicas();
    }

    private puedePreservarRepartoGenerador(indicePrevio: number, indiceNuevo: number, tablasPermitidasNuevas: number): boolean {
        if (indicePrevio !== indiceNuevo)
            return false;

        const tablaSeleccionada = this.estadoFlujo.generador.tablaSeleccionada;
        if (tablaSeleccionada === null)
            return !this.generadorTieneRepartoEnCurso();

        return tablaSeleccionada >= 1 && tablaSeleccionada <= tablasPermitidasNuevas;
    }

    private generadorTieneRepartoEnCurso(): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada !== null)
            return true;

        if ((this.estadoFlujo.generador.poolDisponible?.length ?? 0) > 0)
            return true;

        return CARACTERISTICAS.some((key) => {
            if (this.esCaracteristicaPerdida(key))
                return false;
            return this.estadoFlujo.generador.asignaciones[key] !== null;
        });
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
        const dgsRaciales = Math.max(0, toInt(raza?.Dgs_adicionales?.Cantidad));
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
            const pasoDado = toInt(plantilla?.Modificacion_dg?.Id_paso_modificacion);
            const actualizaDg = toBoolean(plantilla?.Actualiza_dg);
            const multiplicadorLic = Math.max(0, toInt(plantilla?.Licantronia_dg?.Multiplicador));
            const sumaLic = toNumber(plantilla?.Licantronia_dg?.Suma);

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
            const nivel = Math.max(0, toInt(claseDesglose?.Nivel));
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
            const cantidadDgLic = Math.max(0, toInt(plantilla?.Licantronia_dg?.Multiplicador));
            const sumaDgLic = toNumber(plantilla?.Licantronia_dg?.Suma);
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
        const pierdeConstitucion = toBoolean(this.personajeCreacion?.Tipo_criatura?.Pierde_constitucion)
            || toBoolean(this.personajeCreacion?.Constitucion_perdida);
        if (pierdeConstitucion)
            return { aplica: false, modificador: 0 };
        return {
            aplica: true,
            modificador: toNumber(this.personajeCreacion?.ModConstitucion),
        };
    }

    private resolverCarasDadoRacialParaVida(raza: Raza | null): number {
        const dadoRaza = this.resolverCarasDadoDesdeTexto(`${raza?.Dgs_adicionales?.Dado ?? ''}`);
        if (dadoRaza > 0)
            return dadoRaza;

        const dadoPreview = toInt(this.personajeCreacion?.Dados_golpe);
        if (dadoPreview > 0)
            return dadoPreview;

        const dadoTipo = this.resolverDadoGolpeTipoActual();
        if (dadoTipo > 0)
            return dadoTipo;

        return 8;
    }

    private resolverCarasDadoClaseParaVida(nombreClase: string, fallback: number): number {
        const nombreNorm = normalizarTexto(nombreClase);
        const clase = (this.catalogoClases ?? [])
            .find((item) => normalizarTexto(item?.Nombre ?? '') === nombreNorm) ?? null;
        const dadoClase = this.resolverCarasDadoClase(clase);
        if (dadoClase > 0)
            return dadoClase;
        return Math.max(1, toInt(fallback));
    }

    private resolverCarasDadoClase(clase: Clase | null): number {
        if (!clase)
            return 0;

        const carasPorNombre = this.resolverCarasDadoDesdeTexto(`${clase?.Tipo_dado?.Nombre ?? ''}`);
        if (carasPorNombre > 0)
            return carasPorNombre;

        const idTipo = toInt(clase?.Tipo_dado?.Id);
        if (idTipo > 0) {
            const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipo - 1));
            return DADOS_PROGRESION[idx];
        }

        return 0;
    }

    private resolverCarasDadoLicantronia(plantilla: Plantilla, fallback: number): number {
        const carasPorNombre = this.resolverCarasDadoDesdeTexto(`${plantilla?.Licantronia_dg?.Dado ?? ''}`);
        if (carasPorNombre > 0)
            return carasPorNombre;

        const idDado = toInt(plantilla?.Licantronia_dg?.Id_dado);
        if (idDado > 0) {
            const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idDado - 1));
            return DADOS_PROGRESION[idx];
        }

        const porPlantilla = this.resolverDadoDesdePlantilla(plantilla);
        if (porPlantilla > 0)
            return porPlantilla;

        return Math.max(1, toInt(fallback));
    }

    private resolverCarasDadoDesdeTexto(valor: string): number {
        const match = `${valor ?? ''}`.match(/d\s*(\d+)/i);
        if (!match || !match[1])
            return 0;
        const caras = toInt(match[1]);
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
            return acumulado + toNumber(valor);
        }, 0);
    }

    private normalizarClaveModificadorDote(clave: string): string {
        return normalizarTexto(`${clave ?? ''}`).replace(/[^a-z0-9]/g, '');
    }

    private esCaracteristicaAumentoValida(value: string): value is CaracteristicaKey {
        return (CARACTERISTICAS as string[]).includes(`${value ?? ''}`.trim());
    }

    private getNivelEfectivoParaAumentos(): number {
        const nivelClases = this.getNivelClasesActual();
        const dgsRaza = toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return Math.max(0, nivelClases + dgsRaza + dgsPlantillas);
    }

    /**
     * El nivel de clase recién aplicado es el primero del personaje: no hay otros niveles de clase ni DG de la raza o
     * de las plantillas (esos DG ya fueron su primer nivel).
     */
    private esPrimerNivelDelPersonaje(): boolean {
        return this.getNivelClasesActual() <= 1 && !this.tieneDgsDeRazaOPlantillas();
    }

    /** La suma de los niveles de clase del personaje (`desgloseClases`), sin DG ni ajuste de nivel. */
    private getNivelClasesActual(): number {
        return (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + toNumber(clase?.Nivel), 0);
    }

    private getNivelEfectivoParaDotesProgresion(): number {
        const nivelClases = this.getNivelClasesActual();
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return Math.max(0, nivelClases + dgsPlantillas);
    }

    private getHitosDotesProgresion(): number[] {
        const nivelEfectivoDotes = this.getNivelEfectivoParaDotesProgresion();
        const dgsRaciales = this.getDgsRacialesAdicionalesParaDotesProgresion();
        const dotesBasePorDgsRaciales = Math.max(0, Math.floor(dgsRaciales / 3));
        const doteInicialNivel = nivelEfectivoDotes > 0 && !this.tieneDgsDeRazaOPlantillas() ? 1 : 0;
        const totalPorProgresion = Math.max(
            0,
            doteInicialNivel + Math.floor((nivelEfectivoDotes + dgsRaciales) / 3) - dotesBasePorDgsRaciales
        );
        if (totalPorProgresion < 1)
            return [];

        const nivelVisible = Math.max(
            0,
            toNumber(this.personajeCreacion?.NEP),
            this.getNivelEfectivoPersonajeActual()
        );
        const hitosVisibles: number[] = [];
        if (!this.tieneDgsDeRazaOPlantillas())
            hitosVisibles.push(1);

        for (let nivel = 3; nivel <= nivelVisible; nivel += 3)
            hitosVisibles.push(nivel);

        const inicio = Math.max(0, hitosVisibles.length - totalPorProgresion);
        return hitosVisibles.slice(inicio);
    }

    private getDgsRacialesAdicionalesParaDotesProgresion(): number {
        return Math.max(0, toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad));
    }

    private getNivelEfectivoPersonajeActual(): number {
        const nivelClases = this.getNivelClasesActual();
        const dgsRaza = toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        const ajusteRaza = toNumber(this.razaSeleccionada?.Ajuste_nivel);
        const ajustePlantillas = (this.estadoFlujo.plantillas.seleccionadas ?? [])
            .reduce((acc, plantilla) => acc + toNumber(plantilla?.Ajuste_nivel), 0);
        return Math.max(0, nivelClases + dgsRaza + dgsPlantillas + ajusteRaza + ajustePlantillas);
    }

    /** La raza o alguna plantilla da DG raciales: el primer nivel del personaje fue el de esos DG, no uno de clase. */
    private tieneDgsDeRazaOPlantillas(): boolean {
        const dgsRaza = toNumber(this.razaSeleccionada?.Dgs_adicionales?.Cantidad);
        const dgsPlantillas = this.getDgsAdicionalesDesdePlantillas(this.estadoFlujo.plantillas.seleccionadas);
        return dgsRaza > 0 || dgsPlantillas > 0;
    }

    private crearPendienteAumento(valor: number, origen: string, descripcion: string): AumentoCaracteristicaPendiente {
        return {
            id: this.secuenciaAumentoPendiente++,
            valor: Math.max(1, toInt(valor)),
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
            const valor = toInt(candidato);
            if (valor > 0)
                return valor;
        }

        return 0;
    }

    private esEspecialEnemigoPredilecto(especialNivel: ClaseEspecialNivel): boolean {
        const especialRaw = (especialNivel?.Especial ?? {}) as Record<string, any>;
        const nombre = normalizarTexto(`${especialRaw?.['Nombre'] ?? especialRaw?.['nombre'] ?? ''}`);
        if (nombre.length < 1)
            return false;
        return nombre.includes('enemigo predilecto')
            || nombre.includes('enemigos predilectos');
    }

    private esCaracteristicaPerdida(key: CaracteristicaKey): boolean {
        const mapa = this.personajeCreacion?.Caracteristicas_perdidas ?? {};
        const valorMapa = toBoolean((mapa as Record<string, any>)?.[key]);
        if (key === 'Constitucion') {
            const legado = toBoolean(this.personajeCreacion?.Constitucion_perdida);
            return valorMapa || legado;
        }
        return valorMapa;
    }

    private setCaracteristicaPerdida(key: CaracteristicaKey, estado: any, _origen?: string): void {
        const valor = toBoolean(estado);
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
        const pierdeConstitucion = toBoolean(tipoActual?.Pierde_constitucion);
        this.setCaracteristicaPerdida('Constitucion', pierdeConstitucion, 'tipo_criatura');
    }

    private aplicarPerdidasSinGenerador(): void {
        CARACTERISTICAS.forEach((key) => {
            if (!this.esCaracteristicaPerdida(key))
                return;
            this.setValorCaracteristica(key, 0);
            this.setModCaracteristica(key, 0);
        });
        this.sincronizarAliasConstitucionPerdida();
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
                    Id: toNumber(h.Id_habilidad),
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
                        Id_extra: toNumber(extra?.Id_extra),
                        Extra: `${extra?.Extra ?? ''}`,
                        Descripcion: `${extra?.Descripcion ?? ''}`,
                    })),
                    Bonos_varios: [],
                };
            })
            .sort(porNombre);
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
        const normalizado = normalizarTexto(texto);
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
        (this.personajeCreacion as Record<string, any>)[key] = toNumber(valor);
    }

    private setModCaracteristica(key: CaracteristicaKey, mod: number): void {
        const prop = `Mod${key}`;
        (this.personajeCreacion as Record<string, any>)[prop] = toNumber(mod);
    }

    private mapPlantillaParaPersonaje(plantilla: Plantilla) {
        return {
            Id: toNumber(plantilla.Id),
            Nombre: `${plantilla.Nombre ?? ''}`,
            Ataques: `${plantilla.Ataques ?? ''}`,
            Ataque_completo: `${plantilla.Ataque_completo ?? ''}`,
            Id_tamano: toNumber(plantilla.Tamano?.Id),
            Tamano: `${plantilla.Tamano?.Nombre ?? '-'}`,
            Id_tamano_pasos: toNumber(plantilla.Modificacion_tamano?.Id_paso_modificacion),
            Tamano_pasos: `${plantilla.Modificacion_tamano?.Nombre ?? '-'}`,
            // Pendiente para aplicacion de efectos: si Tipo_dado es "Elegir", no altera los dados de golpe del personaje.
            Id_dados_golpe: toNumber(plantilla.Tipo_dado?.Id_tipo_dado),
            Dados_golpe: `${plantilla.Tipo_dado?.Nombre ?? '-'}`,
            Id_dados_golpe_pasos: toNumber(plantilla.Modificacion_dg?.Id_paso_modificacion),
            Dados_golpe_pasos: `${plantilla.Modificacion_dg?.Nombre ?? '-'}`,
            Actualiza_dgs: !!plantilla.Actualiza_dg,
            Multiplicador_dgs_lic: toNumber(plantilla.Licantronia_dg?.Multiplicador),
            Tipo_dgs_lic: `${plantilla.Licantronia_dg?.Dado ?? ''}`,
            Suma_dgs_lic: toNumber(plantilla.Licantronia_dg?.Suma),
            Correr: toNumber(plantilla.Movimientos?.Correr),
            Nadar: toNumber(plantilla.Movimientos?.Nadar),
            Volar: toNumber(plantilla.Movimientos?.Volar),
            Maniobrabilidad: `${plantilla.Maniobrabilidad?.Nombre ?? '-'}`,
            Trepar: toNumber(plantilla.Movimientos?.Trepar),
            Escalar: toNumber(plantilla.Movimientos?.Escalar),
            Ataque_base: toNumber(plantilla.Ataque_base),
            Ca: `${plantilla.Ca ?? ''}`,
            Reduccion_dano: `${plantilla.Reduccion_dano ?? ''}`,
            Resistencia_conjuros: `${plantilla.Resistencia_conjuros ?? ''}`,
            Resistencia_elemental: `${plantilla.Resistencia_elemental ?? ''}`,
            Velocidades: `${plantilla.Velocidades ?? ''}`,
            Iniciativa: toNumber(plantilla.Iniciativa),
            Presa: toNumber(plantilla.Presa),
            Ajuste_nivel: toNumber(plantilla.Ajuste_nivel),
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
            ProgresionLanzador: { selecciones: [] },
            Niveles_lanzador: [],
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
