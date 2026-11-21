import { Clase } from 'src/app/interfaces/clase';
import {
    CompaneroAptitudNivel,
    CompaneroBonosNivel,
    CompaneroMonstruoDetalle,
    CompaneroProgresion,
    MonstruoDetalle,
    MonstruoHabilidad,
} from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, primerEntero, toInt } from 'src/app/services/utils/normalizacion';
import { razonesAlineamientoMascota } from 'src/app/services/utils/nivel-clase-monstruo';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import {
    AptitudesMascotaDelNivel,
    aptitudesMascotaDelNivel,
    catalogoDeMascotaDesdeMonstruos,
    criaturaDeLaMascota,
    EstadoMascota,
    filaDelNivel,
    FilaMascotaResuelta,
    filasDeSusListas,
    resolverEstadoMascota,
    resolverFilaMascota,
    TextosMascota,
} from 'src/app/services/utils/mascota-cupos';
import { contarArmasNaturales } from 'src/app/services/utils/armas-naturales';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { modificadorCaracteristica } from 'src/app/services/utils/caracteristicas';

/*
 * El compañero animal, de los datos (contrato: `docs/publica/endpoints/catalogos.md`, «El compañero animal, de los
 * datos»; la API lo comprueba al guardar con las mismas reglas, `utils/companero_animal.py`). Sin ids ni nombres fijos;
 * lo común con el familiar, en `mascota-cupos.ts`:
 * - el nivel efectivo de druida suma lo que aporta cada clase cuya tabla da una aptitud con `Otorga_companero`, según su
 *   `Mascota` (máx(0, ⌊nivel / `Divisor`⌋ + `Ajuste`)), desde el nivel en que la da y, en un grupo opcional, solo si el
 *   personaje la eligió (el pirata que elige *Pelea sucia* no tiene compañero);
 * - la lista son las filas de `Niveles_clase` de la clase de su `Mascota.Lista` (el explorador, la del druida), cada una
 *   con su nivel mínimo, su `Ajuste` (lo que suma para la tabla), su plantilla, la dote que la abre (Compañero elevado,
 *   Compañero araña, Compañero sabandija) y, si lo pide, el ataque base del personaje;
 * - la tabla y las aptitudes de cada nivel, de `GET /companeros/progresion`, con el nivel efectivo más el ajuste de su fila.
 */

/** Las clases que le dan el compañero animal, su cupo, su nivel efectivo de druida y las listas de las que elige. */
export type EstadoCuposCompanero = EstadoMascota;

export interface FiltroCompanerosElegiblesInput {
    companeros: CompaneroMonstruoDetalle[];
    estado: EstadoCuposCompanero;
    alineamientoPersonaje: string;
    incluirHomebrew: boolean;
    /** Las dotes del personaje (las que abren una fila de la lista: Compañero elevado). */
    dotesPersonaje: ReadonlySet<number>;
    nivelSeleccionado?: number | null;
}

export interface CompaneroElegibilidadEvaluadaItem {
    companero: CompaneroMonstruoDetalle;
    elegible: boolean;
    razones: string[];
    nivelMinimoRequerido: number | null;
    /** El ajuste de la fila que le vale (o de la de menos nivel): lo que su lista suma para la tabla. */
    ajuste: number;
}

/** La fila de la lista con la que el personaje tiene ese compañero y el nivel de la tabla que le toca. */
export type FilaCompaneroResuelta = FilaMascotaResuelta;

/** Lo que da la tabla del compañero a un nivel: lo que tiene el amo y lo que tiene (y no tiene) el compañero. */
export type AptitudesCompaneroDelNivel = AptitudesMascotaDelNivel<CompaneroAptitudNivel>;

const SIN_BONOS: CompaneroBonosNivel = { Nivel: 0, Dg_adicionales: 0, Armadura_natural: 0, Fuerza_destreza: 0, Trucos_adicionales: 0 };

/** Cómo se llama el compañero y su lista en las frases (también las del reciclaje, `reciclaje-mascota.ts`). */
export const TEXTOS_COMPANERO: TextosMascota = { mascota: 'compañero animal', listaDe: 'compañeros animales', listaPorDefecto: 'druida' };

/** Las fuentes del compañero, su cupo (uno por personaje), su nivel efectivo de druida y las listas de las que elige. */
export function resolverEstadoCuposCompanero(personaje: Personaje, catalogoClases: Clase[]): EstadoCuposCompanero {
    return resolverEstadoMascota(personaje, catalogoClases, 'Otorga_companero', personaje?.Companeros);
}

/** Los DG del compañero animal: los de su monstruo y los adicionales que le da el nivel de su amo (MJ, cap. 3). */
export function dadosGolpeCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number {
    return (primerEntero(companero?.Dados_golpe?.Cantidad) ?? 0) + Math.max(0, toInt(companero?.Dg_adi));
}

