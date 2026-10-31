import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserProfileNavigationService } from '../../../services/user-profile-navigation.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { TipoRol, tipoRolDeListado, tituloListado } from 'src/app/services/utils/iconos-rol';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { puedeGestionarCatalogo } from 'src/app/services/utils/permisos-catalogo';
import { tieneInsercion, tipoEdicionDeListado } from 'src/app/services/utils/catalogos-editables';

type SeccionOtros = 'insertar' | 'modificar' | 'detalles';
type OperacionCatalogo = 'insertar' | 'modificar';
type GrupoOtros = 'equipo' | 'rasgos' | 'mundo';
type PermissionAction = 'create' | 'update';

interface OpcionOtros {
    readonly etiqueta: string;
    /** Su icono: el mismo en Insertar, Modificar y Detalles (la sección ya dice la acción). */
    readonly tipo: TipoRol;
    readonly habilitada: () => boolean;
    readonly abrir: () => void;
}

interface GrupoMenuOtros {
    readonly id: GrupoOtros;
    readonly titulo: string;
    readonly opciones: readonly OpcionOtros[];
}

@Component({
    selector: 'app-base-menu',
    templateUrl: './base-menu.component.html',
    styleUrls: ['./base-menu.component.sass'],
    standalone: false
})
export class BaseMenuComponent implements OnInit, OnDestroy {
    @ViewChild('primero') primero!: MatExpansionPanel;
    @ViewChild('segundo') segundo!: MatExpansionPanel;
    @ViewChild('tercero') tercero!: MatExpansionPanel;
    @ViewChild('cuarto') cuarto!: MatExpansionPanel;

    usr: string = 'Invitado';
    /** El grupo de «Otros» abierto, como `seccion:grupo`. */
    otrosAbierto: string | null = null;
    private timerCierreOtros: ReturnType<typeof setTimeout> | null = null;
    /** Los mismos grupos en los tres menús: todo lo que tiene detalle tendrá también inserción y modificación. */
    readonly gruposOtros: Readonly<Record<SeccionOtros, readonly GrupoMenuOtros[]>> = {
        insertar: [
            this.grupo('equipo', 'Equipo', [
                this.opcion('armas', 'insertar'),
                this.opcion('armaduras', 'insertar'),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.opcion('especiales', 'insertar'),
                this.opcion('raciales', 'insertar'),
                this.opcion('rasgos', 'insertar'),
                this.opcion('idiomas', 'insertar'),
                this.opcion('ventajas', 'insertar'),
                this.opcion('fusiones del alma', 'insertar'),
                this.opcion('chakras', 'insertar'),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.opcion('tipos de criatura', 'insertar'),
                this.opcion('subtipos', 'insertar'),
                this.opcion('deidades', 'insertar'),
            ]),
        ],
        modificar: [
            this.grupo('equipo', 'Equipo', [
                this.opcion('armas', 'modificar'),
                this.opcion('armaduras', 'modificar'),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.opcion('especiales', 'modificar'),
                this.opcion('raciales', 'modificar'),
                this.opcion('rasgos', 'modificar'),
                this.opcion('idiomas', 'modificar'),
                this.opcion('ventajas', 'modificar'),
                this.opcion('fusiones del alma', 'modificar'),
                this.opcion('chakras', 'modificar'),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.opcion('tipos de criatura', 'modificar'),
                this.opcion('subtipos', 'modificar'),
                this.opcion('deidades', 'modificar'),
            ]),
        ],
        detalles: [
            this.grupo('equipo', 'Equipo', [
                this.detalle('armas'),
                this.detalle('armaduras'),
                this.detalle('munición'),
                this.detalle('materiales especiales'),
                this.detalle('aptitudes de armas y armaduras'),
                this.detalle('objetos'),
                this.detalle('conjuntos de objetos'),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.detalle('especiales'),
                this.detalle('raciales'),
                this.detalle('rasgos'),
                this.detalle('idiomas'),
                this.detalle('ventajas'),
                this.detalle('fusiones del alma'),
                this.detalle('chakras'),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.detalle('tipos de criatura'),
                this.detalle('subtipos'),
                this.detalle('deidades'),
            ]),
        ],
    };
    readonly posicionesOtros: ConnectedPosition[] = [
        { originX: 'end', overlayX: 'start', originY: 'top', overlayY: 'top', offsetX: 4 },
        { originX: 'end', overlayX: 'start', originY: 'bottom', overlayY: 'bottom', offsetX: 4 },
        { originX: 'start', overlayX: 'end', originY: 'top', overlayY: 'top', offsetX: -4 },
    ];

    constructor(
        private usrService: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
        private marco?: MarcoMovilService,
        private navegacion?: NavegacionRolService,
    ) { }

    ngOnInit(): void {
        this.usrService.isLoggedIn$.subscribe(_ => {
            const nombre = this.usrService.Usuario.nombre;
            const correo = this.usrService.Usuario.correo;
            this.usr = nombre != '' ? nombre : correo != '' ? correo : 'Invitado';
        });
    }

    ngOnDestroy(): void {
        this.cancelarCierreOtros();
    }

    /** Tras elegir una opción: pliega el acordeón y, en el móvil, cierra el cajón. */
    closeAcordion() {
        this.marco?.cerrarMenu();
        if (this.primero.expanded)
            this.primero.close();
        else if (this.segundo.expanded)
            this.segundo.close();
        else if (this.tercero.expanded)
            this.tercero.close();
        else if (this.cuarto.expanded)
            this.cuarto.close();
    }

    abrirOtros(seccion: SeccionOtros, grupo: GrupoOtros) {
        this.cancelarCierreOtros();
        this.otrosAbierto = this.claveOtros(seccion, grupo);
    }

