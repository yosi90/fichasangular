export interface HabilidadExtraRef {
    Id_extra: number;
    Extra: string;
    Descripcion: string;
}

/** Una sinergia entre habilidades (MJ tabla 4-5; `HabilidadSinergia` de `GET /habilidades`). */
export interface ReglaSinergia {
    Id_habilidad_origen: number;
    Habilidad_origen: string;
    /** -1 si la regla va por la habilidad; si no, el extra que la identifica en cualquier hueco de su familia. */
    Id_extra_origen: number;
    Id_habilidad_destino: number;
    Habilidad_destino: string;
    Id_extra_destino: number;
    Rangos_minimos: number;
    Bonificador: number;
    /** `null`: cuenta siempre; con texto, solo en esas pruebas (se enseña y no se suma). */
    Condicion: string | null;
}

export interface HabilidadBasicaDetalle {
    Id_habilidad: number;
    Nombre: string;
    Id_caracteristica: number;
    Caracteristica: string;
    Descripcion: string;
    Soporta_extra: boolean;
    Entrenada: boolean;
    Extras: HabilidadExtraRef[];
    /** Cuántas veces sufre el penalizador de armadura (MJ tabla 4-2): 0, 1 o 2 (Nadar). */
    Penalizador_armadura?: number;
    /** Suma a sus pruebas el modificador de tamaño a Esconderse (`Modificador_esconderse` del tamaño): Esconderse. */
    Modificador_tamano?: boolean;
    /** Las sinergias que da esta habilidad (MJ tabla 4-5). */
    Sinergias?: ReglaSinergia[];
}

export interface HabilidadBonoVario {
    valor: number;
    origen: string;
}

export interface HabilidadCustomCreateRequest {
    nombre: string;
    id_caracteristica: number;
}

export type HabilidadCustomUpdateRequest = Partial<HabilidadCustomCreateRequest>;

export interface HabilidadCustomMutationApiResponse {
    message?: string;
    idHabilidad?: number;
    id_habilidad?: number;
    habilidad?: HabilidadBasicaDetalle;
}

export interface HabilidadCustomMutationResponse {
    message: string;
    idHabilidad: number;
    habilidad: HabilidadBasicaDetalle;
}
