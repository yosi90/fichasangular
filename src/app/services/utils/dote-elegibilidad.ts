import { Dote } from 'src/app/interfaces/dote';
import {
    IdentidadPrerrequisitos,
    existeCoincidenciaClaveEntidad,
    normalizarTextoPrerrequisito,
} from './identidad-prerrequisitos';
import { getAlineamientoBasicoIdPorNombre } from './alineamiento-contrato';

export type EstadoElegibilidadDote = 'eligible' | 'blocked_failed' | 'blocked_unknown';

export interface DoteEvaluacionContexto {
    identidad: IdentidadPrerrequisitos;
    caracteristicas: {
        Fuerza: number;
        Destreza: number;
        Constitucion: number;
        Inteligencia: number;
        Sabiduria: number;
        Carisma: number;
    };
    ataqueBase: number;
    nivelesClase: Array<{ id: number | null; nombre: string; nivel: number; }>;
    dotes: Array<{ id: number | null; nombre: string; idExtra: number; extra: string; }>;
    claseas?: Array<{ id: number | null; nombre: string; idExtra: number | null; extra: string; }>;
    dominios?: Array<{ id: number | null; nombre: string; }>;
    idiomas: Array<{ id: number | null; nombre: string; }>;
    habilidades: Array<{ id: number | null; nombre: string; rangos: number; extra: string; }>;
    conjuros: Array<{ id: number | null; nombre: string; idEscuela: number | null; escuela: string; }>;
    competenciasArmas: Array<{ id: number | null; nombre: string; }>;
    competenciasArmaduras?: Array<{ id: number | null; nombre: string; }>;
    competenciasGrupoArmas?: Array<{ id: number | null; nombre: string; }>;
    competenciasGrupoArmaduras?: Array<{ id: number | null; nombre: string; }>;
    lanzador: {
        arcano: number;
        divino: number;
        psionico: number;
    };
    nivelesConjuroMaximos?: {
        arcano: number;
        divino: number;
    };
    escuelaEspecialista?: {
        id: number | null;
        nombre: string;
        nivelArcano?: number;
    };
    dgTotal?: number;
    nivelTotal?: number;
    tamanoId?: number | null;
    tipoCriaturaId?: number | null;
    tipoCriaturaNombre?: string;
    tiposDote?: Array<{ id: number | null; nombre: string; }>;
    region?: {
        id: number | null;
        nombre: string;
    };
    salvaciones: {
        fortaleza: number;
        reflejos: number;
        voluntad: number;
    };
    alineamiento: string;
    puedeSeleccionarCompanero: boolean;
    puedeSeleccionarFamiliar: boolean;
    catalogoIdiomas?: Array<{ id: number | null; nombre: string; }>;
    catalogoHabilidades?: Array<{ id: number | null; nombre: string; }>;
    catalogoClases?: Array<{ id: number | null; nombre: string; }>;
    catalogoDotes?: Array<{ id: number | null; nombre: string; }>;
    catalogoRegiones?: Array<{ id: number | null; nombre: string; }>;
}

export interface DoteEvaluacionInput {
    dote: Dote | null | undefined;
    contexto: DoteEvaluacionContexto;
    idExtraSeleccionado?: number | null;
    extraSeleccionado?: string | null;
}

export interface DoteEvaluacionResultado {
    estado: EstadoElegibilidadDote;
    razones: string[];
    advertencias: string[];
}

interface EvaluacionItem {
    grupoOpcional: number;
    evaluable: boolean;
    cumple: boolean;
    razonFail: string;
    razonUnknown: string;
}

interface GrupoOpcionalEstado {
    cumple: boolean;
    falla: boolean;
    unknown: boolean;
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string') {
        const normalizado = value.trim().toLowerCase();
        return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
    }
    return false;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

function pick(entry: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(entry, key))
            return entry[key];
    }
    return undefined;
}

function parseOpcional(entry: Record<string, any>): number {
    const raw = pick(entry, ['Opcional', 'opcional', 'o', 'O']);
    return Math.max(0, Math.trunc(toNumber(raw)));
}

function parseId(entry: Record<string, any>, keys: string[]): number {
    for (const key of keys) {
        const id = toNumber(entry?.[key]);
        if (id > 0)
            return id;
    }
    return 0;
}

function parseNumber(entry: Record<string, any>, keys: string[]): number {
    const value = pick(entry, keys);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseIdOpcional(entry: Record<string, any>, keys: string[]): number {
    const raw = pick(entry, keys);
    if (raw === undefined || raw === null)
        return Number.NaN;
    const text = `${raw}`.trim();
    if (text.length < 1)
        return Number.NaN;
    return Math.trunc(toNumber(raw));
}

function parseText(entry: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
        const value = `${entry?.[key] ?? ''}`.trim();
        if (value.length > 0)
            return value;
    }
    return '';
}

function normalizarClavePrerrequisito(key: string): string {
    return normalizarTextoPrerrequisito(`${key ?? ''}`).replace(/\s+/g, '_');
}

function dedupeTextList(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
        const norm = normalizarTextoPrerrequisito(value);
        if (norm.length < 1 || seen.has(norm))
            return;
        seen.add(norm);
        result.push(value);
    });
    return result;
}

function getCaracteristicaNombreById(idCaracteristica: number): string {
    if (idCaracteristica === 1)
        return 'Fuerza';
    if (idCaracteristica === 2)
        return 'Destreza';
    if (idCaracteristica === 3)
        return 'Constitución';
    if (idCaracteristica === 4)
        return 'Inteligencia';
    if (idCaracteristica === 5)
        return 'Sabiduría';
    if (idCaracteristica === 6)
        return 'Carisma';
    return `Característica ${idCaracteristica}`;
}

