import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ReciclajeSubidaDto } from 'src/app/interfaces/sesiones';
import { EscuelaConjuros } from 'src/app/interfaces/escuela-conjuros';
import type {
    DotePendienteState, DoteSelectorCandidato, DoteSeleccionConfirmada, EspecialidadArcanaSeleccion, NuevoPersonajeService,
} from 'src/app/services/nuevo-personaje.service';
import { esConjuroDeLaClase, nivelDelConjuroEnLaClase } from 'src/app/services/nuevo-personaje.service';
import { claveDoteDeLaFicha, DoteDeLaFicha, sacarDoteDeLaFicha, sacarPrimero } from './correccion-ficha';
import { idExtraHabilidadParaGuardar, nombreDeHabilidadConExtra } from './habilidad-extra-visible';
import { mismoExtra, normalizarTexto, toInt, toNumber } from './normalizacion';
import { limiteRangosHabilidad } from './puntos-habilidad';
import {
    aplicarRasgoAlMotor, candidatasEnLugarDe, derivadasDelCambio, fichaConElRasgo, HuecoDeRasgo, huecoDelCuerpo, huecosDeRasgo, nombreDeLoQueTiene,
    nombreDeOpcion, opcionesDelCuerpo, PlanRasgo,
} from './reciclaje-rasgos';
import { aplicarLoQueDanLasDotes } from './subida-nivel';
import { CambioSubida } from './subida-nivel-vista';
import {
    aplicarEscuelaAlMotor, fichaConElDominio, fichaConLaEscuela, HuecoDeDominio, huecosDeDominio, loQueDaElDominio,
    nombreDeLaEspecializacion, PlanDominio, PlanEscuela, reciclajeDelDominioOLaEscuela,
} from './reciclaje-dominio-escuela';

/*
 * El reciclaje de la subida de nivel (*Manual del jugador II*, cap. 8, págs. 194-196; contrato en
 * `docs/publica/endpoints/personajes.md`, «Subida de nivel», «El reciclaje»; guía `docs/publica/SESIONES_FRONT.md`): al
 * subir, antes de añadir nada del nivel nuevo, el personaje cambia una sola cosa que eligió antes (una dote, un idioma,
 * rangos de una habilidad, conjuros conocidos o la opción de un rasgo de clase: de su tabla, `reciclaje-rasgos.ts`; un
 * dominio o la escuela del mago, `reciclaje-dominio-escuela.ts`) por otra legal. Todo se juzga con el personaje de antes de subir; lo que
 * depende de lo reciclado (una dote, una clase) bloquea el cambio, no se quita en cascada. Después, el motor sigue con el
 * nivel ya con el cambio hecho. Lo usa solo la subida (`components/sesiones/subir-nivel`, con carga diferida).
 */

/** Como mucho, los rangos que se traspasan de una habilidad a otra (MJ II, tabla 8-1). */
export const MAXIMO_RANGOS_RECICLADOS = 4;
/** Como mucho, los conocidos que se cambian (MJ II, pág. 196). */
export const MAXIMO_CONJUROS_RECICLADOS = 2;

/** Lo que se elige en el paso «Reciclar», con los nombres para el resumen. */
export type PlanReciclaje =
    | {
        tipo: 'dote';
        quita: DoteReciclable;
        /** Lo elegido en el selector de dotes de la creación, para volver a aplicarlo en el motor. */
        seleccion: DoteSeleccionConfirmada;
        pone: { idDote: number; idExtra: number; nombre: string; extra: string; };
    }
    | { tipo: 'idioma'; quita: { idIdioma: number; nombre: string; }; pone: { idIdioma: number; nombre: string; }; }
    | {
        tipo: 'rangos';
        quita: { idHabilidad: number; idExtra: number; nombre: string; };
        pone: { idHabilidad: number; idExtra: number; nombre: string; };
        rangos: number;
    }
    | {
        tipo: 'conjuros';
        cambios: Array<{ idClase: number; clase: string; olvida: { id: number; nombre: string; }; aprende: { id: number; nombre: string; }; }>;
    }
    | PlanRasgo
    | PlanDominio
    | PlanEscuela;

/** Los planes de un rasgo de clase (en el cuerpo, todos `tipo: "rasgo"`): de su tabla, un dominio o la escuela del mago. */
export type PlanDeRasgoDeClase = PlanRasgo | PlanDominio | PlanEscuela;

/** Si el plan es de un rasgo de clase. */
export function esPlanDeRasgo(plan: PlanReciclaje | null | undefined): plan is PlanDeRasgoDeClase {
    return plan?.tipo === 'rasgo' || plan?.tipo === 'dominio' || plan?.tipo === 'escuela';
}

/** Una dote del personaje en el paso «Reciclar»: si se puede reciclar y, si no, por qué. */
export interface DoteReciclable {
    idDote: number;
    idExtra: number;
    origen: string;
    nombre: string;
    extra: string;
    /** Su nivel en el registro (`Orden_niveles`), o `null` si no se sabe: entonces se juzga como de 1.er nivel. */
    indiceNivel: number | null;
    /** `null` si se puede reciclar. */
    motivo: string | null;
}

/** Un idioma que conoce: si se puede olvidar y, si no, por qué. */
export interface IdiomaReciclable {
    idIdioma: number;
    nombre: string;
    motivo: string | null;
}

/** Una habilidad con rangos comprados, de la que se pueden traspasar rangos. */
export interface HabilidadConRangos {
    idHabilidad: number;
    idExtra: number;
    nombre: string;
    rangos: number;
}

/** Una habilidad de destino de los rangos: si vale y, si no, por qué; `clases`, las que la hacen de clase si no es de las suyas. */
export interface DestinoDeRangos extends HabilidadConRangos {
    motivo: string | null;
    /** `null` si es de clase para alguna de las que ya tiene; si no, las clases que puede subir con las que lo es. */
    clases: Array<{ id: number; nombre: string; }> | null;
}

