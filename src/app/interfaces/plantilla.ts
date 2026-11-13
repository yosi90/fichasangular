import { PrerrequisitoItem } from "./prerrequisito";
import { ArmaNaturalCreate, ArmaNaturalPlantilla } from "./arma-natural";
import { Alineamiento } from "./alineamiento";
import { Comodin } from "./comodin";
import { Conjuro } from "./conjuro";
import { DoteContextual } from "./dote-contextual";
import { Id_nombre } from "./genericas";
import { Maniobrabilidad } from "./maniobrabilidad";
import { Movimientos } from "./movimientos";
import { RacialDetalle } from "./racial";
import { SubtipoRef } from "./subtipo";
import { Tamano } from "./tamaño";
import { ManualReferencia } from "./manual";

export interface PlantillaTipoDado {
    Id_tipo_dado: number;
    Nombre: string;
}

export interface PlantillaModificacionRef {
    Id_paso_modificacion: number;
    Nombre: string;
}

export interface PlantillaCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

/**
 * Lo que cambian Fue, Des y Con en la forma animal (y la híbrida) de un licántropo: la puntuación del animal −10 si es
 * par o −11 si es impar (Manual de monstruos 1, «Licántropo»; un lobo, +2, +4, +4). No vale en su forma humanoide; los PG
 * de los DG del animal usan la Con de esta forma. 0 en las plantillas sin forma animal.
 */
export interface PlantillaFormaAnimal {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
}

export interface PlantillaLicantroniaDg {
    Id_dado: number;
    Dado: string;
    Multiplicador: number;
    Suma: number;
    /** El tipo de esos DG (el animal) con sus puntos de habilidad por DG; `null` si la plantilla no lo dice. */
    Tipo_criatura?: { Id: number; Nombre: string; Puntos_habilidad: number; } | null;
    /**
     * Los **base** de esos DG por las progresiones de su tipo (la API, desde el 2026-11-06: un lobo, animal de 2 DG, +1,
     * +3, +3, +0), que se suman a los del personaje; `null` sin tipo o en una caché de antes. Las columnas de la
     * plantilla con esos nombres son las del animal en su forma.
     */
    Ataque_base?: number | null;
    Fortaleza?: number | null;
    Reflejos?: number | null;
    Voluntad?: number | null;
}

export interface PlantillaPuntosHabilidad {
    Suma: number;
    Suma_fija: number;
}

export interface PlantillaHabilidadRef {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion: string;
    Soporta_extra: boolean;
    Entrenada: boolean;
    Id_extra: number;
    Extra: string;
    /** «elegir» si el extra está por escoger, «cualquiera» si vale cualquiera. */
    Extra_comodin?: Comodin | null;
    Rangos: number;
    Varios: string;
}

export interface PlantillaSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
    Dg: number;
}

/** Una aptitud racial o un ataque especial que da la plantilla, con los DG desde los que lo da. */
export interface PlantillaRacialContextual {
    Racial: RacialDetalle;
    Dg: number;
}

export interface PlantillaPrerrequisitosFlags {
    actitud_requerido?: boolean;
    actitud_prohibido?: boolean;
    alineamiento_requerido?: boolean;
    caracteristica?: boolean;
    criaturas_compatibles?: boolean;
    /** Nivel de lanzador mínimo, arcano o divino (el liche: 11). Desde la auditoría de las reglas del 2026-10-26. */
    nivel_lanzador?: boolean;
    /** Una dote que debe tener la criatura base (el liche: Fabricar objeto maravilloso). */
    dote?: boolean;
    /** El tamaño mínimo y máximo de la criatura base (las plantillas de los manuales, desde el 2026-10-29). */
    tamano_minimo?: boolean;
    tamano_maximo?: boolean;
    /** Los DG totales mínimos de la criatura base. */
    dg?: boolean;
    /** Un subtipo que tiene que tener y uno que no puede tener. */
    subtipo?: boolean;
    subtipo_prohibido?: boolean;
    /** Una clase y su nivel (el liche seco), y manifestar poderes de un nivel (el erudito espectral). Desde el 2026-11-13. */
    nivel_de_clase?: boolean;
    lanzar_poder_psionico_nivel?: boolean;
}

export type PlantillaPrerrequisitoItem = PrerrequisitoItem;

