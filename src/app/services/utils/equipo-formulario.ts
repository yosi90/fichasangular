import { ArmaCuerpo, ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraCuerpo, ArmaduraDetalle } from 'src/app/interfaces/armadura';
import {
    EncantamientoCuerpo,
    EncantamientoDetalle,
    EquipoCuerpoComun,
    EquipoCuerpoComunSinManual,
    MaterialCuerpo,
    MaterialDetalle,
    MunicionCuerpo,
    MunicionDetalle,
    OrigenDescripcion,
    TextoEquipo,
} from 'src/app/interfaces/equipo';
import { toNullableText, toNumber, toNumberOrNull, toText } from './normalizacion';
import {
    ProblemaDeRelaciones,
    RelacionesMagicas,
    escuelasDelCuerpo,
    modificadoresDelCuerpo,
    problemaDeModificadores,
    relacionesDeLectura,
    relacionesVacias,
    requisitosDelCuerpo,
} from './relaciones-equipo-formulario';

/**
 * El formulario de «Insertar/Modificar arma» y «Insertar/Modificar armadura» (`nuevo-equipo`, hito 7 del roadmap de
 * inserciones): los valores de sus controles a partir del `GET` de la entrada y el cuerpo de `POST …/add` y
 * `PUT …/<id>` a partir de los controles. Comprueba antes de mandar lo mismo que la API (`docs/publica/endpoints/
 * catalogos.md`, «Armas» y «Armaduras»), para avisar en su campo. Desde la segunda parte del hito 7 (2026-11-05), también
 * la munición, los materiales especiales y las aptitudes especiales de armas y armaduras («Alta y edición de munición,
 * materiales…»), que comparten con ellas el nombre, el manual y la descripción.
 */
export type TipoEquipoEditable = 'arma' | 'armadura' | 'municion' | 'material' | 'encantamiento';

/** Los valores de los controles (los dos tipos en un mismo formulario; cada uno manda los suyos). */
export interface ValoresEquipo {
    nombre: string;
    descripcion: string;
    origen_descripcion: OrigenDescripcion;
    nombre_original: string;
    traducido: boolean;
    id_manual: number | null;
    pagina: number | null;
    oficial: boolean;
    precio: number | null;
    peso: number | null;
    id_material: number | null;
    id_tamano: number | null;
    // Arma.
    id_tipo_dano: number | null;
    id_tipo_arma: number | null;
    id_manejo: number | null;
    a_distancia: boolean;
    arrojadiza: boolean;
    doble: boolean;
    alcance: number | null;
    id_municion: number | null;
    dano_pequeno: string;
    dano_mediano: string;
    critico_rango: number | null;
    critico_multiplicador: number | null;
    critico_multiplicador_2: number | null;
    incremento_distancia: number | null;
    indice_fuerza_coste: number | null;
    // Armadura o escudo.
    es_escudo: boolean;
    ca: number | null;
    bon_des: number | null;
    penalizador: number | null;
    id_peso_armadura: number | null;
    id_tipo_escudo: number | null;
    fallo_arcano: number | null;
    velocidad_30: number | null;
    velocidad_20: number | null;
    correr_multiplicador: number | null;
    tiempo_poner: string;
    tiempo_poner_rapido: string;
    tiempo_quitar: string;
    // Munición: el precio y el peso son de un lote de tantas piezas.
    cantidad_por_precio: number | null;
    // Material especial.
    dureza: number | null;
    pg_por_pulgada: number | null;
    cuenta_como_gran_calidad: boolean;
    supera_rd: boolean;
    peso_multiplicador: number | null;
    bon_des_mas: number | null;
    penalizador_menos: number | null;
    fallo_arcano_menos: number | null;
    categoria_mas_ligera: boolean;
    dano_mod: number | null;
    // Aptitud especial.
    modificador: number | null;
    coste: number | null;
    aplica_arma_cc: boolean;
    aplica_arma_distancia: boolean;
    aplica_municion: boolean;
    aplica_armadura: boolean;
    aplica_escudo: boolean;
    nivel_lanzador: number | null;
    id_intensidad_aura: number | null;
    id_encantamiento_base: number | null;
    es_plantilla: boolean;
}

