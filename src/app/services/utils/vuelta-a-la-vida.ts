import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelDto, PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { NivelPerdido } from 'src/app/interfaces/sesiones';
import { EspecialSustituido, Raza } from 'src/app/interfaces/raza';
import { CambioPlantilla, filasDeCaracteristicas, filasDeRasgosRaciales, filasDelTipo, filasSinPoderUsar } from './adquirir-plantilla';
import { LISTAS_DE_LA_RAZA, nepTrasLaMutacion, RangosQuitados, RazaDelNep, SE_CONSERVAN_EN_MUTACION } from './adquirir-raza-mutada';
import { modificadorCaracteristica } from './caracteristicas';
import { ContextoCompatibles, esClaseCompatibleConRestringida } from './clase-elegibilidad';
import {
    ClaseConTabla, daDgEnNivel, daDotePorNivelDePersonaje, daIncrementoPorNivelDePersonaje, dgsDeClase, filaDeNivel, tieneTablaPorNivel,
} from './clase-niveles';
import { sacarDoteDeLaFicha, sacarPrimero, sinDecisionesDeDotesQueNoTiene } from './correccion-ficha';
import { mismoExtraDeHabilidad } from './habilidad-extra-visible';
import { esDotePorNivelDePersonaje } from './niveles-creacion';
import { toInt } from './normalizacion';
import { puntosHabilidadNivelClase } from './puntos-habilidad';
import {
    CONSTITUCION_PERDIDA, FilaPerdida, marcarDotesSinPrerrequisitos, ordenConocido, ordenPorConocer, pxTrasPerder, quitadoVacio, ResultadoPerdida,
} from './perder-nivel';
import { especialesDevueltos } from './raza-mutacion';
import { formatoPx } from './sesiones-texto';
import { diferencia, fichaConLoDelMotor, pgTrasCambioDeCon, PgSubida, puntosGolpeTrasSubida } from './subida-nivel';

/*
 * Devolver la vida a un muerto viviente de clase de monstruo (*Libris Mortis*, pág. 35; contrato en
 * `docs/publica/endpoints/personajes.md`, «Devolver la vida a un muerto viviente»; reglas en el dictamen del máster de Rol
 * del 2026-11-20, en el roadmap de sesiones): lo contrario de la conversión (`conversion-muerto-viviente.ts`). Pierde todos
 * los niveles de la clase de monstruo con lo que dieron, vuelve a la raza de antes (la base) con su Constitución guardada y,
 * con *resurrección*, *deseo* o *milagro*, pierde además el último nivel de clase que le queda, como en «Perder un nivel»
 * (`perder-nivel.ts`). Si sin la clase de monstruo no le queda ningún DG, gana el 1.er nivel de una clase básica, como al
 * crear (decisión del propietario del 2026-11-20; «Sin ningún DG» del contrato), y con *resurrección* paga con 2 puntos de
 * Constitución. Si después de la clase de monstruo tomó niveles de otra clase, con el orden conocido, se renumeran y lo que
 * va por nivel de personaje se vuelve a contar («Con niveles de otra clase después» del contrato; abajo, «la
 * renumeración»). Todo sale de los datos de la raza y de sus clases, nunca de su nombre. Lo usa
 * `components/sesiones/devolver-la-vida`.
 */

/** Un medio de devolverle la vida: si pierde además un nivel (`pierdeNivel` del contrato) y su porqué. */
export interface MedioDeLaVuelta {
    pierdeNivel: boolean;
    titulo: string;
    porque: string;
}

/** Los dos medios que sirven (*Manual del jugador*, págs. 228, 262 y 285), en el orden en que se ofrecen. */
export const MEDIOS_DE_LA_VUELTA: ReadonlyArray<MedioDeLaVuelta> = [
    {
        pierdeNivel: true,
        titulo: 'Resurrección, deseo o milagro: pierde además un nivel',
        porque: 'No pueden impedir que un personaje devuelto a la vida pierda un nivel (Manual del jugador, págs. 228, 262 y 285). Con un solo DG, o si vuelve con su 1.er nivel, pierde 2 puntos de Constitución en su lugar.',
    },
    {
        pierdeNivel: false,
        titulo: 'Resurrección verdadera: no pierde nivel',
        porque: 'Lo devuelve a la vida sin pérdida de nivel ni de Constitución (Manual del jugador, pág. 285).',
    },
];

/** Lo que no sirve, a la vista junto a los medios. */
export const NO_SIRVEN_PARA_LA_VUELTA = 'Revivir a los muertos y reencarnar no sirven: no devuelven la vida a quien se convirtió en muerto viviente (Manual del jugador, págs. 282 y 286).';

/** Las frases de los `409` del contrato (`docs/publica/ERRORES.md`), para enseñarlo deshabilitado antes de mandarlo. */
export const MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO = 'Solo se devuelve así la vida a quien se convirtió en muerto viviente con una clase de monstruo.';
export const MOTIVO_VUELTA_NIVELES_DESPUES = 'Después de la clase de monstruo tomó niveles de otra clase y el orden de sus niveles está por conocer: eso lo corrige el máster.';
/** `409 perdida_sin_niveles_de_clase`, con resurrección: el nivel de más sería un DG racial. */
export const MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL = 'Sin la clase de monstruo no tiene niveles de clase: con resurrección, deseo o milagro perdería un DG racial, y eso aún no se puede apuntar. Con resurrección verdadera, sí.';

/** `409 perdida_sin_constitucion`: con un solo DG, los 2 puntos que pierde dejarían su Constitución en 0. */
export function motivoSinConstitucionParaVolver(constitucion: number | null): string {
    return constitucion === null
        ? 'No tiene una puntuación de Constitución guardada: no se le puede devolver la vida (Manual del jugador, pág. 285).'
        : `Con Constitución ${toInt(constitucion)} no se le puede devolver la vida: los 2 puntos que pierde la dejarían en 0 (Manual del jugador, pág. 285).`;
}

/**
 * Si después de la clase de monstruo tomó niveles de otra clase: `ninguno`; `conocidos`, con el orden conocido en los de la
 * clase de monstruo y en todos los de después (se puede: contrato, «Con niveles de otra clase después»); o `por_conocer`, si
 * alguno lo tiene por conocer (`409 vuelta_niveles_despues`: no se sabe qué nivel de personaje era cada uno). Con el orden
 * real, un nivel de otra clase detrás del primero de la de monstruo; con todo el orden por conocer, si la terminó
 * (`Nivel_max_claseo`) y tiene otras (se termina antes de tomar otra, así que fueron después).
 */
