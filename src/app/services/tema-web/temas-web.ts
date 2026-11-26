/**
 * Los temas de la web (roadmap «Los temas de la web y los iconos»; lienzo «Rol: temas e iconos»). Un tema es una hoja de
 * valores (`src/assets/css/_temas.sass`, por `data-tema` en `<html>`) y su política de iconos (`data-iconos`). El modo
 * (sistema, claro u oscuro) es aparte y solo del navegador.
 */

export type TemaWeb = 'a' | 'b' | 'c';
export type ModoWeb = 'sistema' | 'claro' | 'oscuro';
export type ModoEfectivo = 'claro' | 'oscuro';
/** Qué papeles de icono pinta el tema (fase 1 del roadmap): A y C, «con criterio»; B, «mínimos». */
export type PoliticaIconos = 'criterio' | 'minimos';

export interface DefinicionTemaWeb {
    id: TemaWeb;
    /** «A · Clásico». */
    etiqueta: string;
    descripcion: string;
    iconos: PoliticaIconos;
    /**
     * Si su claro ya está hecho. Mientras no, el modo efectivo del tema es el oscuro aunque se elija claro o el sistema
     * sea claro. Desde la fase 2, los tres: el de A, completo, y los de B y C, de sus valores básicos (sus piezas propias
     * llegan en las fases 3 y 4).
     */
    claroListo: boolean;
}

export const TEMA_POR_DEFECTO: TemaWeb = 'a';
export const MODO_POR_DEFECTO: ModoWeb = 'sistema';

export const TEMAS_WEB: readonly DefinicionTemaWeb[] = [
    { id: 'a', etiqueta: 'A · Clásico', descripcion: 'La web de siempre: pizarra, rosa y el borde 3D.', iconos: 'criterio', claroListo: true },
    { id: 'b', etiqueta: 'B · Tinta', descripcion: 'Plana y tipográfica: líneas finas y el nombre manda.', iconos: 'minimos', claroListo: true },
    { id: 'c', etiqueta: 'C · Manual', descripcion: 'El marco de siempre con papel, tinta y granate.', iconos: 'criterio', claroListo: true },
];

export const MODOS_WEB: readonly { id: ModoWeb; etiqueta: string }[] = [
    { id: 'sistema', etiqueta: 'Como el sistema' },
    { id: 'claro', etiqueta: 'Claro' },
    { id: 'oscuro', etiqueta: 'Oscuro' },
];

export function esTemaWeb(valor: unknown): valor is TemaWeb {
    return valor === 'a' || valor === 'b' || valor === 'c';
}

export function esModoWeb(valor: unknown): valor is ModoWeb {
    return valor === 'sistema' || valor === 'claro' || valor === 'oscuro';
}

export function definicionTema(tema: TemaWeb): DefinicionTemaWeb {
    return TEMAS_WEB.find((t) => t.id === tema) ?? TEMAS_WEB[0];
}

/**
 * Un dibujo, un significado (fase 1): `auto_awesome` es solo de la IA, así que «Actualización» (Novedades) lleva
 * `upgrade` y «Raza mutada» (su pestaña y el historial), `change_circle`. Con los temas apagados (producción hasta tener
 * los tres) se pinta el de antes, para que la web no cambie; al encenderlos en todas partes se quita esta tabla.
 */
const ICONOS_ANTES_DE_LOS_TEMAS: Readonly<Record<string, string>> = {
    upgrade: 'auto_awesome',
    change_circle: 'auto_awesome',
};

/** El icono de Material [icono], o el de antes de los temas si están apagados (`TEMAS_WEB_ACTIVOS`). */
export function iconoSegunTemas(icono: string, temasActivos: boolean): string {
    return temasActivos ? icono : (ICONOS_ANTES_DE_LOS_TEMAS[icono] ?? icono);
}

/** El modo con el que se pinta [tema]: el oscuro mientras su claro no esté listo; «sistema», el del dispositivo. */
export function modoEfectivo(tema: TemaWeb, modo: ModoWeb, sistemaOscuro: boolean): ModoEfectivo {
    if (!definicionTema(tema).claroListo)
        return 'oscuro';
    if (modo === 'sistema')
        return sistemaOscuro ? 'oscuro' : 'claro';
    return modo;
}
