import { ConjuntoObjetosCuerpo, ConjuntoObjetosDetalle, ObjetoCuerpo, ObjetoDetalle, OrigenDescripcion } from 'src/app/interfaces/equipo';
import { toNullableText, toNumber, toNumberOrNull, toText } from './normalizacion';
import {
    ElegidoDeCatalogo,
    RelacionesMagicas,
    escuelasDelCuerpo,
    modificadoresDelCuerpo,
    problemaDeModificadores,
    relacionesDeLectura,
    relacionesVacias,
    requisitosDelCuerpo,
} from './relaciones-equipo-formulario';

/**
 * El formulario de «Insertar/Modificar objeto» y «… conjunto de objetos» (`nuevo-objeto`, segunda parte del hito 7 del
 * roadmap de inserciones): los valores de sus controles a partir del `GET` de la entrada y el cuerpo de `POST …/add` y
 * `PUT …/<id>` (`docs/publica/endpoints/catalogos.md`, «Alta y edición de munición, materiales…»), con las comprobaciones
 * de la API que se pueden ver antes de mandar.
 */
export type TipoObjetoEditable = 'objeto' | 'conjunto';

/** Los valores de los controles (los dos tipos en un formulario; el conjunto solo usa los comunes). */
export interface ValoresObjeto {
    nombre: string;
    descripcion: string;
    origen_descripcion: OrigenDescripcion;
    nombre_original: string;
    traducido: boolean;
    id_manual: number | null;
    pagina: number | null;
    oficial: boolean;
    id_tipo_objeto: number | null;
    precio: number | null;
    nivel_objeto: number | null;
    peso: number | null;
    id_ranura: number | null;
    nivel_lanzador: number | null;
    id_intensidad_aura: number | null;
    cargas: number | null;
    usos_por_dia: number | null;
    maldito: boolean;
    inteligente: boolean;
    es_reliquia: boolean;
    requisitos_uso: string;
    coste_creacion_po: number | null;
    coste_creacion_px: number | null;
    dias_creacion: number | null;
    requisitos_otros: string;
    id_conjunto: number | null;
    id_monstruo: number | null;
    es_generico_conjuro: boolean;
    precio_por_nivel_conjuro: number | null;
    nivel_conjuro_maximo: number | null;
    usos_componente_caro: number | null;
    id_arma_base: number | null;
    id_armadura_base: number | null;
    bonificador_mejora: number | null;
    bonificador_mejora_2: number | null;
    id_material: number | null;
}

/** Una activación del objeto (palabra de mando, acción estándar). */
export interface FilaActivacion {
    uid: string;
    id_tipo_activacion: number | null;
    id_tipo_accion: number | null;
}

/** Un conjuro que lanza el objeto, con su NL, las cargas que gasta y sus usos al día. */
export interface FilaConjuroObjeto extends ElegidoDeCatalogo {
    nivel_lanzador: number | null;
    cargas_por_uso: number | null;
    usos_por_dia: number | null;
}

/** Una aptitud especial de un arma o armadura específica, con su cabeza (2: la segunda de un arma doble). */
export interface FilaAptitudObjeto extends ElegidoDeCatalogo {
    cabeza: number;
}

/** Una bonificación de un conjunto: con cuántas piezas se gana y qué da. */
export interface FilaBonificacion {
    uid: string;
    piezas: number | null;
    descripcion: string;
}

/** Lo que no son controles: las filas repetibles del objeto y del conjunto. */
export interface FilasDeObjeto {
    activaciones: FilaActivacion[];
    conjuros: FilaConjuroObjeto[];
    aptitudes: FilaAptitudObjeto[];
    relaciones: RelacionesMagicas;
    piezas: ElegidoDeCatalogo[];
    bonificaciones: FilaBonificacion[];
}

export function filasDeObjetoVacias(): FilasDeObjeto {
    return { activaciones: [], conjuros: [], aptitudes: [], relaciones: relacionesVacias(), piezas: [], bonificaciones: [] };
}

