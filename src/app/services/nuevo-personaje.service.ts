import { Injectable } from '@angular/core';
import { HabilidadBasicaDetalle, HabilidadBonoVario } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { Personaje } from '../interfaces/personaje';
import { Plantilla } from '../interfaces/plantilla';
import { Raza } from '../interfaces/raza';
import { VentajaDetalle } from '../interfaces/ventaja';
import { simularEstadoPlantillas } from './utils/plantilla-elegibilidad';

export type StepNuevoPersonaje = 'raza' | 'basicos' | 'plantillas' | 'ventajas';

type CaracteristicaKey = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';
type SalvacionKey = 'fortaleza' | 'reflejos' | 'voluntad';

const MIN_TIRADA = 3;
const MAX_TIRADA = 13;
const DEFAULT_TIRADA = 13;
const MIN_TABLAS = 1;
const MAX_TABLAS = 5;
const DEFAULT_TABLAS = 3;
const TIRADAS_POR_TABLA = 6;
const FILAS_TIRADAS = MAX_TIRADA - MIN_TIRADA + 1;
const GENERADOR_CONFIG_STORAGE_KEY = 'fichas35.nuevoPersonaje.generador.config.v1';
const MAX_VENTAJAS_SELECCIONABLES = 3;

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
    tablasPermitidas: number;
    tablaSeleccionada: number | null;
    asignaciones: AsignacionCaracteristicas;
    origenesAsignacion: Record<CaracteristicaKey, number | null>;
    poolDisponible: number[];
}

export interface SeleccionVentajaState {
    id: number;
    idioma: IdiomaDetalle | null;
}

export interface PendienteOroState {
    tipo: 'Duplica_oro' | 'Aumenta_oro';
    origen: string;
}

export interface VentajasFlujoState {
    catalogoVentajas: VentajaDetalle[];
    catalogoDesventajas: VentajaDetalle[];
    catalogoHabilidades: HabilidadBasicaDetalle[];
    catalogoHabilidadesCustom: HabilidadBasicaDetalle[];
    catalogoIdiomas: IdiomaDetalle[];
    seleccionVentajas: SeleccionVentajaState[];
    seleccionDesventajas: SeleccionVentajaState[];
    puntosDisponibles: number;
    puntosGastados: number;
    puntosRestantes: number;
    hayDeficit: boolean;
    pendientesOro: PendienteOroState[];
    bonosHabilidades: Record<number, HabilidadBonoVario[]>;
    baseCaracteristicas: Record<CaracteristicaKey, number> | null;
    baseRaciales: {
        Nombre: string;
    }[];
    baseIdiomas: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
    }[];
}

export interface ToggleVentajaResult {
    toggled: boolean;
    selected: boolean;
    requiresIdiomaSelection: boolean;
    reason?: 'not_found' | 'max_reached';
}

export interface EstadoFlujoNuevoPersonaje {
    pasoActual: StepNuevoPersonaje;
    modalCaracteristicasAbierto: boolean;
    caracteristicasGeneradas: boolean;
    generador: GeneradorCaracteristicasState;
    plantillas: PlantillasFlujoState;
    ventajas: VentajasFlujoState;
}

export interface PlantillasFlujoState {
    disponibles: Plantilla[];
    seleccionadas: Plantilla[];
    tipoCriaturaSimulada: {
        Id: number;
        Nombre: string;
    };
    licantropiaActiva: boolean;
    heredadaActiva: boolean;
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
        const catalogoHabilidades = this.estadoFlujo.ventajas.catalogoHabilidades.slice();
        const catalogoHabilidadesCustom = this.estadoFlujo.ventajas.catalogoHabilidadesCustom.slice();
        const catalogoIdiomas = this.estadoFlujo.ventajas.catalogoIdiomas.slice();
        const catalogoVentajas = this.estadoFlujo.ventajas.catalogoVentajas.slice();
        const catalogoDesventajas = this.estadoFlujo.ventajas.catalogoDesventajas.slice();

        this.personajeCreacion = this.crearPersonajeBase();
        this.razaSeleccionada = null;
        this.estadoFlujo = this.crearEstadoFlujoBase();

