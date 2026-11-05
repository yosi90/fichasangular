import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { EquipoRef } from 'src/app/interfaces/equipo';
import { Chakra, ChakraCategoria, ChakraCuerpo, ChakraDetalle } from 'src/app/interfaces/incarnum';
import { EquipoService } from 'src/app/services/equipo.service';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { UserService } from 'src/app/services/user.service';
import { ValoresChakra, cuerpoDeChakra, valoresDeChakra, valoresVaciosDeChakra } from 'src/app/services/utils/incarnum-formulario';
import { CHAKRA } from 'src/app/services/utils/nombres-de-catalogo';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { alternarControl } from '../insercion-marco/filas-repetibles';

const CAMPOS: CamposDeFormulario = Object.fromEntries(([
    ['nombre', 'Nombre'], ['nombre_original', 'Nombre original'], ['id_categoria', 'Categoría'], ['id_ranura', 'Ranura'],
    ['orden', 'Orden'], ['descripcion', 'Descripción'],
] as const).map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

/**
 * «Insertar/Modificar chakra» (hito 8 del roadmap de inserciones; contrato en `docs/publica/INCARNUM.md`): solo la fila
 * del chakra (nombre, categoría, ranura que cierra su vínculo, orden y descripción). Sus fusiones las dice cada fusión y
 * las clases que lo abren, cada clase: aquí se enseñan sin editar. Una inserción pequeña: los campos en el marco.
 */
@Component({
    selector: 'app-nuevo-chakra',
    templateUrl: './nuevo-chakra.component.html',
    styleUrls: ['./nuevo-chakra.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevoChakraComponent) }],
})
export class NuevoChakraComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idChakra: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() chakraCreado = new EventEmitter<ChakraDetalle>();
    @Output() chakraActualizado = new EventEmitter<ChakraDetalle>();

    private readonly destroy$ = new Subject<void>();
    guardando = false;
    puedeCrear = false;
    /** Al modificar, lo que dicen las fusiones y las clases de este chakra (no se edita aquí). */
    cargado: ChakraDetalle | null = null;
    /** Las categorías de los chakras que hay (mínimo, menor, mayor, corazón, alma, tótem), en su orden. */
    categorias: ChakraCategoria[] = [];
    ranuras: EquipoRef[] = [];
    private chakras: Chakra[] = [];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        nombre_original: ['', [Validators.maxLength(50)]],
        traducido: [false],
        id_categoria: [null as number | null, [Validators.required]],
        id_ranura: [null as number | null],
        orden: [null as number | null, [Validators.required, Validators.min(1), Validators.max(255), entero]],
        descripcion: ['', [Validators.maxLength(8000)]],
        oficial: [false],
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'chakra',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify((this.form.controls as Record<string, any>)[campo]?.value ?? null),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<ChakraDetalle>({
        nombre: CHAKRA,
        modo: () => this.modo,
        id: () => this.idChakra,
        obtener: (id) => this.incarnumSvc.getChakraFresco(id),
        hidratar: (chakra) => this.hidratar(chakra),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar el chakra.'),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private incarnumSvc: IncarnumService,
        private equipoSvc: EquipoService,
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
        if (changes['modo'] || changes['idChakra'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    alternar(campo: 'oficial' | 'traducido'): void {
        alternarControl(this.form.controls[campo]);
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
        try {
            const editando = this.edicion.editando;
            const guardado = await this.incarnumSvc.guardarChakra(this.cuerpo(), editando ? this.edicion.id : null);
            await avisarGuardado(CHAKRA, editando, guardado.message);
            if (editando) {
                this.hidratar(guardado.chakra);
                this.chakraActualizado.emit(guardado.chakra);
                this.cerrar.emit();
            } else {
                this.chakraCreado.emit(guardado.chakra);
                this.chakras = [...this.chakras, guardado.chakra];
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar el chakra.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /incarnum/chakras/add` y `PUT /incarnum/chakras/<id>`. */
    cuerpo(): ChakraCuerpo {
        return cuerpoDeChakra(this.form.getRawValue() as unknown as ValoresChakra);
    }

    private hidratar(chakra: ChakraDetalle): void {
        this.cargado = chakra;
        this.errores.limpiar();
        this.form.reset(valoresDeChakra(chakra) as any, { emitEvent: false });
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.cargado = null;
        this.form.reset(valoresVaciosDeChakra(this.siguienteOrden()) as any, { emitEvent: false });
        this.edicion.olvidar();
    }

    /** Un chakra nuevo va detrás de los que hay. */
    private siguienteOrden(): number {
        return Math.min(255, Math.max(0, ...this.chakras.map((chakra) => chakra.Orden)) + 1);
    }

    private cargarCatalogos(): void {
        const cargar = <T>(fuente: Observable<T> | undefined, alLlegar: (valor: T) => void) => {
            fuente?.pipe(takeUntil(this.destroy$)).subscribe({ next: alLlegar, error: () => undefined });
        };
        cargar(this.incarnumSvc.getChakras(), (chakras) => {
            this.chakras = chakras;
            // Las categorías salen de los chakras que hay (los datos), sin repetir y en su orden.
            const porId = new Map<number, ChakraCategoria>();
            chakras.forEach((chakra) => {
                if (chakra.Categoria && chakra.Categoria.Id > 0)
                    porId.set(chakra.Categoria.Id, chakra.Categoria);
            });
            this.categorias = [...porId.values()].sort((a, b) => a.Orden - b.Orden);
            if (!this.edicion.editando && this.form.controls.orden.value === null && !this.form.dirty)
                this.form.controls.orden.setValue(this.siguienteOrden(), { emitEvent: false });
        });
        cargar(this.equipoSvc.getCatalogos(), (catalogos) => this.ranuras = (catalogos?.Ranuras ?? []).filter((r) => r.Id > 0));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'chakras');
    }
}
