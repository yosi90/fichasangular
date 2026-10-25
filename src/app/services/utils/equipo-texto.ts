import { OrigenDescripcion } from 'src/app/interfaces/equipo';
import { ManualReferencia } from 'src/app/interfaces/manual';

// Cómo enseña la web los datos del equipo (armas, armaduras, munición, materiales, aptitudes, objetos y conjuntos).
// Guía: `docs/publica/OBJETOS_FRONT.md`.

const NUMERO = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

/** Un número con coma decimal y sin ceros de sobra («0,5», «1.500»). */
export function formatoNumero(valor: number): string {
    return NUMERO.format(Number.isFinite(valor) ? valor : 0);
}

/** El precio en po («2 po», «0,5 po»); «—» si no tiene. */
export function textoPrecio(po: number | null | undefined): string {
    return po === null || po === undefined ? '—' : `${formatoNumero(po)} po`;
}

/** El peso en libras («½ lb» se enseña «0,5 lb»); «—» si no tiene. */
export function textoPeso(lb: number | null | undefined): string {
    return lb === null || lb === undefined ? '—' : `${formatoNumero(lb)} lb`;
}

/** La Destreza máxima de una armadura o escudo: «+4», o «Sin límite» con `null`. */
export function textoDestrezaMaxima(bonDes: number | null | undefined): string {
    if (bonDes === null || bonDes === undefined)
        return 'Sin límite';
    return `${bonDes >= 0 ? '+' : ''}${bonDes}`;
}

/** Un bonificador con signo («+2», «-1», «+0»). */
export function textoConSigno(valor: number): string {
    return `${valor >= 0 ? '+' : ''}${valor}`;
}

/** El manual y la página («Manual del jugador 1 (p. 118)»), o «Sin manual». */
export function etiquetaManual(manual: ManualReferencia | null | undefined): string {
    const nombre = `${manual?.Nombre ?? ''}`.trim();
    const pagina = Number(manual?.Pagina ?? 0);
    if (nombre.length < 1)
        return 'Sin manual';
    return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
}

/** Lo que se dice del texto de una entrada: un resumen nuestro o el texto del SRD. */
export function textoOrigenDescripcion(origen: OrigenDescripcion): string {
    return origen === 'srd' ? 'Texto del SRD' : 'Descripción propia';
}

export function ayudaOrigenDescripcion(origen: OrigenDescripcion): string {
    return origen === 'srd'
        ? 'Texto de la licencia abierta (OGL), traducido por nosotros.'
        : 'Resumen escrito por nosotros: el texto completo está en el manual y la página que se indican.';
}

/** La categoría de una armadura o escudo: su peso («Intermedia») o, en los escudos, su tipo («Escudo (pesado)»). */
export function categoriaArmadura(armadura: {
    Es_escudo: boolean;
    Peso_armadura: { Nombre: string } | null;
    Tipo_escudo: { Nombre: string } | null;
} | null | undefined): string {
    if (!armadura)
        return '';
    if (armadura.Es_escudo) {
        const tipo = `${armadura.Tipo_escudo?.Nombre ?? ''}`.trim();
        return tipo.length > 0 ? `Escudo (${tipo.toLowerCase()})` : 'Escudo';
    }
    return `${armadura.Peso_armadura?.Nombre ?? ''}`.trim();
}
