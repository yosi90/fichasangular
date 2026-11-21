import { CompaneroMonstruoDetalle, TrucoDeMascota } from 'src/app/interfaces/monstruo';
import { PersonajeCreateCompaneroDto } from 'src/app/interfaces/personajes-api';
import { Dote } from 'src/app/interfaces/dote';
import { Truco } from 'src/app/interfaces/truco';
import { sinPuntuacion } from 'src/app/services/utils/caracteristicas';
import { inteligenciaDelCompanero, nombreDelCompanero, tiposQueCuentaElCompanero } from 'src/app/services/utils/companero-dotes';
import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { costeDelTruco, costeDeLosTrucos } from 'src/app/services/utils/truco-coste';

/*
 * Los trucos del compañero animal (contrato: `docs/publica/endpoints/personajes.md`, «Los trucos del compañero»; reglas:
 * el dictamen del máster de Rol del 2026-11-21, en el roadmap, punto 2; MJ págs. 36 y 83). Los adicionales de su tabla
 * (`Trucos_adi`) los elige el jugador: trucos sueltos, sin repetir, con sus requisitos y contando su `Coste`; no se cambian,
 * y al perder un nivel se pierden los últimos que eligió.
 */

/** El aviso de cuando lo elegido en el selector ya no vale al ponerlo (en la creación y en las sesiones). */
export const AVISO_TRUCOS_QUE_YA_NO_VALEN = {
    titulo: 'No se pudieron poner los trucos',
    texto: 'La selección ya no vale con el compañero de ahora. Elige otros.',
} as const;

/** Los que sabe, de cualquier origen. */
export function trucosDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): TrucoDeMascota[] {
    return [...(companero?.Trucos ?? [])];
}

/** Los adicionales, por el orden en que los eligió. */
export function trucosAdicionalesDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): TrucoDeMascota[] {
    return trucosDelCompanero(companero)
        .filter((t) => t.Origen === 'adicional')
        .sort((a, b) => toInt(a.Orden) - toInt(b.Orden));
}

/**
 * Con Inteligencia 3 o más no sabe ninguno: Trato con animales solo vale con 1 o 2 (MJ pág. 83; dictamen, punto 2). Sin
 * Inteligencia (una sabandija descerebrada) sí sabe los adicionales, que no piden entrenamiento.
 */
export function companeroNoSabeTrucos(companero: CompaneroMonstruoDetalle | null | undefined): boolean {
    const inteligencia = inteligenciaDelCompanero(companero);
    return !sinPuntuacion(inteligencia) && toInt(inteligencia) >= 3;
}

/** Lo que cuentan sus adicionales (su `Coste`). */
export function costeDeLosAdicionales(companero: CompaneroMonstruoDetalle | null | undefined): number {
    return costeDeLosTrucos(trucosAdicionalesDelCompanero(companero));
}

/** Los trucos adicionales que le quedan por elegir (sus `Trucos_adi` menos lo que cuentan los que tiene); inactivo, ninguno. */
export function trucosAdicionalesPendientes(companero: CompaneroMonstruoDetalle | null | undefined): number {
    if (!companero || companero.Inactiva || companeroNoSabeTrucos(companero))
        return 0;
    return Math.max(0, toInt(companero.Trucos_adi) - costeDeLosAdicionales(companero));
}

/**
 * Los ids de lo que sabe a efectos de repetir y de los requisitos: sus trucos, los de sus fines y los que sustituyen
 * (quien sabe Ataca (todas las criaturas) sabe Ataca; quien sabe Combate montado, Monta), con el catálogo.
 */
export function idsDeLoQueSabe(ids: Iterable<number>, catalogo: readonly Truco[]): Set<number> {
    const porId = new Map(catalogo.map((t) => [t.Id, t] as const));
    const sabe = new Set<number>();
    const pendientes = [...ids].map((id) => toInt(id)).filter((id) => id > 0);
    while (pendientes.length > 0) {
        const id = pendientes.pop()!;
        if (sabe.has(id))
            continue;
        sabe.add(id);
        const truco = porId.get(id);
        (truco?.Trucos ?? []).forEach((t) => pendientes.push(t.Id));
        if (truco?.Sustituye)
            pendientes.push(truco.Sustituye.Id);
    }
    return sabe;
}

