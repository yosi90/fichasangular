import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { TipoPersonaje } from 'src/app/services/utils/tipo-personaje';

interface OpcionTipo {
    tipo: TipoPersonaje;
    titulo: string;
    subtitulo: string;
    icono: string;
    puntos: string[];
}

/**
 * Lo primero de la creación (lienzo de los dragones jugables, tablero 0; decisión del propietario del 2026-10-31): qué se
 * crea, «Personaje jugador» o «PNJ». Se elige con la tarjeta y se confirma con el botón; se puede cambiar hasta elegir la
 * raza, desde la cabecera.
 */
@Component({
    selector: 'app-creacion-tipo',
    template: `
        <div class="creacion-tipo">
            <div class="creacion-tipo__opciones" role="radiogroup" aria-label="Qué vas a crear">
                <button type="button" role="radio" class="creacion-tipo__opcion" *ngFor="let opcion of opciones"
                    [class.creacion-tipo__opcion--elegida]="opcion.tipo === seleccion" [attr.aria-checked]="opcion.tipo === seleccion"
                    (click)="seleccion = opcion.tipo">
                    <span class="creacion-tipo__cabeza">
                        <span class="creacion-tipo__icono" aria-hidden="true"><mat-icon>{{opcion.icono}}</mat-icon></span>
                        <span class="creacion-tipo__nombre">
                            <span class="creacion-tipo__titulo">{{opcion.titulo}}</span>
                            <span class="creacion-tipo__subtitulo">{{opcion.subtitulo}}</span>
                        </span>
                    </span>
                    <ul class="creacion-tipo__puntos">
                        <li *ngFor="let punto of opcion.puntos">{{punto}}</li>
                    </ul>
                </button>
            </div>
            <p class="creacion-tipo__nota">En una campaña, solo su máster puede crear PNJ en ella. Lo que elijas aquí se ve en la
                cabecera de la creación, en la ficha y en tu listado de personajes, y se puede cambiar hasta elegir la raza.</p>
            <div class="creacion-tipo__acciones">
                <button type="button" mat-raised-button color="primary" (click)="elegir.emit(seleccion)">
                    {{seleccion === 'pnj' ? 'Crear un PNJ' : 'Crear un personaje jugador'}}
                    <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                </button>
            </div>
        </div>`,
    standalone: false
})
export class CreacionTipoComponent implements OnChanges {
    /** Lo que ya estaba elegido (al volver desde «Cambiar»); sin elegir, personaje jugador. */
    @Input() tipo: TipoPersonaje | null = null;
    @Output() elegir = new EventEmitter<TipoPersonaje>();

    seleccion: TipoPersonaje = 'pj';

    readonly opciones: readonly OpcionTipo[] = [
        {
            tipo: 'pj',
            titulo: 'Personaje jugador',
            subtitulo: 'El personaje con el que juegas.',
            icono: 'person',
            puntos: [
                'Sigue las reglas de creación y, en una campaña, su política.',
                'Solo te ofrece lo que tu personaje puede elegir.',
                'Se mide por su nivel efectivo (NEP).',
                'Lo puedes compartir con tu campaña o hacerlo público.',
            ],
        },
        {
            tipo: 'pnj',
            titulo: 'PNJ',
            subtitulo: 'Un personaje no jugador, para el máster.',
            icono: 'workspace_premium',
            puntos: [
                'Aliados, enemigos y monstruos: un dragón adulto, un capitán de nivel 12.',
                'No sigue la política de creación de la campaña.',
                'Se mide por su valor de desafío (VD).',
                'Nace privado: tus jugadores no lo ven hasta que tú quieras.',
            ],
        },
    ];

    ngOnChanges(): void {
        this.seleccion = this.tipo ?? 'pj';
    }
}
