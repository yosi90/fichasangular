import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';

/**
 * Las clases de monstruo en la creación (*Libris Mortis*, págs. 34-35; decisiones del propietario del 2026-11-07: se eligen
 * como raza, la mutada sobre la raza base, y la clase va desde el 1.er nivel y se termina antes que otra). Es la misma regla
 * que comprueba el alta (`docs/publica/endpoints/personajes.md`, «Clases de monstruo»: `clase_requiere_mutacion`,
 * `mutacion_requiere_clase` y `progresion_obligatoria_incompleta`), para que la creación solo ofrezca lo que se puede
 * guardar. Todo sale de los datos de las clases:
 *
 * - una clase con `Mutacion` solo la toma un personaje de esa raza mutada;
 * - la raza que es la `Mutacion` de una clase la lleva desde el 1.er nivel: hasta tener un nivel de ella, solo esa;
 * - una clase con `Progresion_obligatoria` por debajo de su `Nivel_max_claseo`: hasta terminarla, solo esa.
 *
 * La unión es una sola (`clase_raza_mutacion`): la API la da en la clase (`Mutacion`) y, desde el 2026-11-07, también en la
 * raza (`Clase_de_monstruo`, que enseñan los detalles). Estas reglas leen las clases porque necesitan la clase entera (su
 * progresión obligatoria y su nivel máximo): la clase de una raza es la que la tiene como `Mutacion`
 * (`docs/publica/RAZAS_MUTADAS.md`, «Cómo sabe la web qué clase lleva una mutada»).
 */

/** Lo que estas reglas leen de una clase. */
export interface ClaseDeMonstruo {
    Id: number;
    Nombre: string;
    Nivel_max_claseo?: number | null;
    Progresion_obligatoria?: boolean | null;
    Mutacion?: { Id: number; Nombre: string; } | null;
}

/** Una clase que ya tiene el personaje, con su nivel (`clase` `null` si no está en el catálogo). */
export interface ClaseTomada {
    clase: ClaseDeMonstruo | null;
    nombre: string;
    nivel: number;
}

export interface ContextoClasesDeMonstruo {
    /** La raza del personaje (con una mutada, la mutada: la combinada lleva su id) y su nombre. */
    idRaza: number;
    nombreRaza: string;
    catalogo: readonly ClaseDeMonstruo[];
    tomadas: readonly ClaseTomada[];
}

function mismaClase(a: Pick<ClaseDeMonstruo, 'Id' | 'Nombre'> | null | undefined, b: Pick<ClaseDeMonstruo, 'Id' | 'Nombre'> | null | undefined): boolean {
    if (!a || !b)
        return false;
    if (toInt(a.Id) > 0 && toInt(b.Id) > 0)
        return toInt(a.Id) === toInt(b.Id);
    return normalizarTexto(a.Nombre ?? '') === normalizarTexto(b.Nombre ?? '');
}

function nivelTomado(tomadas: readonly ClaseTomada[], clase: ClaseDeMonstruo): number {
    return (tomadas ?? [])
        .filter((tomada) => mismaClase(tomada.clase ?? { Id: 0, Nombre: tomada.nombre }, clase))
        .reduce((acc, tomada) => acc + Math.max(0, toInt(tomada.nivel)), 0);
}

/** La clase que lleva esa raza (la que la tiene como `Mutacion`), o `null` si no es la mutación de ninguna. */
export function claseDeLaRaza<T extends ClaseDeMonstruo>(catalogo: readonly T[] | null | undefined, idRaza: number): T | null {
    const id = toInt(idRaza);
    if (id <= 0)
        return null;
    return (catalogo ?? []).find((clase) => toInt(clase?.Mutacion?.Id) === id) ?? null;
}

/** «Hay que terminar «Engendro vampírico» (8 niveles) antes de tomar otra clase.», la frase del alta. */
export function motivoProgresionObligatoria(clase: Pick<ClaseDeMonstruo, 'Nombre' | 'Nivel_max_claseo'>): string {
    return `Hay que terminar «${`${clase.Nombre ?? ''}`.trim()}» (${toInt(clase.Nivel_max_claseo)} niveles) antes de tomar otra clase.`;
}

/**
 * La clase que el personaje tiene que tomar ahora y por qué: la de su raza si aún no tiene niveles de ella, o la de
 * progresión obligatoria que no ha terminado. `null` si puede tomar cualquiera.
 */
export function claseObligada(contexto: ContextoClasesDeMonstruo): { clase: ClaseDeMonstruo; motivo: string; } | null {
    const deLaRaza = claseDeLaRaza(contexto.catalogo, contexto.idRaza);
    if (deLaRaza && nivelTomado(contexto.tomadas, deLaRaza) < 1) {
        const raza = `${contexto.nombreRaza ?? ''}`.trim();
        return {
            clase: deLaRaza,
            motivo: `Un personaje de la raza «${raza}» empieza con su clase, «${`${deLaRaza.Nombre ?? ''}`.trim()}», desde el 1.er nivel.`,
        };
    }
    const pendiente = (contexto.tomadas ?? []).find((tomada) => !!tomada.clase?.Progresion_obligatoria
        && toInt(tomada.nivel) > 0
        && toInt(tomada.clase.Nivel_max_claseo) > toInt(tomada.nivel));
    if (pendiente?.clase)
        return { clase: pendiente.clase, motivo: motivoProgresionObligatoria(pendiente.clase) };
    return null;
}

/** Por qué el personaje no puede tomar ahora un nivel de esa clase por las reglas de las clases de monstruo; `null` si puede. */
export function motivoClaseDeMonstruo(clase: ClaseDeMonstruo, contexto: ContextoClasesDeMonstruo): string | null {
    const idMutacion = toInt(clase?.Mutacion?.Id);
    if (idMutacion > 0 && idMutacion !== toInt(contexto.idRaza)) {
        return `«${`${clase.Nombre ?? ''}`.trim()}» solo la puede tomar un personaje de la raza `
            + `«${`${clase.Mutacion?.Nombre ?? ''}`.trim()}».`;
    }
    const obligada = claseObligada(contexto);
    return obligada && !mismaClase(obligada.clase, clase) ? obligada.motivo : null;
}

/**
 * El aviso de una raza que lleva una clase de monstruo, para quien la mira antes de elegirla: «Se juega con su clase,
 * «Engendro vampírico»: la toma desde el 1.er nivel y la termina (8 niveles) antes de cualquier otra.»
 */
export function avisoRazaConClase(clase: ClaseDeMonstruo): string {
    const nombre = `${clase.Nombre ?? ''}`.trim();
    const termina = clase.Progresion_obligatoria && toInt(clase.Nivel_max_claseo) > 1
        ? ` y la termina (${toInt(clase.Nivel_max_claseo)} niveles) antes de cualquier otra`
        : '';
    return `Se juega con su clase, «${nombre}»: la toma desde el 1.er nivel${termina}. Una campaña puede no permitir las clases de monstruo.`;
}
