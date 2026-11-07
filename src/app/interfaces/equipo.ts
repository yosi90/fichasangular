import { ManualReferencia } from './manual';

/*
 * El modelo de objetos, equipo y armas (familia 1 de la importación de manuales). Contrato:
 * `docs/publica/endpoints/catalogos.md` («Equipo») y la guía `docs/publica/OBJETOS_FRONT.md`.
 */

/** Una referencia `{ Id, Nombre }` de los catálogos del equipo. */
export interface EquipoRef {
    Id: number;
    Nombre: string;
}

/** De dónde sale la descripción: escrita por nosotros (`propia`, un resumen) o el texto del SRD traducido. */
export type OrigenDescripcion = 'propia' | 'srd';

/** El manual de una entrada del equipo: como `ManualReferencia`, con la página que puede faltar. */
export type ManualDeEquipo = Omit<ManualReferencia, 'Pagina'> & { Pagina: number | null; };

/** Los campos de texto que comparten armas, armaduras, munición, materiales, aptitudes, objetos y conjuntos. */
export interface TextoEquipo {
    Descripcion: string;
    Origen_descripcion: OrigenDescripcion;
    Nombre_original: string | null;
    Traducido: boolean;
    /** `null` en los materiales y munición que no dicen su manual. */
    /** La página es `null` si el libro no la dice (algunos materiales de los scripts): «Modificar» la devuelve igual. */
    Manual: ManualDeEquipo | null;
}

export interface EquipoPropiedadArma extends EquipoRef {
    Descripcion: string;
}

export interface EquipoTipoObjeto extends EquipoRef {
    Categoria: CategoriaObjeto;
}

export type CategoriaObjeto = 'mundano' | 'magico' | 'psionico';

export interface EquipoRanura extends EquipoRef {
    Maximo: number;
}

export interface EquipoTipoBonificador extends EquipoRef {
    Apila: boolean;
}

export interface EquipoDanoPorTamano {
    Dano_mediano: string;
    Danos: { Id_tamano: number; Tamano: string; Dano: string | null; }[];
}

export interface EquipoRiquezaNivel {
    Nivel: number;
    /** La riqueza de un PJ de ese nivel (Guía del DM, tabla 5-1). */
    Po: number;
    /** El valor del equipo de un PNJ de ese nivel (Guía del DM, tabla 4-23); `null` si la tabla no lo da. */
    Po_pnj: number | null;
}

export interface EquipoOroInicialClase {
    Clase: EquipoRef;
    /** «6d4». */
    Dados: string;
    Multiplicador: number;
    Maximo: number;
}

/** Las piezas a las que se aplica el coste de un material. */
export type PiezaMaterial = 'arma' | 'municion' | 'armadura' | 'escudo';

/**
 * A qué se aplica cada coste de un material (`MaterialDetalle.Costes`): sus piezas y el manejo o el peso que pide. Una
 * pieza usa el coste de la primera que tenga el material, de la más concreta a la más general.
 */
export interface AplicacionMaterial extends EquipoRef {
    Piezas: PiezaMaterial[];
    Manejo: EquipoRef | null;
    Peso_armadura: EquipoRef | null;
}

/** `GET /equipo/catalogos`: los catálogos pequeños del equipo (caché de la RTDB `EquipoCatalogos`). */
export interface EquipoCatalogos {
    Manejos_armas: EquipoRef[];
    Propiedades_armas: EquipoPropiedadArma[];
    Tipos_dano: EquipoRef[];
    Tipos_arma: EquipoRef[];
    Pesos_armadura: EquipoRef[];
    Tipos_escudo: EquipoRef[];
    Tipos_objeto: EquipoTipoObjeto[];
    Ranuras: EquipoRanura[];
    Intensidades_aura: EquipoRef[];
    Tipos_activacion: EquipoRef[];
    Tipos_accion: EquipoRef[];
    Tipos_bonificador: EquipoTipoBonificador[];
    Objetivos_modificador: EquipoRef[];
    Empunaduras: EquipoRef[];
    Aplicaciones_material: AplicacionMaterial[];
    Danos_por_tamano: EquipoDanoPorTamano[];
    Riqueza_por_nivel: EquipoRiquezaNivel[];
    Oro_inicial_por_clase: EquipoOroInicialClase[];
}

