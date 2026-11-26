/**
 * El familiar, de los datos (roadmap `ACTIVO_sesiones-y-subida-de-nivel`, «El compañero animal y el familiar, de los
 * datos», segunda tanda; contrato en `docs/publica/endpoints/catalogos.md`, «El familiar, de los datos»), como lo dan la
 * API y sus cachés tras `scripts/sql/familiar_datos.sql` del backend (rama `mascotas/familiar`): `GET /familiares/progresion`,
 * el `Mascota` de la tabla de cada clase (el filo aojador, −3 y la lista del hechicero) y las filas de `Niveles_clase`. Los
 * ids, los de las pruebas del backend (`tests/test_familiar.py`); lo demás, recortado a lo que leen las reglas.
 */
/* eslint-disable */
import { Clase } from 'src/app/interfaces/clase';
import { MonstruoDetalle, MonstruoNivelClase } from 'src/app/interfaces/monstruo';

export const HECHICERO = 8;
export const MAGO = 9;
export const FILO_AOJADOR = 32;
export const CONVOCAR_A_UN_FAMILIAR = 47;
export const CONVOCAR_FAMILIAR = 248;
export const GATO = 11;
export const PERRO_INTERMITENTE = 40;
export const DRAGON_NEGRO = 22;
export const BASICA = 1;
export const DRACONICO = 2;
export const CELESTIAL = 3;
export const MEJORADO = 5;
export const ALERTA = 17;
export const DRAGON_FAMILIAR = 44;
export const FAMILIAR_MEJORADO = 48;
export const COMPARTIR = 81;
export const EVASION_MEJORADA = 57;
export const VINCULO = 82;
export const TRANSMITIR = 83;
export const CON_SU_AMO = 84;
export const CON_ANIMALES = 85;
export const RC = 86;
export const ESCUDRINAR = 87;
export const TABLA_MJ = 1;
export const TABLA_DRACONICA = 2;
export const NOTA_ALERTA = 'Solo mientras el familiar esté al alcance de la mano del amo.';

function aptitud(id: number, nivel: number, especial: [number, string] | null, destinatario: string, dote: [number, string] | null = null, nota: string | null = null) {
    return {
        Id: id, Nivel: nivel,
        Especial: especial ? { Id: especial[0], Nombre: especial[1] } : null,
        Dote: dote ? { Id: dote[0], Nombre: dote[1] } : null,
        Destinatario: destinatario, Nota: nota,
    };
}

const DE_NIVEL_1 = (base: number) => [
    aptitud(base, 1, null, 'amo', [ALERTA, 'Alerta'], NOTA_ALERTA),
    aptitud(base + 1, 1, [COMPARTIR, 'Compartir conjuros (Familiar)'], 'ambos'),
    aptitud(base + 2, 1, [EVASION_MEJORADA, 'Evasión mejorada'], 'mascota'),
    aptitud(base + 3, 1, [VINCULO, 'Vínculo de empatía'], 'ambos'),
];

