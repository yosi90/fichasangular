import { Clase } from 'src/app/interfaces/clase';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import {
    claveCompanero, EntradasSelectorCompanero, entradasDelSelectorCompanero, resolverEstadoCuposCompanero, resolverFilaCompanero,
} from './companero-reglas';
import {
    claveFamiliar, EntradasSelectorFamiliar, entradasDelSelectorFamiliar, resolverEstadoCuposFamiliar, resolverFilaFamiliar,
} from './familiar-reglas';
import { doteDeNivelClase } from './nivel-clase-monstruo';
import { aportaAlDarLaMascota, EstadoMascota, filasDeSusListas, OtorgaMascota } from './mascota-cupos';
import { normalizarTexto, toInt } from './normalizacion';
import { conLasAptitudesYDotesDelMotor, DerivadoDelRasgo } from './reciclaje-dominio-escuela';
import { familiarConLoDelMotor } from './subida-nivel';

/*
 * El reciclaje de la mascota (R3, tercera tanda; *Manual del jugador II*, tabla 8-2; contrato en
 * `docs/publica/endpoints/personajes.md`, «Subida de nivel», «El reciclaje», `rasgo`, «La mascota: el compañero animal o el
 * familiar»; dictamen del máster de Rol del 2026-11-20, D4 y D5). Cambia la criatura del compañero animal o del familiar
 * por otra **de la misma elección**: de la lista de sus clases con una fila del nivel de la elección o menos (el de la fila
 * con la que tiene la que se va, nunca por debajo de lo que la clase aporta al darla; una fila que abre una dote que tiene,
 * hasta el nivel efectivo que tenía al elegirla), juzgada con el personaje de antes de subir (su dote, el ajuste de su
 * lista y su ataque base). Sin coste. Lo derivado (los valores de su nivel, lo que gana el
 * amo) lo pone el motor como al elegirla en la creación (`registrarCompaneroSeleccionado`, `registrarFamiliarSeleccionado`);
 * los rangos del compañero se reparten otra vez en la subida. Lo que dependa de la que se va bloquea
 * (`motivoDeLaMascota`, en `reciclaje.ts`). Todo sale de los datos (`Mascota` de las tablas de clase y `Niveles_clase`).
 */

/** Las dos mascotas que se reciclan, como en el contrato (`hueco.mascota`). */
export type TipoDeMascota = 'companero' | 'familiar';

/** Una criatura del catálogo de la creación de una mascota (una entrada por monstruo y plantilla). */
export type CriaturaDeMascota = CompaneroMonstruoDetalle | FamiliarMonstruoDetalle;

/** Una criatura de la mascota, con su nombre y el de su plantilla (vacío sin plantilla). */
export interface CriaturaDelRasgo {
    idMonstruo: number;
    idPlantilla: number;
    nombre: string;
    plantilla: string;
}

/** Los catálogos de la creación de las mascotas (`construirCatalogo…DesdeMonstruos`); `null`, si no se han podido leer. */
export interface CatalogosDeMascotas {
    companeros: CompaneroMonstruoDetalle[] | null;
    familiares: FamiliarMonstruoDetalle[] | null;
}

/** La mascota del personaje en la clase que se la da: la criatura que tiene y hasta qué nivel de su lista puede cambiarla. */
export interface HuecoDeMascota {
    tipo: 'mascota';
    clave: string;
    mascota: TipoDeMascota;
    idClase: number;
    clase: string;
    tiene: CriaturaDelRasgo;
    /** El nombre que le puso («Colmillo»). */
    nombrePropio: string;
    /** El nivel de la elección: la nueva tiene que tener una fila de ese nivel de su lista o menos. */
    nivelEleccion: number;
    /**
     * El de las filas que abre una dote que tiene (Compañero elevado, Familiar mejorado), por el id de la dote: el nivel
     * efectivo que tenía al elegirla (su nivel en el registro; sin él, el de ahora).
     */
    nivelPorDote: Record<number, number>;
    /** Por qué no se puede reciclar; `null` si se puede. */
    motivo: string | null;
}

