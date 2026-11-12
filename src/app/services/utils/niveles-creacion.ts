import {
    PersonajeCreateNivelDto,
    PersonajeCreateNivelEleccionDto,
    PersonajeProgresionLanzadorSeleccionDto,
} from 'src/app/interfaces/personajes-api';
import { toInt } from 'src/app/services/utils/normalizacion';
import { DadoDeGolpe } from 'src/app/services/utils/puntos-golpe';

/*
 * El orden de los niveles del alta (`niveles` de `POST /personajes/add`, desde el 2026-11-07; guía
 * `docs/publica/SESIONES_FRONT.md`): cada nivel de clase en el orden en que se tomó, con la tirada de PG de su DG y lo que
 * se eligió en él, para que la subida de nivel siga con el mismo motor. La API no comprueba las reglas por nivel: guarda
 * lo que llega.
 *
 * El nivel de cada elección es un dato que el motor apunta al elegir (desde el 2026-11-12, fase 4 de las sesiones):
 * `NuevoPersonajeService` lleva el nivel en curso (`aplicarSiguienteNivelClase`), las dotes y los incrementos pendientes
 * nacen con su nivel, y cada dote, aptitud, dominio, conjuro, idioma, incremento y los rangos de su reparto se apuntan en
 * `Orden_niveles[i].elecciones` (`apuntarEleccion`). Aquí solo se juntan con la tirada de cada DG y los aumentos de nivel
 * de lanzador (`progresionLanzador`, que ya dicen su clase y su nivel).
 */

/** Un nivel tomado: el n-ésimo de su clase, con lo que se eligió en él. */
export interface NivelTomado {
    idClase: number;
    nivelClase: number;
    elecciones?: PersonajeCreateNivelEleccionDto[];
}

/** El nivel de una elección (su clase y su nivel en ella), sin lo elegido. */
export type RefNivelTomado = Pick<NivelTomado, 'idClase' | 'nivelClase'>;

export interface EntradaNivelesCreacion {
    /** El orden en que se tomaron los niveles, con sus elecciones (`Personaje.Orden_niveles`). */
    orden: NivelTomado[] | null | undefined;
    /** Las clases que tiene al terminar, con su nivel (`desgloseClases`): si el orden no cuadra con ellas, no se manda. */
    clases: Array<{ id: number; nombre: string; nivel: number; }>;
    /** Los DG de la tirada de PG elegida, en su orden (`ResultadoPuntosGolpe.dados`). */
    dados?: DadoDeGolpe[] | null;
    /** Los aumentos de nivel de lanzador (`progresionLanzador.selecciones`). */
    aumentosLanzador?: PersonajeProgresionLanzadorSeleccionDto[];
}

/** Ese nivel en el orden (su clase y su nivel en ella), o `undefined` si no está o no hay nivel. */
export function nivelDelOrden(orden: NivelTomado[] | null | undefined, nivel: RefNivelTomado | null | undefined): NivelTomado | undefined {
    return nivel
        ? (orden ?? []).find((n) => toInt(n?.idClase) === toInt(nivel.idClase) && toInt(n?.nivelClase) === toInt(nivel.nivelClase))
        : undefined;
}

/** Apunta una elección en su nivel del orden (si el nivel no está, no se apunta: no es de ningún nivel de clase). */
export function apuntarEleccion(
    orden: NivelTomado[] | null | undefined,
    nivel: RefNivelTomado | null | undefined,
    eleccion: PersonajeCreateNivelEleccionDto,
): boolean {
    const destino = nivelDelOrden(orden, nivel);
    if (!destino)
        return false;
    destino.elecciones = [...(destino.elecciones ?? []), eleccion];
    return true;
}

/** Si el orden tiene, de cada clase, sus niveles del 1 al suyo y en orden (y nada de otra clase). */
export function ordenCuadra(orden: NivelTomado[], clases: EntradaNivelesCreacion['clases']): boolean {
    const esperados = new Map(clases.filter((c) => toInt(c.id) > 0 && toInt(c.nivel) > 0).map((c) => [toInt(c.id), toInt(c.nivel)]));
    const vistos = new Map<number, number>();
    for (const nivel of orden) {
        const siguiente = (vistos.get(nivel.idClase) ?? 0) + 1;
        if (!esperados.has(nivel.idClase) || nivel.nivelClase !== siguiente)
            return false;
        vistos.set(nivel.idClase, siguiente);
    }
    return [...esperados].every(([id, nivel]) => vistos.get(id) === nivel);
}

/** `niveles` del alta, o `null` si no hay un orden que cuadre con las clases (la API los guarda entonces sin orden). */
export function construirNivelesCreacion(entrada: EntradaNivelesCreacion): PersonajeCreateNivelDto[] | null {
    const orden = (entrada.orden ?? []).map((n) => ({ idClase: toInt(n?.idClase), nivelClase: toInt(n?.nivelClase) }));
    if (orden.length < 1 || !ordenCuadra(orden, entrada.clases))
        return null;

    const niveles: PersonajeCreateNivelDto[] = (entrada.orden ?? []).map((n) => ({
        idClase: toInt(n?.idClase),
        nivelClase: toInt(n?.nivelClase),
        elecciones: (n?.elecciones ?? []).map((e) => ({ ...e })),
    }));
    const indice = new Map(orden.map((n, i) => [`${n.idClase}:${n.nivelClase}`, i]));
    const nivelDe = (idClase: number, nivelClase: number): PersonajeCreateNivelDto | null => {
        const i = indice.get(`${idClase}:${nivelClase}`);
        return i === undefined ? null : niveles[i];
    };

    // La tirada de cada DG de clase: el k-ésimo DG de una clase es su k-ésimo nivel, si cada nivel da uno (una clase de
    // monstruo con niveles sin DG se queda sin tirada).
    const dadosPorClase = new Map<number, DadoDeGolpe[]>();
    (entrada.dados ?? []).filter((d) => d?.origen === 'clase' && toInt(d.idClase) > 0)
        .forEach((d) => dadosPorClase.set(toInt(d.idClase), [...(dadosPorClase.get(toInt(d.idClase)) ?? []), d]));
    entrada.clases.forEach((clase) => {
        const dados = dadosPorClase.get(toInt(clase.id)) ?? [];
        if (dados.length !== toInt(clase.nivel))
            return;
        dados.forEach((dado, k) => {
            const nivel = nivelDe(toInt(clase.id), k + 1);
            if (nivel)
                nivel.pg = { tirada: toInt(dado.resultado) || null, maximo: dado.maximizado === true };
        });
    });

    (entrada.aumentosLanzador ?? []).forEach((aumento) => nivelDe(toInt(aumento.idClaseAplicada), toInt(aumento.nivelClaseAplicado))?.elecciones!.push({
        tipo: 'aumento_lanzador',
        idElemento: toInt(aumento.idClaseObjetivo),
        valor: toInt(aumento.indiceAumento),
    }));
    return niveles;
}
