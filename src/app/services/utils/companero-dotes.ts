import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { CompaneroMejora, CompaneroMonstruoDetalle, MonstruoHabilidad } from 'src/app/interfaces/monstruo';
import { armasNaturalesDelCompanero, dadosGolpeCompanero } from 'src/app/services/utils/companero-reglas';
import { caracteristicaPorId, modificadorCaracteristica, sinPuntuacion } from 'src/app/services/utils/caracteristicas';
import { daIncrementoPorNivelDePersonaje } from 'src/app/services/utils/clase-niveles';
import { DoteEvaluacionContexto, dotesConCuentaComo } from 'src/app/services/utils/dote-elegibilidad';
import { HabilidadParaPrerrequisitos } from 'src/app/services/utils/prerrequisitos-evaluacion';
import { normalizarTexto, primerEntero, sinRepetidos, toInt } from 'src/app/services/utils/normalizacion';

/*
 * Las dotes y las mejoras de característica que elige el compañero animal con sus DG adicionales (contrato:
 * `docs/publica/endpoints/personajes.md`, «Las dotes y las mejoras que elige el compañero»; reglas: el dictamen del máster
 * de Rol del 2026-11-21, en el roadmap, punto 1; MJ págs. 36 y 87; MM págs. 290, 291 y 314).
 */

/** Las dotes que dan unos DG: 1 + ⌊DG / 3⌋ (MM, pág. 290, tabla 4-1), ninguna sin DG. */
export function dotesDeDgs(dg: number): number {
    const dgs = Math.max(0, toInt(dg));
    return dgs < 1 ? 0 : 1 + Math.floor(dgs / 3);
}

/** El DG en que se gana la dote número `numero`: la 1.ª en el 1.º; las demás, cada 3 (la 3.ª, en el 6.º). */
export function dgDeLaDote(numero: number): number {
    return numero <= 1 ? 1 : 3 * (numero - 1);
}

/** Los DG de su monstruo (sin los adicionales). */
export function dgDelMonstruoDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number {
    return Math.max(0, primerEntero(companero?.Dados_golpe?.Cantidad) ?? 0);
}

/** Su Inteligencia tal cual (`null` o `undefined`, el «—»). La usan sus dotes y sus trucos (`companero-trucos.ts`). */
export function inteligenciaDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number | null | undefined {
    return (companero?.Caracteristicas as Record<string, number | null> | undefined)?.['Inteligencia'];
}

/** Sin Inteligencia (el «—» de una sabandija descerebrada: `sinPuntuacion`). */
export function companeroSinInteligencia(companero: CompaneroMonstruoDetalle | null | undefined): boolean {
    return sinPuntuacion(inteligenciaDelCompanero(companero));
}

/** Su nombre, o `porDefecto` si no lo tiene, para los textos de sus huecos y sus selectores. */
export function nombreDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, porDefecto = 'compañero'): string {
    return `${companero?.Nombre ?? ''}`.trim() || porDefecto;
}

/**
 * Los DG de `pedidos` que no están entre `yaEstan` (uno por cada uno: dos iguales piden dos). Lo usan los huecos de sus
 * dotes y sus mejoras y las dotes pendientes que se registran (`NuevoPersonajeService`).
 */
export function dgsQueFaltan(pedidos: readonly number[], yaEstan: readonly number[]): number[] {
    const quedan = [...yaEstan];
    return pedidos.filter((dg) => {
        const i = quedan.indexOf(dg);
        if (i < 0)
            return true;
        quedan.splice(i, 1);
        return false;
    });
}

/** El DG en que la eligió (`Contexto.Dg`); 0 si no es una elegida (las de su monstruo y su tabla). */
export function dgDeLaDoteDelCompanero(item: DoteContextual | null | undefined): number {
    return Math.max(0, toInt((item?.Contexto as { Dg?: number; } | undefined)?.Dg));
}

/** Las que eligió el jugador con sus DG (las que llevan `Dg`). */
export function dotesElegidasDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): DoteContextual[] {
    return (companero?.Dotes ?? []).filter((item) => dgDeLaDoteDelCompanero(item) > 0);
}

function claveDote(item: DoteContextual | null | undefined): string {
    return `${toInt(item?.Dote?.Id)}|${Math.max(0, toInt(item?.Contexto?.Id_extra))}`;
}

/**
 * Las de su monstruo que cuentan para las que le tocan: las que no son adicionales (la «(B)» de su bloque), sin repetir.
 * Con `Dotes_monstruo` (las que pone la creación o la carga de las sesiones); sin él, no se sabe cuáles son.
 */
