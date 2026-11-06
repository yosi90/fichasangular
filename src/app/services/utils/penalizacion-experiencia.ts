import { Comodin } from 'src/app/interfaces/comodin';
import { toInt, toText } from 'src/app/services/utils/normalizacion';

/**
 * La penalización de experiencia por multiclase (Manual del jugador, cap. 3, «Experiencia en multiclase»; SRD 3.5,
 * «Multiclass characters», «XP for multiclass characters»):
 *
 * - Si alguna clase del personaje está a más de un nivel de su clase de más nivel, gana un 20 % menos de PX por cada
 *   clase que esté así.
 * - La clase predilecta de su raza no cuenta. Con la predilecta «Cualquiera» (el humano y el semielfo: el comodín de la
 *   raza, `Clase_predilecta_comodin`), no cuenta su clase de más nivel.
 * - Las clases de prestigio no cuentan nunca (Guía del DM, cap. 6). Los DG raciales tampoco: no son una clase.
 *
 * No cambia la experiencia con la que se crea el personaje (la mínima de su NEP): es la que gane después. Nada va por el
 * nombre ni el id de una clase o una raza: la predilecta es la de los datos de la raza.
 */

/** Una clase del personaje: su id, su nombre (para explicarlo), sus niveles y si es de prestigio. */
export interface ClaseParaPenalizacion {
    id: number;
    nombre: string;
    nivel: number;
    prestigio: boolean;
}

/** La clase predilecta de la raza: su id y, si es el comodín «Cualquiera», `'cualquiera'`. */
export interface ClasePredilecta {
    id: number;
    comodin: Comodin | null;
}

export interface PenalizacionExperiencia {
    /** Lo que deja de ganar: 0, 20, 40… (por ciento). */
    porcentaje: number;
    /** Las clases a más de un nivel de la de más nivel, con su nivel («pícaro 1»). */
    penalizadas: string[];
    /** La clase de más nivel de las que cuentan, con su nivel («guerrero 4»); `null` si no cuenta ninguna. */
    referencia: string | null;
    /** La clase que no cuenta por ser la predilecta («mago 2»); `null` si no tiene ninguna de esas. */
    predilecta: string | null;
}

export const PORCENTAJE_POR_CLASE = 20;

const SIN_PENALIZACION: PenalizacionExperiencia = { porcentaje: 0, penalizadas: [], referencia: null, predilecta: null };

function conNivel(clase: ClaseParaPenalizacion): string {
    return `${clase.nombre} ${clase.nivel}`;
}

/** La penalización de PX de un personaje con esas clases y esa clase predilecta de su raza. */
export function penalizacionExperiencia(
    clases: readonly ClaseParaPenalizacion[] | null | undefined,
    predilecta: ClasePredilecta | null | undefined,
): PenalizacionExperiencia {
    const basicas = (clases ?? [])
        .map((clase) => ({ ...clase, nombre: toText(clase?.nombre).trim(), nivel: toInt(clase?.nivel), id: toInt(clase?.id) }))
        .filter((clase) => clase.nivel > 0 && !clase.prestigio)
        // De más nivel a menos; a igual nivel, la primera que cogió.
        .sort((a, b) => b.nivel - a.nivel);
    if (basicas.length < 2)
        return SIN_PENALIZACION;

    let excluida: ClaseParaPenalizacion | null = null;
    if (predilecta?.comodin === 'cualquiera')
        excluida = basicas[0];
    else if (toInt(predilecta?.id) > 0)
        excluida = basicas.find((clase) => clase.id === toInt(predilecta?.id)) ?? null;
    const cuentan = basicas.filter((clase) => clase !== excluida);
    if (cuentan.length < 2)
        return { ...SIN_PENALIZACION, predilecta: excluida ? conNivel(excluida) : null };

    const masAlta = cuentan[0];
    const penalizadas = cuentan.filter((clase) => masAlta.nivel - clase.nivel > 1);
    return {
        porcentaje: penalizadas.length * PORCENTAJE_POR_CLASE,
        penalizadas: penalizadas.map(conNivel),
        referencia: conNivel(masAlta),
        predilecta: excluida ? conNivel(excluida) : null,
    };
}

/** «−20 % de PX» o `''` sin penalización. */
export function etiquetaPenalizacionExperiencia(penalizacion: PenalizacionExperiencia | null | undefined): string {
    const porcentaje = toInt(penalizacion?.porcentaje);
    return porcentaje > 0 ? `−${porcentaje} % de PX` : '';
}

/**
 * La explicación: «Gana un 20 % menos de experiencia: pícaro 1 está a más de un nivel de guerrero 4. No cuenta mago 2,
 * su clase predilecta.» `''` sin penalización.
 */
export function textoPenalizacionExperiencia(penalizacion: PenalizacionExperiencia | null | undefined): string {
    if (!penalizacion || penalizacion.porcentaje <= 0)
        return '';
    const lista = unirConY(penalizacion.penalizadas);
    const verbo = penalizacion.penalizadas.length === 1 ? 'está' : 'están';
    const predilecta = penalizacion.predilecta ? ` No cuenta ${penalizacion.predilecta}, su clase predilecta.` : '';
    return `Gana un ${penalizacion.porcentaje} % menos de experiencia: ${lista} ${verbo} a más de un nivel de `
        + `${penalizacion.referencia} (Manual del jugador, «Experiencia en multiclase»).${predilecta}`;
}

function unirConY(partes: string[]): string {
    if (partes.length <= 1)
        return partes.join('');
    return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}
