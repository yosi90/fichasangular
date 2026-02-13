import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SesionDialogComponent } from '../../sesion-dialog/sesion-dialog.component';
import { UserService } from '../../../services/user.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ConnectedPosition } from '@angular/cdk/overlay';

type SeccionOtros = 'insertar' | 'modificar' | 'detalles';

@Component({
    selector: 'app-base-menu',
    templateUrl: './base-menu.component.html',
    styleUrls: ['./base-menu.component.sass']
})
export class BaseMenuComponent implements OnInit, OnDestroy {
    @ViewChild('primero') primero!: MatExpansionPanel;
    @ViewChild('segundo') segundo!: MatExpansionPanel;
    @ViewChild('tercero') tercero!: MatExpansionPanel;
    @ViewChild('cuarto') cuarto!: MatExpansionPanel;

    usr: string = 'Invitado';
    otrosAbierto: SeccionOtros | null = null;
    private timerCierreOtros: ReturnType<typeof setTimeout> | null = null;
    readonly posicionesOtros: ConnectedPosition[] = [
        { originX: 'end', overlayX: 'start', originY: 'top', overlayY: 'top', offsetX: 4 },
        { originX: 'end', overlayX: 'start', originY: 'bottom', overlayY: 'bottom', offsetX: 4 },
        { originX: 'start', overlayX: 'end', originY: 'top', overlayY: 'top', offsetX: -4 },
    ];

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

    ngOnDestroy(): void {
        this.cancelarCierreOtros();
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

    abrirOtros(seccion: SeccionOtros) {
        this.cancelarCierreOtros();
        this.otrosAbierto = seccion;
    }

    toggleOtros(seccion: SeccionOtros, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.cancelarCierreOtros();
        this.otrosAbierto = this.otrosAbierto === seccion ? null : seccion;
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
        this.NuevoPersonajeTab.emit();
    }

    @Output() ListadoTab: EventEmitter<{ tipo: string, operacion: string }> = new EventEmitter();
    AbrirListado(tipo: string, operacion: string): void {
        this.ListadoTab.emit({ tipo, operacion });
    }

    openSesionDialog(): void {
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
