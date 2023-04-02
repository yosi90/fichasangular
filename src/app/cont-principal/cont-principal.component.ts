import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SesionDialogComponent } from '../@Utilidades/sesion-dialog/sesion-dialog.component';

@Component({
    selector: 'app-cont-principal',
    templateUrl: './cont-principal.component.html',
    styleUrls: ['./cont-principal.component.sass']
})
export class ContPrincipalComponent {

    constructor(public dSesion: MatDialog) { }

    openSesionDialog(): void {
        const dialogRef = this.dSesion.open(SesionDialogComponent, {
            // width: '80vw',
            // height: '70vh'
            // msg: {name: this.name, animal: this.animal}
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('Ves esto porque se cerró el modal de login.\nAhora tienes que actualizar la vista de la app con los datos del usuario');
        });
    }
}