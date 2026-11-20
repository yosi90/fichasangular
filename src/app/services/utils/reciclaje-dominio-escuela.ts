import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { Clase } from 'src/app/interfaces/clase';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { EspecialidadArcanaSeleccion, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { esConjuroDeLaClase, nivelesDeDominioDelConjuro, origenDeDominio } from 'src/app/services/nuevo-personaje.service';
import { sacarDoteDeLaFicha, sacarPrimero, sinDecisionesDeDotesQueNoTiene } from './correccion-ficha';
import { nombreDeHabilidadConExtra } from './habilidad-extra-visible';
import { coincideClaveEntidad } from './identidad-prerrequisitos';
import { esLaEleccion, nivelDelOrden } from './niveles-creacion';
import { mismoExtra, normalizarTexto, toInt, toNumber } from './normalizacion';
import { limiteRangosHabilidad } from './puntos-habilidad';
import { nombreConExtra } from './reciclaje-rasgos';
import { esEspecializable, prohibidasAlEspecializarse } from './reglas-magia';
import { diferencia } from './subida-nivel';

/*
 * El reciclaje de un dominio y de la escuela del mago (R3, segunda tanda; *Manual del jugador II*, pág. 195, tabla 8-2;
 * contrato en `docs/publica/endpoints/personajes.md`, «Subida de nivel», «El reciclaje», `rasgo`: «Un dominio» y «La escuela
 * del mago»). Los dos son del 1.er nivel de su clase y no están en su tabla: el hueco es la clase. Un dominio se cambia por
 * otro que pueda elegir con su clase, como al crear (los de su deidad o cualquiera sin ella; uno de alineamiento, solo con
 * el suyo), y lo que da su poder cambia solo (sus dotes, sus aptitudes, sus habilidades de clase y sus conjuros de dominio).
 * La especialización y las prohibidas son un solo rasgo: otra especialización legal o generalista, y los bonos del
 * especialista cambian solos; los conjuros del libro de una escuela que pasa a prohibida se quedan, sin poder prepararse.
 * Lo que depende de lo que sale y se eligió después lo comprueba `reciclaje.ts` (`loQueDejariaDeCumplir`). Todo sale de
 * los datos (`dominio_*`, `deidades_dominios`, `escuelas_conjuros`), sin nombres ni ids fijos.
 */

/** Un dominio, con su nombre. */
export interface DominioDelRasgo {
    id: number;
    nombre: string;
}

/** Un dominio que puede poner en lugar del que tiene; `motivo`, por qué no (`null` si puede). */
export interface OpcionDeDominio extends DominioDelRasgo {
    oficial: boolean;
    motivo: string | null;
}

/** Un dominio del personaje en una clase que da dominios: el que tiene y los que puede poner en su lugar. */
export interface HuecoDeDominio {
    tipo: 'dominio';
    clave: string;
    idClase: number;
    clase: string;
    tiene: DominioDelRasgo;
    /** La deidad de la que salen las opciones; `null` sin deidad (cualquier dominio). */
    deidad: string | null;
    opciones: OpcionDeDominio[];
    /** Por qué no se puede reciclar; `null` si se puede. */
    motivo: string | null;
}

/** Una fila de lo que cambia solo con el dominio o la escuela («Dotes: Soltura con un arma (espada larga) → —»). */
export interface DerivadoDelRasgo {
    que: string;
    antes: string;
    ahora: string;
}

/** El cambio de un dominio por otro, con lo que cambia solo y las aptitudes que entran (no son del nivel nuevo). */
export interface PlanDominio {
    tipo: 'dominio';
    hueco: HuecoDeDominio;
    pone: DominioDelRasgo;
    derivados: DerivadoDelRasgo[];
    aptitudesNuevas: Array<{ nombre: string; extra: string; }>;
}

/** Una escuela de magia, con su nombre. */
export interface EscuelaDelRasgo {
    id: number;
    nombre: string;
}

/** La especialización del mago y sus prohibidas, como un solo rasgo; `especialista: null`, generalista. */
export interface EspecializacionDelMago {
    especialista: EscuelaDelRasgo | null;
    prohibidas: EscuelaDelRasgo[];
}

/** La escuela del mago en la clase que da especialización: lo que tiene. Las opciones, en el selector de la creación. */
export interface HuecoDeEscuela {
    tipo: 'escuela';
    clave: string;
    idClase: number;
    clase: string;
    tiene: EspecializacionDelMago;
    /** La escuela de la que la clase es siempre especialista (solo cambian sus prohibidas); `null` si se elige. */
    escuelaFija: EscuelaConjuros | null;
    motivo: string | null;
}

/** El cambio de la especialización: la nueva, lo elegido en el selector (para el motor) y lo que cambia solo. */
export interface PlanEscuela {
    tipo: 'escuela';
    hueco: HuecoDeEscuela;
    pone: EspecializacionDelMago;
    /** Lo elegido en el selector de la creación, para volver a aplicarlo en el motor (`aplicarEspecialidadMagicaClase`). */
    seleccion: EspecialidadArcanaSeleccion;
    /** Las escuelas del catálogo que intervienen (la nueva y sus prohibidas), para el motor. */
    escuelas: EscuelaConjuros[];
    /** `personaje.idEspArcana` de la ficha: la escuela nueva o, de generalista, la que guarda la creación. */
    idEspArcana: number;
    derivados: DerivadoDelRasgo[];
    /** Los conjuros de su libro de una escuela que pasa a estar prohibida: se quedan, pero no se pueden preparar. */
    libroSinPreparar: string[];
}

// --- Un dominio ------------------------------------------------------------------------------------------------------

/** Las clases que tiene y que dan dominios (`Conjuros.Dominio_cantidad`, el dato que usa la creación: el clérigo, 2). */
function clasesConDominios(motor: NuevoPersonajeService): Clase[] {
    return (motor.PersonajeCreacion.desgloseClases ?? []).filter((c) => toInt(c?.Nivel) > 0)
        .map((c) => motor.claseDelCatalogo(toInt(c?.Id)))
        .filter((c): c is Clase => !!c && toInt(c.Conjuros?.Dominio_cantidad) > 0);
}

/**
 * Los dominios del personaje en cada clase que los da (el motor recién hidratado), con los que puede poner en su lugar
 * (`dominiosQuePuedeElegir`, como al crear; sin `conHomebrew`, solo los oficiales). De qué clase es cada uno: su elección
 * en el registro, el `origen` de la ficha o, si no, la primera clase con dominios. Cada opción, con su motivo si los
 * rangos comprados como de clase por el dominio quedarían por encima del tope de una transclásea (`nivelPersonaje`, el
 * de antes de subir, + 3, entre 2). Lo que depende de lo que sale lo pone `dominiosParaReciclar` (`reciclaje.ts`).
 */
export function huecosDeDominio(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, nivelPersonaje: number,
    conHomebrew: boolean): HuecoDeDominio[] {
    const clases = clasesConDominios(motor);
    if (clases.length < 1)
        return [];
    const pj = motor.PersonajeCreacion;
    const orden = pj.Orden_niveles ?? [];
    const deLaClase = (idDominio: number): Clase => {
        const enElRegistro = orden.find((n) => (n?.elecciones ?? []).some((e) => esLaEleccion(e, 'dominio', idDominio, 0)));
        const origen = normalizarTexto(`${(entrada.colecciones?.dominios ?? []).find((d) => toInt(d?.idDominio) === idDominio)?.origen ?? ''}`);
        return clases.find((c) => toInt(c.Id) === toInt(enElRegistro?.idClase))
            ?? clases.find((c) => normalizarTexto(c.Nombre) === origen)
            ?? clases[0];
    };
    const deidad = motor.deidadDelPersonaje();
    const tope = limiteRangosHabilidad(nivelPersonaje, false);
    return (pj.Dominios ?? []).map((d) => ({ id: motor.idDelDominio(d), nombre: `${d?.Nombre ?? ''}`.trim() }))
        .filter((d) => d.id > 0)
        .map((tiene) => {
            const clase = deLaClase(tiene.id);
            const opciones: OpcionDeDominio[] = motor.dominiosQuePuedeElegir(clase)
                .filter((o) => o.id !== tiene.id && (conHomebrew || o.oficial))
                .map((o) => {
                    const pasan = motor.habilidadesQueDejanDeSerDeClase(tiene.id, o.id).filter((h) => toNumber(h.Rangos) > tope);
                    const nombres = pasan.map((h) => nombreDeHabilidadConExtra(h));
                    return {
                        id: o.id, nombre: o.nombre, oficial: o.oficial,
                        motivo: pasan.length > 0
                            ? `Con ${o.nombre}, ${unirLista(nombres, 'y')} ${pasan.length > 1 ? 'dejarían' : 'dejaría'} de ser de clase y tiene más de ${tope} rangos, el tope de una transclásea a su nivel (${toInt(nivelPersonaje)}).`
                            : null,
                    };
                });
            return {
                tipo: 'dominio' as const, clave: `${toInt(clase.Id)}:d${tiene.id}`, idClase: toInt(clase.Id), clase: `${clase.Nombre}`,
                tiene, deidad: deidad ? `${deidad.Nombre}` : null, opciones,
                motivo: opciones.length < 1
                    ? (deidad ? `No hay otro dominio de ${deidad.Nombre} que pueda elegir.` : 'No hay otro dominio que pueda elegir.')
                    : opciones.every((o) => !!o.motivo) ? opciones[0].motivo : null,
            };
        });
}

/**
 * Lo que da el dominio en el motor: sus dotes (las del personaje con su origen), sus aptitudes (las de sus datos que tiene)
 * y, de sus datos, sus habilidades de clase y sus conjuros de dominio (por nivel). Para ver qué deja de cumplir lo que
 * tiene sin él y para «Lo que cambia».
 */
export function loQueDaElDominio(motor: NuevoPersonajeService, dominio: DominioDelRasgo) {
    const pj = motor.PersonajeCreacion;
    const datos = motor.dominioDelCatalogo(dominio.id);
    const dotes = motor.dotesDelDominio(dominio.nombre)
        .map((d) => ({
            idDote: toInt(d.Dote?.Id), idExtra: toInt(d.Contexto?.Id_extra), origen: `${(d.Contexto as any)?.Origen ?? ''}`,
            nombre: nombreConExtra({ nombre: `${d.Dote?.Nombre ?? ''}`, idExtra: toInt(d.Contexto?.Id_extra), extra: `${d.Contexto?.Extra ?? ''}` }),
        }));
    const aptitudes = (datos?.Especiales ?? []).flatMap((e) => (pj.Claseas ?? [])
        .filter((x) => coincideClaveEntidad({ id: toInt(x?.Id), nombre: `${x?.Nombre ?? ''}` }, e?.Id, e?.Nombre))
        .slice(0, 1).map((x) => ({ id: toInt(x.Id), idExtra: Math.max(0, toInt(x.Id_extra)), nombre: `${x.Nombre ?? ''}`, extra: `${x.Extra ?? ''}` })));
    const habilidades = (datos?.Habilidades_claseas ?? []).map((h) => nombreConExtra({ nombre: `${h.Habilidad ?? ''}`, idExtra: toInt(h.Id_extra), extra: `${h.Extra ?? ''}` }));
    const conjuros = motor.CatalogoConjuros.flatMap((c) => nivelesDeDominioDelConjuro(c)
        .filter((n) => (n.id > 0 ? n.id === dominio.id : n.nombre === normalizarTexto(dominio.nombre)) && n.nivel >= 0)
        .slice(0, 1).map((n) => ({ nombre: `${c.Nombre}`, nivel: n.nivel })))
        .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, 'es'));
    return { dotes, aptitudes, habilidades, conjuros, poder: `${datos?.Poder ?? ''}`.trim() || null };
}

