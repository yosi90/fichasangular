import { PersonajeSimple } from "./simplificaciones/personaje-simple";

export interface Personaje extends PersonajeSimple {
    desgloseClases: {
        Nombre: string;
        Nivel: number;
    }[],
    Ataque_base: string;
    Ca: number;
    Armadura_natural: number;
    Ca_desvio: number;
    Ca_varios: number;
    Presa: number;
    Presa_varios: {
        Valor: number;
        Origen: string;
    }[]
    Iniciativa_varios: {
        Valor: number;
        Origen: string;
    }[]
    Tipo_criatura: string;
    Subtipos: {
        Nombre: string;
    }[]
    Fuerza: number;
    ModFuerza: number;
    Destreza: number;
    ModDestreza: number;
    Constitucion: number;
    ModConstitucion: number;
    Inteligencia: number;
    ModInteligencia: number;
    Sabiduria: number;
    ModSabiduria: number;
    Carisma: number;
    ModCarisma: number;
    NEP: number;
    Experiencia: number;
    Deidad: string;
    Alineamiento: string;
    Genero: string;
    Vida: number;
    Correr: number;
    Nadar: number;
    Volar: number;
    Trepar: number;
    Escalar: number;
    Oficial: boolean;
    Dados_golpe: number;
    Pgs_lic: number;
    Jugador: string;
    Edad: number;
    Altura: number;
    Peso: number;
    Rds: {
        Modificador: string;
        Origen: string;
    }[]
    Rcs: {
        Modificador: string;
        Origen: string;
    }[]
    Res: {
        Modificador: string;
        Origen: string;
    }[]
    Oro_inicial: number;
    Escuela_especialista: {
        Nombre: string;
        Calificativo: string;
    }
    Disciplina_especialista: {
        Nombre: string;
        Calificativo: string;
    }
    Disciplina_prohibida: string;
    Capacidad_carga: {
        Ligera: number;
        Media: number;
        Pesada: number;
    }
    Salvaciones: {
        fortaleza: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
        reflejos: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
        voluntad: {
            modsClaseos:{
                valor: number,
                origen: string
            }[],
            modsVarios:{
                valor: number,
                origen: string
            }[],
        }
    }
    Dominios: {
        Nombre: string;
    }[]
    Plantillas: {
        Id: number;
        Nombre: string;
        Ataques: string;
        Ataque_completo: string;
        Id_tamano: number;
        Tamano: string;
        Id_tamano_pasos: number;
        Tamano_pasos: string;
        Id_dados_golpe: number;
        Dados_golpe: string;
        Id_dados_golpe_pasos: number;
        Dados_golpe_pasos: string;
        Actualiza_dgs: boolean;
        Multiplicador_dgs_lic: number;
        Tipo_dgs_lic: string;
        Suma_dgs_lic: number;
        Correr: number;
        Nadar: number;
        Volar: number;
        Maniobrabilidad: string;
        Trepar: number;
        Escalar: number;
        Ataque_base: number;
        Ca: string;
        Reduccion_dano: string;
        Resistencia_conjuros: string;
        Resistencia_elemental: string;
        Velocidades: string;
        Iniciativa: number;
        Presa: number;
        Ajuste_nivel: number;
        Heredada: boolean;
    }[]
    Conjuros: {
        Nombre: string;
        Descripcion: string;
        Manual: string;
        Pagina: number;
        Oficial: boolean;
    }[]
    Claseas: {
        Nombre: string;
        Extra: string;
    }[]
    Raciales: {
        Nombre: string;
    }[]
    Habilidades: {
        Id: number;
        Nombre: string;
        Clasea: boolean;
        Car: string;
        Mod_car: number;
        Rangos: number;
        Rangos_varios: number;
        Extra: string;
        Varios: string;
        Custom: boolean;
    }[]
    Dotes: {
        Nombre: string;
        Descripcion: string;
        Beneficio: string;
        Pagina: number;
        Extra: string;
        Origen: string;
    }[]
    Ventajas: {
        Nombre: string;
    }[]
    Idiomas: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
    }[]
    Sortilegas: {
        Nombre: string;
        Descripcion: string;
        Manual: string;
        Pagina: number;
        Dgs_necesarios: number;
        Usos: string;
        Nivel_lanzador: string;
        Origen: string;
        Oficial: boolean;
    }[]
    Escuelas_prohibidas: {
        Nombre: string;
    }[]
}
