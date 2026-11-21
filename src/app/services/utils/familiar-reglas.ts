import { Clase } from 'src/app/interfaces/clase';
import {
    FamiliarAptitudNivel,
    FamiliarBonosNivel,
    FamiliarMonstruoDetalle,
    FamiliarPlantillaProgresion,
    FamiliarProgresion,
    FamiliarTabla,
    MonstruoDetalle,
    MonstruoNivelClase,
} from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { toInt, toPositiveInt } from 'src/app/services/utils/normalizacion';
import { idPlantillaDeNivel, razonesAlineamientoMascota } from 'src/app/services/utils/nivel-clase-monstruo';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import {
    AptitudesMascotaDelNivel,
    aptitudesMascotaDelNivel,
    catalogoDeMascotaDesdeMonstruos,
    EstadoMascota,
    filaDelNivel,
    FilaMascotaResuelta,
    filasDeSusListas,
    filasQueLeValen,
    resolverEstadoMascota,
    resolverFilaMascota,
    TextosMascota,
} from 'src/app/services/utils/mascota-cupos';

/*
 * El familiar, de los datos (contrato: `docs/publica/endpoints/catalogos.md`, «El familiar, de los datos»; la API lo
 * comprueba al guardar con las mismas reglas, `utils/familiar.py`). Sin ids ni nombres fijos; lo común con el compañero,
 * en `mascota-cupos.ts`:
 * - **el nivel del amo** suma lo que aporta cada clase cuya tabla da una aptitud con `Otorga_familiar`, según su `Mascota`
 *   (el filo aojador, −3 y la lista del hechicero: con 4 niveles, un familiar de nivel 1), desde el nivel en que la da;
 * - **la lista**: las filas de `Niveles_clase` de las clases de su `Mascota.Lista`, con su pseudoplantilla, la dote que la
 *   abre (Dragón familiar, Familiar mejorado…), el nivel mínimo del amo y, si la fila lo pide, su ataque base (el perro
 *   intermitente del familiar mejorado, +5: *El combatiente completo*, pág. 99);
 * - **la tabla** de su pseudoplantilla (`GET /familiares/progresion`; sin la suya, la de por defecto, la del Manual del
 *   jugador): la armadura natural, la Inteligencia y la resistencia a conjuros de su nivel, y lo que da cada nivel, al amo
 *   o al familiar, sin lo que excluye su plantilla (el mejorado no se comunica con los animales de su mismo tipo).
 */

/**
 * Id de la pseudoplantilla de un familiar (`Niveles_clase[].Plantilla.Id` de los monstruos, `Pseudoplantillas_familiares`
 * en la base). Sale de los datos: cualquier pseudoplantilla que dé el contrato vale, no solo las cinco del Manual del jugador.
 */
export type FamiliarPlantillaId = number;

/** Una pseudoplantilla de familiar tal como la da el contrato (la `Plantilla` de cada fila de `Niveles_clase`). */
export type FamiliarPlantillaOpcion = MonstruoNivelClase['Plantilla'];

/** Las clases que le dan el familiar, su cupo, el nivel del amo y las listas de las que elige. */
export type EstadoCuposFamiliar = EstadoMascota;

export interface FiltroFamiliaresElegiblesInput {
    familiares: FamiliarMonstruoDetalle[];
    estado: EstadoCuposFamiliar;
    alineamientoPersonaje: string;
    plantillaSeleccionada: FamiliarPlantillaId | null;
    incluirHomebrew: boolean;
    /** Las dotes del personaje (las que abren una fila de la lista: Dragón familiar, Familiar mejorado…). */
    dotesPersonaje: ReadonlySet<number>;
}

export interface FamiliarElegibilidadEvaluadaItem {
    familiar: FamiliarMonstruoDetalle;
    elegible: boolean;
    razones: string[];
    nivelMinimoRequerido: number | null;
}

/** La tabla que sigue un familiar con su pseudoplantilla, y la fila de esa tabla al nivel de su amo. */
export interface TablaDelFamiliar {
    /** Su pseudoplantilla en `GET /familiares/progresion` (`null` si no está). */
    plantilla: FamiliarPlantillaProgresion | null;
    tabla: FamiliarTabla | null;
    nivel: number;
    bonos: FamiliarBonosNivel;
}