/** El cambio de la criatura: la nueva (con todas sus filas, para el motor), su nombre y lo que el amo gana de más con ella. */
export interface PlanMascota {
    tipo: 'mascota';
    hueco: HuecoDeMascota;
    pone: CriaturaDelRasgo;
    nombrePropio: string;
    criatura: CriaturaDeMascota;
    aptitudesNuevas: Array<{ nombre: string; extra: string; }>;
}

/** Lo que dicen las frases y lo que pide el motor de cada mascota. */
const DE_LA_MASCOTA: Record<TipoDeMascota, { otorga: OtorgaMascota; nombre: string; lista: string; }> = {
    companero: { otorga: 'Otorga_companero', nombre: 'compañero animal', lista: 'compañeros animales' },
    familiar: { otorga: 'Otorga_familiar', nombre: 'familiar', lista: 'familiares' },
};

/** El nombre de la mascota para las frases («compañero animal», «familiar»). */
export function nombreDeLaMascota(tipo: TipoDeMascota): string {
    return DE_LA_MASCOTA[tipo].nombre;
}

/** La plantilla de una criatura que se nombra: vacía sin ella o con la de relleno («No aplica»). */
function plantillaVisible(criatura: Pick<CriaturaDelRasgo, 'plantilla'> | null | undefined): string {
    const plantilla = `${criatura?.plantilla ?? ''}`.trim();
    return normalizarTexto(plantilla) === normalizarTexto('No aplica') ? '' : plantilla;
}

/** La criatura con su plantilla, si la tiene: «Lobo», «Lobo (Celestial)», «Gato (Básica)». */
export function nombreDeLaCriatura(criatura: Pick<CriaturaDelRasgo, 'nombre' | 'plantilla'>): string {
    const plantilla = plantillaVisible(criatura);
    return plantilla ? `${criatura.nombre} (${plantilla})` : `${criatura?.nombre ?? ''}`;
}

/**
 * Las dos criaturas del cambio, como la frase de la API: con su plantilla solo si no la comparten («Gato por Búho»,
 * «Lobo por Lobo (Celestial)»).
 */
export function nombresDelCambio(tiene: CriaturaDelRasgo, pone: CriaturaDelRasgo): [string, string] {
    if (normalizarTexto(plantillaVisible(tiene)) === normalizarTexto(plantillaVisible(pone)))
        return [tiene.nombre, pone.nombre];
    return [nombreDeLaCriatura(tiene), nombreDeLaCriatura(pone)];
}

/** La clave de una criatura del catálogo (`claveCompanero` o `claveFamiliar`): su monstruo y su plantilla. */
function claveDe(tipo: TipoDeMascota, criatura: CriaturaDeMascota | null | undefined): string {
    return tipo === 'companero' ? claveCompanero(criatura as CompaneroMonstruoDetalle) : claveFamiliar(criatura as FamiliarMonstruoDetalle);
}

/** Las fuentes, el nivel efectivo y las listas de esa mascota en el motor (el personaje de antes de subir). */
function estadoDe(motor: NuevoPersonajeService, tipo: TipoDeMascota): EstadoMascota {
    return tipo === 'companero' ? motor.getEstadoCuposCompanero() : motor.getEstadoCuposFamiliar();
}

/** La criatura del catálogo, con su nombre y el de su plantilla. */
export function criaturaDelRasgo(criatura: CriaturaDeMascota): CriaturaDelRasgo {
    const idPlantilla = Math.max(0, toInt(criatura?.Plantilla?.Id));
    return {
        idMonstruo: toInt(criatura?.Monstruo_origen?.Id) || toInt(criatura?.Id),
        idPlantilla,
        nombre: `${criatura?.Nombre ?? ''}`.trim(),
        plantilla: idPlantilla > 0 ? `${criatura?.Plantilla?.Nombre ?? ''}`.trim() : '',
    };
}

/**
 * Las mascotas del personaje (las de la ficha guardada, `entrada`), cada una en la primera clase que se la da (el motor,
 * recién hidratado: el personaje de antes de subir), con la criatura que tiene y el nivel de la elección: el `Nivel` de la
 * fila de su lista con la que la tiene y, nunca por debajo, lo que aporta su clase en el nivel en que se la da (el druida,
 * 1; el explorador, que la da a 4 con la mitad, 2). Sin la clase, sin el catálogo o sin otra criatura en su lista hasta
 * ese nivel, con su motivo. Lo que depende de la que se va lo mira `motivoDeLaMascota` al elegir la nueva.
 */