/**
 * Si una dote del compañero es suya y no de su monstruo: la que le da la creación (`Contexto.Entidad` «personaje») o la
 * que tiene guardada (`Companero`, en la ficha). Las de su monstruo no se quitan ni se vuelven a dar.
 */
export function esDotePropiaDelCompanero(item: { Contexto?: Record<string, any> | null; } | null | undefined): boolean {
    const entidad = normalizarTexto(`${item?.Contexto?.['Entidad'] ?? ''}`);
    return entidad === 'personaje' || entidad === 'companero';
}

/**
 * Los puntos de habilidad de cada DG adicional del compañero: máx(1, puntos por DG del tipo de su monstruo + mod. de Int)
 * (MM, pág. 290; los `Puntos_habilidad` del tipo, como el reparto de la creación). Sin Inteligencia (una sabandija
 * descerebrada; `null`, o el 0 con que la base guarda el «—», como `utils/caracteristicas.puntuacion` de la API), ninguno
 * (la nota de la tabla 4-1).
 */
export function puntosPorDgDelCompanero(puntosDelTipo: number, inteligencia: number | null | undefined): number {
    if (inteligencia === null || inteligencia === undefined || toInt(inteligencia) <= 0)
        return 0;
    return Math.max(1, toInt(puntosDelTipo) + modificadorCaracteristica(toInt(inteligencia)));
}

/**
 * Los rangos del compañero con los DG adicionales que tiene ahora, «todo o nada», con el criterio de la herramienta de las
 * fichas guardadas de la API (`scripts/companeros_guardados.py`; contrato: `personajes.md`, «La mascota inactiva, y la
 * mascota en los cambios de la ficha»). Sus DG adicionales dan `puntosPorDgDelCompanero` cada uno; lo que pasa de su
 * monstruo (`delMonstruo`) cuesta 1 por rango en las habilidades de su monstruo y 2 en las demás, y no pasa de sus DG
 * adicionales (la mitad en las demás). Si cabe, se queda; si no, sus habilidades vuelven a las de su monstruo y las demás,
 * a 0. Al perder un nivel (o quedar inactivo, sin DG adicionales) pierde así los rangos de sus puntos.
 */
export function rangosDelCompaneroQueCaben(habilidades: readonly MonstruoHabilidad[], delMonstruo: readonly MonstruoHabilidad[],
    dgAdicionales: number, puntosDelTipo: number, inteligencia: number | null | undefined): MonstruoHabilidad[] {
    const dg = Math.max(0, toInt(dgAdicionales));
    const base = new Map((delMonstruo ?? []).map((h) => [toInt(h?.Id_habilidad), h] as const));
    let coste = 0;
    let cabe = true;
    (habilidades ?? []).forEach((h) => {
        const suya = base.get(toInt(h?.Id_habilidad));
        const exceso = Math.max(0, toInt(h?.Rangos) - toInt(suya?.Rangos));
        coste += exceso * (suya ? 1 : 2);
        if (exceso > (suya ? dg : dg / 2))
            cabe = false;
    });
    if (cabe && coste <= puntosPorDgDelCompanero(puntosDelTipo, inteligencia) * dg)
        return (habilidades ?? []).map((h) => ({ ...h }));
    return (habilidades ?? []).map((h) => {
        const suya = base.get(toInt(h?.Id_habilidad));
        return suya ? { ...h, Id_extra: suya.Id_extra, Extra: suya.Extra, Rangos: toInt(suya.Rangos) } : { ...h, Rangos: 0 };
    });
}

/** Las armas naturales del compañero (las de su monstruo), para los prerrequisitos de sus dotes (Ataque múltiple). */
export function armasNaturalesDelCompanero(companero: MonstruoDetalle | null | undefined): number {
    return contarArmasNaturales({ Armas_naturales: companero?.Armas_naturales ?? [] });
}

/**
 * La fila de la lista con la que el personaje tiene a ese compañero (`resolverFilaMascota`, con `sinPrerrequisitos`) y el
 * nivel de la tabla que le toca: su nivel efectivo más el ajuste de su fila. Si el ajuste lo deja en 0 o menos, aún no se
 * puede elegir (y el que ya tiene queda inactivo: `motivo`).
 */
