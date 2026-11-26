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
     * sea claro: el claro de A llega en la fase 2, el de C en la 3 y el de B en la 4.
     */
    claroListo: boolean;
}

export const TEMA_POR_DEFECTO: TemaWeb = 'a';
export const MODO_POR_DEFECTO: ModoWeb = 'sistema';

export const TEMAS_WEB: readonly DefinicionTemaWeb[] = [
    { id: 'a', etiqueta: 'A · Clásico', descripcion: 'La web de siempre: pizarra, rosa y el borde 3D.', iconos: 'criterio', claroListo: false },
    { id: 'b', etiqueta: 'B · Tinta', descripcion: 'Plana y tipográfica: líneas finas y el nombre manda.', iconos: 'minimos', claroListo: false },
    { id: 'c', etiqueta: 'C · Manual', descripcion: 'El marco de siempre con papel, tinta y granate.', iconos: 'criterio', claroListo: false },
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

/** El modo con el que se pinta [tema]: el oscuro mientras su claro no esté listo; «sistema», el del dispositivo. */
export function modoEfectivo(tema: TemaWeb, modo: ModoWeb, sistemaOscuro: boolean): ModoEfectivo {
    if (!definicionTema(tema).claroListo)
        return 'oscuro';
    if (modo === 'sistema')
        return sistemaOscuro ? 'oscuro' : 'claro';
    return modo;
}
