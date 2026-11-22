import { Clase, ClaseEspecialMascota } from 'src/app/interfaces/clase';
import { Id_nombre } from 'src/app/interfaces/genericas';
import {
    EspecialContextualMonstruo,
    MascotaAptitudNivel,
    MascotaDeFila,
    MonstruoDetalle,
    MonstruoNivelClase,
    MonstruoOrigenRef,
    PersonajeRefMonstruo,
} from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { normalizarTexto, primerEntero, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { doteDeNivelClase, idPlantillaDeNivel } from 'src/app/services/utils/nivel-clase-monstruo';
import { porNombre } from 'src/app/services/utils/orden-texto';

/*
 * Lo común de las mascotas, el compañero animal (`companero-reglas.ts`) y el familiar (`familiar-reglas.ts`), de los datos
 * (contrato: `docs/publica/endpoints/catalogos.md`, «El compañero animal, de los datos» y «El familiar, de los datos»; la
 * API lo comprueba al guardar con las mismas reglas, `utils/mascotas.py`). Sin ids ni nombres fijos:
 * - **las fuentes**: las clases del personaje cuya tabla da una aptitud con `Otorga_companero` u `Otorga_familiar`, desde
 *   el nivel en que la da y, en un grupo opcional, solo si la eligió; cada una aporta máx(0, ⌊nivel / `Divisor`⌋ +
 *   `Ajuste`) de su `Mascota` y elige de la lista de `Mascota.Lista`. **El nivel efectivo** es la suma;
 * - **el cupo**: una mascota de cada clase por personaje, aunque la den varias clases;
 * - **la lista**: las filas de `Niveles_clase` de esas listas con la plantilla de la mascota, la dote que la abre, el
 *   nivel mínimo y, si la fila lo pide, el ataque base del personaje (`resolverFilaMascota`), y el catálogo de la creación, una entrada por monstruo y plantilla con las filas
 *   de esa mascota (`Mascota` de cada fila: `filasPorPlantilla`);
 * - **lo que da cada nivel** (`mascota_aptitudes`): al amo, a la mascota o a los dos (`aptitudesMascotaDelNivel`), y la
 *   fila de una tabla por nivel (`filaDelNivel`).
 */

/**
 * Lo que dicen la ficha y la hoja de una mascota inactiva (`Inactiva`, contrato: `personajes.md`, «La mascota inactiva, y
 * la mascota en los cambios de la ficha»): la ficha no trae el motivo, que sí dice «Lo que cambia» de la vía que la deja así.
 */
export const NOTA_MASCOTA_INACTIVA = 'inactivo hasta que vuelva a cumplir lo que pide su fila';
export const AYUDA_MASCOTA_INACTIVA = 'No cumple lo que pide su fila de la lista (el nivel efectivo, la clase que la da, la dote que la abre o el ataque base de su amo): vale la criatura tal cual, sin lo que le da el nivel de su amo, y el amo pierde lo que le daba. Vuelve a estar activo, sin ceremonia, cuando vuelva a cumplir.';

/** La columna de `Especial` que dice que una aptitud da cada mascota (el nombre de la columna del contrato, no un dato). */
export type OtorgaMascota = 'Otorga_companero' | 'Otorga_familiar';

/** Una clase del personaje que le da la mascota (el familiar o el compañero animal), con su nivel. */
export interface MascotaFuenteClase {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
}

/** Las clases que dan la mascota y su cupo. */
export interface CupoMascota {
    fuentes: MascotaFuenteClase[];
    fuentesClaseIds: number[];
    fuentesTotales: number;
    cuposConsumidos: number;
    cuposDisponibles: number;
}

/** Una clase del personaje que le da la mascota, con lo que aporta a su nivel efectivo y la lista de la que elige. */
export interface FuenteMascota {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
    /** La aptitud de su tabla que da la mascota. */
    idEspecial: number;
    divisor: number;
    ajuste: number;
    /** máx(0, ⌊nivel / divisor⌋ + ajuste). */
    aporta: number;
    lista: { id: number; nombre: string; };
}

/** Las fuentes de la mascota, su cupo, su nivel efectivo (la suma de lo que aportan) y las listas de las que elige. */
export interface EstadoMascota extends CupoMascota {
    /** El nivel efectivo: el de druida del compañero (MJ, pág. 36) o el del amo del familiar (MJ, pág. 44). */
    nivelEfectivo: number;
    fuentesMascota: FuenteMascota[];
    /** Las clases de cuyas filas de `Niveles_clase` elige (las `Mascota.Lista` de sus fuentes). */
    listasIds: number[];
    /**
     * El ataque base del personaje, el primero de su `Ataque_base` («+7/+2» → 7; sin número, 0), como la API: el que mira
     * una fila de la lista con `Ataque_base_minimo`.
     */
    ataqueBase: number;
}

/** Lo que dicen las frases de la lista de una mascota. */
export interface TextosMascota {
    /** «compañero animal», «familiar». */
    mascota: string;
    /** La lista: «compañeros animales», «familiares». */
    listaDe: string;
    /** El nombre de la lista si la fila no lo trae («druida», «hechicero»). */
    listaPorDefecto: string;
}

/** La fila de la lista con la que el personaje tiene esa mascota y el nivel de su tabla. */
export interface FilaMascotaResuelta {
    /** `null` si no puede tenerla (con `razones`). */
    fila: MonstruoNivelClase | null;
    /** Su nivel efectivo más el ajuste de su fila (0 o menos: aún no se puede elegir). */
    nivelTabla: number;
    nivelMinimo: number | null;
    ajuste: number;
    razones: string[];
    /**
     * Lo que no cumple, dicho de la mascota que ya tiene (la que queda inactiva), con las frases de la API sin el punto
     * (`utils/mascotas.py`, `frase_de_inactiva`; contrato: `personajes.md`, «Las frases de "queda inactivo"»): «El
     * compañero animal «Bisonte» pide un nivel efectivo de druida 4, y el personaje tiene 3». Vacío si puede tenerla.
     */
    motivo: string;
}

/**
 * Lo que da la tabla de una mascota a un nivel: lo que tiene el amo y lo que tiene (y no tiene) la mascota. `A`, las
 * aptitudes de su tabla (las del compañero, con su alternativa; las del familiar, con su nota).
 */
export interface AptitudesMascotaDelNivel<A extends MascotaAptitudNivel = MascotaAptitudNivel> {
    /** Las aptitudes del amo (`amo` y `ambos`) que tiene a ese nivel. */
    delAmo: Id_nombre[];
    /** Las dotes del amo (`amo` y `ambos`) que tiene a ese nivel, con su fila de la tabla (Alerta y su nota). */
    dotesDelAmo: A[];
    /** Las aptitudes de la mascota (`mascota` y `ambos`) a ese nivel, con la alternativa de una dote que no cumple. */
    especiales: Id_nombre[];
    /** Las dotes adicionales que gana la mascota a ese nivel (las que cumple y su monstruo no tiene ya). */
    dotes: Id_nombre[];
    /** Las aptitudes y dotes de la tabla que la mascota no tiene a ese nivel (de un nivel que no ha alcanzado o excluidas). */
    especialesQueNo: number[];
    dotesQueNo: number[];
}

interface AptitudMascotaDeClase {
    idEspecial: number;
    nivel: number;
    opcional: boolean;
    mascota: ClaseEspecialMascota;
}

/** Los ids de las clases que dan la mascota (`CupoMascota.fuentesClaseIds`), como conjunto y sin los que no son ids. */
export function idsClasesFuente(fuentesClaseIds: readonly unknown[] | null | undefined): Set<number> {
    return new Set((fuentesClaseIds ?? []).map((id) => toNumber(id)).filter((id) => id > 0));
}

/** La clase del catálogo de una entrada del desglose del personaje, por su nombre. */
function claseDelDesglose(clases: Clase[], nombreClase: string): Clase | undefined {
    return clases.find((item) => normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombreClase));
}

