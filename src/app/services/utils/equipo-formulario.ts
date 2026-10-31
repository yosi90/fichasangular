import { ArmaCuerpo, ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraCuerpo, ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { EquipoCuerpoComun, EquipoRef, OrigenDescripcion } from 'src/app/interfaces/equipo';
import { toNumberOrNull } from './normalizacion';

/**
 * El formulario de «Insertar/Modificar arma» y «Insertar/Modificar armadura» (`nuevo-equipo`, hito 7 del roadmap de
 * inserciones): los valores de sus controles a partir del `GET` de la entrada y el cuerpo de `POST …/add` y
 * `PUT …/<id>` a partir de los controles. Comprueba antes de mandar lo mismo que la API (`docs/publica/endpoints/
 * catalogos.md`, «Armas» y «Armaduras»), para avisar en su campo.
 */
export type TipoEquipoEditable = 'arma' | 'armadura';

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
}

/** Una propiedad del arma en su fila: «Desarmar» con su bonificador (`valor`), o sin cifra. */
export interface FilaPropiedadArma {
    uid: string;
    id_propiedad: number | null;
    valor: number | null;
}

/** Lo que se manda de una entrada: el cuerpo de la API y, del arma, sus propiedades. */
export type CuerpoDeEquipo = ArmaCuerpo | ArmaduraCuerpo;

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
    };
}

function idDe(ref: EquipoRef | null | undefined): number | null {
    return ref && Number.isFinite(Number(ref.Id)) ? Number(ref.Id) : null;
}

function comunesDe(entrada: ArmaDetalle | ArmaduraDetalle): Partial<ValoresEquipo> {
    return {
        nombre: entrada.Nombre ?? '',
        descripcion: entrada.Descripcion ?? '',
        origen_descripcion: entrada.Origen_descripcion === 'srd' ? 'srd' : 'propia',
        nombre_original: entrada.Nombre_original ?? '',
        traducido: entrada.Traducido === true,
        id_manual: idDe(entrada.Manual),
        pagina: toNumberOrNull(entrada.Manual?.Pagina),
        oficial: entrada.Oficial === true,
        precio: toNumberOrNull(entrada.Precio),
        peso: toNumberOrNull(entrada.Peso),
        id_material: idDe(entrada.Material),
        id_tamano: idDe(entrada.Tamano),
    };
}

export function valoresDeArma(arma: ArmaDetalle): ValoresEquipo {
    return {
        ...valoresVacios(),
        ...comunesDe(arma),
        id_tipo_dano: idDe(arma.Tipo_dano),
        id_tipo_arma: idDe(arma.Tipo_arma),
        id_manejo: idDe(arma.Manejo),
        a_distancia: arma.A_distancia === true,
        arrojadiza: arma.Arrojadiza === true,
        doble: arma.Doble === true,
        alcance: toNumberOrNull(arma.Alcance),
        id_municion: idDe(arma.Municion),
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
        id_peso_armadura: idDe(armadura.Peso_armadura),
        id_tipo_escudo: idDe(armadura.Tipo_escudo),
        fallo_arcano: toNumberOrNull(armadura.Fallo_arcano),
        velocidad_30: toNumberOrNull(armadura.Velocidad_30),
        velocidad_20: toNumberOrNull(armadura.Velocidad_20),
        correr_multiplicador: toNumberOrNull(armadura.Correr_multiplicador),
        tiempo_poner: armadura.Tiempo_poner ?? '',
        tiempo_poner_rapido: armadura.Tiempo_poner_rapido ?? '',
        tiempo_quitar: armadura.Tiempo_quitar ?? '',
    };
}

function texto(valor: unknown): string {
    return `${valor ?? ''}`.trim();
}

function textoONulo(valor: unknown): string | null {
    return texto(valor) || null;
}

function numero(valor: unknown, porDefecto: number = 0): number {
    return toNumberOrNull(valor) ?? porDefecto;
}