/** Un objeto nuevo: oficial y mundano por fuera (sin tipo hasta elegirlo). */
export function valoresObjetoVacios(): ValoresObjeto {
    return {
        nombre: '', descripcion: '', origen_descripcion: 'propia', nombre_original: '', traducido: false, id_manual: null,
        pagina: null, oficial: true, id_tipo_objeto: null, precio: null, nivel_objeto: null, peso: null, id_ranura: null,
        nivel_lanzador: null, id_intensidad_aura: null, cargas: null, usos_por_dia: null, maldito: false, inteligente: false,
        es_reliquia: false, requisitos_uso: '', coste_creacion_po: null, coste_creacion_px: null, dias_creacion: null,
        requisitos_otros: '', id_conjunto: null, id_monstruo: null, es_generico_conjuro: false, precio_por_nivel_conjuro: null,
        nivel_conjuro_maximo: null, usos_componente_caro: null, id_arma_base: null, id_armadura_base: null,
        bonificador_mejora: null, bonificador_mejora_2: null, id_material: null,
    };
}

function textosDe(entrada: ObjetoDetalle | ConjuntoObjetosDetalle): Partial<ValoresObjeto> {
    return {
        nombre: entrada.Nombre ?? '',
        descripcion: entrada.Descripcion ?? '',
        origen_descripcion: entrada.Origen_descripcion === 'srd' ? 'srd' : 'propia',
        nombre_original: entrada.Nombre_original ?? '',
        traducido: entrada.Traducido === true,
        id_manual: toNumberOrNull(entrada.Manual?.Id),
        pagina: toNumberOrNull(entrada.Manual?.Pagina),
        oficial: entrada.Oficial === true,
    };
}

export function valoresDeObjeto(objeto: ObjetoDetalle): ValoresObjeto {
    const generico = objeto.Generico_conjuro;
    return {
        ...valoresObjetoVacios(),
        ...textosDe(objeto),
        id_tipo_objeto: toNumberOrNull(objeto.Tipo?.Id),
        precio: toNumberOrNull(objeto.Precio),
        nivel_objeto: toNumberOrNull(objeto.Nivel_objeto),
        peso: toNumberOrNull(objeto.Peso),
        id_ranura: toNumberOrNull(objeto.Ranura?.Id),
        nivel_lanzador: toNumberOrNull(objeto.Nivel_lanzador),
        id_intensidad_aura: toNumberOrNull(objeto.Aura?.Intensidad?.Id),
        cargas: toNumberOrNull(objeto.Cargas),
        usos_por_dia: toNumberOrNull(objeto.Usos_por_dia),
        maldito: objeto.Maldito === true,
        inteligente: objeto.Inteligente === true,
        es_reliquia: objeto.Reliquia === true,
        requisitos_uso: objeto.Requisitos_uso ?? '',
        coste_creacion_po: toNumberOrNull(objeto.Creacion?.Coste_po),
        coste_creacion_px: toNumberOrNull(objeto.Creacion?.Coste_px),
        dias_creacion: toNumberOrNull(objeto.Creacion?.Dias),
        requisitos_otros: objeto.Creacion?.Otros_requisitos ?? '',
        id_conjunto: toNumberOrNull(objeto.Conjunto?.Id),
        id_monstruo: toNumberOrNull(objeto.Monstruo?.Id),
        es_generico_conjuro: generico !== null && generico !== undefined,
        precio_por_nivel_conjuro: toNumberOrNull(generico?.Precio_por_nivel),
        nivel_conjuro_maximo: toNumberOrNull(generico?.Nivel_maximo),
        usos_componente_caro: toNumberOrNull(generico?.Usos_componente_caro),
        id_arma_base: toNumberOrNull(objeto.Arma_base?.Id),
        id_armadura_base: toNumberOrNull(objeto.Armadura_base?.Id),
        bonificador_mejora: toNumberOrNull(objeto.Bonificador_mejora),
        bonificador_mejora_2: toNumberOrNull(objeto.Bonificador_mejora_2),
        id_material: toNumberOrNull(objeto.Material?.Id),
    };
}

