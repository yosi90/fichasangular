import { EquipoCuerpoComun, EquipoPropiedadArma, EquipoRef, TextoEquipo } from './equipo';
import { ManualReferencia } from './manual';

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
}

/** `POST /armas/add` y `PUT /armas/<id>` (el mismo cuerpo): `docs/publica/endpoints/catalogos.md`, «Armas». */
export interface ArmaCuerpo {
    arma: EquipoCuerpoComun & {
        id_tipo_dano: number;
        id_tipo_arma: number;
        id_manejo: number | null;
        a_distancia: boolean;
        arrojadiza: boolean;
        doble: boolean;
        alcance: number | null;
        id_municion: number | null;
        dano_pequeno: string | null;
        dano_mediano: string | null;
        critico_rango: number | null;
        critico_multiplicador: number | null;
        critico_multiplicador_2: number | null;
        precio: number;
        /** `null`: sin material especial. */
        id_material: number | null;
        id_tamano: number;
        peso: number;
        incremento_distancia: number;
        indice_fuerza_coste: number | null;
    };
    propiedades: { id_propiedad: number; valor: number | null; }[];
}
