import { Observable, take, takeUntil } from 'rxjs';
import { ElementoDeCatalogo } from 'src/app/services/utils/error-catalogo';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { avisarErrorAlCargar, delCatalogo, textoSinPermisos } from './avisos-insercion';
import { ModoInsercion, confirmarCierreConCambios } from './insercion-marco.component';

export interface OpcionesEdicionDeCatalogo<T> {
    /** El nombre del catálogo (`services/utils/nombres-de-catalogo.ts`). */
    nombre: ElementoDeCatalogo;
    /** El `modo` del formulario (`crear` o `editar`), leído cada vez. */
    modo: () => ModoInsercion;
    /** El id de la entrada que se modifica (el `@Input` del formulario), leído cada vez. */
    id: () => unknown;
    /** El `GET` fresco de la entrada (la guía: no hidratar con la fila del listado). */
    obtener: (id: number) => Observable<T>;
    /** Rellena el formulario con la entrada. Al terminar, el formulario llama a `tomarPuntoDePartida()`. */
    hidratar: (entrada: T) => void;
    /** La foto del formulario para saber si hay cambios (normalmente, el cuerpo que se mandaría en `JSON`). */
    foto: () => string;
    destruir$: Observable<void>;
    /** Si no se puede traer la entrada. Sin él, el aviso de siempre («No se pudo cargar la clase»). */
    alFallar?: (error: unknown) => void;
}

/**
 * Lo común del modo «Modificar» de una inserción (guía de modificaciones de catálogo): la misma pantalla que el alta,
 * con la entrada cargada por su `GET`, «Guardar cambios», saber si hay cambios sin guardar y preguntar antes de cerrar
 * la pestaña con cambios. También los textos del marco que cambian entre crear y modificar.
 *
 * Cada formulario la crea con lo suyo y la llama desde `ngOnInit` y `ngOnChanges` (`cargarSiHaceFalta`), al final de
 * su hidratación (`tomarPuntoDePartida`) y al reiniciarse tras un alta (`olvidar`).
 */
export class EdicionDeCatalogo<T> {
    /** Mientras se trae la entrada: el marco dice «Cargando …» y la acción principal espera. */
    cargando = false;
    private fotoInicial = '';
    private ultimoIdCargado = 0;

    constructor(private readonly opciones: OpcionesEdicionDeCatalogo<T>) { }

    get editando(): boolean {
        return this.opciones.modo() === 'editar';
    }

    /** El id de la entrada, entero (0 si no hay uno válido). */
    get id(): number {
        const valor = Number(this.opciones.id());
        return Number.isFinite(valor) ? Math.trunc(valor) : 0;
    }

    /**
     * Si otra entrada del catálogo ya tiene ese nombre (sin tildes ni mayúsculas): el aviso de la web antes del 409
     * `nombre_duplicado`. Al modificar, la propia no cuenta, como en la API.
     */
    nombreOcupado(existentes: readonly { Id?: unknown; Nombre?: string | null; }[], nombre: string): boolean {
        const objetivo = normalizarTexto(nombre);
        if (objetivo.length < 1)
            return false;
        const propia = this.editando ? this.id : 0;
        return existentes.some((entrada) => toInt(entrada?.Id, 0) !== propia && normalizarTexto(entrada?.Nombre ?? '') === objetivo);
    }

    /** Trae la entrada y rellena el formulario, una vez por id: al abrirlo y si cambia el id que recibe. */
    cargarSiHaceFalta(): void {
        if (!this.editando)
            return;
        const id = this.id;
        if (id <= 0 || this.cargando || this.ultimoIdCargado === id)
            return;

        this.cargando = true;
        this.opciones.obtener(id)
            .pipe(take(1), takeUntil(this.opciones.destruir$))
            .subscribe({
                next: (entrada) => {
                    this.opciones.hidratar(entrada);
                    this.ultimoIdCargado = id;
                    this.cargando = false;
                },
                error: (error) => {
                    this.cargando = false;
                    if (this.opciones.alFallar)
                        this.opciones.alFallar(error);
                    else
                        void avisarErrorAlCargar(this.opciones.nombre, error);
                },
            });
    }

    /** Lo que hay ahora en el formulario pasa a ser «sin cambios» (tras hidratar y tras guardar). */
    tomarPuntoDePartida(): void {
        this.fotoInicial = this.opciones.foto();
    }

    /** Tras un alta, el formulario vuelve a estar vacío: se olvida la entrada cargada. */
    olvidar(): void {
        this.fotoInicial = '';
        this.ultimoIdCargado = 0;
    }

    get hayCambios(): boolean {
        if (!this.editando || this.cargando)
            return false;
        return this.opciones.foto() !== this.fotoInicial;
    }

    /** Antes de cerrar la pestaña: con cambios, la pregunta de siempre. `true` si se puede cerrar. */
    async confirmarSalida(): Promise<boolean> {
        if (!this.editando || !this.hayCambios)
            return true;
        return confirmarCierreConCambios(delCatalogo(this.opciones.nombre));
    }

    /** «Crear idioma» / «Guardar cambios»; mientras guarda, «Creando idioma…» / «Guardando cambios…» (con «…», como el marco). */
    textoAccion(guardando: boolean): string {
        if (guardando)
            return this.editando ? 'Guardando cambios…' : `Creando ${this.opciones.nombre.singular}…`;
        return this.editando ? 'Guardar cambios' : `Crear ${this.opciones.nombre.singular}`;
    }

    /** `[cargando]` del marco: «Cargando idioma…» mientras se trae la entrada; si no, nada. */
    get textoCargando(): string {
        return this.cargando ? `Cargando ${this.opciones.nombre.singular}…` : '';
    }

    /**
     * `[avisoPermisos]` del marco: sin permiso, «No tienes permisos para modificar idiomas.» (o «crear»); con permiso o
     * mientras se trae la entrada, nada.
     */
    avisoPermisos(puedeGuardar: boolean): string {
        return this.cargando || puedeGuardar ? '' : textoSinPermisos(this.opciones.nombre, this.editando);
    }
}
