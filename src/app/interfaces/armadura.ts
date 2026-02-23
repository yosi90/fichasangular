export interface ArmaduraTipoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaduraPesoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaduraMaterialRef {
    Id: number;
    Nombre: string;
}

export interface ArmaduraEncantamientoRef {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Modificador: number;
    Coste: number;
    Tipo: number;
}

export interface ArmaduraManualRef {
    Id: number;
    Nombre: string;
    Pagina: number;
}

export interface ArmaduraTamanoRef {
    Id: number;
    Nombre: string;
}

export interface ArmaduraDetalle {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Manual: ArmaduraManualRef;
    Ca: number;
    Bon_des: number;
    Penalizador: number;
    Tipo_armadura: ArmaduraTipoRef;
    Precio: number;
    Material: ArmaduraMaterialRef;
    Peso_armadura: ArmaduraPesoRef;
    Peso: number;
    Tamano: ArmaduraTamanoRef;
    Fallo_arcano: number;
    Oficial: boolean;
    Encantamientos: ArmaduraEncantamientoRef[];
}
