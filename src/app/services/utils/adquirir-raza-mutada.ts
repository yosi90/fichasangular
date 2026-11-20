import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { PrerrequisitoMutacion, Raza } from 'src/app/interfaces/raza';
import { TipoPrerrequisitoMutacion } from 'src/app/interfaces/razas-api';
import { ExperienciaPersonaje } from 'src/app/interfaces/sesiones';
import {
    CambioPlantilla, filaDeLosPx, filasDeCaracteristicas, filasDeRasgosRaciales, filasDelTipo, filasSinPoderUsar, nombresDeDotes, nombresNuevos,
} from './adquirir-plantilla';
import { nombreExClase } from './alineamiento-clase';
import { sacarDoteDeLaFicha, sinDecisionesDeDotesQueNoTiene } from './correccion-ficha';
import { etapaEdad } from './edad-personaje';
import { dgsRacialesQueCuentan } from './nivel-personaje';
import { normalizarTexto, toInt, toNumber } from './normalizacion';
import { esRazaMutada } from './raza-mutacion';
import { formatoPx } from './sesiones-texto';
import { diferencia, fichaConLoDelMotor, PgSubida, SE_CONSERVAN_PERSONAJE } from './subida-nivel';

/*
 * Adquirir una raza mutada con el personaje ya creado (roadmap de sesiones, fase 7; contrato en
 * `docs/publica/endpoints/personajes.md`, «Adquirir una raza mutada»; guía `docs/publica/SESIONES_FRONT.md`): la prole de
 * Bahamut con el Rito del Renacimiento (*Races of the Dragon*, págs. 8-10) o el nacido del Infierno con la Flagelación
 * (*Fiendish Codex II*, págs. 77-79). Como la plantilla, la web parte de la `entrada` de la sesión abierta, hidrata el
 * motor de la creación, le cambia la raza por la combinada de la API (`NuevoPersonajeService.adquirirRazaMutada`), quita
 * lo que pierde en su hueco y manda a `POST /personajes/{id}/raza-mutada` la `entrada` con lo que cambia el motor. Las
 * reglas salen de los datos de la raza (sus prerrequisitos, sus ajustes, su dote adicional y sus puntos extra), nunca de
 * su nombre. Lo usa solo `components/sesiones/adquirir-raza-mutada` (con carga diferida).
 */

/** El sujeto de un prerrequisito de mutación que mira el momento de adquirirla (al crear el personaje o después). */
const SUJETO_MOMENTO = 'creacion';
/** La clave del momento de adquirirla con el personaje ya creado (`Clave_referencia`, `momentos_mutacion.clave`). */
export const MOMENTO_DESPUES = 'despues';
/** El dato del tipo de criatura (`TipoPrerrequisitoMutacion.Dato`), el que se compara con el del personaje. */
const DATO_TIPO_CRIATURA = 'tipo_criatura';

function prerrequisitosDe(raza: Pick<Raza, 'Prerrequisitos'> | null | undefined): PrerrequisitoMutacion[] {
    return Object.values(raza?.Prerrequisitos ?? {}).flat().filter((p): p is PrerrequisitoMutacion => !!p);
}

/**
 * Si la raza mutada se puede adquirir con el personaje ya creado, por su dato `momento` (los prerrequisitos de sujeto
 * `creacion`, con la clave de su momento en `Clave_referencia`): una que no lo restringe (la prole, el nacido del
 * Infierno) o que admite `despues`, sí; una que solo es `al_crear` (las variantes elementales, que son de nacimiento), no.
 * La API lo comprueba igual (`400 mutacion_fuera_de_momento`).
 */
export function esRazaMutadaAdquirible(raza: Raza | null | undefined): boolean {
    const momentos = prerrequisitosDe(raza).filter((p) => p.Sujeto === SUJETO_MOMENTO);
    return esRazaMutada(raza) && (momentos.length < 1 || momentos.some((p) => p.Clave_referencia === MOMENTO_DESPUES));
}

/**
 * Lo que la raza mutada pide del tipo de criatura que no cumple el personaje, comparado con el suyo de ahora, con sus
 * plantillas (Manual de monstruos, pág. 293: un humano semicelestial es un ajeno y no hace el Rito), no con el de su raza
 * base: los prerrequisitos cuyo tipo (`tipos`, de `GET /razas/mutaciones/modelo`) mira el tipo de criatura, con su
 * comparador (`es`, `no_es`); los obligatorios uno a uno y, de cada grupo «uno de estos», el grupo entero. Las frases de
 * la API.
 */