export function dotesQueCuentanDelMonstruo(companero: CompaneroMonstruoDetalle | null | undefined): DoteContextual[] {
    return sinRepetidos((companero?.Dotes_monstruo ?? [])
        .filter((item) => toInt(item?.Dote?.Id) > 0 && item?.Contexto?.Adicional !== true), claveDote);
}

/** Si la dote (con su extra) ya es de su monstruo, las adicionales también. */
export function esDoteDelMonstruoDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, item: DoteContextual): boolean {
    const clave = claveDote(item);
    return (companero?.Dotes_monstruo ?? []).some((suya) => claveDote(suya) === clave);
}

/** Cuántas le tocan: 1 + ⌊DG totales / 3⌋; sin Inteligencia, solo las de los DG de su monstruo (MM, pág. 290). */
export function dotesQueLeTocanAlCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number {
    const dg = companeroSinInteligencia(companero) ? dgDelMonstruoDelCompanero(companero) : dadosGolpeCompanero(companero);
    return dotesDeDgs(dg);
}

/**
 * Los DG de las dotes que le quedan por elegir (uno por dote): la número n de las que le tocan, contando primero las de su
 * monstruo, la gana en `dgDeLaDote(n)`; las que ya eligió (por su `Dg`) no se piden. Sin `Dotes_monstruo`, ninguno.
 */
export function huecosDeDotesDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number[] {
    if (!companero?.Dotes_monstruo)
        return [];
    const cuentan = dotesQueCuentanDelMonstruo(companero).length;
    const tocan = dotesQueLeTocanAlCompanero(companero);
    const pedidos: number[] = [];
    for (let numero = cuentan + 1; numero <= tocan; numero++)
        pedidos.push(dgDeLaDote(numero));
    return dgsQueFaltan(pedidos, dotesElegidasDelCompanero(companero).map(dgDeLaDoteDelCompanero));
}

/**
 * Los DG de sus mejoras: cada múltiplo de 4 de sus DG totales al que llega por sus DG adicionales (MM, pág. 290; como el
 * nivel de personaje, `daIncrementoPorNivelDePersonaje`).
 */
export function dgsDeLasMejorasDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number[] {
    const desde = dgDelMonstruoDelCompanero(companero);
    const hasta = dadosGolpeCompanero(companero);
    const dgs: number[] = [];
    for (let dg = desde + 1; dg <= hasta; dg++)
        if (daIncrementoPorNivelDePersonaje(dg))
            dgs.push(dg);
    return dgs;
}

/** Los DG de las mejoras que le quedan por elegir (las que ya tiene, por su `Dg`, no se piden). */
export function huecosDeMejorasDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): number[] {
    return dgsQueFaltan(dgsDeLasMejorasDelCompanero(companero), (companero?.Mejoras ?? []).map((mejora) => toInt(mejora?.Dg)));
}

/** El id de una característica (del 1 al 6, en el orden de `CARACTERISTICAS`). */
export function idDeLaCaracteristica(caracteristica: Caracteristica): number {
    return CARACTERISTICAS.indexOf(caracteristica) + 1;
}

/** Suma `delta` a una característica del compañero, con su modificador. Sin puntuación (el «—»), no la toca. */
function sumarALaCaracteristica(companero: CompaneroMonstruoDetalle, caracteristica: Caracteristica, delta: number): void {
    const caracteristicas = companero.Caracteristicas as Record<string, number | null>;
    if (!caracteristicas || caracteristicas[caracteristica] === null || caracteristicas[caracteristica] === undefined)
        return;
    const valor = toInt(caracteristicas[caracteristica]) + delta;
    caracteristicas[caracteristica] = valor;
    caracteristicas[`${caracteristica}_modificador`] = modificadorCaracteristica(valor);
}

/** Le pone una mejora (+1 a esa característica, en ese DG). */
export function aplicarMejoraAlCompanero(companero: CompaneroMonstruoDetalle, dg: number, caracteristica: Caracteristica): void {
    const mejora: CompaneroMejora = { Dg: toInt(dg), Id_caracteristica: idDeLaCaracteristica(caracteristica), Caracteristica: caracteristica };
    companero.Mejoras = [...(companero.Mejoras ?? []), mejora];
    sumarALaCaracteristica(companero, caracteristica, 1);
}

/**
 * Lo que pierde con los DG que pierde (al perder un nivel o quedar inactivo): las dotes elegidas y las mejoras con `Dg`
 * por encima de sus DG totales de ahora (contrato, «Al perder un nivel…»); cada mejora quitada, con su +1. Devuelve si
 * quitó algo.
 */
