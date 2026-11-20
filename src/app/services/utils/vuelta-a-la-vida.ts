import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelDto, PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { NivelPerdido } from 'src/app/interfaces/sesiones';
import { EspecialSustituido } from 'src/app/interfaces/raza';
import { CambioPlantilla, filasDeCaracteristicas, nombresNuevos } from './adquirir-plantilla';
import { LISTAS_DE_LA_RAZA, nepTrasLaMutacion, RazaDelNep, SE_CONSERVAN_EN_MUTACION } from './adquirir-raza-mutada';
import { modificadorCaracteristica } from './caracteristicas';
import { ContextoCompatibles, esClaseCompatibleConRestringida } from './clase-elegibilidad';
import { dgsDeClase, filaDeNivel } from './clase-niveles';
import { sacarDoteDeLaFicha } from './correccion-ficha';
import { normalizarTexto, toInt } from './normalizacion';
import {
    CONSTITUCION_PERDIDA, FilaPerdida, marcarDotesSinPrerrequisitos, ordenConocido, ordenPorConocer, pxTrasPerder, quitadoVacio, ResultadoPerdida,
} from './perder-nivel';
import { esDelPrimerNivelDelPersonaje } from './niveles-creacion';
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
 * Constitución. Todo sale de los datos de la raza y de sus clases, nunca de su nombre. Lo usa
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
export const MOTIVO_VUELTA_NIVELES_DESPUES = 'Después de la clase de monstruo tomó niveles de otra clase: por ahora, eso lo corrige el máster.';
/** `409 perdida_sin_niveles_de_clase`, con resurrección: el nivel de más sería un DG racial. */
export const MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL = 'Sin la clase de monstruo no tiene niveles de clase: con resurrección, deseo o milagro perdería un DG racial, y eso aún no se puede apuntar. Con resurrección verdadera, sí.';

/** `409 perdida_sin_constitucion`: con un solo DG, los 2 puntos que pierde dejarían su Constitución en 0. */
export function motivoSinConstitucionParaVolver(constitucion: number | null): string {
    return constitucion === null
        ? 'No tiene una puntuación de Constitución guardada: no se le puede devolver la vida (Manual del jugador, pág. 285).'
        : `Con Constitución ${toInt(constitucion)} no se le puede devolver la vida: los 2 puntos que pierde la dejarían en 0 (Manual del jugador, pág. 285).`;
}

/**
 * El índice en `niveles` del último nivel de `idClase`: el de más nivel de clase (con el orden por conocer, el que se
 * guardó así); `null` si no tiene ninguno. Así se quitan uno a uno los niveles de la clase de monstruo, del último al 1.º.
 */
export function indiceDelUltimoNivelDeLaClase(niveles: PersonajeCreateNivelDto[] | undefined, idClase: number): number | null {
    let indice: number | null = null;
    (niveles ?? []).forEach((n, i) => {
        if (toInt(n?.idClase) === toInt(idClase) && (indice === null || toInt(n.nivelClase) >= toInt((niveles ?? [])[indice].nivelClase)))
            indice = i;
    });
    return indice;
}

/**
 * Si después de la clase de monstruo tomó niveles de otra clase (`409 vuelta_niveles_despues`): con el orden real, un nivel
 * de otra clase detrás del primero de la de monstruo; con el orden por conocer, si la terminó (`Nivel_max_claseo`) y tiene
 * otras (se termina antes de tomar otra, así que fueron después).
 */
export function tomoNivelesDespues(niveles: PersonajeCreateNivelDto[] | undefined, idClase: number,
    clase: Pick<Clase, 'Nivel_max_claseo'> | null | undefined, clases: ReadonlyArray<{ idClase: number; nivel: number; }>): boolean {
    const id = toInt(idClase);
    const lista = niveles ?? [];
    if (ordenPorConocer(lista)) {
        const nivel = toInt(clases.find((c) => toInt(c.idClase) === id)?.nivel);
        const terminada = toInt(clase?.Nivel_max_claseo) > 0 && nivel >= toInt(clase?.Nivel_max_claseo);
        return terminada && clases.some((c) => toInt(c.idClase) !== id && toInt(c.nivel) > 0);
    }
    const primera = lista.findIndex((n) => toInt(n?.idClase) === id);
    return primera >= 0 && lista.slice(primera).some((n) => toInt(n?.idClase) !== id && ordenConocido(n));
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
    };
    const clase = d.claseDeMonstruo;
    if (!clase || toInt(clase.Id) < 1)
        return { ...vacio, motivo: MOTIVO_VUELTA_SIN_CLASE_DE_MONSTRUO };
    const id = toInt(clase.Id);
    const nivelesDeLaClase = toInt(d.clases.find((c) => toInt(c.idClase) === id)?.nivel);
    const conOtrasClases = d.clases.some((c) => toInt(c.idClase) !== id && toInt(c.nivel) > 0);
    const dgsSinLaClase = Math.max(0, toInt(d.dgs) - dgsDeClase(clase, nivelesDeLaClase));
    const estado: EstadoDeLaVuelta = { ...vacio, nivelesDeLaClase, dgsSinLaClase, conOtrasClases, ganaNivel: dgsSinLaClase < 1 };
    if (tomoNivelesDespues(d.niveles, id, clase, d.clases))
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
 * que lleva una raza mutada, `Mutacion`). Las demás no se ofrecen (`400 vuelta_clase_nueva_no_valida`).
 */
