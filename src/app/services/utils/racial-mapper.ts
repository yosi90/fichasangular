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
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Dotes: toArray(raw?.Dotes).map((item: any) => ({
            Id_dote: toNumber(item?.Id_dote),
            Dote: toText(item?.Dote),
            Id_extra: toNumber(item?.Id_extra),
            Extra: toText(item?.Extra),
        })),
        Habilidades: {
            Base: toArray(raw?.Habilidades?.Base),
            Custom: toArray(raw?.Habilidades?.Custom),
        },
        Caracteristicas: toArray(raw?.Caracteristicas),
        Salvaciones: toArray(raw?.Salvaciones),
        Sortilegas: toArray(raw?.Sortilegas).map((item: any) => ({
            Conjuro: normalizeConjuro(item?.Conjuro),
            Nivel_lanzador: toText(item?.Nivel_lanzador),
            Usos_diarios: toText(item?.Usos_diarios),
        })),
        Ataques: toArray(raw?.Ataques).map((item: any) => ({
            Descripcion: toText(item?.Descripcion),
        })),
        Prerrequisitos_flags: {
            raza: toBoolean(raw?.Prerrequisitos_flags?.raza),
            caracteristica_minima: toBoolean(raw?.Prerrequisitos_flags?.caracteristica_minima),
        },
        Prerrequisitos: {
            raza: toArray(raw?.Prerrequisitos?.raza),
            caracteristica: toArray(raw?.Prerrequisitos?.caracteristica),
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
