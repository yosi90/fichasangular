import { PlantillaCosteAlAdquirir } from 'src/app/interfaces/plantilla';
import { toNumber } from './normalizacion';

/**
 * Lo que cuesta adquirir una plantilla o una raza mutada con el personaje ya creado (`Coste_al_adquirir`, la misma forma en
 * las dos, en la API y en la caché): sin dato (una caché anterior), nada.
 */
export function leerCosteAlAdquirir(raw: any): PlantillaCosteAlAdquirir {
    return {
        Px: Math.max(0, toNumber(raw?.Px)),
        Po: Math.max(0, toNumber(raw?.Po)),
        Niveles_perdidos: Math.max(0, toNumber(raw?.Niveles_perdidos)),
    };
}