export function tipoQueNoCumpleLaMutacion(raza: Pick<Raza, 'Prerrequisitos'> | null | undefined,
    tipos: ReadonlyArray<Pick<TipoPrerrequisitoMutacion, 'Clave' | 'Dato' | 'Comparador'>>, idTipoPersonaje: number): string[] {
    const porClave = new Map(tipos.filter((t) => t.Dato === DATO_TIPO_CRIATURA).map((t) => [t.Clave, t]));
    const deTipo = prerrequisitosDe(raza).filter((p) => porClave.has(p.Tipo) && toInt(p.Id_referencia) > 0);
    const cumple = (p: PrerrequisitoMutacion) => {
        const igual = toInt(p.Id_referencia) === toInt(idTipoPersonaje);
        return porClave.get(p.Tipo)?.Comparador === 'no_es' ? !igual : igual;
    };
    const grupos = new Map<number, PrerrequisitoMutacion[]>();
    const fallan: string[] = [];
    deTipo.forEach((p) => {
        if (toInt(p.Opcional) > 0)
            grupos.set(toInt(p.Opcional), [...(grupos.get(toInt(p.Opcional)) ?? []), p]);
        else if (!cumple(p))
            fallan.push(p.Frase);
    });
    grupos.forEach((grupo) => {
        if (!grupo.some(cumple))
            fallan.push(grupo.map((p) => p.Frase).join(' o '));
    });
    return fallan;
}

/**
 * Las condiciones que confirma el máster (el arrepentimiento del alma del nacido del Infierno): los prerrequisitos con su
 * `Texto`, que solo llevan esas. No bloquean y la API no las devuelve: se enseñan como aviso, con la frase de la raza.
 */
export function condicionesDelMaster(raza: Pick<Raza, 'Prerrequisitos'> | null | undefined): string[] {
    return prerrequisitosDe(raza).filter((p) => `${p.Texto ?? ''}`.trim().length > 0).map((p) => p.Frase);
}

type EdadesDeRaza = Pick<Raza, 'Edad_adulto' | 'Edad_mediana' | 'Edad_viejo' | 'Edad_venerable'>;

/**
 * Si con la tabla de edades de la raza mutada no es adulto (la prole «renace adulta», *Races of the Dragon*, pág. 8: un
 * elfo de 250 años ya es de mediana edad con la suya): la categoría que tendría, o `null`. Solo si la mutación trae su
 * propia tabla; con la de la raza de ahora (el nacido del Infierno), la categoría no cambia y no se mira (contrato:
 * `409 mutacion_edad_no_adulta`).
 */
export function edadNoAdulta(edad: number, anterior: EdadesDeRaza | null | undefined, combinada: EdadesDeRaza | null | undefined): string | null {
    const campos = ['Edad_adulto', 'Edad_mediana', 'Edad_viejo', 'Edad_venerable'] as const;
    if (!combinada || campos.every((k) => toNumber(combinada[k]) === toNumber(anterior?.[k])))
        return null;
    const etapa = etapaEdad(edad, combinada);
    return etapa && etapa.id !== 'adulto' ? etapa.nombre : null;
}

export type RazaDelNep = Pick<Raza, 'Ajuste_nivel' | 'Dgs_adicionales'>;

/** Los DG raciales de una raza (`Dgs_adicionales.Cantidad`). */
function dgsRaciales(raza: RazaDelNep | null | undefined): number {
    return Math.max(0, toInt(raza?.Dgs_adicionales?.Cantidad));
}

/**
 * Si la mutación le quita DG raciales (los sustituye y la raza de ahora los tiene): aún no se puede perder un DG racial
 * (contrato: `409 mutacion_quita_dg_raciales`; el nacido del Infierno sobre una base con DG).
 */
export function quitaDgRaciales(anterior: RazaDelNep | null | undefined, combinada: RazaDelNep | null | undefined): boolean {
    return dgsRaciales(combinada) < dgsRaciales(anterior);
}

