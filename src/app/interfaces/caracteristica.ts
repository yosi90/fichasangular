/** Las seis características de D&D 3.5, con las claves que usan la API y la web («Constitucion», «Sabiduria»). */
export type Caracteristica = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';

/** Las seis, en el orden del manual (y de su `Id_caracteristica`, del 1 al 6). */
export const CARACTERISTICAS: readonly Caracteristica[] = [
    'Fuerza', 'Destreza', 'Constitucion', 'Inteligencia', 'Sabiduria', 'Carisma',
];
