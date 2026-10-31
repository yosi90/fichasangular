import { Conjuro } from './conjuro';

export type ConjuroVariante = 'base' | 'psionico';

export interface ConjuroCreateCore {
    variante: ConjuroVariante;
    nombre: string;
    descripcion: string;
    id_manual: number;
    pagina: number;
    id_tiempo_lanz: number;
    id_alcance: number;
    objetivo: string;
    efecto: string;
    area: string;
    duracion: string;
    tipo_salvacion: string;
    descripcion_componentes: string;
    permanente: boolean;
    oficial: boolean;
    arcano?: boolean;
    divino?: boolean;
    id_escuela?: number;
    resistencia_conjuros?: boolean;
    id_disciplina?: number;
    id_subdisciplina?: number;
    puntos_poder?: number;
    descripcion_aumentos?: string;
    resistencia_poderes?: boolean;
    [key: string]: any;
}

export interface ConjuroCreateNivelRef {
    id_clase?: number;
    id_dominio?: number;
    id_disciplina?: number;
    nivel: number;
    espontaneo: boolean;
    [key: string]: any;
}

export interface ConjuroCreateRequest {
    conjuro: ConjuroCreateCore;
    componentes?: Array<number | { id?: number; id_componente?: number; [key: string]: any; }>;
    descriptores?: Array<number | { id?: number; id_descriptor?: number; [key: string]: any; }>;
    niveles_clase?: ConjuroCreateNivelRef[];
    niveles_dominio?: ConjuroCreateNivelRef[];
    niveles_disciplina?: ConjuroCreateNivelRef[];
    [key: string]: any;
}

/** La respuesta del alta (201) y de la edición (200): `conjuro` es la entrada ya guardada, como su `GET`. */
export interface ConjuroCreateApiResponse {
    message: string;
    idConjuro: number;
    conjuro: unknown;
}

export interface ConjuroCreateResponse {
    message: string;
    idConjuro: number;
    conjuro: ConjuroEditable;
}

/**
 * `GET /conjuros/<id>`: el conjuro con los ids del alta que el detalle no lleva, para abrirlo en «Modificar»
 * (`ConjuroEditable` del contrato, desde el 2026-10-31).
 */
export interface ConjuroEditable extends Conjuro {
    Id_manual: number;
    Pagina: number;
    Id_tiempo_lanzamiento: number;
    Id_alcance: number;
    /** 0 si no tiene. */
    Id_subdisciplina: number;
    /**
     * Los textos que la API da `null` (un texto de relleno de la base, como «no especifica»): el formulario los devuelve
     * como «No especifica», y no como un texto vacío, para que guardar sin cambios los deje igual.
     */
    Textos_sin_especificar: string[];
}