/** El nombre de una aptitud para compararla: sin tildes y sin lo que va entre paréntesis («veneno (víbora)» → «veneno»). */
function nombreDeAptitud(nombre: unknown): string {
    return normalizarTexto(`${nombre ?? ''}`.replace(/\s*\(.*\)\s*$/, ''));
}

/** Las aptitudes de su criatura, por su nombre: sus raciales, sus ataques especiales y sus aptitudes de clase. */
export function aptitudesDeLaCriatura(companero: CompaneroMonstruoDetalle | null | undefined): Set<string> {
    return new Set([
        ...(companero?.Raciales ?? []).map((r) => r?.Nombre),
        ...(companero?.Ataques_especiales ?? []).map((r) => r?.Nombre),
        ...(companero?.Especiales ?? []).map((e) => e?.Especial?.Nombre),
    ].map(nombreDeAptitud).filter((n) => n.length > 0));
}

/** Lo que hace falta para juzgar un truco adicional: lo que sabe ya, sus aptitudes, su tipo y lo que le queda. */
export interface ContextoTrucosDelCompanero {
    sabe: ReadonlySet<number>;
    aptitudes: ReadonlySet<string>;
    /** Los tipos con los que cuenta (el de su monstruo y el de su progresión: `tiposQueCuentaElCompanero`). */
    idsTipo: ReadonlySet<number>;
    quedan: number;
}

/** El contexto de sus trucos con el catálogo, más los que lleva elegidos en el selector (`elegidos`, que cuentan ya). */
export function contextoDeTrucosDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, catalogo: readonly Truco[],
    elegidos: readonly Truco[] = []): ContextoTrucosDelCompanero {
    return {
        sabe: idsDeLoQueSabe([...trucosDelCompanero(companero).map((t) => t.Id), ...elegidos.map((t) => t.Id)], catalogo),
        aptitudes: aptitudesDeLaCriatura(companero),
        idsTipo: new Set(tiposQueCuentaElCompanero(companero).map((t) => toInt(t.Id)).filter((id) => id > 0)),
        quedan: trucosAdicionalesPendientes(companero) - costeDeLosTrucos(elegidos),
    };
}

/**
 * Lo que no cumple de sus `Requisitos` (los trucos que pide, entre los que sabe; los raciales de su criatura, por su nombre y
 * con su grupo «uno de estos»; su tipo), o `null` si los cumple: lo común de los adicionales y de los enseñados.
 */
function motivoDeSusRequisitos(truco: Truco, contexto: Pick<ContextoTrucosDelCompanero, 'sabe' | 'aptitudes' | 'idsTipo'>): string | null {
    const obligatorios = truco.Requisitos.Trucos.filter((t) => !t.Opcional);
    const faltan = obligatorios.filter((t) => !contexto.sabe.has(t.Id));
    if (faltan.length > 0)
        return `Pide saber ${unirLista(faltan.map((t) => `«${t.Nombre}»`), 'y')}.`;
    const opcionales = truco.Requisitos.Trucos.filter((t) => t.Opcional);
    if (opcionales.length > 0 && !opcionales.some((t) => contexto.sabe.has(t.Id)))
        return `Pide saber ${unirLista(opcionales.map((t) => `«${t.Nombre}»`), 'o')}.`;
    const tieneRacial = (r: { Nombre: string; }) => contexto.aptitudes.has(nombreDeAptitud(r.Nombre));
    const sinRacial = truco.Requisitos.Raciales.filter((r) => !r.Opcional && !tieneRacial(r));
    if (sinRacial.length > 0)
        return `Pide ${unirLista(sinRacial.map((r) => r.Nombre), 'y')}.`;
    const racialesOpcionales = truco.Requisitos.Raciales.filter((r) => r.Opcional);
    if (racialesOpcionales.length > 0 && !racialesOpcionales.some(tieneRacial))
        return `Pide ${unirLista([...new Set(racialesOpcionales.map((r) => nombreDeAptitud(r.Nombre)))], 'o')}.`;
    if (truco.Requisitos.Tipos.length > 0 && !truco.Requisitos.Tipos.some((t) => contexto.idsTipo.has(t.Id)))
        return `Solo para ${unirLista(truco.Requisitos.Tipos.map((t) => t.Nombre), 'o')}.`;
    return null;
}

