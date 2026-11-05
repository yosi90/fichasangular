import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto } from './normalizacion';

/** Lo mínimo de un elemento de catálogo para saber si es oficial y de qué fuente es (su id y su manual). */
export interface ConOficial {
    Id?: number | null;
    Nombre?: string;
    Oficial?: boolean | null;
    /** El manual: su nombre (la raza, el conjuro) o su referencia (`{ Id, Nombre, Pagina }`). */
    Manual?: string | { Nombre?: string | null; } | null;
}

/** Una clase con su escuela fija de especialista (la del magiingeniero), si la tiene. */
interface ClaseConOficial extends ConOficial {
    Conjuros?: { Escuela_especialista?: { Id?: number | null; } | null; } | null;
}

/** Lo que usa el personaje en creación y no va dentro de `Personaje` (o no lleva allí su `Oficial`). */
export interface ContextoOficialidad {
    raza?: ConOficial | null;
    /** La deidad elegida, del catálogo de deidades (`Personaje.Deidad` es solo su nombre). */
    deidad?: ConOficial | null;
    razaBase?: ConOficial | null;
    /** Las clases del catálogo de los niveles que tiene (`desgloseClases`). */
    clases?: ClaseConOficial[];
    /** Las plantillas elegidas, con su `Oficial` (las de `Personaje.Plantillas` no lo llevan). */
    plantillas?: ConOficial[];
    /** Los subtipos del personaje en el catálogo de subtipos (los de `Personaje.Subtipos` no llevan su `Oficial`). */
    subtipos?: ConOficial[];
    /** Si eligió ventajas o desventajas (siempre homebrew, decisión del propietario del 2026-10-25). */
    tieneVentajas?: boolean;
    /**
     * La escuela de especialista (del catálogo de escuelas, con su `Oficial`): una homebrew (la Ingeniería mágica) vuelve
     * homebrew la ficha; prohibirla, no (propietario, 2026-10-31).
     */
    escuelaEspecialista?: ConOficial | null;
    /** Los conjuros elegidos en la sesión de conjuros abierta, que aún no están en `Personaje.Conjuros`. */
    conjurosEnSesion?: ConOficial[];
    /** Las fusiones de la formación de Incarnum, del catálogo de fusiones. */
    fusiones?: ConOficial[];
    /**
     * Los chakras de la formación de Incarnum (donde se moldea cada fusión y al que se vincula), del catálogo de chakras:
     * tienen `Oficial` desde el hito 8 del roadmap de inserciones, que deja dar de alta chakras homebrew.
     */
    chakras?: ConOficial[];
}

/** El motivo de homebrew de las ventajas y desventajas (un sistema propio, decisión del propietario del 2026-10-25). */
export const MOTIVO_VENTAJAS_HOMEBREW = 'Ventajas y desventajas (homebrew)';

/** Las familias de elementos que pueden volver homebrew al personaje. */
export type FamiliaHomebrew =
    | 'raza' | 'raza_base' | 'deidad' | 'clase' | 'plantilla' | 'subtipo' | 'dote' | 'racial' | 'idioma' | 'conjuro'
    | 'escuela_especialista' | 'fusion' | 'chakra' | 'familiar' | 'companero';

export interface FamiliaHomebrewInfo {
    /** Cómo se nombra en los motivos («Clase homebrew: …») y en las fuentes de la campaña («Clase: …»). */
    etiqueta: string;
    /** La tabla de la API con la que la cuenta (`_COLUMNA_ID`, `utils/character_creation.py`). */
    tablaApi: string;
    /**
     * Su oficialidad va con los datos de Básicos («Deidad no oficial», que se confirma al salir del paso), no en los
     * motivos de `motivosHomebrewPersonaje`; sí es fuente de la campaña.
     */
    oficialidadEnBasicos?: true;
    /** Sin manual en la API (`_TABLAS_SIN_MANUAL`): cada elemento es su propia fuente. */
    sinManual?: true;
}

