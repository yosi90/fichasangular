import { Alineamiento } from "src/app/interfaces/alineamiento";
import { Conjuro } from "src/app/interfaces/conjuro";
import { DoteContextual } from "src/app/interfaces/dote-contextual";
import { DoteManual } from "src/app/interfaces/dote";
import { IdiomaDetalle } from "src/app/interfaces/idioma";
import {
    CompaneroMonstruoDetalle,
    EspecialContextualMonstruo,
    FamiliarMonstruoDetalle,
    MonstruoAlineamientoBasicoRef,
    MonstruoAlineamientosRequeridos,
    MonstruoAtaque,
    MonstruoCaracteristicas,
    MonstruoDadosGolpe,
    MonstruoDefensa,
    MonstruoDetalle,
    MonstruoHabilidad,
    MonstruoMovimientos,
    MonstruoNivelClase,
    MonstruoPersonajesRelacionados,
    MonstruoSalvaciones,
    MonstruoSortilega,
    MonstruoSubtipoRef,
    MonstruoTipoRef,
    MonstruoTipoDadoRef,
    PersonajeRefMonstruo
} from "src/app/interfaces/monstruo";
import { RacialDetalle } from "src/app/interfaces/racial";
import { Tamano } from "src/app/interfaces/tamaño";
import { normalizeEspecial } from "../especial.service";
import { normalizeIdioma } from "../idioma.service";
import { toDoteContextualArray } from "./dote-mapper";
import { normalizeRacial } from "./racial-mapper";

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: any, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value > 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "si" || normalized === "sí";
    }
    return false;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

function normalizeDepth(depth: number): number {
    const parsed = Number(depth);
    if (!Number.isFinite(parsed))
        return 0;
    return Math.max(0, Math.trunc(parsed));
}

function normalizeManual(raw: any): DoteManual {
    if (typeof raw === "string") {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Pagina: toNumber(raw?.Pagina),
    };
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
        },
        Moral: {
            Id_moral: toNumber(raw?.Moral?.Id_moral ?? raw?.Moral?.Id),
            Nombre: toText(raw?.Moral?.Nombre),
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

function normalizeMovimientos(raw: any): MonstruoMovimientos {
    return {
        Correr: toNumber(raw?.Correr),
        Nadar: toNumber(raw?.Nadar),
        Volar: toNumber(raw?.Volar),
        Trepar: toNumber(raw?.Trepar),
        Escalar: toNumber(raw?.Escalar),
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
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeConjuro(raw: any): Conjuro {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Tiempo_lanzamiento: toText(raw?.Tiempo_lanzamiento),
        Alcance: toText(raw?.Alcance),
        Escuela: raw?.Escuela ?? {},
        Disciplina: raw?.Disciplina ?? {},
        Manual: toText(raw?.Manual),
        Objetivo: toText(raw?.Objetivo),
        Efecto: toText(raw?.Efecto),
        Area: toText(raw?.Area),
        Arcano: toBoolean(raw?.Arcano),
        Divino: toBoolean(raw?.Divino),
        Psionico: toBoolean(raw?.Psionico),
        Alma: toBoolean(raw?.Alma ?? raw?.alma),
        Duracion: toText(raw?.Duracion),
        Tipo_salvacion: toText(raw?.Tipo_salvacion),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes),
        Descripcion_componentes: toText(raw?.Descripcion_componentes),
        Permanente: toBoolean(raw?.Permanente),
        Puntos_poder: toNumber(raw?.Puntos_poder),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos),
        Descriptores: toArray(raw?.Descriptores).map((item) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
        })),
        Nivel_clase: toArray(raw?.Nivel_clase ?? raw?.Niveles_clase).map((item) => ({
            Id_clase: toNumber(item?.Id_clase),
            Clase: toText(item?.Clase),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Nivel_dominio: toArray(raw?.Nivel_dominio ?? raw?.Niveles_dominio).map((item) => ({
            Id_dominio: toNumber(item?.Id_dominio),
            Dominio: toText(item?.Dominio),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Nivel_disciplinas: toArray(raw?.Nivel_disciplinas ?? raw?.Niveles_disciplina).map((item) => ({
            Id_disciplina: toNumber(item?.Id_disciplina),
            Disciplina: toText(item?.Disciplina),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
        Componentes: toArray(raw?.Componentes).map((item) => ({
            Id_componente: toNumber(item?.Id_componente),
            Componente: toText(item?.Componente),
        })),
        Oficial: toBoolean(raw?.Oficial),
    };
}

function normalizeSortilega(raw: any): MonstruoSortilega {
    return {
        Conjuro: normalizeConjuro(raw?.Conjuro),
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

function normalizeNivelClase(raw: any): MonstruoNivelClase {
    return {
        Clase: {
            Id: toNumber(raw?.Clase?.Id),
            Nombre: toText(raw?.Clase?.Nombre),
        },
        Nivel: toNumber(raw?.Nivel),
        Plantilla: {
            Id: toNumber(raw?.Plantilla?.Id),
            Nombre: toText(raw?.Plantilla?.Nombre),
        },
        Preferencia_legal: {
            Id: toNumber(raw?.Preferencia_legal?.Id),
            Nombre: toText(raw?.Preferencia_legal?.Nombre),
        },
        Preferencia_moral: {
            Id: toNumber(raw?.Preferencia_moral?.Id),
            Nombre: toText(raw?.Preferencia_moral?.Nombre),
        },
        Dote: {
            Id: toNumber(raw?.Dote?.Id),
            Nombre: toText(raw?.Dote?.Nombre),
        },
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
        Manual: normalizeManual(raw?.Manual),
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
        Idiomas: normalizeIdiomaArray(raw?.Idiomas),
        Alineamientos_requeridos: normalizeAlineamientosRequeridos(raw?.Alineamientos_requeridos),
        Sortilegas: toArray(raw?.Sortilegas).map((item) => normalizeSortilega(item)),
        Habilidades: toArray(raw?.Habilidades).map((item) => normalizeHabilidad(item)),
        Dotes: normalizeDoteArray(raw?.Dotes),
        Niveles_clase: toArray(raw?.Niveles_clase).map((item) => normalizeNivelClase(item)),
        Subtipos: toArray(raw?.Subtipos).map((item) => normalizeSubtipo(item)),
        Raciales: normalizeRacialArray(raw?.Raciales),
        Ataques_especiales: normalizeRacialArray(raw?.Ataques_especiales),
        Familiares: nestedDepth >= 0
            ? normalizeFamiliarMonstruoDetalleArray(raw?.Familiares, nestedDepth)
            : [],
        Companeros: nestedDepth >= 0
            ? normalizeCompaneroMonstruoDetalleArray(raw?.Companeros, nestedDepth)
            : [],
        Personajes_relacionados: normalizePersonajesRelacionados(raw?.Personajes_relacionados),
    };
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
    };
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
