import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { Comodin } from 'src/app/interfaces/comodin';
import { leerComodin } from 'src/app/services/utils/comodin';
import { experienciaParaNivel } from 'src/app/services/utils/experiencia-nivel';
import { toArray, toBoolean, toInt, toText } from 'src/app/services/utils/normalizacion';

/**
 * La penalización de experiencia por multiclase (Manual del jugador, cap. 3, «Experiencia en multiclase»; SRD 3.5,
 * «Multiclass characters», «XP for multiclass characters»):
 *
 * - Si alguna clase del personaje está a más de un nivel de su clase de más nivel, gana un 20 % menos de PX por cada
 *   clase que esté así.
 * - Las clases predilectas de su raza no cuentan: la principal (`Id_clase_predilecta`) y las demás
 *   (`Clases_predilectas_extra`: la prole de Bahamut sobre un elfo, mago y guerrero; *Races of the Dragon*, pág. 10).
 *   Con la predilecta «Cualquiera» (el humano y el semielfo: el comodín de la raza, `Clase_predilecta_comodin`), no
 *   cuenta su clase de más nivel, sea o no una de las demás (el humano prole guerrero 6 / mago 4 / pícaro 1 pierde un 20 %:
 *   su clase de más nivel ya es guerrero). Sin clase predilecta (su libro no le da una, como a los dragones:
 *   `Id_clase_predilecta` nulo y sin comodín), cuentan todas.
 * - Las clases de prestigio no cuentan nunca (Guía del DM, cap. 6), ni las que no penalizan la multiclase (las clases de
 *   monstruo de *Libris Mortis*, pág. 35: `noPenalizaMulticlase`). Los DG raciales tampoco: no son una clase.
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

/**
 * Si una clase del catálogo no cuenta para la penalización (`ClaseParaPenalizacion.prestigio`): las de prestigio, por su
 * dato `Prestigio`, y como ellas las que tienen `Sin_penalizacion_multiclase`.
 */
export function noPenalizaMulticlase(clase: { Prestigio?: unknown; Sin_penalizacion_multiclase?: unknown; } | null | undefined): boolean {
    return toBoolean(clase?.Prestigio) || toBoolean(clase?.Sin_penalizacion_multiclase);
}

/**
 * Las clases predilectas de la raza: la principal por su id y, si es el comodín «Cualquiera», `'cualquiera'` (sin clase
 * predilecta, id 0 sin comodín); y los ids de las demás (`otras`).
 */
export interface ClasePredilecta {
    id: number;
    comodin: Comodin | null;
    otras?: readonly number[];
}

/** Las clases predilectas de una raza de la API o de la caché (`Id_clase_predilecta`, su comodín y `Clases_predilectas_extra`). */
export function clasePredilectaDeRaza(raza: {
    Id_clase_predilecta?: unknown; Clase_predilecta_comodin?: unknown; Clases_predilectas_extra?: unknown;
} | null | undefined): ClasePredilecta | null {
    if (!raza)
        return null;
    return {
        id: toInt(raza.Id_clase_predilecta),
        comodin: leerComodin(raza.Clase_predilecta_comodin),
        otras: toArray<{ Id?: unknown }>(raza.Clases_predilectas_extra).map((clase) => toInt(clase?.Id)).filter((id) => id > 0),
    };
}

export interface PenalizacionExperiencia {
    /** Lo que deja de ganar: 0, 20, 40… (por ciento). */
    porcentaje: number;
    /** Las clases a más de un nivel de la de más nivel, con su nivel («pícaro 1»). */
    penalizadas: string[];
    /** La clase de más nivel de las que cuentan, con su nivel («guerrero 4»); `null` si no cuenta ninguna. */
    referencia: string | null;
    /** Las clases que no cuentan por ser predilectas («mago 2»), de más nivel a menos; vacía si no tiene ninguna. */
    predilectas: string[];
}

export const PORCENTAJE_POR_CLASE = 20;

const SIN_PENALIZACION: PenalizacionExperiencia = { porcentaje: 0, penalizadas: [], referencia: null, predilectas: [] };

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

    const ids = new Set([toInt(predilecta?.id), ...(predilecta?.otras ?? []).map((id) => toInt(id))].filter((id) => id > 0));
    const excluidas = basicas.filter((clase, indice) => (indice === 0 && predilecta?.comodin === 'cualquiera') || ids.has(clase.id));
    const predilectas = excluidas.map(conNivel);
    const cuentan = basicas.filter((clase) => !excluidas.includes(clase));
    if (cuentan.length < 2)
        return { ...SIN_PENALIZACION, predilectas };

    const masAlta = cuentan[0];
    const penalizadas = cuentan.filter((clase) => masAlta.nivel - clase.nivel > 1);
    return {
        porcentaje: penalizadas.length * PORCENTAJE_POR_CLASE,
        penalizadas: penalizadas.map(conNivel),
        referencia: conNivel(masAlta),
        predilectas,
    };
}

/**
 * El límite de NEP de una campaña cuenta en experiencia (`politicaCreacion.nepMaximoPersonajeNuevo`; propietario,
 * 2026-11-07: un elfo mago 8 no puede valer lo mismo que un elfo guerrero 5 / pícaro 3): el límite se pasa a PX con la
 * tabla de PX por nivel (`experienciaParaNivel`, Manual del jugador, tabla 3-2) y un personaje con la penalización p
 * solo llega al NEP cuyos PX caben en PX del límite × (1 − p), con p como mucho del 100 %. Con límite 8 (28 000 PX) y
 * −20 %, 22 400 PX: NEP 7. La misma regla que la API (`utils/penalizacion_experiencia.py`), que la comprueba al guardar
 * (`400 nivel_maximo_por_penalizacion`).
 */
