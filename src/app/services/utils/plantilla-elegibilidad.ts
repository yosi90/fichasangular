import { Plantilla, PlantillaCompatibilidadTipo } from "src/app/interfaces/plantilla";
import { TipoCriatura } from "src/app/interfaces/tipo_criatura";

export type EstadoElegibilidadPlantilla = "eligible" | "blocked_failed" | "blocked_unknown";

export interface CaracteristicasEvaluacion {
    Fuerza: number;
    Destreza: number;
    Constitucion: number;
    Inteligencia: number;
    Sabiduria: number;
    Carisma: number;
}

export interface PlantillaEvaluacionContexto {
    alineamiento: string;
    caracteristicas: CaracteristicasEvaluacion;
    tamanoRazaId: number;
    tipoCriaturaActualId: number;
    razaHeredada: boolean;
    incluirHomebrew: boolean;
    seleccionadas: { Id: number; Nombre: string; Nacimiento: boolean }[];
}

export interface PlantillaEvaluacionResultado {
    estado: EstadoElegibilidadPlantilla;
    razones: string[];
    advertencias: string[];
}

export interface SimulacionPlantillasResultado {
    tipoCriaturaActualId: number;
    tipoCriaturaActualNombre: string;
    licantropiaActiva: boolean;
    heredadaActiva: boolean;
}

