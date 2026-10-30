import { Clase, ClaseConjuroRef, ClaseEspecialNivel, ClaseNivelConjuroRequisito } from 'src/app/interfaces/clase';
import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { EspecialPrerrequisitos } from 'src/app/interfaces/especial';
import { toArray, toInt } from 'src/app/services/utils/normalizacion';
import { MotivosPrerrequisitos, compararActitud } from 'src/app/services/utils/prerrequisitos-evaluacion';
import { frasePrerrequisito, grupoOpcionalPrerrequisito } from 'src/app/services/utils/prerrequisito-frase';

/*
 * Lo que las aptitudes de una clase cambian en la creación (guía `docs/publica/CLASES_PROPIAS_FRONT.md`), siempre desde
 * los datos, nunca por el nombre ni el id de una clase, una aptitud o una dote:
 * - una aptitud puede pedir una actitud (`Prerrequisitos.actitud_requerido` / `actitud_prohibido`): la senda esandy del
 *   convocador divino, un alineamiento bueno;
 * - una aptitud puede sumar conjuros a la lista de la clase (`Conjuros.Listado_por_especial`);
 * - un nivel de conjuro de la clase puede pedir una aptitud o una dote (`Conjuros.Niveles_con_requisito`);
 * - una aptitud puede cambiar el tamaño (`Tamano_pasos`; ver `tamano-efectivo.ts`).
 */

/** Una aptitud especial que tiene el personaje: su id y el de su extra (0 o sin él, ninguno). */
export interface AptitudDelPersonaje {
    id: number;
    idExtra?: number | null;
}

/** Los prerrequisitos de actitud de un especial (`Prerrequisitos` de `GET /clases/habilidades` y del de cada nivel). */
export function normalizarPrerrequisitosEspecial(raw: any): EspecialPrerrequisitos {
    return {
        actitud_requerido: toArray(raw?.actitud_requerido),
        actitud_prohibido: toArray(raw?.actitud_prohibido),
    };
}

/** El especial de un nivel de la clase (`Desglose_niveles[].Especiales[].Especial`, que la web guarda tal cual). */
function especialDelNivel(especialNivel: ClaseEspecialNivel | null | undefined): Record<string, any> {
    return (especialNivel?.Especial ?? {}) as Record<string, any>;
}

/** Las categorías de tamaño que suma el especial de un nivel de la clase (`Modificadores.Tamano_pasos`). */
export function pasosTamanoEspecialNivel(especialNivel: ClaseEspecialNivel | null | undefined): number {
    return toInt(especialDelNivel(especialNivel)?.['Modificadores']?.['Tamano_pasos']);
}

/** Las columnas de características del especial de un nivel de la clase (`Modificadores.Fuerza`…); 0 las que no da. */
export function modificadoresCaracteristicaEspecialNivel(especialNivel: ClaseEspecialNivel | null | undefined): Record<Caracteristica, number> {
    const modificadores = especialDelNivel(especialNivel)?.['Modificadores'] ?? {};
    return Object.fromEntries(CARACTERISTICAS.map((key) => [key, toInt(modificadores?.[key])])) as Record<Caracteristica, number>;
}

/** Los prerrequisitos de actitud del especial de un nivel de la clase. */
export function prerrequisitosEspecialNivel(especialNivel: ClaseEspecialNivel | null | undefined): EspecialPrerrequisitos {
    return normalizarPrerrequisitosEspecial(especialDelNivel(especialNivel)?.['Prerrequisitos']);
}

/** Si un especial tiene algún prerrequisito de actitud. */
export function tienePrerrequisitosActitud(prerrequisitos: EspecialPrerrequisitos | null | undefined): boolean {
    return (prerrequisitos?.actitud_requerido?.length ?? 0) + (prerrequisitos?.actitud_prohibido?.length ?? 0) > 0;
}

/**
 * Si el alineamiento básico (1-9) cumple los prerrequisitos de actitud de un especial, con los motivos («No cumple:
 * Cualquier alineamiento bueno») si no. Las alternativas (el mismo `Opcional` > 0) bastan con una; sin alineamiento no
 * se cumple ninguno.
 */