/** Una lista de nombres para «Lo que cambia» («—» si no hay ninguno). */
const lista = (nombres: string[]) => nombres.length > 0 ? nombres.join(', ') : '—';

/**
 * El plan de poner `pone` en lugar del dominio del hueco, con lo que cambia solo: lo hace en el motor para leer lo que
 * da el nuevo (las dotes con el arma de su deidad, la competencia que no tenía…) y lo deja como estaba. `null` si el motor
 * no puede (falta un dominio en el catálogo).
 */
export function planDelDominio(motor: NuevoPersonajeService, hueco: HuecoDeDominio, pone: DominioDelRasgo): PlanDominio | null {
    const antes = loQueDaElDominio(motor, hueco.tiene);
    const estado = motor.exportarEstadoSubida();
    try {
        if (!motor.cambiarDominio(hueco.idClase, hueco.tiene.id, pone.id))
            return null;
        const despues = loQueDaElDominio(motor, pone);
        const conNivel = (c: { nombre: string; nivel: number; }) => `${c.nombre} (${c.nivel})`;
        const derivados: DerivadoDelRasgo[] = [
            { que: 'Poder concedido', antes: antes.poder ?? `El de ${hueco.tiene.nombre}`, ahora: despues.poder ?? `El de ${pone.nombre}` },
            { que: 'Dotes del dominio', antes: lista(antes.dotes.map((d) => d.nombre)), ahora: lista(despues.dotes.map((d) => d.nombre)) },
            { que: 'Aptitudes del dominio', antes: lista(antes.aptitudes.map((a) => a.nombre)), ahora: lista(despues.aptitudes.map((a) => a.nombre)) },
            { que: 'Habilidades de clase del dominio', antes: lista(antes.habilidades), ahora: lista(despues.habilidades) },
            { que: 'Conjuros de dominio', antes: lista(antes.conjuros.map(conNivel)), ahora: lista(despues.conjuros.map(conNivel)) },
        ].filter((f) => f.que === 'Poder concedido' || f.antes !== '—' || f.ahora !== '—');
        return {
            tipo: 'dominio', hueco, pone: { id: pone.id, nombre: pone.nombre }, derivados,
            aptitudesNuevas: despues.aptitudes.filter((a) => !antes.aptitudes.some((x) => x.id === a.id)).map((a) => ({ nombre: a.nombre, extra: a.extra })),
        };
    } finally {
        motor.restaurarEstadoSubida(estado);
    }
}

