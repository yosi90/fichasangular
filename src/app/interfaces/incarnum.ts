import { ManualReferencia } from './manual';

/*
 * Magic of Incarnum (roadmap `PAUSADO_incarnum`, fase 3). Contrato: `docs/publica/INCARNUM.md`, con el glosario aprobado
 * (fusión, esencia, moldeado, vínculo). Los catálogos nuevos (`/incarnum/fusiones`, `/incarnum/chakras`,
 * `/incarnum/capacidad-esencia`) y lo que ganan clases, dotes, raciales, especiales y la ficha.
 */

/** Un elemento del libro con su nombre en español, el original en inglés y si el español es nuestra traducción. */
export interface NombreTraducible {
    Id: number;
    Nombre: string;
    Nombre_original: string | null;
    Traducido: boolean;
}

/** Categoría de un chakra: `Orden` 1 mínimo, 2 menor, 3 mayor, 4 corazón, 5 alma, 6 tótem. */
export interface ChakraCategoria extends NombreTraducible {
    Orden: number;
}

/** `GET /incarnum/chakras`: los diez chakras y el del tótem, en su orden. */
export interface Chakra extends NombreTraducible {
    Categoria: ChakraCategoria | null;
    /** La ranura de objeto que cierra su vínculo; el tótem no tiene. */
    Ranura: { Id: number; Nombre: string; } | null;
    Orden: number;
    Descripcion: string | null;
}

/** Una fusión que se moldea o se vincula en un chakra (`ChakraDetalle.Fusiones`). */
export interface ChakraFusion extends NombreTraducible {
    Ocupa: boolean;
    Vinculo: boolean;
}

/** Una clase que abre el chakra y desde qué nivel. */
export interface ChakraClase {
    Id: number;
    Nombre: string;
    Nivel: number;
}

/** `GET /incarnum/chakras/{id}`: el chakra con sus fusiones y las clases que lo abren. */
export interface ChakraDetalle extends Chakra {
    Fusiones: ChakraFusion[];
    Clases: ChakraClase[];
}

/** Dónde se moldea una fusión y qué hace al vincularla a cada chakra (`Fusion.Chakras`). */
export interface FusionChakra extends NombreTraducible {
    /** Se puede moldear en ese chakra. */
    Ocupa: boolean;
    /** Tiene efecto al vincularla a él (el del tótem solo tiene vínculo). */
    Vinculo: boolean;
    Efecto_vinculo: string | null;
}

/** Un descriptor de la fusión; `Actitud`, el componente de alineamiento de un descriptor de alineamiento. */
export interface FusionDescriptor {
    Id: number;
    Nombre: string;
    Actitud: { Id: number; Nombre: string; } | null;
}

/** `GET /incarnum/fusiones` y `/incarnum/fusiones/{id}`. Los `Datos_*` son internos y no se enseñan. */
export interface Fusion extends NombreTraducible {
    Descripcion: string | null;
    Efecto_basico: string | null;
    Efecto_esencia: string | null;
    Origen_descripcion: string | null;
    Salvacion: { Tipo: string | null; Efecto: string | null; } | null;
    /** Toma el alineamiento de quien la moldea: el alineamiento no la limita. */
    Alineado_portador: boolean;
    Manual: ManualReferencia;
    Oficial: boolean;
    Clases: { Id: number; Nombre: string; }[];
    Descriptores: FusionDescriptor[];
    Chakras: FusionChakra[];
}

/** `GET /incarnum/capacidad-esencia`: un tramo de la tabla 2-1; el último no tiene tope y sube cada `Incremento_cada`. */
export interface CapacidadEsencia {
    Nivel_minimo: number;
    Nivel_maximo: number | null;
    Capacidad: number;
    Incremento_cada: number | null;
}

/** Una fila de la tabla de moldeado de la clase. */
export interface ClaseMoldeadoNivel {
    Nivel: number;
    Fusiones: number;
    Esencia: number;
    Vinculos: number;
}

/** Un chakra que la clase abre para vincular, desde su nivel. */
export interface ClaseMoldeadoChakra extends NombreTraducible {
    Nivel: number;
}

