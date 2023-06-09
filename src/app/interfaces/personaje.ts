import { PersonajeSimple } from "./personaje-simple";

export interface Personaje extends PersonajeSimple {
    desgloseClases: {
        Nombre: string;
        Nivel: number;
    }[],
    Ataque_base: string;
    ModTamano: number;
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
    Ajuste_nivel: number;
    Nivel: number;
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
    Rd: string;
    Rc: string;
    Re: string;
    Tamano: {
        Id: number;
        Nombre: string;
        Modificador: number;
        Modificador_presa: number;
    }
    Capacidad_carga: {
        Ligera: number;
        Media: number;
        Pesada: number;
    }
    Salvaciones: {
        fortaleza: {
            modsClaseos:{
                valor: [],
                origen: []
            },
            modsVarios:{
                valor: [],
                origen: []
            }
        }
        reflejos: {
            modsClaseos:{
                valor: [],
                origen: []
            },
            modsVarios:{
                valor: [],
                origen: []
            }
        }
        voluntad: {
            modsClaseos:{
                valor: [],
                origen: []
            },
            modsVarios:{
                valor: [],
                origen: []
            }
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
    }[]
    Conjuros: {
        Nombre: string;
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
    }[]
}