/** Cada clase una vez, con su nivel más alto. */
function sinFuentesRepetidas(fuentes: MascotaFuenteClase[]): MascotaFuenteClase[] {
    const byClassId = new Map<number, MascotaFuenteClase>();
    fuentes.forEach((fuente) => {
        const idClase = toNumber(fuente?.idClase);
        if (idClase <= 0)
            return;
        if (!byClassId.has(idClase)) {
            byClassId.set(idClase, {
                idClase,
                nombreClase: `${fuente?.nombreClase ?? ''}`.trim(),
                nivelActual: Math.max(0, toNumber(fuente?.nivelActual)),
            });
            return;
        }
        const previa = byClassId.get(idClase)!;
        if (toNumber(fuente?.nivelActual) > toNumber(previa?.nivelActual))
            byClassId.set(idClase, { ...previa, nivelActual: Math.max(0, toNumber(fuente?.nivelActual)) });
    });
    return Array.from(byClassId.values());
}

/**
 * Las clases del personaje que le dan la mascota (`otorgaFuente`) y su cupo: una sola mascota de cada clase de mascota por
 * personaje (MJ, cap. 3), aunque la den varias clases; sus niveles se suman para ella. `mascotas`, las que ya tiene.
 */
export function resolverCupoMascota(
    personaje: Personaje,
    catalogoClases: Clase[],
    otorgaFuente: (clase: Clase | undefined, nivelActual: number) => boolean,
    mascotas: readonly unknown[] | null | undefined
): CupoMascota {
    const desglose = Array.isArray(personaje?.desgloseClases) ? personaje.desgloseClases : [];
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];

    const fuentesRaw: MascotaFuenteClase[] = desglose.map((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, toInt(entrada?.Nivel));
        const clase = claseDelDesglose(clases, nombreClase);
        if (!otorgaFuente(clase, nivelActual))
            return null;
        return {
            idClase: toNumber(clase?.Id),
            nombreClase: `${clase?.Nombre ?? nombreClase}`.trim(),
            nivelActual,
        };
    }).filter((item): item is MascotaFuenteClase => !!item);

    const fuentes = sinFuentesRepetidas(fuentesRaw);
    const fuentesClaseIds = fuentes
        .map((fuente) => toNumber(fuente?.idClase))
        .filter((id) => id > 0);
    const fuentesTotales = fuentesClaseIds.length;
    const cuposConsumidos = (mascotas ?? []).length;
    const cuposDisponibles = Math.max(0, (fuentesTotales > 0 ? 1 : 0) - cuposConsumidos);

    return { fuentes, fuentesClaseIds, fuentesTotales, cuposConsumidos, cuposDisponibles };
}

