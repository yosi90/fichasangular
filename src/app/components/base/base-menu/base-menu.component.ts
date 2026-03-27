import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SesionDialogComponent } from '../../sesion-dialog/sesion-dialog.component';
import { UserService } from '../../../services/user.service';
import { UserProfileNavigationService } from '../../../services/user-profile-navigation.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ConnectedPosition } from '@angular/cdk/overlay';

type SeccionOtros = 'insertar' | 'modificar' | 'detalles';
type PermissionAction = 'create' | 'update';

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

    usr: string = 'Invitado';
    otrosAbierto: SeccionOtros | null = null;
    private timerCierreOtros: ReturnType<typeof setTimeout> | null = null;
    readonly posicionesOtros: ConnectedPosition[] = [
        { originX: 'end', overlayX: 'start', originY: 'top', overlayY: 'top', offsetX: 4 },
        { originX: 'end', overlayX: 'start', originY: 'bottom', overlayY: 'bottom', offsetX: 4 },
        { originX: 'start', overlayX: 'end', originY: 'top', overlayY: 'top', offsetX: -4 },
    ];

    constructor(
        public dSesion: MatDialog,
        private usrService: UserService,
        private userProfileNavSvc: UserProfileNavigationService
    ) { }

    ngOnInit(): void {
        this.usrService.isLoggedIn$.subscribe(_ => {
            const nombre = this.usrService.Usuario.nombre;
            const correo = this.usrService.Usuario.correo;
            this.usr = nombre != '' ? nombre : correo != '' ? correo : 'Invitado';
        });
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

    get mensajePermisosInsuficientes(): string {
        return this.usrService.getPermissionDeniedMessage();
    }

    canGestionar(resource: string, action: PermissionAction): boolean {
        return this.usrService.can(resource, action);
    }

    canInsertarDotes(): boolean {
        return this.usrService.can('dotes', 'create');
    }

    canInsertarConjuros(): boolean {
        return this.usrService.can('conjuros', 'create');
    }

    onInsertarDote(): void {
        if (!this.canInsertarDotes())
            return;
        this.AbrirListado('dotes', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
    }

    onInsertarConjuro(): void {
        if (!this.canInsertarConjuros())
            return;
        this.AbrirListado('conjuros', 'insertar');
        this.closeAcordion();
        this.cerrarOtros();
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
        void this.usrService.logOut()?.catch(() => undefined);
    }

    abrirMiPerfil(): void {
        if (this.usr === 'Invitado')
            return;
        this.userProfileNavSvc.openPrivateProfile();
        this.closeAcordion();
        this.cerrarOtros();
    }

    abrirSocial(): void {
        this.userProfileNavSvc.openSocial('resumen');
        this.closeAcordion();
        this.cerrarOtros();
    }

    abrirAdminPanel(): void {
        if (!this.esAdmin)
            return;
        this.userProfileNavSvc.openAdminPanel();
        this.closeAcordion();
        this.cerrarOtros();
    }

    get esAdmin(): boolean {
        return this.usrService.Usuario.permisos === 1;
    }

}
