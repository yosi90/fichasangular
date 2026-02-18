import { Clase } from "src/app/interfaces/clase";
import { IdentidadPrerrequisitos, existeCoincidenciaClaveEntidad, normalizarTextoPrerrequisito } from "./identidad-prerrequisitos";
import { getAlineamientoBasicoIdPorNombre } from "./alineamiento-contrato";

export type EstadoElegibilidadClase = "eligible" | "blocked_failed" | "blocked_unknown";

export interface ClaseEvaluacionContexto {
    identidad: IdentidadPrerrequisitos;
    caracteristicas: {
        Fuerza: number;
        Destreza: number;
        Constitucion: number;
        Inteligencia: number;
        Sabiduria: number;
        Carisma: number;
    };
    ataqueBase: number;
    alineamiento: string;
    genero: string;
    dotes: { id: number | null; nombre: string; }[];
    idiomas: { id: number | null; nombre: string; }[];
    dominios?: { id: number | null; nombre: string; }[];
}

export interface ClaseEvaluacionResultado {
    estado: EstadoElegibilidadClase;
    razones: string[];
    advertencias: string[];
}

const FLAGS_SOPORTADAS: (keyof Clase["Prerrequisitos_flags"])[] = [
    "raza",
    "no_raza",
    "subtipo",
    "caracteristica",
    "ataque_base",
    "alineamiento_requerido",
    "alineamiento_prohibido",
    "actitud_requerido",
    "actitud_prohibido",
    "genero",
    "dote_elegida",
    "idioma",
    "dominio",
];

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value === 1;
    if (typeof value === "string") {
        const n = value.trim().toLowerCase();
        return n === "1" || n === "true" || n === "si" || n === "sí";
    }
    return false;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

function pick(entry: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(entry, key))
            return entry[key];
    }
    return undefined;
}

function parseOpcional(entry: Record<string, any>): number {
    return Math.max(0, Math.trunc(toNumber(pick(entry, ["opcional", "Opcional", "o", "O"]), 0)));
}

function parseId(entry: Record<string, any>, keys: string[]): number {
    for (const key of keys) {
        const n = toNumber(entry?.[key], 0);
        if (n > 0)
            return n;
    }
    return 0;
}

function parseNombre(entry: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
        const text = `${entry?.[key] ?? ""}`.trim();
        if (text.length > 0)
            return text;
    }
    return "";
}

function getStatById(
    caracteristicas: ClaseEvaluacionContexto["caracteristicas"],
    idCaracteristica: number
): number {
    if (idCaracteristica === 1)
        return toNumber(caracteristicas.Fuerza);
    if (idCaracteristica === 2)
        return toNumber(caracteristicas.Destreza);
    if (idCaracteristica === 3)
        return toNumber(caracteristicas.Constitucion);
    if (idCaracteristica === 4)
        return toNumber(caracteristicas.Inteligencia);
    if (idCaracteristica === 5)
        return toNumber(caracteristicas.Sabiduria);
    if (idCaracteristica === 6)
        return toNumber(caracteristicas.Carisma);
    return Number.NaN;
}

function cumpleActitud(actitudId: number, alineamientoBasicoId: number): boolean {
    const esLegal = [1, 2, 3].includes(alineamientoBasicoId);
    const esNeutralEje = [2, 4, 5, 6, 8].includes(alineamientoBasicoId);
    const esCaotico = [7, 8, 9].includes(alineamientoBasicoId);
    const esBueno = [1, 4, 7].includes(alineamientoBasicoId);
    const esMaligno = [3, 6, 9].includes(alineamientoBasicoId);

    if (actitudId === 1)
        return esLegal;
    if (actitudId === 2)
        return esNeutralEje;
    if (actitudId === 3)
        return esCaotico;
    if (actitudId === 4)
        return esBueno;
    if (actitudId === 5)
        return esMaligno;
    return false;
}

interface EvaluacionItem {
    grupoOpcional: number;
    evaluable: boolean;
    cumple: boolean;
    razonFail: string;
    razonUnknown: string;
}

interface GrupoOpcional {
    cumple: boolean;
    falla: boolean;
    unknown: boolean;
}

