import { CategoriaEdadRaza, PasoEdadRaza, Raza } from 'src/app/interfaces/raza';
import { esPnj, TipoPersonaje, textoVd } from './tipo-personaje';

/*
 * Las razas que crecen por categorías de edad (los dragones auténticos, `docs/publica/DRAGONES_FRONT.md`): qué edades
 * puede elegir cada personaje y cómo se enseñan. Todo sale de los datos de la raza (`Categorias_edad` y `Pasos_edad`):
 * que la raza tenga edades, que un paso sea jugable (`Jugable`, el manual le da ajuste de nivel) y su NEP o su VD. Un PJ
 * solo elige los pasos jugables (y que no pasen del NEP máximo de su campaña, si ya se sabe); un PNJ, cualquiera.
 */

/** El texto del contrato para un PJ en una edad sin ajuste (`paso_edad_no_jugable`). */
export const MOTIVO_EDAD_SOLO_PNJ = 'El manual no da ajuste de nivel a esta edad; solo como PNJ.';

/** El texto del contrato para un PJ sin niveles de clase que no puede quedarse así (`pj_sin_clase`). */
export const MOTIVO_PJ_SIN_CLASE = 'Un PJ necesita al menos un nivel de clase; sin clases solo puede ser un PNJ o una raza que se juega por edades.';

export interface ContextoEdad {
    tipo: TipoPersonaje;
    /** El NEP máximo de los personajes nuevos de su campaña, si ya se conoce (un PNJ no pasa por la política). */
    nepMaximo?: number | null;
}

export interface OpcionPasoEdad {
    paso: PasoEdadRaza;
    bloqueado: boolean;
    motivo: string | null;
    /**
     * Un PJ en una edad sin ajuste: no se puede elegir, pero el máster que se salta las reglas de su campaña puede
     * elegirla igualmente (`overrideReglasCampana`), y el personaje queda homebrew. Las que pasan del NEP de la campaña no.
     */
    saltable: boolean;
    /** «NEP 11», «VD 4» o «Solo PNJ». */
    nivel: string;
    /** «16 años · 13 DG · NEP 19». */
    texto: string;
}

export interface OpcionCategoriaEdad {
    id: number;
    nombre: string;
    orden: number;
    categoria: CategoriaEdadRaza | null;
    pasos: OpcionPasoEdad[];
    /** Ningún paso de la categoría se puede elegir. */
    bloqueada: boolean;
    motivo: string | null;
    /** Bloqueada, pero con algún paso que se puede elegir igualmente (`OpcionPasoEdad.saltable`). */
    saltable: boolean;
    /** Lo que se lee bajo su nombre: «NEP 11», «NEP 11–13», «VD 5» o «Solo PNJ». */
    pie: string;
}

/** Si la raza crece por edades: trae pasos de edad que elegir. */
export function razaPorEdades(raza: Pick<Raza, 'Pasos_edad'> | null | undefined): boolean {
    return (raza?.Pasos_edad?.length ?? 0) > 0;
}

/** El nombre de una categoría dentro de una frase: «adulto maduro». */
export function nombreEdadEnFrase(nombre: string | null | undefined): string {
    const texto = `${nombre ?? ''}`.trim();
    return texto.length > 0 ? texto.charAt(0).toLocaleLowerCase('es') + texto.slice(1) : '';
}

/** «Dragón rojo · cría»: la raza con su edad, en la ficha y en el listado de personajes; sin edad, la raza. */
export function razaConCategoria(nombreRaza: string | null | undefined, categoria: string | null | undefined): string {
    return [`${nombreRaza ?? ''}`.trim(), nombreEdadEnFrase(categoria)].filter((parte) => parte.length > 0).join(' · ');
}

/**
 * El nombre de la categoría de edad de un personaje de los listados («Cría»), o `null` si su raza no tiene edades:
 * `categoriaEdad` (una cadena) en la copia de Firestore y en `GET /usuarios/me/personajes`, `Categoria_edad` en
 * `listado-personajes` (sin valor, no está); la ficha (`categoriaEdad`) y la creación (`CategoriaEdad`) la traen como objeto.
 */
