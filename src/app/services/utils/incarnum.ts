import { Clase } from 'src/app/interfaces/clase';
import { Dote } from 'src/app/interfaces/dote';
import {
    CapacidadEsencia,
    ClaseMoldeado,
    EsenciaRasgo,
    FormacionIncarnumDto,
    Fusion,
    PersonajeIncarnum,
    PersonajeIncarnumCd,
    PersonajeIncarnumClase,
    PersonajeIncarnumFormacion,
    PersonajeIncarnumParte,
    PersonajeIncarnumReceptaculo,
    PersonajeIncarnumRef,
} from 'src/app/interfaces/incarnum';
import { modificadorCaracteristica } from './caracteristicas';
import { normalizarTexto, toInt } from './normalizacion';

/*
 * Las reglas de Magic of Incarnum que la creación de personaje adelanta en la web (`docs/publica/INCARNUM.md`, «Qué hace
 * la web»): el bloque `incarnum` del personaje que se está creando, con el mismo cálculo que la API
 * (`api/controllers/personaje_incarnum.py`), los prerrequisitos nuevos, las fusiones que puede moldear cada clase y la
 * comprobación de la formación de partida (`api/controllers/incarnum_formacion.py`), con los mismos códigos. Quien decide
 * es la API al guardar; la web solo adelanta los límites. Todo sale de los datos: ningún nombre ni id fijo.
 */

/** La capacidad de esencia de la tabla para ese nivel de personaje; en el último tramo, +1 cada `Incremento_cada` niveles. */
export function capacidadBasica(nivelPersonaje: number, tabla: CapacidadEsencia[]): number {
    const nivel = Math.max(1, toInt(nivelPersonaje));
    for (const fila of [...tabla].sort((a, b) => a.Nivel_minimo - b.Nivel_minimo)) {
        if (nivel < fila.Nivel_minimo)
            continue;
        if (fila.Nivel_maximo === null) {
            const extra = fila.Incremento_cada ? Math.floor((nivel - fila.Nivel_minimo) / fila.Incremento_cada) : 0;
            return fila.Capacidad + extra;
        }
        if (nivel <= fila.Nivel_maximo)
            return fila.Capacidad;
    }
    return 0;
}

/** El nivel de moldeador: el nivel (de clase, o de personaje en una dote) entre su divisor. */
export function nivelMoldeador(nivel: number, divisor: number | null | undefined): number {
    return Math.floor(Math.max(0, toInt(nivel)) / Math.max(1, toInt(divisor, 1)));
}

/**
 * La capacidad con el bono de una dote de capacidad: la base más el bono, sin pasar del tope si la dote lo tiene (el
 * modificador de Constitución, Magic of Incarnum p. 38, «up to a maximum of your Constitution bonus»), y nunca por debajo
 * de la base. Como `capacidad_con_tope` de la API.
 */
export function capacidadConTope(base: number, bono: number, tope: number | null | undefined): number {
    if (tope === null || tope === undefined)
        return base + bono;
    return Math.max(base, Math.min(base + bono, tope));
}

/** El bono de capacidad de una clase a su nivel: el de la fila de nivel más alto que alcanza (es total, no se suma). */
function bonoCapacidad(filas: ClaseMoldeado['Capacidad'], nivelClase: number): number {
    const alcanzadas = filas.filter((fila) => fila.Nivel <= nivelClase);
    return alcanzadas.length > 0 ? alcanzadas.reduce((a, b) => (b.Nivel > a.Nivel ? b : a)).Bonificador : 0;
}

/**
 * Por chakra, la fila de nivel más alto que alcanza ese nivel de clase (son totales, no se suman): la capacidad de un
 * chakra y el nivel de moldeador de la fusión vinculada a él. Las filas sin chakra no cuentan.
 */
function filasPorChakra<T extends { Nivel: number; Chakra: { Id: number; } | null; }>(filas: T[], nivelClase: number): T[] {
    const porChakra = new Map<number, T>();
    filas.forEach((f) => {
        if (!f.Chakra || f.Nivel > nivelClase)
            return;
        const actual = porChakra.get(f.Chakra.Id);
        if (!actual || f.Nivel > actual.Nivel)
            porChakra.set(f.Chakra.Id, f);
    });
    return Array.from(porChakra.values());
}

const refDe = (item: { Id: number; Nombre: string; Nombre_original?: string | null; Traducido?: boolean; }): PersonajeIncarnumRef => ({
    id: item.Id, nombre: item.Nombre, nombreOriginal: item.Nombre_original ?? null, traducido: !!item.Traducido,
});

/** La referencia del elemento del catálogo o, si no está, la de su id con el nombre «#id». */
const refODesconocido = (item: Parameters<typeof refDe>[0] | null | undefined, id: number): PersonajeIncarnumRef =>
    item ? refDe(item) : { id, nombre: `#${id}`, nombreOriginal: null, traducido: false };

