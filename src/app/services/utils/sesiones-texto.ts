import { ExperienciaPersonaje, ResumenSesion, SesionPersonaje, TipoEventoSesion } from 'src/app/interfaces/sesiones';
import { textoPrecio } from './equipo-texto';

/*
 * Lo que la web enseña de las sesiones sin componer los textos de la API (el `texto` de cada evento y el `relato` de cada
 * sesión van tal cual, `docs/publica/SESIONES_FRONT.md`): la barra de experiencia, las fechas, las cifras de una sesión
 * (de su `resumen`) y la etiqueta corta de cada tipo de evento. Una sola copia para la ficha, el historial y el panel.
 */

/** La barra de experiencia de la ficha (lienzo de sesiones, pantalla 1). */
export interface BarraExperiencia {
    /** «2.640 / 3.000 PX». */
    texto: string;
    /** «nivel 3 → 4». */
    niveles: string;
    /** De 0 a 100: lo que lleva del nivel actual al siguiente. */
    porcentaje: number;
    puedeSubir: boolean;
    /** El nivel al que sube con la próxima subida. */
    siguienteNivel: number;
    /** «Subir a nivel 4». */
    boton: string;
    /** «(2 niveles)» si sus PX dan para más de uno; vacío si no. */
    varios: string;
    /** Para el lector de pantalla: «Experiencia hacia el nivel 4». */
    etiqueta: string;
}

/**
 * Los PX con el punto de los miles también en los de cuatro cifras («2.640 PX»), como los escribe la API en sus frases
 * (`texto` y `relato`) y como el lienzo: la barra va junto a ellas. (`formatoNumero`, el del resto de la web, no lo pone
 * en los de cuatro cifras.)
 */
export function formatoPx(px: number): string {
    const entero = Math.trunc(Number.isFinite(px) ? px : 0);
    const texto = `${Math.abs(entero)}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return entero < 0 ? `−${texto}` : texto;
}

export function barraExperiencia(experiencia: ExperienciaPersonaje): BarraExperiencia {
    const siguienteNivel = experiencia.nivel + 1;
    const tramo = experiencia.pxSiguienteNivel - experiencia.pxNivelActual;
    const porcentaje = experiencia.puedeSubir || tramo <= 0
        ? 100
        : Math.max(0, Math.min(100, Math.round((experiencia.px - experiencia.pxNivelActual) * 100 / tramo)));
    return {
        texto: `${formatoPx(experiencia.px)} / ${formatoPx(experiencia.pxSiguienteNivel)} PX`,
        niveles: `nivel ${experiencia.nivel} → ${siguienteNivel}`,
        porcentaje,
        puedeSubir: experiencia.puedeSubir,
        siguienteNivel,
        boton: `Subir a nivel ${siguienteNivel}`,
        varios: experiencia.puedeSubir && experiencia.nivelesPorSubir > 1 ? `(${experiencia.nivelesPorSubir} niveles)` : '',
        etiqueta: `Experiencia hacia el nivel ${siguienteNivel}`,
    };
}

/** Los PX que suma una ganancia con la penalización por multiclase de ahora, como la API: el neto, hacia abajo. */
export function pxConPenalizacion(px: number, porcentaje: number): number {
    const brutos = Math.max(0, Math.trunc(px || 0));
    const pct = Math.max(0, Math.min(100, Math.trunc(porcentaje || 0)));
    return Math.floor(brutos * (100 - pct) / 100);
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * La fecha de una sesión, «12 nov 2026»: la de juego (`AAAA-MM-DD`) o, sin ella, el día en que se abrió; vacío si no hay
 * ninguna. Se lee en UTC para que la fecha de juego no cambie de día con la zona horaria.
 */
export function fechaSesion(sesion: Pick<SesionPersonaje, 'fechaJuego' | 'abiertaUtc'>): string {
    const texto = sesion.fechaJuego ?? sesion.abiertaUtc ?? '';
    const fecha = new Date(/^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T00:00:00Z` : texto);
    return texto && !Number.isNaN(fecha.getTime()) ? FECHA_CORTA.format(fecha).replace('.', '') : '';
}

/** El título que le ha puesto quien la abrió («La mina inundada»); vacío si no tiene o es el de por defecto («Sesión 3»). */
export function tituloPropioSesion(sesion: Pick<SesionPersonaje, 'numero' | 'titulo'>): string {
    const titulo = `${sesion.titulo ?? ''}`.trim();
    return titulo === `Sesión ${sesion.numero}` ? '' : titulo;
}

/** «Sesión 3 · La mina inundada»; si el título es el de por defecto («Sesión 3»), solo él. */
export function tituloSesion(sesion: Pick<SesionPersonaje, 'numero' | 'titulo'>): string {
    const base = `Sesión ${sesion.numero}`;
    const titulo = tituloPropioSesion(sesion);
    return titulo ? `${base} · ${titulo}` : base;
}

/** Lo que ha ganado o gastado en la sesión, de su `resumen`: «+3.000 PX · +45 po»; vacío si no ha cambiado nada. */
export function cambiosSesion(resumen: ResumenSesion): string {
    const px = (resumen.pxFin ?? 0) - (resumen.pxInicio ?? resumen.pxFin ?? 0);
    const po = Math.round(((resumen.poFin ?? 0) - (resumen.poInicio ?? resumen.poFin ?? 0)) * 100) / 100;
    return [
        px !== 0 ? `${px > 0 ? '+' : '−'}${formatoPx(Math.abs(px))} PX` : '',
        po !== 0 ? `${po > 0 ? '+' : '−'}${textoPrecio(Math.abs(po))}` : '',
        (resumen.nepFin ?? 0) > (resumen.nepInicio ?? resumen.nepFin ?? 0) ? `NEP ${resumen.nepInicio} → ${resumen.nepFin}` : '',
    ].filter(Boolean).join(' · ');
}

/** La etiqueta corta de cada tipo de evento, delante de su frase en la lista de la sesión. */
export const ETIQUETA_EVENTO: Record<TipoEventoSesion, string> = {
    alta: 'Creación',
    experiencia: 'PX',
    experiencia_gastada: 'PX gastados',
    dinero: 'Dinero',
    objeto_obtenido: 'Objeto',
    objeto_perdido: 'Pérdida',
    venta: 'Venta',
    compra: 'Compra',
    conjuro_copiado: 'Libro',
    subida_nivel: 'Nivel',
    modificacion: 'Corrección',
    correccion_master: 'Corrección del máster',
    plantilla_adquirida: 'Plantilla',
    nota: 'Nota',
};
