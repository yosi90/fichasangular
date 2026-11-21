import { Clase, ClaseEspecialMascota } from 'src/app/interfaces/clase';
import {
    CompaneroBonosNivel,
    CompaneroMonstruoDetalle,
    CompaneroProgresion,
    MonstruoDetalle,
    MonstruoNivelClase,
} from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { normalizarTexto, primerEntero, toBoolean, toInt } from 'src/app/services/utils/normalizacion';
import { razonesAlineamientoMascota, resolveDoteIdFromNivelClase } from 'src/app/services/utils/nivel-clase-monstruo';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { CupoMascota, resolverCupoMascota } from 'src/app/services/utils/mascota-cupos';
import { contarArmasNaturales } from 'src/app/services/utils/armas-naturales';

/*
 * El compañero animal, de los datos (contrato: `docs/publica/endpoints/catalogos.md`, «El compañero animal, de los
 * datos»; la API lo comprueba al guardar con las mismas reglas, `utils/companero_animal.py`). Sin ids ni nombres fijos:
 * - el nivel efectivo de druida suma lo que aporta cada clase cuya tabla da una aptitud con `Otorga_companero`, según su
 *   `Mascota` (máx(0, ⌊nivel / `Divisor`⌋ + `Ajuste`)), desde el nivel en que la da y, en un grupo opcional, solo si el
 *   personaje la eligió (el pirata que elige *Pelea sucia* no tiene compañero);
 * - la lista son las filas de `Niveles_clase` de la clase de su `Mascota.Lista` (el explorador, la del druida), cada una
 *   con su nivel mínimo, su `Ajuste` (lo que suma para la tabla), su plantilla y la dote que la abre;
 * - la tabla y las aptitudes de cada nivel, de `GET /companeros/progresion`, con el nivel efectivo más el ajuste de su fila.
 */

/** Una clase del personaje que le da el compañero, con lo que aporta a su nivel efectivo y la lista de la que elige. */
export interface FuenteCompanero {
    idClase: number;
    nombreClase: string;
    nivelActual: number;
    /** La aptitud de su tabla que da el compañero. */
    idEspecial: number;
    divisor: number;
    ajuste: number;
    /** máx(0, ⌊nivel / divisor⌋ + ajuste). */
    aporta: number;
    lista: { id: number; nombre: string; };
}

export interface EstadoCuposCompanero extends CupoMascota {
    /** El nivel efectivo de druida: lo que aporta cada fuente, sumado (Manual del jugador, pág. 36). */
    nivelEfectivoCompanero: number;
    fuentesCompanero: FuenteCompanero[];
    /** Las clases de cuyas filas de `Niveles_clase` elige (las `Mascota.Lista` de sus fuentes). */
    listasIds: number[];
}

export interface FiltroCompanerosElegiblesInput {
    companeros: CompaneroMonstruoDetalle[];
    estado: EstadoCuposCompanero;
    alineamientoPersonaje: string;
    incluirHomebrew: boolean;
    /** Las dotes del personaje (las que abren una fila de la lista: Compañero elevado). */
    dotesPersonaje: ReadonlySet<number>;
    nivelSeleccionado?: number | null;
}

export interface CompaneroElegibilidadEvaluadaItem {
    companero: CompaneroMonstruoDetalle;
    elegible: boolean;
    razones: string[];
    nivelMinimoRequerido: number | null;
    /** El ajuste de la fila que le vale (o de la de menos nivel): lo que su lista suma para la tabla. */
    ajuste: number;
}

/** La fila de la lista con la que el personaje tiene ese compañero y el nivel de la tabla que le toca. */
export interface FilaCompaneroResuelta {
    /** `null` si no puede tenerlo (con `razones`). */
    fila: MonstruoNivelClase | null;
    /** Su nivel efectivo de druida más el ajuste de su fila (0 o menos: aún no se puede elegir). */
    nivelTabla: number;
    nivelMinimo: number | null;
    ajuste: number;
    razones: string[];
}