export function filasDeObjeto(objeto: ObjetoDetalle, uid: () => string): FilasDeObjeto {
    return {
        ...filasDeObjetoVacias(),
        activaciones: (objeto.Activaciones ?? []).map((activacion) => ({
            uid: uid(), id_tipo_activacion: toNumberOrNull(activacion.Id), id_tipo_accion: toNumberOrNull(activacion.Accion?.Id),
        })),
        conjuros: (objeto.Conjuros ?? []).map((conjuro) => ({
            id: toNumber(conjuro.Id),
            nombre: toText(conjuro.Nombre),
            nivel_lanzador: toNumberOrNull(conjuro.Nivel_lanzador),
            cargas_por_uso: toNumberOrNull(conjuro.Cargas_por_uso),
            usos_por_dia: toNumberOrNull(conjuro.Usos_por_dia),
        })),
        aptitudes: (objeto.Encantamientos ?? []).map((aptitud) => ({
            id: toNumber(aptitud.Id), nombre: toText(aptitud.Nombre), cabeza: toNumber(aptitud.Cabeza, 1) === 2 ? 2 : 1,
        })),
        relaciones: relacionesDeLectura(objeto.Aura, objeto.Creacion?.Requisitos, objeto.Modificadores, uid),
    };
}

export function valoresDeConjunto(conjunto: ConjuntoObjetosDetalle): ValoresObjeto {
    return { ...valoresObjetoVacios(), ...textosDe(conjunto) };
}

export function filasDeConjunto(conjunto: ConjuntoObjetosDetalle, uid: () => string): FilasDeObjeto {
    return {
        ...filasDeObjetoVacias(),
        piezas: (conjunto.Piezas ?? []).map((pieza) => ({ id: toNumber(pieza.Id), nombre: toText(pieza.Nombre) })),
        bonificaciones: (conjunto.Bonificaciones ?? []).map((bonificacion) => ({
            uid: uid(), piezas: toNumberOrNull(bonificacion.Piezas), descripcion: toText(bonificacion.Descripcion),
        })),
    };
}

function comunesDelCuerpo(v: ValoresObjeto) {
    return {
        nombre: toText(v.nombre).trim(),
        descripcion: toText(v.descripcion).trim(),
        origen_descripcion: (v.origen_descripcion === 'srd' ? 'srd' : 'propia') as OrigenDescripcion,
        nombre_original: toNullableText(v.nombre_original),
        traducido: v.traducido === true,
        id_manual: toNumber(v.id_manual),
        pagina: toNumber(v.pagina),
        oficial: v.oficial === true,
    };
}

export function cuerpoDeObjeto(v: ValoresObjeto, filas: FilasDeObjeto): ObjetoCuerpo {
    const generico = v.es_generico_conjuro === true;
    const conArmaBase = toNumberOrNull(v.id_arma_base) !== null;
    return {
        objeto: {
            ...comunesDelCuerpo(v),
            id_tipo_objeto: toNumber(v.id_tipo_objeto),
            precio: toNumberOrNull(v.precio),
            nivel_objeto: toNumberOrNull(v.nivel_objeto),
            peso: toNumberOrNull(v.peso),
            id_ranura: toNumberOrNull(v.id_ranura),
            nivel_lanzador: toNumberOrNull(v.nivel_lanzador),
            id_intensidad_aura: toNumberOrNull(v.id_intensidad_aura),
            cargas: toNumberOrNull(v.cargas),
            usos_por_dia: toNumberOrNull(v.usos_por_dia),
            maldito: v.maldito === true,
            inteligente: v.inteligente === true,
            es_reliquia: v.es_reliquia === true,
            requisitos_uso: toNullableText(v.requisitos_uso),
            coste_creacion_po: toNumberOrNull(v.coste_creacion_po),
            coste_creacion_px: toNumberOrNull(v.coste_creacion_px),
            dias_creacion: toNumberOrNull(v.dias_creacion),
            requisitos_otros: toNullableText(v.requisitos_otros),
            id_conjunto: toNumberOrNull(v.id_conjunto),
            id_monstruo: toNumberOrNull(v.id_monstruo),
            es_generico_conjuro: generico,
            // Sin genérico no hay fórmula (la API la guarda vacía).
            precio_por_nivel_conjuro: generico ? toNumberOrNull(v.precio_por_nivel_conjuro) : null,
            nivel_conjuro_maximo: generico ? toNumberOrNull(v.nivel_conjuro_maximo) : null,
            usos_componente_caro: generico ? toNumberOrNull(v.usos_componente_caro) : null,
            id_arma_base: toNumberOrNull(v.id_arma_base),
            id_armadura_base: conArmaBase ? null : toNumberOrNull(v.id_armadura_base),
            bonificador_mejora: toNumberOrNull(v.bonificador_mejora),
            bonificador_mejora_2: conArmaBase ? toNumberOrNull(v.bonificador_mejora_2) : null,
            id_material: toNumberOrNull(v.id_material),
        },
        aura_escuelas: escuelasDelCuerpo(filas.relaciones),
        activaciones: filas.activaciones.map((fila) => ({
            id_tipo_activacion: toNumber(fila.id_tipo_activacion), id_tipo_accion: toNumberOrNull(fila.id_tipo_accion),
        })),
        requisitos: requisitosDelCuerpo(filas.relaciones),
        conjuros: filas.conjuros.map((conjuro) => ({
            id_conjuro: conjuro.id,
            nivel_lanzador: toNumberOrNull(conjuro.nivel_lanzador),
            cargas_por_uso: toNumberOrNull(conjuro.cargas_por_uso),
            usos_por_dia: toNumberOrNull(conjuro.usos_por_dia),
        })),
        modificadores: modificadoresDelCuerpo(filas.relaciones.modificadores),
        encantamientos: filas.aptitudes.map((aptitud) => ({ id_encantamiento: aptitud.id, cabeza: aptitud.cabeza === 2 ? 2 : 1 })),
    };
}

