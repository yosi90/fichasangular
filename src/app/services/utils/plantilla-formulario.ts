import {
    Plantilla,
    PlantillaCreateRequest,
    PlantillaEscalaresRequest,
    PlantillaPrerrequisitos,
    PlantillaPrerrequisitosRequest,
} from 'src/app/interfaces/plantilla';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { CamposDeFormulario } from 'src/app/components/shared/insercion-marco/errores-de-formulario';
import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { toInt, toNullableText, toText } from './normalizacion';

// El formulario de las plantillas (lienzo «Plantillas: crear y modificar», aprobado el 2026-10-30): los pasos, los
// campos con su etiqueta y su paso, el cuerpo de `POST /plantillas/add` (contrato: «Endpoint: GET /plantillas» y
// `PlantillaCreateRequest` en `docs/publica/endpoints/catalogos.md`), el relleno desde `GET /plantillas/<id>` y la
// detección de cambios al modificar. Todo es puro para probarlo sin la pantalla.

/** Los cinco pasos de la pantalla, en orden. */
export const PASOS_PLANTILLA: readonly string[] = ['Identidad y cuerpo', 'Valores', 'Rasgos', 'A qué criaturas se aplica', 'Ficha del manual'];

/**
 * Lo que guarda la base en las columnas de texto que la plantilla no cambia (`SIN_CAMBIO` del importador). La lectura lo
 * da como `null` (`docs/publica/SIN_RELLENO_FRONT.md`, regla 3), pero el alta exige texto en esas columnas: un campo vacío
 * se manda con este relleno.
 */
export const TEXTO_SIN_CAMBIO = 'No modifica';

/** Los textos de combate y defensas que el alta exige y que vacíos son «no cambia». */
const TEXTOS_CON_RELLENO = ['velocidades', 'ca', 'ataques', 'ataque_completo', 'reduccion_dano', 'resistencia_conjuros', 'resistencia_elemental'] as const;

/** Los textos de la ficha del manual: opcionales; vacíos van a `null`. */
const TEXTOS_OPCIONALES = ['entorno', 'organizacion', 'vd', 'tesoro', 'avance', 'nombre_original'] as const;

/** Los escalares del alta que no son números: los textos y los booleanos. */
const CAMPOS_NO_NUMERICOS: ReadonlySet<string> = new Set<string>([
    'nombre', 'descripcion', ...TEXTOS_CON_RELLENO, ...TEXTOS_OPCIONALES, 'oficial', 'traducido', 'nacimiento', 'act_dg',
]);

/**
 * Las características en el orden del manual (`CARACTERISTICAS`), con su campo de modificador y de mínimo en el alta
 * («constitucion», «min_constitucion»), su nombre con tildes y su abreviatura («Con»).
 */
export const CARACTERISTICAS_PLANTILLA = CARACTERISTICAS.map((clave) => {
    const campo = clave.toLowerCase() as Lowercase<typeof clave>;
    const nombre = NOMBRES_CARACTERISTICAS[clave];
    return { modificador: campo, minimo: `min_${campo}` as const, nombre, corto: nombre.slice(0, 3) };
});

/** Los tipos de prerrequisito de las plantillas, los de `Prerrequisitos` del contrato, en su orden. */
export const TIPOS_PRERREQUISITO_PLANTILLA: readonly PrerequisiteType[] = [
    'criaturas_compatibles',
    'tamano_minimo',
    'tamano_maximo',
    'dg',
    'subtipo',
    'subtipo_prohibido',
    'caracteristica',
    'alineamiento_requerido',
    'actitud_requerido',
    'actitud_prohibido',
    'nivel_lanzador',
    'dote',
];

/**
 * Cada campo del formulario: su etiqueta (la de la pantalla y la de «N cambios: …») y su paso (de `PASOS_PLANTILLA`).
 * Las claves de los escalares son las del alta (`plantilla.<campo>`), para que un 400 con `field` lleve a su campo
 * (`campoDeErrorApi` de `errores-de-formulario.ts`, con la raíz `plantilla`); las listas, las suyas.
 */
