export interface Tamano {
    Id: number;
    Nombre: string;
    Modificador: number;
    Modificador_presa: number;
    /**
     * El modificador de tamaño a Esconderse (Manual del jugador, Esconderse): Pequeño +4, Grande −4… Lo suman las
     * habilidades con `Modificador_tamano`. `null` si la caché aún no lo trae.
     */
    Modificador_esconderse?: number | null;
    /** Lo que se multiplica la carga de la tabla 9-1 para un bípedo de este tamaño; `null` si la caché aún no lo trae. */
    Multiplicador_carga?: number | null;
    /** Lo mismo para un cuadrúpedo. */
    Multiplicador_carga_cuadrupedo?: number | null;
    /** Su espacio, en pies (MJ tabla 8-4: Grande 10); `null` si la caché aún no lo trae. */
    Espacio?: number | null;
    /** Su alcance natural si es alta, en pies (Grande 10). */
    Alcance?: number | null;
    /** El de una criatura larga (Grande 5). */
    Alcance_largo?: number | null;
}