export function nivelesDespuesDeLaClase(niveles: PersonajeCreateNivelDto[] | undefined, idClase: number,
    clase: Pick<Clase, 'Nivel_max_claseo'> | null | undefined, clases: ReadonlyArray<{ idClase: number; nivel: number; }>)
    : 'ninguno' | 'conocidos' | 'por_conocer' {
    const id = toInt(idClase);
    const lista = niveles ?? [];
    if (ordenPorConocer(lista)) {
        const nivel = toInt(clases.find((c) => toInt(c.idClase) === id)?.nivel);
        const terminada = toInt(clase?.Nivel_max_claseo) > 0 && nivel >= toInt(clase?.Nivel_max_claseo);
        return terminada && clases.some((c) => toInt(c.idClase) !== id && toInt(c.nivel) > 0) ? 'por_conocer' : 'ninguno';
    }
    const primera = lista.findIndex((n) => toInt(n?.idClase) === id);
    const desde = primera >= 0 ? lista.slice(primera) : [];
    if (!desde.some((n) => toInt(n?.idClase) !== id && ordenConocido(n)))
        return 'ninguno';
    return desde.every((n) => ordenConocido(n)) ? 'conocidos' : 'por_conocer';
}

/** Lo que se puede hacer: por qué no se puede (`motivo`), por qué no con *resurrección* (`motivoConResurreccion`) y sus DG. */
export interface EstadoDeLaVuelta {
    motivo: string | null;
    motivoConResurreccion: string | null;
    /** Los niveles de la clase de monstruo que pierde. */
    nivelesDeLaClase: number;
    /** Los DG que le quedan sin la clase de monstruo (de clase, raciales y de plantilla). */
    dgsSinLaClase: number;
    /** Si sin la clase de monstruo le quedan niveles de otra clase. */
    conOtrasClases: boolean;
    /** Si sin la clase de monstruo no le queda ningún DG: gana el 1.er nivel de una clase básica (contrato, «Sin ningún DG»). */
    ganaNivel: boolean;
    /**
     * Si después de la clase de monstruo tomó niveles de otra clase, con su orden conocido: se renumeran (contrato, «Con
     * niveles de otra clase después»).
     */
    conNivelesDespues: boolean;
}

/**
 * Cuándo se puede devolver la vida (los `409` del contrato), con los datos: su raza lleva una clase de monstruo
 * (`claseDeMonstruo`), sus niveles son los últimos y tiene una Constitución guardada; y con *resurrección*, que el nivel de
 * más no sea un DG racial y que, con un solo DG o con el 1.er nivel que gana sin ninguno (`ganaNivel`), los 2 puntos de
 * Constitución no la dejen en 0 (`constitucion`, la guardada). `dgs`, sus DG de ahora.
 */
export function estadoDeLaVuelta(d: {
    claseDeMonstruo: Clase | null;
    niveles: PersonajeCreateNivelDto[] | undefined;
    clases: ReadonlyArray<{ idClase: number; nivel: number; }>;
    dgs: number;
    constitucion: number | null;
}): EstadoDeLaVuelta {
    const vacio: EstadoDeLaVuelta = {
        motivo: null, motivoConResurreccion: null, nivelesDeLaClase: 0, dgsSinLaClase: Math.max(0, toInt(d.dgs)), conOtrasClases: false, ganaNivel: false,
        conNivelesDespues: false,
    };
    const clase = d.claseDeMonstruo;
    if (!clase || toInt(clase.Id) < 1)
        return { ...vacio, motivo: MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO };
    const id = toInt(clase.Id);
    const nivelesDeLaClase = toInt(d.clases.find((c) => toInt(c.idClase) === id)?.nivel);
    const conOtrasClases = d.clases.some((c) => toInt(c.idClase) !== id && toInt(c.nivel) > 0);
    const dgsSinLaClase = Math.max(0, toInt(d.dgs) - dgsDeClase(clase, nivelesDeLaClase));
    const despues = nivelesDespuesDeLaClase(d.niveles, id, clase, d.clases);
    const estado: EstadoDeLaVuelta = {
        ...vacio, nivelesDeLaClase, dgsSinLaClase, conOtrasClases, ganaNivel: dgsSinLaClase < 1, conNivelesDespues: despues === 'conocidos',
    };
    if (despues === 'por_conocer')
        return { ...estado, motivo: MOTIVO_VUELTA_NIVELES_DESPUES };
    // Sin una puntuación guardada no vuelve con ninguna (`409 perdida_sin_constitucion`).
    if (d.constitucion === null)
        return { ...estado, motivo: motivoSinConstitucionParaVolver(null) };
    // Con un solo DG, o con el 1.er nivel que gana, es de 1.er nivel: paga con 2 puntos de Constitución.
    if (dgsSinLaClase <= 1) {
        if (toInt(d.constitucion) - CONSTITUCION_PERDIDA < 1)
            return { ...estado, motivoConResurreccion: motivoSinConstitucionParaVolver(d.constitucion) };
    } else if (!conOtrasClases)
        return { ...estado, motivoConResurreccion: MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL };
    return estado;
}

/**
 * Si la clase vale para el 1.er nivel que gana sin ningún DG: una básica, ni de prestigio (`Prestigio`) ni de monstruo (la
 * que lleva una raza mutada, `Mutacion`, o de progresión obligatoria), como la API (`vuelta_a_la_vida.clase_nueva_de_la_ficha`).
 * Las demás no se ofrecen (`400 vuelta_clase_nueva_no_valida`).
 */
export function esClaseParaVolverSinDg(clase: Pick<Clase, 'Prestigio' | 'Mutacion' | 'Progresion_obligatoria'> | null | undefined): boolean {
    return !!clase && clase.Prestigio !== true && toInt(clase.Mutacion?.Id) < 1 && clase.Progresion_obligatoria !== true;
}

/**
 * Las clases restringidas (`Multiclase_restringida`: el paladín, el monje) que tuvo antes de la clase de monstruo y que
 * siguen cerradas para el 1.er nivel que gana sin ningún DG (*Manual del jugador*, págs. 52 y 55), con su motivo: las de un
 * nivel perdido (`nivelesPerdidos`, también el que perdió al convertirse) que no es posterior a la clase de monstruo (no la
 * tiene en sus `clasesAnteriores`), porque sus niveles fueron de otra clase aunque ahora los pierda. No la cierra si su raza
 * la deja dejar y retomar (`libres`, `Clases_multiclase_libre`) ni si la clase de monstruo es de sus compatibles. Quien
 * nunca la tuvo puede empezarla. El motor solo cierra las que siguen en sus niveles, y aquí no le queda ninguno.
 */
