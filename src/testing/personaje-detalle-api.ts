/**
 * Un `PersonajeDetalle` con la forma de la ficha nueva (desde el 2026-10-24), recortado de «Myra» (`rol_dev`, ficha 10):
 * listas de objetos, totales con su desglose y los rellenos a `null`.
 */
export function crearDetalleApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        i: 10,
        n: 'Myra',
        ownerUid: 'uid-10',
        ownerDisplayName: 'Dueña',
        visible_otros_usuarios: true,
        archivado: false,
        id_region: null,
        dcp: 'Seria',
        dh: 'Exploradora del bosque',
        a: '+8/+3',
        ca: 17,
        an: 2,
        cd: 0,
        cv: 0,
        ra: {
            Id: 30,
            Nombre: 'Centauro',
            Ajuste_nivel: 2,
            Tamano: { Id: 5, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4 },
            Dgs_adicionales: { Cantidad: 4 },
        },
        tc: { Id: 9, Nombre: 'Humanoide monstruoso' },
        f: 26, mf: 8, d: 18, md: 4, co: 18, mco: 4, int: 18, mint: 4, s: 18, ms: 4, car: 10, mcar: 0,
        de: null,
        ali: null,
        g: 'Hembra',
        ncam: null,
        ntr: null,
        nst: null,
        v: 80, cor: 50, na: 0, vo: 0, t: 0, e: 0,
        o: true,
        dg: 4,
        clases: [
            { id: 6, nombre: 'Explorador', nivel: 8, lanzaConjuros: true, caracteristicaLanzamiento: 'Sabiduría', modificadorLanzamiento: 4 },
        ],
        dominios: [],
        escuelasProhibidas: [],
        ventajas: [],
        subtipos: [],
        competencia_arma: [],
        competencia_armadura: [],
        competencia_grupo_arma: [],
        competencia_grupo_armadura: [],
        familiares: [],
        companeros: [],
        pla: [],
        con: [],
        especiales: [
            { id: 30, nombre: 'Empatía salvaje', idExtra: null, extra: null, extraComodin: null },
            { id: 38, nombre: 'Enemigo predilecto', idExtra: 40, extra: 'Primero', extraComodin: null },
        ],
        rac: [],
        habilidades: [
            {
                id: 6, nombre: 'Avistar', custom: false, deClase: true, idExtra: null, extra: null, extraComodin: null,
                caracteristica: 'Sabiduría', modificadorCaracteristica: 4, rangos: 14, rangosVarios: 0, varios: null, total: 18,
                desglose: [
                    { tipo: 'rangos', origen: 'Rangos', valor: 14 },
                    { tipo: 'caracteristica', origen: 'Sabiduría', valor: 4 },
                ],
            },
            {
                id: 3, nombre: 'Artesanía', custom: false, deClase: false, idExtra: 0, extra: 'Elegir', extraComodin: 'elegir',
                caracteristica: 'Inteligencia', modificadorCaracteristica: 4, rangos: 0, rangosVarios: 0, varios: null, total: 4,
                desglose: [{ tipo: 'caracteristica', origen: 'Inteligencia', valor: 4 }],
            },
        ],
        dotes: [],
        idi: [],
        sor: [],
        ju: 'Dueña',
        pgl: 0,
        iniciativa: {
            total: 8,
            desglose: [
                { tipo: 'caracteristica', origen: 'Destreza', valor: 4 },
                { tipo: 'varios', origen: 'Iniciativa mejorada', valor: 4 },
            ],
        },
        presa: {
            total: 20,
            desglose: [
                { tipo: 'ataqueBase', origen: 'Ataque base', valor: 8 },
                { tipo: 'caracteristica', origen: 'Fuerza', valor: 8 },
                { tipo: 'tamano', origen: 'Tamaño (Grande)', valor: 4 },
            ],
        },
        edad: 30, alt: 210, peso: 900,
        salvaciones: {
            fortaleza: {
                total: 11,
                desglose: [
                    { tipo: 'caracteristica', origen: 'Constitución', valor: 4 },
                    { tipo: 'clase', origen: 'Explorador', valor: 6 },
                    { tipo: 'varios', origen: 'Centauro', valor: 1 },
                ],
            },
            reflejos: {
                total: 14,
                desglose: [
                    { tipo: 'caracteristica', origen: 'Destreza', valor: 4 },
                    { tipo: 'clase', origen: null, valor: 6 },
                    { tipo: 'varios', origen: 'Centauro', valor: 4 },
                ],
            },
            voluntad: {
                total: 6,
                desglose: [
                    { tipo: 'caracteristica', origen: 'Sabiduría', valor: 4 },
                    { tipo: 'clase', origen: 'Explorador', valor: 2 },
                ],
            },
        },
        reduccionesDano: [],
        resistenciasConjuros: [],
        resistenciasElementales: [],
        ccl: 0, ccm: 0, ccp: 0,
        espa: 'Cualquiera',
        espaComodin: 'cualquiera',
        espan: null,
        espp: null,
        esppn: null,
        disp: null,
        progresionLanzador: { selecciones: [] },
        ...cambios,
    };
}