function registrarEvaluacion(
    evaluacion: EvaluacionItem,
    grupos: Map<number, GrupoOpcional>,
    fail: string[],
    unknown: string[]
): void {
    if (evaluacion.grupoOpcional <= 0) {
        if (!evaluacion.evaluable) {
            unknown.push(evaluacion.razonUnknown);
            return;
        }
        if (!evaluacion.cumple)
            fail.push(evaluacion.razonFail);
        return;
    }

    const current = grupos.get(evaluacion.grupoOpcional) ?? {
        cumple: false,
        falla: false,
        unknown: false,
    };
    if (!evaluacion.evaluable)
        current.unknown = true;
    else if (evaluacion.cumple)
        current.cumple = true;
    else
        current.falla = true;

    grupos.set(evaluacion.grupoOpcional, current);
}

function resolverGruposOpcionales(
    grupos: Map<number, GrupoOpcional>,
    fail: string[],
    unknown: string[]
): void {
    grupos.forEach((estado, grupo) => {
        if (estado.cumple)
            return;
        if (estado.unknown) {
            unknown.push(`No se pudo validar por completo el grupo opcional ${grupo}`);
            return;
        }
        if (estado.falla)
            fail.push(`No se cumple el grupo opcional ${grupo}`);
    });
}

function buildEvaluacionRaza(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const razaId = parseId(entry, ["Id_raza", "id_raza", "IdRaza", "idRaza"]);
    const razaNombre = parseNombre(entry, ["Raza", "raza", "Nombre_raza", "nombre_raza", "Nombre", "nombre"]);
    if (razaId <= 0 && normalizarTextoPrerrequisito(razaNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonFail: "Prerrequisito de raza no cumplido",
            razonUnknown: "Prerrequisito de raza con formato no reconocido",
        };
    }
    const cumple = existeCoincidenciaClaveEntidad(ctx.identidad.razas, razaId, razaNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
        razonFail: "Prerrequisito de raza no cumplido",
        razonUnknown: "Prerrequisito de raza con formato no reconocido",
    };
}

function buildEvaluacionNoRaza(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const razaId = parseId(entry, ["Id_raza", "id_raza", "IdRaza", "idRaza"]);
    const razaNombre = parseNombre(entry, ["Raza", "raza", "Nombre_raza", "nombre_raza", "Nombre", "nombre"]);
    if (razaId <= 0 && normalizarTextoPrerrequisito(razaNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonFail: "Prerrequisito no_raza no cumplido",
            razonUnknown: "Prerrequisito no_raza con formato no reconocido",
        };
    }
    const cumple = !existeCoincidenciaClaveEntidad(ctx.identidad.razas, razaId, razaNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
        razonFail: "Prerrequisito no_raza no cumplido",
        razonUnknown: "Prerrequisito no_raza con formato no reconocido",
    };
}

function buildEvaluacionSubtipo(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const subtipoId = parseId(entry, ["Id_subtipo", "id_subtipo", "IdSubtipo", "idSubtipo", "Id", "id"]);
    const subtipoNombre = parseNombre(entry, ["Subtipo", "subtipo", "Nombre", "nombre"]);
    if (subtipoId <= 0 && normalizarTextoPrerrequisito(subtipoNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonFail: "Prerrequisito de subtipo no cumplido",
            razonUnknown: "Prerrequisito de subtipo con formato no reconocido",
        };
    }
    const cumple = existeCoincidenciaClaveEntidad(ctx.identidad.subtipos, subtipoId, subtipoNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
        razonFail: "Prerrequisito de subtipo no cumplido",
        razonUnknown: "Prerrequisito de subtipo con formato no reconocido",
    };
}

function buildEvaluacionCaracteristica(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idCaracteristica = parseId(entry, ["Id_caracteristica", "id_caracteristica", "c", "Id", "id"]);
    const cantidad = toNumber(pick(entry, ["Cantidad", "cantidad", "Valor", "valor", "d"]), Number.NaN);
    const actual = getStatById(ctx.caracteristicas, idCaracteristica);
    const evaluable = idCaracteristica > 0 && Number.isFinite(cantidad) && Number.isFinite(actual);
    const cumple = evaluable ? actual >= cantidad : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: `Caracteristica minima no cumplida (${idCaracteristica} >= ${cantidad})`,
        razonUnknown: "Prerrequisito de caracteristica con formato no reconocido",
    };
}