export function restringidasCerradasAlVolver(d: {
    nivelesPerdidos: ReadonlyArray<Pick<NivelPerdido, 'idClase' | 'ordenConocido' | 'clasesAnteriores'>>;
    claseDeMonstruo: Pick<Clase, 'Id' | 'Nombre'>;
    clase: (id: number) => Clase | null | undefined;
    libres?: ReadonlyArray<number>;
}): Map<number, string> {
    const idMonstruo = toInt(d.claseDeMonstruo.Id);
    const libres = new Set((d.libres ?? []).map((id) => toInt(id)));
    const contexto: ContextoCompatibles = { tiene: [idMonstruo], clase: (id) => d.clase(id) ?? undefined };
    const cerradas = new Map<number, string>();
    (d.nivelesPerdidos ?? []).forEach((p) => {
        const id = toInt(p.idClase);
        const clase = d.clase(id);
        if (!clase?.Multiclase_restringida || id === idMonstruo || libres.has(id) || p.ordenConocido === false
            || (p.clasesAnteriores ?? []).some((c) => toInt(c) === idMonstruo) || esClaseCompatibleConRestringida(clase, idMonstruo, contexto))
            return;
        cerradas.set(id, `Tras ganar niveles de ${`${d.claseDeMonstruo.Nombre ?? ''}`.trim().toLowerCase()} ya no puede volver a subir de `
            + `${`${clase.Nombre ?? ''}`.trim().toLowerCase()}, aunque los pierda (Manual del jugador, págs. 52 y 55).`);
    });
    return cerradas;
}

/**
 * Los PG del 1.er nivel que gana sin ningún DG: el máximo del dado de su clase (`caras`) con el modificador de su
 * Constitución (`constitucion`, ya con los 2 puntos que paga con *resurrección*), al menos 1 (*Manual del jugador*, pág. 23).
 */
export function pgDelPrimerNivel(caras: number, constitucion: number): PgSubida {
    const mod = modificadorCaracteristica(toInt(constitucion));
    return puntosGolpeTrasSubida({ pgAntes: 0, modConAntes: mod, modConDespues: mod, tiradasAnteriores: [], dgsSinTirada: 0, tirada: Math.max(1, toInt(caras)) });
}

/**
 * El NEP tras devolverle la vida: el de ahora sin los niveles que pierde (`nivelesQuitados`: los de la clase de monstruo y,
 * con *resurrección*, el de más) y con el ajuste y los DG raciales que cuentan de su raza de antes (`base`) en lugar de los
 * de la mutada (`actual`, la combinada), como la conversión (`nepTrasLaMutacion`). El enano guerrero 4 / engendro 1 (NEP 5),
 * 4 sin el engendro y 3 con el nivel de más; el gnoll engendro 1 (NEP 4), 3.
 */
export function nepTrasLaVuelta(nepAntes: number, nivelesQuitados: number, actual: RazaDelNep, base: RazaDelNep, nivelesClaseAntes: number): number {
    const quitados = Math.max(0, toInt(nivelesQuitados));
    return nepTrasLaMutacion(Math.max(0, toInt(nepAntes) - quitados), actual, base, toInt(nivelesClaseAntes),
        Math.max(0, toInt(nivelesClaseAntes) - quitados));
}

/**
 * Los PX, como en toda pérdida de nivel (*Manual del jugador*, pág. 171): la mitad entre el mínimo del nivel sin la clase de
 * monstruo (`nepTrasQuitar`) y el del siguiente, o los suyos si ya tenía menos (`enMedio`); con el nivel de más, otra vez
 * con el NEP final (`nepFinal`; `null` sin él). El enano guerrero 4 / engendro 1 con 8.000: 8.000 y, con resurrección, 4.500.
 */
export function pxTrasLaVuelta(px: number, nepTrasQuitar: number, nepFinal: number | null): { enMedio: number; despues: number; } {
    const enMedio = pxTrasPerder(px, Math.max(1, toInt(nepTrasQuitar)));
    return { enMedio, despues: nepFinal === null ? enMedio : pxTrasPerder(enMedio, Math.max(1, toInt(nepFinal))) };
}

/**
 * La ficha sin los niveles de la clase de monstruo (`sinLosNiveles`, sin Constitución) con su Constitución de vuelta
 * (`constitucion`, la guardada): sin la marca `perdido` y con su modificador otra vez en todos sus DG (`dgs`, los que le
 * quedan), con las tiradas guardadas. Sobre ella se pierde el nivel de más, como en «Perder un nivel».
 */
export function conLaConstitucionDeVuelta(sinLosNiveles: PersonajeCreateRequestDto, constitucion: number, dgs: number)
    : { ficha: PersonajeCreateRequestDto; pg: PgSubida; } {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(sinLosNiveles));
    const pg = pgTrasCambioDeCon(sinLosNiveles, Math.max(1, toInt(dgs)), modificadorCaracteristica(toInt(constitucion)), null);
    ficha.caracteristicas = { ...ficha.caracteristicas, constitucion: { ...(ficha.caracteristicas?.constitucion ?? { minimo: 0 }), valor: toInt(constitucion), perdido: false } as any };
    ficha.personaje.puntosGolpe = pg.total;
    return { ficha, pg };
}

/**
 * Lo que quitan varios niveles perdidos uno tras otro (los de la clase de monstruo, `fichaSinElNivel` cada uno), junto,
 * para «Lo que cambia» (`filasDelNivelPerdido`): el ataque base del primero al último, lo que baja cada salvación, las
 * listas y los rangos sumados. Los incrementos no: el cambio de sus características lo da el motor, ya con todo.
 */
export function sumarPerdidas(perdidas: ReadonlyArray<ResultadoPerdida>): ResultadoPerdida | null {
    if (perdidas.length < 1)
        return null;
    const quitado = quitadoVacio();
    const salvaciones: ResultadoPerdida['salvaciones'] = {};
    perdidas.forEach((p) => {
        quitado.dotes.push(...p.quitado.dotes);
        quitado.especiales.push(...p.quitado.especiales);
        quitado.idiomas.push(...p.quitado.idiomas);
        quitado.dominios.push(...p.quitado.dominios);
        quitado.conjuros.push(...p.quitado.conjuros);
        quitado.vuelven.push(...p.quitado.vuelven);
        p.quitado.rangos.forEach((r) => {
            const ya = quitado.rangos.find((x) => x.idHabilidad === r.idHabilidad && x.idExtra === r.idExtra);
            if (ya)
                ya.rangos += r.rangos;
            else
                quitado.rangos.push({ ...r });
        });
        Object.entries(p.salvaciones).forEach(([k, v]) => {
            const clave = k as keyof ResultadoPerdida['salvaciones'];
            salvaciones[clave] = toInt(salvaciones[clave]) + toInt(v);
        });
    });
    const primera = perdidas[0];
    const ultima = perdidas[perdidas.length - 1];
    return {
        ficha: ultima.ficha, quitado, salvaciones,
        pg: { antes: primera.pg.antes, despues: ultima.pg.despues, exacto: perdidas.every((p) => p.pg.exacto) },
        ataqueBase: { antes: primera.ataqueBase.antes, despues: ultima.ataqueBase.despues },
        avisos: Array.from(new Set(perdidas.flatMap((p) => p.avisos))),
    };
}