/** Lo que da la tabla del compañero a un nivel: lo que tiene el amo y lo que tiene (y no tiene) el compañero. */
export interface AptitudesCompaneroDelNivel {
    /** Las aptitudes del amo (`amo` y `ambos`) que tiene a ese nivel. */
    delAmo: Array<{ Id: number; Nombre: string; }>;
    /** Las aptitudes del compañero (`mascota` y `ambos`) a ese nivel, con la alternativa de una dote que no cumple. */
    especiales: Array<{ Id: number; Nombre: string; }>;
    /** Las dotes adicionales que gana el compañero a ese nivel (las que cumple y su monstruo no tiene ya). */
    dotes: Array<{ Id: number; Nombre: string; }>;
    /** Las aptitudes y dotes de la tabla que el compañero no tiene a ese nivel (las de un nivel que no ha alcanzado). */
    especialesQueNo: number[];
    dotesQueNo: number[];
}

const SIN_BONOS: CompaneroBonosNivel = { Nivel: 0, Dg_adicionales: 0, Armadura_natural: 0, Fuerza_destreza: 0, Trucos_adicionales: 0 };

/** Un ajuste con su signo («−3», «+0»). */
export function textoAjuste(ajuste: number): string {
    const valor = toInt(ajuste);
    return valor < 0 ? `−${Math.abs(valor)}` : `+${valor}`;
}

interface AptitudCompaneroDeClase {
    idEspecial: number;
    nivel: number;
    opcional: boolean;
    mascota: ClaseEspecialMascota;
}

/**
 * Las aptitudes de la tabla de una clase que dan el compañero (`Otorga_companero`), cada una con el nivel en que la da (el
 * primero), si es de un grupo opcional y cómo cuenta (`Mascota`; sin él, divisor 1, ajuste 0 y la lista de la clase).
 */
