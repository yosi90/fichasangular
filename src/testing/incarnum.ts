/*
 * Datos de prueba de Magic of Incarnum con la forma de la API (`docs/publica/INCARNUM.md`), sacados de `rol_dev`: el
 * Yelmo de cristal, el chakra Corona, el moldeado del encarnado y el bloque `incarnum` de una ficha con formación.
 * Las specs los copian y cambian lo que necesiten.
 */

/** `GET /incarnum/fusiones/284`, sin los datos internos de juego. */
export function fusionApi(cambios: Record<string, unknown> = {}): any {
    return {
        Id: 284,
        Nombre: 'Yelmo de cristal',
        Nombre_original: 'Crystal Helm',
        Traducido: true,
        Descripcion: 'Un yelmo ligero de cristal transparente y facetado que envuelve la cabeza.',
        Efecto_basico: 'Bonificador +2 de resistencia a las salvaciones de Voluntad contra hechizos y compulsiones.',
        Efecto_esencia: 'Bonificador de desvío a la CA igual a la esencia invertida.',
        Origen_descripcion: 'propia',
        Datos_basico: { bonos: [{ a: 'Will', valor: 2 }] },
        Datos_esencia: null,
        Salvacion: null,
        Alineado_portador: false,
        Manual: { Id: 31, Nombre: 'Magia del incarnum', Pagina: 63 },
        Oficial: true,
        Clases: [{ Id: 405, Nombre: 'Encarnado' }, { Id: 406, Nombre: 'Nacido del alma' }],
        Descriptores: [{ Id: 7, Nombre: 'Fuerza', Actitud: null }],
        Chakras: [{
            Id: 34, Nombre: 'Corona', Nombre_original: 'Crown', Traducido: true, Ocupa: true, Vinculo: true,
            Efecto_vinculo: 'Tus ataques cuerpo a cuerpo tienen el descriptor de fuerza.', Datos_vinculo: { etiquetas: ['force'] },
        }],
        Comodin: null,
        ...cambios,
    };
}

/** `GET /incarnum/chakras/34`. */
export function chakraApi(cambios: Record<string, unknown> = {}): any {
    return {
        Id: 34,
        Nombre: 'Corona',
        Nombre_original: 'Crown',
        Traducido: true,
        Categoria: { Id: 19, Nombre: 'Mínimo', Nombre_original: 'Least', Traducido: true, Orden: 1 },
        Ranura: { Id: 1, Nombre: 'Cabeza' },
        Orden: 1,
        Descripcion: 'Chakra mínimo de la cabeza. Vincularle una fusión cierra la ranura de la cabeza.',
        Fusiones: [
            { Id: 284, Nombre: 'Yelmo de cristal', Nombre_original: 'Crystal Helm', Traducido: true, Ocupa: true, Vinculo: true },
            { Id: 276, Nombre: 'Diadema del domador de bestias', Nombre_original: 'Beast Tamer Circlet', Traducido: true, Ocupa: true, Vinculo: true },
        ],
        Clases: [{ Id: 407, Nombre: 'Totemista', Nivel: 5 }, { Id: 405, Nombre: 'Encarnado', Nivel: 2 }],
        Comodin: null,
        ...cambios,
    };
}

/** `Moldeado` del encarnado (los cinco primeros niveles). */
export function moldeadoEncarnadoApi(cambios: Record<string, unknown> = {}): any {
    return {
        Divisor_nivel_moldeador: 1,
        Caracteristica_cd: { Id: 5, Nombre: 'Sabiduría' },
        Caracteristica_fusiones: { Id: 3, Nombre: 'Constitución' },
        Limitado_por_alineamiento: true,
        Niveles: [
            { Nivel: 1, Fusiones: 2, Esencia: 1, Vinculos: 0 },
            { Nivel: 2, Fusiones: 3, Esencia: 2, Vinculos: 1 },
            { Nivel: 3, Fusiones: 3, Esencia: 3, Vinculos: 1 },
            { Nivel: 4, Fusiones: 4, Esencia: 4, Vinculos: 1 },
            { Nivel: 5, Fusiones: 4, Esencia: 5, Vinculos: 1 },
        ],
        Chakras: [
            { Id: 34, Nombre: 'Corona', Nombre_original: 'Crown', Traducido: true, Nivel: 2 },
            { Id: 35, Nombre: 'Pies', Nombre_original: 'Feet', Traducido: true, Nivel: 4 },
            { Id: 36, Nombre: 'Manos', Nombre_original: 'Hands', Traducido: true, Nivel: 4 },
            { Id: 37, Nombre: 'Brazos', Nombre_original: 'Arms', Traducido: true, Nivel: 9 },
        ],
        Capacidad: [{ Nivel: 3, Bonificador: 1, Chakra: null }, { Nivel: 15, Bonificador: 2, Chakra: null }],
        Fusiones: [
            { Id: 284, Nombre: 'Yelmo de cristal', Nombre_original: 'Crystal Helm', Traducido: true },
            { Id: 283, Nombre: 'Sandalias cerúleas', Nombre_original: 'Cerulean Sandals', Traducido: true },
        ],
        ...cambios,
    };
}

/** El bloque `incarnum` de la ficha de una encarnada azurín de nivel 5, con formación de partida. */
export function personajeIncarnumApi(cambios: Record<string, unknown> = {}): any {
    return {
        nivelPersonaje: 5,
        reserva: {
            total: 7,
            desglose: [
                { tipo: 'clase', origen: 'Encarnado', valor: 5 },
                { tipo: 'racial', origen: 'Esencia del azurín', valor: 1 },
                { tipo: 'dote', origen: 'Dureza azur', valor: 1 },
            ],
        },
        capacidad: { basica: 1, modificadores: [] },
        puedeMoldear: true,
        clases: [{
            id: 405, nombre: 'Encarnado', nivel: 5, nivelMoldeador: 5, fusionesTabla: 4, fusionesMaximas: 4,
            caracteristicaFusiones: 'Constitución', esencia: 5, vinculos: 1,
            chakrasAbiertos: [
                { id: 34, nombre: 'Corona', nombreOriginal: 'Crown', traducido: true, nivel: 2 },
                { id: 35, nombre: 'Pies', nombreOriginal: 'Feet', traducido: true, nivel: 4 },
                { id: 36, nombre: 'Manos', nombreOriginal: 'Hands', traducido: true, nivel: 4 },
            ],
            capacidadFusiones: 2, capacidadChakras: [], cd: { base: 12, caracteristica: 'Sabiduría', modificador: 2 },
            limitadoPorAlineamiento: true,
        }],
        chakrasDeDotes: [],
        fusionesDeDotes: [],
        receptaculos: [{ tipo: 'dote', id: 1087, nombre: 'Dureza azur', capacidad: 1, esencia: 1 }],
        formacion: {
            fusiones: [{
                fusion: { id: 284, nombre: 'Yelmo de cristal', nombreOriginal: 'Crystal Helm', traducido: true },
                clase: { id: 405, nombre: 'Encarnado' },
                chakra: { id: 34, nombre: 'Corona', nombreOriginal: 'Crown', traducido: true },
                vinculo: { id: 34, nombre: 'Corona', nombreOriginal: 'Crown', traducido: true },
                esencia: 2, capacidad: 2, nivelMoldeador: 5, cd: 14,
            }],
            esenciaInvertida: 3,
        },
        ...cambios,
    };
}