export interface PlantillaPrerrequisitos {
    actitud_requerido: PlantillaPrerrequisitoItem[];
    actitud_prohibido: PlantillaPrerrequisitoItem[];
    alineamiento_requerido: PlantillaPrerrequisitoItem[];
    caracteristica: PlantillaPrerrequisitoItem[];
    criaturas_compatibles: PlantillaPrerrequisitoItem[];
    nivel_lanzador?: PlantillaPrerrequisitoItem[];
    dote?: PlantillaPrerrequisitoItem[];
    /** `{ Id_tamano, Tamano, Opcional, Frase }`: el tamaño de la criatura base, con los pasos de las plantillas ya elegidas. */
    tamano_minimo?: PlantillaPrerrequisitoItem[];
    tamano_maximo?: PlantillaPrerrequisitoItem[];
    /** `{ Cantidad, Opcional, Frase }`: los DG totales (raciales, de clase y de plantilla). */
    dg?: PlantillaPrerrequisitoItem[];
    /** `{ Id_subtipo, Subtipo, Opcional, Frase }`: los subtipos de la raza y de las plantillas ya elegidas. */
    subtipo?: PlantillaPrerrequisitoItem[];
    subtipo_prohibido?: PlantillaPrerrequisitoItem[];
    /** `{ Id_clase, Clase, Nivel, Opcional, Frase }`: los niveles que tiene en esa clase (como el de las dotes). */
    nivel_de_clase?: PlantillaPrerrequisitoItem[];
    /** `{ Nivel, Opcional, Frase }`: el nivel de poder psiónico más alto que manifiesta (como el de las dotes). */
    lanzar_poder_psionico_nivel?: PlantillaPrerrequisitoItem[];
}

export interface PlantillaCompatibilidadTipo {
    Id_tipo_comp: number;
    Id_tipo_nuevo: number;
    Tipo_comp?: string;
    Tipo_nuevo?: string;
    /** «cualquiera»: la criatura conserva su tipo. */
    Tipo_nuevo_comodin?: Comodin | null;
    Opcional: number;
}

export interface Plantilla {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Tamano: Tamano;
    Tipo_dado: PlantillaTipoDado;
    /** «elegir»: la plantilla no cambia el dado de golpe (la regla que aplica la web). */
    Tipo_dado_comodin?: Comodin | null;
    Actualiza_dg: boolean;
    Modificacion_dg: PlantillaModificacionRef;
    Modificacion_tamano: PlantillaModificacionRef;
    Iniciativa: number;
    Velocidades: string;
    Ca: string;
    Ataque_base: number;
    Presa: number;
    Ataques: string;
    Ataque_completo: string;
    Reduccion_dano: string;
    Resistencia_conjuros: string;
    Resistencia_elemental: string;
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
    /** Lo que cambia en todas las formas de la criatura (en un licántropo, el +2 a Sab). */
    Modificadores_caracteristicas: PlantillaCaracteristicas;
    /** Lo que cambian las físicas en la forma animal de un licántropo (desde el 2026-11-06). */
    Modificadores_forma_animal: PlantillaFormaAnimal;
    Minimos_caracteristicas: PlantillaCaracteristicas;
    Ajuste_nivel: number;
    /** Los DG del animal base de un licántropo; `null` en las demás plantillas, que no añaden DG de animal. */
    Licantronia_dg: PlantillaLicantroniaDg | null;
    Cd: number;
    Puntos_habilidad: PlantillaPuntosHabilidad;
    Nacimiento: boolean;
    /**
     * Lo que cuesta adquirirla con el personaje ya creado (desde el 2026-11-13): los PX, las po y los niveles que pierde
     * antes (el liche, 4.800 PX y 120.000 po; el necropolita, 1 nivel, 1.000 PX y 3.000 po). 0 si nada.
     */
    Coste_al_adquirir?: PlantillaCosteAlAdquirir;
    Movimientos: Movimientos;
    Maniobrabilidad: Maniobrabilidad;
    Alineamiento: Alineamiento;
    /** Lo que dice el manual de la criatura con la plantilla; `null` si no lo da (desde el 2026-10-29). */
    Entorno: string | null;
    Organizacion: string | null;
    /** Valor de desafío: el ajuste («igual que la criatura base +2») o la tabla por DG resumida. */
    Vd: string | null;
    Tesoro: string | null;
    Avance: string | null;
    /** El nombre en inglés de una plantilla de un libro en inglés, traducida por nosotros; `null` si no. */
    Nombre_original: string | null;
    Traducido: boolean;
    Oficial: boolean;
    /**
     * El animal del que sale un licántropo generado (los licántropos automáticos, 2026-11-06): se regenera al editar ese
     * monstruo y no se modifica a mano (`PUT` da 409 `plantilla_generada`). `null` en las demás.
     */
    Monstruo_forma_animal?: { Id: number; Nombre: string; } | null;
    Dotes: DoteContextual[];
    Subtipos: SubtipoRef[];
    /**
     * Los rasgos de su tipo que no tiene la criatura con la plantilla, aunque sean de su tipo (desde el 2026-11-07): el
     * fantasma de *La senda de los fantasmas* es ajeno sin «sin alma (ajenos)» ni su visión en la oscuridad.
     */
    Rasgos_tipo_quitados?: Id_nombre[];
    Habilidades: PlantillaHabilidadRef[];
    Sortilegas: PlantillaSortilega[];
    Raciales: PlantillaRacialContextual[];
    Ataques_especiales: PlantillaRacialContextual[];
    /** Las armas naturales que da o quita, con su forma y su modo (`Ataques` y `Ataque_completo` son su descripción). */
    Armas_naturales?: ArmaNaturalPlantilla[];
    Prerrequisitos_flags: PlantillaPrerrequisitosFlags;
    Prerrequisitos: PlantillaPrerrequisitos;
    Compatibilidad_tipos: PlantillaCompatibilidadTipo[];
}