export function resolverFilaCompanero(
    companero: CompaneroMonstruoDetalle,
    estado: EstadoCuposCompanero,
    dotesPersonaje: ReadonlySet<number>,
    sinPrerrequisitos?: ReadonlySet<number>,
): FilaCompaneroResuelta {
    const resuelta = resolverFilaMascota(companero, estado, dotesPersonaje, TEXTOS_COMPANERO, sinPrerrequisitos);
    if (!resuelta.fila || resuelta.nivelTabla >= 1)
        return resuelta;
    const nombre = `${companero?.Nombre ?? ''}`.trim();
    const lista = `${resuelta.fila?.Clase?.Nombre ?? ''}`.trim().toLocaleLowerCase('es') || TEXTOS_COMPANERO.listaPorDefecto;
    const ajuste = textoConSigno(resuelta.ajuste, '−');
    return {
        ...resuelta,
        fila: null,
        razones: [`Con el ajuste de su lista (${ajuste}), «${nombre}» se queda sin nivel efectivo de ${lista}: aún no se puede elegir.`],
        motivo: `Con el ajuste de su lista (${ajuste}), el ${TEXTOS_COMPANERO.mascota} «${criaturaDeLaMascota(companero)}» se queda sin nivel efectivo de ${lista}`,
    };
}

export function filtrarCompanerosElegibles(input: FiltroCompanerosElegiblesInput): CompaneroMonstruoDetalle[] {
    return evaluarCompanerosElegibilidad(input)
        .filter((item) => item.elegible)
        .map((item) => item.companero);
}

/** Si un compañero vale con lo que tiene el personaje y, si no, por qué (su lista, su dote, su nivel, su alineamiento). */
export function evaluarCompanerosElegibilidad(input: FiltroCompanerosElegiblesInput): CompaneroElegibilidadEvaluadaItem[] {
    const companeros = Array.isArray(input?.companeros) ? input.companeros : [];
    const nivelSeleccionado = Math.max(0, toInt(input?.nivelSeleccionado));
    const dotes = input?.dotesPersonaje ?? new Set<number>();
    const listas = new Set(input?.estado?.listasIds ?? []);
    const dedupe = new Map<string, CompaneroElegibilidadEvaluadaItem>();

    companeros.forEach((companero) => {
        const idCompanero = toInt(companero?.Id_companero);
        if (idCompanero <= 0)
            return;
        const resuelta = resolverFilaCompanero(companero, input.estado, dotes);
        const razones = [...resuelta.razones];
        if (!input?.incluirHomebrew && companero?.Oficial === false)
            razones.push('Es una opción homebrew y el filtro Homebrew está desactivado.');
        if (resuelta.fila && nivelSeleccionado > 0 && toInt(resuelta.fila.Nivel) !== nivelSeleccionado)
            razones.push(`No cumple el filtro de nivel ${nivelSeleccionado}.`);
        razones.push(...razonesAlineamientoMascota(
            companero?.Alineamientos_requeridos?.Companero ?? [],
            filasDeSusListas(companero, listas),
            input?.alineamientoPersonaje ?? '',
            'compañero'
        ));

        const evaluacion: CompaneroElegibilidadEvaluadaItem = {
            companero,
            elegible: razones.length < 1,
            razones: Array.from(new Set(razones)),
            nivelMinimoRequerido: resuelta.nivelMinimo,
            ajuste: resuelta.ajuste,
        };
        const clave = claveCompanero(companero);
        const previa = dedupe.get(clave);
        if (!previa || (!previa.elegible && evaluacion.elegible))
            dedupe.set(clave, evaluacion);
    });

    return Array.from(dedupe.values())
        .sort((a, b) => compararTexto(a?.companero?.Nombre, b?.companero?.Nombre));
}

/** Los niveles mínimos de las filas con que el personaje puede tener los compañeros que puede elegir (el filtro «Nivel»). */
export function resolverNivelesCompaneroDisponibles(input: Omit<FiltroCompanerosElegiblesInput, 'nivelSeleccionado'>): number[] {
    const niveles = new Set<number>();
    filtrarCompanerosElegibles({ ...input, nivelSeleccionado: null }).forEach((companero) => {
        const fila = resolverFilaCompanero(companero, input.estado, input.dotesPersonaje ?? new Set<number>()).fila;
        if (fila)
            niveles.add(Math.max(0, toInt(fila.Nivel)));
    });
    return Array.from(niveles).sort((a, b) => a - b);
}

/** Lo que enseña el selector del compañero (`selector-companero-modal`), del catálogo y del personaje. */
export interface EntradasSelectorCompanero {
    /** Los niveles del filtro «Nivel» (`resolverNivelesCompaneroDisponibles`). */
    nivelesDisponibles: number[];
    /** El nivel del filtro, si sigue entre los disponibles; si no, `null`. */
    nivelSeleccionado: number | null;
    elegibles: CompaneroMonstruoDetalle[];
    bloqueados: Array<{ companero: CompaneroMonstruoDetalle; razones: string[]; nivelMinimoRequerido: number | null; }>;
    /** El nivel efectivo de druida que pide cada uno, por `claveCompanero`. */
    nivelesRequeridos: Record<string, number>;
    /** El ajuste de su lista, por `claveCompanero`. */
    ajustes: Record<string, number>;
}