export function evaluarActitudEspecial(
    prerrequisitos: EspecialPrerrequisitos | null | undefined,
    idAlineamientoBasico: number
): { cumple: boolean; motivos: string[]; } {
    const motivos = new MotivosPrerrequisitos();
    const registrar = (clave: 'actitud_requerido' | 'actitud_prohibido', prohibido: boolean) =>
        toArray<Record<string, any>>(prerrequisitos?.[clave]).forEach((entrada) => motivos.registrar({
            grupoOpcional: grupoOpcionalPrerrequisito(entrada),
            ...compararActitud(entrada, idAlineamientoBasico, prohibido),
            frase: frasePrerrequisito(clave, entrada),
            clave,
        }));
    registrar('actitud_requerido', false);
    registrar('actitud_prohibido', true);
    motivos.cerrarGrupos();
    const todos = [...motivos.fail, ...motivos.unknown];
    return { cumple: todos.length < 1, motivos: Array.from(new Set(todos)) };
}

function tieneAptitud(aptitudes: AptitudDelPersonaje[], idEspecial: number, idExtra: number | null): boolean {
    return idEspecial > 0 && aptitudes.some((aptitud) => toInt(aptitud?.id) === idEspecial
        && (idExtra === null || toInt(aptitud?.idExtra) === idExtra));
}

/** Los conjuros de la lista de la clase que da cada aptitud que tiene el personaje (y su extra, si lo pide). */
export function conjurosDeAptitudes(clase: Clase | null | undefined, aptitudes: AptitudDelPersonaje[]): ClaseConjuroRef[] {
    return toArray(clase?.Conjuros?.Listado_por_especial)
        .filter((ref) => tieneAptitud(aptitudes, toInt(ref?.Especial?.Id), ref?.Extra ? toInt(ref.Extra.Id) : null))
        .map(({ Id, Nombre, Nivel, Espontaneo }) => ({ Id, Nombre, Nivel, Espontaneo }));
}

/**
 * La lista de conjuros de la clase para el personaje, sin repetir conjuros y por este orden (el de la API al comprar en
 * la tienda del libro): la suya (`Listado`), la de sus aptitudes y la de su clase de origen (`Clase_origen`), si la da.
 */
export function listadoConjurosClase(
    clase: Clase | null | undefined,
    aptitudes: AptitudDelPersonaje[],
    claseOrigen: Clase | null = null
): ClaseConjuroRef[] {
    const ids = new Set<number>();
    return [...toArray(clase?.Conjuros?.Listado), ...conjurosDeAptitudes(clase, aptitudes), ...toArray(claseOrigen?.Conjuros?.Listado)]
        .filter((ref) => {
            const id = toInt(ref?.Id);
            if (ids.has(id))
                return false;
            ids.add(id);
            return true;
        });
}

/**
 * Los niveles de conjuro de la clase que el personaje no tiene porque piden una aptitud o una dote que no tiene
 * (`Conjuros.Niveles_con_requisito`; varias filas del mismo nivel son alternativas). Sin filas, ninguno.
 */
export function nivelesConjuroSinRequisito(
    clase: Clase | null | undefined,
    idsEspeciales: Iterable<number>,
    idsDotes: Iterable<number>
): Set<number> {
    const especiales = new Set(Array.from(idsEspeciales, (id) => toInt(id)).filter((id) => id > 0));
    const dotes = new Set(Array.from(idsDotes, (id) => toInt(id)).filter((id) => id > 0));
    const porNivel = new Map<number, ClaseNivelConjuroRequisito[]>();
    toArray(clase?.Conjuros?.Niveles_con_requisito).forEach((fila) => {
        const nivel = toInt(fila?.Nivel, -1);
        if (nivel >= 0)
            porNivel.set(nivel, [...(porNivel.get(nivel) ?? []), fila]);
    });
    const bloqueados = new Set<number>();
    porNivel.forEach((filas, nivel) => {
        const cumple = filas.some((fila) => (fila.Especial && especiales.has(toInt(fila.Especial.Id)))
            || (fila.Dote && dotes.has(toInt(fila.Dote.Id))));
        if (!cumple)
            bloqueados.add(nivel);
    });
    return bloqueados;
}

/** Lo que pide un nivel de conjuro con requisito, en texto («Implante craneal o Ingeniería mágica»); vacío si no pide nada. */
export function textoRequisitoNivelConjuro(clase: Clase | null | undefined, nivel: number): string {
    return toArray(clase?.Conjuros?.Niveles_con_requisito)
        .filter((fila) => toInt(fila?.Nivel, -1) === nivel)
        .map((fila) => `${fila.Especial?.Nombre ?? fila.Dote?.Nombre ?? ''}`.trim())
        .filter((nombre) => nombre.length > 0)
        .join(' o ');
}
