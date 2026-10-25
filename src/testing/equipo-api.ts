/*
 * Respuestas de la API del modelo de objetos (familia 1), recortadas de `rol_dev` (2026-10-25), para las specs.
 * Contrato: `docs/publica/endpoints/catalogos.md` («Equipo»).
 */

export function crearArmaApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 5,
        Nombre: 'Daga',
        Descripcion: 'Hoja corta de doble filo.',
        Origen_descripcion: 'propia',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 118 },
        Dano: '1d4',
        Dano_pequeno: '1d3',
        Dano_mediano: '1d4',
        Tipo_dano: { Id: 4, Nombre: 'Cortante o perforante' },
        Tipo_dano_comodin: null,
        Tipo_arma: { Id: 1, Nombre: 'Sencilla' },
        Manejo: { Id: 2, Nombre: 'Ligera' },
        A_distancia: false,
        Arrojadiza: true,
        Doble: false,
        Alcance: null,
        Municion: null,
        Precio: 2,
        Material: { Id: 1, Nombre: 'Hierro' },
        Tamano: { Id: 5, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Peso: 1,
        Critico: '19-20/x2',
        Critico_rango: 19,
        Critico_multiplicador: 2,
        Critico_multiplicador_2: null,
        Incremento_distancia: 10,
        Indice_fuerza_coste: null,
        Propiedades: [],
        Oficial: true,
        Encantamientos: [],
        Comodin: null,
        ...cambios,
    };
}

export function crearArmaduraApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 8,
        Nombre: 'Cota de mallas',
        Descripcion: 'Malla de anillas de metal entrelazadas.',
        Origen_descripcion: 'srd',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 123 },
        Ca: 5,
        Bon_des: 2,
        Penalizador: -5,
        Precio: 150,
        Material: { Id: 4, Nombre: 'Acero' },
        Peso_armadura: { Id: 2, Nombre: 'Intermedia' },
        Tipo_escudo: null,
        Peso: 40,
        Tamano: { Id: 5, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Fallo_arcano: 30,
        Es_escudo: false,
        Velocidad_30: 20,
        Velocidad_20: 15,
        Correr_multiplicador: 4,
        Tiempo_poner: null,
        Tiempo_poner_rapido: null,
        Tiempo_quitar: null,
        Oficial: true,
        Encantamientos: [],
        Comodin: null,
        ...cambios,
    };
}

/** La rodela (14), que sustituye al «Broquel» (13), borrado: un escudo sin límite de Destreza. */
export function crearRodelaApi(cambios: Record<string, any> = {}): Record<string, any> {
    return crearArmaduraApi({
        Id: 14,
        Nombre: 'Rodela',
        Descripcion: '',
        Origen_descripcion: 'propia',
        Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 124 },
        Ca: 1,
        Bon_des: null,
        Penalizador: -1,
        Precio: 15,
        Peso_armadura: null,
        Tipo_escudo: { Id: 1, Nombre: 'Broquel' },
        Peso: 5,
        Fallo_arcano: 5,
        Es_escudo: true,
        Velocidad_30: null,
        Velocidad_20: null,
        Correr_multiplicador: null,
        ...cambios,
    });
}

export function crearMunicionApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 1,
        Nombre: 'Flechas',
        Descripcion: 'Flechas comunes',
        Origen_descripcion: 'propia',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: null },
        Precio: 1,
        Cantidad_por_precio: 20,
        Peso: 3,
        Armas: [{ Id: 48, Nombre: 'Arco corto' }, { Id: 50, Nombre: 'Arco largo' }],
        Oficial: true,
        Comodin: null,
        ...cambios,
    };
}