export const CAMPOS_PLANTILLA: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    id_manual: { etiqueta: 'Manual', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    nombre_original: { etiqueta: 'Nombre original (inglés)', paso: 0 },
    oficial: { etiqueta: 'Oficial', paso: 0 },
    traducido: { etiqueta: 'Traducción nuestra', paso: 0 },
    nacimiento: { etiqueta: 'Cómo se tiene', paso: 0 },
    id_tamano: { etiqueta: 'Tamaño', paso: 0 },
    id_mod_tam: { etiqueta: 'Cambio de tamaño', paso: 0 },
    id_tipo_dado: { etiqueta: 'Dado de golpe', paso: 0 },
    act_dg: { etiqueta: 'También los DG de clase', paso: 0 },
    id_mod_dg: { etiqueta: 'Cambio del dado de golpe', paso: 0 },
    con_dg_lic: { etiqueta: 'Añade DG de otra criatura', paso: 0 },
    id_tipo_dado_lic: { etiqueta: 'Dado de los DG añadidos', paso: 0 },
    mult_dg_lic: { etiqueta: 'Multiplicador de los DG añadidos', paso: 0 },
    suma_dg_lic: { etiqueta: 'Suma de los DG añadidos', paso: 0 },
    id_tipo_criatura_dg_lic: { etiqueta: 'Tipo de criatura de los DG añadidos', paso: 0 },
    ...Object.fromEntries(CARACTERISTICAS_PLANTILLA.flatMap((c) => [
        [c.modificador, { etiqueta: `Modificador de ${c.nombre}`, paso: 1 }],
        [c.minimo, { etiqueta: `${c.nombre} mínima`, paso: 1 }],
    ])),
    iniciativa: { etiqueta: 'Iniciativa', paso: 1 },
    ataque_base: { etiqueta: 'Ataque base', paso: 1 },
    presa: { etiqueta: 'Presa', paso: 1 },
    cd: { etiqueta: 'CD', paso: 1 },
    ca: { etiqueta: 'CA', paso: 1 },
    ataques: { etiqueta: 'Ataques', paso: 1 },
    ataque_completo: { etiqueta: 'Ataque completo', paso: 1 },
    ajuste_nivel: { etiqueta: 'Ajuste de nivel', paso: 1 },
    fortaleza: { etiqueta: 'Fortaleza', paso: 1 },
    reflejos: { etiqueta: 'Reflejos', paso: 1 },
    voluntad: { etiqueta: 'Voluntad', paso: 1 },
    reduccion_dano: { etiqueta: 'Reducción de daño', paso: 1 },
    resistencia_conjuros: { etiqueta: 'Resistencia a conjuros', paso: 1 },
    resistencia_elemental: { etiqueta: 'Resistencia a la energía', paso: 1 },
    correr: { etiqueta: 'Correr', paso: 1 },
    nadar: { etiqueta: 'Nadar', paso: 1 },
    volar: { etiqueta: 'Volar', paso: 1 },
    trepar: { etiqueta: 'Trepar', paso: 1 },
    excavar: { etiqueta: 'Excavar', paso: 1 },
    id_maniobrabilidad: { etiqueta: 'Maniobrabilidad', paso: 1 },
    puntos_hab_suma: { etiqueta: 'Puntos de habilidad por DG', paso: 1 },
    puntos_hab_suma_fija: { etiqueta: 'Puntos de habilidad fijos', paso: 1 },
    id_alineamiento: { etiqueta: 'Alineamiento', paso: 1 },
    velocidades: { etiqueta: 'Velocidades', paso: 1 },
    raciales: { etiqueta: 'Raciales', paso: 2 },
    ataquesEspeciales: { etiqueta: 'Ataques especiales', paso: 2 },
    sortilegas: { etiqueta: 'Aptitudes sortílegas', paso: 2 },
    dotes: { etiqueta: 'Dotes', paso: 2 },
    habilidades: { etiqueta: 'Habilidades', paso: 2 },
    subtipos: { etiqueta: 'Subtipos que añade', paso: 2 },
    prerrequisitos: { etiqueta: 'A qué criaturas se aplica', paso: 3 },
    descripcion: { etiqueta: 'Descripción', paso: 4 },
    entorno: { etiqueta: 'Entorno', paso: 4 },
    organizacion: { etiqueta: 'Organización', paso: 4 },
    vd: { etiqueta: 'Valor de desafío', paso: 4 },
    tesoro: { etiqueta: 'Tesoro', paso: 4 },
    avance: { etiqueta: 'Avance', paso: 4 },
};

