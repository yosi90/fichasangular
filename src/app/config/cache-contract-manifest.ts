export type CacheEntityKey =
    | "lista_personajes"
    | "campanas_tramas_subtramas"
    | "personajes"
    | "razas"
    | "manuales"
    | "manuales_asociados"
    | "tipos_criatura"
    | "rasgos"
    | "conjuros"
    | "dotes"
    | "clases"
    | "especiales"
    | "raciales"
    | "escuelas_conjuros"
    | "disciplinas_conjuros"
    | "alineamientos"
    | "habilidades"
    | "habilidades_custom"
    | "idiomas"
    | "plantillas"
    | "ventajas_desventajas";

export interface CacheContractEntry {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
}

export const CACHE_CONTRACT_MANIFEST: CacheContractEntry[] = [
    { key: "lista_personajes", label: "Lista de personajes", schemaVersion: 1 },
    { key: "campanas_tramas_subtramas", label: "Campañas, tramas y subtramas", schemaVersion: 1 },
    { key: "personajes", label: "Personajes", schemaVersion: 1 },
    { key: "razas", label: "Razas", schemaVersion: 1 },
    { key: "manuales", label: "Manuales", schemaVersion: 1 },
    { key: "manuales_asociados", label: "Manuales asociados", schemaVersion: 1 },
    { key: "tipos_criatura", label: "Tipos de criatura", schemaVersion: 1 },
    { key: "rasgos", label: "Rasgos", schemaVersion: 1 },
    { key: "conjuros", label: "Conjuros", schemaVersion: 1 },
    { key: "dotes", label: "Dotes", schemaVersion: 1 },
    { key: "clases", label: "Clases", schemaVersion: 1 },
    { key: "especiales", label: "Especiales", schemaVersion: 1 },
    { key: "raciales", label: "Raciales", schemaVersion: 1 },
    { key: "escuelas_conjuros", label: "Escuelas de conjuros", schemaVersion: 1 },
    { key: "disciplinas_conjuros", label: "Disciplinas de conjuros", schemaVersion: 1 },
    { key: "alineamientos", label: "Alineamientos", schemaVersion: 1 },
    { key: "habilidades", label: "Habilidades", schemaVersion: 1 },
    { key: "habilidades_custom", label: "Habilidades custom", schemaVersion: 1 },
    { key: "idiomas", label: "Idiomas", schemaVersion: 1 },
    { key: "plantillas", label: "Plantillas", schemaVersion: 1 },
    { key: "ventajas_desventajas", label: "Ventajas y desventajas", schemaVersion: 1 },
];
