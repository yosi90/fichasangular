import { HabilidadBonoVario } from 'src/app/interfaces/habilidad';
import { PersonajeBonificadorCondicional } from 'src/app/interfaces/personaje';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { toNullableText, toNumber } from 'src/app/services/utils/normalizacion';

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
 *   suman a ninguna cifra.
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

/** Las habilidades con cantidad de los rasgos (los que tiene el personaje, con su progresión), una vez por rasgo. */
export function habilidadesDeRasgos(raciales: RacialDetalle[] | null | undefined): HabilidadDeRasgo[] {
    const vistos = new Set<number>();
    const salida: HabilidadDeRasgo[] = [];
    (raciales ?? []).forEach((racial) => {
        if (!racial || vistos.has(Number(racial.Id)))
            return;
        vistos.add(Number(racial.Id));
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

/** Lo que suman a una habilidad los bonificadores raciales de la raza (lo que ya suma) y de sus rasgos (`sinApilarRaciales`). */
export function rangosRacialesQueCuentan(deLaRaza: number, deLosRasgos: number[]): number {
    const raza = toNumber(deLaRaza);
    const rasgos = deLosRasgos.map(toNumber);
    const mayorRasgo = Math.max(0, ...rasgos.filter((v) => v > 0));
    return Math.max(Math.max(raza, 0), mayorRasgo) + Math.min(raza, 0) + rasgos.filter((v) => v < 0).reduce((a, v) => a + v, 0);
}

/**
 * Los bonificadores condicionales de los rasgos que tiene el personaje, como los da la ficha de la API
 * (`bonificadoresCondicionales`): cada uno con su rasgo de origen, una vez por rasgo.
 */
export function bonificadoresCondicionalesDeRaciales(raciales: RacialDetalle[] | null | undefined): PersonajeBonificadorCondicional[] {
    const vistos = new Set<number>();
    const salida: PersonajeBonificadorCondicional[] = [];
    (raciales ?? []).forEach((racial) => {
        if (!racial || vistos.has(Number(racial.Id)))
            return;
        vistos.add(Number(racial.Id));
        (racial.Bonificadores_condicionales ?? []).forEach((b) => salida.push({
            objetivo: { ...b.Objetivo },
            tipoBonificador: { ...b.Tipo_bonificador },
            valor: toNumber(b.Cantidad),
            condicion: b.Condicion,
            contra: (b.Contra ?? []).map((c) => ({ ...c })),
            origen: `${racial.Nombre ?? ''}`.trim(),
            frase: b.Frase,
        }));
    });
    return salida;
}

const CATALOGOS_CONTRA = ['tipo_criatura', 'subtipo', 'raza'];

/** `bonificadoresCondicionales` de la ficha de la API; los que no traen objetivo o valen 0 no se leen. */
export function leerBonificadoresCondicionales(raw: unknown): PersonajeBonificadorCondicional[] {
    return (Array.isArray(raw) ? raw : [])
        .filter((b: any) => b && typeof b === 'object' && b.objetivo && toNumber(b.valor) !== 0)
        .map((b: any) => ({
            objetivo: { Id: toNumber(b.objetivo?.Id), Nombre: `${b.objetivo?.Nombre ?? ''}`.trim() },
            tipoBonificador: { Id: toNumber(b.tipoBonificador?.Id), Nombre: `${b.tipoBonificador?.Nombre ?? ''}`.trim() },
            valor: toNumber(b.valor),
            condicion: `${b.condicion ?? ''}`.trim(),
            contra: (Array.isArray(b.contra) ? b.contra : [])
                .filter((c: any) => CATALOGOS_CONTRA.includes(c?.Catalogo))
                .map((c: any) => ({ Catalogo: c.Catalogo, Id: toNumber(c.Id), Nombre: `${c.Nombre ?? ''}`.trim() })),
            origen: `${b.origen ?? ''}`.trim(),
            frase: `${b.frase ?? ''}`.trim(),
        }));
}

/** Las frases de lo que un rasgo suma solo en un caso, para su detalle (las de la API); `null` si nada. */
export function frasesBonificadoresCondicionales(racial: RacialDetalle | null | undefined): string[] | null {
    const frases = (racial?.Bonificadores_condicionales ?? []).map((b) => `${b?.Frase ?? ''}`.trim()).filter((f) => f.length > 0);
    return frases.length > 0 ? frases : null;
}