/** Las fusiones que puede moldear a la vez: las de sus clases y una por cada fusión que da una dote. */
export function fusionesALaVez(bloque: PersonajeIncarnum): number {
    return bloque.clases.reduce((suma, c) => suma + c.fusionesMaximas, 0) + bloque.fusionesDeDotes.length;
}

/**
 * Los vínculos que puede tener a la vez: los de sus clases. Las dotes Chakra … abierto solo abren su chakra; quien no
 * tiene vínculos de clase puede vincular una fusión en cada uno (decisión del 2026-10-29).
 */
export function vinculosALaVez(bloque: PersonajeIncarnum): number {
    const deClases = bloque.clases.reduce((suma, c) => suma + c.vinculos, 0);
    return deClases > 0 ? deClases : new Set(bloque.chakrasDeDotes.map((d) => d.chakra.id)).size;
}

/** Los chakras abiertos para vincular, sin repetir: los de sus clases y después los de sus dotes. */
export function chakrasAbiertos(bloque: PersonajeIncarnum): PersonajeIncarnumRef[] {
    const vistos = new Set<number>();
    return [...bloque.clases.flatMap((c) => c.chakrasAbiertos), ...bloque.chakrasDeDotes.map((d) => d.chakra)]
        .filter((chakra) => !vistos.has(chakra.id) && !!vistos.add(chakra.id));
}

/** Una dote del personaje con su ficha del catálogo y el extra elegido (el id del chakra o de la fusión). */
export interface DoteIncarnumEntrada {
    dote: Dote | null | undefined;
    idExtra: number;
}

/** Un racial o un especial del personaje con su `Esencia`. */
export interface RasgoIncarnumEntrada {
    id: number;
    nombre: string;
    esencia: EsenciaRasgo | null | undefined;
}

/** Lo que hace falta para calcular el bloque `incarnum` del personaje que se está creando. */
export interface EntradaIncarnumBorrador {
    clases: { clase: Clase | null | undefined; nombre: string; nivel: number; }[];
    dotes: DoteIncarnumEntrada[];
    raciales: RasgoIncarnumEntrada[];
    especiales: RasgoIncarnumEntrada[];
    /** Las puntuaciones por característica, con la clave de `normalizarTexto` de su nombre («constitucion»). */
    puntuaciones: Record<string, number>;
    /** Sus DG: niveles de clase, DG raciales y los de sus plantillas, sin ajustes de nivel. */
    nivelPersonaje: number;
    capacidad: CapacidadEsencia[];
    formacion?: FormacionIncarnumDto | null;
    /** Las fusiones del catálogo, para los nombres de la formación. */
    fusiones?: Fusion[];
}

/** La CD de una fusión con esa característica: `base` + la esencia invertida. */
function cdFusion(nombre: string, puntuaciones: Record<string, number>): PersonajeIncarnumCd {
    const modificador = modificadorCaracteristica(puntuaciones[normalizarTexto(nombre)] ?? 10);
    return { base: 10 + modificador, caracteristica: nombre, modificador };
}

/** La característica del moldeado que usa: la de la clase o la de una dote que la cambia (Moldeador muerto viviente). */
function sustituida(nombre: string, sustituciones: Map<string, string>): string {
    return sustituciones.get(normalizarTexto(nombre)) ?? nombre;
}

function claseIncarnum(
    nombre: string, nivel: number, clase: Clase, basica: number, puntuaciones: Record<string, number>,
    sustituciones: Map<string, string> = new Map(),
): PersonajeIncarnumClase | null {
    const m = clase.Moldeado;
    if (!m)
        return null;
    const filas = m.Niveles.filter((fila) => fila.Nivel <= nivel);
    if (filas.length < 1)
        return null;
    const fila = filas.reduce((a, b) => (b.Nivel > a.Nivel ? b : a));
    const caracteristica = m.Caracteristica_fusiones?.Nombre ? sustituida(m.Caracteristica_fusiones.Nombre, sustituciones) : null;
    const puntuacion = caracteristica ? puntuaciones[normalizarTexto(caracteristica)] : undefined;
    const maximas = puntuacion === undefined || puntuacion === null ? 0 : Math.max(0, Math.min(fila.Fusiones, puntuacion - 10));
    const bonoGeneral = bonoCapacidad(m.Capacidad.filter((f) => !f.Chakra), nivel);
    const nombreCd = m.Caracteristica_cd?.Nombre ? sustituida(m.Caracteristica_cd.Nombre, sustituciones) : null;
    const moldeador = nivelMoldeador(nivel, m.Divisor_nivel_moldeador);
    return {
        id: clase.Id,
        nombre,
        nivel,
        nivelMoldeador: moldeador,
        nivelMoldeadorChakras: filasPorChakra(m.Nivel_moldeador_chakras ?? [], nivel).map((f) => ({ chakra: refDe(f.Chakra), nivelMoldeador: moldeador + f.Bonificador })),
        fusionesTabla: fila.Fusiones,
        fusionesMaximas: maximas,
        caracteristicaFusiones: caracteristica,
        esencia: fila.Esencia,
        vinculos: fila.Vinculos,
        chakrasAbiertos: m.Chakras.filter((chakra) => chakra.Nivel <= nivel).map((chakra) => ({ ...refDe(chakra), nivel: chakra.Nivel })),
        capacidadFusiones: basica + bonoGeneral,
        capacidadChakras: filasPorChakra(m.Capacidad, nivel).map((f) => ({
            chakra: refDe(f.Chakra!), capacidad: basica + bonoGeneral + f.Bonificador,
        })),
        cd: nombreCd ? cdFusion(nombreCd, puntuaciones) : null,
        limitadoPorAlineamiento: m.Limitado_por_alineamiento,
    };
}

