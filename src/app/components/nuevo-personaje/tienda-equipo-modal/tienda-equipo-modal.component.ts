import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subject, Subscription, catchError, defer, of, switchMap, timer } from 'rxjs';
import { PersonajeCompraRequestDto } from 'src/app/interfaces/personajes-api';
import { EquipoService } from 'src/app/services/equipo.service';
import { textoPeso, textoPrecio, textoPrecioGenerico } from 'src/app/services/utils/equipo-texto';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import {
    ArticuloTienda,
    MEJORA_MAXIMA,
    PiezaTienda,
    ReglaDineroInicial,
    ResumenCompra,
    articuloDeObjeto,
    construirCompra,
    faltaEnPieza,
    nuevaPieza,
    precioEstimado,
    resumenCompra,
    sePuedeComprar,
    tirarOroInicial,
} from 'src/app/services/utils/tienda-equipo';

export type SeccionTienda = 'arma' | 'armadura' | 'municion' | 'objeto';

const SECCIONES: { valor: SeccionTienda; etiqueta: string; }[] = [
    { valor: 'arma', etiqueta: 'Armas' },
    { valor: 'armadura', etiqueta: 'Armaduras y escudos' },
    { valor: 'municion', etiqueta: 'Munición' },
    { valor: 'objeto', etiqueta: 'Objetos' },
];

const MAXIMO_OPCIONES = 60;

/**
 * La tienda del final de la creación: el último paso, con el personaje ya guardado (puntos de golpe y experiencia
 * hechos). Versión funcional sencilla con el patrón `selector-dialog` de la creación; el diseño definitivo se aprueba en
 * un lienzo (`docs/publica/OBJETOS_FRONT.md`, «Las compras»). Los precios son una estimación con las reglas de la API,
 * que es la que manda al guardar.
 */
@Component({
    selector: 'app-tienda-equipo-modal',
    templateUrl: './tienda-equipo-modal.component.html',
    styleUrls: ['./tienda-equipo-modal.component.sass'],
    standalone: false
})
export class TiendaEquipoModalComponent implements OnInit, OnChanges, OnDestroy {
    @Input() regla!: ReglaDineroInicial;
    /** Armas, armaduras y munición; los objetos se buscan en la API (catálogo grande). */
    @Input() articulos: ArticuloTienda[] = [];
    /** Para el conjuro de las pociones, pergaminos y varitas. */
    @Input() conjuros: { Id: number; Nombre: string; }[] = [];
    @Input() guardando = false;
    @Input() error = '';
    @Output() confirmar = new EventEmitter<PersonajeCompraRequestDto>();
    @Output() omitir = new EventEmitter<void>();

    readonly secciones = SECCIONES;
    readonly mejoras = Array.from({ length: MEJORA_MAXIMA + 1 }, (_, i) => i);
    readonly textoPrecio = textoPrecio;
    readonly textoPrecioGenerico = textoPrecioGenerico;
    readonly textoPeso = textoPeso;
    readonly precioEstimado = precioEstimado;
    readonly faltaEnPieza = faltaEnPieza;

    seccion: SeccionTienda = 'arma';
    busqueda = '';
    dineroInicial = 0;
    piezas: PiezaTienda[] = [];
    objetos: ArticuloTienda[] = [];
    cargandoObjetos = false;
    errorObjetos = '';

    private readonly busquedaObjetos$ = new Subject<{ q: string; espera: number; }>();
    private suscripcion: Subscription | null = null;

    constructor(private equipoSvc: EquipoService) { }