export function leerCategoriaEdadListado(raw: any): string | null {
    const valor = raw?.categoriaEdad ?? raw?.Categoria_edad ?? raw?.CategoriaEdad ?? null;
    const nombre = typeof valor === 'string' ? valor : valor?.categoria?.Nombre;
    const texto = `${nombre ?? ''}`.trim();
    return texto.length > 0 ? texto : null;
}

/**
 * Si un personaje puede quedarse sin niveles de clase (decisión del propietario del 2026-10-31; `pj_sin_clase` en
 * `docs/publica/endpoints/personajes.md`): un PNJ siempre, sea cual sea su raza; un PJ solo si su raza se juega por edades
 * y tiene DG raciales a su edad (el dragón del *Draconomicón*). Sin clases, todo sale de los DG raciales (0 si no tiene).
 */
export function puedeQuedarseSinClases(datos: { tipo: TipoPersonaje | null | undefined; porEdades: boolean; dgsRaciales: number; }): boolean {
    return esPnj(datos.tipo) || (datos.porEdades && Number(datos.dgsRaciales) > 0);
}

/** «Dragón rojo (joven)»: la raza con su edad, para el botón de elegirla y la cabecera de la creación. */
export function razaConEdad(nombreRaza: string | null | undefined, categoria: string | null | undefined): string {
    const raza = `${nombreRaza ?? ''}`.trim();
    const edad = nombreEdadEnFrase(categoria);
    return edad.length > 0 ? `${raza} (${edad})` : raza;
}

/** Por qué un personaje de ese tipo no puede elegir el paso, o `null` si puede. */
export function motivoBloqueoPasoEdad(paso: PasoEdadRaza, contexto: ContextoEdad): string | null {
    if (esPnj(contexto.tipo))
        return null;
    if (!paso.Jugable)
        return MOTIVO_EDAD_SOLO_PNJ;
    const maximo = contexto.nepMaximo ?? null;
    if (maximo !== null && paso.Nep_base !== null && paso.Nep_base > maximo)
        return `Pasa del NEP máximo de los personajes nuevos de la campaña (${maximo}).`;
    return null;
}

function nivelPaso(paso: PasoEdadRaza, contexto: ContextoEdad, vdCategoria: number | null): string {
    if (esPnj(contexto.tipo)) {
        const vd = vdCategoria ?? paso.Vd;
        return vd === null ? 'Sin VD' : `VD ${textoVd(vd)}`;
    }
    return paso.Jugable && paso.Nep_base !== null ? `NEP ${paso.Nep_base}` : 'Solo PNJ';
}

/**
 * Las categorías de edad de la raza, en su orden, cada una con sus pasos y si el personaje puede elegirlos. Una categoría
 * sin pasos en los datos sale bloqueada. Si la raza no trae categorías, se agrupan los pasos por la suya.
 */
