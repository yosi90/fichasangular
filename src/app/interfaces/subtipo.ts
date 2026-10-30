import { Alineamiento } from "./alineamiento";
import { Comodin } from "./comodin";
import { Movimientos } from "./movimientos";
import { Conjuro } from "./conjuro";
import { DoteContextual } from "./dote-contextual";
import { Rasgo } from "./rasgo";
import { ManualReferencia } from "./manual";

export interface SubtipoRef {
    Id: number;
    Nombre: string;
}

export interface SubtipoCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface SubtipoHabilidadBase {
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
    Cantidad: number;
    Varios: string;
}

export interface SubtipoHabilidadCustom {
    Id_habilidad: number;
    Habilidad: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Cantidad: number;
}

export interface SubtipoHabilidades {
    Base: SubtipoHabilidadBase[];
    Custom: SubtipoHabilidadCustom[];
}

export interface SubtipoSortilega {
    Conjuro: Conjuro;
    Nivel_lanzador: number;
    Usos_diarios: string;
}

export interface SubtipoResumen {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Heredada: boolean;
    Oficial: boolean;
    /** El ajuste de nivel del subtipo (el NEP de la creación lo suma); 0 si la caché aún no lo trae. */
    Ajuste_nivel?: number;
}

export interface SubtipoReferenciaCorta {
    Id: number;
    Nombre: string;
    Descripcion: string;
}

export interface SubtipoDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ManualReferencia;
    Heredada: boolean;
    Oficial: boolean;
    Modificadores_caracteristicas: SubtipoCaracteristicas;
    Minimos_caracteristicas: SubtipoCaracteristicas;
    Ajuste_nivel: number;
    Presa: number;
    Fortaleza: number;
    Reflejos: number;
    Voluntad: number;
    Iniciativa: number;
    Ataque_base: number;
    Ca: string;
    Rd: string;
    Rc: string;
    Re: string;
    Cd: string;
    Tesoro: string;
    Movimientos: Movimientos;
    Maniobrabilidad: Record<string, any>;
    Alineamiento: Alineamiento;
    Idiomas: {
        Id: number;
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
    }[];
    Dotes: DoteContextual[];
    Habilidades: SubtipoHabilidades;
    Sortilegas: SubtipoSortilega[];
    Rasgos: Rasgo[];
    Plantillas: SubtipoReferenciaCorta[];
}