export function cuerpoDeConjunto(v: ValoresObjeto, filas: FilasDeObjeto): ConjuntoObjetosCuerpo {
    return {
        conjunto: comunesDelCuerpo(v),
        piezas: filas.piezas.map((pieza) => pieza.id),
        bonificaciones: filas.bonificaciones.map((fila) => ({ piezas: toNumber(fila.piezas), descripcion: toText(fila.descripcion).trim() })),
    };
}

/** Un problema del formulario, con el campo (la clave del cuerpo o la lista) en el que se enseña. */
export interface ProblemaDeObjeto {
    campo: keyof ValoresObjeto | 'activaciones' | 'conjuros' | 'encantamientos' | 'modificadores' | 'bonificaciones';
    mensaje: string;
}

/** Las reglas de la API que se ven antes de mandar (la API las comprueba igual y responde con el mismo `code`). */
export function problemaDeObjeto(v: ValoresObjeto, filas: FilasDeObjeto): ProblemaDeObjeto | null {
    if (toNumberOrNull(v.id_tipo_objeto) === null)
        return { campo: 'id_tipo_objeto', mensaje: 'Tipo de objeto obligatorio.' };
    if (v.es_generico_conjuro === true) {
        if (toNumberOrNull(v.precio_por_nivel_conjuro) === null)
            return { campo: 'precio_por_nivel_conjuro', mensaje: 'Un genérico de un conjuro lleva su precio por nivel.' };
        if (toNumberOrNull(v.nivel_conjuro_maximo) === null)
            return { campo: 'nivel_conjuro_maximo', mensaje: 'Un genérico de un conjuro lleva el nivel de conjuro máximo.' };
    }
    const conBase = toNumberOrNull(v.id_arma_base) !== null || toNumberOrNull(v.id_armadura_base) !== null;
    if (filas.aptitudes.length > 0 && !conBase)
        return { campo: 'encantamientos', mensaje: 'Las aptitudes especiales son de las armas y armaduras específicas: elige su base.' };
    if (filas.aptitudes.some((aptitud) => aptitud.cabeza === 2) && toNumberOrNull(v.bonificador_mejora_2) === null)
        return { campo: 'encantamientos', mensaje: 'Una aptitud de la segunda cabeza va con la mejora de esa cabeza.' };
    const activaciones = filas.activaciones.map((fila) => toNumber(fila.id_tipo_activacion));
    if (activaciones.some((id) => id <= 0))
        return { campo: 'activaciones', mensaje: 'Cada activación lleva su tipo.' };
    if (new Set(activaciones).size !== activaciones.length)
        return { campo: 'activaciones', mensaje: 'Un tipo de activación está repetido.' };
    const modificadores = problemaDeModificadores(filas.relaciones.modificadores);
    return modificadores ? { campo: 'modificadores', mensaje: modificadores.mensaje } : null;
}

export function problemaDeConjunto(filas: FilasDeObjeto): ProblemaDeObjeto | null {
    if (filas.bonificaciones.some((fila) => !(toNumber(fila.piezas) > 0) || toText(fila.descripcion).trim().length < 1))
        return { campo: 'bonificaciones', mensaje: 'Cada bonificación lleva con cuántas piezas se gana y lo que da.' };
    return null;
}
