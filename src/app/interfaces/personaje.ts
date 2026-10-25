import { AptitudSortilega } from "./aptitud-sortilega";
import { Conjuro } from "./conjuro";
import { DoteContextual, DoteLegacy } from "./dote-contextual";
import { EnemigoPredilectoSeleccion } from "./enemigo-predilecto-seleccion";
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from "./monstruo";
import { RacialDetalle } from "./racial";
import { PersonajeSimple } from "./simplificaciones/personaje-simple";
import { SubtipoRef } from "./subtipo";
import { TipoCriatura } from "./tipo_criatura";
import {
    PersonajeDefensaTotalesDto,
    PersonajeDineroDto,
    PersonajeEquipoPiezaDto,
    PersonajeExtraComodinDto,
    PersonajeModificadorEquipoDto,
    PersonajeProgresionLanzadorDto,
    PersonajeSalvacionesDto,
    PersonajeTotalDto
} from "./personajes-api";

export type CaracteristicaPerdidaKey = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';
export type PersonajeTipoLanzamiento = 'arcano' | 'divino' | 'psionico' | 'alma' | 'mixto';

export interface PersonajeNivelLanzadorResumen {
    idClase: number;
    nombreClase: string;
    tipoLanzamiento: PersonajeTipoLanzamiento;
    nivelClase: number;
    nivelLanzadorBase: number;
    bonusNivelLanzador: number;
    nivelLanzador: number;
    nivelDesgloseLanzador: number;
}

export type CaracteristicasPerdidas = Partial<Record<CaracteristicaPerdidaKey, boolean>>;
export type AutoRepartoRespuestaQ1 =
    | 'acero_musculo'
    | 'rapidez_precision'
    | 'magia_arcana'
    | 'fe_naturaleza_espiritu'
    | 'voluntad_psionica'
    | 'labia_presencia';
export type AutoRepartoRespuestaQ2 =
    | 'delante'
    | 'primera_segunda_linea'
    | 'atras_control_apoyo'
    | 'evitar_contacto';
export type AutoRepartoRespuestaQ3 =
    | 'social'
    | 'investigar'
    | 'explorar'
    | 'manitas';
export type AutoRepartoRespuestaQ4 =
    | 'aguante'
    | 'acierto'
    | 'potencia_conjuros'
    | 'percepcion'
    | 'social';
export interface AutoRepartoCuestionario {
    q1?: AutoRepartoRespuestaQ1;
    q2?: AutoRepartoRespuestaQ2;
    q3?: AutoRepartoRespuestaQ3;
    q4?: AutoRepartoRespuestaQ4;
}
export interface AutoRepartoScore {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}
export interface AutoRepartoRecomendacion {
    clases: string[];
    explicacion: string;
    top1: CaracteristicaPerdidaKey;
    top2: CaracteristicaPerdidaKey;
    top3: CaracteristicaPerdidaKey;
    afinadaPorTop3: boolean;
}

/** Los totales que da hechos la API en la ficha (`iniciativa`, `presa` y `salvaciones` de `PersonajeDetalle`). */
export interface PersonajeTotales {
    iniciativa: PersonajeTotalDto;
    presa: PersonajeTotalDto | null;
    salvaciones: PersonajeSalvacionesDto;
}

export interface PersonajeCompetenciaDirecta {
    Id: number;
    Nombre: string;
}

export interface PersonajeCompetenciaArmaduraDirecta extends PersonajeCompetenciaDirecta {
    Es_escudo?: boolean;
}

