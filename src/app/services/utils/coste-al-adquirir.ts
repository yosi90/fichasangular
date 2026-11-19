import { CosteAlAdquirir, PlantillaCosteAlAdquirir } from 'src/app/interfaces/plantilla';
import { toNumber } from './normalizacion';

/**
 * Lo que cuesta adquirir una raza mutada con el personaje ya creado (`Coste_al_adquirir`, `{ Px, Po }`, en la API y en la
 * caché): sin dato (una caché anterior), nada.
 */
export function leerCosteAlAdquirir(raw: any): CosteAlAdquirir {
    return {
        Px: Math.max(0, toNumber(raw?.Px)),
        Po: Math.max(0, toNumber(raw?.Po)),
    };
}

/** El de una plantilla: el de la raza mutada y los niveles que pierde antes (`Niveles_perdidos`). */
export function leerCosteAlAdquirirPlantilla(raw: any): PlantillaCosteAlAdquirir {
    return { ...leerCosteAlAdquirir(raw), Niveles_perdidos: Math.max(0, toNumber(raw?.Niveles_perdidos)) };
}
