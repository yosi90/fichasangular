export interface ConjuroCatalogItem {
    Id: number;
    Nombre: string;
}

export interface SubdisciplinaCatalogItem extends ConjuroCatalogItem {
    id_disciplina: number;
}
