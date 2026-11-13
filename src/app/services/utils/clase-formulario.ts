import { Clase, ClasePrerrequisitos } from 'src/app/interfaces/clase';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { CampoDeFormulario } from 'src/app/components/shared/insercion-marco/errores-de-formulario';
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

/** Un campo de la clase: su etiqueta, su paso y, si es un control del formulario, cuál. */
export interface CampoDeClase extends CampoDeFormulario {
    control?: string;
}

/**
 * Los campos de la clase por su ruta en el cuerpo de `POST /clases/add` y `PUT /clases/<id>` (la del `field` de los
 * errores de la API: `Manual.Pagina`, `Conjuros.Libro.Iniciales`, `Desglose_niveles[0].Dotes[0].Opcional`…), en el orden
 * del formulario, con su etiqueta, su paso (de `PASOS_CLASE`) y su control. Al guardar, `ErroresDeFormulario` lleva al
 * paso del primer control que no vale; un error de la API va al campo de la ruta más larga con la que empieza su
 * `field` (al control, si lo tiene; si es una lista, a su paso).
 */
export const CAMPOS_CLASE: Readonly<Record<string, CampoDeClase>> = {
    Nombre: { etiqueta: 'Nombre', paso: 0, control: 'nombre' },
    'Manual.Id': { etiqueta: 'Manual', paso: 0, control: 'id_manual' },
    'Manual.Pagina': { etiqueta: 'Página', paso: 0, control: 'pagina' },
    'Tipo_dado.Id': { etiqueta: 'Dado de golpe', paso: 0, control: 'tipo_dado' },
    'Puntos_habilidad.Id': { etiqueta: 'Puntos de habilidad', paso: 0, control: 'puntos_habilidad_id' },
    Nivel_max_claseo: { etiqueta: 'Nivel máximo', paso: 0, control: 'nivel_max_claseo' },
    'Conjuros.Dominio_cantidad': { etiqueta: 'Dominios obtenibles', paso: 0, control: 'dominio_cantidad' },
    Descripcion: { etiqueta: 'Descripción', paso: 0, control: 'descripcion' },
    Oficial: { etiqueta: 'Oficial', paso: 0, control: 'oficial' },
    Prestigio: { etiqueta: 'Prestigio', paso: 0, control: 'prestigio' },
    Es_predilecta: { etiqueta: 'Predilecta', paso: 0, control: 'es_predilecta' },
    Multiclase_restringida: { etiqueta: 'Multiclase restringida', paso: 0, control: 'multiclase_restringida' },
    Alineamiento_deidad: { etiqueta: 'Alineamiento de su deidad', paso: 0, control: 'alineamiento_deidad' },
    // `400 dato_no_valido` sin «Alineamiento de su deidad».
    Alineamiento_deidad_igual: { etiqueta: 'El mismo alineamiento que su deidad', paso: 0, control: 'alineamiento_deidad_igual' },
    // `400 clase_sin_restriccion_de_multiclase`, `dato_no_valido` (ella misma) y el `404` de una clase que no existe.
    Clases_multiclase_compatibles: { etiqueta: 'Clases que no la cierran', paso: 0 },
    Grupo_edad_inicial: { etiqueta: 'Edad inicial', paso: 0, control: 'grupo_edad_inicial' },
    Clase_pnj: { etiqueta: 'Clase de PNJ', paso: 0, control: 'clase_pnj' },
    Progresion_obligatoria: { etiqueta: 'Progresión obligatoria', paso: 0, control: 'progresion_obligatoria' },
    Sin_penalizacion_multiclase: { etiqueta: 'Sin penalización por multiclase', paso: 0, control: 'sin_penalizacion_multiclase' },
    // `400 raza_no_mutada`, `409 mutacion_de_otra_clase` y el `404` de una raza que no existe.
    'Mutacion.Id': { etiqueta: 'Raza mutada que lleva la clase', paso: 0, control: 'mutacion_id' },
    Roles: { etiqueta: 'Roles', paso: 0 },
    Alineamiento: { etiqueta: 'Alineamiento', paso: 0 },
    'Conjuros.Arcanos': { etiqueta: 'Arcanos', paso: 0, control: 'conjuros_arcanos' },
    'Conjuros.Divinos': { etiqueta: 'Divinos', paso: 0, control: 'conjuros_divinos' },
    'Conjuros.Psionicos': { etiqueta: 'Psiónicos', paso: 0, control: 'conjuros_psionicos' },
    'Conjuros.Lanzamiento_espontaneo': { etiqueta: 'Lanzamiento espontáneo', paso: 0, control: 'lanzamiento_espontaneo' },
    'Conjuros.puede_elegir_especialidad': { etiqueta: 'Puede especializarse', paso: 0, control: 'puede_elegir_especialidad' },
    'Conjuros.Dependientes_alineamiento': { etiqueta: 'Conjuros de su alineamiento', paso: 0, control: 'conjuros_dependientes_alineamiento' },
    'Conjuros.Conocidos_total': { etiqueta: 'Conocidos en total', paso: 0, control: 'conocidos_total' },
    'Conjuros.Conocidos_nivel_a_nivel': { etiqueta: 'Conocidos por nivel', paso: 0, control: 'conocidos_nivel' },
    Mod_salv_conjuros: { etiqueta: 'Salvación de los conjuros', paso: 0, control: 'mod_salv_conjuros' },
    Aumenta_clase_lanzadora: { etiqueta: 'Aumenta clase lanzadora', paso: 0, control: 'aumenta_clase_lanzadora' },
    'Ataque_base.Id': { etiqueta: 'Ataque base', paso: 1, control: 'id_ataque_base' },
    'Salvaciones.Fortaleza.Id': { etiqueta: 'Fortaleza', paso: 1, control: 'fortaleza_id' },
    'Salvaciones.Reflejos.Id': { etiqueta: 'Reflejos', paso: 1, control: 'reflejos_id' },
    'Salvaciones.Voluntad.Id': { etiqueta: 'Voluntad', paso: 1, control: 'voluntad_id' },
    // También `400 tabla_de_niveles_incompleta` y `tabla_de_niveles_no_valida`: la tabla de DG, dotes y armadura natural.
    Desglose_niveles: { etiqueta: 'Progresión', paso: 1 },
    Competencias: { etiqueta: 'Competencias', paso: 2 },
    Idiomas: { etiqueta: 'Idiomas automáticos', paso: 2 },
    Idiomas_adicionales: { etiqueta: 'Idiomas adicionales', paso: 2 },
    Habilidades: { etiqueta: 'Habilidades', paso: 3 },
    'Conjuros.Clase_origen': { etiqueta: 'Clase origen de los conjuros', paso: 4, control: 'clase_origen_id' },
    'Conjuros.Escuela_especialista': { etiqueta: 'Siempre especialista en', paso: 4, control: 'escuela_especialista_id' },
    'Conjuros.Nivel_lanzador_divisor': { etiqueta: 'Divisor del nivel de lanzador', paso: 4, control: 'nivel_lanzador_divisor' },
    'Conjuros.Libro.Iniciales': { etiqueta: 'Conjuros iniciales en el libro', paso: 4, control: 'libro_iniciales' },
    'Conjuros.Libro.Por_nivel': { etiqueta: 'Conjuros nuevos por nivel', paso: 4, control: 'libro_por_nivel' },
    Conjuros: { etiqueta: 'Magia', paso: 4 },
    'Desglose_niveles.Conjuros_diarios': { etiqueta: 'Conjuros diarios', paso: 4 },
    'Desglose_niveles.Conjuros_conocidos_nivel_a_nivel': { etiqueta: 'Conjuros conocidos por nivel', paso: 4 },
    'Desglose_niveles.Conjuros_conocidos_total': { etiqueta: 'Conjuros conocidos en total', paso: 4 },
    'Desglose_niveles.Dotes': { etiqueta: 'Dotes por nivel', paso: 5 },
    'Desglose_niveles.Especiales': { etiqueta: 'Especiales por nivel', paso: 5 },
    // La ex clase (`400 ex_especial_ajeno`: una aptitud que pierde y la clase no da).
    'Ex.Pierde_magia': { etiqueta: 'Pierde su magia', paso: 5, control: 'ex_pierde_magia' },
    'Ex.Requiere_expiacion': { etiqueta: 'Solo con una expiación', paso: 5, control: 'ex_requiere_expiacion' },
    Ex: { etiqueta: 'Si deja de cumplir su alineamiento', paso: 5 },
    Prerrequisitos: { etiqueta: 'Prerrequisitos', paso: 6 },
};

