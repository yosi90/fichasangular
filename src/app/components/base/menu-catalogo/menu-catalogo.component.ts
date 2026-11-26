import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, Inject, OnDestroy, Optional } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, Subscription, asapScheduler, observeOn, of } from 'rxjs';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';
import { MisCampanasService } from 'src/app/services/mis-campanas.service';
import { CLAVE_PESTANA_DADOS, CLAVE_PESTANA_PERSONAJES, NavegacionRolService, claveDePestanaListado } from 'src/app/services/navegacion-rol.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { CATALOGOS_PRINCIPALES, GRUPOS_DE_CATALOGOS, GrupoCatalogos, GrupoDeCatalogos } from 'src/app/services/utils/catalogos-del-menu';
import { etiquetaListado } from 'src/app/services/utils/iconos-rol';
import { avisoNuevoPersonaje, nuevoPersonajeDeshabilitado } from 'src/app/services/utils/nuevo-personaje';
import { ACCIONES_DEL_MENU, AccionesDelMenu } from './acciones-del-menu';

/**
 * El menú lateral de B · Tinta (lienzo «Rol: temas e iconos», propuesta B): por catálogo en lugar de por acción. Cada
 * catálogo sale una vez y abre su listado; «Nueva …» está en la cabecera del listado (`app-listado-cabecera`) y
 * «Modificar», en el detalle. Arriba, «Nuevo personaje»; luego «Tu mesa» (Personajes, Mis campañas y Dados) y
 * «Biblioteca» (los seis principales y los grupos de los demás, que se despliegan en el sitio). Lo de la cuenta (Mi
 * perfil, Social, entrar y cerrar sesión) está en «Archivo» de la cinta y en el panel de cuentas de la plataforma.
 *
 * Es navegación, no un menú de aplicación (Modern Web Guidance, «navbar»): un `<nav>` con botones en el orden del
 * tabulador, sin roles de menú ni flechas; los grupos son botones con `aria-expanded` y su lista justo detrás, y lo que
 * se está viendo lleva `aria-current`. Se carga bajo demanda desde el marco (`ContPrincipalComponent`), solo con un tema
 * de menú por catálogo (`TemaWebService.menuLateral$`).
 */
@Component({
    selector: 'app-menu-catalogo',
    standalone: true,
    imports: [AsyncPipe, NgFor, NgIf, MatTooltipModule],
    templateUrl: './menu-catalogo.component.html',
    styleUrls: ['./menu-catalogo.component.sass'],
})
export class MenuCatalogoComponent implements OnDestroy {
    readonly principales = CATALOGOS_PRINCIPALES;
    readonly grupos = GRUPOS_DE_CATALOGOS;
    readonly pestanaPersonajes = CLAVE_PESTANA_PERSONAJES;
    readonly pestanaDados = CLAVE_PESTANA_DADOS;
    /** La pestaña que se está viendo (`NavegacionRolService.pestanaActiva$`), para marcar su entrada. */
    pestanaActiva = '';
    private readonly abiertos = new Set<GrupoCatalogos>();
    private readonly suscripcion: Subscription;

    constructor(
        private usrService: UserService,
        private navegacion: NavegacionRolService,
        private userProfileNavSvc: UserProfileNavigationService,
        @Optional() @Inject(ACCIONES_DEL_MENU) private acciones: AccionesDelMenu | null,
        @Optional() private marco: MarcoMovilService | null,
        @Optional() private misCampanas: MisCampanasService | null,
    ) {
        // Fuera del ciclo en el que cambia la pestaña: el menú ya está pintado cuando las pestañas lo anuncian.
        this.suscripcion = this.navegacion.pestanaActiva$.pipe(observeOn(asapScheduler)).subscribe((clave) => {
            this.pestanaActiva = clave;
            const grupo = this.grupos.find((g) => g.listas.some((lista) => this.esActual(lista)));
            if (grupo)
                this.abiertos.add(grupo.id);
        });
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    /** «Mis campañas»: con sesión, si el rol es máster, colaborador o admin, o si es miembro activo de alguna campaña. */
    get misCampanasVisible$(): Observable<boolean> {
        return this.misCampanas?.visible$ ?? of(false);
    }

    get nuevoPersonajeDeshabilitado(): boolean {
        return nuevoPersonajeDeshabilitado(this.usrService);
    }

    get tooltipNuevoPersonaje(): string {
        return avisoNuevoPersonaje(this.usrService);
    }

    etiqueta(lista: string): string {
        return etiquetaListado(lista);
    }

    /** Si el listado de [lista] es la pestaña que se está viendo. */
    esActual(lista: string): boolean {
        return this.pestanaActiva === claveDePestanaListado(lista, 'detalles');
    }

    abierto(grupo: GrupoDeCatalogos): boolean {
        return this.abiertos.has(grupo.id);
    }

    alternar(grupo: GrupoDeCatalogos): void {
        if (this.abiertos.has(grupo.id))
            this.abiertos.delete(grupo.id);
        else
            this.abiertos.add(grupo.id);
    }

    nuevoPersonaje(): void {
        this.acciones?.nuevoPersonaje();
    }

    abrirListado(lista: string): void {
        this.acciones?.abrirListado(lista);
        this.cerrar();
    }

    abrirPersonajes(): void {
        this.navegacion.abrir({ clase: 'personajes' });
        this.cerrar();
    }

    abrirMisCampanas(): void {
        this.userProfileNavSvc.openSocial({ section: 'campanas', requestId: Date.now() });
        this.cerrar();
    }

    abrirDados(): void {
        this.navegacion.abrir({ clase: 'dados' });
        this.cerrar();
    }

    /** En el móvil, el cajón se cierra al elegir. */
    private cerrar(): void {
        this.marco?.cerrarMenu();
    }
}
