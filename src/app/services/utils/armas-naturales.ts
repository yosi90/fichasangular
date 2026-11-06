import {
    ArmaNatural,
    ArmaNaturalCreate,
    ArmaNaturalPlantilla,
    ArmaNaturalTipo,
    FormaArmaNatural,
    ModoArmaNatural,
} from 'src/app/interfaces/arma-natural';
import { uidDeFila } from 'src/app/components/shared/insercion-marco/filas-repetibles';
import type { FilaDeLista } from 'src/app/components/shared/lista-de-catalogo/lista-de-catalogo.component';
import { toArray, toBoolean, toInt, toNullableText, toText } from './normalizacion';

/*
 * Las armas naturales como dato (`docs/publica/endpoints/catalogos.md`, «Armas naturales como dato»): su lectura (la
 * misma en la API y en la caché, que las guarda tal cual), cuántas tiene un personaje para el prerrequisito
 * `armas_naturales` de las dotes (Ataque múltiple, *Manual de monstruos 1*, pág. 303) y las filas de los formularios.
 */

const MODOS: readonly ModoArmaNatural[] = ['suma', 'minimo', 'sustituye', 'quita'];
const FORMAS: readonly FormaArmaNatural[] = ['todas', 'animal', 'hibrida'];

function armaNatural(raw: any): ArmaNatural {
    const cantidad = toInt(raw?.Cantidad);
    return {
        Id_arma_natural: toInt(raw?.Id_arma_natural),
        Arma_natural: toText(raw?.Arma_natural),
        Cantidad: cantidad,
        Dano: toNullableText(raw?.Dano),
        Primaria: toBoolean(raw?.Primaria, true),
        Texto: toText(raw?.Texto) || toText(raw?.Arma_natural),
    };
}

/** Las armas naturales de una raza, una edad o un monstruo; sin el campo, ninguna. */
export function leerArmasNaturales(raw: any): ArmaNatural[] {
    return toArray(raw).map(armaNatural).filter((arma) => arma.Id_arma_natural > 0 || arma.Arma_natural.length > 0);
}

/** Las de una plantilla, con su modo (`suma` si no lo trae) y su forma (`todas`). */
export function leerArmasNaturalesPlantilla(raw: any): ArmaNaturalPlantilla[] {
    return toArray(raw).map((item) => ({
        ...armaNatural(item),
        Modo: MODOS.includes(item?.Modo) ? item.Modo : 'suma',
        Forma: FORMAS.includes(item?.Forma) ? item.Forma : 'todas',
    })).filter((arma) => arma.Id_arma_natural > 0 || arma.Arma_natural.length > 0);
}

/** Las frases de las armas naturales en una línea («Mordisco 2d6, 2 garras 1d8 (ataques secundarios)»); vacío sin ninguna. */
export function textoDeArmasNaturales(armas: readonly ArmaNatural[] | null | undefined): string {
    return (armas ?? []).map((arma) => arma.Texto).filter((texto) => texto.length > 0).join(', ');
}

// --- Cuántas tiene un personaje ---------------------------------------------------------------------------------------

type Estado = Map<string, number>;

function claveDe(arma: ArmaNatural): string {
    return arma.Id_arma_natural > 0 ? `${arma.Id_arma_natural}` : arma.Arma_natural.toLowerCase();
}

/**
 * Las armas naturales que quedan tras una plantilla (en una forma): con alguna `sustituye`, la criatura pierde las suyas
 * y le quedan esas; después `quita` le quita las de su tipo, `minimo` las deja en al menos su cantidad y `suma` las añade.
 */
function aplicar(estado: Estado, armas: readonly ArmaNaturalPlantilla[]): Estado {
    const sustituyen = armas.filter((arma) => arma.Modo === 'sustituye');
    const resultado: Estado = sustituyen.length > 0 ? new Map() : new Map(estado);
    sustituyen.forEach((arma) => resultado.set(claveDe(arma), (resultado.get(claveDe(arma)) ?? 0) + arma.Cantidad));
    armas.filter((arma) => arma.Modo === 'quita').forEach((arma) => resultado.delete(claveDe(arma)));
    armas.filter((arma) => arma.Modo === 'minimo')
        .forEach((arma) => resultado.set(claveDe(arma), Math.max(resultado.get(claveDe(arma)) ?? 0, arma.Cantidad)));
    armas.filter((arma) => arma.Modo === 'suma')
        .forEach((arma) => resultado.set(claveDe(arma), (resultado.get(claveDe(arma)) ?? 0) + arma.Cantidad));
    return resultado;
}

function total(estado: Estado): number {
    let suma = 0;
    estado.forEach((cantidad) => suma += Math.max(0, cantidad));
    return suma;
}

/**
 * Cuántas armas naturales tiene un personaje (la suma de `Cantidad`) en la forma en que más tiene: las de su raza (una
 * raza por edades ya llega resuelta a su edad) y, encima, las de cada plantilla en su orden. Las de forma `animal` o
 * `hibrida` crean esa forma, que parte de la normal; el personaje puede usar una dote como Ataque múltiple en la forma en
 * que llega (propuesta del máster del 2026-11-06: el licántropo lobo, en la híbrida, con dos garras y el mordisco).
 */