function getActitudNombreById(idActitud: number): string {
    if (idActitud === 1)
        return 'Legal';
    if (idActitud === 2)
        return 'Neutral';
    if (idActitud === 3)
        return 'Caótica';
    if (idActitud === 4)
        return 'Buena';
    if (idActitud === 5)
        return 'Maligna';
    return `Actitud ${idActitud}`;
}

function resolverNombrePorId(
    id: number,
    nombrePreferido: string,
    catalogo: Array<{ id: number | null; nombre: string; }> | null | undefined,
    fallback: string
): string {
    const nombre = `${nombrePreferido ?? ''}`.trim();
    if (nombre.length > 0)
        return nombre;
    if (id > 0) {
        const encontrado = (catalogo ?? []).find((item) => toNumber(item?.id) === id);
        const nombreCatalogo = `${encontrado?.nombre ?? ''}`.trim();
        if (nombreCatalogo.length > 0)
            return nombreCatalogo;
        return `${fallback} ${id}`;
    }
    return fallback;
}

function getCaracteristicaById(
    caracteristicas: DoteEvaluacionContexto['caracteristicas'],
    idCaracteristica: number
): number {
    if (idCaracteristica === 1)
        return toNumber(caracteristicas.Fuerza);
    if (idCaracteristica === 2)
        return toNumber(caracteristicas.Destreza);
    if (idCaracteristica === 3)
        return toNumber(caracteristicas.Constitucion);
    if (idCaracteristica === 4)
        return toNumber(caracteristicas.Inteligencia);
    if (idCaracteristica === 5)
        return toNumber(caracteristicas.Sabiduria);
    if (idCaracteristica === 6)
        return toNumber(caracteristicas.Carisma);
    return Number.NaN;
}

function parseAlineamientoId(alineamiento: string): number {
    const porNombre = getAlineamientoBasicoIdPorNombre(alineamiento);
    if (porNombre > 0)
        return porNombre;

    const normalizado = normalizarTextoPrerrequisito(alineamiento);
    if (normalizado.includes('legal') && normalizado.includes('bueno'))
        return 1;
    if (normalizado.includes('legal') && normalizado.includes('neutral'))
        return 2;
    if (normalizado.includes('legal') && normalizado.includes('maligno'))
        return 3;
    if (normalizado.includes('neutral') && normalizado.includes('bueno'))
        return 4;
    if (normalizado.includes('neutral') && normalizado.includes('autentico'))
        return 5;
    if (normalizado.includes('neutral') && normalizado.includes('maligno'))
        return 6;
    if (normalizado.includes('caotico') && normalizado.includes('bueno'))
        return 7;
    if (normalizado.includes('caotico') && normalizado.includes('neutral'))
        return 8;
    if (normalizado.includes('caotico') && normalizado.includes('maligno'))
        return 9;
    return 0;
}

function cumpleActitud(idActitud: number, idAlineamientoBasico: number): boolean {
    const esLegal = [1, 2, 3].includes(idAlineamientoBasico);
    const esNeutralLey = [2, 4, 5, 6, 8].includes(idAlineamientoBasico);
    const esCaotico = [7, 8, 9].includes(idAlineamientoBasico);
    const esBueno = [1, 4, 7].includes(idAlineamientoBasico);
    const esMaligno = [3, 6, 9].includes(idAlineamientoBasico);

    if (idActitud === 1)
        return esLegal;
    if (idActitud === 2)
        return esNeutralLey;
    if (idActitud === 3)
        return esCaotico;
    if (idActitud === 4)
        return esBueno;
    if (idActitud === 5)
        return esMaligno;
    return false;
}

function registrarEvaluacion(
    evaluacion: EvaluacionItem,
    gruposOpcionales: Map<number, GrupoOpcionalEstado>,
    fail: string[],
    unknown: string[]
): void {
    if (evaluacion.grupoOpcional <= 0) {
        if (!evaluacion.evaluable) {
            unknown.push(evaluacion.razonUnknown);
            return;
        }
        if (!evaluacion.cumple)
            fail.push(evaluacion.razonFail);
        return;
    }

    const estado = gruposOpcionales.get(evaluacion.grupoOpcional) ?? {
        cumple: false,
        falla: false,
        unknown: false,
    };
    if (!evaluacion.evaluable)
        estado.unknown = true;
    else if (evaluacion.cumple)
        estado.cumple = true;
    else
        estado.falla = true;

    gruposOpcionales.set(evaluacion.grupoOpcional, estado);
}

function resolverGruposOpcionales(
    gruposOpcionales: Map<number, GrupoOpcionalEstado>,
    fail: string[],
    unknown: string[]
): void {
    gruposOpcionales.forEach((estado, grupo) => {
        if (estado.cumple)
            return;
        if (estado.unknown) {
            unknown.push(`No se pudo validar por completo el grupo opcional ${grupo}`);
            return;
        }
        if (estado.falla)
            fail.push(`No se cumple el grupo opcional ${grupo}`);
    });
}

function buildEvaluacionAtaqueBase(entry: Record<string, any>, ataqueBase: number): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = toNumber(pick(entry, ['Ataque_base', 'ataque_base', 'Cantidad', 'cantidad', 'Valor', 'valor']));
    const evaluable = Number.isFinite(requerido) && requerido > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? ataqueBase >= requerido : false,
        razonFail: `Ataque base insuficiente (${ataqueBase} < ${requerido})`,
        razonUnknown: 'Prerrequisito de ataque base con formato no reconocido',
    };
}