export function opcionesEdad(raza: Pick<Raza, 'Categorias_edad' | 'Pasos_edad'> | null | undefined, contexto: ContextoEdad): OpcionCategoriaEdad[] {
    const pasos = [...(raza?.Pasos_edad ?? [])].sort((a, b) => a.Edad - b.Edad);
    const categorias: Array<{ id: number; nombre: string; orden: number; categoria: CategoriaEdadRaza | null; }> =
        (raza?.Categorias_edad ?? []).length > 0
            ? [...(raza?.Categorias_edad ?? [])].sort((a, b) => a.Orden - b.Orden)
                .map((categoria) => ({ id: categoria.Categoria.Id, nombre: categoria.Categoria.Nombre, orden: categoria.Orden, categoria }))
            : pasos.reduce((acc, paso) => {
                if (!acc.some((c) => c.id === paso.Categoria.Id))
                    acc.push({ id: paso.Categoria.Id, nombre: paso.Categoria.Nombre, orden: paso.Orden, categoria: null });
                return acc;
            }, [] as Array<{ id: number; nombre: string; orden: number; categoria: CategoriaEdadRaza | null; }>);

    return categorias.map(({ id, nombre, orden, categoria }) => {
        const vdCategoria = categoria?.Vd ?? null;
        const opciones: OpcionPasoEdad[] = pasos
            .filter((paso) => paso.Categoria.Id === id)
            .map((paso) => {
                const motivo = motivoBloqueoPasoEdad(paso, contexto);
                const nivel = nivelPaso(paso, contexto, vdCategoria);
                return {
                    paso,
                    bloqueado: motivo !== null,
                    motivo,
                    saltable: motivo === MOTIVO_EDAD_SOLO_PNJ,
                    nivel,
                    texto: [`${paso.Edad} ${paso.Edad === 1 ? 'año' : 'años'}`, `${paso.Dgs} DG`, nivel].join(' · '),
                };
            });
        const libres = opciones.filter((opcion) => !opcion.bloqueado);
        const bloqueada = libres.length < 1;
        return {
            id,
            nombre,
            orden,
            categoria,
            pasos: opciones,
            bloqueada,
            motivo: opciones.length < 1 ? 'Esta edad no tiene pasos en los datos de la raza.' : bloqueada ? opciones[0].motivo : null,
            saltable: bloqueada && opciones.some((opcion) => opcion.saltable),
            pie: pieCategoria(opciones, contexto, vdCategoria),
        };
    });
}

function pieCategoria(opciones: OpcionPasoEdad[], contexto: ContextoEdad, vdCategoria: number | null): string {
    if (opciones.length < 1)
        return 'Sin datos';
    if (esPnj(contexto.tipo))
        return nivelPaso(opciones[0].paso, contexto, vdCategoria);
    const neps = opciones.filter((o) => o.paso.Jugable && o.paso.Nep_base !== null).map((o) => o.paso.Nep_base as number);
    if (neps.length < 1)
        return 'Solo PNJ';
    const minimo = Math.min(...neps);
    const maximo = Math.max(...neps);
    return minimo === maximo ? `NEP ${minimo}` : `NEP ${minimo}–${maximo}`;
}

/**
 * El paso que se mira al abrir la raza o al cambiar de tipo: el preferido si se puede elegir; si no, el primero que se
 * pueda. `null` si ninguno.
 */
export function pasoEdadInicial(opciones: OpcionCategoriaEdad[], idPreferido?: number | null): PasoEdadRaza | null {
    const libres = opciones.flatMap((categoria) => categoria.pasos).filter((opcion) => !opcion.bloqueado);
    return libres.find((opcion) => opcion.paso.Id === idPreferido)?.paso ?? libres[0]?.paso ?? null;
}

/**
 * Los años que puede tener con ese paso: desde su edad hasta el año antes del paso siguiente (o el final de su categoría;
 * sin tope en la última). Es lo que acepta el campo «Edad» de Básicos.
 */
export function rangoEdadPaso(raza: Pick<Raza, 'Categorias_edad' | 'Pasos_edad'> | null | undefined, idPaso: number | null | undefined): { desde: number; hasta: number | null; } | null {
    const pasos = [...(raza?.Pasos_edad ?? [])].sort((a, b) => a.Edad - b.Edad);
    const indice = pasos.findIndex((paso) => paso.Id === idPaso);
    if (indice < 0)
        return null;
    const paso = pasos[indice];
    const siguiente = pasos[indice + 1];
    if (siguiente)
        return { desde: paso.Edad, hasta: Math.max(paso.Edad, siguiente.Edad - 1) };
    const categoria = (raza?.Categorias_edad ?? []).find((c) => c.Categoria.Id === paso.Categoria.Id);
    return { desde: paso.Edad, hasta: categoria?.Edad_hasta ?? null };
}

/** «de 16 a 25 años», «desde 1201 años». */
export function textoRangoEdad(rango: { desde: number; hasta: number | null; }): string {
    return rango.hasta === null ? `desde ${rango.desde} años` : `de ${rango.desde} a ${rango.hasta} años`;
}