/**
 * Las aptitudes de la tabla de una clase que dan la mascota (`otorga`), cada una con el nivel en que la da (el primero),
 * si es de un grupo opcional y cómo cuenta (`Mascota`; sin él, divisor 1, ajuste 0 y la lista de la clase).
 */
export function aptitudesMascotaDeLaClase(clase: Clase | null | undefined, otorga: OtorgaMascota): AptitudMascotaDeClase[] {
    const porEspecial = new Map<number, AptitudMascotaDeClase>();
    (clase?.Desglose_niveles ?? []).forEach((detalle) => {
        (detalle?.Especiales ?? []).forEach((especialNivel) => {
            if (!toBoolean(especialNivel?.Especial?.[otorga]))
                return;
            const idEspecial = toInt(especialNivel?.Especial?.['Id']);
            const nivel = Math.max(1, toInt(especialNivel?.Nivel ?? detalle?.Nivel));
            const opcional = toInt(especialNivel?.Opcional) > 0;
            const mascota: ClaseEspecialMascota = especialNivel?.Mascota ?? {
                Divisor: 1, Ajuste: 0, Lista: { Id: toInt(clase?.Id), Nombre: `${clase?.Nombre ?? ''}` },
            };
            const previa = porEspecial.get(idEspecial);
            if (!previa) {
                porEspecial.set(idEspecial, { idEspecial, nivel, opcional, mascota });
                return;
            }
            previa.nivel = Math.min(previa.nivel, nivel);
            previa.opcional = previa.opcional || opcional;
        });
    });
    return Array.from(porEspecial.values());
}

/** Lo que aporta una clase a su nivel al nivel efectivo de la mascota: máx(0, ⌊nivel / `Divisor`⌋ + `Ajuste`) de su `Mascota`. */
export function aportaDeLaClase(nivelClase: number, mascota: Pick<ClaseEspecialMascota, 'Divisor' | 'Ajuste'>): number {
    return Math.max(0, Math.floor(Math.max(0, toInt(nivelClase)) / Math.max(1, toInt(mascota?.Divisor, 1))) + toInt(mascota?.Ajuste));
}

