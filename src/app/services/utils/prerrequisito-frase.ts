import { PrerrequisitoItem, PrerrequisitoTipo } from 'src/app/interfaces/prerrequisito';
import { formatearClave } from 'src/app/services/utils/formato-registros';
import { textosUnicos, toArray, toInt } from 'src/app/services/utils/normalizacion';

// Las frases de los prerrequisitos las escribe el backend, en un solo sitio, para la web y la app (fase 3 del roadmap de
// duplicados, `docs/publica/FRASES_PRERREQUISITOS_FRONT.md`): aquí solo se leen, se agrupan y se nombran sus tipos.

const nombresTipos = new Map<string, string>();

/** Guarda los nombres de los tipos que da `GET /prerrequisitos/tipos` (los carga `PrerrequisitosTiposService`). */
export function registrarTiposPrerrequisito(tipos: PrerrequisitoTipo[]): void {
    toArray<PrerrequisitoTipo>(tipos).forEach((tipo) => {
        const clave = `${tipo?.Clave ?? ''}`.trim();
        const nombre = `${tipo?.Nombre ?? ''}`.trim();
        if (clave.length > 0 && nombre.length > 0)
            nombresTipos.set(clave, nombre);
    });
}

/**
 * El nombre de un tipo de prerrequisito («Nivel de lanzador arcano»): el de la API o, si su ruta no ha respondido, la
 * clave legible («Lanzador arcano»), como respaldo mínimo.
 */
export function nombreTipoPrerrequisito(clave: string): string {
    return nombresTipos.get(clave) ?? formatearClave(clave);
}

/** La frase de un prerrequisito, tal cual la da la API; si no la trae (una caché anterior), el nombre de su tipo. */
export function frasePrerrequisito(clave: string, item: PrerrequisitoItem | null | undefined): string {
    const frase = `${item?.Frase ?? ''}`.trim();
    return frase.length > 0 ? frase : nombreTipoPrerrequisito(clave);
}

/** El grupo de un prerrequisito: 0 es obligatorio; el mismo número mayor que 0, alternativas (basta con una). */
export function grupoOpcionalPrerrequisito(item: PrerrequisitoItem | null | undefined): number {
    return Math.max(0, toInt(item?.Opcional ?? item?.['opcional'], 0));
}

/** El motivo de «no cumple» de un prerrequisito, o de un grupo de alternativas: «No cumple: Fuerza 13 o Destreza 13». */
export function razonNoCumple(frases: string[]): string {
    return `No cumple: ${textosUnicos(frases).join(' o ')}`;
}

/**
 * El aviso de un prerrequisito que la web no puede comprobar con los datos que hay y deja elegir: «La web no puede
 * comprobar este requisito: Amplias zancadas».
 */
export function avisoSinComprobar(frase: string): string {
    return `La web no puede comprobar este requisito: ${frase}`;
}

export interface CondicionPrerrequisito {
    clave: string;
    item: PrerrequisitoItem;
    frase: string;
}

export interface GrupoPrerrequisitos {
    titulo: string;
    descripcion: string;
    opcional: boolean;
    condiciones: CondicionPrerrequisito[];
}

/**
 * Los prerrequisitos de una entidad como se enseñan en los detalles: primero los obligatorios y después cada grupo de
 * alternativas («Elección A», «Elección B»…), cada uno con su frase, en el orden de los tipos del objeto. Un grupo con una
 * sola alternativa es obligatorio (como en 3.5 Companion).
 */
export function agruparPrerrequisitos(prerrequisitos: object | null | undefined): GrupoPrerrequisitos[] {
    const obligatorias: CondicionPrerrequisito[] = [];
    const alternativas = new Map<number, CondicionPrerrequisito[]>();

    Object.entries((prerrequisitos ?? {}) as Record<string, unknown>)
        .forEach(([clave, items]) => {
            toArray<PrerrequisitoItem>(items)
                .filter((item) => !!item && typeof item === 'object')
                .forEach((item) => {
                    const condicion = { clave, item, frase: frasePrerrequisito(clave, item) };
                    const grupo = grupoOpcionalPrerrequisito(item);
                    if (grupo === 0) {
                        obligatorias.push(condicion);
                        return;
                    }
                    alternativas.set(grupo, [...(alternativas.get(grupo) ?? []), condicion]);
                });
        });

    const grupos = Array.from(alternativas.keys())
        .sort((a, b) => a - b)
        .map((grupo) => alternativas.get(grupo) ?? [])
        .filter((condiciones) => {
            if (condiciones.length > 1)
                return true;
            obligatorias.push(...condiciones);
            return false;
        })
        .map((condiciones, index): GrupoPrerrequisitos => ({
            titulo: `Elección ${letraGrupo(index)}`,
            descripcion: 'Basta con una de estas opciones',
            opcional: true,
            condiciones,
        }));

    return obligatorias.length > 0
        ? [{ titulo: 'Obligatorios', descripcion: 'Se deben cumplir todos', opcional: false, condiciones: obligatorias }, ...grupos]
        : grupos;
}

const DESTINOS: Record<string, { entidad: 'arma' | 'armadura' | 'raza'; campoId: string; }> = {
    competencia_arma: { entidad: 'arma', campoId: 'Id_arma' },
    competencia_armadura: { entidad: 'armadura', campoId: 'Id_armadura' },
    raza: { entidad: 'raza', campoId: 'Id_raza' },
};

/** El detalle al que lleva un prerrequisito al pulsarlo (la competencia con un arma o una armadura, una raza), o `null`. */
export function destinoPrerrequisito(
    condicion: CondicionPrerrequisito | null | undefined,
): { entidad: 'arma' | 'armadura' | 'raza'; id: number; } | null {
    const destino = DESTINOS[condicion?.clave ?? ''];
    const id = toInt(condicion?.item?.[destino?.campoId ?? ''], 0);
    return destino && id > 0 ? { entidad: destino.entidad, id } : null;
}

function letraGrupo(index: number): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return index < letras.length ? letras[index] : `${index + 1}`;
}
