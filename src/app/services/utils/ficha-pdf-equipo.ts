import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeEquipoPiezaDto, PersonajeTotalDto } from 'src/app/interfaces/personajes-api';
import { detallesPiezaEquipo, formatoNumero, nombreConCantidad, textoDestrezaMaxima } from 'src/app/services/utils/equipo-texto';
import { toArray, toNumber } from 'src/app/services/utils/normalizacion';
import { sumarPartes } from 'src/app/services/utils/personaje-totales';

/** Los huecos de la hoja (`assets/pdf/Ficha.pdf`) para el equipo: 5 armas y 27 objetos. */
const ARMAS_EN_HOJA = 5;
const OBJETOS_EN_HOJA = 27;

/** Lo que suma a la CA un tipo de bonificador («Armadura», «Escudo») en el desglose de la defensa. */
function bonificadorCa(ca: PersonajeTotalDto, tipo: string): number {
    return toArray(ca?.desglose)
        .filter((parte) => parte?.tipo === 'bonificador' && `${parte?.bonificador ?? ''}`.toLowerCase() === tipo)
        .reduce((acc, parte) => acc + toNumber(parte?.valor), 0);
}

/** Los detalles de una pieza sin las cifras que la hoja ya tiene en su casilla (daño, crítico, CA…). */
function notasPieza(pieza: PersonajeEquipoPiezaDto, sinPrefijos: string[]): string {
    return detallesPiezaEquipo(pieza)
        .filter((detalle) => !sinPrefijos.some((prefijo) => detalle.startsWith(prefijo)) && !detalle.endsWith(' lb'))
        .concat(pieza.notas ? [pieza.notas] : [])
        .join(', ');
}

/**
 * Los campos de la hoja que salen del equipo de la ficha (`defensa`, `equipo`, `pesoEquipo`, `dinero` y lo que suma el
 * equipo a las salvaciones). Sin defensa ni equipo (el borrador de la creación, las fichas antiguas) no da nada y la hoja
 * se queda como siempre. Lo que la hoja pide y la API aún no calcula (el ataque de cada arma, la velocidad con la
 * armadura) se deja en blanco.
 */
export function camposPdfEquipo(pj: Personaje): Record<string, string> {
    const campos: Record<string, string> = {};
    const defensa = pj?.Defensa;
    if (defensa) {
        campos['ca_toque'] = `${defensa.toque.total}`;
        campos['ca_desprevenido'] = `${defensa.desprevenido.total}`;
        campos['ca_armadura'] = `${bonificadorCa(defensa.ca, 'armadura')}`;
        campos['ca_escudo'] = `${bonificadorCa(defensa.ca, 'escudo')}`;
        campos['fallo_arcano'] = `${defensa.falloConjuroArcano}`;
    }
    const salvaciones = pj?.Totales?.salvaciones;
    if (salvaciones) {
        campos['mod_magico_fortaleza'] = `${sumarPartes(salvaciones.fortaleza, 'equipo')}`;
        campos['mod_magico_reflejos'] = `${sumarPartes(salvaciones.reflejos, 'equipo')}`;
        campos['mod_magico_voluntad'] = `${sumarPartes(salvaciones.voluntad, 'equipo')}`;
    }
    if (pj?.Dinero)
        campos['monedas_oro'] = formatoNumero(pj.Dinero.po);

    const piezas = [...(pj?.Equipo ?? [])];
    if (piezas.length < 1)
        return campos;

    const puesta = (escudo: boolean) => piezas.find((pieza) => pieza.equipado && pieza.armadura?.esEscudo === escudo)
        ?? piezas.find((pieza) => pieza.armadura?.esEscudo === escudo);
    const usadas = new Set<PersonajeEquipoPiezaDto>();
    const armadura = puesta(false);
    if (armadura?.armadura) {
        usadas.add(armadura);
        campos['armadura'] = armadura.nombre;
        campos['mod_armadura'] = `${armadura.armadura.ca}`;
        campos['armadura_max_des'] = textoDestrezaMaxima(armadura.armadura.bonDes);
        campos['armadura_penalizador'] = `${armadura.armadura.penalizador}`;
        campos['armadura_fallo_conj'] = `${armadura.armadura.falloArcano}%`;
        campos['armadura_peso'] = armadura.peso === null ? '' : formatoNumero(armadura.peso);
        campos['armadura_desc'] = notasPieza(armadura, ['CA ', 'Destreza máxima', 'Penalizador', 'Fallo arcano']);
    }
    const escudo = puesta(true);
    if (escudo?.armadura) {
        usadas.add(escudo);
        campos['escudo'] = escudo.nombre;
        campos['mod_escudo'] = `${escudo.armadura.ca}`;
        campos['escudo_penalizador'] = `${escudo.armadura.penalizador}`;
        campos['escudo_fallo_conj'] = `${escudo.armadura.falloArcano}%`;
        campos['escudo_desc'] = notasPieza(escudo, ['CA ', 'Destreza máxima', 'Penalizador', 'Fallo arcano']);
    }

    const armas = piezas
        .filter((pieza) => pieza.tipo === 'arma')
        .sort((a, b) => Number(b.equipado) - Number(a.equipado))
        .slice(0, ARMAS_EN_HOJA);
    armas.forEach((arma, indice) => {
        usadas.add(arma);
        const n = indice + 1;
        campos[`ataque_arma${n}`] = nombreConCantidad(arma);
        campos[`daño_arma${n}`] = arma.arma?.dano ?? '';
        campos[`critico_arma${n}`] = arma.arma?.critico ?? '';
        campos[`notas_arma${n}`] = notasPieza(arma, ['Daño ', 'Crítico ']);
    });

    piezas
        .filter((pieza) => !usadas.has(pieza))
        .slice(0, OBJETOS_EN_HOJA)
        .forEach((pieza, indice) => {
            const n = indice + 1;
            campos[`objeto${n}`] = nombreConCantidad(pieza);
            campos[`loc_objeto${n}`] = pieza.equipado ? (pieza.ranura?.nombre ?? pieza.empunadura?.nombre ?? 'Puesto') : '';
            campos[`peso_objeto${n}`] = pieza.peso === null ? '' : formatoNumero(pieza.peso);
        });
    campos['peso_total'] = formatoNumero(toNumber(pj?.PesoEquipo));
    return campos;
}