function aptitudesCompaneroDeLaClase(clase: Clase | null | undefined): AptitudCompaneroDeClase[] {
    const porEspecial = new Map<number, AptitudCompaneroDeClase>();
    (clase?.Desglose_niveles ?? []).forEach((detalle) => {
        (detalle?.Especiales ?? []).forEach((especialNivel) => {
            if (!toBoolean(especialNivel?.Especial?.['Otorga_companero']))
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

/** Las listas de compañeros de todas las clases del catálogo (las clases cuyas filas de `Niveles_clase` son de compañero). */
export function listasDeCompaneroDelCatalogo(catalogoClases: Clase[] | null | undefined): Set<number> {
    const listas = new Set<number>();
    (catalogoClases ?? []).forEach((clase) => aptitudesCompaneroDeLaClase(clase)
        .forEach((aptitud) => listas.add(toInt(aptitud.mascota.Lista?.Id) || toInt(clase?.Id))));
    return listas;
}

/**
 * Las clases del personaje que le dan el compañero: las de su tabla con la aptitud a su nivel o antes y, si es de un grupo
 * opcional, elegida (está entre sus aptitudes, `Claseas`), con lo que aporta cada una.
 */
export function fuentesCompanero(personaje: Personaje, catalogoClases: Clase[]): FuenteCompanero[] {
    const clases = Array.isArray(catalogoClases) ? catalogoClases : [];
    const elegidas = new Set((personaje?.Claseas ?? []).map((especial) => toInt(especial?.Id)).filter((id) => id > 0));
    const porClave = new Map<string, FuenteCompanero>();
    (personaje?.desgloseClases ?? []).forEach((entrada) => {
        const nombreClase = `${entrada?.Nombre ?? ''}`.trim();
        const nivelActual = Math.max(0, toInt(entrada?.Nivel));
        const clase = clases.find((item) => normalizarTexto(item?.Nombre ?? '') === normalizarTexto(nombreClase));
        if (!clase || nivelActual < 1)
            return;
        aptitudesCompaneroDeLaClase(clase).forEach((aptitud) => {
            if (nivelActual < aptitud.nivel || (aptitud.opcional && !elegidas.has(aptitud.idEspecial)))
                return;
            const divisor = Math.max(1, toInt(aptitud.mascota.Divisor, 1));
            const ajuste = toInt(aptitud.mascota.Ajuste);
            const fuente: FuenteCompanero = {
                idClase: toInt(clase.Id),
                nombreClase: `${clase.Nombre ?? nombreClase}`.trim(),
                nivelActual,
                idEspecial: aptitud.idEspecial,
                divisor,
                ajuste,
                aporta: Math.max(0, Math.floor(nivelActual / divisor) + ajuste),
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

/** Las fuentes del compañero, su cupo (uno por personaje), su nivel efectivo de druida y las listas de las que elige. */
export function resolverEstadoCuposCompanero(personaje: Personaje, catalogoClases: Clase[]): EstadoCuposCompanero {
    const fuentes = fuentesCompanero(personaje, catalogoClases);
    const idsFuente = new Set(fuentes.map((fuente) => fuente.idClase));
    const cupo = resolverCupoMascota(personaje, catalogoClases, (clase) => idsFuente.has(toInt(clase?.Id)), personaje?.Companeros);
    return {
        ...cupo,
        nivelEfectivoCompanero: fuentes.reduce((total, fuente) => total + fuente.aporta, 0),
        fuentesCompanero: fuentes,
        listasIds: Array.from(new Set(fuentes.map((fuente) => fuente.lista.id))).filter((id) => id > 0),
    };
}

/** Los DG del compañero animal: los de su monstruo y los adicionales que le da el nivel de su amo (MJ, cap. 3). */
export function dadosGolpeCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number {
    return (primerEntero(companero?.Dados_golpe?.Cantidad) ?? 0) + Math.max(0, toInt(companero?.Dg_adi));
}

/**
 * Si una dote del compañero es suya y no de su monstruo: la que le da la creación (`Contexto.Entidad` «personaje») o la
 * que tiene guardada (`Companero`, en la ficha). Las de su monstruo no se quitan ni se vuelven a dar.
 */
export function esDotePropiaDelCompanero(item: { Contexto?: Record<string, any> | null; } | null | undefined): boolean {
    const entidad = normalizarTexto(`${item?.Contexto?.['Entidad'] ?? ''}`);
    return entidad === 'personaje' || entidad === 'companero';
}

/** Las armas naturales del compañero (las de su monstruo), para los prerrequisitos de sus dotes (Ataque múltiple). */
export function armasNaturalesDelCompanero(companero: MonstruoDetalle | null | undefined): number {
    return contarArmasNaturales({ Armas_naturales: companero?.Armas_naturales ?? [] });
}

/** El nombre de una lista para las frases («nivel efectivo de druida»). */
function nombreDeLista(nombre: string | null | undefined): string {
    const texto = `${nombre ?? ''}`.trim();
    return texto.length > 0 ? texto.toLocaleLowerCase('es') : 'druida';
}

/**
 * La fila de la lista con la que el personaje tiene a ese compañero (de sus listas, con su plantilla, con la dote que la
 * abre y a su nivel efectivo; entre las que valen, la de más nivel de tabla, como la API) y el nivel de la tabla que le
 * toca. Si no puede tenerlo, `fila` es `null` y `razones` dice por qué.
 */
export function resolverFilaCompanero(
    companero: CompaneroMonstruoDetalle,
    estado: EstadoCuposCompanero,
    dotesPersonaje: ReadonlySet<number>,
): FilaCompaneroResuelta {
    const nivelEfectivo = Math.max(0, toInt(estado?.nivelEfectivoCompanero));
    const listas = new Set(estado?.listasIds ?? []);
    const idPlantilla = Math.max(0, toInt(companero?.Plantilla?.Id));
    const nombre = `${companero?.Nombre ?? ''}`.trim();
    const filas = (companero?.Niveles_clase ?? []).filter((fila) =>
        listas.has(toInt(fila?.Clase?.Id)) && Math.max(0, toInt(fila?.Plantilla?.Id)) === idPlantilla && toInt(fila?.Nivel) >= 0);
    const resultado = (razones: string[], filasMinimo: MonstruoNivelClase[]): FilaCompaneroResuelta => {
        const minima = filasMinimo.length > 0 ? filasMinimo.reduce((a, b) => toInt(b.Nivel) < toInt(a.Nivel) ? b : a) : null;
        return {
            fila: null, nivelTabla: 0, razones,
            nivelMinimo: minima ? Math.max(0, toInt(minima.Nivel)) : null,
            ajuste: minima ? toInt(minima.Ajuste) : 0,
        };
    };
    if (filas.length < 1) {
        const nombres = Array.from(new Set((estado?.fuentesCompanero ?? []).map((fuente) => nombreDeLista(fuente.lista.nombre))));
        return resultado([nombres.length > 0
            ? `No está en la lista de compañeros animales de tus clases (${nombres.join(', ')}).`
            : 'Ninguna de tus clases da un compañero animal.'], []);
    }
    const conDote = filas.filter((fila) => resolveDoteIdFromNivelClase(fila) <= 0 || dotesPersonaje.has(resolveDoteIdFromNivelClase(fila)));
    if (conDote.length < 1) {
        const dotes = Array.from(new Set(filas.map((fila) => `«${`${fila?.Dote?.Nombre ?? ''}`.trim() || 'la dote de su lista'}»`)));
        return resultado([`Hace falta la dote ${dotes.join(' o ')} para tenerlo como compañero animal.`], filas);
    }
    const aSuNivel = conDote.filter((fila) => toInt(fila.Nivel) <= nivelEfectivo);
    if (aSuNivel.length < 1) {
        const minima = conDote.reduce((a, b) => toInt(b.Nivel) < toInt(a.Nivel) ? b : a);
        return resultado([`Pide un nivel efectivo de ${nombreDeLista(minima?.Clase?.Nombre)} ${Math.max(0, toInt(minima.Nivel))}, y tienes ${nivelEfectivo}.`], conDote);
    }
    const fila = aSuNivel.reduce((a, b) => toInt(b.Ajuste) > toInt(a.Ajuste) ? b : a);
    const nivelTabla = nivelEfectivo + toInt(fila.Ajuste);
    const nivelMinimo = Math.min(...conDote.map((item) => Math.max(0, toInt(item.Nivel))));
    if (nivelTabla < 1) {
        return {
            fila: null, nivelTabla, nivelMinimo, ajuste: toInt(fila.Ajuste),
            razones: [`Con el ajuste de su lista (${textoAjuste(toInt(fila.Ajuste))}), «${nombre}» se queda sin nivel efectivo de ${nombreDeLista(fila?.Clase?.Nombre)}: aún no se puede elegir.`],
        };
    }
    return { fila, nivelTabla, nivelMinimo, ajuste: toInt(fila.Ajuste), razones: [] };
}

export function filtrarCompanerosElegibles(input: FiltroCompanerosElegiblesInput): CompaneroMonstruoDetalle[] {
    return evaluarCompanerosElegibilidad(input)
        .filter((item) => item.elegible)
        .map((item) => item.companero);
}

/** Si un compañero vale con lo que tiene el personaje y, si no, por qué (su lista, su dote, su nivel, su alineamiento). */
export function evaluarCompanerosElegibilidad(input: FiltroCompanerosElegiblesInput): CompaneroElegibilidadEvaluadaItem[] {
    const companeros = Array.isArray(input?.companeros) ? input.companeros : [];
    const nivelSeleccionado = Math.max(0, toInt(input?.nivelSeleccionado));
    const dotes = input?.dotesPersonaje ?? new Set<number>();
    const listas = new Set(input?.estado?.listasIds ?? []);
    const dedupe = new Map<string, CompaneroElegibilidadEvaluadaItem>();

    companeros.forEach((companero) => {
        const idCompanero = toInt(companero?.Id_companero);
        if (idCompanero <= 0)
            return;
        const resuelta = resolverFilaCompanero(companero, input.estado, dotes);
        const razones = [...resuelta.razones];
        if (!input?.incluirHomebrew && companero?.Oficial === false)
            razones.push('Es una opción homebrew y el filtro Homebrew está desactivado.');
        if (resuelta.fila && nivelSeleccionado > 0 && toInt(resuelta.fila.Nivel) !== nivelSeleccionado)
            razones.push(`No cumple el filtro de nivel ${nivelSeleccionado}.`);
        const filasDeSusListas = (companero?.Niveles_clase ?? []).filter((fila) =>
            listas.has(toInt(fila?.Clase?.Id)) && Math.max(0, toInt(fila?.Plantilla?.Id)) === Math.max(0, toInt(companero?.Plantilla?.Id)));
        razones.push(...razonesAlineamientoMascota(
            companero?.Alineamientos_requeridos?.Companero ?? [],
            filasDeSusListas,
            input?.alineamientoPersonaje ?? '',
            'compañero'
        ));

        const evaluacion: CompaneroElegibilidadEvaluadaItem = {
            companero,
            elegible: razones.length < 1,
            razones: Array.from(new Set(razones)),
            nivelMinimoRequerido: resuelta.nivelMinimo,
            ajuste: resuelta.ajuste,
        };
        const clave = claveCompanero(companero);
        const previa = dedupe.get(clave);
        if (!previa || (!previa.elegible && evaluacion.elegible))
            dedupe.set(clave, evaluacion);
    });

    return Array.from(dedupe.values())
        .sort((a, b) => compararTexto(a?.companero?.Nombre, b?.companero?.Nombre));
}

/** Los niveles mínimos de las filas con que el personaje puede tener los compañeros que puede elegir (el filtro «Nivel»). */
export function resolverNivelesCompaneroDisponibles(input: Omit<FiltroCompanerosElegiblesInput, 'nivelSeleccionado'>): number[] {
    const niveles = new Set<number>();
    filtrarCompanerosElegibles({ ...input, nivelSeleccionado: null }).forEach((companero) => {
        const fila = resolverFilaCompanero(companero, input.estado, input.dotesPersonaje ?? new Set<number>()).fila;
        if (fila)
            niveles.add(Math.max(0, toInt(fila.Nivel)));
    });
    return Array.from(niveles).sort((a, b) => a - b);
}

/** La clave de un compañero del catálogo de la creación: su monstruo y su plantilla. */
export function claveCompanero(companero: CompaneroMonstruoDetalle | null | undefined): string {
    return `${toInt(companero?.Id_companero)}:${Math.max(0, toInt(companero?.Plantilla?.Id))}`;
}

/**
 * Los compañeros que se pueden elegir en la creación: uno por monstruo marcado como compañero y plantilla de sus filas de
 * `Niveles_clase` (sin plantilla, `Plantilla.Id` 0; los animales celestiales de Compañero elevado, la «Celestial»), con
 * esas filas. Con `listasCompanero` (las de `listasDeCompaneroDelCatalogo`), solo las filas de esas listas: las de un
 * familiar no hacen un compañero.
 */
export function construirCatalogoCompanerosDesdeMonstruos(
    monstruos: MonstruoDetalle[],
    listasCompanero?: ReadonlySet<number> | null,
): CompaneroMonstruoDetalle[] {
    const resultado: CompaneroMonstruoDetalle[] = [];
    (Array.isArray(monstruos) ? monstruos : []).forEach((monstruo) => {
        const id = toInt(monstruo?.Id);
        if (!monstruo?.Companero || id <= 0)
            return;
        const porPlantilla = new Map<number, MonstruoNivelClase[]>();
        (monstruo?.Niveles_clase ?? [])
            .filter((fila) => !listasCompanero || listasCompanero.has(toInt(fila?.Clase?.Id)))
            .forEach((fila) => {
                const idPlantilla = Math.max(0, toInt(fila?.Plantilla?.Id));
                porPlantilla.set(idPlantilla, [...(porPlantilla.get(idPlantilla) ?? []), fila]);
            });
        porPlantilla.forEach((filas, idPlantilla) => {
            resultado.push({
                ...monstruo,
                Id_companero: id,
                Monstruo_origen: { Id: id, Nombre: `${monstruo?.Nombre ?? ''}`.trim() },
                Vida: 0,
                Dg_adi: 0,
                Trucos_adi: 0,
                Plantilla: {
                    Id: idPlantilla,
                    Nombre: idPlantilla > 0 ? `${filas[0]?.Plantilla?.Nombre ?? ''}`.trim() : '',
                },
                Niveles_clase: filas,
                Especiales: [],
                Personajes: [],
            });
        });
    });
    return resultado.sort((a, b) => porNombre(a, b) || toInt(a.Plantilla?.Id) - toInt(b.Plantilla?.Id));
}

/** La fila de la tabla del compañero que toca a ese nivel (la última que empieza en él o antes); sin ninguna, todo a 0. */
export function bonosCompaneroDelNivel(progresion: CompaneroProgresion | null | undefined, nivel: number): CompaneroBonosNivel {
    let toca = SIN_BONOS;
    (progresion?.Bonos ?? []).forEach((fila) => {
        if (toInt(fila.Nivel) <= toInt(nivel) && toInt(fila.Nivel) >= toca.Nivel)
            toca = fila;
    });
    return toca;
}

/** La fila de la tabla que ya lleva un compañero, por sus DG adicionales (distintos en cada fila); sin ella, todo a 0. */
export function bonosCompaneroPorDgAdicionales(progresion: CompaneroProgresion | null | undefined, dgAdicionales: number): CompaneroBonosNivel {
    return (progresion?.Bonos ?? []).find((fila) => toInt(fila.Dg_adicionales) === toInt(dgAdicionales)) ?? SIN_BONOS;
}

/**
 * Lo que da la tabla del compañero a ese nivel de la tabla (Manual del jugador, pág. 36), como lo comprueba la API: las
 * aptitudes del amo, y las del compañero (y las que no le tocan aún). Una dote se gana como dote adicional si la cumple
 * (`cumpleDote`, los prerrequisitos de armas naturales) y su monstruo no la tiene ya; si no la cumple, su `Alternativa`
 * (el lobo de druida 9 gana el segundo mordisco y no Ataque múltiple).
 */
export function aptitudesCompaneroDelNivel(
    progresion: CompaneroProgresion | null | undefined,
    nivelTabla: number,
    opciones: { cumpleDote: (idDote: number) => boolean; monstruoTieneDote: (idDote: number) => boolean; },
): AptitudesCompaneroDelNivel {
    const resultado: AptitudesCompaneroDelNivel = { delAmo: [], especiales: [], dotes: [], especialesQueNo: [], dotesQueNo: [] };
    (progresion?.Aptitudes ?? []).forEach((aptitud) => {
        const llega = toInt(aptitud.Nivel) <= toInt(nivelTabla);
        const alAmo = aptitud.Destinatario === 'amo' || aptitud.Destinatario === 'ambos';
        const alCompanero = aptitud.Destinatario === 'mascota' || aptitud.Destinatario === 'ambos';
        if (aptitud.Especial) {
            if (alAmo && llega)
                resultado.delAmo.push(aptitud.Especial);
            if (alCompanero)
                llega ? resultado.especiales.push(aptitud.Especial) : resultado.especialesQueNo.push(aptitud.Especial.Id);
            return;
        }
        if (!aptitud.Dote || !alCompanero)
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
