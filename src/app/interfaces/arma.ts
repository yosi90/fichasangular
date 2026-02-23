export interface ArmaTipoDanoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaTipoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaMaterialRef {
    Id: number;
    Nombre: string;
}

export interface ArmaEncantamientoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Modificador: number;
    Coste: number;
    Tipo: number;
}

export interface ArmaManualRef {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface ArmaTamanoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ArmaManualRef;
    Dano: string;
    Tipo_dano: ArmaTipoDanoRef;
    Tipo_arma: ArmaTipoRef;
    Precio: number;
    Material: ArmaMaterialRef;
    Tamano: ArmaTamanoRef;
    Peso: number;
    Critico: string;
    Incremento_distancia: number;
    Oficial: boolean;
    Encantamientos: ArmaEncantamientoRef[];
}