/** Un modificador de un objeto o de una aptitud especial (capa de resistencia +1: salvaciones, resistencia, +1). */
export interface ModificadorEstructurado {
    Objetivo: EquipoRef | null;
    Tipo_bonificador: EquipoTipoBonificador | null;
    Valor: number;
    Caracteristica: EquipoRef | null;
    Habilidad: EquipoRef | null;
    Tipo_dano: EquipoRef | null;
    /** Lo condicional: se enseña y no se suma. */
    Condicion: string | null;
}

export interface EquipoAura {
    Intensidad: EquipoRef | null;
    Escuelas: EquipoRef[];
}

export interface MaterialCoste {
    Aplicacion: EquipoRef;
    Coste: number | null;
    Coste_por_libra: number | null;
    Multiplicador_precio: number | null;
    Coste_encantar: number | null;
}

export interface MaterialDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    Dureza: number | null;
    Pg_por_pulgada: number | null;
    Cuenta_como_gran_calidad: boolean;
    Supera_rd: boolean;
    Efectos: {
        Peso_multiplicador: number | null;
        Bon_des_mas: number | null;
        Penalizador_menos: number | null;
        Fallo_arcano_menos: number | null;
        Categoria_mas_ligera: boolean;
        Dano_mod: number | null;
    };
    Costes: MaterialCoste[];
    Oficial: boolean;
}

export interface MunicionDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    /** El precio y el peso son de un lote de `Cantidad_por_precio` piezas (20 flechas: 1 po y 3 lb). */
    Precio: number | null;
    /** `null` si el libro no lo dice: una pieza. */
    Cantidad_por_precio: number | null;
    Peso: number | null;
    Armas: EquipoRef[];
    Oficial: boolean;
}

export interface EncantamientoAplicaA {
    Arma_cuerpo_a_cuerpo: boolean;
    Arma_a_distancia: boolean;
    Municion: boolean;
    Armadura: boolean;
    Escudo: boolean;
}

/** Una aptitud especial de armas, armaduras, escudos y munición (`GET /encantamientos`). */
export interface EncantamientoDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    /** Bonificador equivalente; 0 si tiene precio fijo. */
    Modificador: number;
    /** Precio fijo en po. */
    Coste: number;
    Aplica_a: EncantamientoAplicaA;
    Tipos_dano_requeridos: EquipoRef[];
    Nivel_lanzador: number | null;
    Aura: EquipoAura;
    Requisitos: {
        Dotes: EquipoRef[];
        /** `Opcional` 0 es obligatorio; los alternativos llevan el mismo número de grupo (basta con uno). */
        Conjuros: (EquipoRef & { Opcional: number; })[];
    };
    Encantamiento_base: EquipoRef | null;
    Es_plantilla: boolean;
    Danos: { Dados: string; Tipo_dano: EquipoRef | null; Condicion: string | null; }[];
    Modificadores: ModificadorEstructurado[];
    Oficial: boolean;
}

export interface GenericoConjuro {
    Precio_por_nivel: number;
    Nivel_maximo: number | null;
    Usos_componente_caro: number | null;
}

/** Una aptitud especial de un arma o armadura mágica específica (`Cabeza` 2: la segunda cabeza de un arma doble). */
export interface EncantamientoDeObjeto extends EquipoRef {
    Descripcion: string;
    Modificador: number;
    Coste: number;
    Cabeza: number;
    Oficial: boolean;
}

