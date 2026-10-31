import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, Unsubscribe } from '@angular/fire/database';
import { Observable, firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MutacionRaza, Raza, RazaHabilidades, RazaPrerrequisitos, RazaPrerrequisitosFlags } from '../interfaces/raza';
import { RazaActualizadaResponse, RazaCreateApiResponse, RazaCreateRequest, RazaCreateResponse } from '../interfaces/razas-api';
import { environment } from 'src/environments/environment';
import { Alineamiento } from '../interfaces/alineamiento';
import { DoteContextual } from '../interfaces/dote-contextual';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { normalizarCamposCreacionRaza, normalizarCamposEdadRaza, normalizarTextosRaza, normalizeRazaApi } from './utils/raza-mapper';
import { toDoteContextualArray } from './utils/dote-mapper';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';
import { cabeceraApiConFirebase } from './platform-session.service';
import { toArray, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { errorDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { RAZA } from 'src/app/services/utils/nombres-de-catalogo';
import { leerComodin } from 'src/app/services/utils/comodin';
import { errorDePerfil } from 'src/app/services/utils/error-api';

function parseIdExtra(value: any): number {
    if (value === undefined || value === null || `${value}`.trim() === '')
        return -1;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : -1;
}

function pick(source: any, ...keys: string[]): any {
    if (!source || typeof source !== 'object')
        return undefined;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(source, key))
            return source[key];
    }
    return undefined;
}

export function normalizeIdiomasRaza(raw: any) {
    return toArray(raw).map((item: any) => ({
        Id: toNumber(item?.Id ?? item?.id),
        Nombre: `${item?.Nombre ?? item?.nombre ?? ''}`,
        Descripcion: `${item?.Descripcion ?? item?.descripcion ?? ''}`,
        Secreto: toBoolean(item?.Secreto ?? item?.secreto),
        Oficial: toBoolean(item?.Oficial ?? item?.oficial),
    })).filter((idioma) => idioma.Nombre.trim().length > 0);
}

function normalizePlantillasPorSubtipo(raw: any): Raza['Plantillas_por_subtipo'] {
    return toArray(raw)
        .map((item: any) => {
            const subtipoRaw = pick(item, 'Subtipo', 'subtipo') ?? {};
            const subtipo = {
                Id: toNumber(pick(subtipoRaw, 'Id', 'id', 'i')),
                Nombre: `${pick(subtipoRaw, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
            };
            const plantillas = toArray(pick(item, 'Plantillas', 'plantillas'))
                .map((plantilla: any) => ({
                    Id: toNumber(pick(plantilla, 'Id', 'id', 'i')),
                    Nombre: `${pick(plantilla, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
                    Descripcion: `${pick(plantilla, 'Descripcion', 'descripcion', 'd') ?? ''}`.trim(),
                }))
                .filter((plantilla) => plantilla.Id > 0 || plantilla.Nombre.length > 0);
            return { Subtipo: subtipo, Plantillas: plantillas };
        })
        .filter((item) => (item.Subtipo.Id > 0 || item.Subtipo.Nombre.length > 0) && item.Plantillas.length > 0);
}

