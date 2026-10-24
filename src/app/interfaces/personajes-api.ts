export interface PersonajeContextoIdsDto {
    idCampana?: number | null;
    idTrama?: number | null;
    idSubtrama?: number | null;
    idRegion?: number | null;
    idAlineamiento?: number | null;
    idDeidad?: number | null;
    idGenero?: number | null;
    idCarga?: number | null;
    idManiobrabilidad?: number | null;
    idEspArcana?: number | null;
    idEspPsionica?: number | null;
    idDisProhibida?: number | null;
    catalogos?: {
        clases?: CatalogoNombreIdDto[];
        dominios?: CatalogoNombreIdDto[];
        idiomas?: CatalogoNombreIdDto[];
        ventajas?: CatalogoNombreIdDto[];
        escuelas?: CatalogoNombreIdDto[];
        disciplinas?: CatalogoNombreIdDto[];
        regiones?: CatalogoNombreIdDto[];
    };
}

export interface PersonajeCaracteristicaCreateDto {
    valor: number;
    minimo: number;
    perdido: boolean;
}

export interface CatalogoNombreIdDto {
    id: number;
    nombre: string;
}

export interface PersonajeCreateModificadorValorDto {
    valor: number;
    origen?: string;
}

export interface PersonajeCreateModificadoresDto {
    ca?: PersonajeCreateModificadorValorDto[];
    iniciativa?: PersonajeCreateModificadorValorDto[];
    presa?: PersonajeCreateModificadorValorDto[];
    salvaciones?: {
        fortaleza?: {
            claseos?: PersonajeCreateModificadorValorDto[];
            varios?: PersonajeCreateModificadorValorDto[];
        };
        reflejos?: {
            claseos?: PersonajeCreateModificadorValorDto[];
            varios?: PersonajeCreateModificadorValorDto[];
        };
        voluntad?: {
            claseos?: PersonajeCreateModificadorValorDto[];
            varios?: PersonajeCreateModificadorValorDto[];
        };
    };
}

export interface PersonajeCreateColeccionesDto {
    clases?: Array<{ idClase: number; nivel: number; }>;
    plantillas?: Array<{ idPlantilla: number; }>;
    subtipos?: Array<{ idSubtipo: number; }>;
    competencia_arma?: Array<{ idArma: number; }>;
    competencia_armadura?: Array<{ idArmadura: number; }>;
    competencia_grupo_arma?: Array<{ idGrupoArma: number; }>;
    competencia_grupo_armadura?: Array<{ idGrupoArmadura: number; }>;
    dgsExtra?: Array<{ valor: number; origen?: string; teriantropia?: boolean; }>;
    escuelasProhibidas?: Array<{ idEscuela: number; }>;
    rd?: Array<{ rd: string; origen?: string; }>;
    rc?: Array<{ rc: string; origen?: string; }>;
    re?: Array<{ re: string; origen?: string; }>;
    enemigosPredilectos?: Array<{ idEnemigo: number; cantidad?: number; }>;
    habilidades?: {
        base?: Array<{
            idHabilidad: number;
            idExtra?: number;
            clasea?: boolean;
            rangos?: number;
            rangosVarios?: number;
            modVarios?: string;
        }>;
        custom?: Array<{
            idHabilidad: number;
            idExtra?: number;
            clasea?: boolean;
            rangos?: number;
            rangosVarios?: number;
            modVarios?: string;
        }>;
    };
    ventajas?: Array<{ idVentaja: number; }>;
    especiales?: Array<{ idEspecial: number; idExtra?: number; }>;
    idiomas?: Array<{ idIdioma: number; origen?: string; }>;
    dotes?: Array<{ idDote: number; idExtra?: number; origen?: string; }>;
    dominios?: Array<{ idDominio: number; origen?: string; }>;
    conjurosConocidos?: Array<{ idConjuro: number; }>;
    sortilegas?: Array<{ idConjuro: number; nivelLanz?: string; usos?: string; dgs?: number; origen?: string; }>;
    raciales?: Array<{ idRacial: number; origen?: string; }>;
}

export interface PersonajeContextoCreacionCampanaDto {
    tiradaMinimaDeclarada?: number | null;
    tablasDadosUsadas?: number | null;
    overrideReglasCampana?: boolean;
}

export interface PersonajeProgresionLanzadorSeleccionDto {
    idClaseAplicada: number;
    nivelClaseAplicado: number;
    indiceAumento: number;
    idClaseObjetivo: number;
}