export interface ObjetoDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    Tipo: EquipoTipoObjeto | null;
    Precio: number | null;
    Nivel_objeto: number | null;
    Peso: number | null;
    Ranura: EquipoRef | null;
    Nivel_lanzador: number | null;
    Aura: EquipoAura;
    Activaciones: (EquipoRef & { Accion: EquipoRef | null; })[];
    Cargas: number | null;
    /** Si sus cargas se recuperan cada día: entonces no se compra gastado (Guía del DM, pág. 199). */
    Cargas_se_recuperan: boolean;
    Usos_por_dia: number | null;
    Maldito: boolean;
    Inteligente: boolean;
    Reliquia: boolean;
    Requisitos_uso: string | null;
    Creacion: {
        Coste_po: number | null;
        Coste_px: number | null;
        Dias: number | null;
        Requisitos: { Dotes: EquipoRef[]; Conjuros: (EquipoRef & { Opcional: number; })[]; };
        Otros_requisitos: string | null;
    };
    Conjuros: (EquipoRef & { Nivel_lanzador: number | null; Cargas_por_uso: number | null; Usos_por_dia: number | null; })[];
    Modificadores: ModificadorEstructurado[];
    Conjunto: EquipoRef | null;
    /** Las monturas: el monstruo enlazado. */
    Monstruo: EquipoRef | null;
    /** Las armas y armaduras mágicas específicas (tipos 30 y 31): su base, mejora, material y aptitudes; `null` en los demás. */
    Arma_base: EquipoRef | null;
    Armadura_base: EquipoRef | null;
    Bonificador_mejora: number | null;
    /** El de la segunda cabeza de un arma doble. */
    Bonificador_mejora_2: number | null;
    Material: EquipoRef | null;
    Encantamientos: EncantamientoDeObjeto[];
    /** Pociones, pergaminos, varitas…: el genérico de un conjuro, con su fórmula. */
    Generico_conjuro: GenericoConjuro | null;
    Oficial: boolean;
}

export interface ConjuntoObjetosDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    Piezas: EquipoRef[];
    Bonificaciones: { Piezas: number; Descripcion: string; }[];
    Oficial: boolean;
}

/** Los filtros de `GET /objetos` (paginada, en el servidor). */
export interface FiltrosObjetos {
    tipo?: number | null;
    categoria?: CategoriaObjeto | null;
    ranura?: number | null;
    manual?: number | null;
    q?: string | null;
    /** `true`: solo las armas y armaduras mágicas específicas; `false`: solo los demás objetos. */
    especificas?: boolean | null;
    limit?: number;
    offset?: number;
}

export interface PaginaObjetos {
    items: ObjetoDetalle[];
    total: number;
    hayMas: boolean;
}

/** Los catálogos del equipo con listado y detalle propios en la web (además de armas y armaduras). */
export type TipoCatalogoEquipo = 'objeto' | 'material' | 'municion' | 'encantamiento' | 'conjunto';

/** Una entrada de esos catálogos con su tipo, para abrir su detalle. */
export type EntradaEquipo =
    | { tipo: 'objeto'; item: ObjetoDetalle }
    | { tipo: 'material'; item: MaterialDetalle }
    | { tipo: 'municion'; item: MunicionDetalle }
    | { tipo: 'encantamiento'; item: EncantamientoDetalle }
    | { tipo: 'conjunto'; item: ConjuntoObjetosDetalle };

/**
 * Lo que comparten los cuerpos del alta y la edición del equipo (`POST /armas/add`, `PUT /armas/<id>`…; hito 7 del
 * roadmap de inserciones): el nombre, la descripción propia o del SRD con su origen, el nombre original, el manual y su
 * página y si es oficial.
 */
export interface EquipoCuerpoComun {
    nombre: string;
    descripcion: string;
    origen_descripcion: OrigenDescripcion;
    nombre_original: string | null;
    traducido: boolean;
    id_manual: number;
    pagina: number;
    oficial: boolean;
}

/*
 * Los cuerpos del alta y la edición de munición, materiales, aptitudes especiales, objetos y conjuntos (`POST …/add` y
 * `PUT …/<id>`, el mismo cuerpo; segunda parte del hito 7 del roadmap de inserciones; `docs/publica/endpoints/
 * catalogos.md`, «Alta y edición de munición, materiales…»). Un solo permiso para los cinco: `objetos`.
 */

/** Lo común, con el manual y la página que pueden faltar (la munición y los materiales de los scripts). */
export type EquipoCuerpoComunSinManual = Omit<EquipoCuerpoComun, 'id_manual' | 'pagina'> & {
    id_manual: number | null;
    pagina: number | null;
};