/**
 * La única lista de lo que vuelve homebrew al personaje, la misma que la de la API (`_detect_general_homebrew_sources`,
 * `utils/character_creation.py`): de ella salen los motivos de la oficialidad y las fuentes de la política de campaña
 * (todas sus familias son fuentes; la deidad y los idiomas, desde el 2026-10-31). Una prueba del backend
 * (`tests/test_fuentes_homebrew_web.py`) compara estas tablas con las de la API.
 */
export const FAMILIAS_HOMEBREW: Readonly<Record<FamiliaHomebrew, FamiliaHomebrewInfo>> = {
    raza: { etiqueta: 'Raza', tablaApi: 'razas' },
    raza_base: { etiqueta: 'Raza base', tablaApi: 'razas' },
    deidad: { etiqueta: 'Deidad', tablaApi: 'deidades', oficialidadEnBasicos: true },
    clase: { etiqueta: 'Clase', tablaApi: 'clases' },
    plantilla: { etiqueta: 'Plantilla', tablaApi: 'plantillas' },
    subtipo: { etiqueta: 'Subtipo', tablaApi: 'subtipos' },
    dote: { etiqueta: 'Dote', tablaApi: 'dotes' },
    racial: { etiqueta: 'Racial', tablaApi: 'raciales', sinManual: true },
    idioma: { etiqueta: 'Idioma', tablaApi: 'idiomas', sinManual: true },
    conjuro: { etiqueta: 'Conjuro', tablaApi: 'conjuros' },
    escuela_especialista: { etiqueta: 'Escuela de especialista', tablaApi: 'escuelas_conjuros', sinManual: true },
    fusion: { etiqueta: 'Fusión', tablaApi: 'soulmelds' },
    chakra: { etiqueta: 'Chakra', tablaApi: 'chakras', sinManual: true },
    familiar: { etiqueta: 'Familiar', tablaApi: 'monstruos' },
    companero: { etiqueta: 'Compañero', tablaApi: 'monstruos' },
};

/** Un elemento no oficial que usa el personaje. */
export interface ElementoHomebrew {
    familia: FamiliaHomebrew;
    id: number;
    nombre: string;
    /** El nombre de su manual; vacío si no tiene o si su familia no lleva manual en la API. */
    manual: string;
    /** No cuenta como fuente de la campaña aunque su familia sí: la escuela fija de una clase homebrew suya. */
    yaContado?: boolean;
}

/**
 * Una fuente homebrew para el límite de la campaña, como la cuenta la API (`clave_fuente_homebrew`): el manual de sus
 * elementos o, sin manual, el propio elemento. `nombre` es lo que se enseña («Manual de la casa (Clase: X, Dote: Y)» o
 * «Racial: Z»).
 */
export interface FuenteHomebrew {
    key: string;
    nombre: string;
    elementos: ElementoHomebrew[];
}

function nombreDeManual(manual: ConOficial['Manual']): string {
    return `${(typeof manual === 'string' ? manual : manual?.Nombre) ?? ''}`.trim();
}

/** Un elemento de catálogo de esa familia como elemento homebrew (sin mirar su `Oficial`). */
function elementoHomebrew(familia: FamiliaHomebrew, elemento: ConOficial): ElementoHomebrew {
    return {
        familia,
        id: Math.trunc(Number(elemento?.Id ?? 0)) || 0,
        nombre: `${elemento?.Nombre ?? ''}`.trim(),
        manual: FAMILIAS_HOMEBREW[familia].sinManual ? '' : nombreDeManual(elemento?.Manual),
    };
}

function noOficiales(familia: FamiliaHomebrew, elementos: (ConOficial | null | undefined)[] | null | undefined): ElementoHomebrew[] {
    return (elementos ?? [])
        .filter((elemento): elemento is ConOficial => !!elemento && elemento.Oficial === false)
        .map((elemento) => elementoHomebrew(familia, elemento));
}

