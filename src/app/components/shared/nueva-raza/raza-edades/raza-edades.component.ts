import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CategoriaEdadCatalogo } from 'src/app/interfaces/raza-catalogos';
import { Tamano } from 'src/app/interfaces/tamaño';
import { CategoriaEdadService } from 'src/app/services/categoria-edad.service';
import { mensajeDeError } from 'src/app/services/utils/error-api';
import {
    CARACTERISTICAS_EDAD,
    CaracteristicaEdad,
    EdadesDeRaza,
    FilaCategoriaEdad,
    FilaPasoEdad,
    VELOCIDADES_EDAD,
    VelocidadEdad,
    categoriaVacia,
    pasoAlEmpezar,
} from 'src/app/services/utils/raza-edades-formulario';
import { SOLO_PNJ, textoNepDePaso, textoRangoEdad } from 'src/app/services/utils/razas-por-edades';
import { toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { USOS_SORTILEGA_INICIALES } from 'src/app/services/utils/texto-sin-especificar';
import { OpcionCatalogo, nombreDeOpcion } from '../../catalogo-buscador/catalogo-buscador.component';

/** Las etiquetas cortas de las puntuaciones y las velocidades, como en el paso «Valores». */
const ETIQUETA_CARACTERISTICA: Record<CaracteristicaEdad, string> = {
    fuerza: 'Fue', destreza: 'Des', constitucion: 'Con', inteligencia: 'Int', sabiduria: 'Sab', carisma: 'Car',
};
const ETIQUETA_VELOCIDAD: Record<VelocidadEdad, string> = {
    correr: 'Correr', nadar: 'Nadar', volar: 'Volar', trepar: 'Trepar', excavar: 'Excavar',
};

type CampoNumerico = Exclude<keyof FilaCategoriaEdad, 'uid' | 'raciales' | 'sortilegas' | 'ataques_naturales' | 'reduccion_dano' | 'resistencia_conjuros' | 'resistencia_energia'>;
type CampoTexto = 'ataques_naturales' | 'reduccion_dano' | 'resistencia_conjuros' | 'resistencia_energia';
/** Los campos que pueden quedar vacíos: sin tope, sin ajuste (solo PNJ) o sin VD. */
const CAMPOS_ANULABLES = new Set<string>(['edad_hasta', 'ajuste_nivel', 'vd']);

/**
 * El paso «Edades» de la inserción de razas (hito 3 del roadmap de inserciones, 2026-10-31): el interruptor «La raza
 * crece por edades», las categorías del catálogo con sus cifras (filas repetibles), lo que se gana en cada una (raciales
 * y sortílegas, con `<app-catalogo-buscador>`) y los pasos que elige el personaje. Edita en su sitio las filas de
 * `edades` (las de `nueva-raza`, que las manda en el cuerpo) y avisa con `cambio`. Una categoría nueva del catálogo se
 * crea aquí mismo (`POST /categorias-edad/add`). Guía: `docs/guias-estilo/GUIA_ESTILO_INSERCIONES.md`.
 */
@Component({
    selector: 'app-raza-edades',
    templateUrl: './raza-edades.component.html',
    styleUrls: ['./raza-edades.component.sass'],
    standalone: false,
})
export class RazaEdadesComponent {
    @Input() edades: EdadesDeRaza = { categorias: [], pasos: [] };
    @Input() porEdades = false;
    @Output() porEdadesChange = new EventEmitter<boolean>();
    @Input() categoriasCatalogo: CategoriaEdadCatalogo[] = [];
    @Input() tamanos: Tamano[] = [];
    @Input() maniobrabilidades: { Id: number; Nombre: string; }[] = [];
    @Input() opcionesRaciales: OpcionCatalogo[] = [];
    @Input() opcionesConjuros: OpcionCatalogo[] = [];
    @Input() opcionesManuales: OpcionCatalogo[] = [];
    /** Si la raza lanza conjuros como una clase (`Lanzamiento racial`): el nivel de cada edad va con ella. */
    @Input() lanzaComoClase = false;
    @Input() puedeCrearCategoria = false;
    /** El error de las edades: el de la API (con `field` `categorias_edad…` o `pasos_edad…`) o el de la comprobación. */
    @Input() error: string | null = null;
    @Output() cambio = new EventEmitter<void>();
    @Output() copiarPrimeraEdad = new EventEmitter<void>();
    @Output() categoriaCreada = new EventEmitter<CategoriaEdadCatalogo>();

    readonly caracteristicas = CARACTERISTICAS_EDAD;
    readonly velocidades = VELOCIDADES_EDAD;
    readonly etiquetaCaracteristica = ETIQUETA_CARACTERISTICA;
    readonly etiquetaVelocidad = ETIQUETA_VELOCIDAD;
    readonly soloPnj = SOLO_PNJ;

    nuevaCategoriaVisible = false;
    nuevaCategoria = { nombre: '', orden_tipico: 13, id_manual: 0, pagina: 0, oficial: false };
    creandoCategoria = false;
    errorNuevaCategoria = '';

    constructor(private categoriaEdadSvc: CategoriaEdadService) { }

    get categorias(): FilaCategoriaEdad[] {
        return this.edades.categorias;
    }

    get pasos(): FilaPasoEdad[] {
        return this.edades.pasos;
    }

    alternarPorEdades(activo: boolean): void {
        this.porEdadesChange.emit(activo);
    }

    // --- Categorías -----------------------------------------------------------------------------------------------

    nombreCategoria(idCategoria: number): string {
        return this.categoriasCatalogo.find((categoria) => categoria.Id === toInt(idCategoria))?.Nombre ?? 'Sin elegir';
    }

    /** Las categorías del catálogo que puede elegir una fila: la suya y las que la raza aún no usa. */
    categoriasLibres(fila: FilaCategoriaEdad): CategoriaEdadCatalogo[] {
        const usadas = new Set(this.categorias.filter((otra) => otra !== fila).map((otra) => toInt(otra.id_categoria_edad)));
        return this.categoriasCatalogo.filter((categoria) => !usadas.has(categoria.Id));
    }

    textoAnios(fila: FilaCategoriaEdad): string {
        return textoRangoEdad({ desde: toInt(fila.edad_desde), hasta: fila.edad_hasta === null ? null : toInt(fila.edad_hasta) }, 'corta');
    }

    agregarCategoria(): void {
        const anterior = this.categorias[this.categorias.length - 1] ?? null;
        if (anterior && anterior.edad_hasta === null)
            anterior.edad_hasta = toInt(anterior.edad_desde);
        this.edades.categorias = [...this.categorias, categoriaVacia(anterior)];
        this.cambio.emit();
    }

    quitarCategoria(indice: number): void {
        const fila = this.categorias[indice];
        if (!fila)
            return;
        this.edades.categorias = this.categorias.filter((_, i) => i !== indice);
        // Sus pasos se van con ella (la API no deja un paso sin su categoría).
        if (toInt(fila.id_categoria_edad) > 0)
            this.edades.pasos = this.pasos.filter((paso) => toInt(paso.id_categoria_edad) !== toInt(fila.id_categoria_edad));
        this.cambio.emit();
    }

    /** Elegir otra categoría del catálogo para una fila: sus pasos la siguen. */
    elegirCategoria(fila: FilaCategoriaEdad, idCategoria: number): void {
        const anterior = toInt(fila.id_categoria_edad);
        fila.id_categoria_edad = toInt(idCategoria);
        if (anterior > 0)
            this.pasos.filter((paso) => toInt(paso.id_categoria_edad) === anterior).forEach((paso) => paso.id_categoria_edad = fila.id_categoria_edad);
        this.cambio.emit();
    }

    numero(fila: FilaCategoriaEdad, campo: CampoNumerico, valor: unknown): void {
        const texto = `${valor ?? ''}`.trim();
        if (CAMPOS_ANULABLES.has(campo) && texto === '')
            (fila as any)[campo] = null;
        else
            (fila as any)[campo] = campo === 'espacio' || campo === 'vd' ? toNumber(texto) : toInt(texto);
        this.cambio.emit();
    }

    texto(fila: FilaCategoriaEdad, campo: CampoTexto, valor: unknown): void {
        fila[campo] = `${valor ?? ''}`;
        this.cambio.emit();
    }

    // --- Lo que gana en cada categoría --------------------------------------------------------------------------

    idsRaciales(fila: FilaCategoriaEdad): number[] {
        return fila.raciales.map((racial) => racial.id_racial);
    }

    idsSortilegas(fila: FilaCategoriaEdad): number[] {
        return fila.sortilegas.map((sortilega) => sortilega.id_conjuro);
    }

    agregarRacial(fila: FilaCategoriaEdad, idRacial: number): void {
        const id = toInt(idRacial);
        if (id <= 0 || fila.raciales.some((racial) => racial.id_racial === id))
            return;
        fila.raciales = [...fila.raciales, { id_racial: id, nombre: nombreDeOpcion(this.opcionesRaciales, id), valor: '' }];
        this.cambio.emit();
    }

    valorRacial(fila: FilaCategoriaEdad, indice: number, valor: unknown): void {
        fila.raciales[indice].valor = `${valor ?? ''}`;
        this.cambio.emit();
    }

    quitarRacial(fila: FilaCategoriaEdad, indice: number): void {
        fila.raciales = fila.raciales.filter((_, i) => i !== indice);
        this.cambio.emit();
    }

    agregarSortilega(fila: FilaCategoriaEdad, idConjuro: number): void {
        const id = toInt(idConjuro);
        if (id <= 0 || fila.sortilegas.some((sortilega) => sortilega.id_conjuro === id))
            return;
        fila.sortilegas = [...fila.sortilegas, { id_conjuro: id, nombre: nombreDeOpcion(this.opcionesConjuros, id), usos_diarios: USOS_SORTILEGA_INICIALES, descripcion: '' }];
        this.cambio.emit();
    }

    textoSortilega(fila: FilaCategoriaEdad, indice: number, campo: 'usos_diarios' | 'descripcion', valor: unknown): void {
        fila.sortilegas[indice][campo] = `${valor ?? ''}`;
        this.cambio.emit();
    }

    quitarSortilega(fila: FilaCategoriaEdad, indice: number): void {
        fila.sortilegas = fila.sortilegas.filter((_, i) => i !== indice);
        this.cambio.emit();
    }

    // --- Pasos ----------------------------------------------------------------------------------------------------

    /** Las categorías que ya tiene la raza, para el paso. */
    get categoriasDeLaRaza(): FilaCategoriaEdad[] {
        return this.categorias.filter((fila) => toInt(fila.id_categoria_edad) > 0);
    }

    /** Lo que se lee del paso: «NEP 11» si es jugable (él y su categoría tienen ajuste), si no «Solo PNJ». */
    nivelDelPaso(paso: FilaPasoEdad): string {
        const categoria = this.categorias.find((fila) => toInt(fila.id_categoria_edad) === toInt(paso.id_categoria_edad));
        const jugable = paso.ajuste_nivel !== null && !!categoria && categoria.ajuste_nivel !== null;
        return textoNepDePaso(jugable ? toInt(paso.dgs) + toInt(paso.ajuste_nivel) : null);
    }

    agregarPaso(): void {
        const ultima = this.categoriasDeLaRaza[this.categoriasDeLaRaza.length - 1];
        const ultimo = [...this.pasos].sort((a, b) => toInt(a.edad) - toInt(b.edad))[this.pasos.length - 1];
        const nuevo = ultima ? pasoAlEmpezar(ultima) : pasoAlEmpezar(categoriaVacia());
        if (ultimo && toInt(nuevo.edad) <= toInt(ultimo.edad))
            nuevo.edad = toInt(ultimo.edad) + 1;
        this.edades.pasos = [...this.pasos, nuevo];
        this.cambio.emit();
    }

    /** Un paso al empezar cada categoría que aún no tenga ninguno (con sus DG, su ajuste y su armadura natural). */
    agregarPasosQueFaltan(): void {
        const conPaso = new Set(this.pasos.map((paso) => toInt(paso.id_categoria_edad)));
        const nuevos = this.categoriasDeLaRaza.filter((fila) => !conPaso.has(toInt(fila.id_categoria_edad))).map(pasoAlEmpezar);
        if (nuevos.length < 1)
            return;
        this.edades.pasos = [...this.pasos, ...nuevos].sort((a, b) => toInt(a.edad) - toInt(b.edad));
        this.cambio.emit();
    }

    get faltanPasos(): boolean {
        const conPaso = new Set(this.pasos.map((paso) => toInt(paso.id_categoria_edad)));
        return this.categoriasDeLaRaza.some((fila) => !conPaso.has(toInt(fila.id_categoria_edad)));
    }

    numeroPaso(paso: FilaPasoEdad, campo: 'edad' | 'id_categoria_edad' | 'dgs' | 'ajuste_nivel' | 'armadura_natural', valor: unknown): void {
        const texto = `${valor ?? ''}`.trim();
        if (campo === 'ajuste_nivel')
            paso.ajuste_nivel = texto === '' ? null : toInt(texto);
        else
            paso[campo] = toInt(texto);
        this.cambio.emit();
    }

    quitarPaso(indice: number): void {
        this.edades.pasos = this.pasos.filter((_, i) => i !== indice);
        this.cambio.emit();
    }

    trackByUid(_: number, fila: { uid: string; }): string {
        return fila.uid;
    }

    // --- Una categoría nueva del catálogo -------------------------------------------------------------------------

    abrirNuevaCategoria(): void {
        const mayor = Math.max(0, ...this.categoriasCatalogo.map((categoria) => categoria.Orden_tipico));
        this.nuevaCategoria = { nombre: '', orden_tipico: mayor + 1, id_manual: 0, pagina: 0, oficial: false };
        this.errorNuevaCategoria = '';
        this.nuevaCategoriaVisible = true;
    }

    cerrarNuevaCategoria(): void {
        this.nuevaCategoriaVisible = false;
        this.errorNuevaCategoria = '';
    }

    async crearCategoria(): Promise<void> {
        const { nombre, orden_tipico, id_manual, pagina, oficial } = this.nuevaCategoria;
        if (`${nombre}`.trim().length < 1 || toInt(orden_tipico) < 1 || toInt(id_manual) < 1) {
            this.errorNuevaCategoria = 'Escribe el nombre, su orden entre las categorías (1 o más) y el manual.';
            return;
        }
        this.creandoCategoria = true;
        this.errorNuevaCategoria = '';
        try {
            const { categoria } = await this.categoriaEdadSvc.crearCategoriaEdad({
                categoria: { nombre: `${nombre}`.trim(), orden_tipico: toInt(orden_tipico), id_manual: toInt(id_manual), pagina: toInt(pagina), oficial },
            });
            this.categoriaCreada.emit(categoria);
            this.nuevaCategoriaVisible = false;
        } catch (error: unknown) {
            this.errorNuevaCategoria = mensajeDeError(error, 'No se ha podido crear la categoría de edad.');
        } finally {
            this.creandoCategoria = false;
        }
    }
}
