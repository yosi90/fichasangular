import { PrerrequisitoItem } from 'src/app/interfaces/prerrequisito';
import { leerComodin } from 'src/app/services/utils/comodin';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { razonNoCumple } from 'src/app/services/utils/prerrequisito-frase';

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
 * Si una dote del personaje vale por su extra como la dote pedida (`dote` de las dotes, `dote_elegida` de las clases).
 * El 0 de `Id_extra` lo explica `Extra_comodin`: `'elegir'`, el mismo extra que se elige para la dote que lo pide
 * (`seleccion`); `'cualquiera'`, con cualquier extra. Sin marca, -1 es sin extra, > 0 ese extra, y el 0 o la falta de
 * `Id_extra`, cualquiera (la dote pedida no admite extras).
 */
export function cumpleExtraDotePedida(
    pedida: PrerrequisitoItem,
    dote: { idExtra: number | null; extra: string; },
    seleccion: { idExtra: number; extra: string; } = { idExtra: 0, extra: '' },
): boolean {
    const comodin = leerComodin(pedida?.['Extra_comodin']);
    if (comodin === 'cualquiera')
        return true;
    if (comodin === 'elegir') {
        if (seleccion.idExtra > 0)
            return toNumber(dote.idExtra) === seleccion.idExtra;
        const extraSeleccionado = normalizarTexto(seleccion.extra);
        return extraSeleccionado.length < 1 || normalizarTexto(dote.extra) === extraSeleccionado;
    }

    const idExtra = toInt(pedida?.['Id_extra'], 0);
    if (idExtra > 0)
        return toNumber(dote.idExtra) === idExtra;
    if (idExtra < 0)
        return toNumber(dote.idExtra) <= 0;
    return true;
}