/** Un conocido de una clase con conocidos limitados: su nivel en la lista de la clase y si se puede olvidar. */
export interface ConocidoReciclable {
    idConjuro: number;
    nombre: string;
    nivel: number;
    motivo: string | null;
}

/** Una clase con conocidos limitados (su tabla de conocidos: el bardo, el hechicero; no el mago, el clérigo ni el druida). */
export interface ClaseConConocidos {
    id: number;
    nombre: string;
    conocidos: ConocidoReciclable[];
}

/** El cuerpo `reciclaje` de `POST /personajes/{id}/niveles` del plan; `orden`, el nivel del registro (1, 2…) o `null`. */
export function reciclajeDelPlan(plan: PlanReciclaje): ReciclajeSubidaDto {
    if (plan.tipo === 'dote')
        return {
            tipo: 'dote',
            quita: { idDote: plan.quita.idDote, idExtra: plan.quita.idExtra, orden: plan.quita.indiceNivel === null ? null : plan.quita.indiceNivel + 1 },
            pone: { idDote: plan.pone.idDote, idExtra: plan.pone.idExtra },
        };
    if (plan.tipo === 'idioma')
        return { tipo: 'idioma', quita: { idIdioma: plan.quita.idIdioma }, pone: { idIdioma: plan.pone.idIdioma } };
    if (plan.tipo === 'rangos')
        return {
            tipo: 'rangos', rangos: plan.rangos,
            quita: { idHabilidad: plan.quita.idHabilidad, idExtra: plan.quita.idExtra },
            pone: { idHabilidad: plan.pone.idHabilidad, idExtra: plan.pone.idExtra },
        };
    if (plan.tipo === 'rasgo')
        return { tipo: 'rasgo', hueco: huecoDelCuerpo(plan.hueco), ...opcionesDelCuerpo(plan) };
    if (plan.tipo === 'dominio' || plan.tipo === 'escuela')
        return reciclajeDelDominioOLaEscuela(plan);
    return { tipo: 'conjuros', cambios: plan.cambios.map((c) => ({ idClase: c.idClase, olvida: c.olvida.id, aprende: c.aprende.id })) };
}

/** La primera fila de «Lo que cambia» (lienzo, pantalla 4): lo reciclado, con su libro y su página. */
export function filaDelReciclaje(plan: PlanReciclaje): CambioSubida {
    const conExtra = (nombre: string, extra: string) => extra ? `${nombre} (${extra})` : nombre;
    if (plan.tipo === 'dote')
        return {
            que: 'Reciclaje: dote',
            antes: conExtra(plan.quita.nombre, plan.quita.extra),
            ahora: conExtra(plan.pone.nombre, plan.pone.extra),
            porque: `${plan.quita.indiceNivel === null ? 'Dote sin su nivel en el registro (como de 1.er nivel)' : `Dote de nivel ${plan.quita.indiceNivel + 1}`}; Manual del jugador II, pág. 195`,
        };
    if (plan.tipo === 'idioma')
        return { que: 'Reciclaje: idioma', antes: plan.quita.nombre, ahora: plan.pone.nombre, porque: 'Un idioma por otro; Manual del jugador II, pág. 196' };
    if (plan.tipo === 'rangos')
        return {
            que: 'Reciclaje: habilidades', antes: `${plan.quita.nombre} −${plan.rangos}`, ahora: `${plan.pone.nombre} +${plan.rangos}`,
            porque: `Traspasa ${plan.rangos} ${plan.rangos === 1 ? 'rango' : 'rangos'}; Manual del jugador II, pág. 196`,
        };
    if (plan.tipo === 'rasgo') {
        const { hueco } = plan;
        const donde = hueco.grupo === null
            ? `${hueco.tiene.especial?.nombre ?? 'Aptitud'} de ${hueco.clase.toLowerCase()}, nivel ${hueco.nivelClase}`
            : `${hueco.clase}, nivel ${hueco.nivelClase}`;
        return {
            que: 'Reciclaje: rasgo de clase', antes: nombreDeLoQueTiene(hueco), ahora: nombreDeOpcion(plan.pone, plan.doteElegida?.dote),
            porque: `${donde}, otra opción del mismo hueco; Manual del jugador II, pág. 195`,
        };
    }
    if (plan.tipo === 'dominio') {
        const { hueco } = plan;
        return {
            que: 'Reciclaje: dominio', antes: hueco.tiene.nombre, ahora: plan.pone.nombre,
            porque: `${hueco.clase}, nivel 1: otro dominio ${hueco.deidad ? `de ${hueco.deidad}` : 'que puede elegir sin deidad'}; Manual del jugador II, pág. 195`,
        };
    }
    if (plan.tipo === 'escuela')
        return {
            que: 'Reciclaje: especialización', antes: nombreDeLaEspecializacion(plan.hueco.tiene), ahora: nombreDeLaEspecializacion(plan.pone),
            porque: `${plan.hueco.clase}, nivel 1: la especialización y las prohibidas, como un solo rasgo; Manual del jugador II, pág. 195`,
        };
    const clases = Array.from(new Set(plan.cambios.map((c) => c.clase.toLowerCase())));
    return {
        que: 'Reciclaje: conjuros',
        antes: plan.cambios.map((c) => c.olvida.nombre).join(', '),
        ahora: plan.cambios.map((c) => c.aprende.nombre).join(', '),
        porque: `Conocidos de ${clases.join(' y ')}, del mismo nivel; Manual del jugador II, pág. 196`,
    };
}

/**
 * Las filas de «Lo que cambia» de lo reciclado: la suya (`filaDelReciclaje`) y, de un rasgo de clase, lo que cambia solo
 * con él (las dotes que su tabla da por la opción).
 */
