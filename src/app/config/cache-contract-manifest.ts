export type CacheEntityKey =
    | "monstruos"
    | "familiares"
    | "companeros"
    | "razas"
    | "manuales"
    | "manuales_asociados"
    | "tipos_criatura"
    | "subtipos"
    | "rasgos"
    | "conjuros"
    | "extras"
    | "dotes"
    | "clases"
    | "especiales"
    | "escuelas_conjuros"
    | "disciplinas_conjuros"
    | "subdisciplinas_conjuros"
    | "alineamientos"
    | "alineamientos_basicos"
    | "alineamientos_combinaciones"
    | "alineamientos_prioridades"
    | "alineamientos_preferencia_ley"
    | "alineamientos_preferencia_moral"
    | "actitudes"
    | "maniobrabilidades"
    | "tipos_dado"
    | "componentes_conjuros"
    | "tiempos_lanzamiento"
    | "alcances_conjuros"
    | "descriptores_conjuros"
    | "habilidades"
    | "habilidades_custom"
    | "idiomas"
    | "enemigos_predilectos"
    | "tamanos"
    | "armas"
    | "armaduras"
    | "equipo_catalogos"
    | "materiales"
    | "municiones"
    | "encantamientos"
    | "conjuntos_objetos"
    | "grupos_armas"
    | "grupos_armaduras"
    | "dominios"
    | "regiones"
    | "ambitos"
    | "pabellones"
    | "deidades"
    | "plantillas"
    | "ventajas_desventajas"
    | "fusiones"
    | "chakras";

export interface CacheContractEntry {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
}

export const CACHE_CONTRACT_MANIFEST: CacheContractEntry[] = [
    { key: "monstruos", label: "Monstruos", schemaVersion: 11 },
    { key: "familiares", label: "Familiares", schemaVersion: 10 },
    { key: "companeros", label: "Compañeros animales", schemaVersion: 10 },
    // 27 desde la `Progresion` de cada racial (lo que crece con los DG o llega por nivel, 2026-11-12) y 28 desde sus
    // `Bonificadores_condicionales` (el +1 al ataque contra orcos, la esquiva contra gigantes; 2026-11-12); 29 desde
    // `Cd_dg_totales` de cada racial y `Elige_opcional` en su `Progresion` (rama `mutadas/creacion-resto`, 2026-11-12).
    // `Bonificadores_condicionales` (el +1 al ataque contra orcos, la esquiva contra gigantes; 2026-11-12); 30 desde su
    // `Condicion` `null` si cuentan siempre y el `Apila` de su tipo (la esquiva del svirfneblin; 2026-11-12); 31 con
    // `Cuenta_toque` y `Cuenta_desprevenido` de su tipo y su `Caracteristica` y `Cantidad_del_valor` (los sigilos de poder).
    { key: "razas", label: "Razas", schemaVersion: 31 },
    { key: "manuales", label: "Manuales", schemaVersion: 1 },
    { key: "manuales_asociados", label: "Manuales asociados", schemaVersion: 2 },
    { key: "tipos_criatura", label: "Tipos de criatura", schemaVersion: 3 },
    { key: "subtipos", label: "Subtipos", schemaVersion: 1 },
    { key: "rasgos", label: "Rasgos", schemaVersion: 1 },
    { key: "conjuros", label: "Conjuros", schemaVersion: 6 },
    { key: "extras", label: "Extras", schemaVersion: 1 },
    { key: "dotes", label: "Dotes", schemaVersion: 13 },
    { key: "clases", label: "Clases", schemaVersion: 19 },
    { key: "especiales", label: "Especiales", schemaVersion: 9 },
    { key: "escuelas_conjuros", label: "Escuelas de conjuros", schemaVersion: 1 },
    { key: "disciplinas_conjuros", label: "Disciplinas de conjuros", schemaVersion: 1 },
    { key: "subdisciplinas_conjuros", label: "Subdisciplinas de conjuros", schemaVersion: 1 },
    { key: "alineamientos", label: "Alineamientos", schemaVersion: 1 },
    { key: "alineamientos_basicos", label: "Alineamientos básicos", schemaVersion: 3 },
    { key: "alineamientos_combinaciones", label: "Combinaciones de alineamiento", schemaVersion: 1 },
    { key: "alineamientos_prioridades", label: "Prioridades de alineamiento", schemaVersion: 1 },
    { key: "alineamientos_preferencia_ley", label: "Preferencia legal de alineamiento", schemaVersion: 1 },
    { key: "alineamientos_preferencia_moral", label: "Preferencia moral de alineamiento", schemaVersion: 1 },
    { key: "actitudes", label: "Actitudes", schemaVersion: 1 },
    { key: "maniobrabilidades", label: "Maniobrabilidades", schemaVersion: 1 },
    { key: "tipos_dado", label: "Tipos de dado", schemaVersion: 1 },
    { key: "componentes_conjuros", label: "Componentes de conjuros", schemaVersion: 1 },
    { key: "tiempos_lanzamiento", label: "Tiempos de lanzamiento", schemaVersion: 2 },
    { key: "alcances_conjuros", label: "Alcances de conjuros", schemaVersion: 1 },
    { key: "descriptores_conjuros", label: "Descriptores de conjuros", schemaVersion: 1 },
    { key: "habilidades", label: "Habilidades", schemaVersion: 4 },
    { key: "habilidades_custom", label: "Habilidades custom", schemaVersion: 3 },
    { key: "idiomas", label: "Idiomas", schemaVersion: 1 },
    { key: "enemigos_predilectos", label: "Enemigos predilectos", schemaVersion: 1 },
    { key: "tamanos", label: "Tamaños", schemaVersion: 3 },
    { key: "armas", label: "Armas", schemaVersion: 3 },
    { key: "armaduras", label: "Armaduras", schemaVersion: 5 },
    // 5 desde `De_siempre_en_el_rasgo` en cada objetivo (2026-11-12).
    { key: "equipo_catalogos", label: "Catálogos del equipo", schemaVersion: 6 },
    { key: "materiales", label: "Materiales", schemaVersion: 1 },
    { key: "municiones", label: "Munición", schemaVersion: 1 },
    { key: "encantamientos", label: "Aptitudes especiales de armas y armaduras", schemaVersion: 1 },
    { key: "conjuntos_objetos", label: "Conjuntos de objetos", schemaVersion: 1 },
    { key: "grupos_armas", label: "Grupos de armas", schemaVersion: 2 },
    { key: "grupos_armaduras", label: "Grupos de armaduras", schemaVersion: 1 },
    { key: "dominios", label: "Dominios", schemaVersion: 1 },
    { key: "regiones", label: "Regiones", schemaVersion: 1 },
    { key: "ambitos", label: "Ambitos", schemaVersion: 1 },
    { key: "pabellones", label: "Pabellones", schemaVersion: 1 },
    { key: "deidades", label: "Deidades", schemaVersion: 3 },
    { key: "plantillas", label: "Plantillas", schemaVersion: 17 },
    { key: "ventajas_desventajas", label: "Ventajas y desventajas", schemaVersion: 1 },
    // Magic of Incarnum (docs/publica/INCARNUM.md, «Cachés de la RTDB»): las dos cachés nuevas.
    { key: "fusiones", label: "Fusiones del incarnum", schemaVersion: 1 },
    // Versión 2 (hito 8 del roadmap de inserciones, 2026-11-05): `Oficial`.
    { key: "chakras", label: "Chakras del incarnum", schemaVersion: 2 },
];