/**
 * El NEP tras la mutación: el de ahora con el ajuste y los DG raciales que cuentan de la combinada en lugar de los de su
 * raza de antes. Los PX no cambian: si baja (el nacido del Infierno pierde el ajuste de la base), puede subir antes
 * (*Especies salvajes*, pág. 145). `nivelesClaseDespues`, sus niveles de clase con la combinada si cambian (la conversión
 * en muerto viviente, `nepTrasLaConversion`); si no, los mismos.
 */
export function nepTrasLaMutacion(nepAntes: number, anterior: RazaDelNep, combinada: RazaDelNep, nivelesClase: number,
    nivelesClaseDespues = nivelesClase): number {
    return Math.max(0, toInt(nepAntes) - toInt(anterior?.Ajuste_nivel) + toInt(combinada?.Ajuste_nivel)
        - dgsRacialesQueCuentan(dgsRaciales(anterior), nivelesClase) + dgsRacialesQueCuentan(dgsRaciales(combinada), nivelesClaseDespues));
}

/**
 * Lo que pierde en su hueco (*Races of the Dragon*, pág. 10), de los datos de las dos razas: las dotes adicionales de la
 * de antes que la combinada ya no da (la del humano) y sus puntos de habilidad extra (los del primer nivel y uno por cada
 * nivel siguiente: un humano guerrero 5 pierde 4 + 4). Los elige el jugador.
 */
export function loQuePierdeEnSuHueco(anterior: Raza | null | undefined, combinada: Raza | null | undefined, nivelesClase: number)
    : { dotes: number; puntos: number; } {
    const menos = (campo: 'Dotes_adicionales' | 'Puntos_habilidad_extra_primer_nivel' | 'Puntos_habilidad_extra_por_nivel') =>
        Math.max(0, toNumber(anterior?.[campo]) - toNumber(combinada?.[campo]));
    const niveles = Math.max(0, toInt(nivelesClase));
    return {
        dotes: menos('Dotes_adicionales'),
        puntos: niveles < 1 ? 0 : menos('Puntos_habilidad_extra_primer_nivel') + menos('Puntos_habilidad_extra_por_nivel') * (niveles - 1),
    };
}

/** Los rangos que se quitan de una habilidad para pagar sus puntos perdidos: cada uno cuesta lo que costó (1 o 2). */
export interface RangosQuitados {
    rangos: number;
    coste: number;
}

/** Los puntos que devuelven los rangos quitados. */
export function puntosDevueltos(quitados: ReadonlyArray<RangosQuitados>): number {
    return quitados.reduce((suma, q) => suma + Math.max(0, toInt(q.rangos)) * Math.max(1, toInt(q.coste)), 0);
}

/**
 * Si los rangos quitados pagan los puntos que pierde: al menos esos y sin un rango de más (solo se pasa si el último era
 * transclásea, de 2 puntos, y quedaba 1).
 */
export function pagaLosPuntos(quitados: ReadonlyArray<RangosQuitados>, puntos: number): boolean {
    const devueltos = puntosDevueltos(quitados);
    return devueltos >= Math.max(0, toInt(puntos)) && devueltos - Math.max(0, toInt(puntos)) < 2;
}

/** Lo de `personaje` que no cambia al adquirir una raza mutada: lo de la subida, salvo la raza, su base y el tipo. */
export const SE_CONSERVAN_EN_MUTACION: ReadonlySet<string> = new Set(
    [...SE_CONSERVAN_PERSONAJE].filter((k) => k !== 'idRaza' && k !== 'idRazaBase' && k !== 'idTipoCriatura'));

/**
 * Las colecciones que salen de la raza, de las que se quita lo que quita el motor al cambiarla: sus rasgos, sus
 * sortílegas, sus subtipos, sus RD, RC y RE y sus competencias (la prole las pierde). Las dotes, aparte (abajo).
 */
export const LISTAS_DE_LA_RAZA: ReadonlySet<string> = new Set([
    'raciales', 'sortilegas', 'subtipos', 'rd', 'rc', 're',
    'competencia_arma', 'competencia_armadura', 'competencia_grupo_arma', 'competencia_grupo_armadura',
]);