export function filasDelReciclaje(plan: PlanReciclaje): CambioSubida[] {
    const filas = [filaDelReciclaje(plan)];
    // Un dominio o la escuela: lo que da cada uno (su poder, sus dotes…, los bonos del especialista) y el libro.
    if (plan.tipo === 'dominio' || plan.tipo === 'escuela') {
        plan.derivados.forEach((d) => filas.push({
            que: `Reciclaje: ${d.que.toLowerCase()}`, antes: d.antes, ahora: d.ahora,
            porque: plan.tipo === 'dominio' ? 'Lo da el dominio: cambia solo; Manual del jugador II, pág. 194' : 'Lo da la especialización: cambia solo; Manual del jugador, pág. 48',
        }));
        if (plan.tipo === 'escuela' && plan.libroSinPreparar.length > 0)
            filas.push({
                que: 'Reciclaje: el libro', antes: plan.libroSinPreparar.join(', '), ahora: 'Se quedan en el libro: no se pueden preparar',
                porque: 'Son de una escuela que pasa a estar prohibida; Manual del jugador II, pág. 195',
            });
        return filas;
    }
    const derivados = plan.tipo === 'rasgo' ? plan.cambios.filter((c) => c.derivado) : [];
    if (derivados.length > 0)
        filas.push({
            que: 'Reciclaje: lo que cambia solo',
            antes: derivados.map((c) => c.nombreQuita).filter((n) => n).join(', ') || '—',
            ahora: derivados.map((c) => c.nombrePone).filter((n) => n).join(', ') || '—',
            porque: 'Lo da su tabla por la opción; Manual del jugador II, pág. 194',
        });
    return filas;
}

/** Las aptitudes que entran con lo reciclado (un rasgo de clase): no son del nivel nuevo. */
export function aptitudesDelReciclaje(plan: PlanReciclaje | null): Array<{ nombre: string; extra: string; }> {
    if (plan?.tipo === 'dominio')
        return plan.aptitudesNuevas.map((a) => ({ ...a }));
    if (plan?.tipo !== 'rasgo')
        return [];
    return plan.cambios.filter((c) => c.tipo === 'especial' && c.pone).map((c) => ({ nombre: c.pone!.nombre, extra: c.pone!.extra }));
}

/**
 * La `entrada` con el reciclaje hecho: la ficha sobre la que sigue la subida (la que se manda lleva, además, el nivel).
 * Lo nuevo va en el hueco de lo antiguo (la dote, con su origen; el idioma y el conocido, con el suyo); los rangos pasan
 * de una habilidad a otra (`claseaDestino`, si la de destino no tenía fila y es de clase). Los niveles no cambian: el
 * registro del cambio lo apunta la API en el nivel en que se eligió lo antiguo. Con `motor` (su cuerpo antes y después
 * del cambio), también lo que daba lo antiguo y lo que da lo nuevo: los modificadores y los rangos varios de una dote (la
 * API los guarda tal cual) y lo que suma a una característica.
 */
export function fichaConElReciclaje(entrada: PersonajeCreateRequestDto, reciclaje: ReciclajeSubidaDto,
    opciones: {
        origenDote?: string; claseaDestino?: boolean; motor?: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null;
        /**
         * El plan de un rasgo de clase: lo que cambia, con sus orígenes y lo derivado (`fichaConElRasgo`); un dominio, con lo
         * que cambia el motor (`fichaConElDominio`), o la escuela (`fichaConLaEscuela`).
         */
        rasgo?: PlanDeRasgoDeClase;
    } = {})
    : PersonajeCreateRequestDto {
    const rasgo = reciclaje.tipo === 'rasgo' ? opciones.rasgo : undefined;
    const ficha: PersonajeCreateRequestDto = rasgo?.tipo === 'rasgo' ? fichaConElRasgo(entrada, rasgo)
        : rasgo?.tipo === 'dominio' ? fichaConElDominio(entrada, rasgo, opciones.motor)
            : rasgo?.tipo === 'escuela' ? fichaConLaEscuela(entrada, rasgo)
                : JSON.parse(JSON.stringify(entrada));
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    if (reciclaje.tipo === 'rasgo') {
        // Ya hecho: `fichaConElRasgo`, `fichaConElDominio` o `fichaConLaEscuela`, con lo de la opción y lo derivado.
    } else if (reciclaje.tipo === 'dote') {
        const { quita, pone } = reciclaje;
        const dotes: any[] = col.dotes = [...(col.dotes ?? [])];
        const quitada = sacarDoteDeLaFicha(dotes, quita.idDote, quita.idExtra, opciones.origenDote);
        const origen = `${quitada?.origen ?? opciones.origenDote ?? ''}`.trim();
        dotes.push({ idDote: toInt(pone.idDote), idExtra: Math.max(0, toInt(pone.idExtra)), ...(origen ? { origen } : {}) });
        // La que mantenía sin sus prerrequisitos (`requisitos_dote`) y ya no tiene: fuera, o la API la rechaza.
        if (ficha.decisionesHomebrew && !dotes.some((x) => toInt(x?.idDote) === toInt(quita.idDote)))
            ficha.decisionesHomebrew = ficha.decisionesHomebrew
                .filter((d) => !(d.tipo === 'requisitos_dote' && toInt(d.idElemento) === toInt(quita.idDote)));
    } else if (reciclaje.tipo === 'idioma') {
        const idiomas: any[] = col.idiomas = [...(col.idiomas ?? [])];
        const quitado = sacarPrimero(idiomas, (x) => toInt(x?.idIdioma) === toInt(reciclaje.quita.idIdioma));
        const origen = `${quitado?.origen ?? ''}`.trim();
        idiomas.push({ idIdioma: toInt(reciclaje.pone.idIdioma), ...(origen ? { origen } : {}) });
    } else if (reciclaje.tipo === 'rangos') {
        const rangos = Math.max(0, toInt(reciclaje.rangos));
        const clave = (h: any) => `${toInt(h?.idHabilidad)}:${Math.max(0, toInt(h?.idExtra))}`;
        const base: any[] = (col.habilidades?.base ?? []).map((h: any) => ({ ...h }));
        const origen = base.find((h) => clave(h) === clave(reciclaje.quita));
        if (origen)
            origen.rangos = Math.max(0, toInt(origen.rangos) - rangos);
        const destino = base.find((h) => clave(h) === clave(reciclaje.pone));
        if (destino)
            destino.rangos = toInt(destino.rangos) + rangos;
        else
            base.push({ idHabilidad: toInt(reciclaje.pone.idHabilidad), idExtra: toInt(reciclaje.pone.idExtra), clasea: !!opciones.claseaDestino,
                rangos, rangosVarios: 0, modVarios: '' });
        col.habilidades = { ...(col.habilidades ?? {}), base };
    } else {
        const conocidos: any[] = col.conjurosConocidos = [...(col.conjurosConocidos ?? [])];
        reciclaje.cambios.forEach((c) => {
            const olvidado = sacarPrimero(conocidos, (x) => !x?.copiado && toInt(x?.idConjuro) === toInt(c.olvida) && toInt(x?.idClase) === toInt(c.idClase));
            const origen = `${olvidado?.origen ?? ''}`.trim();
            conocidos.push({ idConjuro: toInt(c.aprende), idClase: toInt(c.idClase), ...(origen ? { origen } : {}) });
        });
    }
    const motor = opciones.motor;
    if (motor)
        aplicarLoQueDanLasDotes(ficha, motor.antes, motor.despues);
    return ficha;
}