/** Cómo se llama el familiar y su lista en las frases (también las del reciclaje, `reciclaje-mascota.ts`). */
export const TEXTOS_FAMILIAR: TextosMascota = { mascota: 'familiar', listaDe: 'familiares', listaPorDefecto: 'su clase' };

const SIN_BONOS: FamiliarBonosNivel = { Nivel: 0, Armadura_natural: 0, Inteligencia: null, Rc_sobre_nivel: null };

/**
 * Las fuentes del familiar, su cupo (uno por personaje), el nivel del amo y las listas de las que elige. Sin nivel del amo
 * (un filo aojador 3), ninguna clase le da un familiar.
 */
export function resolverEstadoCuposFamiliar(personaje: Personaje, catalogoClases: Clase[]): EstadoCuposFamiliar {
    return resolverEstadoMascota(personaje, catalogoClases, 'Otorga_familiar', personaje?.Familiares, 1);
}

/**
 * Las pseudoplantillas que el catálogo da en las listas de familiar del personaje (todas, si no hay ninguna), una vez
 * cada una y por nombre: son las opciones del filtro de plantilla del selector.
 */
export function plantillasFamiliarDisponibles(
    familiares: FamiliarMonstruoDetalle[],
    listasIds: number[] = []
): FamiliarPlantillaOpcion[] {
    const listas = new Set(listasIds.map((id) => toInt(id)).filter((id) => id > 0));
    const plantillas = new Map<number, FamiliarPlantillaOpcion>();
    (Array.isArray(familiares) ? familiares : []).forEach((familiar) => {
        (familiar?.Niveles_clase ?? []).forEach((nivel) => {
            const id = idPlantillaDeNivel(nivel);
            if (id < 1 || (listas.size > 0 && !listas.has(toInt(nivel?.Clase?.Id))))
                return;
            // El primer nombre que no esté vacío, como en el catálogo de familiares.
            if (!plantillas.get(id)?.Nombre)
                plantillas.set(id, { Id: id, Nombre: `${nivel?.Plantilla?.Nombre ?? ''}`.trim() });
        });
    });
    return Array.from(plantillas.values()).sort(porNombre);
}

/**
 * Los familiares que se pueden elegir en la creación: uno por monstruo marcado como familiar y pseudoplantilla de sus filas
 * de `Niveles_clase`, con esas filas: las de familiar (su `Mascota`); las de un compañero (el animal celestial de Compañero
 * elevado) no hacen un familiar.
 */
export function construirCatalogoFamiliaresDesdeMonstruos(monstruos: MonstruoDetalle[]): FamiliarMonstruoDetalle[] {
    return catalogoDeMascotaDesdeMonstruos(monstruos, 'familiar', (monstruo) => !!monstruo?.Familiar,
        (entrada, id): FamiliarMonstruoDetalle => ({ ...entrada, Id_familiar: id }));
}

/** La clave de un familiar del catálogo de la creación: su monstruo y su pseudoplantilla. */
export function claveFamiliar(familiar: FamiliarMonstruoDetalle | null | undefined): string {
    return `${toInt(familiar?.Id_familiar)}:${Math.max(0, toInt(familiar?.Plantilla?.Id))}`;
}

/**
 * La fila de la lista con la que el personaje tiene a ese familiar (de sus listas, con su pseudoplantilla, con la dote que
 * la abre, al nivel de su amo y, si la fila lo pide, con su ataque base) y el nivel de su tabla (el del amo: en el familiar, el ajuste es 0). Si no puede tenerlo,
 * `fila` es `null` y `razones` dice por qué.
 */
export function resolverFilaFamiliar(
    familiar: FamiliarMonstruoDetalle,
    estado: EstadoCuposFamiliar,
    dotesPersonaje: ReadonlySet<number>,
): FilaMascotaResuelta {
    return resolverFilaMascota(familiar, estado, dotesPersonaje, TEXTOS_FAMILIAR);
}

export function filtrarFamiliaresElegibles(input: FiltroFamiliaresElegiblesInput): FamiliarMonstruoDetalle[] {
    return evaluarFamiliaresElegibilidad(input)
        .filter((item) => item.elegible)
        .map((item) => item.familiar);
}

/**
 * Las filas de sus listas con las que se juzga el alineamiento: las que le valen (con su dote, a su nivel y con su ataque
 * base) o, si no hay, las más cercanas. Cada fila es una forma de tenerlo, con su preferencia de alineamiento (en el convocador divino, la de
 * su senda).
 */
