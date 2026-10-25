import { Clase } from "src/app/interfaces/clase";
import { IdentidadPrerrequisitos, existeCoincidenciaClaveEntidad } from "./identidad-prerrequisitos";
import { getAlineamientoBasicoIdPorNombre } from "./alineamiento-contrato";
import { normalizarTexto, toArray, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { frasePrerrequisito } from './prerrequisito-frase';
import { EvaluacionPrerrequisito, MotivosPrerrequisitos, cumpleExtraDotePedida } from './prerrequisitos-evaluacion';

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

function pick(entry: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(entry, key))
            return entry[key];
    }
    return undefined;
}

function parseOpcional(entry: Record<string, any>): number {
    return Math.max(0, toInt(pick(entry, ["opcional", "Opcional", "o", "O"]), 0));
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
    return toInt(raw, Number.NaN);
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

type EvaluacionItem = Omit<EvaluacionPrerrequisito, 'frase'>;

function buildEvaluacionRaza(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const razaId = parseId(entry, ["Id_raza", "id_raza", "IdRaza", "idRaza"]);
    const razaNombre = parseNombre(entry, ["Raza", "raza", "Nombre_raza", "nombre_raza", "Nombre", "nombre"]);
    if (razaId <= 0 && normalizarTexto(razaNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonUnknown: "Prerrequisito de raza con formato no reconocido",
        };
    }
    const cumple = existeCoincidenciaClaveEntidad(ctx.identidad.razas, razaId, razaNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
        razonUnknown: "Prerrequisito de raza con formato no reconocido",
    };
}

function buildEvaluacionNoRaza(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const razaId = parseId(entry, ["Id_raza", "id_raza", "IdRaza", "idRaza"]);
    const razaNombre = parseNombre(entry, ["Raza", "raza", "Nombre_raza", "nombre_raza", "Nombre", "nombre"]);
    if (razaId <= 0 && normalizarTexto(razaNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonUnknown: "Prerrequisito no_raza con formato no reconocido",
        };
    }
    const cumple = !existeCoincidenciaClaveEntidad(ctx.identidad.razas, razaId, razaNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
        razonUnknown: "Prerrequisito no_raza con formato no reconocido",
    };
}

function buildEvaluacionSubtipo(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const subtipoId = parseId(entry, ["Id_subtipo", "id_subtipo", "IdSubtipo", "idSubtipo", "Id", "id"]);
    const subtipoNombre = parseNombre(entry, ["Subtipo", "subtipo", "Nombre", "nombre"]);
    if (subtipoId <= 0 && normalizarTexto(subtipoNombre).length < 1) {
        return {
            grupoOpcional,
            evaluable: false,
            cumple: false,
            razonUnknown: "Prerrequisito de subtipo con formato no reconocido",
        };
    }
    const cumple = existeCoincidenciaClaveEntidad(ctx.identidad.subtipos, subtipoId, subtipoNombre);
    return {
        grupoOpcional,
        evaluable: true,
        cumple,
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
    const requerido = normalizarTexto(
        nombreGenero.length > 0 ? nombreGenero : (mapaGeneroPorId[idGenero] ?? "")
    );
    const actual = normalizarTexto(generoActual);
    const evaluable = requerido.length > 0 && actual.length > 0;
    const cumple = evaluable ? actual === requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonUnknown: "Prerrequisito de genero con formato no reconocido",
    };
}

function buildEvaluacionDote(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDote = parseId(entry, ["Id_dote_prerrequisito", "Id_dote", "id_dote", "Id", "id", "i"]);
    const nombreDote = parseNombre(entry, ["Dote_prerrequisito", "Dote", "dote", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreDote);
    const repetidoReq = Math.max(0, toInt(pick(entry, ["Repetido", "repetido", "r"]), 0));
    const cantidadReq = repetidoReq > 0 ? repetidoReq : 1;
    const coincidencias = ctx.dotes.filter((d) => {
        const coincideDote = (idDote > 0 && toNumber(d.id) === idDote)
            || (nombreNorm.length > 0 && normalizarTexto(d.nombre) === nombreNorm);
        return coincideDote && cumpleExtraDotePedida(entry, d);
    });
    const evaluable = idDote > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? coincidencias.length >= cantidadReq : false,
        razonUnknown: "Prerrequisito de dote con formato no reconocido",
    };
}

function buildEvaluacionIdioma(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idIdioma = parseId(entry, ["Id_idioma", "id_idioma", "Id", "id", "i"]);
    const nombreIdioma = parseNombre(entry, ["Idioma", "idioma", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreIdioma);
    const cumple = ctx.idiomas.some((i) => {
        if (idIdioma > 0 && toNumber(i.id) === idIdioma)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(i.nombre) === nombreNorm;
    });
    const evaluable = idIdioma > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: "Prerrequisito de idioma con formato no reconocido",
    };
}

function buildEvaluacionDominio(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDominio = parseId(entry, ["Id_dominio", "id_dominio", "Id", "id", "i"]);
    const nombreDominio = parseNombre(entry, ["Dominio", "dominio", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreDominio);
    const dominiosActuales = ctx.dominios ?? [];
    const cumple = dominiosActuales.some((d) => {
        if (idDominio > 0 && toNumber(d.id) === idDominio)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(d.nombre) === nombreNorm;
    });
    const evaluable = idDominio > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: "Prerrequisito de dominio con formato no reconocido",
    };
}

function buildEvaluacionCompetencia(
    entry: Record<string, any>,
    actuales: Array<{ id: number | null; nombre: string; }>,
    idKeys: string[],
    nombreKeys: string[],
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idReq = parseId(entry, idKeys);
    const nombreReq = parseNombre(entry, nombreKeys);
    const nombreReqNorm = normalizarTexto(nombreReq);
    const evaluable = idReq > 0 || nombreReqNorm.length > 0;
    const cumple = actuales.some((actual) => {
        if (idReq > 0 && toNumber(actual.id) === idReq)
            return true;
        return nombreReqNorm.length > 0 && normalizarTexto(actual.nombre) === nombreReqNorm;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown,
    };
}

function buildEvaluacionConjuro(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idConjuro = parseId(entry, ["Id_conjuro", "id_conjuro", "IdConjuro", "idConjuro", "Id", "id", "i"]);
    const nombreConjuro = parseNombre(entry, ["Conjuro", "conjuro", "Poder", "poder", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreConjuro);
    const conjurosActuales = ctx.conjuros ?? [];
    const cumple = conjurosActuales.some((conjuro) => {
        if (idConjuro > 0 && toNumber(conjuro.id) === idConjuro)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(conjuro.nombre) === nombreNorm;
    });
    const evaluable = idConjuro > 0 || nombreNorm.length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: "Prerrequisito de conjuro con formato no reconocido",
    };
}

function buildEvaluacionDg(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ["Cantidad", "cantidad", "Valor", "valor", "c"]);
    const actual = Math.max(0, toInt(ctx.dgTotal));
    const evaluable = Number.isFinite(requerido);
    const cumple = evaluable ? actual >= requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonUnknown: "Prerrequisito de dg con formato no reconocido",
    };
}