/** Un coste de un material según a qué se aplica (armadura ligera, +1.000 po). */
export interface FilaCosteMaterial {
    uid: string;
    id_aplicacion: number | null;
    coste: number | null;
    coste_por_libra: number | null;
    multiplicador_precio: number | null;
    coste_encantar: number | null;
}

/** Un daño que suma una aptitud (llameante, 1d6 de fuego), con su condición. */
export interface FilaDanoAptitud {
    uid: string;
    dados: string;
    id_tipo_dano: number | null;
    condicion: string;
}

/** Lo que no son controles del formulario: las filas repetibles de cada tipo. */
export interface FilasDeEquipo {
    propiedades: FilaPropiedadArma[];
    costes: FilaCosteMaterial[];
    danos: FilaDanoAptitud[];
    /** Los tipos de daño que la aptitud pide al arma (afilada: cortante o perforante). */
    tiposDano: number[];
    relaciones: RelacionesMagicas;
}

export function filasVacias(): FilasDeEquipo {
    return { propiedades: [], costes: [], danos: [], tiposDano: [], relaciones: relacionesVacias() };
}

/** Una propiedad del arma en su fila: «Desarmar» con su bonificador (`valor`), o sin cifra. */
export interface FilaPropiedadArma {
    uid: string;
    id_propiedad: number | null;
    valor: number | null;
}

/** Lo que se manda de una entrada: el cuerpo de la API y, del arma, sus propiedades. */
export type CuerpoDeEquipo = ArmaCuerpo | ArmaduraCuerpo | MunicionCuerpo | MaterialCuerpo | EncantamientoCuerpo;

/** El formulario vacío: un arma o una armadura nueva, oficial, Mediana y sin material especial. */
export function valoresVacios(idTamanoMediano: number | null = null): ValoresEquipo {
    return {
        nombre: '', descripcion: '', origen_descripcion: 'propia', nombre_original: '', traducido: false,
        id_manual: null, pagina: null, oficial: true, precio: null, peso: null, id_material: null, id_tamano: idTamanoMediano,
        id_tipo_dano: null, id_tipo_arma: null, id_manejo: null, a_distancia: false, arrojadiza: false, doble: false,
        alcance: null, id_municion: null, dano_pequeno: '', dano_mediano: '', critico_rango: null, critico_multiplicador: null,
        critico_multiplicador_2: null, incremento_distancia: 0, indice_fuerza_coste: null,
        es_escudo: false, ca: null, bon_des: null, penalizador: 0, id_peso_armadura: null, id_tipo_escudo: null,
        fallo_arcano: 0, velocidad_30: null, velocidad_20: null, correr_multiplicador: null,
        tiempo_poner: '', tiempo_poner_rapido: '', tiempo_quitar: '',
        cantidad_por_precio: null,
        dureza: null, pg_por_pulgada: null, cuenta_como_gran_calidad: false, supera_rd: false, peso_multiplicador: null,
        bon_des_mas: null, penalizador_menos: null, fallo_arcano_menos: null, categoria_mas_ligera: false, dano_mod: null,
        modificador: 0, coste: 0, aplica_arma_cc: false, aplica_arma_distancia: false, aplica_municion: false,
        aplica_armadura: false, aplica_escudo: false, nivel_lanzador: null, id_intensidad_aura: null,
        id_encantamiento_base: null, es_plantilla: false,
    };
}

