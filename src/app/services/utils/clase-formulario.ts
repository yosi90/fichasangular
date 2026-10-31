import { Clase, ClasePrerrequisitos } from 'src/app/interfaces/clase';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { CamposDeFormulario } from 'src/app/components/shared/insercion-marco/errores-de-formulario';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { ClavesDeLectura, filaDeLectura } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-lectura';
import { CLAVES_PRERREQUISITOS_INCARNUM } from './incarnum';
import { toText } from './normalizacion';

/**
 * «Modificar clase» (hito 5 del roadmap de inserciones, 2026-10-31): los prerrequisitos de `GET /clases/<id>` como filas
 * del editor compartido, para que guardar sin cambios mande lo mismo que hay (`PUT /clases/<id>` reemplaza la clase
 * entera). La lectura es la común del editor (`filaDeLectura`), con las claves propias de la clase (`LECTURA_DE_CLASE`).
 */

/** Los pasos del marco común de «Nueva clase» y «Modificar clase»; se puede saltar a cualquiera. */
export const PASOS_CLASE: readonly string[] = ['Base', 'Progresión', 'Competencias', 'Habilidades', 'Magia', 'Dotes y especiales', 'Prerrequisitos'];

/**
 * Los campos del formulario de la clase que pueden no valer, en el orden del formulario, con su etiqueta y su paso (de
 * `PASOS_CLASE`): al guardar, `ErroresDeFormulario.irAlPrimerError` lleva al paso del primero que falla.
 */
export const CAMPOS_CLASE: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    descripcion: { etiqueta: 'Descripción', paso: 0 },
    id_manual: { etiqueta: 'Manual', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    tipo_dado: { etiqueta: 'Dado de golpe', paso: 0 },
    puntos_habilidad_id: { etiqueta: 'Puntos de habilidad', paso: 0 },
    nivel_max_claseo: { etiqueta: 'Nivel máximo', paso: 0 },
    id_ataque_base: { etiqueta: 'Ataque base', paso: 1 },
    fortaleza_id: { etiqueta: 'Fortaleza', paso: 1 },
    reflejos_id: { etiqueta: 'Reflejos', paso: 1 },
    voluntad_id: { etiqueta: 'Voluntad', paso: 1 },
    libro_iniciales: { etiqueta: 'Conjuros iniciales en el libro', paso: 4 },
    libro_por_nivel: { etiqueta: 'Conjuros nuevos por nivel', paso: 4 },
    nivel_lanzador_divisor: { etiqueta: 'Divisor del nivel de lanzador', paso: 4 },
};

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

/**
 * Las claves con las que la clase lee algún tipo distinto de la tabla común (`prerrequisito-lectura.ts`): el ataque base
 * y el nivel de la escuela, de `Cantidad`, y los rangos de la habilidad, de `Rangos`.
 */
export const LECTURA_DE_CLASE: ClavesDeLectura = {
    valor: {
        ataque_base: 'Cantidad',
        escuela_nivel: 'Cantidad',
        habilidad: 'Rangos',
    },
};

/**
 * Un prerrequisito que el editor compartido no puede enseñar como fila y que se devuelve tal cual al guardar: una fila
 * incompleta de los datos o una habilidad con extras pedidos sin «requiere extra» (el editor solo los manda con él).
 */
export interface PrerrequisitoDeClaseConservado {
    clave: keyof ClasePrerrequisitos;
    item: PrerrequisitoItem;
    frase: string;
}

/**
 * Los prerrequisitos de la clase como filas del editor compartido, de los tipos que edita la clase (`tipos`): los demás
 * (los de Magic of Incarnum) no los escribe el alta y la edición los conserva. La habilidad con extras pedidos es una fila
 * más (sus extras, en `extras`). Lo que el editor no puede enseñar va aparte (`conservados`), con la `Frase` de la API,
 * y se manda tal cual.
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
            const fila = filaDeLectura(tipo, item, uid(), LECTURA_DE_CLASE);
            const definicion = getPrerequisiteDefinition(tipo);
            const extrasSinRequerir = (fila.extras?.length ?? 0) > 0 && !fila.requiere_extra;
            if (extrasSinRequerir || !definicion.isComplete(fila))
                conservados.push({ clave: clave as keyof ClasePrerrequisitos, item, frase: toText(item?.Frase).trim() || definicion.label });
            else
                filas.push(fila);
        });
    });
    return { filas, conservados };
}
