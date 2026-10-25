import { Personaje, PersonajeTotales } from 'src/app/interfaces/personaje';
import { PersonajeParteDto, PersonajeTipoParteDto, PersonajeTotalDto } from 'src/app/interfaces/personajes-api';
import { primerEntero, toArray, toNullableText, toNumber } from 'src/app/services/utils/normalizacion';

export type TipoSalvacion = 'fortaleza' | 'reflejos' | 'voluntad';

const ETIQUETA_TIPO: Record<PersonajeTipoParteDto, string> = {
    caracteristica: 'Característica',
    ataqueBase: 'Ataque base',
    tamano: 'Tamaño',
    clase: 'Clase',
    varios: 'Varios',
    rangos: 'Rangos',
    rangosVarios: 'Rangos varios',
    equipo: 'Equipo',
    base: 'Base',
    bonificador: 'Bonificador',
};

/**
 * Los totales de la ficha (iniciativa, presa y salvaciones): los que da hechos la API (`Totales`) o, en el borrador de
 * la creación, que aún no está en la API, calculados con su misma regla («Cómo se calcula cada total» en
 * `docs/publica/endpoints/personajes.md`).
 */
export function totalesPersonaje(pj: Personaje | null | undefined): PersonajeTotales {
    return pj?.Totales ?? totalesDelBorrador(pj);
}

/** Un total de la API (`{ total, desglose }`), o `null` si no viene. Las partes del equipo traen su `bonificador`. */
export function normalizarTotal(raw: any): PersonajeTotalDto | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        total: toNumber(raw.total),
        desglose: toArray<PersonajeParteDto>(raw.desglose).map((parte) => {
            const normalizada: PersonajeParteDto = {
                tipo: parte?.tipo,
                origen: toNullableText(parte?.origen),
                valor: toNumber(parte?.valor),
            };
            const bonificador = toNullableText(parte?.bonificador);
            if (bonificador !== null)
                normalizada.bonificador = bonificador;
            return normalizada;
        }),
    };
}

export function totalVacio(): PersonajeTotalDto {
    return { total: 0, desglose: [] };
}

/** Lo que suman las partes de un `tipo` (la de clase, la de varios…), para enseñarlas por separado. */
export function sumarPartes(total: PersonajeTotalDto | null | undefined, tipo: PersonajeTipoParteDto): number {
    return partesDe(total, tipo).reduce((acc, parte) => acc + toNumber(parte?.valor), 0);
}

/** Los orígenes conocidos de las partes de un `tipo` («Clérigo nivel 5», «Gran fortaleza»…). */
export function origenesDePartes(total: PersonajeTotalDto | null | undefined, tipo: PersonajeTipoParteDto): string[] {
    return partesDe(total, tipo)
        .map((parte) => `${parte?.origen ?? ''}`.trim())
        .filter((origen) => origen.length > 0);
}

/** Las partes de un `tipo` como los modificadores `{ valor, origen }` de la ficha (origen vacío si no se sabe). */
export function modificadoresDePartes(
    total: PersonajeTotalDto | null | undefined,
    tipo: PersonajeTipoParteDto,
): { valor: number; origen: string; }[] {
    return partesDe(total, tipo).map((parte) => ({
        valor: toNumber(parte?.valor),
        origen: `${parte?.origen ?? ''}`.trim(),
    }));
}

/**
 * El desglose en una línea por parte («Destreza +1», «Cota de mallas +5 (armadura)»); si la parte no dice su origen, se
 * nombra por su tipo.
 */
export function textoDesglose(total: PersonajeTotalDto | null | undefined): string {
    return toArray<PersonajeParteDto>(total?.desglose)
        .map((parte) => {
            const origen = `${parte?.origen ?? ''}`.trim() || ETIQUETA_TIPO[parte?.tipo] || 'Varios';
            const valor = toNumber(parte?.valor);
            const bonificador = `${parte?.bonificador ?? ''}`.trim();
            return `${origen} ${valor >= 0 ? '+' : ''}${valor}${bonificador.length > 0 ? ` (${bonificador.toLowerCase()})` : ''}`;
        })
        .join('\n');
}

/** El total de una habilidad: el de la API o, en el borrador, rangos + rangos varios + modificador de su característica. */
export function totalHabilidad(habilidad: { Total?: number; Mod_car?: number; Rangos?: number; Rangos_varios?: number; } | null | undefined): number {
    if (habilidad?.Total !== undefined && habilidad?.Total !== null)
        return toNumber(habilidad.Total);
    return toNumber(habilidad?.Rangos) + toNumber(habilidad?.Rangos_varios) + toNumber(habilidad?.Mod_car);
}

function partesDe(total: PersonajeTotalDto | null | undefined, tipo: PersonajeTipoParteDto): PersonajeParteDto[] {
    return toArray<PersonajeParteDto>(total?.desglose).filter((parte) => parte?.tipo === tipo);
}

function totalesDelBorrador(pj: Personaje | null | undefined): PersonajeTotales {
    const ataqueBase = primerEntero(pj?.Ataque_base);
    return {
        iniciativa: sumar([
            parte('caracteristica', 'Destreza', pj?.ModDestreza),
            ...partesVarias('varios', pj?.Iniciativa_varios),
        ]),
        presa: ataqueBase === null
            ? null
            : sumar([
                parte('ataqueBase', 'Ataque base', ataqueBase),
                parte('caracteristica', 'Fuerza', pj?.ModFuerza),
                ...partesVarias('tamano', [{ valor: pj?.Raza?.Tamano?.Modificador_presa, origen: `Tamaño (${pj?.Raza?.Tamano?.Nombre ?? ''})` }]),
                ...partesVarias('varios', pj?.Presa_varios),
            ]),
        salvaciones: {
            fortaleza: salvacionDelBorrador('Constitución', pj?.ModConstitucion, pj?.Salvaciones?.fortaleza),
            reflejos: salvacionDelBorrador('Destreza', pj?.ModDestreza, pj?.Salvaciones?.reflejos),
            voluntad: salvacionDelBorrador('Sabiduría', pj?.ModSabiduria, pj?.Salvaciones?.voluntad),
        },
    };
}

function salvacionDelBorrador(
    caracteristica: string,
    modificador: number | undefined,
    mods: { modsClaseos?: unknown; modsVarios?: unknown; } | undefined,
): PersonajeTotalDto {
    return sumar([
        parte('caracteristica', caracteristica, modificador),
        ...partesVarias('clase', mods?.modsClaseos),
        ...partesVarias('varios', mods?.modsVarios),
    ]);
}

function parte(tipo: PersonajeTipoParteDto, origen: string, valor: unknown): PersonajeParteDto {
    return { tipo, origen, valor: toNumber(valor) };
}

/** Los modificadores del borrador (`{ valor, origen }` o `{ Valor, Origen }`) que no valen 0, como partes de un `tipo`. */
function partesVarias(tipo: PersonajeTipoParteDto, mods: unknown): PersonajeParteDto[] {
    return toArray<any>(mods)
        .map((mod) => ({
            tipo,
            origen: `${mod?.origen ?? mod?.Origen ?? ''}`.trim() || null,
            valor: toNumber(mod?.valor ?? mod?.Valor),
        }))
        .filter((item) => item.valor !== 0);
}

function sumar(desglose: PersonajeParteDto[]): PersonajeTotalDto {
    return {
        total: desglose.reduce((acc, item) => acc + item.valor, 0),
        desglose,
    };
}
