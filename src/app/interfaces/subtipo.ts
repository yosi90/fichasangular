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

/** Cuerpo de `POST /subtipos/add` y `PUT /subtipos/<id>` (el mismo; hito 9 del roadmap de inserciones). */
export interface SubtipoCuerpo {
    subtipo: {
        nombre: string;
        descripcion: string;
        id_manual: number;
        pagina: number;
        heredada: boolean;
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
        presa: number;
        fortaleza: number;
        reflejos: number;
        voluntad: number;
        iniciativa: number;
        ataque_base: number;
        /** Los textos que no modifican nada van `null` (la API guarda el texto de relleno). */
        ca: string | null;
        rd: string | null;
        rc: string | null;
        re: string | null;
        cd: string | null;
        tesoro: string | null;
        correr: number;
        nadar: number;
        volar: number;
        trepar: number;
        excavar: number;
        /** `null`: no vuela. */
        id_maniobrabilidad: number | null;
        id_alineamiento: number;
        oficial: boolean;
    };
    idiomas: number[];
    rasgos: number[];
    plantillas: number[];
    dotes: { id_dote: number; id_extra: number; }[];
    habilidades: { id_habilidad: number; id_extra: number; cantidad: number; varios: string | null; }[];
    sortilegas: { id_conjuro: number; nivel_lanzador: number; usos_diarios: string | null; }[];
}
