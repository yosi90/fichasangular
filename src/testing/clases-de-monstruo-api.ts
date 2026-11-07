/**
 * Las clases de monstruo muerto viviente de *Libris Mortis* (págs. 35-40), como las dará la API cuando estén sus datos
 * (fase 5.4 del roadmap `ACTIVO_razas-mutadas`): `ClaseDetalle` de `GET /clases` con la forma de la fase 1 del contrato
 * (`docs/publica/endpoints/catalogos.md`: `Progresion_obligatoria`, `Sin_penalizacion_multiclase`, `Mutacion` y, por nivel,
 * `Dg`, `Dote` y `Armadura_natural`; las demás claves, como las de una clase de `GET /clases` de la API de desarrollo del
 * 2026-11-07). Las tablas son las del estudio (`estudio-libris-mortis-clases-2026-11-07.md`, apartado 3.7). Mientras no hay
 * datos en `rol_dev`, las razas mutadas «combinadas» se simulan sobre bases reales (`RAZAS_API`) con el tipo muerto viviente
 * y los ajustes de su bloque racial, como haría `GET /razas/{id}/sobre/{idBase}`.
 */
/* eslint-disable */
import { RAZAS_API } from './razas-mutadas-api';

export interface TablaClaseDeMonstruo {
    id: number;
    nombre: string;
    /** La raza mutada que lleva (su bloque de rasgos raciales). */
    mutacion: { Id: number; Nombre: string; };
    /** Ataque base, Fortaleza y Reflejos, Voluntad: un valor por nivel. */
    ataque: number[];
    fortRef: number[];
    voluntad: number[];
    dgs: number[];
    dotes: number[];
    /** La armadura natural total desde ese nivel. */
    armaduraNatural: Record<number, number>;
}

const signo = (valor: number) => `${valor >= 0 ? '+' : ''}${valor}`;

