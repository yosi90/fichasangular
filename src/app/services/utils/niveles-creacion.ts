import {
    PersonajeCreateNivelDto,
    PersonajeCreateNivelEleccionDto,
    PersonajeProgresionLanzadorSeleccionDto,
} from 'src/app/interfaces/personajes-api';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { DadoDeGolpe } from 'src/app/services/utils/puntos-golpe';

/*
 * El orden de los niveles del alta (`niveles` de `POST /personajes/add`, desde el 2026-11-07; guía
 * `docs/publica/SESIONES_FRONT.md`): cada nivel de clase en el orden en que se tomó, con la tirada de PG de su DG y lo que
 * se eligió en él, para que la subida de nivel siga con el mismo motor. La API no comprueba las reglas por nivel: guarda
 * lo que llega.
 *
 * Lo que se manda (lo que la creación ya sabe nivel a nivel): el orden (`aplicarSiguienteNivelClase`), la tirada de cada
 * DG de clase (`calcularVidaFinalAleatoria`), las dotes y los conjuros cuyo origen dice su nivel («Mago nivel 3»,
 * «Dote adicional por nivel 3») y los aumentos de nivel de lanzador. Lo que todavía no se manda (no se apunta por nivel):
 * los incrementos de característica, los rangos, los idiomas, los dominios y las aptitudes especiales.
 */

/** Un nivel tomado: el n-ésimo de su clase. */
export interface NivelTomado {
    idClase: number;
    nivelClase: number;
}

export interface EntradaNivelesCreacion {
    /** El orden en que se tomaron los niveles (`Personaje.Orden_niveles`). */
    orden: NivelTomado[] | null | undefined;
    /** Las clases que tiene al terminar, con su nivel (`desgloseClases`): si el orden no cuadra con ellas, no se manda. */
    clases: Array<{ id: number; nombre: string; nivel: number; }>;
    /** Los DG de la tirada de PG elegida, en su orden (`ResultadoPuntosGolpe.dados`). */
    dados?: DadoDeGolpe[] | null;
    /** Las dotes que se guardan (`colecciones.dotes`). */
    dotes?: Array<{ idDote: number; idExtra?: number; origen?: string; }>;
    /** Los conjuros que se guardan (`colecciones.conjurosConocidos`); los copiados al libro no son de ningún nivel. */
    conjuros?: Array<{ idConjuro: number; idClase?: number; origen?: string; copiado?: boolean; }>;
    /** Los aumentos de nivel de lanzador (`progresionLanzador.selecciones`). */
    aumentosLanzador?: PersonajeProgresionLanzadorSeleccionDto[];
    /** Los DG que tiene antes de sus niveles de clase (los raciales que cuentan y los de sus plantillas). */
    dgsAntesDeLasClases?: number;
}

const ORIGEN_DE_CLASE = /^(?:dote por nivel: |dote adicional: )?(.+?) nivel (\d+)(?: \(clase\))?$/;
const ORIGEN_DE_NIVEL_DE_PERSONAJE = /^dote adicional por nivel (\d+)$/;

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

    const niveles: PersonajeCreateNivelDto[] = orden.map((n) => ({ idClase: n.idClase, nivelClase: n.nivelClase, elecciones: [] }));
    const indice = new Map(orden.map((n, i) => [`${n.idClase}:${n.nivelClase}`, i]));
    const nivelDe = (idClase: number, nivelClase: number): PersonajeCreateNivelDto | null => {
        const i = indice.get(`${idClase}:${nivelClase}`);
        return i === undefined ? null : niveles[i];
    };
    const clasePorNombre = new Map(entrada.clases.map((c) => [normalizarTexto(c.nombre ?? ''), toInt(c.id)]));
    const nivelDelOrigen = (origen: string | undefined): PersonajeCreateNivelDto | null => {
        const texto = normalizarTexto(`${origen ?? ''}`.trim());
        const deClase = texto.match(ORIGEN_DE_CLASE);
        const idClase = deClase ? clasePorNombre.get(normalizarTexto(deClase[1])) : undefined;
        if (deClase && idClase)
            return nivelDe(idClase, toInt(deClase[2]));
        const dePersonaje = texto.match(ORIGEN_DE_NIVEL_DE_PERSONAJE);
        if (dePersonaje) {
            const posicion = toInt(dePersonaje[1]) - Math.max(0, toInt(entrada.dgsAntesDeLasClases));
            return posicion >= 1 && posicion <= niveles.length ? niveles[posicion - 1] : null;
        }
        return null;
    };
    const apuntar = (nivel: PersonajeCreateNivelDto | null, eleccion: PersonajeCreateNivelEleccionDto) => {
        if (nivel)
            nivel.elecciones!.push(eleccion);
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

    (entrada.dotes ?? []).forEach((dote) => apuntar(nivelDelOrigen(dote.origen), {
        tipo: 'dote',
        idElemento: toInt(dote.idDote),
        idExtra: toInt(dote.idExtra),
        ...(dote.origen ? { origen: dote.origen } : {}),
    }));
    (entrada.conjuros ?? []).filter((conjuro) => conjuro.copiado !== true).forEach((conjuro) => apuntar(nivelDelOrigen(conjuro.origen), {
        tipo: 'conjuro',
        idElemento: toInt(conjuro.idConjuro),
        ...(toInt(conjuro.idClase) > 0 ? { idExtra: toInt(conjuro.idClase) } : {}),
        ...(conjuro.origen ? { origen: conjuro.origen } : {}),
    }));
    (entrada.aumentosLanzador ?? []).forEach((aumento) => apuntar(nivelDe(toInt(aumento.idClaseAplicada), toInt(aumento.nivelClaseAplicado)), {
        tipo: 'aumento_lanzador',
        idElemento: toInt(aumento.idClaseObjetivo),
        valor: toInt(aumento.indiceAumento),
    }));
    return niveles;
}
