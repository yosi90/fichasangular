import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CausaMascotaPerdida, CosteDeLaMascota, MascotaPerdida, SalvacionMascota, TipoDeMascota } from 'src/app/interfaces/sesiones';
import { TEXTOS_COMPANERO } from './companero-reglas';
import { tirarDado } from './dados';
import { TEXTOS_FAMILIAR } from './familiar-reglas';
import { bajaDeNivel } from './experiencia-nivel';
import { FuenteMascota, fuentesMascota } from './mascota-cupos';
import { toInt } from './normalizacion';
import { totalesPersonaje } from './personaje-totales';

/*
 * La mascota fuera del reciclaje (contrato: `personajes.md`, «La mascota fuera del reciclaje»; dictamen del máster de Rol del
 * 2026-11-22, en el roadmap): perderla (el compañero se libera o muere; el familiar muere o se abandona), obtener otra y
 * devolverle la vida, como eventos de la sesión abierta. Rol no cuenta el tiempo ni tira la salvación: lo confirma quien
 * apunta. Lo que cuesta sale de la aptitud que la da (`Mascota` del nivel de la clase).
 */

/** Los textos de cada mascota en la web: su nombre (el de la creación, `TEXTOS_COMPANERO` y `TEXTOS_FAMILIAR`), con artículo y
 * en mayúscula, y la acción de obtener otra (el compañero se llama; el familiar se obtiene). */
export interface TextosMascotaEnLaSesion {
    que: string;
    queConArticulo: string;
    etiqueta: string;
    obtener: string;
}

function textosDe(que: string, obtener: string): TextosMascotaEnLaSesion {
    return { que, queConArticulo: `el ${que}`, etiqueta: que.charAt(0).toUpperCase() + que.slice(1), obtener };
}

export const TEXTOS_MASCOTA: Record<TipoDeMascota, TextosMascotaEnLaSesion> = {
    companero: textosDe(TEXTOS_COMPANERO.mascota, `Llamar a un ${TEXTOS_COMPANERO.mascota}`),
    familiar: textosDe(TEXTOS_FAMILIAR.mascota, `Obtener un ${TEXTOS_FAMILIAR.mascota}`),
};

/** Las causas de perder cada mascota, con su texto (MJ pág. 35: se libera al compañero; pág. 45: se abandona al familiar). */
export const CAUSAS_DE_PERDER: Record<TipoDeMascota, ReadonlyArray<{ valor: CausaMascotaPerdida; nombre: string; }>> = {
    companero: [{ valor: 'liberacion', nombre: 'Liberarlo' }, { valor: 'muerte', nombre: 'Murió' }],
    familiar: [{ valor: 'abandono', nombre: 'Abandonarlo' }, { valor: 'muerte', nombre: 'Murió' }],
};

/** La mascota de la ficha de ese tipo (activa o inactiva: las dos ocupan el hueco), o `null`. */
export function mascotaDeLaFicha(pj: Personaje | null | undefined, mascota: TipoDeMascota): CompaneroMonstruoDetalle | FamiliarMonstruoDetalle | null {
    return (mascota === 'companero' ? pj?.Companeros?.[0] : pj?.Familiares?.[0]) ?? null;
}

/** El nombre de la mascota de la ficha de ese tipo («Ceniza»; sin él, «el familiar»). */
export function nombrePropioDeLaMascota(pj: Personaje | null | undefined, mascota: TipoDeMascota): string {
    return `${mascotaDeLaFicha(pj, mascota)?.Nombre ?? ''}`.trim() || TEXTOS_MASCOTA[mascota].queConArticulo;
}

/** Las clases del personaje que le dan esa mascota ahora (sin las de una ex clase que perdió la aptitud). */
export function fuentesDeLaMascota(pj: Personaje | null | undefined, clases: Clase[], mascota: TipoDeMascota): FuenteMascota[] {
    return pj ? fuentesMascota(pj, clases, mascota === 'companero' ? 'Otorga_companero' : 'Otorga_familiar') : [];
}

/**
 * Su coste de la sesión: el de la API (`mascotas` de `GET …/sesiones/{numero}`, ya calculado) o, si no llega (una API de
 * antes de la tanda (j)), el de sus fuentes (`costeDeLasFuentes`, la misma regla que `utils/mascota_perdida.coste`).
 */
export function costeDeLaMascotaEnLaSesion(mascotas: readonly CosteDeLaMascota[] | null | undefined, mascota: TipoDeMascota,
    respaldo: () => CosteDeLaMascota): CosteDeLaMascota {
    return (mascotas ?? []).find((m) => m.mascota === mascota) ?? respaldo();
}

/** La CD de la salvación del familiar sin su dato en la aptitud (MJ pág. 45). */
const CD_SIN_DATO = 15;

/**
 * El coste con las fuentes de esa mascota, con la forma de la API, para cuando la sesión no lo trae: los PX de cada clase que
 * se la da por sus niveles, sumados (MJ pág. 44; una vez por clase; el filo aojador, por todos sus niveles, sin el −3), la
 * mitad si supera la salvación, sin bajar de 0, y si con ellos baja de nivel.
 */
