import { Dote } from 'src/app/interfaces/dote';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { toInt, toText } from './normalizacion';

/**
 * «Modificar dote» (hito 4 del roadmap de inserciones): la dote de `GET /dotes/<id>` como el estado del formulario de
 * `nueva-dote`, para que guardar sin cambios mande lo mismo que hay (`PUT /dotes/<id>` reemplaza la dote entera).
 */

/** Una fila de «Habilidades otorgadas» del formulario. `id_extra` -1: sin extra (0 es el extra «Elegir»). */
export interface HabilidadOtorgadaFila {
    id_habilidad: number;
    id_extra: number;
    rangos: number;
    /** De `habilidades_custom` (la dote lo dice al cargarla; si no, el formulario lo deduce del catálogo). */
    custom?: boolean;
}

export interface ModificadorFila {
    key: string;
    value: number;
}

/**
 * Un prerrequisito que el editor compartido no puede enseñar como fila y que se devuelve tal cual al guardar: los que
 * apuntan al comodín 0 de su catálogo (la «Competencia con el arma elegida» de Soltura con un arma, `Id_arma` 0).
 */
export interface PrerrequisitoConservado {
    fila: PrerequisiteRowModel;
    frase: string;
}

/** Las claves de `Modificadores` de la lectura que no son la de la escritura en minúscula. */
const MODIFICADOR_DE_LECTURA: Readonly<Record<string, string>> = {
    Armadura_natural: 'arm_nat',
    Ataque_base: 'ata_base',
};

/** Los modificadores de la dote distintos de 0, como filas del formulario (con la clave del alta). */
export function modificadoresDeDote(dote: Dote): ModificadorFila[] {
    return Object.entries(dote?.Modificadores ?? {})
        .map(([clave, valor]) => ({ key: MODIFICADOR_DE_LECTURA[clave] ?? clave.toLowerCase(), value: toInt(valor) }))
        .filter((fila) => fila.value !== 0);
}

export function habilidadesOtorgadasDeDote(dote: Dote): HabilidadOtorgadaFila[] {
    return (dote?.Habilidades_otorgadas ?? []).map((habilidad) => ({
        id_habilidad: toInt(habilidad.Id_habilidad),
        id_extra: habilidad.Id_extra === null || habilidad.Id_extra === undefined ? -1 : toInt(habilidad.Id_extra, -1),
        rangos: toInt(habilidad.Rangos),
        custom: habilidad.Custom === true,
    }));
}

/** Los ids de `Extras_disponibles` de la dote, por la clave del alta (el 0 «Elegir» incluido). */
export function extrasDisponiblesDeDote(dote: Dote): { armas: number[]; armaduras: number[]; escuelas: number[]; habilidades: number[]; } {
    const ids = (items: { Id: number; }[] | undefined) => (items ?? []).map((item) => toInt(item?.Id, -1)).filter((id) => id >= 0);
    return {
        armas: ids(dote?.Extras_disponibles?.Armas),
        armaduras: ids(dote?.Extras_disponibles?.Armaduras),
        escuelas: ids(dote?.Extras_disponibles?.Escuelas),
        habilidades: ids(dote?.Extras_disponibles?.Habilidades),
    };
}

/** Dónde lee cada tipo su id y su valor en `Prerrequisitos` (la forma de lectura de `GET /dotes/<id>`). */
const ID_DE_LECTURA: Partial<Readonly<Record<PrerequisiteType, string>>> = {
    actitud_prohibido: 'Id_actitud',
    actitud_requerido: 'Id_actitud',
    alineamiento_prohibido: 'Id_alineamiento',
    alineamiento_requerido: 'Id_alineamiento',
    aptitud_especial: 'Id_aptitud_especial',
    caracteristica: 'Id_caracteristica',
    clase_especial: 'Id_especial',
    competencia_arma: 'Id_arma',
    competencia_armadura: 'Id_armadura',
    competencia_grupo_arma: 'Id_grupo_arma',
    competencia_grupo_armadura: 'Id_grupo_armadura',
    conjuros_escuela: 'Id_escuela',
    dominio: 'Id_dominio',
    dote: 'Id_dote_prerrequisito',
    escuela_nivel: 'Id_escuela',
    habilidad: 'Id_habilidad',
    idioma: 'Id_idioma',
    lanz_espontaneo: 'Id_conjuro',
    limite_tipo_dote: 'Id_tipo',
    nivel_de_clase: 'Id_clase',
    raza: 'Id_raza',
    region: 'Id_region',
    tamano_maximo: 'Id_tamano',
    tamano_minimo: 'Id_tamano',
    tipo_criatura: 'Id_tipo_criatura',
    tipo_dote: 'Id_tipo_dote',
};