export interface EntradaFichaMutacion {
    /** La `entrada` de la sesión de juego abierta. */
    entrada: PersonajeCreateRequestDto;
    /** El cuerpo del alta que arma el motor antes de la mutación y después (con lo que pierde en su hueco). */
    antes: PersonajeCreateRequestDto;
    despues: PersonajeCreateRequestDto;
    /** La raza mutada y la de antes, que pasa a ser su base. */
    idRaza: number;
    idRazaBase: number;
    /** Los PG con la Constitución nueva en todos sus DG. */
    puntosGolpe: number;
}

/**
 * La ficha que se manda (`POST /personajes/{id}/raza-mutada`): la `entrada` con lo que cambia el motor (sus
 * características con los ajustes nuevos, sus modificadores, sus rangos y sus rangos varios, sus idiomas, el tipo), la
 * raza mutada en `idRaza` y la de antes en `idRazaBase`; de lo que sale de la raza, también lo que quita
 * (`LISTAS_DE_LA_RAZA`); y sin las dotes que se van (las de su raza de antes, la del humano, las que dejan de cumplirse,
 * con su decisión `requisitos_dote` si la tenía), con las que entran en su hueco. Los niveles, como en la `entrada`.
 */
export function fichaDeLaMutacion(datos: EntradaFichaMutacion): PersonajeCreateRequestDto {
    const ficha = fichaConLoDelMotor({
        entrada: datos.entrada, antes: datos.antes, despues: datos.despues, puntosGolpe: datos.puntosGolpe,
        seConservan: SE_CONSERVAN_EN_MUTACION, quitarEn: LISTAS_DE_LA_RAZA,
    });
    ficha.personaje.idRaza = toInt(datos.idRaza);
    ficha.personaje.idRazaBase = toInt(datos.idRazaBase);
    const col: any = ficha.colecciones;
    const dotes: any[] = col.dotes = [...(col.dotes ?? [])];
    const { quitados } = diferencia(datos.antes.colecciones?.dotes ?? [], datos.despues.colecciones?.dotes ?? []);
    quitados.forEach((d) => sacarDoteDeLaFicha(dotes, toInt(d['idDote']), toInt(d['idExtra']), `${d['origen'] ?? ''}`.trim() || null));
    if (ficha.decisionesHomebrew)
        ficha.decisionesHomebrew = sinDecisionesDeDotesQueNoTiene(ficha.decisionesHomebrew, dotes);
    return ficha;
}

// --- El resumen ---------------------------------------------------------------------------------------------------------

/**
 * Las filas propias de la conversión en muerto viviente: el nivel que pierde (*Libris Mortis*, pág. 34: «como si hubiese
 * muerto y le hubieran revivido»), lo que quita, y el 1.er nivel de su clase de monstruo, que lo reemplaza.
 */
function filasDeLaConversion(c: ResumenDeLaConversion): CambioPlantilla[] {
    const filas: CambioPlantilla[] = [];
    if (c.perdida) {
        const { clase, nivelClase } = c.perdida;
        filas.push({
            que: 'Nivel perdido', antes: `${clase} ${nivelClase}`,
            ahora: nivelClase > 1 ? `${clase} ${nivelClase - 1}` : 'No le quedan niveles de clase',
            porque: 'Pierde el último nivel de clase, como si hubiese muerto y le hubieran revivido (Libris Mortis, pág. 34)',
        });
        c.loQuePierde.forEach((f) => filas.push({ ...f, porque: 'Lo daba el nivel que pierde' }));
    }
    filas.push({
        que: 'Nivel ganado', antes: '—', ahora: `${c.claseDeMonstruo} 1`,
        porque: c.perdida ? 'El 1.er nivel de su clase de muerto viviente reemplaza al perdido' : 'El 1.er nivel de su clase de muerto viviente',
    });
    return filas;
}

/** Los PX de la conversión: la mitad de su nivel tras perder el nivel, o los suyos si ya tenía menos o no pierde ninguno. */
function filaDeLosPxDeLaConversion(c: ResumenDeLaConversion): CambioPlantilla {
    return {
        que: 'PX', antes: formatoPx(c.pxAntes), ahora: formatoPx(c.pxDespues),
        porque: !c.perdida ? 'No cambian: no tiene niveles de clase que perder'
            : c.pxAntes === c.pxDespues ? 'No cambian: ya tenía menos de la mitad de su nivel tras perderlo'
                : 'La mitad entre el mínimo de su nivel tras perderlo y el del siguiente, como al revivir (Manual del jugador, pág. 171)',
    };
}

