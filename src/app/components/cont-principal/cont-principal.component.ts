import { Component } from '@angular/core';

@Component({
    selector: 'app-cont-principal',
    templateUrl: './cont-principal.component.html',
    styleUrls: ['./cont-principal.component.sass'],
})
export class ContPrincipalComponent {
    NuevoPersonaje: number = 0;

    AbrirNuevoPersonaje() { this.NuevoPersonaje++; }
    CerrarNuevoPersonaje() { this.NuevoPersonaje = 0; }
}