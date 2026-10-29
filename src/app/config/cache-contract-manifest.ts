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
    { key: "monstruos", label: "Monstruos", schemaVersion: 7 },
    { key: "familiares", label: "Familiares", schemaVersion: 7 },
    { key: "companeros", label: "Compañeros animales", schemaVersion: 7 },
    { key: "razas", label: "Razas", schemaVersion: 13 },
    { key: "manuales", label: "Manuales", schemaVersion: 1 },
    { key: "manuales_asociados", label: "Manuales asociados", schemaVersion: 2 },
    { key: "tipos_criatura", label: "Tipos de criatura", schemaVersion: 3 },
    { key: "subtipos", label: "Subtipos", schemaVersion: 1 },
    { key: "rasgos", label: "Rasgos", schemaVersion: 1 },
    { key: "conjuros", label: "Conjuros", schemaVersion: 5 },
    { key: "extras", label: "Extras", schemaVersion: 1 },
    { key: "dotes", label: "Dotes", schemaVersion: 10 },
    { key: "clases", label: "Clases", schemaVersion: 11 },
    { key: "especiales", label: "Especiales", schemaVersion: 5 },
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
    { key: "tiempos_lanzamiento", label: "Tiempos de lanzamiento", schemaVersion: 1 },
    { key: "alcances_conjuros", label: "Alcances de conjuros", schemaVersion: 1 },
    { key: "descriptores_conjuros", label: "Descriptores de conjuros", schemaVersion: 1 },
    { key: "habilidades", label: "Habilidades", schemaVersion: 1 },
    { key: "habilidades_custom", label: "Habilidades custom", schemaVersion: 1 },
    { key: "idiomas", label: "Idiomas", schemaVersion: 1 },
    { key: "enemigos_predilectos", label: "Enemigos predilectos", schemaVersion: 1 },
    { key: "tamanos", label: "Tamaños", schemaVersion: 1 },
    { key: "armas", label: "Armas", schemaVersion: 3 },
    { key: "armaduras", label: "Armaduras", schemaVersion: 5 },
    { key: "equipo_catalogos", label: "Catálogos del equipo", schemaVersion: 2 },
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
    { key: "plantillas", label: "Plantillas", schemaVersion: 10 },
    { key: "ventajas_desventajas", label: "Ventajas y desventajas", schemaVersion: 1 },
    // Magic of Incarnum (docs/publica/INCARNUM.md, «Cachés de la RTDB»): las dos cachés nuevas.
    { key: "fusiones", label: "Fusiones del incarnum", schemaVersion: 1 },
    { key: "chakras", label: "Chakras del incarnum", schemaVersion: 1 },
];
