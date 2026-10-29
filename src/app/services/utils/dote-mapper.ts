import { Dote, DoteCompetenciasOtorgadas, DoteExtraItem, DoteExtrasDeTodoElCatalogo, DoteHabilidadOtorgada, DoteSalvacionCondicional, DoteTipo } from "src/app/interfaces/dote";
import { DoteContexto, DoteContextual, DoteLegacy } from "src/app/interfaces/dote-contextual";
import { toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { leerComodin } from './comodin';
import { normalizeManualApi, normalizeManualLegacy } from './manual-mapper';
import { normalizarDoteIncarnum, normalizarNombreTraducible } from './incarnum-mapper';

function asArray(raw: any): any[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw);
    return [];
}

function asStrictArray(raw: any): any[] {
    return Array.isArray(raw) ? raw : [];
}

function normalizeExtraItem(item: any): DoteExtraItem {
    return {
        Id: toNumber(item?.Id, 0),
        Nombre: toText(item?.Nombre, ""),
        Es_escudo: toBoolean(item?.Es_escudo),
    };
}

function normalizeExtraItemsApi(raw: any): DoteExtraItem[] {
    return asStrictArray(raw)
        .map(normalizeExtraItem)
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
}

function normalizeExtraItemsLegacy(raw: any): DoteExtraItem[] {
    return asArray(raw)
        .map(normalizeExtraItem)
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
}

/** Los chakras y las fusiones elegibles (Magic of Incarnum), con su nombre del libro. */
function normalizeExtraItemsTraducibles(raw: any): DoteExtraItem[] {
    return asArray(raw).map(normalizarNombreTraducible).filter(item => item.Id > 0);
}

/** Los bonificadores a una salvación que solo cuentan en un caso (`Salvaciones_condicionales`). */
function normalizeSalvacionesCondicionales(raw: any): DoteSalvacionCondicional[] {
    return asArray(raw)
        .map((item: any) => ({
            Id_salvacion: toNumber(item?.Id_salvacion, 0),
            Salvacion: toText(item?.Salvacion, ""),
            Cantidad: toNumber(item?.Cantidad, 0),
            Condicion: toText(item?.Condicion, "").trim(),
        }))
        .filter(item => item.Id_salvacion > 0 && item.Cantidad !== 0);
}

/** Las dotes a las que sustituye en los prerrequisitos (`Cuenta_como`). */
function normalizeCuentaComo(raw: any): { Id: number; Nombre: string; }[] {
    return asArray(raw)
        .map((item: any) => ({ Id: toNumber(item?.Id, 0), Nombre: toText(item?.Nombre, "") }))
        .filter(item => item.Id > 0);
}

function normalizeTiposApi(raw: any): DoteTipo[] {
    return asStrictArray(raw)
        .map(item => ({
            Id: toNumber(item?.Id, 0),
            Nombre: toText(item?.Nombre, ""),
            Usado: toNumber(item?.Usado, 0),
        }))
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
}

function normalizeTiposLegacy(raw: any): DoteTipo[] {
    return asArray(raw)
        .map(item => ({
            Id: toNumber(item?.Id, 0),
            Nombre: toText(item?.Nombre, ""),
            Usado: toNumber(item?.Usado, 0),
        }))
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
}

function normalizeExtrasDeTodoElCatalogo(raw: any): DoteExtrasDeTodoElCatalogo {
    return {
        Armas: toBoolean(raw?.Armas),
        Armaduras: toBoolean(raw?.Armaduras),
        Escuelas: toBoolean(raw?.Escuelas),
        Habilidades: toBoolean(raw?.Habilidades),
        Chakras: toBoolean(raw?.Chakras),
        Fusiones: toBoolean(raw?.Fusiones),
    };
}

function normalizeModificadores(raw: any): { [key: string]: number } {
    const source = raw && typeof raw === "object" ? raw : {};
    const output: { [key: string]: number } = {};

    Object.keys(source).forEach(key => {
        output[key] = toNumber(source[key], 0);
    });

    return output;
}

function normalizePrerrequisitosApi(raw: any): { [key: string]: any[] } {
    const source = raw && typeof raw === "object" ? raw : {};
    const output: { [key: string]: any[] } = {};

    Object.keys(source).forEach(key => {
        output[key] = Array.isArray(source[key]) ? source[key] : [];
    });

    return output;
}

function normalizePrerrequisitosLegacy(raw: any): { [key: string]: any[] } {
    const source = raw && typeof raw === "object" ? raw : {};
    const output: { [key: string]: any[] } = {};

    Object.keys(source).forEach(key => {
        output[key] = Array.isArray(source[key]) ? source[key] : [];
    });

    return output;
}

/** Las armas y grupos de armas con los que da competencia la dote (`Competencias_otorgadas`). */
function normalizeCompetenciasOtorgadas(raw: any): DoteCompetenciasOtorgadas {
    const item = (valor: any) => ({ Id: toNumber(valor?.Id, 0), Nombre: toText(valor?.Nombre, "") });
    return {
        Armas: asArray(raw?.Armas).map((arma: any) => ({ ...item(arma), Arma_comodin: leerComodin(arma?.Arma_comodin) })),
        Grupos_arma: asArray(raw?.Grupos_arma).map(item),
    };
}

