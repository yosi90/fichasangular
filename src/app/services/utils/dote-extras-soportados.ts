import { Dote } from 'src/app/interfaces/dote';
import { familiaDeExtraDeCriatura } from './dote-extras-de-criatura';
import { toBoolean } from './normalizacion';

/*
 * Si una dote admite extra y de qué familia, por sus banderas `Extras_soportados` (contrato: `docs/publica/endpoints/
 * catalogos.md`): arma, armadura (armaduras, escudos o las dos; sin las dos banderas nuevas, `Extra_armadura`), escuela,
 * habilidad, chakra y fusión (Magic of Incarnum) y las de criatura (`familiaDeExtraDeCriatura`). Un solo sitio para la
 * creación, el formulario de dotes y los detalles.
 */

type DoteConExtras = Pick<Dote, 'Extras_soportados'> | null | undefined;

/** Si la dote se elige con una armadura (no un escudo). */
export function doteSoportaArmaduras(dote: DoteConExtras): boolean {
    return toBoolean(dote?.Extras_soportados?.Extra_armadura_armaduras ?? dote?.Extras_soportados?.Extra_armadura);
}

/** Si la dote se elige con un escudo. */
export function doteSoportaEscudos(dote: DoteConExtras): boolean {
    return toBoolean(dote?.Extras_soportados?.Extra_armadura_escudos ?? dote?.Extras_soportados?.Extra_armadura);
}

/**
 * Si la dote admite algún extra. `incarnum: false` deja fuera el chakra y la fusión: el formulario de dotes no los ofrece
 * en el extra de una dote pedida como prerrequisito (no carga esos catálogos), así que esa dote se pide sin extra.
 */
export function doteAdmiteExtra(dote: DoteConExtras, { incarnum = true }: { incarnum?: boolean; } = {}): boolean {
    const soportados = dote?.Extras_soportados;
    return toBoolean(soportados?.Extra_arma)
        || doteSoportaArmaduras(dote)
        || doteSoportaEscudos(dote)
        || toBoolean(soportados?.Extra_escuela)
        || toBoolean(soportados?.Extra_habilidad)
        || (incarnum && (toBoolean(soportados?.Extra_chakra) || toBoolean(soportados?.Extra_fusion)))
        || familiaDeExtraDeCriatura(dote as Dote) !== null;
}

/** Las armaduras o los escudos de la lista que admite la dote (las dos cosas, solo escudos, solo armaduras o nada). */
export function armadurasQueAdmiteLaDote<T>(dote: DoteConExtras, extras: readonly T[], esEscudo: (extra: T) => boolean): T[] {
    const armaduras = doteSoportaArmaduras(dote);
    const escudos = doteSoportaEscudos(dote);
    if (armaduras && escudos)
        return [...extras];
    if (escudos)
        return extras.filter((extra) => esEscudo(extra));
    if (armaduras)
        return extras.filter((extra) => !esEscudo(extra));
    return [];
}
