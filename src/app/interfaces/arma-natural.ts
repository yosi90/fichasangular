/**
 * Las armas naturales como dato (`docs/publica/endpoints/catalogos.md`, «Armas naturales como dato», 2026-11-06): las de
 * una raza, una edad de una raza por edades, una plantilla o un monstruo. Los textos de siempre (`Ataques_naturales`,
 * `Ataques`, `Ataque_completo`) se quedan como su descripción.
 */
export interface ArmaNatural {
    Id_arma_natural: number;
    /** El nombre del tipo («Garra»). */
    Arma_natural: string;
    Cantidad: number;
    /** Los dados, sin el bonificador de Fuerza («1d6»); `null` sin daño o cuando depende del tamaño. */
    Dano: string | null;
    Primaria: boolean;
    /** La frase hecha en la API: «2 garras 1d4», «Mordisco 1d6 (ataque secundario)». */
    Texto: string;
}

/**
 * Cómo se junta un arma natural de una plantilla con las de la criatura: `suma` (además de las suyas), `minimo` («si no lo
 * tenía»), `sustituye` (pierde todas las suyas) y `quita` (pierde las de ese tipo, `Cantidad` 0).
 */
export type ModoArmaNatural = 'suma' | 'minimo' | 'sustituye' | 'quita';
/** En qué forma la tiene: en todas, o solo en la animal o la híbrida (el licántropo). */
export type FormaArmaNatural = 'todas' | 'animal' | 'hibrida';

export interface ArmaNaturalPlantilla extends ArmaNatural {
    Modo: ModoArmaNatural;
    Forma: FormaArmaNatural;
}

/** Un tipo del catálogo (`GET /armas-naturales`). */
export interface ArmaNaturalTipo {
    Id: number;
    Nombre: string;
    Nombre_plural: string;
    /** La que se propone por defecto (las alas y el coletazo, secundarias). */
    Primaria: boolean;
    Oficial: boolean;
}

/** Un arma natural en el cuerpo del alta o la edición de una raza, sus edades o una plantilla. */
export interface ArmaNaturalCreate {
    id_arma_natural: number;
    cantidad: number;
    dano: string | null;
    primaria: boolean;
    modo?: ModoArmaNatural;
    forma?: FormaArmaNatural;
}