export function huecosDeMascota(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, catalogos: CatalogosDeMascotas): HuecoDeMascota[] {
    return (['companero', 'familiar'] as const).flatMap((tipo): HuecoDeMascota[] => {
        const guardada = tipo === 'companero' ? entrada.companero : entrada.familiar;
        if (!guardada || toInt(guardada.idMonstruo) <= 0)
            return [];
        const textos = DE_LA_MASCOTA[tipo];
        const estado = estadoDe(motor, tipo);
        const fuente = estado.fuentesMascota[0] ?? null;
        const catalogo: CriaturaDeMascota[] | null = tipo === 'companero' ? catalogos.companeros : catalogos.familiares;
        const enElMotor: CriaturaDeMascota | undefined = (tipo === 'companero' ? motor.PersonajeCreacion.Companeros : motor.PersonajeCreacion.Familiares)?.[0];
        const clave = `${toInt(guardada.idMonstruo)}:${Math.max(0, toInt(guardada.idPlantilla))}`;
        const delCatalogo = (catalogo ?? []).find((c) => claveDe(tipo, c) === clave) ?? null;
        const idPlantilla = Math.max(0, toInt(guardada.idPlantilla));
        const tiene: CriaturaDelRasgo = {
            idMonstruo: toInt(guardada.idMonstruo), idPlantilla,
            nombre: `${delCatalogo?.Nombre ?? enElMotor?.Monstruo_origen?.Nombre ?? guardada.nombre ?? ''}`.trim(),
            plantilla: idPlantilla > 0 ? `${delCatalogo?.Plantilla?.Nombre ?? enElMotor?.Plantilla?.Nombre ?? ''}`.trim() : '',
        };
        const base = {
            tipo: 'mascota' as const, clave: `mascota:${tipo}`, mascota: tipo, idClase: toInt(fuente?.idClase), clase: `${fuente?.nombreClase ?? ''}`,
            tiene, nombrePropio: `${guardada.nombre ?? ''}`.trim(), nivelEleccion: 0, nivelPorDote: {},
        };
        if (!fuente)
            return [{ ...base, motivo: `Ninguna de sus clases le da un ${textos.nombre}.` }];
        if (!catalogo)
            return [{ ...base, motivo: `No se ha podido leer el catálogo de ${textos.lista}. Vuelve a intentarlo en unos segundos.` }];
        const conSusFilas = delCatalogo ?? enElMotor;
        const resuelta = conSusFilas
            ? (tipo === 'companero'
                ? resolverFilaCompanero(conSusFilas as CompaneroMonstruoDetalle, estado, motor.idsDotesDelPersonaje())
                : resolverFilaFamiliar(conSusFilas as FamiliarMonstruoDetalle, estado, motor.idsDotesDelPersonaje()))
            : null;
        const deSuFila = resuelta?.fila ? Math.max(0, toInt(resuelta.fila.Nivel)) : Math.max(0, toInt(resuelta?.nivelMinimo));
        const nivelEleccion = Math.max(deSuFila, aportaAlDarLaMascota(motor.claseDelCatalogo(fuente.idClase), textos.otorga));
        const hueco: HuecoDeMascota = { ...base, nivelEleccion, nivelPorDote: nivelesPorDote(motor, tipo, catalogo, estado.nivelEfectivo), motivo: null };
        return [catalogoDelReciclaje(catalogo, hueco, estado).length > 0 ? hueco
            : { ...hueco, motivo: `No hay otro ${textos.nombre} en la lista de sus clases de nivel ${nivelEleccion} o menos.` }];
    });
}

/**
 * El nivel efectivo de la mascota cuando eligió cada dote que tiene y abre una fila del catálogo (Compañero elevado,
 * Familiar mejorado): con las clases de su registro hasta el nivel en que la eligió; sin registro, `ahora`.
 */
