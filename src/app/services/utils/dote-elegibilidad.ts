import { Dote } from 'src/app/interfaces/dote';
import { valorCaracteristicaPorId } from './caracteristicas';
import {
    ClaveEntidadPrerrequisito,
    IdentidadPrerrequisitos,
    existeCoincidenciaClaveEntidad,
} from './identidad-prerrequisitos';
import { getAlineamientoBasicoIdPorNombre, idBasicoDePrerrequisitoAlineamiento } from './alineamiento-contrato';
import { normalizarTexto, textosUnicos, toArray, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { leerComodin } from './comodin';
import { frasePrerrequisito } from './prerrequisito-frase';
import { EvaluacionPrerrequisito, MotivosPrerrequisitos, compararActitud, compararTamano, cumpleExtraPedido, evaluarAptitudEspecial } from './prerrequisitos-evaluacion';
import { CLAVES_PRERREQUISITOS_INCARNUM, IncarnumPrerrequisitos, cumplePrerrequisitoIncarnum, incarnumParaPrerrequisitos } from './incarnum';

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
    /** Los raciales del personaje (los de su raza), para `aptitud_especial`. */
    raciales?: ClaveEntidadPrerrequisito[];
    /** Las plantillas del personaje, para `aptitud_especial`. */
    plantillas?: ClaveEntidadPrerrequisito[];
    dominios?: Array<{ id: number | null; nombre: string; }>;
    idiomas: Array<{ id: number | null; nombre: string; }>;
    habilidades: Array<{ id: number | null; nombre: string; rangos: number; extra: string; }>;
    conjuros: Array<{ id: number | null; nombre: string; idEscuela: number | null; escuela: string; }>;
    conjurosAccesibles?: Array<{ id: number | null; nombre: string; idEscuela: number | null; escuela: string; }>;
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
    /**
     * La salvación base que dan las clases, sin la característica ni otros modificadores: `salvacion_minimo` se compara
     * con ella (decisión del propietario del 2026-10-25).
     */
    salvacionesBase: {
        fortaleza: number;
        reflejos: number;
        voluntad: number;
    };
    alineamiento: string;
    puedeSeleccionarCompanero: boolean;
    puedeSeleccionarFamiliar: boolean;
    catalogoRegiones?: Array<{ id: number | null; nombre: string; }>;
    /** Magic of Incarnum: reserva, nivel de moldeador, fusiones, vínculos y chakras que puede vincular. */
    incarnum?: IncarnumPrerrequisitos;
    /** La reserva psiónica (`reserva_psionica`, también en las dotes desde Magic of Incarnum). */
    reservaPsionica?: number;
    /** El nivel de poder psiónico más alto que manifiesta (`lanzar_poder_psionico_nivel`). */
    nivelPoderPsionicoMaximo?: number;
}

/**
 * Las dotes del personaje y, detrás de cada una, las dotes a las que sustituye en los prerrequisitos (`Cuenta_como`:
 * Dureza azur cuenta como Dureza), con el mismo extra. `doteDelCatalogo` da la ficha completa de una dote por su id.
 */
export function dotesConCuentaComo<T extends { id: number | null; nombre: string; }>(
    dotes: T[],
    doteDelCatalogo: (id: number) => Dote | null | undefined,
): T[] {
    const sustituidas = dotes.flatMap((dote) => (dote.id ? doteDelCatalogo(dote.id)?.Cuenta_como ?? [] : [])
        .filter((otra) => otra.Id > 0)
        .map((otra) => ({ ...dote, id: otra.Id, nombre: otra.Nombre })));
    return [...dotes, ...sustituidas];
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

type EvaluacionItem = Omit<EvaluacionPrerrequisito, 'frase'>;

function pick(entry: Record<string, any>, keys: string[]): any {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(entry, key))
            return entry[key];
    }
    return undefined;
}

function parseOpcional(entry: Record<string, any>): number {
    const raw = pick(entry, ['Opcional', 'opcional', 'o', 'O']);
    return Math.max(0, toInt(raw));
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

function parseText(entry: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
        const value = `${entry?.[key] ?? ''}`.trim();
        if (value.length > 0)
            return value;
    }
    return '';
}

function normalizarClavePrerrequisito(key: string): string {
    return normalizarTexto(`${key ?? ''}`).replace(/\s+/g, '_');
}

