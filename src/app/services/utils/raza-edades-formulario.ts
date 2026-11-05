import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { CategoriaEdadRaza, PasoEdadRaza, Raza } from 'src/app/interfaces/raza';
import { RazaCreateCategoriaEdad, RazaCreatePasoEdad } from 'src/app/interfaces/razas-api';
import { toInt, toIntOrNull, toNullableText, toNumber, toNumberOrNull } from './normalizacion';
import { categoriasEdadOrdenadas, pasosEdadOrdenados } from './razas-por-edades';

/*
 * Las edades de una raza en su inserción (hito 3 del roadmap de inserciones, 2026-10-31): las filas que edita el paso
 * «Edades» de `nueva-raza`, cómo se leen de su `GET` y cómo se mandan en `POST /razas/add` y `PUT /razas/{id}`
 * (`categorias_edad[]` y `pasos_edad[]`, `docs/publica/endpoints/catalogos.md`). Las comprobaciones son las de la API,
 * para avisar antes de mandar; la API las repite con su `code` y su `field`. Sin nombres ni ids fijos: el catálogo de
 * categorías es común y una raza homebrew usa las que quiera, con sus años.
 */

/** Lo que gana en una categoría: un racial (con su cifra a esa edad, si la cambia) o una sortílega. */
export interface FilaRacialEdad { id_racial: number; nombre: string; valor: string; }
export interface FilaSortilegaEdad { id_conjuro: number; nombre: string; usos_diarios: string; descripcion: string; }

/**
 * Las puntuaciones del libro de cada categoría, como sus claves en el cuerpo (0 es «—»): las seis de `CARACTERISTICAS`
 * (las claves de la respuesta, `Caracteristicas`), en minúsculas.
 */
export type CaracteristicaEdad = Lowercase<Caracteristica>;
const claveEdad = (caracteristica: Caracteristica) => caracteristica.toLowerCase() as CaracteristicaEdad;
export const CARACTERISTICAS_EDAD: readonly CaracteristicaEdad[] = CARACTERISTICAS.map(claveEdad);
export const VELOCIDADES_EDAD = ['correr', 'nadar', 'volar', 'trepar', 'excavar'] as const;
export type VelocidadEdad = typeof VELOCIDADES_EDAD[number];

export interface FilaCategoriaEdad extends Record<CaracteristicaEdad | VelocidadEdad, number> {
    uid: string;
    id_categoria_edad: number;
    edad_desde: number;
    edad_hasta: number | null;
    id_tamano: number;
    espacio: number;
    alcance: number;
    dgs: number;
    ajuste_nivel: number | null;
    vd: number | null;
    armadura_natural: number;
    id_maniobrabilidad: number;
    ataques_naturales: string;
    reduccion_dano: string;
    resistencia_conjuros: string;
    resistencia_energia: string;
    nivel_lanzamiento: number;
    nivel_lanzador_sortilegas: number;
    raciales: FilaRacialEdad[];
    sortilegas: FilaSortilegaEdad[];
}

export interface FilaPasoEdad {
    uid: string;
    /** El id de un paso que ya existe (se conserva; los personajes apuntan a él), o `null` si es nuevo. */
    id: number | null;
    edad: number;
    id_categoria_edad: number;
    dgs: number;
    ajuste_nivel: number | null;
    armadura_natural: number;
}

export interface EdadesDeRaza {
    categorias: FilaCategoriaEdad[];
    pasos: FilaPasoEdad[];
}

let siguienteUid = 1;
function uid(prefijo: string): string {
    return `${prefijo}-${siguienteUid++}`;
}

