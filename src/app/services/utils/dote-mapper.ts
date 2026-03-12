import { Dote, DoteExtraItem, DoteManual, DoteTipo } from "src/app/interfaces/dote";
import { DoteContexto, DoteContextual, DoteLegacy } from "src/app/interfaces/dote-contextual";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toText(value: any, fallback: string = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

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

function normalizeExtraItemsApi(raw: any): DoteExtraItem[] {
    return asStrictArray(raw)
        .map(item => ({
            Id: toNumber(item?.Id, 0),
            Nombre: toText(item?.Nombre, ""),
            Es_escudo: toBoolean(item?.Es_escudo),
        }))
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
}

function normalizeExtraItemsLegacy(raw: any): DoteExtraItem[] {
    return asArray(raw)
        .map(item => ({
            Id: toNumber(item?.Id, 0),
            Nombre: toText(item?.Nombre, ""),
            Es_escudo: toBoolean(item?.Es_escudo),
        }))
        .filter(item => item.Id > 0 || item.Nombre.trim().length > 0);
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

function normalizeManualApi(raw: any): DoteManual {
    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ""),
        Pagina: toNumber(raw?.Pagina, 0),
    };
}

function normalizeManualLegacy(raw: any): DoteManual {
    if (typeof raw === "string") {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }

    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: toText(raw?.Nombre, ""),
        Pagina: toNumber(raw?.Pagina, 0),
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
        Normal: toText(raw?.Normal, "No especifica"),
        Especial: toText(raw?.Especial, "No especifica"),
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
        },
        Extras_disponibles: {
            Armas: normalizeExtraItemsApi(raw?.Extras_disponibles?.Armas),
            Armaduras: normalizeExtraItemsApi(raw?.Extras_disponibles?.Armaduras),
            Escuelas: normalizeExtraItemsApi(raw?.Extras_disponibles?.Escuelas),
            Habilidades: normalizeExtraItemsApi(raw?.Extras_disponibles?.Habilidades),
        },
        Modificadores: normalizeModificadores(raw?.Modificadores),
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
        Normal: toText(raw?.Normal, "No especifica"),
        Especial: toText(raw?.Especial, "No especifica"),
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
        },
        Extras_disponibles: {
            Armas: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Armas),
            Armaduras: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Armaduras),
            Escuelas: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Escuelas),
            Habilidades: normalizeExtraItemsLegacy(raw?.Extras_disponibles?.Habilidades),
        },
        Modificadores: normalizeModificadores(raw?.Modificadores),
        Prerrequisitos: normalizePrerrequisitosLegacy(raw?.Prerrequisitos),
    };
}

export const normalizeDote = normalizeDoteLegacy;

function getEntidad(raw: any): "personaje" | "raza" | "plantilla" {
    if (raw?.Entidad === "raza")
        return "raza";
    if (raw?.Entidad === "plantilla")
        return "plantilla";
    return "personaje";
}

export function normalizeContexto(raw: any): DoteContexto {
    const entidad = getEntidad(raw);

    if (entidad === "raza") {
        return {
            Entidad: "raza",
            Extra: raw?.Extra ?? "No aplica",
            Id_extra: toNumber(raw?.Id_extra, 0),
            Id_raza: toNumber(raw?.Id_raza, 0),
        };
    }

    if (entidad === "plantilla") {
        return {
            Entidad: "plantilla",
            Extra: raw?.Extra ?? "No aplica",
            Id_extra: toNumber(raw?.Id_extra, 0),
            Id_plantilla: toNumber(raw?.Id_plantilla, 0),
            Dg: toNumber(raw?.Dg, 0),
        };
    }

    return {
        Entidad: "personaje",
        Extra: raw?.Extra ?? "No aplica",
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
        Extra: item.Contexto?.Extra ?? "No aplica",
        Origen: getOrigenFromContexto(item.Contexto),
    }));
}