function buildEvaluacionCaracteristica(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idCaracteristica = parseId(entry, ['Id_caracteristica', 'id_caracteristica', 'Id', 'id']);
    const minimo = toNumber(pick(entry, ['Cantidad', 'cantidad', 'Valor', 'valor']));
    const actual = getCaracteristicaById(ctx.caracteristicas, idCaracteristica);
    const nombreCaracteristica = getCaracteristicaNombreById(idCaracteristica);
    const evaluable = idCaracteristica > 0 && minimo > 0 && Number.isFinite(actual);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= minimo : false,
        razonFail: `Característica mínima no cumplida (${nombreCaracteristica} >= ${minimo})`,
        razonUnknown: 'Prerrequisito de característica con formato no reconocido',
    };
}

function buildEvaluacionRaza(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idRaza = parseId(entry, ['Id_raza', 'id_raza', 'IdRaza', 'idRaza']);
    const nombreRaza = parseText(entry, ['Raza', 'raza', 'Nombre', 'nombre']);
    const nombreObjetivo = `${nombreRaza ?? ''}`.trim() || (idRaza > 0 ? `Raza ${idRaza}` : 'Raza requerida');
    const evaluable = idRaza > 0 || normalizarTextoPrerrequisito(nombreRaza).length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? existeCoincidenciaClaveEntidad(ctx.identidad.razas, idRaza, nombreRaza) : false,
        razonFail: `Raza requerida no cumplida: ${nombreObjetivo}`,
        razonUnknown: 'Prerrequisito de raza con formato no reconocido',
    };
}