export function quitarLoDeLosDgQueNoTieneElCompanero(companero: CompaneroMonstruoDetalle | null | undefined): boolean {
    if (!companero)
        return false;
    const dgTotales = dadosGolpeCompanero(companero);
    const antesDotes = (companero.Dotes ?? []).length;
    companero.Dotes = (companero.Dotes ?? []).filter((item) => dgDeLaDoteDelCompanero(item) <= dgTotales);
    const quedan: CompaneroMejora[] = [];
    (companero.Mejoras ?? []).forEach((mejora) => {
        if (toInt(mejora?.Dg) <= dgTotales) {
            quedan.push(mejora);
            return;
        }
        const caracteristica = caracteristicaPorId(toInt(mejora?.Id_caracteristica));
        if (caracteristica)
            sumarALaCaracteristica(companero, caracteristica, -1);
    });
    const quitoMejoras = quedan.length !== (companero.Mejoras ?? []).length;
    if (companero.Mejoras)
        companero.Mejoras = quedan;
    return quitoMejoras || antesDotes !== companero.Dotes.length;
}

/**
 * El ataque base de su monstruo con `dg` DG, en su misma progresión: la buena (= DG), la media (¾) o la mala (½), la que
 * da su ataque base con sus DG (MM, pág. 290).
 */
export function ataqueBaseDelCompaneroConDg(companero: CompaneroMonstruoDetalle | null | undefined, dg: number): number {
    const dgMonstruo = dgDelMonstruoDelCompanero(companero);
    const base = toInt(companero?.Ataque?.Ataque_base);
    const dgs = Math.max(0, toInt(dg));
    if (dgMonstruo > 0 && base >= dgMonstruo)
        return dgs;
    if (dgMonstruo > 0 && base >= Math.floor(dgMonstruo * 3 / 4))
        return Math.floor(dgs * 3 / 4);
    return Math.floor(dgs / 2);
}

/** La salvación base de su monstruo con `dg` DG: la buena (2 + ½ DG) si la suya lo es, si no la mala (⅓ DG). */
function salvacionBaseConDg(total: number, modificador: number, dgMonstruo: number, dg: number): number {
    const base = toInt(total) - toInt(modificador);
    const buena = dgMonstruo > 0 && base >= 2 + Math.floor(dgMonstruo / 2);
    return buena ? 2 + Math.floor(dg / 2) : Math.floor(dg / 3);
}

/** Sus seis puntuaciones de ahora (sin puntuación, 0): las de sus prerrequisitos y las del selector de sus mejoras. */
export function puntuacionesDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): Record<Caracteristica, number> {
    const c = (companero?.Caracteristicas ?? {}) as Record<string, number | null>;
    const valor = (clave: Caracteristica) => toInt(c[clave]);
    return {
        Fuerza: valor('Fuerza'), Destreza: valor('Destreza'), Constitucion: valor('Constitucion'),
        Inteligencia: valor('Inteligencia'), Sabiduria: valor('Sabiduria'), Carisma: valor('Carisma'),
    };
}

function habilidadesDelCompanero(habilidades: readonly MonstruoHabilidad[] | null | undefined): HabilidadParaPrerrequisitos[] {
    return (habilidades ?? [])
        .filter((h) => toInt(h?.Id_habilidad) > 0)
        .map((h) => ({
            id: toInt(h.Id_habilidad),
            nombre: `${h?.Habilidad ?? ''}`.trim(),
            rangos: toInt(h?.Rangos),
            idExtra: toInt(h?.Id_extra) > 0 ? toInt(h.Id_extra) : null,
            extra: `${h?.Extra ?? ''}`.trim(),
        }));
}

/** Todas sus dotes (las de su monstruo, su tabla y las elegidas antes de `dg`), en la forma de los prerrequisitos. */
function dotesDelCompaneroHasta(companero: CompaneroMonstruoDetalle, dg: number): DoteEvaluacionContexto['dotes'] {
    const todas = [...(companero.Dotes_monstruo ?? []), ...(companero.Dotes ?? [])]
        .filter((item) => `${item?.Dote?.Nombre ?? ''}`.trim().length > 0)
        .filter((item) => {
            const suDg = dgDeLaDoteDelCompanero(item);
            return suDg < 1 || suDg < dg;
        });
    return sinRepetidos(todas, claveDote)
        .map((item) => ({
            id: toInt(item.Dote.Id) > 0 ? toInt(item.Dote.Id) : null,
            nombre: `${item.Dote.Nombre}`.trim(),
            idExtra: Math.max(0, toInt(item?.Contexto?.Id_extra)),
            extra: `${item?.Contexto?.Extra ?? ''}`.trim(),
        }));
}

