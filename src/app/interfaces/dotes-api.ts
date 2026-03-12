export interface DoteCreateDoteDto {
    nombre: string;
    beneficio: string;
    descripcion: string;
    normal: string;
    especial: string;
    id_manual: number;
    pagina: number;
    id_tipo: number;
    id_tipo2: number;
    oficial: boolean;
    repetible: boolean;
    repetible_distinto_extra: boolean;
    repetible_comb: boolean;
    comp_arma: boolean;
    extra_arma: boolean;
    extra_armadura_armaduras: boolean;
    extra_armadura_escudos: boolean;
    extra_escuela: boolean;
    extra_habilidad: boolean;
    [key: string]: any;
}

export interface DoteCreateExtrasDisponiblesDto {
    armas: number[];
    armaduras: number[];
    escuelas: number[];
    habilidades: number[];
    [key: string]: any;
}

export interface DoteCreateRequest {
    dote: DoteCreateDoteDto;
    modificadores?: Record<string, number>;
    habilidades_otorgadas?: Array<Record<string, any>>;
    extras_disponibles?: DoteCreateExtrasDisponiblesDto;
    prerrequisitos?: Record<string, Array<Record<string, any>>>;
    [key: string]: any;
}

export interface DoteCreateApiResponse {
    message: string;
    idDote: number;
    uid: string;
}

export interface DoteCreateResponse {
    message: string;
    idDote: number;
}
