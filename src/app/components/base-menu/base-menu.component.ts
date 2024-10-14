import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SesionDialogComponent } from '../sesion-dialog/sesion-dialog.component';
import { UserService } from '../../services/user.service';
import { MatExpansionPanel } from '@angular/material/expansion';

@Component({
    selector: 'app-base-menu',
    templateUrl: './base-menu.component.html',
    styleUrls: ['./base-menu.component.sass']
})
export class BaseMenuComponent implements OnInit {
    @ViewChild('primero') primero!: MatExpansionPanel;
    @ViewChild('segundo') segundo!: MatExpansionPanel;
    @ViewChild('tercero') tercero!: MatExpansionPanel;
    @ViewChild('cuarto') cuarto!: MatExpansionPanel;

    usr: string = 'Invitado';

    constructor(public dSesion: MatDialog, private usrService: UserService) { }

    ngOnInit(): void {
        this.usrService.isLoggedIn$.subscribe(_ => {
            const nombre = this.usrService.Usuario.nombre;
            const correo = this.usrService.Usuario.correo;
            this.usr = nombre != '' ? nombre : correo != '' ? correo : 'Invitado';
        });

        const tokenViejo = localStorage.getItem('sesionFichas');
        if (tokenViejo)
            this.usrService.recuperarSesion(tokenViejo);
    }

    closeAcordion() {
        if (this.primero.expanded)
            this.primero.close();
        else if (this.segundo.expanded)
            this.segundo.close();
        else if (this.tercero.expanded)
            this.tercero.close();
        else if (this.cuarto.expanded)
            this.cuarto.close();
    }

    onMouseEnter(panel: number) {
        switch (panel) {
            case 1:
                this.primero.open();
                break;
            case 2:
                this.segundo.open();
                break;
            case 3:
                this.tercero.open();
                break;
            case 4:
                this.cuarto.open();
                break;
            default:
                break;
        }
    }

    @Output() NuevoPersonajeTab: EventEmitter<any> = new EventEmitter();
    AbrirNuevoPersonaje(): void {
        this.NuevoPersonajeTab.emit();
        this.closeAcordion();
    }

    @Output() ListadoTab: EventEmitter<{tipo: string, operacion: string}> = new EventEmitter();
    AbrirListado(tipo: string, operacion: string): void {
        this.ListadoTab.emit({tipo, operacion});
        this.closeAcordion();
    }

    openSesionDialog(): void {
        this.closeAcordion();
        const dialogRef = this.dSesion.open(SesionDialogComponent, {
            // width: '80vw',
            // height: '70vh'
            // msg: {name: this.name, animal: this.animal}
        });

        dialogRef.afterClosed().subscribe(result => {
            //hacer algo cuando se cierra el modal, si quieres claro..
        });
    }

    logOut() {
        this.usrService.logOut()
            ?.then(response => {
                console.log(response);
            })
            .catch(error => console.log(error));
    }

}
