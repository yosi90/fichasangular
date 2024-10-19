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
    Alma: boolean;
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
        "Nombre": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Nivel_dominio: {
        "Id_dominio": number;
        "Nombre": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Nivel_disciplinas: {
        "Id_disciplina": number;
        "Nombre": string;
        "Nivel": number;
        "Espontaneo": boolean;
    }[];
    Componentes: Clave_valor[];
    Oficial: boolean;
}