export function esClaseParaVolverSinDg(clase: Pick<Clase, 'Prestigio' | 'Mutacion'> | null | undefined): boolean {
    return !!clase && clase.Prestigio !== true && toInt(clase.Mutacion?.Id) < 1;
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
 * La `entrada` sin lo que, en los niveles de la clase de monstruo, es del 1.er nivel del personaje y no de esos niveles
 * (`esDelPrimerNivelDelPersonaje`: la dote adicional del humano y los idiomas por Inteligencia), y lo apartado. Al volver
 * sin ningún DG no se va con ellos: se conserva y pasa al 1.er nivel nuevo con el mismo origen (contrato, «Sin ningún DG»).
 */
export function apartarLoDelPrimerNivel(entrada: PersonajeCreateRequestDto, idClaseDeMonstruo: number)
    : { entrada: PersonajeCreateRequestDto; delPrimerNivel: PersonajeCreateNivelEleccionDto[]; } {
    const delPrimerNivel: PersonajeCreateNivelEleccionDto[] = [];
    const niveles = (entrada.niveles ?? []).map((n) => {
        if (toInt(n?.idClase) !== toInt(idClaseDeMonstruo))
            return n;
        const elecciones = (n.elecciones ?? []).filter((e) => {
            const aparte = esDelPrimerNivelDelPersonaje(e);
            if (aparte)
                delPrimerNivel.push({ ...e });
            return !aparte;
        });
        return { ...n, elecciones };
    });
    return { entrada: { ...entrada, niveles }, delPrimerNivel };
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
    col.dotes = dotes;
    // Los idiomas: los que le quedan, sin los que solo traía la raza mutada.
    const idiomasQuitados = diferencia(colA.idiomas ?? [], colD.idiomas ?? []).quitados.map((i) => toInt(i['idIdioma']));
    const idiomas = [...(colSin.idiomas ?? [])];
    idiomasQuitados.forEach((id) => {
        const i = idiomas.findIndex((x: any) => toInt(x?.idIdioma) === id);
        if (i >= 0)
            idiomas.splice(i, 1);
    });
    col.idiomas = idiomas;
    col.dominios = [...(colSin.dominios ?? [])];
    col.conjurosConocidos = [...(colSin.conjurosConocidos ?? [])];
    col.especiales = especialesDevueltos(colSin.especiales ?? [], d.sustituidos, d.deLasTablas,
        (e: any) => ({ id: toInt(e?.idEspecial), extra: Math.max(0, toInt(e?.idExtra)) }));
    if (ficha.decisionesHomebrew)
        ficha.decisionesHomebrew = ficha.decisionesHomebrew.filter((x) =>
            !(x.tipo === 'requisitos_dote' && !dotes.some((dote) => toInt(dote?.idDote) === toInt(x.idElemento))));
    return marcarDotesSinPrerrequisitos(ficha, d.marcar, d.desmarcar);
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
    const tipoA = `${e.antes?.Tipo_criatura?.Nombre ?? ''}`;
    const tipoD = `${e.despues?.Tipo_criatura?.Nombre ?? ''}`;
    if (normalizarTexto(tipoA) !== normalizarTexto(tipoD))
        filas.push({ que: 'Tipo', antes: tipoA || '—', ahora: tipoD || '—', porque: 'El de su raza de antes, con sus plantillas' });
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
    const nombres = (pj: Personaje) => (pj?.Raciales ?? []).map((r) => `${r?.Nombre ?? ''}`.trim()).filter((n) => n.length > 0);
    const pierde = nombresNuevos(nombres(e.despues), nombres(e.antes));
    const gana = nombresNuevos(nombres(e.antes), nombres(e.despues));
    if (pierde.length || gana.length)
        filas.push({ que: 'Rasgos raciales', antes: pierde.join(', ') || '—', ahora: gana.join(', ') || '—', porque: porLaRaza });
    e.aptitudes.forEach((a) => filas.push({ que: 'Aptitud', antes: a.antes, ahora: a.ahora, porque: 'Vuelve la de la tabla de su clase (Libris Mortis, pág. 35)' }));
    if (e.vuelvenAValer.length)
        filas.push({
            que: 'Vuelven a valer', antes: e.vuelvenAValer.join(', '), ahora: 'Las puede usar',
            porque: 'Vuelve a cumplir sus prerrequisitos (Manual del jugador, pág. 87)',
        });
    if (e.sinPoderUsar.length)
        filas.push({
            que: 'Sin poder usar', antes: e.sinPoderUsar.join(', '), ahora: 'Las conserva',
            porque: 'Dejan de cumplir un prerrequisito: vuelven a valer cuando lo cumpla (Manual del jugador, pág. 87)',
        });
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