/** El chakra o la fusión elegidos como extra de una dote (Abrir chakra, Moldear fusión), con su nombre. */
function extraDe(dote: Dote, idExtra: number, tipo: 'Chakras' | 'Fusiones'): PersonajeIncarnumRef | null {
    const soporta = tipo === 'Chakras' ? dote.Extras_soportados?.Extra_chakra : dote.Extras_soportados?.Extra_fusion;
    if (!soporta || idExtra <= 0)
        return null;
    const item = (dote.Extras_disponibles?.[tipo] ?? []).find((extra) => extra.Id === idExtra);
    return refODesconocido(item, idExtra);
}

/**
 * El bloque `incarnum` del personaje que se está creando, con el mismo cálculo que la ficha de la API: reserva con su
 * desglose, capacidad, por clase fusiones a la vez, vínculos, chakras abiertos y CD, chakras y fusiones de dotes y
 * receptáculos. `null` si no tiene nada de incarnum.
 */
export function calcularIncarnumBorrador(e: EntradaIncarnumBorrador): PersonajeIncarnum | null {
    const basica = capacidadBasica(e.nivelPersonaje, e.capacidad);
    const nivel = Math.max(1, toInt(e.nivelPersonaje));
    const dotes = e.dotes.filter((d): d is { dote: Dote; idExtra: number; } => !!d.dote);
    const sustituciones = new Map(dotes
        .map(({ dote }) => dote.Incarnum?.Sustituye_caracteristica)
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => [normalizarTexto(s.De.Nombre), s.Por.Nombre] as [string, string]));
    const clases = e.clases
        .filter((c) => !!c.clase?.Moldeado)
        .map((c) => claseIncarnum(c.nombre, c.nivel, c.clase!, basica, e.puntuaciones, sustituciones))
        .filter((c): c is PersonajeIncarnumClase => !!c);
    const reserva: PersonajeIncarnumParte[] = clases.filter((c) => c.esencia > 0)
        .map((c) => ({ tipo: 'clase', origen: c.nombre, valor: c.esencia }));
    const fusionDeDote = (d: { dote: Dote; idExtra: number; }) => extraDe(d.dote, d.idExtra, 'Fusiones');
    const puedeMoldear = clases.some((c) => c.fusionesMaximas > 0) || dotes.some((d) => !!fusionDeDote(d));
    dotes.forEach(({ dote }) => {
        const inc = dote.Incarnum;
        if (!inc)
            return;
        const valor = puedeMoldear && inc.Esencia_reserva_moldeador !== null ? inc.Esencia_reserva_moldeador : inc.Esencia_reserva;
        if (valor)
            reserva.push({ tipo: 'dote', origen: dote.Nombre, valor });
    });
    const otros: [PersonajeIncarnumReceptaculo['tipo'], RasgoIncarnumEntrada][] = [
        ...e.raciales.map((r): ['racial', RasgoIncarnumEntrada] => ['racial', r]),
        ...e.especiales.map((r): ['especial', RasgoIncarnumEntrada] => ['especial', r]),
    ];
    otros.forEach(([tipo, r]) => {
        if (r.esencia?.Reserva)
            reserva.push({ tipo, origen: r.nombre, valor: r.esencia.Reserva });
    });
    const modCon = modificadorCaracteristica(e.puntuaciones[normalizarTexto('Constitución')] ?? 10);
    const modificadoresCapacidad: PersonajeIncarnum['capacidad']['modificadores'] = [];
    dotes.forEach(({ dote }) => {
        const capacidad = dote.Incarnum?.Capacidad;
        if (!capacidad)
            return;
        modificadoresCapacidad.push({
            origen: dote.Nombre, ambito: capacidad.Ambito, bono: capacidad.Bono,
            tope: capacidad.Tope_constitucion ? Math.max(0, modCon) : null,
        });
    });
    const capacidadDotes = modificadoresCapacidad.filter((m) => m.ambito === 'dotes')
        .reduce((capacidad, m) => capacidadConTope(capacidad, m.bono, m.tope), basica);
    const formacion = e.formacion ?? { fusiones: [], receptaculos: [] };
    const esenciaDe = new Map(formacion.receptaculos.map((r) => [`${r.tipo}:${r.id}`, r.esencia]));
    const receptaculos: PersonajeIncarnumReceptaculo[] = [
        ...dotes.filter(({ dote }) => !!dote.Incarnum?.Receptaculo)
            .map(({ dote }) => ({ tipo: 'dote' as const, id: dote.Id, nombre: dote.Nombre, capacidad: capacidadDotes, esencia: 0 })),
        ...otros.filter(([, r]) => !!r.esencia?.Receptaculo)
            .map(([tipo, r]) => ({ tipo, id: r.id, nombre: r.nombre, capacidad: basica, esencia: 0 })),
    ];
    receptaculos.forEach((r) => r.esencia = esenciaDe.get(`${r.tipo}:${r.id}`) ?? 0);
    const chakrasDeDotes = dotes
        .filter(({ dote }) => !!dote.Incarnum?.Abre_chakra)
        .map((d) => ({ chakra: extraDe(d.dote, d.idExtra, 'Chakras'), dote: { id: d.dote.Id, nombre: d.dote.Nombre } }))
        .filter((d): d is PersonajeIncarnum['chakrasDeDotes'][number] => !!d.chakra);
    const fusionesDeDotes = dotes
        .map((d) => ({ d, fusion: fusionDeDote(d) }))
        .filter(({ fusion }) => !!fusion)
        .map(({ d, fusion }) => ({
            fusion: fusion!,
            dote: { id: d.dote.Id, nombre: d.dote.Nombre },
            nivelMoldeador: d.dote.Incarnum?.Divisor_nivel_moldeador ? nivelMoldeador(nivel, d.dote.Incarnum.Divisor_nivel_moldeador) : null,
            cd: d.dote.Incarnum?.Caracteristica_cd_fusion
                ? cdFusion(sustituida(d.dote.Incarnum.Caracteristica_cd_fusion.Nombre, sustituciones), e.puntuaciones)
                : null,
        }));
    const total = reserva.reduce((suma, p) => suma + p.valor, 0);
    const puntosGolpe: PersonajeIncarnumParte[] = dotes.map(({ dote }) => {
        const inc = dote.Incarnum;
        const tipo = inc?.Pg_por_dote?.Tipo.Id;
        const delTipo = tipo ? dotes.filter((d) => (d.dote.Tipos ?? []).some((t) => toInt(t?.Id) === tipo)).length : 0;
        return { tipo: 'dote', origen: dote.Nombre, valor: toInt(inc?.Pg_por_esencia) * total + toInt(inc?.Pg_por_dote?.Valor) * delTipo };
    }).filter((p) => p.valor !== 0);
    const fusionesMoldeadas = formacion.fusiones.length;
    const bonosHabilidad = e.raciales.flatMap((r) => (r.esencia?.Habilidades_por_fusiones ?? []).map((h) => ({
        origen: r.nombre,
        habilidad: h.Habilidad,
        idsHabilidad: [...h.Ids_habilidad],
        bono: h.Bono + Math.floor(fusionesMoldeadas / Math.max(1, h.Fusiones_por_punto)),
        fusiones: fusionesMoldeadas,
    })));
    if (clases.length < 1 && !total && receptaculos.length < 1 && chakrasDeDotes.length < 1 && fusionesDeDotes.length < 1
        && puntosGolpe.length < 1 && bonosHabilidad.length < 1)
        return null;
    const bloque: PersonajeIncarnum = {
        nivelPersonaje: nivel,
        reserva: { total, desglose: reserva },
        capacidad: { basica, modificadores: modificadoresCapacidad },
        puedeMoldear,
        clases,
        chakrasDeDotes,
        fusionesDeDotes,
        receptaculos,
        puntosGolpe,
        bonosHabilidad,
        formacion: null,
    };
    bloque.formacion = formacionDelBorrador(formacion, bloque, e.fusiones ?? []);
    return bloque;
}

