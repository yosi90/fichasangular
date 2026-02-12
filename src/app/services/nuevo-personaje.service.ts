import { Injectable } from '@angular/core';
import { Personaje } from '../interfaces/personaje';
import { Raza } from '../interfaces/raza';

@Injectable({
    providedIn: 'root'
})
export class NuevoPersonajeService {
    private personajeCreacion: Personaje = this.crearPersonajeBase();
    private razaSeleccionada: Raza | null = null;

    get PersonajeCreacion(): Personaje {
        return this.personajeCreacion;
    }

    get RazaSeleccionada(): Raza | null {
        return this.razaSeleccionada;
    }

    reiniciar(): void {
        this.personajeCreacion = this.crearPersonajeBase();
        this.razaSeleccionada = null;
    }

    seleccionarRaza(raza: Raza): void {
        this.razaSeleccionada = raza;
        this.personajeCreacion.Raza = raza;
        this.personajeCreacion.Tipo_criatura = raza.Tipo_criatura;
        this.personajeCreacion.Correr = raza.Correr ?? 0;
        this.personajeCreacion.Nadar = raza.Nadar ?? 0;
        this.personajeCreacion.Volar = raza.Volar ?? 0;
        this.personajeCreacion.Trepar = raza.Trepar ?? 0;
        this.personajeCreacion.Escalar = raza.Escalar ?? 0;
        this.personajeCreacion.Edad = raza.Edad_adulto ?? 0;
        this.personajeCreacion.Altura = raza.Altura_rango_inf ?? 0;
        this.personajeCreacion.Peso = raza.Peso_rango_inf ?? 0;

        const alineamientoBase = raza.Alineamiento?.Basico?.Nombre;
        if (alineamientoBase && alineamientoBase.trim().length > 0) {
            this.personajeCreacion.Alineamiento = alineamientoBase;
        }
    }

    private crearPersonajeBase(): Personaje {
        return {
            Id: 0,
            Nombre: '',
            Raza: {
                Id: 0,
                Nombre: '',
                Ajuste_nivel: 0,
                Tamano: {
                    Id: 0,
                    Nombre: '-',
                    Modificador: 0,
                    Modificador_presa: 0,
                },
                Dgs_adicionales: {
                    Cantidad: 0,
                    Dado: '',
                    Tipo_criatura: '',
                },
                Manual: '',
                Clase_predilecta: '',
                Modificadores: {
                    Fuerza: 0,
                    Destreza: 0,
                    Constitucion: 0,
                    Inteligencia: 0,
                    Sabiduria: 0,
                    Carisma: 0,
                },
                Oficial: true,
            },
            Clases: '',
            desgloseClases: [],
            Personalidad: '',
            Contexto: '',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
            Ataque_base: '0',
            Ca: 10,
            Armadura_natural: 0,
            Ca_desvio: 0,
            Ca_varios: 0,
            Presa: 0,
            Presa_varios: [],
            Iniciativa_varios: [],
            Tipo_criatura: {
                Id: 0,
                Nombre: '-',
                Descripcion: '',
                Manual: '',
                Id_tipo_dado: 0,
                Tipo_dado: 0,
                Id_ataque: 0,
                Id_fortaleza: 0,
                Id_reflejos: 0,
                Id_voluntad: 0,
                Id_puntos_habilidad: 0,
                Come: true,
                Respira: true,
                Duerme: true,
                Recibe_criticos: true,
                Puede_ser_flanqueado: true,
                Pierde_constitucion: false,
                Limite_inteligencia: 0,
                Tesoro: '',
                Id_alineamiento: 0,
                Rasgos: [],
                Oficial: false,
            },
            Subtipos: [],
            Fuerza: 10,
            ModFuerza: 0,
            Destreza: 10,
            ModDestreza: 0,
            Constitucion: 10,
            ModConstitucion: 0,
            Inteligencia: 10,
            ModInteligencia: 0,
            Sabiduria: 10,
            ModSabiduria: 0,
            Carisma: 10,
            ModCarisma: 0,
            NEP: 0,
            Experiencia: 0,
            Deidad: 'No tener deidad',
            Alineamiento: 'Neutral autentico',
            Genero: 'Sin genero',
            Vida: 0,
            Correr: 0,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Oficial: true,
            Dados_golpe: 0,
            Pgs_lic: 0,
            Jugador: '',
            Edad: 0,
            Altura: 0,
            Peso: 0,
            Rds: [],
            Rcs: [],
            Res: [],
            Oro_inicial: 0,
            Escuela_especialista: {
                Nombre: 'Cualquiera',
                Calificativo: 'Cualquiera',
            },
            Disciplina_especialista: {
                Nombre: 'Ninguna',
                Calificativo: 'Ninguna',
            },
            Disciplina_prohibida: 'Ninguna',
            Capacidad_carga: {
                Ligera: 0,
                Media: 0,
                Pesada: 0,
            },
            Salvaciones: {
                fortaleza: {
                    modsClaseos: [],
                    modsVarios: [],
                },
                reflejos: {
                    modsClaseos: [],
                    modsVarios: [],
                },
                voluntad: {
                    modsClaseos: [],
                    modsVarios: [],
                },
            },
            Dominios: [],
            Plantillas: [],
            Conjuros: [],
            Claseas: [],
            Raciales: [],
            Habilidades: [],
            Dotes: [],
            DotesContextuales: [],
            Ventajas: [],
            Idiomas: [],
            Sortilegas: [],
            Escuelas_prohibidas: [],
        };
    }
}
