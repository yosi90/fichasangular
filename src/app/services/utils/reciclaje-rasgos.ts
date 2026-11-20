import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type {
    CambioDeRasgoEnElMotor, DoteSeleccionConfirmada, DoteSelectorCandidato, FilaDeTablaDeClase, NuevoPersonajeService,
} from 'src/app/services/nuevo-personaje.service';
import { extrasElegiblesEspecial } from './aptitudes-clase';
import { sacarDoteDeLaFicha, sacarPrimero, sinDecisionesDeDotesQueNoTiene } from './correccion-ficha';
import { esLaEleccion, nivelDelOrden } from './niveles-creacion';
import { mismoExtra, normalizarTexto, toInt } from './normalizacion';
import { tieneTextoVisible } from './texto-visible';

/*
 * El reciclaje de un rasgo de clase (R3; *Manual del jugador II*, págs. 194-195, tabla 8-2; contrato en
 * `docs/publica/endpoints/personajes.md`, «Subida de nivel», «El reciclaje», `rasgo`; dictamen del máster de Rol del
 * 2026-11-20 en el roadmap de sesiones). Un hueco es una elección de la tabla de una clase que el personaje tiene: un grupo
 * opcional con dos o más opciones posibles en ese nivel (el estilo de combate del explorador, las dotes adicionales del
 * monje y del mago…) o una aptitud con el extra «Elegir» (el gran arcano del archimago). Qué eligió se deduce por lo que
 * tiene (las fichas de antes no tienen registro). Se cambia por otra opción del mismo hueco; lo que su tabla da por la
 * opción (las dotes con `id_especial_requerido` o `id_dote_requerida` hasta su nivel de clase de ahora) cambia solo, y lo
 * que depende de la antigua y se eligió después bloquea. Nada sale de un nombre ni de un id fijo: todo, de los datos.
 */

/** Una aptitud o una dote de un hueco, con sus nombres. */
export interface ElementoDeRasgo {
    id: number;
    idExtra: number;
    nombre: string;
    extra: string;
}

/** Una dote del personaje en un hueco, con su origen (el de la ficha). */
export interface DoteDelRasgo extends ElementoDeRasgo {
    origen: string;
}

/** Una opción de un hueco: una aptitud de la tabla, una dote de la tabla o una aptitud que da a elegir una dote. */
export interface OpcionDeRasgo {
    /** Única en su hueco: la fila de la tabla y, con «Elegir», el extra. */
    clave: string;
    tipoFila: 'dote' | 'especial';
    especial: ElementoDeRasgo | null;
    dote: ElementoDeRasgo | null;
    /** La aptitud da a elegir una dote (`Otorga_dote`: la «Dote adicional» del mago), de su tipo (`null`, de cualquiera). */
    daDote: { tipo: string | null; } | null;
    /** Su `id_interno` en la tabla de la clase (0 sin él). */
    idInterno: number;
    /** Por qué no se puede poner; `null` si se puede. */
    motivo: string | null;
}

/** Un hueco de rasgo de clase del personaje: qué tiene y qué otras opciones hay en él. */
export interface HuecoDeRasgo {
    clave: string;
    idClase: number;
    clase: string;
    nivelClase: number;
    /** El grupo opcional de la tabla, o `null` en una aptitud con «Elegir». */
    grupo: number | null;
    /** La aptitud con «Elegir», o `null` en un grupo. */
    idEspecial: number | null;
    /** Lo que tiene en el hueco. */
    tiene: OpcionDeRasgo;
    /** La dote que tiene en el hueco: la de la tabla o la que eligió con la aptitud, con su origen; `null` sin dote. */
    doteQueTiene: DoteDelRasgo | null;
    /** Si la aptitud que tiene la da también otro hueco (la dote adicional del mago a 5 y a 10): no se quita. */
    aptitudCompartida: boolean;
    /** Las opciones que puede poner en su lugar (las que no, con su motivo). */
    opciones: OpcionDeRasgo[];
    /** El índice de su nivel en el registro (`Orden_niveles`), con cuyo estado se juzga la dote nueva; `null` si no está. */
    indiceNivel: number | null;
    /** Por qué no se puede reciclar; `null` si se puede. */
    motivo: string | null;
}

/** Una fila de lo que cambia al reciclar el rasgo, con sus nombres para el resumen; `derivado`, lo que cambia solo. */
export interface CambioDeRasgo extends CambioDeRasgoEnElMotor {
    derivado: boolean;
    nombreQuita: string;
    nombrePone: string;
}

/** La dote elegida con la aptitud que la da (la nueva «Dote adicional» del mago): la selección y la dote, con su origen. */
export interface DoteElegidaEnElRasgo {
    seleccion: DoteSeleccionConfirmada;
    dote: DoteDelRasgo;
}