/** La capacidad de una fusión antes de las dotes de una sola fusión: la de su clase (o la del chakra al que se vincula). */
function capacidadDeFusion(clase: PersonajeIncarnumClase | undefined, idChakraVinculo: number | null | undefined, basica: number): number {
    if (!clase)
        return basica;
    const porChakra = clase.capacidadChakras.find((c) => idChakraVinculo !== null && idChakraVinculo !== undefined && c.chakra.id === idChakraVinculo);
    return porChakra ? porChakra.capacidad : clase.capacidadFusiones;
}

/**
 * Reparte las dotes que suben la capacidad de una sola fusión entre las que pasan de la suya (una fusión por dote, cada una
 * con su tope). Devuelve lo que suma a cada fusión, o `null` si no hay forma de cubrirlas todas. Prueba los repartos
 * posibles, como `asignar_capacidad_extra` de la API: son pocas fusiones y pocas dotes.
 */
function asignarCapacidadExtra(bases: number[], esencias: number[], modificadores: { bono: number; tope: number | null; }[]): number[] | null {
    const necesitan = bases.map((base, i) => i).filter((i) => esencias[i] > bases[i]).sort((a, b) => (bases[a] - esencias[a]) - (bases[b] - esencias[b]));
    const asignado = bases.map(() => 0);
    const usadas = modificadores.map(() => false);
    const cubrir = (k: number): boolean => {
        if (k === necesitan.length)
            return true;
        const i = necesitan[k];
        for (let j = 0; j < modificadores.length; j++) {
            const extra = capacidadConTope(bases[i], modificadores[j].bono, modificadores[j].tope) - bases[i];
            if (usadas[j] || bases[i] + extra < esencias[i])
                continue;
            usadas[j] = true;
            asignado[i] = extra;
            if (cubrir(k + 1))
                return true;
            usadas[j] = false;
            asignado[i] = 0;
        }
        return false;
    };
    return cubrir(0) ? asignado : null;
}