/**
 * Los escalares del formulario: los del alta (con los números a `null` mientras estén vacíos) y `con_dg_lic`, el
 * interruptor «Añade DG de otra criatura» que muestra los DG de licantropía.
 */
export type PlantillaFormularioValor =
    Omit<PlantillaEscalaresRequest, 'entorno' | 'organizacion' | 'vd' | 'tesoro' | 'avance' | 'nombre_original' | 'id_tamano'>
    & {
        id_tamano: number | null;
        entorno: string;
        organizacion: string;
        vd: string;
        tesoro: string;
        avance: string;
        nombre_original: string;
        con_dg_lic: boolean;
    };

/** Una aptitud racial o un ataque especial que da la plantilla, desde sus DG (1: desde el principio). */
export interface FilaRasgoPlantilla {
    uid: string;
    id: number;
    nombre: string;
    dg: number;
}

export interface FilaDotePlantilla extends FilaRasgoPlantilla {
    /** -1 sin extra; > 0, un extra de la dote. */
    id_extra: number;
}

export interface FilaSortilegaPlantilla extends FilaRasgoPlantilla {
    nivel_lanzador: number;
    usos_diarios: string;
}

export interface FilaHabilidadPlantilla {
    uid: string;
    id: number;
    nombre: string;
    /** El bono que da (`rangos` en el alta). */
    rangos: number;
    /** `ID_EXTRA_HABILIDAD_SIN_EXTRA` (-1) sin extra; > 0, un extra de la habilidad. */
    id_extra: number;
    varios: string;
}

export interface FilaSubtipoPlantilla {
    uid: string;
    id: number;
    nombre: string;
}

/** Las listas del formulario: los rasgos del paso 3 y los requisitos del paso 4. */
export interface ListasPlantilla {
    raciales: FilaRasgoPlantilla[];
    ataquesEspeciales: FilaRasgoPlantilla[];
    sortilegas: FilaSortilegaPlantilla[];
    dotes: FilaDotePlantilla[];
    habilidades: FilaHabilidadPlantilla[];
    subtipos: FilaSubtipoPlantilla[];
    prerrequisitos: PrerequisiteRowModel[];
}

/** El formulario vacío de una plantilla nueva: adquirida, homebrew, sin cambios de cuerpo ni de valores. */
export function valorPlantillaNueva(): PlantillaFormularioValor {
    return {
        nombre: '',
        descripcion: '',
        id_manual: 0,
        pagina: 0,
        nombre_original: '',
        oficial: false,
        traducido: false,
        nacimiento: false,
        id_tamano: null,
        id_mod_tam: 0,
        id_tipo_dado: 0,
        act_dg: false,
        id_mod_dg: 0,
        con_dg_lic: false,
        id_tipo_dado_lic: 0,
        mult_dg_lic: 0,
        suma_dg_lic: 0,
        id_tipo_criatura_dg_lic: 0,
        fuerza: 0, destreza: 0, constitucion: 0, inteligencia: 0, sabiduria: 0, carisma: 0,
        min_fuerza: 0, min_destreza: 0, min_constitucion: 0, min_inteligencia: 0, min_sabiduria: 0, min_carisma: 0,
        iniciativa: 0,
        ataque_base: 0,
        presa: 0,
        cd: 0,
        ca: '',
        ataques: '',
        ataque_completo: '',
        ajuste_nivel: 0,
        fortaleza: 0,
        reflejos: 0,
        voluntad: 0,
        reduccion_dano: '',
        resistencia_conjuros: '',
        resistencia_elemental: '',
        correr: 0,
        nadar: 0,
        volar: 0,
        trepar: 0,
        excavar: 0,
        id_maniobrabilidad: 0,
        puntos_hab_suma: 0,
        puntos_hab_suma_fija: 0,
        id_alineamiento: 0,
        velocidades: '',
        entorno: '',
        organizacion: '',
        vd: '',
        tesoro: '',
        avance: '',
    };
}