/** Las aptitudes de las tablas de sus clases en los niveles que tiene (`{ idEspecial, idExtra }`), sin repetir. */
export function especialesDeLasTablas(clases: ReadonlyArray<{ clase: Pick<Clase, 'Desglose_niveles'> | null | undefined; nivel: number; }>)
    : Array<{ idEspecial: number; idExtra: number; }> {
    const lista: Array<{ idEspecial: number; idExtra: number; }> = [];
    clases.forEach(({ clase, nivel }) => {
        for (let n = 1; clase && n <= toInt(nivel); n++)
            (filaDeNivel(clase, n)?.Especiales ?? []).forEach((e) => {
                const especial = { idEspecial: toInt((e?.Especial as any)?.Id), idExtra: Math.max(0, toInt(e?.Id_extra)) };
                if (especial.idEspecial > 0 && !lista.some((x) => x.idEspecial === especial.idEspecial && x.idExtra === especial.idExtra))
                    lista.push(especial);
            });
    });
    return lista;
}

export interface EntradaFichaVuelta {
    /** La `entrada` de la sesión de juego abierta, con la raza mutada. */
    entrada: PersonajeCreateRequestDto;
    /**
     * La misma sin los niveles que pierde (`fichaSinElNivel`, uno tras otro, y la Constitución de vuelta,
     * `conLaConstitucionDeVuelta`): sus niveles y sus clases, lo que se eligió en ellos, el ataque base, las salvaciones de
     * clase, los PG y la Constitución con que vuelve.
     */
    sinLosNiveles: PersonajeCreateRequestDto;
    /** El cuerpo del alta que arma el motor antes de todo y después (sin los niveles y con la raza de antes). */
    antes: PersonajeCreateRequestDto;
    despues: PersonajeCreateRequestDto;
    /** Las aptitudes que sustituía la raza (`Especiales_sustituidos`) y las de las tablas de sus clases (`especialesDeLasTablas`). */
    sustituidos: ReadonlyArray<EspecialSustituido>;
    deLasTablas: Array<{ idEspecial: number; idExtra: number; }>;
    /** Las dotes que se quedan sin un prerrequisito (`sinPrerrequisitos`) y las que lo vuelven a cumplir (sin la marca). */
    marcar: ReadonlyArray<{ idDote: number; idExtra: number; origen?: string; }>;
    desmarcar: ReadonlyArray<{ idDote: number; idExtra: number; origen?: string; }>;
    /**
     * Con niveles de otra clase después, la dote por nivel de personaje que le faltaba (como la da el cuerpo del motor): la
     * única que se añade (contrato, «Con niveles de otra clase después»).
     */
    dotesNuevas?: ReadonlyArray<Record<string, any>>;
}

/**
 * La ficha que se manda a `POST /personajes/{id}/vuelta-a-la-vida`, hecha con el motor de la creación: la de sin los
 * niveles (`sinLosNiveles`) con lo que cambia el motor entre el principio y el final (las características, salvo la
 * Constitución, que va como vuelve; los modificadores; los rangos; el tipo; los rasgos, los subtipos y lo demás de la raza,
 * también lo que quita: `LISTAS_DE_LA_RAZA`). La raza es la de antes (`idRaza` su base de ahora, `idRazaBase` vacío). No se
 * añade nada (el contrato no lo admite): las dotes, los idiomas, los dominios y los conjuros son los que le quedan, sin los
 * que solo traía la raza mutada; las aptitudes, las que le quedan con las que la raza sustituía otra vez de la tabla de su
 * clase (`especialesDevueltos`). Las dotes, con `sinPrerrequisitos` vuelta a evaluar.
 */
export function fichaDeLaVuelta(d: EntradaFichaVuelta): PersonajeCreateRequestDto {
    const sin = d.sinLosNiveles;
    const clon = <T>(x: T): T => JSON.parse(JSON.stringify(x ?? null));
    // Lo que cambia el motor, sobre lo guardado: el motor ha quitado ya los incrementos, los rangos y lo que daban las dotes
    // de esos niveles, así que se parte de las características, los modificadores y los rangos de la `entrada`.
    const base: PersonajeCreateRequestDto = {
        ...clon(sin),
        caracteristicas: clon(d.entrada.caracteristicas),
        modificadores: clon(d.entrada.modificadores),
        colecciones: { ...clon(sin.colecciones), habilidades: clon(d.entrada.colecciones?.habilidades) } as any,
    };
    const ficha = fichaConLoDelMotor({
        entrada: base, antes: d.antes, despues: d.despues, puntosGolpe: toInt(sin.personaje.puntosGolpe),
        seConservan: SE_CONSERVAN_EN_MUTACION, quitarEn: LISTAS_DE_LA_RAZA,
    });
    ficha.personaje.idRaza = toInt(d.entrada.personaje.idRazaBase);
    ficha.personaje.idRazaBase = null;
    ficha.caracteristicas = { ...ficha.caracteristicas, constitucion: clon(sin.caracteristicas.constitucion) };

    const col: any = ficha.colecciones;
    const colSin: any = sin.colecciones ?? {};
    const colA: any = d.antes.colecciones ?? {};
    const colD: any = d.despues.colecciones ?? {};
    // Las dotes: las que le quedan, sin las que solo traía la raza mutada (las que quita el motor).
    const dotes: any[] = [...(colSin.dotes ?? [])].map((x) => ({ ...x }));
    diferencia(colA.dotes ?? [], colD.dotes ?? []).quitados
        .forEach((q) => sacarDoteDeLaFicha(dotes, toInt(q['idDote']), toInt(q['idExtra']), `${q['origen'] ?? ''}`.trim() || null));
    col.dotes = [...dotes, ...(d.dotesNuevas ?? []).map((x) => ({ ...x }))];
    // Los idiomas: los que le quedan, sin los que solo traía la raza mutada.
    const idiomasQuitados = diferencia(colA.idiomas ?? [], colD.idiomas ?? []).quitados.map((i) => toInt(i['idIdioma']));
    const idiomas = [...(colSin.idiomas ?? [])];
    idiomasQuitados.forEach((id) => sacarPrimero(idiomas, (x: any) => toInt(x?.idIdioma) === id));
    col.idiomas = idiomas;
    col.dominios = [...(colSin.dominios ?? [])];
    col.conjurosConocidos = [...(colSin.conjurosConocidos ?? [])];
    col.especiales = especialesDevueltos(colSin.especiales ?? [], d.sustituidos, d.deLasTablas,
        (e: any) => ({ id: toInt(e?.idEspecial), extra: Math.max(0, toInt(e?.idExtra)) }));
    if (ficha.decisionesHomebrew)
        ficha.decisionesHomebrew = sinDecisionesDeDotesQueNoTiene(ficha.decisionesHomebrew, col.dotes);
    return marcarDotesSinPrerrequisitos(ficha, d.marcar, d.desmarcar);
}