/** Lo que se elige al reciclar un rasgo: el hueco, la opción nueva, la dote que elige con ella y lo que cambia. */
export interface PlanRasgo {
    tipo: 'rasgo';
    hueco: HuecoDeRasgo;
    pone: OpcionDeRasgo;
    doteElegida: DoteElegidaEnElRasgo | null;
    /** Lo que cambia en el motor y en la ficha, sin la dote elegida (va por el selector): lo de la opción y lo derivado. */
    cambios: CambioDeRasgo[];
}

/** El nombre de una aptitud o una dote con su extra, si tiene algo que enseñar (`tieneTextoVisible`): «Dote adicional (Metamágica)». */
export function nombreConExtra(elemento: ElementoDeRasgo | null | undefined): string {
    if (!elemento)
        return '';
    const extra = `${elemento.extra ?? ''}`.trim();
    return elemento.idExtra > 0 && tieneTextoVisible(extra) ? `${elemento.nombre} (${extra})` : elemento.nombre;
}

/**
 * El nombre de una opción; con la dote que se eligió con ella, la aptitud y la dote, como la frase de la API («Dote adicional
 * (Potenciar conjuro)»).
 */
export function nombreDeOpcion(opcion: OpcionDeRasgo, dote?: ElementoDeRasgo | null): string {
    if (dote && opcion.especial)
        return `${opcion.especial.nombre} (${nombreConExtra(dote)})`;
    return nombreConExtra(opcion.especial) || nombreConExtra(opcion.dote);
}

/** Lo que tiene en el hueco, con su nombre («Combate con dos armas»; «Dote adicional (Potenciar conjuro)»). */
export function nombreDeLoQueTiene(hueco: HuecoDeRasgo): string {
    return nombreDeOpcion(hueco.tiene, hueco.tiene.daDote ? hueco.doteQueTiene : null);
}

interface EspecialQueTiene extends ElementoDeRasgo { usada: boolean; }
interface DoteQueTiene extends DoteDelRasgo { usada: boolean; }

/** Si una dote del catálogo es del tipo (`null`, cualquiera), como en el selector de dotes (`cumpleRestriccionTipoDote`). */
function esDelTipo(motor: NuevoPersonajeService, idDote: number, tipo: string | null): boolean {
    if (tipo === null)
        return true;
    const dote = motor.doteDelCatalogo(idDote);
    return !!dote && motor.cumpleRestriccionTipoDote(dote, tipo);
}

/** La opción de una fila (con «Elegir», la de un extra). */
function opcionDeFila(fila: FilaDeTablaDeClase, extra?: { id: number; nombre: string; }): OpcionDeRasgo {
    const elemento: ElementoDeRasgo = { id: fila.id, idExtra: extra ? extra.id : fila.idExtra, nombre: fila.nombre, extra: extra ? extra.nombre : fila.extra };
    return {
        clave: `${fila.tipo}:${fila.id}:${fila.idInterno}:${extra ? extra.id : fila.idExtra}`,
        tipoFila: fila.tipo,
        especial: fila.tipo === 'especial' ? elemento : null,
        dote: fila.tipo === 'dote' ? elemento : null,
        daDote: fila.otorgaDote ? { tipo: fila.tipoDeDote } : null,
        idInterno: fila.idInterno,
        motivo: fila.motivoActitud,
    };
}

/**
 * Los huecos de rasgo de clase del personaje (el motor recién hidratado, el personaje de antes de subir), nivel a nivel de
 * cada clase que tiene, con lo que eligió en cada uno y las demás opciones. `aptitudes`: el detalle de las aptitudes con
 * «Elegir» (`GET /clases/habilidades/{id}`), para sus opciones; sin él, el hueco sale sin opciones y con su motivo. El
 * motivo de lo que depende de lo que tiene lo pone `rasgosParaReciclar` (`reciclaje.ts`).
 */
