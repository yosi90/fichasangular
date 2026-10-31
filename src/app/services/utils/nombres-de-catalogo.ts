import { ElementoDeCatalogo } from './error-catalogo';

/**
 * Cómo se nombra cada catálogo en los textos de su alta y su edición: «la clase», «los especiales»… Lo usan los
 * servicios (las frases de error de `errorDeCatalogo`) y las inserciones (los avisos y el modo «Modificar» de
 * `insercion-marco`), para que el nombre de un catálogo esté en un solo sitio.
 */
export const RAZA: ElementoDeCatalogo = { singular: 'raza', plural: 'razas', femenino: true };
export const RACIAL: ElementoDeCatalogo = { singular: 'racial', plural: 'raciales', femenino: false };
export const IDIOMA: ElementoDeCatalogo = { singular: 'idioma', plural: 'idiomas', femenino: false };
export const CLASE: ElementoDeCatalogo = { singular: 'clase', plural: 'clases', femenino: true };
export const ESPECIAL: ElementoDeCatalogo = { singular: 'especial', plural: 'especiales', femenino: false };
export const DOTE: ElementoDeCatalogo = { singular: 'dote', plural: 'dotes', femenino: true };
export const CONJURO: ElementoDeCatalogo = { singular: 'conjuro', plural: 'conjuros', femenino: false };
export const PLANTILLA: ElementoDeCatalogo = { singular: 'plantilla', plural: 'plantillas', femenino: true };
export const HABILIDAD: ElementoDeCatalogo = { singular: 'habilidad', plural: 'habilidades', femenino: true };