/** Por qué no puede ser uno de sus trucos adicionales, o `null` si puede (contrato, «Los trucos del compañero»). */
export function motivoTrucoAdicional(truco: Truco, contexto: ContextoTrucosDelCompanero): string | null {
    if (truco.Es_fin)
        return 'Es un fin: un truco adicional es siempre un truco suelto.';
    if (contexto.sabe.has(truco.Id))
        return 'Ya lo sabe.';
    const requisitos = motivoDeSusRequisitos(truco, contexto);
    if (requisitos !== null)
        return requisitos;
    const coste = costeDelTruco(truco);
    if (coste > contexto.quedan)
        return `Cuenta ${coste} trucos y le ${contexto.quedan === 1 ? 'queda 1' : `quedan ${Math.max(0, contexto.quedan)}`}.`;
    return null;
}

/** Cuántos trucos aprende por cada punto de Inteligencia (MJ pág. 83: 3 con Int 1, 6 con Int 2). */
export const TRUCOS_POR_INTELIGENCIA = 3;

/**
 * Los trucos de más que le dan sus dotes: la suma de los `Trucos_extra` de cada una (del catálogo de dotes, por su id; si
 * no está, la de la dote de su ficha), contando cada vez que la tenga (Truco adicional, 3 cada vez).
 */
export function trucosExtraDeSusDotes(companero: CompaneroMonstruoDetalle | null | undefined, catalogoDotes: readonly Dote[]): number {
    const porId = new Map(catalogoDotes.map((d) => [toInt(d.Id), d] as const));
    return (companero?.Dotes ?? []).reduce((total, item) => {
        const dote = porId.get(toInt(item?.Dote?.Id)) ?? (item?.Dote as Partial<Dote> | undefined);
        return total + Math.max(0, toInt(dote?.Trucos_extra));
    }, 0);
}

/** Los que ha aprendido (los enseñados y los de su monstruo): los que cuentan para su límite. */
export function trucosAprendidosDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): TrucoDeMascota[] {
    return trucosDelCompanero(companero).filter((t) => t.Origen !== 'adicional');
}

/** Lo que hace falta para juzgar un truco que se le enseña con Trato con animales. */
export interface ContextoTrucoEnsenado extends Pick<ContextoTrucosDelCompanero, 'sabe' | 'aptitudes' | 'idsTipo'> {
    /** Su Inteligencia; `null` sin ella (una sabandija descerebrada). */
    inteligencia: number | null;
    /** Cuántos puede aprender: 3 × Int más lo que dan sus dotes. */
    limite: number;
    /** Lo que cuentan los que ha aprendido (un fin, lo que suman sus trucos). */
    cuenta: number;
    /** Los que ha aprendido, con su `Coste`. */
    aprendidos: readonly TrucoDeMascota[];
    /** Los trucos sueltos que sabe (de cualquier origen), aparte de los de su fin. */
    sueltos: ReadonlySet<number>;
    /** Sus trucos adicionales, que no se cambian: lo que los sustituye no se le enseña. */
    adicionales: readonly TrucoDeMascota[];
}