/**
 * Los prerrequisitos de una dote del compañero se juzgan como criatura, con lo que tenía en el DG en que la gana (MJ pág.
 * 87; contrato, «Las elegidas»): sus características (con el ajuste de la tabla y sus mejoras), el ataque base y las
 * salvaciones base de ese DG, sus DG (también como nivel de personaje), sus rangos, sus dotes de antes, su tamaño, sus
 * armas naturales y su tipo. Sin clases, conjuros, idiomas, región ni deidad.
 */
export function contextoDeDotesDelCompanero(companero: CompaneroMonstruoDetalle, dg: number,
    doteDelCatalogo: (id: number) => Dote | null | undefined): DoteEvaluacionContexto {
    const dgs = Math.max(1, toInt(dg));
    const dgMonstruo = dgDelMonstruoDelCompanero(companero);
    const c = (companero?.Caracteristicas ?? {}) as Record<string, number | null>;
    const tipoId = toInt(companero?.Tipo?.Id);
    const tipoNombre = `${companero?.Tipo?.Nombre ?? ''}`.trim();
    const alineamiento = `${companero?.Alineamiento?.Basico?.Nombre ?? ''}`.trim();
    return {
        identidad: {
            razas: [],
            tiposCriatura: tipoId > 0 || normalizarTexto(tipoNombre).length > 0 ? [{ id: tipoId > 0 ? tipoId : null, nombre: tipoNombre }] : [],
            subtipos: [],
        },
        caracteristicas: puntuacionesDelCompanero(companero),
        ataqueBase: ataqueBaseDelCompaneroConDg(companero, dgs),
        nivelesClase: [],
        dotes: dotesConCuentaComo(dotesDelCompaneroHasta(companero, dgs), doteDelCatalogo),
        claseas: [],
        raciales: [],
        plantillas: [],
        dominios: [],
        idiomas: [],
        habilidades: habilidadesDelCompanero(companero?.Habilidades),
        conjuros: [],
        conjurosAccesibles: [],
        competenciasArmas: [],
        competenciasArmaduras: [],
        competenciasGrupoArmas: [],
        competenciasGrupoArmaduras: [],
        lanzador: { arcano: 0, divino: 0, psionico: 0 },
        nivelesConjuroMaximos: { arcano: 0, divino: 0 },
        escuelaEspecialista: { id: null, nombre: '', nivelArcano: 0 },
        dgTotal: dgs,
        nivelTotal: dgs,
        tamanoId: toInt(companero?.Tamano?.Id) > 0 ? toInt(companero.Tamano.Id) : null,
        tipoCriaturaId: tipoId > 0 ? tipoId : null,
        tipoCriaturaNombre: tipoNombre,
        tiposDote: [],
        region: { id: null, nombre: '' },
        salvacionesBase: {
            fortaleza: salvacionBaseConDg(toInt(companero?.Salvaciones?.Fortaleza), toInt(c['Constitucion_modificador']), dgMonstruo, dgs),
            reflejos: salvacionBaseConDg(toInt(companero?.Salvaciones?.Reflejos), toInt(c['Destreza_modificador']), dgMonstruo, dgs),
            voluntad: salvacionBaseConDg(toInt(companero?.Salvaciones?.Voluntad), toInt(c['Sabiduria_modificador']), dgMonstruo, dgs),
        },
        alineamiento,
        puedeSeleccionarCompanero: false,
        puedeSeleccionarFamiliar: false,
        catalogoRegiones: [],
        armasNaturales: armasNaturalesDelCompanero(companero),
        deidad: null,
    };
}

/** El texto del hueco de una dote del compañero («Compañero animal (Gruk): la de su 6.º DG»). */
export function origenDeLaDoteDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, dg: number): string {
    return `Compañero animal (${nombreDelCompanero(companero)}): la de su ${toInt(dg)}.º DG`;
}

/** El texto del hueco de una mejora del compañero («Compañero animal (Gruk): su 4.º DG»). */
export function origenDeLaMejoraDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, dg: number): string {
    return `Compañero animal (${nombreDelCompanero(companero)}): su ${toInt(dg)}.º DG`;
}

/** El título del selector de sus mejoras («Mejoras de característica de Gruk»), en la creación y en las sesiones. */
export function tituloDeLasMejorasDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): string {
    return `Mejoras de característica de ${nombreDelCompanero(companero, 'el compañero animal')}`;
}