/**
 * La `entrada` con el dominio cambiado: en sus dominios, el nuevo en el lugar del que sale (con su origen); lo que daba el
 * poder de uno y da el del otro, de la diferencia del cuerpo del motor antes y después del cambio (`motor`): las dotes de
 * su origen, sus aptitudes y si sus habilidades son de clase (los rangos se quedan); y en las elecciones del 1.er nivel de
 * su clase, el nuevo en lugar del viejo, como lo apunta la API. Lo que dan las dotes (sus modificadores), en
 * `fichaConElReciclaje`.
 */
export function fichaConElDominio(entrada: PersonajeCreateRequestDto, plan: PlanDominio,
    motor: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null | undefined): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    const { hueco, pone } = plan;
    const dominios: any[] = col.dominios = [...(col.dominios ?? [])];
    const i = dominios.findIndex((d) => toInt(d?.idDominio) === hueco.tiene.id);
    const origen = `${dominios[i]?.origen ?? ''}`.trim();
    const nuevo = { idDominio: pone.id, ...(origen ? { origen } : {}) };
    if (i >= 0)
        dominios.splice(i, 1, nuevo);
    else
        dominios.push(nuevo);

    const colA: any = motor?.antes.colecciones ?? {};
    const colD: any = motor?.despues.colecciones ?? {};
    const origenes = new Set([origenDeDominio(hueco.tiene.nombre), origenDeDominio(pone.nombre)].map((n) => normalizarTexto(n)));
    const dotes: any[] = col.dotes = [...(col.dotes ?? [])];
    const deDotes = diferencia((colA.dotes ?? []).filter((d: any) => origenes.has(normalizarTexto(`${d?.origen ?? ''}`))),
        (colD.dotes ?? []).filter((d: any) => origenes.has(normalizarTexto(`${d?.origen ?? ''}`))));
    deDotes.quitados.forEach((d) => sacarDoteDeLaFicha(dotes, toInt(d['idDote']), toInt(d['idExtra']), `${d['origen'] ?? ''}`));
    deDotes.nuevos.forEach((d) => dotes.push({ ...d }));
    const especiales: any[] = col.especiales = [...(col.especiales ?? [])];
    const deEspeciales = diferencia(colA.especiales ?? [], colD.especiales ?? []);
    deEspeciales.quitados.forEach((e) => sacarPrimero(especiales, (x) => toInt(x?.idEspecial) === toInt(e['idEspecial']) && mismoExtra(x?.idExtra, e['idExtra'])));
    deEspeciales.nuevos.forEach((e) => especiales.push({ ...e }));

    // Si son de clase: lo que cambia el motor (las del dominio que sale dejan de serlo, las del que entra lo son).
    const clave = (h: any) => `${toInt(h?.idHabilidad)}:${Math.max(0, toInt(h?.idExtra))}`;
    const previas = new Map<string, any>((colA.habilidades?.base ?? []).map((h: any) => [clave(h), h]));
    const base: any[] = (col.habilidades?.base ?? []).map((h: any) => ({ ...h }));
    (colD.habilidades?.base ?? []).forEach((h: any) => {
        if (!!h?.clasea === !!previas.get(clave(h))?.clasea)
            return;
        const fila = base.find((g) => clave(g) === clave(h));
        if (fila)
            fila.clasea = !!h.clasea;
        else if (h.clasea)
            base.push({ idHabilidad: toInt(h.idHabilidad), idExtra: Math.max(0, toInt(h.idExtra)), clasea: true, rangos: 0, rangosVarios: 0, modVarios: '' });
    });
    if (col.habilidades || base.length > 0)
        col.habilidades = { ...(col.habilidades ?? {}), base };

    ficha.niveles = (ficha.niveles ?? []).map((n) => ({ ...n, elecciones: [...(n.elecciones ?? [])] }));
    const primero = nivelDelOrden(ficha.niveles, { idClase: hueco.idClase, nivelClase: 1 });
    if (primero) {
        const k = (primero.elecciones ?? []).findIndex((e) => esLaEleccion(e, 'dominio', hueco.tiene.id, 0));
        const eleccion = { tipo: 'dominio' as const, idElemento: pone.id, origen: hueco.clase };
        if (k >= 0)
            primero.elecciones!.splice(k, 1, { ...primero.elecciones![k], idElemento: pone.id });
        else
            primero.elecciones = [...(primero.elecciones ?? []), eleccion];
    }
    if (ficha.decisionesHomebrew)
        ficha.decisionesHomebrew = sinDecisionesDeDotesQueNoTiene(ficha.decisionesHomebrew, dotes);
    return ficha;
}