export function huecosDeRasgo(motor: NuevoPersonajeService, aptitudes: ReadonlyMap<number, EspecialClaseDetalle | null> = new Map()): HuecoDeRasgo[] {
    const pj = motor.PersonajeCreacion;
    const especiales: EspecialQueTiene[] = (pj.Claseas ?? []).map((e) => ({
        id: toInt(e?.Id), idExtra: Math.max(0, toInt(e?.Id_extra)), nombre: `${e?.Nombre ?? ''}`, extra: `${e?.Extra ?? ''}`, usada: false,
    })).filter((e) => e.id > 0);
    const dotes: DoteQueTiene[] = motor.dotesDelPersonaje().map((d) => ({
        id: toInt(d?.Dote?.Id), idExtra: Math.max(0, toInt(d?.Contexto?.Id_extra)), nombre: `${d?.Dote?.Nombre ?? ''}`,
        extra: toInt(d?.Contexto?.Id_extra) > 0 ? `${d?.Contexto?.Extra ?? ''}` : '', origen: `${(d?.Contexto as any)?.Origen ?? ''}`, usada: false,
    })).filter((d) => d.id > 0);
    const orden = pj.Orden_niveles ?? [];
    const huecos: HuecoDeRasgo[] = [];

    (pj.desgloseClases ?? []).filter((c) => toInt(c?.Nivel) > 0).forEach((entrada) => {
        const clase = motor.claseDelCatalogo(toInt(entrada?.Id));
        if (!clase)
            return;
        const idClase = toInt(clase.Id);
        for (let n = 1; n <= toInt(entrada?.Nivel); n++) {
            const filas = motor.filasDeLaTablaDeClase(clase, n);
            const indice = orden.findIndex((o) => toInt(o?.idClase) === idClase && toInt(o?.nivelClase) === n);
            const base = { idClase, clase: `${clase.Nombre}`, nivelClase: n, indiceNivel: indice >= 0 ? indice : null };
            const origenDeNivel = `${clase.Nombre} nivel ${n}`;
            const origenDeAptitud = normalizarTexto(motor.origenDeLaDoteDeAptitud(origenDeNivel));
            const conOrigen = (d: DoteQueTiene, origen: string) => normalizarTexto(d.origen) === normalizarTexto(origen);
            const conOrigenDeAptitud = (d: DoteQueTiene) => normalizarTexto(d.origen) === origenDeAptitud
                || normalizarTexto(d.origen).startsWith(`${origenDeAptitud} (`);

            /** El hueco de una aptitud con «Elegir» que tiene (`especial`, la suya), con los extras que puede poner. */
            const huecoElegir = (fila: FilaDeTablaDeClase, especial: EspecialQueTiene, k: number): HuecoDeRasgo => {
                const tiene = opcionDeFila(fila, { id: especial.idExtra, nombre: especial.extra });
                const detalle = aptitudes.get(fila.id) ?? null;
                const tomados = especiales.filter((e) => e.id === fila.id).map((e) => e.idExtra);
                const opciones = detalle ? extrasElegiblesEspecial(detalle, tomados).map((x) => ({ ...opcionDeFila(fila, x), motivo: null })) : [];
                return {
                    ...base, clave: `${idClase}:${n}:e${fila.id}:${k}`, grupo: null, idEspecial: fila.id, tiene, doteQueTiene: null,
                    aptitudCompartida: false, opciones,
                    motivo: detalle ? (opciones.length ? null : `No hay otro extra que elegir en ${fila.nombre}.`) : `No se han podido leer las opciones de ${fila.nombre}.`,
                };
            };
            const elegirDeEstaFila = (fila: FilaDeTablaDeClase, k: number) => {
                const especial = especiales.find((e) => !e.usada && e.id === fila.id && e.idExtra > 0);
                if (!especial)
                    return;
                especial.usada = true;
                huecos.push(huecoElegir(fila, especial, k));
            };

            /** Lo que eligió en el grupo, por lo que tiene: primero lo que lleva el origen de este nivel. */
            const queTiene = (posibles: FilaDeTablaDeClase[]): { fila: FilaDeTablaDeClase; especial: EspecialQueTiene | null; dote: DoteQueTiene | null; } | null => {
                const doteDeFila = (f: FilaDeTablaDeClase, origen: boolean) => dotes.find((d) => !d.usada && d.id === f.id
                    && (f.idExtra <= 0 || mismoExtra(d.idExtra, f.idExtra)) && (!origen || conOrigen(d, origenDeNivel)));
                const especialDeFila = (f: FilaDeTablaDeClase) => especiales.find((e) => e.id === f.id
                    && (f.elegir ? e.idExtra > 0 && !e.usada : mismoExtra(e.idExtra, f.idExtra) && (f.otorgaDote || !e.usada)));
                const doteDeAptitud = (f: FilaDeTablaDeClase, origen: boolean) => dotes.find((d) => !d.usada && esDelTipo(motor, d.id, f.tipoDeDote)
                    && (origen ? conOrigenDeAptitud(d) : normalizarTexto(d.origen).includes(normalizarTexto(`${clase.Nombre}`))));
                const usar = (fila: FilaDeTablaDeClase, especial: EspecialQueTiene | null, dote: DoteQueTiene | null) => {
                    if (especial && !fila.otorgaDote)
                        especial.usada = true;
                    if (dote)
                        dote.usada = true;
                    return { fila, especial, dote };
                };
                for (const origen of [true, false]) {
                    for (const f of posibles) {
                        if (f.tipo === 'dote') {
                            const dote = doteDeFila(f, origen);
                            if (dote)
                                return usar(f, null, dote);
                        } else if (f.otorgaDote) {
                            const especial = especialDeFila(f);
                            const dote = especial ? doteDeAptitud(f, origen) : undefined;
                            if (especial && dote)
                                return usar(f, especial, dote);
                        } else if (!origen) {
                            const especial = especialDeFila(f);
                            if (especial)
                                return usar(f, especial, null);
                        }
                    }
                }
                return null;
            };

            /** Las opciones de una fila del grupo para poner en lugar de `tiene` (con «Elegir», una por extra). */
            const opcionesDeFila = (f: FilaDeTablaDeClase, tiene: OpcionDeRasgo): OpcionDeRasgo[] => {
                // La misma aptitud que da una dote sí: otra dote de su tipo (otra metamágica, MJ pág. 48).
                if (mismaFila(opcionDeFila(f), tiene) && !f.otorgaDote)
                    return [];
                if (f.elegir) {
                    const detalle = aptitudes.get(f.id) ?? null;
                    if (!detalle)
                        return [{ ...opcionDeFila(f), motivo: f.motivoActitud ?? `No se han podido leer las opciones de ${f.nombre}.` }];
                    return extrasElegiblesEspecial(detalle, especiales.filter((e) => e.id === f.id).map((e) => e.idExtra)).map((x) => opcionDeFila(f, x));
                }
                const opcion = opcionDeFila(f);
                if (opcion.motivo || f.otorgaDote)
                    return [opcion];
                const yaLaTiene = f.tipo === 'dote'
                    ? dotes.some((d) => d.id === f.id && (f.idExtra <= 0 || mismoExtra(d.idExtra, f.idExtra)))
                    : especiales.some((e) => e.id === f.id && mismoExtra(e.idExtra, f.idExtra));
                return [{ ...opcion, motivo: yaLaTiene ? 'Ya la tiene.' : null }];
            };

            filas.filter((f) => f.grupo === 0 && f.tipo === 'especial' && f.elegir).forEach((f, k) => elegirDeEstaFila(f, k));

            Array.from(new Set(filas.filter((f) => f.grupo > 0).map((f) => f.grupo))).sort((a, b) => a - b).forEach((grupo) => {
                // Las filas con requisito salen de lo que se eligió antes (las dotes del estilo de combate): no se eligen.
                const posibles = filas.filter((f) => f.grupo === grupo && !esDerivada(f));
                if (posibles.length < 2) {
                    filas.filter((f) => f.grupo === grupo && f.tipo === 'especial' && f.elegir).forEach((f) => elegirDeEstaFila(f, 100 + grupo));
                    return;
                }
                const elegida = queTiene(posibles);
                if (!elegida)
                    return;
                const tiene = elegida.fila.elegir && elegida.especial
                    ? opcionDeFila(elegida.fila, { id: elegida.especial.idExtra, nombre: elegida.especial.extra })
                    : opcionDeFila(elegida.fila);
                const opciones = posibles.flatMap((f) => opcionesDeFila(f, tiene));
                huecos.push({
                    ...base, clave: `${idClase}:${n}:g${grupo}`, grupo, idEspecial: null, tiene,
                    doteQueTiene: elegida.dote ? { id: elegida.dote.id, idExtra: elegida.dote.idExtra, nombre: elegida.dote.nombre, extra: elegida.dote.extra, origen: elegida.dote.origen } : null,
                    aptitudCompartida: false, opciones, motivo: opciones.some((o) => !o.motivo) ? null : 'No hay otra opción que pueda poner en ese hueco.',
                });
                if (elegida.fila.elegir && elegida.especial)
                    huecos.push(huecoElegir(elegida.fila, elegida.especial, 100 + grupo));
            });
        }
    });

    // La aptitud que tiene en dos grupos (la «Dote adicional (Metamágica)» del mago a 5 y a 10) está una vez en la ficha. Con
    // «Elegir», cada hueco tiene su extra.
    const deGrupo = (h: HuecoDeRasgo) => h.grupo !== null && !!h.tiene.especial;
    huecos.forEach((h) => h.aptitudCompartida = deGrupo(h) && huecos.some((o) => o !== h && deGrupo(o)
        && o.tiene.especial!.id === h.tiene.especial!.id && mismoExtra(o.tiene.especial!.idExtra, h.tiene.especial!.idExtra)));
    return huecos;
}