/** La capacidad de cada fusión de la formación: la de su clase y lo que le suman las dotes de una sola fusión. */
export function capacidadesDeFormacion(
    bloque: PersonajeIncarnum,
    fusiones: { idClase?: number | null; idChakraVinculo?: number | null; esencia: number; }[],
): { bases: number[]; extra: number[] | null; } {
    const clases = new Map(bloque.clases.map((c) => [c.id, c]));
    const bases = fusiones.map((f) => capacidadDeFusion(f.idClase ? clases.get(f.idClase) : undefined, f.idChakraVinculo, bloque.capacidad.basica));
    const modificadores = bloque.capacidad.modificadores.filter((m) => m.ambito === 'fusiones');
    return { bases, extra: asignarCapacidadExtra(bases, fusiones.map((f) => f.esencia), modificadores) };
}

/** La esencia que reparte una formación entre sus fusiones y sus receptáculos. */
export function esenciaInvertida(formacion: FormacionIncarnumDto | null | undefined): number {
    return (formacion?.fusiones ?? []).reduce((s, f) => s + toInt(f.esencia), 0)
        + (formacion?.receptaculos ?? []).reduce((s, r) => s + toInt(r.esencia), 0);
}

function formacionDelBorrador(formacion: FormacionIncarnumDto, bloque: PersonajeIncarnum, catalogo: Fusion[]): PersonajeIncarnumFormacion | null {
    if (formacion.fusiones.length < 1 && formacion.receptaculos.length < 1)
        return null;
    const clases = new Map(bloque.clases.map((c) => [c.id, c]));
    const deDote = new Map(bloque.fusionesDeDotes.map((d) => [d.fusion.id, d]));
    const { bases, extra } = capacidadesDeFormacion(bloque, formacion.fusiones);
    const chakraRef = (fusion: Fusion | undefined, id: number | null | undefined): PersonajeIncarnumRef | null =>
        id ? refODesconocido(fusion?.Chakras.find((c) => c.Id === id), id) : null;
    return {
        fusiones: formacion.fusiones.map((f, i) => {
            const fusion = catalogo.find((item) => item.Id === f.idFusion);
            const clase = f.idClase ? clases.get(f.idClase) : undefined;
            const dote = clase ? undefined : deDote.get(f.idFusion);
            const cd = clase ? clase.cd : dote?.cd ?? null;
            const moldeador = clase
                ? (clase.nivelMoldeadorChakras.find((n) => n.chakra.id === f.idChakraVinculo)?.nivelMoldeador ?? clase.nivelMoldeador)
                : (dote?.nivelMoldeador ?? null);
            return {
                fusion: refODesconocido(fusion, f.idFusion),
                clase: clase ? { id: clase.id, nombre: clase.nombre } : null,
                chakra: chakraRef(fusion, f.idChakra)!,
                vinculo: chakraRef(fusion, f.idChakraVinculo),
                esencia: f.esencia,
                capacidad: bases[i] + (extra?.[i] ?? 0),
                nivelMoldeador: moldeador,
                cd: cd ? cd.base + f.esencia : null,
            };
        }),
        esenciaInvertida: esenciaInvertida(formacion),
    };
}

// --- Prerrequisitos nuevos ---------------------------------------------------------------------------------------------

/** Lo que miran los prerrequisitos de incarnum de dotes y clases. */
export interface IncarnumPrerrequisitos {
    reserva: number;
    nivelMoldeador: number;
    fusiones: number;
    vinculos: number;
    chakrasVinculables: number[];
}

/** Los números del incarnum para los prerrequisitos (`esencia_minima`, `nivel_moldeador`, `fusiones_minimas`…). */
export function incarnumParaPrerrequisitos(bloque: PersonajeIncarnum | null | undefined): IncarnumPrerrequisitos {
    if (!bloque)
        return { reserva: 0, nivelMoldeador: 0, fusiones: 0, vinculos: 0, chakrasVinculables: [] };
    return {
        reserva: bloque.reserva.total,
        nivelMoldeador: Math.max(0, ...bloque.clases.map((c) => c.nivelMoldeador), ...bloque.fusionesDeDotes.map((d) => d.nivelMoldeador ?? 0)),
        fusiones: fusionesALaVez(bloque),
        vinculos: vinculosALaVez(bloque),
        chakrasVinculables: chakrasAbiertos(bloque).map((chakra) => chakra.id),
    };
}

