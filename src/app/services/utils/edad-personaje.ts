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
 * - Pasada la edad venerable, el personaje sigue siendo venerable hasta su edad máxima, que el DM tira en secreto (la
 *   columna «Edad máxima» de la tabla 6-5): no sale del manual.
 * - Una raza sin esas edades (0) no tiene etapas: ni se comprueba la edad ni envejece.
 */

export interface EdadesRaza {
    Edad_adulto?: number | null;
    Edad_mediana?: number | null;
    Edad_viejo?: number | null;
    Edad_venerable?: number | null;
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

/** Si la edad sale de lo que da el manual: solo por debajo de la mayoría de edad de la raza. */
export function edadFueraDelManual(edad: unknown, raza: EdadesRaza | null | undefined): boolean {
    return etapaEdad(edad, raza)?.id === 'joven';
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