/** El contexto de un truco enseñado: lo que sabe, sus raciales, su tipo, su Inteligencia, su límite y lo que lleva. */
export function contextoDelTrucoEnsenado(companero: CompaneroMonstruoDetalle | null | undefined, catalogo: readonly Truco[],
    catalogoDotes: readonly Dote[]): ContextoTrucoEnsenado {
    const inteligencia = inteligenciaDelCompanero(companero);
    const int = sinPuntuacion(inteligencia) ? null : toInt(inteligencia);
    const aprendidos = trucosAprendidosDelCompanero(companero);
    // Lo que sabe, sus aptitudes y su tipo, como para los adicionales.
    const { sabe, aptitudes, idsTipo } = contextoDeTrucosDelCompanero(companero, catalogo);
    return {
        sabe,
        aptitudes,
        idsTipo,
        inteligencia: int,
        limite: int === null ? 0 : TRUCOS_POR_INTELIGENCIA * int + trucosExtraDeSusDotes(companero, catalogoDotes),
        cuenta: costeDeLosTrucos(aprendidos),
        aprendidos,
        sueltos: new Set(trucosDelCompanero(companero).filter((t) => !t.Es_fin).map((t) => t.Id)),
        adicionales: trucosAdicionalesDelCompanero(companero),
    };
}

/** Los que ha aprendido y que el `truco` sustituye (Combate montado a Monta; Ataca (todas las criaturas) a Ataca). */
export function trucosQueSustituye(truco: Truco, contexto: ContextoTrucoEnsenado): TrucoDeMascota[] {
    const id = toInt(truco.Sustituye?.Id);
    return id > 0 ? contexto.aprendidos.filter((t) => t.Id === id) : [];
}

/** «Sustituye a «Monta».» si ocupa el lugar de uno que ha aprendido; si no, `null`. */
export function textoDeLoQueSustituye(truco: Truco, contexto: ContextoTrucoEnsenado): string | null {
    const sustituidos = trucosQueSustituye(truco, contexto);
    return sustituidos.length > 0 ? `Sustituye a ${unirLista(sustituidos.map((t) => `«${t.Nombre}»`), 'y')}.` : null;
}

/**
 * Por qué no se le puede enseñar (evento `truco_ensenado`; contrato, «Los trucos del compañero»), o `null` si se puede: sin
 * Inteligencia o con 3 o más, si ya lo sabe, sus requisitos, un solo fin con su Inteligencia mínima y sin repetir un truco
 * que sabe suelto, y su límite (3 × Int más lo de sus dotes, con lo que deja libre el que sustituye). Como la API.
 */
export function motivoTrucoEnsenado(truco: Truco, contexto: ContextoTrucoEnsenado): string | null {
    const int = contexto.inteligencia;
    if (int === null)
        return 'Sin Inteligencia no se le pueden enseñar trucos.';
    if (int >= 3)
        return `Con Inteligencia ${int} ya no aprende trucos: Trato con animales solo vale con Inteligencia 1 o 2.`;
    if (contexto.sabe.has(truco.Id))
        return 'Ya lo sabe.';
    const requisitos = motivoDeSusRequisitos(truco, contexto);
    if (requisitos !== null)
        return requisitos;
    const adicional = contexto.adicionales.find((t) => t.Id === toInt(truco.Sustituye?.Id));
    if (adicional)
        return `Sustituiría a «${adicional.Nombre}», que es uno de sus trucos adicionales: esos no se cambian.`;
    const sustituidos = trucosQueSustituye(truco, contexto);
    if (truco.Es_fin) {
        const fin = contexto.aprendidos.find((t) => t.Es_fin && !sustituidos.includes(t));
        if (fin)
            return `Solo puede tener un fin, y ya sabe «${fin.Nombre}».`;
        if (toInt(truco.Int_minima) > int)
            return `«${truco.Nombre}» pide Inteligencia ${toInt(truco.Int_minima)}, y tiene ${int}.`;
        const repetidos = truco.Trucos.filter((t) => contexto.sueltos.has(t.Id));
        if (repetidos.length > 0)
            return `Ya sabe ${unirLista(repetidos.map((t) => `«${t.Nombre}»`), 'y')} suelto: el fin no puede repetirlo.`;
    }
    const llevaria = contexto.cuenta - costeDeLosTrucos(sustituidos) + costeDelTruco(truco);
    if (llevaria > contexto.limite)
        return `Con Inteligencia ${int} sabe como mucho ${contexto.limite} trucos, y llevaría ${llevaria}.`;
    return null;
}

