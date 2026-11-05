import { ManualReferencia } from './manual';

export interface ReferenciaCorta {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface VentajaDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Disipable: boolean;
    Coste: number;
    Mejora: number;
    Caracteristica: boolean;
    Fuerza: boolean;
    Destreza: boolean;
    Constitucion: boolean;
    Inteligencia: boolean;
    Sabiduria: boolean;
    Carisma: boolean;
    Fortaleza: boolean;
    Reflejos: boolean;
    Voluntad: boolean;
    Iniciativa: boolean;
    Duplica_oro: boolean;
    Aumenta_oro: boolean;
    Idioma_extra: boolean;
    Manual: ManualReferencia;
    Rasgo: ReferenciaCorta;
    Idioma: ReferenciaCorta;
    Habilidad: ReferenciaCorta;
    Oficial?: boolean;
}

/** Ventaja (coste negativo: cuesta puntos) o desventaja (coste positivo: los da); cada una con su ruta y su permiso. */
export type TipoVentaja = 'ventaja' | 'desventaja';

/**
 * Lo que lleva `ventaja` o `desventaja` en `POST /<tipo>s/add` y `PUT /<tipo>s/<id>` (hito 8 del roadmap de
 * inserciones). `null` en una referencia es «ninguno».
 */
export interface VentajaCampos {
    nombre: string;
    descripcion: string;
    id_manual: number;
    pagina: number;
    coste: number;
    mejora: number;
    disipable: boolean;
    caracteristica: boolean;
    fuerza: boolean;
    destreza: boolean;
    constitucion: boolean;
    inteligencia: boolean;
    sabiduria: boolean;
    carisma: boolean;
    fortaleza: boolean;
    reflejos: boolean;
    voluntad: boolean;
    iniciativa: boolean;
    duplica_oro: boolean;
    aumenta_oro: boolean;
    idioma_extra: boolean;
    id_rasgo: number | null;
    id_idioma: number | null;
    id_habilidad: number | null;
}

export type VentajaCuerpo = { ventaja: VentajaCampos; } | { desventaja: VentajaCampos; };

export interface VentajaGuardada {
    message: string;
    id: number;
    ventaja: VentajaDetalle;
}
