import { Caracteristica } from 'src/app/interfaces/caracteristica';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';

/**
 * La edad del personaje y su envejecimiento (Manual del jugador, cap. 6, «Edad», tablas 6-4 y 6-5, pág. 109), con las
 * edades de su raza (`Edad_adulto`, `Edad_mediana`, `Edad_viejo`, `Edad_venerable`):
 *
 * - Antes de la mayoría de edad, el personaje es joven: fuera de lo que da el manual.
 * - Desde la mediana edad, cada paso resta a las físicas y suma a las mentales, y los pasos se acumulan: mediana edad,
 *   −1 a Fue, Des y Con y +1 a Int, Sab y Car; viejo, −2 y +1 más (−3/+2); venerable, −3 y +1 más (−6/+3).
 * - Ninguna puntuación baja de 1 por envejecer.
 * - Pasada la edad venerable, el personaje sigue siendo venerable hasta su edad máxima, que el DM tira en secreto: la
 *   venerable más los dados de la columna «Edad máxima» de la tabla 6-5 (`Edad_maxima_dados` y `Edad_maxima_caras`: el
 *   humano, +2d20). Una edad mayor que la más alta que pueden dar esos dados (venerable + dados × caras) sale del manual;
 *   sin esos dados en la raza, no hay tope.
 * - La edad inicial (tabla 6-4) es la mayoría de edad más unos dados que dependen de la clase del primer nivel: la
 *   tabla agrupa las clases en tres columnas (`Grupo_edad_inicial` de la clase: 1, como el bárbaro; 2, como el guerrero;
 *   3, como el mago) y la raza da los dados de cada una (`Edad_inicial_dados_N` y `Edad_inicial_caras_N`). Cada dado da 1
 *   como mínimo: por debajo de la mayoría de edad más el número de dados, la edad sale del manual. Sin el grupo de la
 *   clase o los dados de la raza, solo se comprueba la mayoría de edad.
 * - Una raza sin esas edades (0) no tiene etapas: ni se comprueba la edad ni envejece.
 * - Una raza que crece por categorías de edad (los dragones, `Categorias_edad`) tampoco: su edad es su categoría, que se
 *   elige con la raza, y no envejece así (análisis de los dragones jugables, §1.4).
 */

export interface EdadesRaza {
    Edad_adulto?: number | null;
    Edad_mediana?: number | null;
    Edad_viejo?: number | null;
    Edad_venerable?: number | null;
    /** Los dados de su edad máxima, que se suman a la venerable (tabla 6-5: +2d20, 2 y 20); 0 y 0, sin dato. */
    Edad_maxima_dados?: number | null;
    Edad_maxima_caras?: number | null;
    /** Los dados de la edad inicial de cada grupo de clases (tabla 6-4: el humano en el 1, +1d4); 0 y 0, sin dato. */
    Edad_inicial_dados_1?: number | null;
    Edad_inicial_caras_1?: number | null;
    Edad_inicial_dados_2?: number | null;
    Edad_inicial_caras_2?: number | null;
    Edad_inicial_dados_3?: number | null;
    Edad_inicial_caras_3?: number | null;
    /** Las categorías de edad de una raza que crece por edades: si las tiene, no usa las del Manual del jugador. */
    Categorias_edad?: unknown[] | null;
}

export type EtapaEdadId = 'joven' | 'adulto' | 'mediana' | 'viejo' | 'venerable';

export interface EtapaEdad {
    id: EtapaEdadId;
    nombre: string;
    /** Los pasos de envejecimiento: 0 (joven o adulto) a 3 (venerable). */
    pasos: number;
    /** Lo que suma a Fuerza, Destreza y Constitución (0, −1, −3 o −6). */
    fisico: number;
    /** Lo que suma a Inteligencia, Sabiduría y Carisma (0 a +3). */
    mental: number;
}

export const CARACTERISTICAS_FISICAS: readonly Caracteristica[] = ['Fuerza', 'Destreza', 'Constitucion'];
export const CARACTERISTICAS_MENTALES: readonly Caracteristica[] = ['Inteligencia', 'Sabiduria', 'Carisma'];

