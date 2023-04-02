import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SesionDialogComponent } from '../@Utilidades/sesion-dialog/sesion-dialog.component';
import { UserService } from '../services/user.service';

@Component({
    selector: 'app-cont-principal',
    templateUrl: './cont-principal.component.html',
    styleUrls: ['./cont-principal.component.sass']
})
export class ContPrincipalComponent {

    constructor(public dSesion: MatDialog, private usrService: UserService) { }

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

    logOut() {
        this.usrService.logOut()
            .then(response => {
                console.log(response);
                //Cargarnos el localStorage
                //Cambiar el usuario a invitado
            })
            .catch(error => console.log(error));
    }
}