/** Una clase de monstruo con su tabla, como la da `GET /clases`. */
export function claseDeMonstruoApi(tabla: TablaClaseDeMonstruo, extra: Record<string, any> = {}): Record<string, any> {
    const niveles = tabla.ataque.length;
    let armadura = 0;
    const repetirHasta20 = (valores: number[]) => Array.from({ length: 20 }, (_, i) => signo(valores[Math.min(i, valores.length - 1)]));
    return {
        Id: tabla.id,
        Nombre: tabla.nombre,
        Descripcion: '',
        Manual: { Id: 40, Nombre: 'Libris Mortis. El libro de los muertos vivientes', Pagina: 35 },
        Tipo_dado: { Id: 6, Nombre: 'd12' },
        Puntos_habilidad: { Id: 2, Valor: 4 },
        Ataque_base: { Id: 900, Nombre: 'Propia', Valores: repetirHasta20(tabla.ataque) },
        Salvaciones: {
            Fortaleza: { Id: 900, Nombre: 'Propia', Valores: repetirHasta20(tabla.fortRef) },
            Reflejos: { Id: 900, Nombre: 'Propia', Valores: repetirHasta20(tabla.fortRef) },
            Voluntad: { Id: 901, Nombre: 'Propia', Valores: repetirHasta20(tabla.voluntad) },
        },
        Nivel_max_claseo: niveles,
        Mod_salv_conjuros: '',
        Conjuros: { Arcanos: false, Divinos: false, Psionicos: false, Listado: [], Clase_origen: null },
        Roles: { Dps: true, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: true,
        Prestigio: false,
        Tiene_prerrequisitos: false,
        Multiclase_restringida: false,
        Grupo_edad_inicial: 1,
        Clase_pnj: false,
        Alineamiento_deidad: false,
        Progresion_obligatoria: true,
        Sin_penalizacion_multiclase: true,
        Mutacion: { ...tabla.mutacion },
        Alineamiento: { Id: 2, Basico: null, Ley: { Id_ley: 10, Nombre: 'Ninguna preferencia' }, Moral: { Id_moral: 10, Nombre: 'Ninguna preferencia' }, Prioridad: null },
        Oficial: true,
        Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Habilidades: { Base: [], Custom: [], Por_alineamiento: [] },
        Idiomas: [],
        Idiomas_adicionales: [],
        Desglose_niveles: Array.from({ length: niveles }, (_, i) => {
            const nivel = i + 1;
            armadura = tabla.armaduraNatural[nivel] ?? armadura;
            return {
                Nivel: nivel,
                Ataque_base: signo(tabla.ataque[i]),
                Salvaciones: { Fortaleza: signo(tabla.fortRef[i]), Reflejos: signo(tabla.fortRef[i]), Voluntad: signo(tabla.voluntad[i]) },
                nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dg: tabla.dgs.includes(nivel),
                Dote: tabla.dotes.includes(nivel),
                Armadura_natural: armadura,
                Dotes: [],
                Especiales: [],
            };
        }),
        Moldeado: null,
        Prerrequisitos_flags: {},
        Prerrequisitos: {},
        ...extra,
    };
}

export const ENGENDRO_VAMPIRICO: TablaClaseDeMonstruo = {
    id: 901, nombre: 'Engendro vampírico', mutacion: { Id: 801, Nombre: 'Engendro vampírico' },
    ataque: [0, 0, 1, 1, 1, 1, 2, 2], fortRef: [0, 0, 0, 0, 1, 1, 1, 1], voluntad: [2, 2, 3, 3, 3, 3, 4, 4],
    dgs: [1, 3, 5, 7], dotes: [1, 6], armaduraNatural: { 2: 1, 4: 2, 7: 3 },
};

export const MOHRG: TablaClaseDeMonstruo = {
    id: 902, nombre: 'Mohrg', mutacion: { Id: 802, Nombre: 'Mohrg' },
    ataque: [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7],
    fortRef: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
    voluntad: [2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9],
    dgs: [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20], dotes: [1, 4, 8, 13, 17],
    armaduraNatural: { 3: 1, 5: 2, 7: 3, 9: 4, 11: 5, 13: 6, 15: 7, 17: 8, 19: 9 },
};

export const MOMIA: TablaClaseDeMonstruo = {
    id: 903, nombre: 'Momia', mutacion: { Id: 803, Nombre: 'Momia' },
    ataque: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4], fortRef: [0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
    voluntad: [2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6],
    dgs: [1, 2, 4, 6, 8, 10, 12, 13], dotes: [1, 4, 10], armaduraNatural: { 1: 2, 3: 4, 5: 5, 7: 6, 9: 8, 11: 9, 13: 10 },
};

export const NECROFAGO: TablaClaseDeMonstruo = {
    id: 904, nombre: 'Necrófago', mutacion: { Id: 804, Nombre: 'Necrófago' },
    ataque: [0, 0, 1, 1, 1, 2, 2, 2], fortRef: [0, 0, 0, 0, 0, 1, 1, 1], voluntad: [2, 2, 3, 3, 3, 3, 3, 4],
    dgs: [1, 3, 6, 8], dotes: [1, 6], armaduraNatural: { 1: 1, 3: 2, 6: 3, 8: 4 },
};

export const TUMULARIO: TablaClaseDeMonstruo = {
    id: 905, nombre: 'Tumulario', mutacion: { Id: 805, Nombre: 'Tumulario' },
    ataque: [0, 0, 1, 1, 1, 1, 2, 2], fortRef: [0, 0, 0, 0, 1, 1, 1, 1], voluntad: [2, 2, 3, 3, 3, 3, 4, 4],
    dgs: [1, 3, 5, 7], dotes: [1, 5], armaduraNatural: { 2: 1, 4: 2, 6: 3, 8: 4 },
};

/** El tipo muerto viviente de `rol_dev` (`tc` de una raza: d12, sin Constitución). */
export const TIPO_MUERTO_VIVIENTE_API: Record<string, any> = {
    Id: 13, Nombre: 'Muerto viviente', Descripcion: '', Manual: 'Manual de monstruos 1, Página: 317',
    Id_tipo_dado: 6, Tipo_dado: 'd12', Id_ataque: 3, Id_fortaleza: 2, Id_reflejos: 2, Id_voluntad: 1, Id_puntos_habilidad: 2,
    Puntos_habilidad: 4, Come: false, Respira: false, Duerme: false, Recibe_críticos: false, Puede_ser_flanqueado: true,
    Pierde_constitucion: true, Limite_inteligencia: -1, Tesoro: null, Id_alineamiento: 2, Rasgos: [], Oficial: true,
    Tipo_dado_comodin: null,
};

/**
 * Bases de `rol_dev` para los casos del libro: el gnoll (18, con 2 DG raciales) tal cual, y un humano y un enano hechos
 * sobre el mediano (5) con sus cifras del *Manual del jugador* (tamaño Mediano; el humano, su dote y sus puntos extra; el
 * enano, Con +2, Car −2 y 20 pies).
 */
export function baseApi(nombre: 'gnoll' | 'humano' | 'enano'): Record<string, any> {
    if (nombre === 'gnoll')
        return JSON.parse(JSON.stringify(RAZAS_API['18']));
    const mediano = JSON.parse(JSON.stringify(RAZAS_API['5']));
    const tamanoMediano = JSON.parse(JSON.stringify(RAZAS_API['18'].t));
    if (nombre === 'humano')
        return {
            ...mediano, i: 1, n: 'Humano', t: tamanoMediano, co: 30, c: 'Cualquiera', Id_clase_predilecta: 0, Clase_predilecta_comodin: 'cualquiera',
            m: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1,
        };
    return {
        ...mediano, i: 2, n: 'Enano', t: tamanoMediano, co: 20, c: 'Guerrero',
        m: { Fuerza: 0, Destreza: 0, Constitucion: 2, Inteligencia: 0, Sabiduria: 0, Carisma: -2 },
    };
}

/**
 * La raza mutada de una clase sobre una base, como la combinaría la API (`GET /razas/{id}/sobre/{idBase}`): la identidad de
 * la mutada, el tipo muerto viviente, los ajustes sumados y lo demás de la base (*Libris Mortis*, págs. 34-36; estudio,
 * 2.7 y 3.7). `cambios` pisa lo que haga falta (la velocidad de la momia, una armadura natural de la base…).
 */
export function razaDeMonstruoSobreApi(
    tabla: TablaClaseDeMonstruo,
    base: Record<string, any>,
    ajustes: Partial<Record<'Fuerza' | 'Destreza' | 'Inteligencia' | 'Sabiduria' | 'Carisma', number>>,
    cambios: Record<string, any> = {},
): Record<string, any> {
    const m = { ...base['m'] };
    Object.entries(ajustes).forEach(([clave, valor]) => m[clave] = (m[clave] ?? 0) + (valor ?? 0));
    return {
        ...base,
        i: tabla.mutacion.Id,
        n: tabla.mutacion.Nombre,
        Mutada: true,
        tc: { ...TIPO_MUERTO_VIVIENTE_API },
        m,
        ...cambios,
    };
}
