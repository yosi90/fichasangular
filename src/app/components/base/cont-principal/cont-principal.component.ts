import { Component } from '@angular/core';

@Component({
    selector: 'app-cont-principal',
    templateUrl: './cont-principal.component.html',
    styleUrls: ['./cont-principal.component.sass'],
})
export class ContPrincipalComponent {
    NuevoPersonaje: number = 0;
    Listado: number = 0;

    TipoListado: string = '';
    OperacionListado: string = '';

    AbrirNuevoPersonaje() {
        this.NuevoPersonaje = this.NuevoPersonaje > 10 ? 1 : this.NuevoPersonaje + 1;
    }
    CerrarNuevoPersonaje() { this.NuevoPersonaje = 0; }

    abrirListado(value: any) {
        this.Listado = this.Listado > 10 ? 1 : this.Listado + 1;
        this.TipoListado = value.tipo;
        this.OperacionListado = value.operacion;
    }
    CerrarListado() { 
        this.Listado = 0;
        this.TipoListado = ''; 
        this.OperacionListado = '';
    }
}