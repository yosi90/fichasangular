import { Conjuro } from 'src/app/interfaces/conjuro';

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí' || normalized === 'yes';
    }
    return false;
}

function toNumber(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toText(value: any, fallback: string = ''): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

function toStrictArray<T = any>(value: any): T[] {
    return Array.isArray(value) ? value : [];
}

function normalizeEscuelaApi(raw: any): Conjuro['Escuela'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false };

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.ne),
        Prohibible: toBoolean(raw?.Prohibible ?? raw?.p),
    };
}

function normalizeDisciplinaApi(raw: any): Conjuro['Disciplina'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] };

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.ne),
        Subdisciplinas: toStrictArray(raw?.Subdisciplinas ?? raw?.sd)
            .map((item: any) => ({
                Id: toNumber(item?.Id ?? item?.i),
                Nombre: toText(item?.Nombre ?? item?.n),
            }))
            .filter((item) => item.Id > 0 || item.Nombre.trim().length > 0),
    };
}

function normalizeEscuelaLegacy(raw: any): Conjuro['Escuela'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false };

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_especial ?? raw?.Nombre_esp ?? raw?.ne),
        Prohibible: toBoolean(raw?.Prohibible ?? raw?.p),
    };
}

function normalizeDisciplinaLegacy(raw: any): Conjuro['Disciplina'] {
    if (!raw || typeof raw !== 'object')
        return { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] };

    return {
        Id: toNumber(raw?.Id ?? raw?.i),
        Nombre: toText(raw?.Nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_especial ?? raw?.Nombre_esp ?? raw?.ne),
        Subdisciplinas: toArray(raw?.Subdisciplinas ?? raw?.sd).map((item: any) => ({
            Id: toNumber(item?.Id ?? item?.i),
            Nombre: toText(item?.Nombre ?? item?.n),
        })),
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
        Alma: false,
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
        Oficial: false,
    };
}

export function normalizeConjuroApi(raw: any): Conjuro {
    const base = createBaseConjuro();

    return {
        ...base,
        Id: toNumber(raw?.Id ?? raw?.i),
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
        Alma: toBoolean(raw?.alma ?? raw?.alm),
        Duracion: toText(raw?.Duracion ?? raw?.dur),
        Tipo_salvacion: toText(raw?.Tipo_salvacion ?? raw?.t_s),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros ?? raw?.r_c),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes ?? raw?.r_p),
        Descripcion_componentes: toText(raw?.Descripcion_componentes ?? raw?.d_c),
        Permanente: toBoolean(raw?.Permanente ?? raw?.per),
        Puntos_poder: toNumber(raw?.Puntos_poder ?? raw?.pp),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos ?? raw?.da),
        Descriptores: toStrictArray(raw?.Descriptores ?? raw?.des)
            .map((item: any) => ({
                Id: toNumber(item?.Id),
                Nombre: toText(item?.Nombre),
            }))
            .filter((item) => item.Id > 0 || item.Nombre.trim().length > 0),
        Nivel_clase: toStrictArray(raw?.Niveles_clase ?? raw?.ncl)
            .map((item: any) => ({
                Id_clase: toNumber(item?.Id_clase),
                Clase: toText(item?.Clase),
                Nivel: toNumber(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_clase > 0 || item.Clase.trim().length > 0),
        Nivel_dominio: toStrictArray(raw?.Niveles_dominio ?? raw?.nd)
            .map((item: any) => ({
                Id_dominio: toNumber(item?.Id_dominio),
                Dominio: toText(item?.Dominio),
                Nivel: toNumber(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_dominio > 0 || item.Dominio.trim().length > 0),
        Nivel_disciplinas: toStrictArray(raw?.Niveles_disciplina ?? raw?.ndis)
            .map((item: any) => ({
                Id_disciplina: toNumber(item?.Id_disciplina),
                Disciplina: toText(item?.Disciplina),
                Nivel: toNumber(item?.Nivel),
                Espontaneo: toBoolean(item?.Espontaneo),
            }))
            .filter((item) => item.Id_disciplina > 0 || item.Disciplina.trim().length > 0),
        Componentes: toStrictArray(raw?.Componentes ?? raw?.coms)
            .map((item: any) => ({
                Componente: toText(item?.Componente),
                Id_componente: toNumber(item?.Id_componente),
            }))
            .filter((item) => item.Id_componente > 0 || item.Componente.trim().length > 0),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
    };
}

export function normalizeConjuroLegacy(raw: any): Conjuro {
    const base = createBaseConjuro();

    return {
        ...base,
        Id: toNumber(raw?.Id ?? raw?.i),
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
        Alma: toBoolean(raw?.Alma ?? raw?.alma ?? raw?.alm),
        Duracion: toText(raw?.Duracion ?? raw?.dur),
        Tipo_salvacion: toText(raw?.Tipo_salvacion ?? raw?.t_s),
        Resistencia_conjuros: toBoolean(raw?.Resistencia_conjuros ?? raw?.r_c),
        Resistencia_poderes: toBoolean(raw?.Resistencia_poderes ?? raw?.r_p),
        Descripcion_componentes: toText(raw?.Descripcion_componentes ?? raw?.d_c),
        Permanente: toBoolean(raw?.Permanente ?? raw?.per),
        Puntos_poder: toNumber(raw?.Puntos_poder ?? raw?.pp),
        Descripcion_aumentos: toText(raw?.Descripcion_aumentos ?? raw?.da),
        Descriptores: toArray(raw?.Descriptores ?? raw?.des).map((item: any) => ({
            Id: toNumber(item?.Id ?? item?.i),
            Nombre: toText(item?.Nombre ?? item?.n),
        })),
        Nivel_clase: toArray(raw?.Nivel_clase ?? raw?.Niveles_clase ?? raw?.ncl).map((item: any) => ({
            Id_clase: toNumber(item?.Id_clase ?? item?.id_clase),
            Clase: toText(item?.Clase),
            Nivel: toNumber(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Nivel_dominio: toArray(raw?.Nivel_dominio ?? raw?.Niveles_dominio ?? raw?.nd).map((item: any) => ({
            Id_dominio: toNumber(item?.Id_dominio ?? item?.id_dominio),
            Dominio: toText(item?.Dominio),
            Nivel: toNumber(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Nivel_disciplinas: toArray(raw?.Nivel_disciplinas ?? raw?.Niveles_disciplina ?? raw?.ndis).map((item: any) => ({
            Id_disciplina: toNumber(item?.Id_disciplina ?? item?.id_disciplina),
            Disciplina: toText(item?.Disciplina),
            Nivel: toNumber(item?.Nivel ?? item?.nivel),
            Espontaneo: toBoolean(item?.Espontaneo ?? item?.espontaneo),
        })),
        Componentes: toArray(raw?.Componentes ?? raw?.coms).map((item: any) => ({
            Componente: toText(item?.Componente ?? item?.n),
            Id_componente: toNumber(item?.Id_componente ?? item?.i),
        })),
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
    };
}

export const normalizeConjuro = normalizeConjuroLegacy;
