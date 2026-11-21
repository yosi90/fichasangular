import { CompaneroMonstruoDetalle, TrucoDeMascota } from 'src/app/interfaces/monstruo';
import { PersonajeCreateCompaneroDto } from 'src/app/interfaces/personajes-api';
import { Truco } from 'src/app/interfaces/truco';
import { sinPuntuacion } from 'src/app/services/utils/caracteristicas';
import { nombreDelCompanero } from 'src/app/services/utils/companero-dotes';
import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';

/*
 * Los trucos del compañero animal (contrato: `docs/publica/endpoints/personajes.md`, «Los trucos del compañero»; reglas:
 * el dictamen del máster de Rol del 2026-11-21, en el roadmap, punto 2; MJ págs. 36 y 83). Los adicionales de su tabla
 * (`Trucos_adi`) los elige el jugador: trucos sueltos, sin repetir, con sus requisitos y contando su `Coste`; no se cambian,
 * y al perder un nivel se pierden los últimos que eligió.
 */

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
    const inteligencia = (companero?.Caracteristicas as Record<string, number | null> | undefined)?.['Inteligencia'];
    return !sinPuntuacion(inteligencia) && toInt(inteligencia) >= 3;
}

/** Lo que cuentan sus adicionales (su `Coste`). */
export function costeDeLosAdicionales(companero: CompaneroMonstruoDetalle | null | undefined): number {
    return trucosAdicionalesDelCompanero(companero).reduce((total, t) => total + Math.max(1, toInt(t.Coste, 1)), 0);
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
    idTipo: number;
    quedan: number;
}

/** El contexto de sus trucos con el catálogo, más los que lleva elegidos en el selector (`elegidos`, que cuentan ya). */
export function contextoDeTrucosDelCompanero(companero: CompaneroMonstruoDetalle | null | undefined, catalogo: readonly Truco[],
    elegidos: readonly Truco[] = []): ContextoTrucosDelCompanero {
    return {
        sabe: idsDeLoQueSabe([...trucosDelCompanero(companero).map((t) => t.Id), ...elegidos.map((t) => t.Id)], catalogo),
        aptitudes: aptitudesDeLaCriatura(companero),
        idTipo: toInt(companero?.Tipo?.Id),
        quedan: trucosAdicionalesPendientes(companero) - elegidos.reduce((total, t) => total + Math.max(1, toInt(t.Coste, 1)), 0),
    };
}

/** Por qué no puede ser uno de sus trucos adicionales, o `null` si puede (contrato, «Los trucos del compañero»). */
export function motivoTrucoAdicional(truco: Truco, contexto: ContextoTrucosDelCompanero): string | null {
    if (truco.Es_fin)
        return 'Es un fin: un truco adicional es siempre un truco suelto.';
    if (contexto.sabe.has(truco.Id))
        return 'Ya lo sabe.';
    const obligatorios = truco.Requisitos.Trucos.filter((t) => !t.Opcional);
    const faltan = obligatorios.filter((t) => !contexto.sabe.has(t.Id));
    if (faltan.length > 0)
        return `Pide saber ${unirLista(faltan.map((t) => `«${t.Nombre}»`), 'y')}.`;
    const opcionales = truco.Requisitos.Trucos.filter((t) => t.Opcional);
    if (opcionales.length > 0 && !opcionales.some((t) => contexto.sabe.has(t.Id)))
        return `Pide saber ${unirLista(opcionales.map((t) => `«${t.Nombre}»`), 'o')}.`;
    const sinAptitud = truco.Requisitos.Especiales.filter((e) => !contexto.aptitudes.has(nombreDeAptitud(e.Nombre)));
    if (sinAptitud.length > 0)
        return `Pide ${unirLista(sinAptitud.map((e) => e.Nombre), 'y')}.`;
    if (truco.Requisitos.Tipos.length > 0 && !truco.Requisitos.Tipos.some((t) => t.Id === contexto.idTipo))
        return `Solo para ${unirLista(truco.Requisitos.Tipos.map((t) => t.Nombre), 'o')}.`;
    const coste = Math.max(1, toInt(truco.Coste, 1));
    if (coste > contexto.quedan)
        return `Cuenta ${coste} trucos y le ${contexto.quedan === 1 ? 'queda 1' : `quedan ${Math.max(0, contexto.quedan)}`}.`;
    return null;
}

/** Los trucos sueltos del catálogo que se le ofrecen como adicionales (los oficiales, salvo en una ficha homebrew), por nombre. */
export function trucosQueSeOfrecen(catalogo: readonly Truco[], incluirHomebrew: boolean): Truco[] {
    return catalogo.filter((t) => !t.Es_fin && (incluirHomebrew || t.Oficial));
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
            Id: t.Id, Nombre: t.Nombre, Origen: 'adicional', Orden: ++orden, Coste: Math.max(1, toInt(t.Coste, 1)), Es_fin: false,
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
        cuenta += Math.max(1, toInt(t.Coste, 1));
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
 * Sus trucos con los de su monstruo que le falten (la ficha de antes de los trucos no los guardaba; la API pide que estén
 * todos: contrato, «Los trucos del compañero»).
 */
export function conLosTrucosDeSuMonstruo(trucos: readonly TrucoDeMascota[] | null | undefined,
    monstruo: { Trucos?: TrucoDeMascota[]; } | null | undefined): TrucoDeMascota[] {
    const tiene = new Set((trucos ?? []).map((t) => t.Id));
    return [...(trucos ?? []), ...trucosDeSuMonstruo(monstruo).filter((t) => !tiene.has(t.Id))];
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