export interface EntradaCambiosMutacion {
    antes: Personaje;
    despues: Personaje;
    /** Su raza de antes (la base) y la combinada. */
    anterior: Raza;
    combinada: Raza;
    experiencia: ExperienciaPersonaje | null;
    nepDespues: number;
    pg: PgSubida | null;
    /** Lo que pierde en su hueco: la dote del humano, sus rangos y las dotes cambiadas por otra. */
    dotesPerdidas: string[];
    rangosQuitados: Array<{ nombre: string; rangos: number; }>;
    dotesCambiadas: Array<{ antes: string; ahora: string | null; }>;
    /** Las clases que dejan de cumplir lo que piden: quedan ex. */
    exClases: Array<{ nombre: string; razones: string[]; }>;
    /** Lo que exige el alineamiento de la raza nueva si ya no es el suyo: se propone un «Cambio de alineamiento». */
    alineamientoExigido: string | null;
    /** Si es la conversión en muerto viviente (la raza lleva una clase de monstruo), lo suyo; si no, nada. */
    conversion?: ResumenDeLaConversion | null;
}

/** Lo que enseña el resumen de la conversión en muerto viviente, además de lo de la raza mutada. */
export interface ResumenDeLaConversion {
    /** El nivel que pierde (su clase y su nivel en ella), o `null` sin niveles de clase. */
    perdida: { clase: string; nivelClase: number; } | null;
    /** Lo que quita ese nivel (`filasDelNivelPerdido`). */
    loQuePierde: Array<{ que: string; antes: string; ahora: string; }>;
    claseDeMonstruo: string;
    pxAntes: number;
    pxDespues: number;
    /** Las dotes que dejan de cumplir un prerrequisito: las conserva sin poder usarlas. */
    sinPoderUsar: string[];
    /** Las aptitudes que sustituye la raza en sus clases. */
    sustituidas: Array<{ antes: string; ahora: string; }>;
}

function nombres(lista: ReadonlyArray<{ Nombre?: string | null; } | null | undefined> | null | undefined): string[] {
    return (lista ?? []).map((x) => `${x?.Nombre ?? ''}`.trim()).filter((n) => n.length > 0);
}

/**
 * «Lo que cambia» al adquirir la raza mutada, antes de guardar: la raza (y su base), el NEP y los PX (que no cambian; si
 * baja el NEP, puede subir antes), el tipo, las características, los PG, los rasgos, los idiomas y las dotes que gana o
 * pierde, los rangos que paga, la edad con la tabla de la mutada y, en ámbar, el cambio de alineamiento que se propone y
 * las clases que quedan ex.
 */