function filasParaElAlineamiento(familiar: FamiliarMonstruoDetalle, estado: EstadoCuposFamiliar, dotes: ReadonlySet<number>): MonstruoNivelClase[] {
    const deSusListas = filasDeSusListas(familiar, new Set(estado?.listasIds ?? []));
    const { conDote, aSuNivel, conSuAtaque } = filasQueLeValen(deSusListas, estado, dotes);
    return [conSuAtaque, aSuNivel, conDote, deSusListas, familiar?.Niveles_clase ?? []].find((filas) => filas.length > 0) ?? [];
}

/** Si un familiar vale con lo que tiene el personaje y, si no, por qué (su lista, su dote, el nivel de su amo, su alineamiento). */
export function evaluarFamiliaresElegibilidad(input: FiltroFamiliaresElegiblesInput): FamiliarElegibilidadEvaluadaItem[] {
    const familiares = Array.isArray(input?.familiares) ? input.familiares : [];
    const plantillaSeleccionada: FamiliarPlantillaId | null = toPositiveInt(input?.plantillaSeleccionada);
    const dotes = input?.dotesPersonaje ?? new Set<number>();
    const dedupe = new Map<string, FamiliarElegibilidadEvaluadaItem>();

    familiares.forEach((familiar) => {
        if (toInt(familiar?.Id_familiar) <= 0)
            return;
        if (plantillaSeleccionada !== null && toInt(familiar?.Plantilla?.Id) !== plantillaSeleccionada)
            return;
        const resuelta = resolverFilaFamiliar(familiar, input.estado, dotes);
        const razones = [...resuelta.razones];
        if (!input?.incluirHomebrew && familiar?.Oficial === false)
            razones.push('Es una opción homebrew y el filtro Homebrew está desactivado.');
        razones.push(...razonesAlineamientoMascota(
            familiar?.Alineamientos_requeridos?.Familiar ?? [],
            filasParaElAlineamiento(familiar, input.estado, dotes),
            input?.alineamientoPersonaje ?? '',
            'familiar'
        ));

        const evaluacion: FamiliarElegibilidadEvaluadaItem = {
            familiar,
            elegible: razones.length < 1,
            razones: Array.from(new Set(razones)),
            nivelMinimoRequerido: resuelta.nivelMinimo,
        };
        const clave = claveFamiliar(familiar);
        const previa = dedupe.get(clave);
        if (!previa || (!previa.elegible && evaluacion.elegible))
            dedupe.set(clave, evaluacion);
    });

    return Array.from(dedupe.values())
        .sort((a, b) => compararTexto(a?.familiar?.Nombre, b?.familiar?.Nombre));
}

/** Lo que enseña el selector del familiar (`selector-familiar-modal`), del catálogo y del personaje. */
export interface EntradasSelectorFamiliar {
    /** Las pseudoplantillas del filtro (`plantillasFamiliarDisponibles` de sus listas). */
    plantillas: FamiliarPlantillaOpcion[];
    elegibles: FamiliarMonstruoDetalle[];
    bloqueados: Array<{ familiar: FamiliarMonstruoDetalle; razones: string[]; nivelMinimoRequerido: number | null; }>;
    /** El nivel del amo que pide cada uno, por `claveFamiliar`. */
    nivelesRequeridos: Record<string, number>;
}

/**
 * Las entradas del selector del familiar: las pseudoplantillas del filtro, los que puede elegir y los que no (con su
 * motivo) y el nivel que pide cada uno. Lo usan la creación y el reciclaje de la subida (`reciclaje-mascota.ts`).
 */
export function entradasDelSelectorFamiliar(input: FiltroFamiliaresElegiblesInput): EntradasSelectorFamiliar {
    const evaluaciones = evaluarFamiliaresElegibilidad(input);
    const nivelesRequeridos: Record<string, number> = {};
    evaluaciones.forEach((item) => {
        const nivel = Number(item?.nivelMinimoRequerido ?? 0);
        if (Number.isFinite(nivel) && nivel > 0)
            nivelesRequeridos[claveFamiliar(item.familiar)] = Math.trunc(nivel);
    });
    return {
        plantillas: plantillasFamiliarDisponibles(input?.familiares ?? [], input?.estado?.listasIds ?? []),
        nivelesRequeridos,
        elegibles: evaluaciones.filter((item) => item.elegible).map((item) => item.familiar),
        bloqueados: evaluaciones.filter((item) => !item.elegible).map((item) => ({
            familiar: item.familiar, razones: [...(item.razones ?? [])], nivelMinimoRequerido: item.nivelMinimoRequerido ?? null,
        })),
    };
}

