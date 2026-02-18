import { DoteContextual } from "src/app/interfaces/dote-contextual";
import { RacialDetalle } from "src/app/interfaces/racial";
import { Raza, RazaPrerrequisitos, RazaPrerrequisitosFlags } from "src/app/interfaces/raza";
import { SubtipoRef } from "src/app/interfaces/subtipo";
import { AptitudSortilega } from "../../interfaces/aptitud-sortilega";
import {
    getAlineamientoBasicoIdPorNombre,
    getVectorDesdeNombreBasico,
    parseLeyDesdePreferencia,
    parseMoralDesdePreferencia,
} from "./alineamiento-contrato";

export type EstadoElegibilidadRazaBase = "eligible" | "eligible_with_warning" | "blocked";

export interface EvaluacionElegibilidadRazaBase {
    estado: EstadoElegibilidadRazaBase;
    razones: string[];
    advertencias: string[];
}

interface EstadoOpcionalLiteral {
    op1: boolean | null;
    op2: boolean | null;
    op3: boolean | null;
}

interface RestriccionAlineamientoRaza {
    hasAny: boolean;
    unknown: boolean;
    alineamientoBasicoId: number;
    ley: number | null;
    moral: number | null;
}

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function parseIdExtra(value: any): number {
    if (value === undefined || value === null || `${value}`.trim() === "")
        return -1;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : -1;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

function normalizeText(value: string): string {
    return `${value ?? ""}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function uniqueTexts(values: string[]): string[] {
    return Array.from(
        new Set(
            values
                .map((v) => `${v ?? ""}`.trim())
                .filter((v) => v.length > 0)
        )
    );
}

function deepClone<T>(value: T): T {
    if (typeof structuredClone === "function")
        return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function hasMeaningfulText(value: string): boolean {
    const normalized = normalizeText(value);
    return normalized.length > 0
        && normalized !== "no especifica"
        && normalized !== "no se especifica"
        && normalized !== "no modifica"
        && normalized !== "no aplica"
        && normalized !== "-"
        && normalized !== "ninguna";
}

function hasSignificantNumber(value: any): boolean {
    const n = toNumber(value, Number.NaN);
    return Number.isFinite(n) && Math.abs(n) > 0.0001;
}

function normalizeRazaPrerrequisitos(raw: any): Required<RazaPrerrequisitos> {
    return {
        actitud_prohibido: toArray(raw?.actitud_prohibido),
        actitud_requerido: toArray(raw?.actitud_requerido),
        alineamiento_prohibido: toArray(raw?.alineamiento_prohibido),
        alineamiento_requerido: toArray(raw?.alineamiento_requerido),
        tipo_criatura: toArray(raw?.tipo_criatura),
    };
}

function normalizeRazaPrerrequisitosFlags(
    rawFlags: any,
    prerrequisitos: Required<RazaPrerrequisitos>
): Required<RazaPrerrequisitosFlags> {
    const flags = rawFlags ?? {};
    return {
        actitud_prohibido: toBoolean(flags?.actitud_prohibido) || prerrequisitos.actitud_prohibido.length > 0,
        actitud_requerido: toBoolean(flags?.actitud_requerido) || prerrequisitos.actitud_requerido.length > 0,
        alineamiento_prohibido: toBoolean(flags?.alineamiento_prohibido) || prerrequisitos.alineamiento_prohibido.length > 0,
        alineamiento_requerido: toBoolean(flags?.alineamiento_requerido) || prerrequisitos.alineamiento_requerido.length > 0,
        tipo_criatura: toBoolean(flags?.tipo_criatura) || prerrequisitos.tipo_criatura.length > 0,
    };
}

function parseOpcional(entry: Record<string, any>): { value: number; unknown: boolean } {
    if (!entry || typeof entry !== "object")
        return { value: 0, unknown: true };

    const raw = entry?.["opcional"] ?? entry?.["Opcional"] ?? entry?.["o"] ?? entry?.["O"] ?? 0;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0)
        return { value: parsed, unknown: false };
    return { value: 0, unknown: true };
}

function setGrupoOpcionalTrue(estado: EstadoOpcionalLiteral, grupo: number): void {
    if (grupo === 1)
        estado.op1 = true;
    else if (grupo === 2)
        estado.op2 = true;
    else if (grupo === 3)
        estado.op3 = true;
}

function setGrupoOpcionalFalseSiNull(estado: EstadoOpcionalLiteral, grupo: number): void {
    if (grupo === 1)
        estado.op1 ??= false;
    else if (grupo === 2)
        estado.op2 ??= false;
    else if (grupo === 3)
        estado.op3 ??= false;
}

function registrarResultadoOpcionalLiteral(
    opcional: { value: number; unknown: boolean },
    evaluable: boolean,
    cumple: boolean,
    razonFail: string,
    razonUnknown: string,
    estado: EstadoOpcionalLiteral,
    fail: string[],
    warnings: string[]
): void {
    if (opcional.unknown) {
        warnings.push("Campo opcional con formato no reconocido");
        return;
    }

    if (opcional.value > 3)
        return;

    if (!evaluable) {
        warnings.push(razonUnknown);
        return;
    }

    if (cumple) {
        if (opcional.value > 0)
            setGrupoOpcionalTrue(estado, opcional.value);
        return;
    }

    if (opcional.value === 0) {
        fail.push(razonFail);
        return;
    }

    setGrupoOpcionalFalseSiNull(estado, opcional.value);
}

function cumpleActitud(actitudId: number, alineamientoBasicoId: number): boolean {
    const esLegal = [1, 2, 3].includes(alineamientoBasicoId);
    const esNeutralEje = [2, 4, 5, 6, 8].includes(alineamientoBasicoId);
    const esCaotico = [7, 8, 9].includes(alineamientoBasicoId);
    const esBueno = [1, 4, 7].includes(alineamientoBasicoId);
    const esMaligno = [3, 6, 9].includes(alineamientoBasicoId);

    if (actitudId === 1)
        return esLegal;
    if (actitudId === 2)
        return esNeutralEje;
    if (actitudId === 3)
        return esCaotico;
    if (actitudId === 4)
        return esBueno;
    if (actitudId === 5)
        return esMaligno;

    return false;
}

function parseActitudId(entry: Record<string, any>): number {
    const values = [
        entry?.["id_actitud"],
        entry?.["Id_actitud"],
        entry?.["id"],
        entry?.["Id"],
        entry?.["i"],
    ];
    for (const value of values) {
        const parsed = toNumber(value);
        if (parsed > 0)
            return parsed;
    }
    return 0;
}

function parseTipoCriaturaId(entry: Record<string, any>): number {
    const values = [
        entry?.["id_tipo_criatura"],
        entry?.["Id_tipo_criatura"],
        entry?.["id_tipo"],
        entry?.["Id_tipo"],
        entry?.["id"],
        entry?.["Id"],
        entry?.["i"],
    ];
    for (const value of values) {
        const parsed = toNumber(value);
        if (parsed > 0)
            return parsed;
    }
    return 0;
}

function idLeyToAxis(value: number): number | null {
    if (value === 1)
        return 1;
    if (value === 2)
        return 0;
    if (value === 3)
        return -1;
    return null;
}

function idMoralToAxis(value: number): number | null {
    if (value === 1)
        return 1;
    if (value === 2)
        return 0;
    if (value === 3)
        return -1;
    return null;
}

function parseRestriccionAlineamiento(entry: Record<string, any>): RestriccionAlineamientoRaza {
    const basicById = toNumber(entry?.["id_alineamiento_basico"] || entry?.["Id_alineamiento_basico"]);
    const basicByAlineamiento = toNumber(entry?.["id_alineamiento"] || entry?.["Id_alineamiento"]);
    const basicByName = getAlineamientoBasicoIdPorNombre(
        `${entry?.["alineamiento_basico"] ?? entry?.["Alineamiento_basico"] ?? ""}`
    );
    const alineamientoBasicoId = basicById > 0
        ? basicById
        : (basicByAlineamiento > 0 ? basicByAlineamiento : basicByName);

    const rawIdLey = toNumber(entry?.["id_ley"] || entry?.["Id_ley"]);
    const rawIdMoral = toNumber(entry?.["id_moral"] || entry?.["Id_moral"]);
    const leyById = rawIdLey > 0 ? idLeyToAxis(rawIdLey) : null;
    const moralById = rawIdMoral > 0 ? idMoralToAxis(rawIdMoral) : null;
    const leyByText = parseLeyDesdePreferencia(`${entry?.["ley"] ?? entry?.["Ley"] ?? ""}`);
    const moralByText = parseMoralDesdePreferencia(`${entry?.["moral"] ?? entry?.["Moral"] ?? ""}`);

    const ley = leyById ?? leyByText;
    const moral = moralById ?? moralByText;

    const hasAny = alineamientoBasicoId > 0 || ley !== null || moral !== null;
    const unknown = (rawIdLey > 0 && leyById === null)
        || (rawIdMoral > 0 && moralById === null)
        || !hasAny;

    return {
        hasAny,
        unknown,
        alineamientoBasicoId,
        ley,
        moral,
    };
}

function coincideConRestriccionAlineamiento(
    restriccion: RestriccionAlineamientoRaza,
    alineamientoBasicoId: number,
    ley: number | null,
    moral: number | null
): { evaluable: boolean; coincide: boolean } {
    if (!restriccion.hasAny)
        return { evaluable: false, coincide: false };
    if (restriccion.alineamientoBasicoId > 0 && alineamientoBasicoId <= 0)
        return { evaluable: false, coincide: false };
    if (restriccion.ley !== null && ley === null)
        return { evaluable: false, coincide: false };
    if (restriccion.moral !== null && moral === null)
        return { evaluable: false, coincide: false };

    let coincide = true;
    if (restriccion.alineamientoBasicoId > 0)
        coincide = coincide && restriccion.alineamientoBasicoId === alineamientoBasicoId;
    if (restriccion.ley !== null)
        coincide = coincide && restriccion.ley === ley;
    if (restriccion.moral !== null)
        coincide = coincide && restriccion.moral === moral;

    return { evaluable: true, coincide };
}

function mergeByKey<T>(base: T[], extra: T[], keyGetter: (item: T) => string): T[] {
    const merged: T[] = [];
    const seen = new Set<string>();
    [...base, ...extra].forEach((item) => {
        const key = keyGetter(item);
        if (key.length < 1 || seen.has(key))
            return;
        seen.add(key);
        merged.push(item);
    });
    return merged;
}

function normalizeDoteKey(dote: DoteContextual): string {
    const doteId = toNumber(dote?.Dote?.Id);
    const nombre = normalizeText(`${dote?.Dote?.Nombre ?? ""}`);
    const extra = normalizeText(`${dote?.Contexto?.Extra ?? ""}`);
    return `${doteId > 0 ? doteId : nombre}|${extra}`;
}

function normalizeRacialKey(racial: RacialDetalle): string {
    const id = toNumber(racial?.Id);
    const nombre = normalizeText(`${racial?.Nombre ?? ""}`);
    return id > 0 ? `id:${id}` : `n:${nombre}`;
}

function normalizeSubtipoKey(subtipo: SubtipoRef): string {
    const id = toNumber(subtipo?.Id);
    const nombre = normalizeText(`${subtipo?.Nombre ?? ""}`);
    return id > 0 ? `id:${id}` : `n:${nombre}`;
}

function normalizeSortilegaKey(sortilega: AptitudSortilega): string {
    return normalizeText(`${sortilega?.Conjuro?.Nombre ?? ""}`);
}

function normalizeHabilidadRazaKey(raw: any): string {
    const id = toNumber(raw?.Id_habilidad ?? raw?.id_habilidad ?? raw?.Id ?? raw?.id);
    const nombre = normalizeText(`${raw?.Habilidad ?? raw?.habilidad ?? raw?.Nombre ?? raw?.nombre ?? ""}`);
    if (id > 0)
        return `id:${id}`;
    if (nombre.length > 0)
        return `n:${nombre}`;
    return "";
}

function normalizeRazaHabilidad(raw: any, forceCustom: boolean): any {
    const rawSoportaExtra = raw?.Soporta_extra ?? raw?.soporta_extra;
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad ?? raw?.id_habilidad ?? raw?.Id ?? raw?.id),
        Habilidad: `${raw?.Habilidad ?? raw?.habilidad ?? raw?.Nombre ?? raw?.nombre ?? ""}`.trim(),
        Id_caracteristica: toNumber(
            raw?.Id_caracteristica ?? raw?.id_caracteristica ?? raw?.IdCaracteristica ?? raw?.idCaracteristica
        ),
        Caracteristica: `${raw?.Caracteristica ?? raw?.caracteristica ?? ""}`.trim(),
        Descripcion: `${raw?.Descripcion ?? raw?.descripcion ?? raw?.d ?? ""}`.trim(),
        Entrenada: toBoolean(raw?.Entrenada ?? raw?.entrenada),
        Id_extra: parseIdExtra(raw?.Id_extra ?? raw?.id_extra ?? raw?.IdExtra ?? raw?.idExtra ?? raw?.i_ex ?? raw?.ie),
        Extra: `${raw?.Extra ?? raw?.extra ?? raw?.x ?? ""}`.trim(),
        Cantidad: toNumber(raw?.Cantidad ?? raw?.cantidad ?? raw?.Rangos ?? raw?.rangos),
        Varios: `${raw?.Varios ?? raw?.varios ?? ""}`.trim(),
        Soporta_extra: rawSoportaExtra === undefined ? undefined : toBoolean(rawSoportaExtra),
        Custom: forceCustom || toBoolean(raw?.Custom ?? raw?.custom),
        Clasea: toBoolean(raw?.Clasea ?? raw?.clasea),
        Clase: toBoolean(raw?.Clase ?? raw?.clase),
        classSkill: toBoolean(raw?.classSkill ?? raw?.classskill ?? raw?.class_skill),
    };
}

function mergeRazaHabilidades(
    base: any[],
    extra: any[],
    forceCustom: boolean
): any[] {
    const merged = new Map<string, any>();

    const mergeOne = (itemRaw: any, preferIncomingMeta: boolean) => {
        const item = normalizeRazaHabilidad(itemRaw ?? {}, forceCustom);
        const key = normalizeHabilidadRazaKey(item);
        if (key.length < 1)
            return;

        const existente = merged.get(key);
        if (!existente) {
            merged.set(key, {
                ...item,
            });
            return;
        }

        existente.Cantidad = toNumber(existente.Cantidad) + toNumber(item.Cantidad);
        existente.Custom = !!existente.Custom || !!item.Custom;
        existente.Clasea = !!existente.Clasea || !!item.Clasea;
        existente.Clase = !!existente.Clase || !!item.Clase;
        existente.classSkill = !!existente.classSkill || !!item.classSkill;
        if (existente.Soporta_extra !== undefined || item.Soporta_extra !== undefined)
            existente.Soporta_extra = !!existente.Soporta_extra || !!item.Soporta_extra;
        existente.Entrenada = !!existente.Entrenada || !!item.Entrenada;

        if (toNumber(existente.Id_habilidad) <= 0 && toNumber(item.Id_habilidad) > 0)
            existente.Id_habilidad = toNumber(item.Id_habilidad);
        if (`${existente.Habilidad ?? ""}`.trim().length < 1 && `${item.Habilidad ?? ""}`.trim().length > 0)
            existente.Habilidad = `${item.Habilidad ?? ""}`.trim();
        if (toNumber(existente.Id_caracteristica) <= 0 && toNumber(item.Id_caracteristica) > 0)
            existente.Id_caracteristica = toNumber(item.Id_caracteristica);
        if (`${existente.Caracteristica ?? ""}`.trim().length < 1 && `${item.Caracteristica ?? ""}`.trim().length > 0)
            existente.Caracteristica = `${item.Caracteristica ?? ""}`.trim();
        if (`${existente.Descripcion ?? ""}`.trim().length < 1 && `${item.Descripcion ?? ""}`.trim().length > 0)
            existente.Descripcion = `${item.Descripcion ?? ""}`.trim();
        if (toNumber(existente.Id_extra) <= 0 && toNumber(item.Id_extra) > 0)
            existente.Id_extra = toNumber(item.Id_extra);
        if (`${existente.Extra ?? ""}`.trim().length < 1 && `${item.Extra ?? ""}`.trim().length > 0)
            existente.Extra = `${item.Extra ?? ""}`.trim();
        if (`${existente.Varios ?? ""}`.trim().length < 1 && `${item.Varios ?? ""}`.trim().length > 0)
            existente.Varios = `${item.Varios ?? ""}`.trim();

        if (!preferIncomingMeta)
            return;

        if (toNumber(item.Id_habilidad) > 0)
            existente.Id_habilidad = toNumber(item.Id_habilidad);
        if (`${item.Habilidad ?? ""}`.trim().length > 0)
            existente.Habilidad = `${item.Habilidad ?? ""}`.trim();
        if (toNumber(item.Id_caracteristica) > 0)
            existente.Id_caracteristica = toNumber(item.Id_caracteristica);
        if (`${item.Caracteristica ?? ""}`.trim().length > 0)
            existente.Caracteristica = `${item.Caracteristica ?? ""}`.trim();
        if (`${item.Descripcion ?? ""}`.trim().length > 0)
            existente.Descripcion = `${item.Descripcion ?? ""}`.trim();
        if (toNumber(item.Id_extra) > 0)
            existente.Id_extra = toNumber(item.Id_extra);
        if (`${item.Extra ?? ""}`.trim().length > 0)
            existente.Extra = `${item.Extra ?? ""}`.trim();
        if (`${item.Varios ?? ""}`.trim().length > 0)
            existente.Varios = `${item.Varios ?? ""}`.trim();
    };

    toArray(base).forEach((item) => mergeOne(item, false));
    toArray(extra).forEach((item) => mergeOne(item, true));

    return Array.from(merged.values());
}

function construirMutacionRaza(base: Raza, mutada: Raza): Raza["Mutacion"] {
    const tamanoDependiente = toBoolean(mutada?.Mutacion?.Tamano_dependiente)
        || toBoolean(mutada?.Tamano_mutacion_dependiente);
    return {
        Heredada: toBoolean(base?.Heredada) || toBoolean(mutada?.Heredada) || toBoolean(mutada?.Mutacion?.Heredada),
        Es_mutada: true,
        Tamano_dependiente: tamanoDependiente,
        Tiene_prerrequisitos: toBoolean(mutada?.Mutacion?.Tiene_prerrequisitos)
            || normalizeRazaPrerrequisitos(mutada?.Prerrequisitos).actitud_prohibido.length > 0
            || normalizeRazaPrerrequisitos(mutada?.Prerrequisitos).actitud_requerido.length > 0
            || normalizeRazaPrerrequisitos(mutada?.Prerrequisitos).alineamiento_prohibido.length > 0
            || normalizeRazaPrerrequisitos(mutada?.Prerrequisitos).alineamiento_requerido.length > 0
            || normalizeRazaPrerrequisitos(mutada?.Prerrequisitos).tipo_criatura.length > 0,
    };
}

function normalizarModificadores(mods: any): Raza["Modificadores"] {
    return {
        Fuerza: toNumber(mods?.Fuerza),
        Destreza: toNumber(mods?.Destreza),
        Constitucion: toNumber(mods?.Constitucion),
        Inteligencia: toNumber(mods?.Inteligencia),
        Sabiduria: toNumber(mods?.Sabiduria),
        Carisma: toNumber(mods?.Carisma),
    };
}

function assignTextIfMeaningful(target: Record<string, any>, key: string, value: any): void {
    const text = `${value ?? ""}`.trim();
    if (hasMeaningfulText(text))
        target[key] = text;
}

function assignNumberIfSignificant(target: Record<string, any>, key: string, value: any): void {
    if (hasSignificantNumber(value))
        target[key] = toNumber(value);
}

export function esRazaMutada(raza: Raza | null | undefined): boolean {
    if (!raza)
        return false;
    return toBoolean(raza?.Mutada) || toBoolean(raza?.Mutacion?.Es_mutada);
}

export function evaluarElegibilidadRazaBase(
    mutada: Raza | null | undefined,
    candidata: Raza | null | undefined
): EvaluacionElegibilidadRazaBase {
    const fail: string[] = [];
    const warnings: string[] = [];

    if (!mutada || !candidata) {
        return {
            estado: "blocked",
            razones: ["No se pudo resolver la raza mutada o la raza base"],
            advertencias: [],
        };
    }

    if (esRazaMutada(candidata))
        fail.push("La raza base no puede ser una raza mutada");

    const prerrequisitos = normalizeRazaPrerrequisitos(mutada?.Prerrequisitos);
    const flags = normalizeRazaPrerrequisitosFlags(mutada?.Prerrequisitos_flags, prerrequisitos);
    const opcionales: EstadoOpcionalLiteral = { op1: null, op2: null, op3: null };

    const alineamientoBasicoId = getAlineamientoBasicoIdPorNombre(`${candidata?.Alineamiento?.Basico?.Nombre ?? ""}`);
    const vectorAlineamiento = getVectorDesdeNombreBasico(`${candidata?.Alineamiento?.Basico?.Nombre ?? ""}`);
    const leyActual = vectorAlineamiento?.ley ?? parseLeyDesdePreferencia(`${candidata?.Alineamiento?.Ley?.Nombre ?? ""}`);
    const moralActual = vectorAlineamiento?.moral ?? parseMoralDesdePreferencia(`${candidata?.Alineamiento?.Moral?.Nombre ?? ""}`);
    const tipoCriaturaId = toNumber(candidata?.Tipo_criatura?.Id);

    if (flags.actitud_requerido) {
        prerrequisitos.actitud_requerido.forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = actitudId > 0 && alineamientoBasicoId > 0;
            const cumple = evaluable ? cumpleActitud(actitudId, alineamientoBasicoId) : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Actitud requerida no cumplida (${actitudId})`,
                "Actitud requerida con formato no reconocido",
                opcionales,
                fail,
                warnings
            );
        });
    }

    if (flags.actitud_prohibido) {
        prerrequisitos.actitud_prohibido.forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = actitudId > 0 && alineamientoBasicoId > 0;
            const cumple = evaluable ? !cumpleActitud(actitudId, alineamientoBasicoId) : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Actitud prohibida incumplida (${actitudId})`,
                "Actitud prohibida con formato no reconocido",
                opcionales,
                fail,
                warnings
            );
        });
    }

    if (flags.alineamiento_requerido) {
        prerrequisitos.alineamiento_requerido.forEach((entry) => {
            const restriccion = parseRestriccionAlineamiento(entry);
            const opcional = parseOpcional(entry);
            const comparacion = coincideConRestriccionAlineamiento(
                restriccion,
                alineamientoBasicoId,
                leyActual,
                moralActual
            );
            const evaluable = !restriccion.unknown && comparacion.evaluable;
            const cumple = evaluable ? comparacion.coincide : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                "Alineamiento requerido no cumplido",
                "Alineamiento requerido con formato no reconocido",
                opcionales,
                fail,
                warnings
            );
        });
    }

    if (flags.alineamiento_prohibido) {
        prerrequisitos.alineamiento_prohibido.forEach((entry) => {
            const restriccion = parseRestriccionAlineamiento(entry);
            const opcional = parseOpcional(entry);
            const comparacion = coincideConRestriccionAlineamiento(
                restriccion,
                alineamientoBasicoId,
                leyActual,
                moralActual
            );
            const evaluable = !restriccion.unknown && comparacion.evaluable;
            const cumple = evaluable ? !comparacion.coincide : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                "Alineamiento prohibido incumplido",
                "Alineamiento prohibido con formato no reconocido",
                opcionales,
                fail,
                warnings
            );
        });
    }

    if (flags.tipo_criatura) {
        prerrequisitos.tipo_criatura.forEach((entry) => {
            const tipoId = parseTipoCriaturaId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = tipoId > 0 && tipoCriaturaId > 0;
            const cumple = evaluable ? tipoId === tipoCriaturaId : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Tipo de criatura incompatible (${tipoId})`,
                "Tipo de criatura con formato no reconocido",
                opcionales,
                fail,
                warnings
            );
        });
    }

    if (opcionales.op1 === false)
        fail.push("No se cumple el grupo opcional 1");
    if (opcionales.op2 === false)
        fail.push("No se cumple el grupo opcional 2");
    if (opcionales.op3 === false)
        fail.push("No se cumple el grupo opcional 3");

    if (fail.length > 0) {
        return {
            estado: "blocked",
            razones: uniqueTexts(fail),
            advertencias: uniqueTexts(warnings),
        };
    }

    if (warnings.length > 0) {
        return {
            estado: "eligible_with_warning",
            razones: [],
            advertencias: uniqueTexts(warnings),
        };
    }

    return {
        estado: "eligible",
        razones: [],
        advertencias: [],
    };
}

