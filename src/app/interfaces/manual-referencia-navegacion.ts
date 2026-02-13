export type ManualReferenciaTipo =
    | 'dote'
    | 'conjuro'
    | 'clase'
    | 'raza'
    | 'tipo'
    | 'plantilla'
    | 'monstruo'
    | 'subtipo';

export interface ManualReferenciaNavegacion {
    tipo: ManualReferenciaTipo;
    id: number;
    nombre: string;
    manualId: number;
}

