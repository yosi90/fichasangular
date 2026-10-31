import { Clase, ClasePrerrequisitos } from 'src/app/interfaces/clase';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { CLAVES_PRERREQUISITOS_INCARNUM } from './incarnum';
import { toInt, toText } from './normalizacion';

/**
 * «Modificar clase» (hito 5 del roadmap de inserciones, 2026-10-31): los prerrequisitos de `GET /clases/<id>` como filas
 * del editor compartido, para que guardar sin cambios mande lo mismo que hay (`PUT /clases/<id>` reemplaza la clase
 * entera). La clase lee sus prerrequisitos con claves propias (`rangos_habilidad` con `Rangos`, `ataque_base` con
 * `Cantidad`…), distintas de las de la dote (`dote-formulario.ts`).
 */

/** La clave de `Prerrequisitos` de la clase que no se llama como el tipo del editor. */
const TIPO_DE_CLAVE: Readonly<Record<string, PrerequisiteType>> = {
    rangos_habilidad: 'habilidad',
    dote_elegida: 'dote',
    nivel_escuela: 'escuela_nivel',
};

const CLAVE_DE_TIPO: Readonly<Record<string, keyof ClasePrerrequisitos>> = Object.fromEntries(
    Object.entries(TIPO_DE_CLAVE).map(([clave, tipo]) => [tipo, clave as keyof ClasePrerrequisitos]),
);

/** El tipo del editor de una clave de `Prerrequisitos` de la clase. */
export function tipoDePrerrequisitoDeClase(clave: string): PrerequisiteType {
    return TIPO_DE_CLAVE[clave] ?? clave as PrerequisiteType;
}

/** La clave de `Prerrequisitos` de la clase de un tipo del editor. */
export function claveDePrerrequisitoDeClase(tipo: PrerequisiteType): keyof ClasePrerrequisitos {
    return CLAVE_DE_TIPO[tipo] ?? tipo as keyof ClasePrerrequisitos;
}

/**
 * Las claves que escribe el alta y la edición de clases (las de Magic of Incarnum no: las conserva la API). El selector
 * de tipos de la clase solo ofrece estas: un tipo que la clase no admite se perdía al guardar.
 */
export function clavesPrerrequisitoEditablesDeClase(claves: readonly (keyof ClasePrerrequisitos)[]): (keyof ClasePrerrequisitos)[] {
    const incarnum = new Set<string>(CLAVES_PRERREQUISITOS_INCARNUM);
    return claves.filter((clave) => !incarnum.has(clave));
}

/** Dónde lee cada tipo su id y su valor en los `Prerrequisitos` de `GET /clases/<id>`. */
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
    conjuro_conocido: 'Id_conjuro',
    conocer_poder_psionico: 'Id_conjuro',
    dominio: 'Id_dominio',
    dote: 'Id_dote_prerrequisito',
    escuela_nivel: 'Id_escuela',
    genero: 'Genero',
    habilidad: 'Id_habilidad',
    idioma: 'Id_idioma',
    no_raza: 'Id_raza',
    raza: 'Id_raza',
    subtipo: 'Id_subtipo',
    tamano_maximo: 'Id_tamano',
    tamano_minimo: 'Id_tamano',
};

const VALOR_DE_LECTURA: Partial<Readonly<Record<PrerequisiteType, string>>> = {
    ataque_base: 'Cantidad',
    caracteristica: 'Cantidad',
    dg: 'Cantidad',
    escuela_nivel: 'Cantidad',
    habilidad: 'Rangos',
    lanzador_arcano: 'Nivel',
    lanzador_divino: 'Nivel',
    lanzar_conjuros_arcanos_nivel: 'Nivel',
    lanzar_conjuros_divinos_nivel: 'Nivel',
    lanzar_poder_psionico_nivel: 'Nivel',
    reserva_psionica: 'Cantidad',
};

/**
 * Un prerrequisito que el editor compartido no puede enseñar como fila y que se devuelve tal cual al guardar: la
 * habilidad que pide extras concretos (el editor solo lleva «requiere extra») o una fila incompleta de los datos.
 */
export interface PrerrequisitoDeClaseConservado {
    clave: keyof ClasePrerrequisitos;
    item: PrerrequisitoItem;
    frase: string;
}

function filaDePrerrequisito(tipo: PrerequisiteType, item: PrerrequisitoItem, uid: string): PrerequisiteRowModel {
    const fila: PrerequisiteRowModel = { ...getPrerequisiteDefinition(tipo).createDefaultRow(), uid, opcional: Math.max(0, toInt(item?.Opcional)) };
    const claveId = ID_DE_LECTURA[tipo];
    if (claveId)
        fila.id = toInt(item?.[claveId]);
    const claveValor = VALOR_DE_LECTURA[tipo];
    if (claveValor)
        fila.valor = toInt(item?.[claveValor]);
    if (tipo === 'clase_especial')
        // Sin extra en la lectura (el 0 «Nada» de la base puede salir `null`), el 0: el «no aplica» que guarda la API.
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
 * Los prerrequisitos de la clase como filas del editor compartido, de los tipos que edita la clase (`tipos`): los demás
 * (los de Magic of Incarnum) no los escribe el alta y la edición los conserva. Lo que el editor no puede enseñar va
 * aparte (`conservados`), con la `Frase` de la API, y se manda tal cual.
 */
export function prerrequisitosDeClase(
    clase: Clase,
    tipos: ReadonlySet<PrerequisiteType>,
    uid: () => string,
): { filas: PrerequisiteRowModel[]; conservados: PrerrequisitoDeClaseConservado[]; } {
    const filas: PrerequisiteRowModel[] = [];
    const conservados: PrerrequisitoDeClaseConservado[] = [];
    Object.entries(clase?.Prerrequisitos ?? {}).forEach(([clave, items]) => {
        const tipo = tipoDePrerrequisitoDeClase(clave);
        if (!tipos.has(tipo))
            return;
        ((items ?? []) as PrerrequisitoItem[]).forEach((item) => {
            const fila = filaDePrerrequisito(tipo, item, uid());
            const definicion = getPrerequisiteDefinition(tipo);
            const conExtras = tipo === 'habilidad' && Array.isArray(item?.['Extras']) && item['Extras'].length > 0;
            if (conExtras || !definicion.isComplete(fila))
                conservados.push({ clave: clave as keyof ClasePrerrequisitos, item, frase: toText(item?.Frase).trim() || definicion.label });
            else
                filas.push(fila);
        });
    });
    return { filas, conservados };
}
