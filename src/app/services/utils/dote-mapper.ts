import { Dote, DoteExtraItem, DoteManual, DoteTipo } from "src/app/interfaces/dote";
import { DoteContexto, DoteContextual, DoteLegacy } from "src/app/interfaces/dote-contextual";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function asArray(raw: any): any[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw);
    return [];
}

function normalizeExtraItems(raw: any): DoteExtraItem[] {
    return asArray(raw).map(item => ({
        Id: toNumber(item?.Id, 0),
        Nombre: item?.Nombre ?? ""
    }));
}

function normalizeTipos(raw: any): DoteTipo[] {
    return asArray(raw).map(item => ({
        Id: toNumber(item?.Id, 0),
        Nombre: item?.Nombre ?? "",
        Usado: toNumber(item?.Usado, 0),
    }));
}

export function normalizeDote(raw: any): Dote {
    let manual: DoteManual = {
        Id: 0,
        Nombre: "",
        Pagina: 0,
    };
    if (typeof raw?.Manual === "string") {
        manual = {
            Id: 0,
            Nombre: raw.Manual,
            Pagina: 0,
        };
    } else if (raw?.Manual) {
        manual = {
            Id: toNumber(raw.Manual?.Id, 0),
            Nombre: raw.Manual?.Nombre ?? "",
            Pagina: toNumber(raw.Manual?.Pagina, 0),
        };
    }

    const modificadoresRaw = raw?.Modificadores ?? {};
    const modificadores: { [key: string]: number } = {};
    Object.keys(modificadoresRaw).forEach(key => {
        modificadores[key] = toNumber(modificadoresRaw[key], 0);
    });

    const prerrequisitosRaw = raw?.Prerrequisitos ?? {};
    const prerrequisitos: { [key: string]: any[] } = {};
    Object.keys(prerrequisitosRaw).forEach(key => {
        prerrequisitos[key] = Array.isArray(prerrequisitosRaw[key]) ? prerrequisitosRaw[key] : [];
    });

    return {
        Id: toNumber(raw?.Id, 0),
        Nombre: raw?.Nombre ?? "",
        Descripcion: raw?.Descripcion ?? "",
        Beneficio: raw?.Beneficio ?? "",
        Normal: raw?.Normal ?? "No especifica",
        Especial: raw?.Especial ?? "No especifica",
        Manual: manual,
        Tipos: normalizeTipos(raw?.Tipos),
        Repetible: toNumber(raw?.Repetible, 0),
        Repetible_distinto_extra: toNumber(raw?.Repetible_distinto_extra, 0),
        Repetible_comb: toNumber(raw?.Repetible_comb, 0),
        Comp_arma: toNumber(raw?.Comp_arma, 0),
        Oficial: toBoolean(raw?.Oficial),
        Extras_soportados: {
            Extra_arma: toNumber(raw?.Extras_soportados?.Extra_arma, 0),
            Extra_armadura: toNumber(raw?.Extras_soportados?.Extra_armadura, 0),
            Extra_escuela: toNumber(raw?.Extras_soportados?.Extra_escuela, 0),
            Extra_habilidad: toNumber(raw?.Extras_soportados?.Extra_habilidad, 0),
        },
        Extras_disponibles: {
            Armas: normalizeExtraItems(raw?.Extras_disponibles?.Armas),
            Armaduras: normalizeExtraItems(raw?.Extras_disponibles?.Armaduras),
            Escuelas: normalizeExtraItems(raw?.Extras_disponibles?.Escuelas),
            Habilidades: normalizeExtraItems(raw?.Extras_disponibles?.Habilidades),
        },
        Modificadores: modificadores,
        Prerrequisitos: prerrequisitos,
    };
}

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
            Dote: normalizeDote(doteRaw),
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
