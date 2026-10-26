/** Una dote que da el poder concedido de un dominio (`GET /dominios`, `DominioCatalogo.Dotes`). */
export interface DominioDote {
    Id: number;
    Nombre: string;
    /** El arma, la escuela o la habilidad de la dote, según la dote; `null` sin extra fijo. */
    Id_extra: number | null;
    Extra: string | null;
    /** El extra es el arma predilecta de la deidad del personaje (Guerra). */
    Extra_arma_deidad: boolean;
    /** No se da si el personaje ya es competente con esa arma. */
    Solo_sin_competencia: boolean;
}

/** Una habilidad que el dominio hace de clase. `Id_extra` -1 sin extra; 0 («Elegir»), un hueco libre de su familia. */
export interface DominioHabilidadClasea {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number;
    Extra: string | null;
}

export interface DominioDetalle {
    Id: number;
    Nombre: string;
    Oficial: boolean;
    /** Lo que sigue solo lo trae el catálogo (`GET /dominios`); en los dominios de una deidad llega vacío. */
    /** El poder concedido, resumido con palabras propias; `null` si no se conoce. */
    Poder?: string | null;
    /** Los alineamientos básicos que pueden elegirlo (MJ cap. 3); vacía, cualquiera. */
    Alineamientos?: { Id: number; Nombre: string; }[];
    Dotes?: DominioDote[];
    Habilidades_claseas?: DominioHabilidadClasea[];
    Especiales?: { Id: number; Nombre: string; }[];
}