/**
 * Si el personaje cumple un prerrequisito de incarnum, o `null` si la clave no es de incarnum. `lanzadorArcano`: su nivel
 * de lanzador arcano (`sin_lanzador_arcano`).
 */
export function cumplePrerrequisitoIncarnum(
    clave: string,
    entrada: Record<string, any>,
    incarnum: IncarnumPrerrequisitos,
    lanzadorArcano: number,
): boolean | null {
    const cantidad = toInt(entrada?.['Cantidad'] ?? entrada?.['cantidad'], 1);
    switch (clave) {
        case 'esencia_minima':
            return incarnum.reserva >= Math.max(1, cantidad);
        case 'sin_esencia':
            return incarnum.reserva <= 0;
        case 'nivel_moldeador':
            return incarnum.nivelMoldeador >= toInt(entrada?.['Nivel'] ?? entrada?.['nivel'], 1);
        case 'fusiones_minimas':
            return incarnum.fusiones >= Math.max(1, cantidad);
        case 'vinculos_minimos':
            return incarnum.vinculos >= Math.max(1, cantidad);
        case 'vinculo_chakra':
            return incarnum.chakrasVinculables.includes(toInt(entrada?.['Id_chakra'] ?? entrada?.['id_chakra']));
        case 'sin_lanzador_arcano':
            return toInt(lanzadorArcano) <= 0;
        default:
            return null;
    }
}

/** Las claves de los prerrequisitos de incarnum (las demás las evalúa cada evaluador como siempre). */
export const CLAVES_PRERREQUISITOS_INCARNUM: readonly string[] = [
    'esencia_minima', 'sin_esencia', 'nivel_moldeador', 'fusiones_minimas', 'vinculos_minimos', 'vinculo_chakra', 'sin_lanzador_arcano',
];

// --- Las fusiones que puede moldear y la formación de partida ---------------------------------------------------------

/** Las actitudes (componentes de alineamiento) del alineamiento básico del personaje y lo que dejan sus dotes. */
export interface AlineamientoParaFusiones {
    /** Los `Id` de las `Actitudes` de su alineamiento básico (`GET /alineamientos/basicos`). */
    actitudes: number[];
    /** Los descriptores que sus dotes dejan moldear sin mirar el alineamiento (`Descriptores_sin_alineamiento`). */
    descriptoresSinAlineamiento: number[];
}

/**
 * Si una clase que limita su lista por alineamiento deja moldear la fusión: cada descriptor de alineamiento de la fusión
 * (`Actitud`) es un componente del alineamiento del personaje, la fusión toma el de quien la moldea o una dote suya deja
 * moldear las de alguno de sus descriptores.
 */
export function alineamientoPermiteFusion(fusion: Fusion, alineamiento: AlineamientoParaFusiones): boolean {
    if (fusion.Alineado_portador || fusion.Descriptores.some((d) => alineamiento.descriptoresSinAlineamiento.includes(d.Id)))
        return true;
    return fusion.Descriptores.filter((d) => d.Actitud).every((d) => alineamiento.actitudes.includes(d.Actitud!.Id));
}

/** Las fusiones de la lista de la clase que puede moldear el personaje (con el límite de alineamiento si la clase lo tiene). */
export function fusionesMoldeables(idClase: number, limitada: boolean, fusiones: Fusion[], alineamiento: AlineamientoParaFusiones): Fusion[] {
    return fusiones.filter((f) => f.Clases.some((c) => c.Id === idClase) && (!limitada || alineamientoPermiteFusion(f, alineamiento)));
}

/** Un fallo de la formación de partida, con el `code` y el `field` de la API. */
export interface FalloFormacion {
    code: string;
    field: string;
    mensaje: string;
}

/**
 * Las clases cuyos vínculos sirven para vincular a ese chakra la fusión de una dote: las que lo tienen abierto a su nivel
 * o, si lo abre una dote Chakra … abierto, cualquiera que tenga vínculos (`_clases_para_vinculo` de la API).
 */
function clasesParaVinculo(clases: PersonajeIncarnumClase[], idChakra: number, abiertoPorDote: boolean): number[] {
    return clases.filter((c) => (abiertoPorDote && c.vinculos > 0) || c.chakrasAbiertos.some((ch) => ch.id === idChakra)).map((c) => c.id);
}

/**
 * Reparte las fusiones de dotes vinculadas (nombre y clases que abren su chakra) entre los vínculos que les quedan a esas
 * clases: el nombre de la primera que ya no cabe en ningún reparto, o `null` si caben todas (`_sin_vinculo_libre` de la API).
 */
