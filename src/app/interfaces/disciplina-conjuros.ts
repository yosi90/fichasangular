export interface DisciplinaConjuros {
    Id: number;
    Nombre: string;
    Nombre_especial: string;
    Subdisciplinas: Subdisciplinas[]
}

export interface Subdisciplinas {
    Id: number;
    Nombre: string;
}