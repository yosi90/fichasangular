import { AptitudEspecialOtorgante } from './aptitud-especial';
import { Comodin } from './comodin';

/**
 * Un elemento de `Prerrequisitos[<tipo>]` de las dotes, las clases, las plantillas y los raciales (o de `pr[<tipo>]` de
 * las razas): sus campos según el tipo, su grupo `Opcional` (0 obligatorio; el mismo número mayor que 0, alternativas) y
 * la `Frase` que escribe la API para enseñarlo («Lanzador arcano de nivel 3»). Contrato: «Frases de los prerrequisitos»
 * en `docs/publica/endpoints/catalogos.md`.
 */
export interface PrerrequisitoItem {
    /** La API la trae siempre; solo puede faltar en una caché de la RTDB anterior a las frases (2026-10-25). */
    Frase?: string;
    Opcional?: number;
    [campo: string]: any;
}

/** La dote pedida: `dote` de las dotes y `dote_elegida` de las clases. */
export interface PrerrequisitoDotePedida extends PrerrequisitoItem {
    Id_dote_prerrequisito: number;
    Dote_prerrequisito: string;
    /** El código de la base: -1 sin extra, 0 el comodín (ver `Extra_comodin`), > 0 un extra concreto. */
    Id_extra: number | null;
    /** El nombre del extra concreto, o `null`. */
    Extra: string | null;
    /** El 0 de `Id_extra`: `'elegir'`, el extra elegido para la dote que lo pide; `'cualquiera'`, cualquier extra. */
    Extra_comodin: Comodin | null;
    Repetido: number;
}

/**
 * `aptitud_especial` de las dotes y las clases: la aptitud pedida y lo que la otorga. El personaje la cumple si tiene
 * alguno de esos raciales, especiales de clase o plantillas; con las tres listas vacías no se puede comprobar.
 */
export interface PrerrequisitoAptitudEspecial extends PrerrequisitoItem {
    Id_aptitud_especial: number;
    Aptitud_especial: string;
    Raciales: AptitudEspecialOtorgante[];
    Especiales: AptitudEspecialOtorgante[];
    Plantillas: AptitudEspecialOtorgante[];
}

/** Un tipo de prerrequisito de `GET /prerrequisitos/tipos`, con el nombre que enseña el editor. */
export interface PrerrequisitoTipo {
    Clave: string;
    Nombre: string;
    Ejemplo: string;
    Entidades: string[];
}