function buildEvaluacionIdioma(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idIdioma = parseId(entry, ['Id_idioma', 'id_idioma', 'Id', 'id']);
    const nombreIdioma = parseText(entry, ['Idioma', 'idioma', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreIdioma);
    const nombreObjetivo = resolverNombrePorId(idIdioma, nombreIdioma, ctx.catalogoIdiomas, 'Idioma');
    const evaluable = idIdioma > 0 || nombreNorm.length > 0;
    const cumple = ctx.idiomas.some((idioma) => {
        if (idIdioma > 0 && toNumber(idioma.id) === idIdioma)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(idioma.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: `Idioma requerido no encontrado: ${nombreObjetivo}`,
        razonUnknown: 'Prerrequisito de idioma con formato no reconocido',
    };
}

function buildEvaluacionHabilidad(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idHabilidad = parseId(entry, ['Id_habilidad', 'id_habilidad', 'Id', 'id']);
    const nombreHabilidad = parseText(entry, ['Habilidad', 'habilidad', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreHabilidad);
    const minimo = toNumber(pick(entry, ['Cantidad', 'cantidad', 'Valor', 'valor']));
    const requiereExtra = toBoolean(pick(entry, ['Requiere_extra', 'requiere_extra']));
    const evaluable = (idHabilidad > 0 || nombreNorm.length > 0) && minimo > 0;
    const nombreObjetivo = resolverNombrePorId(idHabilidad, nombreHabilidad, ctx.catalogoHabilidades, 'Habilidad');

    const habilidad = ctx.habilidades.find((item) => {
        if (idHabilidad > 0 && toNumber(item.id) === idHabilidad)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(item.nombre) === nombreNorm;
    });
    const rangos = toNumber(habilidad?.rangos);
    const extra = normalizarTextoPrerrequisito(habilidad?.extra ?? '');
    const cumpleExtra = !requiereExtra || extra.length > 0;

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? rangos >= minimo && cumpleExtra : false,
        razonFail: `Rangos mínimos no cumplidos en ${nombreObjetivo} (${minimo})`,
        razonUnknown: 'Prerrequisito de habilidad con formato no reconocido',
    };
}

function buildEvaluacionNivelClase(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idClase = parseId(entry, ['Id_clase', 'id_clase', 'IdClase', 'idClase']);
    const nombreClase = parseText(entry, ['Clase', 'clase', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreClase);
    const nivel = toNumber(pick(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad']));
    const nombreObjetivo = resolverNombrePorId(idClase, nombreClase, ctx.catalogoClases, 'Clase');
    const evaluable = (idClase > 0 || nombreNorm.length > 0) && nivel > 0;
    const cumple = ctx.nivelesClase.some((clase) => {
        const coincideClase = (idClase > 0 && toNumber(clase.id) === idClase)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(clase.nombre) === nombreNorm);
        if (!coincideClase)
            return false;
        return toNumber(clase.nivel) >= nivel;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: `Nivel de clase requerido no cumplido: ${nombreObjetivo} ${nivel}`,
        razonUnknown: 'Prerrequisito nivel_de_clase con formato no reconocido',
    };
}

function buildEvaluacionAlineamiento(
    entry: Record<string, any>,
    idAlineamientoActual: number,
    prohibido: boolean
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idAlineamiento = parseId(entry, ['Id_alineamiento', 'id_alineamiento', 'Id', 'id', 'i']);
    const nombreAlineamiento = parseText(entry, ['Alineamiento', 'alineamiento', 'Nombre', 'nombre']);
    const requerido = idAlineamiento > 0 ? idAlineamiento : getAlineamientoBasicoIdPorNombre(nombreAlineamiento);
    const evaluable = requerido > 0 && idAlineamientoActual > 0;
    const coincide = evaluable ? idAlineamientoActual === requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple: prohibido ? !coincide : coincide,
        razonFail: prohibido
            ? 'Alineamiento prohibido'
            : 'Alineamiento requerido no cumplido',
        razonUnknown: 'Prerrequisito de alineamiento con formato no reconocido',
    };
}

function buildEvaluacionClaseEspecial(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEspecial = parseId(entry, ['Id_especial', 'id_especial', 'IdClaseEspecial', 'idClaseEspecial', 'Id', 'id', 'i']);
    const nombreEspecial = parseText(entry, ['Clase_especial', 'clase_especial', 'Especial', 'especial', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreEspecial);
    const idExtraReq = parseIdOpcional(entry, ['Id_extra', 'id_extra', 'IdExtra', 'idExtra', 'e']);
    const evaluable = idEspecial > 0 || nombreNorm.length > 0;
    const claseas = ctx.claseas ?? [];
    const cumple = claseas.some((especial) => {
        const coincide = (idEspecial > 0 && toNumber(especial.id) === idEspecial)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(especial.nombre) === nombreNorm);
        if (!coincide)
            return false;
        if (!Number.isFinite(idExtraReq))
            return true;
        if (idExtraReq === 0)
            return true;
        if (idExtraReq < 0)
            return toNumber(especial.idExtra) <= 0;
        return toNumber(especial.idExtra) === idExtraReq;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: 'Clase especial requerida no encontrada',
        razonUnknown: 'Prerrequisito clase_especial con formato no reconocido',
    };
}

function buildEvaluacionCompetencia(
    entry: Record<string, any>,
    actuales: Array<{ id: number | null; nombre: string; }>,
    idKeys: string[],
    nombreKeys: string[],
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idReq = parseId(entry, idKeys);
    const nombreReq = parseText(entry, nombreKeys);
    const nombreReqNorm = normalizarTextoPrerrequisito(nombreReq);
    const evaluable = idReq > 0 || nombreReqNorm.length > 0;
    const cumple = (actuales ?? []).some((actual) => {
        if (idReq > 0 && toNumber(actual.id) === idReq)
            return true;
        return nombreReqNorm.length > 0 && normalizarTextoPrerrequisito(actual.nombre) === nombreReqNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionDominio(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDominio = parseId(entry, ['Id_dominio', 'id_dominio', 'Id', 'id', 'i']);
    const nombreDominio = parseText(entry, ['Dominio', 'dominio', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreDominio);
    const dominios = ctx.dominios ?? [];
    const evaluable = idDominio > 0 || nombreNorm.length > 0;
    const cumple = dominios.some((dominio) => {
        if (idDominio > 0 && toNumber(dominio.id) === idDominio)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(dominio.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: 'Dominio requerido no encontrado',
        razonUnknown: 'Prerrequisito dominio con formato no reconocido',
    };
}

function buildEvaluacionDg(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const actual = Math.max(0, Math.trunc(toNumber(ctx.dgTotal)));
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= requerido : false,
        razonFail: `DG insuficientes (${actual} < ${requerido})`,
        razonUnknown: 'Prerrequisito dg con formato no reconocido',
    };
}

function buildEvaluacionEscuelaNivel(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuelaReq = parseId(entry, ['Id_escuela', 'id_escuela', 'IdEscuela', 'idEscuela', 'Id', 'id', 'i']);
    const nombreEscuelaReq = parseText(entry, ['Escuela', 'escuela', 'Nombre', 'nombre']);
    const nombreEscuelaReqNorm = normalizarTextoPrerrequisito(nombreEscuelaReq);
    const nivelReq = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c', 'n']);
    const escuelaEspecialista = ctx.escuelaEspecialista;
    const idEscuelaActual = toNumber(escuelaEspecialista?.id);
    const nombreEscuelaActualNorm = normalizarTextoPrerrequisito(escuelaEspecialista?.nombre ?? '');
    const nivelArcanoActual = toNumber(escuelaEspecialista?.nivelArcano ?? ctx.lanzador.arcano);
    const tieneEscuelaReq = idEscuelaReq > 0 || nombreEscuelaReqNorm.length > 0;
    const tieneEscuelaActual = idEscuelaActual > 0 || nombreEscuelaActualNorm.length > 0;
    const evaluable = Number.isFinite(nivelReq) && tieneEscuelaReq && tieneEscuelaActual;
    const coincideEscuela = idEscuelaReq > 0
        ? (idEscuelaActual > 0
            ? idEscuelaActual === idEscuelaReq
            : (nombreEscuelaReqNorm.length > 0 && nombreEscuelaActualNorm === nombreEscuelaReqNorm))
        : nombreEscuelaReqNorm.length > 0 && nombreEscuelaActualNorm === nombreEscuelaReqNorm;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? coincideEscuela && nivelArcanoActual >= nivelReq : false,
        razonFail: 'Nivel de escuela requerido no cumplido',
        razonUnknown: 'Prerrequisito escuela_nivel con formato no reconocido',
    };
}

function buildEvaluacionNumeroMinimo(
    entry: Record<string, any>,
    actual: number,
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= requerido : false,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionNumeroMaximo(
    entry: Record<string, any>,
    actual: number,
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual <= requerido : false,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionTamano(entry: Record<string, any>, ctx: DoteEvaluacionContexto, maximo: boolean): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseId(entry, ['Id_tamano', 'id_tamano', 'IdTamano', 'idTamano', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const actual = Math.trunc(toNumber(ctx.tamanoId));
    const evaluable = requerido > 0 && actual > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? (maximo ? actual <= requerido : actual >= requerido) : false,
        razonFail: maximo ? 'No cumple tamaño máximo' : 'No cumple tamaño mínimo',
        razonUnknown: maximo
            ? 'Prerrequisito tamano_maximo con formato no reconocido'
            : 'Prerrequisito tamano_minimo con formato no reconocido',
    };
}

function buildEvaluacionTipoCriatura(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const tipoIdReq = parseId(entry, ['Id_tipo', 'id_tipo', 'Id_tipo_criatura', 'id_tipo_criatura', 'Id', 'id', 'i']);
    const tipoNombreReq = parseText(entry, ['Tipo', 'tipo', 'Tipo_criatura', 'tipo_criatura', 'Nombre', 'nombre']);
    const tipoNombreReqNorm = normalizarTextoPrerrequisito(tipoNombreReq);
    const tipoActualId = Math.trunc(toNumber(ctx.tipoCriaturaId));
    const tipoActualNombreNorm = normalizarTextoPrerrequisito(ctx.tipoCriaturaNombre ?? '');
    const evaluable = (tipoIdReq > 0 || tipoNombreReqNorm.length > 0)
        && (tipoActualId > 0 || tipoActualNombreNorm.length > 0);
    const cumplePorId = tipoIdReq > 0 && tipoActualId > 0 && tipoActualId === tipoIdReq;
    const cumplePorNombre = tipoNombreReqNorm.length > 0
        && tipoActualNombreNorm.length > 0
        && tipoNombreReqNorm === tipoActualNombreNorm;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? (cumplePorId || cumplePorNombre) : false,
        razonFail: 'Tipo de criatura requerido no cumplido',
        razonUnknown: 'Prerrequisito tipo_criatura con formato no reconocido',
    };
}

function buildEvaluacionTipoDote(
    entry: Record<string, any>,
    ctx: DoteEvaluacionContexto,
    razonFail: string,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idTipoReq = parseId(entry, ['Id_tipo', 'id_tipo', 'IdTipo', 'idTipo', 'Id', 'id', 'i']);
    const nombreTipoReq = parseText(entry, ['Tipo', 'tipo', 'Tipo_dote', 'tipo_dote', 'Nombre', 'nombre']);
    const nombreTipoReqNorm = normalizarTextoPrerrequisito(nombreTipoReq);
    const evaluable = idTipoReq > 0 || nombreTipoReqNorm.length > 0;
    const tipos = ctx.tiposDote ?? [];
    const cumple = tipos.some((tipo) => {
        if (idTipoReq > 0 && toNumber(tipo.id) === idTipoReq)
            return true;
        return nombreTipoReqNorm.length > 0 && normalizarTextoPrerrequisito(tipo.nombre) === nombreTipoReqNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail,
        razonUnknown,
    };
}

function buildEvaluacionRegion(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idRegionReq = parseId(entry, ['Id_region', 'id_region', 'IdRegion', 'idRegion', 'Id', 'id', 'i']);
    const nombreRegionReq = parseText(entry, ['Region', 'region', 'Nombre', 'nombre']);
    const nombreRegionReqNorm = normalizarTextoPrerrequisito(nombreRegionReq);
    const regionIdRaw = ctx.region?.id as any;
    const regionIdActual = toNumber(regionIdRaw);
    const regionIdConocido = regionIdRaw !== null
        && regionIdRaw !== undefined
        && `${regionIdRaw}`.trim().length > 0
        && Number.isFinite(Number(regionIdRaw));
    const regionNombreActualNorm = normalizarTextoPrerrequisito(ctx.region?.nombre ?? '');
    const catalogoRegiones = ctx.catalogoRegiones ?? [];
    const nombreRegionReqCatalogoNorm = normalizarTextoPrerrequisito(
        idRegionReq > 0
            ? catalogoRegiones.find((item) => toNumber(item.id) === idRegionReq)?.nombre ?? ''
            : ''
    );
    const nombreRegionActualCatalogoNorm = normalizarTextoPrerrequisito(
        regionIdActual > 0
            ? catalogoRegiones.find((item) => toNumber(item.id) === regionIdActual)?.nombre ?? ''
            : ''
    );
    const nombreReqEfectivoNorm = nombreRegionReqNorm.length > 0
        ? nombreRegionReqNorm
        : nombreRegionReqCatalogoNorm;
    const nombreActualEfectivoNorm = regionNombreActualNorm.length > 0
        ? regionNombreActualNorm
        : nombreRegionActualCatalogoNorm;
    const prerequisitoConocido = idRegionReq > 0 || nombreReqEfectivoNorm.length > 0;
    const contextoConocido = regionIdConocido || nombreActualEfectivoNorm.length > 0;
    const evaluable = prerequisitoConocido && contextoConocido;
    const cumple = (idRegionReq > 0 && regionIdConocido && regionIdActual > 0 && regionIdActual === idRegionReq)
        || (nombreReqEfectivoNorm.length > 0
            && nombreActualEfectivoNorm.length > 0
            && nombreActualEfectivoNorm === nombreReqEfectivoNorm);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: 'Región requerida no cumplida',
        razonUnknown: 'Prerrequisito region con formato no reconocido',
    };
}

function buildEvaluacionInherente(entry: Record<string, any>): EvaluacionItem {
    return {
        grupoOpcional: parseOpcional(entry),
        evaluable: true,
        cumple: true,
        razonFail: '',
        razonUnknown: '',
    };
}

function buildEvaluacionLanzador(
    entry: Record<string, any>,
    nivelActual: number,
    tipo: 'arcano' | 'divino' | 'psionico'
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const nivelRequerido = toNumber(pick(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad']));
    const evaluable = nivelRequerido > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? nivelActual >= nivelRequerido : false,
        razonFail: `Nivel de lanzador ${tipo} insuficiente`,
        razonUnknown: `Prerrequisito lanzador_${tipo} con formato no reconocido`,
    };
}

function buildEvaluacionConjuroEscuela(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuela = parseId(entry, ['Id_escuela', 'id_escuela', 'IdEscuela', 'idEscuela']);
    const escuela = parseText(entry, ['Escuela', 'escuela', 'Nombre', 'nombre']);
    const escuelaNorm = normalizarTextoPrerrequisito(escuela);
    const cantidad = Math.max(1, Math.trunc(toNumber(pick(entry, ['Cantidad', 'cantidad', 'Nivel', 'nivel']))));
    const evaluable = (idEscuela > 0 || escuelaNorm.length > 0) && cantidad > 0;
    const total = ctx.conjuros.reduce((acc, conjuro) => {
        const coincideEscuela = (idEscuela > 0 && toNumber(conjuro.idEscuela) === idEscuela)
            || (escuelaNorm.length > 0 && normalizarTextoPrerrequisito(conjuro.escuela) === escuelaNorm);
        return coincideEscuela ? acc + 1 : acc;
    }, 0);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? total >= cantidad : false,
        razonFail: 'Conjuros de escuela insuficientes',
        razonUnknown: 'Prerrequisito conjuros_escuela con formato no reconocido',
    };
}

function buildEvaluacionLanzEspontaneo(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idConjuro = parseId(entry, ['Id_conjuro', 'id_conjuro', 'IdConjuro', 'idConjuro']);
    const nombreConjuro = parseText(entry, ['Conjuro', 'conjuro', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreConjuro);
    const evaluable = idConjuro > 0 || nombreNorm.length > 0;
    const cumple = ctx.conjuros.some((conjuro) => {
        if (idConjuro > 0 && toNumber(conjuro.id) === idConjuro)
            return true;
        return nombreNorm.length > 0 && normalizarTextoPrerrequisito(conjuro.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: 'Conjuro espontáneo requerido no encontrado',
        razonUnknown: 'Prerrequisito lanz_espontaneo con formato no reconocido',
    };
}

function buildEvaluacionSalvacion(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const fortReq = Math.max(0, toNumber(entry?.['Fortaleza']));
    const reflReq = Math.max(0, toNumber(entry?.['Reflejos']));
    const volReq = Math.max(0, toNumber(entry?.['Voluntad']));
    const evaluable = fortReq > 0 || reflReq > 0 || volReq > 0;
    const cumple = (!evaluable)
        ? false
        : toNumber(ctx.salvaciones.fortaleza) >= fortReq
        && toNumber(ctx.salvaciones.reflejos) >= reflReq
        && toNumber(ctx.salvaciones.voluntad) >= volReq;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonFail: 'Salvación mínima no cumplida',
        razonUnknown: 'Prerrequisito salvacion_minimo con formato no reconocido',
    };
}

function buildEvaluacionActitud(
    entry: Record<string, any>,
    idAlineamiento: number,
    prohibido: boolean
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idActitud = parseId(entry, ['Id_actitud', 'id_actitud', 'Id', 'id']);
    const nombreActitud = getActitudNombreById(idActitud);
    const evaluable = idActitud > 0 && idAlineamiento > 0;
    const coincide = evaluable ? cumpleActitud(idActitud, idAlineamiento) : false;
    return {
        grupoOpcional,
        evaluable,
        cumple: prohibido ? !coincide : coincide,
        razonFail: prohibido
            ? `Actitud prohibida: ${nombreActitud}`
            : `Actitud requerida no cumplida: ${nombreActitud}`,
        razonUnknown: 'Prerrequisito de actitud con formato no reconocido',
    };
}

function buildEvaluacionCompArma(
    entry: Record<string, any>,
    ctx: DoteEvaluacionContexto,
    idExtraSeleccionado: number,
    extraSeleccionado: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idArma = parseId(entry, ['Id_arma', 'id_arma', 'IdArma', 'idArma']);
    const arma = parseText(entry, ['Arma', 'arma', 'Nombre', 'nombre']);
    const armaNorm = normalizarTextoPrerrequisito(arma);
    const esElegir = armaNorm === 'elegir' || armaNorm.length < 1 || idArma <= 0;

    if (esElegir && idExtraSeleccionado <= 0 && normalizarTextoPrerrequisito(extraSeleccionado).length < 1) {
        return {
            grupoOpcional,
            evaluable: true,
            cumple: true,
            razonFail: 'No tiene competencia con el arma requerida',
            razonUnknown: 'Prerrequisito competencia_arma con formato no reconocido',
        };
    }

    const idObjetivo = esElegir ? Math.max(0, toNumber(idExtraSeleccionado)) : idArma;
    const nombreObjetivo = esElegir ? `${extraSeleccionado ?? ''}`.trim() : arma;
    const nombreObjetivoNorm = normalizarTextoPrerrequisito(nombreObjetivo);

    const evaluable = idObjetivo > 0 || nombreObjetivoNorm.length > 0;
    const cumple = ctx.competenciasArmas.some((comp) => {
        if (idObjetivo > 0 && toNumber(comp.id) === idObjetivo)
            return true;
        return nombreObjetivoNorm.length > 0 && normalizarTextoPrerrequisito(comp.nombre) === nombreObjetivoNorm;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonFail: 'No tiene competencia con el arma requerida',
        razonUnknown: 'Prerrequisito competencia_arma con formato no reconocido',
    };
}

function buildEvaluacionDote(
    entry: Record<string, any>,
    ctx: DoteEvaluacionContexto,
    idExtraSeleccionado: number,
    extraSeleccionado: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDoteReq = parseId(entry, ['Id_dote_prerrequisito', 'id_dote_prerrequisito', 'Id_dote', 'id_dote', 'Id', 'id']);
    const nombreDoteReq = parseText(entry, ['Dote_prerrequisito', 'dote_prerrequisito', 'Dote', 'dote', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTextoPrerrequisito(nombreDoteReq);
    const rawIdExtraReq = pick(entry, ['Id_extra', 'id_extra', 'IdExtra', 'idExtra', 'e']);
    const idExtraReq = rawIdExtraReq === undefined || rawIdExtraReq === null || `${rawIdExtraReq}`.trim().length < 1
        ? Number.NaN
        : Math.trunc(toNumber(rawIdExtraReq));
    const repetidoReq = Math.max(0, Math.trunc(toNumber(pick(entry, ['Repetido', 'repetido', 'r']))));
    const cantidadReq = repetidoReq > 0 ? repetidoReq : 1;
    const nombreObjetivo = resolverNombrePorId(idDoteReq, nombreDoteReq, ctx.catalogoDotes, 'Dote');
    const evaluable = idDoteReq > 0 || nombreNorm.length > 0;

    const coincidencias = ctx.dotes.filter((dote) => {
        const coincideDote = (idDoteReq > 0 && toNumber(dote.id) === idDoteReq)
            || (nombreNorm.length > 0 && normalizarTextoPrerrequisito(dote.nombre) === nombreNorm);
        if (!coincideDote)
            return false;

        if (Number.isNaN(idExtraReq))
            return true;
        if (idExtraReq < 0)
            return toNumber(dote.idExtra) <= 0;
        if (idExtraReq > 0)
            return toNumber(dote.idExtra) === idExtraReq;

        if (idExtraSeleccionado > 0)
            return toNumber(dote.idExtra) === idExtraSeleccionado;

        const extraSelNorm = normalizarTextoPrerrequisito(extraSeleccionado);
        if (extraSelNorm.length > 0)
            return normalizarTextoPrerrequisito(dote.extra) === extraSelNorm;

        return true;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? coincidencias.length >= cantidadReq : false,
        razonFail: `Dote prerrequisito no cumplida: ${nombreObjetivo}`,
        razonUnknown: 'Prerrequisito de dote con formato no reconocido',
    };
}

function evaluateFamily(
    key: string,
    entries: Record<string, any>[],
    ctx: DoteEvaluacionContexto,
    idExtraSeleccionado: number,
    extraSeleccionado: string,
    idAlineamiento: number
): EvaluacionItem[] {
    if (entries.length < 1)
        return [];

    const keyNorm = normalizarClavePrerrequisito(key);

    if (keyNorm === 'ataque_base')
        return entries.map((entry) => buildEvaluacionAtaqueBase(entry, toNumber(ctx.ataqueBase)));
    if (keyNorm === 'caracteristica')
        return entries.map((entry) => buildEvaluacionCaracteristica(entry, ctx));
    if (keyNorm === 'raza')
        return entries.map((entry) => buildEvaluacionRaza(entry, ctx));
    if (keyNorm === 'idioma')
        return entries.map((entry) => buildEvaluacionIdioma(entry, ctx));
    if (keyNorm === 'habilidad')
        return entries.map((entry) => buildEvaluacionHabilidad(entry, ctx));
    if (keyNorm === 'nivel_de_clase')
        return entries.map((entry) => buildEvaluacionNivelClase(entry, ctx));
    if (keyNorm === 'alineamiento_requerido')
        return entries.map((entry) => buildEvaluacionAlineamiento(entry, idAlineamiento, false));
    if (keyNorm === 'alineamiento_prohibido')
        return entries.map((entry) => buildEvaluacionAlineamiento(entry, idAlineamiento, true));
    if (keyNorm === 'actitud_prohibido')
        return entries.map((entry) => buildEvaluacionActitud(entry, idAlineamiento, true));
    if (keyNorm === 'actitud_requerido')
        return entries.map((entry) => buildEvaluacionActitud(entry, idAlineamiento, false));
    if (keyNorm === 'clase_especial')
        return entries.map((entry) => buildEvaluacionClaseEspecial(entry, ctx));
    if (keyNorm === 'competencia_arma')
        return entries.map((entry) => buildEvaluacionCompArma(entry, ctx, idExtraSeleccionado, extraSeleccionado));
    if (keyNorm === 'competencia_armadura') {
        return entries.map((entry) => buildEvaluacionCompetencia(
            entry,
            ctx.competenciasArmaduras ?? [],
            ['Id_armadura', 'id_armadura', 'IdArmadura', 'idArmadura', 'Id', 'id', 'i'],
            ['Armadura', 'armadura', 'Nombre', 'nombre'],
            'No tiene competencia con la armadura requerida',
            'Prerrequisito competencia_armadura con formato no reconocido'
        ));
    }
    if (keyNorm === 'competencia_grupo_arma') {
        return entries.map((entry) => buildEvaluacionCompetencia(
            entry,
            ctx.competenciasGrupoArmas ?? [],
            ['Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'Id', 'id', 'i'],
            ['Grupo', 'grupo', 'Nombre', 'nombre'],
            'No tiene competencia con el grupo de arma requerido',
            'Prerrequisito competencia_grupo_arma con formato no reconocido'
        ));
    }
    if (keyNorm === 'competencia_grupo_armadura') {
        return entries.map((entry) => buildEvaluacionCompetencia(
            entry,
            ctx.competenciasGrupoArmaduras ?? [],
            ['Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'Id', 'id', 'i'],
            ['Grupo', 'grupo', 'Nombre', 'nombre'],
            'No tiene competencia con el grupo de armadura requerido',
            'Prerrequisito competencia_grupo_armadura con formato no reconocido'
        ));
    }
    if (keyNorm === 'dg')
        return entries.map((entry) => buildEvaluacionDg(entry, ctx));
    if (keyNorm === 'dominio')
        return entries.map((entry) => buildEvaluacionDominio(entry, ctx));
    if (keyNorm === 'dote')
        return entries.map((entry) => buildEvaluacionDote(entry, ctx, idExtraSeleccionado, extraSeleccionado));
    if (keyNorm === 'escuela_nivel')
        return entries.map((entry) => buildEvaluacionEscuelaNivel(entry, ctx));
    if (keyNorm === 'inherente')
        return entries.map((entry) => buildEvaluacionInherente(entry));
    if (keyNorm === 'lanzador_arcano')
        return entries.map((entry) => buildEvaluacionLanzador(entry, toNumber(ctx.lanzador.arcano), 'arcano'));
    if (keyNorm === 'lanzador_divino')
        return entries.map((entry) => buildEvaluacionLanzador(entry, toNumber(ctx.lanzador.divino), 'divino'));
    if (keyNorm === 'lanzador_psionico')
        return entries.map((entry) => buildEvaluacionLanzador(entry, toNumber(ctx.lanzador.psionico), 'psionico'));
    if (keyNorm === 'lanzar_conjuros_arcanos_nivel') {
        return entries.map((entry) => buildEvaluacionNumeroMinimo(
            entry,
            toNumber(ctx.nivelesConjuroMaximos?.arcano),
            'No puede lanzar conjuros arcanos del nivel requerido',
            'Prerrequisito lanzar_conjuros_arcanos_nivel con formato no reconocido'
        ));
    }
    if (keyNorm === 'lanzar_conjuros_divinos_nivel') {
        return entries.map((entry) => buildEvaluacionNumeroMinimo(
            entry,
            toNumber(ctx.nivelesConjuroMaximos?.divino),
            'No puede lanzar conjuros divinos del nivel requerido',
            'Prerrequisito lanzar_conjuros_divinos_nivel con formato no reconocido'
        ));
    }
    if (keyNorm === 'conjuros_escuela')
        return entries.map((entry) => buildEvaluacionConjuroEscuela(entry, ctx));
    if (keyNorm === 'lanz_espontaneo')
        return entries.map((entry) => buildEvaluacionLanzEspontaneo(entry, ctx));
    if (keyNorm === 'limite_tipo_dote')
        return entries.map((entry) => buildEvaluacionTipoDote(entry, ctx, 'Límite de tipo de dote no cumplido', 'Prerrequisito limite_tipo_dote con formato no reconocido'));
    if (keyNorm === 'nivel')
        return entries.map((entry) => buildEvaluacionNumeroMinimo(entry, toNumber(ctx.nivelTotal), 'Nivel insuficiente', 'Prerrequisito nivel con formato no reconocido'));
    if (keyNorm === 'nivel_max')
        return entries.map((entry) => buildEvaluacionNumeroMaximo(entry, toNumber(ctx.nivelTotal), 'Supera el nivel máximo permitido', 'Prerrequisito nivel_max con formato no reconocido'));
    if (keyNorm === 'region')
        return entries.map((entry) => buildEvaluacionRegion(entry, ctx));
    if (keyNorm === 'salvacion_minimo')
        return entries.map((entry) => buildEvaluacionSalvacion(entry, ctx));
    if (keyNorm === 'tamano_maximo')
        return entries.map((entry) => buildEvaluacionTamano(entry, ctx, true));
    if (keyNorm === 'tamano_minimo')
        return entries.map((entry) => buildEvaluacionTamano(entry, ctx, false));
    if (keyNorm === 'tipo_criatura')
        return entries.map((entry) => buildEvaluacionTipoCriatura(entry, ctx));
    if (keyNorm === 'tipo_dote')
        return entries.map((entry) => buildEvaluacionTipoDote(entry, ctx, 'Tipo de dote requerido no cumplido', 'Prerrequisito tipo_dote con formato no reconocido'));
    if (keyNorm === 'poder_seleccionar_companero') {
        return entries.map((entry) => ({
            grupoOpcional: parseOpcional(entry),
            evaluable: true,
            cumple: !!ctx.puedeSeleccionarCompanero,
            razonFail: 'No puede seleccionar compañero animal',
            razonUnknown: 'Prerrequisito poder_seleccionar_companero no interpretable',
        }));
    }
    if (keyNorm === 'poder_seleccionar_familiar') {
        return entries.map((entry) => ({
            grupoOpcional: parseOpcional(entry),
            evaluable: true,
            cumple: !!ctx.puedeSeleccionarFamiliar,
            razonFail: 'No puede seleccionar familiar',
            razonUnknown: 'Prerrequisito poder_seleccionar_familiar no interpretable',
        }));
    }

    return entries.map((entry) => ({
        grupoOpcional: parseOpcional(entry),
        evaluable: false,
        cumple: false,
        razonFail: `Prerrequisito no soportado: ${key}`,
        razonUnknown: `Prerrequisito no soportado: ${key}`,
    }));
}

export function evaluarElegibilidadDote(input: DoteEvaluacionInput): DoteEvaluacionResultado {
    const dote = input?.dote;
    const ctx = input?.contexto;
    if (!dote || !ctx) {
        return {
            estado: 'blocked_unknown',
            razones: ['No se pudo evaluar la dote seleccionada'],
            advertencias: [],
        };
    }

    const fail: string[] = [];
    const unknown: string[] = [];
    const advertencias: string[] = [];
    const gruposOpcionales = new Map<number, GrupoOpcionalEstado>();
    const prerrequisitos = (dote?.Prerrequisitos ?? {}) as Record<string, any>;
    const idExtraSeleccionado = Math.max(0, Math.trunc(toNumber(input?.idExtraSeleccionado)));
    const extraSeleccionado = `${input?.extraSeleccionado ?? ''}`.trim();
    const idAlineamiento = parseAlineamientoId(ctx.alineamiento);

    Object.keys(prerrequisitos).forEach((key) => {
        const entries = toArray<Record<string, any>>(prerrequisitos[key]);
        if (entries.length < 1)
            return;

        const evaluaciones = evaluateFamily(
            key,
            entries,
            ctx,
            idExtraSeleccionado,
            extraSeleccionado,
            idAlineamiento
        );
        evaluaciones.forEach((evaluacion) => {
            registrarEvaluacion(evaluacion, gruposOpcionales, fail, unknown);
        });
    });

    resolverGruposOpcionales(gruposOpcionales, fail, unknown);
    const failDedupe = dedupeTextList(fail);
    const unknownDedupe = dedupeTextList(unknown);

    if (unknownDedupe.length > 0) {
        return {
            estado: 'blocked_unknown',
            razones: unknownDedupe,
            advertencias,
        };
    }

    if (failDedupe.length > 0) {
        return {
            estado: 'blocked_failed',
            razones: failDedupe,
            advertencias,
        };
    }

    return {
        estado: 'eligible',
        razones: [],
        advertencias,
    };
}