// --- La escuela del mago ---------------------------------------------------------------------------------------------

/** Una escuela del catálogo por su id o, sin él, por su nombre. */
function escuelaDelCatalogo(escuelas: readonly EscuelaConjuros[], ref: { Id?: number; Nombre?: string; } | string | null | undefined): EscuelaConjuros | null {
    const id = typeof ref === 'string' ? 0 : toInt(ref?.Id);
    const nombre = normalizarTexto(typeof ref === 'string' ? ref : `${ref?.Nombre ?? ''}`);
    return (id > 0 ? escuelas.find((e) => toInt(e?.Id) === id) : undefined)
        ?? (nombre ? escuelas.find((e) => normalizarTexto(e?.Nombre ?? '') === nombre) : undefined) ?? null;
}

const escuelaDelRasgo = (e: EscuelaConjuros): EscuelaDelRasgo => ({ id: toInt(e.Id), nombre: `${e.Nombre ?? ''}`.trim() });

/**
 * La especialización que tiene en el motor: la escuela especialista si es una en la que se puede especializar (si no, la
 * de «no especializado» de la creación: generalista) y sus prohibidas, del catálogo de escuelas.
 */
export function especializacionDelMotor(motor: NuevoPersonajeService, escuelas: readonly EscuelaConjuros[]): EspecializacionDelMago {
    const pj = motor.PersonajeCreacion;
    const especialista = escuelaDelCatalogo(escuelas, pj.Escuela_especialista);
    return {
        especialista: especialista && esEspecializable(especialista) ? escuelaDelRasgo(especialista) : null,
        prohibidas: (pj.Escuelas_prohibidas ?? []).map((p) => escuelaDelCatalogo(escuelas, p as any)).filter((e): e is EscuelaConjuros => !!e)
            .map(escuelaDelRasgo),
    };
}

