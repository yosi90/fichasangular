import { Component, OnDestroy } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { MarcoMovilService } from 'src/app/services/marco-movil.service';

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
    private readonly suscripcion: Subscription;

    constructor(private marco: MarcoMovilService) {
        this.suscripcion = combineLatest([marco.esMovil$, marco.menuAbierto$]).subscribe(([movil, abierto]) => {
            this.esMovil = movil;
            this.menuAbierto = abierto;
        });
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
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