function buildEvaluacionNivelEscuela(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuelaReq = parseId(entry, ["Id_escuela", "id_escuela", "IdEscuela", "idEscuela", "Id", "id", "i"]);
    const nombreEscuelaReq = parseNombre(entry, ["Escuela", "escuela", "Nombre", "nombre"]);
    const nombreEscuelaReqNorm = normalizarTexto(nombreEscuelaReq);
    const nivelReq = parseNumber(entry, ["Cantidad", "cantidad", "Nivel", "nivel", "Valor", "valor", "c", "n"]);
    const escuela = ctx.escuelaEspecialista;
    const idEscuelaActual = toNumber(escuela?.id);
    const nombreEscuelaActualNorm = normalizarTexto(escuela?.nombre ?? "");
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
        razonUnknown: "Prerrequisito nivel_escuela con formato no reconocido",
    };
}

function buildEvaluacionRangosHabilidad(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idHabilidad = parseId(entry, ["Id_habilidad", "id_habilidad", "IdHabilidad", "idHabilidad", "Id", "id", "i"]);
    const nombreHabilidad = parseNombre(entry, ["Habilidad", "habilidad", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreHabilidad);
    const rangosReq = parseNumber(entry, ["Rangos", "rangos", "Cantidad", "cantidad", "Valor", "valor", "c"]);
    const idExtraReq = parseIdOpcional(entry, ["Id_extra", "id_extra", "IdExtra", "idExtra", "e", "Extra"]);
    const habilidadesActuales = ctx.habilidades ?? [];
    const evaluable = (idHabilidad > 0 || nombreNorm.length > 0) && Number.isFinite(rangosReq);

    const cumple = habilidadesActuales.some((habilidad) => {
        const coincideHabilidad = (idHabilidad > 0 && toNumber(habilidad.id) === idHabilidad)
            || (nombreNorm.length > 0 && normalizarTexto(habilidad.nombre) === nombreNorm);
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
        razonUnknown: "Prerrequisito rangos_habilidad con formato no reconocido",
    };
}

function buildEvaluacionClaseEspecial(entry: Record<string, any>, ctx: ClaseEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEspecial = parseId(entry, ["Id_especial", "id_especial", "IdClaseEspecial", "idClaseEspecial", "Id", "id", "i"]);
    const nombreEspecial = parseNombre(entry, ["Clase_especial", "clase_especial", "Especial", "especial", "Nombre", "nombre"]);
    const nombreNorm = normalizarTexto(nombreEspecial);
    // Sin `Id_extra` vale el especial con cualquier extra. Desde el 2026-10-24 la API da `null` donde antes daba el
    // extra 0 «Nada» (que aquí era «el especial con el extra 0»): con los datos de hoy son especiales sin extras.
    const idExtraReq = parseIdOpcional(entry, ["Id_extra", "id_extra", "IdExtra", "idExtra", "e"]);
    const claseasActuales = ctx.claseas ?? [];
    const evaluable = idEspecial > 0 || nombreNorm.length > 0;

    const cumple = claseasActuales.some((especial) => {
        const coincide = (idEspecial > 0 && toNumber(especial.id) === idEspecial)
            || (nombreNorm.length > 0 && normalizarTexto(especial.nombre) === nombreNorm);
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
        razonUnknown: "Prerrequisito clase_especial con formato no reconocido",
    };
}

function buildEvaluacionNumeroMinimo(
    entry: Record<string, any>,
    actual: number,
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
        razonUnknown,
    };
}

function buildEvaluacionTamano(entry: Record<string, any>, ctx: ClaseEvaluacionContexto, maximo: boolean): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseId(entry, ["Id_tamano", "id_tamano", "IdTamano", "idTamano", "Cantidad", "cantidad", "Valor", "valor", "c"]);
    const actual = toInt(ctx.tamanoId);
    const evaluable = requerido > 0 && actual > 0;
    const cumple = evaluable ? (maximo ? actual <= requerido : actual >= requerido) : false;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonUnknown: maximo
            ? "Prerrequisito de tamaño máximo con formato no reconocido"
            : "Prerrequisito de tamaño mínimo con formato no reconocido",
    };
}

