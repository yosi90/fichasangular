export interface Manual {
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
}

/** El manual en el que viene un elemento del catálogo y su página: la referencia de dotes, clases, armas… */
export interface ManualReferencia {
    Id: number;
    Nombre: string;
    Pagina: number;
}

/** Las banderas de contenido de un manual (`Incluye_*`), las que cambia `PATCH /manuales/<id>`. */
export type BanderasManual = Pick<Manual, 'Incluye_dotes' | 'Incluye_conjuros' | 'Incluye_plantillas' | 'Incluye_monstruos'
    | 'Incluye_razas' | 'Incluye_clases' | 'Incluye_tipos' | 'Incluye_subtipos'>;

/** Cuerpo de `POST /manuales/add`: el nombre, si es oficial y las banderas de contenido. */
export interface ManualCuerpo extends BanderasManual {
    nombre: string;
    oficial: boolean;
}
