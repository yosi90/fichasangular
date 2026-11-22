import { datoDePreferencia } from 'src/app/services/utils/alineamiento-contrato';
import { TIPOS_DE_MASCOTA } from 'src/app/interfaces/sesiones';
import { Alineamiento } from "src/app/interfaces/alineamiento";
import { Conjuro } from "src/app/interfaces/conjuro";
import { DoteContextual } from "src/app/interfaces/dote-contextual";
import { IdiomaDetalle } from "src/app/interfaces/idioma";
import {
    CompaneroAptitudNivel,
    CompaneroBonosNivel,
    CompaneroMonstruoDetalle,
    CompaneroProgresion,
    DestinatarioAptitudMascota,
    DIETAS_MONSTRUO,
    EspecialContextualMonstruo,
    FamiliarAptitudNivel,
    FamiliarBonosNivel,
    FamiliarMonstruoDetalle,
    FamiliarPlantillaProgresion,
    FamiliarProgresion,
    FamiliarTabla,
    MascotaAptitudNivel,
    MonstruoAlineamientoBasicoRef,
    MonstruoAlineamientosRequeridos,
    MonstruoAtaque,
    MonstruoCaracteristicas,
    MonstruoDadosGolpe,
    MonstruoDefensa,
    MonstruoDetalle,
    MonstruoDieta,
    MonstruoHabilidad,
    MonstruoNivelClase,
    MonstruoPersonajesRelacionados,
    MonstruoSalvaciones,
    MonstruoSortilega,
    MonstruoSubtipoRef,
    MonstruoTipoRef,
    MonstruoTipoDadoRef,
    OrigenTruco,
    PersonajeRefMonstruo,
    TrucoDeMascota,
} from "src/app/interfaces/monstruo";
import { CARACTERISTICAS } from "src/app/interfaces/caracteristica";
import { RacialDetalle } from "src/app/interfaces/racial";
import { Tamano } from "src/app/interfaces/tamaño";
import { normalizeEspecial } from "../especial.service";
import { normalizeIdioma } from "../idioma.service";
import { toDoteContextualArray } from "./dote-mapper";
import { normalizeMovimientos } from "./movimientos-mapper";
import { normalizeRacial } from "./racial-mapper";
import { idNombre, toArray, toBoolean, toInt, toIntOrNull, toNumber, toNumberOrNull, toPositiveInt, toText } from 'src/app/services/utils/normalizacion';
import { normalizeConjuroLegacy } from './conjuro-mapper';
import { normalizeManualLegacy } from './manual-mapper';
import { leerArmasNaturales } from './armas-naturales';

function normalizeDepth(depth: number): number {
    const parsed = Number(depth);
    if (!Number.isFinite(parsed))
        return 0;
    return Math.max(0, Math.trunc(parsed));
}

function normalizeTamano(raw: any): Tamano {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Modificador: toNumber(raw?.Modificador),
        Modificador_presa: toNumber(raw?.Modificador_presa),
    };
}

function normalizeMonstruoTipo(raw: any): MonstruoTipoRef {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Oficial: toBoolean(raw?.Oficial),
    };
}