export function costeDeLasFuentes(fuentes: readonly FuenteMascota[], mascota: TipoDeMascota, pxAhora: number, tiene: boolean): CosteDeLaMascota {
    const vistas = new Set<number>();
    const tarifaPorClase: CosteDeLaMascota['tarifaPorClase'] = [];
    const cds: number[] = [];
    const pos: number[] = [];
    const horas: number[] = [];
    let espera: string | null = null;
    fuentes.forEach((fuente) => {
        if (vistas.has(fuente.idClase))
            return;
        vistas.add(fuente.idClase);
        const coste = fuente.coste;
        if (!coste)
            return;
        if (coste.pxPerdidaPorNivel !== null && coste.pxPerdidaPorNivel !== undefined) {
            const nivel = Math.max(0, toInt(fuente.nivelActual));
            tarifaPorClase.push({ idClase: fuente.idClase, clase: fuente.nombreClase, nivel, px: toInt(coste.pxPerdidaPorNivel) * nivel });
        }
        if (coste.cdPerdida !== null && coste.cdPerdida !== undefined)
            cds.push(toInt(coste.cdPerdida));
        if (coste.poObtener !== null && coste.poObtener !== undefined)
            pos.push(Number(coste.poObtener));
        if (coste.horasObtener !== null && coste.horasObtener !== undefined)
            horas.push(toInt(coste.horasObtener));
        espera = espera ?? (coste.esperaReemplazo || null);
    });
    const px = Math.max(0, toInt(pxAhora));
    const tarifa = mascota === 'familiar' ? tarifaPorClase.reduce((total, t) => total + t.px, 0) : 0;
    const pxSiFalla = Math.max(0, px - tarifa);
    const pxSiSupera = Math.max(0, px - Math.floor(tarifa / 2));
    return {
        mascota, tiene,
        cd: mascota === 'familiar' ? (cds.length > 0 ? Math.max(...cds) : CD_SIN_DATO) : null,
        pxAntes: px, pxSiFalla, pxSiSupera,
        bajaSiFalla: bajaDeNivel(px, pxSiFalla), bajaSiSupera: bajaDeNivel(px, pxSiSupera),
        poObtener: pos.length > 0 ? Math.max(...pos) : 0,
        horasObtener: horas.length > 0 ? Math.max(...horas) : null,
        esperaReemplazo: espera,
        tarifaPorClase,
    };
}

/** Los PX que le quedan con esa salvación (sin salvación, los de ahora) y si con ellos baja de nivel, de la API. */
export function pxTrasLaSalvacion(coste: CosteDeLaMascota | null, pxAhora: number, salvacion: SalvacionMascota | null): { px: number; baja: boolean; } {
    if (!coste || !salvacion)
        return { px: toInt(pxAhora), baja: false };
    return salvacion === 'superada'
        ? { px: coste.pxSiSupera, baja: coste.bajaSiSupera }
        : { px: coste.pxSiFalla, baja: coste.bajaSiFalla };
}

/** Su Fortaleza total, para la ayuda de «Tirar» (d20 + Fortaleza). */
export function fortalezaDelPersonaje(pj: Personaje | null | undefined): number {
    return toInt(totalesPersonaje(pj)?.salvaciones?.fortaleza?.total);
}

/** La tirada de ayuda: d20 (`tirarDado`, el de la pestaña «Dados») + su Fortaleza contra la CD (la apunta quien juega: Rol no la tira por él). */
export function tirarFortaleza(fortaleza: number, cd: number, d20: number = tirarDado(20)): { d20: number; total: number; salvacion: SalvacionMascota; } {
    const total = toInt(d20) + toInt(fortaleza);
    return { d20: toInt(d20), total, salvacion: total >= toInt(cd) ? 'superada' : 'fallada' };
}

/** Si puede obtener esa mascota ahora: el hueco vacío y alguna clase que se la dé con nivel efectivo de 1 o más. */
export function puedeObtenerLaMascota(pj: Personaje | null | undefined, clases: Clase[], mascota: TipoDeMascota): boolean {
    if (!pj || mascotaDeLaFicha(pj, mascota))
        return false;
    return fuentesDeLaMascota(pj, clases, mascota).reduce((total, fuente) => total + Math.max(0, toInt(fuente.aporta)), 0) > 0;
}

/** La pérdida vigente de esa mascota (`mascotasPerdidas`), o `null`. */
export function perdidaDeLaMascota(perdidas: readonly MascotaPerdida[] | null | undefined, mascota: TipoDeMascota): MascotaPerdida | null {
    return (perdidas ?? []).find((p) => p.mascota === mascota) ?? null;
}

/**
 * La ficha de la subida sin una mascota que no tenía (`antes`): la mascota nueva se obtiene después con `mascota_obtenida`
 * (la API rechaza la subida que la trae: `400 subida_cambio_no_permitido`; hallazgo 1 del máster).
 */
export function sinMascotaNueva(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto): PersonajeCreateRequestDto {
    const { companero, familiar, ...resto } = ficha;
    return {
        ...resto,
        ...(companero && antes.companero ? { companero } : {}),
        ...(familiar && antes.familiar ? { familiar } : {}),
    } as PersonajeCreateRequestDto;
}
