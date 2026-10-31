import { Conjuro } from 'src/app/interfaces/conjuro';
import { ConjuroEditable } from 'src/app/interfaces/conjuros-api';
import { Subdisciplinas } from 'src/app/interfaces/disciplina-conjuros';
import { toArray, toBoolean, toInt, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';

function toStrictArray<T = any>(value: any): T[] {
    return Array.isArray(value) ? value : [];
}

/** El `Oficial` de una escuela (`GET /escuelas` y la escuela de cada conjuro): sin dato (una caché antigua), oficial. */
export function oficialDeEscuela(raw: any): boolean {
    return raw?.Oficial === undefined || raw?.Oficial === null ? true : toBoolean(raw.Oficial);
}

function normalizeEscuelaApi(raw: any): Conjuro['Escuela'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false };

    return {
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.ne),
        Prohibible: toBoolean(raw?.Prohibible ?? raw?.p),
        Oficial: oficialDeEscuela(raw),
    };
}

/**
 * Las subdisciplinas de una disciplina. La API las da por su nombre (`DisciplinaConjuro.Subdisciplinas`, en el conjuro
 * solo la suya); como el modelo las guarda con un id, a los nombres sueltos les da su posición.
 */
export function normalizeSubdisciplinas(raw: any): Subdisciplinas[] {
    return toArray(raw)
        .map((item: any, index: number) => {
            if (typeof item === 'string') {
                return {
                    Id: index + 1,
                    Nombre: toText(item).trim(),
                };
            }
            return {
                Id: toInt(item?.Id ?? item?.i, 0),
                Nombre: toText(item?.Nombre ?? item?.n).trim(),
            };
        })
        .filter((item) => item.Nombre.length > 0);
}

function normalizeDisciplinaApi(raw: any): Conjuro['Disciplina'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] };

    return {
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.ne),
        Subdisciplinas: normalizeSubdisciplinas(toStrictArray(raw?.Subdisciplinas ?? raw?.sd)),
    };
}

function normalizeEscuelaLegacy(raw: any): Conjuro['Escuela'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false };

    return {
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_especial ?? raw?.Nombre_esp ?? raw?.ne),
        Prohibible: toBoolean(raw?.Prohibible ?? raw?.p),
        Oficial: oficialDeEscuela(raw),
    };
}

function normalizeDisciplinaLegacy(raw: any): Conjuro['Disciplina'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] };

    return {
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_especial ?? raw?.Nombre_esp ?? raw?.ne),
        Subdisciplinas: normalizeSubdisciplinas(raw?.Subdisciplinas ?? raw?.sd),
    };
}

function createBaseConjuro(): Conjuro {
    return {
        Id: 0,
        Nombre: '',
        Descripcion: '',
        Tiempo_lanzamiento: '',
        Alcance: '',
        Escuela: { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false },
        Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
        Manual: '',
        Objetivo: '',
        Efecto: '',
        Area: '',
        Arcano: false,
        Divino: false,
        Psionico: false,
        Duracion: '',
        Tipo_salvacion: '',
        Resistencia_conjuros: false,
        Resistencia_poderes: false,
        Descripcion_componentes: '',
        Permanente: false,
        Puntos_poder: 0,
        Descripcion_aumentos: '',
        Descriptores: [],
        Nivel_clase: [],
        Nivel_dominio: [],
        Nivel_disciplinas: [],
        Componentes: [],
        Coste_material: null,
        Coste_px: null,
        Oficial: false,
    };
}