export interface ResolucionAlineamientoPlantillas {
    alineamiento: string;
    conflicto: boolean;
    razones: string[];
}

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalize(value: string): string {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function esTipoNuevoSinCambio(tipoNuevo: string): boolean {
    return normalize(tipoNuevo) === "cualquiera";
}

function getAlineamientoBasicoId(alineamiento: string): number {
    const map: Record<string, number> = {
        "legal bueno": 1,
        "legal neutral": 2,
        "legal maligno": 3,
        "neutral bueno": 4,
        "neutral autentico": 5,
        "neutral maligno": 6,
        "caotico bueno": 7,
        "caotico neutral": 8,
        "caotico maligno": 9,
    };

    return map[normalize(alineamiento)] ?? 0;
}

const ALINEAMIENTO_POR_VECTOR: Record<string, string> = {
    "1,1": "Legal bueno",
    "1,0": "Legal neutral",
    "1,-1": "Legal maligno",
    "0,1": "Neutral bueno",
    "0,0": "Neutral autentico",
    "0,-1": "Neutral maligno",
    "-1,1": "Caotico bueno",
    "-1,0": "Caotico neutral",
    "-1,-1": "Caotico maligno",
};

function parseLey(value: string): number | null {
    const n = normalize(value);
    if (n.length < 1 || n.includes("ninguna preferencia") || n.includes("no aplica"))
        return null;
    if (n.includes("legal"))
        return 1;
    if (n.includes("caot"))
        return -1;
    if (n.includes("neutral"))
        return 0;
    return null;
}

function parseMoral(value: string): number | null {
    const n = normalize(value);
    if (n.length < 1 || n.includes("ninguna preferencia") || n.includes("no aplica"))
        return null;
    if (n.includes("malign"))
        return -1;
    if (n.includes("buen"))
        return 1;
    if (n.includes("neutral"))
        return 0;
    return null;
}

function toAlineamientoFromVector(ley: number, moral: number): string {
    const key = `${ley},${moral}`;
    return ALINEAMIENTO_POR_VECTOR[key] ?? "Neutral autentico";
}

function getVectorFromAlineamientoNombre(nombre: string): { ley: number; moral: number; } | null {
    const alineamientoId = getAlineamientoBasicoId(nombre);
    const map: Record<number, { ley: number; moral: number; }> = {
        1: { ley: 1, moral: 1 },
        2: { ley: 1, moral: 0 },
        3: { ley: 1, moral: -1 },
        4: { ley: 0, moral: 1 },
        5: { ley: 0, moral: 0 },
        6: { ley: 0, moral: -1 },
        7: { ley: -1, moral: 1 },
        8: { ley: -1, moral: 0 },
        9: { ley: -1, moral: -1 },
    };
    return map[alineamientoId] ?? null;
}

function esPrioridadValida(prioridad: number): boolean {
    return Number.isFinite(prioridad) && prioridad > 0;
}

function extraerRestriccionPlantilla(plantilla: Plantilla): {
    prioridad: number;
    ley: number | null;
    moral: number | null;
    origen: string;
} {
    const alineamiento = plantilla?.Alineamiento;
    const prioridad = toNumber(alineamiento?.Prioridad?.Id_prioridad);
    const origen = `${plantilla?.Nombre ?? "Plantilla"}`.trim() || "Plantilla";

    const vectorBasico = getVectorFromAlineamientoNombre(`${alineamiento?.Basico?.Nombre ?? ""}`);
    const ley = parseLey(`${alineamiento?.Ley?.Nombre ?? ""}`) ?? vectorBasico?.ley ?? null;
    const moral = parseMoral(`${alineamiento?.Moral?.Nombre ?? ""}`) ?? vectorBasico?.moral ?? null;

    return {
        prioridad,
        ley,
        moral,
        origen,
    };
}

export function resolverAlineamientoPlantillas(
    alineamientoBase: string,
    seleccionadas: Plantilla[]
): ResolucionAlineamientoPlantillas {
    const baseVector = getVectorFromAlineamientoNombre(alineamientoBase) ?? { ley: 0, moral: 0 };
    const razones: string[] = [];
    let restriccionLeyValor: number | null = null;
    let restriccionLeyPrioridad = -1;
    let restriccionLeyOrigen = "";
    let restriccionMoralValor: number | null = null;
    let restriccionMoralPrioridad = -1;
    let restriccionMoralOrigen = "";

    const aplicarRestriccion = (
        eje: "ley" | "moral",
        valor: number | null,
        prioridad: number,
        origen: string
    ) => {
        if (valor === null || !esPrioridadValida(prioridad))
            return;

        if (eje === "ley") {
            if (restriccionLeyValor === null || prioridad > restriccionLeyPrioridad) {
                restriccionLeyValor = valor;
                restriccionLeyPrioridad = prioridad;
                restriccionLeyOrigen = origen;
                return;
            }
            if (prioridad === restriccionLeyPrioridad && valor !== restriccionLeyValor) {
                razones.push(
                    `Conflicto de alineamiento (${eje}) entre "${restriccionLeyOrigen}" y "${origen}" (prioridad ${prioridad})`
                );
            }
            return;
        }

        if (restriccionMoralValor === null || prioridad > restriccionMoralPrioridad) {
            restriccionMoralValor = valor;
            restriccionMoralPrioridad = prioridad;
            restriccionMoralOrigen = origen;
            return;
        }
        if (prioridad === restriccionMoralPrioridad && valor !== restriccionMoralValor) {
            razones.push(
                `Conflicto de alineamiento (${eje}) entre "${restriccionMoralOrigen}" y "${origen}" (prioridad ${prioridad})`
            );
        }
    };

    seleccionadas.forEach((plantilla) => {
        const restriccion = extraerRestriccionPlantilla(plantilla);
        aplicarRestriccion("ley", restriccion.ley, restriccion.prioridad, restriccion.origen);
        aplicarRestriccion("moral", restriccion.moral, restriccion.prioridad, restriccion.origen);
    });

    const leyFinal = restriccionLeyValor ?? baseVector.ley;
    const moralFinal = restriccionMoralValor ?? baseVector.moral;

    return {
        alineamiento: toAlineamientoFromVector(leyFinal, moralFinal),
        conflicto: razones.length > 0,
        razones,
    };
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

function parseOpcional(entry: Record<string, any>): { value: number; unknown: boolean } {
    if (entry === null || typeof entry !== "object")
        return { value: 0, unknown: true };

    const raw = entry["opcional"] ?? entry["Opcional"] ?? entry["o"] ?? entry["O"] ?? 0;
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0)
        return { value: n, unknown: false };

    return { value: 0, unknown: true };
}

interface EstadoOpcionalLiteral {
    op1: boolean | null;
    op2: boolean | null;
    op3: boolean | null;
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
    unknown: string[]
): void {
    if (opcional.unknown) {
        unknown.push("Campo opcional con formato no reconocido");
        return;
    }

    // Paridad C# literal: solo existen Op1/Op2/Op3. Cualquier opcional > 3 no condiciona.
    if (opcional.value > 3)
        return;

    if (!evaluable) {
        unknown.push(razonUnknown);
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

function parseCaracteristicaId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_caracteristica"],
        entry?.["id_caracteristica"],
        entry?.["c"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseCantidad(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Cantidad"],
        entry?.["cantidad"],
        entry?.["Valor"],
        entry?.["valor"],
        entry?.["d"],
        entry?.["c"],
    ];

    for (const value of candidates) {
        const n = toNumber(value, Number.NaN);
        if (Number.isFinite(n))
            return n;
    }

    return Number.NaN;
}

function parseActitudId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_actitud"],
        entry?.["id_actitud"],
        entry?.["i"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseAlineamientoId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_alineamiento"],
        entry?.["id_alineamiento"],
        entry?.["i"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseTipoCompId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_tipo_compatible"],
        entry?.["id_tipo_compatible"],
        entry?.["Id_tipo_comp"],
        entry?.["id_tipo_comp"],
        entry?.["Id_tipo"],
        entry?.["id_tipo"],
        entry?.["i"],
        entry?.["Id"],
        entry?.["id"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function parseTipoNuevoId(entry: Record<string, any>): number {
    const candidates = [
        entry?.["Id_tipo_nuevo"],
        entry?.["id_tipo_nuevo"],
        entry?.["Id_nuevo"],
        entry?.["id_nuevo"],
        entry?.["Id_tipo_resultante"],
        entry?.["id_tipo_resultante"],
    ];

    for (const value of candidates) {
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function getStatById(caracteristicas: CaracteristicasEvaluacion, id: number): number {
    if (id === 1)
        return toNumber(caracteristicas.Fuerza);
    if (id === 2)
        return toNumber(caracteristicas.Destreza);
    if (id === 3)
        return toNumber(caracteristicas.Constitucion);
    if (id === 4)
        return toNumber(caracteristicas.Inteligencia);
    if (id === 5)
        return toNumber(caracteristicas.Sabiduria);
    if (id === 6)
        return toNumber(caracteristicas.Carisma);
    return Number.NaN;
}

export function esNombreLicantropo(nombre: string): boolean {
    return normalize(nombre).includes("licantropo");
}

export function obtenerCompatibilidadTipo(plantilla: Plantilla, tipoActualId: number): PlantillaCompatibilidadTipo | null {
    const candidatas = (plantilla?.Compatibilidad_tipos ?? []).filter(c => c.Id_tipo_comp === tipoActualId);
    if (candidatas.length > 0)
        return candidatas[0];

    const porPrerrequisitos = (plantilla?.Prerrequisitos?.criaturas_compatibles ?? []).map(entry => ({
        Id_tipo_comp: parseTipoCompId(entry),
        Id_tipo_nuevo: parseTipoNuevoId(entry),
        Tipo_comp: `${entry?.["Tipo_comp"] ?? entry?.["tipo_comp"] ?? entry?.["Tipo_compatible"] ?? entry?.["tipo_compatible"] ?? ""}`,
        Tipo_nuevo: `${entry?.["Tipo_nuevo"] ?? entry?.["tipo_nuevo"] ?? ""}`,
        Opcional: parseOpcional(entry).value,
    })).filter(item => item.Id_tipo_comp > 0 && item.Id_tipo_comp === tipoActualId);

    return porPrerrequisitos[0] ?? null;
}

export function simularEstadoPlantillas(
    tipoBase: TipoCriatura,
    seleccionadas: Plantilla[]
): SimulacionPlantillasResultado {
    let tipoCriaturaActualId = toNumber(tipoBase?.Id);
    let tipoCriaturaActualNombre = `${tipoBase?.Nombre ?? "-"}`;
    let licantropiaActiva = false;
    let heredadaActiva = false;

    seleccionadas.forEach(plantilla => {
        licantropiaActiva = licantropiaActiva || esNombreLicantropo(plantilla.Nombre);
        heredadaActiva = heredadaActiva || !!plantilla.Nacimiento;

        const compat = obtenerCompatibilidadTipo(plantilla, tipoCriaturaActualId);
        if (!compat)
            return;

        // Si Tipo_nuevo es "Cualquiera", la plantilla no altera el tipo de criatura actual.
        if (esTipoNuevoSinCambio(`${compat.Tipo_nuevo ?? ""}`))
            return;

        if (compat.Id_tipo_nuevo > 0) {
            tipoCriaturaActualId = compat.Id_tipo_nuevo;
            if ((compat.Tipo_nuevo ?? "").trim().length > 0)
                tipoCriaturaActualNombre = `${compat.Tipo_nuevo}`;
            else
                tipoCriaturaActualNombre = `Tipo #${compat.Id_tipo_nuevo}`;
        }
    });

    return {
        tipoCriaturaActualId,
        tipoCriaturaActualNombre,
        licantropiaActiva,
        heredadaActiva,
    };
}

export function evaluarElegibilidadPlantilla(
    plantilla: Plantilla,
    ctx: PlantillaEvaluacionContexto
): PlantillaEvaluacionResultado {
    const fail: string[] = [];
    const unknown: string[] = [];

    const nombreNormalizado = normalize(plantilla.Nombre);

    if (!ctx.incluirHomebrew && !plantilla.Oficial)
        fail.push("Plantilla no oficial");

    if (ctx.seleccionadas.some(s => s.Id === plantilla.Id || normalize(s.Nombre) === nombreNormalizado))
        fail.push("Ya seleccionada");

    const licantropiaActiva = ctx.seleccionadas.some(s => esNombreLicantropo(s.Nombre));
    if (esNombreLicantropo(plantilla.Nombre) && licantropiaActiva)
        fail.push("Ya hay una plantilla licantropa seleccionada");

    const heredadaActiva = ctx.razaHeredada || ctx.seleccionadas.some(s => !!s.Nacimiento);
    if (plantilla.Nacimiento && heredadaActiva)
        fail.push("No se puede seleccionar mas de una plantilla heredada");

    const tamanoRaza = toNumber(ctx.tamanoRazaId);
    const tamanoPlantilla = toNumber(plantilla?.Tamano?.Id);
    if (tamanoRaza > 0 && tamanoPlantilla !== 0) {
        if (tamanoPlantilla < tamanoRaza - 1 || tamanoPlantilla > tamanoRaza + 1)
            fail.push("Tamano incompatible con la raza base");
    }

    const alineamientoId = getAlineamientoBasicoId(ctx.alineamiento);
    if (alineamientoId <= 0)
        unknown.push("No se pudo interpretar el alineamiento actual");

    const flags = plantilla?.Prerrequisitos_flags ?? {};
    const prer = plantilla?.Prerrequisitos ?? {
        actitud_requerido: [],
        actitud_prohibido: [],
        alineamiento_requerido: [],
        caracteristica: [],
        criaturas_compatibles: [],
    };
    const opcionales: EstadoOpcionalLiteral = {
        op1: null,
        op2: null,
        op3: null,
    };

    if (flags.actitud_prohibido) {
        (prer.actitud_prohibido ?? []).forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = actitudId > 0 && alineamientoId > 0;
            const cumple = evaluable ? !cumpleActitud(actitudId, alineamientoId) : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Actitud prohibida incumplida (${actitudId})`,
                "Actitud prohibida con formato no reconocido",
                opcionales,
                fail,
                unknown
            );
        });
    }

    if (flags.actitud_requerido) {
        (prer.actitud_requerido ?? []).forEach((entry) => {
            const actitudId = parseActitudId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = actitudId > 0 && alineamientoId > 0;
            const cumple = evaluable ? cumpleActitud(actitudId, alineamientoId) : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Actitud requerida no cumplida (${actitudId})`,
                "Actitud requerida con formato no reconocido",
                opcionales,
                fail,
                unknown
            );
        });
    }

    if (flags.alineamiento_requerido) {
        (prer.alineamiento_requerido ?? []).forEach((entry) => {
            const requiredId = parseAlineamientoId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = requiredId > 0 && alineamientoId > 0;
            const cumple = evaluable ? requiredId === alineamientoId : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Alineamiento requerido no cumplido (${requiredId})`,
                "Alineamiento requerido con formato no reconocido",
                opcionales,
                fail,
                unknown
            );
        });
    }

    if (flags.caracteristica) {
        (prer.caracteristica ?? []).forEach((entry) => {
            const carId = parseCaracteristicaId(entry);
            const valorMin = parseCantidad(entry);
            const valorActual = getStatById(ctx.caracteristicas, carId);
            const opcional = parseOpcional(entry);
            const evaluable = carId > 0 && Number.isFinite(valorMin) && Number.isFinite(valorActual);
            const cumple = evaluable ? valorActual >= valorMin : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Caracteristica minima no cumplida (${carId} >= ${valorMin})`,
                "Caracteristica requerida con formato no reconocido",
                opcionales,
                fail,
                unknown
            );
        });
    }

    if (flags.criaturas_compatibles) {
        (prer.criaturas_compatibles ?? []).forEach((entry) => {
            const tipoCompId = parseTipoCompId(entry);
            const opcional = parseOpcional(entry);
            const evaluable = tipoCompId > 0 && ctx.tipoCriaturaActualId > 0;
            const cumple = evaluable ? tipoCompId === ctx.tipoCriaturaActualId : false;
            registrarResultadoOpcionalLiteral(
                opcional,
                evaluable,
                cumple,
                `Tipo de criatura incompatible (${tipoCompId})`,
                "Compatibilidad de criatura con formato no reconocido",
                opcionales,
                fail,
                unknown
            );
        });
    }

    if (opcionales.op1 === false)
        fail.push("No se cumple el grupo opcional 1");
    if (opcionales.op2 === false)
        fail.push("No se cumple el grupo opcional 2");
    if (opcionales.op3 === false)
        fail.push("No se cumple el grupo opcional 3");

    if (unknown.length > 0) {
        return {
            estado: "blocked_unknown",
            razones: Array.from(new Set(unknown)),
            advertencias: Array.from(new Set(fail)),
        };
    }

    if (fail.length > 0) {
        return {
            estado: "blocked_failed",
            razones: Array.from(new Set(fail)),
            advertencias: [],
        };
    }

    return {
        estado: "eligible",
        razones: [],
        advertencias: [],
    };
}
