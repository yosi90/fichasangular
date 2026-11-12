import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';

/**
 * Las aptitudes sortílegas de los rasgos raciales del personaje (`Sortilegas` de cada racial: los poderes que un githyanki
 * gana a nivel 3, 6 y 9), en la creación y en la subida de nivel. La misma regla que la ficha de la API
 * (`utils/racial_sortilegas.py`): se suman a las que tiene (las de su raza, las guardadas), detrás y sin repetir un
 * conjuro, con el nombre del rasgo como `Origen`. Guía `docs/publica/RAZAS_MUTADAS.md`.
 *
 * Además, las de un rasgo que ya no tiene (lo sustituyó la progresión) salen: las que llevan su nombre como `Origen` y
 * uno de sus conjuros. `antes`, los rasgos de los que se partía (con su progresión, de donde salen los que pudo ganar).
 */
export function sortilegasConLasDeRasgos(
    actuales: AptitudSortilega[] | null | undefined,
    ahora: RacialDetalle[] | null | undefined,
    antes: RacialDetalle[] | null | undefined = [],
): AptitudSortilega[] {
    const tiene = new Set((ahora ?? []).map((racial) => toInt(racial?.Id)));
    const quitados = rasgosPosibles([...(antes ?? []), ...(ahora ?? [])]).filter((racial) => !tiene.has(toInt(racial?.Id)));
    const deUnQuitado = (sortilega: AptitudSortilega) => quitados.some((racial) =>
        normalizarTexto(racial.Nombre) === normalizarTexto(sortilega?.Origen)
        && (racial.Sortilegas ?? []).some((s) => toInt(s?.Conjuro?.Id) === toInt(sortilega?.Conjuro?.Id)));
    const resultado = (actuales ?? []).filter((sortilega) => !deUnQuitado(sortilega));
    const conjuros = new Set(resultado.map((sortilega) => toInt(sortilega?.Conjuro?.Id)));
    for (const racial of ahora ?? []) {
        for (const sortilega of racial?.Sortilegas ?? []) {
            const id = toInt(sortilega?.Conjuro?.Id);
            if (id <= 0 || conjuros.has(id))
                continue;
            conjuros.add(id);
            resultado.push({
                Conjuro: { ...sortilega.Conjuro },
                Nivel_lanzador: sortilega.Nivel_lanzador,
                Usos_diarios: `${sortilega.Usos_diarios ?? ''}`.trim(),
                Descripcion: '',
                Dgs_necesarios: 0,
                Origen: `${racial.Nombre ?? ''}`.trim(),
            });
        }
    }
    return resultado;
}

/** Los rasgos y los que pueden ganar con su progresión (también los que ganan esos), una vez cada uno. */
function rasgosPosibles(raciales: RacialDetalle[]): RacialDetalle[] {
    const vistos = new Map<number, RacialDetalle>();
    const pendientes = [...raciales];
    while (pendientes.length > 0) {
        const racial = pendientes.shift();
        if (!racial || vistos.has(toInt(racial.Id)))
            continue;
        vistos.set(toInt(racial.Id), racial);
        (racial.Progresion ?? []).forEach((fila) => {
            if (fila?.Gana)
                pendientes.push(fila.Gana);
        });
    }
    return [...vistos.values()];
}
