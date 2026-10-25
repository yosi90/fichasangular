import { AptitudEspecialOtorgante } from 'src/app/interfaces/aptitud-especial';
import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { leerComodin } from 'src/app/services/utils/comodin';
import { ClaveEntidadPrerrequisito, existeCoincidenciaClaveEntidad } from 'src/app/services/utils/identidad-prerrequisitos';
import { normalizarTexto, toArray, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { frasePrerrequisito, grupoOpcionalPrerrequisito, razonNoCumple, razonSinComprobar } from 'src/app/services/utils/prerrequisito-frase';

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
}

interface EstadoGrupo {
    cumple: boolean;
    falla: boolean;
    unknown: boolean;
    frases: string[];
}

/**
 * Los motivos por los que una entidad (dote, clase, plantilla) no se puede elegir: cada obligatorio que no se cumple da
 * «No cumple: {Frase}», y cada grupo de alternativas sin ninguna que se cumpla, «No cumple: A o B».
 */
export class MotivosPrerrequisitos {
    readonly fail: string[] = [];
    readonly unknown: string[] = [];
    private readonly grupos = new Map<number, EstadoGrupo>();

    registrar(evaluacion: EvaluacionPrerrequisito): void {
        if (evaluacion.grupoOpcional <= 0) {
            if (!evaluacion.evaluable)
                this.unknown.push(evaluacion.razonUnknown);
            else if (!evaluacion.cumple)
                this.fail.push(razonNoCumple([evaluacion.frase]));
            return;
        }

        const estado = this.grupos.get(evaluacion.grupoOpcional) ?? { cumple: false, falla: false, unknown: false, frases: [] };
        estado.frases.push(evaluacion.frase);
        if (!evaluacion.evaluable)
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
            if (estado.unknown)
                this.unknown.push(`No se pudo validar por completo el grupo opcional ${grupo}`);
            else if (estado.falla)
                this.fail.push(razonNoCumple(estado.frases));
        });
    }
}

/**
 * Lo que tiene el personaje y puede otorgar una aptitud especial: sus raciales, sus especiales de clase (`claseas`) y sus
 * plantillas (los contextos de `dote-elegibilidad` y `clase-elegibilidad`).
 */
export interface OtorgantesAptitudPersonaje {
    raciales?: ClaveEntidadPrerrequisito[];
    claseas?: ClaveEntidadPrerrequisito[];
    plantillas?: ClaveEntidadPrerrequisito[];
}

/**
 * El prerrequisito `aptitud_especial` (dotes y clases) contra el personaje: lo cumple si tiene **alguno** de sus
 * `Raciales`, `Especiales` o `Plantillas` (por su `Id` o, sin él, por su nombre). Con las tres listas vacías la base no
 * sabe qué la otorga y no se puede comprobar (`evaluable: false`, «No se puede comprobar: {Frase}»), que no es lo mismo
 * que no cumplirlo. Contrato: «El prerrequisito "aptitud especial"» en `docs/publica/FRASES_PRERREQUISITOS_FRONT.md`.
 */
export function evaluarAptitudEspecial(
    pedido: PrerrequisitoItem,
    personaje: OtorgantesAptitudPersonaje,
): Omit<EvaluacionPrerrequisito, 'frase'> {
    const otorgantes: Array<[AptitudEspecialOtorgante[], ClaveEntidadPrerrequisito[]]> = [
        [toArray(pedido?.['Raciales']), personaje.raciales ?? []],
        [toArray(pedido?.['Especiales']), personaje.claseas ?? []],
        [toArray(pedido?.['Plantillas']), personaje.plantillas ?? []],
    ];
    const evaluable = otorgantes.some(([lista]) => lista.length > 0);
    return {
        grupoOpcional: grupoOpcionalPrerrequisito(pedido),
        evaluable,
        cumple: evaluable && otorgantes.some(([lista, actuales]) => lista.some((otorgante) =>
            existeCoincidenciaClaveEntidad(actuales, otorgante?.Id, otorgante?.Nombre))),
        razonUnknown: razonSinComprobar(frasePrerrequisito('aptitud_especial', pedido)),
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