function normalizeMonstruoTipoDado(raw: any): MonstruoTipoDadoRef {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

function normalizeAlineamiento(raw: any): Alineamiento {
    return {
        Id: toNumber(raw?.Id),
        Basico: {
            Id_basico: toNumber(raw?.Basico?.Id_basico ?? raw?.Basico?.Id),
            Nombre: toText(raw?.Basico?.Nombre),
        },
        Ley: {
            Id_ley: toNumber(raw?.Ley?.Id_ley ?? raw?.Ley?.Id),
            Nombre: toText(raw?.Ley?.Nombre),
            ...datoDePreferencia(raw?.Ley),
        },
        Moral: {
            Id_moral: toNumber(raw?.Moral?.Id_moral ?? raw?.Moral?.Id),
            Nombre: toText(raw?.Moral?.Nombre),
            ...datoDePreferencia(raw?.Moral),
        },
        Prioridad: {
            Id_prioridad: toNumber(raw?.Prioridad?.Id_prioridad ?? raw?.Prioridad?.Id),
            Nombre: toText(raw?.Prioridad?.Nombre),
        },
        Descripcion: toText(raw?.Descripcion),
    };
}

function normalizeAlineamientoBasicoRef(raw: any): MonstruoAlineamientoBasicoRef {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

function normalizeAlineamientosRequeridos(raw: any): MonstruoAlineamientosRequeridos {
    return {
        Familiar: toArray(raw?.Familiar).map((item) => normalizeAlineamientoBasicoRef(item)),
        Companero: toArray(raw?.Companero).map((item) => normalizeAlineamientoBasicoRef(item)),
    };
}

function normalizeDadosGolpe(raw: any): MonstruoDadosGolpe {
    return {
        Cantidad: toText(raw?.Cantidad),
        Tipo_dado: normalizeMonstruoTipoDado(raw?.Tipo_dado),
        Suma: toNumber(raw?.Suma),
    };
}

function normalizeDefensa(raw: any): MonstruoDefensa {
    return {
        Ca: toNumber(raw?.Ca),
        Toque: toNumber(raw?.Toque),
        Desprevenido: toNumber(raw?.Desprevenido),
        Armadura_natural: toNumber(raw?.Armadura_natural),
        Reduccion_dano: toText(raw?.Reduccion_dano),
        Resistencia_conjuros: toText(raw?.Resistencia_conjuros),
        Resistencia_elemental: toText(raw?.Resistencia_elemental),
    };
}

function normalizeAtaque(raw: any): MonstruoAtaque {
    return {
        Ataque_base: toNumber(raw?.Ataque_base),
        Presa: toNumber(raw?.Presa),
        Ataques: toText(raw?.Ataques),
        Ataque_completo: toText(raw?.Ataque_completo),
    };
}

function normalizeSalvaciones(raw: any): MonstruoSalvaciones {
    return {
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
    };
}

function normalizeCaracteristicas(raw: any): MonstruoCaracteristicas {
    const caracteristicas = {} as MonstruoCaracteristicas;
    CARACTERISTICAS.forEach((clave) => {
        caracteristicas[clave] = toNumberOrNull(raw?.[clave]);
        caracteristicas[`${clave}_modificador`] = toNumberOrNull(raw?.[`${clave}_modificador`]);
    });
    return caracteristicas;
}

function normalizeSortilega(raw: any): MonstruoSortilega {
    return {
        Conjuro: normalizeConjuroLegacy(raw?.Conjuro),
        Nivel_lanzador: toNumber(raw?.Nivel_lanzador),
        Usos_diarios: toText(raw?.Usos_diarios),
    };
}

function normalizeHabilidad(raw: any): MonstruoHabilidad {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Descripcion: toText(raw?.Descripcion),
        Soporta_extra: toBoolean(raw?.Soporta_extra),
        Entrenada: toBoolean(raw?.Entrenada),
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Rangos: toNumber(raw?.Rangos),
    };
}


/** `Valor`, `Prohibe` e `Id_prioridad` de una preferencia de la fila, si llegan (sin `Valor`, nada). */
function datoDePreferenciaDeFila(raw: any): { Valor?: number; Prohibe?: boolean; Id_prioridad?: number; } {
    if (raw?.Valor === null || raw?.Valor === undefined)
        return {};
    return { Valor: toInt(raw.Valor), Prohibe: raw?.Prohibe === true, Id_prioridad: toInt(raw?.Id_prioridad) };
}

function normalizeNivelClase(raw: any): MonstruoNivelClase {
    return {
        Clase: {
            Id: toNumber(raw?.Clase?.Id),
            Nombre: toText(raw?.Clase?.Nombre),
        },
        Nivel: toNumber(raw?.Nivel),
        // Sin él (una caché de antes del 2026-11-21), 0: la fila no ajusta la tabla del compañero.
        Ajuste: Math.min(0, toInt(raw?.Ajuste)),
        // Sin él, `null` o menos de 1 (una caché de antes del 2026-11-21), sin mínimo.
        Ataque_base_minimo: toPositiveInt(raw?.Ataque_base_minimo),
        Plantilla: {
            Id: toNumber(raw?.Plantilla?.Id),
            Nombre: toText(raw?.Plantilla?.Nombre),
        },
        // Con lo que pide, si la API lo da (`Valor`, `Prohibe`, `Id_prioridad`: las preferencias como dato).
        Preferencia_legal: {
            Id: toNumber(raw?.Preferencia_legal?.Id),
            Nombre: toText(raw?.Preferencia_legal?.Nombre),
            ...datoDePreferenciaDeFila(raw?.Preferencia_legal),
        },
        Preferencia_moral: {
            Id: toNumber(raw?.Preferencia_moral?.Id),
            Nombre: toText(raw?.Preferencia_moral?.Nombre),
            ...datoDePreferenciaDeFila(raw?.Preferencia_moral),
        },
        Dote: {
            Id: toNumber(raw?.Dote?.Id),
            Nombre: toText(raw?.Dote?.Nombre),
        },
        Mascota: TIPOS_DE_MASCOTA.includes(raw?.Mascota) ? raw.Mascota : null,
        // Lo que la fila le da a la criatura (tanda (g), F21; contrato: personajes.md, «F21: la Inteligencia de su fila»):
        // su Inteligencia (`null`, la de su monstruo) y si sus DG adicionales no le dan habilidades ni dotes.
        Inteligencia: raw?.Inteligencia === null || raw?.Inteligencia === undefined ? null : toInt(raw.Inteligencia),
        Sin_habilidades_dotes: raw?.Sin_habilidades_dotes === true,
    };
}

function normalizeSubtipo(raw: any): MonstruoSubtipoRef {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
    };
}

