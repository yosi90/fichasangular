export interface ReferenciaCorta {
    Id: number;
    Nombre: string;
    Descripcion: string;
    [key: string]: any;
}

export interface ManualAsociados {
    Dotes: ReferenciaCorta[];
    Conjuros: ReferenciaCorta[];
    Plantillas: ReferenciaCorta[];
    Monstruos: ReferenciaCorta[];
    Razas: ReferenciaCorta[];
    Clases: ReferenciaCorta[];
    Tipos: ReferenciaCorta[];
    Subtipos: ReferenciaCorta[];
}

export interface ManualAsociadoDetalle {
    Id: number;
    Nombre: string;
    Incluye_dotes: boolean;
    Incluye_conjuros: boolean;
    Incluye_plantillas: boolean;
    Incluye_monstruos: boolean;
    Incluye_razas: boolean;
    Incluye_clases: boolean;
    Incluye_tipos: boolean;
    Incluye_subtipos: boolean;
    Oficial: boolean;
    Asociados: ManualAsociados;
}