// --- Con el motor de la creación ------------------------------------------------------------------------------------

/** Lo que el reciclaje quitaría del personaje, para ver qué deja de cumplir sus prerrequisitos. */
export interface LoQueQuita {
    dote?: { idDote: number; idExtra: number; origen: string; };
    /** Varias dotes (las de un rasgo de clase y lo que da su tabla por él). */
    dotes?: Array<{ idDote: number; idExtra: number; origen: string; }>;
    /** Aptitudes de sus clases; con `soloElExtra`, solo su extra (la de «Elegir», que se queda con otro). */
    aptitudes?: Array<{ id: number; idExtra: number; soloElExtra?: boolean; }>;
    idioma?: string;
    rangos?: { idHabilidad: number; idExtra: number; rangos: number; };
    conjuros?: Array<{ idConjuro: number; clase: string; }>;
    /** Dominios, por su nombre (el de un dominio que se recicla: una clase de prestigio que lo pide). */
    dominios?: string[];
    /**
     * Otra especialización (la escuela del mago que se recicla), con lo elegido en el selector y sus escuelas: lo que pide
     * especializarse en una escuela o lanzar conjuros de una que pasa a estar prohibida.
     */
    escuela?: { idClase: number; seleccion: EspecialidadArcanaSeleccion; escuelas: EscuelaConjuros[]; };
}

/** Las clases que tiene, del catálogo del motor. */
function clasesQueTiene(motor: NuevoPersonajeService): Clase[] {
    return (motor.PersonajeCreacion.desgloseClases ?? [])
        .filter((c) => toInt(c?.Nivel) > 0)
        .map((c) => motor.claseDelCatalogo(toInt(c?.Id)))
        .filter((c): c is Clase => !!c);
}

/**
 * Lo que no cumplía cada clase que tiene (sus prerrequisitos: `evaluarClaseParaSeleccion` con `soloPrerrequisitos`, para
 * que una de prestigio terminada o cerrada no se quede en «nivel máximo»), para ver después qué deja de cumplir
 * (`clasesQueDejanDeCumplir`). Lo usan el reciclaje (`loQueDejariaDeCumplir`) y la raza mutada adquirida.
 */
export function razonesDeSusClases(motor: NuevoPersonajeService): Map<number, Set<string>> {
    return new Map(clasesQueTiene(motor).map((c) => [toInt(c.Id), new Set(motor.evaluarClaseParaSeleccion(c, { soloPrerrequisitos: true }).razones ?? [])]));
}

/**
 * Las clases que dejan de cumplir lo que piden (una de prestigio que pide una dote, unos rangos o una raza): solo lo que no
 * fallaba antes (`antes`, de `razonesDeSusClases`). Con la raza mutada adquirida, quedan ex mientras no cumplan (*El arcano
 * completo*, pág. 17), como al adquirir una plantilla.
 */
export function clasesQueDejanDeCumplir(motor: NuevoPersonajeService, antes: Map<number, Set<string>>)
    : Array<{ idClase: number; nombre: string; razones: string[]; }> {
    return clasesQueTiene(motor).flatMap((c) => {
        const previas = antes.get(toInt(c.Id)) ?? new Set<string>();
        const razones = (motor.evaluarClaseParaSeleccion(c, { soloPrerrequisitos: true }).razones ?? []).filter((r) => !previas.has(r));
        return razones.length > 0 ? [{ idClase: toInt(c.Id), nombre: `${c.Nombre}`, razones }] : [];
    });
}

/**
 * Lo que dejaría de cumplir sus prerrequisitos si el personaje perdiera `quita`: sus dotes (cada una en el nivel en que la
 * eligió, como la corrección: `dotesSinSusPrerrequisitos`) y sus clases (una de prestigio, con lo que pide su
 * `evaluarClaseParaSeleccion`). Solo lo que cumplía antes; el motor se queda como estaba. Frases: «Movilidad (No cumple: Esquiva)».
 */
