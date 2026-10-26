export interface Tamano {
    Id: number;
    Nombre: string;
    Modificador: number;
    Modificador_presa: number;
    /** Lo que se multiplica la carga de la tabla 9-1 para un bípedo de este tamaño; `null` si la caché aún no lo trae. */
    Multiplicador_carga?: number | null;
    /** Lo mismo para un cuadrúpedo. */
    Multiplicador_carga_cuadrupedo?: number | null;
}