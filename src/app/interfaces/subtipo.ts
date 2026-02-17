import { Alineamiento } from "./alineamiento";
import { Conjuro } from "./conjuro";
import { DoteContextual } from "./dote-contextual";
import { Rasgo } from "./rasgo";

export interface SubtipoRef {
    Id: number;
    Nombre: string;
}

export interface SubtipoManual {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface SubtipoCaracteristicas {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface SubtipoMovimientos {
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
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
    Manual: SubtipoManual;
    Heredada: boolean;
    Oficial: boolean;
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
    Manual: SubtipoManual;
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
    Movimientos: SubtipoMovimientos;
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
