import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * La tabla por nivel de una clase (`Desglose_niveles[].Dg`, `.Dote` y `.Armadura_natural`, de `clase_niveles` en la API;
 * `docs/publica/endpoints/catalogos.md`, `ClaseNivelDetalle`). Las clases de monstruo (*Libris Mortis*, págs. 35-40, con las
 * reglas de *Especies salvajes*, cap. 3) no dan un DG, sus puntos de habilidad ni una dote cada tres en cada nivel: solo
 * donde lo dice su tabla, que da además la armadura natural **total** a cada nivel (no se suma nivel a nivel; se apila con
 * la de la raza).
 *
 * - Una clase **tiene tabla** cuando sus filas dicen si dan dote (`Dote` `true` o `false`); sin tabla, `Dote` es `null` (o
 *   no viene, como en la caché de la RTDB, que no escribe los `null`) y la clase da lo de siempre: un DG en cada nivel, las
 *   dotes por nivel de personaje y ninguna armadura natural.
 * - El **nivel de personaje** (niveles de clase + DG raciales + DG de plantilla, `dgsTotales` de `nivel-personaje.ts`) no
 *   cambia: con él van los aumentos de característica cada 4, los rangos máximos y el NEP (*Libris Mortis*, pág. 32).
 * - Los **DG** de una clase con tabla son sus niveles con `Dg` hasta el suyo (un engendro vampírico 8 tiene 4 DG): con
 *   ellos van los PG, los puntos de habilidad, los prerrequisitos de DG y los bonos por DG (la misma cuenta que la API usa
 *   en el dato `dg` de los prerrequisitos de una mutación).
 * - Las **dotes**: en los niveles de una clase con tabla, solo las de sus filas con `Dote`; en los demás, las de siempre
 *   (el 1.º y cada 3 niveles de personaje). Un engendro vampírico 8 / guerrero 1 tiene las del 1.º y el 6.º de su clase y
 *   la del 9.º nivel de personaje (*Especies salvajes*: «después, dotes normalmente»).
 *
 * Nada va por el nombre ni el id de una clase: todo sale de su tabla.
 */

/** Lo que estas reglas leen de un nivel de una clase. */
export interface FilaTablaClase {
    Nivel?: number | null;
    Dg?: boolean | null;
    Dote?: boolean | null;
    Armadura_natural?: number | null;
}

/** Lo que estas reglas leen de una clase: sus filas por nivel. */
export interface ClaseConTabla {
    Desglose_niveles?: readonly FilaTablaClase[] | null;
}

/** Si la clase tiene tabla por nivel (sus filas dicen si dan dote). */
export function tieneTablaPorNivel(clase: ClaseConTabla | null | undefined): boolean {
    return (clase?.Desglose_niveles ?? []).some((fila) => fila?.Dote === true || fila?.Dote === false);
}

/** La fila de la tabla de la clase de ese nivel (con lo que traiga: el ataque base, las salvaciones…), o `null`. */
export function filaDeNivel<F extends FilaTablaClase>(clase: { Desglose_niveles?: readonly F[] | null; } | null | undefined,
    nivel: number): F | null {
    const buscado = toInt(nivel);
    return (clase?.Desglose_niveles ?? []).find((fila) => toInt(fila?.Nivel) === buscado) ?? null;
}

/** Si el nivel de personaje `nivel` da una dote por la regla de siempre (Manual del jugador, cap. 3: el 1.º y cada 3). */
export function daDotePorNivelDePersonaje(nivel: number): boolean {
    const n = toInt(nivel);
    return n === 1 || (n > 0 && n % 3 === 0);
}

/** Si el nivel de personaje `nivel` da un aumento de característica (Manual del jugador, tabla 3-2: cada 4). */
export function daIncrementoPorNivelDePersonaje(nivel: number): boolean {
    const n = toInt(nivel);
    return n > 0 && n % 4 === 0;
}

