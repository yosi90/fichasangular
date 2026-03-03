import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set, update } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Personaje } from '../interfaces/personaje';
import { environment } from 'src/environments/environment';
import { RazaSimple } from '../interfaces/simplificaciones/raza-simple';
import Swal from 'sweetalert2';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { DoteContextual } from '../interfaces/dote-contextual';
import { toDoteContextualArray, toDoteLegacyArray } from './utils/dote-mapper';
import {
    CatalogoNombreIdDto,
    PersonajeContextoIdsDto,
    PersonajeCreateColeccionesDto,
    PersonajeCreateModificadoresDto,
    PersonajeCreateRequestDto,
    PersonajeCreateResponseDto
} from '../interfaces/personajes-api';
import {
    normalizeCompaneroMonstruoDetalleArray,
    normalizeFamiliarMonstruoDetalleArray
} from './utils/monstruo-mapper';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';

interface PersonajeVisibilityUpdateResponse {
    message: string;
    idPersonaje: number;
    visible_otros_usuarios: boolean;
    uid: string;
}

@Injectable({
    providedIn: 'root'
})
export class PersonajeService {

    constructor(private db: Database, private http: HttpClient) { }

    async getDetallesPersonaje(id: number): Promise<Observable<Personaje>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Personajes/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const clasesVal = snapshot.child('Clases').val();
                const clasesArray = Array.isArray(clasesVal) ? clasesVal : [];
                const dotesContextuales = toDoteContextualArray(snapshot.child('DotesContextuales').val());
                const dotesLegacyRaw = snapshot.child('Dotes').val();
                const subtipos = normalizeSubtipoRefArray(snapshot.child('Subtipos').val() ?? snapshot.child('stc').val());
                const ventajas = normalizeVentajasPersonaje(snapshot.child('Ventajas').val());
                const idiomas = normalizeIdiomasPersonaje(snapshot.child('Idiomas').val());
                const familiares = normalizeFamiliarMonstruoDetalleArray(snapshot.child('Familiares').val() ?? snapshot.child('familiares').val(), 1);
                const companeros = normalizeCompaneroMonstruoDetalleArray(snapshot.child('Companeros').val() ?? snapshot.child('companeros').val(), 1);
                const caracteristicasPerdidas = normalizeCaracteristicasPerdidasPersonaje(
                    snapshot.child('Caracteristicas_perdidas').val(),
                    snapshot.child('Constitucion_perdida').val()
                );
                const dotesLegacy = Array.isArray(dotesLegacyRaw)
                    ? dotesLegacyRaw
                    : (dotesLegacyRaw && typeof dotesLegacyRaw === 'object'
                        ? Object.values(dotesLegacyRaw)
                        : toDoteLegacyArray(dotesContextuales));
                let pj: Personaje = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    ownerUid: toNullableText(snapshot.child('ownerUid').val() ?? snapshot.child('uid').val()),
                    visible_otros_usuarios: toBoolean(snapshot.child('visible_otros_usuarios').val()),
                    Raza: snapshot.child('Raza').val(),
                    RazaBase: snapshot.child('RazaBase').val() ?? snapshot.child('raza_base').val() ?? null,
                    desgloseClases: clasesArray,
                    Clases: clasesArray.map((c: { Nombre: any; Nivel: any; }) => `${c.Nombre} (${c.Nivel})`).join(", "),
                    Personalidad: snapshot.child('Personalidad').val(),
                    Contexto: snapshot.child('Contexto').val(),
                    Campana: snapshot.child('Campana').val(),
                    Trama: snapshot.child('Trama').val(),
                    Subtrama: snapshot.child('Subtrama').val(),
                    Ataque_base: snapshot.child('Ataque_base').val(),
                    Ca: snapshot.child('Ca').val(),
                    Armadura_natural: snapshot.child('Armadura_natural').val(),
                    Ca_desvio: snapshot.child('Ca_desvio').val(),
                    Ca_varios: snapshot.child('Ca_varios').val(),
                    Iniciativa_varios: snapshot.child('Iniciativa_varios').val(),
                    Presa: snapshot.child('Presa').val(),
                    Presa_varios: snapshot.child('Presa_varios').val(),
                    Tipo_criatura: snapshot.child('Tipo_criatura').val(),
                    Subtipos: subtipos,
                    Fuerza: snapshot.child('Fuerza').val(),
                    ModFuerza: snapshot.child('ModFuerza').val(),
                    Destreza: snapshot.child('Destreza').val(),
                    ModDestreza: snapshot.child('ModDestreza').val(),
                    Constitucion: snapshot.child('Constitucion').val(),
                    ModConstitucion: snapshot.child('ModConstitucion').val(),
                    Caracteristicas_perdidas: caracteristicasPerdidas,
                    Constitucion_perdida: caracteristicasPerdidas.Constitucion === true,
                    Inteligencia: snapshot.child('Inteligencia').val(),
                    ModInteligencia: snapshot.child('ModInteligencia').val(),
                    Sabiduria: snapshot.child('Sabiduria').val(),
                    ModSabiduria: snapshot.child('ModSabiduria').val(),
                    Carisma: snapshot.child('Carisma').val(),
                    ModCarisma: snapshot.child('ModCarisma').val(),
                    CaracteristicasVarios: snapshot.child('CaracteristicasVarios').val() ?? {
                        Fuerza: [],
                        Destreza: [],
                        Constitucion: [],
                        Inteligencia: [],
                        Sabiduria: [],
                        Carisma: [],
                    },
                    NEP: snapshot.child('NEP').val(),
                    Experiencia: snapshot.child('Experiencia').val(),
                    Deidad: snapshot.child('Deidad').val(),
                    Alineamiento: snapshot.child('Alineamiento').val(),
                    Genero: snapshot.child('Genero').val(),
                    Vida: snapshot.child('Vida').val(),
                    Correr: snapshot.child('Correr').val(),
                    Nadar: snapshot.child('Nadar').val(),
                    Volar: snapshot.child('Volar').val(),
                    Trepar: snapshot.child('Trepar').val(),
                    Escalar: snapshot.child('Escalar').val(),
                    Oficial: snapshot.child('Oficial').val(),
                    Dados_golpe: snapshot.child('Dados_golpe').val(),
                    Pgs_lic: snapshot.child('Pgs_lic').val(),
                    Dominios: snapshot.child('Dominios').val(),
                    Plantillas: snapshot.child('Plantillas').val(),
                    Familiares: familiares,
                    Companeros: companeros,
                    Conjuros: snapshot.child('Conjuros').val(),
                    Claseas: snapshot.child('Claseas').val(),
                    Raciales: normalizeRaciales(snapshot.child('Raciales').val()),
                    Habilidades: snapshot.child('Habilidades').val(),
                    Dotes: dotesLegacy,
                    DotesContextuales: dotesContextuales,
                    Ventajas: ventajas,
                    Idiomas: idiomas,
                    Sortilegas: snapshot.child('Sortilegas').val(),
                    Archivado: false,
                    Jugador: snapshot.child('Jugador').val(),
                    Edad: snapshot.child('Edad').val(),
                    Altura: snapshot.child('Altura').val(),
                    Peso: snapshot.child('Peso').val(),
                    Salvaciones: snapshot.child('Salvaciones').val(),
                    Rds: snapshot.child('Rds').val(),
                    Rcs: snapshot.child('Rcs').val(),
                    Res: snapshot.child('Res').val(),
                    Capacidad_carga: snapshot.child('Capacidad_carga').val(),
                    Oro_inicial: snapshot.child('Oro_inicial').val() ?? 0,
                    Escuela_especialista: snapshot.child('Escuela_especialista').val(),
                    Disciplina_especialista: snapshot.child('Disciplina_especialista').val(),
                    Disciplina_prohibida: snapshot.child('Disciplina_prohibida').val(),
                    Escuelas_prohibidas: snapshot.child('Escuelas_prohibidas').val(),
                };
                observador.next(pj); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    private d_pjs(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = this.http.get(`${environment.apiUrl}personajes`);
        return res;
    }

    public async actualizarVisibilidadPersonaje(
        idPersonaje: number,
        visible: boolean,
        actorUid: string
    ): Promise<PersonajeVisibilityUpdateResponse> {
        const id = Math.trunc(toNumber(idPersonaje));
        const uid = `${actorUid ?? ''}`.trim();
        if (id <= 0)
            throw new Error('Id de personaje no válido');
        if (uid.length < 1)
            throw new Error('No hay sesión activa para actualizar visibilidad');

        const payload = {
            uid,
            visible_otros_usuarios: !!visible,
        };

        const response = await firstValueFrom(
            this.http.patch<PersonajeVisibilityUpdateResponse>(
                `${environment.apiUrl}personajes/${id}/visible`,
                payload
            )
        );

        try {
            await Promise.all([
                update(ref(this.db, `Personajes/${id}`), {
                    visible_otros_usuarios: !!visible,
                }),
                update(ref(this.db, `Personajes-simples/${id}`), {
                    visible_otros_usuarios: !!visible,
                }),
            ]);
        } catch {
            // Usuarios no-admin pueden no tener permisos de escritura en RTDB.
        }

        return {
            ...response,
            idPersonaje: Math.trunc(toNumber(response?.idPersonaje)),
            visible_otros_usuarios: !!visible,
            uid,
        };
    }

    public construirPayloadCreacionDesdePersonaje(
        personaje: Personaje,
        uidSesion: string,
        contextoIds: PersonajeContextoIdsDto
    ): PersonajeCreateRequestDto {
        const uid = `${uidSesion ?? ''}`.trim();
        const nombre = `${personaje?.Nombre ?? ''}`.trim();
        const idRaza = Math.trunc(toNumber(personaje?.Raza?.Id));
        const idTipoCriatura = Math.trunc(toNumber(personaje?.Tipo_criatura?.Id));
        const idCampana = Math.trunc(toNumber(contextoIds?.idCampana));
        const idTrama = Math.trunc(toNumber(contextoIds?.idTrama));
        const idSubtrama = Math.trunc(toNumber(contextoIds?.idSubtrama));
        const tieneClaseConNivel = (personaje?.desgloseClases ?? [])
            .some((entrada) => Math.trunc(toNumber(entrada?.Nivel)) > 0);
        const mapasCatalogo = {
            clases: this.construirMapaNombreId(contextoIds?.catalogos?.clases),
            dominios: this.construirMapaNombreId(contextoIds?.catalogos?.dominios),
            idiomas: this.construirMapaNombreId(contextoIds?.catalogos?.idiomas),
            ventajas: this.construirMapaNombreId(contextoIds?.catalogos?.ventajas),
            escuelas: this.construirMapaNombreId(contextoIds?.catalogos?.escuelas),
            disciplinas: this.construirMapaNombreId(contextoIds?.catalogos?.disciplinas),
        };

        if (uid.length < 1)
            throw new Error('No hay sesión activa para finalizar el personaje.');
        if (nombre.length < 1)
            throw new Error('El personaje debe tener nombre antes de finalizar.');
        if (idRaza <= 0)
            throw new Error('La raza del personaje no es válida.');
        if (idTipoCriatura <= 0)
            throw new Error('El tipo de criatura del personaje no es válido.');
        if (!tieneClaseConNivel)
            throw new Error('Debes tener al menos una clase con nivel mayor que 0.');
        if (idCampana <= 0 || idTrama <= 0 || idSubtrama <= 0)
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
            campana: { id: idCampana },
            trama: { id: idTrama },
            subtrama: { id: idSubtrama },
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

        const payload: PersonajeCreateRequestDto = {
            uid,
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
                this.http.post<PersonajeCreateResponseDto>(
                    `${environment.apiUrl}personajes/add`,
                    payload
                )
            );
            const idPersonaje = Math.trunc(toNumber(response?.idPersonaje));
            const idJugador = Math.trunc(toNumber(response?.idJugador));
            if (idPersonaje <= 0)
                throw new Error('La API no devolvió un id de personaje válido.');

            return {
                message: `${response?.message ?? 'Personaje creado'}`,
                idPersonaje,
                idJugador,
                uid: `${response?.uid ?? payload?.uid ?? ''}`.trim(),
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
        return set(ref(this.db, path), payload);
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

    public async RenovarPersonajes(): Promise<boolean> {
        const db = getDatabase();
        try {
            const response = await firstValueFrom(this.d_pjs());
            const personajes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                personajes.map((element: {
                    i: any; n: any; ownerUid?: any; visible_otros_usuarios?: any; dcp: any; dh: any; tm: any; a: any; ca: any; an: any; cd: any; cv: any; ra: any; rb?: any; raza_base?: any; RazaBase?: any; tc: TipoCriatura; f: any; mf: any; d: any; md: any; co: any; mco: any; int: any; mint: any; s: any; 
                    ms: any; car: any; mcar: any; de: any; ali: any; g: any; ncam: any; ntr: any; ju: any; nst: any; v: any; cor: any; na: any; vo: any; t: any; e: any; o: any; dg: any; cla: any; dom: any; stc: any; subtipos?: any;
                    pla: any; con: any; esp: any; espX: any; rac: any; hab: any; habN: any; habC: any; habCa: any; habMc: any; habR: any; habRv: any; habX: any; habV: any; habCu: any; dotes: DoteContextual[]; ve: any; idi: any;
                    familiares?: any; companeros?: any;
                    sor: any; pgl: any; ini_v: any; pr_v: { Valor: number; Origen: string; }[]; edad: any; alt: any; peso: any; salv: any; rds: any; 
                    rcs: any; res: any; ccl: any; ccm: any; ccp: any; espa: any; espan: any; espp: any; esppn: any; disp: any; ecp: any; cper?: any; cperd?: any;
                }) => {
                    const tempcla = (element.cla ?? "").split("|");
                    let nep = toNumber(element?.ra?.Dgs_adicionales?.Cantidad);
                    let clas: { Nombre: string; Nivel: number }[] = [];
                    tempcla.forEach((el: string) => {
                        const datos = el.split(";");
                        const nivelClase = toNumber(datos[1]);
                        if (datos[0] != "") {
                            clas.push({
                                Nombre: datos[0].trim(),
                                Nivel: nivelClase
                            });
                            nep += nivelClase;
                        }
                    });
                    const ajusteNivelRaza = toNumber(element?.ra?.Ajuste_nivel);
                    if (ajusteNivelRaza > 0)
                        nep += ajusteNivelRaza;
                    (element.pla ?? []).forEach((el: { Ajuste_nivel: number; Multiplicador_dgs_lic: number }) => {
                        nep += toNumber(el.Ajuste_nivel) + toNumber(el.Multiplicador_dgs_lic);
                    });
                    const experiencia = nep > 0 ? ((nep - 1) * nep / 2) * 1000 : 0;
                    const dotesContextuales = toDoteContextualArray(element.dotes);
                    const dotes = toDoteLegacyArray(dotesContextuales);
                    let claseas: { Nombre: string; Extra: string; }[] = [];
                    for (let index = 0; index < element.esp.length; index++) {
                        claseas.push({
                            Nombre: element.esp[index],
                            Extra: element.espX[index] ?? 'Nada',
                        });
                    }
                    let habilidades: {
                        Id: number; Nombre: string; Clasea: boolean; Car: string; Mod_car: number; Rangos: number; Rangos_varios: number; Extra: string;
                        Varios: string; Custom: boolean;
                    }[] = [];
                    for (let index = 0; index < element.habN.length; index++) {
                        habilidades.push({
                            Id: element.hab[index],
                            Nombre: element.habN[index],
                            Clasea: element.habC[index],
                            Car: element.habCa[index],
                            Mod_car: element.habMc[index],
                            Rangos: element.habR[index],
                            Rangos_varios: element.habRv[index],
                            Extra: element.habX[index],
                            Varios: element.habV[index],
                            Custom: element.habCu[index]
                        });
                    }
                    let cargas = {
                        Ligera: element.ccl,
                        Media: element.ccm,
                        Pesada: element.ccp
                    }
                    let escuela_esp = {
                        Nombre: element.espa,
                        Calificativo: element.espan
                    }
                    let disciplina_esp = {
                        Nombre: element.espp,
                        Calificativo: element.esppn
                    }
                    let rds: { Modificador: string; Origen: string; }[] = [];
                    if (element.rds)
                        for (let index = 0; index < element.rds.length; index++) {
                            let partes = element.rds[index].split(";");
                            rds.push({
                                Modificador: partes[0],
                                Origen: partes[1],
                            });
                        }
                    let rcs: { Modificador: string; Origen: string; }[] = [];
                    if (element.rcs)
                        for (let index = 0; index < element.rcs.length; index++) {
                            let partes = element.rcs[index].split(";");
                            rcs.push({
                                Modificador: partes[0],
                                Origen: partes[1],
                            });
                        }
                    let res: { Modificador: string; Origen: string; }[] = [];
                    if (element.res)
                        for (let index = 0; index < element.res.length; index++) {
                            let partes = element.res[index].split(";");
                            res.push({
                                Modificador: partes[0],
                                Origen: partes[1],
                            });
                        }
                    const dom: [] = element.dom.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const subtipos = normalizeSubtipoRefArray(element.subtipos ?? element.stc ?? "");
                    const raciales = normalizeRaciales(element.rac);
                    const ve = normalizeVentajasPersonaje(element.ve);
                    const idiomas = normalizeIdiomasPersonaje(element.idi);
                    const ecp: [] = element.ecp.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const ataqueBase = `${element.a ?? 0}`;
                    const presaBase = +(ataqueBase.includes('/') ? ataqueBase.substring(0, ataqueBase.indexOf('/')) : ataqueBase);
                    const razaBase = element.RazaBase ?? element.rb ?? element.raza_base ?? null;
                    return set(ref(db, `Personajes/${element.i}`), {
                        Nombre: element.n,
                        ownerUid: extractOwnerUid(element),
                        visible_otros_usuarios: toBoolean(element.visible_otros_usuarios),
                        Personalidad: element.dcp,
                        Contexto: element.dh,
                        Ataque_base: element.a,
                        Tamano: element.ra.Tamano.Nombre,
                        Ca: element.ca,
                        Armadura_natural: element.an,
                        Ca_desvio: element.cd,
                        Ca_varios: element.cv,
                        Iniciativa_varios: element.ini_v ?? [],
                        Presa: Number(presaBase + +element.mf + +element.ra.Tamano.Modificador_presa + +(element.pr_v ?? []).reduce((c: number, v: { Valor: number; }) => c + Number(v.Valor), 0)),
                        Presa_varios: element.pr_v ?? [],
                        Raza: element.ra,
                        RazaBase: razaBase,
                        Tipo_criatura: element.tc,
                        Fuerza: element.f,
                        ModFuerza: element.mf,
                        Destreza: element.d,
                        ModDestreza: element.md,
                        Constitucion: element.co,
                        ModConstitucion: element.mco,
                        Caracteristicas_perdidas: normalizeCaracteristicasPerdidasPersonaje(element.cper, element.cperd),
                        Constitucion_perdida: toBoolean(element.cperd),
                        Inteligencia: element.int,
                        ModInteligencia: element.mint,
                        Sabiduria: element.s,
                        ModSabiduria: element.ms,
                        Carisma: element.car,
                        ModCarisma: element.mcar,
                        NEP: toNumber(nep),
                        Experiencia: toNumber(experiencia),
                        Deidad: element.de,
                        Alineamiento: element.ali,
                        Genero: element.g,
                        Campana: element.ncam,
                        Trama: element.ntr,
                        Subtrama: element.nst,
                        Vida: element.v,
                        Correr: element.cor,
                        Nadar: element.na,
                        Volar: element.vo,
                        Trepar: element.t,
                        Escalar: element.e,
                        Oficial: element.o,
                        Dados_golpe: element.dg,
                        Pgs_lic: element.pgl,
                        Jugador: element.ju,
                        Edad: element.edad,
                        Altura: element.alt,
                        Peso: element.peso,
                        Clases: clas,
                        Dominios: dom,
                        Subtipos: subtipos,
                        Plantillas: element.pla,
                        Familiares: normalizeFamiliarMonstruoDetalleArray(element.familiares, 1),
                        Companeros: normalizeCompaneroMonstruoDetalleArray(element.companeros, 1),
                        Conjuros: element.con,
                        Claseas: claseas,
                        Raciales: raciales,
                        Habilidades: habilidades,
                        Dotes: dotes,
                        DotesContextuales: dotesContextuales,
                        Ventajas: ve,
                        Idiomas: idiomas,
                        Sortilegas: element.sor,
                        Salvaciones: element.salv,
                        Rds: rds,
                        Rcs: rcs,
                        Res: res,
                        Capacidad_carga: cargas,
                        Oro_inicial: toNumber(calc_oro(nep)),
                        Escuela_especialista: escuela_esp,
                        Disciplina_especialista: disciplina_esp,
                        Disciplina_prohibida: element.disp,
                        Escuelas_prohibidas: ecp
                    });
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
        ?? value.owneruid
        ?? value.owner_uid
        ?? value.uid
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
