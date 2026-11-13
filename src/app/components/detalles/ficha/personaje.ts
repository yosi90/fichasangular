import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { CaracteristicaPerdidaKey, Personaje } from 'src/app/interfaces/personaje';
import { NOMBRES_CARACTERISTICAS, abreviaturaCaracteristica, caracteristicasPerdidasDe } from 'src/app/services/utils/caracteristicas';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';
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
    return caracteristicasPerdidasDe(pj)[key];
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

/**
 * Una clase con su nivel: «Guerrero 5»; con los DG de su tabla si no son su nivel (`Dgs` de la ficha de la API: las clases
 * de monstruo de *Libris Mortis*), «Engendro vampírico 5 (3 DG)».
 */
export function textoClasePersonaje(clase: { Nombre: string; Nivel: number; Dgs?: number | null; Ex?: { Nombre: string; } | null; }): string {
    const nivel = toNumber(clase.Nivel);
    const dgs = clase.Dgs === undefined || clase.Dgs === null ? nivel : toNumber(clase.Dgs);
    // Una ex clase, con su nombre en minúscula: «Paladín 6 (ex paladín)» (MJ, «Ex paladines»).
    const ex = `${clase.Ex?.Nombre ?? ''}`.trim();
    return `${clase.Nombre.trim()} ${nivel}${dgs !== nivel ? ` (${dgs} DG)` : ''}${ex ? ` (${ex.toLowerCase()})` : ''}`;
}

/**
 * Lo que dice la ficha de una ex clase: «Ex paladín: no puede subir niveles de paladín (requiere legal bueno). Ha perdido
 * sus aptitudes y su magia; los recupera con una expiación.»
 */
export function textoExClasePersonaje(clase: { Nombre: string; Ex?: { Nombre: string; Motivos: string[]; Pierde_magia: boolean; Requiere_expiacion: boolean; Sin_vuelta?: boolean; } | null; }): string {
    const ex = clase.Ex;
    if (!ex)
        return '';
    const motivos = ex.Motivos.map((m) => m.charAt(0).toLowerCase() + m.slice(1)).join('; ');
    // Con su magia pierde también los niveles de lanzador que sume a otra clase (el ex hospitalario: la ficha de la API ya
    // no los cuenta en el nivel de lanzador de esa clase).
    const pierde = ex.Pierde_magia
        ? 'Pierde las aptitudes que dice su clase y su magia, también los niveles de lanzador que sume a otra clase'
        : 'Pierde las aptitudes que dice su clase, si alguna';
    const vuelta = ex.Sin_vuelta ? '; no las recupera nunca' : ex.Requiere_expiacion ? '; las recupera con una expiación' : '';
    return `${ex.Nombre}: no puede subir niveles de ${clase.Nombre.trim().toLowerCase()}${motivos ? ` (${motivos})` : ''}. ${pierde}${vuelta}.`;
}

/** Las dotes que se ven, con su extra: «Soltura con un arma (espada larga)». */
export function dotesVisiblesPersonaje(pj: Personaje | null | undefined): { texto: string; ref: DoteLegacy; }[] {
    return (pj?.Dotes ?? [])
        .filter((d) => esVisibleEnPersonaje(d?.Nombre))
        .map((d) => ({ texto: d.Nombre.trim() + (esVisibleEnPersonaje(d.Extra) ? ` (${d.Extra.trim()})` : ''), ref: d }));
}
