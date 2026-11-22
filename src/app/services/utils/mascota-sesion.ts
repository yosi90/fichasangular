import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CausaMascotaPerdida, MascotaPerdida, SalvacionMascota, TipoDeMascota } from 'src/app/interfaces/sesiones';
import { TEXTOS_COMPANERO } from './companero-reglas';
import { nivelPorExperiencia } from './experiencia-nivel';
import { TEXTOS_FAMILIAR } from './familiar-reglas';
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

/** Lo que cuesta perderla u obtener otra, con las fuentes de ahora (como `utils/mascota_perdida.coste` de la API). */
export interface CosteDeLaMascotaEnLaSesion {
    /** Los PX que pierde el amo: los de cada clase que se la da por sus niveles, sumados (MJ pág. 44). */
    tarifa: number;
    /** La CD de su salvación de Fortaleza (15), o `null` sin dato. */
    cd: number | null;
    /** Las po de obtener otra (el familiar, 100; el compañero, 0). */
    po: number;
    horas: number | null;
    /** La espera para reemplazar al familiar muerto o abandonado («un año y un día»), o `null`. */
    espera: string | null;
}

/** El coste con las fuentes de esa mascota (una vez por clase; el filo aojador, por todos sus niveles, sin el −3). */
export function costeDeLaMascota(fuentes: readonly FuenteMascota[]): CosteDeLaMascotaEnLaSesion {
    const vistas = new Set<number>();
    let tarifa = 0;
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
        if (coste.pxPerdidaPorNivel !== null && coste.pxPerdidaPorNivel !== undefined)
            tarifa += toInt(coste.pxPerdidaPorNivel) * Math.max(0, toInt(fuente.nivelActual));
        if (coste.cdPerdida !== null && coste.cdPerdida !== undefined)
            cds.push(toInt(coste.cdPerdida));
        if (coste.poObtener !== null && coste.poObtener !== undefined)
            pos.push(Number(coste.poObtener));
        if (coste.horasObtener !== null && coste.horasObtener !== undefined)
            horas.push(toInt(coste.horasObtener));
        espera = espera ?? (coste.esperaReemplazo || null);
    });
    return {
        tarifa,
        cd: cds.length > 0 ? Math.max(...cds) : null,
        po: pos.length > 0 ? Math.max(...pos) : 0,
        horas: horas.length > 0 ? Math.max(...horas) : null,
        espera,
    };
}

/** Los PX que le quedan al perder el familiar: la tarifa, la mitad si supera la salvación, sin bajar de 0 (MJ pág. 45). */
export function pxTrasPerderLaMascota(px: number, tarifa: number, salvacion: SalvacionMascota | null): number {
    const perdidos = salvacion === 'superada' ? Math.floor(Math.max(0, tarifa) / 2) : Math.max(0, tarifa);
    return Math.max(0, toInt(px) - perdidos);
}

/** Si perder esos PX le baja del nivel que le dan sus PX (no el NEP): entonces pierde el último nivel que ganó. */
export function leBajaUnNivel(pxAntes: number, pxDespues: number): boolean {
    return nivelPorExperiencia(toInt(pxDespues)) < nivelPorExperiencia(toInt(pxAntes));
}

/** Su Fortaleza total, para la ayuda de «Tirar» (d20 + Fortaleza). */
export function fortalezaDelPersonaje(pj: Personaje | null | undefined): number {
    return toInt(totalesPersonaje(pj)?.salvaciones?.fortaleza?.total);
}

/** La tirada de ayuda: d20 + su Fortaleza contra la CD (la apunta quien juega: Rol no la tira por él). */
export function tirarFortaleza(fortaleza: number, cd: number, d20: number = 1 + Math.floor(Math.random() * 20)): { d20: number; total: number; salvacion: SalvacionMascota; } {
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
 * La ficha sin la mascota y sin lo que daba al amo: la `ficha` (sin el último nivel que ganó, de «Perder un nivel») menos el
 * bloque de la mascota y las dotes y las aptitudes que tenía el motor con ella (`conMascota`) y no sin ella (`sinMascota`):
 * las del amo (vínculo, compartir conjuros…) y, del familiar, sus dotes con origen «Familiar…» (Alerta).
 */
export function fichaSinLaMascota(
    ficha: PersonajeCreateRequestDto,
    conMascota: PersonajeCreateRequestDto,
    sinMascota: PersonajeCreateRequestDto,
    mascota: TipoDeMascota,
): PersonajeCreateRequestDto {
    const claveDote = (d: any) => `${toInt(d?.idDote)}|${toInt(d?.idExtra)}|${`${d?.origen ?? ''}`.trim()}`;
    const claveEspecial = (e: any) => `${toInt(e?.idEspecial)}|${toInt(e?.idExtra)}`;
    const quitadas = (de: readonly any[] | undefined, quedan: readonly any[] | undefined, clave: (x: any) => string) => {
        const siguen = new Map<string, number>();
        (quedan ?? []).forEach((x) => siguen.set(clave(x), (siguen.get(clave(x)) ?? 0) + 1));
        const fuera = new Map<string, number>();
        (de ?? []).forEach((x) => {
            const k = clave(x);
            if ((siguen.get(k) ?? 0) > 0)
                siguen.set(k, (siguen.get(k) ?? 0) - 1);
            else
                fuera.set(k, (fuera.get(k) ?? 0) + 1);
        });
        return fuera;
    };
    const sinLasQuitadas = (lista: readonly any[] | undefined, fuera: Map<string, number>, clave: (x: any) => string) => {
        const quedan = new Map(fuera);
        return (lista ?? []).filter((x) => {
            const k = clave(x);
            if ((quedan.get(k) ?? 0) > 0) {
                quedan.set(k, (quedan.get(k) ?? 0) - 1);
                return false;
            }
            return true;
        });
    };
    const dotesFuera = quitadas(conMascota.colecciones?.dotes, sinMascota.colecciones?.dotes, claveDote);
    const especialesFuera = quitadas(conMascota.colecciones?.especiales, sinMascota.colecciones?.especiales, claveEspecial);
    const { companero, familiar, ...resto } = ficha;
    return {
        ...resto,
        ...(mascota === 'companero' ? (familiar ? { familiar } : {}) : (companero ? { companero } : {})),
        colecciones: {
            ...(ficha.colecciones ?? {}),
            dotes: sinLasQuitadas(ficha.colecciones?.dotes, dotesFuera, claveDote),
            especiales: sinLasQuitadas(ficha.colecciones?.especiales, especialesFuera, claveEspecial),
        },
    } as PersonajeCreateRequestDto;
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
