import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, Unsubscribe, onValue, ref, set, update } from '@angular/fire/database';
import { Observable, firstValueFrom, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
    Personaje,
    PersonajeCompetenciaArmaduraDirecta,
    PersonajeCompetenciaDirecta
} from '../interfaces/personaje';
import { environment } from 'src/environments/environment';
import { RazaSimple } from '../interfaces/simplificaciones/raza-simple';
import Swal from 'sweetalert2';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { DoteContextual } from '../interfaces/dote-contextual';
import { toDoteContextualArray, toDoteLegacyArray } from './utils/dote-mapper';
import {
    CatalogoNombreIdDto,
    PersonajeContextoIdsDto,
    PersonajeCreateApiResponseDto,
    PersonajeCreateColeccionesDto,
    PersonajeCreateModificadoresDto,
    PersonajeCreateRequestDto,
    PersonajeCreateResponseDto
} from '../interfaces/personajes-api';
import {
    normalizeCompaneroMonstruoDetalleArray,
    normalizeFamiliarMonstruoDetalleArray
} from './utils/monstruo-mapper';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';

interface PersonajeVisibilityUpdateResponse {
    message: string;
    idPersonaje: number;
    visible_otros_usuarios: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PersonajeService {

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    async getDetallesPersonaje(id: number): Promise<Observable<Personaje>> {
        const personajeId = Math.trunc(toNumber(id));
        if (personajeId <= 0)
            throw new Error('Id de personaje no válido');

        try {
            if (!this.auth.currentUser) {
                const personajePublico = await this.readPublicDetalleFromCache(personajeId);
                return of(personajePublico);
            }

            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.get<any>(`${environment.apiUrl}personajes/${personajeId}`, { headers })
            );
            return of(this.mapApiDetalleToPersonaje(response));
        } catch (error: any) {
            throw new Error(this.obtenerMensajeErrorHttp(error, 'No se pudo cargar el detalle del personaje.'));
        }
    }