/** Bonificador de capacidad desde un nivel (total, sustituye al anterior); con `Chakra`, solo para la fusión vinculada a él. */
export interface ClaseMoldeadoCapacidad {
    Nivel: number;
    Bonificador: number;
    Chakra: NombreTraducible | null;
}

/** `Moldeado` de la clase: lo que dice que una clase es de moldeador (`null` si no moldea). */
export interface ClaseMoldeado {
    Divisor_nivel_moldeador: number;
    Caracteristica_cd: { Id: number; Nombre: string; } | null;
    Caracteristica_fusiones: { Id: number; Nombre: string; } | null;
    Limitado_por_alineamiento: boolean;
    Niveles: ClaseMoldeadoNivel[];
    Chakras: ClaseMoldeadoChakra[];
    Capacidad: ClaseMoldeadoCapacidad[];
    /** Desde un nivel, la fusión vinculada a ese chakra suma al nivel de moldeador (total; el tótem del totemista, +1 a nivel 6). */
    Nivel_moldeador_chakras: { Nivel: number; Bonificador: number; Chakra: NombreTraducible; }[];
    Fusiones: NombreTraducible[];
}

/** Una habilidad que es de clase solo con un alineamiento básico (`Habilidades.Por_alineamiento`). */
export interface ClaseHabilidadPorAlineamiento {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number | null;
    Extra: string | null;
    Alineamiento: { Id: number; Nombre: string; };
}

/** `Incarnum` de una dote. */
export interface DoteIncarnum {
    Esencia_reserva: number;
    /** Lo que suma si el personaje ya moldea fusiones (Esencia adicional); `null` si es lo mismo. */
    Esencia_reserva_moldeador: number | null;
    Receptaculo: boolean;
    Capacidad: { Bono: number; Ambito: 'fusiones' | 'dotes'; Tope_constitucion: boolean; } | null;
    /** El chakra elegido como extra queda abierto: se le vincula con los vínculos de sus clases (sin ninguno, uno de la dote). */
    Abre_chakra: boolean;
    /** Si la dote da una fusión, su nivel de moldeador es el nivel de personaje entre esto. */
    Divisor_nivel_moldeador: number | null;
    /** Si la dote da una fusión, la característica de su CD (Moldear fusión: Constitución). */
    Caracteristica_cd_fusion: { Id: number; Nombre: string; } | null;
    /** La característica del moldeado que cambia por otra (Moldeador muerto viviente: Constitución por Sabiduría). */
    Sustituye_caracteristica: { De: { Id: number; Nombre: string; }; Por: { Id: number; Nombre: string; }; } | null;
    /** PG por cada punto de la reserva de esencia (Corazón de incarnum). */
    Pg_por_esencia: number;
    /** PG por cada dote de `Tipo` (Cuerpo fortalecido por el incarnum: 2 por dote de incarnum). */
    Pg_por_dote: { Valor: number; Tipo: { Id: number; Nombre: string; }; } | null;
    /** Deja moldear las fusiones con estos descriptores aunque el alineamiento no lo permita. */
    Descriptores_sin_alineamiento: { Id: number; Nombre: string; }[];
}

/** Un bono a todas las pruebas de una habilidad y 1 más por cada `Fusiones_por_punto` fusiones moldeadas. */
export interface HabilidadPorFusiones {
    Habilidad: string;
    Ids_habilidad: number[];
    Bono: number;
    Fusiones_por_punto: number;
}

/** `Esencia` de un racial o un especial de clase. */
export interface EsenciaRasgo {
    Reserva: number;
    Receptaculo: boolean;
    /** El Saber racial del rilkan (vacío en los especiales). */
    Habilidades_por_fusiones: HabilidadPorFusiones[];
}

// --- El bloque `incarnum` de la ficha (calculado por la API) ---------------------------------------------------------

/** Un elemento de la ficha con su nombre traducible, en las claves de la ficha. */
export interface PersonajeIncarnumRef {
    id: number;
    nombre: string;
    nombreOriginal: string | null;
    traducido: boolean;
}

export interface PersonajeIncarnumParte {
    tipo: string;
    origen: string;
    valor: number;
}

