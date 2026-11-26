/**
 * El compañero animal, de los datos (roadmap `ACTIVO_sesiones-y-subida-de-nivel`, «El compañero animal y el familiar, de
 * los datos»; contrato en `docs/publica/endpoints/catalogos.md`), como lo dan la API y sus cachés tras
 * `scripts/sql/companero_animal_datos.sql` del backend (rama `mascotas/companero`): `GET /companeros/progresion`, el
 * `Mascota` de la tabla de cada clase y las filas de `Niveles_clase` con su `Ajuste`. Los ids, los de las pruebas del
 * backend (`tests/test_companero_animal.py`); lo demás, recortado a lo que leen las reglas.
 */
/* eslint-disable */
import { Clase } from 'src/app/interfaces/clase';
import { Dote } from 'src/app/interfaces/dote';
import { MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';

export const DRUIDA = 5;
export const EXPLORADOR = 6;
export const SENOR_DE_LAS_BESTIAS = 378;
export const PIRATA = 412;
export const COMPANERO_ANIMAL = 29;
export const MEJOR_AMIGO_DEL_PIRATA = 2679;
export const PELEA_SUCIA = 2680;
export const COMPARTIR_CONJUROS = 157;
export const VINCULO = 158;
export const EVASION = 43;
export const DEVOCION = 159;
export const EVASION_MEJORADA = 57;
export const SEGUNDO_ATAQUE_NATURAL = 900;
export const ATAQUE_MULTIPLE = 49;
export const COMPANERO_ELEVADO = 53;
export const COMPANERO_ARANA = 3101;
export const COMPANERO_SABANDIJA = 3102;
export const LOBO = 48;
export const TEJON = 55;
export const BISONTE = 56;
export const ARANA_PEQUENA = 3201;
export const ESCORPION_PEQUENO = 3202;
export const CELESTIAL = 3;
/** La lista del hechicero (la de las filas de familiar de la araña y del escorpión). */
export const HECHICERO = 8;

/** `GET /companeros/progresion` (Manual del jugador, pág. 36). */
export const PROGRESION_API = {
    Bonos: [
        { Nivel: 1, Dg_adicionales: 0, Armadura_natural: 0, Fuerza_destreza: 0, Trucos_adicionales: 1 },
        { Nivel: 3, Dg_adicionales: 2, Armadura_natural: 2, Fuerza_destreza: 1, Trucos_adicionales: 2 },
        { Nivel: 6, Dg_adicionales: 4, Armadura_natural: 4, Fuerza_destreza: 2, Trucos_adicionales: 3 },
        { Nivel: 9, Dg_adicionales: 6, Armadura_natural: 6, Fuerza_destreza: 3, Trucos_adicionales: 4 },
        { Nivel: 12, Dg_adicionales: 8, Armadura_natural: 8, Fuerza_destreza: 4, Trucos_adicionales: 5 },
        { Nivel: 15, Dg_adicionales: 10, Armadura_natural: 10, Fuerza_destreza: 5, Trucos_adicionales: 6 },
        { Nivel: 18, Dg_adicionales: 12, Armadura_natural: 12, Fuerza_destreza: 6, Trucos_adicionales: 7 },
    ],
    Aptitudes: [
        { Id: 1, Nivel: 1, Especial: { Id: COMPARTIR_CONJUROS, Nombre: 'Compartir conjuros (Compañero animal)' }, Dote: null, Destinatario: 'amo', Alternativa: null },
        { Id: 2, Nivel: 1, Especial: { Id: VINCULO, Nombre: 'Vínculo' }, Dote: null, Destinatario: 'amo', Alternativa: null },
        { Id: 3, Nivel: 3, Especial: { Id: EVASION, Nombre: 'Evasión' }, Dote: null, Destinatario: 'mascota', Alternativa: null },
        { Id: 4, Nivel: 6, Especial: { Id: DEVOCION, Nombre: 'Devoción' }, Dote: null, Destinatario: 'mascota', Alternativa: null },
        { Id: 6, Nivel: 9, Especial: null, Dote: { Id: ATAQUE_MULTIPLE, Nombre: 'Ataque múltiple' }, Destinatario: 'mascota', Alternativa: { Id: SEGUNDO_ATAQUE_NATURAL, Nombre: 'Segundo ataque natural' } },
        { Id: 5, Nivel: 15, Especial: { Id: EVASION_MEJORADA, Nombre: 'Evasión mejorada' }, Dote: null, Destinatario: 'mascota', Alternativa: null },
    ],
};

/** Ataque múltiple con su prerrequisito de tres armas naturales (Manual de monstruos 1, pág. 303). */
export const DOTE_ATAQUE_MULTIPLE = {
    Id: ATAQUE_MULTIPLE, Nombre: 'Ataque múltiple', Descripcion: '', Beneficio: '', Normal: '', Especial: '',
    Manual: { Id: 0, Nombre: '', Pagina: 0 }, Tipos: [], Repetible: 0, Repetible_distinto_extra: 0, Repetible_comb: 0,
    Comp_arma: 0, Oficial: true, Modificadores: {},
    Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
    Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
    Prerrequisitos: { armas_naturales: [{ Cantidad: 3, Opcional: 0 }] },
} as unknown as Dote;

const LISTA_DRUIDA = { Id: DRUIDA, Nombre: 'Druida' };

/** La aptitud que da el compañero en la tabla de una clase, con su `Mascota`. */
function especialNivel(nivel: number, idEspecial: number, nombre: string, mascota: { Divisor: number; Ajuste: number; }, opcional = 0) {
    return {
        Especial: { Id: idEspecial, Nombre: nombre, Otorga_companero: true },
        Nivel: nivel, Id_extra: null, Extra: '', Opcional: opcional, Id_interno: 1000 + idEspecial * 10 + nivel,
        Id_especial_requerido: 0, Id_dote_requerida: 0,
        Mascota: { ...mascota, Lista: LISTA_DRUIDA },
    };
}

function clase(id: number, nombre: string, niveles: Record<number, any[]>): Clase {
    return {
        Id: id,
        Nombre: nombre,
        Desglose_niveles: Object.keys(niveles).map((nivel) => ({ Nivel: Number(nivel), Dotes: [], Especiales: niveles[Number(nivel)] })),
    } as unknown as Clase;
}

/** Las clases que dan el compañero (su `Mascota`, MJ págs. 35 y 39; El aventurero completo, pág. 78; Rol mapa mundi). */
export const CLASES_CON_COMPANERO: Clase[] = [
    clase(DRUIDA, 'Druida', { 1: [especialNivel(1, COMPANERO_ANIMAL, 'Compañero animal', { Divisor: 1, Ajuste: 0 })] }),
    clase(EXPLORADOR, 'Explorador', { 4: [especialNivel(4, COMPANERO_ANIMAL, 'Compañero animal', { Divisor: 2, Ajuste: 0 })] }),
    clase(SENOR_DE_LAS_BESTIAS, 'Señor de las bestias', { 1: [especialNivel(1, COMPANERO_ANIMAL, 'Compañero animal', { Divisor: 1, Ajuste: 3 })] }),
    clase(PIRATA, 'Pirata', {
        2: [
            especialNivel(2, MEJOR_AMIGO_DEL_PIRATA, 'El mejor amigo del pirata', { Divisor: 2, Ajuste: 0 }, 1),
            { Especial: { Id: PELEA_SUCIA, Nombre: 'Pelea sucia' }, Nivel: 2, Id_extra: null, Extra: '', Opcional: 1, Id_interno: 9999, Id_especial_requerido: 0, Id_dote_requerida: 0, Mascota: null },
        ],
    }),
];

const NOMBRES_DOTE: Record<number, string> = {
    [COMPANERO_ELEVADO]: 'Compañero elevado', [COMPANERO_ARANA]: 'Compañero araña', [COMPANERO_SABANDIJA]: 'Compañero sabandija',
};

function fila(idClase: number, nombreClase: string, nivel: number, ajuste: number, plantilla = 0, dote = 0): MonstruoNivelClase {
    return {
        Clase: { Id: idClase, Nombre: nombreClase },
        Nivel: nivel,
        Ajuste: ajuste,
        Ataque_base_minimo: null,
        Plantilla: { Id: plantilla, Nombre: plantilla === CELESTIAL ? 'Celestial' : 'No aplica' },
        Preferencia_legal: { Id: 0, Nombre: '' },
        Preferencia_moral: { Id: 0, Nombre: '' },
        Dote: { Id: dote, Nombre: NOMBRES_DOTE[dote] ?? '' },
        Mascota: 'companero',
        Especial: null,
    };
}

function monstruo(id: number, nombre: string, fue: number, des: number, an: number, armas: Array<[string, number]>, filas: MonstruoNivelClase[], familiar = false): MonstruoDetalle {
    return {
        Id: id, Nombre: nombre, Companero: true, Familiar: familiar, Oficial: true,
        Manual: { Id: 1, Nombre: 'Manual del jugador 1', Pagina: 1 },
        Tipo: { Id: 3, Nombre: 'Animal' },
        Dados_golpe: { Cantidad: '2', Tipo_dado: { Id: 3, Nombre: 'd8' }, Suma: 4 },
        Caracteristicas: { Fuerza: fue, Destreza: des, Constitucion: 15, Constitucion_modificador: 2, Inteligencia: 2, Sabiduria: 12, Carisma: 6 },
        Defensa: { Ca: 14, Toque: 12, Desprevenido: 12, Armadura_natural: an, Reduccion_dano: '', Resistencia_conjuros: '', Resistencia_elemental: '' },
        Armas_naturales: armas.map(([arma, cantidad], i) => ({ Id_arma_natural: i + 1, Arma_natural: arma, Cantidad: cantidad, Dano: '1d6', Primaria: i === 0, Texto: arma })),
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        Niveles_clase: filas,
        Habilidades: [], Dotes: [], Especiales: [],
    } as unknown as MonstruoDetalle;
}

/**
 * Los animales de la lista del druida (`Niveles_clase`): el lobo (solo el mordisco) y el tejón (mordisco y dos garras),
 * básicos; el lobo celestial de Compañero elevado (al nivel del lobo +1, con −1; LOE pág. 41); el bisonte, de 4.º (−3).
 * Con sus filas del explorador de antes (el nivel doblado), que la web ya no lee.
 */
export const MONSTRUOS_COMPANERO: MonstruoDetalle[] = [
    monstruo(LOBO, 'Lobo', 13, 15, 2, [['Mordisco', 1]], [
        fila(DRUIDA, 'Druida', 1, 0), fila(DRUIDA, 'Druida', 2, -1, CELESTIAL, COMPANERO_ELEVADO), fila(EXPLORADOR, 'Explorador', 2, 0),
    ]),
    monstruo(TEJON, 'Tejón', 8, 17, 1, [['Mordisco', 1], ['Garra', 2]], [fila(DRUIDA, 'Druida', 1, 0), fila(EXPLORADOR, 'Explorador', 2, 0)]),
    monstruo(BISONTE, 'Bisonte', 22, 10, 4, [['Cornada', 1]], [fila(DRUIDA, 'Druida', 4, -3), fila(EXPLORADOR, 'Explorador', 8, 0)]),
];

/**
 * Las filas nuevas del 2026-11-21 (tanda 3a, `scripts/sql/mascotas_listas_datos.sql`; catalogos.md, «El compañero animal,
 * de los datos»): la araña monstruosa pequeña de Compañero araña (druida 1, 0; *Drow of the Underdark*, pág. 52) y la
 * araña y el escorpión monstruosos pequeños de Compañero sabandija (druida 3, 0; *Escenario de campaña de Eberron*, pág.
 * 51), que siguen siendo familiares (su fila de la lista del hechicero, de familiar). Los ids, inventados: las pruebas del
 * backend los buscan por nombre.
 */
export const MONSTRUOS_SABANDIJA: MonstruoDetalle[] = [
    monstruo(ARANA_PEQUENA, 'Araña monstruosa Pequeña', 7, 17, 1, [['Mordisco', 1]], [
        fila(DRUIDA, 'Druida', 1, 0, 0, COMPANERO_ARANA), fila(DRUIDA, 'Druida', 3, 0, 0, COMPANERO_SABANDIJA),
        { ...fila(HECHICERO, 'Hechicero', 3, 0, 5, 48), Plantilla: { Id: 5, Nombre: 'Mejorado' }, Dote: { Id: 48, Nombre: 'Familiar mejorado' }, Mascota: 'familiar' },
    ], true),
    monstruo(ESCORPION_PEQUENO, 'Escorpión monstruoso Pequeño', 9, 10, 4, [['Pinza', 2], ['Aguijón', 1]], [
        fila(DRUIDA, 'Druida', 3, 0, 0, COMPANERO_SABANDIJA),
        { ...fila(HECHICERO, 'Hechicero', 3, 0, 5, 48), Plantilla: { Id: 5, Nombre: 'Mejorado' }, Dote: { Id: 48, Nombre: 'Familiar mejorado' }, Mascota: 'familiar' },
    ], true),
];