function buildEvaluacionAtaqueBase(entry: Record<string, any>, ataqueBase: number): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = toNumber(pick(entry, ['Ataque_base', 'ataque_base', 'Cantidad', 'cantidad', 'Valor', 'valor']));
    const evaluable = Number.isFinite(requerido) && requerido > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? ataqueBase >= requerido : false,
        razonUnknown: 'Prerrequisito de ataque base con formato no reconocido',
    };
}

function buildEvaluacionCaracteristica(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idCaracteristica = parseId(entry, ['Id_caracteristica', 'id_caracteristica', 'Id', 'id']);
    const minimo = toNumber(pick(entry, ['Cantidad', 'cantidad', 'Valor', 'valor']));
    const actual = valorCaracteristicaPorId(ctx.caracteristicas, idCaracteristica);
    const evaluable = idCaracteristica > 0 && minimo > 0 && Number.isFinite(actual);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= minimo : false,
        razonUnknown: 'Prerrequisito de característica con formato no reconocido',
    };
}

function buildEvaluacionRaza(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idRaza = parseId(entry, ['Id_raza', 'id_raza', 'IdRaza', 'idRaza']);
    const nombreRaza = parseText(entry, ['Raza', 'raza', 'Nombre', 'nombre']);
    const evaluable = idRaza > 0 || normalizarTexto(nombreRaza).length > 0;
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? existeCoincidenciaClaveEntidad(ctx.identidad.razas, idRaza, nombreRaza) : false,
        razonUnknown: 'Prerrequisito de raza con formato no reconocido',
    };
}