/** Una categoría nueva: después de la última (sus años y sus DG desde donde acaba aquella). */
export function categoriaVacia(anterior?: FilaCategoriaEdad | null): FilaCategoriaEdad {
    const desde = anterior ? (anterior.edad_hasta ?? anterior.edad_desde) + 1 : 0;
    return {
        uid: uid('categoria'),
        id_categoria_edad: 0,
        edad_desde: desde,
        edad_hasta: null,
        id_tamano: anterior?.id_tamano ?? 0,
        espacio: anterior?.espacio ?? 5,
        alcance: anterior?.alcance ?? 5,
        dgs: anterior?.dgs ?? 1,
        ajuste_nivel: null,
        vd: null,
        fuerza: anterior?.fuerza ?? 10,
        destreza: anterior?.destreza ?? 10,
        constitucion: anterior?.constitucion ?? 10,
        inteligencia: anterior?.inteligencia ?? 10,
        sabiduria: anterior?.sabiduria ?? 10,
        carisma: anterior?.carisma ?? 10,
        armadura_natural: anterior?.armadura_natural ?? 0,
        correr: anterior?.correr ?? 30,
        nadar: anterior?.nadar ?? 0,
        volar: anterior?.volar ?? 0,
        trepar: anterior?.trepar ?? 0,
        excavar: anterior?.excavar ?? 0,
        id_maniobrabilidad: anterior?.id_maniobrabilidad ?? 0,
        ataques_naturales: anterior?.ataques_naturales ?? '',
        reduccion_dano: '',
        resistencia_conjuros: '',
        resistencia_energia: '',
        nivel_lanzamiento: 0,
        nivel_lanzador_sortilegas: (anterior?.nivel_lanzador_sortilegas ?? 0) + 1,
        raciales: [],
        sortilegas: [],
    };
}

/** Un paso nuevo al empezar una categoría, con sus DG, su ajuste y su armadura natural. */
export function pasoAlEmpezar(categoria: FilaCategoriaEdad): FilaPasoEdad {
    return {
        uid: uid('paso'),
        id: null,
        edad: categoria.edad_desde,
        id_categoria_edad: categoria.id_categoria_edad,
        dgs: categoria.dgs,
        ajuste_nivel: categoria.ajuste_nivel,
        armadura_natural: categoria.armadura_natural,
    };
}

function filaDeCategoria(categoria: CategoriaEdadRaza): FilaCategoriaEdad {
    const fila = {
        uid: uid('categoria'),
        id_categoria_edad: toInt(categoria.Categoria?.Id),
        edad_desde: toInt(categoria.Edad_desde),
        edad_hasta: categoria.Edad_hasta === null ? null : toInt(categoria.Edad_hasta),
        id_tamano: toInt(categoria.Tamano?.Id),
        espacio: toNumber(categoria.Espacio),
        alcance: toInt(categoria.Alcance),
        dgs: toInt(categoria.Dgs),
        ajuste_nivel: categoria.Ajuste_nivel === null ? null : toInt(categoria.Ajuste_nivel),
        vd: categoria.Vd === null ? null : toNumber(categoria.Vd),
        armadura_natural: toInt(categoria.Armadura_natural),
        correr: toInt(categoria.Velocidades?.Correr),
        nadar: toInt(categoria.Velocidades?.Nadar),
        volar: toInt(categoria.Velocidades?.Volar),
        trepar: toInt(categoria.Velocidades?.Trepar),
        excavar: toInt(categoria.Velocidades?.Excavar),
        id_maniobrabilidad: toInt(categoria.Maniobrabilidad?.Id),
        ataques_naturales: categoria.Ataques_naturales ?? '',
        reduccion_dano: categoria.Rd ?? '',
        resistencia_conjuros: categoria.Rc ?? '',
        resistencia_energia: categoria.Re ?? '',
        nivel_lanzamiento: toInt(categoria.Nivel_lanzamiento),
        nivel_lanzador_sortilegas: toInt(categoria.Nivel_lanzador_sortilegas),
        raciales: (categoria.Raciales ?? []).map((racial) => ({ id_racial: toInt(racial.Id), nombre: racial.Nombre, valor: racial.Valor ?? '' })),
        sortilegas: (categoria.Sortilegas ?? []).map((sortilega) => ({
            id_conjuro: toInt(sortilega.Conjuro?.Id),
            nombre: sortilega.Conjuro?.Nombre ?? '',
            usos_diarios: sortilega.Usos_diarios ?? '',
            descripcion: sortilega.Descripcion ?? '',
        })),
    } as FilaCategoriaEdad;
    CARACTERISTICAS.forEach((clave) => fila[claveEdad(clave)] = toInt(categoria.Caracteristicas?.[clave]));
    return fila;
}

