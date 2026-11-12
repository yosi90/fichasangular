import { HabilidadBonoVario } from 'src/app/interfaces/habilidad';
import { PersonajeBonificadorCondicional } from 'src/app/interfaces/personaje';
import { RacialBonificadorCondicional, RacialDetalle } from 'src/app/interfaces/racial';
import { normalizarTexto, toNullableText, toNumber, toRefIdNombre } from 'src/app/services/utils/normalizacion';
import { normalizarContraBonificador } from 'src/app/services/utils/racial-mapper';
import { frasesDeRasgo } from 'src/app/services/utils/racial-progresion';

/*
 * Las habilidades y los bonificadores condicionales de los rasgos raciales del personaje (roadmap
 * `ACTIVO_razas-mutadas`, guía `docs/publica/RAZAS_MUTADAS.md`, «Los bonificadores condicionales y las habilidades de un
 * rasgo»). La misma regla que la ficha de la API (`utils/racial_bonificadores.py`), con los mismos casos en sus pruebas:
 *
 * - la `Cantidad` (`Rangos`) de las habilidades de un rasgo se suma como la de las habilidades de la raza: las que cuentan
 *   siempre (`Condicion` `null`) a los rangos varios, con el nombre del rasgo; las demás, aparte y sin sumar;
 * - todas son bonificadores raciales y los del mismo tipo no se apilan (Manual del jugador, «Bonificadores»): entre lo que
 *   da la raza a una habilidad (sumado como siempre) y lo que dan sus rasgos (el mayor), cuenta lo mayor; los
 *   penalizadores, todos;
 * - los `Bonificadores_condicionales` de un rasgo (el +1 al ataque contra orcos y trasgoides) se enseñan aparte y no se
 *   suman a ninguna cifra; los de siempre (sin `Condicion`, solo a la CA: la esquiva +4 del svirfneblin), sí, a la CA con
 *   su tipo (`caDeSiempreDeRaciales`; en la ficha, la `defensa` de la API).
 */

/** Una habilidad con cantidad de un rasgo: de qué rasgo, la referencia tal como llega, si es personalizada y su condición. */
export interface HabilidadDeRasgo {
    origen: string;
    ref: Record<string, any>;
    custom: boolean;
    cantidad: number;
    /** `null` si cuenta siempre. */
    condicion: string | null;
}

/** Los rasgos que tiene el personaje (con su progresión) sin repetir uno (por `Id`). */
function unaVezPorRasgo(raciales: RacialDetalle[] | null | undefined): RacialDetalle[] {
    const vistos = new Set<number>();
    return (raciales ?? []).filter((racial) => !!racial && !vistos.has(Number(racial.Id)) && !!vistos.add(Number(racial.Id)));
}

/** Las habilidades con cantidad de los rasgos (los que tiene el personaje, con su progresión), una vez por rasgo. */
export function habilidadesDeRasgos(raciales: RacialDetalle[] | null | undefined): HabilidadDeRasgo[] {
    const salida: HabilidadDeRasgo[] = [];
    unaVezPorRasgo(raciales).forEach((racial) => {
        const origen = `${racial.Nombre ?? ''}`.trim();
        const filas = [
            ...(racial.Habilidades?.Base ?? []).map((ref) => ({ ref, custom: false })),
            ...(racial.Habilidades?.Custom ?? []).map((ref) => ({ ref, custom: true })),
        ];
        filas.forEach(({ ref, custom }) => {
            const cantidad = toNumber(ref?.['Rangos'] ?? ref?.['Cantidad']);
            if (cantidad !== 0)
                salida.push({ origen, ref, custom, cantidad, condicion: custom ? null : toNullableText(ref?.['Condicion']) });
        });
    });
    return salida;
}

/**
 * Los bonos de cada habilidad sin apilar los raciales: entre los positivos de la raza (`racial: 'raza'`, sumados como
 * siempre) y el mayor de los de sus rasgos (`racial: 'rasgo'`), cuentan los que suman más (si empatan, los de la raza);
 * los demás bonos (dotes, aptitudes, plantillas, ventajas) y los penalizadores raciales, todos. No cambia la entrada.
 */
export function sinApilarRaciales<K extends string>(bonos: Record<K, HabilidadBonoVario[]>): Record<K, HabilidadBonoVario[]> {
    const salida = {} as Record<K, HabilidadBonoVario[]>;
    (Object.keys(bonos) as K[]).forEach((clave) => {
        const lista = bonos[clave] ?? [];
        const positivo = (b: HabilidadBonoVario, de: 'raza' | 'rasgo') => b.racial === de && toNumber(b.valor) > 0;
        const deLaRaza = lista.filter((b) => positivo(b, 'raza')).reduce((a, b) => a + toNumber(b.valor), 0);
        const mayor = lista.filter((b) => positivo(b, 'rasgo'))
            .reduce<HabilidadBonoVario | null>((m, b) => (!m || toNumber(b.valor) > toNumber(m.valor) ? b : m), null);
        const ganaElRasgo = !!mayor && toNumber(mayor.valor) > deLaRaza;
        salida[clave] = lista.filter((b) => positivo(b, 'raza') ? !ganaElRasgo : positivo(b, 'rasgo') ? ganaElRasgo && b === mayor : true);
    });
    return salida;
}

