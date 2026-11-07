import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, Unsubscribe } from '@angular/fire/database';
import { Observable, firstValueFrom, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Raza, RazaHabilidades } from '../interfaces/raza';
import {
    BaseRazaMutada, BasesRazaMutada, EstadoBaseRazaMutada, ModeloMutacion, RazaActualizadaResponse, RazaCreateApiResponse,
    RazaCreateRequest, RazaCreateResponse, RequisitoDelPersonajeMutacion, RequisitosDelPersonajeConsulta,
    TipoPrerrequisitoMutacion,
} from '../interfaces/razas-api';
import { environment } from 'src/environments/environment';
import { Alineamiento } from '../interfaces/alineamiento';
import { DoteContextual } from '../interfaces/dote-contextual';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import {
    SUJETOS_MUTACION, normalizarCambiosMutacion, normalizarCamposCreacionRaza, normalizarCamposEdadRaza,
    normalizarPrerrequisitosMutacion, normalizarTextosRaza, normalizeRazaApi, textoClasePredilecta,
} from './utils/raza-mapper';
import { toDoteContextualArray } from './utils/dote-mapper';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';
import { cabeceraApiConFirebase } from './platform-session.service';
import { toArray, toBoolean, toInt, toNumber, toRefIdNombre } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { errorDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { RAZA } from 'src/app/services/utils/nombres-de-catalogo';
import { leerComodin } from 'src/app/services/utils/comodin';
import { errorDePerfil } from 'src/app/services/utils/error-api';
import { leerRespuestaDeEscritura } from 'src/app/services/utils/respuesta-de-escritura';
import { parteCondicionalHabilidadRaza } from 'src/app/services/utils/habilidad-raza-condicional';

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
        ...parteCondicionalHabilidadRaza(raw),
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
    const heredadaRaw = raw?.Heredada ?? raw?.he;

    return {
        Id: toNumber(id),
        Nombre: `${raw?.Nombre ?? raw?.n ?? ''}`,
        ...normalizarTextosRaza(raw),
        Modificadores: normalizeModificadores(raw?.Modificadores ?? raw?.m),
        Alineamiento: normalizeAlineamientoRaza(raw?.Alineamiento ?? raw?.alineamiento ?? raw?.ali),
        Manual: `${raw?.Manual ?? raw?.ma ?? ''}`,
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel ?? raw?.aju),
        Clase_predilecta: textoClasePredilecta(raw?.Clase_predilecta ?? raw?.c),
        Oficial: toBoolean(raw?.Oficial ?? raw?.oficial ?? raw?.o, true),
        Ataques_naturales: `${raw?.Ataques_naturales ?? raw?.an ?? ''}`,
        Tamano: raw?.Tamano ?? raw?.t ?? ({} as any),
        Dgs_adicionales: normalizeDgsAdicionales(raw?.Dgs_adicionales ?? raw?.dg),
        ...normalizarCamposCreacionRaza(raw),
        Reduccion_dano: `${raw?.Reduccion_dano ?? raw?.rd ?? ''}`,
        Resistencia_magica: `${raw?.Resistencia_magica ?? raw?.Resistencia_magia ?? raw?.rc ?? ''}`,
        Resistencia_energia: `${raw?.Resistencia_energia ?? raw?.re ?? ''}`,
        Heredada: toBoolean(heredadaRaw),
        // La caché `Razas` 24 (fase 3 de las razas mutadas): lo que pide y lo que cambia una mutada, como la API.
        Mutada: toBoolean(raw?.Mutada),
        Prerrequisitos: normalizarPrerrequisitosMutacion(raw?.Prerrequisitos),
        Cambios_mutacion: normalizarCambiosMutacion(raw?.Cambios_mutacion),
        // La caché `Razas` 25: la clase de monstruo que lleva una mutada, como la API.
        Clase_de_monstruo: toRefIdNombre(raw?.Clase_de_monstruo),
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
    public getRazaEnPasoEdad(idRaza: number, idPasoEdad: number): Promise<Raza> {
        return this.leerRazaDeApi(`razas/${idRaza}/pasos-edad/${idPasoEdad}`, 'No se pudo leer la raza a esa edad.');
    }

    /**
     * Las razas que pueden ser la base de una raza mutada (`GET /razas/{id}/bases`): la API decide cuáles cumplen lo que la
     * mutación pide de la base. Con `idAlineamiento`, comprueba también lo que pide del personaje. Con un error de la API,
     * su texto.
     */
    public async getBasesDeRazaMutada(idRaza: number, idAlineamiento: number | null = null): Promise<BasesRazaMutada> {
        try {
            const consulta = idAlineamiento === null ? '' : `?idAlineamiento=${toInt(idAlineamiento)}`;
            const raw = await firstValueFrom(this.http.get(`${environment.apiUrl}razas/${toInt(idRaza)}/bases${consulta}`));
            return basesDeRazaMutadaDesdeApi(raw);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudieron leer las razas base.');
        }
    }

    /**
     * Lo que la raza mutada pide del personaje, comprobado con lo que la creación ya sabe de él
     * (`POST /razas/{id}/requisitos-del-personaje`: el alineamiento, las características, el nivel, los DG y las clases),
     * con la misma regla que el alta. Lo que no se puede comprobar llega con `Cumple` `null`.
     */
    public async comprobarRequisitosDelPersonaje(
        idRaza: number,
        consulta: RequisitosDelPersonajeConsulta
    ): Promise<RequisitoDelPersonajeMutacion[]> {
        try {
            const raw: any = await firstValueFrom(
                this.http.post(`${environment.apiUrl}razas/${toInt(idRaza)}/requisitos-del-personaje`, consulta));
            return requisitosDelPersonajeDesdeApi(raw?.Requisitos_del_personaje);
        } catch (error) {
            throw errorDePerfil(error, 'No se pudo comprobar lo que la raza pide del personaje.');
        }
    }

    private modeloMutacion: Promise<ModeloMutacion> | null = null;

    /**
     * Lo que necesita el formulario para dar de alta una raza mutada (`GET /razas/mutaciones/modelo`): los tipos de
     * prerrequisito, los campos combinables con su regla de hoy y los catálogos pequeños. Se lee una vez por sesión (un
     * error no se guarda: el siguiente intento vuelve a pedirlo).
     */
    public getModeloMutacion(): Promise<ModeloMutacion> {
        if (!this.modeloMutacion) {
            this.modeloMutacion = firstValueFrom(this.http.get(`${environment.apiUrl}razas/mutaciones/modelo`))
                .then((raw) => modeloMutacionDesdeApi(raw))
                .catch((error) => {
                    this.modeloMutacion = null;
                    throw errorDePerfil(error, 'No se pudo leer lo que admite una raza mutada.');
                });
        }
        return this.modeloMutacion;
    }

    /**
     * La raza mutada aplicada sobre una raza base, ya combinada por la API (`GET /razas/{id}/sobre/{idBase}`): la raza que
     * se elige en la creación. La web no combina. Con un error de la API, su texto (`raza_base_no_cumple_requisitos`…).
     */
    public getRazaSobreBase(idRaza: number, idRazaBase: number): Promise<Raza> {
        return this.leerRazaDeApi(
            `razas/${toInt(idRaza)}/sobre/${toInt(idRazaBase)}`, 'No se pudo aplicar la raza mutada sobre esa base.'
        );
    }

    /** Una `RazaCompleta` de una ruta de la API (`razas/…`), sin caché; con un error de la API, su texto. */
    private async leerRazaDeApi(ruta: string, porDefecto: string): Promise<Raza> {
        try {
            return normalizeRazaApi(await firstValueFrom(this.http.get(`${environment.apiUrl}${ruta}`)));
        } catch (error) {
            throw errorDePerfil(error, porDefecto);
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
    const { message, id } = leerRespuestaDeEscritura(response, 'idRaza', mensajePorDefecto);
    return { message, idRaza: id };
}

const ESTADOS_BASE_RAZA_MUTADA: EstadoBaseRazaMutada[] = ['elegible', 'con_aviso'];

function idsNombres(raw: any): { Id: number; Nombre: string; }[] {
    return toArray(raw).map((item: any) => ({ Id: toInt(item?.Id), Nombre: `${item?.Nombre ?? ''}` }));
}

/** `ModeloMutacion` de la API (`GET /razas/mutaciones/modelo`, estricto). */
export function modeloMutacionDesdeApi(raw: any): ModeloMutacion {
    const catalogos: ModeloMutacion['Catalogos'] = {};
    const fuente = raw?.Catalogos && typeof raw.Catalogos === 'object' ? raw.Catalogos : {};
    Object.keys(fuente).forEach((clave) => catalogos[clave] = idsNombres(fuente[clave]));
    return {
        Tipos_de_prerrequisito: toArray(raw?.Tipos_de_prerrequisito)
            .map((tipo: any): TipoPrerrequisitoMutacion => ({
                Clave: `${tipo?.Clave ?? ''}`,
                Nombre: `${tipo?.Nombre ?? ''}`,
                Ejemplo: `${tipo?.Ejemplo ?? ''}`,
                Sujeto: SUJETOS_MUTACION.includes(tipo?.Sujeto) ? tipo.Sujeto : 'raza_base',
                Dato: `${tipo?.Dato ?? ''}`,
                Comparador: `${tipo?.Comparador ?? ''}`,
                Catalogo: typeof tipo?.Catalogo === 'string' && tipo.Catalogo ? tipo.Catalogo : null,
                Pide_referencia: tipo?.Pide_referencia === true,
                Pide_cantidad: tipo?.Pide_cantidad === true,
                Pide_texto: tipo?.Pide_texto === true,
            }))
            .filter((tipo) => tipo.Clave.length > 0),
        Campos: toArray(raw?.Campos)
            .map((campo: any) => ({
                Campo: `${campo?.Campo ?? ''}`,
                Nombre: `${campo?.Nombre ?? ''}`,
                Clase: `${campo?.Clase ?? ''}`,
                Por_defecto: `${campo?.Por_defecto ?? ''}`,
                Operaciones: toArray(campo?.Operaciones).map((o: any) => `${o}`),
                Catalogo_elementos: typeof campo?.Catalogo_elementos === 'string' && campo.Catalogo_elementos
                    ? campo.Catalogo_elementos : null,
            }))
            .filter((campo) => campo.Campo.length > 0),
        Operaciones: toArray(raw?.Operaciones).map((o: any) => ({
            Clave: `${o?.Clave ?? ''}`, Nombre: `${o?.Nombre ?? ''}`, Descripcion: `${o?.Descripcion ?? ''}`,
            Valor: o?.Valor && typeof o.Valor === 'object'
                ? {
                    Nombre: `${o.Valor.Nombre ?? ''}`,
                    Obligatorio: o.Valor.Obligatorio === true,
                    Minimo: toNumber(o.Valor.Minimo),
                    Maximo: toNumber(o.Valor.Maximo),
                }
                : null,
        })),
        Catalogos: catalogos,
    };
}

/** `BasesDeRazaMutada` de la API (estricto: lo que no trae su forma no se lee). */
export function basesDeRazaMutadaDesdeApi(raw: any): BasesRazaMutada {
    const bases: BaseRazaMutada[] = toArray(raw?.Bases)
        .map((base: any) => ({
            Id: toInt(base?.Id),
            Nombre: `${base?.Nombre ?? ''}`,
            Oficial: base?.Oficial === true,
            Estado: ESTADOS_BASE_RAZA_MUTADA.includes(base?.Estado) ? base.Estado : 'con_aviso',
            Avisos: toArray(base?.Avisos).map((aviso: any) => `${aviso}`),
        }))
        .filter((base) => base.Id > 0);
    return {
        Raza: { Id: toInt(raw?.Raza?.Id), Nombre: `${raw?.Raza?.Nombre ?? ''}` },
        Bases: bases,
        Requisitos_del_personaje: requisitosDelPersonajeDesdeApi(raw?.Requisitos_del_personaje),
    };
}

/** `Requisitos_del_personaje` de `/bases` y de `POST /razas/{id}/requisitos-del-personaje` (`RequisitoDelPersonajeMutacion`). */
export function requisitosDelPersonajeDesdeApi(raw: any): RequisitoDelPersonajeMutacion[] {
    return toArray(raw).map((requisito: any) => ({
        Frase: `${requisito?.Frase ?? ''}`,
        Cumple: typeof requisito?.Cumple === 'boolean' ? requisito.Cumple : null,
        Confirma_master: requisito?.Confirma_master === true,
    }));
}