/** Los trucos y los fines del catálogo que se le pueden enseñar (los oficiales, salvo en una ficha homebrew). */
export function trucosQueSeEnsenan(catalogo: readonly Truco[], incluirHomebrew: boolean): Truco[] {
    return catalogo.filter((t) => incluirHomebrew || t.Oficial);
}

/** Los trucos sueltos del catálogo que se le ofrecen como adicionales (los que se enseñan, sin los fines). */
export function trucosQueSeOfrecen(catalogo: readonly Truco[], incluirHomebrew: boolean): Truco[] {
    return trucosQueSeEnsenan(catalogo, incluirHomebrew).filter((t) => !t.Es_fin);
}

/** Un truco de una lista para elegir (los adicionales y los enseñados), con por qué no se puede elegir (`null` si se puede). */
export interface TrucoConMotivo {
    truco: Truco;
    motivo: string | null;
}

/** El orden de esas listas: primero los que se pueden elegir y después los demás, cada grupo por nombre. */
export function porMotivoYNombre(a: TrucoConMotivo, b: TrucoConMotivo): number {
    return Number(a.motivo !== null) - Number(b.motivo !== null) || compararTexto(a.truco.Nombre, b.truco.Nombre);
}

/** Si le queda algún truco adicional por elegir y alguno de los que se ofrecen le vale: si no, el selector sobra. */
export function hayTrucoAdicionalQueElegir(companero: CompaneroMonstruoDetalle | null | undefined, catalogo: readonly Truco[],
    incluirHomebrew: boolean): boolean {
    if (trucosAdicionalesPendientes(companero) < 1)
        return false;
    const contexto = contextoDeTrucosDelCompanero(companero, catalogo);
    return trucosQueSeOfrecen(catalogo, incluirHomebrew).some((t) => motivoTrucoAdicional(t, contexto) === null);
}

/**
 * Pone los adicionales elegidos (`elegidos`, en el orden en que se eligieron) detrás de los que ya tiene, si todos valen con
 * lo que sabe y lo que le queda. Devuelve si los puso.
 */
export function aplicarTrucosAdicionales(companero: CompaneroMonstruoDetalle | null | undefined, elegidos: readonly Truco[],
    catalogo: readonly Truco[]): boolean {
    if (!companero || elegidos.length < 1)
        return false;
    const puestos: Truco[] = [];
    for (const truco of elegidos) {
        if (motivoTrucoAdicional(truco, contextoDeTrucosDelCompanero(companero, catalogo, puestos)) !== null)
            return false;
        puestos.push(truco);
    }
    let orden = trucosAdicionalesDelCompanero(companero).reduce((max, t) => Math.max(max, toInt(t.Orden)), 0);
    companero.Trucos = [
        ...trucosDelCompanero(companero),
        ...puestos.map((t): TrucoDeMascota => ({
            Id: t.Id, Nombre: t.Nombre, Origen: 'adicional', Orden: ++orden, Coste: costeDelTruco(t), Es_fin: false,
        })),
    ];
    return true;
}

/**
 * Al perder un nivel o quedar inactivo, los adicionales que ya no le caben con sus `Trucos_adi` de ahora (contando su
 * `Coste`, por su orden): pierde los últimos que eligió. Los de su monstruo y los enseñados se quedan. Devuelve si quitó alguno.
 */
export function quitarLosTrucosQueNoCaben(companero: CompaneroMonstruoDetalle | null | undefined): boolean {
    if (!companero)
        return false;
    const caben = companero.Inactiva ? 0 : Math.max(0, toInt(companero.Trucos_adi));
    let cuenta = 0;
    const quedan = new Set<TrucoDeMascota>();
    trucosAdicionalesDelCompanero(companero).forEach((t) => {
        cuenta += costeDelTruco(t);
        if (cuenta <= caben)
            quedan.add(t);
    });
    const antes = trucosDelCompanero(companero);
    const despues = antes.filter((t) => t.Origen !== 'adicional' || quedan.has(t));
    if (despues.length === antes.length)
        return false;
    companero.Trucos = despues;
    return true;
}