    toggleOtros(seccion: SeccionOtros, grupo: GrupoOtros, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.cancelarCierreOtros();
        const clave = this.claveOtros(seccion, grupo);
        this.otrosAbierto = this.otrosAbierto === clave ? null : clave;
    }

    estaAbiertoOtros(seccion: SeccionOtros, grupo: GrupoOtros): boolean {
        return this.otrosAbierto === this.claveOtros(seccion, grupo);
    }

    programarCierreOtros() {
        this.cancelarCierreOtros();
        this.timerCierreOtros = setTimeout(() => this.cerrarOtros(), 150);
    }

    cancelarCierreOtros() {
        if (this.timerCierreOtros) {
            clearTimeout(this.timerCierreOtros);
            this.timerCierreOtros = null;
        }
    }

    cerrarOtros() {
        this.cancelarCierreOtros();
        this.otrosAbierto = null;
    }

    onOverlayKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape')
            this.cerrarOtros();
    }

    @Output() NuevoPersonajeTab: EventEmitter<any> = new EventEmitter();
    AbrirNuevoPersonaje(): void {
        if (this.esInvitado) {
            this.openSesionDialog();
            return;
        }
        if (!this.canCrearPersonajes)
            return;
        this.NuevoPersonajeTab.emit();
    }

    @Output() ListadoTab: EventEmitter<{ tipo: string, operacion: string }> = new EventEmitter();
    AbrirListado(tipo: string, operacion: string): void {
        this.ListadoTab.emit({ tipo, operacion });
    }

    get mensajePermisosInsuficientes(): string {
        return this.usrService.getPermissionDeniedMessage();
    }

    canGestionar(resource: string, action: PermissionAction): boolean {
        return this.usrService.can(resource, action);
    }

    /**
     * Si la cuenta puede insertar y modificar en el catálogo de un listado: el permiso de creación de su recurso
     * (`permisos-catalogo.ts`); la API pide el mismo para modificar.
     */
    puedeGestionar(lista: string): boolean {
        return puedeGestionarCatalogo(this.usrService, lista);
    }

    /** Insertar o Modificar en un catálogo: abre su pestaña (la inserción o el listado para elegir qué modificar). */
    abrirOperacion(lista: string, operacion: OperacionCatalogo): void {
        if (!this.puedeGestionar(lista))
            return;
        this.AbrirListado(lista, operacion);
        this.closeAcordion();
        this.cerrarOtros();
    }

    get esInvitado(): boolean {
        return !this.usrService.IsLoggedIn;
    }

    get canCrearPersonajes(): boolean {
        return this.canGestionar('personajes', 'create');
    }

    get nuevoPersonajeDeshabilitado(): boolean {
        return !this.esInvitado && !this.canCrearPersonajes;
    }

    get tooltipNuevoPersonaje(): string {
        return this.nuevoPersonajeDeshabilitado ? this.mensajePermisosInsuficientes : '';
    }

    gruposDe(seccion: SeccionOtros): readonly GrupoMenuOtros[] {
        return this.gruposOtros[seccion];
    }

    tieneOpcionesOtros(seccion: SeccionOtros): boolean {
        return this.gruposOtros[seccion].some(grupo => this.tieneOpcionesGrupo(grupo));
    }

    tieneOpcionesGrupo(grupo: GrupoMenuOtros): boolean {
        return grupo.opciones.some(opcion => opcion.habilitada());
    }

    private claveOtros(seccion: SeccionOtros, grupo: GrupoOtros): string {
        return `${seccion}:${grupo}`;
    }

    private grupo(id: GrupoOtros, titulo: string, opciones: OpcionOtros[]): GrupoMenuOtros {
        return { id, titulo, opciones };
    }

    /**
     * Una opción de Insertar o Modificar, por su listado: el texto y el icono salen del registro (`LISTADOS_ROL`), el
     * permiso de `permisos-catalogo.ts` y si tiene pantalla de `catalogos-editables.ts`. Sin pantalla todavía, solo
     * cierra el menú.
     */
    private opcion(lista: string, operacion: OperacionCatalogo): OpcionOtros {
        const conPantalla = operacion === 'insertar' ? tieneInsercion(lista) : tipoEdicionDeListado(lista) !== null;
        return this.entrada(lista, () => this.puedeGestionar(lista),
            conPantalla ? () => this.abrirOperacion(lista, operacion) : () => this.cerrarOtros());
    }

    private detalle(lista: string): OpcionOtros {
        return this.entrada(lista, () => true, () => {
            this.AbrirListado(lista, 'detalles');
            this.closeAcordion();
            this.cerrarOtros();
        });
    }

    private entrada(lista: string, habilitada: () => boolean, abrir: () => void): OpcionOtros {
        return { etiqueta: mayusculaInicial(tituloListado(lista)), tipo: tipoRolDeListado(lista)!, habilitada, abrir };
    }

    /** Entrar es de la plataforma: abre el acceso de Yosiftware sobre la web. */
    openSesionDialog(): void {
        void this.usrService.entrar().catch(() => undefined);
    }

    logOut() {
        void this.usrService.logOut()?.catch(() => undefined);
    }

    abrirMiPerfil(): void {
        if (this.esInvitado)
            return;
        this.userProfileNavSvc.openPrivateProfile();
        this.closeAcordion();
        this.cerrarOtros();
    }

    /** La entrada «Dados», debajo de las de catálogo: abre su pestaña (una sola) y, en el móvil, cierra el cajón. */
    abrirDados(): void {
        this.navegacion?.abrir({ clase: 'dados' });
        this.closeAcordion();
        this.cerrarOtros();
    }

    abrirSocial(): void {
        this.userProfileNavSvc.openSocial('resumen');
        this.closeAcordion();
        this.cerrarOtros();
    }

}
