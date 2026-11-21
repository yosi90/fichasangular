import { ClaseIntercambioConjuros } from 'src/app/interfaces/clase';
import { PersonajeCreateCompaneroDto, PersonajeCreateFamiliarDto, PersonajeCreateNivelDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { modificadorCaracteristica } from './caracteristicas';
import { claveDeDoteDelCompaneroGuardada, mitadDeLosPg } from './mascota-payload';
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
 * Los PG de un DG guardado en el registro (el `pg` de un nivel): al máximo, su dado; si no, lo que salió (su tirada) o, sin
 * ella, la media (y no es exacto), con el modificador de Constitución y al menos 1 (MJ p. 23). Lo usan la pérdida de un
 * nivel (`perder-nivel.ts`) y la vuelta a la vida (el nivel que pasa a ser su primer DG, `pgDelPrimerDg`).
 */
export function pgDeUnDgGuardado(pg: PersonajeCreateNivelDto['pg'] | null | undefined, caras: number, modConstitucion: number)
    : { pg: number; exacto: boolean; } {
    const dado = Math.max(1, toInt(caras));
    const tirada = pg?.maximo ? dado : toInt(pg?.tirada);
    const salio = tirada > 0 ? tirada : Math.floor(dado / 2) + 1;
    return { pg: Math.max(1, salio + toInt(modConstitucion)), exacto: tirada > 0 };
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

/**
 * Los PG tras corregir la ficha: el retroactivo de la Constitución (`pgTrasCambioDeCon`) y lo que cambian las tiradas de
 * PG corregidas (`tiradas`: el índice del nivel en `entrada.niveles` y la nueva), cada DG con el modificador de después y
 * al menos 1. Solo cambia la de un nivel con su tirada guardada y no tomado al máximo (el primero del personaje).
 */
export function pgTrasCorreccion(entrada: PersonajeCreateRequestDto, nivelPersonaje: number, modConDespues: number,
    tiradas: Record<number, number> = {}): PgSubida {
    const base = pgTrasCambioDeCon(entrada, nivelPersonaje, modConDespues, null);
    const mod = toInt(modConDespues);
    let porTiradas = 0;
    (entrada.niveles ?? []).forEach((nivel, i) => {
        const vieja = toInt(nivel?.pg?.tirada);
        if (tiradas[i] === undefined || vieja < 1 || nivel?.pg?.maximo)
            return;
        porTiradas += Math.max(1, toInt(tiradas[i]) + mod) - Math.max(1, vieja + mod);
    });
    return { ...base, total: Math.max(1, base.total + porTiradas), delNivel: porTiradas };
}

/** El modificador de Constitución de una ficha del alta (sin Constitución, 0). */
export function modConstitucionDeEntrada(ficha: PersonajeCreateRequestDto | null | undefined): number {
    const con = ficha?.caracteristicas?.constitucion;
    return !con || con.perdido ? 0 : modificadorCaracteristica(toInt(con.valor));
}

export const SE_CONSERVAN_PERSONAJE: ReadonlySet<string> = new Set([
    // Lo que una subida no cambia (si llega distinto, la API responde `subida_cambio_no_permitido`) o no toca.
    'nombre', 'idRaza', 'idRazaBase', 'idAlineamiento', 'deidad', 'edad', 'idPasoEdad', 'tipo', 'campana', 'trama', 'subtrama',
    'descripcionPersonalidad', 'descripcionHistoria', 'idRegion', 'idGenero', 'visible_otros_usuarios', 'idTipoCriatura',
    'altura', 'peso',
]);

export type Lista = Array<Record<string, any>>;

/** Las colecciones de las que la ficha del motor quita lo que quita el motor si no se dice otra cosa: los raciales. */
const QUITAR_EN_POR_DEFECTO: ReadonlySet<string> = new Set(['raciales']);

/** Una clave estable de un elemento (sus campos ordenados, sin los vacíos), para comparar listas como multiconjuntos. */
function claveElemento(elemento: unknown): string {
    if (elemento === null || typeof elemento !== 'object')
        return JSON.stringify(elemento ?? null);
    const limpio = Object.keys(elemento as Record<string, unknown>).sort()
        .filter((k) => !['', null, undefined].includes((elemento as Record<string, any>)[k]))
        .map((k) => [k, claveElemento((elemento as Record<string, any>)[k])]);
    return JSON.stringify(limpio);
}

/**
 * Lo que hay en `despues` y no en `antes` (contando repetidos), y lo contrario. Lo usan la ficha del motor (abajo) y la
 * adquisición de una raza mutada (las dotes que se van, `adquirir-raza-mutada.ts`).
 */
export function diferencia(antes: Lista, despues: Lista): { nuevos: Lista; quitados: Lista; } {
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

/**
 * Los modificadores de `ficha` (CA, iniciativa, presa y las salvaciones de clase y varias) con lo que cambia el motor entre
 * `antes` y `despues`, sin los que valen 0 (no se guardan): lo que pone y lo que quita (la iniciativa de una dote que se va).
 * La API los guarda tal cual, no los recalcula. Lo usan la subida, la adquisición de una plantilla, el reciclaje y la
 * corrección de la ficha.
 */
export function aplicarModificadoresDelMotor(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto): void {
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
}

/**
 * Las características de `ficha` con lo que cambia el motor entre `antes` y `despues`, como diferencia sobre lo guardado,
 * salvo las perdidas (`perdido`: la Constitución de un no muerto), que no tienen valor. Una que el motor pierde ahora (el
 * tipo nuevo no la tiene: una plantilla o una raza mutada que lo hacen muerto viviente) queda perdida con la puntuación
 * guardada, para cuando vuelva a la vida (*Libris Mortis*, pág. 34). Lo usan la subida, la adquisición de una plantilla o
 * de una raza mutada y el reciclaje.
 */
export function aplicarCaracteristicasDelMotor(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto): void {
    Object.entries(despues.caracteristicas ?? {}).forEach(([k, valor]) => {
        const previa = (antes.caracteristicas as any)?.[k];
        const guardada = (ficha.caracteristicas as any)?.[k];
        if (!guardada || guardada.perdido)
            return;
        if (valor?.perdido && !previa?.perdido)
            guardada.perdido = true;
        else if (toInt(valor?.valor) !== toInt(previa?.valor))
            guardada.valor = toInt(guardada.valor) + toInt(valor?.valor) - toInt(previa?.valor);
    });
}

/**
 * Lo que cambia en la ficha al quitar o poner una dote, con el cuerpo del motor antes y después: sus modificadores (CA,
 * iniciativa, presa, salvaciones), sus características y los rangos varios de sus habilidades (Alerta), sin tocar los
 * rangos comprados. Lo usan el reciclaje de una dote y la pérdida de un nivel (las dotes que se van con él).
 */
export function aplicarLoQueDanLasDotes(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto): void {
    aplicarModificadoresDelMotor(ficha, antes, despues);
    aplicarCaracteristicasDelMotor(ficha, antes, despues);
    aplicarHabilidadesDelMotor(ficha, antes, despues, true);
}

/**
 * Las habilidades de `guardadas` con solo lo que cambia el motor en sus rangos varios (lo que suma una dote, como Alerta,
 * o un rasgo), sin tocar los rangos comprados ni si es de clase: lo que cambia al quitar o poner una dote.
 */
function conLosRangosVariosDelMotor(guardadas: Lista | undefined, antes: Lista | undefined, despues: Lista | undefined): Lista {
    const clave = (h: Record<string, any>) => `${toInt(h?.['idHabilidad'])}:${Math.max(0, toInt(h?.['idExtra']))}`;
    const previas = new Map((antes ?? []).map((h) => [clave(h), h]));
    const soloVarios = (despues ?? []).map((h) => {
        const previa = previas.get(clave(h));
        return { ...h, rangos: toInt(previa?.['rangos']), clasea: !!previa?.['clasea'] };
    });
    return aplicarRangos(guardadas, antes, soloVarios);
}

/**
 * Las habilidades de `ficha` (las del catálogo y las personalizadas) con lo que cambia el motor entre `antes` y `despues`:
 * sus rangos (`aplicarRangos`) o, con `soloVarios`, solo sus rangos varios (`conLosRangosVariosDelMotor`). Lo usan la
 * subida, la adquisición de una plantilla, el reciclaje y la corrección de la ficha.
 */
export function aplicarHabilidadesDelMotor(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto, soloVarios = false): void {
    const aplicar = soloVarios ? conLosRangosVariosDelMotor : aplicarRangos;
    const col: any = ficha.colecciones ??= {} as PersonajeCreateRequestDto['colecciones'];
    const a: any = antes.colecciones?.habilidades ?? {};
    const d: any = despues.colecciones?.habilidades ?? {};
    col.habilidades = {
        ...(col.habilidades ?? {}),
        base: aplicar(col.habilidades?.base, a.base, d.base),
        custom: aplicar(col.habilidades?.custom, a.custom, d.custom),
    };
}

/** Las cifras del compañero que pone al día el motor: las de la tabla, sus PG y su Inteligencia. */
const CIFRAS_COMPANERO_DEL_MOTOR = ['vida', 'dgAdi', 'trucosAdi', 'fuerza', 'destreza', 'armaduraNatural', 'inteligencia'] as const;

/**
 * El compañero de la `entrada` con lo que cambia el motor entre `antes` y `despues` (la web lo pone al día en cada nivel
 * de clase y en los demás cambios de la ficha: `docs/publica/endpoints/personajes.md`, «El compañero, comprobado por la
 * API» y «La mascota inactiva…»): sus cifras, si está inactivo (`inactiva`) y, por id, las aptitudes y las dotes que gana
 * o pierde; sus rangos, si bajan sus DG adicionales y el motor los cambia («todo o nada»: `rangosDelCompaneroQueCaben`);
 * y sus mejoras y sus trucos, si el motor los cambia.
 * Lo demás (el nombre, el animal, la plantilla) se queda como estaba, y lo que guardaba la ficha con otra forma (el extra
 * de antes) también.
 */
export function companeroConLoDelMotor(guardado: PersonajeCreateCompaneroDto, antes: PersonajeCreateCompaneroDto | undefined,
    despues: PersonajeCreateCompaneroDto, { conSusRangos = false }: { conSusRangos?: boolean; } = {}): PersonajeCreateCompaneroDto {
    const resultado: PersonajeCreateCompaneroDto = JSON.parse(JSON.stringify(guardado));
    CIFRAS_COMPANERO_DEL_MOTOR.forEach((k) => {
        if (toInt(despues[k]) !== toInt(antes?.[k]))
            resultado[k] = toInt(despues[k]);
    });
    resultado.especiales = conLaDiferenciaPorId(guardado.especiales, antes?.especiales, despues.especiales, (x) => `${toInt(x?.idEspecial)}`);
    // Las de su tabla por id; las que elige con sus DG, por dote, extra y DG (una repetida con otro extra es otra).
    resultado.dotes = conLaDiferenciaPorId(guardado.dotes, antes?.dotes, despues.dotes,
        (x) => toInt(x?.dg) > 0 ? claveDeDoteDelCompaneroGuardada(x) : `${toInt(x?.idDote)}`);
    // Los rangos, si cambian sus DG adicionales y el motor los cambia: al bajar («todo o nada») y al subir (los de sus DG
    // nuevos, que se reparten en la subida).
    // Con `conSusRangos` (completar lo que le faltaba, sin cambiar sus DG), también si solo cambian sus rangos.
    if ((conSusRangos || toInt(despues.dgAdi) !== toInt(antes?.dgAdi)) && claveElemento(antes?.habilidades ?? []) !== claveElemento(despues.habilidades ?? []))
        resultado.habilidades = JSON.parse(JSON.stringify(despues.habilidades ?? []));
    // Sus mejoras de característica, como las deja el motor si cambian (contrato: «Las dotes y las mejoras que elige…»).
    if (claveElemento(antes?.mejoras ?? []) !== claveElemento(despues.mejoras ?? []))
        resultado.mejoras = JSON.parse(JSON.stringify(despues.mejoras ?? []));
    // Sus trucos, como los deja el motor si cambian: los adicionales que elige al subir y los que pierde al bajar (contrato:
    // «Los trucos del compañero»); los enseñados y los de su monstruo van con ellos.
    if (claveElemento(antes?.trucos ?? []) !== claveElemento(despues.trucos ?? []))
        resultado.trucos = JSON.parse(JSON.stringify(despues.trucos ?? []));
    conSuActividad(resultado, despues);
    return resultado;
}

/** Activa o inactiva como la deja el motor (`despues`): la ficha lleva `inactiva` solo si lo está. */
function conSuActividad(resultado: { inactiva?: boolean; }, despues: { inactiva?: boolean; }): void {
    if (despues.inactiva)
        resultado.inactiva = true;
    else
        delete resultado.inactiva;
}

/**
 * Las aptitudes o las dotes guardadas de una mascota con lo que gana o pierde en el motor (por id, entre `previas` y
 * `nuevas`): lo que guardaba la ficha con otra forma (el extra de antes) se queda.
 */
function conLaDiferenciaPorId<T>(guardadas: T[] | undefined, previas: T[] | undefined, nuevas: T[] | undefined, id: (x: T) => string): T[] {
    const idsAntes = new Set((previas ?? []).map(id));
    const idsDespues = new Set((nuevas ?? []).map(id));
    const quedan = (guardadas ?? []).filter((x) => !(idsAntes.has(id(x)) && !idsDespues.has(id(x))));
    const yaEstan = new Set(quedan.map(id));
    return [...quedan, ...(nuevas ?? []).filter((x) => !idsAntes.has(id(x)) && !yaEstan.has(id(x)))];
}

/** Las salvaciones del familiar: el motor las cambia si cambian las del amo (la base mejor, la suya o la de su amo). */
const SALVACIONES_FAMILIAR_DEL_MOTOR = ['fortaleza', 'reflejos', 'voluntad'] as const;

/**
 * El familiar de la `entrada` puesto al día por el motor (`docs/publica/endpoints/personajes.md`, «El familiar, comprobado
 * por la API»): lo que comprueba la API, como lo calcula el motor con la tabla al nivel de su amo (la armadura natural, la
 * Inteligencia, la resistencia a conjuros y el ataque base); sus PG, la mitad de los `puntosGolpe` del amo (con los
 * mayores, los suyos si son más: el motor los da con un amo sin PG, `cuerpoDelMotor`); las salvaciones, si cambian; y, por
 * id, las aptitudes y las dotes que gana o pierde. Lo demás (el nombre, la criatura, la plantilla, las habilidades) se
 * queda como estaba.
 */
export function familiarConLoDelMotor(guardado: PersonajeCreateFamiliarDto, antes: PersonajeCreateFamiliarDto | undefined,
    despues: PersonajeCreateFamiliarDto, puntosGolpe: number): PersonajeCreateFamiliarDto {
    const resultado: PersonajeCreateFamiliarDto = JSON.parse(JSON.stringify(guardado));
    resultado.armaduraNatural = toInt(despues.armaduraNatural);
    resultado.inteligencia = toInt(despues.inteligencia);
    resultado.ataqueBase = toInt(despues.ataqueBase);
    // Inactivo, los PG de su criatura, no los de su amo (contrato, «La mascota inactiva…»).
    resultado.vida = despues.inactiva ? toInt(despues.vida) : Math.max(mitadDeLosPg(puntosGolpe), toInt(despues.vida));
    if (despues.rc !== undefined)
        resultado.rc = despues.rc;
    else if (/\d/.test(`${guardado.rc ?? ''}`))
        resultado.rc = 'No';
    SALVACIONES_FAMILIAR_DEL_MOTOR.forEach((k) => {
        if (toInt(despues[k]) !== toInt(antes?.[k]))
            resultado[k] = toInt(despues[k]);
    });
    resultado.especiales = conLaDiferenciaPorId(guardado.especiales, antes?.especiales, despues.especiales, (x) => `${toInt(x?.idEspecial)}`);
    resultado.dotes = conLaDiferenciaPorId(guardado.dotes, antes?.dotes, despues.dotes, (x) => `${toInt(x?.idDote)}`);
    // Sus rangos, los mejores entre los de su criatura y los de su amo (MJ pág. 45), como los deja el motor si cambian: al
    // cambiar los del amo (al subir o perder un nivel, con una plantilla…), al quedar inactivo (los de su criatura) o activarse.
    if (!!guardado.inactiva !== !!despues.inactiva || claveElemento(antes?.habilidades ?? []) !== claveElemento(despues.habilidades ?? []))
        resultado.habilidades = JSON.parse(JSON.stringify(despues.habilidades ?? []));
    conSuActividad(resultado, despues);
    return resultado;
}

/**
 * La `ficha` con sus mascotas puestas al día por el motor (sus cuerpos `antes` y `despues`): el compañero, si cambia
 * (`companeroConLoDelMotor`), y el familiar siempre que lo tenga, porque sus PG siguen a los del amo
 * (`familiarConLoDelMotor`, con los `puntosGolpe` de la ficha). Lo usan la ficha del motor (`fichaConLoDelMotor`) y la
 * pérdida de un nivel (`perdidaConSusMascotas`, en `mascota-al-dia.ts`).
 */
export function conLasMascotasDelMotor(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto): void {
    if (ficha.companero && despues.companero && claveElemento(antes.companero ?? null) !== claveElemento(despues.companero))
        ficha.companero = companeroConLoDelMotor(ficha.companero, antes.companero, despues.companero);
    if (ficha.familiar && despues.familiar)
        ficha.familiar = familiarConLoDelMotor(ficha.familiar, antes.familiar, despues.familiar, toInt(ficha.personaje?.puntosGolpe));
}

export interface EntradaFichaDelMotor {
    /** La `entrada` de la sesión abierta (`GET /personajes/{id}/sesiones/{numero}`). */
    entrada: PersonajeCreateRequestDto;
    /** El cuerpo del alta que arma el motor antes y después del cambio (un nivel, una plantilla). */
    antes: PersonajeCreateRequestDto;
    despues: PersonajeCreateRequestDto;
    /** Los PG totales tras el cambio. */
    puntosGolpe: number;
    /** Los conocidos que olvida en el intercambio (`conjuro_olvidado`). */
    olvidados?: Array<{ idConjuro: number; idClase: number; }>;
    /** Lo de `personaje` que se queda como en la `entrada` aunque el motor lo cambie (por defecto, lo de la subida). */
    seConservan?: ReadonlySet<string>;
    /**
     * Las colecciones de las que también se quita lo que quita el motor (por defecto, los raciales): las que salen de la
     * raza, en una raza mutada adquirida.
     */
    quitarEn?: ReadonlySet<string>;
}

export interface EntradaFichaSubida extends EntradaFichaDelMotor {
    /** La clase que sube. */
    idClase: number;
    /** El nivel nuevo con sus elecciones. */
    nivel: PersonajeCreateNivelDto;
}

/** La ficha completa de la subida: la `entrada` con lo que ha cambiado el motor y el nivel nuevo al final. */
export function fichaDeLaSubida(datos: EntradaFichaSubida): PersonajeCreateRequestDto {
    const ficha = fichaConLoDelMotor(datos);
    conElNivelNuevo(ficha, datos.entrada.niveles, datos.idClase, datos.nivel);
    return ficha;
}

/**
 * La `ficha` con un nivel más en `idClase` (o la clase nueva a nivel 1) y sus niveles: los `guardados` tal cual (la API los
 * conserva) y el nuevo al final, con sus elecciones. Lo usan la subida y la conversión en muerto viviente (el 1.er nivel
 * de su clase de monstruo, tras los guardados sin el que pierde).
 */
export function conElNivelNuevo(ficha: PersonajeCreateRequestDto, guardados: PersonajeCreateNivelDto[] | undefined, idClase: number,
    nivel: PersonajeCreateNivelDto): void {
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) } as PersonajeCreateRequestDto['colecciones'];
    const clases = (col.clases ?? []).map((c: any) => ({ ...c }));
    const deLaClase = clases.find((c: any) => toInt(c.idClase) === toInt(idClase));
    if (deLaClase)
        deLaClase.nivel = toInt(deLaClase.nivel) + 1;
    else
        clases.push({ idClase: toInt(idClase), nivel: 1 });
    col.clases = clases;
    ficha.niveles = [
        ...(guardados ?? []).map((n) => ({ ...n })),
        { idClase: toInt(nivel.idClase), nivelClase: toInt(nivel.nivelClase), elecciones: [...(nivel.elecciones ?? [])] },
    ];
}

/**
 * La `entrada` con lo que ha cambiado el motor (la diferencia entre su cuerpo del alta antes y después): lo de `personaje`
 * que no se conserva, las características (como diferencia), el tamaño, los modificadores, las colecciones (salvo las
 * clases, que no toca), los rangos, los conjuros conocidos nuevos y la progresión de lanzador; los niveles, como en la
 * `entrada`. La usan la subida (`fichaDeLaSubida`) y la adquisición de una plantilla (`fichaDeLaPlantilla`).
 */
export function fichaConLoDelMotor(datos: EntradaFichaDelMotor): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(datos.entrada));
    const antes = datos.antes;
    const despues = datos.despues;
    const seConservan = datos.seConservan ?? SE_CONSERVAN_PERSONAJE;
    const quitarEn = datos.quitarEn ?? QUITAR_EN_POR_DEFECTO;

    Object.entries(despues.personaje ?? {}).forEach(([k, valor]) => {
        if (!seConservan.has(k) && claveElemento(valor) !== claveElemento((antes.personaje as any)?.[k]))
            (ficha.personaje as any)[k] = valor;
    });
    ficha.personaje.puntosGolpe = Math.max(0, toInt(datos.puntosGolpe));

    aplicarCaracteristicasDelMotor(ficha, antes, despues);
    if (claveElemento(despues.tamano) !== claveElemento(antes.tamano))
        ficha.tamano = { ...despues.tamano };

    aplicarModificadoresDelMotor(ficha, antes, despues);

    const colA: any = antes.colecciones ?? {};
    const colD: any = despues.colecciones ?? {};
    const col: any = ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    Object.keys({ ...colA, ...colD }).forEach((k) => {
        if (k === 'clases' || k === 'habilidades' || k === 'conjurosConocidos' || !Array.isArray(colD[k] ?? colA[k] ?? []))
            return;
        // Los raciales, también lo que quitan: el rasgo que sustituye otro al llegar a N DG (la visión en la oscuridad 30'
        // que pasa a 60'); con `quitarEn`, esas. Lo demás, solo se añade.
        if (claveElemento(colA[k] ?? []) !== claveElemento(colD[k] ?? []))
            col[k] = aplicarDiferencia(col[k], colA[k], colD[k], quitarEn.has(k));
    });
    aplicarHabilidadesDelMotor(ficha, antes, despues);
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

    // El compañero animal y el familiar, puestos al día por el motor (la tabla y las aptitudes de su nivel, o inactivos).
    conLasMascotasDelMotor(ficha, antes, despues);

    ficha.niveles = (datos.entrada.niveles ?? []).map((n) => ({ ...n }));
    return ficha;
}