/**
 * Las aptitudes con «Elegir» de las tablas de sus clases hasta su nivel: las que hay que leer
 * (`GET /clases/habilidades/{id}`) para ofrecer sus extras en `huecosDeRasgo`.
 */
export function aptitudesConElegir(motor: NuevoPersonajeService): number[] {
    const ids = new Set<number>();
    (motor.PersonajeCreacion.desgloseClases ?? []).forEach((entrada) => {
        const clase = motor.claseDelCatalogo(toInt(entrada?.Id));
        for (let n = 1; clase && n <= toInt(entrada?.Nivel); n++)
            motor.filasDeLaTablaDeClase(clase, n).filter((f) => f.tipo === 'especial' && f.elegir && f.id > 0).forEach((f) => ids.add(f.id));
    });
    return Array.from(ids);
}

/** Una fila de la tabla de la clase de un hueco, con su nivel de clase. */
interface FilaConNivel {
    nivelClase: number;
    fila: FilaDeTablaDeClase;
}

/** Las filas de la tabla de la clase del hueco hasta su nivel de ahora (el de antes de subir), con su nivel. */
function filasDeLaClase(motor: NuevoPersonajeService, hueco: HuecoDeRasgo): FilaConNivel[] {
    const clase = motor.claseDelCatalogo(hueco.idClase);
    const nivel = toInt((motor.PersonajeCreacion.desgloseClases ?? []).find((c) => toInt(c?.Id) === hueco.idClase)?.Nivel);
    const filas: FilaConNivel[] = [];
    for (let n = 1; clase && n <= nivel; n++)
        motor.filasDeLaTablaDeClase(clase, n).forEach((fila) => filas.push({ nivelClase: n, fila }));
    return filas;
}