/** Si un bonificador de un rasgo cuenta siempre: sin condición. */
export function esBonificadorDeSiempre(b: RacialBonificadorCondicional): boolean {
    return toNullableText(b?.Condicion) === null;
}

/** Una parte de la CA que suman los bonificadores de siempre de los rasgos: de qué rasgo, su tipo y cuánto. */
export interface ParteCaDeRasgo {
    origen: string;
    tipo: string;
    valor: number;
}

/**
 * Lo que suman a la CA los bonificadores de siempre de los rasgos que tiene el personaje (la esquiva +4 del svirfneblin),
 * una vez por rasgo y con la misma regla que la defensa de la API (`personaje_equipo.defensa`): los de un tipo que apila
 * (esquiva, sin tipo), todos; de los demás, el mayor de cada tipo y todos los penalizadores. `esquiva`, lo que es de
 * esquiva: no cuenta desprevenido.
 */
export function caDeSiempreDeRaciales(raciales: RacialDetalle[] | null | undefined): { total: number; esquiva: number; partes: ParteCaDeRasgo[]; } {
    const porTipo = new Map<number, { apila: boolean; filas: (ParteCaDeRasgo & { esquiva: boolean; })[]; }>();
    unaVezPorRasgo(raciales).forEach((racial) => {
        (racial.Bonificadores_condicionales ?? [])
            .filter((b) => esBonificadorDeSiempre(b) && toNumber(b.Cantidad) !== 0)
            .forEach((b) => {
                const id = toNumber(b.Tipo_bonificador?.Id);
                const grupo = porTipo.get(id) ?? { apila: !!b.Tipo_bonificador?.Apila, filas: [] };
                const tipo = `${b.Tipo_bonificador?.Nombre ?? ''}`.trim();
                grupo.filas.push({ origen: `${racial.Nombre ?? ''}`.trim(), tipo, valor: toNumber(b.Cantidad),
                    esquiva: normalizarTexto(tipo) === 'esquiva' });
                porTipo.set(id, grupo);
            });
    });
    const cuentan = [...porTipo.values()].flatMap(({ apila, filas }) => {
        if (apila)
            return filas;
        const mayor = filas.filter((f) => f.valor > 0).reduce<typeof filas[number] | null>((m, f) => (!m || f.valor > m.valor ? f : m), null);
        return [...(mayor ? [mayor] : []), ...filas.filter((f) => f.valor < 0)];
    });
    return {
        total: cuentan.reduce((a, f) => a + f.valor, 0),
        esquiva: cuentan.filter((f) => f.esquiva).reduce((a, f) => a + f.valor, 0),
        partes: cuentan.map(({ origen, tipo, valor }) => ({ origen, tipo, valor })),
    };
}

/**
 * Los bonificadores condicionales de los rasgos que tiene el personaje, como los da la ficha de la API
 * (`bonificadoresCondicionales`): cada uno con su rasgo de origen, una vez por rasgo. Los de siempre no: se suman a la CA.
 */
export function bonificadoresCondicionalesDeRaciales(raciales: RacialDetalle[] | null | undefined): PersonajeBonificadorCondicional[] {
    const salida: PersonajeBonificadorCondicional[] = [];
    unaVezPorRasgo(raciales).forEach((racial) => {
        (racial.Bonificadores_condicionales ?? []).filter((b) => !esBonificadorDeSiempre(b)).forEach((b) => salida.push({
            objetivo: { ...b.Objetivo },
            tipoBonificador: { Id: b.Tipo_bonificador.Id, Nombre: b.Tipo_bonificador.Nombre },
            valor: toNumber(b.Cantidad),
            condicion: b.Condicion ?? '',
            contra: (b.Contra ?? []).map((c) => ({ ...c })),
            origen: `${racial.Nombre ?? ''}`.trim(),
            frase: b.Frase,
        }));
    });
    return salida;
}

/** `bonificadoresCondicionales` de la ficha de la API; los que no traen objetivo o valen 0 no se leen. */
export function leerBonificadoresCondicionales(raw: unknown): PersonajeBonificadorCondicional[] {
    return (Array.isArray(raw) ? raw : [])
        .filter((b: any) => b && typeof b === 'object' && b.objetivo && toNumber(b.valor) !== 0)
        .map((b: any) => ({
            objetivo: toRefIdNombre(b.objetivo) ?? { Id: 0, Nombre: '' },
            tipoBonificador: toRefIdNombre(b.tipoBonificador) ?? { Id: 0, Nombre: '' },
            valor: toNumber(b.valor),
            condicion: `${b.condicion ?? ''}`.trim(),
            contra: normalizarContraBonificador(Array.isArray(b.contra) ? b.contra : []),
            origen: `${b.origen ?? ''}`.trim(),
            frase: `${b.frase ?? ''}`.trim(),
        }));
}

/** Las frases de lo que un rasgo suma solo en un caso, para su detalle (las de la API); `null` si nada. */
export function frasesBonificadoresCondicionales(racial: RacialDetalle | null | undefined): string[] | null {
    return frasesDeRasgo(racial?.Bonificadores_condicionales);
}