export function loQueDejariaDeCumplir(motor: NuevoPersonajeService, quita: LoQueQuita): string[] {
    const pj = motor.PersonajeCreacion;
    const dotesAntes = new Set(motor.dotesSinSusPrerrequisitos().map(claveDoteDeLaFicha));
    const razonesAntes = razonesDeSusClases(motor);
    const guardado = {
        claseas: (pj.Claseas ?? []).map((e) => ({ ...e })),
        contextuales: [...(pj.DotesContextuales ?? [])],
        dotes: [...(pj.Dotes ?? [])],
        habilidades: (pj.Habilidades ?? []).map((h) => ({ ...h })),
        idiomas: [...(pj.Idiomas ?? [])],
        conjuros: [...(pj.Conjuros ?? [])],
        dominios: [...(pj.Dominios ?? [])],
        especialista: pj.Escuela_especialista,
        prohibidas: pj.Escuelas_prohibidas,
    };
    const quitadas = [...(quita.dote ? [quita.dote] : []), ...(quita.dotes ?? [])];
    try {
        quitadas.forEach((d) => {
            const quitada = sacarPrimero(pj.DotesContextuales ?? [], (x) => toInt(x?.Dote?.Id) === d.idDote
                && toInt(x?.Contexto?.Id_extra) === d.idExtra && `${(x?.Contexto as any)?.Origen ?? ''}` === d.origen);
            sacarPrimero(pj.Dotes ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(quitada?.Dote?.Nombre ?? '')
                && `${x?.Origen ?? ''}` === d.origen);
        });
        (quita.aptitudes ?? []).forEach((a) => {
            const es = (x: any) => toInt(x?.Id) === a.id && mismoExtra(x?.Id_extra, a.idExtra);
            if (!a.soloElExtra)
                sacarPrimero(pj.Claseas ?? [], es);
            else
                pj.Claseas = (pj.Claseas ?? []).map((x) => es(x) ? { ...x, Id_extra: 0, Extra: '' } : x);
        });
        if (quita.idioma)
            sacarPrimero(pj.Idiomas ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(quita.idioma ?? ''));
        if (quita.rangos) {
            const r = quita.rangos;
            const h = (pj.Habilidades ?? []).find((x) => !x?.Custom && toInt(x?.Id) === r.idHabilidad);
            if (h)
                h.Rangos = Math.max(0, toNumber(h.Rangos) - r.rangos);
        }
        (quita.conjuros ?? []).forEach((c) => sacarPrimero(pj.Conjuros ?? [], (x) => toInt(x?.Id) === c.idConjuro && esConjuroDeLaClase(x, normalizarTexto(c.clase))));
        (quita.dominios ?? []).forEach((nombre) => sacarPrimero(pj.Dominios ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(nombre)));
        const clase = quita.escuela ? motor.claseDelCatalogo(quita.escuela.idClase) : null;
        if (quita.escuela && clase)
            motor.aplicarEspecialidadMagicaClase(clase, 1, { arcana: quita.escuela.seleccion }, quita.escuela.escuelas, []);

        const sinDote = (d: DoteDeLaFicha) => !quitadas.some((q) => claveDoteDeLaFicha(d) === claveDoteDeLaFicha(q));
        const motivos = motor.dotesSinSusPrerrequisitos()
            .filter((d) => !dotesAntes.has(claveDoteDeLaFicha(d)) && sinDote(d))
            .map((d) => `${d.nombre} (${(d.razones ?? []).join('; ') || 'sus prerrequisitos'})`);
        clasesQueDejanDeCumplir(motor, razonesAntes).forEach((c) => motivos.push(`${c.nombre} (${c.razones.join('; ')})`));
        return motivos;
    } finally {
        pj.Claseas = guardado.claseas;
        pj.DotesContextuales = guardado.contextuales;
        pj.Dotes = guardado.dotes;
        pj.Habilidades = guardado.habilidades;
        pj.Idiomas = guardado.idiomas;
        pj.Conjuros = guardado.conjuros;
        pj.Dominios = guardado.dominios;
        pj.Escuela_especialista = guardado.especialista;
        pj.Escuelas_prohibidas = guardado.prohibidas;
    }
}

/**
 * Las dotes del personaje (no las de su raza ni sus plantillas) y si se pueden reciclar: solo las elegidas en un hueco
 * (de nivel, adicional de una clase o de la raza: `esDoteElegida`) y que nada de lo que tiene necesite. Una que ya no
 * cumple sus prerrequisitos sí se recicla (MJ II, pág. 200).
 */
export function dotesParaReciclar(motor: NuevoPersonajeService, rasgos: HuecoDeRasgo[] = []): DoteReciclable[] {
    // La de un grupo de la tabla de su clase (las del monje): se recicla con su rasgo.
    const deUnRasgo = (idDote: number, idExtra: number, origen: string) => rasgos.find((h) => !!h.tiene.dote && !!h.doteQueTiene
        && h.doteQueTiene.id === idDote && mismoExtra(h.doteQueTiene.idExtra, idExtra) && h.doteQueTiene.origen === origen);
    return motor.dotesDelPersonaje().map((d) => {
        const idDote = toInt(d?.Dote?.Id);
        const idExtra = toInt(d?.Contexto?.Id_extra);
        const origen = `${(d?.Contexto as any)?.Origen ?? ''}`;
        const fila = {
            idDote, idExtra, origen, nombre: `${d?.Dote?.Nombre ?? ''}`, extra: idExtra > 0 ? `${d?.Contexto?.Extra ?? ''}` : '',
            indiceNivel: motor.indiceNivelDeLaDote(idDote, idExtra),
        };
        const rasgo = deUnRasgo(idDote, idExtra, origen);
        if (rasgo)
            return { ...fila, motivo: `Es de un rasgo de clase (${rasgo.clase.toLowerCase()}, nivel ${rasgo.nivelClase}): se recicla con «Reciclar un rasgo de clase».` };
        if (!motor.esDoteElegida(origen))
            return { ...fila, motivo: origen.trim() ? `No se eligió: la da ${origen.trim()}.` : 'No se eligió en ningún nivel.' };
        const rotas = loQueDejariaDeCumplir(motor, { dote: { idDote, idExtra, origen } });
        return { ...fila, motivo: rotas.length > 0 ? `La necesita lo que tiene: ${rotas.join('; ')}.` : null };
    }).filter((d) => d.idDote > 0);
}

/**
 * El hueco de la dote que se recicla, en el motor: la quita y registra otra pendiente en su mismo hueco (su origen, el tipo
 * que admite: la dote adicional de una clase, otra de su lista) y en el nivel en que se eligió (sin él, a 1.er nivel),
 * con las candidatas del selector de la creación sin la que se va. Cambia el motor: quien llama lo deja como estaba.
 * `conHomebrew`: si se ofrecen las homebrew (la ficha ya lo es y la campaña lo admite).
 */