export function crearMaterialApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 9,
        Nombre: 'Mithril',
        Descripcion: 'Metal plateado y ligero.',
        Origen_descripcion: 'srd',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 24, Nombre: 'Guia del dungeon master 1', Pagina: 284 },
        Dureza: 15,
        Pg_por_pulgada: 30,
        Cuenta_como_gran_calidad: true,
        Supera_rd: false,
        Efectos: {
            Peso_multiplicador: 0.5,
            Bon_des_mas: 2,
            Penalizador_menos: 3,
            Fallo_arcano_menos: 10,
            Categoria_mas_ligera: true,
            Dano_mod: null,
        },
        Costes: [
            { Aplicacion: { Id: 6, Nombre: 'Armadura ligera' }, Coste: 1000, Coste_por_libra: null, Multiplicador_precio: null, Coste_encantar: null },
            { Aplicacion: { Id: 9, Nombre: 'Escudo' }, Coste: 1000, Coste_por_libra: null, Multiplicador_precio: null, Coste_encantar: null },
        ],
        Oficial: true,
        Comodin: null,
        ...cambios,
    };
}

export function crearEncantamientoApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 1,
        Nombre: 'Afilada',
        Descripcion: 'Este encantamiento dobla el rango de amenaza de un arma.',
        Origen_descripcion: 'srd',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 24, Nombre: 'Guia del dungeon master 1', Pagina: 223 },
        Modificador: 1,
        Coste: 0,
        Aplica_a: { Arma_cuerpo_a_cuerpo: true, Arma_a_distancia: false, Municion: false, Armadura: false, Escudo: false },
        Tipos_dano_requeridos: [{ Id: 2, Nombre: 'Perforante' }, { Id: 3, Nombre: 'Cortante' }],
        Nivel_lanzador: 10,
        Aura: { Intensidad: { Id: 2, Nombre: 'Moderada' }, Escuelas: [{ Id: 8, Nombre: 'Transmutación' }] },
        Requisitos: {
            Dotes: [{ Id: 332, Nombre: 'Fabricar armas y armaduras mágicas' }],
            Conjuros: [{ Id: 1, Nombre: 'Afiladura', Opcional: 0 }],
        },
        Encantamiento_base: null,
        Es_plantilla: false,
        Danos: [],
        Modificadores: [],
        Oficial: true,
        Comodin: null,
        ...cambios,
    };
}

/** El genérico «Poción» (id 1): el conjuro va en la pieza del equipo del personaje. */
export function crearObjetoGenericoApi(cambios: Record<string, any> = {}): Record<string, any> {
    return crearObjetoApi({
        Id: 1,
        Nombre: 'Poción',
        Descripcion: 'Un frasco con un conjuro de nivel 3 o menos.',
        Tipo: { Id: 10, Nombre: 'Poción', Categoria: 'magico' },
        Precio: null,
        Generico_conjuro: { Precio_por_nivel: 50, Nivel_maximo: 3, Usos_componente_caro: 1 },
        ...cambios,
    });
}

export function crearObjetoApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 40,
        Nombre: 'Capa de resistencia +1',
        Descripcion: 'Una capa que protege a quien la lleva.',
        Origen_descripcion: 'propia',
        Nombre_original: 'Cloak of resistance +1',
        Traducido: false,
        Manual: { Id: 24, Nombre: 'Guia del dungeon master 1', Pagina: 253 },
        Tipo: { Id: 20, Nombre: 'Objeto maravilloso', Categoria: 'magico' },
        Precio: 1000,
        Nivel_objeto: null,
        Peso: 1,
        Ranura: { Id: 4, Nombre: 'Hombros' },
        Nivel_lanzador: 5,
        Aura: { Intensidad: { Id: 1, Nombre: 'Débil' }, Escuelas: [{ Id: 1, Nombre: 'Abjuración' }] },
        Activaciones: [{ Id: 1, Nombre: 'Uso o continuo', Accion: null }],
        Cargas: null,
        Usos_por_dia: null,
        Maldito: false,
        Inteligente: false,
        Reliquia: false,
        Requisitos_uso: null,
        Creacion: {
            Coste_po: 500,
            Coste_px: 40,
            Dias: 1,
            Requisitos: { Dotes: [{ Id: 300, Nombre: 'Crear objeto maravilloso' }], Conjuros: [{ Id: 2, Nombre: 'Resistencia' }] },
            Otros_requisitos: null,
        },
        Conjuros: [],
        Modificadores: [{
            Objetivo: { Id: 3, Nombre: 'Salvaciones' },
            Tipo_bonificador: { Id: 15, Nombre: 'Resistencia', Apila: false },
            Valor: 1,
            Caracteristica: null,
            Habilidad: null,
            Tipo_dano: null,
            Condicion: null,
        }],
        Conjunto: null,
        Monstruo: null,
        Generico_conjuro: null,
        Oficial: true,
        Comodin: null,
        ...cambios,
    };
}