export function listasPlantillaVacias(): ListasPlantilla {
    return { raciales: [], ataquesEspeciales: [], sortilegas: [], dotes: [], habilidades: [], subtipos: [], prerrequisitos: [] };
}

/** El formulario de una plantilla que ya existe (`GET /plantillas/<id>`, normalizada). */
export function valorDesdePlantilla(plantilla: Plantilla): PlantillaFormularioValor {
    const lic = plantilla.Licantronia_dg;
    const mods = plantilla.Modificadores_caracteristicas;
    const mins = plantilla.Minimos_caracteristicas;
    return {
        nombre: toText(plantilla.Nombre),
        descripcion: toText(plantilla.Descripcion),
        id_manual: toInt(plantilla.Manual?.Id),
        pagina: toInt(plantilla.Manual?.Pagina),
        nombre_original: toText(plantilla.Nombre_original),
        oficial: plantilla.Oficial === true,
        traducido: plantilla.Traducido === true,
        nacimiento: plantilla.Nacimiento === true,
        id_tamano: toInt(plantilla.Tamano?.Id),
        id_mod_tam: toInt(plantilla.Modificacion_tamano?.Id_paso_modificacion),
        id_tipo_dado: toInt(plantilla.Tipo_dado?.Id_tipo_dado),
        act_dg: plantilla.Actualiza_dg === true,
        id_mod_dg: toInt(plantilla.Modificacion_dg?.Id_paso_modificacion),
        con_dg_lic: !!lic,
        id_tipo_dado_lic: toInt(lic?.Id_dado),
        mult_dg_lic: toInt(lic?.Multiplicador),
        suma_dg_lic: toInt(lic?.Suma),
        id_tipo_criatura_dg_lic: toInt(lic?.Tipo_criatura?.Id),
        fuerza: toInt(mods?.Fuerza), destreza: toInt(mods?.Destreza), constitucion: toInt(mods?.Constitucion),
        inteligencia: toInt(mods?.Inteligencia), sabiduria: toInt(mods?.Sabiduria), carisma: toInt(mods?.Carisma),
        min_fuerza: toInt(mins?.Fuerza), min_destreza: toInt(mins?.Destreza), min_constitucion: toInt(mins?.Constitucion),
        min_inteligencia: toInt(mins?.Inteligencia), min_sabiduria: toInt(mins?.Sabiduria), min_carisma: toInt(mins?.Carisma),
        iniciativa: toInt(plantilla.Iniciativa),
        ataque_base: toInt(plantilla.Ataque_base),
        presa: toInt(plantilla.Presa),
        cd: toInt(plantilla.Cd),
        ca: toText(plantilla.Ca),
        ataques: toText(plantilla.Ataques),
        ataque_completo: toText(plantilla.Ataque_completo),
        ajuste_nivel: toInt(plantilla.Ajuste_nivel),
        fortaleza: toInt(plantilla.Fortaleza),
        reflejos: toInt(plantilla.Reflejos),
        voluntad: toInt(plantilla.Voluntad),
        reduccion_dano: toText(plantilla.Reduccion_dano),
        resistencia_conjuros: toText(plantilla.Resistencia_conjuros),
        resistencia_elemental: toText(plantilla.Resistencia_elemental),
        correr: toInt(plantilla.Movimientos?.Correr),
        nadar: toInt(plantilla.Movimientos?.Nadar),
        volar: toInt(plantilla.Movimientos?.Volar),
        trepar: toInt(plantilla.Movimientos?.Trepar),
        excavar: toInt(plantilla.Movimientos?.Excavar),
        id_maniobrabilidad: toInt(plantilla.Maniobrabilidad?.Id),
        puntos_hab_suma: toInt(plantilla.Puntos_habilidad?.Suma),
        puntos_hab_suma_fija: toInt(plantilla.Puntos_habilidad?.Suma_fija),
        id_alineamiento: toInt(plantilla.Alineamiento?.Id),
        velocidades: toText(plantilla.Velocidades),
        entorno: toText(plantilla.Entorno),
        organizacion: toText(plantilla.Organizacion),
        vd: toText(plantilla.Vd),
        tesoro: toText(plantilla.Tesoro),
        avance: toText(plantilla.Avance),
    };
}

