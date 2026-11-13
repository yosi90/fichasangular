import { Clase } from 'src/app/interfaces/clase';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { PRIORIDAD_ALINEAMIENTO_ESTRICTA, getVectorDesdeIdBasico, getVectorDesdeNombreBasico, reglaDePreferenciaAlineamiento } from './alineamiento-contrato';
import { incumpleAlineamientoDeidad } from './alineamiento-deidad';
import { evaluarPrerrequisitosDeAlineamientoClase } from './clase-elegibilidad';
import { toInt } from './normalizacion';

/*
 * El alineamiento de una clase, y solo él (roadmap de sesiones, fase 6: la corrección de la ficha comprueba las clases
 * que ya tiene cuando cambia su alineamiento o su deidad; la creación, al elegirla). Sale de los datos de la clase, nunca
 * de su nombre:
 * - su alineamiento (`Alineamiento`): el básico que exige (`Basico.Id_basico`, el paladín legal bueno) y lo que piden
 *   sus preferencias de ley y de moral (su `Valor`, si lo prohíbe y su `Id_prioridad`, como dato: «Nunca legal»,
 *   «Siempre maligno»), con la prioridad del alineamiento (`Prioridad.Id_prioridad`);
 * - sus prerrequisitos de alineamiento y de actitud (`alineamiento_requerido`, `actitud_prohibido`…, el druida);
 * - la regla de la deidad (`Alineamiento_deidad`, el clérigo: MJ cap. 3); con `Alineamiento_deidad_igual`, el mismo
 *   alineamiento que su deidad y con deidad (el cruzado divino: El divino completo, págs. 30-31).
 * Solo una regla de prioridad «siempre» (3) o más vuelve homebrew la ficha (MJ págs. 26, 30, 52 y 55: el ex paladín, el
 * ex monje…); las demás («casi siempre», «tendencia a») se avisan. Los prerrequisitos, la deidad y una preferencia
 * de prioridad 3 («Siempre …» o «Nunca …») cuentan como «siempre» aunque la clase no traiga esa prioridad. La API
 * aplica la misma regla (`utils/alineamiento_clase.py`) para saber qué clases quedan ex.
 */

/**
 * El nombre de una ex clase: «Ex paladín», con «ex» separado como en la edición española (MJ, «Ex paladines»). El de la
 * ficha lo da la API (`clases[].ex.nombre`, `utils/ex_clases.frase_ex`); este, el de lo que aún no se ha guardado.
 */
export function nombreExClase(nombreClase: string | null | undefined): string {
    return `Ex ${`${nombreClase ?? ''}`.trim().toLowerCase()}`.trim();
}

export interface EvaluacionAlineamientoClase {
    /** Lo que no cumple, en frases («Requiere legal», «Prohíbe bueno», «Debe estar a un paso del alineamiento de…»). */
    incumple: string[];
    /** Lo que no se ha podido interpretar de los datos (no bloquea). */
    sinComprobar: string[];
    /** La prioridad de lo que incumple (la de su alineamiento; 3 si es un prerrequisito o la deidad). */
    prioridad: number;
    /** Si lo que incumple vuelve homebrew la ficha (`prioridad` de 3 o más). */
    estricta: boolean;
    /** Si la clase pide algo de su alineamiento (aunque se cumpla). */
    restringe: boolean;
}

export interface EntradaAlineamientoClase {
    /** El alineamiento del personaje (su nombre básico: «Legal bueno»). */
    alineamiento: string;
    /** Su deidad, para las clases con `Alineamiento_deidad` (`null`, sin deidad: el cruzado divino no lo admite). */
    deidad?: DeidadDetalle | null;
    /**
     * Si cuentan sus prerrequisitos de alineamiento (por defecto, sí). La creación los evalúa con los demás prerrequisitos
     * al elegir la clase (`evaluarElegibilidadClase`) y aquí solo pide el alineamiento de la clase y la deidad.
     */
    conPrerrequisitos?: boolean;
}

const EJES = [['Ley', 'ley'], ['Moral', 'moral']] as const;

function textoEje(eje: 'ley' | 'moral', valor: number): string {
    return eje === 'ley'
        ? (valor > 0 ? 'legal' : valor < 0 ? 'caótico' : 'neutral')
        : (valor > 0 ? 'bueno' : valor < 0 ? 'maligno' : 'neutral');
}

/** Si el personaje cumple el alineamiento de una clase, solo eso (sin nivel, características ni otros prerrequisitos). */
export function evaluarAlineamientoClase(clase: Clase | null | undefined, entrada: EntradaAlineamientoClase): EvaluacionAlineamientoClase {
    const vacia: EvaluacionAlineamientoClase = { incumple: [], sinComprobar: [], prioridad: 0, estricta: false, restringe: false };
    if (!clase)
        return vacia;
    const personaje = getVectorDesdeNombreBasico(entrada.alineamiento);
    if (!personaje)
        return { ...vacia, sinComprobar: ['No se pudo interpretar el alineamiento del personaje.'] };

    const incumple: string[] = [];
    const sinComprobar: string[] = [];
    let restringe = false;
    let estrictoPorRegla = false;
    const alineamiento = clase.Alineamiento;

    const basico = getVectorDesdeIdBasico(toInt(alineamiento?.Basico?.Id_basico));
    if (basico) {
        restringe = true;
        if (basico.ley !== personaje.ley || basico.moral !== personaje.moral)
            incumple.push(`Requiere ${basico.ley === 0 && basico.moral === 0 ? 'neutral auténtico' : `${textoEje('ley', basico.ley)} ${textoEje('moral', basico.moral)}`}`);
    }
    EJES.forEach(([campo, eje]) => {
        const regla = reglaDePreferenciaAlineamiento(alineamiento?.[campo]);
        if (!regla)
            return;
        restringe = true;
        const coincide = personaje[eje] === regla.valor;
        const falla = regla.prohibe ? coincide : !coincide;
        if (falla)
            incumple.push(`${regla.prohibe ? 'Prohíbe' : 'Requiere'} ${textoEje(eje, regla.valor)}`);
        estrictoPorRegla = estrictoPorRegla || (falla && regla.estricta);
    });

    if (clase.Alineamiento_deidad === true) {
        const igual = clase.Alineamiento_deidad_igual === true;
        const motivo = incumpleAlineamientoDeidad(entrada.alineamiento, entrada.deidad ?? null, igual);
        restringe = restringe || !!entrada.deidad || igual;
        if (motivo) {
            incumple.push(motivo);
            estrictoPorRegla = true;
        }
    }

    if (entrada.conPrerrequisitos !== false) {
        const prerrequisitos = evaluarPrerrequisitosDeAlineamientoClase(clase, entrada.alineamiento);
        restringe = restringe || prerrequisitos.incumple.length > 0 || prerrequisitos.sinComprobar.length > 0;
        if (prerrequisitos.incumple.length > 0) {
            incumple.push(...prerrequisitos.incumple);
            estrictoPorRegla = true;
        }
        sinComprobar.push(...prerrequisitos.sinComprobar);
    }

    const prioridad = estrictoPorRegla ? Math.max(PRIORIDAD_ALINEAMIENTO_ESTRICTA, toInt(alineamiento?.Prioridad?.Id_prioridad))
        : toInt(alineamiento?.Prioridad?.Id_prioridad);
    return {
        incumple,
        sinComprobar,
        prioridad,
        estricta: incumple.length > 0 && prioridad >= PRIORIDAD_ALINEAMIENTO_ESTRICTA,
        restringe,
    };
}
