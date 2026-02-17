import { Conjuro } from "src/app/interfaces/conjuro";
import { RacialDetalle } from "src/app/interfaces/racial";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toText(value: any, fallback: string = ""): string {
    return typeof value === "string" ? value : (value ?? fallback).toString();
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

function pick(raw: any, ...keys: string[]): any {
    if (!raw || typeof raw !== "object")
        return undefined;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(raw, key))
            return raw[key];
    }
    return undefined;
}

function normalizeConjuro(raw: any): Conjuro {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Tiempo_lanzamiento: toText(raw?.Tiempo_lanzamiento),
        Alcance: toText(raw?.Alcance),
        Escuela: {
            Id: toNumber(raw?.Escuela?.Id),
            Nombre: toText(raw?.Escuela?.Nombre),
            Nombre_especial: toText(raw?.Escuela?.Nombre_especial),
            Prohibible: toBoolean(raw?.Escuela?.Prohibible),
        },
        Disciplina: {
            Id: toNumber(raw?.Disciplina?.Id),
            Nombre: toText(raw?.Disciplina?.Nombre),
            Nombre_especial: toText(raw?.Disciplina?.Nombre_especial),
            Subdisciplinas: toArray(raw?.Disciplina?.Subdisciplinas).map((item: any) => ({
                Id: toNumber(item?.Id),
                Nombre: toText(item?.Nombre),
            })),
        },
        Manual: toText(raw?.Manual),
        Objetivo: toText(raw?.Objetivo),
        Efecto: toText(raw?.Efecto),
        Area: toText(raw?.Area),
        Arcano: toBoolean(raw?.Arcano),
        Divino: toBoolean(raw?.Divino),
        Psionico: toBoolean(raw?.Psionico),
        Alma: toBoolean(raw?.Alma),
        Duracion: toText(raw?.Duracion),
        Tipo_salvacion: toText(raw?.Tipo_salvacion),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes),
        Descripcion_componentes: toText(raw?.Descripcion_componentes),
        Permanente: toBoolean(raw?.Permanente),
        Puntos_poder: toNumber(raw?.Puntos_poder),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos),
        Descriptores: toArray(raw?.Descriptores).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
        })),
        Nivel_clase: toArray(raw?.Nivel_clase).map((item: any) => ({
            Id_clase: toNumber(item?.Id_clase),
            Clase: toText(item?.Clase),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Nivel_dominio: toArray(raw?.Nivel_dominio).map((item: any) => ({
            Id_dominio: toNumber(item?.Id_dominio),
            Dominio: toText(item?.Dominio),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Nivel_disciplinas: toArray(raw?.Nivel_disciplinas).map((item: any) => ({
            Id_disciplina: toNumber(item?.Id_disciplina),
            Disciplina: toText(item?.Disciplina),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Componentes: toArray(raw?.Componentes).map((item: any) => ({
            Componente: toText(item?.Componente),
            Id_componente: toNumber(item?.Id_componente),
        })),
        Oficial: toBoolean(raw?.Oficial),
    };
}

export function normalizeRacial(raw: any): RacialDetalle {
    const dotesRaw = pick(raw, "Dotes", "dotes", "dot");
    const habilidadesRaw = pick(raw, "Habilidades", "habilidades", "hab");
    const baseHabilidadesRaw = pick(habilidadesRaw, "Base", "base", "b");
    const customHabilidadesRaw = pick(habilidadesRaw, "Custom", "custom", "c");
    const caracteristicasRaw = pick(raw, "Caracteristicas", "caracteristicas", "car");
    const salvacionesRaw = pick(raw, "Salvaciones", "salvaciones", "sal");
    const sortilegasRaw = pick(raw, "Sortilegas", "sortilegas", "sor");
    const ataquesRaw = pick(raw, "Ataques", "ataques", "ata");
    const flagsRaw = pick(raw, "Prerrequisitos_flags", "prerrequisitos_flags", "pres_c", "prf");
    const prerrequisitosRaw = pick(raw, "Prerrequisitos", "prerrequisitos", "pres", "pre");

    return {
        Id: toNumber(pick(raw, "Id", "id", "i")),
        Nombre: toText(pick(raw, "Nombre", "nombre", "n")),
        Descripcion: toText(pick(raw, "Descripcion", "descripcion", "d")),
        Origen: toText(raw?.Origen ?? raw?.origen).trim(),
        Dotes: toArray(dotesRaw).map((item: any) => ({
            Id_dote: toNumber(pick(item, "Id_dote", "id_dote", "id_d", "id")),
            Dote: toText(pick(item, "Dote", "dote", "Nombre", "nombre", "n")),
            Id_extra: toNumber(pick(item, "Id_extra", "id_extra", "i_ex", "ie")),
            Extra: toText(pick(item, "Extra", "extra", "x")),
        })),
        Habilidades: {
            Base: toArray(baseHabilidadesRaw),
            Custom: toArray(customHabilidadesRaw),
        },
        Caracteristicas: toArray(caracteristicasRaw),
        Salvaciones: toArray(salvacionesRaw),
        Sortilegas: toArray(sortilegasRaw).map((item: any) => ({
            Conjuro: normalizeConjuro(pick(item, "Conjuro", "conjuro", "c")),
            Nivel_lanzador: toText(pick(item, "Nivel_lanzador", "nivel_lanzador", "nl")),
            Usos_diarios: toText(pick(item, "Usos_diarios", "usos_diarios", "ud")),
        })),
        Ataques: toArray(ataquesRaw).map((item: any) => ({
            Descripcion: toText(pick(item, "Descripcion", "descripcion", "d")),
        })),
        Prerrequisitos_flags: {
            raza: toBoolean(pick(flagsRaw, "raza", "r")),
            caracteristica_minima: toBoolean(pick(flagsRaw, "caracteristica_minima", "caracteristica", "c")),
        },
        Prerrequisitos: {
            raza: toArray(pick(prerrequisitosRaw, "raza", "r")),
            caracteristica: toArray(pick(prerrequisitosRaw, "caracteristica", "caracteristicas", "c")),
        },
    };
}

export function normalizeRaciales(raw: any): RacialDetalle[] {
    return toArray(raw).map(normalizeRacial);
}

export function createRacialPlaceholder(nombre: string, id: number = 0): RacialDetalle {
    return normalizeRacial({
        Id: id,
        Nombre: nombre,
    });
}