export interface PersonajeProgresionLanzadorDto {
    selecciones: PersonajeProgresionLanzadorSeleccionDto[];
}

export interface PersonajeCreateRequestDto {
    personaje: {
        nombre: string;
        ataqueBase: string;
        idRaza: number;
        idRazaBase?: number | null;
        idTipoCriatura: number;
        idRegion: number;
        campana?: { id: number; } | null;
        trama?: { id: number; } | null;
        subtrama?: { id: number; } | null;
        descripcionPersonalidad?: string;
        descripcionHistoria?: string;
        armaduraNatural?: number;
        caDesvio?: number;
        altura?: number;
        edad?: number;
        peso?: number;
        ajuste?: number;
        deidad?: number;
        idAlineamiento?: number;
        idGenero?: number;
        idCarga?: number;
        puntosGolpe?: number;
        pgsLic?: number;
        correr?: number;
        nadar?: number;
        volar?: number;
        idManiobrabilidad?: number;
        trepar?: number;
        escalar?: number;
        espacio?: number;
        alcance?: number;
        idEspArcana?: number;
        idEspPsionica?: number;
        idDisProhibida?: number;
        visible_otros_usuarios: boolean;
        oficial: boolean;
    };
    caracteristicas: {
        fuerza: PersonajeCaracteristicaCreateDto;
        destreza: PersonajeCaracteristicaCreateDto;
        constitucion: PersonajeCaracteristicaCreateDto;
        inteligencia: PersonajeCaracteristicaCreateDto;
        sabiduria: PersonajeCaracteristicaCreateDto;
        carisma: PersonajeCaracteristicaCreateDto;
    };
    tamano: {
        idTamano: number;
        origen: string;
    };
    modificadores?: PersonajeCreateModificadoresDto;
    colecciones?: PersonajeCreateColeccionesDto;
    progresionLanzador?: PersonajeProgresionLanzadorDto;
    contextoCreacionCampana?: PersonajeContextoCreacionCampanaDto;
    familiar?: Record<string, any>;
    companero?: Record<string, any>;
}

export interface PersonajeCreateApiResponseDto {
    message: string;
    idPersonaje: number;
    ownerUserId: string;
}

export interface PersonajeCreateResponseDto {
    message: string;
    idPersonaje: number;
    ownerUserId: string;
}

/*
 * Las partes nuevas de `PersonajeDetalle` (`GET /personajes/{id}`, desde el 2026-10-24). Contrato:
 * `docs/publica/endpoints/personajes.md` y la guía `docs/publica/FICHA_NUEVA_FRONT.md`.
 */

/** «Elegir» (falta escoger el extra) o «Cualquiera» (vale cualquiera), marcados por la API en los extras de la ficha. */
export type PersonajeExtraComodinDto = 'elegir' | 'cualquiera';

export interface PersonajeNombreIdDto {
    id: number;
    nombre: string;
}

export interface PersonajeClaseDto extends PersonajeNombreIdDto {
    nivel: number;
    lanzaConjuros: boolean;
    caracteristicaLanzamiento: string | null;
    modificadorLanzamiento: number | null;
}

export interface PersonajeEspecialDto extends PersonajeNombreIdDto {
    idExtra: number | null;
    extra: string | null;
    extraComodin: PersonajeExtraComodinDto | null;
}

export type PersonajeTipoParteDto = 'caracteristica' | 'ataqueBase' | 'tamano' | 'clase' | 'varios' | 'rangos' | 'rangosVarios';

/** Una parte de un total: de dónde sale y cuánto suma. `origen` es `null` si la base no lo dice. */
export interface PersonajeParteDto {
    tipo: PersonajeTipoParteDto;
    origen: string | null;
    valor: number;
}

/** Un total hecho por la API, con su desglose (el total es la suma del desglose). */
export interface PersonajeTotalDto {
    total: number;
    desglose: PersonajeParteDto[];
}

export interface PersonajeSalvacionesDto {
    fortaleza: PersonajeTotalDto;
    reflejos: PersonajeTotalDto;
    voluntad: PersonajeTotalDto;
}

export interface PersonajeHabilidadDto extends PersonajeNombreIdDto, PersonajeTotalDto {
    custom: boolean;
    deClase: boolean;
    idExtra: number | null;
    extra: string | null;
    extraComodin: PersonajeExtraComodinDto | null;
    caracteristica: string | null;
    modificadorCaracteristica: number;
    rangos: number;
    rangosVarios: number;
    varios: string | null;
}

export interface PersonajeDefensaDto {
    valor: string;
    origen: string | null;
}