/** Las listas de una plantilla que ya existe; `uid` da un identificador nuevo por fila. */
export function listasDesdePlantilla(plantilla: Plantilla, uid: () => string): ListasPlantilla {
    const racial = (item: { Racial: { Id: number; Nombre: string; }; Dg: number; }): FilaRasgoPlantilla => ({
        uid: uid(), id: toInt(item?.Racial?.Id), nombre: toText(item?.Racial?.Nombre), dg: dgDesde(item?.Dg),
    });
    return {
        raciales: (plantilla.Raciales ?? []).map(racial).filter((fila) => fila.id > 0),
        ataquesEspeciales: (plantilla.Ataques_especiales ?? []).map(racial).filter((fila) => fila.id > 0),
        sortilegas: (plantilla.Sortilegas ?? []).map((item) => ({
            uid: uid(),
            id: toInt(item?.Conjuro?.Id),
            nombre: toText(item?.Conjuro?.Nombre),
            dg: dgDesde(item?.Dg),
            nivel_lanzador: toInt(item?.Nivel_lanzador),
            usos_diarios: toText(item?.Usos_diarios),
        })).filter((fila) => fila.id > 0),
        dotes: (plantilla.Dotes ?? []).map((item) => {
            const contexto = item?.Contexto as { Id_extra?: number; Dg?: number; } | undefined;
            const idExtra = toInt(contexto?.Id_extra, -1);
            return {
                uid: uid(),
                id: toInt(item?.Dote?.Id),
                nombre: toText(item?.Dote?.Nombre),
                dg: dgDesde(contexto?.Dg),
                id_extra: idExtra > 0 ? idExtra : -1,
            };
        }).filter((fila) => fila.id > 0),
        habilidades: (plantilla.Habilidades ?? []).map((item) => ({
            uid: uid(),
            id: toInt(item?.Id_habilidad),
            nombre: toText(item?.Habilidad),
            rangos: toInt(item?.Rangos),
            id_extra: toInt(item?.Id_extra) > 0 ? toInt(item?.Id_extra) : ID_EXTRA_HABILIDAD_SIN_EXTRA,
            varios: toText(item?.Varios),
        })).filter((fila) => fila.id > 0),
        subtipos: (plantilla.Subtipos ?? []).map((item) => ({ uid: uid(), id: toInt(item?.Id), nombre: toText(item?.Nombre) }))
            .filter((fila) => fila.id > 0),
        prerrequisitos: filasDesdePrerrequisitosPlantilla(plantilla.Prerrequisitos, uid).filas,
    };
}

/** El DG desde el que se da un rasgo: 1 (desde el principio) si no lo dice. */
function dgDesde(valor: unknown): number {
    return Math.max(1, toInt(valor, 1));
}

/**
 * Cómo se lee cada familia de `Prerrequisitos` (la de lectura) en una fila del editor compartido, y cómo se escribe en
 * el alta: el id (y el valor o el destino) de la fila y sus campos en minúscula.
 */