function buildEvaluacionAtaqueBase(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = toNumber(pick(entry, ["Cantidad", "cantidad", "Valor", "valor", "Ataque_base", "ataque_base", "d"]), Number.NaN);
    const evaluable = Number.isFinite(requerido);
    const cumple = evaluable ? ctx.ataqueBase >= requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: `Ataque base insuficiente (${ctx.ataqueBase} < ${requerido})`,
        razonUnknown: "Prerrequisito de ataque base con formato no reconocido",
    };
}

function buildEvaluacionAlineamiento(
    entry: Record<string, any>,
    alineamientoActualId: number,
    prohibido: boolean
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idAlineamiento = parseId(entry, ["Id_alineamiento", "id_alineamiento", "i", "Id", "id"]);
    const nombreAlineamiento = parseNombre(entry, ["Alineamiento", "alineamiento", "Nombre", "nombre"]);
    const requerido = idAlineamiento > 0 ? idAlineamiento : getAlineamientoBasicoIdPorNombre(nombreAlineamiento);
    const evaluable = requerido > 0 && alineamientoActualId > 0;
    const coincide = evaluable ? alineamientoActualId === requerido : false;
    const cumple = prohibido ? !coincide : coincide;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: prohibido ? "Alineamiento prohibido" : "Alineamiento requerido no cumplido",
        razonUnknown: "Prerrequisito de alineamiento con formato no reconocido",
    };
}

function buildEvaluacionActitud(
    entry: Record<string, any>,
    alineamientoActualId: number,
    prohibido: boolean
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idActitud = parseId(entry, ["Id_actitud", "id_actitud", "i", "Id", "id"]);
    const evaluable = idActitud > 0 && alineamientoActualId > 0;
    const coincide = evaluable ? cumpleActitud(idActitud, alineamientoActualId) : false;
    const cumple = prohibido ? !coincide : coincide;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: prohibido ? "Actitud prohibida" : "Actitud requerida no cumplida",
        razonUnknown: "Prerrequisito de actitud con formato no reconocido",
    };
}

function buildEvaluacionGenero(entry: Record<string, any>, generoActual: string): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const nombreGenero = parseNombre(entry, ["Genero", "genero", "Nombre", "nombre"]);
    const idGenero = parseId(entry, ["Id_genero", "id_genero", "Id", "id"]);
    const mapaGeneroPorId: Record<number, string> = {
        1: "Macho",
        2: "Hembra",
        3: "Hermafrodita",
        4: "Sin genero",
    };
    const requerido = normalizarTextoPrerrequisito(
        nombreGenero.length > 0 ? nombreGenero : (mapaGeneroPorId[idGenero] ?? "")
    );
    const actual = normalizarTextoPrerrequisito(generoActual);
    const evaluable = requerido.length > 0 && actual.length > 0;
    const cumple = evaluable ? actual === requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: "Genero requerido no cumplido",
        razonUnknown: "Prerrequisito de genero con formato no reconocido",
    };
}

function buildEvaluacionDote(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDote = parseId(entry, ["Id_dote", "id_dote", "Id", "id", "i"]);
    const nombreDote = parseNombre(entry, ["Dote", "dote", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreDote);
    const cumple = ctx.dotes.some((d) => {
        if (idDote > 0 && toNumber(d.id) === idDote)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(d.nombre) === nombreNorm;
    });
    const evaluable = idDote > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: "Dote requerida no encontrada",
        razonUnknown: "Prerrequisito de dote con formato no reconocido",
    };
}

function buildEvaluacionIdioma(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idIdioma = parseId(entry, ["Id_idioma", "id_idioma", "Id", "id", "i"]);
    const nombreIdioma = parseNombre(entry, ["Idioma", "idioma", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreIdioma);
    const cumple = ctx.idiomas.some((i) => {
        if (idIdioma > 0 && toNumber(i.id) === idIdioma)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(i.nombre) === nombreNorm;
    });
    const evaluable = idIdioma > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: "Idioma requerido no encontrado",
        razonUnknown: "Prerrequisito de idioma con formato no reconocido",
    };
}

