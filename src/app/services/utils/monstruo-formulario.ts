import { cambiosEntreCuerpos, enOrdenDeCampos } from 'src/app/components/shared/insercion-marco/cambios-de-formulario';
import { FilaNombrada } from 'src/app/components/shared/insercion-marco/filas-repetibles';
import { CamposDeFormulario } from 'src/app/components/shared/insercion-marco/errores-de-formulario';
import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import {
    DIETAS_MONSTRUO,
    LicantroposDelMonstruo,
    MonstruoCreateRequest,
    MonstruoDetalle,
    MonstruoDieta,
    MonstruoEscalaresRequest,
} from 'src/app/interfaces/monstruo';
import { NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { idsUnicosOrdenados, toInt, toNumber, toNumberOrNull, toPositiveInt, toText } from './normalizacion';

// El formulario de los monstruos (hito 6 del roadmap de inserciones, 2026-10-31): los pasos, los campos con su etiqueta
// y su paso, el cuerpo de `POST /monstruos/add` y de `PUT /monstruos/<id>` (`MonstruoCreateRequest` en
// `docs/publica/endpoints/catalogos.md`), el relleno desde `GET /monstruos/<id>` y lo que cambia al modificar. Todo es
// puro para probarlo sin la pantalla.

/**
 * Las dietas que se pueden elegir, con su nombre: un animal carnívoro u omnívoro puede ser la base de un licántropo, y
 * la API genera sus plantillas al guardarlo (Manual de monstruos 1, pág. 177; 2026-11-06). Sin elegir, «sin decir».
 */
export const DIETAS_MONSTRUO_OPCIONES: readonly { valor: MonstruoDieta; nombre: string; }[] = DIETAS_MONSTRUO.map((valor) => ({
    valor,
    nombre: { carnivoro: 'Carnívoro', omnivoro: 'Omnívoro', herbivoro: 'Herbívoro' }[valor],
}));

/** El nombre de una dieta («Carnívoro»), o `null` sin decir. */
export function nombreDeDieta(dieta: MonstruoDieta | null | undefined): string | null {
    return DIETAS_MONSTRUO_OPCIONES.find((opcion) => opcion.valor === dieta)?.nombre ?? null;
}

/**
 * Lo que dice el aviso de guardado sobre los licántropos del monstruo (`licantropos` de la respuesta): los creados, si
 * se han regenerado, los retirados y los avisos de la API. Vacío si no ha pasado nada.
 */
export function textoLicantropos(licantropos: LicantroposDelMonstruo | null | undefined): string {
    if (!licantropos)
        return '';
    const nombres = (lista: { Nombre: string; }[]) => lista.map((item) => item.Nombre).join(' y ');
    const creadas = licantropos.Generadas.filter((item) => item.Accion === 'creada');
    const regeneradas = licantropos.Generadas.filter((item) => item.Accion !== 'creada');
    return [
        creadas.length > 0 ? `Se han creado sus licántropos: ${nombres(creadas)}.` : '',
        regeneradas.length > 0 ? `Sus licántropos se han regenerado: ${nombres(regeneradas)}.` : '',
        licantropos.Retiradas.length > 0 ? `Ya no puede tener licántropos: se han retirado ${nombres(licantropos.Retiradas)}.` : '',
        ...licantropos.Avisos.map((aviso) => aviso.message),
    ].filter((texto) => texto.length > 0).join(' ');
}

/** Los seis pasos de la pantalla, en orden. */
export const PASOS_MONSTRUO: readonly string[] = [
    'Identidad', 'Combate', 'Características y salvaciones', 'Aptitudes', 'Familiar y compañero', 'Descripción',
];

/** Las características en el orden del manual, con su campo del alta («constitucion»), su nombre y su abreviatura. */
export const CARACTERISTICAS_MONSTRUO = CARACTERISTICAS.map((clave) => {
    const nombre = NOMBRES_CARACTERISTICAS[clave];
    return { campo: clave.toLowerCase() as Lowercase<typeof clave>, nombre, corto: nombre.slice(0, 3) };
});

/** Los textos libres de la fila: vacíos son «no tiene» (la API los guarda vacíos y la lectura los da como `null`). */
const TEXTOS: readonly (keyof MonstruoEscalaresRequest)[] = [
    'nombre', 'descripcion', 'cantidad_dg', 'ataques', 'ataque_completo', 'reduccion_dano', 'resistencia_conjuros',
    'resistencia_elemental', 'cd_sortilegas', 'valor_desafio', 'tesoro',
];
const BOOLEANOS: readonly (keyof MonstruoEscalaresRequest)[] = ['familiar', 'companero', 'oficial'];
/** Los que pueden ir `null`: el «—» de una característica y «no vuela». */
const CARACTERISTICAS_CAMPOS = CARACTERISTICAS_MONSTRUO.map((c) => c.campo);

/**
 * Cada campo del formulario: su etiqueta (la de la pantalla y la de «N cambios: …») y su paso (de `PASOS_MONSTRUO`). Las
 * claves de los escalares son las del alta (`monstruo.<campo>`), para que un 400 con `field` lleve a su campo
 * (`campoDeErrorApi`, con la raíz `monstruo`); las listas, las suyas.
 */
export const CAMPOS_MONSTRUO: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    id_manual: { etiqueta: 'Manual', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    oficial: { etiqueta: 'Oficial', paso: 0 },
    id_tipo: { etiqueta: 'Tipo de criatura', paso: 0 },
    subtipos: { etiqueta: 'Subtipos', paso: 0 },
    id_tamano: { etiqueta: 'Tamaño', paso: 0 },
    dieta: { etiqueta: 'Dieta', paso: 0 },
    id_alineamiento: { etiqueta: 'Alineamiento', paso: 0 },
    valor_desafio: { etiqueta: 'Valor de desafío', paso: 0 },
    tesoro: { etiqueta: 'Tesoro', paso: 0 },
    idiomas: { etiqueta: 'Idiomas', paso: 0 },
    cantidad_dg: { etiqueta: 'Dados de golpe', paso: 1 },
    id_tipo_dado: { etiqueta: 'Dado de golpe', paso: 1 },
    suma_dg: { etiqueta: 'Suma a los DG', paso: 1 },
    iniciativa: { etiqueta: 'Iniciativa', paso: 1 },
    ca: { etiqueta: 'CA', paso: 1 },
    toque: { etiqueta: 'CA de toque', paso: 1 },
    desprevenido: { etiqueta: 'CA desprevenido', paso: 1 },
    armadura_natural: { etiqueta: 'Armadura natural', paso: 1 },
    ataque_base: { etiqueta: 'Ataque base', paso: 1 },
    presa: { etiqueta: 'Presa', paso: 1 },
    ataques: { etiqueta: 'Ataque', paso: 1 },
    ataque_completo: { etiqueta: 'Ataque completo', paso: 1 },
    espacio: { etiqueta: 'Espacio (pies)', paso: 1 },
    alcance: { etiqueta: 'Alcance (pies)', paso: 1 },
    correr: { etiqueta: 'Correr', paso: 1 },
    nadar: { etiqueta: 'Nadar', paso: 1 },
    volar: { etiqueta: 'Volar', paso: 1 },
    trepar: { etiqueta: 'Trepar', paso: 1 },
    excavar: { etiqueta: 'Excavar', paso: 1 },
    id_maniobrabilidad: { etiqueta: 'Maniobrabilidad', paso: 1 },
    ...Object.fromEntries(CARACTERISTICAS_MONSTRUO.map((c) => [c.campo, { etiqueta: c.nombre, paso: 2 }])),
    fortaleza: { etiqueta: 'Fortaleza', paso: 2 },
    reflejos: { etiqueta: 'Reflejos', paso: 2 },
    voluntad: { etiqueta: 'Voluntad', paso: 2 },
    reduccion_dano: { etiqueta: 'Reducción de daño', paso: 2 },
    resistencia_conjuros: { etiqueta: 'Resistencia a conjuros', paso: 2 },
    resistencia_elemental: { etiqueta: 'Resistencia a la energía', paso: 2 },
    cd_sortilegas: { etiqueta: 'CD de las sortílegas', paso: 2 },
    raciales: { etiqueta: 'Aptitudes', paso: 3 },
    ataquesEspeciales: { etiqueta: 'Ataques especiales', paso: 3 },
    sortilegas: { etiqueta: 'Aptitudes sortílegas', paso: 3 },
    dotes: { etiqueta: 'Dotes', paso: 3 },
    habilidades: { etiqueta: 'Habilidades', paso: 3 },
    familiar: { etiqueta: 'Puede ser familiar', paso: 4 },
    companero: { etiqueta: 'Puede ser compañero animal', paso: 4 },
    alineamientos_requeridos: { etiqueta: 'Alineamientos que pide', paso: 4 },
    niveles_clase: { etiqueta: 'Clases con las que se tiene', paso: 4 },
    descripcion: { etiqueta: 'Descripción', paso: 5 },
};

/** Los escalares del formulario: los del alta, con los números a `null` mientras estén vacíos. */
export type MonstruoFormularioValor = { [K in keyof MonstruoEscalaresRequest]: MonstruoEscalaresRequest[K] | null };

export interface FilaDoteMonstruo extends FilaNombrada {
    /** -1 sin extra; > 0, un extra de la dote. */
    id_extra: number;
}

export interface FilaHabilidadMonstruo extends FilaNombrada {
    /** `ID_EXTRA_HABILIDAD_SIN_EXTRA` (-1) sin extra; > 0, un extra de la habilidad. */
    id_extra: number;
    rangos: number;
}

export interface FilaSortilegaMonstruo extends FilaNombrada {
    nivel_lanzador: number;
    usos_diarios: string;
}

/** Una clase con la que el monstruo es familiar o compañero; 0 en plantilla, dote o preferencia: «no aplica». */
export interface FilaNivelClaseMonstruo {
    uid: string;
    id_clase: number;
    nivel: number;
    id_plantilla: number;
    id_preferencia_legal: number;
    id_preferencia_moral: number;
    id_dote: number;
}

/** Las listas del formulario. */
export interface ListasMonstruo {
    subtipos: FilaNombrada[];
    idiomas: FilaNombrada[];
    raciales: FilaNombrada[];
    ataquesEspeciales: FilaNombrada[];
    sortilegas: FilaSortilegaMonstruo[];
    dotes: FilaDoteMonstruo[];
    habilidades: FilaHabilidadMonstruo[];
    niveles_clase: FilaNivelClaseMonstruo[];
    alineamientos_familiar: number[];
    alineamientos_companero: number[];
}

/** El formulario vacío de un monstruo nuevo: homebrew, con las cifras de una criatura corriente (CA 10, todo a 10). */
export function valorMonstruoNuevo(): MonstruoFormularioValor {
    return {
        nombre: '',
        descripcion: '',
        id_manual: 0,
        pagina: 0,
        id_tipo: null,
        id_tamano: null,
        cantidad_dg: '1',
        id_tipo_dado: null,
        suma_dg: 0,
        iniciativa: 0,
        correr: 0,
        nadar: 0,
        volar: 0,
        trepar: 0,
        excavar: 0,
        id_maniobrabilidad: null,
        ca: 10,
        toque: 10,
        desprevenido: 10,
        armadura_natural: 0,
        ataque_base: 0,
        presa: 0,
        ataques: '',
        ataque_completo: '',
        reduccion_dano: '',
        resistencia_conjuros: '',
        resistencia_elemental: '',
        cd_sortilegas: '',
        espacio: 5,
        alcance: 5,
        fortaleza: 0,
        reflejos: 0,
        voluntad: 0,
        fuerza: 10,
        destreza: 10,
        constitucion: 10,
        inteligencia: 10,
        sabiduria: 10,
        carisma: 10,
        valor_desafio: '',
        tesoro: '',
        familiar: false,
        companero: false,
        id_alineamiento: null,
        oficial: false,
        dieta: null,
    };
}

export function listasMonstruoVacias(): ListasMonstruo {
    return {
        subtipos: [], idiomas: [], raciales: [], ataquesEspeciales: [], sortilegas: [], dotes: [], habilidades: [],
        niveles_clase: [], alineamientos_familiar: [], alineamientos_companero: [],
    };
}

/** El formulario de un monstruo que ya existe (`GET /monstruos/<id>`, normalizado con `normalizeMonstruoDetalle`). */
export function valorDesdeMonstruo(monstruo: MonstruoDetalle): MonstruoFormularioValor {
    const car = monstruo.Caracteristicas;
    return {
        nombre: toText(monstruo.Nombre),
        descripcion: toText(monstruo.Descripcion),
        id_manual: toInt(monstruo.Manual?.Id),
        pagina: toInt(monstruo.Manual?.Pagina),
        id_tipo: toPositiveInt(monstruo.Tipo?.Id),
        id_tamano: toPositiveInt(monstruo.Tamano?.Id),
        cantidad_dg: toText(monstruo.Dados_golpe?.Cantidad),
        id_tipo_dado: toPositiveInt(monstruo.Dados_golpe?.Tipo_dado?.Id),
        suma_dg: toInt(monstruo.Dados_golpe?.Suma),
        iniciativa: toInt(monstruo.Iniciativa),
        correr: toInt(monstruo.Movimientos?.Correr),
        nadar: toInt(monstruo.Movimientos?.Nadar),
        volar: toInt(monstruo.Movimientos?.Volar),
        trepar: toInt(monstruo.Movimientos?.Trepar),
        excavar: toInt(monstruo.Movimientos?.Excavar),
        id_maniobrabilidad: toPositiveInt(monstruo.Maniobrabilidad?.Id),
        ca: toInt(monstruo.Defensa?.Ca),
        toque: toInt(monstruo.Defensa?.Toque),
        desprevenido: toInt(monstruo.Defensa?.Desprevenido),
        armadura_natural: toInt(monstruo.Defensa?.Armadura_natural),
        ataque_base: toInt(monstruo.Ataque?.Ataque_base),
        presa: toInt(monstruo.Ataque?.Presa),
        ataques: toText(monstruo.Ataque?.Ataques),
        ataque_completo: toText(monstruo.Ataque?.Ataque_completo),
        reduccion_dano: toText(monstruo.Defensa?.Reduccion_dano),
        resistencia_conjuros: toText(monstruo.Defensa?.Resistencia_conjuros),
        resistencia_elemental: toText(monstruo.Defensa?.Resistencia_elemental),
        cd_sortilegas: toText(monstruo.Cd_sortilegas),
        espacio: toNumber(monstruo.Espacio),
        alcance: toInt(monstruo.Alcance),
        fortaleza: toInt(monstruo.Salvaciones?.Fortaleza),
        reflejos: toInt(monstruo.Salvaciones?.Reflejos),
        voluntad: toInt(monstruo.Salvaciones?.Voluntad),
        fuerza: toNumberOrNull(car?.Fuerza),
        destreza: toNumberOrNull(car?.Destreza),
        constitucion: toNumberOrNull(car?.Constitucion),
        inteligencia: toNumberOrNull(car?.Inteligencia),
        sabiduria: toNumberOrNull(car?.Sabiduria),
        carisma: toNumberOrNull(car?.Carisma),
        valor_desafio: toText(monstruo.Valor_desafio),
        tesoro: toText(monstruo.Tesoro),
        familiar: monstruo.Familiar === true,
        companero: monstruo.Companero === true,
        id_alineamiento: toPositiveInt(monstruo.Alineamiento?.Id),
        oficial: monstruo.Oficial === true,
        dieta: monstruo.Dieta ?? null,
    };
}

/** Las listas de un monstruo que ya existe; `uid` da un identificador nuevo por fila. */
export function listasDesdeMonstruo(monstruo: MonstruoDetalle, uid: () => string): ListasMonstruo {
    const nombrada = (item: { Id?: unknown; Nombre?: unknown; }): FilaNombrada =>
        ({ uid: uid(), id: toInt(item?.Id), nombre: toText(item?.Nombre) });
    const conId = <T extends { id: number; }>(fila: T) => fila.id > 0;
    return {
        subtipos: (monstruo.Subtipos ?? []).map(nombrada).filter(conId),
        idiomas: (monstruo.Idiomas ?? []).map(nombrada).filter(conId),
        raciales: (monstruo.Raciales ?? []).map(nombrada).filter(conId),
        ataquesEspeciales: (monstruo.Ataques_especiales ?? []).map(nombrada).filter(conId),
        sortilegas: (monstruo.Sortilegas ?? []).map((item) => ({
            ...nombrada(item?.Conjuro),
            nivel_lanzador: toInt(item?.Nivel_lanzador),
            usos_diarios: toText(item?.Usos_diarios),
        })).filter(conId),
        dotes: (monstruo.Dotes ?? []).map((item) => ({
            ...nombrada(item?.Dote),
            id_extra: toPositiveInt(item?.Contexto?.Id_extra) ?? -1,
        })).filter(conId),
        habilidades: (monstruo.Habilidades ?? []).map((item) => ({
            uid: uid(),
            id: toInt(item?.Id_habilidad),
            nombre: toText(item?.Habilidad),
            id_extra: toPositiveInt(item?.Id_extra) ?? ID_EXTRA_HABILIDAD_SIN_EXTRA,
            rangos: toInt(item?.Rangos),
        })).filter(conId),
        niveles_clase: (monstruo.Niveles_clase ?? []).map((item) => ({
            uid: uid(),
            id_clase: toInt(item?.Clase?.Id),
            nivel: toInt(item?.Nivel),
            id_plantilla: Math.max(0, toInt(item?.Plantilla?.Id)),
            id_preferencia_legal: Math.max(0, toInt(item?.Preferencia_legal?.Id)),
            id_preferencia_moral: Math.max(0, toInt(item?.Preferencia_moral?.Id)),
            id_dote: Math.max(0, toInt(item?.Dote?.Id)),
        })).filter((fila) => fila.id_clase > 0),
        alineamientos_familiar: idsUnicosOrdenados((monstruo.Alineamientos_requeridos?.Familiar ?? []).map((item) => item?.Id)),
        alineamientos_companero: idsUnicosOrdenados((monstruo.Alineamientos_requeridos?.Companero ?? []).map((item) => item?.Id)),
    };
}

/** Una fila nueva de los niveles de clase: la clase elegida, nivel 1 y sin plantilla, dote ni preferencias. */
export function filaNivelClaseNueva(uid: string, idClase: number): FilaNivelClaseMonstruo {
    return { uid, id_clase: toInt(idClase), nivel: 1, id_plantilla: 0, id_preferencia_legal: 0, id_preferencia_moral: 0, id_dote: 0 };
}

/** El cuerpo de `POST /monstruos/add` (y del `PUT` de la modificación, que lleva el mismo). */
export function construirMonstruoRequest(valor: MonstruoFormularioValor, listas: ListasMonstruo): MonstruoCreateRequest {
    const monstruo = {} as Record<keyof MonstruoEscalaresRequest, unknown>;
    (Object.keys(valor) as (keyof MonstruoEscalaresRequest)[]).forEach((campo) => {
        const dato = valor[campo];
        if (TEXTOS.includes(campo))
            monstruo[campo] = `${dato ?? ''}`.trim();
        else if (BOOLEANOS.includes(campo))
            monstruo[campo] = dato === true;
        else if ((CARACTERISTICAS_CAMPOS as string[]).includes(campo))
            monstruo[campo] = toNumberOrNull(dato) === null ? null : toInt(dato);
        else if (campo === 'id_maniobrabilidad')
            monstruo[campo] = toPositiveInt(dato);
        else if (campo === 'espacio')
            monstruo[campo] = toNumber(dato);
        else if (campo === 'dieta')
            monstruo[campo] = DIETAS_MONSTRUO.includes(dato as MonstruoDieta) ? dato : null;
        else
            monstruo[campo] = toInt(dato);
    });
    const ids = (filas: FilaNombrada[]) => idsUnicosOrdenados(filas.map((fila) => fila.id));
    return {
        monstruo: monstruo as unknown as MonstruoEscalaresRequest,
        subtipos: ids(listas.subtipos),
        idiomas: ids(listas.idiomas),
        dotes: listas.dotes.filter((fila) => fila.id > 0)
            .map((fila) => ({ id_dote: toInt(fila.id), id_extra: toPositiveInt(fila.id_extra) })),
        habilidades: listas.habilidades.filter((fila) => fila.id > 0)
            .map((fila) => ({ id_habilidad: toInt(fila.id), id_extra: toPositiveInt(fila.id_extra), rangos: toInt(fila.rangos) })),
        sortilegas: listas.sortilegas.filter((fila) => fila.id > 0).map((fila) => ({
            id_conjuro: toInt(fila.id),
            nivel_lanzador: toInt(fila.nivel_lanzador),
            usos_diarios: `${fila.usos_diarios ?? ''}`.trim(),
        })),
        raciales: ids(listas.raciales),
        ataquesEspeciales: ids(listas.ataquesEspeciales),
        niveles_clase: listas.niveles_clase.filter((fila) => fila.id_clase > 0).map((fila) => ({
            id_clase: toInt(fila.id_clase),
            nivel: toInt(fila.nivel),
            id_plantilla: toPositiveInt(fila.id_plantilla),
            id_preferencia_legal: toPositiveInt(fila.id_preferencia_legal),
            id_preferencia_moral: toPositiveInt(fila.id_preferencia_moral),
            id_dote: toPositiveInt(fila.id_dote),
        })),
        alineamientos_requeridos: {
            familiar: idsUnicosOrdenados(listas.alineamientos_familiar),
            companero: idsUnicosOrdenados(listas.alineamientos_companero),
        },
    };
}

const LISTAS = ['subtipos', 'idiomas', 'dotes', 'habilidades', 'sortilegas', 'raciales', 'ataquesEspeciales', 'niveles_clase'] as const;

/**
 * Las claves de `CAMPOS_MONSTRUO` que cambian entre dos cuerpos del alta (el del monstruo tal como llegó y el de ahora),
 * en el orden de los campos: así se marcan los campos y los pasos y se escribe «N cambios: …».
 */
export function camposCambiadosMonstruo(antes: MonstruoCreateRequest, ahora: MonstruoCreateRequest): string[] {
    const cambiados = cambiosEntreCuerpos(antes, ahora, 'monstruo', LISTAS);
    if (JSON.stringify(antes.alineamientos_requeridos) !== JSON.stringify(ahora.alineamientos_requeridos))
        cambiados.add('alineamientos_requeridos');
    return enOrdenDeCampos(cambiados, CAMPOS_MONSTRUO);
}