/**
 * La clase que le da especialización (`getEspecialidadMagicaPendiente` de su 1.er nivel, como al crear: arcana, que la
 * elige o que la tiene fija), con lo que pide; `null` si no tiene ninguna. La primera: la ficha tiene una sola escuela.
 */
export function claseConEspecializacion(motor: NuevoPersonajeService)
    : { clase: Clase; pendiente: NonNullable<ReturnType<NuevoPersonajeService['getEspecialidadMagicaPendiente']>>; } | null {
    for (const entrada of motor.PersonajeCreacion.desgloseClases ?? []) {
        const clase = toInt(entrada?.Nivel) > 0 ? motor.claseDelCatalogo(toInt(entrada?.Id)) : null;
        const pendiente = clase ? motor.getEspecialidadMagicaPendiente(clase, 1) : null;
        if (clase && pendiente?.requiereArcano)
            return { clase, pendiente };
    }
    return null;
}

/**
 * La escuela del mago, si tiene una clase que da especialización (`claseConEspecializacion`): lo que tiene y, si la clase
 * la tiene fija, esa escuela (solo se cambian sus prohibidas). `null` si no tiene ninguna.
 */
export function huecoDeEscuela(motor: NuevoPersonajeService, escuelas: readonly EscuelaConjuros[]): HuecoDeEscuela | null {
    const deLaClase = claseConEspecializacion(motor);
    if (!deLaClase)
        return null;
    const { clase, pendiente } = deLaClase;
    const escuelaFija = motor.escuelaFijaEnCatalogo(pendiente, [...escuelas]);
    const prohibibles = escuelas.filter((e) => esEspecializable(e) && !!e.Prohibible && toInt(e.Id) !== toInt(escuelaFija?.Id));
    return {
        tipo: 'escuela', clave: `${toInt(clase.Id)}:escuela`, idClase: toInt(clase.Id), clase: `${clase.Nombre}`,
        tiene: especializacionDelMotor(motor, escuelas), escuelaFija,
        motivo: escuelas.length < 1 ? 'No se ha podido leer el catálogo de escuelas.'
            : escuelaFija && prohibibles.length <= prohibidasAlEspecializarse(escuelaFija)
                ? `${clase.Nombre} es siempre especialista en ${escuelaFija.Nombre} y no hay otras prohibidas que elegir.`
                : null,
    };
}

