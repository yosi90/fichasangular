export interface IdiomaDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Secreto: boolean;
    Oficial: boolean;
}

export interface IdiomaMutacionRequest {
    nombre: string;
    descripcion: string;
    secreto: boolean;
    oficial: boolean;
}

export type IdiomaCreateRequest = IdiomaMutacionRequest;
export type IdiomaUpdateRequest = Partial<IdiomaMutacionRequest>;

export interface IdiomaMutacionApiResponse {
    message?: string;
    idIdioma?: number;
    idioma?: IdiomaDetalle;
}

export interface IdiomaMutacionResponse {
    message: string;
    idIdioma: number;
    idioma: IdiomaDetalle;
}
