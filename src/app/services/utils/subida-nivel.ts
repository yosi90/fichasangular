import { ClaseIntercambioConjuros } from 'src/app/interfaces/clase';
import { PersonajeCreateNivelDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { modificadorCaracteristica } from './caracteristicas';
import { toInt } from './normalizacion';

/*
 * La subida de nivel (roadmap de sesiones, fase 4; guía `docs/publica/SESIONES_FRONT.md`, «La subida de nivel»): la web
 * parte de la `entrada` de la sesión abierta (el cuerpo del alta leído de las tablas), hidrata el motor de la creación,
 * aplica un nivel y manda la ficha entera a `POST /personajes/{id}/niveles`. La ficha que se manda es la `entrada` con lo
 * que ha cambiado el motor al subir (la diferencia entre su cuerpo del alta antes y después del nivel): así no se pierde
 * nada de lo guardado que el motor no sabe leer de la ficha (orígenes, extras, competencias directas, la mascota…).
 */

/** El borrador de una subida, por cuenta y personaje; no pisa el de la creación (`fichas35.nuevoPersonaje.draft.v1.`). */
export const PREFIJO_BORRADOR_SUBIDA = 'fichas35.subidaNivel.draft.v1.';

export function claveBorradorSubida(uid: string, idPersonaje: number): string {
    return `${PREFIJO_BORRADOR_SUBIDA}${`${uid ?? ''}`.trim()}.${toInt(idPersonaje)}`;
}

/** Si en ese nivel de clase toca el intercambio de un conjuro conocido (`Conjuros.Intercambio` de la clase). */
export function tocaIntercambioConjuros(intercambio: ClaseIntercambioConjuros | null | undefined, nivelClase: number): boolean {
    const desde = toInt(intercambio?.Desde);
    const cada = Math.max(1, toInt(intercambio?.Cada, 1));
    const nivel = toInt(nivelClase);
    return desde > 0 && nivel >= desde && (nivel - desde) % cada === 0;
}

export interface EntradaPgSubida {
    /** Los PG de la ficha antes de subir. */
    pgAntes: number;
    /** El modificador de Constitución antes y después de subir (un incremento de Con lo cambia). */
    modConAntes: number;
    modConDespues: number;
    /**
     * Lo que salió en cada DG de antes que se sabe (los niveles guardados con su tirada), y cuántos DG de antes no tienen
     * tirada (los raciales, los de plantilla y los niveles de las fichas de antes del historial).
     */
    tiradasAnteriores: number[];
    dgsSinTirada: number;
    /** La tirada del DG nuevo; `null` si el nivel no da DG. */
    tirada: number | null;
}

export interface PgSubida {
    total: number;
    /** Lo que da el DG nuevo (tirada + Con, al menos 1). */
    delNivel: number;
    /** Lo que suman o restan los DG de antes por el cambio de Constitución (MJ p. 58). */
    retroactivo: number;
    /** `false` si algún DG de antes no tiene su tirada y el retroactivo se ha calculado sin ella (sin el mínimo de 1). */
    exacto: boolean;
}

/**
 * Los PG tras subir (MJ p. 23 y 58): el DG nuevo, lo que salió + el modificador de Constitución, al menos 1; si el
 * modificador ha cambiado, cada DG de antes suma la diferencia, con su tirada guardada para no bajar de 1 por DG; sin
 * ella, la diferencia entera (y se avisa: no es exacto si algún dado se quedó en 1).
 */
export function puntosGolpeTrasSubida(entrada: EntradaPgSubida): PgSubida {
    const modAntes = toInt(entrada.modConAntes);
    const modDespues = toInt(entrada.modConDespues);
    const delNivel = entrada.tirada === null ? 0 : Math.max(1, toInt(entrada.tirada) + modDespues);
    let retroactivo = 0;
    let exacto = true;
    if (modDespues !== modAntes) {
        (entrada.tiradasAnteriores ?? []).forEach((tirada) => {
            retroactivo += Math.max(1, toInt(tirada) + modDespues) - Math.max(1, toInt(tirada) + modAntes);
        });
        const sinTirada = Math.max(0, toInt(entrada.dgsSinTirada));
        retroactivo += sinTirada * (modDespues - modAntes);
        exacto = sinTirada < 1;
    }
    return { total: Math.max(1, toInt(entrada.pgAntes) + retroactivo + delNivel), delNivel, retroactivo, exacto };
}

/**
 * Los PG de una ficha guardada (`entrada`) con el modificador de Constitución `modConDespues` y, si da DG, la tirada de
 * un DG nuevo: lo que usan la subida (un nivel más) y la corrección (`tirada` `null`: solo el retroactivo de la Con). Los
 * DG de antes son los de su nivel de personaje (`nivelPersonaje`) o, si son más, sus niveles guardados.
 */
export function pgTrasCambioDeCon(entrada: PersonajeCreateRequestDto, nivelPersonaje: number, modConDespues: number,
    tirada: number | null): PgSubida {
    const tiradasGuardadas = (entrada.niveles ?? []).map((n) => n?.pg?.tirada).filter((t): t is number => toInt(t) > 0);
    const dgsAntes = Math.max(toInt(nivelPersonaje), (entrada.niveles ?? []).length);
    return puntosGolpeTrasSubida({
        pgAntes: toInt(entrada.personaje.puntosGolpe),
        modConAntes: modConstitucionDeEntrada(entrada),
        modConDespues: toInt(modConDespues),
        tiradasAnteriores: tiradasGuardadas,
        dgsSinTirada: Math.max(0, dgsAntes - tiradasGuardadas.length),
        tirada,
    });
}

/** El modificador de Constitución de una ficha del alta (sin Constitución, 0). */
export function modConstitucionDeEntrada(ficha: PersonajeCreateRequestDto | null | undefined): number {
    const con = ficha?.caracteristicas?.constitucion;
    return !con || con.perdido ? 0 : modificadorCaracteristica(toInt(con.valor));
}

const SE_CONSERVAN_PERSONAJE = new Set([
    // Lo que una subida no cambia (si llega distinto, la API responde `subida_cambio_no_permitido`) o no toca.
    'nombre', 'idRaza', 'idRazaBase', 'idAlineamiento', 'deidad', 'edad', 'idPasoEdad', 'tipo', 'campana', 'trama', 'subtrama',
    'descripcionPersonalidad', 'descripcionHistoria', 'idRegion', 'idGenero', 'visible_otros_usuarios', 'idTipoCriatura',
    'altura', 'peso',
]);

type Lista = Array<Record<string, any>>;

/** Una clave estable de un elemento (sus campos ordenados, sin los vacíos), para comparar listas como multiconjuntos. */
function claveElemento(elemento: unknown): string {
    if (elemento === null || typeof elemento !== 'object')
        return JSON.stringify(elemento ?? null);
    const limpio = Object.keys(elemento as Record<string, unknown>).sort()
        .filter((k) => !['', null, undefined].includes((elemento as Record<string, any>)[k]))
        .map((k) => [k, claveElemento((elemento as Record<string, any>)[k])]);
    return JSON.stringify(limpio);
}

/** Lo que hay en `despues` y no en `antes` (contando repetidos), y lo contrario. */
function diferencia(antes: Lista, despues: Lista): { nuevos: Lista; quitados: Lista; } {
    const quedan = new Map<string, number>();
    antes.forEach((x) => quedan.set(claveElemento(x), (quedan.get(claveElemento(x)) ?? 0) + 1));
    const nuevos: Lista = [];
    despues.forEach((x) => {
        const k = claveElemento(x);
        if ((quedan.get(k) ?? 0) > 0)
            quedan.set(k, quedan.get(k)! - 1);
        else
            nuevos.push(x);
    });
    const vistos = new Map<string, number>();
    despues.forEach((x) => vistos.set(claveElemento(x), (vistos.get(claveElemento(x)) ?? 0) + 1));
    const quitados: Lista = [];
    antes.forEach((x) => {
        const k = claveElemento(x);
        if ((vistos.get(k) ?? 0) > 0)
            vistos.set(k, vistos.get(k)! - 1);
        else
            quitados.push(x);
    });
    return { nuevos, quitados };
}

/**
 * Una lista de la `entrada` con lo que el motor añade (y quita, si lo que quita está en la `entrada`). Si el motor quita
 * algo que la `entrada` no tiene tal cual (las fichas de antes guardan otra forma), la lista pasa a ser la del motor.
 */
function aplicarDiferencia(guardada: Lista | undefined, antes: Lista | undefined, despues: Lista | undefined, quitar: boolean): Lista {
    const { nuevos, quitados } = diferencia(antes ?? [], despues ?? []);
    const resultado = [...(guardada ?? [])];
    if (quitar) {
        for (const x of quitados) {
            const i = resultado.findIndex((g) => claveElemento(g) === claveElemento(x));
            if (i < 0)
                return [...(despues ?? [])];
            resultado.splice(i, 1);
        }
    }
    return [...resultado, ...nuevos];
}

/**
 * Las habilidades de la `entrada` con los rangos que el motor ha puesto (por habilidad y extra) y lo que ha cambiado en
 * sus rangos varios (un rasgo que se gana a N DG con su bonificador de habilidad): la diferencia del motor, con su texto
 * de varios. Lo que el motor ya contaba antes y la ficha guardada no (una ficha de antes) no se toca.
 */
function aplicarRangos(guardadas: Lista | undefined, antes: Lista | undefined, despues: Lista | undefined): Lista {
    const clave = (h: Record<string, any>) => `${toInt(h?.['idHabilidad'])}:${Math.max(0, toInt(h?.['idExtra']))}`;
    const previas = new Map((antes ?? []).map((h) => [clave(h), h]));
    const resultado = (guardadas ?? []).map((h) => ({ ...h }));
    (despues ?? []).forEach((h) => {
        const previa = previas.get(clave(h));
        const suma = toInt(h?.['rangos']) - toInt(previa?.['rangos']);
        const sumaVarios = toInt(h?.['rangosVarios']) - toInt(previa?.['rangosVarios']);
        const deClase = !!h?.['clasea'] && !previa?.['clasea'];
        if (suma === 0 && sumaVarios === 0 && !deClase)
            return;
        const fila = resultado.find((g) => clave(g) === clave(h));
        if (fila) {
            fila['rangos'] = toInt(fila['rangos']) + suma;
            if (sumaVarios !== 0) {
                fila['rangosVarios'] = toInt(fila['rangosVarios']) + sumaVarios;
                fila['modVarios'] = h?.['modVarios'] ?? fila['modVarios'];
            }
            if (deClase)
                fila['clasea'] = true;
        } else
            // Una que la ficha no guardaba: entra como la deja el motor (con sus rangos varios), solo con los rangos nuevos.
            resultado.push({ ...h, rangos: Math.max(0, suma) });
    });
    return resultado;
}

export interface EntradaFichaSubida {
    /** La `entrada` de la sesión abierta (`GET /personajes/{id}/sesiones/{numero}`). */
    entrada: PersonajeCreateRequestDto;
    /** El cuerpo del alta que arma el motor antes y después de aplicar el nivel. */
    antes: PersonajeCreateRequestDto;
    despues: PersonajeCreateRequestDto;
    /** La clase que sube. */
    idClase: number;
    /** El nivel nuevo con sus elecciones. */
    nivel: PersonajeCreateNivelDto;
    /** Los PG totales tras subir (`puntosGolpeTrasSubida`). */
    puntosGolpe: number;
    /** Los conocidos que olvida en el intercambio (`conjuro_olvidado`). */
    olvidados?: Array<{ idConjuro: number; idClase: number; }>;
}

/** La ficha completa de la subida: la `entrada` con lo que ha cambiado el motor y el nivel nuevo al final. */
export function fichaDeLaSubida(datos: EntradaFichaSubida): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(datos.entrada));
    const antes = datos.antes;
    const despues = datos.despues;

    Object.entries(despues.personaje ?? {}).forEach(([k, valor]) => {
        if (!SE_CONSERVAN_PERSONAJE.has(k) && claveElemento(valor) !== claveElemento((antes.personaje as any)?.[k]))
            (ficha.personaje as any)[k] = valor;
    });
    ficha.personaje.puntosGolpe = Math.max(0, toInt(datos.puntosGolpe));

    Object.entries(despues.caracteristicas ?? {}).forEach(([k, valor]) => {
        const previa = (antes.caracteristicas as any)?.[k];
        const guardada = (ficha.caracteristicas as any)?.[k];
        if (guardada && toInt(valor?.valor) !== toInt(previa?.valor))
            guardada.valor = toInt(guardada.valor) + toInt(valor?.valor) - toInt(previa?.valor);
    });
    if (claveElemento(despues.tamano) !== claveElemento(antes.tamano))
        ficha.tamano = { ...despues.tamano };

    // Los modificadores (CA, iniciativa, presa y las salvaciones de clase y varias), sin los que valen 0 (no se guardan).
    const sinCero = (lista: Lista | undefined) => (lista ?? []).filter((m) => toInt(m?.['valor']) !== 0);
    const modsA: any = antes.modificadores ?? {};
    const modsD: any = despues.modificadores ?? {};
    const mods: any = ficha.modificadores = { ...(ficha.modificadores ?? {}) };
    (['ca', 'iniciativa', 'presa'] as const).forEach((k) => {
        if (claveElemento(sinCero(modsA[k])) !== claveElemento(sinCero(modsD[k])))
            mods[k] = aplicarDiferencia(sinCero(mods[k]), sinCero(modsA[k]), sinCero(modsD[k]), true);
    });
    (['fortaleza', 'reflejos', 'voluntad'] as const).forEach((s) => {
        (['claseos', 'varios'] as const).forEach((t) => {
            const a = sinCero(modsA.salvaciones?.[s]?.[t]);
            const d = sinCero(modsD.salvaciones?.[s]?.[t]);
            if (claveElemento(a) === claveElemento(d))
                return;
            mods.salvaciones = { ...(mods.salvaciones ?? {}) };
            mods.salvaciones[s] = { ...(mods.salvaciones[s] ?? {}) };
            mods.salvaciones[s][t] = aplicarDiferencia(sinCero(mods.salvaciones[s][t]), a, d, true);
        });
    });

    const colA: any = antes.colecciones ?? {};
    const colD: any = despues.colecciones ?? {};
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    // Las clases: las guardadas con un nivel más en la que sube.
    const clases = (col.clases ?? []).map((c: any) => ({ ...c }));
    const deLaClase = clases.find((c: any) => toInt(c.idClase) === toInt(datos.idClase));
    if (deLaClase)
        deLaClase.nivel = toInt(deLaClase.nivel) + 1;
    else
        clases.push({ idClase: toInt(datos.idClase), nivel: 1 });
    col.clases = clases;
    Object.keys({ ...colA, ...colD }).forEach((k) => {
        if (k === 'clases' || k === 'habilidades' || k === 'conjurosConocidos' || !Array.isArray(colD[k] ?? colA[k] ?? []))
            return;
        // Los raciales, también lo que quitan: el rasgo que sustituye otro al llegar a N DG (la visión en la oscuridad 30'
        // que pasa a 60'). Lo demás, solo se añade.
        if (claveElemento(colA[k] ?? []) !== claveElemento(colD[k] ?? []))
            col[k] = aplicarDiferencia(col[k], colA[k], colD[k], k === 'raciales');
    });
    col.habilidades = {
        ...(col.habilidades ?? {}),
        base: aplicarRangos(col.habilidades?.base, colA.habilidades?.base, colD.habilidades?.base),
        custom: aplicarRangos(col.habilidades?.custom, colA.habilidades?.custom, colD.habilidades?.custom),
    };
    // Los conjuros conocidos: los nuevos del motor y, del intercambio, sin el que olvida.
    const olvidados = datos.olvidados ?? [];
    const conocidos = (col.conjurosConocidos ?? []).filter((c: any) => !olvidados.some((o) =>
        !c?.copiado && toInt(c?.idConjuro) === toInt(o.idConjuro) && (toInt(c?.idClase) === toInt(o.idClase) || toInt(c?.idClase) < 1)));
    col.conjurosConocidos = [...conocidos, ...diferencia(colA.conjurosConocidos ?? [], colD.conjurosConocidos ?? []).nuevos
        .filter((c) => !c['copiado'])];

    if (claveElemento(antes.progresionLanzador?.selecciones ?? []) !== claveElemento(despues.progresionLanzador?.selecciones ?? []))
        ficha.progresionLanzador = {
            selecciones: aplicarDiferencia(ficha.progresionLanzador?.selecciones as any, antes.progresionLanzador?.selecciones as any,
                despues.progresionLanzador?.selecciones as any, false) as any,
        };

    // Los niveles guardados tal cual (la API los conserva) y el nuevo al final, con sus elecciones.
    ficha.niveles = [
        ...(datos.entrada.niveles ?? []).map((n) => ({ ...n })),
        { idClase: toInt(datos.nivel.idClase), nivelClase: toInt(datos.nivel.nivelClase), elecciones: [...(datos.nivel.elecciones ?? [])] },
    ];
    return ficha;
}
