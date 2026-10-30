import { DoteContextual } from "src/app/interfaces/dote-contextual";
import {
    SubtipoDetalle,
    SubtipoHabilidadBase,
    SubtipoHabilidadCustom,
    SubtipoRef,
    SubtipoResumen,
    SubtipoSortilega,
} from "src/app/interfaces/subtipo";
import { leerComodin } from "./comodin";
import { toDoteContextualArray } from "./dote-mapper";
import { normalizarTexto, toArray, toBoolean, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { normalizeManualApi } from './manual-mapper';

function normalizeSubtipoRefItem(raw: any): SubtipoRef | null {
    if (typeof raw === "string") {
        const nombre = raw.trim();
        if (nombre.length < 1)
            return null;
        return {
            Id: 0,
            Nombre: nombre,
        };
    }

    const id = toNumber(raw?.Id ?? raw?.i);
    const nombre = toText(raw?.Nombre ?? raw?.n).trim();
    if (id <= 0 && nombre.length < 1)
        return null;

    return {
        Id: id > 0 ? id : 0,
        Nombre: nombre,
    };
}

function normalizeHabilidadBase(raw: any): SubtipoHabilidadBase {
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
        Extra_comodin: leerComodin(raw?.Extra_comodin),
        Cantidad: toNumber(raw?.Cantidad),
        Varios: toText(raw?.Varios),
    };
}

function normalizeHabilidadCustom(raw: any): SubtipoHabilidadCustom {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Cantidad: toNumber(raw?.Cantidad),
    };
}

function normalizeSortilega(raw: any): SubtipoSortilega {
    return {
        Conjuro: raw?.Conjuro ?? {},
        Nivel_lanzador: toNumber(raw?.Nivel_lanzador),
        Usos_diarios: toText(raw?.Usos_diarios),
    };
}

export function normalizeSubtipoRefArray(raw: any): SubtipoRef[] {
    if (typeof raw === "string") {
        const parsed = raw
            .split("|")
            .map((item) => normalizeSubtipoRefItem(item))
            .filter((item): item is SubtipoRef => !!item);
        return dedupeSubtipos(parsed);
    }

    const refs = toArray(raw)
        .map((item) => normalizeSubtipoRefItem(item))
        .filter((item): item is SubtipoRef => !!item);
    return dedupeSubtipos(refs);
}

export function normalizeSubtipoResumen(raw: any): SubtipoResumen {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualApi(raw?.Manual),
        Heredada: toBoolean(raw?.Heredada),
        Oficial: toBoolean(raw?.Oficial),
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel),
    };
}

export function normalizeSubtipoDetalle(raw: any): SubtipoDetalle {
    const dotes: DoteContextual[] = toDoteContextualArray(raw?.Dotes);

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManualApi(raw?.Manual),
        Heredada: toBoolean(raw?.Heredada),
        Oficial: toBoolean(raw?.Oficial),
        Modificadores_caracteristicas: {
            Fuerza: toNumber(raw?.Modificadores_caracteristicas?.Fuerza),
            Destreza: toNumber(raw?.Modificadores_caracteristicas?.Destreza),
            Constitucion: toNumber(raw?.Modificadores_caracteristicas?.Constitucion),
            Inteligencia: toNumber(raw?.Modificadores_caracteristicas?.Inteligencia),
            Sabiduria: toNumber(raw?.Modificadores_caracteristicas?.Sabiduria),
            Carisma: toNumber(raw?.Modificadores_caracteristicas?.Carisma),
        },
        Minimos_caracteristicas: {
            Fuerza: toNumber(raw?.Minimos_caracteristicas?.Fuerza),
            Destreza: toNumber(raw?.Minimos_caracteristicas?.Destreza),
            Constitucion: toNumber(raw?.Minimos_caracteristicas?.Constitucion),
            Inteligencia: toNumber(raw?.Minimos_caracteristicas?.Inteligencia),
            Sabiduria: toNumber(raw?.Minimos_caracteristicas?.Sabiduria),
            Carisma: toNumber(raw?.Minimos_caracteristicas?.Carisma),
        },
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel),
        Presa: toNumber(raw?.Presa),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
        Iniciativa: toNumber(raw?.Iniciativa),
        Ataque_base: toNumber(raw?.Ataque_base),
        Ca: toText(raw?.Ca),
        Rd: toText(raw?.Rd),
        Rc: toText(raw?.Rc),
        Re: toText(raw?.Re),
        Cd: toText(raw?.Cd),
        Tesoro: toText(raw?.Tesoro),
        Movimientos: {
            Correr: toNumber(raw?.Movimientos?.Correr),
            Nadar: toNumber(raw?.Movimientos?.Nadar),
            Volar: toNumber(raw?.Movimientos?.Volar),
            Trepar: toNumber(raw?.Movimientos?.Trepar),
            Excavar: toNumber(raw?.Movimientos?.Excavar),
        },
        Maniobrabilidad: raw?.Maniobrabilidad ?? {},
        Alineamiento: raw?.Alineamiento ?? {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: "" },
            Ley: { Id_ley: 0, Nombre: "" },
            Moral: { Id_moral: 0, Nombre: "" },
            Prioridad: { Id_prioridad: 0, Nombre: "" },
            Descripcion: "",
        },
        Idiomas: toArray(raw?.Idiomas).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Secreto: toBoolean(item?.Secreto),
            Oficial: toBoolean(item?.Oficial),
        })),
        Dotes: dotes,
        Habilidades: {
            Base: toArray(raw?.Habilidades?.Base).map((item: any) => normalizeHabilidadBase(item)),
            Custom: toArray(raw?.Habilidades?.Custom).map((item: any) => normalizeHabilidadCustom(item)),
        },
        Sortilegas: toArray(raw?.Sortilegas).map((item: any) => normalizeSortilega(item)),
        Rasgos: toArray(raw?.Rasgos),
        Plantillas: toArray(raw?.Plantillas).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
        })),
    };
}

function dedupeSubtipos(items: SubtipoRef[]): SubtipoRef[] {
    const seen = new Set<string>();
    const output: SubtipoRef[] = [];

    items.forEach((item) => {
        const nombre = `${item?.Nombre ?? ""}`.trim();
        const id = toNumber(item?.Id);
        if (nombre.length < 1 && id <= 0)
            return;

        const key = id > 0 ? `id:${id}` : `name:${normalizarTexto(nombre)}`;
        if (seen.has(key))
            return;

        seen.add(key);
        output.push({
            Id: id > 0 ? id : 0,
            Nombre: nombre,
        });
    });

    return output;
}
