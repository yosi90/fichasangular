import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DeidadCuerpo, DeidadDetalle } from 'src/app/interfaces/deidad';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { AmbitoService } from 'src/app/services/ambito.service';
import { ArmaService } from 'src/app/services/arma.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { DominioService } from 'src/app/services/dominio.service';
import { ManualService } from 'src/app/services/manual.service';
import { PabellonService } from 'src/app/services/pabellon.service';
import { UserService } from 'src/app/services/user.service';
import { nombreCombinacionAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { ValoresDeidad, cuerpoDeDeidad, valoresDeDeidad, valoresVaciosDeDeidad } from 'src/app/services/utils/deidad-formulario';
import { DEIDAD } from 'src/app/services/utils/nombres-de-catalogo';
import { toInt } from 'src/app/services/utils/normalizacion';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { OpcionCatalogo, opcionesDeCatalogo, opcionesPorId } from '../catalogo-buscador/catalogo-buscador.component';
import { avisarGuardado, avisarSinPermisos } from '../insercion-marco/avisos-insercion';
import { EdicionDeCatalogo, cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { EDITOR_DE_CATALOGO, EditorDeCatalogo } from '../insercion-marco/editor-de-catalogo';
import { CamposDeFormulario, ErroresDeFormulario, entero } from '../insercion-marco/errores-de-formulario';
import { alternarControl, elegirEnControl, vaciarControl } from '../insercion-marco/filas-repetibles';
import { FilaDeLista, anadirALista, filasDeIds } from '../lista-de-catalogo/lista-de-catalogo.component';

type ListaDeidad = 'ambitos' | 'dominios';

/** Los campos con su etiqueta, para llevar el error de la API (`field` `deidad.<clave>` o el de una lista). Sin pasos. */
const CAMPOS: CamposDeFormulario = Object.fromEntries(([
    ['nombre', 'Nombre'], ['id_manual', 'Manual'], ['pagina', 'Página'], ['id_alineamiento', 'Alineamiento'],
    ['id_arma', 'Arma predilecta'], ['id_pabellon', 'Panteón'], ['id_genero', 'Género'], ['descripcion', 'Descripción'],
    ['ambitos', 'Ámbitos'], ['dominios', 'Dominios'], ['alineamientos_devotos', 'Alineamientos de sus devotos'],
] as const).map(([clave, etiqueta]) => [clave, { etiqueta, paso: 0 }]));

/**
 * «Insertar/Modificar deidad» (hito 9 del roadmap de inserciones): los datos de la deidad (manual, alineamiento, arma
 * predilecta, panteón y género), sus ámbitos y dominios, los alineamientos que admite en sus devotos y su descripción. Sin
 * pasos: tarjetas, como la ventaja y el equipo.
 */
@Component({
    selector: 'app-nueva-deidad',
    templateUrl: './nueva-deidad.component.html',
    styleUrls: ['./nueva-deidad.component.sass'],
    standalone: false,
    providers: [{ provide: EDITOR_DE_CATALOGO, useExisting: forwardRef(() => NuevaDeidadComponent) }],
})
export class NuevaDeidadComponent implements OnInit, OnDestroy, OnChanges, EditorDeCatalogo {
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() idDeidad: number | null = null;
    @Input() editorTabKey = '';
    @Output() cerrar = new EventEmitter<void>();
    @Output() deidadCreada = new EventEmitter<DeidadDetalle>();
    @Output() deidadActualizada = new EventEmitter<DeidadDetalle>();

    private readonly destroy$ = new Subject<void>();
    guardando = false;
    puedeCrear = false;

    manuales: OpcionCatalogo[] = [];
    alineamientos: OpcionCatalogo[] = [];
    armas: OpcionCatalogo[] = [];
    pabellones: OpcionCatalogo[] = [];
    generos: OpcionCatalogo[] = [];
    alineamientosBasicos: OpcionCatalogo[] = [];
    ambitosOpciones: OpcionCatalogo[] = [];
    dominiosOpciones: OpcionCatalogo[] = [];
    listas: Record<ListaDeidad, FilaDeLista[]> = { ambitos: [], dominios: [] };
    devotos: number[] = [];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        descripcion: ['', [Validators.maxLength(8000)]],
        id_manual: [null as number | null, [Validators.required, Validators.min(1)]],
        pagina: [null as number | null, [Validators.required, Validators.min(0), entero]],
        id_alineamiento: [null as number | null],
        id_arma: [null as number | null],
        id_pabellon: [null as number | null],
        id_genero: [null as number | null, [Validators.required]],
        oficial: [true],
    });

    readonly errores = new ErroresDeFormulario({
        campos: CAMPOS,
        raiz: 'deidad',
        control: (campo) => (this.form.controls as Record<string, any>)[campo],
        firma: (campo) => JSON.stringify(this.firma(campo)),
        irAPaso: () => undefined,
    });

    readonly edicion = new EdicionDeCatalogo<DeidadDetalle>({
        nombre: DEIDAD,
        modo: () => this.modo,
        id: () => this.idDeidad,
        obtener: (id) => this.deidadSvc.getDeidadFresca(id),
        hidratar: (deidad) => this.hidratar(deidad),
        foto: () => JSON.stringify(this.cuerpo()),
        destruir$: this.destroy$,
        alFallar: (error) => this.errores.mostrar(error, 'No se ha podido cargar la deidad.'),
    });

    constructor(
        private fb: FormBuilder,
        private userSvc: UserService,
        private deidadSvc: DeidadService,
        private manualSvc: ManualService,
        private alineamientoSvc: AlineamientoService,
        private armaSvc: ArmaService,
        private pabellonSvc: PabellonService,
        private ambitoSvc: AmbitoService,
        private dominioSvc: DominioService,
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
        if (changes['modo'] || changes['idDeidad'])
            this.edicion.cargarSiHaceFalta();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get textoAccion(): string {
        return this.edicion.textoAccion(this.guardando);
    }

    alternarOficial(): void {
        alternarControl(this.form.controls.oficial);
    }

    elegir(campo: 'id_manual' | 'id_alineamiento' | 'id_arma' | 'id_pabellon', id: number): void {
        elegirEnControl(this.form.controls[campo], id);
    }

    quitar(campo: 'id_alineamiento' | 'id_arma' | 'id_pabellon'): void {
        vaciarControl(this.form.controls[campo]);
    }

    opcionesDe(lista: ListaDeidad): OpcionCatalogo[] {
        return lista === 'ambitos' ? this.ambitosOpciones : this.dominiosOpciones;
    }

    anadirA(lista: ListaDeidad, id: number): void {
        this.listas = { ...this.listas, [lista]: anadirALista(this.listas[lista], this.opcionesDe(lista), id,
            (opcion) => ({ id: opcion.id, nombre: opcion.nombre })) };
        this.errores.seguirCambios();
    }

    quitarDe(lista: ListaDeidad, fila: FilaDeLista): void {
        this.listas = { ...this.listas, [lista]: this.listas[lista].filter((item) => item.id !== fila.id) };
        this.errores.seguirCambios();
    }

    devoto(id: number): boolean {
        return this.devotos.includes(id);
    }

    alternarDevoto(id: number): void {
        this.devotos = this.devoto(id) ? this.devotos.filter((item) => item !== id) : [...this.devotos, id];
        this.errores.seguirCambios();
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
            const guardada = editando
                ? await this.deidadSvc.actualizarDeidad(this.edicion.id, this.cuerpo())
                : await this.deidadSvc.crearDeidad(this.cuerpo());
            await avisarGuardado(DEIDAD, editando, guardada.message);
            if (editando) {
                this.hidratar(guardada.entrada);
                this.deidadActualizada.emit(guardada.entrada);
                this.cerrar.emit();
            } else {
                this.deidadCreada.emit(guardada.entrada);
                this.reiniciar();
            }
        } catch (error: unknown) {
            this.errores.mostrar(error, 'No se ha podido guardar la deidad.');
        } finally {
            this.guardando = false;
        }
    }

    confirmarSalidaSiHayCambios(): Promise<boolean> {
        return this.edicion.confirmarSalida();
    }

    /** El cuerpo de `POST /deidades/add` y `PUT /deidades/<id>`. */
    cuerpo(): DeidadCuerpo {
        return cuerpoDeDeidad(this.form.getRawValue() as unknown as ValoresDeidad, {
            ambitos: this.listas.ambitos.map((fila) => fila.id),
            dominios: this.listas.dominios.map((fila) => fila.id),
            alineamientos_devotos: this.devotos,
        });
    }

    private firma(campo: string): unknown {
        if (campo === 'ambitos' || campo === 'dominios')
            return this.listas[campo].map((fila) => fila.id);
        if (campo === 'alineamientos_devotos')
            return this.devotos;
        return (this.form.controls as Record<string, any>)[campo]?.value ?? null;
    }

    private hidratar(deidad: DeidadDetalle): void {
        this.errores.limpiar();
        this.form.reset(valoresDeDeidad(deidad) as any, { emitEvent: false });
        this.listas = { ambitos: filasDeIds(deidad.Ambitos), dominios: filasDeIds(deidad.Dominios) };
        this.devotos = (deidad.Alineamientos_devotos ?? []).map((alineamiento) => toInt(alineamiento.Id));
        this.edicion.tomarPuntoDePartida();
    }

    private reiniciar(): void {
        this.form.reset(valoresVaciosDeDeidad() as any, { emitEvent: false });
        this.listas = { ambitos: [], dominios: [] };
        this.devotos = [];
        this.edicion.olvidar();
    }

    private cargarCatalogos(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.manualSvc.getManuales(), (manuales) => this.manuales = opcionesDeCatalogo(manuales as any[]));
        cargar(this.alineamientoSvc.getAlineamientosCombinacionesCatalogo(), (items) => this.alineamientos =
            opcionesDeCatalogo(items, (item) => ({ id: toInt(item?.Id), nombre: nombreCombinacionAlineamiento(item) })));
        cargar(this.alineamientoSvc.getAlineamientosBasicosCatalogo(), (items) => this.alineamientosBasicos =
            opcionesPorId(opcionesDeCatalogo(items.filter((item) => toInt(item?.Id) > 0))));
        // El arma «Elegir» (0) es una opción: la elige quien la venera. «Ninguna» (-1) es quitarla.
        cargar(this.armaSvc.getArmas(), (armas) => this.armas = opcionesDeCatalogo(armas.filter((arma) => toInt(arma.Id) >= 0)));
        cargar(this.pabellonSvc.getPabellones(), (pabellones) => this.pabellones = opcionesDeCatalogo(
            pabellones.filter((pabellon) => toInt(pabellon.Id) > 0)));
        cargar(this.deidadSvc.getGeneros(), (generos) => this.generos = opcionesPorId(opcionesDeCatalogo(generos)));
        cargar(this.ambitoSvc.getAmbitos(), (ambitos) => this.ambitosOpciones = opcionesDeCatalogo(
            ambitos.filter((ambito) => toInt(ambito.Id) > 0)));
        cargar(this.dominioSvc.getDominios(), (dominios) => this.dominiosOpciones = opcionesDeCatalogo(
            dominios.filter((dominio) => toInt(dominio.Id) > 0)));
    }

    private actualizarPermisos(): void {
        this.puedeCrear = puedeGestionarCatalogo(this.userSvc, 'deidades');
    }
}
