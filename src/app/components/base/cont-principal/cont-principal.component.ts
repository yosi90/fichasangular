import { Component, Injector, OnDestroy, Type } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';
import { TemaWebService } from 'src/app/services/tema-web/tema-web.service';
import { MenuLateral } from 'src/app/services/tema-web/temas-web';
import { UserService } from 'src/app/services/user.service';
import { pedirNuevoPersonaje } from 'src/app/services/utils/nuevo-personaje';
import { ACCIONES_DEL_MENU, AccionesDelMenu } from '../menu-catalogo/acciones-del-menu';

@Component({
    selector: 'app-cont-principal',
    templateUrl: './cont-principal.component.html',
    styleUrls: ['./cont-principal.component.sass'],
    standalone: false
})
export class ContPrincipalComponent implements OnDestroy {
    NuevoPersonaje: number = 0;
    Listado: number = 0;

    TipoListado: string = '';
    OperacionListado: string = '';

    esMovil = false;
    menuAbierto = false;
    /** El menú lateral del tema: el de siempre (por acción) o el de B (por catálogo), que se carga bajo demanda. */
    menuLateral: MenuLateral = 'accion';
    menuCatalogo: Type<unknown> | null = null;
    /** Lo que el menú por catálogo pide al marco (`ACCIONES_DEL_MENU`): no tiene salidas, va con `ngComponentOutlet`. */
    readonly injectorMenu: Injector;
    private readonly suscripcion: Subscription;

    constructor(
        private marco: MarcoMovilService,
        private usrService: UserService,
        tema: TemaWebService,
        injector: Injector,
    ) {
        const acciones: AccionesDelMenu = {
            nuevoPersonaje: () => this.solicitarNuevoPersonaje(),
            abrirListado: (lista) => this.abrirListado({ tipo: lista, operacion: 'detalles' }),
        };
        this.injectorMenu = Injector.create({ providers: [{ provide: ACCIONES_DEL_MENU, useValue: acciones }], parent: injector });
        this.suscripcion = combineLatest([marco.esMovil$, marco.menuAbierto$]).subscribe(([movil, abierto]) => {
            this.esMovil = movil;
            this.menuAbierto = abierto;
        });
        this.suscripcion.add(tema.menuLateral$.subscribe((menu) => {
            this.menuLateral = menu;
            if (menu === 'catalogo')
                void this.cargarMenuCatalogo();
        }));
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }

    /** El menú de B, en su propio trozo (el bundle inicial va al tope): solo se pide con un tema que lo usa. */
    protected async cargarMenuCatalogo(): Promise<void> {
        this.menuCatalogo ??= (await import('../menu-catalogo/menu-catalogo.component')).MenuCatalogoComponent;
    }

    /**
     * «Nuevo personaje» del menú por catálogo o de la pestaña «Personajes»: la sesión, el permiso y las normas, como el
     * botón del menú de siempre (`pedirNuevoPersonaje`).
     */
    solicitarNuevoPersonaje(): void {
        pedirNuevoPersonaje(this.usrService, () => this.AbrirNuevoPersonaje());
    }

    AbrirNuevoPersonaje() {
        this.NuevoPersonaje = this.NuevoPersonaje > 10 ? 1 : this.NuevoPersonaje + 1;
        this.marco.cerrarMenu();
    }
    CerrarNuevoPersonaje() { this.NuevoPersonaje = 0; }

    abrirListado(value: any) {
        this.Listado = this.Listado > 10 ? 1 : this.Listado + 1;
        this.TipoListado = value.tipo;
        this.OperacionListado = value.operacion;
        this.marco.cerrarMenu();
    }
    CerrarListado() {
        this.Listado = 0;
        this.TipoListado = '';
        this.OperacionListado = '';
    }

    cerrarMenu(): void {
        this.marco.cerrarMenu();
    }

    /** El cajón se cierra solo (Esc o el fondo): el estado común se entera. */
    alCerrarCajon(): void {
        if (this.esMovil)
            this.marco.cerrarMenu();
    }
}