/**
 * Lo que aporta la clase al nivel efectivo de la mascota en el nivel en que su tabla se la da (el druida 1, 1; el explorador
 * 4, 2; el filo aojador 4, 1); sin ninguna aptitud que la dé, 0. El reciclaje no baja de él (`reciclaje-mascota.ts`).
 */
export function aportaAlDarLaMascota(clase: Clase | null | undefined, otorga: OtorgaMascota): number {
    const aptitudes = aptitudesMascotaDeLaClase(clase, otorga);
    return aptitudes.length > 0 ? Math.min(...aptitudes.map((aptitud) => aportaDeLaClase(aptitud.nivel, aptitud.mascota))) : 0;
}

/**
 * Las clases del personaje que le dan la mascota: las de su tabla con la aptitud a su nivel o antes y, si es de un grupo
 * opcional, elegida (está entre sus aptitudes, `Claseas`), con lo que aporta cada una.
 */
export function fuentesMascota(personaje: Personaje, catalogoClases: Clase[], otorga: OtorgaMascota): FuenteMascota[] {
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];
    const elegidas = new Set((personaje?.Claseas ?? []).map((especial) => toInt(especial?.Id)).filter((id) => id > 0));
    // Las aptitudes que ha perdido por una ex clase (`Perdida_por` de la ficha, con el nombre de la ex clase: el ex druida
    // pierde «Compañero animal», MJ pág. 37): los niveles de esa clase no suman al nivel efectivo de la mascota, y los de otra
    // que da la misma aptitud (el explorador), sí (contrato: personajes.md, «La mascota y el alineamiento»).
    const perdidaPor = new Map<number, Set<string>>();
    (personaje?.Claseas ?? []).forEach((especial) => {
        const nombres = (especial?.Perdida_por ?? []).map((n) => normalizarTexto(n ?? '')).filter((n) => n.length > 0);
        if (nombres.length > 0 && toInt(especial?.Id) > 0)
            perdidaPor.set(toInt(especial.Id), new Set([...(perdidaPor.get(toInt(especial.Id)) ?? []), ...nombres]));
    });
    const porClave = new Map<string, FuenteMascota>();
    (personaje?.desgloseClases ?? []).forEach((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, toInt(entrada?.Nivel));
        const clase = claseDelDesglose(clases, nombreClase);
        if (!clase || nivelActual < 1)
            return;
        aptitudesMascotaDeLaClase(clase, otorga).forEach((aptitud) => {
            if (nivelActual < aptitud.nivel || (aptitud.opcional && !elegidas.has(aptitud.idEspecial)))
                return;
            const ex = normalizarTexto(`${entrada?.Ex?.Nombre ?? ''}`);
            if (ex.length > 0 && perdidaPor.get(aptitud.idEspecial)?.has(ex))
                return;
            const fuente: FuenteMascota = {
                idClase: toInt(clase.Id),
                nombreClase: `${clase.Nombre ?? nombreClase}`.trim(),
                nivelActual,
                idEspecial: aptitud.idEspecial,
                divisor: Math.max(1, toInt(aptitud.mascota.Divisor, 1)),
                ajuste: toInt(aptitud.mascota.Ajuste),
                aporta: aportaDeLaClase(nivelActual, aptitud.mascota),
                lista: {
                    id: toInt(aptitud.mascota.Lista?.Id) || toInt(clase.Id),
                    nombre: `${aptitud.mascota.Lista?.Nombre || clase.Nombre || ''}`.trim(),
                },
            };
            const clave = `${fuente.idClase}:${fuente.idEspecial}`;
            const previa = porClave.get(clave);
            if (!previa || previa.nivelActual < fuente.nivelActual)
                porClave.set(clave, fuente);
        });
    });
    return Array.from(porClave.values());
}

/**
 * Las fuentes de la mascota, su cupo (una por personaje), su nivel efectivo y las listas de las que elige. Con
 * `nivelMinimo`, por debajo de él no la da ninguna clase (el familiar, sin nivel del amo: el filo aojador 3).
 */
