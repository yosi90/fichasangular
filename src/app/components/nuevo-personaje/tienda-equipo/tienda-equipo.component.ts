import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subject, Subscription, catchError, defer, forkJoin, of, switchMap, take, timer } from 'rxjs';
import { DatoFranja } from 'src/app/components/detalles/ficha';
import { AplicacionMaterial, EncantamientoDetalle, FiltrosObjetos, MaterialDetalle } from 'src/app/interfaces/equipo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCompraRequestDto } from 'src/app/interfaces/personajes-api';
import { EquipoService } from 'src/app/services/equipo.service';
import { textoPeso, textoPrecio, textoPrecioGenerico } from 'src/app/services/utils/equipo-texto';
import { ConjuroParaElLibro, LibroTienda, PAGINAS_POR_LIBRO } from 'src/app/services/utils/libro-conjuros';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { destinoEnTablist } from 'src/app/services/utils/teclado';
import {
    ArticuloTienda,
    CopiaLibro,
    MaterialAplicable,
    OrigenPestanaTienda,
    POLITICA_TIENDA_LIBRE,
    PestanaTienda,
    PiezaTienda,
    PoliticaTienda,
    ReglaDineroInicial,
    ResumenCompra,
    aptitudesAplicables,
    articuloDeObjeto,
    construirCompra,
    materialesAplicables,
    motivoPiezaNoValida,
    notaPoliticaTienda,
    nuevaPieza,
    pestanasTienda,
    pesoEstimado,
    precioEstimado,
    resumenCompra,
    seConfiguraAMedida,
    sePuedeComprar,
    textoCarga,
    tirarOroInicial,
} from 'src/app/services/utils/tienda-equipo';

const MAXIMO_OPCIONES = 60;
/** Los conjuros que se enseñan a la vez en «Conjuros para el libro» (el mago puede tener cientos): se busca o se filtra por nivel. */
const MAXIMO_CONJUROS = 150;

/** Una fila de «Conjuros para el libro»: el conjuro con su precio y el libro (la clase) al que va. */
export interface FilaLibro {
    libro: LibroTienda;
    item: ConjuroParaElLibro;
}

/** Si la copia es la de ese conjuro en ese libro. */
function esLaCopia(copia: CopiaLibro, libro: LibroTienda, item: ConjuroParaElLibro): boolean {
    return copia.idClase === libro.idClase && copia.conjuro.Id === item.conjuro.Id;
}

/** La pieza que se está configurando: una del carro (`indice`) o una nueva del catálogo (`null`). */
interface PiezaEnConfiguracion {
    indice: number | null;
    pieza: PiezaTienda;
    materiales: MaterialAplicable[];
    aptitudes: EncantamientoDetalle[];
    disponible: number;
}

/**
 * La tienda, último paso de la creación («Equipo»), con el personaje ya guardado (puntos de golpe y experiencia
 * hechos). Lienzo aprobado el 2026-10-26: franja con el dinero, catálogo por pestañas con buscador a la izquierda, «Lo
 * que compra» a la derecha y, al configurar una pieza, una ventana con material, mejora y aptitudes. Los precios son una
 * estimación con las reglas de la API, que es la que manda al guardar (`docs/publica/OBJETOS_FRONT.md`, «Las compras»).
 * Si alguna de sus clases tiene libro y la campaña lo deja, la pestaña «Conjuros para el libro» (pantalla 6 del lienzo,
 * aprobada el 2026-10-26) copia conjuros al libro con el mismo dinero (`docs/publica/REGLAS_DE_CREACION.md`).
 */