    ngOnInit(): void {
        this.suscripcion = this.busquedaObjetos$.pipe(
            switchMap(({ q, espera }) => {
                this.cargandoObjetos = true;
                this.errorObjetos = '';
                const pedir = defer(() => this.equipoSvc.getObjetos({ q: q || null, limit: 100, offset: 0 })).pipe(
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
        });
        this.busquedaObjetos$.next({ q: '', espera: 0 });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['regla'] && this.regla)
            this.dineroInicial = this.regla.sugerido;
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }

    get resumen(): ResumenCompra {
        return resumenCompra(this.dineroInicial, this.piezas, this.regla);
    }

    /** Lo que se ofrece en la sección elegida: lo que se puede comprar y encaja con la búsqueda. */
    get opciones(): ArticuloTienda[] {
        const texto = normalizarTexto(this.busqueda, true);
        const fuente = this.seccion === 'objeto' ? this.objetos : this.articulos.filter((articulo) => articulo.tipo === this.seccion);
        return fuente
            .filter((articulo) => sePuedeComprar(articulo))
            .filter((articulo) => this.seccion === 'objeto' || texto.length < 1
                || normalizarTexto(articulo.nombre, true).includes(texto)
                || normalizarTexto(articulo.categoria, true).includes(texto))
            .slice(0, MAXIMO_OPCIONES);
    }

    get hayHomebrew(): boolean {
        return this.piezas.some((pieza) => !pieza.articulo.oficial);
    }

    get piezasIncompletas(): boolean {
        return this.piezas.some((pieza) => faltaEnPieza(pieza) !== null);
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
        if (this.piezasIncompletas)
            return 'Completa las piezas marcadas.';
        return null;
    }

    get puedeTirar(): boolean {
        return this.regla?.modo === 'dados' && !this.guardando;
    }

    cambiarSeccion(seccion: SeccionTienda): void {
        this.seccion = seccion;
        this.busqueda = '';
        if (seccion === 'objeto')
            this.busquedaObjetos$.next({ q: '', espera: 0 });
    }

    buscar(texto: string): void {
        this.busqueda = texto;
        if (this.seccion === 'objeto')
            this.busquedaObjetos$.next({ q: texto.trim(), espera: 300 });
    }

    tirarDados(): void {
        if (this.puedeTirar)
            this.dineroInicial = tirarOroInicial(this.regla);
    }

    cambiarDinero(valor: unknown): void {
        const numero = Number(valor);
        this.dineroInicial = Number.isFinite(numero) && numero >= 0 ? numero : 0;
    }

    anadir(articulo: ArticuloTienda): void {
        this.piezas = [...this.piezas, nuevaPieza(articulo)];
    }

    quitar(indice: number): void {
        this.piezas = this.piezas.filter((_, i) => i !== indice);
    }

    /** Cambia un dato de una pieza (la cantidad, la mejora, el conjuro…). */
    cambiarPieza(indice: number, cambios: Partial<PiezaTienda>): void {
        this.piezas = this.piezas.map((pieza, i) => i === indice ? { ...pieza, ...cambios } : pieza);
    }

    numero(valor: unknown, minimo: number): number {
        const numero = Math.trunc(Number(valor));
        return Number.isFinite(numero) ? Math.max(minimo, numero) : minimo;
    }

    /** Los conjuros que encajan con lo escrito en el campo del conjuro de un genérico. */
    conjurosPara(texto: string): { Id: number; Nombre: string; }[] {
        const buscado = normalizarTexto(texto, true);
        if (buscado.length < 2)
            return [];
        return this.conjuros.filter((conjuro) => normalizarTexto(conjuro.Nombre, true).includes(buscado)).slice(0, 30);
    }

    elegirConjuro(indice: number, nombre: string): void {
        const conjuro = this.conjuros.find((c) => c.Nombre === nombre);
        this.cambiarPieza(indice, { idConjuro: conjuro?.Id ?? null, nombreConjuro: nombre });
    }

    escribirConjuro(indice: number, texto: string): void {
        const conjuro = this.conjuros.find((c) => normalizarTexto(c.Nombre) === normalizarTexto(texto));
        this.cambiarPieza(indice, { idConjuro: conjuro?.Id ?? null, nombreConjuro: texto });
    }

    onConfirmar(): void {
        if (this.guardando || this.motivoNoComprar !== null)
            return;
        this.confirmar.emit(construirCompra(this.dineroInicial, this.piezas));
    }

    onOmitir(): void {
        if (!this.guardando)
            this.omitir.emit();
    }
}