// --- Con niveles de otra clase después: la renumeración -------------------------------------------------------------
//
// Contrato, «Con niveles de otra clase después», y dictamen del máster de Rol del 2026-11-20, parte B: quitar los niveles de
// la clase de monstruo, que no son los últimos, baja el nivel de personaje de los de después, y con él lo que va por nivel
// de personaje (las dotes y los incrementos, el máximo de rangos y el primer DG). El nivel de personaje son los DG totales,
// sin el ajuste de nivel; un nivel sin DG (*Libris Mortis*) no lo sube.

/** La clave de un nivel de su registro (su clase y su nivel en ella), que no cambia al quitar otros. */
export function claveDelNivel(nivel: Pick<PersonajeCreateNivelDto, 'idClase' | 'nivelClase'>): string {
    return `${toInt(nivel?.idClase)}:${toInt(nivel?.nivelClase)}`;
}

/** Un nivel de su registro con su nivel de personaje. */
export interface NivelDePersonaje {
    /** Su lugar en el registro. */
    indice: number;
    idClase: number;
    nivelClase: number;
    /** Los DG hasta él, con los de antes de su primer nivel (raciales que cuentan y de plantilla). */
    nivelPersonaje: number;
    daDg: boolean;
    /** Si su clase tiene tabla por nivel (las de monstruo): sus dotes van por su tabla, no cada 3 niveles de personaje. */
    conTabla: boolean;
}

/** Los DG de antes de su primer nivel de clase (los raciales que cuentan y los de plantilla): los suyos sin los de sus niveles. */
export function dgsAntesDeSusNiveles(dgs: number, niveles: PersonajeCreateNivelDto[] | undefined,
    clase: (idClase: number) => ClaseConTabla | null | undefined): number {
    const deSusNiveles = (niveles ?? []).filter((n) => daDgEnNivel(clase(toInt(n?.idClase)), toInt(n?.nivelClase))).length;
    return Math.max(0, toInt(dgs) - deSusNiveles);
}

/** Cada nivel de su registro con su nivel de personaje (`dgsAntes`, los DG de antes del primero: `dgsAntesDeSusNiveles`). */
export function nivelesDePersonaje(niveles: PersonajeCreateNivelDto[] | undefined, clase: (idClase: number) => ClaseConTabla | null | undefined,
    dgsAntes: number): NivelDePersonaje[] {
    let nivelPersonaje = Math.max(0, toInt(dgsAntes));
    return (niveles ?? []).map((n, indice) => {
        const deLaClase = clase(toInt(n?.idClase));
        const daDg = daDgEnNivel(deLaClase, toInt(n?.nivelClase));
        if (daDg)
            nivelPersonaje++;
        return { indice, idClase: toInt(n?.idClase), nivelClase: toInt(n?.nivelClase), nivelPersonaje, daDg, conTabla: tieneTablaPorNivel(deLaClase) };
    });
}

/** Una dote o un incremento por nivel de personaje apuntado en un nivel: su lugar en el registro y lo elegido. */
export interface Apuntado {
    indice: number;
    eleccion: PersonajeCreateNivelEleccionDto;
}

/** Lo que sobra (el apuntado en el nivel más reciente) o el hito que se queda sin el suyo, de una cuenta por nivel de personaje. */
export interface RecuentoDeHitos {
    sobra: Apuntado | null;
    falta: { indice: number; nivelPersonaje: number; } | null;
}

/**
 * Lo apuntado (`apuntados`) comparado con lo que dan los hitos con el nivel nuevo (`hitos`): si sobra, el del nivel más
 * reciente (*Guía del DM*, pág. 295); si falta, el hito que se queda sin él. Cada apuntado cubre el hito más alto que no pasa
 * de su nivel, del más reciente al primero, y falta el más bajo sin cubrir (en el 1.er nivel, una dote «solo a 1.er nivel»).
 * Las cuentas solo dejan sobrar o faltar uno (dictamen, punto 6).
 */
export function recontarHitos(hitos: ReadonlyArray<NivelDePersonaje>, apuntados: ReadonlyArray<Apuntado>): RecuentoDeHitos {
    if (apuntados.length > hitos.length)
        return { sobra: apuntados.reduce((ultimo, a) => a.indice >= ultimo.indice ? a : ultimo), falta: null };
    if (apuntados.length === hitos.length)
        return { sobra: null, falta: null };
    const libres = [...hitos].sort((a, b) => a.indice - b.indice);
    [...apuntados].sort((a, b) => b.indice - a.indice).forEach((a) => {
        const i = libres.map((h) => h.indice <= a.indice).lastIndexOf(true);
        if (i >= 0)
            libres.splice(i, 1);
    });
    const hito = libres[0] ?? hitos[hitos.length - 1];
    return { sobra: null, falta: { indice: hito.indice, nivelPersonaje: hito.nivelPersonaje } };
}

/**
 * Las dotes y los incrementos por nivel de personaje vueltos a contar con el nivel nuevo (*Manual del jugador*, pág. 22,
 * tabla 3-2): `niveles`, los que se quedan con sus elecciones; `ahora`, su nivel de personaje nuevo (`nivelesDePersonaje`), y
 * `antes`, el que tenía cada uno (por `claveDelNivel`). Las dotes, las de nivel de personaje (`esDotePorNivelDePersonaje`)
 * de los niveles sin tabla, con un hito en el 1.º y cada 3; en una clase con tabla van por su tabla y no cuentan. Los
 * incrementos, cada 4: el último apuntado en un nivel que lo daba por su nivel de personaje de antes (el de una aptitud de
 * su clase se apunta antes y no cuenta).
 */
export function recuentoPorNivelDePersonaje(niveles: PersonajeCreateNivelDto[], ahora: ReadonlyArray<NivelDePersonaje>,
    antes: ReadonlyMap<string, NivelDePersonaje>): { dotes: RecuentoDeHitos; incrementos: RecuentoDeHitos; } {
    const dotes: Apuntado[] = [];
    const incrementos: Apuntado[] = [];
    ahora.forEach((n) => {
        const elecciones = niveles[n.indice]?.elecciones ?? [];
        if (!n.conTabla)
            elecciones.filter((e) => esDotePorNivelDePersonaje(e)).forEach((eleccion) => dotes.push({ indice: n.indice, eleccion }));
        const previo = antes.get(claveDelNivel(n));
        const incremento = [...elecciones].reverse().find((e) => e.tipo === 'incremento');
        if (incremento && previo?.daDg && daIncrementoPorNivelDePersonaje(previo.nivelPersonaje))
            incrementos.push({ indice: n.indice, eleccion: incremento });
    });
    return {
        dotes: recontarHitos(ahora.filter((n) => n.daDg && !n.conTabla && daDotePorNivelDePersonaje(n.nivelPersonaje)), dotes),
        incrementos: recontarHitos(ahora.filter((n) => n.daDg && daIncrementoPorNivelDePersonaje(n.nivelPersonaje)), incrementos),
    };
}