/** Una CD de fusión de la ficha: `base` (10 + `modificador` de `caracteristica`) + la esencia invertida. */
export interface PersonajeIncarnumCd {
    base: number;
    caracteristica: string;
    modificador: number;
}

export interface PersonajeIncarnumClase {
    id: number;
    nombre: string;
    nivel: number;
    nivelMoldeador: number;
    /** El nivel de moldeador de la fusión vinculada a un chakra que lo sube (el tótem). */
    nivelMoldeadorChakras: { chakra: PersonajeIncarnumRef; nivelMoldeador: number; }[];
    fusionesTabla: number;
    fusionesMaximas: number;
    caracteristicaFusiones: string | null;
    esencia: number;
    vinculos: number;
    chakrasAbiertos: (PersonajeIncarnumRef & { nivel: number; })[];
    capacidadFusiones: number;
    capacidadChakras: { chakra: PersonajeIncarnumRef; capacidad: number; }[];
    cd: PersonajeIncarnumCd | null;
    limitadoPorAlineamiento: boolean;
}

export interface PersonajeIncarnumReceptaculo {
    tipo: 'dote' | 'racial' | 'especial';
    id: number;
    nombre: string;
    capacidad: number;
    esencia: number;
}

export interface PersonajeIncarnumFusionFormada {
    fusion: PersonajeIncarnumRef;
    clase: { id: number; nombre: string; } | null;
    chakra: PersonajeIncarnumRef;
    vinculo: PersonajeIncarnumRef | null;
    esencia: number;
    capacidad: number;
    nivelMoldeador: number | null;
    cd: number | null;
}

export interface PersonajeIncarnumFormacion {
    fusiones: PersonajeIncarnumFusionFormada[];
    esenciaInvertida: number;
}

/** `incarnum` de la ficha: `null` si el personaje no tiene nada de incarnum. */
export interface PersonajeIncarnum {
    nivelPersonaje: number;
    reserva: { total: number; desglose: PersonajeIncarnumParte[]; };
    /**
     * `bono`: el de la dote (+1); `tope`: el modificador de Constitución si la dote lo tiene, la capacidad que no pasa con
     * ella (nunca baja la que ya tenía), o `null`.
     */
    capacidad: { basica: number; modificadores: { origen: string; ambito: 'fusiones' | 'dotes'; bono: number; tope: number | null; }[]; };
    puedeMoldear: boolean;
    clases: PersonajeIncarnumClase[];
    chakrasDeDotes: { chakra: PersonajeIncarnumRef; dote: { id: number; nombre: string; }; }[];
    fusionesDeDotes: {
        fusion: PersonajeIncarnumRef;
        dote: { id: number; nombre: string; };
        nivelMoldeador: number | null;
        /** La CD de su fusión: `base` + la esencia invertida (`null` si la dote no la da). */
        cd: PersonajeIncarnumCd | null;
    }[];
    receptaculos: PersonajeIncarnumReceptaculo[];
    /** Los PG que dan sus dotes por la reserva o por cada dote de un tipo (ya van en sus PG: es su desglose). */
    puntosGolpe: PersonajeIncarnumParte[];
    /** Lo que suman sus raciales a una habilidad según las fusiones de la formación (el Saber racial del rilkan). */
    bonosHabilidad: { origen: string; habilidad: string; idsHabilidad: number[]; bono: number; fusiones: number; }[];
    formacion: PersonajeIncarnumFormacion | null;
}

// --- La formación de partida de `POST /personajes/add` (opcional) -----------------------------------------------------

export interface FormacionIncarnumFusionDto {
    idFusion: number;
    /** La clase de cuya lista sale; sin él, la fusión elegida con una dote (Moldear fusión). */
    idClase?: number | null;
    idChakra: number;
    idChakraVinculo?: number | null;
    esencia: number;
}

export interface FormacionIncarnumReceptaculoDto {
    tipo: 'dote' | 'racial' | 'especial';
    id: number;
    esencia: number;
}

export interface FormacionIncarnumDto {
    fusiones: FormacionIncarnumFusionDto[];
    receptaculos: FormacionIncarnumReceptaculoDto[];
}
