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
    dotes: { id: number | null; nombre: string; idExtra: number | null; extra: string; }[];
    claseas?: { id: number | null; nombre: string; idExtra: number | null; extra: string; }[];
    habilidades?: { id: number | null; nombre: string; rangos: number; idExtra: number | null; extra: string; }[];
    conjuros?: { id: number | null; nombre: string; idEscuela: number | null; escuela: string; }[];
    idiomas: { id: number | null; nombre: string; }[];
    dominios?: { id: number | null; nombre: string; }[];
    competenciasArmas?: { id: number | null; nombre: string; }[];
    competenciasArmaduras?: { id: number | null; nombre: string; }[];
    competenciasGrupoArmas?: { id: number | null; nombre: string; }[];
    competenciasGrupoArmaduras?: { id: number | null; nombre: string; }[];
    lanzador?: { arcano: number; divino: number; psionico: number; };
    nivelesConjuroMaximos?: { arcano: number; divino: number; psionico: number; };
    dgTotal?: number;
    reservaPsionica?: number;
    escuelaEspecialista?: { id: number | null; nombre: string; nivelArcano: number; };
    tamanoId?: number | null;
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
    "habilidad_clase",
    "competencia_arma",
    "competencia_armadura",
    "competencia_grupo_arma",
    "competencia_grupo_armadura",
    "conjuro_conocido",
    "dg",
    "alineamiento_requerido",
    "alineamiento_prohibido",
    "actitud_requerido",
    "actitud_prohibido",
    "genero",
    "dote_elegida",
    "nivel_escuela",
    "rangos_habilidad",
    "idioma",
    "inherente",
    "lanzador_arcano",
    "lanzador_divino",
    "lanzar_conjuros_arcanos_nivel",
    "lanzar_conjuros_divinos_nivel",
    "lanzar_poder_psionico_nivel",
    "conocer_poder_psionico",
    "reserva_psionica",
    "dominio",
    "tamano_maximo",
    "tamano_minimo",
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

function parseNumber(entry: Record<string, any>, keys: string[]): number {
    return toNumber(pick(entry, keys), Number.NaN);
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

function parseIdOpcional(entry: Record<string, any>, keys: string[]): number {
    const raw = pick(entry, keys);
    if (raw === undefined || raw === null)
        return Number.NaN;
    const text = `${raw}`.trim();
    if (text.length < 1)
        return Number.NaN;
    return Math.trunc(toNumber(raw, Number.NaN));
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
    const idExtraReq = Math.trunc(toNumber(pick(entry, ["Id_extra", "id_extra", "IdExtra", "idExtra", "e"]), Number.NaN));
    const repetidoReq = Math.max(0, Math.trunc(toNumber(pick(entry, ["Repetido", "repetido", "r"]), 0)));
    const cantidadReq = repetidoReq > 0 ? repetidoReq : 1;
    const coincidencias = ctx.dotes.filter((d) => {
        const coincideDote = (idDote > 0 && toNumber(d.id) === idDote)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(d.nombre) === nombreNorm);
        if (!coincideDote)
            return false;

        if (!Number.isFinite(idExtraReq))
            return true;
        if (idExtraReq < 0)
            return toNumber(d.idExtra) <= 0;
        if (idExtraReq === 0)
            return toNumber(d.idExtra) > 0;
        return toNumber(d.idExtra) === idExtraReq;
    });
    const evaluable = idDote > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? coincidencias.length >= cantidadReq : false,
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

function buildEvaluacionCompetencia(
    entry: Record<string, any>,
    actuales: Array<{ id: number | null; nombre: string; }>,
    idKeys: string[],
    nombreKeys: string[],
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idReq = parseId(entry, idKeys);
    const nombreReq = parseNombre(entry, nombreKeys);
    const nombreReqNorm = normalizarTextoPrerrequisito(nombreReq);
    const evaluable = idReq > 0 || nombreReqNorm.length > 0;
    const cumple = actuales.some((actual) => {
        if (idReq > 0 && toNumber(actual.id) === idReq)
            return true;
        return nombreReqNorm.length > 0 && normalizarTextoPrerrequisito(actual.nombre) === nombreReqNorm;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionConjuro(entry: Record<string, any>, ctx: ClaseEvaluacionContexto, razonFail: string): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idConjuro = parseId(entry, ["Id_conjuro", "id_conjuro", "IdConjuro", "idConjuro", "Id", "id", "i"]);
    const nombreConjuro = parseNombre(entry, ["Conjuro", "conjuro", "Poder", "poder", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreConjuro);
    const conjurosActuales = ctx.conjuros ?? [];
    const cumple = conjurosActuales.some((conjuro) => {
        if (idConjuro > 0 && toNumber(conjuro.id) === idConjuro)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(conjuro.nombre) === nombreNorm;
    });
    const evaluable = idConjuro > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail,
        razonUnknown: "Prerrequisito de conjuro con formato no reconocido",
    };
}

function buildEvaluacionDg(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ["Cantidad", "cantidad", "Valor", "valor", "c"]);
    const actual = Math.max(0, Math.trunc(toNumber(ctx.dgTotal)));
    const evaluable = Number.isFinite(requerido);
    const cumple = evaluable ? actual >= requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: `DG insuficientes (${actual} < ${requerido})`,
        razonUnknown: "Prerrequisito de dg con formato no reconocido",
    };
}

function buildEvaluacionNivelEscuela(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuelaReq = parseId(entry, ["Id_escuela", "id_escuela", "IdEscuela", "idEscuela", "Id", "id", "i"]);
    const nombreEscuelaReq = parseNombre(entry, ["Escuela", "escuela", "Nombre", "nombre"]);
    const nombreEscuelaReqNorm = normalizarTextoPrerrequisito(nombreEscuelaReq);
    const nivelReq = parseNumber(entry, ["Cantidad", "cantidad", "Nivel", "nivel", "Valor", "valor", "c", "n"]);
    const escuela = ctx.escuelaEspecialista;
    const idEscuelaActual = toNumber(escuela?.id);
    const nombreEscuelaActualNorm = normalizarTextoPrerrequisito(escuela?.nombre ?? "");
    const nivelArcanoActual = toNumber(escuela?.nivelArcano ?? ctx.lanzador?.arcano);
    const tieneEscuelaReq = idEscuelaReq > 0 || nombreEscuelaReqNorm.length > 0;
    const tieneEscuelaActual = idEscuelaActual > 0 || nombreEscuelaActualNorm.length > 0;
    const evaluable = tieneEscuelaReq && Number.isFinite(nivelReq) && tieneEscuelaActual;
    const coincideEscuela = idEscuelaReq > 0
        ? (idEscuelaActual > 0
            ? idEscuelaActual === idEscuelaReq
            : (nombreEscuelaReqNorm.length > 0 && nombreEscuelaActualNorm === nombreEscuelaReqNorm))
        : nombreEscuelaReqNorm.length > 0 && nombreEscuelaActualNorm === nombreEscuelaReqNorm;
    const cumple = evaluable
        ? coincideEscuela && nivelArcanoActual >= nivelReq
        : false;

    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: "Nivel minimo de escuela no cumplido",
        razonUnknown: "Prerrequisito nivel_escuela con formato no reconocido",
    };
}