function normalizeRacialArray(raw: any): RacialDetalle[] {
    return toArray(raw).map((item) => normalizeRacial(item));
}

function normalizeIdiomaArray(raw: any): IdiomaDetalle[] {
    return toArray(raw).map((item) => normalizeIdioma(item));
}

const ORIGENES_TRUCO: readonly OrigenTruco[] = ['adicional', 'monstruo', 'ensenado'];

/**
 * Los trucos de una criatura (contrato: `catalogos.md`, «Los trucos», y `personajes.md`, «Los trucos del compañero»): los
 * de su monstruo llegan sin `Origen` (son `monstruo`); los del compañero de una ficha, con el suyo y su `Orden`.
 */
export function leerTrucosDeMascota(raw: unknown): TrucoDeMascota[] {
    return toArray(raw)
        .map((t: any): TrucoDeMascota => {
            const origen = `${t?.Origen ?? ''}`.trim().toLowerCase() as OrigenTruco;
            const orden = toInt(t?.Orden);
            return {
                Id: toInt(t?.Id),
                Nombre: toText(t?.Nombre),
                Origen: ORIGENES_TRUCO.includes(origen) ? origen : 'monstruo',
                Orden: orden > 0 ? orden : null,
                Coste: Math.max(1, toInt(t?.Coste, 1)),
                Es_fin: toBoolean(t?.Es_fin),
            };
        })
        .filter((t) => t.Id > 0);
}

function normalizeDoteArray(raw: any): DoteContextual[] {
    return toDoteContextualArray(raw);
}

function normalizePersonajeRef(raw: any): PersonajeRefMonstruo {
    return {
        Id_personaje: toNumber(raw?.Id_personaje),
        Nombre: toText(raw?.Nombre),
    };
}

function normalizePersonajesRelacionados(raw: any): MonstruoPersonajesRelacionados {
    return {
        Por_familiar: toArray(raw?.Por_familiar).map((item) => ({
            Id_personaje: toNumber(item?.Id_personaje),
            Nombre: toText(item?.Nombre),
            Id_familiar: toNumber(item?.Id_familiar),
        })),
        Por_companero: toArray(raw?.Por_companero).map((item) => ({
            Id_personaje: toNumber(item?.Id_personaje),
            Nombre: toText(item?.Nombre),
            Id_companero: toNumber(item?.Id_companero),
        })),
    };
}

function normalizeEspecialContextual(raw: any): EspecialContextualMonstruo {
    return {
        Especial: normalizeEspecial(raw?.Especial),
        Contexto: raw?.Contexto && typeof raw.Contexto === "object" ? raw.Contexto : {},
    };
}