export function huecoDeLaDoteReciclada(motor: NuevoPersonajeService, dote: DoteReciclable, conHomebrew: boolean)
    : { pendiente: DotePendienteState; candidatos: DoteSelectorCandidato[]; } | null {
    if (!motor.quitarDoteDeLaFicha(dote.idDote, dote.idExtra, dote.origen))
        return null;
    const pendiente = motor.registrarDoteEnLugarDe(dote, dote.indiceNivel ?? 0);
    const candidatos = candidatasEnLugarDe(motor.obtenerCandidatosDotePendiente(pendiente.id), { id: dote.idDote, idExtra: dote.idExtra }, conHomebrew);
    return { pendiente, candidatos };
}

/**
 * Los rasgos de clase que puede reciclar (`huecosDeRasgo`) y, si no, por qué: lo que depende de lo que tiene en el hueco y
 * se eligió después lo bloquea, como en las dotes (una dote o una clase de prestigio: el explorador con Defensa con dos
 * armas no cambia de estilo, MJ II pág. 195). Se mira sin lo que tiene y sin lo que su tabla da por ello (lo derivado, sus
 * dotes y sus aptitudes, que cambian solas); el motor se queda como estaba. `aptitudes`: el detalle de las aptitudes con
 * «Elegir», para sus opciones.
 */
export function rasgosParaReciclar(motor: NuevoPersonajeService, aptitudes: ReadonlyMap<number, EspecialClaseDetalle | null> = new Map())
    : HuecoDeRasgo[] {
    return huecosDeRasgo(motor, aptitudes).map((hueco) => {
        if (hueco.motivo)
            return hueco;
        const { tiene, doteQueTiene } = hueco;
        const derivadas = derivadasDelCambio(motor, hueco, null).filter((c) => !!c.quita);
        const rotas = loQueDejariaDeCumplir(motor, {
            dotes: [
                ...(doteQueTiene ? [{ idDote: doteQueTiene.id, idExtra: doteQueTiene.idExtra, origen: doteQueTiene.origen }] : []),
                ...derivadas.filter((c) => c.tipo === 'dote').map((c) => ({ idDote: c.quita!.id, idExtra: c.quita!.idExtra, origen: `${c.quita!.origen ?? ''}` })),
            ],
            aptitudes: [
                ...(tiene.especial && !hueco.aptitudCompartida ? [{ id: tiene.especial.id, idExtra: tiene.especial.idExtra, soloElExtra: hueco.grupo === null }] : []),
                ...derivadas.filter((c) => c.tipo === 'especial' && !c.conservar).map((c) => ({ id: c.quita!.id, idExtra: c.quita!.idExtra })),
            ],
        });
        return rotas.length > 0 ? { ...hueco, motivo: `Lo necesita lo que tiene: ${rotas.join('; ')}.` } : hueco;
    });
}

/**
 * Los dominios que puede reciclar (`huecosDeDominio`) y, si no, por qué: lo que depende del que tiene y se eligió después lo
 * bloquea (una dote o una clase de prestigio que lo pide, o que pide una dote o una aptitud de su poder). Se mira sin él y
 * sin lo que da (sus dotes y sus aptitudes, que cambian solas); el motor se queda como estaba.
 */
export function dominiosParaReciclar(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, nivelPersonaje: number,
    conHomebrew: boolean): HuecoDeDominio[] {
    return huecosDeDominio(motor, entrada, nivelPersonaje, conHomebrew).map((hueco) => {
        if (hueco.motivo)
            return hueco;
        const da = loQueDaElDominio(motor, hueco.tiene);
        // Sus aptitudes, si no las da también otro dominio que le quede.
        const deOtros = new Set((motor.PersonajeCreacion.Dominios ?? []).filter((d) => normalizarTexto(d?.Nombre ?? '') !== normalizarTexto(hueco.tiene.nombre))
            .flatMap((d) => motor.dominioDelCatalogo(toInt(d?.Id) || toInt(motor.resolverIdDominioPorNombre(`${d?.Nombre ?? ''}`)))?.Especiales ?? [])
            .map((e) => normalizarTexto(e?.Nombre ?? '')));
        const rotas = loQueDejariaDeCumplir(motor, {
            dominios: [hueco.tiene.nombre],
            dotes: da.dotes.map(({ idDote, idExtra, origen }) => ({ idDote, idExtra, origen })),
            aptitudes: da.aptitudes.filter((a) => !deOtros.has(normalizarTexto(a.nombre))).map(({ id, idExtra }) => ({ id, idExtra })),
        });
        return rotas.length > 0 ? { ...hueco, motivo: `Lo necesita lo que tiene: ${rotas.join('; ')}.` } : hueco;
    });
}

/**
 * Lo que dejaría de cumplir con otra especialización (`plan`, la escuela que se recicla): una dote o una clase de prestigio
 * que pide especializarse en la que tiene o lanzar conjuros de una escuela que pasa a estar prohibida. Se bloquea, no se
 * quita en cascada; el motor se queda como estaba. `null` si no rompe nada.
 */
export function motivoDeLaEscuela(motor: NuevoPersonajeService, plan: PlanEscuela): string | null {
    const rotas = loQueDejariaDeCumplir(motor, { escuela: { idClase: plan.hueco.idClase, seleccion: plan.seleccion, escuelas: plan.escuelas } });
    return rotas.length > 0 ? `Lo necesita lo que tiene: ${rotas.join('; ')}.` : null;
}

/**
 * Los idiomas que conoce, venga de donde venga, y si se pueden olvidar (no uno secreto, `Secreto` del catálogo, ni uno que
 * pida algo que tiene), y los que puede aprender en su lugar: los que no conoce y no son secretos (MJ II, pág. 196).
 */
