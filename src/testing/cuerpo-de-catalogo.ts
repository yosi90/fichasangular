/**
 * Una entrada de las idas y vueltas de «Modificar» (`ida-y-vuelta-dotes-conjuros.ts`, `ida-y-vuelta-clases.ts`): la
 * respuesta real del `GET` de `rol_dev` y el cuerpo con el que el `PUT` devolvió ese mismo `GET`.
 */
export interface IdaYVuelta {
    id: number;
    nombre: string;
    get: any;
    cuerpo: any;
}

/**
 * `valor` reducido a las claves que trae `referencia`, a cualquier profundidad (las listas, elemento a elemento; uno de
 * más se queda entero): el cuerpo de la comprobación del backend solo lleva lo que lee la API y la web añade los nombres.
 */
export function soloLoDeLaReferencia(valor: any, referencia: any): any {
    if (Array.isArray(referencia))
        return (valor ?? []).map((item: any, i: number) => soloLoDeLaReferencia(item, referencia[i] ?? item));
    if (referencia && typeof referencia === 'object') {
        if (!valor || typeof valor !== 'object')
            return valor;
        return Object.fromEntries(Object.keys(referencia).map((clave) => [clave, soloLoDeLaReferencia(valor[clave], referencia[clave])]));
    }
    return valor;
}

/**
 * Un cuerpo de alta de dote o de conjuro, para comparar el que monta la web con el de `IDA_Y_VUELTA`: las listas de ids
 * en orden (la web las ordena), los textos sin espacios a los lados (la web los recorta, como la API) y, en los
 * prerrequisitos, solo las claves que trae `referencia` (la web añade el nombre de cada elemento, que la API no lee).
 */
export function cuerpoComparable(cuerpo: any, referencia: any): any {
    const copia = JSON.parse(JSON.stringify(cuerpo ?? {}));
    const raiz = copia.dote ?? copia.conjuro;
    Object.keys(raiz ?? {}).forEach((clave) => {
        if (typeof raiz[clave] === 'string')
            raiz[clave] = raiz[clave].trim();
    });
    const porNumero = (a: number, b: number) => a - b;
    Object.keys(copia.extras_disponibles ?? {}).forEach((clave) => copia.extras_disponibles[clave].sort(porNumero));
    ['componentes', 'descriptores'].forEach((clave) => copia[clave]?.sort(porNumero));
    [['niveles_clase', 'id_clase'], ['niveles_dominio', 'id_dominio'], ['niveles_disciplina', 'id_disciplina']]
        .forEach(([clave, id]) => copia[clave]?.sort((a: any, b: any) => a[id] - b[id]));
    copia.habilidades_otorgadas?.sort((a: any, b: any) => a.id_habilidad - b.id_habilidad);
    Object.keys(copia.prerrequisitos ?? {}).forEach((familia) => {
        copia.prerrequisitos[familia] = copia.prerrequisitos[familia]
            .map((item: any, indice: number) => soloLoDeLaReferencia(item, referencia?.prerrequisitos?.[familia]?.[indice] ?? item));
    });
    return copia;
}
