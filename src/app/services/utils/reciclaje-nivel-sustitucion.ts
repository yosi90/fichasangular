import { Clase } from 'src/app/interfaces/clase';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { CambioDeRasgoEnElMotor, FilaDeTablaDeClase, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { esConjuroDeLaClase, nivelDelConjuroEnLaClase } from 'src/app/services/nuevo-personaje.service';
import { sacarPrimero } from './correccion-ficha';
import { textoConSigno } from './equipo-texto';
import { esLaHabilidad, idExtraHabilidadParaGuardar, nombreDeHabilidadConExtra } from './habilidad-extra-visible';
import { nivelDelOrden, origenDeNivelDeClase, ponerNivelDeSustitucion } from './niveles-creacion';
import {
    NivelDeSustitucion, RefHabilidadDeSustitucion, conjurosConocidosDelNivel, detalleConSustituciones, habilidadesDelJuego,
    nivelDeSustitucion, nombreDeOpcionDeSustitucion, opcionesDeSustitucion, ordinalDeNivel, puntosHabilidadDelNivel, quitasSinAplicar,
    sustitucionesDeLaClase,
} from './niveles-sustitucion';
import { extraComparable, mismoExtra, normalizarTexto, toInt, toNumber } from './normalizacion';
import { COSTE_RANGO_CLASEA, COSTE_RANGO_TRANSCLASEA, limiteRangosHabilidad, MULTIPLICADOR_PRIMER_NIVEL } from './puntos-habilidad';
import { nivelDeClaveConjuro } from './reglas-magia';
import { CambioDeRasgo, DoteElegidaEnElRasgo, fichaConLosCambiosDeClase, nombreConExtra } from './reciclaje-rasgos';
import { fichaConLoDelMotor } from './subida-nivel';

/*
 * El reciclaje de un nivel de sustitución (R8, segunda tanda; *Manual del jugador II*, págs. 196-197; contrato en
 * `docs/publica/endpoints/personajes.md`, «El reciclaje», `nivel_sustitucion`; dictamen del máster de Rol, D4). Uno de sus
 * niveles de clase cambia por un nivel de sustitución de ese mismo nivel, o al revés, o por el de otro juego. Lo que cambia
 * sale de los datos, con el mismo cálculo que al tomarlo (`detalleConSustituciones` y las filas de la tabla del motor): las
 * aptitudes y las dotes que salen y entran, el DG (los PG sin volver a tirar: ±1 por paso de dado, ±2 en el 1.er nivel de
 * su clase), los puntos de habilidad (×4 en el 1.er nivel del personaje), las habilidades de clase del nivel (con el
 * traspaso de hasta 4 rangos a una que añade), los conocidos y las competencias. Lo que dejaría de cumplir lo que tiene
 * bloquea; nada sale de un nombre ni de un id fijo.
 */

/** Los dados de golpe, en su orden (un paso es uno de ellos: MJ II, pág. 197). */
const ESCALERA_DE_DADOS = [4, 6, 8, 10, 12];

/** Una opción para el hueco: el estándar (`nivel` `null`) o un nivel de un juego, y por qué no se puede poner. */
export interface OpcionDeNivelReciclable {
    clave: string;
    /** `null`, el estándar. */
    idNivelSustitucion: number | null;
    nivel: NivelDeSustitucion | null;
    nombre: string;
    motivo: string | null;
    /** Lo que nadie puede comprobar (D6): se deja elegir con el aviso. */
    avisos: string[];
}

/** Un nivel de una clase que tiene y que se puede reciclar: lo que es ahora y lo que puede ser. */
export interface HuecoDeNivelSustitucion {
    clave: string;
    idClase: number;
    clase: string;
    nivelClase: number;
    /** Su índice en el registro (`Orden_niveles`): 0 es el 1.er nivel del personaje. */
    indiceNivel: number;
    /** Lo que es ahora: `null`, el estándar. */
    tiene: NivelDeSustitucion | null;
    nombreTiene: string;
    opciones: OpcionDeNivelReciclable[];
    motivo: string | null;
}

/** Una habilidad como la mira el nivel: su id y su extra (−1, cualquiera). */
export interface RefHabilidadDelNivel {
    idHabilidad: number;
    idExtra: number;
    nombre: string;
}

/** Los conocidos de un nivel de conjuro que sobran con el nivel nuevo: hay que olvidar `cantidad` de `candidatos`. */
export interface ConocidosDeMas {
    nivelConjuro: number | null;
    cantidad: number;
    candidatos: Array<{ idConjuro: number; nombre: string; }>;
}

/** Lo que cambia al poner `pone` en el hueco, calculado de los datos (sin lo que elige el jugador). */
export interface AnalisisDelNivel {
    /** Las aptitudes y las dotes de la tabla de la clase que salen y entran, en su nivel. */
    cambios: CambioDeRasgo[];
    /** Una aptitud que entra y da a elegir una dote (`Otorga_dote`): en qué nivel, de qué tipo y su nombre. */
    doteAElegir: { nivelClase: number; tipo: string | null; aptitud: string; } | null;
    /** Los PG: el dado de antes y el de después, los pasos, la tirada guardada y la nueva y lo que cambian. */
    pg: { carasAntes: number; carasDespues: number; pasos: number; tiradaAntes: number | null; tiradaDespues: number | null; delta: number; };
    /** La diferencia de puntos de habilidad (×4 en el 1.er nivel del personaje). */
    puntos: number;
    /** Las habilidades de clase que el nivel nuevo añade y quita respecto del que se va. */
    habilidadesAnadidas: RefHabilidadDelNivel[];
    habilidadesQuitadas: RefHabilidadDelNivel[];
    conocidosDeMas: ConocidosDeMas[];
    /** Los conocidos que daba fijos el nivel que se va y no da el nuevo. */
    conocidosFijosQueSalen: Array<{ idConjuro: number; idClase: number; }>;
    /** Por qué no se puede: algo que la web aún no hace, o lo que dejaría de cumplir lo que tiene. `null` si se puede. */
    motivo: string | null;
}

/** Un cambio de rangos de una habilidad en el nivel reciclado: los que quita (negativo) o compra (positivo). */
export interface CambioDeRangosDelNivel {
    idHabilidad: number;
    idExtra: number;
    nombre: string;
    rangos: number;
}

/**
 * Un traspaso de rangos: de 1 a 4 (`MAXIMO_RANGOS_RECICLADOS`) de una habilidad a otra. Es el reciclaje `rangos` y el
 * `traspaso` de un nivel de sustitución (a una de clase que añade el nivel nuevo).
 */
export interface TraspasoDeRangos {
    quita: { idHabilidad: number; idExtra: number; nombre: string; };
    pone: { idHabilidad: number; idExtra: number; nombre: string; };
    rangos: number;
}

/** Lo que se elige al reciclar un nivel de sustitución. */
export interface PlanNivelSustitucion {
    tipo: 'nivel_sustitucion';
    hueco: HuecoDeNivelSustitucion;
    pone: OpcionDeNivelReciclable;
    analisis: AnalisisDelNivel;
    /** La dote elegida con la aptitud que la da (la «Dote adicional» del guerrero que vuelve al estándar). */
    doteElegida: DoteElegidaEnElRasgo | null;
    /** Los rangos que quita o compra por la diferencia de puntos. */
    rangos: CambioDeRangosDelNivel[];
    traspaso: TraspasoDeRangos | null;
    /** Los conocidos que olvida porque el nivel nuevo da menos. */
    olvidados: Array<{ idConjuro: number; nombre: string; }>;
}

/** El nombre del nivel del hueco: «Guerrero, nivel 1 (estándar)» o «nivel 1 de guerrero enano». */
export function nombreDelNivel(clase: string, nivelClase: number, nivel: NivelDeSustitucion | null): string {
    return nivel ? `${nombreDeOpcionDeSustitucion(nivel)}` : `${clase} ${ordinalDeNivel(nivelClase)} (estándar)`;
}

/**
 * Los niveles de sus clases que se pueden reciclar (con el motor recién hidratado, el personaje de antes de subir): los de
 * un nivel de clase con algún juego de ese nivel, o que ya son de sustitución. Cada uno con lo que puede poner (el estándar
 * u otro juego de ese nivel) y, si no, por qué: los requisitos de ahora (D3 y MJ II pág. 197) y la campaña
 * (`permiteSustitucion`; para volver al estándar no hace falta).
 */
export function huecosDeNivelSustitucion(motor: NuevoPersonajeService, permiteSustitucion: boolean): HuecoDeNivelSustitucion[] {
    const pj = motor.PersonajeCreacion;
    const orden = pj.Orden_niveles ?? [];
    const huecos: HuecoDeNivelSustitucion[] = [];
    (pj.desgloseClases ?? []).filter((c) => toInt(c?.Nivel) > 0).forEach((entrada) => {
        const clase = motor.claseDelCatalogo(toInt(entrada?.Id));
        if (!clase)
            return;
        const idClase = toInt(clase.Id);
        for (let n = 1; n <= toInt(entrada?.Nivel); n++) {
            const juegos = opcionesDeSustitucion(clase, n);
            const tiene = motor.sustitucionDelNivelDeClase(clase, n);
            if (juegos.length < 1 && !tiene)
                continue;
            const indice = orden.findIndex((o) => toInt(o?.idClase) === idClase && toInt(o?.nivelClase) === n);
            const opciones: OpcionDeNivelReciclable[] = [
                ...(tiene ? [{ clave: 'estandar', idNivelSustitucion: null, nivel: null, nombre: nombreDelNivel(`${clase.Nombre}`, n, null), motivo: null, avisos: [] }] : []),
                ...juegos.filter((j) => j.nivel.Id !== tiene?.nivel.Id).map((j) => opcionDeJuego(motor, j, n, permiteSustitucion)),
            ];
            huecos.push({
                clave: `${idClase}:${n}`, idClase, clase: `${clase.Nombre}`, nivelClase: n, indiceNivel: indice, tiene,
                nombreTiene: nombreDelNivel(`${clase.Nombre}`, n, tiene), opciones,
                motivo: indice < 0 ? 'Este nivel no está en su registro: no se sabe qué tomó en él.'
                    : opciones.some((o) => !o.motivo) ? null : 'No hay otro nivel que pueda poner en su lugar.',
            });
        }
    });
    return huecos;
}

function opcionDeJuego(motor: NuevoPersonajeService, juego: NivelDeSustitucion, nivelClase: number, permite: boolean): OpcionDeNivelReciclable {
    const base = { clave: `${juego.nivel.Id}`, idNivelSustitucion: juego.nivel.Id, nivel: juego, nombre: nombreDeOpcionDeSustitucion(juego) };
    if (!permite)
        return { ...base, motivo: 'La campaña no deja tomar niveles de sustitución.', avisos: [] };
    const requisitos = motor.requisitosDeSustitucionAhora(juego.juego, nivelClase);
    if (!requisitos.cumple)
        return { ...base, motivo: requisitos.motivos.join(' · '), avisos: requisitos.avisos };
    const sinAplicar = quitasSinAplicar(juego);
    if (sinAplicar.length > 0)
        return { ...base, motivo: 'Quita algo que la web aún no aplica (el libro de conjuros, la escuela o los dominios): no se recicla en la web.', avisos: requisitos.avisos };
    return { ...base, motivo: null, avisos: requisitos.avisos };
}

// --- Lo que cambia -------------------------------------------------------------------------------------------------------

/** Las filas de la tabla de la clase hasta `hasta`, con su nivel. */
function filasHasta(motor: NuevoPersonajeService, clase: Clase, hasta: number): Array<{ nivelClase: number; fila: FilaDeTablaDeClase; }> {
    const filas: Array<{ nivelClase: number; fila: FilaDeTablaDeClase; }> = [];
    for (let n = 1; n <= hasta; n++)
        motor.filasDeLaTablaDeClase(clase, n).forEach((fila) => filas.push({ nivelClase: n, fila }));
    return filas;
}

/** Hace `fn` con el hueco cambiado en el registro del motor (solo el `idNivelSustitucion`), y lo deja como estaba. */
function conElNivelCambiado<T>(motor: NuevoPersonajeService, hueco: HuecoDeNivelSustitucion, idNivelSustitucion: number | null, fn: () => T): T {
    const nivel = nivelDelOrden(motor.PersonajeCreacion.Orden_niveles, { idClase: hueco.idClase, nivelClase: hueco.nivelClase });
    if (!nivel)
        return fn();
    const tenia = nivel.idNivelSustitucion;
    ponerNivelDeSustitucion(nivel, idNivelSustitucion);
    try {
        return fn();
    } finally {
        ponerNivelDeSustitucion(nivel, tenia);
    }
}

/** Las habilidades de clase de un nivel de la clase: las suyas, con lo que añade su juego y sin lo que quita. */
function habilidadesDelNivel(motor: NuevoPersonajeService, clase: Clase, nivel: NivelDeSustitucion | null): RefHabilidadDelNivel[] {
    const ref = (r: Record<string, any>): RefHabilidadDelNivel => ({
        idHabilidad: toInt(r?.['Id_habilidad'] ?? r?.['id_habilidad'] ?? r?.['Id']),
        idExtra: r?.['Id_extra'] === undefined || r?.['Id_extra'] === null ? -1 : toInt(r['Id_extra']),
        nombre: `${r?.['Habilidad'] ?? r?.['Nombre'] ?? ''}${toInt(r?.['Id_extra']) > 0 && r?.['Extra'] ? ` (${r['Extra']})` : ''}`,
    });
    const { anade, quita } = habilidadesDelJuego(nivel?.juego);
    const quitadas = quita.map((q) => ref(q as unknown as Record<string, any>));
    const lista = motor.habilidadesDeClaseDeLaClase(clase).map(ref)
        .filter((h) => !quitadas.some((q) => mismaHabilidad(q, h)));
    anade.map((a) => ref(a as unknown as Record<string, any>)).forEach((a) => {
        if (!lista.some((h) => mismaHabilidad(h, a)))
            lista.push(a);
    });
    return lista.filter((h) => h.idHabilidad > 0);
}

/** Si dos referencias son la misma habilidad (un extra −1 o 0 vale para cualquiera). */
function mismaHabilidad(a: Pick<RefHabilidadDelNivel, 'idHabilidad' | 'idExtra'>, b: Pick<RefHabilidadDelNivel, 'idHabilidad' | 'idExtra'>): boolean {
    return a.idHabilidad === b.idHabilidad && (a.idExtra <= 0 || b.idExtra <= 0 || a.idExtra === b.idExtra);
}

const claveDeFila = (f: FilaDeTablaDeClase) => `${f.tipo}:${f.id}:${extraComparable(f.idExtra)}`;

/** Los pasos de dado de `antes` a `despues` (d8 a d10, 1; d8 a d4, −2). */
function pasosDeDado(antes: number, despues: number): number {
    const a = ESCALERA_DE_DADOS.indexOf(antes);
    const d = ESCALERA_DE_DADOS.indexOf(despues);
    return a >= 0 && d >= 0 ? d - a : Math.trunc((despues - antes) / 2);
}

/**
 * Lo que cambia al poner `pone` en el hueco: con el registro del motor cambiado solo en ese nivel, la tabla de la clase
 * (hasta su nivel de ahora), el dado, los puntos, las habilidades de clase y los conocidos, antes y después. El motor se
 * queda como estaba. `entrada`, la ficha guardada (la tirada del hueco y los conocidos).
 */
export function analizarElNivel(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, hueco: HuecoDeNivelSustitucion,
    pone: OpcionDeNivelReciclable, nivelPersonaje: number): AnalisisDelNivel {
    const clase = motor.claseDelCatalogo(hueco.idClase)!;
    const hasta = motor.nivelActualDeLaClase(clase);
    const antes = {
        filas: filasHasta(motor, clase, hasta),
        caras: motor.carasDadoGolpeDeClase(clase, hueco.nivelClase),
    };
    const despues = conElNivelCambiado(motor, hueco, pone.idNivelSustitucion, () => ({
        filas: filasHasta(motor, clase, hasta),
        caras: motor.carasDadoGolpeDeClase(clase, hueco.nivelClase),
    }));
    const motivos: string[] = [];
    const { cambios, doteAElegir } = cambiosDeLaTabla(motor, clase, hueco, antes.filas, despues.filas, motivos);

    // Los PG (MJ II, pág. 197): sin volver a tirar.
    const pasos = pasosDeDado(antes.caras, despues.caras);
    const registro = (entrada.niveles ?? [])[hueco.indiceNivel];
    const maximo = !!registro?.pg?.maximo;
    const tiradaAntes = maximo ? antes.caras : (toInt(registro?.pg?.tirada) > 0 ? toInt(registro?.pg?.tirada) : null);
    const porPaso = hueco.nivelClase === 1 ? 2 : 1;
    const tiradaDespues = maximo ? despues.caras
        : tiradaAntes === null ? null : Math.min(despues.caras, Math.max(1, tiradaAntes + pasos * porPaso));
    const mod = toInt(motor.PersonajeCreacion.ModConstitucion);
    const delta = tiradaAntes === null || tiradaDespues === null ? pasos * porPaso
        : Math.max(1, tiradaDespues + mod) - Math.max(1, tiradaAntes + mod);

    // Los puntos y las habilidades de clase del nivel.
    const puntos = (puntosHabilidadDelNivel(clase, pone.nivel) - puntosHabilidadDelNivel(clase, hueco.tiene)) * (hueco.indiceNivel === 0 ? MULTIPLICADOR_PRIMER_NIVEL : 1);
    const listaAntes = habilidadesDelNivel(motor, clase, hueco.tiene);
    const listaDespues = habilidadesDelNivel(motor, clase, pone.nivel);
    const habilidadesAnadidas = listaDespues.filter((h) => !listaAntes.some((a) => mismaHabilidad(a, h)));
    const habilidadesQuitadas = listaAntes.filter((h) => !listaDespues.some((d) => mismaHabilidad(d, h)));
    const sobreElTope = rangosPorEncimaDelTope(motor, clase, hueco, habilidadesQuitadas, nivelPersonaje);
    if (sobreElTope.length > 0)
        motivos.push(`El nivel nuevo no tiene de clase ${sobreElTope.join(', ')}, y tiene más rangos que el tope de una transclásea.`);

    // Los conocidos: los que sobran con la tabla nueva y los que daba fijos el que se va.
    const conocidosDeMas = conocidosQueSobran(motor, clase, entrada, hueco, pone, hasta);
    const fijosQueEntran = new Set(conjurosConocidosDelNivel(pone.nivel).map((c) => c.Id));
    const conocidosFijosQueSalen = conjurosConocidosDelNivel(hueco.tiene).filter((c) => !fijosQueEntran.has(c.Id))
        .map((c) => ({ idConjuro: c.Id, idClase: hueco.idClase }));

    // Lo que dejaría de cumplir lo que tiene sin lo que sale lo mira `nivelesParaReciclar` (`reciclaje.ts`).
    return {
        cambios, doteAElegir, pg: { carasAntes: antes.caras, carasDespues: despues.caras, pasos, tiradaAntes, tiradaDespues, delta },
        puntos, habilidadesAnadidas, habilidadesQuitadas, conocidosDeMas, conocidosFijosQueSalen,
        motivo: motivos.length > 0 ? motivos.join(' ') : null,
    };
}

type FilaConNivel = { nivelClase: number; fila: FilaDeTablaDeClase; };

/** Lo de `a` que no está en `b` (contando repetidos), comparando el nivel, la fila y su grupo. */
function resta(a: FilaConNivel[], b: FilaConNivel[]): FilaConNivel[] {
    const clave = (x: FilaConNivel) => `${x.nivelClase}:${claveDeFila(x.fila)}:${x.fila.grupo}:${x.fila.elegir}`;
    const quedan = b.map(clave);
    return a.filter((x) => {
        const i = quedan.indexOf(clave(x));
        if (i < 0)
            return true;
        quedan.splice(i, 1);
        return false;
    });
}

const esFija = (f: FilaDeTablaDeClase) => f.grupo === 0 && f.idEspecialRequerido <= 0 && f.idDoteRequerida <= 0;

/**
 * Las aptitudes y las dotes que salen y entran en la tabla de la clase (cada una en su nivel): la ficha guarda una vez cada
 * aptitud con su extra, así que sale solo la que ya no da ninguna fila y entra solo la que no daba ninguna (con un
 * `Sustituto`, las filas de después pasan a la nueva aptitud con su extra). Sale también la dote que se eligió con una
 * aptitud que la daba (la «Dote adicional» del guerrero); la que da a elegir la que entra va por el selector
 * (`doteAElegir`). Lo que la web aún no reparte (un grupo de opciones, lo que deriva de él o un extra que elegir) va a
 * `motivos`.
 */
function cambiosDeLaTabla(motor: NuevoPersonajeService, clase: Clase, hueco: HuecoDeNivelSustitucion, antes: FilaConNivel[], despues: FilaConNivel[],
    motivos: string[]): { cambios: CambioDeRasgo[]; doteAElegir: AnalisisDelNivel['doteAElegir']; } {
    const pj = motor.PersonajeCreacion;
    const salen = resta(antes, despues);
    const entran = resta(despues, antes);
    if ([...salen, ...entran].some((x) => !esFija(x.fila)))
        motivos.push('El nivel cambia una elección de la tabla de la clase (un grupo de opciones o lo que deriva de él): aún no se recicla en la web.');
    const porElegir = entran.filter((x) => x.fila.tipo === 'especial' && x.fila.elegir);
    if (porElegir.length > 0)
        motivos.push(`Habría que elegir el extra de ${porElegir.map((x) => x.fila.nombre).join(', ')}: aún no se recicla en la web.`);
    const conDote = entran.filter((x) => x.fila.tipo === 'especial' && x.fila.otorgaDote && esFija(x.fila));
    if (conDote.length > 1)
        motivos.push(`Habría que elegir ${conDote.length} dotes (${conDote.map((x) => x.fila.nombre).join(', ')}): aún no se recicla en la web.`);

    const cambios: CambioDeRasgo[] = [];
    const aptitudesDespues = new Set(despues.filter((x) => x.fila.tipo === 'especial' && !x.fila.elegir).map((x) => claveDeFila(x.fila)));
    const aptitudesAntes = new Set(antes.filter((x) => x.fila.tipo === 'especial' && !x.fila.elegir).map((x) => claveDeFila(x.fila)));
    const vistas = new Set<string>();
    const dotes = motor.dotesDelPersonaje().map((d) => ({
        id: toInt(d?.Dote?.Id), idExtra: extraComparable(d?.Contexto?.Id_extra), nombre: `${d?.Dote?.Nombre ?? ''}`,
        extra: toInt(d?.Contexto?.Id_extra) > 0 ? `${d?.Contexto?.Extra ?? ''}` : '', origen: `${(d?.Contexto as any)?.Origen ?? ''}`, usada: false,
    }));
    const origenDeNivel = (n: number) => origenDeNivelDeClase(`${clase.Nombre}`, n);
    const sacarDote = (es: (d: typeof dotes[number]) => boolean) => {
        const dote = dotes.find((d) => !d.usada && es(d));
        if (dote)
            dote.usada = true;
        return dote;
    };

    salen.filter((x) => esFija(x.fila)).forEach(({ nivelClase, fila }) => {
        if (fila.tipo === 'dote') {
            const dote = sacarDote((d) => d.id === fila.id && (fila.idExtra <= 0 || mismoExtra(d.idExtra, fila.idExtra))
                && normalizarTexto(d.origen) === normalizarTexto(origenDeNivel(nivelClase)))
                ?? sacarDote((d) => d.id === fila.id && (fila.idExtra <= 0 || mismoExtra(d.idExtra, fila.idExtra)));
            if (dote)
                cambios.push({
                    nivelClase, tipo: 'dote', derivado: false, quita: { id: dote.id, idExtra: dote.idExtra, origen: dote.origen, idInterno: fila.idInterno },
                    pone: null, nombreQuita: nombreConExtra(dote), nombrePone: '',
                });
            return;
        }
        if (fila.elegir) {
            // La que eligió en ese nivel (su elección en el registro) o, si ya no la da ninguna fila, la única que tiene.
            const eleccion = (nivelDelOrden(pj.Orden_niveles, { idClase: hueco.idClase, nivelClase })?.elecciones ?? [])
                .find((e) => e.tipo === 'especial' && toInt(e.idElemento) === fila.id);
            const tiene = (pj.Claseas ?? []).filter((e) => toInt(e?.Id) === fila.id && toInt(e?.Id_extra) > 0);
            const sigue = despues.some((y) => y.fila.tipo === 'especial' && y.fila.id === fila.id && y.fila.elegir);
            const elegida = eleccion ? tiene.find((e) => mismoExtra(e?.Id_extra, eleccion.idExtra)) : (!sigue && tiene.length === 1 ? tiene[0] : undefined);
            if (!elegida) {
                if (tiene.length > 0)
                    motivos.push(`No se sabe qué ${fila.nombre} eligió en el nivel ${nivelClase} de ${`${clase.Nombre}`.toLowerCase()}: no se recicla en la web.`);
                return;
            }
            cambios.push({
                nivelClase, tipo: 'especial', derivado: false, quita: { id: fila.id, idExtra: extraComparable(elegida.Id_extra), idInterno: fila.idInterno },
                pone: null, nombreQuita: nombreConExtra({ idExtra: toInt(elegida.Id_extra), nombre: fila.nombre, extra: `${elegida.Extra ?? ''}` }), nombrePone: '',
            });
            return;
        }
        const clave = claveDeFila(fila);
        if (!aptitudesDespues.has(clave) && !vistas.has(clave)) {
            vistas.add(clave);
            const tiene = (pj.Claseas ?? []).find((e) => toInt(e?.Id) === fila.id && mismoExtra(e?.Id_extra, fila.idExtra));
            if (tiene)
                cambios.push({
                    nivelClase, tipo: 'especial', derivado: false, quita: { id: fila.id, idExtra: extraComparable(tiene.Id_extra), idInterno: fila.idInterno },
                    pone: null, nombreQuita: nombreConExtra(fila), nombrePone: '',
                });
        }
        // La dote que eligió con la aptitud de ese nivel («Dote adicional: Guerrero nivel 1»).
        if (fila.otorgaDote) {
            const origen = normalizarTexto(motor.origenDeLaDoteDeAptitud(origenDeNivel(nivelClase)));
            const dote = sacarDote((d) => normalizarTexto(d.origen) === origen || normalizarTexto(d.origen).startsWith(`${origen} (`));
            if (dote)
                cambios.push({
                    nivelClase, tipo: 'dote', derivado: false, quita: { id: dote.id, idExtra: dote.idExtra, origen: dote.origen, idInterno: 0 },
                    pone: null, nombreQuita: nombreConExtra(dote), nombrePone: '',
                });
        }
    });

    entran.filter((x) => esFija(x.fila) && !(x.fila.tipo === 'especial' && x.fila.elegir)).forEach(({ nivelClase, fila }) => {
        if (fila.tipo === 'dote') {
            cambios.push({
                nivelClase, tipo: 'dote', derivado: false, quita: null,
                pone: { id: fila.id, idExtra: fila.idExtra, nombre: fila.nombre, extra: fila.extra, origen: origenDeNivel(nivelClase), idInterno: fila.idInterno },
                nombreQuita: '', nombrePone: nombreConExtra(fila),
            });
            return;
        }
        const clave = claveDeFila(fila);
        if (aptitudesAntes.has(clave) || vistas.has(clave))
            return;
        vistas.add(clave);
        cambios.push({
            nivelClase, tipo: 'especial', derivado: false, quita: null,
            pone: { id: fila.id, idExtra: fila.idExtra, nombre: fila.nombre, extra: fila.extra, idInterno: fila.idInterno },
            nombreQuita: '', nombrePone: nombreConExtra(fila),
        });
    });
    const otorga = conDote.length === 1 ? conDote[0] : null;
    return {
        cambios,
        doteAElegir: otorga ? { nivelClase: otorga.nivelClase, tipo: otorga.fila.tipoDeDote, aptitud: otorga.fila.nombre } : null,
    };
}

/**
 * Las habilidades que el nivel nuevo deja de tener de clase y con más rangos que el tope de una transclásea (D4): solo si
 * no lo son en otro nivel de la clase ni en otra de sus clases.
 */
function rangosPorEncimaDelTope(motor: NuevoPersonajeService, clase: Clase, hueco: HuecoDeNivelSustitucion, quitadas: RefHabilidadDelNivel[],
    nivelPersonaje: number): string[] {
    if (quitadas.length < 1)
        return [];
    const pj = motor.PersonajeCreacion;
    const tope = limiteRangosHabilidad(nivelPersonaje, false);
    const otrosNiveles = (pj.Orden_niveles ?? []).filter((o) => toInt(o?.idClase) === hueco.idClase && toInt(o?.nivelClase) !== hueco.nivelClase)
        .map((o) => habilidadesDelNivel(motor, clase, nivelDeSustitucion(clase, o?.idNivelSustitucion)));
    const otrasClases = (pj.desgloseClases ?? []).filter((c) => toInt(c?.Nivel) > 0 && toInt(c?.Id) !== hueco.idClase)
        .map((c) => motor.claseDelCatalogo(toInt(c?.Id))).filter((c): c is Clase => !!c)
        .map((c) => habilidadesDelNivel(motor, c, null));
    return quitadas.flatMap((q) => {
        const enOtro = [...otrosNiveles, ...otrasClases].some((lista) => lista.some((h) => mismaHabilidad(h, q)));
        if (enOtro)
            return [];
        return (pj.Habilidades ?? [])
            .filter((h) => esLaHabilidad(h, q.idHabilidad, q.idExtra) && toNumber(h?.Rangos) > tope)
            .map((h) => nombreDeHabilidadConExtra(h));
    });
}

/**
 * Los conocidos que sobran con el nivel nuevo: la tabla de conocidos de la clase en su nivel de ahora, con los niveles de
 * sustitución de antes y de después (`conjuros_conocidos`); si da menos, hay que olvidar esos (los elige el jugador).
 */
function conocidosQueSobran(motor: NuevoPersonajeService, clase: Clase, entrada: PersonajeCreateRequestDto, hueco: HuecoDeNivelSustitucion,
    pone: OpcionDeNivelReciclable, hasta: number): ConocidosDeMas[] {
    const tomados = sustitucionesDeLaClase(motor.PersonajeCreacion.Orden_niveles, hueco.idClase);
    const sinElHueco = tomados.filter((t) => t.nivelClase !== hueco.nivelClase);
    const despues = pone.idNivelSustitucion ? [...sinElHueco, { nivelClase: hueco.nivelClase, idNivelSustitucion: pone.idNivelSustitucion }] : sinElHueco;
    const dA = detalleConSustituciones(clase, hasta, tomados);
    const dD = detalleConSustituciones(clase, hasta, despues);
    if (!dA || !dD)
        return [];
    const catalogo = motor.CatalogoConjuros;
    const claseRef = { id: hueco.idClase, nombre: `${clase.Nombre}` };
    const conocidos = (entrada.colecciones?.conjurosConocidos ?? []).filter((c) => !c.copiado && toInt(c.idClase) === hueco.idClase)
        .map((c) => {
            const conjuro = catalogo.find((k) => toInt(k?.Id) === toInt(c.idConjuro));
            return { idConjuro: toInt(c.idConjuro), nombre: `${conjuro?.Nombre ?? `#${toInt(c.idConjuro)}`}`, nivel: nivelDelConjuroEnLaClase(conjuro, claseRef) };
        });
    const salida: ConocidosDeMas[] = [];
    const total = toInt(dA.Conjuros_conocidos_total) - toInt(dD.Conjuros_conocidos_total);
    if (total > 0)
        salida.push({ nivelConjuro: null, cantidad: total, candidatos: conocidos.map(({ idConjuro, nombre }) => ({ idConjuro, nombre })) });
    Object.entries(dA.Conjuros_conocidos_nivel_a_nivel ?? {}).forEach(([clave, valor]) => {
        const menos = toInt(valor) - toInt((dD.Conjuros_conocidos_nivel_a_nivel ?? {})[clave]);
        const nivel = nivelDeClaveConjuro(clave);
        if (menos > 0 && nivel >= 0)
            salida.push({ nivelConjuro: nivel, cantidad: menos, candidatos: conocidos.filter((c) => c.nivel === nivel).map(({ idConjuro, nombre }) => ({ idConjuro, nombre })) });
    });
    return salida;
}

// --- Lo que elige el jugador ---------------------------------------------------------------------------------------------

/** Una habilidad en la que puede quitar o comprar rangos por la diferencia de puntos. */
export interface HabilidadDelNivel {
    idHabilidad: number;
    idExtra: number;
    nombre: string;
    rangos: number;
    /** Lo que cuesta un rango en el nivel nuevo: 1 si es de su lista, 2 si no. */
    coste: number;
    /** Cuántos rangos puede quitar (con menos puntos) o comprar (con más) como mucho. */
    maximo: number;
}

/**
 * Las habilidades en las que reparte la diferencia de puntos: con menos, las que tienen rangos comprados (1 rango por
 * punto); con más, las del catálogo con su especialidad elegida, con su coste en el nivel nuevo (de su lista, 1; si no, 2)
 * y su tope con el nivel de antes de subir (de clase en alguna, + 3; si no, la mitad).
 */
export function habilidadesParaLosPuntos(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, hueco: HuecoDeNivelSustitucion,
    pone: OpcionDeNivelReciclable, puntos: number, nivelPersonaje: number): HabilidadDelNivel[] {
    const clase = motor.claseDelCatalogo(hueco.idClase);
    if (!clase || puntos === 0)
        return [];
    const lista = habilidadesDelNivel(motor, clase, pone.nivel);
    const guardadas = entrada.colecciones?.habilidades?.base ?? [];
    return (motor.PersonajeCreacion.Habilidades ?? [])
        .filter((h) => !h?.Custom && toInt(h?.Id) > 0 && !(h.Soporta_extra && idExtraHabilidadParaGuardar(h) <= 0))
        .map((h) => {
            const idHabilidad = toInt(h.Id);
            const idExtra = Math.max(0, idExtraHabilidadParaGuardar(h));
            const guardada = guardadas.find((g) => toInt(g?.idHabilidad) === idHabilidad && mismoExtra(toInt(g?.idExtra), idExtra));
            const rangos = toInt(guardada?.rangos ?? h.Rangos);
            const deLaLista = lista.some((r) => mismaHabilidad(r, { idHabilidad, idExtra }));
            const tope = limiteRangosHabilidad(nivelPersonaje, deLaLista || motor.esHabilidadDeClaseEnAlguna(h));
            const coste = deLaLista ? COSTE_RANGO_CLASEA : COSTE_RANGO_TRANSCLASEA;
            const maximo = puntos < 0 ? Math.min(rangos, -puntos) : Math.max(0, Math.min(tope - rangos, Math.floor(puntos / coste)));
            return { idHabilidad, idExtra, nombre: nombreDeHabilidadConExtra(h), rangos, coste, maximo };
        })
        .filter((h) => h.maximo > 0)
        .sort((a, b) => a.coste - b.coste || a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Por qué no cuadra el reparto de la diferencia de puntos (`null` si cuadra): con menos puntos, quita exactamente esos
 * rangos (o todos los que tiene, si son menos); con más, no gasta más de los que tiene (los que no gaste, se pierden).
 */
export function motivoDeLosRangos(puntos: number, rangos: CambioDeRangosDelNivel[], habilidades: HabilidadDelNivel[]): string | null {
    if (puntos === 0)
        return null;
    let gasto = 0;
    for (const r of rangos) {
        const h = habilidades.find((x) => x.idHabilidad === r.idHabilidad && mismoExtra(x.idExtra, r.idExtra));
        if (!h || Math.abs(r.rangos) > h.maximo)
            return `En ${r.nombre} no caben esos rangos.`;
        gasto += Math.abs(r.rangos) * (puntos < 0 ? 1 : h.coste);
    }
    // Con menos puntos, un rango por punto, sin pasar de los que tiene comprados (los puntos que no gastó no tienen rangos).
    const aQuitar = Math.min(-puntos, habilidades.reduce((suma, h) => suma + h.rangos, 0));
    if (puntos < 0 && gasto !== aQuitar)
        return `El nivel nuevo da ${-puntos} ${-puntos === 1 ? 'punto' : 'puntos'} menos: quita ${aQuitar} ${aQuitar === 1 ? 'rango' : 'rangos'} (llevas ${gasto}).`;
    if (puntos > 0 && gasto > puntos)
        return `El nivel nuevo da ${puntos} ${puntos === 1 ? 'punto' : 'puntos'} más, y el reparto gasta ${gasto}.`;
    return null;
}

/** Los destinos del traspaso: las habilidades que añade el nivel nuevo, con su especialidad elegida y sin pasar del tope. */
export function destinosDelTraspaso(motor: NuevoPersonajeService, analisis: AnalisisDelNivel, rangos: number, nivelPersonaje: number)
    : Array<RefHabilidadDelNivel & { rangos: number; motivo: string | null; }> {
    const tope = limiteRangosHabilidad(nivelPersonaje, true);
    return (motor.PersonajeCreacion.Habilidades ?? [])
        .filter((h) => !h?.Custom && toInt(h?.Id) > 0)
        .filter((h) => analisis.habilidadesAnadidas.some((a) => mismaHabilidad(a, { idHabilidad: toInt(h.Id), idExtra: Math.max(0, idExtraHabilidadParaGuardar(h)) })))
        .map((h) => {
            const idExtra = idExtraHabilidadParaGuardar(h);
            const base = { idHabilidad: toInt(h.Id), idExtra: Math.max(0, idExtra), nombre: nombreDeHabilidadConExtra(h), rangos: toInt(h.Rangos) };
            if (h.Soporta_extra && idExtra <= 0)
                return { ...base, motivo: 'Aún no tiene elegida su especialidad.' };
            if (base.rangos + rangos > tope)
                return { ...base, motivo: `Con ${rangos} más pasaría de ${tope} rangos (su nivel, ${toInt(nivelPersonaje)}, + 3).` };
            return { ...base, motivo: null };
        });
}

/** Por qué no se puede confirmar el plan (falta algo por elegir o no cuadra); `null` si está completo. */
export function motivoDelPlan(plan: PlanNivelSustitucion, habilidades: HabilidadDelNivel[]): string | null {
    const { analisis } = plan;
    if (analisis.motivo)
        return analisis.motivo;
    if (analisis.doteAElegir && !plan.doteElegida)
        return `Falta elegir la dote de ${analisis.doteAElegir.aptitud}.`;
    for (const c of analisis.conocidosDeMas) {
        const elegidos = plan.olvidados.filter((o) => c.candidatos.some((k) => k.idConjuro === o.idConjuro)).length;
        if (elegidos < c.cantidad)
            return `El nivel nuevo da ${c.cantidad} ${c.cantidad === 1 ? 'conocido' : 'conocidos'} menos${c.nivelConjuro === null ? '' : ` de nivel ${c.nivelConjuro}`}: elige ${c.cantidad === 1 ? 'cuál olvida' : 'cuáles olvida'}.`;
    }
    return motivoDeLosRangos(analisis.puntos, plan.rangos, habilidades);
}

// --- Aplicarlo ---------------------------------------------------------------------------------------------------------

/** Las filas que cambian en la ficha: las de la tabla y la dote elegida con la aptitud que entra. */
function cambiosEnLaFicha(plan: PlanNivelSustitucion): CambioDeRasgoEnElMotor[] {
    const dote = plan.doteElegida?.dote;
    const nivel = plan.analisis.doteAElegir?.nivelClase ?? plan.hueco.nivelClase;
    return [...plan.analisis.cambios, ...(dote ? [{ nivelClase: nivel, tipo: 'dote' as const, quita: null, pone: { ...dote, idInterno: 0 } }] : [])];
}

/**
 * El hueco de la dote que da a elegir la aptitud que entra, para el selector de dotes de la creación: con el nivel ya
 * cambiado en el motor, de su tipo y en su nivel. Cambia el motor: quien llama lo deja como estaba. `null` si no hay.
 */
export function huecoDeLaDoteDelNivel(motor: NuevoPersonajeService, plan: Pick<PlanNivelSustitucion, 'hueco' | 'pone' | 'analisis'>) {
    const dote = plan.analisis.doteAElegir;
    if (!dote || !motor.cambiarNivelDeSustitucion(plan.hueco.idClase, plan.hueco.nivelClase, plan.pone.idNivelSustitucion)
        || !motor.aplicarCambiosDeRasgo(plan.hueco.idClase, plan.analisis.cambios))
        return null;
    const origen = origenDeNivelDeClase(plan.hueco.clase, dote.nivelClase);
    const pendiente = motor.registrarDotePendienteDeAptitud({
        origen, tipoPermitido: dote.tipo, nivel: { idClase: plan.hueco.idClase, nivelClase: dote.nivelClase },
        alNivel: plan.hueco.indiceNivel, origenFijo: motor.origenDeLaDoteDeAptitud(origen),
    });
    return { pendiente, candidatos: motor.obtenerCandidatosDotePendiente(pendiente.id) };
}

/** La habilidad del motor (no personalizada) de `{ idHabilidad, idExtra }` (`esLaHabilidad`). */
function habilidadDelMotor(motor: NuevoPersonajeService, ref: { idHabilidad: number; idExtra: number; }) {
    return (motor.PersonajeCreacion.Habilidades ?? []).find((h) => esLaHabilidad(h, ref.idHabilidad, ref.idExtra));
}

/**
 * Pasa en el motor los rangos de un traspaso (`TraspasoDeRangos`) de la habilidad de origen a la de destino, cada una por
 * su id y su extra. `false` si falta alguna o el origen no tiene esos rangos. Lo usan el reciclaje `rangos` y el traspaso
 * de un nivel de sustitución.
 */
export function traspasarRangosEnElMotor(motor: NuevoPersonajeService, traspaso: TraspasoDeRangos): boolean {
    const origen = habilidadDelMotor(motor, traspaso.quita);
    const destino = habilidadDelMotor(motor, traspaso.pone);
    if (!origen || !destino || toNumber(origen.Rangos) < traspaso.rangos)
        return false;
    origen.Rangos = toNumber(origen.Rangos) - traspaso.rangos;
    destino.Rangos = toNumber(destino.Rangos) + traspaso.rangos;
    return true;
}

/**
 * Hace el reciclaje del nivel en el motor, antes del nivel nuevo: el nivel cambiado en el registro, lo que sale y entra de
 * la tabla, la dote elegida, los rangos (los de la diferencia y el traspaso) y los conocidos que olvida. `false` si algo
 * no está (el motor puede quedar a medias: quien llama lo vuelve a hidratar).
 */
export function aplicarNivelSustitucionAlMotor(motor: NuevoPersonajeService, plan: PlanNivelSustitucion): boolean {
    const { hueco } = plan;
    if (plan.analisis.doteAElegir) {
        const delHueco = huecoDeLaDoteDelNivel(motor, plan);
        if (!delHueco || !plan.doteElegida || !motor.aplicarDotePendiente(delHueco.pendiente.id, plan.doteElegida.seleccion))
            return false;
    } else if (!motor.cambiarNivelDeSustitucion(hueco.idClase, hueco.nivelClase, plan.pone.idNivelSustitucion)
        || !motor.aplicarCambiosDeRasgo(hueco.idClase, plan.analisis.cambios))
        return false;
    const pj = motor.PersonajeCreacion;
    for (const r of plan.rangos) {
        const h = habilidadDelMotor(motor, r);
        if (!h || toNumber(h.Rangos) + r.rangos < 0)
            return false;
        h.Rangos = toNumber(h.Rangos) + r.rangos;
    }
    if (plan.traspaso && !traspasarRangosEnElMotor(motor, plan.traspaso))
        return false;
    const claseNorm = normalizarTexto(hueco.clase);
    for (const o of plan.olvidados)
        if (!sacarPrimero(pj.Conjuros ?? [], (x) => toInt(x?.Id) === o.idConjuro && esConjuroDeLaClase(x, claseNorm)))
            return false;
    return true;
}

/** Las colecciones de las que la ficha quita lo que quita el motor al reciclar el nivel: las competencias de la clase. */
const QUITAR_EN_EL_NIVEL: ReadonlySet<string> = new Set([
    'raciales', 'competencia_arma', 'competencia_armadura', 'competencia_grupo_arma', 'competencia_grupo_armadura',
]);

/**
 * La `entrada` con el nivel reciclado: lo que sale y entra de la tabla (las aptitudes y las dotes, en las elecciones de su
 * nivel, `fichaConLosCambiosDeClase`) y, con el cuerpo del motor antes y después, lo demás que cambia (las competencias,
 * las habilidades y sus rangos, los modificadores, el ataque base, los conocidos que entran y los que salen). Los PG, con
 * lo que dice el libro; el hueco del registro, con su nivel nuevo y su tirada.
 */
export function fichaConElNivelDeSustitucion(entrada: PersonajeCreateRequestDto, plan: PlanNivelSustitucion,
    motor: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null | undefined): PersonajeCreateRequestDto {
    const conLaTabla = fichaConLosCambiosDeClase(entrada, plan.hueco.idClase, cambiosEnLaFicha(plan));
    const puntosGolpe = Math.max(1, toInt(entrada.personaje?.puntosGolpe) + plan.analisis.pg.delta);
    let ficha: PersonajeCreateRequestDto = conLaTabla;
    if (motor) {
        // Las aptitudes y las dotes ya van con `fichaConLosCambiosDeClase`: el motor no las vuelve a poner.
        const antes: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(motor.antes));
        antes.colecciones = { ...(antes.colecciones ?? {}), especiales: motor.despues.colecciones?.especiales ?? [], dotes: motor.despues.colecciones?.dotes ?? [] } as any;
        ficha = fichaConLoDelMotor({
            entrada: conLaTabla, antes, despues: motor.despues, puntosGolpe, quitarEn: QUITAR_EN_EL_NIVEL,
            olvidados: [...plan.olvidados.map((o) => ({ idConjuro: o.idConjuro, idClase: plan.hueco.idClase })), ...plan.analisis.conocidosFijosQueSalen],
        });
    } else
        ficha.personaje.puntosGolpe = puntosGolpe;
    ficha.niveles = (ficha.niveles ?? []).map((n, i) => {
        if (i !== plan.hueco.indiceNivel)
            return n;
        const nivel: any = { ...n };
        ponerNivelDeSustitucion(nivel, plan.pone.idNivelSustitucion);
        if (n.pg && plan.analisis.pg.tiradaDespues !== null && !n.pg.maximo)
            nivel.pg = { ...n.pg, tirada: plan.analisis.pg.tiradaDespues };
        return nivel;
    });
    return ficha;
}

/** El cuerpo `reciclaje` del contrato (`nivel_sustitucion`). */
export function reciclajeDelNivel(plan: PlanNivelSustitucion) {
    return {
        tipo: 'nivel_sustitucion' as const,
        hueco: { idClase: plan.hueco.idClase, nivelClase: plan.hueco.nivelClase },
        quita: { idNivelSustitucion: plan.hueco.tiene?.nivel.Id ?? null },
        pone: { idNivelSustitucion: plan.pone.idNivelSustitucion },
        ...(plan.traspaso ? { traspaso: traspasoDelCuerpo(plan.traspaso) } : {}),
    };
}

/** `{ quita, pone, rangos }` del contrato de un traspaso (el reciclaje `rangos` y el `traspaso` de `nivel_sustitucion`). */
export function traspasoDelCuerpo(traspaso: TraspasoDeRangos) {
    return {
        quita: { idHabilidad: traspaso.quita.idHabilidad, idExtra: traspaso.quita.idExtra },
        pone: { idHabilidad: traspaso.pone.idHabilidad, idExtra: traspaso.pone.idExtra },
        rangos: traspaso.rangos,
    };
}

/** «+2 PG», «−1 PG» o «sin cambio de PG». */
export function textoDePg(delta: number): string {
    return delta === 0 ? 'sin cambio de PG' : `${textoConSigno(delta, '−')} PG`;
}
