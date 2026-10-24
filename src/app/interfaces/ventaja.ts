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