/** Un nivel de la tabla propia de una clase en el formulario: si da un DG, si da una dote y la armadura natural total. */
export interface FilaTablaDeNiveles {
    nivel: number;
    dg: boolean;
    dote: boolean;
    armadura_natural: number;
}

/**
 * Lo que comprueba la API de la tabla de DG, dotes y armadura natural antes de guardarla (`comprobar_tabla` de
 * `utils/clase_niveles.py`; `docs/publica/endpoints/catalogos.md`, `tabla_de_niveles_incompleta` y
 * `tabla_de_niveles_no_valida`), con sus frases, para decirlo en el paso antes de mandar: todos los niveles de 1 a
 * `nivelMax`, el 1.º da un DG y la armadura natural total no baja. `null` si vale.
 */
export function falloDeTablaDeNiveles(filas: readonly FilaTablaDeNiveles[], nivelMax: number): string | null {
    const porNivel = new Map(filas.map((fila) => [fila.nivel, fila]));
    const niveles = Array.from({ length: Math.max(0, nivelMax) }, (_, i) => i + 1);
    if (porNivel.size !== niveles.length || niveles.some((nivel) => !porNivel.has(nivel)))
        return `La tabla de DG, dotes y armadura natural de la clase lleva todos sus niveles, del 1 al ${nivelMax}.`;
    if (!porNivel.get(1)?.dg)
        return 'El 1.er nivel de la clase da un DG.';
    let anterior = 0;
    for (const nivel of niveles) {
        const armadura = Number(porNivel.get(nivel)?.armadura_natural) || 0;
        if (armadura < 0)
            return 'La armadura natural de la clase no puede ser negativa.';
        if (armadura < anterior)
            return `La armadura natural de la tabla es el total a cada nivel: no puede bajar (nivel ${nivel}).`;
        anterior = armadura;
    }
    return null;
}

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