/** «Clase homebrew: Magiingeniero». */
function textoMotivo(elemento: ElementoHomebrew): string {
    return `${FAMILIAS_HOMEBREW[elemento.familia].etiqueta} homebrew: ${elemento.nombre || 'sin nombre'}`;
}

/** Si la escuela es la fija de una clase homebrew del personaje: ya la trae esa clase (`_escuela_especialista_homebrew`). */
function escuelaDeClaseHomebrew(escuela: ElementoHomebrew, clases: ClaseConOficial[] | undefined): boolean {
    return escuela.id > 0 && (clases ?? []).some((clase) => clase?.Oficial === false
        && Math.trunc(Number(clase?.Conjuros?.Escuela_especialista?.Id ?? 0)) === escuela.id);
}

/**
 * Los elementos no oficiales que usa el personaje (decisión del propietario del 2026-10-17: con uno solo, el personaje es
 * homebrew entero), por familia de `FAMILIAS_HOMEBREW`: la raza y la raza base, la deidad, las clases, las plantillas, los
 * subtipos, las dotes, los raciales, los idiomas, los conjuros (los conocidos, los de la sesión abierta y las aptitudes
 * sortílegas), la escuela de especialista, las fusiones y sus chakras, el familiar y el compañero. Las ventajas y las restricciones
 * saltadas (alineamiento, edad…) van aparte.
 */
export function elementosHomebrewPersonaje(personaje: Personaje | null | undefined, contexto: ContextoOficialidad): ElementoHomebrew[] {
    const escuelas = noOficiales('escuela_especialista', [contexto.escuelaEspecialista])
        .map((escuela) => escuelaDeClaseHomebrew(escuela, contexto.clases) ? { ...escuela, yaContado: true } : escuela);
    return [
        ...noOficiales('raza', [contexto.raza]),
        ...noOficiales('raza_base', [contexto.razaBase]),
        ...noOficiales('deidad', [contexto.deidad]),
        ...noOficiales('clase', contexto.clases),
        ...noOficiales('plantilla', contexto.plantillas),
        ...noOficiales('subtipo', contexto.subtipos),
        ...noOficiales('dote', (personaje?.DotesContextuales ?? []).map((item) => item?.Dote)),
        ...noOficiales('racial', personaje?.Raciales as ConOficial[]),
        ...noOficiales('idioma', personaje?.Idiomas as ConOficial[]),
        ...noOficiales('conjuro', [
            ...(personaje?.Conjuros ?? []),
            ...(contexto.conjurosEnSesion ?? []),
            ...(personaje?.Sortilegas ?? []).map((sortilega) => sortilega?.Conjuro),
        ] as ConOficial[]),
        ...escuelas,
        ...noOficiales('fusion', contexto.fusiones),
        ...noOficiales('chakra', contexto.chakras),
        ...noOficiales('familiar', personaje?.Familiares as ConOficial[]),
        ...noOficiales('companero', personaje?.Companeros as ConOficial[]),
    ];
}

/**
 * Los motivos por los que el personaje es homebrew: sus elementos no oficiales (`elementosHomebrewPersonaje`) y las
 * ventajas y desventajas. Vacío si todo es oficial. Sin repetidos (una aptitud sortílega que también conoce). La deidad
 * no está: su oficialidad va con los datos de Básicos (`oficialidadEnBasicos`).
 */
export function motivosHomebrewPersonaje(personaje: Personaje | null | undefined, contexto: ContextoOficialidad): string[] {
    const motivos = elementosHomebrewPersonaje(personaje, contexto)
        .filter((elemento) => !FAMILIAS_HOMEBREW[elemento.familia].oficialidadEnBasicos)
        .map(textoMotivo);
    return Array.from(new Set([...motivos, ...(contexto.tieneVentajas ? [MOTIVO_VENTAJAS_HOMEBREW] : [])]));
}

