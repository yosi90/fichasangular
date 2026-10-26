export interface GrupoCompetencia {
    Id: number;
    Nombre: string;
    /** Solo en los grupos de armas: el tipo de arma que cubre («Todas las armas marciales» → marcial); `null` si no es un tipo. */
    Tipo_arma?: { Id: number; Nombre: string; } | null;
}
