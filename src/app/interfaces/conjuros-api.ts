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
    uid?: string;
    firebaseUid?: string;
    conjuro: ConjuroCreateCore;
    componentes?: Array<number | { id?: number; id_componente?: number; [key: string]: any; }>;
    descriptores?: Array<number | { id?: number; id_descriptor?: number; [key: string]: any; }>;
    niveles_clase?: ConjuroCreateNivelRef[];
    niveles_dominio?: ConjuroCreateNivelRef[];
    niveles_disciplina?: ConjuroCreateNivelRef[];
    [key: string]: any;
}

export interface ConjuroCreateResponse {
    message: string;
    idConjuro: number;
    uid: string;
}