function normalizeMonstruoBase(raw: any, depth: number): MonstruoDetalle {
    const depthSafe = normalizeDepth(depth);
    const nestedDepth = depthSafe - 1;

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualLegacy(raw?.Manual),
        Tipo: normalizeMonstruoTipo(raw?.Tipo),
        Tamano: normalizeTamano(raw?.Tamano),
        Dados_golpe: normalizeDadosGolpe(raw?.Dados_golpe),
        Movimientos: normalizeMovimientos(raw?.Movimientos),
        Maniobrabilidad: raw?.Maniobrabilidad ?? {},
        Alineamiento: normalizeAlineamiento(raw?.Alineamiento),
        Iniciativa: toNumber(raw?.Iniciativa),
        Defensa: normalizeDefensa(raw?.Defensa),
        Ataque: normalizeAtaque(raw?.Ataque),
        Espacio: toNumber(raw?.Espacio),
        Alcance: toNumber(raw?.Alcance),
        Salvaciones: normalizeSalvaciones(raw?.Salvaciones),
        Caracteristicas: normalizeCaracteristicas(raw?.Caracteristicas),
        Cd_sortilegas: toText(raw?.Cd_sortilegas),
        Valor_desafio: toText(raw?.Valor_desafio),
        Tesoro: toText(raw?.Tesoro),
        Familiar: toBoolean(raw?.Familiar),
        Companero: toBoolean(raw?.Companero),
        Oficial: toBoolean(raw?.Oficial),
        Dieta: leerDieta(raw?.Dieta),
        Idiomas: normalizeIdiomaArray(raw?.Idiomas),
        Alineamientos_requeridos: normalizeAlineamientosRequeridos(raw?.Alineamientos_requeridos),
        Sortilegas: toArray(raw?.Sortilegas).map((item) => normalizeSortilega(item)),
        Habilidades: toArray(raw?.Habilidades).map((item) => normalizeHabilidad(item)),
        Dotes: normalizeDoteArray(raw?.Dotes),
        Niveles_clase: toArray(raw?.Niveles_clase).map((item) => normalizeNivelClase(item)),
        Subtipos: toArray(raw?.Subtipos).map((item) => normalizeSubtipo(item)),
        Raciales: normalizeRacialArray(raw?.Raciales),
        Ataques_especiales: normalizeRacialArray(raw?.Ataques_especiales),
        Armas_naturales: leerArmasNaturales(raw?.Armas_naturales),
        Trucos: leerTrucosDeMascota(raw?.Trucos),
        Familiares: nestedDepth >= 0
            ? normalizeFamiliarMonstruoDetalleArray(raw?.Familiares, nestedDepth)
            : [],
        Companeros: nestedDepth >= 0
            ? normalizeCompaneroMonstruoDetalleArray(raw?.Companeros, nestedDepth)
            : [],
        Personajes_relacionados: normalizePersonajesRelacionados(raw?.Personajes_relacionados),
    };
}

/**
 * Si es un familiar o un compañero que sale de un monstruo (con su `Id_familiar` o `Id_companero`; lleva el `Id` de su
 * monstruo), y no el monstruo mismo: lo que se modifica es el monstruo.
 */
export function esMonstruoDerivado(monstruo: MonstruoDetalle | null | undefined): boolean {
    const raw = monstruo as Partial<FamiliarMonstruoDetalle & CompaneroMonstruoDetalle> | null | undefined;
    return toNumber(raw?.Id_familiar) > 0 || toNumber(raw?.Id_companero) > 0;
}

export function normalizeMonstruoDetalle(raw: any, depth = 1): MonstruoDetalle {
    return normalizeMonstruoBase(raw, depth);
}

export function normalizeFamiliarMonstruoDetalle(raw: any, depth = 1): FamiliarMonstruoDetalle {
    const base = normalizeMonstruoBase(raw, depth);
    return {
        ...base,
        Monstruo_origen: {
            Id: toNumber(raw?.Monstruo_origen?.Id),
            Nombre: toText(raw?.Monstruo_origen?.Nombre),
        },
        Id_familiar: toNumber(raw?.Id_familiar),
        Vida: toNumber(raw?.Vida),
        Plantilla: {
            Id: toNumber(raw?.Plantilla?.Id),
            Nombre: toText(raw?.Plantilla?.Nombre),
        },
        Especiales: toArray(raw?.Especiales).map((item) => normalizeEspecialContextual(item)),
        Personajes: toArray(raw?.Personajes).map((item) => normalizePersonajeRef(item)),
        // La de una ficha, inactiva hasta que vuelva a cumplir (`Inactiva`, desde el 2026-11-21); sin él, activa.
        ...(raw?.Inactiva === true ? { Inactiva: true } : {}),
    };
}

