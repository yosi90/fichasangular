import { Conjuro } from "src/app/interfaces/conjuro";
import { RacialBonificadorCondicional, RacialBonificadorContra, RacialDetalle, RacialProgresion, RacialProgresionVelocidad } from "src/app/interfaces/racial";
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toRefIdNombre, toText } from 'src/app/services/utils/normalizacion';
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
export function camposEdadRacial(raw: any): Pick<RacialDetalle, 'Caracteristica_cd' | 'Cd_dg_totales' | 'Valor' | 'Categoria_edad' | 'Cd'> {
    return {
        Caracteristica_cd: toRefIdNombre(raw?.Caracteristica_cd),
        // Si la CD cuenta todos los DG del personaje (caché `razas` 29); sin el campo, no.
        Cd_dg_totales: toBoolean(raw?.Cd_dg_totales),
        Valor: toNullableText(raw?.Valor),
        Categoria_edad: toRefIdNombre(raw?.Categoria_edad),
        Cd: toNumberOrNull(raw?.Cd),
    };
}

const TIPOS_VELOCIDAD: RacialProgresionVelocidad['Tipo'][] = ['Correr', 'Nadar', 'Volar', 'Trepar', 'Excavar'];

/**
 * La `Progresion` de un racial (lo que da o cambia a N DG o a nivel N), igual en la API, la caché y la ficha.
 * `normalizarGana` mapea el rasgo que gana (el mapper estricto de HTTP o el permisivo de la caché); una fila sin
 * `Desde` válido se descarta.
 */
export function normalizarProgresionRacial(raw: any, normalizarGana: (gana: any) => RacialDetalle): RacialProgresion[] {
    return toArray(raw)
        .filter((fila: any) => fila && typeof fila === 'object' && Number(fila.Desde) >= 1)
        .map((fila: any) => {
            const velocidad = fila.Velocidad && typeof fila.Velocidad === 'object' ? fila.Velocidad : null;
            const tipo = TIPOS_VELOCIDAD.find(t => t === velocidad?.Tipo);
            return {
                Medida: fila.Medida === 'nivel' ? 'nivel' : 'dg',
                Desde: Math.trunc(Number(fila.Desde)),
                Gana: fila.Gana && typeof fila.Gana === 'object' ? { ...normalizarGana(fila.Gana), Progresion: [] } : null,
                Sustituye: toRefIdNombre(fila.Sustituye),
                Tipo_dote: toRefIdNombre(fila.Tipo_dote),
                Velocidad: tipo ? { Tipo: tipo, Pies: toNumber(velocidad.Pies), Maniobrabilidad: toRefIdNombre(velocidad.Maniobrabilidad) } : null,
                Valor: toNullableText(fila.Valor),
                Elige_opcional: toNumber(fila.Elige_opcional) > 0 ? Math.trunc(toNumber(fila.Elige_opcional)) : null,
                Frase: toText(fila.Frase),
            } as RacialProgresion;
        });
}

const CATALOGOS_CONTRA: RacialBonificadorContra['Catalogo'][] = ['tipo_criatura', 'subtipo', 'raza'];

/**
 * Contra qué criaturas cuenta un bonificador condicional (`Contra` del racial y `contra` de la ficha, con la misma forma):
 * una de un catálogo que no se conoce se descarta.
 */
export function normalizarContraBonificador(lista: unknown[]): RacialBonificadorContra[] {
    return lista
        .filter((c: any) => CATALOGOS_CONTRA.includes(c?.Catalogo))
        .map((c: any) => ({ Catalogo: c.Catalogo, Id: toNumber(c.Id), Nombre: toText(c.Nombre).trim() }));
}

/**
 * Los `Bonificadores_condicionales` de un racial (lo que suma solo en un caso), igual en la API, la caché y la ficha.
 * Uno sin objetivo o con cantidad 0 se descarta, y una criatura de un catálogo que no se conoce, también.
 */
export function normalizarBonificadoresCondicionales(raw: any): RacialBonificadorCondicional[] {
    return toArray(raw)
        .filter((b: any) => b && typeof b === 'object' && toRefIdNombre(b.Objetivo) !== null && toNumber(b.Cantidad) !== 0)
        .map((b: any) => ({
            Objetivo: toRefIdNombre(b.Objetivo)!,
            Tipo_bonificador: toRefIdNombre(b.Tipo_bonificador) ?? { Id: 0, Nombre: '' },
            Cantidad: toNumber(b.Cantidad),
            Condicion: toText(b.Condicion).trim(),
            Contra: normalizarContraBonificador(toArray(b.Contra)),
            Frase: toText(b.Frase).trim(),
        }));
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
        Progresion: normalizarProgresionRacial(pick(raw, "Progresion"), normalizeRacial),
        Bonificadores_condicionales: normalizarBonificadoresCondicionales(pick(raw, "Bonificadores_condicionales")),
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