export function contarArmasNaturales(
    raza: { Armas_naturales?: readonly ArmaNatural[] | null; } | null | undefined,
    plantillas: readonly ({ Armas_naturales?: readonly ArmaNaturalPlantilla[] | null; } | null | undefined)[] = [],
): number {
    const normal: Estado = new Map();
    (raza?.Armas_naturales ?? []).forEach((arma) => normal.set(claveDe(arma), (normal.get(claveDe(arma)) ?? 0) + arma.Cantidad));
    const formas = new Map<FormaArmaNatural, Estado>([['todas', normal]]);
    plantillas.forEach((plantilla) => {
        const armas = plantilla?.Armas_naturales ?? [];
        const enTodas = armas.filter((arma) => arma.Forma === 'todas');
        if (enTodas.length > 0)
            formas.forEach((estado, forma) => formas.set(forma, aplicar(estado, enTodas)));
        (['animal', 'hibrida'] as const).forEach((forma) => {
            const propias = armas.filter((arma) => arma.Forma === forma);
            if (propias.length > 0)
                formas.set(forma, aplicar(formas.get('todas') ?? new Map(), propias));
        });
    });
    return Math.max(...Array.from(formas.values()).map(total));
}

// --- Formulario --------------------------------------------------------------------------------------------------------

/**
 * Una fila del formulario de armas naturales (raza o plantilla), con la forma de las filas de `<app-lista-de-catalogo>`:
 * `id` es el tipo de arma natural.
 */
export interface FilaArmaNatural extends FilaDeLista {
    uid: string;
    cantidad: number | null;
    dano: string;
    primaria: boolean;
    modo: ModoArmaNatural;
    forma: FormaArmaNatural;
}

export const MODOS_ARMA_NATURAL: readonly { valor: ModoArmaNatural; etiqueta: string; }[] = [
    { valor: 'suma', etiqueta: 'Además de las suyas' },
    { valor: 'minimo', etiqueta: 'Si no las tiene ya' },
    { valor: 'sustituye', etiqueta: 'En lugar de todas las suyas' },
    { valor: 'quita', etiqueta: 'Le quita las de este tipo' },
];

export const FORMAS_ARMA_NATURAL: readonly { valor: FormaArmaNatural; etiqueta: string; }[] = [
    { valor: 'todas', etiqueta: 'En todas sus formas' },
    { valor: 'animal', etiqueta: 'En forma animal' },
    { valor: 'hibrida', etiqueta: 'En forma híbrida' },
];

/** Una fila nueva de un tipo, con su primaria por defecto (`ArmaNaturalTipo.Primaria`). */
export function filaArmaNatural(tipo: ArmaNaturalTipo): FilaArmaNatural {
    return {
        id: tipo.Id, nombre: tipo.Nombre, uid: uidDeFila('arma-natural'), cantidad: 1, dano: '', primaria: tipo.Primaria,
        modo: 'suma', forma: 'todas',
    };
}

/** Las filas de lo que trae la API (una raza, una edad o una plantilla). */
export function filasDeArmasNaturales(armas: readonly (ArmaNatural | ArmaNaturalPlantilla)[] | null | undefined): FilaArmaNatural[] {
    return (armas ?? []).filter((arma) => arma.Id_arma_natural > 0).map((arma) => ({
        id: arma.Id_arma_natural,
        nombre: arma.Arma_natural,
        uid: uidDeFila('arma-natural'),
        cantidad: arma.Cantidad,
        dano: arma.Dano ?? '',
        primaria: arma.Primaria,
        modo: (arma as ArmaNaturalPlantilla).Modo ?? 'suma',
        forma: (arma as ArmaNaturalPlantilla).Forma ?? 'todas',
    }));
}

/** Lo que falla de una fila antes de mandarla (la API lo comprueba igual); `null` si vale. */
export function problemaDeArmaNatural(fila: FilaArmaNatural, filas: readonly FilaArmaNatural[], plantilla: boolean): string | null {
    const quita = plantilla && fila.modo === 'quita';
    const cantidad = toInt(fila.cantidad, 0);
    if (!quita && (cantidad < 1 || cantidad > 99))
        return 'La cantidad va de 1 a 99.';
    if (`${fila.dano ?? ''}`.trim().length > 30)
        return 'El daño no puede pasar de 30 caracteres.';
    const repetida = filas.some((otra) => otra !== fila && otra.id === fila.id && (!plantilla || otra.forma === fila.forma));
    if (repetida)
        return plantilla ? 'Ese tipo ya está en la misma forma.' : 'Ese tipo ya está.';
    return null;
}

/** El primer problema de las filas, con el nombre del tipo («Garra: la cantidad va de 1 a 99.»); `null` si valen. */
export function problemaDeArmasNaturales(filas: readonly FilaArmaNatural[], plantilla: boolean): string | null {
    for (const fila of filas) {
        const problema = problemaDeArmaNatural(fila, filas, plantilla);
        if (problema)
            return `${fila.nombre || 'Arma natural'}: ${problema.charAt(0).toLowerCase()}${problema.slice(1)}`;
    }
    return null;
}

/** El cuerpo (`armas_naturales`); en una raza o una edad, sin modo ni forma. */
export function cuerpoDeArmasNaturales(filas: readonly FilaArmaNatural[], plantilla: boolean): ArmaNaturalCreate[] {
    return filas.filter((fila) => fila.id > 0).map((fila) => {
        const quita = plantilla && fila.modo === 'quita';
        const cuerpo: ArmaNaturalCreate = {
            id_arma_natural: fila.id,
            cantidad: quita ? 0 : toInt(fila.cantidad, 1),
            dano: `${fila.dano ?? ''}`.trim() || null,
            primaria: fila.primaria,
        };
        if (plantilla) {
            cuerpo.modo = fila.modo;
            cuerpo.forma = fila.forma;
        }
        return cuerpo;
    });
}