function buildEvaluacionDominio(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDominio = parseId(entry, ["Id_dominio", "id_dominio", "Id", "id", "i"]);
    const nombreDominio = parseNombre(entry, ["Dominio", "dominio", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreDominio);
    const dominiosActuales = ctx.dominios ?? [];
    const cumple = dominiosActuales.some((d) => {
        if (idDominio > 0 && toNumber(d.id) === idDominio)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(d.nombre) === nombreNorm;
    });
    const evaluable = idDominio > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: "Dominio requerido no encontrado",
        razonUnknown: "Prerrequisito de dominio con formato no reconocido",
    };
}

function evaluarFamilia(
    activa: boolean | undefined,
    entries: Record<string, any>[],
    build: (entry: Record<string, any>) => EvaluacionItem,
    fail: string[],
    unknown: string[]
): void {
    if (!toBoolean(activa))
        return;
    if (entries.length < 1) {
        unknown.push("Familia de prerrequisito activa sin datos");
        return;
    }

    const grupos = new Map<number, GrupoOpcional>();
    entries.forEach((entry) => {
        const evaluacion = build(entry);
        registrarEvaluacion(evaluacion, grupos, fail, unknown);
    });
    resolverGruposOpcionales(grupos, fail, unknown);
}

export function evaluarElegibilidadClase(clase: Clase, ctx: ClaseEvaluacionContexto): ClaseEvaluacionResultado {
    const fail: string[] = [];
    const unknown: string[] = [];
    const advertencias: string[] = [];
    const flags = clase?.Prerrequisitos_flags ?? {};
    const prer = clase?.Prerrequisitos ?? ({} as Clase["Prerrequisitos"]);
    const alineamientoActualId = getAlineamientoBasicoIdPorNombre(ctx.alineamiento);

    Object.entries(flags).forEach(([key, value]) => {
        const soportada = FLAGS_SOPORTADAS.includes(key as keyof Clase["Prerrequisitos_flags"]);
        if (toBoolean(value) && !soportada)
            unknown.push(`Prerrequisito no soportado en fase actual: ${key}`);
    });

    evaluarFamilia(flags?.raza, toArray(prer?.raza), (entry) => buildEvaluacionRaza(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.no_raza, toArray(prer?.no_raza), (entry) => buildEvaluacionNoRaza(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.subtipo, toArray(prer?.subtipo), (entry) => buildEvaluacionSubtipo(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.caracteristica, toArray(prer?.caracteristica), (entry) => buildEvaluacionCaracteristica(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.ataque_base, toArray(prer?.ataque_base), (entry) => buildEvaluacionAtaqueBase(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.alineamiento_requerido, toArray(prer?.alineamiento_requerido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, false), fail, unknown);
    evaluarFamilia(flags?.alineamiento_prohibido, toArray(prer?.alineamiento_prohibido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, true), fail, unknown);
    evaluarFamilia(flags?.actitud_requerido, toArray(prer?.actitud_requerido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, false), fail, unknown);
    evaluarFamilia(flags?.actitud_prohibido, toArray(prer?.actitud_prohibido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, true), fail, unknown);
    evaluarFamilia(flags?.genero, toArray(prer?.genero), (entry) => buildEvaluacionGenero(entry, ctx.genero), fail, unknown);
    evaluarFamilia(flags?.dote_elegida, toArray(prer?.dote_elegida), (entry) => buildEvaluacionDote(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.idioma, toArray(prer?.idioma), (entry) => buildEvaluacionIdioma(entry, ctx), fail, unknown);
    evaluarFamilia(flags?.dominio, toArray(prer?.dominio), (entry) => buildEvaluacionDominio(entry, ctx), fail, unknown);

    if (unknown.length > 0) {
        return {
            estado: "blocked_unknown",
            razones: Array.from(new Set(unknown)),
            advertencias,
        };
    }

    if (fail.length > 0) {
        return {
            estado: "blocked_failed",
            razones: Array.from(new Set(fail)),
            advertencias,
        };
    }

    return {
        estado: "eligible",
        razones: [],
        advertencias,
    };
}