/** Lo que resta y suma cada paso de envejecimiento (tabla 6-5): mediana edad, viejo, venerable. */
const PASOS_ENVEJECIMIENTO: ReadonlyArray<{ fisico: number; mental: number; }> = [
    { fisico: -1, mental: 1 },
    { fisico: -2, mental: 1 },
    { fisico: -3, mental: 1 },
];

const NOMBRES: Record<EtapaEdadId, string> = {
    joven: 'Joven',
    adulto: 'Adulto',
    mediana: 'Mediana edad',
    viejo: 'Viejo',
    venerable: 'Venerable',
};

/** Si la raza trae las edades de sus etapas (la mayoría de edad y la venerable, al menos). */
export function razaTieneEdades(raza: EdadesRaza | null | undefined): boolean {
    if ((raza?.Categorias_edad?.length ?? 0) > 0)
        return false;
    return toNumber(raza?.Edad_adulto) > 0 && toNumber(raza?.Edad_venerable) > 0;
}

/** Las cuatro edades de la raza, en orden y con su nombre corto («Adulto», «Mediana», «Viejo», «Venerable»), para enseñarlas. */
export function edadesDeLaRaza(raza: EdadesRaza | null | undefined): Array<{ nombre: string; valor: number; }> {
    return [
        { nombre: 'Adulto', valor: toNumber(raza?.Edad_adulto) },
        { nombre: 'Mediana', valor: toNumber(raza?.Edad_mediana) },
        { nombre: 'Viejo', valor: toNumber(raza?.Edad_viejo) },
        { nombre: 'Venerable', valor: toNumber(raza?.Edad_venerable) },
    ];
}

/** La etapa de la vida de un personaje de esa edad, o `null` si no hay edad o la raza no trae sus edades. */
export function etapaEdad(edad: unknown, raza: EdadesRaza | null | undefined): EtapaEdad | null {
    const anios = toNumber(edad);
    if (anios <= 0 || !raza || !razaTieneEdades(raza))
        return null;
    if (anios < toNumber(raza.Edad_adulto))
        return crearEtapa('joven', 0);

    const umbrales = [raza.Edad_mediana, raza.Edad_viejo, raza.Edad_venerable].map((valor) => toNumber(valor));
    let pasos = 0;
    umbrales.forEach((umbral, indice) => {
        if (umbral > 0 && anios >= umbral)
            pasos = indice + 1;
    });
    return crearEtapa((['adulto', 'mediana', 'viejo', 'venerable'] as const)[pasos], pasos);
}

/** «+2d20» o «+4d%» (las caras 100 son el dado de porcentaje); `''` sin dados. */
function textoDados(dados: number, caras: number): string {
    if (dados <= 0 || caras <= 0)
        return '';
    return `+${dados}d${caras === 100 ? '%' : caras}`;
}

/** «+2d20» o «+4d%» (las caras 100 son el dado de porcentaje): los dados de la edad máxima; `''` sin dato. */
export function textoDadosEdadMaxima(raza: EdadesRaza | null | undefined): string {
    return textoDados(toNumber(raza?.Edad_maxima_dados), toNumber(raza?.Edad_maxima_caras));
}

/** Los grupos de clases de la tabla 6-4. */
export const GRUPOS_EDAD_INICIAL = [1, 2, 3] as const;
export type GrupoEdadInicial = typeof GRUPOS_EDAD_INICIAL[number];

/** Los dados de la edad inicial de la raza para ese grupo de clases, o `null` sin dato (o sin grupo: 0). */
export function dadosEdadInicial(raza: EdadesRaza | null | undefined, grupo: unknown): { dados: number; caras: number; } | null {
    const numero = toNumber(grupo);
    if (!raza || !razaTieneEdades(raza) || !(GRUPOS_EDAD_INICIAL as readonly number[]).includes(numero))
        return null;
    const fila = raza as Record<string, unknown>;
    const dados = toNumber(fila[`Edad_inicial_dados_${numero}`]);
    const caras = toNumber(fila[`Edad_inicial_caras_${numero}`]);
    return dados > 0 && caras > 0 ? { dados, caras } : null;
}