/** Las habilidades en las que da rangos la dote (`Habilidades_otorgadas`). */
function normalizeHabilidadesOtorgadas(items: any[]): DoteHabilidadOtorgada[] {
    return items.map((item: any) => ({
        Id_habilidad: toNumber(item?.Id_habilidad, 0),
        Habilidad: toText(item?.Habilidad, ""),
        Id_extra: item?.Id_extra === null || item?.Id_extra === undefined ? null : toNumber(item.Id_extra, 0),
        Extra: item?.Extra === null || item?.Extra === undefined ? null : toText(item.Extra, ""),
        Extra_comodin: leerComodin(item?.Extra_comodin),
        Rangos: toNumber(item?.Rangos, 0),
        Custom: toBoolean(item?.Custom),
    }));
}

export function normalizeDoteApi(raw: any): Dote {
    const extraArmaduraArmaduras = toNumber(raw?.Extras_soportados?.Extra_armadura_armaduras, 0);
    const extraArmaduraEscudos = toNumber(raw?.Extras_soportados?.Extra_armadura_escudos, 0);
    const extraArmadura = toNumber(
        raw?.Extras_soportados?.Extra_armadura,
        Math.max(extraArmaduraArmaduras, extraArmaduraEscudos)
    );

    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ""),
        Descripcion: toText(raw?.Descripcion, ""),
        Beneficio: toText(raw?.Beneficio, ""),
        Normal: toText(raw?.Normal, ""),
        Especial: toText(raw?.Especial, ""),
        Manual: normalizeManualApi(raw?.Manual),
        Tipos: normalizeTiposApi(raw?.Tipos),
        Repetible: toNumber(raw?.Repetible, 0),
        Repetible_distinto_extra: toNumber(raw?.Repetible_distinto_extra, 0),
        Repetible_comb: toNumber(raw?.Repetible_comb, 0),
        Comp_arma: toNumber(raw?.Comp_arma, 0),
        Oficial: toBoolean(raw?.Oficial),
        Extras_soportados: {
            Extra_arma: toNumber(raw?.Extras_soportados?.Extra_arma, 0),
            Extra_armadura_armaduras: extraArmaduraArmaduras,
            Extra_armadura_escudos: extraArmaduraEscudos,
            Extra_armadura: extraArmadura,
            Extra_escuela: toNumber(raw?.Extras_soportados?.Extra_escuela, 0),
            Extra_habilidad: toNumber(raw?.Extras_soportados?.Extra_habilidad, 0),
            Extra_chakra: toNumber(raw?.Extras_soportados?.Extra_chakra, 0),
            Extra_fusion: toNumber(raw?.Extras_soportados?.Extra_fusion, 0),
        },
        Extras_disponibles: {
            Armas: normalizeExtraItemsApi(raw?.Extras_disponibles?.Armas),
            Armaduras: normalizeExtraItemsApi(raw?.Extras_disponibles?.Armaduras),
            Escuelas: normalizeExtraItemsApi(raw?.Extras_disponibles?.Escuelas),
            Habilidades: normalizeExtraItemsApi(raw?.Extras_disponibles?.Habilidades),
            Chakras: normalizeExtraItemsTraducibles(raw?.Extras_disponibles?.Chakras),
            Fusiones: normalizeExtraItemsTraducibles(raw?.Extras_disponibles?.Fusiones),
        },
        Extras_de_todo_el_catalogo: normalizeExtrasDeTodoElCatalogo(raw?.Extras_de_todo_el_catalogo),
        Modificadores: normalizeModificadores(raw?.Modificadores),
        Habilidades_otorgadas: normalizeHabilidadesOtorgadas(asStrictArray(raw?.Habilidades_otorgadas)),
        Competencias_otorgadas: normalizeCompetenciasOtorgadas(raw?.Competencias_otorgadas),
        Incarnum: normalizarDoteIncarnum(raw?.Incarnum),
        Cuenta_como: normalizeCuentaComo(raw?.Cuenta_como),
        Salvaciones_condicionales: normalizeSalvacionesCondicionales(raw?.Salvaciones_condicionales),
        Prerrequisitos: normalizePrerrequisitosApi(raw?.Prerrequisitos),
    };
}