const VALOR_DE_LECTURA: Partial<Readonly<Record<PrerequisiteType, string>>> = {
    ataque_base: 'Ataque_base',
    caracteristica: 'Cantidad',
    conjuros_escuela: 'Cantidad',
    dg: 'Cantidad',
    escuela_nivel: 'Nivel',
    habilidad: 'Cantidad',
    lanzador_arcano: 'Nivel',
    lanzador_divino: 'Nivel',
    lanzador_psionico: 'Nivel',
    lanzar_conjuros_arcanos_nivel: 'Nivel',
    lanzar_conjuros_divinos_nivel: 'Nivel',
    nivel: 'Nivel',
    nivel_de_clase: 'Nivel',
    nivel_max: 'Nivel',
};

function filaDePrerrequisito(tipo: PrerequisiteType, item: PrerrequisitoItem, uid: string): PrerequisiteRowModel {
    const fila: PrerequisiteRowModel = { ...getPrerequisiteDefinition(tipo).createDefaultRow(), uid, opcional: Math.max(0, toInt(item?.Opcional)) };
    const claveId = ID_DE_LECTURA[tipo];
    if (claveId)
        fila.id = toInt(item?.[claveId]);
    const claveValor = VALOR_DE_LECTURA[tipo];
    if (claveValor)
        fila.valor = toInt(item?.[claveValor]);
    if (tipo === 'salvacion_minimo') {
        const salvacion = (['fortaleza', 'reflejos', 'voluntad'] as const)
            .find((clave) => toInt(item?.[clave.charAt(0).toUpperCase() + clave.slice(1)]) > 0) ?? 'fortaleza';
        fila.salvacion_tipo = salvacion;
        fila.valor = toInt(item?.[salvacion.charAt(0).toUpperCase() + salvacion.slice(1)]);
    }
    if (tipo === 'clase_especial')
        // Sin extra en la lectura (el 0 «Nada» de la base sale `null`), el 0: el «no aplica» que guarda la API.
        fila.id_extra = item?.['Id_extra'] === null || item?.['Id_extra'] === undefined ? 0 : toInt(item['Id_extra']);
    if (tipo === 'dote') {
        // El código de la base tal cual: -1 sin extra, 0 el comodín, > 0 uno concreto (y `null` si no viene).
        fila.id_extra = item?.['Id_extra'] === null || item?.['Id_extra'] === undefined ? null : toInt(item['Id_extra']);
        fila.repetido = Math.max(0, toInt(item?.['Repetido']));
    }
    if (tipo === 'habilidad')
        fila.requiere_extra = toInt(item?.['Requiere_extra']) > 0;
    return fila;
}

/**
 * Los prerrequisitos de la dote como filas del editor compartido, de los tipos que edita la dote (`tipos`): los demás
 * (los de Magic of Incarnum y la psiónica) no los escribe el alta y la edición los conserva. Las filas que apuntan al
 * comodín 0 de su catálogo van aparte (`conservados`), con la `Frase` de la API.
 */
export function prerrequisitosDeDote(
    dote: Dote,
    tipos: ReadonlySet<PrerequisiteType>,
    uid: () => string,
): { filas: PrerequisiteRowModel[]; conservados: PrerrequisitoConservado[]; } {
    const filas: PrerequisiteRowModel[] = [];
    const conservados: PrerrequisitoConservado[] = [];
    Object.entries(dote?.Prerrequisitos ?? {}).forEach(([clave, items]) => {
        const tipo = clave as PrerequisiteType;
        if (!tipos.has(tipo))
            return;
        (items ?? []).forEach((item) => {
            const fila = filaDePrerrequisito(tipo, item, uid());
            const definicion = getPrerequisiteDefinition(tipo);
            if (ID_DE_LECTURA[tipo] && fila.id <= 0 && tipo !== 'dote' && tipo !== 'clase_especial' && !definicion.isComplete(fila))
                conservados.push({ fila, frase: toText(item?.Frase).trim() || definicion.label });
            else
                filas.push(fila);
        });
    });
    return { filas, conservados };
}