export function nepMaximoConPenalizacion(nepLimite: number, porcentaje: number): number {
    const limite = Math.max(0, toInt(nepLimite));
    const perdido = Math.min(100, Math.max(0, toInt(porcentaje)));
    const tope = experienciaParaNivel(limite) * (100 - perdido);
    let nep = limite;
    while (nep > 1 && experienciaParaNivel(nep) * 100 > tope)
        nep--;
    return nep;
}

/** El límite de NEP de la campaña para un personaje con esa penalización: el de la campaña y el que le queda. */
export interface LimiteNepCampana {
    limite: number;
    maximo: number;
    porcentaje: number;
}

/** `null` sin límite (sin campaña, sin tope, un PNJ o el máster que se lo salta). */
export function limiteNepConPenalizacion(
    nepLimite: number | null | undefined,
    penalizacion: PenalizacionExperiencia | null | undefined,
): LimiteNepCampana | null {
    if (nepLimite === null || nepLimite === undefined)
        return null;
    const limite = Math.max(0, toInt(nepLimite));
    const porcentaje = Math.max(0, toInt(penalizacion?.porcentaje));
    return { limite, maximo: nepMaximoConPenalizacion(limite, porcentaje), porcentaje };
}

/**
 * Por qué no puede coger el nivel si con él pasa del NEP que le deja la campaña, como los demás motivos de campaña
 * («bloqueada por campaña: …»); `null` si cabe.
 */
export function motivoLimiteNepCampana(limite: LimiteNepCampana | null, nepTras: number): string | null {
    if (!limite || toInt(nepTras) <= limite.maximo)
        return null;
    return limite.maximo < limite.limite
        ? `bloqueada por campaña: con un ${limite.porcentaje} % de penalización de experiencia, su NEP máximo baja a `
            + `${limite.maximo} y tendría NEP ${toInt(nepTras)}`
        : `bloqueada por campaña: su NEP máximo es ${limite.limite} y tendría NEP ${toInt(nepTras)}`;
}

/**
 * El aviso de coger una clase que hace aparecer o subir la penalización en una campaña con límite: «Con esta clase
 * tendrá un 20 % de penalización de experiencia: en esta campaña, su nivel máximo (NEP) baja de 8 a 7.» `''` si no
 * sube (o no hay límite).
 */
export function avisoPenalizacionConLimite(limite: LimiteNepCampana | null, porcentajeActual: number): string {
    if (!limite || limite.porcentaje <= Math.max(0, toInt(porcentajeActual)))
        return '';
    const baja = limite.maximo < limite.limite
        ? `su nivel máximo (NEP) baja de ${limite.limite} a ${limite.maximo}`
        : `su nivel máximo (NEP) sigue en ${limite.limite}`;
    return `Con esta clase tendrá un ${limite.porcentaje} % de penalización de experiencia: en esta campaña, ${baja}.`;
}

/**
 * El máximo efectivo del paso de clases: «La campaña limita el NEP a 8; ahora tiene NEP 6.», y con penalización
 * «… Con su penalización de experiencia (20 %), su NEP máximo es 7.». `''` sin límite.
 */
export function textoLimiteNepCampana(limite: LimiteNepCampana | null, nepActual: number): string {
    if (!limite)
        return '';
    const base = `La campaña limita el NEP de los personajes nuevos a ${limite.limite}; ahora tiene NEP ${Math.max(0, toInt(nepActual))}.`;
    return limite.maximo < limite.limite
        ? `${base} Con su penalización de experiencia (${limite.porcentaje} %), su NEP máximo es ${limite.maximo}.`
        : base;
}

/** «−20 % de PX» o `''` sin penalización. */
export function etiquetaPenalizacionExperiencia(penalizacion: PenalizacionExperiencia | null | undefined): string {
    const porcentaje = toInt(penalizacion?.porcentaje);
    return porcentaje > 0 ? `−${porcentaje} % de PX` : '';
}

/**
 * La explicación: «Gana un 20 % menos de experiencia: pícaro 1 está a más de un nivel de guerrero 4. No cuenta mago 2,
 * su clase predilecta.» (con varias, «No cuentan mago 2 y guerrero 1, sus clases predilectas.»). `''` sin penalización.
 */
export function textoPenalizacionExperiencia(penalizacion: PenalizacionExperiencia | null | undefined): string {
    if (!penalizacion || penalizacion.porcentaje <= 0)
        return '';
    const lista = unirLista(penalizacion.penalizadas, 'y');
    const verbo = penalizacion.penalizadas.length === 1 ? 'está' : 'están';
    const predilectas = penalizacion.predilectas ?? [];
    const predilecta = predilectas.length === 0 ? ''
        : predilectas.length === 1 ? ` No cuenta ${predilectas[0]}, su clase predilecta.`
            : ` No cuentan ${unirLista(predilectas, 'y')}, sus clases predilectas.`;
    return `Gana un ${penalizacion.porcentaje} % menos de experiencia: ${lista} ${verbo} a más de un nivel de `
        + `${penalizacion.referencia} (Manual del jugador, «Experiencia en multiclase»).${predilecta}`;
}
