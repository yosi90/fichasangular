import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TipoVentaja, VentajaCuerpo, VentajaDetalle } from 'src/app/interfaces/ventaja';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { UserService } from 'src/app/services/user.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { nombreDeVentaja, nombreQueCambia } from 'src/app/services/utils/nombres-de-catalogo';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import {
    BANDERAS_AFECTA, BANDERAS_DA, BanderaVentaja, ValoresVentaja, cuerpoDeVentaja, valoresDeVentaja, valoresVaciosDeVentaja,
} from 'src/app/services/utils/ventaja-formulario';
import { OpcionCatalogo, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, camposSinPasos, entero, ErroresDeFormulario, OpcionesErroresDeFormulario } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl, vaciarControl } from '../insercion-marco/filas-repetibles';

/** Los campos con su etiqueta, para llevar el error de la API (`field` `ventaja.<clave>` o `desventaja.<clave>`). */
const CAMPOS: CamposDeFormulario = camposSinPasos([
    ['nombre', 'Nombre'], ['id_manual', 'Manual'], ['pagina', 'Página'], ['coste', 'Puntos'], ['puntos', 'Puntos'],
    ['mejora', 'Mejora'], ['descripcion', 'Descripción'], ['id_rasgo', 'Rasgo'], ['id_idioma', 'Idioma'],
    ['id_habilidad', 'Habilidad'],
]);

/**
 * «Insertar/Modificar ventaja» (hito 8 del roadmap de inserciones): una pantalla para las ventajas y las desventajas,
 * que son el mismo catálogo con el coste de signo contrario (una ventaja cuesta puntos y una desventaja los da). Al crear
 * se elige el tipo; al modificar no cambia (cada uno tiene su ruta y su permiso). Son homebrew (decisión del propietario
 * del 2026-10-25): el marco dice siempre Homebrew. Sin pasos: tarjetas, como la dote y el equipo.
 */