/**
 * Los escalares de `PlantillaCreateRequest.plantilla` (`POST /plantillas/add`; contrato en `docs/publica/endpoints/catalogos.md`
 * y la OpenAPI, `PlantillaCreateCore`). Los textos de la ficha del manual y `nombre_original` son opcionales (desde el
 * 2026-10-29): vacíos se mandan a `null`.
 */
export interface PlantillaEscalaresRequest {
    nombre: string;
    descripcion: string;
    id_manual: number;
    pagina: number;
    id_tamano: number;
    id_mod_tam: number;
    id_tipo_dado: number;
    act_dg: boolean;
    id_mod_dg: number;
    iniciativa: number;
    velocidades: string;
    ca: string;
    ataque_base: number;
    presa: number;
    ataques: string;
    ataque_completo: string;
    reduccion_dano: string;
    resistencia_conjuros: string;
    resistencia_elemental: string;
    cd: number;
    fortaleza: number;
    reflejos: number;
    voluntad: number;
    fuerza: number;
    destreza: number;
    constitucion: number;
    inteligencia: number;
    sabiduria: number;
    carisma: number;
    min_fuerza: number;
    min_destreza: number;
    min_constitucion: number;
    min_inteligencia: number;
    min_sabiduria: number;
    min_carisma: number;
    ajuste_nivel: number;
    mult_dg_lic: number;
    id_tipo_dado_lic: number;
    suma_dg_lic: number;
    id_tipo_criatura_dg_lic: number;
    fue_forma_animal: number;
    des_forma_animal: number;
    con_forma_animal: number;
    puntos_hab_suma_fija: number;
    puntos_hab_suma: number;
    nacimiento: boolean;
    correr: number;
    nadar: number;
    volar: number;
    trepar: number;
    excavar: number;
    id_maniobrabilidad: number;
    id_alineamiento: number;
    oficial: boolean;
    entorno: string | null;
    organizacion: string | null;
    vd: string | null;
    tesoro: string | null;
    avance: string | null;
    nombre_original: string | null;
    traducido: boolean;
    /** Lo que cuesta adquirirla (desde el 2026-11-13); sin él, la edición conserva el que tiene. */
    coste_al_adquirir?: { px: number; po: number; niveles_perdidos: number; };
}

/** `PlantillaCreateRequest.prerrequisitos`: cada familia con sus campos de escritura en minúscula. */
export interface PlantillaPrerrequisitosRequest {
    actitud_requerido: { id_actitud: number; opcional: number; }[];
    actitud_prohibido: { id_actitud: number; opcional: number; }[];
    alineamiento_requerido: { id_alineamiento: number; opcional: number; }[];
    caracteristica: { id_caracteristica: number; cantidad: number; opcional: number; }[];
    criaturas_compatibles: { id_tipo_comp: number; id_tipo_nuevo: number; opcional: number; }[];
    nivel_lanzador: { nivel: number; opcional: number; }[];
    dote: { id_dote: number; opcional: number; }[];
    tamano_minimo: { id_tamano: number; opcional: number; }[];
    tamano_maximo: { id_tamano: number; opcional: number; }[];
    dg: { cantidad: number; opcional: number; }[];
    subtipo: { id_subtipo: number; opcional: number; }[];
    subtipo_prohibido: { id_subtipo: number; opcional: number; }[];
    nivel_de_clase: { id_clase: number; nivel: number; opcional: number; }[];
    lanzar_poder_psionico_nivel: { nivel: number; opcional: number; }[];
}

/** El cuerpo de `POST /plantillas/add`. */
export interface PlantillaCreateRequest {
    plantilla: PlantillaEscalaresRequest;
    prerrequisitos: PlantillaPrerrequisitosRequest;
    subtipos: number[];
    /** Los ids de los rasgos de tipo que quita; si no viene, la edición conserva los que hay. */
    rasgos_tipo_quitados?: number[];
    dotes: { id_dote: number; id_extra?: number; dg: number; solo_si_cumple?: boolean; adicional?: boolean; }[];
    habilidades: { id_habilidad: number; rangos: number; id_extra?: number; varios?: string; }[];
    sortilegas: { id_conjuro: number; nivel_lanzador: number; usos_diarios: string; dg: number; }[];
    raciales: { id_racial: number; dg: number; }[];
    ataquesEspeciales: { id_racial: number; dg: number; }[];
    /** Las armas naturales con su modo y su forma; si no viene, la edición conserva las que hay. */
    armas_naturales?: ArmaNaturalCreate[];
}

/** Lo que devuelve el alta (`PlantillaCreateResponse`), con la plantilla ya normalizada. */
export interface PlantillaMutacionResponse {
    message: string;
    idPlantilla: number;
    plantilla: Plantilla | null;
}

/** Lo que cuesta adquirir una plantilla (`Coste_al_adquirir`). */
export interface PlantillaCosteAlAdquirir {
    Px: number;
    Po: number;
    Niveles_perdidos: number;
}