@Component({
    selector: 'app-tienda-equipo',
    templateUrl: './tienda-equipo.component.html',
    styleUrls: ['./tienda-equipo.component.sass'],
    standalone: false
})
export class TiendaEquipoComponent implements OnInit, OnChanges, OnDestroy {
    @Input() regla!: ReglaDineroInicial;
    /** Armas, armaduras y munición; los objetos se buscan en la API (catálogo grande). */
    @Input() articulos: ArticuloTienda[] = [];
    /** Para el conjuro de las pociones, pergaminos y varitas. */
    @Input() conjuros: { Id: number; Nombre: string; }[] = [];
    @Input() guardando = false;
    @Input() error = '';
    /** La pieza que señala el error de la API (`field: piezas[i]`), o `null`. */
    @Input() piezaConError: number | null = null;
    /** En una campaña que no admite homebrew: solo lo oficial (también en los objetos que se buscan en la API). */
    @Input() soloOficial = false;
    /** Lo que deja comprar la campaña (objetos mágicos, a medida y el precio por pieza); sin campaña, todo. */
    @Input() politica: PoliticaTienda = POLITICA_TIENDA_LIBRE;
    /** La capacidad de carga del personaje, para decir qué carga lleva. */
    @Input() capacidadCarga: Personaje['Capacidad_carga'] | null = null;
    /**
     * Los libros de conjuros de sus clases (las que tienen `Conjuros.Libro`), con lo que se puede copiar a cada uno
     * (`conjurosAniadiblesAlLibro`) y su precio; vacío si ninguna tiene libro.
     */
    @Input() libros: LibroTienda[] = [];
    /** El conjuro copiado que señala el error de la API (`field: conjurosLibro[i]`), o `null`. */
    @Input() copiaConError: number | null = null;
    @Output() confirmar = new EventEmitter<PersonajeCompraRequestDto>();
    @Output() omitir = new EventEmitter<void>();

    readonly textoPrecio = textoPrecio;
    readonly textoPrecioGenerico = textoPrecioGenerico;
    readonly textoPeso = textoPeso;
    readonly precioEstimado = precioEstimado;
    readonly pesoEstimado = pesoEstimado;
    readonly seConfiguraAMedida = seConfiguraAMedida;

    pestanas: PestanaTienda[] = pestanasTienda({ politica: POLITICA_TIENDA_LIBRE });
    seccion: OrigenPestanaTienda = 'arma';
    /** La pieza que señaló la API; deja de señalarse en cuanto cambia la compra. */
    piezaSenalada: number | null = null;
    /** El conjuro copiado que señaló la API; igual. */
    copiaSenalada: number | null = null;
    busqueda = '';
    dineroInicial = 0;
    piezas: PiezaTienda[] = [];
    /** Los conjuros que copia al libro en esta compra. */
    copias: CopiaLibro[] = [];
    /** El nivel de conjuro por el que se filtra «Conjuros para el libro»; `null`, todos. */
    nivelLibro: number | null = null;
    readonly paginasPorLibro = PAGINAS_POR_LIBRO;
    objetos: ArticuloTienda[] = [];
    cargandoObjetos = false;
    errorObjetos = '';
    configurando: PiezaEnConfiguracion | null = null;
    materiales: MaterialDetalle[] = [];
    aptitudes: EncantamientoDetalle[] = [];
    aplicaciones: AplicacionMaterial[] = [];

    private readonly busquedaObjetos$ = new Subject<{ q: string; espera: number; especificas: boolean; }>();
    private suscripciones: Subscription[] = [];

    constructor(private equipoSvc: EquipoService) { }

