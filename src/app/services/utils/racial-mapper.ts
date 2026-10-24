import { Conjuro } from "src/app/interfaces/conjuro";
import { RacialDetalle } from "src/app/interfaces/racial";
import { toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { normalizeConjuroLegacy } from './conjuro-mapper';

function toOptionalNumber(value: any): number {
    const n = Number(value);
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.trunc(n));
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
        Oficial: toBoolean(pick(raw, "Oficial", "oficial", "o"), true),
        Origen: toText(raw?.Origen ?? raw?.origen).trim(),
        Opcional: toOptionalNumber(pick(raw, "Opcional", "opcional", "o")),
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
            Conjuro: normalizeConjuroLegacy(pick(item, "Conjuro", "conjuro", "c")),
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
