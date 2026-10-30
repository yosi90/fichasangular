import { TipoRol } from './iconos-rol';
import { textoConSigno } from './equipo-texto';
import { enteroEntre } from './normalizacion';

/**
 * Las tiradas sueltas de la pestaña «Dados» (lienzo «Dados: Companion y web», aprobado por el propietario el
 * 2026-10-30): una reserva de dados y un bonificador que se tiran en el navegador, sin la API. Lo mismo que la sección
 * Dados de 3.5 Companion.
 */

/** La línea gris de la pantalla «Dados»: la de su cabecera y la de su resultado en la búsqueda global. */
export const SUBTITULO_DADOS = 'Tiradas sueltas para la mesa';

/** Los dados de la fila, en su orden: d4, d6, d8, d10, d12, d20 y d100. */
export const CARAS_DADOS = [4, 6, 8, 10, 12, 20, 100] as const;
export type CarasDado = typeof CARAS_DADOS[number];

/** Cuántos dados de un tipo se pueden poner y hasta dónde llega el bonificador (en los dos sentidos). */
export const MAXIMO_DADOS_POR_TIPO = 99;
export const MAXIMO_BONIFICADOR = 99;
/** Las tiradas que guarda el historial de la sesión. */
export const MAXIMO_HISTORIAL_DADOS = 50;

export interface DadoFila {
    readonly caras: CarasDado;
    /** «d6», «d100». */
    readonly nombre: string;
    /** El icono del dado; el d100 es el del d10 con un «%» en la esquina. */
    readonly icono: TipoRol;
    readonly porcentaje: boolean;
}

const ICONO_DADO: Readonly<Record<CarasDado, TipoRol>> = {
    4: 'dado-d4', 6: 'dado-d6', 8: 'dado-d8', 10: 'dado-d10', 12: 'dado-d12', 20: 'dado-d20', 100: 'dado-d10',
};

export const DADOS_FILA: readonly DadoFila[] = CARAS_DADOS.map((caras) => ({
    caras, nombre: `d${caras}`, icono: ICONO_DADO[caras], porcentaje: caras === 100,
}));

/** Cuántos dados de cada tipo lleva la tirada (los que no lleva, a 0). */
export type ReservaDados = Readonly<Record<CarasDado, number>>;

export interface TiradaPreparada {
    readonly reserva: ReservaDados;
    readonly bonificador: number;
}

export interface GrupoTirado {
    readonly caras: CarasDado;
    readonly valores: readonly number[];
}

export interface ResultadoTirada {
    /** «2d6 + 1d20 + 3». */
    readonly expresion: string;
    readonly grupos: readonly GrupoTirado[];
    readonly bonificador: number;
    readonly total: number;
    /** El d20 natural, solo si la tirada es de un único d20 (con o sin bonificador): 20 dorado, 1 rojo. */
    readonly natural: number | null;
    readonly fecha: Date;
}