/** «+1d4»: los dados de la edad inicial de ese grupo; `''` sin dato. */
export function textoDadosEdadInicial(raza: EdadesRaza | null | undefined, grupo: unknown): string {
    const dados = dadosEdadInicial(raza, grupo);
    return dados ? textoDados(dados.dados, dados.caras) : '';
}

/** La edad inicial más baja con una clase de ese grupo: la mayoría de edad más un 1 por dado (el humano guerrero, 16). */
export function edadMinimaInicial(raza: EdadesRaza | null | undefined, grupo: unknown): number | null {
    const dados = dadosEdadInicial(raza, grupo);
    return dados ? toNumber(raza?.Edad_adulto) + dados.dados : null;
}

/** Si la edad no llega a la edad inicial más baja de ese grupo de clases (sin dato, no se comprueba). */
export function edadPorDebajoDeLaInicial(edad: unknown, raza: EdadesRaza | null | undefined, grupo: unknown): boolean {
    const minima = edadMinimaInicial(raza, grupo);
    return minima !== null && toNumber(edad) > 0 && toNumber(edad) < minima;
}

/**
 * «Edad por debajo de la edad inicial de guerrero: 15 (adulto a los 15, +1d6: al menos 16).», el motivo de homebrew de
 * una edad que no llega a la inicial de la clase del primer nivel; `''` si llega o no hay dato.
 */
export function motivoEdadInicial(edad: unknown, raza: EdadesRaza | null | undefined, grupo: unknown, clase = 'su clase'): string {
    if (!edadPorDebajoDeLaInicial(edad, raza, grupo))
        return '';
    return `Edad por debajo de la edad inicial de ${clase}: ${toNumber(edad)} (adulto a los ${toNumber(raza?.Edad_adulto)}, `
        + `${textoDadosEdadInicial(raza, grupo)}: al menos ${edadMinimaInicial(raza, grupo)}).`;
}

/**
 * Una edad inicial al azar para ese grupo de clases (tabla 6-4: la mayoría de edad más sus dados), con `tirada(caras)`
 * para cada dado (de 1 a caras); `null` sin dato.
 */
export function tirarEdadInicial(
    raza: EdadesRaza | null | undefined,
    grupo: unknown,
    tirada: (caras: number) => number = (caras) => 1 + Math.floor(Math.random() * caras),
): number | null {
    const dados = dadosEdadInicial(raza, grupo);
    if (!dados)
        return null;
    let total = toNumber(raza?.Edad_adulto);
    for (let i = 0; i < dados.dados; i++)
        total += Math.min(dados.caras, Math.max(1, Math.trunc(tirada(dados.caras))));
    return total;
}

/**
 * La edad con la que empieza la creación: la más baja que vale para cualquier clase (la mayoría de edad más los dados del
 * grupo que más tira; el humano, 15 + 2 = 17). Sin los dados de la edad inicial, la mayoría de edad.
 */
export function edadPorDefecto(raza: EdadesRaza | null | undefined): number {
    const minimas = GRUPOS_EDAD_INICIAL.map((grupo) => edadMinimaInicial(raza, grupo)).filter((edad): edad is number => edad !== null);
    return minimas.length > 0 ? Math.max(...minimas) : toNumber(raza?.Edad_adulto);
}

/**
 * La edad más alta a la que puede llegar alguien de la raza: la venerable más lo máximo que dan los dados de su edad
 * máxima (el humano, 70 + 2 × 20 = 110). `null` si la raza no trae sus edades o esos dados.
 */
export function edadMaximaDeLaRaza(raza: EdadesRaza | null | undefined): number | null {
    if (!raza || !razaTieneEdades(raza) || textoDadosEdadMaxima(raza).length < 1)
        return null;
    return toNumber(raza.Edad_venerable) + toNumber(raza.Edad_maxima_dados) * toNumber(raza.Edad_maxima_caras);
}

/** «venerable +2d20: como mucho 110 años», la edad máxima de la raza para enseñarla; `''` si no la trae. */
export function textoEdadMaxima(raza: EdadesRaza | null | undefined): string {
    const maxima = edadMaximaDeLaRaza(raza);
    return maxima === null ? '' : `venerable ${textoDadosEdadMaxima(raza)}: como mucho ${maxima} años`;
}

