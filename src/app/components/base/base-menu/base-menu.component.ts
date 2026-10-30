import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserProfileNavigationService } from '../../../services/user-profile-navigation.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { TipoRol, tipoRolDeListado } from 'src/app/services/utils/iconos-rol';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';

type SeccionOtros = 'insertar' | 'modificar' | 'detalles';
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
                this.opcion('Armas', 'arma', () => this.canGestionar('armas', 'create')),
                this.opcion('Armaduras y escudos', 'armadura', () => this.canGestionar('armaduras', 'create')),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.opcion('Especiales', 'especial', () => this.canGestionar('clases', 'create'), () => this.onInsertarEspecial()),
                this.opcion('Raciales', 'racial', () => this.canInsertarRaciales(), () => this.onInsertarRacial()),
                this.opcion('Rasgos', 'rasgo', () => this.canGestionar('rasgos', 'create')),
                this.opcion('Idiomas', 'idioma', () => this.canGestionarIdiomas(), () => this.onInsertarIdioma()),
                this.opcion('Ventajas y desventajas', 'ventaja', () => this.canGestionar('ventajas', 'create')),
                this.opcion('Fusiones del alma', 'fusion', () => this.canGestionar('clases', 'create')),
                this.opcion('Chakras', 'chakra', () => this.canGestionar('clases', 'create')),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.opcion('Tipos de criatura', 'tipo-criatura', () => this.canGestionar('tipos_criatura', 'create')),
                this.opcion('Subtipos de criatura', 'subtipo', () => this.canGestionar('subtipos', 'create')),
                this.opcion('Deidades', 'deidad', () => this.canGestionar('deidades', 'create')),
            ]),
        ],
        modificar: [
            this.grupo('equipo', 'Equipo', [
                this.opcion('Armas', 'arma', () => this.canGestionar('armas', 'update')),
                this.opcion('Armaduras y escudos', 'armadura', () => this.canGestionar('armaduras', 'update')),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.opcion('Especiales', 'especial', () => this.canGestionar('especiales', 'update') || this.canGestionar('clases', 'update'), () => this.onModificarEspecial()),
                this.opcion('Raciales', 'racial', () => this.canGestionar('raciales', 'update'), () => this.onModificarRacial()),
                this.opcion('Rasgos', 'rasgo', () => this.canGestionar('rasgos', 'update')),
                this.opcion('Idiomas', 'idioma', () => this.canGestionarIdiomas(), () => this.onModificarIdioma()),
                this.opcion('Ventajas y desventajas', 'ventaja', () => this.canGestionar('ventajas', 'update')),
                this.opcion('Fusiones del alma', 'fusion', () => this.canGestionar('clases', 'update')),
                this.opcion('Chakras', 'chakra', () => this.canGestionar('clases', 'update')),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.opcion('Tipos de criatura', 'tipo-criatura', () => this.canGestionar('tipos_criatura', 'update')),
                this.opcion('Subtipos de criatura', 'subtipo', () => this.canGestionar('subtipos', 'update')),
                this.opcion('Deidades', 'deidad', () => this.canGestionar('deidades', 'update')),
            ]),
        ],
        detalles: [
            this.grupo('equipo', 'Equipo', [
                this.detalle('Armas', 'armas'),
                this.detalle('Armaduras y escudos', 'armaduras'),
                this.detalle('Munición', 'munición'),
                this.detalle('Materiales especiales', 'materiales especiales'),
                this.detalle('Aptitudes de armas y armaduras', 'aptitudes de armas y armaduras'),
                this.detalle('Objetos', 'objetos'),
                this.detalle('Conjuntos de objetos', 'conjuntos de objetos'),
            ]),
            this.grupo('rasgos', 'Rasgos y aptitudes', [
                this.detalle('Especiales', 'especiales'),
                this.detalle('Raciales', 'raciales'),
                this.detalle('Rasgos', 'rasgos'),
                this.detalle('Idiomas', 'idiomas'),
                this.detalle('Ventajas y desventajas', 'ventajas'),
                this.detalle('Fusiones del alma', 'fusiones del alma'),
                this.detalle('Chakras', 'chakras'),
            ]),
            this.grupo('mundo', 'Criaturas y mundo', [
                this.detalle('Tipos de criatura', 'tipos de criatura'),
                this.detalle('Subtipos de criatura', 'subtipos'),
                this.detalle('Deidades', 'deidades'),
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

    /** Una opción de Insertar o Modificar; sin acción propia (aún no tiene pantalla), solo cierra el menú. */
    private opcion(etiqueta: string, tipo: TipoRol, habilitada: () => boolean, abrir: () => void = () => this.cerrarOtros()): OpcionOtros {
        return { etiqueta, tipo, habilitada, abrir };
    }

    private detalle(etiqueta: string, lista: string): OpcionOtros {
        return this.opcion(etiqueta, tipoRolDeListado(lista)!, () => true, () => {
            this.AbrirListado(lista, 'detalles');
            this.closeAcordion();
            this.cerrarOtros();
        });
    }

    canInsertarDotes(): boolean {
        return this.usrService.can('dotes', 'create');
    }

    canInsertarRazas(): boolean {
        return this.usrService.can('razas', 'create');
    }

    canInsertarRaciales(): boolean {
        return this.usrService.can('razas', 'create');
    }

    canGestionarIdiomas(): boolean {
        return this.usrService.can('razas', 'create');
    }

    canInsertarConjuros(): boolean {
        return this.usrService.can('conjuros', 'create');
    }

    onInsertarClase(): void {
        if (!this.canGestionar('clases', 'create'))
            return;
        this.AbrirListado('clases', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onModificarClase(): void {
        if (!this.canGestionar('clases', 'update'))
            return;
        this.AbrirListado('clases', 'modificar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarRaza(): void {
        if (!this.canInsertarRazas())
            return;
        this.AbrirListado('razas', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarRacial(): void {
        if (!this.canInsertarRaciales())
            return;
        this.AbrirListado('raciales', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onModificarRacial(): void {
        if (!this.canGestionar('raciales', 'update'))
            return;
        this.AbrirListado('raciales', 'modificar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarIdioma(): void {
        if (!this.canGestionarIdiomas())
            return;
        this.AbrirListado('idiomas', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarEspecial(): void {
        if (!this.canGestionar('clases', 'create'))
            return;
        this.AbrirListado('especiales', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onModificarEspecial(): void {
        if (!this.canGestionar('especiales', 'update') && !this.canGestionar('clases', 'update'))
            return;
        this.AbrirListado('especiales', 'modificar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onModificarIdioma(): void {
        if (!this.canGestionarIdiomas())
            return;
        this.AbrirListado('idiomas', 'modificar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarDote(): void {
        if (!this.canInsertarDotes())
            return;
        this.AbrirListado('dotes', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarConjuro(): void {
        if (!this.canInsertarConjuros())
            return;
        this.AbrirListado('conjuros', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
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

    abrirSocial(): void {
        this.userProfileNavSvc.openSocial('resumen');
        this.closeAcordion();
        this.cerrarOtros();
    }

}