export function normalizeConjuroApi(raw: any): Conjuro {
    const base = createBaseConjuro();

    return {
        ...base,
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Descripcion: toText(raw?.Descripcion ?? raw?.d),
        Tiempo_lanzamiento: toText(raw?.Tiempo_lanzamiento ?? raw?.tl),
        Alcance: toText(raw?.Alcance ?? raw?.ac),
        Escuela: normalizeEscuelaApi(raw?.Escuela ?? raw?.es),
        Disciplina: normalizeDisciplinaApi(raw?.Disciplina ?? raw?.di),
        Manual: toText(raw?.Manual ?? raw?.m),
        Objetivo: toText(raw?.Objetivo ?? raw?.ob),
        Efecto: toText(raw?.Efecto ?? raw?.ef),
        Area: toText(raw?.Area ?? raw?.ar),
        Arcano: toBoolean(raw?.Arcano ?? raw?.arc),
        Divino: toBoolean(raw?.Divino ?? raw?.div),
        Psionico: toBoolean(raw?.Psionico ?? raw?.psi),
        Duracion: toText(raw?.Duracion ?? raw?.dur),
        Tipo_salvacion: toText(raw?.Tipo_salvacion ?? raw?.t_s),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros ?? raw?.r_c),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes ?? raw?.r_p),
        Descripcion_componentes: toText(raw?.Descripcion_componentes ?? raw?.d_c),
        Permanente: toBoolean(raw?.Permanente ?? raw?.per),
        Puntos_poder: toInt(raw?.Puntos_poder ?? raw?.pp),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos ?? raw?.da),
        Descriptores: toStrictArray(raw?.Descriptores ?? raw?.des)
            .map((item: any) => ({
                Id: toInt(item?.Id),
                Nombre: toText(item?.Nombre),
            }))
            .filter((item) => item.Id > 0 || item.Nombre.trim().length > 0),
        Nivel_clase: toStrictArray(raw?.Niveles_clase ?? raw?.ncl)
            .map((item: any) => ({
                Id_clase: toInt(item?.Id_clase),
                Clase: toText(item?.Clase),
                Nivel: toInt(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_clase > 0 || item.Clase.trim().length > 0),
        Nivel_dominio: toStrictArray(raw?.Niveles_dominio ?? raw?.nd)
            .map((item: any) => ({
                Id_dominio: toInt(item?.Id_dominio),
                Dominio: toText(item?.Dominio),
                Nivel: toInt(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_dominio > 0 || item.Dominio.trim().length > 0),
        Nivel_disciplinas: toStrictArray(raw?.Niveles_disciplina ?? raw?.ndis)
            .map((item: any) => ({
                Id_disciplina: toInt(item?.Id_disciplina),
                Disciplina: toText(item?.Disciplina),
                Nivel: toInt(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_disciplina > 0 || item.Disciplina.trim().length > 0),
        Componentes: toStrictArray(raw?.Componentes ?? raw?.coms)
            .map((item: any) => ({
                Componente: toText(item?.Componente),
                Id_componente: toInt(item?.Id_componente),
            }))
            .filter((item) => item.Id_componente > 0 || item.Componente.trim().length > 0),
        Coste_material: toNumberOrNull(raw?.Coste_material ?? raw?.cmat),
        Coste_px: toNumberOrNull(raw?.Coste_px ?? raw?.cpx),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
    };
}

/**
 * Los textos del conjuro que la API da `null` si son de relleno («no especifica»; `Textos_sin_especificar`). En el
 * formulario, cada uno es el control con su nombre en minúscula.
 */
export const TEXTOS_CONJURO_CON_RELLENO = [
    'Descripcion', 'Objetivo', 'Efecto', 'Area', 'Duracion', 'Tipo_salvacion', 'Descripcion_componentes', 'Descripcion_aumentos',
] as const;

/** `GET /conjuros/<id>` (y la entrada que devuelven el alta y la edición): el conjuro y los ids del alta. */
export function normalizeConjuroEditableApi(raw: any): ConjuroEditable {
    return {
        ...normalizeConjuroApi(raw),
        Id_manual: toInt(raw?.Id_manual),
        Pagina: toInt(raw?.Pagina),
        Id_tiempo_lanzamiento: toInt(raw?.Id_tiempo_lanzamiento),
        Id_alcance: toInt(raw?.Id_alcance),
        Id_subdisciplina: toInt(raw?.Id_subdisciplina),
        Textos_sin_especificar: TEXTOS_CONJURO_CON_RELLENO.filter((clave) => raw?.[clave] === null),
    };
}

export function normalizeConjuroLegacy(raw: any): Conjuro {
    const base = createBaseConjuro();

    return {
        ...base,
        Id: toInt(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Descripcion: toText(raw?.Descripcion ?? raw?.d),
        Tiempo_lanzamiento: toText(raw?.Tiempo_lanzamiento ?? raw?.tl),
        Alcance: toText(raw?.Alcance ?? raw?.ac),
        Escuela: normalizeEscuelaLegacy(raw?.Escuela ?? raw?.es),
        Disciplina: normalizeDisciplinaLegacy(raw?.Disciplina ?? raw?.di),
        Manual: toText(raw?.Manual ?? raw?.m),
        Objetivo: toText(raw?.Objetivo ?? raw?.ob),
        Efecto: toText(raw?.Efecto ?? raw?.ef),
        Area: toText(raw?.Area ?? raw?.ar),
        Arcano: toBoolean(raw?.Arcano ?? raw?.arc),
        Divino: toBoolean(raw?.Divino ?? raw?.div),
        Psionico: toBoolean(raw?.Psionico ?? raw?.psi),
        Duracion: toText(raw?.Duracion ?? raw?.dur),
        Tipo_salvacion: toText(raw?.Tipo_salvacion ?? raw?.t_s),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros ?? raw?.r_c),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes ?? raw?.r_p),
        Descripcion_componentes: toText(raw?.Descripcion_componentes ?? raw?.d_c),
        Permanente: toBoolean(raw?.Permanente ?? raw?.per),
        Puntos_poder: toInt(raw?.Puntos_poder ?? raw?.pp),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos ?? raw?.da),
        Descriptores: toArray(raw?.Descriptores ?? raw?.des).map((item: any) => ({
            Id: toInt(item?.Id ?? item?.i),
            Nombre: toText(item?.Nombre ?? item?.n),
        })),
        Nivel_clase: toArray(raw?.Nivel_clase ?? raw?.Niveles_clase ?? raw?.ncl).map((item: any) => ({
            Id_clase: toInt(item?.Id_clase ?? item?.id_clase),
            Clase: toText(item?.Clase),
            Nivel: toInt(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Nivel_dominio: toArray(raw?.Nivel_dominio ?? raw?.Niveles_dominio ?? raw?.nd).map((item: any) => ({
            Id_dominio: toInt(item?.Id_dominio ?? item?.id_dominio),
            Dominio: toText(item?.Dominio),
            Nivel: toInt(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Nivel_disciplinas: toArray(raw?.Nivel_disciplinas ?? raw?.Niveles_disciplina ?? raw?.ndis).map((item: any) => ({
            Id_disciplina: toInt(item?.Id_disciplina ?? item?.id_disciplina),
            Disciplina: toText(item?.Disciplina),
            Nivel: toInt(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Componentes: toArray(raw?.Componentes ?? raw?.coms).map((item: any) => ({
            Componente: toText(item?.Componente ?? item?.n),
            Id_componente: toInt(item?.Id_componente ?? item?.i),
        })),
        Coste_material: toNumberOrNull(raw?.Coste_material ?? raw?.cmat),
        Coste_px: toNumberOrNull(raw?.Coste_px ?? raw?.cpx),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
    };
}
