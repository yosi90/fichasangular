import { Clase } from 'src/app/interfaces/clase';
import {
    CompaneroAptitudNivel,
    CompaneroBonosNivel,
    CompaneroMonstruoDetalle,
    CompaneroProgresion,
    MonstruoDetalle,
} from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, primerEntero, toInt } from 'src/app/services/utils/normalizacion';
import { razonesAlineamientoMascota } from 'src/app/services/utils/nivel-clase-monstruo';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import {
    AptitudesMascotaDelNivel,
    aptitudesMascotaDelNivel,
    EstadoMascota,
    filaDelNivel,
    FilaMascotaResuelta,
    filasDeSusListas,
    filasPorPlantilla,
    resolverEstadoMascota,
    resolverFilaMascota,
    TextosMascota,
} from 'src/app/services/utils/mascota-cupos';
import { contarArmasNaturales } from 'src/app/services/utils/armas-naturales';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';

/*
 * El compañero animal, de los datos (contrato: `docs/publica/endpoints/catalogos.md`, «El compañero animal, de los
 * datos»; la API lo comprueba al guardar con las mismas reglas, `utils/companero_animal.py`). Sin ids ni nombres fijos;
 * lo común con el familiar, en `mascota-cupos.ts`:
 * - el nivel efectivo de druida suma lo que aporta cada clase cuya tabla da una aptitud con `Otorga_companero`, según su
 *   `Mascota` (máx(0, ⌊nivel / `Divisor`⌋ + `Ajuste`)), desde el nivel en que la da y, en un grupo opcional, solo si el
 *   personaje la eligió (el pirata que elige *Pelea sucia* no tiene compañero);
 * - la lista son las filas de `Niveles_clase` de la clase de su `Mascota.Lista` (el explorador, la del druida), cada una
 *   con su nivel mínimo, su `Ajuste` (lo que suma para la tabla), su plantilla y la dote que la abre;
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

const TEXTOS_COMPANERO: TextosMascota = { mascota: 'compañero animal', listaDe: 'compañeros animales', listaPorDefecto: 'druida' };

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

/** Las armas naturales del compañero (las de su monstruo), para los prerrequisitos de sus dotes (Ataque múltiple). */
export function armasNaturalesDelCompanero(companero: MonstruoDetalle | null | undefined): number {
    return contarArmasNaturales({ Armas_naturales: companero?.Armas_naturales ?? [] });
}

/**
 * La fila de la lista con la que el personaje tiene a ese compañero (`resolverFilaMascota`) y el nivel de la tabla que le
 * toca: su nivel efectivo más el ajuste de su fila. Si el ajuste lo deja en 0 o menos, aún no se puede elegir.
 */
export function resolverFilaCompanero(
    companero: CompaneroMonstruoDetalle,
    estado: EstadoCuposCompanero,
    dotesPersonaje: ReadonlySet<number>,
): FilaCompaneroResuelta {
    const resuelta = resolverFilaMascota(companero, estado, dotesPersonaje, TEXTOS_COMPANERO);
    if (!resuelta.fila || resuelta.nivelTabla >= 1)
        return resuelta;
    const nombre = `${companero?.Nombre ?? ''}`.trim();
    const lista = `${resuelta.fila?.Clase?.Nombre ?? ''}`.trim().toLocaleLowerCase('es') || TEXTOS_COMPANERO.listaPorDefecto;
    return {
        ...resuelta,
        fila: null,
        razones: [`Con el ajuste de su lista (${textoConSigno(resuelta.ajuste, '−')}), «${nombre}» se queda sin nivel efectivo de ${lista}: aún no se puede elegir.`],
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
    const resultado: CompaneroMonstruoDetalle[] = [];
    (Array.isArray(monstruos) ? monstruos : []).forEach((monstruo) => {
        const id = toInt(monstruo?.Id);
        if (!monstruo?.Companero || id <= 0)
            return;
        filasPorPlantilla(monstruo, 'companero').forEach((filas, idPlantilla) => {
            resultado.push({
                ...monstruo,
                Id_companero: id,
                Monstruo_origen: { Id: id, Nombre: `${monstruo?.Nombre ?? ''}`.trim() },
                Vida: 0,
                Dg_adi: 0,
                Trucos_adi: 0,
                Plantilla: {
                    Id: idPlantilla,
                    Nombre: idPlantilla > 0 ? `${filas[0]?.Plantilla?.Nombre ?? ''}`.trim() : '',
                },
                Niveles_clase: filas,
                Especiales: [],
                Personajes: [],
            });
        });
    });
    return resultado.sort((a, b) => porNombre(a, b) || toInt(a.Plantilla?.Id) - toInt(b.Plantilla?.Id));
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
