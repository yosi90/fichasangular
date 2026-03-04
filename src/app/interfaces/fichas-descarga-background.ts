export interface FichasDescargaOpciones {
    incluirConjuros: boolean;
    incluirFamiliares: boolean;
    incluirCompaneros: boolean;
}

export type FichasDescargaJobEstado = 'running' | 'error';

export interface FichasDescargaJobView {
    id: string;
    personajeNombre: string;
    estado: FichasDescargaJobEstado;
    mensaje: string;
}