export interface MunicionCuerpo {
    municion: EquipoCuerpoComunSinManual & {
        precio: number | null;
        cantidad_por_precio: number | null;
        peso: number | null;
    };
}

export interface MaterialCosteCuerpo {
    id_aplicacion: number;
    coste: number | null;
    coste_por_libra: number | null;
    multiplicador_precio: number | null;
    coste_encantar: number | null;
}

export interface MaterialCuerpo {
    material: EquipoCuerpoComunSinManual & {
        dureza: number | null;
        pg_por_pulgada: number | null;
        cuenta_como_gran_calidad: boolean;
        supera_rd: boolean;
        peso_multiplicador: number | null;
        bon_des_mas: number | null;
        penalizador_menos: number | null;
        fallo_arcano_menos: number | null;
        categoria_mas_ligera: boolean;
        dano_mod: number | null;
    };
    costes: MaterialCosteCuerpo[];
}

/** Un modificador estructurado en un cuerpo (aptitudes y objetos). */
export interface ModificadorCuerpo {
    id_objetivo: number;
    id_tipo_bonificador: number;
    valor: number;
    id_caracteristica: number | null;
    id_habilidad: number | null;
    id_tipo_dano: number | null;
    condicion: string | null;
}

/** Los requisitos de creación: `opcional` 0 es obligatorio; los alternativos, el mismo número de grupo. */
export interface RequisitosCuerpo {
    dotes: number[];
    conjuros: { id_conjuro: number; opcional: number; }[];
}

export interface EncantamientoCuerpo {
    encantamiento: EquipoCuerpoComun & {
        modificador: number;
        coste: number;
        aplica_arma_cc: boolean;
        aplica_arma_distancia: boolean;
        aplica_municion: boolean;
        aplica_armadura: boolean;
        aplica_escudo: boolean;
        nivel_lanzador: number | null;
        id_intensidad_aura: number | null;
        id_encantamiento_base: number | null;
        es_plantilla: boolean;
    };
    aura_escuelas: number[];
    tipos_dano: number[];
    requisitos: RequisitosCuerpo;
    danos: { dados: string; id_tipo_dano: number | null; condicion: string | null; }[];
    modificadores: ModificadorCuerpo[];
}

export interface ObjetoCuerpo {
    objeto: EquipoCuerpoComun & {
        id_tipo_objeto: number;
        precio: number | null;
        nivel_objeto: number | null;
        peso: number | null;
        id_ranura: number | null;
        nivel_lanzador: number | null;
        id_intensidad_aura: number | null;
        cargas: number | null;
        cargas_se_recuperan: boolean;
        usos_por_dia: number | null;
        maldito: boolean;
        inteligente: boolean;
        es_reliquia: boolean;
        requisitos_uso: string | null;
        coste_creacion_po: number | null;
        coste_creacion_px: number | null;
        dias_creacion: number | null;
        requisitos_otros: string | null;
        id_conjunto: number | null;
        id_monstruo: number | null;
        es_generico_conjuro: boolean;
        precio_por_nivel_conjuro: number | null;
        nivel_conjuro_maximo: number | null;
        usos_componente_caro: number | null;
        id_arma_base: number | null;
        id_armadura_base: number | null;
        bonificador_mejora: number | null;
        bonificador_mejora_2: number | null;
        id_material: number | null;
    };
    aura_escuelas: number[];
    activaciones: { id_tipo_activacion: number; id_tipo_accion: number | null; }[];
    requisitos: RequisitosCuerpo;
    conjuros: { id_conjuro: number; nivel_lanzador: number | null; cargas_por_uso: number | null; usos_por_dia: number | null; }[];
    modificadores: ModificadorCuerpo[];
    encantamientos: { id_encantamiento: number; cabeza: number; }[];
}

export interface ConjuntoObjetosCuerpo {
    conjunto: EquipoCuerpoComun;
    piezas: number[];
    bonificaciones: { piezas: number; descripcion: string; }[];
}
