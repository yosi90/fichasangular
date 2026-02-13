import { ManualAsociadoDetalle, ManualAsociados } from '../interfaces/manual-asociado';
import { ManualReferenciaTipo } from '../interfaces/manual-referencia-navegacion';

export type ManualSeccionKey = keyof ManualAsociados;
type ManualIncludeFlag =
    | 'Incluye_dotes'
    | 'Incluye_conjuros'
    | 'Incluye_plantillas'
    | 'Incluye_monstruos'
    | 'Incluye_razas'
    | 'Incluye_clases'
    | 'Incluye_tipos'
    | 'Incluye_subtipos';

export type TipoEntidadConIcono = ManualReferenciaTipo | 'manual';

export const ICONOS_ENTIDAD: Record<TipoEntidadConIcono, string> = {
    manual: 'auto_stories',
    dote: 'star',
    conjuro: 'auto_fix_high',
    clase: 'school',
    raza: 'group',
    tipo: 'label',
    plantilla: 'view_in_ar',
    monstruo: 'pets',
    subtipo: 'category',
};

export interface ManualSeccionConfig {
    key: ManualSeccionKey;
    label: string;
    includeFlag: ManualIncludeFlag;
    tipo: ManualReferenciaTipo;
}

export interface ManualCategoriaConIcono {
    key: ManualSeccionKey;
    label: string;
    tipo: ManualReferenciaTipo;
    icono: string;
}

export const MANUAL_SECCIONES_CONFIG: ManualSeccionConfig[] = [
    { key: 'Dotes', label: 'Dotes', includeFlag: 'Incluye_dotes', tipo: 'dote' },
    { key: 'Conjuros', label: 'Conjuros', includeFlag: 'Incluye_conjuros', tipo: 'conjuro' },
    { key: 'Clases', label: 'Clases', includeFlag: 'Incluye_clases', tipo: 'clase' },
    { key: 'Razas', label: 'Razas', includeFlag: 'Incluye_razas', tipo: 'raza' },
    { key: 'Tipos', label: 'Tipos', includeFlag: 'Incluye_tipos', tipo: 'tipo' },
    { key: 'Plantillas', label: 'Plantillas', includeFlag: 'Incluye_plantillas', tipo: 'plantilla' },
    { key: 'Monstruos', label: 'Monstruos', includeFlag: 'Incluye_monstruos', tipo: 'monstruo' },
    { key: 'Subtipos', label: 'Subtipos', includeFlag: 'Incluye_subtipos', tipo: 'subtipo' },
];

export function getManualTipoPorSeccion(key: ManualSeccionKey): ManualReferenciaTipo | null {
    const seccion = MANUAL_SECCIONES_CONFIG.find((item) => item.key === key);
    return seccion?.tipo ?? null;
}

export function isManualSeccionIncluida(
    manual: ManualAsociadoDetalle | null | undefined,
    key: ManualSeccionKey
): boolean {
    if (!manual)
        return false;

    const seccion = MANUAL_SECCIONES_CONFIG.find((item) => item.key === key);
    if (!seccion)
        return false;

    return !!manual[seccion.includeFlag];
}

export function getManualCategorias(manual: ManualAsociadoDetalle | null | undefined): ManualCategoriaConIcono[] {
    if (!manual)
        return [];

    return MANUAL_SECCIONES_CONFIG
        .filter((item) => !!manual[item.includeFlag])
        .map((item) => ({
            key: item.key,
            label: item.label,
            tipo: item.tipo,
            icono: ICONOS_ENTIDAD[item.tipo],
        }));
}