export function normalizeCompaneroMonstruoDetalle(raw: any, depth = 1): CompaneroMonstruoDetalle {
    const base = normalizeMonstruoBase(raw, depth);
    return {
        ...base,
        Monstruo_origen: {
            Id: toNumber(raw?.Monstruo_origen?.Id),
            Nombre: toText(raw?.Monstruo_origen?.Nombre),
        },
        Id_companero: toNumber(raw?.Id_companero),
        Vida: toNumber(raw?.Vida),
        Dg_adi: toNumber(raw?.Dg_adi),
        Trucos_adi: toNumber(raw?.Trucos_adi),
        Plantilla: {
            Id: toNumber(raw?.Plantilla?.Id),
            Nombre: toText(raw?.Plantilla?.Nombre),
        },
        Especiales: toArray(raw?.Especiales).map((item) => normalizeEspecialContextual(item)),
        Personajes: toArray(raw?.Personajes).map((item) => normalizePersonajeRef(item)),
        // La de una ficha, inactiva hasta que vuelva a cumplir (`Inactiva`, desde el 2026-11-21); sin él, activa.
        ...(raw?.Inactiva === true ? { Inactiva: true } : {}),
        // Lo que le falta por elegir (`Pendiente` de la ficha); sin él, no se sabe.
        ...(raw?.Pendiente && typeof raw.Pendiente === 'object' ? {
            Pendiente: {
                Puntos: Math.max(0, toNumber(raw.Pendiente.Puntos)),
                Dotes: Math.max(0, toNumber(raw.Pendiente.Dotes)),
                Mejoras: Math.max(0, toNumber(raw.Pendiente.Mejoras)),
                Trucos: Math.max(0, toNumber(raw.Pendiente.Trucos)),
            },
        } : {}),
        // Sus mejoras de característica (contrato: «Las dotes y las mejoras que elige el compañero»).
        ...(Array.isArray(raw?.Mejoras) ? {
            Mejoras: toArray(raw.Mejoras).map((m: any) => ({
                Dg: toNumber(m?.Dg),
                Id_caracteristica: toNumber(m?.Id_caracteristica),
                Caracteristica: toText(m?.Caracteristica),
            })),
        } : {}),
    };
}

const DESTINATARIOS_APTITUD_MASCOTA: readonly DestinatarioAptitudMascota[] = ['amo', 'mascota', 'ambos'];

/**
 * Lo que da un nivel de una mascota (`mascota_aptitudes`, en el compañero y en cada tabla del familiar) con lo que añade
 * cada una (`extra`), de menor a mayor nivel. Una sin aptitud ni dote, o con un destinatario que no es del contrato, no
 * cuenta.
 */
function leerAptitudesMascota<T extends MascotaAptitudNivel>(raw: any, extra: (fila: any) => Omit<T, keyof MascotaAptitudNivel>): T[] {
    return toArray(raw)
        .map((fila: any) => ({
            Id: toInt(fila?.Id),
            Nivel: toInt(fila?.Nivel),
            Especial: idNombre(fila?.Especial),
            Dote: idNombre(fila?.Dote),
            Destinatario: fila?.Destinatario,
            ...extra(fila),
        }) as T)
        .filter((fila) => (fila.Especial || fila.Dote) && DESTINATARIOS_APTITUD_MASCOTA.includes(fila.Destinatario))
        .sort((a, b) => a.Nivel - b.Nivel || a.Id - b.Id);
}

/**
 * `GET /companeros/progresion` y su caché `CompanerosProgresion` (que la guarda tal cual; la RTDB puede dar las listas como
 * objetos): la tabla del compañero animal, de menor a mayor nivel, y lo que da cada nivel. Una aptitud sin aptitud ni
 * dote, o con un destinatario que no es del contrato, no cuenta.
 */