export function cambiosDeLaMutacion(e: EntradaCambiosMutacion): CambioPlantilla[] {
    const filas: CambioPlantilla[] = [];
    const nombre = `${e.combinada?.Nombre ?? ''}`.trim() || 'la raza mutada';
    const base = `${e.anterior?.Nombre ?? ''}`.trim() || 'su raza';
    const conversion = e.conversion ?? null;
    const porLaRaza = conversion ? `Se convierte en ${nombre.toLowerCase()}` : `Raza mutada ${nombre}`;
    filas.push({ que: 'Raza', antes: base, ahora: nombre, porque: `${base} pasa a ser su raza base` });
    if (conversion)
        filas.push(...filasDeLaConversion(conversion));
    const nivel = toInt(e.experiencia?.nivel);
    const ajusteAntes = toInt(e.anterior?.Ajuste_nivel);
    const ajusteDespues = toInt(e.combinada?.Ajuste_nivel);
    filas.push({
        que: 'NEP', antes: `${nivel}`, ahora: `${e.nepDespues}`,
        porque: e.nepDespues === nivel ? 'No cambia'
            : conversion ? `${conversion.perdida ? 'Un nivel menos y uno más' : 'Un nivel más'}${ajusteAntes !== ajusteDespues ? `; ajuste de nivel ${ajusteAntes} → ${ajusteDespues}` : ''}`
                : `Ajuste de nivel ${ajusteAntes} → ${ajusteDespues}`,
    });
    const px = conversion ? filaDeLosPxDeLaConversion(conversion) : filaDeLosPx(e.experiencia, e.nepDespues);
    if (px)
        filas.push(px);
    filas.push(...filasDelTipo(e.antes, e.despues, porLaRaza));
    filas.push(...filasDeCaracteristicas(e.antes, e.despues, porLaRaza));
    if (e.pg && e.pg.total !== toInt(e.antes?.Vida))
        filas.push({
            que: 'Puntos de golpe', antes: `${toInt(e.antes?.Vida)}`, ahora: `${e.pg.total}`,
            porque: conversion
                ? `Sin Constitución en ningún DG, sin el DG del nivel que pierde y con el de ${conversion.claseDeMonstruo.toLowerCase()}${e.pg.exacto ? '' : ' (aproximado: faltan tiradas de antes)'}`
                : `La Constitución nueva en todos sus DG${e.pg.exacto ? '' : ' (aproximado: faltan tiradas de antes)'}`,
        });
    filas.push(...filasDeRasgosRaciales(e.antes, e.despues, porLaRaza));
    const idiomas = nombresNuevos(nombres(e.antes?.Idiomas), nombres(e.despues?.Idiomas));
    if (idiomas.length)
        filas.push({ que: 'Idiomas', antes: '—', ahora: idiomas.join(', '), porque: porLaRaza });
    if (e.dotesPerdidas.length)
        filas.push({ que: 'Dotes', antes: e.dotesPerdidas.join(', '), ahora: '—', porque: `Pierde la dote adicional de ${base.toLowerCase()} (la elige el jugador)` });
    e.dotesCambiadas.forEach((c) => filas.push({
        que: 'Dote', antes: c.antes, ahora: c.ahora ?? '—',
        porque: c.ahora ? 'Deja de cumplir sus prerrequisitos: otra en su hueco' : 'Deja de cumplir sus prerrequisitos y no hay otra que cumpla',
    }));
    const dotesNuevas = nombresNuevos(nombresDeDotes(e.antes), nombresDeDotes(e.despues))
        .filter((n) => !e.dotesCambiadas.some((c) => normalizarTexto(c.ahora ?? '') === normalizarTexto(n)));
    if (dotesNuevas.length)
        filas.push({ que: 'Dotes', antes: '—', ahora: dotesNuevas.join(', '), porque: porLaRaza });
    if (e.rangosQuitados.length)
        filas.push({
            que: 'Rangos', antes: e.rangosQuitados.map((r) => `${r.nombre} −${r.rangos}`).join(', '), ahora: '—',
            porque: `Pierde los puntos de habilidad extra de ${base.toLowerCase()}, cada rango por lo que costó`,
        });
    const edad = toInt(e.antes?.Edad);
    const etapaA = etapaEdad(edad, e.anterior);
    const etapaD = etapaEdad(edad, e.combinada);
    if (etapaA && etapaD && etapaA.id !== etapaD.id)
        filas.push({
            que: 'Categoría de edad', antes: etapaA.nombre, ahora: etapaD.nombre,
            porque: `Con las edades de ${nombre}: ${etapaD.id === 'adulto' ? 'pierde los efectos de la edad que tenía' : 'cambian los efectos de la edad'}`,
        });
    filas.push(...filasSinPoderUsar(conversion?.sinPoderUsar ?? []));
    (conversion?.sustituidas ?? []).forEach((a) => filas.push({
        que: 'Aptitud', antes: a.antes, ahora: a.ahora, porque: `La sustituye ${nombre.toLowerCase()} en todas sus clases (Libris Mortis, pág. 35)`,
    }));
    if (e.alineamientoExigido)
        filas.push({
            que: 'Alineamiento', antes: `${e.antes?.Alineamiento ?? ''}`, ahora: `${nombre} exige ${e.alineamientoExigido.toLowerCase()}`, aviso: true,
            porque: 'No se fuerza: se propone apuntar un «Cambio de alineamiento» (lo apunta el máster)',
        });
    e.exClases.forEach((c) => filas.push({
        que: nombreExClase(c.nombre), antes: 'Cumple lo que pide', ahora: c.razones.join(' · ') || 'Ya no lo cumple', aviso: true,
        porque: 'Conserva sus niveles, pero pierde sus aptitudes y no sube en ella mientras no lo cumpla (El arcano completo, pág. 17)',
    }));
    return filas;
}
