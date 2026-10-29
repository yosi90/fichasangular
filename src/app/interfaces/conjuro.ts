import { DisciplinaConjuros } from "./disciplina-conjuros";
import { EscuelaConjuros } from "./escuela-conjuros";
import { Clave_valor, Id_nombre } from "./genericas";

export interface Conjuro {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Tiempo_lanzamiento: string;
    Alcance: string;
    Escuela: EscuelaConjuros;
    Disciplina: DisciplinaConjuros;
    Manual: string;
    Objetivo: string;
    Efecto: string;
    Area: string;
    Arcano: boolean;
    Divino: boolean;
    Psionico: boolean;
    Duracion: string;
    Tipo_salvacion: string;
    Resistencia_conjuros: boolean;
    Resistencia_poderes: boolean;
    Descripcion_componentes: string;
    Permanente: boolean;
    Puntos_poder: number;
    Descripcion_aumentos: string;
    Descriptores: Id_nombre[];
    Nivel_clase: {
        "Id_clase": number;
        "Clase": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Nivel_dominio: {
        "Id_dominio": number;
        "Dominio": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Nivel_disciplinas: {
        "Id_disciplina": number;
        "Disciplina": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Componentes: {
        Componente: string;
        Id_componente: number;
    }[];
    /** Po del componente material caro (`null` si no tiene): lo suma el pergamino del que se copia al libro. */
    Coste_material?: number | null;
    /** PX que cuesta lanzarlo (`null` si no cuesta): el pergamino suma 5 po por PX. */
    Coste_px?: number | null;
    Oficial: boolean;
}
