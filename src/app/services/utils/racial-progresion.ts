import type { Personaje } from 'src/app/interfaces/personaje';
import { RacialDetalle, RacialProgresion, RacialProgresionVelocidad } from 'src/app/interfaces/racial';
import { toPositiveInt } from 'src/app/services/utils/normalizacion';

/**
 * Lo que un rasgo racial da o cambia al llegar a N DG o a nivel N de personaje (`Progresion` de cada racial; contrato
 * en `docs/publica/endpoints/catalogos.md`, guía `docs/publica/RAZAS_MUTADAS.md`). La misma regla que la ficha de la API
 * (`utils/racial_progresion.py`), con los mismos casos en sus pruebas: cada fila vale desde `Desde` y para siempre, en
 * orden; gana un rasgo (tras el que lo da, con `Origen`), quita el que sustituye, suma una dote adicional de un tipo,
 * al menos una velocidad, pone la última cifra que alcanza en el `Valor` del rasgo (y en la cantidad de sus bonificadores
 * con `Cantidad_del_valor`: el sigilo de poder, +2 desde nivel 2) y pide una elección más de un grupo
 * opcional de su raza (`Elige_opcional`). Los DG son los del personaje (los
 * raciales que cuentan, los de plantilla y los de sus clases con su tabla); el nivel, su nivel de personaje.
 */

export type TipoVelocidadProgresion = RacialProgresionVelocidad['Tipo'];

export interface VelocidadDeProgresion {
    Pies: number;
    Maniobrabilidad: { Id: number; Nombre: string; } | null;
}

export interface DoteDeProgresion {
    Tipo_dote: { Id: number; Nombre: string; };
    Racial: { Id: number; Nombre: string; };
    Desde: number;
    Medida: 'dg' | 'nivel';
    /** Única por rasgo y fila: con ella la creación no la concede dos veces. */
    Clave: string;
}

/**
 * Una elección más de un grupo opcional de rasgos de su raza (`Elige_opcional`: el segundo sigilo de poder del iluminiano
 * a 2.º nivel), distinta de los que ya tiene. La creación la pide como una dote de la progresión, una vez.
 */
export interface EleccionDeProgresion {
    Grupo: number;
    Racial: { Id: number; Nombre: string; };
    Desde: number;
    Medida: 'dg' | 'nivel';
    /** Única por rasgo y fila: con ella la creación no la pide dos veces. */
    Clave: string;
}

export interface ResultadoProgresionRacial {
    raciales: RacialDetalle[];
    velocidades: Partial<Record<TipoVelocidadProgresion, VelocidadDeProgresion>>;
    dotes: DoteDeProgresion[];
    elecciones: EleccionDeProgresion[];
}

/**
 * Desde cuándo vale una fila de la progresión («a los 6 DG», «a 1 DG», «a nivel 3»): el `Origen` de lo que gana y, con
 * mayúscula, la cabecera de su fila en «Insertar/Modificar racial» (`racial-formulario.ts`).
 */
export function momentoDeProgresion(medida: RacialProgresion['Medida'], desde: number): string {
    if (medida === 'nivel')
        return `a nivel ${desde}`;
    return desde === 1 ? 'a 1 DG' : `a los ${desde} DG`;
}

function alcanza(fila: RacialProgresion, dg: number, nivel: number): boolean {
    return Number(fila.Desde) <= (fila.Medida === 'nivel' ? nivel : dg);
}

function filasOrdenadas(racial: RacialDetalle): RacialProgresion[] {
    return (racial.Progresion ?? [])
        .map((fila, indice) => ({ fila, indice }))
        .sort((a, b) => (a.fila.Desde - b.fila.Desde)
            || ((a.fila.Medida === 'dg' ? 0 : 1) - (b.fila.Medida === 'dg' ? 0 : 1))
            || (a.indice - b.indice))
        .map(x => x.fila);
}

/** Si algún rasgo de la lista crece con los DG o el nivel. */
export function tieneProgresionRacial(raciales: RacialDetalle[] | null | undefined): boolean {
    return (raciales ?? []).some(r => (r?.Progresion?.length ?? 0) > 0);
}