/** El nombre, la descripción con su origen, el nombre original, el manual y si es oficial, de cualquier entrada. */
function textosDe(entrada: TextoEquipo & { Nombre: string; Oficial: boolean; }): Partial<ValoresEquipo> {
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

function comunesDe(entrada: ArmaDetalle | ArmaduraDetalle): Partial<ValoresEquipo> {
    return {
        nombre: entrada.Nombre ?? '',
        descripcion: entrada.Descripcion ?? '',
        origen_descripcion: entrada.Origen_descripcion === 'srd' ? 'srd' : 'propia',
        nombre_original: entrada.Nombre_original ?? '',
        traducido: entrada.Traducido === true,
        id_manual: toNumberOrNull(entrada.Manual?.Id),
        pagina: toNumberOrNull(entrada.Manual?.Pagina),
        oficial: entrada.Oficial === true,
        precio: toNumberOrNull(entrada.Precio),
        peso: toNumberOrNull(entrada.Peso),
        id_material: toNumberOrNull(entrada.Material?.Id),
        id_tamano: toNumberOrNull(entrada.Tamano?.Id),
    };
}

export function valoresDeArma(arma: ArmaDetalle): ValoresEquipo {
    return {
        ...valoresVacios(),
        ...comunesDe(arma),
        id_tipo_dano: toNumberOrNull(arma.Tipo_dano?.Id),
        id_tipo_arma: toNumberOrNull(arma.Tipo_arma?.Id),
        id_manejo: toNumberOrNull(arma.Manejo?.Id),
        a_distancia: arma.A_distancia === true,
        arrojadiza: arma.Arrojadiza === true,
        doble: arma.Doble === true,
        alcance: toNumberOrNull(arma.Alcance),
        id_municion: toNumberOrNull(arma.Municion?.Id),
        dano_pequeno: arma.Dano_pequeno ?? '',
        dano_mediano: arma.Dano_mediano ?? '',
        critico_rango: toNumberOrNull(arma.Critico_rango),
        critico_multiplicador: toNumberOrNull(arma.Critico_multiplicador),
        critico_multiplicador_2: toNumberOrNull(arma.Critico_multiplicador_2),
        incremento_distancia: toNumberOrNull(arma.Incremento_distancia),
        indice_fuerza_coste: toNumberOrNull(arma.Indice_fuerza_coste),
    };
}

export function propiedadesDeArma(arma: ArmaDetalle, uid: () => string): FilaPropiedadArma[] {
    return (arma.Propiedades ?? []).map((propiedad) => ({ uid: uid(), id_propiedad: propiedad.Id, valor: propiedad.Valor ?? null }));
}

export function valoresDeArmadura(armadura: ArmaduraDetalle): ValoresEquipo {
    return {
        ...valoresVacios(),
        ...comunesDe(armadura),
        es_escudo: armadura.Es_escudo === true,
        ca: toNumberOrNull(armadura.Ca),
        bon_des: toNumberOrNull(armadura.Bon_des),
        penalizador: toNumberOrNull(armadura.Penalizador),
        id_peso_armadura: toNumberOrNull(armadura.Peso_armadura?.Id),
        id_tipo_escudo: toNumberOrNull(armadura.Tipo_escudo?.Id),
        fallo_arcano: toNumberOrNull(armadura.Fallo_arcano),
        velocidad_30: toNumberOrNull(armadura.Velocidad_30),
        velocidad_20: toNumberOrNull(armadura.Velocidad_20),
        correr_multiplicador: toNumberOrNull(armadura.Correr_multiplicador),
        tiempo_poner: armadura.Tiempo_poner ?? '',
        tiempo_poner_rapido: armadura.Tiempo_poner_rapido ?? '',
        tiempo_quitar: armadura.Tiempo_quitar ?? '',
    };
}

export function valoresDeMunicion(municion: MunicionDetalle): ValoresEquipo {
    return {
        ...valoresVacios(),
        ...textosDe(municion),
        precio: toNumberOrNull(municion.Precio),
        peso: toNumberOrNull(municion.Peso),
        cantidad_por_precio: toNumberOrNull(municion.Cantidad_por_precio),
    };
}

export function valoresDeMaterial(material: MaterialDetalle): ValoresEquipo {
    const efectos = material.Efectos;
    return {
        ...valoresVacios(),
        ...textosDe(material),
        dureza: toNumberOrNull(material.Dureza),
        pg_por_pulgada: toNumberOrNull(material.Pg_por_pulgada),
        cuenta_como_gran_calidad: material.Cuenta_como_gran_calidad === true,
        supera_rd: material.Supera_rd === true,
        peso_multiplicador: toNumberOrNull(efectos?.Peso_multiplicador),
        bon_des_mas: toNumberOrNull(efectos?.Bon_des_mas),
        penalizador_menos: toNumberOrNull(efectos?.Penalizador_menos),
        fallo_arcano_menos: toNumberOrNull(efectos?.Fallo_arcano_menos),
        categoria_mas_ligera: efectos?.Categoria_mas_ligera === true,
        dano_mod: toNumberOrNull(efectos?.Dano_mod),
    };
}

export function costesDeMaterial(material: MaterialDetalle, uid: () => string): FilaCosteMaterial[] {
    return (material.Costes ?? []).map((coste) => ({
        uid: uid(),
        id_aplicacion: toNumberOrNull(coste.Aplicacion?.Id),
        coste: toNumberOrNull(coste.Coste),
        coste_por_libra: toNumberOrNull(coste.Coste_por_libra),
        multiplicador_precio: toNumberOrNull(coste.Multiplicador_precio),
        coste_encantar: toNumberOrNull(coste.Coste_encantar),
    }));
}

export function valoresDeEncantamiento(encantamiento: EncantamientoDetalle): ValoresEquipo {
    const aplica = encantamiento.Aplica_a;
    return {
        ...valoresVacios(),
        ...textosDe(encantamiento),
        modificador: toNumberOrNull(encantamiento.Modificador),
        coste: toNumberOrNull(encantamiento.Coste),
        aplica_arma_cc: aplica?.Arma_cuerpo_a_cuerpo === true,
        aplica_arma_distancia: aplica?.Arma_a_distancia === true,
        aplica_municion: aplica?.Municion === true,
        aplica_armadura: aplica?.Armadura === true,
        aplica_escudo: aplica?.Escudo === true,
        nivel_lanzador: toNumberOrNull(encantamiento.Nivel_lanzador),
        id_intensidad_aura: toNumberOrNull(encantamiento.Aura?.Intensidad?.Id),
        id_encantamiento_base: toNumberOrNull(encantamiento.Encantamiento_base?.Id),
        es_plantilla: encantamiento.Es_plantilla === true,
    };
}

/** Las filas de una aptitud: sus daños, los tipos de daño que pide y su aura, requisitos y modificadores. */
export function filasDeEncantamiento(encantamiento: EncantamientoDetalle, uid: () => string): FilasDeEquipo {
    return {
        ...filasVacias(),
        danos: (encantamiento.Danos ?? []).map((dano) => ({
            uid: uid(), dados: toText(dano.Dados), id_tipo_dano: toNumberOrNull(dano.Tipo_dano?.Id), condicion: toText(dano.Condicion),
        })),
        tiposDano: (encantamiento.Tipos_dano_requeridos ?? []).map((tipo) => toNumber(tipo.Id)),
        relaciones: relacionesDeLectura(encantamiento.Aura, encantamiento.Requisitos, encantamiento.Modificadores, uid),
    };
}

function comunesDelCuerpo(v: ValoresEquipo): EquipoCuerpoComun {
    return {
        nombre: toText(v.nombre).trim(),
        descripcion: toText(v.descripcion).trim(),
        origen_descripcion: v.origen_descripcion === 'srd' ? 'srd' : 'propia',
        nombre_original: toNullableText(v.nombre_original),
        traducido: v.traducido === true,
        id_manual: toNumber(v.id_manual),
        pagina: toNumber(v.pagina),
        oficial: v.oficial === true,
    };
}

/** Lo común con el manual y la página que pueden faltar (la munición y los materiales). */
function comunesSinManualDelCuerpo(v: ValoresEquipo): EquipoCuerpoComunSinManual {
    return { ...comunesDelCuerpo(v), id_manual: toNumberOrNull(v.id_manual), pagina: toNumberOrNull(v.pagina) };
}

export function cuerpoDeMunicion(v: ValoresEquipo): MunicionCuerpo {
    return {
        municion: {
            ...comunesSinManualDelCuerpo(v),
            precio: toNumberOrNull(v.precio),
            cantidad_por_precio: toNumberOrNull(v.cantidad_por_precio),
            peso: toNumberOrNull(v.peso),
        },
    };
}

export function cuerpoDeMaterial(v: ValoresEquipo, costes: readonly FilaCosteMaterial[]): MaterialCuerpo {
    return {
        material: {
            ...comunesSinManualDelCuerpo(v),
            dureza: toNumberOrNull(v.dureza),
            pg_por_pulgada: toNumberOrNull(v.pg_por_pulgada),
            cuenta_como_gran_calidad: v.cuenta_como_gran_calidad === true,
            supera_rd: v.supera_rd === true,
            peso_multiplicador: toNumberOrNull(v.peso_multiplicador),
            bon_des_mas: toNumberOrNull(v.bon_des_mas),
            penalizador_menos: toNumberOrNull(v.penalizador_menos),
            fallo_arcano_menos: toNumberOrNull(v.fallo_arcano_menos),
            categoria_mas_ligera: v.categoria_mas_ligera === true,
            dano_mod: toNumberOrNull(v.dano_mod),
        },
        costes: costes
            .filter((fila) => toNumber(fila.id_aplicacion) > 0)
            .map((fila) => ({
                id_aplicacion: toNumber(fila.id_aplicacion),
                coste: toNumberOrNull(fila.coste),
                coste_por_libra: toNumberOrNull(fila.coste_por_libra),
                multiplicador_precio: toNumberOrNull(fila.multiplicador_precio),
                coste_encantar: toNumberOrNull(fila.coste_encantar),
            })),
    };
}

export function cuerpoDeEncantamiento(v: ValoresEquipo, filas: FilasDeEquipo): EncantamientoCuerpo {
    return {
        encantamiento: {
            ...comunesDelCuerpo(v),
            modificador: toNumber(v.modificador),
            coste: toNumber(v.coste),
            aplica_arma_cc: v.aplica_arma_cc === true,
            aplica_arma_distancia: v.aplica_arma_distancia === true,
            aplica_municion: v.aplica_municion === true,
            aplica_armadura: v.aplica_armadura === true,
            aplica_escudo: v.aplica_escudo === true,
            nivel_lanzador: toNumberOrNull(v.nivel_lanzador),
            id_intensidad_aura: toNumberOrNull(v.id_intensidad_aura),
            id_encantamiento_base: toNumberOrNull(v.id_encantamiento_base),
            es_plantilla: v.es_plantilla === true,
        },
        aura_escuelas: escuelasDelCuerpo(filas.relaciones),
        tipos_dano: [...filas.tiposDano],
        requisitos: requisitosDelCuerpo(filas.relaciones),
        danos: filas.danos.map((dano) => ({
            dados: toText(dano.dados).trim(),
            id_tipo_dano: toNumberOrNull(dano.id_tipo_dano),
            condicion: toNullableText(dano.condicion),
        })),
        modificadores: modificadoresDelCuerpo(filas.relaciones.modificadores),
    };
}

/** Un daño en minúsculas y sin espacios («1D8» → «1d8»); vacío, `null`. */
export function danoNormalizado(valor: unknown): string | null {
    return toText(valor).replace(/\s+/g, '').toLowerCase() || null;
}

export function cuerpoDeArma(v: ValoresEquipo, propiedades: readonly FilaPropiedadArma[]): ArmaCuerpo {
    const multiplicador = toNumberOrNull(v.critico_multiplicador);
    return {
        arma: {
            ...comunesDelCuerpo(v),
            id_tipo_dano: toNumber(v.id_tipo_dano),
            id_tipo_arma: toNumber(v.id_tipo_arma),
            id_manejo: toNumberOrNull(v.id_manejo),
            a_distancia: v.a_distancia === true,
            arrojadiza: v.arrojadiza === true,
            doble: v.doble === true,
            alcance: toNumberOrNull(v.alcance),
            id_municion: toNumberOrNull(v.id_municion),
            dano_pequeno: danoNormalizado(v.dano_pequeno),
            dano_mediano: danoNormalizado(v.dano_mediano),
            // Sin multiplicador no hay crítico: tampoco rango ni segunda cabeza.
            critico_rango: multiplicador === null ? null : toNumberOrNull(v.critico_rango),
            critico_multiplicador: multiplicador,
            critico_multiplicador_2: multiplicador === null || v.doble !== true ? null : toNumberOrNull(v.critico_multiplicador_2),
            precio: toNumber(v.precio),
            id_material: toNumberOrNull(v.id_material),
            id_tamano: toNumber(v.id_tamano),
            peso: toNumber(v.peso),
            incremento_distancia: toNumber(v.incremento_distancia),
            indice_fuerza_coste: toNumberOrNull(v.indice_fuerza_coste),
        },
        propiedades: propiedades
            .filter((fila) => toNumber(fila.id_propiedad) > 0)
            .map((fila) => ({ id_propiedad: toNumber(fila.id_propiedad), valor: toNumberOrNull(fila.valor) })),
    };
}

export function cuerpoDeArmadura(v: ValoresEquipo): ArmaduraCuerpo {
    const escudo = v.es_escudo === true;
    return {
        armadura: {
            ...comunesDelCuerpo(v),
            ca: toNumber(v.ca),
            bon_des: toNumberOrNull(v.bon_des),
            penalizador: toNumber(v.penalizador),
            precio: toNumber(v.precio),
            id_material: toNumberOrNull(v.id_material),
            es_escudo: escudo,
            id_peso_armadura: escudo ? null : toNumberOrNull(v.id_peso_armadura),
            id_tipo_escudo: escudo ? toNumberOrNull(v.id_tipo_escudo) : null,
            peso: toNumber(v.peso),
            id_tamano: toNumber(v.id_tamano),
            fallo_arcano: toNumber(v.fallo_arcano),
            velocidad_30: toNumberOrNull(v.velocidad_30),
            velocidad_20: toNumberOrNull(v.velocidad_20),
            correr_multiplicador: toNumberOrNull(v.correr_multiplicador),
            tiempo_poner: toNullableText(v.tiempo_poner),
            tiempo_poner_rapido: toNullableText(v.tiempo_poner_rapido),
            tiempo_quitar: toNullableText(v.tiempo_quitar),
        },
    };
}

/** Un dado («1d8», «2d6») o una cifra fija («1»); el de un arma doble, el de sus dos cabezas («1d8/1d6»). Como la API. */
const DADO = '[1-9][0-9]*(?:d[1-9][0-9]*)?';
export const DANO_VALIDO = new RegExp(`^${DADO}(?:/${DADO})?$`);

/** Un problema del formulario, con el campo (la clave del cuerpo) en el que se enseña. */
export interface ProblemaDeEquipo {
    campo: keyof ValoresEquipo | 'propiedades' | 'costes' | 'danos' | 'modificadores';
    mensaje: string;
}

/**
 * Las reglas de la API que cruzan campos, para avisar antes de mandar (la API las comprueba igual y responde con el mismo
 * `field`): el tipo de arma y de daño, obligatorios; el daño de un arma doble con sus dos cabezas y el de una que no lo es con una; el crítico con su multiplicador;
 * una propiedad repetida.
 */
export function problemaDeArma(v: ValoresEquipo, propiedades: readonly FilaPropiedadArma[]): ProblemaDeEquipo | null {
    if (toNumberOrNull(v.id_tipo_arma) === null)
        return { campo: 'id_tipo_arma', mensaje: 'Tipo de arma obligatorio.' };
    if (toNumberOrNull(v.id_tipo_dano) === null)
        return { campo: 'id_tipo_dano', mensaje: 'Tipo de daño obligatorio.' };
    for (const campo of ['dano_pequeno', 'dano_mediano'] as const) {
        const dano = danoNormalizado(v[campo]);
        if (dano === null)
            continue;
        if (!DANO_VALIDO.test(dano))
            return { campo, mensaje: 'Un dado («1d8») o una cifra («1»).' };
        if (dano.includes('/') !== (v.doble === true))
            return {
                campo,
                mensaje: 'Un arma doble lleva el daño de sus dos cabezas («1d8/1d6»); una que no es doble, uno solo.',
            };
    }
    const ids = propiedades.map((fila) => toNumber(fila.id_propiedad)).filter((id) => id > 0);
    if (new Set(ids).size !== ids.length)
        return { campo: 'propiedades', mensaje: 'Una propiedad está repetida.' };
    return null;
}

/** Una armadura lleva su peso (ligera, intermedia o pesada) y un escudo su tipo; la API rechaza lo demás. */
export function problemaDeArmadura(v: ValoresEquipo): ProblemaDeEquipo | null {
    if (v.es_escudo === true && toNumberOrNull(v.id_tipo_escudo) === null)
        return { campo: 'id_tipo_escudo', mensaje: 'Un escudo lleva su tipo (broquel, ligero, pesado o pavés).' };
    if (v.es_escudo !== true && toNumberOrNull(v.id_peso_armadura) === null)
        return { campo: 'id_peso_armadura', mensaje: 'Una armadura es ligera, intermedia o pesada.' };
    return null;
}

/** Un material lleva un coste por aplicación (la API rechaza una repetida). */
export function problemaDeMaterial(costes: readonly FilaCosteMaterial[]): ProblemaDeEquipo | null {
    const ids = costes.map((fila) => toNumber(fila.id_aplicacion)).filter((id) => id > 0);
    if (new Set(ids).size !== ids.length)
        return { campo: 'costes', mensaje: 'Una aplicación está repetida: un coste por aplicación.' };
    if (costes.some((fila) => toNumber(fila.id_aplicacion) <= 0))
        return { campo: 'costes', mensaje: 'Cada coste lleva su aplicación.' };
    return null;
}

/** Los daños de una aptitud llevan sus dados; los modificadores, su objetivo, tipo y cifra. */
export function problemaDeEncantamiento(filas: FilasDeEquipo): ProblemaDeEquipo | null {
    if (filas.danos.some((dano) => toText(dano.dados).trim().length < 1))
        return { campo: 'danos', mensaje: 'Cada daño lleva sus dados («1d6»).' };
    const modificadores: ProblemaDeRelaciones | null = problemaDeModificadores(filas.relaciones.modificadores);
    return modificadores ? { campo: 'modificadores', mensaje: modificadores.mensaje } : null;
}

/** El problema del formulario de un tipo antes de mandarlo, o `null`. */
export function problemaDeEquipo(tipo: TipoEquipoEditable, v: ValoresEquipo, filas: FilasDeEquipo): ProblemaDeEquipo | null {
    switch (tipo) {
        case 'arma': return problemaDeArma(v, filas.propiedades);
        case 'armadura': return problemaDeArmadura(v);
        case 'material': return problemaDeMaterial(filas.costes);
        case 'encantamiento': return problemaDeEncantamiento(filas);
        case 'municion': return null;
    }
}

/** El cuerpo de un tipo. */
export function cuerpoDeEquipo(tipo: TipoEquipoEditable, v: ValoresEquipo, filas: FilasDeEquipo): CuerpoDeEquipo {
    switch (tipo) {
        case 'arma': return cuerpoDeArma(v, filas.propiedades);
        case 'armadura': return cuerpoDeArmadura(v);
        case 'municion': return cuerpoDeMunicion(v);
        case 'material': return cuerpoDeMaterial(v, filas.costes);
        case 'encantamiento': return cuerpoDeEncantamiento(v, filas);
    }
}