function nivelesPorDote(motor: NuevoPersonajeService, tipo: TipoDeMascota, catalogo: readonly CriaturaDeMascota[], ahora: number): Record<number, number> {
    const tiene = motor.idsDotesDelPersonaje();
    const ids = new Set(catalogo.flatMap((c) => (c?.Niveles_clase ?? []).map((f) => toInt(doteDeNivelClase(f)?.id))).filter((id) => id > 0 && tiene.has(id)));
    const pj = motor.PersonajeCreacion;
    const salida: Record<number, number> = {};
    ids.forEach((idDote) => {
        const dote = motor.dotesDelPersonaje().find((d) => toInt(d?.Dote?.Id) === idDote);
        const indice = motor.indiceNivelDeLaDote(idDote, toInt(dote?.Contexto?.Id_extra));
        if (indice === null || indice < 0) {
            salida[idDote] = ahora;
            return;
        }
        const niveles = new Map<number, number>();
        (pj.Orden_niveles ?? []).slice(0, indice + 1).forEach((n) => niveles.set(toInt(n?.idClase), (niveles.get(toInt(n?.idClase)) ?? 0) + 1));
        const clases = Array.from(niveles.keys()).map((id) => motor.claseDelCatalogo(id)).filter((c): c is Clase => !!c);
        const entonces = {
            ...pj, desgloseClases: clases.map((c) => ({ Id: toInt(c.Id), Nombre: `${c.Nombre}`, Nivel: niveles.get(toInt(c.Id)) ?? 0 })),
        } as Personaje;
        salida[idDote] = (tipo === 'companero' ? resolverEstadoCuposCompanero(entonces, clases) : resolverEstadoCuposFamiliar(entonces, clases)).nivelEfectivo;
    });
    return salida;
}

/** Hasta qué nivel vale una fila de la lista en el reciclaje: la que abre una dote que tiene, el de esa dote; las demás, el de la elección. */
function nivelDeLaFila(hueco: HuecoDeMascota, fila: MonstruoNivelClase): number {
    const dote = toInt(doteDeNivelClase(fila)?.id);
    const deLaDote = dote > 0 ? hueco.nivelPorDote?.[dote] : undefined;
    return deLaDote === undefined ? hueco.nivelEleccion : Math.max(hueco.nivelEleccion, deLaDote);
}

/**
 * Las criaturas que se ofrecen en lugar de la que tiene: las de la lista de sus clases con una fila del nivel de la
 * elección o menos (la que abre una dote que tiene, del nivel que tenía al elegirla; solo esas filas, para que el selector
 * las juzgue: su dote, su ajuste y su ataque base), sin la que tiene. El druida 6 que eligió un lobo a nivel 1 ve los de la
 * lista básica, no el bisonte; con Compañero elevado, también el lobo celestial.
 */
export function catalogoDelReciclaje<T extends CriaturaDeMascota>(catalogo: readonly T[], hueco: HuecoDeMascota,
    estado: Pick<EstadoMascota, 'listasIds'>): T[] {
    const listas = new Set(estado.listasIds ?? []);
    const tiene = `${hueco.tiene.idMonstruo}:${hueco.tiene.idPlantilla}`;
    return (catalogo ?? [])
        .filter((c) => claveDe(hueco.mascota, c) !== tiene)
        .map((c) => ({
            ...c,
            Niveles_clase: filasDeSusListas(c, listas).filter((f: MonstruoNivelClase) => toInt(f?.Nivel) >= 0 && toInt(f.Nivel) <= nivelDeLaFila(hueco, f)),
        }))
        .filter((c) => c.Niveles_clase.length > 0);
}

/** Los filtros del selector en el reciclaje: el homebrew, el nivel (el compañero) y la plantilla (el familiar). */
export interface FiltrosDelSelectorDeMascota {
    incluirHomebrew: boolean;
    nivelSeleccionado?: number | null;
    plantillaSeleccionada?: number | null;
}