export function aplicarMutacion(base: Raza, mutada: Raza): Raza {
    const baseClone = deepClone(base);
    const mutadaClone = deepClone(mutada);
    const resultado = {
        ...baseClone,
    } as Raza;

    resultado.Id = toNumber(mutadaClone?.Id) > 0 ? toNumber(mutadaClone.Id) : toNumber(baseClone?.Id);
    resultado.Nombre = `${mutadaClone?.Nombre ?? baseClone?.Nombre ?? ""}`.trim();
    resultado.Oficial = toBoolean(baseClone?.Oficial) && toBoolean(mutadaClone?.Oficial);
    resultado.Heredada = toBoolean(baseClone?.Heredada) || toBoolean(mutadaClone?.Heredada);
    resultado.Mutada = true;
    resultado.Tamano_mutacion_dependiente = toBoolean(mutadaClone?.Tamano_mutacion_dependiente)
        || toBoolean(mutadaClone?.Mutacion?.Tamano_dependiente);
    resultado.Mutacion = construirMutacionRaza(baseClone, mutadaClone);
    resultado.Prerrequisitos = normalizeRazaPrerrequisitos(mutadaClone?.Prerrequisitos);
    resultado.Prerrequisitos_flags = normalizeRazaPrerrequisitosFlags(
        mutadaClone?.Prerrequisitos_flags,
        normalizeRazaPrerrequisitos(mutadaClone?.Prerrequisitos)
    );

    resultado.Modificadores = normalizarModificadores(mutadaClone?.Modificadores);

    assignTextIfMeaningful(resultado as any, "Manual", mutadaClone?.Manual);
    assignTextIfMeaningful(resultado as any, "Clase_predilecta", mutadaClone?.Clase_predilecta);
    assignTextIfMeaningful(resultado as any, "Ataques_naturales", mutadaClone?.Ataques_naturales);
    assignTextIfMeaningful(resultado as any, "Reduccion_dano", mutadaClone?.Reduccion_dano);
    assignTextIfMeaningful(resultado as any, "Resistencia_magica", mutadaClone?.Resistencia_magica);
    assignTextIfMeaningful(resultado as any, "Resistencia_energia", mutadaClone?.Resistencia_energia);

    assignNumberIfSignificant(resultado as any, "Correr", mutadaClone?.Correr);
    assignNumberIfSignificant(resultado as any, "Nadar", mutadaClone?.Nadar);
    assignNumberIfSignificant(resultado as any, "Volar", mutadaClone?.Volar);
    assignNumberIfSignificant(resultado as any, "Trepar", mutadaClone?.Trepar);
    assignNumberIfSignificant(resultado as any, "Escalar", mutadaClone?.Escalar);
    assignNumberIfSignificant(resultado as any, "Espacio", mutadaClone?.Espacio);
    assignNumberIfSignificant(resultado as any, "Alcance", mutadaClone?.Alcance);
    assignNumberIfSignificant(resultado as any, "Ajuste_nivel", mutadaClone?.Ajuste_nivel);
    assignNumberIfSignificant(resultado as any, "Armadura_natural", mutadaClone?.Armadura_natural);
    assignNumberIfSignificant(resultado as any, "Varios_armadura", mutadaClone?.Varios_armadura);
    assignNumberIfSignificant(resultado as any, "Altura_rango_inf", mutadaClone?.Altura_rango_inf);
    assignNumberIfSignificant(resultado as any, "Altura_rango_sup", mutadaClone?.Altura_rango_sup);
    assignNumberIfSignificant(resultado as any, "Peso_rango_inf", mutadaClone?.Peso_rango_inf);
    assignNumberIfSignificant(resultado as any, "Peso_rango_sup", mutadaClone?.Peso_rango_sup);
    assignNumberIfSignificant(resultado as any, "Edad_adulto", mutadaClone?.Edad_adulto);
    assignNumberIfSignificant(resultado as any, "Edad_mediana", mutadaClone?.Edad_mediana);
    assignNumberIfSignificant(resultado as any, "Edad_viejo", mutadaClone?.Edad_viejo);
    assignNumberIfSignificant(resultado as any, "Edad_venerable", mutadaClone?.Edad_venerable);

    if (mutadaClone?.Maniobrabilidad && hasMeaningfulText(mutadaClone.Maniobrabilidad?.Nombre))
        resultado.Maniobrabilidad = deepClone(mutadaClone.Maniobrabilidad);

    if (mutadaClone?.Tipo_criatura && toNumber(mutadaClone.Tipo_criatura?.Id) > 0)
        resultado.Tipo_criatura = deepClone(mutadaClone.Tipo_criatura);

    if (mutadaClone?.Alineamiento && hasMeaningfulText(mutadaClone.Alineamiento?.Basico?.Nombre))
        resultado.Alineamiento = deepClone(mutadaClone.Alineamiento);

    if (!resultado.Tamano_mutacion_dependiente && mutadaClone?.Tamano && toNumber(mutadaClone.Tamano?.Id) > 0)
        resultado.Tamano = deepClone(mutadaClone.Tamano);

    const baseDgs = deepClone(baseClone?.Dgs_adicionales ?? {});
    const mutDgs = deepClone(mutadaClone?.Dgs_adicionales ?? {});
    const cantidadMutada = toNumber(mutDgs?.Cantidad);
    resultado.Dgs_adicionales = {
        ...baseDgs,
    } as any;

    if (cantidadMutada !== 0) {
        resultado.Dgs_adicionales.Cantidad = toNumber(baseDgs?.Cantidad) + cantidadMutada;
        assignTextIfMeaningful(resultado.Dgs_adicionales as any, "Dado", mutDgs?.Dado);
        assignTextIfMeaningful(resultado.Dgs_adicionales as any, "Tipo_criatura", mutDgs?.Tipo_criatura);
        assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Dotes_extra", mutDgs?.Dotes_extra);
        assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Puntos_habilidad", mutDgs?.Puntos_habilidad);
        assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Multiplicador_puntos_habilidad", mutDgs?.Multiplicador_puntos_habilidad);
    }
    assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Ataque_base", mutDgs?.Ataque_base);
    assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Fortaleza", mutDgs?.Fortaleza);
    assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Reflejos", mutDgs?.Reflejos);
    assignNumberIfSignificant(resultado.Dgs_adicionales as any, "Voluntad", mutDgs?.Voluntad);

    resultado.Raciales = mergeByKey(
        toArray(baseClone?.Raciales),
        toArray(mutadaClone?.Raciales),
        normalizeRacialKey
    );
    resultado.Sortilegas = mergeByKey(
        toArray(baseClone?.Sortilegas),
        toArray(mutadaClone?.Sortilegas),
        normalizeSortilegaKey
    );
    resultado.DotesContextuales = mergeByKey(
        toArray(baseClone?.DotesContextuales),
        toArray(mutadaClone?.DotesContextuales),
        normalizeDoteKey
    );
    resultado.Habilidades = {
        Base: mergeRazaHabilidades(
            toArray(baseClone?.Habilidades?.Base),
            toArray(mutadaClone?.Habilidades?.Base),
            false
        ) as any[],
        Custom: mergeRazaHabilidades(
            toArray(baseClone?.Habilidades?.Custom),
            toArray(mutadaClone?.Habilidades?.Custom),
            true
        ) as any[],
    };
    resultado.Subtipos = mergeByKey(
        toArray(baseClone?.Subtipos),
        toArray(mutadaClone?.Subtipos),
        normalizeSubtipoKey
    );

    return resultado;
}
