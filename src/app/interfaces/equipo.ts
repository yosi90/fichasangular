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

/** Los campos de texto que comparten armas, armaduras, munición, materiales, aptitudes, objetos y conjuntos. */
export interface TextoEquipo {
    Descripcion: string;
    Origen_descripcion: OrigenDescripcion;
    Nombre_original: string | null;
    Traducido: boolean;
    /** `null` en los materiales y munición que no dicen su manual. */
    Manual: ManualReferencia | null;
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
    Po: number;
}

export interface EquipoOroInicialClase {
    Clase: EquipoRef;
    /** «6d4». */
    Dados: string;
    Multiplicador: number;
    Maximo: number;
}

/** `GET /equipo/catalogos`: los catálogos pequeños del equipo (caché de la RTDB `EquipoCatalogos`). */
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
    Cantidad_por_precio: number;
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
        Conjuros: (EquipoRef & { Opcional: boolean; })[];
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
    Usos_componente_caro: number;
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
    Usos_por_dia: number | null;
    Maldito: boolean;
    Inteligente: boolean;
    Reliquia: boolean;
    Requisitos_uso: string | null;
    Creacion: {
        Coste_po: number | null;
        Coste_px: number | null;
        Dias: number | null;
        Requisitos: { Dotes: EquipoRef[]; Conjuros: EquipoRef[]; };
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