/** Las entradas del selector del compañero de la creación en el reciclaje (`entradasDelSelectorCompanero`), con el personaje de antes de subir. */
export function entradasDelCompaneroReciclado(motor: NuevoPersonajeService, hueco: HuecoDeMascota, catalogo: readonly CompaneroMonstruoDetalle[],
    filtros: FiltrosDelSelectorDeMascota): EntradasSelectorCompanero {
    const estado = motor.getEstadoCuposCompanero();
    return entradasDelSelectorCompanero({
        companeros: catalogoDelReciclaje(catalogo, hueco, estado), estado, incluirHomebrew: filtros.incluirHomebrew,
        alineamientoPersonaje: `${motor.PersonajeCreacion.Alineamiento ?? ''}`.trim(), dotesPersonaje: motor.idsDotesDelPersonaje(),
        nivelSeleccionado: filtros.nivelSeleccionado ?? null,
    });
}

/** Las entradas del selector del familiar de la creación en el reciclaje (`entradasDelSelectorFamiliar`), con el personaje de antes de subir. */
export function entradasDelFamiliarReciclado(motor: NuevoPersonajeService, hueco: HuecoDeMascota, catalogo: readonly FamiliarMonstruoDetalle[],
    filtros: FiltrosDelSelectorDeMascota): EntradasSelectorFamiliar {
    const estado = motor.getEstadoCuposFamiliar();
    return entradasDelSelectorFamiliar({
        familiares: catalogoDelReciclaje(catalogo, hueco, estado), estado, incluirHomebrew: filtros.incluirHomebrew,
        alineamientoPersonaje: `${motor.PersonajeCreacion.Alineamiento ?? ''}`.trim(), dotesPersonaje: motor.idsDotesDelPersonaje(),
        plantillaSeleccionada: filtros.plantillaSeleccionada ?? null,
    });
}

/**
 * En el motor: la mascota que tiene se va (con lo que su amo lleva por ella) y entra `criatura` con su nombre, como al
 * elegirla en la creación (con los valores y las aptitudes de su nivel de ahora). `razon`, si no se puede.
 */
export function cambiarMascotaEnElMotor(motor: NuevoPersonajeService, tipo: TipoDeMascota, criatura: CriaturaDeMascota, nombre: string)
    : { registrado: boolean; razon: string; } {
    const copia = JSON.parse(JSON.stringify(criatura));
    if (tipo === 'companero') {
        motor.quitarCompanero();
        const r = motor.registrarCompaneroSeleccionado(copia, nombre);
        return { registrado: r.registrado, razon: `${r.razon ?? ''}` };
    }
    motor.quitarFamiliar();
    const r = motor.registrarFamiliarSeleccionado(copia, nombre);
    return { registrado: r.registrado, razon: `${r.razon ?? ''}` };
}

/** El plan del cambio en el motor (ya elegido). `false` si no se puede. */
export function aplicarMascotaAlMotor(motor: NuevoPersonajeService, plan: PlanMascota): boolean {
    return cambiarMascotaEnElMotor(motor, plan.hueco.mascota, plan.criatura, plan.nombrePropio).registrado;
}

/**
 * El plan de cambiar la mascota del hueco por `criatura` (la elegida en el selector, con todas sus filas): lo hace en el
 * motor para ver si se puede y qué gana el amo con ella que no tenía (otra tabla del familiar), y lo deja como estaba.
 */
export function planDeLaMascota(motor: NuevoPersonajeService, hueco: HuecoDeMascota, criatura: CriaturaDeMascota, nombre: string)
    : { plan: PlanMascota; motivo: null; } | { plan: null; motivo: string; } {
    const pj = motor.PersonajeCreacion;
    const antes = (pj.Claseas ?? []).map((e) => ({ nombre: `${e?.Nombre ?? ''}`, extra: `${e?.Extra ?? ''}` }));
    const estado = motor.exportarEstadoSubida();
    try {
        const cambio = cambiarMascotaEnElMotor(motor, hueco.mascota, criatura, nombre);
        if (!cambio.registrado)
            return { plan: null, motivo: cambio.razon || `No puede tener esa criatura como ${nombreDeLaMascota(hueco.mascota)}.` };
        const mismo = (a: { nombre: string; extra: string; }, b: { nombre: string; extra: string; }) =>
            normalizarTexto(a.nombre) === normalizarTexto(b.nombre) && normalizarTexto(a.extra) === normalizarTexto(b.extra);
        const aptitudesNuevas = (motor.PersonajeCreacion.Claseas ?? []).map((e) => ({ nombre: `${e?.Nombre ?? ''}`, extra: `${e?.Extra ?? ''}` }))
            .filter((e) => !antes.some((x) => mismo(x, e)));
        return {
            motivo: null,
            plan: { tipo: 'mascota', hueco, pone: criaturaDelRasgo(criatura), nombrePropio: `${nombre ?? ''}`.trim(), criatura, aptitudesNuevas },
        };
    } finally {
        motor.restaurarEstadoSubida(estado);
    }
}