export function resolverEstadoMascota(
    personaje: Personaje,
    catalogoClases: Clase[],
    otorga: OtorgaMascota,
    mascotas: readonly unknown[] | null | undefined,
    nivelMinimo = 0,
): EstadoMascota {
    const todas = fuentesMascota(personaje, catalogoClases, otorga);
    const nivel = todas.reduce((total, fuente) => total + fuente.aporta, 0);
    const fuentes = nivel < nivelMinimo ? [] : todas;
    const idsFuente = new Set(fuentes.map((fuente) => fuente.idClase));
    const cupo = resolverCupoMascota(personaje, catalogoClases, (clase) => idsFuente.has(toInt(clase?.Id)), mascotas);
    return {
        ...cupo,
        nivelEfectivo: fuentes.length > 0 ? nivel : 0,
        fuentesMascota: fuentes,
        listasIds: Array.from(new Set(fuentes.map((fuente) => fuente.lista.id))).filter((id) => id > 0),
        ataqueBase: primerEntero(personaje?.Ataque_base) ?? 0,
    };
}

/** El nombre de una lista para las frases («nivel efectivo de druida»). */
function nombreDeLista(nombre: string | null | undefined, porDefecto: string): string {
    const texto = `${nombre ?? ''}`.trim();
    return (texto.length > 0 ? texto : porDefecto).toLocaleLowerCase('es');
}

/** Las filas de `Niveles_clase` de la mascota en esas listas (las de sus clases) y con su plantilla. */
export function filasDeSusListas(
    mascota: Pick<MonstruoDetalle, 'Niveles_clase'> & { Plantilla?: { Id: number; } | null; },
    listas: ReadonlySet<number>,
): MonstruoNivelClase[] {
    const idPlantilla = Math.max(0, toInt(mascota?.Plantilla?.Id));
    return (mascota?.Niveles_clase ?? []).filter((fila) =>
        listas.has(toInt(fila?.Clase?.Id)) && idPlantillaDeNivel(fila) === idPlantilla);
}

/** Si el personaje tiene el ataque base que pide la fila (`Ataque_base_minimo`; sin mínimo, sí). */
export function cumpleAtaqueBaseDeFila(fila: MonstruoNivelClase, ataqueBase: number): boolean {
    const minimo = fila?.Ataque_base_minimo;
    return minimo === null || minimo === undefined || toInt(ataqueBase) >= toInt(minimo);
}

/**
 * Las `filas` de la mascota que le valen al personaje, paso a paso y en el orden de la API (`filas_a_su_nivel`): con la
 * dote que la abre entre sus `dotes`, además a su nivel efectivo y, además, con el ataque base que pida la fila. Lo usan
 * `resolverFilaMascota` (que dice el primer paso que falla) y el alineamiento del familiar (que juzga con el último que
 * tenga filas).
 */
export function filasQueLeValen(
    filas: MonstruoNivelClase[],
    estado: Pick<EstadoMascota, 'nivelEfectivo' | 'ataqueBase'> | null | undefined,
    dotes: ReadonlySet<number>,
): { conDote: MonstruoNivelClase[]; aSuNivel: MonstruoNivelClase[]; conSuAtaque: MonstruoNivelClase[]; } {
    const nivelEfectivo = Math.max(0, toInt(estado?.nivelEfectivo));
    const ataqueBase = toInt(estado?.ataqueBase);
    const conDote = filas.filter((fila) => {
        const dote = doteDeNivelClase(fila);
        return !dote || dotes.has(dote.id);
    });
    const aSuNivel = conDote.filter((fila) => toInt(fila.Nivel) <= nivelEfectivo);
    const conSuAtaque = aSuNivel.filter((fila) => cumpleAtaqueBaseDeFila(fila, ataqueBase));
    return { conDote, aSuNivel, conSuAtaque };
}

/** La fila de menos nivel. */
function filaDeMenosNivel(filas: MonstruoNivelClase[]): MonstruoNivelClase {
    return filas.reduce((a, b) => toInt(b.Nivel) < toInt(a.Nivel) ? b : a);
}

/** El id del monstruo de una mascota: el de su `Monstruo_origen` (la de una ficha) o su `Id` (la del catálogo). */
export function idDelMonstruo(mascota: { Id?: number; Monstruo_origen?: { Id?: number; } | null; } | null | undefined): number {
    return toInt(mascota?.Monstruo_origen?.Id) || toInt(mascota?.Id);
}