    ngOnInit(): void {
        this.suscripciones.push(this.busquedaObjetos$.pipe(
            switchMap(({ q, espera, especificas }) => {
                this.cargandoObjetos = true;
                this.errorObjetos = '';
                const filtros: FiltrosObjetos = { q: q || null, limit: 100, offset: 0, especificas };
                if (!this.politica.objetosMagicos)
                    filtros.categoria = 'mundano';
                const pedir = defer(() => this.equipoSvc.getObjetos(filtros)).pipe(
                    catchError(() => {
                        this.errorObjetos = 'No se pudieron cargar los objetos.';
                        return of({ items: [], total: 0, hayMas: false });
                    }),
                );
                return espera > 0 ? timer(espera).pipe(switchMap(() => pedir)) : pedir;
            }),
        ).subscribe((pagina) => {
            this.objetos = pagina.items.map((objeto) => articuloDeObjeto(objeto));
            this.cargandoObjetos = false;
        }));
        // Lo que hace falta para configurar una pieza a medida: los materiales con sus costes, las aptitudes y a qué
        // piezas se aplica cada coste. Sin ellos, solo se puede elegir la mejora.
        this.suscripciones.push(forkJoin({
            materiales: this.equipoSvc.getMateriales().pipe(take(1), catchError(() => of([] as MaterialDetalle[]))),
            aptitudes: this.equipoSvc.getEncantamientos().pipe(take(1), catchError(() => of([] as EncantamientoDetalle[]))),
            aplicaciones: this.equipoSvc.getCatalogos().pipe(take(1), catchError(() => of(null))),
        }).subscribe(({ materiales, aptitudes, aplicaciones }) => {
            this.materiales = materiales;
            this.aptitudes = aptitudes;
            this.aplicaciones = aplicaciones?.Aplicaciones_material ?? [];
        }));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['regla'] && this.regla)
            this.dineroInicial = this.regla.sugerido;
        if (changes['piezaConError'])
            this.piezaSenalada = this.piezaConError;
        if (changes['copiaConError'])
            this.copiaSenalada = this.copiaConError;
        if (changes['politica'] || changes['libros']) {
            this.pestanas = pestanasTienda({ politica: this.politica ?? POLITICA_TIENDA_LIBRE, libro: (this.libros ?? []).length > 0 });
            if (!this.pestanas.some((pestana) => pestana.id === this.seccion))
                this.cambiarSeccion('arma');
            if (!this.hayPestanaLibro)
                this.copias = [];
        }
    }

    ngOnDestroy(): void {
        this.suscripciones.forEach((suscripcion) => suscripcion.unsubscribe());
    }

    get resumen(): ResumenCompra {
        return resumenCompra(this.dineroInicial, this.piezas, this.regla, this.copias);
    }

    get hayPestanaLibro(): boolean {
        return this.pestanas.some((pestana) => pestana.id === 'libro');
    }

    /** Los niveles de conjuro que hay para copiar (los botones del filtro). */
    get nivelesLibro(): number[] {
        return [...new Set((this.libros ?? []).flatMap((libro) => libro.conjuros.map((item) => item.nivel)))].sort((a, b) => a - b);
    }

    /** Todo lo que se puede copiar que encaja con la búsqueda y el nivel (sin el tope de filas). */
    get filasLibroFiltradas(): FilaLibro[] {
        return (this.libros ?? [])
            .flatMap((libro) => libro.conjuros.map((item) => ({ libro, item })))
            .filter(({ item }) => this.nivelLibro === null || item.nivel === this.nivelLibro)
            .filter(({ item }) => this.encajaConLaBusqueda(item.conjuro?.Nombre, item.conjuro?.Escuela?.Nombre));
    }

    /** Lo que se enseña en «Conjuros para el libro». */
    get filasLibro(): FilaLibro[] {
        return this.filasLibroFiltradas.slice(0, MAXIMO_CONJUROS);
    }

    /** Las páginas usadas de cada libro: las de los conjuros que ya tiene más las de los que copia. */
    paginasDe(libro: LibroTienda): number {
        return libro.paginasUsadas + this.copias
            .filter((copia) => copia.idClase === libro.idClase)
            .reduce((total, copia) => total + copia.precio.paginas, 0);
    }

    estaCopiado(libro: LibroTienda, item: ConjuroParaElLibro): boolean {
        return this.copias.some((copia) => esLaCopia(copia, libro, item));
    }

    /** Añade el conjuro a la compra o, si ya está, lo quita. */
    alternarCopia(fila: FilaLibro): void {
        this.copiaSenalada = null;
        if (this.estaCopiado(fila.libro, fila.item)) {
            this.copias = this.copias.filter((copia) => !esLaCopia(copia, fila.libro, fila.item));
            return;
        }
        this.copias = [...this.copias, { ...fila.item, idClase: fila.libro.idClase, clase: fila.libro.clase }];
    }

    quitarCopia(indice: number): void {
        this.copiaSenalada = null;
        this.copias = this.copias.filter((_, i) => i !== indice);
    }

    filtrarNivelLibro(nivel: number | null): void {
        this.nivelLibro = nivel;
    }

    get pestanaActual(): PestanaTienda {
        return this.pestanas.find((pestana) => pestana.id === this.seccion) ?? this.pestanas[0];
    }

    /** Lo que se ofrece en la pestaña elegida: lo que se puede comprar y encaja con la búsqueda. */
    get opciones(): ArticuloTienda[] {
        const desdeApi = this.seccion === 'objeto' || this.seccion === 'especifica';
        const fuente = desdeApi ? this.objetos : this.articulos.filter((articulo) => articulo.tipo === this.seccion);
        return fuente
            .filter((articulo) => sePuedeComprar(articulo) && (!this.soloOficial || articulo.oficial))
            .filter((articulo) => this.politica.objetosMagicos || !articulo.magico)
            .filter((articulo) => desdeApi || this.encajaConLaBusqueda(articulo.nombre, articulo.categoria))
            .slice(0, MAXIMO_OPCIONES);
    }

    /** Si alguno de los textos contiene la búsqueda (sin tildes ni mayúsculas); sin búsqueda, todo encaja. */
    private encajaConLaBusqueda(...textos: (string | null | undefined)[]): boolean {
        const busqueda = normalizarTexto(this.busqueda, true);
        return busqueda.length < 1 || textos.some((texto) => normalizarTexto(texto ?? '', true).includes(busqueda));
    }

    /** Las cifras del paso: el dinero, lo gastado, lo que queda, el peso y su carga (y las de otras pestañas). */
    get franja(): DatoFranja[] {
        const resumen = this.resumen;
        return [
            {
                etiqueta: 'Dinero inicial', valor: textoPrecio(this.dineroInicial),
                detalle: this.regla?.modo === 'riqueza' ? 'riqueza de su NEP' : this.regla?.modo === 'dados' ? `oro de ${this.regla.dados}` : null,
            },
            { etiqueta: 'Gastado', valor: textoPrecio(resumen.gastado) },
            { etiqueta: 'Te queda', valor: textoPrecio(resumen.queda) },
            { etiqueta: 'Peso', valor: textoPeso(resumen.peso), detalle: textoCarga(resumen.peso, this.capacidadCarga) || null },
            ...(this.hayPestanaLibro ? this.libros.map((libro) => ({
                etiqueta: this.libros.length > 1 ? `Páginas del libro (${libro.clase})` : 'Páginas del libro',
                valor: this.paginasDe(libro),
                detalle: `de ${PAGINAS_POR_LIBRO}`,
            })) : []),
        ];
    }

    get hayHomebrew(): boolean {
        return this.piezas.some((pieza) => !pieza.articulo.oficial) || this.copias.some((copia) => copia.conjuro?.Oficial === false);
    }

    /** Lo que lleva en la compra: piezas y conjuros copiados. */
    get cuantasCompras(): number {
        return this.piezas.length + this.copias.length;
    }

    /** Por qué no vale cada pieza (o `null`), en su orden. */
    get motivosPiezas(): (string | null)[] {
        return this.piezas.map((pieza) => motivoPiezaNoValida(pieza, this.politica));
    }

    /** Por qué no se puede comprar aún, o `null` si se puede. */
    get motivoNoComprar(): string | null {
        const resumen = this.resumen;
        if (!(this.dineroInicial >= 0))
            return 'Pon el dinero inicial.';
        if (!resumen.dentroDelTope)
            return `El dinero inicial no puede pasar de ${textoPrecio(this.regla.maximo)}.`;
        if (!resumen.alcanza)
            return 'No te llega el dinero para todo.';
        if (this.motivosPiezas.some((motivo) => motivo !== null))
            return 'Completa las piezas marcadas.';
        return null;
    }

    /** La nota del pie: lo que no se puede comprar o, si no, lo que la campaña limita y el homebrew. */
    get notaPie(): string {
        if (this.error)
            return this.error;
        return [
            this.motivoNoComprar && this.cuantasCompras > 0 ? this.motivoNoComprar : '',
            this.seccion === 'libro' ? 'Solo salen los conjuros que puedes lanzar y que no son de tus escuelas prohibidas ni están ya en tu libro.' : '',
            notaPoliticaTienda(this.politica),
            this.hayHomebrew ? 'Comprar algo homebrew hace homebrew al personaje.' : '',
        ].filter(Boolean).join(' ') || 'Comprar algo homebrew hace homebrew al personaje. La API comprueba los precios al guardar.';
    }

    get puedeTirar(): boolean {
        return this.regla?.modo === 'dados' && !this.guardando;
    }

    cambiarSeccion(seccion: OrigenPestanaTienda): void {
        this.seccion = seccion;
        this.busqueda = '';
        this.nivelLibro = null;
        if (seccion === 'objeto' || seccion === 'especifica')
            this.busquedaObjetos$.next({ q: '', espera: 0, especificas: seccion === 'especifica' });
    }

    /** Flechas, Inicio y Fin entre las pestañas (patrón `tablist`). */
    moverPestana(evento: KeyboardEvent): void {
        const indice = this.pestanas.findIndex((pestana) => pestana.id === this.seccion);
        const destino = destinoEnTablist(evento.key, indice, this.pestanas.length);
        if (destino === null)
            return;
        evento.preventDefault();
        const pestana = this.pestanas[destino];
        this.cambiarSeccion(pestana.id);
        const boton = (evento.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(`[data-pestana="${pestana.id}"]`);
        boton?.focus();
    }

    buscar(texto: string): void {
        this.busqueda = texto;
        if (this.seccion === 'objeto' || this.seccion === 'especifica')
            this.busquedaObjetos$.next({ q: texto.trim(), espera: 300, especificas: this.seccion === 'especifica' });
    }

    tirarDados(): void {
        if (this.puedeTirar)
            this.dineroInicial = tirarOroInicial(this.regla);
    }

    cambiarDinero(valor: unknown): void {
        const numero = Number(valor);
        this.dineroInicial = Number.isFinite(numero) && numero >= 0 ? numero : 0;
    }

    /** Añade una unidad tal cual; un genérico (poción, varita…) abre antes su configuración para elegir el conjuro. */
    anadir(articulo: ArticuloTienda): void {
        if (articulo.generico) {
            this.abrirConfiguracion(null, nuevaPieza(articulo));
            return;
        }
        this.piezaSenalada = null;
        this.piezas = [...this.piezas, nuevaPieza(articulo)];
    }

    /** Configura una pieza nueva del catálogo antes de añadirla. */
    configurarNueva(articulo: ArticuloTienda): void {
        this.abrirConfiguracion(null, nuevaPieza(articulo));
    }

    editarPieza(indice: number): void {
        const pieza = this.piezas[indice];
        if (pieza)
            this.abrirConfiguracion(indice, pieza);
    }

    quitar(indice: number): void {
        this.piezaSenalada = null;
        this.piezas = this.piezas.filter((_, i) => i !== indice);
    }

    /** Cambia un dato de una pieza (la cantidad, la mejora, el conjuro…). */
    cambiarPieza(indice: number, cambios: Partial<PiezaTienda>): void {
        this.piezaSenalada = null;
        this.piezas = this.piezas.map((pieza, i) => i === indice ? { ...pieza, ...cambios } : pieza);
    }

    guardarConfiguracion(pieza: PiezaTienda): void {
        const configurando = this.configurando;
        if (!configurando)
            return;
        this.piezaSenalada = null;
        this.piezas = configurando.indice === null
            ? [...this.piezas, pieza]
            : this.piezas.map((actual, i) => i === configurando.indice ? pieza : actual);
        this.configurando = null;
    }

    cancelarConfiguracion(): void {
        this.configurando = null;
    }

    onConfirmar(): void {
        if (this.guardando || this.motivoNoComprar !== null)
            return;
        this.confirmar.emit(construirCompra(this.dineroInicial, this.piezas, this.copias));
    }

    onOmitir(): void {
        if (!this.guardando)
            this.omitir.emit();
    }

    trackPestana(_indice: number, pestana: PestanaTienda): string {
        return pestana.id;
    }

    private abrirConfiguracion(indice: number | null, pieza: PiezaTienda): void {
        const yaCostaba = indice === null ? 0 : precioEstimado(this.piezas[indice]);
        this.configurando = {
            indice,
            pieza,
            materiales: materialesAplicables(pieza.articulo, this.materiales, this.aplicaciones)
                .filter((item) => !this.soloOficial || item.material.Oficial),
            aptitudes: aptitudesAplicables(pieza.articulo, this.aptitudes).filter((aptitud) => !this.soloOficial || aptitud.Oficial),
            // Lo que le queda más lo que ya costaba esta pieza.
            disponible: this.resumen.queda + yaCostaba,
        };
    }
}