/** Si la edad pasa de la más alta que da el manual para la raza (`edadMaximaDeLaRaza`). */
export function edadPasaDeLaMaxima(edad: unknown, raza: EdadesRaza | null | undefined): boolean {
    const maxima = edadMaximaDeLaRaza(raza);
    return maxima !== null && toNumber(edad) > maxima;
}

/**
 * Si la edad sale de lo que da el manual: por debajo de la mayoría de edad de la raza, por debajo de la edad inicial de
 * la clase del primer nivel (`grupo`, su `Grupo_edad_inicial`; tabla 6-4) o por encima de su edad máxima (venerable + los
 * dados de la tabla 6-5). Una raza sin esos dados no tiene tope por arriba.
 */
export function edadFueraDelManual(edad: unknown, raza: EdadesRaza | null | undefined, grupo?: unknown): boolean {
    return etapaEdad(edad, raza)?.id === 'joven' || edadPorDebajoDeLaInicial(edad, raza, grupo) || edadPasaDeLaMaxima(edad, raza);
}

/**
 * Por qué la edad sale del manual, para el aviso de homebrew: «Edad por debajo de la mayoría de edad de la raza: 12
 * (adulto a los 15).» o «Edad por encima de la edad máxima de la raza: 120 (venerable a los 70, +2d20: como mucho
 * 110).»; `''` si no sale.
 */
export function motivoEdadFueraDelManual(edad: unknown, raza: EdadesRaza | null | undefined, grupo?: unknown, clase?: string): string {
    if (etapaEdad(edad, raza)?.id === 'joven')
        return `Edad por debajo de la mayoría de edad de la raza: ${toNumber(edad)} (adulto a los ${toNumber(raza?.Edad_adulto)}).`;
    const inicial = motivoEdadInicial(edad, raza, grupo, clase);
    if (inicial)
        return inicial;
    if (edadPasaDeLaMaxima(edad, raza))
        return `Edad por encima de la edad máxima de la raza: ${toNumber(edad)} (venerable a los ${toNumber(raza?.Edad_venerable)}, `
            + `${textoDadosEdadMaxima(raza)}: como mucho ${edadMaximaDeLaRaza(raza)}).`;
    return '';
}

/** «−1 a Fue, Des y Con; +1 a Int, Sab y Car», o `''` si la etapa no envejece. */
export function textoEnvejecimiento(etapa: EtapaEdad | null | undefined): string {
    if (!etapa || etapa.pasos < 1)
        return '';
    return `${textoConSigno(etapa.fisico, '−')} a Fue, Des y Con; ${textoConSigno(etapa.mental, '−')} a Int, Sab y Car`;
}

/**
 * Lo que el envejecimiento suma a cada característica, sin bajar ninguna de 1: `valores` son las puntuaciones antes de
 * envejecer. Una característica perdida (el no muerto sin Constitución) o sin puntuación no se toca.
 */
export function ajustesEnvejecimiento(
    etapa: EtapaEdad | null | undefined,
    valores: Partial<Record<Caracteristica, number>>,
    perdida: (clave: Caracteristica) => boolean = () => false,
): Array<{ clave: Caracteristica; valor: number; }> {
    if (!etapa || etapa.pasos < 1)
        return [];
    const ajustes: Array<{ clave: Caracteristica; valor: number; }> = [];
    CARACTERISTICAS_FISICAS.forEach((clave) => {
        const actual = toNumber(valores[clave]);
        if (perdida(clave) || actual < 1)
            return;
        const valor = Math.max(etapa.fisico, 1 - actual);
        if (valor !== 0)
            ajustes.push({ clave, valor });
    });
    CARACTERISTICAS_MENTALES.forEach((clave) => {
        if (!perdida(clave) && toNumber(valores[clave]) >= 1)
            ajustes.push({ clave, valor: etapa.mental });
    });
    return ajustes;
}

function crearEtapa(id: EtapaEdadId, pasos: number): EtapaEdad {
    const acumulado = PASOS_ENVEJECIMIENTO.slice(0, pasos);
    return {
        id,
        nombre: NOMBRES[id],
        pasos,
        fisico: acumulado.reduce((acc, paso) => acc + paso.fisico, 0),
        mental: acumulado.reduce((acc, paso) => acc + paso.mental, 0),
    };
}
