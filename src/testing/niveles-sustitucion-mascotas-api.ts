/**
 * Las mascotas de los niveles de sustitución (R8, tanda 1b; contrato en `docs/publica/endpoints/catalogos.md`, «Las mascotas
 * de los niveles de sustitución»), como las dan la API y sus cachés tras `scripts/sql/niveles_sustitucion_tanda_1b_datos.sql`
 * del backend (rama `sustitucion/tanda-1b`): el explorador kóbold y su comadreja terrible (lista propia), el explorador elfo
 * y su sabueso élfico, el explorador gnomo y sus excavadores (+3) y el hechicero raptorán y su familiar elemental (lista
 * propia, con `Pg_mayores`). Los ids de las clases y las aptitudes estándar, los de las pruebas del backend
 * (`tests/test_niveles_sustitucion_mascotas.py`); los demás, inventados. Recortado a lo que leen las reglas.
 */
/* eslint-disable */
import { Clase } from 'src/app/interfaces/clase';
import { MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';

export const DRUIDA = 5;
export const EXPLORADOR = 6;
export const HECHICERO = 8;
export const COMPANERO_ANIMAL = 29;
export const CONVOCAR_A_UN_FAMILIAR = 47;
export const COMADREJA_APTITUD = 900;
export const SABUESO_APTITUD = 901;
export const FAMILIAR_ELEMENTAL_APTITUD = 902;
export const EXCAVADOR_APTITUD = 903;
export const KOBOLD_4 = 50;
export const ELFO_4 = 51;
export const RAPTORAN_1 = 52;
export const GNOMO_4 = 53;
export const LOBO = 48;
export const TEJON = 55;
export const COMADREJA_TERRIBLE = 1001;
export const SABUESO_ELFICO = 1002;
export const TEJON_TERRIBLE = 1003;
export const ELEMENTAL_AIRE_PEQUENO = 1004;
export const GATO = 11;
export const BASICA = 1;
export const FAMILIAR_ELEMENTAL = 6;

const LISTA_DRUIDA = { Id: DRUIDA, Nombre: 'Druida' };
const LISTA_HECHICERO = { Id: HECHICERO, Nombre: 'Hechicero' };

function aptitud(nivel: number, id: number, nombre: string, otorga: 'Otorga_companero' | 'Otorga_familiar' | null,
    mascota: { Divisor: number; Ajuste: number; Lista: { Id: number; Nombre: string; }; Solo_lista_propia: boolean; } | null) {
    return {
        Especial: { Id: id, Nombre: nombre, ...(otorga ? { [otorga]: true } : {}) },
        Nivel: nivel, Id_extra: null, Extra: '', Opcional: 0, Id_interno: 3000 + id * 10 + nivel,
        Id_especial_requerido: 0, Id_dote_requerida: 0, Mascota: mascota,
        Por_nivel_del_juego: false, Extra_del_juego: false,
    };
}

function quitaDe(idEspecial: number, nombre: string, alcance: 'nivel' | 'desde') {
    return {
        Tipo: 'especial', Elemento: { Id: idEspecial, Nombre: nombre }, Id_extra: null, Extra: null, Nivel_conjuro: null,
        Cantidad: null, Alcance: alcance, Aplaza_a_nivel: null, Sustituto: null,
    };
}

function juego(id: number, nombre: string, clase: { Id: number; Nombre: string; }, niveles: Array<{ Id: number; Nivel: number; Especiales: any[]; Quita: any[]; }>) {
    return {
        Id: id, Nombre: nombre, Nombre_original: null, Traducido: true, Familia: 'racial', Titulo: nombre, Clase: clase,
        Tipo_dado: null, Puntos_habilidad: null, Retroactivo: false, Descripcion: '', Manual: { Id: 1, Nombre: 'Razas', Pagina: 1 },
        Oficial: true, Prerrequisitos: [], Habilidades: [],
        Niveles: niveles.map((n) => ({ ...n, Ajustes: { Ataque_base: 0, Fortaleza: 0, Reflejos: 0, Voluntad: 0 }, Descripcion: '', Dotes: [], Conjuros: [] })),
    };
}

function clase(id: number, nombre: string, niveles: Record<number, any[]>, sustituciones: any[] = []): Clase {
    return {
        Id: id,
        Nombre: nombre,
        Desglose_niveles: Array.from({ length: 20 }, (_, i) => i + 1).map((nivel) => ({
            Nivel: nivel, Ataque_base: `+${nivel}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
            Conjuros_diarios: {}, Conjuros_conocidos_nivel_a_nivel: {}, Conjuros_conocidos_total: 0,
            Dotes: [], Especiales: niveles[nivel] ?? [],
        })),
        Sustituciones: sustituciones,
    } as unknown as Clase;
}

const MASCOTA_DEL_EXPLORADOR = { Divisor: 2, Ajuste: 0, Lista: LISTA_DRUIDA, Solo_lista_propia: false };
const MASCOTA_DEL_HECHICERO = { Divisor: 1, Ajuste: 0, Lista: LISTA_HECHICERO, Solo_lista_propia: false };

/** El druida, el explorador con sus juegos kóbold, elfo y gnomo de 4.º, y el hechicero con el suyo raptorán de 1.º. */
export const CLASES_SUSTITUCION_MASCOTAS: Clase[] = [
    clase(DRUIDA, 'Druida', { 1: [aptitud(1, COMPANERO_ANIMAL, 'Compañero animal', 'Otorga_companero', { ...MASCOTA_DEL_EXPLORADOR, Divisor: 1 })] }),
    clase(EXPLORADOR, 'Explorador', { 4: [aptitud(4, COMPANERO_ANIMAL, 'Compañero animal', 'Otorga_companero', MASCOTA_DEL_EXPLORADOR)] }, [
        juego(30, 'Explorador kóbold', { Id: EXPLORADOR, Nombre: 'Explorador' }, [{
            Id: KOBOLD_4, Nivel: 4,
            Especiales: [aptitud(4, COMADREJA_APTITUD, 'Compañero comadreja terrible', 'Otorga_companero', { ...MASCOTA_DEL_EXPLORADOR, Solo_lista_propia: true })],
            Quita: [quitaDe(COMPANERO_ANIMAL, 'Compañero animal', 'nivel')],
        }]),
        juego(31, 'Explorador elfo', { Id: EXPLORADOR, Nombre: 'Explorador' }, [{
            Id: ELFO_4, Nivel: 4, Especiales: [aptitud(4, SABUESO_APTITUD, 'Compañero sabueso élfico', null, null)], Quita: [],
        }]),
        juego(32, 'Explorador gnomo', { Id: EXPLORADOR, Nombre: 'Explorador' }, [{
            Id: GNOMO_4, Nivel: 4, Especiales: [aptitud(4, EXCAVADOR_APTITUD, 'Compañero animal excavador', null, null)], Quita: [],
        }]),
    ]),
    clase(HECHICERO, 'Hechicero', { 1: [aptitud(1, CONVOCAR_A_UN_FAMILIAR, 'Convocar a un familiar', 'Otorga_familiar', MASCOTA_DEL_HECHICERO)] }, [
        juego(33, 'Hechicero raptorán', { Id: HECHICERO, Nombre: 'Hechicero' }, [{
            Id: RAPTORAN_1, Nivel: 1,
            Especiales: [aptitud(1, FAMILIAR_ELEMENTAL_APTITUD, 'Familiar elemental', 'Otorga_familiar', { ...MASCOTA_DEL_HECHICERO, Solo_lista_propia: true })],
            Quita: [quitaDe(CONVOCAR_A_UN_FAMILIAR, 'Convocar a un familiar', 'desde')],
        }]),
    ]),
];

function fila(lista: { Id: number; Nombre: string; }, nivel: number, ajuste: number, mascota: 'companero' | 'familiar',
    especial: { Id: number; Nombre: string; } | null = null, plantilla = 0): MonstruoNivelClase {
    return {
        Clase: lista, Nivel: nivel, Ajuste: ajuste, Ataque_base_minimo: null,
        Plantilla: { Id: plantilla, Nombre: plantilla === FAMILIAR_ELEMENTAL ? 'Familiar elemental' : plantilla === BASICA ? 'Básica' : 'No aplica' },
        Preferencia_legal: { Id: 0, Nombre: '' }, Preferencia_moral: { Id: 0, Nombre: '' }, Dote: { Id: 0, Nombre: '' },
        Mascota: mascota, Especial: especial,
    };
}

function monstruo(id: number, nombre: string, filas: MonstruoNivelClase[], datos: { familiar?: boolean; dg?: string; con?: number; ataque?: number; } = {}): MonstruoDetalle {
    return {
        Id: id, Nombre: nombre, Companero: !datos.familiar, Familiar: !!datos.familiar, Oficial: true,
        Manual: { Id: 1, Nombre: 'Manual de monstruos 1', Pagina: 1 },
        Tipo: { Id: 3, Nombre: 'Animal' },
        Dados_golpe: { Cantidad: datos.dg ?? '2', Tipo_dado: { Id: 3, Nombre: 'd8' }, Suma: 0 },
        Caracteristicas: { Fuerza: 10, Destreza: 15, Constitucion: datos.con ?? 12, Constitucion_modificador: Math.floor(((datos.con ?? 12) - 10) / 2), Inteligencia: 4, Sabiduria: 12, Carisma: 6 },
        Defensa: { Ca: 14, Toque: 12, Desprevenido: 12, Armadura_natural: 1, Reduccion_dano: '', Resistencia_conjuros: '', Resistencia_elemental: '' },
        Ataque: { Ataque_base: datos.ataque ?? 1, Presa: 0, Ataques: '', Ataque_completo: '' },
        Salvaciones: { Fortaleza: 2, Reflejos: 4, Voluntad: 1 },
        Armas_naturales: [],
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        Niveles_clase: filas,
        Habilidades: [], Dotes: [], Especiales: [],
    } as unknown as MonstruoDetalle;
}

const COMADREJA = { Id: COMADREJA_APTITUD, Nombre: 'Compañero comadreja terrible' };
const SABUESO = { Id: SABUESO_APTITUD, Nombre: 'Compañero sabueso élfico' };
const EXCAVADOR = { Id: EXCAVADOR_APTITUD, Nombre: 'Compañero animal excavador' };
const ELEMENTAL = { Id: FAMILIAR_ELEMENTAL_APTITUD, Nombre: 'Familiar elemental' };

/**
 * Las criaturas: el lobo, básico del druida; la comadreja terrible, de 4.º del druida (−3) y la del kóbold (1, 0); el
 * sabueso élfico, solo del elfo (1, 0); el tejón, básico y del gnomo (+3); el tejón terrible, de 4.º del druida y del gnomo
 * (1, 0); el elemental de aire Pequeño (4 DG d8 con Con 14: 26 PG; ataque +3), solo del raptorán, con la pseudoplantilla
 * «Familiar elemental»; y el gato, básico del hechicero.
 */
export const MONSTRUOS_SUSTITUCION_MASCOTAS: MonstruoDetalle[] = [
    monstruo(LOBO, 'Lobo', [fila(LISTA_DRUIDA, 1, 0, 'companero')]),
    monstruo(COMADREJA_TERRIBLE, 'Comadreja terrible', [fila(LISTA_DRUIDA, 4, -3, 'companero'), fila(LISTA_DRUIDA, 1, 0, 'companero', COMADREJA)]),
    monstruo(SABUESO_ELFICO, 'Sabueso élfico', [fila(LISTA_DRUIDA, 1, 0, 'companero', SABUESO)]),
    monstruo(TEJON, 'Tejón', [fila(LISTA_DRUIDA, 1, 0, 'companero'), fila(LISTA_DRUIDA, 1, 3, 'companero', EXCAVADOR)]),
    monstruo(TEJON_TERRIBLE, 'Tejón terrible', [fila(LISTA_DRUIDA, 4, -3, 'companero'), fila(LISTA_DRUIDA, 1, 0, 'companero', EXCAVADOR)]),
    monstruo(ELEMENTAL_AIRE_PEQUENO, 'Elemental de aire Pequeño', [fila(LISTA_HECHICERO, 1, 0, 'familiar', ELEMENTAL, FAMILIAR_ELEMENTAL)],
        { familiar: true, dg: '4', con: 14, ataque: 3 }),
    monstruo(GATO, 'Gato', [fila(LISTA_HECHICERO, 0, 0, 'familiar', null, BASICA)], { familiar: true, dg: '1/2', con: 10, ataque: 0 }),
];

/** La pseudoplantilla «Familiar elemental» de `GET /familiares/progresion` (caché `familiares_progresion` 3). */
export const PLANTILLA_FAMILIAR_ELEMENTAL_API = {
    Id: FAMILIAR_ELEMENTAL, Nombre: 'Familiar elemental', Tabla: { Id: 1, Nombre: 'Manual del jugador' },
    Pg_ataque_mayores: false, Pg_mayores: true, Sin_aptitudes: [7],
};

/**
 * Un personaje con esas clases y esos niveles de sustitución (`Niveles_sustitucion` de su desglose, como la ficha:
 * `[nivelClase, idNivelSustitucion]`).
 */
export function personajeConSustituciones(clases: Array<[string, number, Array<[number, number]>?]>, ataqueBase = '+4'): Personaje {
    return {
        desgloseClases: clases.map(([Nombre, Nivel, tomados]) => ({
            Nombre, Nivel,
            ...(tomados?.length ? { Niveles_sustitucion: tomados.map(([nivelClase, id]) => ({ nivelClase, id, sustitucion: { id: 0, nombre: '' } })) } : {}),
        })),
        Claseas: [], Companeros: [], Familiares: [], Ataque_base: ataqueBase,
    } as unknown as Personaje;
}