/** Si una fila sale de lo que se eligió antes en su tabla (`id_especial_requerido` o `id_dote_requerida`): no se elige. */
export function esDerivada(fila: FilaDeTablaDeClase): boolean {
    return fila.idEspecialRequerido > 0 || fila.idDoteRequerida > 0;
}

/** Si dos opciones son la misma fila de la tabla (con «Elegir», con otro extra; la aptitud que da una dote, con otra). */
export function mismaFila(a: OpcionDeRasgo, b: OpcionDeRasgo): boolean {
    return a.tipoFila === b.tipoFila && a.idInterno === b.idInterno && (a.especial ?? a.dote)?.id === (b.especial ?? b.dote)?.id;
}

/**
 * Lo que la tabla da por la opción: las filas que piden su `id_interno` (como aptitud o como dote, cada uno en su tabla)
 * y, en cadena, las que piden el de ellas.
 */
function derivadasDe(filas: FilaConNivel[], opcion: OpcionDeRasgo | null): FilaConNivel[] {
    if (!opcion || opcion.idInterno <= 0)
        return [];
    const internos = new Set([`${opcion.tipoFila}:${opcion.idInterno}`]);
    const salida: FilaConNivel[] = [];
    for (let cambia = true; cambia;) {
        cambia = false;
        for (const x of filas) {
            const f = x.fila;
            const pide = (f.idEspecialRequerido > 0 && internos.has(`especial:${f.idEspecialRequerido}`))
                || (f.idDoteRequerida > 0 && internos.has(`dote:${f.idDoteRequerida}`));
            if (!pide || salida.includes(x))
                continue;
            salida.push(x);
            if (f.idInterno > 0)
                internos.add(`${f.tipo}:${f.idInterno}`);
            cambia = true;
        }
    }
    return salida;
}

const nombreDeFila = (f: FilaDeTablaDeClase) => nombreConExtra({ id: f.id, idExtra: f.idExtra, nombre: f.nombre, extra: f.extra });

/**
 * Lo que cambia solo con la opción (págs. 194-195): lo que su tabla da por la antigua (sus dotes y sus aptitudes, en
 * cadena, hasta su nivel de clase de ahora) sale, si lo tiene, y entra lo que da por la nueva, emparejado por su nivel y
 * su grupo; la dote nueva, con el origen de la que sustituye o el de su nivel (Combate con dos armas pasa a Disparo
 * rápido; con 6 niveles, Combate con dos armas mejorado pasa a Disparos múltiples). La aptitud que sale se queda si la da
 * también una fila fija de la tabla. Sin `pone`, solo lo que sale (para ver qué deja de cumplir lo que tiene).
 */
