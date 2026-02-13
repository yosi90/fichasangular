import { Injectable } from '@angular/core';
import { Personaje } from '../interfaces/personaje';
import { Raza } from '../interfaces/raza';

export type StepNuevoPersonaje = 'raza' | 'basicos' | 'plantillas';

type CaracteristicaKey = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';

export interface AsignacionCaracteristicas {
    Fuerza: number | null;
    Destreza: number | null;
    Constitucion: number | null;
    Inteligencia: number | null;
    Sabiduria: number | null;
    Carisma: number | null;
}

export interface GeneradorCaracteristicasState {
    minimoSeleccionado: number;
    indiceMinimo: number;
    tiradasCache: number[][];
    tablaSeleccionada: 1 | 2 | 3 | null;
    tablaFijada: boolean;
    asignaciones: AsignacionCaracteristicas;
    poolDisponible: number[];
}

export interface EstadoFlujoNuevoPersonaje {
    pasoActual: StepNuevoPersonaje;
    modalCaracteristicasAbierto: boolean;
    caracteristicasGeneradas: boolean;
    generador: GeneradorCaracteristicasState;
}

@Injectable({
    providedIn: 'root'
})
export class NuevoPersonajeService {
    private personajeCreacion: Personaje = this.crearPersonajeBase();
    private razaSeleccionada: Raza | null = null;
    private estadoFlujo: EstadoFlujoNuevoPersonaje = this.crearEstadoFlujoBase();

    get PersonajeCreacion(): Personaje {
        return this.personajeCreacion;
    }

    get RazaSeleccionada(): Raza | null {
        return this.razaSeleccionada;
    }

    get EstadoFlujo(): EstadoFlujoNuevoPersonaje {
        return this.estadoFlujo;
    }

    reiniciar(): void {
        this.personajeCreacion = this.crearPersonajeBase();
        this.razaSeleccionada = null;
        this.estadoFlujo = this.crearEstadoFlujoBase();
    }

    resetearCreacionNuevoPersonaje(): void {
        this.reiniciar();
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

        this.estadoFlujo.pasoActual = 'basicos';
        this.estadoFlujo.caracteristicasGeneradas = false;
        this.cerrarModalCaracteristicas();
        this.resetearGeneradorCaracteristicas();
    }

    abrirModalCaracteristicas(): void {
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        this.estadoFlujo.modalCaracteristicasAbierto = true;
    }

    cerrarModalCaracteristicas(): void {
        this.estadoFlujo.modalCaracteristicasAbierto = false;
    }

    actualizarPasoActual(paso: StepNuevoPersonaje): void {
        this.estadoFlujo.pasoActual = paso;
    }

    setMinimoGenerador(minimo: number): void {
        if (this.estadoFlujo.generador.tablaFijada) {
            return;
        }

        const index = this.getIndexByMinimo(minimo);
        this.estadoFlujo.generador.minimoSeleccionado = this.getMinimoByIndex(index);
        this.estadoFlujo.generador.indiceMinimo = index;
        this.asegurarTiradasPorIndice(index);
    }

    seleccionarTablaGenerador(tabla: 1 | 2 | 3): void {
        if (this.estadoFlujo.generador.tablaFijada) {
            return;
        }
        this.estadoFlujo.generador.tablaSeleccionada = tabla;
    }

    fijarTablaGenerador(): boolean {
        if (this.estadoFlujo.generador.tablaFijada || !this.estadoFlujo.generador.tablaSeleccionada) {
            return false;
        }

        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        const tablaElegida = this.getTiradasTabla(this.estadoFlujo.generador.tablaSeleccionada);
        this.estadoFlujo.generador.tablaFijada = true;
        this.estadoFlujo.generador.poolDisponible = tablaElegida.slice();
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();

        if (this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion) {
            this.estadoFlujo.generador.asignaciones.Constitucion = 0;
        }

        return true;
    }

    resetearGeneradorCaracteristicas(): void {
        const minimo = this.estadoFlujo.generador.minimoSeleccionado;
        const indice = this.getIndexByMinimo(minimo);
        this.estadoFlujo.generador.minimoSeleccionado = this.getMinimoByIndex(indice);
        this.estadoFlujo.generador.indiceMinimo = indice;
        this.estadoFlujo.generador.tablaSeleccionada = null;
        this.estadoFlujo.generador.tablaFijada = false;
        this.estadoFlujo.generador.poolDisponible = [];
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();
        if (this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion) {
            this.estadoFlujo.generador.asignaciones.Constitucion = 0;
        }
    }

    getTiradasTabla(tabla: 1 | 2 | 3): number[] {
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        const fila = this.estadoFlujo.generador.tiradasCache[this.estadoFlujo.generador.indiceMinimo];
        const inicio = tabla === 1 ? 0 : tabla === 2 ? 6 : 12;
        return fila.slice(inicio, inicio + 6);
    }

