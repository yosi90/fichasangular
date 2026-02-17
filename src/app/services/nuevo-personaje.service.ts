import { Injectable } from '@angular/core';
import { AptitudSortilega } from '../interfaces/aptitud-sortilega';
import { HabilidadBasicaDetalle, HabilidadBonoVario } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { Personaje } from '../interfaces/personaje';
import { Plantilla } from '../interfaces/plantilla';
import { RacialDetalle } from '../interfaces/racial';
import { Raza } from '../interfaces/raza';
import { SubtipoRef } from '../interfaces/subtipo';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { VentajaDetalle } from '../interfaces/ventaja';
import { resolverAlineamientoPlantillas, simularEstadoPlantillas } from './utils/plantilla-elegibilidad';
import { extraerEjesAlineamientoDesdeContrato } from './utils/alineamiento-contrato';
import { createRacialPlaceholder, normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';

export type StepNuevoPersonaje = 'raza' | 'basicos' | 'plantillas' | 'ventajas';

type CaracteristicaKey = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';
type SalvacionKey = 'fortaleza' | 'reflejos' | 'voluntad';

const CARACTERISTICAS_KEYS: CaracteristicaKey[] = ['Fuerza', 'Destreza', 'Constitucion', 'Inteligencia', 'Sabiduria', 'Carisma'];

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
const DADOS_PROGRESION = [4, 6, 8, 10, 12];

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
    baseRaciales: RacialDetalle[];
    baseIdiomas: {
        Nombre: string;
        Descripcion: string;
        Secreto: boolean;
        Oficial: boolean;
        Origen?: string;
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
    private catalogoTiposCriatura: TipoCriatura[] = [];
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
        this.personajeCreacion.Correr = raza.Correr ?? 0;
        this.personajeCreacion.Nadar = raza.Nadar ?? 0;
        this.personajeCreacion.Volar = raza.Volar ?? 0;
        this.personajeCreacion.Trepar = raza.Trepar ?? 0;
        this.personajeCreacion.Escalar = raza.Escalar ?? 0;
        this.personajeCreacion.Raciales = this.asignarOrigenRaciales(
            this.copiarRaciales(raza.Raciales),
            raza.Nombre
        );
        this.personajeCreacion.Sortilegas = this.asignarOrigenSortilegas(
            this.copiarSortilegas(raza.Sortilegas),
            raza.Nombre
        );
        if (raza?.Tipo_criatura) {
            this.personajeCreacion.Tipo_criatura = this.copiarTipoCriatura(raza.Tipo_criatura);
            this.sincronizarCaracteristicasPerdidasConTipoActual();
        }
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
        this.estadoFlujo.plantillas.heredadaActiva = !!raza.Heredada;
        this.personajeCreacion.Plantillas = [];
        this.recalcularTipoYSubtiposDerivados();
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
        this.recalcularTipoYSubtiposDerivados();
        this.recalcularEfectosVentajas();
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

    setCatalogoTiposCriatura(tipos: TipoCriatura[]): void {
        this.catalogoTiposCriatura = [...tipos];
        this.recalcularTipoYSubtiposDerivados();
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

        CARACTERISTICAS_KEYS.forEach((key) => {
            if (this.esCaracteristicaPerdida(key))
                this.estadoFlujo.generador.asignaciones[key] = 0;
        });

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
        CARACTERISTICAS_KEYS.forEach((key) => {
            if (this.esCaracteristicaPerdida(key))
                this.estadoFlujo.generador.asignaciones[key] = 0;
        });
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

        if (this.esCaracteristicaPerdida(caracteristica)) {
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

        if (this.esCaracteristicaPerdida(caracteristica)) {
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

        const caracteristica = CARACTERISTICAS_KEYS.find((key) =>
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
        return CARACTERISTICAS_KEYS.every((key) => this.esCaracteristicaPerdida(key) || asigs[key] !== null);
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
        const razaMods = this.personajeCreacion.Raza?.Modificadores;

        if (CARACTERISTICAS_KEYS.some((key) => !this.esCaracteristicaPerdida(key) && asignaciones[key] === null)) {
            return false;
        }

        CARACTERISTICAS_KEYS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const base = perdida ? 0 : this.toNumber(asignaciones[key]);
            const final = perdida ? 0 : base + this.toNumber(razaMods?.[key]);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : this.calcularModificador(final));
        });
        this.sincronizarAliasConstitucionPerdida();

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
        this.aplicarEfectosPlantillasFase2(caracteristicasVarios, nuevosRaciales, bonosHabilidades);

        const todasLasSelecciones: Array<{ detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Ventaja' | 'Desventaja'; }> = [
            ...this.estadoFlujo.ventajas.seleccionDesventajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoDesventajas.find(v => v.Id === seleccion.id),
                    seleccion,
                    claseOrigen: 'Desventaja' as const,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Desventaja'; } => !!x.detalle),
            ...this.estadoFlujo.ventajas.seleccionVentajas
                .map((seleccion) => ({
                    detalle: this.estadoFlujo.ventajas.catalogoVentajas.find(v => v.Id === seleccion.id),
                    seleccion,
                    claseOrigen: 'Ventaja' as const,
                }))
                .filter((x): x is { detalle: VentajaDetalle; seleccion: SeleccionVentajaState; claseOrigen: 'Ventaja'; } => !!x.detalle),
        ];

        todasLasSelecciones.forEach(({ detalle, seleccion }) => {
            const origen = detalle.Nombre?.trim() || `Ventaja ${detalle.Id}`;
            this.aplicarModificadoresCaracteristica(detalle, origen, caracteristicasVarios);
            this.aplicarModificadoresSalvacion(detalle, origen);
            this.aplicarModificadorIniciativa(detalle, origen);
            this.aplicarModificadorHabilidad(detalle, origen, bonosHabilidades);
            this.aplicarRasgo(detalle, nuevosRaciales, origen);
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
        this.personajeCreacion.Ventajas = todasLasSelecciones
            .map((x) => ({
                Nombre: `${x.detalle.Nombre ?? ''}`.trim(),
                Origen: x.claseOrigen,
            }))
            .filter((v) => v.Nombre.length > 0);

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
        this.personajeCreacion.Presa_varios = [];
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

        CARACTERISTICAS_KEYS.forEach((key) => {
            const perdida = this.esCaracteristicaPerdida(key);
            const minimoPlantilla = this.obtenerMinimoCaracteristicaPorPlantillas(key);
            const suma = perdida
                ? 0
                : (this.personajeCreacion.CaracteristicasVarios[key] ?? [])
                    .reduce((acc, mod) => acc + this.toNumber(mod.valor), 0);
            const finalSinMin = perdida ? 0 : this.toNumber(base[key]) + suma;
            const final = perdida ? 0 : Math.max(finalSinMin, minimoPlantilla);
            this.setValorCaracteristica(key, final);
            this.setModCaracteristica(key, perdida ? 0 : this.calcularModificador(final));
        });
        this.recalcularDefensasYPresa();
        this.sincronizarAliasConstitucionPerdida();
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

    private aplicarRasgo(detalle: VentajaDetalle, raciales: RacialDetalle[], origen: string): void {
        const nombre = `${detalle.Rasgo?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const existe = raciales.some(r => this.normalizarTexto(r.Nombre) === this.normalizarTexto(nombre));
        if (!existe) {
            const nuevoRasgo = createRacialPlaceholder(nombre);
            nuevoRasgo.Origen = origen;
            raciales.push(nuevoRasgo);
        }
    }

    private aplicarIdioma(
        detalle: VentajaDetalle,
        seleccion: SeleccionVentajaState,
        idiomas: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[],
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
                Descripcion: `${seleccion.idioma.Descripcion ?? ''}`.trim(),
                Secreto: !!seleccion.idioma.Secreto,
                Oficial: !!seleccion.idioma.Oficial,
                Origen: origen,
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
            Descripcion: `${detalle.Idioma?.Descripcion ?? ''}`.trim(),
            Secreto: false,
            Oficial: detalle.Oficial !== false,
            Origen: origen,
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

    private aplicarEfectosPlantillasFase2(
        caracteristicasVarios: Record<CaracteristicaKey, { valor: number; origen: string; }[]>,
        raciales: RacialDetalle[],
        bonosHabilidades: Record<number, HabilidadBonoVario[]>
    ): void {
        const seleccionadas = this.estadoFlujo.plantillas.seleccionadas;
        const raza = this.razaSeleccionada;

        this.personajeCreacion.Correr = this.toNumber(raza?.Correr);
        this.personajeCreacion.Nadar = this.toNumber(raza?.Nadar);
        this.personajeCreacion.Volar = this.toNumber(raza?.Volar);
        this.personajeCreacion.Trepar = this.toNumber(raza?.Trepar);
        this.personajeCreacion.Escalar = this.toNumber(raza?.Escalar);

        this.personajeCreacion.Rds = [];
        this.personajeCreacion.Rcs = [];
        this.personajeCreacion.Res = [];

        if (this.esTextoReglaValido(`${raza?.Reduccion_dano ?? ''}`)) {
            this.personajeCreacion.Rds.push({
                Modificador: `${raza?.Reduccion_dano ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }
        if (this.esTextoReglaValido(`${raza?.Resistencia_magica ?? ''}`)) {
            this.personajeCreacion.Rcs.push({
                Modificador: `${raza?.Resistencia_magica ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }
        if (this.esTextoReglaValido(`${raza?.Resistencia_energia ?? ''}`)) {
            this.personajeCreacion.Res.push({
                Modificador: `${raza?.Resistencia_energia ?? ''}`.trim(),
                Origen: `${raza?.Nombre ?? 'Raza'}`.trim(),
            });
        }

        let ataqueBase = this.toNumber(raza?.Dgs_adicionales?.Ataque_base);
        let armaduraNatural = this.toNumber(raza?.Armadura_natural);
        let caVarios = this.toNumber(raza?.Varios_armadura);
        let dadoGolpe = this.resolverDadoGolpeTipoActual();

        const hayReglasAlineamiento = seleccionadas.some((plantilla) => this.tieneRestriccionAlineamientoPlantilla(plantilla));
        if (hayReglasAlineamiento) {
            const alineamientoResuelto = resolverAlineamientoPlantillas(this.personajeCreacion.Alineamiento, seleccionadas);
            if (!alineamientoResuelto.conflicto && this.normalizarTexto(alineamientoResuelto.alineamiento).length > 0)
                this.personajeCreacion.Alineamiento = alineamientoResuelto.alineamiento;
        }

        seleccionadas.forEach((plantilla) => {
            const origen = `${plantilla?.Nombre ?? ''}`.trim() || `Plantilla ${this.toNumber(plantilla?.Id)}`;
            ataqueBase += this.toNumber(plantilla?.Ataque_base);

            if (this.toNumber(plantilla?.Movimientos?.Correr) > 0)
                this.personajeCreacion.Correr = this.toNumber(plantilla.Movimientos.Correr);
            if (this.toNumber(plantilla?.Movimientos?.Nadar) > 0)
                this.personajeCreacion.Nadar = this.toNumber(plantilla.Movimientos.Nadar);
            if (this.toNumber(plantilla?.Movimientos?.Volar) > 0)
                this.personajeCreacion.Volar = this.toNumber(plantilla.Movimientos.Volar);
            if (this.toNumber(plantilla?.Movimientos?.Trepar) > 0)
                this.personajeCreacion.Trepar = this.toNumber(plantilla.Movimientos.Trepar);
            if (this.toNumber(plantilla?.Movimientos?.Escalar) > 0)
                this.personajeCreacion.Escalar = this.toNumber(plantilla.Movimientos.Escalar);

            if (this.toNumber(plantilla?.Fortaleza) !== 0) {
                this.personajeCreacion.Salvaciones.fortaleza.modsVarios.push({
                    valor: this.toNumber(plantilla.Fortaleza),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Reflejos) !== 0) {
                this.personajeCreacion.Salvaciones.reflejos.modsVarios.push({
                    valor: this.toNumber(plantilla.Reflejos),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Voluntad) !== 0) {
                this.personajeCreacion.Salvaciones.voluntad.modsVarios.push({
                    valor: this.toNumber(plantilla.Voluntad),
                    origen,
                });
            }
            if (this.toNumber(plantilla?.Iniciativa) !== 0) {
                this.personajeCreacion.Iniciativa_varios.push({
                    Valor: this.toNumber(plantilla.Iniciativa),
                    Origen: origen,
                });
            }
            if (this.toNumber(plantilla?.Presa) !== 0) {
                this.personajeCreacion.Presa_varios.push({
                    Valor: this.toNumber(plantilla.Presa),
                    Origen: origen,
                });
            }

            CARACTERISTICAS_KEYS.forEach((key) => {
                const valor = this.toNumber((plantilla?.Modificadores_caracteristicas as Record<string, any>)?.[key]);
                if (valor !== 0) {
                    caracteristicasVarios[key].push({
                        valor,
                        origen,
                    });
                }
            });

            const textoCa = `${plantilla?.Ca ?? ''}`.trim();
            const valorCa = this.extraerPrimerEnteroConSigno(textoCa);
            if (valorCa !== 0) {
                const normalizado = this.normalizarTexto(textoCa);
                if (normalizado.includes('natural'))
                    armaduraNatural += valorCa;
                else
                    caVarios += valorCa;
            }

            if (this.esTextoReglaValido(`${plantilla?.Reduccion_dano ?? ''}`)) {
                this.personajeCreacion.Rds.push({
                    Modificador: `${plantilla?.Reduccion_dano ?? ''}`.trim(),
                    Origen: origen,
                });
            }
            if (this.esTextoReglaValido(`${plantilla?.Resistencia_conjuros ?? ''}`)) {
                this.personajeCreacion.Rcs.push({
                    Modificador: `${plantilla?.Resistencia_conjuros ?? ''}`.trim(),
                    Origen: origen,
                });
            }
            if (this.esTextoReglaValido(`${plantilla?.Resistencia_elemental ?? ''}`)) {
                this.personajeCreacion.Res.push({
                    Modificador: `${plantilla?.Resistencia_elemental ?? ''}`.trim(),
                    Origen: origen,
                });
            }

            this.agregarRacialPlantillaTexto(raciales, `${plantilla?.Ataques ?? ''}`, origen, 'Ataques');
            this.agregarRacialPlantillaTexto(raciales, `${plantilla?.Ataque_completo ?? ''}`, origen, 'Ataque completo');

            (plantilla?.Habilidades ?? []).forEach((habilidadRef) => {
                const rangos = this.toNumber(habilidadRef?.Rangos);
                if (rangos === 0)
                    return;

                const habilidad = this.asegurarHabilidadDesdePlantilla(habilidadRef);
                if (!habilidad)
                    return;

                const idHabilidad = this.toNumber(habilidad.Id);
                if (idHabilidad <= 0)
                    return;

                if (!bonosHabilidades[idHabilidad])
                    bonosHabilidades[idHabilidad] = [];
                bonosHabilidades[idHabilidad].push({
                    valor: rangos,
                    origen,
                });
            });

            const dadoDirecto = this.resolverDadoDesdePlantilla(plantilla);
            if (dadoDirecto > 0)
                dadoGolpe = dadoDirecto;
            const pasoDado = this.toNumber(plantilla?.Modificacion_dg?.Id_paso_modificacion);
            if (pasoDado !== 0)
                dadoGolpe = this.aplicarPasoDado(dadoGolpe, pasoDado);
        });

        this.personajeCreacion.Ataque_base = `${ataqueBase}`;
        this.personajeCreacion.Armadura_natural = armaduraNatural;
        this.personajeCreacion.Ca_varios = caVarios;
        this.personajeCreacion.Dados_golpe = dadoGolpe;

        const ajusteRaza = this.toNumber(raza?.Ajuste_nivel);
        const ajustePlantillas = seleccionadas.reduce((acc, plantilla) => acc + this.toNumber(plantilla?.Ajuste_nivel), 0);
        const nivelClases = (this.personajeCreacion?.desgloseClases ?? [])
            .reduce((acc, clase) => acc + this.toNumber(clase?.Nivel), 0);
        const dgsRaza = this.toNumber(raza?.Dgs_adicionales?.Cantidad);
        const nivelEfectivo = nivelClases + ajusteRaza + ajustePlantillas + dgsRaza;
        this.personajeCreacion.NEP = nivelEfectivo;
        this.personajeCreacion.Experiencia = this.calcularExperienciaPorNivel(nivelClases + ajusteRaza + ajustePlantillas);
        this.personajeCreacion.Oro_inicial = this.calcularOroPorNep(nivelEfectivo);
    }

    private esTextoReglaValido(valor: string): boolean {
        const normalizado = this.normalizarTexto(valor);
        if (normalizado.length < 1)
            return false;
        return normalizado !== 'no especifica'
            && normalizado !== 'no se especifica'
            && normalizado !== 'no modifica'
            && normalizado !== 'no aplica'
            && normalizado !== '-'
            && normalizado !== 'ninguna';
    }

    private extraerPrimerEnteroConSigno(valor: string): number {
        const match = `${valor ?? ''}`.match(/[+-]?\d+/);
        if (!match || match.length < 1)
            return 0;
        return this.toNumber(match[0]);
    }

    private resolverDadoGolpeTipoActual(): number {
        const tipoActual = this.personajeCreacion.Tipo_criatura;
        const dadoPorTipo = this.toNumber(tipoActual?.Tipo_dado);
        if (dadoPorTipo > 0)
            return dadoPorTipo;

        const idTipo = this.toNumber(tipoActual?.Id_tipo_dado);
        if (idTipo <= 0)
            return 0;

        const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipo - 1));
        return DADOS_PROGRESION[idx];
    }

    private resolverDadoDesdePlantilla(plantilla: Plantilla): number {
        const porNombre = `${plantilla?.Tipo_dado?.Nombre ?? ''}`.match(/d\s*(\d+)/i);
        if (porNombre && porNombre[1]) {
            const dado = this.toNumber(porNombre[1]);
            if (DADOS_PROGRESION.includes(dado))
                return dado;
        }

        const idTipoDado = this.toNumber(plantilla?.Tipo_dado?.Id_tipo_dado);
        if (idTipoDado <= 0)
            return 0;

        const idx = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idTipoDado - 1));
        return DADOS_PROGRESION[idx];
    }

    private aplicarPasoDado(actual: number, pasos: number): number {
        if (actual <= 0 || pasos === 0)
            return actual;

        let idxActual = DADOS_PROGRESION.indexOf(actual);
        if (idxActual < 0)
            idxActual = 0;
        const idxFinal = Math.max(0, Math.min(DADOS_PROGRESION.length - 1, idxActual + pasos));
        return DADOS_PROGRESION[idxFinal];
    }

    private calcularExperienciaPorNivel(nivelAjustado: number): number {
        const nivel = Math.max(0, Math.trunc(this.toNumber(nivelAjustado)));
        let acumulado = 0;
        for (let i = 0; i < nivel; i++)
            acumulado += i * 1000;
        return acumulado;
    }

    private calcularOroPorNep(nep: number): number {
        const valorNep = Math.max(0, Math.trunc(this.toNumber(nep)));
        const tabla: Record<number, number> = {
            1: 0,
            2: 900,
            3: 2700,
            4: 5400,
            5: 9000,
            6: 13000,
            7: 19000,
            8: 27000,
            9: 36000,
            10: 49000,
            11: 66000,
            12: 88000,
            13: 110000,
            14: 150000,
            15: 200000,
            16: 260000,
            17: 340000,
            18: 440000,
            19: 580000,
            20: 760000,
        };
        if (valorNep <= 20)
            return tabla[valorNep] || 0;
        return Math.round(760000 * (1.3 * (valorNep - 20)));
    }

    private obtenerMinimoCaracteristicaPorPlantillas(key: CaracteristicaKey): number {
        return this.estadoFlujo.plantillas.seleccionadas.reduce((maximo, plantilla) => {
            const valor = this.toNumber((plantilla?.Minimos_caracteristicas as Record<string, any>)?.[key]);
            if (valor <= 0)
                return maximo;
            return Math.max(maximo, valor);
        }, 0);
    }

    private recalcularDefensasYPresa(): void {
        const modTamanoCa = this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador);
        const modTamanoPresa = this.toNumber(this.personajeCreacion?.Raza?.Tamano?.Modificador_presa);
        const presaVarios = (this.personajeCreacion?.Presa_varios ?? [])
            .reduce((acc, mod) => acc + this.toNumber(mod?.Valor), 0);

        this.personajeCreacion.Ca = 10
            + this.toNumber(this.personajeCreacion.ModDestreza)
            + modTamanoCa
            + this.toNumber(this.personajeCreacion.Armadura_natural)
            + this.toNumber(this.personajeCreacion.Ca_desvio)
            + this.toNumber(this.personajeCreacion.Ca_varios);

        const ataqueBase = this.toNumber(this.personajeCreacion.Ataque_base);
        this.personajeCreacion.Presa = ataqueBase
            + this.toNumber(this.personajeCreacion.ModFuerza)
            + modTamanoPresa
            + presaVarios;
    }

    private agregarRacialPlantillaTexto(
        raciales: RacialDetalle[],
        texto: string,
        origen: string,
        prefijo: string
    ): void {
        const limpio = `${texto ?? ''}`.trim();
        if (!this.esTextoReglaValido(limpio))
            return;
        const nombreRacial = `${prefijo}: ${limpio}`.trim();
        const existe = raciales.some(r => this.normalizarTexto(r.Nombre) === this.normalizarTexto(nombreRacial));
        if (existe)
            return;

        const racial = createRacialPlaceholder(nombreRacial);
        racial.Origen = origen;
        raciales.push(racial);
    }

    private tieneRestriccionAlineamientoPlantilla(plantilla: Plantilla): boolean {
        if (this.toNumber(plantilla?.Alineamiento?.Prioridad?.Id_prioridad) <= 0)
            return false;

        const ejes = extraerEjesAlineamientoDesdeContrato(plantilla?.Alineamiento);
        return ejes.ley !== null || ejes.moral !== null;
    }

    private asegurarHabilidadDesdePlantilla(habilidadRef: Plantilla['Habilidades'][number]): Personaje['Habilidades'][number] | null {
        const idObjetivo = this.toNumber(habilidadRef?.Id_habilidad);
        const nombreObjetivo = `${habilidadRef?.Habilidad ?? ''}`.trim();

        if (idObjetivo > 0) {
            const existentePorId = this.personajeCreacion.Habilidades.find((h) => this.toNumber(h.Id) === idObjetivo);
            if (existentePorId)
                return existentePorId;
        }

        if (nombreObjetivo.length > 0) {
            const existentePorNombre = this.personajeCreacion.Habilidades
                .find((h) => this.normalizarTexto(h.Nombre) === this.normalizarTexto(nombreObjetivo));
            if (existentePorNombre)
                return existentePorNombre;
        }

        if (idObjetivo <= 0 || nombreObjetivo.length < 1)
            return null;

        const carKey = this.resolverCaracteristicaPorIdOTexto(
            this.toNumber(habilidadRef?.Id_caracteristica),
            `${habilidadRef?.Caracteristica ?? ''}`
        );
        const nuevaHabilidad: Personaje['Habilidades'][number] = {
            Id: idObjetivo,
            Nombre: nombreObjetivo,
            Clasea: false,
            Car: this.etiquetaCaracteristica(carKey, `${habilidadRef?.Caracteristica ?? ''}`),
            Mod_car: this.modificadorPorCaracteristica(carKey),
            Rangos: 0,
            Rangos_varios: 0,
            Extra: `${habilidadRef?.Extra ?? ''}`,
            Varios: `${habilidadRef?.Varios ?? ''}`,
            Custom: false,
            Soporta_extra: !!habilidadRef?.Soporta_extra,
            Extras: [],
            Bonos_varios: [],
        };
        this.personajeCreacion.Habilidades = [
            ...this.personajeCreacion.Habilidades,
            nuevaHabilidad,
        ].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
        return this.personajeCreacion.Habilidades.find((h) => this.toNumber(h.Id) === idObjetivo) ?? null;
    }

    private copiarRaciales(value: RacialDetalle[] | null | undefined): RacialDetalle[] {
        return normalizeRaciales(value)
            .map((r) => {
                const origen = `${r?.Origen ?? ''}`.trim();
                return {
                    ...r,
                    Nombre: `${r?.Nombre ?? ''}`.trim(),
                    Origen: origen.length > 0 ? origen : undefined,
                };
            })
            .filter((r) => this.normalizarTexto(r.Nombre).length > 0);
    }

    private copiarSortilegas(value: AptitudSortilega[] | null | undefined): AptitudSortilega[] {
        const listado = Array.isArray(value)
            ? value
            : (value && typeof value === 'object' ? Object.values(value as any) : []);

        return listado
            .map((s: any) => ({
                Conjuro: { ...(s?.Conjuro ?? {}) } as any,
                Nivel_lanzador: this.toNumber(s?.Nivel_lanzador),
                Usos_diarios: `${s?.Usos_diarios ?? ''}`.trim(),
                Descripcion: `${s?.Descripcion ?? ''}`.trim(),
                Dgs_necesarios: this.toNumber(s?.Dgs_necesarios),
                Origen: `${s?.Origen ?? ''}`.trim(),
            }))
            .filter((s) => this.normalizarTexto(`${s?.Conjuro?.Nombre ?? ''}`).length > 0);
    }

    private copiarIdiomas(value: { Nombre: string; Descripcion: string; Secreto: boolean; Oficial: boolean; Origen?: string; }[] | null | undefined) {
        return (value ?? [])
            .map((i) => ({
                Nombre: `${i?.Nombre ?? ''}`.trim(),
                Descripcion: `${i?.Descripcion ?? ''}`.trim(),
                Secreto: !!i?.Secreto,
                Oficial: !!i?.Oficial,
                Origen: `${i?.Origen ?? ''}`.trim() || undefined,
            }))
            .filter(i => i.Nombre.length > 0);
    }

    private recalcularTipoYSubtiposDerivados(): void {
        const tipoBase = this.resolverTipoBaseRaza();
        const seleccionadas = this.estadoFlujo.plantillas.seleccionadas;
        const simulacion = simularEstadoPlantillas(tipoBase, seleccionadas);
        const tipoResultante = this.resolverTipoCriaturaResultante(
            tipoBase,
            simulacion.tipoCriaturaActualId,
            simulacion.tipoCriaturaActualNombre
        );
        const subtiposBase = this.copiarSubtipos(this.razaSeleccionada?.Subtipos ?? []);
        const subtiposResultantes = this.resolverSubtiposResultantes(subtiposBase, seleccionadas);
        const rasgosTipoConOrigen = this.asignarOrigenRasgosTipo(
            tipoResultante.Rasgos,
            tipoResultante.Nombre
        );

        this.personajeCreacion.Tipo_criatura = {
            ...tipoResultante,
            Rasgos: rasgosTipoConOrigen,
        };
        this.personajeCreacion.Subtipos = subtiposResultantes;
        this.estadoFlujo.plantillas.tipoCriaturaSimulada = {
            Id: this.toNumber(tipoResultante?.Id),
            Nombre: `${tipoResultante?.Nombre ?? '-'}`,
        };
        this.estadoFlujo.plantillas.licantropiaActiva = simulacion.licantropiaActiva;
        this.estadoFlujo.plantillas.heredadaActiva = simulacion.heredadaActiva || !!this.razaSeleccionada?.Heredada;
        this.personajeCreacion.Plantillas = seleccionadas.map(plantilla => this.mapPlantillaParaPersonaje(plantilla));
        this.sincronizarCaracteristicasPerdidasConTipoActual();
        if (this.estadoFlujo.caracteristicasGeneradas) {
            this.aplicarCaracteristicasFinalesDesdeBase();
        } else {
            this.aplicarPerdidasSinGenerador();
        }
    }

    private resolverTipoBaseRaza(): TipoCriatura {
        if (this.razaSeleccionada?.Tipo_criatura)
            return this.copiarTipoCriatura(this.razaSeleccionada.Tipo_criatura);
        if (this.personajeCreacion?.Tipo_criatura)
            return this.copiarTipoCriatura(this.personajeCreacion.Tipo_criatura);
        return this.crearTipoCriaturaFallback(0, '-');
    }

    private resolverTipoCriaturaResultante(tipoBase: TipoCriatura, tipoResultanteIdRaw: number, tipoResultanteNombreRaw: string): TipoCriatura {
        const tipoResultanteId = this.toNumber(tipoResultanteIdRaw);
        const tipoBaseId = this.toNumber(tipoBase?.Id);
        const tipoFinalId = tipoResultanteId > 0 ? tipoResultanteId : tipoBaseId;

        const fromCatalog = this.buscarTipoCriaturaPorId(tipoFinalId);
        if (fromCatalog)
            return this.copiarTipoCriatura(fromCatalog);

        if (tipoFinalId > 0 && tipoBaseId > 0 && tipoFinalId === tipoBaseId)
            return this.copiarTipoCriatura(tipoBase);

        const nombreResultado = `${tipoResultanteNombreRaw ?? ''}`.trim();
        if (nombreResultado.length > 0)
            return this.crearTipoCriaturaFallback(tipoFinalId, nombreResultado);

        if (tipoFinalId > 0)
            return this.crearTipoCriaturaFallback(tipoFinalId, `Tipo #${tipoFinalId}`);

        return this.copiarTipoCriatura(tipoBase);
    }

    private resolverSubtiposResultantes(subtiposBase: SubtipoRef[], seleccionadas: Plantilla[]): SubtipoRef[] {
        let actuales = this.copiarSubtipos(subtiposBase);
        seleccionadas.forEach((plantilla) => {
            const subtiposPlantilla = this.copiarSubtipos(plantilla?.Subtipos ?? []);
            if (subtiposPlantilla.length > 0)
                actuales = subtiposPlantilla;
        });
        return actuales;
    }

    private buscarTipoCriaturaPorId(idTipo: number): TipoCriatura | null {
        const id = this.toNumber(idTipo);
        if (id <= 0)
            return null;
        return this.catalogoTiposCriatura.find((tipo) => this.toNumber(tipo?.Id) === id) ?? null;
    }

    private copiarTipoCriatura(tipo: TipoCriatura | null | undefined): TipoCriatura {
        if (!tipo)
            return this.crearTipoCriaturaFallback(0, '-');

        return {
            Id: this.toNumber(tipo.Id),
            Nombre: `${tipo.Nombre ?? '-'}`,
            Descripcion: `${tipo.Descripcion ?? ''}`,
            Manual: `${tipo.Manual ?? ''}`,
            Id_tipo_dado: this.toNumber(tipo.Id_tipo_dado),
            Tipo_dado: this.toNumber(tipo.Tipo_dado),
            Id_ataque: this.toNumber(tipo.Id_ataque),
            Id_fortaleza: this.toNumber(tipo.Id_fortaleza),
            Id_reflejos: this.toNumber(tipo.Id_reflejos),
            Id_voluntad: this.toNumber(tipo.Id_voluntad),
            Id_puntos_habilidad: this.toNumber(tipo.Id_puntos_habilidad),
            Come: this.toBooleanValue(tipo.Come),
            Respira: this.toBooleanValue(tipo.Respira),
            Duerme: this.toBooleanValue(tipo.Duerme),
            Recibe_criticos: this.toBooleanValue(tipo.Recibe_criticos),
            Puede_ser_flanqueado: this.toBooleanValue(tipo.Puede_ser_flanqueado),
            Pierde_constitucion: this.toBooleanValue(tipo.Pierde_constitucion),
            Limite_inteligencia: this.toNumber(tipo.Limite_inteligencia),
            Tesoro: `${tipo.Tesoro ?? ''}`,
            Id_alineamiento: this.toNumber(tipo.Id_alineamiento),
            Rasgos: this.asignarOrigenRasgosTipo(tipo.Rasgos, tipo.Nombre),
            Oficial: this.toBooleanValue(tipo.Oficial),
        };
    }

    private crearTipoCriaturaFallback(id: number, nombre: string): TipoCriatura {
        return {
            Id: this.toNumber(id),
            Nombre: `${nombre ?? '-'}`,
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
        };
    }

    private copiarSubtipos(value: SubtipoRef[] | null | undefined): SubtipoRef[] {
        return normalizeSubtipoRefArray(value)
            .map((subtipo) => ({
                Id: this.toNumber(subtipo?.Id),
                Nombre: `${subtipo?.Nombre ?? ''}`.trim(),
            }))
            .filter((subtipo) => subtipo.Nombre.length > 0 || subtipo.Id > 0);
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

    private toBooleanValue(value: any): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value === 1;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
        }
        return false;
    }

    private esCaracteristicaPerdida(key: CaracteristicaKey): boolean {
        const mapa = this.personajeCreacion?.Caracteristicas_perdidas ?? {};
        const valorMapa = this.toBooleanValue((mapa as Record<string, any>)?.[key]);
        if (key === 'Constitucion') {
            const legado = this.toBooleanValue(this.personajeCreacion?.Constitucion_perdida);
            return valorMapa || legado;
        }
        return valorMapa;
    }

    private setCaracteristicaPerdida(key: CaracteristicaKey, estado: any, _origen?: string): void {
        const valor = this.toBooleanValue(estado);
        const perdidasActuales = {
            ...this.personajeCreacion.Caracteristicas_perdidas,
            [key]: valor,
        };
        this.personajeCreacion.Caracteristicas_perdidas = perdidasActuales;

        if (key === 'Constitucion')
            this.personajeCreacion.Constitucion_perdida = valor;
    }

    private sincronizarAliasConstitucionPerdida(): void {
        this.personajeCreacion.Constitucion_perdida = this.esCaracteristicaPerdida('Constitucion');
        this.personajeCreacion.Caracteristicas_perdidas = {
            ...this.personajeCreacion.Caracteristicas_perdidas,
            Constitucion: this.personajeCreacion.Constitucion_perdida,
        };
    }

    private sincronizarCaracteristicasPerdidasConTipoActual(): void {
        const tipoActual = this.personajeCreacion?.Tipo_criatura;
        const pierdeConstitucion = this.toBooleanValue(tipoActual?.Pierde_constitucion);
        this.setCaracteristicaPerdida('Constitucion', pierdeConstitucion, 'tipo_criatura');
    }

    private aplicarPerdidasSinGenerador(): void {
        CARACTERISTICAS_KEYS.forEach((key) => {
            if (!this.esCaracteristicaPerdida(key))
                return;
            this.setValorCaracteristica(key, 0);
            this.setModCaracteristica(key, 0);
        });
        this.sincronizarAliasConstitucionPerdida();
    }

    private normalizarTexto(valor: string): string {
        return `${valor ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private asignarOrigenRaciales(raciales: RacialDetalle[], origen: string): RacialDetalle[] {
        const origenNormalizado = `${origen ?? ''}`.trim();
        if (origenNormalizado.length < 1)
            return raciales;
        return raciales.map((racial) => ({
            ...racial,
            Origen: `${racial?.Origen ?? ''}`.trim() || origenNormalizado,
        }));
    }

    private asignarOrigenSortilegas(sortilegas: AptitudSortilega[], origen: string): AptitudSortilega[] {
        const origenNormalizado = `${origen ?? ''}`.trim();
        if (origenNormalizado.length < 1)
            return sortilegas;
        return sortilegas.map((sortilega) => ({
            ...sortilega,
            Origen: `${sortilega?.Origen ?? ''}`.trim() || origenNormalizado,
        }));
    }

    private asignarOrigenRasgosTipo(rasgos: any, nombreTipo: string): any[] {
        const origenTipo = `${nombreTipo ?? ''}`.trim();
        const listado = Array.isArray(rasgos)
            ? rasgos
            : (rasgos && typeof rasgos === 'object' ? Object.values(rasgos) : []);
        return listado.map((rasgo: any) => {
            const origen = `${rasgo?.Origen ?? rasgo?.origen ?? ''}`.trim();
            return {
                ...rasgo,
                Origen: origen.length > 0 ? origen : (origenTipo.length > 0 ? origenTipo : undefined),
            };
        });
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

    private setValorCaracteristica(key: CaracteristicaKey, valor: number): void {
        (this.personajeCreacion as Record<string, any>)[key] = this.toNumber(valor);
    }

    private setModCaracteristica(key: CaracteristicaKey, mod: number): void {
        const prop = `Mod${key}`;
        (this.personajeCreacion as Record<string, any>)[prop] = this.toNumber(mod);
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
            Caracteristicas_perdidas: {
                Fuerza: false,
                Destreza: false,
                Constitucion: false,
                Inteligencia: false,
                Sabiduria: false,
                Carisma: false,
            },
            Constitucion_perdida: false,
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