        this.setCatalogoHabilidades(catalogoHabilidades);
        this.setCatalogoHabilidadesCustom(catalogoHabilidadesCustom);
        this.setCatalogoIdiomas(catalogoIdiomas);
        this.setCatalogosVentajas(catalogoVentajas, catalogoDesventajas);
        this.sincronizarBaseVentajasDesdePersonaje();
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
        this.estadoFlujo.plantillas = this.crearPlantillasFlujoBase();
        this.estadoFlujo.plantillas.tipoCriaturaSimulada = {
            Id: this.toNumber(raza.Tipo_criatura?.Id),
            Nombre: `${raza.Tipo_criatura?.Nombre ?? '-'}`,
        };
        this.estadoFlujo.plantillas.heredadaActiva = !!raza.Heredada;
        this.personajeCreacion.Plantillas = [];
        this.limpiarVentajasDesventajas();
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();
        this.inicializarHabilidadesBase(true);
    }

    setPlantillasDisponibles(plantillas: Plantilla[]): void {
        this.estadoFlujo.plantillas.disponibles = [...plantillas];
        this.recalcularSimulacionPlantillas();
    }

    agregarPlantillaSeleccion(plantilla: Plantilla): boolean {
        if (this.estadoFlujo.plantillas.seleccionadas.some(p => p.Id === plantilla.Id))
            return false;

        this.estadoFlujo.plantillas.seleccionadas.push(plantilla);
        this.recalcularSimulacionPlantillas();
        return true;
    }

    quitarPlantillaSeleccion(idPlantilla: number): void {
        this.estadoFlujo.plantillas.seleccionadas = this.estadoFlujo.plantillas.seleccionadas
            .filter(p => p.Id !== idPlantilla);
        this.recalcularSimulacionPlantillas();
    }

    limpiarPlantillasSeleccion(): void {
        this.estadoFlujo.plantillas.seleccionadas = [];
        this.recalcularSimulacionPlantillas();
    }

    recalcularSimulacionPlantillas(): void {
        const baseTipo = this.personajeCreacion.Tipo_criatura;
        const simulacion = simularEstadoPlantillas(baseTipo, this.estadoFlujo.plantillas.seleccionadas);

        this.estadoFlujo.plantillas.tipoCriaturaSimulada = {
            Id: simulacion.tipoCriaturaActualId,
            Nombre: simulacion.tipoCriaturaActualNombre,
        };
        this.estadoFlujo.plantillas.licantropiaActiva = simulacion.licantropiaActiva;
        this.estadoFlujo.plantillas.heredadaActiva = simulacion.heredadaActiva || !!this.razaSeleccionada?.Heredada;
        this.personajeCreacion.Plantillas = this.estadoFlujo.plantillas.seleccionadas
            .map(plantilla => this.mapPlantillaParaPersonaje(plantilla));
    }

    setCatalogosVentajas(ventajas: VentajaDetalle[], desventajas: VentajaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoVentajas = [...ventajas];
        this.estadoFlujo.ventajas.catalogoDesventajas = [...desventajas];
        this.sanitizarSeleccionesVentajas();
        this.recalcularEfectosVentajas();
    }

    setCatalogoHabilidades(habilidades: HabilidadBasicaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoHabilidades = [...habilidades];
        this.inicializarHabilidadesBase(true);
        this.recalcularEfectosVentajas();
    }

    setCatalogoHabilidadesCustom(habilidades: HabilidadBasicaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoHabilidadesCustom = [...habilidades];
    }

    setCatalogoIdiomas(idiomas: IdiomaDetalle[]): void {
        this.estadoFlujo.ventajas.catalogoIdiomas = [...idiomas];
        this.sanitizarIdiomasEnVentajas();
        this.recalcularEfectosVentajas();
    }

    toggleVentaja(idVentaja: number): ToggleVentajaResult {
        const index = this.estadoFlujo.ventajas.seleccionVentajas.findIndex(v => v.id === idVentaja);
        if (index >= 0) {
            this.estadoFlujo.ventajas.seleccionVentajas.splice(index, 1);
            this.recalcularEfectosVentajas();
            return {
                toggled: true,
                selected: false,
                requiresIdiomaSelection: false,
            };
        }

        const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === idVentaja);
        if (!ventaja) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'not_found',
            };
        }

        if (this.estadoFlujo.ventajas.seleccionVentajas.length >= MAX_VENTAJAS_SELECCIONABLES) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'max_reached',
            };
        }

        this.estadoFlujo.ventajas.seleccionVentajas.push({
            id: ventaja.Id,
            idioma: null,
        });
        this.recalcularEfectosVentajas();

        return {
            toggled: true,
            selected: true,
            requiresIdiomaSelection: ventaja.Idioma_extra,
        };
    }

    toggleDesventaja(idDesventaja: number): ToggleVentajaResult {
        const index = this.estadoFlujo.ventajas.seleccionDesventajas.findIndex(v => v.id === idDesventaja);
        if (index >= 0) {
            this.estadoFlujo.ventajas.seleccionDesventajas.splice(index, 1);
            this.recalcularEfectosVentajas();
            return {
                toggled: true,
                selected: false,
                requiresIdiomaSelection: false,
            };
        }

        const desventaja = this.estadoFlujo.ventajas.catalogoDesventajas.find(v => v.Id === idDesventaja);
        if (!desventaja) {
            return {
                toggled: false,
                selected: false,
                requiresIdiomaSelection: false,
                reason: 'not_found',
            };
        }

        this.estadoFlujo.ventajas.seleccionDesventajas.push({
            id: desventaja.Id,
            idioma: null,
        });
        this.recalcularEfectosVentajas();

        return {
            toggled: true,
            selected: true,
            requiresIdiomaSelection: false,
        };
    }

    seleccionarIdiomaParaVentaja(idVentaja: number, idioma: IdiomaDetalle): boolean {
        const seleccion = this.estadoFlujo.ventajas.seleccionVentajas.find(v => v.id === idVentaja);
        if (!seleccion)
            return false;

        const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === idVentaja);
        if (!ventaja || !ventaja.Idioma_extra)
            return false;

        if (idioma.Secreto)
            return false;

        if (this.idiomaYaEnPersonajeOSeleccion(idioma.Nombre, idVentaja))
            return false;

        seleccion.idioma = {
            ...idioma,
        };
        this.recalcularEfectosVentajas();
        return true;
    }

    quitarSeleccionVentaja(idVentaja: number): void {
        const previoVentajas = this.estadoFlujo.ventajas.seleccionVentajas.length;
        const previoDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas.length;

        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas.filter(v => v.id !== idVentaja);
        this.estadoFlujo.ventajas.seleccionDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas.filter(v => v.id !== idVentaja);

        if (previoVentajas !== this.estadoFlujo.ventajas.seleccionVentajas.length
            || previoDesventajas !== this.estadoFlujo.ventajas.seleccionDesventajas.length) {
            this.recalcularEfectosVentajas();
        }
    }

    limpiarVentajasDesventajas(): void {
        this.estadoFlujo.ventajas.seleccionVentajas = [];
        this.estadoFlujo.ventajas.seleccionDesventajas = [];
        this.recalcularEfectosVentajas();
    }

    puedeContinuarDesdeVentajas(): boolean {
        if (this.estadoFlujo.ventajas.hayDeficit)
            return false;

        if (this.estadoFlujo.ventajas.seleccionVentajas.length > MAX_VENTAJAS_SELECCIONABLES)
            return false;

        return this.estadoFlujo.ventajas.seleccionVentajas.every((seleccion) => {
            const ventaja = this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === seleccion.id);
            if (!ventaja?.Idioma_extra)
                return true;
            return seleccion.idioma !== null;
        });
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
        const index = this.getIndexByMinimo(minimo);
        this.estadoFlujo.generador.minimoSeleccionado = this.getMinimoByIndex(index);
        this.estadoFlujo.generador.indiceMinimo = index;
        this.persistirConfigGenerador();
        this.asegurarTiradasPorIndice(index);
        this.resetearGeneradorCaracteristicas();
    }

    setTablasPermitidasGenerador(cantidad: number): void {
        const tablas = this.normalizarTablasPermitidas(cantidad);
        this.estadoFlujo.generador.tablasPermitidas = tablas;
        this.persistirConfigGenerador();
        this.resetearGeneradorCaracteristicas();
    }

    seleccionarTablaGenerador(tabla: number): boolean {
        const tablaNormalizada = this.normalizarTablaSeleccionada(tabla);
        if (tablaNormalizada === null) {
            return false;
        }
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        this.estadoFlujo.generador.tablaSeleccionada = tablaNormalizada;
        this.estadoFlujo.generador.poolDisponible = this.getTiradasTabla(tablaNormalizada).slice();
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();
        this.estadoFlujo.generador.origenesAsignacion = this.crearOrigenesAsignacionVacios();

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
        this.estadoFlujo.generador.poolDisponible = [];
        this.estadoFlujo.generador.asignaciones = this.crearAsignacionesVacias();
        this.estadoFlujo.generador.origenesAsignacion = this.crearOrigenesAsignacionVacios();
        if (this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion) {
            this.estadoFlujo.generador.asignaciones.Constitucion = 0;
        }
    }

    getTiradasTabla(tabla: number): number[] {
        const tablaNormalizada = this.normalizarTablaConFallback(tabla);
        this.asegurarTiradasPorIndice(this.estadoFlujo.generador.indiceMinimo);
        const fila = this.estadoFlujo.generador.tiradasCache[this.estadoFlujo.generador.indiceMinimo];
        const inicio = (tablaNormalizada - 1) * TIRADAS_POR_TABLA;
        return fila.slice(inicio, inicio + TIRADAS_POR_TABLA);
    }

    asignarDesdePoolACaracteristica(caracteristica: CaracteristicaKey, indexPool: number): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
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
        this.estadoFlujo.generador.origenesAsignacion[caracteristica] = indexPool;
        this.estadoFlujo.generador.poolDisponible[indexPool] = -1;
        return true;
    }

    desasignarCaracteristicaGenerador(caracteristica: CaracteristicaKey): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
            return false;
        }

        if (caracteristica === 'Constitucion' && this.razaSeleccionada?.Tipo_criatura?.Pierde_constitucion) {
            return false;
        }

        const valor = this.estadoFlujo.generador.asignaciones[caracteristica];
        if (valor === null) {
            return false;
        }

        const indexPool = this.estadoFlujo.generador.origenesAsignacion[caracteristica];
        if (indexPool === null || indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        this.estadoFlujo.generador.poolDisponible[indexPool] = valor;
        this.estadoFlujo.generador.asignaciones[caracteristica] = null;
        this.estadoFlujo.generador.origenesAsignacion[caracteristica] = null;
        return true;
    }

    desasignarDesdeIndicePoolGenerador(indexPool: number): boolean {
        if (this.estadoFlujo.generador.tablaSeleccionada === null || this.estadoFlujo.generador.poolDisponible.length < 1) {
            return false;
        }

        if (indexPool < 0 || indexPool >= this.estadoFlujo.generador.poolDisponible.length) {
            return false;
        }

        if (this.estadoFlujo.generador.poolDisponible[indexPool] >= 0) {
            return false;
        }

        const keys: CaracteristicaKey[] = ['Fuerza', 'Destreza', 'Constitucion', 'Inteligencia', 'Sabiduria', 'Carisma'];
        const caracteristica = keys.find((key) =>
            this.estadoFlujo.generador.origenesAsignacion[key] === indexPool
            && this.estadoFlujo.generador.asignaciones[key] !== null
        );

        if (!caracteristica) {
            return false;
        }

        return this.desasignarCaracteristicaGenerador(caracteristica);
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
        this.estadoFlujo.ventajas.baseCaracteristicas = null;
        this.sincronizarBaseVentajasDesdePersonaje();
        this.actualizarModsHabilidadesPorCaracteristica();
        this.recalcularEfectosVentajas();
        return true;
    }

    recalcularEfectosVentajas(): void {
        this.recalcularPuntosVentajas();
        this.resetearAplicacionesVentajas();
        this.sincronizarBaseVentajasDesdePersonaje();

        const caracteristicasVarios = this.crearCaracteristicasVariosVacias();
        const nuevosRaciales = this.copiarRaciales(this.estadoFlujo.ventajas.baseRaciales);
        const nuevosIdiomas = this.copiarIdiomas(this.estadoFlujo.ventajas.baseIdiomas);
        const bonosHabilidades: Record<number, HabilidadBonoVario[]> = {};
        const pendientesOro: PendienteOroState[] = [];

        const todasLasSelecciones: Array<{ detalle: VentajaDetalle; seleccion: SeleccionVentajaState; }> = [
            ...this.estadoFlujo.ventajas.seleccionDesventajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoDesventajas.find(v => v.Id === seleccion.id),
                    seleccion,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; } => !!x.detalle),
            ...this.estadoFlujo.ventajas.seleccionVentajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === seleccion.id),
                    seleccion,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; } => !!x.detalle),
        ];

        todasLasSelecciones.forEach(({ detalle, seleccion }) => {
            const origen = detalle.Nombre?.trim() || `Ventaja ${detalle.Id}`;
            this.aplicarModificadoresCaracteristica(detalle, origen, caracteristicasVarios);
            this.aplicarModificadoresSalvacion(detalle, origen);
            this.aplicarModificadorIniciativa(detalle, origen);
            this.aplicarModificadorHabilidad(detalle, origen, bonosHabilidades);
            this.aplicarRasgo(detalle, nuevosRaciales);
            this.aplicarIdioma(detalle, seleccion, nuevosIdiomas, origen);
            this.registrarPendienteOro(detalle, origen, pendientesOro);
        });

        this.personajeCreacion.CaracteristicasVarios = caracteristicasVarios;
        this.aplicarCaracteristicasFinalesDesdeBase();
        this.estadoFlujo.ventajas.bonosHabilidades = bonosHabilidades;
        this.aplicarBonosHabilidadEnPersonaje();
        this.personajeCreacion.Raciales = nuevosRaciales;
        this.personajeCreacion.Idiomas = nuevosIdiomas;
        this.estadoFlujo.ventajas.pendientesOro = pendientesOro;
        this.personajeCreacion.Ventajas = todasLasSelecciones.map(x => x.detalle.Nombre).filter(v => `${v}`.trim().length > 0);

        if (this.personajeCreacion.Ventajas.length > 0) {
            this.personajeCreacion.Oficial = false;
        }
    }

    private recalcularPuntosVentajas(): void {
        const desventajas = this.estadoFlujo.ventajas.seleccionDesventajas
            .map(s => this.estadoFlujo.ventajas.catalogoDesventajas.find(d => d.Id === s.id))
            .filter((d): d is VentajaDetalle => !!d);
        const ventajas = this.estadoFlujo.ventajas.seleccionVentajas
            .map(s => this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === s.id))
            .filter((v): v is VentajaDetalle => !!v);

        const puntosDisponibles = desventajas.reduce((acc, d) => {
            const coste = this.toNumber(d.Coste);
            return acc + (coste > 0 ? coste : 0);
        }, 0);
        const puntosGastados = ventajas.reduce((acc, v) => acc + Math.abs(this.toNumber(v.Coste)), 0);
        const puntosRestantes = puntosDisponibles - puntosGastados;

        this.estadoFlujo.ventajas.puntosDisponibles = puntosDisponibles;
        this.estadoFlujo.ventajas.puntosGastados = puntosGastados;
        this.estadoFlujo.ventajas.puntosRestantes = puntosRestantes;
        this.estadoFlujo.ventajas.hayDeficit = puntosRestantes < 0;
    }

    private resetearAplicacionesVentajas(): void {
        this.personajeCreacion.CaracteristicasVarios = this.crearCaracteristicasVariosVacias();
        this.personajeCreacion.Salvaciones.fortaleza.modsVarios = [];
        this.personajeCreacion.Salvaciones.reflejos.modsVarios = [];
        this.personajeCreacion.Salvaciones.voluntad.modsVarios = [];
        this.personajeCreacion.Iniciativa_varios = [];
        this.estadoFlujo.ventajas.bonosHabilidades = {};
        this.estadoFlujo.ventajas.pendientesOro = [];
    }

    private sincronizarBaseVentajasDesdePersonaje(): void {
        if (this.estadoFlujo.ventajas.baseCaracteristicas !== null)
            return;

        this.estadoFlujo.ventajas.baseCaracteristicas = {
            Fuerza: this.toNumber(this.personajeCreacion.Fuerza),
            Destreza: this.toNumber(this.personajeCreacion.Destreza),
            Constitucion: this.toNumber(this.personajeCreacion.Constitucion),
            Inteligencia: this.toNumber(this.personajeCreacion.Inteligencia),
            Sabiduria: this.toNumber(this.personajeCreacion.Sabiduria),
            Carisma: this.toNumber(this.personajeCreacion.Carisma),
        };
        this.estadoFlujo.ventajas.baseRaciales = this.copiarRaciales(this.personajeCreacion.Raciales);
        this.estadoFlujo.ventajas.baseIdiomas = this.copiarIdiomas(this.personajeCreacion.Idiomas);
    }

    private aplicarCaracteristicasFinalesDesdeBase(): void {
        const base = this.estadoFlujo.ventajas.baseCaracteristicas;
        if (!base)
            return;

        const suma = (key: CaracteristicaKey): number => (this.personajeCreacion.CaracteristicasVarios[key] ?? [])
            .reduce((acc, mod) => acc + this.toNumber(mod.valor), 0);

        this.personajeCreacion.Fuerza = base.Fuerza + suma('Fuerza');
        this.personajeCreacion.Destreza = base.Destreza + suma('Destreza');
        this.personajeCreacion.Constitucion = base.Constitucion + suma('Constitucion');
        this.personajeCreacion.Inteligencia = base.Inteligencia + suma('Inteligencia');
        this.personajeCreacion.Sabiduria = base.Sabiduria + suma('Sabiduria');
        this.personajeCreacion.Carisma = base.Carisma + suma('Carisma');

        this.personajeCreacion.ModFuerza = this.calcularModificador(this.personajeCreacion.Fuerza);
        this.personajeCreacion.ModDestreza = this.calcularModificador(this.personajeCreacion.Destreza);
        this.personajeCreacion.ModConstitucion = this.calcularModificador(this.personajeCreacion.Constitucion);
        this.personajeCreacion.ModInteligencia = this.calcularModificador(this.personajeCreacion.Inteligencia);
        this.personajeCreacion.ModSabiduria = this.calcularModificador(this.personajeCreacion.Sabiduria);
        this.personajeCreacion.ModCarisma = this.calcularModificador(this.personajeCreacion.Carisma);
    }

    private aplicarModificadoresCaracteristica(
        detalle: VentajaDetalle,
        origen: string,
        caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>
    ): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const objetivos: CaracteristicaKey[] = [];
        if (detalle.Fuerza)
            objetivos.push('Fuerza');
        if (detalle.Destreza)
            objetivos.push('Destreza');
        if (detalle.Constitucion)
            objetivos.push('Constitucion');
        if (detalle.Inteligencia)
            objetivos.push('Inteligencia');
        if (detalle.Sabiduria)
            objetivos.push('Sabiduria');
        if (detalle.Carisma)
            objetivos.push('Carisma');

        objetivos.forEach((key) => {
            caracteristicasVarios[key].push({
                valor,
                origen,
            });
        });
    }

    private aplicarModificadoresSalvacion(detalle: VentajaDetalle, origen: string): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const registrar = (tipo: SalvacionKey) => {
            this.personajeCreacion.Salvaciones[tipo].modsVarios.push({
                valor,
                origen,
            });
        };

        if (detalle.Fortaleza)
            registrar('fortaleza');
        if (detalle.Reflejos)
            registrar('reflejos');
        if (detalle.Voluntad)
            registrar('voluntad');
    }

    private aplicarModificadorIniciativa(detalle: VentajaDetalle, origen: string): void {
        if (!detalle.Iniciativa)
            return;

        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        this.personajeCreacion.Iniciativa_varios.push({
            Valor: valor,
            Origen: origen,
        });
    }

    private aplicarModificadorHabilidad(
        detalle: VentajaDetalle,
        origen: string,
        bonosHabilidades: Record<number, HabilidadBonoVario[]>
    ): void {
        const valor = this.toNumber(detalle.Mejora);
        if (valor === 0)
            return;

        const habilidadObjetivo = this.buscarHabilidadEnPersonaje(detalle);
        if (!habilidadObjetivo)
            return;

        const id = this.toNumber(habilidadObjetivo.Id);
        if (!bonosHabilidades[id])
            bonosHabilidades[id] = [];

        bonosHabilidades[id].push({
            valor,
            origen,
        });
    }

    private buscarHabilidadEnPersonaje(detalle: VentajaDetalle): Personaje['Habilidades'][number] | null {
        const idObjetivo = this.toNumber(detalle.Habilidad?.Id);
        if (idObjetivo > 0) {
            const porId = this.personajeCreacion.Habilidades.find(h => this.toNumber(h.Id) === idObjetivo);
            if (porId)
                return porId;
        }

        const nombreObjetivo = this.normalizarTexto(detalle.Habilidad?.Nombre ?? '');
        if (nombreObjetivo.length < 1)
            return null;

        return this.personajeCreacion.Habilidades.find((h) => this.normalizarTexto(h.Nombre) === nombreObjetivo) ?? null;
    }

    private aplicarBonosHabilidadEnPersonaje(): void {
        this.actualizarModsHabilidadesPorCaracteristica();
        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades.map((h) => {
            const bonos = this.estadoFlujo.ventajas.bonosHabilidades[this.toNumber(h.Id)] ?? [];
            const rangosVarios = bonos.reduce((acc, b) => acc + this.toNumber(b.valor), 0);
            const diversos = bonos.map((b) => `${b.origen} ${b.valor > 0 ? '+' : ''}${b.valor}`).join(', ');
            return {
                ...h,
                Rangos_varios: rangosVarios,
                Varios: diversos,
                Bonos_varios: bonos,
            };
        });
    }

    private aplicarRasgo(detalle: VentajaDetalle, raciales: { Nombre: string; }[]): void {
        const nombre = `${detalle.Rasgo?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const existe = raciales.some(r => this.normalizarTexto(r.Nombre) === this.normalizarTexto(nombre));
        if (!existe) {
            raciales.push({ Nombre: nombre });
        }
    }

    private aplicarIdioma(
        detalle: VentajaDetalle,
        seleccion: SeleccionVentajaState,
        idiomas: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; }[],
        origen: string
    ): void {
        if (detalle.Idioma_extra) {
            if (!seleccion.idioma)
                return;

            const nombre = `${seleccion.idioma.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            if (idiomas.some(i => this.normalizarTexto(i.Nombre) === this.normalizarTexto(nombre)))
                return;

            idiomas.push({
                Nombre: nombre,
                Descripcion: this.agregarOrigenDescripcion(seleccion.idioma.Descripcion, origen),
                Secreto: !!seleccion.idioma.Secreto,
                Oficial: !!seleccion.idioma.Oficial,
            });
            return;
        }

        const nombreIdioma = `${detalle.Idioma?.Nombre ?? ''}`.trim();
        if (nombreIdioma.length < 1)
            return;
        if (idiomas.some(i => this.normalizarTexto(i.Nombre) === this.normalizarTexto(nombreIdioma)))
            return;

        idiomas.push({
            Nombre: nombreIdioma,
            Descripcion: this.agregarOrigenDescripcion(detalle.Idioma?.Descripcion, origen),
            Secreto: false,
            Oficial: detalle.Oficial !== false,
        });
    }

    private registrarPendienteOro(detalle: VentajaDetalle, origen: string, pendientes: PendienteOroState[]): void {
        if (detalle.Duplica_oro) {
            pendientes.push({
                tipo: 'Duplica_oro',
                origen,
            });
        }
        if (detalle.Aumenta_oro) {
            pendientes.push({
                tipo: 'Aumenta_oro',
                origen,
            });
        }
    }

    private copiarRaciales(value: { Nombre: string; }[] | null | undefined): { Nombre: string; }[] {
        return (value ?? [])
            .map((r) => ({ Nombre: `${r?.Nombre ?? ''}`.trim() }))
            .filter(r => r.Nombre.length > 0);
    }

    private copiarIdiomas(value: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; }[] | null | undefined) {
        return (value ?? [])
            .map((i) => ({
                Nombre: `${i?.Nombre ?? ''}`.trim(),
                Descripcion: `${i?.Descripcion ?? ''}`.trim(),
                Secreto: !!i?.Secreto,
                Oficial: !!i?.Oficial,
            }))
            .filter(i => i.Nombre.length > 0);
    }

    private idiomaYaEnPersonajeOSeleccion(nombreIdioma: string, exceptVentajaId?: number): boolean {
        const normalizado = this.normalizarTexto(nombreIdioma);
        if (normalizado.length < 1)
            return false;

        const enBase = this.estadoFlujo.ventajas.baseIdiomas.some(i => this.normalizarTexto(i.Nombre) === normalizado);
        if (enBase)
            return true;

        return this.estadoFlujo.ventajas.seleccionVentajas
            .filter(v => v.id !== exceptVentajaId)
            .some((v) => this.normalizarTexto(v.idioma?.Nombre ?? '') === normalizado);
    }

    private agregarOrigenDescripcion(descripcion: string | undefined, origen: string): string {
        const base = `${descripcion ?? ''}`.trim();
        if (base.length < 1)
            return `Origen: ${origen}`;
        return `${base} (Origen: ${origen})`;
    }

    private crearEstadoFlujoBase(): EstadoFlujoNuevoPersonaje {
        const config = this.leerConfigGenerador();
        const indiceMinimo = this.getIndexByMinimo(config.minimoSeleccionado);
        return {
            pasoActual: 'raza',
            modalCaracteristicasAbierto: false,
            caracteristicasGeneradas: false,
            generador: {
                minimoSeleccionado: this.getMinimoByIndex(indiceMinimo),
                indiceMinimo,
                tiradasCache: this.crearTiradasCache(),
                tablasPermitidas: config.tablasPermitidas,
                tablaSeleccionada: null,
                asignaciones: this.crearAsignacionesVacias(),
                origenesAsignacion: this.crearOrigenesAsignacionVacios(),
                poolDisponible: [],
            },
            plantillas: this.crearPlantillasFlujoBase(),
            ventajas: this.crearVentajasFlujoBase(),
        };
    }

    private crearPlantillasFlujoBase(): PlantillasFlujoState {
        return {
            disponibles: [],
            seleccionadas: [],
            tipoCriaturaSimulada: {
                Id: this.toNumber(this.personajeCreacion?.Tipo_criatura?.Id),
                Nombre: `${this.personajeCreacion?.Tipo_criatura?.Nombre ?? '-'}`,
            },
            licantropiaActiva: false,
            heredadaActiva: false,
        };
    }

    private crearVentajasFlujoBase(): VentajasFlujoState {
        return {
            catalogoVentajas: [],
            catalogoDesventajas: [],
            catalogoHabilidades: [],
            catalogoHabilidadesCustom: [],
            catalogoIdiomas: [],
            seleccionVentajas: [],
            seleccionDesventajas: [],
            puntosDisponibles: 0,
            puntosGastados: 0,
            puntosRestantes: 0,
            hayDeficit: false,
            pendientesOro: [],
            bonosHabilidades: {},
            baseCaracteristicas: null,
            baseRaciales: [],
            baseIdiomas: [],
        };
    }

    private crearTiradasCache(): number[][] {
        return Array.from(
            { length: FILAS_TIRADAS },
            () => Array.from({ length: MAX_TABLAS * TIRADAS_POR_TABLA }, () => 0)
        );
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

    private crearOrigenesAsignacionVacios(): Record<CaracteristicaKey, number | null> {
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
        const seguro = Math.max(0, Math.min(FILAS_TIRADAS - 1, index));
        const fila = this.estadoFlujo.generador.tiradasCache[seguro];
        if (fila[0] !== 0) {
            return;
        }

        const minimo = this.getMinimoByIndex(seguro);
        for (let i = 0; i < MAX_TABLAS * TIRADAS_POR_TABLA; i++) {
            fila[i] = this.randomInt(minimo, 18);
        }
    }

    private getMinimoByIndex(index: number): number {
        return this.normalizarMinimo(MIN_TIRADA + index);
    }

    private getIndexByMinimo(minimo: number): number {
        const normalizado = this.normalizarMinimo(minimo);
        return normalizado - MIN_TIRADA;
    }

    private normalizarMinimo(minimo: number): number {
        return Math.max(MIN_TIRADA, Math.min(MAX_TIRADA, minimo));
    }

    private normalizarTablasPermitidas(tablas: number): number {
        const normalizadas = Math.trunc(tablas);
        if (!Number.isFinite(normalizadas)) {
            return DEFAULT_TABLAS;
        }
        return Math.max(MIN_TABLAS, Math.min(MAX_TABLAS, normalizadas));
    }

    private normalizarTablaSeleccionada(tabla: number): number | null {
        const normalizada = Math.trunc(tabla);
        if (!Number.isFinite(normalizada)) {
            return null;
        }

        return normalizada >= MIN_TABLAS && normalizada <= this.estadoFlujo.generador.tablasPermitidas
            ? normalizada
            : null;
    }

    private normalizarTablaConFallback(tabla: number): number {
        const normalizada = Math.trunc(tabla);
        if (!Number.isFinite(normalizada)) {
            return MIN_TABLAS;
        }
        return Math.max(MIN_TABLAS, Math.min(MAX_TABLAS, normalizada));
    }

    private persistirConfigGenerador(): void {
        const payload = {
            minimoSeleccionado: this.estadoFlujo.generador.minimoSeleccionado,
            tablasPermitidas: this.estadoFlujo.generador.tablasPermitidas,
        };
        this.guardarEnLocalStorage(GENERADOR_CONFIG_STORAGE_KEY, payload);
    }

    private leerConfigGenerador(): { minimoSeleccionado: number; tablasPermitidas: number; } {
        const defaults = {
            minimoSeleccionado: DEFAULT_TIRADA,
            tablasPermitidas: DEFAULT_TABLAS,
        };

        const raw = this.leerDeLocalStorage(GENERADOR_CONFIG_STORAGE_KEY);
        if (!raw) {
            return defaults;
        }

        try {
            const parsed = JSON.parse(raw);
            return {
                minimoSeleccionado: this.normalizarMinimo(this.toNumber(parsed?.minimoSeleccionado) || DEFAULT_TIRADA),
                tablasPermitidas: this.normalizarTablasPermitidas(this.toNumber(parsed?.tablasPermitidas) || DEFAULT_TABLAS),
            };
        } catch {
            return defaults;
        }
    }

    private guardarEnLocalStorage(key: string, value: unknown): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Si localStorage no está disponible, se mantiene configuración en memoria.
        }
    }

    private leerDeLocalStorage(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
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

    private normalizarTexto(valor: string): string {
        return `${valor ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private crearCaracteristicasVariosVacias() {
        return {
            Fuerza: [],
            Destreza: [],
            Constitucion: [],
            Inteligencia: [],
            Sabiduria: [],
            Carisma: [],
        };
    }

    private inicializarHabilidadesBase(force: boolean): void {
        if (this.estadoFlujo.ventajas.catalogoHabilidades.length < 1)
            return;

        if (!force && this.personajeCreacion.Habilidades.length > 0)
            return;

        this.personajeCreacion.Habilidades = this.estadoFlujo.ventajas.catalogoHabilidades
            .map((h) => {
                const carKey = this.resolverCaracteristicaPorIdOTexto(h.Id_caracteristica, h.Caracteristica);
                return {
                    Id: this.toNumber(h.Id_habilidad),
                    Nombre: `${h.Nombre ?? ''}`,
                    Clasea: false,
                    Car: this.etiquetaCaracteristica(carKey, h.Caracteristica),
                    Mod_car: this.modificadorPorCaracteristica(carKey),
                    Rangos: 0,
                    Rangos_varios: 0,
                    Extra: '',
                    Varios: '',
                    Custom: false,
                    Soporta_extra: !!h.Soporta_extra,
                    Extras: (h.Extras ?? []).map((extra) => ({
                        Id_extra: this.toNumber(extra?.Id_extra),
                        Extra: `${extra?.Extra ?? ''}`,
                        Descripcion: `${extra?.Descripcion ?? ''}`,
                    })),
                    Bonos_varios: [],
                };
            })
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private actualizarModsHabilidadesPorCaracteristica(): void {
        this.personajeCreacion.Habilidades = this.personajeCreacion.Habilidades.map((h) => {
            const key = this.resolverCaracteristicaPorTexto(h.Car);
            return {
                ...h,
                Mod_car: this.modificadorPorCaracteristica(key),
            };
        });
    }

    private sanitizarSeleccionesVentajas(): void {
        const idsVentajas = new Set(this.estadoFlujo.ventajas.catalogoVentajas.map(v => v.Id));
        const idsDesventajas = new Set(this.estadoFlujo.ventajas.catalogoDesventajas.map(v => v.Id));

        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas
            .filter(v => idsVentajas.has(v.id))
            .slice(0, MAX_VENTAJAS_SELECCIONABLES);
        this.estadoFlujo.ventajas.seleccionDesventajas = this.estadoFlujo.ventajas.seleccionDesventajas
            .filter(v => idsDesventajas.has(v.id));
    }

    private sanitizarIdiomasEnVentajas(): void {
        const idsIdiomas = new Set(this.estadoFlujo.ventajas.catalogoIdiomas.map(i => i.Id));
        this.estadoFlujo.ventajas.seleccionVentajas = this.estadoFlujo.ventajas.seleccionVentajas.map((seleccion) => {
            if (!seleccion.idioma)
                return seleccion;
            return {
                ...seleccion,
                idioma: idsIdiomas.has(seleccion.idioma.Id) ? seleccion.idioma : null,
            };
        });
    }

    private resolverCaracteristicaPorIdOTexto(id: number, texto: string): CaracteristicaKey {
        const map: Record<number, CaracteristicaKey> = {
            1: 'Fuerza',
            2: 'Destreza',
            3: 'Constitucion',
            4: 'Inteligencia',
            5: 'Sabiduria',
            6: 'Carisma',
        };
        if (map[id])
            return map[id];
        return this.resolverCaracteristicaPorTexto(texto);
    }

    private resolverCaracteristicaPorTexto(texto: string): CaracteristicaKey {
        const normalizado = this.normalizarTexto(texto);
        if (normalizado.startsWith('fue') || normalizado.includes('fuerza'))
            return 'Fuerza';
        if (normalizado.startsWith('des') || normalizado.includes('destreza'))
            return 'Destreza';
        if (normalizado.startsWith('con') || normalizado.includes('constitucion'))
            return 'Constitucion';
        if (normalizado.startsWith('int') || normalizado.includes('inteligencia'))
            return 'Inteligencia';
        if (normalizado.startsWith('sab') || normalizado.includes('sabiduria'))
            return 'Sabiduria';
        if (normalizado.startsWith('car') || normalizado.includes('carisma'))
            return 'Carisma';
        return 'Destreza';
    }

    private etiquetaCaracteristica(key: CaracteristicaKey, fallback: string): string {
        const fallbackValue = `${fallback ?? ''}`.trim();
        if (fallbackValue.length > 0)
            return fallbackValue;
        return key;
    }

    private modificadorPorCaracteristica(key: CaracteristicaKey): number {
        if (key === 'Fuerza')
            return this.personajeCreacion.ModFuerza;
        if (key === 'Destreza')
            return this.personajeCreacion.ModDestreza;
        if (key === 'Constitucion')
            return this.personajeCreacion.ModConstitucion;
        if (key === 'Inteligencia')
            return this.personajeCreacion.ModInteligencia;
        if (key === 'Sabiduria')
            return this.personajeCreacion.ModSabiduria;
        return this.personajeCreacion.ModCarisma;
    }

    private mapPlantillaParaPersonaje(plantilla: Plantilla) {
        return {
            Id: this.toNumber(plantilla.Id),
            Nombre: `${plantilla.Nombre ?? ''}`,
            Ataques: `${plantilla.Ataques ?? ''}`,
            Ataque_completo: `${plantilla.Ataque_completo ?? ''}`,
            Id_tamano: this.toNumber(plantilla.Tamano?.Id),
            Tamano: `${plantilla.Tamano?.Nombre ?? '-'}`,
            Id_tamano_pasos: this.toNumber(plantilla.Modificacion_tamano?.Id_paso_modificacion),
            Tamano_pasos: `${plantilla.Modificacion_tamano?.Nombre ?? '-'}`,
            // Pendiente para aplicacion de efectos: si Tipo_dado es "Elegir", no altera los dados de golpe del personaje.
            Id_dados_golpe: this.toNumber(plantilla.Tipo_dado?.Id_tipo_dado),
            Dados_golpe: `${plantilla.Tipo_dado?.Nombre ?? '-'}`,
            Id_dados_golpe_pasos: this.toNumber(plantilla.Modificacion_dg?.Id_paso_modificacion),
            Dados_golpe_pasos: `${plantilla.Modificacion_dg?.Nombre ?? '-'}`,
            Actualiza_dgs: !!plantilla.Actualiza_dg,
            Multiplicador_dgs_lic: this.toNumber(plantilla.Licantronia_dg?.Multiplicador),
            Tipo_dgs_lic: `${plantilla.Licantronia_dg?.Dado ?? ''}`,
            Suma_dgs_lic: this.toNumber(plantilla.Licantronia_dg?.Suma),
            Correr: this.toNumber(plantilla.Movimientos?.Correr),
            Nadar: this.toNumber(plantilla.Movimientos?.Nadar),
            Volar: this.toNumber(plantilla.Movimientos?.Volar),
            Maniobrabilidad: `${plantilla.Maniobrabilidad?.Nombre ?? '-'}`,
            Trepar: this.toNumber(plantilla.Movimientos?.Trepar),
            Escalar: this.toNumber(plantilla.Movimientos?.Escalar),
            Ataque_base: this.toNumber(plantilla.Ataque_base),
            Ca: `${plantilla.Ca ?? ''}`,
            Reduccion_dano: `${plantilla.Reduccion_dano ?? ''}`,
            Resistencia_conjuros: `${plantilla.Resistencia_conjuros ?? ''}`,
            Resistencia_elemental: `${plantilla.Resistencia_elemental ?? ''}`,
            Velocidades: `${plantilla.Velocidades ?? ''}`,
            Iniciativa: this.toNumber(plantilla.Iniciativa),
            Presa: this.toNumber(plantilla.Presa),
            Ajuste_nivel: this.toNumber(plantilla.Ajuste_nivel),
            Heredada: !!plantilla.Nacimiento,
        };
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
            CaracteristicasVarios: this.crearCaracteristicasVariosVacias(),
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