@Component({
    selector: 'app-nueva-ventaja',
    templateUrl: './nueva-ventaja.component.html',
    styleUrls: ['./nueva-ventaja.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaVentajaComponent) }],
})
export class NuevaVentajaComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    /** Al modificar, el tipo de la entrada; al crear, el que se elige (por defecto, ventaja). */
    @Input() tipo: TipoVentaja = 'ventaja';
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idVentaja: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() ventajaCreada = new EventEmitter<VentajaDetalle>();
    @Output() ventajaActualizada = new EventEmitter<VentajaDetalle>();

    private readonly destroy$ = new Subject<void>();
    readonly banderasAfecta = BANDERAS_AFECTA;
    readonly banderasDa = BANDERAS_DA;
    guardando = false;
    puedeCrear = false;
    /** Si la persona ya eligió el tipo al crear: entonces no se cambia solo por los permisos. */
    private tipoElegido = false;

    manuales: OpcionCatalogo[] = [];
    rasgos: OpcionCatalogo[] = [];
    idiomas: OpcionCatalogo[] = [];
    habilidades: OpcionCatalogo[] = [];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0), entero]],
        puntos: [null as number | null, [Validators.required, Validators.min(1), entero]],
        mejora: [0 as number | null, [entero]],
        disipable: [false], caracteristica: [false], fuerza: [false], destreza: [false], constitucion: [false],
        inteligencia: [false], sabiduria: [false], carisma: [false], fortaleza: [false], reflejos: [false],
        voluntad: [false], iniciativa: [false], duplica_oro: [false], aumenta_oro: [false], idioma_extra: [false],
        id_rasgo: [null as number | null],
        id_idioma: [null as number | null],
        id_habilidad: [null as number | null],
    });

    readonly errores = new ErroresDeFormulario(this.opcionesDeErrores());

    readonly edicion = new EdicionDeCatalogo<VentajaDetalle>({
        // «Crear ventaja», «Cargando desventaja…», el aviso sin permisos: dependen del tipo, que puede cambiar al crear.
        nombre: nombreQueCambia(() => nombreDeVentaja(this.tipo)),
        modo: () => this.modo,
        id: () => this.idVentaja,
        obtener: (id) => this.ventajaSvc.getVentajaFresca(this.tipo, id),
        hidratar: (ventaja) => this.hidratar(ventaja),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, `No se ha podido cargar la ${this.tipo}.`),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private ventajaSvc: VentajaService,
        private manualSvc: ManualService,
        private rasgoSvc: RasgoService,
        private idiomaSvc: IdiomaService,
        private habilidadSvc: HabilidadService,
    ) { }

    ngOnInit(): void {
        this.actualizarPermisos();
        this.userSvc.acl$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.userSvc.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => this.actualizarPermisos());
        this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.errores.seguirCambios());
        this.cargarCatalogos();
        this.edicion.cargarSiHaceFalta();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tipo'])
            this.actualizarPermisos();
        if (changes['modo'] || changes['idVentaja'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get etiquetaTipo(): string {
        return this.tipo === 'ventaja' ? 'Ventaja' : 'Desventaja';
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    /** Al crear, el tipo se elige; al modificar, no cambia (la API no deja pasar una ventaja a desventaja). */
    elegirTipo(tipo: TipoVentaja): void {
        if (this.edicion.editando || this.tipo === tipo)
            return;
        this.tipo = tipo;
        this.tipoElegido = true;
        this.actualizarPermisos();
        this.errores.limpiar();
    }

    alternar(bandera: BanderaVentaja): void {
        alternarControl(this.form.controls[bandera]);
        // Un idioma a elegir y un idioma fijo no van juntos: la creación solo da el que se elige.
        if (bandera === 'idioma_extra' && this.form.controls.idioma_extra.value === true)
            this.form.controls.id_idioma.setValue(null);
    }

    marcada(bandera: BanderaVentaja): boolean {
        return this.form.controls[bandera].value === true;
    }

    elegir(campo: 'id_manual' | 'id_rasgo' | 'id_idioma' | 'id_habilidad', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
        if (campo === 'id_idioma')
            this.form.controls.idioma_extra.setValue(false);
    }

    quitar(campo: 'id_rasgo' | 'id_idioma' | 'id_habilidad'): void {
        vaciarControl(this.form.controls[campo]);
    }

    async guardar(): Promise<void> {
        if (!this.puedeCrear) {
            await avisarSinPermisos(this.userSvc.getPermissionDeniedMessage());
            return;
        }
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.errores.irAlPrimerError();
            return;
        }
        this.errores.limpiar();
        this.guardando = true;
        const nombre = nombreDeVentaja(this.tipo);
        try {
            const editando = this.edicion.editando;
            const guardada = editando
                ? await this.ventajaSvc.actualizarVentaja(this.tipo, this.edicion.id, this.cuerpo())
                : await this.ventajaSvc.crearVentaja(this.tipo, this.cuerpo());
            await avisarGuardado(nombre, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.entrada);
                this.ventajaActualizada.emit(guardada.entrada);
                this.cerrar.emit();
            } else {
                this.ventajaCreada.emit(guardada.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, `No se ha podido guardar la ${this.tipo}.`);
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /<tipo>s/add` y `PUT /<tipo>s/<id>`. */
    cuerpo(): VentajaCuerpo {
        return cuerpoDeVentaja(this.tipo, this.form.getRawValue() as unknown as ValoresVentaja);
    }

    private hidratar(ventaja: VentajaDetalle): void {
        this.errores.limpiar();
        this.form.reset(valoresDeVentaja(ventaja) as any, { emitEvent: false });
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset(valoresVaciosDeVentaja() as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    /**
     * Las opciones de `errores`: la raíz del cuerpo es el tipo (`ventaja.coste` o `desventaja.coste`) y el coste es el
     * control `puntos`.
     */
    private opcionesDeErrores(): OpcionesErroresDeFormulario {
        const componente = this;
        const control = (campo: string) => (componente.form.controls as Record<string, any>)[campo === 'coste' ? 'puntos' : campo];
        return {
            campos: CAMPOS,
            get raiz() { return componente.tipo; },
            control,
            firma: (campo) => JSON.stringify(control(campo)?.value ?? null),
            irAPaso: () => undefined,
        };
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.rasgoSvc.getRasgos(), (rasgos) => this.rasgos = opcionesDeCatalogo(rasgos.filter((r) => r.Id > 0)));
        cargar(this.idiomaSvc.getIdiomas(), (idiomas) => this.idiomas = opcionesDeCatalogo(idiomas.filter((i) => i.Id > 0)));
        cargar(this.habilidadSvc.getHabilidades(), (habilidades) => this.habilidades = opcionesDeCatalogo(habilidades,
            (h) => ({ id: h.Id_habilidad, nombre: h.Nombre })));
    }

    /**
     * El permiso de creación del tipo: `ventajas` o `desventajas` (también al modificar, como pide la API). Al crear, si la
     * cuenta solo puede con el otro tipo y aún no lo ha elegido nadie, se empieza por ese (el menú abre esta pantalla con
     * cualquiera de los dos permisos).
     */
    private actualizarPermisos(): void {
        const otro: TipoVentaja = this.tipo === 'ventaja' ? 'desventaja' : 'ventaja';
        if (!this.edicion.editando && !this.tipoElegido && !this.puedeConTipo(this.tipo) && this.puedeConTipo(otro))
            this.tipo = otro;
        this.puedeCrear = this.puedeConTipo(this.tipo);
    }

    private puedeConTipo(tipo: TipoVentaja): boolean {
        return puedeGestionarCatalogo(this.userSvc, `${tipo}s`);
    }
}
