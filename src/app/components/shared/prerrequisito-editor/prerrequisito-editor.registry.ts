import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteCatalogKey,
    PrerequisiteEditorDefinition,
    PrerequisiteEditorKind,
    PrerequisiteRowModel,
    PrerequisiteType,
} from './prerrequisito-editor.models';

function toInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function withOpcional(base: Record<string, any>, payload: Record<string, any>): Record<string, any> {
    const out = { ...base };
    Object.keys(payload).forEach((key) => {
        const value = payload[key];
        if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value)))
            return;
        out[key] = value;
    });
    return out;
}

function createDefaultRow(type: PrerequisiteType): PrerequisiteRowModel {
    return {
        uid: `pre_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        tipo: type,
        id: 0,
        valor: 1,
        opcional: 0,
        id_extra: null,
        repetido: 1,
        requiere_extra: false,
        salvacion_tipo: 'fortaleza',
    };
}

function buildBase(row: PrerequisiteRowModel): Record<string, any> {
    const opcional = Math.max(0, toInt(row.opcional, 0));
    return opcional > 0 ? { Opcional: opcional } : {};
}

function isValueOnlyComplete(row: PrerequisiteRowModel): boolean {
    return toInt(row.valor, 0) > 0;
}

function isCatalogOnlyComplete(row: PrerequisiteRowModel): boolean {
    return toInt(row.id, 0) > 0;
}

function isCatalogValueComplete(row: PrerequisiteRowModel): boolean {
    return toInt(row.id, 0) > 0 && toInt(row.valor, 0) > 0;
}

function buildCatalogPayload(
    row: PrerequisiteRowModel,
    context: PrerequisiteCatalogContext
): Record<string, any> | null {
    const tipo = row.tipo;
    const id = toInt(row.id, 0);
    const valor = toInt(row.valor, 0);
    const base = buildBase(row);

    if (tipo === 'actitud_prohibido' || tipo === 'actitud_requerido')
        return { ...base, Id_actitud: id, Actitud: context.getCatalogName(tipo, id) };
    if (tipo === 'alineamiento_prohibido' || tipo === 'alineamiento_requerido')
        return { ...base, Id_alineamiento: id, Alineamiento: context.getCatalogName(tipo, id) };
    if (tipo === 'caracteristica')
        return { ...base, Id_caracteristica: id, Caracteristica: context.getCatalogName(tipo, id), Cantidad: valor };
    if (tipo === 'clase_especial')
        return withOpcional(base, { Id_especial: id, Clase_especial: context.getCatalogName(tipo, id), Id_extra: row.id_extra });
    if (tipo === 'competencia_arma')
        return { ...base, Id_arma: id, Arma: context.getCatalogName(tipo, id) };
    if (tipo === 'competencia_armadura')
        return { ...base, Id_armadura: id, Armadura: context.getCatalogName(tipo, id) };
    if (tipo === 'competencia_grupo_arma')
        return { ...base, Id_grupo: id, Grupo: context.getCatalogName(tipo, id) };
    if (tipo === 'competencia_grupo_armadura')
        return { ...base, Id_grupo: id, Grupo: context.getCatalogName(tipo, id) };
    if (tipo === 'conjuros_escuela')
        return { ...base, Id_escuela: id, Escuela: context.getCatalogName(tipo, id), Cantidad: valor };
    if (tipo === 'conjuro_conocido')
        return { ...base, Id_conjuro: id, Conjuro: context.getCatalogName(tipo, id) };
    if (tipo === 'conocer_poder_psionico')
        return { ...base, Id_conjuro: id, Conjuro: context.getCatalogName(tipo, id) };
    if (tipo === 'dominio')
        return { ...base, Id_dominio: id, Dominio: context.getCatalogName(tipo, id) };
    if (tipo === 'dote')
        return withOpcional(base, {
            Id_dote_prerrequisito: id,
            Dote_prerrequisito: context.getCatalogName(tipo, id),
            Repetido: Math.max(1, toInt(row.repetido, 1)),
            Id_extra: row.id_extra
        });
    if (tipo === 'escuela_nivel')
        return { ...base, Id_escuela: id, Escuela: context.getCatalogName(tipo, id), Nivel: valor };
    if (tipo === 'habilidad')
        return { ...base, Id_habilidad: id, Habilidad: context.getCatalogName(tipo, id), Cantidad: valor, Requiere_extra: row.requiere_extra };
    if (tipo === 'idioma')
        return { ...base, Id_idioma: id, Idioma: context.getCatalogName(tipo, id) };
    if (tipo === 'inherente')
        return { ...base, Id_especial: id, Clase_especial: context.getCatalogName(tipo, id) };
    if (tipo === 'lanz_espontaneo')
        return { ...base, Id_conjuro: id, Conjuro: context.getCatalogName(tipo, id) };
    if (tipo === 'limite_tipo_dote')
        return { ...base, Id_tipo: id, Tipo_dote: context.getCatalogName(tipo, id), Cantidad: valor };
    if (tipo === 'nivel_de_clase')
        return { ...base, Id_clase: id, Clase: context.getCatalogName(tipo, id), Nivel: valor };
    if (tipo === 'raza')
        return { ...base, Id_raza: id, Raza: context.getCatalogName(tipo, id) };
    if (tipo === 'no_raza')
        return { ...base, Id_raza: id, Raza: context.getCatalogName(tipo, id) };
    if (tipo === 'region')
        return { ...base, Id_region: id, Region: context.getCatalogName(tipo, id) };
    if (tipo === 'salvacion_minimo') {
        const payload = { ...base, Fortaleza: 0, Reflejos: 0, Voluntad: 0 };
        if (row.salvacion_tipo === 'fortaleza')
            payload.Fortaleza = valor;
        else if (row.salvacion_tipo === 'reflejos')
            payload.Reflejos = valor;
        else
            payload.Voluntad = valor;
        return payload;
    }
    if (tipo === 'tamano_maximo' || tipo === 'tamano_minimo')
        return { ...base, Id_tamano: id, Tamano: context.getCatalogName(tipo, id) };
    if (tipo === 'subtipo')
        return { ...base, Id_subtipo: id, Subtipo: context.getCatalogName(tipo, id) };
    if (tipo === 'tipo_criatura')
        return { ...base, Id_tipo: id, Tipo: context.getCatalogName(tipo, id) };
    if (tipo === 'tipo_dote')
        return { ...base, Id_tipo: id, Tipo_dote: context.getCatalogName(tipo, id) };
    return null;
}

function buildValuePayload(row: PrerequisiteRowModel): Record<string, any> {
    const tipo = row.tipo;
    const valor = toInt(row.valor, 0);
    const base = buildBase(row);

    if (tipo === 'ataque_base' || tipo === 'dg' || tipo === 'nivel' || tipo === 'nivel_max' || tipo === 'reserva_psionica')
        return { ...base, Cantidad: valor };

    return { ...base, Nivel: valor };
}

function buildFlagPayload(row: PrerequisiteRowModel): Record<string, any> {
    const base = buildBase(row);
    return Object.keys(base).length > 0 ? base : { Activo: true };
}

function definition(
    type: PrerequisiteType,
    label: string,
    editorKind: PrerequisiteEditorKind,
    config: Partial<Omit<PrerequisiteEditorDefinition, 'type' | 'label' | 'editorKind' | 'isComplete' | 'toPayload' | 'createDefaultRow'>> & {
        isComplete?: PrerequisiteEditorDefinition['isComplete'];
        toPayload?: PrerequisiteEditorDefinition['toPayload'];
    } = {}
): PrerequisiteEditorDefinition {
    return {
        type,
        label,
        editorKind,
        requiredCatalogs: config.requiredCatalogs ?? [],
        catalogLabel: config.catalogLabel,
        valueLabel: config.valueLabel,
        usesSaveSelector: config.usesSaveSelector,
        supportsRepeated: config.supportsRepeated,
        supportsExtraSelector: config.supportsExtraSelector,
        supportsCatalogExtraOptions: config.supportsCatalogExtraOptions,
        supportsRequiresExtra: config.supportsRequiresExtra,
        isComplete: config.isComplete ?? (() => true),
        toPayload: config.toPayload ?? (() => null),
        createDefaultRow: () => createDefaultRow(type),
    };
}

export const PREREQUISITE_EDITOR_DEFINITIONS: PrerequisiteEditorDefinition[] = [
    definition('actitud_prohibido', 'Actitud prohibida', 'catalog-only', {
        catalogLabel: 'Actitud',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('actitud_requerido', 'Actitud requerida', 'catalog-only', {
        catalogLabel: 'Actitud',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('alineamiento_prohibido', 'Alineamiento prohibido', 'catalog-only', {
        requiredCatalogs: ['alineamientos'],
        catalogLabel: 'Alineamiento',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('alineamiento_requerido', 'Alineamiento requerido', 'catalog-only', {
        requiredCatalogs: ['alineamientos'],
        catalogLabel: 'Alineamiento',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('ataque_base', 'Minimo de ataque base', 'value-only', {
        valueLabel: 'Ataque base minimo',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('caracteristica', 'Minimo de caracteristicas', 'catalog-plus-value', {
        catalogLabel: 'Caracteristica',
        valueLabel: 'Puntuacion minima',
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('clase_especial', 'Tener X habilidad clasea', 'catalog-plus-special', {
        requiredCatalogs: ['especiales', 'extras'],
        catalogLabel: 'Especial',
        supportsExtraSelector: true,
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('competencia_arma', 'Competencia con arma', 'catalog-only', {
        requiredCatalogs: ['armas'],
        catalogLabel: 'Arma',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('competencia_armadura', 'Competencia con armadura', 'catalog-only', {
        requiredCatalogs: ['armaduras'],
        catalogLabel: 'Armadura',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('competencia_grupo_arma', 'Competencia con grupo de armas', 'catalog-only', {
        requiredCatalogs: ['grupos_arma'],
        catalogLabel: 'Grupo arma',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('competencia_grupo_armadura', 'Competencia con grupo de armaduras', 'catalog-only', {
        requiredCatalogs: ['grupos_armadura'],
        catalogLabel: 'Grupo armadura',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('conjuros_escuela', 'Conocer X cantidad de conjuros de una escuela', 'catalog-plus-value', {
        requiredCatalogs: ['escuelas'],
        catalogLabel: 'Escuela',
        valueLabel: 'Cantidad minima',
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('conjuro_conocido', 'Conjuro conocido', 'catalog-only', {
        requiredCatalogs: ['conjuros'],
        catalogLabel: 'Conjuro',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('conocer_poder_psionico', 'Conocer poder psionico concreto', 'catalog-only', {
        requiredCatalogs: ['conjuros'],
        catalogLabel: 'Poder',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('dg', 'Cantidad de DGs minima', 'value-only', {
        valueLabel: 'DG minimos',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('genero', 'Genero requerido', 'catalog-only', {
        catalogLabel: 'Genero',
        isComplete: isCatalogOnlyComplete,
        toPayload: (row) => ({ ...buildBase(row), Id_genero: toInt(row.id, 0), Genero: row.id === 1 ? 'Masculino' : row.id === 2 ? 'Femenino' : 'Otro' }),
    }),
    definition('dominio', 'Dominio requerido', 'catalog-only', {
        requiredCatalogs: ['dominios'],
        catalogLabel: 'Dominio',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('dote', 'Dote ya elegida requerida', 'catalog-plus-special', {
        requiredCatalogs: ['dotes'],
        catalogLabel: 'Dote',
        supportsRepeated: true,
        supportsExtraSelector: true,
        supportsCatalogExtraOptions: true,
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('escuela_nivel', 'Nivel minimo en una escuela de magia', 'catalog-plus-value', {
        requiredCatalogs: ['escuelas'],
        catalogLabel: 'Escuela',
        valueLabel: 'Nivel minimo',
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('habilidad', 'Minimo de rangos en habilidad concreta', 'catalog-plus-value', {
        requiredCatalogs: ['habilidades'],
        catalogLabel: 'Habilidad',
        valueLabel: 'Rangos minimos',
        supportsRequiresExtra: true,
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('idioma', 'Hablar un idioma', 'catalog-only', {
        requiredCatalogs: ['idiomas'],
        catalogLabel: 'Idioma',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('inherente', 'Habilidad inherente a raza y/o clase', 'catalog-only', {
        requiredCatalogs: ['especiales'],
        catalogLabel: 'Especial',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('lanz_espontaneo', 'Lanzar X conjuro espontaneo', 'catalog-only', {
        requiredCatalogs: ['conjuros'],
        catalogLabel: 'Conjuro',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('lanzador_arcano', 'Nivel de lanzador arcano', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('lanzador_divino', 'Nivel de lanzador divino', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('lanzador_psionico', 'Nivel de manifestador', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('lanzar_conjuros_arcanos_nivel', 'Nivel minimo de conjuro arcano', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('lanzar_conjuros_divinos_nivel', 'Nivel minimo de conjuro divino', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('lanzar_poder_psionico_nivel', 'Nivel minimo de poder psionico', 'value-only', {
        valueLabel: 'Nivel',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('limite_tipo_dote', 'Limitada a X dotes de X tipo', 'catalog-plus-value', {
        requiredCatalogs: ['tipos_dote'],
        catalogLabel: 'Tipo dote',
        valueLabel: 'Cantidad maxima',
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('nivel', 'Nivel minimo de personaje', 'value-only', {
        valueLabel: 'Nivel minimo personaje',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('nivel_de_clase', 'Nivel minimo de clase', 'catalog-plus-value', {
        requiredCatalogs: ['clases'],
        catalogLabel: 'Clase',
        valueLabel: 'Nivel minimo clase',
        isComplete: isCatalogValueComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('nivel_max', 'Nivel maximo de personaje', 'value-only', {
        valueLabel: 'Nivel maximo personaje',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('poder_seleccionar_companero', 'Poder elegir un compañero nuevo', 'flag-only', {
        isComplete: () => true,
        toPayload: (row) => buildFlagPayload(row),
    }),
    definition('poder_seleccionar_familiar', 'Poder elegir un familiar nuevo', 'flag-only', {
        isComplete: () => true,
        toPayload: (row) => buildFlagPayload(row),
    }),
    definition('raza', 'Raza requerida', 'catalog-only', {
        requiredCatalogs: ['razas'],
        catalogLabel: 'Raza',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('no_raza', 'Raza prohibida', 'catalog-only', {
        requiredCatalogs: ['razas'],
        catalogLabel: 'Raza',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('region', 'Region requerida', 'catalog-only', {
        requiredCatalogs: ['regiones'],
        catalogLabel: 'Region',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('reserva_psionica', 'Reserva psionica minima', 'value-only', {
        valueLabel: 'Reserva minima',
        isComplete: isValueOnlyComplete,
        toPayload: (row) => buildValuePayload(row),
    }),
    definition('salvacion_minimo', 'Puntuacion minima en una salvacion', 'catalog-plus-value', {
        valueLabel: 'Puntuacion minima',
        usesSaveSelector: true,
        isComplete: isValueOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('tamano_maximo', 'Tamaño máximo', 'catalog-only', {
        requiredCatalogs: ['tamanos'],
        catalogLabel: 'Tamaño',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('tamano_minimo', 'Tamaño mínimo', 'catalog-only', {
        requiredCatalogs: ['tamanos'],
        catalogLabel: 'Tamaño',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('subtipo', 'Subtipo requerido', 'catalog-only', {
        requiredCatalogs: ['subtipos'],
        catalogLabel: 'Subtipo',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('tipo_criatura', 'Ser un tipo especifico de criatura', 'catalog-only', {
        requiredCatalogs: ['tipos_criatura'],
        catalogLabel: 'Tipo criatura',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
    definition('tipo_dote', 'Tener dotes con tipo especifico', 'catalog-only', {
        requiredCatalogs: ['tipos_dote'],
        catalogLabel: 'Tipo dote',
        isComplete: isCatalogOnlyComplete,
        toPayload: buildCatalogPayload,
    }),
];

const PREREQUISITE_DEFINITION_MAP = new Map<PrerequisiteType, PrerequisiteEditorDefinition>(
    PREREQUISITE_EDITOR_DEFINITIONS.map((item) => [item.type, item])
);

export function getPrerequisiteDefinition(type: PrerequisiteType): PrerequisiteEditorDefinition {
    const definition = PREREQUISITE_DEFINITION_MAP.get(type);
    if (!definition)
        throw new Error(`Prerequisite definition not found for type "${type}"`);
    return definition;
}

export function getPrerequisiteCatalogsForTypes(types: PrerequisiteType[]): PrerequisiteCatalogKey[] {
    const keys = new Set<PrerequisiteCatalogKey>();
    types.forEach((type) => {
        getPrerequisiteDefinition(type).requiredCatalogs.forEach((key) => keys.add(key));
    });
    return Array.from(keys);
}

export function buildPrerequisitePayload(
    rows: PrerequisiteRowModel[],
    context: PrerequisiteCatalogContext
): Record<string, Array<Record<string, any>>> {
    const payload: Record<string, Array<Record<string, any>>> = {};

    rows.forEach((row) => {
        const definition = getPrerequisiteDefinition(row.tipo);
        const entry = definition.toPayload(row, context);
        if (!entry)
            return;
        if (!Array.isArray(payload[row.tipo]))
            payload[row.tipo] = [];
        payload[row.tipo].push(entry);
    });

    return payload;
}

export function arePrerequisitesIncomplete(rows: PrerequisiteRowModel[], selectedTypes: PrerequisiteType[]): boolean {
    if (selectedTypes.length < 1)
        return false;

    return selectedTypes.some((type) => {
        const definition = getPrerequisiteDefinition(type);
        const typedRows = rows.filter((row) => row.tipo === type);
        if (typedRows.length < 1)
            return true;
        return typedRows.some((row) => !definition.isComplete(row));
    });
}

export function syncPrerequisiteRows(
    rows: PrerequisiteRowModel[],
    selectedTypes: PrerequisiteType[]
): PrerequisiteRowModel[] {
    const selected = new Set(selectedTypes);
    let next = rows.filter((row) => selected.has(row.tipo));

    selectedTypes.forEach((type) => {
        if (!next.some((row) => row.tipo === type))
            next = [...next, getPrerequisiteDefinition(type).createDefaultRow()];
    });

    return next;
}

export function updatePrerequisiteRow(
    rows: PrerequisiteRowModel[],
    uid: string,
    patch: Partial<PrerequisiteRowModel>,
    context: PrerequisiteCatalogContext
): PrerequisiteRowModel[] {
    return rows.map((row) => {
        if (row.uid !== uid)
            return row;

        const next = { ...row, ...patch };
        const definition = getPrerequisiteDefinition(next.tipo);

        if (definition.supportsRequiresExtra && !context.habilidadPermiteExtra(next.id))
            next.requiere_extra = false;
        if (next.tipo === 'habilidad' && !next.requiere_extra)
            next.id_extra = null;
        if (next.tipo === 'dote' && !context.dotePermiteExtra(next.id))
            next.id_extra = null;
        if (next.tipo === 'clase_especial' && !context.especialPermiteExtra(next.id))
            next.id_extra = null;
        if (!definition.supportsExtraSelector)
            next.id_extra = null;

        return next;
    });
}

export function findCatalogName(
    type: PrerequisiteType,
    id: number,
    catalog: PrerequisiteCatalogItem[]
): string {
    return `${catalog.find((item) => toInt(item.id, 0) === toInt(id, 0))?.nombre ?? ''}`.trim();
}
