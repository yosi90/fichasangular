import { EquipoCuerpoComun, EquipoRef, TextoEquipo } from './equipo';
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
}

/** `POST /armaduras/add` y `PUT /armaduras/<id>` (el mismo cuerpo): `docs/publica/endpoints/catalogos.md`, «Armaduras». */
export interface ArmaduraCuerpo {
    armadura: EquipoCuerpoComun & {
        ca: number;
        /** `null`: sin límite de Destreza. */
        bon_des: number | null;
        penalizador: number;
        precio: number;
        id_material: number | null;
        es_escudo: boolean;
        /** Ligera, intermedia o pesada; `null` en los escudos. */
        id_peso_armadura: number | null;
        /** Broquel, ligero, pesado o pavés; `null` en las armaduras. */
        id_tipo_escudo: number | null;
        peso: number;
        id_tamano: number;
        fallo_arcano: number;
        velocidad_30: number | null;
        velocidad_20: number | null;
        correr_multiplicador: number | null;
        tiempo_poner: string | null;
        tiempo_poner_rapido: string | null;
        tiempo_quitar: string | null;
    };
}

export interface ArmaduraGuardada {
    message: string;
    idArmadura: number;
    armadura: ArmaduraDetalle;
}