/** Lo que cambia solo con la mascota, para «Lo que cambia» (los valores de su nivel; del compañero, los rangos otra vez). */
export function derivadosDeLaMascota(plan: PlanMascota): DerivadoDelRasgo[] {
    const ahora = plan.hueco.mascota === 'companero'
        ? `Los de ${plan.pone.nombre} a su nivel: DG adicionales, trucos, Fuerza, Destreza, armadura natural y aptitudes; sus rangos, de nuevo`
        : `Los de ${plan.pone.nombre} al nivel de su amo: armadura natural, Inteligencia, resistencia a conjuros, PG, ataque y aptitudes`;
    return [{ que: 'Lo que cambia solo', antes: `Los de ${plan.hueco.tiene.nombre}`, ahora }];
}

/**
 * La `entrada` con la mascota nueva: la del cuerpo del motor después del cambio (`motor.despues`, con los valores de su
 * nivel; el familiar, con la mitad de los PG de su amo de la ficha) y, en las colecciones del amo, lo que gana o pierde con
 * ella (las aptitudes de su vínculo, Alerta). Las elecciones de los niveles no cambian: el registro no apunta la mascota.
 */
export function fichaConLaMascota(entrada: PersonajeCreateRequestDto, plan: PlanMascota,
    motor: { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; } | null | undefined): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    if (!motor)
        return ficha;
    const despues: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(motor.despues));
    if (plan.hueco.mascota === 'companero' && despues.companero)
        ficha.companero = despues.companero;
    // Sus PG, la mitad de los del amo (los suyos si toma los mayores), como en la subida (`familiarConLoDelMotor`).
    if (plan.hueco.mascota === 'familiar' && despues.familiar)
        ficha.familiar = familiarConLoDelMotor(despues.familiar, undefined, despues.familiar, toInt(entrada.personaje?.puntosGolpe));
    ficha.colecciones = { ...(ficha.colecciones ?? {}) };
    conLasAptitudesYDotesDelMotor(ficha.colecciones, motor.antes.colecciones, motor.despues.colecciones);
    return ficha;
}

/**
 * La ficha de la subida con los rangos del compañero nuevo (los que se repartieron otra vez en la subida, del cuerpo del
 * motor `despues`): la subida no cambia las habilidades de la mascota, pero el reciclaje las elige de nuevo.
 */
export function conLosRangosDelCompaneroNuevo(ficha: PersonajeCreateRequestDto, plan: PlanMascota | null | undefined,
    despues: PersonajeCreateRequestDto): PersonajeCreateRequestDto {
    if (plan?.hueco.mascota !== 'companero' || !ficha.companero || !despues.companero)
        return ficha;
    return { ...ficha, companero: { ...ficha.companero, habilidades: JSON.parse(JSON.stringify(despues.companero.habilidades ?? [])) } };
}

/** El cuerpo `reciclaje` de la mascota (contrato, «La mascota: el compañero animal o el familiar»). */
export function reciclajeDeLaMascota(plan: PlanMascota) {
    const ref = (c: CriaturaDelRasgo) => ({ idMonstruo: c.idMonstruo, idPlantilla: Math.max(0, c.idPlantilla) });
    return {
        tipo: 'rasgo' as const, hueco: { idClase: plan.hueco.idClase, mascota: plan.hueco.mascota },
        quita: { mascota: ref(plan.hueco.tiene) }, pone: { mascota: ref(plan.pone) },
    };
}