function buildEvaluacionRangosHabilidad(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idHabilidad = parseId(entry, ["Id_habilidad", "id_habilidad", "IdHabilidad", "idHabilidad", "Id", "id", "i"]);
    const nombreHabilidad = parseNombre(entry, ["Habilidad", "habilidad", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreHabilidad);
    const rangosReq = parseNumber(entry, ["Rangos", "rangos", "Cantidad", "cantidad", "Valor", "valor", "c"]);
    const idExtraReq = parseIdOpcional(entry, ["Id_extra", "id_extra", "IdExtra", "idExtra", "e", "Extra"]);
    const habilidadesActuales = ctx.habilidades ?? [];
    const evaluable = (idHabilidad > 0 || nombreNorm.length > 0) && Number.isFinite(rangosReq);

    const cumple = habilidadesActuales.some((habilidad) => {
        const coincideHabilidad = (idHabilidad > 0 && toNumber(habilidad.id) === idHabilidad)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(habilidad.nombre) === nombreNorm);
        if (!coincideHabilidad)
            return false;
        if (toNumber(habilidad.rangos) < rangosReq)
            return false;

        if (!Number.isFinite(idExtraReq))
            return true;
        if (idExtraReq < 0)
            return toNumber(habilidad.idExtra) <= 0;
        return toNumber(habilidad.idExtra) === idExtraReq;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: "Rangos de habilidad insuficientes",
        razonUnknown: "Prerrequisito rangos_habilidad con formato no reconocido",
    };
}

function buildEvaluacionClaseEspecial(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEspecial = parseId(entry, ["Id_especial", "id_especial", "IdClaseEspecial", "idClaseEspecial", "Id", "id", "i"]);
    const nombreEspecial = parseNombre(entry, ["Clase_especial", "clase_especial", "Especial", "especial", "Nombre", "nombre"]);
    const nombreNorm = normalizarTextoPrerrequisito(nombreEspecial);
    const idExtraReq = parseIdOpcional(entry, ["Id_extra", "id_extra", "IdExtra", "idExtra", "e"]);
    const claseasActuales = ctx.claseas ?? [];
    const evaluable = idEspecial > 0 || nombreNorm.length > 0;

    const cumple = claseasActuales.some((especial) => {
        const coincide = (idEspecial > 0 && toNumber(especial.id) === idEspecial)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(especial.nombre) === nombreNorm);
        if (!coincide)
            return false;
        if (!Number.isFinite(idExtraReq))
            return true;
        if (idExtraReq < 0)
            return toNumber(especial.idExtra) <= 0;
        return toNumber(especial.idExtra) === idExtraReq;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: "Clase especial requerida no encontrada",
        razonUnknown: "Prerrequisito clase_especial con formato no reconocido",
    };
}

function buildEvaluacionNumeroMinimo(
    entry: Record<string, any>,
    actual: number,
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ["Nivel", "nivel", "Cantidad", "cantidad", "Valor", "valor", "c"]);
    const evaluable = Number.isFinite(requerido);
    const cumple = evaluable ? actual >= requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionTamano(entry: Record<string, any>, ctx: ClaseEvaluacionContexto, maximo: boolean): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseId(entry, ["Id_tamano", "id_tamano", "IdTamano", "idTamano", "Cantidad", "cantidad", "Valor", "valor", "c"]);
    const actual = Math.trunc(toNumber(ctx.tamanoId));
    const evaluable = requerido > 0 && actual > 0;
    const cumple = evaluable ? (maximo ? actual <= requerido : actual >= requerido) : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: maximo ? "No cumple tamano maximo" : "No cumple tamano minimo",
        razonUnknown: maximo
            ? "Prerrequisito tamano_maximo con formato no reconocido"
            : "Prerrequisito tamano_minimo con formato no reconocido",
    };
}