export function normalizeDoteLegacy(raw: any): Dote {
    const extraArmaduraArmaduras = toNumber(
        raw?.Extras_soportados?.Extra_armadura_armaduras,
        toNumber(raw?.Extras_soportados?.Extra_armadura, 0)
    );
    const extraArmaduraEscudos = toNumber(
        raw?.Extras_soportados?.Extra_armadura_escudos,
        toNumber(raw?.Extras_soportados?.Extra_armadura, 0)
    );

    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ""),
        Descripcion: toText(raw?.Descripcion, ""),
        Beneficio: toText(raw?.Beneficio, ""),
        Normal: toText(raw?.Normal, ""),
        Especial: toText(raw?.Especial, ""),
        Manual: normalizeManualLegacy(raw?.Manual),
        Tipos: normalizeTiposLegacy(raw?.Tipos),
        Repetible: toNumber(raw?.Repetible, 0),
        Repetible_distinto_extra: toNumber(raw?.Repetible_distinto_extra, 0),
        Repetible_comb: toNumber(raw?.Repetible_comb, 0),
        Comp_arma: toNumber(raw?.Comp_arma, 0),
        Oficial: toBoolean(raw?.Oficial),
        Extras_soportados: {
            Extra_arma: toNumber(raw?.Extras_soportados?.Extra_arma, 0),
            Extra_armadura_armaduras: extraArmaduraArmaduras,
            Extra_armadura_escudos: extraArmaduraEscudos,
            Extra_armadura: Math.max(extraArmaduraArmaduras, extraArmaduraEscudos),
            Extra_escuela: toNumber(raw?.Extras_soportados?.Extra_escuela, 0),
            Extra_habilidad: toNumber(raw?.Extras_soportados?.Extra_habilidad, 0),
            Extra_chakra: toNumber(raw?.Extras_soportados?.Extra_chakra, 0),
            Extra_fusion: toNumber(raw?.Extras_soportados?.Extra_fusion, 0),
        },
        Extras_disponibles: {
            Armas: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Armas),
            Armaduras: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Armaduras),
            Escuelas: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Escuelas),
            Habilidades: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Habilidades),
            Chakras: normalizeExtraItemsTraducibles(raw?.Extras_disponibles?.Chakras),
            Fusiones: normalizeExtraItemsTraducibles(raw?.Extras_disponibles?.Fusiones),
        },
        Extras_de_todo_el_catalogo: normalizeExtrasDeTodoElCatalogo(raw?.Extras_de_todo_el_catalogo),
        Modificadores: normalizeModificadores(raw?.Modificadores),
        Habilidades_otorgadas: normalizeHabilidadesOtorgadas(asArray(raw?.Habilidades_otorgadas)),
        Competencias_otorgadas: normalizeCompetenciasOtorgadas(raw?.Competencias_otorgadas),
        Incarnum: normalizarDoteIncarnum(raw?.Incarnum),
        Cuenta_como: normalizeCuentaComo(raw?.Cuenta_como),
        Salvaciones_condicionales: normalizeSalvacionesCondicionales(raw?.Salvaciones_condicionales),
        Prerrequisitos: normalizePrerrequisitosLegacy(raw?.Prerrequisitos),
    };
}

function getEntidad(raw: any): "personaje" | "raza" | "plantilla" {
    if (raw?.Entidad === "raza")
        return "raza";
    if (raw?.Entidad === "plantilla")
        return "plantilla";
    return "personaje";
}

/**
 * El contexto de una dote de una raza, una plantilla o un personaje. Sin extra, la API (y la caché) dan `Extra` a
 * `null`: queda vacío, sin volver a poner el «No aplica» de antes (el borrador de la creación sí lo usa como suyo).
 */
export function normalizeContexto(raw: any): DoteContexto {
    const entidad = getEntidad(raw);

    if (entidad === "raza") {
        return {
            Entidad: "raza",
            Extra: raw?.Extra ?? "",
            Id_extra: toNumber(raw?.Id_extra, 0),
            Id_raza: toNumber(raw?.Id_raza, 0),
        };
    }

    if (entidad === "plantilla") {
        return {
            Entidad: "plantilla",
            Extra: raw?.Extra ?? "",
            Id_extra: toNumber(raw?.Id_extra, 0),
            Id_plantilla: toNumber(raw?.Id_plantilla, 0),
            Dg: toNumber(raw?.Dg, 0),
        };
    }

    return {
        Entidad: "personaje",
        Extra: raw?.Extra ?? "",
        Id_extra: toNumber(raw?.Id_extra, 0),
        Id_personaje: toNumber(raw?.Id_personaje, 0),
        Origen: raw?.Origen ?? "Desconocido",
    };
}

export function toDoteContextualArray(raw: any): DoteContextual[] {
    return asArray(raw).map(item => {
        const doteRaw = item?.Dote ?? item;
        const contextoRaw = item?.Contexto ?? item;
        return {
            Dote: normalizeDoteLegacy(doteRaw),
            Contexto: normalizeContexto(contextoRaw),
        };
    });
}

export function getOrigenFromContexto(ctx: DoteContexto): string {
    if (ctx.Entidad === "personaje" && ctx.Origen && ctx.Origen !== "")
        return ctx.Origen;
    return ctx.Entidad;
}

export function toDoteLegacyArray(ctx: DoteContextual[]): DoteLegacy[] {
    if (!Array.isArray(ctx))
        return [];

    return ctx.map(item => ({
        Nombre: item.Dote.Nombre,
        Descripcion: item.Dote.Descripcion,
        Beneficio: item.Dote.Beneficio,
        Pagina: item.Dote.Manual?.Pagina ?? 0,
        Extra: item.Contexto?.Extra ?? "",
        Origen: getOrigenFromContexto(item.Contexto),
    }));
}
