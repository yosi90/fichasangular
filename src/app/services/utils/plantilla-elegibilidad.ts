import { Plantilla, PlantillaCompatibilidadTipo } from "src/app/interfaces/plantilla";
import { TipoCriatura } from "src/app/interfaces/tipo_criatura";
import { valorCaracteristicaPorId } from './caracteristicas';
import {
    cumpleActitud,
    extraerEjesAlineamientoDesdeContrato,
    getAlineamientoBasicoIdPorNombre,
    getVectorDesdeNombreBasico,
    idBasicoDePrerrequisitoAlineamiento,
    nombreBasicoDesdeVector,
} from "./alineamiento-contrato";
import { normalizarTexto, toNumber } from 'src/app/services/utils/normalizacion';
import { leerComodin } from './comodin';
import { frasePrerrequisito } from './prerrequisito-frase';
import { MotivosPrerrequisitos } from './prerrequisitos-evaluacion';

export type EstadoElegibilidadPlantilla = "eligible" | "blocked_failed" | "blocked_unknown";

export interface CaracteristicasEvaluacion {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface PlantillaEvaluacionContexto {
    alineamiento: string;
    caracteristicas: CaracteristicasEvaluacion;
    tamanoRazaId: number;
    tiposCriaturaMiembroIds: number[];
    // Compatibilidad temporal con contexto legacy.
    tipoCriaturaActualId?: number;
    incluirHomebrew: boolean;
    seleccionadas: { Id: number; Nombre: string; Nacimiento: boolean; Licantropia?: boolean; }[];
    /** Los niveles de clase que ya tiene: una plantilla de nacimiento solo se elige antes del primero (decisión del 2026-10-18). */
    nivelesClase?: number;
    /** El nivel de lanzador arcano o divino más alto, para `nivel_lanzador` (el liche). */
    nivelLanzador?: number;
    /** Las dotes del personaje, para `dote` (el liche: Fabricar objeto maravilloso). */
    dotes?: { id: number | null; nombre: string; }[];
}

export interface PlantillaEvaluacionResultado {
    estado: EstadoElegibilidadPlantilla;
    razones: string[];
    advertencias: string[];
}

export interface SimulacionPlantillasResultado {
    tipoCriaturaActualId: number;
    tipoCriaturaActualNombre: string;
    licantropiaActiva: boolean;
    heredadaActiva: boolean;
}

export interface ResolucionAlineamientoPlantillas {
    alineamiento: string;
    conflicto: boolean;
    razones: string[];
}

/** «Cualquiera» como tipo nuevo (`Tipo_nuevo_comodin` de la API): la plantilla no cambia el tipo de la criatura. */
function esTipoNuevoSinCambio(compat: PlantillaCompatibilidadTipo): boolean {
    return compat.Tipo_nuevo_comodin === "cualquiera";
}

function getAlineamientoBasicoId(alineamiento: string): number {
    return getAlineamientoBasicoIdPorNombre(alineamiento);
}

function toAlineamientoFromVector(ley: number, moral: number): string {
    return nombreBasicoDesdeVector(ley, moral);
}

function getVectorFromAlineamientoNombre(nombre: string): { ley: number; moral: number; } | null {
    return getVectorDesdeNombreBasico(nombre);
}

function esPrioridadValida(prioridad: number): boolean {
    return Number.isFinite(prioridad) && prioridad > 0;
}

function extraerRestriccionPlantilla(plantilla: Plantilla): {
    prioridad: number;
    ley: number | null;
    moral: number | null;
    origen: string;
} {
    const alineamiento = plantilla?.Alineamiento;
    const prioridad = toNumber(alineamiento?.Prioridad?.Id_prioridad);
    const origen = `${plantilla?.Nombre ?? "Plantilla"}`.trim() || "Plantilla";

    const ejes = extraerEjesAlineamientoDesdeContrato(alineamiento);

    return {
        prioridad,
        ley: ejes.ley,
        moral: ejes.moral,
        origen,
    };
}

export function resolverAlineamientoPlantillas(
    alineamientoBase: string,
    seleccionadas: Plantilla[]
): ResolucionAlineamientoPlantillas {
    const baseVector = getVectorFromAlineamientoNombre(alineamientoBase) ?? { ley: 0, moral: 0 };
    const razones: string[] = [];
    let restriccionLeyValor: number | null = null;
    let restriccionLeyPrioridad = -1;
    let restriccionLeyOrigen = "";
    let restriccionMoralValor: number | null = null;
    let restriccionMoralPrioridad = -1;
    let restriccionMoralOrigen = "";

    const aplicarRestriccion = (
        eje: "ley" | "moral",
        valor: number | null,
        prioridad: number,
        origen: string
    ) => {
        if (valor === null || !esPrioridadValida(prioridad))
            return;

        if (eje === "ley") {
            if (restriccionLeyValor === null || prioridad > restriccionLeyPrioridad) {
                restriccionLeyValor = valor;
                restriccionLeyPrioridad = prioridad;
                restriccionLeyOrigen = origen;
                return;
            }
            if (prioridad === restriccionLeyPrioridad && valor !== restriccionLeyValor) {
                razones.push(
                    `Conflicto de alineamiento (${eje}) entre "${restriccionLeyOrigen}" y "${origen}" (prioridad ${prioridad})`
                );
            }
            return;
        }

        if (restriccionMoralValor === null || prioridad > restriccionMoralPrioridad) {
            restriccionMoralValor = valor;
            restriccionMoralPrioridad = prioridad;
            restriccionMoralOrigen = origen;
            return;
        }
        if (prioridad === restriccionMoralPrioridad && valor !== restriccionMoralValor) {
            razones.push(
                `Conflicto de alineamiento (${eje}) entre "${restriccionMoralOrigen}" y "${origen}" (prioridad ${prioridad})`
            );
        }
    };

    seleccionadas.forEach((plantilla) => {
        const restriccion = extraerRestriccionPlantilla(plantilla);
        aplicarRestriccion("ley", restriccion.ley, restriccion.prioridad, restriccion.origen);
        aplicarRestriccion("moral", restriccion.moral, restriccion.prioridad, restriccion.origen);
    });

    const leyFinal = restriccionLeyValor ?? baseVector.ley;
    const moralFinal = restriccionMoralValor ?? baseVector.moral;

    return {
        alineamiento: toAlineamientoFromVector(leyFinal, moralFinal),
        conflicto: razones.length > 0,
        razones,
    };
}


function parseOpcional(entry: Record<string, any>): { value: number; unknown: boolean } {
    if (entry === null || typeof entry !== "object")
        return { value: 0, unknown: true };

    const raw = entry["opcional"] ?? entry["Opcional"] ?? entry["o"] ?? entry["O"] ?? 0;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0)
        return { value: n, unknown: false };