function filaDePaso(paso: PasoEdadRaza): FilaPasoEdad {
    return {
        uid: uid('paso'),
        id: toInt(paso.Id) > 0 ? toInt(paso.Id) : null,
        edad: toInt(paso.Edad),
        id_categoria_edad: toInt(paso.Categoria?.Id),
        dgs: toInt(paso.Dgs),
        ajuste_nivel: paso.Ajuste_nivel === null ? null : toInt(paso.Ajuste_nivel),
        armadura_natural: toInt(paso.Armadura_natural),
    };
}

/** Las edades de una raza tal como las da su `GET` (las categorías en su orden, los pasos por edad). */
export function edadesDesdeRaza(raza: Pick<Raza, 'Categorias_edad' | 'Pasos_edad'> | null | undefined): EdadesDeRaza {
    return {
        categorias: categoriasEdadOrdenadas(raza).map(filaDeCategoria),
        pasos: pasosEdadOrdenados(raza).map(filaDePaso),
    };
}

/** `categorias_edad[]` y `pasos_edad[]` del cuerpo del alta y la edición. Sin edades, las dos vacías. */
export function cuerpoDeEdades(edades: EdadesDeRaza): { categorias_edad: RazaCreateCategoriaEdad[]; pasos_edad: RazaCreatePasoEdad[]; } {
    return {
        categorias_edad: edades.categorias.map((fila) => ({
            id_categoria_edad: toInt(fila.id_categoria_edad),
            edad_desde: toInt(fila.edad_desde),
            edad_hasta: toIntOrNull(fila.edad_hasta),
            id_tamano: toInt(fila.id_tamano),
            espacio: toNumber(fila.espacio),
            alcance: toInt(fila.alcance),
            dgs: toInt(fila.dgs),
            ajuste_nivel: toIntOrNull(fila.ajuste_nivel),
            vd: toNumberOrNull(fila.vd),
            fuerza: toInt(fila.fuerza),
            destreza: toInt(fila.destreza),
            constitucion: toInt(fila.constitucion),
            inteligencia: toInt(fila.inteligencia),
            sabiduria: toInt(fila.sabiduria),
            carisma: toInt(fila.carisma),
            armadura_natural: toInt(fila.armadura_natural),
            correr: toInt(fila.correr),
            nadar: toInt(fila.nadar),
            volar: toInt(fila.volar),
            trepar: toInt(fila.trepar),
            excavar: toInt(fila.excavar),
            id_maniobrabilidad: toInt(fila.id_maniobrabilidad),
            ataques_naturales: toNullableText(fila.ataques_naturales),
            reduccion_dano: toNullableText(fila.reduccion_dano),
            resistencia_conjuros: toNullableText(fila.resistencia_conjuros),
            resistencia_energia: toNullableText(fila.resistencia_energia),
            nivel_lanzamiento: toInt(fila.nivel_lanzamiento),
            nivel_lanzador_sortilegas: toInt(fila.nivel_lanzador_sortilegas),
            raciales: fila.raciales.filter((racial) => toInt(racial.id_racial) > 0)
                .map((racial) => ({ id_racial: toInt(racial.id_racial), valor: toNullableText(racial.valor) })),
            sortilegas: fila.sortilegas.filter((sortilega) => toInt(sortilega.id_conjuro) > 0)
                .map((sortilega) => ({
                    id_conjuro: toInt(sortilega.id_conjuro),
                    usos_diarios: `${sortilega.usos_diarios ?? ''}`.trim(),
                    descripcion: `${sortilega.descripcion ?? ''}`.trim(),
                })),
        })),
        pasos_edad: edades.pasos.map((fila) => ({
            ...(fila.id !== null && fila.id > 0 ? { id: fila.id } : {}),
            edad: toInt(fila.edad),
            id_categoria_edad: toInt(fila.id_categoria_edad),
            dgs: toInt(fila.dgs),
            ajuste_nivel: toIntOrNull(fila.ajuste_nivel),
            armadura_natural: toInt(fila.armadura_natural),
        })),
    };
}