export function idiomasParaReciclar(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, conHomebrew: boolean)
    : { quitables: IdiomaReciclable[]; aprendibles: Array<{ idIdioma: number; nombre: string; }>; } {
    const catalogo = motor.EstadoFlujo.ventajas.catalogoIdiomas ?? [];
    const conoce = new Set((entrada.colecciones?.idiomas ?? []).map((i) => toInt(i.idIdioma)));
    const quitables = (entrada.colecciones?.idiomas ?? []).map((i) => {
        const idioma = catalogo.find((c) => toInt(c?.Id) === toInt(i.idIdioma));
        const nombre = `${idioma?.Nombre ?? `#${toInt(i.idIdioma)}`}`;
        if (idioma?.Secreto)
            return { idIdioma: toInt(i.idIdioma), nombre, motivo: 'Es un idioma secreto: no se recicla.' };
        const rotas = loQueDejariaDeCumplir(motor, { idioma: nombre });
        return { idIdioma: toInt(i.idIdioma), nombre, motivo: rotas.length > 0 ? `Lo necesita lo que tiene: ${rotas.join('; ')}.` : null };
    });
    const aprendibles = catalogo
        .filter((c) => toInt(c?.Id) > 0 && !c.Secreto && !conoce.has(toInt(c.Id)) && (conHomebrew || c.Oficial !== false))
        .map((c) => ({ idIdioma: toInt(c.Id), nombre: `${c.Nombre ?? ''}` }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return { quitables, aprendibles };
}

/**
 * Si la habilidad sería de clase para una clase que puede subir (`habilidadesDeClaseDeLaClase` del motor; un extra en 0 o
 * sin él, cualquiera).
 */
function esHabilidadDeClaseDe(motor: NuevoPersonajeService, clase: Clase, idHabilidad: number, idExtra: number): boolean {
    return motor.habilidadesDeClaseDeLaClase(clase).some((ref) => {
        const id = toInt(ref?.['Id_habilidad'] ?? ref?.['id_habilidad'] ?? ref?.['Id']);
        const extra = toInt(ref?.['Id_extra'] ?? ref?.['id_extra']);
        return id === toInt(idHabilidad) && (extra <= 0 || extra === toInt(idExtra));
    });
}

/** Las habilidades con rangos comprados en la ficha (`entrada`), de las que se pueden traspasar rangos. */
export function habilidadesConRangos(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto): HabilidadConRangos[] {
    const habilidades = (motor.PersonajeCreacion.Habilidades ?? []).filter((h) => !h?.Custom && toInt(h?.Id) > 0);
    return (entrada.colecciones?.habilidades?.base ?? [])
        .filter((h) => toInt(h?.rangos) >= 1)
        .map((h) => {
            const delMotor = habilidades.find((x) => toInt(x.Id) === toInt(h.idHabilidad));
            return { idHabilidad: toInt(h.idHabilidad), idExtra: toInt(h.idExtra), nombre: delMotor ? nombreDeHabilidadConExtra(delMotor) : `#${toInt(h.idHabilidad)}`, rangos: toInt(h.rangos) };
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Las habilidades a las que puede traspasar `rangos` desde `origen`: de clase para alguna de sus clases, contando la que
 * sube (`clasesQuePuedeSubir`: si solo lo es para una de ellas, `clases` dice cuáles), o por su raza o un dominio, como en
 * la ficha (contrato, «El reciclaje»), con su especialidad elegida y sin pasar del tope (nivel de antes + 3). Las que no
 * valen, con su motivo. Las personalizadas no: el contrato no las tiene.
 */
export function destinosDeRangos(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, origen: HabilidadConRangos,
    rangos: number, nivelPersonaje: number, clasesQuePuedeSubir: Clase[]): DestinoDeRangos[] {
    // El de una de clase con el nivel de antes de subir (MJ II, pág. 196).
    const tope = limiteRangosHabilidad(nivelPersonaje, true);
    const guardadas = entrada.colecciones?.habilidades?.base ?? [];
    return (motor.PersonajeCreacion.Habilidades ?? [])
        .filter((h) => !h?.Custom && toInt(h?.Id) > 0 && toInt(h.Id) !== origen.idHabilidad)
        .map((h) => {
            const idHabilidad = toInt(h.Id);
            // -1 sin extra y 0 («Elegir») si lo admite y falta: el contrato lleva 0 en los dos.
            const extraGuardado = idExtraHabilidadParaGuardar(h);
            const idExtra = Math.max(0, extraGuardado);
            const guardada = guardadas.find((g) => toInt(g?.idHabilidad) === idHabilidad);
            const tiene = toInt(guardada?.rangos ?? h.Rangos);
            const base = { idHabilidad, idExtra, nombre: nombreDeHabilidadConExtra(h), rangos: tiene };
            if (h.Soporta_extra && extraGuardado <= 0)
                return { ...base, clases: null, motivo: 'Aún no tiene elegida su especialidad.' };
            // De clase como en la ficha: por sus clases (con sus dominios) o su raza (el motor, `esHabilidadDeClaseEnAlguna`).
            const deLasSuyas = motor.esHabilidadDeClaseEnAlguna(h);
            const deLaQueSube = deLasSuyas ? [] : clasesQuePuedeSubir.filter((c) => esHabilidadDeClaseDe(motor, c, idHabilidad, idExtra))
                .map((c) => ({ id: toInt(c.Id), nombre: `${c.Nombre}` }));
            if (!deLasSuyas && deLaQueSube.length < 1)
                return { ...base, clases: null, motivo: 'No es de clase para ninguna de sus clases, ni por su raza o un dominio, ni para las que puede subir.' };
            if (tiene + rangos > tope)
                return { ...base, clases: deLasSuyas ? null : deLaQueSube, motivo: `Con ${rangos} más pasaría de ${tope} rangos (su nivel, ${toInt(nivelPersonaje)}, + 3).` };
            return { ...base, clases: deLasSuyas ? null : deLaQueSube, motivo: null };
        })
        .sort((a, b) => Number(!!a.motivo) - Number(!!b.motivo) || a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Sus clases con conocidos limitados (`Conjuros.Conocidos_total` o `Conocidos_nivel_a_nivel`: una tabla de conocidos) y
 * sus conocidos (no los copiados al libro), cada uno con su nivel en la lista de la clase y si se puede olvidar.
 */
export function conocidosParaReciclar(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto): ClaseConConocidos[] {
    const catalogo = motor.CatalogoConjuros;
    return clasesQueTiene(motor)
        .filter((c) => !!(c.Conjuros?.Conocidos_total || c.Conjuros?.Conocidos_nivel_a_nivel))
        .map((c) => {
            const clase = { id: toInt(c.Id), nombre: `${c.Nombre}` };
            const conocidos = (entrada.colecciones?.conjurosConocidos ?? [])
                .filter((x) => !x.copiado && toInt(x.idClase) === clase.id)
                .map((x) => {
                    const conjuro = catalogo.find((k) => toInt(k?.Id) === toInt(x.idConjuro));
                    const nivel = nivelDelConjuroEnLaClase(conjuro, clase);
                    const nombre = `${conjuro?.Nombre ?? `#${toInt(x.idConjuro)}`}`;
                    if (nivel < 0)
                        return { idConjuro: toInt(x.idConjuro), nombre, nivel, motivo: `No está en la lista de ${clase.nombre.toLowerCase()}.` };
                    const rotas = loQueDejariaDeCumplir(motor, { conjuros: [{ idConjuro: toInt(x.idConjuro), clase: clase.nombre }] });
                    return { idConjuro: toInt(x.idConjuro), nombre, nivel, motivo: rotas.length > 0 ? `Lo necesita lo que tiene: ${rotas.join('; ')}.` : null };
                })
                .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, 'es'));
            return { ...clase, conocidos };
        })
        .filter((c) => c.conocidos.length > 0);
}

/** Los que puede aprender en lugar de un conocido de la clase: de su lista, del mismo nivel y que no conozca ya. */
export function conjurosParaAprender(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, clase: { id: number; nombre: string; },
    nivel: number, conHomebrew: boolean, yaElegidos: number[] = []): Conjuro[] {
    const catalogo = motor.CatalogoConjuros;
    const conoce = new Set([...(entrada.colecciones?.conjurosConocidos ?? [])
        .filter((x) => !x.copiado && toInt(x.idClase) === clase.id).map((x) => toInt(x.idConjuro)), ...yaElegidos.map((id) => toInt(id))]);
    return catalogo
        .filter((c) => (conHomebrew || c?.Oficial !== false) && !conoce.has(toInt(c?.Id)) && nivelDelConjuroEnLaClase(c, clase) === nivel)
        .sort((a, b) => `${a.Nombre}`.localeCompare(`${b.Nombre}`, 'es'));
}

/**
 * Hace el reciclaje en el motor, antes del nivel: así el nivel sigue ya con el cambio (los topes de rangos, los conocidos
 * del intercambio, los prerrequisitos de lo que elija). La dote, en su hueco con el selector de la creación
 * (`huecoDeLaDoteReciclada` y lo elegido en él); el idioma, los rangos y los conocidos, cambiados en el personaje.
 * `false` si no se puede (lo elegido ya no vale con el personaje de ahora).
 */
export function aplicarReciclajeAlMotor(motor: NuevoPersonajeService, plan: PlanReciclaje): boolean {
    const pj = motor.PersonajeCreacion;
    if (plan.tipo === 'rasgo')
        return aplicarRasgoAlMotor(motor, plan);
    if (plan.tipo === 'dominio')
        return motor.cambiarDominio(plan.hueco.idClase, plan.hueco.tiene.id, plan.pone.id);
    if (plan.tipo === 'escuela')
        return aplicarEscuelaAlMotor(motor, plan);
    if (plan.tipo === 'dote') {
        const hueco = huecoDeLaDoteReciclada(motor, plan.quita, true);
        return !!hueco && motor.aplicarDotePendiente(hueco.pendiente.id, plan.seleccion);
    }
    if (plan.tipo === 'idioma') {
        const idioma = (motor.EstadoFlujo.ventajas.catalogoIdiomas ?? []).find((c) => toInt(c?.Id) === plan.pone.idIdioma);
        const quitado = sacarPrimero(pj.Idiomas ?? [], (x) => normalizarTexto(x?.Nombre ?? '') === normalizarTexto(plan.quita.nombre));
        if (!idioma || !quitado)
            return false;
        pj.Idiomas.push({ Nombre: `${idioma.Nombre}`, Descripcion: `${idioma.Descripcion ?? ''}`, Secreto: !!idioma.Secreto,
            Oficial: idioma.Oficial !== false, ...(quitado.Origen ? { Origen: quitado.Origen } : {}) });
        return true;
    }
    if (plan.tipo === 'rangos') {
        const buscar = (id: number) => (pj.Habilidades ?? []).find((h) => !h?.Custom && toInt(h?.Id) === id);
        const origen = buscar(plan.quita.idHabilidad);
        const destino = buscar(plan.pone.idHabilidad);
        if (!origen || !destino || toNumber(origen.Rangos) < plan.rangos)
            return false;
        origen.Rangos = toNumber(origen.Rangos) - plan.rangos;
        destino.Rangos = toNumber(destino.Rangos) + plan.rangos;
        return true;
    }
    const catalogo = motor.CatalogoConjuros;
    for (const c of plan.cambios) {
        const nuevo = catalogo.find((k) => toInt(k?.Id) === c.aprende.id);
        if (!nuevo || !sacarPrimero(pj.Conjuros ?? [], (x) => toInt(x?.Id) === c.olvida.id && esConjuroDeLaClase(x, normalizarTexto(c.clase))))
            return false;
        pj.Conjuros.push({ ...JSON.parse(JSON.stringify(nuevo)), Clase_origen: c.clase, Origen_clase: c.clase } as Conjuro);
    }
    return true;
}