/**
 * El familiar de una ficha guardada con los valores de su criatura (`monstruo`, su `Monstruo_origen`): la ficha trae sus
 * totales (la armadura natural, la Inteligencia y el ataque con lo del nivel de su amo) y lo de su nivel se le suma al
 * guardar, como en la creación. También las filas de la lista y las dotes de su criatura (las suyas, las de la creación,
 * se quedan). Lo usa la carga de las sesiones antes de hidratar el motor.
 */
export function familiarConSuCriatura(familiar: FamiliarMonstruoDetalle, monstruo: MonstruoDetalle): FamiliarMonstruoDetalle {
    const caracteristicas = { ...(familiar?.Caracteristicas ?? {}) } as Record<string, number | null>;
    const delMonstruo = (monstruo?.Caracteristicas ?? {}) as Record<string, number | null>;
    ['Inteligencia', 'Inteligencia_modificador', 'Constitucion', 'Constitucion_modificador'].forEach((clave) => {
        caracteristicas[clave] = delMonstruo[clave] ?? null;
    });
    return {
        ...familiar,
        Monstruo_origen: { Id: toInt(monstruo?.Id), Nombre: `${monstruo?.Nombre ?? familiar?.Monstruo_origen?.Nombre ?? ''}`.trim() },
        Dados_golpe: monstruo?.Dados_golpe ?? familiar?.Dados_golpe,
        Defensa: { ...(familiar?.Defensa ?? monstruo?.Defensa), Armadura_natural: toInt(monstruo?.Defensa?.Armadura_natural) },
        Ataque: { ...(familiar?.Ataque ?? monstruo?.Ataque), Ataque_base: toInt(monstruo?.Ataque?.Ataque_base) },
        Caracteristicas: caracteristicas as FamiliarMonstruoDetalle['Caracteristicas'],
        Niveles_clase: [...(monstruo?.Niveles_clase ?? [])],
        Dotes: [
            ...(familiar?.Dotes ?? []).filter((item) => item?.Contexto?.Entidad === 'personaje'),
            ...(monstruo?.Dotes ?? []),
        ],
    };
}

/**
 * La tabla que sigue un familiar con esa pseudoplantilla (la suya o, sin ella, la de por defecto: la del Manual del
 * jugador) y su fila al nivel de su amo (sin ninguna, nada: armadura natural 0, la Inteligencia de su monstruo y sin RC).
 */
export function tablaDelFamiliar(progresion: FamiliarProgresion | null | undefined, idPlantilla: number, nivel: number): TablaDelFamiliar {
    const tablas = progresion?.Tablas ?? [];
    const plantilla = (progresion?.Plantillas ?? []).find((item) => item.Id === toInt(idPlantilla)) ?? null;
    const tabla = tablas.find((item) => plantilla?.Tabla && item.Id === plantilla.Tabla.Id)
        ?? tablas.find((item) => item.Por_defecto)
        ?? null;
    const nivelAmo = Math.max(0, toInt(nivel));
    return { plantilla, tabla, nivel: nivelAmo, bonos: filaDelNivel(tabla?.Bonos, nivelAmo) ?? SIN_BONOS };
}

/**
 * Lo que da su tabla a ese nivel del amo (Manual del jugador, págs. 44-45), como lo comprueba la API: lo del amo (al
 * personaje: las aptitudes; Alerta, como dote con su nota) y lo del familiar, sin lo que excluye su plantilla
 * (`Sin_aptitudes`). Una dote del familiar, si su monstruo no la tiene ya.
 */
export function aptitudesFamiliarDelNivel(
    tabla: TablaDelFamiliar,
    monstruoTieneDote: (idDote: number) => boolean,
): AptitudesMascotaDelNivel<FamiliarAptitudNivel> {
    return aptitudesMascotaDelNivel(tabla.tabla?.Aptitudes, tabla.nivel, {
        cumpleDote: () => true,
        monstruoTieneDote,
        sinAptitudes: new Set(tabla.plantilla?.Sin_aptitudes ?? []),
    });
}