export function leerCompaneroProgresion(raw: any): CompaneroProgresion {
    const bonos: CompaneroBonosNivel[] = toArray(raw?.Bonos)
        .map((fila: any) => ({
            Nivel: toInt(fila?.Nivel),
            Dg_adicionales: toInt(fila?.Dg_adicionales),
            Armadura_natural: toInt(fila?.Armadura_natural),
            Fuerza_destreza: toInt(fila?.Fuerza_destreza),
            Trucos_adicionales: toInt(fila?.Trucos_adicionales),
        }))
        .filter((fila) => fila.Nivel > 0)
        .sort((a, b) => a.Nivel - b.Nivel);
    const aptitudes = leerAptitudesMascota<CompaneroAptitudNivel>(raw?.Aptitudes, (fila) => ({ Alternativa: idNombre(fila?.Alternativa) }));
    // `Tipo_prerrequisitos`: `{ Id, Nombre }` con id, o `null` (`idNombre`).
    return { Bonos: bonos, Aptitudes: aptitudes, Tipo_prerrequisitos: idNombre(raw?.Tipo_prerrequisitos) };
}

/**
 * `GET /familiares/progresion` y su caché `FamiliaresProgresion` (que la guarda tal cual; la RTDB puede dar las listas como
 * objetos): las tablas del familiar, la de por defecto primero, con sus filas de menor a mayor nivel y lo que da cada
 * nivel, y lo que sigue cada pseudoplantilla.
 */
export function leerFamiliarProgresion(raw: any): FamiliarProgresion {
    const tablas: FamiliarTabla[] = toArray(raw?.Tablas)
        .map((tabla: any) => ({
            Id: toInt(tabla?.Id),
            Nombre: toText(tabla?.Nombre).trim(),
            Por_defecto: toBoolean(tabla?.Por_defecto),
            Bonos: toArray(tabla?.Bonos)
                .map((fila: any): FamiliarBonosNivel => ({
                    Nivel: toInt(fila?.Nivel),
                    Armadura_natural: toInt(fila?.Armadura_natural),
                    Inteligencia: toIntOrNull(fila?.Inteligencia),
                    Rc_sobre_nivel: toIntOrNull(fila?.Rc_sobre_nivel),
                }))
                .filter((fila) => fila.Nivel > 0)
                .sort((a, b) => a.Nivel - b.Nivel),
            Aptitudes: leerAptitudesMascota<FamiliarAptitudNivel>(tabla?.Aptitudes, (fila) => ({ Nota: toText(fila?.Nota).trim() || null })),
        }))
        .filter((tabla) => tabla.Id > 0)
        .sort((a, b) => Number(b.Por_defecto) - Number(a.Por_defecto) || a.Id - b.Id);
    const plantillas: FamiliarPlantillaProgresion[] = toArray(raw?.Plantillas)
        .map((plantilla: any) => ({
            Id: toInt(plantilla?.Id),
            Nombre: toText(plantilla?.Nombre).trim(),
            Tabla: idNombre(plantilla?.Tabla),
            Pg_ataque_mayores: toBoolean(plantilla?.Pg_ataque_mayores),
            Sin_aptitudes: toArray(plantilla?.Sin_aptitudes).map((id: any) => toInt(id)).filter((id: number) => id > 0),
        }))
        .filter((plantilla) => plantilla.Id > 0)
        .sort((a, b) => a.Id - b.Id);
    return { Tablas: tablas, Plantillas: plantillas, Tipo_prerrequisitos: idNombre(raw?.Tipo_prerrequisitos) };
}

export function normalizeMonstruoDetalleArray(raw: any, depth = 1): MonstruoDetalle[] {
    return toArray(raw)
        .map((item) => normalizeMonstruoDetalle(item, depth))
        .filter((item) => item.Id > 0);
}

export function normalizeFamiliarMonstruoDetalleArray(raw: any, depth = 1): FamiliarMonstruoDetalle[] {
    return toArray(raw)
        .map((item) => normalizeFamiliarMonstruoDetalle(item, depth))
        .filter((item) => item.Id_familiar > 0);
}

export function normalizeCompaneroMonstruoDetalleArray(raw: any, depth = 1): CompaneroMonstruoDetalle[] {
    return toArray(raw)
        .map((item) => normalizeCompaneroMonstruoDetalle(item, depth))
        .filter((item) => item.Id_companero > 0);
}

/** La dieta, si es una de las que da la API; si no, `null` (sin decir). */
function leerDieta(valor: any): MonstruoDieta | null {
    const texto = `${valor ?? ''}`.trim() as MonstruoDieta;
    return DIETAS_MONSTRUO.includes(texto) ? texto : null;
}