export function derivadasDelCambio(motor: NuevoPersonajeService, hueco: HuecoDeRasgo, pone: OpcionDeRasgo | null): CambioDeRasgo[] {
    if (pone && mismaFila(hueco.tiene, pone))
        return [];
    const filas = filasDeLaClase(motor, hueco);
    const deQuita = derivadasDe(filas, hueco.tiene);
    const dePone = derivadasDe(filas, pone);
    const salen = deQuita.filter((x) => !dePone.includes(x));
    const entran = dePone.filter((x) => !deQuita.includes(x));
    const involucradas = new Set([...deQuita, ...dePone]);
    const dotes = motor.dotesDelPersonaje();
    const usadas = new Set<number>();
    const claseas = motor.PersonajeCreacion.Claseas ?? [];
    const canonico = (nivelClase: number) => `${hueco.clase} nivel ${nivelClase}`;
    /** Lo que tiene de esa fila: la dote (la del origen de su nivel, si la hay) o la aptitud; `null` si no la tiene. */
    const loQueTiene = ({ nivelClase, fila }: FilaConNivel): { id: number; idExtra: number; origen?: string; } | null => {
        if (fila.tipo === 'especial') {
            const aptitud = claseas.find((e) => toInt(e?.Id) === fila.id && (fila.elegir ? toInt(e?.Id_extra) > 0 : mismoExtra(toInt(e?.Id_extra), fila.idExtra)));
            return aptitud ? { id: fila.id, idExtra: Math.max(0, toInt(aptitud.Id_extra)) } : null;
        }
        const candidatas = dotes.map((d, i) => ({ d, i })).filter(({ d, i }) => !usadas.has(i) && toInt(d?.Dote?.Id) === fila.id
            && (fila.idExtra <= 0 || mismoExtra(toInt(d?.Contexto?.Id_extra), fila.idExtra)));
        const elegida = candidatas.find(({ d }) => normalizarTexto(`${(d?.Contexto as any)?.Origen ?? ''}`) === normalizarTexto(canonico(nivelClase))) ?? candidatas[0];
        if (!elegida)
            return null;
        usadas.add(elegida.i);
        return { id: fila.id, idExtra: Math.max(0, toInt(elegida.d?.Contexto?.Id_extra)), origen: `${(elegida.d?.Contexto as any)?.Origen ?? ''}` };
    };
    const laDaOtraFila = (f: FilaDeTablaDeClase) => filas.some((x) => !involucradas.has(x) && x.fila.tipo === 'especial' && x.fila.grupo === 0
        && !esDerivada(x.fila) && x.fila.id === f.id && mismoExtra(x.fila.idExtra, f.idExtra));
    const claves = Array.from(new Set([...salen, ...entran].map((x) => `${x.nivelClase}:${x.fila.grupo}`)))
        .sort((a, b) => a.split(':').map(Number).reduce((r, v, i) => r || v - Number(b.split(':')[i]), 0));
    return claves.flatMap((clave) => {
        const deLaClave = (lista: FilaConNivel[]) => lista.filter((x) => `${x.nivelClase}:${x.fila.grupo}` === clave);
        const q = deLaClave(salen);
        const p = deLaClave(entran);
        return Array.from({ length: Math.max(q.length, p.length) }, (_, i): CambioDeRasgo[] => {
            const sale = q[i];
            const entra = p[i];
            const tenia = sale ? loQueTiene(sale) : null;
            const quita: CambioDeRasgo | null = sale && tenia ? {
                nivelClase: sale.nivelClase, tipo: sale.fila.tipo, derivado: true, conservar: sale.fila.tipo === 'especial' && laDaOtraFila(sale.fila),
                quita: { ...tenia, idInterno: sale.fila.idInterno }, pone: null, nombreQuita: nombreDeFila(sale.fila), nombrePone: '',
            } : null;
            const puesta: CambioDeRasgo['pone'] = entra ? {
                id: entra.fila.id, idExtra: entra.fila.idExtra, nombre: entra.fila.nombre, extra: entra.fila.extra, idInterno: entra.fila.idInterno,
                ...(entra.fila.tipo === 'dote' ? { origen: (sale?.fila.tipo === 'dote' && tenia?.origen) || canonico(entra.nivelClase) } : {}),
            } : null;
            if (quita && entra && quita.tipo === entra.fila.tipo)
                return [{ ...quita, pone: puesta, nombrePone: nombreDeFila(entra.fila) }];
            return [
                ...(quita ? [quita] : []),
                ...(entra ? [{ nivelClase: entra.nivelClase, tipo: entra.fila.tipo, derivado: true, quita: null, pone: puesta, nombreQuita: '', nombrePone: nombreDeFila(entra.fila) }] : []),
            ];
        }).flat();
    });
}

/**
 * Lo que cambia al poner `pone` en el hueco (sin la dote que se elija con ella, que va por el selector): la aptitud o la
 * dote que tiene sale y entra la nueva, en el nivel del hueco; y lo derivado (`derivadasDelCambio`).
 */