/** Lo que comprueba la API, con su texto, para avisar antes de mandar (la primera regla que no se cumple, o `null`). */
export function problemaDeEdades(
    edades: EdadesDeRaza,
    contexto: { ordenTipico: (idCategoria: number) => number | undefined; lanzaComoClase: boolean; dgsDeLaRaza: number; },
): string | null {
    const { categorias, pasos } = edades;
    if (categorias.length < 1)
        return 'Una raza que crece por edades necesita al menos una categoría de edad.';
    if (toInt(contexto.dgsDeLaRaza) < 1)
        return 'Una raza por edades lleva en «Valores» los DG raciales de su primer paso (y su tipo de criatura de los DG): «DG extra» no puede ser 0.';
    const vistas = new Set<number>();
    let anterior: FilaCategoriaEdad | null = null;
    for (const [indice, categoria] of categorias.entries()) {
        const n = indice + 1;
        if (toInt(categoria.id_categoria_edad) <= 0)
            return `Elige la categoría de la fila ${n}.`;
        if (vistas.has(categoria.id_categoria_edad))
            return 'Una categoría de edad no puede estar dos veces en la raza.';
        vistas.add(categoria.id_categoria_edad);
        if (toInt(categoria.id_tamano) <= 0)
            return `Elige el tamaño de la categoría ${n}.`;
        if (toInt(categoria.dgs) < 1)
            return `La categoría ${n} necesita al menos 1 DG.`;
        if (categoria.edad_hasta !== null && toInt(categoria.edad_hasta) < toInt(categoria.edad_desde))
            return `Los años de la categoría ${n} terminan antes de empezar.`;
        if (anterior) {
            // Sin el catálogo (no ha llegado), lo comprueba la API.
            const tipicoAnterior = contexto.ordenTipico(anterior.id_categoria_edad);
            const tipico = contexto.ordenTipico(categoria.id_categoria_edad);
            if (tipicoAnterior !== undefined && tipico !== undefined && tipico <= tipicoAnterior)
                return `Las categorías de edad van en el orden del catálogo (la ${n} va antes que la anterior).`;
            if (anterior.edad_hasta === null || toInt(categoria.edad_desde) <= toInt(anterior.edad_hasta))
                return `Los años de la categoría ${n} se solapan con los de la anterior: tiene que empezar después de que termine aquella (solo la última puede no tener tope).`;
            if (toInt(categoria.dgs) < toInt(anterior.dgs))
                return `Los DG no pueden bajar de una categoría a la siguiente (categoría ${n}).`;
        }
        if (categoria.sortilegas.some((sortilega) => toInt(sortilega.id_conjuro) > 0 && `${sortilega.usos_diarios ?? ''}`.trim().length < 1))
            return `Una sortílega de la categoría ${n} no dice sus usos («3/día», «a voluntad»).`;
        anterior = categoria;
    }
    const porId = new Map(categorias.map((categoria) => [toInt(categoria.id_categoria_edad), categoria]));
    const edadesVistas = new Set<number>();
    for (const paso of pasos) {
        const categoria = porId.get(toInt(paso.id_categoria_edad));
        if (!categoria)
            return `El paso de los ${paso.edad} años es de una categoría que la raza no tiene.`;
        if (edadesVistas.has(toInt(paso.edad)))
            return `Dos pasos de edad empiezan a los ${paso.edad} años.`;
        edadesVistas.add(toInt(paso.edad));
        if (toInt(paso.edad) < toInt(categoria.edad_desde) || (categoria.edad_hasta !== null && toInt(paso.edad) > toInt(categoria.edad_hasta)))
            return `El paso de los ${paso.edad} años no cae dentro de los años de su categoría.`;
        if (toInt(paso.dgs) < 1)
            return `El paso de los ${paso.edad} años necesita al menos 1 DG.`;
        if (paso.ajuste_nivel !== null && categoria.ajuste_nivel === null)
            return `El paso de los ${paso.edad} años tiene ajuste, pero su categoría no: un paso solo es jugable si él y su categoría tienen ajuste de nivel.`;
    }
    const ordenados = [...pasos].sort((a, b) => toInt(a.edad) - toInt(b.edad));
    for (let i = 1; i < ordenados.length; i++) {
        if (toInt(ordenados[i].dgs) < toInt(ordenados[i - 1].dgs))
            return `Los DG no pueden bajar de un paso de edad al siguiente (el de los ${ordenados[i].edad} años).`;
    }
    const conPaso = new Set(pasos.map((paso) => toInt(paso.id_categoria_edad)));
    const sinPaso = categorias.findIndex((categoria) => !conPaso.has(toInt(categoria.id_categoria_edad)));
    if (sinPaso >= 0)
        return `La categoría ${sinPaso + 1} no tiene ningún paso de edad: el personaje no podría elegirla.`;
    if (!contexto.lanzaComoClase && categorias.some((categoria) => toInt(categoria.nivel_lanzamiento) > 0))
        return 'Alguna categoría lanza conjuros: elige en «Lanzamiento racial» la clase con la que lanza.';
    return null;
}

