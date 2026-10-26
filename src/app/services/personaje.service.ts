import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Observable, firstValueFrom, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
    Personaje,
    PersonajeCompetenciaArmaduraDirecta,
    PersonajeCompetenciaDirecta,
    PersonajeTotales
} from '../interfaces/personaje';
import { environment } from 'src/environments/environment';
import { toDoteContextualArray, toDoteLegacyArray } from './utils/dote-mapper';
import {
    CatalogoNombreIdDto,
    PersonajeClaseDto,
    PersonajeContextoCreacionCampanaDto,
    PersonajeContextoIdsDto,
    PersonajeCreateApiResponseDto,
    PersonajeCreateColeccionesDto,
    PersonajeCreateModificadoresDto,
    PersonajeDefensaDto,
    PersonajeEspecialDto,
    PersonajeHabilidadDto,
    PersonajeNombreIdDto,
    PersonajeParteDto,
    PersonajeProgresionLanzadorDto,
    PersonajeCreateRequestDto,
    PersonajeCreateResponseDto,
    PersonajeCompraRequestDto,
    PersonajeCompraResponseDto,
    PersonajeTotalDto
} from '../interfaces/personajes-api';
import {
    normalizeCompaneroMonstruoDetalleArray,
    normalizeFamiliarMonstruoDetalleArray
} from './utils/monstruo-mapper';
import { normalizarProgresionLanzadorPersonaje } from './utils/nivel-lanzador-personaje';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';
import { cabeceraApiConFirebase } from './platform-session.service';
import { normalizarTexto, toArray, toBoolean, toInt, toNullableText, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { experienciaParaNivel } from './utils/experiencia-nivel';
import { getAlineamientoBasicoIdPorNombre } from './utils/alineamiento-contrato';
import { modificadoresDePartes, normalizarTotal, totalVacio } from './utils/personaje-totales';
import { normalizarDefensa, normalizarDinero, normalizarModificadoresEquipo, normalizarPiezasEquipo } from './utils/personaje-equipo-mapper';
import { resumenClases } from './utils/resumen-clases';
import { leerComodin } from './utils/comodin';
import { ID_EXTRA_HABILIDAD_ELEGIR, ID_EXTRA_HABILIDAD_SIN_EXTRA } from './utils/habilidad-extra-visible';
import { errorDePerfil, mensajeDeError } from './utils/error-api';

interface PersonajeVisibilityUpdateResponse {
    message: string;
    idPersonaje: number;
    visible_otros_usuarios: boolean;
}

interface PersonajeArchiveUpdateResponse {
    message: string;
    idPersonaje: number;
    archivado: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PersonajeService {
    constructor(
        private auth: Auth,
        private http: HttpClient,
    ) {
        borrarMarcaDeArchivadoAntigua();
    }

    async getDetallesPersonaje(id: number): Promise<Observable<Personaje>> {
        const personajeId = toInt(id);
        if (personajeId <= 0)
            throw new Error('Id de personaje no válido');

        try {
            if (!this.auth.currentUser) {
                const response = await firstValueFrom(
                    this.http.get<any>(`${environment.apiUrl}personajes/publicos/${personajeId}`)
                );
                const personajePublico = this.mapApiDetalleToPersonaje(response);
                return of(personajePublico);
            }

            const headers = new HttpHeaders(await cabeceraApiConFirebase(this.auth));
            const response = await firstValueFrom(
                this.http.get<any>(`${environment.apiUrl}personajes/${personajeId}`, { headers })
            );
            return of(this.mapApiDetalleToPersonaje(response));
        } catch (error: any) {
            throw new Error(mensajeDeError(error, 'No se pudo cargar el detalle del personaje.'));
        }
    }

    public async actualizarVisibilidadPersonaje(
        idPersonaje: number,
        visible: boolean,
    ): Promise<PersonajeVisibilityUpdateResponse> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');

        const payload = {
            visible_otros_usuarios: !!visible,
        };

        let response: PersonajeVisibilityUpdateResponse;
        try {
            response = await firstValueFrom(
                this.http.patch<PersonajeVisibilityUpdateResponse>(
                    `${environment.apiUrl}personajes/${id}/visible`,
                    payload,
                    { headers: new HttpHeaders(await cabeceraApiConFirebase(this.auth)) }
                )
            );
        } catch (error) {
            throw errorDePerfil(error, 'No se ha podido cambiar la visibilidad del personaje.');
        }

        return {
            ...response,
            idPersonaje: toInt(response?.idPersonaje),
            visible_otros_usuarios: !!visible,
        };
    }

    /**
     * Las compras del final de la creación (`PUT /personajes/{id}/equipo`): la API calcula el precio de cada pieza,
     * comprueba el dinero inicial y guarda el equipo y lo que le queda. Solo el dueño. Sustituye la compra anterior.
     */
    public async comprarEquipoPersonaje(idPersonaje: number, compra: PersonajeCompraRequestDto): Promise<PersonajeCompraResponseDto> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        let response: PersonajeCompraResponseDto;
        try {
            response = await firstValueFrom(
                this.http.put<PersonajeCompraResponseDto>(
                    `${environment.apiUrl}personajes/${id}/equipo`,
                    compra,
                    { headers: new HttpHeaders(await cabeceraApiConFirebase(this.auth)) }
                )
            );
        } catch (error) {
            throw errorDePerfil(error, 'No se ha podido guardar el equipo.');
        }
        return {
            idPersonaje: toInt(response?.idPersonaje),
            coste: toNumber(response?.coste),
            dineroInicial: toNumber(response?.dineroInicial),
            dinero: toNumber(response?.dinero),
            costes: toArray(response?.costes).map((coste) => toNumber(coste)),
            oficial: toBoolean(response?.oficial),
        };
    }

    public async actualizarArchivadoPersonaje(
        idPersonaje: number,
        archivado: boolean,
    ): Promise<PersonajeArchiveUpdateResponse> {
        const id = toInt(idPersonaje);
        if (id <= 0)
            throw new Error('Id de personaje no válido');

        const payload = {
            archivado: !!archivado,
        };

        let response: PersonajeArchiveUpdateResponse;
        try {
            response = await firstValueFrom(
                this.http.patch<PersonajeArchiveUpdateResponse>(
                    `${environment.apiUrl}personajes/${id}/archivado`,
                    payload,
                    { headers: new HttpHeaders(await cabeceraApiConFirebase(this.auth)) }
                )
            );
        } catch (error) {
            throw errorDePerfil(error, 'No se ha podido cambiar el archivado del personaje.');
        }

        return {
            ...response,
            idPersonaje: toInt(response?.idPersonaje),
            archivado: !!archivado,
        };
    }

    public construirPayloadCreacionDesdePersonaje(
        personaje: Personaje,
        contextoIds: PersonajeContextoIdsDto,
        contextoCreacionCampana?: PersonajeContextoCreacionCampanaDto | null,
        progresionLanzador?: PersonajeProgresionLanzadorDto | null
    ): PersonajeCreateRequestDto {
        const nombre = `${personaje?.Nombre ?? ''}`.trim();
        const idRaza = toInt(personaje?.Raza?.Id);
        const idTipoCriatura = toInt(personaje?.Tipo_criatura?.Id);
        const idCampana = toInt(contextoIds?.idCampana);
        const idTrama = toInt(contextoIds?.idTrama);
        const idSubtrama = toInt(contextoIds?.idSubtrama);
        const esSinCampana = normalizarTexto(personaje?.Campana, true) === 'sin campana';
        const tieneCampana = !esSinCampana && idCampana > 0;
        const tieneHistoriaCompletaCampana = tieneCampana && idTrama > 0 && idSubtrama > 0;
        const tieneClaseConNivel = (personaje?.desgloseClases ?? [])
            .some((entrada) => toInt(entrada?.Nivel) > 0);
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
        if (!esSinCampana && !tieneCampana)
            throw new Error('No se pudo resolver la campaña del personaje.');
        if ((idTrama > 0 && idSubtrama <= 0) || (idTrama <= 0 && idSubtrama > 0))
            throw new Error('No se pudo resolver una historia de campaña completa: trama y subtrama deben viajar juntas.');

        const idAlineamiento = toInt(contextoIds?.idAlineamiento)
            || this.resolverIdAlineamientoDesdeNombre(personaje?.Alineamiento);
        const idGenero = toInt(contextoIds?.idGenero)
            || this.resolverIdGeneroDesdeNombre(personaje?.Genero);
        const idCarga = toInt(contextoIds?.idCarga)
            || this.resolverIdCargaDesdeFuerza(personaje?.Fuerza);
        const idDeidadFromContexto = toInt(contextoIds?.idDeidad);
        const idDeidad = idDeidadFromContexto > 0 ? idDeidadFromContexto : 0;
        const idManiobrabilidad = toInt(contextoIds?.idManiobrabilidad)
            || toInt((personaje as any)?.Raza?.Maniobrabilidad?.Id);
        const idEspArcana = toInt(contextoIds?.idEspArcana)
            || this.resolverIdPorNombre((personaje?.Escuela_especialista as any)?.Nombre, mapasCatalogo.escuelas);
        const idEspPsionica = toInt(contextoIds?.idEspPsionica)
            || this.resolverIdPorNombre((personaje?.Disciplina_especialista as any)?.Nombre, mapasCatalogo.disciplinas);
        const idDisProhibida = toInt(contextoIds?.idDisProhibida)
            || this.resolverIdPorNombre(personaje?.Disciplina_prohibida, mapasCatalogo.disciplinas);
        const idRegion = this.resolverIdRegionParaPayload(personaje, contextoIds, mapasCatalogo.regiones);
        const deidadSeleccionada = normalizarTexto(personaje?.Deidad, true);

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
        const idTamano = toInt(personaje?.Raza?.Tamano?.Id);
        const idRazaBase = toInt((personaje as any)?.RazaBase?.Id);
        const modificadores = this.construirPayloadModificadores(personaje);
        const colecciones = this.construirPayloadColecciones(personaje, mapasCatalogo);
        const progresionLanzadorNormalizada = this.normalizarProgresionLanzadorParaPayload(progresionLanzador);

        const personajePayload: PersonajeCreateRequestDto['personaje'] = {
            nombre,
            ataqueBase: `${personaje?.Ataque_base ?? '0'}`.trim() || '0',
            idRaza,
            idTipoCriatura,
            idRegion,
            descripcionPersonalidad: `${personaje?.Personalidad ?? ''}`.trim(),
            descripcionHistoria: `${personaje?.Contexto ?? ''}`.trim(),
            armaduraNatural: toInt(personaje?.Armadura_natural),
            caDesvio: toInt(personaje?.Ca_desvio),
            altura: toNumber(personaje?.Altura),
            edad: toInt(personaje?.Edad),
            peso: toNumber(personaje?.Peso),
            ajuste: toInt((personaje as any)?.Raza?.Ajuste_nivel),
            deidad: idDeidad > 0 ? idDeidad : 0,
            idAlineamiento,
            idGenero,
            idCarga,
            puntosGolpe: Math.max(1, toInt(personaje?.Vida)),
            pgsLic: toInt(personaje?.Pgs_lic),
            correr: toInt(personaje?.Correr),
            nadar: toInt(personaje?.Nadar),
            volar: toInt(personaje?.Volar),
            idManiobrabilidad: idManiobrabilidad > 0 ? idManiobrabilidad : 0,
            trepar: toInt(personaje?.Trepar),
            escalar: toInt(personaje?.Escalar),
            espacio: toInt((personaje as any)?.Espacio),
            alcance: toInt((personaje as any)?.Alcance),
            idEspArcana: idEspArcana > 0 ? idEspArcana : 0,
            idEspPsionica: idEspPsionica > 0 ? idEspPsionica : 0,
            idDisProhibida: idDisProhibida > 0 ? idDisProhibida : 0,
            visible_otros_usuarios: !!personaje?.visible_otros_usuarios,
            oficial: personaje?.Oficial !== false,
        };
        if (idRazaBase > 0)
            personajePayload.idRazaBase = idRazaBase;
        if (tieneCampana)
            personajePayload.campana = { id: idCampana };
        if (tieneHistoriaCompletaCampana) {
            personajePayload.campana = { id: idCampana };
            personajePayload.trama = { id: idTrama };
            personajePayload.subtrama = { id: idSubtrama };
        }

        const payload: PersonajeCreateRequestDto = {
            personaje: personajePayload,
            caracteristicas: {
                fuerza: {
                    valor: toInt(personaje?.Fuerza),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Fuerza,
                },
                destreza: {
                    valor: toInt(personaje?.Destreza),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Destreza,
                },
                constitucion: {
                    valor: toInt(personaje?.Constitucion),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Constitucion,
                },
                inteligencia: {
                    valor: toInt(personaje?.Inteligencia),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Inteligencia,
                },
                sabiduria: {
                    valor: toInt(personaje?.Sabiduria),
                    minimo: 0,
                    perdido: !!caracteristicasPerdidas.Sabiduria,
                },
                carisma: {
                    valor: toInt(personaje?.Carisma),
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
        if (progresionLanzadorNormalizada)
            payload.progresionLanzador = progresionLanzadorNormalizada;
        if (tieneCampana) {
            payload.contextoCreacionCampana = {
                tiradaMinimaDeclarada: this.toNonNegativeIntOrNull(contextoCreacionCampana?.tiradaMinimaDeclarada),
                tablasDadosUsadas: this.toNonNegativeIntOrNull(contextoCreacionCampana?.tablasDadosUsadas),
                overrideReglasCampana: contextoCreacionCampana?.overrideReglasCampana === true,
            };
        }
        return payload;
    }

    private normalizarProgresionLanzadorParaPayload(
        progresionLanzador?: PersonajeProgresionLanzadorDto | null
    ): PersonajeProgresionLanzadorDto | null {
        const selecciones = toArray<any>(progresionLanzador?.selecciones)
            .map((seleccion) => ({
                idClaseAplicada: toInt(seleccion?.idClaseAplicada),
                nivelClaseAplicado: toInt(seleccion?.nivelClaseAplicado),
                indiceAumento: toInt(seleccion?.indiceAumento),
                idClaseObjetivo: toInt(seleccion?.idClaseObjetivo),
            }))
            .filter((seleccion) =>
                seleccion.idClaseAplicada > 0
                && seleccion.nivelClaseAplicado > 0
                && seleccion.indiceAumento > 0
                && seleccion.idClaseObjetivo > 0
            );
        if (selecciones.length < 1)
            return null;
        return { selecciones };
    }

    private construirPayloadModificadores(personaje: Personaje): PersonajeCreateModificadoresDto {
        const ca: { valor: number; origen?: string; }[] = [];
        const iniciativa: { valor: number; origen?: string; }[] = [];
        const presa: { valor: number; origen?: string; }[] = [];

        const modCaVarios = toInt(personaje?.Ca_varios);
        if (modCaVarios !== 0)
            ca.push({ valor: modCaVarios, origen: 'Varios' });

        toArray<any>(personaje?.Iniciativa_varios).forEach((entrada) => {
            const valor = toInt(entrada?.Valor ?? entrada?.valor);
            if (valor === 0)
                return;
            iniciativa.push({
                valor,
                origen: `${entrada?.Origen ?? entrada?.origen ?? 'Varios'}`.trim() || 'Varios',
            });
        });

        toArray<any>(personaje?.Presa_varios).forEach((entrada) => {
            const valor = toInt(entrada?.Valor ?? entrada?.valor);
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
                const idDirecto = toInt(entrada?.Id ?? entrada?.idClase ?? entrada?.id_clase);
                const idClase = idDirecto > 0 ? idDirecto : this.resolverIdPorNombre(nombre, mapasCatalogo.clases);
                const nivel = toInt(entrada?.Nivel ?? entrada?.nivel);
                if (idClase <= 0 || nivel <= 0)
                    return null;
                return { idClase, nivel };
            })
            .filter((entrada): entrada is { idClase: number; nivel: number; } => !!entrada);
        if (clases.length > 0)
            colecciones.clases = clases;

        const plantillas = toArray<any>(personaje?.Plantillas)
            .map((entrada) => {
                const idPlantilla = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idPlantilla);
                if (idPlantilla <= 0)
                    return null;
                return { idPlantilla };
            })
            .filter((entrada): entrada is { idPlantilla: number; } => !!entrada);
        if (plantillas.length > 0)
            colecciones.plantillas = plantillas;

        const subtipos = toArray<any>(personaje?.Subtipos)
            .map((entrada) => {
                const idSubtipo = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idSubtipo);
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
        const dgsRaza = toInt((personaje as any)?.Raza?.Dgs_adicionales?.Cantidad);
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
                const idDirecto = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idEscuela ?? entrada?.id_escuela);
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
                const idEnemigo = toInt(entrada?.id ?? entrada?.Id ?? entrada?.idEnemigo ?? entrada?.id_enemigo);
                if (idEnemigo <= 0)
                    return null;
                return {
                    idEnemigo,
                    cantidad: Math.max(1, toInt(entrada?.cantidad ?? entrada?.Cantidad ?? entrada?.veces)),
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
            const idHabilidad = toInt(entrada?.Id ?? entrada?.id ?? entrada?.Id_habilidad ?? entrada?.id_habilidad);
            if (idHabilidad <= 0)
                return;
            const idExtra = this.resolverIdExtraHabilidad(entrada);
            const payload = {
                idHabilidad,
                idExtra: idExtra > 0 ? idExtra : (toBoolean(entrada?.Soporta_extra) ? ID_EXTRA_HABILIDAD_ELEGIR : ID_EXTRA_HABILIDAD_SIN_EXTRA),
                clasea: !!entrada?.Clasea,
                rangos: Math.max(0, toInt(entrada?.Rangos)),
                rangosVarios: Math.max(0, toInt(entrada?.Rangos_varios)),
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
                const idDirecto = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idVentaja ?? entrada?.id_ventaja);
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
                const idDirecto = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idIdioma ?? entrada?.id_idioma);
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
                const idDote = toInt(entrada?.Dote?.Id ?? (entrada as any)?.Dote?.id);
                if (idDote <= 0)
                    return null;
                const idExtra = Math.max(0, toInt((entrada as any)?.Contexto?.Id_extra));
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
                const idDirecto = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idDominio ?? entrada?.id_dominio);
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
                const idConjuro = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idConjuro ?? entrada?.id_conjuro);
                if (idConjuro <= 0)
                    return null;
                return { idConjuro };
            })
            .filter((entrada): entrada is { idConjuro: number; } => !!entrada);
        if (conjurosConocidos.length > 0)
            colecciones.conjurosConocidos = conjurosConocidos;

        const sortilegas = toArray<any>(personaje?.Sortilegas)
            .map((entrada) => {
                const idConjuro = toInt(entrada?.Conjuro?.Id ?? entrada?.Id ?? entrada?.idConjuro ?? entrada?.id_conjuro);
                if (idConjuro <= 0)
                    return null;
                return {
                    idConjuro,
                    nivelLanz: `${entrada?.Nivel_lanzador ?? entrada?.nivel_lanz ?? '0'}`.trim() || '0',
                    usos: `${entrada?.Usos_diarios ?? entrada?.usos ?? '0'}`.trim() || '0',
                    dgs: Math.max(0, toInt(entrada?.Dgs_necesarios ?? entrada?.dgs)),
                    origen: `${entrada?.Origen ?? entrada?.origen ?? 'API'}`.trim() || 'API',
                };
            })
            .filter((entrada) => !!entrada) as { idConjuro: number; nivelLanz?: string; usos?: string; dgs?: number; origen?: string; }[];
        if (sortilegas.length > 0)
            colecciones.sortilegas = sortilegas;

        const raciales = toArray<any>(personaje?.Raciales)
            .map((entrada) => {
                const idRacial = toInt(entrada?.Id ?? entrada?.id ?? entrada?.idRacial ?? entrada?.id_racial);
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
                const valor = toInt(entrada?.valor ?? entrada?.Valor);
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
        const idExtraDirecto = toInt(entrada?.Id_extra ?? entrada?.id_extra ?? entrada?.idExtra);
        if (idExtraDirecto > 0)
            return idExtraDirecto;
        const extraSeleccionado = `${entrada?.Extra ?? entrada?.extra ?? ''}`.trim();
        if (extraSeleccionado.length < 1)
            return 0;
        const extraNorm = normalizarTexto(extraSeleccionado, true);
        const match = toArray<any>(entrada?.Extras)
            .find((item) => normalizarTexto(`${item?.Extra ?? item?.extra ?? item?.Nombre ?? item?.nombre ?? ''}`, true) === extraNorm);
        const idExtra = toInt(match?.Id_extra ?? match?.id_extra ?? match?.idExtra ?? match?.Id);
        return idExtra > 0 ? idExtra : 0;
    }

    private construirMapaNombreId(items?: CatalogoNombreIdDto[]): Map<string, number> {
        const mapa = new Map<string, number>();
        toArray<CatalogoNombreIdDto>(items).forEach((item) => {
            const id = toInt(item?.id);
            const key = normalizarTexto(item?.nombre, true);
            if (id > 0 && key.length > 0 && !mapa.has(key))
                mapa.set(key, id);
        });
        return mapa;
    }

    private resolverIdPorNombre(nombre: any, mapa: Map<string, number>): number {
        const key = normalizarTexto(nombre, true);
        if (key.length < 1)
            return 0;
        return toInt(mapa.get(key));
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
        const key = normalizarTexto(nombreGenero, true);
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
        return getAlineamientoBasicoIdPorNombre(normalizarTexto(nombreAlineamiento, true));
    }

    private resolverIdCargaDesdeFuerza(fuerza: any): number {
        const fuerzaValor = toInt(fuerza);
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
                    { headers: new HttpHeaders(await cabeceraApiConFirebase(this.auth)) }
                )
            );
            const idPersonaje = toInt(response?.idPersonaje);
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
            throw errorDePerfil(error, 'No se pudo crear el personaje en la API.');
        }
    }

    public normalizarPersonajeParaPersistenciaFinal(personaje: Personaje, idPersonaje: number): Personaje {
        const id = toInt(idPersonaje);
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
                    Nivel: Math.max(0, toInt(entrada?.Nivel)),
                }))
                .filter((entrada) => entrada.Nombre.length > 0 && entrada.Nivel > 0)
            : [];

        clonado.Id = id;
        clonado.ownerUid = toNullableText(clonado?.ownerUid);
        clonado.visible_otros_usuarios = !!clonado?.visible_otros_usuarios;
        clonado.Archivado = !!clonado?.Archivado;
        clonado.desgloseClases = clasesNormalizadas;
        clonado.Clases = resumenClases(clasesNormalizadas);
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
        clonado.ProgresionLanzador = normalizarProgresionLanzadorPersonaje(clonado?.ProgresionLanzador);
        clonado.Niveles_lanzador = Array.isArray(clonado?.Niveles_lanzador) ? clonado.Niveles_lanzador : [];
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

    /**
     * `PersonajeDetalle` (`GET /personajes/{id}` y `/personajes/publicos/{id}`) a la ficha de la web. Las listas, los
     * totales y los rellenos a `null` siguen el contrato desde el 2026-10-24 (`docs/publica/FICHA_NUEVA_FRONT.md`): los
     * totales se toman tal cual y un `null` se queda en vacío.
     */
    private mapApiDetalleToPersonaje(element: any): Personaje {
        const raza = element?.ra;
        const clases = toArray<PersonajeClaseDto>(element?.clases)
            .map((clase) => ({
                Id: toInt(clase?.id),
                Nombre: toText(clase?.nombre).trim(),
                Nivel: toNumber(clase?.nivel),
                Caracteristica_lanzamiento: toNullableText(clase?.caracteristicaLanzamiento),
            }))
            .filter((clase) => clase.Nombre.length > 0);
        const plantillas = toArray<any>(element?.pla);
        // El NEP lo da la API (`nivelEfectivo`, un solo sitio): niveles de clase + DG raciales + ajustes de nivel.
        const nep = toNumber(element?.nivelEfectivo);

        const dotesContextuales = toDoteContextualArray(element?.dotes);
        const totales: PersonajeTotales = {
            iniciativa: normalizarTotal(element?.iniciativa) ?? totalVacio(),
            presa: normalizarTotal(element?.presa),
            salvaciones: {
                fortaleza: normalizarTotal(element?.salvaciones?.fortaleza) ?? totalVacio(),
                reflejos: normalizarTotal(element?.salvaciones?.reflejos) ?? totalVacio(),
                voluntad: normalizarTotal(element?.salvaciones?.voluntad) ?? totalVacio(),
            },
        };
        const idRegion = Math.max(0, toInt(element?.id_region));
        const idPersonaje = toInt(element?.i);

        return {
            Id: idPersonaje,
            Nombre: toText(element?.n).trim(),
            ownerUid: extractOwnerUid(element),
            ownerDisplayName: extractOwnerDisplayName(element),
            visible_otros_usuarios: toBoolean(element?.visible_otros_usuarios),
            Id_region: idRegion,
            Region: idRegion > 0 ? { Id: idRegion, Nombre: '' } : null,
            Personalidad: toText(element?.dcp),
            Contexto: toText(element?.dh),
            Ataque_base: toText(element?.a, '0'),
            Totales: totales,
            Tamano: raza?.Tamano?.Nombre,
            Ca: element?.ca,
            Equipo: normalizarPiezasEquipo(element?.equipo),
            ModificadoresEquipo: normalizarModificadoresEquipo(element?.modificadoresEquipo),
            Defensa: normalizarDefensa(element?.defensa),
            PesoEquipo: toNumber(element?.pesoEquipo),
            Dinero: normalizarDinero(element?.dinero),
            Armadura_natural: element?.an,
            Ca_desvio: element?.cd,
            Ca_varios: element?.cv,
            Iniciativa_varios: modificadoresDePartes(totales.iniciativa, 'varios').map(({ valor, origen }) => ({ Valor: valor, Origen: origen })),
            Presa: totales.presa?.total ?? 0,
            Presa_varios: modificadoresDePartes(totales.presa, 'varios').map(({ valor, origen }) => ({ Valor: valor, Origen: origen })),
            Raza: raza,
            RazaBase: element?.RazaBase ?? element?.rb ?? element?.raza_base ?? null,
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
            NEP: nep,
            Experiencia: experienciaParaNivel(nep),
            Deidad: toText(element?.de),
            Alineamiento: toText(element?.ali),
            Genero: toText(element?.g),
            Campana: toText(element?.ncam),
            Trama: toText(element?.ntr),
            Subtrama: toText(element?.nst),
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
            Clases: resumenClases(clases),
            desgloseClases: clases,
            ProgresionLanzador: normalizarProgresionLanzadorPersonaje(element?.progresionLanzador),
            Niveles_lanzador: [],
            Dominios: nombresConId(element?.dominios),
            Subtipos: normalizeSubtipoRefArray(element?.subtipos),
            competencia_arma: normalizeCompetenciasPersonaje(element?.competencia_arma, {
                idKeys: ['Id', 'id', 'Id_arma', 'id_arma', 'i'],
                nombreKeys: ['Nombre', 'nombre', 'Arma', 'arma'],
            }) as PersonajeCompetenciaDirecta[],
            competencia_armadura: normalizeCompetenciasPersonaje(element?.competencia_armadura, {
                idKeys: ['Id', 'id', 'Id_armadura', 'id_armadura', 'Id_arma', 'id_arma', 'i'],
                nombreKeys: ['Nombre', 'nombre', 'Armadura', 'armadura', 'Arma', 'arma'],
                includeShield: true,
            }) as PersonajeCompetenciaArmaduraDirecta[],
            competencia_grupo_arma: normalizeCompetenciasPersonaje(element?.competencia_grupo_arma, {
                idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
                nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
            }) as PersonajeCompetenciaDirecta[],
            competencia_grupo_armadura: normalizeCompetenciasPersonaje(element?.competencia_grupo_armadura, {
                idKeys: ['Id', 'id', 'Id_grupo', 'id_grupo', 'IdGrupo', 'idGrupo', 'i'],
                nombreKeys: ['Nombre', 'nombre', 'Grupo', 'grupo'],
            }) as PersonajeCompetenciaDirecta[],
            Plantillas: plantillas,
            Familiares: normalizeFamiliarMonstruoDetalleArray(element?.familiares, 1),
            Companeros: normalizeCompaneroMonstruoDetalleArray(element?.companeros, 1),
            Conjuros: toArray(element?.con),
            Claseas: toArray<PersonajeEspecialDto>(element?.especiales)
                .map((especial) => ({
                    Id: toInt(especial?.id),
                    Id_extra: toInt(especial?.idExtra),
                    Nombre: toText(especial?.nombre).trim(),
                    Extra: toText(especial?.extra).trim(),
                    Extra_comodin: especial?.extraComodin ?? null,
                }))
                .filter((especial) => especial.Nombre.length > 0),
            Raciales: normalizeRaciales(element?.rac),
            Habilidades: toArray<PersonajeHabilidadDto>(element?.habilidades).map((habilidad) => ({
                Id: toInt(habilidad?.id),
                Nombre: toText(habilidad?.nombre),
                Clasea: toBoolean(habilidad?.deClase),
                Car: toText(habilidad?.caracteristica),
                Mod_car: toNumber(habilidad?.modificadorCaracteristica),
                Rangos: toNumber(habilidad?.rangos),
                Rangos_varios: toNumber(habilidad?.rangosVarios),
                Extra: toText(habilidad?.extra),
                Varios: toText(habilidad?.varios),
                Custom: toBoolean(habilidad?.custom),
                Total: toNumber(habilidad?.total),
                Extra_comodin: habilidad?.extraComodin ?? null,
            })),
            Dotes: toDoteLegacyArray(dotesContextuales),
            DotesContextuales: dotesContextuales,
            Ventajas: nombresConId(element?.ventajas),
            Idiomas: normalizeIdiomasPersonaje(element?.idi),
            Sortilegas: toArray(element?.sor),
            Salvaciones: {
                fortaleza: salvacionComoModificadores(totales.salvaciones.fortaleza),
                reflejos: salvacionComoModificadores(totales.salvaciones.reflejos),
                voluntad: salvacionComoModificadores(totales.salvaciones.voluntad),
            },
            Rds: defensas(element?.reduccionesDano),
            Rcs: defensas(element?.resistenciasConjuros),
            Res: defensas(element?.resistenciasElementales),
            Capacidad_carga: {
                Ligera: toNumber(element?.ccl),
                Media: toNumber(element?.ccm),
                Pesada: toNumber(element?.ccp),
            },
            Escuela_especialista: {
                Nombre: toText(element?.espa),
                Calificativo: toText(element?.espan),
                Comodin: leerComodin(element?.espaComodin),
            },
            Disciplina_especialista: {
                Nombre: toText(element?.espp),
                Calificativo: toText(element?.esppn),
            },
            Disciplina_prohibida: toText(element?.disp),
            Escuelas_prohibidas: nombresConId(element?.escuelasProhibidas),
            // `archivado` viene siempre en `PersonajeDetalle` (docs/publica/endpoints/personajes.md).
            Archivado: toBoolean(element?.archivado),
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
}

/**
 * Hasta el 2026-10-25 se guardaba aquí, sin la cuenta, qué personajes había archivado quien usaba el navegador, por si
 * el detalle no traía `archivado`. El contrato lo trae siempre: se borra lo que quede para que otra cuenta no lo vea
 * (ecosistema-kit/CAMBIO_DE_CUENTA.md). Se puede quitar cuando haya pasado un tiempo.
 */
const MARCA_DE_ARCHIVADO_ANTIGUA = 'fichas.personajes.archivado.override.v1';

function borrarMarcaDeArchivadoAntigua(): void {
    try {
        globalThis.localStorage?.removeItem(MARCA_DE_ARCHIVADO_ANTIGUA);
    } catch {
        // Sin almacenamiento local no hay nada que borrar.
    }
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

/** Las listas `{ id, nombre }` de la ficha (dominios, ventajas, escuelas prohibidas). */
function nombresConId(raw: unknown): { Id: number; Nombre: string; }[] {
    return toArray<PersonajeNombreIdDto>(raw)
        .map((item) => ({ Id: toInt(item?.id), Nombre: toText(item?.nombre).trim() }))
        .filter((item) => item.Nombre.length > 0);
}

function defensas(raw: unknown): { Modificador: string; Origen: string; }[] {
    return toArray<PersonajeDefensaDto>(raw)
        .map((item) => ({ Modificador: toText(item?.valor).trim(), Origen: toText(item?.origen).trim() }))
        .filter((item) => item.Modificador.length > 0);
}

function salvacionComoModificadores(total: PersonajeTotalDto): Personaje['Salvaciones']['fortaleza'] {
    return {
        modsClaseos: modificadoresDePartes(total, 'clase'),
        modsVarios: modificadoresDePartes(total, 'varios'),
    };
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

        const dedupeKey = id > 0 ? `id:${id}` : `nombre:${normalizarTexto(nombre, true)}`;
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
        return toInt(item);

    if (typeof item === 'string') {
        const parsed = Math.trunc(Number(item));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    for (const key of idKeys) {
        const id = toInt(item?.[key]);
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