/** Si ese nivel de la clase da un DG (y sus puntos de habilidad). Sin tabla, siempre. */
export function daDgEnNivel(clase: ClaseConTabla | null | undefined, nivel: number): boolean {
    if (!tieneTablaPorNivel(clase))
        return true;
    return filaDeNivel(clase, nivel)?.Dg !== false;
}

/** Los DG que da la clase hasta ese nivel: sus niveles con DG; sin tabla, su nivel. */
export function dgsDeClase(clase: ClaseConTabla | null | undefined, nivel: number): number {
    const niveles = Math.max(0, toInt(nivel));
    if (!tieneTablaPorNivel(clase))
        return niveles;
    let dgs = 0;
    for (let actual = 1; actual <= niveles; actual++) {
        if (daDgEnNivel(clase, actual))
            dgs++;
    }
    return dgs;
}

/** Si ese nivel de la clase da una dote por su tabla; `null` sin tabla (las de siempre, por nivel de personaje). */
export function doteDeLaTabla(clase: ClaseConTabla | null | undefined, nivel: number): boolean | null {
    if (!tieneTablaPorNivel(clase))
        return null;
    return filaDeNivel(clase, nivel)?.Dote === true;
}

/**
 * La armadura natural que da la clase a ese nivel: el total de su fila (no la suma de las filas); si falta la fila, la de
 * la última que tenga por debajo. Sin tabla, 0.
 */
export function armaduraNaturalDeClase(clase: ClaseConTabla | null | undefined, nivel: number): number {
    const niveles = toInt(nivel);
    if (niveles < 1 || !tieneTablaPorNivel(clase))
        return 0;
    const fila = (clase?.Desglose_niveles ?? [])
        .filter((item) => toInt(item?.Nivel) >= 1 && toInt(item?.Nivel) <= niveles)
        .sort((a, b) => toInt(b?.Nivel) - toInt(a?.Nivel))[0];
    return Math.max(0, toInt(fila?.Armadura_natural));
}

/** Una clase del personaje y su nivel, en el orden en que la cogió (la clase de monstruo, la primera). */
export interface ClaseConNivel {
    clase: ClaseConTabla | null | undefined;
    nivel: number;
}

export interface EntradaHitosDotes {
    /** Los DG raciales que cuentan (`dgsRacialesQueCuentan`): sus dotes las da la raza (`Dgs_adicionales.Dotes_extra`). */
    dgsRaza: number;
    /** Los DG de plantilla (los del animal de un licántropo). */
    dgsPlantillas: number;
    clases: readonly ClaseConNivel[];
}

/**
 * Los niveles de personaje que dan una dote de la progresión (Manual del jugador, cap. 3: el 1.º y cada 3), sin las de los
 * DG raciales, que da la raza. Los niveles se cuentan en orden: los DG raciales, los de plantilla y después las clases, en
 * el orden en que se cogieron. Un nivel de una clase con tabla da dote si su fila lo dice, y no por ser el 1.º, el 3.º…
 * Sin clases con tabla, es la regla de siempre: los hitos 1, 3, 6, 9… por encima de los DG raciales.
 */
export function hitosDotesProgresion(entrada: EntradaHitosDotes): number[] {
    const hitos: number[] = [];
    let nivelPersonaje = Math.max(0, toInt(entrada.dgsRaza));
    const porNivelDePersonaje = (nivel: number) => {
        if (daDotePorNivelDePersonaje(nivel))
            hitos.push(nivel);
    };
    for (let dg = 0; dg < Math.max(0, toInt(entrada.dgsPlantillas)); dg++)
        porNivelDePersonaje(++nivelPersonaje);
    (entrada.clases ?? []).forEach(({ clase, nivel }) => {
        for (let nivelClase = 1; nivelClase <= Math.max(0, toInt(nivel)); nivelClase++) {
            nivelPersonaje++;
            const deLaTabla = doteDeLaTabla(clase, nivelClase);
            if (deLaTabla === null)
                porNivelDePersonaje(nivelPersonaje);
            else if (deLaTabla)
                hitos.push(nivelPersonaje);
        }
    });
    return hitos;
}
