// TODO Obtener los extras de las habilidades cláseas
// TODO Obtener los extras de las habilidades
// TODO Obtener los extras de las dotes

export interface DetallesPersonaje {
    Id: number;
    Nombre: string;
    Raza: string;
    Clases: {
        Nombre: string;
        Nivel: number;
    }[];
    Personalidad: string;
    Contexto: string;
    Campana: string;
    Trama: string;
    Subtrama: string;
    Ataque_base: string;
    Tamano: string;
    ModTamano: number;
    Ca: number;
    Armadura_natural: number;
    Ca_desvio: number;
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
    Dominios: {
        Nombre: string;
    }[]
    Plantillas: {
        Nombre: string;
    }[]
    Conjuros: {
        Nombre: string;
    }[]
    Claseas: {
        Nombre: string;
    }[]
    Raciales: {
        Nombre: string;
    }[]
    Habilidades: {
        Nombre: string;
        Rangos: number;
    }[]
    Dotes: {
        Nombre: string;
    }[]
    Ventajas: {
        Nombre: string;
    }[]
    Idiomas: {
        Nombre: string;
    }[]
    Sortilegas: {
        Nombre: string;
    }[]
}