export function reservaVacia(): ReservaDados {
    return { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
}

export const TIRADA_VACIA: TiradaPreparada = { reserva: reservaVacia(), bonificador: 0 };

/** Un dado más (o menos, con `cambio` negativo) de ese tipo, entre 0 y 99. */
export function cambiarDado(tirada: TiradaPreparada, caras: CarasDado, cambio: number): TiradaPreparada {
    const actual = tirada.reserva[caras];
    const nuevo = enteroEntre(actual + cambio, 0, MAXIMO_DADOS_POR_TIPO, actual);
    if (nuevo === actual)
        return tirada;
    return { ...tirada, reserva: { ...tirada.reserva, [caras]: nuevo } };
}

/** El bonificador más `cambio`, entre −99 y +99. */
export function cambiarBonificador(tirada: TiradaPreparada, cambio: number): TiradaPreparada {
    const nuevo = enteroEntre(tirada.bonificador + cambio, -MAXIMO_BONIFICADOR, MAXIMO_BONIFICADOR, tirada.bonificador);
    return nuevo === tirada.bonificador ? tirada : { ...tirada, bonificador: nuevo };
}

export function totalDados(tirada: TiradaPreparada): number {
    return CARAS_DADOS.reduce((suma, caras) => suma + tirada.reserva[caras], 0);
}

export function tieneDados(tirada: TiradaPreparada): boolean {
    return totalDados(tirada) > 0;
}

/** Hay algo que limpiar: algún dado o un bonificador distinto de 0. */
export function tiradaConAlgo(tirada: TiradaPreparada): boolean {
    return tieneDados(tirada) || tirada.bonificador !== 0;
}

/** Un total, con el menos tipográfico si es negativo: «24», «−3». */
export function textoTotal(valor: number): string {
    return valor < 0 ? `−${Math.abs(valor)}` : `${valor}`;
}

/** «2d6 + 1d20 + 3», «3d8 − 1»; sin dados, solo el bonificador («+3»), y sin nada, cadena vacía. */
export function expresionTirada(tirada: TiradaPreparada): string {
    const dados = CARAS_DADOS.filter((caras) => tirada.reserva[caras] > 0).map((caras) => `${tirada.reserva[caras]}d${caras}`).join(' + ');
    if (tirada.bonificador === 0)
        return dados;
    if (!dados)
        return textoConSigno(tirada.bonificador, '−');
    return `${dados} ${tirada.bonificador < 0 ? '−' : '+'} ${Math.abs(tirada.bonificador)}`;
}

/**
 * Lo que salió en cada dado. Con `conDados`, «2d6 [4, 2] · 1d20 [15] · +3» (el último resultado); sin él,
 * «[4, 2] [15] +3» (las filas del historial, que ya llevan la expresión encima).
 */
export function desgloseTirada(resultado: Pick<ResultadoTirada, 'grupos' | 'bonificador'>, conDados: boolean): string {
    const partes = resultado.grupos.map((g) => conDados ? `${g.valores.length}d${g.caras} [${g.valores.join(', ')}]` : `[${g.valores.join(', ')}]`);
    if (resultado.bonificador !== 0)
        partes.push(textoConSigno(resultado.bonificador, '−'));
    return partes.join(conDados ? ' · ' : ' ');
}

/** Rellena el array con números aleatorios de 32 bits; por defecto, `crypto.getRandomValues`. */
export type FuenteAleatoria = (destino: Uint32Array) => void;

export const fuenteCripto: FuenteAleatoria = (destino) => { crypto.getRandomValues(destino); };

const RANGO_32 = 0x1_0000_0000;

/**
 * Un dado de `caras` caras, de 1 a `caras`, sin sesgo: se descartan los valores del último tramo incompleto (rechazo
 * por módulo), así que cada cara sale con la misma probabilidad.
 */
export function tirarDado(caras: number, fuente: FuenteAleatoria = fuenteCripto): number {
    const limite = RANGO_32 - (RANGO_32 % caras);
    const valor = new Uint32Array(1);
    do {
        fuente(valor);
    } while (valor[0] >= limite);
    return (valor[0] % caras) + 1;
}

/** Tira la reserva y suma el bonificador; `null` si no lleva ningún dado. */
export function tirar(tirada: TiradaPreparada, fuente: FuenteAleatoria = fuenteCripto, fecha: Date = new Date()): ResultadoTirada | null {
    if (!tieneDados(tirada))
        return null;
    const grupos: GrupoTirado[] = CARAS_DADOS
        .filter((caras) => tirada.reserva[caras] > 0)
        .map((caras) => ({ caras, valores: Array.from({ length: tirada.reserva[caras] }, () => tirarDado(caras, fuente)) }));
    const suma = grupos.reduce((total, g) => total + g.valores.reduce((s, v) => s + v, 0), 0);
    const unSoloD20 = grupos.length === 1 && grupos[0].caras === 20 && grupos[0].valores.length === 1;
    return {
        expresion: expresionTirada(tirada),
        grupos,
        bonificador: tirada.bonificador,
        total: suma + tirada.bonificador,
        natural: unSoloD20 ? grupos[0].valores[0] : null,
        fecha,
    };
}

/** El resultado al principio del historial, que guarda como mucho las últimas 50. */
export function anadirAlHistorial(historial: readonly ResultadoTirada[], resultado: ResultadoTirada): readonly ResultadoTirada[] {
    return [resultado, ...historial].slice(0, MAXIMO_HISTORIAL_DADOS);
}

/** «11:04», la hora local de la tirada. */
export function horaTirada(fecha: Date): string {
    return `${`${fecha.getHours()}`.padStart(2, '0')}:${`${fecha.getMinutes()}`.padStart(2, '0')}`;
}

/** El nombre accesible del botón de un dado: «Añadir un d6» o «d6, llevas 2». */
export function etiquetaDado(dado: DadoFila, cantidad: number): string {
    return cantidad > 0 ? `${dado.nombre}, llevas ${cantidad}` : `Añadir un ${dado.nombre}`;
}
