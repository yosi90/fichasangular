import { EncantamientoDeCatalogoRef } from './arma';
import { EquipoRef, TextoEquipo } from './equipo';
import { ManualReferencia } from './manual';

/** `Tipo_armadura` ya no existe (en 3.5 no hay armaduras sencillas, marciales ni exóticas): `Peso_armadura` y `Tipo_escudo`. */
export interface ArmaduraDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    Manual: ManualReferencia;
    Ca: number;
    /** Destreza máxima; `null` sin límite (antes, -1 en los escudos). */
    Bon_des: number | null;
    Penalizador: number;
    Precio: number;
    Material: EquipoRef | null;
    /** Ligera, intermedia, pesada; `null` en los escudos. */
    Peso_armadura: EquipoRef | null;
    /** Broquel, ligero, pesado, pavés; `null` en las armaduras. */
    Tipo_escudo: EquipoRef | null;
    Peso: number;
    Tamano: EquipoRef;
    Fallo_arcano: number;
    Es_escudo: boolean;
    Velocidad_30: number | null;
    Velocidad_20: number | null;
    Correr_multiplicador: number | null;
    Tiempo_poner: string | null;
    Tiempo_poner_rapido: string | null;
    Tiempo_quitar: string | null;
    Oficial: boolean;
    Encantamientos: EncantamientoDeCatalogoRef[];
}
