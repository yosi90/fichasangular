export interface DisciplinaConjuros {
    Id: number;
    Nombre: string;
    Nombre_especial: string;
    Subdisciplinas: Subdisciplinas[]
    /** Si el psiónico puede elegirla. Solo en el catálogo de disciplinas. */
    Especializable?: boolean;
    /** Cuántas disciplinas prohíbe quien la elige (0: Manual de psiónica expandido). */
    Prohibidas_al_especializarse?: number;
}

export interface Subdisciplinas {
    Id: number;
    Nombre: string;
}