/** `GET /familiares/progresion` (Manual del jugador, pág. 45; Draconomicon, pág. 141; Guía del DM, pág. 200). */
export const PROGRESION_FAMILIAR_API = {
    Tablas: [
        {
            Id: TABLA_MJ, Nombre: 'Manual del jugador', Por_defecto: true,
            Bonos: [[1, 1, 6, null], [3, 2, 7, null], [5, 3, 8, null], [7, 4, 9, null], [9, 5, 10, null], [11, 6, 11, 5],
                [13, 7, 12, 5], [15, 8, 13, 5], [17, 9, 14, 5], [19, 10, 15, 5]]
                .map(([Nivel, Armadura_natural, Inteligencia, Rc_sobre_nivel]) => ({ Nivel, Armadura_natural, Inteligencia, Rc_sobre_nivel })),
            Aptitudes: [
                ...DE_NIVEL_1(1),
                aptitud(5, 3, [TRANSMITIR, 'Transmitir conjuros de toque'], 'mascota'),
                aptitud(6, 5, [CON_SU_AMO, 'Comunicarse con su amo'], 'ambos'),
                aptitud(7, 7, [CON_ANIMALES, 'Comunicarse con animales de su mismo tipo'], 'mascota'),
                aptitud(8, 11, [RC, 'Resistencia a conjuros'], 'mascota'),
                aptitud(9, 13, [ESCUDRINAR, 'Escudriñar por medio del familiar'], 'amo'),
            ],
        },
        {
            Id: TABLA_DRACONICA, Nombre: 'Dracónico', Por_defecto: false,
            Bonos: [[1, 1, null, null], [9, 2, null, null], [13, 3, null, 5], [17, 4, null, 5]]
                .map(([Nivel, Armadura_natural, Inteligencia, Rc_sobre_nivel]) => ({ Nivel, Armadura_natural, Inteligencia, Rc_sobre_nivel })),
            Aptitudes: [
                ...DE_NIVEL_1(10),
                aptitud(14, 9, [TRANSMITIR, 'Transmitir conjuros de toque'], 'mascota'),
                aptitud(15, 13, [RC, 'Resistencia a conjuros'], 'mascota'),
                aptitud(16, 17, [ESCUDRINAR, 'Escudriñar por medio del familiar'], 'amo'),
            ],
        },
    ],
    Plantillas: [
        { Id: BASICA, Nombre: 'Básica', Tabla: { Id: TABLA_MJ, Nombre: 'Manual del jugador' }, Pg_ataque_mayores: false, Sin_aptitudes: [] },
        { Id: DRACONICO, Nombre: 'Dracónico', Tabla: { Id: TABLA_DRACONICA, Nombre: 'Dracónico' }, Pg_ataque_mayores: true, Sin_aptitudes: [] },
        { Id: CELESTIAL, Nombre: 'Celestial', Tabla: { Id: TABLA_MJ, Nombre: 'Manual del jugador' }, Pg_ataque_mayores: true, Sin_aptitudes: [] },
        { Id: MEJORADO, Nombre: 'Mejorado', Tabla: { Id: TABLA_MJ, Nombre: 'Manual del jugador' }, Pg_ataque_mayores: false, Sin_aptitudes: [7] },
    ],
};

const LISTA_HECHICERO = { Id: HECHICERO, Nombre: 'Hechicero' };

/** La aptitud que da el familiar en la tabla de una clase, con su `Mascota` (sin él, cuenta su nivel y elige de su lista). */
function especialNivel(nivel: number, idEspecial: number, nombre: string, mascota: { Divisor: number; Ajuste: number; Lista: { Id: number; Nombre: string; }; } | null) {
    return {
        Especial: { Id: idEspecial, Nombre: nombre, Otorga_familiar: true },
        Nivel: nivel, Id_extra: null, Extra: '', Opcional: 0, Id_interno: 2000 + idEspecial * 10 + nivel,
        Id_especial_requerido: 0, Id_dote_requerida: 0, Mascota: mascota,
    };
}

function clase(id: number, nombre: string, niveles: Record<number, any[]>): Clase {
    return {
        Id: id,
        Nombre: nombre,
        Desglose_niveles: Object.keys(niveles).map((nivel) => ({ Nivel: Number(nivel), Dotes: [], Especiales: niveles[Number(nivel)] })),
    } as unknown as Clase;
}

/** Las clases que dan el familiar (MJ, págs. 44 y 56; El combatiente completo, pág. 7). */
export const CLASES_CON_FAMILIAR: Clase[] = [
    clase(HECHICERO, 'Hechicero', { 1: [especialNivel(1, CONVOCAR_A_UN_FAMILIAR, 'Convocar a un familiar', { Divisor: 1, Ajuste: 0, Lista: LISTA_HECHICERO })] }),
    clase(MAGO, 'Mago', { 1: [especialNivel(1, CONVOCAR_A_UN_FAMILIAR, 'Convocar a un familiar', null)] }),
    clase(FILO_AOJADOR, 'Filo aojador', { 4: [especialNivel(4, CONVOCAR_FAMILIAR, 'Convocar familiar', { Divisor: 1, Ajuste: -3, Lista: LISTA_HECHICERO })] }),
];

const NOMBRES_PLANTILLA: Record<number, string> = { [BASICA]: 'Básica', [DRACONICO]: 'Dracónico', [CELESTIAL]: 'Celestial', [MEJORADO]: 'Mejorado' };
const NOMBRES_DOTE: Record<number, string> = { [DRAGON_FAMILIAR]: 'Dragón familiar', [FAMILIAR_MEJORADO]: 'Familiar mejorado' };

