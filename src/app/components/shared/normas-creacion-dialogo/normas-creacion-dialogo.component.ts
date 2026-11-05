import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatosVentanaNormas, NormasCreacionError, NormasDeRol } from 'src/app/interfaces/normas-rol';

/**
 * La ventana de Rol con sus normas para crear (decisión 5 de la ronda de mejoras de noviembre): qué son, por qué se piden
 * ahora, que sin aceptarlas se puede seguir usando Rol, y el texto vigente. Cierra con `true` si se aceptan (con los
 * tokens ya renovados) y con `false` o nada si la persona dice «Ahora no», pulsa fuera o Escape.
 */
@Component({
    selector: 'app-normas-creacion-dialogo',
    templateUrl: './normas-creacion-dialogo.component.html',
    styleUrls: ['./normas-creacion-dialogo.component.sass'],
    // Sin encapsular: la superficie de la ventana la pinta Material en el overlay. Todo va bajo `.normas-creacion-panel`.
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class NormasCreacionDialogoComponent implements OnInit {
    normas: NormasDeRol | null = null;
    cargando = false;
    errorCarga = '';
    aceptando = false;
    errorAceptar = '';

    constructor(
        private ventana: MatDialogRef<NormasCreacionDialogoComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) private datos: DatosVentanaNormas,
    ) { }

    ngOnInit(): void {
        void this.cargar();
    }

    async cargar(): Promise<void> {
        this.cargando = true;
        this.errorCarga = '';
        try {
            this.normas = await this.datos.leer();
        } catch (error) {
            this.normas = null;
            this.errorCarga = error instanceof NormasCreacionError ? error.message : 'No se han podido leer las normas de Rol.';
        } finally {
            this.cargando = false;
        }
    }

    async aceptar(): Promise<void> {
        const normas = this.normas;
        if (!normas || this.aceptando)
            return;
        this.aceptando = true;
        this.errorAceptar = '';
        this.ventana.disableClose = true;
        try {
            await this.datos.aceptar(normas.id);
            this.ventana.close(true);
        } catch (error) {
            this.errorAceptar = error instanceof NormasCreacionError ? error.message : 'No se ha podido guardar que aceptas las normas.';
            // Si han cambiado mientras se leían, se enseñan las nuevas.
            if (error instanceof NormasCreacionError && error.code === 'normas_no_vigentes')
                await this.cargar();
        } finally {
            this.aceptando = false;
            this.ventana.disableClose = false;
        }
    }

    ahoraNo(): void {
        if (!this.aceptando)
            this.ventana.close(false);
    }
}
