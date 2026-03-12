import {
    Plantilla,
    PlantillaCaracteristicas,
    PlantillaCompatibilidadTipo,
    PlantillaMovimientos,
    PlantillaPrerrequisitos,
    PlantillaPrerrequisitosFlags,
} from "src/app/interfaces/plantilla";
import { SubtipoRef } from "src/app/interfaces/subtipo";
import { toDoteContextualArray } from "./dote-mapper";

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
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true";
    }
    return false;
}

function toText(value: any, fallback: string = ""): string {
    if (typeof value === "string")
        return value;
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(raw: any): T[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw) as T[];
    return [];
}

function toStrictArray<T = any>(raw: any): T[] {
    return Array.isArray(raw) ? raw : [];
}

function normalizeManual(raw: any): { Id: number; Nombre: string; Pagina: number } {
    if (typeof raw === "string") {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Pagina: toNumber(raw?.Pagina),
    };
}

function normalizeCaracteristicas(raw: any): PlantillaCaracteristicas {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeMovimientos(raw: any): PlantillaMovimientos {
    return {
        Correr: toNumber(raw?.Correr),
        Nadar: toNumber(raw?.Nadar),
        Volar: toNumber(raw?.Volar),
        Trepar: toNumber(raw?.Trepar),
        Escalar: toNumber(raw?.Escalar),
    };
}

function normalizePrerrequisitosFlags(raw: any): PlantillaPrerrequisitosFlags {
    if (!raw || typeof raw !== "object")
        return {};

    return {
        actitud_requerido: toBoolean(raw?.actitud_requerido),
        actitud_prohibido: toBoolean(raw?.actitud_prohibido),
        alineamiento_requerido: toBoolean(raw?.alineamiento_requerido),
        caracteristica: toBoolean(raw?.caracteristica),
        criaturas_compatibles: toBoolean(raw?.criaturas_compatibles),
    };
}

function normalizePrerrequisitosApi(raw: any): PlantillaPrerrequisitos {
    return {
        actitud_requerido: toStrictArray(raw?.actitud_requerido),
        actitud_prohibido: toStrictArray(raw?.actitud_prohibido),
        alineamiento_requerido: toStrictArray(raw?.alineamiento_requerido),
        caracteristica: toStrictArray(raw?.caracteristica),
        criaturas_compatibles: toStrictArray(raw?.criaturas_compatibles),
    };
}

function normalizeSubtipoRefsApi(raw: any): SubtipoRef[] {
    const output: SubtipoRef[] = [];
    const seen = new Set<string>();

    toStrictArray(raw).forEach((item: any) => {
        const id = toNumber(item?.Id);
        const nombre = toText(item?.Nombre).trim();
        if (id <= 0 && nombre.length < 1)
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

function normalizeCompatibilidadesApi(prerrequisitosRaw: any): PlantillaCompatibilidadTipo[] {
    return toStrictArray(prerrequisitosRaw?.criaturas_compatibles)
        .map((item: any) => ({
            Id_tipo_comp: toNumber(item?.Id_tipo_comp),
            Id_tipo_nuevo: toNumber(item?.Id_tipo_nuevo),
            Tipo_comp: toText(item?.Tipo_comp),
            Tipo_nuevo: toText(item?.Tipo_nuevo),
            Opcional: toNumber(item?.Opcional),
        }))
        .filter((item) => item.Id_tipo_comp > 0);
}

export function normalizePlantillaApi(raw: any): Plantilla {
    const prerrequisitos = normalizePrerrequisitosApi(raw?.Prerrequisitos);

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManual(raw?.Manual),
        Tamano: {
            Id: toNumber(raw?.Tamano?.Id),
            Nombre: toText(raw?.Tamano?.Nombre),
            Modificador: toNumber(raw?.Tamano?.Modificador),
            Modificador_presa: toNumber(raw?.Tamano?.Modificador_presa),
        },
        Tipo_dado: {
            Id_tipo_dado: toNumber(raw?.Tipo_dado?.Id_tipo_dado),
            Nombre: toText(raw?.Tipo_dado?.Nombre),
        },
        Actualiza_dg: toBoolean(raw?.Actualiza_dg),
        Modificacion_dg: {
            Id_paso_modificacion: toNumber(raw?.Modificacion_dg?.Id_paso_modificacion),
            Nombre: toText(raw?.Modificacion_dg?.Nombre),
        },
        Modificacion_tamano: {
            Id_paso_modificacion: toNumber(raw?.Modificacion_tamano?.Id_paso_modificacion),
            Nombre: toText(raw?.Modificacion_tamano?.Nombre),
        },
        Iniciativa: toNumber(raw?.Iniciativa),
        Velocidades: toText(raw?.Velocidades),
        Ca: toText(raw?.Ca),
        Ataque_base: toNumber(raw?.Ataque_base),
        Presa: toNumber(raw?.Presa),
        Ataques: toText(raw?.Ataques),
        Ataque_completo: toText(raw?.Ataque_completo),
        Reduccion_dano: toText(raw?.Reduccion_dano),
        Resistencia_conjuros: toText(raw?.Resistencia_conjuros),
        Resistencia_elemental: toText(raw?.Resistencia_elemental),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
        Modificadores_caracteristicas: normalizeCaracteristicas(raw?.Modificadores_caracteristicas),
        Minimos_caracteristicas: normalizeCaracteristicas(raw?.Minimos_caracteristicas),
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel),
        Licantronia_dg: {
            Id_dado: toNumber(raw?.Licantronia_dg?.Id_dado),
            Dado: toText(raw?.Licantronia_dg?.Dado),
            Multiplicador: toNumber(raw?.Licantronia_dg?.Multiplicador),
            Suma: toNumber(raw?.Licantronia_dg?.Suma),
        },
        Cd: toNumber(raw?.Cd),
        Puntos_habilidad: {
            Suma: toNumber(raw?.Puntos_habilidad?.Suma),
            Suma_fija: toNumber(raw?.Puntos_habilidad?.Suma_fija),
        },
        Nacimiento: toBoolean(raw?.Nacimiento),
        Movimientos: normalizeMovimientos(raw?.Movimientos),
        Maniobrabilidad: {
            Id: toNumber(raw?.Maniobrabilidad?.Id),
            Nombre: toText(raw?.Maniobrabilidad?.Nombre),
            Velocidad_avance: toText(raw?.Maniobrabilidad?.Velocidad_avance),
            Flotar: toNumber(raw?.Maniobrabilidad?.Flotar),
            Volar_atras: toNumber(raw?.Maniobrabilidad?.Volar_atras),
            Contramarcha: toNumber(raw?.Maniobrabilidad?.Contramarcha),
            Giro: toText(raw?.Maniobrabilidad?.Giro),
            Rotacion: toText(raw?.Maniobrabilidad?.Rotacion),
            Giro_max: toText(raw?.Maniobrabilidad?.Giro_max),
            Angulo_ascenso: toText(raw?.Maniobrabilidad?.Angulo_ascenso),
            Velocidad_ascenso: toText(raw?.Maniobrabilidad?.Velocidad_ascenso),
            Angulo_descenso: toText(raw?.Maniobrabilidad?.Angulo_descenso),
            Descenso_ascenso: toNumber(raw?.Maniobrabilidad?.Descenso_ascenso),
        },
        Alineamiento: {
            Id: toNumber(raw?.Alineamiento?.Id),
            Basico: {
                Id_basico: toNumber(raw?.Alineamiento?.Basico?.Id_basico),
                Nombre: toText(raw?.Alineamiento?.Basico?.Nombre),
            },
            Ley: {
                Id_ley: toNumber(raw?.Alineamiento?.Ley?.Id_ley),
                Nombre: toText(raw?.Alineamiento?.Ley?.Nombre),
            },
            Moral: {
                Id_moral: toNumber(raw?.Alineamiento?.Moral?.Id_moral),
                Nombre: toText(raw?.Alineamiento?.Moral?.Nombre),
            },
            Prioridad: {
                Id_prioridad: toNumber(raw?.Alineamiento?.Prioridad?.Id_prioridad),
                Nombre: toText(raw?.Alineamiento?.Prioridad?.Nombre),
            },
            Descripcion: toText(raw?.Alineamiento?.Descripcion),
        },
        Oficial: toBoolean(raw?.Oficial),
        Dotes: toDoteContextualArray(raw?.Dotes),
        Subtipos: normalizeSubtipoRefsApi(raw?.Subtipos),
        Habilidades: toArray(raw?.Habilidades).map((h: any) => ({
            Id_habilidad: toNumber(h?.Id_habilidad),
            Habilidad: toText(h?.Habilidad),
            Id_caracteristica: toNumber(h?.Id_caracteristica),
            Caracteristica: toText(h?.Caracteristica),
            Descripcion: toText(h?.Descripcion),
            Soporta_extra: toBoolean(h?.Soporta_extra),
            Entrenada: toBoolean(h?.Entrenada),
            Id_extra: toNumber(h?.Id_extra),
            Extra: toText(h?.Extra),
            Rangos: toNumber(h?.Rangos),
            Varios: toText(h?.Varios),
        })),
        Sortilegas: toArray(raw?.Sortilegas).map((s: any) => ({
            Conjuro: s?.Conjuro ?? {},
            Nivel_lanzador: toNumber(s?.Nivel_lanzador),
            Usos_diarios: toText(s?.Usos_diarios),
            Dg: toNumber(s?.Dg),
        })),
        Prerrequisitos_flags: normalizePrerrequisitosFlags(raw?.Prerrequisitos_flags),
        Prerrequisitos: prerrequisitos,
        Compatibilidad_tipos: normalizeCompatibilidadesApi(raw?.Prerrequisitos),
    };
}

function normalizar(value: string): string {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}