function buildEvaluacionIdioma(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idIdioma = parseId(entry, ['Id_idioma', 'id_idioma', 'Id', 'id']);
    const nombreIdioma = parseText(entry, ['Idioma', 'idioma', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreIdioma);
    const evaluable = idIdioma > 0 || nombreNorm.length > 0;
    const cumple = ctx.idiomas.some((idioma) => {
        if (idIdioma > 0 && toNumber(idioma.id) === idIdioma)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(idioma.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: 'Prerrequisito de idioma con formato no reconocido',
    };
}

function buildEvaluacionHabilidad(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idHabilidad = parseId(entry, ['Id_habilidad', 'id_habilidad', 'Id', 'id']);
    const nombreHabilidad = parseText(entry, ['Habilidad', 'habilidad', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreHabilidad);
    const minimo = toNumber(pick(entry, ['Cantidad', 'cantidad', 'Valor', 'valor']));
    const requiereExtra = toBoolean(pick(entry, ['Requiere_extra', 'requiere_extra']));
    const evaluable = (idHabilidad > 0 || nombreNorm.length > 0) && minimo > 0;

    const habilidad = ctx.habilidades.find((item) => {
        if (idHabilidad > 0 && toNumber(item.id) === idHabilidad)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(item.nombre) === nombreNorm;
    });
    const rangos = toNumber(habilidad?.rangos);
    const extra = normalizarTexto(habilidad?.extra ?? '');
    const cumpleExtra = !requiereExtra || extra.length > 0;

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? rangos >= minimo && cumpleExtra : false,
        razonUnknown: 'Prerrequisito de habilidad con formato no reconocido',
    };
}

function buildEvaluacionNivelClase(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idClase = parseId(entry, ['Id_clase', 'id_clase', 'IdClase', 'idClase']);
    const nombreClase = parseText(entry, ['Clase', 'clase', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreClase);
    const nivel = toNumber(pick(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad']));
    const evaluable = (idClase > 0 || nombreNorm.length > 0) && nivel > 0;
    const cumple = ctx.nivelesClase.some((clase) => {
        const coincideClase = (idClase > 0 && toNumber(clase.id) === idClase)
            || (nombreNorm.length > 0 && normalizarTexto(clase.nombre) === nombreNorm);
        if (!coincideClase)
            return false;
        return toNumber(clase.nivel) >= nivel;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: 'Prerrequisito nivel_de_clase con formato no reconocido',
    };
}

function buildEvaluacionAlineamiento(
    entry: Record<string, any>,
    idAlineamientoActual: number,
    prohibido: boolean
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    // El básico (1-9), no `Id_alineamiento` (la combinación de la tabla `alineamientos`).
    const requerido = idBasicoDePrerrequisitoAlineamiento(entry);
    const evaluable = requerido > 0 && idAlineamientoActual > 0;
    const coincide = evaluable ? idAlineamientoActual === requerido : false;
    return {
        grupoOpcional,
        evaluable,
        cumple: prohibido ? !coincide : coincide,
        razonUnknown: 'Prerrequisito de alineamiento con formato no reconocido',
    };
}

function buildEvaluacionClaseEspecial(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEspecial = parseId(entry, ['Id_especial', 'id_especial', 'IdClaseEspecial', 'idClaseEspecial', 'Id', 'id', 'i']);
    const nombreEspecial = parseText(entry, ['Clase_especial', 'clase_especial', 'Especial', 'especial', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreEspecial);
    const evaluable = idEspecial > 0 || nombreNorm.length > 0;
    const claseas = ctx.claseas ?? [];
    const cumple = claseas.some((especial) => {
        const coincide = (idEspecial > 0 && toNumber(especial.id) === idEspecial)
            || (nombreNorm.length > 0 && normalizarTexto(especial.nombre) === nombreNorm);
        return coincide && cumpleExtraPedido(entry, especial);
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: 'Prerrequisito clase_especial con formato no reconocido',
    };
}

function buildEvaluacionCompetencia(
    entry: Record<string, any>,
    actuales: Array<{ id: number | null; nombre: string; }>,
    idKeys: string[],
    nombreKeys: string[],
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idReq = parseId(entry, idKeys);
    const nombreReq = parseText(entry, nombreKeys);
    const nombreReqNorm = normalizarTexto(nombreReq);
    const evaluable = idReq > 0 || nombreReqNorm.length > 0;
    const cumple = (actuales ?? []).some((actual) => {
        if (idReq > 0 && toNumber(actual.id) === idReq)
            return true;
        return nombreReqNorm.length > 0 && normalizarTexto(actual.nombre) === nombreReqNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown,
    };
}

function buildEvaluacionDominio(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idDominio = parseId(entry, ['Id_dominio', 'id_dominio', 'Id', 'id', 'i']);
    const nombreDominio = parseText(entry, ['Dominio', 'dominio', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreDominio);
    const dominios = ctx.dominios ?? [];
    const evaluable = idDominio > 0 || nombreNorm.length > 0;
    const cumple = dominios.some((dominio) => {
        if (idDominio > 0 && toNumber(dominio.id) === idDominio)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(dominio.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown: 'Prerrequisito dominio con formato no reconocido',
    };
}

function buildEvaluacionDg(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const actual = Math.max(0, toInt(ctx.dgTotal));
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= requerido : false,
        razonUnknown: 'Prerrequisito dg con formato no reconocido',
    };
}

function buildEvaluacionEscuelaNivel(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuelaReq = parseId(entry, ['Id_escuela', 'id_escuela', 'IdEscuela', 'idEscuela', 'Id', 'id', 'i']);
    const nombreEscuelaReq = parseText(entry, ['Escuela', 'escuela', 'Nombre', 'nombre']);
    const nombreEscuelaReqNorm = normalizarTexto(nombreEscuelaReq);
    const nivelReq = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c', 'n']);
    const escuelaEspecialista = ctx.escuelaEspecialista;
    const idEscuelaActual = toNumber(escuelaEspecialista?.id);
    const nombreEscuelaActualNorm = normalizarTexto(escuelaEspecialista?.nombre ?? '');
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
        razonUnknown: 'Prerrequisito escuela_nivel con formato no reconocido',
    };
}

function buildEvaluacionNumeroMinimo(
    entry: Record<string, any>,
    actual: number,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual >= requerido : false,
        razonUnknown,
    };
}

function buildEvaluacionNumeroMaximo(
    entry: Record<string, any>,
    actual: number,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const requerido = parseNumber(entry, ['Nivel', 'nivel', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    const evaluable = Number.isFinite(requerido);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? actual <= requerido : false,
        razonUnknown,
    };
}

function buildEvaluacionTamano(entry: Record<string, any>, ctx: DoteEvaluacionContexto, maximo: boolean): EvaluacionItem {
    const requerido = parseId(entry, ['Id_tamano', 'id_tamano', 'IdTamano', 'idTamano', 'Cantidad', 'cantidad', 'Valor', 'valor', 'c']);
    return { grupoOpcional: parseOpcional(entry), ...compararTamano(requerido, ctx.tamanoId, maximo) };
}

function buildEvaluacionTipoCriatura(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const tipoIdReq = parseId(entry, ['Id_tipo', 'id_tipo', 'Id_tipo_criatura', 'id_tipo_criatura', 'Id', 'id', 'i']);
    const tipoNombreReq = parseText(entry, ['Tipo', 'tipo', 'Tipo_criatura', 'tipo_criatura', 'Nombre', 'nombre']);
    const tipoNombreReqNorm = normalizarTexto(tipoNombreReq);
    const tipoActualId = toInt(ctx.tipoCriaturaId);
    const tipoActualNombreNorm = normalizarTexto(ctx.tipoCriaturaNombre ?? '');
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
        razonUnknown: 'Prerrequisito tipo_criatura con formato no reconocido',
    };
}

function buildEvaluacionTipoDote(
    entry: Record<string, any>,
    ctx: DoteEvaluacionContexto,
    razonUnknown: string
): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idTipoReq = parseId(entry, ['Id_tipo', 'id_tipo', 'IdTipo', 'idTipo', 'Id', 'id', 'i']);
    const nombreTipoReq = parseText(entry, ['Tipo', 'tipo', 'Tipo_dote', 'tipo_dote', 'Nombre', 'nombre']);
    const nombreTipoReqNorm = normalizarTexto(nombreTipoReq);
    const evaluable = idTipoReq > 0 || nombreTipoReqNorm.length > 0;
    const tipos = ctx.tiposDote ?? [];
    const cumple = tipos.some((tipo) => {
        if (idTipoReq > 0 && toNumber(tipo.id) === idTipoReq)
            return true;
        return nombreTipoReqNorm.length > 0 && normalizarTexto(tipo.nombre) === nombreTipoReqNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
        razonUnknown,
    };
}

function buildEvaluacionRegion(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idRegionReq = parseId(entry, ['Id_region', 'id_region', 'IdRegion', 'idRegion', 'Id', 'id', 'i']);
    const nombreRegionReq = parseText(entry, ['Region', 'region', 'Nombre', 'nombre']);
    const nombreRegionReqNorm = normalizarTexto(nombreRegionReq);
    const regionIdRaw = ctx.region?.id as any;
    const regionIdActual = toNumber(regionIdRaw);
    const regionIdConocido = regionIdRaw !== null
        && regionIdRaw !== undefined
        && `${regionIdRaw}`.trim().length > 0
        && Number.isFinite(Number(regionIdRaw));
    const regionNombreActualNorm = normalizarTexto(ctx.region?.nombre ?? '');
    const catalogoRegiones = ctx.catalogoRegiones ?? [];
    const nombreRegionReqCatalogoNorm = normalizarTexto(
        idRegionReq > 0
            ? catalogoRegiones.find((item) => toNumber(item.id) === idRegionReq)?.nombre ?? ''
            : ''
    );
    const nombreRegionActualCatalogoNorm = normalizarTexto(
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
        razonUnknown: 'Prerrequisito region con formato no reconocido',
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
        razonUnknown: `Prerrequisito lanzador_${tipo} con formato no reconocido`,
    };
}

function buildEvaluacionConjuroEscuela(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idEscuela = parseId(entry, ['Id_escuela', 'id_escuela', 'IdEscuela', 'idEscuela']);
    const escuela = parseText(entry, ['Escuela', 'escuela', 'Nombre', 'nombre']);
    const escuelaNorm = normalizarTexto(escuela);
    const cantidad = Math.max(1, toInt(pick(entry, ['Cantidad', 'cantidad', 'Nivel', 'nivel'])));
    const evaluable = (idEscuela > 0 || escuelaNorm.length > 0) && cantidad > 0;
    const fuenteConjuros = ctx.conjurosAccesibles !== undefined
        ? ctx.conjurosAccesibles
        : ctx.conjuros;
    const total = fuenteConjuros.reduce((acc, conjuro) => {
        const coincideEscuela = (idEscuela > 0 && toNumber(conjuro.idEscuela) === idEscuela)
            || (escuelaNorm.length > 0 && normalizarTexto(conjuro.escuela) === escuelaNorm);
        return coincideEscuela ? acc + 1 : acc;
    }, 0);
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? total >= cantidad : false,
        razonUnknown: 'Prerrequisito conjuros_escuela con formato no reconocido',
    };
}

function buildEvaluacionLanzEspontaneo(entry: Record<string, any>, ctx: DoteEvaluacionContexto): EvaluacionItem {
    const grupoOpcional = parseOpcional(entry);
    const idConjuro = parseId(entry, ['Id_conjuro', 'id_conjuro', 'IdConjuro', 'idConjuro']);
    const nombreConjuro = parseText(entry, ['Conjuro', 'conjuro', 'Nombre', 'nombre']);
    const nombreNorm = normalizarTexto(nombreConjuro);
    const evaluable = idConjuro > 0 || nombreNorm.length > 0;
    const cumple = ctx.conjuros.some((conjuro) => {
        if (idConjuro > 0 && toNumber(conjuro.id) === idConjuro)
            return true;
        return nombreNorm.length > 0 && normalizarTexto(conjuro.nombre) === nombreNorm;
    });
    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
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
        : toNumber(ctx.salvacionesBase.fortaleza) >= fortReq
        && toNumber(ctx.salvacionesBase.reflejos) >= reflReq
        && toNumber(ctx.salvacionesBase.voluntad) >= volReq;
    return {
        grupoOpcional,
        evaluable,
        cumple,
        razonUnknown: 'Prerrequisito salvacion_minimo con formato no reconocido',
    };
}

function buildEvaluacionActitud(
    entry: Record<string, any>,
    idAlineamiento: number,
    prohibido: boolean
): EvaluacionItem {
    return { grupoOpcional: parseOpcional(entry), ...compararActitud(entry, idAlineamiento, prohibido) };
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
    // «Elegir» (la competencia con el arma que se elija como extra de la dote) lo marca la API en `Arma_comodin`.
    const esElegir = leerComodin(entry?.['Arma_comodin']) === 'elegir';

    if (esElegir && idExtraSeleccionado <= 0 && normalizarTexto(extraSeleccionado).length < 1) {
        return {
            grupoOpcional,
            evaluable: true,
            cumple: true,
            razonUnknown: 'Prerrequisito competencia_arma con formato no reconocido',
        };
    }

    const idObjetivo = esElegir ? Math.max(0, toNumber(idExtraSeleccionado)) : idArma;
    const nombreObjetivo = esElegir ? `${extraSeleccionado ?? ''}`.trim() : arma;
    const nombreObjetivoNorm = normalizarTexto(nombreObjetivo);

    const evaluable = idObjetivo > 0 || nombreObjetivoNorm.length > 0;
    const cumple = ctx.competenciasArmas.some((comp) => {
        if (idObjetivo > 0 && toNumber(comp.id) === idObjetivo)
            return true;
        return nombreObjetivoNorm.length > 0 && normalizarTexto(comp.nombre) === nombreObjetivoNorm;
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? cumple : false,
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
    const nombreNorm = normalizarTexto(nombreDoteReq);
    const repetidoReq = Math.max(0, toInt(pick(entry, ['Repetido', 'repetido', 'r'])));
    const cantidadReq = repetidoReq > 0 ? repetidoReq : 1;
    const evaluable = idDoteReq > 0 || nombreNorm.length > 0;
    const seleccion = { idExtra: idExtraSeleccionado, extra: extraSeleccionado };

    const coincidencias = ctx.dotes.filter((dote) => {
        const coincideDote = (idDoteReq > 0 && toNumber(dote.id) === idDoteReq)
            || (nombreNorm.length > 0 && normalizarTexto(dote.nombre) === nombreNorm);
        return coincideDote && cumpleExtraPedido(entry, dote, seleccion);
    });

    return {
        grupoOpcional,
        evaluable,
        cumple: evaluable ? coincidencias.length >= cantidadReq : false,
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
    if (keyNorm === 'aptitud_especial')
        return entries.map((entry) => evaluarAptitudEspecial(entry, ctx));
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
            'Prerrequisito competencia_armadura con formato no reconocido'
        ));
    }
    if (keyNorm === 'competencia_grupo_arma') {
        return entries.map((entry) => buildEvaluacionCompetencia(
            entry,
            ctx.competenciasGrupoArmas ?? [],
            ['Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'Id', 'id', 'i'],
            ['Grupo', 'grupo', 'Nombre', 'nombre'],
            'Prerrequisito competencia_grupo_arma con formato no reconocido'
        ));
    }
    if (keyNorm === 'competencia_grupo_armadura') {
        return entries.map((entry) => buildEvaluacionCompetencia(
            entry,
            ctx.competenciasGrupoArmaduras ?? [],
            ['Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'Id', 'id', 'i'],
            ['Grupo', 'grupo', 'Nombre', 'nombre'],
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
            'Prerrequisito lanzar_conjuros_arcanos_nivel con formato no reconocido'
        ));
    }
    if (keyNorm === 'lanzar_conjuros_divinos_nivel') {
        return entries.map((entry) => buildEvaluacionNumeroMinimo(
            entry,
            toNumber(ctx.nivelesConjuroMaximos?.divino),
            'Prerrequisito lanzar_conjuros_divinos_nivel con formato no reconocido'
        ));
    }
    if (keyNorm === 'conjuros_escuela')
        return entries.map((entry) => buildEvaluacionConjuroEscuela(entry, ctx));
    if (keyNorm === 'lanz_espontaneo')
        return entries.map((entry) => buildEvaluacionLanzEspontaneo(entry, ctx));
    if (keyNorm === 'limite_tipo_dote')
        return entries.map((entry) => buildEvaluacionTipoDote(entry, ctx, 'Prerrequisito limite_tipo_dote con formato no reconocido'));
    if (keyNorm === 'nivel')
        return entries.map((entry) => buildEvaluacionNumeroMinimo(entry, toNumber(ctx.nivelTotal), 'Prerrequisito nivel con formato no reconocido'));
    if (keyNorm === 'nivel_max')
        return entries.map((entry) => buildEvaluacionNumeroMaximo(entry, toNumber(ctx.nivelTotal), 'Prerrequisito nivel_max con formato no reconocido'));
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
        return entries.map((entry) => buildEvaluacionTipoDote(entry, ctx, 'Prerrequisito tipo_dote con formato no reconocido'));
    if (keyNorm === 'poder_seleccionar_companero') {
        return entries.map((entry) => ({
            grupoOpcional: parseOpcional(entry),
            evaluable: true,
            cumple: !!ctx.puedeSeleccionarCompanero,
            razonUnknown: 'Prerrequisito de poder elegir compañero no interpretable',
        }));
    }
    if (keyNorm === 'reserva_psionica')
        return entries.map((entry) => buildEvaluacionNumeroMinimo(entry, toNumber(ctx.reservaPsionica), 'Prerrequisito reserva_psionica con formato no reconocido'));
    if (keyNorm === 'lanzar_poder_psionico_nivel')
        return entries.map((entry) => buildEvaluacionNumeroMinimo(entry, toNumber(ctx.nivelPoderPsionicoMaximo), 'Prerrequisito lanzar_poder_psionico_nivel con formato no reconocido'));
    if (CLAVES_PRERREQUISITOS_INCARNUM.includes(keyNorm)) {
        const incarnum = ctx.incarnum ?? incarnumParaPrerrequisitos(null);
        return entries.map((entry) => ({
            grupoOpcional: parseOpcional(entry),
            evaluable: true,
            cumple: !!cumplePrerrequisitoIncarnum(keyNorm, entry, incarnum, toNumber(ctx.lanzador?.arcano)),
            razonUnknown: '',
        }));
    }
    if (keyNorm === 'poder_seleccionar_familiar') {
        return entries.map((entry) => ({
            grupoOpcional: parseOpcional(entry),
            evaluable: true,
            cumple: !!ctx.puedeSeleccionarFamiliar,
            razonUnknown: 'Prerrequisito poder_seleccionar_familiar no interpretable',
        }));
    }

    return entries.map((entry) => ({
        grupoOpcional: parseOpcional(entry),
        evaluable: false,
        cumple: false,
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

    const motivos = new MotivosPrerrequisitos();
    const advertencias: string[] = [];
    const prerrequisitos = (dote?.Prerrequisitos ?? {}) as Record<string, any>;
    const idExtraSeleccionado = Math.max(0, toInt(input?.idExtraSeleccionado));
    const extraSeleccionado = `${input?.extraSeleccionado ?? ''}`.trim();
    const idAlineamiento = getAlineamientoBasicoIdPorNombre(ctx.alineamiento);

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
        evaluaciones.forEach((evaluacion, index) => {
            motivos.registrar({ ...evaluacion, frase: frasePrerrequisito(key, entries[index]) });
        });
    });

    motivos.cerrarGrupos();
    advertencias.push(...textosUnicos(motivos.avisos));
    const failDedupe = textosUnicos(motivos.fail);
    const unknownDedupe = textosUnicos(motivos.unknown);

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