/** El nombre de la criatura de una mascota en las frases de la que ya tiene: el de su monstruo, como la API («Lobo»). */
export function criaturaDeLaMascota(mascota: { Nombre?: string; Monstruo_origen?: { Nombre?: string; } | null; }): string {
    return `${mascota?.Monstruo_origen?.Nombre ?? ''}`.trim() || `${mascota?.Nombre ?? ''}`.trim();
}

/**
 * La fila de la lista con la que el personaje tiene a esa mascota (de sus listas, con su plantilla, con la dote que la
 * abre, a su nivel efectivo y, si la fila lo pide, con su ataque base; entre las que valen, la de más nivel de tabla, como
 * la API) y el nivel de la tabla que le toca (su nivel efectivo más el `Ajuste` de la fila: en el familiar, 0). Si no
 * puede tenerla, `fila` es `null`, `razones` dice por qué al elegirla, en el orden de la API (la lista, la dote, el nivel
 * y el ataque base), y `motivo`, lo mismo de la que ya tiene. `sinPrerrequisitos`, las dotes que tiene sin sus
 * prerrequisitos (no van en `dotesPersonaje`): si es la de la fila, el `motivo` lo dice.
 */
export function resolverFilaMascota(
    mascota: Pick<MonstruoDetalle, 'Nombre' | 'Niveles_clase'> & { Plantilla?: { Id: number; } | null; Monstruo_origen?: { Nombre?: string; } | null; },
    estado: Pick<EstadoMascota, 'nivelEfectivo' | 'listasIds' | 'fuentesMascota' | 'ataqueBase'> | null | undefined,
    dotesPersonaje: ReadonlySet<number>,
    textos: TextosMascota,
    sinPrerrequisitos: ReadonlySet<number> = new Set<number>(),
): FilaMascotaResuelta {
    const nivelEfectivo = Math.max(0, toInt(estado?.nivelEfectivo));
    const listas = new Set(estado?.listasIds ?? []);
    const filas = filasDeSusListas(mascota, listas).filter((fila) => toInt(fila?.Nivel) >= 0);
    const criatura = criaturaDeLaMascota(mascota);
    const la = `El ${textos.mascota} «${criatura}»`;
    const resultado = (razones: string[], motivo: string, filasMinimo: MonstruoNivelClase[]): FilaMascotaResuelta => {
        const minima = filasMinimo.length > 0 ? filaDeMenosNivel(filasMinimo) : null;
        return {
            fila: null, nivelTabla: 0, razones, motivo,
            nivelMinimo: minima ? Math.max(0, toInt(minima.Nivel)) : null,
            ajuste: minima ? toInt(minima.Ajuste) : 0,
        };
    };
    if (filas.length < 1) {
        const nombres = Array.from(new Set((estado?.fuentesMascota ?? []).map((fuente) => nombreDeLista(fuente.lista.nombre, textos.listaPorDefecto))));
        if (nombres.length < 1)
            return resultado([`Ninguna de tus clases da un ${textos.mascota}.`], `Ninguna clase del personaje le da ya un ${textos.mascota}`, []);
        const conOtraPlantilla = (mascota?.Niveles_clase ?? []).some((fila) => listas.has(toInt(fila?.Clase?.Id)) && toInt(fila?.Nivel) >= 0);
        return resultado([`No está en la lista de ${textos.listaDe} de tus clases (${nombres.join(', ')}).`],
            conOtraPlantilla
                ? `${la}, con su plantilla, no está en la lista de ${textos.listaDe} de sus clases`
                : `${la} no está en la lista de ${textos.listaDe} de sus clases (${nombres.join(', ')})`, []);
    }
    const { conDote, aSuNivel, conSuAtaque } = filasQueLeValen(filas, estado, dotesPersonaje);
    if (conDote.length < 1) {
        const dotes = Array.from(new Set(filas.map((fila) => `«${doteDeNivelClase(fila)?.nombre || 'la dote de su lista'}»`))).join(' o ');
        const sinLosSuyos = filas.some((fila) => sinPrerrequisitos.has(toInt(doteDeNivelClase(fila)?.id)));
        return resultado([`Hace falta la dote ${dotes} para tenerlo como ${textos.mascota}.`],
            sinLosSuyos
                ? `${la} pide la dote ${dotes}, y el personaje la tiene sin sus prerrequisitos`
                : `Para tener «${criatura}» como ${textos.mascota} hace falta la dote ${dotes}`, filas);
    }
    if (aSuNivel.length < 1) {
        const minima = filaDeMenosNivel(conDote);
        const pide = `un nivel efectivo de ${nombreDeLista(minima?.Clase?.Nombre, textos.listaPorDefecto)} ${Math.max(0, toInt(minima.Nivel))}`;
        return resultado([`Pide ${pide}, y tienes ${nivelEfectivo}.`], `${la} pide ${pide}, y el personaje tiene ${nivelEfectivo}`, conDote);
    }
    if (conSuAtaque.length < 1) {
        const minimo = Math.min(...aSuNivel.map((fila) => toInt(fila.Ataque_base_minimo)));
        const ataqueBase = toInt(estado?.ataqueBase);
        return resultado([`Pide un ataque base de ${textoConSigno(minimo)} (tienes ${textoConSigno(ataqueBase)}).`],
            `${la} pide un ataque base de ${textoConSigno(minimo, '−')}, y el personaje tiene ${textoConSigno(ataqueBase, '−')}`, aSuNivel);
    }
    const fila = conSuAtaque.reduce((a, b) => toInt(b.Ajuste) > toInt(a.Ajuste) ? b : a);
    const nivelMinimo = Math.min(...conDote.map((item) => Math.max(0, toInt(item.Nivel))));
    return { fila, nivelTabla: nivelEfectivo + toInt(fila.Ajuste), nivelMinimo, ajuste: toInt(fila.Ajuste), razones: [], motivo: '' };
}