export function normalizeAlineamientoRaza(raw: any): Alineamiento {
    const rootSource = typeof raw === 'string'
        ? { Basico: { Nombre: raw } }
        : (raw ?? {});
    const source = pick(rootSource, 'Alineamiento', 'alineamiento', 'ali') ?? rootSource;
    const fromString = typeof source === 'string'
        ? { Basico: { Nombre: source } }
        : (source ?? {});

    const basicoRaw = pick(fromString, 'Basico', 'base', 'b');
    const leyRaw = pick(fromString, 'Ley', 'ley', 'l');
    const moralRaw = pick(fromString, 'Moral', 'moral', 'm');
    const prioridadRaw = pick(fromString, 'Prioridad', 'prioridad', 'p');

    const basico = (typeof basicoRaw === 'string')
        ? { Nombre: basicoRaw }
        : (basicoRaw ?? {});
    const ley = (typeof leyRaw === 'string')
        ? { Nombre: leyRaw }
        : (leyRaw ?? {});
    const moral = (typeof moralRaw === 'string')
        ? { Nombre: moralRaw }
        : (moralRaw ?? {});
    const prioridad = (typeof prioridadRaw === 'string')
        ? { Nombre: prioridadRaw }
        : (prioridadRaw ?? {});

    return {
        Id: toNumber(pick(fromString, 'Id', 'id', 'i')),
        Basico: {
            Id_basico: toNumber(pick(basico, 'Id_basico', 'id_basico', 'Id', 'id', 'i')),
            Nombre: `${pick(basico, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        },
        Ley: {
            Id_ley: toNumber(pick(ley, 'Id_ley', 'id_ley', 'Id', 'id', 'i')),
            Nombre: `${pick(ley, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        },
        Moral: {
            Id_moral: toNumber(pick(moral, 'Id_moral', 'id_moral', 'Id', 'id', 'i')),
            Nombre: `${pick(moral, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        },
        Prioridad: {
            Id_prioridad: toNumber(pick(prioridad, 'Id_prioridad', 'id_prioridad', 'Id', 'id', 'i')),
            Nombre: `${pick(prioridad, 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        },
        Descripcion: `${pick(fromString, 'Descripcion', 'descripcion', 'd') ?? ''}`.trim(),
    };
}

function normalizeHabilidadRazaBase(raw: any): Raza['Habilidades']['Base'][number] {
    const rawSoportaExtra = pick(raw, 'Soporta_extra', 'soporta_extra');
    return {
        Id_habilidad: toNumber(
            pick(raw, 'Id_habilidad', 'id_habilidad', 'Id', 'id', 'i')
        ),
        Habilidad: `${pick(raw, 'Habilidad', 'habilidad', 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        Id_caracteristica: toNumber(
            pick(raw, 'Id_caracteristica', 'id_caracteristica', 'IdCaracteristica', 'idCaracteristica')
        ),
        Caracteristica: `${pick(raw, 'Caracteristica', 'caracteristica') ?? ''}`.trim(),
        Descripcion: `${pick(raw, 'Descripcion', 'descripcion', 'd') ?? ''}`.trim(),
        Entrenada: toBoolean(pick(raw, 'Entrenada', 'entrenada')),
        Id_extra: parseIdExtra(pick(raw, 'Id_extra', 'id_extra', 'IdExtra', 'idExtra', 'i_ex', 'ie')),
        Extra: `${pick(raw, 'Extra', 'extra', 'x') ?? ''}`.trim(),
        Extra_comodin: leerComodin(pick(raw, 'Extra_comodin')),
        Cantidad: toNumber(pick(raw, 'Cantidad', 'cantidad', 'Rangos', 'rangos')),
        Varios: `${pick(raw, 'Varios', 'varios') ?? ''}`.trim(),
        Soporta_extra: rawSoportaExtra === undefined ? undefined : toBoolean(rawSoportaExtra),
        Custom: toBoolean(pick(raw, 'Custom', 'custom')),
        Clasea: toBoolean(pick(raw, 'Clasea', 'clasea')),
        Clase: toBoolean(pick(raw, 'Clase', 'clase')),
        classSkill: toBoolean(pick(raw, 'classSkill', 'classskill', 'class_skill')),
    };
}

function normalizeHabilidadRazaCustom(raw: any): Raza['Habilidades']['Custom'][number] {
    const rawSoportaExtra = pick(raw, 'Soporta_extra', 'soporta_extra');
    return {
        Id_habilidad: toNumber(
            pick(raw, 'Id_habilidad', 'id_habilidad', 'Id', 'id', 'i')
        ),
        Habilidad: `${pick(raw, 'Habilidad', 'habilidad', 'Nombre', 'nombre', 'n') ?? ''}`.trim(),
        Id_caracteristica: toNumber(
            pick(raw, 'Id_caracteristica', 'id_caracteristica', 'IdCaracteristica', 'idCaracteristica')
        ),
        Caracteristica: `${pick(raw, 'Caracteristica', 'caracteristica') ?? ''}`.trim(),
        Id_extra: parseIdExtra(pick(raw, 'Id_extra', 'id_extra', 'IdExtra', 'idExtra', 'i_ex', 'ie')),
        Extra: `${pick(raw, 'Extra', 'extra', 'x') ?? ''}`.trim(),
        Extra_comodin: leerComodin(pick(raw, 'Extra_comodin')),
        Cantidad: toNumber(pick(raw, 'Cantidad', 'cantidad', 'Rangos', 'rangos')),
        Soporta_extra
: rawSoportaExtra === undefined ? undefined : toBoolean(rawSoportaExtra),
        Custom: true,
        Clasea: toBoolean(pick(raw, 'Clasea', 'clasea')),
        Clase: toBoolean(pick(raw, 'Clase', 'clase')),
        classSkill: toBoolean(pick(raw, 'classSkill', 'classskill', 'class_skill')),
    };
}

export function normalizeHabilidadesRaza(raw: any): RazaHabilidades {
    const source = raw ?? {};
    const baseRaw = pick(source, 'Base', 'base', 'b');
    const customRaw = pick(source, 'Custom', 'custom', 'c');
    const base = toArray(baseRaw)
        .map((item: any) => normalizeHabilidadRazaBase(item))
        .filter((item) => item.Id_habilidad > 0 || item.Habilidad.length > 0);
    const custom = toArray(customRaw)
        .map((item: any) => normalizeHabilidadRazaCustom(item))
        .filter((item) => item.Id_habilidad > 0 || item.Habilidad.length > 0);
    return {
        Base: base,
        Custom: custom,
    };
}

function normalizePrerrequisitos(raw: any): RazaPrerrequisitos {
    const source = raw ?? {};
    return {
        actitud_prohibido: toArray(source?.actitud_prohibido),
        actitud_requerido: toArray(source?.actitud_requerido),
        alineamiento_prohibido: toArray(source?.alineamiento_prohibido),
        alineamiento_requerido: toArray(source?.alineamiento_requerido),
        tipo_criatura: toArray(source?.tipo_criatura),
    };
}

function normalizePrerrequisitosFlags(raw: any, prer: RazaPrerrequisitos): RazaPrerrequisitosFlags {
    const source = raw ?? {};
    return {
        actitud_prohibido: toBoolean(source?.actitud_prohibido) || (prer?.actitud_prohibido?.length ?? 0) > 0,
        actitud_requerido: toBoolean(source?.actitud_requerido) || (prer?.actitud_requerido?.length ?? 0) > 0,
        alineamiento_prohibido: toBoolean(source?.alineamiento_prohibido) || (prer?.alineamiento_prohibido?.length ?? 0) > 0,
        alineamiento_requerido: toBoolean(source?.alineamiento_requerido) || (prer?.alineamiento_requerido?.length ?? 0) > 0,
        tipo_criatura: toBoolean(source?.tipo_criatura) || (prer?.tipo_criatura?.length ?? 0) > 0,
    };
}

function normalizeMutacion(raw: any, mutada: any, tmd: any, heredada: any, prer: RazaPrerrequisitos): MutacionRaza {
    const source = raw ?? {};
    const tienePrerrequisitos = (prer?.actitud_prohibido?.length ?? 0) > 0
        || (prer?.actitud_requerido?.length ?? 0) > 0
        || (prer?.alineamiento_prohibido?.length ?? 0) > 0
        || (prer?.alineamiento_requerido?.length ?? 0) > 0
        || (prer?.tipo_criatura?.length ?? 0) > 0;
    return {
        Es_mutada: toBoolean(source?.Es_mutada) || toBoolean(mutada),
        Tamano_dependiente: toBoolean(source?.Tamano_dependiente) || toBoolean(tmd),
        Tiene_prerrequisitos: toBoolean(source?.Tiene_prerrequisitos) || tienePrerrequisitos,
        Heredada: toBoolean(source?.Heredada) || toBoolean(heredada),
    };
}

function normalizeModificadores(raw: any): Raza['Modificadores'] {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeDgsAdicionales(raw: any): Raza['Dgs_adicionales'] {
    return {
        Cantidad: toNumber(raw?.Cantidad),
        Dado: `${raw?.Dado ?? ''}`,
        Tipo_criatura: `${raw?.Tipo_criatura ?? ''}`,
        Ataque_base: toNumber(raw?.Ataque_base),
        Dotes_extra: toNumber(raw?.Dotes_extra),
        Puntos_habilidad: toNumber(raw?.Puntos_habilidad),
        Multiplicador_puntos_habilidad: toNumber(raw?.Multiplicador_puntos_habilidad),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
    };
}

function mapRazaDesdeRaw(raw: any, id: any, dotesContextuales: DoteContextual[], subtipos: any[], raciales: any[]): Raza {
    const prerrequisitos = normalizePrerrequisitos(raw?.Prerrequisitos ?? raw?.pr ?? raw?.PR);
    const prerrequisitosFlags = normalizePrerrequisitosFlags(
        raw?.Prerrequisitos_flags ?? raw?.prf ?? raw?.PrerrequisitosFlags,
        prerrequisitos
    );

    const mutadaRaw = raw?.Mutada ?? raw?.mu;
    const tmdRaw = raw?.Tamano_mutacion_dependiente ?? raw?.Tamano_mutacion_pendiente ?? raw?.tmd;
    const heredadaRaw = raw?.Heredada ?? raw?.he;
    const mutacion = normalizeMutacion(raw?.Mutacion, mutadaRaw, tmdRaw, heredadaRaw, prerrequisitos);

    return {
        Id: toNumber(id),
        Nombre: `${raw?.Nombre ?? raw?.n ?? ''}`,
        ...normalizarTextosRaza(raw),
        Modificadores: normalizeModificadores(raw?.Modificadores ?? raw?.m),
        Alineamiento: normalizeAlineamientoRaza(raw?.Alineamiento ?? raw?.alineamiento ?? raw?.ali),
        Manual: `${raw?.Manual ?? raw?.ma ?? ''}`,
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel ?? raw?.aju),
        Clase_predilecta: `${raw?.Clase_predilecta ?? raw?.c ?? ''}`,
        Oficial: toBoolean(raw?.Oficial ?? raw?.oficial ?? raw?.o, true),
        Ataques_naturales: `${raw?.Ataques_naturales ?? raw?.an ?? ''}`,
        Tamano: raw?.Tamano ?? raw?.t ?? ({} as any),
        Dgs_adicionales: normalizeDgsAdicionales(raw?.Dgs_adicionales ?? raw?.dg),
        ...normalizarCamposCreacionRaza(raw),
        Reduccion_dano: `${raw?.Reduccion_dano ?? raw?.rd ?? ''}`,
        Resistencia_magica: `${raw?.Resistencia_magica ?? raw?.Resistencia_magia ?? raw?.rc ?? ''}`,
        Resistencia_energia: `${raw?.Resistencia_energia ?? raw?.re ?? ''}`,
        Heredada: toBoolean(heredadaRaw),
        Mutada: mutacion.Es_mutada === true,
        Tamano_mutacion_dependiente: mutacion.Tamano_dependiente === true,
        Prerrequisitos: prerrequisitos,
        Prerrequisitos_flags: prerrequisitosFlags,
        Mutacion: mutacion,
        Armadura_natural: toNumber(raw?.Armadura_natural ?? raw?.ant),
        Varios_armadura: toNumber(raw?.Varios_armadura ?? raw?.va),
        Correr: toNumber(raw?.Correr ?? raw?.co),
        Nadar: toNumber(raw?.Nadar ?? raw?.na),
        Volar: toNumber(raw?.Volar ?? raw?.vo),
        Maniobrabilidad: raw?.Maniobrabilidad ?? raw?.man ?? ({} as any),
        Trepar: toNumber(raw?.Trepar ?? raw?.tr),
        Excavar: toNumber(raw?.Excavar ?? raw?.ex),
        Altura_rango_inf: toNumber(raw?.Altura_rango_inf ?? raw?.ari),
        Altura_rango_sup: toNumber(raw?.Altura_rango_sup ?? raw?.ars),
        Peso_rango_inf: toNumber(raw?.Peso_rango_inf ?? raw?.pri),
        Peso_rango_sup: toNumber(raw?.Peso_rango_sup ?? raw?.prs),
        Edad_adulto: toNumber(raw?.Edad_adulto ?? raw?.ea),
        Edad_mediana: toNumber(raw?.Edad_mediana ?? raw?.em),
        Edad_viejo: toNumber(raw?.Edad_viejo ?? raw?.ev),
        Edad_venerable: toNumber(raw?.Edad_venerable ?? raw?.eve),
        Espacio: toNumber(raw?.Espacio ?? raw?.esp),
        Alcance: toNumber(raw?.Alcance ?? raw?.alc),
        Tipo_criatura: raw?.Tipo_criatura ?? raw?.tc ?? ({} as any),
        Subtipos: subtipos,
        Sortilegas: toArray(raw?.Sortilegas ?? raw?.sor),
        Raciales: normalizeRaciales(raciales),
        Habilidades: normalizeHabilidadesRaza(raw?.Habilidades ?? raw?.habilidades ?? raw?.hab),
        DotesContextuales: dotesContextuales,
        Idiomas: normalizeIdiomasRaza(raw?.Idiomas ?? raw?.idiomas ?? raw?.idi),
        Plantillas_por_subtipo: normalizePlantillasPorSubtipo(raw?.Plantillas_por_subtipo ?? raw?.plantillas_por_subtipo),
        ...normalizarCamposEdadRaza(raw),
    };
}

export function normalizeRazaLegacy(raw: any, id: any = raw?.Id ?? raw?.i): Raza {
    const dotesContextuales = toDoteContextualArray(raw?.DotesContextuales ?? raw?.dotes);
    const subtipos = normalizeSubtipoRefArray(raw?.Subtipos ?? raw?.subtipos);
    const raciales = raw?.Raciales ?? raw?.rac;
    return mapRazaDesdeRaw(raw ?? {}, id, dotesContextuales, subtipos, raciales);
}

/** Una raza de la caché de la RTDB (permisivo: acepta `Subtipos` o `subtipos`). */
function razaDesdeSnapshot(snapshot: any, id: any): Raza {
    const dotesContextuales = toDoteContextualArray(snapshot.child('DotesContextuales').val());
    const subtipos = normalizeSubtipoRefArray(snapshot.child('Subtipos').val() ?? snapshot.child('subtipos').val());
    return mapRazaDesdeRaw(
        snapshot.val() ?? {},
        id,
        dotesContextuales,
        subtipos,
        snapshot.child('Raciales').val()
    );
}

@Injectable({
    providedIn: 'root'
})
export class RazaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    protected watchRazaPath(id: number, onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharRtdb(this.db, this.firebaseContextSvc, `Razas/${id}`)(onNext, onError);
    }

    protected watchRazasPath(onNext: (snapshot: any) => void, onError: (error: any) => void): Unsubscribe {
        return escucharRtdb(this.db, this.firebaseContextSvc, 'Razas')(onNext, onError);
    }

    async getRaza(id: number): Promise<Observable<Raza>> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchRazaPath(id, onNext, onError),
            desdeCache: (snapshot) => razaDesdeSnapshot(snapshot, id),
            pedir: () => this.http.get(`${environment.apiUrl}razas/${id}`),
            desdeApi: (raw) => normalizeRazaApi(raw),
            avisos: {
                noEncontrado: { titulo: 'Raza no encontrada', texto: `No existe la raza con id ${id}` },
                error: 'Error al obtener la raza',
            },
        });
    }

    getRazas(): Observable<Raza[]> {
        return cacheRtdbOApi({
            escuchar: (onNext, onError) => this.watchRazasPath(onNext, onError),
            desdeCache: (snapshot) => {
                const razas: Raza[] = [];
                snapshot.forEach((obj: any) => {
                    razas.push(razaDesdeSnapshot(obj, obj.key));
                });
                return razas;
            },
            pedir: () => this.http.get(`${environment.apiUrl}razas`),
            desdeApi: (raw) => (Array.isArray(raw) ? raw : Object.values(raw ?? {}))
                .map((item: any) => normalizeRazaApi(item))
                .filter((raza) => raza.Id > 0),
            avisos: {
                noEncontrado: { titulo: 'Listado de razas no disponible', texto: 'No se encontró /razas en la API' },
                error: 'Error al obtener el listado de razas',
            },
        });
    }

    /** La raza recién leída de la API (`GET /razas/{id}`), sin caché: la que se rellena en «Modificar raza». */
    getRazaFresca(id: number): Observable<Raza> {
        return this.http.get(`${environment.apiUrl}razas/${toInt(id)}`)
            .pipe(map((raw) => normalizeRazaApi(raw)));
    }

    /**
     * La raza a una edad (`GET /razas/{id}/pasos-edad/{idPaso}`): la `RazaCompleta` con las cifras de ese paso y su
     * categoría (tamaño, modificadores, DG, armadura natural, velocidades, raciales y sortílegas acumulados, lanzamiento).
     * Es la vista previa de la creación y la raza que se elige. Con un error de la API, su texto (`paso_edad_no_valido`).
     */
    public async getRazaEnPasoEdad(idRaza: number, idPasoEdad: number): Promise<Raza> {
        try {
            const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}razas/${idRaza}/pasos-edad/${idPasoEdad}`));
            return normalizeRazaApi(raw);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo leer la raza a esa edad.');
        }
    }

    public async crearRaza(payload: RazaCreateRequest): Promise<RazaCreateResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<RazaCreateApiResponse>(`${environment.apiUrl}razas/add`, payload, { headers })
            );
            return respuestaDeRaza(response, 'Raza creada');
        } catch (error: any) {
            throw errorDeCatalogo(error, 'crear', RAZA);
        }
    }

    /**
     * `PUT /razas/{id}`: el mismo cuerpo que el alta, que reemplaza la raza entera. Las categorías de edad, sus pasos y lo
     * que se gana en cada una (las razas por edades) no van en el cuerpo y la API los conserva.
     */
    public async actualizarRaza(idRaza: number, payload: RazaCreateRequest): Promise<RazaActualizadaResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.put<RazaCreateApiResponse>(`${environment.apiUrl}razas/${toInt(idRaza)}`, payload, { headers })
            );
            return { ...respuestaDeRaza(response, 'Raza actualizada'), raza: normalizeRazaApi(response?.raza) };
        } catch (error: any) {
            throw errorDeCatalogo(error, 'actualizar', RAZA);
        }
    }
}

/** `{ message, idRaza }` de la respuesta del alta y de la edición (`RazaCreateApiResponse`); sin un `idRaza` válido, falla. */
function respuestaDeRaza(response: RazaCreateApiResponse | null | undefined, mensajePorDefecto: string): RazaCreateResponse {
    const idRaza = toInt(response?.idRaza);
    if (idRaza <= 0)
        throw new Error('La API no devolvió un idRaza válido');
    return { message: `${response?.message ?? mensajePorDefecto}`, idRaza };
}