    private d_pjs(headers?: HttpHeaders): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}personajes`, headers ? { headers } : undefined);
        return res;
    }

    public async actualizarVisibilidadPersonaje(
        idPersonaje: number,
        visible: boolean,
    ): Promise<PersonajeVisibilityUpdateResponse> {
        const id = Math.trunc(toNumber(idPersonaje));
        if (id <= 0)
            throw new Error('Id de personaje no válido');

        const payload = {
            visible_otros_usuarios: !!visible,
        };

        const response = await firstValueFrom(
            this.http.patch<PersonajeVisibilityUpdateResponse>(
                `${environment.apiUrl}personajes/${id}/visible`,
                payload
                ,
                { headers: await this.buildAuthHeaders() }
            )
        );

        try {
            await Promise.all([
                this.firebaseContextSvc.run(() => update(ref(this.db, `Personajes/${id}`), {
                    visible_otros_usuarios: !!visible,
                })),
                this.firebaseContextSvc.run(() => update(ref(this.db, `Personajes-simples/${id}`), {
                    visible_otros_usuarios: !!visible,
                })),
            ]);
        } catch {
            // Usuarios no-admin pueden no tener permisos de escritura en RTDB.
        }

        return {
            ...response,
            idPersonaje: Math.trunc(toNumber(response?.idPersonaje)),
            visible_otros_usuarios: !!visible,
        };
    }

    public construirPayloadCreacionDesdePersonaje(
        personaje: Personaje,
        contextoIds: PersonajeContextoIdsDto
    ): PersonajeCreateRequestDto {
        const nombre = `${personaje?.Nombre ?? ''}`.trim();
        const idRaza = Math.trunc(toNumber(personaje?.Raza?.Id));
        const idTipoCriatura = Math.trunc(toNumber(personaje?.Tipo_criatura?.Id));
        const idCampana = Math.trunc(toNumber(contextoIds?.idCampana));
        const idTrama = Math.trunc(toNumber(contextoIds?.idTrama));
        const idSubtrama = Math.trunc(toNumber(contextoIds?.idSubtrama));
        const esSinCampana = normalizeLookupKey(personaje?.Campana) === 'sin campana';
        const tieneContextoCampana = !esSinCampana && idCampana > 0 && idTrama > 0 && idSubtrama > 0;
        const tieneClaseConNivel = (personaje?.desgloseClases ?? [])
            .some((entrada) => Math.trunc(toNumber(entrada?.Nivel)) > 0);
        const mapasCatalogo = {
            clases: this.construirMapaNombreId(contextoIds?.catalogos?.clases),
            dominios: this.construirMapaNombreId(contextoIds?.catalogos?.dominios),
            idiomas: this.construirMapaNombreId(contextoIds?.catalogos?.idiomas),
            ventajas: this.construirMapaNombreId(contextoIds?.catalogos?.ventajas),
            escuelas: this.construirMapaNombreId(contextoIds?.catalogos?.escuelas),
            disciplinas: this.construirMapaNombreId(contextoIds?.catalogos?.disciplinas),
            regiones: this.construirMapaNombreId(contextoIds?.catalogos?.regiones),
        };

        if (nombre.length < 1)
            throw new Error('El personaje debe tener nombre antes de finalizar.');
        if (idRaza <= 0)
            throw new Error('La raza del personaje no es válida.');
        if (idTipoCriatura <= 0)
            throw new Error('El tipo de criatura del personaje no es válido.');
        if (!tieneClaseConNivel)
            throw new Error('Debes tener al menos una clase con nivel mayor que 0.');
        if (!esSinCampana && !tieneContextoCampana)
            throw new Error('No se pudo resolver el contexto de campaña/trama/subtrama.');

        const idAlineamiento = Math.trunc(toNumber(contextoIds?.idAlineamiento))
            || this.resolverIdAlineamientoDesdeNombre(personaje?.Alineamiento);
        const idGenero = Math.trunc(toNumber(contextoIds?.idGenero))
            || this.resolverIdGeneroDesdeNombre(personaje?.Genero);
        const idCarga = Math.trunc(toNumber(contextoIds?.idCarga))
            || this.resolverIdCargaDesdeFuerza(personaje?.Fuerza);
        const idDeidadFromContexto = Math.trunc(toNumber(contextoIds?.idDeidad));
        const idDeidad = idDeidadFromContexto > 0 ? idDeidadFromContexto : 0;
        const idManiobrabilidad = Math.trunc(toNumber(contextoIds?.idManiobrabilidad))
            || Math.trunc(toNumber((personaje as any)?.Raza?.Maniobrabilidad?.Id));
        const idEspArcana = Math.trunc(toNumber(contextoIds?.idEspArcana))
            || this.resolverIdPorNombre((personaje?.Escuela_especialista as any)?.Nombre, mapasCatalogo.escuelas);
        const idEspPsionica = Math.trunc(toNumber(contextoIds?.idEspPsionica))
            || this.resolverIdPorNombre((personaje?.Disciplina_especialista as any)?.Nombre, mapasCatalogo.disciplinas);
        const idDisProhibida = Math.trunc(toNumber(contextoIds?.idDisProhibida))
            || this.resolverIdPorNombre(personaje?.Disciplina_prohibida, mapasCatalogo.disciplinas);
        const idRegion = this.resolverIdRegionParaPayload(personaje, contextoIds, mapasCatalogo.regiones);
        const deidadSeleccionada = normalizeLookupKey(personaje?.Deidad);

        if (idAlineamiento <= 0)
            throw new Error('No se pudo resolver el id de alineamiento para el payload de creación.');
        if (idGenero <= 0)
            throw new Error('No se pudo resolver el id de género para el payload de creación.');
        if (idCarga <= 0)
            throw new Error('No se pudo resolver el id de carga para el payload de creación.');
        if (deidadSeleccionada.length > 0 && deidadSeleccionada !== 'no tener deidad' && idDeidad <= 0)
            throw new Error('No se pudo resolver el id de deidad para el payload de creación.');

        const caracteristicasPerdidas = {
            ...(personaje?.Caracteristicas_perdidas ?? {}),
            Constitucion: !!(personaje?.Caracteristicas_perdidas?.Constitucion || personaje?.Constitucion_perdida),
        };
        const idTamano = Math.trunc(toNumber(personaje?.Raza?.Tamano?.Id));
        const idRazaBase = Math.trunc(toNumber((personaje as any)?.RazaBase?.Id));
        const modificadores = this.construirPayloadModificadores(personaje);
        const colecciones = this.construirPayloadColecciones(personaje, mapasCatalogo);

        const personajePayload: PersonajeCreateRequestDto['personaje'] = {
            nombre,
            ataqueBase: `${personaje?.Ataque_base ?? '0'}`.trim() || '0',
            idRaza,
            idTipoCriatura,
            idRegion,
            descripcionPersonalidad: `${personaje?.Personalidad ?? ''}`.trim(),
            descripcionHistoria: `${personaje?.Contexto ?? ''}`.trim(),
            armaduraNatural: Math.trunc(toNumber(personaje?.Armadura_natural)),
            caDesvio: Math.trunc(toNumber(personaje?.Ca_desvio)),
            altura: toNumber(personaje?.Altura),
            edad: Math.trunc(toNumber(personaje?.Edad)),
            peso: toNumber(personaje?.Peso),
            ajuste: Math.trunc(toNumber((personaje as any)?.Raza?.Ajuste_nivel)),
            deidad: idDeidad > 0 ? idDeidad : 0,
            idAlineamiento,
            idGenero,
            idCarga,
            puntosGolpe: Math.max(1, Math.trunc(toNumber(personaje?.Vida))),
            pgsLic: Math.trunc(toNumber(personaje?.Pgs_lic)),
            correr: Math.trunc(toNumber(personaje?.Correr)),
            nadar: Math.trunc(toNumber(personaje?.Nadar)),
            volar: Math.trunc(toNumber(personaje?.Volar)),
            idManiobrabilidad: idManiobrabilidad > 0 ? idManiobrabilidad : 0,
            trepar: Math.trunc(toNumber(personaje?.Trepar)),
            escalar: Math.trunc(toNumber(personaje?.Escalar)),
            espacio: Math.trunc(toNumber((personaje as any)?.Espacio)),
            alcance: Math.trunc(toNumber((personaje as any)?.Alcance)),
            idEspArcana: idEspArcana > 0 ? idEspArcana : 0,
            idEspPsionica: idEspPsionica > 0 ? idEspPsionica : 0,
            idDisProhibida: idDisProhibida > 0 ? idDisProhibida : 0,
            visible_otros_usuarios: !!personaje?.visible_otros_usuarios,
            oficial: personaje?.Oficial !== false,
        };
        if (idRazaBase > 0)
            personajePayload.idRazaBase = idRazaBase;
        if (tieneContextoCampana) {
            personajePayload.campana = { id: idCampana };
            personajePayload.trama = { id: idTrama };
            personajePayload.subtrama = { id: idSubtrama };
        }

        const payload: PersonajeCreateRequestDto = {
            personaje: personajePayload,
            caracteristicas: {
                fuerza: {
                    valor: Math.trunc(toNumber(personaje?.Fuerza)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Fuerza,
                },
                destreza: {
                    valor: Math.trunc(toNumber(personaje?.Destreza)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Destreza,
                },
                constitucion: {
                    valor: Math.trunc(toNumber(personaje?.Constitucion)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Constitucion,
                },
                inteligencia: {
                    valor: Math.trunc(toNumber(personaje?.Inteligencia)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Inteligencia,
                },
                sabiduria: {
                    valor: Math.trunc(toNumber(personaje?.Sabiduria)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Sabiduria,
                },
                carisma: {
                    valor: Math.trunc(toNumber(personaje?.Carisma)),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Carisma,
                },
            },
            tamano: {
                idTamano: idTamano > 0 ? idTamano : 0,
                origen: 'Web',
            },
        };
        if (Object.keys(modificadores).length > 0)
            payload.modificadores = modificadores;
        if (Object.keys(colecciones).length > 0)
            payload.colecciones = colecciones;
        return payload;
    }

    private construirPayloadModificadores(personaje: Personaje): PersonajeCreateModificadoresDto {
        const ca: { valor: number; origen?: string; }[] = [];
        const iniciativa: { valor: number; origen?: string; }[] = [];
        const presa: { valor: number; origen?: string; }[] = [];

        const modCaVarios = Math.trunc(toNumber(personaje?.Ca_varios));
        if (modCaVarios !== 0)
            ca.push({ valor: modCaVarios, origen: 'Varios' });

        toArray<any>(personaje?.Iniciativa_varios).forEach((entrada) => {
            const valor = Math.trunc(toNumber(entrada?.Valor ?? entrada?.valor));
            if (valor === 0)
                return;
            iniciativa.push({
                valor,
                origen: `${entrada?.Origen ?? entrada?.origen ?? 'Varios'}`.trim() || 'Varios',
            });
        });

        toArray<any>(personaje?.Presa_varios).forEach((entrada) => {
            const valor = Math.trunc(toNumber(entrada?.Valor ?? entrada?.valor));
            if (valor === 0)
                return;
            presa.push({
                valor,
                origen: `${entrada?.Origen ?? entrada?.origen ?? 'Varios'}`.trim() || 'Varios',
            });
        });

        const salvaciones = {
            fortaleza: {
                claseos: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.fortaleza?.modsClaseos),
                varios: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.fortaleza?.modsVarios),
            },
            reflejos: {
                claseos: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.reflejos?.modsClaseos),
                varios: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.reflejos?.modsVarios),
            },
            voluntad: {
                claseos: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.voluntad?.modsClaseos),
                varios: this.mapearModsSalvacion((personaje as any)?.Salvaciones?.voluntad?.modsVarios),
            },
        };

        const payload: PersonajeCreateModificadoresDto = {};
        if (ca.length > 0)
            payload.ca = ca;
        if (iniciativa.length > 0)
            payload.iniciativa = iniciativa;
        if (presa.length > 0)
            payload.presa = presa;

        const haySalvaciones =
            salvaciones.fortaleza.claseos.length > 0
            || salvaciones.fortaleza.varios.length > 0
            || salvaciones.reflejos.claseos.length > 0
            || salvaciones.reflejos.varios.length > 0
            || salvaciones.voluntad.claseos.length > 0
            || salvaciones.voluntad.varios.length > 0;
        if (haySalvaciones)
            payload.salvaciones = salvaciones;
        return payload;
    }

    private construirPayloadColecciones(
        personaje: Personaje,
        mapasCatalogo: {
            clases: Map<string, number>;
            dominios: Map<string, number>;
            idiomas: Map<string, number>;
            ventajas: Map<string, number>;
            escuelas: Map<string, number>;
            disciplinas: Map<string, number>;
        }
    ): PersonajeCreateColeccionesDto {
        const colecciones: PersonajeCreateColeccionesDto = {};

        const clases = toArray<any>(personaje?.desgloseClases)
            .map((entrada) => {
                const nombre = `${entrada?.Nombre ?? ''}`.trim();
                const idDirecto = Math.trunc(toNumber(entrada?.Id ?? entrada?.idClase ?? entrada?.id_clase));
                const idClase = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.clases);
                const nivel = Math.trunc(toNumber(entrada?.Nivel ?? entrada?.nivel));
                if (idClase <= 0 || nivel <= 0)
                    return null;
                return { idClase, nivel };
            })
            .filter((entrada): entrada is { idClase: number; nivel: number; } => !!entrada);
        if (clases.length > 0)
            colecciones.clases = clases;

        const plantillas = toArray<any>(personaje?.Plantillas)
            .map((entrada) => {
                const idPlantilla = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idPlantilla));
                if (idPlantilla <= 0)
                    return null;
                return { idPlantilla };
            })
            .filter((entrada): entrada is { idPlantilla: number; } => !!entrada);
        if (plantillas.length > 0)
            colecciones.plantillas = plantillas;

        const subtipos = toArray<any>(personaje?.Subtipos)
            .map((entrada) => {
                const idSubtipo = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idSubtipo));
                if (idSubtipo <= 0)
                    return null;
                return { idSubtipo };
            })
            .filter((entrada): entrada is { idSubtipo: number; } => !!entrada);
        if (subtipos.length > 0)
            colecciones.subtipos = subtipos;

        const competenciasArma = mapCompetenciasPayload(
            personaje?.competencia_arma,
            ['Id', 'id', 'Id_arma', 'id_arma'],
            (idArma) => ({ idArma })
        );
        if (competenciasArma.length > 0)
            colecciones.competencia_arma = competenciasArma;

        const competenciasArmadura = mapCompetenciasPayload(
            personaje?.competencia_armadura,
            ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma'],
            (idArmadura) => ({ idArmadura })
        );
        if (competenciasArmadura.length > 0)
            colecciones.competencia_armadura = competenciasArmadura;

        const competenciasGrupoArma = mapCompetenciasPayload(
            personaje?.competencia_grupo_arma,
            ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo'],
            (idGrupoArma) => ({ idGrupoArma })
        );
        if (competenciasGrupoArma.length > 0)
            colecciones.competencia_grupo_arma = competenciasGrupoArma;

        const competenciasGrupoArmadura = mapCompetenciasPayload(
            personaje?.competencia_grupo_armadura,
            ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo'],
            (idGrupoArmadura) => ({ idGrupoArmadura })
        );
        if (competenciasGrupoArmadura.length > 0)
            colecciones.competencia_grupo_armadura = competenciasGrupoArmadura;

        const dgsExtra: Array<{ valor: number; origen?: string; teriantropia?: boolean; }> = [];
        const dgsRaza = Math.trunc(toNumber((personaje as any)?.Raza?.Dgs_adicionales?.Cantidad));
        if (dgsRaza > 0) {
            dgsExtra.push({
                valor: dgsRaza,
                origen: `${(personaje as any)?.Raza?.Nombre ?? 'Raza'}`.trim() || 'Raza',
                teriantropia: false,
            });
        }
        if (dgsExtra.length > 0)
            colecciones.dgsExtra = dgsExtra;

        const escuelasProhibidas = toArray<any>((personaje as any)?.Escuelas_prohibidas)
            .map((entrada) => {
                const idDirecto = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idEscuela ?? entrada?.id_escuela));
                const nombre = typeof entrada === 'string'
                    ? entrada
                    : `${entrada?.Nombre ?? entrada?.nombre ?? ''}`;
                const idEscuela = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.escuelas);
                if (idEscuela <= 0)
                    return null;
                return { idEscuela };
            })
            .filter((entrada): entrada is { idEscuela: number; } => !!entrada);
        if (escuelasProhibidas.length > 0)
            colecciones.escuelasProhibidas = escuelasProhibidas;

        const rd = this.mapearResistencias((personaje as any)?.Rds, 'rd');
        const rc = this.mapearResistencias((personaje as any)?.Rcs, 'rc');
        const re = this.mapearResistencias((personaje as any)?.Res, 're');
        if (rd.length > 0)
            colecciones.rd = rd;
        if (rc.length > 0)
            colecciones.rc = rc;
        if (re.length > 0)
            colecciones.re = re;

        const enemigosPredilectos = toArray<any>((personaje as any)?.enemigosPredilectos)
            .map((entrada) => {
                const idEnemigo = Math.trunc(toNumber(entrada?.id ?? entrada?.Id ?? entrada?.idEnemigo ?? entrada?.id_enemigo));
                if (idEnemigo <= 0)
                    return null;
                return {
                    idEnemigo,
                    cantidad: Math.max(1, Math.trunc(toNumber(entrada?.cantidad ?? entrada?.Cantidad ?? entrada?.veces))),
                };
            })
            .filter((entrada): entrada is { idEnemigo: number; cantidad: number; } => !!entrada);
        if (enemigosPredilectos.length > 0)
            colecciones.enemigosPredilectos = enemigosPredilectos;

        const habilidadesBase: Array<{
            idHabilidad: number;
            idExtra?: number;
            clasea?: boolean;
            rangos?: number;
            rangosVarios?: number;
            modVarios?: string;
        }> = [];
        const habilidadesCustom: Array<{
            idHabilidad: number;
            idExtra?: number;
            clasea?: boolean;
            rangos?: number;
            rangosVarios?: number;
            modVarios?: string;
        }> = [];

        toArray<any>((personaje as any)?.Habilidades).forEach((entrada) => {
            const idHabilidad = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.Id_habilidad ?? entrada?.id_habilidad));
            if (idHabilidad <= 0)
                return;
            const idExtra = this.resolverIdExtraHabilidad(entrada);
            const payload = {
                idHabilidad,
                idExtra: idExtra > 0 ? idExtra : 0,
                clasea: !!entrada?.Clasea,
                rangos: Math.max(0, Math.trunc(toNumber(entrada?.Rangos))),
                rangosVarios: Math.max(0, Math.trunc(toNumber(entrada?.Rangos_varios))),
                modVarios: `${entrada?.Varios ?? ''}`.trim(),
            };
            if (entrada?.Custom)
                habilidadesCustom.push(payload);
            else
                habilidadesBase.push(payload);
        });
        if (habilidadesBase.length > 0 || habilidadesCustom.length > 0) {
            colecciones.habilidades = {};
            if (habilidadesBase.length > 0)
                colecciones.habilidades.base = habilidadesBase;
            if (habilidadesCustom.length > 0)
                colecciones.habilidades.custom = habilidadesCustom;
        }

        const ventajas = toArray<any>(personaje?.Ventajas)
            .map((entrada) => {
                const idDirecto = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idVentaja ?? entrada?.id_ventaja));
                const nombre = typeof entrada === 'string'
                    ? entrada
                    : `${entrada?.Nombre ?? entrada?.nombre ?? ''}`;
                const idVentaja = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.ventajas);
                if (idVentaja <= 0)
                    return null;
                return { idVentaja };
            })
            .filter((entrada): entrada is { idVentaja: number; } => !!entrada);
        if (ventajas.length > 0)
            colecciones.ventajas = ventajas;

        const idiomas = toArray<any>(personaje?.Idiomas)
            .map((entrada) => {
                const idDirecto = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idIdioma ?? entrada?.id_idioma));
                const nombre = `${entrada?.Nombre ?? entrada?.nombre ?? ''}`.trim();
                const idIdioma = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.idiomas);
                if (idIdioma <= 0)
                    return null;
                const origen = `${entrada?.Origen ?? entrada?.origen ?? ''}`.trim();
                return {
                    idIdioma,
                    origen: origen.length > 0 ? origen : undefined,
                };
            })
            .filter((entrada) => !!entrada) as { idIdioma: number; origen?: string; }[];
        if (idiomas.length > 0)
            colecciones.idiomas = idiomas;

        const dotes = toDoteContextualArray((personaje as any)?.DotesContextuales ?? (personaje as any)?.Dotes ?? [])
            .map((entrada) => {
                const idDote = Math.trunc(toNumber(entrada?.Dote?.Id ?? (entrada as any)?.Dote?.id));
                if (idDote <= 0)
                    return null;
                const idExtra = Math.max(0, Math.trunc(toNumber((entrada as any)?.Contexto?.Id_extra)));
                const origen = `${(entrada as any)?.Contexto?.Origen ?? (entrada as any)?.Contexto?.Entidad ?? 'API'}`.trim() || 'API';
                return {
                    idDote,
                    idExtra,
                    origen,
                };
            })
            .filter((entrada) => !!entrada) as { idDote: number; idExtra?: number; origen?: string; }[];
        if (dotes.length > 0)
            colecciones.dotes = dotes;

        const dominios = toArray<any>(personaje?.Dominios)
            .map((entrada) => {
                const idDirecto = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idDominio ?? entrada?.id_dominio));
                const nombre = `${entrada?.Nombre ?? entrada?.nombre ?? ''}`.trim();
                const idDominio = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.dominios);
                if (idDominio <= 0)
                    return null;
                const origen = `${entrada?.Origen ?? entrada?.origen ?? ''}`.trim();
                return {
                    idDominio,
                    origen: origen.length > 0 ? origen : 'No especifica',
                };
            })
            .filter((entrada) => !!entrada) as { idDominio: number; origen?: string; }[];
        if (dominios.length > 0)
            colecciones.dominios = dominios;

        const conjurosConocidos = toArray<any>(personaje?.Conjuros)
            .map((entrada) => {
                const idConjuro = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idConjuro ?? entrada?.id_conjuro));
                if (idConjuro <= 0)
                    return null;
                return { idConjuro };
            })
            .filter((entrada): entrada is { idConjuro: number; } => !!entrada);
        if (conjurosConocidos.length > 0)
            colecciones.conjurosConocidos = conjurosConocidos;

        const sortilegas = toArray<any>(personaje?.Sortilegas)
            .map((entrada) => {
                const idConjuro = Math.trunc(toNumber(entrada?.Conjuro?.Id ?? entrada?.Id ?? entrada?.idConjuro ?? entrada?.id_conjuro));
                if (idConjuro <= 0)
                    return null;
                return {
                    idConjuro,
                    nivelLanz: `${entrada?.Nivel_lanzador ?? entrada?.nivel_lanz ?? '0'}`.trim() || '0',
                    usos: `${entrada?.Usos_diarios ?? entrada?.usos ?? '0'}`.trim() || '0',
                    dgs: Math.max(0, Math.trunc(toNumber(entrada?.Dgs_necesarios ?? entrada?.dgs))),
                    origen: `${entrada?.Origen ?? entrada?.origen ?? 'API'}`.trim() || 'API',
                };
            })
            .filter((entrada) => !!entrada) as { idConjuro: number; nivelLanz?: string; usos?: string; dgs?: number; origen?: string; }[];
        if (sortilegas.length > 0)
            colecciones.sortilegas = sortilegas;

        const raciales = toArray<any>(personaje?.Raciales)
            .map((entrada) => {
                const idRacial = Math.trunc(toNumber(entrada?.Id ?? entrada?.id ?? entrada?.idRacial ?? entrada?.id_racial));
                if (idRacial <= 0)
                    return null;
                return {
                    idRacial,
                    origen: `${entrada?.Origen ?? entrada?.origen ?? 'API'}`.trim() || 'API',
                };
            })
            .filter((entrada) => !!entrada) as { idRacial: number; origen?: string; }[];
        if (raciales.length > 0)
            colecciones.raciales = raciales;

        return colecciones;
    }

    private resolverIdRegionParaPayload(
        personaje: Personaje,
        contextoIds: PersonajeContextoIdsDto,
        mapaRegiones: Map<string, number>
    ): number {
        const idDesdeContexto = this.toNonNegativeIntOrNull((contextoIds as any)?.idRegion);
        if (idDesdeContexto !== null)
            return idDesdeContexto;

        const idDesdePersonaje = this.toNonNegativeIntOrNull((personaje as any)?.Id_region ?? (personaje as any)?.id_region);
        if (idDesdePersonaje !== null)
            return idDesdePersonaje;

        const idDesdeRegion = this.toNonNegativeIntOrNull(
            (personaje as any)?.Region?.Id
            ?? (personaje as any)?.Region?.id
            ?? (personaje as any)?.region?.Id
            ?? (personaje as any)?.region?.id
        );
        if (idDesdeRegion !== null)
            return idDesdeRegion;

        const nombreRegion = `${(personaje as any)?.Region?.Nombre
            ?? (personaje as any)?.Region?.nombre
            ?? (personaje as any)?.region?.Nombre
            ?? (personaje as any)?.region?.nombre
            ?? ''}`.trim();
        const idPorNombre = this.resolverIdPorNombre(nombreRegion, mapaRegiones);
        return idPorNombre > 0 ? idPorNombre : 0;
    }

    private mapearResistencias(
        values: any,
        key: 'rd' | 'rc' | 're'
    ): any[] {
        return toArray<any>(values)
            .map((entrada) => {
                const modificador = `${entrada?.Modificador ?? entrada?.modificador ?? entrada?.[key] ?? ''}`.trim();
                if (modificador.length < 1)
                    return null;
                const origen = `${entrada?.Origen ?? entrada?.origen ?? 'API'}`.trim() || 'API';
                if (key === 'rd')
                    return { rd: modificador, origen };
                if (key === 'rc')
                    return { rc: modificador, origen };
                return { re: modificador, origen };
            })
            .filter((entrada) => !!entrada);
    }

    private mapearModsSalvacion(values: any): { valor: number; origen?: string; }[] {
        return toArray<any>(values)
            .map((entrada) => {
                const valor = Math.trunc(toNumber(entrada?.valor ?? entrada?.Valor));
                if (valor === 0)
                    return null;
                return {
                    valor,
                    origen: `${entrada?.origen ?? entrada?.Origen ?? 'Varios'}`.trim() || 'Varios',
                };
            })
            .filter((entrada) => !!entrada) as { valor: number; origen?: string; }[];
    }

    private resolverIdExtraHabilidad(entrada: any): number {
        const idExtraDirecto = Math.trunc(toNumber(entrada?.Id_extra ?? entrada?.id_extra ?? entrada?.idExtra));
        if (idExtraDirecto > 0)
            return idExtraDirecto;
        const extraSeleccionado = `${entrada?.Extra ?? entrada?.extra ?? ''}`.trim();
        if (extraSeleccionado.length < 1)
            return 0;
        const extraNorm = normalizeLookupKey(extraSeleccionado);
        const match = toArray<any>(entrada?.Extras)
            .find((item) => normalizeLookupKey(`${item?.Extra ?? item?.extra ?? item?.Nombre ?? item?.nombre ?? ''}`) === extraNorm);
        const idExtra = Math.trunc(toNumber(match?.Id_extra ?? match?.id_extra ?? match?.idExtra ?? match?.Id));
        return idExtra > 0 ? idExtra : 0;
    }

    private construirMapaNombreId(items?: CatalogoNombreIdDto[]): Map<string, number> {
        const mapa = new Map<string, number>();
        toArray<CatalogoNombreIdDto>(items).forEach((item) => {
            const id = Math.trunc(toNumber(item?.id));
            const key = normalizeLookupKey(item?.nombre);
            if (id > 0 && key.length > 0 && !mapa.has(key))
                mapa.set(key, id);
        });
        return mapa;
    }

    private resolverIdPorNombre(nombre: any, mapa: Map<string, number>): number {
        const key = normalizeLookupKey(nombre);
        if (key.length < 1)
            return 0;
        return Math.trunc(toNumber(mapa.get(key)));
    }

    private toNonNegativeIntOrNull(value: any): number | null {
        if (value === null || value === undefined)
            return null;
        const text = `${value}`.trim();
        if (text.length < 1)
            return null;
        const parsed = Math.trunc(Number(text));
        if (!Number.isFinite(parsed) || parsed < 0)
            return null;
        return parsed;
    }

    private resolverIdGeneroDesdeNombre(nombreGenero: any): number {
        const key = normalizeLookupKey(nombreGenero);
        if (key === 'macho')
            return 1;
        if (key === 'hembra')
            return 2;
        if (key === 'hermafrodita')
            return 3;
        if (key === 'sin genero')
            return 4;
        return 0;
    }

    private resolverIdAlineamientoDesdeNombre(nombreAlineamiento: any): number {
        const key = normalizeLookupKey(nombreAlineamiento);
        const mapa: Record<string, number> = {
            'legal bueno': 1,
            'legal neutral': 2,
            'legal maligno': 3,
            'neutral bueno': 4,
            'neutral autentico': 5,
            'neutral maligno': 6,
            'caotico bueno': 7,
            'caotico neutral': 8,
            'caotico maligno': 9,
        };
        return Math.trunc(toNumber(mapa[key] ?? 0));
    }

    private resolverIdCargaDesdeFuerza(fuerza: any): number {
        const fuerzaValor = Math.trunc(toNumber(fuerza));
        if (fuerzaValor >= 10)
            return Math.min(fuerzaValor - 9, 20);
        return 1;
    }

    public async crearPersonajeApiDesdeCreacion(payload: PersonajeCreateRequestDto): Promise<PersonajeCreateResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.post<PersonajeCreateApiResponseDto>(
                    `${environment.apiUrl}personajes/add`,
                    payload,
                    { headers: await this.buildAuthHeaders() }
                )
            );
            const idPersonaje = Math.trunc(toNumber(response?.idPersonaje));
            const ownerUserId = `${response?.ownerUserId ?? ''}`.trim();
            if (idPersonaje <= 0)
                throw new Error('La API no devolvió un id de personaje válido.');
            if (ownerUserId.length < 1)
                throw new Error('La API no devolvió un ownerUserId válido.');

            return {
                message: `${response?.message ?? 'Personaje creado'}`,
                idPersonaje,
                ownerUserId,
            };
        } catch (error: any) {
            throw new Error(this.obtenerMensajeErrorHttp(error, 'No se pudo crear el personaje en la API.'));
        }
    }

    public normalizarPersonajeParaPersistenciaFinal(personaje: Personaje, idPersonaje: number): Personaje {
        const id = Math.trunc(toNumber(idPersonaje));
        const clonado = JSON.parse(JSON.stringify(personaje ?? {})) as Personaje;
        const dotesContextuales = toDoteContextualArray(clonado?.DotesContextuales ?? clonado?.Dotes ?? []);

        const dotesContextualesActualizadas = dotesContextuales.map((entrada) => {
            const contexto = { ...(entrada?.Contexto ?? ({} as any)) } as any;
            if (`${contexto?.Entidad ?? ''}`.trim().toLowerCase() === 'personaje')
                contexto.Id_personaje = id;
            return {
                ...entrada,
                Contexto: contexto,
            };
        });

        const clasesNormalizadas = Array.isArray(clonado?.desgloseClases)
            ? clonado.desgloseClases
                .map((entrada) => ({
                    Nombre: `${entrada?.Nombre ?? ''}`.trim(),
                    Nivel: Math.max(0, Math.trunc(toNumber(entrada?.Nivel))),
                }))
                .filter((entrada) => entrada.Nombre.length > 0 && entrada.Nivel > 0)
            : [];

        clonado.Id = id;
        clonado.ownerUid = toNullableText(clonado?.ownerUid);
        clonado.visible_otros_usuarios = !!clonado?.visible_otros_usuarios;
        clonado.Archivado = false;
        clonado.desgloseClases = clasesNormalizadas;
        clonado.Clases = clasesNormalizadas
            .map((entrada) => `${entrada.Nombre} (${entrada.Nivel})`)
            .join(', ');
        clonado.Subtipos = normalizeSubtipoRefArray(clonado?.Subtipos ?? []);
        clonado.competencia_arma = normalizeCompetenciasPersonaje(clonado?.competencia_arma, {
            idKeys: ['Id', 'id', 'Id_arma', 'id_arma', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Arma', 'arma'],
        }) as PersonajeCompetenciaDirecta[];
        clonado.competencia_armadura = normalizeCompetenciasPersonaje(clonado?.competencia_armadura, {
            idKeys: ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Armadura', 'armadura', 'Arma', 'arma'],
            includeShield: true,
        }) as PersonajeCompetenciaArmaduraDirecta[];
        clonado.competencia_grupo_arma = normalizeCompetenciasPersonaje(clonado?.competencia_grupo_arma, {
            idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
        }) as PersonajeCompetenciaDirecta[];
        clonado.competencia_grupo_armadura = normalizeCompetenciasPersonaje(clonado?.competencia_grupo_armadura, {
            idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
        }) as PersonajeCompetenciaDirecta[];
        clonado.Raciales = normalizeRaciales(clonado?.Raciales ?? []);
        clonado.Familiares = normalizeFamiliarMonstruoDetalleArray(clonado?.Familiares ?? [], 1);
        clonado.Companeros = normalizeCompaneroMonstruoDetalleArray(clonado?.Companeros ?? [], 1);
        clonado.DotesContextuales = dotesContextualesActualizadas;
        clonado.Dotes = toDoteLegacyArray(dotesContextualesActualizadas);
        clonado.Caracteristicas_perdidas = normalizeCaracteristicasPerdidasPersonaje(
            clonado?.Caracteristicas_perdidas,
            clonado?.Constitucion_perdida
        );
        clonado.Constitucion_perdida = !!clonado?.Caracteristicas_perdidas?.Constitucion;
        const idRegion = this.toNonNegativeIntOrNull(
            (clonado as any)?.Id_region
            ?? (clonado as any)?.id_region
            ?? (clonado as any)?.idRegion
            ?? (clonado as any)?.Region?.Id
            ?? (clonado as any)?.Region?.id
            ?? (clonado as any)?.region?.Id
            ?? (clonado as any)?.region?.id
        ) ?? 0;
        const nombreRegion = `${(clonado as any)?.Region?.Nombre
            ?? (clonado as any)?.Region?.nombre
            ?? (clonado as any)?.region?.Nombre
            ?? (clonado as any)?.region?.nombre
            ?? ''}`.trim();
        (clonado as any).Id_region = idRegion;
        (clonado as any).Region = {
            Id: idRegion,
            Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
        };
        return clonado;
    }

    public async guardarPersonajeEnFirebase(idPersonaje: number, personaje: Personaje): Promise<void> {
        const id = Math.trunc(toNumber(idPersonaje));
        if (id <= 0)
            throw new Error('Id de personaje no válido para guardar en Firebase.');

        const normalizado = this.normalizarPersonajeParaPersistenciaFinal(personaje, id);
        const clasesDetalle = [...(normalizado?.desgloseClases ?? [])];
        const detallePayload: Record<string, any> = {
            ...normalizado,
            Id: id,
            ownerUid: toNullableText(normalizado?.ownerUid),
            visible_otros_usuarios: !!normalizado?.visible_otros_usuarios,
            Clases: clasesDetalle,
            Campana: `${normalizado?.Campana ?? ''}`,
            Trama: `${normalizado?.Trama ?? ''}`,
            Subtrama: `${normalizado?.Subtrama ?? ''}`,
        };

        const simplePayload = {
            Nombre: `${normalizado?.Nombre ?? ''}`.trim(),
            ownerUid: toNullableText(normalizado?.ownerUid),
            visible_otros_usuarios: !!normalizado?.visible_otros_usuarios,
            Raza: normalizado?.Raza ?? null,
            RazaBase: normalizado?.RazaBase ?? null,
            Id_region: Math.max(0, Math.trunc(toNumber((normalizado as any)?.Id_region))),
            Region: (normalizado as any)?.Region ?? { Id: 0, Nombre: 'Sin región' },
            Clases: `${normalizado?.Clases ?? ''}`.trim(),
            Contexto: `${normalizado?.Contexto ?? ''}`,
            Personalidad: `${normalizado?.Personalidad ?? ''}`,
            Campaña: `${normalizado?.Campana ?? ''}`,
            Trama: `${normalizado?.Trama ?? ''}`,
            Subtrama: `${normalizado?.Subtrama ?? ''}`,
            Archivado: false,
        };

        await Promise.all([
            this.escribirRutaFirebase(`Personajes/${id}`, detallePayload),
            this.escribirRutaFirebase(`Personajes-simples/${id}`, simplePayload),
        ]);

        try {
            await this.escribirRutaFirebase(`listado-personajes/${id}`, simplePayload);
        } catch {
            // Ruta opcional de compatibilidad con listados legacy.
        }
    }

    private escribirRutaFirebase(path: string, payload: any): Promise<void> {
        return this.firebaseContextSvc.run(() => set(ref(this.db, path), payload));
    }

    private obtenerMensajeErrorHttp(error: any, fallback: string): string {
        const body = error?.error;
        if (typeof body === 'string' && body.trim().length > 0)
            return body.trim();
        if (body && typeof body === 'object') {
            const msg = `${body?.message ?? body?.error ?? ''}`.trim();
            if (msg.length > 0)
                return msg;
        }
        const direct = `${error?.message ?? ''}`.trim();
        return direct.length > 0 ? direct : fallback;
    }

    private async readPublicDetalleFromCache(idPersonaje: number): Promise<Personaje> {
        const payload = await this.readCacheSnapshot(`Personajes/${idPersonaje}`);
        const raw = {
            ...(payload ?? {}),
            Id: toNumber(payload?.Id) > 0 ? payload.Id : idPersonaje,
        };
        if (!Array.isArray((raw as any).desgloseClases) && Array.isArray((raw as any).Clases))
            (raw as any).desgloseClases = (raw as any).Clases;
        const personaje = this.esPayloadPersonajeCanonico(raw)
            ? this.normalizarPersonajeParaPersistenciaFinal(raw as Personaje, idPersonaje)
            : this.mapApiDetalleToPersonaje(raw);

        if (personaje.Id <= 0)
            throw new Error('No se pudo cargar el detalle del personaje.');
        if (!this.esDetalleVisibleParaInvitado(personaje))
            throw new Error('El personaje solicitado no está disponible para invitados.');

        return personaje;
    }

    private async readCacheSnapshot(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.firebaseContextSvc.run(() => onValue(
                    ref(this.db, path),
                    (snapshot) => resolve(snapshot.val()),
                    reject,
                    { onlyOnce: true }
                ));
            } catch (error) {
                reject(error);
            }
        });
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error('Sesión no iniciada');

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new Error('Token no disponible');

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }

    private esDetalleVisibleParaInvitado(personaje: Personaje): boolean {
        return personaje?.visible_otros_usuarios === true
            && normalizeLookupKey(personaje?.Campana) === 'sin campana';
    }

    private esPayloadPersonajeCanonico(payload: any): boolean {
        if (!payload || typeof payload !== 'object')
            return false;

        return 'Nombre' in payload
            || 'Ataque_base' in payload
            || 'Fuerza' in payload
            || 'Vida' in payload
            || 'desgloseClases' in payload
            || 'CaracteristicasVarios' in payload;
    }

    private mapApiDetalleToPersonaje(element: any): Personaje {
        const tempcla = `${element?.cla ?? ''}`.split('|');
        let nep = toNumber(element?.ra?.Dgs_adicionales?.Cantidad);
        const clas: { Nombre: string; Nivel: number; }[] = [];
        tempcla.forEach((el: string) => {
            const datos = el.split(';');
            const nivelClase = toNumber(datos[1]);
            if (`${datos[0] ?? ''}`.trim().length < 1)
                return;
            clas.push({
                Nombre: datos[0].trim(),
                Nivel: nivelClase,
            });
            nep += nivelClase;
        });

        const ajusteNivelRaza = toNumber(element?.ra?.Ajuste_nivel);
        if (ajusteNivelRaza > 0)
            nep += ajusteNivelRaza;
        (element?.pla ?? []).forEach((el: { Ajuste_nivel: number; Multiplicador_dgs_lic: number; }) => {
            nep += toNumber(el?.Ajuste_nivel) + toNumber(el?.Multiplicador_dgs_lic);
        });

        const experiencia = nep > 0 ? ((nep - 1) * nep / 2) * 1000 : 0;
        const dotesContextuales = toDoteContextualArray(element?.dotes);
        const dotes = toDoteLegacyArray(dotesContextuales);
        const claseas: { Nombre: string; Extra: string; }[] = [];
        for (let index = 0; index < (element?.esp ?? []).length; index++) {
            claseas.push({
                Nombre: element.esp[index],
                Extra: element.espX?.[index] ?? 'Nada',
            });
        }

        const habilidades: {
            Id: number; Nombre: string; Clasea: boolean; Car: string; Mod_car: number; Rangos: number; Rangos_varios: number; Extra: string;
            Varios: string; Custom: boolean;
        }[] = [];
        for (let index = 0; index < (element?.habN ?? []).length; index++) {
            habilidades.push({
                Id: toNumber(element?.hab?.[index]),
                Nombre: element.habN[index],
                Clasea: toBoolean(element?.habC?.[index]),
                Car: `${element?.habCa?.[index] ?? ''}`,
                Mod_car: toNumber(element?.habMc?.[index]),
                Rangos: toNumber(element?.habR?.[index]),
                Rangos_varios: toNumber(element?.habRv?.[index]),
                Extra: `${element?.habX?.[index] ?? ''}`,
                Varios: `${element?.habV?.[index] ?? ''}`,
                Custom: toBoolean(element?.habCu?.[index]),
            });
        }

        const cargas = {
            Ligera: toNumber(element?.ccl),
            Media: toNumber(element?.ccm),
            Pesada: toNumber(element?.ccp),
        };
        const escuela_esp = {
            Nombre: `${element?.espa ?? ''}`,
            Calificativo: `${element?.espan ?? ''}`,
        };
        const disciplina_esp = {
            Nombre: `${element?.espp ?? ''}`,
            Calificativo: `${element?.esppn ?? ''}`,
        };
        const rds: { Modificador: string; Origen: string; }[] = [];
        if (element?.rds)
            for (let index = 0; index < element.rds.length; index++) {
                const partes = `${element.rds[index] ?? ''}`.split(';');
                rds.push({
                    Modificador: `${partes[0] ?? ''}`,
                    Origen: `${partes[1] ?? ''}`,
                });
            }
        const rcs: { Modificador: string; Origen: string; }[] = [];
        if (element?.rcs)
            for (let index = 0; index < element.rcs.length; index++) {
                const partes = `${element.rcs[index] ?? ''}`.split(';');
                rcs.push({
                    Modificador: `${partes[0] ?? ''}`,
                    Origen: `${partes[1] ?? ''}`,
                });
            }
        const res: { Modificador: string; Origen: string; }[] = [];
        if (element?.res)
            for (let index = 0; index < element.res.length; index++) {
                const partes = `${element.res[index] ?? ''}`.split(';');
                res.push({
                    Modificador: `${partes[0] ?? ''}`,
                    Origen: `${partes[1] ?? ''}`,
                });
            }

        const dom: string[] = `${element?.dom ?? ''}`.split('|').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
        const subtipos = normalizeSubtipoRefArray(element?.subtipos ?? element?.stc ?? '');
        const raciales = normalizeRaciales(element?.rac);
        const ve = normalizeVentajasPersonaje(element?.ve);
        const idiomas = normalizeIdiomasPersonaje(element?.idi);
        const competenciasArma = normalizeCompetenciasPersonaje(element?.competencia_arma, {
            idKeys: ['Id', 'id', 'Id_arma', 'id_arma', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Arma', 'arma'],
        });
        const competenciasArmadura = normalizeCompetenciasPersonaje(element?.competencia_armadura, {
            idKeys: ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Armadura', 'armadura', 'Arma', 'arma'],
            includeShield: true,
        });
        const competenciasGrupoArma = normalizeCompetenciasPersonaje(element?.competencia_grupo_arma, {
            idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
        });
        const competenciasGrupoArmadura = normalizeCompetenciasPersonaje(element?.competencia_grupo_armadura, {
            idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
            nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
        });
        const ecp: string[] = `${element?.ecp ?? ''}`.split('|').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
        const ataqueBase = `${element?.a ?? 0}`;
        const presaBase = +(ataqueBase.includes('/') ? ataqueBase.substring(0, ataqueBase.indexOf('/')) : ataqueBase);
        const razaBase = element?.RazaBase ?? element?.rb ?? element?.raza_base ?? null;
        const idRegion = Math.max(0, Math.trunc(toNumber(
            element?.id_region
            ?? element?.idRegion
            ?? element?.Region?.Id
            ?? element?.Region?.id
            ?? element?.region?.Id
            ?? element?.region?.id
        )));
        const nombreRegion = `${element?.Region?.Nombre
            ?? element?.Region?.nombre
            ?? element?.region?.Nombre
            ?? element?.region?.nombre
            ?? ''}`.trim();

        return {
            Id: Math.trunc(toNumber(element?.i ?? element?.Id)),
            Nombre: `${element?.n ?? element?.Nombre ?? ''}`.trim(),
            ownerUid: extractOwnerUid(element),
            ownerDisplayName: extractOwnerDisplayName(element),
            visible_otros_usuarios: toBoolean(element?.visible_otros_usuarios),
            Id_region: idRegion,
            Region: {
                Id: idRegion,
                Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
            },
            Personalidad: `${element?.dcp ?? element?.Personalidad ?? ''}`,
            Contexto: `${element?.dh ?? element?.Contexto ?? ''}`,
            Ataque_base: element?.a,
            Tamano: element?.ra?.Tamano?.Nombre,
            Ca: element?.ca,
            Armadura_natural: element?.an,
            Ca_desvio: element?.cd,
            Ca_varios: element?.cv,
            Iniciativa_varios: element?.ini_v ?? [],
            Presa: Number(presaBase + +element?.mf + +element?.ra?.Tamano?.Modificador_presa + +(element?.pr_v ?? []).reduce((c: number, v: { Valor: number; }) => c + Number(v.Valor), 0)),
            Presa_varios: element?.pr_v ?? [],
            Raza: element?.ra,
            RazaBase: razaBase,
            Tipo_criatura: element?.tc,
            Fuerza: element?.f,
            ModFuerza: element?.mf,
            Destreza: element?.d,
            ModDestreza: element?.md,
            Constitucion: element?.co,
            ModConstitucion: element?.mco,
            Caracteristicas_perdidas: normalizeCaracteristicasPerdidasPersonaje(element?.cper, element?.cperd),
            Constitucion_perdida: toBoolean(element?.cperd),
            Inteligencia: element?.int,
            ModInteligencia: element?.mint,
            Sabiduria: element?.s,
            ModSabiduria: element?.ms,
            Carisma: element?.car,
            ModCarisma: element?.mcar,
            NEP: toNumber(nep),
            Experiencia: toNumber(experiencia),
            Deidad: element?.de,
            Alineamiento: element?.ali,
            Genero: element?.g,
            Campana: `${element?.ncam ?? element?.Campana ?? 'Sin campaña'}` || 'Sin campaña',
            Trama: `${element?.ntr ?? element?.Trama ?? 'Trama base'}` || 'Trama base',
            Subtrama: `${element?.nst ?? element?.Subtrama ?? 'Subtrama base'}` || 'Subtrama base',
            Vida: element?.v,
            Correr: element?.cor,
            Nadar: element?.na,
            Volar: element?.vo,
            Trepar: element?.t,
            Escalar: element?.e,
            Oficial: element?.o,
            Dados_golpe: element?.dg,
            Pgs_lic: element?.pgl,
            Jugador: element?.ju,
            Edad: element?.edad,
            Altura: element?.alt,
            Peso: element?.peso,
            Clases: clas.map((entrada) => `${entrada.Nombre} (${entrada.Nivel})`).join(', '),
            desgloseClases: clas,
            Dominios: dom.map((Nombre) => ({ Nombre })) as any,
            Subtipos: subtipos,
            competencia_arma: competenciasArma as PersonajeCompetenciaDirecta[],
            competencia_armadura: competenciasArmadura as PersonajeCompetenciaArmaduraDirecta[],
            competencia_grupo_arma: competenciasGrupoArma as PersonajeCompetenciaDirecta[],
            competencia_grupo_armadura: competenciasGrupoArmadura as PersonajeCompetenciaDirecta[],
            Plantillas: element?.pla ?? [],
            Familiares: normalizeFamiliarMonstruoDetalleArray(element?.familiares, 1),
            Companeros: normalizeCompaneroMonstruoDetalleArray(element?.companeros, 1),
            Conjuros: element?.con ?? [],
            Claseas: claseas,
            Raciales: raciales,
            Habilidades: habilidades,
            Dotes: dotes,
            DotesContextuales: dotesContextuales,
            Ventajas: ve,
            Idiomas: idiomas,
            Sortilegas: element?.sor ?? [],
            Salvaciones: element?.salv,
            Rds: rds,
            Rcs: rcs,
            Res: res,
            Capacidad_carga: cargas,
            Oro_inicial: toNumber(calc_oro(nep)),
            Escuela_especialista: escuela_esp,
            Disciplina_especialista: disciplina_esp,
            Disciplina_prohibida: element?.disp,
            Escuelas_prohibidas: ecp,
            Archivado: false,
            CaracteristicasVarios: {
                Fuerza: [],
                Destreza: [],
                Constitucion: [],
                Inteligencia: [],
                Sabiduria: [],
                Carisma: [],
            },
        } as Personaje;
    }

    public async RenovarPersonajes(): Promise<boolean> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(this.d_pjs(headers));
            const personajes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                personajes.map((element: any) => {
                    const personaje = this.mapApiDetalleToPersonaje(element);
                    return this.guardarPersonajeEnFirebase(personaje.Id, personaje);
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de personajes actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de personajes',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}

function calc_oro(nep: number) {
    const nepValue = Math.trunc(toNumber(nep));
    const valoresOro: { [key: number]: number } = {
        1: 0,
        2: 900,
        3: 2700,
        4: 5400,
        5: 9000,
        6: 13000,
        7: 19000,
        8: 27000,
        9: 36000,
        10: 49000,
        11: 66000,
        12: 88000,
        13: 110000,
        14: 150000,
        15: 200000,
        16: 260000,
        17: 340000,
        18: 440000,
        19: 580000,
        20: 760000,
    };
    if (nepValue <= 20)
        return valoresOro[nepValue] || 0;
    else
        return Math.round(760000 * (1.3 * (nepValue - 20)));
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: any): string {
    if (value === null || value === undefined)
        return '';
    return `${value}`;
}

function normalizeLookupKey(value: any): string {
    return toText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function toNullableText(value: any): string | null {
    const text = toText(value).trim();
    return text.length > 0 ? text : null;
}

function extractOwnerUid(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    return toNullableText(
        value.ownerUid
    );
}

function extractOwnerDisplayName(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    return toNullableText(
        value.ownerDisplayName
    );
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

function normalizeVentajasPersonaje(raw: any): (string | { Nombre: string; Origen?: string; })[] {
    if (typeof raw === 'string') {
        return raw
            .split('|')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    const output: (string | { Nombre: string; Origen?: string; })[] = [];
    toArray(raw).forEach((item) => {
        if (typeof item === 'string') {
            const nombre = item.trim();
            if (nombre.length > 0)
                output.push(nombre);
            return;
        }

        const nombre = toText(item?.Nombre ?? item?.nombre).trim();
        if (nombre.length < 1)
            return;

        const origen = toText(item?.Origen ?? item?.origen).trim();
        if (origen.length > 0) {
            output.push({
                Nombre: nombre,
                Origen: origen,
            });
            return;
        }

        output.push({
            Nombre: nombre,
        });
    });
    return output;
}

function normalizeIdiomasPersonaje(raw: any): { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[] {
    const output: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[] = [];
    toArray(raw).forEach((item) => {
        const nombre = toText(item?.Nombre).trim();
        if (nombre.length < 1)
            return;

        const idiomaNormalizado: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; } = {
            Nombre: nombre,
            Descripcion: toText(item?.Descripcion).trim(),
            Secreto: toBoolean(item?.Secreto),
            Oficial: toBoolean(item?.Oficial),
        };

        const origen = toText(item?.Origen ?? item?.origen).trim();
        if (origen.length > 0)
            idiomaNormalizado.Origen = origen;

        output.push(idiomaNormalizado);
    });
    return output;
}

function normalizeCompetenciasPersonaje(
    raw: any,
    options: {
        idKeys: string[];
        nombreKeys: string[];
        includeShield?: boolean;
    }
): Array<PersonajeCompetenciaDirecta | PersonajeCompetenciaArmaduraDirecta> {
    const output: Array<PersonajeCompetenciaDirecta | PersonajeCompetenciaArmaduraDirecta> = [];
    const seen = new Set<string>();

    toArray(raw).forEach((item) => {
        const id = resolveCompetenciaId(item, options.idKeys);
        const nombre = resolveCompetenciaNombre(item, options.nombreKeys);
        if (id <= 0 && nombre.length < 1)
            return;

        const dedupeKey = id > 0 ? `id:${id}` : `nombre:${normalizeLookupKey(nombre)}`;
        if (seen.has(dedupeKey))
            return;
        seen.add(dedupeKey);

        const normalizado: PersonajeCompetenciaDirecta | PersonajeCompetenciaArmaduraDirecta = {
            Id: id > 0 ? id : 0,
            Nombre: nombre,
        };

        if (options.includeShield)
            (normalizado as PersonajeCompetenciaArmaduraDirecta).Es_escudo = toBoolean(item?.Es_escudo ?? item?.es_escudo);

        output.push(normalizado);
    });

    return output;
}

function mapCompetenciasPayload<T>(raw: any, idKeys: string[], build: (id: number) => T): T[] {
    const output: T[] = [];
    const seen = new Set<number>();

    toArray(raw).forEach((item) => {
        const id = resolveCompetenciaId(item, idKeys);
        if (id <= 0 || seen.has(id))
            return;
        seen.add(id);
        output.push(build(id));
    });

    return output;
}

function resolveCompetenciaId(item: any, idKeys: string[]): number {
    if (typeof item === 'number')
        return Math.trunc(toNumber(item));

    if (typeof item === 'string') {
        const parsed = Math.trunc(Number(item));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    for (const key of idKeys) {
        const id = Math.trunc(toNumber(item?.[key]));
        if (id > 0)
            return id;
    }

    return 0;
}

function resolveCompetenciaNombre(item: any, nombreKeys: string[]): string {
    if (typeof item === 'string') {
        const text = item.trim();
        return Number.isFinite(Number(text)) ? '' : text;
    }

    for (const key of nombreKeys) {
        const text = toText(item?.[key]).trim();
        if (text.length > 0)
            return text;
    }

    return '';
}

function normalizeCaracteristicasPerdidasPersonaje(raw: any, constitucionPerdidaLegacy: any): {
    Fuerza?: boolean;
    Destreza?: boolean;
    Constitucion?: boolean;
    Inteligencia?: boolean;
    Sabiduria?: boolean;
    Carisma?: boolean;
} {
    const output = {
        Fuerza: toBoolean(raw?.Fuerza),
        Destreza: toBoolean(raw?.Destreza),
        Constitucion: toBoolean(raw?.Constitucion),
        Inteligencia: toBoolean(raw?.Inteligencia),
        Sabiduria: toBoolean(raw?.Sabiduria),
        Carisma: toBoolean(raw?.Carisma),
    };

    if (toBoolean(constitucionPerdidaLegacy))
        output.Constitucion = true;

    return output;
}