/** Los trucos de su monstruo, como trucos de la mascota (`monstruo`): los que lleva al elegirlo. */
export function trucosDeSuMonstruo(monstruo: { Trucos?: TrucoDeMascota[]; } | null | undefined): TrucoDeMascota[] {
    return (monstruo?.Trucos ?? []).map((t) => ({ ...t, Origen: 'monstruo', Orden: null }));
}

/**
 * Sus trucos con los de su monstruo que le falten (la ficha de antes de los trucos no los guardaba), salvo el que ya
 * sustituye uno que sabe (Combate montado a Monta), con el `Sustituye` del `catalogo`: como la API
 * (`companero_animal.con_los_de_su_monstruo`; contrato, «Los trucos del compañero»).
 */
export function conLosTrucosDeSuMonstruo(trucos: readonly TrucoDeMascota[] | null | undefined,
    monstruo: { Trucos?: TrucoDeMascota[]; } | null | undefined, catalogo: readonly Truco[] = []): TrucoDeMascota[] {
    const tiene = new Set((trucos ?? []).map((t) => t.Id));
    const porId = new Map(catalogo.map((t) => [t.Id, t] as const));
    const sustituidos = new Set([...tiene].map((id) => toInt(porId.get(id)?.Sustituye?.Id)).filter((id) => id > 0));
    return [...(trucos ?? []), ...trucosDeSuMonstruo(monstruo).filter((t) => !tiene.has(t.Id) && !sustituidos.has(t.Id))];
}

/** `companero.trucos[]` del alta y de los cambios de la ficha: `{ idTruco, origen, orden? }` (el orden, en los adicionales). */
export function trucosParaGuardar(companero: CompaneroMonstruoDetalle | null | undefined): NonNullable<PersonajeCreateCompaneroDto['trucos']> {
    const vistos = new Set<number>();
    return trucosDelCompanero(companero)
        .filter((t) => t.Id > 0 && !vistos.has(t.Id) && !!vistos.add(t.Id))
        .map((t) => ({ idTruco: t.Id, origen: t.Origen, ...(t.Origen === 'adicional' && toInt(t.Orden) > 0 ? { orden: toInt(t.Orden) } : {}) }));
}

/** El título del selector de sus trucos adicionales. */
export function tituloDeLosTrucosDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined): string {
    return `Trucos adicionales de ${nombreDelCompanero(companero)}`;
}

/**
 * Su texto en la ficha: en una mascota, «Ataca (adicional)», «Combate montado (fin; de su monstruo)», «Busca (enseñado)»;
 * en un monstruo (`deUnaMascota` falso), su nombre y, si es un fin, «(fin)».
 */
export function textoDelTrucoDeMascota(truco: TrucoDeMascota, deUnaMascota = true): string {
    if (!deUnaMascota)
        return truco.Es_fin ? `${truco.Nombre} (fin)` : truco.Nombre;
    const origen = truco.Origen === 'adicional' ? 'adicional' : truco.Origen === 'ensenado' ? 'enseñado' : 'de su monstruo';
    return `${truco.Nombre} (${truco.Es_fin ? `fin; ${origen}` : origen})`;
}

/** Sus trucos para la ficha, por su origen (los adicionales, por su orden; después los de su monstruo y los enseñados). */
export function trucosParaLaFicha(criatura: { Trucos?: TrucoDeMascota[]; } | null | undefined, deUnaMascota = true): string[] {
    const peso: Record<string, number> = { adicional: 0, monstruo: 1, ensenado: 2 };
    return [...(criatura?.Trucos ?? [])]
        .filter((t) => `${t.Nombre ?? ''}`.trim().length > 0)
        .sort((a, b) => (peso[a.Origen] ?? 3) - (peso[b.Origen] ?? 3) || toInt(a.Orden) - toInt(b.Orden))
        .map((t) => textoDelTrucoDeMascota(t, deUnaMascota));
}