export function crearConjuntoApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Id: 1,
        Nombre: 'Atavío del archimago',
        Descripcion: 'Las piezas de un conjunto de mago.',
        Origen_descripcion: 'propia',
        Nombre_original: null,
        Traducido: false,
        Manual: { Id: 70, Nombre: 'Compendio de objetos mágicos', Pagina: 196 },
        Piezas: [{ Id: 40, Nombre: 'Capa de resistencia +1' }],
        Bonificaciones: [{ Piezas: 2, Descripcion: '+1 a las pruebas de nivel de lanzador.' }],
        Oficial: true,
        Comodin: null,
        ...cambios,
    };
}

/** `GET /equipo/catalogos`, recortado a lo que usan la web y sus pruebas. */
export function crearEquipoCatalogosApi(cambios: Record<string, any> = {}): Record<string, any> {
    return {
        Manejos_armas: [{ Id: 1, Nombre: 'Sin armas' }, { Id: 2, Nombre: 'Ligera' }, { Id: 3, Nombre: 'A una mano' }, { Id: 4, Nombre: 'A dos manos' }],
        Propiedades_armas: [{ Id: 1, Nombre: 'Derribo', Descripcion: 'Sirve para derribar.' }],
        Tipos_dano: [{ Id: 1, Nombre: 'Contundente' }],
        Tipos_arma: [{ Id: 1, Nombre: 'Sencilla' }],
        Pesos_armadura: [{ Id: 1, Nombre: 'Ligera' }, { Id: 2, Nombre: 'Intermedia' }, { Id: 3, Nombre: 'Pesada' }],
        Tipos_escudo: [{ Id: 1, Nombre: 'Broquel' }],
        Tipos_objeto: [{ Id: 1, Nombre: 'Equipo de aventurero', Categoria: 'mundano' }, { Id: 10, Nombre: 'Poción', Categoria: 'magico' }],
        Ranuras: [{ Id: 1, Nombre: 'Cabeza', Maximo: 1 }, { Id: 9, Nombre: 'Anillo', Maximo: 2 }],
        Intensidades_aura: [{ Id: 1, Nombre: 'Débil' }],
        Tipos_activacion: [{ Id: 1, Nombre: 'Uso o continuo' }],
        Tipos_accion: [{ Id: 1, Nombre: 'Gratuita' }],
        Tipos_bonificador: [{ Id: 2, Nombre: 'Armadura', Apila: false }, { Id: 7, Nombre: 'Esquiva', Apila: true }],
        Objetivos_modificador: [{ Id: 1, Nombre: 'CA' }],
        Empunaduras: [{ Id: 1, Nombre: 'Mano principal' }, { Id: 2, Nombre: 'Mano torpe' }, { Id: 3, Nombre: 'Dos manos' }],
        Aplicaciones_material: [{ Id: 1, Nombre: 'Arma' }],
        Danos_por_tamano: [{ Dano_mediano: '1d4', Danos: [{ Id_tamano: 4, Tamano: 'Pequeño', Dano: '1d3' }, { Id_tamano: 5, Tamano: 'Mediano', Dano: '1d4' }] }],
        Riqueza_por_nivel: [{ Nivel: 1, Po: 0 }, { Nivel: 2, Po: 900 }, { Nivel: 3, Po: 2700 }],
        Oro_inicial_por_clase: [
            { Clase: { Id: 2, Nombre: 'Bárbaro' }, Dados: '4d4', Maximo: 160, Multiplicador: 10 },
            { Clase: { Id: 9, Nombre: 'Guerrero' }, Dados: '6d4', Maximo: 240, Multiplicador: 10 },
            { Clase: { Id: 8, Nombre: 'Monje' }, Dados: '5d4', Maximo: 20, Multiplicador: 1 },
        ],
        ...cambios,
    };
}
