export type PrerequisiteCatalogKey =
    | 'alineamientos'
    | 'armaduras'
    | 'armas'
    | 'clases'
    | 'conjuros'
    | 'dominios'
    | 'dotes'
    | 'escuelas'
    | 'especiales'
    | 'extras'
    | 'grupos_arma'
    | 'grupos_armadura'
    | 'habilidades'
    | 'idiomas'
    | 'razas'
    | 'regiones'
    | 'subtipos'
    | 'tamanos'
    | 'tipos_criatura'
    | 'tipos_dote';

export type PrerequisiteType =
    | 'actitud_prohibido'
    | 'actitud_requerido'
    | 'alineamiento_prohibido'
    | 'alineamiento_requerido'
    | 'ataque_base'
    | 'caracteristica'
    | 'clase_especial'
    | 'competencia_arma'
    | 'competencia_armadura'
    | 'competencia_grupo_arma'
    | 'competencia_grupo_armadura'
    | 'conjuros_escuela'
    | 'dg'
    | 'dominio'
    | 'dote'
    | 'escuela_nivel'
    | 'habilidad'
    | 'idioma'
    | 'inherente'
    | 'lanz_espontaneo'
    | 'lanzador_arcano'
    | 'lanzador_divino'
    | 'lanzador_psionico'
    | 'lanzar_conjuros_arcanos_nivel'
    | 'lanzar_conjuros_divinos_nivel'
    | 'limite_tipo_dote'
    | 'nivel'
    | 'nivel_de_clase'
    | 'nivel_max'
    | 'poder_seleccionar_companero'
    | 'poder_seleccionar_familiar'
    | 'raza'
    | 'region'
    | 'reserva_psionica'
    | 'salvacion_minimo'
    | 'conjuro_conocido'
    | 'conocer_poder_psionico'
    | 'genero'
    | 'lanzar_poder_psionico_nivel'
    | 'no_raza'
    | 'subtipo'
    | 'tamano_maximo'
    | 'tamano_minimo'
    | 'tipo_criatura'
    | 'tipo_dote';

export type PrerequisiteEditorKind =
    | 'flag-only'
    | 'value-only'
    | 'catalog-only'
    | 'catalog-plus-value'
    | 'catalog-plus-special';

export interface PrerequisiteCatalogItem {
    id: number;
    nombre: string;
}

export interface PrerequisiteRowModel {
    uid: string;
    tipo: PrerequisiteType;
    id: number;
    valor: number;
    opcional: number;
    id_extra: number | null;
    repetido: number;
    requiere_extra: boolean;
    salvacion_tipo: 'fortaleza' | 'reflejos' | 'voluntad';
}

export interface PrerequisiteCatalogContext {
    getCatalog(type: PrerequisiteType): PrerequisiteCatalogItem[];
    getCatalogName(type: PrerequisiteType, id: number): string;
    getDoteExtraOptions(idDote: number): PrerequisiteCatalogItem[];
    dotePermiteExtra(idDote: number): boolean;
    getGlobalExtraOptions(): PrerequisiteCatalogItem[];
    habilidadPermiteExtra(idHabilidad: number): boolean;
    especialPermiteExtra(idEspecial: number): boolean;
}

export interface PrerequisiteEditorDefinition {
    type: PrerequisiteType;
    label: string;
    requiredCatalogs: PrerequisiteCatalogKey[];
    editorKind: PrerequisiteEditorKind;
    catalogLabel?: string;
    valueLabel?: string;
    usesSaveSelector?: boolean;
    supportsRepeated?: boolean;
    supportsExtraSelector?: boolean;
    supportsCatalogExtraOptions?: boolean;
    supportsRequiresExtra?: boolean;
    isComplete(row: PrerequisiteRowModel): boolean;
    toPayload(
        row: PrerequisiteRowModel,
        catalogs: PrerequisiteCatalogContext
    ): Record<string, any> | null;
    createDefaultRow(): PrerequisiteRowModel;
}

export interface PrerequisiteGroupModel {
    type: PrerequisiteType;
    label: string;
    definition: PrerequisiteEditorDefinition;
    rows: PrerequisiteRowModel[];
}
