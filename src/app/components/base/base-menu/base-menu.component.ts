import { Component, EventEmitter, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserProfileNavigationService } from '../../../services/user-profile-navigation.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Observable, of } from 'rxjs';
import { TipoRol, tipoRolDeListado, tituloListado } from 'src/app/services/utils/iconos-rol';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { puedeGestionarListado } from 'src/app/services/utils/permisos-catalogo';
import { tieneInsercion, tipoEdicionDeListado } from 'src/app/services/utils/catalogos-editables';
import { trasLasNormasDeCreacion } from 'src/app/services/utils/normas-creacion';
import { MisCampanasService } from 'src/app/services/mis-campanas.service';
import { GRUPOS_DE_CATALOGOS, GrupoCatalogos } from 'src/app/services/utils/catalogos-del-menu';
import { nuevoPersonajeDeshabilitado, pedirNuevoPersonaje } from 'src/app/services/utils/nuevo-personaje';

type SeccionOtros = 'insertar' | 'modificar' | 'detalles';
type OperacionCatalogo = 'insertar' | 'modificar';

interface OpcionOtros {
    readonly etiqueta: string;
    /** Su icono: el mismo en Insertar, Modificar y Detalles (la sección ya dice la acción). */
    readonly tipo: TipoRol;
    readonly habilitada: () => boolean;
    readonly abrir: () => void;
}

interface GrupoMenuOtros {
    readonly id: GrupoCatalogos;
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
    /** Los activadores de los grupos «Otros» (menú de la CDK), para cerrarlos al elegir fuera de ellos. */
    @ViewChildren(CdkMenuTrigger) triggersOtros?: QueryList<CdkMenuTrigger>;

    usr: string = 'Invitado';
    /**
     * Los mismos grupos en los tres menús (`GRUPOS_DE_CATALOGOS`, los mismos del menú por catálogo de B): todo lo que tiene
     * detalle tendrá también inserción y modificación.
     */
    readonly gruposOtros: Readonly<Record<SeccionOtros, readonly GrupoMenuOtros[]>> = {
        insertar: GRUPOS_DE_CATALOGOS.map((g) => this.grupo(g.id, g.titulo, g.listas.map((lista) => this.opcion(lista, 'insertar')))),
        modificar: GRUPOS_DE_CATALOGOS.map((g) => this.grupo(g.id, g.titulo, g.listas.map((lista) => this.opcion(lista, 'modificar')))),
        detalles: GRUPOS_DE_CATALOGOS.map((g) => this.grupo(g.id, g.titulo, g.listas.map((lista) => this.detalle(lista)))),
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
        private misCampanas?: MisCampanasService,
    ) { }

    /** «Mis campañas»: con sesión, si el rol es máster, colaborador o admin, o si es miembro activo de alguna campaña. */
    get misCampanasVisible$(): Observable<boolean> {
        return this.misCampanas?.visible$ ?? of(false);
    }

    ngOnInit(): void {
        this.usrService.isLoggedIn$.subscribe(_ => {
            const nombre = this.usrService.Usuario.nombre;
            const correo = this.usrService.Usuario.correo;
            this.usr = nombre != '' ? nombre : correo != '' ? correo : 'Invitado';
        });
    }

    ngOnDestroy(): void {
        this.cerrarOtros();
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

    /** Cierra el grupo de «Otros» que esté abierto (al elegir algo del menú que no es de los grupos). */
    cerrarOtros(): void {
        this.triggersOtros?.forEach((trigger) => trigger.close());
    }

    @Output() NuevoPersonajeTab: EventEmitter<any> = new EventEmitter();
    AbrirNuevoPersonaje(): void {
        pedirNuevoPersonaje(this.usrService, () => this.NuevoPersonajeTab.emit());
    }

    @Output() ListadoTab: EventEmitter<{ tipo: string, operacion: string }> = new EventEmitter();
    AbrirListado(tipo: string, operacion: string): void {
        this.ListadoTab.emit({ tipo, operacion });
    }

    get mensajePermisosInsuficientes(): string {
        return this.usrService.getPermissionDeniedMessage();
    }

    /**
     * Si la cuenta puede insertar y modificar en el catálogo de un listado: el permiso de creación de su recurso
     * (`permisos-catalogo.ts`); la API pide el mismo para modificar. Un listado de dos catálogos (ventajas y
     * desventajas), con el de cualquiera de los dos: la pantalla pide después el de cada uno.
     */
    puedeGestionar(lista: string): boolean {
        return puedeGestionarListado(this.usrService, lista);
    }

    /** Insertar o Modificar en un catálogo: abre su pestaña (la inserción o el listado para elegir qué modificar). */
    abrirOperacion(lista: string, operacion: OperacionCatalogo): void {
        if (!this.puedeGestionar(lista))
            return;
        trasLasNormasDeCreacion(this.usrService, () => {
            this.AbrirListado(lista, operacion);
            this.closeAcordion();
            this.cerrarOtros();
        });
    }

    get esInvitado(): boolean {
        return !this.usrService.IsLoggedIn;
    }

    get nuevoPersonajeDeshabilitado(): boolean {
        return nuevoPersonajeDeshabilitado(this.usrService);
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

    private grupo(id: GrupoCatalogos, titulo: string, opciones: OpcionOtros[]): GrupoMenuOtros {
        return { id, titulo, opciones };
    }

    /**
     * Una opción de Insertar o Modificar, por su listado: el texto y el icono salen del registro (`LISTADOS_ROL`), el
     * permiso de `permisos-catalogo.ts` y si tiene pantalla de `catalogos-editables.ts`. Sin pantalla todavía, solo
     * cierra el menú (lo cierra el propio menú al elegir).
     */
    private opcion(lista: string, operacion: OperacionCatalogo): OpcionOtros {
        const conPantalla = operacion === 'insertar' ? tieneInsercion(lista) : tipoEdicionDeListado(lista) !== null;
        return this.entrada(lista, () => this.puedeGestionar(lista),
            conPantalla ? () => this.abrirOperacion(lista, operacion) : () => undefined);
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

    /** La entrada «Mis campañas», encima de «Dados»: abre Social en Campañas y, en el móvil, cierra el cajón. */
    abrirMisCampanas(): void {
        this.userProfileNavSvc.openSocial({ section: 'campanas', requestId: Date.now() });
        this.closeAcordion();
        this.cerrarOtros();
    }

}