/**
 * Las filas de `Niveles_clase` de un monstruo que son de esa `mascota` (su `Mascota`: las de un familiar no hacen un
 * compañero, ni al revés; el animal celestial de Compañero elevado es de compañero), por plantilla (sin plantilla, 0):
 * cada plantilla es una entrada del catálogo de la creación.
 */
export function filasPorPlantilla(
    monstruo: Pick<MonstruoDetalle, 'Niveles_clase'> | null | undefined,
    mascota: MascotaDeFila,
): Map<number, MonstruoNivelClase[]> {
    const porPlantilla = new Map<number, MonstruoNivelClase[]>();
    (monstruo?.Niveles_clase ?? [])
        .filter((fila) => fila?.Mascota === mascota)
        .forEach((fila) => {
            const idPlantilla = idPlantillaDeNivel(fila);
            porPlantilla.set(idPlantilla, [...(porPlantilla.get(idPlantilla) ?? []), fila]);
        });
    return porPlantilla;
}

/** Lo común de una entrada del catálogo de la creación de una mascota (`catalogoDeMascotaDesdeMonstruos`). */
export type EntradaDeMascota = MonstruoDetalle & {
    Monstruo_origen: MonstruoOrigenRef;
    Vida: number;
    Plantilla: { Id: number; Nombre: string; };
    Niveles_clase: MonstruoNivelClase[];
    Especiales: EspecialContextualMonstruo[];
    Personajes: PersonajeRefMonstruo[];
};

/**
 * El catálogo de la creación de una mascota: una entrada por monstruo que puede serlo (`puedeSerlo`: su `Familiar` o su
 * `Companero`) y plantilla de sus filas de esa `mascota` (`filasPorPlantilla`), con esas filas y el nombre de su plantilla
 * (el primero que no esté vacío; sin plantilla, ninguno: «No aplica» es de relleno), por nombre y plantilla. `conSuId`
 * le pone lo de cada mascota (su `Id_familiar` o su `Id_companero` y, en el compañero, sus DG y trucos adicionales a 0).
 */
