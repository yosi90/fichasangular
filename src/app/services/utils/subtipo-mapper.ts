import { DoteContextual } from "src/app/interfaces/dote-contextual";
import {
    SubtipoDetalle,
    SubtipoHabilidadBase,
    SubtipoHabilidadCustom,
    SubtipoRef,
    SubtipoResumen,
    SubtipoSortilega,
} from "src/app/interfaces/subtipo";
import { toDoteContextualArray } from "./dote-mapper";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toText(value: any, fallback: string = ""): string {
    if (typeof value === "string")
        return value;
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "si" || normalized === "sí";
    }
    return false;
}

function toArray<T = any>(raw: any): T[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw) as T[];
    return [];
}

function normalizeManual(raw: any): { Id: number; Nombre: string; Pagina: number; } {
    if (typeof raw === "string") {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Pagina: toNumber(raw?.Pagina ?? raw?.p),
    };
}

function normalizeSubtipoRefItem(raw: any): SubtipoRef | null {
    if (typeof raw === "string") {
        const nombre = raw.trim();
        if (nombre.length < 1)
            return null;
        return {
            Id: 0,
            Nombre: nombre,
        };
    }

    const id = toNumber(raw?.Id ?? raw?.i);
    const nombre = toText(raw?.Nombre ?? raw?.n).trim();
    if (id <= 0 && nombre.length < 1)
        return null;

    return {
        Id: id > 0 ? id : 0,
        Nombre: nombre,
    };
}

function normalizeHabilidadBase(raw: any): SubtipoHabilidadBase {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Descripcion: toText(raw?.Descripcion),
        Soporta_extra: toBoolean(raw?.Soporta_extra),
        Entrenada: toBoolean(raw?.Entrenada),
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Cantidad: toNumber(raw?.Cantidad ?? raw?.Rangos),
        Varios: toText(raw?.Varios),
    };
}

function normalizeHabilidadCustom(raw: any): SubtipoHabilidadCustom {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Cantidad: toNumber(raw?.Cantidad ?? raw?.Rangos),
    };
}

function normalizeSortilega(raw: any): SubtipoSortilega {
    return {
        Conjuro: raw?.Conjuro ?? {},
        Nivel_lanzador: toNumber(raw?.Nivel_lanzador),
        Usos_diarios: toText(raw?.Usos_diarios),
    };
}

export function normalizeSubtipoRefArray(raw: any): SubtipoRef[] {
    if (typeof raw === "string") {
        const parsed = raw
            .split("|")
            .map((item) => normalizeSubtipoRefItem(item))
            .filter((item): item is SubtipoRef => !!item);
        return dedupeSubtipos(parsed);
    }

    const refs = toArray(raw)
        .map((item) => normalizeSubtipoRefItem(item))
        .filter((item): item is SubtipoRef => !!item);
    return dedupeSubtipos(refs);
}

export function normalizeSubtipoResumen(raw: any): SubtipoResumen {
    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Descripcion: toText(raw?.Descripcion ?? raw?.d),
        Manual: normalizeManual(raw?.Manual ?? raw?.ma),
        Heredada: toBoolean(raw?.Heredada ?? raw?.he),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
    };
}

export function normalizeSubtipoDetalle(raw: any): SubtipoDetalle {
    const dotes: DoteContextual[] = toDoteContextualArray(raw?.Dotes);

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Descripcion: toText(raw?.Descripcion ?? raw?.d),
        Manual: normalizeManual(raw?.Manual ?? raw?.ma),
        Heredada: toBoolean(raw?.Heredada ?? raw?.he),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
        Modificadores_caracteristicas: {
            Fuerza: toNumber(raw?.Modificadores_caracteristicas?.Fuerza),
            Destreza: toNumber(raw?.Modificadores_caracteristicas?.Destreza),
            Constitucion: toNumber(raw?.Modificadores_caracteristicas?.Constitucion),
            Inteligencia: toNumber(raw?.Modificadores_caracteristicas?.Inteligencia),
            Sabiduria: toNumber(raw?.Modificadores_caracteristicas?.Sabiduria),
            Carisma: toNumber(raw?.Modificadores_caracteristicas?.Carisma),
        },
        Minimos_caracteristicas: {
            Fuerza: toNumber(raw?.Minimos_caracteristicas?.Fuerza),
            Destreza: toNumber(raw?.Minimos_caracteristicas?.Destreza),
            Constitucion: toNumber(raw?.Minimos_caracteristicas?.Constitucion),
            Inteligencia: toNumber(raw?.Minimos_caracteristicas?.Inteligencia),
            Sabiduria: toNumber(raw?.Minimos_caracteristicas?.Sabiduria),
            Carisma: toNumber(raw?.Minimos_caracteristicas?.Carisma),
        },
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel),
        Presa: toNumber(raw?.Presa),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
        Iniciativa: toNumber(raw?.Iniciativa),
        Ataque_base: toNumber(raw?.Ataque_base),
        Ca: toText(raw?.Ca),
        Rd: toText(raw?.Rd),
        Rc: toText(raw?.Rc),
        Re: toText(raw?.Re),
        Cd: toText(raw?.Cd),
        Tesoro: toText(raw?.Tesoro),
        Movimientos: {
            Correr: toNumber(raw?.Movimientos?.Correr),
            Nadar: toNumber(raw?.Movimientos?.Nadar),
            Volar: toNumber(raw?.Movimientos?.Volar),
            Trepar: toNumber(raw?.Movimientos?.Trepar),
            Escalar: toNumber(raw?.Movimientos?.Escalar),
        },
        Maniobrabilidad: raw?.Maniobrabilidad ?? {},
        Alineamiento: raw?.Alineamiento ?? {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: "" },
            Ley: { Id_ley: 0, Nombre: "" },
            Moral: { Id_moral: 0, Nombre: "" },
            Prioridad: { Id_prioridad: 0, Nombre: "" },
            Descripcion: "",
        },
        Idiomas: toArray(raw?.Idiomas).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Secreto: toBoolean(item?.Secreto),
            Oficial: toBoolean(item?.Oficial),
        })),
        Dotes: dotes,
        Habilidades: {
            Base: toArray(raw?.Habilidades?.Base).map((item: any) => normalizeHabilidadBase(item)),
            Custom: toArray(raw?.Habilidades?.Custom).map((item: any) => normalizeHabilidadCustom(item)),
        },
        Sortilegas: toArray(raw?.Sortilegas).map((item: any) => normalizeSortilega(item)),
        Rasgos: toArray(raw?.Rasgos),
        Plantillas: toArray(raw?.Plantillas).map((item: any) => ({
            Id: toNumber(item?.Id ?? item?.i),
            Nombre: toText(item?.Nombre ?? item?.n),
            Descripcion: toText(item?.Descripcion ?? item?.d),
        })),
    };
}

function dedupeSubtipos(items: SubtipoRef[]): SubtipoRef[] {
    const seen = new Set<string>();
    const output: SubtipoRef[] = [];

    items.forEach((item) => {
        const nombre = `${item?.Nombre ?? ""}`.trim();
        const id = toNumber(item?.Id);
        if (nombre.length < 1 && id <= 0)
            return;

        const key = id > 0 ? `id:${id}` : `name:${normalizar(nombre)}`;
        if (seen.has(key))
            return;

        seen.add(key);
        output.push({
            Id: id > 0 ? id : 0,
            Nombre: nombre,
        });
    });

    return output;
}

function normalizar(value: string): string {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}
