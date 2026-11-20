import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ClaseDelNivel } from 'src/app/components/sesiones/pasos-con-selectores';
import { Clase } from 'src/app/interfaces/clase';

/**
 * El paso «Clase» de un nivel que se gana (la lista de `clasesParaElNivel`): una fila por clase con su siguiente nivel y
 * «Elegir»; las que no puede tomar, atenuadas con su motivo; las que solo impide su alineamiento, con el motivo y «Elegir
 * igualmente» (`warn`), y «Homebrew» si lo es. La usan la subida de nivel y la vuelta a la vida sin ningún DG; lo que pasa
 * al elegir (y el aviso de homebrew) es de cada pantalla (`elegida`).
 */
@Component({
    selector: 'app-clases-del-nivel',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './clases-del-nivel.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
})
export class ClasesDelNivelComponent {
    @Input({ required: true }) clases: readonly ClaseDelNivel[] = [];
    @Input() titulo = 'Elige la clase de este nivel';
    @Input() nota = 'Una de las que ya tiene o una nueva a nivel 1. Las que no puede tomar dicen por qué.';
    /** Mientras se guarda o se aplica otra, no se elige. */
    @Input() deshabilitado = false;
    @Output() elegida = new EventEmitter<Clase>();
}