/**
 * Las entradas del selector del compañero: los niveles del filtro, los que puede elegir y los que no (con su motivo), el
 * nivel que pide cada uno y el ajuste de su lista. Lo usan la creación y el reciclaje de la subida (`reciclaje-mascota.ts`).
 */
export function entradasDelSelectorCompanero(input: FiltroCompanerosElegiblesInput): EntradasSelectorCompanero {
    const nivelesDisponibles = resolverNivelesCompaneroDisponibles(input);
    const pedido = input?.nivelSeleccionado ?? null;
    const nivelSeleccionado = pedido !== null && nivelesDisponibles.includes(pedido) ? pedido : null;
    const evaluaciones = evaluarCompanerosElegibilidad({ ...input, nivelSeleccionado });
    const nivelesRequeridos: Record<string, number> = {};
    const ajustes: Record<string, number> = {};
    evaluaciones.forEach((item) => {
        const clave = claveCompanero(item.companero);
        ajustes[clave] = Math.trunc(Number(item?.ajuste ?? 0));
        const nivel = Number(item?.nivelMinimoRequerido ?? 0);
        if (Number.isFinite(nivel) && nivel > 0)
            nivelesRequeridos[clave] = Math.trunc(nivel);
    });
    return {
        nivelesDisponibles, nivelSeleccionado, nivelesRequeridos, ajustes,
        elegibles: evaluaciones.filter((item) => item.elegible).map((item) => item.companero),
        bloqueados: evaluaciones.filter((item) => !item.elegible).map((item) => ({
            companero: item.companero, razones: [...(item.razones ?? [])], nivelMinimoRequerido: item.nivelMinimoRequerido ?? null,
        })),
    };
}

/** La clave de un compañero del catálogo de la creación: su monstruo y su plantilla. */
export function claveCompanero(companero: CompaneroMonstruoDetalle | null | undefined): string {
    return `${toInt(companero?.Id_companero)}:${Math.max(0, toInt(companero?.Plantilla?.Id))}`;
}

/**
 * Los compañeros que se pueden elegir en la creación: uno por monstruo marcado como compañero y plantilla de sus filas de
 * `Niveles_clase` (sin plantilla, `Plantilla.Id` 0; los animales celestiales de Compañero elevado, la «Celestial»), con
 * esas filas: las de compañero (su `Mascota`); las de un familiar no hacen un compañero.
 */
export function construirCatalogoCompanerosDesdeMonstruos(monstruos: MonstruoDetalle[]): CompaneroMonstruoDetalle[] {
    return catalogoDeMascotaDesdeMonstruos(monstruos, 'companero', (monstruo) => !!monstruo?.Companero,
        (entrada, id): CompaneroMonstruoDetalle => ({ ...entrada, Id_companero: id, Dg_adi: 0, Trucos_adi: 0 }));
}

/** La fila de la tabla del compañero que toca a ese nivel (la última que empieza en él o antes); sin ninguna, todo a 0. */
export function bonosCompaneroDelNivel(progresion: CompaneroProgresion | null | undefined, nivel: number): CompaneroBonosNivel {
    return filaDelNivel(progresion?.Bonos, nivel) ?? SIN_BONOS;
}

/** La fila de la tabla que ya lleva un compañero, por sus DG adicionales (distintos en cada fila); sin ella, todo a 0. */
export function bonosCompaneroPorDgAdicionales(progresion: CompaneroProgresion | null | undefined, dgAdicionales: number): CompaneroBonosNivel {
    return (progresion?.Bonos ?? []).find((fila) => toInt(fila.Dg_adicionales) === toInt(dgAdicionales)) ?? SIN_BONOS;
}

/**
 * Lo que da la tabla del compañero a ese nivel de la tabla (Manual del jugador, pág. 36), como lo comprueba la API: las
 * aptitudes del amo, y las del compañero (y las que no le tocan aún). Una dote se gana como dote adicional si la cumple
 * (`cumpleDote`, los prerrequisitos de armas naturales) y su monstruo no la tiene ya; si no la cumple, su `Alternativa`
 * (el lobo de druida 9 gana el segundo mordisco y no Ataque múltiple).
 */
export function aptitudesCompaneroDelNivel(
    progresion: CompaneroProgresion | null | undefined,
    nivelTabla: number,
    opciones: { cumpleDote: (idDote: number) => boolean; monstruoTieneDote: (idDote: number) => boolean; },
): AptitudesCompaneroDelNivel {
    return aptitudesMascotaDelNivel(progresion?.Aptitudes, nivelTabla, opciones);
}