const PRERREQUISITOS_PLANTILLA: Readonly<Record<string, {
    leer: (item: PrerrequisitoItem) => Partial<PrerequisiteRowModel>;
    escribir: (fila: PrerequisiteRowModel) => Record<string, number>;
}>> = {
    actitud_requerido: { leer: (i) => ({ id: toInt(i['Id_actitud']) }), escribir: (f) => ({ id_actitud: toInt(f.id) }) },
    actitud_prohibido: { leer: (i) => ({ id: toInt(i['Id_actitud']) }), escribir: (f) => ({ id_actitud: toInt(f.id) }) },
    alineamiento_requerido: { leer: (i) => ({ id: toInt(i['Id_alineamiento']) }), escribir: (f) => ({ id_alineamiento: toInt(f.id) }) },
    caracteristica: {
        leer: (i) => ({ id: toInt(i['Id_caracteristica']), valor: toInt(i['Cantidad']) }),
        escribir: (f) => ({ id_caracteristica: toInt(f.id), cantidad: toInt(f.valor) }),
    },
    criaturas_compatibles: {
        leer: (i) => ({ id: toInt(i['Id_tipo_compatible']), id_destino: toInt(i['Id_tipo_nuevo']) }),
        escribir: (f) => ({ id_tipo_comp: toInt(f.id), id_tipo_nuevo: toInt(f.id_destino) }),
    },
    nivel_lanzador: { leer: (i) => ({ valor: toInt(i['Nivel']) }), escribir: (f) => ({ nivel: toInt(f.valor) }) },
    dote: { leer: (i) => ({ id: toInt(i['Id_dote_prerrequisito']) }), escribir: (f) => ({ id_dote: toInt(f.id) }) },
    tamano_minimo: { leer: (i) => ({ id: toInt(i['Id_tamano']) }), escribir: (f) => ({ id_tamano: toInt(f.id) }) },
    tamano_maximo: { leer: (i) => ({ id: toInt(i['Id_tamano']) }), escribir: (f) => ({ id_tamano: toInt(f.id) }) },
    dg: { leer: (i) => ({ valor: toInt(i['Cantidad']) }), escribir: (f) => ({ cantidad: toInt(f.valor) }) },
    subtipo: { leer: (i) => ({ id: toInt(i['Id_subtipo']) }), escribir: (f) => ({ id_subtipo: toInt(f.id) }) },
    subtipo_prohibido: { leer: (i) => ({ id: toInt(i['Id_subtipo']) }), escribir: (f) => ({ id_subtipo: toInt(f.id) }) },
};

/** Los requisitos de una plantilla como filas del editor, con la `Frase` de la API de cada una (por `uid`). */
export function filasDesdePrerrequisitosPlantilla(
    prerrequisitos: PlantillaPrerrequisitos | null | undefined,
    uid: () => string,
): { filas: PrerequisiteRowModel[]; frases: Map<string, string>; } {
    return filasDesdePrerrequisitos(prerrequisitos, TIPOS_PRERREQUISITO_PLANTILLA, uid);
}

/**
 * Las familias de `Prerrequisitos` (la forma de lectura) de esos tipos como filas del editor compartido, con la `Frase`
 * de la API de cada una (por `uid`). La usan la plantilla y los prerrequisitos de actitud de los especiales.
 */
export function filasDesdePrerrequisitos(
    prerrequisitos: object | null | undefined,
    tipos: readonly PrerequisiteType[],
    uid: () => string,
): { filas: PrerequisiteRowModel[]; frases: Map<string, string>; } {
    const filas: PrerequisiteRowModel[] = [];
    const frases = new Map<string, string>();
    tipos.forEach((tipo) => {
        const items = ((prerrequisitos as Record<string, PrerrequisitoItem[] | undefined> | null | undefined)?.[tipo] ?? []);
        items.forEach((item) => {
            const fila: PrerequisiteRowModel = {
                ...getPrerequisiteDefinition(tipo).createDefaultRow(),
                ...PRERREQUISITOS_PLANTILLA[tipo].leer(item),
                uid: uid(),
                tipo,
                opcional: Math.max(0, toInt(item?.Opcional)),
            };
            filas.push(fila);
            const frase = toText(item?.Frase).trim();
            if (frase.length > 0)
                frases.set(fila.uid, `${firmaFilaPrerrequisito(fila)}|${frase}`);
        });
    });
    return { filas, frases };
}

/** Los tipos de `tipos` que tienen alguna fila: los que el editor compartido enseña al cargar. */
export function tiposConFilas(tipos: readonly PrerequisiteType[], filas: PrerequisiteRowModel[]): PrerequisiteType[] {
    return tipos.filter((tipo) => filas.some((fila) => fila.tipo === tipo));
}

/**
 * Una fila nueva de ese tipo para el editor compartido, con su `uid`, y los tipos que el editor enseña con ella (los que
 * ya enseñaba más ese, en el orden de `tipos`). La usan la plantilla y los especiales.
 */