export function cambiosDelRasgo(motor: NuevoPersonajeService, hueco: HuecoDeRasgo, pone: OpcionDeRasgo): CambioDeRasgo[] {
    const n = hueco.nivelClase;
    const tiene = hueco.tiene;
    const cambios: CambioDeRasgo[] = [];
    const mismaAptitud = !!tiene.especial && !!pone.especial && tiene.especial.id === pone.especial.id && mismoExtra(tiene.especial.idExtra, pone.especial.idExtra);
    if ((tiene.especial || pone.especial) && !mismaAptitud)
        cambios.push({
            nivelClase: n, tipo: 'especial', derivado: false, conservar: hueco.aptitudCompartida,
            quita: tiene.especial ? { id: tiene.especial.id, idExtra: tiene.especial.idExtra, idInterno: tiene.idInterno } : null,
            pone: pone.especial ? { ...pone.especial, idInterno: pone.idInterno } : null,
            nombreQuita: nombreConExtra(tiene.especial), nombrePone: nombreConExtra(pone.especial),
        });
    // La dote que tenía en el hueco (la de la tabla o la que eligió con la aptitud) sale; la de la tabla nueva, entra.
    if (hueco.doteQueTiene)
        cambios.push({
            nivelClase: n, tipo: 'dote', derivado: false,
            quita: { id: hueco.doteQueTiene.id, idExtra: hueco.doteQueTiene.idExtra, origen: hueco.doteQueTiene.origen, idInterno: tiene.dote ? tiene.idInterno : 0 },
            pone: null, nombreQuita: nombreConExtra(hueco.doteQueTiene), nombrePone: '',
        });
    if (pone.dote)
        cambios.push({
            nivelClase: n, tipo: 'dote', derivado: false, quita: null,
            pone: { ...pone.dote, origen: `${hueco.clase} nivel ${n}`, idInterno: pone.idInterno },
            nombreQuita: '', nombrePone: nombreConExtra(pone.dote),
        });
    return [...cambios, ...derivadasDelCambio(motor, hueco, pone)];
}

/** El origen de la dote que se elige con la aptitud nueva: el de la que tenía con la misma aptitud o el de la creación. */
export function origenDeLaDoteNueva(motor: NuevoPersonajeService, hueco: HuecoDeRasgo): string {
    return hueco.tiene.daDote && hueco.doteQueTiene ? hueco.doteQueTiene.origen : motor.origenDeLaDoteDeAptitud(`${hueco.clase} nivel ${hueco.nivelClase}`);
}

/**
 * Las candidatas del selector en el hueco de una dote que se va (`quitada`; la dote reciclada, `huecoDeLaDoteReciclada`, o
 * la que se eligió con la aptitud de un rasgo): sin ella, si no tiene extra (con extra, otra especialidad suya sí vale), y
 * sin `conHomebrew`, solo las oficiales.
 */
export function candidatasEnLugarDe(candidatos: DoteSelectorCandidato[], quitada: { id: number; idExtra: number; } | null,
    conHomebrew: boolean = true): DoteSelectorCandidato[] {
    return candidatos.filter((c) => !(quitada && toInt(c.dote?.Id) === quitada.id && quitada.idExtra <= 0)
        && (conHomebrew || c.dote?.Oficial !== false));
}

/**
 * La dote pendiente del hueco para el selector de dotes de la creación, con la opción nueva ya puesta (sin la antigua ni
 * lo derivado de ella): de su tipo, en el nivel del hueco y juzgada con el personaje de ese nivel. Cambia el motor: quien
 * llama lo deja como estaba. `null` si la opción no da dote o no se puede poner.
 */
export function huecoDeLaDoteDelRasgo(motor: NuevoPersonajeService, hueco: HuecoDeRasgo, pone: OpcionDeRasgo,
    cambios: CambioDeRasgo[] = cambiosDelRasgo(motor, hueco, pone)) {
    if (!pone.daDote || !motor.aplicarCambiosDeRasgo(hueco.idClase, cambios))
        return null;
    const pendiente = motor.registrarDotePendienteDeAptitud({
        origen: `${hueco.clase} nivel ${hueco.nivelClase}`, tipoPermitido: pone.daDote.tipo,
        nivel: { idClase: hueco.idClase, nivelClase: hueco.nivelClase }, alNivel: hueco.indiceNivel, origenFijo: origenDeLaDoteNueva(motor, hueco),
    });
    const candidatos = candidatasEnLugarDe(motor.obtenerCandidatosDotePendiente(pendiente.id), hueco.tiene.daDote ? hueco.doteQueTiene : null);
    return { pendiente, candidatos };
}

/** El cambio del rasgo en el motor (el plan ya elegido): lo de la opción, lo derivado y la dote elegida en su hueco. */
export function aplicarRasgoAlMotor(motor: NuevoPersonajeService, plan: PlanRasgo): boolean {
    if (plan.pone.daDote) {
        const hueco = huecoDeLaDoteDelRasgo(motor, plan.hueco, plan.pone, plan.cambios);
        return !!hueco && !!plan.doteElegida && motor.aplicarDotePendiente(hueco.pendiente.id, plan.doteElegida.seleccion);
    }
    return motor.aplicarCambiosDeRasgo(plan.hueco.idClase, plan.cambios);
}

