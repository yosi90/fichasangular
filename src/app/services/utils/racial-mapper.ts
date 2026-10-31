import { Conjuro } from "src/app/interfaces/conjuro";
import { RacialDetalle } from "src/app/interfaces/racial";
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';
import { normalizeConjuroLegacy } from './conjuro-mapper';
import { normalizarEsenciaRasgo } from './incarnum-mapper';

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

/**
 * Lo que trae un racial en una raza por edades y en la ficha (dragones jugables, `docs/publica/DRAGONES_FRONT.md`): la
 * característica de su CD, su cifra a esa edad, la categoría en la que se ganó y la CD ya calculada. Igual en la API, la
 * caché y la ficha; sin dato, cada campo es `null`.
 */
export function camposEdadRacial(raw: any): Pick<RacialDetalle, 'Caracteristica_cd' | 'Valor' | 'Categoria_edad' | 'Cd'> {
    const ref = (valor: any) => {
        const id = toNumber(valor?.Id);
        const nombre = toText(valor?.Nombre).trim();
        return id > 0 || nombre.length > 0 ? { Id: id, Nombre: nombre } : null;
    };
    return {
        Caracteristica_cd: ref(raw?.Caracteristica_cd),
        Valor: toNullableText(raw?.Valor),
        Categoria_edad: ref(raw?.Categoria_edad),
        Cd: toNumberOrNull(raw?.Cd),
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
        Esencia: normalizarEsenciaRasgo(pick(raw, "Esencia")),
        ...camposEdadRacial(raw),
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
