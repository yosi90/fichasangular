import { EquipoPropiedadArma, EquipoRef, TextoEquipo } from './equipo';
import { ManualReferencia } from './manual';

/** Las aptitudes de un arma o armadura específica del catálogo (sin `Tipo`, retirado: ver `Aplica_a` en `/encantamientos`). */
export interface EncantamientoDeCatalogoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Modificador: number;
    Coste: number;
}

/** Derribo, desarmar (con su bonificador en `Valor`), apuntalar, arma especial de monje, sutileza… */
export interface ArmaPropiedad extends EquipoPropiedadArma {
    Valor: number | null;
}

export interface ArmaDetalle extends TextoEquipo {
    Id: number;
    Nombre: string;
    Manual: ManualReferencia;
    /** Compuesto por la API («1d8», «1d8/1d6»); `null` si no tiene un dado (rayo, mordisco, red). */
    Dano: string | null;
    Dano_pequeno: string | null;
    Dano_mediano: string | null;
    Tipo_dano: EquipoRef;
    Tipo_arma: EquipoRef | null;
    /** Sin armas, ligera, a una mano, a dos manos; `null` donde no aplica. */
    Manejo: EquipoRef | null;
    A_distancia: boolean;
    Arrojadiza: boolean;
    Doble: boolean;
    /** Pies de alcance (10; el látigo, 15). */
    Alcance: number | null;
    Municion: EquipoRef | null;
    Precio: number;
    Material: EquipoRef | null;
    Tamano: EquipoRef;
    Peso: number;
    /** Compuesto por la API, en minúscula («19-20/x2», «x3/x4»); `null` si no tiene crítico. */
    Critico: string | null;
    Critico_rango: number | null;
    Critico_multiplicador: number | null;
    Critico_multiplicador_2: number | null;
    Incremento_distancia: number;
    Indice_fuerza_coste: number | null;
    Propiedades: ArmaPropiedad[];
    Oficial: boolean;
    Encantamientos: EncantamientoDeCatalogoRef[];
}