    asignarDesdePoolACaracteristica(caracteristica: CaracteristicaKey, indexPool: number): boolean {
        if (!this.estadoFlujo.generador.tablaFijada) {
            return false;
        }

        if (indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        if (this.estadoFlujo.generador.asignaciones[caracteristica] !== null) {
            return false;
        }

        if (caracteristica === 'Constitucion' && this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion) {
            return false;
        }

        const valor = this.estadoFlujo.generador.poolDisponible[indexPool];
        if (valor < 0) {
            return false;
        }

        this.estadoFlujo.generador.asignaciones[caracteristica] = valor;
        this.estadoFlujo.generador.poolDisponible[indexPool] = -1;
        return true;
    }

    puedeFinalizarGenerador(): boolean {
        const asigs = this.estadoFlujo.generador.asignaciones;
        if (!this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion && asigs.Constitucion === null) {
            return false;
        }

        return asigs.Fuerza !== null
            && asigs.Destreza !== null
            && asigs.Inteligencia !== null
            && asigs.Sabiduria !== null
            && asigs.Carisma !== null;
    }

    getAsignacionesGenerador(): AsignacionCaracteristicas {
        return {
            Fuerza: this.estadoFlujo.generador.asignaciones.Fuerza,
            Destreza: this.estadoFlujo.generador.asignaciones.Destreza,
            Constitucion: this.estadoFlujo.generador.asignaciones.Constitucion,
            Inteligencia: this.estadoFlujo.generador.asignaciones.Inteligencia,
            Sabiduria: this.estadoFlujo.generador.asignaciones.Sabiduria,
            Carisma: this.estadoFlujo.generador.asignaciones.Carisma,
        };
    }

    aplicarCaracteristicasGeneradas(asignaciones: AsignacionCaracteristicas): boolean {
        const pierdeConstitucion = this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion === true;
        const razaMods = this.personajeCreacion.Raza?.Modificadores;

        if (asignaciones.Fuerza === null
            || asignaciones.Destreza === null
            || asignaciones.Inteligencia === null
            || asignaciones.Sabiduria === null
            || asignaciones.Carisma === null
            || (!pierdeConstitucion && asignaciones.Constitucion === null)) {
            return false;
        }

        const baseFuerza = asignaciones.Fuerza;
        const baseDestreza = asignaciones.Destreza;
        const baseConstitucion = pierdeConstitucion ? 0 : (asignaciones.Constitucion ?? 0);
        const baseInteligencia = asignaciones.Inteligencia;
        const baseSabiduria = asignaciones.Sabiduria;
        const baseCarisma = asignaciones.Carisma;

        const finalFuerza = baseFuerza + this.toNumber(razaMods?.Fuerza);
        const finalDestreza = baseDestreza + this.toNumber(razaMods?.Destreza);
        const finalConstitucion = pierdeConstitucion ? 0 : baseConstitucion + this.toNumber(razaMods?.Constitucion);
        const finalInteligencia = baseInteligencia + this.toNumber(razaMods?.Inteligencia);
        const finalSabiduria = baseSabiduria + this.toNumber(razaMods?.Sabiduria);
        const finalCarisma = baseCarisma + this.toNumber(razaMods?.Carisma);

        this.personajeCreacion.Fuerza = finalFuerza;
        this.personajeCreacion.Destreza = finalDestreza;
        this.personajeCreacion.Constitucion = finalConstitucion;
        this.personajeCreacion.Inteligencia = finalInteligencia;
        this.personajeCreacion.Sabiduria = finalSabiduria;
        this.personajeCreacion.Carisma = finalCarisma;

        this.personajeCreacion.ModFuerza = this.calcularModificador(finalFuerza);
        this.personajeCreacion.ModDestreza = this.calcularModificador(finalDestreza);
        this.personajeCreacion.ModConstitucion = pierdeConstitucion ? 0 : this.calcularModificador(finalConstitucion);
        this.personajeCreacion.ModInteligencia = this.calcularModificador(finalInteligencia);
        this.personajeCreacion.ModSabiduria = this.calcularModificador(finalSabiduria);
        this.personajeCreacion.ModCarisma = this.calcularModificador(finalCarisma);

        this.estadoFlujo.caracteristicasGeneradas = true;
        this.estadoFlujo.modalCaracteristicasAbierto = false;
        this.estadoFlujo.pasoActual = 'plantillas';
        return true;
    }

    private crearEstadoFlujoBase(): EstadoFlujoNuevoPersonaje {
        return {
            pasoActual: 'raza',
            modalCaracteristicasAbierto: false,
            caracteristicasGeneradas: false,
            generador: {
                minimoSeleccionado: 13,
                indiceMinimo: 10,
                tiradasCache: this.crearTiradasCache(),
                tablaSeleccionada: null,
                tablaFijada: false,
                asignaciones: this.crearAsignacionesVacias(),
                poolDisponible: [],
            },
        };
    }

    private crearTiradasCache(): number[][] {
        return Array.from({ length: 11 }, () => Array.from({ length: 18 }, () => 0));
    }

    private crearAsignacionesVacias(): AsignacionCaracteristicas {
        return {
            Fuerza: null,
            Destreza: null,
            Constitucion: null,
            Inteligencia: null,
            Sabiduria: null,
            Carisma: null,
        };
    }

    private asegurarTiradasPorIndice(index: number): void {
        const seguro = Math.max(0, Math.min(10, index));
        const fila = this.estadoFlujo.generador.tiradasCache[seguro];
        if (fila[0] !== 0) {
            return;
        }

        const minimo = this.getMinimoByIndex(seguro);
        for (let i = 0; i < 18; i++) {
            fila[i] = this.randomInt(minimo, 18);
        }
    }

    private getMinimoByIndex(index: number): number {
        return Math.max(3, Math.min(13, 3 + index));
    }

    private getIndexByMinimo(minimo: number): number {
        const normalizado = Math.max(3, Math.min(13, minimo));
        return normalizado - 3;
    }

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private calcularModificador(valor: number): number {
        return Math.floor((valor - 10) / 2);
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
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