/** Los raciales con lo que les da su progresión a esos DG y ese nivel, y lo demás que da. No cambia la entrada. */
export function aplicarProgresionRacial(
    raciales: RacialDetalle[] | null | undefined,
    { dg, nivel }: { dg: number; nivel: number; },
): ResultadoProgresionRacial {
    let resultado: RacialDetalle[] = (raciales ?? []).filter(r => !!r).map(r => ({ ...r }));
    const velocidades: ResultadoProgresionRacial['velocidades'] = {};
    const dotes: DoteDeProgresion[] = [];
    const elecciones: EleccionDeProgresion[] = [];
    const pendientes = resultado.filter(r => (r.Progresion?.length ?? 0) > 0);
    const vistos = new Set<number>();
    while (pendientes.length > 0) {
        const dueno = pendientes.shift()!;
        if (vistos.has(Number(dueno.Id)))
            continue;
        vistos.add(Number(dueno.Id));
        for (const fila of filasOrdenadas(dueno)) {
            if (!alcanza(fila, Number(dg) || 0, Number(nivel) || 0))
                continue;
            const sustituye = Number(fila.Sustituye?.Id ?? -1);
            if (sustituye >= 0)
                resultado = resultado.filter(r => Number(r.Id) !== sustituye);
            const gana = fila.Gana;
            if (gana && Number(gana.Id) >= 0 && !resultado.some(r => Number(r.Id) === Number(gana.Id))) {
                const nuevo: RacialDetalle = { ...gana, Origen: `${dueno.Nombre}, ${momentoDeProgresion(fila.Medida, Number(fila.Desde))}` };
                const posicion = resultado.indexOf(dueno);
                resultado.splice(posicion >= 0 ? posicion + 1 : resultado.length, 0, nuevo);
                if ((nuevo.Progresion?.length ?? 0) > 0)
                    pendientes.push(nuevo);
            }
            if (fila.Valor)
                dueno.Valor = fila.Valor;
            const velocidad = fila.Velocidad;
            if (velocidad) {
                const actual = velocidades[velocidad.Tipo];
                if (!actual || Number(velocidad.Pies) > actual.Pies)
                    velocidades[velocidad.Tipo] = { Pies: Number(velocidad.Pies) || 0, Maniobrabilidad: velocidad.Maniobrabilidad ?? null };
            }
            if (fila.Tipo_dote)
                dotes.push({
                    Tipo_dote: fila.Tipo_dote,
                    Racial: { Id: Number(dueno.Id), Nombre: dueno.Nombre },
                    Desde: Number(fila.Desde),
                    Medida: fila.Medida,
                    Clave: `${dueno.Id}:${fila.Medida}:${fila.Desde}:${fila.Tipo_dote.Id}`,
                });
            if (Number(fila.Elige_opcional) > 0)
                elecciones.push({
                    Grupo: Number(fila.Elige_opcional),
                    Racial: { Id: Number(dueno.Id), Nombre: dueno.Nombre },
                    Desde: Number(fila.Desde),
                    Medida: fila.Medida,
                    Clave: `${dueno.Id}:${fila.Medida}:${fila.Desde}:opcional:${fila.Elige_opcional}`,
                });
        }
    }
    return { raciales: resultado.map(conLaCifraDelRasgo), velocidades, dotes, elecciones };
}

const CIFRA_ENTERA = /^[+-]?\d+$/;

/**
 * El rasgo con la cifra que alcanza (`Valor`: «+2») como cantidad de sus bonificadores con `Cantidad_del_valor`, y la
 * frase de la API con esa cantidad. Sin `Valor` o si no es un entero (el aliento, «2d8»), igual. Como
 * `racial_bonificadores.con_la_cifra_del_rasgo` de la API.
 */
function conLaCifraDelRasgo(racial: RacialDetalle): RacialDetalle {
    const valor = `${racial.Valor ?? ''}`.trim();
    const cantidad = Number(valor);
    if (!CIFRA_ENTERA.test(valor) || cantidad === 0 || !(racial.Bonificadores_condicionales ?? []).some(b => b.Cantidad_del_valor))
        return racial;
    const conSigno = (n: number) => `${n > 0 ? '+' : ''}${n}`;
    return {
        ...racial,
        Bonificadores_condicionales: (racial.Bonificadores_condicionales ?? []).map(b => !b.Cantidad_del_valor ? b : {
            ...b,
            Cantidad: cantidad,
            Frase: `${b.Frase ?? ''}`.replace(` ${conSigno(Number(b.Cantidad))}`, ` ${conSigno(cantidad)}`),
        }),
    };
}

/** La velocidad que cuenta: la que tiene o, si es menor, la que da la progresión. */
export function velocidadConProgresion(
    actual: number | null | undefined,
    tipo: TipoVelocidadProgresion,
    velocidades: ResultadoProgresionRacial['velocidades'],
): number {
    return Math.max(Number(actual) || 0, Number(velocidades[tipo]?.Pies) || 0);
}

/**
 * El id de la maniobrabilidad con la que vuela el personaje: la del vuelo que le da la progresión de un rasgo
 * (`Personaje.Maniobrabilidad`: las alas de la prole de Bahamut a 6 DG) o, si no, la de su raza; 0 si ninguna. La usan la
 * creación al montar su contexto y `PersonajeService` al guardar.
 */
export function idManiobrabilidadDelPersonaje(personaje: Personaje | null | undefined): number {
    return toPositiveInt(personaje?.Maniobrabilidad?.Id) ?? toPositiveInt((personaje as any)?.Raza?.Maniobrabilidad?.Id) ?? 0;
}

/**
 * Las frases que escribe la API en una lista de un rasgo (su `Progresion`, sus `Bonificadores_condicionales`), para su
 * detalle; `null` si no hay ninguna.
 */
export function frasesDeRasgo(filas: ReadonlyArray<{ Frase?: string | null; } | null | undefined> | null | undefined): string[] | null {
    const frases = (filas ?? []).map((fila) => `${fila?.Frase ?? ''}`.trim()).filter((frase) => frase.length > 0);
    return frases.length > 0 ? frases : null;
}

/** Las frases de lo que da o cambia un rasgo a N DG o a nivel N, para su detalle; `null` si nada. */
export function frasesProgresionRacial(racial: RacialDetalle | null | undefined): string[] | null {
    return frasesDeRasgo(racial?.Progresion);
}

/**
 * La CD de un rasgo, en frase para su detalle: «10 + ½ de sus DG raciales + su modificador de Constitución» (MM, pág.
 * 300) o, si la cuenta con todos sus DG (`Cd_dg_totales`), «10 + ½ de todos sus DG + …» (el aliento del aspecto dracónico
 * del corazón). `null` si el rasgo no tiene CD.
 */
export function textoCdRacial(racial: Pick<RacialDetalle, 'Caracteristica_cd' | 'Cd_dg_totales'> | null | undefined): string | null {
    const caracteristica = `${racial?.Caracteristica_cd?.Nombre ?? ''}`.trim();
    if (!caracteristica)
        return null;
    const dg = racial?.Cd_dg_totales ? 'todos sus DG' : 'sus DG raciales';
    return `10 + ½ de ${dg} + su modificador de ${caracteristica}`;
}
