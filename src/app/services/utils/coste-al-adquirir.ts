import { CosteAlAdquirir, PlantillaCosteAlAdquirir } from 'src/app/interfaces/plantilla';
import { toInt, toNumber } from './normalizacion';

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

/** Como mucho, los niveles que una plantilla hace perder antes de adquirirla (la API, `MAXIMO_NIVELES_PERDIDOS`). */
const MAXIMO_NIVELES_PERDIDOS = 20;

/**
 * El `coste_al_adquirir` del alta y la edición de una raza mutada, desde el formulario: los PX enteros desde 0 y las po
 * desde 0 con dos decimales como mucho, como las guarda la API (`numeric(12, 2)`, `utils/coste_al_adquirir.py`).
 */
export function costeAlAdquirirParaGuardar(px: unknown, po: unknown): { px: number; po: number; } {
    return {
        px: Math.max(0, toInt(px)),
        po: Math.round(Math.max(0, toNumber(po)) * 100) / 100,
    };
}

/** El de una plantilla: el de la raza mutada y los niveles que pierde antes (de 0 a 20). */
export function costeAlAdquirirPlantillaParaGuardar(px: unknown, po: unknown, niveles: unknown)
    : { px: number; po: number; niveles_perdidos: number; } {
    return { ...costeAlAdquirirParaGuardar(px, po), niveles_perdidos: Math.min(MAXIMO_NIVELES_PERDIDOS, Math.max(0, toInt(niveles))) };
}