/**
 * El nivel que pasa a ser su primer DG (sin DG raciales ni de plantilla antes): el primero con DG, si ahora es su 1.er nivel
 * de personaje y antes no lo era (`antes`, por `claveDelNivel`); `null` si no.
 */
export function primerDgTrasRenumerar(ahora: ReadonlyArray<NivelDePersonaje>, antes: ReadonlyMap<string, NivelDePersonaje>): NivelDePersonaje | null {
    const primero = ahora.find((n) => n.daDg);
    return primero && primero.nivelPersonaje === 1 && toInt(antes.get(claveDelNivel(primero))?.nivelPersonaje) > 1 ? primero : null;
}

/**
 * Los puntos de habilidad que gana el nivel que pasa a ser su primer DG: la diferencia hasta ×4, 3 × (la base de su clase +
 * el modificador de Inteligencia que tenía en ese nivel), y lo que su raza da de más en el primero (el humano, 4 en vez de
 * 1: 3 más; *Manual del jugador*, págs. 13 y 62). La misma cuenta que al crear (`puntosHabilidadNivelClase`).
 */
export function puntosDelPrimerDg(clase: Pick<Clase, 'Puntos_habilidad'> | null | undefined, modInteligencia: number,
    raza: Pick<Raza, 'Puntos_habilidad_extra_primer_nivel' | 'Puntos_habilidad_extra_por_nivel'> | null | undefined): number {
    const comun = {
        puntosClase: toInt(clase?.Puntos_habilidad?.Valor), modInteligencia: toInt(modInteligencia),
        extraPrimerNivel: toInt(raza?.Puntos_habilidad_extra_primer_nivel), extraPorNivel: toInt(raza?.Puntos_habilidad_extra_por_nivel),
    };
    return Math.max(0, puntosHabilidadNivelClase({ ...comun, primerNivelPersonaje: true }) - puntosHabilidadNivelClase({ ...comun, primerNivelPersonaje: false }));
}

/**
 * Lo que suben los PG del nivel que pasa a ser su primer DG: su dado al máximo (*Manual del jugador*, pág. 23) en lugar de
 * lo que salió (su tirada guardada; sin ella, la media, y no es exacto), con la Constitución de ahora y al menos 1 cada uno.
 */
export function pgDelPrimerDg(pg: PersonajeCreateNivelDto['pg'] | null | undefined, caras: number, modConstitucion: number)
    : { suma: number; exacto: boolean; } {
    if (pg?.maximo)
        return { suma: 0, exacto: true };
    const dado = Math.max(1, toInt(caras));
    const tirada = toInt(pg?.tirada);
    const salio = tirada > 0 ? tirada : Math.floor(dado / 2) + 1;
    const mod = toInt(modConstitucion);
    return { suma: Math.max(1, dado + mod) - Math.max(1, salio + mod), exacto: tirada > 0 };
}

/** Unos rangos quitados de lo comprado en un nivel: su lugar en el registro, la habilidad, cuántos y lo que costó cada uno. */
export interface RangosDelNivel extends RangosQuitados {
    indice: number;
    idHabilidad: number;
    idExtra: number;
}

/**
 * Los rangos que pasan del máximo con el nivel de personaje nuevo (`habilidades`, cada una con los que tiene y su máximo
 * final: nivel + 3, la mitad si no es de ninguna de sus clases; *Manual del jugador*, pág. 62), quitados de lo comprado en
 * sus niveles (sus elecciones `rangos`) desde el último hacia atrás, con lo que costó cada rango en ese nivel (`coste`). Da
 * los niveles con sus elecciones cambiadas y lo quitado de cada uno: sus puntos vuelven a ese nivel (`puntosDevueltos`). Lo
 * que no se compró en un nivel (los DG raciales) no se toca.
 */
export function rangosQueSobran(niveles: PersonajeCreateNivelDto[],
    habilidades: ReadonlyArray<{ idHabilidad: number; idExtra: number; rangos: number; maximo: number; }>,
    coste: (indice: number, idHabilidad: number, idExtra: number) => number): { niveles: PersonajeCreateNivelDto[]; quitados: RangosDelNivel[]; } {
    const lista = niveles.map((n) => ({ ...n, elecciones: (n.elecciones ?? []).map((e) => ({ ...e })) }));
    const quitados: RangosDelNivel[] = [];
    habilidades.forEach((h) => {
        const idHabilidad = toInt(h.idHabilidad);
        const idExtra = Math.max(0, toInt(h.idExtra));
        let sobra = toInt(h.rangos) - Math.max(0, toInt(h.maximo));
        for (let i = lista.length - 1; i >= 0 && sobra > 0; i--) {
            const elecciones = lista[i].elecciones;
            for (let k = elecciones.length - 1; k >= 0 && sobra > 0; k--) {
                const e = elecciones[k];
                if (e.tipo !== 'rangos' || toInt(e.idElemento) !== idHabilidad || !mismoExtraDeHabilidad(e.idExtra, idExtra))
                    continue;
                const quita = Math.min(sobra, Math.max(0, toInt(e.valor)));
                if (quita < 1)
                    continue;
                sobra -= quita;
                if (quita >= toInt(e.valor))
                    elecciones.splice(k, 1);
                else
                    e.valor = toInt(e.valor) - quita;
                const ya = quitados.find((q) => q.indice === i && q.idHabilidad === idHabilidad && q.idExtra === idExtra);
                if (ya)
                    ya.rangos += quita;
                else
                    quitados.push({ indice: i, idHabilidad, idExtra, rangos: quita, coste: Math.max(1, toInt(coste(i, idHabilidad, idExtra))) });
            }
        }
    });
    return { niveles: lista, quitados };
}

/** Lo que el motor ha apuntado en cada nivel de su registro entre `antes` y `despues` (`getOrdenNiveles`), por su lugar. */
export function eleccionesApuntadas(antes: ReadonlyArray<Pick<PersonajeCreateNivelDto, 'elecciones'>>,
    despues: ReadonlyArray<Pick<PersonajeCreateNivelDto, 'elecciones'>>): PersonajeCreateNivelEleccionDto[][] {
    return despues.map((n, i) => (n.elecciones ?? []).slice((antes[i]?.elecciones ?? []).length).map((e) => ({ ...e })));
}