function buildEvaluacionInherente(entry: Record<string, any>): EvaluacionItem {
    return {
        grupoOpcional: parseOpcional(entry),
        evaluable: true,
        cumple: true,
        razonFail: "",
        razonUnknown: "",
    };
}

function evaluarFamilia(
    activa: boolean | undefined,
    entries: Record<string, any>[],
    build: (entry: Record<string, any>) => EvaluacionItem,
    gruposOpcionales: Map<number, GrupoOpcional>,
    fail: string[],
    unknown: string[],
    opciones?: { permitirSinDatos?: boolean; }
): void {
    if (!toBoolean(activa))
        return;
    if (entries.length < 1) {
        if (!opciones?.permitirSinDatos)
            unknown.push("Familia de prerrequisito activa sin datos");
        return;
    }

    entries.forEach((entry) => {
        const evaluacion = build(entry);
        registrarEvaluacion(evaluacion, gruposOpcionales, fail, unknown);
    });
}

export function evaluarElegibilidadClase(clase: Clase, ctx: ClaseEvaluacionContexto): ClaseEvaluacionResultado {
    const fail: string[] = [];
    const unknown: string[] = [];
    const advertencias: string[] = [];
    const gruposOpcionales = new Map<number, GrupoOpcional>();
    const flags = clase?.Prerrequisitos_flags ?? {};
    const prer = clase?.Prerrequisitos ?? ({} as Clase["Prerrequisitos"]);
    const alineamientoActualId = getAlineamientoBasicoIdPorNombre(ctx.alineamiento);

    Object.entries(flags).forEach(([key, value]) => {
        const soportada = FLAGS_SOPORTADAS.includes(key as keyof Clase["Prerrequisitos_flags"])
            || key === "clase_especial";
        if (toBoolean(value) && !soportada)
            unknown.push(`Prerrequisito no soportado en fase actual: ${key}`);
    });

    evaluarFamilia(flags?.raza, toArray(prer?.raza), (entry) => buildEvaluacionRaza(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.no_raza, toArray(prer?.no_raza), (entry) => buildEvaluacionNoRaza(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.subtipo, toArray(prer?.subtipo), (entry) => buildEvaluacionSubtipo(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.caracteristica, toArray(prer?.caracteristica), (entry) => buildEvaluacionCaracteristica(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.ataque_base, toArray(prer?.ataque_base), (entry) => buildEvaluacionAtaqueBase(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.alineamiento_requerido, toArray(prer?.alineamiento_requerido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, false), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.alineamiento_prohibido, toArray(prer?.alineamiento_prohibido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, true), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.actitud_requerido, toArray(prer?.actitud_requerido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, false), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.actitud_prohibido, toArray(prer?.actitud_prohibido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, true), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.genero, toArray(prer?.genero), (entry) => buildEvaluacionGenero(entry, ctx.genero), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.habilidad_clase, toArray(prer?.clase_especial), (entry) => buildEvaluacionClaseEspecial(entry, ctx), gruposOpcionales, fail, unknown, { permitirSinDatos: true });
    evaluarFamilia(flags?.competencia_arma, toArray(prer?.competencia_arma), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasArmas ?? [],
        ["Id_arma", "id_arma", "IdArma", "idArma", "Id", "id", "i"],
        ["Arma", "arma", "Nombre", "nombre"],
        "Competencia de arma requerida no encontrada",
        "Prerrequisito competencia_arma con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.competencia_armadura, toArray(prer?.competencia_armadura), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasArmaduras ?? [],
        ["Id_armadura", "id_armadura", "IdArmadura", "idArmadura", "Id_arma", "id_arma", "Id", "id", "i"],
        ["Armadura", "armadura", "Nombre", "nombre"],
        "Competencia de armadura requerida no encontrada",
        "Prerrequisito competencia_armadura con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.competencia_grupo_arma, toArray(prer?.competencia_grupo_arma), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasGrupoArmas ?? [],
        ["Id_grupo", "id_grupo", "IdGrupo", "idGrupo", "Id", "id", "i"],
        ["Grupo", "grupo", "Nombre", "nombre"],
        "Competencia de grupo de armas requerida no encontrada",
        "Prerrequisito competencia_grupo_arma con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.competencia_grupo_armadura, toArray(prer?.competencia_grupo_armadura), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasGrupoArmaduras ?? [],
        ["Id_grupo", "id_grupo", "IdGrupo", "idGrupo", "Id", "id", "i"],
        ["Grupo", "grupo", "Nombre", "nombre"],
        "Competencia de grupo de armaduras requerida no encontrada",
        "Prerrequisito competencia_grupo_armadura con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.conjuro_conocido, toArray(prer?.conjuro_conocido), (entry) => buildEvaluacionConjuro(entry, ctx, "Conjuro conocido requerido no encontrado"), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.dg, toArray(prer?.dg), (entry) => buildEvaluacionDg(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.dote_elegida, toArray(prer?.dote_elegida), (entry) => buildEvaluacionDote(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.nivel_escuela, toArray(prer?.nivel_escuela), (entry) => buildEvaluacionNivelEscuela(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.rangos_habilidad, toArray(prer?.rangos_habilidad), (entry) => buildEvaluacionRangosHabilidad(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.idioma, toArray(prer?.idioma), (entry) => buildEvaluacionIdioma(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.inherente, toArray(prer?.inherente), (entry) => buildEvaluacionInherente(entry), gruposOpcionales, fail, unknown, { permitirSinDatos: true });
    evaluarFamilia(flags?.lanzador_arcano, toArray(prer?.lanzador_arcano), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.lanzador?.arcano),
        "Nivel de lanzador arcano insuficiente",
        "Prerrequisito lanzador_arcano con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.lanzador_divino, toArray(prer?.lanzador_divino), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.lanzador?.divino),
        "Nivel de lanzador divino insuficiente",
        "Prerrequisito lanzador_divino con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.lanzar_conjuros_arcanos_nivel, toArray(prer?.lanzar_conjuros_arcanos_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.arcano),
        "Nivel maximo de conjuro arcano insuficiente",
        "Prerrequisito lanzar_conjuros_arcanos_nivel con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.lanzar_conjuros_divinos_nivel, toArray(prer?.lanzar_conjuros_divinos_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.divino),
        "Nivel maximo de conjuro divino insuficiente",
        "Prerrequisito lanzar_conjuros_divinos_nivel con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.lanzar_poder_psionico_nivel, toArray(prer?.lanzar_poder_psionico_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.psionico),
        "Nivel maximo de poder psionico insuficiente",
        "Prerrequisito lanzar_poder_psionico_nivel con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.conocer_poder_psionico, toArray(prer?.conocer_poder_psionico), (entry) => buildEvaluacionConjuro(entry, ctx, "Poder psionico conocido requerido no encontrado"), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.reserva_psionica, toArray(prer?.reserva_psionica), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.reservaPsionica),
        "Reserva psionica insuficiente",
        "Prerrequisito reserva_psionica con formato no reconocido"
    ), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.dominio, toArray(prer?.dominio), (entry) => buildEvaluacionDominio(entry, ctx), gruposOpcionales, fail, unknown);
    evaluarFamilia((flags as any)?.clase_especial, toArray(prer?.clase_especial), (entry) => buildEvaluacionClaseEspecial(entry, ctx), gruposOpcionales, fail, unknown, { permitirSinDatos: true });
    evaluarFamilia(flags?.tamano_maximo, toArray(prer?.tamano_maximo), (entry) => buildEvaluacionTamano(entry, ctx, true), gruposOpcionales, fail, unknown);
    evaluarFamilia(flags?.tamano_minimo, toArray(prer?.tamano_minimo), (entry) => buildEvaluacionTamano(entry, ctx, false), gruposOpcionales, fail, unknown);
    resolverGruposOpcionales(gruposOpcionales, fail, unknown);

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