export function filaNuevaDePrerrequisito(
    tipo: PrerequisiteType,
    tipos: readonly PrerequisiteType[],
    ensenados: PrerequisiteType[],
    uid: () => string,
): { fila: PrerequisiteRowModel; tipos: PrerequisiteType[]; } {
    const fila = getPrerequisiteDefinition(tipo).createDefaultRow();
    fila.uid = uid();
    return { fila, tipos: ensenados.includes(tipo) ? ensenados : tipos.filter((t) => t === tipo || ensenados.includes(t)) };
}

/** Lo que define una fila para la API: si cambia, la frase de la API ya no vale. */
export function firmaFilaPrerrequisito(fila: PrerequisiteRowModel): string {
    return JSON.stringify([fila.tipo, PRERREQUISITOS_PLANTILLA[fila.tipo]?.escribir(fila) ?? null, Math.max(0, toInt(fila.opcional))]);
}

/** Los requisitos en el formato del alta (`prerrequisitos`), sin las filas incompletas. */
export function prerrequisitosPlantillaDesdeFilas(filas: PrerequisiteRowModel[]): PlantillaPrerrequisitosRequest {
    return prerrequisitosDesdeFilas(filas, TIPOS_PRERREQUISITO_PLANTILLA) as unknown as PlantillaPrerrequisitosRequest;
}

/** Las filas de esos tipos en el formato de escritura (`{ <tipo>: [{ id_…, opcional }] }`), sin las incompletas. */
export function prerrequisitosDesdeFilas(
    filas: PrerequisiteRowModel[],
    tipos: readonly PrerequisiteType[],
): Record<string, Record<string, number>[]> {
    const salida = Object.fromEntries(tipos.map((tipo) => [tipo, [] as Record<string, number>[]])) as Record<string, Record<string, number>[]>;
    filas.forEach((fila) => {
        const familia = PRERREQUISITOS_PLANTILLA[fila.tipo];
        if (!familia || !salida[fila.tipo] || !getPrerequisiteDefinition(fila.tipo).isComplete(fila))
            return;
        salida[fila.tipo].push({ ...familia.escribir(fila), opcional: Math.max(0, toInt(fila.opcional)) });
    });
    return salida;
}

function textoConRelleno(valor: string): string {
    const texto = `${valor ?? ''}`.trim();
    return texto.length > 0 ? texto : TEXTO_SIN_CAMBIO;
}

/** El cuerpo de `POST /plantillas/add` (y del `PUT` de la modificación, que lleva el mismo). */
export function construirPlantillaRequest(valor: PlantillaFormularioValor, listas: ListasPlantilla): PlantillaCreateRequest {
    const { con_dg_lic, ...escalares } = valor;
    const plantilla: PlantillaEscalaresRequest = {
        ...escalares,
        nombre: `${valor.nombre ?? ''}`.trim(),
        descripcion: `${valor.descripcion ?? ''}`.trim(),
        id_tamano: toInt(valor.id_tamano),
        oficial: valor.oficial === true,
        traducido: valor.traducido === true,
        nacimiento: valor.nacimiento === true,
        act_dg: valor.act_dg === true,
        // Sin «Añade DG de otra criatura», sin DG de licantropía.
        id_tipo_dado_lic: con_dg_lic ? toInt(valor.id_tipo_dado_lic) : 0,
        mult_dg_lic: con_dg_lic ? toInt(valor.mult_dg_lic) : 0,
        suma_dg_lic: con_dg_lic ? toInt(valor.suma_dg_lic) : 0,
        id_tipo_criatura_dg_lic: con_dg_lic ? toInt(valor.id_tipo_criatura_dg_lic) : 0,
        ...Object.fromEntries(TEXTOS_CON_RELLENO.map((campo) => [campo, textoConRelleno(valor[campo])])),
        ...Object.fromEntries(TEXTOS_OPCIONALES.map((campo) => [campo, toNullableText(valor[campo])])),
    } as PlantillaEscalaresRequest;
    // Los números, enteros (un campo numérico vacío del formulario llega como `null`).
    const escritura = plantilla as unknown as Record<string, unknown>;
    Object.keys(escritura)
        .filter((campo) => !CAMPOS_NO_NUMERICOS.has(campo))
        .forEach((campo) => escritura[campo] = toInt(escritura[campo]));

    return {
        plantilla,
        prerrequisitos: prerrequisitosPlantillaDesdeFilas(listas.prerrequisitos),
        subtipos: unicos(listas.subtipos.map((fila) => toInt(fila.id)).filter((id) => id > 0)),
        dotes: listas.dotes.filter((fila) => fila.id > 0).map((fila) => ({
            id_dote: toInt(fila.id),
            ...(toInt(fila.id_extra) > 0 ? { id_extra: toInt(fila.id_extra) } : {}),
            dg: dgDesde(fila.dg),
        })),
        habilidades: listas.habilidades.filter((fila) => fila.id > 0).map((fila) => ({
            id_habilidad: toInt(fila.id),
            rangos: toInt(fila.rangos),
            ...(toInt(fila.id_extra) > 0 ? { id_extra: toInt(fila.id_extra) } : {}),
            ...(`${fila.varios ?? ''}`.trim().length > 0 ? { varios: `${fila.varios}`.trim() } : {}),
        })),
        sortilegas: listas.sortilegas.filter((fila) => fila.id > 0).map((fila) => ({
            id_conjuro: toInt(fila.id),
            nivel_lanzador: toInt(fila.nivel_lanzador),
            usos_diarios: `${fila.usos_diarios ?? ''}`.trim(),
            dg: dgDesde(fila.dg),
        })),
        raciales: listas.raciales.filter((fila) => fila.id > 0).map((fila) => ({ id_racial: toInt(fila.id), dg: dgDesde(fila.dg) })),
        ataquesEspeciales: listas.ataquesEspeciales.filter((fila) => fila.id > 0)
            .map((fila) => ({ id_racial: toInt(fila.id), dg: dgDesde(fila.dg) })),
    };
}

