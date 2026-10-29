import { AptitudEspecialOtorgante } from 'src/app/interfaces/aptitud-especial';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { leerComodin } from 'src/app/services/utils/comodin';
import { ClaveEntidadPrerrequisito, existeCoincidenciaClaveEntidad } from 'src/app/services/utils/identidad-prerrequisitos';
import { normalizarTexto, toArray, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { frasePrerrequisito, grupoOpcionalPrerrequisito, avisoSinComprobar, razonNoCumple } from 'src/app/services/utils/prerrequisito-frase';

// Lo común de evaluar los prerrequisitos contra el personaje (`dote-elegibilidad`, `clase-elegibilidad`,
// `plantilla-elegibilidad`).

/** Lo que dice la evaluación de un prerrequisito contra el personaje. */
export interface EvaluacionPrerrequisito {
    /** 0 es obligatorio; el mismo número mayor que 0, alternativas (basta con una). */
    grupoOpcional: number;
    evaluable: boolean;
    cumple: boolean;
    /** Por qué no se ha podido evaluar (un formato que no se reconoce). */
    razonUnknown: string;
    /** La frase del prerrequisito (`frasePrerrequisito`), para el motivo «No cumple: …». */
    frase: string;
    /** El tipo del prerrequisito (`alineamiento_requerido`…), para saber qué bloquea sin leer el texto del motivo. */
    clave?: string;
    /**
     * Si la web no puede comprobarlo y lo deja elegir (decisión del propietario del 2026-10-25): cuenta como cumplido y
     * este aviso acompaña a la entidad. No es saltarse una restricción, así que no la vuelve homebrew.
     */
    aviso?: string;
}

interface EstadoGrupo {
    cumple: boolean;
    falla: boolean;
    unknown: boolean;
    frases: string[];
    avisos: string[];
    claves: string[];
}

/**
 * Los motivos por los que una entidad (dote, clase, plantilla) no se puede elegir: cada obligatorio que no se cumple da
 * «No cumple: {Frase}», y cada grupo de alternativas sin ninguna que se cumpla, «No cumple: A o B». En `avisos`, lo que
 * la web no puede comprobar y deja elegir (un grupo solo avisa si ninguna otra alternativa se cumple de verdad).
 */
export class MotivosPrerrequisitos {
    readonly fail: string[] = [];
    readonly unknown: string[] = [];
    readonly avisos: string[] = [];
    private readonly grupos = new Map<number, EstadoGrupo>();
    /** Los tipos de prerrequisito de cada motivo de `fail` y `unknown` añadido aquí (los añadidos a mano no tienen). */
    private readonly clavesDeMotivos: string[][] = [];

    registrar(evaluacion: EvaluacionPrerrequisito): void {
        const claves = evaluacion.clave ? [evaluacion.clave] : [];
        if (evaluacion.grupoOpcional <= 0) {
            if (evaluacion.aviso)
                this.avisos.push(evaluacion.aviso);
            else if (!evaluacion.evaluable)
                this.anotar(this.unknown, evaluacion.razonUnknown, claves);
            else if (!evaluacion.cumple)
                this.anotar(this.fail, razonNoCumple([evaluacion.frase]), claves);
            return;
        }

        const estado = this.grupos.get(evaluacion.grupoOpcional) ?? { cumple: false, falla: false, unknown: false, frases: [], avisos: [], claves: [] };
        estado.frases.push(evaluacion.frase);
        estado.claves.push(...claves);
        if (evaluacion.aviso)
            estado.avisos.push(evaluacion.aviso);
        else if (!evaluacion.evaluable)
            estado.unknown = true;
        else if (evaluacion.cumple)
            estado.cumple = true;
        else
            estado.falla = true;
        this.grupos.set(evaluacion.grupoOpcional, estado);
    }

    /** Cierra los grupos de alternativas: al acabar de registrar todos los prerrequisitos. */
    cerrarGrupos(): void {
        this.grupos.forEach((estado, grupo) => {
            if (estado.cumple)
                return;
            if (estado.avisos.length > 0)
                this.avisos.push(...estado.avisos);
            else if (estado.unknown)
                this.anotar(this.unknown, `No se pudo validar por completo el grupo opcional ${grupo}`, estado.claves);
            else if (estado.falla)
                this.anotar(this.fail, razonNoCumple(estado.frases), estado.claves);
        });
    }

    /**
     * Si todo lo que bloquea son prerrequisitos de estos tipos (por ejemplo, solo el alineamiento): se decide por el tipo,
     * no por el texto del motivo. Un motivo añadido a mano, sin tipo, cuenta como de otro tipo.
     */
    soloPorTipos(tipos: readonly string[]): boolean {
        const total = this.fail.length + this.unknown.length;
        return total > 0
            && this.clavesDeMotivos.length === total
            && this.clavesDeMotivos.every((claves) => claves.length > 0 && claves.every((clave) => tipos.includes(clave)));
    }

    private anotar(destino: string[], motivo: string, claves: string[]): void {
        destino.push(motivo);
        this.clavesDeMotivos.push(claves);
    }
}

/**
 * Lo que tiene el personaje y puede otorgar una aptitud especial: sus raciales, sus especiales de clase (`claseas`), sus
 * plantillas y sus dotes (los contextos de `dote-elegibilidad` y `clase-elegibilidad`).
 */
export interface OtorgantesAptitudPersonaje {
    raciales?: ClaveEntidadPrerrequisito[];
    claseas?: ClaveEntidadPrerrequisito[];
    plantillas?: ClaveEntidadPrerrequisito[];
    dotes?: ClaveEntidadPrerrequisito[];
}

/**
 * El prerrequisito `aptitud_especial` (dotes y clases) contra el personaje: lo cumple si tiene **alguno** de sus
 * `Raciales`, `Especiales`, `Plantillas` o `Dotes` (por su `Id` o, sin él, por su nombre). Con las cuatro listas vacías la base no
 * sabe qué la otorga y la web no puede comprobarla: se deja elegir con el aviso «La web no puede comprobar este requisito:
 * {Frase}» (decisión del propietario del 2026-10-25). Contrato: «El prerrequisito "aptitud especial"» en
 * `docs/publica/FRASES_PRERREQUISITOS_FRONT.md`.
 */
export function evaluarAptitudEspecial(
    pedido: PrerrequisitoItem,
    personaje: OtorgantesAptitudPersonaje,
): Omit<EvaluacionPrerrequisito, 'frase'> {
    const otorgantes: Array<[AptitudEspecialOtorgante[], ClaveEntidadPrerrequisito[]]> = [
        [toArray(pedido?.['Raciales']), personaje.raciales ?? []],
        [toArray(pedido?.['Especiales']), personaje.claseas ?? []],
        [toArray(pedido?.['Plantillas']), personaje.plantillas ?? []],
        [toArray(pedido?.['Dotes']), personaje.dotes ?? []],
    ];
    const grupoOpcional = grupoOpcionalPrerrequisito(pedido);
    if (otorgantes.every(([lista]) => lista.length < 1)) {
        const aviso = avisoSinComprobar(frasePrerrequisito('aptitud_especial', pedido));
        return { grupoOpcional, evaluable: true, cumple: true, razonUnknown: '', aviso };
    }
    return {
        grupoOpcional,
        evaluable: true,
        cumple: otorgantes.some(([lista, actuales]) => lista.some((otorgante) =>
            existeCoincidenciaClaveEntidad(actuales, otorgante?.Id, otorgante?.Nombre))),
        razonUnknown: '',
    };
}

/**
 * Si lo que tiene el personaje (una dote, un especial) vale por su extra como el prerrequisito que lo pide (`dote` de las
 * dotes, `dote_elegida` de las clases, `clase_especial`). `Extra_comodin` manda: `'elegir'`, el mismo extra que se elige
 * para la dote que lo pide (`seleccion`); `'cualquiera'`, con cualquier extra. Sin marca, -1 es sin extra, > 0 ese
 * extra, y el 0 o la falta de `Id_extra`, cualquiera (lo pedido no admite extras).
 */
export function cumpleExtraPedido(
    pedido: PrerrequisitoItem,
    actual: { idExtra: number | null; extra: string; },
    seleccion: { idExtra: number; extra: string; } = { idExtra: 0, extra: '' },
): boolean {
    const comodin = leerComodin(pedido?.['Extra_comodin']);
    if (comodin === 'cualquiera')
        return true;
    if (comodin === 'elegir') {
        if (seleccion.idExtra > 0)
            return toNumber(actual.idExtra) === seleccion.idExtra;
        const extraSeleccionado = normalizarTexto(seleccion.extra);
        return extraSeleccionado.length < 1 || normalizarTexto(actual.extra) === extraSeleccionado;
    }

    const idExtra = toInt(pedido?.['Id_extra'], 0);
    if (idExtra > 0)
        return toNumber(actual.idExtra) === idExtra;
    if (idExtra < 0)
        return toNumber(actual.idExtra) <= 0;
    return true;
}

/** Lo que dice la comparación de un prerrequisito, sin su grupo ni su frase (cada evaluador lee el `Opcional` a su manera). */
export type ComparacionPrerrequisito = Pick<EvaluacionPrerrequisito, 'evaluable' | 'cumple' | 'razonUnknown'>;

/**
 * `tamano_minimo` y `tamano_maximo` (dotes, clases y plantillas): el tamaño del personaje contra el pedido. Los ids de
 * `GET /tamanos` van de menor a mayor (Minúsculo 1 … Colosal 9), así que se comparan los ids. Quien llama da el tamaño
 * que cuenta: el de la raza con los pasos de tamaño de las plantillas.
 */
export function compararTamano(requeridoId: number, actualId: number | null | undefined, maximo: boolean): ComparacionPrerrequisito {
    const requerido = toInt(requeridoId, 0);
    const actual = toInt(actualId, 0);
    const evaluable = requerido > 0 && actual > 0;
    return {
        evaluable,
        cumple: evaluable && (maximo ? actual <= requerido : actual >= requerido),
        razonUnknown: maximo
            ? 'Prerrequisito de tamaño máximo con formato no reconocido'
            : 'Prerrequisito de tamaño mínimo con formato no reconocido',
    };
}

/**
 * `subtipo` (clases y plantillas) y `subtipo_prohibido` (plantillas): si el personaje tiene el subtipo pedido, por su
 * `Id_subtipo` o, sin él, por su nombre. Los subtipos del personaje son los de su raza (y su raza base) y los que le dan
 * las plantillas ya elegidas. Una raza sin subtipos cumple todos los `subtipo_prohibido`.
 */
export function compararSubtipo(
    pedido: Record<string, any>,
    subtipos: ClaveEntidadPrerrequisito[],
    prohibido: boolean,
): ComparacionPrerrequisito {
    const id = ['Id_subtipo', 'id_subtipo', 'IdSubtipo', 'idSubtipo', 'Id', 'id']
        .map((clave) => toNumber(pedido?.[clave]))
        .find((valor) => valor > 0) ?? 0;
    // Como el `parseNombre` de antes de unificarla: una clave vacía no tapa a la siguiente.
    const nombre = ['Subtipo', 'subtipo', 'Nombre', 'nombre']
        .map((clave) => `${pedido?.[clave] ?? ''}`.trim())
        .find((texto) => texto.length > 0) ?? '';
    const razonUnknown = prohibido
        ? 'Prerrequisito de subtipo prohibido con formato no reconocido'
        : 'Prerrequisito de subtipo con formato no reconocido';
    if (id <= 0 && normalizarTexto(nombre).length < 1)
        return { evaluable: false, cumple: false, razonUnknown };
    const tiene = existeCoincidenciaClaveEntidad(subtipos ?? [], id, nombre);
    return { evaluable: true, cumple: prohibido ? !tiene : tiene, razonUnknown };
}