/**
 * La clave de la fuente de un elemento, como `clave_fuente_homebrew` de la API: su manual (`manual:<nombre>`) o, sin
 * manual, el elemento (`<tabla de la API>:<id>`; la raza y la raza base son la misma tabla). `null` sin id ni nombre.
 */
function claveFuenteHomebrew(elemento: ElementoHomebrew): string | null {
    if (elemento.manual.length > 0)
        return `manual:${normalizarTexto(elemento.manual, true)}`;
    if (!Number.isFinite(elemento.id) || elemento.id <= 0 || elemento.nombre.length < 1)
        return null;
    return `${FAMILIAS_HOMEBREW[elemento.familia].tablaApi}:${elemento.id}`;
}

/**
 * La fuente homebrew (`claveFuenteHomebrew`) de un elemento de catálogo de esa familia, para saber si la campaña deja
 * elegirlo; `null` si es oficial (o no se sabe) o no tiene id ni nombre.
 */
export function claveFuenteHomebrewDe(familia: FamiliaHomebrew, elemento: ConOficial | null | undefined): string | null {
    const [homebrew] = noOficiales(familia, [elemento]);
    return homebrew ? claveFuenteHomebrew(homebrew) : null;
}

/** «Clase: Magiingeniero». */
export function textoElementoHomebrew(elemento: ElementoHomebrew): string {
    return `${FAMILIAS_HOMEBREW[elemento.familia].etiqueta}: ${elemento.nombre || 'sin nombre'}`;
}

/**
 * Las fuentes homebrew del personaje para el límite de la campaña: sus elementos homebrew, agrupados por fuente como en
 * la API (los de un mismo manual homebrew son una sola fuente).
 */
export function fuentesHomebrewDeCampana(elementos: readonly ElementoHomebrew[]): FuenteHomebrew[] {
    const fuentes = new Map<string, FuenteHomebrew>();
    elementos
        .filter((elemento) => !elemento.yaContado)
        .forEach((elemento) => {
            const key = claveFuenteHomebrew(elemento);
            if (!key)
                return;
            const fuente = fuentes.get(key);
            if (!fuente)
                fuentes.set(key, { key, nombre: '', elementos: [elemento] });
            else if (!fuente.elementos.some((otro) => textoElementoHomebrew(otro) === textoElementoHomebrew(elemento)))
                fuente.elementos.push(elemento);
        });
    return Array.from(fuentes.values()).map((fuente) => ({
        ...fuente,
        nombre: fuente.elementos[0].manual.length > 0
            ? `${fuente.elementos[0].manual} (${fuente.elementos.map(textoElementoHomebrew).join(', ')})`
            : textoElementoHomebrew(fuente.elementos[0]),
    }));
}

/**
 * Antes de aplicar una elección de la creación que vuelve homebrew la ficha (guía de nuevo personaje, «Homebrew»): los
 * motivos que hay que confirmar, o ninguno si la ficha ya es homebrew por otra cosa (no se vuelve a preguntar) o si la
 * elección no la vuelve homebrew. Sin repetidos ni vacíos.
 */
export function motivosQueConfirmar(motivos: (string | null | undefined)[], yaEsHomebrew: boolean): string[] {
    if (yaEsHomebrew)
        return [];
    return Array.from(new Set(motivos.map((motivo) => `${motivo ?? ''}`.trim()).filter((motivo) => motivo.length > 0)));
}

/**
 * «Clase homebrew: Magiingeniero» de un elemento no oficial de esa familia, con el mismo texto que los motivos de
 * `motivosHomebrewPersonaje`; `null` si es oficial (o no se sabe).
 */
export function motivoHomebrew(familia: FamiliaHomebrew, elemento: ConOficial | null | undefined): string | null {
    const [homebrew] = noOficiales(familia, [elemento]);
    return homebrew ? textoMotivo(homebrew) : null;
}