/** La especialización que da lo elegido en el selector de la creación (`especializar: false`, generalista). */
export function especializacionElegida(seleccion: EspecialidadArcanaSeleccion, escuelas: readonly EscuelaConjuros[]): EspecializacionDelMago {
    const especialista = seleccion.especializar ? escuelaDelCatalogo(escuelas, { Id: toInt(seleccion.escuelaEspecialistaId) }) : null;
    return {
        especialista: especialista ? escuelaDelRasgo(especialista) : null,
        prohibidas: especialista ? (seleccion.escuelasProhibidasIds ?? []).map((id) => escuelaDelCatalogo(escuelas, { Id: toInt(id) }))
            .filter((e): e is EscuelaConjuros => !!e).map(escuelaDelRasgo) : [],
    };
}

/** Si dos especializaciones son la misma (la escuela y las prohibidas, sin importar su orden). */
export function mismaEspecializacion(a: EspecializacionDelMago, b: EspecializacionDelMago): boolean {
    const ids = (x: EspecializacionDelMago) => x.prohibidas.map((p) => p.id).sort((m, n) => m - n).join(',');
    return toInt(a.especialista?.id) === toInt(b.especialista?.id) && ids(a) === ids(b);
}

/** La especialización en una frase: «Nigromancia (prohibidas: evocación e ilusión)» o «Generalista». */
export function nombreDeLaEspecializacion(e: EspecializacionDelMago): string {
    if (!e.especialista)
        return 'Generalista';
    const nombres = e.prohibidas.map((p) => p.nombre.toLowerCase());
    return nombres.length > 0 ? `${e.especialista.nombre} (prohibidas: ${unirLista(nombres, 'y')})` : e.especialista.nombre;
}