function unicos(ids: number[]): number[] {
    return Array.from(new Set(ids)).sort((a, b) => a - b);
}

/** Una lista del cuerpo sin depender del orden de las filas. */
function firmaLista(lista: unknown[]): string {
    return JSON.stringify(lista.map((item) => JSON.stringify(item)).sort());
}

/** Los escalares que sigue el interruptor de los DG de licantropía: si cambia alguno, cambia «Añade DG de otra criatura». */
const CAMPOS_DG_LIC = ['id_tipo_dado_lic', 'mult_dg_lic', 'suma_dg_lic', 'id_tipo_criatura_dg_lic'];

/**
 * Las claves de `CAMPOS_PLANTILLA` que cambian entre dos cuerpos del alta (el de la plantilla tal como llegó y el de
 * ahora), en el orden de los campos. Así se marcan los campos y los pasos y se escribe «N cambios: …».
 */
export function camposCambiados(antes: PlantillaCreateRequest, ahora: PlantillaCreateRequest, antesConDgLic: boolean, ahoraConDgLic: boolean): string[] {
    const cambiados = new Set<string>();
    (Object.keys(ahora.plantilla) as (keyof PlantillaEscalaresRequest)[]).forEach((campo) => {
        if (JSON.stringify(antes.plantilla[campo] ?? null) !== JSON.stringify(ahora.plantilla[campo] ?? null))
            cambiados.add(campo);
    });
    if (antesConDgLic !== ahoraConDgLic)
        cambiados.add('con_dg_lic');
    (['raciales', 'ataquesEspeciales', 'sortilegas', 'dotes', 'habilidades', 'subtipos'] as const).forEach((lista) => {
        if (firmaLista(antes[lista]) !== firmaLista(ahora[lista]))
            cambiados.add(lista);
    });
    const familias = Object.keys(ahora.prerrequisitos) as (keyof PlantillaPrerrequisitosRequest)[];
    if (familias.some((familia) => firmaLista(antes.prerrequisitos[familia] ?? []) !== firmaLista(ahora.prerrequisitos[familia] ?? [])))
        cambiados.add('prerrequisitos');
    // Al apagar el interruptor, los DG añadidos dejan de contar: basta con decir que cambió el interruptor.
    if (cambiados.has('con_dg_lic'))
        CAMPOS_DG_LIC.forEach((campo) => cambiados.delete(campo));
    return Object.keys(CAMPOS_PLANTILLA).filter((campo) => cambiados.has(campo));
}
