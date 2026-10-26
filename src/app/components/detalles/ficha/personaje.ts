import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { CaracteristicaPerdidaKey, Personaje } from 'src/app/interfaces/personaje';
import { NOMBRES_CARACTERISTICAS, abreviaturaCaracteristica } from 'src/app/services/utils/caracteristicas';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toBoolean, toNumber } from 'src/app/services/utils/normalizacion';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { CasillaFicha } from './ficha';

/*
 * Lo que enseñan igual la ficha del personaje (`detalles-personaje`) y la creación (su cabecera y el panel «Tu
 * personaje»): las casillas de las características, cada clase con su nivel y el nombre de una dote con su extra.
 */

/** En la ficha de un personaje, «Cualquiera» tampoco es una elección real y se oculta. */
export function esVisibleEnPersonaje(texto: string | null | undefined): boolean {
    return tieneTextoVisible(texto, { cualquieraEsRelleno: true });
}

/** Sin generar (todas a 10 y sus modificadores a 0), las características no se enseñan. */
export function tieneCaracteristicasGeneradas(pj: Personaje | null | undefined): boolean {
    const base = [pj?.Fuerza, pj?.Destreza, pj?.Constitucion, pj?.Inteligencia, pj?.Sabiduria, pj?.Carisma];
    const mods = [pj?.ModFuerza, pj?.ModDestreza, pj?.ModConstitucion, pj?.ModInteligencia, pj?.ModSabiduria, pj?.ModCarisma];
    return !(base.every((v) => Number(v) === 10) && mods.every((v) => Number(v) === 0));
}

/** Si ha perdido la característica (los muertos vivientes, la Constitución). */
export function caracteristicaPerdida(pj: Personaje | null | undefined, key: CaracteristicaPerdidaKey): boolean {
    const perdidas = pj?.Caracteristicas_perdidas ?? {};
    const perdidaPorMapa = toBoolean((perdidas as Record<string, any>)?.[key]);
    if (key === 'Constitucion')
        return perdidaPorMapa || toBoolean(pj?.Constitucion_perdida);
    return perdidaPorMapa;
}

/** Las casillas de las seis características («FUE 16 +3», o «—» con «Perdida»); ninguna si aún no están generadas. */
export function casillasCaracteristicasPersonaje(pj: Personaje | null | undefined): CasillaFicha[] {
    if (!pj || !tieneCaracteristicasGeneradas(pj))
        return [];
    return CARACTERISTICAS.map((clave: Caracteristica) => {
        const nombre = NOMBRES_CARACTERISTICAS[clave];
        if (caracteristicaPerdida(pj, clave))
            return { abreviatura: abreviaturaCaracteristica(clave), nombre, valor: '—', detalle: 'Perdida', aviso: true, texto: `${nombre} perdida` };
        const valor = toNumber((pj as any)[clave]);
        const modificador = textoConSigno(toNumber((pj as any)[`Mod${clave}`]));
        return { abreviatura: abreviaturaCaracteristica(clave), nombre, valor: `${valor}`, modificador, texto: `${nombre} ${valor} (${modificador})` };
    });
}

/** Una clase con su nivel: «Guerrero 5». */
export function textoClasePersonaje(clase: { Nombre: string; Nivel: number; }): string {
    return `${clase.Nombre.trim()} ${toNumber(clase.Nivel)}`;
}

/** Las dotes que se ven, con su extra: «Soltura con un arma (espada larga)». */
export function dotesVisiblesPersonaje(pj: Personaje | null | undefined): { texto: string; ref: DoteLegacy; }[] {
    return (pj?.Dotes ?? [])
        .filter((d) => esVisibleEnPersonaje(d?.Nombre))
        .map((d) => ({ texto: d.Nombre.trim() + (esVisibleEnPersonaje(d.Extra) ? ` (${d.Extra.trim()})` : ''), ref: d }));
}