function fila(idClase: number, nivel: number, plantilla: number, dote = 0, ataqueBaseMinimo: number | null = null): MonstruoNivelClase {
    return {
        Clase: { Id: idClase, Nombre: idClase === MAGO ? 'Mago' : 'Hechicero' },
        Nivel: nivel,
        Ajuste: 0,
        Ataque_base_minimo: ataqueBaseMinimo,
        Plantilla: { Id: plantilla, Nombre: NOMBRES_PLANTILLA[plantilla] ?? '' },
        Preferencia_legal: { Id: 0, Nombre: '' },
        Preferencia_moral: { Id: 0, Nombre: '' },
        Dote: { Id: dote, Nombre: NOMBRES_DOTE[dote] ?? '' },
        Mascota: 'familiar',
        Especial: null,
    };
}

function monstruo(id: number, nombre: string, datos: { dg: string; dado: string; con: number; int: number; an: number; ataque: number; }, filas: MonstruoNivelClase[]): MonstruoDetalle {
    return {
        Id: id, Nombre: nombre, Familiar: true, Companero: false, Oficial: true,
        Manual: { Id: 1, Nombre: 'Manual de monstruos', Pagina: 1 },
        Tipo: { Id: 3, Nombre: 'Animal' },
        Dados_golpe: { Cantidad: datos.dg, Tipo_dado: { Id: 3, Nombre: datos.dado }, Suma: 0 },
        Caracteristicas: {
            Fuerza: 3, Fuerza_modificador: -4, Destreza: 15, Destreza_modificador: 2, Constitucion: datos.con,
            Constitucion_modificador: Math.floor((datos.con - 10) / 2), Inteligencia: datos.int,
            Inteligencia_modificador: Math.floor((datos.int - 10) / 2), Sabiduria: 12, Sabiduria_modificador: 1, Carisma: 7, Carisma_modificador: -2,
        },
        Defensa: { Ca: 14, Toque: 14, Desprevenido: 12, Armadura_natural: datos.an, Reduccion_dano: '', Resistencia_conjuros: '', Resistencia_elemental: '' },
        Ataque: { Ataque_base: datos.ataque, Presa: 0, Ataques: '', Ataque_completo: '' },
        Salvaciones: { Fortaleza: 2, Reflejos: 4, Voluntad: 1 },
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        Niveles_clase: filas,
        Habilidades: [], Dotes: [], Especiales: [],
    } as unknown as MonstruoDetalle;
}

/**
 * Las criaturas de la lista del hechicero y del mago (`Niveles_clase`): el gato, básico (½ DG); el perro intermitente,
 * mejorado a 5 con Familiar mejorado y un ataque base de +5 (*El combatiente completo*, pág. 99; Int 10; 4d8 con Con 12:
 * 22 PG); la cría de dragón negro, dracónica a 8 con Dragón
 * familiar (4d12 con Con 13: 30 PG, ataque +4).
 */
export const MONSTRUOS_FAMILIAR: MonstruoDetalle[] = [
    monstruo(GATO, 'Gato', { dg: '1/2', dado: 'd8', con: 10, int: 2, an: 0, ataque: 0 }, [fila(HECHICERO, 0, BASICA), fila(MAGO, 0, BASICA)]),
    monstruo(PERRO_INTERMITENTE, 'Perro intermitente', { dg: '4', dado: 'd8', con: 12, int: 10, an: 3, ataque: 4 }, [
        fila(HECHICERO, 5, MEJORADO, FAMILIAR_MEJORADO, 5), fila(MAGO, 5, MEJORADO, FAMILIAR_MEJORADO, 5),
    ]),
    monstruo(DRAGON_NEGRO, 'Dragón negro (Cría)', { dg: '4', dado: 'd12', con: 13, int: 8, an: 0, ataque: 4 }, [
        fila(HECHICERO, 8, DRACONICO, DRAGON_FAMILIAR), fila(MAGO, 8, DRACONICO, DRAGON_FAMILIAR),
    ]),
];
