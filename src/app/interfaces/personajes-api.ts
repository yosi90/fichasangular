import { Comodin } from './comodin';

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
    familiar?: PersonajeCreateFamiliarDto;
    companero?: PersonajeCreateCompaneroDto;
}

/** Una habilidad de un familiar o un compañero (`familiar.habilidades[]`, `companero.habilidades[]`). */
export interface PersonajeCreateHabilidadMascotaDto {
    idHabilidad: number;
    /** -1 sin extra; 0 «Elegir»; si no, el id en `extras_habilidades`. */
    idExtra: number;
    rangos: number;
}

/** El familiar del personaje (`POST /personajes/add`, bloque `familiar`): se guarda como un familiar propio. */
export interface PersonajeCreateFamiliarDto {
    nombre: string;
    idMonstruo: number;
    idPlantilla: number;
    vida: number;
    ataqueBase: number;
    fortaleza: number;
    reflejos: number;
    voluntad: number;
    armaduraNatural: number;
    inteligencia: number;
    rc?: string;
    habilidades: PersonajeCreateHabilidadMascotaDto[];
    especiales: Array<{ idEspecial: number; }>;
    dotes: Array<{ idDote: number; idExtra: number; }>;
}

/** El compañero animal del personaje (`POST /personajes/add`, bloque `companero`). */
export interface PersonajeCreateCompaneroDto {
    nombre: string;
    idMonstruo: number;
    idPlantilla: number;
    vida: number;
    dgAdi: number;
    armaduraNatural: number;
    fuerza: number;
    destreza: number;
    inteligencia: number;
    trucosAdi: number;
    habilidades: PersonajeCreateHabilidadMascotaDto[];
    especiales: Array<{ idEspecial: number; idExtra: number; }>;
    dotes: Array<{ idDote: number; idExtra: number; }>;
}

export interface PersonajeCreateMascotasDto {
    familiar?: PersonajeCreateFamiliarDto;
    companero?: PersonajeCreateCompaneroDto;
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
export type PersonajeExtraComodinDto = Comodin;

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

/**
 * El tipo de una parte: `equipo` en las salvaciones (lo que suma el equipo); `base` y `bonificador` en la defensa (la CA de
 * base 10 y los bonificadores de armadura, escudo, armadura natural, desvío, esquiva…).
 */
export type PersonajeTipoParteDto = 'caracteristica' | 'ataqueBase' | 'tamano' | 'clase' | 'varios' | 'rangos' | 'rangosVarios'
    | 'equipo' | 'base' | 'bonificador';

/** Una parte de un total: de dónde sale y cuánto suma. `origen` es `null` si la base no lo dice. */
export interface PersonajeParteDto {
    tipo: PersonajeTipoParteDto;
    origen: string | null;
    valor: number;
    /** En las partes `equipo` y `bonificador`: el tipo de bonificador («Resistencia», «Armadura», «Desvío»…). */
    bonificador?: string | null;
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

/*
 * El equipo de la ficha (familia 1 de objetos, `docs/publica/endpoints/personajes.md`, «El equipo de la ficha»): las
 * piezas que lleva, los modificadores de lo equipado, la defensa calculada, el peso y el dinero. La web enseña los
 * totales sin volver a sumar.
 */

export type PersonajeTipoPiezaDto = 'arma' | 'armadura' | 'objeto' | 'municion';

export interface PersonajeEquipoPiezaDto {
    id: number;
    orden: number;
    tipo: PersonajeTipoPiezaDto;
    elemento: PersonajeNombreIdDto | null;
    nombre: string;
    cantidad: number;
    equipado: boolean;
    ranura: PersonajeNombreIdDto | null;
    empunadura: PersonajeNombreIdDto | null;
    tamano: PersonajeNombreIdDto | null;
    material: PersonajeNombreIdDto | null;
    granCalidad: boolean;
    bonificadorMejora: number;
    bonificadorMejora2: number | null;
    indiceFuerza: number | null;
    encantamientos: (PersonajeNombreIdDto & { cabeza: number; })[];
    conjuro: PersonajeNombreIdDto | null;
    nivelConjuro: number | null;
    nivelLanzador: number | null;
    cargasRestantes: number | null;
    notas: string | null;
    /** Peso de todas las unidades, con el tamaño y el material; `null` si el catálogo no lo dice. */
    peso: number | null;
    /** En un arma o armadura mágica específica (`tipo: objeto`): su arma o armadura base; `null` en las demás. */
    elementoBase: (PersonajeNombreIdDto & { tipo: 'arma' | 'armadura'; }) | null;
    /** En las armas (y las armas específicas): el daño para su tamaño y el crítico compuesto. */
    arma: { dano: string | null; critico: string | null; } | null;
    /** En armaduras y escudos: sus cifras con la mejora, la gran calidad y el material. */
    armadura: { esEscudo: boolean; ca: number; bonDes: number | null; penalizador: number; falloArcano: number; } | null;
}

export interface PersonajeModificadorEquipoDto {
    origen: string;
    objetivo: PersonajeNombreIdDto | null;
    tipoBonificador: PersonajeNombreIdDto & { apila: boolean; } | null;
    valor: number;
    caracteristica: PersonajeNombreIdDto | null;
    habilidad: PersonajeNombreIdDto | null;
    tipoDano: PersonajeNombreIdDto | null;
    /** Lo condicional: se enseña y no se suma. */
    condicion: string | null;
    /** Si la API lo ha sumado a la CA o a una salvación. */
    sumado: boolean;
}

export interface PersonajeDefensaTotalesDto {
    ca: PersonajeTotalDto;
    toque: PersonajeTotalDto;
    desprevenido: PersonajeTotalDto;
    /** La menor de la armadura y el escudo puestos; `null` sin límite. */
    destrezaMaxima: number | null;
    penalizadorArmadura: number;
    falloConjuroArcano: number;
}

/** Lo que le queda tras las compras del final de la creación y con lo que compró. */
export interface PersonajeDineroDto {
    po: number;
    dineroInicial: number;
}

/** Una pieza de `PUT /personajes/{id}/equipo`, las compras del final de la creación. La API calcula su precio. */
export interface PersonajeCompraPiezaDto {
    tipo: PersonajeTipoPiezaDto;
    id: number;
    cantidad?: number;
    equipado?: boolean;
    idRanura?: number;
    idEmpunadura?: number;
    idTamano?: number;
    idMaterial?: number;
    granCalidad?: boolean;
    bonificadorMejora?: number;
    bonificadorMejora2?: number;
    indiceFuerza?: number;
    encantamientos?: { id: number; cabeza: number; }[];
    /** Los tres, obligatorios en los genéricos de un conjuro (poción, pergamino, varita…). */
    idConjuro?: number;
    nivelConjuro?: number;
    nivelLanzador?: number;
    cargasRestantes?: number;
    nombrePersonalizado?: string;
    notas?: string;
}

export interface PersonajeCompraRequestDto {
    /** En po: el oro inicial de su clase (nivel 1) o la riqueza de su nivel. */
    dineroInicial: number;
    piezas: PersonajeCompraPiezaDto[];
}

export interface PersonajeCompraResponseDto {
    idPersonaje: number;
    /** Lo que cuesta todo, en po. */
    coste: number;
    dineroInicial: number;
    /** Lo que le queda. */
    dinero: number;
    /** El precio de cada pieza, en su orden. */
    costes: number[];
    /** Si sigue siendo oficial (comprar algo homebrew lo pasa a homebrew). */
    oficial: boolean;
}
