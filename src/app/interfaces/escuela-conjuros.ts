export interface EscuelaConjuros {
    Id: number;
    Nombre: string;
    Nombre_especial: string;
    Prohibible: boolean;
    /** Si un mago puede especializarse en ella (Universal no; MJ cap. 3). Solo en el catálogo de escuelas. */
    Especializable?: boolean;
    /** Cuántas escuelas prohíbe quien se especializa en ella (2; la adivinación, 1). */
    Prohibidas_al_especializarse?: number;
}