/**
 * El ajuste racial de una puntuación de monstruo usada como raza (*Guía del DM*, pág. 172): la puntuación menos 10 si es
 * par y menos 11 si es impar; 0 si no tiene («—»). La misma regla que la API (`utils/caracteristicas.modificador_racial`).
 */
export function ajusteRacialDePuntuacion(puntuacion: number): number {
    const valor = toInt(puntuacion);
    if (valor <= 0)
        return 0;
    return valor % 2 === 0 ? valor - 10 : valor - 11;
}

/**
 * Lo que lleva la fila de la raza en una raza por edades: las cifras de su primera categoría y de su primer paso (las usa
 * lo que todavía no lee las edades; `docs/roadmaps/PAUSADO_dragones-jugables`, «Formato de los datos»).
 */
export function filaDeRazaDesdePrimeraEdad(edades: EdadesDeRaza): Record<string, number | string> | null {
    const categoria = edades.categorias[0];
    if (!categoria)
        return null;
    const paso = [...edades.pasos]
        .filter((item) => toInt(item.id_categoria_edad) === toInt(categoria.id_categoria_edad))
        .sort((a, b) => toInt(a.edad) - toInt(b.edad))[0];
    return {
        id_tamano: toInt(categoria.id_tamano),
        espacio: toNumber(categoria.espacio),
        alcance: toInt(categoria.alcance),
        mod_fue: ajusteRacialDePuntuacion(categoria.fuerza),
        mod_des: ajusteRacialDePuntuacion(categoria.destreza),
        mod_cons: ajusteRacialDePuntuacion(categoria.constitucion),
        mod_int: ajusteRacialDePuntuacion(categoria.inteligencia),
        mod_sab: ajusteRacialDePuntuacion(categoria.sabiduria),
        mod_car: ajusteRacialDePuntuacion(categoria.carisma),
        armadura_natural: toInt(paso?.armadura_natural ?? categoria.armadura_natural),
        correr: toInt(categoria.correr),
        nadar: toInt(categoria.nadar),
        volar: toInt(categoria.volar),
        trepar: toInt(categoria.trepar),
        excavar: toInt(categoria.excavar),
        id_maniobrabilidad: toInt(categoria.id_maniobrabilidad),
        dgs_extra: toInt(paso?.dgs ?? categoria.dgs),
        ajuste_nivel: toInt(paso?.ajuste_nivel ?? categoria.ajuste_nivel ?? 0),
    };
}