export function catalogoDeMascotaDesdeMonstruos<T>(
    monstruos: MonstruoDetalle[],
    mascota: MascotaDeFila,
    puedeSerlo: (monstruo: MonstruoDetalle) => boolean,
    conSuId: (entrada: EntradaDeMascota, id: number) => T,
): T[] {
    const entradas: EntradaDeMascota[] = [];
    (Array.isArray(monstruos) ? monstruos : []).forEach((monstruo) => {
        const id = toInt(monstruo?.Id);
        if (!puedeSerlo(monstruo) || id <= 0)
            return;
        filasPorPlantilla(monstruo, mascota).forEach((filas, idPlantilla) => {
            const nombrePlantilla = idPlantilla > 0
                ? filas.map((fila) => `${fila?.Plantilla?.Nombre ?? ''}`.trim()).find((nombre) => nombre.length > 0) ?? ''
                : '';
            entradas.push({
                ...monstruo,
                Monstruo_origen: { Id: id, Nombre: `${monstruo?.Nombre ?? ''}`.trim() },
                Vida: 0,
                Plantilla: { Id: idPlantilla, Nombre: nombrePlantilla },
                Niveles_clase: filas,
                Especiales: [],
                Personajes: [],
            });
        });
    });
    return entradas
        .sort((a, b) => porNombre(a, b) || toInt(a.Plantilla?.Id) - toInt(b.Plantilla?.Id))
        .map((entrada) => conSuId(entrada, toInt(entrada.Id)));
}

/** La fila de una tabla por nivel que toca a ese nivel: la última que empieza en él o antes; `null` por debajo de la primera. */
export function filaDelNivel<T extends { Nivel: number; }>(filas: readonly T[] | null | undefined, nivel: number): T | null {
    let toca: T | null = null;
    (filas ?? []).forEach((fila) => {
        if (toInt(fila.Nivel) <= toInt(nivel) && (!toca || toInt(fila.Nivel) >= toInt(toca.Nivel)))
            toca = fila;
    });
    return toca;
}

/**
 * Lo que da la tabla de una mascota a ese nivel, como lo comprueba la API: lo del amo, lo de la mascota y lo que aún no le
 * toca. Las de `sinAptitudes` (los `Id` de las filas que excluye su plantilla: el familiar mejorado no se comunica con los
 * animales de su mismo tipo) no las tiene nadie. Una dote se gana como dote adicional si la cumple (`cumpleDote`) y su
 * monstruo no la tiene ya; si no la cumple, su `Alternativa`, si la tiene (el lobo de druida 9 gana el segundo mordisco y
 * no Ataque múltiple).
 */
export function aptitudesMascotaDelNivel<A extends MascotaAptitudNivel & { Alternativa?: Id_nombre | null; }>(
    aptitudes: readonly A[] | null | undefined,
    nivel: number,
    opciones: {
        cumpleDote: (idDote: number) => boolean;
        monstruoTieneDote: (idDote: number) => boolean;
        sinAptitudes?: ReadonlySet<number>;
    },
): AptitudesMascotaDelNivel<A> {
    const resultado: AptitudesMascotaDelNivel<A> = { delAmo: [], dotesDelAmo: [], especiales: [], dotes: [], especialesQueNo: [], dotesQueNo: [] };
    (aptitudes ?? []).forEach((aptitud) => {
        const excluida = !!opciones.sinAptitudes?.has(toInt(aptitud.Id));
        const llega = !excluida && toInt(aptitud.Nivel) <= toInt(nivel);
        const alAmo = aptitud.Destinatario === 'amo' || aptitud.Destinatario === 'ambos';
        const aLaMascota = aptitud.Destinatario === 'mascota' || aptitud.Destinatario === 'ambos';
        if (aptitud.Especial) {
            if (alAmo && llega)
                resultado.delAmo.push(aptitud.Especial);
            if (aLaMascota)
                llega ? resultado.especiales.push(aptitud.Especial) : resultado.especialesQueNo.push(aptitud.Especial.Id);
            return;
        }
        if (!aptitud.Dote)
            return;
        if (alAmo && llega)
            resultado.dotesDelAmo.push(aptitud);
        if (!aLaMascota)
            return;
        const idDote = aptitud.Dote.Id;
        if (!opciones.cumpleDote(idDote)) {
            resultado.dotesQueNo.push(idDote);
            if (aptitud.Alternativa)
                llega ? resultado.especiales.push(aptitud.Alternativa) : resultado.especialesQueNo.push(aptitud.Alternativa.Id);
            return;
        }
        if (aptitud.Alternativa)
            resultado.especialesQueNo.push(aptitud.Alternativa.Id);
        if (!llega)
            resultado.dotesQueNo.push(idDote);
        else if (!opciones.monstruoTieneDote(idDote))
            resultado.dotes.push(aptitud.Dote);
    });
    return resultado;
}