/**
 * Por qué no es legal en el 1.er nivel (MJ, pág. 48; los datos de `escuelas_conjuros`): una escuela en la que se pueda
 * especializar (la fija de la clase, si la tiene), con tantas prohibidas como pida, que se puedan prohibir y distintas de
 * ella; o generalista. `null` si lo es.
 */
function motivoDeLegalidad(e: EspecializacionDelMago, hueco: HuecoDeEscuela, escuelas: readonly EscuelaConjuros[]): string | null {
    if (!e.especialista)
        return hueco.escuelaFija ? `${hueco.clase} es siempre especialista en ${hueco.escuelaFija.Nombre}.` : null;
    const especialista = escuelaDelCatalogo(escuelas, { Id: e.especialista.id });
    if (!especialista || !esEspecializable(especialista) || (hueco.escuelaFija && toInt(hueco.escuelaFija.Id) !== e.especialista.id))
        return `No se puede especializar en ${e.especialista.nombre}.`;
    const requeridas = prohibidasAlEspecializarse(especialista);
    const validas = e.prohibidas.filter((p) => p.id !== e.especialista!.id && !!escuelaDelCatalogo(escuelas, { Id: p.id })?.Prohibible);
    if (new Set(validas.map((p) => p.id)).size !== e.prohibidas.length || e.prohibidas.length !== requeridas)
        return requeridas === 1 ? 'Tiene que prohibir 1 escuela que se pueda prohibir.' : `Tiene que prohibir ${requeridas} escuelas que se puedan prohibir.`;
    return null;
}

/**
 * El plan de cambiar la especialización del hueco por la elegida en el selector (`seleccion`), con lo que cambia solo (los
 * bonos del especialista) y los conjuros de su libro que dejan de poder prepararse. Lo hace en el motor para saber qué
 * guarda la ficha de generalista (`personaje.idEspArcana`) y lo deja como estaba. Si no vale, su motivo.
 */
