import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { idsUnicosOrdenados, toInt } from 'src/app/services/utils/normalizacion';
import { PrerequisiteRowModel, PrerequisiteType } from './prerrequisito-editor.models';
import { getPrerequisiteDefinition } from './prerrequisito-editor.registry';

/**
 * La lectura de los prerrequisitos de la API como filas del editor compartido: dónde lee cada tipo, en la forma de
 * lectura de `Prerrequisitos` (`GET /dotes/<id>`, `/plantillas/<id>`, `/especiales/<id>`, `/clases/<id>`), su id, su
 * valor y lo propio del tipo. Un catálogo que lee un tipo con otra clave la da en `ClavesDeLectura` (la clase). La
 * escritura es la de cada catálogo (`toPayload` del registro o la tabla de la plantilla). La raza lee otra forma (sus
 * prerrequisitos de mutación) y se queda aparte.
 */

/** Dónde lee cada tipo el id de su fila. */
export const ID_DE_LECTURA: Partial<Readonly<Record<PrerequisiteType, string>>> = {
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
    conjuro_conocido: 'Id_conjuro',
    conjuros_escuela: 'Id_escuela',
    conocer_poder_psionico: 'Id_conjuro',
    criaturas_compatibles: 'Id_tipo_compatible',
    deidad: 'Id_deidad',
    dominio: 'Id_dominio',
    dote: 'Id_dote_prerrequisito',
    escuela_nivel: 'Id_escuela',
    genero: 'Genero',
    habilidad: 'Id_habilidad',
    idioma: 'Id_idioma',
    lanz_espontaneo: 'Id_conjuro',
    limite_tipo_dote: 'Id_tipo',
    nivel_de_clase: 'Id_clase',
    no_raza: 'Id_raza',
    raza: 'Id_raza',
    region: 'Id_region',
    subtipo: 'Id_subtipo',
    subtipo_prohibido: 'Id_subtipo',
    tamano_maximo: 'Id_tamano',
    tamano_minimo: 'Id_tamano',
    tipo_criatura: 'Id_tipo_criatura',
    tipo_dote: 'Id_tipo_dote',
};

/** Dónde lee cada tipo el valor de su fila (la cantidad, el nivel…). */
export const VALOR_DE_LECTURA: Partial<Readonly<Record<PrerequisiteType, string>>> = {
    ataque_base: 'Ataque_base',
    caracteristica: 'Cantidad',
    conjuros_escuela: 'Cantidad',
    armas_naturales: 'Cantidad',
    dg: 'Cantidad',
    escuela_nivel: 'Nivel',
    habilidad: 'Cantidad',
    lanzador_arcano: 'Nivel',
    lanzador_divino: 'Nivel',
    lanzador_psionico: 'Nivel',
    lanzar_conjuros_arcanos_nivel: 'Nivel',
    lanzar_conjuros_divinos_nivel: 'Nivel',
    lanzar_poder_psionico_nivel: 'Nivel',
    nivel: 'Nivel',
    nivel_de_clase: 'Nivel',
    nivel_lanzador: 'Nivel',
    nivel_max: 'Nivel',
    reserva_psionica: 'Cantidad',
};

/**
 * Las claves con las que un catálogo lee algún tipo distinto de las tablas comunes (`ID_DE_LECTURA` y
 * `VALOR_DE_LECTURA`): la clase lee el ataque base y el nivel de la escuela de `Cantidad` y los rangos de la habilidad de
 * `Rangos` (`LECTURA_DE_CLASE`, `clase-formulario.ts`).
 */
export interface ClavesDeLectura {
    id?: Partial<Readonly<Record<PrerequisiteType, string>>>;
    valor?: Partial<Readonly<Record<PrerequisiteType, string>>>;
}

const SALVACIONES = ['fortaleza', 'reflejos', 'voluntad'] as const;

function claveDeSalvacion(salvacion: typeof SALVACIONES[number]): string {
    return salvacion.charAt(0).toUpperCase() + salvacion.slice(1);
}

/** Un `Id_extra` de la lectura: `null` si no viene. */
function idExtraLeido(item: PrerrequisitoItem): number | null {
    return item?.['Id_extra'] === null || item?.['Id_extra'] === undefined ? null : toInt(item['Id_extra']);
}

/** Los ids de los extras de una habilidad pedida (`Extras: [{ Id_extra, Extra }]`), sin repetidos y ordenados. */
function extrasLeidos(item: PrerrequisitoItem): number[] {
    const extras = Array.isArray(item?.['Extras']) ? item['Extras'] as Record<string, unknown>[] : [];
    return idsUnicosOrdenados(extras.map((extra) => extra?.['Id_extra'] ?? extra?.['Id']), 0);
}

/**
 * Un prerrequisito de la lectura (`item`) de ese tipo como fila del editor compartido, con su `uid` y su `Opcional`; con
 * las claves propias del catálogo (`claves`) donde las tenga.
 */
export function filaDeLectura(tipo: PrerequisiteType, item: PrerrequisitoItem, uid: string, claves: ClavesDeLectura = {}): PrerequisiteRowModel {
    const fila: PrerequisiteRowModel = {
        ...getPrerequisiteDefinition(tipo).createDefaultRow(),
        uid,
        tipo,
        opcional: Math.max(0, toInt(item?.Opcional)),
    };
    const claveId = claves.id?.[tipo] ?? ID_DE_LECTURA[tipo];
    if (claveId)
        fila.id = toInt(item?.[claveId]);
    if (claveId && fila.id === 0 && getPrerequisiteDefinition(tipo).comodinLabel)
        // El 0 de su catálogo es su comodín («Elegir»: el arma elegida), no una fila sin elegir.
        fila.comodin = true;
    const claveValor = claves.valor?.[tipo] ?? VALOR_DE_LECTURA[tipo];
    if (claveValor)
        fila.valor = toInt(item?.[claveValor]);
    if (tipo === 'salvacion_minimo') {
        const salvacion = SALVACIONES.find((clave) => toInt(item?.[claveDeSalvacion(clave)]) > 0) ?? 'fortaleza';
        fila.salvacion_tipo = salvacion;
        fila.valor = toInt(item?.[claveDeSalvacion(salvacion)]);
    }
    if (tipo === 'criaturas_compatibles')
        // El 0 de destino: «conserva su tipo».
        fila.id_destino = toInt(item?.['Id_tipo_nuevo']);
    if (tipo === 'clase_especial')
        // Sin extra en la lectura (el 0 «Nada» de la base sale `null`), el 0: el «no aplica» que guarda la API.
        fila.id_extra = idExtraLeido(item) ?? 0;
    if (tipo === 'dote') {
        // El código de la base tal cual: -1 sin extra, 0 el comodín, > 0 uno concreto (y `null` si no viene).
        fila.id_extra = idExtraLeido(item);
        fila.repetido = Math.max(0, toInt(item?.['Repetido']));
    }
    if (tipo === 'habilidad') {
        fila.requiere_extra = toInt(item?.['Requiere_extra']) > 0;
        fila.extras = extrasLeidos(item);
    }
    return fila;
}