/** Las filas que cambian en la ficha: las del plan y la dote elegida con la aptitud, si la hay. */
function cambiosEnLaFicha(plan: PlanRasgo): CambioDeRasgoEnElMotor[] {
    const dote = plan.doteElegida?.dote;
    return [
        ...plan.cambios,
        ...(dote ? [{ nivelClase: plan.hueco.nivelClase, tipo: 'dote' as const, quita: null, pone: { ...dote, idInterno: 0 } }] : []),
    ];
}

/**
 * La `entrada` con el rasgo reciclado: en sus aptitudes y sus dotes, lo que sale y lo que entra (las dotes, con su
 * origen), y en las elecciones de su nivel (el del hueco y el de cada derivada), lo nuevo en lugar de lo viejo, como lo
 * apunta la API. Sin las decisiones homebrew de una dote que ya no tiene.
 */
export function fichaConElRasgo(entrada: PersonajeCreateRequestDto, plan: PlanRasgo): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    const especiales: any[] = col.especiales = [...(col.especiales ?? [])];
    const dotes: any[] = col.dotes = [...(col.dotes ?? [])];
    ficha.niveles = (ficha.niveles ?? []).map((n) => ({ ...n, elecciones: [...(n.elecciones ?? [])] }));
    const nivel = (nivelClase: number) => nivelDelOrden(ficha.niveles, { idClase: plan.hueco.idClase, nivelClase });
    cambiosEnLaFicha(plan).forEach((c) => {
        const elecciones = nivel(c.nivelClase)?.elecciones;
        if (c.quita) {
            if (c.tipo === 'especial' && !c.conservar)
                sacarPrimero(especiales, (x) => toInt(x?.idEspecial) === c.quita!.id && mismoExtra(toInt(x?.idExtra), c.quita!.idExtra));
            if (c.tipo === 'dote')
                sacarDoteDeLaFicha(dotes, c.quita.id, c.quita.idExtra, c.quita.origen);
            sacarPrimero(elecciones, (e) => esLaEleccion(e, c.tipo, c.quita!.id, c.quita!.idExtra));
        }
        if (c.pone) {
            const idExtra = Math.max(0, toInt(c.pone.idExtra));
            if (c.tipo === 'especial' && !especiales.some((x) => toInt(x?.idEspecial) === c.pone!.id && mismoExtra(toInt(x?.idExtra), idExtra)))
                especiales.push({ idEspecial: c.pone.id, idExtra });
            if (c.tipo === 'dote')
                dotes.push({ idDote: c.pone.id, idExtra, ...(c.pone.origen ? { origen: c.pone.origen } : {}) });
            elecciones?.push({ tipo: c.tipo, idElemento: c.pone.id, idExtra, ...(c.tipo === 'dote' && c.pone.origen ? { origen: c.pone.origen } : {}) });
        }
    });
    if (ficha.decisionesHomebrew)
        ficha.decisionesHomebrew = sinDecisionesDeDotesQueNoTiene(ficha.decisionesHomebrew, dotes);
    return ficha;
}

/** El hueco del cuerpo `reciclaje` (`{ idClase, nivelClase, grupo }` o `{ idClase, nivelClase, idEspecial }`). */
export function huecoDelCuerpo(hueco: HuecoDeRasgo): { idClase: number; nivelClase: number; grupo: number; } | { idClase: number; nivelClase: number; idEspecial: number; } {
    return hueco.grupo !== null
        ? { idClase: hueco.idClase, nivelClase: hueco.nivelClase, grupo: hueco.grupo }
        : { idClase: hueco.idClase, nivelClase: hueco.nivelClase, idEspecial: toInt(hueco.idEspecial) };
}

/** Lo que tiene y lo que pone, como en el contrato: `{ especial: { id, idExtra } | null, dote: { id, idExtra } | null }`. */
export function opcionesDelCuerpo(plan: PlanRasgo) {
    const ref = (e: ElementoDeRasgo | null | undefined) => e ? { id: e.id, idExtra: Math.max(0, toInt(e.idExtra)) } : null;
    const { hueco, pone } = plan;
    return {
        quita: { especial: ref(hueco.tiene.especial), dote: ref(hueco.tiene.dote || hueco.tiene.daDote ? hueco.doteQueTiene : null) },
        pone: { especial: ref(pone.especial), dote: ref(pone.dote ?? plan.doteElegida?.dote) },
    };
}