export function planDeLaEscuela(motor: NuevoPersonajeService, hueco: HuecoDeEscuela, seleccion: EspecialidadArcanaSeleccion,
    escuelas: readonly EscuelaConjuros[]): { plan: PlanEscuela; motivo: null; } | { plan: null; motivo: string; } {
    const pone = especializacionElegida(seleccion, escuelas);
    if (mismaEspecializacion(pone, hueco.tiene))
        return { plan: null, motivo: 'Es la que ya tiene: elige otra especialización o generalista.' };
    const ilegal = motivoDeLegalidad(pone, hueco, escuelas);
    if (ilegal)
        return { plan: null, motivo: ilegal };
    const clase = motor.claseDelCatalogo(hueco.idClase);
    const pj = motor.PersonajeCreacion;
    const guardado = { especialista: pj.Escuela_especialista, prohibidas: pj.Escuelas_prohibidas };
    const intervienen = [pone.especialista, ...pone.prohibidas].filter((e): e is EscuelaDelRasgo => !!e)
        .map((e) => escuelaDelCatalogo(escuelas, { Id: e.id })).filter((e): e is EscuelaConjuros => !!e);
    let idEspArcana = toInt(pone.especialista?.id);
    try {
        if (!clase || !motor.aplicarEspecialidadMagicaClase(clase, 1, { arcana: seleccion }, intervienen, []).aplicado)
            return { plan: null, motivo: 'No se ha podido aplicar esa especialización.' };
        if (!pone.especialista)
            idEspArcana = toInt(escuelaDelCatalogo(escuelas, pj.Escuela_especialista)?.Id);
    } finally {
        pj.Escuela_especialista = guardado.especialista;
        pj.Escuelas_prohibidas = guardado.prohibidas;
    }
    const antes = hueco.tiene.especialista;
    const bonos = (e: EscuelaDelRasgo | null) => e ? `Los de especialista en ${e.nombre.toLowerCase()}` : 'Ninguno (generalista)';
    const yaProhibidas = new Set(hueco.tiene.prohibidas.map((p) => normalizarTexto(p.nombre)));
    const nuevasProhibidas = new Set(pone.prohibidas.map((p) => normalizarTexto(p.nombre)).filter((n) => !yaProhibidas.has(n)));
    const libroSinPreparar = (pj.Conjuros ?? [])
        .filter((c) => esConjuroDeLaClase(c, normalizarTexto(hueco.clase)) && nuevasProhibidas.has(normalizarTexto(c?.Escuela?.Nombre ?? '')))
        .map((c) => `${c.Nombre}`).filter((n, k, todos) => todos.indexOf(n) === k).sort((a, b) => a.localeCompare(b, 'es'));
    return {
        motivo: null,
        plan: {
            tipo: 'escuela', hueco, pone, seleccion: { ...seleccion, escuelasProhibidasIds: [...(seleccion.escuelasProhibidasIds ?? [])] },
            escuelas: intervienen, idEspArcana,
            derivados: toInt(antes?.id) === toInt(pone.especialista?.id) ? [] : [{ que: 'Bonos del especialista', antes: bonos(antes), ahora: bonos(pone.especialista) }],
            libroSinPreparar,
        },
    };
}

/** La `entrada` con la especialización nueva: `personaje.idEspArcana` y sus escuelas prohibidas (sin elección en el registro). */
export function fichaConLaEscuela(entrada: PersonajeCreateRequestDto, plan: PlanEscuela): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    ficha.personaje = { ...ficha.personaje, idEspArcana: plan.idEspArcana };
    ficha.colecciones = { ...(ficha.colecciones ?? {}), escuelasProhibidas: plan.pone.prohibidas.map((p) => ({ idEscuela: p.id })) };
    return ficha;
}

/** En el motor (antes del nivel): la especialización nueva, con el selector de la creación ya resuelto. */
export function aplicarEscuelaAlMotor(motor: NuevoPersonajeService, plan: PlanEscuela): boolean {
    const clase = motor.claseDelCatalogo(plan.hueco.idClase);
    return !!clase && motor.aplicarEspecialidadMagicaClase(clase, 1, { arcana: plan.seleccion }, plan.escuelas, []).aplicado;
}

/** El cuerpo `reciclaje` de un dominio o de la escuela (contrato, «Un dominio» y «La escuela del mago»). */
export function reciclajeDelDominioOLaEscuela(plan: PlanDominio | PlanEscuela) {
    if (plan.tipo === 'dominio')
        return {
            tipo: 'rasgo' as const, hueco: { idClase: plan.hueco.idClase, dominio: true as const },
            quita: { dominio: plan.hueco.tiene.id }, pone: { dominio: plan.pone.id },
        };
    const escuela = (e: EspecializacionDelMago) => ({ especialista: e.especialista ? e.especialista.id : null, prohibidas: e.prohibidas.map((p) => p.id) });
    return {
        tipo: 'rasgo' as const, hueco: { idClase: plan.hueco.idClase, escuela: true as const },
        quita: { escuela: escuela(plan.hueco.tiene) }, pone: { escuela: escuela(plan.pone) },
    };
}