export interface Personaje extends PersonajeSimple {
    Id_region?: number;
    Region?: { Id: number; Nombre: string; } | null;
    RazaBase?: PersonajeSimple['Raza'] | null;
    ProgresionLanzador?: PersonajeProgresionLanzadorDto;
    Niveles_lanzador?: PersonajeNivelLanzadorResumen[];
    desgloseClases: {
        Id?: number;
        Nombre: string;
        Nivel: number;
        /** La característica de la CD de sus conjuros; `null` o sin dato si no lanza. */
        Caracteristica_lanzamiento?: string | null;
    }[],
    Ataque_base: string;
    /** Solo en la ficha que llega de la API; el borrador de la creación los calcula (`totalesPersonaje`). */
    Totales?: PersonajeTotales;
    Ca: number;
    /** Solo en la ficha de la API (`equipo`…`dinero`); el borrador de la creación aún no tiene equipo. */
    Equipo?: PersonajeEquipoPiezaDto[];
    ModificadoresEquipo?: PersonajeModificadorEquipoDto[];
    Defensa?: PersonajeDefensaTotalesDto | null;
    PesoEquipo?: number;
    Dinero?: PersonajeDineroDto | null;
    Armadura_natural: number;
    Ca_desvio: number;
    Ca_varios: number;
    Presa: number;
    Presa_varios: {
        Valor: number;
        Origen: string;
    }[]
    Iniciativa_varios: {
        Valor: number;
        Origen: string;
    }[]
    Tipo_criatura: TipoCriatura;
    Subtipos: SubtipoRef[]
    Fuerza: number;
    ModFuerza: number;
    Destreza: number;
    ModDestreza: number;
    Constitucion: number;
    ModConstitucion: number;
    Caracteristicas_perdidas?: CaracteristicasPerdidas;
    Constitucion_perdida?: boolean;
    Inteligencia: number;
    ModInteligencia: number;
    Sabiduria: number;
    ModSabiduria: number;
    Carisma: number;
    ModCarisma: number;
    CaracteristicasVarios: {
        Fuerza: {
            valor: number;
            origen: string;
        }[];
        Destreza: {
            valor: number;
            origen: string;
        }[];
        Constitucion: {
            valor: number;
            origen: string;
        }[];
        Inteligencia: {
            valor: number;
            origen: string;
        }[];
        Sabiduria: {
            valor: number;
            origen: string;
        }[];
        Carisma: {
            valor: number;
            origen: string;
        }[];
    }
    NEP: number;
    Experiencia: number;
    Deidad: string;
    Alineamiento: string;
    Genero: string;
    Vida: number;
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
    Oficial: boolean;
    Dados_golpe: number;
    Pgs_lic: number;
    Jugador: string;
    Edad: number;
    Altura: number;
    Peso: number;
    Rds: {
        Modificador: string;
        Origen: string;
    }[]
    Rcs: {
        Modificador: string;
        Origen: string;
    }[]
    Res: {
        Modificador: string;
        Origen: string;
    }[]
    Oro_inicial: number;
    Escuela_especialista: {
        Nombre: string;
        Calificativo: string;
        /** Solo en la ficha de la API (`espaComodin`): «cualquiera» es que no tiene escuela especialista. */
        Comodin?: PersonajeExtraComodinDto | null;
    }
    Disciplina_especialista: {
        Nombre: string;
        Calificativo: string;
    }
    Disciplina_prohibida: string;
    Capacidad_carga: {
        Ligera: number;
        Media: number;
        Pesada: number;
    }
    Salvaciones: {
        fortaleza: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
        reflejos: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
        voluntad: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
    }
    Dominios: {
        Id?: number;
        Nombre: string;
    }[]
    competencia_arma: PersonajeCompetenciaDirecta[];
    competencia_armadura: PersonajeCompetenciaArmaduraDirecta[];
    competencia_grupo_arma: PersonajeCompetenciaDirecta[];
    competencia_grupo_armadura: PersonajeCompetenciaDirecta[];
    Plantillas: {
        Id: number;
        Nombre: string;
        Ataques: string;
        Ataque_completo: string;
        Id_tamano: number;
        Tamano: string;
        Id_tamano_pasos: number;
        Tamano_pasos: string;
        Id_dados_golpe: number;
        Dados_golpe: string;
        Id_dados_golpe_pasos: number;
        Dados_golpe_pasos: string;
        Actualiza_dgs: boolean;
        Multiplicador_dgs_lic: number;
        Tipo_dgs_lic: string;
        Suma_dgs_lic: number;
        Correr: number;
        Nadar: number;
        Volar: number;
        Maniobrabilidad: string;
        Trepar: number;
        Escalar: number;
        Ataque_base: number;
        Ca: string;
        Reduccion_dano: string;
        Resistencia_conjuros: string;
        Resistencia_elemental: string;
        Velocidades: string;
        Iniciativa: number;
        Presa: number;
        Ajuste_nivel: number;
        Heredada: boolean;
    }[]
    Familiares: FamiliarMonstruoDetalle[];
    Companeros: CompaneroMonstruoDetalle[];
    Conjuros: Conjuro[];
    Claseas: {
        Id?: number;
        Id_extra?: number;
        Nombre: string;
        Extra: string;
        /** Solo en la ficha de la API: qué comodín es el extra («Elegir», «Cualquiera») o `null`. */
        Extra_comodin?: PersonajeExtraComodinDto | null;
    }[]
    Raciales: RacialDetalle[];
    Habilidades: {
        Id: number;
        Nombre: string;
        Clasea: boolean;
        Entrenada?: boolean;
        Car: string;
        Mod_car: number;
        Rangos: number;
        Rangos_varios: number;
        Extra: string;
        Extra_bloqueado?: boolean;
        Varios: string;
        Custom: boolean;
        /** Solo en la ficha de la API: el total hecho y si el extra está por elegir. */
        Total?: number;
        Extra_comodin?: PersonajeExtraComodinDto | null;
        Soporta_extra?: boolean;
        Extras?: {
            Id_extra: number;
            Extra: string;
            Descripcion: string;
        }[];
        Bonos_varios?: {
            valor: number;
            origen: string;
        }[];
    }[]
    Dotes: DoteLegacy[];
    DotesContextuales: DoteContextual[];
    enemigosPredilectos?: EnemigoPredilectoSeleccion[];
    Auto_reparto?: {
        version: 'quiz_v1';
        respuestas: AutoRepartoCuestionario;
        score: AutoRepartoScore;
        ranking: CaracteristicaPerdidaKey[];
        top2: CaracteristicaPerdidaKey[];
        recomendacion: AutoRepartoRecomendacion | null;
        pregunta4Aplicada: boolean;
        aplicadoAutomaticamente: boolean;
        updatedAt: number;
    } | null;
    Ventajas: (string | {
        Id?: number;
        Nombre: string;
        Origen?: string;
    })[];
    Idiomas: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
        Origen?: string;
    }[];
    Sortilegas: AptitudSortilega[];
    Escuelas_prohibidas: Array<string | {
        Id?: number;
        Nombre: string;
    }>;
}
