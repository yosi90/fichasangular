export interface AlineamientoVector {
    ley: number;
    moral: number;
}

export interface AlineamientoEjes {
    ley: number | null;
    moral: number | null;
}

const ALINEAMIENTO_POR_NOMBRE: Record<string, AlineamientoVector> = {
    "legal bueno": { ley: 1, moral: 1 },
    "legal neutral": { ley: 1, moral: 0 },
    "legal maligno": { ley: 1, moral: -1 },
    "neutral bueno": { ley: 0, moral: 1 },
    "neutral autentico": { ley: 0, moral: 0 },
    "neutral maligno": { ley: 0, moral: -1 },
    "caotico bueno": { ley: -1, moral: 1 },
    "caotico neutral": { ley: -1, moral: 0 },
    "caotico maligno": { ley: -1, moral: -1 },
};

const BASICO_ID_POR_NOMBRE: Record<string, number> = {
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

const NOMBRE_POR_VECTOR: Record<string, string> = {
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

export function normalizarAlineamientoTexto(valor: string): string {
    return (valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

export function esAlineamientoSinPreferencia(valor: string): boolean {
    const n = normalizarAlineamientoTexto(valor);
    return n.length < 1 || n.includes("ninguna preferencia") || n.includes("no aplica");
}

export function getAlineamientoBasicoIdPorNombre(nombre: string): number {
    return BASICO_ID_POR_NOMBRE[normalizarAlineamientoTexto(nombre)] ?? 0;
}

export function getVectorDesdeNombreBasico(nombre: string): AlineamientoVector | null {
    const vector = ALINEAMIENTO_POR_NOMBRE[normalizarAlineamientoTexto(nombre)];
    return vector ? { ...vector } : null;
}

export function parseLeyDesdePreferencia(nombre: string): number | null {
    const n = normalizarAlineamientoTexto(nombre);
    if (esAlineamientoSinPreferencia(n))
        return null;
    if (n.includes("legal"))
        return 1;
    if (n.includes("caot"))
        return -1;
    if (n.includes("neutral"))
        return 0;
    return null;
}

export function parseMoralDesdePreferencia(nombre: string): number | null {
    const n = normalizarAlineamientoTexto(nombre);
    if (esAlineamientoSinPreferencia(n))
        return null;
    if (n.includes("malign"))
        return -1;
    if (n.includes("buen"))
        return 1;
    if (n.includes("neutral"))
        return 0;
    return null;
}

export function nombreBasicoDesdeVector(ley: number, moral: number): string {
    return NOMBRE_POR_VECTOR[`${ley},${moral}`] ?? "Neutral autentico";
}

export function extraerEjesAlineamientoDesdeContrato(alineamiento: any): AlineamientoEjes {
    const vectorBasico = getVectorDesdeNombreBasico(`${alineamiento?.Basico?.Nombre ?? ""}`);
    const leyPreferida = parseLeyDesdePreferencia(`${alineamiento?.Ley?.Nombre ?? ""}`);
    const moralPreferida = parseMoralDesdePreferencia(`${alineamiento?.Moral?.Nombre ?? ""}`);

    return {
        ley: leyPreferida ?? vectorBasico?.ley ?? null,
        moral: moralPreferida ?? vectorBasico?.moral ?? null,
    };
}