/** Lo que enseña «Lo que cambia» de la renumeración. */
export interface ResumenRenumerado {
    /** Los puestos que bajan los niveles de después (los DG de la clase de monstruo). */
    puestos: number;
    /** El nivel de personaje del primero y del último de los de después que le quedan, antes y ahora (`null` sin ninguno). */
    niveles: { desde: { antes: number; ahora: number; }; hasta: { antes: number; ahora: number; }; } | null;
    /** El nivel que pasa a ser su primer DG: su clase, su nivel en ella y su lugar en el registro, su dado y los puntos ×4 que gana. */
    primerDg: { clase: string; nivelClase: number; indice: number; caras: number; modConstitucion: number; puntos: number; } | null;
    dotePerdida: string | null;
    doteElegida: { nombre: string; nivelPersonaje: number; } | null;
    incrementoPerdido: { nombre: string; antes: number; ahora: number; inteligencia: boolean; } | null;
    incrementoElegido: { nombre: string; nivelPersonaje: number; } | null;
    /** El máximo de rangos de una habilidad de clase con el nivel nuevo, lo que pasaba de él y lo repartido otra vez. */
    maximoDeRangos: number;
    rangosQuitados: Array<{ nombre: string; rangos: number; nivel: string; }>;
    rangosRepartidos: Array<{ nombre: string; rangos: number; nivel: string; }>;
    /** Las de prestigio que dejan de cumplir lo que piden (un ataque base, unos rangos, una dote de los niveles quitados). */
    prestigio: Array<{ nombre: string; razones: string[]; }>;
}

/** Las filas de «Lo que cambia» de la renumeración (contrato, «Con niveles de otra clase después»). */
export function filasDeLaRenumeracion(r: ResumenRenumerado): CambioPlantilla[] {
    const filas: CambioPlantilla[] = [];
    if (r.niveles) {
        const { desde, hasta } = r.niveles;
        const tramo = (k: 'antes' | 'ahora') => `Nivel de personaje ${desde[k] === hasta[k] ? `${desde[k]}.º` : `${desde[k]}.º a ${hasta[k]}.º`}`;
        filas.push({
            que: 'Niveles de después', antes: tramo('antes'), ahora: tramo('ahora'),
            porque: `Bajan ${r.puestos} ${r.puestos === 1 ? 'puesto' : 'puestos'}: los DG de la clase de monstruo ya no cuentan. Lo de su clase (el ataque base, las salvaciones, su tabla) no cambia`,
        });
    }
    if (r.primerDg) {
        const p = r.primerDg;
        const mod = `${p.modConstitucion < 0 ? '−' : '+'} ${Math.abs(p.modConstitucion)}`;
        filas.push({
            que: 'Primer DG', antes: `${p.clase} ${p.nivelClase}`, ahora: 'Pasa a ser su primer DG',
            porque: `PG al máximo (${p.caras} ${mod} Con) y ${p.puntos} puntos de habilidad más (×4), que reparte en ese nivel (Manual del jugador, págs. 23 y 62)`,
        });
    }
    const hito = 'Con su nivel de personaje nuevo';
    if (r.dotePerdida)
        filas.push({ que: 'Dote por nivel de personaje', antes: r.dotePerdida, ahora: '—', porque: `${hito} le sobra una: pierde la del nivel más reciente (Guía del DM, pág. 295)` });
    if (r.doteElegida)
        filas.push({ que: 'Dote por nivel de personaje', antes: '—', ahora: r.doteElegida.nombre, porque: `${hito} le falta la de su ${r.doteElegida.nivelPersonaje}.º nivel` });
    if (r.incrementoPerdido) {
        const i = r.incrementoPerdido;
        filas.push({
            que: `${i.nombre} (incremento)`, antes: `${i.antes}`, ahora: `${i.ahora}`,
            porque: `${hito} le sobra un incremento: pierde el del nivel más reciente${i.inteligencia ? '; no quita puntos de habilidad, que no eran retroactivos' : ''}`,
        });
    }
    if (r.incrementoElegido)
        filas.push({ que: 'Incremento', antes: '—', ahora: `+1 ${r.incrementoElegido.nombre}`, porque: `${hito} le falta el de su ${r.incrementoElegido.nivelPersonaje}.º nivel` });
    if (r.rangosQuitados.length)
        filas.push({
            que: 'Rangos que pasan del máximo', antes: r.rangosQuitados.map((q) => `${q.nombre} −${q.rangos} (${q.nivel})`).join(', '), ahora: '—',
            porque: `El máximo, con su nivel de personaje nuevo, es ${r.maximoDeRangos} (la mitad si no es de ninguna de sus clases): se quitan desde los últimos niveles y sus puntos vuelven a ese nivel (Manual del jugador, pág. 62)`,
        });
    if (r.rangosRepartidos.length)
        filas.push({
            que: 'Rangos repartidos', antes: '—', ahora: r.rangosRepartidos.map((q) => `${q.nombre} +${q.rangos} (${q.nivel})`).join(', '),
            porque: 'Los puntos que vuelven y los de su primer DG, en el nivel del que salen, con el coste de su clase',
        });
    r.prestigio.forEach((c) => filas.push({
        que: c.nombre, antes: 'Cumple lo que pide', ahora: c.razones.join(' · ') || 'Ya no lo cumple', aviso: true,
        porque: 'Conserva sus niveles, pero pierde sus aptitudes y no sube en ella mientras no lo cumpla (El arcano completo, pág. 17)',
    }));
    return filas;
}

// --- El resumen ---------------------------------------------------------------------------------------------------------

export interface EntradaCambiosVuelta {
    /** La ficha del motor antes y después (el tipo, las características, los rasgos). */
    antes: Personaje;
    despues: Personaje;
    /** La raza mutada de ahora y la de antes, a la que vuelve. */
    raza: string;
    razaDeAntes: string;
    claseDeMonstruo: string;
    nivelesDeLaClase: number;
    /** Lo que daban los niveles de la clase de monstruo (`filasDelNivelPerdido`). */
    loQueDaban: FilaPerdida[];
    /** Con *resurrección*: el nivel de más (su fila y lo que daba) o, con un solo DG, los 2 puntos de Constitución. */
    nivelDeMas: { fila: FilaPerdida; loQueDaba: FilaPerdida[]; } | null;
    pierdeConstitucion: boolean;
    constitucion: number;
    nep: { antes: number; despues: number; };
    px: { antes: number; enMedio: number; despues: number; };
    pg: { antes: number; despues: number; exacto: boolean; };
    /** Las aptitudes que vuelven de la tabla de su clase (la de antes, sustituida, y la que vuelve). */
    aptitudes: Array<{ antes: string; ahora: string; }>;
    vuelvenAValer: string[];
    sinPoderUsar: string[];
    /**
     * Sin ningún DG, el 1.er nivel que gana: su clase, el dado (al máximo) y lo que le da (las filas de `cambiosDeLaSubida`,
     * sin la de la clase); `null` (o sin él) si no.
     */
    nivelNuevo?: { clase: string; caras: number; filas: CambioPlantilla[]; } | null;
    /** Con niveles de otra clase después, lo que cambia al renumerarlos (`filasDeLaRenumeracion`); `null` (o sin él) si no. */
    renumerado?: ResumenRenumerado | null;
}