    return { value: 0, unknown: true };
}

/** Registra un prerrequisito con su frase; un `Opcional` que no se entiende no deja evaluarlo. */
function registrarPrerrequisito(
    motivos: MotivosPrerrequisitos,
    clave: string,
    entry: Record<string, any>,
    evaluable: boolean,
    cumple: boolean,
    razonUnknown: string
): void {
    const opcional = parseOpcional(entry);
    if (opcional.unknown) {
        motivos.unknown.push("Campo opcional con formato no reconocido");
        return;
    }
    motivos.registrar({
        grupoOpcional: opcional.value,
        evaluable,
        cumple,
        razonUnknown,
        frase: frasePrerrequisito(clave, entry),
    });
}

function parseCaracteristicaId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_caracteristica"],
        entry?.["id_caracteristica"],
        entry?.["c"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseCantidad(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Cantidad"],
        entry?.["cantidad"],
        entry?.["Valor"],
        entry?.["valor"],
        entry?.["d"],
        entry?.["c"],
    ];

    for (const value of candidates) {
        const n = toNumber(value, Number.NaN);
        if (Number.isFinite(n))
            return n;
    }

    return Number.NaN;
}

function parseActitudId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_actitud"],
        entry?.["id_actitud"],
        entry?.["i"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}


function parseTipoCompId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_tipo_compatible"],
        entry?.["id_tipo_compatible"],
        entry?.["Id_tipo_comp"],
        entry?.["id_tipo_comp"],
        entry?.["Id_tipo"],
        entry?.["id_tipo"],
        entry?.["i"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseTipoNuevoId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_tipo_nuevo"],
        entry?.["id_tipo_nuevo"],
        entry?.["Id_nuevo"],
        entry?.["id_nuevo"],
        entry?.["Id_tipo_resultante"],
        entry?.["id_tipo_resultante"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

/**
 * Si la plantilla es de licántropo: la que añade los DG del animal (`Licantronia_dg`, que solo tienen los licántropos;
 * decisión del 2026-10-24 sobre el Manual de monstruos 1). Sale de los datos, no del nombre.
 */
export function esPlantillaLicantropa(plantilla: Pick<Plantilla, 'Licantronia_dg'> | null | undefined): boolean {
    const dg = plantilla?.Licantronia_dg;
    return !!dg && (toNumber(dg.Multiplicador) > 0 || toNumber(dg.Suma) !== 0);
}

export function obtenerCompatibilidadTipo(plantilla: Plantilla, tipoActualId: number): PlantillaCompatibilidadTipo | null {
    const candidatas = (plantilla?.Compatibilidad_tipos ?? []).filter(c => c.Id_tipo_comp === tipoActualId);
    if (candidatas.length > 0)
        return candidatas[0];

    const porPrerrequisitos = (plantilla?.Prerrequisitos?.criaturas_compatibles ?? []).map(entry => ({
        Id_tipo_comp: parseTipoCompId(entry),
        Id_tipo_nuevo: parseTipoNuevoId(entry),
        Tipo_comp: `${entry?.["Tipo_comp"] ?? entry?.["tipo_comp"] ?? entry?.["Tipo_compatible"] ?? entry?.["tipo_compatible"] ?? ""}`,
        Tipo_nuevo: `${entry?.["Tipo_nuevo"] ?? entry?.["tipo_nuevo"] ?? ""}`,
        Tipo_nuevo_comodin: leerComodin(entry?.["Tipo_nuevo_comodin"]),
        Opcional: parseOpcional(entry).value,
    })).filter(item => item.Id_tipo_comp > 0 && item.Id_tipo_comp === tipoActualId);

    return porPrerrequisitos[0] ?? null;
}

export function simularEstadoPlantillas(
    tipoBase: TipoCriatura,
    seleccionadas: Plantilla[]
): SimulacionPlantillasResultado {
    let tipoCriaturaActualId = toNumber(tipoBase?.Id);
    let tipoCriaturaActualNombre = `${tipoBase?.Nombre ?? "-"}`;
    let licantropiaActiva = false;
    let heredadaActiva = false;

    seleccionadas.forEach(plantilla => {
        licantropiaActiva = licantropiaActiva || esPlantillaLicantropa(plantilla);
        heredadaActiva = heredadaActiva || !!plantilla.Nacimiento;

        const compat = obtenerCompatibilidadTipo(plantilla, tipoCriaturaActualId);
        if (!compat)
            return;

        // Si el tipo nuevo es el comodín «Cualquiera», la plantilla no altera el tipo de criatura actual.
        if (esTipoNuevoSinCambio(compat))
            return;

        if (compat.Id_tipo_nuevo > 0) {
            tipoCriaturaActualId = compat.Id_tipo_nuevo;
            if ((compat.Tipo_nuevo ?? "").trim().length > 0)
                tipoCriaturaActualNombre = `${compat.Tipo_nuevo}`;
            else
                tipoCriaturaActualNombre = `Tipo #${compat.Id_tipo_nuevo}`;
        }
    });

    return {
        tipoCriaturaActualId,
        tipoCriaturaActualNombre,
        licantropiaActiva,
        heredadaActiva,
    };
}

export function evaluarElegibilidadPlantilla(
    plantilla: Plantilla,
    ctx: PlantillaEvaluacionContexto
): PlantillaEvaluacionResultado {
    const fail: string[] = [];
    const unknown: string[] = [];

    const nombreNormalizado = normalizarTexto(plantilla.Nombre);

    if (!ctx.incluirHomebrew && !plantilla.Oficial)
        fail.push("Plantilla no oficial");

    if (ctx.seleccionadas.some(s => s.Id === plantilla.Id || normalizarTexto(s.Nombre) === nombreNormalizado))
        fail.push("Ya seleccionada");

    const licantropiaActiva = ctx.seleccionadas.some(s => !!s.Licantropia);
    if (esPlantillaLicantropa(plantilla) && licantropiaActiva)
        fail.push("Ya hay una plantilla licantropa seleccionada");

    // Una plantilla de nacimiento (heredada) se elige a nivel 0, antes del primer nivel de clase (decisión del
    // propietario del 2026-10-18). El Manual de monstruos no limita cuántas heredadas se pueden añadir.
    if (plantilla.Nacimiento && toNumber(ctx.nivelesClase) > 0)
        fail.push("Una plantilla de nacimiento solo se elige antes del primer nivel de clase");

    const tamanoRaza = toNumber(ctx.tamanoRazaId);
    const tamanoPlantilla = toNumber(plantilla?.Tamano?.Id);
    if (tamanoRaza > 0 && tamanoPlantilla !== 0) {
        if (tamanoPlantilla < tamanoRaza - 1 || tamanoPlantilla > tamanoRaza + 1)
            fail.push("Tamaño incompatible con la raza base");
    }

    const alineamientoId = getAlineamientoBasicoId(ctx.alineamiento);
    if (alineamientoId <= 0)
        unknown.push("No se pudo interpretar el alineamiento actual");

    const flags = plantilla?.Prerrequisitos_flags ?? {};
    const prer = plantilla?.Prerrequisitos ?? {
        actitud_requerido: [],
        actitud_prohibido: [],
        alineamiento_requerido: [],
        caracteristica: [],
        criaturas_compatibles: [],
    };
    const motivos = new MotivosPrerrequisitos();
    const tiposMiembroRaw = Array.isArray(ctx.tiposCriaturaMiembroIds)
        ? ctx.tiposCriaturaMiembroIds
        : [];
    const tiposCriaturaMiembroIds = Array.from(new Set([
        ...tiposMiembroRaw.map((id: number) => toNumber(id)).filter((id: number) => id > 0),
        toNumber(ctx.tipoCriaturaActualId),
    ].filter((id: number) => id > 0)));

    if (flags.actitud_prohibido) {
        (prer.actitud_prohibido ?? []).forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const evaluable = actitudId > 0 && alineamientoId > 0;
            const cumple = evaluable ? !cumpleActitud(actitudId, alineamientoId) : false;
            registrarPrerrequisito(motivos, "actitud_prohibido", entry, evaluable, cumple, "Actitud prohibida con formato no reconocido");
        });
    }

    if (flags.actitud_requerido) {
        (prer.actitud_requerido ?? []).forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const evaluable = actitudId > 0 && alineamientoId > 0;
            const cumple = evaluable ? cumpleActitud(actitudId, alineamientoId) : false;
            registrarPrerrequisito(motivos, "actitud_requerido", entry, evaluable, cumple, "Actitud requerida con formato no reconocido");
        });
    }

    if (flags.alineamiento_requerido) {
        (prer.alineamiento_requerido ?? []).forEach((entry) => {
            // El básico (1-9), no `Id_alineamiento` (la combinación de la tabla `alineamientos`).
            const requiredId = idBasicoDePrerrequisitoAlineamiento(entry);
            const evaluable = requiredId > 0 && alineamientoId > 0;
            const cumple = evaluable ? requiredId === alineamientoId : false;
            registrarPrerrequisito(motivos, "alineamiento_requerido", entry, evaluable, cumple, "Alineamiento requerido con formato no reconocido");
        });
    }

    if (flags.caracteristica) {
        (prer.caracteristica ?? []).forEach((entry) => {
            const carId = parseCaracteristicaId(entry);
            const valorMin = parseCantidad(entry);
            const valorActual = valorCaracteristicaPorId(ctx.caracteristicas, carId);
            const evaluable = carId > 0 && Number.isFinite(valorMin) && Number.isFinite(valorActual);
            const cumple = evaluable ? valorActual >= valorMin : false;
            registrarPrerrequisito(motivos, "caracteristica", entry, evaluable, cumple, "Caracteristica requerida con formato no reconocido");
        });
    }

    if (flags.criaturas_compatibles) {
        (prer.criaturas_compatibles ?? []).forEach((entry) => {
            const tipoCompId = parseTipoCompId(entry);
            const evaluable = tipoCompId > 0 && tiposCriaturaMiembroIds.length > 0;
            const cumple = evaluable ? tiposCriaturaMiembroIds.includes(tipoCompId) : false;
            registrarPrerrequisito(motivos, "criaturas_compatibles", entry, evaluable, cumple, "Compatibilidad de criatura con formato no reconocido");
        });
    }

    if (flags.nivel_lanzador) {
        (prer.nivel_lanzador ?? []).forEach((entry) => {
            const nivel = toNumber(entry?.["Nivel"] ?? entry?.["nivel"]);
            const evaluable = nivel > 0;
            const cumple = evaluable ? toNumber(ctx.nivelLanzador) >= nivel : false;
            registrarPrerrequisito(motivos, "nivel_lanzador", entry, evaluable, cumple, "Nivel de lanzador con formato no reconocido");
        });
    }

    if (flags.dote) {
        (prer.dote ?? []).forEach((entry) => {
            const idDote = toNumber(entry?.["Id_dote_prerrequisito"] ?? entry?.["Id_dote"]);
            const nombreDote = normalizarTexto(`${entry?.["Dote_prerrequisito"] ?? entry?.["Dote"] ?? ""}`);
            const evaluable = idDote > 0 || nombreDote.length > 0;
            const cumple = evaluable && (ctx.dotes ?? []).some((dote) =>
                (idDote > 0 && toNumber(dote.id) === idDote) || (nombreDote.length > 0 && normalizarTexto(dote.nombre) === nombreDote));
            registrarPrerrequisito(motivos, "dote", entry, evaluable, cumple, "Dote de prerrequisito con formato no reconocido");
        });
    }

    motivos.cerrarGrupos();
    fail.push(...motivos.fail);
    unknown.push(...motivos.unknown);

    if (unknown.length > 0) {
        return {
            estado: "blocked_unknown",
            razones: Array.from(new Set(unknown)),
            advertencias: Array.from(new Set(fail)),
        };
    }

    if (fail.length > 0) {
        return {
            estado: "blocked_failed",
            razones: Array.from(new Set(fail)),
            advertencias: [],
        };
    }

    return {
        estado: "eligible",
        razones: [],
        advertencias: [],
    };
}