function sinVinculoLibre(pendientes: { nombre: string; candidatas: number[]; }[], libres: Map<number, number>): string | null {
    const cabe = (lista: typeof pendientes, quedan: Map<number, number>): boolean => {
        if (lista.length < 1)
            return true;
        for (const idClase of lista[0].candidatas) {
            if ((quedan.get(idClase) ?? 0) > 0) {
                quedan.set(idClase, quedan.get(idClase)! - 1);
                if (cabe(lista.slice(1), quedan))
                    return true;
                quedan.set(idClase, quedan.get(idClase)! + 1);
            }
        }
        return false;
    };
    for (let k = pendientes.length; k >= 0; k--) {
        if (cabe(pendientes.slice(0, k), new Map(libres)))
            return k === pendientes.length ? null : pendientes[k].nombre;
    }
    return null;
}

/**
 * Comprueba la formación de partida como la API (`incarnum_formacion.validar_formacion`): devuelve el primer fallo, con el
 * mismo `code` y `field`, o `null` si cumple. `fusiones`: el catálogo; `nombresChakras`: los nombres por id.
 */
export function validarFormacionIncarnum(
    formacion: FormacionIncarnumDto,
    bloque: PersonajeIncarnum | null,
    fusiones: Fusion[],
    alineamiento: AlineamientoParaFusiones,
    nombresChakras: Map<number, string> = new Map(),
): FalloFormacion | null {
    const b: PersonajeIncarnum = bloque ?? {
        nivelPersonaje: 1, reserva: { total: 0, desglose: [] }, capacidad: { basica: 0, modificadores: [] }, puedeMoldear: false,
        clases: [], chakrasDeDotes: [], fusionesDeDotes: [], receptaculos: [], puntosGolpe: [], bonosHabilidad: [], formacion: null,
    };
    const fallo = (code: string, field: string, mensaje: string): FalloFormacion => ({ code, field, mensaje });
    const clases = new Map(b.clases.map((c) => [c.id, c]));
    const deDotes = new Set(b.fusionesDeDotes.map((d) => d.fusion.id));
    // Las dotes Chakra … abierto abren su chakra: se vincula con los vínculos de la clase y, sin ninguno, con el de la dote.
    const abiertosPorDotes = new Set(b.chakrasDeDotes.map((d) => d.chakra.id));
    const sinVinculosDeClase = b.clases.reduce((suma, c) => suma + c.vinculos, 0) <= 0;
    const nombreChakra = (id: number | null | undefined, porDefecto = '') => nombresChakras.get(toInt(id)) ?? porDefecto;
    const vistas = new Set<number>();
    const ocupados = new Set<number>();
    const vinculados = new Set<number>();
    const porClase = new Map<number, number>();
    const vinculosPorClase = new Map<number, number>();
    const pendientes: { nombre: string; candidatas: number[]; }[] = [];
    for (let i = 0; i < formacion.fusiones.length; i++) {
        const f = formacion.fusiones[i];
        const ruta = `incarnum.fusiones[${i}]`;
        const fusion = fusiones.find((item) => item.Id === f.idFusion);
        if (!fusion)
            return fallo('fusion_no_encontrada', `${ruta}.idFusion`, 'Alguna fusión de la formación no existe.');
        const nombre = fusion.Nombre;
        if (vistas.has(f.idFusion))
            return fallo('fusion_repetida', `${ruta}.idFusion`, `${nombre} solo se puede moldear una vez.`);
        vistas.add(f.idFusion);
        const clase = f.idClase ? clases.get(f.idClase) : undefined;
        if (f.idClase) {
            if (!clase)
                return fallo('clase_sin_moldeado', `${ruta}.idClase`, `${nombre}: el personaje no moldea fusiones con esa clase.`);
            if (!fusion.Clases.some((c) => c.Id === f.idClase))
                return fallo('fusion_fuera_de_lista', `${ruta}.idFusion`, `${nombre} no está en la lista de fusiones de ${clase.nombre}.`);
            if (clase.limitadoPorAlineamiento && !alineamientoPermiteFusion(fusion, alineamiento))
                return fallo('fusion_no_alineada', `${ruta}.idFusion`, `${nombre} no se puede moldear con el alineamiento del personaje.`);
            porClase.set(clase.id, (porClase.get(clase.id) ?? 0) + 1);
        } else if (!deDotes.has(f.idFusion)) {
            return fallo('fusion_fuera_de_lista', `${ruta}.idFusion`, `${nombre} no es de ninguna de sus clases ni la ha elegido con una dote.`);
        }
        const chakra = fusion.Chakras.find((c) => c.Id === f.idChakra);
        if (!chakra || !chakra.Ocupa)
            return fallo('chakra_no_valido', `${ruta}.idChakra`, `${nombre} no se puede moldear en el chakra ${nombreChakra(f.idChakra, chakra?.Nombre ?? 'elegido')}.`);
        if (ocupados.has(f.idChakra))
            return fallo('chakra_ocupado', `${ruta}.idChakra`, `El chakra ${nombreChakra(f.idChakra, chakra.Nombre)} ya tiene una fusión.`);
        ocupados.add(f.idChakra);
        const vinculo = f.idChakraVinculo;
        if (!vinculo)
            continue;
        const campo = `${ruta}.idChakraVinculo`;
        const destino = fusion.Chakras.find((c) => c.Id === vinculo);
        if (!destino || !destino.Vinculo || (vinculo !== f.idChakra && destino.Ocupa))
            return fallo('vinculo_no_valido', campo, `${nombre} no se puede vincular al chakra ${nombreChakra(vinculo, destino?.Nombre ?? 'elegido')}.`);
        if (vinculados.has(vinculo))
            return fallo('vinculo_repetido', campo, `El chakra ${nombreChakra(vinculo, destino.Nombre)} ya tiene una fusión vinculada.`);
        vinculados.add(vinculo);
        const porDote = abiertosPorDotes.has(vinculo);
        if (porDote && sinVinculosDeClase)
            continue;
        const candidatas = clase ? [] : clasesParaVinculo(b.clases, vinculo, porDote);
        if (clase && (porDote || clase.chakrasAbiertos.some((ch) => ch.id === vinculo)))
            vinculosPorClase.set(clase.id, (vinculosPorClase.get(clase.id) ?? 0) + 1);
        else if (!clase && candidatas.length > 0)
            // Moldear fusión: a cualquier chakra abierto de sus clases, con un vínculo de alguna (se reparten al final).
            pendientes.push({ nombre, candidatas });
        else
            return fallo('chakra_cerrado', campo, `${nombre}: el chakra ${nombreChakra(vinculo, destino.Nombre)} aún no está abierto para vincular.`);
    }
    for (const [idClase, cantidad] of porClase) {
        const c = clases.get(idClase)!;
        if (cantidad > c.fusionesMaximas)
            return fallo('demasiadas_fusiones', 'incarnum.fusiones', `Con ${c.nombre} puede moldear como mucho ${c.fusionesMaximas} fusiones a la vez.`);
    }
    for (const [idClase, cantidad] of vinculosPorClase) {
        const c = clases.get(idClase)!;
        if (cantidad > c.vinculos)
            return fallo('demasiados_vinculos', 'incarnum.fusiones', `Con ${c.nombre} puede vincular como mucho ${c.vinculos} fusiones a la vez.`);
    }
    const libres = new Map(b.clases.map((c) => [c.id, c.vinculos - (vinculosPorClase.get(c.id) ?? 0)]));
    const sinVinculo = sinVinculoLibre(pendientes, libres);
    if (sinVinculo !== null)
        return fallo('demasiados_vinculos', 'incarnum.fusiones', `${sinVinculo}: sus clases ya no tienen vínculos libres en ese chakra.`);
    const { bases, extra } = capacidadesDeFormacion(b, formacion.fusiones);
    if (extra === null) {
        let peor = 0;
        formacion.fusiones.forEach((f, i) => {
            if (f.esencia - bases[i] > formacion.fusiones[peor].esencia - bases[peor])
                peor = i;
        });
        const nombre = fusiones.find((item) => item.Id === formacion.fusiones[peor].idFusion)?.Nombre ?? '';
        return fallo('capacidad_superada', `incarnum.fusiones[${peor}].esencia`, `${nombre} admite como mucho ${bases[peor]} de esencia.`);
    }
    const vistosReceptaculos = new Set<string>();
    for (let j = 0; j < formacion.receptaculos.length; j++) {
        const r = formacion.receptaculos[j];
        const ruta = `incarnum.receptaculos[${j}]`;
        const receptaculo = b.receptaculos.find((item) => item.tipo === r.tipo && item.id === r.id);
        if (!receptaculo)
            return fallo('receptaculo_no_valido', ruta, 'Algún receptáculo de la formación no es del personaje o no admite esencia.');
        const clave = `${r.tipo}:${r.id}`;
        if (vistosReceptaculos.has(clave))
            return fallo('receptaculo_repetido', ruta, `${receptaculo.nombre} está repetido en la formación.`);
        vistosReceptaculos.add(clave);
        if (r.esencia > receptaculo.capacidad)
            return fallo('capacidad_superada', `${ruta}.esencia`, `${receptaculo.nombre} admite como mucho ${receptaculo.capacidad} de esencia.`);
    }
    const total = esenciaInvertida(formacion);
    if (total > b.reserva.total)
        return fallo('esencia_insuficiente', 'incarnum', `La formación reparte ${total} de esencia y la reserva es de ${b.reserva.total}.`);
    return null;
}

/** Los códigos de error de la formación de partida que da `POST /personajes/add` (tabla de `docs/publica/INCARNUM.md`). */
export const CODIGOS_FALLO_FORMACION: readonly string[] = [
    'fusion_no_encontrada', 'fusion_repetida', 'clase_sin_moldeado', 'fusion_fuera_de_lista', 'fusion_no_alineada',
    'chakra_no_valido', 'chakra_ocupado', 'vinculo_no_valido', 'vinculo_repetido', 'chakra_cerrado', 'demasiadas_fusiones',
    'demasiados_vinculos', 'capacidad_superada', 'receptaculo_no_valido', 'receptaculo_repetido', 'esencia_insuficiente',
];