/**
 * «Lo que cambia» al devolverle la vida, antes de confirmar: la raza, los niveles de la clase de monstruo y lo que daban, el
 * nivel de más (o la Constitución), sin ningún DG el 1.er nivel que gana y lo que le da, el NEP, los PX, el tipo, la Constitución de vuelta, las características, los PG, los
 * rasgos, las aptitudes que vuelven y las dotes que vuelven a valer o se quedan sin poder usar.
 */
export function cambiosDeLaVuelta(e: EntradaCambiosVuelta): CambioPlantilla[] {
    const filas: CambioPlantilla[] = [];
    const porLaRaza = 'Sin la raza mutada y sin los niveles de la clase de monstruo';
    filas.push({ que: 'Raza', antes: e.raza, ahora: e.razaDeAntes, porque: 'Vuelve a la raza que tenía antes de ser muerto viviente (Libris Mortis, pág. 35)' });
    filas.push({
        que: `Niveles de ${e.claseDeMonstruo}`, antes: `${e.claseDeMonstruo} ${e.nivelesDeLaClase}`,
        ahora: e.nivelesDeLaClase === 1 ? 'Lo pierde' : `Los pierde todos (${e.nivelesDeLaClase})`,
        porque: 'Pierde todos los niveles de la clase de monstruo, con todo lo que le dieron (Libris Mortis, pág. 35); no se restablecen',
    });
    e.loQueDaban.forEach((f) => filas.push({ ...f, porque: 'Lo daban los niveles de la clase de monstruo' }));
    if (e.nivelDeMas) {
        filas.push({ ...e.nivelDeMas.fila, que: 'Nivel de más', porque: 'Con resurrección, deseo o milagro pierde además el último nivel de clase que le queda (Manual del jugador, pág. 285)' });
        e.nivelDeMas.loQueDaba.forEach((f) => filas.push({ ...f, porque: 'Lo daba el nivel de más' }));
    }
    if (e.renumerado)
        filas.push(...filasDeLaRenumeracion(e.renumerado));
    const nuevo = e.nivelNuevo ?? null;
    if (nuevo) {
        filas.push({
            que: 'Nivel ganado', antes: '—', ahora: `${nuevo.clase} 1`,
            porque: 'Sin la clase de monstruo no le queda ningún DG: gana el 1.er nivel de una clase, como al crear',
        });
        filas.push(...nuevo.filas);
    }
    filas.push({
        que: 'NEP', antes: `${e.nep.antes}`, ahora: `${e.nep.despues}`,
        porque: nuevo ? `Sin la clase de monstruo y con su 1.er nivel de ${nuevo.clase.toLowerCase()}`
            : e.nivelDeMas ? 'Sin la clase de monstruo y sin el nivel de más' : 'Sin la clase de monstruo',
    });
    filas.push({
        que: 'PX', antes: formatoPx(e.px.antes), ahora: formatoPx(e.px.despues),
        porque: e.px.antes === e.px.despues ? 'No cambian: ya tenía menos de la mitad de su nivel'
            : nuevo ? 'La mitad entre el mínimo de su nivel, ya con el 1.er nivel nuevo, y el del siguiente (Manual del jugador, pág. 171)'
                : e.nivelDeMas && e.px.enMedio !== e.px.despues
                    ? `La mitad de su nivel sin la clase de monstruo (${formatoPx(e.px.enMedio)}) y otra vez sin el nivel de más (Manual del jugador, pág. 171)`
                    : 'La mitad entre el mínimo de su nivel sin la clase de monstruo y el del siguiente (Manual del jugador, pág. 171)',
    });
    filas.push(...filasDelTipo(e.antes, e.despues, 'El de su raza de antes, con sus plantillas'));
    filas.push({
        que: 'Constitución', antes: 'Sin ella', ahora: `${e.constitucion}`,
        porque: e.pierdeConstitucion
            ? `Recupera su puntuación y pierde 2 puntos en lugar del nivel: ${nuevo ? 'es de 1.er nivel' : 'le queda un solo DG'} (Manual del jugador, pág. 285)`
            : 'Recupera su puntuación: vuelve a sumar en todos sus DG',
    });
    filas.push(...filasDeCaracteristicas(e.antes, e.despues, porLaRaza).filter((f) => f.que !== 'Constitución'));
    if (nuevo) {
        const mod = modificadorCaracteristica(toInt(e.constitucion));
        filas.push({
            que: 'Puntos de golpe', antes: `${e.pg.antes}`, ahora: `${e.pg.despues}`,
            porque: `Sin los DG que pierde y con el de su 1.er nivel de ${nuevo.clase.toLowerCase()} al máximo: ${nuevo.caras} ${mod < 0 ? '−' : '+'} ${Math.abs(mod)} Con (Manual del jugador, pág. 23)`,
        });
    } else if (e.pg.antes !== e.pg.despues)
        filas.push({
            que: 'Puntos de golpe', antes: `${e.pg.antes}`, ahora: `${e.pg.despues}`,
            porque: `Sin los DG que pierde y con la Constitución en los que le quedan${e.pg.exacto ? '' : ' (aproximado: faltan tiradas de antes)'}`,
        });
    filas.push(...filasDeRasgosRaciales(e.antes, e.despues, porLaRaza));
    e.aptitudes.forEach((a) => filas.push({ que: 'Aptitud', antes: a.antes, ahora: a.ahora, porque: 'Vuelve la de la tabla de su clase (Libris Mortis, pág. 35)' }));
    if (e.vuelvenAValer.length)
        filas.push({
            que: 'Vuelven a valer', antes: e.vuelvenAValer.join(', '), ahora: 'Las puede usar',
            porque: 'Vuelve a cumplir sus prerrequisitos (Manual del jugador, pág. 87)',
        });
    filas.push(...filasSinPoderUsar(e.sinPoderUsar));
    return filas;
}

/**
 * Por qué «Perder un nivel» al volver a la vida no vale sin Constitución (`409 perdida_sin_constitucion`, desde el
 * 2026-11-20): los muertos vivientes no pueden ser resucitados (*Manual del jugador*, pág. 285). Con una raza que lleva clase
 * de monstruo (`conClaseDeMonstruo`), lleva a «Devolver la vida»; si no, a la causa «Otra causa» (reanimarlo con *deseo
 * limitado* o *revivir muertos vivientes*, *Libris Mortis*, págs. 35 y 71).
 */
export function motivoRevivirSinConstitucion(conClaseDeMonstruo: boolean): string {
    return conClaseDeMonstruo
        ? 'No tiene Constitución: los muertos vivientes no pueden ser resucitados (Manual del jugador, pág. 285). Para devolverle la vida, usa «Devolver la vida» del historial: pierde los niveles de su clase de monstruo.'
        : 'No tiene Constitución: los muertos vivientes no pueden ser resucitados (Manual del jugador, pág. 285). Reanimarlo o revivir muertos vivientes se apuntan con «Otra causa».';
}