function comunesDelCuerpo(v: ValoresEquipo): EquipoCuerpoComun {
    return {
        nombre: texto(v.nombre),
        descripcion: texto(v.descripcion),
        origen_descripcion: v.origen_descripcion === 'srd' ? 'srd' : 'propia',
        nombre_original: textoONulo(v.nombre_original),
        traducido: v.traducido === true,
        id_manual: numero(v.id_manual),
        pagina: numero(v.pagina),
        oficial: v.oficial === true,
    };
}

/** Un daño en minúsculas y sin espacios («1D8» → «1d8»); vacío, `null`. */
export function danoNormalizado(valor: unknown): string | null {
    return texto(valor).replace(/\s+/g, '').toLowerCase() || null;
}

export function cuerpoDeArma(v: ValoresEquipo, propiedades: readonly FilaPropiedadArma[]): ArmaCuerpo {
    const multiplicador = toNumberOrNull(v.critico_multiplicador);
    return {
        arma: {
            ...comunesDelCuerpo(v),
            id_tipo_dano: numero(v.id_tipo_dano),
            id_tipo_arma: numero(v.id_tipo_arma),
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
            precio: numero(v.precio),
            id_material: toNumberOrNull(v.id_material),
            id_tamano: numero(v.id_tamano),
            peso: numero(v.peso),
            incremento_distancia: numero(v.incremento_distancia),
            indice_fuerza_coste: toNumberOrNull(v.indice_fuerza_coste),
        },
        propiedades: propiedades
            .filter((fila) => numero(fila.id_propiedad) > 0)
            .map((fila) => ({ id_propiedad: numero(fila.id_propiedad), valor: toNumberOrNull(fila.valor) })),
    };
}

export function cuerpoDeArmadura(v: ValoresEquipo): ArmaduraCuerpo {
    const escudo = v.es_escudo === true;
    return {
        armadura: {
            ...comunesDelCuerpo(v),
            ca: numero(v.ca),
            bon_des: toNumberOrNull(v.bon_des),
            penalizador: numero(v.penalizador),
            precio: numero(v.precio),
            id_material: toNumberOrNull(v.id_material),
            es_escudo: escudo,
            id_peso_armadura: escudo ? null : toNumberOrNull(v.id_peso_armadura),
            id_tipo_escudo: escudo ? toNumberOrNull(v.id_tipo_escudo) : null,
            peso: numero(v.peso),
            id_tamano: numero(v.id_tamano),
            fallo_arcano: numero(v.fallo_arcano),
            velocidad_30: toNumberOrNull(v.velocidad_30),
            velocidad_20: toNumberOrNull(v.velocidad_20),
            correr_multiplicador: toNumberOrNull(v.correr_multiplicador),
            tiempo_poner: textoONulo(v.tiempo_poner),
            tiempo_poner_rapido: textoONulo(v.tiempo_poner_rapido),
            tiempo_quitar: textoONulo(v.tiempo_quitar),
        },
    };
}

/** Un dado («1d8», «2d6») o una cifra fija («1»); el de un arma doble, el de sus dos cabezas («1d8/1d6»). Como la API. */
const DADO = '[1-9][0-9]*(?:d[1-9][0-9]*)?';
export const DANO_VALIDO = new RegExp(`^${DADO}(?:/${DADO})?$`);

/** Un problema del formulario, con el campo (la clave del cuerpo) en el que se enseña. */
export interface ProblemaDeEquipo {
    campo: keyof ValoresEquipo | 'propiedades';
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
    const ids = propiedades.map((fila) => numero(fila.id_propiedad)).filter((id) => id > 0);
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

/** El problema del formulario de un tipo antes de mandarlo, o `null`. */
export function problemaDeEquipo(tipo: TipoEquipoEditable, v: ValoresEquipo, propiedades: readonly FilaPropiedadArma[]): ProblemaDeEquipo | null {
    return tipo === 'arma' ? problemaDeArma(v, propiedades) : problemaDeArmadura(v);
}

/** El cuerpo de un tipo. */
export function cuerpoDeEquipo(tipo: TipoEquipoEditable, v: ValoresEquipo, propiedades: readonly FilaPropiedadArma[]): CuerpoDeEquipo {
    return tipo === 'arma' ? cuerpoDeArma(v, propiedades) : cuerpoDeArmadura(v);
}