function buildEvaluacionInherente(entry: Record<string, any>): EvaluacionItem {
    return {
        grupoOpcional: parseOpcional(entry),
        evaluable: true,
        cumple: true,
        razonUnknown: "",
    };
}

function evaluarFamilia(
    motivos: MotivosPrerrequisitos,
    clave: string,
    activa: boolean | undefined,
    entries: Record<string, any>[],
    build: (entry: Record<string, any>) => EvaluacionItem,
    opciones?: { permitirSinDatos?: boolean; }
): void {
    if (!toBoolean(activa))
        return;
    if (entries.length < 1) {
        if (!opciones?.permitirSinDatos)
            motivos.unknown.push("Familia de prerrequisito activa sin datos");
        return;
    }

    entries.forEach((entry) => motivos.registrar({ ...build(entry), frase: frasePrerrequisito(clave, entry) }));
}

export function evaluarElegibilidadClase(clase: Clase, ctx: ClaseEvaluacionContexto): ClaseEvaluacionResultado {
    const motivos = new MotivosPrerrequisitos();
    const advertencias: string[] = [];
    const flags = clase?.Prerrequisitos_flags ?? {};
    const prer = clase?.Prerrequisitos ?? ({} as Clase["Prerrequisitos"]);
    const alineamientoActualId = getAlineamientoBasicoIdPorNombre(ctx.alineamiento);

    Object.entries(flags).forEach(([key, value]) => {
        const soportada = FLAGS_SOPORTADAS.includes(key as keyof Clase["Prerrequisitos_flags"])
            || key === "clase_especial";
        if (toBoolean(value) && !soportada)
            motivos.unknown.push(`Prerrequisito no soportado en fase actual: ${key}`);
    });

    evaluarFamilia(motivos, "raza", flags?.raza, toArray(prer?.raza), (entry) => buildEvaluacionRaza(entry, ctx));
    evaluarFamilia(motivos, "no_raza", flags?.no_raza, toArray(prer?.no_raza), (entry) => buildEvaluacionNoRaza(entry, ctx));
    evaluarFamilia(motivos, "subtipo", flags?.subtipo, toArray(prer?.subtipo), (entry) => buildEvaluacionSubtipo(entry, ctx));
    evaluarFamilia(motivos, "caracteristica", flags?.caracteristica, toArray(prer?.caracteristica), (entry) => buildEvaluacionCaracteristica(entry, ctx));
    evaluarFamilia(motivos, "ataque_base", flags?.ataque_base, toArray(prer?.ataque_base), (entry) => buildEvaluacionAtaqueBase(entry, ctx));
    evaluarFamilia(motivos, "alineamiento_requerido", flags?.alineamiento_requerido, toArray(prer?.alineamiento_requerido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, false));
    evaluarFamilia(motivos, "alineamiento_prohibido", flags?.alineamiento_prohibido, toArray(prer?.alineamiento_prohibido), (entry) => buildEvaluacionAlineamiento(entry, alineamientoActualId, true));
    evaluarFamilia(motivos, "actitud_requerido", flags?.actitud_requerido, toArray(prer?.actitud_requerido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, false));
    evaluarFamilia(motivos, "actitud_prohibido", flags?.actitud_prohibido, toArray(prer?.actitud_prohibido), (entry) => buildEvaluacionActitud(entry, alineamientoActualId, true));
    evaluarFamilia(motivos, "genero", flags?.genero, toArray(prer?.genero), (entry) => buildEvaluacionGenero(entry, ctx.genero));
    evaluarFamilia(motivos, "clase_especial", flags?.habilidad_clase, toArray(prer?.clase_especial), (entry) => buildEvaluacionClaseEspecial(entry, ctx), { permitirSinDatos: true });
    evaluarFamilia(motivos, "competencia_arma", flags?.competencia_arma, toArray(prer?.competencia_arma), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasArmas ?? [],
        ["Id_arma", "id_arma", "IdArma", "idArma", "Id", "id", "i"],
        ["Arma", "arma", "Nombre", "nombre"],
        "Prerrequisito competencia_arma con formato no reconocido"
    ));
    evaluarFamilia(motivos, "competencia_armadura", flags?.competencia_armadura, toArray(prer?.competencia_armadura), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasArmaduras ?? [],
        ["Id_armadura", "id_armadura", "IdArmadura", "idArmadura", "Id_arma", "id_arma", "Id", "id", "i"],
        ["Armadura", "armadura", "Nombre", "nombre"],
        "Prerrequisito competencia_armadura con formato no reconocido"
    ));
    evaluarFamilia(motivos, "competencia_grupo_arma", flags?.competencia_grupo_arma, toArray(prer?.competencia_grupo_arma), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasGrupoArmas ?? [],
        ["Id_grupo", "id_grupo", "IdGrupo", "idGrupo", "Id", "id", "i"],
        ["Grupo", "grupo", "Nombre", "nombre"],
        "Prerrequisito competencia_grupo_arma con formato no reconocido"
    ));
    evaluarFamilia(motivos, "competencia_grupo_armadura", flags?.competencia_grupo_armadura, toArray(prer?.competencia_grupo_armadura), (entry) => buildEvaluacionCompetencia(
        entry,
        ctx.competenciasGrupoArmaduras ?? [],
        ["Id_grupo", "id_grupo", "IdGrupo", "idGrupo", "Id", "id", "i"],
        ["Grupo", "grupo", "Nombre", "nombre"],
        "Prerrequisito competencia_grupo_armadura con formato no reconocido"
    ));
    evaluarFamilia(motivos, "conjuro_conocido", flags?.conjuro_conocido, toArray(prer?.conjuro_conocido), (entry) => buildEvaluacionConjuro(entry, ctx));
    evaluarFamilia(motivos, "dg", flags?.dg, toArray(prer?.dg), (entry) => buildEvaluacionDg(entry, ctx));
    evaluarFamilia(motivos, "dote_elegida", flags?.dote_elegida, toArray(prer?.dote_elegida), (entry) => buildEvaluacionDote(entry, ctx));
    evaluarFamilia(motivos, "nivel_escuela", flags?.nivel_escuela, toArray(prer?.nivel_escuela), (entry) => buildEvaluacionNivelEscuela(entry, ctx));
    evaluarFamilia(motivos, "rangos_habilidad", flags?.rangos_habilidad, toArray(prer?.rangos_habilidad), (entry) => buildEvaluacionRangosHabilidad(entry, ctx));
    evaluarFamilia(motivos, "idioma", flags?.idioma, toArray(prer?.idioma), (entry) => buildEvaluacionIdioma(entry, ctx));
    evaluarFamilia(motivos, "inherente", flags?.inherente, toArray(prer?.inherente), (entry) => buildEvaluacionInherente(entry), { permitirSinDatos: true });
    evaluarFamilia(motivos, "lanzador_arcano", flags?.lanzador_arcano, toArray(prer?.lanzador_arcano), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.lanzador?.arcano),
        "Prerrequisito lanzador_arcano con formato no reconocido"
    ));
    evaluarFamilia(motivos, "lanzador_divino", flags?.lanzador_divino, toArray(prer?.lanzador_divino), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.lanzador?.divino),
        "Prerrequisito lanzador_divino con formato no reconocido"
    ));
    evaluarFamilia(motivos, "lanzar_conjuros_arcanos_nivel", flags?.lanzar_conjuros_arcanos_nivel, toArray(prer?.lanzar_conjuros_arcanos_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.arcano),
        "Prerrequisito lanzar_conjuros_arcanos_nivel con formato no reconocido"
    ));
    evaluarFamilia(motivos, "lanzar_conjuros_divinos_nivel", flags?.lanzar_conjuros_divinos_nivel, toArray(prer?.lanzar_conjuros_divinos_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.divino),
        "Prerrequisito lanzar_conjuros_divinos_nivel con formato no reconocido"
    ));
    evaluarFamilia(motivos, "lanzar_poder_psionico_nivel", flags?.lanzar_poder_psionico_nivel, toArray(prer?.lanzar_poder_psionico_nivel), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.nivelesConjuroMaximos?.psionico),
        "Prerrequisito lanzar_poder_psionico_nivel con formato no reconocido"
    ));
    evaluarFamilia(motivos, "conocer_poder_psionico", flags?.conocer_poder_psionico, toArray(prer?.conocer_poder_psionico), (entry) => buildEvaluacionConjuro(entry, ctx));
    evaluarFamilia(motivos, "reserva_psionica", flags?.reserva_psionica, toArray(prer?.reserva_psionica), (entry) => buildEvaluacionNumeroMinimo(
        entry,
        toNumber(ctx.reservaPsionica),
        "Prerrequisito reserva_psionica con formato no reconocido"
    ));
    evaluarFamilia(motivos, "dominio", flags?.dominio, toArray(prer?.dominio), (entry) => buildEvaluacionDominio(entry, ctx));
    evaluarFamilia(motivos, "clase_especial", (flags as any)?.clase_especial, toArray(prer?.clase_especial), (entry) => buildEvaluacionClaseEspecial(entry, ctx), { permitirSinDatos: true });
    evaluarFamilia(motivos, "tamano_maximo", flags?.tamano_maximo, toArray(prer?.tamano_maximo), (entry) => buildEvaluacionTamano(entry, ctx, true));
    evaluarFamilia(motivos, "tamano_minimo", flags?.tamano_minimo, toArray(prer?.tamano_minimo), (entry) => buildEvaluacionTamano(entry, ctx, false));
    motivos.cerrarGrupos();

    if (motivos.unknown.length > 0) {
        return {
            estado: "blocked_unknown",
            razones: Array.from(new Set(motivos.unknown)),
            advertencias,
        };
    }

    if (motivos.fail.length > 0) {
        return {
            estado: "blocked_failed",
            razones: Array.from(new Set(motivos.fail)),
            advertencias,
        };
    }

    return {
        estado: "eligible",
        razones: [],
        advertencias,
    };
}
