export type PrerequisiteCatalogKey =
    | 'alineamientos'
    | 'aptitudes_especiales'
    | 'armaduras'
    | 'armas'
    | 'clases'
    | 'conjuros'
    | 'deidades'
    | 'dominios'
    | 'dotes'
    | 'escuelas'
    | 'especiales'
    | 'extras'
    | 'generos'
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
    | 'aptitud_especial'
    | 'armas_naturales'
    | 'ataque_base'
    | 'caracteristica'
    | 'clase_especial'
    | 'competencia_arma'
    | 'competencia_armadura'
    | 'competencia_grupo_arma'
    | 'competencia_grupo_armadura'
    | 'conjuros_escuela'
    | 'criaturas_compatibles'
    | 'deidad'
    | 'dg'
    | 'dominio'
    | 'dote'
    | 'escuela_nivel'
    | 'habilidad'
    | 'idioma'
    | 'lanz_espontaneo'
    | 'lanzador_arcano'
    | 'lanzador_divino'
    | 'lanzador_psionico'
    | 'lanzar_conjuros_arcanos_nivel'
    | 'lanzar_conjuros_divinos_nivel'
    | 'limite_tipo_dote'
    | 'nivel'
    | 'nivel_de_clase'
    | 'nivel_lanzador'
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
    | 'subtipo_prohibido'
    | 'tamano_maximo'
    | 'tamano_minimo'
    | 'tipo_criatura'
    | 'tipo_dote'
    | TipoEditorMutacion;

/**
 * Un tipo de prerrequisito de una raza mutada en el editor: `mutacion.<clave>`. Sus claves son datos de la API
 * (`GET /razas/mutaciones/modelo`, fase 3 de las razas mutadas) y sus definiciones se registran al leerlo
 * (`registrarTiposDeMutacion`); el prefijo las separa de las de dotes, clases y plantillas aunque compartan la clave.
 */
export type TipoEditorMutacion = `mutacion.${string}`;

export type PrerequisiteEditorKind =
    | 'flag-only'
    | 'value-only'
    | 'catalog-only'
    | 'catalog-plus-value'
    | 'catalog-plus-special'
    /** Dos elementos del mismo catálogo: el que se pide y en qué se convierte (`criaturas_compatibles` de las plantillas). */
    | 'catalog-pair'
    /** Un texto (la condición que confirma el máster de una raza mutada). */
    | 'text-only';

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
    /** El segundo elemento de un tipo `catalog-pair`: el tipo de criatura nuevo de `criaturas_compatibles` (0, «cualquiera»: conserva su tipo). */
    id_destino?: number;
    /** Los extras que pide una `habilidad` con «requiere extra» (Saber (arcano)…): `Extras` del cuerpo. */
    extras?: number[];
    /** El comodín 0 de su catálogo elegido (`comodinLabel` de su tipo: «El arma elegida»): la fila apunta al id 0 y está completa. */
    comodin?: boolean;
    /** El texto de un tipo `text-only` (la condición que confirma el máster). */
    texto?: string;
}

export interface PrerequisiteCatalogContext {
    getCatalog(type: PrerequisiteType): PrerequisiteCatalogItem[];
    getCatalogName(type: PrerequisiteType, id: number): string;
    getDoteExtraOptions(idDote: number): PrerequisiteCatalogItem[];
    dotePermiteExtra(idDote: number): boolean;
    getGlobalExtraOptions(): PrerequisiteCatalogItem[];
    habilidadPermiteExtra(idHabilidad: number): boolean;
    /** Los extras de esa habilidad, para elegir los que pide una fila con «requiere extra». Sin él, `getGlobalExtraOptions`. */
    getHabilidadExtraOptions?(idHabilidad: number): PrerequisiteCatalogItem[];
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
    /**
     * El comodín 0 de su catálogo como opción del selector (la «Competencia con el arma elegida» de Soltura con un arma):
     * su etiqueta. Elegirlo deja la fila en el id 0 con `comodin` y la da por completa.
     */
    comodinLabel?: string;
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
